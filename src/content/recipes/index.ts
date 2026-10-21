/**
 * Bibliothèque de recettes de l'application (données de départ ; la base Supabase en garde une copie modifiable par
 * l'administration). L'ancien catalogue a été supprimé définitivement (octobre 2026) ; seule la purée carotte et
 * pomme de terre, dont la photo a été fournie, est conservée.
 */
import { PHOTO_RECIPES } from './photo';
import { V2_RECIPES } from './v2';

export const ALL_RECIPES = [...PHOTO_RECIPES, ...V2_RECIPES];
export { V2_LOTS, V2_ORIGIN } from './v2';
