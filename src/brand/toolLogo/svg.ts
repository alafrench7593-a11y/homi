/**
 * Rendu SVG statique (chaîne) d'un logo d'outil — même dessin que le composant `ToolLogo` : sert aux exports PNG,
 * aux planches de vérification (scripts/da) et aux tests. Module PUR : aucun import React Native.
 */
import type { HomiIconDef } from '@/brand/icons/geometry';
import type { ToolLogoSpec } from '@/theme/toolLogo';
import { GLYPH_BOX, glyphTransform, LOGO_GRID, SHEEN, squirclePath, squircleTopEdge, type LogoVariant } from './geometry';

const PLATE = squirclePath();
const TOP_EDGE = squircleTopEdge();

/** Couches d'un logo, dans l'ordre de dessin (identiques au composant). */
export function logoLayers(icon: HomiIconDef, spec: ToolLogoSpec, variant: LogoVariant, uid: string) {
  const sw = (icon.heavy ? 2.25 : GLYPH_BOX[variant].stroke).toString();
  const g = glyphTransform(variant);
  const defs = `<defs>
<linearGradient id="${uid}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${spec.top}"/><stop offset="1" stop-color="${spec.bottom}"/></linearGradient>
<radialGradient id="${uid}s" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="${spec.sheen}"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
<linearGradient id="${uid}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="${spec.shade}" stop-opacity="0"/><stop offset="1" stop-color="${spec.shade}" stop-opacity="${spec.shadeOpacity}"/></linearGradient>
<clipPath id="${uid}c"><path d="${PLATE}"/></clipPath>
</defs>`;
  const body = [
    `<path d="${PLATE}" fill="url(#${uid}b)"/>`,
    `<g clip-path="url(#${uid}c)"><ellipse cx="${SHEEN.cx}" cy="${SHEEN.cy}" rx="${SHEEN.rx}" ry="${SHEEN.ry}" transform="rotate(${SHEEN.rotate} ${SHEEN.cx} ${SHEEN.cy})" fill="url(#${uid}s)"/>`,
    `<path d="${PLATE}" fill="url(#${uid}h)"/></g>`,
    variant === 'detailed'
      ? `<g transform="${glyphTransform(variant, 0.9)}" opacity="0.35">${icon.fill ? `<path d="${icon.fill}" fill="${spec.shade}"/>` : ''}<path d="${icon.stroke}" fill="none" stroke="${spec.shade}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></g>`
      : '',
    `<g transform="${g}">${icon.fill ? `<path d="${icon.fill}" fill="${spec.glyph}" fill-opacity="${spec.glyphFillOpacity}"/>` : ''}`,
    `<path d="${icon.stroke}" fill="none" stroke="${spec.glyph}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ...(icon.dots ?? []).map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${spec.glyph}"/>`),
    `</g>`,
    `<path d="${TOP_EDGE}" fill="none" stroke="#FFFFFF" stroke-opacity="${spec.rim}" stroke-width="1" stroke-linecap="round"/>`,
    `<path d="${PLATE}" fill="none" stroke="${spec.bottom}" stroke-opacity="0.35" stroke-width="0.6"/>`,
  ].join('');
  return { defs, body };
}

/** SVG complet d'un logo (taille de sortie `size` px). */
export function toolLogoSvg(icon: HomiIconDef, spec: ToolLogoSpec, variant: LogoVariant, size = LOGO_GRID, uid = 'l'): string {
  const { defs, body } = logoLayers(icon, spec, variant, uid);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${LOGO_GRID} ${LOGO_GRID}">${defs}${body}</svg>`;
}
