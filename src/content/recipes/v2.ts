/**
 * Nouveau catalogue (octobre 2026) : recettes familiales classiques, rédigées par une IA (Claude, Anthropic) puis
 * vérifiées par programme (structure, dictionnaire, allergènes, âges, précautions grossesse et bébé, poissons à limiter,
 * congélation, doublons : scripts/check-recipes-v2.ts). Statut « À vérifier » : aucune n'est présentée comme relue
 * ou validée tant qu'une personne qualifiée ne l'a pas fait.
 */
import { localized } from '@/i18n/localized';
import { checkDraft, type RecipeDraft } from '@/lib/recipes/draft';
import type { Recipe } from '@/lib/recipes/types';
import lot01 from './v2/lot-01-grossesse.json';
import lot02 from './v2/lot-02-debut-diversification.json';
import lot03 from './v2/lot-03-mouline-ecrase.json';
import lot04 from './v2/lot-04-morceaux-12-24-mois.json';
import lot05 from './v2/lot-05-2-6-ans.json';
import lot06 from './v2/lot-06-6-10-ans-famille.json';
import lot07 from './v2/lot-07-grossesse-quotidien.json';

export const V2_ORIGIN = { by: 'Rédaction par une IA (Claude, Anthropic)', on: '2026-10-21', status: 'to_review' as const, note: 'Nouveau catalogue de recettes familiales classiques ; contrôles automatiques réussis, relecture humaine à faire.' };

/** Lots du catalogue, dans l'ordre des groupes affichés. */
const V2_LOTS_FR: { id: string; label: string; items: Partial<RecipeDraft>[] }[] = [
  { id: 'lot-01', label: 'Grossesse', items: lot01 as Partial<RecipeDraft>[] },
  { id: 'lot-02', label: 'Début de diversification', items: lot02 as Partial<RecipeDraft>[] },
  { id: 'lot-03', label: 'Mouliné et écrasé', items: lot03 as Partial<RecipeDraft>[] },
  { id: 'lot-04', label: 'Petits morceaux, 12 à 24 mois', items: lot04 as Partial<RecipeDraft>[] },
  { id: 'lot-05', label: '2 à 6 ans', items: lot05 as Partial<RecipeDraft>[] },
  { id: 'lot-06', label: '6 à 10 ans et repas de famille', items: lot06 as Partial<RecipeDraft>[] },
  { id: 'lot-07', label: 'Grossesse au quotidien (petits-déjeuners, collations, nausées, fatigue)', items: lot07 as Partial<RecipeDraft>[] },
];
const V2_LOTS_EN: { id: string; label: string; items: Partial<RecipeDraft>[] }[] = [
  { id: 'lot-01', label: 'Pregnancy', items: lot01 as Partial<RecipeDraft>[] },
  { id: 'lot-02', label: 'Starting solids', items: lot02 as Partial<RecipeDraft>[] },
  { id: 'lot-03', label: 'Puréed and mashed', items: lot03 as Partial<RecipeDraft>[] },
  { id: 'lot-04', label: 'Small pieces, 12 to 24 months', items: lot04 as Partial<RecipeDraft>[] },
  { id: 'lot-05', label: '2 to 6 years', items: lot05 as Partial<RecipeDraft>[] },
  { id: 'lot-06', label: '6 to 10 years and family meals', items: lot06 as Partial<RecipeDraft>[] },
  { id: 'lot-07', label: 'Everyday pregnancy (breakfasts, snacks, nausea, tiredness)', items: lot07 as Partial<RecipeDraft>[] },
];
export const V2_LOTS: { id: string; label: string; items: Partial<RecipeDraft>[] }[] = localized(V2_LOTS_FR, V2_LOTS_EN);

/** Seules les recettes qui passent tous les contrôles entrent dans le catalogue. */
export const V2_RECIPES: Recipe[] = V2_LOTS.flatMap((l) => l.items.map((d) => checkDraft(d, V2_ORIGIN).recipe).filter((r): r is Recipe => !!r));
