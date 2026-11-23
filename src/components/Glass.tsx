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
import { useTheme } from '@/theme/ThemeProvider';
import { glassOf, physicalShadow, radius as R, surfaceShadow, type ElevationLevel, type ShadowLayer } from '@/theme/tokens';
import { parseColor } from '@/theme/contrast';
import { PEARL, usesPearl } from '@/theme/glass';
import { Surface } from './surfaces/Surface';
import { CardLens } from './glass/liquid/CardLens';
import { LIQUID_GLASS_NATIVE, useReduceTransparency } from './surfaces/nativeGlass';

export { LIQUID_GLASS_NATIVE, useReduceTransparency };
export type GlassDepth = 1 | 2 | 3;

const SHADOW_FOR_DEPTH: Record<GlassDepth, ElevationLevel> = { 1: 'low', 2: 'low', 3: 'mid' };
/** Remplissages violets codés en dur avant la v3 (« rgba(40,32,70,…) ») : remplacés par le verre fumé du thème. */
const LEGACY_VIOLET = /^rgba\(40,\s*32,\s*70/;

export function GlassSurface({
  children, fill, borderColor, depth = 2, radius = R.lg, style, padded = 0, shadow = true,
}: {
  children?: React.ReactNode;
  /** Couleur de remplissage existante (ex. theme.colors.surface). */
  fill: string;
  borderColor?: string;
  depth?: GlassDepth;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  padded?: number;
  /** Conservé pour compatibilité (v5 : aucun reflet) */
  highlight?: boolean;
  shadow?: boolean;
  /** Conservé pour compatibilité (v5 : aucun reflet au curseur) */
  sheen?: { x: Animated.Value; y: Animated.Value };
}) {
  const t = useTheme();
  const night = t.name === 'night';
  const g = glassOf(t);
  // v5 : surface OPAQUE, sans flou ni reflet ; un ancien remplissage violet ou translucide devient la surface du thème
  let translucent = false;
  try { translucent = parseColor(fill).a < 1; } catch { translucent = false; }
  const base = LEGACY_VIOLET.test(fill) || translucent ? t.colors.surface : fill;
  // Blanc nacré en clair : verre translucide (74 % de blanc, texte secondaire ≥ 4,5:1 même sur une sphère chromée)
  const pearl = useReduceTransparency() === false && usesPearl(t) && base === t.colors.surface;
  const color = pearl ? PEARL.cardFill : base;
  return (
    <View
      style={[
        { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth, borderColor: borderColor ?? g.raised.edge, overflow: 'hidden', padding: padded, backgroundColor: color },
        shadow && !night && depth > 1 ? { boxShadow: physicalShadow(SHADOW_FOR_DEPTH[depth], t.isDark) } : null,
        style,
      ]}
    >
      {/* Verre liquide partout (22/11/2026) : lèvre, reflet orienté et ombre du laboratoire, sous le contenu */}
      <CardLens radius={radius} />
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
