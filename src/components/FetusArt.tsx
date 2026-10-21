/**
 * Illustration du bébé à naître pour une semaine donnée.
 * Utilise l'illustration générée de la semaine (src/assets/foetus) si elle existe,
 * sinon la semaine illustrée la plus proche en dessous, sinon l'illustration vectorielle FetusOrb.
 * Toujours une représentation ARTISTIQUE : ni une échographie, ni l'image de votre bébé.
 */
import { NATIVE_DRIVER } from '@/theme/tokens';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, PanResponder, View } from 'react-native';
import { FOETUS_IMAGES } from '@/assets/foetus';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { FetusOrb } from './FetusOrb';

export function foetusImageFor(week: number) {
  const available = Object.keys(FOETUS_IMAGES).map(Number).sort((a, b) => a - b);
  if (!available.length) return undefined;
  const w = Math.round(week);
  const exact = FOETUS_IMAGES[w];
  if (exact) return exact;
  const below = available.filter((x) => x <= w).pop();
  return FOETUS_IMAGES[below ?? available[0]];
}

interface Props {
  week: number;
  growth: number;
  size?: number;
  hue?: 'rose' | 'lavande' | 'or';
  interactive?: boolean;
  accessibilityLabel?: string;
}

export function FetusArt({ week, growth, size = 260, hue, interactive = true, accessibilityLabel }: Props) {
  const source = foetusImageFor(week);
  if (!source) return <FetusOrb growth={growth} size={size} hue={hue} interactive={interactive} accessibilityLabel={accessibilityLabel} />;
  return <FetusImage source={source} size={size} interactive={interactive} accessibilityLabel={accessibilityLabel} />;
}

function FetusImage({ source, size, interactive, accessibilityLabel }: { source: NonNullable<ReturnType<typeof foetusImageFor>>; size: number; interactive: boolean; accessibilityLabel?: string }) {
  const reduce = useReduceMotion();
  const tilt = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: reduce ? 0 : 450, useNativeDriver: NATIVE_DRIVER }).start();
  }, [source, fade, reduce]);

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(float, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, float]);

  // Lueur du cœur : animation décorative (≈ 1 battement/s pour rester douce), ne mesure rien
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(beat, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(beat, { toValue: 0.35, duration: 160, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(beat, { toValue: 0.85, duration: 160, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(beat, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, beat]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, gs) => interactive && Math.abs(gs.dx) > 4,
    onPanResponderMove: (_e, gs) => tilt.setValue(Math.max(-1, Math.min(1, gs.dx / (size * 0.8)))),
    onPanResponderRelease: () => Animated.spring(tilt, { toValue: 0, useNativeDriver: NATIVE_DRIVER, friction: 5, tension: 30 }).start(),
  }), [interactive, tilt, size]);

  const rotateY = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-22deg', '22deg'] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Illustration artistique du bébé à naître'}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', opacity: fade, transform: [{ perspective: 800 }, { translateY }, { rotateY }] }}>
        <Image source={source} style={{ width: size, height: size }} resizeMode="cover" />
        <Animated.View testID="fetus-heart" pointerEvents="none" style={{
          position: 'absolute', left: size * 0.47, top: size * 0.47, width: size * 0.07, height: size * 0.07, borderRadius: size,
          backgroundColor: 'rgba(255,120,150,0.9)', shadowColor: '#FF7896', shadowOpacity: 0.9, shadowRadius: size * 0.05, shadowOffset: { width: 0, height: 0 },
          opacity: reduce ? 0.7 : beat.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          transform: [{ scale: reduce ? 1 : beat.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.35] }) }],
        }} />
      </Animated.View>
    </View>
  );
}
