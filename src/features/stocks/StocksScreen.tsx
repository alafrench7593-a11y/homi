/**
 * Stocks du foyer : inventaire partagé (serveur, temps réel), quantités ESTIMÉES par la famille, seuils.
 * « À prévoir » en tête, sans culpabilisation : suggestions de HOMI (aucune mission sans confirmation), missions en
 * cours, achats cochés à valider. `baby` : seulement couches, lingettes, lait (route /family/stocks/baby, onglet Bébé).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, haptic, SectionTitle } from '@/components/ui';
import { Cascade } from '@/motion';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { RestockSuggestion, StockCard } from '@/features/stocks/StockCard';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useRestock, useStocks } from '@/lib/data/hooks-stocks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { BABY_STOCK_CATEGORIES, categoryInfo, needsAttention, STOCK_CATEGORIES } from '@/lib/domain/stocks';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function StocksScreen({ baby = false }: { baby?: boolean }) {
  const q = useStocks();
  const { labelOf } = usePeople();
  const restock = useRestock();
  const toast = useToast();
  const list = q.all.filter((s) => !s.ingredient_key && (!baby || BABY_STOCK_CATEGORIES.includes(s.category)));
  const attention = list.filter(needsAttention);
  const rest = list.filter((s) => !needsAttention(s));
  const suggested = attention.filter((s) => s.restock_state === 'suggested');
  const toValidate = attention.filter((s) => s.restock_state === 'bought').length;
  const pantryCount = baby ? 0 : q.all.filter((s) => s.ingredient_key).length;
  const open = (id: string) => router.push(`/family/stocks/${id}` as never);

  async function act(id: string, action: 'confirm' | 'dismiss') {
    try {
      const out = await restock.mutateAsync({ id, action });
      haptic(action === 'confirm' ? 'success' : 'light');
      toast(tr(action === 'confirm' ? 'stk.toast.confirmed' : 'stk.toast.dismissed'));
      if (action === 'confirm' && out.task?.id) router.push(`/family/missions/${out.task.id}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr(baby ? 'stk.titleBaby' : 'stk.title')} subtitle={tr('stk.sub')}>
      <DemoPerson />
      <TodaySummary title={tr('stk.summary')} items={[
        { icon: 'bell', value: String(attention.length), label: tr('stk.sum.attention') },
        { icon: 'package', value: String(list.length), label: tr('stk.sum.tracked') },
        { icon: 'check-circle', value: String(toValidate), label: tr('stk.sum.toValidate') },
      ]} testID="stocks-summary" />
      <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
        <Button label={tr('stk.add')} icon="plus" onPress={() => router.push((baby ? '/family/stocks/new?category=diapers' : '/family/stocks/new') as never)} testID="stock-add" />
        <Button label={tr('stk.openShopping')} icon="shopping-cart" variant="secondary" onPress={() => router.push('/meals/shopping')} testID="stock-open-shopping" />
      </View>
      <Banner tone="info" icon="info">{tr('stk.estimateNote')}</Banner>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={3} /> : q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : !list.length ? (
        <EmptyState icon="package" title={tr('stk.empty')} body={tr('stk.emptyB')} action={{ label: tr('stk.add'), onPress: () => router.push('/family/stocks/new') }} />
      ) : (
        <>
          {suggested.map((s) => (
            <RestockSuggestion key={`sg-${s.id}`} stock={s} busy={restock.isPending && restock.variables?.id === s.id}
              assigneeHint={s.responsible_id ? tr('stk.suggest.to', { person: labelOf(s.responsible_id) }) : tr('stk.suggest.toDomain')}
              onConfirm={() => void act(s.id, 'confirm')} onDismiss={() => void act(s.id, 'dismiss')} />
          ))}
          {attention.length ? (
            <View style={{ gap: spacing.sm }} testID="stocks-attention">
              <SectionTitle title={tr('stk.section.attention')} subtitle={tr('stk.section.attentionSub')} />
              {attention.map((s, i) => <Cascade key={s.id} index={i}><StockCard stock={s} labelOf={labelOf} onOpen={() => open(s.id)} /></Cascade>)}
            </View>
          ) : null}
          {pantryCount ? <Button label={tr('stk.pantry.count', { count: pantryCount })} icon="book-open" variant="ghost" onPress={() => router.push('/meals/pantry')} testID="stock-open-pantry" /> : null}
          {STOCK_CATEGORIES.map((c) => {
            const items = rest.filter((s) => s.category === c.key);
            if (!items.length) return null;
            return (
              <View key={c.key} style={{ gap: spacing.sm }}>
                <SectionTitle title={tr(categoryInfo(c.key).label)} />
                {items.map((s, i) => <Cascade key={s.id} index={i}><StockCard stock={s} labelOf={labelOf} onOpen={() => open(s.id)} /></Cascade>)}
              </View>
            );
          })}
        </>
      )}
    </Screen>
  );
}
