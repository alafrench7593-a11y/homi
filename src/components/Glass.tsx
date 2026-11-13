/**
 * Verre HOMI — couche de compatibilité v3 (voir HOMI_DESIGN_SYSTEM.md et `src/components/surfaces/`).
 *
 * `GlassSurface` : API historique des cartes (~30 écrans). En v3, une carte de contenu est une SURFACE MATE : si le
 *                  remplissage est opaque (cas de `theme.colors.surface`), aucun flou n'est rendu (lecture rapide,
 *                  coût nul). Un remplissage translucide garde le flou et devient du verre givré / fumé.
 * `LiquidGlass`  : panneaux et commandes flottantes → `Surface` (`optical` pour la barre d'onglets et les
 *                  commandes flottantes, `frosted` pour les panneaux du bas).
 * La détection du Liquid Glass natif (iOS 26+) est dans `surfaces/nativeGlass.ts` (inchangée, protégée).
 */
import React from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { glassOf, physicalShadow, radius as R, surfaceShadow, type ElevationLevel, type ShadowLayer } from '@/theme/tokens';
import { parseColor } from '@/theme/contrast';
import { Surface, transparentOf } from './surfaces/Surface';
import { BLUR_OK, LIQUID_GLASS_NATIVE, useReduceTransparency } from './surfaces/nativeGlass';

export { LIQUID_GLASS_NATIVE, useReduceTransparency };
export type GlassDepth = 1 | 2 | 3;

const SHADOW_FOR_DEPTH: Record<GlassDepth, ElevationLevel> = { 1: 'low', 2: 'mid', 3: 'high' };
/** Remplissages violets codés en dur avant la v3 (« rgba(40,32,70,…) ») : remplacés par le verre fumé du thème. */
const LEGACY_VIOLET = /^rgba\(40,\s*32,\s*70/;

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
  const color = LEGACY_VIOLET.test(fill) ? t.material.surfaces.frosted.fill : fill;
  let translucent = false;
  try { translucent = parseColor(color).a < 1; } catch { translucent = false; }
  const level = translucent ? t.material.surfaces.frosted : t.material.surfaces.matte;
  const intensity = night || !translucent ? 0 : depth === 1 ? Math.round(level.blur * 0.6) : level.blur;
  const edge = level.highlight;
  return (
    <View
      style={[
        { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: borderColor ?? (translucent ? level.edge : g.raised.edge), overflow: 'hidden', padding: padded, backgroundColor: color },
        shadow && !night ? { boxShadow: physicalShadow(SHADOW_FOR_DEPTH[depth], t.isDark) } : null,
        style,
      ]}
    >
      {BLUR_OK && intensity > 0 ? <BlurView intensity={intensity} tint={t.isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none" /> : null}
      {BLUR_OK && intensity > 0 ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color }]} /> : null}
      {highlight && !night && translucent ? (
        <>
          <LinearGradient pointerEvents="none" colors={level.inner} start={t.material.light.start} end={t.material.light.end} style={StyleSheet.absoluteFill} />
          <LinearGradient pointerEvents="none" colors={[transparentOf(edge), edge, transparentOf(edge)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: radius * 0.35, right: radius * 0.35, height: 1 }} />
        </>
      ) : null}
      {sheen ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', width: '70%', height: '140%', top: '-20%', left: '15%', opacity: 0.5,
            transform: [
              { translateX: sheen.y.interpolate({ inputRange: [-1, 1], outputRange: [-60, 60] }) },
              { translateY: sheen.x.interpolate({ inputRange: [-1, 1], outputRange: [-30, 30] }) },
              { rotate: '20deg' },
            ],
          }}
        >
          <LinearGradient colors={['rgba(255,255,255,0)', t.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

/** Ombre d'un panneau de verre flottant : physique + colorée (verre optique). */
export function liquidShadow(t: ReturnType<typeof useTheme>, level: ElevationLevel = 'high'): ShadowLayer[] | undefined {
  if (t.name === 'night') return undefined;
  const base = surfaceShadow(t, 'optical') ?? [];
  return level === 'high' ? base : [...physicalShadow(level, t.isDark), ...base.slice(2)];
}

/**
 * Panneau de verre flottant (barre d'onglets, feuilles du bas, sélecteurs). `kind` : `optical` (commande flottante,
 * défaut de `level="floating"`) ou `frosted` (panneau). Le contenu est posé au-dessus de toutes les couches.
 */
export function LiquidGlass({
  children, radius = R.xl, style, contentStyle, level = 'floating', kind, tinted = true, shadow = true, testID, edges = 'all',
}: {
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  level?: 'raised' | 'floating';
  kind?: 'optical' | 'frosted';
  /** Conservé pour compatibilité : la lumière interne de la palette est toujours présente sur le verre */
  tinted?: boolean;
  shadow?: boolean;
  testID?: string;
  /** `top` : panneau du bas (coins inférieurs droits, pas de liseré en bas) */
  edges?: 'all' | 'top';
}) {
  void tinted;
  return (
    <Surface kind={kind ?? (level === 'floating' ? 'optical' : 'frosted')} radius={radius} style={style} contentStyle={contentStyle ?? {}} shadow={shadow} testID={testID} edges={edges}>
      {children}
    </Surface>
  );
}
