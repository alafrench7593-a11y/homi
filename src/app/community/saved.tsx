/** Favoris : publications enregistrées par la personne connectée (visibles d'elle seule). */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyStateCard } from '@/components/ui-extra';
import { Button, ErrorState, Loading } from '@/components/ui';
import { PostCard } from '@/features/community';
import { useForums } from '@/lib/data/hooks';
import { useSavedPosts } from '@/lib/data/hooks-community';

export default function SavedPosts() {
  const { data, isLoading, error, refetch } = useSavedPosts();
  const { data: forums } = useForums();
  return (
    <Screen back title="Mes favoris" subtitle="Les discussions que vous avez enregistrées. Personne d’autre ne voit cette liste.">
      {isLoading ? <Loading /> : error ? <ErrorState error={error} onRetry={() => refetch()} /> : data?.length ? (
        data.map((p) => <PostCard key={p.id} post={p} forumTitle={forums?.find((f) => f.id === p.forum_id)?.title} />)
      ) : (
        <EmptyStateCard
          illustration="chat"
          title="Aucun favori pour l’instant"
          text="Touchez le marque-page d’une publication pour la retrouver ici."
          action={<Button label="Parcourir la communauté" variant="secondary" onPress={() => router.replace('/(tabs)/community')} />}
        />
      )}
    </Screen>
  );
}
