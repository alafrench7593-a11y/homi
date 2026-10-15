/** Lien historique : redirige vers l'onglet « croissance » du profil enfant. */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ChildGrowthRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/child/[id]', params: { id, tab: 'croissance' } }} />;
}
