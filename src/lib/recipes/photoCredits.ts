/**
 * Photographies générées par IA pour des recettes précises (métadonnées seulement : utilisables dans les scripts Node).
 * Les fichiers sont dans assets/recipes/ et reliés à l'interface par src/features/recipes/recipePhotos.ts.
 * Aucun texte dans les images. À la demande de l'éditrice, aucune mention n'est affichée sur l'image ;
 * la source et la licence restent indiquées sur la fiche recette.
 */
import type { PhotoInfo } from './types';

export const AI_PHOTOS: Record<string, PhotoInfo> = {
  'puree-carotte-pomme-de-terre': {
    kind: 'generated',
    source: 'ElevenLabs (modèle Seedream 5 Lite de ByteDance), généré le 20/10/2026 pour Au fil de nous',
    author: 'ElevenLabs (Seedream 5 Lite)',
    license: 'conditions d’utilisation d’ElevenLabs',
    url: null,
    rights: 'utilisation dans l’application',
    generated: true,
    alt: 'Purée carotte et pomme de terre : purée orange dans un petit pot crème, cuillère en métal, nappe en lin',
  },
};

/** Mêmes mentions en anglais (affichées quand l'application est en anglais). */
export const AI_PHOTOS_EN: Record<string, Pick<PhotoInfo, 'source' | 'author' | 'license' | 'rights' | 'alt'>> = {
  'puree-carotte-pomme-de-terre': {
    source: 'ElevenLabs (ByteDance’s Seedream 5 Lite model), generated on 20/10/2026 for Au fil de nous',
    author: 'ElevenLabs (Seedream 5 Lite)',
    license: 'ElevenLabs terms of use',
    rights: 'use within the app',
    alt: 'Carrot and potato purée: orange purée in a small cream-coloured pot, metal spoon, linen tablecloth',
  },
};
