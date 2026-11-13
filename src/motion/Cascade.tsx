/**
 * Apparition en cascade (Reanimated) : fondu + montée de 10 px, décalée de 45 ms par rang (plafond 360 ms).
 *  - 'off' (Réduire les animations / économie d'énergie) : visible d'emblée, aucun décalage ;
 *  - 'minimal' (nuit) : fondu court sans déplacement ni décalage ;
 *  - transform + opacity uniquement, sur le fil UI ; animation annulée au démontage.
 */
import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { cascade, durations } from './curves';
import { useMotion } from './useMotion';

/** Délai d'un élément de rang `index` (plafonné : la liste ne fait jamais attendre). */
export function cascadeDelay(index: number, step: number = cascade.stepMs, max: number = cascade.maxDelayMs) {
  return Math.min(Math.max(0, index) * step, max);
}

/** Style animé d'apparition en cascade, à poser sur une Animated.View. */
export function useCascade(index = 0, opts: { distance?: number; ms?: number } = {}) {
  const m = useMotion();
  const distance = opts.distance ?? cascade.distance;
  const ms = opts.ms ?? durations.entrance;
  // État final immédiat quand le mouvement est coupé (pas de flash d'opacité 0 au montage)
  const p = useSharedValue(m.off ? 1 : 0);
  const move = m.level === 'full';
  useEffect(() => {
    p.value = m.delay(cascadeDelay(index), m.timing(1, ms, 'decelerate'));
    return () => cancelAnimation(p);
    // une seule entrée par montage ; un changement de niveau en cours de route rejoint l'état final
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (m.off) {
      cancelAnimation(p);
      p.value = 1;
    }
  }, [m.off, p]);
  return useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: move ? (1 - p.value) * distance : 0 }],
  }));
}

export function Cascade({ index = 0, children, style, testID }: { index?: number; children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const animated = useCascade(index);
  return <Animated.View testID={testID} style={[style, animated]}>{children}</Animated.View>;
}
