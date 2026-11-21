/**
 * Profil : mes parcours, ma famille, mon espace et mes réglages. Un compte qui n'est QUE nounou voit un profil à part
 * (son compte, ses gardes, ses réglages : `CaregiverProfile`), jamais les outils du foyer.
 */
import { AppsLogo } from '@/brand/toolGlass/AppsLogo';
import React, { useState } from 'react';
import { View } from 'react-native';
import { ALL_VIDEOS, TUTOS } from '@/lib/domain/officialVideos';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { UserAvatar } from '@/components/UserAvatar';
import { avatarInitial } from '@/components/AccountActions';
import { ProfilePhotoSheet } from '@/features/profilePhoto/ProfilePhotoSheet';
import { ChildAvatar } from '@/features/childAvatar';
import { MoodSupportCard } from '@/features/mood/MoodSupportCard';
import { ChildrenHealthSection, FamilyDocsSection, ForMeSection, MyDayCard, OrganizeSection } from '@/features/profileHub/ProfileHub';
import { useTheme } from '@/theme/ThemeProvider';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Appear } from '@/components/Appear';
import { MySubscriptionSection } from '@/features/subscription';
import { ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Chip, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useArticles, useChildren, useJourneyState, useMemberships, usePremium, useProfile } from '@/lib/data/hooks';
import { JOURNEY_ICON, useJourneyProfileLabel } from '@/features/journeys';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { ToolLinks } from '@/features/toolHub/ToolLinks';
import { useCycleSharedWithMe } from '@/lib/data/hooks-cycle3';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { CaregiverProfile } from '@/features/nounou/CaregiverProfile';
import { useHelpNumbers } from '@/lib/domain/emergencyNumbers';
import { MotionItem, MotionList } from '@/motion/ListMotion';

export default function Profile() {
  const memberships = useMemberships();
  // rôle inconnu : on n'affiche pas les outils du foyer « en attendant » (un compte nounou ne doit jamais les voir)
  if (memberships.isLoading && !memberships.data) return <Screen back account bottomInset={TAB_SCREEN_INSET}><Skeleton kind="card" rows={2} /></Screen>;
  return isCaregiverOnly(memberships.data) ? <CaregiverProfile /> : <FamilyProfile />;
}

function FamilyProfile() {
  const sharedCycles = useCycleSharedWithMe();
  const { session } = useAuth();
  const profileQ = useProfile();
  const profile = profileQ.data;
  const pregnancy = useActivePregnancy();
  const childrenQ = useChildren();
  const children = childrenQ.data;
  const premium = usePremium();
  const t = useTheme();
  const help = useHelpNumbers();
  const [photoOpen, setPhotoOpen] = useState(false);
  const articleCount = useArticles().data?.length ?? 0;
  const js = useJourneyState();
  const profileLabel = useJourneyProfileLabel();

  return (
    <View style={{ flex: 1 }}>
      <Screen back account bottomInset={TAB_SCREEN_INSET}>
        <Appear kind="scale" delay={0.06}>
          <Row style={{ marginTop: spacing.sm }}>
            {/* Photo de profil (07/11/2026) : un appui pour l'ajouter, la changer ou la supprimer */}
            <Tappable accessibilityRole="button" accessibilityLabel={profile?.avatar_path ? tr('pphoto.change') : tr('pphoto.add')} onPress={() => setPhotoOpen(true)} testID="profile-photo">
              <UserAvatar path={profile?.avatar_path} initial={avatarInitial(profile?.display_name, session?.email)} size={72} testID="profile-avatar" />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: t.tokens.action.fill, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.colors.background }}>
                <Icon name="camera" size={13} color={t.tokens.action.text} />
              </View>
            </Tappable>
            <View style={{ flex: 1 }}>
              <Text variant="title" accessibilityRole="header">{profile?.display_name || tr('profile.title')}</Text>
              <Text variant="small" muted>{session?.email ?? ''}{premium ? tr('profile.premium') : ''}</Text>
              <Tappable accessibilityRole="button" onPress={() => setPhotoOpen(true)} style={{ minHeight: 32, justifyContent: 'center' }} testID="profile-photo-link">
                <Text variant="small" weight="bold" color={t.colors.primary}>{profile?.avatar_path ? tr('pphoto.change') : tr('pphoto.add')}</Text>
              </Tappable>
            </View>
          </Row>
        </Appear>

        {profileQ.isError && !profile ? (
          <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title={tr('profile.loadError')} />
        ) : null}

        <Appear kind="soft" delay={0.14}>
          {js.query.isLoading && !js.loaded ? <Skeleton kind="card" rows={1} /> : <Card>
            <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('profile.journeys')}</Text>
            <Row wrap style={{ marginTop: 6 }}>
              {js.active.length ? js.active.map((j) => <Chip key={j.id} label={profileLabel(j, children)} icon={JOURNEY_ICON[j.type]} selected />) : <Text muted>{tr('profile.noJourney')}</Text>}
            </Row>
            {/* Bouton visible : changer, terminer ou ajouter un parcours ; anciens parcours consultables */}
            <Button label={tr('pj.editJourney')} icon="compass" onPress={() => router.push('/journeys')} style={{ marginTop: spacing.sm }} full testID="edit-journey" />
            {js.archived.length ? <Text variant="small" muted style={{ marginTop: 6 }}>{tr('pj.profile.previous', { count: js.archived.length })}</Text> : null}
          </Card>}
        </Appear>

        {/* Espace de la maman (07/11/2026) : sa journée, son organisation, les documents, la santé des enfants, elle */}
        <MoodSupportCard testID="profile-mood-support" />
        <Appear kind="soft" delay={0.18}><MyDayCard /></Appear>
        <OrganizeSection />
        <FamilyDocsSection />
        <ChildrenHealthSection children={children ?? []} />
        <ForMeSection />

        <SectionTitle title={tr('profile.learn')} />
        <ToolLinks ids={['ask', 'library', 'videos', 'videos.tutos']} status={{ library: tr('lib.profile.sub', { count: articleCount }), videos: tr('vid.profileSub', { count: ALL_VIDEOS.length }), 'videos.tutos': tr('vid.tutosSub', { count: TUTOS.length }) }} allOf="health" testID="profile-learn" />

        <SectionTitle title={tr('profile.family')} />
        {childrenQ.isLoading && !children ? <Skeleton kind="list" rows={1} /> : childrenQ.isError && !children ? (
          <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title={tr('profile.familyError')} />
        ) : null}
        <Card>
          {pregnancy && <ListRow icon="moon" title={tr('profile.pregnancy')} subtitle={pregnancyProgress(pregnancy.due_date).label} onPress={() => router.push('/pregnancy')} />}
          <MotionList>{(children ?? []).map((c) => <MotionItem key={c.id}><ListRow key={c.id} icon="smile" leading={<ChildAvatar child={c} size={36} />} testID={`profile-child-${c.first_name}`} title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => router.push(`/child/${c.id}`)} /></MotionItem>)}</MotionList>
          <ListRow icon="plus" title={tr('profile.addChild')} onPress={() => router.push('/profiles/new')} />
          <ListRow icon="users" title={tr('profile.partner')} subtitle={tr('profile.partnerSub')} onPress={() => router.push('/settings/family')} />
        </Card>

        <SectionTitle title={tr('profile.accountCommunity')} />
        <Card>
          <ListRow icon="message-square" title={tr('profile.posts')} subtitle={tr('profile.postsSub')} onPress={() => router.push('/community/profile')} />
          <ListRow icon="at-sign" title={tr('profile.community')} subtitle={tr('profile.communitySub')} onPress={() => router.push('/moi' as never)} testID="profile-community" />
          <ListRow icon="lock" title={tr('profile.account')} subtitle={tr('profile.accountSub')} onPress={() => router.push({ pathname: '/moi', params: { tab: 'account' } } as never)} testID="profile-account" />
          {sharedCycles.data?.length ? <ListRow icon="users" title={tr('c3.partner.open')} subtitle={tr('c3.partner.openSub')} onPress={() => router.push('/partner/cycle' as never)} testID="profile-partner-cycle" /> : null}
          <ListRow leading={<AppsLogo size={28} testID="profile-tools-logo" />} title={tr('profile.tools')} onPress={() => router.push('/tools')} />
        </Card>

        <MySubscriptionSection />

        <SectionTitle title={tr('profile.settings')} />
        <Card>
          <ListRow icon="bell" title={tr('nt.settingsRow')} subtitle={tr('nt.settingsRowD')} onPress={() => router.push('/settings/notifications')} testID="profile-notifs" />
          <ListRow icon="bell" title={tr('profile.reminders')} onPress={() => router.push('/settings/reminders')} />
          <ListRow icon="star" title={tr('profile.subscription')} subtitle={premium ? tr('profile.premiumActive') : tr('profile.free')} onPress={() => router.push('/settings/subscription')} />
          <ListRow icon="lock" title={tr('profile.privacy')} onPress={() => router.push('/settings/privacy')} />
          <ListRow icon="settings" title={tr('profile.appearance')} onPress={() => router.push('/settings')} />
          <ListRow icon="message-circle" title={tr('fb.row')} subtitle={tr('fb.rowD')} onPress={() => router.push({ pathname: '/feedback', params: { from: '/profile' } } as never)} testID="profile-feedback" />
          <ListRow icon="life-buoy" title={tr('profile.emergency')} subtitle={help.summary} danger onPress={() => router.push('/emergency')} />
        </Card>
      </Screen>
      <ProfilePhotoSheet visible={photoOpen} onClose={() => setPhotoOpen(false)} />
    </View>
  );
}
