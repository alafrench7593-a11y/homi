/**
 * Communauté : mini-réseau social de parents.
 * Fils « Pour vous » (parcours, catégories suivies, âge des enfants, semaine de grossesse, membres suivis, groupes,
 * sujets consultés, publications aimées — calculé sur le téléphone), « Abonnements », « Récent », « Enregistrés ».
 * Recherche de sujets et de membres, catégories principales + « Toutes les catégories », groupes, filtres avancés (Premium),
 * discussions qui attendent une réponse, bouton « Publier ». Aucun classement de membres.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Fab, Field, Icon, IconButton, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { CategorySheet, PostCard, spaceIcon } from '@/features/community';
import { FeedTabs, FiltersButton, FiltersSheet, FollowButton, MemberRow } from '@/features/communitySocial';
import { useActivePregnancy, useCommunityProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useCommunityFeed, useCommunitySearch, useSavedPosts, useSpaces } from '@/lib/data/hooks-community';
import { type AdvancedFilters, useAdvancedSearch, useForumSubscriptions, useGroups, useSavedFolders, useSearchMembers, useToggleForumSubscription, useTopicViews } from '@/lib/data/hooks-social';
import { personalizedOrder, pinnedFirst, recommendedDiscussions, subscriptionsFeed, type FeedSignals } from '@/lib/domain/communitySocial';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useToast } from '@/components/Overlays';
import type { FeedPost } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Mode = 'foryou' | 'following' | 'recent' | 'saved';
const MODES: { value: Mode; label: string }[] = [{ value: 'foryou', label: 'Pour vous' }, { value: 'following', label: 'Abonnements' }, { value: 'recent', label: 'Récent' }, { value: 'saved', label: 'Enregistrés' }];

export default function Community() {
  const t = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const spaces = useSpaces();
  const { data: me } = useCommunityProfile();
  const params = useLocalSearchParams<{ space?: string; mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(MODES.some((m) => m.value === params.mode) ? (params.mode as Mode) : 'foryou');
  const [forumId, setForumId] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  // Lien direct vers une catégorie : /(tabs)/community?space=grossesse
  useEffect(() => {
    if (typeof params.space === 'string' && params.space) {
      const f = spaces.all.find((x) => x.slug === params.space);
      if (f) setForumId(f.id);
    }
  }, [params.space, spaces.all]);

  // Signaux de personnalisation (restent sur le téléphone)
  const subs = useForumSubscriptions();
  const groups = useGroups();
  const views = useTopicViews();
  const { data: children } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const feed = useCommunityFeed('recent', forumId, []);
  const saved = useSavedPosts();
  const folders = useSavedFolders();
  const toggleSub = useToggleForumSubscription();
  const searching = q.trim().replace(/^@/, '').length >= 2;
  const memberOnly = q.trim().startsWith('@');
  const search = useCommunitySearch(memberOnly ? '' : q, forumId);
  const members = useSearchMembers(searching ? q : '');
  const advanced = useAdvancedSearch(filters ? { ...filters, forumIds: forumId ? [forumId] : filters.forumIds } : null);

  const signals: FeedSignals = useMemo(() => ({
    journeyForumIds: spaces.mine.map((f) => f.id),
    subscribedForumIds: subs.ids,
    childAgesMonths: (children ?? []).map((c) => childAge(c.birth_date).months),
    weekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
    topicViews: views.map,
    groupIds: (groups.data ?? []).filter((g) => g.is_member).map((g) => g.id),
    likedForumIds: [...new Set((feed.data ?? []).filter((p) => p.liked || p.saved).map((p) => p.forum_id))],
  }), [spaces.mine, subs.ids, children, pregnancy, views.map, groups.data, feed.data]);

  const current = spaces.all.find((f) => f.id === forumId) ?? null;
  const forumOf = (p: FeedPost) => spaces.all.find((f) => f.id === p.forum_id) ?? null;
  const active = filters ? advanced : searching ? search : mode === 'saved' ? saved : feed;
  const listLoading = active.isLoading && !active.data && !(searching && memberOnly);
  const listError = active.isError && !active.data;
  const posts: FeedPost[] = useMemo(() => {
    if (listLoading || listError) return [];
    if (searching && memberOnly) return [];
    const rows = active.data ?? [];
    if (filters || searching) return rows;
    if (mode === 'saved') return rows.filter((p) => (!forumId || p.forum_id === forumId) && (!folderId || p.saved_folder_id === folderId));
    const open = rows.filter((p) => p.group_kind !== 'private');
    if (mode === 'foryou') return forumId ? pinnedFirst(personalizedOrder(open, signals)) : personalizedOrder(open, signals);
    if (mode === 'following') return subscriptionsFeed(rows, signals);
    return forumId ? pinnedFirst(open) : open;
  }, [listLoading, listError, searching, memberOnly, active.data, filters, mode, forumId, folderId, signals]);
  const waiting = useMemo(() => (mode === 'foryou' && !forumId && !searching && !filters ? recommendedDiscussions(feed.data ?? [], signals) : []), [mode, forumId, searching, filters, feed.data, signals]);

  const newPost = () => router.push(me ? { pathname: '/community/new', params: { forum: forumId ?? '' } } : { pathname: '/community/profile', params: { next: 'new' } });
  const primaryIds = new Set(spaces.primary.map((f) => f.id));
  const subscribed = !!current && subs.ids.includes(current.id);

  async function toggleSubscription() {
    if (!current) return;
    try { await toggleSub.mutateAsync({ forumId: current.id, on: !subscribed }); toast(subscribed ? `Vous ne suivez plus « ${current.title} ».` : `« ${current.title} » apparaîtra dans vos abonnements.`); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }

  const header = (
    <View style={{ gap: spacing.sm, marginBottom: spacing.xxs }}>
      {!me ? (
        <Banner tone="info" title="Créez votre profil communautaire" action={<Button label="Créer mon profil" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} testID="community-create-profile" />}>
          {'Vous pouvez tout lire dès maintenant. Pour publier, choisissez un pseudonyme et un identifiant « @ » : votre nom, votre adresse e-mail et vos données de suivi restent privés.'}
        </Banner>
      ) : null}
      <Field label="Rechercher" placeholder="Sommeil, purée… ou @membre" value={q} onChangeText={setQ} returnKeyType="search" autoCorrect={false} autoCapitalize="none" testID="community-search" />
      {searching ? (
        members.data?.length ? (
          <Card testID="member-results">
            <Text variant="label" muted>Membres</Text>
            {members.data.slice(0, memberOnly ? 10 : 3).map((m) => (
              <MemberRow key={m.handle} m={m} right={me ? <FollowButton handle={m.handle} following={!!m.is_following} /> : null} />
            ))}
          </Card>
        ) : memberOnly && !members.isLoading ? <Text variant="small" muted>Aucun membre ne correspond.</Text> : null
      ) : (
        <FeedTabs value={mode} onChange={(m) => { setMode(m); setFilters(null); }} options={MODES} />
      )}
      {!searching ? (
        <Row gap={6}>
          <Button label="Groupes" icon="users" size="sm" variant="secondary" onPress={() => router.push('/community/groups' as never)} testID="community-groups" />
          <FiltersButton active={!!filters} onOpen={() => setFiltersOpen(true)} />
          {filters ? <IconButton icon="x" label="Effacer les filtres" onPress={() => setFilters(null)} /> : null}
        </Row>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }} testID="community-categories">
        <Chip label="Tout" icon="layers" selected={!forumId} onPress={() => setForumId(null)} />
        {spaces.primary.map((f) => <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={forumId === f.id} onPress={() => setForumId(forumId === f.id ? null : f.id)} />)}
        {current && !primaryIds.has(current.id) ? <Chip label={current.title} icon={spaceIcon(current)} selected onPress={() => setForumId(null)} /> : null}
        <Chip label="Toutes les catégories" icon="grid" onPress={() => setAllOpen(true)} accessibilityLabel="Afficher toutes les catégories" />
      </ScrollView>
      {mode === 'saved' && !searching && (folders.data?.length ?? 0) > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }} testID="saved-folders">
          <Chip label="Tous les enregistrements" icon="bookmark" selected={!folderId} onPress={() => setFolderId(null)} />
          {folders.data!.map((f) => <Chip key={f.id} label={f.name} icon="folder" selected={folderId === f.id} onPress={() => setFolderId(folderId === f.id ? null : f.id)} />)}
        </ScrollView>
      ) : null}
      {current ? (
        <Card tone="soft">
          <Row><Icon name={spaceIcon(current)} size={18} color={t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{current.title}</Text>
            {me ? <Button label={subscribed ? 'Suivie' : 'Suivre'} icon={subscribed ? 'check' : 'plus'} size="sm" variant={subscribed ? 'secondary' : 'primary'} onPress={() => void toggleSubscription()} testID="category-follow" /> : null}
          </Row>
          <Text variant="small" muted style={{ marginTop: 4 }}>{current.description}</Text>
        </Card>
      ) : null}
      {waiting.length ? (
        <Card testID="community-waiting">
          <Row><Icon name="help-circle" size={16} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>Ils attendent une réponse</Text></Row>
          <Text variant="caption" muted>Des questions récentes proches de votre parcours. Votre expérience peut aider.</Text>
          {waiting.map((p) => (
            <Tappable key={p.id} accessibilityRole="button" accessibilityLabel={`Ouvrir : ${p.title ?? p.body}`} onPress={() => router.push(`/community/post/${p.id}`)}
              style={{ minHeight: MIN_TOUCH, justifyContent: 'center', borderTopWidth: 1, borderTopColor: t.colors.border, paddingVertical: 6 }}>
              <Text weight="medium" numberOfLines={2} intentionalTruncation>{p.title ?? p.body}</Text>
              <Text variant="caption" muted>{`${forumOf(p)?.title ?? ''}${p.comment_count ? ` · ${p.comment_count} réponse${p.comment_count > 1 ? 's' : ''}` : ' · pas encore de réponse'}`}</Text>
            </Tappable>
          ))}
        </Card>
      ) : null}
      {mode === 'following' && !searching && !filters && !subs.ids.length && !(groups.data ?? []).some((g) => g.is_member) ? (
        <Text variant="caption" muted testID="following-hint">Suivez des membres (menu « … » d’une publication ou leur profil), des catégories ou des groupes : leurs publications apparaîtront ici, de la plus récente à la plus ancienne.</Text>
      ) : null}
      {searching && !memberOnly ? <Text variant="small" muted>{search.data ? `${search.data.length} publication${search.data.length > 1 ? 's' : ''}${current ? ` dans « ${current.title} »` : ''}` : 'Recherche…'}</Text> : null}
      {filters ? <Text variant="small" muted testID="filters-count">{advanced.data ? `${advanced.data.length} résultat${advanced.data.length > 1 ? 's' : ''} avec vos filtres` : 'Recherche…'}</Text> : null}
      {listLoading ? <Skeleton kind="card" rows={3} /> : listError ? (
        <ErrorView error={active.error} onRetry={() => void active.refetch()} title={searching ? 'Recherche impossible' : 'Impossible d’afficher le fil'} />
      ) : null}
    </View>
  );

  const footer = posts.length ? (
    <Card tone="soft" style={{ marginTop: spacing.xs }}>
      <Row><Icon name="shield" size={18} color={t.colors.lavender} /><Text weight="bold" style={{ flex: 1 }}>Une communauté bienveillante</Text></Row>
      <Text variant="small" muted style={{ marginTop: 6 }}>Les témoignages partagés ici sont des expériences personnelles, pas des conseils médicaux. Signalez ce qui vous semble dangereux ; un contenu signalé trois fois est masqué en attendant la modération.</Text>
      <Button label="Lire les règles" size="sm" variant="ghost" icon="book-open" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/community/rules' as never)} />
    </Card>
  ) : null;

  const empty = listLoading || listError || (searching && memberOnly) ? null : (
    <EmptyState
      icon={searching ? 'search' : mode === 'saved' ? 'bookmark' : mode === 'following' ? 'user-plus' : 'message-square'}
      title={searching || filters ? 'Aucune publication ne correspond' : mode === 'saved' ? 'Aucune publication enregistrée' : mode === 'following' ? 'Rien dans vos abonnements pour l’instant' : current ? 'Aucune publication dans cette catégorie pour l’instant' : 'Aucune publication pour l’instant'}
      body={mode === 'saved' && !searching ? 'Touchez le marque-page d’une publication pour la retrouver ici.' : mode === 'following' && !searching ? 'Suivez un membre, une catégorie ou rejoignez un groupe.' : 'Lancez la discussion !'}
      action={mode === 'saved' && !searching ? undefined : mode === 'following' ? { label: 'Découvrir les groupes', icon: 'users', onPress: () => router.push('/community/groups' as never) } : { label: 'Publier', icon: 'edit-3', onPress: newPost }}
    />
  );

  return (
    <Screen
      account
      scroll={false}
      padded={false}
      title={tr('screen.community.title')}
      subtitle={tr('screen.community.sub')}
      right={(
        <Row gap={0}>
          <IconButton icon="bell" label="Notifications" onPress={() => router.push('/notifications')} />
          {/* Mon profil communautaire (publications, réponses, groupes, albums, enregistrés) */}
          <IconButton icon="at-sign" label={me ? 'Profil communautaire' : 'Créer mon profil communautaire'} onPress={() => router.push(me ? '/moi' as never : '/community/profile')} />
        </Row>
      )}
    >
      <VirtualList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => <PostCard post={p} forum={forumOf(p)} />}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl + 140, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
      <View pointerEvents="box-none" style={{ position: 'absolute', right: spacing.lg, bottom: insets.bottom + 104 }}>
        <Fab icon="edit-3" label="Publier" onPress={newPost} />
      </View>
      <CategorySheet visible={allOpen} onClose={() => setAllOpen(false)} forums={spaces.all} selected={forumId} onSelect={setForumId} />
      {filtersOpen ? <FiltersSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} forums={spaces.all} value={filters} onApply={setFilters} /> : null}
    </Screen>
  );
}
