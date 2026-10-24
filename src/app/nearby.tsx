/**
 * « Près de chez moi » fait désormais partie de Communauté › « Sorties & rencontres » (onglet Lieux) : mêmes lieux
 * publics, mêmes filtres, favoris, signalements et annuaires. Les anciens liens restent valables.
 */
import React from 'react';
import { Redirect } from 'expo-router';

export default function Nearby() {
  return <Redirect href={'/outings' as never} />;
}
