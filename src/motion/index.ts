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
export { PressSheen, SHEEN_MS, usePressSheen } from './PressSheen';
export { COMPLETION, CompletionCheck, CompletionGlow } from './TaskComplete';
export { MORPH, MorphHost, MorphSource, MorphTarget, morphRegistry, useMorphSource } from './Morph';
export { Reveal, REVEAL } from './Reveal';
// Primitives « Liquid Glass » (17/11/2026) — voir HOMI_DESIGN_SYSTEM.md § 10 et MOTION_SYSTEM.md
export { auraMotion, favorite, liquidIndicator, logoMotion, reorder, shake, skeleton, successCheck, swap } from './curves';
export { usePress, type PressMotion } from './Press';
export { StaggerList } from './Stagger';
export { ContentSwap } from './ContentSwap';
export { useIndicator, useItemLayouts, type ItemLayout } from './Indicator';
export { FavoriteStar, useFavoritePop } from './Favorite';
export { useShake } from './Shake';
export { SuccessCheck } from './SuccessCheck';
export { SkeletonBone, SkeletonPulse } from './SkeletonPulse';
export { autoScrollSpeed, moveKey, ReorderList, reorderOffset, reorderOrder, reorderTotal, useReorderScroll, type ReorderItemInfo, type ReorderScroll } from './Reorder';
