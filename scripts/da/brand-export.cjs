/**
 * Export de l'icône d'app « verre minéral » et des logos d'outils (direction artistique Liquid Glass, 20/11/2026).
 * Outil de production des assets — hors application (aucune dépendance ajoutée : rendu PNG par le Chromium de
 * Playwright déjà présent, via scripts/da/render.py).
 *
 *   node scripts/da/brand-export.cjs [dossier-de-planches]
 *
 * Écrit :
 *  - assets/brand/homi-app-icon-{light,dark,tinted}.svg   sources vectorielles (module src/brand/toolLogo/appIcon.ts)
 *  - assets/icon-ios-{light,dark,tinted}.png              1024 × 1024, plein cadre (iOS applique son masque) → app.config.ts ios.icon
 *  - assets/brand/tool-logos/<id>.svg                     logo détaillé de chaque OUTIL du registre (sources éditables)
 *  - <planches>/icon-sizes.html                           l'icône dans le masque iOS aux tailles réelles 1024/180/120/87/60/40, fonds clair et sombre
 *  - <planches>/tool-logos.html                           planche de tous les logos (détaillé + compact), clair et sombre
 */
require('./ts-require.cjs');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { appIconSvg } = require('../../src/brand/toolLogo/appIcon.ts');
const { APP_ICON_SIZES } = require('../../src/brand/toolLogo/geometry.ts');
const { toolLogoSvg } = require('../../src/brand/toolLogo/svg.ts');
const { HOMI_ICONS } = require('../../src/brand/icons/paths.ts');
const { TOOL_ICON } = require('../../src/brand/icons/manifest.ts');
const { toolLogoSpec } = require('../../src/theme/toolLogo.ts');

const ROOT = path.resolve(__dirname, '..', '..');
const BOARDS = path.resolve(process.argv[2] || path.join(ROOT, '.da-boards'));
fs.mkdirSync(BOARDS, { recursive: true });
const render = (html, out, w, h, transparent = false) => {
  const f = path.join(BOARDS, `_${path.basename(out)}.html`);
  fs.writeFileSync(f, html);
  execFileSync('python3', [path.join(__dirname, 'render.py'), f, out, String(w), String(h), '1', transparent ? '1' : '0'], { stdio: 'inherit' });
  fs.unlinkSync(f);
};
const page = (body, bg = 'transparent') => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}body>svg{display:block}</style>${body}`;

// ---------------------------------------------------------------- icône d'app
for (const tone of ['light', 'dark', 'tinted']) {
  const svg = appIconSvg(tone);
  fs.writeFileSync(path.join(ROOT, 'assets', 'brand', `homi-app-icon-${tone}.svg`), `${svg}\n`);
  const png = path.join(ROOT, 'assets', `icon-ios-${tone}.png`);
  render(page(svg), png, 1024, 1024, tone === 'tinted');
  // App Store : icône claire et sombre SANS canal alpha (la teintée garde sa transparence)
  if (tone !== 'tinted') execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[1], optimize=True)', png]);
}

// ---------------------------------------------------------------- l'icône aux tailles réelles, dans le masque iOS
const mask = (tone, px) => `<div style="width:${px}px;height:${px}px;border-radius:${(px * 0.2237).toFixed(1)}px;overflow:hidden;box-shadow:0 ${px > 100 ? 6 : 1}px ${px > 100 ? 18 : 3}px rgba(0,0,0,.28);flex:none">${appIconSvg(tone, px, `${tone}${px}`)}</div>`;
const row = (tone, bg, fg) => `<div style="display:flex;gap:28px;align-items:flex-end;padding:28px;background:${bg};color:${fg};font:12px system-ui">
${APP_ICON_SIZES.map((s) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">${mask(tone, s === 1024 ? 256 : s)}<span>${s === 1024 ? '1024 (¼)' : s}</span></div>`).join('')}
<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${mask(tone, 60)}<span style="font:500 12px -apple-system,system-ui">HOMI</span></div></div>`;
fs.writeFileSync(path.join(BOARDS, 'icon-sizes.html'), page(`${row('light', '#E9E4F0', '#222')}${row('dark', '#141018', '#eee')}${row('light', 'linear-gradient(135deg,#3a6ea5,#e07a5f)', '#fff')}${row('tinted', '#0b0b0d', '#eee')}`, '#fff'));

// ---------------------------------------------------------------- logos d'outils (sources SVG + planche)
const out = path.join(ROOT, 'assets', 'brand', 'tool-logos');
fs.mkdirSync(out, { recursive: true });
const { resolveCategoryForExport } = (() => {
  // catégorie de chaque outil, lue dans le registre sans charger React Native : on parse les `{ id, category }`
  const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'journeys', 'tools.ts'), 'utf8');
  const map = {};
  for (const line of src.split('\n')) { const m = line.match(/\{ id: '([a-z0-9_]+)', category: '([a-z]+)'/); if (m) map[m[1]] = line.includes('urgent: true') ? 'urgent' : m[2]; }
  return { resolveCategoryForExport: (id) => map[id] };
})();
const AURA = new Set(['auraBubble', 'bubbleSpark', 'chip', 'bubbleSwap', 'compassSpark']);
const cells = { light: [], dark: [] };
let count = 0;
for (const [id, icon] of Object.entries(TOOL_ICON)) {
  let cat = resolveCategoryForExport(id) || 'account';
  if (AURA.has(icon)) cat = 'aura';
  const def = HOMI_ICONS[icon];
  fs.writeFileSync(path.join(out, `${id}.svg`), `${toolLogoSvg(def, toolLogoSpec(cat, 'light'), 'detailed', 64, 'l')}\n`);
  count++;
  for (const mode of ['light', 'dark']) {
    const spec = toolLogoSpec(cat, mode);
    cells[mode].push(`<div class="c">${toolLogoSvg(def, spec, 'detailed', 56, `${mode}d${count}`)}${toolLogoSvg(def, spec, 'compact', 32, `${mode}c${count}`)}<span>${id}</span></div>`);
  }
}
const css = '<style>.g{display:flex;flex-wrap:wrap;gap:10px;padding:20px;font:9px system-ui}.c{width:88px;display:flex;flex-direction:column;align-items:center;gap:3px}.c span{max-width:86px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>';
fs.writeFileSync(path.join(BOARDS, 'tool-logos.html'), page(`${css}<div class="g" style="background:#FBF4F2;color:#2A1621">${cells.light.join('')}</div><div class="g" style="background:#1A1217;color:#F6ECEF">${cells.dark.join('')}</div>`, '#fff'));
console.log(`icône : 3 tons · logos d'outils : ${count} sources SVG · planches dans ${BOARDS}`);
