/**
 * Sommeil du bébé (inspiration « Napper », sans en reprendre l'interface ni les textes) : siestes, nuit, réveils,
 * totaux du jour, estimation du prochain repos calculée UNIQUEMENT à partir des relevés de la famille, rappel facultatif.
 * Aucune promesse : l'application ne promet jamais qu'un bébé fera ses nuits.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Row, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useLogs } from '@/lib/data/hooks';
import { friendlyError, useSaveReminder } from '@/lib/data/hooks-settings';
import { formatDuration } from '@/lib/domain/dates';
import { formatClock } from '@/lib/domain/bottleTimer';
import { nextRestEstimate, sleepDay, ESTIMATE_DAYS, MIN_SAMPLES } from '@/lib/domain/sleepEstimate';
import type { Child, Sleep } from '@/lib/types';
import { spacing } from '@/theme/tokens';

export function BabySleepCard({ child }: { child: Child }) {
  const toast = useToast();
  const { data: sleeps } = useLogs<Sleep>('sleep', child.id, ESTIMATE_DAYS);
  const save = useSaveReminder();
  const now = new Date();
  const today = sleepDay(sleeps ?? [], now, now);
  const e = nextRestEstimate(sleeps ?? [], now);

  async function remind(at: Date) {
    const when = new Date(at.getTime() - 10 * 60_000);
    if (when.getTime() <= Date.now()) { toast('L’heure estimée est déjà proche : pas de rappel programmé.', 'info'); return; }
    try {
      await save.mutateAsync({ draft: {
        title: `Repos de ${child.first_name}`, body: 'Estimation d’après vos relevés : observez les signes de fatigue.', category: 'tracking',
        schedule: { type: 'once', at: when.toISOString() }, enabled: true, deep_link: '/night', child_id: child.id,
      } });
      toast(`Rappel programmé à ${formatClock(when.toISOString())}.`, 'success');
    } catch (err) { toast(friendlyError(err), 'error'); }
  }

  return (
    <View testID="baby-sleep">
      <Card>
        <Text weight="bold">Sommeil de {child.first_name} aujourd’hui</Text>
        <Row wrap style={{ marginTop: 4 }}>
          <Text variant="small">{today.naps} sieste{today.naps > 1 ? 's' : ''} · {formatDuration(today.napMinutes)}</Text>
          <Text variant="small" muted>· nuit {formatDuration(today.nightMinutes)}{today.nightWakeups ? ` · ${today.nightWakeups} réveil${today.nightWakeups > 1 ? 's' : ''}` : ''}</Text>
        </Row>
        <View style={{ marginTop: spacing.xs }} testID="sleep-estimate">
          {e.kind === 'asleep' ? <Text variant="small">Endormi·e depuis {formatClock(e.since)}.</Text>
            : e.kind === 'not_enough' ? <Text variant="small" muted>{`Notez au moins ${MIN_SAMPLES + 1} siestes ou nuits pour obtenir une estimation calculée sur vos propres relevés (${ESTIMATE_DAYS} derniers jours).`}</Text>
            : (
              <>
                <Text variant="small">{`Prochain repos estimé vers ${formatClock(e.at.toISOString())}`}</Text>
                <Text variant="caption" muted>{`Calcul : temps d’éveil médian de ${formatDuration(e.medianMinutes)} sur vos ${e.samples} derniers relevés. Ce n’est pas une consigne : les signes de fatigue de votre enfant priment.`}</Text>
                <Button label="Me rappeler 10 min avant" size="sm" variant="secondary" icon="bell" style={{ alignSelf: 'flex-start', marginTop: 4 }} loading={save.isPending} onPress={() => remind(e.at)} testID="sleep-remind" />
              </>
            )}
        </View>
        <Row wrap style={{ marginTop: spacing.xs }}>
          <Button label="Noter un sommeil" size="sm" variant="ghost" icon="moon" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'sleep', child: child.id } })} />
          <Button label="Repères selon l’âge" size="sm" variant="ghost" icon="book-open" onPress={() => router.push({ pathname: '/library', params: { cat: 'sommeil' } })} />
        </Row>
      </Card>
    </View>
  );
}
