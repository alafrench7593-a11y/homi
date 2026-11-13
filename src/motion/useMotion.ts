/**
 * Hook unique du système de mouvement HOMI (Reanimated) : toutes les primitives de src/motion passent par lui.
 *
 * Niveau de mouvement :
 *  - 'off'     : « Réduire les animations » (système) OU mode économie d'énergie → durée 0, état final immédiat ;
 *  - 'minimal' : thème nuit (soins nocturnes) → pas de rebond, pas de cascade, pas de déplacement :
 *                fondus courts uniquement, rien de permanent ;
 *  - 'full'    : mouvement complet (ressorts, cascades, tracés).
 *
 * Les animateurs (`timing`, `spring`, `delay`) sont des worklets : appelables depuis le fil JS comme depuis un
 * geste (fil UI). En 'off', ils renvoient directement la valeur cible (aucune animation créée).
 */
import { useMemo } from 'react';
import { ReduceMotion, withDelay, withSpring, withTiming, type AnimationCallback } from 'react-native-reanimated';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { useLowPower } from '@/lib/lowPower';
import { curves, durations, springs, type CurveName, type SpringName } from './curves';

export type MotionLevel = 'off' | 'minimal' | 'full';

/** Décision pure (testée) du niveau de mouvement. */
export function resolveMotionLevel(o: { reduceMotion: boolean; lowPower: boolean; night: boolean }): MotionLevel {
  if (o.reduceMotion || o.lowPower) return 'off';
  if (o.night) return 'minimal';
  return 'full';
}

/** Durée effective d'une animation selon le niveau (0 en 'off', plafonnée à `fast` en 'minimal'). */
export function motionDuration(level: MotionLevel, ms: number): number {
  'worklet';
  if (level === 'off') return 0;
  if (level === 'minimal') return Math.min(ms, durations.fast);
  return ms;
}

/**
 * Animation temporelle vers `to`. 'off' → valeur finale immédiate (et rappel `finished = true` synchrone).
 * ReduceMotion.Never : la décision est déjà prise ici (une seule source de vérité, réglage + économie d'énergie).
 */
export function motionTiming(level: MotionLevel, to: number, ms: number = durations.base, curve: CurveName = 'decelerate', cb?: AnimationCallback): number {
  'worklet';
  if (level === 'off') {
    if (cb) cb(true);
    return to;
  }
  return withTiming(to, { duration: motionDuration(level, ms), easing: curves[level === 'minimal' ? 'standard' : curve], reduceMotion: ReduceMotion.Never }, cb);
}

/** Ressort nommé vers `to`. 'minimal' → court fondu temporel sans rebond ; 'off' → valeur finale immédiate. */
export function motionSpring(level: MotionLevel, to: number, name: SpringName = 'doux', cb?: AnimationCallback): number {
  'worklet';
  if (level === 'off') {
    if (cb) cb(true);
    return to;
  }
  if (level === 'minimal') return withTiming(to, { duration: durations.fast, easing: curves.standard, reduceMotion: ReduceMotion.Never }, cb);
  return withSpring(to, { ...springs[name], reduceMotion: ReduceMotion.Never }, cb);
}

/** Retard avant une animation ('off' et 'minimal' : aucun retard — on n'attend jamais la nuit). */
export function motionDelay(level: MotionLevel, ms: number, animation: number): number {
  'worklet';
  if (level !== 'full' || ms <= 0) return animation;
  return withDelay(ms, animation, ReduceMotion.Never);
}

export type Motion = {
  level: MotionLevel;
  /** true si aucune animation ne doit jouer (durée 0, état final immédiat) */
  off: boolean;
  /** true en thème nuit (animations minimales) */
  minimal: boolean;
  timing: (to: number, ms?: number, curve?: CurveName, cb?: AnimationCallback) => number;
  spring: (to: number, name?: SpringName, cb?: AnimationCallback) => number;
  delay: (ms: number, animation: number) => number;
  duration: (ms: number) => number;
};

/** Construit l'objet `Motion` pour un niveau donné (utile aux tests et aux composants hors thème). */
export function motionFor(level: MotionLevel): Motion {
  return {
    level,
    off: level === 'off',
    minimal: level === 'minimal',
    timing: (to, ms, curve, cb) => motionTiming(level, to, ms, curve, cb),
    spring: (to, name, cb) => motionSpring(level, to, name, cb),
    delay: (ms, animation) => motionDelay(level, ms, animation),
    duration: (ms) => motionDuration(level, ms),
  };
}

/** Hook unique : « Réduire les animations » + économie d'énergie + thème nuit. */
export function useMotion(): Motion {
  const reduceMotion = useReduceMotion();
  const lowPower = useLowPower();
  const night = useTheme().name === 'night';
  const level = resolveMotionLevel({ reduceMotion, lowPower, night });
  return useMemo(() => motionFor(level), [level]);
}
