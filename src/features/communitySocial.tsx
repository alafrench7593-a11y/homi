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
import { personalizedOrder, pollPercent, splitMentions, type ProfileAccent, type ProfileBanner } from '@/lib/domain/communitySocial';
import { isPremiumRequired } from '@/lib/premium/features';
import type { CommunityGroup, FeedPost, Forum, MemberCard } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NACRE, radius, SKY_GRADIENTS, spacing } from '@/theme/tokens';

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
    <View accessibilityLabel="Abonnée Premium" style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, backgroundColor: t.colors.gold + '22' }} testID="premium-badge">
      <Icon name="star" size={10} color={t.colors.gold} />
      <Text variant="caption" color={t.colors.gold} style={{ fontSize: 11, lineHeight: 14 }}>Premium</Text>
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
            accessibilityLabel={`${o.label}${showResults ? `, ${pct} %` : ''}`} disabled={poll.closed || vote.isPending}
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
              {showResults ? <Text variant="small" weight="bold">{`${pct} %`}</Text> : null}
            </Row>
          </Tappable>
        );
      })}
      {poll.multiple && !poll.closed && picked.length ? <Button label="Voter" size="sm" onPress={() => void send(picked)} loading={vote.isPending} testID="poll-vote" /> : null}
      <Text variant="caption" muted>
        {[`${poll.total} participation${poll.total > 1 ? 's' : ''}`, poll.multiple ? 'plusieurs choix possibles' : null, poll.closed ? 'sondage terminé' : poll.closes_at ? `jusqu’au ${new Date(poll.closes_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : null, 'votes anonymes'].filter(Boolean).join(' · ')}
      </Text>
    </View>
  );
}

// ─── Suivre ────────────────────────────────────────────────────────────────────────────────────────

export function FollowButton({ handle, following, size = 'sm', onNeedProfile }: { handle: string; following: boolean; size?: 'sm' | 'md'; onNeedProfile?: () => void }) {
  const toast = useToast();
  const follow = useFollowMember();
  return (
    <Button label={following ? 'Abonné·e' : 'Suivre'} icon={following ? 'check' : 'user-plus'} size={size} variant={following ? 'secondary' : 'primary'} loading={follow.isPending}
      accessibilityLabel={following ? `Ne plus suivre @${handle}` : `Suivre @${handle}`}
      onPress={async () => {
        try { await follow.mutateAsync({ handle, follow: !following }); haptic('light'); toast(following ? `Vous ne suivez plus @${handle}.` : `Vous suivez @${handle} : ses publications apparaissent dans « Abonnements ».`); }
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
      <Tappable accessibilityRole="button" accessibilityLabel={`Voir le profil de ${m.pseudonym}`} onPress={() => router.push(`/community/u/${m.handle}` as never)}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
        <Avatar path={m.avatar_path} preset={m.avatar_preset ?? 'moon'} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold" numberOfLines={1} intentionalTruncation>{m.pseudonym}</Text>
          <Text variant="caption" muted numberOfLines={1} intentionalTruncation>{`@${m.handle}${m.role === 'owner' ? ' · créatrice du groupe' : ''}`}</Text>
        </View>
      </Tappable>
      {right}
    </Row>
  );
}

// ─── Groupes ───────────────────────────────────────────────────────────────────────────────────────

const GROUP_KIND: Record<CommunityGroup['kind'], string> = { theme: 'Groupe thématique', cohort: 'Groupe par mois', private: 'Groupe privé' };
export function GroupCard({ g, compact }: { g: CommunityGroup; compact?: boolean }) {
  const t = useTheme();
  return (
    <Card onPress={() => router.push(`/community/group/${g.id}` as never)} accessibilityLabel={`${g.name}, ${GROUP_KIND[g.kind]}`} testID={`group-${g.slug ?? g.id}`}>
      <Row>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: (g.kind === 'private' ? t.colors.lavender : t.colors.primary) + '22' }}>
          <Icon name={(g.icon as IconName) ?? 'users'} size={18} color={g.kind === 'private' ? t.colors.lavender : t.colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text weight="bold">{g.name}</Text>
          <Text variant="caption" muted>{[GROUP_KIND[g.kind], `${g.member_count} membre${g.member_count > 1 ? 's' : ''}`, g.is_member ? 'vous en faites partie' : null].filter(Boolean).join(' · ')}</Text>
        </View>
        {g.pending_invitation ? <Tag icon="mail" label="Invitation" color={t.colors.primary} /> : <Icon name="chevron-right" size={18} color={t.colors.textMuted} />}
      </Row>
      {!compact && g.description ? <Text variant="small" muted style={{ marginTop: 6 }}>{g.description}</Text> : null}
    </Card>
  );
}

// ─── Onglets de fil ────────────────────────────────────────────────────────────────────────────────

export function FeedTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 2 }} accessibilityRole="tablist" testID="feed-tabs">
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
    <Sheet visible={visible} onClose={onClose} title="Filtres avancés">
      <ScrollView contentContainerStyle={{ gap: spacing.sm }} testID="filters-sheet">
        <Field label="Mots-clés (facultatif)" value={f.query ?? ''} onChangeText={(v) => set({ query: v })} />
        <Text variant="label" muted>Type</Text>
        <Row wrap gap={6}>
          {([[null, 'Tous'], ['question', 'Questions'], ['testimony', 'Témoignages'], ['poll', 'Sondages']] as const).map(([k, l]) => <Chip key={l} label={l} selected={(f.kind ?? null) === k} onPress={() => set({ kind: k })} />)}
        </Row>
        <Text variant="label" muted>Période</Text>
        <Row wrap gap={6}>
          {([[null, 'Toujours'], [1, '24 h'], [7, '7 jours'], [30, '30 jours']] as const).map(([k, l]) => <Chip key={l} label={l} selected={(f.sinceDays ?? null) === k} onPress={() => set({ sinceDays: k })} />)}
        </Row>
        <Row wrap gap={6}>
          <Chip label="Avec photos" icon="image" selected={!!f.withPhotos} onPress={() => set({ withPhotos: !f.withPhotos })} />
          <Chip label="Sans réponse" icon="help-circle" selected={!!f.unanswered} onPress={() => set({ unanswered: !f.unanswered })} />
        </Row>
        <Field label="D’un membre (@identifiant)" value={f.handle ?? ''} onChangeText={(v) => set({ handle: v })} autoCapitalize="none" autoCorrect={false} />
        <Text variant="label" muted>Catégories (plusieurs possibles)</Text>
        <Row wrap gap={6}>
          {[...forums].sort((a, b) => a.position - b.position).map((fo) => <Chip key={fo.id} label={fo.title} icon={spaceIcon(fo)} selected={(f.forumIds ?? []).includes(fo.id)} onPress={() => toggleForum(fo.id)} />)}
        </Row>
        <Button label="Afficher les résultats" icon="check" onPress={() => { onApply(f); onClose(); }} testID="filters-apply" />
        <Button label="Effacer les filtres" variant="ghost" onPress={() => { setF({}); onApply(null); onClose(); }} />
      </ScrollView>
    </Sheet>
  );
}

/** Bouton « Filtres » : ouvre les filtres pour une abonnée, sinon l'aperçu Premium (avec un exemple concret). */
export function FiltersButton({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  const t = useTheme();
  const access = usePremiumAccess('community_search');
  return (
    <Button label={active ? 'Filtres actifs' : 'Filtres'} icon="sliders" size="sm" variant={active ? 'primary' : 'secondary'}
      onPress={() => (access.premium ? onOpen() : access.showPreview(
        <Text variant="small">{'Exemple : « Sommeil » + « Biberon », sondages des 7 derniers jours, sans réponse.'}</Text>,
      ))} testID="community-filters"
      accessibilityLabel={access.premium ? 'Filtres avancés' : 'Filtres avancés (Premium)'}
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
    <Sheet visible={visible} onClose={onClose} title="Ranger dans un dossier">
      <View style={{ gap: spacing.sm }} testID="folder-sheet">
        {(folders.data ?? []).map((f) => (
          <Chip key={f.id} label={f.name} icon="folder" selected={post.saved_folder_id === f.id}
            onPress={() => void run({ kind: 'move', postId: post.id, folderId: post.saved_folder_id === f.id ? null : f.id }, post.saved_folder_id === f.id ? 'Retirée du dossier.' : `Rangée dans « ${f.name} ».`)} />
        ))}
        {premium ? (
          <Row>
            <View style={{ flex: 1 }}><Field label="Nouveau dossier" value={name} onChangeText={setName} placeholder="Sommeil, valise…" maxLength={40} /></View>
            <Button label="Créer" size="sm" disabled={!name.trim()} onPress={() => { void run({ kind: 'create', name }, `Dossier « ${name.trim()} » créé.`); setName(''); }} testID="folder-create" />
          </Row>
        ) : (
          <Card tone="gold" onPress={() => { onClose(); access.showPreview(); }}>
            <Row><Icon name="star" size={16} /><Text variant="small" style={{ flex: 1 }}>Créer des dossiers est réservé à Premium. Vos enregistrements restent tous accessibles.</Text></Row>
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
    if (!access.require(<Text variant="small">{`Cette discussion compte ${commentCount} réponses : le résumé en présente l’essentiel, sous forme de témoignages.`}</Text>)) return;
    try {
      const r = await ai.mutateAsync({ action: 'summarize', postId });
      if ('points' in r) setResult({ points: r.points, caution: r.caution, note: r.ai === 'demo' ? r.message : 'Résumé automatique : relisez la discussion pour les détails.' });
      else setNotice('message' in r ? r.message : null);
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Card tone="soft" testID="ai-summary">
      {result ? (
        <View style={{ gap: 4 }}>
          <Row><Icon name="align-left" size={16} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>L’essentiel de la discussion</Text></Row>
          {result.points.map((p, i) => <Text key={i} variant="small">{`• ${p}`}</Text>)}
          {result.caution ? <Text variant="caption" color={t.colors.gold}>{result.caution}</Text> : null}
          {result.note ? <Text variant="caption" muted>{result.note}</Text> : null}
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <Row><Icon name="align-left" size={16} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>{`${commentCount} réponses : voir l’essentiel`}</Text>{!access.premium ? <PremiumBadge /> : null}</Row>
          {notice ? <Text variant="caption" muted>{notice}</Text> : null}
          <Button label="Résumer la discussion" size="sm" variant="secondary" icon="align-left" loading={ai.isPending} onPress={() => void run()} style={{ alignSelf: 'flex-start' }} testID="ai-summarize" />
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
      <Row><Icon name="message-circle" size={16} color={t.colors.lavender} /><Text variant="caption" weight="bold" muted style={{ flex: 1, letterSpacing: 1.2 }}>DANS LA COMMUNAUTÉ</Text></Row>
      {post ? (
        <Tappable accessibilityRole="button" accessibilityLabel={`Ouvrir la publication : ${post.title ?? post.body}`} onPress={() => router.push(`/community/post/${post.id}`)} style={{ marginTop: 6, gap: 2 }} testID="home-community-post">
          <Text weight="bold" numberOfLines={2} intentionalTruncation>{post.title ?? post.body}</Text>
          {post.title ? <Text variant="small" muted numberOfLines={2} intentionalTruncation>{post.body}</Text> : null}
          <Text variant="caption" muted>{[forum?.title, post.comment_count ? `${post.comment_count} réponse${post.comment_count > 1 ? 's' : ''}` : 'pas encore de réponse'].filter(Boolean).join(' · ')}</Text>
        </Tappable>
      ) : feed.isLoading ? null : <Text variant="small" muted style={{ marginTop: 6 }}>Questions, témoignages et groupes de parents qui vivent la même chose.</Text>}
      <Button label="Voir la communauté" icon="arrow-right" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} onPress={() => router.push('/(tabs)/community')} testID="home-see-community" />
    </Card>
  );
}
