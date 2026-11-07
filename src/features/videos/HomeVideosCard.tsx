/**
 * Carte d'accueil « Vidéos & articles » : le nombre de vidéos officielles et les thèmes, chacun ouvrant /videos.
 * Aucune vidéo n'est chargée sur l'accueil (rien n'est demandé à YouTube tant qu'on n'appuie pas sur « Lire »).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { Card, Chip, Icon, Text } from '@/components/ui';
import { ALL_VIDEOS, TUTOS, orderedTopics } from '@/lib/domain/officialVideos';
import { useJourneyState } from '@/lib/data/hooks';

const JOURNEY_OF: Record<string, string> = { pregnancy: 'pregnant', baby: 'newborn', child: 'child', cycle: 'avoid', ttc: 'ttc' };
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export function HomeVideosCard() {
  const t = useTheme();
  const js = useJourneyState();
  const topics = orderedTopics(js.active.map((r) => JOURNEY_OF[r.type] ?? r.type)).slice(0, 5);
  return (
    <Card testID="home-videos">
      <Tappable accessibilityRole="button" onPress={() => router.push('/videos')} testID="home-videos-open"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <Icon name="play-circle" color={t.colors.gold} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('vid.title')}</Text>
          <Text variant="caption" muted>{tr('vid.homeCount', { count: ALL_VIDEOS.length })}</Text>
        </View>
        <Icon name="arrow-right" color={t.colors.primary} />
      </Tappable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
        <Chip icon="play-circle" label={tr('vid.tutosChip', { count: TUTOS.length })} onPress={() => router.push('/tutos')} testID="home-videos-tutos" />
        {topics.map((k) => <Chip key={k} label={tr(`vid.topic.${k}` as TKey)} onPress={() => router.push({ pathname: '/videos', params: { topic: k } })} testID={`home-videos-${k}`} />)}
      </View>
    </Card>
  );
}
