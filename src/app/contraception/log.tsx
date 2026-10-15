/** Parcours « éviter une grossesse » : règles, symptômes, test de grossesse. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { Banner, SectionTitle } from '@/components/ui';
import { PeriodLogger, SymptomLogger, TestLogger } from '@/components/Fertility';

export default function ContraceptionLogScreen() {
  return (
    <Screen back title="Règles, symptômes et test" subtitle="Notez ce qui vous aide, rien n’est obligatoire.">
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
