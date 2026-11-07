/**
 * « Vidéos & articles » (07/11/2026) : les vidéos officielles (Santé publique France, HAS, Assurance Maladie,
 * Ministère chargé de la Santé, Croix-Rouge française), lues DANS l'appli.
 *  - Onglet « Par thème » : 14 thèmes (cycle, contraception, envie de bébé, grossesse, accouchement et post-partum,
 *    bébé, sommeil, allaitement, repas, santé de l'enfant, premiers secours, démarches, couple, prendre soin de soi),
 *    ceux du moment de vie de la personne d'abord ; sous chaque vidéo, les articles de la bibliothèque qui la prolongent.
 *  - Onglet « Tutos » : les gestes et démarches pas à pas, regroupés par thème (aussi ouvert par /tutos).
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card, Chip, ListRow, Segmented, SectionTitle, Text } from '@/components/ui';
import { VideoCard } from '@/components/video/VideoCard';
import { useArticles, useCategories, useJourneyState } from '@/lib/data/hooks';
import { ALL_VIDEOS, TUTOS, VIDEO_TOPICS, VIDEOS_CHECKED_ON, articlesForVideo, defaultTopic, orderedTopics, type OfficialVideo, type VideoTopic } from '@/lib/domain/officialVideos';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

const JOURNEY_OF: Record<string, string> = { pregnancy: 'pregnant', baby: 'newborn', child: 'child', cycle: 'avoid', ttc: 'ttc' };

function VideoWithArticles({ v, articles, slugOf }: { v: OfficialVideo; articles: ReturnType<typeof useArticles>['data']; slugOf: Map<string, string | null | undefined> }) {
  const related = articles ? articlesForVideo(v, articles, slugOf, 3) : [];
  return (
    <Card testID={`vid-card-${v.id}`}>
      <VideoCard video={v} />
      {related.length ? (
        <View style={{ marginTop: spacing.xs }}>
          <Text variant="label">{tr('vid.toRead')}</Text>
          {related.map((a) => <ListRow key={a.id} icon="book-open" title={a.title} onPress={() => router.push(`/article/${a.slug}`)} testID={`vid-art-${v.id}-${a.slug}`} />)}
        </View>
      ) : null}
    </Card>
  );
}

export function VideosScreen({ initialTab }: { initialTab?: 'themes' | 'tutos' }) {
  const params = useLocalSearchParams<{ topic?: string; tab?: string }>();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const js = useJourneyState();
  const journeys = js.active.map((r) => JOURNEY_OF[r.type] ?? r.type);
  const fromParam = VIDEO_TOPICS.includes(params.topic as VideoTopic) ? (params.topic as VideoTopic) : null;
  const [tab, setTab] = useState<'themes' | 'tutos'>(params.tab === 'tutos' ? 'tutos' : initialTab ?? 'themes');
  const [picked, setPicked] = useState<VideoTopic | 'all' | null>(fromParam);
  const topic = picked ?? defaultTopic(journeys);
  const topics = orderedTopics(journeys);
  const slugOf = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c.slug])), [categories]);
  const count = (k: VideoTopic) => ALL_VIDEOS.filter((v) => v.topic === k).length;
  const list = ALL_VIDEOS.filter((v) => topic === 'all' || v.topic === topic);
  const tutoTopics = topics.filter((k) => TUTOS.some((v) => v.topic === k));

  return (
    <Screen back title={tab === 'tutos' ? tr('vid.tutos') : tr('vid.title')} subtitle={tab === 'tutos' ? tr('vid.tutosSub', { count: TUTOS.length }) : tr('vid.subtitle', { count: ALL_VIDEOS.length })}>
      <Segmented label={tr('vid.view')} value={tab} onChange={(v) => setTab(v as 'themes' | 'tutos')}
        options={[{ value: 'themes', label: tr('vid.byTheme'), testID: 'vid-tab-themes' }, { value: 'tutos', label: tr('vid.tutos'), testID: 'vid-tab-tutos' }] as { value: 'themes' | 'tutos'; label: string; testID: string }[]} />
      {tab === 'themes' ? (
        <>
          <Text muted>{tr('vid.intro')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip label={`${tr('vid.all')} · ${ALL_VIDEOS.length}`} selected={topic === 'all'} onPress={() => setPicked('all')} testID="vid-topic-all" />
            {topics.map((k) => <Chip key={k} label={`${tr(`vid.topic.${k}` as TKey)} · ${count(k)}`} selected={topic === k} onPress={() => setPicked(k)} testID={`vid-topic-${k}`} />)}
          </View>
          {list.map((v) => <VideoWithArticles key={v.id} v={v} articles={articles} slugOf={slugOf} />)}
        </>
      ) : (
        <>
          <Text muted>{tr('vid.tutosIntro')}</Text>
          {tutoTopics.map((k) => (
            <View key={k} style={{ gap: spacing.sm }} testID={`tuto-group-${k}`}>
              <SectionTitle title={tr(`vid.topic.${k}` as TKey)} />
              {TUTOS.filter((v) => v.topic === k).map((v) => <VideoWithArticles key={v.id} v={v} articles={articles} slugOf={slugOf} />)}
            </View>
          ))}
          <Text variant="caption" muted>{tr('vid.firstAidNote')}</Text>
        </>
      )}
      <Card tone="soft">
        <Text variant="small">{tr('vid.library')}</Text>
        <ListRow icon="book-open" title={tr('lib.home.title')} subtitle={articles ? tr('vid.libraryCount', { count: articles.length }) : undefined} onPress={() => router.push('/library')} testID="vid-library" />
      </Card>
      <Text variant="caption" muted>{tr('vid.checked', { date: formatDate(VIDEOS_CHECKED_ON, { day: 'numeric', month: 'long', year: 'numeric' }) })}</Text>
      <Text variant="caption" muted>{tr('vid.notAdvice')}</Text>
    </Screen>
  );
}

export default function Videos() {
  return <VideosScreen />;
}
