// Premium Famille : reconnaissance du droit AU_FIL_DE_NOUS_FAMILLE et du produit aufildenous_family_monthly par le
// webhook RevenueCat et par subscription-sync (sans réseau : base en mémoire, API RevenueCat simulée).
// Lancer : deno test --no-check --allow-env supabase/functions/_tests/famille_webhook_test.ts
import { handleSync, handleWebhook, type RevenueCatApi, type StoredRow, type SubscriptionDb } from '../_shared/subscription-run.ts';
import {
  FAMILY_ENTITLEMENT, grantsFromSubscriber, isFamilyProduct, pickPremiumEntitlement, subscriptionFromEvent, subscriptionFromSubscriber,
  type RcSubscriberBody,
} from '../_shared/revenuecat.ts';

function assertEquals(a: unknown, b: unknown, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}

const PREMIUM = 'AU_FIL_DE_NOUS_PREMIUM';
const SECRET = 'secret-de-test';
const U1 = '11111111-1111-4111-8111-111111111111';
const NOW = Date.parse('2026-11-13T10:00:00Z');
const DAY = 86_400_000;

function memoryDb() {
  const rows = new Map<string, StoredRow>();
  const grants: unknown[] = [];
  const db: SubscriptionDb = {
    read: (id) => Promise.resolve(rows.has(id) ? { ...rows.get(id)! } : null),
    write: (row) => { rows.set(row.user_id, { ...(rows.get(row.user_id) ?? {}), ...row }); return Promise.resolve(true); },
    notify: () => Promise.resolve(),
    locale: () => Promise.resolve(null),
    premium: (id) => Promise.resolve(!!rows.get(id) && ['trial', 'active', 'grace', 'cancelled', 'paused'].includes(String(rows.get(id)!.status))),
    writeGrants: (_id, g) => { grants.push(...g); return Promise.resolve(true); },
  };
  return { db, rows, grants };
}

const api = (body: RcSubscriberBody): RevenueCatApi => ({
  subscriber: () => Promise.resolve({ ok: true, body }),
  remove: () => Promise.resolve({ ok: true, status: 200 }),
});

/** Fiche abonné : droits donnés → produit et échéance. */
function subscriber(ents: Record<string, { product: string; expires: number; refunded?: boolean }>): RcSubscriberBody {
  const entitlements: NonNullable<RcSubscriberBody['subscriber']>['entitlements'] = {};
  const subscriptions: NonNullable<RcSubscriberBody['subscriber']>['subscriptions'] = {};
  for (const [name, e] of Object.entries(ents)) {
    entitlements[name] = { expires_date: new Date(e.expires).toISOString(), product_identifier: e.product, purchase_date: new Date(NOW - DAY).toISOString() };
    subscriptions[e.product.split(':')[0]] = {
      expires_date: new Date(e.expires).toISOString(), purchase_date: new Date(NOW - DAY).toISOString(), original_purchase_date: '2026-11-01T09:00:00Z',
      period_type: 'normal', store: 'app_store', is_sandbox: true, refunded_at: e.refunded ? new Date(NOW).toISOString() : null,
    };
  }
  return { subscriber: { entitlements, subscriptions } };
}

const req = (event: Record<string, unknown>) =>
  new Request('http://local/revenuecat-webhook', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ api_version: '1.0', event }) });
const ev = (type: string, extra: Record<string, unknown> = {}) => ({
  type, id: crypto.randomUUID(), app_user_id: U1, original_app_user_id: U1, product_id: 'aufildenous_family_monthly', entitlement_ids: [FAMILY_ENTITLEMENT],
  store: 'APP_STORE', environment: 'SANDBOX', period_type: 'NORMAL', event_timestamp_ms: NOW, expiration_at_ms: NOW + 30 * DAY, ...extra,
});
const hook = (db: SubscriptionDb, a: RevenueCatApi | null = null) => (r: Request) => handleWebhook(r, { secret: SECRET, entitlement: PREMIUM, api: a, db, now: () => NOW });

Deno.test('famille : produit reconnu (App Store, Google Play « abonnement:offre »), Premium Individuel non', () => {
  assertEquals([isFamilyProduct('aufildenous_family_monthly'), isFamilyProduct('aufildenous_family_monthly:mensuel'), isFamilyProduct('AUFILDENOUS_FAMILY_MONTHLY')], [true, true, true]);
  assertEquals([isFamilyProduct('aufildenous_premium_monthly'), isFamilyProduct(null), isFamilyProduct('')], [false, false, false]);
});

Deno.test('famille : achat avec SEUL le droit Famille → ligne « AU_FIL_DE_NOUS_FAMILLE », jamais ignoré comme « autre droit »', async () => {
  const { db, rows, grants } = memoryDb();
  const out = await (await hook(db)(req(ev('INITIAL_PURCHASE', { purchased_at_ms: NOW, price_in_purchased_currency: 15.99, currency: 'EUR' })))).json();
  assertEquals(out, { ok: true, status: 'active' });
  const r = rows.get(U1)!;
  assertEquals([r.entitlement, r.product_id, r.status, r.period_type, r.price, r.currency], [FAMILY_ENTITLEMENT, 'aufildenous_family_monthly', 'active', 'monthly', 15.99, 'EUR']);
  assertEquals(grants.length, 0, 'aucun droit Famille recopié dans entitlement_grants');
});

Deno.test('famille : produit Famille portant aussi le droit Premium → ligne Famille', () => {
  const row = subscriptionFromEvent(ev('INITIAL_PURCHASE', { entitlement_ids: [PREMIUM, FAMILY_ENTITLEMENT] }) as never, NOW + 30 * DAY, 'aufildenous_family_monthly', PREMIUM, NOW);
  assertEquals([row.entitlement, row.status], [FAMILY_ENTITLEMENT, 'active']);
  const premiumOnly = subscriptionFromEvent(ev('INITIAL_PURCHASE', { entitlement_ids: [PREMIUM], product_id: 'aufildenous_premium_monthly' }) as never, NOW + 30 * DAY, 'aufildenous_premium_monthly', PREMIUM, NOW);
  assertEquals(premiumOnly.entitlement, PREMIUM, 'le Premium Individuel reste Individuel');
});

Deno.test('famille : passage Premium → Famille (PRODUCT_CHANGE, API) puis retour à Premium à l’échéance', async () => {
  const { db, rows } = memoryDb();
  await hook(db, api(subscriber({ [PREMIUM]: { product: 'aufildenous_premium_monthly', expires: NOW + 20 * DAY } })))(req(ev('INITIAL_PURCHASE', { product_id: 'aufildenous_premium_monthly', entitlement_ids: [PREMIUM] })));
  assertEquals(rows.get(U1)!.entitlement, PREMIUM);
  // Changement immédiat dans le même groupe d'abonnements : la fiche montre les deux droits, Famille actif
  const both = subscriber({ [PREMIUM]: { product: 'aufildenous_family_monthly', expires: NOW + 30 * DAY }, [FAMILY_ENTITLEMENT]: { product: 'aufildenous_family_monthly', expires: NOW + 30 * DAY } });
  await hook(db, api(both))(req(ev('PRODUCT_CHANGE', { event_timestamp_ms: NOW + 1000, product_id: 'aufildenous_premium_monthly', new_product_id: 'aufildenous_family_monthly', entitlement_ids: [PREMIUM] })));
  assertEquals([rows.get(U1)!.entitlement, rows.get(U1)!.product_id, rows.get(U1)!.status], [FAMILY_ENTITLEMENT, 'aufildenous_family_monthly', 'active']);
  // Retour au Premium Individuel (différé par la boutique) : à l'échéance, la fiche ne montre plus que le Premium
  const back = subscriber({ [PREMIUM]: { product: 'aufildenous_premium_monthly', expires: NOW + 60 * DAY }, [FAMILY_ENTITLEMENT]: { product: 'aufildenous_family_monthly', expires: NOW - 1 } });
  await hook(db, api(back))(req(ev('RENEWAL', { event_timestamp_ms: NOW + 30 * DAY, product_id: 'aufildenous_premium_monthly', entitlement_ids: [PREMIUM] })));
  assertEquals([rows.get(U1)!.entitlement, rows.get(U1)!.product_id], [PREMIUM, 'aufildenous_premium_monthly']);
});

Deno.test('famille : résiliation, remboursement et expiration traités comme le Premium', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE')));
  await hook(db)(req(ev('CANCELLATION', { cancel_reason: 'UNSUBSCRIBE', event_timestamp_ms: NOW + 1000 })));
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.will_renew, rows.get(U1)!.entitlement], ['cancelled', false, FAMILY_ENTITLEMENT]);
  await hook(db)(req(ev('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT', event_timestamp_ms: NOW + 2000 })));
  assertEquals([rows.get(U1)!.status, !!rows.get(U1)!.refunded_at], ['refunded', true]);
  await hook(db)(req(ev('EXPIRATION', { expiration_reason: 'UNSUBSCRIBE', expiration_at_ms: NOW - 1, event_timestamp_ms: NOW + 3000 })));
  assertEquals(await db.premium(U1), false);
});

Deno.test('famille : subscription-sync relit le droit Famille dans la fiche', async () => {
  const { db, rows } = memoryDb();
  const body = subscriber({ [FAMILY_ENTITLEMENT]: { product: 'aufildenous_family_monthly', expires: NOW + 25 * DAY } });
  const res = await handleSync(new Request('http://local/s', { method: 'POST' }), { userId: () => Promise.resolve(U1), rateLimit: () => Promise.resolve(true), api: api(body), entitlement: PREMIUM, db, now: () => NOW });
  assertEquals((await res.json()).status, 'active');
  assertEquals([rows.get(U1)!.entitlement, rows.get(U1)!.product_id], [FAMILY_ENTITLEMENT, 'aufildenous_family_monthly']);
});

Deno.test('famille : choix du droit dans la fiche (actif d’abord, Famille en cas d’égalité, remboursé jamais actif)', () => {
  assertEquals(pickPremiumEntitlement({ subscriber: { entitlements: {} } }, PREMIUM, FAMILY_ENTITLEMENT, NOW), null);
  const familyRefunded = subscriber({ [PREMIUM]: { product: 'aufildenous_premium_annual', expires: NOW + 100 * DAY }, [FAMILY_ENTITLEMENT]: { product: 'aufildenous_family_monthly', expires: NOW + 20 * DAY, refunded: true } });
  assertEquals(pickPremiumEntitlement(familyRefunded, PREMIUM, FAMILY_ENTITLEMENT, NOW), PREMIUM);
  const bothExpired = subscriber({ [PREMIUM]: { product: 'aufildenous_premium_monthly', expires: NOW - 10 * DAY }, [FAMILY_ENTITLEMENT]: { product: 'aufildenous_family_monthly', expires: NOW - DAY } });
  assertEquals(pickPremiumEntitlement(bothExpired, PREMIUM, FAMILY_ENTITLEMENT, NOW), FAMILY_ENTITLEMENT, 'le plus récent');
  assertEquals(subscriptionFromSubscriber(bothExpired, PREMIUM, NOW)!.row.status, 'expired');
});

Deno.test('famille : droits hors Premium — ni Premium ni Famille ne vont dans entitlement_grants', () => {
  const body = subscriber({ [PREMIUM]: { product: 'aufildenous_family_monthly', expires: NOW + DAY }, [FAMILY_ENTITLEMENT]: { product: 'aufildenous_family_monthly', expires: NOW + DAY }, ASSISTANT_IA: { product: 'aufildenous_ai_monthly', expires: NOW + DAY } });
  assertEquals(grantsFromSubscriber(body, PREMIUM, NOW)!.map((g) => g.entitlement), ['ASSISTANT_IA']);
});

Deno.test('famille : un événement d’un autre droit (Assistant IA) reste hors abonnement Premium', async () => {
  const { db, rows } = memoryDb();
  const out = await (await hook(db)(req(ev('INITIAL_PURCHASE', { product_id: 'aufildenous_ai_monthly', entitlement_ids: ['ASSISTANT_IA'] })))).json();
  assertEquals(out.ignored, 'other_entitlement');
  assertEquals(rows.size, 0);
});
