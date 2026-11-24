/**
 * Anneau de progression animé (kit « motion » partagé, 24/11/2026). La valeur (0–1) est la vérité ; l'arc la rejoint par
 * ressort (immédiat avec « Réduire les animations »). Couleurs au choix pour se poser sur une carte claire ou sombre.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useMotion } from '@/motion/useMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function AnimatedProgressRing({ progress, size = 64, stroke = 5, color, track, children, label, testID }: {
  progress: number; size?: number; stroke?: number; color: string; track: string; children?: React.ReactNode; label?: string; testID?: string;
}) {
  const motion = useMotion();
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = useSharedValue(p);
  useEffect(() => { v.value = motion.spring(p, 'doux'); }, [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - v.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} testID={testID}
      accessible={!!label} accessibilityLabel={label}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} animatedProps={props} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}
