#!/usr/bin/env node
/**
 * HOMI — générateur de la marque (v5 « encre », 16/11/2026). Décision de la propriétaire : le logo officiel est SON
 * dessin — un symbole « M » formé de deux personnes (l'une avec un chignon) et le mot-symbole « HOMI » arrondi (point
 * du i rond) —, en ENCRE sur fond clair, en IVOIRE sur fond sombre (même dessin). Le logo maison violet est retiré.
 *
 * Source unique : les tracés vectoriels fournis dans assets/brand/source-v5/ (utilisés TELS QUELS, jamais redessinés) :
 *   homi-symbole-encre.svg (symbole), homi-motsymbole-encre.svg (mot), homi-logo-encre.svg (assemblage officiel),
 *   homi-icone-monochrome.png (icône d'app de la propriétaire, encre sur ivoire rosé).
 * Ce script en tire :
 *   - src/brand/homiMarkSvg.ts : SVG complets (symbole, mot-symbole, logo ; encre / ivoire / mono `currentColor`) et
 *     pièces détachées du même dessin (têtes, corps, lettres, point du i) pour le logo animé ;
 *   - assets/brand/homi-{symbole,motsymbole,logo}-{encre,ivoire,mono}.svg et homi-app-icon.svg ;
 *   - les PNG d'Expo : icon.png, android-icon-{foreground,background,monochrome}.png, splash-icon(-dark).png, favicon.png.
 *
 * Usage : node scripts/homi/brand.mjs            → tout ce qui précède
 *         node scripts/homi/brand.mjs --planche  → aussi la planche de lisibilité 16 → 1024 px (assets/brand/preview/)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'assets/brand/source-v5');
const OUT_BRAND = path.join(ROOT, 'assets/brand');
const OUT_ASSETS = path.join(ROOT, 'assets');

// ------------------------------------------------------------------------------------------------ couleurs
/** Encre (fond clair) et ivoire (fond sombre) : les deux seules couleurs du logo. */
export const INK = { light: '#1F1B1A', dark: '#F7F1E8' };
/** Fond de l'icône d'app (ivoire rosé de l'icône de la propriétaire). */
export const ICON_BG = '#EFE2DA';
/** Fonds de l'application (design system v5 « Lumière corail », src/theme/tokens.ts) : écran de lancement. */
export const BACKGROUNDS = { light: '#FBF4F2', dark: '#1A1217' };

// ------------------------------------------------------------------------------------------------ lecture des sources
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const pathsOf = (svg) => [...svg.matchAll(/<path\b([^>]*)>/g)].map((m) => ({
  d: /\sd="([^"]*)"/.exec(m[1])[1],
  id: /\sid="([^"]*)"/.exec(m[1])?.[1] ?? null,
  transform: /\stransform="([^"]*)"/.exec(m[1])?.[1] ?? null,
}));
const viewBoxOf = (svg) => /viewBox="([^"]*)"/.exec(svg)[1].trim().split(/\s+/).map(Number);
const subpaths = (d) => d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);

const SYMBOL_D = pathsOf(read('homi-symbole-encre.svg'))[0].d;
const WORD_D = pathsOf(read('homi-motsymbole-encre.svg'))[0].d;
const LOGO_SRC = read('homi-logo-encre.svg');
const LOGO_PATHS = pathsOf(LOGO_SRC);
const lockSym = LOGO_PATHS.find((p) => p.id === 'symbole');
const lockWord = LOGO_PATHS.find((p) => p.id === 'mot-symbole');
if (lockSym.d !== SYMBOL_D || lockWord.d !== WORD_D) throw new Error('Sources v5 incohérentes : le logo complet ne reprend pas exactement le symbole et le mot-symbole.');
const num = (re, s, i = 1) => Number(re.exec(s)[i]);
/** Assemblage officiel (homi-logo-encre.svg) : symbole mis à l'échelle, mot décalé. */
export const LOCKUP = {
  viewBox: viewBoxOf(LOGO_SRC),
  symbol: { x: num(/translate\(([-\d.]+)/, lockSym.transform), y: num(/translate\([-\d.]+\s+([-\d.]+)/, lockSym.transform), scale: num(/scale\(([-\d.]+)/, lockSym.transform) },
  word: { x: num(/translate\(([-\d.]+)/, lockWord.transform), y: num(/translate\([-\d.]+\s+([-\d.]+)/, lockWord.transform) },
};
const SYMBOL_VB = viewBoxOf(read('homi-symbole-encre.svg'));
const WORD_VB = viewBoxOf(read('homi-motsymbole-encre.svg'));

// ------------------------------------------------------------------------------------------------ géométrie
/** Boîte englobante d'un tracé M/L/C/Z absolu (cubiques échantillonnées). */
export function bbox(d) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  let cx = 0; let cy = 0;
  for (const [, cmd, args] of d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const a = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === 'M' || cmd === 'L') { for (let i = 0; i < a.length; i += 2) { cx = a[i]; cy = a[i + 1]; add(cx, cy); } }
    else if (cmd === 'C') {
      for (let i = 0; i < a.length; i += 6) {
        for (let k = 1; k <= 24; k++) {
          const t = k / 24; const u = 1 - t;
          add(u ** 3 * cx + 3 * u * u * t * a[i] + 3 * u * t * t * a[i + 2] + t ** 3 * a[i + 4], u ** 3 * cy + 3 * u * u * t * a[i + 1] + 3 * u * t * t * a[i + 3] + t ** 3 * a[i + 5]);
        }
        cx = a[i + 4]; cy = a[i + 5];
      }
    }
  }
  const r = (v) => Math.round(v * 100) / 100;
  return { x: r(x0), y: r(y0), width: r(x1 - x0), height: r(y1 - y0) };
}
const r2 = (v) => Math.round(v * 100) / 100;
const inLockup = (b, t) => ({ x: r2(t.x + b.x * (t.scale ?? 1)), y: r2(t.y + b.y * (t.scale ?? 1)), width: r2(b.width * (t.scale ?? 1)), height: r2(b.height * (t.scale ?? 1)) });

/** Pièces du symbole (ordre des sous-tracés de la source) : tête au chignon, seconde tête, corps en « M ». */
const [HEAD_A, HEAD_B, BODY] = subpaths(SYMBOL_D);
/** Pièces du mot : point du i, puis H, O (deux contours), M, jambage du i. */
const WORD_SUB = subpaths(WORD_D);
const DOT = WORD_SUB[0];
const LETTERS = WORD_SUB.slice(1).join('');
if (subpaths(SYMBOL_D).length !== 3 || WORD_SUB.length !== 6) throw new Error('Structure inattendue des sources v5.');

export const PARTS = {
  headA: { d: HEAD_A, box: inLockup(bbox(HEAD_A), LOCKUP.symbol) },
  headB: { d: HEAD_B, box: inLockup(bbox(HEAD_B), LOCKUP.symbol) },
  body: { d: BODY, box: inLockup(bbox(BODY), LOCKUP.symbol) },
  letters: { d: LETTERS, box: inLockup(bbox(LETTERS), LOCKUP.word) },
  dot: { d: DOT, box: inLockup(bbox(DOT), LOCKUP.word) },
};
/** Boîte du symbole dans l'assemblage (unités du logo complet). */
const SYMBOL_BOX = inLockup(bbox(SYMBOL_D), LOCKUP.symbol);

// ------------------------------------------------------------------------------------------------ SVG
const vb = (a) => a.join(' ');
const head = (viewBox, label = 'HOMI') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(viewBox)}" role="img" aria-label="${label}">`;
const fillOf = (tone) => (tone === 'mono' ? 'currentColor' : INK[tone]);
export const symbolSvg = (tone = 'light') => `${head(SYMBOL_VB)}<path fill="${fillOf(tone)}" d="${SYMBOL_D}"/></svg>`;
export const wordSvg = (tone = 'light') => `${head(WORD_VB)}<path fill="${fillOf(tone)}" d="${WORD_D}"/></svg>`;
const lockupInner = () => `<path transform="translate(${LOCKUP.symbol.x} ${LOCKUP.symbol.y}) scale(${LOCKUP.symbol.scale})" d="${SYMBOL_D}"/><path transform="translate(${LOCKUP.word.x} ${LOCKUP.word.y})" d="${WORD_D}"/>`;
export const logoSvg = (tone = 'light') => `${head(LOCKUP.viewBox)}<g fill="${fillOf(tone)}">${lockupInner()}</g></svg>`;

/** Tuile d'icône : symbole encre centré sur l'ivoire rosé, même rendu que homi-icone-monochrome.png (70 % de la hauteur). */
const ICON = { height: 0.7, cx: 0.4966, cy: 0.4785 };
export function tileSvg(size = 1024, { height = ICON.height, background = true, color = INK.light } = {}) {
  const b = bbox(SYMBOL_D);
  const s = (size * height) / b.height;
  const tx = size * ICON.cx - (b.x + b.width / 2) * s;
  const ty = size * (background ? ICON.cy : 0.5) - (b.y + b.height / 2) * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="HOMI">${background ? `<rect width="${size}" height="${size}" fill="${ICON_BG}"/>` : ''}<path transform="translate(${r2(tx)} ${r2(ty)}) scale(${Math.round(s * 10000) / 10000})" fill="${color}" d="${SYMBOL_D}"/></svg>`;
}

// ------------------------------------------------------------------------------------------------ module de l'app
const TONES = ['light', 'dark', 'mono'];
const byTone = (f) => Object.fromEntries(TONES.map((t) => [t, f(t)]));
export function markModule() {
  const svg = { symbol: byTone(symbolSvg), word: byTone(wordSvg), logo: byTone(logoSvg) };
  return `/** Généré par scripts/homi/brand.mjs depuis assets/brand/source-v5/ — ne pas modifier à la main. Logo HOMI v5 « encre » (16/11/2026). */
export type HomiTone = 'light' | 'dark' | 'mono';
export type HomiArt = 'symbol' | 'word' | 'logo';

/**
 * SVG complets (identiques aux fichiers assets/brand/homi-{symbole,motsymbole,logo}-{encre,ivoire,mono}.svg) :
 * light = encre (fond clair), dark = ivoire (fond sombre), mono = currentColor.
 */
export const HOMI_SVG: Record<HomiArt, Record<HomiTone, string>> = ${JSON.stringify(svg, null, 1)};
/** Le symbole « M » (alias historique : la « marque »). */
export const HOMI_MARK_SVG = HOMI_SVG.symbol;
export const HOMI_MARK_MONO_SVG = HOMI_SVG.symbol.mono;

/** Encre (fond clair) / ivoire (fond sombre) : les deux seules couleurs du logo. */
export const HOMI_INK = ${JSON.stringify(INK)} as const;
export const HOMI_ICON_BG = ${JSON.stringify(ICON_BG)};
export const HOMI_BACKGROUNDS = ${JSON.stringify(BACKGROUNDS)} as const;

/** Cadres (viewBox) : symbole seul, mot seul, assemblage officiel (logo complet). */
export const HOMI_SYMBOL_VIEWBOX = ${JSON.stringify(SYMBOL_VB)} as const;
export const HOMI_WORD_VIEWBOX = ${JSON.stringify(WORD_VB)} as const;
export const HOMI_LOCKUP = ${JSON.stringify(LOCKUP)} as const;
export const HOMI_SYMBOL_PATH = ${JSON.stringify(SYMBOL_D)};
export const HOMI_WORD_PATH = ${JSON.stringify(WORD_D)};
/** Boîte du symbole dans l'assemblage (unités du logo complet) : départ du panneau du logo animé. */
export const HOMI_SYMBOL_BOX = ${JSON.stringify(SYMBOL_BOX)} as const;

export type HomiPart = { d: string; box: { x: number; y: number; width: number; height: number } };
/**
 * Pièces détachées du MÊME dessin (sous-tracés de la source, boîtes en unités du logo complet) pour le logo animé :
 * headA = tête au chignon, headB = seconde tête, body = corps en « M » (symbole, transform \`HOMI_LOCKUP.symbol\`) ;
 * letters = H, O, M et jambage du i, dot = point du i (mot, transform \`HOMI_LOCKUP.word\`).
 */
export const HOMI_PARTS: Record<'headA' | 'headB' | 'body' | 'letters' | 'dot', HomiPart> = ${JSON.stringify(PARTS, null, 1)};
`;
}

// ------------------------------------------------------------------------------------------------ PNG
const raster = (svg, w, h = w, density = 300) => sharp(Buffer.from(svg), { density }).resize(Math.round(w), Math.round(h));
/** Symbole seul au centre d'un carré transparent, `height` = part de la hauteur. */
const centered = (color, height) => tileSvg(1024, { height, background: false, color });

async function writeExpoAssets() {
  // Icône iOS / principale : l'icône de la propriétaire, telle quelle (encre sur ivoire rosé, sans transparence)
  await sharp(path.join(SRC, 'homi-icone-monochrome.png')).resize(1024, 1024).removeAlpha().png().toFile(path.join(OUT_ASSETS, 'icon.png'));
  // Android adaptatif : zone sûre = disque de 66 % → symbole à 50 % de la hauteur
  await raster(centered(INK.light, 0.5), 1024).png().toFile(path.join(OUT_ASSETS, 'android-icon-foreground.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: ICON_BG } }).png().toFile(path.join(OUT_ASSETS, 'android-icon-background.png'));
  await raster(centered('#FFFFFF', 0.5), 1024).png().toFile(path.join(OUT_ASSETS, 'android-icon-monochrome.png'));
  // Écran de lancement : le symbole, encre sur ivoire rosé, ivoire sur prune-anthracite
  await raster(centered(INK.light, 0.62), 1024).png().toFile(path.join(OUT_ASSETS, 'splash-icon.png'));
  await raster(centered(INK.dark, 0.62), 1024).png().toFile(path.join(OUT_ASSETS, 'splash-icon-dark.png'));
  await raster(tileSvg(256), 48).flatten({ background: ICON_BG }).png().toFile(path.join(OUT_ASSETS, 'favicon.png'));
}

/** Planche de lisibilité en tailles réelles (1 px = 1 px) : symbole et logo, encre / ivoire / mono, 16 → 256 px. */
async function writePlanche() {
  const dir = path.join(OUT_BRAND, 'preview');
  fs.mkdirSync(dir, { recursive: true });
  const sizes = [16, 24, 32, 48, 64, 96, 128, 256];
  const rows = [
    { label: 'symbole encre (fond clair)', bg: BACKGROUNDS.light, fg: '#5A4A4A', svg: symbolSvg('light') },
    { label: 'symbole ivoire (fond sombre)', bg: BACKGROUNDS.dark, fg: '#BBAEAE', svg: symbolSvg('dark') },
    { label: 'logo encre', bg: BACKGROUNDS.light, fg: '#5A4A4A', svg: logoSvg('light') },
    { label: 'logo ivoire', bg: BACKGROUNDS.dark, fg: '#BBAEAE', svg: logoSvg('dark') },
  ];
  const ratio = (s) => { const v = viewBoxOf(s); return v[2] / v[3]; };
  const M0 = 24;
  const ROW_H = 256 + 64;
  const W = 2400;
  const tiles = [];
  const texts = [];
  const txt = (x, y, str, size = 12, fill = '#4A4040', weight = 400) => texts.push(`<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${str}</text>`);
  txt(M0, 34, 'HOMI v5 — symbole et logo, hauteurs réelles 16 → 256 px', 20, '#1F1B1A', 700);
  let y = 56;
  for (const row of rows) {
    tiles.push({ input: await sharp({ create: { width: W - M0 * 2, height: ROW_H - 12, channels: 4, background: row.bg } }).png().toBuffer(), left: M0, top: y });
    txt(M0 + 12, y + 20, row.label, 12, row.fg, 700);
    let x = M0 + 12;
    const base = y + 30 + 256;
    for (const s of sizes) {
      const w = Math.round(s * ratio(row.svg));
      if (x + w > W - M0 * 2) break;
      tiles.push({ input: await raster(row.svg, w, s).png().toBuffer(), left: x, top: base - s });
      txt(x, base + 13, `${s}`, 10, row.fg);
      x += w + 24;
    }
    y += ROW_H;
  }
  tiles.push({ input: await sharp(path.join(OUT_ASSETS, 'icon.png')).png().toBuffer(), left: M0, top: y + 8 });
  txt(M0 + 1040, y + 30, 'icône 1024', 14, '#1F1B1A', 700);
  const H = y + 1024 + 32;
  const base = sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#E9E1DC"/></svg>`));
  const over = { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${texts.join('')}</svg>`), left: 0, top: 0 };
  await base.composite([...tiles, over]).png().toFile(path.join(dir, 'planche-v5.png'));
}

async function main() {
  fs.mkdirSync(OUT_BRAND, { recursive: true });
  // anciennes sources « maison » violette (v5 du 14/11) et logotype « lentille » (v4) : retirées
  for (const old of ['homi-mark.svg', 'homi-mark-light.svg', 'homi-mark-dark.svg', 'homi-mark-mono.svg',
    'homi-wordmark-light.svg', 'homi-wordmark-dark.svg', 'homi-wordmark-mono.svg', 'homi-sign-light.svg', 'homi-sign-dark.svg', 'homi-sign-mono.svg']) {
    fs.rmSync(path.join(OUT_BRAND, old), { force: true });
  }
  fs.rmSync(path.join(OUT_BRAND, 'explorations'), { recursive: true, force: true });
  fs.rmSync(path.join(OUT_BRAND, 'preview', 'planche-maison.png'), { force: true });
  const NAMES = { light: 'encre', dark: 'ivoire', mono: 'mono' };
  for (const t of TONES) {
    fs.writeFileSync(path.join(OUT_BRAND, `homi-symbole-${NAMES[t]}.svg`), symbolSvg(t));
    fs.writeFileSync(path.join(OUT_BRAND, `homi-motsymbole-${NAMES[t]}.svg`), wordSvg(t));
    fs.writeFileSync(path.join(OUT_BRAND, `homi-logo-${NAMES[t]}.svg`), logoSvg(t));
  }
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-app-icon.svg'), tileSvg());
  fs.writeFileSync(path.join(ROOT, 'src/brand/homiMarkSvg.ts'), markModule());
  await writeExpoAssets();
  if (process.argv.includes('--planche')) await writePlanche();
  console.log('Marque HOMI générée.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
