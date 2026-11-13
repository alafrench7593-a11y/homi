/**
 * Stocks du foyer : carte d'un stock, pastille de niveau, carte de suggestion (« HOMI propose… », confirmation
 * explicite) et carte de validation d'achat (la quantité change ICI, jamais au simple cochage).
 * Ton sans culpabilisation : « à prévoir », jamais « en retard », « oublié » ni « urgent ».
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Field, Icon, Segmented, Text } from '@/components/ui';
import { tint } from '@/components/ToolGlyph';
import { LiftCard } from '@/motion';
import { categoryInfo, needsAttention, productLabelOf, stockLevel, type Stock, type StockLevel, type StockUnit } from '@/lib/domain/stocks';
import { useTheme } from '@/theme/ThemeProvider';
import { palette, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

/** « 2 sacs », « 40 unités » ; quantité non saisie → « non renseignée » (jamais inventée). */
export function formatStockQty(qty: number | string | null | undefined, unit: StockUnit | string | null | undefined): string {
  if (qty == null || qty === '') return tr('stk.qty.unknown');
  const n = Number(qty);
  const shown = Number.isInteger(n) ? String(n) : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return unit ? tr(`stk.u.${unit}` as TKey, { count: n }).replace(String(n), shown) : shown;
}

const LEVEL_LABEL: Record<StockLevel, TKey> = { unknown: 'stk.level.unknown', ok: 'stk.level.ok', low: 'stk.level.low', out: 'stk.level.out' };

export function StockStatePill({ stock, testID }: { stock: Stock; testID?: string }) {
  const t = useTheme();
  const level = stockLevel(stock);
  const key: TKey = stock.restock_state === 'bought' ? 'stk.state.bought' : stock.restock_state === 'ordered' ? 'stk.state.ordered'
    : stock.restock_state === 'suggested' ? 'stk.state.suggested' : LEVEL_LABEL[level];
  const c = stock.restock_state === 'bought' ? t.colors.success : needsAttention(stock) ? t.colors.primary : level === 'unknown' ? t.colors.textMuted : t.colors.text;
  return (
    <View testID={testID} accessibilityRole="text" style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 26,
      borderRadius: radius.pill, backgroundColor: tint(c, t.isDark ? 0.22 : 0.12), borderWidth: 1, borderColor: tint(c, 0.3) }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
      <Text variant="caption" weight="bold" color={c}>{tr(key)}</Text>
    </View>
  );
}

export function StockCard({ stock, labelOf, onOpen }: { stock: Stock; labelOf: (id: string | null | undefined) => string; onOpen: () => void }) {
  const t = useTheme();
  const cat = categoryInfo(stock.category);
  const meta = [formatStockQty(stock.qty_estimate, stock.unit),
    stock.threshold != null ? tr('stk.threshold.short', { qty: formatStockQty(stock.threshold, stock.unit) }) : null,
    stock.responsible_id ? labelOf(stock.responsible_id) : null].filter(Boolean).join(' · ');
  return (
    <LiftCard testID={`stock-${stock.id}`} accessibilityLabel={`${productLabelOf(stock)}. ${meta}`} onOpen={onOpen} radius={radius.lg} shadowColor={palette.night}
      style={{ padding: spacing.md, gap: spacing.xs, borderRadius: radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.primary, t.isDark ? 0.2 : 0.1) }}>
          <Icon name={cat.icon} size={20} color={t.colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{productLabelOf(stock)}</Text>
          <Text variant="small" muted>{meta}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </View>
      <StockStatePill stock={stock} testID={`stock-state-${stock.id}`} />
    </LiftCard>
  );
}

/** « HOMI propose » : rien n'est créé tant qu'un membre autorisé n'a pas confirmé. */
export function RestockSuggestion({ stock, busy, onConfirm, onDismiss, assigneeHint }: {
  stock: Stock; busy?: boolean; onConfirm: () => void; onDismiss?: () => void; assigneeHint?: string | null;
}) {
  const t = useTheme();
  return (
    <Card style={{ gap: spacing.sm, borderWidth: 1, borderColor: tint(t.colors.primary, 0.35) }} testID={`restock-${stock.id}`}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Icon name="zap" size={18} color={t.colors.primary} />
        <Text weight="bold" style={{ flex: 1 }}>{tr('stk.suggest.title', { product: productLabelOf(stock) })}</Text>
      </View>
      <Text variant="small">{stock.threshold != null
        ? tr('stk.suggest.body', { qty: formatStockQty(stock.qty_estimate, stock.unit), threshold: formatStockQty(stock.threshold, stock.unit) })
        : tr('stk.suggest.bodyManual')}</Text>
      {assigneeHint ? <Text variant="caption" muted>{assigneeHint}</Text> : null}
      <Text variant="caption" muted>{tr('stk.suggest.consent')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Button label={tr('stk.suggest.confirm')} icon="send" size="sm" loading={busy} onPress={onConfirm} testID={`restock-confirm-${stock.id}`} />
        {onDismiss ? <Button label={tr('stk.suggest.dismiss')} icon="clock" size="sm" variant="ghost" onPress={onDismiss} testID={`restock-dismiss-${stock.id}`} /> : null}
      </View>
    </Card>
  );
}

/** Validation d'achat : la famille indique ce qu'elle a acheté (ou la nouvelle estimation) ; rien n'est déduit. */
export function PurchaseValidation({ stock, busy, onValidate, fromList }: {
  stock: Stock; busy?: boolean; onValidate: (qty: number, mode: 'add' | 'set') => void; fromList: boolean;
}) {
  const t = useTheme();
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [qty, setQty] = useState('');
  const [error, setError] = useState<string | undefined>();
  const submit = () => {
    const n = Number(qty.replace(',', '.'));
    if (!qty.trim() || !Number.isFinite(n) || n < 0 || (mode === 'add' && n === 0)) { setError(tr('stk.err.qty')); return; }
    setError(undefined);
    onValidate(n, mode);
  };
  return (
    <Card style={{ gap: spacing.sm, borderWidth: 1, borderColor: tint(t.colors.success, 0.4) }} testID={`purchase-${stock.id}`}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Icon name={fromList ? 'check-circle' : 'shopping-bag'} size={18} color={t.colors.success} />
        <Text weight="bold" style={{ flex: 1 }}>{tr(fromList ? 'stk.buy.titleChecked' : 'stk.buy.title')}</Text>
      </View>
      <Text variant="small">{tr(fromList ? 'stk.buy.bodyChecked' : 'stk.buy.body', { qty: formatStockQty(stock.qty_estimate, stock.unit) })}</Text>
      <Segmented label={tr('stk.buy.mode')} value={mode} onChange={setMode}
        options={[{ value: 'add', label: tr('stk.buy.add'), testID: 'purchase-mode-add' }, { value: 'set', label: tr('stk.buy.set'), testID: 'purchase-mode-set' }]} />
      <Field label={mode === 'add' ? tr('stk.buy.qtyAdd') : tr('stk.buy.qtySet')} value={qty} onChangeText={setQty} keyboardType="decimal-pad" error={error}
        suffix={stock.unit ? tr(`stk.un.${stock.unit}` as TKey) : undefined} testID="purchase-qty" />
      <Button label={tr('stk.buy.validate')} icon="check" loading={busy} onPress={submit} testID="purchase-validate" />
      <Text variant="caption" muted>{tr('stk.buy.budget')}</Text>
    </Card>
  );
}

export function CategoryChips({ value, onChange, testPrefix = 'stock-cat' }: { value: string | null; onChange: (k: Stock['category']) => void; testPrefix?: string }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {(['diapers', 'wipes', 'milk', 'laundry', 'toilet_paper', 'cleaning', 'pet_food', 'food', 'other'] as const).map((k) => (
        <Chip key={k} label={tr(categoryInfo(k).label)} icon={categoryInfo(k).icon} selected={value === k} onPress={() => onChange(k)} testID={`${testPrefix}-${k}`} />
      ))}
    </View>
  );
}
