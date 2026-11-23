/** Scanner un produit (cosmétique, soin, lingettes, couches, lessive, entretien…) : assistant en 4 étapes. */
import React from 'react';
import { ScanFlow } from '@/features/scanner/ScanFlow';
import { t as tr } from '@/i18n';

export default function ScanProductScreen() {
  return <ScanFlow kind="product" title={tr('u8.product.title')} subtitle={tr('u8.product.subtitle')} />;
}
