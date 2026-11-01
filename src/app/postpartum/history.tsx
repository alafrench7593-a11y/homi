/**
 * Mon évolution : tendances simples sur 14 jours et historique des points du jour.
 * Descriptif uniquement : pas de moyenne « notée », pas de récompense, pas de pénalité.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { HistoryHeader } from '@/components/MiniApp';
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
import { formatDate, t as tr } from '@/i18n';

const trends = (): { key: keyof CheckinInput; label: string; positive: boolean }[] => [
  { key: 'feeling', label: tr('u5.pp_history.t_feeling'), positive: true },
  { key: 'fatigue', label: tr('u5.pp_history.t_fatigue'), positive: false },
  { key: 'sleep_quality', label: tr('u5.pp_history.t_sleep_quality'), positive: true },
  { key: 'stress', label: tr('u5.pp_history.t_stress'), positive: false },
  { key: 'mood', label: tr('u5.pp_history.t_mood'), positive: true },
  { key: 'supported', label: tr('u5.pp_history.t_supported'), positive: true },
];

export default function PostpartumHistory() {
  const toast = useToast();
  const today = todayISO();
  const q = usePostpartumCheckins(120);
  const actionsQ = usePostpartumActions();
  const del = useDeleteCheckin();
  const list = q.data ?? [];

  async function remove(id: string, date: string) {
    if (!(await confirm(tr('u5.pp_history.del_title'), tr('u5.pp_history.del_body', { date: formatDate(new Date(`${date}T12:00:00`)) }), tr('u5.pp_history.del_ok')))) return;
    try { await del.mutateAsync(id); toast(tr('u5.pp_history.deleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('u5.pp_history.title')} subtitle={tr('u5.pp_history.subtitle')}
      action={{ label: list.some((c) => c.checkin_date === today) ? tr('u5.pp_history.reread') : tr('u5.pp_checkin.title'), icon: 'feather', onPress: () => router.push('/postpartum/checkin'), testID: 'pp-history-action' }}>
      {q.isLoading && !q.data ? <Skeleton kind="card" rows={3} /> : null}
      {q.isError && !q.data ? <ErrorView error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && list.length === 0 ? (
        <EmptyState icon="trending-up" title={tr('u5.pp_history.empty_t')} body={tr('u5.pp_history.empty_b')} action={{ label: tr('u5.pp_checkin.title'), icon: 'feather', onPress: () => router.push('/postpartum/checkin') }} />
      ) : null}

      {list.length > 0 ? (
        <>
          <Card>
            <View style={{ gap: spacing.lg }}>
              {trends().map((tt) => {
                const pts = trendSeries(list, tt.key, today, 14);
                return <MiniTrend key={tt.key} label={tt.label} points={pts} positive={tt.positive} description={describeTrend(pts, tt.positive)} />;
              })}
            </View>
          </Card>
          <Text variant="caption" muted>{tr('u5.pp_history.disclaimer')}</Text>

          {actionsQ.data?.length ? (
            <>
              <SectionTitle title={tr('u5.pp_history.actions')} />
              <Card>
                {actionsQ.data.slice(0, 10).map((a) => (
                  <ListRow key={a.id} icon="check" title={ACTION_KINDS.find((k) => k.value === a.kind)?.label ?? a.kind} subtitle={[formatDate(new Date(`${a.done_on}T12:00:00`), { day: 'numeric', month: 'long' }), a.note].filter(Boolean).join(' — ')} />
                ))}
              </Card>
            </>
          ) : null}

          <HistoryHeader title={tr('u5.pp_history.list')} count={list.length} />
          {list.map((c, i) => (
            <StaggerItem key={c.id} index={i}>
              <Card>
                <ListRow
                  icon="calendar"
                  title={formatDate(new Date(`${c.checkin_date}T12:00:00`), { weekday: 'long', day: 'numeric', month: 'long' })}
                  subtitle={[
                    c.needs.filter((n) => n !== 'no_answer').map((n) => NEEDS.find((x) => x.value === n)?.label).join(', '),
                    c.comment ? (c.comment.length > 90 ? `${c.comment.slice(0, 90)}…` : c.comment) : null,
                  ].filter(Boolean).join(' — ') || tr('u5.pp_history.noted')}
                  right={<Button label={tr('u5.pp_history.del_ok')} size="sm" variant="ghost" onPress={() => remove(c.id, c.checkin_date)} accessibilityLabel={tr('u5.pp_history.del_a11y', { date: c.checkin_date })} />}
                />
              </Card>
            </StaggerItem>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
