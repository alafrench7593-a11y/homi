/**
 * Journal unifié : biberons, repas, sommeil, changes, observations, médicaments notés, dents,
 * souvenirs, rendez-vous et tâches faites, dans une seule chronologie. Vues jour / semaine / mois,
 * filtres, recherche, statistiques descriptives et export CSV pour une consultation.
 * Uniquement des saisies réellement enregistrées : rien n'est généré.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, IconButton, type IconName, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { describeLog, logTime, type LogItem } from '@/features/tracking';
import { useActiveSubject, useAppointments, useChildren, useLogs } from '@/lib/data/hooks';
import { useMilestones } from '@/lib/data/hooks-family';
import { useFamilyTasks } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, addMonths, atLocal, weekStart } from '@/lib/domain/calendar';
import { JOURNAL_CATEGORIES, filterJournal, journalCsv, journalStats, type JournalCategory, type JournalEntry } from '@/lib/domain/journal';
import { todayISO } from '@/lib/domain/dates';
import { exportTextFile } from '@/lib/exportData';
import { safeFileName } from '@/lib/csv';
import type { Bottle, Breastfeed, Diaper, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { spacing } from '@/theme/tokens';
import { formatDate, localeTag, t as tr } from '@/i18n';
import { HmHero, HmRow } from '@/features/homeTrack/kit';
import { MomentTray } from '@/features/careTrack/MomentTray';
import { dayOfStamp, journalPeriod, urlDay } from '@/lib/domain/careTrack';
import { clock } from '@/lib/domain/sleepPlanner';

const CAT_KEY = { feeding: 'u4.journal.c.feeding', sleep: 'u4.journal.c.sleep', diaper: 'u4.journal.c.diaper', health: 'u4.journal.c.health', medication: 'u4.journal.c.medication', teeth: 'u4.journal.c.teeth', memory: 'u4.journal.c.memory', appointment: 'u4.journal.c.appointment', task: 'u4.journal.c.task' } as const;

type Period = 'day' | 'week' | 'month';
const ICON: Record<JournalCategory, IconName> = { feeding: 'coffee', sleep: 'moon', diaper: 'wind', health: 'thermometer', medication: 'package', teeth: 'smile', memory: 'star', appointment: 'calendar', task: 'check-square' };
const TITLE_KEY = { bottle: 'u4.journal.t.bottle', breastfeed: 'u4.journal.t.breastfeed', pumping: 'u4.journal.t.pumping', diaper: 'u4.journal.t.diaper', sleep: 'u4.journal.t.sleep', meal: 'u4.journal.t.meal', observation: 'u4.journal.t.observation' } as const satisfies Record<LogItem['type'], string>;

export default function Journal() {
  const toast = useToast();
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const [childId, setChildId] = useState<string | null>(null);
  const child = children?.find((c) => c.id === (childId ?? (subject.type === 'child' ? subject.id : children?.[0]?.id)));
  // Période, jour et catégories gardés dans l'adresse (`?period=&day=&cats=`) : ouvrir un événement puis revenir
  // retrouve la même vue
  const qp = useLocalSearchParams<{ period?: string; day?: string; cats?: string; moment?: string }>();
  const period: Period = journalPeriod(qp.period);
  const cursor = urlDay(qp.day, todayISO());
  const cats = (typeof qp.cats === 'string' ? qp.cats.split(',') : []).filter((c): c is JournalCategory => JOURNAL_CATEGORIES.some((x) => x.value === c));
  const setPeriod = (v: Period) => router.setParams({ period: v === 'week' ? undefined : v } as never);
  const setCursor = (f: (c: string) => string) => { const d = f(cursor); router.setParams({ day: d >= todayISO() ? undefined : d } as never); };
  const setCats = (f: (c: JournalCategory[]) => JournalCategory[]) => { const n = f(cats); router.setParams({ cats: n.length ? n.join(',') : undefined } as never); };
  const [search, setSearch] = useState('');

  const [fromDay, toDay] = period === 'day' ? [cursor, addDays(cursor, 1)] : period === 'week' ? [weekStart(cursor), addDays(weekStart(cursor), 7)] : [`${cursor.slice(0, 7)}-01`, addMonths(cursor, 1)];
  const since = Math.min(400, Math.max(2, Math.ceil((Date.now() - atLocal(fromDay).getTime()) / 86400000) + 1));
  const id = child?.id;
  const q = {
    bottle: useLogs<Bottle>('bottle', id, since), breastfeed: useLogs<Breastfeed>('breastfeed', id, since), pumping: useLogs<Pumping>('pumping', id, since),
    meal: useLogs<Meal>('meal', id, since), diaper: useLogs<Diaper>('diaper', id, since), sleep: useLogs<Sleep>('sleep', id, since), observation: useLogs<Observation>('observation', id, since),
  };
  const { data: milestones } = useMilestones(id);
  const { data: appointments } = useAppointments();
  const { data: tasks } = useFamilyTasks();

  const entries = useMemo<JournalEntry[]>(() => {
    const out: JournalEntry[] = [];
    (Object.keys(q) as (keyof typeof q)[]).forEach((k) => {
      for (const d of (q[k].data ?? []) as LogItem['data'][]) {
        const item = { type: k, data: d } as LogItem;
        const category: JournalCategory = k === 'sleep' ? 'sleep' : k === 'diaper' ? 'diaper' : k === 'observation' ? ((d as Observation).kind === 'medication' ? 'medication' : 'health') : 'feeding';
        out.push({ key: `${k}:${d.id}`, at: logTime(item), category, title: tr(TITLE_KEY[k]), detail: describeLog(item), note: d.note ?? null, route: `/track/${k}?child=${d.child_id}&id=${d.id}` });
      }
    });
    for (const m of milestones ?? []) {
      if (!m.happened_on) continue;
      out.push({ key: `m:${m.id}`, route: `moment:${m.id}`, at: atLocal(m.happened_on, 12).toISOString(), category: m.kind === 'tooth' ? 'teeth' : 'memory', title: m.kind === 'tooth' ? tr('u4.journal.tooth') : m.title, detail: m.kind === 'tooth' ? m.title : m.kind === 'memory' ? tr('u4.journal.memory') : tr('u4.journal.step'), note: m.note });
    }
    for (const a of appointments ?? []) if (!a.child_id || a.child_id === id) out.push({ key: `a:${a.id}`, at: a.starts_at, category: 'appointment', title: a.title, detail: a.location_label ?? tr('u4.journal.appt'), note: a.notes, route: '/appointments' });
    for (const t of tasks ?? []) if (t.status === 'done' && t.done_at) out.push({ key: `t:${t.id}`, at: t.done_at, category: 'task', title: t.title, detail: tr('u4.journal.taskDone'), note: t.notes, route: '/family' });
    return out;
  }, [q.bottle.data, q.breastfeed.data, q.pumping.data, q.meal.data, q.diaper.data, q.sleep.data, q.observation.data, milestones, appointments, tasks, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = filterJournal(entries, { from: atLocal(fromDay), to: atLocal(toDay), categories: cats, search });
  const stats = journalStats(list);
  const loading = Object.values(q).some((x) => x.isLoading && !x.data);
  const byDay = useMemo(() => {
    const m = new Map<string, JournalEntry[]>();
    for (const e of list) { const d = dayOfStamp(e.at); m.set(d, [...(m.get(d) ?? []), e]); }
    return [...m.entries()];
  }, [list]);
  const openEntry = (route: string) => (route.startsWith('moment:') ? router.setParams({ moment: route.slice(7) } as never) : router.push(route as never));

  function move(n: number) { setCursor((c) => (period === 'day' ? addDays(c, n) : period === 'week' ? addDays(c, 7 * n) : addMonths(c, n))); }
  const label = period === 'day' ? atLocal(cursor, 12).toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long' })
    : period === 'week' ? tr('u4.journal.weekOf', { date: atLocal(fromDay, 12).toLocaleDateString(localeTag(), { day: 'numeric', month: 'long' }) })
      : atLocal(cursor, 12).toLocaleDateString(localeTag(), { month: 'long', year: 'numeric' });

  async function exportCsv() {
    if (!child) return;
    try {
      const r = await exportTextFile(journalCsv(list, child.first_name), `journal-${safeFileName(child.first_name)}-${fromDay}.csv`, 'text/csv', 'public.comma-separated-values-text', tr('u4.journal.exportTitle'));
      toast(r === 'text' ? tr('u4.journal.exportFail') : tr('u4.journal.exported'), r === 'text' ? 'error' : 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (!children?.length) {
    return <Screen back title={tr('u4.journal.title')}><EmptyState icon="book" title={tr('u4.journal.emptyTitle')} body={tr('u4.journal.emptyBody')} action={{ label: tr('u4.journal.addChild'), onPress: () => router.push('/profiles/new') }} /></Screen>;
  }

  return (
    <Screen back title={tr('u4.journal.title')} subtitle={child ? tr('u4.journal.subtitle', { name: child.first_name }) : undefined}>
      {children.length > 1 ? <Row wrap>{children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === child?.id} onPress={() => setChildId(c.id)} />)}</Row> : null}
      <Segmented label={tr('u4.journal.period')} value={period} onChange={setPeriod} options={[{ value: 'day', label: tr('u4.journal.day') }, { value: 'week', label: tr('u4.journal.week') }, { value: 'month', label: tr('u4.journal.month') }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label={tr('u4.journal.prev')} onPress={() => move(-1)} />
        <Text weight="bold">{label.replace(/^./, (c) => c.toUpperCase())}</Text>
        <IconButton icon="chevron-right" label={tr('u4.journal.next')} onPress={() => move(1)} />
      </Row>
      <Field label={tr('u4.journal.search')} optional value={search} onChangeText={setSearch} placeholder={tr('u4.journal.searchPh')} />
      <Row wrap>{JOURNAL_CATEGORIES.map((c) => <Chip key={c.value} label={tr(CAT_KEY[c.value])} icon={ICON[c.value]} selected={cats.includes(c.value)} onPress={() => setCats((cur) => (cur.includes(c.value) ? cur.filter((x) => x !== c.value) : [...cur, c.value]))} />)}</Row>

      {/* Donnée principale : la dernière saisie de la période (heure en grand), puis les comptes par nature */}
      <HmHero testID="ct-journal-hero" value={list[0] ? clock(new Date(list[0].at)) : null} emptyLabel={search || cats.length ? tr('u4.journal.removeFilter') : tr('u4.journal.nothing')}
        unit={list[0] ? `${list[0].title} · ${formatDate(list[0].at, { weekday: 'long', day: 'numeric', month: 'long' })}` : null}
        caption={list[0] ? tr('ct.journal.lastOfPeriod') : null}
        split={stats.length ? stats.slice(0, 3).map((x) => ({ label: tr(CAT_KEY[x.value]), value: String(x.count), testID: `ct-journal-n-${x.value}` })) : undefined} />
      {stats.length > 3 ? <Text variant="caption" muted>{stats.slice(3).map((x) => `${tr(CAT_KEY[x.value])} : ${x.count}`).join(' · ')}</Text> : null}
      {stats.length ? <Text variant="caption" muted>{tr('u4.journal.statsNote')}</Text> : null}

      {loading ? <Skeleton rows={4} /> : null}
      {byDay.map(([day, rows]) => (
        <View key={day} testID={`ct-journal-day-${day}`}>
          {period !== 'day' ? <Text variant="label" muted accessibilityRole="header">{formatDate(`${day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text> : null}
          {rows.map((e) => (
            <HmRow key={e.key} time={clock(new Date(e.at))} icon={ICON[e.category]} title={e.title} detail={[e.detail, e.note].filter(Boolean).join(' — ')}
              testID={`ct-journal-row-${e.key}`} onPress={e.route ? () => openEntry(e.route!) : undefined} />
          ))}
        </View>
      ))}
      {child ? <MomentTray moment={(milestones ?? []).find((m) => m.id === qp.moment) ?? null} birthDate={child.birth_date} onClose={() => router.setParams({ moment: undefined } as never)} /> : null}

      <SectionTitle title={tr('u4.journal.forVisit')} />
      <Card>
        <Text variant="small">{tr('u4.journal.exportBody')}</Text>
        <Button label={tr('u4.journal.exportBtn')} icon="download" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={exportCsv} disabled={!list.length} />
      </Card>
      <View style={{ height: spacing.md }} />
    </Screen>
  );
}
