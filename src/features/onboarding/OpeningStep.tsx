/**
 * Temps 1 — Ouverture. La maison HOMI se trace et s'illumine (`HomiLogoAnimated`, fil UI), le titre se lève quand le nom
 * HOMI apparaît (≈ 1 s), la scène d'espace respire derrière (fond de coque). Le bouton principal est actif dès la
 * première image ; toucher la scène saute l'animation (état final immédiat). Réduire les animations : tout est posé.
 * Lancement à froid : si l'introduction de lancement (`LaunchIntro`) vient de jouer le logo, il n'est PAS rejoué — la
 * maison est déjà posée et seul le titre arrive, au moment où le calque de l'introduction s'efface.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { HomiLogoAnimated } from '@/components/HomiLogoAnimated';
import { launchLogoState, onLaunchLogoState } from '@/components/LaunchIntro';
import { Text } from '@/components/ui';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Le titre se lève avec le nom HOMI du logo (logoTimeline : nom révélé de 1 000 à 1 500 ms). */
export const OPENING_TITLE_DELAY = 950;
/** Logo déjà montré par l'introduction de lancement : le titre suit presque aussitôt l'effacement du calque. */
export const HANDOFF_TITLE_DELAY = 60;

export function OpeningStep({ compact }: { compact: boolean }) {
  const t = useTheme();
  const m = useMotion();
  const win = useWindowDimensions();
  // Relais de l'introduction de lancement : logo posé d'emblée, le titre attend que le calque s'efface
  const [handoff] = useState(() => launchLogoState() !== 'none');
  const [introGone, setIntroGone] = useState(() => launchLogoState() !== 'playing');
  useEffect(() => (introGone ? undefined : onLaunchLogoState((s) => { if (s === 'done') setIntroGone(true); })), [introGone]);
  const [skipped, setSkipped] = useState(false);
  const logoW = Math.round(Math.min(compact ? 150 : 250, win.width * 0.58));
  const rise = useSharedValue(m.off ? 1 : 0);
  useEffect(() => {
    if (!introGone) return undefined;
    rise.value = m.delay(handoff ? HANDOFF_TITLE_DELAY : OPENING_TITLE_DELAY, m.timing(1, 520, 'decelerate'));
    return () => cancelAnimation(rise);
    // une ouverture par montage (ou à la fin de l'introduction de lancement)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introGone]);
  const skip = () => {
    if (skipped) return;
    setSkipped(true);
    cancelAnimation(rise);
    rise.value = 1;
  };
  const moves = m.level === 'full';
  const title = useAnimatedStyle(() => ({ opacity: rise.value, transform: [{ translateY: moves ? (1 - rise.value) * 14 : 0 }] }));
  const lead = useAnimatedStyle(() => ({ opacity: Math.max(0, rise.value * 1.4 - 0.4), transform: [{ translateY: moves ? (1 - rise.value) * 20 : 0 }] }));
  return (
    <View style={{ alignItems: 'center', gap: compact ? spacing.sm : spacing.md, paddingTop: compact ? 0 : spacing.lg }} testID="onb-opening">
      <Pressable onPress={skip} accessibilityRole="button" accessibilityLabel={tr('o2.open.skipA11y')} testID="onb-opening-skip"
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
        <HomiLogoAnimated width={logoW} still={skipped || handoff} testID="onb-logo" />
      </Pressable>
      <Animated.View style={[{ alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm }, title]}>
        <Text variant="hero" center accessibilityRole="header">{tr('o2.open.title')}</Text>
      </Animated.View>
      <Animated.View style={[{ alignItems: 'center', gap: spacing.xs, maxWidth: 340 }, lead]}>
        <Text center muted>{tr('o2.open.lead')}</Text>
        <Text variant="small" center color={t.colors.textMuted}>{tr('o2.open.time')}</Text>
      </Animated.View>
    </View>
  );
}
