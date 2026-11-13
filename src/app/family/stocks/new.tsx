/** Nouveau stock du foyer : saisi hors ligne si besoin (client_id), partagé avec le foyer dès l'envoi. */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { haptic } from '@/components/ui';
import { StockForm } from '@/features/stocks/StockForm';
import { useChildren } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useAddStock } from '@/lib/data/hooks-stocks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { STOCK_CATEGORIES, type StockCategory } from '@/lib/domain/stocks';
import { t as tr } from '@/i18n';

export default function NewStock() {
  const params = useLocalSearchParams<{ category?: string }>();
  const add = useAddStock();
  const toast = useToast();
  const { people } = usePeople();
  const { data: children } = useChildren();
  const category = STOCK_CATEGORIES.some((c) => c.key === params.category) ? (params.category as StockCategory) : undefined;
  return (
    <Screen back title={tr('stk.new')} subtitle={tr('stk.sub')}>
      <StockForm people={people} children={children ?? []} busy={add.isPending} submitLabel={tr('stk.form.create')} defaultCategory={category}
        onSubmit={async (v) => {
          try { await add.mutateAsync(v); haptic('success'); toast(tr('stk.toast.added')); router.replace('/family/stocks' as never); }
          catch (e) { toast(friendlyError(e), 'error'); }
        }} />
    </Screen>
  );
}
