/** Découvrir : bibliothèque d'articles sourcés, vidéos validées, outils. */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Card, Chip, Field, Icon, ListRow, SectionTitle, Text } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { useActivePregnancy, useArticles, useCategories, useChildren, usePremium, useProfile, useRows } from '@/lib/data/hooks';
import { isLocked, suggestArticles } from '@/lib/domain/content';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Library() {
  const params = useLocalSearchParams<{ q?: string }>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const articlesQ = useArticles();
  const { data: articles } = articlesQ;
  const { data: categories } = useCategories();
  const { data: videos } = useRows<{ id: string; title: string }>(['videos'], { table: 'videos', filters: [{ col: 'status', op: 'eq', value: 'published' }] });
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const premium = usePremium();
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState(typeof params.q === 'string' ? params.q : '');

  const forYou = useMemo(() => suggestArticles(articles ?? [], {
    journeys: profile?.journeys ?? [],
    weekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
    childAgesMonths: (children ?? []).map((c) => childAge(c.birth_date).months),
    postpartum: (profile?.journeys ?? []).includes('newborn'),
    multiple: !!pregnancy && pregnancy.multiplicity !== 'single',
  }, 3), [articles, profile, pregnancy, children]);

  const list = (articles ?? []).filter((a) => (!cat || a.category_id === cat) && (!q || norm(`${a.title} ${a.summary} ${a.tags.join(' ')}`).includes(norm(q))));

  const loading = articlesQ.isLoading && !articles;
  const failed = articlesQ.isError && !articles;

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
      <Field label="Rechercher" placeholder="Allaitement, péridurale, sommeil…" value={q} onChangeText={setQ} returnKeyType="search" />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {([
          ['heart', 'Moi aussi', 'Post-partum, émotions, rééducation', '/me', t.colors.heart],
          ['maximize', 'Scanner', 'Composition, précautions, rappels', '/scanner', t.colors.lavender],
          ['star', 'Prénoms', 'Idées, favoris, vote', '/names', t.colors.gold],
          ['life-buoy', 'Urgences', 'Numéros gratuits, 24 h/24', '/emergency', t.colors.danger],
        ] as const).map(([icon, title, sub, href, color]) => (
          <View key={title} style={{ width: '48.5%' }}>
            <Card onPress={() => router.push(href)} accessibilityLabel={`${title} : ${sub}`} style={{ minHeight: 118 }}>
              <Icon name={icon} color={color} />
              <Text variant="heading" style={{ marginTop: 6 }}>{title}</Text>
              <Text variant="caption" muted>{sub}</Text>
            </Card>
          </View>
        ))}
      </View>

      {!q && !cat && forYou.length > 0 && (
        <>
          <SectionTitle title="Pour vous en ce moment" />
          {forYou.map((a) => (
            <Card key={a.id} tone="soft" onPress={() => router.push(`/article/${a.slug}`)}>
              <Text weight="bold">{a.title}</Text>
              <Text variant="small" muted>{a.summary}</Text>
            </Card>
          ))}
        </>
      )}

      <SectionTitle title="Thèmes" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        <Chip label="Tout" selected={!cat} onPress={() => setCat(null)} />
        {(categories ?? []).map((c) => <Chip key={c.id} label={c.label} selected={cat === c.id} onPress={() => setCat(cat === c.id ? null : c.id)} />)}
      </ScrollView>
      {loading ? <Skeleton rows={5} /> : null}
      {failed ? <ErrorView error={articlesQ.error} onRetry={() => void articlesQ.refetch()} title="Impossible d’afficher les articles" /> : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
      <SectionTitle title="Vidéos pratiques" />
      {videos?.length ? (
        <Card>{videos.map((v) => <ListRow key={v.id} icon="play-circle" title={v.title} />)}</Card>
      ) : (
        <EmptyStateCard illustration="leaf" title="Bientôt des vidéos" text="Les gestes (portage, bain, allaitement, rééducation…) seront publiés uniquement après avoir été filmés ou validés par des professionnels, avec leur nom, leur qualification et la date de validation." />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Screen back title="Bibliothèque" subtitle="Des informations claires, sourcées et datées." scroll={false} padded={false}>
        <VirtualList
          data={loading || failed ? [] : list}
          keyExtractor={(a) => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.xs }}
          ListHeaderComponent={header}
          renderItem={({ item: a }) => (
            <Card style={{ paddingVertical: spacing.xs }}>
              <ListRow
                icon={isLocked(a, premium) ? 'lock' : a.is_safety_critical ? 'shield' : 'book-open'}
                title={a.title}
                subtitle={a.summary}
                onPress={() => router.push(`/article/${a.slug}`)}
              />
            </Card>
          )}
          ListEmptyComponent={loading || failed ? null : q || cat ? (
            <EmptyState icon="search" title="Aucun article ne correspond à cette recherche." body="Essayez un autre mot ou un autre thème." action={{ label: 'Voir tous les articles', icon: 'refresh-cw', onPress: () => { setQ(''); setCat(null); } }} />
          ) : (
            <EmptyState icon="book-open" title="Aucun article pour l’instant" body="Les articles arrivent bientôt. Vous pouvez poser vos questions à l’assistant en attendant." action={{ label: 'Poser une question', icon: 'message-circle', onPress: () => router.push('/assistant/chat' as never) }} />
          )}
          ListFooterComponent={footer}
        />
      </Screen>
    </View>
  );
}
