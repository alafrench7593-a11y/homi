/**
 * Bibliothèque rangée en 3 niveaux : thème (parcours : cycle, concevoir, enceinte, bébé, enfant) → catégorie →
 * sujet. Les sujets sont les mots-clés des articles (tags), regroupés sans tenir compte des majuscules ni des accents.
 */
export interface SubjectArticle { tags: string[] }

const key = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Sujets les plus fréquents d'une liste d'articles (au moins `min` articles chacun), du plus au moins fréquent. */
export function topSubjects(articles: SubjectArticle[], max = 14, min = 2): { label: string; key: string; count: number }[] {
  const m = new Map<string, { label: string; count: number }>();
  for (const a of articles) {
    const seen = new Set<string>();
    for (const t of a.tags ?? []) {
      const k = key(t);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      const e = m.get(k);
      if (e) e.count++;
      else m.set(k, { label: t.trim(), count: 1 });
    }
  }
  return [...m.entries()]
    .filter(([, v]) => v.count >= min)
    .sort((x, y) => y[1].count - x[1].count || x[1].label.localeCompare(y[1].label, 'fr'))
    .slice(0, max)
    .map(([k, v]) => ({ key: k, label: v.label.charAt(0).toUpperCase() + v.label.slice(1), count: v.count }));
}

export function hasSubject(a: SubjectArticle, subjectKey: string): boolean {
  return (a.tags ?? []).some((t) => key(t) === subjectKey);
}

/** Nombre total de sujets distincts (tags présents dans au moins `min` articles). */
export function countSubjects(articles: SubjectArticle[], min = 2): number {
  return topSubjects(articles, Number.MAX_SAFE_INTEGER, min).length;
}
