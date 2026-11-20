/**
 * 136 — Activités extrascolaires : logique pure, testée (partiels2.test.ts). Une activité est rattachée à un enfant,
 * avec des créneaux hebdomadaires (jour 1 = lundi … 7 = dimanche, heures locales), une période facultative, le
 * matériel et un contact. Ses séances apparaissent dans l'agenda familial et la journée ; le rappel est un rappel
 * hebdomadaire du téléphone, posé avant chaque séance.
 */
import type { ISODate } from '@/lib/domain/dates';

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface Slot { day: Weekday; from: string; to: string }
export const REMINDER_LEADS = [15, 30, 60, 120] as const;
export type ReminderLead = (typeof REMINDER_LEADS)[number];

export interface ChildActivity {
  id: string; household_id: string; child_id: string; name: string; place: string | null; slots: Slot[];
  starts_on: ISODate | null; ends_on: ISODate | null; equipment: string | null; contact_name: string | null; contact_phone: string | null;
  note: string | null; reminder_minutes: ReminderLead | null; created_at?: string; _pending?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Heure saisie (« 14h », « 14h30 », « 9:05 », « 1730 ») → « HH:MM », sinon null. */
export function parseClock(input: string): string | null {
  const m = input.trim().toLowerCase().match(/^(\d{1,2})\s*(?:[h:.]\s*(\d{2})?|(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2] ?? m[3] ?? 0);
  if (h > 23 || mi > 59) return null;
  return `${pad(h)}:${pad(mi)}`;
}

export const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export type SlotError = 'none' | 'time' | 'order' | 'overlap';
/** Créneaux valides : au moins un, heures lisibles, fin après le début, pas deux créneaux qui se chevauchent le même jour. */
export function checkSlots(slots: Slot[]): SlotError | null {
  if (!slots.length) return 'none';
  for (const s of slots) {
    if (!/^\d{2}:\d{2}$/.test(s.from) || !/^\d{2}:\d{2}$/.test(s.to)) return 'time';
    if (minutesOf(s.to) <= minutesOf(s.from)) return 'order';
  }
  for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) {
    const a = slots[i]; const b = slots[j];
    if (a.day === b.day && minutesOf(a.from) < minutesOf(b.to) && minutesOf(b.from) < minutesOf(a.to)) return 'overlap';
  }
  return null;
}

/** Jour de semaine ISO (lundi = 1) d'une date AAAA-MM-JJ. */
export function isoWeekday(day: ISODate): Weekday {
  const [y, m, d] = day.split('-').map(Number);
  return (((new Date(y, m - 1, d, 12).getDay() + 6) % 7) + 1) as Weekday;
}
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (day: ISODate, hhmm: string) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3, 5)), 0, 0); };

export interface Session { activityId: string; day: ISODate; starts: string; ends: string }
/** Séances entre deux instants (bornes de la période respectées). */
export function sessionsBetween(a: Pick<ChildActivity, 'id' | 'slots' | 'starts_on' | 'ends_on'>, from: Date, to: Date): Session[] {
  const out: Session[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12);
  for (let i = 0; cur.getTime() < to.getTime() + 86400_000 && i < 400; i++, cur.setDate(cur.getDate() + 1)) {
    const day = dayKey(cur);
    if (a.starts_on && day < a.starts_on) continue;
    if (a.ends_on && day > a.ends_on) continue;
    const wd = isoWeekday(day);
    for (const s of a.slots) {
      if (s.day !== wd) continue;
      const st = at(day, s.from); const en = at(day, s.to);
      if (en.getTime() <= from.getTime() || st.getTime() >= to.getTime()) continue;
      out.push({ activityId: a.id, day, starts: st.toISOString(), ends: en.toISOString() });
    }
  }
  return out.sort((x, y) => x.starts.localeCompare(y.starts));
}

/** Prochaine séance à partir de maintenant (dans les 8 semaines), sinon null. */
export function nextSession(a: Pick<ChildActivity, 'id' | 'slots' | 'starts_on' | 'ends_on'>, now: Date): Session | null {
  return sessionsBetween(a, now, new Date(now.getTime() + 56 * 86400_000)).find((s) => Date.parse(s.starts) > now.getTime()) ?? null;
}

/**
 * Rappels hebdomadaires : un par heure de rappel (créneaux regroupés), `lead` minutes avant chaque séance. Un rappel
 * qui tombe avant minuit passe au jour précédent.
 */
export function reminderSchedules(slots: Slot[], lead: number): { weekdays: Weekday[]; hour: number; minute: number }[] {
  const byTime = new Map<string, Set<Weekday>>();
  for (const s of slots) {
    let m = minutesOf(s.from) - lead;
    let day = s.day as number;
    if (m < 0) { m += 1440; day = day === 1 ? 7 : day - 1; }
    const k = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    if (!byTime.has(k)) byTime.set(k, new Set());
    byTime.get(k)!.add(day as Weekday);
  }
  return [...byTime.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([k, days]) => ({ weekdays: [...days].sort((x, y) => x - y), hour: Number(k.slice(0, 2)), minute: Number(k.slice(3, 5)) }));
}

/** Téléphone du contact : chiffres, espaces, +, points, tirets, parenthèses (4 à 30). */
export const validPhone = (s: string) => /^[0-9+(). -]{4,30}$/.test(s.trim());
