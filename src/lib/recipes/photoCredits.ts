/**
 * Photos d'illustration des recettes, générées par IA (métadonnées seulement : utilisables dans les scripts Node).
 * Les fichiers sont dans assets/recipes/ (et assets/recipes/thumb/), produits par scripts/homi/recipe-photos.mjs, et
 * reliés à l'interface par src/content/recipes/photos.generated.ts. Aucun texte dans les images ; la fiche recette
 * affiche la mention « Photo d'illustration », la source et la licence.
 * Une recette sans fichier garde l'illustration dessinée par programme (generatedPhoto) ; les recettes personnelles
 * n'en reçoivent jamais (leur identifiant n'est pas dans la liste).
 */
import type { PhotoInfo } from './types';
import { RECIPE_PHOTO_SLUGS } from './photoSlugs.generated';

const WITH_PHOTO = new Set(RECIPE_PHOTO_SLUGS);

/** Mentions communes des photos générées par IA avec ElevenLabs pour HOMI (novembre 2026). */
export const AI_ILLUSTRATION: Pick<PhotoInfo, 'source' | 'author' | 'license' | 'rights'> = {
  source: 'HOMI',
  author: 'Illustration générée par IA (ElevenLabs) pour HOMI',
  license: 'Image générée par IA pour l’application HOMI',
  rights: 'Utilisation dans l’application HOMI',
};
export const AI_ILLUSTRATION_EN: Pick<PhotoInfo, 'source' | 'author' | 'license' | 'rights'> = {
  source: 'HOMI',
  author: 'AI-generated illustration (ElevenLabs) for HOMI',
  license: 'AI-generated image for the HOMI app',
  rights: 'Use within the HOMI app',
};

/** Photo antérieure aux autres (octobre 2026), avec ses propres mentions. */
export const AI_PHOTOS: Record<string, PhotoInfo> = {
  'puree-carotte-pomme-de-terre': {
    kind: 'ai_illustration',
    source: 'ElevenLabs (modèle Seedream 5 Lite de ByteDance), généré le 20/10/2026 pour HOMI',
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
    source: 'ElevenLabs (ByteDance’s Seedream 5 Lite model), generated on 20/10/2026 for HOMI',
    author: 'ElevenLabs (Seedream 5 Lite)',
    license: 'ElevenLabs terms of use',
    rights: 'use within the app',
    alt: 'Carrot and potato purée: orange purée in a small cream-coloured pot, metal spoon, linen tablecloth',
  },
};

/** La recette de la bibliothèque `slug` a-t-elle une photo d'illustration embarquée ? */
export const hasRecipePhoto = (slug: string): boolean => WITH_PHOTO.has(slug);

/** Mentions de la photo d'illustration d'une recette de la bibliothèque (texte alternatif : son titre), ou null. */
export function aiPhoto(slug: string, title: string): PhotoInfo | null {
  if (!WITH_PHOTO.has(slug)) return null;
  return AI_PHOTOS[slug] ?? { kind: 'ai_illustration', ...AI_ILLUSTRATION, url: null, generated: true, alt: title };
}

/** Version anglaise des mentions (`title` : titre anglais). */
export function aiPhotoEn(slug: string, title: string): Pick<PhotoInfo, 'source' | 'author' | 'license' | 'rights' | 'alt'> {
  return AI_PHOTOS_EN[slug] ?? { ...AI_ILLUSTRATION_EN, alt: title };
}
