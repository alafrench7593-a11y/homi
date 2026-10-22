/**
 * Résumé d'un mois du cycle (Premium) : des faits notés, comptés, jamais interprétés ni présentés comme un diagnostic.
 */
import { daysBetween } from './dates';

export interface MonthInput {
  periods: { start_date: string; end_date: string | null }[];
  logs: { logged_on: string; symptom_keys?: string[] | null; moods?: string[] | null; pain_intensity?: number | null; sleep_tags?: string[] | null }[];
}
export interface MonthSummary {
  month: string; // AAAA-MM
  periodStarts: string[];
  periodDays: number;
  cycleLengths: number[]; // cycles qui commencent dans le mois et dont on connaît le début suivant (ou précédent)
  daysLogged: number;
  topSymptoms: { key: string; count: number }[];
  topMoods: { key: string; count: number }[];
  painMax: number | null;
  difficultNights: number;
}
const INTIMATE = new Set(['libido_up', 'libido_down', 'dyspareunia', 'discomfort']);
const top = (m: Map<string, number>, n = 5) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([key, count]) => ({ key, count }));

export function monthlySummary(month: string, input: MonthInput, opts: { includeIntimate?: boolean; today: string }): MonthSummary {
  const inMonth = (iso: string) => iso.slice(0, 7) === month;
  const starts = [...new Set(input.periods.map((p) => p.start_date))].sort();
  const first = `${month}-01`;
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
  let periodDays = 0;
  for (const p of input.periods) {
    const end = p.end_date ?? (daysBetween(p.start_date, opts.today) <= 9 ? opts.today : p.start_date);
    const a = p.start_date > first ? p.start_date : first;
    const b = end < last ? end : last;
    if (a <= b) periodDays += daysBetween(a, b) + 1;
  }
  const cycleLengths: number[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    if (!inMonth(starts[i + 1])) continue;
    const len = daysBetween(starts[i], starts[i + 1]);
    if (len >= 15 && len <= 60) cycleLengths.push(len);
  }
  const logs = input.logs.filter((l) => inMonth(l.logged_on));
  const sym = new Map<string, number>(); const moods = new Map<string, number>();
  let painMax: number | null = null; let difficult = 0;
  for (const l of logs) {
    for (const k of l.symptom_keys ?? []) if (opts.includeIntimate || !INTIMATE.has(k)) sym.set(k, (sym.get(k) ?? 0) + 1);
    for (const k of l.moods ?? []) moods.set(k, (moods.get(k) ?? 0) + 1);
    if (l.pain_intensity != null) painMax = Math.max(painMax ?? 0, l.pain_intensity);
    if ((l.sleep_tags ?? []).includes('difficult')) difficult++;
  }
  return {
    month, periodStarts: starts.filter(inMonth), periodDays, cycleLengths, daysLogged: new Set(logs.map((l) => l.logged_on)).size,
    topSymptoms: top(sym), topMoods: top(moods), painMax, difficultNights: difficult,
  };
}

export const shiftMonth = (month: string, delta: number) => {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
};
