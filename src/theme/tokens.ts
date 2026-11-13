/**
 * HOMI (13/11/2026) : direction « Keynote » chaleureuse — midnight violet, prune, lilas, champagne, perle.
 * Clair « Perle », sombre « Minuit », mode nuit tamisé. Mêmes rôles de couleur qu'avant : tous les écrans
 * qui passent par le thème changent d'un coup. Le rouge reste réservé aux urgences.
 *
 * Historique (Au fil de nous) — Mise à jour du 26/10/2026 (logo validé) : accents dorés et rose doré, comme le fil du logo et la lumière de la
 * vidéo de fond (ciel rose et pêche). Liens et boutons cuivre doré, dégradé signature champagne → rose doré ;
 * la nuit garde le bleu nuit et la prune, avec des accents champagne.
 *
 * Direction artistique « Au fil de nous » (octobre 2026) : fond rose poudré doux et lumineux (#F2DDD8), dégradés
 * crème et beige rosé, traits et textes brun chaud, accents taupe et rose poudré. Nuit : bleu nuit et prune,
 * jamais de noir. Remplace la palette « Aurore » à la demande de la porteuse du projet.
 *
 * Ancienne direction « Aurore » — immersive et chaleureuse.
 * Un fond d'aurore boréale aux couleurs douces (pêche, rose, lavande, menthe) ondule derrière
 * des cartes translucides. Jour : lumière crème et pêche. Soir & nuit : aurore lumineuse sur ciel prune.
 * Le rouge reste réservé aux urgences.
 */

export const palette = {
  night: '#16112B', // midnight violet
  nightDeep: '#0F0B1E',
  nightSoft: '#2A1F52',
  mist: '#F4F0FA', // perle lilas
  mistDeep: '#ECE6F6',
  milk: '#F7F4FB', // perle : texte sur fond sombre
  powder: '#E4DAFB', // lilas pâle
  powderDeep: '#CDBEFA', // lilas
  clay: '#C2477E', // framboise : cœur, repas
  lavender: '#CDBEFA',
  lavenderInk: '#5E44A8',
  gold: '#E9CFA4', // champagne
  goldInk: '#76561D',
  ink: '#1C1533',
  inkSoft: '#584D72',
  white: '#FFFFFF',
  danger: '#C8283F',
  dangerSoft: '#FCE3E7',
};

/** Dégradé signature (bouton +, anneau, accents). */
export const NACRE: [string, string, string] = ['#E9CFA4', '#B9A6F2', '#5B2A86']; // champagne → lilas → prune

export type ThemeName = 'light' | 'dark' | 'night';

/** Le ciel de la famille : l'ambiance suit l'heure réelle. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';
export function skyPhase(d: Date = new Date()): SkyPhase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5.5 && h < 8.5) return 'dawn';
  if (h >= 8.5 && h < 18.5) return 'day';
  if (h >= 18.5 && h < 21.5) return 'dusk';
  return 'night';
}
export const SKY_GRADIENTS: Record<Exclude<SkyPhase, 'night'>, [string, string, string]> = {
  dawn: ['#FBF9FE', '#F4F0FA', '#E9E2F5'],
  day: ['#FBF9FE', '#F4F0FA', '#E9E2F5'],
  dusk: ['#261C4A', '#1A1433', '#110D23'],
};
/** Heure représentative de chaque phase (aperçu dans les réglages). */
export function previewTime(p: SkyPhase): Date {
  const d = new Date();
  const [h, m] = { dawn: [7, 10], day: [13, 30], dusk: [19, 45], night: [2, 15] }[p];
  d.setHours(h, m, 0, 0);
  return d;
}
export const SKY_LABEL: Record<SkyPhase, string> = { dawn: 'Aube', day: 'Jour', dusk: 'Crépuscule', night: 'Nuit' };

export interface Theme {
  name: ThemeName;
  phase?: SkyPhase;
  isDark: boolean;
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
    danger: string;
    dangerSoft: string;
    tabBar: string;
    overlay: string;
    heart: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  // Jour : « Perle » — fond perle lilas, texte nuit violette, accents prune et champagne
  light: {
    name: 'light',
    isDark: false,
    colors: {
      background: '#F4F0FA', // perle lilas
      backgroundAlt: '#ECE6F6',
      gradient: ['#FBF9FE', '#F4F0FA', '#E9E2F5'], // perle → lilas très pâle
      surface: 'rgba(255,255,255,0.74)',
      surfaceAlt: 'rgba(255,255,255,0.5)',
      border: 'rgba(255,255,255,0.92)',
      text: '#1C1533', // nuit violette
      textMuted: '#584D72', // ≥ 4,5:1 jusqu'au bas du dégradé
      primary: '#5B2A86', // prune
      primaryText: '#FFFFFF',
      accent: '#E9CFA4', // champagne
      accentSoft: 'rgba(233,207,164,0.42)',
      lavender: '#5E44A8', // lilas encre (lisible)
      gold: '#76561D', // champagne encre (lisible)
      success: '#1D6644',
      danger: '#A3243A', // rouge des urgences
      dangerSoft: palette.dangerSoft,
      tabBar: 'rgba(28,21,51,0.9)',
      overlay: 'rgba(28,21,51,0.38)',
      heart: '#A8346A',
    },
  },
  // Soir : « Minuit » — nuit violette profonde, verre lisible, accents lilas et champagne
  dark: {
    name: 'dark',
    isDark: true,
    colors: {
      background: '#16112B', // midnight violet
      backgroundAlt: '#1D1638',
      gradient: ['#261C4A', '#1A1433', '#110D23'],
      surface: 'rgba(255,255,255,0.07)',
      surfaceAlt: 'rgba(255,255,255,0.11)',
      border: 'rgba(205,190,250,0.16)',
      text: '#F7F4FB', // perle
      textMuted: '#C3B8DD',
      primary: '#CDBEFA', // lilas
      primaryText: '#1C1533',
      accent: '#E9CFA4', // champagne
      accentSoft: 'rgba(233,207,164,0.16)',
      lavender: '#BBA8F5',
      gold: '#E9CFA4',
      success: '#9FE0B5',
      danger: '#FF97A6',
      dangerSoft: 'rgba(255,110,130,0.16)',
      tabBar: 'rgba(22,17,43,0.88)',
      overlay: 'rgba(0,0,0,0.55)',
      heart: '#FF9CC3',
    },
  },
  // Mode nuit (soins à 3 h du matin) : très peu de lumière, jamais de blanc pur ni de noir
  night: {
    name: 'night',
    isDark: true,
    colors: {
      background: '#0F0B1E',
      backgroundAlt: '#140F27',
      gradient: ['#161029', '#120D22', '#0E0A1C'],
      surface: '#1A1430',
      surfaceAlt: '#211A3A',
      border: '#2E2650',
      text: '#DDD0EC',
      textMuted: '#A598C0',
      primary: '#B9A6EA', // lilas tamisé
      primaryText: '#0F0B1E',
      accent: '#CDB48A',
      accentSoft: '#2A2142',
      lavender: '#A996DD',
      gold: '#CDB48A',
      success: '#9CC1A2',
      danger: '#F0A0AA',
      dangerSoft: '#3A2036',
      tabBar: '#0F0B1E',
      overlay: 'rgba(0,0,0,0.6)',
      heart: '#E09AB8',
    },
  },
};

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

/** Élévations : ombres nuit violette et discrètes (jamais noires), trois niveaux seulement. */
export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  low: { shadowColor: '#2A1F52', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  mid: { shadowColor: '#2A1F52', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  high: { shadowColor: '#2A1F52', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
} as const;
export type ElevationLevel = Exclude<keyof typeof elevation, 'none'>;

// ======================================================================== Design system HOMI (13/11/2026)
// Jetons de matière : verre, ombres physiques, voiles d'état. Ils ne modifient AUCUNE couleur de thème verrouillée ;
// chaque nouvelle surface est vérifiée par src/__tests__/designSystem.test.ts (texte ≥ 4,5:1). Voir DESIGN_SYSTEM.md.

/**
 * Encre des ombres : nuit violette, jamais noir pur. En sombre, une nuit plus profonde (sinon l'ombre disparaît
 * sur le fond midnight). Composantes RVB, l'opacité vient de chaque couche.
 */
export const SHADOW_INK = { light: '42,31,82', dark: '6,4,16' } as const;

/** Couche d'ombre au format `boxShadow` de React Native (iOS, Android et web avec la même syntaxe). */
export interface ShadowLayer { offsetX: number; offsetY: number; blurRadius: number; spreadDistance?: number; color: string; inset?: boolean }

/**
 * Ombres physiques : chaque niveau = une ombre de contact (courte, nette, sous l'objet) + une ombre d'ambiance
 * (longue, diffuse, décalée vers le bas comme sous une lumière zénithale). C'est la paire qui donne la sensation
 * d'un objet posé, pas un halo flou. Opacités plus fortes en sombre pour rester perceptibles.
 */
const SHADOW_STEPS: Record<ElevationLevel, { contact: [number, number, number]; ambient: [number, number, number] }> = {
  // [décalage Y, flou, opacité claire] ; l'opacité sombre est dérivée (× 4, plafonnée)
  low: { contact: [1, 2, 0.06], ambient: [4, 14, 0.06] },
  mid: { contact: [1, 3, 0.08], ambient: [10, 28, 0.11] },
  high: { contact: [2, 6, 0.08], ambient: [18, 44, 0.14] },
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
/**
 * Dégradé des boutons principaux (et du bouton d'action flottant) : prune éclairé en haut, prune au centre, plus
 * profond en bas ; lilas en sombre. Vertical seulement, deux teintes voisines : un volume, pas un arc-en-ciel.
 */
export const primaryGradient = (isDark: boolean): [string, string, string] => (isDark ? ['#E2D7FF', '#CDBEFA', '#B4A1F0'] : ['#6E3A9E', '#5B2A86', '#4A2170']);

/** Ombre colorée des boutons pleins : la lumière traverse le prune (ou le lilas la nuit), jamais du gris. */
export function tintedShadow(rgb: string, isDark: boolean): ShadowLayer[] {
  return [
    { offsetX: 0, offsetY: 1, blurRadius: 2, color: `rgba(${isDark ? SHADOW_INK.dark : rgb},${isDark ? 0.4 : 0.18})` },
    { offsetX: 0, offsetY: 8, blurRadius: 20, spreadDistance: -4, color: `rgba(${rgb},${isDark ? 0.22 : 0.3})` },
  ];
}

/**
 * Niveaux de surface (du plus bas au plus haut). La hiérarchie se lit par l'opacité du verre, le liseré et l'ombre,
 * jamais par la couleur :
 *  - `inset`    : creux (champs, rails de sélecteur, pastilles au repos) ; pas d'ombre, liseré fin teinté.
 *  - `raised`   : cartes (= `theme.colors.surface`, inchangée) ; ombre physique `mid`.
 *  - `floating` : panneaux flottants, feuilles, menus, bouton d'action ; presque opaque, ombre `high`.
 * `edge` = liseré lumineux (bord du verre) ; `highlight` = reflet d'1 px sur l'arête supérieure ;
 * `blur` = intensité de expo-blur (iOS/web ; Android garde le remplissage seul) ; 0 en mode nuit (économie, calme).
 */
export type SurfaceLevel = 'inset' | 'raised' | 'floating';
export interface GlassLevel { fill: string; edge: string; highlight: string; blur: number; shadow: ElevationLevel | null }
export const glass: Record<ThemeName, Record<SurfaceLevel, GlassLevel>> = {
  light: {
    inset: { fill: 'rgba(236,230,246,0.7)', edge: 'rgba(91,42,134,0.14)', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
    raised: { fill: themes.light.colors.surface, edge: themes.light.colors.border, highlight: 'rgba(255,255,255,1)', blur: 26, shadow: 'mid' },
    floating: { fill: 'rgba(255,255,255,0.88)', edge: 'rgba(255,255,255,1)', highlight: 'rgba(255,255,255,1)', blur: 38, shadow: 'high' },
  },
  dark: {
    inset: { fill: 'rgba(255,255,255,0.06)', edge: 'rgba(205,190,250,0.18)', highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
    raised: { fill: themes.dark.colors.surface, edge: themes.dark.colors.border, highlight: 'rgba(255,255,255,0.20)', blur: 26, shadow: 'mid' },
    floating: { fill: 'rgba(50,38,92,0.92)', edge: 'rgba(205,190,250,0.22)', highlight: 'rgba(255,255,255,0.24)', blur: 38, shadow: 'high' },
  },
  night: {
    inset: { fill: themes.night.colors.backgroundAlt, edge: themes.night.colors.border, highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
    raised: { fill: themes.night.colors.surface, edge: themes.night.colors.border, highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
    floating: { fill: themes.night.colors.surfaceAlt, edge: themes.night.colors.border, highlight: 'rgba(255,255,255,0)', blur: 0, shadow: null },
  },
};

/**
 * Teintes de carte (`<Card tone>`) : un voile de couleur de marque posé sur le verre. Toujours très léger en sombre
 * (les teintes chaudes sur violet tournent au brun : la carte « soft » est une perle lilas, pas du champagne).
 */
export type CardTint = 'soft' | 'lavender' | 'gold';
export const cardTint: Record<'light' | 'dark', Record<CardTint, string>> = {
  light: { soft: 'rgba(236,230,246,0.78)', lavender: 'rgba(228,218,251,0.66)', gold: 'rgba(240,222,190,0.62)' },
  dark: { soft: 'rgba(205,190,250,0.08)', lavender: 'rgba(205,190,250,0.13)', gold: 'rgba(233,207,164,0.12)' },
};

/** Bandeaux : fond teinté + liseré + couleur d'accent (icône, titre). `fg` est lu comme du texte : ≥ 4,5:1. */
export type BannerTone = 'info' | 'warning' | 'danger' | 'demo' | 'success';
export interface BannerColors { bg: string; edge: string; fg: string }
export function bannerColors(theme: Theme): Record<BannerTone, BannerColors> {
  const c = theme.colors;
  if (!theme.isDark) {
    return {
      info: { bg: 'rgba(228,218,251,0.72)', edge: 'rgba(94,68,168,0.18)', fg: c.lavender },
      warning: { bg: 'rgba(250,234,206,0.82)', edge: 'rgba(118,86,29,0.22)', fg: '#7A4E0E' },
      danger: { bg: c.dangerSoft, edge: 'rgba(163,36,58,0.22)', fg: c.danger },
      demo: { bg: 'rgba(255,255,255,0.66)', edge: 'rgba(91,42,134,0.12)', fg: c.textMuted },
      success: { bg: 'rgba(214,240,224,0.78)', edge: 'rgba(29,102,68,0.2)', fg: c.success },
    };
  }
  return {
    info: { bg: 'rgba(205,190,250,0.12)', edge: 'rgba(205,190,250,0.22)', fg: c.lavender },
    warning: { bg: 'rgba(240,190,110,0.12)', edge: 'rgba(240,190,110,0.24)', fg: theme.name === 'night' ? '#E0B877' : '#F5C983' },
    danger: { bg: c.dangerSoft, edge: 'rgba(255,151,166,0.26)', fg: c.danger },
    demo: { bg: 'rgba(255,255,255,0.06)', edge: 'rgba(205,190,250,0.14)', fg: c.textMuted },
    success: { bg: 'rgba(159,224,181,0.11)', edge: 'rgba(159,224,181,0.22)', fg: c.success },
  };
}

/**
 * Traits et voiles d'interaction (dérivés du texte et du prune, aucune nouvelle teinte) :
 *  - `controlFill` : verre des contrôles secondaires (en sombre, un voile blanc : un contrôle relevé est plus clair) ;
 *  - `hairline` : liseré des contrôles (boutons secondaires, pastilles, champs) ;
 *  - `separator` : séparateur dans une carte (visible sur verre blanc, contrairement à `border`) ;
 *  - `track` : rail d'interrupteur éteint (visible sur le verre blanc ; l'état se lit aussi par la position du pouce) ;
 *  - `iconWell` : pastille derrière une icône de liste ;
 *  - `pressVeil` : voile ajouté à l'appui (les boutons pleins s'assombrissent, le reste se teinte).
 */
export const lines = {
  light: { controlFill: 'rgba(255,255,255,0.88)', hairline: 'rgba(91,42,134,0.16)', separator: 'rgba(28,21,51,0.09)', track: 'rgba(88,77,114,0.28)', iconWell: 'rgba(91,42,134,0.07)', thumbEdge: 'rgba(28,21,51,0.08)' },
  dark: { controlFill: 'rgba(255,255,255,0.1)', hairline: 'rgba(205,190,250,0.18)', separator: 'rgba(205,190,250,0.12)', track: 'rgba(205,190,250,0.24)', iconWell: 'rgba(205,190,250,0.10)', thumbEdge: 'rgba(0,0,0,0)' },
} as const;
export const linesFor = (isDark: boolean) => (isDark ? lines.dark : lines.light);

/** Voiles d'état (survol web, appui) : opacités, sur une couche absolue (aucun décalage de mise en page). */
export const stateVeil = { hoverSolid: 0.1, hoverGlass: 0.05, pressSolidDarken: 0.12, pressGlass: 0.09, pressTint: 0.14 } as const;

/** Tailles de contrôle (hauteur minimale) : boutons, champs, pastilles. Cible tactile ≥ MIN_TOUCH via hitSlop si besoin. */
export const controlSize = { sm: 40, md: 52, lg: 58, chip: 44, field: 50 } as const;

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)

/** Animations natives sur téléphone ; le web n'a pas de pilote natif (évite un avertissement console). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const NATIVE_DRIVER: boolean = (require('react-native') as typeof import('react-native')).Platform.OS !== 'web';
