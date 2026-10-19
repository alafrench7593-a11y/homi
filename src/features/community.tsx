import React, { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Card, Chip, Icon, type IconName, Row, Text } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { useBlockAuthor, useReport, useToggleLike, useToggleSave } from '@/lib/data/hooks-community';
import { timeAgo } from '@/lib/domain/dates';
import type { FeedPost, Forum, ReportReason } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { friendlyError } from '@/lib/data/hooks-settings';
import { BRAND } from '@/config/brand';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harcèlement ou propos blessants' },
  { key: 'medical_misinformation', label: 'Information médicale dangereuse' },
  { key: 'danger', label: 'Une personne semble en danger' },
  { key: 'personal_data', label: 'Données personnelles exposées' },
  { key: 'spam', label: 'Publicité ou spam' },
  { key: 'inappropriate', label: 'Contenu inapproprié' },
  { key: 'other', label: 'Autre' },
];

const SPACE_ICONS: Record<string, IconName> = {
  shield: 'shield', sparkles: 'star', fertility: 'activity', moon: 'moon', twins: 'copy', birth: 'sunrise', heart: 'heart', drop: 'droplet',
  bottle: 'coffee', sleep: 'cloud', food: 'pie-chart', baby: 'smile', sun: 'sun', users: 'users', map: 'map-pin',
};
export const spaceIcon = (f?: Pick<Forum, 'icon'> | null): IconName => SPACE_ICONS[f?.icon ?? ''] ?? 'message-square';

/** Tuile d'espace (suggestions « Mes espaces »). */
export function SpaceTile({ forum, selected, onPress }: { forum: Forum; selected?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Espace ${forum.title}. ${forum.description}`}
      onPress={onPress}
      style={{
        width: 168, minHeight: 112, padding: spacing.sm, gap: 4, borderRadius: radius.lg, borderWidth: selected ? 2 : 1,
        borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: t.colors.surface,
      }}
    >
      <Icon name={spaceIcon(forum)} size={20} color={t.colors.primary} />
      <Text weight="bold">{forum.title}</Text>
      <Text variant="caption" muted>{forum.description}</Text>
    </Pressable>
  );
}

export function ReportSheet({ visible, onClose, postId, commentId }: { visible: boolean; onClose: () => void; postId?: string; commentId?: string }) {
  const toast = useToast();
  const reportM = useReport();
  const blockM = useBlockAuthor();
  const pending = reportM.isPending || blockM.isPending;
  async function report(reason: ReportReason) {
    if (pending) return;
    try {
      await reportM.mutateAsync({ postId, commentId, reason });
      toast('Merci. L’équipe de modération va examiner ce contenu.');
      onClose();
    } catch (e) {
      // La feuille reste ouverte pour pouvoir réessayer
      toast(friendlyError(e, 'Signalement impossible. Réessayez dans un instant.'), 'error');
    }
  }
  async function block() {
    if (pending) return;
    try {
      await blockM.mutateAsync({ postId, commentId });
      toast('Cette personne est bloquée : vous ne verrez plus ses contenus.');
      onClose();
    } catch (e) {
      toast(friendlyError(e, 'Blocage impossible. Réessayez dans un instant.'), 'error');
    }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={commentId ? 'Signaler ce commentaire' : 'Signaler cette publication'}>
      <Text variant="small" muted>Pourquoi ce contenu pose-t-il problème ?</Text>
      {REPORT_REASONS.map((r) => (
        <Pressable key={r.key} accessibilityRole="button" accessibilityState={{ disabled: pending, busy: reportM.isPending }} disabled={pending} onPress={() => report(r.key)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', opacity: pending ? 0.5 : 1 }}>
          <Text>{r.label}</Text>
        </Pressable>
      ))}
      <Chip label="Bloquer cette personne" icon="slash" onPress={block} />
      <Text variant="caption" muted>Si quelqu’un semble en danger immédiat, appelez le 15 ou le 112.</Text>
    </Sheet>
  );
}

export function PostCard({ post, forumTitle, full }: { post: FeedPost; forumTitle?: string; full?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const like = useToggleLike();
  const save = useToggleSave();
  const [reporting, setReporting] = useState(false);

  async function toggleSave() {
    if (save.isPending) return;
    try {
      const saved = await save.mutateAsync(post);
      toast(saved ? 'Ajoutée à vos favoris.' : 'Retirée de vos favoris.');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  function toggleLike() {
    if (like.isPending) return;
    like.mutate(post, { onError: (e) => toast(friendlyError(e), 'error') });
  }

  function share() {
    Share.share({ message: `« ${post.title} » — une discussion sur ${BRAND.name}` }).catch(() => toast('Le partage n’est pas disponible sur cet appareil.', 'error'));
  }

  return (
    <Card onPress={full ? undefined : () => router.push(`/community/post/${post.id}`)} accessibilityLabel={`Publication de ${post.pseudonym ?? 'anonyme'} : ${post.title}`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text variant="caption" muted style={{ flex: 1 }}>{post.pseudonym ?? 'Membre'}, {timeAgo(post.created_at)}{forumTitle ? ` dans ${forumTitle}` : ''}</Text>
        {post.status !== 'visible' && <Text variant="caption" color={t.colors.gold}>{post.status === 'pending_review' ? 'En relecture' : 'Masquée'}</Text>}
      </Row>
      <Text weight="bold" style={{ marginTop: 4 }}>{post.title}</Text>
      {/* Aperçu volontairement limité à 3 lignes : le message complet s'ouvre en touchant la carte */}
      <Text variant="small" numberOfLines={full ? undefined : 3} intentionalTruncation style={{ marginTop: 2 }}>{post.body}</Text>
      {post.area_label ? <Row gap={4} style={{ marginTop: 6 }}><Icon name="map-pin" size={12} color={t.colors.textMuted} /><Text variant="caption" muted>{post.area_label}</Text></Row> : null}
      <Row style={{ marginTop: spacing.sm }} gap={spacing.xs} wrap>
        <Chip label={String(post.like_count)} icon="heart" selected={post.liked} onPress={toggleLike} />
        <Chip label={String(post.comment_count)} icon="message-square" onPress={() => router.push(`/community/post/${post.id}`)} />
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !!post.saved, busy: save.isPending }}
          accessibilityLabel={post.saved ? 'Dans mes favoris. Retirer des favoris' : 'Enregistrer dans mes favoris'}
          hitSlop={4}
          disabled={save.isPending}
          onPress={toggleSave}
          style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: post.saved ? t.colors.primary + '1F' : 'transparent' }}
        >
          <Icon name="bookmark" size={18} color={post.saved ? t.colors.primary : t.colors.textMuted} />
        </Pressable>
        <View style={{ flexGrow: 1 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Partager" hitSlop={4} onPress={share} style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="share-2" size={18} color={t.colors.textMuted} />
        </Pressable>
        {!post.is_mine && (
          <Pressable accessibilityRole="button" accessibilityLabel="Signaler ou bloquer" hitSlop={4} onPress={() => setReporting(true)} style={{ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="flag" size={18} color={t.colors.textMuted} />
          </Pressable>
        )}
      </Row>
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} postId={post.id} />
    </Card>
  );
}
