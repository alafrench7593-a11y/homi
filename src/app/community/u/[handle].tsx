/**
 * Profil communautaire d'un membre : uniquement ce qu'il a choisi de rendre public (fonction serveur community_member).
 * Bloquer, débloquer ou signaler le membre. Un membre qui m'a bloquée apparaît « indisponible ».
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Row } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { ReportSheet } from '@/features/community';
import { ProfileHeader, ProfileTabs } from '@/features/communityProfile';
import { useBlockMember, useCommunityMember, useMyBlocks, useUnblock } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { normalizeHandle } from '@/lib/domain/communityRules';
import { spacing } from '@/theme/tokens';

export default function MemberProfile() {
  const toast = useToast();
  const { handle: raw } = useLocalSearchParams<{ handle: string }>();
  const handle = normalizeHandle(String(raw ?? ''));
  const q = useCommunityMember(handle);
  const m = q.data;
  const blocks = useMyBlocks();
  const block = useBlockMember();
  const unblock = useUnblock();
  const [reporting, setReporting] = useState(false);

  async function doBlock() {
    if (!(await confirm(`Bloquer @${handle} ?`, 'Vous ne verrez plus ses publications ni ses commentaires, et cette personne ne pourra plus vous répondre.', 'Bloquer'))) return;
    try { await block.mutateAsync(handle); toast('Membre bloqué.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function doUnblock() {
    const target = blocks.data?.find((b) => b.handle === handle);
    if (!target) return;
    try { await unblock.mutateAsync(target.userId); toast('Membre débloqué.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (q.isLoading && !m) return <Screen back title="Profil"><Skeleton kind="detail" rows={4} /></Screen>;
  if (q.isError && !m) return <Screen back title="Profil"><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  if (!m) return <Screen back title="Profil"><EmptyState icon="user-x" title="Membre introuvable" body="Ce profil n’existe pas ou a été supprimé." /></Screen>;
  if (m.unavailable) return <Screen back title={`@${m.handle}`}><EmptyState icon="lock" title="Profil indisponible" body="Ce profil ne peut pas être affiché." /></Screen>;

  const actions = m.is_me
    ? <Button label="Modifier" size="sm" variant="secondary" icon="edit-3" onPress={() => router.push('/community/profile')} />
    : (
      <Row gap={6}>
        {m.blocked
          ? <Button label="Débloquer" size="sm" variant="secondary" icon="unlock" onPress={doUnblock} testID="member-unblock" />
          : <Button label="Bloquer" size="sm" variant="ghost" icon="slash" onPress={doBlock} testID="member-block" />}
        <Button label="Signaler" size="sm" variant="ghost" icon="flag" onPress={() => setReporting(true)} testID="member-report" />
      </Row>
    );

  return (
    <Screen back title={`@${m.handle}`}>
      <View style={{ gap: spacing.md }} testID="member-profile">
        <ProfileHeader actions={actions} p={{
          pseudonym: m.pseudonym, handle: m.handle, bio: m.bio, journey_label: m.journey_label, avatar_path: m.avatar_path, avatar_preset: m.avatar_preset,
          joined: m.joined_month, posts: m.posts_count, comments: m.comments_count, photos: m.photos_count, minimal: m.visibility === 'minimal' && !m.is_me,
        }} />
        {m.blocked ? <Banner tone="info">{'Vous avez bloqué ce membre : ses contenus sont masqués pour vous.'}</Banner> : <ProfileTabs handle={m.handle} mine={false} />}
      </View>
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} handle={m.handle} />
    </Screen>
  );
}
