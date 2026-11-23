// Envoi des notifications push du centre de notifications (réponses du forum,
// abonnement, rappels officiels de produits, annonces, organisation du foyer).
// Déclenchement : Database Webhook sur INSERT public.notifications, ET tâche planifiée (toutes les 15 min)
// qui envoie les notifications différées par les heures calmes.
// Les rappels personnels (biberon, rendez-vous…) sont des notifications LOCALES
// programmées sur le téléphone : ils fonctionnent sans réseau.
// Règles (HOMI_NOTIFICATION_RULES.md, _shared/push-rules.ts) :
//  - heures calmes du destinataire appliquées ICI (push_quiet_until) : non urgente → différée (deliver_after) ;
//  - écran verrouillé : texte générique sauf accord explicite (notification_settings.lockscreen_details) ;
//  - l'envoi ne touche jamais read_at : une notification n'est jamais considérée comme lue.
import { adminClient, env, json, safeEqual } from '../_shared/http.ts';
import { channelFor, lockScreenText, planDelivery, pushCategory, pushData, quietUntilOnLookupError, type PushRow } from '../_shared/push-rules.ts';

type Row = PushRow & { deliver_after: string | null };

Deno.serve(async (req) => {
  // Protégé par un secret partagé (en-tête du Database Webhook)
  if (!safeEqual(req.headers.get('x-webhook-secret') ?? '', env('PUSH_WEBHOOK_SECRET'))) return json({ error: 'unauthorized' }, 401);
  const admin = adminClient();
  const now = new Date();

  // À envoyer : jamais envoyées, dont l'heure d'envoi est venue (report des heures calmes : 24 h au plus)
  const { data: pending } = await admin
    .from('notifications')
    .select('id,user_id,title,body,deep_link,category,urgent,deliver_after,payload')
    .is('pushed_at', null)
    .or(`deliver_after.is.null,deliver_after.lte.${now.toISOString()}`)
    .gt('created_at', new Date(now.getTime() - 48 * 3600 * 1000).toISOString())
    .limit(500);
  const due = (pending ?? []) as Row[];
  if (!due.length) return json({ sent: 0, deferred: 0 });

  // Heures calmes : calculées par le serveur (fuseau et réglages de chaque destinataire)
  const quietOf = new Map<string, string | null>();
  for (const uid of new Set(due.filter((r) => !r.urgent).map((r) => r.user_id))) {
    const { data, error } = await admin.rpc('push_quiet_until', { p_user: uid, p_at: now.toISOString() });
    // Échec du calcul : jamais d'envoi « par défaut » pendant d'éventuelles heures calmes (nouvel essai différé)
    quietOf.set(uid, error ? quietUntilOnLookupError(now) : ((data as string | null) ?? null));
  }
  const toDefer = new Map<string, string[]>();
  const candidates: Row[] = [];
  for (const r of due) {
    const plan = planDelivery(r, quietOf.get(r.user_id));
    if (plan.action === 'defer') toDefer.set(plan.until, [...(toDefer.get(plan.until) ?? []), r.id]);
    else candidates.push(r);
  }
  for (const [until, ids] of toDefer) {
    await admin.from('notifications').update({ deliver_after: until }).in('id', ids).is('pushed_at', null);
  }
  const deferred = [...toDefer.values()].reduce((n, ids) => n + ids.length, 0);
  if (!candidates.length) return json({ sent: 0, deferred });

  // Réservation atomique AVANT l'envoi : deux appels simultanés ne peuvent plus envoyer la même
  // notification (seule la ligne encore « non envoyée » est réservée par un seul appel).
  const { data: claimed } = await admin.from('notifications').update({ pushed_at: new Date().toISOString() })
    .in('id', candidates.map((r) => r.id)).is('pushed_at', null).select('id');
  const claimedIds = new Set((claimed ?? []).map((c: { id: string }) => c.id));
  const rows = candidates.filter((r) => claimedIds.has(r.id));
  if (!rows.length) return json({ sent: 0, deferred });

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: devices } = await admin.from('push_devices').select('user_id,expo_push_token').in('user_id', userIds);
  // Langue de chaque destinataire (profiles.locale, 5 langues) : textes génériques d'écran verrouillé traduits
  const { data: profs } = await admin.from('profiles').select('id,locale').in('id', userIds);
  const langOf = new Map<string, string>((profs ?? []).map((p: { id: string; locale: string | null }) => [p.id, p.locale ?? 'fr']));
  // Détail sur l'écran verrouillé : seulement avec l'accord explicite de la personne
  const { data: settings } = await admin.from('notification_settings').select('user_id,lockscreen_details').in('user_id', userIds);
  const detailsOf = new Map<string, boolean>((settings ?? []).map((s: { user_id: string; lockscreen_details: boolean }) => [s.user_id, s.lockscreen_details === true]));
  const tokensByUser = new Map<string, string[]>();
  for (const d of devices ?? []) tokensByUser.set(d.user_id, [...(tokensByUser.get(d.user_id) ?? []), d.expo_push_token]);

  const messages = rows.flatMap((r) =>
    (tokensByUser.get(r.user_id) ?? []).map((to) => ({
      to,
      // Écran verrouillé : ni pseudonyme, ni nom de groupe, ni nom de produit, ni contenu ; le détail
      // s'affiche dans l'application (ou sur l'écran verrouillé si la personne l'a choisi).
      ...lockScreenText(r, langOf.get(r.user_id), detailsOf.get(r.user_id) ?? false),
      sound: 'default',
      priority: r.urgent ? 'high' : 'default',
      channelId: channelFor(r),
      // Nouvelle mission avec détail visible : boutons « J'accepte » / « Je ne peux pas » (catégorie enregistrée par l'application)
      ...(pushCategory(r, detailsOf.get(r.user_id) ?? false) ? { categoryId: pushCategory(r, detailsOf.get(r.user_id) ?? false) } : {}),
      data: pushData(r),
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
  return json({ sent: messages.length, deferred, removed_tokens: invalid.length });
});
