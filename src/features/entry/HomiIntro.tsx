/**
 * Introduction HOMI de première ouverture (remplace la vidéo d'« Au fil de nous », 13/11/2026).
 * 100 % vectorielle (react-native-svg + Reanimated), ≈ 2,2 s, aucun fichier vidéo :
 *  - la scène (halo de la palette) se révèle en profondeur ;
 *  - le logo se construit avec la chorégraphie de l'introduction de lancement (`IntroMark`, même horloge) :
 *    contour tracé → maison illuminée → parents → enfants ;
 *  - le nom et la phrase d'accroche se posent ; puis l'écran suivant arrive en fondu (navigation).
 * Règles : « Passer » toujours visible, en bas à portée de pouce (≥ 48 px, jamais sous la pastille « Démo ») ; « Réduire les animations » ou économie d'énergie → aucune
 * animation, sortie immédiate ; thème nuit → version abrégée. L'horloge vit sur le fil UI ; seule la fin revient
 * vers JS (`scheduleOnRN`). Le caractère « une seule fois » est géré par l'écran /cinematic (cinematicSeen).
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IntroMark, introTimeline, stageProgress } from '@/components/LaunchIntro';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { t as tr } from '@/i18n';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { DepthReveal, FocalGlow } from './EntryKit';

/** Pose finale (nom + accroche lisibles) avant de passer la main à l'écran suivant. */
export const HOMI_INTRO_HOLD_MS = 520;

/** Durée totale (pure, testée) : chorégraphie du logo sans son fondu de calque + pose du nom. */
export function homiIntroDuration(mode: 'full' | 'short'): number {
  return introTimeline(mode).exit[0] + HOMI_INTRO_HOLD_MS;
}

export function HomiIntro({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const m = useMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const finished = useRef(false);
  const done = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  }, [onDone]);
  const tl = useMemo(() => introTimeline(m.minimal ? 'short' : 'full'), [m.minimal]);
  const total = tl.exit[0] + HOMI_INTRO_HOLD_MS;
  const clock = useSharedValue(0);

  useEffect(() => {
    // Réduire les animations / économie d'énergie : directement l'écran suivant
    if (m.off) { done(); return; }
    clock.value = withTiming(total, { duration: total, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (f) => {
      'worklet';
      if (f) scheduleOnRN(done);
    });
    return () => cancelAnimation(clock);
  }, [m.off, total, clock, done]);

  // Le nom et l'accroche se posent quand la dernière silhouette arrive
  const lastFigure = tl.figures[tl.figures.length - 1];
  const words = useAnimatedStyle(() => {
    const p = curves.decelerate(stageProgress(clock.value, [lastFigure[0], 420]));
    return { opacity: p, transform: [{ translateY: 8 * (1 - p) }] };
  });

  const size = Math.round(Math.min(width * 0.5, height * 0.3, 220));
  const glow = Math.round(Math.min(width * 1.2, 520));
  if (m.off) return <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.background }]} />;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.background }]} accessibilityLabel={tr('cine.a11y')} testID="homi-intro">
      <DepthReveal style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <FocalGlow size={glow} />
      </DepthReveal>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: spacing.lg }]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <IntroMark size={size} clock={clock} tl={{ ...tl, exit: [total + 1, 1] }} />
        </View>
        <Animated.View style={[{ alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg }, words]}>
          <Text variant="hero" center accessibilityRole="header">{BRAND.name}</Text>
          <Text center muted style={{ maxWidth: 320 }}>{tr('cine.logo.tagline')}</Text>
        </Animated.View>
      </View>
      <Tappable
        testID="homi-intro-skip"
        accessibilityRole="button"
        accessibilityLabel={tr('cine.skipA11y')}
        onPress={done}
        style={({ pressed }) => ({
          position: 'absolute', bottom: insets.bottom + spacing.lg, alignSelf: 'center', minHeight: MIN_TOUCH, minWidth: MIN_TOUCH,
          paddingHorizontal: spacing.md, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: t.material.glass.inset.fill, borderWidth: 1, borderColor: t.material.glass.inset.edge, opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text weight="bold" maxFontSizeMultiplier={1.3}>{tr('cine.skip')}</Text>
        <Icon name="chevron-right" size={16} />
      </Tappable>
    </View>
  );
}
