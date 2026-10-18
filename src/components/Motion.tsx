/**
 * Briques de mouvement réutilisables, toutes branchées sur src/theme/motion.ts
 * et sur « réduire les animations ».
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { duration, easing, spring, springTo, stagger, timeTo } from '@/theme/motion';
import { NATIVE_DRIVER } from '@/theme/tokens';

const IS_WEB = Platform.OS === 'web';

// ------------------------------------------------------------------ pression + survol
/**
 * Retour de pression à ressort (enfoncement ferme, relâchement souple) et, sur le web,
 * léger soulèvement au survol. À brancher sur un Pressable : onPressIn/onPressOut/onHoverIn/onHoverOut.
 */
export function usePressMotion(opts: { pressed?: number; hoverLift?: number } = {}) {
  const reduce = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;
  const hover = useRef(new Animated.Value(0)).current;
  const pressedScale = opts.pressed ?? 0.965;
  const lift = opts.hoverLift ?? -2;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, pressedScale] });
  const translateY = hover.interpolate({ inputRange: [0, 1], outputRange: [0, lift] });
  return {
    style: { transform: [{ translateY }, { scale }] },
    hover,
    handlers: {
      onPressIn: () => springTo(press, 1, 'press', reduce).start(),
      onPressOut: () => springTo(press, 0, 'release', reduce).start(),
      onHoverIn: IS_WEB ? () => springTo(hover, 1, 'gentle', reduce).start() : undefined,
      onHoverOut: IS_WEB ? () => springTo(hover, 0, 'gentle', reduce).start() : undefined,
    },
  };
}

// ------------------------------------------------------------------ profondeur au curseur (web)
/**
 * Inclinaison 3D subtile qui suit le curseur (web uniquement), et position du reflet lumineux.
 * Sur téléphone et avec « réduire les animations » : aucun effet.
 */
export function useTilt(maxDeg = 3) {
  const reduce = useReduceMotion();
  const rx = useRef(new Animated.Value(0)).current;
  const ry = useRef(new Animated.Value(0)).current;
  const size = useRef({ w: 1, h: 1 });
  const enabled = IS_WEB && !reduce;
  return {
    enabled,
    onLayout: (e: LayoutChangeEvent) => { size.current = { w: e.nativeEvent.layout.width || 1, h: e.nativeEvent.layout.height || 1 }; },
    rx,
    ry,
    style: enabled
      ? { transform: [{ perspective: 900 }, { rotateX: rx.interpolate({ inputRange: [-1, 1], outputRange: [`${maxDeg}deg`, `-${maxDeg}deg`] }) }, { rotateY: ry.interpolate({ inputRange: [-1, 1], outputRange: [`-${maxDeg}deg`, `${maxDeg}deg`] }) }] }
      : undefined,
    webHandlers: enabled
      ? {
        onMouseMove: (e: { nativeEvent: { offsetX?: number; offsetY?: number } }) => {
          const x = (e.nativeEvent.offsetX ?? 0) / size.current.w;
          const y = (e.nativeEvent.offsetY ?? 0) / size.current.h;
          rx.setValue(Math.max(-1, Math.min(1, y * 2 - 1)));
          ry.setValue(Math.max(-1, Math.min(1, x * 2 - 1)));
        },
        onMouseLeave: () => {
          Animated.parallel([springTo(rx, 0, 'gentle', false), springTo(ry, 0, 'gentle', false)]).start();
        },
      }
      : {},
  };
}

// ------------------------------------------------------------------ apparition en cascade (listes)
export function StaggerItem({ index, children, style }: { index: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReduceMotion();
  const animate = !reduce && index < 14; // au-delà, le contenu arrive déjà visible (défilement rapide)
  const v = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate) return;
    const a = Animated.timing(v, { toValue: 1, duration: duration.entrance, delay: stagger(index), easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [v, animate, index]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

// ------------------------------------------------------------------ secousse (erreur)
/** Petite secousse horizontale à chaque nouvelle valeur de `trigger` (message d'erreur, refus). */
export function useShake(trigger: unknown) {
  const reduce = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!trigger || reduce) return;
    x.setValue(0);
    Animated.sequence([6, -5, 4, -2, 0].map((toValue) => Animated.timing(x, { toValue, duration: 55, useNativeDriver: NATIVE_DRIVER }))).start();
  }, [trigger, reduce, x]);
  return { transform: [{ translateX: x }] };
}

// ------------------------------------------------------------------ « pop » (validation, sélection)
export function usePop(trigger: unknown, amount = 1.08) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduce) return;
    v.setValue(amount);
    springTo(v, 1, 'pop', reduce).start();
  }, [trigger, reduce, v, amount]);
  return { transform: [{ scale: v }] };
}

// ------------------------------------------------------------------ reflet qui balaie (squelettes)
export function Shimmer({ radius = 10 }: { radius?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [w, setW] = React.useState(0);
  useEffect(() => {
    if (reduce || !w) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1300, easing: easing.standard, useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [v, reduce, w]);
  return (
    <View pointerEvents="none" onLayout={(e) => setW(e.nativeEvent.layout.width)} style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: radius }]}>
      {w > 0 && !reduce ? (
        <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: w * 0.6, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.6, w] }) }] }}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ barre de progression
/** Progression animée en scaleX (aucun recalcul de mise en page). `value` entre 0 et 1. */
export function ProgressBar({ value, color, track, height = 8, accessibilityLabel, gradient }: { value: number; color: string; track: string; height?: number; accessibilityLabel?: string; gradient?: readonly [string, string, ...string[]] }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [w, setW] = React.useState(0);
  useEffect(() => {
    timeTo(v, Math.max(0, Math.min(1, value)), duration.slow + 200, reduce).start();
  }, [v, value, reduce]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          height, width: w, borderRadius: height / 2, backgroundColor: color,
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w / 2, 0] }) }, { scaleX: v }],
          overflow: 'hidden',
        }}
      >
        {gradient ? <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
      </Animated.View>
    </View>
  );
}

// ------------------------------------------------------------------ entrée d'écran
/** Valeur animée 0 → 1 à chaque fois que l'écran redevient actif (continuité de navigation). */
export function useFocusEntrance(focused: boolean) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    if (focused) {
      v.setValue(reduce ? 1 : 0);
      timeTo(v, 1, duration.entrance, reduce).start();
    } else {
      timeTo(v, 0, duration.fast, reduce, easing.accelerate).start();
    }
  }, [focused, reduce, v]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] }) }],
  };
}

export { spring as motionSpring };
