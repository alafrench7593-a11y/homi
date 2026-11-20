/**
 * 134 — Bibliothèque d'histoires : 12 histoires courtes originales écrites à l'avance pour HOMI, par tranche d'âge
 * (2–4, 4–6, 6–10 ans), dans la langue de l'application. Lecture à l'écran en grand texte, mode nuit. Aucune IA.
 */
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Chip, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { getLocale, t as tr, type TKey } from '@/i18n';
import { useChildren } from '@/lib/data/hooks';
import { childAge } from '@/lib/domain/child';
import { bandForMonths, bandKey, readingMinutes, STORIES, STORY_BANDS, storyText, type StoryBand } from '@/content/stories';

export default function Stories() {
  const params = useLocalSearchParams<{ child?: string }>();
  const kid = (useChildren().data ?? []).find((c) => c.id === params.child) ?? null;
  const suggested = kid?.birth_date ? bandForMonths(childAge(kid.birth_date).months) : null;
  const [band, setBand] = useState<StoryBand | 'all'>(suggested ?? 'all');
  const lang = getLocale();
  const bands = band === 'all' ? STORY_BANDS : [band];
  const storyHref = (id: string) => (kid ? `/reading/story/${id}?child=${kid.id}` : `/reading/story/${id}`);
  return (
    <Screen back title={tr('st.title')} subtitle={tr('st.sub')}>
      <Row wrap>
        <Chip label={tr('st.band.all')} selected={band === 'all'} onPress={() => setBand('all')} testID="st-band-all" />
        {STORY_BANDS.map((b) => <Chip key={b} label={tr(bandKey(b) as TKey)} selected={band === b} onPress={() => setBand(b)} testID={`st-band-${b}`} />)}
      </Row>
      {suggested && kid ? <Text variant="small" muted>{tr('st.suggested', { name: kid.first_name, band: tr(bandKey(suggested) as TKey) })}</Text> : null}
      {bands.map((b) => (
        <ListGroup key={b} title={tr(bandKey(b) as TKey)} testID={`st-group-${b}`}>
          {STORIES.filter((s) => s.band === b).map((s) => {
            const text = storyText(s.id, lang);
            return <ListRow key={s.id} icon={s.icon} title={text.title} value={tr('st.minutes', { count: readingMinutes(text) })}
              onPress={() => router.push(storyHref(s.id) as never)} testID={`st-open-${s.id}`} />;
          })}
        </ListGroup>
      ))}
      <Text variant="caption" muted>{tr('st.notice')}</Text>
    </Screen>
  );
}
