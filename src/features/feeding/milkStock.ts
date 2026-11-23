/**
 * 73 — Stock de lait maternel et 74 — rappels de conservation : logique pure (testée).
 *
 * Durées : AUCUNE n'est inventée. Les seules valeurs utilisées sont celles déjà publiées et sourcées dans le guide
 * HOMI « Allaiter ou tirer son lait en reprenant le travail » (src/content/articles/guide/b36.ts, section « La
 * conservation », mpedia d'après l'Anses : https://www.mpedia.fr/art-tirer-et-conserver-son-lait/) :
 * température ambiante 1 heure, réfrigérateur 48 heures, congélateur 4 mois, lait décongelé 24 heures au réfrigérateur.
 * Elles ne servent qu'à PRÉREMPLIR la date limite, que le parent vérifie et modifie selon les consignes de son
 * professionnel de santé ou de sa maternité (texte affiché à côté du champ).
 */
export type MilkLocation = 'fridge' | 'freezer' | 'room';
export type MilkStatus = 'stored' | 'used' | 'discarded';

export interface MilkItem {
  id: string; household_id: string; child_id: string | null; pumping_id: string | null; expressed_at: string; amount_ml: number;
  location: MilkLocation; thawed_at: string | null; use_by: string; status: MilkStatus; closed_at: string | null; note: string | null;
  created_by: string | null; created_at: string; updated_at: string; _pending?: boolean;
  /** 72 : contenant (sachet, biberon, pot, autre) et étiquette facultatifs */
  container?: MilkContainer | null; label?: string | null;
}
export type MilkContainer = 'bag' | 'bottle' | 'jar' | 'other';
export const MILK_CONTAINERS: MilkContainer[] = ['bag', 'bottle', 'jar', 'other'];

/** Durées du guide HOMI (heures), source ci-dessus. */
export const SOURCED_KEEP_HOURS: Record<MilkLocation, number> = { room: 1, fridge: 48, freezer: 24 * 30 * 4 };
export const SOURCED_THAWED_HOURS = 24;
export const KEEP_SOURCE = {
  article: 'allaiter-ou-tirer-son-lait-reprise-du-travail-droits-organisation-conservation',
  url: 'https://www.mpedia.fr/art-tirer-et-conserver-son-lait/',
} as const;

const addHours = (iso: string, h: number) => new Date(Date.parse(iso) + h * 3600_000).toISOString();
/** 4 mois calendaires (et non 120 jours) pour le congélateur. */
function addMonths(iso: string, n: number) {
  const d = new Date(iso);
  const day = d.getDate();
  d.setMonth(d.getMonth() + n);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString();
}

/** Date limite PRÉREMPLIE (modifiable) à partir de la date du tirage et du lieu. */
export function defaultUseBy(expressedAt: string, location: MilkLocation): string {
  return location === 'freezer' ? addMonths(expressedAt, 4) : addHours(expressedAt, SOURCED_KEEP_HOURS[location]);
}

/** Décongélation : passe au réfrigérateur ; la date limite devient « décongelé + 24 h » (jamais plus tard que l'ancienne). */
export function thaw(item: Pick<MilkItem, 'use_by'>, now: Date = new Date()): { location: MilkLocation; thawed_at: string; use_by: string } {
  const at = now.toISOString();
  const by = addHours(at, SOURCED_THAWED_HOURS);
  return { location: 'fridge', thawed_at: at, use_by: by < item.use_by ? by : item.use_by };
}

/** Ordre de consommation : le plus ancien d'abord (date du tirage), à égalité la date limite la plus proche. */
export function fifo(list: MilkItem[]): MilkItem[] {
  return list.filter((x) => x.status === 'stored').sort((a, b) => a.expressed_at.localeCompare(b.expressed_at) || a.use_by.localeCompare(b.use_by));
}

/** Délai d'alerte avant la date limite : 6 h (ambiante, réfrigérateur), 7 jours (congélateur). */
export const ALERT_BEFORE_HOURS: Record<MilkLocation, number> = { room: 0.5, fridge: 6, freezer: 24 * 7 };

export type Freshness = 'ok' | 'soon' | 'expired';
export function freshness(item: Pick<MilkItem, 'use_by' | 'location'>, now: Date = new Date()): Freshness {
  const left = Date.parse(item.use_by) - now.getTime();
  if (left <= 0) return 'expired';
  return left <= ALERT_BEFORE_HOURS[item.location] * 3600_000 ? 'soon' : 'ok';
}

/** Rappel « avant échéance » (74) : à programmer à ce moment-là, s'il est encore à venir. */
export function alertAt(item: Pick<MilkItem, 'use_by' | 'location'>, now: Date = new Date()): string | null {
  const at = Date.parse(item.use_by) - ALERT_BEFORE_HOURS[item.location] * 3600_000;
  return at > now.getTime() ? new Date(at).toISOString() : null;
}

/** Totaux du stock (contenants rangés) par lieu. */
export function totals(list: MilkItem[]): Record<MilkLocation, { count: number; ml: number }> {
  const out: Record<MilkLocation, { count: number; ml: number }> = { fridge: { count: 0, ml: 0 }, freezer: { count: 0, ml: 0 }, room: { count: 0, ml: 0 } };
  for (const x of list) if (x.status === 'stored') { out[x.location].count++; out[x.location].ml += x.amount_ml; }
  return out;
}

/** Séances de tire-lait pas encore rangées (aucun contenant relié) : proposées pour éviter une seconde saisie. */
export function unstoredPumpings<P extends { id: string; amount_ml: number; at: string }>(pumpings: P[], stock: MilkItem[], sinceHours = 72, now: Date = new Date()): P[] {
  const linked = new Set(stock.map((s) => s.pumping_id).filter(Boolean));
  const from = now.getTime() - sinceHours * 3600_000;
  return pumpings.filter((p) => !linked.has(p.id) && p.amount_ml > 0 && Date.parse(p.at) >= from).sort((a, b) => b.at.localeCompare(a.at));
}

export function validateMilk(d: { amount: number | null; expressedAt: string | null; useBy: string | null }): 'milk.err.amount' | 'milk.err.date' | 'milk.err.useBy' | null {
  if (d.amount == null || !Number.isInteger(d.amount) || d.amount < 1 || d.amount > 1000) return 'milk.err.amount';
  if (!d.expressedAt || Number.isNaN(Date.parse(d.expressedAt))) return 'milk.err.date';
  if (!d.useBy || Number.isNaN(Date.parse(d.useBy)) || Date.parse(d.useBy) <= Date.parse(d.expressedAt)) return 'milk.err.useBy';
  return null;
}

// ---------------------------------------------------------------- 72 lots et contenants (séance de tire-lait)
/** Partage d'une quantité en n contenants entiers (le reste va aux premiers) : 200 ml en 3 → 67, 67, 66. */
export function splitAmount(total: number, n: number): number[] {
  const k = Math.max(1, Math.min(10, Math.floor(n)));
  if (!Number.isFinite(total) || total < k) return [];
  const base = Math.floor(total / k);
  const rest = total - base * k;
  return Array.from({ length: k }, (_, i) => base + (i < rest ? 1 : 0));
}

/** Quantité d'une séance pas encore rangée (contenants rangés, utilisés ou jetés comptent tous). */
export function pumpingRemaining(p: { id: string; amount_ml: number }, stock: Pick<MilkItem, 'pumping_id' | 'amount_ml' | 'id'>[], exceptId?: string | null): number {
  const stored = stock.filter((s) => s.pumping_id === p.id && s.id !== exceptId).reduce((sum, s) => sum + s.amount_ml, 0);
  return Math.max(0, p.amount_ml - stored);
}

/** Contenants d'une même séance : « lot » (le premier contenant donne la date). */
export function lotsOf(stock: MilkItem[]): { pumping_id: string; items: MilkItem[]; ml: number }[] {
  const map = new Map<string, MilkItem[]>();
  for (const s of stock) if (s.pumping_id) map.set(s.pumping_id, [...(map.get(s.pumping_id) ?? []), s]);
  return [...map].map(([pumping_id, items]) => ({ pumping_id, items: items.sort((a, b) => a.created_at.localeCompare(b.created_at)), ml: items.reduce((x, i) => x + i.amount_ml, 0) }));
}

/** Contrôle d'un partage : chaque contenant de 1 à 1000 ml, total dans la limite de la séance. */
export function validateSplit(amounts: (number | null)[], max: number | null): 'milk.err.amount' | 'milk.err.split' | null {
  if (!amounts.length || amounts.some((a) => a == null || !Number.isInteger(a) || a < 1 || a > 1000)) return 'milk.err.amount';
  if (max != null && amounts.reduce<number>((s, a) => s + (a ?? 0), 0) > max) return 'milk.err.split';
  return null;
}
