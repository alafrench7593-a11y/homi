// Tests du webhook RevenueCat, de subscription-sync et de la suppression du client RevenueCat (sans réseau :
// base en mémoire, API RevenueCat simulée).
import {
  deleteRevenueCatCustomer, handleSync, handleWebhook, revenueCatApi, type RevenueCatApi, type StoredRow, type SubscriptionDb,
} from './subscription-run.ts';
import type { RcSubscriberBody } from './revenuecat.ts';

function assertEquals(a: unknown, b: unknown, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}

const ENT = 'AU_FIL_DE_NOUS_PREMIUM';
const SECRET = 'secret-de-test';
const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const NOW = Date.parse('2026-11-05T10:00:00Z');
const DAY = 86_400_000;

function memoryDb(locale: string | null = null) {
  const rows = new Map<string, StoredRow>();
  const notices: { userId: string; title: string; body: string }[] = [];
  const db: SubscriptionDb = {
    read: (id) => Promise.resolve(rows.has(id) ? { ...rows.get(id)! } : null),
    write: (row) => { rows.set(row.user_id, { ...(rows.get(row.user_id) ?? {}), ...row }); return Promise.resolve(true); },
    notify: (userId, n) => { notices.push({ userId, ...n }); return Promise.resolve(); },
    locale: () => Promise.resolve(locale),
    premium: (id) => {
      const r = rows.get(id);
      const ok = !!r && ['trial', 'active', 'grace', 'cancelled', 'paused'].includes(String(r.status)) && !!r.expires_at && Date.parse(r.expires_at) > NOW;
      return Promise.resolve(ok);
    },
  };
  return { db, rows, notices };
}

function fakeApi(bodies: Record<string, RcSubscriberBody | number>): RevenueCatApi & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    subscriber: (id) => {
      calls.push(`GET ${id}`);
      const b = bodies[id];
      if (b === undefined) return Promise.resolve({ ok: true, body: { subscriber: { entitlements: {}, subscriptions: {} } } });
      return Promise.resolve(typeof b === 'number' ? { ok: false, status: b } : { ok: true, body: b });
    },
    remove: (id) => { calls.push(`DELETE ${id}`); return Promise.resolve({ ok: true, status: 200 }); },
  };
}

const subscriber = (product: string, expires: number, extra: Record<string, unknown> = {}, ent: Record<string, unknown> = {}): RcSubscriberBody => ({
  subscriber: {
    entitlements: { [ENT]: { expires_date: new Date(expires).toISOString(), product_identifier: product, purchase_date: new Date(NOW - DAY).toISOString(), ...ent } },
    subscriptions: { [product.split(':')[0]]: { expires_date: new Date(expires).toISOString(), purchase_date: new Date(NOW - DAY).toISOString(), original_purchase_date: '2026-10-01T09:00:00Z', period_type: 'normal', store: 'app_store', is_sandbox: true, ...extra } },
  },
});

const req = (event: Record<string, unknown>, auth = `Bearer ${SECRET}`) =>
  new Request('http://local/revenuecat-webhook', { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ api_version: '1.0', event }) });
const ev = (type: string, extra: Record<string, unknown> = {}) => ({
  type, id: crypto.randomUUID(), app_user_id: U1, original_app_user_id: U1, product_id: 'aufildenous_premium_monthly', entitlement_ids: [ENT],
  store: 'APP_STORE', environment: 'SANDBOX', period_type: 'NORMAL', event_timestamp_ms: NOW, expiration_at_ms: NOW + 30 * DAY, ...extra,
});
const hook = (db: SubscriptionDb, api: RevenueCatApi | null = null) => (r: Request) => handleWebhook(r, { secret: SECRET, entitlement: ENT, api, db, now: () => NOW });

Deno.test('webhook : secret faux ou absent → 401, rien n’est écrit', async () => {
  const { db, rows } = memoryDb();
  assertEquals((await hook(db)(req(ev('INITIAL_PURCHASE'), 'Bearer mauvais'))).status, 401);
  assertEquals((await hook(db)(req(ev('INITIAL_PURCHASE'), ''))).status, 401);
  assertEquals((await handleWebhook(req(ev('INITIAL_PURCHASE')), { secret: '', entitlement: ENT, api: null, db })).status, 500);
  assertEquals(rows.size, 0);
});

Deno.test('webhook : événement TEST, autre droit, utilisateur anonyme, corps trop gros', async () => {
  const { db, rows } = memoryDb();
  assertEquals(await (await hook(db)(req({ type: 'TEST' }))).json(), { ok: true, test: true });
  assertEquals((await (await hook(db)(req(ev('INITIAL_PURCHASE', { entitlement_ids: ['autre'] })))).json()).ignored, 'other_entitlement');
  assertEquals((await (await hook(db)(req(ev('INITIAL_PURCHASE', { app_user_id: '$RCAnonymousID:abc', original_app_user_id: '$RCAnonymousID:abc' })))).json()).ignored, 'anonymous_user');
  const big = new Request('http://local/x', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` }, body: JSON.stringify({ event: { type: 'TEST', pad: 'x'.repeat(70_000) } }) });
  assertEquals((await hook(db)(big)).status, 413);
  assertEquals(rows.size, 0);
});

Deno.test('webhook : achat avec essai de 3 jours (mensuel) puis conversion, doublon et événement en retard ignorés', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE', { period_type: 'TRIAL', expiration_at_ms: NOW + 3 * DAY, purchased_at_ms: NOW, price_in_purchased_currency: 0, currency: 'EUR' })));
  const r = rows.get(U1)!;
  assertEquals([r.status, r.period_type, r.trial_ends_at, r.started_at, r.environment, r.store], ['trial', 'monthly', new Date(NOW + 3 * DAY).toISOString(), new Date(NOW).toISOString(), 'sandbox', 'app_store']);
  assertEquals(r.price, undefined, 'essai : aucun prix enregistré');
  const renewal = ev('RENEWAL', { event_timestamp_ms: NOW + 3 * DAY, expiration_at_ms: NOW + 33 * DAY, is_trial_conversion: true, price_in_purchased_currency: 10.99, currency: 'EUR' });
  await hook(db)(req(renewal));
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.price, rows.get(U1)!.currency, rows.get(U1)!.will_renew], ['active', 10.99, 'EUR', true]);
  assertEquals((await (await hook(db)(req(renewal))).json()).ignored, 'duplicate_event');
  assertEquals((await (await hook(db)(req(ev('CANCELLATION', { event_timestamp_ms: NOW })))).json()).ignored, 'stale_event');
});

Deno.test('webhook : remboursement (CANCELLATION / CUSTOMER_SUPPORT) → droits retirés tout de suite, notification FR', async () => {
  const { db, rows, notices } = memoryDb(null);
  await hook(db)(req(ev('INITIAL_PURCHASE')));
  await hook(db)(req(ev('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT', event_timestamp_ms: NOW + 1000, price_in_purchased_currency: -10.99 })));
  const r = rows.get(U1)!;
  assertEquals([r.status, r.will_renew, r.cancel_reason, !!r.refunded_at], ['refunded', false, 'CUSTOMER_SUPPORT', true]);
  assertEquals(await db.premium(U1), false);
  assertEquals(notices.at(-1)?.title, 'Abonnement remboursé');
});

Deno.test('webhook : remboursement avec API qui montre encore le droit actif → remboursé quand même ; notification EN', async () => {
  const { db, rows, notices } = memoryDb('en');
  const api = fakeApi({ [U1]: subscriber('aufildenous_premium_annual', NOW + 300 * DAY) });
  await hook(db, api)(req(ev('CANCELLATION', { cancel_reason: 'CUSTOMER_SUPPORT', product_id: 'aufildenous_premium_annual' })));
  assertEquals(rows.get(U1)!.status, 'refunded');
  assertEquals(notices.at(-1)?.title, 'Subscription refunded');
  // Une synchronisation ultérieure avec une fiche antérieure au remboursement ne rend pas le Premium
  const sync = await handleSync(new Request('http://local/s', { method: 'POST' }), { userId: () => Promise.resolve(U1), rateLimit: () => Promise.resolve(true), api, entitlement: ENT, db, now: () => NOW });
  assertEquals((await sync.json()).status, 'refunded');
});

Deno.test('webhook : annulation (droits jusqu’à l’échéance) puis UNCANCELLATION (renouvellement réactivé)', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE')));
  await hook(db)(req(ev('CANCELLATION', { cancel_reason: 'UNSUBSCRIBE', event_timestamp_ms: NOW + 1000 })));
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.will_renew, await db.premium(U1)], ['cancelled', false, true]);
  await hook(db)(req(ev('UNCANCELLATION', { event_timestamp_ms: NOW + 2000 })));
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.will_renew, rows.get(U1)!.cancel_reason], ['active', true, null]);
});

Deno.test('webhook : échec de paiement → période de grâce ; puis expiration pour raison de paiement', async () => {
  const { db, rows, notices } = memoryDb();
  await hook(db)(req(ev('BILLING_ISSUE', { expiration_at_ms: NOW + 6 * DAY })));
  assertEquals([rows.get(U1)!.status, !!rows.get(U1)!.billing_issue_at, await db.premium(U1)], ['grace', true, true]);
  assertEquals(notices.at(-1)?.title, 'Problème de paiement');
  await hook(db)(req(ev('EXPIRATION', { expiration_reason: 'BILLING_ERROR', expiration_at_ms: NOW - 1, event_timestamp_ms: NOW + DAY })));
  assertEquals([rows.get(U1)!.status, await db.premium(U1)], ['billing_issue', false]);
});

Deno.test('webhook : SUBSCRIPTION_PAUSED ne retire pas l’accès avant l’échéance ; EXPIRATION « pause » le retire', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('SUBSCRIPTION_PAUSED', { store: 'PLAY_STORE', auto_resume_at_ms: NOW + 60 * DAY, expiration_at_ms: NOW + 10 * DAY })));
  const r = rows.get(U1)!;
  assertEquals([r.status, r.will_renew, r.resumes_at, r.store, await db.premium(U1)], ['paused', false, new Date(NOW + 60 * DAY).toISOString(), 'play_store', true]);
  await hook(db)(req(ev('EXPIRATION', { store: 'PLAY_STORE', expiration_reason: 'SUBSCRIPTION_PAUSED', expiration_at_ms: NOW - 1, event_timestamp_ms: NOW + 1000 })));
  assertEquals([rows.get(U1)!.status, await db.premium(U1)], ['paused', false]);
});

Deno.test('webhook : changement de formule mensuel → annuel (API) puis annuel → mensuel différé (sans API)', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE')));
  const api = fakeApi({ [U1]: subscriber('aufildenous_premium_annual', NOW + 365 * DAY) });
  await hook(db, api)(req(ev('PRODUCT_CHANGE', { new_product_id: 'aufildenous_premium_annual', event_timestamp_ms: NOW + 1000 })));
  assertEquals([rows.size, rows.get(U1)!.product_id, rows.get(U1)!.period_type, rows.get(U1)!.status], [1, 'aufildenous_premium_annual', 'annual', 'active']);
  // Sans API : un changement vers une formule moins chère prend effet à l'échéance ; l'annuel reste affiché
  await hook(db)(req(ev('PRODUCT_CHANGE', { product_id: 'aufildenous_premium_annual', new_product_id: 'aufildenous_premium_monthly', expiration_at_ms: NOW + 365 * DAY, event_timestamp_ms: NOW + 2000 })));
  assertEquals([rows.size, rows.get(U1)!.product_id, rows.get(U1)!.status], [1, 'aufildenous_premium_annual', 'active']);
  await hook(db)(req(ev('RENEWAL', { product_id: 'aufildenous_premium_monthly', expiration_at_ms: NOW + 395 * DAY, event_timestamp_ms: NOW + 365 * DAY })));
  assertEquals([rows.get(U1)!.product_id, rows.get(U1)!.period_type], ['aufildenous_premium_monthly', 'monthly']);
});

Deno.test('webhook : Google Play, 1 abonnement avec 3 offres de base (« abonnement:offre ») reconnu', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE', { store: 'PLAY_STORE', product_id: 'aufildenous_premium:six-months', expiration_at_ms: NOW + 182 * DAY })));
  assertEquals([rows.get(U1)!.period_type, rows.get(U1)!.store], ['six_months', 'play_store']);
});

Deno.test('webhook : échéance nulle → pas de Premium sans fin (sauf octroi promotionnel)', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('RENEWAL', { expiration_at_ms: null })));
  assertEquals([rows.get(U1)!.expires_at, rows.get(U1)!.period_type, await db.premium(U1)], [null, 'monthly', false]);
  const { db: db2, rows: rows2 } = memoryDb();
  await hook(db2)(req(ev('NON_RENEWING_PURCHASE', { store: 'PROMOTIONAL', product_id: 'rc_promo_premium_lifetime', expiration_at_ms: null })));
  assertEquals(rows2.get(U1)!.period_type, 'lifetime');
});

Deno.test('webhook : TRANSFER (même compte Apple sur un autre compte) — sans API puis avec API', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE')));
  const t = { type: 'TRANSFER', id: 'x', transferred_from: [U1], transferred_to: [U2], event_timestamp_ms: NOW + 1000, store: 'APP_STORE' };
  assertEquals((await hook(db)(req(t))).status, 200);
  assertEquals([rows.get(U2)!.status, rows.get(U2)!.expires_at, rows.get(U2)!.last_event], ['active', new Date(NOW + 30 * DAY).toISOString(), 'TRANSFER']);
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.will_renew], ['expired', false]);
  const api = fakeApi({ [U1]: { subscriber: { entitlements: {}, subscriptions: {} } }, [U2]: subscriber('aufildenous_premium_monthly', NOW + 30 * DAY) });
  const { db: db2, rows: rows2 } = memoryDb();
  await hook(db2)(req(ev('INITIAL_PURCHASE')));
  await hook(db2, api)(req(t));
  assertEquals(api.calls, [`GET ${U1}`, `GET ${U2}`]);
  assertEquals([rows2.get(U1)!.status, rows2.get(U2)!.status], ['none', 'active']);
});

const syncReq = () => new Request('http://local/subscription-sync', { method: 'POST', body: '{}' });

Deno.test('subscription-sync : sans connexion → 401 ; limite de débit → 429', async () => {
  const { db } = memoryDb();
  const api = fakeApi({});
  assertEquals((await handleSync(syncReq(), { userId: () => Promise.resolve(null), rateLimit: () => Promise.resolve(true), api, entitlement: ENT, db })).status, 401);
  let hits = 0;
  const deps = { userId: () => Promise.resolve(U1), rateLimit: () => Promise.resolve(++hits <= 2), api, entitlement: ENT, db, now: () => NOW };
  assertEquals((await handleSync(syncReq(), deps)).status, 200);
  assertEquals((await handleSync(syncReq(), deps)).status, 200);
  const third = await handleSync(syncReq(), deps);
  assertEquals([third.status, (await third.json()).reason], [429, 'rate_limited']);
  assertEquals(api.calls.length, 2, 'aucun appel à RevenueCat au-delà de la limite');
});

Deno.test('subscription-sync : relit RevenueCat et met à jour la ligne (restauration, changement de téléphone)', async () => {
  const { db, rows } = memoryDb();
  const api = fakeApi({ [U1]: subscriber('aufildenous_premium_6months', NOW + 180 * DAY) });
  const res = await handleSync(syncReq(), { userId: () => Promise.resolve(U1), rateLimit: () => Promise.resolve(true), api, entitlement: ENT, db, now: () => NOW });
  assertEquals(await res.json(), { synced: true, status: 'active', premium: true });
  const r = rows.get(U1)!;
  assertEquals([r.period_type, r.started_at, r.environment, r.last_sync_at], ['six_months', '2026-10-01T09:00:00Z', 'sandbox', new Date(NOW).toISOString()]);
});

Deno.test('subscription-sync : jamais abonnée → aucune ligne créée ; clé absente ; API en panne', async () => {
  const { db, rows } = memoryDb();
  const base = { userId: () => Promise.resolve(U1), rateLimit: () => Promise.resolve(true), entitlement: ENT, db, now: () => NOW };
  assertEquals(await (await handleSync(syncReq(), { ...base, api: fakeApi({}) })).json(), { synced: true, status: 'none', premium: false });
  assertEquals(rows.size, 0);
  assertEquals((await (await handleSync(syncReq(), { ...base, api: null })).json()).reason, 'not_configured');
  assertEquals((await handleSync(syncReq(), { ...base, api: fakeApi({ [U1]: 500 }) })).status, 502);
});

Deno.test('subscription-sync : statuts lus dans la fiche (essai, annulé, grâce, remboursé, en pause, expiré)', async () => {
  const cases: [RcSubscriberBody, string][] = [
    [subscriber('aufildenous_premium_monthly', NOW + 3 * DAY, { period_type: 'trial' }), 'trial'],
    [subscriber('aufildenous_premium_monthly', NOW + 3 * DAY, { unsubscribe_detected_at: '2026-11-04T00:00:00Z' }), 'cancelled'],
    [subscriber('aufildenous_premium_monthly', NOW - DAY, { billing_issues_detected_at: '2026-11-04T00:00:00Z' }, { grace_period_expires_date: new Date(NOW + 5 * DAY).toISOString() }), 'grace'],
    [subscriber('aufildenous_premium_monthly', NOW + 3 * DAY, { refunded_at: '2026-11-04T00:00:00Z' }), 'refunded'],
    [subscriber('aufildenous_premium_monthly', NOW - DAY, { auto_resume_date: '2026-12-20T00:00:00Z', store: 'play_store' }), 'paused'],
    [subscriber('aufildenous_premium_monthly', NOW - DAY), 'expired'],
  ];
  for (const [body, want] of cases) {
    const { db } = memoryDb();
    const out = await (await handleSync(syncReq(), { userId: () => Promise.resolve(U1), rateLimit: () => Promise.resolve(true), api: fakeApi({ [U1]: body }), entitlement: ENT, db, now: () => NOW })).json();
    assertEquals(out.status, want);
  }
});

Deno.test('API REST : bonnes adresses, clé secrète en Bearer, pas d’en-tête X-Platform', async () => {
  const seen: { url: string; method: string; auth: string | null; platform: string | null }[] = [];
  const f = ((url: string, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    seen.push({ url, method: init?.method ?? 'GET', auth: h.get('Authorization'), platform: h.get('X-Platform') });
    return Promise.resolve(new Response(JSON.stringify({ subscriber: { entitlements: {} } }), { status: 200 }));
  }) as typeof fetch;
  const api = revenueCatApi('sk_test', f);
  await api.subscriber(U1);
  await api.remove(U1);
  assertEquals(seen, [
    { url: `https://api.revenuecat.com/v1/subscribers/${U1}`, method: 'GET', auth: 'Bearer sk_test', platform: null },
    { url: `https://api.revenuecat.com/v1/subscribers/${U1}`, method: 'DELETE', auth: 'Bearer sk_test', platform: null },
  ]);
});

Deno.test('suppression du compte : client RevenueCat supprimé, sans jamais bloquer', async () => {
  const resp = (status: number) => (() => Promise.resolve(new Response('{}', { status }))) as unknown as typeof fetch;
  assertEquals(await deleteRevenueCatCustomer(revenueCatApi('k', resp(200)), U1), 'deleted');
  assertEquals(await deleteRevenueCatCustomer(revenueCatApi('k', resp(404)), U1), 'deleted');
  assertEquals(await deleteRevenueCatCustomer(revenueCatApi('k', resp(500)), U1), 'failed');
  assertEquals(await deleteRevenueCatCustomer(revenueCatApi('k', (() => Promise.reject(new Error('réseau'))) as typeof fetch), U1), 'failed');
  assertEquals(await deleteRevenueCatCustomer(null, U1), 'not_configured');
});

// ---------------------------------------------------------------- Scénarios complémentaires (audit du 05/11/2026)
Deno.test('webhook : essai résilié pendant les 3 jours → accès jusqu’à la fin de l’essai, puis plus rien (aucun prélèvement)', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE', { period_type: 'TRIAL', expiration_at_ms: NOW + 3 * DAY, purchased_at_ms: NOW, price_in_purchased_currency: 0, currency: 'EUR' })));
  await hook(db)(req(ev('CANCELLATION', { period_type: 'TRIAL', cancel_reason: 'UNSUBSCRIBE', expiration_at_ms: NOW + 3 * DAY, event_timestamp_ms: NOW + DAY })));
  const r = rows.get(U1)!;
  assertEquals([r.status, r.will_renew, r.expires_at, await db.premium(U1)], ['cancelled', false, new Date(NOW + 3 * DAY).toISOString(), true], 'essai résilié');
  assertEquals(r.price, undefined, 'essai résilié : aucun prix enregistré');
  await hook(db)(req(ev('EXPIRATION', { period_type: 'TRIAL', expiration_reason: 'UNSUBSCRIBE', expiration_at_ms: NOW - 1, event_timestamp_ms: NOW + 3 * DAY })));
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.will_renew, await db.premium(U1)], ['expired', false, false], 'fin de l’essai');
});

Deno.test('webhook : 6 mois puis 12 mois sans essai, prix réel enregistré, renouvellement qui prolonge l’échéance', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE', { product_id: 'aufildenous_premium_6months', expiration_at_ms: NOW + 182 * DAY, purchased_at_ms: NOW, price_in_purchased_currency: 54.99, currency: 'EUR' })));
  let r = rows.get(U1)!;
  assertEquals([r.status, r.period_type, r.price, r.currency, r.trial_ends_at, r.will_renew], ['active', 'six_months', 54.99, 'EUR', undefined, true], '6 mois');
  await hook(db)(req(ev('RENEWAL', { product_id: 'aufildenous_premium_6months', expiration_at_ms: NOW + 364 * DAY, event_timestamp_ms: NOW + 182 * DAY, price_in_purchased_currency: 54.99, currency: 'EUR' })));
  r = rows.get(U1)!;
  assertEquals([r.status, r.expires_at, r.last_event], ['active', new Date(NOW + 364 * DAY).toISOString(), 'RENEWAL'], 'renouvellement 6 mois');
  const { db: db2, rows: rows2 } = memoryDb();
  await hook(db2)(req(ev('INITIAL_PURCHASE', { product_id: 'aufildenous_premium_annual', expiration_at_ms: NOW + 365 * DAY, price_in_purchased_currency: 99.99, currency: 'EUR' })));
  assertEquals([rows2.get(U1)!.status, rows2.get(U1)!.period_type, rows2.get(U1)!.price], ['active', 'annual', 99.99], '12 mois');
});

Deno.test('webhook : paiement refusé puis régularisé → grâce, puis actif (problème de paiement effacé)', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE')));
  await hook(db)(req(ev('BILLING_ISSUE', { expiration_at_ms: NOW + 6 * DAY, event_timestamp_ms: NOW + 1000 })));
  assertEquals([rows.get(U1)!.status, !!rows.get(U1)!.billing_issue_at, await db.premium(U1)], ['grace', true, true], 'grâce');
  await hook(db)(req(ev('RENEWAL', { expiration_at_ms: NOW + 36 * DAY, event_timestamp_ms: NOW + 2 * DAY })));
  const r = rows.get(U1)!;
  assertEquals([r.status, r.billing_issue_at, r.will_renew, await db.premium(U1)], ['active', null, true, true], 'régularisé');
  // Annulation par la boutique pour erreur de facturation avant l'échéance : grâce (pas de retrait brutal)
  await hook(db)(req(ev('CANCELLATION', { cancel_reason: 'BILLING_ERROR', expiration_at_ms: NOW + 5 * DAY, event_timestamp_ms: NOW + 3 * DAY })));
  assertEquals(rows.get(U1)!.status, 'grace', 'annulation BILLING_ERROR avant échéance');
});

Deno.test('webhook : remboursement signalé par EXPIRATION (CUSTOMER_SUPPORT) puis remboursement annulé (REFUND_REVERSED)', async () => {
  const { db, rows } = memoryDb();
  await hook(db)(req(ev('INITIAL_PURCHASE', { expiration_at_ms: NOW + 30 * DAY })));
  await hook(db)(req(ev('EXPIRATION', { expiration_reason: 'CUSTOMER_SUPPORT', expiration_at_ms: NOW + 30 * DAY, event_timestamp_ms: NOW + 1000 })));
  assertEquals([rows.get(U1)!.status, !!rows.get(U1)!.refunded_at, await db.premium(U1)], ['refunded', true, false], 'remboursé (EXPIRATION)');
  await hook(db)(req(ev('REFUND_REVERSED', { expiration_at_ms: NOW + 30 * DAY, event_timestamp_ms: NOW + 2000 })));
  assertEquals([rows.get(U1)!.status, rows.get(U1)!.refunded_at, await db.premium(U1)], ['active', null, true], 'remboursement annulé');
});
