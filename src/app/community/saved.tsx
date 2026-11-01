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
import { t as tr } from '@/i18n';

export default function SavedPosts() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch } = useSavedPosts();
  const { data: forums } = useForums();
  const loading = isLoading && !data;
  const failed = isError && !data;
  return (
    <Screen back scroll={false} padded={false} title={tr('u5.saved.title')} subtitle={tr('u5.saved.subtitle')}>
      <VirtualList
        data={loading || failed ? [] : (data ?? [])}
        keyExtractor={(p) => p.id}
        renderItem={({ item: p }) => <PostCard post={p} forum={forums?.find((f) => f.id === p.forum_id) ?? null} />}
        ListHeaderComponent={loading ? <Skeleton kind="card" rows={3} /> : failed ? <ErrorView error={error} onRetry={() => void refetch()} /> : null}
        ListEmptyComponent={loading || failed ? null : (
          <EmptyState
            icon="bookmark"
            title={tr('u5.saved.empty_t')}
            body={tr('u5.saved.empty_b')}
            action={{ label: tr('u5.saved.browse'), icon: 'users', onPress: () => router.replace('/(tabs)/community') }}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}
