/**
 * Photos d'illustration embarquées des recettes de la bibliothèque (table générée par scripts/homi/recipe-photos.mjs ;
 * mentions dans src/lib/recipes/photoCredits.ts). Les recettes personnelles n'en ont jamais.
 */
import type { ImageSourcePropType } from 'react-native';
import { RECIPE_PHOTO_ASSETS } from '@/content/recipes/photos.generated';

/** Image principale (960 × 540) par identifiant de recette. */
export const RECIPE_PHOTO_FILES: Record<string, ImageSourcePropType> = Object.fromEntries(
  Object.entries(RECIPE_PHOTO_ASSETS).map(([slug, a]) => [slug, a.full]),
);

/** Fichier à afficher : la miniature (480 × 270) pour les petites vignettes, sinon l'image principale. */
export function recipePhotoSource(recipe: { slug: string; personal?: boolean }, height: number): ImageSourcePropType | null {
  const a = recipe.personal ? undefined : RECIPE_PHOTO_ASSETS[recipe.slug];
  if (!a) return null;
  return height <= 120 ? a.thumb : a.full;
}
