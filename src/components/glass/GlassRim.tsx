/**
 * Liseré « Liquid Glass » (iOS 26) commun à TOUS les cadres de l'app (cartes, listes, panneaux, tuiles) : reflet
 * spéculaire en haut à gauche qui s'éteint vers le bas, bord lumineux d'un point, ligne claire interne en haut et ombre
 * interne fine en bas. Calque décoratif posé en dernier enfant d'un conteneur à coins arrondis `overflow: 'hidden'` ;
 * ne capte aucun toucher, invisible aux lecteurs d'écran. « Réduire la transparence » : bord seul, sans reflet.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { useReduceTransparency } from '../surfaces/nativeGlass';

export function GlassRim({ radius, strength = 1 }: { radius: number; strength?: number }) {
  const t = useTheme();
  const opaque = useReduceTransparency();
  const light = t.tokens.inverse.text; // reflets toujours clairs
  const k = Math.max(0, Math.min(1, strength));
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      {opaque ? null : (
        <LinearGradient colors={[alpha(light, (t.isDark ? 0.1 : 0.5) * k), alpha(light, 0)]} locations={[0, 0.38]}
          start={{ x: 0, y: 0 }} end={{ x: 0.55, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: alpha(light, (t.isDark ? 0.14 : 0.75) * k),
        boxShadow: `inset 0 1px 0 ${alpha(light, (t.isDark ? 0.22 : 0.9) * k)}, inset 0 -1px 0 ${alpha(t.tokens.shadowColor, (t.isDark ? 0.3 : 0.06) * k)}` } as ViewStyle]} />
    </View>
  );
}

/**
 * Bord « Liquid Glass » en style seul, pour les cadres dessinés à la main (une View avec fond + bord) : bord lumineux,
 * ligne claire interne en haut, ombre interne fine en bas, ombre portée douce. Remplace `borderWidth + borderColor`.
 */
export function glassEdge(t: ReturnType<typeof useTheme>): ViewStyle {
  const light = t.tokens.inverse.text;
  // Verre liquide partout (23/11/2026) : reflet clair en haut à gauche et léger ombrage en bas, PAR-DESSUS la couleur de
  // la carte (transparent au centre : une carte teintée ou pressée garde sa teinte)
  const glass = `linear-gradient(165deg, ${alpha(light, t.isDark ? 0.14 : 0.95)} 0%, ${alpha(light, 0)} 38%, ${alpha(t.tokens.shadowColor, 0)} 68%, ${alpha(t.tokens.shadowColor, t.isDark ? 0.28 : 0.09)} 100%)`;
  return {
    experimental_backgroundImage: glass,
    ...({ backgroundImage: glass } as object),
    borderWidth: 1,
    borderColor: t.isDark ? alpha(light, 0.14) : alpha(light, 0.8),
    boxShadow: `inset 0 1px 0 ${alpha(light, t.isDark ? 0.2 : 0.95)}, inset 0 -1px 0 ${alpha(t.tokens.shadowColor, t.isDark ? 0.3 : 0.07)}, 0 1px 2px ${alpha(t.tokens.shadowColor, t.isDark ? 0.4 : 0.06)}, 0 6px 18px ${alpha(t.tokens.shadowColor, t.isDark ? 0.3 : 0.07)}`,
  };
}
