/**
 * Administration du catalogue de produits (rôle « editor ») :
 *  · ajouter un produit RÉEL par son code-barres (fiche Open Food Facts / Open Beauty Facts / Open Products Facts) ;
 *  · renseigner la catégorie, l'âge indiqué par le fabricant (recopié de l'emballage), les atouts et les précautions ;
 *  · récupérer les prix relevés sur Open Prices, ou saisir un prix constaté avec sa source et sa date ;
 *  · publier, dépublier, retirer. Rien n'est inventé : sans fiche trouvée, le produit n'est pas créé.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Row, SectionTitle, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { useLookupBarcode } from '@/lib/data/hooks-scanner';
import { useFetchOpenPrices, useKidProducts, useProductPrices, useSavePrice, useSaveProduct, type KidProduct, type OpenPrice, type ProductPrice } from '@/lib/data/hooks-products';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/domain/productCriteria';
import { parseQuantity } from '../../../supabase/functions/_shared/open-prices';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const KINDS: ProductPrice['store_kind'][] = ['pharmacy', 'supermarket', 'baby_store', 'brand', 'online', 'other'];
const today = () => new Date().toISOString().slice(0, 10);

function Editor({ p, onClose }: { p: KidProduct; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveProduct();
  const savePrice = useSavePrice();
  const fetchPrices = useFetchOpenPrices();
  const prices = useProductPrices();
  const [cat, setCat] = useState<ProductCategory>(p.category);
  const [ageLabel, setAgeLabel] = useState(p.maker_age_label ?? '');
  const [ageMonths, setAgeMonths] = useState(p.maker_min_months == null ? '' : String(p.maker_min_months));
  const [benefits, setBenefits] = useState(p.benefits.join('\n'));
  const [precautions, setPrecautions] = useState(p.precautions.join('\n'));
  const [reviewer, setReviewer] = useState(p.reviewed_by_label ?? '');
  const [found, setFound] = useState<{ list: OpenPrice[]; message?: string } | null>(null);
  const [mp, setMp] = useState({ price: '', store: '', kind: 'pharmacy' as ProductPrice['store_kind'], city: '', url: '', src: '', date: today() });
  const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  async function persist(status?: KidProduct['status']) {
    const months = ageMonths.trim() ? Number(ageMonths) : null;
    if (months != null && !(months >= 0 && months <= 216)) return toast(tr('pr.admin.ageInvalid'), 'error');
    if (status === 'published' && !reviewer.trim()) return toast(tr('pr.admin.reviewerNeeded'), 'error');
    try {
      await save.mutateAsync({ id: p.id, row: { category: cat, maker_age_label: ageLabel.trim() || null, maker_min_months: months, benefits: lines(benefits), precautions: lines(precautions), reviewed_by_label: reviewer.trim() || null, ...(status ? { status } : {}) } });
      toast(tr('nd.saved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function loadOpenPrices() {
    try { const r = await fetchPrices.mutateAsync({ barcode: p.barcode }); setFound({ list: r.prices, message: r.message }); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function keepOpenPrice(x: OpenPrice) {
    try {
      await savePrice.mutateAsync({ product_id: p.id, price: x.price, store_name: x.store_name, store_kind: x.online ? 'online' : 'other', store_city: x.store_city, product_url: x.website_url, source: 'open_prices', source_url: x.source_url, observed_on: x.observed_on });
      toast(tr('pr.admin.priceSaved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function addManual() {
    const price = Number(mp.price.replace(',', '.'));
    if (!(price > 0) || !mp.store.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(mp.date) || mp.date > today()) return toast(tr('pr.admin.priceInvalid'), 'error');
    if (mp.url && !/^https:\/\//.test(mp.url)) return toast(tr('pr.admin.urlInvalid'), 'error');
    try {
      await savePrice.mutateAsync({ product_id: p.id, price, store_name: mp.store.trim(), store_kind: mp.kind, store_city: mp.city.trim() || null, product_url: mp.url.trim() || null, source: 'manual', source_url: mp.src.trim() || mp.url.trim() || null, observed_on: mp.date });
      setMp({ ...mp, price: '', url: '', src: '' });
      toast(tr('pr.admin.priceSaved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Card>
      <Text weight="bold">{p.name}</Text>
      <Row wrap>{PRODUCT_CATEGORIES.map((c) => <Chip key={c} label={tr(`pr.cat.${c}` as TKey)} selected={cat === c} onPress={() => setCat(c)} />)}</Row>
      <Field label={tr('pr.admin.ageLabel')} hint={tr('pr.admin.ageLabelHint')} value={ageLabel} onChangeText={setAgeLabel} maxLength={120} />
      <Field label={tr('pr.admin.ageMonths')} value={ageMonths} onChangeText={setAgeMonths} keyboardType="number-pad" maxLength={3} />
      <Field label={tr('pr.benefits')} hint={tr('pr.admin.linesHint')} value={benefits} onChangeText={setBenefits} multiline maxLength={1200} />
      <Field label={tr('pr.precautions')} hint={tr('pr.admin.linesHint')} value={precautions} onChangeText={setPrecautions} multiline maxLength={1200} />
      <Field label={tr('pr.admin.reviewer')} hint={tr('pr.admin.reviewerHint')} value={reviewer} onChangeText={setReviewer} maxLength={160} />
      <Row wrap style={{ marginTop: spacing.xs }}>
        <Button label={tr('common.save')} size="sm" onPress={() => void persist()} loading={save.isPending} />
        {p.status !== 'published' ? <Button label={tr('pr.admin.publish')} size="sm" variant="secondary" onPress={() => void persist('published')} testID="product-publish" /> : <Button label={tr('pr.admin.unpublish')} size="sm" variant="secondary" onPress={() => void persist('draft')} />}
        {p.status !== 'retired' ? <Button label={tr('pr.admin.retire')} size="sm" variant="ghost" onPress={() => void persist('retired')} /> : null}
        <Button label={tr('common.cancel')} size="sm" variant="ghost" onPress={onClose} />
      </Row>

      <SectionTitle title={tr('pr.prices')} />
      {(prices.data ?? []).filter((x) => x.product_id === p.id).map((x) => <Text key={x.id} variant="small">• {x.price} € · {x.store_name} · {formatDate(`${x.observed_on}T12:00:00`)} · {tr(`pr.priceSrc.${x.source}` as TKey)}</Text>)}
      <Button label={tr('pr.admin.fetchPrices')} icon="download" size="sm" variant="secondary" onPress={() => void loadOpenPrices()} loading={fetchPrices.isPending} testID="product-fetch-prices" />
      {found ? (
        <View testID="open-prices-result" style={{ gap: 4 }}>
          {found.message ? <Text variant="caption" muted>{found.message}</Text> : null}
          {!found.list.length && !found.message ? <Text variant="caption" muted>{tr('pr.admin.noOpenPrices')}</Text> : null}
          {found.list.map((x) => (
            <Row key={x.id} wrap style={{ alignItems: 'center' }}>
              <Text variant="small" style={{ flex: 1 }}>{x.price} € · {x.store_name}{x.store_city ? `, ${x.store_city}` : ''} · {formatDate(`${x.observed_on}T12:00:00`)}</Text>
              <Button label={tr('pr.admin.keep')} size="sm" variant="ghost" onPress={() => void keepOpenPrice(x)} />
            </Row>
          ))}
        </View>
      ) : null}
      <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('pr.admin.manualPrice')}</Text>
      <Row>
        <View style={{ flex: 1 }}><Field label={tr('pr.admin.price')} value={mp.price} onChangeText={(v) => setMp({ ...mp, price: v })} keyboardType="decimal-pad" maxLength={8} /></View>
        <View style={{ flex: 1 }}><Field label={tr('pr.admin.date')} value={mp.date} onChangeText={(v) => setMp({ ...mp, date: v })} maxLength={10} /></View>
      </Row>
      <Field label={tr('pr.admin.store')} value={mp.store} onChangeText={(v) => setMp({ ...mp, store: v })} maxLength={160} />
      <Row wrap>{KINDS.map((k) => <Chip key={k} label={tr(`pr.store.${k}` as TKey)} selected={mp.kind === k} onPress={() => setMp({ ...mp, kind: k })} />)}</Row>
      <Field label={tr('pr.admin.city')} optional value={mp.city} onChangeText={(v) => setMp({ ...mp, city: v })} maxLength={120} />
      <Field label={tr('pr.admin.productUrl')} optional value={mp.url} onChangeText={(v) => setMp({ ...mp, url: v })} autoCapitalize="none" maxLength={500} />
      <Field label={tr('pr.admin.sourceUrl')} optional value={mp.src} onChangeText={(v) => setMp({ ...mp, src: v })} autoCapitalize="none" maxLength={500} />
      <Button label={tr('pr.admin.addPrice')} size="sm" onPress={() => void addManual()} loading={savePrice.isPending} />
    </Card>
  );
}

export default function AdminProducts() {
  const toast = useToast();
  const { isEditor, isLoading } = useMyRoles();
  const products = useKidProducts({ includeDrafts: true });
  const lookup = useLookupBarcode();
  const save = useSaveProduct();
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<'product' | 'food'>('product');
  const [editing, setEditing] = useState<string | null>(null);

  if (isLoading) return <Screen back title={tr('pr.admin.title')}><Skeleton rows={3} /></Screen>;
  if (!isEditor) return <Screen back title={tr('pr.admin.title')}><EmptyState icon="lock" title={tr('rc.admin.reserved')} body={tr('pr.admin.reservedBody')} action={{ label: tr('rc.admin.title'), onPress: () => router.push('/admin/recipes') }} /></Screen>;

  async function add() {
    const barcode = code.replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(barcode)) return toast(tr('pr.admin.barcodeInvalid'), 'error');
    try {
      const r = await lookup.mutateAsync({ barcode, kind });
      if (!r.found || !r.product) return toast(r.message ?? tr('pr.admin.notFound'), 'error');
      const p = r.product as typeof r.product & { quantity?: string | null; source_url?: string | null; data_retrieved_at?: string | null; is_demo?: boolean; kind?: string };
      const q = parseQuantity(p.quantity ?? null);
      const source = /beauty/i.test(String(p.data_source ?? '')) ? 'openbeautyfacts' : /products/i.test(String(p.data_source ?? '')) ? 'openproductsfacts' : /food/i.test(String(p.data_source ?? '')) ? 'openfoodfacts' : 'manual';
      await save.mutateAsync({ row: {
        barcode, category: kind === 'food' ? 'food' : 'wash', brand: p.brand, name: p.name ?? tr('pr.admin.unnamed'), image_url: p.image_url && /^https:\/\//.test(p.image_url) ? p.image_url : null,
        image_credit: p.image_url ? tr('pr.photoCredit') : null, composition: p.ingredients_text, quantity_label: p.quantity ?? null, quantity_value: q.value, quantity_unit: q.unit,
        data_source: source, source_url: p.source_url ?? null, data_retrieved_at: p.data_retrieved_at ?? new Date().toISOString(), status: 'draft',
        ...(p.is_demo ? { is_demo: true } : {}),
      } });
      setCode('');
      toast(tr('pr.admin.added'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('pr.admin.title')} subtitle={tr('pr.count', { count: products.data.length })}>
      {isDemo ? <Banner tone="demo">{tr('pr.admin.demo')}</Banner> : null}
      <Text variant="small" muted>{tr('pr.admin.intro')}</Text>
      <Row wrap>
        <Chip label={tr('pr.admin.kindProduct')} selected={kind === 'product'} onPress={() => setKind('product')} />
        <Chip label={tr('pr.admin.kindFood')} selected={kind === 'food'} onPress={() => setKind('food')} />
      </Row>
      <Field label={tr('pr.admin.barcode')} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={14} testID="product-barcode" />
      <Button label={tr('pr.admin.add')} icon="plus" onPress={() => void add()} loading={lookup.isPending || save.isPending} testID="product-add" />
      {products.data.map((p) => (
        <View key={p.id} style={{ gap: spacing.xs }}>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text weight="bold" style={{ flex: 1 }}>{p.name}</Text>
              <Text variant="caption" weight="bold">{tr(`pr.status.${p.status}` as TKey)}</Text>
            </Row>
            <Text variant="caption" muted>{p.brand ?? '—'} · {p.barcode} · {tr(`pr.src.${p.data_source}` as TKey)}{p.is_demo ? ` · ${tr('pr.demoProduct')}` : ''}</Text>
            <Row wrap>
              <Button label={tr('rc.admin.open')} size="sm" variant="ghost" onPress={() => router.push(`/products/${p.id}`)} />
              <Button label={tr('rc.admin.edit')} size="sm" variant="ghost" onPress={() => setEditing(editing === p.id ? null : p.id)} testID={`product-edit-${p.barcode}`} />
            </Row>
          </Card>
          {editing === p.id ? <Editor p={p} onClose={() => setEditing(null)} /> : null}
        </View>
      ))}
    </Screen>
  );
}
