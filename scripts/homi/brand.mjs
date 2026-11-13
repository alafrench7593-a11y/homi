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
  return {
    head: `<circle cx="${cx}" cy="${headY}" r="${headR}"/>`,
    body: `<path d="M${l} ${bodyTop + rad} Q${l} ${bodyTop} ${l + rad} ${bodyTop} L${r - rad} ${bodyTop} Q${r} ${bodyTop} ${r} ${bodyTop + rad} L${r} ${hip} Q${r} ${hip + 4} ${r - 3} ${hip + 4} L${r - 3} ${bottom - 3} Q${r - 3} ${bottom} ${r - 6} ${bottom} L${cx + g + 2} ${bottom} Q${cx + g} ${bottom} ${cx + g} ${bottom - 3} L${cx + g} ${hip + 10} L${cx - g} ${hip + 10} L${cx - g} ${bottom - 3} Q${cx - g} ${bottom} ${cx - g - 2} ${bottom} L${l + 6} ${bottom} Q${l + 3} ${bottom} ${l + 3} ${bottom - 3} L${l + 3} ${hip + 4} Q${l} ${hip + 4} ${l} ${hip} Z"/>`,
  };
};
const FAMILY = [
  person(80, 110, 16, 36, 132, 206, 6), // parent
  person(176, 106, 16, 36, 128, 206, 6), // parent
  person(113, 148, 12, 24, 166, 206, 4), // enfant
  person(143, 148, 12, 24, 166, 206, 4), // enfant
];
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

const png = (svg, size, file) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toFile(file);

async function main() {
  fs.mkdirSync(OUT_BRAND, { recursive: true });
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-mark.svg'), markSvg());
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-mark-mono.svg'), monoSvg());
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-app-icon.svg'), tileSvg());
  // Source unique pour l'application : mêmes tracés que les fichiers SVG
  fs.writeFileSync(path.join(ROOT, 'src/brand/homiMarkSvg.ts'), `/** Généré par scripts/homi/brand.mjs — ne pas modifier à la main. */\nexport const HOMI_MARK_SVG = ${JSON.stringify(markSvg())};\nexport const HOMI_MARK_MONO_SVG = ${JSON.stringify(monoSvg())};\n`);

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
