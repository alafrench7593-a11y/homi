/**
 * Synthèse des biberons (refonte v3) : sélecteur de période + deux tuiles `DataTile` (biberons notés, quantité bue
 * notée). Changer de période met à jour ENSEMBLE la valeur, l'unité, le libellé de période et le micrographique
 * (une seule source : `bottleStats`). Micrographique seulement avec au moins deux valeurs réelles ; état vide
 * explicite sans saisie. Chaque tuile ouvre l'historique par la transition carte → détail (`morphId`).
 */
import React from 'react';
import { View } from 'react-native';
import { ChoiceGroup, DataTile } from '@/components/controls';
import { bottleStats, type StatsPeriod } from '@/lib/domain/bottleSession';
import type { BottleLike } from '@/lib/domain/bottleHistory';
import { spacing } from '@/theme/tokens';
import { formatNumber, t as tr } from '@/i18n';

/** Identifiant de transition liste → détail d'un enfant (`/bottle` → `/bottle/[childId]`). */
export const childMorphId = (childId: string) => `bottle-child-${childId}`;
/** Identifiant de transition d'une tuile (repris par l'historique dans `MorphTarget`). */
export const statsMorphId = (childId: string, which: 'count' | 'ml') => `bottle-${which}-${childId}`;

export function BottleStatsTiles({ bottles, period, onPeriod, onOpen, childId, now, dayContext, periodLabels, testID = 'bottle-stats' }: {
  bottles: BottleLike[];
  period: StatsPeriod;
  onPeriod: (p: StatsPeriod) => void;
  /** Ouvre l'historique (avec l'identifiant de transition de la tuile touchée) ; absent : tuiles non appuyables */
  onOpen?: (morphId: string) => void;
  childId: string;
  /** Jour de référence de la période « jour » (défaut : aujourd'hui) ; pour la semaine : les 7 jours jusqu'à lui */
  now?: Date;
  /** Libellé de la période « jour » quand ce n'est pas aujourd'hui (historique : « hier », « mardi 20 octobre ») */
  dayContext?: string;
  /** Libellés du sélecteur (défaut : Aujourd'hui / 7 jours) */
  periodLabels?: { day: string; week: string };
  testID?: string;
}) {
  const s = bottleStats(bottles, period, now);
  const context = period === 'day' ? dayContext ?? tr('bs.period.today') : tr('bs.period.week');
  const countId = statsMorphId(childId, 'count');
  const mlId = statsMorphId(childId, 'ml');
  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      <ChoiceGroup label={tr('bs.period.label')} value={period} onChange={onPeriod} testID={`${testID}-period`}
        options={[{ value: 'day', label: periodLabels?.day ?? tr('bs.period.day'), testID: `${testID}-day` }, { value: 'week', label: periodLabels?.week ?? tr('bs.period.7d'), testID: `${testID}-week` }]} />
      {/* deux colonnes dès que chaque tuile garde la place de son micrographique (≥ 140 px), sinon l'une sous l'autre */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ flexGrow: 1, flexBasis: 140 }}><DataTile testID={`${testID}-count`} icon="droplet" tint="accent"
          label={tr('bs.tile.count')} value={s.count != null ? formatNumber(s.count) : null} unit={s.count != null ? tr('bs.unit.bottles', { count: s.count }) : undefined}
          context={context} series={s.countSeries ?? undefined} trendLabel={s.countSeries ? tr('bs.trend.perDay') : undefined}
          emptyText={period === 'day' ? tr('bs.empty.today') : tr('bs.empty.week')}
          morphId={onOpen ? countId : undefined} onPress={onOpen ? () => onOpen(countId) : undefined} /></View>
        <View style={{ flexGrow: 1, flexBasis: 140 }}><DataTile testID={`${testID}-ml`} icon="bar-chart-2" tint="accent2"
          label={tr('bs.tile.drunk')} value={s.consumedTotal != null ? formatNumber(s.consumedTotal) : null} unit={s.consumedTotal != null ? 'ml' : undefined}
          context={s.consumedTotal != null ? tr('bs.tile.drunk_ctx', { period: context, count: s.consumedCount }) : context}
          series={s.consumedSeries ?? undefined} trendLabel={s.consumedSeries ? (period === 'day' ? tr('bs.trend.perBottle') : tr('bs.trend.perDay')) : undefined}
          emptyText={tr('bs.empty.drunk')}
          morphId={onOpen ? mlId : undefined} onPress={onOpen ? () => onOpen(mlId) : undefined} /></View>
      </View>
    </View>
  );
}
