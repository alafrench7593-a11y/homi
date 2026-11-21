/**
 * Rendu SVG statique (chaîne) d'un logo d'outil — même dessin que le composant `ToolLogo` : sert aux planches de
 * vérification (scripts/da) et aux tests. Module PUR : aucun import React Native.
 *
 * Couches, dans l'ordre de dessin (boîte 128, celle des fichiers de la propriétaire) :
 *  1. plaque de verre dépoli (image fournie, `plateHref`) ;
 *  2. LUMIÈRE colorée du public : disque radial au centre, derrière le dessin ;
 *  3. symbole nacré : ombre portée, trait en dégradé nacré, filet de lumière (détaillé seulement).
 */
import { LOGO_LIGHT, PEARL, PUBLIC_LIGHT, type LogoMode, type LogoPublic } from '@/theme/toolLogo';
import { SYMBOL_BOX, SYMBOL_STROKE, SYMBOL_TRANSFORM, type LogoVariant } from './geometry';

export interface StaticLogo {
  /** plaque (URL ou data URI de l'image) */
  plateHref: string;
  /** tracé du symbole (grille 24) et points pleins éventuels */
  d: string;
  dots?: [number, number, number][];
  pub: LogoPublic;
  variant: LogoVariant;
  mode: LogoMode;
}

/** Lumière : dégradé radial (opacité relative) — même valeurs que le composant. */
export const LIGHT_STOPS = [[0, 1], [0.6, 0.78], [1, 0]] as const;

export function toolLogoSvg(l: StaticLogo, size: number, uid = 'l'): string {
  const c = SYMBOL_BOX / 2;
  const r = SYMBOL_BOX * LOGO_LIGHT.radius[l.variant];
  const sw = SYMBOL_STROKE[l.variant];
  const light = PUBLIC_LIGHT[l.pub];
  const a = LOGO_LIGHT.opacity[l.mode];
  const dots = (fill: string) => (l.dots ?? []).map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${fill}" stroke="none"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${SYMBOL_BOX} ${SYMBOL_BOX}">
<defs><radialGradient id="${uid}l" cx="0.5" cy="0.5" r="0.5">${LIGHT_STOPS.map(([o, k]) => `<stop offset="${o}" stop-color="${light}" stop-opacity="${+(a * k).toFixed(3)}"/>`).join('')}</radialGradient>
<linearGradient id="${uid}p" x2="0.4" y2="1"><stop stop-color="${PEARL.top}"/><stop offset="1" stop-color="${PEARL.bottom}"/></linearGradient></defs>
<image href="${l.plateHref}" width="${SYMBOL_BOX}" height="${SYMBOL_BOX}"/>
<circle cx="${c}" cy="${c}" r="${r}" fill="url(#${uid}l)"/>
<g transform="${SYMBOL_TRANSFORM}" fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="${PEARL.shadow}" opacity="${PEARL.shadowOpacity}" stroke-width="${sw.shadow}" transform="translate(0 .42)"><path d="${l.d}"/>${dots(PEARL.shadow)}</g>
<g stroke="url(#${uid}p)" stroke-width="${sw.pearl}"><path d="${l.d}"/>${dots(PEARL.top)}</g>
${sw.highlight ? `<g stroke="${PEARL.highlight}" opacity="${PEARL.highlightOpacity}" stroke-width="${sw.highlight}" transform="translate(0 -.23)"><path d="${l.d}"/></g>` : ''}
</g></svg>`;
}
