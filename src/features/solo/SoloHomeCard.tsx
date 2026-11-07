/**
 * Carte d'accueil « Maman solo » : visible seulement quand la situation familiale est « seule avec mes enfants ».
 * Trois accès directs : mon cercle d'aide, les aides, je décroche.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, Chip, Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useProfile } from '@/lib/data/hooks';
import { useSupportCircle } from '@/lib/data/hooks-mental';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function SoloHomeCard() {
  const t = useTheme();
  const profile = useProfile().data;
  const circle = useSupportCircle().data ?? [];
  if (profile?.family_situation !== 'solo') return null;
  return (
    <Card testID="home-solo">
      <Tappable accessibilityRole="button" onPress={() => router.push('/family/solo')} testID="home-solo-open"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <Icon name="heart" color={t.colors.gold} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('tool.solo_parent')}</Text>
          <Text variant="small" muted>{circle.length ? tr('sol.home.circle', { count: circle.length }) : tr('sol.home.noCircle')}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Tappable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
        <Chip icon="users" label={tr('sol.home.ask')} onPress={() => router.push('/family/solo')} testID="home-solo-ask" />
        <Chip icon="moon" label={tr('tool.offduty')} onPress={() => router.push('/family/offduty')} />
        <Chip icon="folder" label={tr('sol.home.aids')} onPress={() => router.push('/family/solo')} />
      </View>
    </Card>
  );
}
