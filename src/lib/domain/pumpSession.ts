/**
 * TIRE-LAIT — séances de `pumpings` (22/11/2026). Fonctions PURES, testées (src/__tests__/breastSession.test.ts).
 * Seuls des ml s'additionnent avec des ml ; un jour sans séance = null (« rien de noté »), jamais 0.
 * Une séance notée à 0 ml est un vrai zéro (le parent l'a noté) et compte comme séance.
 */
import { dayKey } from './sleepSummary';

export interface PumpLike { id: string; child_id: string; at: string; amount_ml: number; side: 'left' | 'right' | 'both' | null; note?: string | null }
export interface DayPump { day: string; count: number; ml: number | null; sessions: PumpLike[] }

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Séances de CET enfant par jour civil local, des `days` derniers jours jusqu'à `now` (plus ancien d'abord). */
export function pumpsByDay(all: readonly PumpLike[], childId: string, now: Date, days: number): DayPump[] {
  const mine = all.filter((p) => p.child_id === childId && Number.isFinite(Date.parse(p.at)));
  const first = addDays(now, -(days - 1));
  const out: DayPump[] = [];
  for (let i = 0; i < days; i++) {
    const a = addDays(first, i).getTime(); const b = addDays(first, i + 1).getTime();
    const sessions = mine.filter((p) => { const t = Date.parse(p.at); return t >= a && t < b && t <= now.getTime() + 60_000; })
      .sort((x, y) => x.at.localeCompare(y.at));
    const counted = sessions.filter((p) => Number.isFinite(p.amount_ml));
    out.push({ day: dayKey(new Date(a)), count: sessions.length, ml: counted.length ? counted.reduce((n, p) => n + p.amount_ml, 0) : null, sessions });
  }
  return out;
}

/** Quantité saisie (« 120 », « 120 ml ») → entier 0–1000, sinon null. */
export function parsePumpMl(text: string): number | null {
  const m = /^\s*(\d{1,4})\s*(ml)?\s*$/i.exec(text);
  if (!m) return null;
  const v = Number(m[1]);
  return v >= 0 && v <= 1000 ? v : null;
}

/** Dernière séance de cet enfant. */
export function lastPump(all: readonly PumpLike[], childId: string): PumpLike | null {
  return all.filter((p) => p.child_id === childId).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
}
