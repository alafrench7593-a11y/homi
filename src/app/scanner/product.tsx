/** Scanner un produit (cosmétique, soin, lingettes, couches, lessive, entretien…). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { ScanFlow } from '@/features/scanner/ScanFlow';
import { t as tr } from '@/i18n';

export default function ScanProductScreen() {
  return (
    <Screen back title={tr('u8.product.title')} subtitle={tr('u8.product.subtitle')}>
      <ScanFlow kind="product" />
    </Screen>
  );
}
