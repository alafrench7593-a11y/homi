/**
 * Icône de l'app HOMI « verre minéral » (direction artistique Liquid Glass, 20/11/2026) — source vectorielle UNIQUE
 * (module pur) : `scripts/da/brand-export.cjs` en écrit les SVG et PNG (assets/brand/homi-app-icon-*.svg,
 * assets/icon*.png) ; le composant `HomiGlassMark` dessine la même tuile dans l'app.
 *
 * Composition (grille 1024, plein cadre : iOS applique lui-même son masque à coins continus) :
 *  - fond : dégradé vertical ivoire rosé (clair) ou prune nuit (sombre) ;
 *  - lumière : deux halos doux (corail en bas à gauche, lilas en bas à droite) — la chaleur du foyer ;
 *  - LENTILLE de verre : un disque légèrement bombé (voile blanc, arête éclairée en haut, ombre interne en bas,
 *    reflet en croissant) — l'idée d'accompagnement : la famille est tenue, protégée ;
 *  - le SYMBOLE de la propriétaire (deux personnes formant un « M », tracé exact de assets/brand/source-v5), à l'encre
 *    (clair) ou en ivoire (sombre), centré optiquement dans la lentille, avec une ombre de contact.
 * Variante teintée (iOS 18+) : symbole et lentille en niveaux de gris sur fond noir, iOS applique la teinte.
 */
import { HOMI_SYMBOL_PATH, HOMI_SYMBOL_VIEWBOX } from '@/brand/homiMarkSvg';
import { APP_ICON } from '@/theme/toolLogo';

export type AppIconTone = 'light' | 'dark' | 'tinted';

export const ICON_GRID = 1024;
/** Lentille : centre et rayon (grille 1024). */
export const LENS = { cx: 512, cy: 512, r: 360 } as const;
/** Symbole : hauteur dans la grille 1024 (≈ 45 % : silhouette identifiable à 40 px). */
export const SYMBOL_H = 470;

export function symbolTransform(height = SYMBOL_H, cx = LENS.cx, cy = LENS.cy + 6): string {
  const [x0, y0, w, h] = HOMI_SYMBOL_VIEWBOX;
  const k = height / h;
  return `translate(${(cx - (w * k) / 2 - x0 * k).toFixed(2)} ${(cy - (h * k) / 2 - y0 * k).toFixed(2)}) scale(${k.toFixed(5)})`;
}

interface IconColors { top: string; bottom: string; glowA: string; glowB: string; ink: string; lens: string; lensA: number; rimA: number; shadeA: number }

export function appIconColors(tone: AppIconTone): IconColors {
  if (tone === 'tinted') return { top: '#000000', bottom: '#000000', glowA: '#000000', glowB: '#000000', ink: '#FFFFFF', lens: '#FFFFFF', lensA: 0.14, rimA: 0.5, shadeA: 0 };
  const c = APP_ICON[tone];
  return { top: c.top, bottom: c.bottom, glowA: c.glow[0], glowB: c.glow[1], ink: c.ink, lens: c.lens, lensA: tone === 'light' ? 0.42 : 0.1, rimA: tone === 'light' ? 0.95 : 0.42, shadeA: tone === 'light' ? 0.1 : 0.3 };
}

/** SVG complet de l'icône (plein cadre 1024, sans transparence sauf `tinted`). */
export function appIconSvg(tone: AppIconTone, size = ICON_GRID, idp = ''): string {
  const c = appIconColors(tone);
  const { cx, cy, r } = LENS;
  const glow = tone === 'tinted' ? '' : `
<circle cx="250" cy="900" r="430" fill="url(#${idp}ga)"/>
<circle cx="830" cy="860" r="420" fill="url(#${idp}gb)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${ICON_GRID} ${ICON_GRID}" role="img" aria-label="HOMI">
<defs>
<linearGradient id="${idp}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset="1" stop-color="${c.bottom}"/></linearGradient>
<radialGradient id="${idp}ga" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${c.glowA}" stop-opacity="${tone === 'light' ? 0.55 : 0.5}"/><stop offset="1" stop-color="${c.glowA}" stop-opacity="0"/></radialGradient>
<radialGradient id="${idp}gb" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${c.glowB}" stop-opacity="${tone === 'light' ? 0.5 : 0.45}"/><stop offset="1" stop-color="${c.glowB}" stop-opacity="0"/></radialGradient>
<radialGradient id="${idp}lens" cx="0.42" cy="0.32" r="0.75"><stop offset="0" stop-color="${c.lens}" stop-opacity="${c.lensA + 0.18}"/><stop offset="0.7" stop-color="${c.lens}" stop-opacity="${c.lensA}"/><stop offset="1" stop-color="${c.lens}" stop-opacity="${Math.max(0, c.lensA - 0.12)}"/></radialGradient>
<linearGradient id="${idp}rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="${c.rimA}"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="${c.rimA * 0.35}"/></linearGradient>
<linearGradient id="${idp}shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#2A1621" stop-opacity="0"/><stop offset="1" stop-color="#2A1621" stop-opacity="${c.shadeA}"/></linearGradient>
<radialGradient id="${idp}drop" cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stop-color="#2A1621" stop-opacity="${tone === 'tinted' ? 0 : tone === 'light' ? 0.16 : 0.5}"/><stop offset="1" stop-color="#2A1621" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${ICON_GRID}" height="${ICON_GRID}" fill="url(#${idp}bg)"/>${glow}
<ellipse cx="${cx}" cy="${cy + 40}" rx="${r * 1.06}" ry="${r * 1.04}" fill="url(#${idp}drop)"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${idp}lens)"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${idp}shade)"/>
<path d="M${cx - r * 0.78} ${cy - r * 0.36} A${r * 0.86} ${r * 0.86} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.84}" fill="none" stroke="#FFFFFF" stroke-opacity="${tone === 'light' ? 0.9 : 0.35}" stroke-width="18" stroke-linecap="round"/>
<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="url(#${idp}rim)" stroke-width="6"/>
<path transform="${symbolTransform(SYMBOL_H, cx + 3, cy + 16)}" d="${HOMI_SYMBOL_PATH}" fill="#2A1621" fill-opacity="${tone === 'tinted' ? 0 : tone === 'light' ? 0.12 : 0.4}"/>
<path transform="${symbolTransform()}" d="${HOMI_SYMBOL_PATH}" fill="${c.ink}"/>
</svg>`;
}
