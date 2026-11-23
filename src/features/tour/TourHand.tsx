/**
 * Main de la visite guidée (remplace le « point » / doigt fantôme, 20/11/2026) : une main stylisée au trait d'encre
 * (même rondeur que le symbole HOMI et les pictogrammes `HomiIcon` : angles arrondis, trait 1,75 sur une grille de 48),
 * paume en aplat de la surface, légère ombre portée (même tracé décalé, encre à 14 %).
 *
 * Trois gestes, sur le fil UI, pilotés par UNE valeur partagée (0 → 1 en boucle) :
 *  - `tap`   : la main arrive (8 px, ease-out), APPUIE (0,92 + 2 px), une onde part du bout du doigt, la main se relève ;
 *  - `swipe` : appui, puis trajectoire COURBE (arc de 12 px) de gauche à droite, relâche, fondu ;
 *  - `drag`  : appui long (la main se pose), puis glisse vers le bas en courbe douce, relâche.
 * Le bout de l'index (`TIP`) est posé exactement sur le point visé. Décorative : masquée aux lecteurs d'écran ;
 * absente avec Réduire les animations (le parent ne la monte pas) ; nuit (`minimal`) : appui seul, sans trajet ni onde.
 * Règles worklets : aucun paramètre par défaut, aucune ref lue, aucun scheduleOnRN ; transform et opacity seulement.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { curves, type MotionLevel } from '@/motion';

export type HandGesture = 'tap' | 'swipe' | 'drag';

/** Tracé de la main (grille 48 × 56) : index tendu, trois doigts repliés, pouce. */
export const HAND_PATH = 'M13 8a4 4 0 0 1 8 0v16a3.5 3.5 0 0 1 7 0v1a3 3 0 0 1 6 0v1.5a2.8 2.8 0 0 1 5.6 0V36c0 8-5.6 14-13.6 14h-4c-5.2 0-8.6-2.6-10.6-6.6l-4.4-8.6a3 3 0 0 1 4.8-3.4L13 35z';
/** Plis des doigts repliés (trait seul). */
export const HAND_FOLDS = 'M21 24v5M28 25v4.5M34 26.5v4';
/** Bout de l'index dans la grille. */
export const HAND_TIP = { x: 17, y: 4.5 };
const VB = { w: 48, h: 56 };

/** Main seule (statique) : utilisée par la visite et par la galerie des pictogrammes. */
export function HandGlyph({ size = 44 }: { size?: number }) {
  const t = useTheme();
  const h = (size * VB.h) / VB.w;
  return (
    <Svg width={size} height={h} viewBox={`0 0 ${VB.w} ${VB.h}`}>
      {/* ombre : même tracé, décalé, encre très légère */}
      <Path d={HAND_PATH} fill={t.colors.text} opacity={0.14} transform="translate(1.6 2.4)" />
      <Path d={HAND_PATH} fill={t.colors.surface} stroke={t.colors.text} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <Path d={HAND_FOLDS} fill="none" stroke={t.colors.text} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} />
      {/* ongle de l'index : aplat de l'accent, repère du point de contact */}
      <Path d="M15 8.6a2 2 0 0 1 4 0v1.6h-4z" fill={t.colors.primary} opacity={0.85} />
    </Svg>
  );
}

const EASE_OUT = curves.decelerate;
const SIZE = 40;
const SCALE = SIZE / VB.w;

/** Phases (fractions du cycle) : arrivée, appui, trajet, relâche, repos. */
function seg(v: number, a: number, b: number) {
  'worklet';
  if (v <= a) return 0;
  if (v >= b) return 1;
  return (v - a) / (b - a);
}

/**
 * Main animée posée sur `point` (coordonnées de la superposition). `span` : longueur du trajet (glisser / faire
 * glisser). `testID` : `tour-hand-<geste>`.
 */
export function TourHand({ kind, point, span, level }: { kind: HandGesture; point: { x: number; y: number }; span: number; level: MotionLevel }) {
  const t = useTheme();
  const p = useSharedValue(0);
  const minimal = level === 'minimal';
  useEffect(() => {
    const cycle = minimal ? 1100 : kind === 'tap' ? 1500 : 1900;
    p.value = 0;
    p.value = withRepeat(
      withSequence(
        withDelay(250, withTiming(1, { duration: cycle, easing: Easing.linear, reduceMotion: ReduceMotion.Never }), ReduceMotion.Never),
        withTiming(0, { duration: 0, reduceMotion: ReduceMotion.Never }),
      ),
      -1, false, undefined, ReduceMotion.Never,
    );
    return () => cancelAnimation(p);
  }, [kind, minimal, p]);

  const hand = useAnimatedStyle(() => {
    const v = p.value;
    const fadeIn = EASE_OUT(seg(v, 0, 0.14));
    const fadeOut = 1 - seg(v, 0.88, 1);
    const opacity = Math.min(fadeIn, fadeOut);
    if (kind === 'tap' || minimal) {
      // arrivée (8 px en diagonale), appui (0,92), relâche
      const arrive = 1 - EASE_OUT(seg(v, 0, 0.3));
      const press = seg(v, 0.32, 0.42) - seg(v, 0.5, 0.66);
      return { opacity, transform: [{ translateX: minimal ? 0 : 8 * arrive }, { translateY: (minimal ? 0 : 8 * arrive) + 2 * press }, { scale: 1 - 0.08 * press }] };
    }
    // glisser / faire glisser : appui, trajet en courbe, relâche
    const press = seg(v, 0.12, 0.22) - seg(v, 0.78, 0.86);
    const k = seg(v, 0.22, 0.78);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // ease-in-out
    const arc = Math.sin(Math.PI * e);
    if (kind === 'swipe') {
      return { opacity, transform: [{ translateX: -span / 2 + e * span }, { translateY: -12 * arc + 2 * press }, { rotate: `${-6 + 12 * e}deg` }, { scale: 1 - 0.08 * press }] };
    }
    return { opacity, transform: [{ translateX: 10 * arc }, { translateY: e * span + 2 * press }, { scale: 1 - 0.08 * press }] };
  });
  // onde : part du bout du doigt au moment de l'appui (toucher) ou au début du trajet
  const ripple = useAnimatedStyle(() => {
    const v = p.value;
    const r = kind === 'tap' ? seg(v, 0.38, 0.8) : seg(v, 0.16, 0.5);
    const startX = kind === 'swipe' ? -span / 2 : 0;
    return { opacity: minimal ? 0 : r > 0 ? 0.55 * (1 - r) : 0, transform: [{ translateX: startX }, { scale: 0.35 + 1.25 * r }] };
  });

  const left = point.x - HAND_TIP.x * SCALE;
  const top = point.y - HAND_TIP.y * SCALE - (kind === 'drag' ? span / 2 : 0);
  const R = 22;
  return (
    <View pointerEvents="none" testID={`tour-hand-${kind}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Animated.View style={[{ position: 'absolute', left: point.x - R, top: point.y - R - (kind === 'drag' ? span / 2 : 0), width: R * 2, height: R * 2, borderRadius: R, borderWidth: 2, borderColor: t.colors.primary }, ripple]} />
      <Animated.View style={[{ position: 'absolute', left, top, transformOrigin: `${HAND_TIP.x * SCALE}px ${HAND_TIP.y * SCALE}px` }, hand]}>
        <HandGlyph size={SIZE} />
      </Animated.View>
    </View>
  );
}
