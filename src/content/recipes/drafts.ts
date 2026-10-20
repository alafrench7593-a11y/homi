/**
 * Brouillons de recettes enfants (0 à 10 ans) rédigés par une IA et importés par le même circuit que tout import :
 * contrôle de structure, contrôles de qualité (validate.ts), statut « Brouillon généré par IA ».
 * Ils sont INVISIBLES des parents tant qu'une personne de l'équipe éditoriale ne les a pas relus (administration).
 */
import { checkDraft, type RecipeDraft } from '@/lib/recipes/draft';
import type { Recipe } from '@/lib/recipes/types';
import lot01 from './drafts/lot-01-bebe.json';
import lot02 from './drafts/lot-02-petit-dejeuner.json';
import lot03 from './drafts/lot-03-viandes.json';
import lot04 from './drafts/lot-04-poissons.json';
import lot05 from './drafts/lot-05-vegetarien.json';
import lot06 from './drafts/lot-06-legumes.json';
import lot07 from './drafts/lot-07-gouters-desserts.json';
import lot08 from './drafts/lot-08-ecole-monde.json';

export const DRAFT_ORIGIN = { by: 'Rédaction par une IA (Claude, Anthropic)', on: '2026-10-20', note: 'Import du lot de brouillons ; contrôles automatiques réussis, relecture humaine à faire.' };
export const DRAFT_LOTS: { id: string; label: string; items: Partial<RecipeDraft>[] }[] = [
  { id: 'lot-01', label: 'Bébés (6 à 36 mois)', items: lot01 as Partial<RecipeDraft>[] },
  { id: 'lot-02', label: 'Petits-déjeuners', items: lot02 as Partial<RecipeDraft>[] },
  { id: 'lot-03', label: 'Viandes et volailles', items: lot03 as Partial<RecipeDraft>[] },
  { id: 'lot-04', label: 'Poissons', items: lot04 as Partial<RecipeDraft>[] },
  { id: 'lot-05', label: 'Végétarien', items: lot05 as Partial<RecipeDraft>[] },
  { id: 'lot-06', label: 'Légumes et soupes', items: lot06 as Partial<RecipeDraft>[] },
  { id: 'lot-07', label: 'Goûters et desserts', items: lot07 as Partial<RecipeDraft>[] },
  { id: 'lot-08', label: 'École, rapide, petit budget, cuisine du monde', items: lot08 as Partial<RecipeDraft>[] },
];

/** Seules les recettes qui passent tous les contrôles sont importées (les autres sont signalées dans l'administration). */
export const DRAFT_RECIPES: Recipe[] = DRAFT_LOTS.flatMap((l) => l.items.map((d) => checkDraft(d, DRAFT_ORIGIN).recipe).filter((r): r is Recipe => !!r));
