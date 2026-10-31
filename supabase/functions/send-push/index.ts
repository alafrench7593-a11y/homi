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
  const rows = (pending ?? []) as Row[];
  if (!rows.length) return json({ sent: 0 });

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: devices } = await admin.from('push_devices').select('user_id,expo_push_token').in('user_id', userIds);
  const tokensByUser = new Map<string, string[]>();
  for (const d of devices ?? []) tokensByUser.set(d.user_id, [...(tokensByUser.get(d.user_id) ?? []), d.expo_push_token]);

  const messages = rows.flatMap((r) =>
    (tokensByUser.get(r.user_id) ?? []).map((to) => ({
      to,
      // Écran verrouillé : ni pseudonyme, ni nom de groupe (un groupe peut révéler un sujet de santé),
      // ni contenu de conversation ; le détail s'affiche dans l'application.
      // Rappel de produit : le nom du produit (ex. un lait infantile) peut révéler une naissance.
      title: r.category.startsWith('community') ? 'Nouvelle activité dans la communauté'
        : r.category === 'product_recall' ? 'Alerte sur un produit enregistré' : r.title,
      body: r.category.startsWith('community') ? 'Ouvrez l’application pour lire le message.'
        : r.category === 'product_recall' ? 'Ouvrez l’application pour voir le détail du rappel.' : r.body ?? undefined,
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
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(Deno.env.get('EXPO_ACCESS_TOKEN') ? { Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}` } : {}) },
      body: JSON.stringify(chunk),
    });
    const out = await res.json().catch(() => ({}));
    (out.data ?? []).forEach((t: { status: string; details?: { error?: string } }, j: number) => {
      if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') invalid.push(chunk[j].to);
    });
  }
  if (invalid.length) await admin.from('push_devices').delete().in('expo_push_token', invalid);
  await admin.from('notifications').update({ pushed_at: new Date().toISOString() }).in('id', rows.map((r) => r.id));
  return json({ sent: messages.length, removed_tokens: invalid.length });
});
