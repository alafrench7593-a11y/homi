/**
 * Famille → Missions → Terminées (19/11/2026) : l'historique des missions terminées du foyer, par pages de 20
 * (requête à part : l'écran principal ne le charge jamais). Une ligne : nom, responsable (prénom + avatar), date et
 * heure de réalisation, statut. Lecture seule ; toucher une ligne ouvre le détail et son historique horodaté.
 * Aucun total par personne, aucun classement : c'est un journal, pas un tableau de score.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Divider, Text } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { Tappable } from '@/components/Tappable';
import { MatteSurface } from '@/features/scene';
import { StateLabel } from '@/features/missions/MissionCard';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDoneMissions } from '@/lib/data/hooks-missions';
import { missionHref } from '@/lib/domain/missions';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { MotionItem, MotionList } from '@/motion/ListMotion';

export default function DoneMissions() {
  const t = useTheme();
  const q = useDoneMissions();
  const { personOf } = usePeople();
  const rows = (q.data?.pages ?? []).flat();
  return (
    <Screen back title={tr('cp2.mis.history')} subtitle={tr('cp2.mis.historyIntro')}>
      {q.isLoading ? <Skeleton kind="card" rows={3} /> : q.isError && !rows.length ? (
        <ErrorView error={q.error} onRetry={() => void q.refetch()} />
      ) : !rows.length ? (
        <EmptyState icon="check-circle" title={tr('cp2.mis.historyNone')} body={tr('cp2.mis.historyEmptyB')} />
      ) : (
        <MatteSurface padded={spacing.sm} style={{ gap: 0 }} testID="missions-done-list">
          <MotionList style={{ gap: 0 }}>{rows.map((m, i) => {
            const who = personOf(m.done_by ?? m.assignee_id);
            const name = who?.name ?? tr('u7.people.former');
            const when = m.done_at ? formatDate(m.done_at, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <MotionItem key={m.id}><View key={m.id}>
                {i ? <Divider /> : null}
                <Tappable accessibilityRole="button" testID={`done-${m.id}`} onPress={() => router.push(missionHref(m.id) as never)}
                  accessibilityLabel={[m.title, tr('cp2.mis.doneBy', { name }), when, tr('mis.state.done')].join('. ')}
                  style={{ minHeight: MIN_TOUCH + 12, paddingVertical: spacing.sm, gap: 4 }}>
                  <Text weight="bold" numberOfLines={2}>{m.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {who ? <UserAvatar path={who.avatarPath} initial={who.initial} size={20} /> : null}
                    <Text variant="small" muted style={{ flexShrink: 1 }}>{tr('cp2.mis.doneBy', { name })}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm, flexWrap: 'wrap' }}>
                    <StateLabel state="done" />
                    <Text variant="small" color={t.colors.textMuted} testID={`done-when-${m.id}`}>{when}</Text>
                  </View>
                </Tappable>
              </View></MotionItem>
            );
          })}</MotionList>
        </MatteSurface>
      )}
      {q.hasNextPage ? <Button label={tr('cp2.mis.more')} variant="secondary" loading={q.isFetchingNextPage} onPress={() => void q.fetchNextPage()} testID="missions-done-more" /> : null}
    </Screen>
  );
}
