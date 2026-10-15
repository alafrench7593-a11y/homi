/** Minuteur biberon d'un enfant : temps écoulé, temps restant, rappel prévu, actions. */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Appear } from '@/components/Appear';
import { ProgressRing } from '@/components/Charts';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, haptic, ListRow, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { BottleNotificationSettings, NO_RECOMMENDATION_NOTE, parseMl, ReminderChoicePicker } from '@/features/bottle';
import { TimePicker } from '@/features/tracking';
import { useChild, useChildren } from '@/lib/data/hooks';
import { useBottleTimer, useLastBottle, useNow, useTimerScheduledHere, useUpdateBottleTimer, useStartBottleTimer } from '@/lib/data/hooks-bottle';
import {
  atClock, cancelTimer, elapsedMinutes, formatClock, formatHM, formatRemaining, modifyInterval, parseDelay, remainingMinutes, resolveReminderChoice,
  snoozeTimer, SNOOZE_PRESETS, timerProgress, timerSentence, updateLastBottleTime, type ReminderChoice,
} from '@/lib/domain/bottleTimer';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type SheetKind = 'start' | 'delay' | 'time' | 'snooze' | null;

export default function BottleTimerScreen() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ childId: string }>();
  const childId = params.childId ?? '';
  const { data: children, isLoading: loadingChildren } = useChildren();
  const child = useChild(childId);
  const { active, lastInterval, isLoading } = useBottleTimer(childId);
  const lastBottle = useLastBottle(childId);
  const now = useNow(1000);
  const update = useUpdateBottleTimer();
  const start = useStartBottleTimer();
  const scheduledHere = useTimerScheduledHere(active);

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [startAt, setStartAt] = useState(new Date());
  const [choice, setChoice] = useState<ReminderChoice>({ kind: 'none' });
  const [planned, setPlanned] = useState('');
  const [newTime, setNewTime] = useState(new Date());
  const [snoozeText, setSnoozeText] = useState('');
  const [busy, setBusy] = useState(false);

  if (!child) {
    return (
      <Screen back title="Minuteur biberon">
        {loadingChildren ? <Loading /> : (
          <>
            <Banner tone="info">{'Ce profil est introuvable. Il a peut-être été supprimé.'}</Banner>
            <Button label="Tous les minuteurs" onPress={() => router.replace('/bottle')} />
          </>
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
      toast(e instanceof Error ? e.message : 'Modification impossible.', 'error');
    }
  }

  function openStart() {
    // Point de départ : le dernier biberon enregistré s'il date de moins de 12 h, sinon maintenant
    const last = lastBottle && Date.now() - Date.parse(lastBottle.at) < 12 * 3600_000 ? new Date(lastBottle.at) : new Date();
    setStartAt(last);
    setChoice(lastInterval != null ? { kind: 'previous', minutes: lastInterval } : { kind: 'none' });
    setPlanned(lastBottle?.planned_next_ml != null && last.getTime() === Date.parse(lastBottle.at) ? String(lastBottle.planned_next_ml) : '');
    setSheet('start');
  }

  async function submitStart() {
    const minutes = resolveReminderChoice(choice);
    if (minutes == null) return toast('Choisissez un délai avant le rappel.', 'error');
    const ml = parseMl(planned);
    if (ml.error) return toast(ml.error, 'error');
    if (active && !(await confirm('Remplacer le minuteur en cours ?', `Le rappel prévu ${atClock(active.due_at)} pour ${name} sera remplacé : un seul minuteur par enfant.`, 'Remplacer', false))) return;
    setBusy(true);
    try {
      await start.mutateAsync({ childId, lastBottleAt: startAt, intervalMinutes: minutes, plannedMl: ml.value, bottleId: lastBottle && Date.parse(lastBottle.at) === startAt.getTime() ? lastBottle.id : null, replace: active ? 'restart' : false });
      haptic('success');
      toast(`Rappel programmé pour ${name}.`);
      setSheet(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Démarrage impossible.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const others = (children ?? []).filter((c) => c.id !== childId);
  const rem = active ? remainingMinutes(active, now) : 0;

  return (
    <Screen
      back
      title={`Biberon de ${name}`}
      subtitle="Minuteur de rappel"
      right={<Button label="Historique" icon="list" variant="ghost" size="sm" onPress={() => router.push({ pathname: '/bottle/history', params: { child: childId } })} />}
    >
      {others.length > 0 && (
        <Row wrap>
          {[child, ...others].map((c) => (
            <Chip key={c.id} label={c.first_name} selected={c.id === childId} onPress={() => router.replace({ pathname: '/bottle/[childId]', params: { childId: c.id } })} />
          ))}
          <Chip label="Tous" icon="grid" onPress={() => router.push('/bottle')} />
        </Row>
      )}

      {isLoading ? <Loading /> : active ? (
        <>
          <Appear kind="scale">
            <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
              <ProgressRing progress={timerProgress(active, now)} size={210} label={`Temps écoulé depuis le dernier biberon de ${name} : ${formatHM(elapsedMinutes(active, now))}`}>
                <Text variant="caption" muted>{rem > 0 ? 'rappel dans' : 'rappel prévu il y a'}</Text>
                <Text variant="hero" accessibilityLiveRegion="polite" color={rem > 0 ? t.colors.text : t.colors.danger}>{rem > 0 ? formatRemaining(rem) : formatHM(rem)}</Text>
                <Text variant="small" muted>{atClock(active.due_at, now)}</Text>
              </ProgressRing>
              <Text center accessibilityLiveRegion="polite">{timerSentence({ childName: name, timer: active, now })}</Text>
            </View>
          </Appear>

          <Card>
            <ListRow icon="coffee" title="Dernier biberon" subtitle={`${atClock(active.last_bottle_at, now)} · il y a ${formatHM(elapsedMinutes(active, now))}`} />
            <ListRow icon="clock" title="Délai choisi" subtitle={formatHM(active.interval_minutes)} />
            <ListRow icon="bell" title="Rappel prévu" subtitle={`${atClock(active.due_at, now)}${rem > 0 ? ` · dans ${formatRemaining(rem)}` : ''}`} />
            {active.planned_ml != null && <ListRow icon="droplet" title="Quantité enregistrée" subtitle={`${active.planned_ml} ml (saisie par la famille)`} />}
            {scheduledHere != null && (
              <ListRow icon={scheduledHere ? 'check-circle' : 'bell-off'} title="Sur cet appareil" subtitle={scheduledHere ? 'Notification programmée' : rem > 0 ? 'Aucune notification programmée (voir réglages ci-dessous)' : 'Heure passée'} />
            )}
          </Card>

          <Button label="Marquer le biberon comme donné" icon="check" size="lg" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, timer: active.id, ...(active.planned_ml != null ? { planned: String(active.planned_ml) } : {}) } })} />

          <SectionTitle title="Reporter" />
          <Row wrap>
            {SNOOZE_PRESETS.map((m) => (
              <Chip key={m} icon="plus" label={`${m} min`} onPress={() => patch(snoozeTimer(active, m), `Rappel reporté de ${m} min.`)} />
            ))}
            <Chip icon="edit-3" label="Autre durée" onPress={() => { setSnoozeText(''); setSheet('snooze'); }} />
          </Row>

          <SectionTitle title="Modifier" />
          <Card>
            <ListRow icon="edit-2" title="Mettre à jour l’heure du dernier biberon" subtitle={formatClock(active.last_bottle_at)} onPress={() => { setNewTime(new Date(active.last_bottle_at)); setSheet('time'); }} />
            <ListRow icon="sliders" title="Modifier le délai" subtitle={formatHM(active.interval_minutes)} onPress={() => { setChoice({ kind: 'delay', minutes: active.interval_minutes }); setSheet('delay'); }} />
            <ListRow icon="refresh-cw" title="Démarrer un nouveau rappel" subtitle="Remplace le minuteur en cours" onPress={openStart} />
            <ListRow icon="x-circle" title="Annuler le rappel" danger onPress={async () => {
              if (await confirm('Annuler le rappel ?', `Le rappel prévu ${atClock(active.due_at)} pour ${name} sera annulé, sur tous les appareils du foyer.`, 'Annuler le rappel')) {
                await patch(cancelTimer(), 'Rappel annulé.');
              }
            }} />
          </Card>
        </>
      ) : (
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md }}>
            <Text variant="heading" center>Aucun rappel en cours pour {name}</Text>
            <Text muted center>{lastBottle ? `Dernier biberon enregistré ${atClock(lastBottle.at, now)} (il y a ${formatHM((now.getTime() - Date.parse(lastBottle.at)) / 60000)}).` : 'Aucun biberon enregistré pour l’instant.'}</Text>
            <Button label="Démarrer un rappel" icon="play" onPress={openStart} />
            <Button label="Enregistrer un biberon" icon="plus" variant="secondary" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId } })} />
          </View>
        </Card>
      )}

      <SectionTitle title="Notifications" />
      <BottleNotificationSettings />
      <Text variant="caption" muted>{NO_RECOMMENDATION_NOTE}</Text>

      {/* ------------------------------------------------ feuilles */}
      <Sheet visible={sheet === 'start'} onClose={() => setSheet(null)} title={active ? 'Nouveau rappel' : 'Démarrer un rappel'}>
        <TimePicker value={startAt} onChange={setStartAt} label="Heure du dernier biberon" />
        <Text variant="label">Délai avant le rappel</Text>
        <ReminderChoicePicker value={choice} onChange={setChoice} lastInterval={lastInterval} allowNone={false} />
        <Field label="Quantité prévue pour le prochain biberon" optional value={planned} onChangeText={setPlanned} keyboardType="number-pad" suffix="ml" hint="Telle que vous l’avez décidée ou qu’un professionnel vous l’a indiquée." />
        <Button label={active ? 'Remplacer le minuteur' : 'Démarrer'} loading={busy} onPress={submitStart} />
      </Sheet>

      <Sheet visible={sheet === 'delay'} onClose={() => setSheet(null)} title="Modifier le délai">
        <Text variant="small" muted>Le rappel sera recalculé à partir du dernier biberon{active ? ` (${formatClock(active.last_bottle_at)})` : ''}.</Text>
        <ReminderChoicePicker value={choice} onChange={setChoice} lastInterval={lastInterval} allowNone={false} />
        <Button label="Enregistrer le délai" loading={update.isPending} onPress={() => {
          const m = resolveReminderChoice(choice);
          if (!active || m == null) return toast('Choisissez un délai.', 'error');
          try { patch(modifyInterval(active, m), `Nouveau délai : ${formatHM(m)}.`); } catch (e) { toast(e instanceof Error ? e.message : 'Délai invalide.', 'error'); }
        }} />
      </Sheet>

      <Sheet visible={sheet === 'time'} onClose={() => setSheet(null)} title="Heure du dernier biberon">
        <TimePicker value={newTime} onChange={setNewTime} label="Dernier biberon" />
        {active && <Text variant="small" muted>Nouveau rappel : {atClock(new Date(newTime.getTime() + active.interval_minutes * 60000), now)} (délai de {formatHM(active.interval_minutes)}).</Text>}
        <Button label="Mettre à jour" loading={update.isPending} onPress={() => {
          if (!active) return;
          try { patch(updateLastBottleTime(active, newTime), 'Heure mise à jour.'); } catch (e) { toast(e instanceof Error ? e.message : 'Heure invalide.', 'error'); }
        }} />
      </Sheet>

      <Sheet visible={sheet === 'snooze'} onClose={() => setSheet(null)} title="Reporter le rappel">
        <Field label="Reporter de" placeholder="20 min, 1h…" value={snoozeText} onChangeText={setSnoozeText} autoCapitalize="none" autoCorrect={false} hint="Entre 10 minutes et 6 heures." />
        <Button label="Reporter" loading={update.isPending} onPress={() => {
          const m = parseDelay(snoozeText);
          if (!active || m == null || m > 360) return toast('Durée attendue entre 10 minutes et 6 heures.', 'error');
          patch(snoozeTimer(active, m), `Rappel reporté de ${formatHM(m)}.`);
        }} />
      </Sheet>
    </Screen>
  );
}
