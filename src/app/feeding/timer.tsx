/**
 * Chronomètre de tétée : gauche / droit, pause, reprise, changement de sein, fin, correction des heures, un seul
 * enregistrement. La session vit dans le stockage de l'appareil (src/lib/feedSessionStore.ts) : elle continue si
 * l'on quitte l'écran ou ferme l'application, et la durée est recalculée à partir des horodatages réels.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, haptic, Row, Text } from '@/components/ui';
import { TimePicker } from '@/features/tracking';
import { FeedRing, SideSwap, durationPhrase, sideTitle, sideWord, useFeedingChild } from '@/features/lactation';
import { useFeedingLogs, useSaveFeedSession } from '@/lib/data/hooks-lactation';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  canSave, clock, correctTimes, currentSide, durationBySide, elapsedMs, FeedError, finishSession, firstStart, lastEnd, pauseSession, reopenSession,
  resumeSession, startSession, switchSide, type BreastSide,
} from '@/lib/domain/lactation';
import { agoLabel, lastSide } from '@/lib/domain/dayTimeline';
import { useFeedSession, useFeedSessionStore } from '@/lib/feedSessionStore';
import { uuid } from '@/lib/uuid';
import { goBack } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

const LONG_MS = 3 * 3600_000;

export default function FeedTimer() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ child?: string }>();
  const { child, children, loading, name } = useFeedingChild(params.child);
  const childId = child?.id ?? null;
  const session = useFeedSession(childId);
  const setSession = useFeedSessionStore((s) => s.setSession);
  const save = useSaveFeedSession();
  const logs = useFeedingLogs(childId, 2);
  const last = lastSide(logs.breastfeeds);
  const [side, setSide] = useState<BreastSide>('left');
  const [now, setNow] = useState(Date.now());
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Rafraîchit l'affichage chaque seconde : la durée, elle, vient toujours des horodatages
  const running = session?.status === 'running';
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Session terminée : les heures proposées à la correction sont celles du chronomètre
  const finishedKey = session?.status === 'finished' ? `${session.id}:${firstStart(session)}:${lastEnd(session)}` : null;
  useEffect(() => {
    if (!session || session.status !== 'finished') { setStart(null); setEnd(null); return; }
    setStart(new Date(firstStart(session)));
    setEnd(new Date(lastEnd(session) ?? Date.now()));
  }, [finishedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const elapsed = session ? elapsedMs(session, now) : 0;
  const bySide = session ? durationBySide(session, now) : { left: 0, right: 0 };
  const cur = session ? currentSide(session) : side;

  const corrected = useMemo(() => {
    if (!session || session.status !== 'finished' || !start || !end) return null;
    try {
      return { session: correctTimes(session, { start: start.getTime(), end: end.getTime() }, Date.now()), error: null };
    } catch (e) {
      const code = e instanceof FeedError ? e.code : 'other';
      return { session: null, error: tr(`lac.timer.err.${code === 'start_after_end' || code === 'future' ? code : 'other'}` as TKey) };
    }
  }, [session, start, end]);

  function act(fn: () => void) {
    setError(null);
    try { fn(); haptic('light'); } catch { /* geste déjà pris en compte (double appui) */ }
  }

  if (loading) return <Screen back title={tr('lac.timer.title')}><Skeleton kind="card" rows={2} /></Screen>;
  if (!child) {
    return (
      <Screen back title={tr('lac.timer.title')}>
        <EmptyState icon="user-plus" title={tr('lac.home.noChild')} action={{ label: tr('lac.home.addProfile'), icon: 'plus', onPress: () => router.replace('/profiles/new') }} />
      </Screen>
    );
  }

  async function onSave() {
    if (!session || !corrected?.session) return;
    if (!canSave(session)) { toast(tr('lac.timer.alreadySaved'), 'info'); return; }
    setError(null);
    try {
      const res = await save.mutateAsync({ session: corrected.session, householdId: child!.household_id, note: note.trim() || null });
      haptic('success');
      toast(res === 'queued' ? tr('lac.timer.queued') : tr('lac.timer.saved'), res === 'queued' ? 'info' : 'success');
      setNote('');
      goBack(`/feeding?child=${child!.id}`);
    } catch (e) {
      if (e instanceof Error && e.message === 'already_saved') { toast(tr('lac.timer.alreadySaved'), 'info'); return; }
      setError(friendlyError(e, tr('lac.timer.saveFail')));
    }
  }

  async function onDiscard() {
    if (!(await confirm(tr('lac.timer.discardAsk'), tr('lac.timer.discardBody'), tr('lac.timer.discardOk')))) return;
    setSession(child!.id, null);
    setNote('');
  }

  const statusText = !session ? null : session.status === 'running' ? tr('lac.timer.statusRunning', { side: sideWord(cur) })
    : session.status === 'paused' ? tr('lac.timer.statusPaused') : tr('lac.timer.statusFinished');
  const timeA11y = tr('lac.timer.a11yTime', { time: durationPhrase(elapsed) });
  const other: BreastSide = cur === 'left' ? 'right' : 'left';

  const action = !session
    ? { label: tr('lac.timer.startOn', { side: sideWord(side) }), icon: 'play' as const, testID: 'feed-start', onPress: () => act(() => setSession(child.id, startSession({ id: uuid(), childId: child.id, side, now: Date.now() }))) }
    : session.status === 'finished'
      ? { label: tr('lac.timer.save'), icon: 'check' as const, testID: 'feed-save', disabled: !corrected?.session || save.isPending || !canSave(session), onPress: () => void onSave() }
      : { label: tr('lac.timer.finish'), icon: 'square' as const, testID: 'feed-finish', onPress: () => act(() => setSession(child.id, finishSession(session, Date.now()))) };

  return (
    <Screen back title={tr('lac.timer.title')} subtitle={name ? tr('lac.timer.forName', { name }) : undefined} action={action}>
      {children.length > 1 && !session ? (
        <Row wrap>
          {children.map((c) => <Chip key={c.id} label={c.first_name} selected={c.id === child.id} onPress={() => router.setParams({ child: c.id })} />)}
        </Row>
      ) : null}

      {!session ? (
        <View style={{ gap: spacing.md }} testID="feed-idle">
          <Text variant="small" muted testID="feed-last">
            {last ? tr('lac.timer.lastSide', { side: sideWord(last.side), ago: agoLabel(last.at) }) : tr('lac.timer.noLast')}
          </Text>
          <Text variant="label">{tr('lac.timer.chooseSide')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['left', 'right'] as const).map((sd) => (
              <Button key={sd} label={sideTitle(sd)} size="lg" variant={side === sd ? 'primary' : 'secondary'} style={{ flex: 1 }} onPress={() => { setSide(sd); haptic('selection'); }}
                accessibilityState={{ selected: side === sd }} testID={`feed-side-${sd}`} />
            ))}
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.md }} testID={`feed-${session.status}`}>
          <FeedRing running={session.status === 'running'} testID="feed-ring">
            <View accessible accessibilityRole="timer" accessibilityLabel={timeA11y} style={{ alignItems: 'center', gap: 4 }}>
              <Text variant="caption" muted>{tr('lac.timer.total')}</Text>
              <Text variant="title" style={{ fontVariant: ['tabular-nums'] }} testID="feed-clock">{clock(elapsed)}</Text>
              <SideSwap side={cur}>
                <Text weight="bold" center accessibilityLiveRegion="polite" testID="feed-current-side">{session.status === 'running' ? tr('lac.timer.onSide', { side: sideWord(cur) }) : statusText}</Text>
              </SideSwap>
            </View>
          </FeedRing>
          <Text center muted testID="feed-by-side">
            {tr('lac.timer.bySide', { left: clock(bySide.left), right: clock(bySide.right) })}
          </Text>

          {session.status !== 'finished' ? (
            <View style={{ gap: spacing.sm }}>
              {session.status === 'running'
                ? <Button label={tr('lac.timer.pause')} icon="pause" size="lg" variant="secondary" full onPress={() => act(() => setSession(child.id, pauseSession(session, Date.now())))} testID="feed-pause" />
                : <Button label={tr('lac.timer.resume')} icon="play" size="lg" variant="secondary" full onPress={() => act(() => setSession(child.id, resumeSession(session, Date.now())))} testID="feed-resume" />}
              <Button label={tr('lac.timer.switchTo', { side: sideWord(other) })} icon="repeat" size="lg" variant="secondary" full onPress={() => act(() => setSession(child.id, switchSide(session, Date.now())))} testID="feed-switch" />
              <Text variant="caption" muted center>{tr('lac.timer.kept')}</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }} testID="feed-review">
              {elapsed > LONG_MS ? <Banner tone="warning" icon="clock">{tr('lac.timer.long')}</Banner> : null}
              <Text variant="heading" accessibilityRole="header">{tr('lac.timer.correct')}</Text>
              {start ? <TimePicker value={start} onChange={setStart} label={tr('lac.timer.startAt')} /> : null}
              {end ? <TimePicker value={end} onChange={setEnd} label={tr('lac.timer.endAt')} /> : null}
              {corrected?.error ? <Banner tone="danger">{corrected.error}</Banner> : null}
              {corrected?.session ? (
                <Text muted testID="feed-corrected">{tr('lac.timer.a11yTime', { time: clock(elapsedMs(corrected.session, Date.now())) })}</Text>
              ) : null}
              <Field label={tr('lac.timer.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} />
              <Button label={tr('lac.timer.continue')} icon="play" variant="secondary" size="lg" full onPress={() => act(() => setSession(child.id, reopenSession(session)))} testID="feed-reopen" />
            </View>
          )}
          {error ? <Banner tone="danger">{error}</Banner> : null}
          <Button label={tr('lac.timer.discard')} icon="x" variant="ghost" onPress={() => void onDiscard()} testID="feed-discard" style={{ alignSelf: 'center' }} />
        </View>
      )}
      <View style={{ height: spacing.sm }} />
      <Text variant="caption" muted color={t.colors.textMuted} center>{tr('lac.timer.noTarget')}</Text>
    </Screen>
  );
}
