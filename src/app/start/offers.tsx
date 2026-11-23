/**
 * Paywall de conclusion du parcours « première réussite » (src/features/firstWin/Offers.tsx). `?resume=1` : retour après l'inscription.
 * Web : le même paywall en vitrine (tarifs indicatifs, aucun achat) ; l'abonnement se prend dans l'app iPhone.
 */
import React from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FirstWinOffers } from '@/features/firstWin/Offers';

export default function StartOffers() {
  const { apercu } = useLocalSearchParams<{ apercu?: string }>();
  // `?apercu=1` : aperçu du paywall mobile sur le web, en développement seulement (vidéos de revue) — jamais publié
  if (Platform.OS !== 'web' || (__DEV__ && apercu === '1')) return <FirstWinOffers />;
  // Web (23/11/2026, décision de la propriétaire) : le vrai paywall en vitrine — tarifs indicatifs, aucun achat sur le web
  return <FirstWinOffers webShowcase />;
}
