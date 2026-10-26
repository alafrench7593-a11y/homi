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
    <Screen back title="Bilan de la semaine" subtitle="Ce qui a été fait, ce qui arrive. Sans classement.">
      <TodaySummary title="Cette semaine" items={[
        { icon: 'check-square', value: String(r.doneCount), label: 'Tâches faites' },
        { icon: 'repeat', value: String(r.requests.total), label: 'Demandes' },
        { icon: 'moon', value: String(r.nightsCount), label: 'Nuits de relais' },
        { icon: 'sun', value: String(r.restCount), label: 'Moments pour soi' },
      ]} />
      {tasksQ.isLoading && !tasksQ.data ? <Skeleton kind="card" rows={2} /> : null}
      <Card>
        <Text weight="bold">{r.doneCount ? `${r.doneCount} tâche${r.doneCount > 1 ? 's' : ''} faite${r.doneCount > 1 ? 's' : ''} ces 7 derniers jours` : 'Aucune tâche cochée ces 7 derniers jours'}</Text>
        <Text variant="caption" muted>Ensemble, d’après ce qui a été noté.</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {r.byCategory.map((c, i) => (
            <StaggerItem key={c.value} index={i}>
              <Row><Icon name={c.icon} size={16} color={t.colors.primary} /><Text variant="small" style={{ flex: 1 }}>{c.label}</Text><Text variant="small" weight="bold">{c.count}</Text></Row>
              <View style={{ marginTop: 4 }}><ProgressBar value={c.count / max} color={t.colors.primary} track={t.colors.surfaceAlt} height={6} accessibilityLabel={`${c.label} : ${c.count}`} /></View>
            </StaggerItem>
          ))}
        </View>
      </Card>

      <SectionTitle title="Entraide" />
      <Card>
        <ListRow icon="repeat" title={`${r.requests.total} demande${r.requests.total > 1 ? 's' : ''} de relais ou d’aide`} subtitle={`${r.requests.accepted} acceptée${r.requests.accepted > 1 ? 's' : ''} · ${r.requests.open} en attente`} />
        <ListRow icon="sun" title={`${r.restCount} moment${r.restCount > 1 ? 's' : ''} pour soi`} subtitle="Pris ces 7 jours ou prévus les 7 prochains" />
        <ListRow icon="moon" title={`${r.nightsCount} nuit${r.nightsCount > 1 ? 's' : ''} de relais`} subtitle="Passées ces 7 jours ou prévues les 7 prochains" />
      </Card>

      {shared.data.length ? (
        <>
          <SectionTitle title="Partagé avec vous" />
          <Card>
            {shared.data.map((s) => (
              <ListRow key={s.user_id} icon="heart" title={[s.rest_need ? REST_LABEL[s.rest_need] : null, s.availability ? AVAILABILITY_LABEL[s.availability] : null, s.relay_requested ? 'Demande un relais' : null].filter(Boolean).join(' · ') || 'Message partagé'} subtitle={s.summary ?? undefined} onPress={() => router.push('/postpartum/partner')} />
            ))}
            <Text variant="caption" muted>Uniquement ce qu’elle a choisi de partager.</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title="La semaine qui vient" />
      <Card>
        {week.map((a) => <ListRow key={a.id} icon="calendar" title={a.title} subtitle={fmtWhen(a.starts_at)} />)}
        {r.upcoming.map((x) => <ListRow key={x.id} icon="check-square" title={x.title} subtitle={`${fmtWhen(x.due_at!)} · ${labelOf(x.assignee_id)}`} />)}
        {!week.length && !r.upcoming.length ? <Text variant="small" muted>Rien de prévu dans l’application pour les 7 prochains jours.</Text> : null}
      </Card>

      <SectionTitle title="À ajuster ensemble" />
      <Card tone="soft">{r.points.map((p) => <ListRow key={p} icon="message-circle" title={p} />)}</Card>
    </Screen>
  );
}
