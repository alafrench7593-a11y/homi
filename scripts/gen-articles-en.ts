/**
 * Génère une migration des versions anglaises des articles et des thèmes à partir de src/content/articles/en/.
 *   npx tsx scripts/gen-articles-en.ts --out supabase/migrations/<horodatage>_articles_en_<suite>.sql
 * Additif : ne remplit que les colonnes *_en ; le texte français n'est jamais modifié.
 * Refuse une traduction d'un article inconnu ou vide.
 * Une migration déjà écrite ne se modifie jamais : le fichier de sortie doit être NOUVEAU, et seules les lignes absentes
 * des migrations *_articles_en*.sql précédentes y sont écrites (articles ajoutés ou traductions corrigées).
 * (La première migration, 20261104000500_articles_en.sql, a été produite par ce script avant cette règle.)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ARTICLES_EN, CATEGORIES_EN } from '../src/content/articles/en';
import { LIBRARY_ARTICLES } from '../src/content/articles/library';
import { NEURO_ARTICLES } from '../src/content/articles/neuro';
import { GUIDE_ARTICLES } from '../src/content/articles/guide';
import reference from '../src/content/demo-content.json';

const outArg = process.argv.indexOf('--out');
const out = outArg > 0 ? process.argv[outArg + 1] : '';
if (!out || !/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(out)) {
  console.error('Usage : npx tsx scripts/gen-articles-en.ts --out supabase/migrations/<AAAAMMJJhhmmss>_<nom>.sql');
  process.exit(1);
}
if (existsSync(out)) { console.error(`${out} existe déjà : une migration écrite ne se modifie pas, choisissez un nouveau fichier.`); process.exit(1); }

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
// Articles connus : bibliothèque, neurodéveloppement, guide, et articles de référence (migration 20261029000300)
const known = new Set([...LIBRARY_ARTICLES, ...NEURO_ARTICLES, ...GUIDE_ARTICLES, ...(reference as { articles: { slug: string }[] }).articles].map((a) => a.slug));
const errors: string[] = [];
for (const [slug, a] of Object.entries(ARTICLES_EN)) {
  if (!known.has(slug)) errors.push(`${slug}: article inconnu`);
  if (!a.title.trim() || !a.body_md.trim()) errors.push(`${slug}: traduction vide`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const dir = 'supabase/migrations';
const previous = readdirSync(dir).filter((f) => /_articles_en.*\.sql$/.test(f)).map((f) => readFileSync(join(dir, f), 'utf8'));
const already = new Set(previous.flatMap((s) => s.split('\n')));
const lines = [
  ...Object.entries(CATEGORIES_EN).map(([slug, label]) => `update public.content_categories set label_en = ${q(label)} where slug = ${q(slug)};`),
  ...Object.entries(ARTICLES_EN).sort(([a], [b]) => a.localeCompare(b)).map(([slug, a]) =>
    `update public.articles set title_en = ${q(a.title)}, summary_en = ${q(a.summary)}, body_md_en = ${q(a.body_md)} where slug = ${q(slug)};`),
];
// Une instruction tient sur une ligne (les retours à la ligne du texte sont dans la chaîne) : comparaison par instruction
const statements = lines.join('\n').split(/;\n(?=update public\.)/).map((s, k, all) => (k < all.length - 1 ? `${s};` : s));
const fresh = statements.filter((s) => !s.split('\n').every((l) => already.has(l)));
if (!fresh.length) { console.log('Rien de nouveau : aucune migration écrite.'); process.exit(0); }

writeFileSync(out, `${[
  `-- Versions anglaises des articles et des thèmes (suite) — FICHIER GÉNÉRÉ par scripts/gen-articles-en.ts (ne pas modifier à la main) : ${basename(out)}.`,
  '-- Additif : seules les colonnes *_en sont remplies (texte français inchangé) ; seules les lignes absentes des migrations *_articles_en*.sql précédentes.',
  `-- Retour arrière : update public.articles set title_en = null, summary_en = null, body_md_en = null where slug in (${fresh.map((s) => /where slug = ('(?:[^']|'')*');$/.exec(s)?.[1]).filter(Boolean).join(', ')});`,
  ...fresh,
].join('\n')}\n`);
console.log(`${out} : ${fresh.length} instruction(s) ; ${Object.keys(ARTICLES_EN).length}/${known.size} articles traduits au total`);
