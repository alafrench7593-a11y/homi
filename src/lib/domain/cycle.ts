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
