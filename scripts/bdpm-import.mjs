#!/usr/bin/env node
/**
 * Import de la Base de données publique des médicaments (BDPM) → SQL pour public.medicine_presentations.
 * Usage : node scripts/bdpm-import.mjs <CIS_bdpm.txt> <CIS_CIP_bdpm.txt> > bdpm.sql
 * Fichiers : https://base-donnees-publique.medicaments.gouv.fr/telechargement (licence ouverte).
 * Aucune posologie n'est importée : seulement identité, forme, voies, présentation, titulaire, commercialisation.
 * L'application en production passe par la propriétaire (aucune écriture sans son accord).
 */
import { readFileSync } from 'node:fs';

/** Les fichiers BDPM mélangent UTF-8 et ISO-8859-1 selon les versions. */
function decode(path) {
  const buf = readFileSync(path);
  const utf8 = buf.toString('utf8');
  return utf8.includes('�') ? buf.toString('latin1') : utf8;
}
const rows = (path) => decode(path).split(/\r?\n/).filter(Boolean).map((l) => l.split('\t').map((c) => c.trim()));
const q = (v) => (v == null || v === '' ? 'null' : `'${String(v).replace(/'/g, "''").slice(0, 400)}'`);

export function buildSql(cisRows, cipRows, importedAt = new Date().toISOString()) {
  const cis = new Map();
  for (const r of cisRows) if (/^\d{8}$/.test(r[0])) cis.set(r[0], { name: r[1], form: r[2], routes: r[3], holder: r[10], monitoring: /^oui$/i.test(r[11] ?? '') });
  const values = [];
  for (const r of cipRows) {
    const [c, cip7, label, adminStatus, marketState, , cip13] = r;
    const m = cis.get(c);
    if (!m || !/^\d{13}$/.test(cip13 ?? '')) continue;
    const marketed = /active/i.test(adminStatus ?? '') && /d[ée]claration de commercialisation/i.test(marketState ?? '');
    values.push(`(${q(cip13)},${/^\d{7}$/.test(cip7) ? q(cip7) : 'null'},${q(c)},${q(m.name)},${q(m.form)},${q(m.routes)},${q(label)},${q(m.holder)},${marketed},${m.monitoring},${q(importedAt)})`);
  }
  const out = ['begin;'];
  for (let i = 0; i < values.length; i += 500) {
    out.push(`insert into public.medicine_presentations (cip13,cip7,cis,name,form,routes,presentation,holder,marketed,reinforced_monitoring,imported_at) values\n${values.slice(i, i + 500).join(',\n')}\non conflict (cip13) do update set cip7=excluded.cip7,cis=excluded.cis,name=excluded.name,form=excluded.form,routes=excluded.routes,presentation=excluded.presentation,holder=excluded.holder,marketed=excluded.marketed,reinforced_monitoring=excluded.reinforced_monitoring,imported_at=excluded.imported_at;`);
  }
  // Présentations retirées de la base officielle depuis le dernier import : marquées non commercialisées, pas effacées.
  out.push(`update public.medicine_presentations set marketed = false where imported_at < ${q(importedAt)};`, 'commit;');
  return { sql: out.join('\n'), count: values.length };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) { console.error('Usage : node scripts/bdpm-import.mjs <CIS_bdpm.txt> <CIS_CIP_bdpm.txt>'); process.exit(1); }
  const { sql, count } = buildSql(rows(a), rows(b));
  process.stdout.write(sql + '\n');
  console.error(`${count} présentations`);
}
