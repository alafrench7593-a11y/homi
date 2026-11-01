/** Historique des cycles (parcours « concevoir »), en liste virtualisée. */
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { CycleHistoryView } from '@/components/Fertility';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function FertilityHistoryScreen() {
  const { est } = useCycleEstimates();
  const insets = useSafeAreaInsets();
  return (
    <Screen back title={tr('u3.fertHist.title')} subtitle={tr('u3.fertHist.subtitle')} scroll={false} padded={false}>
      <CycleHistoryView est={est} addRoute="/fertility/log" bottomPadding={insets.bottom + spacing.xxl} />
    </Screen>
  );
}
