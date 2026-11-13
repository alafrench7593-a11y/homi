/**
 * Fond « HOMI ».
 *  · Jour « Perle » : perle et lilas très pâle, lumière douce qui suit lentement l'heure, quelques particules claires.
 *  · Nuit « Minuit » : midnight violet et prune (jamais noir), halo lilas, particules lumineuses.
 * Décoratif, toujours derrière le contenu ; « Réduire les animations » ou économie d'énergie : immobile.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER } from '@/theme/tokens';

export const POWDER = { base: '#F4F0FA', cream: '#FBF9FE', beige: '#E9E2F5', light: '#FFFFFF' };
export const NIGHT_SKY = { top: '#261C4A', mid: '#1A1433', bottom: '#110D23', plum: '#5B2A86' };

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

/** Position de la lumière chaude selon l'heure (0..1 en x). */
export const lightX = (hour: number) => Math.max(0.1, Math.min(0.9, (hour - 6) / 14));

export function PowderSky({ hour, night, still: stillProp }: { hour: number; night: boolean; still?: boolean }) {
  const reduce = useReduceMotion();
  const still = reduce || !!stillProp;
  const { width: W, height: H } = useWindowDimensions();
  const breathe = useLoop(8000, still);
  const drift = useLoop(30000, still);
  const id = React.useId().replace(/:/g, '');
  const lx = lightX(hour);
  const motes = useMemo(() => Array.from({ length: night ? 22 : 12 }, (_, i) => ({ x: ((i * 61) % 100) / 100, y: ((i * 37) % 100) / 100, r: 0.8 + (i % 3) * 0.6, o: 0.35 + (i % 4) * 0.13 })), [night]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: night ? NIGHT_SKY.mid : POWDER.base }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={night ? 'bg-night' : 'bg-powder'}>
      <LinearGradient
        colors={night ? [NIGHT_SKY.top, NIGHT_SKY.mid, NIGHT_SKY.bottom] : [POWDER.cream, POWDER.base, POWDER.beige]}
        locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill}
      />
      {/* lumière chaude (jour) ou halo prune (nuit), qui respire lentement */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }), transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }) }] }]}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id={`l${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={night ? NIGHT_SKY.plum : POWDER.light} stopOpacity={night ? 0.55 : 0.85} />
              <Stop offset="1" stopColor={night ? NIGHT_SKY.plum : POWDER.light} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`b${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={night ? '#4A3A8C' : '#E4DAFB'} stopOpacity={night ? 0.5 : 0.7} />
              <Stop offset="1" stopColor={night ? '#4A3A8C' : '#E4DAFB'} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={W * lx} cy={H * 0.16} rx={W * 0.85} ry={H * 0.32} fill={`url(#l${id})`} />
          <Ellipse cx={W * (1 - lx)} cy={H * 0.86} rx={W * 0.9} ry={H * 0.3} fill={`url(#b${id})`} />
        </Svg>
      </Animated.View>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {motes.map((m, i) => <Circle key={i} cx={m.x * W} cy={m.y * H} r={m.r} fill={night ? '#F3E6FF' : '#FFFFFF'} opacity={night ? m.o : m.o * 0.7} />)}
      </Svg>
    </View>
  );
}
