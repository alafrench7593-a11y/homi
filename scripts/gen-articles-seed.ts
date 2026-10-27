/**
 * Génère la migration de données des articles par parcours à partir de src/content/articles/library.ts (source unique).
 *   npx tsx scripts/gen-articles-seed.ts
 * Refuse un article sans source https, un identifiant en double, ou un statut autre que « à vérifier ».
 * Idempotent : un article déjà présent (même identifiant lisible) n'est pas écrasé (corrections et relectures conservées).
 */
import { writeFileSync } from 'node:fs';
import { LIBRARY_ARTICLES } from '../src/content/articles/library';
import { EXTRA_CATEGORIES, journeysOf, LIBRARY_UPDATED_ON, NEURO_LIBRARY } from '../src/content/articles/rows';
import type { LibArticle } from '../src/content/articles/library';
import { GUIDE_ARTICLES } from '../src/content/articles/guide';

const q = (v: unknown): string => {
  if (v == null) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const arr = (a: readonly string[]) => `array[${a.map(q).join(',')}]::text[]`;

const errors: string[] = [];
const seen = new Set<string>();
for (const a of [...LIBRARY_ARTICLES, ...NEURO_LIBRARY, ...GUIDE_ARTICLES]) {
  if (seen.has(a.slug)) errors.push(`${a.slug}: identifiant en double`);
  seen.add(a.slug);
  if (!a.sources.length || a.sources.some((s) => !/^https:\/\//.test(s.url) || !s.consulted_on)) errors.push(`${a.slug}: source manquante ou non https`);
  if (a.status !== 'to_review') errors.push(`${a.slug}: statut`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

function render(list: (LibArticle & { updated_on?: string })[], header: string[], categories: typeof EXTRA_CATEGORIES): string {
const out: string[] = [
  '-- Articles par parcours — FICHIER GÉNÉRÉ par scripts/gen-articles-seed.ts (ne pas modifier à la main).',
  ...header,
];
for (const c of categories) out.push(`insert into public.content_categories (slug, label, icon, position) values (${q(c.slug)}, ${q(c.label)}, ${q(c.icon)}, ${c.position}) on conflict (slug) do nothing;`);
for (const a of list) {
  const tags = [...a.tags, ...(a.journeys.includes('parents_sleep') ? ['sommeil-parents'] : [])];
  const sources = a.sources.map((s) => ({ label: s.label, url: s.url, consulted_on: s.consulted_on, ...(s.published ? { published: s.published } : {}) }));
  out.push(`insert into public.articles (slug, category_id, title, summary, body_md, journeys, min_week, max_week, min_age_months, max_age_months, postpartum, tags, author_name, sources, updated_on, status, editorial_status, is_premium, is_safety_critical) values (${[
    q(a.slug), `(select id from public.content_categories where slug = ${q(a.category)})`, q(a.title), q(a.summary), q(a.body_md), arr(journeysOf(a)),
    q(a.min_week ?? null), q(a.max_week ?? null), q(a.min_age_months ?? null), q(a.max_age_months ?? null), q(a.category === 'post-partum'), arr(tags),
    q('Rédaction assistée par une IA (Claude, Anthropic)'), `${q(JSON.stringify(sources))}::jsonb`, q(a.updated_on ?? LIBRARY_UPDATED_ON), q('published'), q(a.status), 'false', q(!!a.safety_critical),
  ].join(', ')}) on conflict (slug) do nothing;`);
}
return `${out.join('\n')}\n`;
}
// Les deux premières migrations (20/10 et 21/10) sont figées : déjà appliquées, elles ne sont plus régénérées.
// Guide complet du 27/10/2026 : migration ADDITIVE — nouvelles catégories, nouveaux articles (rien n'est écrasé),
// et mise à jour du texte des articles existants SEULEMENT s'ils sont encore « à vérifier » (relectures conservées).
const updates = [...LIBRARY_ARTICLES, ...NEURO_LIBRARY].map((a) => `update public.articles set title = ${q(a.title)}, summary = ${q(a.summary)}, body_md = ${q(a.body_md)}, sources = ${q(JSON.stringify(a.sources.map((s) => ({ label: s.label, url: s.url, consulted_on: s.consulted_on, ...(s.published ? { published: s.published } : {}) }))))}::jsonb, updated_on = '2026-10-27' where slug = ${q(a.slug)} and editorial_status = 'to_review';`);
writeFileSync('supabase/migrations/20261030000100_articles_guide.sql', render(GUIDE_ARTICLES, [
  `-- Guide complet : ${GUIDE_ARTICLES.length} nouveaux articles (concevoir, grossesse, bébé, enfant, troubles, alimentation, sport, matériel, vie pratique…), rédigés avec l'aide d'une IA à partir de sources officielles consultées le 27/10/2026 : statut éditorial « à vérifier ».`,
  '-- Retour arrière : delete from public.articles where updated_on = \'2026-10-27\' and editorial_status = \'to_review\' and slug not in (anciens slugs) ; les catégories ajoutées peuvent rester.',
], EXTRA_CATEGORIES) + ['-- Textes enrichis des articles existants (seulement ceux qui ne sont pas encore relus)', ...updates].join('\n') + '\n');
console.log(`${GUIDE_ARTICLES.length} articles du guide + ${updates.length} mises à jour`);
