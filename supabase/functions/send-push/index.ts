// Envoi des notifications push du centre de notifications (réponses du forum,
// abonnement, rappels officiels de produits, annonces).
// Déclenchement : Database Webhook sur INSERT public.notifications, ou tâche planifiée.
// Les rappels personnels (biberon, rendez-vous…) sont des notifications LOCALES
// programmées sur le téléphone : ils fonctionnent sans réseau.
import { adminClient, env, json, safeEqual } from '../_shared/http.ts';

type Row = { id: string; user_id: string; title: string; body: string | null; deep_link: string | null; category: string };

Deno.serve(async (req) => {
  // Protégé par un secret partagé (en-tête du Database Webhook)
  if (!safeEqual(req.headers.get('x-webhook-secret') ?? '', env('PUSH_WEBHOOK_SECRET'))) return json({ error: 'unauthorized' }, 401);
  const admin = adminClient();

  const { data: pending } = await admin
    .from('notifications')
    .select('id,user_id,title,body,deep_link,category')
    .is('pushed_at', null)
    .gt('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .limit(500);
  const candidates = (pending ?? []) as Row[];
  if (!candidates.length) return json({ sent: 0 });
  // Réservation atomique AVANT l'envoi : deux appels simultanés ne peuvent plus envoyer la même
  // notification (seule la ligne encore « non envoyée » est réservée par un seul appel).
  const { data: claimed } = await admin.from('notifications').update({ pushed_at: new Date().toISOString() })
    .in('id', candidates.map((r) => r.id)).is('pushed_at', null).select('id');
  const claimedIds = new Set((claimed ?? []).map((c: { id: string }) => c.id));
  const rows = candidates.filter((r) => claimedIds.has(r.id));
  if (!rows.length) return json({ sent: 0 });

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: devices } = await admin.from('push_devices').select('user_id,expo_push_token').in('user_id', userIds);
  // Langue de chaque destinataire (profiles.locale, 5 langues) : textes génériques d'écran verrouillé traduits
  const { data: profs } = await admin.from('profiles').select('id,locale').in('id', userIds);
  const langOf = new Map<string, string>((profs ?? []).map((p: { id: string; locale: string | null }) => [p.id, p.locale ?? 'fr']));
  const tokensByUser = new Map<string, string[]>();
  for (const d of devices ?? []) tokensByUser.set(d.user_id, [...(tokensByUser.get(d.user_id) ?? []), d.expo_push_token]);

  const messages = rows.flatMap((r) =>
    (tokensByUser.get(r.user_id) ?? []).map((to) => ({
      to,
      // Écran verrouillé : ni pseudonyme, ni nom de groupe (un groupe peut révéler un sujet de santé),
      // ni contenu de conversation ; le détail s'affiche dans l'application.
      // Rappel de produit : le nom du produit (ex. un lait infantile) peut révéler une naissance.
      title: r.category.startsWith('community') ? pushText(langOf.get(r.user_id), 'communityTitle')
        : r.category === 'product_recall' ? pushText(langOf.get(r.user_id), 'recallTitle') : r.title,
      body: r.category.startsWith('community') ? pushText(langOf.get(r.user_id), 'communityBody')
        : r.category === 'product_recall' ? pushText(langOf.get(r.user_id), 'recallBody') : r.body ?? undefined,
      sound: 'default',
      channelId: r.category === 'product_recall' ? 'alerts' : 'community',
      data: { url: r.deep_link ?? '/notifications', notificationId: r.id },
    })),
  );

  const invalid: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(Deno.env.get('EXPO_ACCESS_TOKEN') ? { Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}` } : {}) },
      body: JSON.stringify(chunk),
    }).catch(() => null);
    if (!res || !res.ok) {
      // Échec d'envoi : ces notifications redeviennent « à envoyer » pour le prochain passage
      const ids = [...new Set(chunk.map((m) => m.data.notificationId))];
      await admin.from('notifications').update({ pushed_at: null }).in('id', ids);
      continue;
    }
    const out = await res.json().catch(() => ({}));
    (out.data ?? []).forEach((t: { status: string; details?: { error?: string } }, j: number) => {
      if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') invalid.push(chunk[j].to);
    });
  }
  if (invalid.length) await admin.from('push_devices').delete().in('expo_push_token', invalid);
  return json({ sent: messages.length, removed_tokens: invalid.length });
});

/** Textes génériques des notifications (écran verrouillé, sans contenu sensible), dans la langue du destinataire. */
const PUSH_TEXTS: Record<string, Record<'communityTitle' | 'communityBody' | 'recallTitle' | 'recallBody', string>> = {
  fr: { communityTitle: 'Nouvelle activité dans la communauté', communityBody: 'Ouvrez l’application pour lire le message.', recallTitle: 'Alerte sur un produit enregistré', recallBody: 'Ouvrez l’application pour voir le détail du rappel.' },
  en: { communityTitle: 'New activity in the community', communityBody: 'Open the app to read the message.', recallTitle: 'Alert about a saved product', recallBody: 'Open the app to see the recall details.' },
  es: { communityTitle: 'Nueva actividad en la comunidad', communityBody: 'Abre la aplicación para leer el mensaje.', recallTitle: 'Alerta sobre un producto guardado', recallBody: 'Abre la aplicación para ver los detalles de la retirada.' },
  de: { communityTitle: 'Neue Aktivität in der Community', communityBody: 'Öffne die App, um die Nachricht zu lesen.', recallTitle: 'Warnung zu einem gespeicherten Produkt', recallBody: 'Öffne die App, um die Details des Rückrufs zu sehen.' },
  it: { communityTitle: 'Nuova attività nella community', communityBody: 'Apri l’app per leggere il messaggio.', recallTitle: 'Avviso su un prodotto salvato', recallBody: 'Apri l’app per vedere i dettagli del richiamo.' },
};
function pushText(lang: string | undefined, key: 'communityTitle' | 'communityBody' | 'recallTitle' | 'recallBody'): string {
  return (PUSH_TEXTS[lang ?? 'fr'] ?? PUSH_TEXTS.fr)[key];
}
