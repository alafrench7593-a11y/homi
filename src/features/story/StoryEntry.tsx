/** Carte d'entrée « Mon histoire » (onglet Enfant) : visible, un appui ouvre le livre de l'enfant affiché. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { glassEdge } from '@/components/glass/GlassRim';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

export function StoryEntry({ childId, name }: { childId: string; name: string }) {
  const th = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${tr('story.entry')} · ${name}`} onPress={() => router.push(`/child/${childId}/story` as never)} testID="hub-story"
      style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: th.colors.surface, ...glassEdge(th) }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: th.tokens.action.fill }}>
        <Icon name="book-open" size={20} color={th.tokens.action.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="bold">{tr('story.hubTitle', { name })}</Text>
        <Text variant="small" muted>{tr('story.entrySub')}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={th.colors.textMuted} />
    </Tappable>
  );
}
