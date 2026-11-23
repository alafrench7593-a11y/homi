/**
 * Ancienne introduction de première ouverture : remplacée par « Découvrir HOMI » (/discover, 14/11/2026). La route
 * reste valide (liens existants, « Revoir l'introduction animée » de Réglages › Mon accueil) et redirige en gardant
 * le mode relance (`?replay=1`). L'introduction vectorielle `HomiIntro` reste disponible dans src/features/entry.
 */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function Cinematic() {
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  return <Redirect href={(replay ? '/discover?replay=1' : '/discover') as never} />;
}
