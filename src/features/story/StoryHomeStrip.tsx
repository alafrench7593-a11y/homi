/**
 * Accueil › « Au fil de nous » : l'étape du profil affiché seulement (femme seule pour le cycle, ventre selon la
 * semaine de grossesse, enfant selon SON âge, jumeaux et fratrie selon la famille renseignée). Bandeau discret et
 * compact (130 px), au-dessus des cartes utiles qu'il ne masque jamais ; touché, il ouvre la présentation.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useActivePregnancy, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { sceneFor, storyA11y, storyCaption } from '@/lib/domain/familyStory';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { FamilyStoryArt } from './FamilyStoryArt';

export const STORY_STRIP_HEIGHT = 130;

export function StoryHomeStrip() {
  const t = useTheme();
  const scope = useScope();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const child = scope.child;
  const input = useMemo(() => ({ scope: scope.scope, pregnancy, child, children: children ?? [] }), [scope.scope, pregnancy, child, children]);
  const scene = useMemo(() => sceneFor(input), [input]);
  const twinNames = child?.multiple_group ? (children ?? []).filter((c) => c.id !== child.id && c.multiple_group === child.multiple_group).map((c) => c.first_name) : [];
  const caption = storyCaption({
    ...input, childName: child?.first_name, twinNames,
    childAgeLabel: child ? childAge(child.birth_date).label : null,
    weeksLabel: pregnancy && scope.scope === 'pregnancy' ? pregnancyProgress(pregnancy.due_date).label : null,
  });
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`Au fil de nous. ${caption}. ${storyA11y(scene)} Ouvrir la présentation.`} onPress={() => router.push('/story' as never)} testID="home-story"
      style={{ height: STORY_STRIP_HEIGHT, flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1, alignSelf: 'center', gap: 4, paddingRight: spacing.xs }}>
        <Text variant="caption" muted style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>Au fil de nous</Text>
        <Text weight="bold" numberOfLines={2} testID="home-story-caption">{caption}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text variant="caption" weight="bold" color={t.colors.primary}>Notre histoire</Text>
          <Icon name="arrow-right" size={13} color={t.colors.primary} />
        </View>
      </View>
      <View style={{ width: '54%' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <FamilyStoryArt scene={scene} height={STORY_STRIP_HEIGHT} label={storyA11y(scene)} testID="home-story-art" />
      </View>
    </Tappable>
  );
}
