/**
 * Découvrir : bibliothèque d'articles sourcés, vidéos validées, outils.
 * 30/11/2026 (outil 199) : « Recommandé pour toi » — articles choisis à partir des outils que le moteur déterministe
 * de personnalisation recommande (appelé en lecture seule), chacun avec sa raison ; jamais un article déjà enregistré.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Card, Chip, Field, Icon, ListRow, SectionTitle, Text } from '@/components/ui';
import { VideoCard } from '@/components/video/VideoCard';
import { ALL_VIDEOS, TUTOS } from '@/lib/domain/officialVideos';
import { EmptyStateCard } from '@/components/ui-extra';
import { EmptyState, ErrorView, Skeleton, VirtualList } from '@/components/States';
import { useActivePregnancy, useArticles, useCategories, useChildren, useFullArticles, usePremium, useProfile, useRows } from '@/lib/data/hooks';
import { isLocked, type ContentContext } from '@/lib/domain/content';
import { recommendArticles } from '@/lib/domain/contentRecommendations';
import { recommend, reasonText } from '@/lib/personalization';
import { useProfileFacts } from '@/features/homeToday/useRecommendations';
import { useUiStore } from '@/lib/store';
import { useUserId } from '@/lib/auth';
import { hasSubject, topSubjects } from '@/lib/domain/librarySubjects';
import { CATEGORY_GROUPS } from '@/content/articles/groups';
import { Tappable } from '@/components/Tappable';
import { GlassSurface } from '@/components/Glass';
import { tint } from '@/components/ToolGlyph';
import type { IconName } from '@/components/ui';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { childAge } from '@/lib/domain/child';
import { t as tr, type TKey } from '@/i18n';
import { ToolLinks } from '@/features/toolHub/ToolLinks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Library() {
  const params = useLocalSearchParams<{ q?: string; journey?: string; cat?: string; subject?: string }>();
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
  const [journey, setJourney] = useState<string | null>(typeof params.journey === 'string' ? params.journey : null);
  // Lien vers un thème (ex. « Sexualité pendant la grossesse ») : thème choisi d'après son identifiant lisible
  const catFromLink = typeof params.cat === 'string' ? (categories ?? []).find((c) => c.slug === params.cat)?.id ?? null : null;
  const activeCat = cat ?? catFromLink;
  // 3e niveau : le sujet (mot-clé des articles) à l'intérieur d'une catégorie
  const [subject, setSubject] = useState<string | null>(typeof params.subject === 'string' ? params.subject : null);

  // Recommandations personnalisées (199) : outils recommandés par le moteur → leurs articles, avec la raison
  const facts = useProfileFacts();
  const pinned = useUiStore((s) => s.toolPinned);
  const hiddenTools = useUiStore((s) => s.toolHidden);
  const me = useUserId();
  const { data: saved } = useRows<{ item_id: string }>(['favorites', 'articles', me ?? ''], me ? { table: 'favorites', filters: [{ col: 'user_id', op: 'eq', value: me }, { col: 'item_type', op: 'eq', value: 'article' }] } : null);
  const [moreForYou, setMoreForYou] = useState(false);
  const forYou = useMemo(() => {
    const ctx: ContentContext = {
      journeys: profile?.journeys ?? [],
      weekSA: pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null,
      childAgesMonths: (children ?? []).map((c) => childAge(c.birth_date).months),
      postpartum: (profile?.journeys ?? []).includes('newborn'),
      multiple: !!pregnancy && pregnancy.multiplicity !== 'single',
    };
    const recs = recommend(facts, { pinned, hidden: hiddenTools }, { max: 12 });
    return recommendArticles({ recommendations: recs, articles: articles ?? [], categories: categories ?? [], ctx, exclude: (saved ?? []).map((f) => f.item_id), n: 8 });
  }, [articles, categories, profile, pregnancy, children, facts, pinned, hiddenTools, saved]);

  // Recherche dans tout le texte des articles (pour trouver la réponse à une question), titres d'abord.
  // La liste ne contient pas le texte : il n'est téléchargé que lorsqu'une recherche est saisie.
  const nq = norm(q.trim());
  const fullQ = useFullArticles(!!nq);
  const bodies = useMemo(() => new Map((fullQ.data ?? []).map((a) => [a.id, a.body_md])), [fullQ.data]);
  const words = nq.split(/\s+/).filter((w) => w.length > 2);
  const score = (a: { id: string; title: string; summary: string; tags: string[] }) => {
    if (!nq) return 1;
    const head = norm(`${a.title} ${a.summary} ${a.tags.join(' ')}`);
    const body = norm(bodies.get(a.id) ?? '');
    if (head.includes(nq)) return 100;
    if (body.includes(nq)) return 50;
    const hits = words.filter((w) => head.includes(w)).length * 3 + words.filter((w) => body.includes(w)).length;
    return words.length && hits >= words.length ? hits : 0;
  };
  const inScope = (articles ?? []).filter((a) => (!activeCat || a.category_id === activeCat)
    && (!journey || (journey === 'parents_sleep' ? a.tags.includes('sommeil-parents') : (a.journeys as string[]).includes(journey))));
  const subjects = useMemo(() => (activeCat ? topSubjects(inScope) : []), [activeCat, inScope.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = inScope.filter((a) => (!subject || !activeCat || hasSubject(a, subject)) && score(a) > 0).sort((x, y) => score(y) - score(x));

  // Guide : parcours par défaut d'après le profil (enceinte, bébé, enfant, projet bébé)
  const profileJourney = pregnancy ? 'pregnant' : (children ?? []).some((c) => childAge(c.birth_date).months < 24) ? 'newborn' : (children ?? []).length ? 'child' : (profile?.journeys ?? []).includes('ttc') ? 'ttc' : (profile?.journeys ?? []).includes('avoid') ? 'avoid' : 'pregnant';
  const guideJourney = (CATEGORY_GROUPS.some((g) => g.journey === journey) ? journey : profileJourney) as (typeof CATEGORY_GROUPS)[number]['journey'];
  const group = CATEGORY_GROUPS.find((g) => g.journey === guideJourney)!;
  const guideCards = group.slugs.map((slug) => {
    const c = (categories ?? []).find((x) => x.slug === slug);
    if (!c) return null;
    const n = (articles ?? []).filter((a) => a.category_id === c.id && (a.journeys as string[]).includes(guideJourney)).length;
    return n ? { c, n } : null;
  }).filter(Boolean) as { c: { id: string; slug: string; label: string; icon: string | null }; n: number }[];
  const showGuide = !q && !activeCat;

  const bodiesPending = !!nq && !fullQ.data;
  const loading = (articlesQ.isLoading && !articles) || (bodiesPending && fullQ.isLoading);
  const failedQ = articlesQ.isError && !articles ? articlesQ : bodiesPending && fullQ.isError ? fullQ : null;
  const failed = !!failedQ;

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.xs }}>
      {articles ? (
        <TodaySummary title={tr('u1.lib.brief')} items={[
          { icon: 'book-open', value: String(articles.length), label: tr('u1.lib.articles') },
          { icon: 'heart', value: String(forYou.length), label: tr('u1.lib.forYouNow') },
          { icon: 'grid', value: categories ? String(categories.length) : '—', label: tr('u1.lib.themes') },
        ]} />
      ) : null}
      <Field label={tr('u1.lib.search')} placeholder={tr('u1.lib.searchPh')} value={q} onChangeText={setQ} returnKeyType="search" />

      {!q && !activeCat && !journey && forYou.length > 0 && (
        <View style={{ gap: spacing.sm }} testID="library-for-you">
          <SectionTitle title={tr('p2.lib.forYou')} subtitle={tr('p2.lib.forYouSub')} action={forYou.length > 3 ? (moreForYou ? tr('u1.appt.reduce') : tr('u1.appt.showAll')) : undefined} onAction={() => setMoreForYou((v) => !v)} />
          {(moreForYou ? forYou : forYou.slice(0, 3)).map(({ article: a, reason }) => (
            <Card key={a.id} tone="soft" onPress={() => router.push(`/article/${a.slug}`)} testID={`library-rec-${a.slug}`}>
              <Text weight="bold">{a.title}</Text>
              <Text variant="small" muted numberOfLines={3}>{a.summary}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Icon name="compass" size={14} color={t.colors.primary} />
                <Text variant="caption" color={t.colors.primary} style={{ flex: 1 }}>{reason ? reasonText(reason) : tr('p2.lib.byProfile')}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <ToolLinks ids={['mood', 'scan_food', 'scan_product', 'preg_names', 'emergency']} allOf="health" testID="library-tools" />


      {showGuide ? (
        <View style={{ gap: spacing.sm }} testID="library-guide">
          <SectionTitle title={tr('u1.lib.guide')} />
          <Text variant="small" muted>{tr('u1.lib.guideD')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORY_GROUPS.map((g) => <Chip key={g.journey} label={g.title} selected={guideJourney === g.journey} onPress={() => setJourney(g.journey)} testID={`guide-${g.journey}`} />)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {guideCards.map(({ c, n }) => (
              <View key={c.id} style={{ width: '48.5%' }}>
                <GlassSurface fill={t.colors.surface} depth={1} radius={20}>
                  <Tappable bare accessibilityRole="button" accessibilityLabel={tr('u1.lib.catA11y', { label: c.label, count: n })} testID={`guide-cat-${c.slug}`}
                    onPress={() => { setJourney(guideJourney); setCat(c.id); setSubject(null); }} style={{ padding: spacing.md, gap: 6, minHeight: 104 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.gold, t.isDark ? 0.22 : 0.14) }}>
                      <Icon name={(c.icon ?? 'book-open') as IconName} size={16} color={t.colors.gold} />
                    </View>
                    <Text weight="bold" numberOfLines={2}>{c.label}</Text>
                    <Text variant="caption" muted>{tr('u1.ta.count', { count: n })}</Text>
                  </Tappable>
                </GlassSurface>
              </View>
            ))}
          </View>
        </View>
      ) : activeCat ? (
        <View style={{ gap: spacing.xs }}>
        <Tappable accessibilityRole="button" onPress={() => { setCat(null); setSubject(null); router.setParams({ cat: undefined } as never); }} testID="guide-back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
          <Icon name="arrow-left" size={16} color={t.colors.primary} />
          <Text weight="bold" color={t.colors.primary}>{(categories ?? []).find((c) => c.id === activeCat)?.label ?? tr('u1.lib.theme')} · {tr('u1.ta.count', { count: list.length })}</Text>
        </Tappable>
        {subjects.length ? (
          <View style={{ gap: 4 }} testID="library-subjects">
            <Text variant="caption" muted>{tr('lib.subjects')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip label={tr('u1.lib.all')} selected={!subject} onPress={() => setSubject(null)} />
              {subjects.map((sj) => <Chip key={sj.key} label={`${sj.label} · ${sj.count}`} selected={subject === sj.key} onPress={() => setSubject(subject === sj.key ? null : sj.key)} testID={`library-subject-${sj.key}`} />)}
            </View>
          </View>
        ) : null}
        </View>
      ) : null}

      <SectionTitle title={tr('art.byJourney')} />
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        {(['ttc', 'avoid', 'pregnant', 'newborn', 'child'] as const).map((j) => <Chip key={j} label={tr(`art.j.${j}`)} selected={journey === j} onPress={() => setJourney(journey === j ? null : j)} />)}
        <Chip label={tr('art.parentsSleep')} selected={journey === 'parents_sleep'} onPress={() => setJourney(journey === 'parents_sleep' ? null : 'parents_sleep')} />
      </ScrollView>
      <SectionTitle title={tr('u1.lib.allThemes')} />
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        <Chip label={tr('u1.lib.all')} selected={!activeCat} onPress={() => { setCat(null); router.setParams({ cat: undefined } as never); }} />
        {(categories ?? []).map((c) => <Chip key={c.id} label={c.label} selected={activeCat === c.id} onPress={() => { setSubject(null); if (activeCat === c.id) { setCat(null); router.setParams({ cat: undefined } as never); } else setCat(c.id); }} />)}
      </ScrollView>
      {loading ? <Skeleton rows={5} /> : null}
      {failedQ ? <ErrorView error={failedQ.error} onRetry={() => void failedQ.refetch()} title={tr('u1.lib.loadError')} /> : null}
    </View>
  );

  const footer = (
    <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
      <SectionTitle title={tr('art.videos')} />
      {/* Vidéos officielles lues dans l'appli (07/11/2026) ; les vidéos maison publiées, s'il y en a, restent listées */}
      <Card testID="library-videos">
        <View style={{ paddingHorizontal: spacing.md }}>
          <ToolLinks ids={['videos', 'videos.tutos']} status={{ videos: tr('vid.librarySub', { count: ALL_VIDEOS.length }), 'videos.tutos': tr('vid.tutosSub', { count: TUTOS.length }) }} testID="library-videos-open" />
        </View>
        <MotionList style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md }}>
          {ALL_VIDEOS.slice(0, 2).map((v) => <MotionItem key={v.id}><VideoCard key={v.id} video={v} compact /></MotionItem>)}
        </MotionList>
      </Card>
      {videos?.length ? <Card><MotionList>{videos.map((v) => <MotionItem key={v.id}><ListRow key={v.id} icon="play-circle" title={v.title} /></MotionItem>)}</MotionList></Card> : null}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Screen back title={tr('u1.lib.title')} subtitle={tr('u1.lib.subtitle')} scroll={false} padded={false}
        action={{ label: tr('u1.lib.askArticles'), icon: 'cpu', onPress: () => router.push({ pathname: '/assistant/local', params: q ? { q } : {} } as never), testID: 'library-ask' }}>
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
                subtitle={`${a.summary} · ${tr(`art.status.${a.editorial_status ?? 'to_review'}` as TKey)}`}
                onPress={() => router.push(`/article/${a.slug}`)}
              />
            </Card>
          )}
          ListEmptyComponent={loading || failed ? null : q || activeCat || journey ? (
            <EmptyState icon="search" title={tr('u1.lib.noMatch')} body={tr('u1.lib.noMatchD')} action={{ label: tr('u1.lib.seeAll'), icon: 'refresh-cw', onPress: () => { setQ(''); setCat(null); setJourney(null); router.setParams({ cat: undefined, journey: undefined } as never); } }} />
          ) : (
            <EmptyState icon="book-open" title={tr('u1.lib.noneYet')} body={tr('u1.lib.noneYetD')} action={{ label: tr('u1.lib.askQuestion'), icon: 'message-circle', onPress: () => router.push('/assistant/chat' as never) }} />
          )}
          ListFooterComponent={footer}
        />
      </Screen>
    </View>
  );
}
