/**
 * Fond « aurore » : voiles de lumière douce aux couleurs de la palette affichée (HOMI v2), qui ondulent très
 * lentement derrière le contenu. Ivoire le jour, graphite le soir et la nuit.
 * Purement décoratif : masqué aux lecteurs d'écran, immobile si « Réduire les animations » est activé.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, LinearGradient as SvgLinear, Path, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';

export type AuroraMood = 'day' | 'dawn' | 'evening' | 'night' | 'lowlight';

type MoodColors = { base: [string, string, string]; glows: { c: string; o: number }[]; ribbons: { c: string; o: number }[] };
/**
 * HOMI v2 : fonds ivoire (jour) ou graphite (soir, nuit), lueurs aux deux accents de la palette affichée (a, b).
 * `lowlight` (soins nocturnes) : graphite presque noir, lueurs à peine perceptibles.
 */
function moodColors(mood: AuroraMood, a: string, b: string): MoodColors {
  switch (mood) {
    case 'dawn':
    case 'day':
      return { base: ['#FAF8F4', '#F4F1EB', '#EEEAE3'], glows: [{ c: a, o: 0.32 }, { c: b, o: 0.26 }, { c: '#FFFFFF', o: 0.6 }, { c: b, o: 0.2 }], ribbons: [{ c: a, o: 0.16 }, { c: b, o: 0.12 }] };
    case 'evening':
      return { base: ['#17181C', '#0F1013', '#0A0B0D'], glows: [{ c: a, o: 0.3 }, { c: b, o: 0.24 }, { c: a, o: 0.18 }, { c: b, o: 0.14 }], ribbons: [{ c: a, o: 0.18 }, { c: b, o: 0.14 }] };
    case 'night':
      return { base: ['#141519', '#0D0E11', '#08090B'], glows: [{ c: a, o: 0.22 }, { c: b, o: 0.18 }, { c: a, o: 0.12 }, { c: b, o: 0.1 }], ribbons: [{ c: a, o: 0.14 }, { c: b, o: 0.1 }] };
    default:
      return { base: ['#0B0B0E', '#09090C', '#08080B'], glows: [{ c: a, o: 0.1 }, { c: b, o: 0.08 }, { c: '#6E6B78', o: 0.06 }, { c: a, o: 0.05 }], ribbons: [{ c: a, o: 0.06 }, { c: b, o: 0.05 }] };
  }
}

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
      Animated.timing(v, { isInteraction: false, toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { isInteraction: false, toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
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
  const [ga, gb] = t.tokens.accent.glow;
  const m = useMemo(() => moodColors(mood, ga, gb), [mood, ga, gb]);
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
