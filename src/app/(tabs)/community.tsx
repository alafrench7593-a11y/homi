/**
 * Communauté : forum parental. Fils « Pour vous » (selon le parcours), « Récent » et « Enregistrés », recherche,
 * catégories principales + « Toutes les catégories », suggestions selon le parcours, bouton « Publier ».
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Fab, Field, Icon, IconButton, Row, Segmented, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { Avatar, CategorySheet, PostCard, spaceIcon } from '@/features/community';
import { useCommunityProfile } from '@/lib/data/hooks';
import { useCommunityFeed, useCommunitySearch, useSavedPosts, useSpaces } from '@/lib/data/hooks-community';
import type { FeedPost } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Mode = 'foryou' | 'recent' | 'saved';

export default function Community() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const spaces = useSpaces();
  const { data: me } = useCommunityProfile();
  const params = useLocalSearchParams<{ space?: string; mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'recent' || params.mode === 'saved' ? params.mode : 'foryou');
  const [forumId, setForumId] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [q, setQ] = useState('');
  // Lien direct vers une catégorie : /(tabs)/community?space=grossesse
  useEffect(() => {
    if (typeof params.space === 'string' && params.space) {
      const f = spaces.all.find((x) => x.slug === params.space);
      if (f) setForumId(f.id);
    }
  }, [params.space, spaces.all]);
  const myForumIds = useMemo(() => spaces.mine.map((f) => f.id), [spaces.mine]);
  const feed = useCommunityFeed(mode === 'recent' ? 'recent' : 'foryou', forumId, myForumIds);
  const saved = useSavedPosts();
  const searching = q.trim().length >= 2;
  const search = useCommunitySearch(q, forumId);
  const current = spaces.all.find((f) => f.id === forumId) ?? null;
  const forumOf = (p: FeedPost) => spaces.all.find((f) => f.id === p.forum_id) ?? null;
  const active = searching ? search : mode === 'saved' ? saved : feed;
  const listLoading = active.isLoading && !active.data;
  const listError = active.isError && !active.data;
  const posts: FeedPost[] = listLoading || listError ? [] : ((mode === 'saved' && !searching && forumId ? (active.data ?? []).filter((p) => p.forum_id === forumId) : active.data) ?? []);
  const newPost = () => router.push(me ? { pathname: '/community/new', params: { forum: forumId ?? '' } } : { pathname: '/community/profile', params: { next: 'new' } });
  const primaryIds = new Set(spaces.primary.map((f) => f.id));

  const header = (
    <View style={{ gap: spacing.sm, marginBottom: spacing.xxs }}>
      {!me ? (
        <Banner tone="info" title="Créez votre profil communautaire" action={<Button label="Créer mon profil" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} testID="community-create-profile" />}>
          {'Vous pouvez tout lire dès maintenant. Pour publier, choisissez un pseudonyme et un identifiant « @ » : votre nom, votre adresse e-mail et vos données de suivi restent privés.'}
        </Banner>
      ) : null}
      <Field label="Rechercher" placeholder="Sommeil, purée, valise de maternité…" value={q} onChangeText={setQ} returnKeyType="search" autoCorrect={false} testID="community-search" />
      {!searching ? <Segmented label="Fil" value={mode} onChange={setMode} options={[{ value: 'foryou', label: 'Pour vous' }, { value: 'recent', label: 'Récent' }, { value: 'saved', label: 'Enregistrés' }]} /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: 2 }} testID="community-categories">
        <Chip label="Tout" icon="layers" selected={!forumId} onPress={() => setForumId(null)} />
        {spaces.primary.map((f) => <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={forumId === f.id} onPress={() => setForumId(forumId === f.id ? null : f.id)} />)}
        {current && !primaryIds.has(current.id) ? <Chip label={current.title} icon={spaceIcon(current)} selected onPress={() => setForumId(null)} /> : null}
        <Chip label="Toutes les catégories" icon="grid" onPress={() => setAllOpen(true)} accessibilityLabel="Afficher toutes les catégories" />
      </ScrollView>
      {current ? (
        <Card tone="soft">
          <Row><Icon name={spaceIcon(current)} size={18} color={t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{current.title}</Text></Row>
          <Text variant="small" muted style={{ marginTop: 4 }}>{current.description}</Text>
        </Card>
      ) : mode === 'foryou' && !searching && spaces.mine.length ? (
        <Text variant="caption" muted testID="community-suggestions">{`Suggestions selon votre parcours : ${spaces.mine.slice(0, 3).map((f) => f.title).join(', ')}.`}</Text>
      ) : null}
      {searching ? <Text variant="small" muted>{search.data ? `${search.data.length} résultat${search.data.length > 1 ? 's' : ''}${current ? ` dans « ${current.title} »` : ''}` : 'Recherche…'}</Text> : null}
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

  const empty = listLoading || listError ? null : (
    <EmptyState
      icon={searching ? 'search' : mode === 'saved' ? 'bookmark' : 'message-square'}
      title={searching ? 'Aucune publication ne correspond' : mode === 'saved' ? 'Aucune publication enregistrée' : current ? 'Aucune publication dans cette catégorie pour l’instant' : 'Aucune publication pour l’instant'}
      body={mode === 'saved' && !searching ? 'Touchez le marque-page d’une publication pour la retrouver ici.' : 'Lancez la discussion !'}
      action={mode === 'saved' && !searching ? undefined : { label: 'Publier', icon: 'edit-3', onPress: newPost }}
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
        <IconButton icon="bell" label="Notifications" onPress={() => router.push('/notifications')} />
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
    </Screen>
  );
}
