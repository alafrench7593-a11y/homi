/**
 * Carte mise en avant HOMI (v5 « Lumière corail ») — conservée sous son ancien nom pour LA sélection / l'action
 * importante / le moment de validation d'un écran (un seul élément à la fois).
 *
 * v5 : plus de filet en dégradé, de halo coloré ni de faisceau lumineux. Une carte choisie se reconnaît à :
 *  - un CONTOUR corail net (1,5 px ; succès : vert du statut) ;
 *  - une teinte de fond très douce (corail pâle ; succès : vert pâle) ;
 *  - l'état annoncé (rôle `radio` ou `button` + `selected`).
 * Mouvement (useMotion) : le contour et la teinte apparaissent en fondu (220 ms, courbe standard) ; pression : échelle
 * 0,985 en ressort. 'off' : état final immédiat ; liste (`still`) : aucun mouvement.
 */
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius as R, spacing, type Theme } from '@/theme/tokens';
import { motionHaptic, useMotion, usePressScale } from '@/motion';

export const GLOW = { borderMs: 220, beamMs: 0, stroke: 1.5 } as const;
export type GlowEmphasis = 'selected' | 'action' | 'success';

/** Couleurs du contour selon l'usage : corail (sélection, action) ou succès (validation). */
export function glowColors(t: Theme, emphasis: GlowEmphasis = 'selected'): [string, string] {
  if (emphasis === 'success') return [t.tokens.status.success, t.tokens.status.success];
  return [t.colors.primary, t.colors.primary];
}

export function GlowCard({
  children, active = false, emphasis = 'selected', onPress, style, contentStyle, radius = R.lg, padded = true, still,
  testID, accessibilityLabel, accessibilityHint, role = 'button',
}: {
  children: React.ReactNode;
  /** Carte sélectionnée / active : contour corail + teinte douce. Au repos : liseré discret. */
  active?: boolean;
  emphasis?: GlowEmphasis;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  padded?: boolean;
  /** Dans une liste : aucun mouvement (l'état s'affiche directement). */
  still?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** `radio` : élément d'un groupe à choix unique */
  role?: 'button' | 'radio';
}) {
  const t = useTheme();
  const m = useMotion();
  const on = useSharedValue(active ? 1 : 0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    on.value = still || m.off ? (active ? 1 : 0) : m.timing(active ? 1 : 0, GLOW.borderMs, 'standard');
  }, [active, still, m, on]);
  useEffect(() => () => cancelAnimation(on), [on]);
  const onStyle = useAnimatedStyle(() => ({ opacity: on.value }));
  const press = usePressScale({ scale: 0.985, haptic: 'none' });

  const [c] = glowColors(t, emphasis);
  const tint = emphasis === 'success' ? alpha(t.tokens.status.success, t.isDark ? 0.12 : 0.07) : t.material.cardTint.soft;
  const card = (
    <View style={{ flexGrow: 1, borderRadius: radius, overflow: 'hidden', backgroundColor: t.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.tokens.border.rest }}>
      {/* Teinte et contour de l'état actif (fondu) */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }, onStyle]} />
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: GLOW.stroke, borderColor: c }, onStyle]} />
      <View style={[padded ? { padding: spacing.md } : null, contentStyle]}>{children}</View>
    </View>
  );
  // `style` s'applique au conteneur extérieur (grille, marges) ; la carte le remplit
  if (!onPress) return <View testID={testID} style={style}>{card}</View>;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { checked: active, selected: active } : { selected: active }}
      aria-selected={role === 'radio' ? undefined : active}
      aria-checked={role === 'radio' ? active : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => { motionHaptic('selection'); onPress(); }}
      style={style}
    >
      <Animated.View style={[{ flexGrow: 1 }, press.style]}>{card}</Animated.View>
    </Pressable>
  );
}
