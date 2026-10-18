/**
 * Agenda familial : logique pure, testée.
 * Rassemble événements du foyer, rendez-vous, tâches datées et relais en une seule liste,
 * déplie les récurrences (en heure locale, changements d'heure compris) et produit un fichier
 * iCalendar (RFC 5545) importable dans Google Agenda, Apple Calendrier ou Outlook.
 * Les rendez-vous privés ne sortent jamais ; les rendez-vous de santé sortent sous un titre neutre
 * sauf choix explicite.
 */

export type EventKind = 'activity' | 'routine' | 'shopping' | 'important' | 'school' | 'custom';
export interface FamilyEvent {
  id: string; household_id: string; child_id: string | null; kind: EventKind; title: string; starts_at: string; ends_at: string | null;
  all_day: boolean; location_label: string | null; notes: string | null;
  recurrence: { type: 'daily' | 'weekly' | 'monthly'; every?: number; until?: string } | null;
  timezone: string; created_by: string | null; updated_by?: string | null; created_at: string; updated_at?: string;
}

export const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: 'activity', label: 'Activité de l’enfant' }, { value: 'school', label: 'Crèche, école' }, { value: 'routine', label: 'Routine' },
  { value: 'shopping', label: 'Courses' }, { value: 'important', label: 'Date importante' }, { value: 'custom', label: 'Autre' },
];

export type Source = 'event' | 'appointment' | 'task' | 'night' | 'me_time';
export interface CalendarItem {
  key: string; source: Source; refId: string; title: string; starts: string; ends: string; allDay: boolean;
  location?: string | null; health?: boolean; private?: boolean; recurring?: boolean; done?: boolean; who?: string | null;
}

export const SOURCE_LABEL: Record<Source, string> = { event: 'Événement', appointment: 'Rendez-vous', task: 'Tâche', night: 'Relais de nuit', me_time: 'Temps pour soi' };

// ------------------------------------------------------------------ dates locales
const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const atLocal = (day: string, h = 0, m = 0) => { const [y, mo, d] = day.split('-').map(Number); return new Date(y, mo - 1, d, h, m, 0, 0); };
export function addDays(day: string, n: number) { const d = atLocal(day, 12); d.setDate(d.getDate() + n); return dayKey(d); }
export function addMonths(day: string, n: number) { const [y, m] = day.split('-').map(Number); return dayKey(new Date(y, m - 1 + n, 1, 12)); }
/** Lundi de la semaine du jour donné. */
export function weekStart(day: string) { const d = atLocal(day, 12); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return dayKey(d); }

/** Grille du mois (semaines du lundi au dimanche), jours hors mois inclus pour compléter. */
export function monthGrid(day: string): string[][] {
  const [y, m] = day.split('-').map(Number);
  const first = dayKey(new Date(y, m - 1, 1, 12));
  let cur = weekStart(first);
  const weeks: string[][] = [];
  do {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cur, i)));
    cur = addDays(cur, 7);
  } while (Number(cur.slice(5, 7)) === m || weeks.length < 4);
  return weeks.filter((w) => w.some((d) => Number(d.slice(5, 7)) === m));
}

// ------------------------------------------------------------------ récurrences
/**
 * Occurrences d'un événement entre `from` (inclus) et `to` (exclus), en conservant l'heure locale
 * (un « chaque mardi 18 h » reste à 18 h après le changement d'heure). 400 occurrences au plus.
 */
export function occurrences(e: Pick<FamilyEvent, 'starts_at' | 'ends_at' | 'recurrence'>, from: Date, to: Date): { starts: string; ends: string }[] {
  const start = new Date(e.starts_at);
  const dur = e.ends_at ? Date.parse(e.ends_at) - start.getTime() : 3600000;
  if (!e.recurrence) return start < to && start.getTime() + dur > from.getTime() ? [{ starts: start.toISOString(), ends: new Date(start.getTime() + dur).toISOString() }] : [];
  const every = Math.max(1, Math.min(12, e.recurrence.every ?? 1));
  const until = e.recurrence.until ? atLocal(e.recurrence.until, 23, 59).getTime() : Infinity;
  const out: { starts: string; ends: string }[] = [];
  for (let i = 0; i < 2000 && out.length < 400; i++) {
    const d = new Date(start);
    if (e.recurrence.type === 'daily') d.setDate(d.getDate() + i * every);
    else if (e.recurrence.type === 'weekly') d.setDate(d.getDate() + i * 7 * every);
    else { d.setMonth(start.getMonth() + i * every); if (d.getDate() !== start.getDate()) continue; } // 31 → mois sans 31 : sauté
    if (d.getTime() > until || d >= to) break;
    if (d.getTime() + dur > from.getTime()) out.push({ starts: d.toISOString(), ends: new Date(d.getTime() + dur).toISOString() });
  }
  return out;
}

// ------------------------------------------------------------------ assemblage
export interface Sources {
  events?: FamilyEvent[];
  appointments?: { id: string; title: string; starts_at: string; location_label: string | null; private_to_creator?: boolean; kind: string }[];
  tasks?: { id: string; title: string; due_at: string | null; status: string; assignee_id: string | null }[];
  shifts?: { id: string; kind: 'night' | 'me_time'; user_id: string; starts_at: string; ends_at: string; status: string }[];
}

export function itemsBetween(s: Sources, from: Date, to: Date): CalendarItem[] {
  const out: CalendarItem[] = [];
  const inRange = (a: string, b: string) => Date.parse(a) < to.getTime() && Date.parse(b) > from.getTime();
  for (const e of s.events ?? []) {
    for (const o of occurrences(e, from, to)) {
      out.push({ key: `event:${e.id}:${o.starts}`, source: 'event', refId: e.id, title: e.title, starts: o.starts, ends: o.ends, allDay: e.all_day, location: e.location_label, recurring: !!e.recurrence });
    }
  }
  for (const a of s.appointments ?? []) {
    const ends = new Date(Date.parse(a.starts_at) + 3600000).toISOString();
    if (inRange(a.starts_at, ends)) out.push({ key: `appointment:${a.id}`, source: 'appointment', refId: a.id, title: a.title, starts: a.starts_at, ends, allDay: false, location: a.location_label, health: true, private: !!a.private_to_creator });
  }
  for (const t of s.tasks ?? []) {
    if (!t.due_at || t.status === 'cancelled') continue;
    const ends = new Date(Date.parse(t.due_at) + 1800000).toISOString();
    if (inRange(t.due_at, ends)) out.push({ key: `task:${t.id}`, source: 'task', refId: t.id, title: t.title, starts: t.due_at, ends, allDay: false, done: t.status === 'done', who: t.assignee_id });
  }
  for (const sh of s.shifts ?? []) {
    if (sh.status === 'cancelled' || !inRange(sh.starts_at, sh.ends_at)) continue;
    out.push({ key: `${sh.kind}:${sh.id}`, source: sh.kind, refId: sh.id, title: sh.kind === 'night' ? 'Relais de nuit' : 'Temps pour soi', starts: sh.starts_at, ends: sh.ends_at, allDay: false, who: sh.user_id });
  }
  return out.sort((a, b) => (a.allDay === b.allDay ? (a.starts < b.starts ? -1 : a.starts > b.starts ? 1 : a.title.localeCompare(b.title)) : a.allDay ? -1 : 1));
}

/** Éléments d'un jour donné (un relais de nuit apparaît le soir où il commence). */
export function itemsOnDay(items: CalendarItem[], day: string) {
  const a = atLocal(day).getTime();
  const b = atLocal(addDays(day, 1)).getTime();
  return items.filter((i) => (i.source === 'night' ? Date.parse(i.starts) >= a && Date.parse(i.starts) < b : Date.parse(i.starts) < b && Date.parse(i.ends) > a));
}

/** Chevauchements entre éléments horaires (hors tâches et relais), pour les signaler. */
export function overlaps(items: CalendarItem[]) {
  const timed = items.filter((i) => !i.allDay && (i.source === 'event' || i.source === 'appointment'));
  const keys = new Set<string>();
  for (let i = 0; i < timed.length; i++) for (let j = i + 1; j < timed.length; j++) {
    if (timed[i].starts < timed[j].ends && timed[j].starts < timed[i].ends) { keys.add(timed[i].key); keys.add(timed[j].key); }
  }
  return keys;
}

// ------------------------------------------------------------------ iCalendar (RFC 5545)
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateOnly = (iso: string) => dayKey(new Date(iso)).replace(/-/g, '');

/** Repli des lignes à 75 octets (UTF-8), continuation par une espace. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = '';
  for (const ch of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (enc.encode(cur + ch).length > limit) { parts.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) parts.push(cur);
  return parts.map((p, i) => (i === 0 ? p : ` ${p}`)).join('\r\n');
}

/** « AAAAMMJJTHHMMSS » dans le fuseau donné (pour DTSTART;TZID=…). */
export function localStamp(iso: string, timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

/** Fuseau de Paris (heure d'été : dernier dimanche de mars → dernier dimanche d'octobre). */
const VTIMEZONE_PARIS = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export interface IcsOptions { includeHealthTitles?: boolean; now?: Date; calendarName?: string; events?: FamilyEvent[] }

/**
 * Fichier .ics des éléments donnés. Les événements récurrents du foyer sont exportés une fois
 * avec leur règle (RRULE) plutôt qu'occurrence par occurrence. Les rendez-vous privés sont exclus.
 */
export function toIcs(items: CalendarItem[], o: IcsOptions = {}): string {
  const stamp = utc((o.now ?? new Date()).toISOString());
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Toi & Moi//Agenda familial//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(o.calendarName ?? 'Agenda familial')}`];
  const seenRecurring = new Set<string>();
  // Les événements récurrents sont écrits en heure locale (TZID) : « 18 h chaque mardi » reste 18 h après le changement d'heure
  if ((o.events ?? []).some((e) => e.recurrence && e.timezone === 'Europe/Paris') && items.some((i) => i.recurring)) lines.push(...VTIMEZONE_PARIS);
  for (const i of items) {
    if (i.private) continue;
    const ev = i.source === 'event' && i.recurring ? o.events?.find((e) => e.id === i.refId) : undefined;
    if (ev) { if (seenRecurring.has(ev.id)) continue; seenRecurring.add(ev.id); }
    const starts = ev ? ev.starts_at : i.starts;
    const ends = ev ? ev.ends_at ?? new Date(Date.parse(ev.starts_at) + 3600000).toISOString() : i.ends;
    const title = i.health && !o.includeHealthTitles ? 'Rendez-vous' : i.title;
    lines.push('BEGIN:VEVENT', `UID:${ev ? `event-${ev.id}` : i.key.replace(/[^A-Za-z0-9-]/g, '-')}@toietmoi`, `DTSTAMP:${stamp}`);
    if (i.allDay) lines.push(`DTSTART;VALUE=DATE:${dateOnly(starts)}`, `DTEND;VALUE=DATE:${dateOnly(new Date(Date.parse(starts) + 86400000).toISOString())}`);
    else if (ev?.recurrence) lines.push(`DTSTART;TZID=${ev.timezone}:${localStamp(starts, ev.timezone)}`, `DTEND;TZID=${ev.timezone}:${localStamp(ends, ev.timezone)}`);
    else lines.push(`DTSTART:${utc(starts)}`, `DTEND:${utc(ends)}`);
    lines.push(`SUMMARY:${esc(title)}`);
    if (i.location && !(i.health && !o.includeHealthTitles)) lines.push(`LOCATION:${esc(i.location)}`);
    if (ev?.recurrence) {
      const freq = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY' }[ev.recurrence.type];
      lines.push(`RRULE:FREQ=${freq};INTERVAL=${ev.recurrence.every ?? 1}${ev.recurrence.until ? `;UNTIL=${utc(atLocal(ev.recurrence.until, 23, 59).toISOString())}` : ''}`);
    }
    if (i.source === 'task') lines.push(`DESCRIPTION:${esc('Tâche du foyer')}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
