/**
 * « Ma place dans la famille » (19/11/2026) : tableau de bord d'un adulte qui n'a pas créé le foyer (co-parent), et
 * vue utile pour la propriétaire aussi. Tout parle de SA place : mes enfants, mes missions, tâches du foyer, courses
 * partagées, calendrier familial, relais parentaux, rendez-vous partagés, rappels concernant les enfants, moments en famille, espace
 * Couple, mes informations. Construit avec l'existant (mêmes requêtes et écrans) ; aucune carte n'ouvre sur les
 * données personnelles de l'autre adulte (cycle, grossesse non partagée, santé, journal, ressentis).
 * 23/11/2026 : « ce qui m'attend » en grand et en liste datée, tâche ouverte dans l'adresse, fiche de correction.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { GlassCard } from '@/components/glass';
import { ListRow, SectionTitle, Text } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { StaggerList } from '@/motion';
import { InviteOtherParent } from '@/features/couple/CoupleKit';
import { useChildren } from '@/lib/data/hooks';
import { useFamilyTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useMissions } from '@/lib/data/hooks-missions';
import { useFamilyProfiles } from '@/lib/data/hooks-couple';
import { childAge } from '@/lib/domain/child';
import { isTerminal } from '@/lib/domain/missions';
import { spacing } from '@/theme/tokens';
import { HouseholdHomeCard } from '@/features/homeTrack/HouseholdHomeCard';
import { PlaceTrack } from '@/features/finishFamily/PlaceTrack';
import { t as tr, type TKey } from '@/i18n';

export default function MyPlace() {
  const { data: children } = useChildren();
  const { people, me, labelOf: personLabel } = usePeople();
  const tasks = useFamilyTasks().data ?? [];
  const missions = useMissions();
  const profiles = useFamilyProfiles().data ?? [];
  const active = missions.received.filter((m) => !isTerminal(m.mission_state) && m.mission_state !== 'declined').length;
  const adults = people.filter((p) => p.role === 'owner' || p.role === 'coparent');
  const labelOf = (id: string, role: string) => profiles.find((p) => p.user_id === id)?.family_label?.trim() || tr(`cp2.member.role.${role}` as TKey);

  const entries: { key: string; icon: Parameters<typeof ListRow>[0]['icon']; title: TKey; sub?: string; href: string }[] = [
    { key: 'missions', icon: 'check-square', title: 'cp2.place.missions', sub: tr('cp2.place.missionsSub', { count: active }), href: '/family/missions' },
    { key: 'tasks', icon: 'list', title: 'cp2.place.tasks', href: '/household' },
    { key: 'shopping', icon: 'shopping-cart', title: 'cp2.place.shopping', href: '/meals/shopping' },
    { key: 'calendar', icon: 'calendar', title: 'cp2.place.calendar', href: '/calendar' },
    // relais parentaux (nuits, temps libre) : demandés pour l'« Espace Papa / Espace co-parent » (outil 161)
    { key: 'relays', icon: 'moon', title: 'ft.place.relays', sub: tr('ft.place.relaysSub'), href: '/family/nights' },
    { key: 'appointments', icon: 'clipboard', title: 'cp2.place.appointments', href: '/appointments' },
    { key: 'reminders', icon: 'bell', title: 'cp2.place.reminders', href: '/settings/reminders' },
    { key: 'moments', icon: 'sun', title: 'cp2.place.moments', href: '/outings' },
    { key: 'couple', icon: 'heart', title: 'cp2.place.couple', sub: tr('cp2.place.coupleSub'), href: '/family/couple' },
    { key: 'info', icon: 'user', title: 'cp2.place.myInfo', sub: tr('cp2.place.myInfoSub'), href: '/family/my-info' },
  ];

  return (
    <Screen back title={tr('cp2.place.title')} subtitle={tr('cp2.place.sub')}>
      {/* Ce qui m'attend (23/11/2026) : mes tâches en grand, liste datée, tâche ouverte dans l'adresse et corrigée dans
          une fiche ; puis le foyer en un regard (relais à consulter, tâches ouvertes, prochain événement selon les droits) */}
      <PlaceTrack tasks={tasks} me={me} people={people} labelOf={personLabel} missions={active} />
      <HouseholdHomeCard />
      <InviteOtherParent testID="place-invite" />
      <SectionTitle title={tr('cp2.place.children')} />
      <GlassCard testID="place-children">
        {children?.length ? (
          <MotionList style={{ gap: 0 }}>
            {children.map((c) => (
              <MotionItem key={c.id}><ListRow key={c.id} icon="smile" title={c.first_name} subtitle={childAge(c.birth_date).label} onPress={() => router.push(`/child/${c.id}` as never)} /></MotionItem>
            ))}
          </MotionList>
        ) : <Text variant="small" muted>{tr('cp2.place.noChildren')}</Text>}
      </GlassCard>

      <SectionTitle title={tr('cp2.place.family')} />
      <StaggerList testID="place-entries">
        {entries.map((e) => (
          <ListRow key={e.key} icon={e.icon} title={tr(e.title)} subtitle={e.sub} onPress={() => router.push(e.href as never)} testID={`place-${e.key}`} />
        ))}
      </StaggerList>

      <SectionTitle title={tr('cp2.members.title')} />
      <MotionList testID="place-adults">
        {adults.map((p) => (
          <MotionItem key={p.id}><ListRow key={p.id} leading={<UserAvatar path={p.avatarPath} initial={p.initial} size={32} />} title={p.id === me ? `${p.name} (${p.label})` : p.name}
            subtitle={labelOf(p.id, p.role)} onPress={() => router.push(`/family/member/${p.id}` as never)} testID={`place-adult-${p.id === me ? 'me' : 'other'}`} /></MotionItem>
        ))}
      </MotionList>
      <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{tr('cp2.place.private')}</Text>
    </Screen>
  );
}
