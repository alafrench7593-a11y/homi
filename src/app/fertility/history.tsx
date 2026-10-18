/** Historique des cycles (parcours « concevoir »), en liste virtualisée. */
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { CycleHistoryView } from '@/components/Fertility';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { spacing } from '@/theme/tokens';

export default function FertilityHistoryScreen() {
  const { est } = useCycleEstimates();
  const insets = useSafeAreaInsets();
  return (
    <Screen back title="Historique des cycles" subtitle="Vos cycles passés, à partir de vos saisies." scroll={false} padded={false}>
      <CycleHistoryView est={est} addRoute="/fertility/log" bottomPadding={insets.bottom + spacing.xxl} />
    </Screen>
  );
}
