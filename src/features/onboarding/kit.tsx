/**
 * Onboarding v2 — pièces partagées (Reanimated, fil UI, `useMotion` : Réduire les animations → états finaux).
 *  - `StepFade` : l'étape entre en fondu + 12 px de montée (Reanimated, fil UI, décélération) ;
 *  - `OnbProgress` : 8 temps, le segment atteint se remplit en ressort « panneau » (transform uniquement) ;
 *  - `StepTitle` : sur-titre facultatif, titre aéré centré (rôle « en-tête »), une phrase ;
 *  - `ChoiceList` / `ChoiceRow` : réponses en liste calme (case, radio ou rang), ressort + haptique « sélection » ;
 *  - `artForAnswers` : l'illustration 3D de la situation principale choisie.
 * Uniquement les jetons du thème ; aucune couleur en dur.
 */
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

/** Web : jamais de césure dans un libellé de réponse (« sé-parés » à 320 pt) ; le mot passe entier à la ligne. */
const NO_HYPHENS = (Platform.OS === 'web' ? { hyphens: 'manual' } : null) as unknown as TextStyle;
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Icon, Text, type IconName, haptic } from '@/components/ui';
import { durations, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import type { IllustrationName } from '@/features/entry/HeroArt';
import { primarySituation, type OnboardingAnswers, type Situation } from '@/lib/onboarding/personalize';
import { CheckMark } from '@/motion/CheckMark';

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

/**
 * En-tête d'étape (v5) : sur-titre (facultatif), titre aéré, une phrase courte. Centré par défaut : il se lit sous
 * l'illustration de tête, comme une seule question.
 */
export function StepTitle({ kicker, title, lead, center = true }: { kicker?: string; title: string; lead?: string; center?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xs, alignItems: center ? 'center' : 'flex-start', paddingHorizontal: center ? spacing.xs : 0 }}>
      {kicker ? <Text variant="label" weight="bold" color={t.colors.primary} center={center}>{kicker}</Text> : null}
      <Text variant="title" accessibilityRole="header" center={center} style={{ maxWidth: 360 }}>{title}</Text>
      {lead ? <Text muted center={center} style={{ maxWidth: 340 }}>{lead}</Text> : null}
    </View>
  );
}

/** Illustration 3D de chaque situation (assets/illustrations) ; aucune réponse encore : la famille. */
export const SITUATION_ART: Record<Situation, IllustrationName> = {
  ttc: 'projet-bebe', pregnant: 'grossesse', baby: 'bebe', kids: 'enfants', cycle: 'cycle', home: 'foyer-maison',
};
export function artForAnswers(a: Pick<OnboardingAnswers, 'situations'>): IllustrationName {
  return a.situations.length ? SITUATION_ART[primarySituation(a)] : 'famille';
}

/**
 * Groupe de réponses (v5) : UNE surface calme (rayon 20, liseré), rangées séparées par des filets fins alignés sur le
 * texte. Remplace la grille de tuiles teintées : une question, une liste.
 */
export function ChoiceList({ children, label, testID, radio }: { children: React.ReactNode; label: string; testID?: string; radio?: boolean }) {
  const t = useTheme();
  return (
    <View testID={testID} accessibilityRole={radio ? 'radiogroup' : 'list'} accessibilityLabel={label}
      style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: t.tokens.border.rest, backgroundColor: t.tokens.surface.opaque, overflow: 'hidden' }}>
      {React.Children.toArray(children).filter(Boolean).map((c, i) => (
        <React.Fragment key={i}>
          {i ? <View style={{ height: 1, marginLeft: ROW_TEXT_INSET, backgroundColor: t.material.lines.separator }} /> : null}
          {c}
        </React.Fragment>
      ))}
    </View>
  );
}
/** Retrait du filet : il commence au texte, pas à l'icône. */
const ROW_TEXT_INSET = spacing.md + 40 + spacing.sm;

/**
 * Réponse d'une liste : pastille d'icône (corail pâle), libellé, précision, témoin de choix à droite (case cochée ou
 * rang). Pression : échelle 0,985 (ressort, fil UI) ; choix : le témoin se pose en ressort, fond corail très pâle,
 * haptique « sélection ». Réduire les animations : états finaux immédiats.
 */
export function ChoiceRow({ icon, label, hint, selected, onPress, testID, radio, rank, a11yLabel }: {
  icon: IconName; label: string; hint?: string; selected: boolean; onPress: () => void; testID?: string; radio?: boolean;
  /** Rang du choix (1, 2…) affiché dans le témoin au lieu de la coche */
  rank?: number;
  /** Nom accessible (défaut : libellé + précision) */
  a11yLabel?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const on = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(1);
  useEffect(() => { on.value = m.spring(selected ? 1 : 0, 'rebondLeger'); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const body = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const tint = useAnimatedStyle(() => ({ opacity: on.value }));
  const mark = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: 0.6 + 0.4 * on.value }] }));
  return (
    <Pressable
      testID={testID}
      accessibilityRole={radio ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      accessibilityLabel={a11yLabel ?? (hint ? `${label}. ${hint}` : label)}
      onPressIn={() => { if (!m.off) press.value = m.spring(0.985, 'vif'); }}
      onPressOut={() => { press.value = m.spring(1, 'rebondLeger'); }}
      onPress={() => { haptic('selection'); onPress(); }}
    >
      {({ pressed }) => (
        <Animated.View style={[{ minHeight: MIN_TOUCH + 16, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' }, body]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.material.lines.iconWell, opacity: 0 }, tint]} />
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
            <Icon name={icon} size={19} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text weight={selected ? 'bold' : 'medium'} style={NO_HYPHENS}>{label}</Text>
            {hint ? <Text variant="small" muted>{hint}</Text> : null}
          </View>
          <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 24, height: 24, borderRadius: radio ? 12 : 7, borderWidth: 1.5, borderColor: t.material.lines.track }} />
            <Animated.View style={[{ width: 26, height: 26, borderRadius: radio ? 13 : 8, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.action.fill }, mark]}>
              {rank ? <Text variant="small" weight="bold" color={t.tokens.action.text}>{rank}</Text> : <CheckMark checked={selected} size={17} color={t.tokens.action.text} />}
            </Animated.View>
          </View>
        </Animated.View>
      )}
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
