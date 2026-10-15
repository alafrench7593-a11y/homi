/**
 * Direction artistique « Nacre & Velours »
 * Velours de nuit, verre fumé, filets champagne ; la nacre irisée (rose poudré,
 * lavande, champagne) est la signature : boutons principaux, sphère, bouton « + ».
 * La terracotta ne sert qu'au cœur et aux urgences.
 */

export const palette = {
  night: '#121633', // velours de nuit
  nightDeep: '#090B1F',
  nightSoft: '#1C2148',
  mist: '#F6F2EC', // porcelaine
  mistDeep: '#EFE9E1',
  milk: '#F6F0E6', // crème : texte sur fond nuit
  powder: '#EBCDC6', // rose poudré
  powderDeep: '#D9B1A8',
  clay: '#C77A62', // terracotta douce : cœur et urgences
  lavender: '#B5A8E3',
  lavenderInk: '#6E60B5',
  gold: '#D8BC85', // champagne
  goldInk: '#9C7A3C',
  ink: '#121633',
  inkSoft: '#5E5A73',
  white: '#FFFFFF',
  danger: '#B4433A',
  dangerSoft: '#F6DCD6',
};

/** Dégradé nacré, la signature visuelle. */
export const NACRE: [string, string, string] = ['#F2D7D0', '#D8CFF3', '#F3E6CF'];

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
  dawn: ['#F9DCD3', '#F8ECE7', '#E9E3F6'],
  day: ['#FFF6E8', '#FBF7F1', '#ECEEF9'],
  dusk: ['#F1C2B6', '#E6CFE0', '#CFC8EC'],
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
  // Clair : « Porcelaine »
  light: {
    name: 'light',
    isDark: false,
    colors: {
      background: palette.mist,
      backgroundAlt: palette.mistDeep,
      gradient: ['#FBF8F4', '#F6F2EC', '#F1EBF3'],
      surface: 'rgba(255,255,255,0.78)',
      surfaceAlt: 'rgba(255,255,255,0.55)',
      border: 'rgba(255,255,255,0.95)',
      text: palette.ink,
      textMuted: palette.inkSoft,
      primary: palette.night,
      primaryText: palette.milk,
      accent: palette.lavender,
      accentSoft: '#F4E4E0',
      lavender: palette.lavenderInk,
      gold: '#A8742A',
      success: '#3F7A5C',
      danger: palette.danger,
      dangerSoft: palette.dangerSoft,
      tabBar: 'rgba(18,22,51,0.96)',
      overlay: 'rgba(9,11,31,0.45)',
      heart: palette.clay,
    },
  },
  // Sombre : « Velours » — l'identité par défaut
  dark: {
    name: 'dark',
    isDark: true,
    colors: {
      background: '#0D1029',
      backgroundAlt: '#11153A',
      gradient: ['#1A1F4A', '#0D1029', '#07081A'],
      surface: '#141838',
      surfaceAlt: '#1C2148',
      border: 'rgba(216,188,133,0.20)',
      text: palette.milk,
      textMuted: '#B7B1CA',
      primary: palette.gold,
      primaryText: '#0D1029',
      accent: palette.lavender,
      accentSoft: '#2A2350',
      lavender: '#C9BEF2',
      gold: palette.gold,
      success: '#9CC9AA',
      danger: '#F09A8E',
      dangerSoft: '#3A1F2A',
      tabBar: 'rgba(9,11,31,0.94)',
      overlay: 'rgba(0,0,0,0.6)',
      heart: '#E59C86',
    },
  },
  // Mode nuit : très peu de lumière, chaleur ambrée, contraste suffisant
  night: {
    name: 'night',
    isDark: true,
    colors: {
      background: palette.nightDeep,
      backgroundAlt: '#11163A',
      gradient: ['#070A1C', '#0D1129', '#141A3D'],
      surface: '#161C40',
      surfaceAlt: '#1D2450',
      border: '#262E5C',
      text: '#F2DFC1',
      textMuted: '#B8A88F',
      primary: '#E2B884',
      primaryText: '#120F1E',
      accent: '#C49A7A',
      accentSoft: '#2B2A4A',
      lavender: '#A79BD2',
      gold: '#D9BC86',
      success: '#9CC1A2',
      danger: '#F0A0A0',
      dangerSoft: '#3B2030',
      tabBar: '#070A1C',
      overlay: 'rgba(0,0,0,0.6)',
      heart: '#E2B884',
    },
  },
};

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 14, lg: 20, xl: 30, pill: 999 };

export const fonts = {
  display: 'CormorantGaramond_500Medium',
  displayMedium: 'CormorantGaramond_600SemiBold',
  displayItalic: 'CormorantGaramond_500Medium_Italic',
  body: 'Jost_400Regular',
  bodyMedium: 'Jost_500Medium',
  bodyBold: 'Jost_600SemiBold',
};

/** Tailles de base ; elles suivent le réglage de taille de texte du téléphone (allowFontScaling). */
export const typeScale = {
  hero: { fontSize: 50, lineHeight: 52, letterSpacing: -0.5 },
  title: { fontSize: 36, lineHeight: 40, letterSpacing: -0.3 },
  heading: { fontSize: 23, lineHeight: 27, letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5, lineHeight: 17 },
};

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)
