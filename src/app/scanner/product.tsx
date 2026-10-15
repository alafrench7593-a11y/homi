/** Scanner un produit (cosmétique, soin, lingettes, couches, lessive, entretien…). */
import React from 'react';
import { Screen } from '@/components/Screen';
import { ScanFlow } from '@/features/scanner/ScanFlow';

export default function ScanProductScreen() {
  return (
    <Screen back title="Scanner un produit" subtitle="Composition, précautions et rappels officiels, avec leurs sources.">
      <ScanFlow kind="product" />
    </Screen>
  );
}
