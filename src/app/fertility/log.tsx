/** Parcours « concevoir » : règles, symptômes, tests d'ovulation et de grossesse. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/ui';
import { PeriodLogger, SymptomLogger, TestLogger } from '@/components/Fertility';

export default function FertilityLogScreen() {
  return (
    <Screen back title="Règles, symptômes et tests" subtitle="Notez ce qui vous aide, rien n’est obligatoire.">
      <SectionTitle title="Règles" />
      <PeriodLogger />
      <SectionTitle title="Symptômes du jour" />
      <SymptomLogger />
      <SectionTitle title="Tests" />
      <TestLogger kinds={['ovulation_tests', 'pregnancy_tests']} />
    </Screen>
  );
}
