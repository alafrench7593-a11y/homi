/**
 * Sources et lectures (0 à 10 ans) : institutions de santé, nutrition, professionnels qualifiés, recettes familiales,
 * publications. Chaque fiche : titre, éditeur, résumé court rédigé par l'équipe, âge concerné, dates de publication et de
 * consultation, références éventuelles, lien vers le site d'origine. Aucun article ni aucune photo n'est recopié.
 */
import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, Row, Text } from '@/components/ui';
import { RESOURCE_KINDS, type ResourceKind } from '@/content/resources';
import { resourceAgeLabel, resourceFitsAge, useExternalResources } from '@/lib/data/hooks-resources';
import { useMyRoles } from '@/lib/data/hooks-settings';
import { fold } from '@/lib/recipes/validate';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { ResultsFade } from '@/components/MotionKit';
import { ReadingMemory, ReadStar, useProfileReading } from '@/features/readTrack/ReadingMemory';
import { isFav } from '@/lib/domain/readTrack';

type AgeFilter = 'm0_6' | 'm6_12' | 'y1_3' | 'y3_10';
const AGES: Record<AgeFilter, [number, number]> = { m0_6: [0, 6], m6_12: [6, 12], y1_3: [12, 36], y3_10: [36, 120] };

export default function Sources() {
  const { isEditor } = useMyRoles();
  const [kind, setKind] = useState<ResourceKind | null>(null);
  const [age, setAge] = useState<AgeFilter | null>(null);
  const [q, setQ] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const all = useExternalResources();
  const reading = useProfileReading().data;
  const favCount = all.data.filter((r) => isFav(reading, 'source', r.id)).length;
  const list = useMemo(() => all.data.filter((r) => (!kind || r.kind === kind) && (!age || resourceFitsAge(r, ...AGES[age])) && (!favOnly || isFav(reading, 'source', r.id))
    && (!q || fold(`${r.title} ${r.publisher} ${r.description} ${r.topics.join(' ')}`).includes(fold(q)))), [all.data, kind, age, q, favOnly, reading]);

  return (
    <Screen back title={tr('src.title')} subtitle={tr('src.subtitle')}>
      {/* Liste longue (fiches résumées) : position de défilement gardée par profil */}
      <ReadingMemory item={all.data.length ? { kind: 'source', id: 'all', title: tr('src.title'), href: '/sources' } : null} />
      <Banner tone="info">{tr('src.intro')}</Banner>
      {isEditor ? <Button label={tr('src.admin.open')} icon="edit-2" variant="secondary" onPress={() => router.push('/admin/resources')} testID="sources-admin" /> : null}
      <Field label={tr('src.search')} value={q} onChangeText={setQ} autoCorrect={false} testID="sources-search" />
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
        <Chip label={tr('pr.all')} selected={!kind} onPress={() => setKind(null)} />
        {RESOURCE_KINDS.map((k) => <Chip key={k} label={tr(`src.kind.${k}` as TKey)} selected={kind === k} onPress={() => setKind(kind === k ? null : k)} />)}
      </ScrollView>
      <Row wrap>
        <Chip icon="star" label={tr('rt.src.favs', { count: favCount })} selected={favOnly} onPress={() => setFavOnly(!favOnly)} testID="sources-favs" />
        {(Object.keys(AGES) as AgeFilter[]).map((a) => <Chip key={a} tone="lavender" label={tr(`pr.age.${a}` as TKey)} selected={age === a} onPress={() => setAge(age === a ? null : a)} />)}
      </Row>
      <Text variant="small" muted testID="sources-count">{tr('src.count', { count: list.length })}</Text>
      {all.isLoading && !all.data.length ? <Skeleton rows={4} /> : !list.length ? (
        <View testID="sources-empty"><EmptyState icon={favOnly ? 'star' : 'book'} title={favOnly ? tr('rt.src.noFav') : tr('src.empty')} body={favOnly ? tr('rt.src.noFavB') : kind === 'family_recipes' ? tr('src.familyEmpty') : undefined} /></View>
      ) : (
        <ResultsFade k={list.map((r) => r.id).join()} testID="sources-list" style={{ gap: spacing.xs }}>
          {list.map((r) => (
            <View key={r.id} testID={`resource-${r.slug}`}><Card>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" muted>{tr(`src.kind.${r.kind}` as TKey)} · {r.publisher}</Text>
                  <Text weight="bold" style={{ marginTop: 2 }}>{r.title}</Text>
                </View>
                <ReadStar refItem={{ kind: 'source', id: r.id, title: r.title, href: '/sources' }} testID={`resource-star-${r.slug}`} />
              </View>
              <Text variant="small" style={{ marginTop: 4 }}>{r.description}</Text>
              <Text variant="caption" muted style={{ marginTop: 4 }}>
                {tr('src.age', { label: resourceAgeLabel(r) })}
                {r.published_on ? ` · ${tr('src.published', { date: formatDate(`${r.published_on}T12:00:00`) })}` : ''}
                {` · ${tr('src.consulted', { date: formatDate(`${r.consulted_on}T12:00:00`) })}`}
              </Text>
              {r.references_note ? <Text variant="caption" muted>{tr('src.refs', { text: r.references_note })}</Text> : null}
              <Button label={tr('src.open')} icon="external-link" size="sm" variant="ghost" onPress={() => Linking.openURL(r.url)} accessibilityHint={r.url} />
            </Card></View>
          ))}
        </ResultsFade>
      )}
      <Text variant="caption" muted>{tr('src.noPhoto')}</Text>
      <Text variant="caption" muted>{tr('src.notOfficial')}</Text>
    </Screen>
  );
}
