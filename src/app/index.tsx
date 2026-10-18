/** Écran de lancement : oriente vers l'accueil, l'onboarding ou la connexion. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { FetusOrb } from '@/components/FetusOrb';
import { StarField } from '@/components/StarField';
import { Text } from '@/components/ui';
import { Aurora } from '@/components/Aurora';
import { BRAND } from '@/config/brand';
import { peekPendingInvite } from '@/lib/authFlow';

export default function Launch() {
  const { session, ready } = useAuth();
  const { data: profile, isLoading, isError } = useProfile();
  const t = useTheme();
  const [invite, setInvite] = useState<string | null | undefined>(undefined);
  useEffect(() => { if (session) peekPendingInvite().then(setInvite); }, [session]);

  if (ready && !session) return <Redirect href="/welcome" />;
  // Invitation reçue avant d'avoir un compte : on la propose dès la première connexion
  if (ready && session && invite) return <Redirect href={{ pathname: '/settings/family', params: { code: invite } }} />;
  if (ready && session && invite === undefined) return <View style={{ flex: 1, backgroundColor: '#1C1128' }} />;
  if (ready && session && !isLoading && (!profile || !profile.onboarding_completed) && !isError) return <Redirect href="/onboarding" />;
  if (ready && session && (profile?.onboarding_completed || isError)) return <Redirect href="/(tabs)" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1128', alignItems: 'center', justifyContent: 'center', gap: 18 }} accessibilityLabel={`${BRAND.name}, chargement`}>
      <Aurora mood="evening" intensity={1.25} />
      <StarField color="#FFF1E6" />
      <FetusOrb growth={0.6} size={180} interactive={false} />
      <Text variant="title" color="#FFF4EE">{BRAND.name}</Text>
      <Text italic color={t.colors.gold}>{isLoading ? BRAND.tagline : ' '}</Text>
    </View>
  );
}
