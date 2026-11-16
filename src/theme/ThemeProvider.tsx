/**
 * Thème HOMI v5 « Lumière corail » : UNE identité (corail, rose chaud, lilas rare), trois apparences —
 * Système / Clair / Sombre (Réglages → Apparence). Plus de palette au choix ni d'Auto selon l'heure : une ancienne
 * préférence de palette est lue comme l'identité unique (`migratePalette`).
 *  - Préférences par compte : au changement de session, `switchAppearanceOwner` charge les choix du compte.
 *  - Mode nuit (écran /night) : prioritaire, prune tamisée.
 *  - `phase` : moment de la journée (salutation de l'accueil), sans effet sur les couleurs.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { previewTime, skyPhase, themes, type SkyPhase, type Theme, type ThemeName } from './tokens';
import { useUiStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

interface ThemeContextValue {
  theme: Theme;
  reduceMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: themes.light, reduceMotion: false });

/** Apparence affichée (logique pure, testée) : nuit prioritaire, puis le choix, puis le système. */
export function resolveThemeName(o: { nightMode: boolean; preference: string | null | undefined; system: string | null | undefined }): ThemeName {
  if (o.nightMode) return 'night';
  // 'auto' (ancienne préférence : clair/sombre selon l'heure) est lu comme « Système »
  if (o.preference === 'light' || o.preference === 'dark' || o.preference === 'night') return o.preference;
  return o.system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useUiStore((s) => s.themePreference);
  const nightMode = useUiStore((s) => s.nightMode);
  const skyOverride = useUiStore((s) => s.skyOverride);
  const switchOwner = useUiStore((s) => s.switchAppearanceOwner);
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  useEffect(() => { if (userId) switchOwner(userId); }, [userId, switchOwner]);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const name = resolveThemeName({ nightMode, preference, system });
  const phase: SkyPhase = skyOverride ?? skyPhase(skyOverride ? previewTime(skyOverride) : new Date());

  const value = useMemo(() => ({ theme: { ...themes[name], phase }, reduceMotion }), [name, phase, reduceMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;
export const useReduceMotion = () => useContext(ThemeContext).reduceMotion;
