/** Conversion recettes ⇄ lignes de base de données (mêmes champs côté Supabase et côté démonstration). */
import { generatedPhoto } from './build';
import { INGREDIENTS } from './ingredients';
import type { Allergen, Audience, Meal, PhotoInfo, Recipe, RecipeStatus, Season, Stage, Tag, Texture, Unit } from './types';

export interface RecipeRow {
  id: string; slug: string; title: string; summary: string; audiences: Audience[]; meals: Meal[]; stages: Stage[]; min_months: number | null; max_months: number | null;
  textures: Texture[]; servings: number; serving_label: string | null; prep_min: number; cook_min: number; allergens: Allergen[]; tags: Tag[]; adaptations: string[];
  storage: string; precautions: string[]; nutrition: string; budget: 1 | 2 | 3; seasons: Season[]; temperature: 'hot' | 'cold'; family_adaptations: Recipe['familyAdaptations'];
  verified_on: string | null; status: RecipeStatus; owner_id: string | null; household_id: string | null; created_at?: string; updated_at?: string;
}
export interface IngredientRow { recipe_id: string; position: number; ingredient_key: string; label: string; qty: number | null; unit: Unit | null; note: string | null; optional: boolean }
export interface StepRow { recipe_id: string; position: number; body: string }
export interface PhotoRow extends Omit<PhotoInfo, 'url'> { recipe_id: string; url: string | null; storage_path?: string | null }
export interface LinkRow { recipe_id: string; source_id: string }
export interface ReviewRow { id?: string; recipe_id: string; status: RecipeStatus; by_label: string; by_user?: string | null; note: string | null; created_at: string }

export function recipeToRows(r: Recipe, id: string, extra: Partial<RecipeRow> = {}) {
  const row: RecipeRow = {
    id, slug: r.slug, title: r.title, summary: r.summary, audiences: r.audiences as Audience[], meals: r.meals, stages: r.stages ?? [], min_months: r.minMonths ?? null, max_months: r.maxMonths ?? null,
    textures: r.textures, servings: r.servings, serving_label: r.servingLabel ?? null, prep_min: r.prepMin, cook_min: r.cookMin, allergens: r.allergens, tags: r.tags, adaptations: r.adaptations,
    storage: r.storage, precautions: r.precautions, nutrition: r.nutrition, budget: r.budget, seasons: r.seasons === 'all' ? [] : r.seasons, temperature: r.temperature,
    family_adaptations: r.familyAdaptations ?? {}, verified_on: r.verifiedOn || null, status: r.status, owner_id: null, household_id: null, ...extra,
  };
  return {
    recipe: row,
    ingredients: r.ingredients.map((x, n): IngredientRow => ({ recipe_id: id, position: n + 1, ingredient_key: x.key, label: INGREDIENTS[x.key]?.name ?? x.key, qty: x.qty, unit: x.unit, note: x.note ?? null, optional: !!x.optional })),
    steps: r.steps.map((s, n): StepRow => ({ recipe_id: id, position: n + 1, body: s })),
    photo: { recipe_id: id, ...r.photo } as PhotoRow,
    links: r.sources.map((s): LinkRow => ({ recipe_id: id, source_id: s })),
    reviews: r.statusHistory.map((h): ReviewRow => ({ recipe_id: id, status: h.status, by_label: h.by, note: h.note ?? null, created_at: h.on })),
  };
}

export function rowsToRecipes(rows: RecipeRow[], ing: IngredientRow[], steps: StepRow[], photos: PhotoRow[], links: LinkRow[], reviews: ReviewRow[] = []): Recipe[] {
  const by = <T extends { recipe_id: string }>(list: T[]) => { const m = new Map<string, T[]>(); for (const x of list) { const a = m.get(x.recipe_id) ?? []; a.push(x); m.set(x.recipe_id, a); } return m; };
  const I = by(ing); const S = by(steps); const P = by(photos); const L = by(links); const V = by(reviews);
  return rows.map((r) => ({
    id: `rcp-${r.slug}`, slug: r.slug, title: r.title, summary: r.summary, audiences: r.audiences, meals: r.meals, stages: r.stages?.length ? r.stages : undefined,
    minMonths: r.min_months ?? undefined, maxMonths: r.max_months ?? undefined, textures: r.textures, servings: r.servings, servingLabel: r.serving_label ?? undefined,
    prepMin: r.prep_min, cookMin: r.cook_min,
    ingredients: (I.get(r.id) ?? []).sort((a, b) => a.position - b.position).map((x) => ({ key: x.ingredient_key, qty: x.qty == null ? null : Number(x.qty), unit: x.unit, ...(x.note ? { note: x.note } : {}), ...(x.optional ? { optional: true } : {}) })),
    steps: (S.get(r.id) ?? []).sort((a, b) => a.position - b.position).map((x) => x.body),
    allergens: r.allergens, tags: r.tags, adaptations: r.adaptations, storage: r.storage, precautions: r.precautions, nutrition: r.nutrition, budget: r.budget,
    seasons: r.seasons?.length ? r.seasons : 'all', temperature: r.temperature, familyAdaptations: r.family_adaptations && Object.keys(r.family_adaptations).length ? r.family_adaptations : undefined,
    photo: (() => { const p = P.get(r.id)?.[0]; return p ? { kind: p.kind, source: p.source, author: p.author, license: p.license, url: p.url, rights: p.rights, generated: p.generated, alt: p.alt } : generatedPhoto(r.title); })(),
    sources: (L.get(r.id) ?? []).map((x) => x.source_id), verifiedOn: r.verified_on ?? '', status: r.status,
    statusHistory: (V.get(r.id) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((x) => ({ status: x.status, by: x.by_label, on: x.created_at.slice(0, 10), ...(x.note ? { note: x.note } : {}) })),
    personal: !!r.owner_id, dbId: r.id,
  }));
}
