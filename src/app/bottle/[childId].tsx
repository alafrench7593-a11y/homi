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
import { Banner, Button, Card, Chip, Field, haptic, Row, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { BottleNotificationSettings, NO_RECOMMENDATION_NOTE, parseMl, ReminderChoicePicker } from '@/features/bottle';
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
import { spacing } from '@/theme/tokens';

type SheetKind = 'start' | 'edit' | null;

export default function BottleReminderScreen() {
  const toast = useToast();
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
      <Screen back title="Rappel biberon">
        {loadingChildren ? <Skeleton kind="detail" rows={4} /> : childrenError ? (
          <ErrorView error={childrenError.error} onRetry={() => { void membershipsQ.refetch(); void childrenQ.refetch(); }} title="Impossible d’afficher ce rappel" />
        ) : (
          anyChild ? (
            <EmptyState icon="info" title={`Pas de biberon pour ${anyChild.first_name}`} body="Le rappel biberon concerne les bébés jusqu’à 2 ans (profil « Mon bébé est né »)." action={{ label: 'Retour', icon: 'arrow-left', onPress: () => router.back() }} />
          ) : (
            <EmptyState icon="user-x" title="Profil introuvable" body="Ce profil est introuvable. Il a peut-être été supprimé." action={{ label: 'Tous les rappels', icon: 'clock', onPress: () => router.replace('/bottle') }} />
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
      toast(friendlyError(e, 'Modification impossible. Réessayez dans un instant.'), 'error');
    }
  }
  const tryPatch = (fn: () => Parameters<typeof update.mutateAsync>[0]['patch'], message: (p: { due_at?: string }) => string) => {
    try { const p = fn(); return patch(p, message(p as { due_at?: string })); } catch (e) { toast(e instanceof Error ? e.message : 'Valeur invalide.', 'error'); return undefined; }
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
    if (minutes == null) return toast('Choisissez un délai avant le rappel.', 'error');
    const ml = parseMl(planned);
    if (ml.error) return toast(ml.error, 'error');
    try {
      const timer = await start.mutateAsync({ childId, lastBottleAt: startAt, intervalMinutes: minutes, plannedMl: ml.value, bottleId: lastBottle && Date.parse(lastBottle.at) === startAt.getTime() ? lastBottle.id : null, replace: active ? 'restart' : false });
      haptic('success');
      toast(nextReminderSentence(name, timer.due_at));
      setSheet(null);
    } catch (e) {
      toast(friendlyError(e, 'Programmation impossible. Réessayez dans un instant.'), 'error');
    }
  }

  const others = (children ?? []).filter((c) => c.id !== childId);
  const today = todayISO();
  const week = weekQ.data ?? [];
  const todays = week.filter((b) => todayISO(new Date(b.at)) === today);
  const drunk = todays.reduce((n, b) => n + (b.consumed_ml ?? 0), 0);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const perDay = days.map((d) => week.filter((b) => todayISO(new Date(b.at)) === d).length);
  const dayLetters = days.map((d) => ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'][new Date(`${d}T12:00:00`).getDay()]);
  const passed = active ? remainingMinutes(active, now) <= 0 : false;

  return (
    <Screen back title={`Biberon de ${name}`} subtitle="Rappel du prochain biberon"
      action={{ label: 'Enregistrer un biberon', icon: 'plus', testID: 'bottle-record',
        onPress: () => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, ...(active ? { timer: active.id } : {}) } }) }}
      right={<Button label="Historique" icon="list" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/bottle/history', params: { child: childId } })} />}>
      {others.length > 0 && (
        <Row wrap>
          {[child, ...others].map((c) => (
            <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.replace({ pathname: '/bottle/[childId]', params: { childId: c.id } })} />
          ))}
        </Row>
      )}

      <TodaySummary items={[
        { icon: 'droplet', value: String(todays.length), label: todays.length > 1 ? 'Biberons' : 'Biberon', testID: 'bottle-today-count' },
        { icon: 'bar-chart-2', value: drunk ? `${drunk} ml` : '—', label: 'Bu (noté)' },
        { icon: 'bell', value: active && !passed ? formatClock(active.due_at) : '—', label: 'Prochain rappel' },
      ]} />
      {perDay.some((n) => n > 0) ? <MiniBars values={perDay} labels={dayLetters} testID="bottle-week" /> : null}

      {isLoading ? <Skeleton kind="detail" rows={3} /> : timerQ.isError && !timerQ.data ? (
        <ErrorView error={timerQ.error} onRetry={() => void timerQ.refetch()} title="Impossible d’afficher le rappel" />
      ) : (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <View testID="bottle-next" accessibilityLiveRegion="polite">
              <Text variant="heading">
                {active ? (passed ? `Le rappel choisi pour ${name} était prévu ${atClock(active.due_at, now)}.` : nextReminderSentence(name, active.due_at, now)) : `Aucun rappel prévu pour ${name}.`}
              </Text>
              {active ? <Text variant="small" muted>Délai choisi : {formatHM(active.interval_minutes)} après le biberon de {formatClock(active.last_bottle_at)}.</Text> : null}
            </View>
            <View testID="bottle-last">
              <Text variant="label" muted>Dernier biberon enregistré</Text>
              <Text style={{ marginTop: 2 }}>
                {lastBottle
                  ? `${atClock(lastBottle.at, now).replace(/^à /, 'Aujourd’hui à ')}${lastBottle.consumed_ml != null ? ` · ${lastBottle.consumed_ml} ml bus` : ''}${lastBottle.prepared_ml != null ? ` · ${lastBottle.prepared_ml} ml préparés` : ''}`
                  : 'Aucun biberon enregistré pour l’instant.'}
              </Text>
            </View>
            {active && scheduledHere === false && !passed ? <Text variant="caption" muted>Aucune notification programmée sur cet appareil (voir les réglages ci-dessous).</Text> : null}
          </View>
        </Card>
      )}

      {active ? (
        <Row wrap>
          <Button label="Modifier le rappel" icon="edit-2" variant="secondary" onPress={openEdit} testID="bottle-edit" style={{ flexGrow: 1 }} />
          <Button label="Annuler" icon="x" variant="ghost" testID="bottle-cancel" style={{ flexGrow: 1 }} onPress={async () => {
            if (await confirm('Annuler le rappel ?', `Le rappel prévu ${atClock(active.due_at)} pour ${name} sera annulé, sur tous les appareils du foyer.`, 'Annuler le rappel')) {
              await patch(cancelTimer(), `Rappel de ${name} annulé.`);
            }
          }} />
        </Row>
      ) : (
        <Button label="Programmer un rappel" icon="bell" variant="secondary" onPress={openStart} testID="bottle-program" />
      )}

      <BottleNotificationSettings />
      <Text variant="caption" muted>{NO_RECOMMENDATION_NOTE}</Text>

      {/* ------------------------------------------------ modifier le rappel */}
      <Sheet visible={sheet === 'edit'} onClose={() => setSheet(null)} title={`Modifier le rappel de ${name}`}>
        {active ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="label">Reporter de</Text>
            <Row wrap>
              {SNOOZE_PRESETS.map((m) => (
                <Chip key={m} icon="clock" label={`${m} min`} onPress={() => tryPatch(() => snoozeTimer(active, m), (p) => `Rappel reporté : ${nextReminderSentence(name, p.due_at!).replace('Prochain rappel de biberon de ', '').replace(/\.$/, '')}.`)} />
              ))}
            </Row>
            <Row>
              <View style={{ flex: 1 }}><Field label="Autre report" placeholder="20 min, 1h…" value={snoozeText} onChangeText={setSnoozeText} autoCapitalize="none" autoCorrect={false} /></View>
              <Button label="Reporter" size="sm" variant="secondary" onPress={() => {
                const m = parseDelay(snoozeText);
                if (m == null || m > 360) return toast('Durée attendue entre 10 minutes et 6 heures.', 'error');
                return tryPatch(() => snoozeTimer(active, m), () => `Rappel reporté de ${formatHM(m)}.`);
              }} />
            </Row>

            <Text variant="label" style={{ marginTop: spacing.sm }}>Heure du rappel</Text>
            <TimePicker value={dueTime} onChange={setDueTime} label="Rappel à" future />
            <Button label="Enregistrer l’heure" size="sm" variant="secondary" onPress={() => tryPatch(() => setReminderAt(active, dueTime), (p) => nextReminderSentence(name, p.due_at!))} testID="bottle-set-time" />

            <Text variant="label" style={{ marginTop: spacing.sm }}>Intervalle habituel</Text>
            <Text variant="small" muted>Recalculé à partir du dernier biberon ({formatClock(active.last_bottle_at)}) et repris pour les prochains biberons.</Text>
            <ReminderChoicePicker value={choice} onChange={setChoice} lastInterval={lastInterval} allowNone={false} />
            {resolveReminderChoice(choice) != null ? <Text variant="small" muted>Nouveau rappel : {atClock(computeDueAt(active.last_bottle_at, resolveReminderChoice(choice)!), now)}.</Text> : null}
            <Button label="Enregistrer l’intervalle" size="sm" testID="bottle-save-interval" onPress={() => {
              const m = resolveReminderChoice(choice);
              if (m == null) return toast('Choisissez un délai.', 'error');
              return tryPatch(() => modifyInterval(active, m), (p) => nextReminderSentence(name, p.due_at!));
            }} />
          </View>
        ) : null}
      </Sheet>

      {/* ------------------------------------------------ programmer un rappel sans nouveau biberon */}
      <Sheet visible={sheet === 'start'} onClose={() => setSheet(null)} title={`Rappel pour ${name}`}>
        <TimePicker value={startAt} onChange={setStartAt} label="Heure du dernier biberon" />
        <Text variant="label">Délai avant le rappel</Text>
        <ReminderChoicePicker value={choice} onChange={setChoice} lastInterval={lastInterval} allowNone={false} />
        {resolveReminderChoice(choice) != null ? <Banner tone="info">{nextReminderSentence(name, computeDueAt(startAt, resolveReminderChoice(choice)!), now)}</Banner> : null}
        <Field label="Quantité prévue pour le prochain biberon" optional value={planned} onChangeText={setPlanned} keyboardType="number-pad" suffix="ml" hint="Telle que vous l’avez décidée ou qu’un professionnel vous l’a indiquée." />
        <Button label="Programmer le rappel" onPress={submitStart} testID="bottle-start-save" />
      </Sheet>
    </Screen>
  );
}
