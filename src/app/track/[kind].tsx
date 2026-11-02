/** Saisie / modification / suppression d'une entrée du suivi quotidien. */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary, type SummaryItem } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Chip, Field, haptic, Row, Segmented, Text } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { Stepper, TimePicker, KIND_META } from '@/features/tracking';
import { backend, eq } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import { friendlyError } from '@/lib/data/hooks-settings';
import { goBack } from '@/lib/links';
import { useOfflineStore } from '@/lib/offline';
import { useActiveSubject, useAddLog, useChild, useTrackedChildren, useDeleteRow, useInvalidate, useLogs, useRows } from '@/lib/data/hooks';
import { SafeSleepCard, SafetyNoticeCard } from '@/features/childCare';
import { STOOL_COLORS, STOOL_CONSISTENCY, digestionNotices, stoolNotice, type StoolColor } from '@/lib/domain/childCare';
import { childAge } from '@/lib/domain/child';
import { useBottleChildren, useBottleTimer, useStartBottleTimer, useUpdateBottleTimer } from '@/lib/data/hooks-bottle';
import { noRecommendationNote, parseMl, ReminderChoicePicker } from '@/features/bottle';
import { atClock, bottleDraftDefaults, computeDueAt, markBottleGiven, nextReminderSentence, resolveReminderChoice, type ReminderChoice } from '@/lib/domain/bottleTimer';
import { getPermission, notificationsSupported } from '@/lib/notifications';
import { askNotificationPermission } from '@/lib/notificationPrompt';
import type { BottleRecord } from '@/lib/types-bottle';
import { uuid } from '@/lib/uuid';
import { LOG_TABLE, LOG_TIME_COL, type Bottle, type Breastfeed, type Diaper, type LogKind, type Meal, type Observation, type Pumping, type Sleep } from '@/lib/types';
import { formatDuration, formatTime, toISODate, todayISO } from '@/lib/domain/dates';
import { recordMealFoods } from '@/lib/data/hooks-discoveries';
import { useTheme } from '@/theme/ThemeProvider';
import { DayStrip } from '@/features/dayStrip/DayStrip';
import { LastSideCard, QuickDiaperCard } from '@/features/dayStrip/QuickLog';
import { lastSide, nowMinute, toDayEvents } from '@/lib/domain/dayTimeline';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

type Side = 'left' | 'right' | 'both';
const editing0 = (id: string | undefined) => !!id;
/** La file hors connexion ne sait envoyer que des ajouts : une modification exige le réseau. */
const offlineEdit = () => tr('u7.track.offlineEdit');

/** Lien vers un type de saisie inconnu : écran « introuvable » au lieu d'un plantage. */
const DIGESTIVE: Observation['kind'][] = ['vomit', 'regurgitation', 'diarrhea', 'abdominal_pain', 'bloating', 'crying'];
const OBS_VALUES: Observation['kind'][] = ['temperature', 'vomit', 'regurgitation', 'diarrhea', 'abdominal_pain', 'bloating', 'crying', 'symptom', 'medication', 'note'];
const obsKinds = (): { value: Observation['kind']; label: string }[] => OBS_VALUES.map((value) => ({ value, label: tr(`u7.track.obs.${value}` as TKey) }));

/**
 * Résumé du jour pour ce type de saisie et cet enfant : combien de fois, à quelle heure la dernière, et un total utile
 * (lait bu, temps de sommeil, selles…). Uniquement des saisies réelles ; « — » quand rien n'est noté aujourd'hui.
 */
function TrackToday({ kind, childId }: { kind: LogKind; childId: string }) {
  const q = useLogs<Record<string, unknown>>(kind, childId, 1);
  const today = todayISO();
  const col = LOG_TIME_COL[kind];
  const rows = (q.data ?? []).filter((r) => typeof r[col] === 'string' && todayISO(new Date(r[col] as string)) === today);
  const last = rows[0] ? formatTime(rows[0][col] as string) : '—';
  const items: SummaryItem[] = [
    { icon: KIND_META[kind].icon, value: String(rows.length), label: tr('u7.track.entries', { count: rows.length }), testID: 'track-today-count' },
    { icon: 'clock', value: last, label: tr('u7.track.last') },
  ];
  const minutes = (a: unknown, b: unknown) => (typeof a === 'string' && typeof b === 'string' ? Math.max(0, (Date.parse(b) - Date.parse(a)) / 60000) : 0);
  if (kind === 'bottle') {
    const ml = rows.reduce((n, r) => n + (typeof r.consumed_ml === 'number' ? r.consumed_ml : 0), 0);
    items.push({ icon: 'droplet', value: ml ? `${ml} ml` : '—', label: tr('u7.track.drunk') });
  } else if (kind === 'sleep') {
    const m = rows.reduce((n, r) => n + minutes(r.started_at, r.ended_at), 0);
    items.push({ icon: 'moon', value: m ? formatDuration(m) : '—', label: tr('u7.track.sleep') });
  } else if (kind === 'breastfeed') {
    const m = rows.reduce((n, r) => n + minutes(r.started_at, r.ended_at), 0);
    items.push({ icon: 'watch', value: m ? formatDuration(m) : '—', label: tr('u7.track.totalDuration') });
  } else if (kind === 'diaper') {
    items.push({ icon: 'circle', value: String(rows.filter((r) => r.stool).length), label: tr('u7.track.withStool') });
  } else if (kind === 'pumping') {
    const ml = rows.reduce((n, r) => n + (typeof r.amount_ml === 'number' ? r.amount_ml : 0), 0);
    items.push({ icon: 'droplet', value: ml ? `${ml} ml` : '—', label: tr('u7.track.pumped') });
  }
  return <TodaySummary items={items} testID="track-today" />;
}

export default function TrackEntryRoute() {
  const params = useLocalSearchParams<{ kind: string }>();
  if (params.kind && !(params.kind in LOG_TABLE)) {
    return (
      <Screen back title={tr('u7.track.notFoundTitle')}>
        <EmptyState icon="help-circle" title={tr('u7.track.noType')} body={tr('u7.track.noTypeBody')} action={{ label: tr('u7.track.goTracking'), icon: 'activity', onPress: () => router.replace('/(tabs)/track') }} />
      </Screen>
    );
  }
  return <TrackEntry />;
}

function TrackEntry() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  // timer / planned : ouverture depuis le minuteur (« Marquer le biberon comme donné »)
  const params = useLocalSearchParams<{ kind: LogKind; child?: string; id?: string; timer?: string; planned?: string; ml?: string; at?: string; obs?: string; from?: string }>();
  const kind = (params.kind ?? 'bottle') as LogKind;
  const { data: tracked } = useTrackedChildren();
  const { data: bottleChildren } = useBottleChildren();
  // Biberon : seulement les bébés (0 à 2 ans ou « Mon bébé est né »)
  const children = kind === 'bottle' ? bottleChildren : tracked;
  // Toujours l'enfant affiché (sélecteur), jamais un autre profil par défaut
  const { subject } = useActiveSubject();
  const requested = params.child && (kind !== 'bottle' || !bottleChildren || bottleChildren.some((c) => c.id === params.child)) ? params.child : null;
  const notBottleChild = kind === 'bottle' && !!params.child && !!bottleChildren && !requested && !editing0(params.id);
  const childId = requested || (subject.type === 'child' && children?.some((c) => c.id === subject.id) ? subject.id : children?.[0]?.id) || '';
  const child = useChild(childId);
  const add = useAddLog(kind);
  const del = useDeleteRow(LOG_TABLE[kind]);
  const editing = !!params.id;
  const existingQ = useRows<Record<string, unknown>>([LOG_TABLE[kind], 'edit', params.id ?? ''], editing ? { table: LOG_TABLE[kind], filters: [eq('id', params.id)] } : null);
  const existing = existingQ.data;
  const { data: lastBottle } = useRows<Bottle>(['bottles', childId, 'last'], kind === 'bottle' && childId ? { table: 'bottles', filters: [eq('child_id', childId)], order: [{ col: 'at', asc: false }], limit: 1 } : null);

  const bottleTimer = useBottleTimer(kind === 'bottle' ? childId : null);
  const startTimer = useStartBottleTimer();
  const updateTimer = useUpdateBottleTimer();
  // Valeurs initiales : rien n'est suggéré (seule la quantité prévue saisie sur le minuteur pré-remplit « préparée »)
  const draft = bottleDraftDefaults({ plannedMl: params.planned != null && params.planned !== '' && Number.isInteger(Number(params.planned)) ? Number(params.planned) : null });

  // Saisie rapide (« Lina a bu 150 ml à 14 h ») : heure et quantité bue pré-remplies, à vérifier avant d'enregistrer
  const quickAt = params.at && !Number.isNaN(Date.parse(params.at)) ? new Date(params.at) : null;
  const quickMl = params.ml != null && /^\d{1,3}$/.test(params.ml) ? Number(params.ml) : null;
  const [time, setTime] = useState(quickAt ?? new Date());
  const [prepared, setPrepared] = useState<number | null>(draft.prepared_ml);
  const [consumed, setConsumed] = useState<number | null>(quickMl ?? draft.consumed_ml);
  const [plannedNext, setPlannedNext] = useState(draft.planned_next_ml == null ? '' : String(draft.planned_next_ml));
  const [reminder, setReminder] = useState<ReminderChoice>(draft.reminder);
  const [milkType, setMilkType] = useState('');
  const [moreBottle, setMoreBottle] = useState(false);
  // Le délai habituel de CET enfant est repris (le parent l'a choisi lui-même la fois précédente) ; il reste modifiable
  const reminderTouched = useRef(false);
  useEffect(() => {
    if (kind !== 'bottle' || editing || reminderTouched.current || bottleTimer.lastInterval == null) return;
    setReminder({ kind: 'previous', minutes: bottleTimer.lastInterval });
  }, [kind, editing, bottleTimer.lastInterval]);
  const [side, setSide] = useState<Side>('left');
  const [duration, setDuration] = useState('');
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [amount, setAmount] = useState<number | null>(80);
  const [wet, setWet] = useState(true);
  const [stool, setStool] = useState(false);
  const [stoolColor, setStoolColor] = useState<StoolColor | null>(null);
  const [consistency, setConsistency] = useState<Diaper['stool_consistency']>(null);
  const [blood, setBlood] = useState(false);
  const [sleepKind, setSleepKind] = useState<'nap' | 'night' | 'unknown'>('unknown');
  const [tempMethod, setTempMethod] = useState<Observation['temp_method']>(null);
  const [intensity, setIntensity] = useState<Observation['intensity']>(null);
  const [end, setEnd] = useState(new Date());
  const [wakeups, setWakeups] = useState(0);
  const [description, setDescription] = useState('');
  const [foods, setFoods] = useState('');
  const [texture, setTexture] = useState<Meal['texture']>(null);
  const [reaction, setReaction] = useState('');
  // Ouverture depuis « + Ajouter » (symptôme, note) : le type est présélectionné
  const [obsKind, setObsKind] = useState<Observation['kind']>(() => (OBS_VALUES.some((v) => v === params.obs) ? params.obs as Observation['kind'] : 'temperature'));
  const [temp, setTemp] = useState('');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);
  // Modification : le formulaire n'est montré (et enregistrable) qu'une fois l'entrée chargée, jamais avec l'heure actuelle et des champs vides
  const [formReady, setFormReady] = useState(false);

  // Pré-remplissage : édition, ou dernier type de lait utilisé (jamais de quantité suggérée)
  useEffect(() => {
    if (loadedRef.current) return;
    const r = existing?.[0];
    if (editing && !r) return;
    if (!editing && kind === 'bottle' && lastBottle === undefined) return;
    loadedRef.current = true;
    setFormReady(true);
    if (!r) {
      if (lastBottle?.[0]) setMilkType(lastBottle[0].milk_type ?? '');
      return;
    }
    setNote((r.note as string) ?? '');
    switch (kind) {
      case 'bottle': { const b = r as unknown as BottleRecord; setTime(new Date(b.at)); setPrepared(b.prepared_ml); setConsumed(b.consumed_ml); setMilkType(b.milk_type ?? ''); setPlannedNext(b.planned_next_ml != null ? String(b.planned_next_ml) : ''); break; }
      case 'breastfeed': { const f = r as unknown as Breastfeed; setTime(new Date(f.started_at)); setSide(f.side); if (f.ended_at) setDuration(String(Math.round((new Date(f.ended_at).getTime() - new Date(f.started_at).getTime()) / 60000))); break; }
      case 'pumping': { const p = r as unknown as Pumping; setTime(new Date(p.at)); setAmount(p.amount_ml); setSide(p.side ?? 'both'); break; }
      case 'diaper': { const d = r as unknown as Diaper; setTime(new Date(d.at)); setWet(d.wet); setStool(d.stool); setStoolColor(d.stool_color ?? null); setConsistency(d.stool_consistency ?? null); setBlood(!!d.blood_seen); break; }
      case 'sleep': { const s = r as unknown as Sleep; setTime(new Date(s.started_at)); setEnd(s.ended_at ? new Date(s.ended_at) : new Date()); setWakeups(s.wakeups); setSleepKind(s.kind ?? 'unknown'); break; }
      case 'meal': { const m = r as unknown as Meal; setTime(new Date(m.at)); setDescription(m.description ?? ''); setFoods(m.foods.join(', ')); setTexture(m.texture); setReaction(m.reaction_note ?? ''); break; }
      case 'observation': { const o = r as unknown as Observation; setTime(new Date(o.at)); setObsKind(o.kind); setTemp(o.value_num != null ? String(o.value_num).replace('.', ',') : ''); setLabel(o.label ?? ''); setTempMethod(o.temp_method ?? null); setIntensity(o.intensity ?? null); break; }
    }
  }, [existing, editing, kind, lastBottle]);

  // Chronomètre de tétée
  useEffect(() => {
    if (!timerStart) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - timerStart.getTime()) / 1000)), 1000);
    return () => clearInterval(id);
  }, [timerStart]);

  // Repères de sécurité (quand consulter) à partir des saisies récentes + celle en cours
  const recentObs = useLogs<Observation>('observation', kind === 'observation' ? childId : null, 2);
  // Premier biberon de la journée : après l'enregistrement, la journée biberons complète s'ouvre (créneaux à remplir)
  const bottlesToday = useLogs<{ at: string }>('bottle', kind === 'bottle' ? childId : null, 1);
  const firstOfDay = kind === 'bottle' && !(bottlesToday.data ?? []).some((b) => new Date(b.at).toDateString() === new Date().toDateString());
  const recentDiapers = useLogs<Diaper>('diaper', kind === 'observation' ? childId : null, 4);
  // Frise du jour et saisies en un geste (couches, tétées, sommeils) : vraies saisies uniquement
  const dayRowsQ = useLogs<Record<string, unknown>>(kind, (kind === 'diaper' || kind === 'breastfeed' || kind === 'sleep') ? childId : null, 2);
  const dayRows = (dayRowsQ.data ?? []) as { id?: string; at?: string; started_at?: string; ended_at?: string | null; wet?: boolean; stool?: boolean; side?: Side }[];
  const feedsQ = useLogs<Breastfeed>('breastfeed', kind === 'breastfeed' ? childId : null, 7);
  const notices = kind === 'observation' && child ? digestionNotices({
    ageMonths: childAge(child.birth_date).months,
    observations: [...(recentObs.data ?? []).filter((o) => o.id !== params.id), { at: time.toISOString(), kind: obsKind, value_num: obsKind === 'temperature' ? Number(temp.replace(',', '.')) || null : null }],
    diapers: recentDiapers.data ?? [],
  }) : [];

  function build(): Record<string, unknown> | null {
    const base = { child_id: childId, household_id: child?.household_id, note: note.trim() || null };
    switch (kind) {
      case 'bottle':
        if (prepared != null && consumed != null && consumed > prepared) return setError(tr('u7.track.err.consumedMax')), null;
        if ((prepared ?? 0) > 500 || (consumed ?? 0) > 500) return setError(tr('u7.track.err.qty500')), null;
        {
          const next = parseMl(plannedNext);
          if (next.error) return setError(next.error), null;
          if (!editing && reminder.kind !== 'none' && resolveReminderChoice(reminder) == null) return setError(tr('u7.track.err.reminder')), null;
          return { ...base, at: time.toISOString(), prepared_ml: prepared, consumed_ml: consumed, planned_next_ml: next.value, milk_type: milkType.trim() || null };
        }
      case 'breastfeed': {
        const mins = timerStart ? elapsed / 60 : Number(duration.replace(',', '.'));
        if (!timerStart && duration && (!Number.isFinite(mins) || mins <= 0 || mins > 180)) return setError(tr('u7.track.err.duration')), null;
        const start = timerStart ?? time;
        return { ...base, side, started_at: start.toISOString(), ended_at: mins ? new Date(start.getTime() + mins * 60000).toISOString() : null };
      }
      case 'pumping':
        if (!amount) return setError(tr('u7.track.err.pumped')), null;
        return { ...base, at: time.toISOString(), amount_ml: amount, side };
      case 'diaper':
        if (!wet && !stool && !note.trim()) return setError(tr('u7.track.err.diaper')), null;
        return { ...base, at: time.toISOString(), wet, stool, stool_color: stool ? stoolColor : null, stool_consistency: stool ? consistency : null, blood_seen: stool && blood };
      case 'sleep':
        if (end < time) return setError(tr('u7.track.err.sleepEnd')), null;
        return { ...base, started_at: time.toISOString(), ended_at: end.toISOString(), wakeups, kind: sleepKind === 'unknown' ? null : sleepKind };
      case 'meal':
        return { ...base, at: time.toISOString(), description: description.trim() || null, foods: foods.split(',').map((f) => f.trim()).filter(Boolean), texture, reaction_note: reaction.trim() || null };
      case 'observation': {
        if (obsKind === 'temperature') {
          const v = Number(temp.replace(',', '.'));
          if (!Number.isFinite(v) || v < 34 || v > 43) return setError(tr('u7.track.err.temp')), null;
          return { ...base, at: time.toISOString(), kind: obsKind, value_num: v, label: null, temp_method: tempMethod, intensity: null };
        }
        if (!DIGESTIVE.includes(obsKind) && !label.trim() && !note.trim()) return setError(tr('u7.track.err.label')), null;
        return { ...base, at: time.toISOString(), kind: obsKind, value_num: null, label: label.trim() || null, temp_method: null, intensity: DIGESTIVE.includes(obsKind) ? intensity : null };
      }
    }
  }

  async function save() {
    setError(null);
    const row = build();
    if (!row) return;
    setSaving(true);
    try {
      if (editing) {
        if (!formReady) return; // entrée pas encore chargée : rien n'est écrasé
        if (backend.mode !== 'demo' && !useOfflineStore.getState().online) return setError(offlineEdit());
        // L'enfant et le foyer de l'entrée ne changent jamais lors d'une modification
        const { household_id: _h, child_id: _c, ...patch } = row; // eslint-disable-line @typescript-eslint/no-unused-vars
        await backend.update(LOG_TABLE[kind], patch, [eq('id', params.id)]);
        inv(LOG_TABLE[kind]);
        toast(tr('u7.track.edited'));
      } else if (kind === 'bottle') {
        const id = uuid();
        const res = await add.mutateAsync({ ...row, id });
        const timerNote = await afterBottleSaved(res === 'sent' ? id : null, (row.planned_next_ml as number | null) ?? null);
        toast(
          (res === 'queued' ? tr('u7.track.bottleQueued') : tr('u7.track.bottleSaved')) + (timerNote ? ` ${timerNote}` : ''),
          res === 'queued' ? 'info' : 'success',
        );
      } else {
        const res = await add.mutateAsync(row);
        if (kind === 'meal' && res === 'sent') {
          const list = (row.foods as string[]) ?? [];
          if (list.length) {
            // F-02 : aliment relié au catalogue « Ses découvertes » ; F-03 : date LOCALE du repas
            if (childId && child?.household_id) await recordMealFoods({ id: childId, household_id: child.household_id }, list, toISODate(time), reaction.trim() || null).catch(() => undefined);
            inv('food_introductions');
          }
        }
        toast(res === 'queued' ? tr('u7.track.queued') : tr('u7.track.kindSaved', { kind: KIND_META[kind].label }), res === 'queued' ? 'info' : 'success');
      }
      haptic('success');
      if (kind === 'bottle' && !editing && firstOfDay && params.from !== 'day' && childId && time.toDateString() === new Date().toDateString()) {
        router.replace({ pathname: '/bottle/[childId]', params: { childId } });
      } else {
        goBack('/(tabs)/track');
      }
    } catch (e) {
      setError(editing && e instanceof BackendError && e.isNetwork ? offlineEdit() : friendlyError(e, tr('u7.track.saveFail')));
    } finally {
      setSaving(false);
    }
  }

  /**
   * Après l'enregistrement d'un biberon : démarre le rappel choisi (en remplaçant, après accord,
   * le minuteur en cours — jamais deux pour un enfant), ou clôt le minuteur dont on vient.
   * Renvoie une phrase pour le message de confirmation.
   */
  async function afterBottleSaved(bottleId: string | null, plannedMl: number | null): Promise<string | null> {
    const minutes = resolveReminderChoice(reminder);
    const active = bottleTimer.active;
    const name = child?.first_name ?? tr('u7.track.theChild');
    // F-08 : biberon noté après coup dont le rappel serait déjà passé → pas de rappel échu
    const past = minutes != null && computeDueAt(time, minutes).getTime() <= Date.now();
    try {
      if (past) {
        if (active) await updateTimer.mutateAsync({ id: active.id, patch: markBottleGiven() });
        return tr('u7.track.reminderPastSkipped');
      }
      if (minutes == null) {
        // Nouveau biberon sans rappel : l'ancien rappel (encore actif) est clos, jamais laissé en double
        if (!active) return null;
        await updateTimer.mutateAsync({ id: active.id, patch: markBottleGiven() });
        return tr('u7.track.oldReminderClosed', { name });
      }
      // Consentement : la première fois qu'un rappel est choisi, le téléphone demande l'autorisation
      if (notificationsSupported && (await getPermission()) === 'undetermined') {
        await askNotificationPermission(tr('u7.track.notifReason')).catch(() => undefined);
      }
      // L'ancien rappel est annulé et remplacé par le nouveau (un seul rappel par enfant)
      const timer = await startTimer.mutateAsync({ childId, lastBottleAt: time, intervalMinutes: minutes, plannedMl, bottleId, replace: active ? 'new_bottle' : false });
      return nextReminderSentence(name, timer.due_at);
    } catch (e) {
      return tr('u7.track.reminderFail', { reason: e instanceof Error ? e.message : tr('u7.track.unknownError') });
    }
  }

  async function remove() {
    if (!(await confirm(tr('u7.track.delAsk'), tr('u7.track.delBody'), tr('u7.track.delete')))) return;
    try {
      await del.mutateAsync(params.id!);
    } catch (e) {
      // L'entrée reste affichée : rien n'a été supprimé
      toast(friendlyError(e), 'error');
      return;
    }
    toast(tr('u7.track.deleted'));
    goBack('/(tabs)/track');
  }

  if (editing && !formReady) {
    const title = tr('u7.track.titleEdit', { kind: KIND_META[kind].label.toLowerCase() });
    if (existingQ.isError) {
      return (
        <Screen back title={title}>
          <ErrorView error={existingQ.error} onRetry={() => existingQ.refetch()} />
        </Screen>
      );
    }
    if (existingQ.isSuccess && !existing?.[0]) {
      return (
        <Screen back title={tr('u7.track.notFoundTitle')}>
          <EmptyState icon="help-circle" title={tr('u7.track.goneTitle')} body={tr('u7.track.goneBody')} action={{ label: tr('u7.track.back'), icon: 'arrow-left', onPress: () => goBack('/(tabs)/track') }} />
        </Screen>
      );
    }
    return (
      <Screen back title={title} footer={<Button label={tr('u7.track.saveChanges')} size="lg" disabled onPress={save} testID="track-save" />}>
        <Skeleton kind="detail" rows={5} />
      </Screen>
    );
  }

  if (notBottleChild) {
    return (
      <Screen back title={KIND_META[kind].label}>
        <Banner tone="info">{tr('u7.track.notBottle')}</Banner>
      </Screen>
    );
  }
  if (!childId) {
    return (
      <Screen back title={KIND_META[kind].label}>
        <Banner tone="info">{kind === 'bottle' ? tr('u7.track.addBaby') : tr('u7.track.addChildFirst')}</Banner>
        <Button label={tr('u7.track.addProfile')} onPress={() => router.replace('/profiles/new')} />
      </Screen>
    );
  }

  const fmtTimer = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <Screen
      back
      title={tr(editing ? 'u7.track.titleEdit' : 'u7.track.titleAdd', { kind: KIND_META[kind].label.toLowerCase() })}
      subtitle={child ? tr('u7.track.forName', { name: child.first_name }) : undefined}
      footer={
        <View style={{ gap: spacing.xs }}>
          <Button label={editing ? tr('u7.track.saveChanges') : child ? tr('u7.track.saveFor', { name: child.first_name }) : tr('u7.track.save')} size="lg" loading={saving} disabled={editing && !formReady} onPress={save} testID="track-save" />
          {editing && <Button label={tr('u7.track.delete')} variant="ghost" icon="trash-2" onPress={remove} />}
        </View>
      }
    >
      {children && children.length > 1 && !editing && (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      )}
      {child ? (
        <View testID="track-for" accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="caption" weight="bold" muted>{tr('u7.track.concerned')}</Text>
          <Text weight="bold">{child.first_name}</Text>
        </View>
      ) : null}
      {!editing ? <TrackToday kind={kind} childId={childId} /> : null}
      {!editing && kind === 'diaper' && child ? (
        <QuickDiaperCard childId={childId} householdId={child.household_id} name={child.first_name}
          lastAt={[...dayRows].map((r) => r.at).filter((x): x is string => !!x).sort().pop() ?? null} />
      ) : null}
      {!editing && kind === 'breastfeed' ? (
        <LastSideCard last={lastSide(feedsQ.data ?? [])} running={!!timerStart}
          onStart={(sd) => { setSide(sd); setTimerStart(new Date()); }} />
      ) : null}
      {!editing && (kind === 'diaper' || kind === 'breastfeed' || kind === 'sleep') ? (
        <DayStrip
          testID="track-day-strip"
          title={kind === 'diaper' ? tr('u7.track.diaperChanges') : kind === 'sleep' ? tr('u7.track.sleepsToday') : tr('u7.track.feedsToday')}
          events={toDayEvents(kind === 'diaper' ? 'diaper' : kind === 'sleep' ? 'sleep' : 'feed', dayRows)}
          now={nowMinute()}
          legend={kind === 'diaper' ? [{ kind: 'diaper', label: tr('u7.track.wet') }, { kind: 'feed', label: tr('u7.track.withStool') }] : undefined}
          empty={kind === 'diaper' ? tr('u7.track.emptyDiaper') : tr('u7.track.emptyToday')}
        />
      ) : null}
      {!editing && (kind === 'diaper' || kind === 'breastfeed') ? <Text variant="label" muted style={{ marginTop: spacing.xs }}>{tr('u7.track.orDetail')}</Text> : null}
      {error ? <Banner tone="danger">{error}</Banner> : null}

      {kind === 'bottle' && (
        <>
          <TimePicker value={time} onChange={setTime} label={tr('u7.track.bottleTime')} />
          <Stepper label={tr('u7.track.prepared')} value={prepared} onChange={setPrepared} presets={[60, 90, 120, 150, 180, 210, 240]} />
          <Stepper label={tr('u7.track.consumed')} value={consumed} onChange={setConsumed} />
          {!editing && (
            <View style={{ gap: spacing.xs }} testID="bottle-reminder">
              <Text variant="label">{tr('u7.track.nextReminder', { name: child?.first_name ?? '' })}</Text>
              <ReminderChoicePicker value={reminder} onChange={(c) => { reminderTouched.current = true; setReminder(c); }} lastInterval={bottleTimer.lastInterval} />
              {resolveReminderChoice(reminder) != null
                ? (computeDueAt(time, resolveReminderChoice(reminder)!).getTime() <= Date.now()
                  ? <Banner tone="warning" icon="bell">{tr('u7.track.reminderPast', { time: atClock(computeDueAt(time, resolveReminderChoice(reminder)!)) })}</Banner>
                  : <Banner tone="info" icon="bell">{nextReminderSentence(child?.first_name ?? '', computeDueAt(time, resolveReminderChoice(reminder)!))}</Banner>)
                : <Text variant="small" muted>{tr('u7.track.noReminder')}</Text>}
              {bottleTimer.active ? <Text variant="small" muted>{tr('u7.track.replaced', { time: atClock(bottleTimer.active.due_at) })}</Text> : null}
              <Text variant="caption" muted>{noRecommendationNote()}</Text>
            </View>
          )}
          <Button label={moreBottle ? tr('u7.track.lessDetail') : tr('u7.track.moreDetail')} variant="ghost" size="sm" icon={moreBottle ? 'chevron-up' : 'chevron-down'} onPress={() => setMoreBottle(!moreBottle)} style={{ alignSelf: 'flex-start' }} />
          {moreBottle || editing ? (
            <>
              <Field label={tr('u7.track.milkType')} optional value={milkType} onChangeText={setMilkType} placeholder={tr('u7.track.milkPh')} hint={tr('u7.track.milkHint')} />
              <Field label={tr('u7.track.plannedNext')} optional value={plannedNext} onChangeText={setPlannedNext} keyboardType="number-pad" suffix="ml" hint={tr('u7.track.plannedHint')} />
            </>
          ) : null}
        </>
      )}

      {(kind === 'breastfeed' || kind === 'pumping') && (
        <Segmented label={tr('u7.track.side')} value={side} onChange={setSide} options={[{ value: 'left', label: tr('u7.track.left') }, { value: 'right', label: tr('u7.track.right') }, { value: 'both', label: tr('u7.track.both') }]} />
      )}
      {kind === 'breastfeed' && (
        <>
          {!editing && (
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
              <Text variant="hero" accessibilityLiveRegion="polite">{timerStart ? fmtTimer : '0:00'}</Text>
              <Button label={timerStart ? tr('u7.track.stopSave') : tr('u7.track.startTimer')} icon={timerStart ? 'square' : 'play'} variant={timerStart ? 'primary' : 'secondary'} onPress={timerStart ? save : () => { setTimerStart(new Date()); haptic('light'); }} />
            </View>
          )}
          {!timerStart && (
            <>
              <Text muted center>{tr('u7.track.orAfter')}</Text>
              <TimePicker value={time} onChange={setTime} label={tr('u7.track.start')} />
              <Field label={tr('u7.track.durationMin')} optional value={duration} onChangeText={setDuration} keyboardType="number-pad" />
            </>
          )}
        </>
      )}
      {kind === 'pumping' && (
        <>
          <TimePicker value={time} onChange={setTime} />
          <Stepper label={tr('u7.track.amountPumped')} value={amount} onChange={setAmount} presets={[40, 60, 80, 100, 120, 150]} />
        </>
      )}

      {kind === 'diaper' && (
        <>
          <TimePicker value={time} onChange={setTime} />
          <Row wrap>
            <Chip label={tr('u7.track.wet')} icon="droplet" selected={wet} onPress={() => setWet(!wet)} />
            <Chip label={tr('u7.track.stool')} icon="circle" selected={stool} onPress={() => setStool(!stool)} />
          </Row>
          {stool ? (
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('u7.track.color')}</Text>
              <Row wrap>{STOOL_COLORS.map((c) => <Chip key={c.value} label={c.label} selected={stoolColor === c.value} onPress={() => setStoolColor(stoolColor === c.value ? null : c.value)} />)}</Row>
              <Text variant="label">{tr('u7.track.consistency')}</Text>
              <Row wrap>{STOOL_CONSISTENCY.map((c) => <Chip key={c.value} label={c.label} selected={consistency === c.value} onPress={() => setConsistency(consistency === c.value ? null : c.value)} />)}</Row>
              <Row wrap><Chip label={tr('u7.track.sawBlood')} icon="alert-triangle" selected={blood} onPress={() => setBlood(!blood)} /></Row>
              {stoolNotice({ stool_color: stoolColor, blood_seen: blood }) ? <SafetyNoticeCard n={stoolNotice({ stool_color: stoolColor, blood_seen: blood })!} /> : null}
            </View>
          ) : null}
        </>
      )}

      {kind === 'sleep' && (
        <>
          <Segmented label={tr('u7.track.sleepType')} value={sleepKind} onChange={setSleepKind} options={[{ value: 'nap', label: tr('u7.track.nap') }, { value: 'night', label: tr('u7.track.night') }, { value: 'unknown', label: tr('u7.track.unspecified') }]} />
          <TimePicker value={time} onChange={setTime} label={tr('u7.track.fellAsleep')} />
          <TimePicker value={end} onChange={setEnd} label={tr('u7.track.wake')} />
          <Text muted>{tr('u7.track.durationLine', { duration: formatDuration((end.getTime() - time.getTime()) / 60000) })}</Text>
          <Stepper label={tr('u7.track.wakeups')} value={wakeups} onChange={(v) => setWakeups(v ?? 0)} step={1} unit={tr('u7.track.wakeupsUnit')} />
          <SafeSleepCard />
        </>
      )}

      {kind === 'meal' && (
        <>
          <TimePicker value={time} onChange={setTime} />
          <Field label={tr('u7.track.meal')} optional value={description} onChangeText={setDescription} placeholder={tr('u7.track.mealPh')} />
          <Field label={tr('u7.track.foods')} optional value={foods} onChangeText={setFoods} placeholder={tr('u7.track.foodsPh')} hint={tr('u7.track.foodsHint')} />
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">{tr('u7.track.texture')}</Text>
            <Row wrap>
              {(['smooth', 'mashed', 'pieces', 'family'] as const).map((k) => (
                <Chip key={k} label={tr(`u7.track.tex.${k}` as TKey)} selected={texture === k} onPress={() => setTexture(texture === k ? null : k)} />
              ))}
            </Row>
          </View>
          <Field label={tr('u7.track.reaction')} optional value={reaction} onChangeText={setReaction} multiline />
          <Banner tone="danger" title={tr('u7.track.reactionTitle')}>{tr('u7.track.reactionBody')}</Banner>
        </>
      )}

      {kind === 'observation' && (
        <>
          <Text variant="label">{tr('u7.track.type')}</Text>
          <Row wrap>{obsKinds().map((o) => <Chip key={o.value} label={o.label} selected={obsKind === o.value} onPress={() => setObsKind(o.value)} />)}</Row>
          <TimePicker value={time} onChange={setTime} />
          {obsKind === 'temperature' ? (
            <>
              <Field label={tr('u7.track.tempMeasured')} value={temp} onChangeText={setTemp} keyboardType="decimal-pad" suffix="°C" />
              <Row wrap>{(['rectal', 'axillary', 'ear', 'forehead', 'other'] as const).map((k) => <Chip key={k} label={tr(`u7.track.m.${k}` as TKey)} selected={tempMethod === k} onPress={() => setTempMethod(tempMethod === k ? null : k)} />)}</Row>
            </>
          ) : DIGESTIVE.includes(obsKind) ? (
            <>
              <Text variant="label">{tr('u7.track.intensity')}</Text>
              <Row wrap>{([1, 2, 3] as const).map((k) => <Chip key={k} label={tr(`u7.track.i.${k}` as TKey)} selected={intensity === k} onPress={() => setIntensity(intensity === k ? null : k)} />)}</Row>
            </>
          ) : (
            <Field
              label={obsKind === 'medication' ? tr('u7.track.medLabel') : obsKind === 'symptom' ? tr('u7.track.symptomLabel') : tr('u7.track.titleLabel')}
              value={label}
              onChangeText={setLabel}
              hint={obsKind === 'medication' ? tr('u7.track.medHint') : undefined}
            />
          )}
          {notices.map((n) => <SafetyNoticeCard key={n.title} n={n} />)}
          <Banner tone="warning">{tr('u7.track.obsBanner')}</Banner>
        </>
      )}

      <Field label={tr('u7.track.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} />
      {kind === 'observation' && <Text variant="caption" muted color={t.colors.textMuted}>{tr('u7.track.noReplace')}</Text>}
    </Screen>
  );
}
