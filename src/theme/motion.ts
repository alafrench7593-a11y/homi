/**
 * Système de mouvement unique de l'application (« full motion design »).
 *
 * Règles :
 *  - on n'anime que transform et opacity (pas de décalage de mise en page) ;
 *  - la durée suit l'importance du geste (retour immédiat < 120 ms, entrée d'écran ~ 420 ms) ;
 *  - les ressorts donnent une sensation organique sans rebond excessif ;
 *  - « réduire les animations » (iOS/Android/prefers-reduced-motion) : états finaux immédiats.
 */
import { Animated, Easing } from 'react-native';
import { NATIVE_DRIVER } from './tokens';

export const duration = {
  instant: 90,   // retour de pression
  fast: 160,     // micro-interactions (pastille, interrupteur)
  base: 240,     // changements d'état (focus, onglet)
  slow: 380,     // panneaux, feuilles
  entrance: 520, // apparition d'écran / de contenu
};

export const easing = {
  /** cubic-bezier(0.16, 1, 0.3, 1) : décélération longue, signature de l'app */
  decelerate: Easing.bezier(0.16, 1, 0.3, 1),
  standard: Easing.bezier(0.2, 0, 0, 1),
  accelerate: Easing.bezier(0.3, 0, 1, 1),
};

/**
 * Interactions des boutons et zones tactiles (une seule source pour toute l'application) :
 * pression à 0,97 en 120 ms, relâchement en 200 ms, soulèvement de 2 px au survol (web) en 180 ms.
 */
export const interaction = {
  pressScale: 0.97,
  pressInMs: 120,
  pressOutMs: 200,
  hoverLift: -2,
  hoverMs: 180,
  iconNudge: 2,
};

/** Ressorts (Animated.spring : tension / friction). */
export const spring = {
  press: { tension: 420, friction: 26 },   // pression : ferme et immédiate
  release: { tension: 260, friction: 14 }, // relâchement : léger rebond
  pop: { tension: 300, friction: 12 },     // sélection, validation
  gentle: { tension: 140, friction: 20 },  // panneaux, glissements
};

/** Décalage en cascade : 45 ms par élément, plafonné pour ne jamais faire attendre. */
export const stagger = (index: number, step = 45, max = 360) => Math.min(index * step, max);

export function springTo(v: Animated.Value, toValue: number, kind: keyof typeof spring, reduce: boolean) {
  if (reduce) {
    v.setValue(toValue);
    return { start: (cb?: Animated.EndCallback) => cb?.({ finished: true }), stop: () => undefined, reset: () => undefined } as unknown as Animated.CompositeAnimation;
  }
  return Animated.spring(v, { toValue, ...spring[kind], useNativeDriver: NATIVE_DRIVER });
}

export function timeTo(v: Animated.Value, toValue: number, ms: number, reduce: boolean, ease = easing.decelerate, native = NATIVE_DRIVER) {
  if (reduce) {
    v.setValue(toValue);
    return { start: (cb?: Animated.EndCallback) => cb?.({ finished: true }), stop: () => undefined, reset: () => undefined } as unknown as Animated.CompositeAnimation;
  }
  return Animated.timing(v, { toValue, duration: ms, easing: ease, useNativeDriver: native });
}
