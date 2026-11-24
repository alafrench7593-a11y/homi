/**
 * Biberon gradué animé (refonte « motion », lot 2 — 24/11/2026). Le niveau représente EXACTEMENT la quantité donnée
 * (ml) sur une échelle graduée ; il monte ou descend par ressort quand la quantité change (immédiat avec « Réduire les
 * animations »). Capacité 240 ml, ou 330 ml au-delà. Purement visuel : la valeur lue reste le chiffre affiché à côté.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { bottleScale } from '@/lib/domain/bottleScale';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export { bottleScale } from '@/lib/domain/bottleScale';

const W = 84;
const H = 168;
const BODY = { x: 14, y: 42, w: 56, h: 118, r: 14 };

export function AnimatedBottle({ ml, testID = 'animated-bottle' }: { ml: number | null | undefined; testID?: string }) {
  const t = useTheme();
  const motion = useMotion();
  const { capacity, ticks } = bottleScale(ml);
  const ratio = Math.max(0, Math.min(1, (ml ?? 0) / capacity));
  const level = useSharedValue(ratio);
  useEffect(() => { level.value = motion.spring(ratio, 'doux'); }, [ratio]); // eslint-disable-line react-hooks/exhaustive-deps
  const liquid = useAnimatedProps(() => {
    const h = BODY.h * level.value;
    return { y: BODY.y + BODY.h - h, height: h };
  });
  const yOf = (v: number) => BODY.y + BODY.h - (v / capacity) * BODY.h;
  const ink = t.colors.textMuted;
  return (
    <View style={{ width: W, height: H }} testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="bottle-body"><Rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} /></ClipPath>
        </Defs>
        {/* tétine et bague */}
        <Path d={`M ${W / 2 - 9} 24 Q ${W / 2} 2 ${W / 2 + 9} 24 Z`} fill={t.colors.surfaceAlt} stroke={t.colors.border} strokeWidth={1.5} />
        <Rect x={BODY.x + 6} y={24} width={BODY.w - 12} height={18} rx={5} fill={t.colors.primary} />
        {/* lait */}
        <G clipPath="url(#bottle-body)">
          <Rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} fill={t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} />
          <AnimatedRect x={BODY.x} width={BODY.w} animatedProps={liquid} fill={t.isDark ? '#E9DFC9' : '#F1E3C4'} />
        </G>
        {/* corps */}
        <Rect x={BODY.x} y={BODY.y} width={BODY.w} height={BODY.h} rx={BODY.r} fill="none" stroke={t.colors.text} strokeOpacity={0.35} strokeWidth={1.5} />
        {/* graduations : tous les 30 ml, chiffre tous les 60 ml */}
        {ticks.map((v) => (
          <G key={v}>
            <Line x1={BODY.x} x2={BODY.x + (v % 60 === 0 ? 12 : 7)} y1={yOf(v)} y2={yOf(v)} stroke={ink} strokeWidth={1} />
            {v % 60 === 0 && v < capacity ? <SvgText x={BODY.x + 15} y={yOf(v) + 3.5} fontSize={9} fill={ink} fontFamily={fonts.body}>{String(v)}</SvgText> : null}
          </G>
        ))}
      </Svg>
    </View>
  );
}
