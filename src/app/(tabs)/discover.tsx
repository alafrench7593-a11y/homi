/** Découvrir : bibliothèque d'articles sourcés, vidéos validées, outils. */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import {} from '@/components/Family';
import { Card, Chip, Field, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { EmptyStateCard } from '@/components/ui-extra';
import { useActivePregnancy, useArticles, useCategories, useChildren, usePremium, useProfile, useRows } from '@/lib/data/hooks';
import { isLocked, suggestArticles } from '@/lib/domain/content';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Discover() {
  const t = useTheme();
  const { data: articles } = useArticles();
  const { data: categories } = useCategories();
  const { data: videos } = useRows<{ id: string; title: string }>(['videos'], { table: 'videos', filters: [{ col: 'status', op: 'eq', value: 'published' }] });
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const premium = usePremium();
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const forYou = useMemo(() => suggestArticles(articles ?? [], {
    journeys: profile?.journeys ?? [],
    weekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
    childAgesMonths: (children ?? []).map((c) => childAge(c.birth_date).months),
    postpartum: (profile?.journeys ?? []).includes('newborn'),
    multiple: !!pregnancy && pregnancy.multiplicity !== 'single',
  }, 3), [articles, profile, pregnancy, children]);

  const list = (articles ?? []).filter((a) => (!cat || a.category_id === cat) && (!q || norm(`${a.title} ${a.summary} ${a.tags.join(' ')}`).includes(norm(q))));

  return (
    <View style={{ flex: 1 }}>
      <Screen title="Découvrir" subtitle="Des informations claires, sourcées et datées." bottomInset={96}>
        <Field label="Rechercher" placeholder="Allaitement, péridurale, sommeil…" value={q} onChangeText={setQ} returnKeyType="search" />

        <Row wrap>
          <Card style={{ width: '48.5%', flexGrow: 1 }} tone="soft" onPress={() => router.push('/me')}><Icon name="heart" color={t.colors.primary} /><Text weight="bold" style={{ marginTop: 6 }}>Moi aussi</Text><Text variant="caption" muted>Post-partum, émotions, rééducation</Text></Card>
          <Card style={{ width: '48.5%', flexGrow: 1 }} tone="lavender" onPress={() => router.push('/scanner')}><Icon name="maximize" color={t.colors.lavender} /><Text weight="bold" style={{ marginTop: 6 }}>Scanner</Text><Text variant="caption" muted>Composition, précautions, rappels</Text></Card>
        </Row>
        <Row wrap>
          <Card style={{ width: '48.5%', flexGrow: 1 }} onPress={() => router.push('/names')}><Icon name="star" color={t.colors.gold} /><Text weight="bold" style={{ marginTop: 6 }}>Prénoms</Text><Text variant="caption" muted>Idées, favoris, vote</Text></Card>
          <Card style={{ width: '48.5%', flexGrow: 1 }} onPress={() => router.push('/emergency')}><Icon name="life-buoy" color={t.colors.danger} /><Text weight="bold" style={{ marginTop: 6 }}>Urgences</Text><Text variant="caption" muted>Numéros gratuits, 24 h/24</Text></Card>
        </Row>

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

        <Card>
          {list.length ? list.map((a) => (
            <ListRow
              key={a.id}
              icon={isLocked(a, premium) ? 'lock' : a.is_safety_critical ? 'shield' : 'book-open'}
              title={a.title}
              subtitle={a.summary}
              onPress={() => router.push(`/article/${a.slug}`)}
            />
          )) : <Text muted center style={{ padding: spacing.lg }}>Aucun article ne correspond à cette recherche.</Text>}
        </Card>

        <SectionTitle title="Vidéos pratiques" />
        {videos?.length ? (
          <Card>{videos.map((v) => <ListRow key={v.id} icon="play-circle" title={v.title} />)}</Card>
        ) : (
          <EmptyStateCard illustration="leaf" title="Bientôt des vidéos" text="Les gestes (portage, bain, allaitement, rééducation…) seront publiés uniquement après avoir été filmés ou validés par des professionnels, avec leur nom, leur qualification et la date de validation." />
        )}
      </Screen>
    </View>
  );
}
