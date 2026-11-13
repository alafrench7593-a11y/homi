/**
 * Courses et stocks du foyer (15/11/2026, phase 6) — règles pures, miroir de 20261115000200_courses_stocks.sql.
 * Voir HOMI_SHOPPING_STOCKS_SPEC.md.
 *  - Niveau d'un stock : « bas » seulement si la famille a saisi la quantité ESTIMÉE et le seuil (jamais inventé).
 *  - Réapprovisionnement : HOMI suggère (état « suggested ») ; une mission n'existe qu'après confirmation.
 *  - Doublons : même produit non coché dans la liste → proposer de fusionner, jamais en silence.
 *  - Garde-manger local (ancien) → stocks du foyer : client_id déterministe (même foyer + même ingrédient = même
 *    saisie, sur tous les appareils), rien n'est perdu, rien n'est créé deux fois.
 */
import type { IconName } from '@/components/ui';
import type { TKey } from '@/i18n';
import type { TaskCategory } from './familyLoad';

export type StockCategory = 'diapers' | 'wipes' | 'milk' | 'laundry' | 'toilet_paper' | 'cleaning' | 'pet_food' | 'food' | 'other';
export type RestockState = 'ok' | 'suggested' | 'dismissed' | 'ordered' | 'bought';
export type StockUnit = 'u' | 'paquet' | 'boite' | 'bouteille' | 'rouleau' | 'sac' | 'kg' | 'l' | 'g' | 'ml';
export type StockLevel = 'unknown' | 'ok' | 'low' | 'out';

export interface Stock {
  id: string; household_id: string; label: string; category: StockCategory; brand: string | null; size: string | null;
  qty_estimate: number | string | null; unit: StockUnit | null; threshold: number | string | null; frequency_days: number | null;
  responsible_id: string | null; reminder: boolean; child_id: string | null; pet_id: string | null; ingredient_key: string | null;
  source: 'manual' | 'pantry'; notes: string | null; restock_state: RestockState; low_since: string | null;
  restock_task_id: string | null; restock_item_id: string | null; last_purchase_at: string | null; last_validated_by: string | null;
  client_id: string | null; version: number; created_by: string | null; created_at: string; updated_at: string;
}

export const STOCK_CATEGORIES: { key: StockCategory; icon: IconName; label: TKey }[] = [
  { key: 'diapers', icon: 'wind', label: 'stk.cat.diapers' },
  { key: 'wipes', icon: 'layers', label: 'stk.cat.wipes' },
  { key: 'milk', icon: 'coffee', label: 'stk.cat.milk' },
  { key: 'laundry', icon: 'refresh-cw', label: 'stk.cat.laundry' },
  { key: 'toilet_paper', icon: 'file', label: 'stk.cat.toilet_paper' },
  { key: 'cleaning', icon: 'droplet', label: 'stk.cat.cleaning' },
  { key: 'pet_food', icon: 'heart', label: 'stk.cat.pet_food' },
  { key: 'food', icon: 'shopping-bag', label: 'stk.cat.food' },
  { key: 'other', icon: 'package', label: 'stk.cat.other' },
];
export const STOCK_UNITS: StockUnit[] = ['u', 'paquet', 'boite', 'bouteille', 'rouleau', 'sac', 'kg', 'l', 'g', 'ml'];
export const categoryInfo = (k: string | null | undefined) => STOCK_CATEGORIES.find((c) => c.key === k) ?? STOCK_CATEGORIES[STOCK_CATEGORIES.length - 1];

/** Onglet d'entrée selon la catégorie : couches, lingettes, lait → Bébé ; le reste → Famille. */
export const BABY_STOCK_CATEGORIES: StockCategory[] = ['diapers', 'wipes', 'milk'];
export const stockHub = (c: StockCategory): 'baby' | 'family' => (BABY_STOCK_CATEGORIES.includes(c) ? 'baby' : 'family');

const num = (v: number | string | null | undefined): number | null => (v == null || v === '' ? null : Number(v));

/** Niveau (miroir de household_stocks_guard) : « inconnu » tant que la quantité n'est pas saisie. */
export function stockLevel(s: Pick<Stock, 'qty_estimate' | 'threshold'>): StockLevel {
  const q = num(s.qty_estimate);
  const th = num(s.threshold);
  if (q == null) return 'unknown';
  if (q === 0 && th != null) return 'out';
  if (th != null && q <= th) return 'low';
  return 'ok';
}
export const isLow = (s: Pick<Stock, 'qty_estimate' | 'threshold'>) => ['low', 'out'].includes(stockLevel(s));

/** À mettre en avant (sans culpabiliser) : suggestion, mission en cours, achat à valider, ou niveau bas. */
export function needsAttention(s: Pick<Stock, 'qty_estimate' | 'threshold' | 'restock_state'>): boolean {
  if (s.restock_state === 'bought' || s.restock_state === 'suggested' || s.restock_state === 'ordered') return true;
  return s.restock_state === 'ok' && isLow(s);
}

/** Ordre d'affichage : à prévoir d'abord (achat à valider, suggestion, mission, bas), puis par catégorie et libellé. */
const ATTENTION_RANK: Record<RestockState, number> = { bought: 0, suggested: 1, ordered: 2, ok: 3, dismissed: 4 };
export function sortStocks<S extends Pick<Stock, 'label' | 'category' | 'qty_estimate' | 'threshold' | 'restock_state'>>(list: S[]): S[] {
  const cat = (c: StockCategory) => STOCK_CATEGORIES.findIndex((x) => x.key === c);
  return [...list].sort((a, b) => Number(needsAttention(b)) - Number(needsAttention(a))
    || ATTENTION_RANK[a.restock_state] - ATTENTION_RANK[b.restock_state]
    || cat(a.category) - cat(b.category) || a.label.localeCompare(b.label, 'fr'));
}

/** Catégorie de la mission de réapprovisionnement (miroir de stock_restock). */
export function missionCategoryOf(c: StockCategory): TaskCategory {
  if (c === 'pet_food') return 'pets';
  if (BABY_STOCK_CATEGORIES.includes(c)) return 'diapers';
  return 'shopping';
}
/** Produit associé à la mission et à l'article : libellé + taille (« Couches taille 4 »). */
export const productLabelOf = (s: Pick<Stock, 'label' | 'size'>) => `${s.label}${s.size ? ` ${s.size}` : ''}`.trim().slice(0, 120);

/** Quantité après validation d'un achat (« add » : ajoutée à l'estimation ; « set » : nouvelle estimation). */
export function quantityAfterPurchase(before: number | string | null, qty: number, mode: 'add' | 'set'): number {
  if (!(qty >= 0) || (mode === 'add' && qty === 0)) throw new Error('quantity');
  return mode === 'set' ? qty : (num(before) ?? 0) + qty;
}

// ---------------------------------------------------------------- doublons dans la liste de courses
/** Libellé comparable (miroir de _norm_label) : minuscules, espaces réduits. */
export const normalizeLabel = (s: string | null | undefined) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export interface ItemLike { id: string; label: string; checked: boolean; size?: string | null; brand?: string | null; qty?: number | string | null; unit?: string | null }

const sameProduct = (a: Pick<ItemLike, 'label' | 'size'>, b: Pick<ItemLike, 'label' | 'size'>) =>
  normalizeLabel(a.label) === normalizeLabel(b.label) && (!a.size || !b.size || normalizeLabel(a.size) === normalizeLabel(b.size));

/** Article identique encore à acheter (même produit, non coché) : à proposer de fusionner avant d'ajouter. */
export function findDuplicate<I extends ItemLike>(items: I[], candidate: Pick<ItemLike, 'label' | 'size'>): I | null {
  return items.find((i) => !i.checked && sameProduct(i, candidate)) ?? null;
}

/** Groupes de doublons déjà présents (ajouts simultanés sur deux appareils, hors ligne) : [gardé, ...à fusionner]. */
export function duplicateGroups<I extends ItemLike>(items: I[]): I[][] {
  const seen = new Map<string, I[]>();
  for (const i of items) {
    if (i.checked) continue;
    const k = `${normalizeLabel(i.label)}|${normalizeLabel(i.size)}`;
    seen.set(k, [...(seen.get(k) ?? []), i]);
  }
  return [...seen.values()].filter((g) => g.length > 1);
}

/** Quantité fusionnée (miroir de merge_shopping_items) : somme si les deux en ont une dans la même unité. */
export function mergedQty(keep: Pick<ItemLike, 'qty' | 'unit'>, drop: Pick<ItemLike, 'qty' | 'unit'>): number | null {
  const a = num(keep.qty);
  const b = num(drop.qty);
  if (a != null && b != null && (keep.unit ?? null) === (drop.unit ?? null)) return a + b;
  return a ?? b;
}

/** Stock correspondant à un produit (miroir de _stock_match) : même libellé, ou libellé + taille. */
export function stockMatch<S extends Pick<Stock, 'id' | 'label' | 'size' | 'created_at'>>(stocks: S[], label: string): S | null {
  const n = normalizeLabel(label);
  return [...stocks].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .find((s) => normalizeLabel(s.label) === n || normalizeLabel(`${s.label} ${s.size ?? ''}`) === n) ?? null;
}

// ---------------------------------------------------------------- migration du garde-manger local
/** Identifiant déterministe (forme UUID v5) : même texte → même identifiant, sur tous les appareils. */
export function stableId(text: string): string {
  const parts: string[] = [];
  for (const seed of [0x811c9dc5, 0x01000193, 0x9e3779b1, 0x85ebca6b]) {
    let h = seed >>> 0;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; h = (h ^ (h >>> 13)) >>> 0; }
    parts.push(h.toString(16).padStart(8, '0'));
  }
  const hex = parts.join('').split('');
  hex[12] = '5';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const x = hex.join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
export const pantryClientId = (householdId: string, key: string) => stableId(`pantry:${householdId}:${key}`);

export interface PantryRow {
  household_id: string; client_id: string; label: string; category: 'food'; ingredient_key: string; source: 'pantry';
  qty_estimate: null; threshold: null;
}
/**
 * Lignes à créer pour migrer le garde-manger local : une par ingrédient absent du serveur (déjà migré par un autre
 * appareil = rien à refaire), sans quantité (la famille ne l'avait jamais saisie : on ne l'invente pas).
 */
export function pantryMigrationRows(keys: string[], householdId: string, existing: Pick<Stock, 'ingredient_key'>[], labelOf: (k: string) => string): PantryRow[] {
  const have = new Set(existing.map((s) => s.ingredient_key).filter(Boolean));
  const out: PantryRow[] = [];
  for (const k of [...new Set(keys)]) {
    if (!/^[a-z0-9_]{1,60}$/.test(k) || have.has(k)) continue;
    out.push({ household_id: householdId, client_id: pantryClientId(householdId, k), label: (labelOf(k) || k).slice(0, 80), category: 'food',
      ingredient_key: k, source: 'pantry', qty_estimate: null, threshold: null });
  }
  return out;
}
/** Ingrédients « à la maison » lus sur le serveur (source de vérité) : stocks liés à un ingrédient, pas à zéro. */
export const pantryKeysOf = (stocks: Pick<Stock, 'ingredient_key' | 'qty_estimate'>[]) =>
  stocks.filter((s) => s.ingredient_key && num(s.qty_estimate) !== 0).map((s) => s.ingredient_key as string);
