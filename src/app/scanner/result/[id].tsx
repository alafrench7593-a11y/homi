/** Fiche résultat d'un scan enregistré (ouverte aussi depuis une notification de rappel). */
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { confirm, useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Row, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AvoidBanner, AvoidButton } from '@/features/avoidList';
import { useDeleteScan, useExplainScan, useScan, useScanFavorites, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { RECALL_DISCLAIMER } from '@/lib/domain/scanCommon';
import { frDate } from '@/lib/domain/scanSources';
import type { ExplainResponse } from '@/lib/types-scanner';
import { ResultView, type StoredAnalysis } from '@/features/scanner/components';
import { ScanRecipes } from '@/features/recipes/ScanRecipes';
import { t as tr } from '@/i18n';

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { scan, result, isLoading, error, refetch } = useScan(id);
  const { ids: favorites } = useScanFavorites();
  const toggleFavorite = useToggleScanFavorite();
  const del = useDeleteScan();
  const explain = useExplainScan();
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);
  const requested = useRef<string | null>(null);

  // Explication IA demandée une fois par ouverture si elle n'est pas déjà enregistrée
  useEffect(() => {
    if (!result || result.explanation || requested.current === result.id) return;
    requested.current = result.id;
    explain.mutateAsync({ analysis: result.result, scanId: result.scan_id }).then(setExplanation).catch((e) => {
      // Pas d'échec silencieux : la carte affiche « Explication IA indisponible » et l'explication des règles reste visible
      setExplanation({ ai: 'unavailable', message: friendlyError(e, tr('u8.result.explainFail')) });
    });
  }, [result, explain]);

  if (isLoading && !scan) return <Screen back title={tr('u8.result.title')}><Skeleton kind="detail" rows={5} /></Screen>;
  if (error && !scan) return <Screen back title={tr('u8.result.title')}><ErrorView error={error} onRetry={refetch} title={tr('u8.result.cannotShow')} /></Screen>;
  if (!scan) {
    return (
      <Screen back title={tr('u8.result.title')}>
        <EmptyState
          icon="search"
          title={tr('u8.result.notFound')}
          body={tr('u8.result.notFoundBody')}
          action={{ label: tr('u8.result.back'), icon: 'arrow-left', onPress: () => router.replace('/scanner') }}
        />
      </Screen>
    );
  }

  const fav = favorites.has(scan.id);
  async function remove() {
    if (del.isPending) return;
    if (!(await confirm(tr('u8.result.delQ'), tr('u8.result.delBody'), tr('u8.result.delete')))) return;
    try {
      await del.mutateAsync(scan!.id);
      router.replace('/scanner/history');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const actions = (
    <Row wrap>
      <Button label={fav ? tr('u8.result.unfav') : tr('u8.result.fav')} icon="star" size="sm" variant="secondary" loading={toggleFavorite.isPending}
        onPress={() => !toggleFavorite.isPending && toggleFavorite.mutate({ scanId: scan.id, favorite: !fav }, { onError: (e) => toast(friendlyError(e), 'error') })} />
      <Button label={tr('u8.result.compare')} icon="columns" size="sm" variant="ghost" onPress={() => router.push({ pathname: '/scanner/compare', params: { a: scan.id } })} />
      <AvoidButton barcode={scan.barcode} name={scan.product_snapshot?.name ?? tr('u8.result.product')} />
      <Button label={tr('u8.result.delete')} icon="trash-2" size="sm" variant="ghost" loading={del.isPending} onPress={remove} />
    </Row>
  );

  if (!result) {
    return (
      <Screen back title={tr('u8.result.title')}>
        <AvoidBanner barcode={scan.barcode} />
        <Card>
          <Text variant="heading">{scan.product_snapshot?.name ?? tr('u8.result.product')}</Text>
          <Text variant="small" muted>{[scan.product_snapshot?.brand, scan.barcode ? `EAN ${scan.barcode}` : null, frDate(scan.created_at)].filter(Boolean).join(' · ')}</Text>
          <Text variant="small" style={{ marginTop: 6 }}>{tr('u8.result.notAnalysed')}</Text>
          <Text variant="caption" muted style={{ marginTop: 4 }}>{RECALL_DISCLAIMER}</Text>
        </Card>
        {scan.kind === 'food' ? <ScanRecipes name={scan.product_snapshot?.name} /> : null}
        <Button label={tr('u8.result.analyse')} onPress={() => router.push(scan.kind === 'food' ? '/scanner/food' : '/scanner/product')} />
      </Screen>
    );
  }

  return (
    <Screen back title={scan.kind === 'food' ? tr('u8.result.foodTitle') : tr('u8.result.scanResult')}>
      <AvoidBanner barcode={scan.barcode} />
      <ResultView a={result.result as StoredAnalysis} explanation={result.explanation ?? explanation} explaining={explain.isPending} actions={actions} />
      {scan.kind === 'food' ? <ScanRecipes name={scan.product_snapshot?.name} /> : null}
      <Button label={scan.kind === 'food' ? tr('u8.result.anotherFood') : tr('u8.result.anotherProduct')} icon="camera" variant="secondary"
        onPress={() => router.push(scan.kind === 'food' ? '/scanner/food' : '/scanner/product')} />
    </Screen>
  );
}
