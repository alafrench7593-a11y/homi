/**
 * 146 / 147 — Comparateur des tarifs et calculateur du budget de garde : coût mensuel estimé de chaque candidate à
 * partir des saisies (taux horaire × heures, ou forfait, + frais), reste à charge AVANT aides. Aucune aide calculée ni
 * promise : renvoi vers les pages officielles déjà sourcées dans les guides HOMI.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { useCandidates, useParentHousehold } from '@/lib/data/hooks-childcarePrep';
import { monthlyCost, sortCandidates, type Candidate } from '@/features/childcarePrep/domain';
import { CandidateEditor, kindLabel, money, SourceLinks, statusLabel } from '@/features/childcarePrep/ui';

export default function CareBudget() {
  const t = useTheme();
  const { householdId, loading } = useParentHousehold();
  const cands = useCandidates(householdId);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const list = useMemo(() => sortCandidates(cands.data ?? [], 'cost'), [cands.data]);
  const priced = list.filter((c) => monthlyCost(c).complete && c.status !== 'dismissed');
  const cheapest = priced[0];
  const max = Math.max(1, ...priced.map((c) => monthlyCost(c).total));
  const incomplete = list.filter((c) => !monthlyCost(c).complete).length;

  if (loading || (cands.isLoading && !cands.data)) return <Screen back title={tr('gp.tool.budget')} tool={false}><Skeleton rows={3} /></Screen>;
  if (!householdId) return <Screen back title={tr('gp.tool.budget')} tool={false}><EmptyState icon="lock" title={tr('gp.parentOnly')} body={tr('gp.parentOnlyBody')} /></Screen>;
  return (
    <Screen back title={tr('gp.tool.budget')} subtitle={tr('gp.bd.intro')} tool={false}>
      {!list.length ? (
        <EmptyState icon="credit-card" title={tr('gp.cand.emptyTitle')} body={tr('gp.bd.empty')} action={{ label: tr('gp.cand.add'), onPress: () => router.push('/garde/prep/candidats?new=1' as never) }} />
      ) : (
        <>
          {cheapest && priced.length > 1 ? <Card tone="soft" testID="gp-bd-cheapest"><Text weight="bold">{tr('gp.bd.cheapest', { name: cheapest.name })}</Text></Card> : null}
          {list.map((c) => {
            const cost = monthlyCost(c);
            const share = cost.complete ? cost.total / max : 0;
            const diff = cheapest && cost.complete && c.id !== cheapest.id && c.status !== 'dismissed' ? cost.total - monthlyCost(cheapest).total : 0;
            return (
              <Card key={c.id} testID={`gp-bd-${c.id}`}
                accessibilityLabel={[c.name, kindLabel(c.kind), statusLabel(c.status), cost.complete ? `${tr('gp.cost.beforeAid')} ${money(cost.total)}` : tr('gp.cand.noPrice')].join(', ')}>
                <Text variant="heading">{c.name}</Text>
                <Text variant="small" muted>{`${kindLabel(c.kind)} · ${statusLabel(c.status)}`}</Text>
                {cost.complete ? (
                  <View style={{ gap: 4, marginTop: spacing.xs }}>
                    <Text variant="title" testID={`gp-bd-total-${c.id}`}>{tr('gp.cand.perMonth', { amount: money(cost.total) })}</Text>
                    {/* barre proportionnelle : décorative, le montant est écrit au-dessus */}
                    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ height: 8, borderRadius: radius.sm, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden' }}>
                      <View style={{ width: `${Math.round(share * 100)}%`, height: 8, borderRadius: radius.sm, backgroundColor: c.id === cheapest?.id ? t.colors.success : t.colors.primary }} />
                    </View>
                    {diff > 0 ? <Text variant="small" muted>{tr('gp.bd.diff', { amount: money(diff) })}</Text> : null}
                    <Text variant="small" muted>{tr('gp.bd.year', { amount: money(cost.total * 12) })}</Text>
                    <Text variant="small">{[
                      `${tr('gp.cost.base')} ${money(cost.base)}`,
                      cost.meals ? `${tr('gp.cost.meals')} ${money(cost.meals)}` : '',
                      cost.upkeep ? `${tr('gp.cost.upkeep')} ${money(cost.upkeep)}` : '',
                      cost.other ? `${tr('gp.cost.other')} ${money(cost.other)}` : '',
                    ].filter(Boolean).join(' · ')}</Text>
                  </View>
                ) : <Text muted style={{ marginTop: spacing.xs }}>{tr('gp.cost.incomplete')}</Text>}
                <Button label={tr('gp.bd.edit')} icon="edit-2" variant="secondary" size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => setEditing(c)} testID={`gp-bd-edit-${c.id}`} />
              </Card>
            );
          })}
          {incomplete ? <Text variant="small" muted>{tr('gp.bd.incompleteN', { count: incomplete })}</Text> : null}
          <Text variant="small" muted>{tr('gp.bd.formula')}</Text>
        </>
      )}
      <Banner tone="warning" title={tr('gp.bd.aidTitle')}>{tr('gp.bd.aidBody')}</Banner>
      <SourceLinks title={tr('gp.modes.sources')} keys={['cmg', 'cmgStructure', 'creditHome', 'creditOut']} testID="gp-bd-sources" />
      <CandidateEditor visible={!!editing} onClose={() => setEditing(null)} householdId={householdId} candidate={editing} priceOnly />
    </Screen>
  );
}
