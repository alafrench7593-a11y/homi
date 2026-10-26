/**
 * Saisies du cycle « en un geste » — logique pure.
 * - symptômes fréquents : classés d'après LES SAISIES de la personne (les plus récentes comptent davantage),
 *   jamais d'après une norme ; sans historique, l'ordre habituel de la liste ;
 * - prise du jour (pilule…) : série de jours consécutifs cochés, et bande des 7 derniers jours ;
 * - dernière valeur notée (température, glaire) pour pré-remplir la saisie suivante.
 */
import { addDays, daysBetween } from './dates';

export interface SymptomLike { logged_on: string; symptom_keys?: string[] | null; symptoms?: string[] | null }

/** Clés de symptômes d'une saisie (nouveau et ancien format). */
function keysOf(l: SymptomLike): string[] {
  return [...new Set([...(l.symptom_keys ?? []), ...(l.symptoms ?? [])])];
}

/**
 * Symptômes à proposer en premier : fréquence dans les saisies des 120 derniers jours, pondérée par la récence
 * (une saisie d'hier compte plus qu'une saisie d'il y a 3 mois). Complété par `options` dans leur ordre.
 */
export function frequentSymptoms(logs: SymptomLike[], options: readonly string[], today: string, n = 6): string[] {
  const score = new Map<string, number>();
  for (const l of logs) {
    const age = daysBetween(l.logged_on, today);
    if (age < 0 || age > 120) continue;
    const w = 1 / (1 + age / 30);
    for (const k of keysOf(l)) if (options.includes(k)) score.set(k, (score.get(k) ?? 0) + w);
  }
  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1] || options.indexOf(a[0]) - options.indexOf(b[0])).map(([k]) => k);
  const rest = options.filter((k) => !ranked.includes(k));
  return [...ranked, ...rest].slice(0, n);
}

/** Ajoute ou retire un symptôme de la liste du jour (sans doublon, ordre conservé). */
export function toggleKey(keys: readonly string[], key: string): string[] {
  return keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key];
}

/**
 * Série de jours consécutifs cochés, se terminant aujourd'hui (ou hier si aujourd'hui n'est pas encore coché :
 * la série n'est pas « cassée » tant que la journée n'est pas finie).
 */
export function dayStreak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  let d = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

/** Les 7 derniers jours (du plus ancien à aujourd'hui) et s'ils sont cochés. */
export function lastWeek(days: Iterable<string>, today: string): { date: string; done: boolean }[] {
  const set = new Set(days);
  return Array.from({ length: 7 }, (_, i) => { const date = addDays(today, i - 6); return { date, done: set.has(date) }; });
}

/** Dernière valeur non vide d'un champ, parmi des saisies datées (la plus récente). */
export function lastValue<T extends Record<string, unknown>, K extends keyof T>(rows: T[], field: K, dateField: keyof T): T[K] | null {
  const sorted = [...rows].filter((r) => r[field] != null && r[field] !== '').sort((a, b) => String(b[dateField]).localeCompare(String(a[dateField])));
  return sorted[0]?.[field] ?? null;
}
