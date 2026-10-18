// Construction du flux iCalendar d'abonnement à partir des données renvoyées par
// public.calendar_feed_data (droits déjà appliqués côté base). Module pur, testé (Deno et Jest).
import { itemsBetween, toIcs, type FamilyEvent, type Sources } from './calendar.ts';

export interface FeedData {
  feed: { id: string; label: string; include_health_titles: boolean };
  events: FamilyEvent[];
  appointments: NonNullable<Sources['appointments']>;
  tasks: NonNullable<Sources['tasks']>;
  shifts: NonNullable<Sources['shifts']>;
}

/** Jeton : 43 caractères base64url (32 octets). Tout le reste est refusé avant toute requête. */
export function validToken(t: string | null): t is string {
  return !!t && /^[A-Za-z0-9_-]{40,64}$/.test(t);
}

export function buildFeed(d: FeedData, now = new Date()): string {
  const from = new Date(now.getTime() - 31 * 86400000);
  const to = new Date(now.getTime() + 366 * 86400000);
  const items = itemsBetween({ events: d.events, appointments: d.appointments, tasks: d.tasks, shifts: d.shifts }, from, to)
    // les tâches déjà faites n'encombrent pas l'agenda externe
    .filter((i) => !(i.source === 'task' && i.done));
  return toIcs(items, { includeHealthTitles: d.feed.include_health_titles, now, calendarName: d.feed.label, events: d.events, timeZone: 'Europe/Paris', refreshMinutes: 60 });
}
