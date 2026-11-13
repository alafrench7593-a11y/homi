/**
 * Passage d'une tâche à l'état TERMINÉ (primitive partagée, utilisée par l'Accueil, les listes de tâches, missions…).
 *
 * `CompletionCheck` : case ronde accessible (role checkbox). À la validation :
 *   1. le disque se remplit du dégradé de la palette (0,6 → 1 en ressort « rebond léger ») ;
 *   2. la coche se trace (240 ms, `decelerate`, 80 ms après le disque) ;
 *   3. un anneau de lumière part du centre et s'éteint (520 ms) — le « halo bref » de validation ;
 *   4. retour haptique « succès » (règles habituelles : jamais sur le web, réglage Vibrations, nuit avec accord).
 * Décocher : fondu court du disque et de la coche, sans anneau.
 *
 * `CompletionGlow` : enveloppe une ligne ou une carte ; quand `done` passe à vrai, un halo coloré apparaît puis
 * s'éteint (~900 ms) autour d'elle. Jamais en boucle : une seule fois par validation (adapté aux listes).
 *
 * Niveaux (useMotion) : 'off' → état final immédiat, ni anneau ni halo ; 'minimal' (nuit) → fondus courts, sans
 * ressort ni anneau ni halo. Transform et opacité uniquement (sauf le tracé de la coche : un seul petit chemin).
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { haloShadow, MIN_TOUCH } from '@/theme/tokens';
import { motionHaptic } from './haptics';
import { useMotion } from './useMotion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Coche dessinée dans une boîte 24 × 24 ; longueur mesurée du tracé. */
const CHECK_D = 'M6.5 12.5 L10.5 16.5 L17.5 8.5';
const CHECK_LEN = 17.3;
export const COMPLETION = { fillMs: 200, drawMs: 240, drawDelayMs: 80, ringMs: 520, glowInMs: 180, glowOutMs: 720 } as const;

export function CompletionCheck({ done, onToggle, label, size = 28, disabled, testID, style }: {
  done: boolean;
  onToggle: (next: boolean) => void;
  /** Libellé annoncé (ex. « Terminer : sortir les poubelles ») */
  label: string;
  size?: number;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const m = useMotion();
  const fill = useSharedValue(done ? 1 : 0);
  const draw = useSharedValue(done ? 1 : 0);
  const ring = useSharedValue(0);
  const prev = useRef(done);
  useEffect(() => {
    if (prev.current === done) return;
    prev.current = done;
    if (done) {
      if (m.level === 'full') {
        fill.value = 0.6;
        fill.value = m.spring(1, 'rebondLeger');
        draw.value = 0;
        draw.value = m.delay(COMPLETION.drawDelayMs, m.timing(1, COMPLETION.drawMs, 'decelerate'));
        ring.value = 0;
        ring.value = m.timing(1, COMPLETION.ringMs, 'decelerate');
      } else {
        fill.value = m.timing(1, COMPLETION.fillMs, 'standard');
        draw.value = m.timing(1, COMPLETION.fillMs, 'standard');
      }
    } else {
      fill.value = m.timing(0, COMPLETION.fillMs, 'standard');
      draw.value = m.timing(0, COMPLETION.fillMs, 'standard');
      ring.value = 0;
    }
  }, [done, m, fill, draw, ring]);
  useEffect(() => () => { cancelAnimation(fill); cancelAnimation(draw); cancelAnimation(ring); }, [fill, draw, ring]);

  const discStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, fill.value * 1.6), transform: [{ scale: 0.6 + 0.4 * fill.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value <= 0 || ring.value >= 1 ? 0 : 0.55 * (1 - ring.value), transform: [{ scale: 1 + ring.value * 0.9 }] }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  const [a, , b] = t.material.primaryGradient;
  const hit = Math.max(0, (MIN_TOUCH - size) / 2);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled: !!disabled }}
      aria-checked={done}
      accessibilityLabel={label}
      testID={testID}
      disabled={disabled}
      hitSlop={hit}
      onPress={() => {
        const next = !done;
        if (next) motionHaptic('success'); else motionHaptic('selection');
        onToggle(next);
      }}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }, style]}
    >
      {/* Anneau de lumière (validation) */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: t.tokens.accent.glow[0] }, ringStyle]} />
      {/* Contour au repos */}
      <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: done ? 'transparent' : t.colors.textMuted }} />
      {/* Disque rempli du dégradé de la palette */}
      <Animated.View pointerEvents="none" testID="completion-disc" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, discStyle]}>
        <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
        <AnimatedPath d={CHECK_D} stroke={t.colors.primaryText} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`} animatedProps={checkProps} />
      </Svg>
    </Pressable>
  );
}

/** Halo bref autour d'une ligne / carte au moment où elle passe à « terminé » (voir l'en-tête). */
export function CompletionGlow({ done, children, radius = 20, style }: { done: boolean; children: React.ReactNode; radius?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const m = useMotion();
  const glow = useSharedValue(0);
  const prev = useRef(done);
  useEffect(() => {
    const was = prev.current;
    prev.current = done;
    if (!done || was || m.level !== 'full') return;
    glow.value = 0;
    glow.value = withSequence(m.timing(1, COMPLETION.glowInMs, 'decelerate'), m.timing(0, COMPLETION.glowOutMs, 'standard'));
  }, [done, m, glow]);
  useEffect(() => () => cancelAnimation(glow), [glow]);
  const style2 = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <View style={style}>
      <Animated.View pointerEvents="none" testID="completion-glow"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1.5, borderColor: t.tokens.accent.glow[0], backgroundColor: t.tokens.surface.background, boxShadow: haloShadow(t, 0.9) }, style2]} />
      {children}
    </View>
  );
}
