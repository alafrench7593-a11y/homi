/**
 * Surface « Liquid Glass » : flou d'arrière-plan, remplissage translucide, reflet supérieur,
 * liseré lumineux, ombre diffuse. Construite UNIQUEMENT avec les couleurs existantes du thème
 * (fonds de cartes, bordures, blanc des reflets, ombre rose déjà utilisée).
 *
 * Profondeur : 1 (cartes de liste), 2 (cartes principales), 3 (panneaux flottants, feuilles, barre).
 */
import React from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { radius as R } from '@/theme/tokens';

export type GlassDepth = 1 | 2 | 3;

/** Flou réel sur iOS et le web ; Android garde le remplissage translucide (flou natif trop coûteux en liste). */
const BLUR_OK = Platform.OS === 'ios' || Platform.OS === 'web';

export function GlassSurface({
  children, fill, borderColor, depth = 2, radius = R.lg, style, padded = 0, highlight = true, shadow = true, sheen,
}: {
  children?: React.ReactNode;
  /** Couleur de remplissage existante (ex. theme.colors.surface). */
  fill: string;
  borderColor?: string;
  depth?: GlassDepth;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  padded?: number;
  highlight?: boolean;
  shadow?: boolean;
  /** Reflet lumineux qui suit le curseur (web) : valeurs -1..1 issues de useTilt. */
  sheen?: { x: Animated.Value; y: Animated.Value };
}) {
  const t = useTheme();
  const night = t.name === 'night';
  const intensity = night ? 0 : depth === 3 ? 38 : depth === 2 ? 26 : 16;
  return (
    <View
      style={[
        { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: borderColor ?? t.colors.border, overflow: 'hidden', padding: padded, backgroundColor: fill },
        shadow && !night && (t.isDark ? styles.shadowDark : depth === 3 ? styles.shadowFloat : depth === 2 ? styles.shadow : styles.shadowSoft),
        style,
      ]}
    >
      {BLUR_OK && intensity > 0 ? <BlurView intensity={intensity} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
      {/* Remplissage par-dessus le flou : garde exactement la teinte de la carte */}
      {BLUR_OK && intensity > 0 ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} /> : null}
      {highlight && !night ? (
        <>
          {/* Reflet supérieur : la lumière vient d'en haut à gauche */}
          <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.55 }} style={StyleSheet.absoluteFill} />
          {/* Liseré lumineux en haut */}
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: radius * 0.6, right: radius * 0.6, height: 1, backgroundColor: t.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)' }} />
        </>
      ) : null}
      {sheen ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', width: '70%', height: '140%', top: '-20%', left: '15%', opacity: 0.55,
            transform: [
              { translateX: sheen.y.interpolate({ inputRange: [-1, 1], outputRange: [-60, 60] }) },
              { translateY: sheen.x.interpolate({ inputRange: [-1, 1], outputRange: [-30, 30] }) },
              { rotate: '20deg' },
            ],
          }}
        >
          <LinearGradient colors={['rgba(255,255,255,0)', t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Ombre rose déjà utilisée par les cartes (#B4507A), plus ou moins diffuse selon la profondeur
  // Ombres chaudes (brun cuivré) et diffuses depuis la refonte du 26/10/2026
  shadowSoft: { shadowColor: '#6B3F2E', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  shadow: { shadowColor: '#6B3F2E', shadowOpacity: 0.09, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } },
  shadowFloat: { shadowColor: '#6B3F2E', shadowOpacity: 0.16, shadowRadius: 36, shadowOffset: { width: 0, height: 16 }, elevation: 6 },
  shadowDark: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
});
