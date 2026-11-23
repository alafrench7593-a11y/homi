/**
 * COCHE DE SUCCÈS — confirmation qu'une action a réellement abouti (bouton après enregistrement, toast, étape
 * validée). La coche arrive en ressort « rebond léger » (0,6 → 1) et se TRACE (240 ms, 60 ms après). Non interactive
 * (pour une case à cocher : `CompletionCheck`). Haptique « succès » facultatif, une fois, à l'apparition.
 *
 *  - 'off' : coche complète immédiatement ; 'minimal' (nuit) : fondu court, sans ressort.
 *  - un seul petit tracé SVG animé (strokeDashoffset) ; tout le reste est transform + opacité.
 *
 *   <SuccessCheck visible={saved} color={fg} />
 */
import React, { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { successCheck } from './curves';
import { motionHaptic } from './haptics';
import { useMotion } from './useMotion';

const AnimatedPath = Animated.createAnimatedComponent(Path);
/** Coche dessinée dans une boîte 24 × 24 ; longueur mesurée du tracé (même tracé que `CompletionCheck`). */
const CHECK_D = 'M6.5 12.5 L10.5 16.5 L17.5 8.5';
const CHECK_LEN = 17.3;

export function SuccessCheck({ visible, size = 24, color, haptic = false, style, testID }: {
  visible: boolean;
  size?: number;
  color?: string;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const pop = useSharedValue(visible ? 1 : 0);
  const draw = useSharedValue(visible ? 1 : 0);
  const prev = useRef(visible);
  useEffect(() => {
    if (prev.current === visible) return;
    prev.current = visible;
    if (!visible) {
      pop.value = m.timing(0, successCheck.fillMs, 'standard');
      draw.value = m.timing(0, successCheck.fillMs, 'standard');
      return;
    }
    if (haptic) motionHaptic('success');
    if (m.level === 'full') {
      pop.value = 0.6;
      pop.value = m.spring(1, 'rebondLeger');
      draw.value = 0;
      draw.value = m.delay(successCheck.drawDelayMs, m.timing(1, successCheck.drawMs, 'decelerate'));
    } else {
      pop.value = m.timing(1, successCheck.fillMs, 'standard');
      draw.value = m.timing(1, successCheck.fillMs, 'standard');
    }
  }, [visible, haptic, m, pop, draw]);
  useEffect(() => () => { cancelAnimation(pop); cancelAnimation(draw); }, [pop, draw]);
  const boxStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 1.6), transform: [{ scale: 0.6 + 0.4 * pop.value }] }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Animated.View testID={testID} style={boxStyle}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <AnimatedPath d={CHECK_D} stroke={color ?? t.colors.success} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none"
            strokeDasharray={[CHECK_LEN, CHECK_LEN]} animatedProps={checkProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}
