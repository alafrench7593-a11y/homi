/**
 * Chronologie de l'essai gratuit (écran Premium v2 et page d'abonnement) : Aujourd'hui → Pendant N jours (date exacte
 * de fin de l'essai) → Le <date réelle> : premier prélèvement et son montant, puis comment annuler avant.
 * Affichée seulement si la boutique confirme un essai pour la formule choisie (trialDays > 0) : une personne non
 * éligible ne voit aucune mention d'essai.
 * Aucune promesse de rappel : HOMI ne programme pas de notification de fin d'essai.
 * Les étapes arrivent en cascade courte (Cascade : Réduire les animations → visibles d'emblée).
 */
import React from 'react';
import { Platform, View } from 'react-native';
import { Text } from '@/components/ui';
import { Cascade } from '@/motion';
import type { Plan } from '@/lib/premium/plans';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { cancelHintKey, trialTimeline } from './paywallModel';

export function TrialTimeline({ plan, from }: { plan: Pick<Plan, 'trialDays' | 'price' | 'period'>; from?: Date }) {
  const th = useTheme();
  const steps = trialTimeline(plan, from);
  if (!steps.length) return null;
  return (
    <View testID="pw2-timeline" style={{ gap: spacing.xs }}>
      <Text variant="label" accessibilityRole="header">{tr('pay2.tl.title')}</Text>
      <View accessibilityRole="list">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          const dot = i === 0 ? th.colors.primary : last ? th.colors.text : th.colors.surface;
          return (
            <Cascade key={s.key} index={i}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }} accessible accessibilityLabel={`${s.title}. ${s.body}`} testID={`pw2-tl-${s.key}`}>
                <View style={{ width: 16, alignItems: 'center' }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: 3, backgroundColor: dot, borderWidth: 2, borderColor: i === 0 ? th.colors.primary : th.colors.textMuted }} />
                  {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: th.colors.border, marginVertical: 2 }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: last ? 0 : spacing.sm, gap: 2 }}>
                  <Text weight="bold">{s.title}</Text>
                  <Text variant="small" muted>{s.body}</Text>
                </View>
              </View>
            </Cascade>
          );
        })}
      </View>
      <Text variant="small" muted testID="pw2-tl-cancel">{tr(cancelHintKey(Platform.OS))}</Text>
    </View>
  );
}
