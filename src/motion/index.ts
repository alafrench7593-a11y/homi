/**
 * Système de mouvement HOMI (Reanimated) — point d'entrée. Voir MOTION_SYSTEM.md.
 * Toute primitive passe par useMotion() : Réduire les animations + économie d'énergie → état final immédiat,
 * thème nuit → animations minimales.
 */
export { bezier, cardLift, cascade, counter, curves, dampingRatio, durations, morph, press, springs, type Curve, type CurveName, type SpringName } from './curves';
export { motionDelay, motionDuration, motionFor, motionSpring, motionTiming, resolveMotionLevel, useMotion, type Motion, type MotionLevel } from './useMotion';
export { motionHaptic, type MotionHaptic } from './haptics';
export { Cascade, cascadeDelay, useCascade } from './Cascade';
export { PressableScale, usePressScale } from './PressableScale';
export { DetailEnter, LiftCard, useCardLift } from './CardTransition';
export { AnimatedNumber, formatCounter, localeSeparators } from './AnimatedNumber';
export { MorphIcon } from './MorphIcon';
export { MORPH_MODULE, MORPH_POINTS, MORPH_SHAPES, morphPath, type MorphShape } from './morphShapes';
