/** Historique des cycles (parcours « éviter une grossesse »), en liste virtualisée. */
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { CycleHistoryView } from '@/components/Fertility';
import { useCycleEstimates } from '@/lib/data/hooks-fertility';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function ContraceptionHistoryScreen() {
  const { est } = useCycleEstimates();
  const insets = useSafeAreaInsets();
  return (
    <Screen back title={tr('u7.contra.history.title')} subtitle={tr('u7.contra.history.subtitle')} scroll={false} padded={false}>
      <CycleHistoryView est={est} addRoute="/contraception/log" bottomPadding={insets.bottom + spacing.xxl} />
    </Screen>
  );
}
