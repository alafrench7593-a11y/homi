/**
 * Accueil du bébé › « M'aider pour les nuits » : sommeil récent, prochaine suggestion, conseil de l'IA et
 * « La nuit est difficile », visibles dès le profil sans chercher dans les outils. Les graphiques et l'historique
 * détaillé restent dans la page Sommeil.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { usePremium } from '@/lib/data/hooks';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { duration, sleepReview } from '@/lib/domain/nightsHelp';
import { clock } from '@/lib/domain/sleepPlanner';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, formatNumber } from '@/i18n';

export function NightsHelpCard({ child }: { child: Child }) {
  const t = useTheme();
  const premium = usePremium();
  const { plan, sleeps } = useSleepPlan(child, 60_000);
  const review = useMemo(() => sleepReview(sleeps, child.id), [sleeps, child.id]);
  const name = child.first_name;
  const recent = review.enough
    ? tr('u3.sleep.recent', { naps: formatNumber(review.napsPerDay ?? 0), night: review.nightMinutes ? tr('u3.sleep.nights', { d: duration(review.nightMinutes) }) : '', wake: review.nightWakeups != null ? tr('u3.sleep.wakes', { n: formatNumber(review.nightWakeups) }) : '' })
    : review.daysNoted ? tr('u3.sleep.days', { count: review.daysNoted }) : tr('u3.sleep.note', { name });
  const next = premium && plan?.state === 'awake'
    ? plan.nextNap && !plan.nextNap.overdue ? tr('u3.sleep.nextNap', { time: clock(plan.nextNap.at) })
      : plan.bedtime && !plan.bedtime.overdue ? tr('u3.sleep.bed', { time: clock(plan.bedtime.routineAt) }) : null
    : null;
  return (
    <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border }} testID="nights-help-card">
      <LinearGradient colors={t.isDark ? ['#1E2347', '#171B36'] : ['#EEF0FB', '#F8F1FB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: spacing.md, gap: spacing.sm }}>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('u3.sleep.helpA11y', { name })} onPress={() => router.push(`/sleep/help/${child.id}` as never)} testID="nights-help-open">
          <Row style={{ alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${t.colors.lavender}33`, alignItems: 'center', justifyContent: 'center' }}><Icon name="moon" size={19} color={t.colors.lavender} /></View>
            <View style={{ flex: 1 }}>
              <Text weight="bold">{tr('u3.sleep.help')}</Text>
              <Text variant="caption" muted>{tr('u3.sleep.sub', { name })}</Text>
            </View>
            <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
          </Row>
        </Tappable>
        <Text variant="small" testID="nights-help-recent">{recent}</Text>
        {next ? <Text variant="small" weight="bold" testID="nights-help-next">{next}</Text> : null}
        <Row wrap>
          <Button label={tr('u3.sleep.ai')} icon="message-circle" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/assistant/chat', params: { topic: 'sleep', child: child.id } })} testID="nights-help-ai" />
          <Button label={tr('u3.sleep.hard')} icon="moon" size="sm" variant="ghost" onPress={() => router.push(`/sleep/difficult/${child.id}` as never)} testID="nights-help-difficult" />
        </Row>
      </LinearGradient>
    </View>
  );
}
