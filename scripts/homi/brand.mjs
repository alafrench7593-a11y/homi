#!/usr/bin/env node
/**
 * HOMI — générateur de la marque (v4, 14/11/2026) : LOGOTYPE « lentille ».
 * Source unique des tracés : les quatre lettres H · O · M · I sont DESSINÉES ici (polygones construits aux angles
 * arrondis, cercles, croissant) — aucune police n'est rendue, le logo est identique sur iOS, Android, web et en PNG.
 * Le O est une lentille de verre : un reflet (croissant, en haut à gauche) capte la lumière, une caustique (en bas à
 * droite) la transmet au reste du mot (lueur portée sur le M et le I).
 *
 * Usage : node scripts/homi/brand.mjs                → SVG de assets/brand/, PNG d'Expo (assets/), src/brand/homiMarkSvg.ts
 *         node scripts/homi/brand.mjs --explorations → aussi les deux pistes (assets/brand/explorations/) + planche PNG
 *                                                       + mesures de lisibilité en petit format (explorations/mesures.json)
 *         node scripts/homi/brand.mjs --preview      → aussi les aperçus d'icône 24/48/1024 (assets/brand/preview/)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_BRAND = path.join(ROOT, 'assets/brand');
const OUT_ASSETS = path.join(ROOT, 'assets');

// ------------------------------------------------------------------------------------------------ géométrie de base
const r2 = (n) => Math.round(n * 100) / 100;
const pt = (x, y) => `${r2(x)} ${r2(y)}`;

/**
 * Polygone aux angles arrondis (quadratiques) : chaque sommet [x, y, rayon]. Sens horaire attendu (remplissage nonzero).
 * Le rayon est borné à 45 % des arêtes adjacentes : jamais de recouvrement.
 */
export function roundedPolygon(points) {
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y, r] = points[i];
    const [px, py] = points[(i - 1 + n) % n];
    const [nx, ny] = points[(i + 1) % n];
    const lp = Math.hypot(px - x, py - y);
    const ln = Math.hypot(nx - x, ny - y);
    const k = Math.min(r || 0, lp * 0.45, ln * 0.45);
    const ax = x + ((px - x) / lp) * k;
    const ay = y + ((py - y) / lp) * k;
    const bx = x + ((nx - x) / ln) * k;
    const by = y + ((ny - y) / ln) * k;
    d += `${i === 0 ? 'M' : 'L'}${pt(ax, ay)} ${k > 0 ? `Q${pt(x, y)} ${pt(bx, by)}` : ''}`;
  }
  return `${d.replace(/\s+$/, '')}Z`;
}

/** Cercle en deux arcs (sens horaire par défaut, `ccw` pour un évidement). */
export function circlePath(cx, cy, r, ccw = false) {
  const s = ccw ? 0 : 1;
  return `M${pt(cx - r, cy)}A${r2(r)} ${r2(r)} 0 1 ${s} ${pt(cx + r, cy)}A${r2(r)} ${r2(r)} 0 1 ${s} ${pt(cx - r, cy)}Z`;
}

/**
 * Croissant de reflet, intérieur au disque (cx, cy) : bord extérieur = cercle de rayon `ra` (concentrique), bord
 * intérieur = cercle plus grand décalé vers l'opposé de `dir` (radians). `w` : épaisseur maximale (au milieu, dans
 * la direction `dir`) ; `half` : demi-ouverture angulaire (radians) — les deux pointes sont à dir ± half.
 */
export function crescentPath(cx, cy, ra, w, dir, half) {
  const t = (2 * ra * w - w * w) / (ra - 2 * w); // décalage du cercle intérieur (résolu pour des pointes à ± half)
  const rb = ra - w + t;
  const p = [cx + ra * Math.cos(dir - half), cy + ra * Math.sin(dir - half)];
  const q = [cx + ra * Math.cos(dir + half), cy + ra * Math.sin(dir + half)];
  // arc extérieur de p à q (petit arc, sens horaire), puis arc intérieur qui revient (sens antihoraire)
  return `M${pt(...p)}A${r2(ra)} ${r2(ra)} 0 0 1 ${pt(...q)}A${r2(rb)} ${r2(rb)} 0 0 0 ${pt(...p)}Z`;
}

// ------------------------------------------------------------------------------------------------ piste 1 : lentille
/** Mot-symbole : boîte 360 × 120, capitales de 100 (y 10 → 110), fût de 20. */
export const WORD = { width: 360, height: 120, cap: [10, 110], stem: 20 };
const CV = 3.2; // rayon des angles saillants
const CC = 1.6; // rayon des angles rentrants

/** H : deux fûts et une traverse, un seul contour. x 10 → 88. */
const H_D = roundedPolygon([
  [10, 10, CV], [30, 10, CV], [30, 51, CC], [68, 51, CC], [68, 10, CV], [88, 10, CV],
  [88, 110, CV], [68, 110, CV], [68, 69, CC], [30, 69, CC], [30, 110, CV], [10, 110, CV],
]);
/** M : fûts droits, diagonales qui se rejoignent aux deux tiers (pointe arrondie). x 220 → 312. */
const M_D = roundedPolygon([
  [220, 110, CV], [220, 10, CV], [242, 10, CV], [266, 70, CC], [290, 10, CV], [312, 10, CV],
  [312, 110, CV], [292, 110, CV], [292, 50, CC], [275, 94, CV], [257, 94, CV], [240, 50, CC], [240, 110, CV],
]);
/** I : un fût. x 330 → 350. */
const I_D = roundedPolygon([[330, 10, CV], [350, 10, CV], [350, 110, CV], [330, 110, CV]]);

/**
 * O = lentille de verre sertie : anneau (même graisse optique que les fûts) + verre dans la contreforme.
 * Le O reste un O (contreforme lisible) ; le verre et son reflet en font une lentille.
 */
export const LENS = { cx: 154, cy: 60, r: 52, inner: 31 };
const RING_D = `${circlePath(LENS.cx, LENS.cy, LENS.r)}${circlePath(LENS.cx, LENS.cy, LENS.inner, true)}`;
/** Verre : déborde d'une unité sous l'anneau (aucun liseré de fond à l'anticrénelage). */
const GLASS_D = circlePath(LENS.cx, LENS.cy, LENS.inner + 1);
const UP_LEFT = (-3 * Math.PI) / 4;
/** Reflet capté : croissant en haut à gauche, dans le verre (plein en monochrome). */
const GLINT_D = crescentPath(LENS.cx, LENS.cy, LENS.inner - 7, 9, UP_LEFT, (64 * Math.PI) / 180);
/** Caustique (lumière transmise) : croissant en bas à droite, côté du M (couleur uniquement). */
const CAUSTIC_D = crescentPath(LENS.cx, LENS.cy, LENS.inner - 2, 8, Math.PI / 4, (70 * Math.PI) / 180);

export const LETTERS = { H: H_D, M: M_D, I: I_D };

// ------------------------------------------------------------------------------------------------ couleurs
/**
 * Clair : ivoire lumineux, encre bleu brume, verre bleu brume / pêche, reflet lilas.
 * Sombre : obsidienne, lettres nacrées éclairées de haut à gauche, verre fumé, lumière directionnelle.
 */
export const COLORS = {
  light: {
    background: '#F1EEE7',
    ink: '#1C2740',        // encre bleu brume profonde (H, M, I)
    inkLit: '#43557E',     // encre éclairée par la lumière transmise
    reflect: '#8E7FD0',    // reflet lilas porté sur le M
    lensHi: '#FBFCFF',
    lensMid: '#B4C6E2',    // bleu brume
    lensDeep: '#5A7099',
    peach: '#F4B48E',      // caustique pêche
    rim: '#C9BEF5',        // liseré lilas
    glint: '#FFFFFF',
  },
  dark: {
    background: '#06090B',
    ink: '#E9EEF1',        // nacre
    inkLit: '#FFFFFF',
    inkShade: '#9AA6AE',   // côté opposé à la lumière
    reflect: '#CFC4FF',
    lensHi: '#FFFFFF',
    lensMid: '#5D6A74',    // verre fumé
    lensDeep: '#151C21',
    peach: '#F7C2A0',
    rim: '#E6ECF0',
    glint: '#FFFFFF',
  },
  mono: { ink: 'currentColor' },
};

// ------------------------------------------------------------------------------------------------ SVG (piste 1)
const idp = (tone) => `hw${tone[0]}`; // préfixe d'identifiants propre à chaque variante (le DOM web partage les <defs>)

function defsFor(tone) {
  const c = COLORS[tone];
  const p = idp(tone);
  const { cx, cy, r } = LENS;
  const inkStops = tone === 'light'
    ? `<stop offset="0" stop-color="${c.ink}"/><stop offset="0.5" stop-color="${c.ink}"/><stop offset="0.62" stop-color="${c.inkLit}"/><stop offset="0.8" stop-color="${c.ink}"/><stop offset="1" stop-color="${c.ink}"/>`
    : `<stop offset="0" stop-color="${c.inkLit}"/><stop offset="0.48" stop-color="${c.ink}"/><stop offset="0.64" stop-color="${c.inkLit}"/><stop offset="1" stop-color="${c.inkShade}"/>`;
  return `<linearGradient id="${p}-ink" gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="350" y2="110">${inkStops}</linearGradient>
<linearGradient id="${p}-ref" gradientUnits="userSpaceOnUse" x1="206" y1="0" x2="352" y2="0"><stop offset="0" stop-color="${c.reflect}" stop-opacity="${tone === 'light' ? 0.55 : 0.45}"/><stop offset="0.55" stop-color="${c.reflect}" stop-opacity="0.12"/><stop offset="1" stop-color="${c.reflect}" stop-opacity="0"/></linearGradient>
<radialGradient id="${p}-lens" gradientUnits="userSpaceOnUse" cx="${cx - 10}" cy="${cy - 12}" r="${LENS.inner * 1.6}" fx="${cx - 14}" fy="${cy - 16}"><stop offset="0" stop-color="${c.lensHi}"/><stop offset="0.42" stop-color="${c.lensMid}"/><stop offset="1" stop-color="${c.lensDeep}"/></radialGradient>
<radialGradient id="${p}-caus" gradientUnits="userSpaceOnUse" cx="${cx + 16}" cy="${cy + 18}" r="${LENS.inner * 0.9}"><stop offset="0" stop-color="${c.peach}" stop-opacity="0.95"/><stop offset="1" stop-color="${c.peach}" stop-opacity="0"/></radialGradient>
<linearGradient id="${p}-rim" gradientUnits="userSpaceOnUse" x1="${cx - r}" y1="${cy - r}" x2="${cx + r}" y2="${cy + r}"><stop offset="0" stop-color="${c.glint}" stop-opacity="0.95"/><stop offset="0.5" stop-color="${c.rim}" stop-opacity="0.35"/><stop offset="1" stop-color="${c.peach}" stop-opacity="0.9"/></linearGradient>`;
}

/** Lentille en couleur (verre, caustique, reflet, anneau, liseré) : réutilisée par le signe compact et l'icône. */
function lensBody(tone) {
  const p = idp(tone);
  const c = COLORS[tone];
  return `<path d="${GLASS_D}" fill="url(#${p}-lens)"/>
<path d="${GLASS_D}" fill="url(#${p}-caus)" opacity="0.45"/>
<path d="${CAUSTIC_D}" fill="url(#${p}-caus)"/>
<path d="${GLINT_D}" fill="${c.glint}" opacity="0.95"/>
<path d="${RING_D}" fill="url(#${p}-ink)"/>
<circle cx="${LENS.cx}" cy="${LENS.cy}" r="${LENS.r - 1}" fill="none" stroke="url(#${p}-rim)" stroke-width="1.6"/>`;
}

const head = (vb, label = 'HOMI') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">`;
const WORD_VB = `0 0 ${WORD.width} ${WORD.height}`;
/** Signe compact : la lentille seule, recadrée dans un carré centré (mêmes tracés, aucune copie). */
export const SIGN = { size: 128, x: LENS.cx - 64, y: LENS.cy - 64 };
const SIGN_VB = `${SIGN.x} ${SIGN.y} ${SIGN.size} ${SIGN.size}`;

/** Lettres H · M · I (encre + lumière transmise par la lentille, portée sur le M et le I). */
function lettersInner(tone) {
  const p = idp(tone);
  return `<g fill="url(#${p}-ink)"><path d="${H_D}"/><path d="${M_D}"/><path d="${I_D}"/></g>
<g fill="url(#${p}-ref)"><path d="${M_D}"/><path d="${I_D}"/></g>`;
}
/** Lentille « à plat » (avant de prendre du volume, animation) : anneau + verre uni, sans reflet. */
function lensFlatInner(tone) {
  const p = idp(tone);
  return `<path d="${GLASS_D}" fill="${COLORS[tone].lensMid}"/>
<path d="${RING_D}" fill="url(#${p}-ink)"/>`;
}
const layer = (tone, inner) => `${head(WORD_VB)}\n<defs>${defsFor(tone)}</defs>\n${inner}\n</svg>`;

export function wordmarkSvg(tone) {
  if (tone === 'mono') return monoWordmarkSvg();
  return layer(tone, `${lettersInner(tone)}\n${lensBody(tone)}`);
}

/** Calques de l'animation (même boîte, superposés = mot-symbole exact) : lettres, lentille à plat, lentille finale. */
export function layerSvgs(tone) {
  return { letters: layer(tone, lettersInner(tone)), lensFlat: layer(tone, lensFlatInner(tone)), lens: layer(tone, lensBody(tone)) };
}

export function monoWordmarkSvg(color = 'currentColor') {
  return `${head(WORD_VB)}
<g fill="${color}"><path d="${H_D}"/><path d="${M_D}"/><path d="${I_D}"/><path d="${RING_D}"/><path d="${GLINT_D}"/></g>
</svg>`;
}

export function signSvg(tone, color = 'currentColor') {
  if (tone === 'mono') return `${head(SIGN_VB)}\n<g fill="${color}"><path d="${RING_D}"/><path d="${GLINT_D}"/></g>\n</svg>`;
  return `${head(SIGN_VB)}
<defs>${defsFor(tone)}</defs>
${lensBody(tone)}
</svg>`;
}

/**
 * Icône d'application : la lentille (détail identifiable du logotype) sur obsidienne, halo de lumière directionnelle.
 * `scale` : part du carré occupée par la lentille ; `background` : tuile pleine ou transparente (Android, splash).
 */
export function tileSvg(size = 1024, { scale = 0.62, background = true, tone = 'dark' } = {}) {
  const s = (size * scale) / (LENS.r * 2);
  const tx = size / 2 - LENS.cx * s;
  const ty = size / 2 - LENS.cy * s;
  const bg = background
    ? `<rect width="${size}" height="${size}" fill="url(#tile-bg)"/><circle cx="${size * 0.38}" cy="${size * 0.34}" r="${size * 0.62}" fill="url(#tile-halo)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="HOMI">
<defs>${defsFor(tone)}
<linearGradient id="tile-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#141B21"/><stop offset="1" stop-color="${COLORS.dark.background}"/></linearGradient>
<radialGradient id="tile-halo"><stop offset="0" stop-color="#9DB2D3" stop-opacity="0.32"/><stop offset="0.6" stop-color="#C9BEF5" stop-opacity="0.08"/><stop offset="1" stop-color="#C9BEF5" stop-opacity="0"/></radialGradient>
</defs>
${bg}
<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${r2(s * 1000) / 1000})">${lensBody(tone)}</g>
</svg>`;
}

// ------------------------------------------------------------------------------------------------ piste 2 : foyer & lien
/**
 * Piste 2 (exploration, non retenue) : le H porte un toit (traverse en pignon : le foyer), le O est fait de deux
 * anneaux entrelacés (le lien), le M et le I sont liés par une ligature en pied (la famille qui se tient).
 */
const P2 = (() => {
  const H = roundedPolygon([
    [10, 10, CV], [30, 10, CV], [30, 58, CC], [49, 40, CC], [68, 58, CC], [68, 10, CV], [88, 10, CV],
    [88, 110, CV], [68, 110, CV], [68, 80, CC], [49, 62, CC], [30, 80, CC], [30, 110, CV], [10, 110, CV],
  ]);
  const ring = (cx) => `${circlePath(cx, 60, 46)}${circlePath(cx, 60, 31, true)}`;
  const O = `${ring(144)}${ring(164)}`;
  // M + I liés : le pied commun forme une ligature (évidement du M au-dessus du pied)
  const MI = roundedPolygon([
    [220, 110, CV], [220, 10, CV], [242, 10, CV], [266, 70, CC], [290, 10, CV], [312, 10, CV],
    [312, 90, CC], [330, 90, CC], [330, 10, CV], [350, 10, CV], [350, 110, CV],
  ]);
  const MI_HOLE = roundedPolygon([[240, 50, CC], [257, 94, CC], [275, 94, CC], [292, 50, CC], [292, 90, CC], [240, 90, CC]].reverse());
  return { H, O, MI: `${MI}${MI_HOLE}` };
})();

export function piste2Svg(tone) {
  const ink = tone === 'mono' ? 'currentColor' : COLORS[tone].ink;
  const accent = tone === 'mono' ? 'currentColor' : tone === 'light' ? '#C9784F' : COLORS.dark.peach;
  return `${head(WORD_VB)}
<g fill="${ink}"><path d="${P2.H}"/><path d="${P2.MI}" fill-rule="evenodd"/></g>
<path d="${P2.O}" fill="${accent}" fill-rule="evenodd"/>
</svg>`;
}
/** Signe de la piste 2 : le H à toit, recadré. */
export function piste2SignSvg(tone) {
  const ink = tone === 'mono' ? 'currentColor' : COLORS[tone].ink;
  return `${head('-6 -4 128 128')}\n<path d="${P2.H}" fill="${ink}"/>\n</svg>`;
}

// ------------------------------------------------------------------------------------------------ module de l'app
/** Module TypeScript : tracés et couleurs EXACTEMENT ceux des SVG (test : src/__tests__/homiLogo.test.tsx). */
export function markModule() {
  const svgs = {
    wordmark: { light: wordmarkSvg('light'), dark: wordmarkSvg('dark'), mono: wordmarkSvg('mono') },
    sign: { light: signSvg('light'), dark: signSvg('dark'), mono: signSvg('mono') },
  };
  return `/** Généré par scripts/homi/brand.mjs — ne pas modifier à la main. Logotype HOMI v4 « lentille » (14/11/2026). */
export type HomiTone = 'light' | 'dark' | 'mono';

/** SVG complets (identiques aux fichiers assets/brand/homi-{wordmark,sign}-{light,dark,mono}.svg). */
export const HOMI_WORDMARK_SVG: Record<HomiTone, string> = ${JSON.stringify(svgs.wordmark, null, 1)};
export const HOMI_SIGN_SVG: Record<HomiTone, string> = ${JSON.stringify(svgs.sign, null, 1)};
/**
 * Calques de l'animation (HomiLogoAnimated) : lettres, lentille à plat, lentille finale — même boîte ; « lettres »
 * puis « lentille » superposés donnent exactement le mot-symbole (test : src/__tests__/homiLogo.test.tsx).
 */
export const HOMI_LAYER_SVG: Record<'light' | 'dark', { letters: string; lensFlat: string; lens: string }> = ${JSON.stringify({ light: layerSvgs('light'), dark: layerSvgs('dark') }, null, 1)};

/** Géométrie du mot-symbole (boîte ${WORD.width} × ${WORD.height}, capitales de 100, fût de ${WORD.stem}). */
export const HOMI_WORD = ${JSON.stringify(WORD)} as const;
/** Lettres dessinées (contours fermés, remplissage nonzero). */
export const HOMI_LETTERS = ${JSON.stringify(LETTERS, null, 1)} as const;
/** O = lentille sertie : anneau, verre, reflet capté (croissant, plein en monochrome), caustique transmise. */
export const HOMI_LENS = ${JSON.stringify({ ...LENS, ringD: RING_D, glassD: GLASS_D, glintD: GLINT_D, causticD: CAUSTIC_D }, null, 1)} as const;
/** Signe compact : carré recadré sur la lentille, dans le repère du mot-symbole. */
export const HOMI_SIGN = ${JSON.stringify(SIGN)} as const;
export const HOMI_COLORS = ${JSON.stringify({ light: COLORS.light, dark: COLORS.dark }, null, 1)} as const;
`;
}

// ------------------------------------------------------------------------------------------------ PNG
const raster = (svg, w, h = w, density = 384) => sharp(Buffer.from(svg), { density }).resize(Math.round(w), Math.round(h));
const png = (svg, size, file) => raster(svg, size).png().toFile(file);
const solid = (color) => (s) => s.replace(/currentColor/g, color);

async function writeExpoAssets() {
  await raster(tileSvg(1024), 1024).flatten({ background: COLORS.dark.background }).png().toFile(path.join(OUT_ASSETS, 'icon.png'));
  // Android adaptatif : zone sûre = 66 % du centre → lentille à 50 %
  await png(tileSvg(1024, { scale: 0.5, background: false }), 1024, path.join(OUT_ASSETS, 'android-icon-foreground.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: COLORS.dark.background } }).png().toFile(path.join(OUT_ASSETS, 'android-icon-background.png'));
  const mono = signSvg('mono', '#FFFFFF');
  await png(mono.replace(/viewBox="[^"]*"/, `viewBox="${LENS.cx - 104} ${LENS.cy - 104} 208 208"`), 1024, path.join(OUT_ASSETS, 'android-icon-monochrome.png'));
  // Écran de lancement : le mot-symbole — HOMI lisible dès la première image (clair sur ivoire, sombre sur obsidienne)
  const splashVb = (svg) => svg.replace(/viewBox="[^"]*"/, 'viewBox="-20 -140 400 400"');
  await raster(splashVb(wordmarkSvg('light')), 1024).png().toFile(path.join(OUT_ASSETS, 'splash-icon.png'));
  await raster(splashVb(wordmarkSvg('dark')), 1024).png().toFile(path.join(OUT_ASSETS, 'splash-icon-dark.png'));
  await raster(tileSvg(256, { scale: 0.74 }), 48).flatten({ background: COLORS.dark.background }).png().toFile(path.join(OUT_ASSETS, 'favicon.png'));
}

async function writePreview() {
  const dir = path.join(OUT_BRAND, 'preview');
  fs.mkdirSync(dir, { recursive: true });
  for (const size of [24, 48, 1024]) await png(tileSvg(1024), size, path.join(dir, `icon-${size}.png`));
}

// ------------------------------------------------------------------------------------------------ explorations
/** Image de niveaux de gris → tableau booléen « encre » (seuil 50 %). */
async function inkMask(svg, h, w) {
  const img = await raster(solid('#000000')(svg), w, h).flatten({ background: '#FFFFFF' }).png().toBuffer();
  const { data, info } = await sharp(img).extend({ top: 2, bottom: 2, left: 2, right: 2, background: '#FFFFFF' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const m = [];
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) m.push(data[y * info.width + x] < 128);
  return { m, w: info.width, h: info.height, raw: data };
}
/** Composantes connexes (4-voisinage) de l'encre et du fond (trous = composantes de fond ne touchant pas le bord). */
function components(mask, w, h, value) {
  const seen = new Uint8Array(w * h);
  let count = 0;
  let holes = 0;
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || mask[i] !== value) continue;
    count++;
    let border = false;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      const x = j % w;
      const y = (j - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (!seen[k] && mask[k] === value) { seen[k] = 1; stack.push(k); }
      }
    }
    if (!border) holes++;
  }
  return { count, holes };
}
/** Rendu en niveaux de gris (0 = encre), rendu à `w`×`h` puis ramené à `W`×`H` (lissage bilinéaire, comme l'œil). */
async function grey(svg, w, h, W = w, H = h) {
  const small = await raster(solid('#000000')(svg), w, h).flatten({ background: '#FFFFFF' }).greyscale().png().toBuffer();
  const { data } = await sharp(small).resize(W, H, { kernel: 'linear' }).raw().toBuffer({ resolveWithObject: true });
  return data;
}
/** Corrélation de Pearson entre deux images de même taille. */
function corr(a, b) {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < n; i++) { const x = a[i] - ma; const y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
  return sab / Math.sqrt(saa * sbb);
}
const pct = (x) => Math.round(x * 1000) / 10;

async function writeExplorations() {
  const dir = path.join(OUT_BRAND, 'explorations');
  fs.mkdirSync(dir, { recursive: true });
  const pistes = {
    'piste1-lentille': { word: (t) => wordmarkSvg(t), sign: (t) => signSvg(t) },
    'piste2-foyer': { word: (t) => piste2Svg(t), sign: (t) => piste2SignSvg(t) },
  };
  for (const [name, p] of Object.entries(pistes)) {
    for (const t of ['light', 'dark', 'mono']) {
      fs.writeFileSync(path.join(dir, `${name}-wordmark-${t}.svg`), p.word(t));
      fs.writeFileSync(path.join(dir, `${name}-sign-${t}.svg`), p.sign(t));
    }
  }

  // Mesures (monochrome, noir sur blanc). Hauteurs du MOT : 16/24/32/48/96 px ; côtés du SIGNE : 16/24/32/48 px.
  //  - fidélité du mot : corrélation entre le rendu en petit (agrandi) et le rendu de référence à 192 px ;
  //  - distinction du signe : corrélation avec sa propre référence MOINS corrélation avec sa forme générique
  //    (O sans reflet / H à traverse droite) — si elle tombe vers 0, le détail identifiable a disparu ;
  //  - lettres séparées : composantes d'encre (seuil 50 %).
  const sizes = [16, 24, 32, 48, 96];
  const plain = {
    'piste1-lentille': `${head(SIGN_VB)}<path d="${RING_D}" fill="currentColor"/></svg>`,
    'piste2-foyer': `${head('-6 -4 128 128')}<path d="${H_D}" fill="currentColor"/></svg>`,
  };
  // Lecture du nom : proximité avec des capitales canoniques H · O (anneau) · M · I dessinées sur la même grille
  const canonical = `${head(WORD_VB)}<g fill="currentColor"><path d="${H_D}"/><path d="${RING_D}"/><path d="${M_D}"/><path d="${I_D}"/></g></svg>`;
  const mesures = {
    methode: 'sharp, monochrome noir sur blanc ; rendu petit agrandi (bilinéaire) puis comparé à 192 px de haut. '
      + 'lectureNom = corrélation (%) avec les capitales canoniques HOMI (même grille, O en anneau) : le nom se lit-il encore ? '
      + 'fideliteMot = corrélation (%) avec le dessin lui-même à 192 px : le détail tient-il ? '
      + 'contreformes = trous blancs au seuil 50 % (valeur à 96 px = dessin intact ; écart = fusion) ; '
      + 'distinctionSigne = corr(signe, sa référence) − corr(signe, forme générique : anneau sans reflet ou H droit), en points.',
    pistes: {},
  };
  for (const [name, p] of Object.entries(pistes)) {
    const RW = Math.round((192 * WORD.width) / WORD.height);
    const ref = await grey(p.word('mono'), RW, 192);
    const canon = await grey(canonical, RW, 192);
    const signRef = await grey(p.sign('mono'), 128, 128);
    const genRef = await grey(plain[name], 128, 128);
    const rows = [];
    for (const h of sizes) {
      const w = Math.round((h * WORD.width) / WORD.height);
      const word = await grey(p.word('mono'), w, h, RW, 192);
      const m = await inkMask(p.word('mono'), h, w);
      const row = { hauteurMot: h, lectureNom: pct(corr(word, canon)), fideliteMot: pct(corr(word, ref)), contreformes: components(m.m, m.w, m.h, false).holes };
      if (h <= 48) {
        const sg = await grey(p.sign('mono'), h, h, 128, 128);
        row.coteSigne = h;
        row.distinctionSigne = pct(corr(sg, signRef) - corr(sg, genRef));
      }
      rows.push(row);
    }
    mesures.pistes[name] = rows;
  }
  fs.writeFileSync(path.join(dir, 'mesures.json'), `${JSON.stringify(mesures, null, 1)}\n`);

  // Planche comparative : pour chaque piste, clair / sombre / monochrome ; mot à 16/24/32/48 puis 96 px de haut,
  // signe compact à 16/24/32/48/96 px. Rendu en taille réelle (1 px = 1 px), sans lissage d'agrandissement.
  const COL = 452;
  const CELL_H = 300;
  const M0 = 24;
  const W = M0 * 2 + COL * 3;
  const tiles = [];
  const texts = [];
  const txt = (x, y, str, size = 13, fill = '#4A5154', weight = 400) => texts.push(`<text x="${x}" y="${y}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${str}</text>`);
  let y = 20;
  txt(M0, y + 16, 'HOMI — logotype : deux pistes, tailles réelles (mot : hauteur ; signe : côté)', 20, '#13181A', 700);
  y += 40;
  const title = { 'piste1-lentille': 'Piste 1 — le O lentille de verre capte un reflet et le transmet au mot (RETENUE)', 'piste2-foyer': 'Piste 2 — foyer (H à toit) et lien (anneaux entrelacés, ligature MI)' };
  for (const [name, p] of Object.entries(pistes)) {
    txt(M0, y + 16, title[name], 16, '#13181A', 700);
    y += 28;
    for (const [ci, tone] of ['light', 'dark', 'mono'].entries()) {
      const x0 = M0 + ci * COL;
      const bg = tone === 'dark' ? COLORS.dark.background : tone === 'mono' ? '#FFFFFF' : COLORS.light.background;
      const fg = tone === 'dark' ? '#A9B3B4' : '#4A5154';
      tiles.push({ input: await sharp({ create: { width: COL - 12, height: CELL_H, channels: 4, background: bg } }).png().toBuffer(), left: x0, top: y });
      txt(x0 + 12, y + 20, tone === 'light' ? 'clair (ivoire)' : tone === 'dark' ? 'sombre (obsidienne)' : 'monochrome', 12, fg, 700);
      const word = (h) => (tone === 'mono' ? solid('#000000')(p.word('mono')) : p.word(tone));
      const sign = () => (tone === 'mono' ? solid('#000000')(p.sign('mono')) : p.sign(tone));
      // ligne 1 : 16 / 24 / 32 / 48 (alignées sur la ligne de base)
      let x = x0 + 12;
      const base1 = y + 40 + 48;
      for (const h of [16, 24, 32, 48]) {
        const w = Math.round((h * WORD.width) / WORD.height);
        tiles.push({ input: await raster(word(h), w, h).png().toBuffer(), left: x, top: base1 - h });
        txt(x, base1 + 14, `${h}`, 10, fg);
        x += w + 18;
      }
      // ligne 2 : 96
      const base2 = base1 + 24 + 96;
      tiles.push({ input: await raster(word(96), 288, 96).png().toBuffer(), left: x0 + 12, top: base2 - 96 });
      txt(x0 + 12 + 296, base2 - 4, '96', 10, fg);
      // ligne 3 : signe 16 / 24 / 32 / 48 / 96 → on garde 16–48 + 64 pour tenir dans la cellule
      x = x0 + 12;
      const base3 = base2 + 14 + 48;
      for (const sz of [16, 24, 32, 48]) {
        tiles.push({ input: await raster(sign(), sz).png().toBuffer(), left: x, top: base3 - sz });
        txt(x, base3 + 14, `${sz}`, 10, fg);
        x += sz + 18;
      }
      txt(x + 8, base3 - 18, 'signe compact', 11, fg);
    }
    y += CELL_H + 24;
  }
  const H = y;
  const base = sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#E4E1DA"/></svg>`));
  const over = { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${texts.join('')}</svg>`), left: 0, top: 0 };
  await base.composite([...tiles, over]).png().toFile(path.join(dir, 'planche-pistes.png'));
  return mesures;
}

async function main() {
  fs.mkdirSync(OUT_BRAND, { recursive: true });
  for (const old of ['homi-mark.svg', 'homi-mark-mono.svg']) fs.rmSync(path.join(OUT_BRAND, old), { force: true });
  for (const t of ['light', 'dark', 'mono']) {
    fs.writeFileSync(path.join(OUT_BRAND, `homi-wordmark-${t}.svg`), wordmarkSvg(t));
    fs.writeFileSync(path.join(OUT_BRAND, `homi-sign-${t}.svg`), signSvg(t));
  }
  fs.writeFileSync(path.join(OUT_BRAND, 'homi-app-icon.svg'), tileSvg());
  fs.writeFileSync(path.join(ROOT, 'src/brand/homiMarkSvg.ts'), markModule());
  await writeExpoAssets();
  if (process.argv.includes('--preview')) await writePreview();
  if (process.argv.includes('--explorations')) console.log(JSON.stringify(await writeExplorations(), null, 1));
  console.log('Marque HOMI générée.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
