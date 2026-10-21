/**
 * Vérifie les lots du nouveau catalogue de recettes (src/content/recipes/v2/*.json) :
 *   npx tsx scripts/check-recipes-v2.ts [lot-01.json …]
 * Contrôles : ceux de tout import (structure, dictionnaire, allergènes, âges, sources, sécurité),
 * plus : congélation renseignée, sources « poissons » (ANSES, Santé.fr) pour toute recette avec du poisson,
 * aucun doublon dans le catalogue.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkDraft, type RecipeDraft } from '../src/lib/recipes/draft';
import { INGREDIENTS } from '../src/lib/recipes/ingredients';
import { findDuplicates } from '../src/lib/recipes/validate';
import type { Recipe } from '../src/lib/recipes/types';

const only = process.argv.slice(2);
const dir = 'src/content/recipes/v2';
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
const origin = { by: 'Rédaction par une IA (Claude, Anthropic)', on: '2026-10-21', status: 'to_review' as const };
const pool: Recipe[] = [];
let bad = 0; let ok = 0;
for (const f of files) {
  const list = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Partial<RecipeDraft>[];
  for (const d of list) {
    const { recipe, errors } = checkDraft(d, origin);
    const extra: string[] = [];
    if (!d.freezing || d.freezing.trim().length < 10) extra.push('congélation non renseignée');
    if ((d.ingredients ?? []).some((x) => INGREDIENTS[x[0]]?.fish) && !(d.sources ?? []).includes('anses_poisson')) extra.push('poisson : source anses_poisson attendue');
    const all = [...errors, ...extra];
    if (recipe && !extra.length) pool.push(recipe);
    if (only.length && !only.some((x) => f.endsWith(x))) continue;
    if (all.length) { bad++; console.log(`✗ ${f} › ${d.slug ?? '?'} : ${all.join(' ; ')}`); } else ok++;
  }
}
const dups = findDuplicates(pool);
for (const x of dups) console.log(`✗ doublon : ${x}`);
console.log(`${ok} recettes valides, ${bad} en erreur, ${dups.length} doublons ; catalogue valide : ${pool.length}`);
process.exit(bad || dups.length ? 1 : 0);
