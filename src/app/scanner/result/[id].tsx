/**
 * Fiche résultat d'un scan enregistré (ouverte aussi depuis une notification de rappel).
 *  - Arrivée depuis une ligne d'historique ou le dernier scan : la surface de la ligne s'agrandit jusqu'à la fiche
 *    (morph `scan-<id>`), et revient vers la même ligne au retour. Réduire les animations : ouverture immédiate.
 *  - Point focal : le verdict (verre optique teinté) ; puis les tuiles de résultat RÉELLES (allergènes, ingrédients à
 *    surveiller, rappels officiels, date de vérification de la source) avec états inconnus explicites.
 *  - États : chargement, erreur (réessayer), fiche introuvable, scan non analysé.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Row, Text } from '@/components/ui';
import { PrimaryButton, SecondaryButton, SensitiveButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { MorphTarget } from '@/motion';
import { friendlyError } from '@/lib/data/hooks-settings';
import { AvoidBanner, AvoidButton } from '@/features/avoidList';
import { useDeleteScan, useExplainScan, useScan, useScanFavorites, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { RECALL_DISCLAIMER } from '@/lib/domain/scanCommon';
import { frDate } from '@/lib/domain/scanSources';
import type { ExplainResponse } from '@/lib/types-scanner';
import { ResultView, type StoredAnalysis } from '@/features/scanner/components';
import { ScanRecipes } from '@/features/recipes/ScanRecipes';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <MorphTarget id={`scan-${id}`} testID="scan-result-scene">
      <ScanResult id={id} />
    </MorphTarget>
  );
}

function ScanResult({ id }: { id: string }) {
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

  if (isLoading && !scan) return <Screen back title={tr('u8.result.title')}><View testID="scan-result-loading"><Skeleton kind="detail" rows={5} /></View></Screen>;
  if (error && !scan) return <Screen back title={tr('u8.result.title')}><ErrorView error={error} onRetry={refetch} title={tr('u8.result.cannotShow')} /></Screen>;
  if (!scan) {
    return (
      <Screen back title={tr('u8.result.title')}>
        <View testID="scan-result-missing">
          <EmptyState icon="search" title={tr('u8.result.notFound')} body={tr('u8.result.notFoundBody')}
            action={{ label: tr('u8.result.back'), icon: 'arrow-left', onPress: () => router.replace('/scanner') }} />
        </View>
      </Screen>
    );
  }

  const fav = favorites.has(scan.id);
  const again = () => router.push(scan.kind === 'food' ? '/scanner/food' : '/scanner/product');
  async function remove() {
    await del.mutateAsync(scan!.id);
    router.replace('/scanner/history');
  }

  if (!result) {
    // Scan enregistré sans analyse (identification seule) : on le dit, rien n'est déduit
    return (
      <Screen back title={tr('u8.result.title')} footer={<PrimaryButton label={tr('u8.result.analyse')} icon="check" size="lg" full onPress={again} testID="scan-result-analyse" />}>
        <AvoidBanner barcode={scan.barcode} />
        <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: 4 }} testID="scan-result-unanalysed">
          <Text variant="heading" accessibilityRole="header">{scan.product_snapshot?.name ?? tr('u8.result.product')}</Text>
          <Text variant="small" muted>{[scan.product_snapshot?.brand, scan.barcode ? `EAN ${scan.barcode}` : null, frDate(scan.created_at)].filter(Boolean).join(' · ')}</Text>
          <Text variant="small">{tr('u8.result.notAnalysed')}</Text>
          <Text variant="caption" muted>{RECALL_DISCLAIMER}</Text>
        </MatteSurface>
        {scan.kind === 'food' ? <ScanRecipes name={scan.product_snapshot?.name} /> : null}
      </Screen>
    );
  }

  const actions = (
    <Row wrap>
      <SecondaryButton label={fav ? tr('u8.result.unfav') : tr('u8.result.fav')} icon="star" size="sm" testID="scan-result-fav"
        onPress={() => toggleFavorite.mutateAsync({ scanId: scan.id, favorite: !fav }).catch((e) => { toast(friendlyError(e), 'error'); })} />
      <SecondaryButton label={tr('u8.result.compare')} icon="columns" size="sm" onPress={() => router.push({ pathname: '/scanner/compare', params: { a: scan.id } })} testID="scan-result-compare" />
      <AvoidButton barcode={scan.barcode} name={scan.product_snapshot?.name ?? tr('u8.result.product')} />
    </Row>
  );

  return (
    <Screen back title={scan.kind === 'food' ? tr('u8.result.foodTitle') : tr('u8.result.scanResult')}
      footer={<SecondaryButton label={scan.kind === 'food' ? tr('u8.result.anotherFood') : tr('u8.result.anotherProduct')} icon="camera" size="lg" full onPress={again} testID="scan-result-again" />}>
      <AvoidBanner barcode={scan.barcode} />
      <ResultView a={result.result as StoredAnalysis} explanation={result.explanation ?? explanation} explaining={explain.isPending} actions={actions} />
      {scan.kind === 'food' ? <ScanRecipes name={scan.product_snapshot?.name} /> : null}
      <SensitiveButton label={tr('u8.result.delete')} icon="trash-2" size="sm" style={{ alignSelf: 'flex-start' }} onPress={remove}
        confirmTitle={tr('u8.result.delQ')} confirmMessage={tr('u8.result.delBody')} confirmLabel={tr('u8.result.delete')} testID="scan-result-delete" />
    </Screen>
  );
}
