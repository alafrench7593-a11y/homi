#!/usr/bin/env node
/**
 * HOMI — générateur de la marque (v5, 14/11/2026) : retour au logo MAISON (décision du propriétaire ; le logotype
 * « lentille » v4 est abandonné). Une seule géométrie : maison violette aux contours lumineux, deux parents et deux
 * enfants au centre (silhouettes lavande / blanc ; parents identiques, aucun stéréotype de genre). Dessin d'origine
 * (v1–v3, 13/11/2026) inchangé ; seules les couleurs sont accordées aux fonds actuels (ivoire / obsidienne).
 *
 * Usage : node scripts/homi/brand.mjs            → SVG de assets/brand/, PNG d'Expo (assets/), src/brand/homiMarkSvg.ts
 *         node scripts/homi/brand.mjs --planche  → aussi la planche de lisibilité 16 → 1024 px (assets/brand/preview/)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_BRAND = path.join(ROOT, 'assets/brand');
const OUT_ASSETS = path.join(ROOT, 'assets');

// ------------------------------------------------------------------------------------------------ couleurs
/** Fonds de l'application (palette v3, src/theme) : la marque est accordée à ces deux fonds. */
export const BACKGROUNDS = { light: '#F1EEE7', dark: '#06090B' };

/**
 * Maison violette (dégradé vertical), lueur intérieure lavande, contour lumineux (blanc → lavande → violet clair),
 * silhouettes blanc → lavande. Clair : un liseré violet profond sous le contour garde la silhouette nette sur ivoire.
 */
export const COLORS = {
  light: {
    houseTop: '#7A52E6',
    houseBottom: '#3F2196',
    glow: '#D9CCFF',
    edge: ['#F4EFFF', '#C3B0FA', '#8C6FEA'],
    rim: '#2E1872',
    figTop: '#FFFFFF',
    figBottom: '#D9CCFF',
    halo: '#9C7BFF',
    name: '#2A1A66',
  },
  dark: {
    houseTop: '#7C55EA',
    houseBottom: '#3B1E8E',
    glow: '#DCD0FF',
    edge: ['#FFFFFF', '#D6C8FF', '#9F86F2'],
    rim: null,
    figTop: '#FFFFFF',
    figBottom: '#D6C8FF',
    halo: '#8F6BFF',
    name: '#F2EEFF',
  },
};

// ------------------------------------------------------------------------------------------------ géométrie
/** Dessin dans un carré de 256 (inchangé depuis v1). */
export const VIEWBOX = 256;
const HOUSE = 'M128 30 Q133 30 137 33 L216 98 Q224 105 224 116 L224 204 Q224 224 204 224 L52 224 Q32 224 32 204 L32 116 Q32 105 40 98 L119 33 Q123 30 128 30 Z';
/** Boîte de la maison (déploiement en panneau) : faîte, avant-toits, angles du bas. */
export const HOUSE_BOX = { x: 32, y: 30, width: 192, height: 194, eaveY: 105, cornerR: 20, eaveR: 10 };
const STROKE = 9;
const RIM = 13;
const MONO_STROKE = 14;

const person = (cx, headY, headR, bodyW, bodyTop, bottom, legGap) => {
  const l = cx - bodyW / 2;
  const r = cx + bodyW / 2;
  const hip = bodyTop + (bottom - bodyTop) * 0.52;
  const rad = bodyW * 0.42;
  const g = legGap / 2;
  const n = (v) => Math.round(v * 100) / 100;
  const bodyD = `M${l} ${n(bodyTop + rad)} Q${l} ${bodyTop} ${n(l + rad)} ${bodyTop} L${n(r - rad)} ${bodyTop} Q${r} ${bodyTop} ${r} ${n(bodyTop + rad)} L${r} ${n(hip)} Q${r} ${n(hip + 4)} ${r - 3} ${n(hip + 4)} L${r - 3} ${bottom - 3} Q${r - 3} ${bottom} ${r - 6} ${bottom} L${cx + g + 2} ${bottom} Q${cx + g} ${bottom} ${cx + g} ${bottom - 3} L${cx + g} ${n(hip + 10)} L${cx - g} ${n(hip + 10)} L${cx - g} ${bottom - 3} Q${cx - g} ${bottom} ${cx - g - 2} ${bottom} L${l + 6} ${bottom} Q${l + 3} ${bottom} ${l + 3} ${bottom - 3} L${l + 3} ${n(hip + 4)} Q${l} ${n(hip + 4)} ${l} ${n(hip)} Z`;
  return { cx, headY, headR, bodyD, top: headY - headR, bottom };
};
/** Ordre d'apparition (animation) : parent, parent, enfant, enfant. */
const FAMILY = [
  { role: 'parent', ...person(80, 110, 16, 36, 132, 206, 6) },
  { role: 'parent', ...person(176, 106, 16, 36, 128, 206, 6) },
  { role: 'child', ...person(113, 148, 12, 24, 166, 206, 4) },
  { role: 'child', ...person(143, 148, 12, 24, 166, 206, 4) },
];
const FAMILY_TOP = Math.min(...FAMILY.map((f) => f.top));
const FAMILY_BOTTOM = Math.max(...FAMILY.map((f) => f.bottom));
const figureShapes = () => FAMILY.map((f) => `<circle cx="${f.cx}" cy="${f.headY}" r="${f.headR}"/><path d="${f.bodyD}"/>`).join('');

/** Longueur d'un tracé M/L/Q/Z (quadratiques échantillonnées) : tracé progressif du contour (strokeDashoffset). */
export function pathLength(d) {
  const nums = (str) => str.trim().split(/[\s,]+/).filter(Boolean).map(Number);
  let len = 0;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  for (const [, cmd, args] of d.matchAll(/([MLQZ])([^MLQZ]*)/g)) {
    const a = nums(args);
    if (cmd === 'M') {
      [x, y] = a;
      sx = x;
      sy = y;
    } else if (cmd === 'L') {
      len += Math.hypot(a[0] - x, a[1] - y);
      [x, y] = a;
    } else if (cmd === 'Q') {
      let px = x;
      let py = y;
      for (let i = 1; i <= 64; i++) {
        const t = i / 64;
        const qx = (1 - t) ** 2 * x + 2 * (1 - t) * t * a[0] + t * t * a[2];
        const qy = (1 - t) ** 2 * y + 2 * (1 - t) * t * a[1] + t * t * a[3];
        len += Math.hypot(qx - px, qy - py);
        px = qx;
        py = qy;
      }
      [x, y] = [a[2], a[3]];
    } else {
      len += Math.hypot(sx - x, sy - y);
      x = sx;
      y = sy;
    }
  }
  return Math.round(len * 100) / 100;
}

// ------------------------------------------------------------------------------------------------ SVG
const idp = (tone) => `hm${tone[0]}`; // identifiants propres à chaque variante (le DOM web partage les <defs>)

function defsFor(tone) {
  const c = COLORS[tone];
  const p = idp(tone);
  return `<linearGradient id="${p}-house" gradientUnits="userSpaceOnUse" x1="0" y1="${HOUSE_BOX.y}" x2="0" y2="${HOUSE_BOX.y + HOUSE_BOX.height}"><stop offset="0" stop-color="${c.houseTop}"/><stop offset="1" stop-color="${c.houseBottom}"/></linearGradient>
<radialGradient id="${p}-glow" gradientUnits="userSpaceOnUse" cx="128" cy="138" r="118"><stop offset="0" stop-color="${c.glow}" stop-opacity="0.38"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="${p}-edge" gradientUnits="userSpaceOnUse" x1="32" y1="30" x2="224" y2="224"><stop offset="0" stop-color="${c.edge[0]}"/><stop offset="0.55" stop-color="${c.edge[1]}"/><stop offset="1" stop-color="${c.edge[2]}"/></linearGradient>
<linearGradient id="${p}-fig" gradientUnits="userSpaceOnUse" x1="0" y1="${FAMILY_TOP}" x2="0" y2="${FAMILY_BOTTOM}"><stop offset="0" stop-color="${c.figTop}"/><stop offset="1" stop-color="${c.figBottom}"/></linearGradient>`;
}

/** Calques du dessin, dans l'ordre (l'animation les reprend un à un : src/components/HomiLogoAnimated.tsx). */
function markInner(tone) {
  const c = COLORS[tone];
  const p = idp(tone);
  return [
    c.rim ? `<path d="${HOUSE}" fill="none" stroke="${c.rim}" stroke-width="${RIM}" stroke-linejoin="round"/>` : '',
    `<path d="${HOUSE}" fill="url(#${p}-house)"/>`,
    `<path d="${HOUSE}" fill="url(#${p}-glow)"/>`,
    `<path d="${HOUSE}" fill="none" stroke="url(#${p}-edge)" stroke-width="${STROKE}" stroke-linejoin="round"/>`,
    `<g fill="url(#${p}-fig)">${figureShapes()}</g>`,
  ].filter(Boolean).join('\n');
}

const head = (vb = `0 0 ${VIEWBOX} ${VIEWBOX}`) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="HOMI">`;

/** Marque couleur, fond transparent ; « light » pour fond ivoire, « dark » pour fond obsidienne. */
export function markSvg(tone = 'light') {
  if (tone === 'mono') return monoSvg();
  return `${head()}\n<defs>${defsFor(tone)}</defs>\n${markInner(tone)}\n</svg>`;
}

/** Monochrome (currentColor) : contour épais de la maison + famille pleine ; lisible dès 16 px. */
export function monoSvg(color = 'currentColor') {
  return `${head()}
<path d="${HOUSE}" fill="none" stroke="${color}" stroke-width="${MONO_STROKE}" stroke-linejoin="round"/>
<g fill="${color}">${figureShapes()}</g>
</svg>`;
}

/** Tuile d'icône : fond obsidienne, halo violet, la maison (version sombre) occupe `scale` du carré. */
export function tileSvg(size = 1024, { scale = 0.7, background = true, tone = 'dark' } = {}) {
  const s = (size * scale) / VIEWBOX;
  const o = (size - VIEWBOX * s) / 2;
  const c = COLORS[tone];
  const bg = background
    ? `<rect width="${size}" height="${size}" fill="url(#tile-bg)"/><circle cx="${size / 2}" cy="${size * 0.5}" r="${size * 0.46}" fill="url(#tile-halo)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="HOMI">
<defs>${defsFor(tone)}
<linearGradient id="tile-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151026"/><stop offset="1" stop-color="${BACKGROUNDS.dark}"/></linearGradient>
<radialGradient id="tile-halo"><stop offset="0" stop-color="${c.halo}" stop-opacity="0.5"/><stop offset="0.6" stop-color="${c.halo}" stop-opacity="0.12"/><stop offset="1" stop-color="${c.halo}" stop-opacity="0"/></radialGradient>
</defs>
${bg}
<g transform="translate(${Math.round(o * 100) / 100} ${Math.round(o * 100) / 100}) scale(${Math.round(s * 10000) / 10000})">${markInner(tone)}</g>
</svg>`;
}

// ------------------------------------------------------------------------------------------------ module de l'app
/** Module TypeScript : SVG complets + pièces détachées du MÊME dessin (test : src/__tests__/homiLogo.test.tsx). */
export function markModule() {
  const svgs = { light: markSvg('light'), dark: markSvg('dark'), mono: monoSvg() };
  return `/** Généré par scripts/homi/brand.mjs — ne pas modifier à la main. Logo HOMI v5 « maison » (14/11/2026). */
export type HomiTone = 'light' | 'dark' | 'mono';

/** SVG complets (identiques aux fichiers assets/brand/homi-mark-{light,dark,mono}.svg). */
export const HOMI_MARK_SVG: Record<HomiTone, string> = ${JSON.stringify(svgs, null, 1)};
/** Monochrome (currentColor) — alias historique. */
export const HOMI_MARK_MONO_SVG = HOMI_MARK_SVG.mono;

/** Pièces détachées du même dessin (carré de ${VIEWBOX}) : animation du logo (maison tracée, illuminée, silhouettes). */
export const HOMI_VIEWBOX = ${VIEWBOX};
export const HOMI_HOUSE_PATH = ${JSON.stringify(HOUSE)};
/** Longueur du contour de la maison (unités du carré) : strokeDasharray / strokeDashoffset. */
export const HOMI_HOUSE_LENGTH = ${pathLength(HOUSE)};
export const HOMI_HOUSE_STROKE = ${STROKE};
export const HOMI_HOUSE_RIM = ${RIM};
/** Boîte de la maison : faîte (y), avant-toits (eaveY), rayons des angles (bas, avant-toits). */
export const HOMI_HOUSE_BOX = ${JSON.stringify(HOUSE_BOX)} as const;
export type HomiFigure = { role: 'parent' | 'child'; cx: number; headY: number; headR: number; bodyD: string; top: number; bottom: number };
/** Ordre d'apparition : les deux parents, puis les deux enfants. */
export const HOMI_FAMILY: readonly HomiFigure[] = ${JSON.stringify(FAMILY)};
/** Boîte verticale de la famille (dégradé commun des silhouettes, espace utilisateur). */
export const HOMI_FAMILY_SPAN = { top: ${FAMILY_TOP}, bottom: ${FAMILY_BOTTOM} } as const;
export const HOMI_COLORS = ${JSON.stringify(COLORS, null, 1)} as const;
export const HOMI_BACKGROUNDS = ${JSON.stringify(BACKGROUNDS)} as const;
`;
}

// ------------------------------------------------------------------------------------------------ PNG
const raster = (svg, w, h = w, density = 384) => sharp(Buffer.from(svg), { density }).resize(Math.round(w), Math.round(h));
const png = (svg, size, file) => raster(svg, size).png().toFile(file);
const pad = (svg, ratio) => {
  // marge autour de la marque (écran de lancement) : viewBox élargie
  const m = (VIEWBOX * (ratio - 1)) / 2;
  return svg.replace(/viewBox="[^"]*"/, `viewBox="${-m} ${-m} ${VIEWBOX + 2 * m} ${VIEWBOX + 2 * m}"`);
};

async function writeExpoAssets() {
  await raster(tileSvg(1024), 1024).flatten({ background: BACKGROUNDS.dark }).png().toFile(path.join(OUT_ASSETS, 'icon.png'));
  // Android adaptatif : zone sûre = 66 % du centre → maison à 58 %
  await png(tileSvg(1024, { scale: 0.58, background: false }), 1024, path.join(OUT_ASSETS, 'android-icon-foreground.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: BACKGROUNDS.dark } }).png().toFile(path.join(OUT_ASSETS, 'android-icon-background.png'));
  await png(pad(monoSvg('#FFFFFF'), 1 / 0.56), 1024, path.join(OUT_ASSETS, 'android-icon-monochrome.png'));
  // Écran de lancement : la maison, claire sur ivoire, sombre sur obsidienne (fonds du thème)
  await png(pad(markSvg('light'), 1.12), 1024, path.join(OUT_ASSETS, 'splash-icon.png'));
  await png(pad(markSvg('dark'), 1.12), 1024, path.join(OUT_ASSETS, 'splash-icon-dark.png'));
  await raster(tileSvg(256, { scale: 0.86 }), 48).flatten({ background: BACKGROUNDS.dark }).png().toFile(path.join(OUT_ASSETS, 'favicon.png'));
}

/** Planche de lisibilité en tailles réelles (1 px = 1 px) : clair / sombre / monochrome / icône, 16 → 256, puis 1024. */
async function writePlanche() {
  const dir = path.join(OUT_BRAND, 'preview');
  fs.mkdirSync(dir, { recursive: true });
  const sizes = [16, 24, 32, 48, 64, 96, 128, 256];
  const rows = [
    { label: 'clair (ivoire)', bg: BACKGROUNDS.light, fg: '#4A5154', svg: () => markSvg('light') },
    { label: 'sombre (obsidienne)', bg: BACKGROUNDS.dark, fg: '#A9B3B4', svg: () => markSvg('dark') },
    { label: 'monochrome', bg: '#FFFFFF', fg: '#4A5154', svg: () => monoSvg('#13181A') },
    { label: 'icône', bg: '#E4E1DA', fg: '#4A5154', svg: () => tileSvg(1024) },
  ];
  const M0 = 24;
  const ROW_H = 256 + 64;
  const W = M0 * 2 + sizes.reduce((a, s) => a + s + 24, 0) + 140;
  const tiles = [];
  const texts = [];
  const txt = (x, y, str, size = 12, fill = '#4A5154', weight = 400) => texts.push(`<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${str}</text>`);
  txt(M0, 34, 'HOMI — logo maison, tailles réelles 16 → 256 px (puis icône 1024 px)', 20, '#13181A', 700);
  let y = 56;
  for (const r of rows) {
    tiles.push({ input: await sharp({ create: { width: W - M0 * 2, height: ROW_H - 12, channels: 4, background: r.bg } }).png().toBuffer(), left: M0, top: y });
    txt(M0 + 12, y + 20, r.label, 12, r.fg, 700);
    let x = M0 + 12;
    const base = y + 30 + 256;
    for (const s of sizes) {
      tiles.push({ input: await raster(r.svg(), s).png().toBuffer(), left: x, top: base - s });
      txt(x, base + 13, `${s}`, 10, r.fg);
      x += s + 24;
    }
    y += ROW_H;
  }
  const big = 1024;
  tiles.push({ input: await raster(tileSvg(1024), big).png().toBuffer(), left: M0, top: y + 8 });
  txt(M0 + big + 16, y + 30, 'icône 1024', 14, '#13181A', 700);
  const H = y + big + 32;
  const Wt = Math.max(W, M0 + big + 160);
  const base = sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wt}" height="${H}"><rect width="100%" height="100%" fill="#E4E1DA"/></svg>`));
  const over = { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wt}" height="${H}">${texts.join('')}</svg>`), left: 0, top: 0 };
  await base.composite([...tiles, over]).png().toFile(path.join(dir, 'planche-maison.png'));
}

async function main() {
  fs.mkdirSync(OUT_BRAND, { recursive: true });
  // logotype « lentille » v4 abandonné : ses fichiers ne sont plus générés
  for (const old of ['homi-wordmark-light.svg', 'homi-wordmark-dark.svg', 'homi-wordmark-mono.svg', 'homi-sign-light.svg', 'homi-sign-dark.svg', 'homi-sign-mono.svg']) {
    fs.rmSync(path.join(OUT_BRAND, old), { force: true });
  }
  fs.rmSync(path.join(OUT_BRAND, 'explorations'), { recursive: true, force: true });
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-mark.svg'), markSvg('light'));
  for (const t of ['light', 'dark', 'mono']) fs.writeFileSync(path.join(OUT_BRAND, `homi-mark-${t}.svg`), markSvg(t));
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-app-icon.svg'), tileSvg());
  fs.writeFileSync(path.join(ROOT, 'src/brand/homiMarkSvg.ts'), markModule());
  await writeExpoAssets();
  if (process.argv.includes('--planche')) await writePlanche();
  console.log('Marque HOMI générée.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
