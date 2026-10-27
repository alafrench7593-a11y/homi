/** Guide complet : toutes les questions des futurs parents, des femmes enceintes et des parents d'enfants, classées par catégorie. */
import { GUIDE_BEBE } from './bebe';
import { GUIDE_CONCEPTION } from './conception';
import { GUIDE_ENFANT } from './enfant';
import { GUIDE_GROSSESSE } from './grossesse';

export const GUIDE_UPDATED_ON = '2026-10-27';
export const GUIDE_ARTICLES = [...GUIDE_CONCEPTION, ...GUIDE_GROSSESSE, ...GUIDE_BEBE, ...GUIDE_ENFANT].map((a) => ({ ...a, updated_on: GUIDE_UPDATED_ON }));
