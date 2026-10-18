/** Historique des cycles (parcours « éviter une grossesse »), en liste virtualisée. */
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { CycleHistoryView } from '@/components/Fertility';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { spacing } from '@/theme/tokens';

export default function ContraceptionHistoryScreen() {
  const { est } = useCycleEstimates();
  const insets = useSafeAreaInsets();
  return (
    <Screen back title="Historique des cycles" subtitle="Vos cycles passés, à partir de vos saisies." scroll={false} padded={false}>
      <CycleHistoryView est={est} addRoute="/contraception/log" bottomPadding={insets.bottom + spacing.xxl} />
    </Screen>
  );
}
