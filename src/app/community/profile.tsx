/** Profil communauté : pseudonyme (jamais le nom ni l'e-mail), zone générale, mes publications, personnes bloquées. */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { Banner, Button, Card, Field, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { PostCard } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { useCommunityProfile, useForums, useProfile } from '@/lib/data/hooks';
import { pseudonymError, useMyBlocks, useMyPosts, useSaveCommunityProfile, useUnblock } from '@/lib/data/hooks-community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { MIN_TOUCH, spacing } from '@/theme/tokens';

export default function CommunityProfileScreen() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const meQ = useCommunityProfile();
  const { data: me } = meQ;
  const { data: profile } = useProfile();
  const { data: forums } = useForums();
  const postsQ = useMyPosts();
  const { data: myPosts } = postsQ;
  const blocksQ = useMyBlocks();
  const { data: blocks } = blocksQ;
  const saveM = useSaveCommunityProfile();
  const unblock = useUnblock();
  const [pseudo, setPseudo] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      setPseudo(me.pseudonym);
      setArea(me.area_label ?? '');
    }
  }, [me]);

  async function save() {
    if (saveM.isPending) return;
    const e = pseudonymError(pseudo, { displayName: profile?.display_name, email: session?.email });
    if (e) return setError(e);
    setError(null);
    try {
      await saveM.mutateAsync({ pseudonym: pseudo, areaLabel: area, exists: !!me });
      toast('Profil communauté enregistré.');
      if (router.canGoBack()) router.back();
    } catch (err) {
      setError(err instanceof Error && /duplicate|existe/.test(err.message) ? 'Ce pseudonyme est déjà pris.' : friendlyError(err, 'Enregistrement impossible. Réessayez dans un instant.'));
    }
  }

  function doUnblock(userId: string, pseudonym: string) {
    if (unblock.isPending) return;
    unblock.mutate(userId, {
      onSuccess: () => toast(`${pseudonym} est débloqué·e.`),
      onError: (e) => toast(friendlyError(e), 'error'),
    });
  }

  const meLoading = meQ.isLoading && !meQ.data;
  const meError = meQ.isError && !meQ.data;
  const postsLoading = postsQ.isLoading && !myPosts;
  const postsError = postsQ.isError && !myPosts;
  const showPosts = !!me && !postsLoading && !postsError;

  if (meLoading) {
    return <Screen back title="Mon pseudonyme" subtitle="Seul votre pseudonyme est visible des autres membres."><Skeleton kind="detail" rows={4} /></Screen>;
  }
  if (meError) {
    return (
      <Screen back title="Mon pseudonyme" subtitle="Seul votre pseudonyme est visible des autres membres.">
        <ErrorView error={meQ.error} onRetry={() => void meQ.refetch()} title="Impossible d’afficher votre profil communauté" />
      </Screen>
    );
  }

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xxs }}>
      {me?.suspended_until && new Date(me.suspended_until) > new Date() && (
        <Banner tone="warning">{`Votre participation est suspendue jusqu’au ${new Date(me.suspended_until).toLocaleDateString('fr-FR')}.`}</Banner>
      )}
      <Field label="Pseudonyme" value={pseudo} onChangeText={setPseudo} maxLength={24} autoCapitalize="none" autoCorrect={false} error={error} hint="Ni votre prénom, ni votre nom, ni votre adresse e-mail." />
      <Field label="Zone générale" optional value={area} onChangeText={setArea} maxLength={60} placeholder="ex. Bretagne" hint="Utile pour les rencontres locales. Jamais d’adresse." />
      <Button label="Enregistrer" size="lg" loading={saveM.isPending} onPress={save} />
      <Text variant="caption" muted>Vous pouvez supprimer chacune de vos publications. La suppression du compte efface toutes vos contributions.</Text>
      {me ? (
        <>
          <SectionTitle title="Mes publications" />
          {postsLoading ? <Skeleton kind="card" rows={2} /> : postsError ? (
            <ErrorView error={postsQ.error} onRetry={() => void postsQ.refetch()} title="Impossible d’afficher vos publications" />
          ) : null}
        </>
      ) : null}
    </View>
  );

  const footer = me ? (
    <View style={{ gap: spacing.md, marginTop: spacing.xxs }}>
      <SectionTitle title="Personnes bloquées" />
      {blocksQ.isLoading && !blocks ? <Skeleton kind="list" rows={1} /> : blocksQ.isError && !blocks ? (
        <ErrorView error={blocksQ.error} onRetry={() => void blocksQ.refetch()} title="Impossible d’afficher les personnes bloquées" />
      ) : blocks?.length ? (
        <Card>
          {blocks.map((b) => (
            <Row key={b.userId} style={{ justifyContent: 'space-between', minHeight: MIN_TOUCH }}>
              <Text style={{ flex: 1 }}>{b.pseudonym}</Text>
              <Button label="Débloquer" size="sm" variant="ghost" disabled={unblock.isPending} onPress={() => doUnblock(b.userId, b.pseudonym)} />
            </Row>
          ))}
        </Card>
      ) : (
        <Text variant="small" muted>Personne. Depuis une publication, « Signaler » permet aussi de bloquer quelqu’un : vous ne verrez plus ses contenus.</Text>
      )}
    </View>
  ) : null;

  return (
    <Screen back scroll={false} padded={false} title="Mon pseudonyme" subtitle="Seul votre pseudonyme est visible des autres membres.">
      <VirtualList
        data={showPosts ? (myPosts ?? []) : []}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => <PostCard post={p} forumTitle={forums?.find((f) => f.id === p.forum_id)?.title} />}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={showPosts ? (
          <EmptyState
            icon="edit-3"
            title="Vous n’avez encore rien publié."
            action={{ label: 'Écrire ma première publication', icon: 'edit-3', onPress: () => router.push('/community/new') }}
          />
        ) : null}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
