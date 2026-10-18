/** Profil : mes parcours, ma famille, mon espace et mes réglages. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { ErrorView, Skeleton } from '@/components/States';
import { Card, Chip, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useActivePregnancy, useChildren, usePremium, useProfile } from '@/lib/data/hooks';
import { journeyOptions } from '@/lib/domain/journeys';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { NACRE, spacing } from '@/theme/tokens';

export default function Profile() {
  const { session } = useAuth();
  const profileQ = useProfile();
  const profile = profileQ.data;
  const pregnancy = useActivePregnancy();
  const childrenQ = useChildren();
  const children = childrenQ.data;
  const premium = usePremium();
  const journeys: string[] = (profile?.journeys ?? []).map((j) => (j === 'child' ? 'newborn' : j));
  const active = journeyOptions().filter((o) => journeys.includes(o.key));

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={96}>
        <Appear kind="scale" delay={0.06}>
          <Row style={{ marginTop: spacing.sm }}>
            <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="title" color="#FFFFFF">{(profile?.display_name ?? '•').slice(0, 1).toUpperCase()}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text variant="title" accessibilityRole="header">{profile?.display_name || 'Mon profil'}</Text>
              <Text variant="small" muted>{session?.email ?? ''}{premium ? ' · Premium' : ''}</Text>
            </View>
          </Row>
        </Appear>

        {profileQ.isError && !profile ? (
          <ErrorView error={profileQ.error} onRetry={() => void profileQ.refetch()} title="Impossible d’afficher votre profil" />
        ) : null}

        <Appear kind="soft" delay={0.14}>
          {profileQ.isLoading && !profile ? <Skeleton kind="card" rows={1} /> : <Card onPress={() => router.push('/journeys')} accessibilityLabel="Changer ou ajouter un parcours">
            <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>MES PARCOURS</Text>
            <Row wrap style={{ marginTop: 6 }}>
              {active.length ? active.map((o) => <Chip key={o.key} label={o.label} icon={o.icon} selected />) : <Text muted>Aucun parcours choisi</Text>}
            </Row>
            <Text variant="small" weight="bold" color={undefined} style={{ marginTop: spacing.xs }}>Changer ou ajouter un parcours →</Text>
          </Card>}
        </Appear>

        <SectionTitle title="Ma famille" />
        {childrenQ.isLoading && !children ? <Skeleton kind="list" rows={1} /> : childrenQ.isError && !children ? (
          <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} title="Impossible d’afficher votre famille" />
        ) : null}
        <Card>
          {pregnancy && <ListRow icon="moon" title="Grossesse" subtitle={pregnancyProgress(pregnancy.due_date).label} onPress={() => router.push('/pregnancy')} />}
          {(children ?? []).map((c) => <ListRow key={c.id} icon="smile" title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => router.push(`/child/${c.id}`)} />)}
          <ListRow icon="plus" title="Ajouter un enfant ou une grossesse" onPress={() => router.push('/profiles/new')} />
          <ListRow icon="users" title="Partage avec mon ou ma partenaire" subtitle="Inviter, droits par rubrique" onPress={() => router.push('/settings/family')} />
        </Card>

        <SectionTitle title="Pour moi" />
        <Card>
          <ListRow icon="heart" title="Moi aussi" subtitle="Corps, post-partum, rééducation" onPress={() => router.push('/me')} />
          <ListRow icon="cloud" title="Mon sommeil" onPress={() => router.push('/me/sleep')} />
          <ListRow icon="smile" title="Mon humeur" onPress={() => router.push('/me/mood')} />
          <ListRow icon="folder" title="Mes documents" onPress={() => router.push('/documents')} />
          <ListRow icon="grid" title="Tous mes outils" onPress={() => router.push('/tools')} />
        </Card>

        <SectionTitle title="Réglages" />
        <Card>
          <ListRow icon="bell" title="Rappels et notifications" onPress={() => router.push('/settings/reminders')} />
          <ListRow icon="star" title="Abonnement" subtitle={premium ? 'Premium actif' : 'Version gratuite'} onPress={() => router.push('/settings/subscription')} />
          <ListRow icon="lock" title="Confidentialité et données" onPress={() => router.push('/settings/privacy')} />
          <ListRow icon="settings" title="Apparence, compte et déconnexion" onPress={() => router.push('/settings')} />
          <ListRow icon="life-buoy" title="Urgences" subtitle="15 · 112 · 3114" danger onPress={() => router.push('/emergency')} />
        </Card>
      </Screen>
    </View>
  );
}
