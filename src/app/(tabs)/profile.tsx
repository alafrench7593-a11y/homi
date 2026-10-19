/** Profil : mes parcours, ma famille, mon espace et mes réglages. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Chip, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useChildren, useJourneyState, usePremium, useProfile } from '@/lib/data/hooks';
import { JOURNEY_ICON, useJourneyProfileLabel } from '@/features/journeys';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { NACRE, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function Profile() {
  const { session } = useAuth();
  const profileQ = useProfile();
  const profile = profileQ.data;
  const pregnancy = useActivePregnancy();
  const childrenQ = useChildren();
  const children = childrenQ.data;
  const premium = usePremium();
  const js = useJourneyState();
  const profileLabel = useJourneyProfileLabel();

  return (
    <View style={{ flex: 1 }}>
      <Screen back account bottomInset={96}>
        <Appear kind="scale" delay={0.06}>
          <Row style={{ marginTop: spacing.sm }}>
            <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="title" color="#FFFFFF">{(profile?.display_name ?? '•').slice(0, 1).toUpperCase()}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text variant="title" accessibilityRole="header">{profile?.display_name || tr('profile.title')}</Text>
              <Text variant="small" muted>{session?.email ?? ''}{premium ? tr('profile.premium') : ''}</Text>
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

        <SectionTitle title={tr('profile.family')} />
        {childrenQ.isLoading && !children ? <Skeleton kind="list" rows={1} /> : childrenQ.isError && !children ? (
          <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title={tr('profile.familyError')} />
        ) : null}
        <Card>
          {pregnancy && <ListRow icon="moon" title={tr('profile.pregnancy')} subtitle={pregnancyProgress(pregnancy.due_date).label} onPress={() => router.push('/pregnancy')} />}
          {(children ?? []).map((c) => <ListRow key={c.id} icon="smile" title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => router.push(`/child/${c.id}`)} />)}
          <ListRow icon="plus" title={tr('profile.addChild')} onPress={() => router.push('/profiles/new')} />
          <ListRow icon="users" title={tr('profile.partner')} subtitle={tr('profile.partnerSub')} onPress={() => router.push('/settings/family')} />
        </Card>

        <SectionTitle title={tr('profile.forMe')} />
        <Card>
          <ListRow icon="heart" title={tr('profile.me')} subtitle={tr('profile.meSub')} onPress={() => router.push('/me')} />
          <ListRow icon="cloud" title={tr('profile.sleep')} onPress={() => router.push('/me/sleep')} />
          <ListRow icon="smile" title={tr('profile.mood')} onPress={() => router.push('/me/mood')} />
          <ListRow icon="folder" title={tr('profile.documents')} onPress={() => router.push('/documents')} />
          <ListRow icon="message-square" title={tr('profile.posts')} subtitle={tr('profile.postsSub')} onPress={() => router.push('/community/profile')} />
          <ListRow icon="grid" title={tr('profile.tools')} onPress={() => router.push('/tools')} />
        </Card>

        <SectionTitle title={tr('profile.settings')} />
        <Card>
          <ListRow icon="bell" title={tr('profile.reminders')} onPress={() => router.push('/settings/reminders')} />
          <ListRow icon="star" title={tr('profile.subscription')} subtitle={premium ? tr('profile.premiumActive') : tr('profile.free')} onPress={() => router.push('/settings/subscription')} />
          <ListRow icon="lock" title={tr('profile.privacy')} onPress={() => router.push('/settings/privacy')} />
          <ListRow icon="settings" title={tr('profile.appearance')} onPress={() => router.push('/settings')} />
          <ListRow icon="life-buoy" title={tr('profile.emergency')} subtitle="15 · 112 · 3114" danger onPress={() => router.push('/emergency')} />
        </Card>
      </Screen>
    </View>
  );
}
