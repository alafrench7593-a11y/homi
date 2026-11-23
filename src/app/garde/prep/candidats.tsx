/**
 * 142 — Comparateur de nounous et crèches : les candidates saisies par les parents, en fiches ou côte à côte (une
 * colonne par candidate, chaque valeur nommée : lisible au lecteur d'écran et en grand texte), triées par coût, statut,
 * nom ou date. Aucune recherche d'annonces externes.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSegmentedControl } from '@/components/glass';
import { Card, Chip, Icon, Row, Text } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, formatNumber, t as tr } from '@/i18n';
import { useCandidates, useParentHousehold, usePrepAnswers, usePrepItems } from '@/lib/data/hooks-childcarePrep';
import { isStructure, monthlyCost, progressOf, sortCandidates, type Candidate, type CandidateSort, type PrepAnswer, type PrepItem } from '@/features/childcarePrep/domain';
import { CandidateEditor, kindLabel, money, STATUS_ICON, statusLabel } from '@/features/childcarePrep/ui';
import { MotionItem, MotionList } from '@/motion/ListMotion';

const SORTS: CandidateSort[] = ['cost', 'status', 'name', 'recent'];

function costText(c: Candidate) {
  const cost = monthlyCost(c);
  return cost.complete ? tr('gp.cand.perMonth', { amount: money(cost.total) }) : tr('gp.cand.noPrice');
}
function rateText(c: Candidate) {
  if (c.rate_mode === 'monthly') return c.monthly_fee != null ? tr('gp.cmp.rateMonthly', { amount: money(c.monthly_fee) }) : tr('gp.cmp.none');
  return c.hourly_rate != null ? tr('gp.cmp.rateHourly', { rate: money(c.hourly_rate), hours: formatNumber(c.hours_per_week ?? 0) }) : tr('gp.cmp.none');
}

function StatusLine({ c }: { c: Candidate }) {
  const t = useTheme();
  const chosen = c.status === 'chosen';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLabel={tr('gp.fiche.statusA11y', { status: statusLabel(c.status) })}>
      <Icon name={STATUS_ICON[c.status]} size={16} color={chosen ? t.colors.success : c.status === 'dismissed' ? t.colors.textMuted : t.colors.primary} />
      <Text variant="small" weight={chosen ? 'bold' : 'medium'} muted={c.status === 'dismissed'}>{statusLabel(c.status)}</Text>
    </View>
  );
}

function CandidateCard({ c, items, answers }: { c: Candidate; items: PrepItem[]; answers: PrepAnswer[] }) {
  const iv = progressOf(items, answers, c.id, 'interview');
  const vs = progressOf(items, answers, c.id, 'visit');
  const prog = isStructure(c.kind) ? tr('gp.cand.visit', vs) : tr('gp.cand.interview', iv);
  return (
    <Card onPress={() => router.push(`/garde/prep/fiche?id=${c.id}` as never)} testID={`gp-cand-${c.id}`} selected={c.status === 'chosen'}
      accessibilityLabel={[c.name, kindLabel(c.kind), statusLabel(c.status), costText(c), prog].join(', ')} accessibilityHint={tr('gp.cand.openA11y', { name: c.name })}>
      <Text variant="heading">{c.name}</Text>
      <Text variant="small" muted>{kindLabel(c.kind)}</Text>
      <View style={{ gap: 4, marginTop: spacing.xs }}>
        <StatusLine c={c} />
        <Text weight="bold">{costText(c)}</Text>
        <Text variant="small" muted>{prog}</Text>
        {c.interview_at ? <Text variant="small" muted>{tr('gp.cand.dateAt', { date: formatDate(c.interview_at, { weekday: 'long', day: 'numeric', month: 'long' }) })}</Text> : null}
      </View>
    </Card>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" muted>{label}</Text>
      <Text variant="small">{value}</Text>
    </View>
  );
}

function CompareColumns({ list, items, answers }: { list: Candidate[]; items: PrepItem[]; answers: PrepAnswer[] }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const colW = Math.min(260, Math.max(200, width * 0.66));
  const cheapest = list.filter((c) => monthlyCost(c).complete && c.status !== 'dismissed').sort((a, b) => monthlyCost(a).total - monthlyCost(b).total)[0];
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="small" muted>{tr('gp.cmp.hint')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }} testID="gp-compare">
        {list.map((c) => {
          const iv = progressOf(items, answers, c.id, 'interview');
          const vs = progressOf(items, answers, c.id, 'visit');
          return (
            <View key={c.id} testID={`gp-col-${c.id}`} style={{ width: colW, borderRadius: radius.lg, borderWidth: c.status === 'chosen' ? 2 : 1, borderColor: c.status === 'chosen' ? t.colors.success : t.colors.border, backgroundColor: t.colors.surface, padding: spacing.md, gap: spacing.sm }}>
              <Text weight="bold" accessibilityRole="header">{c.name}</Text>
              <Cell label={tr('gp.cmp.kind')} value={kindLabel(c.kind)} />
              <View style={{ gap: 2 }}><Text variant="caption" muted>{tr('gp.cmp.status')}</Text><StatusLine c={c} /></View>
              <View style={{ gap: 2 }}>
                <Text variant="caption" muted>{tr('gp.cmp.cost')}</Text>
                <Text variant="small" weight="bold">{costText(c)}</Text>
                {cheapest?.id === c.id && list.length > 1 ? <Text variant="caption" color={t.colors.success}>{tr('gp.bd.cheapest', { name: c.name })}</Text> : null}
              </View>
              <Cell label={tr('gp.cmp.rate')} value={rateText(c)} />
              <Cell label={tr('gp.cmp.availability')} value={c.availability || tr('gp.cmp.none')} />
              <Cell label={tr('gp.cmp.interview')} value={`${iv.done} / ${iv.total}`} />
              <Cell label={tr('gp.cmp.visit')} value={`${vs.done} / ${vs.total}`} />
              <Cell label={tr('gp.cmp.contact')} value={[c.phone, c.email].filter(Boolean).join(' · ') || tr('gp.cmp.none')} />
              <Chip label={tr('gp.fiche.edit')} icon="edit-2" onPress={() => router.push(`/garde/prep/fiche?id=${c.id}` as never)} testID={`gp-col-open-${c.id}`} />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function Candidates() {
  const params = useLocalSearchParams<{ new?: string }>();
  const { householdId, loading } = useParentHousehold();
  const cands = useCandidates(householdId);
  const items = usePrepItems(householdId).data ?? [];
  const answers = usePrepAnswers(householdId).data ?? [];
  const [sort, setSort] = useState<CandidateSort>('cost');
  const [view, setView] = useState<'cards' | 'compare'>('cards');
  const [editorOpen, setEditorOpen] = useState(false);
  useEffect(() => { if (params.new === '1' && householdId) setEditorOpen(true); }, [params.new, householdId]);
  const list = useMemo(() => sortCandidates(cands.data ?? [], sort), [cands.data, sort]);

  if (loading || (cands.isLoading && !cands.data)) return <Screen back title={tr('gp.tool.candidates')} tool={false}><Skeleton rows={3} /></Screen>;
  if (!householdId) return <Screen back title={tr('gp.tool.candidates')} tool={false}><EmptyState icon="lock" title={tr('gp.parentOnly')} body={tr('gp.parentOnlyBody')} /></Screen>;
  return (
    <Screen back title={tr('gp.tool.candidates')} subtitle={tr('gp.tool.candidatesSub')} tool={false}
      action={{ label: tr('gp.cand.add'), icon: 'plus', onPress: () => setEditorOpen(true), testID: 'gp-cand-add' }}>
      {cands.isError && !cands.data ? <ErrorView error={cands.error} onRetry={() => void cands.refetch()} /> : !list.length ? (
        <EmptyState icon="users" title={tr('gp.cand.emptyTitle')} body={tr('gp.cand.emptyBody')} action={{ label: tr('gp.cand.add'), onPress: () => setEditorOpen(true) }} />
      ) : (
        <>
          <GlassSegmentedControl label={tr('gp.cand.view')} value={view} onChange={setView} testID="gp-view"
            options={[{ value: 'cards', label: tr('gp.view.cards'), icon: 'grid' }, { value: 'compare', label: tr('gp.view.compare'), icon: 'columns' }]} />
          <View style={{ gap: spacing.xs }}>
            <Text variant="label">{tr('gp.cand.sort')}</Text>
            <Row wrap>{SORTS.map((s) => <Chip key={s} label={tr(`gp.sort.${s}`)} selected={sort === s} onPress={() => setSort(s)} testID={`gp-sort-${s}`} />)}</Row>
          </View>
          {view === 'compare' ? <CompareColumns list={list} items={items} answers={answers} /> : <MotionList style={{ gap: spacing.md }}>{list.map((c) => <MotionItem key={c.id}><CandidateCard key={c.id} c={c} items={items} answers={answers} /></MotionItem>)}</MotionList>}
        </>
      )}
      <CandidateEditor visible={editorOpen} onClose={() => setEditorOpen(false)} householdId={householdId} />
    </Screen>
  );
}
