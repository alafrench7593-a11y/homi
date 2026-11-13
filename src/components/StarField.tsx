import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { useReduceMotion } from '@/theme/ThemeProvider';

/** Étoiles discrètes qui scintillent lentement ; immobiles si « Réduire les animations » est activé. */
export function StarField({ density = 36, color = '#F6EFE4' }: { density?: number; color?: string }) {
  const reduce = useReduceMotion();
  const stars = useMemo(
    () => Array.from({ length: density }, (_, i) => ({
      key: i,
      left: `${(i * 37.7 + (i % 7) * 11) % 100}%` as const,
      top: `${(i * 23.3 + (i % 5) * 17) % 100}%` as const,
      size: i % 9 === 0 ? 2.6 : i % 3 === 0 ? 1.8 : 1.2,
      phase: (i % 6) / 6,
    })),
    [density],
  );
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(pulse, { isInteraction: false, toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {stars.map((s) => (
        <Animated.View
          key={s.key}
          style={{
            position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: s.size, backgroundColor: color,
            opacity: reduce ? 0.55 : pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25 + s.phase * 0.4, 0.85 - s.phase * 0.3, 0.25 + s.phase * 0.4] }),
          }}
        />
      ))}
    </View>
  );
}
