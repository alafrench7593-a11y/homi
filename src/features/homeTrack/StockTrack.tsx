/**
 * Stocks du foyer — suivi (22/11/2026). Même donnée que l'inventaire (household_stocks) :
 *  · `StockHero` : ce qui est « à prévoir » en grand, « à prévoir / suffisant / sans quantité », dernier achat validé
 *    (qui, quand) s'il est noté ;
 *  · `StockFixTray` : fiche d'un stock (stock gardé dans l'adresse « ?stock= ») ; corriger la quantité ESTIMÉE (±1,
 *    valeur provisoire, Annuler, Enregistrer verrouillé), écrite par `useUpdateStock` à la version lue : rien n'est
 *    écrasé si quelqu'un l'a changée entre-temps (le brouillon reste, avec le message).
 */
import React from 'react';
import { router } from 'expo-router';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useUpdateStock } from '@/lib/data/hooks-stocks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { parseQty } from '@/lib/domain/homeTrack';
import { categoryInfo, needsAttention, productLabelOf, stockLevel, type Stock } from '@/lib/domain/stocks';
import { clock } from '@/lib/domain/sleepPlanner';
import { formatStockQty } from '@/features/stocks/StockCard';
import { HmFixTray, HmHero } from './kit';

const when = (iso: string) => `${formatDate(iso, { weekday: 'short', day: 'numeric', month: 'short' })} · ${clock(new Date(iso))}`;

export function StockHero({ list, labelOf }: { list: readonly Stock[]; labelOf: (id: string | null | undefined) => string }) {
  if (!list.length) return null;
  const attention = list.filter(needsAttention).length;
  const unknown = list.filter((s) => stockLevel(s) === 'unknown').length;
  const last = [...list].filter((s) => s.last_purchase_at).sort((a, b) => (a.last_purchase_at! < b.last_purchase_at! ? 1 : -1))[0];
  const caption = last ? (last.last_validated_by
    ? tr('hm.stk.lastBy', { item: productLabelOf(last), who: labelOf(last.last_validated_by), when: when(last.last_purchase_at!) })
    : tr('hm.stk.lastAt', { item: productLabelOf(last), when: when(last.last_purchase_at!) })) : null;
  return (
    <HmHero testID="hm-stk-hero" value={String(attention)} unit={tr('hm.stk.unit', { count: list.length })}
      split={[
        { label: tr('hm.stk.toPlan'), value: String(attention), testID: 'hm-stk-plan' },
        { label: tr('hm.stk.enough'), value: String(list.length - attention - unknown), testID: 'hm-stk-ok' },
        { label: tr('hm.stk.unknown'), value: String(unknown), testID: 'hm-stk-unknown' },
      ]} caption={caption} />
  );
}

export function StockFixTray({ stock, labelOf, onClose }: { stock: Stock | null; labelOf: (id: string | null | undefined) => string; onClose: () => void }) {
  const update = useUpdateStock();
  if (!stock) return null;
  const qty = stock.qty_estimate == null || stock.qty_estimate === '' ? '' : String(Number(stock.qty_estimate));
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="hm-stk-tray"
      title={productLabelOf(stock)} hero={formatStockQty(stock.qty_estimate, stock.unit)}
      lines={[
        tr(categoryInfo(stock.category).label),
        stock.threshold != null ? tr('stk.threshold.short', { qty: formatStockQty(stock.threshold, stock.unit) }) : null,
        stock.responsible_id ? tr('hm.stk.who', { who: labelOf(stock.responsible_id) }) : null,
        stock.last_purchase_at ? (stock.last_validated_by ? tr('hm.stk.boughtBy', { who: labelOf(stock.last_validated_by), when: when(stock.last_purchase_at) }) : tr('hm.stk.boughtAt', { when: when(stock.last_purchase_at) })) : null,
      ]}
      editLabel={tr('hm.stk.fix')} editTitle={tr('hm.stk.fixTitle', { item: productLabelOf(stock) })}
      onFullForm={() => router.push(`/family/stocks/${stock.id}` as never)}
      fields={[{ key: 'qty', label: tr('hm.stk.qty'), kind: 'number', step: 1, unit: stock.unit ? tr(`stk.u.${stock.unit}` as TKey, { count: 2 }).replace(/^\d+\s*/, '') : undefined, hint: tr('hm.stk.qtyHint') }]}
      initial={{ qty }}
      validate={(d) => (parseQty(d.qty) === 'bad' ? tr('hm.fix.badQty') : null)}
      onSave={async (d) => {
        const v = parseQty(d.qty);
        if (v === 'bad') return tr('hm.fix.badQty');
        try { await update.mutateAsync({ id: stock.id, version: stock.version, patch: { qty_estimate: v } }); return 'ok'; } catch (e) { return friendlyError(e); }
      }} />
  );
}
