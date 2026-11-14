/**
 * Introduction HOMI de première ouverture (logo v5 « maison », 14/11/2026).
 * 100 % vectorielle (react-native-svg + Reanimated), ≈ 2,5 s, aucun fichier vidéo — le logo s'anime comme UN objet :
 *  - le contour de la maison se trace, un reflet court sur le bord ; la maison s'illumine ;
 *  - parent, parent, enfant, enfant apparaissent (léger rebond) ; le nom HOMI se révèle dans la lumière ;
 *  - la maison se DÉPLOIE en premier panneau de verre où se pose la phrase d'accroche ;
 *  - puis l'écran suivant arrive en fondu (navigation).
 * Règles : « Passer » toujours visible, en bas à portée de pouce (≥ 48 px, jamais sous la pastille « Démo ») ;
 * « Réduire les animations » ou économie d'énergie → aucune animation, sortie immédiate ; thème nuit → version
 * abrégée (fondus). L'horloge vit sur le fil UI ; seule la fin revient vers JS (`scheduleOnRN`). Le caractère « une
 * seule fois » est géré par l'écran /cinematic (cinematicSeen).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logoTimeline, stageProgress, type HousePanelTarget } from '@/brand/logoMotion';
import { HomiLogoAnimated } from '@/components/HomiLogoAnimated';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { curves } from '@/motion/curves';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { DepthReveal, FocalGlow } from './EntryKit';

/** Pose finale (nom + accroche lisibles dans le panneau) avant de passer la main à l'écran suivant. */
export const HOMI_INTRO_HOLD_MS = 420;
/** La phrase se pose dans le panneau quand il a parcouru 55 % de son déploiement. */
const TAGLINE_AT = 0.55;
const TAGLINE_MS = 380;

/** Durée totale (pure, testée) : logo (tracé → illumination → famille → nom → panneau) + pose. 'short' : nuit (fondus). */
export function homiIntroDuration(mode: 'full' | 'short'): number {
  return logoTimeline(mode === 'short' ? 'minimal' : 'full', true).end + HOMI_INTRO_HOLD_MS;
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
  const tl = useMemo(() => logoTimeline(m.minimal ? 'minimal' : 'full', true), [m.minimal]);
  const total = tl.end + HOMI_INTRO_HOLD_MS;
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

  // Panneau cible : l'emplacement de la phrase d'accroche, mesuré dans la fenêtre
  const slot = useRef<View>(null);
  const [target, setTarget] = useState<HousePanelTarget | null>(null);
  const measureSlot = useCallback(() => {
    slot.current?.measureInWindow?.((x, y, w, h) => {
      if (w > 0 && h > 0) setTarget({ x, y, width: w, height: h, radius: radius.lg, fill: t.material.glass.floating.fill, edge: t.material.glass.floating.edge });
    });
  }, [t]);

  const deploy = tl.deploy ?? ([0, 0] as const);
  const words = useAnimatedStyle(() => {
    const p = curves.decelerate(stageProgress(clock.value, [deploy[0] + deploy[1] * TAGLINE_AT, TAGLINE_MS]));
    return { opacity: p, transform: [{ translateY: 6 * (1 - p) }] };
  });

  const logoWidth = Math.round(Math.min(width * 0.58, 250, height * 0.34));
  const panelWidth = Math.round(Math.min(width - spacing.lg * 2, 360));
  const glow = Math.round(Math.min(width * 1.2, 520));
  if (m.off) return <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.background }]} />;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.background }]} accessibilityLabel={tr('cine.a11y')} testID="homi-intro">
      <DepthReveal style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <FocalGlow size={glow} />
      </DepthReveal>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: spacing.xl }]}>
        <HomiLogoAnimated width={logoWidth} clock={clock} timeline={tl} deployTo={target ?? undefined} testID="homi-intro-logo" />
        <View ref={slot} onLayout={measureSlot} collapsable={false} style={{ width: panelWidth, minHeight: 112, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <Animated.View style={words}>
            <Text center muted style={{ maxWidth: 320, alignSelf: 'center' }}>{tr('cine.logo.tagline')}</Text>
          </Animated.View>
        </View>
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
