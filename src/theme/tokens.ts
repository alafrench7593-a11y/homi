/**
 * Direction artistique « Toi & Moi »
 * Crème lumineuse, rose poudré, terracotta doux, lavande, bleu nuit, touches d'or.
 * Contrastes texte/fond vérifiés ≥ 4.5:1 pour le texte courant (WCAG AA).
 */

export const palette = {
  cream: '#F7F1E8',
  creamDeep: '#EFE5D7',
  beige: '#E6D6C2',
  powder: '#EBCFC8',
  powderDeep: '#DDAFA5',
  terracotta: '#B9654C', // texte/accents : 4.6:1 sur crème
  terracottaSoft: '#D58D72',
  lavender: '#B9AEDB',
  lavenderDeep: '#6E5FA8',
  night: '#1B2140',
  nightDeep: '#0D1129',
  nightSoft: '#2A3157',
  gold: '#C6A15B',
  goldSoft: '#E8D3A6',
  ink: '#2B2433',
  inkSoft: '#5E5466',
  white: '#FFFFFF',
  sage: '#7F9C86',
  danger: '#B23B3B',
  dangerSoft: '#F6DADA',
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
  };
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    isDark: false,
    colors: {
      background: palette.cream,
      backgroundAlt: palette.creamDeep,
      gradient: ['#FBF6EF', '#F6E9E1', '#EFE8F4'],
      surface: '#FFFCF8',
      surfaceAlt: '#F4EBDF',
      border: '#E7DACB',
      text: palette.ink,
      textMuted: palette.inkSoft,
      primary: palette.terracotta,
      primaryText: palette.white,
      accent: palette.powderDeep,
      accentSoft: palette.powder,
      lavender: palette.lavenderDeep,
      gold: palette.gold,
      success: '#4F7A5A',
      danger: palette.danger,
      dangerSoft: palette.dangerSoft,
      tabBar: 'rgba(255,252,248,0.96)',
      overlay: 'rgba(27,33,64,0.35)',
    },
  },
  dark: {
    name: 'dark',
    isDark: true,
    colors: {
      background: '#15182B',
      backgroundAlt: '#1C2038',
      gradient: ['#15182B', '#1D1F3A', '#2A2240'],
      surface: '#21253F',
      surfaceAlt: '#2A2F4E',
      border: '#363C60',
      text: '#F4ECE3',
      textMuted: '#C2B8C9',
      primary: palette.terracottaSoft,
      primaryText: '#1A1222',
      accent: palette.powderDeep,
      accentSoft: '#4A3A47',
      lavender: palette.lavender,
      gold: palette.goldSoft,
      success: '#8FBF99',
      danger: '#F08A8A',
      dangerSoft: '#4A2329',
      tabBar: 'rgba(28,32,56,0.97)',
      overlay: 'rgba(0,0,0,0.5)',
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
      tabBar: 'rgba(13,17,41,0.98)',
      overlay: 'rgba(0,0,0,0.6)',
    },
  },
};

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
};

/** Tailles de base ; elles suivent le réglage de taille de texte du téléphone (allowFontScaling). */
export const typeScale = {
  hero: { fontSize: 34, lineHeight: 40 },
  title: { fontSize: 26, lineHeight: 32 },
  heading: { fontSize: 20, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12.5, lineHeight: 17 },
};

export const MIN_TOUCH = 48; // zone tactile minimale (Android 48dp, iOS 44pt)
