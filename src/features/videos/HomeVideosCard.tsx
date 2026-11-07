/**
 * Carte d'accueil « Vidéos & articles » : le nombre de vidéos officielles et les thèmes, chacun ouvrant /videos.
 * Aucune vidéo n'est chargée sur l'accueil (rien n'est demandé à YouTube tant qu'on n'appuie pas sur « Lire »).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { Card, Chip, Icon, Text } from '@/components/ui';
import { OFFICIAL_VIDEOS, VIDEO_TOPICS } from '@/lib/domain/officialVideos';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export function HomeVideosCard() {
  const t = useTheme();
  return (
    <Card testID="home-videos">
      <Tappable accessibilityRole="button" onPress={() => router.push('/videos')} testID="home-videos-open"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <Icon name="play-circle" color={t.colors.gold} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('vid.title')}</Text>
          <Text variant="caption" muted>{tr('vid.homeCount', { count: OFFICIAL_VIDEOS.length })}</Text>
        </View>
        <Icon name="arrow-right" color={t.colors.primary} />
      </Tappable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
        {VIDEO_TOPICS.map((k) => <Chip key={k} label={tr(`vid.topic.${k}` as TKey)} onPress={() => router.push({ pathname: '/videos', params: { topic: k } })} testID={`home-videos-${k}`} />)}
      </View>
    </Card>
  );
}
