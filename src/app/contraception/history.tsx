/** Historique des cycles (parcours « éviter une grossesse »). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { CycleHistoryView } from '@/components/Fertility';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';

export default function ContraceptionHistoryScreen() {
  const { est } = useCycleEstimates();
  return (
    <Screen back title="Historique des cycles" subtitle="Vos cycles passés, à partir de vos saisies.">
      <CycleHistoryView est={est} />
    </Screen>
  );
}
