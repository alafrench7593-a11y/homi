/**
 * Génère la migration des versions anglaises des articles et des thèmes à partir de src/content/articles/en/.
 *   npx tsx scripts/gen-articles-en.ts
 * Additif : ne remplit que les colonnes *_en ; le texte français n'est jamais modifié.
 * Refuse une traduction d'un article inconnu ou vide.
 */
import { writeFileSync } from 'node:fs';
import { ARTICLES_EN, CATEGORIES_EN } from '../src/content/articles/en';
import { LIBRARY_ARTICLES } from '../src/content/articles/library';
import { NEURO_LIBRARY } from '../src/content/articles/rows';
import { GUIDE_ARTICLES } from '../src/content/articles/guide';

const q = (v: string) => `'${v.replace(/'/g, "''")}'`;
const known = new Set([...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES].map((a) => a.slug));
const errors: string[] = [];
for (const [slug, a] of Object.entries(ARTICLES_EN)) {
  if (!known.has(slug)) errors.push(`${slug}: article inconnu`);
  if (!a.title.trim() || !a.body_md.trim()) errors.push(`${slug}: traduction vide`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const out = [
  '-- Versions anglaises des articles et des thèmes — FICHIER GÉNÉRÉ par scripts/gen-articles-en.ts (ne pas modifier à la main).',
  '-- Additif : seules les colonnes *_en sont remplies. Retour arrière : update public.articles set title_en = null, summary_en = null, body_md_en = null;',
  ...Object.entries(CATEGORIES_EN).map(([slug, label]) => `update public.content_categories set label_en = ${q(label)} where slug = ${q(slug)};`),
  ...Object.entries(ARTICLES_EN).sort(([a], [b]) => a.localeCompare(b)).map(([slug, a]) =>
    `update public.articles set title_en = ${q(a.title)}, summary_en = ${q(a.summary)}, body_md_en = ${q(a.body_md)} where slug = ${q(slug)};`),
];
writeFileSync('supabase/migrations/20261104000500_articles_en.sql', `${out.join('\n')}\n`);
console.log(`${Object.keys(ARTICLES_EN).length}/${known.size} articles traduits, ${Object.keys(CATEGORIES_EN).length} thèmes`);
