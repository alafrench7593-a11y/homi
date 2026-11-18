/**
 * Famille → <Prénom> → Profil (19/11/2026) : le profil FAMILIAL d'un adulte du foyer — prénom, photo, rôle choisi
 * (« Papa », « Maman », « Co-parent »…), missions en cours, responsabilités, disponibilités partagées, ce qu'il ou elle
 * a mis au calendrier familial, activités avec les enfants. Seulement ce que la personne a choisi de partager
 * (family_member_profiles, réglé dans « Mes informations ») et toujours des données FAMILIALES, déjà soumises aux droits
 * du foyer : aucune donnée personnelle (cycle, santé, journal, ressentis) n'est lue ici.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { GlassCard } from '@/components/glass';
import { ListRow, SectionTitle, Text } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { StaggerList } from '@/motion';
import { StateLabel } from '@/features/missions/MissionCard';
import { useHouseholdMembers } from '@/lib/data/hooks';
import { useFamilyEvents, usePeople } from '@/lib/data/hooks-family-load';
import { useMissions } from '@/lib/data/hooks-missions';
import { useDomains, useOffDuty } from '@/lib/data/hooks-mental';
import { DEFAULT_SHARE, useFamilyProfiles } from '@/lib/data/hooks-couple';
import { isTerminal, missionHref } from '@/lib/domain/missions';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { personOf, me } = usePeople();
  const { data: members } = useHouseholdMembers();
  const member = members?.find((m) => m.user_id === id) ?? null;
  const person = personOf(id);
  const profile = useFamilyProfiles().data?.find((p) => p.user_id === id) ?? null;
  const share = { ...DEFAULT_SHARE, ...(profile ?? {}) };
  const isMe = id === me;
  const allowed = (k: keyof typeof DEFAULT_SHARE) => isMe || !!share[k];
  const missions = useMissions().all.filter((m) => m.assignee_id === id && !isTerminal(m.mission_state) && m.mission_state !== 'declined');
  const domains = (useDomains().data ?? []).filter((d) => d.owner_id === id);
  const off = (useOffDuty().data ?? []).filter((o) => o.user_id === id && Date.parse(o.ends_at) > Date.now());
  const events = useFamilyEvents().data;
  const now = Date.now();
  const calendar = useMemo(() => (events ?? []).filter((e) => e.created_by === id && Date.parse(e.starts_at) >= now - 3600_000).slice(0, 5), [events, id, now]);
  const activities = useMemo(() => (events ?? []).filter((e) => e.created_by === id && !!e.child_id && Math.abs(Date.parse(e.starts_at) - now) < 7 * 86400_000).slice(0, 5), [events, id, now]);

  if (!member || !person) {
    return <Screen back title={tr('cp2.member.title')}><EmptyState icon="user-x" title={tr('cp2.member.unknown')} /></Screen>;
  }
  const role = profile?.family_label?.trim() || tr(`cp2.member.role.${member.role}` as TKey);
  const notShared = <Text variant="small" muted>{tr('cp2.member.notShared')}</Text>;

  return (
    <Screen back title={person.name} subtitle={tr('cp2.member.title')}>
      <GlassCard testID="member-head">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <UserAvatar path={person.avatarPath} initial={person.initial} size={56} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="heading" testID="member-name">{person.name}</Text>
            <Text variant="small" muted testID="member-role">{role}</Text>
          </View>
        </View>
      </GlassCard>
      {!isMe ? <Text variant="caption" muted>{tr('cp2.member.onlyShared', { name: person.name })}</Text> : null}

      <SectionTitle title={tr('cp2.member.missions')} />
      <View testID="member-missions">
        {!allowed('share_missions') ? notShared : missions.length ? (
          <StaggerList>{missions.map((m) => (
            <ListRow key={m.id} icon="check-square" title={m.title} right={<StateLabel state={m.mission_state} />} onPress={() => router.push(missionHref(m.id) as never)} />
          ))}</StaggerList>
        ) : <Text variant="small" muted>{tr('cp2.member.noMissions')}</Text>}
      </View>

      <SectionTitle title={tr('cp2.member.domains')} />
      <View testID="member-domains">
        {!allowed('share_domains') ? notShared : domains.length
          ? <Text variant="small">{domains.map((d) => tr(`cm.domain.${d.key}` as TKey)).join(' · ')}</Text>
          : <Text variant="small" muted>{tr('cp2.member.noDomains')}</Text>}
      </View>

      <SectionTitle title={tr('cp2.member.availability')} />
      <View testID="member-availability">
        {!allowed('share_availability') ? notShared : off.length
          ? <Text variant="small">{tr('cp2.member.offduty', { time: formatDate(off[0].ends_at, { weekday: 'short', hour: '2-digit', minute: '2-digit' }) })}</Text>
          : <Text variant="small" muted>{tr('cp2.member.available')}</Text>}
      </View>

      <SectionTitle title={tr('cp2.member.calendar')} />
      <View testID="member-calendar">
        {!allowed('share_calendar') ? notShared : calendar.length ? calendar.map((e) => (
          <ListRow key={e.id} icon="calendar" title={e.title} subtitle={formatDate(e.starts_at, { weekday: 'short', day: 'numeric', month: 'short', hour: e.all_day ? undefined : '2-digit', minute: e.all_day ? undefined : '2-digit' })} onPress={() => router.push('/calendar')} />
        )) : <Text variant="small" muted>{tr('cp2.member.noCalendar')}</Text>}
      </View>

      <SectionTitle title={tr('cp2.member.activities')} />
      <View testID="member-activities">
        {!allowed('share_activities') ? notShared : activities.length ? activities.map((e) => (
          <ListRow key={e.id} icon="smile" title={e.title} subtitle={formatDate(e.starts_at, { weekday: 'short', day: 'numeric', month: 'short' })} />
        )) : <Text variant="small" muted>{tr('cp2.member.noActivities')}</Text>}
      </View>
      {isMe ? <ListRow icon="sliders" title={tr('cp2.info.title')} subtitle={tr('cp2.info.sub')} onPress={() => router.push('/family/my-info')} testID="member-my-info" /> : null}
    </Screen>
  );
}
