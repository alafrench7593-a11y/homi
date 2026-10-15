/**
 * Estimations du cycle. TOUJOURS présentées comme des estimations :
 * elles ne permettent ni de garantir une grossesse, ni de l'éviter.
 */
import { addDays, daysBetween, type ISODate, todayISO } from './dates';

export interface PeriodEntry {
  start_date: ISODate;
  end_date?: ISODate | null;
}

export type Reliability = 'insufficient' | 'low' | 'moderate';

export interface CycleEstimate {
  cycleCount: number;
  averageLength: number | null;
  variability: number | null; // écart-type en jours
  nextPeriod: ISODate | null;
  ovulation: ISODate | null;
  fertileWindow: { start: ISODate; end: ISODate } | null;
  reliability: Reliability;
  caveats: string[];
}

export const CYCLE_CAVEATS = [
  'Ces dates sont des estimations calculées à partir de vos saisies.',
  'Elles ne garantissent pas une grossesse et ne permettent pas de l’éviter.',
  'Un cycle peut varier avec le stress, la fatigue, l’allaitement, une maladie ou l’arrêt d’une contraception.',
];

export function estimateCycle(entries: PeriodEntry[], today: ISODate = todayISO()): CycleEstimate {
  const starts = [...new Set(entries.map((e) => e.start_date))].sort();
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const l = daysBetween(starts[i - 1], starts[i]);
    if (l >= 15 && l <= 60) lengths.push(l); // ignore les saisies incohérentes
  }
  const recent = lengths.slice(-6);
  const caveats = [...CYCLE_CAVEATS];

  if (!starts.length) {
    return { cycleCount: 0, averageLength: null, variability: null, nextPeriod: null, ovulation: null, fertileWindow: null, reliability: 'insufficient', caveats };
  }
  const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 28;
  const sd = recent.length > 1 ? Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / (recent.length - 1)) : null;
  const length = Math.round(avg);

  let next = addDays(starts[starts.length - 1], length);
  while (daysBetween(next, today) > 3) next = addDays(next, length); // cycles non saisis

  const ovulation = addDays(next, -14);
  let reliability: Reliability = 'moderate';
  if (recent.length < 3) {
    reliability = recent.length === 0 ? 'insufficient' : 'low';
    caveats.unshift(recent.length === 0
      ? 'Une seule date de règles est connue : l’estimation utilise une durée de cycle moyenne de 28 jours.'
      : 'Moins de trois cycles saisis : l’estimation est peu fiable.');
  }
  if (sd != null && sd > 4) {
    reliability = 'low';
    caveats.unshift('Vos cycles varient de plus de quelques jours : les estimations sont moins fiables.');
  }

  return {
    cycleCount: recent.length,
    averageLength: recent.length ? Math.round(avg * 10) / 10 : null,
    variability: sd == null ? null : Math.round(sd * 10) / 10,
    nextPeriod: next,
    ovulation,
    fertileWindow: { start: addDays(ovulation, -5), end: addDays(ovulation, 1) },
    reliability,
    caveats,
  };
}

export type CycleDayKind = 'period' | 'fertile_estimate' | 'ovulation_estimate' | 'next_period_estimate' | null;

export function cycleDayKind(day: ISODate, entries: PeriodEntry[], est: CycleEstimate): CycleDayKind {
  for (const e of entries) {
    const end = e.end_date ?? addDays(e.start_date, 4);
    if (daysBetween(e.start_date, day) >= 0 && daysBetween(day, end) >= 0) return 'period';
  }
  if (est.ovulation === day) return 'ovulation_estimate';
  if (est.fertileWindow && daysBetween(est.fertileWindow.start, day) >= 0 && daysBetween(day, est.fertileWindow.end) >= 0) return 'fertile_estimate';
  if (est.nextPeriod && daysBetween(est.nextPeriod, day) >= 0 && daysBetween(day, addDays(est.nextPeriod, 4)) >= 0) return 'next_period_estimate';
  return null;
}

// =====================================================================
// Parcours fertilité (« concevoir » / « éviter une grossesse »)
// Fonctions ajoutées : les exports ci-dessus restent inchangés.
// Toute date d'ovulation ou de fertilité est une ESTIMATION.
// =====================================================================

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Durée de cycle utilisée pour les projections (moyenne saisie, sinon 28 j). */
export function projectionLength(est: CycleEstimate): number {
  return Math.round(est.averageLength ?? 28);
}

export interface CycleRecord {
  start: ISODate;
  /** Dernier jour du cycle (veille des règles suivantes), null pour le cycle en cours. */
  end: ISODate | null;
  /** Durée en jours, null pour le cycle en cours. */
  length: number | null;
  periodLength: number | null;
  /** Ovulation estimée a posteriori (14 jours avant les règles suivantes) — estimation. */
  ovulationEstimate: ISODate | null;
  current: boolean;
  /** Cycle hors des bornes habituelles (saisie à vérifier) : exclu des moyennes. */
  unusual: boolean;
}

/** Historique des cycles, le plus récent en premier. */
export function cycleHistory(entries: PeriodEntry[], today: ISODate = todayISO()): CycleRecord[] {
  const byStart = new Map<ISODate, PeriodEntry>();
  for (const e of entries) if (e.start_date <= today && !byStart.has(e.start_date)) byStart.set(e.start_date, e);
  const starts = [...byStart.keys()].sort();
  const out: CycleRecord[] = starts.map((s, i) => {
    const next = starts[i + 1];
    const e = byStart.get(s)!;
    const periodLength = e.end_date ? daysBetween(s, e.end_date) + 1 : null;
    if (!next) return { start: s, end: null, length: null, periodLength, ovulationEstimate: null, current: true, unusual: false };
    const length = daysBetween(s, next);
    return { start: s, end: addDays(next, -1), length, periodLength, ovulationEstimate: addDays(next, -14), current: false, unusual: length < 15 || length > 60 };
  });
  return out.reverse();
}

/** Jour du cycle en cours (1 = premier jour des dernières règles), null si aucune saisie. */
export function currentCycleDay(entries: PeriodEntry[], today: ISODate = todayISO()): number | null {
  const starts = entries.map((e) => e.start_date).filter((s) => s <= today).sort();
  if (!starts.length) return null;
  return daysBetween(starts[starts.length - 1], today) + 1;
}

export interface FertileWindowEstimate {
  /** Règles suivantes estimées (fin du cycle concerné). */
  nextPeriod: ISODate;
  ovulation: ISODate;
  /** Fenêtre fertile estimée : 5 jours avant l'ovulation estimée jusqu'au lendemain. */
  start: ISODate;
  end: ISODate;
  /** Jours où les chances de conception peuvent être plus élevées : les 2 jours précédant l'ovulation estimée et ce jour-là. */
  higherStart: ISODate;
  higherEnd: ISODate;
}

/** Fenêtres estimées du cycle en cours et des `count - 1` cycles suivants. */
export function projectFertileWindows(est: CycleEstimate, count = 3): FertileWindowEstimate[] {
  if (!est.nextPeriod) return [];
  const len = projectionLength(est);
  return Array.from({ length: Math.max(0, count) }, (_, k) => {
    const nextPeriod = addDays(est.nextPeriod!, k * len);
    const ovulation = addDays(nextPeriod, -14);
    return { nextPeriod, ovulation, start: addDays(ovulation, -5), end: addDays(ovulation, 1), higherStart: addDays(ovulation, -2), higherEnd: ovulation };
  });
}

/** Prochaine fenêtre estimée qui n'est pas encore terminée. */
export function upcomingWindow(windows: FertileWindowEstimate[], today: ISODate = todayISO()): FertileWindowEstimate | null {
  return windows.find((w) => w.end >= today) ?? null;
}

const within = (day: ISODate, a: ISODate, b: ISODate) => daysBetween(a, day) >= 0 && daysBetween(day, b) >= 0;

function inLoggedPeriod(day: ISODate, entries: PeriodEntry[]): boolean {
  return entries.some((e) => within(day, e.start_date, e.end_date ?? addDays(e.start_date, 4)));
}

function inEstimatedPeriod(day: ISODate, windows: FertileWindowEstimate[]): boolean {
  return windows.some((w) => within(day, w.nextPeriod, addDays(w.nextPeriod, 4)));
}

/** Parcours « concevoir » : nature d'un jour du calendrier. Les jours futurs ne sont que des estimations. */
export type ConceptionDayKind = 'period' | 'next_period_estimate' | 'ovulation_estimate' | 'higher_chance_estimate' | 'fertile_estimate' | null;

export function conceptionDayKind(day: ISODate, entries: PeriodEntry[], windows: FertileWindowEstimate[], today: ISODate = todayISO()): ConceptionDayKind {
  if (inLoggedPeriod(day, entries)) return 'period';
  if (day < today) return null; // pas d'estimation affichée dans le passé
  for (const w of windows) {
    if (day === w.ovulation) return 'ovulation_estimate';
    if (within(day, w.higherStart, w.higherEnd)) return 'higher_chance_estimate';
    if (within(day, w.start, w.end)) return 'fertile_estimate';
  }
  if (inEstimatedPeriod(day, windows)) return 'next_period_estimate';
  return null;
}

/**
 * Marge (en jours) ajoutée de part et d'autre de la fenêtre fertile estimée pour le parcours
 * « éviter une grossesse » : plus les cycles varient ou sont peu connus, plus elle est large.
 */
export function avoidMargin(est: CycleEstimate): number {
  if (est.reliability === 'insufficient' || est.variability == null) return 4;
  return clamp(Math.ceil(est.variability), 2, 6);
}

/**
 * Parcours « éviter une grossesse » : nature d'un jour.
 * Il n'existe AUCUN jour garanti : en dehors des jours à probabilité plus élevée,
 * le jour est classé « pregnancy_possible » (une grossesse reste possible).
 */
export type AvoidDayKind = 'period' | 'next_period_estimate' | 'ovulation_estimate' | 'higher_probability_estimate' | 'pregnancy_possible';

export function avoidDayKind(day: ISODate, entries: PeriodEntry[], windows: FertileWindowEstimate[], margin: number, today: ISODate = todayISO()): AvoidDayKind {
  if (inLoggedPeriod(day, entries)) return 'period';
  if (day >= today) {
    for (const w of windows) {
      if (day === w.ovulation) return 'ovulation_estimate';
      if (within(day, addDays(w.start, -margin), addDays(w.end, margin))) return 'higher_probability_estimate';
    }
    if (inEstimatedPeriod(day, windows)) return 'next_period_estimate';
  }
  return 'pregnancy_possible';
}

/** Grille d'un mois (semaines du lundi au dimanche), complétée par les jours des mois voisins. */
export function monthGrid(year: number, month0: number): ISODate[] {
  const first: ISODate = `${year}-${String(month0 + 1).padStart(2, '0')}-01`;
  const [y, m] = [year, month0];
  const offset = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}

/** Points du graphique de température (descriptif uniquement, aucune interprétation). */
export function bbtSeries(obs: { observed_on: ISODate; bbt_celsius: number | string | null }[], sinceDays = 60, today: ISODate = todayISO()): { x: number; y: number; date: ISODate }[] {
  const since = addDays(today, -sinceDays);
  return obs
    .filter((o) => o.bbt_celsius != null && o.observed_on >= since && o.observed_on <= today)
    .map((o) => ({ date: o.observed_on, y: Math.round(Number(o.bbt_celsius) * 100) / 100 }))
    .filter((o) => Number.isFinite(o.y))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((o) => ({ x: daysBetween(since, o.date), y: o.y, date: o.date }));
}

/** Saisie « 36,55 » ou « 36.55 » -> nombre, ou null si invalide ou invraisemblable. */
export function parseTemperature(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!/^\d{2}(\.\d{1,2})?$/.test(s)) return null;
  const v = Number(s);
  if (v < 34 || v > 40) return null;
  return Math.round(v * 100) / 100;
}

export interface ConsultationInput {
  age: number | null;
  monthsTrying: number;
  irregularCycles: boolean;
  knownCondition: boolean;
}

export interface ConsultationGuidance {
  /** Délai habituellement évoqué avant d'en parler (12 mois, 6 mois à partir de 35 ans). */
  thresholdMonths: 6 | 12;
  /** Il peut être utile d'en parler dès maintenant à un professionnel. */
  suggestTalkingNow: boolean;
  reasons: string[];
}

/**
 * Repères généraux pour savoir QUAND en parler à un professionnel.
 * Ne pose jamais de diagnostic : oriente uniquement vers une consultation.
 */
export function consultationGuidance(i: ConsultationInput): ConsultationGuidance {
  const thresholdMonths: 6 | 12 = i.age != null && i.age >= 35 ? 6 : 12;
  const reasons: string[] = [];
  if (i.monthsTrying >= thresholdMonths) {
    reasons.push(thresholdMonths === 6
      ? 'À partir de 35 ans, il est souvent conseillé d’en parler après 6 mois d’essais sans grossesse.'
      : 'Après 12 mois d’essais sans grossesse, il est souvent conseillé d’en parler à un professionnel.');
  }
  if (i.irregularCycles) reasons.push('Des cycles très irréguliers ou absents sont une raison d’en parler sans attendre.');
  if (i.knownCondition) reasons.push('Un antécédent ou une situation connue (endométriose, SOPK, chirurgie, traitement…) justifie d’en parler plus tôt.');
  if (i.age != null && i.age >= 40) reasons.push('À partir de 40 ans, un échange rapide avec un professionnel est généralement conseillé.');
  return { thresholdMonths, suggestTalkingNow: reasons.length > 0, reasons };
}
