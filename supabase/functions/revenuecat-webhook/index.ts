// Webhook RevenueCat -> table `subscriptions` (seule source de vérité des droits premium).
// Configuration RevenueCat : URL = <projet>/functions/v1/revenuecat-webhook,
// en-tête Authorization = « Bearer <REVENUECAT_WEBHOOK_SECRET> ».
// L'identifiant RevenueCat (appUserID) est l'identifiant Supabase de l'utilisateur.
import { adminClient, env, json } from '../_shared/http.ts';
import { isStale, subscriptionFromEvent, type RcEvent } from '../_shared/revenuecat.ts';

const ENTITLEMENT = Deno.env.get('REVENUECAT_ENTITLEMENT') ?? 'premium';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const secret = env('REVENUECAT_WEBHOOK_SECRET');
  const header = req.headers.get('Authorization') ?? '';
  if (!timingSafeEqual(header, `Bearer ${secret}`)) return json({ error: 'unauthorized' }, 401);

  let event: RcEvent;
  try {
    event = (await req.json()).event;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!event?.type) return json({ error: 'bad_request' }, 400);
  if (event.type === 'TEST') return json({ ok: true, test: true });

  const userId = [event.app_user_id, event.original_app_user_id].find((id) => id && UUID.test(id));
  if (!userId) return json({ ok: true, ignored: 'anonymous_user' }); // achat avant connexion : rattaché lors du logIn

  // Source de vérité : l'API RevenueCat si une clé secrète est configurée
  let expiresAt = event.expiration_at_ms ?? null;
  let productId = event.product_id ?? null;
  const rcKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (rcKey) {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${rcKey}` },
    });
    if (res.ok) {
      const ent = (await res.json())?.subscriber?.entitlements?.[ENTITLEMENT];
      if (ent) {
        expiresAt = ent.expires_date ? Date.parse(ent.expires_date) : null;
        productId = ent.product_identifier ?? productId;
      }
    }
  }

  const admin = adminClient();
  const { data: current } = await admin.from('subscriptions').select('last_event_at').eq('user_id', userId).maybeSingle();
  if (isStale(event, current?.last_event_at)) return json({ ok: true, ignored: 'stale_event' });
  const { error } = await admin.from('subscriptions').upsert({
    user_id: userId,
    ...subscriptionFromEvent(event, expiresAt, productId, ENTITLEMENT),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error('subscription_upsert_error', error.code);
    return json({ error: 'server_error' }, 500); // RevenueCat réessaiera
  }

  const notice: Record<string, [string, string]> = {
    BILLING_ISSUE: ['Problème de paiement', 'Votre abonnement n’a pas pu être renouvelé. Vérifiez votre moyen de paiement dans la boutique.'],
    EXPIRATION: ['Abonnement terminé', 'Votre abonnement a pris fin. Vos données et les fonctions essentielles restent disponibles.'],
    CANCELLATION: ['Renouvellement désactivé', 'Votre abonnement reste actif jusqu’à sa date d’échéance.'],
  };
  if (notice[event.type]) {
    await admin.from('notifications').insert({
      user_id: userId, category: 'subscription', title: notice[event.type][0], body: notice[event.type][1], deep_link: '/settings/subscription',
    });
  }
  return json({ ok: true });
});
