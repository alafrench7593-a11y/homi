/**
 * 133 — Habitudes de lecture : journal par enfant (livre, date, durée facultative, qui a lu, réaction), livres
 * préférés, semaine de lecture (les soirs partagés, sans série à « ne pas casser » ni message culpabilisant).
 * Parents de l'enfant seulement (RLS). Accès direct à la bibliothèque d'histoires HOMI (134).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Card, Icon, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { todayISO } from '@/lib/domain/dates';
import { friendlyError } from '@/lib/data/hooks-settings';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useAddFavorite, useReadingFavorites, useReadingLogs, useRemoveFavorite } from '@/lib/data/hooks-foyerTools';
import { isFavorite, mostRead, titleKey, weekSummary, type ReadingLog } from '@/features/reading/domain';
import { ChildChips, REACTION_ICON, ReadingEditor, useReadingChild } from '@/features/reading/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function Reading() {
  const theme = useTheme();
  const toast = useToast();
  const { children, child, setChild, loading } = useReadingChild();
  const logs = useReadingLogs(child?.id ?? null);
  const favs = useReadingFavorites(child?.id ?? null);
  const addFav = useAddFavorite();
  const delFav = useRemoveFavorite();
  const { nameOf } = usePeople();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReadingLog | null>(null);
  const today = todayISO();
  const list = useMemo(() => logs.data ?? [], [logs.data]);
  const week = useMemo(() => weekSummary(list, today), [list, today]);
  const top = useMemo(() => mostRead(list, 5), [list]);

  if (loading || (child && logs.isLoading && !logs.data)) return <Screen back title={tr('rd.title')}><Skeleton rows={4} /></Screen>;
  if (!child) return <Screen back title={tr('rd.title')}><EmptyState icon="book" title={tr('rd.title')} body={tr('rd.noChild')} /></Screen>;
  if (logs.isError && !logs.data) return <Screen back title={tr('rd.title')}><ErrorView error={logs.error} onRetry={() => void logs.refetch()} /></Screen>;
  const favList = favs.data ?? [];
  async function toggleFav(title: string) {
    const f = favList.find((x) => titleKey(x.title) === titleKey(title));
    try {
      if (f) await delFav.mutateAsync(f.id);
      else await addFav.mutateAsync({ household_id: child!.household_id, child_id: child!.id, title: title.trim().slice(0, 120) });
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const readerOf = (l: ReadingLog) => l.reader_label ?? (l.reader_id ? nameOf(l.reader_id) : null);
  return (
    <Screen back title={tr('rd.title')} subtitle={tr('rd.sub', { name: child.first_name })}
      action={{ label: tr('rd.addShort'), icon: 'plus', onPress: () => { setEditing(null); setOpen(true); }, testID: 'rd-add' }}>
      <ChildChips list={children} value={child.id} onChange={setChild} />
      <Card testID="rd-week">
        <Text weight="bold">{tr('rd.week.title')}</Text>
        <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
          {week.days.map((d) => (
            <View key={d.date} style={{ alignItems: 'center', gap: 4, flex: 1 }} accessibilityLabel={`${formatDate(d.date, { weekday: 'long' })} : ${d.read ? tr('rd.week.read') : tr('rd.week.notRead')}`}>
              <Text variant="caption" muted>{formatDate(d.date, { weekday: 'narrow' })}</Text>
              <View style={{ width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
                backgroundColor: d.read ? theme.tokens.action.fill : theme.tokens.surface.sunken, opacity: d.date > today ? 0.5 : 1 }} testID={`rd-day-${d.date}`}>
                {d.read ? <Icon name="book-open" size={14} color={theme.tokens.action.text} /> : null}
              </View>
            </View>
          ))}
        </Row>
        <Text variant="small" muted style={{ marginTop: spacing.sm }} testID="rd-week-summary">
          {week.daysRead ? tr('rd.week.summary', { count: week.daysRead, books: week.books, minutes: week.minutes }) : tr('rd.week.none')}
        </Text>
      </Card>
      <ListRow icon="book-open" title={tr('rd.library')} subtitle={tr('rd.librarySub')} onPress={() => router.push(`/reading/stories?child=${child.id}` as never)} testID="rd-open-library" />
      {favList.length ? (
        <ListGroup title={tr('rd.favorites')} testID="rd-favorites">
          {favList.map((f) => <ListRow key={f.id} icon="star" title={f.title} onPress={() => void toggleFav(f.title)} right={<Icon name="x" size={16} color={theme.colors.textMuted} />} testID={`rd-fav-${f.id}`} />)}
        </ListGroup>
      ) : null}
      {top.length ? (
        <ListGroup title={tr('rd.mostRead')} footer={tr('rd.favHint')}>
          {top.map((b) => (
            <ListRow key={titleKey(b.title)} icon={isFavorite(favList, child.id, b.title) ? 'star' : 'book'} title={b.title} value={tr('rd.times', { count: b.count })}
              onPress={() => void toggleFav(b.title)} testID={`rd-top-${titleKey(b.title).replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`} />
          ))}
        </ListGroup>
      ) : null}
      {list.length ? (
        <ListGroup title={tr('rd.history')} testID="rd-history">
          {list.slice(0, 60).map((l) => (
            <ListRow key={l.id} icon={l.reaction ? REACTION_ICON[l.reaction] : 'book'} title={l.title}
              subtitle={[formatDate(l.read_on, { weekday: 'short', day: 'numeric', month: 'short' }), l.minutes ? tr('rd.minutes', { count: l.minutes }) : null, readerOf(l),
                l.reaction ? tr(`rd.reaction.${l.reaction}` as TKey) : null, l._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
              onPress={l._pending ? undefined : () => { setEditing(l); setOpen(true); }} testID={`rd-log-${l.id}`} />
          ))}
        </ListGroup>
      ) : <EmptyState icon="book" title={tr('rd.empty.title')} body={tr('rd.empty.body')} action={{ label: tr('rd.addShort'), icon: 'plus', onPress: () => { setEditing(null); setOpen(true); } }} />}
      <ReadingEditor visible={open} onClose={() => setOpen(false)} child={child} initial={editing} />
    </Screen>
  );
}
