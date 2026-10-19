/** Construction d'une recette : valeurs communes (illustration générée, statut, date de vérification). */
import type { Allergen, PhotoInfo, Recipe, RecipeIngredient, Unit } from './types';

export const VERIFIED_ON = '2026-10-19';

/** Ingrédient : clé du dictionnaire, quantité, unité, précision facultative. */
export const i = (key: string, qty: number | null, unit: Unit | null, note?: string, optional?: boolean): RecipeIngredient =>
  ({ key, qty, unit, ...(note ? { note } : {}), ...(optional ? { optional } : {}) });

export function generatedPhoto(title: string): PhotoInfo {
  return {
    kind: 'generated',
    source: 'Toi & Moi',
    author: 'Illustration générée par programme pour l’application Toi & Moi',
    license: 'Création propre de l’application (aucune œuvre de tiers)',
    url: null,
    rights: 'Utilisation libre dans l’application, y compris commerciale',
    generated: true,
    alt: `Illustration générée de « ${title} » (ce n’est pas une photographie)`,
  };
}

type Input = Omit<Recipe, 'id' | 'photo' | 'verifiedOn' | 'status' | 'statusHistory' | 'allergens'> & { allergens: Allergen[] };

/**
 * Toutes les recettes de la bibliothèque sont rédigées par une IA (Claude) : statut « À vérifier » une fois
 * les contrôles automatiques passés. Elles ne sont présentées ni comme relues ni comme validées par un professionnel.
 */
export function R(r: Input): Recipe {
  return {
    ...r,
    id: `rcp-${r.slug}`,
    photo: generatedPhoto(r.title),
    verifiedOn: VERIFIED_ON,
    status: 'to_review',
    statusHistory: [
      { status: 'ai_draft', by: 'Rédaction par une IA (Claude, Anthropic)', on: VERIFIED_ON },
      { status: 'to_review', by: 'Contrôles automatiques de l’application', on: VERIFIED_ON, note: 'Quantités, ingrédients cités, allergènes, précautions et doublons vérifiés par programme ; relecture humaine à faire.' },
    ],
  };
}
