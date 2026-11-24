/**
 * Boîte de médicament (Aura Vision, lot 3) : code-barres ou nom → fiche officielle de la Base de données publique des
 * médicaments (BDPM). AUCUNE IA, AUCUN crédit, AUCUNE posologie : nom, forme, présentation, titulaire,
 * commercialisation et lien vers la notice officielle. Pour la dose : l'ordonnance, le médecin ou le pharmacien.
 */
import React, { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Field, Row, Text, haptic } from '@/components/ui';
import { lookupMedicine, searchMedicine, type MedicineInfo } from '@/lib/data/hooks-settings';
import { t as tr } from '@/i18n';
import { radius, spacing } from '@/theme/tokens';

const isCode = (v: string) => /^\d{7}$|^0?\d{13}$/.test(v.replace(/\s/g, ''));

function MedicineCard({ m }: { m: MedicineInfo }) {
  return (
    <Card testID={`med-card-${m.cip13}`}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">{m.name}</Text>
        {m.presentation ? <Text variant="small">{m.presentation}</Text> : null}
        <Text variant="caption" muted>{[m.routes ? tr('med.box.route', { routes: m.routes }) : null, m.holder].filter(Boolean).join(' · ')}</Text>
        {!m.marketed ? <Banner tone="warning" title={tr('med.box.notMarketed')} /> : null}
        {m.reinforced_monitoring ? <Text variant="caption" muted>{tr('med.box.monitoring')}</Text> : null}
        <Button label={tr('med.box.notice')} icon="external-link" variant="secondary" full onPress={() => void Linking.openURL(m.notice_url)} testID="med-notice" />
        <Button label={tr('med.box.addTreatment')} icon="plus" variant="ghost" full onPress={() => router.push('/medications')} testID="med-add" />
      </View>
    </Card>
  );
}

export default function MedicineBoxScreen() {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<MedicineInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const lock = useRef(false);

  async function run(value: string) {
    const v = value.trim();
    if (!v) return;
    setBusy(true); setError(null);
    try {
      if (isCode(v)) { const m = await lookupMedicine(v.replace(/\s/g, '')); setResults(m ? [m] : []); }
      else if (v.length >= 3) setResults(await searchMedicine(v));
      else setError(tr('med.box.tooShort'));
    } catch { setError(tr('med.box.err')); } finally { setBusy(false); }
  }

  function onScanned(e: BarcodeScanningResult) {
    if (lock.current) return;
    lock.current = true; haptic('success'); setCameraOn(false);
    // Data Matrix : le GTIN suit l'identifiant « 01 » ; code-barres classique : le code tel quel
    const gtin = /01(\d{14})/.exec(e.data)?.[1] ?? e.data;
    setQuery(gtin);
    void run(gtin).finally(() => { lock.current = false; });
  }

  async function openCamera() {
    if (!permission?.granted) { const p = await requestPermission(); if (!p.granted) { setError(tr('med.box.cameraDenied')); return; } }
    setCameraOn(true);
  }

  return (
    <Screen title={tr('med.box.title')} subtitle={tr('med.box.subtitle')} back>
      <View style={{ gap: spacing.md }}>
        {/* Avertissement santé affiché EN ENTIER (pas de « Lire la suite ») */}
        <Card testID="med-safety">
          <View style={{ gap: spacing.xxs }}>
            <Text variant="label">{tr('med.box.safetyTitle')}</Text>
            <Text variant="small">{tr('med.box.safety')}</Text>
          </View>
        </Card>
        {cameraOn ? (
          <View style={{ height: 260, borderRadius: radius.lg, overflow: 'hidden' }}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'datamatrix'] }} onBarcodeScanned={onScanned} />
          </View>
        ) : Platform.OS !== 'web' ? (
          <Button label={tr('med.box.scan')} icon="camera" full onPress={() => void openCamera()} testID="med-scan" />
        ) : null}
        <Field label={tr('med.box.field')} value={query} onChangeText={setQuery} onSubmitEditing={() => void run(query)} returnKeyType="search" autoCapitalize="none" testID="med-query" />
        <Button label={tr('med.box.search')} icon="search" variant={Platform.OS === 'web' ? 'primary' : 'secondary'} full loading={busy} onPress={() => void run(query)} testID="med-search" />
        {error ? <Banner tone="warning" title={error} /> : null}
        {results && results.length === 0 ? <Text variant="small" muted testID="med-none">{tr('med.box.none')}</Text> : null}
        {results?.map((m) => <MedicineCard key={m.cip13} m={m} />)}
        <Row><Text variant="caption" muted>{tr('med.box.source')}</Text></Row>
      </View>
    </Screen>
  );
}
