/**
 * Onglet « Moi » : deux espaces clairement séparés.
 *  · Mon profil communautaire : ce que les autres membres peuvent voir (pseudonyme, @identifiant, présentation…),
 *    et mes contenus (publications, réponses, photos, enregistrés et aimés).
 *  · Mon compte privé : profils de grossesse et d'enfants, abonnement, notifications, confidentialité, personnes
 *    bloquées, sécurité, aide, export, suppression du compte, déconnexion. Rien de cet espace n'est jamais public.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, ListRow, Row, Segmented, SectionTitle, Text } from '@/components/ui';
import { ProfileHeader, ProfileTabs } from '@/features/communityProfile';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useChildren, useCommunityProfile, usePremium, useProfile } from '@/lib/data/hooks';
import { useMyBlocks } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { cancelAllLocal, unregisterPushToken } from '@/lib/notifications';
import { BRAND } from '@/config/brand';
import { MySubscriptionSection } from '@/features/subscription';
import { localeTag, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Space = 'community' | 'account';

export default function Moi() {
  const params = useLocalSearchParams<{ tab?: Space }>();
  const [space, setSpace] = useState<Space>(params.tab === 'account' ? 'account' : 'community');
  return (
    <View style={{ flex: 1 }}>
      <Screen back account title={tr('cm3.moi.title')} bottomInset={96}>
        <Segmented label={tr('cm3.moi.space')} value={space} onChange={setSpace} options={[{ value: 'community', label: tr('cm3.moi.spaceCommunity') }, { value: 'account', label: tr('cm3.moi.spaceAccount') }]} />
        {space === 'community' ? <MyCommunity /> : <PrivateAccount />}
      </Screen>
    </View>
  );
}

function MyCommunity() {
  const q = useCommunityProfile();
  const me = q.data;
  if (q.isLoading && !me) return <Skeleton kind="card" rows={2} />;
  if (q.isError && !me) return <ErrorView error={q.error} onRetry={() => void q.refetch()} />;
  if (!me) {
    return (
      <Card testID="moi-no-profile">
        <Text variant="heading">{tr('cm3.moi.joinTitle')}</Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>{tr('cm3.moi.joinBody')}</Text>
        <Button label={tr('cm3.moi.createProfile')} icon="user-plus" style={{ marginTop: spacing.sm }} onPress={() => router.push('/community/profile')} testID="moi-create-profile" />
      </Card>
    );
  }
  return (
    <View style={{ gap: spacing.md }} testID="moi-community">
      <ProfileHeader
        p={{ pseudonym: me.pseudonym, handle: me.handle, bio: me.bio, journey_label: me.journey_label, avatar_path: me.avatar_path, avatar_preset: me.avatar_preset, joined: me.created_at?.slice(0, 7), posts: me.posts_count, comments: me.comments_count, photos: me.photos_count,
          accent: me.accent, banner: me.banner, about: me.about, badge: me.premium_badge }}
        actions={<Button label={tr('cm3.moi.edit')} size="sm" variant="secondary" icon="edit-3" onPress={() => router.push('/community/profile')} testID="moi-edit-profile" />}
      />
      <Text variant="caption" muted testID="moi-visibility">
        {me.visibility === 'minimal' ? tr('cm3.moi.visibilityMinimal') : tr('cm3.moi.visibilityFull')}
        {tr('cm3.moi.counts', { likes: me.likes_count ?? 0, saved: me.saved_count ?? 0 })}
      </Text>
      <Card testID="moi-social">
        <ListRow icon="user-check" title={tr('cm3.moi.following')} subtitle={tr('cm3.moi.followingSub', { following: me.following_count ?? 0, followers: me.followers_count ?? 0 })} onPress={() => router.push('/community/following' as never)} testID="moi-following" />
        <ListRow icon="users" title={tr('cm3.moi.groups')} subtitle={tr('cm3.moi.groupsSub')} onPress={() => router.push('/community/groups' as never)} testID="moi-groups" />
        <ListRow icon="image" title={tr('cm3.moi.albums')} subtitle={tr('cm3.moi.albumsSub')} onPress={() => router.push('/community/albums' as never)} testID="moi-albums" />
        <ListRow icon="clock" title={tr('cm3.moi.activity')} subtitle={me.premium ? tr('cm3.moi.activityFull') : tr('cm3.moi.activityPremium')} onPress={() => router.push('/community/activity' as never)} testID="moi-activity" />
        <ListRow icon="sun" title={tr('cm3.moi.today')} subtitle={tr('cm3.moi.todaySub')} onPress={() => router.push('/today' as never)} testID="moi-today" />
      </Card>
      {me.suspended_until && me.suspended_until > new Date().toISOString() ? <Banner tone="warning">{tr('cm3.moi.suspended', { date: new Date(me.suspended_until).toLocaleDateString(localeTag()) })}</Banner> : null}
      <ProfileTabs handle={me.handle ?? null} mine />
    </View>
  );
}

function PrivateAccount() {
  const toast = useToast();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const premium = usePremium();
  const blocks = useMyBlocks();
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (!(await confirm(tr('cm3.moi.signOutConfirm'), tr('cm3.moi.signOutBody'), tr('cm3.moi.signOut')))) return;
    setBusy(true);
    try {
      await cancelAllLocal().catch(() => undefined);
      await unregisterPushToken();
      await backend.auth.signOut(false);
      router.replace('/welcome');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: spacing.sm }} testID="moi-account">
      <Card>
        <Text weight="bold">{profile?.display_name || tr('cm3.moi.myAccount')}</Text>
        <Text variant="small" muted>{session?.email ?? ''}</Text>
        <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('cm3.moi.privateNote')}</Text>
      </Card>

      <SectionTitle title={tr('cm3.moi.profiles')} />
      <Card>
        {pregnancy ? <ListRow icon="moon" title={tr('cm3.moi.pregnancy')} subtitle={pregnancyProgress(pregnancy.due_date).label} onPress={() => router.push('/pregnancy')} /> : null}
        {(children ?? []).map((c) => <ListRow key={c.id} icon="smile" title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => router.push(`/child/${c.id}`)} />)}
        <ListRow icon="plus" title={tr('cm3.moi.addProfile')} onPress={() => router.push('/profiles/new')} />
        <ListRow icon="compass" title={tr('cm3.moi.journeys')} subtitle={tr('cm3.moi.journeysSub')} onPress={() => router.push('/journeys')} />
        <ListRow icon="heart" title={tr('cm3.moi.me')} subtitle={tr('cm3.moi.meSub')} onPress={() => router.push('/me')} />
      </Card>

      <MySubscriptionSection />

      <SectionTitle title={tr('cm3.moi.settings')} />
      <Card>
        <ListRow icon="star" title={tr('cm3.moi.subscription')} subtitle={premium ? tr('cm3.moi.premiumActive') : tr('cm3.moi.freeVersion')} onPress={() => router.push('/settings/subscription')} />
        <ListRow icon="bell" title={tr('cm3.moi.notifications')} subtitle={tr('cm3.moi.notificationsSub')} onPress={() => router.push('/community/notifications' as never)} testID="moi-notifications" />
        <ListRow icon="lock" title={tr('cm3.moi.privacy')} subtitle={tr('cm3.moi.privacySub')} onPress={() => router.push('/settings/privacy')} />
        <ListRow icon="slash" title={tr('cm3.moi.blocked')} subtitle={blocks.data?.length ? tr('cm3.moi.blockedCount', { count: blocks.data.length }) : tr('cm3.moi.blockedNone')} onPress={() => router.push('/community/blocked' as never)} testID="moi-blocked" />
        <ListRow icon="shield" title={tr('cm3.moi.security')} subtitle={tr('cm3.moi.securitySub')} onPress={() => router.push('/settings/account')} />
        <ListRow icon="settings" title={tr('cm3.moi.appearance')} onPress={() => router.push('/settings')} />
      </Card>

      <SectionTitle title={tr('cm3.moi.helpData')} />
      <Card>
        <ListRow icon="help-circle" title={tr('cm3.moi.help')} subtitle={tr('cm3.moi.helpSub')} onPress={() => setHelp(true)} />
        <ListRow icon="download" title={tr('cm3.moi.export')} subtitle={tr('cm3.moi.exportSub')} onPress={() => router.push('/settings/account')} />
        <ListRow icon="trash-2" title={tr('cm3.moi.deleteAccount')} subtitle={tr('cm3.moi.deleteAccountSub')} danger onPress={() => router.push('/settings/account')} />
      </Card>
      <Button label={tr('cm3.moi.signOut')} variant="ghost" icon="log-out" loading={busy} onPress={signOut} testID="moi-sign-out" />

      <Sheet visible={help} onClose={() => setHelp(false)} title={tr('cm3.moi.help')}>
        <ListRow icon="mail" title={tr('cm3.moi.writeUs')} subtitle={BRAND.supportEmail} onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => toast(tr('cm3.moi.writeUsAt', { email: BRAND.supportEmail }), 'info'))} />
        <ListRow icon="book-open" title={tr('cm3.moi.rules')} onPress={() => { setHelp(false); router.push('/community/rules' as never); }} />
        <ListRow icon="life-buoy" title={tr('cm3.moi.emergency')} subtitle="15 · 112 · 3114" danger onPress={() => { setHelp(false); router.push('/emergency'); }} />
        <Row><Text variant="caption" muted>{tr('cm3.moi.disclaimer')}</Text></Row>
      </Sheet>
    </View>
  );
}
