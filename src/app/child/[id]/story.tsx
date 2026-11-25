/**
 * Mon histoire (26/11/2026, gratuit) : le livre de vie de l'enfant, de la grossesse à ses 10 ans, construit avec ce que
 * les parents ont déjà noté (photos de l'album, « premières fois »). Deux lectures : Livre (une page par souvenir,
 * chapitres par âge) et Frise. Rien n'est inventé ; les photos restent privées (liens signés temporaires).
 */
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Image, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Button, Card, Icon, Segmented, Text } from '@/components/ui';
import { useChild } from '@/lib/data/hooks';
import { useChildPhotos, usePhotoUrl } from '@/lib/data/hooks-photos';
import { useMilestones } from '@/lib/data/hooks-family';
import { useLanguageEntries } from '@/lib/data/hooks-partiels2';
import { buildStory, storyCount, type StoryChapter, type StoryPage } from '@/lib/domain/childStory';
import { childAge } from '@/lib/domain/child';
import { todayISO } from '@/lib/domain/dates';
import { SectionIntro } from '@/features/aura/SectionIntro';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Mode = 'book' | 'timeline';

function PagePhoto({ path, height }: { path: string; height: number }) {
  const url = usePhotoUrl(path);
  const th = useTheme();
  return url.data ? <Image source={{ uri: url.data }} style={{ width: '100%', height, borderRadius: radius.lg }} resizeMode="cover" accessibilityIgnoresInvertColors />
    : <View style={{ width: '100%', height, borderRadius: radius.lg, backgroundColor: th.colors.surfaceAlt }} />;
}

function PageBody({ page, name, photoH }: { page: StoryPage; name: string; photoH: number }) {
  return (
    <View style={{ gap: spacing.xs }} testID={`story-page-${page.id}`}>
      {page.photoPath ? <PagePhoto path={page.photoPath} height={photoH} /> : null}
      <Text variant="caption" muted>{formatDate(page.date, { day: 'numeric', month: 'long', year: 'numeric' })}{page.ageLabel ? ` · ${page.ageLabel}` : ''}</Text>
      {page.source === 'word' ? <Text variant="caption" weight="bold">{tr(page.kind === 'sentence' ? 'story.sentence' : 'story.word')}</Text> : null}
      <Text variant="heading" weight="bold">{page.title ?? (page.source === 'photo' ? tr('story.photoTitle', { name }) : '')}</Text>
      {page.text ? <Text>{page.text}</Text> : <Text variant="small" muted>{tr(page.source === 'photo' ? 'story.noCaption' : 'story.noNote')}</Text>}
    </View>
  );
}

function ChapterCover({ c, name, childId }: { c: StoryChapter; name: string; childId: string }) {
  const th = useTheme();
  return (
    <View style={{ gap: spacing.xs, paddingVertical: spacing.sm }} testID={`story-chapter-${c.id}`}>
      <Text variant="caption" weight="bold" color={th.colors.primary}>{tr(`story.ch.${c.id}.age` as TKey)}</Text>
      <Text variant="title" accessibilityRole="header">{tr(`story.ch.${c.id}.title` as TKey, { name })}</Text>
      {!c.pages.length ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="small" muted>{tr('story.emptyChapter')}</Text>
          <Button label={tr('aura.intro.act.addPhoto')} icon="camera" size="sm" variant="secondary" onPress={() => router.push(`/child/${childId}/album` as never)} testID={`story-add-${c.id}`} />
        </View>
      ) : <Text variant="small" muted>{tr('story.count', { count: c.pages.length })}</Text>}
    </View>
  );
}

export default function ChildStory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const photos = useChildPhotos(id);
  const milestones = useMilestones(id);
  const words = useLanguageEntries(id ?? null);
  const th = useTheme();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('book');
  const [pageIdx, setPageIdx] = useState(0);
  const listRef = useRef<FlatList>(null);
  const name = child?.first_name ?? '';
  const chapters = useMemo(() => (child?.birth_date ? buildStory({
    birth: child.birth_date, today: todayISO(), photos: photos.data ?? [], milestones: milestones.data ?? [], words: words.data ?? [],
    ageLabel: (b, d) => childAge(b, d).label,
  }) : []), [child?.birth_date, photos.data, milestones.data, words.data]);
  // Livre : une couverture par chapitre, puis ses pages
  const book = useMemo(() => chapters.flatMap((c) => [{ kind: 'cover' as const, c, key: `c-${c.id}` }, ...c.pages.map((p) => ({ kind: 'page' as const, p, key: p.id }))]), [chapters]);
  const pageW = Math.min(width, 640) - spacing.md * 2;

  if (!child || photos.isLoading || milestones.isLoading) return <Screen back title={tr('story.title')}><Skeleton kind="card" rows={3} /></Screen>;
  const total = storyCount(chapters);
  return (
    <Screen back title={tr('story.title')} subtitle={tr('story.sub', { name })} scroll={mode === 'timeline'}>
      <SectionIntro section="story" childId={child.id} name={name} />
      <Segmented<Mode> label={tr('story.view')} value={mode} onChange={setMode}
        options={[{ value: 'book', label: tr('story.book'), testID: 'story-mode-book' }, { value: 'timeline', label: tr('story.timeline'), testID: 'story-mode-timeline' }]} />
      {!total ? (
        <EmptyState icon="book-open" title={tr('story.emptyTitle', { name })} body={tr('story.emptyBody')}
          action={{ label: tr('aura.intro.act.addPhoto'), icon: 'camera', onPress: () => router.push(`/child/${child.id}/album` as never) }} />
      ) : mode === 'book' ? (
        <View style={{ flex: 1, gap: spacing.sm }} testID="story-book">
          <FlatList ref={listRef} data={book} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(x) => x.key}
            snapToInterval={pageW + spacing.sm} decelerationRate="fast" contentContainerStyle={{ gap: spacing.sm }}
            onMomentumScrollEnd={(e) => setPageIdx(Math.round(e.nativeEvent.contentOffset.x / (pageW + spacing.sm)))}
            renderItem={({ item }) => (
              <Card style={{ width: pageW }}>
                {item.kind === 'cover' ? <ChapterCover c={item.c} name={name} childId={child.id} /> : <PageBody page={item.p} name={name} photoH={Math.round(pageW * 0.75)} />}
              </Card>
            )} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button label={tr('story.prev')} icon="arrow-left" size="sm" variant="ghost" disabled={pageIdx === 0}
              onPress={() => { const i = Math.max(0, pageIdx - 1); setPageIdx(i); listRef.current?.scrollToIndex({ index: i }); }} testID="story-prev" />
            <Text variant="caption" muted testID="story-progress">{tr('story.pageOf', { n: Math.min(pageIdx + 1, book.length), total: book.length })}</Text>
            <Button label={tr('story.next')} size="sm" variant="ghost" disabled={pageIdx >= book.length - 1}
              onPress={() => { const i = Math.min(book.length - 1, pageIdx + 1); setPageIdx(i); listRef.current?.scrollToIndex({ index: i }); }} testID="story-next" />
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.md }} testID="story-timeline">
          {chapters.map((c) => (
            <View key={c.id} style={{ gap: spacing.sm }}>
              <ChapterCover c={c} name={name} childId={child.id} />
              {c.pages.map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ alignItems: 'center', width: 18 }}>
                    <Icon name={p.source === 'photo' ? 'camera' : p.source === 'word' ? 'message-circle' : 'star'} size={14} color={th.colors.primary} />
                    <View style={{ flex: 1, width: 2, backgroundColor: th.colors.border, marginTop: 4 }} />
                  </View>
                  <Card style={{ flex: 1 }}><PageBody page={p} name={name} photoH={160} /></Card>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
      <Text variant="caption" muted center>{tr('story.privacy')}</Text>
    </Screen>
  );
}
