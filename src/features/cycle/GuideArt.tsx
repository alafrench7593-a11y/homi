/**
 * Illustration ABSTRAITE d'une fiche (formes douces, non explicites, non trompeuses : elles évoquent une ambiance,
 * pas un aspect médical). Respiration lente ; immobile si « réduire les animations ».
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { useCyclePalette } from './kit';
import type { Guide } from '@/content/dischargeGuides';

export function GuideArt({ tone, size = 120 }: { tone: Guide['tone']; size?: number }) {
  const c = useCyclePalette();
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { isInteraction: false, toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { isInteraction: false, toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, reduce]);
  const fill = { clear: c.pearl, white: c.beige, stretchy: c.lavender, more: c.fertile, thick: c.beige, yellow: '#E9DDB0', odor: c.lavender, pink: c.powder, itch: c.rose, dry: c.pearl }[tone];
  const id = `g-${tone}`;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={{ width: size, height: size }}>
      <Animated.View style={{ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={fill} stopOpacity="0.95" />
              <Stop offset="1" stopColor={c.estimate} stopOpacity="0.55" />
            </LinearGradient>
          </Defs>
          <Circle cx="60" cy="60" r="54" fill={c.paper} opacity={0.6} />
          {tone === 'stretchy' ? <Path d="M30 44c14 0 14 32 30 32s16-32 30-32" stroke={c.mauve} strokeWidth="3" fill="none" strokeLinecap="round" /> : null}
          {tone === 'dry' ? <Path d="M34 70h52M40 58h40M46 46h28" stroke={c.inkSoft} strokeWidth="2.4" strokeLinecap="round" opacity={0.6} /> : null}
          {tone === 'itch' || tone === 'odor' ? <Path d="M36 40q6 6 0 12q-6 6 0 12M84 40q6 6 0 12q-6 6 0 12" stroke={c.mauve} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity={0.7} /> : null}
          <Path d="M60 22c13 17 22 29 22 41a22 22 0 0 1-44 0c0-12 9-24 22-41z" fill={`url(#${id})`} />
          {tone === 'thick' ? <><Circle cx="52" cy="66" r="4" fill={c.paper} /><Circle cx="64" cy="72" r="3" fill={c.paper} /><Circle cx="60" cy="58" r="2.5" fill={c.paper} /></> : null}
          {tone === 'more' ? <Ellipse cx="60" cy="96" rx="26" ry="5" fill={c.estimate} opacity={0.45} /> : null}
          <Ellipse cx="52" cy="50" rx="5" ry="9" fill="#FFFFFF" opacity={0.55} />
        </Svg>
      </Animated.View>
    </View>
  );
}
