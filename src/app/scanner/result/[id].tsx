/** Fiche résultat d'un scan enregistré (ouverte aussi depuis une notification de rappel). */
import React, { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { confirm, useToast } from '@/components/Overlays';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Row, Text } from '@/components/ui';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteScan, useExplainScan, useScan, useScanFavorites, useToggleScanFavorite } from '@/lib/data/hooks-scanner';
import { RECALL_DISCLAIMER } from '@/lib/domain/scanCommon';
import { frDate } from '@/lib/domain/scanSources';
import type { ExplainResponse } from '@/lib/types-scanner';
import { ResultView, type StoredAnalysis } from '@/features/scanner/components';

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
      setExplanation({ ai: 'unavailable', message: friendlyError(e, 'L’explication n’a pas pu être générée. Les règles et sources ci-dessous restent valables.') });
    });
  }, [result, explain]);

  if (isLoading && !scan) return <Screen back title="Résultat"><Skeleton kind="detail" rows={5} /></Screen>;
  if (error && !scan) return <Screen back title="Résultat"><ErrorView error={error} onRetry={refetch} title="Impossible d’afficher ce résultat" /></Screen>;
  if (!scan) {
    return (
      <Screen back title="Résultat">
        <EmptyState
          icon="search"
          title="Analyse introuvable"
          body="Ce scan n’existe plus (il a peut-être été supprimé de l’historique)."
          action={{ label: 'Retour au scanner', icon: 'arrow-left', onPress: () => router.replace('/scanner') }}
        />
      </Screen>
    );
  }

  const fav = favorites.has(scan.id);
  async function remove() {
    if (del.isPending) return;
    if (!(await confirm('Supprimer cette analyse ?', 'Elle sera retirée de votre historique et de vos favoris. Le quota du mois n’est pas modifié.', 'Supprimer'))) return;
    try {
      await del.mutateAsync(scan!.id);
      router.replace('/scanner/history');
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const actions = (
    <Row wrap>
      <Button label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} icon="star" size="sm" variant="secondary" loading={toggleFavorite.isPending}
        onPress={() => !toggleFavorite.isPending && toggleFavorite.mutate({ scanId: scan.id, favorite: !fav }, { onError: (e) => toast(friendlyError(e), 'error') })} />
      <Button label="Comparer" icon="columns" size="sm" variant="ghost" onPress={() => router.push({ pathname: '/scanner/compare', params: { a: scan.id } })} />
      <Button label="Supprimer" icon="trash-2" size="sm" variant="ghost" loading={del.isPending} onPress={remove} />
    </Row>
  );

  if (!result) {
    return (
      <Screen back title="Résultat">
        <Card>
          <Text variant="heading">{scan.product_snapshot?.name ?? 'Produit'}</Text>
          <Text variant="small" muted>{[scan.product_snapshot?.brand, scan.barcode ? `EAN ${scan.barcode}` : null, frDate(scan.created_at)].filter(Boolean).join(' · ')}</Text>
          <Text variant="small" style={{ marginTop: 6 }}>Ce produit a été recherché mais pas analysé : aucun verdict n’est disponible.</Text>
          <Text variant="caption" muted style={{ marginTop: 4 }}>{RECALL_DISCLAIMER}</Text>
        </Card>
        <Button label="Analyser un produit" onPress={() => router.push(scan.kind === 'food' ? '/scanner/food' : '/scanner/product')} />
      </Screen>
    );
  }

  return (
    <Screen back title={scan.kind === 'food' ? 'Puis-je manger ou donner cet aliment ?' : 'Résultat du scan'}>
      <ResultView a={result.result as StoredAnalysis} explanation={result.explanation ?? explanation} explaining={explain.isPending} actions={actions} />
      <Button label={scan.kind === 'food' ? 'Scanner un autre aliment' : 'Scanner un autre produit'} icon="camera" variant="secondary"
        onPress={() => router.push(scan.kind === 'food' ? '/scanner/food' : '/scanner/product')} />
    </Screen>
  );
}
