import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { SKY_GRADIENTS, skyPhase, themes, type SkyPhase, type Theme, type ThemeName } from './tokens';
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
  const skyOverride = useUiStore((s) => s.skyOverride);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [clock, setClock] = useState(() => skyPhase());
  useEffect(() => {
    const id = setInterval(() => setClock(skyPhase()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const phase: SkyPhase = skyOverride ?? clock;
  const name: ThemeName = nightMode
    ? 'night'
    : preference === 'auto'
      ? (phase === 'night' || phase === 'dusk' ? 'dark' : 'light')
      : preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => {
    const base = themes[name];
    const auto = preference === 'auto';
    const theme: Theme = auto && name !== 'night' && phase !== 'night'
      ? { ...base, phase, colors: { ...base.colors, gradient: SKY_GRADIENTS[phase] } }
      : { ...base, phase: auto ? phase : name === 'light' ? 'day' : 'night' };
    return { theme, reduceMotion };
  }, [name, reduceMotion, phase, preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;
export const useReduceMotion = () => useContext(ThemeContext).reduceMotion;
