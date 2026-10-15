/** Boîte de réception : rappels, réponses de la communauté, abonnement, rappels officiels de produits. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyStateCard } from '@/components/ui-extra';
import { Button, ErrorState, haptic, Icon, type IconName, IconButton, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useNotificationsInbox } from '@/lib/data/hooks';
import { useDeleteNotification, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/lib/data/hooks-me';
import { timeAgo } from '@/lib/domain/dates';
import type { AppNotification } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const CATEGORY: Record<AppNotification['category'], { icon: IconName; label: string }> = {
  reminder: { icon: 'bell', label: 'Rappel' },
  community_reply: { icon: 'message-circle', label: 'Communauté' },
  community_comment: { icon: 'message-square', label: 'Communauté' },
  assistant: { icon: 'help-circle', label: 'Assistant' },
  subscription: { icon: 'star', label: 'Abonnement' },
  product_recall: { icon: 'alert-triangle', label: 'Rappel de produit' },
  system: { icon: 'info', label: 'Toi & Moi' },
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
  const { data, isLoading, error, refetch } = useNotificationsInbox();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const del = useDeleteNotification();

  const unread = (data ?? []).filter((n) => !n.read_at);
  const read = (data ?? []).filter((n) => n.read_at);

  function openNotif(n: AppNotification) {
    if (!n.read_at) markRead.mutate(n.id);
    const to = routeOf(n);
    if (to) router.push(to as never);
  }

  function row(n: AppNotification) {
    const meta = CATEGORY[n.category] ?? CATEGORY.system;
    const to = routeOf(n);
    const isUnread = !n.read_at;
    const urgent = n.category === 'product_recall';
    return (
      <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: isUnread ? t.colors.surface : t.colors.surfaceAlt }}>
        <Pressable
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
        </Pressable>
        <IconButton icon="x" label={`Supprimer la notification ${n.title}`} color={t.colors.textMuted} size={18} onPress={() => del.mutate(n.id, { onError: (e) => toast(e instanceof Error ? e.message : 'Suppression impossible.', 'error') })} />
      </View>
    );
  }

  return (
    <Screen
      back
      title="Notifications"
      subtitle={unread.length ? `${unread.length} non lue${unread.length > 1 ? 's' : ''}` : 'Vous êtes à jour.'}
      right={unread.length > 0 ? <Button label="Tout marquer comme lu" size="sm" variant="ghost" icon="check" loading={markAll.isPending} onPress={() => markAll.mutate(undefined, { onSuccess: () => toast('Tout est marqué comme lu.') })} /> : undefined}
    >
      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {!isLoading && !error && !data?.length && (
        <EmptyStateCard illustration="moon" title="Rien de nouveau" text="Vos rappels, les réponses de la communauté et les alertes importantes apparaîtront ici." />
      )}
      {unread.length > 0 && <SectionTitle title="Non lues" />}
      {unread.map(row)}
      {read.length > 0 && <SectionTitle title="Déjà lues" />}
      {read.map(row)}
      <Text variant="caption" muted center>Gérez vos rappels et autorisations de notification dans les réglages.</Text>
    </Screen>
  );
}
