/**
 * Agenda familial : événements du foyer, rendez-vous, tâches datées, relais de nuit et temps pour soi.
 * Vues jour, semaine, mois et agenda. Créer, modifier, déplacer, supprimer. Export iCalendar (.ics)
 * importable dans Google Agenda, Apple Calendrier ou Outlook — sans données de santé par défaut.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { ErrorView, Skeleton } from '@/components/States';
import { usePop } from '@/components/Motion';
import { Flash, SlideSwap } from '@/components/MotionKit';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Icon, IconButton, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { parseFrDateTime, splitLocal } from '@/features/familyLoad';
import { useAppointments, useChildren, useHouseholdId, useMyMembership } from '@/lib/data/hooks';
import { usePlannedMoments } from '@/lib/data/hooks-calmMoments';
import { useRespondMission } from '@/lib/data/hooks-missions';
import { useUserId } from '@/lib/auth';
import { isMission } from '@/lib/domain/missions';
import { canCompleteTask, type TaskLike } from '@/features/homeToday/todayModel';
import { feedUrl, useCalendarFeeds, useCreateCalendarFeed, useRevokeCalendarFeed, webcalUrl } from '@/lib/data/hooks-calendar';
import { backendUrl, isDemo } from '@/lib/backend';
import { useCareShifts, useDeleteEvent, useFamilyEvents, useFamilyTasks, usePeople, useSaveEvent, useSaveTask } from '@/lib/data/hooks-family-load';
import { BriefStrip, DayList, DayRow, DaySection, DaySeparator, DoneButton, DayTimeline, type DayRowSpec, type DayState } from '@/features/day5/DayParts';
import { WeekStrip } from '@/features/day5/WeekStrip';
import { threadStates } from '@/lib/domain/dayThread';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  EVENT_KINDS, SOURCE_LABEL, addDays, addMonths, atLocal, dayKey, itemsBetween, itemsOnDay, monthGrid, overlaps, toIcs, weekStart,
  type CalendarItem, type EventKind, type FamilyEvent,
} from '@/lib/domain/calendar';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { exportTextFile } from '@/lib/exportData';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { ThreadState } from '@/lib/domain/dayThread';
import { Tappable } from '@/components/Tappable';
import { t as tr, formatDate, formatTime, type TKey } from '@/i18n';
import { homiKey, sortAgenda, type DeviceAgendaItem } from '@/lib/deviceCalendar';
import { useDeviceAgenda } from '@/lib/deviceCalendar/hooks';
import { AddToDeviceCalendar, DeviceCalendarEntry, DeviceEventSheet } from '@/features/deviceCalendar/DeviceCalendarParts';

type View_ = 'day' | 'week' | 'month' | 'agenda';
const hm = (iso: string) => formatTime(iso);
const longDay = (day: string) => formatDate(atLocal(day, 12), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());

/** Une ligne de l'agenda : élément HOMI, ou événement du calendrier de l'iPhone (lecture seule, jamais enregistré). */
type Entry = CalendarItem | DeviceAgendaItem;
const isDevice = (i: Entry): i is DeviceAgendaItem => i.source === 'device';
/** Événements du téléphone qui touchent un jour (un événement sans durée compte le jour où il a lieu). */
function deviceOnDay(items: DeviceAgendaItem[], day: string): DeviceAgendaItem[] {
  const a = atLocal(day).getTime();
  const b = atLocal(addDays(day, 1)).getTime();
  return items.filter((i) => { const s = Date.parse(i.starts); const e = Date.parse(i.ends); return s < b && (e > a || (e === s && s >= a)); });
}

type Draft = { id?: string; title: string; kind: EventKind; date: string; from: string; to: string; allDay: boolean; location: string; notes: string; recurrence: 'none' | 'daily' | 'weekly' | 'monthly'; until: string; childId: string | null };

/** Agenda du foyer. `inTab` : affiché comme route d'onglet (/agenda) : bouton retour et place pour la barre du bas. */
export function FamilyCalendarScreen({ inTab = false }: { inTab?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ view?: View_; new?: string }>();
  const [view, setView] = useState<View_>(params.view ?? 'week');
  const [cursor, setCursor] = useState(todayISO());
  const [draft, setDraft] = useState<Draft | null>(null);
  /** Occurrence touchée (événement répété) : celle qui part vers le calendrier de l'iPhone si la série ne peut pas l'être. */
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const [deviceItem, setDeviceItem] = useState<DeviceAgendaItem | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [withHealth, setWithHealth] = useState(false);
  const eventsQ = useFamilyEvents();
  const appointmentsQ = useAppointments();
  const tasksQ = useFamilyTasks();
  const shiftsQ = useCareShifts();
  // Moments à deux planifiés (179) : seulement ceux de la personne, jamais exportés (privés)
  const plannedMoments = usePlannedMoments();
  const moments = useMemo(() => plannedMoments.map((m) => ({ id: m.id, title: tr(`mom.idea.${m.idea_key}.title` as TKey), planned_at: m.planned_at as string, duration_minutes: m.duration_minutes })), [plannedMoments]);
  const { data: appointments } = appointmentsQ;
  const { data: tasks } = tasksQ;
  const { data: shifts } = shiftsQ;
  // Une source qui n'a pas pu se charger : on le dit, plutôt que d'afficher « rien de prévu »
  const failedQs = [eventsQ, appointmentsQ, tasksQ, shiftsQ].filter((q) => q.isError && !q.data);
  const { data: children } = useChildren();
  const { labelOf } = usePeople();
  const save = useSaveEvent();
  const del = useDeleteEvent();
  const saveTask = useSaveTask();
  const respond = useRespondMission();
  const me = useUserId();
  const membership = useMyMembership();
  const canEdit = !!membership && (membership.role === 'owner' || (membership.can_edit ?? []).includes('lists'));
  /**
   * « Fait » seulement quand c'est permis (même règle que l'accueil) : une mission se termine par mission_respond
   * (son destinataire, jamais la mission de quelqu'un d'autre), une tâche simple par son statut.
   */
  const taskOf = (id: string) => (tasks ?? []).find((x) => x.id === id) as TaskLike | undefined;
  const canFinish = (id: string) => { const x = taskOf(id); return !!x && canCompleteTask(x, me, canEdit); };
  async function finish(id: string) {
    const x = taskOf(id);
    if (!x) return;
    try {
      if (isMission(x)) {
        const out = await respond.mutateAsync({ id, action: 'complete', version: x.version });
        if (out?.status === 'conflict') throw new Error(tr('ht.conflict'));
      } else await saveTask.mutateAsync({ id, input: { status: 'done' } });
      haptic('success'); toast(tr('u3.cal.doneDot'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const range = useMemo(() => {
    if (view === 'day') return [cursor, addDays(cursor, 1)];
    if (view === 'week') { const s = weekStart(cursor); return [s, addDays(s, 7)]; }
    if (view === 'month') { const g = monthGrid(cursor); return [g[0][0], addDays(g[g.length - 1][6], 1)]; }
    return [todayISO(), addDays(todayISO(), 31)];
  }, [view, cursor]);
  const items = useMemo(() => itemsBetween({ events: eventsQ.data ?? [], appointments: appointments ?? [], tasks: tasks ?? [], shifts: shifts ?? [], moments }, atLocal(range[0]), atLocal(range[1])), [eventsQ.data, appointments, tasks, shifts, moments, range]);
  const clashes = useMemo(() => overlaps(items), [items]);
  const weekItems = useMemo(() => { const s0 = weekStart(todayISO()); return itemsBetween({ events: eventsQ.data ?? [], appointments: appointments ?? [], tasks: tasks ?? [], shifts: shifts ?? [], moments }, atLocal(s0), atLocal(addDays(s0, 7))); }, [eventsQ.data, appointments, tasks, shifts, moments]);
  const todayItems = useMemo(() => itemsBetween({ events: eventsQ.data ?? [], appointments: appointments ?? [], tasks: tasks ?? [], shifts: shifts ?? [], moments }, atLocal(todayISO()), atLocal(addDays(todayISO(), 1))), [eventsQ.data, appointments, tasks, shifts, moments]);

  // Calendrier de l'iPhone : événements des calendriers choisis, lus sur le téléphone pour la période affichée + la
  // semaine en cours. Affichage seul : ils n'entrent ni dans l'export .ics, ni dans l'abonnement, ni sur le serveur.
  const knownKeys = useMemo(() => new Set([...(eventsQ.data ?? []).map((e) => homiKey('event', e.id)), ...(appointments ?? []).map((a) => homiKey('appointment', a.id))]), [eventsQ.data, appointments]);
  const today = todayISO();
  const deviceSpan = useMemo(() => {
    const w = weekStart(today);
    return [atLocal(range[0] < w ? range[0] : w).getTime(), atLocal(range[1] > addDays(w, 7) ? range[1] : addDays(w, 7)).getTime()] as const;
  }, [range, today]);
  const deviceItems = useDeviceAgenda(deviceSpan[0], deviceSpan[1], knownKeys);
  const entriesOnDay = (list: CalendarItem[], day: string): Entry[] => sortAgenda<Entry>([...itemsOnDay(list, day), ...deviceOnDay(deviceItems, day)]);
  const todayEntries = entriesOnDay(todayItems, today);

  const dir = useRef(0);
  const [moved, setMoved] = useState<string | null>(null);
  function move(n: number) {
    haptic('selection');
    dir.current = n;
    setCursor((c) => (view === 'day' ? addDays(c, n) : view === 'week' ? addDays(c, 7 * n) : view === 'month' ? addMonths(c, n) : c));
  }

  function openNew(day = cursor) {
    // aujourd'hui : l'heure pleine suivante est pré-remplie ; un autre jour : 10 h
    const h = day === todayISO() ? Math.min(22, new Date().getHours() + 1) : 10;
    setDraft({ title: '', kind: 'activity', date: toFrDate(day), from: `${h}h`, to: `${h + 1}h`, allDay: false, location: '', notes: '', recurrence: 'none', until: '', childId: null });
  }
  // « Planifier » depuis le Profil (?new=1) : ouvre directement la création d'un événement
  useEffect(() => { if (params.new === '1') openNew(); }, [params.new]); // eslint-disable-line react-hooks/exhaustive-deps

  function openItem(i: CalendarItem) {
    setOpenedAt(i.source === 'event' && i.recurring ? i.starts : null);
    if (i.source === 'appointment') return router.push('/appointments');
    if (i.source === 'task') return router.push('/family');
    if (i.source === 'night') return router.push('/family/nights');
    if (i.source === 'me_time') return router.push('/family/me-time');
    if (i.source === 'moment') return router.push('/family/moments');
    const e = eventsQ.data?.find((x) => x.id === i.refId);
    if (!e) return;
    const a = splitLocal(e.starts_at);
    const b = splitLocal(e.ends_at);
    setDraft({ id: e.id, title: e.title, kind: e.kind, date: a.date, from: a.time, to: b.time, allDay: e.all_day, location: e.location_label ?? '', notes: e.notes ?? '', recurrence: e.recurrence?.type ?? 'none', until: e.recurrence?.until ? toFrDate(e.recurrence.until) : '', childId: e.child_id });
  }

  async function submit() {
    if (!draft) return;
    if (!draft.title.trim()) return toast(tr('u3.cal.needTitle'), 'error');
    const starts = parseFrDateTime(draft.date, draft.allDay ? '0h' : draft.from);
    const ends = draft.allDay ? null : parseFrDateTime(draft.date, draft.to);
    if (!starts || ends === undefined) return toast(tr('u3.cal.badDate'), 'error');
    if (ends && ends < starts) return toast(tr('u3.cal.endAfter'), 'error');
    const until = draft.until.trim() ? frToISO(draft.until) : null;
    if (draft.until.trim() && !until) return toast(tr('u3.cal.badUntil'), 'error');
    try {
      await save.mutateAsync({
        id: draft.id,
        input: {
          title: draft.title.trim().slice(0, 120), kind: draft.kind, starts_at: starts, ends_at: ends, all_day: draft.allDay, location_label: draft.location.trim() || null,
          notes: draft.notes.trim() || null, child_id: draft.childId, recurrence: draft.recurrence === 'none' ? null : { type: draft.recurrence, ...(until ? { until } : {}) },
        },
      });
      haptic('success');
      toast(draft.id ? tr('u3.cal.modified') : tr('u3.cal.added'));
      dir.current = 0;
      setCursor(dayKey(new Date(starts)));
      if (draft.id) setMoved(draft.id);
      setDraft(null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function remove() {
    if (!draft?.id) return;
    if (!(await confirm(tr('u3.cal.delQ'), draft.recurrence !== 'none' ? tr('u3.cal.delRep') : draft.title, tr('u3.fertBody.delOk')))) return;
    try { await del.mutateAsync(draft.id); toast(tr('u3.cal.deleted')); setDraft(null); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function exportIcs() {
    const from = atLocal(addDays(todayISO(), -30));
    const to = atLocal(addDays(todayISO(), 365));
    const all = itemsBetween({ events: eventsQ.data ?? [], appointments: appointments ?? [], tasks: (tasks ?? []).filter((x) => x.status === 'todo'), shifts: shifts ?? [], moments }, from, to);
    const ics = toIcs(all, { includeHealthTitles: withHealth, events: eventsQ.data ?? [] });
    try {
      const r = await exportTextFile(ics, `agenda-familial-${todayISO()}.ics`, 'text/calendar', 'public.calendar-event', tr('u3.cal.exportTitle'));
      toast(r === 'text' ? tr('u3.cal.exportFail') : tr('u3.cal.exportReady'), r === 'text' ? 'error' : 'success');
      setExportOpen(false);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const title = view === 'day' ? longDay(cursor)
    : view === 'week' ? tr('u3.cal.weekOf', { date: formatDate(atLocal(weekStart(cursor), 12), { day: 'numeric', month: 'long' }) })
      : view === 'month' ? formatDate(atLocal(cursor, 12), { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())
        : tr('u3.cal.next30');

  /** Rangée d'agenda : heure alignée (+ fin), titre, capsule (fait / chevauchement), source · personne · lieu. */
  const itemRow = (i: CalendarItem, state?: DayState): DayRowSpec => ({
    key: i.key, time: i.allDay ? tr('d5.anytime') : hm(i.starts), timeSub: i.allDay || i.source === 'task' || i.ends === i.starts ? null : hm(i.ends),
    state: state ?? (i.done ? 'done' : 'later'), title: i.title,
    pill: i.done ? { label: tr('d5.state.done'), tone: 'done' } : clashes.has(i.key) ? { label: tr('d5.cal.clash'), tone: 'late', icon: 'alert-triangle' } : state === 'now' || state === 'next' || state === 'late' ? undefined : null,
    sub: [SOURCE_LABEL[i.source], i.private ? tr('u3.cal.private') : null, i.recurring ? tr('u3.cal.repeated') : null, i.who ? labelOf(i.who) : null, i.location].filter(Boolean).join(' · '),
    onPress: () => openItem(i), testID: `cal-item-${i.key}`,
    accessibilityLabel: tr('u3.cal.itemA11y', { source: SOURCE_LABEL[i.source], title: i.title, when: i.allDay ? tr('u3.cal.allDayLc') : hm(i.starts) }) + (clashes.has(i.key) ? `. ${tr('u3.cal.clash')}` : ''),
  });
  /** Rangée d'un événement du calendrier de l'iPhone : marque « iPhone », nom du calendrier, détail en lecture seule. */
  const deviceRow = (i: DeviceAgendaItem, state?: DayState): DayRowSpec => ({
    key: i.key, time: i.allDay ? tr('d5.anytime') : hm(i.starts), timeSub: i.allDay || i.ends === i.starts ? null : hm(i.ends),
    state: state ?? 'later', title: i.title || tr('ical.detail.untitled'), strike: false,
    pill: { label: tr('ical.badge'), tone: 'info', icon: 'smartphone' },
    sub: [i.calendarTitle, i.location].filter(Boolean).join(' · '),
    onPress: () => setDeviceItem(i), testID: `cal-item-${i.key}`,
    accessibilityLabel: tr('ical.item.a11y', { calendar: i.calendarTitle, title: i.title || tr('ical.detail.untitled'), when: i.allDay ? tr('u3.cal.allDayLc') : hm(i.starts) }),
  });
  const entryRow = (i: Entry, state?: DayState) => (isDevice(i) ? deviceRow(i, state) : itemRow(i, state));
  const dayList = (list: Entry[], testID?: string) => (
    <DayList testID={testID}>
      {list.map((i, k) => (
        <Flash key={i.key} on={moved === i.refId} color={t.colors.primary}>
          {k ? <DaySeparator /> : null}
          <DayRow r={entryRow(i)} first={k === 0} last={k === list.length - 1} />
        </Flash>
      ))}
    </DayList>
  );

  return (
    <Screen back account bottomInset={inTab ? TAB_SCREEN_INSET : 0} title={tr('u3.cal.title')} subtitle={tr('u3.cal.subtitle')}
      action={{ label: tr('u3.cal.addEvent'), icon: 'plus', onPress: () => openNew(), testID: 'calendar-add' }}>
      {(() => {
        const nextUp = todayItems.filter((x) => !x.done && Date.parse(x.ends) >= Date.now()).sort((a, b) => (a.starts < b.starts ? -1 : 1))[0];
        return (
          <BriefStrip title={tr('d5.brief')} testID="cal-brief" items={[
            { value: String(todayEntries.length), label: todayEntries.length > 1 ? tr('u3.cal.itemsMany') : tr('u3.cal.itemsOne') },
            { value: String(todayItems.filter((x) => x.source === 'appointment').length), label: tr('u3.cal.appts') },
            { value: nextUp ? (nextUp.allDay ? tr('u3.cal.allDaySum') : hm(nextUp.starts)) : '—', label: nextUp ? tr('u3.cal.nextUp', { title: nextUp.title }) : tr('u3.cal.next') },
          ]} />
        );
      })()}
      {(() => {
        // Aujourd'hui : chronologie calme (heures alignées, fil fin) — en retard, en cours, ensuite ; « Fait » en un geste
        const STATE: Record<ThreadState, DayState> = { done: 'done', now: 'now', late: 'late', past: 'past', next: 'next', todo: 'later', anytime: 'anytime' };
        const rows: DayRowSpec[] = threadStates(todayEntries.map((i) => ({ key: i.key, at: i.allDay ? null : i.starts, end: i.allDay ? null : i.ends, done: isDevice(i) ? false : i.done, actionable: i.source === 'task', allDay: i.allDay, item: i })))
          .map(({ item: i, state }) => (isDevice(i) ? { ...deviceRow(i, STATE[state]), testID: `cal-today-${i.key}` } : {
            ...itemRow(i, STATE[state]), pill: undefined, testID: `cal-today-${i.key}`,
            right: i.source === 'task' && !i.done && canFinish(i.refId) ? <DoneButton testID={`cal-done-${i.refId}`} accessibilityLabel={tr('d5.doneA11y', { title: i.title })} onPress={() => void finish(i.refId)} /> : undefined,
          }));
        return (
          <DaySection title={tr('u3.cal.todayT')} testID="cal-today">
            <DayTimeline rows={rows} empty={<Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('u3.cal.nothingToday')}</Text>} />
          </DaySection>
        );
      })()}
      <WeekStrip cursor={cursor} counts={(d) => entriesOnDay(weekItems, d).length} onPick={(d) => { dir.current = 0; setCursor(d); setView('day'); }} />
      <Segmented label={tr('u3.cal.view')} value={view} onChange={(v) => { dir.current = 0; setView(v); haptic('selection'); }} options={[{ value: 'day', label: tr('u3.cal.dayShort') }, { value: 'week', label: tr('u3.cal.vWeek') }, { value: 'month', label: tr('u3.cal.vMonth') }, { value: 'agenda', label: tr('u3.cal.vAgenda') }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        {view !== 'agenda' ? <IconButton icon="chevron-left" label={tr('u3.cal.prevP')} onPress={() => move(-1)} /> : <View />}
        <Tappable onPress={() => setCursor(todayISO())} accessibilityRole="button" accessibilityLabel={`${title}. ${tr('u3.cal.backToday')}`} style={{ flexShrink: 1 }}>
          <Text weight="bold" center>{title}</Text>
          {cursor !== todayISO() && view !== 'agenda' ? <Text variant="caption" color={t.colors.primary} center>{tr('u3.cal.backToday')}</Text> : null}
        </Tappable>
        {view !== 'agenda' ? <IconButton icon="chevron-right" label={tr('u3.cal.nextP')} onPress={() => move(1)} /> : <View />}
      </Row>

      {eventsQ.isLoading && !eventsQ.data ? <Skeleton rows={3} /> : null}
      {failedQs.length ? <ErrorView error={failedQs[0].error} onRetry={() => failedQs.forEach((q) => void q.refetch())} title={tr('u3.cal.errAll')} /> : null}

      <SlideSwap key={`${view}:${range[0]}`} dir={dir.current}>
      {view === 'month' ? (
        <MonthView cursor={cursor} items={items} extra={(d) => deviceOnDay(deviceItems, d).length} onPick={(d) => { setCursor(d); setView('day'); }} />
      ) : view === 'day' ? (
        <View style={{ gap: spacing.xs }}>
          {entriesOnDay(items, cursor).length ? dayList(entriesOnDay(items, cursor), 'cal-day-list') : <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('u3.cal.nothingDay')}</Text>}
        </View>
      ) : (
        Array.from({ length: view === 'week' ? 7 : 31 }, (_, k) => addDays(range[0], k)).map((d) => {
          const list = entriesOnDay(items, d);
          if (view === 'agenda' && !list.length) return null;
          return (
            <View key={d} style={{ gap: spacing.xs }}>
              <Tappable onPress={() => { haptic('selection'); setCursor(d); setView('day'); }} accessibilityRole="button" accessibilityLabel={tr('u3.cal.seeDay', { day: longDay(d) })}
                style={{ minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.xxs }}>
                <Text variant="label" color={d === todayISO() ? t.colors.primary : t.colors.text}>{longDay(d)}{d === todayISO() ? tr('u3.cal.todaySfx') : ''}</Text>
              </Tappable>
              {list.length ? dayList(list) : view === 'week' ? <Text variant="caption" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('d5.cal.free')}</Text> : null}
            </View>
          );
        })
      )}
      {view === 'agenda' && !items.length && !deviceItems.some((i) => Date.parse(i.ends) >= atLocal(range[0]).getTime() && Date.parse(i.starts) < atLocal(range[1]).getTime()) ? <Text variant="small" muted style={{ paddingHorizontal: spacing.xxs }}>{tr('u3.cal.nothing30')}</Text> : null}
      </SlideSwap>

      <SectionTitle title={tr('u3.cal.shareT')} />
      <Card>
        <Text variant="small">{tr('u3.cal.shareBody')}</Text>
        <Button label={tr('u3.cal.exportBtn')} icon="download" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => setExportOpen(true)} />
      </Card>

      <FeedCard />

      <DeviceCalendarEntry />
      <DeviceEventSheet item={deviceItem} onClose={() => setDeviceItem(null)} />

      <Sheet visible={exportOpen} onClose={() => setExportOpen(false)} title={tr('u3.cal.exportTitle')}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="small">{tr('u3.cal.exportIntro')}</Text>
          <Banner tone="info" icon="lock">{tr('u3.cal.exportPriv')}</Banner>
          <Row style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text weight="medium">{tr('u3.cal.inclTitles')}</Text>
              <Text variant="caption" muted>{tr('u3.cal.inclNote')}</Text>
            </View>
            <Toggle label={tr('u3.cal.inclTitles')} value={withHealth} onChange={setWithHealth} />
          </Row>
          <Button label={tr('u3.cal.createFile')} icon="download" full onPress={exportIcs} />
        </View>
      </Sheet>

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? tr('u3.cal.editEvent') : tr('u3.cal.newEvent')}>
        {draft ? (
          <View style={{ gap: spacing.sm }}>
            <Field label={tr('u3.cal.fTitle')} value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} maxLength={120} placeholder={tr('u3.cal.fTitlePh')} />
            <Text variant="label">{tr('u3.cal.fType')}</Text>
            <Row wrap>{EVENT_KINDS.map((k) => <Chip key={k.value} label={k.label} selected={draft.kind === k.value} onPress={() => setDraft({ ...draft, kind: k.value })} />)}</Row>
            <Field label={tr('u3.fertBody.date')} value={draft.date} onChangeText={(v) => setDraft({ ...draft, date: v })} placeholder={tr('u3.fertBody.datePh')} keyboardType="numbers-and-punctuation" />
            <Row style={{ alignItems: 'center' }}>
              <Text weight="medium" style={{ flex: 1 }}>{tr('u3.cal.allDay')}</Text>
              <Toggle label={tr('u3.cal.allDay')} value={draft.allDay} onChange={(v) => setDraft({ ...draft, allDay: v })} />
            </Row>
            {!draft.allDay ? (
              <Row>
                <View style={{ flex: 1 }}><Field label={tr('u3.cal.from')} value={draft.from} onChangeText={(v) => setDraft({ ...draft, from: v })} placeholder={tr('u3.cal.fromPh')} /></View>
                <View style={{ flex: 1 }}><Field label={tr('u3.cal.to')} value={draft.to} onChangeText={(v) => setDraft({ ...draft, to: v })} placeholder={tr('u3.cal.toPh')} /></View>
              </Row>
            ) : null}
            <Text variant="label">{tr('u3.cal.repeat')}</Text>
            <Segmented label={tr('u3.cal.repeat')} value={draft.recurrence} onChange={(v) => setDraft({ ...draft, recurrence: v })} options={[{ value: 'none', label: tr('u3.cal.rNo') }, { value: 'daily', label: tr('u3.cal.rDaily') }, { value: 'weekly', label: tr('u3.cal.rWeekly') }, { value: 'monthly', label: tr('u3.cal.rMonthly') }]} />
            {draft.recurrence !== 'none' ? <Field label={tr('u3.cal.until')} optional value={draft.until} onChangeText={(v) => setDraft({ ...draft, until: v })} placeholder={tr('u3.fertBody.datePh')} /> : null}
            {children?.length ? (
              <>
                <Text variant="label">{tr('u3.cal.forWho')}</Text>
                <Row wrap>
                  <Chip label={tr('u3.cal.wholeFam')} selected={!draft.childId} onPress={() => setDraft({ ...draft, childId: null })} />
                  {children.map((c) => <Chip key={c.id} label={c.first_name} selected={draft.childId === c.id} onPress={() => setDraft({ ...draft, childId: c.id })} />)}
                </Row>
              </>
            ) : null}
            <Field label={tr('u3.cal.place')} optional value={draft.location} onChangeText={(v) => setDraft({ ...draft, location: v })} maxLength={160} />
            <Field label={tr('u3.cal.notes')} optional multiline value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} maxLength={2000} />
            <Button label={draft.id ? tr('u3.cal.save') : tr('u3.cal.add')} full onPress={submit} loading={save.isPending} />
            {draft.id ? <Button label={tr('u3.fertBody.delOk')} variant="ghost" onPress={remove} /> : null}
            {(() => {
              // Ajout au calendrier de l'iPhone : l'événement ENREGISTRÉ (pas la saisie en cours), sur appui seulement
              const saved = draft.id ? eventsQ.data?.find((x) => x.id === draft.id) : undefined;
              const who = saved?.child_id ? children?.find((c) => c.id === saved.child_id)?.first_name : null;
              return saved ? <AddToDeviceCalendar source={{ kind: 'event', event: saved }} title={saved.title} occurrenceStart={openedAt} notes={who ? tr('ical.note.for', { name: who }) : null} /> : null;
            })()}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function MonthView({ cursor, items, extra, onPick }: { cursor: string; items: CalendarItem[]; extra?: (d: string) => number; onPick: (d: string) => void }) {
  const t = useTheme();
  const month = cursor.slice(0, 7);
  const today = todayISO();
  return (
    <Card padded={false} style={{ padding: spacing.xs }}>
      <Row gap={0}>{monthGrid(cursor)[0].map((d, i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{formatDate(atLocal(d, 12), { weekday: 'narrow' })}</Text>)}</Row>
      {monthGrid(cursor).map((w) => (
        <Row key={w[0]} gap={0}>
          {w.map((d) => <DayCell key={d} day={d} out={d.slice(0, 7) !== month} today={d === today} count={itemsOnDay(items, d).length + (extra?.(d) ?? 0)} onPress={() => onPick(d)} accent={t.colors.primary} />)}
        </Row>
      ))}
    </Card>
  );
}

function DayCell({ day, out, today, count, onPress, accent }: { day: string; out: boolean; today: boolean; count: number; onPress: () => void; accent: string }) {
  const t = useTheme();
  const pop = usePop(today);
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${formatDate(atLocal(day, 12), { weekday: 'long', day: 'numeric', month: 'long' })}, ${count ? tr('u3.cal.nItems', { count }) : tr('u3.cal.nothingLc')}`} onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 6, minHeight: 48 }}>
      <Animated.View style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: today ? accent : 'transparent' }, pop]}>
        <Text variant="small" weight={today ? 'bold' : undefined} color={today ? t.colors.primaryText : out ? t.colors.textMuted : t.colors.text} style={{ opacity: out ? 0.5 : 1 }}>{Number(day.slice(8))}</Text>
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: 2, height: 6, marginTop: 2 }}>
        {Array.from({ length: Math.min(count, 3) }, (_, i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: accent, opacity: out ? 0.4 : 1 }} />)}
      </View>
    </Tappable>
  );
}

// ------------------------------------------------------------------ abonnement (synchronisation à sens unique)
/**
 * Lien secret que Google Agenda, Apple Calendrier ou Outlook interrogent régulièrement.
 * Le lien n'est montré qu'une fois ; il se révoque ici. Rien ne part en démonstration.
 */
function FeedCard() {
  const t = useTheme();
  const toast = useToast();
  const householdId = useHouseholdId();
  const available = !isDemo && !!backendUrl && !!householdId;
  const feedsQ = useCalendarFeeds(available);
  const create = useCreateCalendarFeed();
  const revoke = useRevokeCalendarFeed();
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  async function make() {
    if (!householdId) return;
    try {
      const r = await create.mutateAsync({ householdId, includeHealthTitles: health });
      setCreated(feedUrl(r.token));
      haptic('success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove(id: string) {
    if (!(await confirm(tr('u3.cal.feedRevQ'), tr('u3.cal.feedRevBody'), tr('u3.cal.revoke')))) return;
    try { await revoke.mutateAsync(id); toast(tr('u3.cal.revoked')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const close = () => { setOpen(false); setCreated(null); setHealth(false); };
  const when = (iso: string) => formatDate(iso, { day: 'numeric', month: 'short' });

  return (
    <Card>
      <Row style={{ alignItems: 'center' }}>
        <Icon name="refresh-cw" size={18} color={t.colors.primary} />
        <Text weight="bold" style={{ flex: 1 }}>{tr('u3.cal.subscribe')}</Text>
      </Row>
      <Text variant="small" style={{ marginTop: 4 }}>{tr('u3.cal.subBody')}</Text>
      {!available ? (
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{isDemo ? tr('u3.cal.demoOff') : tr('u3.cal.needHousehold')}</Text>
      ) : (
        <>
          {(feedsQ.data ?? []).map((f) => (
            <Row key={f.id} style={{ alignItems: 'center', marginTop: spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Text variant="small" weight="medium">{f.label}{f.include_health_titles ? tr('u3.cal.healthVisible') : ''}</Text>
                <Text variant="caption" muted>{tr('u3.cal.feedMeta', { created: when(f.created_at), last: f.last_accessed_at ? tr('u3.cal.lastRead', { date: when(f.last_accessed_at) }) : tr('u3.cal.notYet') })}</Text>
              </View>
              <Button label={tr('u3.cal.revoke')} size="sm" variant="ghost" onPress={() => remove(f.id)} />
            </Row>
          ))}
          <Button label={tr('u3.cal.createLink')} icon="link" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => setOpen(true)} />
        </>
      )}

      <Sheet visible={open} onClose={close} title={tr('u3.cal.linkT')}>
        {created ? (
          <View style={{ gap: spacing.sm }}>
            <Banner tone="warning" icon="lock">{tr('u3.cal.onceOnly')}</Banner>
            <Text selectable variant="caption" style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }} accessibilityLabel={tr('u3.cal.linkAddr')}>{created}</Text>
            <Button label={tr('u3.cal.openCal')} icon="calendar" full onPress={() => Linking.openURL(webcalUrl(created)).catch(() => toast(tr('u3.cal.noCalApp'), 'error'))} />
            <Button label={tr('u3.cal.shareCopy')} icon="share-2" variant="secondary" full onPress={() => Share.share({ message: created }).catch(() => undefined)} />
            <Text variant="caption" muted>{tr('u3.cal.gcalHelp')}</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text variant="small">{tr('u3.cal.feedScope')}</Text>
            <Banner tone="info" icon="lock">{tr('u3.cal.feedPriv')}</Banner>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text weight="medium">{tr('u3.cal.showTitles')}</Text>
                <Text variant="caption" muted>{tr('u3.cal.showNote')}</Text>
              </View>
              <Toggle label={tr('u3.cal.showTitles')} value={health} onChange={setHealth} />
            </Row>
            <Button label={tr('u3.cal.createL')} icon="link" full loading={create.isPending} onPress={make} />
          </View>
        )}
      </Sheet>
    </Card>
  );
}

export default function FamilyCalendar() {
  return <FamilyCalendarScreen />;
}
