/**
 * Calculs de grossesse — conventions françaises.
 * SA = semaines d'aménorrhée (depuis le 1er jour des dernières règles).
 * SG = semaines de grossesse (≈ SA − 2).
 * Terme théorique en France : 41 SA (DDR + 287 jours) ; de nombreux
 * outils utilisent 40 SA (DDR + 280 j). La date retenue est celle donnée
 * par le professionnel : l'application ne fait que l'afficher.
 */
import { t as tr } from '@/i18n';
import { addDays, daysBetween, type ISODate, todayISO } from './dates';

export const DAYS_LMP_TO_DUE_FR = 287; // 41 SA

export function dueDateFromLmp(lmp: ISODate): ISODate {
  return addDays(lmp, DAYS_LMP_TO_DUE_FR);
}

export function lmpFromDueDate(due: ISODate): ISODate {
  return addDays(due, -DAYS_LMP_TO_DUE_FR);
}

export interface PregnancyProgress {
  daysSinceLmp: number;
  weeksSA: number; // semaines révolues
  extraDays: number;
  weeksSG: number;
  trimester: 1 | 2 | 3;
  daysToDue: number;
  progress: number; // 0..1 (borné)
  label: string; // « 24 SA + 3 j »
}

export function pregnancyProgress(due: ISODate, today: ISODate = todayISO()): PregnancyProgress {
  const lmp = lmpFromDueDate(due);
  const daysSinceLmp = Math.max(0, daysBetween(lmp, today));
  const weeksSA = Math.floor(daysSinceLmp / 7);
  const extraDays = daysSinceLmp % 7;
  // Découpage indicatif : T1 jusqu'à 14 SA + 6 j, T2 jusqu'à 28 SA + 6 j
  const trimester: 1 | 2 | 3 = weeksSA < 15 ? 1 : weeksSA < 29 ? 2 : 3;
  const daysToDue = daysBetween(today, due);
  return {
    daysSinceLmp,
    weeksSA,
    extraDays,
    weeksSG: Math.max(0, weeksSA - 2),
    trimester,
    daysToDue,
    progress: Math.min(1, Math.max(0, daysSinceLmp / DAYS_LMP_TO_DUE_FR)),
    label: `${weeksSA} SA${extraDays ? ` + ${extraDays} j` : ''}`,
  };
}

export function countdownLabel(daysToDue: number): string {
  if (daysToDue > 1) {
    const w = Math.floor(daysToDue / 7);
    const d = daysToDue % 7;
    const dPart = tr('l2.preg.dayPart', { count: d });
    if (w === 0) return tr('l2.preg.cdDays', { d: dPart });
    const wPart = tr('l2.preg.weekPart', { count: w });
    return d ? tr('l2.preg.cdWeeksDays', { w: wPart, d: dPart }) : tr('l2.preg.cdWeeks', { w: wPart });
  }
  if (daysToDue === 1) return tr('l2.preg.tomorrow');
  if (daysToDue === 0) return tr('l2.preg.dueDay');
  return tr('l2.preg.pastDue', { count: -daysToDue });
}

export type Multiplicity = 'single' | 'twins' | 'triplets' | 'more' | 'unknown';

export function babiesCount(m: Multiplicity): number {
  return m === 'twins' ? 2 : m === 'triplets' ? 3 : m === 'more' ? 4 : 1;
}

export function multiplicityLabel(m: Multiplicity): string {
  return tr(`l2.preg.multi.${m}` as const);
}

/** Validation de cohérence d'une date de terme saisie. */
export function validateDueDate(due: ISODate, today: ISODate = todayISO()): string | null {
  const d = daysBetween(today, due);
  if (d > DAYS_LMP_TO_DUE_FR) return tr('l2.preg.dueTooFar');
  if (d < -42) return tr('l2.preg.duePast');
  return null;
}
