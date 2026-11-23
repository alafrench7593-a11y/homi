/**
 * « Les souvenirs de sa journée » : récapitulatif « La journée de … » (enregistré / non renseigné, rien d'inventé) puis
 * photos et événements du carnet entremêlés par heure ; navigation vers les jours précédents (les photos suivent la
 * durée de conservation choisie par les parents).
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { addDays, formatDateFr, todayISO } from '@/lib/domain/dates';
import { useCareChild, useCareDay, useCareMemberNames } from '@/lib/data/hooks-nounou';
import { CarePhotoThumb, CareRow, DaySummaryCard, useAuthorLabel } from '@/features/nounou/CareUI';

const MAX_BACK_DAYS = 366;

export default function CareDay() {
  const { id, day: rawDay } = useLocalSearchParams<{ id: string; day?: string }>();
  const today = todayISO();
  const day = typeof rawDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDay) && rawDay <= today ? rawDay : today;
  const { child, role, loading } = useCareChild(id);
  const dayQ = useCareDay(child ? id : null, day);
  const names = useCareMemberNames(child?.household_id);
  const authorOf = useAuthorLabel(names.data);
  const goDay = (d: string) => router.setParams({ day: d });
  const oldest = addDays(today, -MAX_BACK_DAYS);

  if (loading) return <Screen back title={tr('nn.day.memories')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child || !role) return <Screen back title={tr('nn.day.memories')} tool={false}><EmptyState icon="lock" title={tr('nn.space.noAccess')} body={tr('nn.space.noAccessBody')} /></Screen>;
  const items = [...(dayQ.items ?? [])].reverse(); // ordre de la journée
  return (
    <Screen back title={tr('nn.day.memories')} subtitle={child.first_name} tool={false}>
      <Text variant="heading" center testID="care-day-label" accessibilityRole="header">{day === today ? tr('nn.day.today') : formatDateFr(day)}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Button label={tr('nn.day.prev')} icon="chevron-left" variant="secondary" size="sm" style={{ flex: 1 }} disabled={day <= oldest} onPress={() => goDay(addDays(day, -1))} testID="care-day-prev" />
        <Button label={tr('nn.day.next')} iconRight="chevron-right" variant="secondary" size="sm" style={{ flex: 1 }} disabled={day >= today} onPress={() => goDay(addDays(day, 1))} testID="care-day-next" />
      </View>
      {dayQ.isLoading && !dayQ.items ? <Skeleton rows={4} /> : dayQ.isError && !dayQ.items ? (
        <ErrorView error={dayQ.error} onRetry={() => void dayQ.refetch()} />
      ) : (
        <>
          <DaySummaryCard name={child.first_name} items={items} />
          <Card>
            <Text variant="heading">{tr('nn.day.timeline')}</Text>
            {!items.length ? <Text muted style={{ marginTop: spacing.xs }}>{tr('nn.journal.emptyDay')}</Text> : items.map((it) => (
              <View key={`${it.kind}-${it.id}`}>
                <CareRow item={it} author={authorOf(it.authorId, it.origin)} />
                {it.kind === 'photo' ? (
                  <View style={{ marginLeft: 92, marginBottom: spacing.xs }}>
                    <CarePhotoThumb path={String(it.row.storage_path)} size={160} label={tr('nn.kind.photo')} onPress={() => router.push(`/garde/${id}/photos` as never)} />
                  </View>
                ) : null}
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
