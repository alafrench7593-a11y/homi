/**
 * Kit de mouvement partagé (au-delà des briques de Motion.tsx) :
 *  - MotionNumber : chiffres qui « roulent » quand ils changent (compteur premium) ;
 *  - DrawCheck : confirmation dessinée (cercle puis coche tracés) ;
 *  - PulseRing : impulsion lumineuse qui se propage une fois ;
 *  - useProgress : valeur 0 → 1 qui accompagne l'arrivée d'une donnée réelle (graphiques).
 * Toujours piloté par des données réelles ; « réduire les animations » → état final immédiat.
 * Couleurs : uniquement celles passées en paramètre (thème existant).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text as RNText, View, type StyleProp, type TextStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { easing } from '@/theme/motion';
import { NATIVE_DRIVER } from '@/theme/tokens';

export const AnimatedPath = Animated.createAnimatedComponent(Path);
export const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ------------------------------------------------------------------ chiffres qui roulent
function RollingChar({ ch, style, reduce }: { ch: string; style: StyleProp<TextStyle>; reduce: boolean }) {
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.spring(v, { toValue: 1, tension: 260, friction: 22, useNativeDriver: NATIVE_DRIVER }).start();
  }, [v, reduce]);
  return (
    <Animated.Text style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }] }]}>{ch}</Animated.Text>
  );
}

/**
 * Nombre ou durée affiché caractère par caractère : seul le chiffre qui change s'anime
 * (comme un compteur mécanique). Le texte complet reste lisible par les lecteurs d'écran.
 */
export function MotionNumber({ text, style, accessibilityLabel }: { text: string; style?: StyleProp<TextStyle>; accessibilityLabel?: string }) {
  const reduce = useReduceMotion();
  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? text} style={{ flexDirection: 'row', overflow: 'hidden' }}>
      {text.split('').map((ch, i) => (
        // la clé change avec le caractère : seul le chiffre modifié est remonté (et animé)
        /\d/.test(ch) ? <RollingChar key={`${i}-${ch}`} ch={ch} style={[style, { fontVariant: ['tabular-nums'] }]} reduce={reduce} /> : <RNText key={`${i}-s`} style={style}>{ch}</RNText>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ confirmation dessinée
export function DrawCheck({ size = 56, color, play = true }: { size?: number; color: string; play?: boolean }) {
  const reduce = useReduceMotion();
  const ring = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const tick = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (!play || reduce) return;
    ring.setValue(0); tick.setValue(0);
    Animated.sequence([
      Animated.timing(ring, { toValue: 1, duration: 420, easing: easing.decelerate, useNativeDriver: false }),
      Animated.timing(tick, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [play, reduce, ring, tick]);
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const checkLen = size * 0.62;
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no">
      <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={3} fill="none" strokeDasharray={`${c} ${c}`}
        strokeDashoffset={ring.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })} strokeLinecap="round" rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      <AnimatedPath d={`M${size * 0.3} ${size * 0.52} L${size * 0.44} ${size * 0.66} L${size * 0.72} ${size * 0.38}`} stroke={color} strokeWidth={3.4} fill="none"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${checkLen} ${checkLen}`} strokeDashoffset={tick.interpolate({ inputRange: [0, 1], outputRange: [checkLen, 0] })} />
    </Svg>
  );
}

// ------------------------------------------------------------------ impulsion lumineuse
/** Une onde qui part du centre et s'efface, à chaque changement de `trigger` (démarrage, validation). */
export function PulseRing({ trigger, size, color }: { trigger: unknown; size: number; color: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduce) return;
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 900, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER }).start();
  }, [trigger, reduce, v]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color,
      opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.8, 0] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.18] }) }],
    }} />
  );
}

// ------------------------------------------------------------------ progression d'apparition
/** 0 → 1 à chaque changement de `key` (nouvelles données) ; pour les graphiques SVG (pas de pilote natif). */
export function useProgress(key: unknown, ms = 900) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration: ms, easing: easing.decelerate, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [key, reduce, v, ms]);
  return v;
}

// ------------------------------------------------------------------ changement de période (glisse directionnelle)
/** Contenu qui entre depuis la droite (suivant) ou la gauche (précédent). Monter avec une `key` par période. */
export function SlideSwap({ dir, children }: { dir: number; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.spring(v, { toValue: 1, tension: 170, friction: 22, useNativeDriver: NATIVE_DRIVER }).start();
  }, [v, reduce]);
  return <Animated.View style={{ gap: 8, opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [28 * (dir || 0), 0] }) }] }}>{children}</Animated.View>;
}

/** Halo bref qui attire l'œil sur un élément qui vient d'être modifié ou déplacé. */
export function Flash({ on, color, children }: { on: boolean; color: string; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on || reduce) return;
    v.setValue(0);
    Animated.sequence([0, 1].map(() => Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration: 420, useNativeDriver: false }),
    ]))).start();
  }, [on, reduce, v]);
  return (
    <View>
      {children}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -3, left: -3, right: -3, bottom: -3, borderRadius: 16, borderWidth: 2, borderColor: color, opacity: v }} />
    </View>
  );
}
