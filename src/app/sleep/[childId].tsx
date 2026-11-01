/**
 * Sommeil d'un enfant — planificateur personnalisé (Premium pour les estimations, le reste est gratuit).
 *  · Aujourd'hui : état, grands boutons, planning visuel (réalisé + estimé), modification des horaires,
 *    avis « juste / trop tôt / trop tard ».
 *  · Profil : heures habituelles, siestes, âge corrigé, alimentation, routine, difficultés (gratuit).
 *  · Notifications : choix, délai, jours, plage silencieuse, arrêt complet (Premium).
 *  · Tendances : résumés du jour et de la nuit (gratuits), 7 jours, moyennes, évolution (Premium).
 *  · Sécurité : couchage sûr (sources officielles datées), signes qui doivent faire consulter, fiche pour un
 *    professionnel — toujours gratuits.
 * Les heures affichées sont des estimations personnalisables, jamais des obligations ni des promesses.
 */
import { Tappable } from '@/components/Tappable';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { DayStrip } from '@/features/dayStrip/DayStrip';
import { nowMinute, toDayEvents } from '@/lib/domain/dayTimeline';
import { BarChart } from '@/components/Charts';
import { PremiumSection } from '@/components/Premium';
import { Banner, Button, Card, Chip, Field, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { FeedbackPrompt, SleepEditSheet, SleepRecordButtons, SleepTimeline } from '@/features/sleep';
import { WakeCheckReminder } from '@/features/sleepWakeCheck';
import { backend, eq } from '@/lib/backend';
import { useChild, useChildren, useInvalidate, useMemberships, usePremium, useReminders, useRows } from '@/lib/data/hooks';
import { openLink } from '@/lib/links';
import { friendlyError, useDeleteReminder, useSaveReminder } from '@/lib/data/hooks-settings';
import { saveSleepProfile, useNightFeeds, useSleepNotificationSync, useSleepPlan, type SleepProfileRow } from '@/lib/data/hooks-sleepPlanner';
import { childAge } from '@/lib/domain/child';
import {
  basisText, clock, DIFFICULTIES, DIFFICULTY_LABEL, lastNightReport, minutesToClock, notifyPrefs, parseHM, planLines,
  planSleepNotifications, proSheet, sleepTrends, span, weekView, type Difficulty, type Feeding, type NotifyPrefs,
} from '@/lib/domain/sleepPlanner';
import { SAFE_SLEEP_POINTS, SAFE_SLEEP_SOURCES } from '@/content/safeSleep';
import { SEEK_HELP_NOW } from '@/content/nightHelp';
import { notificationsSupported } from '@/lib/notifications';
import type { Child, Sleep } from '@/lib/types';
import { palette, spacing } from '@/theme/tokens';
import { formatNumber, localeTag, t as tr } from '@/i18n';

type Tab = 'today' | 'profile' | 'alerts' | 'trends' | 'safety';
const TABS = [
  { key: 'today' as Tab, label: 'u4.sp.tab.today' as const }, { key: 'profile' as Tab, label: 'u4.sp.tab.profile' as const }, { key: 'alerts' as Tab, label: 'u4.sp.tab.alerts' as const },
  { key: 'trends' as Tab, label: 'u4.sp.tab.trends' as const }, { key: 'safety' as Tab, label: 'u4.sp.tab.safety' as const },
];
const DAYS = [{ d: 1, l: 'u4.sp.d.mon' as const }, { d: 2, l: 'u4.sp.d.tue' as const }, { d: 3, l: 'u4.sp.d.wed' as const }, { d: 4, l: 'u4.sp.d.thu' as const }, { d: 5, l: 'u4.sp.d.fri' as const }, { d: 6, l: 'u4.sp.d.sat' as const }, { d: 0, l: 'u4.sp.d.sun' as const }];
const FEEDING = [{ v: 'breast' as Feeding, l: 'u4.sp.f.breast' as const }, { v: 'bottle' as Feeding, l: 'u4.sp.f.bottle' as const }, { v: 'mixed' as Feeding, l: 'u4.sp.f.mixed' as const }, { v: 'solids' as Feeding, l: 'u4.sp.f.solids' as const }];
const hm = (v: string | null | undefined) => (v ? v.slice(0, 5) : '');

function ageTips(months: number): string[] {
  if (months < 4) return [tr('u4.sp.tip0a'), tr('u4.sp.tip0b')];
  if (months < 12) return [tr('u4.sp.tip1a'), tr('u4.sp.tip1b')];
  if (months < 36) return [tr('u4.sp.tip2a'), tr('u4.sp.tip2b')];
  return [tr('u4.sp.tip3a'), tr('u4.sp.tip3b')];
}

export default function SleepPlanner() {
  const params = useLocalSearchParams<{ childId: string; tab?: Tab; routine?: string }>();
  const childId = params.childId;
  const child = useChild(childId);
  const childrenQ = useChildren();
  const membershipsQ = useMemberships();
  const isLoading = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !childrenQ.data);
  const loadError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !childrenQ.data ? childrenQ : null;
  const [tab, setTab] = useState<Tab>(params.routine ? 'profile' : TABS.some((x) => x.key === params.tab) ? (params.tab as Tab) : 'today');
  if (!child) {
    return (
      <Screen back title={tr('u4.sp.sleepOf')}>
        {isLoading ? <Skeleton kind="detail" rows={4} /> : loadError ? (
          <ErrorView error={loadError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('u4.child.loadError')} />
        ) : (
          <EmptyState
            icon="user-x"
            title={tr('u4.child.notFound')}
            body={tr('u4.child.notFoundBody')}
            action={{ label: tr('u4.child.backHome'), icon: 'home', onPress: () => router.replace('/(tabs)') }}
          />
        )}
      </Screen>
    );
  }
  return <PlannerBody child={child} tab={tab} setTab={setTab} />;
}

function PlannerBody({ child, tab, setTab }: { child: Child; tab: Tab; setTab: (t: Tab) => void }) {
  const data = useSleepPlan(child);
  const { plan, profile } = data;
  useSleepNotificationSync(child, plan, profile);
  const age = childAge(child.birth_date);
  return (
    <Screen back title={tr('u4.sp.titleOf', { name: child.first_name })} subtitle={plan?.age.corrected ? tr('u4.sp.corrected', { age: age.label }) : age.label}>
      <Row wrap testID="sleep-tabs">
        {TABS.map((x) => <Chip key={x.key} label={tr(x.label)} selected={tab === x.key} onPress={() => setTab(x.key)} accessibilityLabel={tr('u4.sp.tabA11y', { label: tr(x.label) })} />)}
      </Row>
      {tab === 'today' ? <TodayTab child={child} data={data} goSafety={() => setTab('safety')} goProfile={() => setTab('profile')} /> : null}
      {tab === 'profile' ? <ProfileTab child={child} profile={profile} /> : null}
      {tab === 'alerts' ? <AlertsTab child={child} data={data} /> : null}
      {tab === 'trends' ? <TrendsTab child={child} data={data} /> : null}
      {tab === 'safety' ? <SafetyTab child={child} data={data} /> : null}
      <Banner tone="info">{tr('u4.sp.banner')}</Banner>
    </Screen>
  );
}

type PlanData = ReturnType<typeof useSleepPlan>;

// ─── Aujourd'hui ───────────────────────────────────────────────────────────────────────────────────

function TodayTab({ child, data, goSafety, goProfile }: { child: Child; data: PlanData; goSafety: () => void; goProfile: () => void }) {
  const premium = usePremium();
  const toast = useToast();
  const saveReminder = useSaveReminder();
  const deleteReminder = useDeleteReminder();
  const { data: allReminders } = useReminders();
  const { plan, sleeps, profile, feedback, now, loading } = data;
  const [editing, setEditing] = useState<Sleep | null>(null);
  const feeds = useNightFeeds(child.id);
  const night = useMemo(() => lastNightReport(sleeps, child.id, feeds, now), [sleeps, feeds, child.id, now]);
  const name = child.first_name;
  if (loading || !plan) return <Skeleton rows={3} />;
  const lines = planLines(plan, name, child.sex, now);
  const state = lines.find((l) => l.key === 'state')!;
  const estimates = lines.filter((l) => l.key !== 'state');
  const persistent = (profile?.difficulties?.length ?? 0) > 0;

  async function remindRest(at: number) {
    const when = new Date(at - 10 * 60_000);
    if (when.getTime() <= Date.now()) { toast(tr('u4.sp.restSoon'), 'info'); return; }
    try {
      // jamais en double : un rappel « repos » déjà programmé pour cet enfant est remplacé
      for (const r of (allReminders ?? []).filter((x) => x.deep_link === `/sleep/${child.id}` && x.title === `Repos de ${name}`)) await deleteReminder.mutateAsync(r.id);
      await saveReminder.mutateAsync({ draft: { title: `Repos de ${name}`, body: 'Estimation d’après vos relevés : observez les signes de fatigue.', category: 'tracking', schedule: { type: 'once', at: when.toISOString() }, enabled: true, deep_link: `/sleep/${child.id}`, child_id: child.id } });
      toast(tr('u4.sp.reminderSet', { time: clock(when) }), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <TodaySummary testID="sleep-today" items={[
        { icon: 'sun', value: String(plan.napsDone ?? 0), label: tr('u4.sp.sumNaps', { count: plan.napsDone ?? 0 }) },
        { icon: 'clock', value: plan.daySleepMinutes ? span(plan.daySleepMinutes) : '—', label: tr('u4.sp.sumDay') },
        { icon: 'moon', value: night ? String(night.wakings) : '—', label: tr('u4.sp.sumWakings') },
      ]} />
      <DayStrip testID="sleep-day-strip" title={tr('u4.sp.dayStrip')} now={nowMinute(now, now)}
        events={toDayEvents('sleep', sleeps.filter((x) => x.child_id === child.id), now, now)}
        empty={tr('u4.sp.stripEmpty', { name })} />
      <Card>
        <Text variant="heading" testID="sleep-state">{state.text}</Text>
        {plan.assumedWake ? <Text variant="caption" muted>{tr('u4.sp.assumed', { time: hm(profile?.usual_wake) })}</Text> : null}
        {plan.state === 'stale' ? <Text variant="small" muted>{tr('u4.sp.stale')}</Text> : null}
        <View style={{ marginTop: spacing.sm }}><SleepRecordButtons child={child} plan={plan} /></View>
        {plan.state === 'asleep_nap' ? <View style={{ marginTop: spacing.sm }}><WakeCheckReminder child={child} /></View> : null}
      </Card>

      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{tr('u4.sp.previewPrem', { state: state.text, name, basis: plan.samples ? tr('u4.sp.basisSamples', { n: plan.samples }) : tr('u4.sp.basisAge') })}</Text>}>
        <View style={{ gap: spacing.sm }}>
          <View testID="sleep-next">
            <Card tone="soft">
              {estimates.length ? estimates.map((l) => <Text key={l.key} weight={l.key === 'nap' || l.key === 'bedtime' ? 'bold' : undefined} testID={`sleep-line-${l.key}`}>{l.text}</Text>)
                : <Text variant="small" muted>{plan.state === 'asleep_night' || plan.state === 'night_waking' ? tr('u4.sp.nightNoNap') : tr('u4.sp.noteToEstimate')}</Text>}
              <Text variant="caption" muted style={{ marginTop: 4 }} testID="sleep-basis">{tr('u4.sp.basis', { basis: basisText(plan, name) })}</Text>
              <Row wrap style={{ marginTop: 4 }}>
                <Button size="sm" variant="ghost" icon="sliders" label={tr('u4.sp.customise')} onPress={goProfile} />
                {plan.nextNap && !plan.nextNap.overdue ? <Button label={tr('u4.sp.remind10')} size="sm" variant="secondary" icon="bell" onPress={() => remindRest(plan.nextNap!.at)} testID="sleep-remind" /> : null}
              </Row>
            </Card>
          </View>
          <FeedbackPrompt child={child} sleeps={sleeps} profile={profile} feedback={feedback} />
        </View>
      </PremiumSection>

      <SectionTitle title={tr('u4.sl.dayPlan')} />
      <Card>
        <SleepTimeline plan={plan} showEstimates={premium} now={now} onEdit={(id) => setEditing((sleeps as Sleep[]).find((s) => s.id === id) ?? null)} />
        <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u4.sp.touchEdit')}</Text>
      </Card>

      {persistent ? (
        <Banner tone="info" title={tr('u4.nh.lasting')} action={<Button size="sm" variant="secondary" label={tr('u4.sp.prepInfo')} onPress={goSafety} testID="sleep-pro-link" />}>
          {tr('u4.sp.proBody')}
        </Banner>
      ) : null}

      <Row wrap>
        <Button size="sm" variant="secondary" icon="heart" label={tr('u4.nh.title')} onPress={() => router.push(`/sleep/help/${child.id}` as never)} testID="sleep-help-link" />
        <Button size="sm" variant="ghost" icon="moon" label={tr('u4.tonight.title')} onPress={() => router.push({ pathname: '/sleep/tonight', params: { child: child.id } } as never)} testID="sleep-tonight-link" />
        <Button size="sm" variant="ghost" icon="edit-3" label={tr('u4.sl.logPast')} onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id } })} />
      </Row>
      <SleepEditSheet child={child} sleep={editing} all={sleeps as Sleep[]} onClose={() => setEditing(null)} />
    </View>
  );
}

// ─── Profil ────────────────────────────────────────────────────────────────────────────────────────

function ProfileTab({ child, profile }: { child: Child; profile: SleepProfileRow | null }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [wake, setWake] = useState(hm(profile?.usual_wake));
  const [bed, setBed] = useState(hm(profile?.usual_bedtime));
  const [naps, setNaps] = useState<number | null>(profile?.nap_count ?? null);
  const [gw, setGw] = useState(profile?.gestational_weeks ? String(profile.gestational_weeks) : '');
  const [corrected, setCorrected] = useState(!!profile?.use_corrected);
  const [feeding, setFeeding] = useState<Feeding | null>(profile?.feeding ?? null);
  const [routineMin, setRoutineMin] = useState(profile?.routine_minutes ?? 20);
  const [routineNote, setRoutineNote] = useState(profile?.routine_note ?? '');
  const [diffs, setDiffs] = useState<Difficulty[]>(profile?.difficulties ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!profile) return;
    setWake(hm(profile.usual_wake)); setBed(hm(profile.usual_bedtime)); setNaps(profile.nap_count ?? null); setGw(profile.gestational_weeks ? String(profile.gestational_weeks) : '');
    setCorrected(!!profile.use_corrected); setFeeding(profile.feeding ?? null); setRoutineMin(profile.routine_minutes ?? 20); setRoutineNote(profile.routine_note ?? ''); setDiffs(profile.difficulties ?? []);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const w = wake.trim() ? parseHM(wake) : null; const b = bed.trim() ? parseHM(bed) : null;
    if ((wake.trim() && w === null) || (bed.trim() && b === null)) { setError(tr('u4.sp.badHM2')); return; }
    const weeks = gw.trim() ? Number(gw) : null;
    if (weeks !== null && (!Number.isInteger(weeks) || weeks < 22 || weeks > 42)) { setError(tr('u4.sp.badTerm')); return; }
    const fmt = (m: number | null) => (m === null ? null : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    setBusy(true); setError(null);
    try {
      await saveSleepProfile(child, profile, { usual_wake: fmt(w), usual_bedtime: fmt(b), nap_count: naps, gestational_weeks: weeks, use_corrected: corrected && weeks !== null && weeks < 37, feeding, routine_minutes: routineMin, routine_note: routineNote.trim() || null, difficulties: diffs });
      inv('sleep_profiles');
      toast(tr('u4.sp.profileSaved'), 'success');
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: spacing.sm }} testID="sleep-profile">
      <Text variant="small" muted>{tr('u4.sp.profileIntro', { name: child.first_name })}</Text>
      <Card>
        <Row>
          <View style={{ flex: 1 }}><Field label={tr('u4.sp.usualWake')} optional value={wake} onChangeText={setWake} placeholder="07:00" keyboardType="numbers-and-punctuation" maxLength={5} testID="profile-wake" /></View>
          <View style={{ flex: 1 }}><Field label={tr('u4.sp.usualBed')} optional value={bed} onChangeText={setBed} placeholder="19:45" keyboardType="numbers-and-punctuation" maxLength={5} testID="profile-bedtime" /></View>
        </Row>
        <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('u4.sp.napCount')}</Text>
        <Row wrap>
          <Chip label={tr('u4.sp.dontKnow')} selected={naps === null} onPress={() => setNaps(null)} />
          {[0, 1, 2, 3, 4, 5].map((n) => <Chip key={n} label={String(n)} selected={naps === n} onPress={() => setNaps(n)} accessibilityLabel={tr('u4.sl.naps', { count: n })} />)}
        </Row>
      </Card>
      <Card>
        <Field label={tr('u4.sp.gestQ')} optional hint={tr('u4.sp.gestHint')} value={gw} onChangeText={setGw} keyboardType="number-pad" maxLength={2} testID="profile-gw" />
        <ToggleRow label={tr('u4.sp.useCorrected')} value={corrected} onChange={setCorrected} />
        <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('u4.sp.feedingOpt')}</Text>
        <Row wrap>{FEEDING.map((f) => <Chip key={f.v} label={tr(f.l)} selected={feeding === f.v} onPress={() => setFeeding(feeding === f.v ? null : f.v)} />)}</Row>
      </Card>
      <Card>
        <Text variant="small" weight="bold">{tr('u4.sp.routineLen')}</Text>
        <Row wrap>{[10, 15, 20, 30, 45].map((m) => <Chip key={m} label={tr('u4.sp.min', { m })} selected={routineMin === m} onPress={() => setRoutineMin(m)} />)}</Row>
        <Field label={tr('u4.sp.usualRoutine')} optional value={routineNote} onChangeText={setRoutineNote} placeholder={tr('u4.sp.routinePh')} maxLength={300} multiline />
      </Card>
      <Card>
        <Text variant="small" weight="bold">{tr('u4.sp.difficulties')}</Text>
        <Row wrap>{DIFFICULTIES.map((d) => <Chip key={d} label={DIFFICULTY_LABEL[d]} selected={diffs.includes(d)} onPress={() => setDiffs(diffs.includes(d) ? diffs.filter((x) => x !== d) : [...diffs, d])} />)}</Row>
        <Text variant="caption" muted>{tr('u4.sp.diffNote')}</Text>
      </Card>
      {error ? <Text variant="small" color={palette.danger}>{error}</Text> : null}
      <Button label={tr('u4.sp.saveProfile')} onPress={save} loading={busy} testID="profile-save" />
      <BedtimeRoutine child={child} profileBedtime={hm(profile?.usual_bedtime)} />
    </View>
  );
}

interface Routine { id: string; child_id: string; household_id: string; bedtime: string | null; steps: string[]; remind: boolean }
const suggested = () => [tr('u4.sp.s.bath'), tr('u4.sp.s.pyjamas'), tr('u4.sp.s.teeth'), tr('u4.sp.s.story'), tr('u4.sp.s.cuddle'), tr('u4.sp.s.song'), tr('u4.sp.s.nightlight')];

/** Étapes de la routine du coucher (Premium), avec rappel facultatif — inchangé dans son principe. */
function BedtimeRoutine({ child, profileBedtime }: { child: Child; profileBedtime: string }) {
  const toast = useToast();
  const inv = useInvalidate();
  const saveReminder = useSaveReminder();
  const routineQ = useRows<Routine>(['bedtime_routines', child.id], { table: 'bedtime_routines', filters: [eq('child_id', child.id)], limit: 1 });
  const routine = routineQ.data?.[0] ?? null;
  const [bedtime, setBedtime] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [remind, setRemind] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (routine) { setBedtime(routine.bedtime?.slice(0, 5) ?? ''); setSteps(routine.steps); setRemind(routine.remind); } else if (profileBedtime) setBedtime(profileBedtime); }, [routine?.id, profileBedtime]); // eslint-disable-line react-hooks/exhaustive-deps
  const name = child.first_name;
  const SUGGESTED = suggested();

  async function saveRoutine() {
    const m = bedtime.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{2})?$/);
    if (bedtime.trim() && (!m || Number(m[1]) > 23)) { toast(tr('u4.sp.badBed'), 'error'); return; }
    const hmv = m ? `${m[1].padStart(2, '0')}:${m[2] ?? '00'}` : null;
    setSaving(true);
    try {
      const row = { bedtime: hmv, steps, remind: remind && !!hmv, updated_at: new Date().toISOString() };
      if (routine) await backend.update('bedtime_routines', row, [eq('id', routine.id)]);
      else await backend.insert('bedtime_routines', { ...row, child_id: child.id, household_id: child.household_id });
      const existing = await backend.select<{ id: string }>({ table: 'reminders', filters: [eq('child_id', child.id), eq('deep_link', `/sleep/${child.id}?routine=1`)] });
      for (const r of existing) await backend.remove('reminders', [eq('id', r.id)]);
      if (remind && hmv) {
        const [h, mi] = hmv.split(':').map(Number);
        const at = h * 60 + mi - 15;
        await saveReminder.mutateAsync({ draft: { title: `Routine du coucher de ${name}`, body: steps.slice(0, 3).join(' · ') || null, category: 'tracking', schedule: { type: 'daily', hour: Math.floor((at + 1440) % 1440 / 60), minute: (at + 1440) % 60 }, enabled: true, deep_link: `/sleep/${child.id}?routine=1`, child_id: child.id } });
      }
      inv('bedtime_routines', 'reminders');
      toast(tr('u4.sp.routineSaved'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }

  return (
    <>
      <SectionTitle title={tr('u4.sp.bedRoutine')} />
      <PremiumSection feature="bedtime_routine" name={name} preview={<Text variant="small">{tr('u4.sp.forExample', { steps: SUGGESTED.slice(0, 4).join(' → ') })}</Text>}>
        <View testID="bedtime-routine">
          <Card>
            <Field label={tr('u4.sp.bedtime')} optional value={bedtime} onChangeText={setBedtime} placeholder="19:45" keyboardType="numbers-and-punctuation" maxLength={5} testID="routine-time" />
            {steps.map((s, i) => (
              <Row key={`${s}-${i}`} style={{ alignItems: 'center' }}>
                <Text style={{ flex: 1 }}>{`${i + 1}. ${s}`}</Text>
                <IconButton icon="arrow-up" label={tr('u4.sp.moveUp', { s })} onPress={() => i && setSteps((xs) => { const c = [...xs]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })} />
                <IconButton icon="x" label={tr('u4.sp.remove', { s })} onPress={() => setSteps((xs) => xs.filter((_, j) => j !== i))} />
              </Row>
            ))}
            <Row wrap>{SUGGESTED.filter((s) => !steps.includes(s)).map((s) => <Chip key={s} label={`+ ${s}`} onPress={() => steps.length < 12 && setSteps([...steps, s])} />)}</Row>
            <Row style={{ alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Field label={tr('u4.sp.otherStep')} optional value={newStep} onChangeText={setNewStep} maxLength={40} /></View>
              <Button label={tr('u4.sp.add')} size="sm" variant="secondary" onPress={() => { if (newStep.trim() && steps.length < 12) { setSteps([...steps, newStep.trim()]); setNewStep(''); } }} />
            </Row>
            <ToggleRow label={tr('u4.sp.remind15')} value={remind} onChange={setRemind} />
            <Button label={tr('u4.sp.saveRoutine')} onPress={saveRoutine} loading={saving} testID="routine-save" />
          </Card>
        </View>
      </PremiumSection>
    </>
  );
}

// ─── Notifications ─────────────────────────────────────────────────────────────────────────────────

function AlertsTab({ child, data }: { child: Child; data: PlanData }) {
  const toast = useToast();
  const inv = useInvalidate();
  const { plan, profile, now } = data;
  const [p, setP] = useState<NotifyPrefs>(notifyPrefs(profile));
  const [busy, setBusy] = useState(false);
  useEffect(() => { setP(notifyPrefs(profile)); }, [profile?.id, JSON.stringify(profile?.notify)]); // eslint-disable-line react-hooks/exhaustive-deps
  const preview = useMemo(() => (plan ? planSleepNotifications(plan, { ...p, enabled: true }, child.first_name, child.sex, now) : []), [plan, p, child, now]);
  const set = (patch: Partial<NotifyPrefs>) => setP((x) => ({ ...x, ...patch }));
  async function save(next = p) {
    if ((next.quiet_from && parseHM(next.quiet_from) === null) || (next.quiet_to && parseHM(next.quiet_to) === null)) { toast(tr('u4.sp.badQuiet'), 'error'); return; }
    setBusy(true);
    try {
      await saveSleepProfile(child, profile, { notify: next });
      inv('sleep_profiles');
      toast(next.enabled ? tr('u4.sp.notifSaved') : tr('u4.sp.notifStopped'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <PremiumSection feature="sleep_insights" name={child.first_name}
      preview={<Text variant="small">{preview.length ? tr('u4.sp.prevExample', { body: preview[0].body }) : tr('u4.sp.prevGeneric', { name: child.first_name })}</Text>}>
      <View style={{ gap: spacing.sm }} testID="sleep-alerts">
        <Card>
          <ToggleRow label={tr('u4.sp.nGet')} value={p.enabled} onChange={(v) => set({ enabled: v })} />
          <View testID="notify-kinds" style={{ opacity: p.enabled ? 1 : 0.5 }}>
            <ToggleRow label={tr('u4.sp.nSigns')} value={p.signs} onChange={(v) => set({ signs: v })} />
            <ToggleRow label={tr('u4.sp.nNap')} value={p.nap} onChange={(v) => set({ nap: v })} />
            <ToggleRow label={tr('u4.sp.nRoutine')} value={p.routine} onChange={(v) => set({ routine: v })} />
          </View>
        </Card>
        <Card>
          <Text variant="small" weight="bold">{tr('u4.sp.nLead')}</Text>
          <Row wrap>{[5, 10, 15, 20, 30].map((m) => <Chip key={m} label={tr('u4.sp.min', { m })} selected={p.lead === m} onPress={() => set({ lead: m })} />)}</Row>
          <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('u4.sp.nDays')}</Text>
          <Row wrap>{DAYS.map((d) => <Chip key={d.d} label={tr(d.l)} selected={p.days.includes(d.d)} onPress={() => set({ days: p.days.includes(d.d) ? p.days.filter((x) => x !== d.d) : [...p.days, d.d] })} />)}</Row>
          <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{tr('u4.sp.nQuiet')}</Text>
          <Row>
            <View style={{ flex: 1 }}><Field label={tr('u4.sp.from')} optional value={p.quiet_from ?? ''} onChangeText={(v) => set({ quiet_from: v.trim() || null })} placeholder="21:30" keyboardType="numbers-and-punctuation" maxLength={5} testID="notify-quiet-from" /></View>
            <View style={{ flex: 1 }}><Field label={tr('u4.sp.to')} optional value={p.quiet_to ?? ''} onChangeText={(v) => set({ quiet_to: v.trim() || null })} placeholder="07:00" keyboardType="numbers-and-punctuation" maxLength={5} testID="notify-quiet-to" /></View>
          </Row>
        </Card>
        <Row wrap>
          <Button label={tr('u4.sl.save')} onPress={() => save()} loading={busy} testID="notify-save" style={{ flexGrow: 1 }} />
          <Button label={tr('u4.sp.stopAll')} variant="ghost" icon="bell-off" onPress={() => { const next = { ...p, enabled: false }; setP(next); void save(next); }} testID="notify-stop" />
        </Row>
        <SectionTitle title={tr('u4.sp.plannedToday')} />
        <View testID="notify-preview">
          <Card tone="soft">
            {preview.length ? preview.map((n) => <Text key={n.id} variant="small">{`${clock(n.at)} — ${n.body}`}</Text>)
              : <Text variant="small" muted>{tr('u4.sp.noneComing')}</Text>}
            <Text variant="caption" muted style={{ marginTop: 4 }}>
              {notificationsSupported ? tr('u4.sp.scheduledPhone') : tr('u4.sp.notOnWeb')}
            </Text>
          </Card>
        </View>
      </View>
    </PremiumSection>
  );
}

// ─── Tendances ─────────────────────────────────────────────────────────────────────────────────────

function TrendsTab({ child, data }: { child: Child; data: PlanData }) {
  const { plan, sleeps, now } = data;
  const feeds = useNightFeeds(child.id);
  const [range, setRange] = useState<7 | 14>(7);
  const night = useMemo(() => lastNightReport(sleeps, child.id, feeds, now), [sleeps, feeds, child.id, now]);
  const trends = useMemo(() => sleepTrends(sleeps, child.id, now), [sleeps, child.id, now]);
  const week = useMemo(() => weekView(sleeps, child.id, now, range), [sleeps, child.id, now, range]);
  const name = child.first_name;
  const dec = (x: number) => formatNumber(Math.round(x * 10) / 10);
  const question = trends.days
    ? tr('u4.sp.question', { age: childAge(child.birth_date).label, bed: trends.avgBedtime !== null ? minutesToClock(trends.avgBedtime) : tr('u4.sp.notNoted'), wake: trends.avgWake !== null ? minutesToClock(trends.avgWake) : tr('u4.sp.notNoted'), naps: trends.avgNaps !== null ? dec(trends.avgNaps) : '0', napSpan: trends.avgNapMinutes !== null ? tr('u4.sp.napSpan', { span: span(trends.avgNapMinutes) }) : '', wakings: trends.avgWakings !== null ? dec(trends.avgWakings) : '0' })
    : null;
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionTitle title={tr('u4.sp.daySummary')} />
      <Card testID="sleep-day-summary">
        <Text>{tr('u4.sp.daySumLine', { naps: tr('u4.sl.naps', { count: plan?.napsDone ?? 0 }), span: span(plan?.daySleepMinutes ?? 0) })}</Text>
      </Card>
      <SectionTitle title={tr('u4.sp.nightSummary')} />
      <Card testID="sleep-night-summary">
        {night ? (
          <>
            <Text>{tr('u4.sp.bedLine', { start: clock(night.start), rest: night.end ? tr('u4.sp.wakeRest', { time: clock(night.end) }) : tr('u4.sp.nightOngoing') })}</Text>
            <Text variant="small">{tr('u4.sp.sleptLine', { span: span(night.sleptMinutes), wakings: tr('u4.sp.wakings', { count: night.wakings }) })}</Text>
            <Text variant="small">{night.feeds ? tr('u4.sp.nightFeeds', { count: night.feeds, time: clock(night.lastFeed!) }) : tr('u4.sp.noNightFeed')}</Text>
          </>
        ) : <Text variant="small" muted>{tr('u4.sp.noRecentNight')}</Text>}
      </Card>

      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{tr('u4.sp.trendPreview', { days: tr('u4.sp.daysNoted', { count: trends.days }), name })}</Text>}>
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title={tr('u4.sp.avg7')} />
          <View testID="sleep-rhythm">
            <Card>
              {trends.days ? (
                <>
                  <Text>{tr('u4.sp.avgBed', { v: trends.avgBedtime !== null ? tr('u4.sp.around', { time: minutesToClock(trends.avgBedtime) }) : '—' })}</Text>
                  <Text>{tr('u4.sp.avgWake', { v: trends.avgWake !== null ? tr('u4.sp.around', { time: minutesToClock(trends.avgWake) }) : '—' })}</Text>
                  <Text>{tr('u4.sp.avgNaps', { n: trends.avgNaps !== null ? dec(trends.avgNaps) : '—', part: trends.avgNapMinutes !== null ? tr('u4.sp.avgNapPart', { span: span(trends.avgNapMinutes) }) : '' })}</Text>
                  <Text>{tr('u4.sp.avgNight', { night: trends.avgNight !== null ? span(trends.avgNight) : '—', w: trends.avgWakings !== null ? dec(trends.avgWakings) : '—' })}</Text>
                  <Text variant="small" muted>{tr('u4.sp.computed', { days: tr('u4.sp.daysNoted', { count: trends.days }) })}</Text>
                </>
              ) : <Text variant="small" muted>{tr('u4.sp.noFullDay')}</Text>}
            </Card>
          </View>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle title={tr('u4.sp.dayByDay')} />
            <Row><Chip label={tr('u4.sp.r7')} selected={range === 7} onPress={() => setRange(7)} /><Chip label={tr('u4.sp.r14')} selected={range === 14} onPress={() => setRange(14)} /></Row>
          </Row>
          <Card testID="sleep-weekly">
            <BarChart data={week.map((d) => ({ label: range === 7 ? new Date(`${d.date}T12:00:00`).toLocaleDateString(localeTag(), { weekday: 'narrow' }) : String(Number(d.date.slice(8))), value: Math.round(((d.napMinutes + d.nightMinutes) / 60) * 10) / 10 }))} unit="h" accessibilityLabel={tr('u4.sp.hoursA11y', { range })} />
            {week.slice(-7).map((d) => (
              <Text key={d.date} variant="small">{tr('u4.sp.dayLine', { date: new Date(`${d.date}T12:00:00`).toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric' }), naps: tr('u4.sl.naps', { count: d.naps }), span: span(d.napMinutes), bed: d.bedtime ? tr('u4.sp.dlBed', { time: clock(d.bedtime) }) : '', wake: d.wake ? tr('u4.sp.dlWake', { time: clock(d.wake) }) : '', wk: d.nightMinutes ? tr('u4.sp.dlWakings', { wakings: tr('u4.sp.wakings', { count: d.wakings }) }) : '' })}</Text>
            ))}
          </Card>
          <SectionTitle title={tr('u4.sp.rhythm')} />
          <View testID="sleep-changes">
            <Card>
              {trends.changes.length ? trends.changes.map((c) => <Text key={c} variant="small">{`• ${c}`}</Text>) : <Text variant="small" muted>{tr('u4.sp.noChange')}</Text>}
              <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u4.sp.notDiag')}</Text>
            </Card>
          </View>
          {question ? (
            <Card tone="soft">
              <Button size="sm" variant="secondary" icon="message-circle" label={tr('u4.sp.askAssistant')} onPress={() => router.push({ pathname: '/assistant/chat', params: { q: question } })} testID="sleep-ask" />
              <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u4.sp.sentToAssistant')}</Text>
            </Card>
          ) : null}
        </View>
      </PremiumSection>
    </View>
  );
}

// ─── Sécurité et professionnel (toujours gratuit) ──────────────────────────────────────────────────

function SafetyTab({ child, data }: { child: Child; data: PlanData }) {
  const toast = useToast();
  const { sleeps, profile, now } = data;
  const age = childAge(child.birth_date);
  const [note, setNote] = useState('');
  const [sheet, setSheet] = useState<string | null>(null);
  async function share() {
    if (!sheet) return;
    try {
      if (Platform.OS === 'web') { await (globalThis.navigator as { clipboard?: { writeText: (s: string) => Promise<void> } } | undefined)?.clipboard?.writeText(sheet); toast(tr('u4.sp.copied'), 'success'); }
      else await Share.share({ message: sheet });
    } catch { toast(tr('u4.sp.copyFail'), 'info'); }
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionTitle title={tr('u4.sp.safeBaby')} />
      <Card testID="safe-sleep">
        {SAFE_SLEEP_POINTS.map((s) => <Text key={s} variant="small" style={{ marginTop: 2 }}>{`• ${s}`}</Text>)}
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('u4.sp.officialSrc')}</Text>
        {SAFE_SLEEP_SOURCES.map((s) => (
          <Tappable key={s.url} accessibilityRole="link" onPress={() => openLink(s.url, toast)} style={{ alignSelf: 'stretch', marginTop: 4 }}>
            <Text variant="caption" color={palette.lavenderInk} style={{ flex: 1 }}>
              {tr('u4.sp.srcLine', { label: s.label, pub: new Date(`${s.published}T12:00:00`).toLocaleDateString(localeTag()), cons: new Date(`${s.consulted_on}T12:00:00`).toLocaleDateString(localeTag()) })}
            </Text>
          </Tappable>
        ))}
      </Card>
      <SectionTitle title={tr('u4.sp.seekHelp')} />
      <Card tone="danger" testID="sleep-seek-help">
        {SEEK_HELP_NOW.map((s) => <Text key={s} variant="small">{`• ${s}`}</Text>)}
        <Text variant="small" weight="bold" style={{ marginTop: 4 }}>{tr('u4.sp.emergency')}</Text>
      </Card>
      <SectionTitle title={tr('u4.sp.ageRef', { name: child.first_name })} />
      <Card tone="soft">
        {ageTips(age.months).map((x) => <Text key={x} variant="small">{`• ${x}`}</Text>)}
        <Button label={tr('u4.sp.articles')} size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push({ pathname: '/library', params: { cat: 'sommeil' } })} />
      </Card>
      <SectionTitle title={tr('u4.sp.prepTitle')} />
      <Card testID="pro-sheet">
        <Text variant="small">{tr('u4.sp.prepBody')}</Text>
        <Field label={tr('u4.sp.discuss')} optional value={note} onChangeText={setNote} multiline maxLength={500} />
        <Button label={tr('u4.sp.makeSummary')} variant="secondary" icon="file-text" onPress={() => setSheet(proSheet(child.first_name, age.label, profile, sleeps, child.id, now, note))} testID="pro-sheet-make" />
        {sheet ? (
          <>
            <Card tone="soft" style={{ marginTop: spacing.xs }}><Text variant="small" selectable testID="pro-sheet-text">{sheet}</Text></Card>
            <Button label={Platform.OS === 'web' ? tr('u4.sp.copySummary') : tr('u4.sp.shareSummary')} size="sm" icon="share-2" onPress={share} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          </>
        ) : null}
      </Card>
    </View>
  );
}
