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
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const KIND = { theme: 'Groupe thématique', cohort: 'Groupe par mois', private: 'Groupe privé · sur invitation' } as const;

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

  if (q.isLoading && !g) return <Screen back title="Groupe"><Skeleton kind="card" rows={3} /></Screen>;
  if (q.isError && !g) return <Screen back title="Groupe"><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  if (!g) return <Screen back title="Groupe"><EmptyState icon="lock" title="Groupe introuvable" body="Il a peut-être été supprimé, ou il est réservé à ses membres." /></Screen>;

  const invitation = g.pending_invitation;
  const posts = pinnedFirst(feed.data ?? []);
  const forumOf = (fid: string) => forums.find((f) => f.id === fid) ?? null;

  return (
    <Screen back title={g.name} subtitle={`${KIND[g.kind]} · ${g.member_count} membre${g.member_count > 1 ? 's' : ''}`}
      right={g.is_member ? <IconButton icon="edit-3" label="Publier dans le groupe" onPress={() => router.push({ pathname: '/community/new', params: { group: g.id } })} /> : undefined}>
      <Card testID="group-header">
        <Row><Icon name={(g.icon as IconName) ?? 'users'} size={20} color={g.kind === 'private' ? t.colors.lavender : t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{g.name}</Text></Row>
        {g.description ? <Text variant="small" muted style={{ marginTop: 4 }}>{g.description}</Text> : null}
        {invitation && !g.is_member ? (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }} testID="group-invitation">
            <Text weight="medium">Vous êtes invité·e dans ce groupe privé.</Text>
            <Row gap={6}>
              <Button label="Accepter" icon="check" size="sm" onPress={() => void run('respond_group_invitation', { p_invitation: invitation, p_accept: true }, 'Bienvenue dans le groupe.')} testID="group-accept" />
              <Button label="Refuser" size="sm" variant="ghost" onPress={async () => { if (await run('respond_group_invitation', { p_invitation: invitation, p_accept: false }, 'Invitation refusée.')) router.back(); }} testID="group-decline" />
            </Row>
          </View>
        ) : g.is_member ? (
          <Row gap={6} style={{ marginTop: spacing.sm }}>
            <Button label="Publier dans le groupe" icon="edit-3" size="sm" onPress={() => router.push({ pathname: '/community/new', params: { group: g.id } })} testID="group-publish" />
            {!g.is_owner ? <Button label="Quitter" size="sm" variant="ghost" onPress={async () => { if (await confirm('Quitter ce groupe ?', g.kind === 'private' ? 'Il faudra une nouvelle invitation pour revenir.' : 'Vous pourrez le rejoindre à nouveau.', 'Quitter')) void run('leave_group', { p_group: g.id }, 'Vous avez quitté le groupe.'); }} testID="group-leave" /> : null}
          </Row>
        ) : g.kind !== 'private' ? (
          <Button label="Rejoindre le groupe" icon="user-plus" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} onPress={() => (me ? void run('join_group', { p_group: g.id }, 'Vous avez rejoint le groupe.') : router.push({ pathname: '/community/profile', params: { next: 'groups' } }))} testID="group-join" />
        ) : null}
      </Card>

      {g.kind === 'private' && g.is_member && g.members ? (
        <>
          <SectionTitle title="Membres" />
          <Card testID="group-members">
            {g.members.map((m) => (
              <MemberRow key={m.handle} m={m} right={g.is_owner && m.role !== 'owner' ? (
                <IconButton icon="user-x" label={`Retirer @${m.handle}`} onPress={async () => { if (await confirm(`Retirer @${m.handle} du groupe ?`, 'La personne ne verra plus les publications du groupe.', 'Retirer')) void run('remove_group_member', { p_group: g.id, p_handle: m.handle }, 'Membre retiré.'); }} />
              ) : null} />
            ))}
            {g.is_owner ? (
              <Row gap={6} style={{ marginTop: spacing.xs }}>
                <Button label="Inviter un membre" icon="user-plus" size="sm" onPress={() => (g.can_invite ? setInviting(true) : access.showPreview())} testID="group-invite" />
                {!g.can_invite ? <PremiumBadge /> : null}
              </Row>
            ) : null}
            {g.is_owner && g.invitations?.length ? <Text variant="caption" muted style={{ marginTop: 6 }}>{`Invitations en attente : ${g.invitations.map((i) => `@${i.handle}`).join(', ')}`}</Text> : null}
          </Card>
          {g.is_owner && g.can_invite === false ? (
            <Banner tone="info" title="Votre groupe continue de fonctionner">Votre abonnement a pris fin : les membres échangent toujours ; seules les nouvelles invitations sont en pause.</Banner>
          ) : null}
        </>
      ) : null}

      <SectionTitle title="Publications" />
      {feed.isLoading && !feed.data ? <Skeleton kind="card" rows={2} /> : !g.is_member && g.kind === 'private' ? (
        <EmptyState icon="lock" title="Contenu réservé aux membres" body="Acceptez l’invitation pour lire et publier." />
      ) : posts.length ? (
        <View style={{ gap: spacing.sm }}>{posts.map((p) => <PostCard key={p.id} post={p} forum={forumOf(p.forum_id)} canPin={g.is_owner && g.kind === 'private'} />)}</View>
      ) : <EmptyState icon="message-square" title="Aucune publication pour l’instant" body={g.is_member ? 'Lancez la première discussion du groupe.' : 'Rejoignez le groupe pour lancer la discussion.'} />}

      {g.is_owner && g.kind === 'private' ? (
        <Button label="Supprimer le groupe" icon="trash-2" variant="ghost" onPress={async () => {
          if (!(await confirm('Supprimer définitivement ce groupe ?', 'Ses publications et réponses seront supprimées pour tous les membres. Cette action est irréversible.', 'Supprimer'))) return;
          if (await run('delete_private_group', { p_group: g.id }, 'Groupe supprimé.')) router.replace('/community/groups' as never);
        }} testID="group-delete" />
      ) : null}

      <Sheet visible={inviting} onClose={() => setInviting(false)} title="Inviter un membre">
        <View style={{ gap: spacing.sm }}>
          <Field label="Identifiant du membre" value={handle} onChangeText={setHandle} placeholder="@pseudo" autoCapitalize="none" autoCorrect={false} testID="group-invite-handle" />
          <Text variant="caption" muted>La personne reçoit une invitation et choisit d’accepter ou non.</Text>
          <Button label="Envoyer l’invitation" icon="send" disabled={handle.trim().replace(/^@/, '').length < 3} onPress={async () => { if (await run('invite_to_group', { p_group: g.id, p_handle: handle }, 'Invitation envoyée.')) { setHandle(''); setInviting(false); } }} testID="group-invite-send" />
        </View>
      </Sheet>
    </Screen>
  );
}
