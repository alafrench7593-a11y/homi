/**
 * Suivi des mini-apps Soins et Santé, vague 3 (22/11/2026) — fonctions PURES (testées dans
 * src/__tests__/careTrack.test.ts). Règles communes :
 *  · un jour sans saisie vaut `null` (« rien de noté »), JAMAIS 0 ;
 *  · on ne compte ensemble que des saisies de même nature (dents avec dents, nuits avec nuits) ;
 *  · aucun score, aucune moyenne, aucune interprétation : seulement ce qui a été noté.
 */
import { dayDate, isoDay, parseIsoDay, shiftDay } from './journalTrack';
import { estimateSleepMinutes, nightMinutes, parseHHMM, resolveNight } from './parentSleep';
import { frToISO } from './dates';
import type { NightWaking } from '../types-sleep';

// ------------------------------------------------------------------ jours
/** Jour local (AAAA-MM-JJ) d'un horodatage. */
export const dayOfStamp = (iso: string) => isoDay(new Date(iso));

/** Les `n` derniers jours jusqu'à `today` inclus, du plus ancien au plus récent. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
}

/** Nombre de saisies par jour ; un jour sans saisie vaut `null` (jamais 0). */
export function countsByDay<T>(items: readonly T[], dayOf: (x: T) => string | null, days: readonly string[]): Record<string, number | null> {
  const out: Record<string, number | null> = Object.fromEntries(days.map((d) => [d, null]));
  for (const it of items) {
    const d = dayOf(it);
    if (d && d in out) out[d] = (out[d] ?? 0) + 1;
  }
  return out;
}

/** Saisies d'un jour, de la plus tardive à la plus ancienne. */
export function entriesOn<T>(items: readonly T[], dayOf: (x: T) => string | null, at: (x: T) => string, day: string): T[] {
  return items.filter((x) => dayOf(x) === day).sort((a, b) => (at(a) < at(b) ? 1 : at(a) > at(b) ? -1 : 0));
}

/** Nombre de saisies du jour, ou `null` s'il n'y en a aucune (remontée catégorie). */
export function countOn<T>(items: readonly T[], dayOf: (x: T) => string | null, day: string): number | null {
  const n = items.filter((x) => dayOf(x) === day).length;
  return n || null;
}

/** Jour gardé dans l'adresse, borné à aujourd'hui (pas de jour futur). */
export function urlDay(param: string | string[] | null | undefined, today: string): string {
  const d = parseIsoDay(param);
  return d && d <= today ? d : today;
}

// ------------------------------------------------------------------ dates saisies « JJ/MM/AAAA »
export type DateCheck = { ok: true; iso: string | null } | { ok: false; reason: 'format' | 'future' | 'before' };
/** Date facultative ou obligatoire, jamais dans le futur, jamais avant `min` (naissance). */
export function checkDate(text: string, today: string, opts: { required?: boolean; min?: string | null } = {}): DateCheck {
  if (!text.trim()) return opts.required ? { ok: false, reason: 'format' } : { ok: true, iso: null };
  const iso = frToISO(text);
  if (!iso) return { ok: false, reason: 'format' };
  if (iso > today) return { ok: false, reason: 'future' };
  if (opts.min && iso < opts.min) return { ok: false, reason: 'before' };
  return { ok: true, iso };
}

// ------------------------------------------------------------------ dents
export interface ToothLike { id: string; title: string; happened_on: string | null }
/** Dents notées : nombre, dernière et première date connues (aucune comparaison, aucune norme). */
export function teethFacts(teeth: readonly ToothLike[]): { count: number; dated: number; first: string | null; last: string | null } {
  const dates = teeth.map((t) => t.happened_on).filter((d): d is string => !!d).sort();
  return { count: teeth.length, dated: dates.length, first: dates[0] ?? null, last: dates[dates.length - 1] ?? null };
}
/** Dents de la plus récente à la plus ancienne ; sans date à la fin. */
export function teethByDate<T extends ToothLike>(teeth: readonly T[]): T[] {
  return [...teeth].sort((a, b) => (a.happened_on && b.happened_on ? b.happened_on.localeCompare(a.happened_on) : a.happened_on ? -1 : b.happened_on ? 1 : a.title.localeCompare(b.title)));
}

// ------------------------------------------------------------------ sommeil de la mère
export interface NightLike {
  id: string; log_date: string; bedtime: string | null; wake_time: string | null; sleep_minutes: number | null;
  waking_details: NightWaking[]; night_wakings: number; duration_edited?: boolean;
}
export interface DayNight<T extends NightLike = NightLike> { day: string; minutes: number | null; log: T | null }

/** Une colonne par nuit (jour du réveil) ; nuit non notée ou sans durée → `minutes: null` (jamais 0). */
export function nightsByDay<T extends NightLike>(logs: readonly T[], days: readonly string[]): DayNight<T>[] {
  return days.map((day) => {
    const log = logs.find((l) => l.log_date === day) ?? null;
    return { day, log, minutes: log ? nightMinutes(log) : null };
  });
}

/** Nuits dont la durée est connue, et leur nombre de réveils notés (même nature : réveils avec réveils). */
export function nightsKnown(days: readonly DayNight[]): { known: number; wakings: number | null } {
  const k = days.filter((d) => d.minutes != null);
  const logged = days.filter((d) => d.log);
  return { known: k.length, wakings: logged.length ? logged.reduce((s, d) => s + (d.log?.night_wakings ?? 0), 0) : null };
}

export type NightFix = { ok: true; patch: Record<string, unknown> } | { ok: false; reason: 'time' | 'same' | 'wakings' };
/**
 * Correction d'une nuit : heures du coucher et du réveil, nombre de réveils. Les heures se replacent sur la nuit de
 * `log_date` ; si elles changent, la durée est RECALCULÉE à partir des heures (moins les éveils notés) et la durée
 * saisie à la main est abandonnée — c'est dit dans la fiche.
 */
export function nightFix(log: NightLike, draft: { bed: string; wake: string; wakings: string }): NightFix {
  const bed = draft.bed.trim();
  const wake = draft.wake.trim();
  const w = draft.wakings.trim() === '' ? 0 : Number(draft.wakings);
  if (!Number.isInteger(w) || w < 0 || w > 30) return { ok: false, reason: 'wakings' };
  const patch: Record<string, unknown> = {};
  if (bed || wake) {
    if (parseHHMM(bed) == null || parseHHMM(wake) == null) return { ok: false, reason: 'time' };
    const night = resolveNight(log.log_date, bed, wake);
    if (!night) return { ok: false, reason: 'same' };
    const b = night.bedtime.toISOString();
    const wk = night.wake.toISOString();
    if (b !== log.bedtime || wk !== log.wake_time) {
      patch.bedtime = b;
      patch.wake_time = wk;
      patch.sleep_minutes = estimateSleepMinutes(b, wk, log.waking_details ?? []);
      patch.duration_edited = false;
    }
  }
  const details = (log.waking_details ?? []).length;
  const nextW = Math.max(w, details);
  if (nextW !== log.night_wakings) patch.night_wakings = nextW;
  return { ok: true, patch };
}

// ------------------------------------------------------------------ démarches (liste à cocher)
/** « 3 / 10 » démarches faites ; liste vide → `null`. */
export function stepsProgress(items: readonly { done: boolean }[]): { done: number; total: number } | null {
  if (!items.length) return null;
  return { done: items.filter((i) => i.done).length, total: items.length };
}

// ------------------------------------------------------------------ « Je suis à bout »
/** Réponses complètes (6 valeurs entières de 0 à 3) ? */
export function answersComplete(a: readonly (number | null | undefined)[], n = 6): a is number[] {
  return a.length === n && a.every((v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 3);
}

// ------------------------------------------------------------------ mois (album, documents)
export const monthOf = (iso: string) => iso.slice(0, 7);
/** Mois gardé dans l'adresse (« AAAA-MM »), jamais après le mois en cours. */
export function urlMonth(param: string | string[] | null | undefined, today: string): string {
  const s = Array.isArray(param) ? param[0] : param;
  const cur = monthOf(today);
  return s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s) && s <= cur ? s : cur;
}
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
/** Nombre par mois sur les `n` derniers mois ; mois sans saisie → `null`. */
export function countsByMonth<T>(items: readonly T[], dateOf: (x: T) => string | null, lastMonth: string, n: number): { month: string; count: number | null }[] {
  const months = Array.from({ length: n }, (_, i) => shiftMonth(lastMonth, i - (n - 1)));
  return months.map((month) => {
    const c = items.filter((x) => { const d = dateOf(x); return !!d && monthOf(d) === month; }).length;
    return { month, count: c || null };
  });
}

// ------------------------------------------------------------------ journal (période dans l'adresse)
export type JournalPeriod = 'day' | 'week' | 'month';
export const journalPeriod = (p: string | string[] | null | undefined): JournalPeriod => (p === 'day' || p === 'month' ? p : 'week');
/** Bornes [début, fin[ d'une période contenant `day` (semaine du lundi). */
export function periodBounds(period: JournalPeriod, day: string): { from: string; to: string } {
  if (period === 'day') return { from: day, to: shiftDay(day, 1) };
  if (period === 'week') {
    const d = dayDate(day);
    const mon = shiftDay(day, -((d.getDay() + 6) % 7));
    return { from: mon, to: shiftDay(mon, 7) };
  }
  const first = `${day.slice(0, 7)}-01`;
  return { from: first, to: `${shiftMonth(day.slice(0, 7), 1)}-01` };
}
/** Comptes par catégorie (même nature) ; seules les catégories présentes. */
export function countByKey<T>(items: readonly T[], key: (x: T) => string): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}
