/** Parcours « concevoir » : règles, symptômes, tests d'ovulation et de grossesse. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { currentCycleDay } from '@/lib/domain/cycle';
import { todayISO } from '@/lib/domain/dates';
import { SectionTitle } from '@/components/ui';
import { fmt, PeriodLogger, SymptomLogger, TestLogger } from '@/components/Fertility';
import { t as tr } from '@/i18n';

function CycleTiles() {
  const { entries, est } = useCycleEstimates(2);
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const last = [...entries].map((e) => e.start_date).sort().pop() ?? null;
  return (
    <TodaySummary items={[
      { icon: 'sun', value: day != null ? String(day) : '—', label: tr('u3.fertLog.day') },
      { icon: 'droplet', value: last ? fmt(last) : '—', label: tr('u3.fertLog.last') },
      { icon: 'repeat', value: est.averageLength != null ? `${Math.round(est.averageLength)} j` : '—', label: tr('u3.fertLog.usual') },
    ]} />
  );
}

export default function FertilityLogScreen() {
  return (
    <Screen back title={tr('u3.fertLog.title')} subtitle={tr('u3.fertLog.subtitle')}>
      <CycleTiles />
      <SectionTitle title={tr('u3.fertLog.periods')} />
      <PeriodLogger />
      <SectionTitle title={tr('u3.fertLog.symp')} />
      <SymptomLogger />
      <SectionTitle title={tr('u3.fertLog.tests')} />
      <TestLogger kinds={['ovulation_tests', 'pregnancy_tests']} />
    </Screen>
  );
}
