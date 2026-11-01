/** Dates « calendaires » (sans heure) manipulées en UTC pour éviter les décalages d'heure d'été. */
import { t as tr, getLocale } from '@/i18n';

export type ISODate = string; // AAAA-MM-JJ

const DAY = 86_400_000;

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function todayISO(now = new Date()): ISODate {
  return toISODate(now);
}

/** Nombre de jours entiers entre deux dates calendaires (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / DAY);
}

export function addDays(a: ISODate, n: number): ISODate {
  const d = parseISODate(a);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Saisie française JJ/MM/AAAA -> ISO, ou null si invalide. */
export function frToISO(input: string): ISODate | null {
  const m = input.trim().match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return isValidISODate(iso) ? iso : null;
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatDateFr(iso: ISODate, withYear = true): string {
  const d = parseISODate(iso);
  const months = getLocale() === 'en' ? MONTHS_EN : MONTHS;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}${withYear ? ' ' + d.getUTCFullYear() : ''}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}${getLocale() === 'en' ? ':' : 'h'}${String(d.getMinutes()).padStart(2, '0')}`;
}

/** « il y a 2 h 15 », « il y a 12 min », « à l'instant » */
export function timeAgo(date: Date | string, now = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const min = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
  if (min < 1) return tr('l1.dates.justNow');
  if (min < 60) return tr('l1.dates.minAgo', { n: min });
  const h = Math.floor(min / 60);
  const r = min % 60;
  if (h < 24) return tr('l1.dates.hourAgo', { h, r: r ? ' ' + String(r).padStart(2, '0') : '' });
  const days = Math.floor(h / 24);
  return days === 1 ? tr('l1.dates.yesterday') : tr('l1.dates.daysAgo', { n: days });
}

export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

export type DayMoment = 'night' | 'morning' | 'afternoon' | 'evening';
export function dayMoment(now = new Date()): DayMoment {
  const h = now.getHours();
  if (h < 5 || h >= 23) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export function greeting(name: string | null | undefined, now = new Date()): string {
  const m = dayMoment(now);
  const k = m === 'night' ? 'night' : m === 'morning' ? 'morning' : m === 'afternoon' ? 'afternoon' : 'evening';
  return name ? tr(`greet.${k}Named` as const, { name }) : tr(`greet.${k}` as const);
}
