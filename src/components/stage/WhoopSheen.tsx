/**
 * Finition « Whoop » des surfaces NOIRES (boutons principaux, cartes nuit, panneau Aura, grands boutons d'action) :
 * noir profond travaillé en profondeur — lumière douce en haut, fond plus dense en bas —, arête lumineuse d'un point,
 * ligne claire interne en haut, et un filet d'accent qui s'allume au bas du cadre (la signature des cadrans de
 * performance). Calque décoratif posé au-dessus du fond et SOUS le contenu : sans toucher, caché aux lecteurs d'écran,
 * le contraste du libellé ne change pas (le voile reste plus sombre que le fond sous le texte).
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { parseColor } from '@/theme/contrast';

/** Remplissage sombre (luminance relative < 0,18) : c'est lui qui reçoit la finition Whoop. */
export function isDarkFill(c: string | null | undefined): boolean {
  if (!c) return false;
  try {
    const { rgb: [r, g, b], a } = parseColor(c);
    if (a < 0.5) return false;
    const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.18;
  } catch { return false; }
}

export function WhoopSheen({ radius, accent, line = true }: { radius: number; accent?: string; line?: boolean }) {
  const t = useTheme();
  const light = t.tokens.inverse.text;
  const ink = t.tokens.shadowColor;
  const deep = t.tokens.inverse.fill;
  const glow = accent ?? t.tokens.inverse.accent;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
      {/* base noire profonde (noir de la scène inverse du thème), légèrement levée en haut par la lumière */}
      <LinearGradient colors={[alpha(deep, 0.55), alpha(deep, 0.86), alpha(deep, 0.97)]} locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[alpha(light, 0.14), alpha(light, 0), alpha(light, 0)]} locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      {line ? (
        <LinearGradient colors={[alpha(glow, 0), alpha(glow, 0.85), alpha(glow, 0)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', left: '18%', right: '18%', bottom: 0, height: 1.5 }} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: alpha(light, 0.12),
        boxShadow: `inset 0 1px 0 ${alpha(light, 0.2)}, inset 0 -8px 16px ${alpha(ink, 0.25)}` } as ViewStyle]} />
    </View>
  );
}
