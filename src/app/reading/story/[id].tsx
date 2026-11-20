/**
 * 134 — Lecture d'une histoire à l'écran : grand texte (trois tailles), mode nuit (thème nuit très tamisé, rétabli en
 * quittant l'écran), puis « Noter dans le journal de lecture » (133) pour l'enfant choisi.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';
import { Button, Chip, Row, Text } from '@/components/ui';
import { getLocale, t as tr, type TKey } from '@/i18n';
import { useUiStore } from '@/lib/store';
import { bandKey, isStoryId, readingMinutes, STORIES, storyText } from '@/content/stories';
import { ReadingEditor, useReadingChild } from '@/features/reading/ui';
import { spacing } from '@/theme/tokens';

const SIZES = [{ key: 'm', font: 22, line: 34 }, { key: 'l', font: 27, line: 41 }, { key: 'xl', font: 32, line: 48 }] as const;

export default function StoryReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { children, child, setChild } = useReadingChild();
  const nightMode = useUiStore((s) => s.nightMode);
  const setNightMode = useUiStore((s) => s.setNightMode);
  const [size, setSize] = useState(0);
  const [open, setOpen] = useState(false);
  // Mode nuit choisi ici : rétabli en quittant la lecture
  useEffect(() => () => setNightMode(false), [setNightMode]);
  if (!isStoryId(id)) return <Screen back title={tr('st.title')}><EmptyState icon="book" title={tr('st.notFound')} body={tr('st.notFoundBody')} /></Screen>;
  const meta = STORIES.find((s) => s.id === id)!;
  const text = storyText(id, getLocale());
  const s = SIZES[size];
  return (
    <Screen back title={text.title} subtitle={tr('st.readerSub', { band: tr(bandKey(meta.band) as TKey), count: readingMinutes(text) })} tool={false}>
      <Row wrap>
        <Chip label={tr('st.night')} icon="moon" selected={nightMode} onPress={() => setNightMode(!nightMode)} testID="st-night" />
        <Chip label={tr('st.smaller')} icon="minus" onPress={() => setSize(Math.max(0, size - 1))} testID="st-smaller" />
        <Chip label={tr('st.bigger')} icon="plus" onPress={() => setSize(Math.min(SIZES.length - 1, size + 1))} testID="st-bigger" />
      </Row>
      <View style={{ gap: spacing.lg, paddingVertical: spacing.md }} testID="st-text">
        {text.paras.map((p, i) => (
          <Text key={i} style={{ fontSize: s.font, lineHeight: s.line }} accessibilityRole="text">{p}</Text>
        ))}
      </View>
      <Text variant="caption" muted center>{tr('st.end')}</Text>
      {child ? (
        <>
          {children.length > 1 ? (
            <Row wrap>{children.map((c) => <Chip key={c.id} label={c.first_name} selected={child.id === c.id} onPress={() => setChild(c.id)} testID={`st-child-${c.id}`} />)}</Row>
          ) : null}
          <Button label={tr('st.log', { name: child.first_name })} icon="book-open" onPress={() => setOpen(true)} testID="st-log" />
          <ReadingEditor visible={open} onClose={() => { setOpen(false); }} child={child} initial={null}
            preset={{ title: text.title, story_key: id, minutes: readingMinutes(text) }} />
        </>
      ) : null}
      <Button label={tr('st.back')} icon="book" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
