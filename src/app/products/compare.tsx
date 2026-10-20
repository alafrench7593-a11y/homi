/** Comparateur : 2 ou 3 produits du catalogue côte à côte (critères, composition, âge du fabricant, prix le plus bas daté). */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Card, Chip, Row, Text } from '@/components/ui';
import { euro } from '@/features/products/ProductCard';
import { bestPrice, useKidProducts, useProductPrices } from '@/lib/data/hooks-products';
import { productCriteria } from '@/lib/domain/productCriteria';
import { unitPrice } from '../../../supabase/functions/_shared/open-prices';
import { useLocalSearchParams } from 'expo-router';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function Compare() {
  const params = useLocalSearchParams<{ ids?: string }>();
  const products = useKidProducts();
  const prices = useProductPrices();
  const [ids, setIds] = useState<string[]>(typeof params.ids === 'string' ? params.ids.split(',').filter(Boolean).slice(0, 3) : []);
  const chosen = ids.map((id) => products.data.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const others = products.data.filter((p) => !ids.includes(p.id) && (!chosen[0] || p.category === chosen[0].category));
  const rows: { key: string; label: string; cell: (p: (typeof chosen)[number]) => string }[] = [
    { key: 'brand', label: tr('pr.cmp.brand'), cell: (p) => p.brand ?? '—' },
    { key: 'age', label: tr('pr.cmp.age'), cell: (p) => p.maker_age_label ?? tr('pr.cmp.unknown') },
    { key: 'qty', label: tr('pr.cmp.quantity'), cell: (p) => p.quantity_label ?? '—' },
    { key: 'score', label: tr('pr.cmp.score'), cell: (p) => { const s = productCriteria(p).score; return s == null ? tr('pr.cmp.unknown') : `${s}/100`; } },
    { key: 'perfume', label: tr('pr.crit.perfume'), cell: (p) => (!p.composition ? '?' : productCriteria(p).flags.perfume ? tr('pr.cmp.no') : tr('pr.cmp.yes')) },
    { key: 'eo', label: tr('pr.crit.essential_oils'), cell: (p) => (!p.composition ? '?' : productCriteria(p).flags.essentialOils.length ? tr('pr.cmp.no') : tr('pr.cmp.yes')) },
    { key: 'phenoxy', label: tr('pr.crit.phenoxyethanol'), cell: (p) => (!p.composition ? '?' : productCriteria(p).flags.phenoxyethanol ? tr('pr.cmp.no') : tr('pr.cmp.yes')) },
    { key: 'price', label: tr('pr.cmp.price'), cell: (p) => { const b = bestPrice(prices.data ?? [], p.id); return b ? `${euro(Number(b.price))} (${formatDate(`${b.observed_on}T12:00:00`)}, ${b.store_name})` : tr('pr.noPrice'); } },
    { key: 'unit', label: tr('pr.cmp.unitPrice'), cell: (p) => { const b = bestPrice(prices.data ?? [], p.id); const u = b ? unitPrice(Number(b.price), { value: p.quantity_value == null ? null : Number(p.quantity_value), unit: p.quantity_unit }) : null; return u ? tr(`pr.unitPrice.${u.per}` as TKey, { price: euro(u.value) }) : '—'; } },
  ];
  return (
    <Screen back title={tr('pr.compareTitle')}>
      {chosen.length < 2 ? <EmptyState icon="columns" title={tr('pr.comparePickMore')} /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View testID="compare-table" style={{ gap: spacing.xs }}>
            <Row>
              <View style={{ width: 120 }} />
              {chosen.map((p) => <View key={p.id} style={{ width: 170 }}><Text weight="bold">{p.name}</Text><Chip label={tr('pr.cmp.remove')} onPress={() => setIds(ids.filter((x) => x !== p.id))} /></View>)}
            </Row>
            {rows.map((r) => (
              <Row key={r.key} style={{ alignItems: 'flex-start' }}>
                <Text variant="small" weight="bold" style={{ width: 120 }}>{r.label}</Text>
                {chosen.map((p) => <Text key={p.id} variant="small" style={{ width: 170 }}>{r.cell(p)}</Text>)}
              </Row>
            ))}
          </View>
        </ScrollView>
      )}
      {chosen.length < 3 && others.length ? (
        <Card>
          <Text variant="small" weight="bold">{tr('pr.cmp.add')}</Text>
          <Row wrap>{others.slice(0, 12).map((p) => <Chip key={p.id} label={p.name} onPress={() => setIds([...ids, p.id])} />)}</Row>
        </Card>
      ) : null}
      <Text variant="caption" muted>{tr('pr.footer')}</Text>
    </Screen>
  );
}
