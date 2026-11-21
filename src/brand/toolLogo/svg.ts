/**
 * Rendu SVG statique (chaîne) d'un logo d'outil — même dessin que le composant `ToolLogo` : sert aux exports PNG,
 * aux planches de vérification (scripts/da) et aux tests. Module PUR : aucun import React Native.
 *
 * Couches (verre sombre, 21/11/2026), dans l'ordre de dessin :
 *  1. plaque : dégradé vertical du verre profond ; cœur lumineux (radial, centre-haut) ; reflet diagonal doux ;
 *     ombre interne du bas ;
 *  2. liseré : contour intérieur, lumineux en haut et à gauche, une lueur de la teinte en bas à droite ;
 *  3. glyphe : rayonnement (trait élargi, teinte), corps PLEIN en dégradé blanc → pâle de la teinte, détails
 *     intérieurs (traits posés sur l'aplat) à la couleur de la plaque.
 * Le halo extérieur n'est pas dans le SVG : c'est une ombre de la boîte (`logoShadow`), en rendu détaillé seulement.
 */
import type { HomiIconDef } from '@/brand/icons/geometry';
import type { ToolLogoSpec } from '@/theme/toolLogo';
import { CORE, FILL_EDGE, GLYPH_BOX, glyphGlowLayers, glyphTransform, LOGO_GRID, RIM, RIM_PATH, SHEEN_BAND, squirclePath, type LogoVariant } from './geometry';

const PLATE = squirclePath();

/** Épaisseur du trait du glyphe (grille 24). */
export const glyphStroke = (icon: HomiIconDef, variant: LogoVariant) => (icon.heavy ? 2.4 : GLYPH_BOX[variant].stroke);

/** Définitions et couches de la PLAQUE (sans glyphe). */
export function plateLayers(spec: ToolLogoSpec, uid: string) {
  const defs = `<linearGradient id="${uid}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${spec.top}"/><stop offset="0.45" stop-color="${spec.mid}"/><stop offset="1" stop-color="${spec.bottom}"/></linearGradient>
<radialGradient id="${uid}k" cx="${CORE.cx}" cy="${CORE.cy}" r="${CORE.r}"><stop offset="0" stop-color="${spec.glow}" stop-opacity="${spec.core}"/><stop offset="1" stop-color="${spec.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="${uid}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${spec.light}" stop-opacity="${spec.sheen}"/><stop offset="${SHEEN_BAND.solid}" stop-color="${spec.light}" stop-opacity="${+(spec.sheen * 0.55).toFixed(3)}"/><stop offset="${SHEEN_BAND.end}" stop-color="${spec.light}" stop-opacity="0"/></linearGradient>
<linearGradient id="${uid}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="${spec.shade}" stop-opacity="0"/><stop offset="1" stop-color="${spec.shade}" stop-opacity="${spec.shadeOpacity}"/></linearGradient>
<linearGradient id="${uid}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${spec.light}" stop-opacity="${spec.rim}"/><stop offset="0.36" stop-color="${spec.light}" stop-opacity="${+(spec.rim * 0.4).toFixed(3)}"/><stop offset="0.6" stop-color="${spec.light}" stop-opacity="0"/></linearGradient>
<linearGradient id="${uid}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0.6" stop-color="${spec.glow}" stop-opacity="0"/><stop offset="1" stop-color="${spec.glow}" stop-opacity="${+(spec.rim * 0.28).toFixed(3)}"/></linearGradient>
<clipPath id="${uid}c"><path d="${PLATE}"/></clipPath>`;
  const body = [
    `<path d="${PLATE}" fill="url(#${uid}b)"/>`,
    `<g clip-path="url(#${uid}c)"><rect width="${LOGO_GRID}" height="${LOGO_GRID}" fill="url(#${uid}k)"/><rect width="${LOGO_GRID}" height="${LOGO_GRID}" fill="url(#${uid}s)"/><rect width="${LOGO_GRID}" height="${LOGO_GRID}" fill="url(#${uid}h)"/></g>`,
    `<path d="${RIM_PATH}" fill="none" stroke="url(#${uid}e)" stroke-width="${RIM.width * 0.8}"/>`,
    `<path d="${RIM_PATH}" fill="none" stroke="url(#${uid}r)" stroke-width="${RIM.width}"/>`,
  ].join('');
  return { defs, body };
}

/** Définitions et couches du GLYPHE (grille 64). */
export function glyphLayers(icon: HomiIconDef, spec: ToolLogoSpec, variant: LogoVariant, uid: string) {
  const sw = glyphStroke(icon, variant);
  const g = glyphTransform(variant);
  const halo = glyphGlowLayers(variant, spec.glyphGlow);
  const defs = `<linearGradient id="${uid}g" gradientUnits="userSpaceOnUse" x1="0" y1="3" x2="0" y2="21"><stop offset="0" stop-color="${spec.glyph}"/><stop offset="1" stop-color="${spec.glyphTint}"/></linearGradient>${icon.fill ? `<clipPath id="${uid}f"><path d="${icon.fill}"/></clipPath>` : ''}`;
  const dots = (fill: string) => (icon.dots ?? []).map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`).join('');
  const body = [
    `<g transform="${g}">`,
    ...halo.map(({ spread, opacity }) => `<g opacity="${opacity}">${icon.fill ? `<path d="${icon.fill}" fill="${spec.glow}" stroke="${spec.glow}" stroke-width="${spread}" stroke-linejoin="round"/>` : ''}<path d="${icon.stroke}" fill="none" stroke="${spec.glow}" stroke-width="${+(sw + spread).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/></g>`),
    icon.fill ? `<path d="${icon.fill}" fill="url(#${uid}g)"/>` : '',
    `<path d="${icon.stroke}" fill="none" stroke="url(#${uid}g)" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`,
    dots(`url(#${uid}g)`),
    icon.fill
      ? `<g clip-path="url(#${uid}f)"><path d="${icon.stroke}" fill="none" stroke="${spec.detail}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>${dots(spec.detail)}</g><path d="${icon.fill}" fill="none" stroke="url(#${uid}g)" stroke-width="${+(sw * FILL_EDGE).toFixed(2)}" stroke-linejoin="round"/>`
      : '',
    `</g>`,
  ].join('');
  return { defs, body };
}

/** Couches d'un logo, dans l'ordre de dessin (identiques au composant). */
export function logoLayers(icon: HomiIconDef, spec: ToolLogoSpec, variant: LogoVariant, uid: string) {
  const p = plateLayers(spec, uid);
  const g = glyphLayers(icon, spec, variant, uid);
  return { defs: `<defs>\n${p.defs}\n${g.defs}\n</defs>`, body: `${p.body}${g.body}` };
}

/** SVG complet d'un logo (taille de sortie `size` px). */
export function toolLogoSvg(icon: HomiIconDef, spec: ToolLogoSpec, variant: LogoVariant, size = LOGO_GRID, uid = 'l'): string {
  const { defs, body } = logoLayers(icon, spec, variant, uid);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${LOGO_GRID} ${LOGO_GRID}">${defs}${body}</svg>`;
}
