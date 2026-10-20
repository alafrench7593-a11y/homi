/** Bibliothèque de recettes de l'application (données de départ ; la base Supabase en garde une copie modifiable par l'administration). */
import { BABY_RECIPES } from './baby';
import { CHILD_RECIPES } from './child';
import { PREGNANCY_RECIPES } from './pregnancy';

export const ALL_RECIPES = [...PREGNANCY_RECIPES, ...BABY_RECIPES, ...CHILD_RECIPES];
/** Bibliothèque complète : recettes « À vérifier » + brouillons IA en attente de relecture. */
export { DRAFT_RECIPES } from './drafts';
export { PREGNANCY_RECIPES, BABY_RECIPES, CHILD_RECIPES };
