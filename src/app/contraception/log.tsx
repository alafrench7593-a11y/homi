/** Parcours « éviter une grossesse » : règles, symptômes, test de grossesse. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { currentCycleDay } from '@/lib/domain/cycle';
import { todayISO } from '@/lib/domain/dates';
import { Banner, SectionTitle } from '@/components/ui';
import { fmt, PeriodLogger, SymptomLogger, TestLogger } from '@/components/Fertility';
import { t as tr } from '@/i18n';

function CycleTiles() {
  const { entries, est } = useCycleEstimates(2);
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const last = [...entries].map((e) => e.start_date).sort().pop() ?? null;
  return (
    <TodaySummary items={[
      { icon: 'sun', value: day != null ? String(day) : '—', label: tr('u7.contra.log.cycleDay') },
      { icon: 'droplet', value: last ? fmt(last) : '—', label: tr('u7.contra.log.lastPeriod') },
      { icon: 'repeat', value: est.averageLength != null ? tr('u7.contra.log.days', { n: Math.round(est.averageLength) }) : '—', label: tr('u7.contra.log.usualCycle') },
    ]} />
  );
}

export default function ContraceptionLogScreen() {
  return (
    <Screen back title={tr('u7.contra.log.title')} subtitle={tr('u7.contra.log.subtitle')}>
      <CycleTiles />
      <SectionTitle title={tr('u7.contra.log.periods')} />
      <PeriodLogger />
      <SectionTitle title={tr('u7.contra.log.symptoms')} />
      <SymptomLogger />
      <SectionTitle title={tr('u7.contra.log.test')} />
      <TestLogger kinds={['pregnancy_tests']} />
      <Banner tone="info">{tr('u7.contra.log.banner')}</Banner>
    </Screen>
  );
}
