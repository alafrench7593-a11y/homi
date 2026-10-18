/**
 * Open Food Facts / Open Beauty Facts / Open Products Facts : construction des URL et
 * normalisation des fiches. Module pur (Deno et Jest), sans accès réseau.
 * Ces bases sont collaboratives : les données sont présentées comme telles (« base collaborative »).
 */

export type OpenFactsKind = 'food' | 'beauty' | 'products';

export const OPEN_FACTS: Record<OpenFactsKind, { host: string; label: string }> = {
  food: { host: 'world.openfoodfacts.org', label: 'Open Food Facts (base collaborative)' },
  beauty: { host: 'world.openbeautyfacts.org', label: 'Open Beauty Facts (base collaborative)' },
  products: { host: 'world.openproductsfacts.org', label: 'Open Products Facts (base collaborative)' },
};

export const OFF_FIELDS = [
  'code', 'product_name', 'product_name_fr', 'generic_name_fr', 'brands', 'image_front_url', 'image_front_small_url', 'image_url',
  'ingredients_text', 'ingredients_text_fr', 'allergens_tags', 'traces_tags', 'categories_tags', 'labels_tags', 'nutriments',
  'warning', 'warning_fr', 'conservation_conditions', 'conservation_conditions_fr', 'periods_after_opening', 'periods_after_opening_tags',
  'last_modified_t', 'quantity',
].join(',');

export function productUrl(kind: OpenFactsKind, barcode: string): string {
  return `https://${OPEN_FACTS[kind].host}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`;
}

export function publicPageUrl(kind: OpenFactsKind, barcode: string): string {
  return `https://${OPEN_FACTS[kind].host}/product/${encodeURIComponent(barcode)}`;
}

/** Recherche par nom (API de recherche historique, limitée en débit par Open Food Facts : à appeler avec parcimonie). */
export function searchUrl(kind: OpenFactsKind, query: string, pageSize = 8): string {
  const q = encodeURIComponent(query.trim().slice(0, 80));
  return `https://${OPEN_FACTS[kind].host}/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${OFF_FIELDS}`;
}

export interface NormalizedProduct {
  barcode: string;
  name: string | null;
  brand: string | null;
  image_url: string | null;
  ingredients_text: string | null;
  allergens: string[];
  /** false : champ absent de la base (≠ « aucun allergène déclaré »). */
  allergens_known: boolean;
  /** Traces « peut contenir » (étiquettes) ; null = non renseigné. */
  traces: string[] | null;
  categories: string[];
  precautions_text: string | null;
  period_after_opening: string | null;
  nutrition: { salt_g_100g: number | null; sugars_g_100g: number | null; energy_kcal_100g: number | null } | null;
  labels: { rawMilk: boolean | null; alcohol: boolean | null; caffeine: boolean | null; sweeteners: boolean | null };
  kind: 'food' | 'cosmetic' | 'product';
  product_type: string | null;
  data_source: string;
  source_url: string;
  data_retrieved_at: string;
  last_modified: string | null;
  collaborative: true;
  is_demo: false;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.')) : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};

/** Type de produit déduit des catégories de la base (jamais de devinette sur le nom seul). */
export function guessProductType(categories: string[]): string | null {
  const c = categories.join(' ').toLowerCase();
  const rules: [RegExp, string][] = [
    [/essential-oils|huiles-essentielles/, 'essential_oil'],
    [/food-supplements|complements-alimentaires|dietary-supplements/, 'supplement'],
    [/medicines|medicaments|drugs/, 'medicine'],
    [/lice|poux|anti-lice/, 'treatment'],
    [/baby-wipes|wet-wipes|lingettes|wipes/, 'wipes'],
    [/diapers|nappies|couches/, 'diapers'],
    [/laundry|lessive|detergents-for-laundry|fabric-softener/, 'laundry'],
    [/household|cleaning|nettoyant|dishwashing|vaisselle/, 'household'],
    [/sunscreen|sun-protection|solaire/, 'sunscreen'],
    [/shampoo/, 'shampoo'],
    [/shower-gel|body-wash|gels-douche|soap|savon|cleansing-gel/, 'wash_gel'],
    [/stretch-marks|vergetures/, 'stretch_marks'],
    [/perfume|parfum|eau-de-toilette|fragrance/, 'perfume'],
    [/make-up|makeup|maquillage|lipstick|mascara|foundation/, 'makeup'],
    [/body-oils|massage-oils|huiles-de-soin|huile-de-massage/, 'oil'],
    [/creams|cremes|lotions|moisturiz|balm|baume/, 'cream'],
  ];
  for (const [re, t] of rules) if (re.test(c)) return t;
  return null;
}

export function normalizeOpenFacts(payload: unknown, kind: OpenFactsKind, barcode: string, today: string): NormalizedProduct | null {
  const out = payload as { status?: number; product?: Record<string, unknown> };
  if (!out || out.status !== 1 || !out.product) return null;
  return normalizeProductObject(out.product, kind, barcode, today);
}

export function normalizeProductObject(p: Record<string, unknown>, kind: OpenFactsKind, barcode: string, today: string): NormalizedProduct {
  const categories = Array.isArray(p.categories_tags) ? (p.categories_tags as unknown[]).map(String) : [];
  const labels = Array.isArray(p.labels_tags) ? (p.labels_tags as unknown[]).map(String) : [];
  const ingredients = str(p.ingredients_text_fr) ?? str(p.ingredients_text);
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const lowerIngr = (ingredients ?? '').toLowerCase();
  const pao = str(p.periods_after_opening) ?? (Array.isArray(p.periods_after_opening_tags) && p.periods_after_opening_tags.length ? String(p.periods_after_opening_tags[0]).replace(/^..:/, '') : null);
  const lastT = typeof p.last_modified_t === 'number' ? new Date(p.last_modified_t * 1000).toISOString().slice(0, 10) : null;
  const code = str(p.code) ?? barcode;
  const precautions = [str(p.warning_fr) ?? str(p.warning), str(p.conservation_conditions_fr) ?? str(p.conservation_conditions)].filter(Boolean).join(' — ') || null;
  const nutrition = kind === 'food'
    ? { salt_g_100g: num(n.salt_100g), sugars_g_100g: num(n.sugars_100g), energy_kcal_100g: num(n['energy-kcal_100g']) }
    : null;
  return {
    barcode: code,
    name: str(p.product_name_fr) ?? str(p.product_name) ?? str(p.generic_name_fr),
    brand: str(p.brands)?.split(',')[0].trim() ?? null,
    image_url: str(p.image_front_url) ?? str(p.image_url) ?? str(p.image_front_small_url),
    ingredients_text: ingredients,
    allergens: Array.isArray(p.allergens_tags) ? (p.allergens_tags as unknown[]).map((t) => String(t).replace(/^..:/, '')) : [],
    allergens_known: Array.isArray(p.allergens_tags),
    traces: Array.isArray(p.traces_tags) ? (p.traces_tags as unknown[]).map((t) => String(t).replace(/^..:/, '')) : null,
    categories,
    precautions_text: precautions,
    period_after_opening: pao,
    nutrition: nutrition && (nutrition.salt_g_100g != null || nutrition.sugars_g_100g != null || nutrition.energy_kcal_100g != null) ? nutrition : null,
    labels: {
      rawMilk: /lait cru|raw milk/.test(lowerIngr) || labels.some((l) => /raw-milk|lait-cru/.test(l)) ? true : null,
      alcohol: categories.some((c) => /alcoholic-beverages|boissons-alcoolisees|wines|beers/.test(c)) ? true : null,
      caffeine: /caf[ée]ine|caffeine|guarana/.test(lowerIngr) || categories.some((c) => /coffees|energy-drinks/.test(c)) ? true : null,
      sweeteners: /aspartame|acesulfame|sucralose|saccharine|st[ée]vi|cyclamate|[ée]dulcorant|sweetener/.test(lowerIngr) ? true : null,
    },
    kind: kind === 'food' ? 'food' : kind === 'beauty' ? 'cosmetic' : 'product',
    product_type: kind === 'food' ? null : guessProductType(categories),
    data_source: OPEN_FACTS[kind].label,
    source_url: publicPageUrl(kind, code),
    data_retrieved_at: today,
    last_modified: lastT,
    collaborative: true,
    is_demo: false,
  };
}

/** Résultats de recherche (cgi/search.pl) → fiches normalisées. */
export function normalizeSearch(payload: unknown, kind: OpenFactsKind, today: string): NormalizedProduct[] {
  const p = payload as { products?: Record<string, unknown>[] };
  if (!p || !Array.isArray(p.products)) return [];
  return p.products
    .filter((x) => typeof x.code === 'string' && /^\d{8,14}$/.test(x.code as string))
    .map((x) => normalizeProductObject(x, kind, String(x.code), today))
    .filter((x) => !!x.name);
}

/** Fiche de la base interne (table public.products) → même forme que les fiches Open Facts. */
export interface LocalProductRow {
  id?: string;
  barcode?: string | null;
  name?: string | null;
  brand?: string | null;
  category?: string | null;
  product_type?: string | null;
  image_url?: string | null;
  ingredients?: string[] | null;
  ingredients_text?: string | null;
  precautions_text?: string | null;
  period_after_opening?: string | null;
  declared_allergens?: string[] | null;
  attributes?: Record<string, unknown> | null;
  nutrition?: { salt_g_100g?: number | null; sugars_g_100g?: number | null; energy_kcal_100g?: number | null } | null;
  source_url?: string | null;
  data_source?: string | null;
  data_retrieved_at?: string | null;
  is_demo?: boolean | null;
}

export function fromProductRow(p: LocalProductRow) {
  const ingredients = str(p.ingredients_text) ?? (Array.isArray(p.ingredients) && p.ingredients.length ? p.ingredients.join(', ') : null);
  const isFood = p.category === 'food' || p.category === 'drink';
  const attrs = (p.attributes ?? {}) as Record<string, unknown>;
  const n = p.nutrition ?? null;
  return {
    id: p.id,
    barcode: String(p.barcode ?? ''),
    name: str(p.name),
    brand: str(p.brand),
    image_url: p.image_url && /^https:\/\//.test(p.image_url) ? p.image_url : null,
    ingredients_text: ingredients,
    allergens: Array.isArray(p.declared_allergens) ? p.declared_allergens : [],
    allergens_known: Array.isArray(p.declared_allergens),
    traces: null as string[] | null,
    categories: [] as string[],
    precautions_text: str(p.precautions_text),
    period_after_opening: str(p.period_after_opening),
    nutrition: n ? { salt_g_100g: n.salt_g_100g ?? null, sugars_g_100g: n.sugars_g_100g ?? null, energy_kcal_100g: n.energy_kcal_100g ?? null } : null,
    labels: {
      rawMilk: attrs.raw_milk === true ? true : null,
      alcohol: attrs.alcohol === true ? true : null,
      caffeine: attrs.caffeine === true ? true : null,
      sweeteners: attrs.sweeteners === true ? true : null,
    },
    kind: (isFood ? 'food' : 'product') as 'food' | 'product',
    product_type: str(p.product_type) ?? (isFood ? null : str(p.category)),
    data_source: str(p.data_source) ?? 'Base interne',
    source_url: str(p.source_url) ?? '',
    data_retrieved_at: String(p.data_retrieved_at ?? '').slice(0, 10),
    last_modified: null as string | null,
    collaborative: /collaborati/i.test(String(p.data_source ?? '')),
    is_demo: p.is_demo === true,
  };
}

// ---------------------------------------------------------------- appels réseau (fetch injectable pour les tests)
export type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** GET JSON avec délai maximal ; null en cas d'erreur réseau, de code HTTP non 2xx ou de JSON invalide. */
export async function getJsonWith(fetchImpl: FetchLike, url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { Accept: 'application/json', ...headers }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Ordre des bases : cosmétiques puis autres produits pour le scanner de produits, aliments d'abord sinon. */
export function lookupOrder(hint: unknown): OpenFactsKind[] {
  return hint === 'product' ? ['beauty', 'products', 'food'] : ['food', 'beauty', 'products'];
}

export interface OpenFactsOptions { userAgent: string; today: string; fetchImpl?: FetchLike; hint?: unknown }

/** Fiche par code-barres dans Open Food / Beauty / Products Facts. Sans User-Agent identifié : aucun appel. */
export async function lookupOpenFacts(barcode: string, o: OpenFactsOptions): Promise<NormalizedProduct | null> {
  if (!o.userAgent.trim()) return null;
  const f = o.fetchImpl ?? (fetch as unknown as FetchLike);
  for (const kind of lookupOrder(o.hint)) {
    const out = normalizeOpenFacts(await getJsonWith(f, productUrl(kind, barcode), { 'User-Agent': o.userAgent }), kind, barcode, o.today);
    if (out) return out;
  }
  return null;
}

/** Recherche par nom dans les bases adaptées au type de scan. */
export async function searchOpenFacts(query: string, o: OpenFactsOptions): Promise<NormalizedProduct[]> {
  if (!o.userAgent.trim()) return [];
  const f = o.fetchImpl ?? (fetch as unknown as FetchLike);
  const kinds: OpenFactsKind[] = o.hint === 'food' ? ['food'] : o.hint === 'product' ? ['beauty', 'products'] : ['food', 'beauty'];
  const out: NormalizedProduct[] = [];
  for (const k of kinds) out.push(...normalizeSearch(await getJsonWith(f, searchUrl(k, query), { 'User-Agent': o.userAgent }), k, o.today));
  return out;
}

// ---------------------------------------------------------------- cache, quotas et pannes (documentation officielle :
// 15 lectures / min / IP, 10 recherches / min / IP ; nos appels partent d'adresses serveur partagées)
export type FetchOutcome = { kind: 'ok'; json: unknown } | { kind: 'not_found' } | { kind: 'error' };

/** Comme getJsonWith, mais distingue « absent » (404 / status 0) d'une panne (réseau, 5xx, 429, délai). */
export async function fetchOutcome(fetchImpl: FetchLike, url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<FetchOutcome> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { Accept: 'application/json', ...headers }, signal: ctrl.signal });
    if (res.status === 404) return { kind: 'not_found' };
    if (!res.ok) return { kind: 'error' };
    const json = await res.json();
    const st = (json as { status?: unknown })?.status;
    return st === 0 || st === '0' ? { kind: 'not_found' } : { kind: 'ok', json };
  } catch {
    return { kind: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

export interface CacheEntry { payload: NormalizedProduct | NormalizedProduct[] | null; found: boolean; fetched_at: string }
export interface OpenFactsStore {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, e: CacheEntry): Promise<void>;
  /** Jeton de quota global (true = appel autorisé). */
  take(bucket: 'read' | 'search'): Promise<boolean>;
}
export type LookupStatus = 'fresh' | 'cached' | 'stale' | 'not_found' | 'saturated' | 'unavailable';

const DAY = 86400000;
export const CACHE_TTL = { found: 7 * DAY, notFound: DAY, search: DAY };

/**
 * Fiche par code-barres avec cache et quota. Jamais d'erreur transformée en « introuvable » :
 * panne → 'unavailable' (ou dernière fiche connue, datée, 'stale') ; quota atteint → 'saturated' (ou 'stale').
 */
export async function lookupOpenFactsCached(barcode: string, o: OpenFactsOptions & { store: OpenFactsStore; now?: Date }): Promise<{ product: NormalizedProduct | null; status: LookupStatus }> {
  if (!o.userAgent.trim()) return { product: null, status: 'unavailable' };
  const now = (o.now ?? new Date()).getTime();
  const key = `product:${barcode}:${lookupOrder(o.hint).join(',')}`;
  const cached = await o.store.get(key);
  const age = cached ? now - Date.parse(cached.fetched_at) : Infinity;
  if (cached && age < (cached.found ? CACHE_TTL.found : CACHE_TTL.notFound)) {
    return { product: cached.found ? cached.payload as NormalizedProduct : null, status: cached.found ? 'cached' : 'not_found' };
  }
  const fallback = (status: LookupStatus) => (cached?.found ? { product: cached.payload as NormalizedProduct, status: 'stale' as const } : { product: null, status });
  const f = o.fetchImpl ?? (fetch as unknown as FetchLike);
  let sawError = false;
  for (const kind of lookupOrder(o.hint)) {
    if (!(await o.store.take('read'))) return fallback('saturated');
    const r = await fetchOutcome(f, productUrl(kind, barcode), { 'User-Agent': o.userAgent });
    if (r.kind === 'error') { sawError = true; continue; }
    if (r.kind === 'ok') {
      const p = normalizeOpenFacts(r.json, kind, barcode, o.today);
      if (p) { await o.store.set(key, { payload: p, found: true, fetched_at: new Date(now).toISOString() }); return { product: p, status: 'fresh' }; }
    }
  }
  if (sawError) return fallback('unavailable');
  await o.store.set(key, { payload: null, found: false, fetched_at: new Date(now).toISOString() });
  return { product: null, status: 'not_found' };
}

/** Recherche par nom avec cache (1 jour) et quota ; panne ou quota → liste vide signalée, jamais « aucun résultat » en silence. */
export async function searchOpenFactsCached(query: string, o: OpenFactsOptions & { store: OpenFactsStore; now?: Date }): Promise<{ products: NormalizedProduct[]; status: LookupStatus }> {
  if (!o.userAgent.trim()) return { products: [], status: 'unavailable' };
  const now = (o.now ?? new Date()).getTime();
  const kinds: OpenFactsKind[] = o.hint === 'food' ? ['food'] : o.hint === 'product' ? ['beauty', 'products'] : ['food', 'beauty'];
  const key = `search:${kinds.join(',')}:${query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}`;
  const cached = await o.store.get(key);
  if (cached && now - Date.parse(cached.fetched_at) < CACHE_TTL.search) return { products: (cached.payload as NormalizedProduct[]) ?? [], status: 'cached' };
  const f = o.fetchImpl ?? (fetch as unknown as FetchLike);
  const out: NormalizedProduct[] = [];
  for (const k of kinds) {
    if (!(await o.store.take('search'))) return cached ? { products: (cached.payload as NormalizedProduct[]) ?? [], status: 'stale' } : { products: out, status: 'saturated' };
    const r = await fetchOutcome(f, searchUrl(k, query), { 'User-Agent': o.userAgent });
    if (r.kind === 'error') return cached ? { products: (cached.payload as NormalizedProduct[]) ?? [], status: 'stale' } : { products: out, status: 'unavailable' };
    if (r.kind === 'ok') out.push(...normalizeSearch(r.json, k, o.today));
  }
  await o.store.set(key, { payload: out, found: out.length > 0, fetched_at: new Date(now).toISOString() });
  return { products: out, status: out.length ? 'fresh' : 'not_found' };
}
