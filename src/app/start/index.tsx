/**
 * Parcours « première réussite » (/start) : étape de vie → besoin → mini-démo guidée par Aura → résultat, AVANT tout
 * compte (src/features/firstWin/FirstWinFlow.tsx). `?step=result` : retour au résultat (croix du paywall).
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
  const { step } = useLocalSearchParams<{ step?: string }>();
  const { session, ready } = useAuth();
  const premium = usePremiumState();
  const th = useTheme();
  if (!ready || (session && premium === undefined)) return <View style={{ flex: 1, backgroundColor: th.colors.background }} />;
  if (session && premium) return <Redirect href="/(tabs)" />;
  const initial = (['stage', 'need', 'demo', 'result'] as FlowStep[]).find((s) => s === step);
  return <FirstWinFlow initialStep={initial} />;
}
