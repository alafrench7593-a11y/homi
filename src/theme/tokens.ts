/**
 * Mise à jour du 26/10/2026 (logo validé) : accents dorés et rose doré, comme le fil du logo et la lumière de la
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
  night: '#1E0F1A', // rose nuit (prune profonde)
  nightDeep: '#140A11',
  nightSoft: '#2B1724',
  mist: '#FFF1F4', // fond rose clair
  mistDeep: '#FFE6EE',
  milk: '#FFF4F7', // texte sur fond sombre
  powder: '#FFD3DE',
  powderDeep: '#F7B0C3',
  clay: '#FF5C8A', // rose vif : cœur, repas
  lavender: '#C9B5FF',
  lavenderInk: '#7A5CE0',
  gold: '#FF8FB1', // rose néon doux : accents sur fond sombre
  goldInk: '#C2416E',
  ink: '#1A1016',
  inkSoft: '#7D6B75',
  white: '#FFFFFF',
  danger: '#D63A3A',
  dangerSoft: '#FDE1E1',
};

/** Dégradé signature (bouton +, anneau, accents). */
export const NACRE: [string, string, string] = ['#E2AE78', '#CB8A72', '#A9697A']; // champagne → rose doré → vieux rose

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
  dawn: ['#FAEADF', '#F2DDD8', '#EBD0C8'],
  day: ['#FAEADF', '#F2DDD8', '#EBD0C8'],
  dusk: ['#2A2448', '#1F2344', '#191D3A'],
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
  // Jour : « Rose »
  light: {
    name: 'light',
    isDark: false,
    colors: {
      background: '#F2DDD8', // rose poudré
      backgroundAlt: '#EED5CF',
      gradient: ['#FAEADF', '#F2DDD8', '#EBD0C8'], // pêche lumineuse → rose poudré → rose beige (ciel de la vidéo)
      surface: 'rgba(255,250,246,0.62)',
      surfaceAlt: 'rgba(255,250,246,0.42)',
      border: 'rgba(255,255,255,0.78)',
      text: '#3A2621', // brun chaud
      textMuted: '#6A5049', // taupe brun (≥ 4,5:1 sur le fond)
      primary: '#804F3C', // cuivre doré (fil du logo), ≥ 4,5:1 sur tout le dégradé (09/11/2026 : 4,64 sur #EBD0C8)
      primaryText: '#FFFFFF',
      accent: '#E6BE96', // pêche champagne
      accentSoft: 'rgba(230,190,150,0.38)',
      lavender: '#784F5F', // prune taupe (≥ 4,5:1 sur tout le dégradé)
      gold: '#80532A', // or brun (lisible sur le rose)
      success: '#236643', // ≥ 4,5:1 sur tout le dégradé clair (était 3,6 sur #EBD0C8)
      danger: '#A92C2C', // rouge des urgences, lisible sur tout le dégradé clair (≥ 4,5:1)
      dangerSoft: palette.dangerSoft,
      tabBar: 'rgba(74,50,42,0.88)',
      overlay: 'rgba(58,38,33,0.35)',
      heart: '#B4545F',
    },
  },
  // Soir & nuit : « Rose nuit »
  dark: {
    name: 'dark',
    isDark: true,
    colors: {
      background: '#1F2344', // bleu nuit
      backgroundAlt: '#262A4D',
      gradient: ['#2A2448', '#1F2344', '#191D3A'], // prune → bleu nuit
      surface: 'rgba(255,255,255,0.07)',
      surfaceAlt: 'rgba(255,255,255,0.11)',
      border: 'rgba(255,255,255,0.12)',
      text: '#FFF4EE',
      textMuted: '#CDB8C6',
      primary: '#E7C08F', // champagne
      primaryText: '#2A2448',
      accent: '#F0D9CF',
      accentSoft: 'rgba(231,192,143,0.16)',
      lavender: '#C3B2FF',
      gold: '#E7C08F',
      success: '#9FE0B5',
      danger: '#FF8A8A',
      dangerSoft: 'rgba(255,90,90,0.16)',
      tabBar: 'rgba(30,32,64,0.86)',
      overlay: 'rgba(0,0,0,0.55)',
      heart: '#FF86A8',
    },
  },
  // Mode nuit (suivi de bébé à 3 h du matin) : très peu de lumière, rose tamisé
  night: {
    name: 'night',
    isDark: true,
    colors: {
      background: '#141831', // bleu nuit tamisé (jamais noir)
      backgroundAlt: '#191C38',
      gradient: ['#1A1834', '#151830', '#12152C'],
      surface: '#1E2140',
      surfaceAlt: '#252848',
      border: '#33365A',
      text: '#F3D6DF',
      textMuted: '#B8939F',
      primary: '#D9B48A', // champagne tamisé
      primaryText: '#141831',
      accent: '#C9A27E',
      accentSoft: '#2C2547',
      lavender: '#B7A3E6',
      gold: '#D9B48A',
      success: '#9CC1A2',
      danger: '#F0A0A0',
      dangerSoft: '#3A2440',
      tabBar: '#141831',
      overlay: 'rgba(0,0,0,0.6)',
      heart: '#E89AB0',
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

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)

/** Animations natives sur téléphone ; le web n'a pas de pilote natif (évite un avertissement console). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const NATIVE_DRIVER: boolean = (require('react-native') as typeof import('react-native')).Platform.OS !== 'web';
