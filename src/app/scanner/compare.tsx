/**
 * Comparaison de deux produits côte à côte. Chaque produit garde SA propre analyse (profil, sources, date) :
 * aucun classement, aucune note globale.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PremiumSection } from '@/components/Premium';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Divider, Row, SectionTitle, Text } from '@/components/ui';
import { useScan, useScanHistory } from '@/lib/data/hooks-scanner';
import { CERTAINTY_LABEL, DEMO_LABEL } from '@/lib/domain/scanCommon';
import { frDate } from '@/lib/domain/scanSources';
import type { ScanRow } from '@/lib/types-scanner';
import { VerdictBadge, type StoredAnalysis } from '@/features/scanner/components';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

function lines(a: StoredAnalysis): { label: string; value: string }[] {
  const out = [
    { label: tr('u8.compare.for'), value: a.profileLabel },
    { label: tr('u8.compare.certainty'), value: CERTAINTY_LABEL[a.certainty] },
    { label: tr('u8.compare.recalls'), value: a.recalls.length ? tr('u8.compare.recallCount', { count: a.recalls.length }) : a.recallCheck?.checked ? tr('u8.compare.noneFound') : tr('u8.compare.notChecked') },
  ];
  if (a.kind === 'product') {
    out.push(
      { label: tr('u8.compare.type'), value: a.product.typeLabel },
      { label: tr('u8.compare.perfume'), value: a.perfume === 'present' ? tr('u8.compare.yes') : a.perfume === 'absent' ? tr('u8.compare.notStated') : tr('u8.compare.unknown') },
      { label: tr('u8.compare.fragAllergens'), value: a.fragranceAllergens.length ? a.fragranceAllergens.join(', ') : a.ingredients.length ? tr('u8.compare.noneSpotted') : tr('u8.compare.unknown') },
      { label: tr('u8.compare.essOils'), value: a.essentialOils.length ? a.essentialOils.join(', ') : a.ingredients.length ? tr('u8.compare.noneSpottedF') : tr('u8.compare.unknown') },
    );
  } else {
    out.push({ label: tr('u8.compare.ingredients'), value: a.ingredients.length ? tr('u8.compare.listed', { count: a.ingredients.length }) : tr('u8.compare.unknownP') });
  }
  out.push(
    { label: tr('u8.compare.missingInfo'), value: a.missing.length ? a.missing.join(' ; ') : tr('u8.compare.noneReported') },
    { label: tr('u8.compare.sources'), value: a.sources.map((s) => s.publisher).filter((x, i, arr) => arr.indexOf(x) === i).join(', ') },
    { label: tr('u8.compare.analysedOn'), value: frDate(a.analysedOn) },
  );
  return out;
}

function Column({ id, onClear }: { id: string; onClear: () => void }) {
  const { scan, result, isLoading, error, refetch } = useScan(id);
  if (isLoading && !scan) return <View style={{ flex: 1 }}><Skeleton kind="detail" rows={4} /></View>;
  if (error && !scan) return <View style={{ flex: 1 }}><ErrorView error={error} onRetry={refetch} title={tr('u8.compare.unavailable')} /></View>;
  if (!scan) {
    return (
      <Card style={{ flex: 1 }}>
        <Text variant="small" muted>{tr('u8.compare.gone')}</Text>
        <Button label={tr('u8.compare.change')} size="sm" variant="ghost" onPress={onClear} />
      </Card>
    );
  }
  const a = result?.result as StoredAnalysis | undefined;
  return (
    <Card style={{ flex: 1 }}>
      <Text weight="bold">{scan?.product_snapshot?.name ?? tr('u8.compare.product')}</Text>
      <Text variant="caption" muted>{scan?.product_snapshot?.brand ?? ''}</Text>
      {a?.demo ? <Text variant="caption" weight="bold">{DEMO_LABEL}</Text> : null}
      {a ? (
        <>
          <View style={{ marginVertical: spacing.xs }}><VerdictBadge verdict={a.verdict} small /></View>
          {lines(a).map((l) => (
            <View key={l.label} style={{ marginTop: 4 }}>
              <Text variant="caption" muted>{l.label}</Text>
              <Text variant="small">{l.value}</Text>
            </View>
          ))}
        </>
      ) : <Text variant="small" muted>{tr('u8.compare.noSaved')}</Text>}
      <Divider />
      <Button label={tr('u8.compare.viewSheet')} size="sm" variant="ghost" onPress={() => router.push(`/scanner/result/${id}`)} />
      <Button label={tr('u8.compare.change')} size="sm" variant="ghost" onPress={onClear} />
    </Card>
  );
}

export default function CompareScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const [a, setA] = useState<string | null>(params.a ?? null);
  const [b, setB] = useState<string | null>(params.b ?? null);
  const historyQ = useScanHistory();
  const { data: history } = historyQ;
  const compareAccess = usePremiumAccess('scanner_compare');
  const pickable = (history ?? []).filter((s: ScanRow) => s.id !== a && s.id !== b);

  function pick(id: string) {
    if (!a) setA(id);
    else if (!b) setB(id);
  }

  return (
    <Screen back title={tr('u8.compare.title')} subtitle={tr('u8.compare.subtitle')}>
      <Banner tone="info">{tr('u8.compare.banner')}</Banner>
      {a && b && !compareAccess.premium ? (
        <PremiumSection feature="scanner_compare" preview={<Text variant="small">{tr('u8.compare.preview', { a: (history ?? []).find((x: ScanRow) => x.id === a)?.product_snapshot?.name ?? tr('u8.compare.product1'), b: (history ?? []).find((x: ScanRow) => x.id === b)?.product_snapshot?.name ?? tr('u8.compare.product2') })}</Text>}><View /></PremiumSection>
      ) : null}
      <Row style={{ alignItems: 'flex-start' }}>
        {a && (b == null || compareAccess.premium) ? <Column id={a} onClear={() => setA(null)} /> : <Card style={{ flex: 1 }}><Text variant="small" muted>{tr('u8.compare.pickFirst')}</Text></Card>}
        {b && compareAccess.premium ? <Column id={b} onClear={() => setB(null)} /> : b ? <Card style={{ flex: 1 }}><Text variant="small">{(history ?? []).find((x: ScanRow) => x.id === b)?.product_snapshot?.name ?? tr('u8.compare.second')}</Text><Button label={tr('u8.compare.change')} size="sm" variant="ghost" onPress={() => setB(null)} /></Card> : <Card style={{ flex: 1 }}><Text variant="small" muted>{tr('u8.compare.pickSecond')}</Text></Card>}
      </Row>
      {!a || !b ? (
        <>
          <SectionTitle title={tr('u8.compare.inHistory')} />
          {historyQ.isLoading && !history ? <Skeleton kind="list" rows={2} /> : historyQ.isError && !history ? (
            <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title={tr('u8.compare.historyErr')} />
          ) : pickable.length ? (
            <Row wrap>{pickable.slice(0, 30).map((s) => <Chip key={s.id} label={`${s.product_snapshot?.name ?? tr('u8.compare.noName')}${s.kind === 'food' ? tr('u8.compare.foodSuffix') : ''}`} onPress={() => pick(s.id)} />)}</Row>
          ) : (
            <EmptyState icon="columns" title={tr('u8.compare.needTwo')} action={{ label: tr('u8.compare.scanProduct'), icon: 'camera', onPress: () => router.push('/scanner/product') }} />
          )}
        </>
      ) : null}
    </Screen>
  );
}
