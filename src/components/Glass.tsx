/**
 * Verre HOMI v2 (voir HOMI_DESIGN_SYSTEM.md).
 *
 * `GlassSurface` : verre « lisible » des cartes (flou + remplissage translucide + reflet + liseré + ombre physique).
 * `LiquidGlass`  : verre « Liquid Glass » des éléments flottants (barre d'onglets, feuilles du bas, commandes capsule,
 *                  sélecteur de palette) : profondeur translucide teintée d'un dégradé pastel de la palette, arête
 *                  claire en haut, ombre portée douce et colorée dessous.
 *
 * Rendu selon la plateforme (du plus riche au plus sûr) :
 *  1. iOS 26+ avec l'API Liquid Glass disponible (`expo-glass-effect` : `isLiquidGlassAvailable()` ET
 *     `isGlassEffectAPIAvailable()`) → `GlassView` natif teinté + voile de lisibilité ;
 *  2. iOS plus ancien et web → `BlurView` (expo-blur) + remplissage translucide ;
 *  3. Android, « Réduire la transparence » (iOS) et mode nuit → remplissage presque opaque, sans flou.
 * Dans tous les cas, le remplissage seul garantit le contraste du texte (≥ 4,5:1, testé) : le flou est un bonus.
 */
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, glassOf, physicalShadow, radius as R, type ElevationLevel, type ShadowLayer } from '@/theme/tokens';

export type GlassDepth = 1 | 2 | 3;

/** Flou réel sur iOS et le web ; Android garde le remplissage translucide (flou natif trop coûteux en liste). */
const BLUR_OK = Platform.OS === 'ios' || Platform.OS === 'web';
const SHADOW_FOR_DEPTH: Record<GlassDepth, ElevationLevel> = { 1: 'low', 2: 'mid', 3: 'high' };
/** Même couleur, opacité nulle (extrémités du liseré lumineux). */
const transparentOf = (rgba: string) => rgba.replace(/,\s*[\d.]+\)$/, ',0)');

// ---------------------------------------------------------------- Liquid Glass natif (iOS 26+)
type NativeGlassProps = { glassEffectStyle?: 'clear' | 'regular' | 'none'; tintColor?: string; colorScheme?: 'auto' | 'light' | 'dark'; isInteractive?: boolean; style?: StyleProp<ViewStyle>; pointerEvents?: 'none' | 'auto' };
/**
 * `expo-glass-effect` 57.0.4 (même version que le SDK 57) est installé comme dépendance d'expo-router ; on le charge
 * paresseusement et seulement sur iOS, après les deux vérifications recommandées par la bibliothèque (certaines bêtas
 * d'iOS 26 plantaient sans `isGlassEffectAPIAvailable`). Partout ailleurs : `null` → repli BlurView / remplissage.
 */
const NativeGlass: React.ComponentType<NativeGlassProps> | null = (() => {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('expo-glass-effect') as { GlassView: React.ComponentType<NativeGlassProps>; isLiquidGlassAvailable?: () => boolean; isGlassEffectAPIAvailable?: () => boolean };
    return m.isLiquidGlassAvailable?.() && m.isGlassEffectAPIAvailable?.() ? m.GlassView : null;
  } catch {
    return null;
  }
})();
export const LIQUID_GLASS_NATIVE = NativeGlass !== null;

/** « Réduire la transparence » (iOS) : le verre devient opaque. */
export function useReduceTransparency(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setOn).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}

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
  const g = glassOf(t);
  const level = depth === 3 ? g.floating : g.raised;
  const intensity = night ? 0 : depth === 1 ? Math.round(level.blur * 0.6) : level.blur;
  const edge = level.highlight;
  return (
    <View
      style={[
        { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: borderColor ?? level.edge, overflow: 'hidden', padding: padded, backgroundColor: fill },
        // Ombre physique : contact net + ambiance diffuse (boxShadow : iOS, Android, web)
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
          <LinearGradient pointerEvents="none" colors={t.isDark ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.55 }} style={StyleSheet.absoluteFill} />
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
          <LinearGradient colors={['rgba(255,255,255,0)', t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

/** Ombre portée douce et colorée sous un panneau de verre (image « Liquid Glass ») + ombre physique haute. */
export function liquidShadow(t: ReturnType<typeof useTheme>, level: ElevationLevel = 'high'): ShadowLayer[] | undefined {
  if (t.name === 'night') return undefined;
  return [
    ...physicalShadow(level, t.isDark),
    { offsetX: 0, offsetY: 14, blurRadius: 36, spreadDistance: -10, color: alpha(t.tokens.accent.glow[1], t.isDark ? 0.16 : 0.22) },
  ];
}

/**
 * Panneau « Liquid Glass » (voir l'en-tête). `tinted` : dégradé pastel de la palette dans le verre (panneaux, barre) ;
 * `level` : `floating` (par défaut, presque opaque) ou `raised`. Le contenu est posé au-dessus de toutes les couches.
 */
export function LiquidGlass({
  children, radius = R.xl, style, contentStyle, level = 'floating', tinted = true, shadow = true, testID, edges = 'all',
}: {
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  level?: 'raised' | 'floating';
  tinted?: boolean;
  shadow?: boolean;
  testID?: string;
  /** `top` : panneau du bas (coins inférieurs droits, pas de liseré en bas) */
  edges?: 'all' | 'top';
}) {
  const t = useTheme();
  const reduceTransparency = useReduceTransparency();
  const night = t.name === 'night';
  const g = glassOf(t)[level];
  const opaque = night || reduceTransparency;
  const [ga, gb] = t.tokens.accent.glow;
  const corner = edges === 'top' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius } : { borderRadius: radius };
  // Android (pas de flou) : remplissage un peu plus couvrant pour rester lisible sur un fond chargé
  const fill = opaque ? t.tokens.surface.opaque : g.fill;
  return (
    <View testID={testID} style={[corner, { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: g.edge, overflow: 'hidden', backgroundColor: NativeGlass && !opaque ? 'transparent' : fill },
      edges === 'top' && { borderBottomWidth: 0 },
      shadow ? { boxShadow: liquidShadow(t, level === 'floating' ? 'high' : 'mid') } : null, style]}>
      {!opaque && NativeGlass ? (
        <>
          <NativeGlass pointerEvents="none" glassEffectStyle="regular" colorScheme={t.isDark ? 'dark' : 'light'} tintColor={alpha(ga, t.isDark ? 0.1 : 0.12)} style={StyleSheet.absoluteFill} />
          {/* voile de lisibilité : le texte reste au contraste mesuré même sur un fond très chargé */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill, opacity: 0.55 }]} />
        </>
      ) : !opaque && BLUR_OK ? (
        <>
          <BlurView pointerEvents="none" intensity={g.blur} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        </>
      ) : null}
      {tinted && !opaque ? (
        // Dégradé pastel de la palette dans l'épaisseur du verre
        <LinearGradient pointerEvents="none" colors={[alpha(ga, t.isDark ? 0.09 : 0.12), alpha(gb, t.isDark ? 0.06 : 0.1), alpha(gb, 0)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {!night ? (
        <>
          {/* Arête claire en haut (reflet fin) et contre-reflet discret en bas */}
          <LinearGradient pointerEvents="none" colors={[transparentOf(g.highlight), g.highlight, transparentOf(g.highlight)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: radius * 0.4, right: radius * 0.4, height: 1 }} />
          <LinearGradient pointerEvents="none" colors={[t.isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.4)', t.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
        </>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
