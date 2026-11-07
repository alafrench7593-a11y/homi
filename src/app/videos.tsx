/**
 * « Vidéos & articles » (07/11/2026) : les vidéos officielles (Santé publique France, HAS, Assurance Maladie), lues
 * DANS l'appli, rangées par thème ; sous chaque vidéo, les articles de la bibliothèque qui la prolongent.
 * Ouvert depuis l'accueil, la bibliothèque, le profil, le catalogue d'outils et Maman solo (?topic=…).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card, Chip, ListRow, Text } from '@/components/ui';
import { VideoCard } from '@/components/video/VideoCard';
import { useArticles, useCategories, useJourneyState } from '@/lib/data/hooks';
import { OFFICIAL_VIDEOS, VIDEO_TOPICS, VIDEOS_CHECKED_ON, articlesForVideo, defaultTopic, type VideoTopic } from '@/lib/domain/officialVideos';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

const JOURNEY_OF: Record<string, string> = { pregnancy: 'pregnant', baby: 'newborn', child: 'child' };

export default function Videos() {
  const params = useLocalSearchParams<{ topic?: string }>();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const js = useJourneyState();
  const fromParam = VIDEO_TOPICS.includes(params.topic as VideoTopic) ? (params.topic as VideoTopic) : null;
  const [picked, setPicked] = useState<VideoTopic | 'all' | null>(fromParam);
  const topic = picked ?? defaultTopic(js.active.map((r) => JOURNEY_OF[r.type] ?? r.type));
  const slugOf = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.slug])), [categories]);
  const list = OFFICIAL_VIDEOS.filter((v) => topic === 'all' || v.topic === topic);
  const count = (k: VideoTopic) => OFFICIAL_VIDEOS.filter((v) => v.topic === k).length;

  return (
    <Screen back title={tr('vid.title')} subtitle={tr('vid.subtitle', { count: OFFICIAL_VIDEOS.length })}>
      <Text muted>{tr('vid.intro')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Chip label={`${tr('vid.all')} · ${OFFICIAL_VIDEOS.length}`} selected={topic === 'all'} onPress={() => setPicked('all')} testID="vid-topic-all" />
        {VIDEO_TOPICS.map((k) => <Chip key={k} label={`${tr(`vid.topic.${k}` as TKey)} · ${count(k)}`} selected={topic === k} onPress={() => setPicked(k)} testID={`vid-topic-${k}`} />)}
      </View>
      {list.map((v) => {
        const related = articles ? articlesForVideo(v, articles, slugOf, 3) : [];
        return (
          <Card key={v.id} testID={`vid-card-${v.id}`}>
            <VideoCard video={v} />
            {related.length ? (
              <View style={{ marginTop: spacing.xs }}>
                <Text variant="label">{tr('vid.toRead')}</Text>
                {related.map((a) => (
                  <ListRow key={a.id} icon="book-open" title={a.title} onPress={() => router.push(`/article/${a.slug}`)} testID={`vid-art-${v.id}-${a.slug}`} />
                ))}
              </View>
            ) : null}
          </Card>
        );
      })}
      <Card tone="soft">
        <Text variant="small">{tr('vid.library')}</Text>
        <ListRow icon="book-open" title={tr('lib.home.title')} subtitle={articles ? tr('vid.libraryCount', { count: articles.length }) : undefined} onPress={() => router.push('/library')} testID="vid-library" />
      </Card>
      <Text variant="caption" muted>{tr('vid.checked', { date: formatDate(VIDEOS_CHECKED_ON, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>
      <Text variant="caption" muted>{tr('vid.notAdvice')}</Text>
    </Screen>
  );
}
