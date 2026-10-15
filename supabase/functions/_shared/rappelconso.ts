/**
 * RappelConso (rappels officiels de produits, data.economie.gouv.fr) : construction de la requête,
 * lecture TOLÉRANTE des enregistrements et correspondance avec un produit précis.
 *
 * Les noms de champs exacts du jeu « rappelconso-v2-gtin-espaces » n'ont pas pu être vérifiés en direct :
 * le lecteur accepte plusieurs clés candidates (schéma V2 et anciens noms V1), au premier niveau
 * ou sous `fields` (ancienne API « records »). Module pur (Deno et Jest).
 */

export const RAPPELCONSO_BASE = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets';
export const RAPPELCONSO_DATASET = 'rappelconso-v2-gtin-espaces';

/** Recherche plein texte (littéral) : le filtrage exact se fait ensuite sur le GTIN lu. */
export function rappelConsoUrl(term: string, opts: { base?: string; dataset?: string; limit?: number } = {}): string {
  const safe = term.replace(/["\\]/g, ' ').trim().slice(0, 120);
  const where = encodeURIComponent(`"${safe}"`);
  return `${opts.base ?? RAPPELCONSO_BASE}/${opts.dataset ?? RAPPELCONSO_DATASET}/records?where=${where}&limit=${opts.limit ?? 20}`;
}

export interface RecallRecord {
  key: string;
  gtins: string[];
  title: string;
  brand: string | null;
  product_name: string | null;
  reason: string | null;
  risks: string | null;
  recommended_action: string | null;
  official_url: string | null;
  image_url: string | null;
  published_on: string | null;
  lot_numbers: string[];
  category: string | null;
}

const CANDIDATES = {
  id: ['id', 'rappel_guid', 'rappelguid', 'reference_fiche', 'numero_fiche', 'id_fiche'],
  gtin: ['gtin', 'gtins', 'code_barre', 'codes_barres', 'code_barres', 'ean'],
  title: ['titre', 'titre_de_la_fiche', 'libelle'],
  name: ['libelle', 'noms_des_modeles_ou_references', 'modeles_ou_references', 'nom_produit', 'nom_du_produit'],
  brand: ['marque_produit', 'nom_de_la_marque_du_produit', 'marque'],
  reason: ['motif_rappel', 'motif_du_rappel'],
  risks: ['risques_encourus', 'risques_encourus_par_le_consommateur'],
  action: ['conduites_a_tenir_par_le_consommateur', 'conduite_a_tenir_par_le_consommateur', 'conduites_a_tenir'],
  url: ['lien_vers_la_fiche_rappel', 'lien_vers_la_fiche_de_rappel', 'lien_vers_la_fiche_rappelconso', 'url'],
  date: ['date_publication', 'date_de_publication'],
  lots: ['identification_produits', 'identification_des_produits'],
  image: ['liens_vers_les_images', 'lien_vers_les_images', 'images'],
  category: ['categorie_produit', 'categorie_de_produit'],
} as const;

function pick(r: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    const v = r[k];
    if (v != null && !(typeof v === 'string' && v.trim() === '') && !(Array.isArray(v) && v.length === 0)) return v;
  }
  return null;
}
const text = (v: unknown): string | null => {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String).join(', ').trim() || null;
  const s = String(v).trim();
  return s || null;
};

export const digits = (s: string) => s.replace(/\D/g, '');
/** Compare deux GTIN en ignorant les zéros de tête (EAN-13 / UPC-A / GTIN-14). */
export const sameGtin = (a: string, b: string) => {
  const x = digits(a).replace(/^0+/, '');
  const y = digits(b).replace(/^0+/, '');
  return x.length >= 7 && x === y;
};

function gtinsOf(v: unknown): string[] {
  if (v == null) return [];
  const raw = Array.isArray(v) ? v.map(String).join(' ') : String(v);
  return [...new Set((raw.match(/\d{8,14}/g) ?? []))];
}

/** Clé de contrôle GS1 (EAN-8, UPC-A, EAN-13, GTIN-14). */
export function validGtin(code: string): boolean {
  const d = digits(code);
  if (![8, 12, 13, 14].includes(d.length)) return false;
  const body = d.slice(0, -1).split('').reverse().map(Number);
  const sum = body.reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(d[d.length - 1]);
}

function isoDate(v: unknown): string | null {
  const s = text(v);
  if (!s) return null;
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const f = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return f ? `${f[3]}-${f[2]}-${f[1]}` : null;
}

function lotsOf(v: unknown): string[] {
  const s = text(v);
  if (!s) return [];
  const lots = [...s.matchAll(/lot\s*(?:n°|no|numéro|numero)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/.]{1,24})/gi)].map((m) => m[1]);
  return [...new Set(lots)].slice(0, 20);
}

function firstImage(v: unknown): string | null {
  const s = Array.isArray(v) ? String(v[0] ?? '') : text(v);
  if (!s) return null;
  const url = s.split(/\s*[|,\s]\s*/).find((x) => /^https?:\/\//.test(x));
  return url ?? null;
}

/** Lit la réponse de l'API (v2.1 : { results: [...] } ; v1 : { records: [{ fields }] } ; ou tableau brut). */
export function parseRecallRecords(payload: unknown): RecallRecord[] {
  const p = payload as { results?: unknown[]; records?: unknown[] } | unknown[];
  const list: unknown[] = Array.isArray(p) ? p : Array.isArray((p as { results?: unknown[] })?.results) ? (p as { results: unknown[] }).results : Array.isArray((p as { records?: unknown[] })?.records) ? (p as { records: unknown[] }).records : [];
  const out: RecallRecord[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const r = ((item as { fields?: unknown }).fields && typeof (item as { fields?: unknown }).fields === 'object' ? (item as { fields: Record<string, unknown> }).fields : item) as Record<string, unknown>;
    const name = text(pick(r, CANDIDATES.name));
    const brand = text(pick(r, CANDIDATES.brand));
    const title = text(pick(r, CANDIDATES.title)) ?? [brand, name].filter(Boolean).join(' — ');
    const url = text(pick(r, CANDIDATES.url));
    const id = text(pick(r, CANDIDATES.id)) ?? url ?? `${brand ?? ''}|${name ?? ''}|${text(pick(r, CANDIDATES.date)) ?? ''}`;
    if (!title) continue;
    out.push({
      key: `rappelconso:${id}`,
      // Champ GTIN dédié ; à défaut (ancien schéma), codes valides cités dans « identification des produits »
      gtins: (() => {
        const direct = gtinsOf(pick(r, CANDIDATES.gtin));
        return direct.length ? direct : gtinsOf(pick(r, CANDIDATES.lots)).filter(validGtin);
      })(),
      title,
      brand,
      product_name: name,
      reason: text(pick(r, CANDIDATES.reason)),
      risks: text(pick(r, CANDIDATES.risks)),
      recommended_action: text(pick(r, CANDIDATES.action)),
      official_url: url && /^https?:\/\//.test(url) ? url : null,
      image_url: firstImage(pick(r, CANDIDATES.image)),
      published_on: isoDate(pick(r, CANDIDATES.date)),
      lot_numbers: lotsOf(pick(r, CANDIDATES.lots)),
      category: text(pick(r, CANDIDATES.category)),
    });
  }
  return out;
}

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s: string) => fold(s).split(' ').filter((t) => t.length >= 3);

export interface RecallMatch { record: RecallRecord; match: 'gtin' | 'brand_name' }

/**
 * Correspondance avec UN produit précis :
 *  - « gtin » : code-barres identique (fiable) ;
 *  - « brand_name » : même marque ET au moins 60 % des mots du nom retrouvés (à vérifier par la personne).
 * Jamais de correspondance sur la marque seule.
 */
export function matchRecalls(records: RecallRecord[], product: { barcode?: string | null; brand?: string | null; name?: string | null }): RecallMatch[] {
  const out: RecallMatch[] = [];
  for (const r of records) {
    if (product.barcode && r.gtins.some((g) => sameGtin(g, product.barcode!))) {
      out.push({ record: r, match: 'gtin' });
      continue;
    }
    if (!product.brand || !product.name || !r.brand) continue;
    const b1 = fold(product.brand);
    const b2 = fold(r.brand);
    if (!b1 || !b2 || !(b1 === b2 || b1.includes(b2) || b2.includes(b1))) continue;
    const want = tokens(product.name).filter((t) => !tokens(product.brand!).includes(t));
    if (want.length === 0) continue;
    const hay = new Set(tokens(`${r.product_name ?? ''} ${r.title}`));
    const found = want.filter((t) => hay.has(t)).length;
    if (found / want.length >= 0.6) out.push({ record: r, match: 'brand_name' });
  }
  return out;
}

/** Ligne à mettre en cache dans public.product_recalls (écriture par la fonction serveur). */
export function recallRow(r: RecallRecord, barcode: string | null) {
  return {
    source_key: r.key,
    barcode: r.gtins[0] ?? barcode,
    gtins: r.gtins,
    lot_numbers: r.lot_numbers,
    title: r.title.slice(0, 300),
    brand: r.brand,
    product_name: r.product_name,
    reason: r.reason ?? 'Motif non précisé dans la fiche.',
    risks: r.risks,
    recommended_action: r.recommended_action,
    official_url: r.official_url ?? 'https://rappel.conso.gouv.fr',
    image_url: r.image_url,
    source: 'RappelConso (data.economie.gouv.fr)',
    published_on: r.published_on ?? new Date().toISOString().slice(0, 10),
    is_demo: false,
  };
}

// ---------------------------------------------------------------- appel réseau (fetch injectable pour les tests)
export type RecallFetch = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/**
 * Interroge RappelConso pour chaque terme (code-barres, « marque nom »).
 * `checked` n'est vrai que si la base officielle a répondu à TOUTES les requêtes : sinon, l'application
 * dit que la vérification n'a pas pu être faite (jamais « aucun rappel » par défaut).
 */
export async function fetchRecallRecords(terms: string[], o: { fetchImpl?: RecallFetch; dataset?: string; base?: string; timeoutMs?: number } = {}): Promise<{ records: RecallRecord[]; checked: boolean }> {
  const f = o.fetchImpl ?? (fetch as unknown as RecallFetch);
  const payloads = await Promise.all(terms.map(async (t) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? 8000);
    try {
      const res = await f(rappelConsoUrl(t, { dataset: o.dataset, base: o.base }), { headers: { Accept: 'application/json' }, signal: ctrl.signal });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }));
  return { records: payloads.flatMap((p) => (p ? parseRecallRecords(p) : [])), checked: terms.length > 0 && payloads.every((p) => p != null) };
}
