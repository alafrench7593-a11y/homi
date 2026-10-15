// Tests Open Food / Beauty / Products Facts avec un faux transport réseau (aucun appel réel).
function assertEquals(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}
function assert(c: unknown, m = 'assertion') { if (!c) throw new Error(m); }
import { fromProductRow, lookupOpenFacts, normalizeOpenFacts, searchOpenFacts, type FetchLike } from './open-facts.ts';

const UA = 'ToiEtMoiTest/1.0 (test@exemple.test)';
function fakeFetch(routes: Record<string, unknown>, calls: { url: string; ua?: string }[]): FetchLike {
  return (url, init) => {
    calls.push({ url, ua: init?.headers?.['User-Agent'] });
    const host = new URL(url).host;
    const body = routes[host];
    if (body === 'error') return Promise.reject(new Error('réseau'));
    return Promise.resolve({ ok: body !== undefined, status: body === undefined ? 404 : 200, json: () => Promise.resolve(body) });
  };
}

Deno.test('produit cosmétique : Open Beauty Facts interrogé en premier pour le scanner de produits, User-Agent transmis', async () => {
  const calls: { url: string; ua?: string }[] = [];
  const f = fakeFetch({ 'world.openbeautyfacts.org': { status: 1, product: { code: '3560070000006', product_name: 'Lait corps', categories_tags: ['en:body-lotions', 'en:creams'], ingredients_text: 'Aqua, Glycerin' } } }, calls);
  const p = await lookupOpenFacts('3560070000006', { userAgent: UA, today: '2026-10-16', fetchImpl: f, hint: 'product' });
  assertEquals(p?.kind, 'cosmetic');
  assertEquals(p?.product_type, 'cream');
  assertEquals(p?.collaborative, true);
  assertEquals(calls.length, 1);
  assertEquals(calls[0].ua, UA);
  assert(calls[0].url.startsWith('https://world.openbeautyfacts.org/api/v2/product/3560070000006.json'));
});

Deno.test('aliment introuvable dans Open Food Facts : bases suivantes, puis null (aucune fiche inventée)', async () => {
  const calls: { url: string; ua?: string }[] = [];
  const f = fakeFetch({ 'world.openfoodfacts.org': { status: 0 }, 'world.openbeautyfacts.org': 'error' }, calls);
  const p = await lookupOpenFacts('3017620422003', { userAgent: UA, today: '2026-10-16', fetchImpl: f, hint: 'food' });
  assertEquals(p, null);
  assertEquals(calls.map((c) => new URL(c.url).host), ['world.openfoodfacts.org', 'world.openbeautyfacts.org', 'world.openproductsfacts.org']);
});

Deno.test('sans User-Agent configuré : aucun appel réseau', async () => {
  const calls: { url: string; ua?: string }[] = [];
  assertEquals(await lookupOpenFacts('3017620422003', { userAgent: '', today: '2026-10-16', fetchImpl: fakeFetch({}, calls) }), null);
  assertEquals(await searchOpenFacts('brie', { userAgent: ' ', today: '2026-10-16', fetchImpl: fakeFetch({}, calls) }), []);
  assertEquals(calls.length, 0);
});

Deno.test('recherche par nom : seuls les codes-barres valides sont gardés', async () => {
  const calls: { url: string; ua?: string }[] = [];
  const f = fakeFetch({ 'world.openfoodfacts.org': { products: [{ code: '3017620422003', product_name: 'Brie' }, { code: 'abc', product_name: 'X' }, { code: '12345678', product_name: '' }] } }, calls);
  const out = await searchOpenFacts('brie', { userAgent: UA, today: '2026-10-16', fetchImpl: f, hint: 'food' });
  assertEquals(out.map((p) => p.name), ['Brie']);
  assert(calls[0].url.includes('search_terms=brie'));
});

Deno.test('normalisation : nutrition arrondie, allergènes sans préfixe de langue', () => {
  const p = normalizeOpenFacts({ status: 1, product: { product_name_fr: 'Yaourt', allergens_tags: ['en:milk'], nutriments: { salt_100g: '0,123', sugars_100g: 4 } } }, 'food', '3000000000011', '2026-10-16')!;
  assertEquals(p.allergens, ['milk']);
  assertEquals(p.nutrition, { salt_g_100g: 0.12, sugars_g_100g: 4, energy_kcal_100g: null });
  assertEquals(fromProductRow({ barcode: '1', name: 'X', category: 'food', data_source: 'Base', data_retrieved_at: '2026-10-16T08:00:00Z' }).kind, 'food');
});
