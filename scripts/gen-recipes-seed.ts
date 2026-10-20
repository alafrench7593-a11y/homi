/**
 * Génère la migration de données de la bibliothèque de recettes à partir de src/content/recipes (source unique).
 *   npx tsx scripts/gen-recipes-seed.ts
 * Idempotent : une recette déjà présente (même identifiant lisible) n'est ni écrasée ni dupliquée, pour ne jamais
 * annuler une correction ou une validation faite depuis l'administration.
 */
import { writeFileSync } from 'node:fs';
import { ALL_RECIPES, DRAFT_RECIPES } from '../src/content/recipes';
import type { Recipe } from '../src/lib/recipes/types';
import { INGREDIENTS } from '../src/lib/recipes/ingredients';
import { RECIPE_SOURCES } from '../src/lib/recipes/sources';
import { findDuplicates, validateRecipe } from '../src/lib/recipes/validate';

const q = (v: unknown): string => {
  if (v == null) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const arr = (a: readonly string[]) => `array[${a.map(q).join(',')}]::text[]`;

const errors = [...ALL_RECIPES, ...DRAFT_RECIPES].flatMap((r) => validateRecipe(r).map((e) => `${r.slug}: ${e}`)).concat(findDuplicates([...ALL_RECIPES, ...DRAFT_RECIPES]));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

function render(list: Recipe[], header: string[], withSources: boolean): string {
const out: string[] = [
  '-- Données de la bibliothèque de recettes — FICHIER GÉNÉRÉ par scripts/gen-recipes-seed.ts (ne pas modifier à la main).',
  ...header,
];
if (withSources) for (const s of Object.values(RECIPE_SOURCES)) {
  out.push(`insert into public.recipe_sources (id, title, publisher, url, consulted_on, published_on) values (${q(s.id)}, ${q(s.title)}, ${q(s.publisher)}, ${q(s.url)}, ${q(s.consulted)}, ${q(s.date ?? null)}) on conflict (id) do nothing;`);
}
for (const r of list) {
  const id = `(select id from public.recipes where slug = ${q(r.slug)} and owner_id is null)`;
  out.push('', `-- ${r.title}`);
  out.push(`insert into public.recipes (slug, title, summary, audiences, meals, stages, min_months, max_months, textures, servings, serving_label, prep_min, cook_min, allergens, tags, adaptations, storage, precautions, nutrition, budget, seasons, temperature, family_adaptations, verified_on, status) values (${[
    q(r.slug), q(r.title), q(r.summary), arr(r.audiences), arr(r.meals), arr(r.stages ?? []), q(r.minMonths ?? null), q(r.maxMonths ?? null), arr(r.textures),
    q(r.servings), q(r.servingLabel ?? null), q(r.prepMin), q(r.cookMin), arr(r.allergens), arr(r.tags), arr(r.adaptations), q(r.storage), arr(r.precautions),
    q(r.nutrition), q(r.budget), arr(r.seasons === 'all' ? [] : r.seasons), q(r.temperature), `${q(JSON.stringify(r.familyAdaptations ?? {}))}::jsonb`, q(r.verifiedOn), q(r.status),
  ].join(', ')}) on conflict (slug) do nothing;`);
  r.ingredients.forEach((x, n) => out.push(`insert into public.recipe_ingredients (recipe_id, position, ingredient_key, label, qty, unit, note, optional) values (${id}, ${n + 1}, ${q(x.key)}, ${q(INGREDIENTS[x.key].name)}, ${q(x.qty)}, ${q(x.unit)}, ${q(x.note ?? null)}, ${q(!!x.optional)}) on conflict do nothing;`));
  r.steps.forEach((s, n) => out.push(`insert into public.recipe_steps (recipe_id, position, body) values (${id}, ${n + 1}, ${q(s)}) on conflict do nothing;`));
  const p = r.photo;
  out.push(`insert into public.recipe_photos (recipe_id, kind, source, author, license, url, rights, generated, alt) values (${id}, ${q(p.kind)}, ${q(p.source)}, ${q(p.author)}, ${q(p.license)}, ${q(p.url)}, ${q(p.rights)}, ${q(p.generated)}, ${q(p.alt)}) on conflict do nothing;`);
  for (const s of r.sources) out.push(`insert into public.recipe_source_links (recipe_id, source_id) values (${id}, ${q(s)}) on conflict do nothing;`);
  for (const h of r.statusHistory) out.push(`insert into public.recipe_reviews (recipe_id, status, by_label, note, created_at) select ${id}, ${q(h.status)}, ${q(h.by)}, ${q(h.note ?? null)}, ${q(h.on)} where not exists (select 1 from public.recipe_reviews where recipe_id = ${id} and status = ${q(h.status)});`);
}
return `${out.join('\n')}\n`;
}
writeFileSync('supabase/migrations/20261020000200_recipes_seed.sql', render(ALL_RECIPES, [`-- ${ALL_RECIPES.length} recettes rédigées par une IA, statut « à vérifier » (to_review) : aucune n'est marquée relue ou validée.`], true));
writeFileSync('supabase/migrations/20261020000600_recipes_drafts_seed.sql', render(DRAFT_RECIPES, [`-- ${DRAFT_RECIPES.length} brouillons de recettes enfants rédigés par une IA, statut « brouillon généré par IA » (ai_draft) : invisibles des parents tant qu'une personne de l'équipe éditoriale ne les a pas relus.`], false));
console.log(`${ALL_RECIPES.length} recettes + ${DRAFT_RECIPES.length} brouillons écrits`);
