/**
 * Historique et journal du sommeil d'UN enfant (celui du profil choisi, changeable en un geste).
 *  · Sommeil en cours : chronomètre lu dans les horodatages enregistrés + grands boutons d'enregistrement.
 *  · Barres 7 / 14 / 30 jours (nuit + siestes), alternative textuelle, moyennes des seuls jours notés.
 *  · Historique des nuits (réveils datés, repas notés sur la même chronologie, sans conclusion) et des siestes.
 *  · Journal daté : difficultés, changements de routine.
 *  · Résumé pour le pédiatre (fichier imprimable ou texte à copier) ; rien n'est envoyé automatiquement.
 *  · Liens : relais de nuit, rappels facultatifs (désactivés par défaut), couchage sûr (sources officielles).
 * Jamais de note de sommeil, de comparaison à une norme, de promesse ni de diagnostic.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { SleepRecordButtons } from '@/features/sleep';
import { SleepBars, SleepBarsText } from '@/features/sleepBars';
import { useChild, useChildren, useMemberships, useTrackedChildren } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { useFeedEvents, useSleepHistory, useSleepNoteActions, useSleepNotes } from '@/lib/data/hooks-sleepJournal';
import { exportTextFile } from '@/lib/exportData';
import { childAge } from '@/lib/domain/child';
import { clock, span } from '@/lib/domain/sleepPlanner';
import {
  NOTE_TAGS, napHistory, nightHistory, notesInRange, pediatricSummary, rangeSummary, runningSleep, sleepBars, stopwatch,
  summaryHtml, tagLabel, validateNote, type NightEntry, type SleepNote, type SleepNoteKind, type SleepNoteTag, type SleepRange,
} from '@/lib/domain/sleepJournal';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, getLocale, t as tr } from '@/i18n';

const dayTitle = (n: number) => formatDate(new Date(n), { weekday: 'long', day: 'numeric', month: 'long' });

export default function SleepHistoryRoute() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const child = useChild(childId);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  if (!child) {
    return (
      <Screen back title={tr('sj.title')}>
        {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('u4.child.loadError')} />
        ) : (
          <EmptyState icon="user-x" title={tr('u4.child.notFound')} body={tr('u4.child.notFoundBody')}
            action={{ label: tr('u4.child.backHome'), icon: 'home', onPress: () => router.replace('/(tabs)') }} />
        )}
      </Screen>
    );
  }
  return <HistoryBody key={child.id} child={child} />;
}

function HistoryBody({ child }: { child: Child }) {
  const kids = (useTrackedChildren().data ?? []).filter((c) => c.enabled_tracking.includes('sleep'));
  const { plan, now } = useSleepPlan(child, 30_000);
  const hist = useSleepHistory(child.id);
  const feeds = useFeedEvents(child.id);
  const { notes } = useSleepNotes(child.id);
  const [range, setRange] = useState<SleepRange>(7);
  const [list, setList] = useState<'nights' | 'naps'>('nights');
  const [asText, setAsText] = useState(false);
  const name = child.first_name;
  const sleeps = hist.sleeps as Sleep[];
  const bars = useMemo(() => sleepBars(sleeps, child.id, now, range), [sleeps, child.id, now, range]);
  const sum = useMemo(() => rangeSummary(bars), [bars]);
  const nights = useMemo(() => nightHistory(sleeps, child.id, feeds, now, range), [sleeps, child.id, feeds, now, range]);
  const naps = useMemo(() => napHistory(sleeps, child.id, now, range), [sleeps, child.id, now, range]);
  const rangeNotes = useMemo(() => notesInRange(notes, child.id, now, range), [notes, child.id, now, range]);

  return (
    <Screen back title={tr('sj.titleOf', { name })} subtitle={childAge(child.birth_date).label}>
      {kids.length > 1 ? (
        <View style={{ gap: 4 }}>
          <Text variant="caption" muted>{tr('sj.whichChild')}</Text>
          <Row wrap testID="sj-children">
            {kids.map((c) => (
              <Chip key={c.id} label={c.first_name} selected={c.id === child.id} accessibilityLabel={tr('sj.childA11y', { name: c.first_name })}
                onPress={() => { if (c.id !== child.id) { haptic('light'); router.replace({ pathname: '/sleep/history/[childId]', params: { childId: c.id } }); } }} />
            ))}
          </Row>
        </View>
      ) : null}
      <View testID="sj-for" accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="caption" weight="bold" muted>{tr('sj.concerned')}</Text>
        <Text weight="bold">{name}</Text>
      </View>

      <StaggerItem index={0}><RunningCard child={child} sleeps={sleeps} plan={plan} /></StaggerItem>

      <SectionTitle title={tr('sj.chartTitle')} />
      <Segmented label={tr('sj.period')} value={String(range) as '7' | '14' | '30'} onChange={(v) => setRange(Number(v) as SleepRange)}
        options={[{ value: '7', label: tr('sj.days', { n: 7 }), testID: 'sj-range-7' }, { value: '14', label: tr('sj.days', { n: 14 }), testID: 'sj-range-14' }, { value: '30', label: tr('sj.days', { n: 30 }), testID: 'sj-range-30' }]} />
      <Card testID="sj-chart">
        {hist.loading ? <Skeleton rows={3} /> : hist.error ? <ErrorView error={hist.error} onRetry={() => { void hist.refetch(); }} /> : (
          <>
            <SleepBars bars={bars} testID="sj-bars" />
            <Text variant="small" style={{ marginTop: spacing.sm }} testID="sj-summary">
              {sum.daysWithData
                ? tr('sj.avgLine', { n: sum.daysWithData, days: range, night: sum.avgNight !== null ? span(sum.avgNight) : '—', nap: sum.avgNap !== null ? span(sum.avgNap) : '—' })
                : tr('sj.noData', { name })}
            </Text>
            <Text variant="caption" muted>{tr('sj.onlyNoted')}</Text>
            <Button size="sm" variant="ghost" icon={asText ? 'bar-chart-2' : 'list'} label={asText ? tr('sj.hideText') : tr('sj.showText')} onPress={() => setAsText(!asText)} testID="sj-as-text" style={{ alignSelf: 'flex-start' }} />
            {asText ? <SleepBarsText bars={bars} /> : null}
          </>
        )}
      </Card>

      <SectionTitle title={tr('sj.historyTitle')} />
      <Segmented label={tr('sj.historyKind')} value={list} onChange={setList}
        options={[{ value: 'nights', label: tr('sj.nights'), testID: 'sj-tab-nights' }, { value: 'naps', label: tr('sj.napsTab'), testID: 'sj-tab-naps' }]} />
      {list === 'nights' ? (
        <View style={{ gap: spacing.xs }} testID="sj-nights">
          {nights.length ? nights.map((n, i) => <StaggerItem key={n.id ?? n.start} index={i}><NightCard n={n} /></StaggerItem>)
            : <Text variant="small" muted>{tr('sj.noNight', { days: range })}</Text>}
          {nights.some((n) => n.feeds.length) ? <Text variant="caption" muted>{tr('sj.feedsInfo')}</Text> : null}
        </View>
      ) : (
        <View style={{ gap: spacing.xs }} testID="sj-naps">
          {naps.length ? naps.map((s) => (
            <Card key={s.id ?? s.start} onPress={s.id ? () => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', id: s.id! } }) : undefined}
              accessibilityLabel={tr('sj.editA11y', { when: dayTitle(s.start) })}>
              <Text weight="bold">{dayTitle(s.start)}</Text>
              <Text variant="small">{tr('sj.napLine', { from: clock(s.start), to: s.end !== null ? clock(s.end) : tr('sj.ongoing'), span: span(s.sleptMinutes) })}</Text>
              {s.note ? <Text variant="small" muted>{s.note}</Text> : null}
            </Card>
          )) : <Text variant="small" muted>{tr('sj.noNap', { days: range })}</Text>}
        </View>
      )}
      <Button size="sm" variant="ghost" icon="edit-3" label={tr('sj.logPast')} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id } })} style={{ alignSelf: 'flex-start' }} testID="sj-log-past" />

      <Journal child={child} notes={rangeNotes} range={range} />

      <ProSummary child={child} sleeps={sleeps} feeds={feeds} notes={notes} range={range} />

      <SectionTitle title={tr('sj.moreTitle')} />
      <View style={{ gap: spacing.xs }}>
        <LinkRow icon="users" title={tr('sj.relay')} sub={tr('sj.relaySub')} onPress={() => router.push('/family/nights')} testID="sj-relay" />
        <LinkRow icon="bell" title={tr('sj.alerts')} sub={tr('sj.alertsSub')} onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'alerts' } })} testID="sj-alerts" />
        <LinkRow icon="list" title={tr('sj.routine')} sub={tr('sj.routineSub')} onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'profile' } })} testID="sj-routine" />
        <LinkRow icon="shield" title={tr('sj.safe')} sub={tr('sj.safeSub')} onPress={() => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, tab: 'safety' } })} testID="sj-safe" />
        <LinkRow icon="book-open" title={tr('sj.articles')} sub={tr('sj.articlesSub')} onPress={() => router.push({ pathname: '/library', params: { cat: 'sommeil' } })} testID="sj-articles" />
      </View>
      <Banner tone="info">{tr('sj.banner')}</Banner>
    </Screen>
  );
}

// ─── Sommeil en cours ──────────────────────────────────────────────────────────────────────────────

function RunningCard({ child, sleeps, plan }: { child: Child; sleeps: Sleep[]; plan: ReturnType<typeof useSleepPlan>['plan'] }) {
  const [tick, setTick] = useState(Date.now());
  const run = runningSleep(sleeps, child.id, new Date(tick));
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [!!run]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Card testID="sj-running">
      {run ? (
        <>
          <Text variant="caption" muted>{tr(run.kind === 'night' ? 'sj.runNight' : 'sj.runNap', { time: clock(run.startedAt) })}</Text>
          <Text variant="hero" accessibilityLiveRegion="none" accessibilityLabel={tr('sj.runA11y', { span: span(run.elapsedMinutes) })} testID="sj-stopwatch">
            {run.wakingSince !== null ? stopwatch(run.wakingSince, tick) : stopwatch(run.startedAt, tick)}
          </Text>
          {run.wakingSince !== null ? <Text variant="small" weight="bold">{tr('sj.wakingSince', { time: clock(run.wakingSince) })}</Text> : null}
          {run.kind === 'night' ? <Text variant="small" muted>{tr('sj.sleptSoFar', { span: span(run.sleptMinutes) })}</Text> : null}
          {run.extraOpen > 0 ? <Banner tone="warning">{tr('sj.extraOpen')}</Banner> : null}
          <Text variant="caption" muted>{tr('sj.persisted')}</Text>
        </>
      ) : <Text variant="small" muted>{tr('sj.notRunning', { name: child.first_name })}</Text>}
      <View style={{ marginTop: spacing.sm }}><SleepRecordButtons child={child} plan={plan} /></View>
    </Card>
  );
}

// ─── Une nuit ──────────────────────────────────────────────────────────────────────────────────────

function NightCard({ n }: { n: NightEntry }) {
  const [open, setOpen] = useState(false);
  const t = useTheme();
  const wk = n.wakings.length + n.untimedWakings;
  return (
    <Card>
      <Tappable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={tr('sj.nightA11y', { day: dayTitle(n.start) })}
        onPress={() => setOpen(!open)} style={{ minHeight: 48 }} testID="sj-night">
        <Row style={{ alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr('sj.nightOf', { day: dayTitle(n.start) })}</Text>
            <Text variant="small">{tr('sj.nightLine', { from: clock(n.start), to: n.end !== null ? clock(n.end) : tr('sj.ongoing'), span: span(n.sleptMinutes) })}</Text>
            <Text variant="small" muted>{tr('sj.wakings', { count: wk })}{n.feeds.length ? ` · ${tr('sj.feedsCount', { count: n.feeds.length })}` : ''}</Text>
          </View>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} color={t.colors.textMuted} />
        </Row>
      </Tappable>
      {open ? (
        <View style={{ marginTop: spacing.xs, gap: 2 }} testID="sj-night-detail">
          {n.events.map((e, i) => (
            <Row key={`${e.type}-${e.at}-${i}`} style={{ alignItems: 'center' }}>
              <Text variant="small" weight="bold" style={{ minWidth: 52 }}>{clock(e.at)}</Text>
              <Icon name={e.type === 'feed' ? 'droplet' : e.type === 'wake' ? 'sun' : e.type === 'waking' ? 'eye' : 'moon'} size={16} color={e.type === 'feed' ? t.colors.gold : t.colors.lavender} />
              <Text variant="small" style={{ flex: 1 }}>
                {e.type === 'feed' ? tr(`sj.feed.${e.feedKind ?? 'bottle'}`) : e.type === 'waking' && e.minutes != null ? tr('sj.ev.wakingFor', { span: span(e.minutes) }) : tr(`sj.ev.${e.type}`)}
              </Text>
            </Row>
          ))}
          {n.untimedWakings ? <Text variant="caption" muted>{tr('sj.untimed', { count: n.untimedWakings })}</Text> : null}
          {n.note ? <Text variant="small" muted>{n.note}</Text> : null}
          {n.id ? <Button size="sm" variant="ghost" icon="edit-3" label={tr('sj.edit')} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', id: n.id! } })} style={{ alignSelf: 'flex-start' }} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

// ─── Journal ───────────────────────────────────────────────────────────────────────────────────────

function Journal({ child, notes, range }: { child: Child; notes: SleepNote[]; range: SleepRange }) {
  const toast = useToast();
  const act = useSleepNoteActions(child);
  const [sheet, setSheet] = useState<SleepNoteKind | null>(null);
  async function del(n: SleepNote) {
    if (!(await confirm(tr('sj.delQ'), tr('sj.delBody'), tr('sj.delete')))) return;
    try { await act.remove(n.id); toast(tr('sj.deleted'), 'success'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <>
      <SectionTitle title={tr('sj.journalTitle')} />
      <Text variant="small" muted>{tr('sj.journalIntro', { name: child.first_name })}</Text>
      <Row wrap>
        <Button icon="cloud-drizzle" variant="secondary" label={tr('sj.addDiff')} onPress={() => setSheet('difficulty')} testID="sj-add-diff" style={{ flexGrow: 1, minHeight: 56 }} />
        <Button icon="repeat" variant="secondary" label={tr('sj.addChange')} onPress={() => setSheet('routine_change')} testID="sj-add-change" style={{ flexGrow: 1, minHeight: 56 }} />
      </Row>
      <View style={{ gap: spacing.xs }} testID="sj-journal">
        {notes.length ? notes.map((n) => (
          <Card key={n.id} tone={n.kind === 'difficulty' ? 'soft' : 'lavender'}>
            <Row style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" muted>{`${tr(n.kind === 'difficulty' ? 'sj.kind.difficulty' : 'sj.kind.routine_change')} · ${formatDate(n.noted_at, { weekday: 'short', day: 'numeric', month: 'short' })}`}</Text>
                {n.tags.length ? <Text weight="bold">{n.tags.map(tagLabel).join(', ')}</Text> : null}
                {n.note ? <Text variant="small">{n.note}</Text> : null}
              </View>
              <Button size="sm" variant="ghost" icon="trash-2" label={tr('sj.delete')} onPress={() => del(n)} />
            </Row>
          </Card>
        )) : <Text variant="small" muted>{tr('sj.noNote', { days: range })}</Text>}
      </View>
      <NoteSheet child={child} kind={sheet} onClose={() => setSheet(null)} onSave={act.add} />
    </>
  );
}

function NoteSheet({ child, kind, onClose, onSave }: { child: Child; kind: SleepNoteKind | null; onClose: () => void; onSave: ReturnType<typeof useSleepNoteActions>['add'] }) {
  const toast = useToast();
  const [tags, setTags] = useState<SleepNoteTag[]>([]);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState<'today' | 'yesterday'>('today');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setTags([]); setNote(''); setWhen('today'); setError(null); }, [kind]);
  if (!kind) return null;
  async function save() {
    const notedAt = new Date();
    if (when === 'yesterday') notedAt.setDate(notedAt.getDate() - 1);
    const draft = { kind: kind!, tags: kind === 'difficulty' ? tags : [], note, notedAt };
    const err = validateNote(draft);
    if (err) { setError(tr(`sj.err.${err}`)); return; }
    setBusy(true);
    try { await onSave(draft); haptic('success'); toast(tr('sj.saved'), 'success'); onClose(); } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }
  return (
    <Sheet visible onClose={onClose} title={tr(kind === 'difficulty' ? 'sj.sheetDiff' : 'sj.sheetChange', { name: child.first_name })}>
      <View style={{ gap: spacing.sm }} testID="sj-note-sheet">
        <Segmented label={tr('sj.when')} value={when} onChange={setWhen} options={[{ value: 'today', label: tr('sj.today') }, { value: 'yesterday', label: tr('sj.yesterday') }]} />
        {kind === 'difficulty' ? (
          <Row wrap>
            {NOTE_TAGS.map((tg) => <Chip key={tg} label={tagLabel(tg)} selected={tags.includes(tg)} onPress={() => setTags(tags.includes(tg) ? tags.filter((x) => x !== tg) : [...tags, tg])} />)}
          </Row>
        ) : null}
        <Field label={tr(kind === 'difficulty' ? 'sj.noteDiff' : 'sj.noteChange')} optional={kind === 'difficulty'} value={note} onChangeText={(v) => { setNote(v); setError(null); }}
          placeholder={tr(kind === 'difficulty' ? 'sj.phDiff' : 'sj.phChange')} multiline maxLength={1000} error={error ?? undefined} testID="sj-note-text" />
        <Button label={tr('sj.save')} size="lg" onPress={save} loading={busy} testID="sj-note-save" />
      </View>
    </Sheet>
  );
}

// ─── Résumé pour le pédiatre ───────────────────────────────────────────────────────────────────────

function ProSummary({ child, sleeps, feeds, notes, range }: { child: Child; sleeps: Sleep[]; feeds: ReturnType<typeof useFeedEvents>; notes: SleepNote[]; range: SleepRange }) {
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const build = () => pediatricSummary({ name: child.first_name, ageLabel: childAge(child.birth_date).label, childId: child.id, sleeps, feeds, notes, days: range, question });
  async function exportFile() {
    const text = build();
    setPreview(text);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const res = await exportTextFile(summaryHtml(text, getLocale()), `sommeil-${child.first_name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${date}.html`, 'text/html', 'public.html', tr('sj.proDialog'));
      toast(res === 'text' ? tr('sj.proShownBelow') : tr('sj.proExported'), res === 'text' ? 'info' : 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function copy() {
    const text = build();
    setPreview(text);
    try {
      if (Platform.OS === 'web') {
        const clip = (globalThis.navigator as { clipboard?: { writeText: (s: string) => Promise<void> } } | undefined)?.clipboard;
        if (!clip) { toast(tr('sj.proShownBelow'), 'info'); return; }
        await clip.writeText(text); toast(tr('sj.copied'), 'success');
      } else await Share.share({ message: text });
    } catch { toast(tr('sj.proShownBelow'), 'info'); }
  }
  return (
    <>
      <SectionTitle title={tr('sj.proTitle')} />
      <Card testID="sj-pro">
        <Text variant="small">{tr('sj.proBody', { days: range })}</Text>
        <Field label={tr('sj.proQuestion')} optional value={question} onChangeText={setQuestion} multiline maxLength={500} />
        <Row wrap>
          <Button icon="printer" label={tr('sj.proExport')} onPress={exportFile} testID="sj-pro-export" style={{ flexGrow: 1 }} />
          <Button icon={Platform.OS === 'web' ? 'copy' : 'share-2'} variant="secondary" label={Platform.OS === 'web' ? tr('sj.proCopy') : tr('sj.proShare')} onPress={copy} testID="sj-pro-copy" style={{ flexGrow: 1 }} />
        </Row>
        <Button size="sm" variant="ghost" icon="eye" label={preview ? tr('sj.proHide') : tr('sj.proPreview')} onPress={() => setPreview(preview ? null : build())} testID="sj-pro-preview" style={{ alignSelf: 'flex-start' }} />
        {preview ? <Card tone="soft"><Text variant="small" selectable testID="sj-pro-text">{preview}</Text></Card> : null}
        <Text variant="caption" muted>{tr('sj.proNothingSent')}</Text>
      </Card>
    </>
  );
}

function LinkRow({ icon, title, sub, onPress, testID }: { icon: React.ComponentProps<typeof Icon>['name']; title: string; sub: string; onPress: () => void; testID?: string }) {
  const t = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${title}. ${sub}`} testID={testID}>
      <Row style={{ alignItems: 'center' }}>
        <Icon name={icon} color={t.colors.lavender} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{title}</Text>
          <Text variant="small" muted>{sub}</Text>
        </View>
        <Icon name="chevron-right" color={t.colors.textMuted} />
      </Row>
    </Card>
  );
}
