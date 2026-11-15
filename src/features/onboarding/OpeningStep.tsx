/**
 * Temps 1 — Ouverture. La maison HOMI se trace et s'illumine (`HomiLogoAnimated`, fil UI), le titre se lève quand le nom
 * HOMI apparaît (≈ 1 s), la scène d'espace respire derrière (fond de coque). Le bouton principal est actif dès la
 * première image ; toucher la scène saute l'animation (état final immédiat). Réduire les animations : tout est posé.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { HomiLogoAnimated } from '@/components/HomiLogoAnimated';
import { Text } from '@/components/ui';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Le titre se lève avec le nom HOMI du logo (logoTimeline : nom révélé de 1 000 à 1 500 ms). */
export const OPENING_TITLE_DELAY = 950;

export function OpeningStep({ compact }: { compact: boolean }) {
  const t = useTheme();
  const m = useMotion();
  const win = useWindowDimensions();
  const [skipped, setSkipped] = useState(false);
  const logoW = Math.round(Math.min(compact ? 150 : 250, win.width * 0.58));
  const rise = useSharedValue(m.off ? 1 : 0);
  useEffect(() => {
    rise.value = m.delay(OPENING_TITLE_DELAY, m.timing(1, 520, 'decelerate'));
    return () => cancelAnimation(rise);
    // une ouverture par montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        <HomiLogoAnimated width={logoW} still={skipped} testID="onb-logo" />
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
