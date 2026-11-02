/**
 * Contenus lourds de la démonstration (catalogues JSON, articles FR et EN, lignes des recettes), à part du moteur de démo.
 * QA E-06 : chargé par `import()` dans demo.ts, à l'ouverture de la démonstration seulement. Sur le web, ce module
 * et ses contenus sortent du fichier JavaScript de démarrage (morceau chargé à la demande) ; sur iOS et Android,
 * l'export ne découpe pas le bundle : tout reste embarqué dans l'application et disponible hors ligne.
 */
import content from '@/content/demo-content.json';
import { EXTRA_CATEGORIES, libraryArticleRows } from '@/content/articles/rows';
import { ARTICLES_EN, CATEGORIES_EN } from '@/content/articles/en';
// Recettes : passées par demo.ts (chargées par leur propre import(), partagé avec la copie de secours de hooks-recipes)
import type { ALL_RECIPES } from '@/content/recipes';
import { recipeToRows } from '../recipes/db';
import { RECIPE_SOURCES } from '../recipes/sources';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const catalogs = content as unknown as Record<string, Row[]>;
export { EXTRA_CATEGORIES, libraryArticleRows, ARTICLES_EN, CATEGORIES_EN };

/** Bibliothèque de recettes : mêmes lignes que supabase/migrations/20261020000200_recipes_seed.sql. */
export function recipeSeedRows(recipes: typeof ALL_RECIPES) {
  const tables: Record<string, Row[]> = { recipes: [], recipe_ingredients: [], recipe_steps: [], recipe_photos: [], recipe_source_links: [], recipe_reviews: [], recipe_sources: [] };
  for (const s of Object.values(RECIPE_SOURCES)) tables.recipe_sources.push({ id: s.id, title: s.title, publisher: s.publisher, url: s.url, consulted_on: s.consulted, published_on: s.date ?? null });
  for (const r of recipes) {
    const id = `lib-${r.slug}`;
    const x = recipeToRows(r, id, { created_at: '2026-10-20T00:00:00.000Z' });
    tables.recipes.push(x.recipe as unknown as Row);
    tables.recipe_ingredients.push(...(x.ingredients as unknown as Row[]));
    tables.recipe_steps.push(...(x.steps as unknown as Row[]));
    tables.recipe_photos.push(x.photo as unknown as Row);
    tables.recipe_source_links.push(...(x.links as unknown as Row[]));
    tables.recipe_reviews.push(...x.reviews.map((v, i) => ({ ...v, id: `seed-${r.slug}-${i}` }) as unknown as Row));
  }
  return tables;
}
