/**
 * Direction artistique « Aurore » — immersive et chaleureuse.
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
export const NACRE: [string, string, string] = ['#FFB38A', '#FF7FA8', '#A98BFF'];

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
  dawn: ['#FFE3EA', '#FFF2F5', '#FFEFE8'],
  day: ['#FFF7F9', '#FFF1F4', '#FFE9F0'],
  dusk: ['#3A1630', '#1E0C19', '#120810'],
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
      background: '#FFF6EF',
      backgroundAlt: '#FFEDE6',
      gradient: ['#FFF7F0', '#FFF2F1', '#F6F1FC'],
      surface: 'rgba(255,255,255,0.68)',
      surfaceAlt: 'rgba(255,255,255,0.46)',
      border: 'rgba(255,255,255,0.9)',
      text: '#2A1A26',
      textMuted: '#7E6873',
      primary: '#E9587C',
      primaryText: '#FFFFFF',
      accent: '#FFB3C8',
      accentSoft: 'rgba(255,179,200,0.35)',
      lavender: '#7A5CE0',
      gold: '#C2416E',
      success: '#2F8A5B',
      danger: palette.danger,
      dangerSoft: palette.dangerSoft,
      tabBar: 'rgba(42,26,38,0.86)',
      overlay: 'rgba(42,26,38,0.35)',
      heart: '#F0577F',
    },
  },
  // Soir & nuit : « Rose nuit »
  dark: {
    name: 'dark',
    isDark: true,
    colors: {
      background: '#170F22',
      backgroundAlt: '#1D1329',
      gradient: ['#2A1834', '#1C1128', '#120B1C'],
      surface: 'rgba(255,255,255,0.07)',
      surfaceAlt: 'rgba(255,255,255,0.11)',
      border: 'rgba(255,255,255,0.12)',
      text: '#FFF4EE',
      textMuted: '#CDB8C6',
      primary: '#FF86A8',
      primaryText: '#2A0F1E',
      accent: '#FF9BB8',
      accentSoft: 'rgba(255,134,168,0.16)',
      lavender: '#C3B2FF',
      gold: '#FFB38A',
      success: '#9FE0B5',
      danger: '#FF8A8A',
      dangerSoft: 'rgba(255,90,90,0.16)',
      tabBar: 'rgba(28,17,40,0.82)',
      overlay: 'rgba(0,0,0,0.55)',
      heart: '#FF86A8',
    },
  },
  // Mode nuit (suivi de bébé à 3 h du matin) : très peu de lumière, rose tamisé
  night: {
    name: 'night',
    isDark: true,
    colors: {
      background: '#0C060A',
      backgroundAlt: '#140A11',
      gradient: ['#0C060A', '#120810', '#180B15'],
      surface: '#1A0E17',
      surfaceAlt: '#22131D',
      border: '#2E1A27',
      text: '#F3D6DF',
      textMuted: '#B8939F',
      primary: '#E89AB0',
      primaryText: '#140A11',
      accent: '#C98197',
      accentSoft: '#2A1622',
      lavender: '#B7A3E6',
      gold: '#E89AB0',
      success: '#9CC1A2',
      danger: '#F0A0A0',
      dangerSoft: '#3B2030',
      tabBar: '#0C060A',
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
