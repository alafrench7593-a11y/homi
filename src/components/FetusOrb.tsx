/**
 * Représentation ARTISTIQUE et ÉDUCATIVE du bébé à naître.
 * - Ce n'est ni une échographie, ni une image de VOTRE bébé.
 * - La lueur du cœur est purement décorative : elle ne mesure rien.
 * Effet 3D : plusieurs calques en parallaxe qui tournent avec le doigt.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { useReduceMotion } from '@/theme/ThemeProvider';

interface Props {
  /** 0..1 — progression de la grossesse (fait évoluer la silhouette) */
  growth: number;
  size?: number;
  hue?: 'rose' | 'lavande' | 'or';
  interactive?: boolean;
  accessibilityLabel?: string;
}

const HUES = {
  rose: { core: '#F6D3C8', mid: '#E3A895', deep: '#B9654C', glow: '#F7C9B8' },
  lavande: { core: '#E4DDF7', mid: '#B9AEDB', deep: '#6E5FA8', glow: '#CFC4F0' },
  or: { core: '#F6E7C6', mid: '#E2C48B', deep: '#A9823E', glow: '#F1DDB0' },
};

export function FetusOrb({ growth, size = 280, hue = 'rose', interactive = true, accessibilityLabel }: Props) {
  const reduce = useReduceMotion();
  const rotation = useRef(new Animated.Value(0)).current; // -1..1
  const heart = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const c = HUES[hue];
  // Identifiants de dégradés uniques : plusieurs illustrations peuvent cohabiter sur un même écran
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = Math.max(0, Math.min(1, growth));

  useEffect(() => {
    if (reduce) return;
    const h = Animated.loop(Animated.sequence([
      Animated.timing(heart, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(heart, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const f = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const sway = Animated.loop(Animated.sequence([
      Animated.timing(rotation, { toValue: 0.35, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(rotation, { toValue: -0.35, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    h.start();
    f.start();
    sway.start();
    return () => { h.stop(); f.stop(); sway.stop(); };
  }, [reduce, heart, float, rotation]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, gs) => interactive && Math.abs(gs.dx) > 4,
    onPanResponderGrant: () => rotation.stopAnimation(),
    onPanResponderMove: (_e, gs) => rotation.setValue(Math.max(-1, Math.min(1, gs.dx / (size * 0.8)))),
    onPanResponderRelease: () => Animated.spring(rotation, { toValue: 0, useNativeDriver: true, friction: 5, tension: 30 }).start(),
  }), [interactive, rotation, size]);

  const rotateY = rotation.interpolate({ inputRange: [-1, 1], outputRange: ['-38deg', '38deg'] });
  const parallax = (depth: number) => rotation.interpolate({ inputRange: [-1, 1], outputRange: [-depth, depth] });
  const bob = float.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] });

  // Silhouette : un « germe » lumineux au début, puis un bébé recroquevillé qui s'affirme
  const early = g < 0.12;
  const s = 0.55 + g * 0.45; // échelle de la silhouette
  const layer = { position: 'absolute' as const, width: size, height: size };

  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Illustration artistique du bébé, qui évolue avec les semaines. Ce n’est pas une échographie.'}
      accessibilityHint={interactive ? 'Glissez horizontalement pour faire tourner l’illustration.' : undefined}
      style={{ width: size, height: size }}
    >
      {/* Halo et sphère (arrière-plan) */}
      <Animated.View style={[layer, { transform: [{ translateY: bob }, { translateX: parallax(-6) }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id={`halo${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={c.glow} stopOpacity={0.55} />
              <Stop offset="70%" stopColor={c.glow} stopOpacity={0.08} />
              <Stop offset="100%" stopColor={c.glow} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`sphere${uid}`} cx="42%" cy="38%" r="62%">
              <Stop offset="0%" stopColor="#FFF6EE" stopOpacity={0.35} />
              <Stop offset="55%" stopColor={c.mid} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={c.deep} stopOpacity={0.35} />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="99" fill={`url(#halo${uid})`} />
          <Circle cx="100" cy="100" r="74" fill={`url(#sphere${uid})`} stroke={c.core} strokeOpacity={0.35} strokeWidth={0.8} />
        </Svg>
      </Animated.View>

      {/* Silhouette (plan médian, tourne en 3D) */}
      <Animated.View style={[layer, { transform: [{ perspective: 700 }, { translateY: bob }, { rotateY }, { translateX: parallax(4) }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id={`skin${uid}`} cx="40%" cy="35%" r="70%">
              <Stop offset="0%" stopColor={c.core} />
              <Stop offset="60%" stopColor={c.mid} />
              <Stop offset="100%" stopColor={c.deep} />
            </RadialGradient>
          </Defs>
          {early ? (
            <G>
              <Path d="M100 78 C 118 78, 124 98, 114 112 C 106 124, 92 122, 90 110 C 88 100, 96 96, 100 100" fill={`url(#skin${uid})`} opacity={0.95} />
              <Circle cx="104" cy="92" r="9" fill={`url(#skin${uid})`} />
            </G>
          ) : (
            <G transform={`translate(100 102) scale(${s}) translate(-100 -102)`}>
              {/* dos et corps recroquevillé */}
              <Path d="M78 70 C 58 86, 56 124, 80 144 C 100 160, 132 152, 140 128 C 146 110, 136 94, 120 92 C 108 90, 100 98, 98 110" fill={`url(#skin${uid})`} />
              {/* tête */}
              <Circle cx="98" cy="66" r={26 - g * 3} fill={`url(#skin${uid})`} />
              {/* bras replié */}
              <Path d="M104 104 C 112 98, 122 100, 122 110 C 122 116, 114 118, 110 114" fill={c.mid} opacity={0.9} />
              {/* jambes */}
              <Path d="M90 140 C 100 132, 124 130, 128 140 C 130 148, 118 152, 106 150" fill={c.mid} opacity={0.85} />
              <Ellipse cx="92" cy="64" rx="5" ry="3.2" fill={c.deep} opacity={0.18} />
              {/* cordon stylisé */}
              <Path d="M112 124 C 128 132, 140 150, 150 170" stroke={c.core} strokeOpacity={0.45} strokeWidth={2.2} fill="none" strokeLinecap="round" />
            </G>
          )}
        </Svg>
      </Animated.View>

      {/* Lueur du cœur — décorative */}
      <Animated.View
        pointerEvents="none"
        style={[layer, {
          opacity: reduce ? 0.6 : heart.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] }),
          transform: [{ translateY: bob }, { translateX: parallax(4) }, { scale: reduce ? 1 : heart.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
        }]}
      >
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id={`heart${uid}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFE9C9" stopOpacity={1} />
              <Stop offset="40%" stopColor="#F2B999" stopOpacity={0.55} />
              <Stop offset="100%" stopColor="#F2B999" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={early ? 103 : 100 + 6 * s} cy={early ? 102 : 102 + 4 * s} r={early ? 7 : 11 * s} fill={`url(#heart${uid})`} />
        </Svg>
      </Animated.View>

      {/* Reflet de la sphère (premier plan, parallaxe inverse) */}
      <Animated.View pointerEvents="none" style={[layer, { transform: [{ translateY: bob }, { translateX: parallax(-12) }] }]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Path d="M58 70 C 66 52, 86 40, 106 38" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Circle cx="64" cy="82" r="2.2" fill="#FFFFFF" opacity={0.4} />
        </Svg>
      </Animated.View>
    </View>
  );
}
