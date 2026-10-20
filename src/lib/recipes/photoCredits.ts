/**
 * Photographies générées par IA pour des recettes précises (métadonnées seulement : utilisables dans les scripts Node).
 * Les fichiers sont dans assets/recipes/ et reliés à l'interface par src/features/recipes/recipePhotos.ts.
 * Aucun texte dans les images ; mention « image générée par IA » toujours affichée.
 */
import type { PhotoInfo } from './types';

export const AI_PHOTOS: Record<string, PhotoInfo> = {
  'puree-carotte-pomme-de-terre': {
    kind: 'generated',
    source: 'ElevenLabs (modèle Seedream 5 Lite de ByteDance), généré le 20/10/2026 pour Toi & Moi',
    author: 'Image générée par IA',
    license: 'Image générée par IA pour l’application ; conditions d’utilisation du service ElevenLabs',
    url: null,
    rights: 'Utilisation dans l’application ; ce n’est pas une photographie réelle',
    generated: true,
    alt: 'Image générée par IA de « Purée carotte et pomme de terre » (ce n’est pas une photographie) : purée orange dans un petit pot crème, cuillère en métal, nappe en lin',
  },
};
