/**
 * Fond du mode jour : un ciel lumineux et vivant (jamais blanc), aussi travaillé que le fond de nuit.
 * Couches, de l'arrière vers l'avant :
 *  1. dégradé du ciel (évolue avec l'heure, sans à-coup : couleurs interpolées, fondu à chaque mise à jour) ;
 *  2. halo de soleil diffus qui respire très lentement (jamais de gros soleil jaune) ;
 *  3. teinte douce du profil affiché (grossesse, cycle, bébé, enfant) ;
 *  4. nuages abstraits et formes floues qui dérivent presque imperceptiblement ;
 *  5. reflet nacré diagonal et vagues de couleur très légères ;
 *  6. petites particules lumineuses qui montent lentement.
 * Décoratif : masqué aux lecteurs d'écran, toujours DERRIÈRE le contenu. « Réduire les animations » ou
 * le mode économie d'énergie : le même beau fond, immobile.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { daySkyAt, PROFILE_TINTS, TINT_OPACITY, type SkyProfile, type SkyStops } from '@/theme/daySky';
import { NATIVE_DRIVER } from '@/theme/tokens';

const AnimatedLG = Animated.createAnimatedComponent(LinearGradient);

function useLoop(duration: number, still: boolean, pingPong = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) { v.setValue(0.5); return; }
    const ease = Easing.inOut(Easing.sin);
    const anim = pingPong
      ? Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: ease, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(v, { toValue: 0, duration, easing: ease, useNativeDriver: NATIVE_DRIVER }),
      ]))
      : Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    anim.start();
    return () => anim.stop();
  }, [duration, still, pingPong, v]);
  return v;
}

/** Une couche de dégradé qui apparaît en fondu par-dessus la précédente : jamais de saut de couleur. */
function SkyLayer({ sky }: { sky: SkyStops }) {
  const [layers, setLayers] = useState<{ key: number; sky: SkyStops }[]>([{ key: 0, sky }]);
  const fade = useRef(new Animated.Value(1)).current;
  const last = useRef(sky.stops.join());
  useEffect(() => {
    const sig = sky.stops.join();
    if (sig === last.current) return;
    last.current = sig;
    setLayers((l) => [l[l.length - 1], { key: l[l.length - 1].key + 1, sky }]);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }).start();
  }, [sky, fade]);
  return (
    <>
      {layers.map((l, i) => (
        <AnimatedLG key={l.key} colors={l.sky.stops} locations={[0, 0.38, 0.72, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
          style={[StyleSheet.absoluteFill, i === layers.length - 1 && layers.length > 1 ? { opacity: fade } : null]} />
      ))}
    </>
  );
}

export function DaySky({ hour, profile, still: stillProp }: { hour: number; profile: SkyProfile; still?: boolean }) {
  const reduce = useReduceMotion();
  const still = reduce || !!stillProp;
  const { width: W, height: H } = useWindowDimensions();
  // L'heure est arrondie au quart d'heure : le dégradé change doucement, sans recalcul permanent
  const sky = useMemo(() => daySkyAt(Math.round(hour * 4) / 4), [hour]);
  const tint = PROFILE_TINTS[profile];
  const breathe = useLoop(7000, still);
  const drift = useLoop(26000, still);
  const drift2 = useLoop(34000, still);
  const rise = useLoop(22000, still, false);
  const id = React.useId().replace(/:/g, '');
  const sunR = Math.max(W, H) * 0.62;
  const motes = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ x: ((i * 61) % 100) / 100, y: ((i * 37) % 100) / 100, s: 2 + (i % 3), o: 0.45 + (i % 4) * 0.12 })), []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SkyLayer sky={sky} />
      {/* Halo de soleil diffus */}
      <Animated.View style={{ position: 'absolute', left: sky.sun.x * W - sunR, top: sky.sun.y * H - sunR, width: sunR * 2, height: sunR * 2,
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [sky.sun.opacity * 0.82, sky.sun.opacity] }),
        transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }] }}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={`sun${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={sky.sun.color} stopOpacity="0.9" />
              <Stop offset="0.35" stopColor={sky.sun.color} stopOpacity="0.38" />
              <Stop offset="1" stopColor={sky.sun.color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill={`url(#sun${id})`} />
        </Svg>
      </Animated.View>
      {/* Teinte du profil + formes floues qui dérivent */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }, { translateY: drift2.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] }) }] }]}>
        <Svg width={W} height={H}>
          <Defs>
            {tint.map((c, i) => (
              <RadialGradient key={i} id={`t${i}${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={c} stopOpacity={TINT_OPACITY} />
                <Stop offset="1" stopColor={c} stopOpacity="0" />
              </RadialGradient>
            ))}
          </Defs>
          <Ellipse cx={W * 0.05} cy={H * 0.62} rx={W * 0.7} ry={H * 0.28} fill={`url(#t0${id})`} />
          <Ellipse cx={W * 0.95} cy={H * 0.35} rx={W * 0.65} ry={H * 0.25} fill={`url(#t1${id})`} />
          <Ellipse cx={W * 0.5} cy={H * 0.95} rx={W * 0.8} ry={H * 0.22} fill={`url(#t2${id})`} />
        </Svg>
      </Animated.View>
      {/* Nuages abstraits */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: drift2.interpolate({ inputRange: [0, 1], outputRange: [-26, 26] }) }] }]}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id={`cl${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.62" />
              <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.18" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={W * 0.28} cy={H * 0.14} rx={W * 0.42} ry={H * 0.05} fill={`url(#cl${id})`} />
          <Ellipse cx={W * 0.78} cy={H * 0.24} rx={W * 0.36} ry={H * 0.04} fill={`url(#cl${id})`} />
          <Ellipse cx={W * 0.2} cy={H * 0.48} rx={W * 0.3} ry={H * 0.035} fill={`url(#cl${id})`} />
          <Ellipse cx={W * 0.86} cy={H * 0.7} rx={W * 0.34} ry={H * 0.04} fill={`url(#cl${id})`} />
        </Svg>
      </Animated.View>
      {/* Reflet nacré et vagues de couleur */}
      <LinearGradient colors={['rgba(255,255,255,0)', `${sky.nacre}8C`, 'rgba(255,255,255,0)']} locations={[0.2, 0.5, 0.8]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.75 }} style={StyleSheet.absoluteFill} />
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Path d={`M0 ${H * 0.8} C ${W * 0.3} ${H * 0.74}, ${W * 0.6} ${H * 0.88}, ${W} ${H * 0.78} L ${W} ${H} L 0 ${H} Z`} fill="#FFFFFF" opacity={0.16} />
        <Path d={`M0 ${H * 0.88} C ${W * 0.35} ${H * 0.82}, ${W * 0.7} ${H * 0.96}, ${W} ${H * 0.86} L ${W} ${H} L 0 ${H} Z`} fill={tint[1]} opacity={0.1} />
      </Svg>
      {/* Particules lumineuses */}
      {motes.map((m, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: m.x * W, top: m.y * H, width: m.s, height: m.s, borderRadius: m.s,
          backgroundColor: '#FFFFFF', opacity: still ? m.o : rise.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, m.o, m.o, 0] }), shadowColor: '#FFF6E0', shadowOpacity: 1, shadowRadius: 4,
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, -40 - (i % 5) * 12] }) }],
        }} />
      ))}
    </View>
  );
}
