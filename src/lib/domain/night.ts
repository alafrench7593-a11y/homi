/**
 * Résumé d'une nuit (logique pure, testée) : uniquement ce que les parents ont noté — périodes de sommeil, réveils,
 * tétées et biberons entre 19 h et 8 h. Aucune norme, aucun score, aucun jugement : un simple récapitulatif.
 */
import type { Bottle, Breastfeed, Sleep } from '../types';

export interface NightSummary {
  /** Date du soir (AAAA-MM-JJ) : la nuit du 12 au 13 a pour date le 12. */
  evening: string;
  sleepMinutes: number;
  periods: number;
  wakings: number;
  feeds: number;
  longestMinutes: number;
  /** Une période de sommeil est encore en cours. */
  ongoing: boolean;
  hasData: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Bornes locales de la nuit : 19 h le soir donné → 8 h le lendemain. */
export function nightBounds(evening: string): [Date, Date] {
  const [y, m, d] = evening.split('-').map(Number);
  return [new Date(y, m - 1, d, 19, 0, 0), new Date(y, m - 1, d + 1, 8, 0, 0)];
}

/** Soir de la nuit en cours ou de la dernière nuit (avant 12 h : la nuit d'hier soir). */
export function currentEvening(now = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 12) d.setDate(d.getDate() - 1);
  return localISO(d);
}

export function nightSummary(evening: string, logs: { sleeps: Sleep[]; breastfeeds: Breastfeed[]; bottles: Bottle[] }, now = new Date()): NightSummary {
  const [a, b] = nightBounds(evening);
  const A = a.getTime(); const B = b.getTime();
  let sleepMinutes = 0; let periods = 0; let wakings = 0; let longest = 0; let ongoing = false;
  for (const s of logs.sleeps) {
    const start = new Date(s.started_at).getTime();
    const end = s.ended_at ? new Date(s.ended_at).getTime() : Math.min(now.getTime(), B);
    if (end <= A || start >= B) continue;
    const mins = Math.max(0, Math.round((Math.min(end, B) - Math.max(start, A)) / 60000));
    if (!s.ended_at) ongoing = true;
    periods += 1;
    sleepMinutes += mins;
    longest = Math.max(longest, mins);
    wakings += Math.max(s.wake_events?.length ?? 0, s.wakeups ?? 0);
  }
  // Entre deux périodes de sommeil de la même nuit, l'enfant s'est réveillé
  if (periods > 1) wakings += periods - 1;
  const inNight = (iso: string) => { const t = new Date(iso).getTime(); return t >= A && t < B; };
  const feeds = logs.breastfeeds.filter((f) => inNight(f.started_at)).length + logs.bottles.filter((x) => inNight(x.at)).length;
  return { evening, sleepMinutes, periods, wakings, feeds, longestMinutes: longest, ongoing, hasData: periods > 0 || feeds > 0 };
}

/** Les dernières nuits (la plus récente d'abord). */
export function lastNights(n: number, logs: Parameters<typeof nightSummary>[1], now = new Date()): NightSummary[] {
  const out: NightSummary[] = [];
  const first = currentEvening(now);
  const [y, m, d] = first.split('-').map(Number);
  for (let i = 0; i < n; i++) out.push(nightSummary(localISO(new Date(y, m - 1, d - i)), logs, now));
  return out;
}
