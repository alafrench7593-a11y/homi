/**
 * Liste de courses du foyer (partagée, temps réel, hors ligne) : ajout rapide, détails facultatifs (quantité, marque,
 * taille, catégorie, responsable), doublons signalés avant l'ajout et fusion des doublons déjà présents, rayons,
 * « déjà à la maison », historique des achats. Cocher un article lié à une mission la termine seulement si c'est son
 * destinataire qui coche (serveur) ; un article lié à un stock passe « à valider » — la quantité du stock ne change
 * qu'après validation explicite (écran Stocks).
 */
import React, { useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { Cascade } from '@/motion';
import { CategoryChips, formatStockQty } from '@/features/stocks/StockCard';
import { useAddShoppingItem, useCreateShoppingList, useLatestShoppingList, useShoppingHistory, useToggleShoppingItem, useUpdateShoppingItem, type ShoppingItem } from '@/lib/data/hooks-recipes';
import { useHouseholdMembers } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useMissions } from '@/lib/data/hooks-missions';
import { useMergeShoppingItems } from '@/lib/data/hooks-stocks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AISLE_ORDER, formatQty } from '@/lib/recipes/engine';
import type { Unit } from '@/lib/recipes/types';
import { duplicateGroups, findDuplicate, mergedQty, STOCK_CATEGORIES, STOCK_UNITS, type StockCategory, type StockUnit } from '@/lib/domain/stocks';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const RECIPE_UNITS = ['g', 'ml', 'u', 'cs', 'cc', 'pincee'];
const qtyText = (i: ShoppingItem) => (i.qty == null ? '' : i.unit && !RECIPE_UNITS.includes(i.unit) ? formatStockQty(i.qty, i.unit) : formatQty(Number(i.qty), (i.unit ?? null) as Unit | null));

export default function Shopping() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ add?: string }>();
  const { list, items, loading } = useLatestShoppingList();
  const toggle = useToggleShoppingItem();
  const add = useAddShoppingItem();
  const update = useUpdateShoppingItem();
  const merge = useMergeShoppingItems();
  const create = useCreateShoppingList();
  const history = useShoppingHistory(list?.id);
  const { data: members } = useHouseholdMembers();
  const { labelOf, people, me } = usePeople();
  const { all: missions } = useMissions();
  const input = useRef<TextInput>(null);
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState(false);
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<StockUnit | null>(null);
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [category, setCategory] = useState<StockCategory | null>(null);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [dup, setDup] = useState<ShoppingItem | null>(null);
  const missionOf = useMemo(() => new Map(missions.filter((m) => m.shopping_item_id).map((m) => [m.shopping_item_id as string, m])), [missions]);

  if (loading && !list) return <Screen back title={tr('rc.shopping.open')}><Skeleton rows={5} /></Screen>;
  if (!list) {
    return (
      <Screen back title={tr('rc.shopping.open')}>
        <EmptyState icon="shopping-cart" title={tr('rc.shopping.none')} body={tr('shp.noneBody')}
          action={{ label: tr('shp.start'), onPress: () => create.mutateAsync({ title: tr('shp.defaultTitle'), planId: null, lines: [] }).catch((e) => toast(friendlyError(e), 'error')) }} />
        <Button label={tr('rc.menu.open')} icon="book-open" variant="ghost" onPress={() => router.replace('/meals/menu')} />
      </Screen>
    );
  }
  const toBuy = items.filter((i) => !i.at_home);
  const home = items.filter((i) => i.at_home);
  const left = toBuy.filter((i) => !i.checked).length;
  const groups = duplicateGroups(toBuy);
  const byCategory = toBuy.filter((i) => i.category && !i.ingredient_key);
  const byAisle = toBuy.filter((i) => !(i.category && !i.ingredient_key));
  const aisles = AISLE_ORDER.filter((a) => byAisle.some((i) => i.aisle === a)).concat(byAisle.some((i) => !AISLE_ORDER.includes(i.aisle as never)) ? ['epicerie'] : []);

  function reset() { setLabel(''); setQty(''); setUnit(null); setBrand(''); setSize(''); setCategory(null); setAssignee(null); setDup(null); }
  async function addItem(force = false) {
    if (!list || !label.trim()) return;
    const existing = findDuplicate(items, { label: label.trim(), size: size.trim() || null });
    if (existing && !force) { setDup(existing); haptic('warning'); return; }
    const n = qty.trim() ? Number(qty.replace(',', '.')) : null;
    try {
      await add.mutateAsync({ listId: list.id, householdId: list.household_id, label: label.trim(), position: items.length,
        qty: n != null && Number.isFinite(n) && n > 0 ? n : null, unit, brand: brand.trim() || null, size: size.trim() || null, category, assignee_id: assignee });
      haptic('light'); reset();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function addToExisting(existing: ShoppingItem) {
    const raw = qty.trim() ? Number(qty.replace(',', '.')) : 1;
    const n = Number.isFinite(raw) && raw > 0 ? raw : 1;
    try {
      // Article existant sans quantité = 1 ; on additionne (même unité que l'existant)
      await update.mutateAsync({ id: existing.id, version: existing.version ?? 1, patch: { qty: mergedQty({ qty: existing.qty ?? 1, unit: existing.unit }, { qty: n, unit: existing.unit }) } });
      haptic('success'); toast(tr('shp.dup.merged', { label: existing.label })); reset();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const row = (i: ShoppingItem) => {
    const m = missionOf.get(i.id);
    const sub = [i.brand, i.size, qtyText(i), i.assignee_id ? (i.assignee_id === me ? tr('shp.byYou') : tr('shp.by', { person: labelOf(i.assignee_id) })) : null].filter(Boolean).join(' · ');
    return (
      <Tappable key={i.id} testID={`shop-${i.ingredient_key ?? i.label}`} accessibilityRole="checkbox" accessibilityState={{ checked: i.checked }} accessibilityLabel={`${i.label} ${sub}`}
        onPress={() => { haptic('selection'); toggle.mutate({ id: i.id, checked: !i.checked }, { onError: (e) => toast(friendlyError(e), 'error') }); }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: i.checked ? t.colors.gold : t.colors.textMuted, backgroundColor: i.checked ? t.colors.gold : 'transparent' }}>{i.checked ? <Icon name="check" size={16} color="#FFFFFF" /> : null}</View>
        <View style={{ flex: 1 }}>
          <Text style={{ textDecorationLine: i.checked ? 'line-through' : 'none' }} muted={i.checked}>{i.label.charAt(0).toUpperCase() + i.label.slice(1)}</Text>
          {sub ? <Text variant="caption" muted>{sub}</Text> : null}
        </View>
        {m ? <Icon name="send" size={14} color={t.colors.primary} /> : null}
        {i.stock_id ? <Icon name="package" size={14} color={t.colors.primary} /> : null}
      </Tappable>
    );
  };

  return (
    <Screen back title={list.title} subtitle={tr('rc.shopping.left', { count: left })}>
      <TodaySummary title={tr('rc.shopping.open')} items={[
        { icon: 'shopping-cart', value: String(left), label: tr('mb.rc.toBuy') },
        { icon: 'check-square', value: String(toBuy.length - left), label: tr('mb.rc.inCart') },
        { icon: 'home', value: String(home.length), label: tr('mb.rc.atHome') },
      ]} />
      {toBuy.length ? (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.border, overflow: 'hidden' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: toBuy.length, now: toBuy.length - left }} testID="shop-progress">
          <View style={{ width: `${((toBuy.length - left) / toBuy.length) * 100}%`, height: 8, borderRadius: 4, backgroundColor: t.colors.gold }} />
        </View>
      ) : null}

      <Card style={{ gap: spacing.sm }} testID="shop-quick-add">
        <Field ref={input} label={tr('rc.shopping.addItem')} value={label} onChangeText={(v) => { setLabel(v); setDup(null); }} maxLength={120} testID="shop-add-label"
          autoFocus={params.add === '1'} onSubmitEditing={() => void addItem()} returnKeyType="done" />
        <Row>
          <View style={{ flex: 1 }}><Button label={tr('rc.shopping.add')} icon="plus" onPress={() => void addItem()} loading={add.isPending} testID="shop-add" /></View>
          <Button label={tr(details ? 'shp.lessDetails' : 'shp.moreDetails')} icon={details ? 'chevron-up' : 'sliders'} variant="ghost" onPress={() => setDetails(!details)} testID="shop-details" />
        </Row>
        {details ? (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}><Field label={tr('shp.qty')} optional value={qty} onChangeText={setQty} keyboardType="decimal-pad" testID="shop-qty" /></View>
              <View style={{ flex: 1 }}><Field label={tr('stk.form.size')} optional value={size} onChangeText={setSize} maxLength={40} placeholder={tr('stk.form.sizePh')} testID="shop-size" /></View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {STOCK_UNITS.filter((u) => !['g', 'ml'].includes(u)).map((u) => <Chip key={u} label={tr(`stk.un.${u}` as TKey)} selected={unit === u} onPress={() => setUnit(unit === u ? null : u)} />)}
            </View>
            <Field label={tr('stk.form.brand')} optional value={brand} onChangeText={setBrand} maxLength={60} testID="shop-brand" />
            <Text variant="label">{tr('stk.form.category')}</Text>
            <CategoryChips value={category} onChange={setCategory} testPrefix="shop-cat" />
            {people.length > 1 ? (
              <>
                <Text variant="label">{tr('shp.assignee')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <Chip label={tr('stk.form.nobody')} selected={!assignee} onPress={() => setAssignee(null)} />
                  {people.map((p) => <Chip key={p.id} label={p.label} selected={assignee === p.id} onPress={() => setAssignee(p.id)} />)}
                </View>
              </>
            ) : null}
            <Text variant="caption" muted>{tr('shp.photoSoon')}</Text>
          </View>
        ) : null}
      </Card>

      {dup ? (
        <Banner tone="info" icon="copy" title={tr('shp.dup.title', { label: dup.label })}
          action={<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <Button label={tr('shp.dup.merge')} size="sm" icon="plus-circle" onPress={() => void addToExisting(dup)} testID="shop-dup-merge" />
            <Button label={tr('shp.dup.anyway')} size="sm" variant="ghost" onPress={() => void addItem(true)} testID="shop-dup-anyway" />
          </View>}>
          <Text variant="small">{tr('shp.dup.body')}</Text>
        </Banner>
      ) : null}
      {groups.map((g) => (
        <Banner key={g[0].id} tone="info" icon="layers" title={tr('shp.dupes.title', { label: g[0].label, count: g.length })}
          action={<Button label={tr('shp.dupes.merge')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} testID={`shop-merge-${g[0].id}`}
            onPress={async () => { try { for (const d of g.slice(1)) await merge.mutateAsync({ keep: g[0].id, drop: d.id }); toast(tr('shp.dup.merged', { label: g[0].label })); } catch (e) { toast(friendlyError(e), 'error'); } }} />}>
          <Text variant="small">{tr('shp.dupes.body')}</Text>
        </Banner>
      ))}

      {(members?.length ?? 0) > 1 ? <Text variant="small" muted testID="shopping-shared">{tr('rc.shopping.shared')}</Text> : <Text variant="small" muted>{tr('rc.shopping.shareHint')}</Text>}
      <Text variant="caption" muted>{tr('shp.linkNote')}</Text>
      {STOCK_CATEGORIES.filter((c) => byCategory.some((i) => i.category === c.key)).map((c, n) => (
        <Cascade key={c.key} index={n} style={{ gap: 2 }}>
          <SectionTitle title={tr(c.label)} />
          <Card>{byCategory.filter((i) => i.category === c.key).map(row)}</Card>
        </Cascade>
      ))}
      {aisles.map((a, n) => (
        <Cascade key={a} index={n + 1} style={{ gap: 2 }}>
          <SectionTitle title={tr(`rc.aisle.${a}` as TKey)} />
          <Card>{byAisle.filter((i) => i.aisle === a || (a === 'epicerie' && !AISLE_ORDER.includes(i.aisle as never))).map(row)}</Card>
        </Cascade>
      ))}
      {home.length ? <><SectionTitle title={tr('rc.shopping.atHome')} /><Card>{home.map(row)}</Card></> : null}

      {(history.data ?? []).length ? (
        <View style={{ gap: spacing.xs }} testID="shop-history">
          <SectionTitle title={tr('shp.history')} subtitle={tr('shp.historySub')} />
          <Card>
            {(history.data ?? []).slice(0, 10).map((i) => (
              <View key={`h-${i.id}`} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 36 }}>
                <Icon name="check" size={14} color={t.colors.success} />
                <Text variant="small" style={{ flex: 1 }}>{i.label}</Text>
                <Text variant="caption" muted>{i.checked_at ? tr('shp.boughtBy', { person: labelOf(i.checked_by), when: formatDate(i.checked_at, { day: 'numeric', month: 'short' }) }) : labelOf(i.checked_by)}</Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}
      <Button label={tr('stk.title')} icon="package" variant="secondary" onPress={() => router.push('/family/stocks' as never)} testID="shop-open-stocks" />
    </Screen>
  );
}
