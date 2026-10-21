/**
 * « Neurodéveloppement et besoins particuliers » : libellés, calcul des prises du jour et résumé dans la fiche enfant.
 * Aucun diagnostic, aucune dose calculée, aucun traitement modifié par l'application.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Chip, ListRow, Row, Text } from '@/components/ui';
import { useChildNeeds, useNeedEntries, useTreatments, type NeedKind, type Treatment, type TreatmentLog } from '@/lib/data/hooks-needs';
import type { Child } from '@/lib/types';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { useUiStore } from '@/lib/store';

export const needLabel = (k: NeedKind) => tr(`nd.kind.${k}` as TKey);

export interface Dose { treatment: Treatment; time: string; scheduledFor: string; log: TreatmentLog | null }

const isoWeekday = (d: Date) => ((d.getDay() + 6) % 7) + 1;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Prises prévues un jour donné, d'après ce que le parent a saisi (heures, fréquence, dates). */
export function dosesFor(day: Date, treatments: Treatment[], logs: TreatmentLog[]): Dose[] {
  const date = ymd(day);
  const out: Dose[] = [];
  for (const t of treatments) {
    if (!t.active || t.start_date > date || (t.end_date && t.end_date < date)) continue;
    if (t.frequency === 'as_prescribed') continue;
    if (t.frequency === 'weekly' && !t.weekdays.includes(isoWeekday(day))) continue;
    for (const time of [...t.times].sort()) {
      const [h, m] = time.split(':').map(Number);
      const at = new Date(day); at.setHours(h, m, 0, 0);
      const scheduledFor = at.toISOString();
      out.push({ treatment: t, time, scheduledFor, log: logs.find((l) => l.treatment_id === t.id && Date.parse(l.scheduled_for) === at.getTime()) ?? null });
    }
  }
  return out.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
}

/** Onglet « Besoins particuliers » de la fiche enfant : résumé et accès au carnet complet. */
export function NeedsSummary({ child }: { child: Child }) {
  const simple = useUiStore((st) => st.simpleMode);
  const { data: needs } = useChildNeeds(child.id);
  const { data: entries } = useNeedEntries(child.id);
  const { data: treatments } = useTreatments(child.id);
  const active = (treatments ?? []).filter((x) => x.active);
  return (
    <View style={{ gap: spacing.sm }} testID="needs-summary">
      <Text variant="heading" accessibilityRole="header">{tr('nd.title')}</Text>
      <Banner tone="info">{tr('nd.disclaimer')}</Banner>
      <Card>
        <Text variant="caption" weight="bold" muted>{tr('nd.categories')}</Text>
        <Row wrap style={{ marginTop: 6 }}>
          {needs?.kinds.length ? needs.kinds.map((k) => <Chip key={k} label={k === 'other' && needs.other_label ? needs.other_label : needLabel(k)} selected />) : <Text muted>{tr('nd.noCategory')}</Text>}
        </Row>
      </Card>
      <Card>
        <ListRow icon="clipboard" title={tr('nd.tab.treatments')} subtitle={active.length ? tr('nd.treatments.count', { count: active.length }) : tr('nd.treatments.none')} onPress={() => router.push(`/child/${child.id}/needs?tab=treatments`)} />
        <ListRow icon="list" title={tr('nd.tab.follow')} subtitle={tr('nd.entries.count', { count: entries?.length ?? 0 })} onPress={() => router.push(`/child/${child.id}/needs?tab=follow`)} />
        {/* Mode simple : ni école, ni documents à importer (aucun bilan demandé aux parents) */}
        {simple ? null : <ListRow icon="book" title={tr('tool.child_school')} onPress={() => router.push(`/child/${child.id}/school`)} />}
        {simple ? null : <ListRow icon="folder" title={tr('tool.documents')} onPress={() => router.push(`/documents?child=${child.id}`)} />}
      </Card>
      <Button label={tr('nd.open')} icon="compass" onPress={() => router.push(`/child/${child.id}/needs`)} full testID="open-needs" />
    </View>
  );
}
