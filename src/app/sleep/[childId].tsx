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
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BarChart } from '@/components/Charts';
import { PremiumSection } from '@/components/Premium';
import { Banner, Button, Card, Chip, Field, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { Skeleton } from '@/components/States';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { FeedbackPrompt, SleepEditSheet, SleepRecordButtons, SleepTimeline } from '@/features/sleep';
import { WakeCheckReminder } from '@/features/sleepWakeCheck';
import { backend, eq } from '@/lib/backend';
import { useChild, useInvalidate, usePremium, useReminders, useRows } from '@/lib/data/hooks';
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

type Tab = 'today' | 'profile' | 'alerts' | 'trends' | 'safety';
const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Aujourd’hui' }, { key: 'profile', label: 'Profil' }, { key: 'alerts', label: 'Notifications' },
  { key: 'trends', label: 'Tendances' }, { key: 'safety', label: 'Sécurité' },
];
const DAYS = [{ d: 1, l: 'Lun' }, { d: 2, l: 'Mar' }, { d: 3, l: 'Mer' }, { d: 4, l: 'Jeu' }, { d: 5, l: 'Ven' }, { d: 6, l: 'Sam' }, { d: 0, l: 'Dim' }];
const FEEDING: { v: Feeding; l: string }[] = [{ v: 'breast', l: 'Allaitement' }, { v: 'bottle', l: 'Biberons' }, { v: 'mixed', l: 'Mixte' }, { v: 'solids', l: 'Repas diversifiés' }];
const hm = (v: string | null | undefined) => (v ? v.slice(0, 5) : '');

function ageTips(months: number): string[] {
  if (months < 4) return ['Les nuits sont encore entrecoupées par les repas : c’est habituel à cet âge.', 'Couchez toujours votre bébé sur le dos, dans un lit sans oreiller, couette ni tour de lit.'];
  if (months < 12) return ['Un rituel court et toujours dans le même ordre aide à reconnaître le moment du coucher.', 'Couchage sur le dos, gigoteuse plutôt que couverture, pièce non surchauffée.'];
  if (months < 36) return ['Les siestes évoluent beaucoup entre 1 et 3 ans : suivez les signes de fatigue plutôt que l’horloge.', 'Écrans à éviter avant le coucher ; une lumière douce et un moment calme aident.'];
  return ['Des horaires réguliers, même le week-end, aident l’endormissement.', 'Pas d’écran dans la chambre ni dans l’heure qui précède le coucher.'];
}

export default function SleepPlanner() {
  const params = useLocalSearchParams<{ childId: string; tab?: Tab; routine?: string }>();
  const childId = params.childId;
  const child = useChild(childId);
  const [tab, setTab] = useState<Tab>(params.routine ? 'profile' : TABS.some((x) => x.key === params.tab) ? (params.tab as Tab) : 'today');
  if (!child) return <Screen back title="Sommeil"><Skeleton kind="detail" rows={4} /></Screen>;
  return <PlannerBody child={child} tab={tab} setTab={setTab} />;
}

function PlannerBody({ child, tab, setTab }: { child: Child; tab: Tab; setTab: (t: Tab) => void }) {
  const data = useSleepPlan(child);
  const { plan, profile } = data;
  useSleepNotificationSync(child, plan, profile);
  const age = childAge(child.birth_date);
  return (
    <Screen back title={`Sommeil de ${child.first_name}`} subtitle={plan?.age.corrected ? `${age.label} · repères en âge corrigé` : age.label}>
      <Row wrap testID="sleep-tabs">
        {TABS.map((x) => <Chip key={x.key} label={x.label} selected={tab === x.key} onPress={() => setTab(x.key)} accessibilityLabel={`Onglet ${x.label}`} />)}
      </Row>
      {tab === 'today' ? <TodayTab child={child} data={data} goSafety={() => setTab('safety')} goProfile={() => setTab('profile')} /> : null}
      {tab === 'profile' ? <ProfileTab child={child} profile={profile} /> : null}
      {tab === 'alerts' ? <AlertsTab child={child} data={data} /> : null}
      {tab === 'trends' ? <TrendsTab child={child} data={data} /> : null}
      {tab === 'safety' ? <SafetyTab child={child} data={data} /> : null}
      <Banner tone="info">{'Chaque enfant dort à son rythme. Ces heures sont des estimations à adapter : les signes de fatigue de votre enfant priment, et rien ne garantit une nuit complète. Elles ne remplacent pas l’avis d’un professionnel.'}</Banner>
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
  const name = child.first_name;
  if (loading || !plan) return <Skeleton rows={3} />;
  const lines = planLines(plan, name, child.sex, now);
  const state = lines.find((l) => l.key === 'state')!;
  const estimates = lines.filter((l) => l.key !== 'state');
  const persistent = (profile?.difficulties?.length ?? 0) > 0;

  async function remindRest(at: number) {
    const when = new Date(at - 10 * 60_000);
    if (when.getTime() <= Date.now()) { toast('L’heure estimée est déjà proche : pas de rappel programmé.', 'info'); return; }
    try {
      // jamais en double : un rappel « repos » déjà programmé pour cet enfant est remplacé
      for (const r of (allReminders ?? []).filter((x) => x.deep_link === `/sleep/${child.id}` && x.title === `Repos de ${name}`)) await deleteReminder.mutateAsync(r.id);
      await saveReminder.mutateAsync({ draft: { title: `Repos de ${name}`, body: 'Estimation d’après vos relevés : observez les signes de fatigue.', category: 'tracking', schedule: { type: 'once', at: when.toISOString() }, enabled: true, deep_link: `/sleep/${child.id}`, child_id: child.id } });
      toast(`Rappel programmé à ${clock(when)}.`, 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Card>
        <Text variant="heading" testID="sleep-state">{state.text}</Text>
        {plan.assumedWake ? <Text variant="caption" muted>{`Aucun réveil noté ce matin : calcul à partir de l’heure habituelle (${hm(profile?.usual_wake)}).`}</Text> : null}
        {plan.state === 'stale' ? <Text variant="small" muted>Un relevé a peut-être été oublié : notez le prochain endormissement (ou corrigez l’heure avec « Autre heure… ») pour relancer les estimations.</Text> : null}
        <View style={{ marginTop: spacing.sm }}><SleepRecordButtons child={child} plan={plan} /></View>
        {plan.state === 'asleep_nap' ? <View style={{ marginTop: spacing.sm }}><WakeCheckReminder child={child} /></View> : null}
      </Card>

      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{`${state.text}. Avec Premium, ${name} a sa prochaine sieste, sa routine et son coucher estimés d’après ${plan.samples ? `${plan.samples} temps d’éveil déjà notés` : 'des repères pour son âge, puis ses propres relevés'}, recalculés à chaque relevé.`}</Text>}>
        <View style={{ gap: spacing.sm }}>
          <View testID="sleep-next">
            <Card tone="soft">
              {estimates.length ? estimates.map((l) => <Text key={l.key} weight={l.key === 'nap' || l.key === 'bedtime' ? 'bold' : undefined} testID={`sleep-line-${l.key}`}>{l.text}</Text>)
                : <Text variant="small" muted>{plan.state === 'asleep_night' || plan.state === 'night_waking' ? 'C’est la nuit : pas d’estimation de sieste. Notez simplement les réveils si vous le souhaitez.' : 'Notez un réveil ou un endormissement pour obtenir une estimation.'}</Text>}
              <Text variant="caption" muted style={{ marginTop: 4 }} testID="sleep-basis">{`${basisText(plan, name)} Ce sont des estimations, pas des obligations.`}</Text>
              <Row wrap style={{ marginTop: 4 }}>
                <Button size="sm" variant="ghost" icon="sliders" label="Personnaliser" onPress={goProfile} />
                {plan.nextNap && !plan.nextNap.overdue ? <Button label="Me rappeler 10 min avant" size="sm" variant="secondary" icon="bell" onPress={() => remindRest(plan.nextNap!.at)} testID="sleep-remind" /> : null}
              </Row>
            </Card>
          </View>
          <FeedbackPrompt child={child} sleeps={sleeps} profile={profile} feedback={feedback} />
        </View>
      </PremiumSection>

      <SectionTitle title="Planning de la journée" />
      <Card>
        <SleepTimeline plan={plan} showEstimates={premium} now={now} onEdit={(id) => setEditing((sleeps as Sleep[]).find((s) => s.id === id) ?? null)} />
        <Text variant="caption" muted style={{ marginTop: 4 }}>Touchez un sommeil noté pour corriger ses horaires ou le supprimer : tout le planning est recalculé.</Text>
      </Card>

      {persistent ? (
        <Banner tone="info" title="Une difficulté qui dure ?" action={<Button size="sm" variant="secondary" label="Préparer les informations" onPress={goSafety} testID="sleep-pro-link" />}>
          {'Vous pouvez préparer un résumé de vos relevés pour en parler à votre médecin, à une sage-femme ou à la PMI.'}
        </Banner>
      ) : null}

      <Row wrap>
        <Button size="sm" variant="ghost" icon="moon" label="Aide pour cette nuit" onPress={() => router.push({ pathname: '/sleep/tonight', params: { child: child.id } } as never)} testID="sleep-tonight-link" />
        <Button size="sm" variant="ghost" icon="edit-3" label="Noter un sommeil passé" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id } })} />
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
    if ((wake.trim() && w === null) || (bed.trim() && b === null)) { setError('Heures attendues au format HH:MM (ex. 07:00, 19:45).'); return; }
    const weeks = gw.trim() ? Number(gw) : null;
    if (weeks !== null && (!Number.isInteger(weeks) || weeks < 22 || weeks > 42)) { setError('Terme de naissance : un nombre de semaines entre 22 et 42.'); return; }
    const fmt = (m: number | null) => (m === null ? null : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    setBusy(true); setError(null);
    try {
      await saveSleepProfile(child, profile, { usual_wake: fmt(w), usual_bedtime: fmt(b), nap_count: naps, gestational_weeks: weeks, use_corrected: corrected && weeks !== null && weeks < 37, feeding, routine_minutes: routineMin, routine_note: routineNote.trim() || null, difficulties: diffs });
      inv('sleep_profiles');
      toast('Profil enregistré : les estimations sont recalculées.', 'success');
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  }

  return (
    <View style={{ gap: spacing.sm }} testID="sleep-profile">
      <Text variant="small" muted>{`Uniquement ce qui vous est utile : tout est facultatif et modifiable. Aucune routine universelle n’est imposée à ${child.first_name}.`}</Text>
      <Card>
        <Row>
          <View style={{ flex: 1 }}><Field label="Réveil habituel" optional value={wake} onChangeText={setWake} placeholder="07:00" keyboardType="numbers-and-punctuation" maxLength={5} testID="profile-wake" /></View>
          <View style={{ flex: 1 }}><Field label="Coucher habituel" optional value={bed} onChangeText={setBed} placeholder="19:45" keyboardType="numbers-and-punctuation" maxLength={5} testID="profile-bedtime" /></View>
        </Row>
        <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>Nombre approximatif de siestes</Text>
        <Row wrap>
          <Chip label="Je ne sais pas" selected={naps === null} onPress={() => setNaps(null)} />
          {[0, 1, 2, 3, 4, 5].map((n) => <Chip key={n} label={String(n)} selected={naps === n} onPress={() => setNaps(n)} accessibilityLabel={`${n} sieste(s)`} />)}
        </Row>
      </Card>
      <Card>
        <Field label="Né(e) à combien de semaines d’aménorrhée ?" optional hint="Utile seulement en cas de naissance prématurée (avant 37 semaines)." value={gw} onChangeText={setGw} keyboardType="number-pad" maxLength={2} testID="profile-gw" />
        <ToggleRow label="Utiliser l’âge corrigé pour les repères" value={corrected} onChange={setCorrected} />
        <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>Alimentation (facultatif)</Text>
        <Row wrap>{FEEDING.map((f) => <Chip key={f.v} label={f.l} selected={feeding === f.v} onPress={() => setFeeding(feeding === f.v ? null : f.v)} />)}</Row>
      </Card>
      <Card>
        <Text variant="small" weight="bold">Durée de la routine du soir</Text>
        <Row wrap>{[10, 15, 20, 30, 45].map((m) => <Chip key={m} label={`${m} min`} selected={routineMin === m} onPress={() => setRoutineMin(m)} />)}</Row>
        <Field label="Votre routine habituelle" optional value={routineNote} onChangeText={setRoutineNote} placeholder="Bain, pyjama, histoire, câlin" maxLength={300} multiline />
      </Card>
      <Card>
        <Text variant="small" weight="bold">Difficultés que vous rencontrez (facultatif)</Text>
        <Row wrap>{DIFFICULTIES.map((d) => <Chip key={d} label={DIFFICULTY_LABEL[d]} selected={diffs.includes(d)} onPress={() => setDiffs(diffs.includes(d) ? diffs.filter((x) => x !== d) : [...diffs, d])} />)}</Row>
        <Text variant="caption" muted>Elles servent à vous proposer une fiche pour en parler à un professionnel ; aucune méthode n’est imposée.</Text>
      </Card>
      {error ? <Text variant="small" color={palette.danger}>{error}</Text> : null}
      <Button label="Enregistrer le profil" onPress={save} loading={busy} testID="profile-save" />
      <BedtimeRoutine child={child} profileBedtime={hm(profile?.usual_bedtime)} />
    </View>
  );
}

interface Routine { id: string; child_id: string; household_id: string; bedtime: string | null; steps: string[]; remind: boolean }
const SUGGESTED = ['Bain', 'Pyjama', 'Brossage des dents', 'Histoire', 'Câlin', 'Chanson', 'Veilleuse'];

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

  async function saveRoutine() {
    const m = bedtime.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{2})?$/);
    if (bedtime.trim() && (!m || Number(m[1]) > 23)) { toast('Heure attendue au format HH:MM (ex. 19:45).', 'error'); return; }
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
      toast('Routine enregistrée.', 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setSaving(false); }
  }

  return (
    <>
      <SectionTitle title="Routine du coucher" />
      <PremiumSection feature="bedtime_routine" name={name} preview={<Text variant="small">{`Par exemple : ${SUGGESTED.slice(0, 4).join(' → ')}, avec un rappel à l’heure qui vous convient.`}</Text>}>
        <View testID="bedtime-routine">
          <Card>
            <Field label="Heure du coucher" optional value={bedtime} onChangeText={setBedtime} placeholder="19:45" keyboardType="numbers-and-punctuation" maxLength={5} testID="routine-time" />
            {steps.map((s, i) => (
              <Row key={`${s}-${i}`} style={{ alignItems: 'center' }}>
                <Text style={{ flex: 1 }}>{`${i + 1}. ${s}`}</Text>
                <IconButton icon="arrow-up" label={`Monter « ${s} »`} onPress={() => i && setSteps((xs) => { const c = [...xs]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })} />
                <IconButton icon="x" label={`Retirer « ${s} »`} onPress={() => setSteps((xs) => xs.filter((_, j) => j !== i))} />
              </Row>
            ))}
            <Row wrap>{SUGGESTED.filter((s) => !steps.includes(s)).map((s) => <Chip key={s} label={`+ ${s}`} onPress={() => steps.length < 12 && setSteps([...steps, s])} />)}</Row>
            <Row style={{ alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}><Field label="Autre étape" optional value={newStep} onChangeText={setNewStep} maxLength={40} /></View>
              <Button label="Ajouter" size="sm" variant="secondary" onPress={() => { if (newStep.trim() && steps.length < 12) { setSteps([...steps, newStep.trim()]); setNewStep(''); } }} />
            </Row>
            <ToggleRow label="Me rappeler la routine 15 min avant" value={remind} onChange={setRemind} />
            <Button label="Enregistrer la routine" onPress={saveRoutine} loading={saving} testID="routine-save" />
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
    if ((next.quiet_from && parseHM(next.quiet_from) === null) || (next.quiet_to && parseHM(next.quiet_to) === null)) { toast('Plage silencieuse : heures au format HH:MM.', 'error'); return; }
    setBusy(true);
    try {
      await saveSleepProfile(child, profile, { notify: next });
      inv('sleep_profiles');
      toast(next.enabled ? 'Notifications enregistrées.' : 'Notifications de sommeil arrêtées.', 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <PremiumSection feature="sleep_insights" name={child.first_name}
      preview={<Text variant="small">{preview.length ? `Par exemple aujourd’hui : « ${preview[0].body} »` : `Des notifications douces, calées sur le rythme de ${child.first_name}, que vous choisissez et pouvez couper à tout moment.`}</Text>}>
      <View style={{ gap: spacing.sm }} testID="sleep-alerts">
        <Card>
          <ToggleRow label="Recevoir les notifications de sommeil" value={p.enabled} onChange={(v) => set({ enabled: v })} />
          <View testID="notify-kinds" style={{ opacity: p.enabled ? 1 : 0.5 }}>
            <ToggleRow label="Signes de fatigue à observer" value={p.signs} onChange={(v) => set({ signs: v })} />
            <ToggleRow label="Prochaine sieste estimée" value={p.nap} onChange={(v) => set({ nap: v })} />
            <ToggleRow label="Routine du soir" value={p.routine} onChange={(v) => set({ routine: v })} />
          </View>
        </Card>
        <Card>
          <Text variant="small" weight="bold">Délai avant l’heure estimée</Text>
          <Row wrap>{[5, 10, 15, 20, 30].map((m) => <Chip key={m} label={`${m} min`} selected={p.lead === m} onPress={() => set({ lead: m })} />)}</Row>
          <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>Jours concernés</Text>
          <Row wrap>{DAYS.map((d) => <Chip key={d.d} label={d.l} selected={p.days.includes(d.d)} onPress={() => set({ days: p.days.includes(d.d) ? p.days.filter((x) => x !== d.d) : [...p.days, d.d] })} />)}</Row>
          <Text variant="small" weight="bold" style={{ marginTop: spacing.xs }}>Plage silencieuse</Text>
          <Row>
            <View style={{ flex: 1 }}><Field label="De" optional value={p.quiet_from ?? ''} onChangeText={(v) => set({ quiet_from: v.trim() || null })} placeholder="21:30" keyboardType="numbers-and-punctuation" maxLength={5} testID="notify-quiet-from" /></View>
            <View style={{ flex: 1 }}><Field label="À" optional value={p.quiet_to ?? ''} onChangeText={(v) => set({ quiet_to: v.trim() || null })} placeholder="07:00" keyboardType="numbers-and-punctuation" maxLength={5} testID="notify-quiet-to" /></View>
          </Row>
        </Card>
        <Row wrap>
          <Button label="Enregistrer" onPress={() => save()} loading={busy} testID="notify-save" style={{ flexGrow: 1 }} />
          <Button label="Tout arrêter" variant="ghost" icon="bell-off" onPress={() => { const next = { ...p, enabled: false }; setP(next); void save(next); }} testID="notify-stop" />
        </Row>
        <SectionTitle title="Prévues aujourd’hui avec ces réglages" />
        <View testID="notify-preview">
          <Card tone="soft">
            {preview.length ? preview.map((n) => <Text key={n.id} variant="small">{`${clock(n.at)} — ${n.body}`}</Text>)
              : <Text variant="small" muted>Aucune notification à venir pour l’instant (sommeil en cours, plage silencieuse, jour non choisi ou heure passée).</Text>}
            <Text variant="caption" muted style={{ marginTop: 4 }}>
              {notificationsSupported ? 'Programmées sur ce téléphone et recalculées à chaque relevé.' : 'Sur le web, les notifications ne s’affichent pas : elles sont programmées sur l’application mobile.'}
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
  const dec = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
  const question = trends.days
    ? `Peux-tu m’expliquer simplement ces relevés de sommeil de mon enfant (${childAge(child.birth_date).label}) sur 7 jours, sans diagnostic : coucher moyen ${trends.avgBedtime !== null ? minutesToClock(trends.avgBedtime) : 'non noté'}, réveil moyen ${trends.avgWake !== null ? minutesToClock(trends.avgWake) : 'non noté'}, ${trends.avgNaps !== null ? dec(trends.avgNaps) : '0'} sieste(s) par jour${trends.avgNapMinutes !== null ? ` de ${span(trends.avgNapMinutes)}` : ''}, ${trends.avgWakings !== null ? dec(trends.avgWakings) : '0'} réveil(s) par nuit ?`
    : null;
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionTitle title="Résumé de la journée" />
      <Card testID="sleep-day-summary">
        <Text>{`${plan?.napsDone ?? 0} sieste(s) · ${span(plan?.daySleepMinutes ?? 0)} de sommeil de jour`}</Text>
      </Card>
      <SectionTitle title="Résumé de la nuit" />
      <Card testID="sleep-night-summary">
        {night ? (
          <>
            <Text>{`Coucher ${clock(night.start)}${night.end ? ` · réveil ${clock(night.end)}` : ' · nuit en cours'}`}</Text>
            <Text variant="small">{`${span(night.sleptMinutes)} de sommeil noté · ${night.wakings} réveil(s)`}</Text>
            <Text variant="small">{night.feeds ? `${night.feeds} repas de nuit noté(s), le dernier à ${clock(night.lastFeed!)}` : 'Aucun repas de nuit noté'}</Text>
          </>
        ) : <Text variant="small" muted>Pas de nuit notée récemment.</Text>}
      </Card>

      <PremiumSection feature="sleep_insights" name={name}
        preview={<Text variant="small">{`${trends.days} jour(s) noté(s) sur 7 : Premium calcule les heures moyennes de coucher et de réveil de ${name}, la durée moyenne des siestes, les réveils et l’évolution de son rythme.`}</Text>}>
        <View style={{ gap: spacing.sm }}>
          <SectionTitle title="Moyennes sur 7 jours" />
          <View testID="sleep-rhythm">
            <Card>
              {trends.days ? (
                <>
                  <Text>{`Coucher moyen : ${trends.avgBedtime !== null ? `vers ${minutesToClock(trends.avgBedtime)}` : '—'}`}</Text>
                  <Text>{`Réveil moyen : ${trends.avgWake !== null ? `vers ${minutesToClock(trends.avgWake)}` : '—'}`}</Text>
                  <Text>{`Siestes : ${trends.avgNaps !== null ? dec(trends.avgNaps) : '—'} par jour${trends.avgNapMinutes !== null ? `, ${span(trends.avgNapMinutes)} en moyenne` : ''}`}</Text>
                  <Text>{`Nuit : ${trends.avgNight !== null ? span(trends.avgNight) : '—'} · réveils : ${trends.avgWakings !== null ? dec(trends.avgWakings) : '—'} en moyenne`}</Text>
                  <Text variant="small" muted>{`Calculé sur ${trends.days} jour(s) noté(s) ; les jours sans relevé ne comptent pas.`}</Text>
                </>
              ) : <Text variant="small" muted>Pas encore de journée complète notée.</Text>}
            </Card>
          </View>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionTitle title="Vue jour par jour" />
            <Row><Chip label="7 jours" selected={range === 7} onPress={() => setRange(7)} /><Chip label="14 jours" selected={range === 14} onPress={() => setRange(14)} /></Row>
          </Row>
          <Card testID="sleep-weekly">
            <BarChart data={week.map((d) => ({ label: range === 7 ? new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'narrow' }) : String(Number(d.date.slice(8))), value: Math.round(((d.napMinutes + d.nightMinutes) / 60) * 10) / 10 }))} unit="h" accessibilityLabel={`Heures de sommeil notées par jour, ${range} derniers jours`} />
            {week.slice(-7).map((d) => (
              <Text key={d.date} variant="small">{`${new Date(`${d.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })} : ${d.naps} sieste(s) ${span(d.napMinutes)}${d.bedtime ? ` · coucher ${clock(d.bedtime)}` : ''}${d.wake ? ` · réveil ${clock(d.wake)}` : ''}${d.nightMinutes ? ` · ${d.wakings} réveil(s)` : ''}`}</Text>
            ))}
          </Card>
          <SectionTitle title="Évolution du rythme" />
          <View testID="sleep-changes">
            <Card>
              {trends.changes.length ? trends.changes.map((c) => <Text key={c} variant="small">{`• ${c}`}</Text>) : <Text variant="small" muted>Aucun changement marqué dans les relevés récents.</Text>}
              <Text variant="caption" muted style={{ marginTop: 4 }}>Simple constat de vos relevés, pas un diagnostic. En cas d’inquiétude, demandez un avis médical.</Text>
            </Card>
          </View>
          {question ? (
            <Card tone="soft">
              <Button size="sm" variant="secondary" icon="message-circle" label="Demander à l’assistant d’expliquer" onPress={() => router.push({ pathname: '/assistant/chat', params: { q: question } })} testID="sleep-ask" />
              <Text variant="caption" muted style={{ marginTop: 4 }}>Seules ces moyennes et l’âge sont transmis à l’assistant, sans le prénom. Il explique les relevés, sans poser de diagnostic.</Text>
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
      if (Platform.OS === 'web') { await (globalThis.navigator as { clipboard?: { writeText: (s: string) => Promise<void> } } | undefined)?.clipboard?.writeText(sheet); toast('Résumé copié : vous pouvez le coller dans un message ou l’imprimer.', 'success'); }
      else await Share.share({ message: sheet });
    } catch { toast('Copie impossible ici : sélectionnez le texte pour le copier.', 'info'); }
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionTitle title="Coucher bébé en sécurité" />
      <Card testID="safe-sleep">
        {SAFE_SLEEP_POINTS.map((s) => <Text key={s} variant="small" style={{ marginTop: 2 }}>{`• ${s}`}</Text>)}
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Sources officielles :</Text>
        {SAFE_SLEEP_SOURCES.map((s) => (
          <Text key={s.url} variant="caption" color={palette.lavenderInk} onPress={() => Linking.openURL(s.url)} accessibilityRole="link">
            {`${s.label} — publié le ${new Date(`${s.published}T12:00:00`).toLocaleDateString('fr-FR')}, consulté le ${new Date(`${s.consulted_on}T12:00:00`).toLocaleDateString('fr-FR')}`}
          </Text>
        ))}
      </Card>
      <SectionTitle title="Quand demander un avis médical rapidement" />
      <Card tone="danger" testID="sleep-seek-help">
        {SEEK_HELP_NOW.map((s) => <Text key={s} variant="small">{`• ${s}`}</Text>)}
        <Text variant="small" weight="bold" style={{ marginTop: 4 }}>En cas d’urgence vitale : appelez le 15 (ou le 112).</Text>
      </Card>
      <SectionTitle title={`Repères pour l’âge de ${child.first_name}`} />
      <Card tone="soft">
        {ageTips(age.months).map((x) => <Text key={x} variant="small">{`• ${x}`}</Text>)}
        <Button label="Articles sur le sommeil" size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push({ pathname: '/library', params: { cat: 'sommeil' } })} />
      </Card>
      <SectionTitle title="Préparer un échange avec un professionnel" />
      <Card testID="pro-sheet">
        <Text variant="small">{`Une difficulté qui dure ou un signe qui vous inquiète ? Préparez un résumé de vos relevés à montrer au médecin, à la sage-femme ou à la PMI. Rien n’est envoyé automatiquement.`}</Text>
        <Field label="Ce que vous aimeriez aborder" optional value={note} onChangeText={setNote} multiline maxLength={500} />
        <Button label="Préparer le résumé" variant="secondary" icon="file-text" onPress={() => setSheet(proSheet(child.first_name, age.label, profile, sleeps, child.id, now, note))} testID="pro-sheet-make" />
        {sheet ? (
          <>
            <Card tone="soft" style={{ marginTop: spacing.xs }}><Text variant="small" selectable testID="pro-sheet-text">{sheet}</Text></Card>
            <Button label={Platform.OS === 'web' ? 'Copier le résumé' : 'Partager le résumé'} size="sm" icon="share-2" onPress={share} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          </>
        ) : null}
      </Card>
    </View>
  );
}
