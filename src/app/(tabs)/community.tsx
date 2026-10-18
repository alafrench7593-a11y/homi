/**
 * Communauté : 15 espaces séparés, ouverts à toutes et tous quel que soit le parcours.
 * « Mes espaces » sont suggérés d'après le profil ; « Tous les espaces » restent accessibles.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { PostCard, SpaceTile, spaceIcon } from '@/features/community';
import { useCommunityProfile, useFeed } from '@/lib/data/hooks';
import { useCommunitySearch, useSavedPosts, useSpaces } from '@/lib/data/hooks-community';
import type { FeedPost } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function Community() {
  const t = useTheme();
  const spaces = useSpaces();
  const { data: me } = useCommunityProfile();
  const { data: saved } = useSavedPosts();
  const [forumId, setForumId] = useState<string | null>(null);
  const { space } = useLocalSearchParams<{ space?: string }>();
  // Lien direct vers un espace (ex. depuis « Tous mes outils ») : /(tabs)/community?space=grossesse
  useEffect(() => {
    if (typeof space === 'string' && space) {
      const f = spaces.all.find((x) => x.slug === space);
      if (f) setForumId(f.id);
    }
  }, [space, spaces.all]);
  const [q, setQ] = useState('');
  const [searchInSpace, setSearchInSpace] = useState(true);
  const current = spaces.all.find((f) => f.id === forumId) ?? null;
  const feed = useFeed(forumId);
  const searching = q.trim().length >= 2;
  const search = useCommunitySearch(q, current && searchInSpace ? current.id : null);
  const titleOf = (p: FeedPost) => spaces.all.find((f) => f.id === p.forum_id)?.title;
  const select = (id: string | null) => setForumId(forumId === id ? null : id);

  const insets = useSafeAreaInsets();
  const newPost = () => router.push({ pathname: '/community/new', params: { forum: forumId ?? '' } });

  // La liste affichée (résultats de recherche ou fil) est virtualisée : seules les publications visibles sont rendues.
  const active = searching ? search : feed;
  const listLoading = active.isLoading && !active.data;
  const listError = active.isError && !active.data;
  const posts: FeedPost[] = listLoading || listError ? [] : (active.data ?? []);

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
      {!me && (
        <Banner tone="info" title="Choisissez un pseudonyme" action={<Button label="Choisir mon pseudonyme" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} />}>
          {'Vous pouvez tout lire dès maintenant. Pour publier ou répondre, un pseudonyme suffit : votre nom et votre adresse e-mail restent privés.'}
        </Banner>
      )}

      <Field label="Rechercher dans la communauté" placeholder="Sommeil, purée, valise de maternité…" value={q} onChangeText={setQ} returnKeyType="search" autoCorrect={false} />

      {searching ? (
        <>
          {current && (
            <Row wrap>
              <Chip label={`Dans « ${current.title} »`} icon={spaceIcon(current)} selected={searchInSpace} onPress={() => setSearchInSpace(true)} />
              <Chip label="Tous les espaces" selected={!searchInSpace} onPress={() => setSearchInSpace(false)} />
            </Row>
          )}
          <SectionTitle title={search.data ? `${search.data.length} résultat${search.data.length > 1 ? 's' : ''}` : 'Résultats'} action="Effacer" onAction={() => setQ('')} />
        </>
      ) : (
        <>
          <Card padded={false}>
            <ListRow icon="bookmark" title="Mes favoris" subtitle={saved?.length ? `${saved.length} publication${saved.length > 1 ? 's' : ''} enregistrée${saved.length > 1 ? 's' : ''}` : 'Enregistrez les discussions utiles'} onPress={() => router.push('/community/saved')} />
            <ListRow icon="user" title={me ? `Mon pseudonyme : ${me.pseudonym}` : 'Mon pseudonyme'} subtitle={me ? 'Mes publications, personnes bloquées' : 'Requis pour publier'} onPress={() => router.push('/community/profile')} />
          </Card>

          <SectionTitle title="Mes espaces" />
          {spaces.isLoading && !spaces.data ? <Skeleton kind="card" rows={1} /> : spaces.isError && !spaces.data ? (
            <ErrorView error={spaces.error} onRetry={() => void spaces.refetch()} title="Impossible d’afficher les espaces" />
          ) : spaces.mine.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}>
              {spaces.mine.map((f) => <SpaceTile key={f.id} forum={f} selected={forumId === f.id} onPress={() => select(f.id)} />)}
            </ScrollView>
          ) : (
            <Text variant="small" muted>Indiquez votre parcours dans votre profil pour recevoir des suggestions. Tous les espaces ci-dessous vous sont ouverts.</Text>
          )}

          <SectionTitle title="Tous les espaces" />
          <Row wrap>
            <Chip label="Tout le fil" icon="layers" selected={!forumId} onPress={() => setForumId(null)} />
            {spaces.all.map((f) => (
              <Chip key={f.id} label={f.title} icon={spaceIcon(f)} selected={forumId === f.id} onPress={() => select(f.id)} />
            ))}
          </Row>

          {current && (
            <Card tone="soft">
              <Row><Icon name={spaceIcon(current)} size={18} color={t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{current.title}</Text></Row>
              <Text variant="small" muted style={{ marginTop: 4 }}>{current.description}</Text>
              {current.is_local && <Text variant="caption" muted style={{ marginTop: 4 }}>Ne publiez jamais d’adresse personnelle : indiquez une zone générale et proposez un lieu public.</Text>}
            </Card>
          )}
          <Button
            label={current ? `Publier dans « ${current.title} »` : 'Nouvelle publication'}
            icon="edit-3"
            onPress={newPost}
          />

          <SectionTitle title={current ? `Fil de « ${current.title} »` : 'Fil de tous les espaces'} action="Actualiser" onAction={() => feed.refetch()} />
        </>
      )}
      {listLoading ? <Skeleton kind="card" rows={3} /> : listError ? (
        <ErrorView
          error={active.error}
          onRetry={() => void active.refetch()}
          title={searching ? 'Recherche impossible' : 'Impossible d’afficher le fil'}
        />
      ) : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
      <Card tone="soft">
        <Row><Icon name="shield" size={18} color={t.colors.lavender} /><Text weight="bold">Règles de la communauté</Text></Row>
        <Text variant="small" muted style={{ marginTop: 6 }}>
          Bienveillance, aucun jugement, pas de conseil médical présenté comme une certitude, pas de vente, aucune donnée personnelle. Les contenus signalés trois fois sont masqués en attendant la modération ; vous pouvez bloquer une personne à tout moment.
        </Text>
      </Card>
    </View>
  );

  const empty = listLoading || listError ? null : searching ? (
    <EmptyState
      icon="search"
      title="Aucune publication ne correspond"
      body="Essayez d’autres mots ou lancez la discussion !"
      action={{ label: 'Lancer la discussion', icon: 'edit-3', onPress: newPost }}
    />
  ) : (
    <EmptyState
      icon="message-square"
      title={current ? 'Aucune publication dans cet espace pour l’instant' : 'Aucune publication pour l’instant'}
      body="Lancez la discussion !"
      action={{ label: 'Écrire la première publication', icon: 'edit-3', onPress: newPost }}
    />
  );

  return (
    <Screen
      scroll={false}
      padded={false}
      title="Communauté"
      subtitle="Tous les espaces sont ouverts, sous pseudonyme."
      right={(
        <Row gap={0}>
          <IconButton icon="bookmark" label="Mes favoris" onPress={() => router.push('/community/saved')} />
          <IconButton icon="user" label="Mon pseudonyme" onPress={() => router.push('/community/profile')} />
        </Row>
      )}
    >
      <VirtualList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => <PostCard post={p} forumTitle={current ? undefined : titleOf(p)} />}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl + 96, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
