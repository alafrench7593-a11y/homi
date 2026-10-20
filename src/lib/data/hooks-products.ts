/**
 * Catalogue de produits enfants : produits réels ajoutés par l'équipe à partir d'Open Food Facts, Open Beauty Facts
 * ou Open Products Facts (par code-barres), prix datés (Open Prices ou saisie de l'équipe avec sa source).
 * Aucun produit, prix ni disponibilité n'est inventé : sans donnée, l'application l'écrit.
 */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useInvalidate, useRows } from './hooks';
import { productCriteria, type CriteriaResult, type ProductCategory } from '../domain/productCriteria';

export interface KidProduct {
  id: string; barcode: string; category: ProductCategory; brand: string | null; name: string; image_url: string | null; image_credit: string | null;
  composition: string | null; quantity_label: string | null; quantity_value: number | null; quantity_unit: 'g' | 'ml' | 'u' | null;
  maker_min_months: number | null; maker_age_label: string | null; benefits: string[]; precautions: string[];
  data_source: 'openfoodfacts' | 'openbeautyfacts' | 'openproductsfacts' | 'manual'; source_url: string | null; data_retrieved_at: string | null;
  status: 'draft' | 'published' | 'retired'; reviewed_by_label: string | null; nutrition?: { sugars_g_100g: number | null; salt_g_100g: number | null } | null;
  is_demo?: boolean; created_at: string; updated_at: string;
}
export interface ProductPrice {
  id: string; product_id: string; price: number; currency: 'EUR'; store_name: string; store_kind: 'pharmacy' | 'supermarket' | 'baby_store' | 'brand' | 'online' | 'other';
  store_city: string | null; product_url: string | null; source: 'open_prices' | 'manual'; source_url: string | null; observed_on: string; created_at: string;
}
export interface OpenPrice { id: string; price: number; currency: 'EUR'; price_per: 'UNIT' | 'KILOGRAM' | null; discounted: boolean; observed_on: string; store_name: string; store_city: string | null; store_country: string | null; online: boolean; website_url: string | null; source_url: string }
export interface OpenPricesResponse { prices: OpenPrice[]; source: string; status: 'ok' | 'disabled' | 'saturated' | 'unavailable' | 'demo'; message?: string; checked_at?: string }

export function useKidProducts(opts: { includeDrafts?: boolean } = {}) {
  const q = useRows<KidProduct>(['kid_products'], { table: 'kid_products', order: [{ col: 'name' }] }, { staleTime: 300_000 });
  const data = useMemo(() => (q.data ?? []).filter((p) => opts.includeDrafts || p.status === 'published'), [q.data, opts.includeDrafts]);
  return { ...q, data };
}
export function useProductPrices() {
  return useRows<ProductPrice>(['product_prices'], { table: 'product_prices', order: [{ col: 'observed_on', asc: false }] }, { staleTime: 300_000 });
}
/** Critères de chaque produit (calculés une fois). */
export function useProductCriteria(list: KidProduct[]) {
  return useMemo(() => new Map<string, CriteriaResult>(list.map((p) => [p.id, productCriteria(p)])), [list]);
}
/** Prix le plus récent et le moins cher de chaque produit (relevés datés). */
export function bestPrice(prices: ProductPrice[], productId: string): ProductPrice | null {
  const mine = prices.filter((x) => x.product_id === productId);
  if (!mine.length) return null;
  return [...mine].sort((a, b) => Number(a.price) - Number(b.price) || b.observed_on.localeCompare(a.observed_on))[0];
}

/** Prix relevés sur Open Prices (via le serveur ; en démonstration, aucun prix n'est affiché). */
export function useFetchOpenPrices() {
  return useMutation({ mutationFn: (a: { barcode?: string; category_tag?: string }) => backend.invoke<OpenPricesResponse>('product-lookup', { action: 'prices', ...a }) });
}

export function useSaveProduct() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string; row: Partial<KidProduct> }) => {
      if (v.id) await backend.update('kid_products', { ...v.row, updated_at: new Date().toISOString() }, [eq('id', v.id)]);
      else await backend.insert('kid_products', v.row);
    },
    onSuccess: () => inv('kid_products'),
  });
}
export function useSavePrice() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: Omit<ProductPrice, 'id' | 'created_at' | 'currency'>) => backend.insert('product_prices', { ...v, currency: 'EUR' }),
    onSuccess: () => inv('product_prices'),
  });
}
export function useDeletePrice() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('product_prices', [eq('id', id)]), onSuccess: () => inv('product_prices') });
}
