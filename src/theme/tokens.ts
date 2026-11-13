/**
 * HOMI v2 (13/11/2026, décision de la propriétaire) — « Lumière sur graphite » : remplace la palette perle / prune /
 * lilas / champagne. Deux réglages indépendants (Réglages → Apparence) :
 *  1. Apparence : Système, Clair (ivoire, verre légèrement teinté, ombres douces), Sombre (graphite presque noir,
 *     surfaces fumées, accents lumineux maîtrisés). Le mode « nuit » des soins nocturnes reste un comportement
 *     interne (écran /night) : graphite très tamisé, palette atténuée, ni flou ni halo.
 *  2. Palette : Auto (selon l'heure locale, transition douce), Aurore (cyan + violet), Crépuscule (corail + ambre),
 *     Menthe (turquoise + vert), Iris (indigo + rose).
 *
 * Les rôles historiques (`colors.background`, `text`, `primary`…) sont conservés et alimentés par les nouveaux jetons
 * (`theme.tokens`) : les ~220 écrans changent d'un coup sans modification. Contrastes testés pour chaque palette ×
 * clair / sombre / nuit et pour les mélanges de l'Auto (src/__tests__/contrast.test.ts). Voir HOMI_DESIGN_SYSTEM.md.
 */

// ======================================================================== Couleurs de base
type Hex = string;
const hexRgb = (c: Hex): [number, number, number] => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (v: number[]) => `#${v.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/** Mélange linéaire de deux couleurs #RRGGBB (k = 0 → a, k = 1 → b). */
export function mixHex(a: Hex, b: Hex, k: number): Hex {
  const A = hexRgb(a); const B = hexRgb(b);
  return toHex(A.map((x, i) => x + (B[i] - x) * k));
}
/** « r,g,b » pour composer des rgba(). */
export const rgbOf = (c: Hex) => hexRgb(c).join(',');
/** rgba() depuis une couleur #RRGGBB. */
export const alpha = (c: Hex, a: number) => `rgba(${rgbOf(c)},${a})`;

/** Neutres : ivoire chaud (clair), graphite (sombre, pas violet), graphite tamisé (nuit). */
export const NEUTRALS = {
  ivory: '#F4F1EB',
  ivoryHigh: '#FAF8F4',
  ivoryLow: '#EEEAE3',
  ink: '#1C1B20',
  inkSoft: '#55525C',
  graphite: '#0D0E11',
  graphiteHigh: '#17181C',
  graphiteLow: '#0A0B0D',
  smoke: '#1E1F25',
  pearl: '#F3F2F5',
  pearlSoft: '#A9A8B3',
  nightBg: '#09090C',
  white: '#FFFFFF',
} as const;

/** Couleurs d'origine conservées comme noms (anciens imports) mais réalignées sur la v2. */
export const palette = {
  night: NEUTRALS.graphite, // graphite (ancien « midnight violet »)
  nightDeep: NEUTRALS.graphiteLow,
  nightSoft: NEUTRALS.smoke,
  mist: NEUTRALS.ivory,
  mistDeep: NEUTRALS.ivoryLow,
  milk: NEUTRALS.pearl,
  powder: '#E6E3F2',
  powderDeep: '#C4B2FF',
  clay: '#C2477E', // framboise : cœur, repas
  lavender: '#C4B2FF', // violet d'Aurore (lueur)
  lavenderInk: '#5E36C4',
  gold: '#E9C987',
  goldInk: '#7A5212',
  ink: NEUTRALS.ink,
  inkSoft: NEUTRALS.inkSoft,
  white: NEUTRALS.white,
  danger: '#C8283F',
  dangerSoft: '#FBE4E4',
};

// ======================================================================== Palettes
export type PaletteName = 'aurore' | 'crepuscule' | 'menthe' | 'iris';
export type PaletteChoice = 'auto' | PaletteName;
export const PALETTE_NAMES: PaletteName[] = ['aurore', 'crepuscule', 'menthe', 'iris'];

/**
 * Une palette = deux accents (a, b) en deux versions :
 *  - `ink`  : encres pour le clair (texte, icônes, boutons à texte blanc) — ≥ 4,5:1 sur l'ivoire et ses surfaces ;
 *  - `glow` : lueurs pour le sombre (texte coloré, filets, halos) — ≥ 4,5:1 sur le graphite et ses surfaces.
 */
export interface PaletteAccents { ink: [Hex, Hex]; glow: [Hex, Hex] }
export const PALETTES: Record<PaletteName, PaletteAccents> = {
  aurore: { ink: ['#0A6176', '#5E36C4'], glow: ['#6FE3F5', '#C4B2FF'] }, // cyan + violet
  crepuscule: { ink: ['#A63A1C', '#8A4D00'], glow: ['#FF9C84', '#FFC56E'] }, // corail + ambre
  menthe: { ink: ['#0A6459', '#256A28'], glow: ['#5EE6D0', '#93E89A'] }, // turquoise + vert
  iris: { ink: ['#4540C8', '#A11F60'], glow: ['#A9B2FF', '#F7A4CF'] }, // indigo + rose
};
/** Mélange de deux palettes (transition de l'Auto). */
export function blendAccents(a: PaletteAccents, b: PaletteAccents, k: number): PaletteAccents {
  if (k <= 0) return a;
  if (k >= 1) return b;
  return {
    ink: [mixHex(a.ink[0], b.ink[0], k), mixHex(a.ink[1], b.ink[1], k)],
    glow: [mixHex(a.glow[0], b.glow[0], k), mixHex(a.glow[1], b.glow[1], k)],
  };
}

// ======================================================================== Palette « Auto » (heure locale)
/**
 * Plages de l'Auto (heure LOCALE du téléphone) :
 *  - 06:00 Menthe : le matin, frais et calme (réveil, petit-déjeuner) ;
 *  - 11:00 Aurore : la journée, lumière nette et neutre (cyan + violet, la signature HOMI) ;
 *  - 17:00 Crépuscule : fin de journée, chaleur du coucher de soleil (retours d'école, repas, bain) ;
 *  - 21:00 Iris : soir et nuit, indigo apaisé (couchers, réveils nocturnes).
 * Chaque changement est un fondu de 60 min centré sur l'heure prévue (30 min avant → 30 min après), par paliers de
 * 5 min : environ 8 % de la différence à chaque palier, donc aucun saut perceptible, jamais de hasard.
 */
export const AUTO_SCHEDULE: { from: number; palette: PaletteName }[] = [
  { from: 6, palette: 'menthe' },
  { from: 11, palette: 'aurore' },
  { from: 17, palette: 'crepuscule' },
  { from: 21, palette: 'iris' },
];
export const AUTO_BLEND_MINUTES = 60;
export const AUTO_STEP_MINUTES = 5;

export interface AutoState {
  /** Palette dominante (celle dont on se rapproche le plus) */
  dominant: PaletteName;
  from: PaletteName;
  to: PaletteName;
  /** 0 → `from`, 1 → `to` (quantifié par paliers de 5 min) */
  k: number;
  /** Prochain instant où la couleur affichée change (palier suivant ou début du prochain fondu) */
  next: Date;
  /** Prochaine palette prévue et heure de bascule (affichage dans les réglages) */
  upcoming: { palette: PaletteName; at: Date };
}

/** État de l'Auto à un instant donné (logique pure, testée). */
export function autoPaletteAt(d: Date = new Date()): AutoState {
  const minutes = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  const S = AUTO_SCHEDULE;
  const half = AUTO_BLEND_MINUTES / 2;
  const at = (m: number) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setMinutes(m); return x; };
  // Bascule la plus proche (avant ou après), boucle sur minuit
  for (let i = 0; i < S.length; i++) {
    const edge = S[i].from * 60;
    for (const shift of [0, -1440, 1440]) {
      const e = edge + shift;
      if (minutes >= e - half && minutes < e + half) {
        const prev = S[(i - 1 + S.length) % S.length].palette;
        const raw = (minutes - (e - half)) / AUTO_BLEND_MINUTES;
        const steps = AUTO_BLEND_MINUTES / AUTO_STEP_MINUTES;
        const step = Math.floor(raw * steps);
        const k = Math.min(1, Math.max(0, step / steps));
        const nextStep = e - half + (step + 1) * AUTO_STEP_MINUTES;
        const nextEdgeIdx = (i + 1) % S.length;
        return {
          dominant: k < 0.5 ? prev : S[i].palette,
          from: prev, to: S[i].palette, k,
          next: at(nextStep),
          upcoming: k < 0.5 ? { palette: S[i].palette, at: at(e) } : { palette: S[nextEdgeIdx].palette, at: at(S[nextEdgeIdx].from * 60 + (nextEdgeIdx === 0 ? 1440 : 0) + shift) },
        };
      }
    }
  }
  // Hors fondu : palette de la plage courante
  let idx = S.length - 1;
  for (let i = 0; i < S.length; i++) if (minutes >= S[i].from * 60) idx = i;
  const nextIdx = (idx + 1) % S.length;
  let nextEdge = S[nextIdx].from * 60;
  if (nextEdge <= minutes) nextEdge += 1440;
  const p = S[idx].palette;
  return { dominant: p, from: p, to: p, k: 0, next: at(nextEdge - half), upcoming: { palette: S[nextIdx].palette, at: at(nextEdge) } };
}

/** Heure représentative de chaque palette (aperçu « voir à 8 h »… dans les réglages). */
export const AUTO_PREVIEW_PHASE: Record<PaletteName, 'dawn' | 'day' | 'dusk' | 'night'> = { menthe: 'dawn', aurore: 'day', crepuscule: 'dusk', iris: 'night' };

// ======================================================================== Thèmes
export type ThemeName = 'light' | 'dark' | 'night';

/** Le ciel de la famille (ancienne API, conservée pour l'accueil et l'aperçu de l'Auto). */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';
export function skyPhase(d: Date = new Date()): SkyPhase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'dusk';
  return 'night';
}
export const SKY_GRADIENTS: Record<Exclude<SkyPhase, 'night'>, [string, string, string]> = {
  dawn: [NEUTRALS.ivoryHigh, NEUTRALS.ivory, NEUTRALS.ivoryLow],
  day: [NEUTRALS.ivoryHigh, NEUTRALS.ivory, NEUTRALS.ivoryLow],
  dusk: [NEUTRALS.graphiteHigh, NEUTRALS.graphite, NEUTRALS.graphiteLow],
};
/** Heure représentative de chaque phase (aperçu dans les réglages) : une par palette de l'Auto. */
export function previewTime(p: SkyPhase): Date {
  const d = new Date();
  const [h, m] = { dawn: [8, 0], day: [14, 0], dusk: [19, 0], night: [23, 0] }[p];
  d.setHours(h, m, 0, 0);
  return d;
}
export const SKY_LABEL: Record<SkyPhase, string> = { dawn: 'Matin', day: 'Journée', dusk: 'Fin de journée', night: 'Soir' };

/**
 * Jetons sémantiques v2 (une seule source pour chaque rôle). Tous les composants partagés lisent ces jetons ;
 * `colors` (rôles historiques) en est un alias.
 */
export interface DesignTokens {
  surface: { background: string; card: string; glass: string; glassStrong: string; opaque: string };
  text: { primary: string; secondary: string; onAccent: string };
  accent: { accent: string; accent2: string; /** dégradé de palette (a → b) */ gradient: [string, string]; /** version lumineuse (halos, filets), même en clair */ glow: [string, string] };
  border: { rest: string; active: string };
  halo: { color: string; color2: string; intensity: number };
  status: { success: string; warning: string; danger: string; info: string };
}

export interface Theme {
  name: ThemeName;
  phase?: SkyPhase;
  isDark: boolean;
  /** Palette dominante affichée (Auto : celle de la plage horaire courante) */
  palette: PaletteName;
  tokens: DesignTokens;
  /** Matière dérivée (verre, traits, teintes, dégradé principal) : voir plus bas */
  material: Material;
  colors: {
    background: string;
    backgroundAlt: string;
    gradient: [string, string, string];
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    accent: string;
    accentSoft: string;
    lavender: string;
    gold: string;
    success: string;
    warning: string;
    info: string;
    danger: string;
    dangerSoft: string;
    tabBar: string;
    overlay: string;
    heart: string;
  };
}

// ======================================================================== Matière (verre, traits, teintes)
/**
 * Niveaux de surface (du plus bas au plus haut). La hiérarchie se lit par l'opacité du verre, le liseré et l'ombre :
 *  - `inset`    : creux (champs, rails de sélecteur, pastilles au repos) ; pas d'ombre ;
 *  - `raised`   : cartes (= `theme.colors.surface`) ; ombre physique `mid` ;
 *  - `floating` : panneaux flottants, feuilles, barre d'onglets, menus ; presque opaque, ombre `high`.
 * `edge` = liseré (bord du verre) ; `highlight` = arête supérieure éclairée ; `blur` = intensité du flou
 * (iOS/web ; Android garde le remplissage seul) ; 0 en mode nuit (économie, calme).
 */
export type SurfaceLevel = 'inset' | 'raised' | 'floating';
export type ElevationLevel = 'low' | 'mid' | 'high';
export interface GlassLevel { fill: string; edge: string; highlight: string; blur: number; shadow: ElevationLevel | null }
export type CardTint = 'soft' | 'lavender' | 'gold';
export interface Lines { controlFill: string; hairline: string; separator: string; track: string; iconWell: string; thumbEdge: string }
export interface Material {
  glass: Record<SurfaceLevel, GlassLevel>;
  lines: Lines;
  cardTint: Record<CardTint, string>;
  /** Dégradé des boutons principaux (texte `primaryText` lisible sur chaque arrêt) */
  primaryGradient: [string, string, string];
  /** Composantes « r,g,b » des deux accents (ombres teintées, halos) */
  accentRgb: string;
  accent2Rgb: string;
  /** Encre des ombres physiques */
  shadowInk: string;
}

const STATUS = {
  light: { success: '#1B6234', warning: '#7E4800', danger: '#A51F2B', info: '#1D5AA6' },
  dark: { success: '#8BE0A6', warning: '#F7C770', danger: '#FF9A93', info: '#9CC4FF' },
  night: { success: '#94C29E', warning: '#D9B577', danger: '#E8A3A0', info: '#9EB6D8' },
} as const;

/** Thème complet pour un mode et une palette (éventuellement mélangée par l'Auto). */
export function buildTheme(mode: ThemeName, acc: PaletteAccents, paletteName: PaletteName): Theme {
  const N = NEUTRALS;
  if (mode === 'light') {
    const [a, b] = acc.ink;
    const [ga, gb] = acc.glow;
    // Verre « légèrement teinté » : 3 % de l'accent dans le blanc des cartes
    const cardBase = mixHex('#FFFFFF', ga, 0.05);
    const floatBase = mixHex('#FFFFFF', ga, 0.03);
    const status = STATUS.light;
    const surface = alpha(cardBase, 0.74);
    const material: Material = {
      glass: {
        inset: { fill: 'rgba(120,104,80,0.07)', edge: 'rgba(28,27,32,0.09)', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
        raised: { fill: surface, edge: 'rgba(255,255,255,0.95)', highlight: 'rgba(255,255,255,1)', blur: 26, shadow: 'mid' },
        floating: { fill: alpha(floatBase, 0.88), edge: 'rgba(255,255,255,1)', highlight: 'rgba(255,255,255,1)', blur: 40, shadow: 'high' },
      },
      lines: { controlFill: 'rgba(255,255,255,0.86)', hairline: alpha(a, 0.2), separator: 'rgba(28,27,32,0.09)', track: 'rgba(85,82,92,0.3)', iconWell: alpha(a, 0.08), thumbEdge: 'rgba(28,27,32,0.08)' },
      cardTint: { soft: alpha(mixHex('#FFFFFF', ga, 0.1), 0.8), lavender: alpha(mixHex('#FFFFFF', gb, 0.16), 0.72), gold: 'rgba(246,234,210,0.72)' },
      primaryGradient: [mixHex(a, '#FFFFFF', 0.06), mixHex(a, b, 0.5), b],
      accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '28,24,20',
    };
    return {
      name: 'light', isDark: false, palette: paletteName, material,
      tokens: {
        surface: { background: N.ivory, card: surface, glass: material.glass.raised.fill, glassStrong: material.glass.floating.fill, opaque: '#FFFFFF' },
        text: { primary: N.ink, secondary: N.inkSoft, onAccent: '#FFFFFF' },
        accent: { accent: a, accent2: b, gradient: [a, b], glow: [ga, gb] },
        border: { rest: 'rgba(28,27,32,0.10)', active: alpha(a, 0.55) },
        halo: { color: ga, color2: gb, intensity: 0.32 },
        status,
      },
      colors: {
        background: N.ivory, backgroundAlt: N.ivoryLow, gradient: [N.ivoryHigh, N.ivory, N.ivoryLow],
        surface, surfaceAlt: 'rgba(255,255,255,0.52)', border: 'rgba(255,255,255,0.92)',
        text: N.ink, textMuted: N.inkSoft,
        primary: a, primaryText: '#FFFFFF',
        accent: mixHex(gb, '#FFFFFF', 0.45), accentSoft: alpha(gb, 0.22),
        lavender: b, gold: '#7A5212',
        success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: '#FBE4E4',
        tabBar: 'rgba(255,255,255,0.8)', overlay: 'rgba(20,19,24,0.34)', heart: '#A8346A',
      },
    };
  }
  if (mode === 'dark') {
    const [a, b] = acc.glow;
    const status = STATUS.dark;
    // Surfaces fumées : blanc très légèrement teinté de l'accent
    const smoke = mixHex('#FFFFFF', a, 0.14);
    const surface = alpha(smoke, 0.065);
    const material: Material = {
      glass: {
        inset: { fill: 'rgba(255,255,255,0.05)', edge: 'rgba(255,255,255,0.10)', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
        raised: { fill: surface, edge: 'rgba(255,255,255,0.10)', highlight: 'rgba(255,255,255,0.22)', blur: 26, shadow: 'mid' },
        floating: { fill: alpha(mixHex(N.smoke, a, 0.04), 0.93), edge: 'rgba(255,255,255,0.13)', highlight: 'rgba(255,255,255,0.26)', blur: 40, shadow: 'high' },
      },
      lines: { controlFill: 'rgba(255,255,255,0.09)', hairline: 'rgba(255,255,255,0.14)', separator: 'rgba(255,255,255,0.08)', track: 'rgba(255,255,255,0.2)', iconWell: alpha(a, 0.1), thumbEdge: 'rgba(0,0,0,0)' },
      cardTint: { soft: alpha(a, 0.07), lavender: alpha(b, 0.1), gold: 'rgba(233,201,135,0.10)' },
      primaryGradient: [mixHex(a, '#FFFFFF', 0.12), mixHex(a, b, 0.5), b],
      accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '4,4,6',
    };
    return {
      name: 'dark', isDark: true, palette: paletteName, material,
      tokens: {
        surface: { background: N.graphite, card: surface, glass: material.glass.raised.fill, glassStrong: material.glass.floating.fill, opaque: N.smoke },
        text: { primary: N.pearl, secondary: N.pearlSoft, onAccent: N.graphite },
        accent: { accent: a, accent2: b, gradient: [a, b], glow: [a, b] },
        border: { rest: 'rgba(255,255,255,0.10)', active: alpha(a, 0.6) },
        halo: { color: a, color2: b, intensity: 0.5 },
        status,
      },
      colors: {
        background: N.graphite, backgroundAlt: '#131418', gradient: [N.graphiteHigh, N.graphite, N.graphiteLow],
        surface, surfaceAlt: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.10)',
        text: N.pearl, textMuted: N.pearlSoft,
        primary: a, primaryText: N.graphite,
        accent: b, accentSoft: alpha(b, 0.16),
        lavender: b, gold: '#E9C987',
        success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: 'rgba(255,120,110,0.15)',
        tabBar: 'rgba(24,25,30,0.86)', overlay: 'rgba(0,0,0,0.58)', heart: '#FF9CC3',
      },
    };
  }
  // Nuit (soins à 3 h) : graphite très tamisé, accents atténués (mêlés de gris), ni flou ni halo
  const [ga, gb] = acc.glow;
  const a = mixHex(ga, '#A3A0AB', 0.35);
  const b = mixHex(gb, '#A3A0AB', 0.35);
  const status = STATUS.night;
  const material: Material = {
    glass: {
      inset: { fill: '#101014', edge: '#24242B', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
      raised: { fill: '#141418', edge: '#24242B', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
      floating: { fill: '#1A1A20', edge: '#24242B', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
    },
    lines: { controlFill: 'rgba(255,255,255,0.07)', hairline: 'rgba(255,255,255,0.11)', separator: 'rgba(255,255,255,0.07)', track: 'rgba(255,255,255,0.16)', iconWell: 'rgba(255,255,255,0.06)', thumbEdge: 'rgba(0,0,0,0)' },
    cardTint: { soft: alpha(a, 0.06), lavender: alpha(b, 0.08), gold: 'rgba(217,181,119,0.08)' },
    primaryGradient: [a, a, a],
    accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '0,0,0',
  };
  return {
    name: 'night', isDark: true, palette: paletteName, material,
    tokens: {
      surface: { background: N.nightBg, card: '#141418', glass: '#141418', glassStrong: '#1A1A20', opaque: '#141418' },
      text: { primary: '#D9D6DE', secondary: '#9B98A5', onAccent: N.nightBg },
      accent: { accent: a, accent2: b, gradient: [a, b], glow: [a, b] },
      border: { rest: '#24242B', active: alpha(a, 0.5) },
      halo: { color: a, color2: b, intensity: 0 },
      status,
    },
    colors: {
      background: N.nightBg, backgroundAlt: '#0E0E12', gradient: ['#0E0E12', '#0B0B0F', '#08080B'],
      surface: '#141418', surfaceAlt: '#1A1A20', border: '#24242B',
      text: '#D9D6DE', textMuted: '#9B98A5',
      primary: a, primaryText: N.nightBg,
      accent: b, accentSoft: '#1E1E25',
      lavender: b, gold: '#CDB48A',
      success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: '#2A1A1C',
      tabBar: N.nightBg, overlay: 'rgba(0,0,0,0.6)', heart: '#E09AB8',
    },
  };
}

/** Palette par défaut des exports statiques (anciens imports hors thème) : Aurore. */
export const DEFAULT_PALETTE: PaletteName = 'aurore';
export const themes: Record<ThemeName, Theme> = {
  light: buildTheme('light', PALETTES.aurore, 'aurore'),
  dark: buildTheme('dark', PALETTES.aurore, 'aurore'),
  night: buildTheme('night', PALETTES.aurore, 'aurore'),
};

/** Dégradé signature (anneaux, barres de progression décoratives) : Aurore lumineuse. */
export const NACRE: [string, string, string] = ['#6FE3F5', '#9ACBFA', '#C4B2FF'];
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };

export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_600SemiBold',
  displayItalic: 'SpaceGrotesk_500Medium',
  body: 'Manrope_500Medium',
  bodyMedium: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
};

/** Tailles de base ; elles suivent le réglage de taille de texte du téléphone (allowFontScaling). */
export const typeScale = {
  hero: { fontSize: 56, lineHeight: 58, letterSpacing: -2.5 },
  title: { fontSize: 32, lineHeight: 36, letterSpacing: -1 },
  heading: { fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  body: { fontSize: 16, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5, lineHeight: 17 },
};

/**
 * Hiérarchie typographique complète (12/11/2026). Une seule source : famille, corps, interligne, graisse et
 * approche pour chaque rôle. La couleur vient du thème (`text` ou `textMuted`) ; toutes les tailles suivent le
 * réglage de taille de texte du téléphone, plafonné par `maxScale` pour ne jamais casser une mise en page.
 * Titres : Space Grotesk (fonctionnel) ; accents de journal intime : Instrument Serif italique.
 */
export interface TypeStyle { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing: number; color: 'text' | 'textMuted' | 'primaryText'; maxScale: number }
export const typography = {
  display: { fontFamily: fonts.display, ...typeScale.hero, color: 'text', maxScale: 1.3 },
  headingXL: { fontFamily: fonts.display, ...typeScale.title, color: 'text', maxScale: 1.5 },
  headingL: { fontFamily: fonts.displayMedium, fontSize: 24, lineHeight: 30, letterSpacing: -0.6, color: 'text', maxScale: 1.5 },
  headingM: { fontFamily: fonts.displayMedium, ...typeScale.heading, color: 'text', maxScale: 1.7 },
  bodyL: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  bodyM: { fontFamily: fonts.body, ...typeScale.body, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  bodyS: { fontFamily: fonts.body, ...typeScale.small, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  caption: { fontFamily: fonts.body, ...typeScale.caption, letterSpacing: 0, color: 'textMuted', maxScale: 1.7 },
  /** Libellé de champ ou de groupe, en casse de phrase : pas d'approche ajoutée (elle est réservée à `overline`). */
  label: { fontFamily: fonts.bodyMedium, ...typeScale.small, letterSpacing: 0.1, color: 'textMuted', maxScale: 1.5 },
  /** Sur-titre en capitales (« GROSSESSE · 2 BÉBÉS ») : petit, gras, approche ouverte pour respirer. */
  overline: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1.1, color: 'textMuted', maxScale: 1.4 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: 0, color: 'primaryText', maxScale: 1.4 },
  /** Voix du journal : dates et phrases d'ouverture. */
  editorial: { fontFamily: fonts.serifItalic, fontSize: 26, lineHeight: 32, letterSpacing: -0.3, color: 'text', maxScale: 1.4 },
  editorialS: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 25, letterSpacing: -0.1, color: 'textMuted', maxScale: 1.5 },
} as const satisfies Record<string, TypeStyle>;
export type TypographyRole = keyof typeof typography;

/** Élévations (ancien format) : ombres graphite discrètes (jamais noires), trois niveaux seulement. */
export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  low: { shadowColor: '#1C1814', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  mid: { shadowColor: '#1C1814', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  high: { shadowColor: '#1C1814', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
} as const;


// ======================================================================== Design system HOMI v2
// Jetons de matière : verre, ombres physiques, voiles d'état. Chaque surface est vérifiée par
// src/__tests__/designSystem.test.ts (texte ≥ 4,5:1) pour chaque palette. Voir DESIGN_SYSTEM.md.

/**
 * Encre des ombres : graphite chaud en clair, presque noir en sombre (jamais #000 pur, pour garder une ombre douce).
 * Composantes RVB, l'opacité vient de chaque couche.
 */
export const SHADOW_INK = { light: '28,24,20', dark: '4,4,6' } as const;

/** Couche d'ombre au format `boxShadow` de React Native (iOS, Android et web avec la même syntaxe). */
export interface ShadowLayer { offsetX: number; offsetY: number; blurRadius: number; spreadDistance?: number; color: string; inset?: boolean }

/**
 * Ombres physiques : chaque niveau = une ombre de contact (courte, nette) + une ombre d'ambiance (longue, diffuse,
 * décalée vers le bas). Opacités plus fortes en sombre pour rester perceptibles.
 */
const SHADOW_STEPS: Record<ElevationLevel, { contact: [number, number, number]; ambient: [number, number, number] }> = {
  low: { contact: [1, 2, 0.06], ambient: [4, 14, 0.06] },
  mid: { contact: [1, 3, 0.07], ambient: [10, 28, 0.1] },
  high: { contact: [2, 6, 0.08], ambient: [18, 44, 0.13] },
};
export function physicalShadow(level: ElevationLevel, isDark: boolean): ShadowLayer[] {
  const s = SHADOW_STEPS[level];
  const ink = isDark ? SHADOW_INK.dark : SHADOW_INK.light;
  const a = (o: number) => Math.min(isDark ? o * 4 : o, 0.6).toFixed(3);
  return [
    { offsetX: 0, offsetY: s.contact[0], blurRadius: s.contact[1], color: `rgba(${ink},${a(s.contact[2])})` },
    { offsetX: 0, offsetY: s.ambient[0], blurRadius: s.ambient[1], spreadDistance: -Math.round(s.ambient[1] / 6), color: `rgba(${ink},${a(s.ambient[2])})` },
  ];
}

/** Dégradé des boutons principaux de la palette par défaut (préférer `primaryGradientOf(theme)`). */
export const primaryGradient = (isDark: boolean): [string, string, string] => themes[isDark ? 'dark' : 'light'].material.primaryGradient;
/** Dégradé des boutons principaux du thème affiché (palette comprise). */
export const primaryGradientOf = (t: Theme): [string, string, string] => t.material.primaryGradient;

/** Ombre colorée douce sous les éléments pleins : la lumière traverse l'accent, jamais du gris. */
export function tintedShadow(rgb: string, isDark: boolean): ShadowLayer[] {
  return [
    { offsetX: 0, offsetY: 1, blurRadius: 2, color: `rgba(${isDark ? SHADOW_INK.dark : rgb},${isDark ? 0.4 : 0.16})` },
    { offsetX: 0, offsetY: 8, blurRadius: 22, spreadDistance: -4, color: `rgba(${rgb},${isDark ? 0.26 : 0.28})` },
  ];
}

/**
 * Halo diffus (cartes sélectionnées, validation) : deux lueurs décalées aux couleurs de la palette, qui débordent du
 * contour. À réserver à UN élément à la fois (carte choisie, action importante, moment de validation).
 */
export function haloShadow(t: Theme, strength = 1): ShadowLayer[] {
  const i = t.tokens.halo.intensity * strength;
  if (i <= 0) return [];
  return [
    { offsetX: -6, offsetY: 4, blurRadius: 26, spreadDistance: -2, color: alpha(t.tokens.halo.color, +(i * 0.9).toFixed(3)) },
    { offsetX: 6, offsetY: 10, blurRadius: 34, spreadDistance: -4, color: alpha(t.tokens.halo.color2, +(i * 0.8).toFixed(3)) },
  ];
}

/** Verre de la palette par défaut, par thème (anciens imports). Préférer `glassOf(theme)`. */
export const glass: Record<ThemeName, Record<SurfaceLevel, GlassLevel>> = {
  light: themes.light.material.glass,
  dark: themes.dark.material.glass,
  night: themes.night.material.glass,
};
export const glassOf = (t: Theme) => t.material.glass;

/** Teintes de carte (`<Card tone>`) de la palette par défaut. Préférer `cardTintOf(theme)`. */
export const cardTint: Record<'light' | 'dark', Record<CardTint, string>> = { light: themes.light.material.cardTint, dark: themes.dark.material.cardTint };
export const cardTintOf = (t: Theme) => t.material.cardTint;

/** Bandeaux : fond teinté + liseré + couleur d'accent (icône, titre). `fg` est lu comme du texte : ≥ 4,5:1. */
export type BannerTone = 'info' | 'warning' | 'danger' | 'demo' | 'success';
export interface BannerColors { bg: string; edge: string; fg: string }
export function bannerColors(theme: Theme): Record<BannerTone, BannerColors> {
  const s = theme.tokens.status;
  const c = theme.colors;
  if (!theme.isDark) {
    return {
      info: { bg: 'rgba(226,236,250,0.78)', edge: alpha(s.info, 0.2), fg: s.info },
      warning: { bg: 'rgba(250,236,210,0.82)', edge: alpha(s.warning, 0.22), fg: s.warning },
      danger: { bg: c.dangerSoft, edge: alpha(s.danger, 0.22), fg: s.danger },
      demo: { bg: 'rgba(255,255,255,0.66)', edge: 'rgba(28,27,32,0.10)', fg: c.textMuted },
      success: { bg: 'rgba(218,240,224,0.8)', edge: alpha(s.success, 0.2), fg: s.success },
    };
  }
  return {
    info: { bg: alpha(s.info, 0.1), edge: alpha(s.info, 0.22), fg: s.info },
    warning: { bg: alpha(s.warning, 0.1), edge: alpha(s.warning, 0.22), fg: s.warning },
    danger: { bg: c.dangerSoft, edge: alpha(s.danger, 0.24), fg: s.danger },
    demo: { bg: 'rgba(255,255,255,0.05)', edge: 'rgba(255,255,255,0.10)', fg: c.textMuted },
    success: { bg: alpha(s.success, 0.09), edge: alpha(s.success, 0.2), fg: s.success },
  };
}

/** Traits et voiles d'interaction de la palette par défaut. Préférer `linesOf(theme)`. */
export const lines = { light: themes.light.material.lines, dark: themes.dark.material.lines } as const;
export const linesFor = (isDark: boolean) => (isDark ? lines.dark : lines.light);
export const linesOf = (t: Theme) => t.material.lines;

/** Voiles d'état (survol web, appui) : opacités, sur une couche absolue (aucun décalage de mise en page). */
export const stateVeil = { hoverSolid: 0.1, hoverGlass: 0.05, pressSolidDarken: 0.12, pressGlass: 0.09, pressTint: 0.14 } as const;

/** Tailles de contrôle (hauteur minimale) : boutons, champs, pastilles. Cible tactile ≥ MIN_TOUCH via hitSlop si besoin. */
export const controlSize = { sm: 40, md: 52, lg: 58, chip: 44, field: 50 } as const;

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)

/** Animations natives sur téléphone ; le web n'a pas de pilote natif (évite un avertissement console). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const NATIVE_DRIVER: boolean = (require('react-native') as typeof import('react-native')).Platform.OS !== 'web';
