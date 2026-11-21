/**
 * Logos d'outils HOMI — matière « verre sombre » (21/11/2026, évolution de la direction Liquid Glass,
 * docs/DA_LIQUID_GLASS.md § 3 bis), d'après la référence de la propriétaire (icône d'app de verre teinté profond).
 *
 * Chaque outil est une mini-app : une PLAQUE de verre teinté PROFOND (squircle d'icône d'app), plus claire au
 * centre-haut, un LISERÉ lumineux fin sur les bords haut et gauche, un reflet doux en diagonale et, en rendu détaillé
 * seulement, un HALO diffus de la teinte autour de la plaque. Le GLYPHE est plein et clair : dégradé blanc → pâle de
 * la teinte, léger rayonnement, détails intérieurs à la couleur de la plaque. La plaque reste OPAQUE et sombre en
 * clair comme en sombre (lisible sur fond crème comme sur fond nuit, et sous « Réduire la transparence ») ; seul
 * l'éclairage imite le verre.
 *
 * Teintes de catégorie : couleurs SÉMANTIQUES, identiques dans les cinq palettes (un outil garde la même couleur
 * partout : accueil, favoris, recherche, catalogue, écran de l'outil). Chaque thème a DEUX couleurs : son verre
 * (`LOGO_HUES`) et sa lumière (`LOGO_GLOWS` : halo, liseré, teinte du glyphe). Elles ne changent qu'avec l'apparence :
 * clair et sombre (même plaque ; halo plus présent en sombre) et nuit (désaturée, rien ne brille, aucun halo).
 *
 * Garde-fou : src/__tests__/toolLogos.test.tsx — le glyphe tient ≥ 4,5:1 (point le plus SOMBRE du glyphe contre
 * point le plus CLAIR de la plaque, cœur lumineux et reflet compris), pour chaque teinte et chaque apparence ; les
 * détails à la couleur de la plaque tiennent ≥ 3:1 sur le glyphe ; deux catégories n'ont jamais la même teinte.
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

/** Verre de chaque thème (milieu de la plaque) : teintes PROFONDES, distinctes par la teinte ou la saturation. */
export const LOGO_HUES: Record<LogoCategory, string> = {
  feeding: '#A3361F', // corail profond : lait, repas
  sleep: '#2D2E86', // indigo nuit
  care: '#2B5C47', // vert sauge profond : soins du quotidien, croissance
  health: '#8A1E4C', // framboise (jamais le rouge d'urgence)
  cycle: '#7E2478', // rose profond (orchidée)
  pregnancy: '#52248A', // prune-violet
  school: '#83430E', // ambre brûlé
  couple: '#741430', // rubis (vin) : plus sombre et plus froid que l'urgence
  family: '#0E5965', // bleu lagon : organisation du foyer
  community: '#1D4486', // bleu ouvert
  account: '#36404E', // ardoise (réglages)
  aura: '#1B2B4C', // Aura : bleu de nuit, lumière ambre (sa signature : jamais le violet « IA générique »)
  urgent: '#A8121F', // rouge d'urgence : réservé aux urgences, le plus vif
};

/** Lumière de chaque thème : halo autour de la plaque, cœur lumineux, liseré, teinte pâle du glyphe. */
export const LOGO_GLOWS: Record<LogoCategory, string> = {
  feeding: '#FFA383',
  sleep: '#A6ABFF',
  care: '#9FE3BF',
  health: '#FF94BD',
  cycle: '#F4A8FF',
  pregnancy: '#CDA9FF',
  school: '#FFC87A',
  couple: '#FF8FA6',
  family: '#7FE2E8',
  community: '#93C2FF',
  account: '#C9D4E3',
  aura: '#F5C26B',
  urgent: '#FF8A80',
};

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const NIGHT = '#2B2A30';
const NIGHT_INK = '#D6D3DA';

export interface ToolLogoSpec {
  /** haut de la plaque */
  top: string;
  /** bas de la plaque (le plus profond) */
  bottom: string;
  /** milieu : couleur de référence du verre (pastille d'activité) */
  mid: string;
  /** lumière du thème : cœur lumineux de la plaque, halo, rayonnement du glyphe */
  glow: string;
  /** cœur lumineux (centre-haut de la plaque) : opacité de `glow` en son centre */
  core: number;
  /** encre du glyphe : haut du dégradé (presque blanc) — aussi l'encre des tracés animés (anneau, courbe, étoiles) */
  glyph: string;
  /** bas du dégradé du glyphe (pâle de la teinte) : son point le plus SOMBRE */
  glyphTint: string;
  /** détails intérieurs du glyphe, à la couleur de la plaque */
  detail: string;
  /** rayonnement du glyphe (trait élargi, opacité de `glow`) ; 0 = aucun */
  glyphGlow: number;
  /** lumière du liseré et du reflet (blanc teinté) */
  light: string;
  /** reflet diagonal : opacité au point le plus lumineux */
  sheen: number;
  /** liseré haut-gauche : opacité */
  rim: number;
  /** ombre interne du bas (couleur + opacité) */
  shade: string;
  shadeOpacity: number;
  /** halo extérieur (rendu détaillé seulement) : opacité de `glow` ; 0 = aucun */
  halo: number;
  /** ombre de contact sous la plaque : opacité de `shade` ; 0 = aucune */
  contact: number;
}

/** Contraste minimal visé : glyphe (point le plus sombre) sur plaque (point le plus clair), seuil du texte WCAG. */
export const GLYPH_MIN_CONTRAST = 4.5;
/** Contraste minimal des détails à la couleur de la plaque sur le glyphe clair (élément graphique, WCAG 1.4.11). */
export const DETAIL_MIN_CONTRAST = 3;

/** Point le plus clair de la plaque : haut, cœur lumineux et reflet diagonal superposés. */
export function plateBrightest(s: Pick<ToolLogoSpec, 'top' | 'glow' | 'core' | 'light' | 'sheen'>): string {
  return mixHex(mixHex(s.top, s.glow, s.core), s.light, s.sheen);
}

function build(mid: string, glow: string, dark: boolean): ToolLogoSpec {
  return {
    top: mixHex(mid, WHITE, 0.06),
    bottom: mixHex(mid, BLACK, 0.5),
    mid,
    glow,
    core: 0.18,
    glyph: mixHex(WHITE, glow, 0.04),
    glyphTint: mixHex(WHITE, glow, 0.16),
    detail: mixHex(mid, BLACK, 0.12),
    glyphGlow: dark ? 0.34 : 0.28,
    light: mixHex(WHITE, glow, 0.15),
    sheen: 0.08,
    rim: 0.9,
    shade: mixHex(mid, BLACK, 0.72),
    shadeOpacity: 0.4,
    halo: dark ? 0.5 : 0.38,
    contact: dark ? 0.5 : 0.28,
  };
}

/** Spécification d'une plaque pour une catégorie et une apparence. */
export function toolLogoSpec(category: LogoCategory, mode: 'light' | 'dark' | 'night'): ToolLogoSpec {
  const base = LOGO_HUES[category];
  if (mode === 'night') {
    // nuit : verre désaturé et assombri, aucune lumière (ni halo, ni rayonnement, ni reflet)
    const mid = mixHex(mixHex(base, NIGHT, 0.5), BLACK, 0.2);
    const glow = mixHex(LOGO_GLOWS[category], NIGHT, 0.55);
    return { ...build(mid, glow, true), glyph: NIGHT_INK, glyphTint: mixHex(NIGHT_INK, glow, 0.15), light: NIGHT_INK, core: 0.08, glyphGlow: 0, sheen: 0, rim: 0.18, halo: 0, contact: 0 };
  }
  const dark = mode === 'dark';
  // le verre s'assombrit par petits pas jusqu'à garantir le contraste du glyphe (valeur résolue, jamais approximée)
  let mid = base;
  let s = build(mid, LOGO_GLOWS[category], dark);
  for (let i = 0; i < 40 && contrastRatio(s.glyphTint, plateBrightest(s)) < GLYPH_MIN_CONTRAST; i++) {
    mid = mixHex(mid, BLACK, 0.04);
    s = build(mid, LOGO_GLOWS[category], dark);
  }
  return s;
}

const hexA = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',')},${+a.toFixed(3)})`;

/**
 * Ombres de la plaque (CSS / RN boxShadow), proportionnelles à sa taille : halo diffus de la teinte (rendu DÉTAILLÉ
 * seulement : en-têtes, raccourcis) + ombre de contact. Compact (listes, recherche, catalogue dense) : pas de halo.
 */
export function logoShadow(spec: ToolLogoSpec, size: number, variant: 'detailed' | 'compact'): string | undefined {
  const px = (v: number) => `${+v.toFixed(1)}px`;
  const out: string[] = [];
  if (variant === 'detailed' && spec.halo > 0) out.push(`0px ${px(size * 0.06)} ${px(size * 0.34)} ${hexA(spec.glow, spec.halo)}`);
  if (spec.contact > 0) {
    const detailed = variant === 'detailed';
    out.push(`0px ${px(size * (detailed ? 0.035 : 0.025))} ${px(size * (detailed ? 0.09 : 0.05))} ${hexA(spec.shade, detailed ? spec.contact : spec.contact * 0.6)}`);
  }
  return out.length ? out.join(', ') : undefined;
}

/** Apparence d'un thème pour la matière des logos. */
export const logoMode = (t: Pick<Theme, 'name' | 'isDark'>): 'light' | 'dark' | 'night' => (t.name === 'night' ? 'night' : t.isDark ? 'dark' : 'light');

/** Contraste du glyphe (point le plus sombre de son dégradé) sur le point le plus clair de la plaque. */
export function glyphContrast(category: LogoCategory, mode: 'light' | 'dark' | 'night'): number {
  const s = toolLogoSpec(category, mode);
  return contrastRatio(s.glyphTint, plateBrightest(s));
}

/** Contraste des détails (couleur de la plaque) sur le point le plus sombre du glyphe. */
export function detailContrast(category: LogoCategory, mode: 'light' | 'dark' | 'night'): number {
  const s = toolLogoSpec(category, mode);
  return contrastRatio(s.detail, s.glyphTint);
}

/**
 * Aura (assistante IA) : signature propre — un noyau de lumière dans une lentille, trois teintes qui tournent
 * lentement (corail, ambre, lagon) sur un bleu de nuit. Couleurs sémantiques de la marque d'Aura, identiques dans les cinq palettes.
 */
export const AURA = {
  core: '#FFFFFF',
  hues: ['#FF8A6B', '#F5C26B', '#4FC3C9'] as const, // corail, ambre, lagon : la lumière du foyer, jamais de violet
  ring: '#2E4466',
  ink: '#FFFFFF',
  /** ombre colorée douce sous la lentille (CSS / RN boxShadow) */
  shadow: '0px 4px 12px rgba(46,68,102,0.35)',
} as const;

/** App icon et mot-symbole : fonds de la tuile (clair / sombre) — mêmes valeurs que assets/brand/homi-app-icon*.svg. */
export const APP_ICON = {
  light: { top: '#FBF1EC', bottom: '#EBD9D1', glow: ['#F7A08E', '#C9B6FF'] as const, ink: '#1F1B1A', lens: '#FFFFFF', shadow: '0px 6px 18px rgba(84,40,60,0.18)' },
  dark: { top: '#2A1C24', bottom: '#120C10', glow: ['#E2735E', '#7C64D8'] as const, ink: '#F7F1E8', lens: '#FFFFFF', shadow: '0px 6px 18px rgba(0,0,0,0.5)' },
} as const;
