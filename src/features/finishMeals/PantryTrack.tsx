/**
 * « Que puis-je cuisiner ? » — suivi (23/11/2026). Même donnée que l'écran et que les stocks du foyer
 * (`household_stocks` liés à un ingrédient) :
 *  · `PantryList` : ingrédients à la maison, du plus récemment noté au plus ancien, date en colonne fixe, quantité et
 *    note si elles sont connues (jamais une quantité devinée) ;
 *  · fiche (Tray, ingrédient gardé dans l'adresse « ?item= ») : « Corriger » la quantité et la note — valeurs
 *    PROVISOIRES, Annuler, Enregistrer verrouillé ; écrit par `useUpdateStock` (version lue à l'ouverture : rien n'est
 *    écrasé si quelqu'un l'a changé entre-temps) ; « Retirer de la maison » décoche l'ingrédient.
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui';
import { HmFixTray, HmRow } from '@/features/homeTrack/kit';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { formatDate, t as tr } from '@/i18n';
import { useUpdateStock } from '@/lib/data/hooks-stocks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pantryRows, stockPatch } from '@/lib/domain/finishMeals';
import type { Stock } from '@/lib/domain/stocks';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { spacing } from '@/theme/tokens';

const nameOf = (s: Stock) => (s.ingredient_key ? INGREDIENTS[s.ingredient_key]?.name : null) ?? s.label;
const noted = (s: Stock) => s.updated_at || s.created_at;
const shortDate = (iso: string) => formatDate(iso, { day: 'numeric', month: 'short' });
const longDate = (iso: string) => formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const qtyText = (s: Stock) => (s.qty_estimate == null || s.qty_estimate === '' ? null : tr('fm.pantry.qty', { n: Number(s.qty_estimate) }));

export function PantryList({ stocks, usedIn, onRemove }: {
  stocks: readonly Stock[];
  /** Recettes possibles qui utilisent cet ingrédient */
  usedIn: (key: string) => number;
  onRemove: (key: string) => void;
}) {
  const { item } = useLocalSearchParams<{ item?: string }>();
  const rows = pantryRows(stocks);
  const open = item ? rows.find((s) => s.id === item) ?? null : null;
  if (!rows.length) return null;
  return (
    <View style={{ gap: spacing.xs }} testID="fm-pantry-list">
      <Text variant="label" muted accessibilityRole="header">{tr('fm.pantry.listTitle')}</Text>
      <MotionList>{rows.map((s) => (
        <MotionItem key={s.id}>
          <HmRow time={shortDate(noted(s))} icon="shopping-bag" title={nameOf(s)} testID={`fm-pantry-row-${s.id}`}
            detail={[qtyText(s), s.notes].filter(Boolean).join(' · ') || null}
            a11y={`${nameOf(s)}. ${tr('fm.pantry.notedOn', { date: longDate(noted(s)) })}. ${tr('fm.openToFix')}`}
            onPress={() => router.setParams({ item: s.id } as never)} />
        </MotionItem>
      ))}</MotionList>
      {open ? <PantryTray key={open.id} stock={open} usedIn={usedIn(open.ingredient_key ?? '')} onRemove={onRemove} /> : null}
    </View>
  );
}

function PantryTray({ stock, usedIn, onRemove }: { stock: Stock; usedIn: number; onRemove: (key: string) => void }) {
  const update = useUpdateStock();
  const close = () => router.setParams({ item: undefined } as never);
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) close(); }} testID="fm-pantry-tray"
      title={tr('fm.pantry.trayTitle')} hero={nameOf(stock)}
      lines={[tr('fm.pantry.notedOn', { date: longDate(noted(stock)) }), qtyText(stock) ?? tr('fm.pantry.noQty'), stock.notes ? tr('fm.note', { note: stock.notes }) : null, tr('fm.pantry.usedIn', { count: usedIn })]}
      editTitle={tr('fm.pantry.fixTitle')}
      fields={[
        { key: 'qty', label: tr('fm.pantry.qtyLabel'), kind: 'number', step: 1, hint: tr('fm.pantry.qtyHint') },
        { key: 'note', label: tr('fm.noteLabel'), kind: 'multiline', maxLength: 500 },
      ]}
      initial={{ qty: stock.qty_estimate == null ? '' : String(Number(stock.qty_estimate)), note: stock.notes ?? '' }}
      validate={(d) => (stockPatch(stock, { qty: d.qty ?? '', note: d.note ?? '' }).ok ? null : tr('fm.pantry.badQty'))}
      onSave={async (d) => {
        const res = stockPatch(stock, { qty: d.qty ?? '', note: d.note ?? '' });
        if (!res.ok) return tr('fm.pantry.badQty');
        if (!Object.keys(res.patch).length) return 'ok';
        try {
          await update.mutateAsync({ id: stock.id, version: stock.version, patch: res.patch });
          return 'ok';
        } catch (e) { return friendlyError(e); }
      }}
      deleteLabel={tr('fm.pantry.remove')}
      onDelete={stock.ingredient_key ? () => { close(); onRemove(stock.ingredient_key!); } : undefined} />
  );
}
