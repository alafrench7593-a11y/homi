/**
 * Démo individuelle d'un outil : nom, phrase d'usage, aperçu animé (UN geste → SON résultat), « Rejouer »,
 * conditions d'accès (Premium, offre IA, rôle nounou, parcours — src/lib/premium/access.ts), lien vers la vraie
 * destination, outil précédent / suivant. Ouverte depuis une tuile du catalogue : `MorphTarget` garde l'identifiant de
 * la tuile d'ORIGINE, pour que la surface revienne vers elle au retour, même après « Suivant ».
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { MorphTarget } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, spacing } from '@/theme/tokens';
import { morphIdOf } from './Catalog';
import { DISCOVER_BY_KEY, neighbourTool, toolAccessInfo } from './model';
import { RealLink } from './RealLink';
import { ToolDemo } from './ToolDemo';
import { accessLines, chapterTitle, toolName, usagePhrase } from './texts';
import { useDiscoverNav } from './useDiscoverNav';

export function DiscoverToolScreen() {
  const t = useTheme();
  const nav = useDiscoverNav();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const origin = useRef(id ?? '');
  const [key, setKey] = useState(id ?? '');
  const [token, setToken] = useState(0);
  const tool = DISCOVER_BY_KEY[key];
  if (!tool) {
    return (
      <Screen back title={tr('kn.title')} tool={false}>
        <Banner tone="warning">{tr('kn.demo.notFound')}</Banner>
        <Button label={tr('kn.allTools')} icon="grid" onPress={nav.openCatalog} />
      </Screen>
    );
  }
  const name = toolName(key);
  const move = (dir: 1 | -1) => {
    const next = neighbourTool(key, dir);
    setKey(next);
    setToken((n) => n + 1);
    router.setParams({ id: next });
  };
  return (
    <MorphTarget id={morphIdOf(origin.current)} testID="discover-tool-screen">
      <Screen back title={name} subtitle={chapterTitle(tool.chapter)} tool={false}
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label={tr('kn.prev')} accessibilityLabel={tr('kn.demo.prevTool')} icon="chevron-left" variant="secondary" onPress={() => move(-1)} style={{ flex: 1 }} testID="discover-tool-prev" />
            <Button label={tr('kn.next')} accessibilityLabel={tr('kn.demo.nextTool')} iconRight="chevron-right" variant="secondary" onPress={() => move(1)} style={{ flex: 1 }} testID="discover-tool-next" />
          </View>
        }>
        <Text testID="discover-tool-usage">{usagePhrase(key)}</Text>
        <ToolDemo key={key} tool={tool} token={token} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          <Button label={tr('kn.demo.replay')} accessibilityLabel={tr('kn.demo.replayA11y', { tool: name })} icon="rotate-ccw" variant="secondary" size="sm" onPress={() => setToken((n) => n + 1)} testID="discover-replay" />
          <Button label={tr('kn.allTools')} icon="grid" variant="ghost" size="sm" onPress={() => (router.canGoBack() ? router.back() : nav.openCatalog())} testID="discover-tool-catalog" />
        </View>
        <Text variant="small" muted>{tr('kn.demo.isolated')}</Text>
        <Card>
          <View style={{ gap: spacing.xs }} testID="discover-access">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Icon name="key" size={16} color={t.tokens.accent.glow[0]} />
              <Text weight="bold">{tr('kn.acc.title')}</Text>
            </View>
            {accessLines(toolAccessInfo(key)).map((l, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.xs }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 8, backgroundColor: alpha(t.colors.text, 0.5) }} />
                <Text variant="small" style={{ flex: 1 }}>{l}</Text>
              </View>
            ))}
          </View>
        </Card>
        <RealLink toolKey={key} session={nav.session} />
      </Screen>
    </MorphTarget>
  );
}
