/**
 * Un groupe : présentation, rejoindre / quitter, invitation (accepter ou refuser), publications (épinglées d'abord),
 * publier dans le groupe. Groupe privé : membres visibles des seuls membres ; la créatrice invite (Premium),
 * retire un membre, épingle, supprime le groupe. La liste des membres d'un groupe ouvert n'est jamais affichée.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, Icon, type IconName, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { PostCard } from '@/features/community';
import { MemberRow, PremiumBadge } from '@/features/communitySocial';
import { useCommunityProfile, useForums } from '@/lib/data/hooks';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useGroup, useGroupAction, useGroupFeed } from '@/lib/data/hooks-social';
import { friendlyError } from '@/lib/data/hooks-settings';
import { pinnedFirst } from '@/lib/domain/communitySocial';
import { isPremiumRequired } from '@/lib/premium/features';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** Libellés traduits au rendu (la langue peut changer). */
const KIND = { theme: 'cm3.group.kind.theme', cohort: 'cm3.group.kind.cohort', private: 'cm3.group.kind.private' } as const;

export default function GroupScreen() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ id: string; invite?: string }>();
  const id = typeof params.id === 'string' ? params.id : null;
  const q = useGroup(id);
  const feed = useGroupFeed(id);
  const act = useGroupAction();
  const forums = useForums().data ?? [];
  const { data: me } = useCommunityProfile();
  const access = usePremiumAccess('community_groups');
  const [inviting, setInviting] = useState(false);
  const [handle, setHandle] = useState('');
  const g = q.data;

  async function run(fn: Parameters<typeof act.mutateAsync>[0]['fn'], args: Record<string, unknown>, ok: string) {
    try { await act.mutateAsync({ fn, args }); toast(ok); return true; }
    catch (e) {
      if (isPremiumRequired(e)) access.showPreview();
      else if ((e as { hint?: string }).hint === 'pseudonym_required') router.push({ pathname: '/community/profile', params: { next: 'groups' } });
      else toast(friendlyError(e), 'error');
      return false;
    }
  }

  if (q.isLoading && !g) return <Screen back title={tr('cm3.group.title')}><Skeleton kind="card" rows={3} /></Screen>;
  if (q.isError && !g) return <Screen back title={tr('cm3.group.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  if (!g) return <Screen back title={tr('cm3.group.title')}><EmptyState icon="lock" title={tr('cm3.group.notFoundTitle')} body={tr('cm3.group.notFoundBody')} /></Screen>;

  const invitation = g.pending_invitation;
  const posts = pinnedFirst(feed.data ?? []);
  const forumOf = (fid: string) => forums.find((f) => f.id === fid) ?? null;

  return (
    <Screen back title={g.name} subtitle={tr('cm3.group.subtitle', { kind: tr(KIND[g.kind]), count: g.member_count })}
      right={g.is_member ? <IconButton icon="edit-3" label={tr('cm3.group.publish')} onPress={() => router.push({ pathname: '/community/new', params: { group: g.id } })} /> : undefined}>
      <Card testID="group-header">
        <Row><Icon name={(g.icon as IconName) ?? 'users'} size={20} color={g.kind === 'private' ? t.colors.lavender : t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{g.name}</Text></Row>
        {g.description ? <Text variant="small" muted style={{ marginTop: 4 }}>{g.description}</Text> : null}
        {invitation && !g.is_member ? (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }} testID="group-invitation">
            <Text weight="medium">{tr('cm3.group.invited')}</Text>
            <Row gap={6}>
              <Button label={tr('cm3.group.accept')} icon="check" size="sm" onPress={() => void run('respond_group_invitation', { p_invitation: invitation, p_accept: true }, tr('cm3.group.welcome'))} testID="group-accept" />
              <Button label={tr('cm3.group.decline')} size="sm" variant="ghost" onPress={async () => { if (await run('respond_group_invitation', { p_invitation: invitation, p_accept: false }, tr('cm3.group.declined'))) router.back(); }} testID="group-decline" />
            </Row>
          </View>
        ) : g.is_member ? (
          <Row gap={6} style={{ marginTop: spacing.sm }}>
            <Button label={tr('cm3.group.publish')} icon="edit-3" size="sm" onPress={() => router.push({ pathname: '/community/new', params: { group: g.id } })} testID="group-publish" />
            {!g.is_owner ? <Button label={tr('cm3.group.leave')} size="sm" variant="ghost" onPress={async () => { if (await confirm(tr('cm3.group.leaveConfirm'), g.kind === 'private' ? tr('cm3.group.leavePrivate') : tr('cm3.group.leaveOpen'), tr('cm3.group.leave'))) void run('leave_group', { p_group: g.id }, tr('cm3.group.left')); }} testID="group-leave" /> : null}
          </Row>
        ) : g.kind !== 'private' ? (
          <Button label={tr('cm3.group.joinGroup')} icon="user-plus" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} onPress={() => (me ? void run('join_group', { p_group: g.id }, tr('cm3.group.joined')) : router.push({ pathname: '/community/profile', params: { next: 'groups' } }))} testID="group-join" />
        ) : null}
      </Card>

      {g.kind === 'private' && g.is_member && g.members ? (
        <>
          <SectionTitle title={tr('cm3.group.members')} />
          <Card testID="group-members">
            {g.members.map((m) => (
              <MemberRow key={m.handle} m={m} right={g.is_owner && m.role !== 'owner' ? (
                <IconButton icon="user-x" label={tr('cm3.group.removeA11y', { handle: m.handle })} onPress={async () => { if (await confirm(tr('cm3.group.removeConfirm', { handle: m.handle }), tr('cm3.group.removeBody'), tr('cm3.group.remove'))) void run('remove_group_member', { p_group: g.id, p_handle: m.handle }, tr('cm3.group.removed')); }} />
              ) : null} />
            ))}
            {g.is_owner ? (
              <Row gap={6} style={{ marginTop: spacing.xs }}>
                <Button label={tr('cm3.group.invite')} icon="user-plus" size="sm" onPress={() => (g.can_invite ? setInviting(true) : access.showPreview())} testID="group-invite" />
                {!g.can_invite ? <PremiumBadge /> : null}
              </Row>
            ) : null}
            {g.is_owner && g.invitations?.length ? <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('cm3.group.pending', { handles: g.invitations.map((i) => `@${i.handle}`).join(', ') })}</Text> : null}
          </Card>
          {g.is_owner && g.can_invite === false ? (
            <Banner tone="info" title={tr('cm3.group.lapsedTitle')}>{tr('cm3.group.lapsedBody')}</Banner>
          ) : null}
        </>
      ) : null}

      <SectionTitle title={tr('cm3.group.posts')} />
      {feed.isLoading && !feed.data ? <Skeleton kind="card" rows={2} /> : !g.is_member && g.kind === 'private' ? (
        <EmptyState icon="lock" title={tr('cm3.group.membersOnlyTitle')} body={tr('cm3.group.membersOnlyBody')} />
      ) : posts.length ? (
        <View style={{ gap: spacing.sm }}>{posts.map((p) => <PostCard key={p.id} post={p} forum={forumOf(p.forum_id)} canPin={g.is_owner && g.kind === 'private'} />)}</View>
      ) : <EmptyState icon="message-square" title={tr('cm3.group.noPostsTitle')} body={g.is_member ? tr('cm3.group.noPostsMember') : tr('cm3.group.noPostsGuest')} />}

      {g.is_owner && g.kind === 'private' ? (
        <Button label={tr('cm3.group.delete')} icon="trash-2" variant="ghost" onPress={async () => {
          if (!(await confirm(tr('cm3.group.deleteConfirm'), tr('cm3.group.deleteBody'), tr('cm3.group.deleteAction')))) return;
          if (await run('delete_private_group', { p_group: g.id }, tr('cm3.group.deleted'))) router.replace('/community/groups' as never);
        }} testID="group-delete" />
      ) : null}

      <Sheet visible={inviting} onClose={() => setInviting(false)} title={tr('cm3.group.invite')}>
        <View style={{ gap: spacing.sm }}>
          <Field label={tr('cm3.group.handleLabel')} value={handle} onChangeText={setHandle} placeholder={tr('cm3.group.handlePlaceholder')} autoCapitalize="none" autoCorrect={false} testID="group-invite-handle" />
          <Text variant="caption" muted>{tr('cm3.group.inviteHint')}</Text>
          <Button label={tr('cm3.group.inviteSend')} icon="send" disabled={handle.trim().replace(/^@/, '').length < 3} onPress={async () => { if (await run('invite_to_group', { p_group: g.id, p_handle: handle }, tr('cm3.group.inviteSent'))) { setHandle(''); setInviting(false); } }} testID="group-invite-send" />
        </View>
      </Sheet>
    </Screen>
  );
}
