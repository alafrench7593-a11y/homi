/**
 * Sommeil du bébé : totaux du jour et estimation du prochain repos.
 * L'estimation repose UNIQUEMENT sur les relevés de la famille (7 derniers jours) : médiane des temps d'éveil entre
 * deux sommeils notés. Ce n'est ni une norme ni une consigne : les signes de fatigue de l'enfant priment.
 * Aucune estimation sans au moins 3 temps d'éveil notés.
 */
import type { SleepLog } from './daily';

const MIN = 60_000;
export const ESTIMATE_DAYS = 7;
export const MIN_SAMPLES = 3;

const isNight = (d: Date) => d.getHours() >= 19 || d.getHours() < 7;

/** Temps d'éveil (minutes) entre la fin d'un sommeil et le début du suivant, sur les N derniers jours. */
export function wakeWindows(sleeps: SleepLog[], now = new Date(), days = ESTIMATE_DAYS): number[] {
  const from = now.getTime() - days * 86_400_000;
  const done = sleeps.filter((s) => s.ended_at && Date.parse(s.started_at) >= from).sort((a, b) => a.started_at.localeCompare(b.started_at));
  const out: number[] = [];
  for (let i = 1; i < done.length; i++) {
    const gap = (Date.parse(done[i].started_at) - Date.parse(done[i - 1].ended_at!)) / MIN;
    // entre 20 min et 6 h : au-delà, un relevé manque probablement
    if (gap >= 20 && gap <= 360) out.push(gap);
  }
  return out;
}

const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export type RestEstimate =
  | { kind: 'asleep'; since: string }
  | { kind: 'not_enough'; samples: number }
  | { kind: 'estimate'; at: Date; medianMinutes: number; samples: number; lastWake: string };

export function nextRestEstimate(sleeps: SleepLog[], now = new Date()): RestEstimate {
  const open = sleeps.find((s) => !s.ended_at);
  if (open) return { kind: 'asleep', since: open.started_at };
  const w = wakeWindows(sleeps, now);
  if (w.length < MIN_SAMPLES) return { kind: 'not_enough', samples: w.length };
  const last = sleeps.filter((s) => s.ended_at).sort((a, b) => b.ended_at!.localeCompare(a.ended_at!))[0];
  const med = Math.round(median(w) / 5) * 5;
  const at = new Date(Date.parse(last.ended_at!) + med * MIN);
  // dernier réveil trop ancien (relevé oublié) : pas d'estimation trompeuse
  if (now.getTime() - at.getTime() > 90 * MIN) return { kind: 'not_enough', samples: w.length };
  return { kind: 'estimate', at, medianMinutes: med, samples: w.length, lastWake: last.ended_at! };
}

export interface SleepDay { naps: number; napMinutes: number; nightMinutes: number; nightWakeups: number }

/** Totaux pour une journée : siestes (début entre 7 h et 19 h) et nuit (début le soir ou la nuit), réveils notés. */
export function sleepDay(sleeps: SleepLog[], day: Date, now = new Date()): SleepDay {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const end = start + 86_400_000;
  const r: SleepDay = { naps: 0, napMinutes: 0, nightMinutes: 0, nightWakeups: 0 };
  for (const s of sleeps) {
    const a = Date.parse(s.started_at);
    if (a < start || a >= end) continue;
    const b = s.ended_at ? Date.parse(s.ended_at) : now.getTime();
    const minutes = Math.max(0, Math.round((b - a) / MIN));
    if (isNight(new Date(a))) { r.nightMinutes += minutes; r.nightWakeups += s.wakeups ?? 0; } else { r.naps++; r.napMinutes += minutes; }
  }
  return r;
}

export interface SleepRhythm { days: number; naps: number; napMinutes: number; nightMinutes: number; totalMinutes: number; wakeups: number }

/** Moyennes par jour sur N jours complets (aujourd'hui exclu), d'après les relevés de la famille. */
export function sleepRhythm(sleeps: SleepLog[], now = new Date(), days = 7): SleepRhythm {
  const out: SleepDay[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push(sleepDay(sleeps, d, now));
  }
  const withData = out.filter((x) => x.naps || x.napMinutes || x.nightMinutes);
  const n = Math.max(1, withData.length);
  const avg = (f: (x: SleepDay) => number) => Math.round(withData.reduce((t, x) => t + f(x), 0) / n);
  return {
    days: withData.length,
    naps: Math.round((withData.reduce((t, x) => t + x.naps, 0) / n) * 10) / 10,
    napMinutes: avg((x) => x.napMinutes),
    nightMinutes: avg((x) => x.nightMinutes),
    totalMinutes: avg((x) => x.napMinutes + x.nightMinutes),
    wakeups: Math.round((withData.reduce((t, x) => t + x.nightWakeups, 0) / n) * 10) / 10,
  };
}

/** Série quotidienne (pour les graphiques), du plus ancien au plus récent ; aujourd'hui inclus. */
export function sleepSeries(sleeps: SleepLog[], now = new Date(), days = 7) {
  return Array.from({ length: days }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - k));
    const s = sleepDay(sleeps, d, now);
    return { date: d, napMinutes: s.napMinutes, nightMinutes: s.nightMinutes, total: s.napMinutes + s.nightMinutes };
  });
}

export interface HabitChange { kind: 'night_shorter' | 'night_longer' | 'more_wakeups' | 'fewer_naps' | 'more_naps'; text: string }

/**
 * Changements d'habitude : 3 derniers jours comparés aux 7 jours précédents. Constat seulement, jamais un diagnostic.
 * Il faut au moins 2 jours notés de chaque côté ; seuils volontairement prudents (± 45 min, ± 1 réveil, ± 1 sieste).
 */
export function habitChanges(sleeps: SleepLog[], now = new Date()): HabitChange[] {
  const recentDays: SleepDay[] = []; const beforeDays: SleepDay[] = [];
  for (let i = 1; i <= 10; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const s = sleepDay(sleeps, d, now);
    if (!(s.naps || s.nightMinutes)) continue;
    (i <= 3 ? recentDays : beforeDays).push(s);
  }
  if (recentDays.length < 2 || beforeDays.length < 2) return [];
  const m = (xs: SleepDay[], f: (x: SleepDay) => number) => xs.reduce((t, x) => t + f(x), 0) / xs.length;
  const out: HabitChange[] = [];
  const night = m(recentDays, (x) => x.nightMinutes) - m(beforeDays, (x) => x.nightMinutes);
  if (night <= -45) out.push({ kind: 'night_shorter', text: `Les nuits notées ces 3 derniers jours sont plus courtes d’environ ${Math.round(-night)} min que les jours précédents.` });
  if (night >= 45) out.push({ kind: 'night_longer', text: `Les nuits notées ces 3 derniers jours sont plus longues d’environ ${Math.round(night)} min que les jours précédents.` });
  const wk = m(recentDays, (x) => x.nightWakeups) - m(beforeDays, (x) => x.nightWakeups);
  if (wk >= 1) out.push({ kind: 'more_wakeups', text: `Environ ${Math.round(wk)} réveil(s) de plus par nuit ces derniers jours.` });
  const naps = m(recentDays, (x) => x.naps) - m(beforeDays, (x) => x.naps);
  if (naps <= -1) out.push({ kind: 'fewer_naps', text: 'Une sieste de moins par jour environ ces derniers jours.' });
  if (naps >= 1) out.push({ kind: 'more_naps', text: 'Une sieste de plus par jour environ ces derniers jours.' });
  return out;
}

/** Récapitulatif hebdomadaire (semaine glissante) en phrases simples. */
export function weeklySleepRecap(sleeps: SleepLog[], now = new Date()): string[] {
  const r = sleepRhythm(sleeps, now, 7);
  if (!r.days) return [];
  const h = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
  return [
    `${r.days} jour(s) noté(s) sur les 7 derniers.`,
    `En moyenne : ${String(r.naps).replace('.', ',')} sieste(s) par jour (${h(r.napMinutes)}), nuit de ${h(r.nightMinutes)}.`,
    `Sommeil total moyen noté : ${h(r.totalMinutes)} par jour.`,
    r.wakeups ? `Réveils notés la nuit : ${String(r.wakeups).replace('.', ',')} en moyenne.` : 'Aucun réveil noté la nuit.',
  ];
}
