/** Écran Premium plein écran (fil doré, fonctions réelles, 3 formules) — libre d'accès, même sans abonnement. */
import React from 'react';
import { Screen } from '@/components/Screen';
import { Paywall } from '@/features/Paywall';
import { t as tr } from '@/i18n';

export default function PremiumScreen() {
  return (
    <Screen back title={tr('pw.title')} scroll>
      <Paywall embedded />
    </Screen>
  );
}
