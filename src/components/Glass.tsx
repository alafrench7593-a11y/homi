/**
 * Surface « verre lisible » du design system HOMI (voir DESIGN_SYSTEM.md) : flou d'arrière-plan, remplissage
 * translucide, reflet supérieur, liseré lumineux (edge highlight) et ombre physique nuit violette (contact + ambiance).
 * Toutes les valeurs viennent de `glass`, `physicalShadow` et du thème (src/theme/tokens.ts) ; le texte posé dessus
 * reste ≥ 4,5:1 (src/__tests__/designSystem.test.ts).
 *
 * Profondeur : 1 (cartes de liste, ombre basse), 2 (cartes principales, ombre moyenne), 3 (panneaux flottants,
 * feuilles, barre : ombre haute, flou plus fort). Mode nuit : ni flou, ni reflet, ni ombre (calme, batterie).
 */
import React from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { glass, physicalShadow, radius as R, type ElevationLevel } from '@/theme/tokens';

export type GlassDepth = 1 | 2 | 3;

/** Flou réel sur iOS et le web ; Android garde le remplissage translucide (flou natif trop coûteux en liste). */
const BLUR_OK = Platform.OS === 'ios' || Platform.OS === 'web';
const SHADOW_FOR_DEPTH: Record<GlassDepth, ElevationLevel> = { 1: 'low', 2: 'mid', 3: 'high' };
/** Même couleur, opacité nulle (extrémités du liseré lumineux). */
const transparentOf = (rgba: string) => rgba.replace(/,\s*[\d.]+\)$/, ',0)');

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
  const level = depth === 3 ? glass[t.name].floating : glass[t.name].raised;
  const intensity = night ? 0 : depth === 1 ? Math.round(level.blur * 0.6) : level.blur;
  const edge = level.highlight;
  return (
    <View
      style={[
        { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: borderColor ?? level.edge, overflow: 'hidden', padding: padded, backgroundColor: fill },
        // Ombre physique : contact net + ambiance diffuse, encre nuit violette (boxShadow : iOS, Android, web)
        shadow && !night ? { boxShadow: physicalShadow(SHADOW_FOR_DEPTH[depth], t.isDark) } : null,
        style,
      ]}
    >
      {BLUR_OK && intensity > 0 ? <BlurView intensity={intensity} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
      {/* Remplissage par-dessus le flou : garde exactement la teinte de la carte (donc le contraste mesuré) */}
      {BLUR_OK && intensity > 0 ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} /> : null}
      {highlight && !night ? (
        <>
          {/* Reflet supérieur : la lumière vient d'en haut à gauche */}
          <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.55 }} style={StyleSheet.absoluteFill} />
          {/* Liseré lumineux (edge highlight) : l'arête supérieure s'éclaire au centre et s'éteint vers les coins */}
          <LinearGradient pointerEvents="none" colors={[transparentOf(edge), edge, transparentOf(edge)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: radius * 0.35, right: radius * 0.35, height: 1 }} />
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
          <LinearGradient colors={['rgba(255,255,255,0)', t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}
