#!/usr/bin/env node
/**
 * Importe la table Ciqual (composition nutritionnelle des aliments, Anses) dans public.ciqual_foods.
 *
 * 1. Téléchargez la table au format XML depuis https://ciqual.anses.fr/ (rubrique « Téléchargement ») et
 *    décompressez-la : le dossier contient alim_*.xml, alim_grp_*.xml, compo_*.xml et const_*.xml.
 * 2. SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run ciqual:import -- "/chemin/du/dossier" --version "Ciqual 2020" --date 2020-07-07 [--dry-run]
 *
 * Constituants retenus (valeurs pour 100 g) : énergie (kcal, code 328), protéines (25000), glucides (31000),
 * sucres (32000), lipides (40000), sel (10004). Les valeurs « traces », « - » ou « < x » sont enregistrées
 * sous forme de nombre quand c'est possible ; sinon null, avec la mention d'origine conservée dans nutrients.notes.
 * Les lignes d'illustration (is_demo = true) sont supprimées avant l'import.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--version' && args[args.indexOf(a) - 1] !== '--date');
const dry = args.includes('--dry-run');
const version = args.includes('--version') ? args[args.indexOf('--version') + 1] : null;
const date = args.includes('--date') ? args[args.indexOf('--date') + 1] : null;
if (!dir || !fs.existsSync(dir) || !version || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
  console.error('Usage : npm run ciqual:import -- "/chemin/du/dossier" --version "Ciqual 2020" --date 2020-07-07 [--dry-run]');
  process.exit(1);
}

const read = (f) => {
  const buf = fs.readFileSync(path.join(dir, f));
  return /encoding="(utf-8|UTF-8)"/.test(buf.subarray(0, 200).toString('latin1')) ? buf.toString('utf8') : buf.toString('latin1');
};
const file = (pred, label) => {
  const f = fs.readdirSync(dir).find((x) => x.toLowerCase().endsWith('.xml') && pred(x.toLowerCase()));
  if (!f) { console.error(`Fichier ${label} introuvable dans ${dir}`); process.exit(1); }
  return read(f);
};

/** Extrait les enregistrements <TAG>…</TAG> et leurs champs simples (XML Ciqual, structure plate). */
export function records(xml, tag) {
  const out = [];
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  for (const m of xml.matchAll(re)) {
    const o = {};
    for (const f of m[1].matchAll(/<([a-zA-Z_]+)>\s*([\s\S]*?)\s*<\/\1>/g)) o[f[1]] = f[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    out.push(o);
  }
  return out;
}

const NUTRIENTS = { 328: 'energie_kcal', 25000: 'proteines_g', 31000: 'glucides_g', 32000: 'sucres_g', 40000: 'lipides_g', 10004: 'sel_g' };

const alims = records(file((x) => x.startsWith('alim_') && !x.startsWith('alim_grp'), 'alim_*.xml'), 'ALIM');
const groups = new Map(records(file((x) => x.startsWith('alim_grp'), 'alim_grp_*.xml'), 'ALIM_GRP').map((g) => [g.alim_ssgrp_code ? `${g.alim_grp_code}/${g.alim_ssgrp_code}` : g.alim_grp_code, g]));
const compo = records(file((x) => x.startsWith('compo'), 'compo_*.xml'), 'COMPO');

const nutrients = new Map();
for (const c of compo) {
  const key = NUTRIENTS[Number(c.const_code)];
  if (!key) continue;
  const raw = (c.teneur ?? '').replace(',', '.').trim();
  const value = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : null;
  const entry = nutrients.get(c.alim_code) ?? { values: {}, notes: {} };
  entry.values[key] = value;
  if (value == null && raw) entry.notes[key] = raw;
  nutrients.set(c.alim_code, entry);
}

const seen = new Map();
for (const a of alims) {
  if (!a.alim_code || !a.alim_nom_fr || seen.has(a.alim_code)) continue;
  const g = groups.get(`${a.alim_grp_code}/${a.alim_ssgrp_code}`) ?? groups.get(a.alim_grp_code);
  const n = nutrients.get(a.alim_code) ?? { values: {}, notes: {} };
  seen.set(a.alim_code, {
    code: a.alim_code,
    nom: a.alim_nom_fr,
    groupe: g?.alim_grp_nom_fr ?? null,
    sous_groupe: g?.alim_ssgrp_nom_fr ?? null,
    nutrients: { ...n.values, ...(Object.keys(n.notes).length ? { notes: n.notes } : {}) },
    source_version: version,
    source_date: date,
    is_demo: false,
  });
}
const all = [...seen.values()];
console.log(`${all.length} aliments lus.`);
if (dry) {
  console.log(JSON.stringify(all.slice(0, 3), null, 2));
  process.exit(0);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires (ou utilisez --dry-run).');
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const del = await fetch(`${url}/rest/v1/ciqual_foods?is_demo=eq.true`, { method: 'DELETE', headers });
if (!del.ok) console.warn('Suppression des lignes de démonstration impossible :', del.status, await del.text());
for (let i = 0; i < all.length; i += 500) {
  const res = await fetch(`${url}/rest/v1/ciqual_foods?on_conflict=code`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(all.slice(i, i + 500)),
  });
  if (!res.ok) {
    console.error(`Échec du lot ${i / 500 + 1} :`, res.status, await res.text());
    process.exit(1);
  }
  process.stdout.write(`\r${Math.min(i + 500, all.length)} / ${all.length}`);
}
console.log('\nImport Ciqual terminé.');
