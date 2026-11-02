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
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { t as tr } from '@/i18n';

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
      Animated.timing(float, { isInteraction: false, toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(float, { isInteraction: false, toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, float]);

  // Lueur du cœur : animation décorative (≈ 1 battement/s pour rester douce), ne mesure rien
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(beat, { isInteraction: false, toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(beat, { isInteraction: false, toValue: 0.35, duration: 160, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(beat, { isInteraction: false, toValue: 0.85, duration: 160, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(beat, { isInteraction: false, toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
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
      accessibilityLabel={accessibilityLabel ?? tr('u8.fetus.a11y')}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', opacity: fade, transform: [{ perspective: 800 }, { translateY }, { rotateY }] }}>
        {/* image agrandie : son liseré sombre d'origine sort du cercle, remplacé par le fil doré */}
        <Image source={source} style={{ position: 'absolute', width: size * 1.22, height: size * 1.22, left: -size * 0.11, top: -size * 0.11 }} resizeMode="cover" />
        <GoldRim size={size} still={reduce} />
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

/**
 * Bord de la bulle : un fil d'or fin (comme le logo), doublé d'un second fil plus léger, avec une étincelle
 * de lumière qui glisse le long du fil. Immobile si les animations sont réduites.
 */
function GoldRim({ size, still }: { size: number; still: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const spin2 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const a = Animated.loop(Animated.timing(spin, { isInteraction: false, toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    const b = Animated.loop(Animated.timing(spin2, { isInteraction: false, toValue: 1, duration: 9500, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [still, spin, spin2]);
  const r = size / 2;
  const r1 = r - 2.2;
  const r2 = r - 6;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const full = { position: 'absolute' as const, left: 0, top: 0, width: size, height: size };
  const rot = (v: Animated.Value, from: number, dir = 1) => ({ transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${from}deg`, `${from + dir * 360}deg`] }) }] });
  return (
    <View pointerEvents="none" style={full} testID="fetus-gold-rim">
      {/* fils fixes : un trait d'or net et un second, plus fin et plus pâle */}
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="rimGold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFF6DC" />
            <Stop offset="0.5" stopColor="#FFD58A" />
            <Stop offset="1" stopColor="#FFE7A8" />
          </LinearGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r1} stroke="#FFC861" strokeOpacity={0.22} strokeWidth={9} fill="none" />
        <Circle cx={r} cy={r} r={r1} stroke="#FFC861" strokeOpacity={0.45} strokeWidth={4.5} fill="none" />
        <Circle cx={r} cy={r} r={r1} stroke="url(#rimGold)" strokeWidth={2} fill="none" />
        <Circle cx={r} cy={r} r={r2} stroke="#FFE7B0" strokeOpacity={0.35} strokeWidth={0.8} fill="none" />
      </Svg>
      {/* étincelle qui file le long du fil (traînée qui s'estompe) */}
      <Animated.View style={[full, { opacity: still ? 0 : 1 }, rot(spin, -90)]}>
        <Svg width={size} height={size}>
          <Circle cx={r} cy={r} r={r1} stroke="#FFE7B0" strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${c1 * 0.16} ${c1}`} fill="none" />
          <Circle cx={r} cy={r} r={r1} stroke="#FFF6DE" strokeOpacity={0.9} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${c1 * 0.07} ${c1}`} strokeDashoffset={-c1 * 0.09} fill="none" />
          <Circle cx={r} cy={r} r={r1} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeDasharray={`${c1 * 0.012} ${c1}`} strokeDashoffset={-c1 * 0.148} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[full, { opacity: still ? 0 : 0.8 }, rot(spin2, 90, -1)]}>
        <Svg width={size} height={size}>
          <Circle cx={r} cy={r} r={r2} stroke="#FFE7B0" strokeOpacity={0.7} strokeWidth={1.4} strokeLinecap="round" strokeDasharray={`${c2 * 0.05} ${c2}`} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}
