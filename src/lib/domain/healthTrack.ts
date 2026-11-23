/**
 * Santé et soins — suivi (22/11/2026) : fonctions PURES, testées (src/__tests__/healthTrack.test.ts).
 *
 * Une seule donnée source par mini-app (jamais de copie) :
 *  · observations de l'enfant (température, symptômes, digestion, note) → table `child_observations` ;
 *  · prises de médicament → `treatment_logs` / `my_treatment_logs` (heure de prise = `logged_at`) ;
 *  · humeur sur une échelle 1 → 5 → `mood_checkins` (adulte) et `child_wellbeing` (enfant).
 *
 * Règles : un jour sans saisie reste « rien de noté » (`null`, jamais 0) ; on ne compte ensemble que des données de
 * même nature ; aucune interprétation médicale (pas de « fièvre », pas de seuil, pas de moyenne d'humeur, aucune dose).
 */
import { dayKey, dayKeys } from './quickTrack';
import type { CurvePoint } from './measureCurve';

const MIN = 60_000;

// ---------------------------------------------------------------- observations de l'enfant

export type ObsKind = 'temperature' | 'medication' | 'symptom' | 'note' | 'vomit' | 'regurgitation' | 'diarrhea' | 'abdominal_pain' | 'bloating' | 'crying';
export interface ObsLike {
  id: string; child_id: string; at: string; kind: ObsKind; value_num: number | string | null; label: string | null;
  note?: string | null; temp_method?: string | null; intensity?: number | null;
}
export const OBS_KINDS: readonly ObsKind[] = ['temperature', 'symptom', 'vomit', 'regurgitation', 'diarrhea', 'abdominal_pain', 'bloating', 'crying', 'medication', 'note'];
/** Types notés avec une intensité (1 → 3) plutôt qu'un libellé. */
export const INTENSITY_KINDS: readonly ObsKind[] = ['vomit', 'regurgitation', 'diarrhea', 'abdominal_pain', 'bloating', 'crying'];

/** Bornes de SAISIE d'une température (°C) : celles de la base (30 → 45) resserrées aux valeurs plausibles d'un thermomètre. */
export const TEMP_MIN = 34;
export const TEMP_MAX = 43;
export const TEMP_STEP = 0.1;

/** Température lisible (« 38,4 » ou 38.4) ; `null` hors bornes ou illisible — jamais arrondie à une valeur inventée. */
export function tempValue(o: Pick<ObsLike, 'kind' | 'value_num'>): number | null {
  if (o.kind !== 'temperature' || o.value_num == null || o.value_num === '') return null;
  const v = Number(String(o.value_num).replace(',', '.'));
  return Number.isFinite(v) && v >= 30 && v <= 45 ? Math.round(v * 100) / 100 : null;
}

export interface DayObs<T extends ObsLike = ObsLike> { day: string; count: number | null; entries: T[] }

/** Observations par jour civil local (plus ancien d'abord) ; un jour sans observation → `count: null` (« rien de noté »). */
export function observationsByDay<T extends ObsLike>(all: readonly T[], childId: string, now: Date, days: number): DayObs<T>[] {
  const keys = dayKeys(now, days);
  const mine = all.filter((o) => o.child_id === childId && !Number.isNaN(Date.parse(o.at)));
  return keys.map((day) => {
    const entries = mine.filter((o) => dayKey(new Date(o.at)) === day).sort((a, b) => b.at.localeCompare(a.at));
    return { day, count: entries.length ? entries.length : null, entries };
  });
}

/** Dernière observation de l'enfant (toutes natures). */
export function lastObservation<T extends ObsLike>(all: readonly T[], childId: string): T | null {
  return [...all].filter((o) => o.child_id === childId).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

/** Dernière température notée dans les `hours` dernières heures (remontée accueil / catégorie), sinon `null`. */
export function recentTemperature<T extends ObsLike>(all: readonly T[], childId: string, now: Date, hours = 24): T | null {
  const from = now.getTime() - hours * 60 * MIN;
  return [...all]
    .filter((o) => o.child_id === childId && tempValue(o) != null && Date.parse(o.at) >= from && Date.parse(o.at) <= now.getTime() + MIN)
    .sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}

/**
 * Températures → points de courbe : un point par mesure RÉELLE, à son instant exact (plusieurs prises le même jour
 * restent distinctes) ; `date` = jour civil local de la prise ; `note` = libellé de lecture (heure, méthode, note).
 */
export function temperaturePoints<T extends ObsLike>(all: readonly T[], childId: string, describe: (o: T) => string | null = () => null): CurvePoint[] {
  const out: CurvePoint[] = [];
  for (const o of all) {
    if (o.child_id !== childId) continue;
    const y = tempValue(o);
    const x = Date.parse(o.at);
    if (y == null || Number.isNaN(x)) continue;
    out.push({ id: o.id, date: dayKey(new Date(x)), x, y, note: describe(o) });
  }
  return out.sort((a, b) => a.x - b.x || (a.id < b.id ? -1 : 1));
}

/**
 * Correction d'une observation : seuls les champs réellement modifiés sont envoyés. Une température hors bornes,
 * un libellé vide pour un symptôme / une note, ou une heure dans le futur → `null` (rien n'est écrit).
 */
export function observationPatch(o: ObsLike, next: { at: Date | null; temp?: number | null; label?: string; intensity?: number | null }): Record<string, unknown> | null {
  if (!next.at) return null;
  const patch: Record<string, unknown> = {};
  if (next.at.getTime() !== Date.parse(o.at)) patch.at = next.at.toISOString();
  if (o.kind === 'temperature') {
    if (next.temp == null || !(next.temp >= TEMP_MIN && next.temp <= TEMP_MAX)) return null;
    const v = Math.round(next.temp * 10) / 10;
    if (v !== tempValue(o)) patch.value_num = v;
  } else if (INTENSITY_KINDS.includes(o.kind)) {
    if (next.intensity !== undefined && next.intensity !== (o.intensity ?? null)) {
      if (next.intensity != null && ![1, 2, 3].includes(next.intensity)) return null;
      patch.intensity = next.intensity;
    }
  } else if (next.label !== undefined) {
    const l = next.label.trim().slice(0, 160);
    if (!l && o.kind !== 'note') return null;
    if (l !== (o.label ?? '')) patch.label = l || null;
  }
  return patch;
}

// ---------------------------------------------------------------- échelle (humeur)

export interface ScaleEntry { id: string; at: string; value: number | null }
export interface DayScale<T extends ScaleEntry = ScaleEntry> {
  day: string;
  /** Valeur du DERNIER relevé du jour (pas une moyenne) ; `null` = rien de noté ce jour-là */
  last: number | null;
  entries: T[];
}

/** Relevés d'une échelle par jour (plus ancien d'abord). Une entrée sans valeur d'échelle compte dans la liste, pas dans la courbe. */
export function scaleByDay<T extends ScaleEntry>(all: readonly T[], now: Date, days: number): DayScale<T>[] {
  return dayKeys(now, days).map((day) => {
    const entries = all.filter((e) => !Number.isNaN(Date.parse(e.at)) && dayKey(new Date(e.at)) === day).sort((a, b) => b.at.localeCompare(a.at));
    const withValue = entries.find((e) => e.value != null);
    return { day, last: withValue?.value ?? null, entries };
  });
}

/** Comptes réels par niveau de l'échelle sur la période (aucune moyenne, aucun score). */
export function scaleCounts(days: readonly DayScale[], levels: number): number[] {
  const out = Array.from({ length: levels }, () => 0);
  for (const d of days) for (const e of d.entries) if (e.value != null && e.value >= 1 && e.value <= levels) out[e.value - 1] += 1;
  return out;
}

// ---------------------------------------------------------------- prises de médicament

export type DoseStatus = 'taken' | 'snoozed' | 'skipped';
export interface DoseLogLike { id: string; status: DoseStatus; scheduled_for: string; logged_at?: string | null }
export interface DoseRowLike { scheduledFor: string; log: Pick<DoseLogLike, 'id' | 'status' | 'logged_at'> | null }

/** Heure de prise affichée : seulement pour une prise notée « prise » avec son heure (sinon `null`). */
export function takenAt(r: DoseRowLike): Date | null {
  if (r.log?.status !== 'taken' || !r.log.logged_at) return null;
  const d = new Date(r.log.logged_at);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Bilan d'une journée de prises : prévues, notées prises, notées non prises, reportées, sans réponse. Une journée
 * avec des prises prévues mais AUCUNE réponse → `answered: null` (« rien de noté »), jamais « 0 prise ».
 */
export function doseDay(rows: readonly DoseRowLike[]): { planned: number; taken: number; skipped: number; snoozed: number; open: number; answered: number | null } {
  const taken = rows.filter((r) => r.log?.status === 'taken').length;
  const skipped = rows.filter((r) => r.log?.status === 'skipped').length;
  const snoozed = rows.filter((r) => r.log?.status === 'snoozed').length;
  const answered = taken + skipped + snoozed;
  return { planned: rows.length, taken, skipped, snoozed, open: rows.length - answered, answered: rows.length && answered ? answered : null };
}

/**
 * Heure de prise corrigée : « 08:12 » le jour de la prise PRÉVUE ; `null` si l'heure est illisible ou dans le futur.
 * (La dose, elle, n'est jamais touchée : elle reste celle recopiée de l'ordonnance.)
 */
export function takenTime(scheduledFor: string, text: string, now: Date = new Date()): Date | null {
  const m = /^([01]?\d|2[0-3])[:h]?([0-5]\d)$/.exec(text.trim().replace(/\s+/g, '').toLowerCase());
  if (!m) return null;
  const a = new Date(scheduledFor);
  if (Number.isNaN(a.getTime())) return null;
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate(), Number(m[1]), Number(m[2]));
  return b.getTime() > now.getTime() + MIN ? null : b;
}

/** Début (0 h locale) des `days` derniers jours, plus ancien d'abord. */
export function dayStarts(now: Date, days: number): Date[] {
  return dayKeys(now, days).map((k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); });
}
