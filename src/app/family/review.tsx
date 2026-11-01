/**
 * Bilan hebdomadaire familial : neutre et constructif. Par catégorie, jamais par personne :
 * pas de classement, pas de comparaison. Les informations post-partum n'y figurent que si la mère
 * a choisi de les partager (ligne de partage, déjà filtrée par le serveur).
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton } from '@/components/States';
import { ProgressBar, StaggerItem } from '@/components/Motion';
import { Card, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { fmtWhen } from '@/features/familyLoad';
import { useAppointments } from '@/lib/data/hooks';
import { useCareRequests, useCareShifts, useFamilyTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useSharedWithMe } from '@/lib/data/hooks-postpartum';
import { REST_LABEL, AVAILABILITY_LABEL } from '@/lib/domain/postpartum';
import { weeklyReview } from '@/lib/domain/familyLoad';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function WeeklyReview() {
  const t = useTheme();
  const tasksQ = useFamilyTasks();
  const { data: requests } = useCareRequests();
  const { data: shifts } = useCareShifts();
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const shared = useSharedWithMe();
  const { labelOf } = usePeople();
  const r = useMemo(() => weeklyReview({ tasks: tasksQ.data ?? [], requests: requests ?? [], shifts: shifts ?? [] }), [tasksQ.data, requests, shifts]);
  const week = (appointments ?? []).filter((a) => Date.parse(a.starts_at) < Date.now() + 7 * 86400000);
  const max = Math.max(1, ...r.byCategory.map((c) => c.count));

  return (
    <Screen back title={tr('u2.review.title')} subtitle={tr('u2.review.subtitle')}>
      <TodaySummary title={tr('u2.review.this_week')} items={[
        { icon: 'check-square', value: String(r.doneCount), label: tr('u2.review.tasks_done') },
        { icon: 'repeat', value: String(r.requests.total), label: tr('u2.review.requests') },
        { icon: 'moon', value: String(r.nightsCount), label: tr('u2.review.nights') },
        { icon: 'sun', value: String(r.restCount), label: tr('u2.review.me_time') },
      ]} />
      {tasksQ.isLoading && !tasksQ.data ? <Skeleton kind="card" rows={2} /> : null}
      <Card>
        <Text weight="bold">{r.doneCount ? tr('u2.review.done_week', { count: r.doneCount }) : tr('u2.review.done_none')}</Text>
        <Text variant="caption" muted>{tr('u2.review.together')}</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {r.byCategory.map((c, i) => (
            <StaggerItem key={c.value} index={i}>
              <Row><Icon name={c.icon} size={16} color={t.colors.primary} /><Text variant="small" style={{ flex: 1 }}>{c.label}</Text><Text variant="small" weight="bold">{c.count}</Text></Row>
              <View style={{ marginTop: 4 }}><ProgressBar value={c.count / max} color={t.colors.primary} track={t.colors.surfaceAlt} height={6} accessibilityLabel={tr('u2.review.cat_a11y', { label: c.label, count: c.count })} /></View>
            </StaggerItem>
          ))}
        </View>
      </Card>

      <SectionTitle title={tr('u2.review.mutual')} />
      <Card>
        <ListRow icon="repeat" title={tr('u2.review.req_title', { count: r.requests.total })} subtitle={`${tr('u2.review.accepted', { count: r.requests.accepted })} · ${tr('u2.review.pending', { count: r.requests.open })}`} />
        <ListRow icon="sun" title={tr('u2.review.rest_title', { count: r.restCount })} subtitle={tr('u2.review.past_next')} />
        <ListRow icon="moon" title={tr('u2.review.nights_title', { count: r.nightsCount })} subtitle={tr('u2.review.nights_past_next')} />
      </Card>

      {shared.data.length ? (
        <>
          <SectionTitle title={tr('u2.review.shared')} />
          <Card>
            {shared.data.map((s) => (
              <ListRow key={s.user_id} icon="heart" title={[s.rest_need ? REST_LABEL[s.rest_need] : null, s.availability ? AVAILABILITY_LABEL[s.availability] : null, s.relay_requested ? tr('u2.review.asks_relay') : null].filter(Boolean).join(' · ') || tr('u2.review.shared_msg')} subtitle={s.summary ?? undefined} onPress={() => router.push('/postpartum/partner')} />
            ))}
            <Text variant="caption" muted>{tr('u2.review.only_shared')}</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title={tr('u2.review.next_week')} />
      <Card>
        {week.map((a) => <ListRow key={a.id} icon="calendar" title={a.title} subtitle={fmtWhen(a.starts_at)} />)}
        {r.upcoming.map((x) => <ListRow key={x.id} icon="check-square" title={x.title} subtitle={`${fmtWhen(x.due_at!)} · ${labelOf(x.assignee_id)}`} />)}
        {!week.length && !r.upcoming.length ? <Text variant="small" muted>{tr('u2.review.nothing_next')}</Text> : null}
      </Card>

      <SectionTitle title={tr('u2.review.adjust')} />
      <Card tone="soft">{r.points.map((p) => <ListRow key={p} icon="message-circle" title={p} />)}</Card>
    </Screen>
  );
}
