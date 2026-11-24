/** Réglages : profil, apparence, famille, rappels, abonnement, confidentialité, aide, à propos, déconnexion. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmAndSignOut, SignOutRow } from '@/features/account/SignOutRow';
import { Screen } from '@/components/Screen';
import { DemoBanner } from '@/components/Family';
import { Button, Card, Divider, Field, type IconName, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useAuth } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { useHousehold, useHouseholdMembers, usePremium, useProfile, useReminders, useUpdateProfile } from '@/lib/data/hooks';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { cancelAllLocal, unregisterPushToken } from '@/lib/notifications';
import { useUiStore } from '@/lib/store';
import { flushQueue, useOfflineStore } from '@/lib/offline';
import { useDeveloperMode } from '@/lib/devMode';
import { migratePalette, spacing } from '@/theme/tokens';
import { deviceRegion, getLocale, t as tr } from '@/i18n';
import { DEVICE_CALENDAR_ROUTE, useDeviceCalendarSummary } from '@/features/deviceCalendar/DeviceCalendarParts';
import { defaultRegion, localeInfo, REGIONS } from '@/i18n/locales';

/** Apparence (v2) : résumé « Système · Auto » ; le réglage complet est dans Réglages → Apparence et couleurs. */
const MODE_ICON: Record<'system' | 'light' | 'dark', IconName> = { system: 'smartphone', light: 'sun', dark: 'moon' };

export default function SettingsScreen() {
  const toast = useToast();
  const offline = useOfflineStore();
  const devMode = useDeveloperMode();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const household = useHousehold();
  const { data: members } = useHouseholdMembers();
  const { data: reminders } = useReminders();
  const premium = usePremium();
  const { isModerator } = useMyRoles();
  const iphoneCalendar = useDeviceCalendarSummary();

  const preference = useUiStore((s) => s.themePreference);
  const paletteChoice = migratePalette(useUiStore((s) => s.palettePreference));
  const haptics = useUiStore((s) => s.hapticsEnabled);
  const region = useUiStore((s) => s.region);
  const regionInfo = REGIONS.find((r) => r.code === (region ?? defaultRegion(deviceRegion()))) ?? REGIONS[0];
  const setHaptics = useUiStore((s) => s.setHaptics);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (profile) setName(profile.display_name ?? '');
  }, [profile]);

  const mode = preference === 'light' || preference === 'dark' ? preference : 'system';

  async function saveName() {
    const v = name.trim();
    if (v.length > 40) return setNameError(tr('settings.name.tooLong'));
    setNameError(null);
    try {
      await updateProfile.mutateAsync({ display_name: v || null });
      toast(tr('settings.name.saved'));
    } catch (e) {
      setNameError(friendlyError(e));
    }
  }

  async function signOut(allDevices: boolean) {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await confirmAndSignOut(isDemo, allDevices);
    } catch (e) {
      toast(friendlyError(e), 'error');
    } finally {
      setSigningOut(false);
    }
  }
  // Recherche « déconnexion » (entrée `sign_out` du registre) : /settings?signout=1 ouvre la confirmation
  const { signout } = useLocalSearchParams<{ signout?: string }>();
  useEffect(() => { if (signout === '1') void confirmAndSignOut(isDemo).catch(() => undefined); }, [signout]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeReminders = (reminders ?? []).filter((r) => r.enabled).length;

  return (
    <Screen back title={tr('settings.title')} subtitle={session?.email ?? undefined}>
      <DemoBanner />

      {/* Mon compte EN TÊTE (App Store 5.1.1(v)) : la suppression du compte est à 2 appuis depuis Réglages */}
      <SectionTitle title={tr('settings.account')} />
      <Card>
        <ListRow icon="user" title={tr('settings.account')} subtitle={tr('settings.account.sub')} onPress={() => router.push('/settings/account')} testID="settings-account" />
        <Divider />
        <ListRow icon="trash-2" title={tr('u1.acc.deleteSection')} subtitle={tr('acct.deleteRowSub')} danger
          onPress={() => router.push('/settings/account?delete=1' as never)} testID="settings-delete-account" />
      </Card>

      <SectionTitle title={tr('settings.profile')} />
      <Card>
        <Field label={tr('settings.name.label')} optional value={name} onChangeText={setName} maxLength={40} error={nameError} hint={tr('settings.name.hint')} returnKeyType="done" onSubmitEditing={saveName} />
        <Button label={tr('common.save')} size="sm" variant="secondary" loading={updateProfile.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={saveName} />
        <Divider />
        <ListRow icon="globe" title={tr('settings.language.row')} subtitle={tr('settings.language.rowSub', { language: localeInfo(getLocale()).native, country: getLocale() === 'fr' ? regionInfo.fr : regionInfo.en })} onPress={() => router.push('/settings/language')} />
        <Divider />
        <ListRow
          icon={MODE_ICON[mode]}
          title={tr('settings.appearance.row')}
          subtitle={tr('v6.palette.rowSub', { mode: tr(`settings.appearance.${mode}` as const), palette: tr(`v6.palette.${paletteChoice}` as const) })}
          onPress={() => router.push('/settings/appearance')}
          testID="settings-appearance"
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ flex: 1 }}>{tr('settings.haptics')}</Text>
          <Toggle label={tr('settings.haptics')} value={haptics} onChange={setHaptics} />
        </Row>
      </Card>

      <SectionTitle title={tr('settings.familyTools')} />
      <Card>
        <ListRow icon="users" title={tr('settings.family')} subtitle={household ? tr('settings.family.members', { name: household.name, count: members?.length ?? 1 }) : tr('settings.family.invite')} onPress={() => router.push('/settings/family')} />
        <Divider />
        <ListRow icon="layout" title={tr('settings.home')} subtitle={tr('settings.home.sub')} onPress={() => router.push('/settings/home')} />
        <Divider />
        <ListRow icon="gift" title={tr('amb.title')} subtitle={tr('amb.sub')} onPress={() => router.push('/ambassador' as never)} testID="settings-ambassador" />
        <Divider />
        <ListRow icon="bell" title={tr('nt.settingsRow')} subtitle={tr('nt.settingsRowD')} onPress={() => router.push('/settings/notifications')} testID="settings-notifs" />
        <ListRow icon="bell" title={tr('settings.reminders')} subtitle={activeReminders ? tr('settings.reminders.active', { count: activeReminders }) : tr('settings.reminders.none')} onPress={() => router.push('/settings/reminders')} />
        {iphoneCalendar.visible ? <ListRow icon="calendar" title={tr('ical.title')} subtitle={iphoneCalendar.text} onPress={() => router.push(DEVICE_CALENDAR_ROUTE as never)} testID="settings-iphone-calendar" /> : null}
        <Divider />
        <ListRow icon="star" title={tr('settings.subscription')} subtitle={premium ? tr('settings.subscription.active', { app: BRAND.name }) : tr('settings.subscription.free')} onPress={() => router.push('/settings/subscription')} />
        <Divider />
        <ListRow icon="lock" title={tr('settings.privacy')} subtitle={tr('settings.privacy.sub')} onPress={() => router.push('/settings/privacy')} />
        <Divider />
        <ListRow icon="refresh-cw" title={tr('settings.sync')} subtitle={offline.pending.length ? tr('settings.sync.pending', { count: offline.pending.length }) : offline.conflicts.length ? tr('sync.toCheck', { count: offline.conflicts.length }) : tr('settings.sync.allSent')} onPress={() => router.push('/settings/sync')} />
        {/* Outils de contrôle : mode développeur uniquement (jamais en démonstration : c'est ce que voit l'examen App Store) */}
        {devMode ? (
          <>
            <Divider />
            <ListRow icon="cpu" title={tr('settings.services')} subtitle={tr('settings.services.sub')} onPress={() => router.push('/settings/services')} />
            <ListRow icon="layers" title={tr('glass.gallery')} subtitle={tr('glass.gallery.sub')} onPress={() => router.push('/dev/glass' as never)} testID="settings-glass-gallery" />
            <ListRow icon="sliders" title={tr('lq.entry')} subtitle={tr('lq.entrySub')} onPress={() => router.push('/dev/liquid-glass' as never)} testID="settings-liquid-lab" />
            <ListRow icon="grid" title={tr('intro6.icons.gallery')} subtitle={tr('intro6.icons.gallerySub')} onPress={() => router.push('/dev/icons' as never)} testID="settings-icon-gallery" />
          </>
        ) : null}
        {isModerator ? (
          <>
            <Divider />
            <ListRow icon="shield" title={tr('settings.admin')} subtitle={tr('settings.admin.sub')} onPress={() => router.push('/admin')} />
          </>
        ) : null}
      </Card>

      <SectionTitle title={tr('settings.help')} />
      <Card>
        <ListRow icon="life-buoy" title={tr('settings.help.now')} subtitle={tr('settings.help.nowSub', { numbers: regionInfo.emergency })} danger onPress={() => router.push('/emergency')} />
        <Divider />
        <ListRow icon="message-circle" title={tr('fb.row')} subtitle={tr('fb.rowD')} onPress={() => router.push({ pathname: '/feedback', params: { from: '/settings' } } as never)} testID="settings-feedback" />
        <Divider />
        {/* Aide, visites, textes légaux, version : une page à part (Réglages tient sur un écran) */}
        <ListRow icon="help-circle" title={tr('settings.helpInfo')} subtitle={tr('settings.helpInfo.sub')} onPress={() => router.push('/settings/help' as never)} testID="settings-help-info" />
      </Card>

      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        {/* Se déconnecter / Quitter la démo : ligne de verre partagée avec Profil et Moi */}
        <SignOutRow testID="settings-sign-out" />
        {isDemo ? null : <Button label={tr('settings.signOutAll')} variant="ghost" loading={signingOut} onPress={() => signOut(true)} />}
        {isDemo ? <Text variant="caption" muted center>{tr('settings.signOut.demo')}</Text> : null}
      </View>
    </Screen>
  );
}
