/**
 * Reflet bref qui GLISSE sur un bouton capsule à la pression (boutons principaux, bouton d'action de la barre).
 * Une bande de lumière inclinée traverse le bouton de gauche à droite en ~320 ms (v3 : famille « panneau », brève) (`decelerate`), une seule fois par
 * appui : transform + opacité seulement, aucune boucle. 'off' (Réduire les animations, économie d'énergie) et
 * 'minimal' (nuit) : aucun reflet.
 *
 * Usage : `const sheen = usePressSheen();` puis `onPressIn={sheen.play}` et `<PressSheen sheen={sheen} />` posé en
 * dernier enfant d'un conteneur `overflow: 'hidden'` aux coins arrondis.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useMotion } from './useMotion';

export const SHEEN_MS = 320;

export function usePressSheen() {
  const m = useMotion();
  const p = useSharedValue(0);
  useEffect(() => () => cancelAnimation(p), [p]);
  const play = useCallback(() => {
    if (m.level !== 'full') return;
    cancelAnimation(p);
    p.value = 0;
    p.value = m.timing(1, SHEEN_MS, 'decelerate');
  }, [m, p]);
  return { progress: p, play, enabled: m.level === 'full' };
}

export function PressSheen({ sheen, intensity = 0.38 }: { sheen: ReturnType<typeof usePressSheen>; intensity?: number }) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const band = Math.max(36, w * 0.28);
  const style = useAnimatedStyle(() => {
    const k = sheen.progress.value;
    // visible seulement pendant la traversée (0 au repos comme à la fin)
    const o = k <= 0 || k >= 1 ? 0 : Math.sin(k * Math.PI);
    return { opacity: o, transform: [{ translateX: -band + (w + band * 2) * k }, { skewX: '-18deg' }] };
  });
  if (!sheen.enabled) return null;
  return (
    <View pointerEvents="none" testID="press-sheen" style={StyleSheet.absoluteFill} onLayout={onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {w > 0 ? (
        <Animated.View style={[{ position: 'absolute', top: -4, bottom: -4, left: 0, width: band }, style]}>
          <LinearGradient colors={['rgba(255,255,255,0)', `rgba(255,255,255,${intensity})`, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}
