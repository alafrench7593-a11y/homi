import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { themes, type Theme, type ThemeName } from './tokens';
import { useUiStore } from '@/lib/store';

interface ThemeContextValue {
  theme: Theme;
  reduceMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: themes.light, reduceMotion: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useUiStore((s) => s.themePreference);
  const nightMode = useUiStore((s) => s.nightMode);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const name: ThemeName = nightMode ? 'night' : preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ theme: themes[name], reduceMotion }), [name, reduceMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;
export const useReduceMotion = () => useContext(ThemeContext).reduceMotion;
