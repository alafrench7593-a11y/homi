/**
 * Raccords avec le suivi des tétées et du tire-lait existant (écran /track/[kind]) :
 *  - tétée : difficultés et douleurs notées aujourd'hui (76/77) + accès au journal ;
 *  - tire-lait : ranger la séance au stock de lait (73), sans ressaisir.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { spacing } from '@/theme/tokens';
import { ListGroup, ListRow } from '@/components/ui';
import { t as tr } from '@/i18n';
import { todayISO } from '@/lib/domain/dates';
import { useFeedingIssues, useFormulaChanges } from '@/lib/data/hooks-feeding';
import { sorted, timelineLine, yearOf } from './formula';
import { issueLine } from './issues';

export function FeedIssuesToday({ childId }: { childId: string }) {
  const q = useFeedingIssues(childId);
  const today = (q.data ?? []).filter((i) => todayISO(new Date(i.at)) === todayISO());
  return (
    <ListGroup title={tr('bfi.track.title')} testID="track-feed-issues">
      {today.slice(0, 3).map((i) => <ListRow key={i.id} icon="alert-circle" title={issueLine(i)} subtitle={i.note ?? undefined} onPress={() => router.push(`/feeding/difficulties?child=${childId}`)} />)}
      <ListRow icon="plus-circle" title={tr('bfi.track.add')} subtitle={today.length ? undefined : tr('bfi.track.sub')} onPress={() => router.push(`/feeding/difficulties?child=${childId}`)} testID="track-feed-issues-open" />
    </ListGroup>
  );
}

export function MilkStockLink({ childId }: { childId: string }) {
  return (
    <ListGroup testID="track-milk-stock">
      <ListRow icon="archive" title={tr('milk.track.title')} subtitle={tr('milk.track.sub')} onPress={() => router.push(`/feeding/milk-stock?child=${childId}`)} testID="track-milk-stock-open" />
    </ListGroup>
  );
}

/**
 * Frise de l'enfant (onglet « Moments ») : les laits infantiles (79) y apparaissent par année, avec leur période, à
 * côté des premières fois. Rien n'apparaît si aucun lait n'est noté.
 */
export function FormulaFrise({ childId }: { childId: string }) {
  const q = useFormulaChanges(childId);
  const list = sorted(q.data ?? []);
  if (!list.length) return null;
  const years = [...new Set(list.map(yearOf))];
  return (
    <View style={{ gap: spacing.xs }} testID="frise-formula">
      {years.map((y) => (
        <ListGroup key={y} title={tr('fml.frise.year', { year: y })}>
          {list.filter((f) => yearOf(f) === y).map((f) => {
            const l = timelineLine(f);
            return <ListRow key={f.id} icon="droplet" title={l.title} subtitle={l.subtitle} onPress={() => router.push(`/feeding/formula?child=${childId}`)} testID={`frise-formula-${f.kind}`} />;
          })}
        </ListGroup>
      ))}
    </View>
  );
}
