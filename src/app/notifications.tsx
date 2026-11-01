/** Boîte de réception : rappels, réponses de la communauté, abonnement, rappels officiels de produits. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Chip, haptic, Icon, type IconName, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useRelevantNotifications } from '@/lib/data/hooks-scope';
import { useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/lib/data/hooks-me';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { AppNotification } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr, formatRelative } from '@/i18n';

/** `label` = clé de traduction (voir catLabel). */
const CATEGORY: Record<AppNotification['category'], { icon: IconName; label: string }> = {
  reminder: { icon: 'bell', label: 'u2.notif.cat_reminder' },
  community_reply: { icon: 'message-circle', label: 'u2.notif.cat_community' },
  community_comment: { icon: 'message-square', label: 'u2.notif.cat_community' },
  community_like: { icon: 'heart', label: 'u2.notif.cat_community' },
  community_saved: { icon: 'bookmark', label: 'u2.notif.cat_community' },
  community_moderation: { icon: 'shield', label: 'u2.notif.cat_moderation' },
  community_follow: { icon: 'user-plus', label: 'u2.notif.cat_community' },
  community_mention: { icon: 'at-sign', label: 'u2.notif.cat_mention' },
  community_group: { icon: 'users', label: 'u2.notif.cat_group' },
  assistant: { icon: 'help-circle', label: 'u2.notif.cat_assistant' },
  subscription: { icon: 'star', label: 'u2.notif.cat_subscription' },
  product_recall: { icon: 'alert-triangle', label: 'u2.notif.cat_recall' },
  system: { icon: 'info', label: 'u2.notif.cat_system' },
  family: { icon: 'users', label: 'u2.notif.cat_family' },
};

type Group = 'all' | 'reminders' | 'community' | 'products' | 'home';
/** Familles de notifications, pour filtrer en un geste. */
const GROUP_OF = (c: AppNotification['category']): Exclude<Group, 'all'> =>
  c === 'reminder' ? 'reminders' : c.startsWith('community') ? 'community' : c === 'product_recall' ? 'products' : 'home';
const GROUPS: { value: Group; label: string; icon: IconName }[] = [
  { value: 'all', label: 'u2.notif.g_all', icon: 'inbox' },
  { value: 'reminders', label: 'u2.notif.g_reminders', icon: 'bell' },
  { value: 'community', label: 'u2.notif.cat_community', icon: 'message-circle' },
  { value: 'products', label: 'u2.notif.g_products', icon: 'alert-triangle' },
  { value: 'home', label: 'u2.notif.g_home', icon: 'home' },
];

const catLabel = (key: string) => tr(key as never);

/** « il y a 5 minutes », « hier »… dans la langue courante. */
function ago(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 1) return formatRelative(0, 'second');
  if (min < 60) return formatRelative(-min, 'minute');
  const h = Math.floor(min / 60);
  if (h < 24) return formatRelative(-h, 'hour');
  return formatRelative(-Math.floor(h / 24), 'day');
}

/** Lien interne de la notification : deep_link, sinon payload.route / payload.url / payload.deep_link. */
function routeOf(n: Pick<AppNotification, 'deep_link' | 'payload'>): string | null {
  const candidates = [n.deep_link, n.payload?.route, n.payload?.url, n.payload?.deep_link];
  for (const c of candidates) if (typeof c === 'string' && c.startsWith('/') && !c.startsWith('//')) return c;
  return null;
}

export default function NotificationsScreen() {
  const t = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, isRefetching, error, refetch } = useRelevantNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  const [group, setGroup] = useState<Group>('all');
  const shown = (data ?? []).filter((n) => group === 'all' || GROUP_OF(n.category) === group);
  const allUnread = (data ?? []).filter((n) => !n.read_at);
  const unread = shown.filter((n) => !n.read_at);
  const read = shown.filter((n) => n.read_at);

  function openNotif(n: AppNotification) {
    if (!n.read_at) markRead.mutate(n.id, { onError: (e) => toast(friendlyError(e), 'error') });
    const to = routeOf(n);
    if (to) router.push(to as never);
  }

  function row(n: AppNotification) {
    const meta = CATEGORY[n.category] ?? CATEGORY.system;
    const to = routeOf(n);
    const isUnread = !n.read_at;
    const urgent = n.category === 'product_recall';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: isUnread ? t.colors.surface : t.colors.surfaceAlt }}>
        <Tappable
          accessibilityRole="button"
          accessibilityLabel={`${isUnread ? `${tr('u2.notif.unread_dot')} ` : ''}${catLabel(meta.label)} : ${n.title}${n.body ? `. ${n.body}` : ''}`}
          accessibilityHint={to ? tr('u2.notif.hint_open') : isUnread ? tr('u2.notif.hint_mark') : undefined}
          onPress={() => { haptic('selection'); openNotif(n); }}
          style={({ pressed }) => ({ flex: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingRight: 0, minHeight: MIN_TOUCH, opacity: pressed ? 0.8 : 1 })}
        >
          <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: urgent ? t.colors.dangerSoft : t.colors.surfaceAlt }}>
            <Icon name={meta.icon} size={18} color={urgent ? t.colors.danger : t.colors.text} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Row gap={6}>
              {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.heart }} />}
              <Text weight={isUnread ? 'bold' : 'medium'} style={{ flex: 1 }}>{n.title}</Text>
            </Row>
            {n.body ? <Text variant="small" muted numberOfLines={3}>{n.body}</Text> : null}
            <Text variant="caption" muted>{catLabel(meta.label)} · {ago(n.created_at)}</Text>
          </View>
          {to && <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
        </Tappable>
        {isUnread ? <IconButton icon="check" label={tr('u2.notif.mark_read', { title: n.title })} color={t.colors.primary} size={18} onPress={() => { haptic('selection'); markRead.mutate(n.id, { onError: (e) => toast(friendlyError(e), 'error') }); }} /> : null}
        <IconButton icon="x" label={tr('u2.notif.delete_a11y', { title: n.title })} color={t.colors.textMuted} size={18} onPress={() => { if (del.isPending && del.variables === n.id) return; del.mutate(n.id, { onError: (e) => toast(friendlyError(e, tr('u2.notif.delete_failed')), 'error') }); }} />
      </View>
    );
  }

  type Item = { kind: 'section'; title: string } | { kind: 'notif'; n: AppNotification };
  const items = useMemo<Item[]>(() => [
    ...(unread.length ? [{ kind: 'section', title: tr('u2.notif.unread') } as const] : []),
    ...unread.map((n) => ({ kind: 'notif', n }) as const),
    ...(read.length ? [{ kind: 'section', title: tr('u2.notif.read') } as const] : []),
    ...read.map((n) => ({ kind: 'notif', n }) as const),
  ], [unread, read]);
  const loading = isLoading && !data;
  const failed = isError && !data;

  return (
    <Screen
      back
      title={tr('u2.notif.title')}
      subtitle={allUnread.length ? tr('u2.notif.n_unread', { count: allUnread.length }) : tr('u2.notif.up_to_date')}
      action={allUnread.length > 0
        ? { label: tr('u2.notif.mark_all'), icon: 'check', disabled: markAll.isPending, testID: 'notif-mark-all', onPress: () => markAll.mutate(undefined, { onSuccess: () => toast(tr('u2.notif.all_marked')), onError: (e) => toast(friendlyError(e), 'error') }) }
        : { label: tr('u2.notif.manage'), icon: 'settings', testID: 'notif-settings', onPress: () => router.push('/settings/reminders' as never) }}
      scroll={false}
      padded={false}
    >
      <VirtualList
        data={loading || failed ? [] : items}
        keyExtractor={(it) => (it.kind === 'section' ? `s-${it.title}` : it.n.id)}
        renderItem={({ item }) => (item.kind === 'section' ? <SectionTitle title={item.title} /> : row(item.n))}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        ListHeaderComponent={loading ? <Skeleton rows={5} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} title={tr('u2.notif.load_error')} /> : (
          <View style={{ gap: spacing.sm }}>
          <TodaySummary title={tr('u2.notif.brief')} items={[
            { icon: 'bell', value: String(allUnread.length), label: allUnread.length > 1 ? tr('u2.notif.unread') : tr('u2.notif.one_unread') },
            { icon: 'clock', value: String((data ?? []).filter((n) => n.category === 'reminder').length), label: tr('u2.notif.g_reminders') },
            { icon: 'alert-triangle', value: String((data ?? []).filter((n) => n.category === 'product_recall').length), label: tr('u2.notif.cat_recall') },
          ]} />
          {(data ?? []).length ? (
            <Row wrap gap={6} testID="notif-filters">
              {GROUPS.filter((g) => g.value === 'all' || (data ?? []).some((n) => GROUP_OF(n.category) === g.value)).map((g) => {
                const c = g.value === 'all' ? allUnread.length : allUnread.filter((n) => GROUP_OF(n.category) === g.value).length;
                return <Chip key={g.value} icon={g.icon} label={c ? `${catLabel(g.label)} · ${c}` : catLabel(g.label)} selected={group === g.value} onPress={() => { haptic('selection'); setGroup(g.value); }} testID={`notif-filter-${g.value}`} />;
              })}
            </Row>
          ) : null}
          </View>
        )}
        ListEmptyComponent={loading || failed ? null : (
          <EmptyState icon="bell" title={tr('u2.notif.nothing')} body={tr('u2.notif.nothing_body')} action={{ label: tr('u2.notif.manage'), icon: 'settings', onPress: () => router.push('/settings/reminders' as never) }} />
        )}
        ListFooterComponent={<Text variant="caption" muted center style={{ marginTop: spacing.sm }}>{tr('u2.notif.footer')}</Text>}
      />
    </Screen>
  );
}
