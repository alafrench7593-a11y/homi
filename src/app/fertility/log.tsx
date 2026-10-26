/** Parcours « concevoir » : règles, symptômes, tests d'ovulation et de grossesse. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { currentCycleDay } from '@/lib/domain/cycle';
import { todayISO } from '@/lib/domain/dates';
import { SectionTitle } from '@/components/ui';
import { fmt, PeriodLogger, SymptomLogger, TestLogger } from '@/components/Fertility';

function CycleTiles() {
  const { entries, est } = useCycleEstimates(2);
  const today = todayISO();
  const day = currentCycleDay(entries, today);
  const last = [...entries].map((e) => e.start_date).sort().pop() ?? null;
  return (
    <TodaySummary items={[
      { icon: 'sun', value: day != null ? String(day) : '—', label: 'Jour du cycle' },
      { icon: 'droplet', value: last ? fmt(last) : '—', label: 'Dernières règles' },
      { icon: 'repeat', value: est.averageLength != null ? `${Math.round(est.averageLength)} j` : '—', label: 'Cycle habituel' },
    ]} />
  );
}

export default function FertilityLogScreen() {
  return (
    <Screen back title="Règles, symptômes et tests" subtitle="Notez ce qui vous aide, rien n’est obligatoire.">
      <CycleTiles />
      <SectionTitle title="Règles" />
      <PeriodLogger />
      <SectionTitle title="Symptômes du jour" />
      <SymptomLogger />
      <SectionTitle title="Tests" />
      <TestLogger kinds={['ovulation_tests', 'pregnancy_tests']} />
    </Screen>
  );
}
