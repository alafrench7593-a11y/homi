/** Tableau de bord de l'enfant : logique pure (testée). */

/** Minutes de sommeil situées AUJOURD'HUI (minuit → maintenant), chevauchements comptés une seule fois. */
export function todaySleepMinutes(sleeps: readonly { start: string; end: string | null }[], now: Date): number {
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
  const a0 = midnight.getTime(); const b0 = now.getTime();
  const segs = sleeps
    .map((s) => [Math.max(Date.parse(s.start), a0), Math.min(s.end ? Date.parse(s.end) : b0, b0)] as const)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((x, y) => x[0] - y[0]);
  let total = 0; let cursor = a0;
  for (const [a, b] of segs) { const from = Math.max(a, cursor); if (b > from) { total += b - from; cursor = b; } }
  return Math.round(total / 60_000);
}
