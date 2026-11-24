/**
 * Comparaison de deux périodes (24/11/2026) — déterministe, sans IA. Moyenne des JOURS NOTÉS seulement (un jour sans
 * saisie n'est jamais un zéro) ; rien n'est affiché si l'une des périodes a moins de `minKnown` jours notés.
 */
export type PeriodCompare = { avg: number; prevAvg: number; deltaPct: number; trend: 'up' | 'down' | 'same' };

const mean = (xs: (number | null | undefined)[]) => {
  const k = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  return { n: k.length, avg: k.length ? k.reduce((s, x) => s + x, 0) / k.length : 0 };
};

export function comparePeriods(cur: (number | null | undefined)[], prev: (number | null | undefined)[], minKnown = 3, sameBelowPct = 5): PeriodCompare | null {
  const a = mean(cur), b = mean(prev);
  if (a.n < minKnown || b.n < minKnown || b.avg <= 0) return null;
  const deltaPct = Math.round(((a.avg - b.avg) / b.avg) * 100);
  return { avg: Math.round(a.avg), prevAvg: Math.round(b.avg), deltaPct, trend: Math.abs(deltaPct) < sameBelowPct ? 'same' : deltaPct > 0 ? 'up' : 'down' };
}
