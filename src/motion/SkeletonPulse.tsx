/**
 * SQUELETTES DE CHARGEMENT — la FORME du composant qui arrive (mêmes rayons, mêmes hauteurs), dont les « os »
 * respirent ensemble (opacité 1 → 0,45 → 1, 900 ms par demi-cycle). Une seule valeur animée par groupe : tous les os
 * d'un squelette restent synchrones, et le fil UI n'anime qu'un nœud.
 *
 *  - 'off' (Réduire les animations, économie d'énergie) : os immobiles, pleinement visibles ;
 *  - 'minimal' (nuit) : os immobiles aussi (rien ne clignote pendant un soin de nuit) ;
 *  - annoncé une fois aux lecteurs d'écran (« Chargement », rôle progressbar), les os sont masqués ;
 *  - poser `SkeletonPulse` DANS une surface (carte, verre), jamais autour d'un verre : l'opacité d'un ancêtre fige le flou.
 *
 *   <SkeletonPulse label={tr('common.loadingA11y')}>
 *     <SkeletonBone width={44} height={44} radius={14} />
 *     <SkeletonBone width="60%" height={16} />
 *   </SkeletonPulse>
 */
import React, { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { linesOf, radius as R } from '@/theme/tokens';
import { curves, skeleton } from './curves';
import { useMotion } from './useMotion';

export function SkeletonPulse({ children, label, style, testID }: { children: React.ReactNode; label: string; style?: StyleProp<ViewStyle>; testID?: string }) {
  const m = useMotion();
  const v = useSharedValue(1);
  const animate = m.level === 'full';
  useEffect(() => {
    if (!animate) { cancelAnimation(v); v.value = 1; return; }
    v.value = withRepeat(withTiming(skeleton.min, { duration: skeleton.ms, easing: curves.standard, reduceMotion: ReduceMotion.Never }), -1, true);
    return () => cancelAnimation(v);
  }, [animate, v]);
  const anim = useAnimatedStyle(() => ({ opacity: v.value }));
  return (
    <Animated.View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }} testID={testID} style={[style, anim]}>
      {children}
    </Animated.View>
  );
}

/** Un « os » : bloc arrondi à la couleur des pistes du thème. */
export function SkeletonBone({ width = '100%', height = 14, radius = R.sm, color, style }: { width?: DimensionValue; height?: number; radius?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View accessibilityElementsHidden importantForAccessibility="no" style={[{ width, height, borderRadius: radius, backgroundColor: color ?? linesOf(t).track }, style]} />;
}
