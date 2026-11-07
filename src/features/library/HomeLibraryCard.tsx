/**
 * « Bibliothèque » sur l'accueil : le nombre d'articles, une recherche, et les thèmes (cycle, concevoir, enceinte,
 * bébé, enfant) avec leur nombre d'articles. Chaque thème ouvre ses catégories, puis ses sujets (écran /library).
 */
import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { Card, Chip, Icon, Text } from '@/components/ui';
import { CATEGORY_GROUPS } from '@/content/articles/groups';
import { useArticles, useCategories } from '@/lib/data/hooks';
import { countSubjects } from '@/lib/domain/librarySubjects';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function HomeLibraryCard() {
  const t = useTheme();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const [q, setQ] = useState('');
  const stats = useMemo(() => {
    const list = articles ?? [];
    const groups = CATEGORY_GROUPS.map((g) => {
      const ids = new Set((categories ?? []).filter((c) => !!c.slug && g.slugs.includes(c.slug)).map((c) => c.id));
      return { ...g, count: list.filter((a) => !!a.category_id && ids.has(a.category_id) && (a.journeys as string[]).includes(g.journey)).length };
    }).filter((g) => g.count > 0);
    return { total: list.length, themes: (categories ?? []).length, subjects: countSubjects(list), groups };
  }, [articles, categories]);
  const search = () => {
    const s = q.trim();
    setQ('');
    router.push(s ? { pathname: '/library', params: { q: s } } : '/library');
  };
  if (!articles) return null;
  return (
    <Card testID="home-library">
      <Tappable accessibilityRole="button" accessibilityLabel={tr('lib.home.openA11y', { count: stats.total })} onPress={() => router.push('/library')} testID="home-library-open"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <Icon name="book-open" color={t.colors.gold} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('lib.home.title')}</Text>
          <Text variant="caption" muted testID="home-library-count">{tr('lib.home.counts', { articles: stats.total, themes: stats.themes, subjects: stats.subjects })}</Text>
        </View>
        <Icon name="arrow-right" color={t.colors.primary} />
      </Tappable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs, borderRadius: 16, borderWidth: 0.5, borderColor: t.colors.border, paddingLeft: spacing.md, minHeight: MIN_TOUCH }}>
        <Icon name="search" size={16} color={t.colors.textMuted} />
        <TextInput value={q} onChangeText={setQ} placeholder={tr('lib.home.search')} placeholderTextColor={t.colors.textMuted} returnKeyType="search" onSubmitEditing={search}
          accessibilityLabel={tr('lib.home.search')} testID="home-library-search" style={{ flex: 1, minHeight: MIN_TOUCH, color: t.colors.text, fontSize: 16 }} />
      </View>
      <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{tr('lib.home.byTheme')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {stats.groups.map((g) => (
          <Chip key={g.journey} label={`${g.title} · ${g.count}`} onPress={() => router.push({ pathname: '/library', params: { journey: g.journey } })} testID={`home-library-${g.journey}`} />
        ))}
      </View>
    </Card>
  );
}
