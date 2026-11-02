/**
 * Heure murale saisie → instant (aujourd'hui, hier, ou demain pour une heure à venir).
 * F-10 (QA 02/11/2026) : signale la nuit du changement d'heure (heure inexistante, ou présente deux fois).
 */
export function resolveTypedTime(h: number, min: number, opts: { future?: boolean; yesterday?: boolean; now?: Date } = {}): { date: Date; dst: 'missing' | 'twiceFirst' | 'twiceSecond' | null } {
  const now = opts.now ?? new Date();
  const d = new Date(now.getTime());
  d.setHours(h, min, 0, 0);
  if (opts.future && d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  if (!opts.future && opts.yesterday) d.setDate(d.getDate() - 1);
  d.setHours(h, min, 0, 0); // même heure murale le jour retenu
  if (d.getHours() !== h || d.getMinutes() !== min) return { date: d, dst: 'missing' };
  const same = (x: Date) => x.getHours() === h && x.getMinutes() === min;
  if (same(new Date(d.getTime() + 3600_000))) return { date: d, dst: 'twiceFirst' };
  if (same(new Date(d.getTime() - 3600_000))) return { date: d, dst: 'twiceSecond' };
  return { date: d, dst: null };
}
