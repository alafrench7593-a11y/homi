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
import { Banner, Button, Card, Chip, Divider, Field, haptic, Row, SectionTitle, Text } from '@/components/ui';
import { ScanFrame } from '@/features/motionViz';
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
  LocalRecognitionUnavailable, localBarcodeRecognitionAvailable, localTextRecognitionAvailable, readBarcodesFromImage,
  readTextFromImage, type TextReading,
} from '@/lib/scanner/localRecognition';
import type { CiqualFood, DatabaseStatus, LookupResponse, ProductCandidate, RecallRow, ScanKind, ScanMethod } from '@/lib/types-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { DemoTag, RecallCard } from './components';
import { RECALL_DISCLAIMER } from '@/lib/domain/scanCommon';
import { t as tr } from '@/i18n';

const OPENED_KEY = 'openedDaysAgo';
const cameraAvailable = Platform.OS === 'ios' || Platform.OS === 'android';
const DEMO_CODES: Record<ScanKind, string[]> = {
  product: ['0000000000062', '0000000000079', '0000000000086', '0000000000017'],
  food: ['0000000000093', '0000000000024', '0000000000031', '0000000000055'],
};
const EXPOSURES: Exposure[] = ['rinse_off', 'leave_on', 'inhaled', 'indirect'];
const ZONES: Zone[] = ['face', 'body', 'diaper_area', 'scalp', 'lips', 'hands', 'air', 'textiles', 'surfaces'];

type Step = 'input' | 'confirm' | 'details';
interface LookupState { recalls: RecallRow[]; recall_check: LookupResponse['recall_check'] | null; database?: DatabaseStatus; message?: string; stale?: boolean; outage?: boolean }

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
  const [reading, setReading] = useState(false);
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
    setBusy(tr('u6.sf.searching_product'));
    try {
      const r = await lookupBarcode.mutateAsync({ barcode: check.code, kind });
      setScannedBarcode(check.code);
      setLookup({ recalls: r.recalls ?? [], recall_check: r.recall_check ?? null, database: r.database, message: r.message, stale: r.stale === true, outage: r.lookup_status === 'unavailable' || r.lookup_status === 'saturated' });
      setCandidates(r.found && r.product ? [r.product] : []);
      setCiqual([]);
      setManualName('');
      setNotice(check.warning ?? null);
      setMethod(m);
      setStep('confirm');
    } catch (e) {
      toast(friendlyError(e, tr('u6.sf.search_failed')), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function runSearch(text: string, m: ScanMethod) {
    const q = text.trim();
    const digits = q.replace(/[\s-]/g, '');
    if (/^\d{8,14}$/.test(digits)) return identifyBarcode(digits, m === 'search' ? 'manual' : m);
    if (q.length < 2) { setNotice(tr('u6.sf.min_chars')); return; }
    setBusy(tr('u6.sf.searching'));
    try {
      const [r, cq] = await Promise.all([search.mutateAsync({ query: q, kind }), kind === 'food' ? searchCiqual(q) : Promise.resolve([] as CiqualFood[])]);
      setCandidates(r.candidates ?? []);
      setCiqual(cq);
      setLookup({ recalls: [], recall_check: null, database: r.database, message: r.message ?? undefined, outage: r.lookup_status === 'unavailable' || r.lookup_status === 'saturated' });
      setScannedBarcode(null);
      setManualName(q);
      setNotice(null);
      setMethod(m);
      setStep('confirm');
    } catch (e) {
      toast(friendlyError(e, tr('u6.sf.search_failed')), 'error');
    } finally {
      setBusy(null);
    }
  }

  function onScanned(e: BarcodeScanningResult) {
    if (lock.current) return;
    lock.current = true;
    // Retour immédiat : le cadre se resserre, puis la caméra se ferme et la recherche démarre
    setReading(true);
    haptic('success');
    setTimeout(() => setCameraOn(false), 350);
    identifyBarcode(e.data, 'barcode').finally(() => { lock.current = false; setReading(false); });
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
      setNotice(tr('u6.sf.camera_failed'));
    }
  }

  function applyReading(reading: TextReading) {
    setOcr(reading);
    const text = reading.ingredients ?? reading.text.trim().slice(0, 2000);
    if (text) { setIngredients(text); setOrigin('ocr_reviewed'); }
    if (reading.precautions) setPrecautions(reading.precautions);
  }

  async function fromPhoto(source: 'camera' | 'library', purpose: 'product' | 'ingredients') {
    if (!localText && !localBarcode) { setNotice(tr('l7.recog.unavailable')); return; }
    let res: ImagePicker.ImagePickerResult;
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        if (source === 'camera') setCameraDenied(perm.canAskAgain ? 'ask' : 'settings');
        else toast(tr('u6.sf.photos_access'), 'error');
        return;
      }
      res = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: false });
    } catch {
      toast(source === 'camera' ? tr('u6.sf.camera_open_failed') : tr('u6.sf.gallery_open_failed'), 'error');
      return;
    }
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    setBusy(tr('u6.sf.reading_photo'));
    try {
      if (purpose === 'product') {
        const codes = localBarcode ? await readBarcodesFromImage(uri) : [];
        if (codes[0]) { setBusy(null); await identifyBarcode(codes[0], source === 'camera' ? 'photo_barcode' : 'import'); return; }
        const reading = await readTextFromImage(uri);
        if (reading.ingredients) applyReading(reading);
        if (reading.printedBarcode) { setBusy(null); await identifyBarcode(reading.printedBarcode, source === 'camera' ? 'photo' : 'import'); return; }
        const q = frontTextToQuery(reading.text);
        if (q.length >= 2) { setQuery(q); setBusy(null); await runSearch(q, source === 'camera' ? 'photo' : 'import'); return; }
        setNotice(tr('u6.sf.nothing_readable'));
      } else {
        const reading = await readTextFromImage(uri);
        applyReading(reading);
        if (step === 'input') {
          setMethod('ingredients_photo');
          if (reading.printedBarcode) { setBusy(null); await identifyBarcode(reading.printedBarcode, 'ingredients_photo'); return; }
          setNotice(tr('u6.sf.ingredients_read'));
        }
      }
    } catch (e) {
      setNotice(e instanceof LocalRecognitionUnavailable ? e.message : tr('u6.sf.photo_unreadable'));
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
      setLookup((l) => ({ ...l, recall_check: { checked: false, source: 'RappelConso', error: tr('u6.sf.recall_check_failed') } }));
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
    if (!subject || !profile) { toast(tr('u6.sf.choose_who'), 'error'); return; }
    setBusy(tr('u6.sf.analysing'));
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
      else toast(friendlyError(e, tr('u6.sf.save_failed')), 'error');
    } finally {
      setBusy(null);
    }
  }

  // ------------------------------------------------------------ rendu
  const recallsBlock = lookup.recalls.length ? (
    <>
      <SectionTitle title={tr('u6.sc.recalls_title')} />
      {lookup.recalls.map((r) => <RecallCard key={r.id} r={{ ...r, lot_numbers: r.lot_numbers ?? [], match: r.match ?? 'gtin' }} />)}
      <Text variant="caption" muted>{RECALL_DISCLAIMER}</Text>
    </>
  ) : null;

  const demoNote = isDemo ? (
    <Banner tone="demo" title={tr('u6.sc.demo_data')}>
      {tr('u6.sf.demo_note', { codes: DEMO_CODES[kind].slice(0, 2).join(tr('u6.sf.or')) })}
    </Banner>
  ) : null;

  if (step === 'input') {
    return (
      <>
        {demoNote}
        <Card>
          <Text variant="label">{tr('u6.sf.barcode')}</Text>
          {cameraAvailable ? (
            cameraOn ? (
              <View style={[styles.camera, { borderColor: t.colors.border, marginTop: spacing.xs }]}>
                <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={onScanned} />
                <ScanFrame reading={reading} />
                <View style={styles.cameraFooter}>
                  <Button label={tr('u6.sf.close_camera')} size="sm" variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} onPress={() => setCameraOn(false)} />
                </View>
              </View>
            ) : (
              <>
                <Text variant="caption" muted style={{ marginTop: 2 }}>{tr('u6.sf.camera_note')}</Text>
                <Button label={tr('u6.sf.scan_barcode')} icon="camera" size="lg" style={{ marginTop: spacing.sm }} onPress={openCamera} />
              </>
            )
          ) : (
            <Text variant="small" muted style={{ marginTop: 2 }}>{tr('u6.sf.no_camera_here')}</Text>
          )}
          {cameraDenied ? (
            <Banner tone="warning" title={tr('u6.sf.camera_denied')}
              action={cameraDenied === 'settings' ? <Button label={tr('u6.sf.open_settings')} size="sm" variant="secondary" style={{ marginTop: 6, alignSelf: 'flex-start' }} onPress={() => Linking.openSettings().catch(() => undefined)} /> : undefined}>
              {cameraDenied === 'settings'
                ? tr('u6.sf.camera_denied_settings')
                : tr('u6.sf.camera_denied_ask')}
            </Banner>
          ) : null}
        </Card>

        <Card>
          <Text variant="label">{tr('u6.sf.photo')}</Text>
          {localText || localBarcode ? (
            <>
              <Text variant="caption" muted style={{ marginTop: 2 }}>{tr('u6.sf.photo_local')}</Text>
              <Row wrap style={{ marginTop: spacing.sm }}>
                <Button label={kind === 'food' ? tr('u6.sf.photo_packaging') : tr('u6.sf.take_photo')} icon="camera" size="sm" variant="secondary" onPress={() => fromPhoto('camera', 'product')} />
                <Button label={tr('u6.sf.photo_ingredients')} icon="file-text" size="sm" variant="secondary" onPress={() => fromPhoto('camera', 'ingredients')} />
                <Button label={tr('u6.sf.import_photo')} icon="image" size="sm" variant="ghost" onPress={() => fromPhoto('library', 'product')} />
              </Row>
            </>
          ) : (
            <Banner tone="info">{tr('u6.sf.photo_needs_app', { reason: tr('l7.recog.unavailable') })}</Banner>
          )}
        </Card>

        <Card>
          <Field label={kind === 'food' ? tr('u6.sf.food_name_or_code') : tr('u6.sf.product_name_or_code')} value={query} onChangeText={setQuery}
            hint={kind === 'food' ? tr('u6.sf.hint_food') : tr('u6.sf.hint_product')}
            returnKeyType="search" onSubmitEditing={() => runSearch(query, 'search')} />
          <Button label={tr('u6.sf.search')} icon="search" variant="secondary" loading={!!busy} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={() => runSearch(query, 'search')} />
          {isDemo ? (
            <Row wrap style={{ marginTop: spacing.sm }}>
              {DEMO_CODES[kind].map((c) => <Chip key={c} label={c} onPress={() => { setQuery(c); identifyBarcode(c, 'manual'); }} />)}
            </Row>
          ) : null}
        </Card>
        {ocr && method === 'ingredients_photo' ? <Banner tone="success">{tr('u6.sf.ingredients_read_banner')}</Banner> : null}
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
        <SectionTitle title={tr('u6.sf.is_it')} />
        {lookup.message && (nothing || lookup.database === 'demo' || lookup.outage) ? <Banner tone={lookup.outage ? 'warning' : 'info'}>{lookup.message}</Banner> : null}
        {lookup.stale && candidates[0] ? <Banner tone="warning">{tr('u6.sf.stale', { date: candidates[0].data_retrieved_at.split('-').reverse().join('/') })}</Banner> : null}
        {candidates.map((c, i) => (
          <Card key={`${c.barcode}${i}`}>
            <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
              {c.image_url ? <Image source={{ uri: c.image_url }} style={{ width: 64, height: 64, borderRadius: radius.md }} resizeMode="contain" accessibilityLabel={tr('u6.sc.photo')} /> : null}
              <View style={{ flex: 1, gap: 2 }}>
                {c.is_demo || isDemo ? <DemoTag /> : null}
                <Text weight="bold">{c.name ?? tr('u6.sf.name_missing')}</Text>
                <Text variant="small" muted>{[c.brand, c.barcode ? `EAN ${c.barcode}` : null].filter(Boolean).join(' · ')}</Text>
                <Text variant="caption" muted>{`${tr('u6.sc.source', { text: c.data_source })}${c.data_retrieved_at ? `, ${tr('u6.sf.consulted', { date: c.data_retrieved_at.split('-').reverse().join('/') })}` : ''}`}</Text>
              </View>
            </Row>
            <Row wrap style={{ marginTop: spacing.sm }}>
              <Button label={tr('u6.sf.yes_product')} size="sm" onPress={() => confirmSubject({ candidate: c, name: c.name, brand: c.brand, barcode: c.barcode || scannedBarcode, imageUrl: c.image_url })} />
            </Row>
          </Card>
        ))}
        {ciqual.map((f) => (
          <Card key={f.code}>
            {f.is_demo || isDemo ? <DemoTag /> : null}
            <Text weight="bold">{f.nom}</Text>
            <Text variant="caption" muted>{tr('u6.sf.generic_food', { version: f.source_version })}</Text>
            <Button label={tr('u6.sf.yes_food')} size="sm" style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
              onPress={() => confirmSubject({ candidate: null, ciqual: f, name: f.nom, brand: null, barcode: null, imageUrl: null })} />
          </Card>
        ))}
        <Card tone="soft">
          <Text weight="medium">{nothing ? tr('u6.sf.not_found') : tr('u6.sf.none_match')}</Text>
          <Text variant="small" muted style={{ marginTop: 2 }}>{tr('u6.sf.enter_yourself')}</Text>
          <Field label={kind === 'food' ? tr('u6.sf.food_name') : tr('u6.sf.product_name')} value={manualName} onChangeText={setManualName} />
          {kind === 'product' || scannedBarcode ? <Field label={tr('u6.sf.brand')} optional value={manualBrand} onChangeText={setManualBrand} /> : null}
          <Row wrap style={{ marginTop: spacing.sm }}>
            <Button label={tr('u6.sf.continue_name')} size="sm" variant="secondary" disabled={manualName.trim().length < 2}
              onPress={() => confirmSubject({ candidate: null, name: manualName.trim(), brand: manualBrand.trim() || null, barcode: scannedBarcode, imageUrl: null })} />
            <Button label={tr('u6.sf.restart')} size="sm" variant="ghost" onPress={reset} />
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
            <Text variant="caption" muted>{tr('u6.sf.confirmed')}</Text>
            <Text weight="bold">{subject?.name ?? '—'}</Text>
            <Text variant="small" muted>{[subject?.brand, subject?.barcode ? `EAN ${subject.barcode}` : null].filter(Boolean).join(' · ') || (subject?.candidate ? '' : tr('u6.sf.manual'))}</Text>
          </View>
          <Button label={tr('u6.sf.change')} size="sm" variant="ghost" onPress={reset} />
        </Row>
      </Card>
      {recallsBlock}
      {!lookup.recalls.length && lookup.recall_check ? (
        <Text variant="caption" muted>
          {lookup.recall_check.checked ? tr('u6.sf.no_recall', { disclaimer: RECALL_DISCLAIMER }) : lookup.recall_check.error ?? ''}
        </Text>
      ) : null}

      <SectionTitle title={tr('u6.sf.for_whom')} />
      <Card>
        <Row wrap>
          {options.map((o) => <Chip key={o.key} label={o.label} selected={selectedKey === o.key} onPress={() => setProfileKey(o.key)} />)}
          {GENERIC_PROFILES.map((g) => <Chip key={g.key} label={g.label} selected={selectedKey === g.key} onPress={() => setProfileKey(g.key)} />)}
        </Row>
        {generic?.needsAge ? (
          <Field label={generic.kind === 'child' ? tr('u6.sf.age_years') : tr('u6.sf.age_months')} keyboardType="number-pad" value={ageText} onChangeText={setAgeText}
            error={needsAge && ageText.trim() ? tr('u6.sf.age_invalid') : null} hint={tr('u6.sf.age_hint')} />
        ) : null}
        {profile ? <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u6.sf.analysis_for', { profile: profileLabel(profile) })}</Text> : null}
      </Card>

      {kind === 'product' ? (
        <>
          <SectionTitle title={tr('u6.sf.type_use')} />
          <Card>
            <Text variant="label">{tr('u6.sf.product_type')}</Text>
            <Row wrap style={{ marginTop: 4 }}>
              {PRODUCT_TYPES.filter((x) => x !== 'other').map((x) => <Chip key={x} label={PRODUCT_TYPE_LABEL[x]} selected={ptype === x} onPress={() => setPtype(ptype === x ? null : x)} />)}
            </Row>
            <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u6.sf.use')}</Text>
            <Row wrap style={{ marginTop: 4 }}>
              {EXPOSURES.map((x) => <Chip key={x} label={EXPOSURE_LABEL[x]} selected={exposure === x} onPress={() => setExposure(exposure === x ? null : x)} />)}
            </Row>
            <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u6.sf.zone')}</Text>
            <Row wrap style={{ marginTop: 4 }}>
              {ZONES.map((x) => <Chip key={x} label={ZONE_LABEL[x]} selected={zone === x} onPress={() => setZone(zone === x ? null : x)} />)}
            </Row>
            <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u6.sf.no_precision')}</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title={tr('u6.sc.ingredients')} />
      <Card>
        <Field label={kind === 'food' ? tr('u6.sf.list_food') : tr('u6.sf.list_inci')} optional multiline value={ingredients}
          onChangeText={(v) => { setIngredients(v); if (origin === 'database' || origin === null) setOrigin(v.trim() ? 'manual' : null); }}
          hint={origin === 'database' ? tr('u6.sf.hint_db') : origin === 'ocr_reviewed' ? tr('u6.sf.hint_ocr') : tr('u6.sf.hint_manual')} />
        {origin === 'ocr_reviewed' && ocr ? (
          <Text variant="caption" muted>{tr('u6.sf.readability', { pct: Math.round(ocr.readability * 100) })}</Text>
        ) : null}
        {localText ? (
          <Button label={tr('u6.sf.photo_list')} icon="camera" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => fromPhoto('camera', 'ingredients')} />
        ) : <Text variant="caption" muted>{tr('l7.recog.unavailable')}.</Text>}
        {kind === 'product' ? (
          <>
            <Field label={tr('u6.sf.precautions')} optional multiline value={precautions} onChangeText={setPrecautions} />
            <Field label={tr('u6.sf.pao')} optional value={pao} onChangeText={setPao} />
          </>
        ) : null}
        <Field label={tr('u6.sf.allergies')} optional value={allergiesText} onChangeText={setAllergiesText}
          hint={tr('u6.sf.allergies_hint')} />
      </Card>

      {kind === 'food' && questions.length ? (
        <>
          <SectionTitle title={tr('u6.sf.questions')} />
          <Card>
            <Text variant="caption" muted>{tr('u6.sf.questions_note')}</Text>
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
                ) : q.key === OPENED_KEY ? (
                  <Field label={tr('u6.sf.days')} optional keyboardType="number-pad" value={openedText} onChangeText={setOpenedText} />
                ) : null}
              </View>
            ))}
            <Text variant="caption" muted style={{ marginTop: spacing.sm }}>{tr('u6.sf.unanswered')}</Text>
          </Card>
        </>
      ) : null}

      {quotaReached ? (
        <Banner tone="info" title={tr('u6.sf.quota_used')}
          action={<Button label={tr('u6.sf.discover')} size="sm" variant="secondary" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => router.push('/settings/subscription')} />}>
          {tr('u6.sf.quota_body')}
        </Banner>
      ) : quota ? (
        <Text variant="caption" muted>{tr('u6.sf.quota_left', { remaining: quota.remaining, quota: quota.quota })}</Text>
      ) : null}
      <Button label={tr('u6.sf.analyse')} icon="check" size="lg" loading={!!busy} disabled={!profile || needsAge || quotaReached} onPress={analyse} />
      {needsAge ? <Text variant="caption" muted>{tr('u6.sf.need_age')}</Text> : null}
      {busy ? <Text variant="small" muted>{busy}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  camera: { height: 300, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, backgroundColor: '#000' },
  frame: { position: 'absolute', left: '12%', right: '12%', top: '32%', bottom: '32%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: radius.md },
  cameraFooter: { position: 'absolute', bottom: spacing.sm, left: 0, right: 0, alignItems: 'center' },
});
