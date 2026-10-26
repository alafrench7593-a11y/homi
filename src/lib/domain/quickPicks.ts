/**
 * Raccourcis personnels (logique pure) : ce que LA PERSONNE note le plus souvent, d'après SES propres saisies,
 * pour le proposer en tête et en un geste. Aucune recommandation : uniquement un classement de ses habitudes.
 */

/** Les `n` valeurs les plus fréquentes (à égalité : la plus récente d'abord). `items` triés du plus récent au plus ancien. */
export function frequentValues<T extends string>(items: { value: T; at: string }[], n = 4, sinceDays = 60, now: Date = new Date()): T[] {
  const since = now.getTime() - sinceDays * 86_400_000;
  const stats = new Map<T, { count: number; last: number }>();
  for (const it of items) {
    const at = Date.parse(it.at);
    if (!Number.isFinite(at) || at < since) continue;
    const s = stats.get(it.value) ?? { count: 0, last: 0 };
    s.count += 1;
    s.last = Math.max(s.last, at);
    stats.set(it.value, s);
  }
  return [...stats.entries()].sort((a, b) => b[1].count - a[1].count || b[1].last - a[1].last).slice(0, n).map(([v]) => v);
}

/** Met les valeurs fréquentes en tête d'une liste d'options, sans en retirer ni en ajouter. */
export function withFrequentFirst<T>(options: T[], frequent: T[]): T[] {
  const head = frequent.filter((f) => options.includes(f));
  return [...head, ...options.filter((o) => !head.includes(o))];
}

/** Avancement d'une liste (cases cochées). */
export function progressOf(items: { done: boolean }[]): { done: number; total: number; pct: number } {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/**
 * Pile de cartes « j'aime / j'aime pas » : les éléments pas encore votés, dans l'ordre donné,
 * en écartant ceux déjà vus pendant la session.
 */
export function deck<T>(items: T[], key: (x: T) => string, voted: Set<string>, seen: Set<string>): T[] {
  return items.filter((x) => !voted.has(key(x)) && !seen.has(key(x)));
}
