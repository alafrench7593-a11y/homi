/**
 * Parcours de scan (produit ou aliment) :
 *   1. saisie : code-barres (caméra), photo du produit, photo de la liste d'ingrédients, import d'une photo,
 *      recherche par nom ou EAN ; la reconnaissance des photos se fait SUR LE TÉLÉPHONE (Google ML Kit) ;
 *   2. confirmation : « Est-ce bien ce produit ? » (rappels officiels affichés dès qu'ils sont connus) ;
 *   3. détails : pour qui, type et usage (produit) ou questions complémentaires (aliment), relecture des ingrédients ;
 *   4. analyse par les règles, enregistrement, puis fiche résultat (explication IA demandée côté serveur).
 */
import React, { useMemo, useRef, useState } from 'react';
import { Image, Linking, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Divider, Field, Row, SectionTitle, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  GENERIC_PROFILES, QuotaReachedError, lookupCosing, searchCiqual, useCheckRecalls, useFoodsCatalog, useLookupBarcode, useSaveAnalysis,
  useScanProfileOptions, useScanQuota, useSearchProducts,
} from '@/lib/data/hooks-scanner';
import { checkBarcode } from '@/lib/domain/products';
import { profileLabel, type ScanProfile } from '@/lib/domain/scanCommon';
import {
  asProductType, buildFoodInput, buildProductInput, catalogMatches, ingredientNamesForCosing, parseAllergies, recallCheckOf, snapshotOf,
  PRODUCT_TYPES, type ConfirmedSubject, type IngredientsOrigin,
} from '@/lib/domain/scanFlow';
import { analyzeFood, foodQuestions, type FoodAnswers } from '@/lib/domain/scanFood';
import { frontTextToQuery } from '@/lib/domain/scanOcr';
import { analyzeProduct, EXPOSURE_LABEL, PRODUCT_TYPE_LABEL, ZONE_LABEL, type Exposure, type ProductType, type Zone } from '@/lib/domain/scanProduct';
import {
  LOCAL_RECOGNITION_UNAVAILABLE, LocalRecognitionUnavailable, localBarcodeRecognitionAvailable, localTextRecognitionAvailable, readBarcodesFromImage,
  readTextFromImage, type TextReading,
} from '@/lib/scanner/localRecognition';
import type { CiqualFood, DatabaseStatus, LookupResponse, ProductCandidate, RecallRow, ScanKind, ScanMethod } from '@/lib/types-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { DemoTag, RecallCard } from './components';
import { RECALL_DISCLAIMER } from '@/lib/domain/scanCommon';

const cameraAvailable = Platform.OS === 'ios' || Platform.OS === 'android';
const DEMO_CODES: Record<ScanKind, string[]> = {
  product: ['0000000000062', '0000000000079', '0000000000086', '0000000000017'],
  food: ['0000000000093', '0000000000024', '0000000000031', '0000000000055'],
};
const EXPOSURES: Exposure[] = ['rinse_off', 'leave_on', 'inhaled', 'indirect'];
const ZONES: Zone[] = ['face', 'body', 'diaper_area', 'scalp', 'lips', 'hands', 'air', 'textiles', 'surfaces'];

type Step = 'input' | 'confirm' | 'details';
interface LookupState { recalls: RecallRow[]; recall_check: LookupResponse['recall_check'] | null; database?: DatabaseStatus; message?: string }

export function ScanFlow({ kind }: { kind: ScanKind }) {
  const t = useTheme();
  const toast = useToast();
  const lookupBarcode = useLookupBarcode();
  const search = useSearchProducts();
  const checkRecalls = useCheckRecalls();
  const save = useSaveAnalysis();
  const { data: quota } = useScanQuota();
  const { data: foods } = useFoodsCatalog();
  const options = useScanProfileOptions();
  const [permission, requestPermission] = useCameraPermissions();
  const localText = localTextRecognitionAvailable();
  const localBarcode = localBarcodeRecognitionAvailable();

  const [step, setStep] = useState<Step>('input');
  const [method, setMethod] = useState<ScanMethod>('manual');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraDenied, setCameraDenied] = useState<'ask' | 'settings' | null>(null);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<ProductCandidate[]>([]);
  const [ciqual, setCiqual] = useState<CiqualFood[]>([]);
  const [lookup, setLookup] = useState<LookupState>({ recalls: [], recall_check: null });
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [subject, setSubject] = useState<ConfirmedSubject | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [ocr, setOcr] = useState<TextReading | null>(null);
  // Produit
  const [ptype, setPtype] = useState<ProductType | null>(null);
  const [ingredients, setIngredients] = useState('');
  const [origin, setOrigin] = useState<IngredientsOrigin>(null);
  const [precautions, setPrecautions] = useState('');
  const [pao, setPao] = useState('');
  const [exposure, setExposure] = useState<Exposure | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  // Aliment
  const [answers, setAnswers] = useState<FoodAnswers>({});
  const [openedText, setOpenedText] = useState('');
  // Profil
  const [profileKey, setProfileKey] = useState<string | null>(null);
  const [ageText, setAgeText] = useState('');
  const [allergiesText, setAllergiesText] = useState('');
  const [quotaReached, setQuotaReached] = useState(false);
  const lock = useRef(false);

  // ------------------------------------------------------------ profil
  const selectedKey = profileKey ?? options[0]?.key ?? null;
  const generic = GENERIC_PROFILES.find((g) => g.key === selectedKey) ?? null;
  const profile: ScanProfile | null = useMemo(() => {
    const declared = parseAllergies(allergiesText);
    const o = options.find((x) => x.key === selectedKey);
    if (o) return { ...o.profile, allergies: [...(o.profile.allergies ?? []), ...(kind === 'product' ? declared : [])] };
    if (!generic) return null;
    const n = Number(ageText.replace(',', '.'));
    const ageMonths = !generic.needsAge || !ageText.trim() || !Number.isFinite(n) || n < 0 ? null : generic.kind === 'child' ? Math.round(n * 12) : Math.round(n);
    return { kind: generic.kind, ageMonths: generic.needsAge ? ageMonths : undefined, allergies: kind === 'product' ? declared : [] };
  }, [options, selectedKey, generic, ageText, allergiesText, kind]);

  // ------------------------------------------------------------ identification
  function reset() {
    setStep('input'); setCandidates([]); setCiqual([]); setLookup({ recalls: [], recall_check: null }); setScannedBarcode(null); setSubject(null);
    setNotice(null); setQuotaReached(false);
  }

  async function identifyBarcode(raw: string, m: ScanMethod) {
    const check = checkBarcode(raw);
    if (!check.ok) { setNotice(check.error); return; }
    setBusy('Recherche du produit…');
    try {
      const r = await lookupBarcode.mutateAsync({ barcode: check.code, kind });
      setScannedBarcode(check.code);
      setLookup({ recalls: r.recalls ?? [], recall_check: r.recall_check ?? null, database: r.database, message: r.message });
      setCandidates(r.found && r.product ? [r.product] : []);
      setCiqual([]);
      setManualName('');
      setNotice(check.warning ?? null);
      setMethod(m);
      setStep('confirm');
    } catch (e) {
      toast(friendlyError(e, 'La recherche n’a pas abouti. Vérifiez votre connexion.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function runSearch(text: string, m: ScanMethod) {
    const q = text.trim();
    const digits = q.replace(/[\s-]/g, '');
    if (/^\d{8,14}$/.test(digits)) return identifyBarcode(digits, m === 'search' ? 'manual' : m);
    if (q.length < 2) { setNotice('Saisissez au moins 2 caractères, ou les chiffres du code-barres.'); return; }
    setBusy('Recherche…');
    try {
      const [r, cq] = await Promise.all([search.mutateAsync({ query: q, kind }), kind === 'food' ? searchCiqual(q) : Promise.resolve([] as CiqualFood[])]);
      setCandidates(r.candidates ?? []);
      setCiqual(cq);
      setLookup({ recalls: [], recall_check: null, database: r.database, message: r.message });
      setScannedBarcode(null);
      setManualName(q);
      setNotice(null);
      setMethod(m);
      setStep('confirm');
    } catch (e) {
      toast(friendlyError(e, 'La recherche n’a pas abouti. Vérifiez votre connexion.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  function onScanned(e: BarcodeScanningResult) {
    if (lock.current) return;
    lock.current = true;
    setCameraOn(false);
    identifyBarcode(e.data, 'barcode').finally(() => { lock.current = false; });
  }

  async function openCamera() {
    try {
      if (!permission?.granted) {
        const p = await requestPermission();
        if (!p.granted) { setCameraDenied(p.canAskAgain ? 'ask' : 'settings'); return; }
      }
      setCameraDenied(null);
      setCameraOn(true);
    } catch {
      setNotice('La caméra n’a pas pu être ouverte. Saisissez le code-barres ou le nom du produit.');
    }
  }

  function applyReading(reading: TextReading) {
    setOcr(reading);
    const text = reading.ingredients ?? reading.text.trim().slice(0, 2000);
    if (text) { setIngredients(text); setOrigin('ocr_reviewed'); }
    if (reading.precautions) setPrecautions(reading.precautions);
  }

  async function fromPhoto(source: 'camera' | 'library', purpose: 'product' | 'ingredients') {
    if (!localText && !localBarcode) { setNotice(LOCAL_RECOGNITION_UNAVAILABLE); return; }
    let res: ImagePicker.ImagePickerResult;
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        if (source === 'camera') setCameraDenied(perm.canAskAgain ? 'ask' : 'settings');
        else toast('Autorisez l’accès aux photos dans les réglages du téléphone.', 'error');
        return;
      }
      res = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: false });
    } catch {
      toast(source === 'camera' ? 'L’appareil photo n’a pas pu être ouvert.' : 'La galerie n’a pas pu être ouverte.', 'error');
      return;
    }
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    setBusy('Lecture de la photo sur le téléphone…');
    try {
      if (purpose === 'product') {
        const codes = localBarcode ? await readBarcodesFromImage(uri) : [];
        if (codes[0]) { setBusy(null); await identifyBarcode(codes[0], source === 'camera' ? 'photo_barcode' : 'import'); return; }
        const reading = await readTextFromImage(uri);
        if (reading.ingredients) applyReading(reading);
        if (reading.printedBarcode) { setBusy(null); await identifyBarcode(reading.printedBarcode, source === 'camera' ? 'photo' : 'import'); return; }
        const q = frontTextToQuery(reading.text);
        if (q.length >= 2) { setQuery(q); setBusy(null); await runSearch(q, source === 'camera' ? 'photo' : 'import'); return; }
        setNotice('Ni code-barres ni nom lisible sur la photo. Saisissez le nom ou le code-barres du produit.');
      } else {
        const reading = await readTextFromImage(uri);
        applyReading(reading);
        if (step === 'input') {
          setMethod('ingredients_photo');
          if (reading.printedBarcode) { setBusy(null); await identifyBarcode(reading.printedBarcode, 'ingredients_photo'); return; }
          setNotice('Liste des ingrédients lue. Identifiez maintenant le produit (nom ou code-barres) pour continuer ; vous pourrez relire le texte.');
        }
      }
    } catch (e) {
      setNotice(e instanceof LocalRecognitionUnavailable ? e.message : 'La photo n’a pas pu être lue. Réessayez avec plus de lumière, ou saisissez les informations.');
    } finally {
      setBusy(null);
    }
  }

  // ------------------------------------------------------------ confirmation
  async function refreshRecalls(s: ConfirmedSubject) {
    try {
      const r = await checkRecalls.mutateAsync({ barcode: s.barcode, brand: s.brand, name: s.name });
      setLookup((l) => ({ ...l, recalls: r.recalls ?? [], recall_check: r.recall_check ?? null }));
    } catch {
      setLookup((l) => ({ ...l, recall_check: { checked: false, source: 'RappelConso', error: 'La vérification des rappels officiels n’a pas pu être faite (connexion). Consultez rappel.conso.gouv.fr.' } }));
    }
  }

  function confirmSubject(s: ConfirmedSubject) {
    setSubject(s);
    const c = s.candidate;
    if (c) {
      setPtype(asProductType(c.product_type));
      if (c.ingredients_text && origin !== 'ocr_reviewed') { setIngredients(c.ingredients_text); setOrigin('database'); }
      if (c.precautions_text && !precautions) setPrecautions(c.precautions_text);
      if (c.period_after_opening && !pao) setPao(c.period_after_opening);
    }
    // Rappels : déjà vérifiés par la recherche du code-barres, sinon vérification pour CE produit
    if (!(lookup.recall_check && s.barcode && s.barcode === scannedBarcode)) refreshRecalls(s);
    setStep('details');
  }

  // ------------------------------------------------------------ analyse
  const catalog = (foods ?? []) as { id: string; name: string; aliases?: string[] | null }[];
  const foodMatch = subject?.name ? catalog.find((f) => catalogMatches(subject.name!, [f])) ?? null : null;
  const foodDraftInput = subject && kind === 'food'
    ? buildFoodInput(subject, { ingredientsText: ingredients, ingredientsOrigin: origin, ocrReadability: ocr?.readability }, {
      recalls: lookup.recalls, recallCheck: recallCheckOf(lookup.recall_check), catalogMatch: !!foodMatch, demoMode: isDemo,
    })
    : null;
  const questions = foodDraftInput && profile ? foodQuestions(foodDraftInput, profile).filter((q) => q.key !== 'allergies') : [];
  const needsAge = !!generic?.needsAge && profile?.ageMonths == null;

  async function analyse() {
    if (!subject || !profile) { toast('Choisissez pour qui est ce produit.', 'error'); return; }
    setBusy('Analyse selon les règles…');
    try {
      const recallCheck = recallCheckOf(lookup.recall_check);
      let analysis;
      let typeLabel: string | null = null;
      if (kind === 'product') {
        const cosing = await lookupCosing(ingredientNamesForCosing(ingredients));
        const input = buildProductInput(subject, {
          type: ptype, ingredientsText: ingredients, ingredientsOrigin: origin, ocrReadability: ocr?.readability, precautionsText: precautions,
          periodAfterOpening: pao, exposure, zone,
        }, { recalls: lookup.recalls, recallCheck, cosing, demoMode: isDemo });
        analysis = analyzeProduct(input, profile);
        typeLabel = ptype ? PRODUCT_TYPE_LABEL[ptype] : null;
      } else {
        const opened = Number(openedText);
        const a: FoodAnswers = { ...answers, allergies: parseAllergies(allergiesText), openedDaysAgo: openedText.trim() && Number.isFinite(opened) ? Math.max(0, Math.round(opened)) : null };
        analysis = analyzeFood(foodDraftInput!, profile, a);
        typeLabel = 'Aliment';
      }
      const stored = { ...analysis, declaredAllergens: subject.candidate?.allergens ?? [] };
      const id = await save.mutateAsync({
        kind, method, barcode: subject.barcode, productId: subject.candidate?.id ?? null, foodId: kind === 'food' ? foodMatch?.id ?? null : null,
        snapshot: snapshotOf(subject, typeLabel, isDemo), analysis: stored,
      });
      router.replace(`/scanner/result/${id}`);
    } catch (e) {
      if (e instanceof QuotaReachedError) setQuotaReached(true);
      else toast(friendlyError(e, 'L’analyse n’a pas pu être enregistrée.'), 'error');
    } finally {
      setBusy(null);
    }
  }

  // ------------------------------------------------------------ rendu
  const recallsBlock = lookup.recalls.length ? (
    <>
      <SectionTitle title="Rappels officiels" />
      {lookup.recalls.map((r) => <RecallCard key={r.id} r={{ ...r, lot_numbers: r.lot_numbers ?? [], match: r.match ?? 'gtin' }} />)}
      <Text variant="caption" muted>{RECALL_DISCLAIMER}</Text>
    </>
  ) : null;

  const demoNote = isDemo ? (
    <Banner tone="demo" title="Données de démonstration">
      {`Sans serveur connecté, seule une base FICTIVE est consultée : aucun résultat n’est une analyse réelle. Essayez ${DEMO_CODES[kind].slice(0, 2).join(' ou ')}.`}
    </Banner>
  ) : null;

  if (step === 'input') {
    return (
      <>
        {demoNote}
        <Card>
          <Text variant="label">Code-barres</Text>
          {cameraAvailable ? (
            cameraOn ? (
              <View style={[styles.camera, { borderColor: t.colors.border, marginTop: spacing.xs }]}>
                <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={onScanned} />
                <View pointerEvents="none" style={styles.frame} />
                <View style={styles.cameraFooter}>
                  <Button label="Fermer la caméra" size="sm" variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} onPress={() => setCameraOn(false)} />
                </View>
              </View>
            ) : (
              <>
                <Text variant="caption" muted style={{ marginTop: 2 }}>La caméra sert uniquement à lire le code-barres ; aucune image n’est envoyée.</Text>
                <Button label="Scanner le code-barres" icon="camera" size="lg" style={{ marginTop: spacing.sm }} onPress={openCamera} />
              </>
            )
          ) : (
            <Text variant="small" muted style={{ marginTop: 2 }}>Le scan par caméra est disponible sur téléphone. Ici, saisissez les chiffres du code-barres ci-dessous.</Text>
          )}
          {cameraDenied ? (
            <Banner tone="warning" title="Accès à la caméra refusé"
              action={cameraDenied === 'settings' ? <Button label="Ouvrir les réglages" size="sm" variant="secondary" style={{ marginTop: 6, alignSelf: 'flex-start' }} onPress={() => Linking.openSettings().catch(() => undefined)} /> : undefined}>
              {cameraDenied === 'settings'
                ? 'Autorisez la caméra pour Toi & Moi dans les réglages du téléphone, ou saisissez le code-barres à la main.'
                : 'Sans la caméra, vous pouvez saisir le code-barres ou le nom du produit.'}
            </Banner>
          ) : null}
        </Card>

        <Card>
          <Text variant="label">Photo</Text>
          {localText || localBarcode ? (
            <>
              <Text variant="caption" muted style={{ marginTop: 2 }}>La photo est lue sur votre téléphone (Google ML Kit) : elle n’est pas envoyée.</Text>
              <Row wrap style={{ marginTop: spacing.sm }}>
                <Button label={kind === 'food' ? 'Photographier l’emballage' : 'Prendre une photo'} icon="camera" size="sm" variant="secondary" onPress={() => fromPhoto('camera', 'product')} />
                <Button label="Photographier les ingrédients" icon="file-text" size="sm" variant="secondary" onPress={() => fromPhoto('camera', 'ingredients')} />
                <Button label="Importer une photo" icon="image" size="sm" variant="ghost" onPress={() => fromPhoto('library', 'product')} />
              </Row>
            </>
          ) : (
            <Banner tone="info">{`${LOCAL_RECOGNITION_UNAVAILABLE}. La lecture des photos nécessite l’application installée sur téléphone (build de développement), pas le web ni Expo Go.`}</Banner>
          )}
        </Card>

        <Card>
          <Field label={kind === 'food' ? 'Nom de l’aliment ou code-barres' : 'Nom du produit ou code-barres (EAN)'} value={query} onChangeText={setQuery}
            hint={kind === 'food' ? 'Ex. « brie », « saumon fumé », « compote pomme »' : 'Ex. « lingettes bébé » ou les 13 chiffres sous les barres'}
            returnKeyType="search" onSubmitEditing={() => runSearch(query, 'search')} />
          <Button label="Rechercher" icon="search" variant="secondary" loading={!!busy} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => runSearch(query, 'search')} />
          {isDemo ? (
            <Row wrap style={{ marginTop: spacing.sm }}>
              {DEMO_CODES[kind].map((c) => <Chip key={c} label={c} onPress={() => { setQuery(c); identifyBarcode(c, 'manual'); }} />)}
            </Row>
          ) : null}
        </Card>
        {ocr && method === 'ingredients_photo' ? <Banner tone="success">{'Liste des ingrédients lue : vous pourrez la relire après avoir identifié le produit.'}</Banner> : null}
        {notice ? <Banner tone="info">{notice}</Banner> : null}
        {busy ? <Text variant="small" muted>{busy}</Text> : null}
      </>
    );
  }

  if (step === 'confirm') {
    const nothing = !candidates.length && !ciqual.length;
    return (
      <>
        {demoNote}
        {notice ? <Banner tone="warning">{notice}</Banner> : null}
        {recallsBlock}
        <SectionTitle title="Est-ce bien ce produit ?" />
        {lookup.message && (nothing || lookup.database === 'demo') ? <Banner tone="info">{lookup.message}</Banner> : null}
        {candidates.map((c, i) => (
          <Card key={`${c.barcode}${i}`}>
            <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
              {c.image_url ? <Image source={{ uri: c.image_url }} style={{ width: 64, height: 64, borderRadius: radius.md }} resizeMode="contain" accessibilityLabel="Photo du produit" /> : null}
              <View style={{ flex: 1, gap: 2 }}>
                {c.is_demo || isDemo ? <DemoTag /> : null}
                <Text weight="bold">{c.name ?? 'Nom non renseigné'}</Text>
                <Text variant="small" muted>{[c.brand, c.barcode ? `EAN ${c.barcode}` : null].filter(Boolean).join(' · ')}</Text>
                <Text variant="caption" muted>{`Source : ${c.data_source}${c.data_retrieved_at ? `, consultée le ${c.data_retrieved_at.split('-').reverse().join('/')}` : ''}`}</Text>
              </View>
            </Row>
            <Row wrap style={{ marginTop: spacing.sm }}>
              <Button label="Oui, c’est ce produit" size="sm" onPress={() => confirmSubject({ candidate: c, name: c.name, brand: c.brand, barcode: c.barcode || scannedBarcode, imageUrl: c.image_url })} />
            </Row>
          </Card>
        ))}
        {ciqual.map((f) => (
          <Card key={f.code}>
            {f.is_demo || isDemo ? <DemoTag /> : null}
            <Text weight="bold">{f.nom}</Text>
            <Text variant="caption" muted>{`Aliment générique — table Ciqual (${f.source_version})`}</Text>
            <Button label="Oui, c’est cet aliment" size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
              onPress={() => confirmSubject({ candidate: null, ciqual: f, name: f.nom, brand: null, barcode: null, imageUrl: null })} />
          </Card>
        ))}
        <Card tone="soft">
          <Text weight="medium">{nothing ? 'Produit non trouvé dans les bases consultées.' : 'Aucun ne correspond ?'}</Text>
          <Text variant="small" muted style={{ marginTop: 2 }}>Indiquez le produit vous-même : l’analyse le signalera comme saisi à la main.</Text>
          <Field label={kind === 'food' ? 'Nom de l’aliment' : 'Nom du produit'} value={manualName} onChangeText={setManualName} />
          {kind === 'product' || scannedBarcode ? <Field label="Marque" optional value={manualBrand} onChangeText={setManualBrand} /> : null}
          <Row wrap style={{ marginTop: spacing.sm }}>
            <Button label="Continuer avec ce nom" size="sm" variant="secondary" disabled={manualName.trim().length < 2}
              onPress={() => confirmSubject({ candidate: null, name: manualName.trim(), brand: manualBrand.trim() || null, barcode: scannedBarcode, imageUrl: null })} />
            <Button label="Recommencer" size="sm" variant="ghost" onPress={reset} />
          </Row>
        </Card>
        {busy ? <Text variant="small" muted>{busy}</Text> : null}
      </>
    );
  }

  // ------------------------------------------------------------ détails
  return (
    <>
      {demoNote}
      <Card>
        <Row style={{ alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" muted>Produit confirmé</Text>
            <Text weight="bold">{subject?.name ?? '—'}</Text>
            <Text variant="small" muted>{[subject?.brand, subject?.barcode ? `EAN ${subject.barcode}` : null].filter(Boolean).join(' · ') || (subject?.candidate ? '' : 'Saisi à la main')}</Text>
          </View>
          <Button label="Changer" size="sm" variant="ghost" onPress={reset} />
        </Row>
      </Card>
      {recallsBlock}
      {!lookup.recalls.length && lookup.recall_check ? (
        <Text variant="caption" muted>
          {lookup.recall_check.checked ? `Aucun rappel officiel trouvé (RappelConso). ${RECALL_DISCLAIMER}` : lookup.recall_check.error ?? ''}
        </Text>
      ) : null}

      <SectionTitle title="Pour qui ?" />
      <Card>
        <Row wrap>
          {options.map((o) => <Chip key={o.key} label={o.label} selected={selectedKey === o.key} onPress={() => setProfileKey(o.key)} />)}
          {GENERIC_PROFILES.map((g) => <Chip key={g.key} label={g.label} selected={selectedKey === g.key} onPress={() => setProfileKey(g.key)} />)}
        </Row>
        {generic?.needsAge ? (
          <Field label={generic.kind === 'child' ? 'Âge (en années)' : 'Âge (en mois)'} keyboardType="number-pad" value={ageText} onChangeText={setAgeText}
            error={needsAge && ageText.trim() ? 'Âge invalide' : null} hint="L’âge exact est nécessaire pour appliquer les règles liées à l’âge." />
        ) : null}
        {profile ? <Text variant="caption" muted style={{ marginTop: 6 }}>{`Analyse pour : ${profileLabel(profile)}. Ces informations restent dans votre compte.`}</Text> : null}
      </Card>

      {kind === 'product' ? (
        <>
          <SectionTitle title="Type et usage" />
          <Card>
            <Text variant="label">Type de produit</Text>
            <Row wrap style={{ marginTop: 4 }}>
              {PRODUCT_TYPES.filter((x) => x !== 'other').map((x) => <Chip key={x} label={PRODUCT_TYPE_LABEL[x]} selected={ptype === x} onPress={() => setPtype(ptype === x ? null : x)} />)}
            </Row>
            <Text variant="label" style={{ marginTop: spacing.sm }}>Utilisation</Text>
            <Row wrap style={{ marginTop: 4 }}>
              {EXPOSURES.map((x) => <Chip key={x} label={EXPOSURE_LABEL[x]} selected={exposure === x} onPress={() => setExposure(exposure === x ? null : x)} />)}
            </Row>
            <Text variant="label" style={{ marginTop: spacing.sm }}>Zone d’application</Text>
            <Row wrap style={{ marginTop: 4 }}>
              {ZONES.map((x) => <Chip key={x} label={ZONE_LABEL[x]} selected={zone === x} onPress={() => setZone(zone === x ? null : x)} />)}
            </Row>
            <Text variant="caption" muted style={{ marginTop: 6 }}>Sans précision, l’application déduit l’usage du type de produit, et le signale.</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title="Ingrédients" />
      <Card>
        <Field label={kind === 'food' ? 'Liste des ingrédients (si emballé)' : 'Liste des ingrédients (INCI)'} optional multiline value={ingredients}
          onChangeText={(v) => { setIngredients(v); if (origin === 'database' || origin === null) setOrigin(v.trim() ? 'manual' : null); }}
          hint={origin === 'database' ? 'Texte de la base produit : comparez-le avec l’emballage.' : origin === 'ocr_reviewed' ? 'Texte lu sur la photo : relisez-le et corrigez-le si besoin.' : 'Vous pouvez coller ou recopier la liste de l’emballage.'} />
        {origin === 'ocr_reviewed' && ocr ? (
          <Text variant="caption" muted>{`Lisibilité estimée de la photo : ${Math.round(ocr.readability * 100)} % (indice, pas une garantie d’exactitude).`}</Text>
        ) : null}
        {localText ? (
          <Button label="Photographier la liste des ingrédients" icon="camera" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => fromPhoto('camera', 'ingredients')} />
        ) : <Text variant="caption" muted>{LOCAL_RECOGNITION_UNAVAILABLE}.</Text>}
        {kind === 'product' ? (
          <>
            <Field label="Précautions d’emploi de l’emballage" optional multiline value={precautions} onChangeText={setPrecautions} />
            <Field label="Durée après ouverture (ex. 12M)" optional value={pao} onChangeText={setPao} />
          </>
        ) : null}
        <Field label="Allergies connues (déclarées par un professionnel)" optional value={allergiesText} onChangeText={setAllergiesText}
          hint="Séparées par des virgules. L’application ne diagnostique aucune allergie." />
      </Card>

      {kind === 'food' && questions.length ? (
        <>
          <SectionTitle title="Questions complémentaires" />
          <Card>
            <Text variant="caption" muted>Une photo ne permet pas de connaître la cuisson, la conservation ou la préparation : vos réponses complètent l’analyse.</Text>
            {questions.map((q, i) => (
              <View key={q.key} style={{ marginTop: spacing.sm }}>
                {i > 0 ? <Divider /> : null}
                <Text weight="medium">{q.label}{q.critical ? ' *' : ''}</Text>
                <Text variant="caption" muted>{q.why}</Text>
                {q.options ? (
                  <Row wrap style={{ marginTop: 4 }}>
                    {q.options.map((o) => (
                      <Chip key={o.value} label={o.label} selected={(answers as Record<string, unknown>)[q.key] === o.value}
                        onPress={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))} />
                    ))}
                  </Row>
                ) : q.key === 'openedDaysAgo' ? (
                  <Field label="Nombre de jours" optional keyboardType="number-pad" value={openedText} onChangeText={setOpenedText} />
                ) : null}
              </View>
            ))}
            <Text variant="caption" muted style={{ marginTop: spacing.sm }}>* Sans réponse, le résultat sera « Impossible à confirmer ».</Text>
          </Card>
        </>
      ) : null}

      {quotaReached ? (
        <Banner tone="info" title="Analyses gratuites du mois utilisées"
          action={<Button label="Découvrir l’abonnement" size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />}>
          {'Les rappels officiels restent toujours affichés gratuitement (voir ci-dessus). En cas de doute, lisez l’emballage ou demandez conseil à votre pharmacien.'}
        </Banner>
      ) : quota ? (
        <Text variant="caption" muted>{`Analyses restantes ce mois-ci : ${quota.remaining} sur ${quota.quota}. Les rappels officiels sont toujours gratuits.`}</Text>
      ) : null}
      <Button label="Analyser" icon="check" size="lg" loading={!!busy} disabled={!profile || needsAge || quotaReached} onPress={analyse} />
      {needsAge ? <Text variant="caption" muted>Indiquez l’âge de l’enfant pour lancer l’analyse.</Text> : null}
      {busy ? <Text variant="small" muted>{busy}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  camera: { height: 300, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, backgroundColor: '#000' },
  frame: { position: 'absolute', left: '12%', right: '12%', top: '32%', bottom: '32%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: radius.md },
  cameraFooter: { position: 'absolute', bottom: spacing.sm, left: 0, right: 0, alignItems: 'center' },
});
