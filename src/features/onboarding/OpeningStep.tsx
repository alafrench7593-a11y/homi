/**
 * Temps 1 — Ouverture (v5) : l'illustration `famille` sur le halo corail, puis le titre qui se lève, une phrase, la
 * durée. Le bouton principal (pied d'écran) est actif dès la première image ; seule la scène s'anime.
 * Lancement à froid : l'introduction de lancement (`LaunchIntro`) vient de jouer le logo maison ; l'ouverture ne le
 * rejoue PAS (aucun logo ici : l'illustration prend le relais) et le titre attend que le calque de l'introduction
 * s'efface. Réduire les animations : tout est posé d'emblée.
 */
import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { launchLogoState, onLaunchLogoState } from '@/components/LaunchIntro';
import { Text } from '@/components/ui';
import { HeroArt, heroSize } from '@/features/entry/HeroArt';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Le titre se lève pendant l'arrivée de l'illustration (elle dure ≈ 520 ms). */
export const OPENING_TITLE_DELAY = 220;
/** Après l'introduction de lancement : le titre suit presque aussitôt l'effacement du calque. */
export const HANDOFF_TITLE_DELAY = 60;

export function OpeningStep({ compact }: { compact: boolean }) {
  const t = useTheme();
  const m = useMotion();
  const win = useWindowDimensions();
  // Relais de l'introduction de lancement : le titre attend que le calque s'efface
  const [handoff] = useState(() => launchLogoState() !== 'none');
  const [introGone, setIntroGone] = useState(() => launchLogoState() !== 'playing');
  useEffect(() => (introGone ? undefined : onLaunchLogoState((s) => { if (s === 'done') setIntroGone(true); })), [introGone]);
  const art = heroSize(win, { max: 300, min: 136, reserve: compact ? 430 : 470 });
  const rise = useSharedValue(m.off ? 1 : 0);
  useEffect(() => {
    if (!introGone) return undefined;
    rise.value = m.delay(handoff ? HANDOFF_TITLE_DELAY : OPENING_TITLE_DELAY, m.timing(1, 520, 'decelerate'));
    return () => cancelAnimation(rise);
    // une ouverture par montage (ou à la fin de l'introduction de lancement)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introGone]);
  const moves = m.level === 'full';
  const title = useAnimatedStyle(() => ({ opacity: rise.value, transform: [{ translateY: moves ? (1 - rise.value) * 12 : 0 }] }));
  const lead = useAnimatedStyle(() => ({ opacity: Math.max(0, rise.value * 1.4 - 0.4), transform: [{ translateY: moves ? (1 - rise.value) * 16 : 0 }] }));
  return (
    <View style={{ alignItems: 'center', gap: compact ? spacing.sm : spacing.md, paddingTop: compact ? 0 : spacing.md }} testID="onb-opening">
      {/* L'illustration arrive avec la fin de l'introduction de lancement (jamais deux logos d'affilée) */}
      {introGone ? <HeroArt name="famille" size={art} testID="onb-art" /> : <View style={{ width: art, height: art }} />}
      <Animated.View style={[{ alignItems: 'center', paddingHorizontal: spacing.sm }, title]}>
        <Text center accessibilityRole="header" maxFontSizeMultiplier={1.3}
          style={[typography.display, { fontSize: compact ? 28 : 34, lineHeight: compact ? 34 : 40, color: t.colors.text }]}>{tr('o2.open.title')}</Text>
      </Animated.View>
      <Animated.View style={[{ alignItems: 'center', gap: spacing.xs, maxWidth: 330 }, lead]}>
        <Text center muted>{tr('o2.open.lead')}</Text>
        <Text variant="small" center color={t.colors.textMuted}>{tr('o2.open.time')}</Text>
      </Animated.View>
    </View>
  );
}
