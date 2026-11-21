/**
 * Export de l'icône d'app « verre minéral » et des logos d'outils « verre sombre » (direction artistique Liquid
 * Glass, 20/11/2026 ; logos d'outils revus le 21/11/2026). Outil de production des assets — hors application (aucune
 * dépendance ajoutée : rendu PNG par le Chromium de Playwright déjà présent, via scripts/da/render.py).
 *
 *   node scripts/da/brand-export.cjs [dossier-de-planches] [--logos-only] [--png]
 *
 * Écrit :
 *  - assets/brand/homi-app-icon-{light,dark,tinted}.svg   sources vectorielles (module src/brand/toolLogo/appIcon.ts)
 *  - assets/icon-ios-{light,dark,tinted}.png              1024 × 1024, plein cadre (iOS applique son masque) → app.config.ts ios.icon
 *    (`--logos-only` : l'icône d'app n'est PAS réécrite)
 *  - assets/brand/tool-logos/<id>.svg                     logo détaillé de chaque OUTIL du registre (sources éditables, plaque seule :
 *                                                         le halo est une ombre de la boîte, voir `logoShadow`)
 *  - <planches>/icon-sizes.html                           l'icône dans le masque iOS aux tailles réelles 1024/180/120/87/60/40, fonds clair et sombre
 *  - <planches>/tool-logos.html                           planche de tous les logos (détaillé avec halo + compact), fond crème et fond nuit
 *  - <planches>/tool-themes.html                          une icône par thème : en grand, 60 et 40 px, clair / sombre / nuit, contrastes mesurés
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
const { toolLogoSpec, logoShadow, glyphContrast, detailContrast, LOGO_HUES } = require('../../src/theme/toolLogo.ts');

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

// ---------------------------------------------------------------- logos d'outils (sources SVG + planches)
/** Un logo tel que l'app le pose : plaque SVG + ombres de la boîte (halo en détaillé seulement). */
let uid = 0;
const logo = (def, cat, mode, variant, px) => {
  const spec = toolLogoSpec(cat, mode);
  const shadow = logoShadow(spec, px, variant);
  return `<div style="width:${px}px;height:${px}px;border-radius:${squircleRadius(px).toFixed(1)}px;flex:none;${shadow ? `box-shadow:${shadow}` : ''}">${toolLogoSvg(def, spec, variant, px, `u${uid++}`)}</div>`;
};
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
const BG = { light: ['#FBF4F2', '#2A1621'], dark: ['#141018', '#F6ECEF'] };
const cells = { light: [], dark: [] };
const sample = {};
let count = 0;
for (const [id, icon] of Object.entries(TOOL_ICON)) {
  let cat = resolveCategoryForExport(id) || 'account';
  if (AURA.has(icon)) cat = 'aura';
  const def = HOMI_ICONS[icon];
  sample[cat] = sample[cat] || [id, icon];
  fs.writeFileSync(path.join(out, `${id}.svg`), `${toolLogoSvg(def, toolLogoSpec(cat, 'light'), 'detailed', 64, 'l')}\n`);
  count++;
  for (const mode of ['light', 'dark']) cells[mode].push(`<div class="c">${logo(def, cat, mode, 'detailed', 56)}${logo(def, cat, mode, 'compact', 32)}<span>${id}</span></div>`);
}
const css = '<style>.g{display:flex;flex-wrap:wrap;gap:14px 10px;padding:24px;font:9px system-ui}.c{width:92px;display:flex;flex-direction:column;align-items:center;gap:8px}.c span{max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>';
fs.writeFileSync(path.join(BOARDS, 'tool-logos.html'), page(`${css}<div class="g" style="background:${BG.light[0]};color:${BG.light[1]}">${cells.light.join('')}</div><div class="g" style="background:${BG.dark[0]};color:${BG.dark[1]}">${cells.dark.join('')}</div>`, '#fff'));

// une icône par thème : grand (détaillé 120), 60 (détaillé), 40 (compact), en clair, sombre et nuit
const FALLBACK = { couple: 'heart', aura: 'auraBubble', urgent: 'lifebuoy', community: 'people', account: 'gear' };
const themeRows = (mode) => {
  const [bg, fg] = mode === 'night' ? ['#0E0D10', '#BDB8C2'] : BG[mode];
  return `<div style="display:flex;flex-wrap:wrap;gap:26px 18px;padding:28px;background:${bg};color:${fg};font:11px system-ui">${Object.keys(LOGO_HUES).map((cat) => {
    const [id, icon] = sample[cat] || [cat, HOMI_ICONS[FALLBACK[cat]] ? FALLBACK[cat] : 'tools'];
    const def = HOMI_ICONS[icon];
    const s = toolLogoSpec(cat, mode);
    return `<div style="width:150px;display:flex;flex-direction:column;align-items:center;gap:14px">${logo(def, cat, mode, 'detailed', 120)}
<div style="display:flex;gap:16px;align-items:center">${logo(def, cat, mode, 'detailed', 60)}${logo(def, cat, mode, 'compact', 40)}</div>
<b>${cat}</b><span style="opacity:.8;text-align:center">${id}<br>verre ${s.mid} · lumière ${s.glow}<br>glyphe/plaque ${glyphContrast(cat, mode).toFixed(2)}:1 · détail ${detailContrast(cat, mode).toFixed(2)}:1</span></div>`;
  }).join('')}</div>`;
};
fs.writeFileSync(path.join(BOARDS, 'tool-themes.html'), page(`${themeRows('light')}${themeRows('dark')}${themeRows('night')}`, '#fff'));
if (PNG) {
  render(fs.readFileSync(path.join(BOARDS, 'tool-logos.html'), 'utf8'), path.join(BOARDS, 'tool-logos.png'), 1500, 1000, false, 2);
  render(fs.readFileSync(path.join(BOARDS, 'tool-themes.html'), 'utf8'), path.join(BOARDS, 'tool-themes.png'), 1180, 1000, false, 2);
}
console.log(`icône : ${LOGOS_ONLY ? 'non réécrite' : '3 tons'} · logos d'outils : ${count} sources SVG · planches dans ${BOARDS}`);
