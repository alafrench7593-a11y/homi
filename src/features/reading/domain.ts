/**
 * Lecture (outils 133 et 134) — logique pure, testée (foyerTools.test.ts).
 * Semaine de lecture : les soirs où l'on a lu, du lundi au dimanche, SANS série à ne pas « casser » : aucun message
 * culpabilisant quand on n'a pas lu, seulement ce qui a été partagé.
 */
import { addDays, type ISODate } from '@/lib/domain/dates';

export const REACTIONS = ['loved', 'liked', 'calm', 'not_today'] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface ReadingLog {
  id: string; household_id: string; child_id: string; title: string; story_key: string | null; read_on: ISODate; minutes: number | null;
  reader_id: string | null; reader_label: string | null; reaction: Reaction | null; note: string | null; created_at?: string; _pending?: boolean;
}
export interface ReadingFavorite { id: string; household_id: string; child_id: string; title: string; created_at?: string }

export const titleKey = (t: string) => t.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');

/** Lundi de la semaine d'une date (ISO). */
export function weekStart(day: ISODate): ISODate {
  const [y, m, d] = day.split('-').map(Number);
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // lundi = 0
  return addDays(day, -wd);
}

export interface WeekSummary { days: { date: ISODate; read: boolean; count: number }[]; daysRead: number; minutes: number; books: number }
/** Semaine (lundi → dimanche) contenant `day` : jours où l'on a lu, minutes notées, livres différents. */
export function weekSummary(logs: Pick<ReadingLog, 'read_on' | 'minutes' | 'title'>[], day: ISODate): WeekSummary {
  const start = weekStart(day);
  const end = addDays(start, 6);
  const inWeek = logs.filter((l) => l.read_on >= start && l.read_on <= end);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const count = inWeek.filter((l) => l.read_on === date).length;
    return { date, read: count > 0, count };
  });
  return {
    days, daysRead: days.filter((d) => d.read).length,
    minutes: inWeek.reduce((s, l) => s + (l.minutes ?? 0), 0),
    books: new Set(inWeek.map((l) => titleKey(l.title))).size,
  };
}

/** Livres les plus lus (titre tel qu'écrit la première fois, nombre de lectures, dernière lecture). */
export function mostRead(logs: Pick<ReadingLog, 'title' | 'read_on'>[], n = 5): { title: string; count: number; last: ISODate }[] {
  const map = new Map<string, { title: string; count: number; last: ISODate }>();
  for (const l of [...logs].sort((a, b) => a.read_on.localeCompare(b.read_on))) {
    const k = titleKey(l.title);
    const cur = map.get(k);
    if (cur) { cur.count += 1; cur.last = l.read_on; } else map.set(k, { title: l.title.trim(), count: 1, last: l.read_on });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, n);
}

export const isFavorite = (favs: Pick<ReadingFavorite, 'title' | 'child_id'>[], childId: string, title: string) =>
  favs.some((f) => f.child_id === childId && titleKey(f.title) === titleKey(title));

/** Minutes saisies : entier de 1 à 300, ou vide. */
export function parseMinutes(s: string): number | null | 'bad' {
  const t = s.trim();
  if (!t) return null;
  if (!/^\d{1,3}$/.test(t)) return 'bad';
  const n = Number(t);
  return n >= 1 && n <= 300 ? n : 'bad';
}
