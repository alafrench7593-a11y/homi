/** Favoris : publications enregistrées par la personne connectée (visibles d'elle seule). */
import React from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { PostCard } from '@/features/community';
import { useForums } from '@/lib/data/hooks';
import { useSavedPosts } from '@/lib/data/hooks-community';
import { spacing } from '@/theme/tokens';

export default function SavedPosts() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch } = useSavedPosts();
  const { data: forums } = useForums();
  const loading = isLoading && !data;
  const failed = isError && !data;
  return (
    <Screen back scroll={false} padded={false} title="Mes favoris" subtitle="Les discussions que vous avez enregistrées. Personne d’autre ne voit cette liste.">
      <VirtualList
        data={loading || failed ? [] : (data ?? [])}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => <PostCard post={p} forum={forums?.find((f) => f.id === p.forum_id) ?? null} />}
        ListHeaderComponent={loading ? <Skeleton kind="card" rows={3} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} /> : null}
        ListEmptyComponent={loading || failed ? null : (
          <EmptyState
            icon="bookmark"
            title="Aucun favori pour l’instant"
            body="Touchez le marque-page d’une publication pour la retrouver ici."
            action={{ label: 'Parcourir la communauté', icon: 'users', onPress: () => router.replace('/(tabs)/community') }}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
