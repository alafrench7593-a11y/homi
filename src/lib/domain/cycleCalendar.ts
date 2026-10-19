/**
 * Calendrier du cycle : actions proposées quand on touche un jour (logique pure, testée).
 *  · début des règles ce jour · fin des règles ce jour · « mes règles ont commencé ce jour » (corriger le début) · supprimer.
 * Les règles durent au plus 15 jours (au-delà, la saisie est refusée : c'est une autre période, ou il faut consulter).
 */
import { addDays, daysBetween, type ISODate } from './dates';

export interface PeriodRow { id: string; start_date: ISODate; end_date?: ISODate | null }
export type DayAction =
  | { kind: 'start' }
  | { kind: 'end'; id: string }
  | { kind: 'moveStart'; id: string }
  | { kind: 'delete'; id: string };

export const MAX_PERIOD_DAYS = 15;

/** Saisie qui couvre ce jour (règles en cours : jusqu'à aujourd'hui, au plus 15 jours). */
export function coveringPeriod(day: ISODate, rows: PeriodRow[], today: ISODate): PeriodRow | null {
  return rows.find((p) => {
    const end = p.end_date ?? (daysBetween(p.start_date, today) < MAX_PERIOD_DAYS ? today : addDays(p.start_date, 4));
    return p.start_date <= day && day <= end;
  }) ?? null;
}

export function dayActions(day: ISODate, rows: PeriodRow[], today: ISODate): { covering: PeriodRow | null; actions: DayAction[] } {
  if (day > today) return { covering: null, actions: [] };
  const covering = coveringPeriod(day, rows, today);
  const actions: DayAction[] = [];
  if (covering) {
    if (covering.end_date !== day) actions.push({ kind: 'end', id: covering.id });
    actions.push({ kind: 'delete', id: covering.id });
    return { covering, actions };
  }
  const sorted = [...rows].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const prev = [...sorted].reverse().find((p) => p.start_date < day);
  const next = sorted.find((p) => p.start_date > day);
  // Règles commencées plus tôt que noté (la saisie suivante commence dans les jours qui suivent)
  if (next && daysBetween(day, next.start_date) < MAX_PERIOD_DAYS && (!next.end_date || daysBetween(day, next.end_date) < MAX_PERIOD_DAYS) && (!prev || !prev.end_date || prev.end_date < day)) {
    actions.push({ kind: 'moveStart', id: next.id });
  }
  // Prolonger les règles précédentes jusqu'à ce jour
  if (prev && daysBetween(prev.start_date, day) < MAX_PERIOD_DAYS) actions.push({ kind: 'end', id: prev.id });
  if (!rows.some((p) => p.start_date === day)) actions.push({ kind: 'start' });
  return { covering: null, actions };
}
