/**
 * Comparaison de deux produits côte à côte. Chaque produit garde SA propre analyse (profil, sources, date) :
 * aucun classement, aucune note globale.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Divider, Row, SectionTitle, Text } from '@/components/ui';
import { useScan, useScanHistory } from '@/lib/data/hooks-scanner';
import { CERTAINTY_LABEL, DEMO_LABEL } from '@/lib/domain/scanCommon';
import { frDate } from '@/lib/domain/scanSources';
import type { ScanRow } from '@/lib/types-scanner';
import { VerdictBadge, type StoredAnalysis } from '@/features/scanner/components';
import { spacing } from '@/theme/tokens';

function lines(a: StoredAnalysis): { label: string; value: string }[] {
  const out = [
    { label: 'Pour', value: a.profileLabel },
    { label: 'Certitude', value: CERTAINTY_LABEL[a.certainty] },
    { label: 'Rappels officiels', value: a.recalls.length ? `${a.recalls.length} rappel(s)` : a.recallCheck?.checked ? 'Aucun trouvé' : 'Non vérifié' },
  ];
  if (a.kind === 'product') {
    out.push(
      { label: 'Type', value: a.product.typeLabel },
      { label: 'Parfum', value: a.perfume === 'present' ? 'Oui' : a.perfume === 'absent' ? 'Non indiqué' : 'Inconnu' },
      { label: 'Allergènes de parfum', value: a.fragranceAllergens.length ? a.fragranceAllergens.join(', ') : a.ingredients.length ? 'Aucun repéré' : 'Inconnu' },
      { label: 'Huiles essentielles', value: a.essentialOils.length ? a.essentialOils.join(', ') : a.ingredients.length ? 'Aucune repérée' : 'Inconnu' },
    );
  } else {
    out.push({ label: 'Ingrédients', value: a.ingredients.length ? `${a.ingredients.length} listé(s)` : 'Inconnus' });
  }
  out.push(
    { label: 'Informations manquantes', value: a.missing.length ? a.missing.join(' ; ') : 'Aucune signalée' },
    { label: 'Sources', value: a.sources.map((s) => s.publisher).filter((x, i, arr) => arr.indexOf(x) === i).join(', ') },
    { label: 'Analysé le', value: frDate(a.analysedOn) },
  );
  return out;
}

function Column({ id, onClear }: { id: string; onClear: () => void }) {
  const { scan, result, isLoading, error, refetch } = useScan(id);
  if (isLoading && !scan) return <View style={{ flex: 1 }}><Skeleton kind="detail" rows={4} /></View>;
  if (error && !scan) return <View style={{ flex: 1 }}><ErrorView error={error} onRetry={refetch} title="Fiche indisponible" /></View>;
  if (!scan) {
    return (
      <Card style={{ flex: 1 }}>
        <Text variant="small" muted>Cette analyse n’existe plus.</Text>
        <Button label="Changer" size="sm" variant="ghost" onPress={onClear} />
      </Card>
    );
  }
  const a = result?.result as StoredAnalysis | undefined;
  return (
    <Card style={{ flex: 1 }}>
      <Text weight="bold">{scan?.product_snapshot?.name ?? 'Produit'}</Text>
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
      ) : <Text variant="small" muted>Pas d’analyse enregistrée.</Text>}
      <Divider />
      <Button label="Voir la fiche" size="sm" variant="ghost" onPress={() => router.push(`/scanner/result/${id}`)} />
      <Button label="Changer" size="sm" variant="ghost" onPress={onClear} />
    </Card>
  );
}

export default function CompareScreen() {
  const params = useLocalSearchParams<{ a?: string; b?: string }>();
  const [a, setA] = useState<string | null>(params.a ?? null);
  const [b, setB] = useState<string | null>(params.b ?? null);
  const historyQ = useScanHistory();
  const { data: history } = historyQ;
  const pickable = (history ?? []).filter((s: ScanRow) => s.id !== a && s.id !== b);

  function pick(id: string) {
    if (!a) setA(id);
    else if (!b) setB(id);
  }

  return (
    <Screen back title="Comparer deux produits" subtitle="Chaque produit est analysé séparément, avec ses propres sources.">
      <Banner tone="info">{'Aucun classement ni note globale : comparez les verdicts et les informations de chaque fiche. Deux analyses faites pour des profils différents ne sont pas comparables.'}</Banner>
      <Row style={{ alignItems: 'flex-start' }}>
        {a ? <Column id={a} onClear={() => setA(null)} /> : <Card style={{ flex: 1 }}><Text variant="small" muted>Choisissez un premier produit ci-dessous.</Text></Card>}
        {b ? <Column id={b} onClear={() => setB(null)} /> : <Card style={{ flex: 1 }}><Text variant="small" muted>Choisissez un second produit ci-dessous.</Text></Card>}
      </Row>
      {!a || !b ? (
        <>
          <SectionTitle title="Dans votre historique" />
          {historyQ.isLoading && !history ? <Skeleton kind="list" rows={2} /> : historyQ.isError && !history ? (
            <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title="Impossible d’afficher votre historique" />
          ) : pickable.length ? (
            <Row wrap>{pickable.slice(0, 30).map((s) => <Chip key={s.id} label={`${s.product_snapshot?.name ?? 'Sans nom'}${s.kind === 'food' ? ' (aliment)' : ''}`} onPress={() => pick(s.id)} />)}</Row>
          ) : (
            <EmptyState icon="columns" title="Analysez d’abord au moins deux produits." action={{ label: 'Scanner un produit', icon: 'camera', onPress: () => router.push('/scanner/product') }} />
          )}
        </>
      ) : null}
    </Screen>
  );
}
