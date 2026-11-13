/** Scanner un aliment : « Puis-je manger ou donner cet aliment ? » — assistant en 4 étapes. */
import React from 'react';
import { ScanFlow } from '@/features/scanner/ScanFlow';
import { t as tr } from '@/i18n';

export default function ScanFoodScreen() {
  return <ScanFlow kind="food" title={tr('u8.food.title')} subtitle={tr('u8.food.subtitle')} />;
}
