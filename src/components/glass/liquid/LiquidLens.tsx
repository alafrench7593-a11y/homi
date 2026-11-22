/**
 * Verre liquide — rendu NATIF.
 *
 *  - iOS 26+ (Expo SDK 57, React Native 0.86, `expo-glass-effect` 57) : matériau Liquid Glass d'Apple (`GlassView`) —
 *    c'est lui qui réfracte réellement le contenu derrière la barre ; style « clear » quand le dépoli est faible,
 *    « regular » au-delà ; voile du thème en `tintColor` ; réaction au toucher native (`isInteractive`).
 *    Les réglages de lèvre, réfraction et frange du laboratoire sont propres au rendu web : iOS garde l'optique Apple.
 *  - iOS plus ancien : flou système (`BlurView`) + voile + reflet orienté par l'angle de lumière.
 *  - Android : voile opaque lisible (pas de flou natif sans cible).
 *  - « Réduire la transparence » : surface pleine du thème.
 * Calques décoratifs : `pointerEvents: none`, cachés aux lecteurs d'écran.
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { NativeGlass, useReduceTransparency } from '../../surfaces/nativeGlass';
import { lensFrame, type LiquidLensProps } from './frame';

export function supportsSvgBackdrop(): boolean { return false; }

export function LiquidLensMaterial({ radius, params, testID = 'liquid-lens' }: LiquidLensProps) {
  const t = useTheme();
  const opaque = useReduceTransparency();
  const frame = lensFrame(t, params, radius, opaque);
  const light = t.tokens.inverse.text;
  const a = (params.lightAngle * Math.PI) / 180;
  const start = { x: 0.5 - Math.cos(a) * 0.5, y: 0.5 + Math.sin(a) * 0.5 };
  const native = !opaque && NativeGlass;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID={testID} style={[StyleSheet.absoluteFill, frame.outer]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        {native && NativeGlass ? (
          <NativeGlass style={StyleSheet.absoluteFill} glassEffectStyle={params.frost > 4 ? 'regular' : 'clear'} isInteractive
            tintColor={alpha(t.colors.surface, params.tint)} colorScheme={t.isDark ? 'dark' : 'light'} testID={`${testID}-native`} />
        ) : opaque || Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: opaque ? t.colors.surface : alpha(t.colors.surface, Math.max(0.86, params.tint)) }]} />
        ) : (
          <>
            <BlurView intensity={Math.round(30 + params.frost * 6)} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, frame.fill]} />
          </>
        )}
        {!native && !opaque && params.highlight > 0 ? (
          <LinearGradient colors={[alpha(light, (t.isDark ? 0.18 : 0.55) * params.highlight), alpha(light, 0)]} locations={[0, 0.45]}
            start={start} end={{ x: 1 - start.x, y: 1 - start.y }} style={StyleSheet.absoluteFill} />
        ) : null}
      </View>
      {native ? null : <View style={[StyleSheet.absoluteFill, { borderRadius: radius }, frame.lip]} />}
    </View>
  );
}
