/**
 * Thème HOMI v7 : huit thèmes + mode Adaptatif (sélecteur de l'accueil, Réglages → Apparence), trois apparences —
 * Système / Clair / Sombre (Noir graphite et Nuit améthyste restent sombres : `effectiveMode`).
 *  - Thème : `themePreview` (aperçu non confirmé du sélecteur) sinon `palettePreference` (un thème fixe, ou « adaptive » :
 *    le thème suit le profil affiché, `ADAPTIVE_PALETTE`). Une ancienne préférence devient le thème le plus proche.
 *  - Préférences par compte : au changement de session, `switchAppearanceOwner` charge les choix du compte.
 *  - Mode nuit (écran /night) : prioritaire, teinte de la palette très tamisée.
 *  - `phase` : moment de la journée (salutation de l'accueil), sans effet sur les couleurs.
 * Les composants lisent `useTheme()` ; aucun ne connaît le nom d'une palette.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { previewTime, resolvePalette, skyPhase, themeFor, themes, type PaletteName, type SkyPhase, type Theme, type ThemeName } from './tokens';
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
  const paletteChoice = useUiStore((s) => s.palettePreference);
  // aperçu du sélecteur « Personnaliser l'accueil » : prioritaire tant qu'il n'est ni appliqué ni annulé
  const preview = useUiStore((s) => s.themePreview);
  const profile = useUiStore((s) => s.adaptiveProfile);
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

  const paletteName = preview ?? resolvePalette(paletteChoice, profile);

  const value = useMemo(() => ({ theme: { ...themeFor(name, paletteName), phase }, reduceMotion }), [name, paletteName, phase, reduceMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Thème imposé à une partie de l'écran (paywall blanc : clair, Olive HOMI, quel que soit le réglage) ; « Réduire les
 * animations » et la phase du ciel restent ceux de l'appareil.
 */
export function ThemeScope({ mode, palette, children }: { mode: ThemeName; palette: PaletteName; children: React.ReactNode }) {
  const parent = useContext(ThemeContext);
  const value = useMemo(() => ({ theme: { ...themeFor(mode, palette), phase: parent.theme.phase }, reduceMotion: parent.reduceMotion }), [mode, palette, parent.theme.phase, parent.reduceMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;
export const useReduceMotion = () => useContext(ThemeContext).reduceMotion;
