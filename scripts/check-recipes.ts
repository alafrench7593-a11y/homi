/**
 * Vérifie des lots de brouillons de recettes (JSON) avant import :
 *   npx tsx scripts/check-recipes.ts src/content/recipes/drafts/lot-01.json [autres fichiers…]
 * Affiche les erreurs par recette et les doublons avec toute la bibliothèque (recettes existantes + autres lots).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_RECIPES } from '../src/content/recipes';
import { checkDraft, type RecipeDraft } from '../src/lib/recipes/draft';
import { findDuplicates } from '../src/lib/recipes/validate';
import type { Recipe } from '../src/lib/recipes/types';

const files = process.argv.slice(2);
const dir = 'src/content/recipes/drafts';
const all = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
const origin = { by: 'Rédaction par une IA (Claude, Anthropic)', on: '2026-10-20' };
let bad = 0; let ok = 0;
const pool: Recipe[] = [...ALL_RECIPES];
for (const f of all) {
  const list = JSON.parse(readFileSync(f, 'utf8')) as Partial<RecipeDraft>[];
  for (const d of list) {
    const { recipe, errors } = checkDraft(d, origin);
    if (recipe) pool.push(recipe);
    if (files.length && !files.some((x) => f.endsWith(x.replace(/^\.\//, '')))) continue;
    if (errors.length) { bad++; console.log(`✗ ${f} › ${d.slug ?? '?'} : ${errors.join(' ; ')}`); } else ok++;
  }
}
const dups = findDuplicates(pool);
for (const x of dups) console.log(`✗ doublon : ${x}`);
console.log(`${ok} recettes valides, ${bad} en erreur, ${dups.length} doublons ; bibliothèque totale valide : ${pool.length}`);
process.exit(bad || dups.length ? 1 : 0);
