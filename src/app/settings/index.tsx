/** Réglages : profil, apparence, famille, rappels, abonnement, confidentialité, aide, à propos, déconnexion. */
import { LEGAL_NOTICE, PRIVACY, SUPPORT, TERMS } from '@/content/legal';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen } from '@/components/Screen';
import { DemoBanner } from '@/components/Family';
import { Banner, Button, Card, Divider, Field, type IconName, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useAuth } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { useHousehold, useHouseholdMembers, usePremium, useProfile, useReminders, useUpdateProfile } from '@/lib/data/hooks';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { cancelAllLocal, unregisterPushToken } from '@/lib/notifications';
import { useUiStore } from '@/lib/store';
import { flushQueue, useOfflineStore } from '@/lib/offline';
import { setDeveloperMode, useDeveloperMode } from '@/lib/devMode';
import { spacing } from '@/theme/tokens';
import { deviceRegion, getLocale, t as tr } from '@/i18n';
import { defaultRegion, localeInfo, REGIONS } from '@/i18n/locales';

/** Apparence (v2) : résumé « Système · Auto » ; le réglage complet est dans Réglages → Apparence et couleurs. */
const MODE_ICON: Record<'system' | 'light' | 'dark', IconName> = { system: 'smartphone', light: 'sun', dark: 'moon' };

export default function SettingsScreen() {
  const toast = useToast();
  const offline = useOfflineStore();
  const devMode = useDeveloperMode();
  const versionTaps = useRef(0);
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const household = useHousehold();
  const { data: members } = useHouseholdMembers();
  const { data: reminders } = useReminders();
  const premium = usePremium();
  const { isModerator } = useMyRoles();

  const preference = useUiStore((s) => s.themePreference);
  const palettePref = useUiStore((s) => s.palettePreference) ?? 'auto';
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
    // Audit 08 : saisies encore en file → dernier essai d'envoi, puis avertissement honnête (« Vos données restent
    // enregistrées » était faux pour elles : un autre compte qui se connecte ensuite les efface du téléphone).
    if (useOfflineStore.getState().pending.length && useOfflineStore.getState().online) await flushQueue().catch(() => 0);
    const waiting = useOfflineStore.getState().pending.length;
    const ok = await confirm(
      allDevices ? tr('settings.signOut.confirmAll') : tr('settings.signOut.confirm'),
      (allDevices ? tr('settings.signOut.bodyAll') : tr('settings.signOut.body')) + (waiting ? `\n\n${tr('rel.signOut.pending', { count: waiting })}` : ''),
      tr('settings.signOut'),
    );
    if (!ok) return;
    setSigningOut(true);
    try {
      await cancelAllLocal().catch(() => undefined);
      await unregisterPushToken();
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
    <Screen back title={tr('settings.title')} subtitle={session?.email ?? undefined}>
      <DemoBanner />

      <SectionTitle title={tr('settings.profile')} />
      <Card>
        <Field label={tr('settings.name.label')} optional value={name} onChangeText={setName} maxLength={40} error={nameError} hint={tr('settings.name.hint')} returnKeyType="done" onSubmitEditing={saveName} />
        <Button label={tr('common.save')} size="sm" variant="secondary" loading={updateProfile.isPending} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={saveName} />
      </Card>

      <Card>
        <ListRow icon="globe" title={tr('settings.language.row')} subtitle={tr('settings.language.rowSub', { language: localeInfo(getLocale()).native, country: getLocale() === 'fr' ? regionInfo.fr : regionInfo.en })} onPress={() => router.push('/settings/language')} />
      </Card>

      <SectionTitle title={tr('settings.appearance')} />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <ListRow
            icon={MODE_ICON[mode]}
            title={tr('settings.appearance.row')}
            subtitle={tr('settings.appearance.rowSub', { mode: tr(`settings.appearance.${mode}` as const), palette: tr(`settings.palette.${palettePref}` as const) })}
            onPress={() => router.push('/settings/appearance')}
            testID="settings-appearance"
          />
          <Divider />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={{ flex: 1 }}>{tr('settings.haptics')}</Text>
            <Toggle label={tr('settings.haptics')} value={haptics} onChange={setHaptics} />
          </Row>
        </View>
      </Card>

      <SectionTitle title={tr('settings.familyTools')} />
      <Card>
        <ListRow icon="users" title={tr('settings.family')} subtitle={household ? tr('settings.family.members', { name: household.name, count: members?.length ?? 1 }) : tr('settings.family.invite')} onPress={() => router.push('/settings/family')} />
        <Divider />
        <ListRow icon="layout" title={tr('settings.home')} subtitle={tr('settings.home.sub')} onPress={() => router.push('/settings/home')} />
        <Divider />
        <ListRow icon="message-circle" title={tr('fb.row')} subtitle={tr('fb.rowD')} onPress={() => router.push({ pathname: '/feedback', params: { from: '/settings' } } as never)} testID="settings-feedback" />
        <ListRow icon="bell" title={tr('nt.settingsRow')} subtitle={tr('nt.settingsRowD')} onPress={() => router.push('/settings/notifications')} testID="settings-notifs" />
        <ListRow icon="bell" title={tr('settings.reminders')} subtitle={activeReminders ? tr('settings.reminders.active', { count: activeReminders }) : tr('settings.reminders.none')} onPress={() => router.push('/settings/reminders')} />
        <Divider />
        <ListRow icon="star" title={tr('settings.subscription')} subtitle={premium ? tr('settings.subscription.active', { app: BRAND.name }) : tr('settings.subscription.free')} onPress={() => router.push('/settings/subscription')} />
        <Divider />
        <ListRow icon="user" title={tr('settings.account')} subtitle={tr('settings.account.sub')} onPress={() => router.push('/settings/account')} />
        <Divider />
        <ListRow icon="lock" title={tr('settings.privacy')} subtitle={tr('settings.privacy.sub')} onPress={() => router.push('/settings/privacy')} />
        <Divider />
        <ListRow icon="refresh-cw" title={tr('settings.sync')} subtitle={offline.pending.length ? tr('settings.sync.pending', { count: offline.pending.length }) : offline.conflicts.length ? tr('sync.toCheck', { count: offline.conflicts.length }) : tr('settings.sync.allSent')} onPress={() => router.push('/settings/sync')} />
        {devMode ? (
          <>
            <Divider />
            <ListRow icon="cpu" title={tr('settings.services')} subtitle={tr('settings.services.sub')} onPress={() => router.push('/settings/services')} />
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
        <ListRow icon="mail" title={tr('settings.help.write')} subtitle={BRAND.supportEmail} onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => toast(tr('settings.help.writeTo', { email: BRAND.supportEmail }), 'info'))} />
        <Divider />
        <ListRow icon="help-circle" title={SUPPORT.title} onPress={() => router.push('/legal/support')} testID="settings-support" />
        <Divider />
        <ListRow icon="file-text" title={TERMS.title} onPress={() => router.push('/legal/terms')} testID="settings-terms" />
        <Divider />
        <ListRow icon="lock" title={PRIVACY.title} onPress={() => router.push('/legal/privacy')} testID="settings-privacy-policy" />
        <Divider />
        <ListRow icon="info" title={LEGAL_NOTICE.title} onPress={() => router.push('/legal/notice')} testID="settings-legal-notice" />
      </Card>
      <Banner tone="info">{tr('settings.disclaimer')}</Banner>

      <SectionTitle title={tr('settings.about')} />
      <Card tone="soft">
        <Text variant="heading">{BRAND.name}</Text>
        <Text italic muted>{tr('brand.tagline')}</Text>
        {/* Ligne informative : le geste caché (7 appuis, mode développeur) reste, sans surbrillance de bouton au toucher (iOS) */}
        <Text variant="small" muted suppressHighlighting style={{ marginTop: spacing.xs }} onPress={() => {
          const n = versionTaps.current + 1;
          versionTaps.current = n;
          if (n === 7) { void setDeveloperMode(!devMode); toast(devMode ? tr('settings.devOff') : tr('settings.devOn')); versionTaps.current = 0; }
        }}>
          {isDemo ? tr('settings.versionDemo', { version }) : tr('settings.version', { version })}
        </Text>
      </Card>

      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        <Button label={tr('settings.signOut')} variant="secondary" icon="log-out" loading={signingOut} onPress={() => signOut(false)} />
        <Button label={tr('settings.signOutAll')} variant="ghost" onPress={() => signOut(true)} />
        {isDemo ? <Text variant="caption" muted center>{tr('settings.signOut.demo')}</Text> : null}
      </View>
    </Screen>
  );
}
