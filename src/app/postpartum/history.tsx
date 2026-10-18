/**
 * Mon évolution : tendances simples sur 14 jours et historique des points du jour.
 * Descriptif uniquement : pas de moyenne « notée », pas de récompense, pas de pénalité.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Button, Card, ListRow, SectionTitle, Text } from '@/components/ui';
import { MiniTrend } from '@/features/postpartum';
import { useDeleteCheckin, usePostpartumActions, usePostpartumCheckins } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { ACTION_KINDS, NEEDS, describeTrend, trendSeries, type CheckinInput } from '@/lib/domain/postpartum';
import { todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';

const TRENDS: { key: keyof CheckinInput; label: string; positive: boolean }[] = [
  { key: 'feeling', label: 'Comment je me sens', positive: true },
  { key: 'fatigue', label: 'Fatigue', positive: false },
  { key: 'sleep_quality', label: 'Sommeil', positive: true },
  { key: 'stress', label: 'Stress', positive: false },
  { key: 'mood', label: 'Humeur', positive: true },
  { key: 'supported', label: 'Sentiment d’être soutenue', positive: true },
];

export default function PostpartumHistory() {
  const toast = useToast();
  const today = todayISO();
  const q = usePostpartumCheckins(120);
  const actionsQ = usePostpartumActions();
  const del = useDeleteCheckin();
  const list = q.data ?? [];

  async function remove(id: string, date: string) {
    if (!(await confirm('Supprimer ce point ?', `Le point du ${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR')} sera supprimé définitivement.`, 'Supprimer'))) return;
    try { await del.mutateAsync(id); toast('Supprimé.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Mon évolution" subtitle="Ce que vous avez noté, sans jugement.">
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={3} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && list.length === 0 ? (
        <EmptyState icon="trending-up" title="Rien de noté pour l’instant" body="Il n’y a aucune obligation. Si vous notez quelques jours, une évolution apparaîtra ici." action={{ label: 'Faire le point', icon: 'feather', onPress: () => router.push('/postpartum/checkin') }} />
      ) : null}

      {list.length > 0 ? (
        <>
          <Card>
            <View style={{ gap: spacing.lg }}>
              {TRENDS.map((tr) => {
                const pts = trendSeries(list, tr.key, today, 14);
                return <MiniTrend key={tr.key} label={tr.label} points={pts} positive={tr.positive} description={describeTrend(pts, tr.positive)} />;
              })}
            </View>
          </Card>
          <Text variant="caption" muted>Une évolution ne veut rien dire à elle seule, ni dans un sens ni dans l’autre. Si quelque chose vous inquiète, parlez-en à un professionnel.</Text>

          {actionsQ.data?.length ? (
            <>
              <SectionTitle title="Mes démarches et soutiens" />
              <Card>
                {actionsQ.data.slice(0, 10).map((a) => (
                  <ListRow key={a.id} icon="check" title={ACTION_KINDS.find((k) => k.value === a.kind)?.label ?? a.kind} subtitle={[new Date(`${a.done_on}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }), a.note].filter(Boolean).join(' — ')} />
                ))}
              </Card>
            </>
          ) : null}

          <SectionTitle title="Mes points du jour" />
          {list.map((c, i) => (
            <StaggerItem key={c.id} index={i}>
              <Card>
                <ListRow
                  icon="calendar"
                  title={new Date(`${c.checkin_date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  subtitle={[
                    c.needs.filter((n) => n !== 'no_answer').map((n) => NEEDS.find((x) => x.value === n)?.label).join(', '),
                    c.comment ? (c.comment.length > 90 ? `${c.comment.slice(0, 90)}…` : c.comment) : null,
                  ].filter(Boolean).join(' — ') || 'Point noté'}
                  right={<Button label="Supprimer" size="sm" variant="ghost" onPress={() => remove(c.id, c.checkin_date)} accessibilityLabel={`Supprimer le point du ${c.checkin_date}`} />}
                />
              </Card>
            </StaggerItem>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
