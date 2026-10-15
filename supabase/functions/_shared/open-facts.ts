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
  'ingredients_text', 'ingredients_text_fr', 'allergens_tags', 'categories_tags', 'labels_tags', 'nutriments',
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
