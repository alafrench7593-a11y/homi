/** Pertes vaginales : historique des observations (privées), accès à la saisie et aux fiches pédagogiques. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { HistoryHeader } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Row } from '@/components/ui';
import { useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { useDischargeLabels } from '@/features/cycle/discharge';
import { CycleIcon, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { fmtDay } from '@/features/cycle/format';
import { formatTime, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function DischargeList() {
  const c = useCyclePalette();
  const q = useDischargeLogs();
  const L = useDischargeLabels();
  const logs = q.data ?? [];
  return (
    <Screen back title={tr('cy.dis.title')} subtitle={tr('cy.dis.subtitle')}
      action={{ label: tr('cy.dis.new'), icon: 'plus', onPress: () => router.push('/cycle/discharge/new' as never), testID: 'discharge-new' }}>
      <Glass onPress={() => router.push('/cycle/guides' as never)} accessibilityLabel={tr('cy.nav.guides')}>
        <Row><CycleIcon name="guide" color={c.mauve} /><Ink weight="bold" style={{ flex: 1 }}>{tr('cy.nav.guides')}</Ink></Row>
        <Ink variant="small" soft>{tr('cy.dis.guidesHint')}</Ink>
      </Glass>
      <Ink variant="caption" soft>{tr('cy.private')}</Ink>
      <HistoryHeader title={tr('cy.nav.discharge')} count={logs.length || undefined} />
      {q.isLoading && !q.data ? <Skeleton rows={3} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {!q.isLoading && !logs.length ? <EmptyState icon="droplet" title={tr('cy.dis.empty')} body={tr('cy.dis.emptyBody')} /> : null}
      {logs.map((l, i) => (
        <Rise key={l.id} delay={Math.min(i, 6) * 40}>
          <Glass onPress={() => router.push(`/cycle/discharge/${l.id}` as never)} accessibilityLabel={`${fmtDay(l.observed_at.slice(0, 10))}, ${L.summary(l)}`} accessibilityHint={tr('cy.dis.openHint')}>
            <Row style={{ alignItems: 'flex-start' }}>
              <CycleIcon name="discharge" color={c.mauve} />
              <View style={{ flex: 1, gap: 2 }}>
                <Ink weight="medium">{`${fmtDay(l.observed_at.slice(0, 10))} · ${formatTime(l.observed_at)}`}</Ink>
                <Ink variant="small" soft>{L.summary(l) || tr('cy.dis.noDetail')}</Ink>
                {l.note ? <Ink variant="caption" soft>{l.note}</Ink> : null}
              </View>
            </Row>
          </Glass>
        </Rise>
      ))}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
