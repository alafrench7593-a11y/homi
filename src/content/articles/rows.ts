/** Articles de la bibliothèque → lignes de la table `articles` (démonstration et données SQL générées). */
import type { Article, Category, Journey } from '@/lib/types';
import { LIBRARY_ARTICLES, type LibArticle } from './library';
import { NEURO_ARTICLES, NEURO_UPDATED_ON, type NeuroArticle } from './neuro';
import { GUIDE_ARTICLES } from './guide';

export const EXTRA_CATEGORIES: Omit<Category, 'id'>[] = [
  { slug: 'sexualite', label: 'Sexualité et couple', icon: 'heart', position: 10 },
  { slug: 'sommeil', label: 'Sommeil', icon: 'moon', position: 11 },
  { slug: 'neurodeveloppement', label: 'Neurodéveloppement', icon: 'compass', position: 12 },
  // Guide complet (27/10/2026)
  { slug: 'fertilite', label: 'Fertilité et cycle', icon: 'sunrise', position: 20 },
  { slug: 'preparer-grossesse', label: 'Préparer sa grossesse', icon: 'clipboard', position: 21 },
  { slug: 'difficultes-conception', label: 'Difficultés à concevoir, PMA', icon: 'help-circle', position: 22 },
  { slug: 'suivi-grossesse', label: 'Suivi médical et examens', icon: 'calendar', position: 30 },
  { slug: 'alimentation-grossesse', label: 'Alimentation, alcool, tabac', icon: 'coffee', position: 31 },
  { slug: 'corps-grossesse', label: 'Corps et petits maux', icon: 'feather', position: 32 },
  { slug: 'sante-grossesse', label: 'Santé, maladies, médicaments', icon: 'shield', position: 33 },
  { slug: 'quotidien-grossesse', label: 'Travail, sport, voyages', icon: 'briefcase', position: 34 },
  { slug: 'droits-demarches', label: 'Droits, démarches et aides', icon: 'file-text', position: 35 },
  { slug: 'alimentation-bebe', label: 'Allaitement, biberon, diversification', icon: 'droplet', position: 40 },
  { slug: 'sante-bebe', label: 'Santé et petits soucis du bébé', icon: 'thermometer', position: 41 },
  { slug: 'developpement', label: 'Développement et éveil', icon: 'trending-up', position: 42 },
  { slug: 'securite', label: 'Sécurité et accidents', icon: 'shield', position: 43 },
  { slug: 'sante-enfant', label: 'Santé de l’enfant', icon: 'activity', position: 50 },
  { slug: 'education', label: 'Comportement et éducation', icon: 'smile', position: 51 },
  { slug: 'ecole-garde', label: 'Mode de garde et école', icon: 'book', position: 52 },
  { slug: 'maladies-chroniques', label: 'Maladies chroniques et handicap', icon: 'plus-square', position: 53 },
  { slug: 'activites-eveil', label: 'Activités, jeux et éveil', icon: 'sun', position: 60 },
  { slug: 'sport', label: 'Sport et activité physique', icon: 'activity', position: 61 },
  { slug: 'materiel', label: 'Bien choisir le matériel', icon: 'shopping-bag', position: 62 },
  { slug: 'vie-pratique', label: 'Vie pratique et organisation', icon: 'clipboard', position: 63 },
  { slug: 'premiers-secours', label: 'Premiers secours et bobos', icon: 'plus-circle', position: 64 },
  // Règles, cycle et santé intime (27/10/2026)
  { slug: 'regles', label: 'Règles : comprendre et soulager', icon: 'droplet', position: 70 },
  { slug: 'cycle-ages', label: 'Cycle, hormones et âges de la vie', icon: 'moon', position: 71 },
  { slug: 'sante-intime', label: 'Santé intime et gynécologique', icon: 'heart', position: 72 },
  { slug: 'contraception', label: 'Contraception et IVG', icon: 'shield', position: 73 },
];

/** Catégories rangées par parcours : la bibliothèque les présente comme un guide (toutes les questions d'un même moment de vie). */
export const CATEGORY_GROUPS: { journey: 'avoid' | 'ttc' | 'pregnant' | 'newborn' | 'child'; title: string; slugs: string[] }[] = [
  { journey: 'avoid', title: 'Mon cycle et ma santé', slugs: ['regles', 'cycle-ages', 'sante-intime', 'contraception', 'cycle', 'sexualite', 'sante-mentale'] },
  { journey: 'ttc', title: 'Je veux concevoir', slugs: ['fertilite', 'preparer-grossesse', 'difficultes-conception', 'cycle', 'sexualite'] },
  { journey: 'pregnant', title: 'Je suis enceinte', slugs: ['suivi-grossesse', 'alimentation-grossesse', 'corps-grossesse', 'sante-grossesse', 'sport', 'quotidien-grossesse', 'grossesse', 'sante-mentale', 'sexualite', 'accouchement', 'materiel', 'vie-pratique', 'droits-demarches'] },
  { journey: 'newborn', title: 'Mon bébé (0 à 2 ans)', slugs: ['alimentation-bebe', 'sommeil', 'bebe', 'sante-bebe', 'premiers-secours', 'developpement', 'activites-eveil', 'neurodeveloppement', 'maladies-chroniques', 'securite', 'materiel', 'post-partum', 'reeducation', 'sport', 'alimentation', 'vie-pratique', 'droits-demarches'] },
  { journey: 'child', title: 'Mon enfant (2 à 10 ans)', slugs: ['sante-enfant', 'premiers-secours', 'neurodeveloppement', 'maladies-chroniques', 'alimentation', 'activites-eveil', 'sport', 'enfant', 'education', 'sommeil', 'ecole-garde', 'securite', 'materiel', 'vie-pratique'] },
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

export function libraryArticleRow(a: LibArticle & { updated_on?: string }, categoryId: string | null): Article {
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
  return [...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES].map((a) => libraryArticleRow(a, bySlug.get(a.category) ?? null));
}
