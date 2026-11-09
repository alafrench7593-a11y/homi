/** Carte d'un produit du catalogue : photo de la base collaborative (avec crédit), marque, nom, critères, meilleur prix daté. */
import React from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { haptic, Icon, Row, Text } from '@/components/ui';
import type { KidProduct, ProductPrice } from '@/lib/data/hooks-products';
import type { CriteriaResult } from '@/lib/domain/productCriteria';
import { formatDate, getLocale, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

/** Prix en euros selon la langue : « 12,50 € » (fr, es, de, it), « €12.50 » (en). Sans Intl (Hermes). */
export const euro = (v: number) => (getLocale() === 'en' ? `€${v.toFixed(2)}` : `${v.toFixed(2).replace('.', ',')} €`);

export function ProductCard({ p, c, price, selected, onSelect }: { p: KidProduct; c: CriteriaResult | undefined; price: ProductPrice | null; selected?: boolean; onSelect?: () => void }) {
  const t = useTheme();
  return (
    <Tappable testID={`product-${p.barcode}`} accessibilityRole="button" accessibilityLabel={`${p.brand ?? ''} ${p.name}`} onPress={() => { haptic('selection'); router.push(`/products/${p.id}`); }}
      style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, padding: spacing.xs, borderRadius: radius.lg, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: selected ? t.colors.primary : t.colors.border })}>
      <View style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        {p.image_url ? <Image source={{ uri: p.image_url }} style={{ width: 76, height: 76 }} resizeMode="contain" accessibilityLabel={tr('pr.photoA11y', { name: p.name })} /> : <Icon name="package" color={t.colors.textMuted} />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" muted>{p.brand ?? tr('pr.noBrand')} · {tr(`pr.cat.${p.category}` as TKey)}</Text>
        <Text weight="bold">{p.name}</Text>
        <Row gap={6} wrap>
          {c?.score != null ? <Text variant="caption" weight="bold" testID={`product-score-${p.barcode}`}>{tr('pr.criteriaBadge', { n: c.score })}</Text> : <Text variant="caption" muted>{tr('pr.noScore')}</Text>}
          {price ? <Text variant="caption" color={t.colors.primary}>{tr('pr.priceFrom', { price: euro(Number(price.price)), date: formatDate(`${price.observed_on}T12:00:00`) })}</Text> : <Text variant="caption" muted>{tr('pr.noPrice')}</Text>}
        </Row>
        {p.is_demo ? <Text variant="caption" color={t.colors.danger}>{tr('pr.demoProduct')}</Text> : null}
      </View>
      {onSelect ? (
        <Tappable accessibilityRole="checkbox" accessibilityState={{ checked: !!selected }} accessibilityLabel={tr('pr.compareSelect')} onPress={onSelect} hitSlop={8} style={{ justifyContent: 'center' }} testID={`compare-${p.barcode}`}>
          <Icon name={selected ? 'check-square' : 'square'} color={selected ? t.colors.primary : t.colors.textMuted} />
        </Tappable>
      ) : null}
    </Tappable>
  );
}
