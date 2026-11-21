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
import { useDoseLogsSince, useLogMyDose, useUnlogDose } from '@/lib/data/hooks-myTreatments';
import { useLogDose } from '@/lib/data/hooks-needs';
import { friendlyError } from '@/lib/data/hooks-settings';
import { haptic } from '@/components/ui';
import { useAppointments, useDocuments, useJourneyState, useProfile, useReminders } from '@/lib/data/hooks';
import { useCareShifts, useFamilyEvents, useFamilyTasks } from '@/lib/data/hooks-family-load';
import { atLocal, addDays, itemsBetween, itemsOnDay } from '@/lib/domain/calendar';
import { useHouseholdActivities } from '@/lib/data/hooks-partiels2';
import { sessionsBetween } from '@/features/activities/domain';
import { agendaItems, remindersOn, sortDay, upcoming, type MyDayItem } from '@/lib/domain/myDay';
import { childAge } from '@/lib/domain/child';
import { todayISO } from '@/lib/domain/dates';
import type { Child } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { ToolLinks } from '@/features/toolHub/ToolLinks';
import { toolName } from '@/lib/domain/toolCatalog';
import { CheckMark } from '@/motion/CheckMark';

const KIND_ICON: Record<MyDayItem['kind'], IconName> = { reminder: 'bell', appointment: 'calendar', event: 'star', task: 'check-square', night: 'moon', me_time: 'sun', activity: 'award' };
const nowHHMM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** Ma journée : rappels + agenda du foyer d'aujourd'hui, ce qui reste à venir d'abord. */
export function MyDayCard() {
  const t = useTheme();
  const day = todayISO();
  const reminders = useReminders().data ?? [];
  const events = useFamilyEvents().data ?? [];
  const activityRows = useHouseholdActivities().data;
  const appointments = useAppointments().data ?? [];
  const tasks = useFamilyTasks().data ?? [];
  const shifts = useCareShifts().data ?? [];
  const items = useMemo(() => {
    const activities = (activityRows ?? []).flatMap((a) => sessionsBetween(a, atLocal(day), atLocal(addDays(day, 1)))
      .map((s) => ({ id: `${a.id}:${s.starts}`, activityId: a.id, childId: a.child_id, title: a.name, starts: s.starts, ends: s.ends, location: a.place })));
    const cal = itemsOnDay(itemsBetween({ events, appointments, tasks, shifts, activities }, atLocal(day), atLocal(addDays(day, 1))), day);
    return sortDay([...agendaItems(cal, day), ...remindersOn(reminders as never, day)]);
  }, [day, reminders, events, appointments, tasks, shifts, activityRows]);
  // « C'est fait » : rappels validés aujourd'hui (daily_checks) et tâches faites
  const toast = useToast();
  const checks = useDailyChecks(day).data ?? [];
  const toggleRem = useToggleReminderDone();
  const toggleTask = useToggleTaskDone();
  // Prise de médicament (rappel lié à un traitement, le mien ou celui d'un enfant) : cocher = « Pris » (07/11/2026)
  const doseLogs = useDoseLogsSince(atLocal(day).toISOString());
  const logMine = useLogMyDose();
  const logChild = useLogDose();
  const unlog = useUnlogDose();
  const doseOf = (i: MyDayItem) => {
    const r = i.kind === 'reminder' && i.time && !i.every ? reminders.find((x) => x.id === i.refId) : undefined;
    const treatmentId = r?.treatment_id ?? r?.my_treatment_id;
    if (!r || !treatmentId) return null;
    const [h, m] = i.time!.split(':').map(Number);
    const at = atLocal(day); at.setHours(h, m, 0, 0);
    const mine = !r.treatment_id;
    const log = ((mine ? doseLogs.mine : doseLogs.child) ?? []).find((l) => l.treatment_id === treatmentId && new Date(l.scheduled_for).getTime() === at.getTime()) ?? null;
    return { mine, treatmentId, scheduledFor: at.toISOString(), log };
  };
  const isDone = (i: MyDayItem) => {
    const d = doseOf(i);
    if (d) return d.log?.status === 'taken';
    return i.kind === 'reminder' ? checks.some((c) => c.reminder_id === i.refId) : !!i.done;
  };
  const checkable = (i: MyDayItem) => i.kind === 'reminder' || i.kind === 'task';
  const doable = items.filter(checkable);
  const doneCount = doable.filter(isDone).length;
  async function toggle(i: MyDayItem) {
    const done = !isDone(i);
    let queued = false;
    try {
      const d = doseOf(i);
      if (d) {
        if (!done && d.log) await unlog.mutateAsync({ table: d.mine ? 'my_treatment_logs' : 'treatment_logs', id: d.log.id });
        else if (done) {
          const v = { treatment_id: d.treatmentId, scheduled_for: d.scheduledFor, status: 'taken' as const, existingId: d.log?.id };
          queued = (d.mine ? await logMine.mutateAsync(v) : await logChild.mutateAsync(v)) === 'queued';
        }
      } else if (i.kind === 'reminder') queued = (await toggleRem.mutateAsync({ reminderId: i.refId, day, done, checkId: checks.find((c) => c.reminder_id === i.refId)?.id })) === 'queued';
      else await toggleTask.mutateAsync({ taskId: i.refId, done });
      haptic(done ? 'success' : 'light');
      if (queued) toast(tr('u7.track.queued'), 'info');
      else if (done) toast(tr('nt.doneToast'));
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
    if (i.kind === 'activity' && i.link) return router.push(i.link as never);
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
                    <CheckMark checked={!!(isDone(i))} size={18} color="#FFFFFF" />
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
        <Button label={toolName('brain_dump')} icon="edit-3" size="sm" variant="ghost" onPress={() => router.push('/family/brain-dump')} testID="hub-dump" />
      </Row>
      <Text variant="caption" color={t.colors.textMuted} style={{ marginTop: 4 }}>{tr('hub.day.note')}</Text>
    </Card>
  );
}

/** Raccourcis du profil : choix et ordre seulement (identifiants du registre central ; le reste vient du catalogue). */
const ORGANIZE_TOOLS = ['family_calendar', 'medications', 'reminders', 'family_tasks', 'family_prep', 'brain_dump', 'family_domains', 'house_notebook'] as const;
const DOCS_TOOLS = ['documents', 'family_papers', 'health_book'] as const;
const CHILD_HEALTH_TOOLS = ['kid_vaccines', 'kid_profile.growth', 'kid_health', 'appointments', 'kid_card'] as const;
const ME_TOOLS = ['appointments', 'mood', 'sleep', 'family_metime', 'offduty', 'exhaustion_check'] as const;

/** M'organiser : agenda, rappels, organisation du foyer, échéances, carnet de la maison, charge mentale. */
export function OrganizeSection() {
  const remindersN = (useReminders().data ?? []).filter((r) => r.enabled).length;
  return (
    <>
      <SectionTitle title={tr('hub.org.title')} />
      <ToolLinks ids={ORGANIZE_TOOLS} status={{ reminders: tr('hub.org.remindersD', { count: remindersN }) }} allOf="family" testID="hub-organize" />
      {/* Réglage (ce n'est pas un outil) : quelles notifications je reçois */}
      <Card padded={false}>
        <ListRow icon="bell" title={tr('nt.settingsRow')} subtitle={tr('nt.settingsRowD')} onPress={() => router.push('/settings/notifications')} testID="hub-notifs" />
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
      <ToolLinks ids={DOCS_TOOLS} status={{ documents: tr('hub.docs.allD', { count: docs.length }) }} testID="hub-docs" />
      {/* Action de l'écran Documents (numériser) : pas un outil du catalogue */}
      <Button label={tr('hub.docs.scan')} icon="camera" variant="secondary" size="sm" onPress={() => router.push('/documents/scan')} style={{ alignSelf: 'flex-start' }} testID="hub-docs-scan" />
    </>
  );
}

function ChildHealthCard({ child }: { child: Child }) {
  return (
    <View testID={`hub-child-${child.first_name}`} style={{ gap: spacing.xs }}>
      <Card padded={false}>
        <ListRow leading={<ChildAvatar child={child} size={40} />} title={tr('hub.child.title', { name: child.first_name })} subtitle={childAge(child.birth_date).label} onPress={() => router.push(`/child/${child.id}`)} />
      </Card>
      <ToolLinks ids={CHILD_HEALTH_TOOLS} subject={{ type: 'child', id: child.id }} testID={`hub-child-${child.first_name}-tools`} />
    </View>
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
  const journeyTool = js.postpartum ? 'pp_recovery' : body === 'pregnancy' ? 'preg_evolution' : body === 'cycle' || body === 'avoid' || body === 'ttc' ? 'cycle_home' : null;
  return (
    <>
      <SectionTitle title={tr('hub.me.title')} />
      <View testID="hub-me">
        <ToolLinks ids={[...(journeyTool ? [journeyTool] : []), ...ME_TOOLS, ...(profile?.family_situation === 'solo' ? ['solo_parent'] : [])]} allOf="health" testID="hub-me-tools" />
      </View>
      {/* L'espace « Moi aussi » (un écran d'ensemble, pas un outil du catalogue) */}
      <Card padded={false}>
        <ListRow icon="heart" title={tr('profile.me')} subtitle={tr('profile.meSub')} onPress={() => router.push('/me')} testID="hub-me-space" />
      </Card>
      <Row style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Icon name="lock" size={14} />
        <Text variant="caption" muted style={{ flex: 1 }}>{tr('hub.me.private')}</Text>
      </Row>
    </>
  );
}
