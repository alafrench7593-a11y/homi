/** Lignes complètes d'un brouillon IA de bibliothèque (copie de « dd-puree-courgette »), pour les tests navigateur. */
import { ALL_RECIPES } from '../src/content/recipes';
import { recipeToRows } from '../src/lib/recipes/db';
const src = ALL_RECIPES.find((r) => r.slug === 'dd-puree-courgette')!;
const r = { ...src, slug: process.argv[2] ?? 'e2e-brouillon-ia', title: 'Brouillon IA de test', status: 'ai_draft' as const };
const x = recipeToRows(r, 'e2e-draft-row', { created_at: '2026-10-21T00:00:00.000Z' });
process.stdout.write(JSON.stringify({ recipes: [x.recipe], recipe_ingredients: x.ingredients, recipe_steps: x.steps, recipe_photos: [x.photo], recipe_source_links: x.links }));
