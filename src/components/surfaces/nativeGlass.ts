/**
 * Détection protégée du Liquid Glass natif (iOS 26+, `expo-glass-effect` 57.0.5 déclaré dans package.json).
 * Chargé paresseusement et seulement sur iOS, après les DEUX vérifications recommandées par la bibliothèque
 * (`isLiquidGlassAvailable()` ET `isGlassEffectAPIAvailable()` : certaines bêtas d'iOS 26 plantaient sans la
 * seconde). Partout ailleurs : `null` → repli BlurView (iOS ancien, web) ou remplissage (Android).
 */
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, type StyleProp, type ViewStyle } from 'react-native';

export type NativeGlassProps = {
  glassEffectStyle?: 'clear' | 'regular' | 'none';
  children?: React.ReactNode;
  testID?: string;
  tintColor?: string;
  colorScheme?: 'auto' | 'light' | 'dark';
  isInteractive?: boolean;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'none' | 'auto';
};

export const NativeGlass: React.ComponentType<NativeGlassProps> | null = (() => {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('expo-glass-effect') as { GlassView: React.ComponentType<NativeGlassProps>; isLiquidGlassAvailable?: () => boolean; isGlassEffectAPIAvailable?: () => boolean };
    return m.isLiquidGlassAvailable?.() && m.isGlassEffectAPIAvailable?.() ? m.GlassView : null;
  } catch {
    return null;
  }
})();
export const LIQUID_GLASS_NATIVE = NativeGlass !== null;

/** Flou réel sur iOS et le web ; Android garde le remplissage translucide (flou natif trop coûteux en liste). */
export const BLUR_OK = Platform.OS === 'ios' || Platform.OS === 'web';

/**
 * « Réduire la transparence » : le verre devient opaque (voir `src/components/glass/Glass.tsx`).
 *  - iOS : Réglages → Accessibilité → Affichage et taille du texte → Réduire la transparence ;
 *  - web : `prefers-reduced-transparency: reduce` (là où le navigateur le publie) ;
 *  - Android : pas de réglage équivalent (et pas de flou sans cible de flou : le verre y est déjà opaque).
 */
export function useReduceTransparency(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const mq = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-transparency: reduce)') : null;
      if (!mq) return;
      setOn(mq.matches);
      const onChange = (e: { matches: boolean }) => setOn(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setOn).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}
