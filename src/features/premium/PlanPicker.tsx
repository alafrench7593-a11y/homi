/**
 * Choix de la formule (écran Premium v2) : trois lignes compactes pleine largeur, l'annuelle en tête avec un badge sobre
 * (19/11/2026 : formules et bouton principal visibles sans défiler à 390 × 844).
 * Sélection : bord, fond et pastille passent à l'état choisi en ressort « vif » (Reanimated, fil UI), haptique
 * « sélection » au changement seulement. Réduire les animations : état final immédiat (useMotion).
 * Accessibilité : groupe de boutons radio ; chaque formule annonce nom, prix, période, prix mensuel, économie, essai.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { motionHaptic, PressableScale, useMotion } from '@/motion';
import type { Plan, PlanPeriod } from '@/lib/premium/plans';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { perLong, planA11yLabel, planName } from './paywallModel';

function Radio({ on, color, ring }: { on: SharedValue<number>; color: string; ring: string }) {
  const dot = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scale: 0.4 + 0.6 * on.value }] }));
  const border = useAnimatedStyle(() => ({ borderColor: interpolateColor(on.value, [0, 1], [ring, color]) }));
  return (
    <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, border]}>
      <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }, dot]} />
    </Animated.View>
  );
}

function Option({ plan, selected, featured, onSelect }: { plan: Plan; selected: boolean; featured: boolean; onSelect: (p: PlanPeriod) => void }) {
  const th = useTheme();
  const m = useMotion();
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => { on.value = m.spring(selected ? 1 : 0, 'vif'); }, [selected, m, on]);
  const surface = useAnimatedStyle(() => ({
    borderColor: interpolateColor(on.value, [0, 1], [th.colors.border, th.colors.primary]),
    backgroundColor: interpolateColor(on.value, [0, 1], [th.colors.surfaceAlt, th.colors.surface]),
  }));
  const choose = () => {
    if (selected) return;
    motionHaptic('selection');
    onSelect(plan.period);
  };
  // Ligne compacte (tient avec le bouton principal au-dessus du pli à 390 × 844) : nom + badge, détails (prix mensuel,
  // économie, essai) qui passent à la ligne si besoin ; prix et période alignés à droite.
  return (
    <PressableScale onPress={choose} haptic="none" scale={0.985} accessibilityRole="radio" accessibilityState={{ checked: selected, selected }} aria-checked={selected}
      accessibilityLabel={planA11yLabel(plan, featured)} testID={`pw2-plan-${plan.period}`}>
      <Animated.View style={[{ borderRadius: radius.lg, borderWidth: featured ? 2 : 1.5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, surface]}>
        <Radio on={on} color={th.colors.primary} ring={th.colors.textMuted} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.xs, rowGap: 2 }}>
            <Text weight="bold">{planName(plan.period)}</Text>
            {featured ? (
              <View style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: th.colors.primary, paddingHorizontal: 8, paddingVertical: 1 }}>
                <Text variant="caption" weight="bold" color={th.colors.primary} testID="pw2-badge">{tr('pay2.badge.best')}</Text>
              </View>
            ) : null}
          </View>
          {plan.perMonth || plan.savingsPct ? (
            <Text variant="small" muted testID={`pw2-permonth-${plan.period}`}>
              {[plan.perMonth ? tr('pay2.plan.perMonth', { price: plan.perMonth }) : null, plan.savingsPct ? tr('pay2.plan.save', { pct: plan.savingsPct }) : null].filter(Boolean).join(' · ').replace(/ (%|€)/g, '\u00a0$1')}
            </Text>
          ) : null}
          {plan.trialDays > 0 ? <Text variant="small" weight="medium" color={th.colors.primary} testID={`pw2-trial-${plan.period}`}>{tr('pay2.plan.trial', { count: plan.trialDays })}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', maxWidth: '42%' }}>
          <Text variant={featured ? 'heading' : 'body'} weight="bold" testID={`pw2-price-${plan.period}`}>{plan.price}</Text>
          <Text variant="caption" muted style={{ textAlign: 'right' }}>{perLong(plan.period)}</Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

export function PlanPicker({ plans, selected, onSelect }: { plans: Plan[]; selected: PlanPeriod | null; onSelect: (p: PlanPeriod) => void }) {
  const featured = plans.find((p) => p.period === 'annual') ?? null;
  const others = plans.filter((p) => p !== featured);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={tr('pay2.plansTitle')} style={{ gap: spacing.sm }} testID="pw2-plans">
      {featured ? <Option plan={featured} featured selected={selected === featured.period} onSelect={onSelect} /> : null}
      {others.map((p) => <Option key={p.period} plan={p} featured={false} selected={selected === p.period} onSelect={onSelect} />)}
    </View>
  );
}
