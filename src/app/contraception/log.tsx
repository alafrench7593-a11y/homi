/** Parcours « éviter une grossesse » : règles, symptômes, test de grossesse. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { currentCycleDay } from '@/lib/domain/cycle';
import { todayISO } from '@/lib/domain/dates';
import { Banner, SectionTitle } from '@/components/ui';
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

export default function ContraceptionLogScreen() {
  return (
    <Screen back title="Règles, symptômes et test" subtitle="Notez ce qui vous aide, rien n’est obligatoire.">
      <CycleTiles />
      <SectionTitle title="Règles" />
      <PeriodLogger />
      <SectionTitle title="Symptômes du jour" />
      <SymptomLogger />
      <SectionTitle title="Test de grossesse" />
      <TestLogger kinds={['pregnancy_tests']} />
      <Banner tone="info">Des règles en retard ou inhabituelles, même sous contraception, peuvent justifier un test de grossesse et un échange avec un professionnel.</Banner>
    </Screen>
  );
}
