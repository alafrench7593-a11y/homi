/**
 * Génère la migration de données de la rubrique « Sources et lectures » à partir de src/content/resources.ts (source unique).
 *   npx tsx scripts/gen-resources-seed.ts
 * Refuse un lien non https, un identifiant en double, un résumé de plus de 400 caractères ou une date de consultation manquante.
 * Idempotent : une ressource déjà présente (même identifiant lisible) n'est pas écrasée (corrections des éditeurs conservées).
 */
import { writeFileSync } from 'node:fs';
import { EXTERNAL_RESOURCES } from '../src/content/resources';

const q = (v: unknown): string => (v == null ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a: readonly string[]) => `array[${a.map(q).join(',')}]::text[]`;
const errors: string[] = [];
const seen = new Set<string>();
for (const r of EXTERNAL_RESOURCES) {
  if (seen.has(r.slug)) errors.push(`${r.slug}: identifiant en double`);
  seen.add(r.slug);
  if (!/^https:\/\//.test(r.url)) errors.push(`${r.slug}: lien non https`);
  if (r.description.length > 400) errors.push(`${r.slug}: résumé trop long`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.consulted_on)) errors.push(`${r.slug}: date de consultation`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const out = [
  '-- Sources et lectures (0 à 10 ans) — FICHIER GÉNÉRÉ par scripts/gen-resources-seed.ts (ne pas modifier à la main).',
  '-- Titre, éditeur, résumé rédigé par l’équipe et lien d’origine uniquement : aucun contenu ni aucune photo copiés.',
  'insert into public.external_resources (slug, kind, title, publisher, description, url, min_age_months, max_age_months, topics, references_note, published_on, consulted_on, status) values',
  EXTERNAL_RESOURCES.map((r) => `  (${[q(r.slug), q(r.kind), q(r.title), q(r.publisher), q(r.description), q(r.url), q(r.min_age_months), q(r.max_age_months), arr(r.topics), q(r.references_note), q(r.published_on), q(r.consulted_on), q('published')].join(', ')})`).join(',\n'),
  'on conflict (slug) do nothing;',
  '',
];
writeFileSync('supabase/migrations/20261020000700_external_resources_seed.sql', out.join('\n'));
console.log(`${EXTERNAL_RESOURCES.length} ressources écrites`);
