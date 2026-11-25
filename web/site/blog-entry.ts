/** Blog public (build) : articles NON médicaux de la bibliothèque de l'app (décision de la propriétaire, 25/11/2026).
 * Les catégories santé attendent une relecture professionnelle ; rien de « safety_critical ». */
import { LIBRARY_ARTICLES } from '@/content/articles/library';
import { GUIDE_ARTICLES } from '@/content/articles/guide';

export const BLOG_CATEGORIES: Record<string, string> = {
  'droits-demarches': 'Droits et démarches', 'ecole-garde': 'Garde et école', 'materiel': 'Matériel',
  'vie-pratique': 'Vie pratique', 'activites-eveil': 'Activités et éveil', 'education': 'Éducation',
};
const m = new Map<string, unknown>();
for (const a of [...LIBRARY_ARTICLES, ...GUIDE_ARTICLES] as { slug: string; category: string; safety_critical?: boolean }[]) {
  if (a.category in BLOG_CATEGORIES && !a.safety_critical && /^[a-z0-9-]+$/.test(a.slug)) m.set(a.slug, a);
}
(globalThis as Record<string, unknown>).homiBlog = { categories: BLOG_CATEGORIES, articles: [...m.values()] };
