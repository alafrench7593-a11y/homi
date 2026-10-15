/** Réglages : profil, apparence, famille, rappels, abonnement, confidentialité, aide, à propos, déconnexion. */
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen } from '@/components/Screen';
import { DemoBanner } from '@/components/Family';
import { Banner, Button, Card, Chip, Divider, Field, ListRow, Row, Segmented, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useAuth } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { useHousehold, useHouseholdMembers, usePremium, useProfile, useReminders, useUpdateProfile } from '@/lib/data/hooks';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { cancelAllLocal } from '@/lib/notifications';
import { useUiStore } from '@/lib/store';
import { previewTime, SKY_LABEL, spacing, type SkyPhase } from '@/theme/tokens';

/** « Nuit » : thème nocturne doux. Le magasin d'état l'accepte à l'exécution (ThemeProvider sait l'afficher). */
type Appearance = 'auto' | 'light' | 'dark' | 'night';
const APPEARANCE: { value: Appearance; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'night', label: 'Nuit' },
];
const PHASES: SkyPhase[] = ['dawn', 'day', 'dusk', 'night'];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function SettingsScreen() {
  const toast = useToast();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const household = useHousehold();
  const { data: members } = useHouseholdMembers();
  const { data: reminders } = useReminders();
  const premium = usePremium();
  const { isModerator } = useMyRoles();

  const preference = useUiStore((s) => s.themePreference);
  const setTheme = useUiStore((s) => s.setTheme);
  const skyOverride = useUiStore((s) => s.skyOverride);
  const setSkyOverride = useUiStore((s) => s.setSkyOverride);
  const haptics = useUiStore((s) => s.hapticsEnabled);
  const setHaptics = useUiStore((s) => s.setHaptics);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (profile) setName(profile.display_name ?? '');
  }, [profile]);

  const appearance: Appearance = (['light', 'dark', 'night'] as string[]).includes(preference) ? (preference as Appearance) : 'auto';

  function chooseAppearance(v: Appearance) {
    setTheme(v as Parameters<typeof setTheme>[0]);
    if (v !== 'auto') setSkyOverride(null);
  }

  async function saveName() {
    const v = name.trim();
    if (v.length > 40) return setNameError('40 caractères au maximum.');
    setNameError(null);
    try {
      await updateProfile.mutateAsync({ display_name: v || null });
      toast('Prénom enregistré.');
    } catch (e) {
      setNameError(friendlyError(e));
    }
  }

  async function signOut(allDevices: boolean) {
    const ok = await confirm(
      allDevices ? 'Se déconnecter partout ?' : 'Se déconnecter ?',
      allDevices
        ? 'Toutes vos sessions (téléphones, tablettes, navigateurs) seront fermées. Vos données restent enregistrées.'
        : 'Vos données restent enregistrées. Les rappels programmés sur ce téléphone seront retirés jusqu’à votre prochaine connexion.',
      'Se déconnecter',
    );
    if (!ok) return;
    setSigningOut(true);
    try {
      await cancelAllLocal().catch(() => undefined);
      await backend.auth.signOut(allDevices);
      router.replace('/welcome');
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setSigningOut(false);
    }
  }

  const activeReminders = (reminders ?? []).filter((r) => r.enabled).length;
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen back title="Réglages" subtitle={session?.email ?? undefined}>
      <DemoBanner />

      <SectionTitle title="Mon profil" />
      <Card>
        <Field label="Prénom ou surnom" optional value={name} onChangeText={setName} maxLength={40} error={nameError} hint="Utilisé pour vous saluer. Jamais visible dans la communauté." returnKeyType="done" onSubmitEditing={saveName} />
        <Button label="Enregistrer" size="sm" variant="secondary" loading={updateProfile.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={saveName} />
      </Card>

      <SectionTitle title="Apparence" />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Segmented label="Thème de l’application" options={APPEARANCE} value={appearance} onChange={chooseAppearance} />
          <Text variant="small" muted>
            {appearance === 'auto'
              ? 'Le ciel de la famille suit l’heure réelle : aube, jour, crépuscule puis nuit.'
              : appearance === 'night'
                ? 'Tons très sombres et chauds, pensés pour les tétées et biberons nocturnes.'
                : appearance === 'dark' ? 'Velours de nuit en permanence.' : 'Porcelaine claire en permanence.'}
          </Text>
          <Divider />
          <Text weight="medium">Aperçu du ciel</Text>
          <Text variant="small" muted>Voir l’ambiance d’un autre moment de la journée, sans changer l’heure.</Text>
          <Row wrap>
            {PHASES.map((p) => (
              <Chip
                key={p}
                label={`${SKY_LABEL[p]} · ${hhmm(previewTime(p))}`}
                selected={skyOverride === p}
                onPress={() => {
                  if (appearance !== 'auto') setTheme('auto');
                  setSkyOverride(skyOverride === p ? null : p);
                }}
              />
            ))}
          </Row>
          {skyOverride ? (
            <Button label="Revenir à l’heure réelle" icon="rotate-ccw" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setSkyOverride(null)} />
          ) : null}
          <Divider />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ flex: 1 }}>Vibrations légères au toucher</Text>
            <Toggle label="Vibrations légères au toucher" value={haptics} onChange={setHaptics} />
          </Row>
        </View>
      </Card>

      <SectionTitle title="Ma famille et mes outils" />
      <Card>
        <ListRow icon="users" title="Famille & partage" subtitle={household ? `${household.name} · ${members?.length ?? 1} membre${(members?.length ?? 1) > 1 ? 's' : ''}` : 'Inviter un coparent, gérer les accès'} onPress={() => router.push('/settings/family')} />
        <Divider />
        <ListRow icon="bell" title="Rappels" subtitle={activeReminders ? `${activeReminders} rappel${activeReminders > 1 ? 's' : ''} actif${activeReminders > 1 ? 's' : ''}` : 'Aucun rappel actif'} onPress={() => router.push('/settings/reminders')} />
        <Divider />
        <ListRow icon="star" title="Abonnement" subtitle={premium ? `${BRAND.name} Plus actif` : 'Version gratuite'} onPress={() => router.push('/settings/subscription')} />
        <Divider />
        <ListRow icon="lock" title="Confidentialité" subtitle="Consentements, export, suppression du compte" onPress={() => router.push('/settings/privacy')} />
        {isModerator ? (
          <>
            <Divider />
            <ListRow icon="shield" title="Administration" subtitle="Statistiques, modération, annonces" onPress={() => router.push('/admin')} />
          </>
        ) : null}
      </Card>

      <SectionTitle title="Aide" />
      <Card>
        <ListRow icon="life-buoy" title="Besoin d’aide maintenant" subtitle="15, 112, 3114 — toujours gratuit" danger onPress={() => router.push('/emergency')} />
        <Divider />
        <ListRow icon="mail" title="Nous écrire" subtitle={BRAND.supportEmail} onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => toast(`Écrivez-nous à ${BRAND.supportEmail}`, 'info'))} />
      </Card>
      <Banner tone="info">{'L’application informe et accompagne ; elle ne remplace jamais l’avis d’un professionnel de santé.'}</Banner>

      <SectionTitle title="À propos" />
      <Card tone="soft">
        <Text variant="heading">{BRAND.name}</Text>
        <Text italic muted>{BRAND.tagline}</Text>
        <Text variant="small" muted style={{ marginTop: spacing.xs }}>
          {`Version ${version}${isDemo ? ' · mode démonstration (données sur cet appareil)' : ''}`}
        </Text>
      </Card>

      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        <Button label="Se déconnecter" variant="secondary" icon="log-out" loading={signingOut} onPress={() => signOut(false)} />
        <Button label="Se déconnecter sur tous les appareils" variant="ghost" onPress={() => signOut(true)} />
        {isDemo ? <Text variant="caption" muted center>En mode démonstration, un seul appareil est concerné.</Text> : null}
      </View>
    </Screen>
  );
}
