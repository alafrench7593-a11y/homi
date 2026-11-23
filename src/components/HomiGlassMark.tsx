/**
 * `HomiGlassMark` — le symbole HOMI dans sa tuile de verre (même dessin que l'icône de l'app,
 * src/brand/toolLogo/appIcon.ts) : version STATIQUE (variantes clair / sombre selon le thème) et SIGNATURE ANIMÉE
 * courte, jouée dans un moment de marque interne (Réglages › À propos, galerie) — jamais devant l'accès à l'app.
 *
 * Signature (≈ 1,1 s, une seule horloge sur le fil UI, transform + opacité uniquement) :
 *   1. la tuile se pose (0,92 → 1) ;
 *   2. le corps « M » monte de la lentille, puis les deux têtes se posent (back-out léger) — l'ASSEMBLAGE du symbole ;
 *   3. le relief évolue : le reflet de la lentille s'allume puis se stabilise (1 → 0,55) ;
 *   4. retour à un état STABLE identique à la version statique.
 * « Réduire les animations » / économie d'énergie / `still` : version statique immédiate. Annoncé « HOMI ».
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { HOMI_PARTS } from '@/brand/homiMarkSvg';
import { appIconColors, appIconSvg, ICON_GRID, LENS, symbolTransform } from '@/brand/toolLogo/appIcon';
import { squircleRadius } from '@/brand/toolLogo/geometry';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { APP_ICON } from '@/theme/toolLogo';

/** Fenêtres de la signature (fractions de l'horloge 0 → 1, durée `MARK_MS`). */
export const MARK_MS = 1100;
export const MARK_TIMELINE = { tile: [0, 0.35], body: [0.12, 0.55], headA: [0.38, 0.75], headB: [0.46, 0.83], sheen: [0.55, 1] } as const;

const seg = (k: number, a: number, b: number) => {
  'worklet';
  return Math.min(1, Math.max(0, (k - a) / (b - a)));
};
const backOut = (x: number) => {
  'worklet';
  const s = 1.7;
  const u = x - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};

export function HomiGlassMark({ size = 96, animate = true, still = false, style, testID = 'homi-glass-mark' }: {
  size?: number;
  /** Joue la signature au montage (sinon : version statique). */
  animate?: boolean;
  still?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const tone = t.isDark ? 'dark' : 'light';
  const ink = appIconColors(tone).ink;
  const live = animate && !still && m.level === 'full';
  const k = useSharedValue(live ? 0 : 1);
  useEffect(() => {
    if (!live) { k.value = 1; return; }
    k.value = withTiming(1, { duration: MARK_MS, easing: Easing.linear });
    return () => cancelAnimation(k);
  }, [live, k]);
  const tile = useAnimatedStyle(() => {
    const p = seg(k.value, MARK_TIMELINE.tile[0], MARK_TIMELINE.tile[1]);
    const e = 1 - (1 - p) * (1 - p) * (1 - p);
    return { transform: [{ scale: 0.92 + 0.08 * e }] };
  });
  const body = useAnimatedStyle(() => {
    const p = seg(k.value, MARK_TIMELINE.body[0], MARK_TIMELINE.body[1]);
    const e = 1 - (1 - p) * (1 - p) * (1 - p);
    return { opacity: Math.min(1, p * 2.5), transform: [{ translateY: (1 - e) * size * 0.08 }] };
  });
  const headA = useAnimatedStyle(() => {
    const p = seg(k.value, MARK_TIMELINE.headA[0], MARK_TIMELINE.headA[1]);
    return { opacity: Math.min(1, p * 3), transform: [{ translateY: (1 - backOut(p)) * -size * 0.07 }] };
  });
  const headB = useAnimatedStyle(() => {
    const p = seg(k.value, MARK_TIMELINE.headB[0], MARK_TIMELINE.headB[1]);
    return { opacity: Math.min(1, p * 3), transform: [{ translateY: (1 - backOut(p)) * -size * 0.07 }] };
  });
  // relief : le reflet de la lentille s'allume puis se pose (état stable = 0)
  const sheen = useAnimatedStyle(() => {
    const p = seg(k.value, MARK_TIMELINE.sheen[0], MARK_TIMELINE.sheen[1]);
    return { opacity: Math.sin(p * Math.PI) * 0.9 };
  });
  const part = (d: string) => (
    <Svg width={size} height={size} viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`}>
      <Path transform={symbolTransform()} d={d} fill={ink} />
    </Svg>
  );
  const abs = StyleSheet.absoluteFill;
  const r = squircleRadius(size);
  return (
    <Animated.View testID={testID} accessibilityRole="image" accessibilityLabel="HOMI" aria-label="HOMI"
      style={[{ width: size, height: size, borderRadius: r, overflow: 'hidden', boxShadow: APP_ICON[tone].shadow }, tile, style]}>
      <View style={abs}><SvgXml xml={appIconSvg(tone, size, `gm${size}${tone}`, false)} width={size} height={size} /></View>
      <Animated.View style={[abs, body]}>{part(HOMI_PARTS.body.d)}</Animated.View>
      <Animated.View style={[abs, headA]}>{part(HOMI_PARTS.headA.d)}</Animated.View>
      <Animated.View style={[abs, headB]}>{part(HOMI_PARTS.headB.d)}</Animated.View>
      <Animated.View pointerEvents="none" style={[abs, sheen]}>
        <Svg width={size} height={size} viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`}>
          <Path d={`M${LENS.cx - LENS.r * 0.9} ${LENS.cy - LENS.r * 0.1} A${LENS.r * 0.92} ${LENS.r * 0.92} 0 0 1 ${LENS.cx + LENS.r * 0.5} ${LENS.cy - LENS.r * 0.78}`}
            fill="none" stroke={t.isDark ? ink : appIconColors('light').lens} strokeOpacity={0.9} strokeWidth={26} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
