/**
 * Open Prices (Open Food Facts) : prix réellement relevés par des contributeurs, avec date, magasin (OpenStreetMap)
 * ou site marchand, et preuve (photo de ticket ou d'étiquette). Licence ODbL : la source est affichée à chaque prix.
 * Module pur (Deno et Jest) : construction des URL et normalisation, sans accès réseau.
 *
 * API vérifiée dans le code source public (github.com/openfoodfacts/open-prices, 20/10/2026) :
 *   GET https://prices.openfoodfacts.org/api/v1/prices?product_code=…|category_tag=…&currency=EUR&order_by=-date&size=…
 *   réponse paginée { items, page, pages, size, total } ; prix « PriceFull » avec location { type OSM|ONLINE, osm_name,
 *   osm_address_city, osm_address_country, website_url }, price_per UNIT|KILOGRAM (produits en vrac), date AAAA-MM-JJ.
 */

export const OPEN_PRICES_HOST = 'prices.openfoodfacts.org';
export const OPEN_PRICES_LABEL = 'Open Prices (Open Food Facts) — prix relevés par des contributeurs, licence ODbL';

export function pricesUrl(q: { barcode?: string | null; categoryTag?: string | null }, size = 20): string | null {
  const p = new URLSearchParams({ currency: 'EUR', order_by: '-date', size: String(Math.min(100, Math.max(1, size))) });
  if (q.barcode && /^\d{8,14}$/.test(q.barcode)) p.set('product_code', q.barcode);
  else if (q.categoryTag && /^[a-z]{2}:[a-z0-9-]{2,80}$/.test(q.categoryTag)) p.set('category_tag', q.categoryTag);
  else return null;
  return `https://${OPEN_PRICES_HOST}/api/v1/prices?${p.toString()}`;
}

export interface NormalizedPrice {
  id: string;
  price: number;
  currency: 'EUR';
  /** null : prix d'un produit emballé ; UNIT ou KILOGRAM : produit en vrac. */
  price_per: 'UNIT' | 'KILOGRAM' | null;
  discounted: boolean;
  observed_on: string;
  store_name: string;
  store_city: string | null;
  store_country: string | null;
  online: boolean;
  website_url: string | null;
  source_url: string;
}

type Any = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Prix exploitables seulement : montant positif, en euros, daté, jamais dans le futur. */
export function normalizePrices(json: unknown, today: string): NormalizedPrice[] {
  const items = (json as { items?: unknown[] })?.items;
  if (!Array.isArray(items)) return [];
  const out: NormalizedPrice[] = [];
  for (const raw of items) {
    const p = raw as Any;
    const price = Number(p.price);
    const date = str(p.date);
    if (!(price > 0) || p.currency !== 'EUR' || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) continue;
    const loc = (p.location ?? {}) as Any;
    const online = loc.type === 'ONLINE';
    const website = str(loc.website_url);
    const name = online ? (website ? new URL(website).hostname.replace(/^www\./, '') : null) : str(loc.osm_name);
    out.push({
      id: String(p.id),
      price: Math.round(price * 100) / 100,
      currency: 'EUR',
      price_per: p.price_per === 'UNIT' || p.price_per === 'KILOGRAM' ? p.price_per : null,
      discounted: p.price_is_discounted === true,
      observed_on: date,
      store_name: name ?? 'Magasin non précisé',
      store_city: str(loc.osm_address_city),
      store_country: str(loc.osm_address_country),
      online,
      website_url: website && /^https:\/\//.test(website) ? website : null,
      source_url: `https://${OPEN_PRICES_HOST}/prices/${encodeURIComponent(String(p.id))}`,
    });
  }
  return out;
}

/** Prix au kilo ou au litre à partir d'une contenance connue (ex. « 500 ml »). */
export function unitPrice(price: number, quantity: { value: number | null; unit: 'g' | 'ml' | 'u' | null }): { value: number; per: 'kg' | 'l' | 'u' } | null {
  if (!quantity.value || !quantity.unit || !(price > 0)) return null;
  if (quantity.unit === 'u') return { value: Math.round((price / quantity.value) * 100) / 100, per: 'u' };
  return { value: Math.round(((price / quantity.value) * 1000) * 100) / 100, per: quantity.unit === 'g' ? 'kg' : 'l' };
}

/** Contenance lisible depuis le champ « quantity » d'Open Food Facts (« 500 ml », « 2 x 75 g », « 1 L »). */
export function parseQuantity(label: string | null): { value: number | null; unit: 'g' | 'ml' | 'u' | null } {
  if (!label) return { value: null, unit: null };
  const s = label.toLowerCase().replace(',', '.');
  const multi = s.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/);
  const one = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/);
  const m = multi ? { n: Number(multi[1]), v: Number(multi[2]), u: multi[3] } : one ? { n: 1, v: Number(one[1]), u: one[2] } : null;
  if (!m) { const u = s.match(/(\d+)\s*(couches|lingettes|pièces|pieces|unités|unites)/); return u ? { value: Number(u[1]), unit: 'u' } : { value: null, unit: null }; }
  const factor = m.u === 'kg' || m.u === 'l' ? 1000 : m.u === 'cl' ? 10 : 1;
  return { value: m.n * m.v * factor, unit: m.u === 'kg' || m.u === 'g' ? 'g' : 'ml' };
}
