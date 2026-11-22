/**
 * Siestes comparables et fenêtre INDICATIVE de réveil (module PUR, sans import : partagé par l'application et par la
 * fonction `assistant`, qui RECALCULE la fenêtre à partir des durées reçues au lieu de croire les chiffres envoyés).
 *
 * Règle de production (documentée dans docs/SOMMEIL_ANALYSE.md, testée) :
 *  1. Siestes comparables = même enfant ; sieste de jour TERMINÉE (`kind` 'nap', ou sans type : début entre 7 h et 20 h,
 *     même jour civil local au début et à la fin) ; durée entre 10 et 240 min ; commencée dans les 14 jours avant la
 *     sieste en cours ; heure de début à ±2 h de celle de la sieste en cours (une sieste du matin n'est pas comparée à
 *     celle de l'après-midi, souvent plus longue) ; on garde les 6 plus récentes.
 *  2. Moins de 4 siestes comparables → pas de fenêtre (« pas encore assez de siestes comparables »).
 *  3. Plage centrale : durées triées, on écarte ⌊n/6⌋ valeurs à chaque extrémité (6 siestes → la plus courte et la plus
 *     longue) ; la plage est [plus petite gardée ; plus grande gardée]. Elle contient au moins les deux tiers des siestes.
 *  4. Plage plus large que 90 min → pas de fenêtre (siestes trop dispersées pour qu'une fenêtre ait un sens).
 *  5. Fenêtre = début de la sieste en cours + bornes de la plage. Une INDICATION tirée de l'historique : jamais une
 *     consigne de réveiller l'enfant ni de le laisser dormir.
 */

export interface NapRecord {
  child_id: string;
  started_at: string;
  ended_at: string | null;
  kind?: string | null;
}

export const NAP_RULE = {
  windowDays: 14,
  maxSamples: 6,
  minSamples: 4,
  minMinutes: 10,
  maxMinutes: 240,
  slotMinutes: 120,
  maxSpreadMinutes: 90,
  dayStartHour: 7,
  dayEndHour: 20,
} as const;

export interface NapSample { started_at: string; minutes: number }

export type NapWindowStatus = 'ok' | 'insufficient' | 'dispersed';

export interface NapWindow {
  status: NapWindowStatus;
  /** Siestes comparées (les plus récentes d'abord). */
  samples: NapSample[];
  /** Bornes de la plage centrale (minutes), null sans fenêtre. */
  low: number | null;
  high: number | null;
  /** Nombre de siestes comparées dont la durée est dans la plage. */
  inRange: number;
  /** Période couverte par les siestes comparées (dates ISO de la plus ancienne et de la plus récente). */
  periodFrom: string | null;
  periodTo: string | null;
}

const MIN = 60_000;
const minutesOf = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / MIN);
/** Minutes depuis minuit, HEURE LOCALE de l'appareil (la fonction serveur ne s'en sert pas : elle reçoit des durées). */
const localMinuteOfDay = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };
const sameLocalDay = (a: string, b: string) => { const x = new Date(a); const y = new Date(b); return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate(); };

/** Une sieste de jour terminée, utilisable comme point de comparaison ? */
export function isComparableNap(r: NapRecord): boolean {
  if (!r.ended_at) return false;
  const m = minutesOf(r.started_at, r.ended_at);
  if (!Number.isFinite(m) || m < NAP_RULE.minMinutes || m > NAP_RULE.maxMinutes) return false;
  if (r.kind === 'night') return false;
  if (r.kind === 'nap') return true;
  const h = new Date(r.started_at).getHours();
  return h >= NAP_RULE.dayStartHour && h < NAP_RULE.dayEndHour && sameLocalDay(r.started_at, r.ended_at);
}

/** Écart d'heure de début (minutes, sur un cercle de 24 h). */
const slotGap = (a: number, b: number) => { const d = Math.abs(a - b) % 1440; return Math.min(d, 1440 - d); };

/** Siestes comparables à une sieste de `childId` commencée à `currentStart` (6 au plus, plus récentes d'abord). */
export function comparableNaps(all: readonly NapRecord[], childId: string, currentStart: string): NapSample[] {
  const start = Date.parse(currentStart);
  const since = start - NAP_RULE.windowDays * 1440 * MIN;
  const slot = localMinuteOfDay(currentStart);
  return all
    .filter((r) => r.child_id === childId && isComparableNap(r))
    .filter((r) => { const s = Date.parse(r.started_at); return s < start && s >= since && Date.parse(r.ended_at!) <= start; })
    .filter((r) => slotGap(localMinuteOfDay(r.started_at), slot) <= NAP_RULE.slotMinutes)
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
    .slice(0, NAP_RULE.maxSamples)
    .map((r) => ({ started_at: r.started_at, minutes: minutesOf(r.started_at, r.ended_at!) }));
}

/** Plage centrale et statut à partir de DURÉES seules (ce que recalcule le serveur). */
export function napRange(minutes: readonly number[]): Pick<NapWindow, 'status' | 'low' | 'high' | 'inRange'> {
  const ok = minutes.filter((m) => Number.isFinite(m) && m >= NAP_RULE.minMinutes && m <= NAP_RULE.maxMinutes).slice(0, NAP_RULE.maxSamples);
  if (ok.length < NAP_RULE.minSamples) return { status: 'insufficient', low: null, high: null, inRange: 0 };
  const s = [...ok].sort((a, b) => a - b);
  const k = Math.floor(s.length / 6);
  const low = s[k];
  const high = s[s.length - 1 - k];
  if (high - low > NAP_RULE.maxSpreadMinutes) return { status: 'dispersed', low: null, high: null, inRange: 0 };
  return { status: 'ok', low, high, inRange: s.filter((m) => m >= low && m <= high).length };
}

export function napWindow(all: readonly NapRecord[], childId: string, currentStart: string): NapWindow {
  const samples = comparableNaps(all, childId, currentStart);
  const r = napRange(samples.map((x) => x.minutes));
  return {
    ...r,
    samples,
    periodFrom: samples.length ? samples[samples.length - 1].started_at : null,
    periodTo: samples.length ? samples[0].started_at : null,
  };
}

/** « 13:10 » + 55 min → « 14:05 » (cadran de 24 h). */
export function addMinutesHM(hm: string, minutes: number): string | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hm);
  if (!m || !Number.isFinite(minutes)) return null;
  const t = ((Number(m[1]) * 60 + Number(m[2]) + Math.round(minutes)) % 1440 + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** Où en est la sieste en cours par rapport à la fenêtre (affichage : « avant », « dans », « au-delà »). */
export function napProgress(w: Pick<NapWindow, 'status' | 'low' | 'high'>, elapsedMinutes: number): 'none' | 'before' | 'inside' | 'beyond' {
  if (w.status !== 'ok' || w.low == null || w.high == null) return 'none';
  if (elapsedMinutes < w.low) return 'before';
  return elapsedMinutes <= w.high ? 'inside' : 'beyond';
}
