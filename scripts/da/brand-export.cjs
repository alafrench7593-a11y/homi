/**
 * Export de l'icône d'app « verre minéral » (inchangée) et planches des logos d'outils « verre dépoli + lumière par
 * public » (21/11/2026). Outil de présentation — hors application (aucune dépendance ajoutée : rendu PNG par le
 * Chromium de Playwright déjà présent, via scripts/da/render.py).
 *
 *   DA_LOGOS=<table.json> npx jest src/__tests__/toolLogos.test.tsx   (table id → plaque, public, symbole : le registre
 *                                                                     charge React Native, d'où le passage par Jest)
 *   node scripts/da/brand-export.cjs [dossier-de-planches] [--logos-only] [--png] [--table=<table.json>]
 *
 * Écrit :
 *  - assets/brand/homi-app-icon-{light,dark,tinted}.svg, assets/icon-ios-{light,dark,tinted}.png (sauf `--logos-only`)
 *  - <planches>/icon-sizes.html     l'icône dans le masque iOS aux tailles réelles
 *  - <planches>/tool-logos.html     les 134 outils (détaillé 60 + compact 40), fond crème et fond nuit
 *  - <planches>/tool-publics.html   légende : une icône par public en 120 / 60 / 40, couleurs et contrastes mesurés
 *    (`--png` : planches rendues aussi en PNG, échelle 2)
 */
require('./ts-require.cjs');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { appIconSvg } = require('../../src/brand/toolLogo/appIcon.ts');
const { APP_ICON_SIZES, squircleRadius } = require('../../src/brand/toolLogo/geometry.ts');
const { toolLogoSvg } = require('../../src/brand/toolLogo/svg.ts');
const { HOMI_ICONS } = require('../../src/brand/icons/paths.ts');
const { TOOL_ICON } = require('../../src/brand/icons/manifest.ts');
const { TOOL_SYMBOLS } = require('../../src/brand/toolGlass/symbols.ts');
const { logoShadow, lightContrast, bareContrast, litCenter, PUBLIC_LIGHT, LOGO_PUBLICS, TAB_LIGHT } = require('../../src/theme/toolLogo.ts');

const args = process.argv.slice(2);
const LOGOS_ONLY = args.includes('--logos-only');
const PNG = args.includes('--png');
const ROOT = path.resolve(__dirname, '..', '..');
const BOARDS = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(ROOT, '.da-boards'));
fs.mkdirSync(BOARDS, { recursive: true });
const render = (html, out, w, h, transparent = false, scale = 1) => {
  const f = path.join(BOARDS, `_${path.basename(out)}.html`);
  fs.writeFileSync(f, html);
  execFileSync('python3', [path.join(__dirname, 'render.py'), f, out, String(w), String(h), String(scale), transparent ? '1' : '0'], { stdio: 'inherit' });
  fs.unlinkSync(f);
};
const page = (body, bg = 'transparent') => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}body>svg{display:block}</style>${body}`;

// ---------------------------------------------------------------- icône d'app (inchangée par la revue des logos d'outils)
if (!LOGOS_ONLY) {
  for (const tone of ['light', 'dark', 'tinted']) {
    const svg = appIconSvg(tone);
    fs.writeFileSync(path.join(ROOT, 'assets', 'brand', `homi-app-icon-${tone}.svg`), `${svg}\n`);
    const png = path.join(ROOT, 'assets', `icon-ios-${tone}.png`);
    render(page(svg), png, 1024, 1024, tone === 'tinted');
    // App Store : icône claire et sombre SANS canal alpha (la teintée garde sa transparence)
    if (tone !== 'tinted') execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[1], optimize=True)', png]);
  }
}

// ---------------------------------------------------------------- l'icône aux tailles réelles, dans le masque iOS
const mask = (tone, px) => `<div style="width:${px}px;height:${px}px;border-radius:${(px * 0.2237).toFixed(1)}px;overflow:hidden;box-shadow:0 ${px > 100 ? 6 : 1}px ${px > 100 ? 18 : 3}px rgba(0,0,0,.28);flex:none">${appIconSvg(tone, px, `${tone}${px}`)}</div>`;
const row = (tone, bg, fg) => `<div style="display:flex;gap:28px;align-items:flex-end;padding:28px;background:${bg};color:${fg};font:12px system-ui">
${APP_ICON_SIZES.map((s) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">${mask(tone, s === 1024 ? 256 : s)}<span>${s === 1024 ? '1024 (¼)' : s}</span></div>`).join('')}
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${mask(tone, 60)}<span style="font:500 12px -apple-system,system-ui">HOMI</span></div></div>`;
fs.writeFileSync(path.join(BOARDS, 'icon-sizes.html'), page(`${row('light', '#E9E4F0', '#222')}${row('dark', '#141018', '#eee')}${row('light', 'linear-gradient(135deg,#3a6ea5,#e07a5f)', '#fff')}${row('tinted', '#0b0b0d', '#eee')}`, '#fff'));

// ---------------------------------------------------------------- logos d'outils (planches)
const tableArg = args.find((a) => a.startsWith('--table='));
const TABLE = JSON.parse(fs.readFileSync(tableArg ? tableArg.slice(8) : path.join(BOARDS, 'logos-table.json'), 'utf8'));
const PLATE = (cat) => {
  const f = cat === 'urgent' ? 'health' : cat === 'aura' ? 'account' : cat;
  return `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'assets', 'brand', 'tool-glass', 'glass', `${f}.png`)).toString('base64')}`;
};
const plates = {};
const plate = (cat) => (plates[cat] = plates[cat] || PLATE(cat));
let uid = 0;
/** Un logo tel que l'app le pose : plaque + lumière + symbole, ombre de la boîte (`logoShadow`). */
const logo = (id, mode, variant, px) => {
  const e = TABLE[id];
  const icon = HOMI_ICONS[e.icon];
  const l = { plateHref: plate(e.category), d: e.symbol ? TOOL_SYMBOLS[e.symbol] : icon.stroke, dots: e.symbol ? undefined : icon.dots, pub: e.public, variant, mode };
  const shadow = logoShadow(e.public, px, variant, mode);
  return `<div style="width:${px}px;height:${px}px;border-radius:${squircleRadius(px).toFixed(1)}px;flex:none;${shadow ? `box-shadow:${shadow}` : ''}">${toolLogoSvg(l, px, `u${uid++}`)}</div>`;
};
const PUB_FR = { woman: 'femme', baby: 'bébé', child: 'enfant', couple: 'couple', family: 'foyer / famille', neutral: 'communauté, compte', urgent: 'urgence', aura: 'Aura' };
const BG = { light: ['#FBF4F2', '#2A1621'], dark: ['#141018', '#F6ECEF'], night: ['#0E0D10', '#BDB8C2'] };
const css = '<style>.g{display:flex;flex-wrap:wrap;gap:16px 10px;padding:24px;font:9px system-ui}.c{width:92px;display:flex;flex-direction:column;align-items:center;gap:8px}.c span{max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dot{display:inline-block;width:8px;height:8px;border-radius:4px;margin-right:3px;vertical-align:-1px}</style>';
const ids = Object.keys(TOOL_ICON);
const cells = (mode) => ids.map((id) => `<div class="c">${logo(id, mode, 'detailed', 60)}${logo(id, mode, 'compact', 40)}<span><i class="dot" style="background:${PUBLIC_LIGHT[TABLE[id].public]}"></i>${id}</span></div>`).join('');
const legend = (mode) => `<div style="display:flex;flex-wrap:wrap;gap:6px 16px;padding:14px 24px 0;font:12px system-ui;background:${BG[mode][0]};color:${BG[mode][1]}">${LOGO_PUBLICS.map((p) => `<span><i class="dot" style="background:${PUBLIC_LIGHT[p]};width:12px;height:12px;border-radius:6px"></i>${PUB_FR[p]}</span>`).join('')}<span><i class="dot" style="background:${TAB_LIGHT.color};width:12px;height:12px;border-radius:6px"></i>barre d'onglets</span></div>`;
fs.writeFileSync(path.join(BOARDS, 'tool-logos.html'), page(`${css}${['light', 'dark'].map((m) => `${legend(m)}<div class="g" style="background:${BG[m][0]};color:${BG[m][1]}">${cells(m)}</div>`).join('')}`, '#fff'));

// légende : une icône par public (exemple réel du registre), en 120 / 60 / 40, dans les trois apparences
const SAMPLE = { woman: 'cycle_calendar', baby: 'baby_bottle', child: 'kid_school', couple: 'mental_load', family: 'family_calendar', neutral: 'settings', urgent: 'emergency', aura: 'ask' };
const pubRows = (mode) => `<div style="display:flex;flex-wrap:wrap;gap:26px 18px;padding:28px;background:${BG[mode][0]};color:${BG[mode][1]};font:11px system-ui">${LOGO_PUBLICS.map((p) => {
  const id = SAMPLE[p];
  if (TABLE[id].public !== p) throw new Error(`${id} n'est pas « ${p} »`);
  return `<div style="width:150px;display:flex;flex-direction:column;align-items:center;gap:14px">${logo(id, mode, 'detailed', 120)}
<div style="display:flex;gap:16px;align-items:center">${logo(id, mode, 'detailed', 60)}${logo(id, mode, 'compact', 40)}</div>
<b><i class="dot" style="background:${PUBLIC_LIGHT[p]}"></i>${PUB_FR[p]}</b><span style="opacity:.8;text-align:center">${id}<br>lumière ${PUBLIC_LIGHT[p]} · centre ${litCenter(p, mode)}<br>symbole / centre ${lightContrast(p, mode).toFixed(2)}:1 (plaque nue ${bareContrast().toFixed(2)}:1)</span></div>`;
}).join('')}</div>`;
fs.writeFileSync(path.join(BOARDS, 'tool-publics.html'), page(`${css}${pubRows('light')}${pubRows('dark')}${pubRows('night')}`, '#fff'));
if (PNG) {
  render(fs.readFileSync(path.join(BOARDS, 'tool-logos.html'), 'utf8'), path.join(BOARDS, 'tool-logos.png'), 1500, 1000, false, 2);
  render(fs.readFileSync(path.join(BOARDS, 'tool-publics.html'), 'utf8'), path.join(BOARDS, 'tool-publics.png'), 1400, 1000, false, 2);
}
console.log(`icône : ${LOGOS_ONLY ? 'non réécrite' : '3 tons'} · planches des ${ids.length} logos et des ${LOGO_PUBLICS.length} publics dans ${BOARDS}`);
