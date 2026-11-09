/**
 * Profil communautaire d'un membre : uniquement ce qu'il a choisi de rendre public (fonction serveur community_member).
 * Bloquer, débloquer ou signaler le membre. Un membre qui m'a bloquée apparaît « indisponible ».
 */
import { FollowButton } from '@/features/communitySocial';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
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
import { t as tr } from '@/i18n';

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
  const { ready: authReady } = useAuth(); // session pas encore restaurée : chargement, pas « introuvable »

  async function doBlock() {
    if (!(await confirm(tr('cm2.member.blockTitle', { handle }), tr('cm2.member.blockBody'), tr('cm2.member.block')))) return;
    try { await block.mutateAsync(handle); toast(tr('cm2.member.blocked')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function doUnblock() {
    const target = blocks.data?.find((b) => b.handle === handle);
    if (!target) return;
    try { await unblock.mutateAsync(target.userId); toast(tr('cm2.member.unblocked')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if ((q.isLoading || !authReady) && !m) return <Screen back title={tr('cm2.member.title')}><Skeleton kind="detail" rows={4} /></Screen>;
  if (q.isError && !m) return <Screen back title={tr('cm2.member.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;
  if (!m) return <Screen back title={tr('cm2.member.title')}><EmptyState icon="user-x" title={tr('cm2.member.notFound')} body={tr('cm2.member.notFoundBody')} /></Screen>;
  if (m.unavailable) return <Screen back title={`@${m.handle}`}><EmptyState icon="lock" title={tr('cm2.member.unavailable')} body={tr('cm2.member.unavailableBody')} /></Screen>;

  const actions = m.is_me
    ? <Button label={tr('cm2.member.edit')} size="sm" variant="secondary" icon="edit-3" onPress={() => router.push('/community/profile')} />
    : (
      <>
        {!m.blocked ? <FollowButton handle={m.handle} following={!!m.is_following} onNeedProfile={() => router.push('/community/profile')} /> : null}
        {m.blocked
          ? <Button label={tr('cm2.member.unblock')} size="sm" variant="secondary" icon="unlock" onPress={doUnblock} testID="member-unblock" />
          : <Button label={tr('cm2.member.block')} size="sm" variant="ghost" icon="slash" onPress={doBlock} testID="member-block" />}
        <Button label={tr('cm2.member.report')} size="sm" variant="ghost" icon="flag" onPress={() => setReporting(true)} testID="member-report" />
      </>
    );

  return (
    <Screen back title={`@${m.handle}`}>
      <View style={{ gap: spacing.md }} testID="member-profile">
        <ProfileHeader actions={actions} p={{
          pseudonym: m.pseudonym, handle: m.handle, bio: m.bio, journey_label: m.journey_label, avatar_path: m.avatar_path, avatar_preset: m.avatar_preset,
          joined: m.joined_month, posts: m.posts_count, comments: m.comments_count, photos: m.photos_count, minimal: m.visibility === 'minimal' && !m.is_me,
          accent: m.accent, banner: m.banner, about: m.about, badge: m.premium_badge,
        }} />
        {m.blocked ? <Banner tone="info">{tr('cm2.member.blockedBanner')}</Banner> : <ProfileTabs handle={m.handle} mine={false} />}
      </View>
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} handle={m.handle} />
    </Screen>
  );
}
