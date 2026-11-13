/**
 * HOMI (13/11/2026) : direction « Keynote » chaleureuse — midnight violet, prune, lilas, champagne, perle.
 * Clair « Perle », sombre « Minuit », mode nuit tamisé. Mêmes rôles de couleur qu'avant : tous les écrans
 * qui passent par le thème changent d'un coup. Le rouge reste réservé aux urgences.
 *
 * Historique (Au fil de nous) — Mise à jour du 26/10/2026 (logo validé) : accents dorés et rose doré, comme le fil du logo et la lumière de la
 * vidéo de fond (ciel rose et pêche). Liens et boutons cuivre doré, dégradé signature champagne → rose doré ;
 * la nuit garde le bleu nuit et la prune, avec des accents champagne.
 *
 * Direction artistique « HOMI » (octobre 2026) : fond rose poudré doux et lumineux (#F2DDD8), dégradés
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
  label: { fontFamily: fonts.bodyMedium, ...typeScale.small, letterSpacing: 0.5, color: 'textMuted', maxScale: 1.5 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22, letterSpacing: 0, color: 'primaryText', maxScale: 1.4 },
  /** Voix du journal : dates et phrases d'ouverture. */
  editorial: { fontFamily: fonts.serifItalic, fontSize: 26, lineHeight: 32, letterSpacing: -0.3, color: 'text', maxScale: 1.4 },
  editorialS: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 25, letterSpacing: -0.1, color: 'textMuted', maxScale: 1.5 },
} as const satisfies Record<string, TypeStyle>;
export type TypographyRole = keyof typeof typography;

/** Élévations : ombres chaudes et discrètes (jamais noires), trois niveaux seulement. */
export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  low: { shadowColor: '#2A1F52', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  mid: { shadowColor: '#2A1F52', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  high: { shadowColor: '#2A1F52', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
} as const;

/** Tailles de contrôle (hauteur minimale) : boutons, champs, pastilles. */
export const controlSize = { sm: 40, md: 52, lg: 58, chip: 40, field: 52 } as const;

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)

/** Animations natives sur téléphone ; le web n'a pas de pilote natif (évite un avertissement console). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const NATIVE_DRIVER: boolean = (require('react-native') as typeof import('react-native')).Platform.OS !== 'web';
