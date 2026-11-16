/**
 * HOMI v5 « Lumière corail » (16/11/2026, décision de la propriétaire) — remplace la v4 « Lumière minérale » et ses
 * quatre palettes. Constat : HOMI ressemblait trop à « Au Fil de Nous » (beige, terracotta, paysages en fond,
 * boutons capsules à dégradé marron, cartes empilées partout).
 *
 * UNE SEULE identité : lumière corail, rose chaud, touches de lilas (rares), encre prune profonde.
 *  - Clair : fond uni ivoire rosé, surfaces blanches, séparateurs rosés très légers.
 *  - Sombre : prune-anthracite profond (jamais noir pur), surfaces élevées légèrement rosées.
 *  - Nuit (écran /night, soins nocturnes, interne) : prune très tamisée, ni halo ni ombre.
 * Réglages → Apparence : seulement Système / Clair / Sombre. Les anciennes préférences de palette (v3, v4, Auto) sont
 * migrées vers l'identité unique (`migratePalette` → 'homi').
 *
 * Fond UNI partout : plus aucun paysage, scène, motif ni dégradé de page. La seule lumière décorative est le HALO
 * CORAIL (`theme.tokens.halo`, composant `CoralHalo`), réservé à l'accueil, à l'entrée et à l'onboarding, derrière
 * l'illustration. Profondeur = plans (fond → surface → surface élevée) et lumière ; ombres très légères ou aucune.
 *
 * Les rôles historiques (`colors.*`, `material.*`) sont conservés et alimentés par les jetons : ~230 écrans changent
 * d'un coup sans modification. Les matières v4 (`optical`, `frosted`, `matte`, lentille) existent encore comme NOMS
 * mais sont des surfaces OPAQUES, sans flou ni reflet. Contrastes testés (src/__tests__/contrast.test.ts).
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

/**
 * Identité HOMI v5 (verrouillée par contrast.test.ts). Trois familles :
 *  - `*Deep` : encres pour le clair (texte, icônes, aplats à texte blanc) — ≥ 4,5:1 sur le fond et les surfaces ;
 *  - `*Glow` : lueurs pour le sombre (texte coloré, aplats à texte encre) — ≥ 4,5:1 sur le prune et ses surfaces ;
 *  - teintes pures (`coral`, `rose`, `lilac`) : DÉCOR uniquement (halo, illustration, pastilles), jamais un texte.
 */
export const IDENTITY = {
  coral: '#F2826F',
  coralDeep: '#B5452F',
  coralGlow: '#FFA08A',
  rose: '#EC7E9C',
  roseDeep: '#A8365F',
  roseGlow: '#F4A3C0',
  lilac: '#B9A6F2',
  lilacDeep: '#6A4FB8',
  lilacGlow: '#C9B6FF',
  /** Encre prune : texte principal du clair, aplat de l'action principale */
  plum: '#2A1621',
  plumAction: '#3B1D2C',
} as const;

/**
 * Neutres v5 : ivoire rosé (clair), prune-anthracite (sombre), prune tamisée (nuit). Les anciens noms (`ivory`,
 * `obsidian`, `graphite*`, `pearl*`, `smoke`, `mist`, `peach`, `lilac`) sont conservés pour les imports existants et
 * pointent sur les nouvelles valeurs.
 */
export const NEUTRALS = {
  ivory: '#FBF4F2',
  ivoryHigh: '#FFFAF8',
  ivoryLow: '#F5EAE7',
  ink: IDENTITY.plum,
  inkSoft: '#6E5562',
  obsidian: '#1A1217',
  obsidianHigh: '#241A20',
  obsidianLow: '#140E12',
  graphite: '#1A1217',
  graphiteHigh: '#241A20',
  graphiteLow: '#140E12',
  smoke: '#2E2229',
  pearl: '#F6ECEF',
  pearlSoft: '#C2AFB8',
  nightBg: '#0E0A0C',
  white: '#FFFFFF',
  /** Teintes pâles de l'identité (fonds de pastilles, illustrations) : corail, rose, lilas */
  mist: '#FFE4DC',
  peach: '#FCE3EA',
  lilac: '#ECE5FB',
} as const;

/** Couleurs d'origine conservées comme noms (anciens imports) mais réalignées sur la v5. */
export const palette = {
  night: NEUTRALS.obsidian,
  nightDeep: NEUTRALS.obsidianLow,
  nightSoft: NEUTRALS.smoke,
  mist: NEUTRALS.ivory,
  mistDeep: NEUTRALS.ivoryLow,
  milk: NEUTRALS.pearl,
  powder: '#F6E7E3',
  powderDeep: '#EBCFC8',
  clay: IDENTITY.roseDeep, // cœur, repas
  lavender: IDENTITY.lilacGlow,
  lavenderInk: IDENTITY.lilacDeep,
  gold: '#F0BC6C',
  goldInk: '#7F4B0C',
  ink: NEUTRALS.ink,
  inkSoft: NEUTRALS.inkSoft,
  white: NEUTRALS.white,
  danger: '#B3111B',
  dangerSoft: '#FCE8E8',
};

// ======================================================================== Identité unique
/**
 * v5 : une seule identité. `PaletteName` reste un type (anciens imports), à une seule valeur. Aucune palette au choix,
 * plus d'Auto selon l'heure.
 */
export type PaletteName = 'homi';
export type PaletteChoice = PaletteName;
export const PALETTE_NAMES: PaletteName[] = ['homi'];
/** Accents : encres (clair) et lueurs (sombre), a = corail, b = rose chaud. */
export interface PaletteAccents { ink: [Hex, Hex]; glow: [Hex, Hex] }
export const PALETTES: Record<PaletteName, PaletteAccents> = {
  homi: { ink: [IDENTITY.coralDeep, IDENTITY.roseDeep], glow: [IDENTITY.coralGlow, IDENTITY.roseGlow] },
};
export const SIGNATURE_PALETTE: PaletteName = 'homi';
/**
 * Anciennes préférences de palette (v3 : turquoise, menthe, aurore, iris, crépuscule ; v4 : auto, peche, lilas,
 * lagune, ambre) → identité unique. Rien n'est perdu : il n'y a plus rien à choisir.
 */
export const LEGACY_PALETTE: Record<string, PaletteName> = {
  auto: 'homi', peche: 'homi', lilas: 'homi', lagune: 'homi', ambre: 'homi',
  turquoise: 'homi', menthe: 'homi', aurore: 'homi', iris: 'homi', crepuscule: 'homi',
};
/** Préférence de palette enregistrée (v3, v4 ou absente) → identité unique (pur, testé). */
export function migratePalette(_p?: string | null): PaletteChoice {
  return SIGNATURE_PALETTE;
}

// ======================================================================== Thèmes
export type ThemeName = 'light' | 'dark' | 'night';

/** Moment de la journée (salutation de l'accueil, aperçu). N'a plus d'effet sur les couleurs. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';
export function skyPhase(d: Date = new Date()): SkyPhase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'dusk';
  return 'night';
}
/** Fonds unis (anciens imports : bannières de profil). Trois fois la même couleur : plus de dégradé de page. */
export const SKY_GRADIENTS: Record<Exclude<SkyPhase, 'night'>, [string, string, string]> = {
  dawn: [NEUTRALS.ivory, NEUTRALS.ivory, NEUTRALS.ivory],
  day: [NEUTRALS.ivory, NEUTRALS.ivory, NEUTRALS.ivory],
  dusk: [NEUTRALS.obsidian, NEUTRALS.obsidian, NEUTRALS.obsidian],
};
/** Heure représentative de chaque moment (aperçu « voir à 8 h » de l'accueil). */
export function previewTime(p: SkyPhase): Date {
  const d = new Date();
  const [h, m] = { dawn: [8, 0], day: [14, 0], dusk: [19, 0], night: [23, 0] }[p];
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Jetons sémantiques (une seule source pour chaque rôle). Tous les composants partagés lisent ces jetons ;
 * `colors` (rôles historiques) en est un alias.
 */
export interface DesignTokens {
  surface: { background: string; card: string; glass: string; glassStrong: string; opaque: string; /** surface élevée (feuille, menu) */ raised: string; /** creux (rail, champ) */ sunken: string };
  text: { primary: string; secondary: string; onAccent: string };
  accent: { accent: string; accent2: string; /** lilas : accent secondaire RARE */ lilac: string; gradient: [string, string]; /** version lumineuse (décor), même en clair */ glow: [string, string] };
  /** Action principale : aplat profond + texte clair (clair : prune ; sombre : corail) */
  action: { fill: string; text: string };
  /** Action principale posée sur le halo corail (`Button variant="onHero"`) : surface claire opaque + texte foncé */
  onHero: { fill: string; text: string };
  border: { rest: string; active: string };
  /**
   * HALO CORAIL (accueil, entrée, onboarding uniquement) : dégradé radial localisé derrière l'illustration.
   * `color` = cœur corail, `color2` = rose chaud, `color3` = bord lilas ; `intensity` 0 = éteint (nuit).
   */
  halo: { color: string; color2: string; color3: string; intensity: number };
  status: { success: string; warning: string; danger: string; info: string };
  /** Anneau de focus visible (clavier, lecteur d'écran) */
  focus: string;
}

export interface Theme {
  name: ThemeName;
  phase?: SkyPhase;
  isDark: boolean;
  /** Identité affichée (toujours 'homi') */
  palette: PaletteName;
  tokens: DesignTokens;
  /** Matière dérivée (surfaces, traits, teintes) : voir plus bas */
  material: Material;
  colors: {
    background: string;
    backgroundAlt: string;
    /** Conservé pour compatibilité : trois fois le fond (fond uni) */
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

// ======================================================================== Matière (surfaces, traits, teintes)
/**
 * Niveaux de surface historiques : `inset` (creux : rails, champs), `raised` (cartes = `colors.surface`),
 * `floating` (feuilles, menus = surface élevée). v5 : tous OPAQUES (sauf le creux, une teinte légère), sans flou.
 */
export type SurfaceLevel = 'inset' | 'raised' | 'floating';
export type ElevationLevel = 'low' | 'mid' | 'high';
export interface GlassLevel { fill: string; edge: string; highlight: string; blur: number; shadow: ElevationLevel | null }
export type CardTint = 'soft' | 'lavender' | 'gold';
export interface Lines { controlFill: string; hairline: string; separator: string; track: string; iconWell: string; thumbEdge: string }

/** Noms des anciennes matières v4 (conservés) : en v5 ce sont des surfaces opaques. */
export type SurfaceKind = 'optical' | 'frosted' | 'matte';
export interface SurfaceSpec {
  fill: string;
  edge: string;
  highlight: string;
  inner: [string, string];
  /** v5 : toujours 0 (aucun flou) */
  blur: number;
  shadow: ElevationLevel | null;
  /** v5 : toujours 0 (aucune ombre colorée) */
  glow: number;
}

/** Indicateur de sélection (sélecteurs, ex-« lentille ») : surface claire qui glisse sous l'option active. */
export interface LensSpec { fill: string; edge: string; rim: string; caustic: string; shade: string; shadow: string }

/** Ancienne direction de la lumière (reflets) : v5, reflets éteints (transparents). */
export interface LightSpec { start: { x: number; y: number }; end: { x: number; y: number }; edge: string; sheen: string }
export interface Material {
  glass: Record<SurfaceLevel, GlassLevel>;
  surfaces: Record<SurfaceKind, SurfaceSpec>;
  lens: LensSpec;
  light: LightSpec;
  lines: Lines;
  cardTint: Record<CardTint, string>;
  /** Aplat de l'action principale (trois fois la même couleur : plus de dégradé) — texte `primaryText` lisible */
  primaryGradient: [string, string, string];
  accentRgb: string;
  accent2Rgb: string;
  /** Encre des ombres physiques (« r,g,b ») */
  shadowInk: string;
}

const STATUS = {
  // Rouge d'alerte santé : rouge franc (≈ 357°), distinct du corail (≈ 12°) et du rose (≈ 337°) ; toujours + icône + libellé
  light: { success: '#1B6B3A', warning: '#8A4B00', danger: '#B3111B', info: '#1D5AA6' },
  dark: { success: '#8BE0A6', warning: '#F7C770', danger: '#FF6B6B', info: '#9CC4FF' },
  night: { success: '#94C29E', warning: '#D9B577', danger: '#F08C8C', info: '#9EB6D8' },
} as const;

const LIGHT_DIR = { start: { x: 0, y: 0 }, end: { x: 0.85, y: 1 } };
const NO_LIGHT = 'rgba(255,255,255,0)';
const flatSurface = (fill: string, edge: string, shadow: ElevationLevel | null): SurfaceSpec => ({ fill, edge, highlight: NO_LIGHT, inner: [NO_LIGHT, NO_LIGHT], blur: 0, shadow, glow: 0 });

/** Thème complet pour un mode (l'identité est unique ; `acc` reste paramétrable pour les tests). */
export function buildTheme(mode: ThemeName, acc: PaletteAccents = PALETTES.homi, paletteName: PaletteName = 'homi'): Theme {
  const N = NEUTRALS;
  const I = IDENTITY;
  if (mode === 'light') {
    const [a, b] = acc.ink;
    const [ga, gb] = acc.glow;
    const status = STATUS.light;
    const surface = '#FFFFFF';
    const sunken = '#F6EBE8';
    const edge = 'rgba(84,40,60,0.10)';
    const separator = 'rgba(84,40,60,0.08)';
    const raisedSpec = flatSurface(surface, edge, 'low');
    const material: Material = {
      glass: {
        inset: { fill: 'rgba(120,52,70,0.055)', edge, highlight: NO_LIGHT, blur: 0, shadow: null },
        raised: { fill: surface, edge, highlight: NO_LIGHT, blur: 0, shadow: 'low' },
        floating: { fill: surface, edge, highlight: NO_LIGHT, blur: 0, shadow: 'mid' },
      },
      surfaces: { optical: raisedSpec, frosted: raisedSpec, matte: flatSurface(surface, edge, null) },
      lens: { fill: '#FFFFFF', edge: 'rgba(84,40,60,0.12)', rim: NO_LIGHT, caustic: NO_LIGHT, shade: NO_LIGHT, shadow: 'rgba(84,40,60,0.10)' },
      light: { ...LIGHT_DIR, edge: NO_LIGHT, sheen: NO_LIGHT },
      lines: { controlFill: sunken, hairline: 'rgba(84,40,60,0.16)', separator, track: 'rgba(84,40,60,0.24)', iconWell: '#FCEBE6', thumbEdge: 'rgba(84,40,60,0.10)' },
      cardTint: { soft: '#FFF1ED', lavender: '#F4F0FD', gold: '#FFF4E6' },
      primaryGradient: [I.plumAction, I.plumAction, I.plumAction],
      accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '84,40,60',
    };
    return {
      name: 'light', isDark: false, palette: paletteName, material,
      tokens: {
        surface: { background: N.ivory, card: surface, glass: surface, glassStrong: surface, opaque: surface, raised: surface, sunken },
        text: { primary: N.ink, secondary: N.inkSoft, onAccent: '#FFFFFF' },
        accent: { accent: a, accent2: b, lilac: I.lilacDeep, gradient: [a, b], glow: [ga, gb] },
        action: { fill: I.plumAction, text: '#FFFFFF' },
        onHero: { fill: '#FFFFFF', text: I.plum },
        border: { rest: edge, active: alpha(a, 0.6) },
        halo: { color: I.coral, color2: I.rose, color3: I.lilac, intensity: 0.55 },
        status,
        focus: a,
      },
      colors: {
        background: N.ivory, backgroundAlt: N.ivoryLow, gradient: [N.ivory, N.ivory, N.ivory],
        surface, surfaceAlt: sunken, border: edge,
        text: N.ink, textMuted: N.inkSoft,
        primary: a, primaryText: '#FFFFFF',
        accent: I.coral, accentSoft: alpha(I.coral, 0.16),
        lavender: I.lilacDeep, gold: '#7A4E12',
        success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: '#FCE8E8',
        tabBar: surface, overlay: 'rgba(42,22,33,0.36)', heart: I.roseDeep,
      },
    };
  }
  if (mode === 'dark') {
    const [a, b] = acc.glow;
    const status = STATUS.dark;
    const surface = N.obsidianHigh;
    const raised = N.smoke;
    const edge = 'rgba(255,220,232,0.10)';
    const separator = 'rgba(255,220,232,0.08)';
    const material: Material = {
      glass: {
        inset: { fill: 'rgba(255,220,232,0.06)', edge, highlight: NO_LIGHT, blur: 0, shadow: null },
        raised: { fill: surface, edge, highlight: NO_LIGHT, blur: 0, shadow: 'low' },
        floating: { fill: raised, edge, highlight: NO_LIGHT, blur: 0, shadow: 'mid' },
      },
      surfaces: { optical: flatSurface(raised, edge, 'low'), frosted: flatSurface(raised, edge, 'low'), matte: flatSurface(surface, edge, null) },
      lens: { fill: '#3B2D35', edge: 'rgba(255,220,232,0.14)', rim: NO_LIGHT, caustic: NO_LIGHT, shade: NO_LIGHT, shadow: 'rgba(0,0,0,0.25)' },
      light: { ...LIGHT_DIR, edge: NO_LIGHT, sheen: NO_LIGHT },
      lines: { controlFill: raised, hairline: 'rgba(255,220,232,0.16)', separator, track: 'rgba(255,220,232,0.22)', iconWell: '#3A242B', thumbEdge: 'rgba(0,0,0,0)' },
      cardTint: { soft: '#2E1F22', lavender: '#272033', gold: '#2E2420' },
      primaryGradient: [a, a, a],
      accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '6,3,5',
    };
    return {
      name: 'dark', isDark: true, palette: paletteName, material,
      tokens: {
        surface: { background: N.obsidian, card: surface, glass: raised, glassStrong: raised, opaque: surface, raised, sunken: N.obsidianLow },
        text: { primary: N.pearl, secondary: N.pearlSoft, onAccent: I.plum },
        accent: { accent: a, accent2: b, lilac: I.lilacGlow, gradient: [a, b], glow: [a, b] },
        action: { fill: a, text: I.plum },
        onHero: { fill: N.pearl, text: I.plum },
        border: { rest: edge, active: alpha(a, 0.6) },
        halo: { color: I.coral, color2: I.rose, color3: I.lilac, intensity: 0.32 },
        status,
        focus: a,
      },
      colors: {
        background: N.obsidian, backgroundAlt: N.obsidianLow, gradient: [N.obsidian, N.obsidian, N.obsidian],
        surface, surfaceAlt: raised, border: edge,
        text: N.pearl, textMuted: N.pearlSoft,
        primary: a, primaryText: I.plum,
        accent: b, accentSoft: alpha(b, 0.16),
        lavender: I.lilacGlow, gold: '#F0BC6C',
        success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: 'rgba(255,107,107,0.14)',
        tabBar: surface, overlay: 'rgba(8,4,6,0.6)', heart: I.roseGlow,
      },
    };
  }
  // Nuit (soins à 3 h) : prune très tamisée, accents atténués, ni halo ni ombre
  const [ga, gb] = acc.glow;
  const a = mixHex(ga, '#A39A9E', 0.35);
  const b = mixHex(gb, '#A39A9E', 0.35);
  const status = STATUS.night;
  const flat = (fill: string): SurfaceSpec => flatSurface(fill, '#2A2126', null);
  const material: Material = {
    glass: {
      inset: { fill: '#140F12', edge: '#2A2126', highlight: NO_LIGHT, blur: 0, shadow: null },
      raised: { fill: '#17111A', edge: '#2A2126', highlight: NO_LIGHT, blur: 0, shadow: null },
      floating: { fill: '#1E171B', edge: '#2A2126', highlight: NO_LIGHT, blur: 0, shadow: null },
    },
    surfaces: { optical: flat('#1E171B'), frosted: flat('#1E171B'), matte: flat('#17111A') },
    lens: { fill: '#251D22', edge: '#33292F', rim: NO_LIGHT, caustic: NO_LIGHT, shade: NO_LIGHT, shadow: 'rgba(0,0,0,0)' },
    light: { ...LIGHT_DIR, edge: NO_LIGHT, sheen: NO_LIGHT },
    lines: { controlFill: '#1E171B', hairline: 'rgba(255,230,238,0.11)', separator: 'rgba(255,230,238,0.07)', track: 'rgba(255,230,238,0.16)', iconWell: '#221A1E', thumbEdge: 'rgba(0,0,0,0)' },
    cardTint: { soft: '#1C1517', lavender: '#1A1720', gold: '#1D1816' },
    primaryGradient: [a, a, a],
    accentRgb: rgbOf(a), accent2Rgb: rgbOf(b), shadowInk: '0,0,0',
  };
  return {
    name: 'night', isDark: true, palette: paletteName, material,
    tokens: {
      surface: { background: N.nightBg, card: '#17111A', glass: '#17111A', glassStrong: '#1E171B', opaque: '#17111A', raised: '#1E171B', sunken: '#140F12' },
      text: { primary: '#D9CDD2', secondary: '#A0939A', onAccent: N.nightBg },
      accent: { accent: a, accent2: b, lilac: mixHex(I.lilacGlow, '#A39A9E', 0.35), gradient: [a, b], glow: [a, b] },
      action: { fill: a, text: N.nightBg },
      onHero: { fill: '#D9CDD2', text: N.nightBg },
      border: { rest: '#2A2126', active: alpha(a, 0.5) },
      halo: { color: a, color2: b, color3: b, intensity: 0 },
      status,
      focus: a,
    },
    colors: {
      background: N.nightBg, backgroundAlt: '#120D10', gradient: [N.nightBg, N.nightBg, N.nightBg],
      surface: '#17111A', surfaceAlt: '#1E171B', border: '#2A2126',
      text: '#D9CDD2', textMuted: '#A0939A',
      primary: a, primaryText: N.nightBg,
      accent: b, accentSoft: '#21191D',
      lavender: b, gold: '#CDB48A',
      success: status.success, warning: status.warning, info: status.info, danger: status.danger, dangerSoft: '#2A181A',
      tabBar: N.nightBg, overlay: 'rgba(0,0,0,0.6)', heart: '#E09AB8',
    },
  };
}

export const DEFAULT_PALETTE: PaletteName = SIGNATURE_PALETTE;
export const themes: Record<ThemeName, Theme> = {
  light: buildTheme('light'),
  dark: buildTheme('dark'),
  night: buildTheme('night'),
};

/** Dégradé de l'identité (anneaux de progression, avatars, illustrations) : corail → rose → lilas. */
export const NACRE: [string, string, string] = [IDENTITY.coral, IDENTITY.rose, IDENTITY.lilac];
export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };
/**
 * Rayons v5 : `control` (boutons, champs, sélecteurs : rectangle aux angles souples, PAS une capsule) ; `lg` cartes ;
 * `xl` grandes surfaces ; `sheet` panneau du bas ; `pill` RÉSERVÉ aux filtres et statuts (`Chip`, pastilles).
 */
export const radius = { sm: 10, control: 14, md: 16, lg: 20, xl: 24, tile: 20, sheet: 28, orb: 24, pill: 999 };

/**
 * UNE seule famille : Manrope (déjà chargée ; humaniste, lisible en petit, chiffres nets). Space Grotesk et
 * Instrument Serif (italique éditoriale) sont retirés. Les anciens noms (`display*`, `serifItalic`) pointent sur
 * des graisses de Manrope.
 */
export const fonts = {
  display: 'Manrope_800ExtraBold',
  displayMedium: 'Manrope_700Bold',
  displayItalic: 'Manrope_600SemiBold',
  body: 'Manrope_500Medium',
  bodyMedium: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  /** Ancienne italique éditoriale (Instrument Serif) : remplacée par Manrope 600, droite */
  serifItalic: 'Manrope_600SemiBold',
};

/** Tailles de base ; elles suivent le réglage de taille de texte du téléphone (allowFontScaling). */
export const typeScale = {
  hero: { fontSize: 36, lineHeight: 42, letterSpacing: -1.1 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: -0.7 },
  heading: { fontSize: 19, lineHeight: 25, letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5, lineHeight: 17 },
};

/**
 * Échelle typographique v5 (une famille, Manrope) : display, titre, titre de section, corps, libellé, métadonnée,
 * chiffres tabulaires. La couleur vient du thème ; les tailles suivent le réglage du téléphone, plafonnées par `maxScale`.
 */
export interface TypeStyle { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing: number; color: 'text' | 'textMuted' | 'primaryText'; maxScale: number; fontVariant?: 'tabular-nums'[] }
export const typography = {
  /** Display : titre d'accueil, d'entrée, d'onboarding (une fois par écran) */
  display: { fontFamily: fonts.display, ...typeScale.hero, color: 'text', maxScale: 1.3 },
  /** Titre d'écran */
  headingXL: { fontFamily: fonts.display, ...typeScale.title, color: 'text', maxScale: 1.5 },
  headingL: { fontFamily: fonts.displayMedium, fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: 'text', maxScale: 1.5 },
  /** Titre de section */
  headingM: { fontFamily: fonts.displayMedium, ...typeScale.heading, color: 'text', maxScale: 1.7 },
  bodyL: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  /** Corps */
  bodyM: { fontFamily: fonts.body, ...typeScale.body, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  bodyS: { fontFamily: fonts.body, ...typeScale.small, letterSpacing: 0, color: 'text', maxScale: 1.7 },
  /** Métadonnée (heure, source, compteur) */
  caption: { fontFamily: fonts.body, ...typeScale.caption, letterSpacing: 0.1, color: 'textMuted', maxScale: 1.7 },
  /** Libellé (champ, groupe, rangée), casse de phrase */
  label: { fontFamily: fonts.bodyMedium, ...typeScale.small, letterSpacing: 0.1, color: 'textMuted', maxScale: 1.5 },
  /** Sur-titre en capitales (« GROSSESSE · 2 BÉBÉS ») */
  overline: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1, color: 'textMuted', maxScale: 1.4 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: 0, color: 'primaryText', maxScale: 1.4 },
  /** Chiffres tabulaires (compteurs, mesures, durées : les chiffres ne « dansent » pas) */
  numeric: { fontFamily: fonts.bodyBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, color: 'text', maxScale: 1.4, fontVariant: ['tabular-nums'] },
  /** Anciennes voix « journal » : même famille, droite (plus d'italique éditoriale) */
  editorial: { fontFamily: fonts.displayMedium, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: 'text', maxScale: 1.4 },
  editorialS: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 24, letterSpacing: -0.1, color: 'textMuted', maxScale: 1.5 },
} as const satisfies Record<string, TypeStyle>;
export type TypographyRole = keyof typeof typography;

/** Élévations (ancien format) : très légères, encre prune (jamais noire). */
export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  low: { shadowColor: '#54283C', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  mid: { shadowColor: '#54283C', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  high: { shadowColor: '#54283C', shadowOpacity: 0.09, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
} as const;

// ======================================================================== Ombres (très légères)
/** Encre des ombres : prune en clair, presque noir rosé en sombre (jamais #000 pur). */
export const SHADOW_INK = { light: '84,40,60', dark: '6,3,5' } as const;

/** Couche d'ombre au format `boxShadow` de React Native (iOS, Android et web avec la même syntaxe). */
export interface ShadowLayer { offsetX: number; offsetY: number; blurRadius: number; spreadDistance?: number; color: string; inset?: boolean }

/**
 * Ombres v5 : très légères — la profondeur vient des plans (fond → surface → surface élevée), pas de l'ombre.
 * Une ombre de contact + une ambiance diffuse, opacités faibles.
 */
const SHADOW_STEPS: Record<ElevationLevel, { contact: [number, number, number]; ambient: [number, number, number] }> = {
  low: { contact: [1, 2, 0.035], ambient: [2, 8, 0.03] },
  mid: { contact: [1, 2, 0.04], ambient: [6, 18, 0.05] },
  high: { contact: [1, 3, 0.05], ambient: [12, 32, 0.08] },
};
export function physicalShadow(level: ElevationLevel, isDark: boolean): ShadowLayer[] {
  const s = SHADOW_STEPS[level];
  const ink = isDark ? SHADOW_INK.dark : SHADOW_INK.light;
  const a = (o: number) => Math.min(isDark ? o * 4 : o, 0.45).toFixed(3);
  return [
    { offsetX: 0, offsetY: s.contact[0], blurRadius: s.contact[1], color: `rgba(${ink},${a(s.contact[2])})` },
    { offsetX: 0, offsetY: s.ambient[0], blurRadius: s.ambient[1], spreadDistance: -Math.round(s.ambient[1] / 6), color: `rgba(${ink},${a(s.ambient[2])})` },
  ];
}

/** Aplat de l'action principale (ancien « dégradé » : trois arrêts identiques). */
export const primaryGradient = (isDark: boolean): [string, string, string] => themes[isDark ? 'dark' : 'light'].material.primaryGradient;
export const primaryGradientOf = (t: Theme): [string, string, string] => t.material.primaryGradient;

/** Ancienne ombre colorée : v5, une ombre de contact discrète (plus d'ombre teintée épaisse). */
export function tintedShadow(_rgb: string, isDark: boolean): ShadowLayer[] {
  return physicalShadow('low', isDark);
}

/** Ancien halo diffus des cartes sélectionnées : v5, aucun (la sélection est un contour corail). */
export function haloShadow(_t: Theme, _strength = 1): ShadowLayer[] {
  return [];
}

/** Surfaces par thème (anciens imports). Préférer `glassOf(theme)`. */
export const glass: Record<ThemeName, Record<SurfaceLevel, GlassLevel>> = {
  light: themes.light.material.glass,
  dark: themes.dark.material.glass,
  night: themes.night.material.glass,
};
export const glassOf = (t: Theme) => t.material.glass;

/** Teintes de carte (`<Card tone>`). Préférer `cardTintOf(theme)`. */
export const cardTint: Record<'light' | 'dark', Record<CardTint, string>> = { light: themes.light.material.cardTint, dark: themes.dark.material.cardTint };
export const cardTintOf = (t: Theme) => t.material.cardTint;

/** Bandeaux : fond teinté OPAQUE + liseré + couleur d'accent (icône, titre). `fg` est lu comme du texte : ≥ 4,5:1. */
export type BannerTone = 'info' | 'warning' | 'danger' | 'demo' | 'success';
export interface BannerColors { bg: string; edge: string; fg: string }
export function bannerColors(theme: Theme): Record<BannerTone, BannerColors> {
  const s = theme.tokens.status;
  const c = theme.colors;
  if (!theme.isDark) {
    return {
      info: { bg: '#EAF0FA', edge: alpha(s.info, 0.18), fg: s.info },
      warning: { bg: '#FBF0E0', edge: alpha(s.warning, 0.2), fg: s.warning },
      danger: { bg: c.dangerSoft, edge: alpha(s.danger, 0.22), fg: s.danger },
      demo: { bg: '#FFFFFF', edge: c.border, fg: c.textMuted },
      success: { bg: '#E7F3EA', edge: alpha(s.success, 0.18), fg: s.success },
    };
  }
  return {
    info: { bg: alpha(s.info, 0.1), edge: alpha(s.info, 0.22), fg: s.info },
    warning: { bg: alpha(s.warning, 0.1), edge: alpha(s.warning, 0.22), fg: s.warning },
    danger: { bg: c.dangerSoft, edge: alpha(s.danger, 0.24), fg: s.danger },
    demo: { bg: 'rgba(255,220,232,0.05)', edge: c.border, fg: c.textMuted },
    success: { bg: alpha(s.success, 0.09), edge: alpha(s.success, 0.2), fg: s.success },
  };
}

/** Traits et voiles d'interaction. Préférer `linesOf(theme)`. */
export const lines = { light: themes.light.material.lines, dark: themes.dark.material.lines } as const;
export const linesFor = (isDark: boolean) => (isDark ? lines.dark : lines.light);
export const linesOf = (t: Theme) => t.material.lines;

/** Voiles d'état (survol web, appui) : opacités, sur une couche absolue (aucun décalage de mise en page). */
export const stateVeil = { hoverSolid: 0.08, hoverGlass: 0.04, pressSolidDarken: 0.14, pressGlass: 0.07, pressTint: 0.1 } as const;

/** Tailles de contrôle (hauteur minimale) : boutons, champs, pastilles. Cible tactile ≥ 44 pt (hitSlop si besoin). */
export const controlSize = { sm: 44, md: 52, lg: 56, chip: 40, field: 52 } as const;

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)

/** Animations natives sur téléphone ; le web n'a pas de pilote natif (évite un avertissement console). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const NATIVE_DRIVER: boolean = (require('react-native') as typeof import('react-native')).Platform.OS !== 'web';

// ======================================================================== Aides
/** Surface d'un type pour le thème affiché (noms v4 conservés). */
export const surfaceOf = (t: Theme, kind: SurfaceKind): SurfaceSpec => t.material.surfaces[kind];

/** Ombre d'une surface : très légère (aucune la nuit, aucune ombre colorée). */
export function surfaceShadow(t: Theme, kind: SurfaceKind, _strength = 1): ShadowLayer[] | undefined {
  const s = t.material.surfaces[kind];
  if (t.name === 'night' || !s.shadow) return undefined;
  return physicalShadow(s.shadow, t.isDark);
}

/** Teinte intérieure d'une tuile de données (statut ou accent) : très douce, texte ≥ 4,5:1 (testé). */
export function innerLight(t: Theme, tint: string): { color: string; opacity: number } {
  if (t.name === 'night') return { color: tint, opacity: 0 };
  return { color: tint, opacity: t.isDark ? 0.12 : 0.07 };
}
