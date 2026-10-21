/**
 * Sommeil du bébé ou de l'enfant (inspiration « Napper », sans en reprendre l'interface ni les textes).
 * Gratuit : boutons « Il dort » / « Il est réveillé », siestes, nuit, réveils, totaux du jour, mode nuit.
 * Premium : rythme moyen, prochain repos estimé (relevés de la famille), changements d'habitude, graphiques,
 * routine du coucher, rappels et récapitulatifs (écran /sleep/[childId]).
 * Aucune promesse : l'application ne promet jamais qu'un bébé dormira toute la nuit.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, haptic, Row, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { PremiumSection } from '@/components/Premium';
import { backend, eq } from '@/lib/backend';
import { useAddLog, useInvalidate, useLogs, useOpenSleep } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { formatDuration } from '@/lib/domain/dates';
import { formatClock } from '@/lib/domain/bottleTimer';
import { ESTIMATE_DAYS, sleepDay, wakeWindows } from '@/lib/domain/sleepEstimate';
import type { Child, Sleep } from '@/lib/types';
import { spacing } from '@/theme/tokens';

/** « Il dort » / « Il est réveillé » : un appui, l'heure exacte est enregistrée (gratuit). */
export function SleepQuickButtons({ child }: { child: Child }) {
  const toast = useToast();
  const inv = useInvalidate();
  const open = useOpenSleep(child.id);
  const add = useAddLog('sleep');
  const [busy, setBusy] = useState(false);
  async function asleep() {
    setBusy(true);
    try {
      const h = new Date().getHours();
      await add.mutateAsync({ child_id: child.id, household_id: child.household_id, started_at: new Date().toISOString(), kind: h >= 19 || h < 7 ? 'night' : 'nap' });
      haptic('success');
      toast(`${child.first_name} dort depuis ${formatClock(new Date().toISOString())}.`, 'info');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function awake() {
    if (!open) return;
    setBusy(true);
    try {
      await backend.update('sleeps', { ended_at: new Date().toISOString() }, [eq('id', open.id)]);
      inv('sleeps');
      haptic('success');
      toast(`Réveil noté : ${formatDuration((Date.now() - Date.parse(open.started_at)) / 60000)} de sommeil.`, 'success');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <Row wrap>
      {open
        ? <Button label={`${child.first_name} est réveillé·e`} icon="sun" onPress={awake} loading={busy} testID="sleep-awake" style={{ flexGrow: 1 }} />
        : <Button label={`${child.first_name} dort`} icon="moon" onPress={asleep} loading={busy} testID="sleep-asleep" style={{ flexGrow: 1 }} />}
    </Row>
  );
}

export function BabySleepCard({ child }: { child: Child }) {
  const { data: sleeps } = useLogs<Sleep>('sleep', child.id, ESTIMATE_DAYS);
  const open = useOpenSleep(child.id);
  const now = new Date();
  const today = sleepDay(sleeps ?? [], now, now);
  const samples = wakeWindows(sleeps ?? [], now).length;
  const notedDays = new Set((sleeps ?? []).map((s) => s.started_at.slice(0, 10))).size;

  return (
    <View testID="baby-sleep">
      <Card>
        <Text weight="bold">Sommeil de {child.first_name} aujourd’hui</Text>
        <Row wrap style={{ marginTop: 4 }}>
          <Text variant="small">{today.naps} sieste{today.naps > 1 ? 's' : ''} · {formatDuration(today.napMinutes)}</Text>
          <Text variant="small" muted>· nuit {formatDuration(today.nightMinutes)}{today.nightWakeups ? ` · ${today.nightWakeups} réveil${today.nightWakeups > 1 ? 's' : ''}` : ''}</Text>
        </Row>
        {open ? <Text variant="small" style={{ marginTop: 4 }} testID="sleep-ongoing">{`Endormi·e depuis ${formatClock(open.started_at)}.`}</Text> : null}
        <View style={{ marginTop: spacing.xs }}><SleepQuickButtons child={child} /></View>
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Button label="Noter un sommeil passé" size="sm" variant="ghost" icon="edit-3" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id } })} />
          <Button label="Mode nuit" size="sm" variant="ghost" icon="moon" onPress={() => router.push('/night')} />
        </Row>
      </Card>
      <View style={{ marginTop: spacing.xs }} testID="sleep-estimate">
        <PremiumSection feature="sleep_insights" name={child.first_name} testID="premium-sleep"
          preview={<Text variant="small">{`${notedDays} jour(s) noté(s) et ${samples} temps d’éveil enregistrés : de quoi calculer le rythme moyen de ${child.first_name} et estimer son prochain repos.`}</Text>}>
          <Card onPress={() => router.push(`/sleep/${child.id}` as never)} accessibilityLabel={`Rythme de sommeil de ${child.first_name}`}>
            <Row><Text weight="bold" style={{ flex: 1 }}>{`Rythme et prochain repos de ${child.first_name}`}</Text></Row>
            <Text variant="small" muted>Moyennes, estimation, changements d’habitude, graphiques, routine du coucher</Text>
          </Card>
        </PremiumSection>
      </View>
    </View>
  );
}
