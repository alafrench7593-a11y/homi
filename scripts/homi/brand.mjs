#!/usr/bin/env node
/**
 * HOMI — générateur de la marque : une seule géométrie (maison + deux parents + deux enfants qui se tiennent la main),
 * déclinée en SVG (couleur, monochrome, tuile) et en PNG pour Expo (icône, Android adaptatif, splash, favicon).
 * Usage : node scripts/homi/brand.mjs            → écrit assets/brand/homi-*.svg et les PNG d'assets/
 *         node scripts/homi/brand.mjs --preview  → écrit aussi des aperçus 24/32/48/96 px dans assets/brand/preview/
 * Le dessin est original : il reprend l'idée de la référence (maison lumineuse, famille au centre) sans la copier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_BRAND = path.join(ROOT, 'assets/brand');
const OUT_ASSETS = path.join(ROOT, 'assets');

export const COLORS = {
  midnight: '#16112B',
  midnightHigh: '#2A1F52',
  plum: '#5B2A86',
  lilac: '#CDBEFA',
  lilacDeep: '#9C86E8',
  champagne: '#E9CFA4',
  pearl: '#F7F4FB',
};

/** Géométrie partagée, dans un carré de 256. Silhouettes identiques pour les deux parents (aucun stéréotype de genre). */
const HOUSE = 'M128 30 Q133 30 137 33 L216 98 Q224 105 224 116 L224 204 Q224 224 204 224 L52 224 Q32 224 32 204 L32 116 Q32 105 40 98 L119 33 Q123 30 128 30 Z';
const person = (cx, headY, headR, bodyW, bodyTop, bottom, legGap) => {
  const l = cx - bodyW / 2;
  const r = cx + bodyW / 2;
  const hip = bodyTop + (bottom - bodyTop) * 0.52;
  const rad = bodyW * 0.42;
  const g = legGap / 2;
  const bodyD = `M${l} ${bodyTop + rad} Q${l} ${bodyTop} ${l + rad} ${bodyTop} L${r - rad} ${bodyTop} Q${r} ${bodyTop} ${r} ${bodyTop + rad} L${r} ${hip} Q${r} ${hip + 4} ${r - 3} ${hip + 4} L${r - 3} ${bottom - 3} Q${r - 3} ${bottom} ${r - 6} ${bottom} L${cx + g + 2} ${bottom} Q${cx + g} ${bottom} ${cx + g} ${bottom - 3} L${cx + g} ${hip + 10} L${cx - g} ${hip + 10} L${cx - g} ${bottom - 3} Q${cx - g} ${bottom} ${cx - g - 2} ${bottom} L${l + 6} ${bottom} Q${l + 3} ${bottom} ${l + 3} ${bottom - 3} L${l + 3} ${hip + 4} Q${l} ${hip + 4} ${l} ${hip} Z`;
  return {
    head: `<circle cx="${cx}" cy="${headY}" r="${headR}"/>`,
    body: `<path d="${bodyD}"/>`,
    // Pièces détachées (animation du logo) : exactement les mêmes valeurs que le dessin ci-dessus
    parts: { cx, headY, headR, bodyD, top: headY - headR, bottom },
  };
};
const FAMILY = [
  person(80, 110, 16, 36, 132, 206, 6), // parent
  person(176, 106, 16, 36, 128, 206, 6), // parent
  person(113, 148, 12, 24, 166, 206, 4), // enfant
  person(143, 148, 12, 24, 166, 206, 4), // enfant
];
const FAMILY_ROLES = ['parent', 'parent', 'child', 'child'];

/** Longueur d'un tracé M/L/Q/Z (quadratiques échantillonnées) : sert au tracé progressif du contour (strokeDashoffset). */
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
const familyShapes = () => FAMILY.map((p) => p.head + p.body).join('');

const defs = `
  <linearGradient id="hm-house" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORS.midnightHigh}"/><stop offset="1" stop-color="${COLORS.midnight}"/></linearGradient>
  <linearGradient id="hm-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="${COLORS.lilac}"/><stop offset="1" stop-color="${COLORS.lilacDeep}"/></linearGradient>
  <linearGradient id="hm-fig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${COLORS.lilac}"/></linearGradient>
  <radialGradient id="hm-glow" cx="0.5" cy="0.42" r="0.6"><stop offset="0" stop-color="${COLORS.lilac}" stop-opacity="0.35"/><stop offset="1" stop-color="${COLORS.lilac}" stop-opacity="0"/></radialGradient>`;

/** Marque couleur, fond transparent. */
export function markSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="HOMI">
<defs>${defs}</defs>
<path d="${HOUSE}" fill="url(#hm-house)"/>
<path d="${HOUSE}" fill="url(#hm-glow)"/>
<path d="${HOUSE}" fill="none" stroke="url(#hm-edge)" stroke-width="9" stroke-linejoin="round"/>
<g fill="url(#hm-fig)">${familyShapes()}</g>
</svg>`;
}

/** Monochrome (currentColor) : contour de la maison + famille pleine ; lisible dès 24 px. */
export function monoSvg(color = 'currentColor') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="HOMI">
<path d="${HOUSE}" fill="none" stroke="${color}" stroke-width="14" stroke-linejoin="round"/>
<g fill="${color}">${familyShapes()}</g>
</svg>`;
}

/** Tuile d'icône d'application (fond nuit + halo), la marque occupe ~70 %. */
export function tileSvg(size = 1024, { scale = 0.7, background = true } = {}) {
  const s = (size * scale) / 256;
  const o = (size - 256 * s) / 2;
  const bg = background
    ? `<rect width="${size}" height="${size}" fill="url(#tile-bg)"/><circle cx="${size / 2}" cy="${size * 0.46}" r="${size * 0.42}" fill="url(#tile-halo)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
<defs>${defs}
  <linearGradient id="tile-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORS.midnightHigh}"/><stop offset="1" stop-color="${COLORS.midnight}"/></linearGradient>
  <radialGradient id="tile-halo"><stop offset="0" stop-color="${COLORS.lilacDeep}" stop-opacity="0.45"/><stop offset="1" stop-color="${COLORS.lilacDeep}" stop-opacity="0"/></radialGradient>
</defs>
${bg}
<g transform="translate(${o} ${o}) scale(${s})">${markSvg().replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/<defs>[\s\S]*?<\/defs>/, '')}</g>
</svg>`;
}

/** Module TypeScript de l'application : marque complète + pièces détachées du même dessin pour l'animation de lancement. */
export function markModule() {
  const parts = FAMILY.map((p, i) => ({ role: FAMILY_ROLES[i], ...p.parts }));
  return `/** Généré par scripts/homi/brand.mjs — ne pas modifier à la main. */
export const HOMI_MARK_SVG = ${JSON.stringify(markSvg())};
export const HOMI_MARK_MONO_SVG = ${JSON.stringify(monoSvg())};

/** Pièces détachées du même dessin (carré de 256) : animation du logo (maison tracée puis illuminée, puis silhouettes). */
export const HOMI_VIEWBOX = 256;
export const HOMI_HOUSE_PATH = ${JSON.stringify(HOUSE)};
/** Longueur du contour de la maison (unités du carré de 256) : strokeDasharray / strokeDashoffset. */
export const HOMI_HOUSE_LENGTH = ${pathLength(HOUSE)};
export const HOMI_HOUSE_STROKE = 9;
export type HomiFigure = { role: 'parent' | 'child'; cx: number; headY: number; headR: number; bodyD: string; top: number; bottom: number };
/** Ordre d'apparition : les deux parents, puis les deux enfants. */
export const HOMI_FAMILY: readonly HomiFigure[] = ${JSON.stringify(parts)};
export const HOMI_COLORS = ${JSON.stringify(COLORS)} as const;
`;
}

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toFile(file);

async function main() {
  fs.mkdirSync(OUT_BRAND, { recursive: true });
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-mark.svg'), markSvg());
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-mark-mono.svg'), monoSvg());
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-app-icon.svg'), tileSvg());
  // Source unique pour l'application : mêmes tracés que les fichiers SVG
  fs.writeFileSync(path.join(ROOT, 'src/brand/homiMarkSvg.ts'), markModule());

  await png(tileSvg(1024), 1024, path.join(OUT_ASSETS, 'icon.png'));
  await sharp(Buffer.from(tileSvg(1024)), { density: 384 }).resize(1024, 1024).flatten({ background: COLORS.midnight }).png().toFile(path.join(OUT_ASSETS, 'icon.png.tmp'));
  fs.renameSync(path.join(OUT_ASSETS, 'icon.png.tmp'), path.join(OUT_ASSETS, 'icon.png'));
  // Android adaptatif : zone sûre = 66 % du centre
  await png(tileSvg(1024, { scale: 0.58, background: false }), 1024, path.join(OUT_ASSETS, 'android-icon-foreground.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: COLORS.midnight } }).png().toFile(path.join(OUT_ASSETS, 'android-icon-background.png'));
  const mono = monoSvg('#FFFFFF');
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><g transform="translate(${(1024 - 256 * 2.3) / 2} ${(1024 - 256 * 2.3) / 2}) scale(2.3)">${mono.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g></svg>`, 1024, path.join(OUT_ASSETS, 'android-icon-monochrome.png'));
  await png(tileSvg(1024, { scale: 0.9, background: false }), 1024, path.join(OUT_ASSETS, 'splash-icon.png'));
  await sharp(Buffer.from(tileSvg(256, { scale: 0.86 })), { density: 384 }).resize(48, 48).flatten({ background: COLORS.midnight }).png().toFile(path.join(OUT_ASSETS, 'favicon.png'));

  if (process.argv.includes('--preview')) {
    const dir = path.join(OUT_BRAND, 'preview');
    fs.mkdirSync(dir, { recursive: true });
    for (const size of [24, 32, 48, 96]) {
      await png(tileSvg(256, { scale: 0.82 }), size, path.join(dir, `icon-${size}.png`));
      await sharp(Buffer.from(monoSvg('#1E1636')), { density: 384 }).resize(size, size).flatten({ background: '#F7F4FB' }).png().toFile(path.join(dir, `mono-${size}.png`));
    }
  }
  console.log('Marque HOMI générée.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
