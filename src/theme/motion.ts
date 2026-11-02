/**
 * Système de mouvement unique de l'application (« full motion design »).
 *
 * Règles :
 *  - on n'anime que transform et opacity (pas de décalage de mise en page) ;
 *  - la durée suit l'importance du geste (retour immédiat < 120 ms, entrée d'écran ~ 420 ms) ;
 *  - les ressorts donnent une sensation organique sans rebond excessif ;
 *  - « réduire les animations » (iOS/Android/prefers-reduced-motion) : états finaux immédiats.
 */
import { Animated, Easing, Platform } from 'react-native';
import { NATIVE_DRIVER } from './tokens';

export const duration = {
  instant: 90,   // retour de pression
  fast: 160,     // micro-interactions (pastille, interrupteur)
  base: 240,     // changements d'état (focus, onglet)
  slow: 380,     // panneaux, feuilles
  entrance: 520, // apparition d'écran / de contenu
  screen: 280,   // transition de navigation (pile d'écrans)
};

export const easing = {
  /** cubic-bezier(0.16, 1, 0.3, 1) : décélération longue, signature de l'app */
  decelerate: Easing.bezier(0.16, 1, 0.3, 1),
  standard: Easing.bezier(0.2, 0, 0, 1),
  accelerate: Easing.bezier(0.3, 0, 1, 1),
  /** révélation progressive (masque du logo) : départ et arrivée doux, vitesse régulière au milieu */
  reveal: Easing.bezier(0.45, 0, 0.25, 1),
};

/**
 * Interactions des boutons et zones tactiles (une seule source pour toute l'application) :
 * pression à 0,98 en 120 ms, relâchement en 200 ms, soulèvement d'1 px au survol (web) en 180 ms (sobre, sans effet gadget).
 */
export const interaction = {
  pressScale: 0.98,
  pressInMs: 120,
  pressOutMs: 200,
  hoverLift: -1,
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

/**
 * Retours d'état des boutons et des formulaires (une seule source) :
 *  - succès : légère respiration du bouton (1 → 1,03 → 1) quand l'action se termine vraiment ;
 *  - erreur : tremblement horizontal court (≈ 280 ms) ;
 *  - désactivation : fondu de l'opacité au lieu d'un changement brutal.
 */
export const feedback = {
  successScale: 1.03,
  shake: [6, -5, 4, -2, 0] as const,
  shakeStepMs: 55,
  disabledOpacity: 0.48,
  disabledMs: 180,
};

/**
 * Introduction d'ouverture (lancement à froid) : fond aux couleurs de l'app, révélation du logo, profondeur
 * légère, puis fondu vers le premier écran. Total ≈ 1,9 s ; le premier écran se charge en dessous pendant ce temps
 * (rien n'attend l'animation) et reste utilisable au toucher dès le début.
 */
export const intro = {
  revealDelayMs: 120,  // le fond seul, dans la continuité de l'écran de lancement natif
  revealMs: 820,       // le fil doré se révèle de la tige vers les feuilles
  holdMs: 300,         // pose
  exitMs: 520,         // fondu du calque + légère avancée du logo (profondeur)
  logoFromScale: 0.94,
  logoExitScale: 1.06,
  splashFadeMs: 220,   // fondu de l'écran de lancement natif vers l'introduction
};
export const introTotalMs = intro.revealDelayMs + intro.revealMs + intro.holdMs + intro.exitMs;

/** Retour haptique : jamais sur le web (le navigateur n'en a pas, ou vibre de façon inattendue). */
export const hapticsSupported = Platform.OS !== 'web';

/** Décalage en cascade : 45 ms par élément, plafonné pour ne jamais faire attendre. */
export const stagger = (index: number, step = 45, max = 360) => Math.min(index * step, max);

/**
 * Pause dans une boucle décorative. Animated.delay compte comme une interaction en cours :
 * dans une boucle infinie, InteractionManager ne se libère jamais et les longues listes
 * (rendu par lots) restent bloquées à leur premier lot sur le web (QA E2E, bibliothèque).
 */
export function ambientDelay(ms: number): Animated.CompositeAnimation {
  return Animated.timing(new Animated.Value(0), { toValue: 0, duration: 0, delay: ms, useNativeDriver: false, isInteraction: false });
}

/** `ambient` : animation décorative (boucle) qui ne doit pas retarder les tâches après interaction. */
export function springTo(v: Animated.Value, toValue: number, kind: keyof typeof spring, reduce: boolean, ambient = false) {
  if (reduce) {
    v.setValue(toValue);
    return { start: (cb?: Animated.EndCallback) => cb?.({ finished: true }), stop: () => undefined, reset: () => undefined } as unknown as Animated.CompositeAnimation;
  }
  return Animated.spring(v, { toValue, ...spring[kind], useNativeDriver: NATIVE_DRIVER, isInteraction: !ambient });
}

/** Tremblement horizontal court (erreur, refus) sur une valeur de translation X. */
export function shakeX(v: Animated.Value, reduce: boolean): Animated.CompositeAnimation {
  if (reduce) return timeTo(v, 0, 0, true);
  v.setValue(0);
  return Animated.sequence(feedback.shake.map((toValue) => Animated.timing(v, { toValue, duration: feedback.shakeStepMs, useNativeDriver: NATIVE_DRIVER })));
}

/** Respiration de réussite sur une valeur d'échelle (repos = 1). */
export function successPulse(v: Animated.Value, reduce: boolean): Animated.CompositeAnimation {
  if (reduce) return timeTo(v, 1, 0, true);
  return Animated.sequence([
    Animated.timing(v, { toValue: feedback.successScale, duration: duration.fast, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER }),
    Animated.spring(v, { toValue: 1, ...spring.release, useNativeDriver: NATIVE_DRIVER }),
  ]);
}

export function timeTo(v: Animated.Value, toValue: number, ms: number, reduce: boolean, ease = easing.decelerate, native = NATIVE_DRIVER) {
  if (reduce) {
    v.setValue(toValue);
    return { start: (cb?: Animated.EndCallback) => cb?.({ finished: true }), stop: () => undefined, reset: () => undefined } as unknown as Animated.CompositeAnimation;
  }
  return Animated.timing(v, { toValue, duration: ms, easing: ease, useNativeDriver: native });
}
