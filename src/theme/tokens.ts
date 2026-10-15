/**
 * Direction artistique « Toi & Moi »
 * « Neuf lunes » : la nuit indigo structure, la lavande brumeuse enveloppe,
 * le rose poudré réchauffe, la terracotta ne sert qu'au cœur et aux alertes, l'or trace la lune.
 * Contrastes texte/fond vérifiés ≥ 4.5:1 pour le texte courant (WCAG AA).
 */

export const palette = {
  night: '#1E2350', // nuit indigo : couleur de structure
  nightDeep: '#0E1233',
  nightSoft: '#2C3266',
  mist: '#ECE8F4', // lavande brumeuse : fond
  mistDeep: '#E0DAF2',
  milk: '#FBF8F4', // crème : surfaces « papier »
  powder: '#F3D9D3', // rose poudré
  powderDeep: '#E8BFB6',
  clay: '#C2654E', // terracotta douce : cœur et alertes uniquement
  lavender: '#9C8FD0',
  lavenderInk: '#5B4FA0',
  gold: '#C8A35E',
  goldInk: '#8C6A2C',
  ink: '#1E2350',
  inkSoft: '#575680',
  white: '#FFFFFF',
  danger: '#B4433A',
  dangerSoft: '#F6DCD6',
};

export type ThemeName = 'light' | 'dark' | 'night';

export interface Theme {
  name: ThemeName;
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
  light: {
    name: 'light',
    isDark: false,
    colors: {
      background: palette.mist,
      backgroundAlt: palette.mistDeep,
      gradient: ['#F0EDF7', '#ECE8F4', '#F4E4E2'],
      surface: palette.milk,
      surfaceAlt: '#E6E1F2',
      border: '#D8D1EA',
      text: palette.ink,
      textMuted: palette.inkSoft,
      primary: palette.night,
      primaryText: palette.milk,
      accent: palette.lavender,
      accentSoft: palette.powder,
      lavender: palette.lavenderInk,
      gold: palette.goldInk,
      success: '#3F7A5C',
      danger: palette.danger,
      dangerSoft: palette.dangerSoft,
      tabBar: palette.night,
      overlay: 'rgba(14,18,51,0.45)',
      heart: palette.clay,
    },
  },
  dark: {
    name: 'dark',
    isDark: true,
    colors: {
      background: '#12152E',
      backgroundAlt: '#181C3C',
      gradient: ['#12152E', '#171A3A', '#221A36'],
      surface: '#1C2045',
      surfaceAlt: '#262B57',
      border: '#323867',
      text: '#EDE8F6',
      textMuted: '#B6B0CF',
      primary: '#CFC6F2',
      primaryText: '#12152E',
      accent: palette.lavender,
      accentSoft: '#3A2E45',
      lavender: '#C3B8EE',
      gold: '#E2C68F',
      success: '#8FC5A2',
      danger: '#F09A8E',
      dangerSoft: '#46232A',
      tabBar: '#0B0E26',
      overlay: 'rgba(0,0,0,0.55)',
      heart: '#E7907A',
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
export const radius = { sm: 10, md: 14, lg: 22, xl: 36, pill: 999 };

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_500Medium',
  displayItalic: 'BricolageGrotesque_500Medium', // pas d'italique décoratif
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodyBold: 'Figtree_600SemiBold',
};

/** Tailles de base ; elles suivent le réglage de taille de texte du téléphone (allowFontScaling). */
export const typeScale = {
  hero: { fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  title: { fontSize: 30, lineHeight: 34, letterSpacing: -0.8 },
  heading: { fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5, lineHeight: 17 },
};

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)
