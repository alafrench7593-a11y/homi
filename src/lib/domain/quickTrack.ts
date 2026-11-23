/**
 * Journaux rapides « Mesures et quantités » (biberons, couches) et résumés des catégories « Alimentation » et « Soins »
 * pour UN enfant. Pur, testé (src/__tests__/quickTrack.test.ts). Une seule donnée source : les tables `bottles`,
 * `breastfeeds`, `food_introductions` et `diapers` — rien n'est recopié.
 *
 *  - Jour sans aucune saisie → `null` (« rien de noté »), jamais 0. Un jour avec des biberons dont AUCUNE quantité bue
 *    n'a été notée reste lui aussi `ml: null` (on sait qu'il y a eu des biberons, pas combien ils ont bu).
 *  - On n'additionne que des grandeurs de même nature : millilitres avec millilitres, minutes avec minutes, aliments
 *    avec aliments. Aucune somme croisée n'est proposée.
 *  - Un biberon « en direct » (`in_progress`) n'est pas encore une prise : il n'entre dans aucun total.
 */
export interface BottleLike { id: string; child_id: string; at: string; consumed_ml: number | null; prepared_ml?: number | null; in_progress?: boolean | null; note?: string | null }
export interface FeedLike { id: string; child_id: string; started_at: string; ended_at: string | null; side?: string | null }
export interface FoodLike { id: string; child_id: string; food_name: string; status: string; first_tried_on: string | null }
export interface DiaperLike { id: string; child_id: string; at: string; wet: boolean; stool: boolean; note?: string | null }

export type DiaperType = 'wet' | 'stool' | 'both' | 'none';

export interface DayBottles { day: string; ml: number | null; count: number; withQuantity: number; entries: BottleLike[] }
export interface DayFeeds { day: string; minutes: number | null; count: number; entries: FeedLike[] }
export interface DayFoods { day: string; count: number | null; entries: FoodLike[] }
export interface DayDiapers { day: string; count: number | null; wet: number; stool: number; both: number; entries: DiaperLike[] }

const MIN = 60_000;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Les `days` derniers jours civils locaux jusqu'à `now` inclus (plus ancien d'abord). */
export function dayKeys(now: Date, days: number): string[] {
  return Array.from({ length: Math.max(1, days) }, (_, i) => dayKey(addDays(now, i - (Math.max(1, days) - 1))));
}

const localDay = (iso: string) => dayKey(new Date(iso));
const byTimeAsc = <T>(get: (x: T) => string) => (a: T, b: T) => get(a).localeCompare(get(b));

/** Une prise terminée de cet enfant (jamais un biberon encore en direct). */
const isTaken = (b: BottleLike, childId: string) => b.child_id === childId && !b.in_progress && !Number.isNaN(Date.parse(b.at));

/** Millilitres bus par jour (quantité « bue » seulement : la quantité préparée n'est pas ce que l'enfant a pris). */
export function bottlesByDay(all: readonly BottleLike[], childId: string, now: Date, days: number): DayBottles[] {
  const keys = dayKeys(now, days);
  const map = new Map(keys.map((k) => [k, [] as BottleLike[]]));
  for (const b of all) {
    if (!isTaken(b, childId) || Date.parse(b.at) > now.getTime()) continue;
    map.get(localDay(b.at))?.push(b);
  }
  return keys.map((day) => {
    const entries = map.get(day)!.sort(byTimeAsc((b) => b.at));
    const known = entries.filter((b) => typeof b.consumed_ml === 'number');
    return { day, count: entries.length, withQuantity: known.length, ml: known.length ? known.reduce((n, b) => n + (b.consumed_ml as number), 0) : null, entries };
  });
}

/** Durée d'une tétée en minutes ; `null` si elle n'a pas de fin notée (jamais comptée comme 0). */
export function feedMinutes(f: FeedLike): number | null {
  if (!f.ended_at) return null;
  const m = Math.round((Date.parse(f.ended_at) - Date.parse(f.started_at)) / MIN);
  return Number.isFinite(m) && m >= 0 ? m : null;
}

/** Minutes de tétée par jour (jour du début de la tétée). */
export function feedsByDay(all: readonly FeedLike[], childId: string, now: Date, days: number): DayFeeds[] {
  const keys = dayKeys(now, days);
  const map = new Map(keys.map((k) => [k, [] as FeedLike[]]));
  for (const f of all) {
    if (f.child_id !== childId || Number.isNaN(Date.parse(f.started_at)) || Date.parse(f.started_at) > now.getTime()) continue;
    map.get(localDay(f.started_at))?.push(f);
  }
  return keys.map((day) => {
    const entries = map.get(day)!.sort(byTimeAsc((f) => f.started_at));
    const known = entries.map(feedMinutes).filter((m): m is number => m != null);
    return { day, count: entries.length, minutes: known.length ? known.reduce((n, m) => n + m, 0) : null, entries };
  });
}

/** Aliments découverts par jour : première fois goûtée (`first_tried_on`, date civile), statut autre que « pas encore ». */
export function foodsByDay(all: readonly FoodLike[], childId: string, now: Date, days: number): DayFoods[] {
  const keys = dayKeys(now, days);
  const map = new Map(keys.map((k) => [k, [] as FoodLike[]]));
  for (const f of all) {
    if (f.child_id !== childId || f.status === 'not_yet' || !f.first_tried_on) continue;
    map.get(f.first_tried_on.slice(0, 10))?.push(f);
  }
  return keys.map((day) => {
    const entries = map.get(day)!.sort((a, b) => a.food_name.localeCompare(b.food_name));
    return { day, count: entries.length ? entries.length : null, entries };
  });
}

export function diaperType(d: Pick<DiaperLike, 'wet' | 'stool'>): DiaperType {
  return d.wet && d.stool ? 'both' : d.wet ? 'wet' : d.stool ? 'stool' : 'none';
}

/** Couches par jour, avec la répartition mouillée / selles / les deux (une couche n'est comptée qu'une fois). */
export function diapersByDay(all: readonly DiaperLike[], childId: string, now: Date, days: number): DayDiapers[] {
  const keys = dayKeys(now, days);
  const map = new Map(keys.map((k) => [k, [] as DiaperLike[]]));
  for (const d of all) {
    if (d.child_id !== childId || Number.isNaN(Date.parse(d.at)) || Date.parse(d.at) > now.getTime()) continue;
    map.get(localDay(d.at))?.push(d);
  }
  return keys.map((day) => {
    const entries = map.get(day)!.sort(byTimeAsc((d) => d.at));
    const n = (t: DiaperType) => entries.filter((d) => diaperType(d) === t).length;
    return { day, count: entries.length ? entries.length : null, wet: n('wet'), stool: n('stool'), both: n('both'), entries };
  });
}

/** Total d'une période : somme des seuls jours renseignés ; `null` si aucun ne l'est. */
export function knownTotal(values: readonly (number | null)[]): { total: number | null; knownDays: number } {
  const known = values.filter((v): v is number => v != null);
  return { total: known.length ? known.reduce((a, b) => a + b, 0) : null, knownDays: known.length };
}

/** Dernière prise terminée de cet enfant (jamais un biberon encore en direct ni une heure future). */
export function lastBottle<T extends BottleLike>(all: readonly T[], childId: string, now: Date = new Date()): T | null {
  return [...all].filter((b) => isTaken(b, childId) && Date.parse(b.at) <= now.getTime() + MIN).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

/**
 * Quantité proposée pour une saisie à une main : la dernière quantité BUE notée par le parent pour cet enfant
 * (reprise, jamais une recommandation) ; `null` s'il n'en a jamais noté.
 */
export function lastConsumedMl(all: readonly BottleLike[], childId: string): number | null {
  const b = [...all].filter((x) => isTaken(x, childId) && typeof x.consumed_ml === 'number').sort((a, c) => c.at.localeCompare(a.at))[0];
  return b ? (b.consumed_ml as number) : null;
}

/** Dernière prise d'alimentation (biberon ou tétée) : ce qui est arrivé le plus récemment. */
export function lastFeeding(bottles: readonly BottleLike[], feeds: readonly FeedLike[], childId: string, now: Date = new Date()):
  { kind: 'bottle'; at: string; item: BottleLike } | { kind: 'breastfeed'; at: string; item: FeedLike } | null {
  const b = lastBottle(bottles, childId, now);
  const f = [...feeds].filter((x) => x.child_id === childId && Date.parse(x.started_at) <= now.getTime()).sort((a, c) => c.started_at.localeCompare(a.started_at))[0] ?? null;
  if (!b && !f) return null;
  if (b && (!f || b.at >= f.started_at)) return { kind: 'bottle', at: b.at, item: b };
  return { kind: 'breastfeed', at: f!.started_at, item: f! };
}

/** Dernière couche de cet enfant. */
export function lastDiaper<T extends DiaperLike>(all: readonly T[], childId: string): T | null {
  return [...all].filter((d) => d.child_id === childId).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

/** Minutes écoulées depuis `iso` (jamais négatif). */
export const minutesSince = (iso: string, now: Date) => Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / MIN));

/**
 * Correction de l'heure d'une saisie : « 14:20 », « 14h20 », « 1420 », « 9:05 » → même jour civil que l'heure
 * d'origine. `null` si l'heure est invalide ou si elle tombe dans le futur.
 */
export function proposedTime(originalIso: string, hhmm: string, now: Date = new Date()): Date | null {
  const m = /^([01]?\d|2[0-3])[:h]?([0-5]\d)$/.exec(hhmm.trim().replace(/\s+/g, '').toLowerCase());
  if (!m) return null;
  const a = new Date(originalIso);
  if (Number.isNaN(a.getTime())) return null;
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate(), Number(m[1]), Number(m[2]));
  return b.getTime() > now.getTime() + MIN ? null : b;
}

/** « 14:05 » (24 h, deux chiffres) : valeur d'un champ d'heure. */
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Quantité saisie (ml) : entier de 0 à 500, sinon `null`. */
export function clampMl(n: number): number {
  return Math.max(0, Math.min(500, Math.round(n)));
}
export function parseMlText(s: string): number | null {
  const v = s.trim();
  if (!/^\d{1,3}$/.test(v)) return null;
  const n = Number(v);
  return n <= 500 ? n : null;
}

/** Modification d'une couche (type) : les détails des selles disparaissent si la couche n'a plus de selles. */
export function diaperPatch(type: Exclude<DiaperType, 'none'>): { wet: boolean; stool: boolean; stool_color?: null; stool_consistency?: null; blood_seen?: false } {
  const wet = type !== 'stool'; const stool = type !== 'wet';
  return stool ? { wet, stool } : { wet, stool, stool_color: null, stool_consistency: null, blood_seen: false };
}

/** Une modification de biberon cohérente : la quantité bue ne dépasse jamais la quantité préparée notée. */
export function bottleEditError(input: { consumed: number | null; prepared: number | null | undefined }): 'over' | 'range' | null {
  if (input.consumed != null && (input.consumed < 0 || input.consumed > 500)) return 'range';
  if (input.consumed != null && input.prepared != null && input.consumed > input.prepared) return 'over';
  return null;
}

/**
 * Gardes F-05 du formulaire manuel (une correction ne passe que si l'entrée n'a pas changé depuis son ouverture) :
 * chaque champ modifié qui existait dans l'original avec une valeur simple doit être inchangé.
 */
export function editGuards(patch: Record<string, unknown>, original: Record<string, unknown>): { col: string; op: 'eq' | 'is'; value: unknown }[] {
  return Object.keys(patch)
    .filter((k) => k in original && (original[k] === null || ['string', 'number', 'boolean'].includes(typeof original[k])))
    .map((k) => (original[k] === null ? { col: k, op: 'is' as const, value: null } : { col: k, op: 'eq' as const, value: original[k] }));
}
