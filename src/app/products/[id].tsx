/**
 * Fiche produit : photo (crédit de la base collaborative), marque, nom, contenance, composition disponible, âge indiqué par
 * le fabricant, atouts et précautions (rédaction de l'équipe, jamais d'allégation de soin), critères objectifs expliqués,
 * prix relevés et datés (magasin, ville, prix au kilo ou au litre, lien vers le vendeur quand il est connu, preuve).
 * Un cosmétique n'est jamais présenté comme un traitement ; en cas de rougeur, d'eczéma ou de lésion, on renvoie au médecin.
 */
import React from 'react';
import { Image, Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { euro } from '@/features/products/ProductCard';
import { useKidProducts, useProductPrices } from '@/lib/data/hooks-products';
import { useMyRoles } from '@/lib/data/hooks-settings';
import { productCriteria, PRODUCT_CRITERIA_SOURCES } from '@/lib/domain/productCriteria';
import { unitPrice } from '../../../supabase/functions/_shared/open-prices';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export default function ProductDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isEditor } = useMyRoles();
  const products = useKidProducts({ includeDrafts: isEditor });
  const prices = useProductPrices();
  const p = products.data.find((x) => x.id === id);
  if (products.isLoading && !p) return <Screen back title={tr('pr.title')}><Skeleton kind="detail" rows={5} /></Screen>;
  if (!p) return <Screen back title={tr('pr.title')}><EmptyState icon="package" title={tr('pr.notFound')} /></Screen>;
  const c = productCriteria(p);
  const mine = (prices.data ?? []).filter((x) => x.product_id === p.id);
  const open = (url: string) => void Linking.openURL(url);
  const cosmetic = p.category !== 'food' && p.category !== 'accessory';

  return (
    <Screen back title={p.name} subtitle={p.brand ?? undefined}>
      {p.is_demo ? <Banner tone="danger">{tr('pr.demoProduct')}</Banner> : null}
      {p.status !== 'published' ? <Banner tone="warning">{tr(`pr.status.${p.status}` as TKey)}</Banner> : null}
      <View style={{ alignItems: 'center', gap: 4 }}>
        {p.image_url ? <Image source={{ uri: p.image_url }} style={{ width: 220, height: 220 }} resizeMode="contain" accessibilityLabel={tr('pr.photoA11y', { name: p.name })} /> : <Icon name="package" size={64} color={t.colors.textMuted} />}
        <Text variant="caption" muted testID="product-photo-credit">{p.image_url ? (p.image_credit ?? tr('pr.photoCredit')) : tr('pr.noPhoto')}</Text>
      </View>
      <Card>
        <Text variant="small">{tr(`pr.cat.${p.category}` as TKey)}{p.quantity_label ? ` · ${p.quantity_label}` : ''}</Text>
        <Text variant="small" testID="product-age">{p.maker_age_label ? tr('pr.makerAge', { age: p.maker_age_label }) : tr('pr.makerAgeUnknown')}</Text>
        <Text variant="caption" muted>{tr('pr.barcode', { code: p.barcode })}</Text>
      </Card>

      {c.score != null ? (
        <Card>
          <View testID="product-criteria">
            <Row style={{ justifyContent: 'space-between' }}>
              <Text weight="bold">{tr('pr.criteriaTitle')}</Text>
              <Text weight="bold">{c.score}/100</Text>
            </Row>
            {c.criteria.map((x) => (
              <Row key={x.key} style={{ justifyContent: 'space-between', marginTop: 4 }}>
                <Text variant="small" style={{ flex: 1 }}>{x.ok === null ? '?' : x.ok ? '✓' : '✗'} {tr(`pr.crit.${x.key}` as TKey)}</Text>
                <Text variant="small" muted>{x.points}/{x.max}</Text>
              </Row>
            ))}
            <Text variant="caption" muted style={{ marginTop: 4 }}>{tr(cosmetic ? 'pr.criteriaMethodCosmetic' : 'pr.criteriaMethodFood')}</Text>
          </View>
        </Card>
      ) : <Text variant="small" muted>{p.category === 'accessory' ? tr('pr.noScoreAccessory') : tr('pr.noScoreUnknown')}</Text>}

      {p.benefits.length ? <Card><Text weight="bold">{tr('pr.benefits')}</Text>{p.benefits.map((b) => <Text key={b} variant="small" style={{ marginTop: 2 }}>• {b}</Text>)}</Card> : null}
      <View testID="product-precautions">
        <Banner tone="warning" title={tr('pr.precautions')}>
          {[...p.precautions, ...(c.flags.perfume ? [tr('pr.flag.perfume')] : []), ...(c.flags.essentialOils.length ? [tr('pr.flag.eo', { list: c.flags.essentialOils.join(', ') })] : []),
            ...(c.flags.allergens.length ? [tr('pr.flag.allergens', { list: c.flags.allergens.join(', ') })] : []), ...(c.flags.phenoxyethanol ? [tr('pr.flag.phenoxy')] : []),
            ...(cosmetic ? [tr('pr.flag.notTreatment')] : [])].map((x) => `• ${x}`).join('\n') || tr('pr.noPrecaution')}
        </Banner>
      </View>

      <SectionTitle title={tr('pr.composition')} />
      <Text variant="small" testID="product-composition">{p.composition ?? tr('pr.compositionUnknown')}</Text>
      {p.source_url ? (
        <Tappable accessibilityRole="link" onPress={() => open(p.source_url!)} style={{ minHeight: 36, justifyContent: 'center' }}>
          <Text variant="caption" color={t.colors.primary}>{tr(`pr.src.${p.data_source}` as TKey)}{p.data_retrieved_at ? ` · ${tr('pr.retrieved', { date: formatDate(p.data_retrieved_at) })}` : ''}</Text>
        </Tappable>
      ) : null}

      <SectionTitle title={tr('pr.prices')} />
      <View testID="product-prices" style={{ gap: spacing.xs }}>
        {!mine.length ? <Text variant="small" muted>{tr('pr.pricesNone')}</Text> : mine.map((x) => {
          const up = unitPrice(Number(x.price), { value: p.quantity_value == null ? null : Number(p.quantity_value), unit: p.quantity_unit });
          return (
            <Card key={x.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text weight="bold">{euro(Number(x.price))}</Text>
                <Text variant="caption" muted>{tr('pr.observed', { date: formatDate(`${x.observed_on}T12:00:00`) })}</Text>
              </Row>
              <Text variant="small">{x.store_name}{x.store_city ? ` · ${x.store_city}` : ''} · {tr(`pr.store.${x.store_kind}` as TKey)}</Text>
              {up ? <Text variant="caption" muted>{tr(`pr.unitPrice.${up.per}` as TKey, { price: euro(up.value) })}</Text> : null}
              <Row wrap>
                {x.product_url ? <Button label={tr('pr.buy')} icon="external-link" size="sm" variant="secondary" onPress={() => open(x.product_url!)} /> : null}
                {x.source_url ? <Button label={tr(`pr.priceSrc.${x.source}` as TKey)} size="sm" variant="ghost" onPress={() => open(x.source_url!)} /> : <Text variant="caption" muted>{tr(`pr.priceSrc.${x.source}` as TKey)}</Text>}
              </Row>
            </Card>
          );
        })}
        <Text variant="caption" muted>{tr('pr.pricesNote')}</Text>
      </View>
      <Button label={tr('pr.compareWith')} icon="columns" variant="ghost" onPress={() => router.push({ pathname: '/products/compare', params: { ids: p.id } })} />
      <SectionTitle title={tr('pr.sources')} />
      {PRODUCT_CRITERIA_SOURCES.map((s) => (
        <Tappable key={s.url} accessibilityRole="link" onPress={() => open(s.url)} style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text variant="caption" color={t.colors.primary}>{s.label}</Text>
        </Tappable>
      ))}
      <Text variant="caption" muted>{p.reviewed_by_label ? tr('pr.reviewedBy', { name: p.reviewed_by_label }) : tr('pr.notReviewed')}</Text>
    </Screen>
  );
}
