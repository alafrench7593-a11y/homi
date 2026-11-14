/**
 * Moteur des aperçus « Découvrir HOMI » : UN geste, SON résultat.
 *
 *  - `DemoPlayer` : état local de la démo (`done`), rejouable (`token`), jamais relié aux données du foyer ;
 *  - `DemoTarget` : l'élément à toucher ; un doigt fantôme s'en approche, appuie (anneau), puis le résultat est
 *    appliqué. Toucher soi-même l'élément interrompt le doigt et applique le résultat tout de suite (interruptible).
 *
 * Niveaux (`useMotion`) : `full` → doigt qui approche et appuie ; `minimal` (nuit) → pas de déplacement, le résultat
 * arrive en fondu court ; `off` (Réduire les animations, économie d'énergie) → état FINAL affiché d'emblée, aucun
 * doigt ; « Rejouer » remet l'état initial et attend le geste de la personne (élément cerclé, consigne affichée).
 * Seuls transform et opacity sont animés, sur le fil UI ; la fin revient vers JS par `scheduleOnRN`, une fois.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, interpolate, Extrapolation, useAnimatedStyle, useSharedValue, withSequence, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { motionHaptic, useMotion, type MotionLevel } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius } from '@/theme/tokens';

/** Chorégraphie du geste (ms, pure, testée). */
export const GESTURE = { waitMs: 520, approachMs: 760, releaseMs: 320, tapAt: 0.7 } as const;
export const gestureDuration = (level: MotionLevel) => (level === 'off' ? 0 : GESTURE.waitMs + GESTURE.approachMs + GESTURE.releaseMs);

interface DemoState {
  done: boolean;
  /** Applique le résultat (geste réel ou doigt fantôme). */
  apply: () => void;
  level: MotionLevel;
  finger: SharedValue<number>;
  /** Avec Réduire les animations, après « Rejouer » : on attend le geste de la personne. */
  waiting: boolean;
}
const Ctx = createContext<DemoState | null>(null);
export const useDemo = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('DemoTarget hors de DemoPlayer');
  return c;
};

export function DemoPlayer({ token = 0, children, onApplied }: { token?: number; children: React.ReactNode; onApplied?: () => void }) {
  const m = useMotion();
  const finger = useSharedValue(0);
  const lastToken = useRef<number | null>(null);
  // Réduire les animations : l'état final est visible dès l'ouverture (tout le contenu reste accessible)
  const [done, setDone] = useState(m.off);
  const doneRef = useRef(done);
  doneRef.current = done;
  const applied = useRef(onApplied);
  applied.current = onApplied;

  const apply = useCallback(() => {
    cancelAnimation(finger);
    finger.value = 0;
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    applied.current?.();
  }, [finger]);
  const applyFromFinger = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    motionHaptic('light');
    setDone(true);
    applied.current?.();
  }, []);

  useEffect(() => {
    // « Rejouer » = nouveau jeton ; un simple changement de niveau (Réduire les animations détecté) n'en est pas un
    const replay = lastToken.current !== null && lastToken.current !== token;
    lastToken.current = token;
    cancelAnimation(finger);
    finger.value = 0;
    if (m.off) {
      // première ouverture : état final ; « Rejouer » : état initial, en attente du geste
      const final = !replay;
      doneRef.current = final;
      setDone(final);
      return;
    }
    doneRef.current = false;
    setDone(false);
    finger.value = m.delay(GESTURE.waitMs, withSequence(
      m.timing(GESTURE.tapAt, GESTURE.approachMs, 'decelerate', (f) => { 'worklet'; if (f) scheduleOnRN(applyFromFinger); }),
      m.timing(1, GESTURE.releaseMs, 'standard'),
    ));
    return () => cancelAnimation(finger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, m.level]);

  const value = useMemo<DemoState>(() => ({ done, apply, level: m.level, finger, waiting: m.off && !done }), [done, apply, m.level, m.off, finger]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Élément à toucher. `pressable={false}` : l'enfant gère lui-même l'appui (case à cocher) et appelle `useDemo().apply`.
 * Le doigt fantôme et l'anneau sont décoratifs (masqués aux lecteurs d'écran, ne captent aucun toucher).
 */
export function DemoTarget({ children, label, pressable = true, style, testID, round }: {
  children: React.ReactNode;
  label: string;
  pressable?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Anneau de consigne arrondi (bouton capsule) plutôt que rectangulaire. */
  round?: boolean;
}) {
  const t = useTheme();
  const { apply, finger, level, waiting, done } = useDemo();
  const accent = t.tokens.accent.glow[0];
  const hand = useAnimatedStyle(() => {
    const p = finger.value;
    const approach = interpolate(p, [0, GESTURE.tapAt], [0, 1], Extrapolation.CLAMP);
    const fade = p <= 0 ? 0 : p < 0.12 ? p / 0.12 : p > 0.86 ? Math.max(0, (1 - p) / 0.14) : 1;
    const press = interpolate(p, [GESTURE.tapAt - 0.08, GESTURE.tapAt, GESTURE.tapAt + 0.1], [1, 0.78, 1], Extrapolation.CLAMP);
    const travel = level === 'full' ? 1 : 0;
    return { opacity: fade, transform: [{ translateX: 30 * (1 - approach) * travel }, { translateY: 40 * (1 - approach) * travel }, { scale: press }] };
  });
  const ring = useAnimatedStyle(() => {
    const p = finger.value;
    const k = interpolate(p, [GESTURE.tapAt, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: p >= GESTURE.tapAt && level === 'full' ? 0.55 * (1 - k) : 0, transform: [{ scale: 0.6 + 1.1 * k }] };
  });
  const content = (
    <View collapsable={false} style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {children}
      {/* consigne statique (Réduire les animations, après « Rejouer ») */}
      {waiting ? <View pointerEvents="none" testID="demo-target-hint" style={[StyleSheet.absoluteFill, { margin: -4, borderRadius: round ? radius.pill : radius.md, borderWidth: 2, borderColor: accent }]} /> : null}
      {level !== 'off' && !done ? (
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View style={[{ position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: accent }, ring]} />
          <Animated.View testID="demo-finger" style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: alpha(t.isDark ? '#FFFFFF' : '#13181A', t.isDark ? 0.42 : 0.28), borderWidth: 2, borderColor: alpha('#FFFFFF', 0.85) }, hand]} />
        </View>
      ) : null}
    </View>
  );
  if (!pressable) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} testID={testID ?? 'demo-target'} onPress={apply} hitSlop={6} style={{ minHeight: 44, justifyContent: 'center' }}>
      {content}
    </Pressable>
  );
}
