/**
 * Messagerie privée de la communauté : éléments d'interface partagés (bouton d'entrée avec pastille de non-lus,
 * bouton « Écrire » d'un profil, rangée de la boîte de réception, bulle, date d'un fil).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Icon, IconButton, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { Avatar } from '@/features/community';
import { useCommunityProfile } from '@/lib/data/hooks';
import { useDmRealtime, useDmUnread, useOpenConversation } from '@/lib/data/hooks-messages';
import { friendlyError } from '@/lib/data/hooks-settings';
import { badgeLabel, type DmConversation, type DmMessage, type DmOutgoing } from '@/lib/domain/messages';
import { clockHM, longDate } from '@/i18n/formats';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Heure d'un message (« 14:05 ») ; jour d'un séparateur (« Aujourd'hui », « Hier », « 12 novembre »). */
export function messageTime(iso: string): string {
  const d = new Date(iso);
  return clockHM(d.getHours(), d.getMinutes());
}
export function messageDay(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / 86_400_000);
  if (days === 0) return tr('dm.day.today');
  if (days === 1) return tr('dm.day.yesterday');
  return longDate(d.getDate(), d.getMonth(), d.getFullYear() === now.getFullYear() ? null : d.getFullYear());
}
/** Boîte de réception : heure du jour, sinon date courte. */
export function inboxWhen(iso: string | null, now = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return sameDay ? messageTime(iso) : messageDay(iso, now);
}

export function UnreadBadge({ count, testID }: { count: number; testID?: string }) {
  const t = useTheme();
  const label = badgeLabel(count);
  if (!label) return null;
  return (
    <View testID={testID} accessibilityLabel={tr('dm.unreadA11y', { count })}
      style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: t.tokens.action.fill, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="caption" weight="bold" color={t.tokens.action.text}>{label}</Text>
    </View>
  );
}

/**
 * Entrée de la messagerie, dans l'en-tête de l'écran Communauté (21/11/2026 ; elle était dans la rangée « Groupes /
 * Filtres ») : enveloppe + pastille qui compte messages non lus et demandes reçues ; le nom accessible dit le nombre.
 */
export function MessagesHeaderButton() {
  const { data: me } = useCommunityProfile();
  const unread = useDmUnread(!!me);
  useDmRealtime(!!me);
  const n = me ? unread.total : 0;
  return (
    <View>
      <IconButton icon="mail" label={n ? tr('dm.entryA11y', { count: n }) : tr('dm.title')} onPress={() => router.push('/community/messages' as never)} testID="community-messages" />
      {n ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0 }}><UnreadBadge count={n} testID="community-messages-badge" /></View> : null}
    </View>
  );
}

/** Bouton « Écrire » du profil d'un membre : ouvre (ou crée) la conversation. */
export function WriteButton({ handle, onNeedProfile }: { handle: string; onNeedProfile?: () => void }) {
  const toast = useToast();
  const open = useOpenConversation();
  return (
    <Button label={tr('dm.write')} icon="mail" size="sm" variant="secondary" loading={open.isPending} testID={`write-${handle}`}
      accessibilityLabel={tr('dm.writeTo', { handle })}
      onPress={async () => {
        try {
          const id = await open.mutateAsync(handle);
          router.push(`/community/messages/${id}` as never);
        } catch (e) {
          if ((e as { hint?: string }).hint === 'pseudonym_required' && onNeedProfile) onNeedProfile(); else toast(friendlyError(e, tr('dm.err.openFailed')), 'error');
        }
      }} />
  );
}

/** Aperçu du dernier message dans la boîte de réception (« Vous : … » si c’est le mien). */
export function conversationPreview(c: DmConversation): string {
  if (!c.last_body) return '';
  const body = c.last_body.replace(/\s+/g, ' ');
  return c.last_mine ? tr('dm.inbox.you', { text: body }) : body;
}

export function ConversationRow({ c, last }: { c: DmConversation; last?: boolean }) {
  const t = useTheme();
  const unread = c.unread > 0 && c.status !== 'request_sent';
  return (
    <Tappable accessibilityRole="button" testID={`dm-row-${c.handle}`}
      accessibilityLabel={tr(unread ? 'dm.inbox.rowUnreadA11y' : 'dm.inbox.rowA11y', { name: c.pseudonym, count: c.unread })}
      onPress={() => router.push(`/community/messages/${c.id}` as never)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 68, paddingVertical: spacing.sm, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.colors.border }}>
      <Avatar path={c.avatar_path} preset={c.avatar_preset ?? 'moon'} size={46} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text weight="bold" numberOfLines={1} intentionalTruncation style={{ flex: 1 }}>{c.pseudonym}</Text>
          <Text variant="caption" muted>{inboxWhen(c.last_at)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text variant="small" muted={!unread} weight={unread ? 'medium' : undefined} numberOfLines={1} intentionalTruncation style={{ flex: 1 }}>
            {c.status === 'request_sent' ? tr('dm.inbox.requestSent', { text: conversationPreview(c) }) : conversationPreview(c)}
          </Text>
          {unread ? <UnreadBadge count={c.unread} testID={`dm-unread-${c.handle}`} /> : null}
        </View>
      </View>
    </Tappable>
  );
}

export function DaySeparator({ date }: { date: string }) {
  return <Text variant="caption" muted center accessibilityRole="header" style={{ marginVertical: spacing.xs }}>{messageDay(date)}</Text>;
}

export function Bubble({ message, outgoing, showTime, onRetry, onDiscard }: { message: DmMessage; outgoing?: DmOutgoing; showTime: boolean; onRetry?: () => void; onDiscard?: () => void }) {
  const t = useTheme();
  const mine = message.mine;
  const failed = outgoing?.state === 'failed';
  const status = failed ? (outgoing?.error || tr('dm.err.sendFailed')) : outgoing ? tr('dm.sending') : mine ? tr('dm.sentAt', { time: messageTime(message.created_at) }) : messageTime(message.created_at);
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: 2 }} testID={mine ? 'dm-bubble-mine' : 'dm-bubble-theirs'}>
      <View accessible accessibilityLabel={tr(mine ? 'dm.bubbleMineA11y' : 'dm.bubbleTheirsA11y', { text: message.body, time: messageTime(message.created_at) })}
        style={{
          maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg,
          borderBottomRightRadius: mine ? 6 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 6,
          backgroundColor: mine ? t.tokens.action.fill : t.colors.surfaceAlt, opacity: outgoing && !failed ? 0.7 : 1,
          borderWidth: failed ? 1.5 : 0, borderColor: t.colors.danger,
        }}>
        <Text color={mine ? t.tokens.action.text : t.colors.text} selectable>{message.body}</Text>
      </View>
      {showTime || failed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
          {failed ? <Icon name="alert-circle" size={13} color={t.colors.danger} /> : null}
          <Text variant="caption" color={failed ? t.colors.danger : t.colors.textMuted} testID={failed ? 'dm-failed' : outgoing ? 'dm-sending' : mine ? 'dm-sent' : undefined}>{status}</Text>
        </View>
      ) : null}
      {failed ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Tappable accessibilityRole="button" onPress={onRetry} testID="dm-retry" style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.sm }}>
            <Text variant="small" weight="bold" color={t.colors.primary}>{tr('dm.retry')}</Text>
          </Tappable>
          <Tappable accessibilityRole="button" onPress={onDiscard} testID="dm-discard" style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.sm }}>
            <Text variant="small" muted>{tr('dm.discard')}</Text>
          </Tappable>
        </View>
      ) : null}
    </View>
  );
}
