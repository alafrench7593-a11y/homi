/**
 * Migration ADDITIVE pour un lot d'articles (sans toucher à la migration du guide déjà appliquée).
 *   npx tsx scripts/gen-articles-lot.ts b36 supabase/migrations/<AAAAMMJJhhmmss>_articles_b36.sql
 * Mêmes règles que gen-articles-seed.ts : source https obligatoire, identifiants uniques, statut « à vérifier »,
 * `on conflict (slug) do nothing` (un article déjà présent n'est jamais écrasé).
 */
import { writeFileSync } from 'node:fs';
import { GUIDE_ARTICLES, GUIDE_UPDATED_ON } from '../src/content/articles/guide';
import { LIBRARY_ARTICLES } from '../src/content/articles/library';
import { NEURO_LIBRARY, journeysOf } from '../src/content/articles/rows';
import type { LibArticle } from '../src/content/articles/library';

const [lot, out] = process.argv.slice(2);
if (!lot || !out || !/^supabase\/migrations\/\d{14}_[a-z0-9_]+\.sql$/.test(out)) { console.error('Usage : npx tsx scripts/gen-articles-lot.ts <lot> supabase/migrations/<horodatage>_<nom>.sql'); process.exit(1); }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require(`../src/content/articles/guide/${lot}`) as Record<string, LibArticle[]>;
const list = mod[`GUIDE_${lot.toUpperCase()}`];
if (!list?.length) { console.error(`Lot ${lot} introuvable`); process.exit(1); }

const q = (v: unknown): string => (v == null ? 'null' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? 'true' : 'false') : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a: readonly string[]) => `array[${a.map(q).join(',')}]::text[]`;
const others = new Set([...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES.filter((a) => !list.some((b) => b.slug === a.slug))].map((a) => a.slug));
const errors: string[] = [];
for (const a of list) {
  if (others.has(a.slug)) errors.push(`${a.slug}: identifiant déjà utilisé`);
  if (!a.sources.length || a.sources.some((s) => !/^https:\/\//.test(s.url) || !s.consulted_on)) errors.push(`${a.slug}: source manquante ou non https`);
  if (a.status !== 'to_review') errors.push(`${a.slug}: statut`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const lines = [
  `-- Articles du lot ${lot} — FICHIER GÉNÉRÉ par scripts/gen-articles-lot.ts (ne pas modifier à la main).`,
  `-- ${list.length} articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut éditorial « à vérifier ». Additif : rien n'est écrasé.`,
  `-- Retour arrière : delete from public.articles where slug in (${list.map((a) => q(a.slug)).join(', ')});`,
];
for (const a of list) {
  const tags = [...a.tags, ...(a.journeys.includes('parents_sleep') ? ['sommeil-parents'] : [])];
  const sources = a.sources.map((s) => ({ label: s.label, url: s.url, consulted_on: s.consulted_on, ...(s.published ? { published: s.published } : {}) }));
  lines.push(`insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values (${[
    q(a.slug), `(select id from public.content_categories where slug = ${q(a.category)})`, q(a.title), q(a.summary), q(a.body_md), arr(journeysOf(a)),
    q(a.min_week ?? null), q(a.max_week ?? null), q(a.min_age_months ?? null), q(a.max_age_months ?? null), q(a.category === 'post-partum'), arr(tags),
    q('Rédaction assistée par une IA (Claude, Anthropic)'), `${q(JSON.stringify(sources))}::jsonb`, q(GUIDE_UPDATED_ON), q('published'), q(a.status), 'false', q(!!a.safety_critical),
  ].join(', ')}) on conflict (slug) do nothing;`);
}
writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`${list.length} articles → ${out}`);
