/**
 * Sources consultées pour les repères de sécurité et d'équilibre des recettes (date de consultation indiquée).
 * Les recettes elles-mêmes sont des rédactions originales de l'application, pas des copies de ces sites.
 */
import { getLocale } from '@/i18n';
import type { RecipeSource } from './types';

const C = '2026-10-19';
export const RECIPE_SOURCES: Record<string, RecipeSource> = {
  santefr_listeria: { id: 'santefr_listeria', title: 'Listériose pendant la grossesse, quels aliments éviter ?', publisher: 'Santé.fr (ministère de la Santé)', publisherEn: 'Santé.fr (French Ministry of Health)', url: 'https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter', consulted: C, date: '2025-04-25' },
  santefr_toxo: { id: 'santefr_toxo', title: 'La toxoplasmose enceinte, comment l’éviter ?', publisher: 'Santé.fr (ministère de la Santé)', publisherEn: 'Santé.fr (French Ministry of Health)', url: 'https://www.sante.fr/la-toxoplasmose-enceinte-comment-leviter', consulted: C, date: '2025-02-13' },
  santefr_limiter: { id: 'santefr_limiter', title: 'Manger mieux pendant la grossesse : les aliments à limiter ou éviter', publisher: 'Santé.fr, d’après Santé publique France (Manger Bouger)', publisherEn: 'Santé.fr, based on Santé publique France (Manger Bouger)', url: 'https://www.sante.fr/node/800433', consulted: C, date: '2023-07-05' },
  santefr_equilibre: { id: 'santefr_equilibre', title: 'Enceinte, une alimentation saine et équilibrée durant la grossesse', publisher: 'Santé.fr (contenu mpedia)', publisherEn: 'Santé.fr (mpedia content)', url: 'https://www.sante.fr/node/1068438', consulted: C, date: '2025-08-28' },
  spf_diversification: { id: 'spf_diversification', title: 'Pas à pas, votre enfant mange comme un grand', publisher: 'Santé publique France (Manger Bouger)', url: 'https://www.mangerbouger.fr/content/show/1500/file/Brochure-SPF-Mangerbougerfr.pdf', consulted: C },
  anses_miel: { id: 'anses_miel', title: 'Pas de miel pour les enfants de moins d’un an', publisher: 'ANSES', url: 'https://www.anses.fr/fr/content/pas-de-miel-les-enfants-de-moins-dun-an', consulted: C, date: '2023-10-31' },
  lait_cru: { id: 'lait_cru', title: 'Pas de fromages au lait cru avant 5 ans (rappel des autorités sanitaires, ministère de l’Agriculture)', publisher: 'La Revue du Praticien', url: 'https://www.larevuedupraticien.fr/article/pas-de-fromages-au-lait-cru-avant-5-ans', consulted: C, date: '2023-07-31' },
  santefr_3_6: { id: 'santefr_3_6', title: 'Enfant entre 3 et 6 ans, quels sont ses besoins nutritionnels ?', publisher: 'Santé.fr (contenu mpedia)', publisherEn: 'Santé.fr (mpedia content)', url: 'https://www.sante.fr/node/1247621', consulted: C, date: '2023-07-27' },
  anses_poisson: { id: 'anses_poisson', title: 'Manger du poisson : pourquoi ? comment ?', publisher: 'ANSES', url: 'https://www.anses.fr/fr/content/manger-du-poisson-pourquoi-comment', consulted: '2026-10-20', date: '2022-06-30' },
  santefr_mercure: { id: 'santefr_mercure', title: 'Consommation de poissons et exposition au méthylmercure', publisher: 'Santé.fr', url: 'https://www.sante.fr/node/1240227', consulted: '2026-10-20', date: '2024-10-24' },
  inspq_etouffement: { id: 'inspq_etouffement', title: 'Risques d’étouffement – à surveiller jusqu’à 4 ans', publisher: 'Institut national de santé publique du Québec (repère complémentaire, hors France)', publisherEn: 'Institut national de santé publique du Québec (complementary reference, outside France)', url: 'https://www.inspq.qc.ca/mieux-vivre/enfant/alimentation/aliments/risques-etouffement', consulted: C, date: '2026-02-17' },
};

// Éditeur affiché en anglais quand l'application est en anglais (le titre d'une source française reste en français).
for (const x of Object.values(RECIPE_SOURCES)) {
  const fr = x.publisher;
  const en = x.publisherEn;
  if (en) Object.defineProperty(x, 'publisher', { get: () => (getLocale() === 'en' ? en : fr), enumerable: true, configurable: true });
}

/** Sources attendues selon le public (vérification automatique). */
export const PREGNANCY_SOURCES = ['santefr_listeria', 'santefr_toxo', 'santefr_limiter', 'santefr_equilibre'];
export const BABY_SOURCES = ['spf_diversification', 'anses_miel', 'inspq_etouffement'];
export const CHILD_SOURCES = ['santefr_3_6', 'lait_cru', 'inspq_etouffement'];
