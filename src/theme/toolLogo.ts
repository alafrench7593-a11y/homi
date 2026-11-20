/**
 * Logos d'outils HOMI — matière « verre minéral » (direction artistique Liquid Glass, 20/11/2026, docs/DA_LIQUID_GLASS.md).
 *
 * Chaque outil est une mini-app : une PLAQUE (squircle d'icône d'app) de la teinte de sa catégorie, un GLYPHE blanc
 * en deux tons (trait + aplat), et la lumière commune à toute la famille : reflet en haut à gauche, arête claire en
 * haut, ombre interne en bas, ombre portée de contact. La plaque est OPAQUE : le logo reste lisible quel que soit le
 * fond (et sous « Réduire la transparence ») ; seul l'éclairage imite le verre.
 *
 * Teintes de catégorie : couleurs SÉMANTIQUES, identiques dans les cinq palettes (un outil garde la même couleur
 * partout : accueil, favoris, recherche, catalogue, écran de l'outil). Elles ne changent qu'avec l'apparence :
 * clair, sombre (plaque un peu plus profonde, arête plus discrète) et nuit (désaturée et assombrie : rien ne brille).
 *
 * Garde-fou : src/__tests__/toolLogos.test.ts — le glyphe blanc tient ≥ 3:1 (élément graphique, WCAG 1.4.11) sur
 * le point le plus CLAIR de chaque plaque, dans chaque apparence ; deux catégories n'ont jamais la même teinte.
 */
import { contrastRatio } from './contrast';
import type { Theme } from './tokens';

/** Mélange linéaire #RRGGBB (copie locale de tokens.mixHex : ce module reste chargeable hors React Native). */
function mixHex(a: string, b: string, k: number): string {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${A.map((x, i) => Math.round(x + (B[i] - x) * k).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export type LogoCategory = 'feeding' | 'sleep' | 'care' | 'health' | 'cycle' | 'pregnancy' | 'school' | 'couple' | 'family' | 'community' | 'account' | 'aura' | 'urgent';

/** Teinte de base (milieu de la plaque) de chaque catégorie. */
export const LOGO_HUES: Record<LogoCategory, string> = {
  feeding: '#D9603F', // corail chaud : lait, repas
  sleep: '#4F4FB3', // indigo de nuit
  care: '#B87514', // miel : soins du quotidien, croissance
  health: '#C23A55', // rose-rouge médical (jamais le rouge d'urgence)
  cycle: '#B23C86', // baie
  pregnancy: '#8558C7', // lilas profond
  school: '#2F8A5B', // sauge
  couple: '#7E3D73', // prune
  family: '#1F7F86', // sarcelle : organisation du foyer
  community: '#3F6FB8', // bleu ouvert
  account: '#5F6670', // graphite neutre (réglages)
  aura: '#6B4BD6', // violet d'Aura (voir AURA dans ce fichier)
  urgent: '#C21F2E', // rouge d'urgence : réservé aux urgences
};

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const NIGHT = '#2B2A30';

export interface ToolLogoSpec {
  /** haut de la plaque (le plus clair) */
  top: string;
  /** bas de la plaque */
  bottom: string;
  /** milieu : couleur de référence (rangée active, anneau, courbe) */
  mid: string;
  /** encre du glyphe */
  glyph: string;
  /** lumière (reflet, arête) : blanc */
  light: string;
  /** aplat du glyphe (même encre, opacité `glyphFillOpacity`) */
  glyphFillOpacity: number;
  /** reflet (blanc) : opacité au point le plus lumineux */
  sheen: number;
  /** arête claire du haut */
  rim: number;
  /** ombre interne du bas (couleur + opacité) */
  shade: string;
  shadeOpacity: number;
  /** ombre portée de contact (CSS / RN boxShadow) */
  drop: string;
}

/** Contraste minimal visé pour le glyphe blanc sur le point le plus clair de la plaque (marge au-dessus de 3:1). */
export const GLYPH_MIN_CONTRAST = 3.2;

function plateLight(mid: string, dark: boolean) {
  const top = mixHex(mid, WHITE, dark ? 0.1 : 0.14);
  const sheen = dark ? 0.24 : 0.32;
  return { top, sheen, brightest: mixHex(top, WHITE, sheen * 0.5) };
}

/** Spécification d'une plaque pour une catégorie et une apparence. */
export function toolLogoSpec(category: LogoCategory, mode: 'light' | 'dark' | 'night'): ToolLogoSpec {
  const base = LOGO_HUES[category];
  if (mode === 'night') {
    const mid = mixHex(mixHex(base, NIGHT, 0.55), BLACK, 0.15);
    return { top: mixHex(mid, WHITE, 0.04), bottom: mixHex(mid, BLACK, 0.25), mid, glyph: '#D6D3DA', light: WHITE, glyphFillOpacity: 0.18, sheen: 0, rim: 0.06, shade: BLACK, shadeOpacity: 0.2, drop: 'none' };
  }
  const dark = mode === 'dark';
  // la teinte s'assombrit par petits pas jusqu'à garantir le contraste du glyphe (valeur résolue, jamais approximée)
  let mid = dark ? mixHex(base, BLACK, 0.1) : base;
  for (let i = 0; i < 40 && contrastRatio(WHITE, plateLight(mid, dark).brightest) < GLYPH_MIN_CONTRAST; i++) mid = mixHex(mid, BLACK, 0.04);
  const p = plateLight(mid, dark);
  return {
    top: p.top,
    bottom: mixHex(mid, BLACK, dark ? 0.32 : 0.22),
    mid,
    glyph: WHITE,
    light: WHITE,
    glyphFillOpacity: 0.3,
    sheen: p.sheen,
    rim: dark ? 0.3 : 0.5,
    shade: mixHex(mid, BLACK, 0.6),
    shadeOpacity: dark ? 0.35 : 0.26,
    drop: dark ? '0px 2px 6px rgba(0,0,0,0.45)' : `0px 2px 5px ${hexA(mixHex(mid, BLACK, 0.4), 0.26)}, 0px 0.5px 1px ${hexA(mixHex(mid, BLACK, 0.5), 0.3)}`,
  };
}

const hexA = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${a})`;

/** Apparence d'un thème pour la matière des logos. */
export const logoMode = (t: Pick<Theme, 'name' | 'isDark'>): 'light' | 'dark' | 'night' => (t.name === 'night' ? 'night' : t.isDark ? 'dark' : 'light');

/** Contraste du glyphe sur le point le plus clair de la plaque (reflet compris). */
export function glyphContrast(category: LogoCategory, mode: 'light' | 'dark' | 'night'): number {
  const s = toolLogoSpec(category, mode);
  const brightest = mixHex(s.top, WHITE, s.sheen * 0.5);
  return contrastRatio(s.glyph, brightest);
}

/**
 * Aura (assistante IA) : signature propre — un noyau de lumière dans une lentille, trois teintes qui tournent
 * lentement (aube, lilas, corail). Couleurs sémantiques de la marque d'Aura, identiques dans les cinq palettes.
 */
export const AURA = {
  core: '#FFFFFF',
  hues: ['#7A5CFF', '#FF8A7A', '#4FC3D9'] as const,
  ring: '#6B4BD6',
  ink: '#FFFFFF',
  /** ombre colorée douce sous la lentille (CSS / RN boxShadow) */
  shadow: '0px 4px 12px rgba(107,75,214,0.35)',
} as const;

/** App icon et mot-symbole : fonds de la tuile (clair / sombre) — mêmes valeurs que assets/brand/homi-app-icon*.svg. */
export const APP_ICON = {
  light: { top: '#FBF1EC', bottom: '#EBD9D1', glow: ['#F7A08E', '#C9B6FF'] as const, ink: '#1F1B1A', lens: '#FFFFFF', shadow: '0px 6px 18px rgba(84,40,60,0.18)' },
  dark: { top: '#2A1C24', bottom: '#120C10', glow: ['#E2735E', '#7C64D8'] as const, ink: '#F7F1E8', lens: '#FFFFFF', shadow: '0px 6px 18px rgba(0,0,0,0.5)' },
} as const;
