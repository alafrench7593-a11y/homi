/**
 * Journal unifié : biberons, repas, sommeil, changes, observations, médicaments notés, dents,
 * souvenirs, rendez-vous et tâches faites, dans une seule chronologie. Vues jour / semaine / mois,
 * filtres, recherche, statistiques descriptives et export CSV pour une consultation.
 * Uniquement des saisies réellement enregistrées : rien n'est généré.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, IconButton, type IconName, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { describeLog, logTime, type LogItem } from '@/features/tracking';
import { useActiveSubject, useAppointments, useChildren, useLogs } from '@/lib/data/hooks';
import { useMilestones } from '@/lib/data/hooks-family';
import { useFamilyTasks } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, addMonths, atLocal, weekStart } from '@/lib/domain/calendar';
import { JOURNAL_CATEGORIES, filterJournal, journalCsv, journalStats, type JournalCategory, type JournalEntry } from '@/lib/domain/journal';
import { todayISO } from '@/lib/domain/dates';
import { exportTextFile } from '@/lib/exportData';
import type { Bottle, Breastfeed, Diaper, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { spacing } from '@/theme/tokens';

type Period = 'day' | 'week' | 'month';
const ICON: Record<JournalCategory, IconName> = { feeding: 'coffee', sleep: 'moon', diaper: 'wind', health: 'thermometer', medication: 'package', teeth: 'smile', memory: 'star', appointment: 'calendar', task: 'check-square' };
const TITLE: Record<LogItem['type'], string> = { bottle: 'Biberon', breastfeed: 'Tétée', pumping: 'Tire-lait', diaper: 'Change', sleep: 'Sommeil', meal: 'Repas', observation: 'Observation' };

export default function Journal() {
  const toast = useToast();
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const [childId, setChildId] = useState<string | null>(null);
  const child = children?.find((c) => c.id === (childId ?? (subject.type === 'child' ? subject.id : children?.[0]?.id)));
  const [period, setPeriod] = useState<Period>('week');
  const [cursor, setCursor] = useState(todayISO());
  const [cats, setCats] = useState<JournalCategory[]>([]);
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
        out.push({ key: `${k}:${d.id}`, at: logTime(item), category, title: TITLE[k], detail: describeLog(item), note: d.note ?? null, route: `/track/${k}?child=${d.child_id}&id=${d.id}` });
      }
    });
    for (const m of milestones ?? []) {
      if (!m.happened_on) continue;
      out.push({ key: `m:${m.id}`, at: atLocal(m.happened_on, 12).toISOString(), category: m.kind === 'tooth' ? 'teeth' : 'memory', title: m.kind === 'tooth' ? 'Dent' : m.title, detail: m.kind === 'tooth' ? m.title : m.kind === 'memory' ? 'Souvenir' : 'Étape', note: m.note });
    }
    for (const a of appointments ?? []) if (!a.child_id || a.child_id === id) out.push({ key: `a:${a.id}`, at: a.starts_at, category: 'appointment', title: a.title, detail: a.location_label ?? 'Rendez-vous', note: a.notes, route: '/appointments' });
    for (const t of tasks ?? []) if (t.status === 'done' && t.done_at) out.push({ key: `t:${t.id}`, at: t.done_at, category: 'task', title: t.title, detail: 'Tâche faite', note: t.notes, route: '/family' });
    return out;
  }, [q.bottle.data, q.breastfeed.data, q.pumping.data, q.meal.data, q.diaper.data, q.sleep.data, q.observation.data, milestones, appointments, tasks, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = filterJournal(entries, { from: atLocal(fromDay), to: atLocal(toDay), categories: cats, search });
  const stats = journalStats(list);
  const loading = Object.values(q).some((x) => x.isLoading && !x.data);

  function move(n: number) { setCursor((c) => (period === 'day' ? addDays(c, n) : period === 'week' ? addDays(c, 7 * n) : addMonths(c, n))); }
  const label = period === 'day' ? atLocal(cursor, 12).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : period === 'week' ? `Semaine du ${atLocal(fromDay, 12).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
      : atLocal(cursor, 12).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  async function exportCsv() {
    if (!child) return;
    try {
      const r = await exportTextFile(journalCsv(list, child.first_name), `journal-${child.first_name}-${fromDay}.csv`, 'text/csv', 'public.comma-separated-values-text', 'Exporter le journal');
      toast(r === 'text' ? 'Export impossible sur cet appareil.' : 'Journal exporté (CSV).', r === 'text' ? 'error' : 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (!children?.length) {
    return <Screen back title="Journal"><EmptyState icon="book" title="Aucun enfant enregistré" body="Le journal rassemble les saisies de votre enfant." action={{ label: 'Ajouter un enfant', onPress: () => router.push('/profiles/new') }} /></Screen>;
  }

  return (
    <Screen back title="Journal" subtitle={child ? `${child.first_name} — tout ce qui a été noté` : undefined}>
      {children.length > 1 ? <Row wrap>{children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === child?.id} onPress={() => setChildId(c.id)} />)}</Row> : null}
      <Segmented label="Période" value={period} onChange={setPeriod} options={[{ value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label="Période précédente" onPress={() => move(-1)} />
        <Text weight="bold">{label.replace(/^./, (c) => c.toUpperCase())}</Text>
        <IconButton icon="chevron-right" label="Période suivante" onPress={() => move(1)} />
      </Row>
      <Field label="Rechercher" optional value={search} onChangeText={setSearch} placeholder="crèche, purée, fièvre…" />
      <Row wrap>{JOURNAL_CATEGORIES.map((c) => <Chip key={c.value} label={c.label} icon={ICON[c.value]} selected={cats.includes(c.value)} onPress={() => setCats((cur) => (cur.includes(c.value) ? cur.filter((x) => x !== c.value) : [...cur, c.value]))} />)}</Row>

      {stats.length ? (
        <Card tone="soft">
          <Text variant="small" weight="bold">Sur la période</Text>
          <Text variant="small">{stats.map((s) => `${s.label} : ${s.count}`).join(' · ')}</Text>
          <Text variant="caption" muted>Des comptes de ce qui a été noté. Une tendance ne prouve aucune cause médicale.</Text>
        </Card>
      ) : null}

      {loading ? <Skeleton rows={4} /> : null}
      {!loading && !list.length ? <EmptyState icon="book-open" title="Rien de noté sur cette période" body={search || cats.length ? 'Essayez d’enlever un filtre.' : undefined} /> : null}
      {list.map((e, i) => (
        <StaggerItem key={e.key} index={i}>
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon={ICON[e.category]} title={`${new Date(e.at).toLocaleString('fr-FR', period === 'day' ? { hour: '2-digit', minute: '2-digit' } : { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${e.title}`} subtitle={[e.detail, e.note].filter(Boolean).join(' — ')} onPress={e.route ? () => router.push(e.route as never) : undefined} />
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title="Pour une consultation" />
      <Card>
        <Text variant="small">Exportez la période affichée (avec les filtres) en tableau CSV, lisible dans Excel ou Numbers.</Text>
        <Button label="Exporter (CSV)" icon="download" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={exportCsv} disabled={!list.length} />
      </Card>
      <View style={{ height: spacing.md }} />
    </Screen>
  );
}
