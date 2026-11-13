/**
 * Thème HOMI v2 : apparence (Système / Clair / Sombre) × palette (Auto / Aurore / Crépuscule / Menthe / Iris).
 *  - Palette Auto : suit l'heure LOCALE (`autoPaletteAt`), avec un fondu de 60 min par paliers de 5 min autour de
 *    chaque bascule. Un seul minuteur, programmé au prochain palier (pas de rafraîchissement inutile hors fondu).
 *  - Aperçu : `skyOverride` (réglages) fige l'heure de l'Auto sur une heure représentative.
 *  - Préférences par compte : au changement de session, `switchAppearanceOwner` charge les choix du compte.
 *  - Mode nuit (écran /night) : prioritaire, palette atténuée.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, AppState, useColorScheme } from 'react-native';
import { AUTO_PREVIEW_PHASE, autoPaletteAt, blendAccents, buildTheme, PALETTES, previewTime, skyPhase, themes, type PaletteName, type SkyPhase, type Theme, type ThemeName } from './tokens';
import { useUiStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

interface ThemeContextValue {
  theme: Theme;
  reduceMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: themes.light, reduceMotion: false });

/** Horloge qui ne « bat » qu'aux instants où la couleur de l'Auto change réellement. */
function useAutoClock(enabled: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      const d = new Date();
      setNow(d);
      const wait = Math.max(1000, Math.min(autoPaletteAt(d).next.getTime() - d.getTime() + 500, 6 * 3600_000));
      timer = setTimeout(arm, wait);
    };
    arm();
    // Retour au premier plan : on recalcule tout de suite (le minuteur a pu être suspendu)
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') { if (timer) clearTimeout(timer); arm(); } });
    return () => { if (timer) clearTimeout(timer); sub.remove(); };
  }, [enabled]);
  return now;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useUiStore((s) => s.themePreference);
  const palettePref = useUiStore((s) => s.palettePreference) ?? 'auto';
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

  const auto = palettePref === 'auto';
  const clock = useAutoClock(auto && !skyOverride);
  const at = skyOverride ? previewTime(skyOverride) : clock;
  const state = auto ? autoPaletteAt(at) : null;
  const blendKey = state ? `${state.from}>${state.to}@${state.k.toFixed(3)}` : palettePref;

  // 'auto' (ancienne préférence : clair/sombre selon l'heure) est désormais lu comme « Système »
  const name: ThemeName = nightMode
    ? 'night'
    : preference === 'light' || preference === 'dark' || preference === 'night'
      ? preference
      : system === 'dark' ? 'dark' : 'light';
  const phase: SkyPhase = skyOverride ?? (state ? AUTO_PREVIEW_PHASE[state.dominant] : skyPhase(clock));

  const value = useMemo(() => {
    const pal: PaletteName = state ? state.dominant : (palettePref as PaletteName);
    const accents = state ? blendAccents(PALETTES[state.from], PALETTES[state.to], state.k) : PALETTES[pal] ?? PALETTES.aurore;
    const theme: Theme = { ...buildTheme(name, accents, pal), phase };
    return { theme, reduceMotion };
    // blendKey résume l'état de l'Auto (aucun recalcul tant que la couleur affichée ne change pas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, reduceMotion, blendKey, phase]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;
export const useReduceMotion = () => useContext(ThemeContext).reduceMotion;
