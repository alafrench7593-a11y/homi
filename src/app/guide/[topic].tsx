/**
 * Guide thématique : les fiches de la bibliothèque rangées par besoin (maladies, urgences, hygiène, sport…).
 * Les articles restent ceux de la bibliothèque (mêmes sources, même statut de relecture) ; ici on ne fait que les
 * ranger pour qu'une question du quotidien trouve sa fiche en deux gestes.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Card, Icon, ListRow, SectionTitle, Text } from '@/components/ui';
import { GUIDE_BY_ID, guideSlugs } from '@/content/guides';
import { useArticles, useChild } from '@/lib/data/hooks';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr, type TKey } from '@/i18n';

/** Âge corrigé (semaines) d'un bébé né avant terme : âge réel moins les semaines manquantes jusqu'à 40 SA. */
export function correctedAgeWeeks(birthDate: string, termWeeks: number | null | undefined, now = new Date()): { real: number; corrected: number } | null {
  const born = Date.parse(birthDate);
  if (!Number.isFinite(born)) return null;
  const real = Math.max(0, Math.floor((now.getTime() - born) / (7 * 86400000)));
  if (termWeeks == null || termWeeks >= 40) return { real, corrected: real };
  return { real, corrected: Math.max(0, real - (40 - termWeeks)) };
}

export default function GuideScreen() {
  const t = useTheme();
  const { topic, child: childId } = useLocalSearchParams<{ topic: string; child?: string }>();
  const guide = typeof topic === 'string' ? GUIDE_BY_ID[topic] : undefined;
  const { data: articles, isLoading } = useArticles();
  const child = useChild(typeof childId === 'string' ? childId : null);
  const bySlug = useMemo(() => new Map((articles ?? []).map((a) => [a.slug, a])), [articles]);
  const total = guide ? guideSlugs(guide).filter((s) => bySlug.has(s)).length : 0;
  const corrected = guide?.id === 'neonat' && child ? correctedAgeWeeks(child.birth_date, child.birth_term_weeks) : null;

  if (!guide) return <Screen back title={tr('gd.readAll')}><EmptyState icon="book-open" title={tr('gd.empty')} /></Screen>;
  const k = (s: string) => `gd.${guide.id}.${s}` as TKey;

  return (
    <Screen back title={tr(k('title'))} subtitle={total ? tr('gd.articles', { count: total }) : undefined}>
      <Text muted>{tr(k('intro'))}</Text>
      {guide.banner === 'emergency' && <Banner tone="danger">{tr('gd.banner.emergency')}</Banner>}
      {guide.banner === 'health' && <Banner tone="info">{tr('gd.banner.health')}</Banner>}
      {guide.banner === 'gentle' && <Banner tone="info" icon="heart">{tr('gd.banner.gentle')}</Banner>}
      {corrected && (
        <Card tone="soft" testID="guide-corrected-age">
          <Text weight="bold">{tr('gd.neonat.corrected')} · {child?.first_name}</Text>
          <Text>{tr('gd.neonat.correctedValue', { weeks: corrected.corrected, real: `${corrected.real} sem.` })}</Text>
          <Text variant="caption" muted>{tr('gd.neonat.correctedHint')}</Text>
        </Card>
      )}
      {isLoading && !articles ? <Skeleton rows={4} /> : guide.sections.map((s) => {
        const rows = s.slugs.map((slug) => bySlug.get(slug)).filter((a): a is NonNullable<typeof a> => !!a);
        if (!rows.length && !s.tool) return null;
        return (
          <View key={s.key} style={{ gap: spacing.xs }} testID={`guide-section-${s.key}`}>
            <SectionTitle title={tr(k(s.key))} />
            {s.tool && (
              <Card tone="soft" onPress={() => router.push(s.tool!.href as never)} accessibilityLabel={tr(s.tool.label as TKey)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name={s.tool.icon} color={t.colors.primary} />
                  <Text weight="bold">{tr(s.tool.label as TKey)}</Text>
                </View>
              </Card>
            )}
            {rows.length > 0 && (
              <Card padded={false}>
                {rows.map((a) => (
                  <ListRow key={a.id} icon={a.is_safety_critical ? 'alert-circle' : 'file-text'} title={a.title} subtitle={a.summary} onPress={() => router.push(`/article/${a.slug}`)} testID={`guide-article-${a.slug}`} />
                ))}
              </Card>
            )}
          </View>
        );
      })}
      <Text variant="caption" muted>{tr('gd.banner.health')}</Text>
    </Screen>
  );
}
