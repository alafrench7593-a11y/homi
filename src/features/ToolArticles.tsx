/**
 * « Pour aller plus loin » : en bas de chaque outil, les 3 articles qui vont avec, et une question toute prête
 * pour l'assistant local. Repliable, pour que l'outil reste simple.
 */
import { Tappable } from '@/components/Tappable';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chip, Icon, ListRow, Text } from '@/components/ui';
import { useArticles, useCategories } from '@/lib/data/hooks';
import { articlesForTool, TOOL_TOPICS } from '@/lib/domain/toolArticles';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function ToolArticles({ toolId }: { toolId: string }) {
  const topic = TOOL_TOPICS[toolId];
  if (!topic) return null;
  return <Inner toolId={toolId} ask={topic.ask} />;
}

function Inner({ toolId, ask }: { toolId: string; ask: string }) {
  const t = useTheme();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const [open, setOpen] = useState(true);
  const picks = useMemo(() => articlesForTool(toolId, articles ?? [], categories), [toolId, articles, categories]);
  if (!picks.length) return null;
  return (
    <View
      testID={`tool-articles-${toolId}`}
      style={{ marginTop: spacing.md, borderRadius: 18, borderWidth: 1, borderColor: t.isDark ? 'rgba(229,193,144,0.28)' : 'rgba(168,135,89,0.22)', padding: spacing.md, gap: spacing.sm }}
    >
      <Tappable onPress={() => setOpen((v) => !v)} pressScale={0.99} hoverLift={0} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={tr('u1.ta.a11y')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }} hitSlop={6} testID="tool-articles-toggle">
        <Icon name="book-open" size={18} color={t.colors.gold} />
        <Text weight="bold" style={{ flex: 1 }}>{tr('u1.ta.title')}</Text>
        <Text variant="caption" muted>{open ? tr('u1.ta.collapse') : tr('u1.ta.count', { count: picks.length })}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.colors.textMuted} />
      </Tappable>
      {open ? (
        <>
          {picks.map((a) => (
            <ListRow key={a.id} icon="file-text" title={a.title} onPress={() => router.push(`/article/${a.slug}` as never)} testID={`tool-article-${a.slug}`} />
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Chip icon="message-circle" label={ask} onPress={() => router.push({ pathname: '/assistant/local', params: { q: ask } } as never)} testID="tool-articles-ask" />
            <Chip icon="edit-3" label={tr('u1.ta.ask')} onPress={() => router.push('/assistant/local' as never)} testID="tool-articles-own" />
          </View>
        </>
      ) : null}
    </View>
  );
}
