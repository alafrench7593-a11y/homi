/**
 * Outil de présentation (hors application) — planche comparative de DEUX directions sur les mêmes éléments :
 * icône d'app, trois logos d'outils représentatifs (sommeil, allaitement, croissance) en grand / liste / 28 px,
 * accueil (données fictives), barre d'onglets, Aura. Rendu en clair et en sombre.
 *   A « Verre minéral » : plaques OPAQUES teintées par catégorie, glyphe blanc deux tons, lumière de verre commune.
 *   B « Verre clair »   : plaques claires translucides, glyphe coloré, perle colorée derrière le glyphe.
 * Usage : node scripts/da/directions.cjs <sortie.html>  (puis capture : scripts/da/render.py)
 */
require('./ts-require.cjs');
const fs = require('fs');
const { HOMI_ICONS } = require('../../src/brand/icons/paths.ts');
const { toolLogoSpec } = require('../../src/theme/toolLogo.ts');
const { toolLogoSvg } = require('../../src/brand/toolLogo/svg.ts');
const { squirclePath, glyphTransform } = require('../../src/brand/toolLogo/geometry.ts');
const { appIconSvg } = require('../../src/brand/toolLogo/appIcon.ts');
const { HOMI_SYMBOL_PATH } = require('../../src/brand/homiMarkSvg.ts');

const TOOLS = [['crib', 'sleep', 'Sommeil'], ['nursing', 'feeding', 'Allaitement'], ['stairs', 'care', 'Croissance']];
let uid = 0;
const A = (icon, cat, mode, size, variant = size >= 48 ? 'detailed' : 'compact') => toolLogoSvg(HOMI_ICONS[icon], toolLogoSpec(cat, mode), variant, size, `a${uid++}`);
function B(icon, cat, mode, size) {
  const s = toolLogoSpec(cat, mode); const d = HOMI_ICONS[icon]; const id = `b${uid++}`;
  const P = squirclePath();
  const plate = mode === 'light' ? '#FFFFFF' : '#2B2128';
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="${mode === 'light' ? 0.9 : 0.16}"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="${mode === 'light' ? 0.55 : 0.04}"/></linearGradient></defs>
<path d="${P}" fill="${plate}" fill-opacity="0.72"/><path d="${P}" fill="url(#${id})"/><circle cx="32" cy="33" r="15" fill="${s.mid}" fill-opacity="0.18"/>
<g transform="${glyphTransform('compact')}">${d.fill ? `<path d="${d.fill}" fill="${s.mid}" fill-opacity="0.3"/>` : ''}<path d="${d.stroke}" fill="none" stroke="${mode === 'light' ? s.mid : s.top}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g>
<path d="${P}" fill="none" stroke="${s.mid}" stroke-opacity="0.45" stroke-width="0.8"/></svg>`;
}
function iconB(mode) {
  const bg = mode === 'light' ? '#F6EDE8' : '#1A1217'; const ink = mode === 'light' ? '#1F1B1A' : '#F7F1E8';
  return `<svg viewBox="0 0 1024 1024" width="100%" height="100%"><rect width="1024" height="1024" fill="${bg}"/><path d="M-80 380 L380 -80 L560 -80 L-80 560Z" fill="#FFFFFF" fill-opacity="${mode === 'light' ? 0.5 : 0.07}"/>
<path transform="translate(340 270) scale(1.12)" d="${HOMI_SYMBOL_PATH}" fill="${ink}"/></svg>`;
}
const iconA = (mode) => appIconSvg(mode, 1024, 'i' + mode).replace(/width="1024" height="1024"/, 'width="100%" height="100%"');
const mask = (svg, px) => `<div style="width:${px}px;height:${px}px;border-radius:${px * 0.2237}px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.25)">${svg}</div>`;

function column(dir, mode) {
  const bg = mode === 'light' ? '#FBF4F2' : '#1A1217'; const fg = mode === 'light' ? '#2A1621' : '#F6ECEF'; const mut = mode === 'light' ? '#6E5562' : '#C2AFB8';
  const card = mode === 'light' ? '#FFFFFF' : '#241A20';
  const L = dir === 'A' ? A : B;
  const icon = dir === 'A' ? iconA(mode) : iconB(mode);
  const logos = TOOLS.map(([i, c, n]) => `<div class="cell">${L(i, c, mode, 64)}<div style="display:flex;gap:6px;align-items:end">${L(i, c, mode, 40)}${L(i, c, mode, 28)}</div><span>${n}</span></div>`).join('');
  const row = (i, c, title, sub) => `<div class="row" style="background:${card}">${L(i, c, mode, 40)}<div><b>${title}</b><br><small style="color:${mut}">${sub}</small></div></div>`;
  const glass = mode === 'light' ? 'rgba(255,255,255,.72)' : 'rgba(36,26,32,.82)';
  const tab = (lab, act) => `<div class="tab" style="font-weight:${act ? 800 : 500};color:${act ? fg : mut}">${act ? '●' : '○'}<br>${lab}</div>`;
  const aura = dir === 'A'
    ? `<div class="orb" style="background:radial-gradient(circle at 38% 32%,#fff 0 12%,#7A5CFF 38%,#4FC3D9 70%,#FF8A7A 100%);box-shadow:inset 0 2px 4px rgba(255,255,255,.7),inset 0 -6px 10px rgba(0,0,0,.25),0 6px 16px rgba(107,75,214,.45)"></div>`
    : `<div class="orb" style="background:${glass};border:1.5px solid #6B4BD6;box-shadow:inset 0 0 0 6px rgba(107,75,214,.12)"><div style="margin:18px auto;width:20px;height:20px;border-radius:50%;background:#6B4BD6;opacity:.6"></div></div>`;
  return `<section style="background:${bg};color:${fg}">
<h2>${dir === 'A' ? 'A — Verre minéral' : 'B — Verre clair'} · ${mode === 'light' ? 'clair' : 'sombre'}</h2>
<div class="icons">${[180, 60, 40].map((s) => mask(icon, s)).join('')}</div>
<div class="logos">${logos}</div>
<div class="home"><div style="font:800 26px Manrope,system-ui">Bonsoir, Camille</div><small style="color:${mut}">Vendredi 20 novembre · Lina, 8 mois</small>
${row('crib', 'sleep', 'Sieste en cours', 'Depuis 14 h 05 · 42 min')}${row('nursing', 'feeding', 'Dernière tétée', 'Sein gauche · il y a 1 h 10')}${row('stairs', 'care', 'Courbe de croissance', '7,9 kg · 68 cm')}</div>
<div class="bar" style="background:${glass};border:1px solid ${mode === 'light' ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.14)'}">${tab('Aujourd’hui', true)}${tab('Moi')}<div class="plus" style="background:${mode === 'light' ? '#3B1D2C' : '#FFA08A'};color:${mode === 'light' ? '#fff' : '#2A1621'}">+</div>${tab('Enfant')}${tab('Famille')}</div>
<div class="aura">${aura}<div><b>HOMI Aura</b><br><small style="color:${mut}">Je prépare une réponse…</small></div></div>
</section>`;
}

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;font:14px Manrope,system-ui,sans-serif;display:grid;grid-template-columns:repeat(4,390px);gap:0}
section{padding:18px;min-height:1100px;box-sizing:border-box}h2{font-size:15px;margin:0 0 14px}
.icons{display:flex;gap:16px;align-items:end;margin-bottom:18px}.logos{display:flex;gap:18px;margin-bottom:18px}
.cell{display:flex;flex-direction:column;gap:6px;align-items:center}.cell span{font-size:12px}
.home{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}.row{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:18px}
.bar{display:flex;align-items:center;justify-content:space-around;height:64px;border-radius:34px;backdrop-filter:blur(20px);margin-bottom:18px;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.tab{font-size:11px;text-align:center;width:60px}.plus{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;font-size:28px}
.aura{display:flex;gap:12px;align-items:center}.orb{width:56px;height:56px;border-radius:50%}
</style>${column('A', 'light')}${column('A', 'dark')}${column('B', 'light')}${column('B', 'dark')}`;
fs.writeFileSync(process.argv[2], html);
console.log('ok', process.argv[2]);
