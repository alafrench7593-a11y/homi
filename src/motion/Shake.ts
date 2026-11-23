/**
 * SECOUSSE D'ERREUR — un champ refusé (ou un bouton dont l'action échoue) tremble brièvement de gauche à droite :
 * 5 pas décroissants, ≈ 275 ms, sur le fil UI. Haptique « erreur » au départ. Toujours accompagnée d'un message :
 * la secousse ne dit pas POURQUOI.
 *
 *  - 'off' / 'minimal' : aucune secousse (le message et la couleur d'erreur suffisent).
 *
 *   const s = useShake();
 *   <Animated.View style={s.style}><Field error={err} /></Animated.View>
 *   onSubmit: if (!valid) s.shake();
 */
import { useCallback, useEffect } from 'react';
import { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { curves, shake as SHAKE } from './curves';
import { motionHaptic } from './haptics';
import { useMotion } from './useMotion';

export function useShake(opts: { haptic?: boolean } = {}) {
  const m = useMotion();
  const x = useSharedValue(0);
  const full = m.level === 'full';
  const haptic = opts.haptic !== false;
  const shake = useCallback(() => {
    if (haptic) motionHaptic('error');
    if (!full) return;
    const step = { duration: SHAKE.stepMs, easing: curves.standard, reduceMotion: ReduceMotion.Never };
    x.value = withSequence(...SHAKE.steps.map((to) => withTiming(to, step)));
  }, [full, haptic, x]);
  useEffect(() => () => cancelAnimation(x), [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return { style, shake, x };
}
