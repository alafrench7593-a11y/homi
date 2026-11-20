/** Écran de lancement : oriente vers l'accueil, l'onboarding ou la connexion. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useMemberships, useProfile } from '@/lib/data/hooks';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/components/ui';
import { BrandStack } from '@/components/BrandLogo';
import { BRAND } from '@/config/brand';
import { peekPendingInvite } from '@/lib/authFlow';
import { useUiStore } from '@/lib/store';
import { loadProgress, resumeRoute, type FirstWinProgress } from '@/features/firstWin/model';
import { usePremiumState } from '@/features/firstWin/hooks';
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
  // Compte qui n'est QUE nounou (aucun foyer en tant que parent) : son accueil est « Mes gardes »
  const memberships = useMemberships();
  const caregiverOnly = isCaregiverOnly(memberships.data);
  const [invite, setInvite] = useState<string | null | undefined>(undefined);
  useEffect(() => { if (session) peekPendingInvite().then(setInvite); }, [session]);
  // Préférences locales relues avant de décider d'afficher l'introduction
  const [hydrated, setHydrated] = useState(() => useUiStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => (hydrated ? undefined : useUiStore.persist?.onFinishHydration?.(() => setHydrated(true))), [hydrated]);
  const introSeen = useUiStore((s) => s.introSeen);
  // Parcours « première réussite » : compte créé entre le choix de la formule et l'achat → retour au paywall
  const [firstWin, setFirstWin] = useState<FirstWinProgress | null | undefined>(undefined);
  useEffect(() => { if (session) void loadProgress().then(setFirstWin); }, [session]);
  const premium = usePremiumState();

  // Première ouverture sans compte (03/12/2026) : parcours court « première réussite » (étape de vie → besoin →
  // démo guidée par Aura → résultat → offres), sans compte ; l'introduction « Je suis… » reste rejouable (/intro).
  if (ready && !session && hydrated && !introSeen) return <Redirect href={'/start' as never} />;
  if (ready && !session && hydrated) return <Redirect href="/welcome" />;
  // Invitation reçue avant d'avoir un compte : on la propose dès la première connexion
  if (ready && session && invite) return <Redirect href={{ pathname: '/settings/family', params: { code: invite } }} />;
  if (ready && session && invite === undefined) return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  if (ready && session && firstWin === undefined) return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  if (ready && session && firstWin?.awaitingAccount && premium === undefined) return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  const resume = ready && session ? resumeRoute(firstWin ?? null, { signedIn: true, premium }) : null;
  if (resume) return <Redirect href={resume as never} />;
  if (ready && session && caregiverOnly) return <Redirect href={'/garde' as never} />;
  if (ready && session && profileSettled && !offlinePaused && (!profile || !profile.onboarding_completed) && !isError) return <Redirect href="/onboarding" />;
  if (ready && session && (profile?.onboarding_completed || isError || offlinePaused)) return <Redirect href="/(tabs)" />;

  // Première ouverture : on attend la session sur le fond de l'introduction (même couleur, enchaînement sans saut)
  if (hydrated && !introSeen && !ready) return <View style={{ flex: 1, backgroundColor: t.colors.background }} />;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center', gap: 18 }} accessibilityLabel={tr('common.appLoading', { app: BRAND.name })}>
      <BrandStack width={180} testID="loading-brand" />
      <Text muted>{isLoading ? tr('brand.tagline') : ' '}</Text>
    </View>
  );
}
