/**
 * Icône de module morphable (react-native-svg + Reanimated) : goutte ↔ lune ↔ cercle ↔ ventre ↔ maison ↔ cœur.
 *  - interpolation point à point de contours rééchantillonnés (src/motion/morphShapes.ts), 520 ms décélération ;
 *  - interruptible : un changement en cours repart de la forme réellement affichée ;
 *  - léger « souffle » d'échelle (0,94 au milieu du morph) sur la vue — transform uniquement ;
 *  - 'off' : forme finale immédiate ; 'minimal' (nuit) : 160 ms, sans souffle ;
 *  - décorative : masquée aux lecteurs d'écran (le libellé du module est porté par le texte voisin).
 * Le `d` du chemin est une propriété SVG (pas un transform) : réservé à de petites icônes (≤ 72 points).
 */
import React, { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { morph } from './curves';
import { lerpPoints, MORPH_POINTS, morphPath, type MorphShape } from './morphShapes';
import { useMotion } from './useMotion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = { shape: MorphShape; size?: number; color: string; style?: StyleProp<ViewStyle>; testID?: string; ms?: number };

export function MorphIcon({ shape, size = 40, color, style, testID, ms = morph.ms }: Props) {
  const m = useMotion();
  const from = useSharedValue<number[]>(MORPH_POINTS[shape]);
  const to = useSharedValue<number[]>(MORPH_POINTS[shape]);
  const p = useSharedValue(1);
  const first = useRef(true);
  // `d` statique figé au premier rendu : un re-rendu React ne doit jamais écraser la forme animée
  const initialD = useRef(morphPath(MORPH_POINTS[shape], MORPH_POINTS[shape], 1)).current;
  const breathe = m.level === 'full';

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    cancelAnimation(p);
    // reprise depuis la forme affichée (morph interrompu)
    from.value = lerpPoints(from.value, to.value, p.value);
    to.value = MORPH_POINTS[shape];
    p.value = 0;
    p.value = m.timing(1, ms, 'decelerate');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);
  useEffect(() => () => cancelAnimation(p), [p]);

  const animatedProps = useAnimatedProps(() => ({ d: morphPath(from.value, to.value, p.value) }));
  const wrap = useAnimatedStyle(() => ({
    transform: [{ scale: breathe ? 1 - 0.06 * Math.sin(Math.PI * Math.min(1, Math.max(0, p.value))) : 1 }],
  }));

  return (
    <View
      testID={testID}
      style={[{ width: size, height: size }, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      aria-hidden
    >
      <Animated.View style={wrap}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <AnimatedPath
            animatedProps={animatedProps}
            d={initialD}
            fill={color}
            stroke={color}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
