/**
 * Scanner de produits : code-barres (caméra) ou saisie manuelle, analyse TRANSPARENTE d'un produit précis,
 * rappels officiels (toujours gratuits). Formulation neutre : chaque constat cite son critère et sa source ;
 * aucune note opaque, jamais « dangereux ».
 */
import React, { useMemo, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Divider, Field, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { isDemo } from '@/lib/backend';
import { useActivePregnancy, useChildren, usePremium } from '@/lib/data/hooks';
import { friendlyError, usePlanLimits, useProductLookup, useScansThisMonth, type LookupResult, type Recall } from '@/lib/data/hooks-settings';
import { childAge } from '@/lib/domain/child';
import { formatDateFr } from '@/lib/domain/dates';
import { CATEGORY_LABEL, checkBarcode, LEVEL_LABEL, scanQuota, type Finding } from '@/lib/domain/products';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const cameraAvailable = Platform.OS === 'ios' || Platform.OS === 'android';
const DEMO_CODES = ['0000000000024', '0000000000031', '0000000000055', '0000000000017'];

type Target = { kind: 'pregnancy' } | { kind: 'child'; id: string } | { kind: 'none' };

function RecallCard({ r }: { r: Recall }) {
  return (
    <Banner tone="warning" icon="alert-triangle" title={`Rappel de produit${r.is_demo ? ' (exemple fictif)' : ''} : ${r.title}`}>
      <View style={{ gap: 4 }}>
        <Text variant="small">{r.reason}</Text>
        {r.recommended_action ? <Text variant="small" weight="medium">{r.recommended_action}</Text> : null}
        {r.lot_numbers?.length ? <Text variant="small" muted>{`Lots concernés : ${r.lot_numbers.join(', ')}`}</Text> : null}
        <Text variant="caption" muted>{`Source : ${r.source} · publié le ${formatDateFr(r.published_on)}`}</Text>
        {r.official_url ? <Button label="Voir l’avis officiel" size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => Linking.openURL(r.official_url!).catch(() => undefined)} /> : null}
      </View>
    </Banner>
  );
}

function FindingRow({ f }: { f: Finding }) {
  const t = useTheme();
  const color = f.level === 'avoid_advised' ? t.colors.danger : f.level === 'attention' ? t.colors.gold : t.colors.lavender;
  const icon = f.level === 'info' ? 'info' : 'alert-circle';
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs }}>
      <Icon name={icon} size={18} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" weight="bold" color={color}>{LEVEL_LABEL[f.level]}</Text>
        <Text weight="medium">{f.title}</Text>
        <Text variant="small" muted>{`Critère : ${f.criterion}`}</Text>
        <Text variant="caption" muted>{`Source : ${f.source}`}</Text>
      </View>
    </View>
  );
}

export default function ScannerScreen() {
  const t = useTheme();
  const toast = useToast();
  const premium = usePremium();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  const { count: used } = useScansThisMonth();
  const { data: limits } = usePlanLimits();
  const lookup = useProductLookup();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraOn, setCameraOn] = useState(false);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const lock = useRef(false);

  const defaultTarget: Target = pregnancy ? { kind: 'pregnancy' } : children?.[0] ? { kind: 'child', id: children[0].id } : { kind: 'none' };
  const [targetState, setTarget] = useState<Target | null>(null);
  const target = targetState ?? defaultTarget;

  const limit = limits?.find((l) => l.key === 'product_scans_per_month');
  const quota = scanQuota(used, premium ? (limit?.premium_value ?? 1000) : (limit?.free_value ?? 10));

  const context = useMemo(() => {
    if (target.kind === 'pregnancy') return { pregnant: true };
    if (target.kind === 'child') {
      const c = children?.find((x) => x.id === target.id);
      if (c) return { childAgeMonths: childAge(c.birth_date).months, childDeclaredAllergies: c.allergies_declared ?? [] };
    }
    return {};
  }, [target, children]);

  async function run(raw: string) {
    const check = checkBarcode(raw);
    if (!check.ok) { setManualError(check.error); return; }
    setManualError(null);
    setWarning(check.warning ?? null);
    setResult(null);
    setConfirmed(false);
    setLastCode(check.code);
    try {
      const r = await lookup.mutateAsync({ barcode: check.code, confirm: false, context });
      setResult(r);
    } catch (e) {
      toast(friendlyError(e, 'La recherche n’a pas abouti. Vérifiez votre connexion.'), 'error');
    }
  }

  async function confirmProduct() {
    if (!lastCode) return;
    if (quota.reached && !premium) { setConfirmed(true); return; }
    try {
      const r = await lookup.mutateAsync({ barcode: lastCode, confirm: true, context });
      setResult(r);
      setConfirmed(true);
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  function onScanned(e: BarcodeScanningResult) {
    if (lock.current) return;
    lock.current = true;
    setCameraOn(false);
    setManual(e.data);
    run(e.data).finally(() => { lock.current = false; });
  }

  async function openCamera() {
    if (!permission?.granted) {
      const p = await requestPermission();
      if (!p.granted) {
        toast(p.canAskAgain ? 'Autorisation de la caméra refusée.' : 'Autorisez la caméra dans les réglages du téléphone.', 'error');
        return;
      }
    }
    setResult(null);
    setCameraOn(true);
  }

  const assessment = result?.assessment;
  // Le scan confirmé est compté : au-delà du quota gratuit, seuls les rappels officiels restent affichés
  const analysisBlocked = confirmed && quota.reached && !premium && result?.needs_confirmation !== false;
  const showAnalysis = confirmed && !analysisBlocked;

  return (
    <Screen back title="Scanner un produit" subtitle="Composition, précautions et rappels officiels, avec leurs sources.">
      {isDemo ? (
        <Banner tone="demo" title="Base de démonstration">{`Les produits disponibles ici sont FICTIFS. Essayez par exemple ${DEMO_CODES.slice(0, 2).join(' ou ')}.`}</Banner>
      ) : null}

      <Card>
        <Text variant="label">Pour qui ?</Text>
        <Row wrap style={{ marginTop: 6 }}>
          {pregnancy ? <Chip label="Grossesse" icon="moon" selected={target.kind === 'pregnancy'} onPress={() => setTarget({ kind: 'pregnancy' })} /> : null}
          {(children ?? []).map((c) => (
            <Chip key={c.id} label={c.first_name} selected={target.kind === 'child' && target.id === c.id} onPress={() => setTarget({ kind: 'child', id: c.id })} />
          ))}
          <Chip label="Sans profil" selected={target.kind === 'none'} onPress={() => setTarget({ kind: 'none' })} />
        </Row>
        <Text variant="caption" muted style={{ marginTop: 6 }}>L’analyse tient compte de la grossesse, de l’âge et des allergies déclarées. Ces informations ne quittent pas votre compte.</Text>
      </Card>

      {cameraAvailable ? (
        cameraOn ? (
          <View style={[styles.camera, { borderColor: t.colors.border }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={onScanned}
            />
            <View pointerEvents="none" style={styles.frame} />
            <View style={styles.cameraFooter}>
              <Button label="Fermer la caméra" size="sm" variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} onPress={() => setCameraOn(false)} />
            </View>
          </View>
        ) : (
          <Button label="Scanner un code-barres" icon="camera" size="lg" onPress={openCamera} />
        )
      ) : (
        <Banner tone="info">{'Le scan par caméra est disponible sur téléphone. Ici, saisissez les chiffres du code-barres.'}</Banner>
      )}

      <Card>
        <Field label="Saisir le code-barres" value={manual} onChangeText={setManual} keyboardType="number-pad" maxLength={18} error={manualError} hint="Les 8 à 13 chiffres sous les barres." returnKeyType="search" onSubmitEditing={() => run(manual)} />
        <Button label="Rechercher" variant="secondary" icon="search" loading={lookup.isPending && !confirmed} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => run(manual)} />
        {isDemo ? (
          <Row wrap style={{ marginTop: spacing.sm }}>
            {DEMO_CODES.map((c) => <Chip key={c} label={c} onPress={() => { setManual(c); run(c); }} />)}
          </Row>
        ) : null}
      </Card>
      {warning ? <Banner tone="warning">{warning}</Banner> : null}

      {!premium ? (
        quota.reached ? (
          <Banner tone="info" title="Analyses détaillées du mois utilisées" action={<Button label="Découvrir l’abonnement" size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />}>
            {`Vous avez utilisé vos ${limit?.free_value ?? 10} analyses gratuites ce mois-ci. Les rappels officiels restent toujours affichés.`}
          </Banner>
        ) : (
          <Text variant="caption" muted>{`Analyses gratuites restantes ce mois-ci : ${quota.remaining}. Les rappels officiels sont toujours gratuits.`}</Text>
        )
      ) : null}

      {result ? (
        <>
          {result.recalls?.length ? (
            <>
              <SectionTitle title="Rappels officiels" />
              {result.recalls.map((r) => <RecallCard key={r.id} r={r} />)}
            </>
          ) : null}

          {!result.found ? (
            <Card tone="soft">
              <Text weight="bold">Produit introuvable</Text>
              <Text variant="small" muted style={{ marginTop: 4 }}>{result.message ?? 'Ce produit n’est pas dans nos bases.'}</Text>
              {!result.recalls?.length ? <Text variant="caption" muted style={{ marginTop: 4 }}>Aucun rappel officiel n’a été trouvé pour ce code-barres.</Text> : null}
            </Card>
          ) : result.product ? (
            <>
              <SectionTitle title="Produit" />
              <Card>
                {result.product.is_demo ? (
                  <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: t.colors.dangerSoft, marginBottom: 6 }}>
                    <Text variant="caption" weight="bold" color={t.colors.danger}>DONNÉES FICTIVES — démonstration</Text>
                  </View>
                ) : null}
                <Text variant="heading">{result.product.name}</Text>
                <Text variant="small" muted>{[result.product.brand, CATEGORY_LABEL[result.product.category] ?? result.product.category].filter(Boolean).join(' · ')}</Text>
                <Text variant="caption" muted style={{ marginTop: 4 }}>{`Données : ${result.product.data_source}, récupérées le ${formatDateFr(result.product.data_retrieved_at.slice(0, 10))}`}</Text>
                {!confirmed ? (
                  <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                    <Text weight="medium">Est-ce bien le produit que vous avez en main ?</Text>
                    <Row wrap>
                      <Button label="Oui, voir l’analyse" size="sm" loading={lookup.isPending} onPress={confirmProduct} />
                      <Button label="Non" size="sm" variant="ghost" onPress={() => { setResult(null); setManual(''); }} />
                    </Row>
                  </View>
                ) : null}
              </Card>

              {confirmed && analysisBlocked ? (
                <Card tone="gold">
                  <Text weight="bold">Analyse détaillée non incluse ce mois-ci</Text>
                  <Text variant="small" muted style={{ marginTop: 4 }}>Les rappels officiels ci-dessus restent affichés gratuitement. En cas de doute, lisez l’emballage ou demandez conseil à votre pharmacien.</Text>
                  <Button label="Découvrir l’abonnement" size="sm" variant="secondary" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />
                </Card>
              ) : null}

              {showAnalysis && !analysisBlocked && assessment ? (
                <>
                  <SectionTitle title="Analyse" />
                  <Card>
                    {assessment.findings.length ? assessment.findings.map((f, i) => (
                      <View key={`${f.title}${i}`}>
                        {i > 0 ? <Divider /> : null}
                        <FindingRow f={f} />
                      </View>
                    )) : (
                      <Text variant="small">Aucun constat particulier pour ce profil d’après les données disponibles.</Text>
                    )}
                  </Card>
                  {assessment.limited ? (
                    <Banner tone="info" title="Version gratuite" action={<Button label="Voir le détail avec l’abonnement" size="sm" variant="ghost" style={{ marginTop: 4, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />}>
                      {'Seuls les constats principaux (précautions généralement recommandées) sont affichés. L’abonnement détaille aussi les informations, points d’attention et allergènes déclarés.'}
                    </Banner>
                  ) : null}
                  {assessment.missing.length ? (
                    <Card tone="soft">
                      <Text weight="bold">Informations manquantes</Text>
                      <Text variant="small" muted style={{ marginTop: 2 }}>L’analyse ne peut pas en tenir compte :</Text>
                      {assessment.missing.map((m) => <Text key={m} variant="small">{`• ${m}`}</Text>)}
                    </Card>
                  ) : null}
                  <View style={{ gap: 4 }}>
                    {assessment.disclaimers.map((d) => <Text key={d} variant="caption" muted weight={/FICTIVES/.test(d) ? 'bold' : undefined}>{d}</Text>)}
                  </View>
                </>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: { height: 320, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, backgroundColor: '#000' },
  frame: { position: 'absolute', left: '12%', right: '12%', top: '32%', bottom: '32%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: radius.md },
  cameraFooter: { position: 'absolute', bottom: spacing.sm, left: 0, right: 0, alignItems: 'center' },
});
