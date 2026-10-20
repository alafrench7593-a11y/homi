/** Liste de courses du foyer (partagée avec le coparent) : rangée par rayon, produits à cocher, « déjà à la maison ». */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Card, Field, haptic, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { useAddShoppingItem, useLatestShoppingList, useToggleShoppingItem } from '@/lib/data/hooks-recipes';
import { useHouseholdMembers } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AISLE_ORDER, formatQty } from '@/lib/recipes/engine';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export default function Shopping() {
  const t = useTheme();
  const toast = useToast();
  const { list, items, loading } = useLatestShoppingList();
  const toggle = useToggleShoppingItem();
  const add = useAddShoppingItem();
  const { data: members } = useHouseholdMembers();
  const [label, setLabel] = useState('');
  if (loading && !list) return <Screen back title={tr('rc.shopping.open')}><Skeleton rows={5} /></Screen>;
  if (!list) return <Screen back title={tr('rc.shopping.open')}><EmptyState icon="shopping-cart" title={tr('rc.shopping.none')} body={tr('rc.shopping.noneBody')} action={{ label: tr('rc.menu.open'), onPress: () => router.replace('/meals/menu') }} /></Screen>;
  const toBuy = items.filter((i) => !i.at_home);
  const home = items.filter((i) => i.at_home);
  const left = toBuy.filter((i) => !i.checked).length;
  const aisles = AISLE_ORDER.filter((a) => toBuy.some((i) => i.aisle === a)).concat(toBuy.some((i) => !AISLE_ORDER.includes(i.aisle as never)) ? ['epicerie'] : []);
  const row = (i: typeof items[number]) => (
    <Tappable key={i.id} testID={`shop-${i.ingredient_key ?? i.label}`} accessibilityRole="checkbox" accessibilityState={{ checked: i.checked }} accessibilityLabel={`${i.label} ${formatQty(i.qty, i.unit)}`}
      onPress={() => { haptic('selection'); toggle.mutate({ id: i.id, checked: !i.checked }, { onError: (e) => toast(friendlyError(e), 'error') }); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
      <Icon name={i.checked ? 'check-square' : 'square'} color={i.checked ? t.colors.primary : t.colors.textMuted} />
      <Text style={{ flex: 1, textDecorationLine: i.checked ? 'line-through' : 'none' }} muted={i.checked}>{i.label.charAt(0).toUpperCase() + i.label.slice(1)}</Text>
      <Text variant="small" muted>{formatQty(i.qty == null ? null : Number(i.qty), i.unit)}</Text>
    </Tappable>
  );
  return (
    <Screen back title={list.title} subtitle={tr('rc.shopping.left', { count: left })}>
      {(members?.length ?? 0) > 1 ? <Text variant="small" muted testID="shopping-shared">{tr('rc.shopping.shared')}</Text> : <Text variant="small" muted>{tr('rc.shopping.shareHint')}</Text>}
      {aisles.map((a) => (
        <View key={a} style={{ gap: 2 }}>
          <SectionTitle title={tr(`rc.aisle.${a}` as TKey)} />
          <Card>{toBuy.filter((i) => i.aisle === a || (a === 'epicerie' && !AISLE_ORDER.includes(i.aisle as never))).map(row)}</Card>
        </View>
      ))}
      {home.length ? <><SectionTitle title={tr('rc.shopping.atHome')} /><Card>{home.map(row)}</Card></> : null}
      <Row>
        <View style={{ flex: 1 }}><Field label={tr('rc.shopping.addItem')} value={label} onChangeText={setLabel} maxLength={120} testID="shop-add-label" /></View>
      </Row>
      <Button label={tr('rc.shopping.add')} icon="plus" variant="secondary" onPress={async () => {
        if (!label.trim()) return;
        try { await add.mutateAsync({ listId: list.id, householdId: list.household_id, label: label.trim(), position: items.length }); setLabel(''); } catch (e) { toast(friendlyError(e), 'error'); }
      }} />
    </Screen>
  );
}
