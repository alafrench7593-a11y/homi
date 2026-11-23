/** Synthèses du suivi quotidien — descriptives, jamais interprétatives. */
import { getLocale } from '@/i18n';
import { WEEKDAYS_SHORT } from '@/i18n/formats';

export interface BottleLog { at: string; prepared_ml?: number | null; consumed_ml?: number | null }
export interface FeedLog { started_at: string; ended_at?: string | null; side: 'left' | 'right' | 'both' }
export interface DiaperLog { at: string; wet: boolean; stool: boolean }
export interface SleepLog { started_at: string; ended_at?: string | null; wakeups?: number }

const minutes = (a: string, b: string | Date) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;
const sameDay = (iso: string, day: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
};

export interface DaySummary {
  bottles: number;
  bottleMl: number;
  feeds: number;
  feedMinutes: number;
  lastSide: FeedLog['side'] | null;
  diapers: number;
  wet: number;
  stools: number;
  sleepMinutes: number;
  ongoingSleep: SleepLog | null;
  lastFeedAt: string | null;
}

export function summarizeDay(
  day: Date,
  data: { bottles?: BottleLog[]; feeds?: FeedLog[]; diapers?: DiaperLog[]; sleeps?: SleepLog[] },
  now: Date = new Date(),
): DaySummary {
  const bottles = (data.bottles ?? []).filter((b) => sameDay(b.at, day));
  const feeds = (data.feeds ?? []).filter((f) => sameDay(f.started_at, day));
  const diapers = (data.diapers ?? []).filter((d) => sameDay(d.at, day));
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  // Lendemain 0 h en heure locale (et non « + 24 h ») : les jours de changement d'heure durent 23 h ou 25 h
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

  // Sommeil : on compte la part de chaque session comprise dans la journée
  let sleepMinutes = 0;
  let ongoing: SleepLog | null = null;
  for (const s of data.sleeps ?? []) {
    const start = new Date(s.started_at);
    const end = s.ended_at ? new Date(s.ended_at) : now;
    if (!s.ended_at) ongoing = s;
    const a = Math.max(start.getTime(), dayStart.getTime());
    const b = Math.min(end.getTime(), dayEnd.getTime());
    if (b > a) sleepMinutes += (b - a) / 60000;
  }

  const allFeeds = [
    ...(data.bottles ?? []).map((b) => b.at),
    ...(data.feeds ?? []).map((f) => f.started_at),
  ].sort();
  const sortedFeeds = [...feeds].sort((a, b) => a.started_at.localeCompare(b.started_at));

  return {
    bottles: bottles.length,
    bottleMl: bottles.reduce((t, b) => t + (b.consumed_ml ?? b.prepared_ml ?? 0), 0),
    feeds: feeds.length,
    feedMinutes: Math.round(feeds.reduce((t, f) => t + (f.ended_at ? Math.max(0, minutes(f.started_at, f.ended_at)) : 0), 0)),
    lastSide: sortedFeeds.length ? sortedFeeds[sortedFeeds.length - 1].side : null,
    diapers: diapers.length,
    wet: diapers.filter((d) => d.wet).length,
    stools: diapers.filter((d) => d.stool).length,
    sleepMinutes: Math.round(sleepMinutes),
    ongoingSleep: ongoing,
    lastFeedAt: allFeeds.length ? allFeeds[allFeeds.length - 1] : null,
  };
}

/** Totaux sur N jours pour les graphiques (préparation d'un rendez-vous). */
export function lastDaysSeries<T>(days: number, items: T[], getDate: (t: T) => string, value: (t: T) => number, now = new Date()) {
  const out: { label: string; value: number; date: Date }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const v = items.filter((it) => sameDay(getDate(it), d)).reduce((t, it) => t + value(it), 0);
    out.push({ label: (WEEKDAYS_SHORT[getLocale()] ?? WEEKDAYS_SHORT.fr)[d.getDay() || 7].replace('.', ''), value: v, date: d });
  }
  return out;
}

/** Quantité BUE notée (ml) pour le graphique « Lait bu par jour » : jamais la quantité préparée. */
export const drunkMl = (b: Pick<BottleLog, 'consumed_ml'>): number => b.consumed_ml ?? 0;

/** Suggestion de côté pour la prochaine tétée : simple rappel de l'alternance, à titre indicatif. */
export function suggestedNextSide(last: FeedLog['side'] | null): 'left' | 'right' | null {
  if (last === 'left') return 'right';
  if (last === 'right') return 'left';
  return null;
}
