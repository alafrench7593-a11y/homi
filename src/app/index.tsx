/** Écran de lancement : oriente vers l'accueil, l'onboarding ou la connexion. */
import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { FetusOrb } from '@/components/FetusOrb';
import { StarField } from '@/components/StarField';
import { Text } from '@/components/ui';
import { BRAND } from '@/config/brand';

export default function Launch() {
  const { session, ready } = useAuth();
  const { data: profile, isLoading, isError } = useProfile();
  const t = useTheme();

  if (ready && !session) return <Redirect href="/welcome" />;
  if (ready && session && !isLoading && (!profile || !profile.onboarding_completed) && !isError) return <Redirect href="/onboarding" />;
  if (ready && session && (profile?.onboarding_completed || isError)) return <Redirect href="/(tabs)" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1129', alignItems: 'center', justifyContent: 'center', gap: 18 }} accessibilityLabel={`${BRAND.name}, chargement`}>
      <StarField />
      <FetusOrb growth={0.6} size={180} interactive={false} />
      <Text variant="title" color="#F2DFC1">{BRAND.name}</Text>
      <Text italic color={t.colors.gold}>{isLoading ? BRAND.tagline : ' '}</Text>
    </View>
  );
}
