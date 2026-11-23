/**
 * Réorganisation douce d'une liste (une ligne validée rejoint « fait », les autres remontent) : transition de mise en
 * page Reanimated (`layout` d'un Animated.View). Mouvement complet : 280 ms `decelerate` ; nuit : fondu de place
 * court (160 ms) ; Réduire les animations / économie d'énergie : aucune (la ligne se pose directement).
 */
import { useMemo } from 'react';
import { Easing, LinearTransition } from 'react-native-reanimated';
import { useMotion } from '@/motion';

export function useListLayout() {
  const m = useMotion();
  return useMemo(() => {
    if (m.off) return undefined;
    // même courbe que `decelerate` (src/motion/curves.ts)
    return LinearTransition.duration(m.minimal ? 160 : 280).easing(Easing.bezier(0.16, 1, 0.3, 1));
  }, [m.off, m.minimal]);
}
