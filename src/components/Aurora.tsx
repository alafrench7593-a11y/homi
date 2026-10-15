/**
 * Fond « aurore boréale » : voiles de lumière douce (pêche, rose, lavande, menthe)
 * qui ondulent très lentement derrière le contenu. Chaleureux le jour, lumineux la nuit.
 * Purement décoratif : masqué aux lecteurs d'écran, immobile si « Réduire les animations » est activé.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, LinearGradient as SvgLinear, Path, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';

export type AuroraMood = 'day' | 'dawn' | 'evening' | 'night' | 'lowlight';

const MOODS: Record<AuroraMood, { base: [string, string, string]; glows: { c: string; o: number }[]; ribbons: { c: string; o: number }[] }> = {
  dawn: {
    base: ['#FFF3EC', '#FFEFF1', '#F7F0FB'],
    glows: [{ c: '#FFC2A3', o: 0.75 }, { c: '#FFB0C8', o: 0.6 }, { c: '#D3C4FF', o: 0.55 }, { c: '#FFE2A6', o: 0.5 }],
    ribbons: [{ c: '#FFB3C7', o: 0.35 }, { c: '#C9B8FF', o: 0.3 }],
  },
  day: {
    base: ['#FFF7F0', '#FFF2F1', '#F6F1FC'],
    glows: [{ c: '#FFCBB0', o: 0.65 }, { c: '#FFB9CF', o: 0.55 }, { c: '#CFC2FF', o: 0.55 }, { c: '#BFEBDC', o: 0.5 }],
    ribbons: [{ c: '#FFC1D2', o: 0.3 }, { c: '#BDE9DB', o: 0.28 }],
  },
  evening: {
    base: ['#2A1834', '#1C1128', '#120B1C'],
    glows: [{ c: '#FF7EA6', o: 0.42 }, { c: '#FFA071', o: 0.32 }, { c: '#8F70FF', o: 0.4 }, { c: '#46CDB4', o: 0.22 }],
    ribbons: [{ c: '#FF8DB0', o: 0.28 }, { c: '#9C82FF', o: 0.26 }],
  },
  night: {
    base: ['#1D1430', '#140D22', '#0C0815'],
    glows: [{ c: '#7C66FF', o: 0.4 }, { c: '#3FD1B5', o: 0.3 }, { c: '#FF77A2', o: 0.3 }, { c: '#FFB07A', o: 0.16 }],
    ribbons: [{ c: '#4FE0C2', o: 0.26 }, { c: '#A08BFF', o: 0.26 }],
  },
  lowlight: {
    base: ['#0D0912', '#100A16', '#140C1B'],
    glows: [{ c: '#7C5A8E', o: 0.22 }, { c: '#8A4D66', o: 0.18 }, { c: '#3D6E6A', o: 0.12 }, { c: '#7A5A3E', o: 0.1 }],
    ribbons: [{ c: '#6E5A8E', o: 0.12 }, { c: '#4E7A74', o: 0.1 }],
  },
};

export function moodFor(themeName: string, phase?: string): AuroraMood {
  if (themeName === 'night') return 'lowlight';
  if (themeName === 'dark') return phase === 'dusk' ? 'evening' : 'night';
  return phase === 'dawn' ? 'dawn' : 'day';
}

function useDrift(duration: number, reduce: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration, reduce]);
  return v;
}

export function Aurora({ mood: forced, intensity = 1 }: { mood?: AuroraMood; intensity?: number }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const mood = forced ?? moodFor(t.name, t.phase);
  const m = MOODS[mood];
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const d1 = useDrift(14000, reduce);
  const d2 = useDrift(19000, reduce);
  const d3 = useDrift(23000, reduce);

  const W = Math.max(width, 360);
  const H = Math.max(height, 640);
  const glowSpots = useMemo(() => [
    { cx: W * 0.15, cy: H * 0.08, rx: W * 0.75, ry: H * 0.28 },
    { cx: W * 0.95, cy: H * 0.22, rx: W * 0.7, ry: H * 0.3 },
    { cx: W * 0.3, cy: H * 0.62, rx: W * 0.8, ry: H * 0.3 },
    { cx: W * 0.9, cy: H * 0.9, rx: W * 0.7, ry: H * 0.28 },
  ], [W, H]);

  const ribbon = (y: number, amp: number, thick: number) =>
    `M ${-W * 0.3} ${y} C ${W * 0.2} ${y - amp}, ${W * 0.55} ${y + amp}, ${W * 1.3} ${y - amp * 0.4} L ${W * 1.3} ${y - amp * 0.4 + thick} C ${W * 0.55} ${y + amp + thick}, ${W * 0.2} ${y - amp + thick}, ${-W * 0.3} ${y + thick} Z`;

  const tx = (v: Animated.Value, a: number) => v.interpolate({ inputRange: [0, 1], outputRange: [-a, a] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={m.base} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* halos de couleur */}
      <Animated.View style={{ position: 'absolute', left: -W * 0.15, top: -H * 0.05, width: W * 1.3, height: H * 1.1, transform: [{ translateX: tx(d1, W * 0.06) }, { translateY: tx(d2, H * 0.02) }] }}>
        <Svg width={W * 1.3} height={H * 1.1} viewBox={`${-W * 0.15} ${-H * 0.05} ${W * 1.3} ${H * 1.1}`}>
          <Defs>
            {m.glows.map((g, i) => (
              <RadialGradient key={i} id={`g${uid}${i}`} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" stopColor={g.c} stopOpacity={g.o * intensity} />
                <Stop offset="0.55" stopColor={g.c} stopOpacity={g.o * intensity * 0.35} />
                <Stop offset="1" stopColor={g.c} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {glowSpots.map((s, i) => <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={`url(#g${uid}${i % m.glows.length})`} />)}
        </Svg>
      </Animated.View>
      {/* voiles d'aurore */}
      {m.ribbons.map((r, i) => (
        <Animated.View key={i} style={{ position: 'absolute', left: -W * 0.25, top: 0, width: W * 1.5, height: H, transform: [{ translateX: tx(i ? d3 : d2, W * 0.1) }, { translateY: tx(i ? d1 : d3, 10) }, { skewY: i ? '-4deg' : '3deg' }] }}>
          <Svg width={W * 1.5} height={H} viewBox={`${-W * 0.25} 0 ${W * 1.5} ${H}`}>
            <Defs>
              <SvgLinear id={`r${uid}${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={r.c} stopOpacity={0} />
                <Stop offset="0.45" stopColor={r.c} stopOpacity={r.o * intensity} />
                <Stop offset="1" stopColor={r.c} stopOpacity={0} />
              </SvgLinear>
            </Defs>
            <Path d={ribbon(H * (i ? 0.36 : 0.12), H * 0.07, H * 0.16)} fill={`url(#r${uid}${i})`} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}
