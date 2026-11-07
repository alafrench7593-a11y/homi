/**
 * Carte vidéo officielle : rien n'est chargé depuis YouTube avant l'appui sur « Lire » (ni image, ni lecteur).
 * Ensuite la vidéo se lit DANS l'appli (16:9), avec la chaîne source affichée et un lien de secours vers YouTube.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { openLink } from '@/lib/links';
import { durationMinutes, watchUrl, type OfficialVideo } from '@/lib/domain/officialVideos';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { getLocale, t as tr, type TKey } from '@/i18n';
import { YouTubeFrame } from './YouTubeFrame';

export function VideoCard({ video, compact }: { video: OfficialVideo; compact?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const title = tr(`sol.v.${video.key}` as TKey);
  const by = tr(`sol.v.by.${video.by}` as TKey);
  const min = durationMinutes(video.dur);
  const meta = [by, min ? tr('vid.minutes', { count: min }) : null, video.kind === 'tuto' ? tr('vid.tutoTag') : null].filter(Boolean).join(' · ');
  return (
    <View style={{ gap: 6 }} testID={`video-${video.id}`}>
      <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#1f1a1a' }}>
        {playing && !failed ? (
          <YouTubeFrame id={video.id} title={title} lang={getLocale()} onError={() => setFailed(true)} />
        ) : (
          <Tappable accessibilityRole="button" accessibilityLabel={`${tr('sol.v.play')} : ${title}`} onPress={() => (failed ? openLink(watchUrl(video.id), toast) : setPlaying(true))}
            testID={`video-play-${video.id}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, padding: spacing.md }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={26} color={t.colors.gold} />
            </View>
            {!compact ? <Text weight="bold" color="#fff" style={{ textAlign: 'center' }}>{title}</Text> : null}
            <Text variant="caption" color="rgba(255,255,255,0.8)">{failed ? tr('sol.v.failed') : `${tr('sol.v.play')} · ${meta}`}</Text>
          </Tappable>
        )}
      </View>
      {compact || playing ? <Text variant="small" weight="bold">{title}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs }}>
        <Text variant="caption" muted style={{ flex: 1 }}>{tr('sol.v.source', { by })}</Text>
        {playing ? <Button label={tr('sol.v.onYoutube')} icon="external-link" size="sm" variant="ghost" onPress={() => openLink(watchUrl(video.id), toast)} /> : null}
      </View>
    </View>
  );
}
