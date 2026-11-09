/**
 * Communauté — composants partagés : avatars (illustrations originales ou photo), photos des publications,
 * carte de publication (réactions, commentaires, enregistrer, partager, menu modifier / supprimer / signaler / bloquer),
 * feuilles de signalement et de catégories. Identité graphique propre à Au fil de nous.
 */
import { useBounceOn } from '@/components/Motion';
import React, { useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { Card, Chip, haptic, Icon, type IconName, Row, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { useBlockAuthor, useBlockMember, useCommunityImage, useDeletePost, useReport, useReportMember, useToggleLike, useToggleSave } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { timeAgo } from '@/lib/domain/dates';
import { sensitiveHints } from '@/lib/domain/communityRules';
import { localizeGroupName } from '@/lib/domain/communitySocial';
import type { FeedPhoto, FeedPost, Forum, ReportReason } from '@/lib/types';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { BRAND } from '@/config/brand';
import { accentOf, FolderSheet, MentionText, PollView, PremiumBadge, Tag } from '@/features/communitySocial';
import { useCommunityAi, useFollowMember, usePinPost } from '@/lib/data/hooks-social';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { getLocale, t as tr } from '@/i18n';

/** Motifs de signalement ; `label` est traduit à la lecture (langue courante). */
export const REPORT_REASONS: { key: ReportReason; readonly label: string }[] = [
  { key: 'harassment', get label() { return tr('cm1.report.harassment'); } },
  { key: 'medical_misinformation', get label() { return tr('cm1.report.medicalMisinformation'); } },
  { key: 'danger', get label() { return tr('cm1.report.danger'); } },
  { key: 'personal_data', get label() { return tr('cm1.report.personalData'); } },
  { key: 'spam', get label() { return tr('cm1.report.spam'); } },
  { key: 'inappropriate', get label() { return tr('cm1.report.inappropriate'); } },
  { key: 'other', get label() { return tr('cm1.report.other'); } },
];

const SPACE_ICONS: Record<string, IconName> = {
  shield: 'shield', sparkles: 'star', fertility: 'activity', moon: 'moon', twins: 'copy', birth: 'sunrise', heart: 'heart', drop: 'droplet',
  bottle: 'coffee', sleep: 'cloud', food: 'pie-chart', baby: 'smile', sun: 'sun', users: 'users', map: 'map-pin', cycle: 'circle',
  health: 'activity', brain: 'compass', chat: 'message-circle',
};
export const spaceIcon = (f?: Pick<Forum, 'icon'> | null): IconName => SPACE_ICONS[f?.icon ?? ''] ?? 'message-square';
const HEALTH_SPACES = ['sante-developpement', 'neurodeveloppement', 'grossesse', 'post-partum', 'allaitement'];

/** Tuile de catégorie (suggestions). */
export function SpaceTile({ forum, selected, onPress }: { forum: Forum; selected?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={tr('cm1.space.a11y', { title: forum.title, description: forum.description })}
      onPress={onPress}
      style={{ width: 168, minHeight: 112, padding: spacing.sm, gap: 4, borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? t.colors.primary : t.colors.border, backgroundColor: t.colors.surface }}
    >
      <Icon name={spaceIcon(forum)} size={20} color={t.colors.primary} />
      <Text weight="bold">{forum.title}</Text>
      <Text variant="caption" muted>{forum.description}</Text>
    </Tappable>
  );
}

// ─── Avatars ───────────────────────────────────────────────────────────────────────────────────────

/** Illustrations originales : un fond doux et un motif simple (aucun visage réel, aucune marque). */
const PRESETS: Record<string, { bg: [string, string]; ink: string; d: string }> = {
  moon: { bg: ['#E7E1FF', '#C9BCFA'], ink: '#5B47B8', d: 'M38 14a18 18 0 1 0 12 30A16 16 0 0 1 38 14z' },
  sun: { bg: ['#FFE9C7', '#FFC98F'], ink: '#C86A1A', d: 'M32 22a10 10 0 1 1 0 20a10 10 0 1 1 0-20zM32 8v7M32 49v7M8 32h7M49 32h7M15 15l5 5M44 44l5 5M49 15l-5 5M20 44l-5 5' },
  leaf: { bg: ['#DDF3E4', '#B7E3C4'], ink: '#2E7D4F', d: 'M16 48C16 26 30 14 50 14c0 20-12 34-34 34zM16 48l20-20' },
  cloud: { bg: ['#E2F0FB', '#BFDDF5'], ink: '#2F6E9E', d: 'M20 44a9 9 0 0 1 0-18a12 12 0 0 1 23-3a10 10 0 0 1 2 21z' },
  star: { bg: ['#FFF2C9', '#FFDF85'], ink: '#B07A00', d: 'M32 12l6 13l14 2l-10 10l3 14l-13-7l-13 7l3-14l-10-10l14-2z' },
  heart: { bg: ['#FFE0E8', '#FFB8CB'], ink: '#C2416E', d: 'M32 50S12 38 12 25a10 10 0 0 1 20-3a10 10 0 0 1 20 3c0 13-20 25-20 25z' },
  wave: { bg: ['#DDF5F4', '#AEE4E1'], ink: '#1F7C78', d: 'M10 30c6-6 11-6 16 0s10 6 16 0s10-6 16 0M10 42c6-6 11-6 16 0s10 6 16 0s10-6 16 0' },
  flower: { bg: ['#FBE3F2', '#F2C0E0'], ink: '#A23C84', d: 'M32 24a6 6 0 1 1 0 12a6 6 0 1 1 0-12zM32 12a7 7 0 0 1 0 12M32 36a7 7 0 0 1 0 12M20 30a7 7 0 0 1 12 0M32 30a7 7 0 0 1 12 0' },
  bird: { bg: ['#E6EEFF', '#C3D3FF'], ink: '#3550A8', d: 'M12 38c10 2 18-2 22-10c4 6 10 8 18 6c-6 8-16 12-26 10c-6-1-10-3-14-6zM40 24l6-4' },
  whale: { bg: ['#DCEBF7', '#B3D2EC'], ink: '#24537D', d: 'M10 34c4-10 20-14 32-8c6 3 10 2 12-2c2 8-4 16-14 18c-12 3-26 0-30-8zM40 22c0-4 2-6 4-8' },
  bear: { bg: ['#F3E6DA', '#E2C8B0'], ink: '#7A5233', d: 'M32 22a14 14 0 1 1 0 28a14 14 0 1 1 0-28zM20 22a5 5 0 1 1 0-1M44 22a5 5 0 1 1 0-1M28 36h1M35 36h1M30 42q2 2 4 0' },
  rainbow: { bg: ['#FFE8E0', '#FFD0C2'], ink: '#B4533A', d: 'M12 46a20 20 0 0 1 40 0M18 46a14 14 0 0 1 28 0M24 46a8 8 0 0 1 16 0' },
};

export function PresetAvatar({ preset, size = 44 }: { preset: string; size?: number }) {
  const p = PRESETS[preset] ?? PRESETS.moon;
  const gid = `av-${preset}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={p.bg[0]} /><Stop offset="1" stopColor={p.bg[1]} /></SvgGradient>
      </Defs>
      <Circle cx="32" cy="32" r="32" fill={`url(#${gid})`} />
      <Path d={p.d} fill={['wave', 'rainbow', 'sun', 'bird', 'flower', 'bear'].includes(preset) ? 'none' : p.ink} stroke={p.ink} strokeWidth={['wave', 'rainbow', 'sun', 'bird', 'flower', 'bear'].includes(preset) ? 3.2 : 0} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Photo du stockage privé (adresse temporaire signée). */
export function CommunityImage({ path, style, accessibilityLabel }: { path: string; style?: object; accessibilityLabel?: string }) {
  const t = useTheme();
  const { data: uri } = useCommunityImage(path);
  if (!uri) return <View style={[{ backgroundColor: t.colors.surfaceAlt }, style]} />;
  return <Image source={{ uri }} style={style as never} resizeMode="cover" accessibilityLabel={accessibilityLabel} accessibilityIgnoresInvertColors />;
}

export function Avatar({ path, preset, size = 44, anonymous, label }: { path?: string | null; preset?: string | null; size?: number; anonymous?: boolean; label?: string }) {
  const t = useTheme();
  if (anonymous || (!path && !preset)) {
    return (
      <View accessibilityLabel={label} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt, borderWidth: 1, borderColor: t.colors.border }}>
        <Icon name={anonymous ? 'eye-off' : 'user'} size={size * 0.45} color={t.colors.textMuted} />
      </View>
    );
  }
  if (path) return <CommunityImage path={path} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={label} />;
  return <View accessibilityLabel={label}><PresetAvatar preset={preset!} size={size} /></View>;
}

// ─── Photos d'une publication ──────────────────────────────────────────────────────────────────────

export function PhotoGrid({ photos, onOpen }: { photos: FeedPhoto[]; onOpen: (index: number) => void }) {
  if (!photos.length) return null;
  const tile = (ph: FeedPhoto, i: number, style: object) => (
    <Tappable key={ph.path} accessibilityRole="imagebutton" accessibilityLabel={tr('cm1.photo.enlarge', { index: i + 1, total: photos.length })} onPress={() => onOpen(i)} style={[{ overflow: 'hidden', borderRadius: radius.md }, style]}>
      <CommunityImage path={ph.path} style={{ width: '100%', height: '100%' }} />
    </Tappable>
  );
  const ratio = photos[0].width && photos[0].height ? Math.min(1.6, Math.max(0.75, photos[0].width / photos[0].height)) : 4 / 3;
  if (photos.length === 1) return <View style={{ marginTop: spacing.sm }}>{tile(photos[0], 0, { width: '100%', aspectRatio: ratio })}</View>;
  return (
    <View style={{ marginTop: spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} testID="post-photos">
      {photos.map((ph, i) => tile(ph, i, { width: photos.length === 3 && i === 0 ? '100%' : '48.6%', aspectRatio: photos.length === 3 && i === 0 ? 16 / 9 : 1 }))}
    </View>
  );
}

export function PhotoViewer({ photos, index, onClose }: { photos: FeedPhoto[]; index: number | null; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const [i, setI] = useState(index ?? 0);
  React.useEffect(() => { if (index != null) setI(index); }, [index]);
  if (index == null || !photos[i]) return null;
  const ph = photos[i];
  const ratio = ph.width && ph.height ? ph.width / ph.height : 4 / 3;
  const w = Math.min(width, 900);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <Pressable accessibilityRole="button" accessibilityLabel={tr('cm1.photo.close')} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(8,6,12,0.94)', alignItems: 'center', justifyContent: 'center' }}>
        <CommunityImage path={ph.path} style={{ width: w, height: Math.min(height * 0.8, w / ratio) }} accessibilityLabel={tr('cm1.photo.position', { index: i + 1, total: photos.length })} />
        {photos.length > 1 ? (
          <Row style={{ marginTop: spacing.md }}>
            <Chip label={tr('cm1.photo.previous')} icon="chevron-left" onPress={() => setI((x) => (x + photos.length - 1) % photos.length)} />
            <Text color="#FFFFFF">{`${i + 1} / ${photos.length}`}</Text>
            <Chip label={tr('cm1.photo.next')} icon="chevron-right" onPress={() => setI((x) => (x + 1) % photos.length)} />
          </Row>
        ) : null}
      </Pressable>
    </Modal>
  );
}

// ─── Signaler / bloquer ────────────────────────────────────────────────────────────────────────────

export function ReportSheet({ visible, onClose, postId, commentId, handle, anonymous }: { visible: boolean; onClose: () => void; postId?: string; commentId?: string; handle?: string | null; anonymous?: boolean }) {
  const toast = useToast();
  const reportM = useReport();
  const reportMember = useReportMember();
  const blockM = useBlockAuthor();
  const blockMember = useBlockMember();
  const pending = reportM.isPending || blockM.isPending || reportMember.isPending || blockMember.isPending;
  const memberOnly = !postId && !commentId && !!handle;
  async function report(reason: ReportReason) {
    if (pending) return;
    try {
      if (memberOnly) await reportMember.mutateAsync({ handle: handle!, reason });
      else await reportM.mutateAsync({ postId, commentId, reason });
      toast(tr('cm1.report.thanks'));
      onClose();
    } catch (e) {
      toast(friendlyError(e, tr('cm1.report.error')), 'error');
    }
  }
  async function block() {
    if (pending) return;
    if (!(await confirm(tr('cm1.report.blockConfirmTitle'), tr('cm1.report.blockConfirmBody'), tr('cm1.report.blockConfirm')))) return;
    try {
      if (memberOnly) await blockMember.mutateAsync(handle!);
      else await blockM.mutateAsync({ postId, commentId });
      toast(tr('cm1.report.blocked'));
      onClose();
    } catch (e) {
      toast(friendlyError(e, tr('cm1.report.blockError')), 'error');
    }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={memberOnly ? tr('cm1.report.titleMember') : commentId ? tr('cm1.report.titleComment') : tr('cm1.report.titlePost')}>
      <Text variant="small" muted>{tr('cm1.report.why')}</Text>
      {REPORT_REASONS.map((r) => (
        <Tappable key={r.key} accessibilityRole="button" accessibilityState={{ disabled: pending }} disabled={pending} onPress={() => report(r.key)} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', opacity: pending ? 0.5 : 1 }} testID={`report-${r.key}`}>
          <Text>{r.label}</Text>
        </Tappable>
      ))}
      {/* Publication anonyme : pas de blocage (il révélerait l'identité de l'autrice) */}
      {anonymous ? null : <Chip label={tr('cm1.report.block')} icon="slash" onPress={block} />}
      <Text variant="caption" muted>{tr('cm1.report.emergency')}</Text>
    </Sheet>
  );
}

// ─── Partage d'un lien interne ─────────────────────────────────────────────────────────────────────

export function postLink(id: string) {
  return Linking.createURL(`/community/post/${id}`);
}
export async function sharePost(post: Pick<FeedPost, 'id' | 'title' | 'body'>) {
  const excerpt = (post.title ?? post.body).slice(0, 80);
  await Share.share({ message: tr('cm1.share.message', { excerpt: `${excerpt}${(post.title ?? post.body).length > 80 ? '…' : ''}`, brand: BRAND.name, url: postLink(post.id) }) });
}

// ─── Carte de publication ──────────────────────────────────────────────────────────────────────────

function ActionButton({ icon, label, count, active, onPress, testID, activeColor }: { icon: IconName; label: string; count?: number; active?: boolean; onPress: () => void; testID?: string; activeColor?: string }) {
  const t = useTheme();
  // « J'aime », « Enregistrer » : petit rebond de l'icône quand l'état réel passe à actif
  const bounce = useBounceOn(!!active);
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} hitSlop={4} onPress={onPress} testID={testID}
      style={({ pressed }) => ({ minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: active ? (activeColor ?? t.colors.primary) + '1F' : pressed ? t.colors.surfaceAlt : 'transparent' })}>
      <Animated.View style={bounce}><Icon name={icon} size={18} color={active ? (activeColor ?? t.colors.primary) : t.colors.textMuted} /></Animated.View>
      {count != null ? <Text variant="small" weight="medium" color={active ? (activeColor ?? t.colors.primary) : t.colors.textMuted}>{String(count)}</Text> : null}
    </Tappable>
  );
}

export function PostCard({ post, forum, full, onCommentPress, canPin }: { post: FeedPost; forum?: Pick<Forum, 'title' | 'slug' | 'icon'> | null; full?: boolean; onCommentPress?: () => void; canPin?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const reduce = useReduceMotion();
  const like = useToggleLike();
  const save = useToggleSave();
  const del = useDeletePost();
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [folders, setFolders] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const follow = useFollowMember();
  const pin = usePinPost();
  const ai = useCommunityAi();
  const aiAccess = usePremiumAccess('community_ai');
  const accent = post.anonymous ? null : accentOf(post.author_accent);
  const author = post.anonymous ? (post.is_mine ? tr('cm1.post.anonymousMine') : tr('cm1.post.anonymous')) : post.pseudonym ?? tr('cm1.post.member');
  const openPost = () => router.push(`/community/post/${post.id}`);
  const openProfile = () => { if (post.author_handle) router.push(`/community/u/${post.author_handle}` as never); };
  const medical = post.kind === 'testimony' || HEALTH_SPACES.includes(post.forum_slug ?? forum?.slug ?? '') || sensitiveHints(post.body).some((h) => h.key === 'medical');

  async function toggleSave() {
    if (save.isPending) return;
    try {
      const saved = await save.mutateAsync(post);
      if (!reduce) haptic('light');
      toast(saved ? tr('cm1.post.saved') : tr('cm1.post.unsaved'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  function toggleLike() {
    if (like.isPending) return;
    if (!post.liked && !reduce) haptic('light');
    like.mutate(post, { onError: (e) => toast(friendlyError(e), 'error') });
  }
  async function toggleFollow() {
    if (!post.author_handle) return;
    setMenu(false);
    try {
      await follow.mutateAsync({ handle: post.author_handle, follow: !post.following_author });
      toast(post.following_author ? tr('cm1.post.unfollowed', { handle: post.author_handle }) : tr('cm1.post.followed', { handle: post.author_handle }));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function togglePin() {
    setMenu(false);
    try { await pin.mutateAsync({ postId: post.id, pin: !post.pinned_at }); toast(post.pinned_at ? tr('cm1.post.unpinned') : tr('cm1.post.pinned')); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function translate() {
    setMenu(false);
    if (!aiAccess.require()) return;
    try {
      // Traduction à la demande (jamais automatique) : vers la langue de l'application ; en français, inchangé (vers l'anglais)
      const lang = getLocale();
      const r = await ai.mutateAsync({ action: 'translate', postId: post.id, target: lang === 'fr' ? 'en' : (lang as 'en' | 'es' | 'de' | 'it') });
      if ('text' in r) setTranslated(r.text); else toast(('message' in r && r.message) || tr('cm1.post.translateUnavailable'), 'error');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    setMenu(false);
    if (!(await confirm(tr('cm1.post.deleteConfirmTitle'), tr('cm1.post.deleteConfirmBody'), tr('cm1.post.deleteConfirm')))) return;
    try {
      await del.mutateAsync(post);
      toast(tr('cm1.post.deleted'));
      if (full) (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'));
    } catch (e) { toast(friendlyError(e, tr('cm1.post.deleteError')), 'error'); }
  }

  return (
    <Card onPress={full ? undefined : openPost} accessibilityLabel={post.title ? tr('cm1.post.a11yTitled', { author, title: post.title }) : tr('cm1.post.a11y', { author })} testID={full ? 'post-full' : `post-${post.id}`}>
      <Row style={{ alignItems: 'center' }}>
        <Tappable accessibilityRole={post.author_handle ? 'button' : 'image'} accessibilityLabel={post.author_handle ? tr('cm1.post.viewProfileOf', { name: author }) : author} disabled={!post.author_handle} onPress={openProfile} testID="post-author-avatar">
          <View style={accent ? { borderRadius: 22, borderWidth: 2, borderColor: accent, padding: 1 } : undefined}>
            <Avatar path={post.avatar_path} preset={post.avatar_preset} anonymous={post.anonymous} size={accent ? 34 : 38} />
          </View>
        </Tappable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tappable accessibilityRole={post.author_handle ? 'link' : 'text'} disabled={!post.author_handle} onPress={openProfile} testID="post-author">
            {/* Pseudonyme complet sur le profil du membre */}
            <Row gap={6} style={{ flexWrap: 'nowrap' }}>
              <Text weight="bold" numberOfLines={1} intentionalTruncation style={{ flexShrink: 1 }}>{author}</Text>
              {post.author_badge && !post.anonymous ? <PremiumBadge /> : null}
            </Row>
          </Tappable>
          <Text variant="caption" muted numberOfLines={2}>
            {[post.author_handle ? `@${post.author_handle}` : null, timeAgo(post.created_at), post.edited_at ? tr('cm1.post.edited') : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('cm1.post.moreActions')} hitSlop={{ top: 0, bottom: 0, left: 6, right: 6 }} onPress={() => setMenu(true)} style={{ width: 34, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', marginRight: -6 }} testID="post-menu">
          <Icon name="more-horizontal" size={20} color={t.colors.textMuted} />
        </Tappable>
      </Row>
      <Row wrap gap={6} style={{ marginTop: 6 }}>
        {post.pinned_at ? <Tag icon="bookmark" label={tr('cm1.post.pinnedTag')} color={t.colors.primary} /> : null}
        {post.group_name ? <Tag icon={post.group_kind === 'private' ? 'lock' : 'users'} label={localizeGroupName(post.group_name)} color={t.colors.lavender} /> : null}
        {post.poll ? <Tag icon="bar-chart-2" label={tr('cm1.post.pollTag')} /> : null}
        {forum ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: t.colors.primary + '14' }}><Icon name={spaceIcon(forum)} size={12} color={t.colors.primary} /><Text variant="caption" color={t.colors.primary}>{forum.title}</Text></View> : null}
        {post.kind === 'testimony' ? <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: t.colors.lavender + '33' }}><Text variant="caption">{tr('cm1.post.testimonyTag')}</Text></View> : null}
        {post.status !== 'visible' ? <Text variant="caption" color={t.colors.gold}>{post.status === 'pending_review' ? tr('cm1.post.statusPending') : post.status === 'hidden' ? tr('cm1.post.statusHidden') : tr('cm1.post.statusRemoved')}</Text> : null}
      </Row>
      {post.title ? <Text weight="bold" style={{ marginTop: 6 }}>{post.title}</Text> : null}
      <MentionText text={post.body} numberOfLines={full ? undefined : 5} style={{ marginTop: 4 }} />
      {translated ? <View style={{ marginTop: 6, padding: spacing.sm, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }} testID="post-translation"><Text variant="caption" muted>{tr('cm1.post.autoTranslation')}</Text><Text variant="small">{translated}</Text></View> : null}
      <PollView post={post} />
      <PhotoGrid photos={post.photos ?? []} onOpen={(i) => setViewer(i)} />
      {post.area_label ? <Row gap={4} style={{ marginTop: 6 }}><Icon name="map-pin" size={12} color={t.colors.textMuted} /><Text variant="caption" muted>{post.area_label}</Text></Row> : null}
      {medical && full ? <Text variant="caption" muted style={{ marginTop: 6 }} testID="post-testimony-note">{tr('cm1.post.testimonyNote')}</Text> : null}
      <Row style={{ marginTop: spacing.xs }} gap={2}>
        <ActionButton icon="heart" label={post.liked ? tr('cm1.post.unlike', { count: post.like_count }) : tr('cm1.post.like', { count: post.like_count })} count={post.like_count} active={post.liked} onPress={toggleLike} testID="post-like" activeColor={t.colors.heart} />
        <ActionButton icon="message-circle" label={tr('cm1.post.comments', { count: post.comment_count })} count={post.comment_count} onPress={onCommentPress ?? openPost} testID="post-comments" />
        <View style={{ flex: 1 }} />
        <ActionButton icon="bookmark" label={post.saved ? tr('cm1.post.unsave') : tr('cm1.post.save')} active={post.saved} onPress={toggleSave} testID="post-save" />
        <ActionButton icon="share-2" label={tr('cm1.post.shareLink')} onPress={() => sharePost(post).catch(() => toast(tr('cm1.post.shareUnavailable'), 'error'))} testID="post-share" />
      </Row>
      <Sheet visible={menu} onClose={() => setMenu(false)} title={tr('cm1.post.menuTitle')}>
        {post.saved ? <Chip label={tr('cm1.post.moveToFolder')} icon="folder" onPress={() => { setMenu(false); setFolders(true); }} testID="post-folder" /> : null}
        {canPin ? <Chip label={post.pinned_at ? tr('cm1.post.unpin') : tr('cm1.post.pin')} icon="bookmark" onPress={() => void togglePin()} testID="post-pin" /> : null}
        {full ? <Chip label={tr('cm1.post.translate')} icon="globe" onPress={() => void translate()} testID="post-translate" /> : null}
        {post.is_mine ? (
          <>
            <Chip label={tr('cm1.post.edit')} icon="edit-3" onPress={() => { setMenu(false); router.push({ pathname: '/community/new', params: { edit: post.id } }); }} />
            <Chip label={tr('cm1.post.deleteForever')} icon="trash-2" onPress={remove} />
          </>
        ) : (
          <>
            {post.author_handle ? <Chip label={tr('cm1.post.viewProfile')} icon="user" onPress={() => { setMenu(false); openProfile(); }} /> : null}
            {post.author_handle ? <Chip label={post.following_author ? tr('cm1.post.unfollowHandle', { handle: post.author_handle }) : tr('cm1.post.followHandle', { handle: post.author_handle })} icon={post.following_author ? 'user-minus' : 'user-plus'} onPress={() => void toggleFollow()} testID="post-follow" /> : null}
            <Chip label={tr('cm1.post.reportOrBlock')} icon="flag" onPress={() => { setMenu(false); setReporting(true); }} />
          </>
        )}
        <Chip label={tr('cm1.post.shareLink')} icon="share-2" onPress={() => { setMenu(false); sharePost(post).catch(() => toast(tr('cm1.post.shareUnavailable'), 'error')); }} />
      </Sheet>
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} postId={post.id} anonymous={!!post.anonymous} />
      {folders ? <FolderSheet visible={folders} onClose={() => setFolders(false)} post={post} /> : null}
      <PhotoViewer photos={post.photos ?? []} index={viewer} onClose={() => setViewer(null)} />
    </Card>
  );
}

/** Toutes les catégories, avec leur description (évite de surcharger l'écran). */
export function CategorySheet({ visible, onClose, forums, selected, onSelect }: { visible: boolean; onClose: () => void; forums: Forum[]; selected: string | null; onSelect: (id: string | null) => void }) {
  const t = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('cm1.categories.title')}>
      <ScrollView>
        {[...forums].sort((a, b) => a.position - b.position).map((f) => (
          <Tappable key={f.id} accessibilityRole="button" accessibilityState={{ selected: selected === f.id }} onPress={() => { onSelect(f.id); onClose(); }} testID={`category-${f.slug}`}
            style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs, minHeight: MIN_TOUCH, alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary + '14' }}><Icon name={spaceIcon(f)} size={18} color={t.colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text weight={selected === f.id ? 'bold' : 'medium'}>{f.title}</Text>
              <Text variant="caption" muted>{f.description}</Text>
            </View>
            {selected === f.id ? <Icon name="check" size={18} color={t.colors.primary} /> : null}
          </Tappable>
        ))}
      </ScrollView>
    </Sheet>
  );
}

