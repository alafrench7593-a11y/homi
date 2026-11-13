/**
 * Pression (Reanimated) : enfoncement en ressort « vif », relâchement en « rebond léger », haptique discrète.
 *  - l'action part au relâchement normal du Pressable, jamais après la fin de l'animation ;
 *  - 'off' : aucune échelle (le retour visuel passe par l'opacité système du Pressable) ;
 *  - 'minimal' (nuit) : enfoncement court, sans rebond ; haptique seulement si autorisée la nuit (réglage).
 * Le cadre tactile (Pressable) ne bouge pas : seule la surface intérieure change d'échelle.
 */
import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { press } from './curves';
import { motionHaptic, type MotionHaptic } from './haptics';
import { useMotion } from './useMotion';

/** Échelle animée de pression + gestionnaires à brancher sur un Pressable. */
export function usePressScale(opts: { scale?: number; haptic?: MotionHaptic } = {}) {
  const m = useMotion();
  const s = useSharedValue(1);
  const pressed = opts.scale ?? press.scale;
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    scale: s,
    onPressIn: () => {
      if (!m.off) s.value = m.spring(pressed, 'vif');
      motionHaptic(opts.haptic ?? 'light');
    },
    onPressOut: () => {
      s.value = m.spring(1, 'rebondLeger');
    },
  };
}

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** style du cadre tactile (marges, alignement) ; `style` s'applique à la surface animée */
  containerStyle?: StyleProp<ViewStyle>;
  scale?: number;
  haptic?: MotionHaptic;
};

export function PressableScale({ children, style, containerStyle, scale, haptic, onPressIn, onPressOut, ...rest }: Props) {
  const p = usePressScale({ scale, haptic: rest.disabled ? 'none' : haptic });
  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => { p.onPressIn(); onPressIn?.(e); }}
      onPressOut={(e) => { p.onPressOut(); onPressOut?.(e); }}
    >
      <Animated.View style={[style, p.style]}>{children}</Animated.View>
    </Pressable>
  );
}
