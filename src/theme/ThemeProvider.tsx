/**
 * Thème HOMI v4 : apparence (Système / Clair / Sombre) × palette (Auto / Brume pêche / Aurore lilas / Lagune turquoise /
 * Ambre minéral). Une préférence v3 encore enregistrée est lue comme la palette v4 la plus proche (`migratePalette`).
 *  - Changement de palette (choix manuel) : lumière, reflets, accents et scène sont INTERPOLÉS ENSEMBLE (un seul
 *    mélange de palettes, `blendAccents`) en 4 paliers sur ≈ 360 ms (famille « scène »). Réduire les animations,
 *    économie d'énergie ou nuit : changement immédiat (le fond garde son fondu simple).
 *  - Palette Auto : suit l'heure LOCALE (`autoPaletteAt`), avec un fondu de 60 min par paliers de 5 min autour de
 *    chaque bascule. Un seul minuteur, programmé au prochain palier (pas de rafraîchissement inutile hors fondu).
 *  - Aperçu : `skyOverride` (réglages) fige l'heure de l'Auto sur une heure représentative.
 *  - Préférences par compte : au changement de session, `switchAppearanceOwner` charge les choix du compte.
 *  - Mode nuit (écran /night) : prioritaire, palette atténuée.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, useColorScheme } from 'react-native';
import { AUTO_PREVIEW_PHASE, autoPaletteAt, blendAccents, buildTheme, migratePalette, PALETTES, previewTime, SIGNATURE_PALETTE, skyPhase, themes, type PaletteAccents, type PaletteName, type SkyPhase, type Theme, type ThemeName } from './tokens';
import { useLowPower } from '@/lib/lowPower';
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

/** Transition de palette : paliers et durée (testés). */
export const PALETTE_TWEEN = { steps: 4, stepMs: 90 } as const;
const easeOut = (k: number) => 1 - (1 - k) * (1 - k);

/**
 * Accents affichés : suivent `target` ; quand `key` change et que `animate` est vrai, on passe de la couleur affichée
 * à la nouvelle en `PALETTE_TWEEN.steps` paliers (un seul minuteur, annulé si un autre choix arrive : interruptible).
 */
function usePaletteTween(target: PaletteAccents, key: string, animate: boolean): PaletteAccents {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  const lastKey = useRef(key);
  useEffect(() => {
    const changed = lastKey.current !== key;
    lastKey.current = key;
    if (!changed || !animate) {
      current.current = target;
      setShown(target);
      return;
    }
    const from = current.current;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const v = i >= PALETTE_TWEEN.steps ? target : blendAccents(from, target, easeOut(i / PALETTE_TWEEN.steps));
      current.current = v;
      setShown(v);
      if (i >= PALETTE_TWEEN.steps) clearInterval(id);
    }, PALETTE_TWEEN.stepMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, key, animate]);
  return animate ? shown : target;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useUiStore((s) => s.themePreference);
  const palettePref = migratePalette(useUiStore((s) => s.palettePreference));
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

  const lowPower = useLowPower();
  const pal: PaletteName = state ? state.dominant : PALETTES[palettePref as PaletteName] ? (palettePref as PaletteName) : SIGNATURE_PALETTE;
  // blendKey résume l'état de l'Auto (aucun recalcul tant que la couleur affichée ne change pas)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target = useMemo(() => (state ? blendAccents(PALETTES[state.from], PALETTES[state.to], state.k) : PALETTES[pal]), [blendKey, pal]);
  // Choix manuel : transition animée ; paliers de l'Auto : déjà progressifs (pas de seconde transition)
  const accents = usePaletteTween(target, `${palettePref}|${skyOverride ?? ''}`, !reduceMotion && !lowPower && name !== 'night');
  const accentsKey = `${accents.ink.join()}${accents.glow.join()}`;

  const value = useMemo(() => {
    const theme: Theme = { ...buildTheme(name, accents, pal), phase };
    return { theme, reduceMotion };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, reduceMotion, accentsKey, pal, phase]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext).theme;
export const useReduceMotion = () => useContext(ThemeContext).reduceMotion;
