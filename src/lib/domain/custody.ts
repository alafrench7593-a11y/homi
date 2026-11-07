/**
 * Garde alternée : calcul pur (sans réseau) de « chez qui » l'enfant est un jour donné.
 * Le rythme est une suite de A/B (un caractère par jour, 7 à 28 jours) qui se répète à partir de la date
 * de départ ; une exception (vacances, échange ponctuel) l'emporte sur le rythme pour ses dates.
 * L'application ne décide rien : elle reflète le rythme convenu par les parents ou fixé par le juge.
 */
import { addDays, daysBetween, parseISODate, type ISODate } from './dates';

export type Side = 'A' | 'B';
export type CustodyPattern = 'week' | '2255' | '223' | 'custom';

/** Rythmes usuels sur 14 jours, à partir d'un lundi. */
export const PATTERNS: Record<Exclude<CustodyPattern, 'custom'>, string> = {
  week: 'AAAAAAABBBBBBB',     // une semaine sur deux
  '2255': 'AABBAAAAABBBBB',   // 2-2-5-5 : lundi-mardi A, mercredi-jeudi B, week-ends en alternance
  '223': 'AABBAAABBAABBB',    // 2-2-3 : alternance courte, adaptée aux tout-petits
};

export interface CustodyPlanLike { cycle: string; anchor_on: ISODate }
export interface CustodyException { from_on: ISODate; to_on: ISODate; side: Side }

export function isValidCycle(cycle: string): boolean {
  return /^[AB]{7,28}$/.test(cycle);
}

/** Côté du rythme seul (sans exception). Fonctionne aussi avant la date de départ. */
export function cycleSide(plan: CustodyPlanLike, day: ISODate): Side {
  const n = plan.cycle.length;
  const d = daysBetween(plan.anchor_on, day);
  return plan.cycle[((d % n) + n) % n] as Side;
}

export function sideOn(plan: CustodyPlanLike, day: ISODate, exceptions: CustodyException[] = []): Side {
  // la dernière exception saisie qui couvre le jour l'emporte
  for (let i = exceptions.length - 1; i >= 0; i--) {
    const e = exceptions[i];
    if (day >= e.from_on && day <= e.to_on) return e.side;
  }
  return cycleSide(plan, day);
}

export interface CustodyDay { date: ISODate; side: Side; handover: boolean; exception: boolean }

/** Jours à partir de `from` ; `handover` = l'enfant change de maison ce jour-là. */
export function custodyDays(plan: CustodyPlanLike, from: ISODate, count: number, exceptions: CustodyException[] = []): CustodyDay[] {
  const out: CustodyDay[] = [];
  let prev = sideOn(plan, addDays(from, -1), exceptions);
  for (let i = 0; i < count; i++) {
    const date = addDays(from, i);
    const side = sideOn(plan, date, exceptions);
    const exception = exceptions.some((e) => date >= e.from_on && date <= e.to_on);
    out.push({ date, side, handover: side !== prev, exception });
    prev = side;
  }
  return out;
}

/** Prochaine passation à partir d'aujourd'hui inclus (dans les 60 jours), ou null. */
export function nextHandover(plan: CustodyPlanLike, today: ISODate, exceptions: CustodyException[] = []): CustodyDay | null {
  return custodyDays(plan, today, 60, exceptions).find((d) => d.handover) ?? null;
}

/** Nombre de jours de chaque côté sur une période (pour vérifier l'équilibre convenu). */
export function shareOver(plan: CustodyPlanLike, from: ISODate, count: number, exceptions: CustodyException[] = []): Record<Side, number> {
  const r: Record<Side, number> = { A: 0, B: 0 };
  for (const d of custodyDays(plan, from, count, exceptions)) r[d.side]++;
  return r;
}

/** Lundi de la semaine de `day` (point de départ naturel des rythmes usuels). */
export function mondayOf(day: ISODate): ISODate {
  const wd = (parseISODate(day).getUTCDay() + 6) % 7; // 0 = lundi
  return addDays(day, -wd);
}
