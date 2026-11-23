/**
 * Comparaison de deux analyses, lisible sur petit écran : deux emplacements (A, B), puis UN TABLEAU par critère
 * (libellé en pleine largeur, valeurs A et B côte à côte, surface mate). Chaque produit garde SA propre analyse
 * (profil, sources, date) : aucun classement, aucune note globale. Une valeur inconnue est dite « Inconnu » ;
 * un critère propre à l'autre type (produit / aliment) est « Sans objet ».
 * États : chargement, erreur (réessayer), analyse supprimée, historique vide, accès Premium.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PremiumSection } from '@/components/Premium';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Divider, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { SecondaryButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { useScan, useScanHistory } from '@/lib/data/hooks-scanner';
import { CERTAINTY_LABEL, DEMO_LABEL } from '@/lib/domain/scanCommon';
import { frDate } from '@/lib/domain/scanSources';
import type { ScanRow } from '@/lib/types-scanner';
import { VerdictBadge, type StoredAnalysis } from '@/features/scanner/components';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

type Line = { key: string; label: string; value: string };

function lines(a: StoredAnalysis): Line[] {
  const out: Line[] = [
    { key: 'for', label: tr('u8.compare.for'), value: a.profileLabel },
    { key: 'certainty', label: tr('u8.compare.certainty'), value: CERTAINTY_LABEL[a.certainty] },
    { key: 'recalls', label: tr('u8.compare.recalls'), value: a.recalls.length ? tr('u8.compare.recallCount', { count: a.recalls.length }) : a.recallCheck?.checked ? tr('u8.compare.noneFound') : tr('u8.compare.notChecked') },
  ];
  if (a.kind === 'product') {
    out.push(
      { key: 'type', label: tr('u8.compare.type'), value: a.product.typeLabel },
      { key: 'perfume', label: tr('u8.compare.perfume'), value: a.perfume === 'present' ? tr('u8.compare.yes') : a.perfume === 'absent' ? tr('u8.compare.notStated') : tr('u8.compare.unknown') },
      { key: 'frag', label: tr('u8.compare.fragAllergens'), value: a.fragranceAllergens.length ? a.fragranceAllergens.join(', ') : a.ingredients.length ? tr('u8.compare.noneSpotted') : tr('u8.compare.unknown') },
      { key: 'oils', label: tr('u8.compare.essOils'), value: a.essentialOils.length ? a.essentialOils.join(', ') : a.ingredients.length ? tr('u8.compare.noneSpottedF') : tr('u8.compare.unknown') },
    );
  } else {
    out.push({ key: 'ingredients', label: tr('u8.compare.ingredients'), value: a.ingredients.length ? tr('u8.compare.listed', { count: a.ingredients.length }) : tr('u8.compare.unknownP') });
  }
  out.push(
    { key: 'missing', label: tr('u8.compare.missingInfo'), value: a.missing.length ? a.missing.join(' ; ') : tr('u8.compare.noneReported') },
    { key: 'sources', label: tr('u8.compare.sources'), value: a.sources.map((s) => s.publisher).filter((x, i, arr) => arr.indexOf(x) === i).join(', ') },
    { key: 'date', label: tr('u8.compare.analysedOn'), value: frDate(a.analysedOn) },
  );
  return out;
}

/** Lignes du tableau : critères de A puis ceux propres à B (ordre stable). */
function tableRows(a: StoredAnalysis | undefined, b: StoredAnalysis | undefined) {
  const la = a ? lines(a) : [];
  const lb = b ? lines(b) : [];
  const keys = [...la.map((l) => l.key), ...lb.map((l) => l.key).filter((k) => !la.some((l) => l.key === k))];
  const na = tr('scn.cmp.na');
  return keys.map((k) => {
    const x = la.find((l) => l.key === k);
    const y = lb.find((l) => l.key === k);
    return { key: k, label: (x ?? y)!.label, a: x?.value ?? na, b: y?.value ?? na };
  });
}

/** Emplacement A ou B : produit choisi (nom, verdict, voir / changer) ou invitation à choisir. */
function Slot({ letter, id, onClear, locked }: { letter: 'A' | 'B'; id: string | null; onClear: () => void; locked?: boolean }) {
  const t = useTheme();
  const { scan, result, isLoading, error, refetch } = useScan(locked ? null : id);
  const badge = (
    <View style={{ alignSelf: 'flex-start', minWidth: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: t.material.lines.iconWell }}>
      <Text variant="caption" weight="bold" color={t.colors.primary}>{letter}</Text>
    </View>
  );
  let body: React.ReactNode;
  if (!id) body = <Text variant="small" muted>{letter === 'A' ? tr('u8.compare.pickFirst') : tr('u8.compare.pickSecond')}</Text>;
  else if (locked) body = <Text variant="small" muted>{tr('scn.cmp.locked')}</Text>;
  else if (isLoading && !scan) body = <Skeleton kind="detail" rows={2} />;
  else if (error && !scan) body = <ErrorView error={error} onRetry={refetch} title={tr('u8.compare.unavailable')} />;
  else if (!scan) body = <Text variant="small" muted>{tr('u8.compare.gone')}</Text>;
  else {
    const a = result?.result as StoredAnalysis | undefined;
    body = (
      <>
        <Text weight="bold" numberOfLines={3}>{scan.product_snapshot?.name ?? tr('u8.compare.product')}</Text>
        <Text variant="caption" muted>{[scan.kind === 'food' ? tr('u6.sc.food') : tr('u6.sc.product'), scan.product_snapshot?.brand].filter(Boolean).join(' · ')}</Text>
        {a?.demo ? <Text variant="caption" weight="bold">{DEMO_LABEL}</Text> : null}
        {a ? <VerdictBadge verdict={a.verdict} small /> : <Text variant="small" muted>{tr('u8.compare.noSaved')}</Text>}
        <SecondaryButton label={tr('u8.compare.viewSheet')} size="sm" onPress={() => router.push(`/scanner/result/${id}`)} />
      </>
    );
  }
  return (
    <MatteSurface radius={radius.lg} padded={spacing.sm} style={{ flex: 1, minWidth: 0 }} contentStyle={{ gap: 6 }} testID={`compare-slot-${letter}`}>
      {badge}
      {body}
      {id ? <SecondaryButton label={tr('u8.compare.change')} size="sm" onPress={onClear} testID={`compare-change-${letter}`} /> : null}
    </MatteSurface>
  );
}

function Table({ a, b }: { a: string; b: string }) {
  const qa = useScan(a);
  const qb = useScan(b);
  if ((qa.isLoading && !qa.scan) || (qb.isLoading && !qb.scan)) return <Skeleton kind="card" rows={3} />;
  const ra = qa.result?.result as StoredAnalysis | undefined;
  const rb = qb.result?.result as StoredAnalysis | undefined;
  if (!ra || !rb) return null;
  const rows = tableRows(ra, rb);
  return (
    <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }} testID="compare-table">
      <Text variant="label" accessibilityRole="header">{tr('scn.cmp.table')}</Text>
      {rows.map((r, i) => (
        <View key={r.key} style={{ gap: 4 }} accessible accessibilityLabel={tr('scn.cmp.rowA11y', { label: r.label, a: r.a, b: r.b })} testID={`compare-row-${r.key}`}>
          {i > 0 ? <Divider /> : null}
          <Text variant="caption" muted weight="bold">{r.label}</Text>
          <Row gap={spacing.sm} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', gap: 6 }}><Text variant="caption" weight="bold" muted>A</Text><Text variant="small" style={{ flex: 1 }}>{r.a}</Text></View>
            <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', gap: 6 }}><Text variant="caption" weight="bold" muted>B</Text><Text variant="small" style={{ flex: 1 }}>{r.b}</Text></View>
          </Row>
        </View>
      ))}
    </MatteSurface>
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
  const nameOf = (id: string | null, fallback: string) => (history ?? []).find((x: ScanRow) => x.id === id)?.product_snapshot?.name ?? fallback;

  function pick(id: string) {
    if (!a) setA(id);
    else if (!b) setB(id);
  }

  return (
    <Screen back title={tr('u8.compare.title')} subtitle={tr('u8.compare.subtitle')}>
      <Banner tone="info">{tr('u8.compare.banner')}</Banner>
      <Row style={{ alignItems: 'stretch' }}>
        <Slot letter="A" id={a} onClear={() => setA(null)} locked={!!(a && b && !compareAccess.premium)} />
        <Slot letter="B" id={b} onClear={() => setB(null)} locked={!!(a && b && !compareAccess.premium)} />
      </Row>
      {a && b && !compareAccess.premium ? (
        <PremiumSection feature="scanner_compare" preview={<Text variant="small">{tr('u8.compare.preview', { a: nameOf(a, tr('u8.compare.product1')), b: nameOf(b, tr('u8.compare.product2')) })}</Text>}><View /></PremiumSection>
      ) : null}
      {a && b && compareAccess.premium ? <Table a={a} b={b} /> : null}
      {!a || !b ? (
        <>
          <SectionTitle title={tr('u8.compare.inHistory')} />
          {historyQ.isLoading && !history ? <Skeleton kind="list" rows={2} /> : historyQ.isError && !history ? (
            <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title={tr('u8.compare.historyErr')} />
          ) : pickable.length ? (
            <MatteSurface radius={radius.lg} testID="compare-picker">
              {pickable.slice(0, 30).map((s) => (
                <ListRow key={s.id} icon={s.kind === 'food' ? 'search' : 'maximize'} title={`${s.product_snapshot?.name ?? tr('u8.compare.noName')}${s.kind === 'food' ? tr('u8.compare.foodSuffix') : ''}`}
                  subtitle={[s.product_snapshot?.brand, s.analysed_at ? frDate(s.analysed_at) : null].filter(Boolean).join(' · ') || undefined}
                  onPress={() => pick(s.id)} testID={`compare-pick-${s.id}`} />
              ))}
            </MatteSurface>
          ) : (
            <EmptyState icon="columns" title={tr('u8.compare.needTwo')} action={{ label: tr('u8.compare.scanProduct'), icon: 'camera', onPress: () => router.push('/scanner/product') }} />
          )}
        </>
      ) : null}
    </Screen>
  );
}
