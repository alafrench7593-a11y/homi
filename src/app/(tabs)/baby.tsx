/**
 * Onglet « Enfant » (route `/baby`), adapté au foyer (`childTabMode`) :
 *  - un enfant suivi → « Enfant » : alimentation, sommeil, croissance, santé, développement (glisser pour changer d'enfant) ;
 *  - une grossesse en cours sans enfant → « Grossesse » : les outils de la grossesse ;
 *  - ni l'un ni l'autre → l'onglet propose d'ajouter un enfant ou une grossesse (jamais un cul-de-sac).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { ProfileSwitcher } from '@/components/ProfileSwitcher';
import { Button, Icon, Text } from '@/components/ui';
import { HubScreen } from '@/features/hubs/HubScreen';
import { childTabMode } from '@/features/hubs/hubMap';
import { useActivePregnancy, useTrackedChildren } from '@/lib/data/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

function AddChildOrPregnancy() {
  const t = useTheme();
  return (
    <Screen account title={tr('nav.hub.child.title')} subtitle={tr('nav.childEmpty.sub')} tool={false} bottomInset={TAB_SCREEN_INSET}>
      <ProfileSwitcher testID="hub-baby-profiles" />
      <View testID="child-tab-empty" style={{ gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
          <Icon name="smile" size={24} color={t.colors.primary} />
        </View>
        <View style={{ gap: 4 }}>
          <Text variant="heading" accessibilityRole="header">{tr('nav.childEmpty.title')}</Text>
          <Text muted>{tr('nav.childEmpty.body')}</Text>
        </View>
        <Button label={tr('nav.childEmpty.addChild')} icon="plus" full testID="child-tab-add-child" onPress={() => router.push({ pathname: '/profiles/new', params: { kind: 'child' } })} />
        <Button label={tr('nav.childEmpty.addPregnancy')} icon="heart" variant="secondary" full testID="child-tab-add-pregnancy" onPress={() => router.push({ pathname: '/profiles/new', params: { kind: 'pregnancy' } })} />
      </View>
    </Screen>
  );
}

export default function ChildTab() {
  const childrenQ = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const mode = childTabMode({ children: childrenQ.data?.length ?? 0, pregnancy: !!pregnancy });
  if (mode === 'pregnancy') return <HubScreen hub="health" id="baby" themes={['pregnancy']} title="nav.hub.pregnancy.title" subtitle="nav.hub.pregnancy.sub" />;
  // Pendant le chargement des enfants, on n'affiche pas « ajouter un enfant » à tort
  if (mode === 'empty' && !childrenQ.isLoading) return <AddChildOrPregnancy />;
  return <HubScreen hub="baby" />;
}
