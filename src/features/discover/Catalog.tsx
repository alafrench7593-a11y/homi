/**
 * « Découvrir HOMI » — catalogue de TOUS les outils, rangés par chapitre. Chaque tuile s'ouvre DEPUIS SA POSITION
 * vers sa démo (Morph : la surface s'agrandit, un reflet longe son bord), puis revient à sa place au retour ; le
 * catalogue reste monté sous la démo, sa position de défilement est donc conservée.
 */
import React, { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen, useScreenScroll } from '@/components/Screen';
import { Button, Chip, Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { MorphSource } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius, spacing } from '@/theme/tokens';
import { CHAPTERS, DISCOVER_TOOLS, toolsOfChapter, type ChapterKey, type DiscoverTool } from './model';
import { chapterTitle, toolName, usagePhrase } from './texts';
import { useDiscoverNav } from './useDiscoverNav';

export const morphIdOf = (key: string) => `discover-${key}`;

function Tile({ tool, onOpen }: { tool: DiscoverTool; onOpen: () => void }) {
  const t = useTheme();
  const name = toolName(tool.key);
  const custom = tool.demo.kind === 'custom';
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1 }}>
      <MorphSource id={morphIdOf(tool.key)} onOpen={onOpen} radius={radius.lg} sheen accessibilityLabel={tr('kn.cat.openA11y', { tool: name })} testID={`discover-tile-${tool.key}`}
        style={{ minHeight: 118, padding: spacing.sm, borderRadius: radius.lg, gap: 6, backgroundColor: t.material.surfaces.matte.fill, borderWidth: 1, borderColor: custom ? alpha(t.tokens.accent.glow[0], 0.55) : t.material.surfaces.matte.edge }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(t.tokens.accent.glow[0], t.isDark ? 0.16 : 0.14) }}>
            <Icon name={tool.icon} size={17} color={t.tokens.accent.glow[0]} />
          </View>
          {custom ? <Icon name="star" size={14} color={t.tokens.accent.glow[0]} /> : <Icon name="play-circle" size={14} color={t.colors.textMuted} />}
        </View>
        <Text weight="bold" variant="small">{name}</Text>
        <Text variant="caption" muted numberOfLines={2} intentionalTruncation>{usagePhrase(tool.key)}</Text>
        {custom ? <Text variant="caption" color={t.tokens.accent.glow[0]}>{tr('kn.cat.custom')}</Text> : null}
      </MorphSource>
    </View>
  );
}

function CatalogBody() {
  const nav = useDiscoverNav();
  const scroll = useScreenScroll();
  const sections = useRef<Partial<Record<ChapterKey, View | null>>>({});
  return (
    <View style={{ gap: spacing.lg }} testID="discover-catalog-body">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }} accessibilityLabel={tr('kn.cat.jump')}>
        {CHAPTERS.map((c) => <Chip key={c.key} label={chapterTitle(c.key)} icon={c.icon} onPress={() => void scroll.scrollToNode(sections.current[c.key] as never)} testID={`discover-jump-${c.key}`} />)}
      </ScrollView>
      {CHAPTERS.map((c) => {
        const tools = toolsOfChapter(c.key);
        return (
          <View key={c.key} ref={(r) => { sections.current[c.key] = r; }} collapsable={false} style={{ gap: spacing.sm }} testID={`discover-section-${c.key}`}>
            <Text variant="heading" accessibilityRole="header">{chapterTitle(c.key)}</Text>
            <Text variant="small" muted>{tr('kn.ch.tools', { count: tools.length })}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {tools.map((x) => <Tile key={x.key} tool={x} onOpen={() => nav.openTool(x.key)} />)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function DiscoverCatalog() {
  const nav = useDiscoverNav();
  return (
    <Screen back title={tr('kn.cat.title')} subtitle={tr('kn.cat.sub', { count: DISCOVER_TOOLS.length })} tool={false}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label={tr('kn.prev')} icon="chevron-left" variant="secondary" onPress={nav.backToKeynote} style={{ flex: 1 }} testID="discover-catalog-prev" />
          <Button label={tr('kn.start')} iconRight="arrow-right" onPress={nav.exit} style={{ flex: 1 }} testID="discover-catalog-start" />
        </View>
      }>
      <CatalogBody />
    </Screen>
  );
}
