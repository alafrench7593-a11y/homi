/** Réglages : profil, apparence, famille, rappels, abonnement, confidentialité, aide, à propos, déconnexion. */
import React, { useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen } from '@/components/Screen';
import { DemoBanner } from '@/components/Family';
import { Banner, Button, Card, Chip, Divider, Field, type IconName, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { useAuth } from '@/lib/auth';
import { backend, isDemo } from '@/lib/backend';
import { useHousehold, useHouseholdMembers, usePremium, useProfile, useReminders, useUpdateProfile } from '@/lib/data/hooks';
import { friendlyError, useMyRoles } from '@/lib/data/hooks-settings';
import { cancelAllLocal } from '@/lib/notifications';
import { useUiStore } from '@/lib/store';
import { useOfflineStore } from '@/lib/offline';
import { setDeveloperMode, useDeveloperMode } from '@/lib/devMode';
import { previewTime, spacing, type SkyPhase } from '@/theme/tokens';
import { deviceRegion, formatTime, getLocale, t as tr } from '@/i18n';
import { defaultRegion, localeInfo, REGIONS } from '@/i18n/locales';

/** « Nuit » : thème nocturne doux. Le magasin d'état l'accepte à l'exécution (ThemeProvider sait l'afficher). */
type Appearance = 'auto' | 'light' | 'dark' | 'night';
const APPEARANCE_KEYS: Appearance[] = ['auto', 'light', 'dark', 'night'];
const APPEARANCE_ICON: Record<Appearance, IconName> = { auto: 'clock', light: 'sun', dark: 'moon', night: 'star' };
const PHASES: SkyPhase[] = ['dawn', 'day', 'dusk', 'night'];
const hhmm = (d: Date) => formatTime(d);

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
  const setTheme = useUiStore((s) => s.setTheme);
  const skyOverride = useUiStore((s) => s.skyOverride);
  const setSkyOverride = useUiStore((s) => s.setSkyOverride);
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

  const appearance: Appearance = (['light', 'dark', 'night'] as string[]).includes(preference) ? (preference as Appearance) : 'auto';

  function chooseAppearance(v: Appearance) {
    setTheme(v as Parameters<typeof setTheme>[0]);
    if (v !== 'auto') setSkyOverride(null);
  }

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
    const ok = await confirm(
      allDevices ? tr('settings.signOut.confirmAll') : tr('settings.signOut.confirm'),
      allDevices ? tr('settings.signOut.bodyAll') : tr('settings.signOut.body'),
      tr('settings.signOut'),
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
          {/* Libellés complets (« Toujours clair »…) : des pastilles qui passent à la ligne plutôt qu'un sélecteur trop étroit */}
          <View accessibilityRole="radiogroup" accessibilityLabel={tr('settings.appearance.label')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {APPEARANCE_KEYS.map((value) => (
              <Chip key={value} label={tr(`settings.appearance.${value}` as const)} icon={APPEARANCE_ICON[value]} selected={appearance === value} onPress={() => chooseAppearance(value)} testID={`appearance-${value}`} />
            ))}
          </View>
          <Text variant="small" muted>
            {tr(`settings.appearance.${appearance}Hint` as const)}
          </Text>
          <Divider />
          <Text weight="medium">{tr('settings.sky.title')}</Text>
          <Text variant="small" muted>{tr('settings.sky.hint')}</Text>
          <Row wrap>
            {PHASES.map((p) => (
              <Chip
                key={p}
                label={`${tr(`settings.sky.${p}` as const)} · ${hhmm(previewTime(p))}`}
                selected={skyOverride === p}
                onPress={() => {
                  if (appearance !== 'auto') setTheme('auto');
                  setSkyOverride(skyOverride === p ? null : p);
                }}
              />
            ))}
          </Row>
          {skyOverride ? (
            <Button label={tr('settings.sky.reset')} icon="rotate-ccw" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setSkyOverride(null)} />
          ) : null}
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
      </Card>
      <Banner tone="info">{tr('settings.disclaimer')}</Banner>

      <SectionTitle title={tr('settings.about')} />
      <Card tone="soft">
        <Text variant="heading">{BRAND.name}</Text>
        <Text italic muted>{tr('brand.tagline')}</Text>
        <Text variant="small" muted style={{ marginTop: spacing.xs }} onPress={() => {
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
