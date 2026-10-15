/** Communauté : forums séparés par parcours, sous pseudonyme. */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, Icon, IconButton, Row, SectionTitle, Text } from '@/components/ui';
import { PostCard } from '@/features/community';
import { useCommunityProfile, useFeed, useForums, useProfile } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const ICONS: Record<string, React.ComponentProps<typeof Icon>['name']> = { shield: 'shield', sparkles: 'star', moon: 'moon', twins: 'copy', heart: 'heart', drop: 'droplet', baby: 'smile', sun: 'sun', users: 'users', map: 'map-pin' };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Community() {
  const t = useTheme();
  const { data: forums } = useForums();
  const { data: profile } = useProfile();
  const { data: me } = useCommunityProfile();
  const [forumId, setForumId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const { data: feed, refetch } = useFeed(forumId);

  const mine = useMemo(() => {
    const j = profile?.journeys ?? [];
    return (forums ?? []).filter((f) => !f.journeys.length || f.journeys.some((x) => j.includes(x)));
  }, [forums, profile]);
  const posts = (feed ?? []).filter((p) => (!savedOnly || p.saved) && (!q || norm(`${p.title} ${p.body}`).includes(norm(q))));
  const current = forums?.find((f) => f.id === forumId);

  return (
    <Screen bottomInset={96} title="Communauté" subtitle="Échanger entre parents, sous pseudonyme." right={<IconButton icon="user" label="Mon profil communauté" onPress={() => router.push('/community/profile')} />}>
      {!me && (
        <Banner tone="info" title="Choisissez un pseudonyme" action={<Button label="Choisir mon pseudonyme" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => router.push('/community/profile')} />}>
          {'Vous pouvez lire sans compte communauté. Pour publier, un pseudonyme suffit : votre nom et vos données restent privés.'}
        </Banner>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        <Chip label="Tous" selected={!forumId} onPress={() => setForumId(null)} />
        {(mine.length ? mine : forums ?? []).concat((forums ?? []).filter((f) => !mine.includes(f))).map((f) => (
          <Chip key={f.id} label={f.title} icon={ICONS[f.icon ?? ''] ?? 'message-square'} selected={forumId === f.id} onPress={() => setForumId(forumId === f.id ? null : f.id)} />
        ))}
      </ScrollView>
      {current && (
        <Card tone="soft">
          <Text weight="bold">{current.title}</Text>
          <Text variant="small" muted>{current.description}</Text>
          {current.is_local && <Text variant="caption" muted style={{ marginTop: 4 }}>Ne publiez jamais d’adresse personnelle : indiquez une zone générale et proposez un lieu public.</Text>}
        </Card>
      )}
      <Row>
        <View style={{ flex: 1 }}><Field label="Rechercher" placeholder="Mots-clés" value={q} onChangeText={setQ} /></View>
        <View style={{ paddingTop: 26 }}><Chip label="Enregistrées" icon="bookmark" selected={savedOnly} onPress={() => setSavedOnly(!savedOnly)} /></View>
      </Row>
      <Button label="Nouvelle publication" icon="edit-3" onPress={() => router.push({ pathname: '/community/new', params: { forum: forumId ?? '' } })} />

      <SectionTitle title={current ? 'Dernières discussions' : 'Dans vos forums'} action="Actualiser" onAction={() => refetch()} />
      {posts.length ? posts.map((p) => <PostCard key={p.id} post={p} forumTitle={forums?.find((f) => f.id === p.forum_id)?.title} />) : (
        <Text muted center style={{ padding: spacing.lg }}>Aucune publication pour l’instant. Lancez la discussion !</Text>
      )}
      <Card tone="soft">
        <Row><Icon name="shield" size={18} color={t.colors.lavender} /><Text weight="bold">Règles de la communauté</Text></Row>
        <Text variant="small" muted style={{ marginTop: 6 }}>
          Bienveillance, aucun jugement, pas de conseil médical présenté comme une certitude, pas de vente, aucune donnée personnelle. Les contenus signalés plusieurs fois sont masqués en attendant la modération.
        </Text>
      </Card>
    </Screen>
  );
}
