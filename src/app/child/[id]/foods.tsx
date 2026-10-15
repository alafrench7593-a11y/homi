/** Lien historique : redirige vers l'onglet « alimentation » du profil enfant. */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ChildFoodsRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/child/[id]', params: { id, tab: 'alimentation' } }} />;
}
