/** Boîte de réception : rappels, réponses de la communauté, abonnement, rappels officiels de produits. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { haptic, Icon, type IconName, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useRelevantNotifications } from '@/lib/data/hooks-scope';
import { useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/lib/data/hooks-me';
import { friendlyError } from '@/lib/data/hooks-settings';
import { timeAgo } from '@/lib/domain/dates';
import type { AppNotification } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const CATEGORY: Record<AppNotification['category'], { icon: IconName; label: string }> = {
  reminder: { icon: 'bell', label: 'Rappel' },
  community_reply: { icon: 'message-circle', label: 'Communauté' },
  community_comment: { icon: 'message-square', label: 'Communauté' },
  community_like: { icon: 'heart', label: 'Communauté' },
  community_saved: { icon: 'bookmark', label: 'Communauté' },
  community_moderation: { icon: 'shield', label: 'Modération' },
  community_follow: { icon: 'user-plus', label: 'Communauté' },
  community_mention: { icon: 'at-sign', label: 'Mention' },
  community_group: { icon: 'users', label: 'Groupe' },
  assistant: { icon: 'help-circle', label: 'Assistant' },
  subscription: { icon: 'star', label: 'Abonnement' },
  product_recall: { icon: 'alert-triangle', label: 'Rappel de produit' },
  system: { icon: 'info', label: 'Au fil de nous' },
  family: { icon: 'users', label: 'Foyer' },
};

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

  const unread = (data ?? []).filter((n) => !n.read_at);
  const read = (data ?? []).filter((n) => n.read_at);

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
          accessibilityLabel={`${isUnread ? 'Non lue. ' : ''}${meta.label} : ${n.title}${n.body ? `. ${n.body}` : ''}`}
          accessibilityHint={to ? 'Ouvre l’écran concerné' : isUnread ? 'Marque comme lue' : undefined}
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
            <Text variant="caption" muted>{meta.label} · {timeAgo(n.created_at)}</Text>
          </View>
          {to && <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
        </Tappable>
        <IconButton icon="x" label={`Supprimer la notification ${n.title}`} color={t.colors.textMuted} size={18} onPress={() => { if (del.isPending && del.variables === n.id) return; del.mutate(n.id, { onError: (e) => toast(friendlyError(e, 'Suppression impossible. Réessayez dans un instant.'), 'error') }); }} />
      </View>
    );
  }

  type Item = { kind: 'section'; title: string } | { kind: 'notif'; n: AppNotification };
  const items = useMemo<Item[]>(() => [
    ...(unread.length ? [{ kind: 'section', title: 'Non lues' } as const] : []),
    ...unread.map((n) => ({ kind: 'notif', n }) as const),
    ...(read.length ? [{ kind: 'section', title: 'Déjà lues' } as const] : []),
    ...read.map((n) => ({ kind: 'notif', n }) as const),
  ], [unread, read]);
  const loading = isLoading && !data;
  const failed = isError && !data;

  return (
    <Screen
      back
      title="Notifications"
      subtitle={unread.length ? `${unread.length} non lue${unread.length > 1 ? 's' : ''}` : 'Vous êtes à jour.'}
      action={unread.length > 0
        ? { label: 'Tout marquer comme lu', icon: 'check', disabled: markAll.isPending, testID: 'notif-mark-all', onPress: () => markAll.mutate(undefined, { onSuccess: () => toast('Tout est marqué comme lu.'), onError: (e) => toast(friendlyError(e), 'error') }) }
        : { label: 'Gérer mes rappels', icon: 'settings', testID: 'notif-settings', onPress: () => router.push('/settings/reminders' as never) }}
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
        ListHeaderComponent={loading ? <Skeleton rows={5} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} title="Impossible d’afficher vos notifications" /> : (
          <TodaySummary title="En bref" items={[
            { icon: 'bell', value: String(unread.length), label: unread.length > 1 ? 'Non lues' : 'Non lue' },
            { icon: 'clock', value: String((data ?? []).filter((n) => n.category === 'reminder').length), label: 'Rappels' },
            { icon: 'alert-triangle', value: String((data ?? []).filter((n) => n.category === 'product_recall').length), label: 'Rappels de produit' },
          ]} />
        )}
        ListEmptyComponent={loading || failed ? null : (
          <EmptyState icon="bell" title="Rien de nouveau" body="Vos rappels, les réponses de la communauté et les alertes importantes apparaîtront ici." action={{ label: 'Gérer mes rappels', icon: 'settings', onPress: () => router.push('/settings/reminders' as never) }} />
        )}
        ListFooterComponent={<Text variant="caption" muted center style={{ marginTop: spacing.sm }}>Gérez vos rappels et autorisations de notification dans les réglages.</Text>}
      />
    </Screen>
  );
}
