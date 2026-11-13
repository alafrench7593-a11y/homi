/**
 * Les trois matières HOMI v3 (voir HOMI_DESIGN_SYSTEM.md § 3) — une seule primitive, trois rôles :
 *
 *  - `optical`  VERRE OPTIQUE : scène principale, commande flottante (barre d'onglets, bouton capsule, carte de
 *               tête). Couches, de bas en haut : flou (ou GlassView natif iOS 26+) → remplissage → dégradé interne
 *               teinté (la lumière traverse l'épaisseur, d'en haut à gauche) → reflet spéculaire dans le coin
 *               éclairé → arêtes : haute claire (concentrée côté lumière), gauche qui s'éteint vers le bas,
 *               contre-reflet coloré en bas (épaisseur) → ombre portée physique + ombre COLORÉE de l'accent.
 *  - `frosted`  VERRE FUMÉ (sombre) / GIVRÉ (clair) : navigation, panneaux, filtres, commandes. Flou + remplissage,
 *               reflet discret, arête haute fine, ombre physique.
 *  - `matte`    SURFACE MATE : longues listes, formulaires denses, textes, données à lecture rapide. Opaque, aucun
 *               flou, liseré à peine visible, ombre basse. Jamais de verre ici (lisibilité, coût de rendu).
 *
 * Le remplissage seul garantit le contraste (testé sur chaque couleur de la scène) : le flou est un bonus.
 * Android : pas de flou (remplissage seul). « Réduire la transparence » (iOS) et mode nuit : surfaces opaques,
 * ni reflet ni ombre colorée.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius as R, surfaceShadow, type SurfaceKind, type Theme } from '@/theme/tokens';
import { BLUR_OK, NativeGlass, useReduceTransparency } from './nativeGlass';

/** Même couleur, opacité nulle (extrémités des arêtes lumineuses). */
export const transparentOf = (rgba: string) => (rgba.startsWith('#') ? alpha(rgba, 0) : rgba.replace(/,\s*[\d.]+\)$/, ',0)'));

export interface SurfaceProps {
  kind?: SurfaceKind;
  children?: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Marge intérieure (px) */
  padded?: number;
  /** Teinte de la lumière interne (verre optique) : accent de la palette par défaut, ou teinte sémantique */
  tint?: string;
  /** Ombre portée (physique + colorée pour l'optique) */
  shadow?: boolean;
  /** `top` : panneau du bas (coins supérieurs seulement, pas de liseré en bas) */
  edges?: 'all' | 'top';
  /** Force de l'ombre colorée (0..1.5) */
  glow?: number;
  testID?: string;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

/** Couches de reflet d'une matière (exportées pour les boutons capsule et les pastilles). */
export function SurfaceLight({ t, kind, radius, tint, edges = 'all' }: { t: Theme; kind: SurfaceKind; radius: number; tint?: string; edges?: 'all' | 'top' }) {
  const s = t.material.surfaces[kind];
  const L = t.material.light;
  if (t.name === 'night' || kind === 'matte') return null;
  const inner: [string, string] = tint ? [alpha(tint, t.isDark ? 0.08 : 0.16), alpha(tint, 0)] : s.inner; // mêmes bornes que le jeton (contraste testé)
  const hi = s.highlight;
  return (
    <>
      {/* lumière interne : traverse l'épaisseur depuis le coin éclairé */}
      <LinearGradient pointerEvents="none" colors={inner} start={L.start} end={L.end} style={StyleSheet.absoluteFill} />
      {kind === 'optical' ? (
        <>
          {/* reflet spéculaire concentré dans le coin éclairé */}
          <LinearGradient pointerEvents="none" colors={[L.sheen, transparentOf(L.sheen)]} locations={[0, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.45, y: 0.55 }} style={StyleSheet.absoluteFill} />
          {/* arête gauche : s'éteint vers le bas */}
          <LinearGradient pointerEvents="none" colors={[hi, transparentOf(hi)]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', left: 0, top: radius * 0.6, bottom: radius * 0.6, width: 1 }} />
          {/* contre-reflet coloré en bas : l'épaisseur du verre */}
          {edges === 'all' ? <LinearGradient pointerEvents="none" colors={[transparentOf(alpha(tint ?? t.tokens.accent.glow[0], 1)), alpha(tint ?? t.tokens.accent.glow[0], t.isDark ? 0.45 : 0.55), transparentOf(alpha(tint ?? t.tokens.accent.glow[0], 1))]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', bottom: 0, left: radius * 0.6, right: radius * 0.6, height: 1 }} /> : null}
        </>
      ) : null}
      {/* arête haute : la plus claire du côté de la lumière (gauche) */}
      <LinearGradient pointerEvents="none" colors={[transparentOf(hi), hi, kind === 'optical' ? alpha('#FFFFFF', t.isDark ? 0.18 : 0.6) : transparentOf(hi), transparentOf(hi)]} locations={[0, 0.3, 0.7, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: 'absolute', top: 0, left: radius * 0.4, right: radius * 0.4, height: 1 }} />
    </>
  );
}

export function Surface({ kind = 'matte', children, radius = R.lg, style, contentStyle, padded, tint, shadow = true, edges = 'all', glow = 1, testID, pointerEvents }: SurfaceProps) {
  const t = useTheme();
  const reduceTransparency = useReduceTransparency();
  const s = t.material.surfaces[kind];
  const glass = kind !== 'matte';
  const opaque = t.name === 'night' || reduceTransparency;
  const fill = glass && opaque ? t.tokens.surface.opaque : s.fill;
  const native = glass && !opaque && NativeGlass ? NativeGlass : null;
  const corner = edges === 'top' ? { borderTopLeftRadius: radius, borderTopRightRadius: radius } : { borderRadius: radius };
  return (
    <View
      testID={testID}
      pointerEvents={pointerEvents}
      style={[corner, { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: s.edge, overflow: 'hidden', backgroundColor: native ? 'transparent' : fill },
        edges === 'top' && { borderBottomWidth: 0 },
        shadow ? { boxShadow: surfaceShadow(t, kind, glow) } : null,
        padded ? { padding: padded } : null, style]}
    >
      {native ? (
        <>
          {React.createElement(native, { pointerEvents: 'none', glassEffectStyle: kind === 'optical' ? 'clear' : 'regular', colorScheme: t.isDark ? 'dark' : 'light', tintColor: alpha(tint ?? t.tokens.accent.glow[0], t.isDark ? 0.1 : 0.12), style: StyleSheet.absoluteFill })}
          {/* voile de lisibilité : le texte garde le contraste mesuré même sur un fond très chargé */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill, opacity: 0.6 }]} />
        </>
      ) : glass && !opaque && BLUR_OK && s.blur > 0 ? (
        <>
          {/* le flou porte lui-même les coins (web : backdrop-filter ignore l'arrondi du parent) */}
          <BlurView pointerEvents="none" intensity={s.blur} tint={t.isDark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, corner, { overflow: 'hidden' }]} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        </>
      ) : null}
      {!opaque ? <SurfaceLight t={t} kind={kind} radius={radius} tint={tint} edges={edges} /> : null}
      {contentStyle ? <View style={contentStyle}>{children}</View> : children}
    </View>
  );
}

/** Verre optique (scène principale, commande flottante). */
export const OpticalGlass = (p: Omit<SurfaceProps, 'kind'>) => <Surface kind="optical" {...p} />;
/** Verre fumé / givré (navigation, panneaux, filtres, commandes). */
export const FrostedGlass = (p: Omit<SurfaceProps, 'kind'>) => <Surface kind="frosted" {...p} />;
/** Surface mate (listes, formulaires, données) : opaque, sans flou. */
export const MatteSurface = (p: Omit<SurfaceProps, 'kind'>) => <Surface kind="matte" {...p} />;
