/** Articles de la bibliothèque → lignes de la table `articles` (démonstration et données SQL générées). */
import type { Article, Category, Journey } from '@/lib/types';
import { LIBRARY_ARTICLES, type LibArticle } from './library';
import { NEURO_ARTICLES, NEURO_UPDATED_ON, type NeuroArticle } from './neuro';

export const EXTRA_CATEGORIES: Omit<Category, 'id'>[] = [
  { slug: 'sexualite', label: 'Sexualité et couple', icon: 'heart', position: 10 },
  { slug: 'sommeil', label: 'Sommeil', icon: 'moon', position: 11 },
  { slug: 'neurodeveloppement', label: 'Neurodéveloppement', icon: 'compass', position: 12 },
];

/**
 * Articles « Neurodéveloppement » : accessibles à TOUS les parents (bébé, enfant, famille), sans bilan, diagnostic ni
 * profil « besoin particulier » requis. Étiquettes : « neuro » + le sujet (« neuro-adhd »…) pour le filtrage par besoin.
 */
export const NEURO_CATEGORY = 'neurodeveloppement';
export function neuroAsLibrary(a: NeuroArticle): LibArticle & { updated_on: string } {
  const { topic, ...rest } = a;
  return { ...rest, category: NEURO_CATEGORY as LibArticle['category'], journeys: ['newborn', 'child'], min_age_months: undefined, max_age_months: undefined,
    tags: [...new Set([...a.tags, 'neuro', `neuro-${topic}`])], updated_on: NEURO_UPDATED_ON };
}
export const NEURO_LIBRARY = NEURO_ARTICLES.map(neuroAsLibrary);
export const LIBRARY_UPDATED_ON = '2026-10-20';

/** « Sommeil des parents » : visible pour les parents d'un bébé, d'un enfant ou de la famille, repéré par une étiquette. */
export function journeysOf(a: LibArticle): Journey[] {
  const out = new Set<Journey>();
  if (a.category === (NEURO_CATEGORY as LibArticle['category'])) out.add('family');
  for (const j of a.journeys) {
    if (j === 'parents_sleep') { out.add('newborn'); out.add('child'); out.add('family'); } else out.add(j as Journey);
  }
  return [...out];
}

export function libraryArticleRow(a: LibArticle, categoryId: string | null): Article {
  return {
    id: `lib-${a.slug}`, slug: a.slug, category_id: categoryId, title: a.title, summary: a.summary, body_md: a.body_md, journeys: journeysOf(a),
    min_week: a.min_week ?? null, max_week: a.max_week ?? null, min_age_months: a.min_age_months ?? null, max_age_months: a.max_age_months ?? null,
    postpartum: a.category === 'post-partum', tags: [...a.tags, ...(a.journeys.includes('parents_sleep') ? ['sommeil-parents'] : [])],
    author_name: 'Rédaction assistée par une IA (Claude, Anthropic)', reviewer_name: null, reviewer_qualification: null,
    sources: a.sources.map((s) => ({ label: s.label, url: s.url, consulted_on: s.consulted_on, ...(s.published ? { published: s.published } : {}) })),
    validated_at: null, updated_on: (a as { updated_on?: string }).updated_on ?? LIBRARY_UPDATED_ON, status: 'published', is_premium: false, is_safety_critical: !!a.safety_critical, editorial_status: a.status,
  };
}

export function libraryArticleRows(categories: Pick<Category, 'id' | 'slug'>[]): Article[] {
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  return [...LIBRARY_ARTICLES, ...NEURO_LIBRARY].map((a) => libraryArticleRow(a, bySlug.get(a.category) ?? null));
}
