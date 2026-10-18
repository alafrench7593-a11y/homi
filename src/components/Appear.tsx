/**
 * Apparitions en cascade (inspirées des entrées « liquid glass ») :
 * scale · soft · mask · pop · btn · side · stat. Le contenu est toujours visible au repos
 * si les animations sont réduites ; sinon il apparaît une seule fois au montage.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { useReduceMotion } from '@/theme/ThemeProvider';

export type AppearKind = 'scale' | 'soft' | 'mask' | 'pop' | 'btn' | 'side' | 'stat';

// cubic-bezier(0.16, 1, 0.3, 1) — décélération longue et douce
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function Appear({ kind = 'soft', delay = 0.08, duration = 1.05, style, children }: { kind?: AppearKind; delay?: number; duration?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const a = kind === 'pop'
      ? Animated.sequence([
        Animated.delay(delay * 1000),
        Animated.timing(v, { toValue: 0.7, duration: duration * 700, easing: EASE, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(v, { toValue: 1, duration: duration * 300, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      ])
      : Animated.timing(v, { toValue: 1, duration: duration * 1000, delay: delay * 1000, easing: EASE, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [v, reduce, kind, delay, duration]);

  const opacity = kind === 'pop' ? v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 1] }) : v;
  const transform = (() => {
    switch (kind) {
      case 'scale': return [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1] }) }];
      case 'soft': return [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }];
      case 'mask': return [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }];
      case 'pop': return [{ scale: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 1.03, 1] }) }];
      case 'btn': return [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }];
      case 'side': return [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }];
      case 'stat': return [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }];
    }
  })();
  const inner = <Animated.View style={[{ opacity, transform }, kind === 'mask' ? undefined : style]}>{children}</Animated.View>;
  // « mask » : la ligne monte depuis un cadre qui la coupe
  return kind === 'mask' ? <View style={[{ overflow: 'hidden' }, style]}>{inner}</View> : inner;
}
