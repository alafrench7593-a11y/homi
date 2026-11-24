/**
 * Accueil — le foyer en un regard (22/11/2026) : relais à consulter (demandes ouvertes qui me sont adressées), tâches
 * ouvertes (dont les miennes) et prochain événement familial, SEULEMENT si mes droits me donnent l'agenda (propriétaire
 * ou « listes », dans mon périmètre d'enfants). Mêmes tables que les mini-apps (care_requests, family_tasks,
 * family_events) : rien n'est recopié. Rien à montrer : la carte ne s'affiche pas (pas de zéro inventé).
 * À insérer dans l'accueil par l'intégrateur : <HouseholdHomeCard />.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { useMyMembership } from '@/lib/data/hooks';
import { useCareRequests, useFamilyEvents, useFamilyTasks } from '@/lib/data/hooks-family-load';
import { householdHome } from '@/lib/domain/homeTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { TABULAR } from './kit';

export function HouseholdHomeCard() {
  const t = useTheme();
  const me = useUserId();
  const member = useMyMembership();
  const requests = useCareRequests().data;
  const tasks = useFamilyTasks().data;
  const events = useFamilyEvents().data;
  const s = useMemo(() => householdHome({ me, member, requests: requests ?? [], tasks: tasks ?? [], events: events ?? [], now: new Date() }), [me, member, requests, tasks, events]);
  if (!requests && !tasks) return null;
  if (!s.relays && !s.open && !s.next) return null;
  const rows: { icon: IconName; text: string; to: string; testID: string }[] = [];
  if (s.relays) rows.push({ icon: 'repeat', text: tr('hm.home.relays', { count: s.relays }), to: '/family', testID: 'home-household-relays' });
  if (s.open) rows.push({ icon: 'check-square', text: s.mine ? tr('hm.home.tasksMine', { count: s.open, mine: s.mine }) : tr('hm.home.tasks', { count: s.open }), to: '/family', testID: 'home-household-tasks' });
  if (s.next) {
    const d = new Date(s.next.starts_at);
    rows.push({ icon: 'calendar', text: tr('hm.home.next', { title: s.next.title, when: `${formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' })} · ${clock(d)}` }), to: `/calendar?day=${s.next.starts_at.slice(0, 10)}`, testID: 'home-household-next' });
  }
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }} testID="home-household">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name="home" size={16} color={t.colors.textMuted} />
        <Text variant="small" weight="medium" style={{ flex: 1 }} accessibilityRole="header">{tr('hm.home.title')}</Text>
      </View>
      {rows.map((r) => (
        <Tappable key={r.testID} accessibilityRole="button" accessibilityLabel={r.text} testID={r.testID} onPress={() => router.push(r.to as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
          <Icon name={r.icon} size={17} color={t.colors.text} />
          <Text weight="medium" style={[{ flex: 1 }, TABULAR]} numberOfLines={2} intentionalTruncation>{r.text}</Text>
          <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
        </Tappable>
      ))}
    </Glass>
  );
}
