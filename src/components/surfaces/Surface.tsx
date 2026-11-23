/**
 * Surfaces HOMI v5 « Lumière corail » (voir HOMI_DESIGN_SYSTEM.md § 3). Les trois noms de la v4 sont conservés
 * (`optical`, `frosted`, `matte`) mais ce sont désormais des SURFACES OPAQUES, sans flou, sans reflet ni ombre
 * colorée : la profondeur vient des PLANS (fond ivoire rosé → surface blanche → surface élevée) et d'un liseré
 * rosé très léger.
 *  - `optical` / `frosted` : surface ÉLEVÉE (feuille du bas, menus, commandes flottantes), ombre de contact légère ;
 *  - `matte` : surface de contenu (cartes, listes, formulaires), aucune ombre.
 * Le remplissage garantit seul le contraste (testé). Nuit : surfaces tamisées, aucune ombre.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius as R, surfaceShadow, type SurfaceKind, type Theme } from '@/theme/tokens';

/** Même couleur, opacité nulle (ancien usage : extrémités des arêtes lumineuses). */
export const transparentOf = (rgba: string) => (rgba.startsWith('#') ? alpha(rgba, 0) : rgba.replace(/,\s*[\d.]+\)$/, ',0)'));

export interface SurfaceProps {
  kind?: SurfaceKind;
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Marge intérieure (px) */
  padded?: number;
  /** Conservé pour compatibilité (v5 : aucune lumière interne) */
  tint?: string;
  /** Ombre de contact (surfaces élevées uniquement) */
  shadow?: boolean;
  /** `top` : panneau du bas (coins supérieurs seulement, pas de liseré en bas) */
  edges?: 'all' | 'top';
  /** Conservé pour compatibilité */
  glow?: number;
  testID?: string;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

/** Ancien reflet des matières de verre : v5, aucun (conservé pour les imports). */
export function SurfaceLight(_p: { t: Theme; kind: SurfaceKind; radius: number; tint?: string; edges?: 'all' | 'top' }) {
  return null;
}

export function Surface({ kind = 'matte', children, radius = R.lg, style, contentStyle, padded, shadow = true, edges = 'all', testID, pointerEvents }: SurfaceProps) {
  const t = useTheme();
  const s = t.material.surfaces[kind];
  const corner = edges === 'top' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius } : { borderRadius: radius };
  return (
    <View
      testID={testID}
      pointerEvents={pointerEvents}
      style={[corner, { borderWidth: StyleSheet.hairlineWidth, borderColor: s.edge, overflow: 'hidden', backgroundColor: s.fill },
        edges === 'top' && { borderBottomWidth: 0 },
        shadow ? { boxShadow: surfaceShadow(t, kind) } : null,
        padded ? { padding: padded } : null, style]}
    >
      {contentStyle ? <View style={contentStyle}>{children}</View> : children}
    </View>
  );
}

/** Surface élevée (anciennement « verre optique »). */
export const OpticalGlass = (p: Omit<SurfaceProps, 'kind'>) => <Surface kind="optical" {...p} />;
/** Surface élevée (anciennement « verre givré / fumé »). */
export const FrostedGlass = (p: Omit<SurfaceProps, 'kind'>) => <Surface kind="frosted" {...p} />;
/** Surface de contenu (listes, formulaires, données) : opaque, sans ombre. */
export const MatteSurface = (p: Omit<SurfaceProps, 'kind'>) => <Surface kind="matte" {...p} />;
