/** Scanner un aliment : « Puis-je manger ou donner cet aliment ? » */
import React from 'react';
import { Screen } from '@/components/Screen';
import { ScanFlow } from '@/features/scanner/ScanFlow';

export default function ScanFoodScreen() {
  return (
    <Screen back title="Puis-je manger ou donner cet aliment ?" subtitle="Selon la grossesse, l’allaitement ou l’âge de l’enfant, avec les sources.">
      <ScanFlow kind="food" />
    </Screen>
  );
}
