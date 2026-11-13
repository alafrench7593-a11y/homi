/**
 * Fond HOMI v2 (derrière toutes les pages).
 *  · Clair : ivoire chaud, deux lueurs pastel de la palette (accent en haut, accent 2 en bas) qui suivent lentement
 *    l'heure, quelques particules claires.
 *  · Sombre : graphite presque noir (jamais violet), lueurs de la palette très retenues, particules discrètes.
 * Les couleurs viennent du thème (palette Auto comprise : la transition horaire se voit aussi ici, en douceur).
 * Décoratif, toujours derrière le contenu ; « Réduire les animations » ou économie d'énergie : immobile.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, PALETTES, themes } from '@/theme/tokens';

function useLoop(ms: number, still: boolean) {
  const v = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (still) { v.setValue(0.5); return; }
    const ease = Easing.inOut(Easing.sin);
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(v, { isInteraction: false, toValue: 1, duration: ms, easing: ease, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { isInteraction: false, toValue: 0, duration: ms, easing: ease, useNativeDriver: NATIVE_DRIVER }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [ms, still, v]);
  return v;
}

/** Position de la lumière selon l'heure (0..1 en x). */
export const lightX = (hour: number) => Math.max(0.1, Math.min(0.9, (hour - 6) / 14));

export function PowderSky({ hour, night, still: stillProp }: { hour: number; night: boolean; still?: boolean }) {
  const reduce = useReduceMotion();
  const theme = useTheme();
  const still = reduce || !!stillProp;
  const { width: W, height: H } = useWindowDimensions();
  const breathe = useLoop(8000, still);
  const drift = useLoop(30000, still);
  const id = React.useId().replace(/:/g, '');
  const lx = lightX(hour);
  // Les deux calques (clair et sombre) existent pendant le fondu : chacun prend les neutres de SON mode et les
  // lueurs de la palette affichée
  const base = themes[night ? 'dark' : 'light'].colors;
  const [ga, gb] = theme.name === 'night' ? PALETTES[theme.palette].glow : theme.tokens.accent.glow;
  const g = base.gradient;
  const motes = useMemo(() => Array.from({ length: night ? 18 : 10 }, (_, i) => ({ x: ((i * 61) % 100) / 100, y: ((i * 37) % 100) / 100, r: 0.8 + (i % 3) * 0.5, o: 0.3 + (i % 4) * 0.12 })), [night]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: base.background }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={night ? 'bg-night' : 'bg-powder'}>
      <LinearGradient colors={g} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* lueurs de la palette, qui respirent lentement */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }), transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }) }] }]}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id={`l${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={ga} stopOpacity={night ? 0.16 : 0.3} />
              <Stop offset="1" stopColor={ga} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`b${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={gb} stopOpacity={night ? 0.13 : 0.26} />
              <Stop offset="1" stopColor={gb} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`w${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={night ? 0.03 : 0.7} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={W * lx} cy={H * 0.1} rx={W * 0.95} ry={H * 0.3} fill={`url(#l${id})`} />
          <Ellipse cx={W * (1 - lx)} cy={H * 0.9} rx={W * 0.95} ry={H * 0.3} fill={`url(#b${id})`} />
          <Ellipse cx={W * 0.5} cy={H * 0.42} rx={W * 0.7} ry={H * 0.22} fill={`url(#w${id})`} />
        </Svg>
      </Animated.View>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {motes.map((m, i) => <Circle key={i} cx={m.x * W} cy={m.y * H} r={m.r} fill="#FFFFFF" opacity={night ? m.o * 0.5 : m.o * 0.7} />)}
      </Svg>
    </View>
  );
}
