/** Fichiers des photos générées par IA, par identifiant de recette (voir src/lib/recipes/photoCredits.ts). */
import type { ImageSourcePropType } from 'react-native';

export const RECIPE_PHOTO_FILES: Record<string, ImageSourcePropType> = {
  'puree-carotte-pomme-de-terre': require('../../../assets/recipes/puree-carotte-pomme-de-terre.webp'),
};
