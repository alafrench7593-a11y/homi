// Cache, quotas et pannes d'Open Food Facts (faux transport, aucune dépendance réseau).
import { lookupOpenFactsCached, searchOpenFactsCached, type CacheEntry, type FetchLike, type OpenFactsStore } from './open-facts.ts';
function assertEquals(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`); }

const UA = 'ToiEtMoi/1.0 (test@exemple.test)';
function store(tokens = 99) {
  const m = new Map<string, CacheEntry>(); let left = tokens;
  const s: OpenFactsStore & { m: typeof m } = { m, get: async (k) => m.get(k) ?? null, set: async (k, e) => { m.set(k, e); }, take: async () => left-- > 0 };
  return s;
}
const reply = (status: number, body: unknown): FetchLike => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const YAOURT = { status: 1, product: { product_name_fr: 'Yaourt', allergens_tags: ['en:milk'] } };
let calls = 0;
const counting = (f: FetchLike): FetchLike => (u, i) => { calls++; return f(u, i); };

Deno.test('trouvé → mis en cache 7 jours (aucun nouvel appel), date de récupération conservée', async () => {
  const s = store(); calls = 0;
  const a = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-18', store: s, fetchImpl: counting(reply(200, YAOURT)), now: new Date('2026-10-18T10:00:00Z') });
  assertEquals([a.status, a.product?.name, a.product?.data_retrieved_at], ['fresh', 'Yaourt', '2026-10-18']);
  const b = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-20', store: s, fetchImpl: counting(reply(500, {})), now: new Date('2026-10-20T10:00:00Z') });
  assertEquals([b.status, b.product?.data_retrieved_at, calls], ['cached', '2026-10-18', 1]);
});

Deno.test('panne réseau ou 5xx → « indisponible », jamais « introuvable »', async () => {
  const r = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-18', store: store(), fetchImpl: reply(503, {}) });
  assertEquals([r.status, r.product], ['unavailable', null]);
  const t = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-18', store: store(), fetchImpl: async () => { throw new Error('réseau'); } });
  assertEquals(t.status, 'unavailable');
});

Deno.test('vraiment absent des trois bases → « introuvable », mis en cache 1 jour seulement', async () => {
  const s = store();
  const r = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-18', store: s, fetchImpl: reply(404, { status: 0 }), now: new Date('2026-10-18T10:00:00Z') });
  assertEquals(r.status, 'not_found');
  calls = 0;
  const later = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-19', store: s, fetchImpl: counting(reply(200, YAOURT)), now: new Date('2026-10-19T11:00:00Z') });
  assertEquals([later.status, calls], ['fresh', 1]);
});

Deno.test('quota atteint → « saturé », ou dernière fiche connue signalée comme ancienne', async () => {
  const empty = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-18', store: store(0), fetchImpl: reply(200, YAOURT) });
  assertEquals(empty.status, 'saturated');
  const s = store(1);
  await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-01', store: s, fetchImpl: reply(200, YAOURT), now: new Date('2026-10-01T10:00:00Z') });
  const old = await lookupOpenFactsCached('3000000000011', { userAgent: UA, today: '2026-10-18', store: s, fetchImpl: reply(200, YAOURT), now: new Date('2026-10-18T10:00:00Z') });
  assertEquals([old.status, old.product?.data_retrieved_at], ['stale', '2026-10-01']);
});

Deno.test('sans User-Agent identifié : aucun appel', async () => {
  calls = 0;
  const r = await lookupOpenFactsCached('3000000000011', { userAgent: ' ', today: '2026-10-18', store: store(), fetchImpl: counting(reply(200, YAOURT)) });
  assertEquals([r.status, calls], ['unavailable', 0]);
});

Deno.test('recherche : cache d’un jour, panne signalée', async () => {
  const s = store();
  const body = { products: [{ code: '3000000000011', product_name_fr: 'Yaourt' }] };
  const a = await searchOpenFactsCached('Yaourt', { userAgent: UA, today: '2026-10-18', store: s, fetchImpl: reply(200, body), hint: 'food', now: new Date('2026-10-18T10:00:00Z') });
  assertEquals([a.status, a.products.length], ['fresh', 1]);
  const b = await searchOpenFactsCached('yaourt', { userAgent: UA, today: '2026-10-18', store: s, fetchImpl: reply(500, {}), hint: 'food', now: new Date('2026-10-18T12:00:00Z') });
  assertEquals(b.status, 'cached');
  const c = await searchOpenFactsCached('Compote', { userAgent: UA, today: '2026-10-18', store: s, fetchImpl: reply(500, {}), hint: 'food' });
  assertEquals(c.status, 'unavailable');
});
