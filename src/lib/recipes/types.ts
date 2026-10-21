/**
 * Recettes : types partagés (bibliothèque, filtres, menus, courses, base de données).
 * Une recette rédigée par une IA reste « Brouillon généré par IA » ou « À vérifier » tant qu'un humain
 * ne l'a pas réellement relue : aucun statut « Relu » ou « Validé » n'est attribué automatiquement.
 */
export const ALLERGENS = ['gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'] as const;
export type Allergen = (typeof ALLERGENS)[number];

export type Audience = 'pregnancy' | 'baby' | 'child' | 'family';
/** Étapes indicatives de la diversification (l'âge n'est pas le seul critère : texture, aliments introduits). */
export const STAGES = ['start', 'm6_8', 'm9_12', 'm12_18', 'm18_24', 'y2_3'] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_MONTHS: Record<Stage, [number, number]> = { start: [4, 6], m6_8: [6, 9], m9_12: [9, 12], m12_18: [12, 18], m18_24: [18, 24], y2_3: [24, 36] };
export const TEXTURES = ['smooth', 'mashed', 'ground', 'pieces', 'regular'] as const;
export type Texture = (typeof TEXTURES)[number];
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;
export type Meal = (typeof MEALS)[number];
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Unit = 'g' | 'ml' | 'u' | 'cs' | 'cc' | 'pincee';
export type Aisle = 'fruits_legumes' | 'cremerie' | 'frais' | 'boucherie' | 'poissonnerie' | 'epicerie' | 'boulangerie' | 'surgeles';

export const TAGS = [
  'quick', 'budget', 'vegetarian', 'nausea', 'fatigue', 'iron', 'calcium', 'protein', 'fiber', 'b9',
  'puree', 'compote', 'complete', 'finger', 'family', 'batch', 'freezer', 'lunchbox', 'vegetables', 'world', 'picky', 'make_ahead', 'classic',
] as const;
export type Tag = (typeof TAGS)[number];

export type RecipeStatus = 'ai_draft' | 'to_review' | 'reviewed' | 'validated' | 'retired';

export interface IngredientDef {
  name: string;
  /** Mot(s) cherché(s) dans les étapes (vérification « chaque ingrédient est utilisé »), sans accents. */
  stem: string;
  aisle: Aisle;
  allergens?: Allergen[];
  meat?: boolean;
  fish?: boolean;
  pork?: boolean;
  /** Couleur dominante (illustration générée). */
  color: string;
  /** Termes reconnus depuis le scanner ou « ce que j'ai » (sans accents). */
  terms?: string[];
  /** Grossesse : à éviter (raison) — jamais dans une recette de grossesse. */
  pregnancyAvoid?: string;
  /** Doit être cuit à cœur pendant la grossesse (viande, poisson, œuf). */
  mustCook?: boolean;
  /** Âge minimal en mois (ex. miel : 12 mois). */
  minMonths?: number;
  /** Risque d'étouffement avant 4 ans si la préparation n'est pas adaptée. */
  choking?: string;
  /** Ajout de sel ou de sucre (jamais avant 1 an dans les recettes bébé). */
  addedSaltSugar?: boolean;
}

export interface RecipeIngredient { key: string; qty: number | null; unit: Unit | null; note?: string; optional?: boolean }

export interface PhotoInfo {
  kind: 'generated' | 'licensed' | 'owned';
  source: string;
  author: string;
  license: string;
  url: string | null;
  rights: string;
  generated: boolean;
  alt: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  summary: string;
  audiences: Audience[];
  meals: Meal[];
  /** Bébé : étapes indicatives. */
  stages?: Stage[];
  /** Âge indicatif en mois (enfants) ; absent = adulte. */
  minMonths?: number;
  maxMonths?: number;
  textures: Texture[];
  servings: number;
  servingLabel?: string;
  prepMin: number;
  cookMin: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  allergens: Allergen[];
  tags: Tag[];
  adaptations: string[];
  storage: string;
  /** Congélation : possible ou non, durée, décongélation (texte rédigé). */
  freezing?: string;
  /** Précautions grossesse ou âge (étouffement, cuisson…). */
  precautions: string[];
  nutrition: string;
  budget: 1 | 2 | 3;
  seasons: Season[] | 'all';
  temperature: 'hot' | 'cold';
  /** Repas familial : adaptations pour un bébé ou un enfant. */
  familyAdaptations?: { baby?: string; child?: string };
  photo: PhotoInfo;
  sources: string[];
  verifiedOn: string;
  status: RecipeStatus;
  statusHistory: { status: RecipeStatus; by: string; on: string; note?: string }[];
  /** Recette personnelle (créée dans l'app). */
  personal?: boolean;
  /** Identifiant de la ligne en base (absent pour la copie embarquée). */
  dbId?: string;
}

export interface RecipeSource { id: string; title: string; publisher: string; url: string; consulted: string; date?: string }
