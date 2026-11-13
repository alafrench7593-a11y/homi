/** Écran de lancement : oriente vers l'accueil, l'onboarding ou la connexion. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND } from '@/config/brand';
import { peekPendingInvite } from '@/lib/authFlow';
import { useUiStore } from '@/lib/store';
import { t as tr } from '@/i18n';

export default function Launch() {
  const { session, ready } = useAuth();
  const profileQ = useProfile();
  const { data: profile, isLoading, isError } = profileQ;
  // Hors connexion sans profil en cache, la requête est « en pause » : ce n'est PAS un compte sans profil.
  // On ouvre l'appli (les données en cache et la saisie hors ligne restent utilisables) au lieu de l'inscription.
  const offlinePaused = profileQ.fetchStatus === 'paused' && !profile;
  const profileSettled = profileQ.isFetched || isError;
  const t = useTheme();
  const [invite, setInvite] = useState<string | null | undefined>(undefined);
  useEffect(() => { if (session) peekPendingInvite().then(setInvite); }, [session]);
  // Préférences locales relues avant de décider d'afficher l'introduction
  const [hydrated, setHydrated] = useState(() => useUiStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => (hydrated ? undefined : useUiStore.persist?.onFinishHydration?.(() => setHydrated(true))), [hydrated]);
  const introSeen = useUiStore((s) => s.introSeen);
  const cinematicSeen = useUiStore((s) => s.cinematicSeen);

  // Toute première ouverture (pas encore de compte) : introduction HOMI vectorielle, une seule fois, « Passer » possible
  if (ready && !session && hydrated && !cinematicSeen) return <Redirect href="/cinematic" />;
  // Première ouverture sans compte : introduction (toujours « Passer » possible)
  if (ready && !session && hydrated && !introSeen) return <Redirect href="/intro" />;
  if (ready && !session && hydrated) return <Redirect href="/welcome" />;
  // Invitation reçue avant d'avoir un compte : on la propose dès la première connexion
  if (ready && session && invite) return <Redirect href={{ pathname: '/settings/family', params: { code: invite } }} />;
  if (ready && session && invite === undefined) return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  if (ready && session && profileSettled && !offlinePaused && (!profile || !profile.onboarding_completed) && !isError) return <Redirect href="/onboarding" />;
  if (ready && session && (profile?.onboarding_completed || isError || offlinePaused)) return <Redirect href="/(tabs)" />;

  // Première ouverture : on attend la session sur le fond de l'introduction (même couleur, enchaînement sans saut)
  if (hydrated && !cinematicSeen && !ready) return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center', gap: 18 }} accessibilityLabel={tr('common.appLoading', { app: BRAND.name })}>
      <BrandLogo size={120} />
      <Text variant="title">{BRAND.name}</Text>
      <Text muted>{isLoading ? tr('brand.tagline') : ' '}</Text>
    </View>
  );
}
