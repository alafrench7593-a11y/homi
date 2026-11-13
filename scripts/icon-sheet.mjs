#!/usr/bin/env node
/**
 * Planche de contrôle des pictogrammes « Au fil de nous » (aucune route ajoutée à l'application).
 *
 * Usage : node scripts/icon-sheet.mjs <sortie.html>
 * Génère une page HTML : chaque symbole à 20, 32 et 64 px (+ état actif à 32 px), sur fond ivoire #F8F4EE,
 * rose poudré #F2DDD8 et bleu nuit #1F2344. Les tracés viennent directement de src/components/icons
 * (transpilés à la volée avec TypeScript), le rendu reproduit celui de MaternityIcon (trait 1,6, extrémités rondes).
 * La capture PNG se fait ensuite avec Playwright (voir MATERNITY_ICONOGRAPHY_SYSTEM.md).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] ?? path.join(os.tmpdir(), 'icon-sheet.html');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-'));
for (const f of ['geometry', 'maternityPaths']) {
  const src = fs.readFileSync(path.join(root, 'src/components/icons', `${f}.ts`), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText
    .replace(/from '\.\/geometry'/g, "from './geometry.mjs'");
  fs.writeFileSync(path.join(tmp, `${f}.mjs`), js);
}
const { MATERNITY_ICONS, MATERNITY_ICON_GROUPS } = await import(pathToFileURL(path.join(tmp, 'maternityPaths.mjs')).href);

const STROKE = 1.6; const ACTIVE_STROKE = 2; const TINT = 0.2; const MUTED = 0.4;
function svg(name, size, color, active = false) {
  const els = MATERNITY_ICONS[name].map((p) => {
    const fill = p.fill === 'solid' ? color : p.fill === 'tint' && active ? color : 'none';
    const fo = p.fill === 'tint' ? TINT : 1;
    return `<path d="${p.d}" fill="${fill}" fill-opacity="${fo}" stroke="${color}" stroke-width="${active ? ACTIVE_STROKE : STROKE}" stroke-linecap="round" stroke-linejoin="round"${p.muted ? ` opacity="${MUTED}"` : ''}/>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${els}</svg>`;
}
const BGS = [
  { name: 'Ivoire #F8F4EE', bg: '#F8F4EE', fg: '#804F3C', ink: '#6A5049' },
  { name: 'Rose poudré #F2DDD8', bg: '#F2DDD8', fg: '#804F3C', ink: '#6A5049' },
  { name: 'Bleu nuit #1F2344', bg: '#1F2344', fg: '#E7C08F', ink: '#CDB8C6' },
];
const sections = BGS.map((b) => {
  const groups = Object.entries(MATERNITY_ICON_GROUPS).map(([g, names]) => `
    <h3 style="color:${b.ink}">${g}</h3>
    <div class="grid">${names.map((nm) => `
      <div class="cell"><div class="row">${svg(nm, 20, b.fg)}${svg(nm, 32, b.fg)}${svg(nm, 64, b.fg)}${svg(nm, 32, b.fg, true)}</div>
      <div class="lbl" style="color:${b.ink}">${nm}</div></div>`).join('')}
    </div>`).join('');
  return `<section style="background:${b.bg}"><h2 style="color:${b.ink}">${b.name} — 20 · 32 · 64 px · actif 32 px</h2>${groups}</section>`;
}).join('');
fs.writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Planche pictogrammes</title>
<style>body{margin:0;font:12px system-ui,sans-serif}section{padding:14px 18px}h2{margin:0 0 6px;font-size:15px}h3{margin:8px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px 10px}.cell{padding:4px 0}.row{display:flex;align-items:center;gap:10px}.lbl{margin-top:2px;font-size:11px}</style>
<body>${sections}</body>`);
console.log(`Planche écrite : ${out} (${Object.keys(MATERNITY_ICONS).length} symboles)`);
