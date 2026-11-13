/**
 * Détail d'un stock : niveau estimé, seuil, responsable ; suggestion de réapprovisionnement (confirmation explicite →
 * mission attribuée), mission en cours, achat à valider (la quantité change ICI seulement), historique des faits.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, haptic, Icon, Text } from '@/components/ui';
import { Cascade, DetailEnter } from '@/motion';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { StatePill } from '@/features/missions/MissionCard';
import { formatStockQty, PurchaseValidation, RestockSuggestion, StockStatePill } from '@/features/stocks/StockCard';
import { StockForm } from '@/features/stocks/StockForm';
import { useChildren, useRows } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useMission } from '@/lib/data/hooks-missions';
import { useDeleteStock, useRestock, useStock, useUpdateStock, useValidatePurchase } from '@/lib/data/hooks-stocks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { eq } from '@/lib/backend';
import { categoryInfo, productLabelOf } from '@/lib/domain/stocks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

interface StockEvent { id: string; type: string; actor_id: string | null; payload: Record<string, unknown>; created_at: string }
const EVENT_LABEL: Record<string, TKey> = {
  'stock.low': 'stk.ev.low', 'stock.restock_confirmed': 'stk.ev.confirmed', 'stock.restock_dismissed': 'stk.ev.dismissed', 'stock.purchase_confirmed': 'stk.ev.purchase',
};

export default function StockDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const toast = useToast();
  const q = useStock(id);
  const s = q.stock;
  const { labelOf, people, me } = usePeople();
  const { data: children } = useChildren();
  const restock = useRestock();
  const validate = useValidatePurchase();
  const update = useUpdateStock();
  const del = useDeleteStock();
  const mission = useMission(s?.restock_task_id ?? undefined).mission;
  const events = useRows<StockEvent>(['household_events', 'stock', id ?? ''], id ? { table: 'household_events', columns: 'id,type,actor_id,payload,created_at',
    filters: [eq('entity_table', 'household_stocks'), eq('entity_id', id)], order: [{ col: 'created_at', asc: false }], limit: 30 } : null);
  const [editing, setEditing] = useState(false);
  const [buying, setBuying] = useState(false);

  if (!s) {
    return (
      <Screen back title={tr('stk.title')}>
        {q.isLoading ? <Skeleton kind="detail" /> : <EmptyState icon="search" title={tr('stk.err.notFound')} action={{ label: tr('stk.title'), onPress: () => router.replace('/family/stocks' as never) }} />}
      </Screen>
    );
  }
  const cat = categoryInfo(s.category);
  const child = children?.find((c) => c.id === s.child_id);

  async function onRestock(action: 'confirm' | 'dismiss') {
    try {
      const out = await restock.mutateAsync({ id: s!.id, action, version: s!.version });
      haptic(action === 'confirm' ? 'success' : 'light');
      toast(tr(action === 'confirm' ? 'stk.toast.confirmed' : 'stk.toast.dismissed'));
      if (action === 'confirm' && out.task?.id) router.push(`/family/missions/${out.task.id}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function onValidate(qty: number, mode: 'add' | 'set') {
    try {
      await validate.mutateAsync({ id: s!.id, qty, mode, version: s!.version });
      haptic('success'); toast(tr('stk.toast.validated')); setBuying(false);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={productLabelOf(s)} subtitle={tr(cat.label)}>
      <DemoPerson />
      <DetailEnter>
        <Card style={{ gap: spacing.sm }} testID="stock-detail">
          <StockStatePill stock={s} testID={`stock-detail-state-${s.restock_state}`} />
          <Text variant="title" accessibilityRole="header">{productLabelOf(s)}</Text>
          <View style={{ gap: 6 }}>
            <Meta icon="package" text={tr('stk.detail.qty', { qty: formatStockQty(s.qty_estimate, s.unit) })} testID="stock-detail-qty" />
            {s.threshold != null ? <Meta icon="bar-chart-2" text={tr('stk.detail.threshold', { qty: formatStockQty(s.threshold, s.unit) })} /> : <Meta icon="bar-chart-2" text={tr('stk.detail.noThreshold')} />}
            {s.brand ? <Meta icon="tag" text={tr('stk.detail.brand', { brand: s.brand })} /> : null}
            {s.frequency_days ? <Meta icon="repeat" text={tr('stk.detail.freq', { count: s.frequency_days })} /> : null}
            <Meta icon="user" text={s.responsible_id ? tr('stk.detail.responsible', { person: labelOf(s.responsible_id) }) : tr('stk.detail.noResponsible')} />
            <Meta icon="bell" text={tr(s.reminder ? 'stk.detail.reminderOn' : 'stk.detail.reminderOff')} />
            {child ? <Meta icon="smile" text={tr('mis.detail.child', { name: child.first_name })} /> : null}
            {s.last_purchase_at ? <Meta icon="check" text={s.last_validated_by === me
              ? tr('stk.detail.lastPurchaseYou', { when: formatDate(s.last_purchase_at, { day: 'numeric', month: 'short' }) })
              : tr('stk.detail.lastPurchase', { when: formatDate(s.last_purchase_at, { day: 'numeric', month: 'short' }), person: labelOf(s.last_validated_by) })} /> : null}
          </View>
          <Text variant="caption" muted>{tr('stk.estimateNote')}</Text>
        </Card>
      </DetailEnter>

      {s.restock_state === 'suggested' || s.restock_state === 'dismissed' ? (
        <Cascade index={1}>
          {s.restock_state === 'dismissed' ? <Text variant="small" muted style={{ marginBottom: spacing.xs }}>{tr('stk.suggest.dismissedNote')}</Text> : null}
          <RestockSuggestion stock={s} busy={restock.isPending} onConfirm={() => void onRestock('confirm')}
            onDismiss={s.restock_state === 'suggested' ? () => void onRestock('dismiss') : undefined}
            assigneeHint={s.responsible_id ? tr('stk.suggest.to', { person: labelOf(s.responsible_id) }) : tr('stk.suggest.toDomain')} />
        </Cascade>
      ) : null}

      {s.restock_state === 'ordered' ? (
        <Cascade index={1}>
          <Card style={{ gap: spacing.xs }} testID="stock-mission">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="send" size={18} color={t.colors.primary} />
              <Text weight="bold" style={{ flex: 1 }}>{tr('stk.ordered.title')}</Text>
            </View>
            {mission ? <><Text variant="small">{mission.title} · {mission.assignee_id ? tr(mission.assignee_id === me ? 'mis.toYou' : 'mis.to', { person: labelOf(mission.assignee_id) }) : tr('mis.open')}</Text><StatePill state={mission.mission_state} /></> : null}
            <Text variant="caption" muted>{tr('stk.ordered.body')}</Text>
            {s.restock_task_id ? <Button label={tr('stk.ordered.open')} icon="arrow-right" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => router.push(`/family/missions/${s.restock_task_id}` as never)} testID="stock-open-mission" /> : null}
          </Card>
        </Cascade>
      ) : null}

      {s.restock_state === 'bought' || buying ? (
        <Cascade index={2}><PurchaseValidation stock={s} busy={validate.isPending} onValidate={(n, m) => void onValidate(n, m)} fromList={s.restock_state === 'bought'} /></Cascade>
      ) : (
        <Button label={tr('stk.buy.manual')} icon="shopping-bag" variant="secondary" onPress={() => setBuying(true)} testID="stock-manual-purchase" />
      )}

      {s.restock_state === 'ok' && s.threshold == null ? <Banner tone="info" icon="bar-chart-2">{tr('stk.detail.setThreshold')}</Banner> : null}

      <Button label={tr(editing ? 'stk.detail.closeEdit' : 'stk.detail.edit')} icon="edit-3" variant="ghost" onPress={() => setEditing(!editing)} testID="stock-edit" />
      {editing ? (
        <Card>
          <StockForm initial={s} people={people} children={children ?? []} busy={update.isPending} submitLabel={tr('stk.form.save')}
            onSubmit={async (v) => {
              try { await update.mutateAsync({ id: s.id, version: s.version, patch: v }); toast(tr('stk.toast.saved')); setEditing(false); }
              catch (e) { toast(friendlyError(e), 'error'); }
            }} />
        </Card>
      ) : null}

      {(events.data ?? []).length ? (
        <Cascade index={3} style={{ gap: spacing.xs }}>
          <Text variant="heading" accessibilityRole="header">{tr('stk.history')}</Text>
          <View testID="stock-history" style={{ gap: spacing.xs }}>
            {(events.data ?? []).filter((e) => EVENT_LABEL[e.type]).map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Icon name={e.type === 'stock.purchase_confirmed' ? 'check-circle' : e.type === 'stock.low' ? 'zap' : e.type === 'stock.restock_confirmed' ? 'send' : 'clock'} size={16} color={t.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text variant="small" weight="medium">{tr(EVENT_LABEL[e.type], { qty: formatStockQty((e.payload.qty_after ?? null) as number | null, s.unit) })}</Text>
                  <Text variant="caption" muted>{tr('mis.ev.by', { person: e.actor_id ? labelOf(e.actor_id) : tr('stk.ev.homi'), when: formatDate(e.created_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}</Text>
                </View>
              </View>
            ))}
          </View>
        </Cascade>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip label={tr('stk.openShopping')} icon="shopping-cart" onPress={() => router.push('/meals/shopping')} />
        <Chip label={tr('stk.delete')} icon="trash-2" onPress={async () => {
          if (!(await confirm(tr('stk.delete'), productLabelOf(s), tr('stk.delete')))) return;
          try { await del.mutateAsync(s.id); router.replace('/family/stocks' as never); } catch (e) { toast(friendlyError(e), 'error'); }
        }} />
      </View>
    </Screen>
  );
}

function Meta({ icon, text, testID }: { icon: 'package' | 'bar-chart-2' | 'tag' | 'repeat' | 'user' | 'bell' | 'smile' | 'check'; text: string; testID?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} testID={testID}>
      <Icon name={icon} size={16} color={t.colors.textMuted} />
      <Text variant="small" style={{ flex: 1 }}>{text}</Text>
    </View>
  );
}
