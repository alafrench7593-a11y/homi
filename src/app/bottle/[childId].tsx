/**
 * Rappel biberon d'un enfant (écran ouvert aussi par la notification) :
 * dernier biberon enregistré, prochain rappel, « Enregistrer un biberon », « Modifier le rappel », « Annuler ».
 * Pas de chronomètre du temps écoulé : l'horaire du rappel est celui choisi par le parent, jamais calculé par l'application.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { MiniBars, TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { BottleNotificationSettings, noRecommendationNote, parseMl, ReminderChoicePicker } from '@/features/bottle';
import { TimePicker } from '@/features/tracking';
import { useChild, useLogs, useMemberships } from '@/lib/data/hooks';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { Bottle } from '@/lib/types';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useBottleChildren, useBottleTimer, useLastBottle, useNow, useStartBottleTimer, useTimerScheduledHere, useUpdateBottleTimer } from '@/lib/data/hooks-bottle';
import {
  atClock, cancelTimer, computeDueAt, formatClock, formatHM, modifyInterval, nextReminderSentence, parseDelay, remainingMinutes, resolveReminderChoice,
  setReminderAt, snoozeTimer, SNOOZE_PRESETS, type ReminderChoice,
} from '@/lib/domain/bottleTimer';
import { formatDate, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { bottleDayPlan, nextSlot, slotClock } from '@/lib/domain/bottleDayPlan';
import { BottleDayTimeline, openSlot } from '@/features/bottleDay';

type SheetKind = 'start' | 'edit' | null;

export default function BottleReminderScreen() {
  const toast = useToast();
  const th = useTheme();
  const params = useLocalSearchParams<{ childId: string; edit?: string }>();
  const childId = params.childId ?? '';
  const childrenQ = useBottleChildren();
  const membershipsQ = useMemberships();
  const { data: children } = childrenQ;
  const loadingChildren = (membershipsQ.isLoading && !membershipsQ.data) || (childrenQ.isLoading && !children);
  const childrenError = membershipsQ.isError && !membershipsQ.data ? membershipsQ : childrenQ.isError && !children ? childrenQ : null;
  const anyChild = useChild(childId);
  // Seulement un bébé (0 à 2 ans ou profil « Mon bébé est né ») : jamais un enfant plus grand
  const child = anyChild && (children ?? []).some((c) => c.id === anyChild.id) ? anyChild : null;
  const timerQ = useBottleTimer(childId);
  const { active, lastInterval } = timerQ;
  const isLoading = timerQ.isLoading && !timerQ.data;
  const lastBottle = useLastBottle(childId);
  const now = useNow(30_000);
  const update = useUpdateBottleTimer();
  const start = useStartBottleTimer();
  const scheduledHere = useTimerScheduledHere(active);
  // Résumé : biberons notés aujourd'hui et sur 7 jours (vraies saisies uniquement)
  const weekQ = useLogs<Bottle>('bottle', childId || null, 7);

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [startAt, setStartAt] = useState(new Date());
  const [choice, setChoice] = useState<ReminderChoice>({ kind: 'none' });
  const [planned, setPlanned] = useState('');
  const [dueTime, setDueTime] = useState(new Date());
  const [snoozeText, setSnoozeText] = useState('');
  // Ouverture depuis la notification (« Modifier l'intervalle ») : la feuille de modification s'ouvre directement
  const editOpened = React.useRef(false);
  React.useEffect(() => {
    if (params.edit === '1' && active && !editOpened.current) { editOpened.current = true; openEdit(); }
  }, [params.edit, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!child) {
    return (
      <Screen back title={tr('u6.bchild.reminder_title')}>
        {loadingChildren ? <Skeleton kind="detail" rows={4} /> : childrenError ? (
          <ErrorView error={childrenError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title={tr('u6.bchild.error')} />
        ) : (
          anyChild ? (
            <EmptyState icon="info" title={tr('u6.bchild.no_bottle', { name: anyChild.first_name })} body={tr('u6.bchild.baby_only')} action={{ label: tr('u6.bchild.back'), icon: 'arrow-left', onPress: () => router.back() }} />
          ) : (
            <EmptyState icon="user-x" title={tr('u6.bchild.not_found')} body={tr('u6.bchild.not_found_body')} action={{ label: tr('u6.bchild.all'), icon: 'clock', onPress: () => router.replace('/bottle') }} />
          )
        )}
      </Screen>
    );
  }
  const name = child.first_name;

  async function patch(p: Parameters<typeof update.mutateAsync>[0]['patch'], message: string) {
    if (!active) return;
    try {
      await update.mutateAsync({ id: active.id, patch: p });
      haptic('success');
      toast(message);
      setSheet(null);
    } catch (e) {
      toast(friendlyError(e, tr('u6.bchild.edit_failed')), 'error');
    }
  }
  const tryPatch = (fn: () => Parameters<typeof update.mutateAsync>[0]['patch'], message: (p: { due_at?: string }) => string) => {
    try { const p = fn(); return patch(p, message(p as { due_at?: string })); } catch (e) { toast(e instanceof Error ? e.message : tr('u6.bchild.invalid'), 'error'); return undefined; }
  };

  function openStart() {
    const last = lastBottle && Date.now() - Date.parse(lastBottle.at) < 12 * 3600_000 ? new Date(lastBottle.at) : new Date();
    setStartAt(last);
    setChoice(lastInterval != null ? { kind: 'previous', minutes: lastInterval } : { kind: 'none' });
    setPlanned('');
    setSheet('start');
  }
  function openEdit() {
    if (!active) return;
    setChoice({ kind: 'delay', minutes: active.interval_minutes });
    setDueTime(new Date(active.due_at));
    setSnoozeText('');
    setSheet('edit');
  }

  async function submitStart() {
    const minutes = resolveReminderChoice(choice);
    if (minutes == null) return toast(tr('u6.bchild.choose_delay'), 'error');
    const ml = parseMl(planned);
    if (ml.error) return toast(ml.error, 'error');
    try {
      const timer = await start.mutateAsync({ childId, lastBottleAt: startAt, intervalMinutes: minutes, plannedMl: ml.value, bottleId: lastBottle && Date.parse(lastBottle.at) === startAt.getTime() ? lastBottle.id : null, replace: active ? 'restart' : false });
      haptic('success');
      toast(nextReminderSentence(name, timer.due_at));
      setSheet(null);
    } catch (e) {
      toast(friendlyError(e, tr('u6.bchild.schedule_failed')), 'error');
    }
  }

  const others = (children ?? []).filter((c) => c.id !== childId);
  const today = todayISO();
  const week = weekQ.data ?? [];
  const todays = week.filter((b) => todayISO(new Date(b.at)) === today);
  const drunk = todays.reduce((n, b) => n + (b.consumed_ml ?? 0), 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const perDay = days.map((d) => week.filter((b) => todayISO(new Date(b.at)) === d).length);
  const dayLetters = days.map((d) => formatDate(new Date(`${d}T12:00:00`), { weekday: 'short' }).slice(0, 2).toLowerCase());
  const passed = active ? remainingMinutes(active, now) <= 0 : false;
  // Journée biberons : créneaux d'après le délai choisi par le parent (rappel en cours, sinon le dernier choisi)
  const dayInterval = active?.interval_minutes ?? lastInterval ?? null;
  // la nuit compte avec la veille : un biberon des 12 dernières heures reste sur le cadran après minuit
  const dayBottles = week.filter((b) => todayISO(new Date(b.at)) === today || Date.now() - Date.parse(b.at) < 12 * 3600_000);
  const slots = bottleDayPlan({ todays: dayBottles, intervalMinutes: dayInterval, plannedMl: active?.planned_ml ?? null, now });
  const upcoming = nextSlot(slots);
  async function pickInterval(minutes: number) {
    const last = todays.length ? [...todays].sort((a, b) => b.at.localeCompare(a.at))[0] : null;
    if (!last) return;
    try {
      const timer = await start.mutateAsync({ childId, lastBottleAt: new Date(last.at), intervalMinutes: minutes, plannedMl: null, bottleId: last.id, replace: active ? 'restart' : false });
      haptic('success');
      toast(nextReminderSentence(name, timer.due_at));
    } catch (e) {
      toast(friendlyError(e, tr('u6.bchild.schedule_failed')), 'error');
    }
  }

  return (
    <Screen back title={tr('u6.bchild.title', { name })} subtitle={tr('u6.bchild.subtitle')}
      action={{ label: upcoming ? tr('u6.bchild.note_at', { time: slotClock(upcoming.at) }) : todays.length ? tr('u6.bchild.record') : tr('u6.bchild.note_first'), icon: 'plus', testID: 'bottle-record',
        onPress: () => (upcoming ? openSlot(childId, upcoming, active?.id) : router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, from: 'day', ...(active ? { timer: active.id } : {}) } })) }}
      right={<Button label={tr('u6.bchild.history')} icon="list" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/bottle/history', params: { child: childId } })} />}>
      {others.length > 0 && (
        <Row wrap>
          {[child, ...others].map((c) => (
            <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.replace({ pathname: '/bottle/[childId]', params: { childId: c.id } })} />
          ))}
        </Row>
      )}

      <TodaySummary items={[
        { icon: 'droplet', value: String(todays.length), label: tr('u6.bchild.bottles', { count: todays.length }), testID: 'bottle-today-count' },
        { icon: 'bar-chart-2', value: drunk ? `${drunk} ml` : '—', label: tr('u6.bchild.drunk_logged') },
        { icon: 'bell', value: active && !passed ? formatClock(active.due_at) : '—', label: tr('u6.bchild.next_reminder') },
      ]} />
      <BottleDayTimeline childId={childId} slots={slots} intervalMinutes={dayInterval} timerId={active?.id} onPickInterval={pickInterval} name={name} />
      {perDay.some((n) => n > 0) ? <MiniBars values={perDay} labels={dayLetters} testID="bottle-week" /> : null}

      {isLoading ? <Skeleton kind="detail" rows={2} /> : timerQ.isError && !timerQ.data ? (
        <ErrorView error={timerQ.error} onRetry={() => void timerQ.refetch()} title={tr('u6.bchild.error_reminder')} />
      ) : (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <Icon name={active ? 'bell' : 'bell-off'} size={18} color={th.colors.primary} />
              <View style={{ flex: 1, gap: 2 }} testID="bottle-next" accessibilityLiveRegion="polite">
                <Text weight="bold">
                  {active ? (passed ? tr('u6.bottle.was_due', { name, when: atClock(active.due_at, now) }) : nextReminderSentence(name, active.due_at, now)) : tr('u6.bchild.none_for', { name })}
                </Text>
                {active ? <Text variant="caption" muted>{tr('u6.bchild.chosen_delay', { delay: formatHM(active.interval_minutes), time: formatClock(active.last_bottle_at) })}</Text> : null}
              </View>
            </Row>
            <View testID="bottle-last">
              <Text variant="caption" muted>
                {tr('u6.bchild.last', { what: lastBottle
                  ? `${atClock(lastBottle.at, now)}${lastBottle.consumed_ml != null ? tr('u6.bchild.consumed', { n: lastBottle.consumed_ml }) : ''}${lastBottle.prepared_ml != null ? tr('u6.bchild.prepared', { n: lastBottle.prepared_ml }) : ''}`
                  : tr('u6.bchild.none_yet') })}
              </Text>
            </View>
            {active && scheduledHere === false && !passed ? <Text variant="caption" muted>{tr('u6.bchild.no_notif')}</Text> : null}
            {active ? (
              <Row wrap>
                <Button label={tr('u6.bchild.modify')} icon="edit-2" size="sm" variant="secondary" onPress={openEdit} testID="bottle-edit" style={{ flexGrow: 1 }} />
                <Button label={tr('u6.bchild.cancel_reminder')} icon="x" size="sm" variant="ghost" testID="bottle-cancel" style={{ flexGrow: 1 }} onPress={async () => {
                  if (await confirm(tr('u6.bchild.cancel_q'), tr('u6.bchild.cancel_body', { when: atClock(active.due_at), name }), tr('u6.bchild.cancel_reminder'))) {
                    await patch(cancelTimer(), tr('u6.bchild.cancelled', { name }));
                  }
                }} />
              </Row>
            ) : (
              <Button label={tr('u6.bchild.program')} icon="bell" size="sm" variant="secondary" onPress={openStart} testID="bottle-program" />
            )}
          </View>
        </Card>
      )}

      <BottleNotificationSettings />
      <Text variant="caption" muted>{noRecommendationNote()}</Text>

      {/* ------------------------------------------------ modifier le rappel */}
      <Sheet visible={sheet === 'edit'} onClose={() => setSheet(null)} title={tr('u6.bchild.edit_title', { name })}>
        {active ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="label">{tr('u6.bchild.snooze_by')}</Text>
            <Row wrap>
              {SNOOZE_PRESETS.map((m) => (
                <Chip key={m} icon="clock" label={tr('u6.clock.min', { n: m })} onPress={() => tryPatch(() => snoozeTimer(active, m), (p) => `${tr('u6.bchild.snoozed')} ${nextReminderSentence(name, p.due_at!)}`)} />
              ))}
            </Row>
            <Row>
              <View style={{ flex: 1 }}><Field label={tr('u6.bchild.other_snooze')} placeholder={tr('u6.bchild.other_ph')} value={snoozeText} onChangeText={setSnoozeText} autoCapitalize="none" autoCorrect={false} /></View>
              <Button label={tr('u6.bchild.snooze')} size="sm" variant="secondary" onPress={() => {
                const m = parseDelay(snoozeText);
                if (m == null || m > 360) return toast(tr('u6.bchild.snooze_range'), 'error');
                return tryPatch(() => snoozeTimer(active, m), () => tr('u6.bchild.snoozed_by', { delay: formatHM(m) }));
              }} />
            </Row>

            <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u6.bchild.reminder_time')}</Text>
            <TimePicker value={dueTime} onChange={setDueTime} label={tr('u6.bchild.reminder_at')} future />
            <Button label={tr('u6.bchild.save_time')} size="sm" variant="secondary" onPress={() => tryPatch(() => setReminderAt(active, dueTime), (p) => nextReminderSentence(name, p.due_at!))} testID="bottle-set-time" />

            <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u6.bchild.usual')}</Text>
            <Text variant="small" muted>{tr('u6.bchild.recalc', { time: formatClock(active.last_bottle_at) })}</Text>
            <ReminderChoicePicker value={choice} onChange={setChoice} lastInterval={lastInterval} allowNone={false} />
            {resolveReminderChoice(choice) != null ? <Text variant="small" muted>{tr('u6.bchild.new_reminder', { when: atClock(computeDueAt(active.last_bottle_at, resolveReminderChoice(choice)!), now) })}</Text> : null}
            <Button label={tr('u6.bchild.save_interval')} size="sm" testID="bottle-save-interval" onPress={() => {
              const m = resolveReminderChoice(choice);
              if (m == null) return toast(tr('u6.bchild.choose'), 'error');
              return tryPatch(() => modifyInterval(active, m), (p) => nextReminderSentence(name, p.due_at!));
            }} />
          </View>
        ) : null}
      </Sheet>

      {/* ------------------------------------------------ programmer un rappel sans nouveau biberon */}
      <Sheet visible={sheet === 'start'} onClose={() => setSheet(null)} title={tr('u6.bchild.sheet_title', { name })}>
        <TimePicker value={startAt} onChange={setStartAt} label={tr('u6.bchild.last_time')} />
        <Text variant="label">{tr('u6.bottle.custom_label')}</Text>
        <ReminderChoicePicker value={choice} onChange={setChoice} lastInterval={lastInterval} allowNone={false} />
        {resolveReminderChoice(choice) != null ? <Banner tone="info">{nextReminderSentence(name, computeDueAt(startAt, resolveReminderChoice(choice)!), now)}</Banner> : null}
        <Field label={tr('u6.bchild.planned')} optional value={planned} onChangeText={setPlanned} keyboardType="number-pad" suffix="ml" hint={tr('u6.bchild.planned_hint')} />
        <Button label={tr('u6.bchild.program_save')} onPress={submitStart} testID="bottle-start-save" />
      </Sheet>
    </Screen>
  );
}
