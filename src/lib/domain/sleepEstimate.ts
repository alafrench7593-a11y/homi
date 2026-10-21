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
