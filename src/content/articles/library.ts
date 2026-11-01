/**
 * Bibliothèque d'articles par parcours : brouillons rédigés par une IA à partir de sources consultées, statut « À vérifier ».
 * Point d'entrée unique (noms et ordre inchangés) ; le contenu est rangé par thème dans ./library/.
 */
export type { ArticleJourney, ArticleSource, LibArticle } from './library/types';
import type { ArticleSource, LibArticle } from './library/types';
import { S } from './library/sources';
import { projetBebe } from './library/projet-bebe';
import { eviterGrossesse } from './library/eviter-grossesse';
import { grossesse } from './library/grossesse';
import { sexualiteGrossesse } from './library/sexualite-grossesse';
import { bebe } from './library/bebe';
import { enfant } from './library/enfant';
import { sommeilParents } from './library/sommeil-parents';
import { ajouts20261023 } from './library/ajouts-2026-10-23';

export const LIBRARY_SOURCES: Record<keyof typeof S, ArticleSource> = S;

export const LIBRARY_ARTICLES: LibArticle[] = [
  ...projetBebe,
  ...eviterGrossesse,
  ...grossesse,
  ...sexualiteGrossesse,
  ...bebe,
  ...enfant,
  ...sommeilParents,
  ...ajouts20261023,
];
