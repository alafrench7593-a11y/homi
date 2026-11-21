/**
 * Parcours « première réussite » (/start) : étape de vie → besoin → mini-démo guidée par Aura → résultat, AVANT tout
 * compte (src/features/firstWin/FirstWinFlow.tsx). `?step=result` : retour au résultat (croix du paywall) ;
 * `?from=welcome_start|welcome_demo` : bouton de l'accueil qui y mène (mesure).
 * Un compte déjà abonné ne voit jamais ce parcours.
 */
import React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { FirstWinFlow } from '@/features/firstWin/FirstWinFlow';
import { usePremiumState } from '@/features/firstWin/hooks';
import type { FlowStep } from '@/features/firstWin/model';
import { useTheme } from '@/theme/ThemeProvider';

export default function Start() {
  const { step, from } = useLocalSearchParams<{ step?: string; from?: string }>();
  const { session, ready } = useAuth();
  const premium = usePremiumState();
  const th = useTheme();
  if (!ready || (session && premium === undefined)) return <View style={{ flex: 1, backgroundColor: th.colors.background }} />;
  if (session && premium) return <Redirect href="/(tabs)" />;
  const initial = (['stage', 'need', 'demo', 'result'] as FlowStep[]).find((s) => s === step);
  // Origine pour la mesure : bouton « Commencer » ou « Découvrir sans compte » de l'accueil, sinon première ouverture
  const source = from === 'welcome_start' || from === 'welcome_demo' ? from : 'first_open';
  return <FirstWinFlow initialStep={initial} source={source} />;
}
