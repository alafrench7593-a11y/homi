/** Scanner un aliment : « Puis-je manger ou donner cet aliment ? » */
import React from 'react';
import { Screen } from '@/components/Screen';
import { ScanFlow } from '@/features/scanner/ScanFlow';
import { t as tr } from '@/i18n';

export default function ScanFoodScreen() {
  return (
    <Screen back title={tr('u8.food.title')} subtitle={tr('u8.food.subtitle')}>
      <ScanFlow kind="food" />
    </Screen>
  );
}
