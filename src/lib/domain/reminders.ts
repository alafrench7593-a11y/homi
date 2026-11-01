/**
 * Traduction d'une planification de rappel en déclencheurs de notifications LOCALES.
 * - Heures « murales » (DAILY / WEEKLY) : le système suit le fuseau et le changement d'heure.
 * - Rappel ponctuel : instant absolu (DATE), correct quel que soit le fuseau.
 * - « Toutes les N minutes » : déployé en heures fixes quotidiennes (robuste au changement d'heure,
 *   contrairement à un intervalle en secondes qui dériverait).
 */

import { t as tr, formatDate, getLocale } from '@/i18n';
import { localized } from '@/i18n/localized';

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = lundi … 7 = dimanche

export type ReminderSchedule =
  | { type: 'once'; at: string }
  | { type: 'daily'; hour: number; minute: number; from?: string | null; until?: string | null }
  | { type: 'weekly'; weekdays: Weekday[]; hour: number; minute: number; from?: string | null; until?: string | null }
  | { type: 'interval'; minutes: number; from_hour: number; to_hour: number };

export type PlannedTrigger =
  | { kind: 'date'; date: Date }
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekday: Weekday; hour: number; minute: number };

/** iOS limite à 64 notifications locales en attente pour TOUTE l'application. */
export const MAX_TRIGGERS_PER_REMINDER = 16;
export const IOS_PENDING_LIMIT = 64;

const clampInt = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

export function validateSchedule(s: unknown): s is ReminderSchedule {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  const hm = () => Number.isInteger(o.hour) && Number.isInteger(o.minute) && (o.hour as number) >= 0 && (o.hour as number) < 24 && (o.minute as number) >= 0 && (o.minute as number) < 60;
  switch (o.type) {
    case 'once': return typeof o.at === 'string' && !Number.isNaN(Date.parse(o.at));
    case 'daily': return hm();
    case 'weekly': return hm() && Array.isArray(o.weekdays) && o.weekdays.length > 0 && o.weekdays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7);
    case 'interval':
      return typeof o.minutes === 'number' && o.minutes >= 30 && o.minutes <= 720
        && Number.isInteger(o.from_hour) && Number.isInteger(o.to_hour) && (o.from_hour as number) >= 0 && (o.to_hour as number) <= 24 && (o.from_hour as number) < (o.to_hour as number);
    default: return false;
  }
}

export function planReminder(schedule: ReminderSchedule, now: Date = new Date(), snoozedUntil?: string | null): PlannedTrigger[] {
  const out: PlannedTrigger[] = [];
  if (snoozedUntil && Date.parse(snoozedUntil) > now.getTime()) {
    out.push({ kind: 'date', date: new Date(snoozedUntil) });
    if (schedule.type === 'once') return out; // le report remplace le rappel ponctuel
  }
  // Fenêtre de dates (ex. traitement prescrit du … au …) : prises datées une à une, rien après la date de fin
  if ((schedule.type === 'daily' || schedule.type === 'weekly') && (schedule.from || schedule.until)) {
    const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const from = schedule.from ?? ymd(now);
    const day = new Date(now); day.setHours(0, 0, 0, 0);
    if (from > ymd(day)) { const [y, m, d] = from.split('-').map(Number); day.setFullYear(y, m - 1, d); }
    if (!schedule.until && from <= ymd(now)) {
      // commencé et sans fin : rappel répété classique
    } else {
      for (let i = 0; i < 400 && out.length < MAX_TRIGGERS_PER_REMINDER; i++, day.setDate(day.getDate() + 1)) {
        if (schedule.until && ymd(day) > schedule.until) break;
        const iso = ((day.getDay() + 6) % 7) + 1;
        if (schedule.type === 'weekly' && !schedule.weekdays.includes(iso as Weekday)) continue;
        const at = new Date(day); at.setHours(clampInt(schedule.hour, 0, 23), clampInt(schedule.minute, 0, 59), 0, 0);
        if (at.getTime() > now.getTime()) out.push({ kind: 'date', date: at });
      }
      return out.slice(0, MAX_TRIGGERS_PER_REMINDER);
    }
  }
  switch (schedule.type) {
    case 'once': {
      const d = new Date(schedule.at);
      if (d.getTime() > now.getTime()) out.push({ kind: 'date', date: d });
      break;
    }
    case 'daily':
      out.push({ kind: 'daily', hour: clampInt(schedule.hour, 0, 23), minute: clampInt(schedule.minute, 0, 59) });
      break;
    case 'weekly':
      for (const wd of [...new Set(schedule.weekdays)].sort()) {
        out.push({ kind: 'weekly', weekday: wd, hour: clampInt(schedule.hour, 0, 23), minute: clampInt(schedule.minute, 0, 59) });
      }
      break;
    case 'interval': {
      const step = clampInt(schedule.minutes, 30, 720);
      for (let m = schedule.from_hour * 60; m < schedule.to_hour * 60 && out.length < MAX_TRIGGERS_PER_REMINDER; m += step) {
        out.push({ kind: 'daily', hour: Math.floor(m / 60), minute: m % 60 });
      }
      break;
    }
  }
  return out.slice(0, MAX_TRIGGERS_PER_REMINDER);
}

/** Expo : 1 = dimanche … 7 = samedi. Nous : 1 = lundi … 7 = dimanche. */
export function toExpoWeekday(d: Weekday): number {
  return (d % 7) + 1;
}

const WEEKDAY_SHORT_FR = ['', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const WEEKDAY_SHORT_EN = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_SHORT = localized(WEEKDAY_SHORT_FR, WEEKDAY_SHORT_EN);
const hm = (h: number, m: number) => (getLocale() === 'en' ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`);

export function describeSchedule(s: ReminderSchedule): string {
  switch (s.type) {
    case 'once': {
      const d = new Date(s.at);
      return tr('l6.rem.onceAt', { date: formatDate(d, { day: 'numeric', month: 'long' }), time: hm(d.getHours(), d.getMinutes()) });
    }
    case 'daily': return tr('l6.rem.dailyAt', { time: hm(s.hour, s.minute) });
    case 'weekly':
      return s.weekdays.length === 7 ? tr('l6.rem.dailyAt', { time: hm(s.hour, s.minute) }) : tr('l6.rem.weeklyAt', { days: [...s.weekdays].sort().map((d) => WEEKDAY_SHORT[d]).join(' '), time: hm(s.hour, s.minute) });
    case 'interval': {
      const h = Math.floor(s.minutes / 60);
      const m = s.minutes % 60;
      const every = h ? (m ? tr('l6.rem.hM', { h: String(h), m: String(m).padStart(2, '0') }) : tr('l6.rem.h', { h: String(h) })) : tr('l6.rem.min', { m: String(m) });
      return tr('l6.rem.interval', { every, from: hm(s.from_hour, 0), to: hm(s.to_hour % 24, 0) });
    }
  }
}

/** Prochaine échéance (pour l'accueil : « prochain rappel »). */
export function nextOccurrence(s: ReminderSchedule, now: Date = new Date()): Date | null {
  const plans = planReminder(s, now);
  let best: Date | null = null;
  for (const p of plans) {
    let d: Date;
    if (p.kind === 'date') d = p.date;
    else {
      d = new Date(now);
      d.setSeconds(0, 0);
      d.setHours(p.hour, p.minute);
      if (p.kind === 'daily') {
        if (d <= now) d.setDate(d.getDate() + 1);
      } else {
        const current = ((now.getDay() + 6) % 7) + 1; // 1 = lundi
        let delta = (p.weekday - current + 7) % 7;
        if (delta === 0 && d <= now) delta = 7;
        d.setDate(d.getDate() + delta);
      }
    }
    if (!best || d < best) best = d;
  }
  return best;
}
