/**
 * Recettes : lecture de la bibliothèque (base de données, avec la copie embarquée en secours), profil alimentaire
 * du profil affiché, favoris, menus et listes de courses du foyer (partagés avec le coparent), réglages de l'enfant.
 */
import { useEffect, useMemo, useState } from 'react';
import { getLocale, t as tr } from '@/i18n';
import { useMutation } from '@tanstack/react-query';
import { backend, BackendError, eq } from '../backend';
import { updateIfVersion } from '../offlineConflicts';
import type { StockCategory, StockUnit } from '../domain/stocks';
import { useUserId } from '../auth';
import { insertOrQueue } from '../offline';
import { ensureHousehold, useActivePregnancy, useHouseholdId, useInvalidate, useRows, useTrackedChildren, useJourneyState } from './hooks';
import { useScope } from './hooks-scope';
import { localizeRecipes } from '../recipes/english';
import { recipeToRows, rowsToRecipes, type IngredientRow, type LinkRow, type PhotoRow, type RecipeRow, type ReviewRow, type StepRow } from '../recipes/db';
import { ingredientsInText, stageFor, type FoodProfile, type MenuSlot, type ShoppingLine } from '../recipes/engine';
import type { Allergen, Recipe, Texture } from '../recipes/types';
import { bandFor, defaultBand, scoreRecipe, type AgeBand, type IngredientPrice, type RecipeScore } from '../recipes/score';
import { pregnancyProgress } from '../domain/pregnancy';
import { childAge } from '../domain/child';
import { uuid } from '../uuid';
import type { Child } from '../types';
import { toISODate } from '../domain/dates';
import { loadEmbeddedRecipesModule, type EmbeddedRecipesModule } from '../lazyContent';

/** Recettes visibles : une recette retirée n'est plus proposée ; un brouillon IA de la bibliothèque reste invisible des parents. */
export function visibleRecipes<R extends Pick<Recipe, 'status'> & { personal?: boolean }>(list: R[], opts: { includeRetired?: boolean; includeDrafts?: boolean } = {}): R[] {
  return list.filter((r) => (opts.includeRetired || r.status !== 'retired') && (opts.includeDrafts || r.personal || r.status !== 'ai_draft'));
}

/**
 * Copie embarquée de la bibliothèque (secours tant que la base n'a pas les recettes) : chargée à la première utilisation
 * seulement (QA E-06). Sur le web, elle n'est plus dans le fichier de démarrage ; sur iOS et Android, elle reste dans
 * l'application (disponible hors ligne), le chargement est immédiat.
 */
type EmbeddedRecipes = EmbeddedRecipesModule['ALL_RECIPES'];
let embeddedRecipes: EmbeddedRecipes | null = null;
let embeddedLoad: Promise<EmbeddedRecipes> | null = null;
export function loadEmbeddedRecipes(): Promise<EmbeddedRecipes> {
  embeddedLoad ??= loadEmbeddedRecipesModule().then((m) => (embeddedRecipes = m.ALL_RECIPES), (err: unknown) => { embeddedLoad = null; throw err; });
  return embeddedLoad;
}
function useEmbeddedRecipes(needed: boolean): EmbeddedRecipes | null {
  const [list, setList] = useState<EmbeddedRecipes | null>(embeddedRecipes);
  useEffect(() => {
    if (!needed || list) return;
    let alive = true;
    loadEmbeddedRecipes().then((l) => { if (alive) setList(l); }, () => undefined);
    return () => { alive = false; };
  }, [needed, list]);
  return list;
}

/** `original` : textes de la base tels quels (administration : on corrige le français, jamais la traduction affichée). */
export function useRecipes(opts: { includeRetired?: boolean; includeDrafts?: boolean; original?: boolean } = {}) {
  const recipes = useRows<RecipeRow>(['recipes'], { table: 'recipes', order: [{ col: 'title' }] }, { staleTime: 600_000 });
  const ing = useRows<IngredientRow>(['recipe_ingredients'], { table: 'recipe_ingredients' }, { staleTime: 600_000 });
  const steps = useRows<StepRow>(['recipe_steps'], { table: 'recipe_steps' }, { staleTime: 600_000 });
  const photos = useRows<PhotoRow>(['recipe_photos'], { table: 'recipe_photos' }, { staleTime: 600_000 });
  const links = useRows<LinkRow>(['recipe_source_links'], { table: 'recipe_source_links' }, { staleTime: 600_000 });
  const reviews = useRows<ReviewRow>(['recipe_reviews'], { table: 'recipe_reviews' }, { staleTime: 600_000 });
  const list = useMemo(() => (recipes.data ? rowsToRecipes(recipes.data, ing.data ?? [], steps.data ?? [], photos.data ?? [], links.data ?? [], reviews.data ?? []) : null),
    [recipes.data, ing.data, steps.data, photos.data, links.data, reviews.data]);
  // Base pas encore installée (migration non appliquée) : bibliothèque embarquée, mêmes recettes et mêmes statuts
  const needEmbedded = !!list && !list.some((r) => !r.personal);
  // Anglais (QA D-10) : les textes anglais sont rangés dans la bibliothèque embarquée (champ `en`) ; même chargement
  // L'arbre est remonté à chaque changement de langue : getLocale() suffit ici
  const lang = getLocale();
  const needEnglish = lang === 'en' && !opts.original && !!list;
  const embedded = useEmbeddedRecipes(needEmbedded || needEnglish);
  const waitingEmbedded = (needEmbedded || needEnglish) && !embedded;
  const loading = [recipes, ing, steps, photos, links].some((q) => q.isLoading) || waitingEmbedded;
  const data = useMemo(() => {
    if (!list || waitingEmbedded) return null;
    const full = needEmbedded ? [...embedded!, ...list] : list;
    // Recette retirée : plus jamais proposée (seule l'administration la voit encore)
    // Brouillon généré par IA (bibliothèque) : invisible des parents tant qu'une personne de l'équipe ne l'a pas relu
    // Anglais : seulement là où le français de la base est resté celui de la bibliothèque (voir recipes/english.ts)
    return opts.original ? visibleRecipes(full, opts) : localizeRecipes(visibleRecipes(full, opts), embedded ?? [], lang);
  }, [list, needEmbedded, waitingEmbedded, embedded, opts.includeRetired, opts.includeDrafts, opts.original, lang]);
  return { data, loading, error: recipes.error, rows: recipes.data ?? [], refetch: () => { void recipes.refetch(); void ing.refetch(); void steps.refetch(); } };
}

/** Allergies saisies en texte libre sur la fiche de l'enfant → codes d'allergènes réglementaires. */
const ALLERGY_WORDS: [RegExp, Allergen][] = [
  [/lait|lactose|laitier|plv/, 'milk'], [/oeuf|œuf/, 'eggs'], [/arachide|cacahu/, 'peanuts'], [/gluten|ble|blé|seigle|orge|avoine/, 'gluten'],
  [/poisson/, 'fish'], [/crustac|crevette|crabe|homard/, 'crustaceans'], [/noix|amande|noisette|pistache|cajou|coque|pecan/, 'nuts'],
  [/sesame|sésame/, 'sesame'], [/soja/, 'soy'], [/moutarde/, 'mustard'], [/celeri|céleri/, 'celery'], [/sulfite/, 'sulphites'], [/lupin/, 'lupin'], [/mollusque|moule|huitre|huître|calamar/, 'molluscs'],
];
export function allergensFromText(list: string[]): Allergen[] {
  const out = new Set<Allergen>();
  for (const a of list) for (const [re, code] of ALLERGY_WORDS) if (re.test(a.toLowerCase())) out.add(code);
  return [...out];
}

export interface ChildFoodSettings { child_id: string; household_id: string; texture: Texture | null; vegetarian: boolean; no_pork: boolean; refused: string[]; pro_advice: string | null; allergen_advice_needed: boolean }
export function useChildFoodSettings(childId: string | null | undefined) {
  const q = useRows<ChildFoodSettings>(['child_food_settings', childId ?? ''], childId ? { table: 'child_food_settings', filters: [eq('child_id', childId)], limit: 1 } : null);
  return { ...q, data: q.data?.[0] ?? null };
}
export function useIntroducedFoods(childId: string | null | undefined) {
  return useRows<{ id: string; food_name: string; first_tried_on: string }>(['food_introductions', childId ?? ''], childId ? { table: 'food_introductions', filters: [eq('child_id', childId)] } : null);
}
export function useSaveChildFoodSettings() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: Omit<ChildFoodSettings, 'household_id'> & { household_id?: string; exists: boolean }) => {
      const { exists, ...row } = v;
      if (exists) await backend.update('child_food_settings', { texture: row.texture, vegetarian: row.vegetarian, no_pork: row.no_pork, refused: row.refused, pro_advice: row.pro_advice, allergen_advice_needed: row.allergen_advice_needed, updated_at: new Date().toISOString() }, [eq('child_id', row.child_id)]);
      else await backend.insert('child_food_settings', row);
    },
    onSuccess: () => inv('child_food_settings'),
  });
}

/** Profil alimentaire d'un enfant (âge, texture, allergies déclarées, aliments introduits, réglages). */
export function childFoodProfile(c: Child, kind: 'baby' | 'child', s: ChildFoodSettings | null, introduced: string[] | null): FoodProfile {
  const months = childAge(c.birth_date).months;
  return {
    audience: kind, name: c.first_name, ageMonths: months, texture: kind === 'baby' ? s?.texture ?? null : null,
    allergies: allergensFromText(c.allergies_declared ?? []), vegetarian: !!s?.vegetarian, noPork: !!s?.no_pork, refused: s?.refused ?? [],
    introduced, allergenAdviceNeeded: !!s?.allergen_advice_needed || (c.allergies_declared ?? []).length > 0,
  };
}

/** Profil alimentaire du profil affiché (grossesse, bébé, enfant, famille, adulte) et membres de la famille. */
export function useFoodProfile() {
  const scope = useScope();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const js = useJourneyState();
  const settings = useChildFoodSettings(scope.childId);
  const intro = useIntroducedFoods(scope.scope === 'baby' ? scope.childId : null);
  return useMemo(() => {
    const members: FoodProfile[] = (children ?? []).map((c) => childFoodProfile(c, js.childType(c.id) === 'baby' ? 'baby' : 'child', null, null));
    let profile: FoodProfile;
    if (scope.scope === 'pregnancy' && pregnancy) {
      const w = pregnancyProgress(pregnancy.due_date).weeksSA;
      profile = { audience: 'pregnancy', trimester: w < 15 ? 1 : w < 29 ? 2 : 3, name: undefined };
    } else if ((scope.scope === 'baby' || scope.scope === 'child') && scope.child) {
      const introduced = scope.scope === 'baby' && intro.data ? [...new Set(intro.data.flatMap((f) => ingredientsInText(f.food_name)))] : null;
      profile = childFoodProfile(scope.child, scope.scope, settings.data, introduced);
    } else if (scope.scope === 'family') profile = { audience: 'family' };
    else profile = { audience: 'adult' };
    return { profile, members: scope.scope === 'family' || scope.scope === 'pregnancy' || scope.scope === 'postpartum' || scope.scope === 'none' ? members : [], scope, settings: settings.data };
  }, [scope, pregnancy, children, js, settings.data, intro.data]);
}

export const stageOf = (p: FoodProfile) => (p.ageMonths != null ? stageFor(p.ageMonths) : null);

// ---------------------------------------------------------------- favoris
export function useRecipeFavorites() {
  const userId = useUserId();
  const inv = useInvalidate();
  const q = useRows<{ recipe_slug: string }>(['recipe_favorites'], userId ? { table: 'recipe_favorites', filters: [eq('user_id', userId)] } : null);
  const slugs = useMemo(() => (q.data ?? []).map((f) => f.recipe_slug), [q.data]);
  const toggle = useMutation({
    mutationFn: async (slug: string) => {
      if (slugs.includes(slug)) await backend.remove('recipe_favorites', [eq('user_id', userId), eq('recipe_slug', slug)]);
      else await backend.insert('recipe_favorites', { user_id: userId, recipe_slug: slug });
    },
    onSuccess: () => inv('recipe_favorites'),
  });
  return { slugs, ids: slugs.map((s) => `rcp-${s}`), toggle };
}

/**
 * « Je n'aime pas cette idée » : idée masquée pour cette personne (suggestions, menus, liste), jamais supprimée.
 * On peut la réafficher à tout moment.
 */
export function useRecipeDislikes() {
  const userId = useUserId();
  const inv = useInvalidate();
  const q = useRows<{ recipe_slug: string }>(['recipe_dislikes'], userId ? { table: 'recipe_dislikes', filters: [eq('user_id', userId)] } : null);
  const slugs = useMemo(() => (q.data ?? []).map((f) => f.recipe_slug), [q.data]);
  const toggle = useMutation({
    mutationFn: async (slug: string) => {
      if (slugs.includes(slug)) await backend.remove('recipe_dislikes', [eq('user_id', userId), eq('recipe_slug', slug)]);
      else await backend.insert('recipe_dislikes', { user_id: userId, recipe_slug: slug });
    },
    onSuccess: () => inv('recipe_dislikes'),
  });
  return { slugs, ids: slugs.map((s) => `rcp-${s}`), toggle };
}

// ---------------------------------------------------------------- menus
export interface MealPlan { id: string; household_id: string; title: string; profile: Record<string, unknown>; start_date: string; days: number; servings: number; created_at: string }
export interface MealPlanItem { id: string; plan_id: string; day: number; meal: MenuSlot['meal']; recipe_slug: string; servings: number; note: string | null }

export function useLatestMealPlan() {
  const hid = useHouseholdId();
  const plans = useRows<MealPlan>(['meal_plans', hid ?? ''], hid ? { table: 'meal_plans', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }], limit: 1 } : null);
  const plan = plans.data?.[0] ?? null;
  const items = useRows<MealPlanItem>(['meal_plan_items', plan?.id ?? ''], plan ? { table: 'meal_plan_items', filters: [eq('plan_id', plan.id)] } : null);
  return { plan, items: items.data ?? [], loading: plans.isLoading || items.isLoading };
}
export const slugOf = (recipeId: string) => recipeId.replace(/^rcp-/, '');

export function useSaveMealPlan() {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { title: string; days: number; servings: number; profile: Record<string, unknown>; slots: MenuSlot[]; replaceId?: string | null }) => {
      const h = hid ?? (await ensureHousehold());
      if (v.replaceId) await backend.remove('meal_plans', [eq('id', v.replaceId)]);
      const id = uuid();
      await backend.insert('meal_plans', { id, household_id: h, title: v.title, days: v.days, servings: v.servings, profile: v.profile, start_date: toISODate(new Date()) });
      if (v.slots.length) await backend.insert('meal_plan_items', v.slots.map((s) => ({ plan_id: id, household_id: h, day: s.day, meal: s.meal, recipe_slug: slugOf(s.recipeId), servings: s.servings, note: s.note ?? null })));
      return id;
    },
    onSuccess: () => inv('meal_plans', 'meal_plan_items'),
  });
}

// ---------------------------------------------------------------- liste de courses
export interface ShoppingList { id: string; household_id: string; plan_id: string | null; title: string; created_at: string }
export interface ShoppingItem {
  id: string; list_id: string; household_id?: string; ingredient_key: string | null; label: string; qty: number | null; unit: ShoppingLine['unit'] | StockUnit | null; aisle: string; at_home: boolean;
  checked: boolean; checked_by: string | null; checked_at?: string | null; position: number; version?: number;
  // Courses et stocks (15/11/2026)
  brand?: string | null; size?: string | null; category?: StockCategory | null; assignee_id?: string | null; stock_id?: string | null;
  document_id?: string | null; created_by?: string | null; created_at?: string;
}
export interface ShoppingItemInput {
  listId: string; householdId: string; label: string; position: number; qty?: number | null; unit?: StockUnit | null; brand?: string | null; size?: string | null;
  category?: StockCategory | null; assignee_id?: string | null; stock_id?: string | null;
}

export function useLatestShoppingList() {
  const hid = useHouseholdId();
  const lists = useRows<ShoppingList>(['shopping_lists', hid ?? ''], hid ? { table: 'shopping_lists', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: false }], limit: 1 } : null);
  const list = lists.data?.[0] ?? null;
  const items = useRows<ShoppingItem>(['shopping_items', list?.id ?? ''], list ? { table: 'shopping_items', filters: [eq('list_id', list.id)], order: [{ col: 'position' }] } : null, { staleTime: 5_000 });
  return { list, items: items.data ?? [], loading: lists.isLoading || items.isLoading };
}
export function useCreateShoppingList() {
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { title: string; planId: string | null; lines: ShoppingLine[] }) => {
      const h = hid ?? (await ensureHousehold());
      const id = uuid();
      await backend.insert('shopping_lists', { id, household_id: h, plan_id: v.planId, title: v.title });
      if (v.lines.length) await backend.insert('shopping_items', v.lines.map((l, n) => ({ list_id: id, household_id: h, ingredient_key: l.key, label: l.label, qty: l.qty, unit: l.unit, aisle: l.aisle, at_home: l.atHome, checked: false, position: n })));
      return id;
    },
    onSuccess: () => inv('shopping_lists', 'shopping_items'),
  });
}
export function useToggleShoppingItem() {
  const inv = useInvalidate();
  const userId = useUserId();
  return useMutation({
    // Cocher publie « shopping.item_checked » côté serveur : mission liée terminée si c'est son destinataire, stock « à valider »
    mutationFn: (v: { id: string; checked: boolean }) => backend.update('shopping_items', { checked: v.checked, checked_by: v.checked ? userId : null, checked_at: v.checked ? new Date().toISOString() : null }, [eq('id', v.id)]),
    onSuccess: () => inv('shopping_items', 'household_stocks', 'family_tasks', 'family_task_events', 'notifications'),
  });
}
export function useAddShoppingItem() {
  const inv = useInvalidate();
  return useMutation({
    // client_id unique par foyer : un article ajouté hors ligne est envoyé au retour du réseau, sans doublon
    mutationFn: (v: ShoppingItemInput) => insertOrQueue('shopping_items', {
      client_id: uuid(), list_id: v.listId, household_id: v.householdId, label: v.label, aisle: 'epicerie', position: v.position,
      ...(v.qty != null ? { qty: v.qty } : {}), ...(v.unit ? { unit: v.unit } : {}), ...(v.brand ? { brand: v.brand } : {}), ...(v.size ? { size: v.size } : {}),
      ...(v.category ? { category: v.category } : {}), ...(v.assignee_id ? { assignee_id: v.assignee_id } : {}), ...(v.stock_id ? { stock_id: v.stock_id } : {}),
    }),
    onSuccess: () => inv('shopping_items'),
  });
}
/** Modification d'un article lu à une version (quantité, marque, taille, responsable…) : jamais d'écrasement silencieux. */
export function useUpdateShoppingItem() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; version: number; patch: Record<string, unknown> }) => {
      const out = await updateIfVersion<ShoppingItem>('shopping_items', v.id, v.version, v.patch);
      if (out.status !== 'ok') throw new BackendError(out.status === 'conflict' ? tr('stk.err.conflict') : tr('stk.err.notFound'), out.status);
      return out.row;
    },
    onSettled: () => inv('shopping_items', 'household_stocks'),
  });
}
/** Articles déjà achetés (historique) : les plus récents d'abord. */
export function useShoppingHistory(listId: string | null | undefined) {
  return useRows<ShoppingItem>(['shopping_items', 'history', listId ?? ''], listId ? { table: 'shopping_items', filters: [eq('list_id', listId), eq('checked', true)], order: [{ col: 'checked_at', asc: false }], limit: 30 } : null);
}

// ---------------------------------------------------------------- recette personnelle (et création par l'équipe éditoriale)
export function useSavePersonalRecipe() {
  const hid = useHouseholdId();
  const userId = useUserId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { recipe: Recipe; library?: boolean }) => {
      const h = hid ?? (await ensureHousehold());
      const id = uuid();
      const rows = recipeToRows(v.recipe, id, v.library ? { status: 'ai_draft', verified_on: null } : { owner_id: userId, household_id: h, status: 'ai_draft', verified_on: null });
      await backend.insert('recipes', rows.recipe as unknown as Record<string, unknown>);
      await backend.insert('recipe_ingredients', rows.ingredients as unknown as Record<string, unknown>[]);
      await backend.insert('recipe_steps', rows.steps as unknown as Record<string, unknown>[]);
      await backend.insert('recipe_photos', rows.photo as unknown as Record<string, unknown>);
      return v.recipe.slug;
    },
    onSuccess: () => inv('recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_photos'),
  });
}

// ---------------------------------------------------------------- administration
export function useSetRecipeStatus() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { slug: string; status: Recipe['status']; note?: string | null }) => backend.rpc('set_recipe_status', { p_slug: v.slug, p_status: v.status, p_note: v.note ?? null }),
    onSuccess: () => inv('recipes', 'recipe_reviews'),
  });
}
export function useUpdateLibraryRecipe() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; patch: Partial<RecipeRow>; steps?: string[] }) => {
      await backend.update('recipes', v.patch as Record<string, unknown>, [eq('id', v.id)]);
      if (v.steps) {
        await backend.remove('recipe_steps', [eq('recipe_id', v.id)]);
        await backend.insert('recipe_steps', v.steps.map((body, n) => ({ recipe_id: v.id, position: n + 1, body })));
      }
    },
    onSuccess: () => inv('recipes', 'recipe_steps'),
  });
}

// ---------------------------------------------------------------- score nutritionnel et besoins alimentaires
/** Tranche d'âge du score : celle de l'enfant affiché, sinon la plus jeune tranche de chaque recette. */
export function scoreBandFor(r: Recipe, p: FoodProfile): AgeBand {
  return (p.audience === 'baby' || p.audience === 'child') && p.ageMonths != null ? bandFor(p.ageMonths) : defaultBand(r);
}
export function useRecipeScores(all: Recipe[] | null, p: FoodProfile) {
  return useMemo(() => new Map((all ?? []).map((r) => [r.id, scoreRecipe(r, scoreBandFor(r, p))])), [all, p.audience, p.ageMonths]); // eslint-disable-line react-hooks/exhaustive-deps
}
export type Need = 'no_milk' | 'no_gluten' | 'no_egg' | 'no_nuts' | 'iron' | 'calcium' | 'fiber';
export const NEEDS: Need[] = ['no_milk', 'no_gluten', 'no_egg', 'no_nuts', 'iron', 'calcium', 'fiber'];
export function meetsNeed(r: Recipe, s: RecipeScore | undefined, n: Need): boolean {
  switch (n) {
    case 'no_milk': return !r.allergens.includes('milk');
    case 'no_gluten': return !r.allergens.includes('gluten');
    case 'no_egg': return !r.allergens.includes('eggs');
    case 'no_nuts': return !r.allergens.includes('nuts') && !r.allergens.includes('peanuts');
    case 'iron': return (s?.parts.find((x) => x.key === 'iron')?.points ?? 0) >= 7;
    case 'calcium': return (s?.parts.find((x) => x.key === 'calcium')?.points ?? 0) >= 7;
    case 'fiber': return (s?.parts.find((x) => x.key === 'fiber')?.points ?? 0) >= 8;
  }
}

/** Prix vérifiés et datés des ingrédients (Open Prices ou saisie de l'équipe) — jamais de prix inventé. */
export interface IngredientPriceRow { ingredient_key: string; price_per_kg: number | null; price_per_unit: number | null; source: string; source_url: string | null; checked_on: string }
export function useIngredientPrices() {
  const q = useRows<IngredientPriceRow>(['ingredient_prices'], { table: 'ingredient_prices', order: [{ col: 'checked_on', asc: false }] }, { staleTime: 600_000 });
  const map = useMemo(() => {
    const m: Record<string, IngredientPrice> = {};
    for (const p of q.data ?? []) if (!m[p.ingredient_key]) m[p.ingredient_key] = { key: p.ingredient_key, pricePerKg: p.price_per_kg == null ? null : Number(p.price_per_kg), pricePerUnit: p.price_per_unit == null ? null : Number(p.price_per_unit), source: p.source, checkedOn: p.checked_on };
    return m;
  }, [q.data]);
  return { map, rows: q.data ?? [] };
}
