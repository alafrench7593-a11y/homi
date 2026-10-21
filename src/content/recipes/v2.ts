/**
 * Nouveau catalogue (octobre 2026) : recettes familiales classiques, rédigées par une IA (Claude, Anthropic) puis
 * vérifiées par programme (structure, dictionnaire, allergènes, âges, précautions grossesse et bébé, poissons à limiter,
 * congélation, doublons : scripts/check-recipes-v2.ts). Statut « À vérifier » : aucune n'est présentée comme relue
 * ou validée tant qu'une personne qualifiée ne l'a pas fait.
 */
import { checkDraft, type RecipeDraft } from '@/lib/recipes/draft';
import type { Recipe } from '@/lib/recipes/types';
import lot01 from './v2/lot-01-grossesse.json';
import lot02 from './v2/lot-02-debut-diversification.json';
import lot03 from './v2/lot-03-mouline-ecrase.json';
import lot04 from './v2/lot-04-morceaux-12-24-mois.json';
import lot05 from './v2/lot-05-2-6-ans.json';
import lot06 from './v2/lot-06-6-10-ans-famille.json';

export const V2_ORIGIN = { by: 'Rédaction par une IA (Claude, Anthropic)', on: '2026-10-21', status: 'to_review' as const, note: 'Nouveau catalogue de recettes familiales classiques ; contrôles automatiques réussis, relecture humaine à faire.' };

/** Lots du catalogue, dans l'ordre des groupes affichés. */
export const V2_LOTS: { id: string; label: string; items: Partial<RecipeDraft>[] }[] = [
  { id: 'lot-01', label: 'Grossesse', items: lot01 as Partial<RecipeDraft>[] },
  { id: 'lot-02', label: 'Début de diversification', items: lot02 as Partial<RecipeDraft>[] },
  { id: 'lot-03', label: 'Mouliné et écrasé', items: lot03 as Partial<RecipeDraft>[] },
  { id: 'lot-04', label: 'Petits morceaux, 12 à 24 mois', items: lot04 as Partial<RecipeDraft>[] },
  { id: 'lot-05', label: '2 à 6 ans', items: lot05 as Partial<RecipeDraft>[] },
  { id: 'lot-06', label: '6 à 10 ans et repas de famille', items: lot06 as Partial<RecipeDraft>[] },
];

/** Seules les recettes qui passent tous les contrôles entrent dans le catalogue. */
export const V2_RECIPES: Recipe[] = V2_LOTS.flatMap((l) => l.items.map((d) => checkDraft(d, V2_ORIGIN).recipe).filter((r): r is Recipe => !!r));
