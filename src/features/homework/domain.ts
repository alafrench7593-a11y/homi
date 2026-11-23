/**
 * 137 — Suivi des devoirs : logique pure, testée (partiels2.test.ts). Devoirs par enfant (matière, consigne,
 * échéance, fait), vue de la semaine (lundi → dimanche), rappel la veille à 18 h. Aucune note, aucun classement.
 */
import { addDays, type ISODate } from '@/lib/domain/dates';

export interface Homework {
  id: string; household_id: string; child_id: string; subject: string; instructions: string; due_on: ISODate;
  done_at: string | null; done_by: string | null; remind_eve: boolean; created_at?: string; _pending?: boolean;
}

export const EVE_HOUR = 18;

export function mondayOf(day: ISODate): ISODate {
  const [y, m, d] = day.split('-').map(Number);
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return addDays(day, -wd);
}

export interface WeekDay { date: ISODate; items: Homework[] }
/** Les 7 jours de la semaine de `anyDay`, avec les devoirs à rendre ce jour-là (non faits d'abord). */
export function weekView(list: Homework[], anyDay: ISODate): WeekDay[] {
  const start = mondayOf(anyDay);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const items = list.filter((h) => h.due_on === date).sort((a, b) => Number(!!a.done_at) - Number(!!b.done_at) || a.subject.localeCompare(b.subject));
    return { date, items };
  });
}

/** À faire en retard (échéance passée, non faits) — dit sans reproche, pour ne rien oublier. */
export const overdue = (list: Homework[], today: ISODate) => list.filter((h) => !h.done_at && h.due_on < today).sort((a, b) => a.due_on.localeCompare(b.due_on));

/** Instant du rappel de la veille (18 h, heure locale), ou null s'il est déjà passé. */
export function eveReminderAt(due: ISODate, now: Date): string | null {
  const [y, m, d] = addDays(due, -1).split('-').map(Number);
  const at = new Date(y, m - 1, d, EVE_HOUR, 0, 0, 0);
  return at.getTime() > now.getTime() ? at.toISOString() : null;
}

/** Matières déjà utilisées pour cet enfant (suggestions), les plus fréquentes d'abord. */
export function knownSubjects(list: Pick<Homework, 'subject'>[], max = 8): string[] {
  const n = new Map<string, { label: string; c: number }>();
  for (const h of list) {
    const k = h.subject.trim().toLocaleLowerCase();
    const cur = n.get(k);
    if (cur) cur.c += 1; else n.set(k, { label: h.subject.trim(), c: 1 });
  }
  return [...n.values()].sort((a, b) => b.c - a.c || a.label.localeCompare(b.label)).slice(0, max).map((x) => x.label);
}
