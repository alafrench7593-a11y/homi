/**
 * Espace de la maman, dans le Profil (07/11/2026) : sa journée, son organisation, les documents de la famille,
 * le carnet de santé de chaque enfant et les outils pour elle. Rien de nouveau n'est inventé ici : chaque ligne
 * ouvre un outil réel de l'appli (agenda, rappels, documents, vaccins, croissance…), regroupé au même endroit.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Icon, type IconName, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { ChildAvatar } from '@/features/childAvatar';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { useDailyChecks, useToggleReminderDone, useToggleTaskDone } from '@/lib/data/hooks-autoNotifs';
import { friendlyError } from '@/lib/data/hooks-settings';
import { haptic } from '@/components/ui';
import { useAppointments, useDocuments, useJourneyState, useProfile, useReminders } from '@/lib/data/hooks';
import { useCareShifts, useFamilyEvents, useFamilyTasks } from '@/lib/data/hooks-family-load';
import { atLocal, addDays, itemsBetween, itemsOnDay } from '@/lib/domain/calendar';
import { agendaItems, remindersOn, sortDay, upcoming, type MyDayItem } from '@/lib/domain/myDay';
import { childAge } from '@/lib/domain/child';
import { todayISO } from '@/lib/domain/dates';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

const KIND_ICON: Record<MyDayItem['kind'], IconName> = { reminder: 'bell', appointment: 'calendar', event: 'star', task: 'check-square', night: 'moon', me_time: 'sun' };
const nowHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** Ma journée : rappels + agenda du foyer d'aujourd'hui, ce qui reste à venir d'abord. */
export function MyDayCard() {
  const t = useTheme();
  const day = todayISO();
  const reminders = useReminders().data ?? [];
  const events = useFamilyEvents().data ?? [];
  const appointments = useAppointments().data ?? [];
  const tasks = useFamilyTasks().data ?? [];
  const shifts = useCareShifts().data ?? [];
  const items = useMemo(() => {
    const cal = itemsOnDay(itemsBetween({ events, appointments, tasks, shifts }, atLocal(day), atLocal(addDays(day, 1))), day);
    return sortDay([...agendaItems(cal, day), ...remindersOn(reminders as never, day)]);
  }, [day, reminders, events, appointments, tasks, shifts]);
  // « C'est fait » : rappels validés aujourd'hui (daily_checks) et tâches faites
  const toast = useToast();
  const checks = useDailyChecks(day).data ?? [];
  const toggleRem = useToggleReminderDone();
  const toggleTask = useToggleTaskDone();
  const isDone = (i: MyDayItem) => (i.kind === 'reminder' ? checks.some((c) => c.reminder_id === i.refId) : !!i.done);
  const checkable = (i: MyDayItem) => i.kind === 'reminder' || i.kind === 'task';
  const doable = items.filter(checkable);
  const doneCount = doable.filter(isDone).length;
  async function toggle(i: MyDayItem) {
    const done = !isDone(i);
    try {
      if (i.kind === 'reminder') await toggleRem.mutateAsync({ reminderId: i.refId, day, done, checkId: checks.find((c) => c.reminder_id === i.refId)?.id });
      else await toggleTask.mutateAsync({ taskId: i.refId, done });
      haptic(done ? 'success' : 'light');
      if (done) toast(tr('nt.doneToast'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  // ce qui reste à faire d'abord ; ce qui est fait reste visible, coché, en fin de liste
  const next = upcoming(items, nowHHMM());
  const pending = (next.length ? next : items).filter((i) => !isDone(i));
  const finished = items.filter(isDone);
  const shown = [...pending, ...finished].slice(0, 7);
  const go = (i: MyDayItem) => {
    if (i.kind === 'reminder') return router.push(i.link ? (i.link as never) : '/settings/reminders');
    if (i.kind === 'appointment') return router.push('/appointments');
    return router.push({ pathname: '/calendar', params: { view: 'day' } } as never);
  };
  return (
    <Card testID="hub-myday">
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('hub.day.title').toUpperCase()}</Text>
          <Text weight="bold">{formatDate(atLocal(day, 12), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
        </View>
        <Text variant="small" muted testID="hub-myday-count">{doable.length ? tr('nt.doneCount', { done: doneCount, total: doable.length }) : tr('hub.day.count', { count: items.length })}</Text>
      </Row>
      {shown.length ? (
        <View style={{ marginTop: spacing.xs }}>
          {shown.map((i) => (
            <ListRow key={i.key} icon={KIND_ICON[i.kind]} testID={`hub-day-${i.kind}`}
              title={isDone(i) ? `${i.title} ✓` : i.title}
              subtitle={[i.every ? tr('hub.day.every', { from: i.every.fromHour, to: i.every.toHour, min: i.every.minutes }) : i.time ?? tr('hub.day.allDay'), isDone(i) ? tr('nt.done') : tr(`hub.kind.${i.kind}` as TKey)].join(' · ')}
              onPress={() => go(i)}
              right={checkable(i) ? (
                <Tappable accessibilityRole="checkbox" accessibilityState={{ checked: isDone(i) }} aria-checked={isDone(i)}
                  accessibilityLabel={isDone(i) ? tr('nt.undoA11y', { title: i.title }) : tr('nt.doneA11y', { title: i.title })}
                  onPress={() => void toggle(i)} hitSlop={8} testID={`hub-check-${i.refId}`}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: isDone(i) ? t.colors.success : t.colors.border, backgroundColor: isDone(i) ? t.colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {isDone(i) ? <Icon name="check" size={16} color="#FFFFFF" /> : null}
                  </View>
                </Tappable>
              ) : undefined} />
          ))}
          {items.length > shown.length ? <Text variant="small" muted style={{ marginTop: 4 }}>{tr('hub.day.more', { count: items.length - shown.length })}</Text> : null}
        </View>
      ) : (
        <Text variant="small" muted style={{ marginTop: spacing.xs }} testID="hub-myday-empty">{tr('hub.day.empty')}</Text>
      )}
      <Row wrap style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        <Button label={tr('hub.day.plan')} icon="calendar" size="sm" onPress={() => router.push({ pathname: '/calendar', params: { new: '1' } } as never)} testID="hub-plan" />
        <Button label={tr('hub.day.reminder')} icon="bell" size="sm" variant="secondary" onPress={() => router.push({ pathname: '/settings/reminders', params: { new: 'custom' } })} testID="hub-reminder" />
        <Button label={tr('tool.brain_dump')} icon="edit-3" size="sm" variant="ghost" onPress={() => router.push('/family/brain-dump')} testID="hub-dump" />
      </Row>
      <Text variant="caption" color={t.colors.textMuted} style={{ marginTop: 4 }}>{tr('hub.day.note')}</Text>
    </Card>
  );
}

/** M'organiser : agenda, rappels, organisation du foyer, échéances, carnet de la maison, charge mentale. */
export function OrganizeSection() {
  const remindersN = (useReminders().data ?? []).filter((r) => r.enabled).length;
  return (
    <>
      <SectionTitle title={tr('hub.org.title')} />
      <Card padded={false} testID="hub-organize">
        <ListRow icon="calendar" title={tr('hub.org.calendar')} subtitle={tr('hub.org.calendarD')} onPress={() => router.push('/agenda')} testID="hub-calendar" />
        <ListRow icon="bell" title={tr('nt.settingsRow')} subtitle={tr('nt.settingsRowD')} onPress={() => router.push('/settings/notifications')} testID="hub-notifs" />
        <ListRow icon="bell" title={tr('hub.org.reminders')} subtitle={tr('hub.org.remindersD', { count: remindersN })} onPress={() => router.push('/settings/reminders')} testID="hub-reminders" />
        <ListRow icon="check-square" title={tr('hub.org.family')} subtitle={tr('hub.org.familyD')} onPress={() => router.push('/family')} testID="hub-family-org" />
        <ListRow icon="calendar" title={tr('tool.family_prep')} subtitle={tr('tool.family_prep.sub')} onPress={() => router.push('/family/prep')} />
        <ListRow icon="edit-3" title={tr('tool.brain_dump')} subtitle={tr('tool.brain_dump.sub')} onPress={() => router.push('/family/brain-dump')} />
        <ListRow icon="users" title={tr('tool.family_domains')} subtitle={tr('tool.family_domains.sub')} onPress={() => router.push('/family/domains')} />
        <ListRow icon="book" title={tr('tool.house_notebook')} subtitle={tr('tool.house_notebook.sub')} onPress={() => router.push('/family/notebook')} />
      </Card>
    </>
  );
}

/** Documents de la famille : tous les documents, scanner, papiers par démarche, carnet de santé numérique. */
export function FamilyDocsSection() {
  const docs = useDocuments().data ?? [];
  return (
    <>
      <SectionTitle title={tr('hub.docs.title')} />
      <Card padded={false} testID="hub-docs">
        <ListRow icon="folder" title={tr('hub.docs.all')} subtitle={tr('hub.docs.allD', { count: docs.length })} onPress={() => router.push('/documents')} testID="hub-docs-all" />
        <ListRow icon="camera" title={tr('hub.docs.scan')} subtitle={tr('hub.docs.scanD')} onPress={() => router.push('/documents/scan')} testID="hub-docs-scan" />
        <ListRow icon="briefcase" title={tr('tool.family_papers')} subtitle={tr('tool.family_papers.sub')} onPress={() => router.push('/family/papers')} testID="hub-papers" />
        <ListRow icon="book-open" title={tr('hub.docs.book')} subtitle={tr('hub.docs.bookD')} onPress={() => router.push('/documents/book')} testID="hub-book" />
      </Card>
    </>
  );
}

function ChildHealthCard({ child }: { child: Child }) {
  const rows: { icon: IconName; key: string; to: string | { pathname: string; params: Record<string, string> } }[] = [
    { icon: 'shield', key: 'vaccines', to: `/child/${child.id}/vaccines` },
    { icon: 'trending-up', key: 'growth', to: `/child/${child.id}/growth` },
    { icon: 'activity', key: 'tracking', to: `/child/${child.id}/health-tracking` },
    { icon: 'calendar', key: 'appointments', to: { pathname: '/appointments', params: { child: child.id } } },
    { icon: 'clipboard', key: 'card', to: `/child/${child.id}/card` },
  ];
  return (
    <Card padded={false} testID={`hub-child-${child.first_name}`}>
      <ListRow leading={<ChildAvatar child={child} size={40} />} title={tr('hub.child.title', { name: child.first_name })} subtitle={childAge(child.birth_date).label} onPress={() => router.push(`/child/${child.id}`)} />
      {rows.map((r) => <ListRow key={r.key} icon={r.icon} title={tr(`hub.child.${r.key}` as TKey)} onPress={() => router.push(r.to as never)} testID={`hub-child-${child.first_name}-${r.key}`} />)}
    </Card>
  );
}

/** Carnet de santé de chaque enfant. */
export function ChildrenHealthSection({ children }: { children: Child[] }) {
  if (!children.length) return null;
  return (
    <>
      <SectionTitle title={tr('hub.child.section')} />
      <Text variant="small" muted>{tr('hub.child.intro')}</Text>
      {children.map((c) => <ChildHealthCard key={c.id} child={c} />)}
    </>
  );
}

/** Pour moi, en tant que femme : selon son parcours (cycle, grossesse, post-partum), puis le soin d'elle-même. */
export function ForMeSection() {
  const js = useJourneyState();
  const { data: profile } = useProfile();
  const body = js.body?.type ?? null;
  const journeyRow = js.postpartum ? { icon: 'heart' as IconName, key: 'postpartum', to: '/postpartum' }
    : body === 'pregnancy' ? { icon: 'moon' as IconName, key: 'pregnancy', to: '/pregnancy' }
    : body === 'cycle' || body === 'avoid' || body === 'ttc' ? { icon: 'droplet' as IconName, key: 'cycle', to: '/cycle' }
    : null;
  return (
    <>
      <SectionTitle title={tr('hub.me.title')} />
      <Card padded={false} testID="hub-me">
        {journeyRow ? <ListRow icon={journeyRow.icon} title={tr(`hub.me.${journeyRow.key}` as TKey)} onPress={() => router.push(journeyRow.to as never)} testID={`hub-me-${journeyRow.key}`} /> : null}
        <ListRow icon="heart" title={tr('profile.me')} subtitle={tr('profile.meSub')} onPress={() => router.push('/me')} testID="hub-me-space" />
        <ListRow icon="calendar" title={tr('hub.me.appointments')} subtitle={tr('hub.me.appointmentsD')} onPress={() => router.push({ pathname: '/appointments', params: { for: 'me' } })} testID="hub-me-appointments" />
        <ListRow icon="smile" title={tr('profile.mood')} onPress={() => router.push('/me/mood')} />
        <ListRow icon="cloud" title={tr('profile.sleep')} onPress={() => router.push('/me/sleep')} />
        <ListRow icon="sun" title={tr('hub.me.metime')} subtitle={tr('hub.me.metimeD')} onPress={() => router.push('/family/me-time')} />
        <ListRow icon="moon" title={tr('tool.offduty')} subtitle={tr('tool.offduty.sub')} onPress={() => router.push('/family/offduty')} />
        <ListRow icon="battery" title={tr('tool.exhaustion_check')} subtitle={tr('tool.exhaustion_check.sub')} onPress={() => router.push('/family/exhausted')} />
        {profile?.family_situation === 'solo' ? <ListRow icon="heart" title={tr('tool.solo_parent')} subtitle={tr('tool.solo_parent.sub')} onPress={() => router.push('/family/solo')} testID="hub-me-solo" /> : null}
      </Card>
      <Row style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Icon name="lock" size={14} />
        <Text variant="caption" muted style={{ flex: 1 }}>{tr('hub.me.private')}</Text>
      </Row>
    </>
  );
}
