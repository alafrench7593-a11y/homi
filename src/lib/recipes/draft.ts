/**
 * Format d'import des recettes (JSON ou CSV converti) → recette de l'application.
 * Toute recette importée passe par `checkDraft` : structure, dictionnaire d'ingrédients, contrôles de validate.ts.
 * Une recette rédigée par une IA arrive au statut « Brouillon généré par IA » : invisible des parents tant qu'une
 * personne de l'équipe éditoriale ne l'a pas relue (statut « Relu » ou « Validé pour publication »).
 */
import { generatedPhoto } from './build';
import { AI_PHOTOS } from './photoCredits';
import { INGREDIENTS } from './ingredients';
import { RECIPE_SOURCES } from './sources';
import { ALLERGENS, MEALS, STAGES, TAGS, TEXTURES, type Recipe, type RecipeIngredient, type Unit } from './types';
import { validateRecipe } from './validate';

/** Ingrédient : [clé du dictionnaire, quantité, unité, précision ?, facultatif ?] */
export type DraftIngredient = [string, number | null, Unit | null, string?, boolean?];
export interface RecipeDraft {
  slug: string; title: string; summary: string;
  audiences: Recipe['audiences']; meals: Recipe['meals']; stages?: Recipe['stages'];
  minMonths?: number; maxMonths?: number; textures: Recipe['textures'];
  servings: number; servingLabel?: string; prepMin: number; cookMin: number;
  ingredients: DraftIngredient[]; steps: string[]; allergens: Recipe['allergens']; tags: Recipe['tags'];
  adaptations: string[]; storage: string; freezing?: string; precautions: string[]; nutrition: string;
  budget: 1 | 2 | 3; seasons: Recipe['seasons']; temperature: 'hot' | 'cold';
  familyAdaptations?: Recipe['familyAdaptations']; sources: string[];
  /** Version anglaise des textes (facultative), voir RecipeEnglish. */
  en?: Recipe['en'];
}
export interface DraftOrigin { by: string; on: string; note?: string; status?: Recipe['status'] }

const UNITS: Unit[] = ['g', 'ml', 'u', 'cs', 'cc', 'pincee'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

/** Erreurs de structure (avant conversion). */
export function structureErrors(d: Partial<RecipeDraft>): string[] {
  const e: string[] = [];
  const arr = (k: keyof RecipeDraft) => Array.isArray(d[k]);
  if (!d.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) e.push('identifiant (slug) invalide');
  if (!d.title) e.push('titre manquant');
  if (!d.summary) e.push('résumé manquant');
  for (const k of ['audiences', 'meals', 'textures', 'ingredients', 'steps', 'allergens', 'tags', 'adaptations', 'precautions', 'sources'] as const) if (!arr(k)) e.push(`${k} : liste attendue`);
  if (e.length) return e;
  if (!d.audiences!.every((a) => ['pregnancy', 'baby', 'child', 'family'].includes(a))) e.push('public inconnu');
  if (!d.meals!.length || !d.meals!.every((m) => (MEALS as readonly string[]).includes(m))) e.push('repas inconnu');
  if (!d.textures!.every((t) => (TEXTURES as readonly string[]).includes(t))) e.push('texture inconnue');
  if (d.stages && !d.stages.every((s) => (STAGES as readonly string[]).includes(s))) e.push('étape inconnue');
  if (!d.allergens!.every((a) => (ALLERGENS as readonly string[]).includes(a))) e.push('allergène inconnu');
  if (!d.tags!.every((t) => (TAGS as readonly string[]).includes(t))) e.push(`étiquette inconnue : ${d.tags!.filter((t) => !(TAGS as readonly string[]).includes(t)).join(', ')}`);
  for (const x of d.ingredients!) {
    if (!Array.isArray(x) || typeof x[0] !== 'string') { e.push('ingrédient mal formé'); continue; }
    if (!INGREDIENTS[x[0]]) e.push(`ingrédient hors dictionnaire : ${x[0]}`);
    if (x[2] != null && !UNITS.includes(x[2])) e.push(`unité inconnue : ${x[2]}`);
  }
  for (const s of d.sources!) if (!RECIPE_SOURCES[s]) e.push(`source inconnue : ${s}`);
  if (d.seasons !== 'all' && !(Array.isArray(d.seasons) && d.seasons.every((s) => SEASONS.includes(s)))) e.push('saisons invalides');
  if (![1, 2, 3].includes(d.budget as number)) e.push('budget 1, 2 ou 3');
  if (d.temperature !== 'hot' && d.temperature !== 'cold') e.push('température hot ou cold');
  if (!(d.servings! > 0) || !(d.prepMin! >= 0) || !(d.cookMin! >= 0)) e.push('portions ou temps invalides');
  if (d.minMonths != null && d.maxMonths != null && d.minMonths > d.maxMonths) e.push('âges incohérents');
  if (d.maxMonths != null && d.maxMonths > 120 && !d.audiences!.includes('family')) e.push('âge maximal au-delà de 10 ans');
  return e;
}

export function draftToRecipe(d: RecipeDraft, o: DraftOrigin): Recipe {
  const ingredients: RecipeIngredient[] = d.ingredients.map(([key, qty, unit, note, optional]) => ({ key, qty, unit, ...(note ? { note } : {}), ...(optional ? { optional: true } : {}) }));
  const status = o.status ?? 'ai_draft';
  return {
    ...d, ingredients, id: `rcp-${d.slug}`, photo: AI_PHOTOS[d.slug] ?? generatedPhoto(d.title), verifiedOn: o.on, status,
    statusHistory: [
      { status: 'ai_draft', by: o.by, on: o.on, ...(o.note ? { note: o.note } : {}) },
      ...(status !== 'ai_draft' ? [{ status, by: 'Contrôles automatiques de l’application', on: o.on }] : []),
    ],
  };
}

/** Vérifie un brouillon : structure puis contrôles de qualité. Renvoie la recette si tout passe. */
export function checkDraft(d: Partial<RecipeDraft>, o: DraftOrigin): { recipe: Recipe | null; errors: string[] } {
  const s = structureErrors(d);
  if (s.length) return { recipe: null, errors: s };
  const r = draftToRecipe(d as RecipeDraft, o);
  const v = validateRecipe(r);
  return { recipe: v.length ? null : r, errors: v };
}

/**
 * CSV d'import (séparateur « ; », une recette par ligne, listes séparées par « | », ingrédients « clé:quantité:unité »).
 * Colonnes : slug;title;summary;audiences;meals;minMonths;maxMonths;textures;servings;prepMin;cookMin;ingredients;steps;
 *            allergens;tags;adaptations;storage;precautions;nutrition;budget;seasons;temperature;sources
 */
export function parseCsv(text: string): Partial<RecipeDraft>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = lines[0].split(';').map((h) => h.trim());
  const list = (v: string) => (v ? v.split('|').map((x) => x.trim()).filter(Boolean) : []);
  return lines.slice(1).map((l) => {
    const c = l.split(';');
    const g = (k: string) => (c[head.indexOf(k)] ?? '').trim();
    const num = (k: string) => (g(k) === '' ? undefined : Number(g(k)));
    return {
      slug: g('slug'), title: g('title'), summary: g('summary'), audiences: list(g('audiences')) as RecipeDraft['audiences'], meals: list(g('meals')) as RecipeDraft['meals'],
      minMonths: num('minMonths'), maxMonths: num('maxMonths'), textures: list(g('textures')) as RecipeDraft['textures'], servings: num('servings') ?? 0,
      prepMin: num('prepMin') ?? 0, cookMin: num('cookMin') ?? 0,
      ingredients: list(g('ingredients')).map((x) => { const [k, q, u, n] = x.split(':'); return [k, q ? Number(q.replace(',', '.')) : null, (u || null) as Unit | null, n || undefined] as DraftIngredient; }),
      steps: list(g('steps')), allergens: list(g('allergens')) as RecipeDraft['allergens'], tags: list(g('tags')) as RecipeDraft['tags'],
      adaptations: list(g('adaptations')), storage: g('storage'), precautions: list(g('precautions')), nutrition: g('nutrition'),
      budget: (num('budget') ?? 2) as 1 | 2 | 3, seasons: g('seasons') === 'all' || !g('seasons') ? 'all' : (list(g('seasons')) as RecipeDraft['seasons']),
      temperature: (g('temperature') || 'hot') as 'hot' | 'cold', sources: list(g('sources')),
    };
  });
}

/** Lecture d'un lot (JSON : liste ou objet unique ; CSV : en-tête + une recette par ligne). */
export function readBatch(text: string, format: 'json' | 'csv'): Partial<RecipeDraft>[] {
  if (format === 'csv') return parseCsv(text);
  const v = JSON.parse(text) as unknown;
  return (Array.isArray(v) ? v : [v]) as Partial<RecipeDraft>[];
}
