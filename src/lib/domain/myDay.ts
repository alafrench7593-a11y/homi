/**
 * « Ma journée » (Profil, 07/11/2026) : tout ce qui concerne la personne AUJOURD'HUI, trié par heure —
 * ses rappels (une fois, chaque jour, certains jours, à intervalle) et l'agenda du foyer (rendez-vous,
 * événements, tâches, relais de nuit, temps pour soi). Logique pure, testée (src/__tests__/myDay.test.ts).
 */
import type { CalendarItem } from './calendar';
import type { ReminderSchedule } from './reminders';

export interface DayReminder { id: string; title: string; schedule: ReminderSchedule; enabled: boolean; snoozed_until: string | null; category?: string; deep_link?: string | null }

export interface MyDayItem {
  key: string;
  kind: 'reminder' | 'appointment' | 'event' | 'task' | 'night' | 'me_time';
  title: string;
  /** « HH:MM » ; null = toute la journée */
  time: string | null;
  /** Rappel à intervalle : « de 8 h à 20 h, toutes les 180 min » */
  every?: { minutes: number; fromHour: number; toHour: number };
  refId: string;
  done?: boolean;
  link?: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (h: number, m: number) => `${pad(h)}:${pad(m)}`;
/** Jour de la semaine ISO (1 = lundi … 7 = dimanche) d'une date « AAAA-MM-JJ ». */
export function isoWeekday(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  const w = new Date(y, m - 1, d, 12).getDay();
  return w === 0 ? 7 : w;
}
const localDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const localTime = (iso: string) => { const d = new Date(iso); return hhmm(d.getHours(), d.getMinutes()); };
const inBounds = (day: string, from?: string | null, until?: string | null) => (!from || day >= from.slice(0, 10)) && (!until || day <= until.slice(0, 10));

/** Les rappels qui sonnent ce jour-là (désactivés et mis en pause toute la journée exclus). */
export function remindersOn(reminders: DayReminder[], day: string): MyDayItem[] {
  const out: MyDayItem[] = [];
  for (const r of reminders) {
    if (!r.enabled) continue;
    if (r.snoozed_until && localDay(r.snoozed_until) > day) continue;
    const s = r.schedule;
    const base = { key: `rem-${r.id}`, kind: 'reminder' as const, title: r.title, refId: r.id, link: r.deep_link ?? null };
    if (s.type === 'once') { if (localDay(s.at) === day) out.push({ ...base, time: localTime(s.at) }); }
    else if (s.type === 'daily') { if (inBounds(day, s.from, s.until)) out.push({ ...base, time: hhmm(s.hour, s.minute) }); }
    else if (s.type === 'weekly') { if (inBounds(day, s.from, s.until) && (s.weekdays as number[]).includes(isoWeekday(day))) out.push({ ...base, time: hhmm(s.hour, s.minute) }); }
    else if (s.type === 'interval') out.push({ ...base, time: hhmm(s.from_hour, 0), every: { minutes: s.minutes, fromHour: s.from_hour, toHour: s.to_hour } });
  }
  return out;
}

/** Agenda du foyer pour ce jour (éléments déjà filtrés sur la journée par le calendrier). */
export function agendaItems(items: CalendarItem[], day: string): MyDayItem[] {
  return items.map((i) => ({
    key: `cal-${i.key}`, kind: i.source, title: i.title, refId: i.refId, done: i.done,
    time: i.allDay || localDay(i.starts) < day ? null : localTime(i.starts),
  }));
}

/** Tri : toute la journée d'abord, puis par heure ; à heure égale, rendez-vous avant rappels. */
export function sortDay(items: MyDayItem[]): MyDayItem[] {
  const rank: Record<MyDayItem['kind'], number> = { appointment: 0, event: 1, me_time: 2, night: 3, task: 4, reminder: 5 };
  return [...items].sort((a, b) => (a.time ?? '') .localeCompare(b.time ?? '') || rank[a.kind] - rank[b.kind] || a.title.localeCompare(b.title));
}

/** Ce qui reste à venir à partir de maintenant (« HH:MM ») ; les éléments sans heure restent affichés. */
export function upcoming(items: MyDayItem[], now: string): MyDayItem[] {
  return items.filter((i) => i.time == null || i.every || i.time >= now);
}
