/** Bibliothèque de recettes telle que la base de démonstration la reconstruit (lignes identiques), pour les tests navigateur. */
import { ALL_RECIPES } from '../src/content/recipes';
import { recipeToRows } from '../src/lib/recipes/db';
const out: Record<string, unknown> = {};
for (const r of ALL_RECIPES) {
  const x = recipeToRows(r, `lib-${r.slug}`);
  const rec = x.recipe as unknown as Record<string, unknown>;
  out[r.slug] = { aud: rec.audiences, tex: rec.textures, al: rec.allergens, tags: rec.tags, title: rec.title, status: rec.status,
    ings: (x.ingredients as unknown as { ingredient_key: string }[]).map((i) => i.ingredient_key), photo: x.photo };
}
process.stdout.write(JSON.stringify(out));
