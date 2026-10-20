/**
 * Produits pour enfants (naissance à 10 ans) : catalogue de produits réels ajoutés par l'équipe à partir des bases
 * collaboratives Open Food Facts / Open Beauty Facts / Open Products Facts, avec photo créditée, composition, âge indiqué
 * par le fabricant, critères objectifs expliqués, prix relevés et datés. Filtres : catégorie, âge, budget, composition,
 * marque ; comparateur ; classement par critères. Aucun produit ni prix n'est inventé.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Chip, Field, Row, Text } from '@/components/ui';
import { ProductCard } from '@/features/products/ProductCard';
import { bestPrice, useKidProducts, useProductCriteria, useProductPrices } from '@/lib/data/hooks-products';
import { useMyRoles } from '@/lib/data/hooks-settings';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/domain/productCriteria';
import { fold } from '@/lib/recipes/validate';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

type AgeFilter = 'm0_6' | 'm6_12' | 'y1_3' | 'y3_10';
const AGE: Record<AgeFilter, number> = { m0_6: 0, m6_12: 6, y1_3: 12, y3_10: 36 };
type Comp = 'no_perfume' | 'no_eo' | 'no_allergens' | 'no_phenoxy';

export default function Products() {
  const { isEditor } = useMyRoles();
  const products = useKidProducts();
  const prices = useProductPrices();
  const crit = useProductCriteria(products.data);
  const [cat, setCat] = useState<ProductCategory | null>(null);
  const [age, setAge] = useState<AgeFilter | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [comp, setComp] = useState<Comp[]>([]);
  const [brand, setBrand] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'criteria' | 'price' | 'name'>('criteria');
  const [picked, setPicked] = useState<string[]>([]);

  const brands = useMemo(() => [...new Set(products.data.map((p) => p.brand).filter((b): b is string => !!b))].sort(), [products.data]);
  const list = useMemo(() => {
    const out = products.data.filter((p) => {
      const c = crit.get(p.id);
      const price = bestPrice(prices.data ?? [], p.id);
      if (cat && p.category !== cat) return false;
      // Âge indiqué par le fabricant : un produit « dès 3 ans » n'est pas proposé pour un bébé
      if (age && p.maker_min_months != null && p.maker_min_months > AGE[age]) return false;
      if (maxPrice && (!price || Number(price.price) > maxPrice)) return false;
      if (brand && p.brand !== brand) return false;
      if (comp.includes('no_perfume') && (c?.flags.perfume !== false || !p.composition)) return false;
      if (comp.includes('no_eo') && (c?.flags.essentialOils.length !== 0 || !p.composition)) return false;
      if (comp.includes('no_allergens') && (c?.flags.allergens.length !== 0 || !p.composition)) return false;
      if (comp.includes('no_phenoxy') && (c?.flags.phenoxyethanol !== false || !p.composition)) return false;
      if (q && !fold(`${p.brand ?? ''} ${p.name} ${p.composition ?? ''}`).includes(fold(q))) return false;
      return true;
    });
    const price = (id: string) => Number(bestPrice(prices.data ?? [], id)?.price ?? Infinity);
    return out.sort((a, b) => sort === 'price' ? price(a.id) - price(b.id) : sort === 'name' ? a.name.localeCompare(b.name, 'fr') : (crit.get(b.id)?.score ?? -1) - (crit.get(a.id)?.score ?? -1));
  }, [products.data, prices.data, crit, cat, age, maxPrice, brand, comp, q, sort]);

  const togglePick = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : picked.length >= 3 ? [...picked.slice(1), id] : [...picked, id]);

  return (
    <Screen back title={tr('pr.title')} subtitle={tr('pr.subtitle')}>
      <Banner tone="info">{tr('pr.intro')}</Banner>
      {isEditor ? <Button label={tr('pr.admin.open')} icon="plus" variant="secondary" onPress={() => router.push('/admin/products')} testID="products-admin" /> : null}
      <Field label={tr('pr.search')} value={q} onChangeText={setQ} autoCorrect={false} testID="products-search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        <Chip label={tr('pr.all')} selected={!cat} onPress={() => setCat(null)} />
        {PRODUCT_CATEGORIES.map((c) => <Chip key={c} label={tr(`pr.cat.${c}` as TKey)} selected={cat === c} onPress={() => setCat(cat === c ? null : c)} />)}
      </ScrollView>
      <Row wrap>{(Object.keys(AGE) as AgeFilter[]).map((a) => <Chip key={a} tone="lavender" label={tr(`pr.age.${a}` as TKey)} selected={age === a} onPress={() => setAge(age === a ? null : a)} />)}</Row>
      <Row wrap>
        {[5, 10, 20].map((m) => <Chip key={m} label={tr('pr.maxPrice', { m })} selected={maxPrice === m} onPress={() => setMaxPrice(maxPrice === m ? null : m)} />)}
        {(['no_perfume', 'no_eo', 'no_allergens', 'no_phenoxy'] as Comp[]).map((k) => <Chip key={k} label={tr(`pr.comp.${k}` as TKey)} selected={comp.includes(k)} onPress={() => setComp(comp.includes(k) ? comp.filter((x) => x !== k) : [...comp, k])} />)}
      </Row>
      {brands.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>{brands.map((b) => <Chip key={b} label={b} selected={brand === b} onPress={() => setBrand(brand === b ? null : b)} />)}</ScrollView> : null}
      <Row wrap>
        <Text variant="small" muted>{tr('pr.sort')}</Text>
        {(['criteria', 'price', 'name'] as const).map((s) => <Chip key={s} label={tr(`pr.sort.${s}` as TKey)} selected={sort === s} onPress={() => setSort(s)} />)}
      </Row>
      {picked.length >= 2 ? <Button label={tr('pr.compare', { count: picked.length })} icon="columns" onPress={() => router.push({ pathname: '/products/compare', params: { ids: picked.join(',') } })} testID="products-compare" /> : picked.length === 1 ? <Text variant="caption" muted>{tr('pr.comparePickMore')}</Text> : null}
      <Text variant="small" muted testID="products-count">{tr('pr.count', { count: list.length })}</Text>
      {products.isLoading && !products.data.length ? <Skeleton rows={4} /> : !products.data.length ? (
        <View testID="products-empty"><EmptyState icon="package" title={tr('pr.empty')} body={tr('pr.emptyBody')} /></View>
      ) : !list.length ? <EmptyState icon="search" title={tr('pr.none')} /> : (
        <View style={{ gap: spacing.xs }}>{list.map((p) => <ProductCard key={p.id} p={p} c={crit.get(p.id)} price={bestPrice(prices.data ?? [], p.id)} selected={picked.includes(p.id)} onSelect={() => togglePick(p.id)} />)}</View>
      )}
      <Text variant="caption" muted>{tr('pr.footer')}</Text>
    </Screen>
  );
}
