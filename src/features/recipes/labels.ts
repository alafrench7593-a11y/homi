/** Libellés des recettes (langue active). */
import { t as tr, type TKey } from '@/i18n';
import type { Allergen, Meal, RecipeStatus, Stage, Tag, Texture } from '@/lib/recipes/types';
import type { Audience } from '@/lib/recipes/engine';

export const mealLabel = (m: Meal) => tr(`rc.meal.${m}` as TKey);
export const tagLabel = (t: Tag) => tr(`rc.tag.${t}` as TKey);
export const allergenLabel = (a: Allergen) => tr(`rc.al.${a}` as TKey);
export const textureLabel = (t: Texture) => tr(`rc.tex.${t}` as TKey);
export const stageLabel = (s: Stage) => tr(`rc.stage.${s}` as TKey);
export const statusLabel = (s: RecipeStatus) => tr(`rc.status.${s}` as TKey);

/** Catégories proposées selon le profil (on ne montre jamais les purées à une femme enceinte, etc.). */
export const TAGS_FOR: Record<Audience, Tag[]> = {
  pregnancy: ['quick', 'budget', 'vegetarian', 'nausea', 'fatigue', 'iron', 'calcium', 'protein', 'fiber', 'b9'],
  baby: ['puree', 'compote', 'complete', 'finger', 'family', 'batch', 'freezer'],
  child: ['lunchbox', 'quick', 'budget', 'vegetables', 'family', 'vegetarian', 'world', 'make_ahead', 'picky'],
  family: ['quick', 'budget', 'vegetarian', 'vegetables', 'world', 'make_ahead', 'batch'],
  adult: ['quick', 'budget', 'vegetarian', 'vegetables', 'world', 'make_ahead', 'batch'],
};
export const MEALS_FOR: Record<Audience, Meal[]> = {
  pregnancy: ['breakfast', 'lunch', 'dinner', 'snack'], baby: ['breakfast', 'lunch', 'dinner', 'snack'], child: ['breakfast', 'lunch', 'dinner', 'snack'],
  family: ['breakfast', 'lunch', 'dinner', 'snack'], adult: ['breakfast', 'lunch', 'dinner', 'snack'],
};
export const budgetLabel = (b: 1 | 2 | 3) => '€'.repeat(b);
