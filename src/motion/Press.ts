/**
 * PRESSION — la primitive de tout ce qui se touche dans la bibliothèque de verre.
 *
 * Compression à 0,97 en ressort « vif » dès l'appui (le retour part au contact, pas au relâchement), retour en
 * ressort « doux » (aucun rebond : un contrôle se touche des dizaines de fois par jour), haptique léger au contact.
 * Publie aussi `progress` (0 → 1) pour ce qui accompagne la pression : voile d'appui, ombre qui se resserre.
 *
 *  - 'off' (Réduire les animations, économie d'énergie) : aucune échelle, `progress` passe de 0 à 1 sans transition
 *    (le voile d'appui reste : le retour visuel ne disparaît jamais) ;
 *  - 'minimal' (nuit) : fondu court, sans ressort ;
 *  - l'action part au relâchement normal du Pressable, jamais après la fin de l'animation.
 *
 *   const p = usePress();
 *   <Pressable onPressIn={p.onPressIn} onPressOut={p.onPressOut}><Animated.View style={p.style}>…</Animated.View></Pressable>
 */
import { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { press } from './curves';
import { motionHaptic, type MotionHaptic } from './haptics';
import { useMotion } from './useMotion';

export interface PressMotion {
  /** 0 au repos, 1 enfoncé */
  progress: SharedValue<number>;
  /** échelle animée, à poser sur la surface (pas sur le cadre tactile) */
  style: ReturnType<typeof useAnimatedStyle>;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function usePress(opts: { scale?: number; haptic?: MotionHaptic; disabled?: boolean } = {}): PressMotion {
  const m = useMotion();
  const progress = useSharedValue(0);
  const depth = 1 - (opts.scale ?? press.scale);
  const still = m.off;
  const style = useAnimatedStyle(() => ({ transform: [{ scale: still ? 1 : 1 - depth * progress.value }] }));
  return {
    progress,
    style,
    onPressIn: () => {
      if (opts.disabled) return;
      progress.value = m.spring(1, 'vif');
      motionHaptic(opts.haptic ?? 'light');
    },
    onPressOut: () => {
      progress.value = m.spring(0, 'doux');
    },
  };
}
