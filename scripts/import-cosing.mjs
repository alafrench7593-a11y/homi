#!/usr/bin/env node
/**
 * Importe la base CosIng (ingrédients cosmétiques, Commission européenne) dans public.cosing_ingredients.
 *
 * 1. Téléchargez l'export CSV officiel des ingrédients depuis https://ec.europa.eu/growth/tools-databases/cosing/
 *    (ou le jeu « CosIng » sur https://data.europa.eu) — fichier du type « COSING_Ingredients-Fragrance Inventory_v2.csv ».
 * 2. SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run cosing:import -- "/chemin/COSING_Ingredients.csv" [--date 2026-10-16] [--dry-run]
 *
 * - Colonnes lues (en-tête repéré automatiquement) : « INCI name », « CAS No », « EC No », « Function », « Restriction » ; « Update Date » si présent.
 * - Les fonctions sont conservées telles qu'écrites par la Commission (traduction à l'affichage dans l'application).
 * - Les lignes d'illustration (is_demo = true) sont supprimées avant l'import : aucune donnée fictive ne reste mêlée aux vraies.
 * - La clé de service n'est jamais embarquée dans l'application : ce script s'exécute sur le poste de l'équipe.
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dry = args.includes('--dry-run');
const dateArg = args.includes('--date') ? args[args.indexOf('--date') + 1] : null;
if (!file || !fs.existsSync(file)) {
  console.error('Indiquez le fichier CSV CosIng : npm run cosing:import -- "/chemin/COSING_Ingredients.csv"');
  process.exit(1);
}

/** Lecteur CSV minimal (guillemets, séparateur , ou ;). */
export function parseCsv(text) {
  const firstLines = text.split(/\r?\n/).slice(0, 20).join('\n');
  const sep = (firstLines.match(/;/g) ?? []).length > (firstLines.match(/,/g) ?? []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const toIso = (s) => {
  const m = String(s ?? '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const i = String(s ?? '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return i ? i[0] : null;
};

const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
const rows = parseCsv(text);
const headerIdx = rows.findIndex((r) => r.some((c) => /^\s*inci name\s*$/i.test(c)));
if (headerIdx < 0) {
  console.error('En-tête « INCI name » introuvable : vérifiez qu’il s’agit bien de l’export CSV des ingrédients CosIng.');
  process.exit(1);
}
const header = rows[headerIdx].map((h) => h.trim().toLowerCase());
const col = (re) => header.findIndex((h) => re.test(h));
const C = { inci: col(/^inci name$/), cas: col(/^cas no/), ec: col(/^ec no/), fn: col(/^function/), restr: col(/^restriction/), upd: col(/update date/) };
const today = dateArg ?? new Date().toISOString().slice(0, 10);

const byName = new Map();
for (const r of rows.slice(headerIdx + 1)) {
  const inci = (r[C.inci] ?? '').trim();
  if (!inci) continue;
  const restriction = C.restr >= 0 ? (r[C.restr] ?? '').trim() : '';
  const annexes = [...restriction.matchAll(/\b(II|III|IV|V|VI)\s*\/\s*\d+[a-z]?/gi)].map((m) => m[0].replace(/\s+/g, ''));
  byName.set(inci, {
    inci_name: inci,
    cas: C.cas >= 0 ? (r[C.cas] ?? '').trim() || null : null,
    ec: C.ec >= 0 ? (r[C.ec] ?? '').trim() || null : null,
    functions: C.fn >= 0 ? (r[C.fn] ?? '').split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean) : [],
    restrictions: restriction ? `Restriction CosIng : ${restriction}` : null,
    annex_refs: [...new Set(annexes)],
    source_url: 'https://ec.europa.eu/growth/tools-databases/cosing/',
    updated_on: (C.upd >= 0 && toIso(r[C.upd])) || today,
    is_demo: false,
  });
}
const all = [...byName.values()];
console.log(`${all.length} ingrédients lus.`);
if (dry) {
  console.log(JSON.stringify(all.slice(0, 5), null, 2));
  process.exit(0);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires (ou utilisez --dry-run).');
  process.exit(1);
}
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const del = await fetch(`${url}/rest/v1/cosing_ingredients?is_demo=eq.true`, { method: 'DELETE', headers });
if (!del.ok) console.warn('Suppression des lignes de démonstration impossible :', del.status, await del.text());
for (let i = 0; i < all.length; i += 500) {
  const batch = all.slice(i, i + 500);
  const res = await fetch(`${url}/rest/v1/cosing_ingredients?on_conflict=inci_name`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    console.error(`Échec du lot ${i / 500 + 1} :`, res.status, await res.text());
    process.exit(1);
  }
  process.stdout.write(`\r${Math.min(i + 500, all.length)} / ${all.length}`);
}
console.log('\nImport CosIng terminé.');
