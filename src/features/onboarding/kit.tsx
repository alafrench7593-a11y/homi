/**
 * Onboarding v2 — pièces partagées (Reanimated, fil UI, `useMotion` : Réduire les animations → états finaux).
 *  - `StepFade` : l'étape entre en fondu + 16 px dans le sens du parcours (280 ms, décélération) ;
 *  - `OnbProgress` : 8 temps, le segment atteint se remplit en ressort « panneau » (transform uniquement) ;
 *  - `StepTitle` : sur-titre facultatif, titre (rôle « en-tête »), une phrase ;
 *  - `SelectableTile` : choix visuel (case à cocher accessible) — lentille de verre sous l'option active, ressort.
 * Uniquement les jetons du thème ; aucune couleur en dur.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Icon, Text, type IconName, haptic } from '@/components/ui';
import { durations, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

/**
 * Entrée d'une étape (montée avec `key` = étape) : fondu + montée VERTICALE de 12 px. Pas de glissement horizontal :
 * sur le web, un contenu décalé vers la droite pendant l'entrée élargissait la zone qui défile, et un appui à ce
 * moment-là la faisait défiler horizontalement (contenu coupé à gauche à 320 px).
 */
export function StepFade({ dir, children, style }: { dir: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  useEffect(() => {
    p.value = m.timing(1, durations.screen, 'decelerate');
    return () => cancelAnimation(p);
    // une entrée par montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const moves = m.level === 'full';
  const a = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: moves ? (1 - p.value) * 12 * (dir < 0 ? -1 : 1) : 0 }],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

function Segment({ i, pos, color, track }: { i: number; pos: SharedValue<number>; color: string; track: string }) {
  const a = useAnimatedStyle(() => ({ transform: [{ scaleX: interpolate(pos.value, [i, i + 1], [0, 1], 'clamp') }] }));
  return (
    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: 2, transformOrigin: 'left' }, a]} />
    </View>
  );
}

/** Progression en 8 temps (le temps courant est rempli). */
export function OnbProgress({ count, index, label }: { count: number; index: number; label: string }) {
  const t = useTheme();
  const m = useMotion();
  const pos = useSharedValue(index + 1);
  useEffect(() => { pos.value = m.spring(index + 1, 'panneau'); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View testID="onb-progress" style={{ flexDirection: 'row', gap: 5 }} accessible accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: count, now: index + 1 }}>
      {Array.from({ length: count }, (_, i) => <Segment key={i} i={i} pos={pos} color={t.colors.primary} track={t.material.lines.track} />)}
    </View>
  );
}

/** En-tête d'étape : sur-titre (facultatif), grand titre, une phrase courte. */
export function StepTitle({ kicker, title, lead, center }: { kicker?: string; title: string; lead?: string; center?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xxs, alignItems: center ? 'center' : 'flex-start' }}>
      {kicker ? <Text variant="label" weight="bold" color={t.colors.primary} center={center}>{kicker}</Text> : null}
      <Text variant="title" accessibilityRole="header" center={center}>{title}</Text>
      {lead ? <Text muted center={center} style={{ maxWidth: 360 }}>{lead}</Text> : null}
    </View>
  );
}

/**
 * Choix visuel : orbe d'icône teintée (accent de l'espace concerné), libellé, précision. Sélection : la lentille de
 * verre se pose sous la tuile (fondu + échelle 0,96 → 1 en ressort), l'orbe passe à l'accent, coche en coin.
 */
export function SelectableTile({ icon, label, hint, hue, selected, onPress, testID, style, children }: {
  icon: IconName; label: string; hint?: string; hue?: string | null; selected: boolean; onPress: () => void; testID?: string;
  style?: StyleProp<ViewStyle>; children?: React.ReactNode;
}) {
  const t = useTheme();
  const m = useMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(1);
  useEffect(() => { on.value = m.spring(selected ? 1 : 0, 'vif'); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const lens = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: 0.96 + 0.04 * on.value }] }));
  const body = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const orb = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.06 * on.value }] }));
  const lensSpec = t.material.lens;
  const well = hue ? `${hue}${t.isDark ? '33' : '40'}` : t.material.lines.iconWell;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      onPressIn={() => { if (!m.off) press.value = m.spring(0.97, 'vif'); }}
      onPressOut={() => { press.value = m.spring(1, 'rebondLeger'); }}
      onPress={() => { haptic('selection'); onPress(); }}
      style={[{ minHeight: MIN_TOUCH }, style]}
    >
      <Animated.View style={[{ flex: 1, borderRadius: radius.lg, padding: spacing.sm, gap: spacing.xs, borderWidth: 1, borderColor: selected ? t.tokens.border.active : t.tokens.border.rest, backgroundColor: t.material.lines.controlFill }, body]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, backgroundColor: lensSpec.fill, borderWidth: 1, borderColor: lensSpec.edge, borderTopColor: lensSpec.rim }, lens]} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Animated.View style={[{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? t.colors.primary : well }, orb]}>
            <Icon name={icon} size={20} color={selected ? t.colors.primaryText : t.colors.text} />
          </Animated.View>
          {selected ? <Icon name="check-circle" size={20} color={t.colors.primary} /> : <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: t.material.lines.track }} />}
        </View>
        <Text weight="bold">{label}</Text>
        {hint ? <Text variant="small" muted>{hint}</Text> : null}
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Pastille d'exemple : les données affichées sont fictives (jamais présentées comme les vôtres). */
export function ExampleBadge({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: t.material.lines.iconWell }}>
      <Icon name="eye" size={12} color={t.colors.primary} />
      <Text variant="caption" weight="bold" color={t.colors.primary}>{label}</Text>
    </View>
  );
}
