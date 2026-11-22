/**
 * Résumés de sommeil d'UN enfant, calculés à partir des sessions enregistrées (la même donnée source pour la mini-app,
 * la catégorie, l'accueil et le brouillon de relais : rien n'est recopié). Pur, testé (src/__tests__/sleepSummary.test.ts).
 *
 *  - Jour sans aucune saisie → `minutes: null` (« rien de noté »), jamais 0 : un vrai zéro n'existe que si une session
 *    du jour a duré 0 min, ce qui n'arrive pas. L'affichage distingue les deux.
 *  - Une session qui traverse minuit est répartie sur les deux jours (minutes de chaque jour civil local).
 *  - Une session en cours compte jusqu'à `now`.
 */
export interface SleepLike { id: string; child_id: string; started_at: string; ended_at: string | null; note?: string | null; kind?: string | null }

export interface DaySleep { day: string; minutes: number | null; sessions: SleepLike[] }

/**
 * Sieste de jour ? `kind` 'nap' ; sans type : commencée entre 7 h et 20 h (heure locale) et, si terminée, le même jour —
 * même règle que nap-window.ts. Une nuit sans type (ex. 1 h 20 → 11 h 20) n'est jamais comptée comme une sieste.
 */
export function isDayNap(s: SleepLike): boolean {
  if (s.kind === 'nap') return true;
  if (s.kind === 'night') return false;
  const a = new Date(s.started_at);
  if (a.getHours() < 7 || a.getHours() >= 20) return false;
  if (!s.ended_at) return true;
  const b = new Date(s.ended_at);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MIN = 60_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Durée d'une session en minutes (en cours : jusqu'à `now`). */
export const sessionMinutes = (s: SleepLike, now: Date) => Math.max(0, Math.round(((s.ended_at ? Date.parse(s.ended_at) : now.getTime()) - Date.parse(s.started_at)) / MIN));

/** Minutes de sommeil par jour civil local, des `days` derniers jours jusqu'à `now` inclus (plus ancien d'abord). */
export function sleepByDay(all: readonly SleepLike[], childId: string, now: Date, days: number, kind: 'nap' | 'all' = 'nap'): DaySleep[] {
  const mine = all.filter((s) => s.child_id === childId && (kind === 'all' || isDayNap(s)));
  const first = startOfDay(addDays(now, -(days - 1)));
  const out: DaySleep[] = [];
  for (let i = 0; i < days; i++) {
    const a = addDays(first, i); const b = addDays(first, i + 1);
    let minutes = 0; const sessions: SleepLike[] = [];
    for (const s of mine) {
      const s0 = Date.parse(s.started_at); const s1 = s.ended_at ? Date.parse(s.ended_at) : now.getTime();
      const lo = Math.max(s0, a.getTime()); const hi = Math.min(s1, b.getTime(), now.getTime());
      if (hi > lo) { minutes += (hi - lo) / MIN; sessions.push(s); }
    }
    out.push({ day: dayKey(a), minutes: sessions.length ? Math.round(minutes) : null, sessions: sessions.sort((x, y) => x.started_at.localeCompare(y.started_at)) });
  }
  return out;
}

/** Total de la période : somme des seuls jours renseignés ; `null` si aucun jour ne l'est. */
export function periodTotal(days: readonly DaySleep[]): { minutes: number | null; knownDays: number } {
  const known = days.filter((d) => d.minutes != null);
  return { minutes: known.length ? known.reduce((n, d) => n + (d.minutes ?? 0), 0) : null, knownDays: known.length };
}

/** Dernière sieste (en cours d'abord, sinon la plus récente terminée) de cet enfant. */
export function lastNap(all: readonly SleepLike[], childId: string): SleepLike | null {
  const mine = all.filter((s) => s.child_id === childId && isDayNap(s));
  return mine.find((s) => !s.ended_at) ?? [...mine].filter((s) => s.ended_at).sort((a, b) => b.ended_at!.localeCompare(a.ended_at!))[0] ?? null;
}

/**
 * Correction de la fin d'une session : nouvelle fin à `hhmm` le même jour que le début (ou le lendemain si l'heure
 * est avant le début : session qui traverse minuit). Début inchangé. `null` si l'heure est invalide.
 */
export function proposedEnd(s: SleepLike, hhmm: string): Date | null {
  const m = /^([01]?\d|2[0-3])[:h ]?([0-5]\d)$/.exec(hhmm.trim().replace(/\s+/g, ''));
  if (!m) return null;
  const a = new Date(s.started_at);
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate(), Number(m[1]), Number(m[2]));
  if (b.getTime() <= a.getTime()) b.setDate(b.getDate() + 1);
  return b;
}
