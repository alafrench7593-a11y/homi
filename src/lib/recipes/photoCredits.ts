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
