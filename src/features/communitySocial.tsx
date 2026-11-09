/**
 * Composants du mini-réseau social : texte avec mentions, sondage, badge Premium discret, bouton « Suivre »,
 * ligne de membre, carte de groupe, onglets de fil, filtres avancés (Premium), dossiers (Premium),
 * résumé et traduction d'une discussion (Premium, IA côté serveur).
 * Aucune mise en avant de popularité : pas de classement, pas de nombre d'abonné·es public.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Chip, Field, haptic, Icon, type IconName, Row, Text } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { Avatar, spaceIcon } from '@/features/community';
import { useActivePregnancy, usePremium, useRows, useTrackedChildren } from '@/lib/data/hooks';
import { useSpaces } from '@/lib/data/hooks-community';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { type AdvancedFilters, useCommunityAi, useFolderAction, useFollowMember, useForumSubscriptions, useSavedFolders, useVotePoll } from '@/lib/data/hooks-social';
import { localizeGroupName, personalizedOrder, pollPercent, splitMentions, type ProfileAccent, type ProfileBanner } from '@/lib/domain/communitySocial';
import { isPremiumRequired } from '@/lib/premium/features';
import type { CommunityGroup, FeedPost, Forum, MemberCard } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, radius, SKY_GRADIENTS, spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';

/** Couleurs d'accent : reprises des encres déjà utilisées dans l'application (aucune couleur existante modifiée). */
export const ACCENT_COLOR: Record<ProfileAccent, string> = { rose: '#C2416E', lavande: '#7A5CE0', menthe: '#3C8C55', peche: '#D2693C', ciel: '#3A78B5', sable: '#B7791F' };
export const BANNER_COLORS: Record<ProfileBanner, [string, string, string]> = {
  aube: SKY_GRADIENTS.dawn, nuit: SKY_GRADIENTS.dusk, prairie: ['#EAF7EC', '#E6F6F4', '#FFF4E0'], ocean: ['#E9F4FF', '#EAEDFF', '#E6F6F4'], nacre: NACRE,
};
export const accentOf = (a?: string | null) => (a && a in ACCENT_COLOR ? ACCENT_COLOR[a as ProfileAccent] : null);

/** Texte dont les mentions @identifiant ouvrent le profil du membre. */
export function MentionText({ text, numberOfLines, style }: { text: string; numberOfLines?: number; style?: object }) {
  const t = useTheme();
  const parts = splitMentions(text);
  return (
    <Text numberOfLines={numberOfLines} intentionalTruncation={!!numberOfLines} style={style}>
      {parts.map((p, i) => (p.handle
        ? <Text key={i} weight="medium" color={t.colors.primary} accessibilityRole="link" onPress={() => router.push(`/community/u/${p.handle}` as never)}>{p.text}</Text>
        : <React.Fragment key={i}>{p.text}</React.Fragment>))}
    </Text>
  );
}

/** Badge Premium : discret, choisi par la personne. */
export function PremiumBadge() {
  const t = useTheme();
  return (
    <View accessibilityLabel={tr('cm1.social.premiumA11y')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: t.colors.gold + '22' }} testID="premium-badge">
      <Icon name="star" size={10} color={t.colors.gold} />
      <Text variant="caption" color={t.colors.gold} style={{ fontSize: 11, lineHeight: 14 }}>{tr('cm1.social.premium')}</Text>
    </View>
  );
}

/** Petite étiquette (épinglée, groupe, sondage…). */
export function Tag({ icon, label, color }: { icon: IconName; label: string; color?: string }) {
  const t = useTheme();
  const c = color ?? t.colors.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: c + '1A', maxWidth: '100%' }}>
      <Icon name={icon} size={12} color={c} />
      <Text variant="caption" color={c} numberOfLines={1} intentionalTruncation style={{ flexShrink: 1 }}>{label}</Text>
    </View>
  );
}

// ─── Sondage ───────────────────────────────────────────────────────────────────────────────────────

export function PollView({ post }: { post: Pick<FeedPost, 'id' | 'poll' | 'group_id'> }) {
  const t = useTheme();
  const toast = useToast();
  const vote = useVotePoll();
  const poll = post.poll;
  const [picked, setPicked] = useState<string[]>([]);
  if (!poll) return null;
  const voted = poll.options.some((o) => o.mine);
  const showResults = voted || poll.closed;
  async function send(ids: string[]) {
    try { await vote.mutateAsync({ postId: post.id, options: ids }); haptic('light'); setPicked([]); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <View style={{ gap: 6, marginTop: spacing.xs }} testID="poll">
      {poll.options.map((o) => {
        const pct = pollPercent(o.votes, poll.total);
        const selected = picked.includes(o.id) || (showResults && o.mine);
        return (
          <Tappable key={o.id} accessibilityRole={poll.multiple ? 'checkbox' : 'radio'} accessibilityState={{ checked: selected, disabled: poll.closed }}
            accessibilityLabel={`${o.label}${showResults ? `, ${tr('cm1.poll.pct', { pct })}` : ''}`} disabled={poll.closed || vote.isPending}
            onPress={() => {
              if (poll.multiple) setPicked((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id]));
              else void send(o.mine ? [] : [o.id]);
            }}
            testID={`poll-option-${o.id}`}
            style={{ minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1, borderColor: selected ? t.colors.primary : t.colors.border, overflow: 'hidden', justifyContent: 'center' }}>
            {showResults ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: t.colors.primary + (o.mine ? '2E' : '14') }} /> : null}
            <Row style={{ paddingHorizontal: spacing.sm }}>
              {selected ? <Icon name="check" size={16} color={t.colors.primary} /> : null}
              <Text style={{ flex: 1 }} weight={selected ? 'bold' : 'regular'}>{o.label}</Text>
              {showResults ? <Text variant="small" weight="bold">{tr('cm1.poll.pct', { pct })}</Text> : null}
            </Row>
          </Tappable>
        );
      })}
      {poll.multiple && !poll.closed && picked.length ? <Button label={tr('cm1.poll.vote')} size="sm" onPress={() => void send(picked)} loading={vote.isPending} testID="poll-vote" /> : null}
      <Text variant="caption" muted>
        {[tr('cm1.poll.participations', { count: poll.total }), poll.multiple ? tr('cm1.poll.multiple') : null, poll.closed ? tr('cm1.poll.closed') : poll.closes_at ? tr('cm1.poll.until', { date: new Date(poll.closes_at).toLocaleDateString(localeTag(), { day: 'numeric', month: 'long' }) }) : null, tr('cm1.poll.anonymous')].filter(Boolean).join(' · ')}
      </Text>
    </View>
  );
}

// ─── Suivre ────────────────────────────────────────────────────────────────────────────────────────

export function FollowButton({ handle, following, size = 'sm', onNeedProfile }: { handle: string; following: boolean; size?: 'sm' | 'md'; onNeedProfile?: () => void }) {
  const toast = useToast();
  const follow = useFollowMember();
  return (
    <Button label={following ? tr('cm1.follow.following') : tr('cm1.follow.follow')} icon={following ? 'check' : 'user-plus'} size={size} variant={following ? 'secondary' : 'primary'} loading={follow.isPending}
      accessibilityLabel={following ? tr('cm1.post.unfollowHandle', { handle }) : tr('cm1.post.followHandle', { handle })}
      onPress={async () => {
        try { await follow.mutateAsync({ handle, follow: !following }); haptic('light'); toast(following ? tr('cm1.post.unfollowed', { handle }) : tr('cm1.follow.followedToast', { handle })); }
        catch (e) {
          const hint = (e as { hint?: string }).hint;
          if (hint === 'pseudonym_required' && onNeedProfile) onNeedProfile(); else toast(friendlyError(e), 'error');
        }
      }} testID={`follow-${handle}`} />
  );
}

export function MemberRow({ m, right }: { m: MemberCard; right?: React.ReactNode }) {
  return (
    <Row style={{ minHeight: MIN_TOUCH + 8 }} testID={`member-${m.handle}`}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('cm1.post.viewProfileOf', { name: m.pseudonym })} onPress={() => router.push(`/community/u/${m.handle}` as never)}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
        <Avatar path={m.avatar_path} preset={m.avatar_preset ?? 'moon'} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold" numberOfLines={1} intentionalTruncation>{m.pseudonym}</Text>
          <Text variant="caption" muted numberOfLines={1} intentionalTruncation>{`@${m.handle}${m.role === 'owner' ? ` · ${tr('cm1.member.groupOwner')}` : ''}`}</Text>
        </View>
      </Tappable>
      {right}
    </Row>
  );
}

// ─── Groupes ───────────────────────────────────────────────────────────────────────────────────────

const GROUP_KIND: Record<CommunityGroup['kind'], 'cm1.group.theme' | 'cm1.group.cohort' | 'cm1.group.private'> = { theme: 'cm1.group.theme', cohort: 'cm1.group.cohort', private: 'cm1.group.private' };
export function GroupCard({ g, compact }: { g: CommunityGroup; compact?: boolean }) {
  const t = useTheme();
  return (
    <Card onPress={() => router.push(`/community/group/${g.id}` as never)} accessibilityLabel={`${localizeGroupName(g.name)}, ${tr(GROUP_KIND[g.kind])}`} testID={`group-${g.slug ?? g.id}`}>
      <Row>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: (g.kind === 'private' ? t.colors.lavender : t.colors.primary) + '22' }}>
          <Icon name={(g.icon as IconName) ?? 'users'} size={18} color={g.kind === 'private' ? t.colors.lavender : t.colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold">{localizeGroupName(g.name)}</Text>
          <Text variant="caption" muted>{[tr(GROUP_KIND[g.kind]), tr('cm1.group.members', { count: g.member_count }), g.is_member ? tr('cm1.group.isMember') : null].filter(Boolean).join(' · ')}</Text>
        </View>
        {g.pending_invitation ? <Tag icon="mail" label={tr('cm1.group.invitation')} color={t.colors.primary} /> : <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
      </Row>
      {!compact && g.description ? <Text variant="small" muted style={{ marginTop: 6 }}>{g.description}</Text> : null}
    </Card>
  );
}

// ─── Onglets de fil ────────────────────────────────────────────────────────────────────────────────

export function FeedTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const t = useTheme();
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 2 }} accessibilityRole="tablist" testID="feed-tabs">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <Tappable key={o.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(o.value)} testID={`feed-tab-${o.value}`}
            style={{ minHeight: MIN_TOUCH, paddingHorizontal: spacing.sm, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: selected ? t.colors.primary : 'transparent' }}>
            <Text weight={selected ? 'bold' : 'medium'} color={selected ? t.colors.primary : t.colors.textMuted}>{o.label}</Text>
          </Tappable>
        );
      })}
    </ScrollView>
  );
}

// ─── Filtres avancés (Premium) ─────────────────────────────────────────────────────────────────────

export function FiltersSheet({ visible, onClose, forums, value, onApply }: { visible: boolean; onClose: () => void; forums: Forum[]; value: AdvancedFilters | null; onApply: (f: AdvancedFilters | null) => void }) {
  const [f, setF] = useState<AdvancedFilters>(value ?? {});
  const set = (p: Partial<AdvancedFilters>) => setF((x) => ({ ...x, ...p }));
  const toggleForum = (id: string) => set({ forumIds: (f.forumIds ?? []).includes(id) ? (f.forumIds ?? []).filter((x) => x !== id) : [...(f.forumIds ?? []), id] });
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('cm1.filters.title')}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }} testID="filters-sheet">
        <Field label={tr('cm1.filters.keywords')} value={f.query ?? ''} onChangeText={(v) => set({ query: v })} />
        <Text variant="label" muted>{tr('cm1.filters.type')}</Text>
        <Row wrap gap={6}>
          {([[null, tr('cm1.filters.all')], ['question', tr('cm1.filters.questions')], ['testimony', tr('cm1.filters.testimonies')], ['poll', tr('cm1.filters.polls')]] as const).map(([k, l]) => <Chip key={String(k)} label={l} selected={(f.kind ?? null) === k} onPress={() => set({ kind: k })} />)}
        </Row>
        <Text variant="label" muted>{tr('cm1.filters.period')}</Text>
        <Row wrap gap={6}>
          {([[null, tr('cm1.filters.always')], [1, tr('cm1.filters.day')], [7, tr('cm1.filters.week')], [30, tr('cm1.filters.month')]] as const).map(([k, l]) => <Chip key={String(k)} label={l} selected={(f.sinceDays ?? null) === k} onPress={() => set({ sinceDays: k })} />)}
        </Row>
        <Row wrap gap={6}>
          <Chip label={tr('cm1.filters.withPhotos')} icon="image" selected={!!f.withPhotos} onPress={() => set({ withPhotos: !f.withPhotos })} />
          <Chip label={tr('cm1.filters.unanswered')} icon="help-circle" selected={!!f.unanswered} onPress={() => set({ unanswered: !f.unanswered })} />
        </Row>
        <Field label={tr('cm1.filters.member')} value={f.handle ?? ''} onChangeText={(v) => set({ handle: v })} autoCapitalize="none" autoCorrect={false} />
        <Text variant="label" muted>{tr('cm1.filters.categories')}</Text>
        <Row wrap gap={6}>
          {[...forums].sort((a, b) => a.position - b.position).map((fo) => <Chip key={fo.id} label={fo.title} icon={spaceIcon(fo)} selected={(f.forumIds ?? []).includes(fo.id)} onPress={() => toggleForum(fo.id)} />)}
        </Row>
        <Button label={tr('cm1.filters.apply')} icon="check" onPress={() => { onApply(f); onClose(); }} testID="filters-apply" />
        <Button label={tr('cm1.filters.clear')} variant="ghost" onPress={() => { setF({}); onApply(null); onClose(); }} />
      </ScrollView>
    </Sheet>
  );
}

/** Bouton « Filtres » : ouvre les filtres pour une abonnée, sinon l'aperçu Premium (avec un exemple concret). */
export function FiltersButton({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const t = useTheme();
  const access = usePremiumAccess('community_search');
  return (
    <Button label={active ? tr('cm1.filters.active') : tr('cm1.filters.button')} icon="sliders" size="sm" variant={active ? 'primary' : 'secondary'}
      onPress={() => (access.premium ? onOpen() : access.showPreview(
        <Text variant="small">{tr('cm1.filters.example')}</Text>,
      ))} testID="community-filters"
      accessibilityLabel={access.premium ? tr('cm1.filters.title') : tr('cm1.filters.a11yPremium')}
      style={!access.premium ? { borderColor: t.colors.gold } : undefined} />
  );
}

// ─── Dossiers d'enregistrements (Premium) ──────────────────────────────────────────────────────────

export function FolderSheet({ visible, onClose, post }: { visible: boolean; onClose: () => void; post: Pick<FeedPost, 'id' | 'saved_folder_id'> }) {
  const toast = useToast();
  const folders = useSavedFolders();
  const act = useFolderAction();
  const premium = usePremium();
  const access = usePremiumAccess('saved_folders');
  const [name, setName] = useState('');
  async function run(a: Parameters<typeof act.mutateAsync>[0], ok: string) {
    try { await act.mutateAsync(a); toast(ok); }
    catch (e) { if (isPremiumRequired(e)) { onClose(); access.showPreview(); } else toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('cm1.folders.title')}>
      <View style={{ gap: spacing.sm }} testID="folder-sheet">
        {(folders.data ?? []).map((f) => (
          <Chip key={f.id} label={f.name} icon="folder" selected={post.saved_folder_id === f.id}
            onPress={() => void run({ kind: 'move', postId: post.id, folderId: post.saved_folder_id === f.id ? null : f.id }, post.saved_folder_id === f.id ? tr('cm1.folders.removed') : tr('cm1.folders.moved', { name: f.name }))} />
        ))}
        {premium ? (
          <Row>
            <View style={{ flex: 1 }}><Field label={tr('cm1.folders.new')} value={name} onChangeText={setName} placeholder={tr('cm1.folders.newPlaceholder')} maxLength={40} /></View>
            <Button label={tr('cm1.folders.create')} size="sm" disabled={!name.trim()} onPress={() => { void run({ kind: 'create', name }, tr('cm1.folders.created', { name: name.trim() })); setName(''); }} testID="folder-create" />
          </Row>
        ) : (
          <Card tone="gold" onPress={() => { onClose(); access.showPreview(); }}>
            <Row><Icon name="star" size={16} /><Text variant="small" style={{ flex: 1 }}>{tr('cm1.folders.premiumOnly')}</Text></Row>
          </Card>
        )}
      </View>
    </Sheet>
  );
}

// ─── Résumé et traduction (Premium) ────────────────────────────────────────────────────────────────

export function AiSummaryCard({ postId, commentCount }: { postId: string; commentCount: number }) {
  const t = useTheme();
  const toast = useToast();
  const ai = useCommunityAi();
  const access = usePremiumAccess('community_ai');
  const [result, setResult] = useState<{ points: string[]; caution: string | null; note?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  if (commentCount < 6) return null;
  async function run() {
    if (!access.require(<Text variant="small">{tr('cm1.ai.preview', { count: commentCount })}</Text>)) return;
    try {
      const r = await ai.mutateAsync({ action: 'summarize', postId });
      if ('points' in r) setResult({ points: r.points, caution: r.caution, note: r.ai === 'demo' ? r.message : tr('cm1.ai.note') });
      else setNotice('message' in r ? r.message : null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Card tone="soft" testID="ai-summary">
      {result ? (
        <View style={{ gap: 4 }}>
          <Row><Icon name="align-left" size={16} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>{tr('cm1.ai.essentials')}</Text></Row>
          {result.points.map((p, i) => <Text key={i} variant="small">{`• ${p}`}</Text>)}
          {result.caution ? <Text variant="caption" color={t.colors.gold}>{result.caution}</Text> : null}
          {result.note ? <Text variant="caption" muted>{result.note}</Text> : null}
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <Row><Icon name="align-left" size={16} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>{tr('cm1.ai.cta', { count: commentCount })}</Text>{!access.premium ? <PremiumBadge /> : null}</Row>
          {notice ? <Text variant="caption" muted>{notice}</Text> : null}
          <Button label={tr('cm1.ai.summarize')} size="sm" variant="secondary" icon="align-left" loading={ai.isPending} onPress={() => void run()} style={{ alignSelf: 'flex-start' }} testID="ai-summarize" />
        </View>
      )}
    </Card>
  );
}

/** Bannière décorative d'un profil (Premium). */
export function ProfileBannerView({ banner, height = 84 }: { banner?: string | null; height?: number }) {
  const colors = banner && banner in BANNER_COLORS ? BANNER_COLORS[banner as ProfileBanner] : NACRE;
  return <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height, opacity: banner ? 1 : 0.75 }} />;
}

// ─── Accueil : une publication pertinente + « Voir la communauté » ─────────────────────────────────

export function HomeCommunityCard() {
  const t = useTheme();
  const spaces = useSpaces();
  const subs = useForumSubscriptions();
  const { data: children } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const feed = useRows<FeedPost>(['forum_feed', 'home'], { table: 'forum_feed', order: [{ col: 'created_at', asc: false }], limit: 40 }, { staleTime: 60_000 });
  const post = useMemo(() => personalizedOrder((feed.data ?? []).filter((p) => !p.is_mine && p.status === 'visible'), {
    journeyForumIds: spaces.mine.map((f) => f.id), subscribedForumIds: subs.ids,
    childAgesMonths: (children ?? []).map((c) => childAge(c.birth_date).months), weekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
  })[0] ?? null, [feed.data, spaces.mine, subs.ids, children, pregnancy]);
  const forum = post ? spaces.all.find((f) => f.id === post.forum_id) ?? null : null;
  return (
    <Card testID="home-community">
      <Row><Icon name="message-circle" size={16} color={t.colors.lavender} /><Text variant="caption" weight="bold" muted style={{ flex: 1, letterSpacing: 1.2 }}>{tr('cm1.home.kicker')}</Text></Row>
      {post ? (
        <Tappable accessibilityRole="button" accessibilityLabel={tr('cm1.home.openPost', { title: post.title ?? post.body })} onPress={() => router.push(`/community/post/${post.id}`)} style={{ marginTop: 6, gap: 2 }} testID="home-community-post">
          <Text weight="bold" numberOfLines={2} intentionalTruncation>{post.title ?? post.body}</Text>
          {post.title ? <Text variant="small" muted numberOfLines={2} intentionalTruncation>{post.body}</Text> : null}
          <Text variant="caption" muted>{[forum?.title, post.comment_count ? tr('cm1.replies', { count: post.comment_count }) : tr('cm1.noReplyYet')].filter(Boolean).join(' · ')}</Text>
        </Tappable>
      ) : feed.isLoading ? null : <Text variant="small" muted style={{ marginTop: 6 }}>{tr('cm1.home.blurb')}</Text>}
      <Button label={tr('cm1.home.seeCommunity')} icon="arrow-right" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} onPress={() => router.push('/(tabs)/community')} testID="home-see-community" />
    </Card>
  );
}
