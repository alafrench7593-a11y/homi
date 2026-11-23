/**
 * Logique de l'assistant du scanner (produit ou aliment), sans rendu :
 *   1. identify : code-barres (caméra), photo, import, recherche par nom ou EAN ; reconnaissance des photos SUR LE
 *      TÉLÉPHONE (Google ML Kit) ;
 *   2. confirm  : « Est-ce bien ce produit ? » (rappels officiels dès qu'ils sont connus ; produit inconnu explicite) ;
 *   3. profile  : pour qui (membre du foyer ou profil générique, âge, allergies connues) ;
 *   4. details  : type et usage (produit) ou questions (aliment), relecture des ingrédients ; analyse par les règles,
 *      enregistrement, puis fiche résultat.
 * Un SEUL brouillon pour toutes les étapes : revenir en arrière (bouton, flèche de l'en-tête, retour Android,
 * progression) conserve la saisie. Les précisions propres à un produit sont effacées seulement si un AUTRE produit
 * est confirmé (`subjectKey`).
 */
import { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { haptic } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  GENERIC_PROFILES, QuotaReachedError, lookupCosing, searchCiqual, useCheckRecalls, useFoodsCatalog, useLookupBarcode, useSaveAnalysis,
  useScanProfileOptions, useScanQuota, useSearchProducts,
} from '@/lib/data/hooks-scanner';
import { checkBarcode } from '@/lib/domain/products';
import type { ScanProfile } from '@/lib/domain/scanCommon';
import {
  asProductType, buildFoodInput, buildProductInput, catalogMatches, ingredientNamesForCosing, parseAllergies, recallCheckOf, snapshotOf,
  type ConfirmedSubject, type IngredientsOrigin,
} from '@/lib/domain/scanFlow';
import { analyzeFood, foodQuestions, type FoodAnswers } from '@/lib/domain/scanFood';
import { frontTextToQuery } from '@/lib/domain/scanOcr';
import { analyzeProduct, PRODUCT_TYPE_LABEL, type Exposure, type ProductType, type Zone } from '@/lib/domain/scanProduct';
import {
  LocalRecognitionUnavailable, localBarcodeRecognitionAvailable, localTextRecognitionAvailable, readBarcodesFromImage,
  readTextFromImage, type TextReading,
} from '@/lib/scanner/localRecognition';
import type { CiqualFood, DatabaseStatus, LookupResponse, ProductCandidate, RecallRow, ScanKind, ScanMethod } from '@/lib/types-scanner';
import { t as tr } from '@/i18n';
import { defaultPick, failureKind, previousStep, stepIndex, subjectKey, type FailureKind, type SubjectPick, type WizardStep } from './wizard';

export interface LookupState { recalls: RecallRow[]; recall_check: LookupResponse['recall_check'] | null; database?: DatabaseStatus; message?: string; stale?: boolean; outage?: boolean; byBarcode?: boolean }
export interface Failure { kind: FailureKind; message: string; retry: () => Promise<void> }

export function useScanWizard(kind: ScanKind) {
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

  // ------------------------------------------------------------ navigation entre étapes
  const [step, setStepRaw] = useState<WizardStep>('identify');
  /** Sens de la dernière transition (1 : en avant, −1 : retour) — l'étape glisse dans le sens du geste */
  const dir = useRef<1 | -1>(1);
  const goTo = (s: WizardStep) => { dir.current = stepIndex(s) >= stepIndex(step) ? 1 : -1; setStepRaw(s); };
  const back = () => { dir.current = -1; setStepRaw((s) => previousStep(s)); };
  /** Navigation vers le résultat en cours : la flèche de l'en-tête ne doit plus revenir d'une étape */
  const leaving = useRef(false);

  // ------------------------------------------------------------ brouillon (toutes étapes)
  const [method, setMethod] = useState<ScanMethod>('manual');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [reading, setReading] = useState(false);
  const [cameraDenied, setCameraDenied] = useState<'ask' | 'settings' | null>(null);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<ProductCandidate[]>([]);
  const [ciqual, setCiqual] = useState<CiqualFood[]>([]);
  const [lookup, setLookup] = useState<LookupState>({ recalls: [], recall_check: null });
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [pick, setPick] = useState<SubjectPick>(null);
  const [subject, setSubject] = useState<ConfirmedSubject | null>(null);
  const [manualName, setManualNameRaw] = useState('');
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
  const inFlight = useRef(false);
  /** Clé du dernier produit pour lequel des précisions ont été saisies */
  const detailsFor = useRef<string | null>(null);

  const setManualName = (v: string) => { setManualNameRaw(v); if (v.trim()) setPick({ kind: 'manual' }); };

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
  const needsAge = !!generic?.needsAge && profile?.ageMonths == null;

  // ------------------------------------------------------------ identification
  /** Une recherche à la fois (double appui, puce de démonstration pendant une recherche) */
  async function guarded(label: string, run: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(label);
    try { await run(); } finally { inFlight.current = false; setBusy(null); }
  }

  async function identifyBarcode(raw: string, m: ScanMethod): Promise<void> {
    const check = checkBarcode(raw);
    if (!check.ok) { setNotice(check.error); return; }
    await guarded(tr('u6.sf.searching_product'), async () => {
      try {
        const r = await lookupBarcode.mutateAsync({ barcode: check.code, kind });
        setFailure(null);
        setScannedBarcode(check.code);
        const found = r.found && r.product ? [r.product] : [];
        setLookup({ recalls: r.recalls ?? [], recall_check: r.recall_check ?? null, database: r.database, message: r.message, stale: r.stale === true, outage: r.lookup_status === 'unavailable' || r.lookup_status === 'saturated', byBarcode: true });
        setCandidates(found);
        setCiqual([]);
        setPick(defaultPick({ candidates: found.length, ciqual: 0, byBarcode: true }));
        setManualNameRaw('');
        setNotice(check.warning ?? null);
        setMethod(m);
        haptic('selection');
        goTo('confirm');
      } catch (e) {
        setFailure({ kind: failureKind(e), message: friendlyError(e, tr('u6.sf.search_failed')), retry: () => identifyBarcode(raw, m) });
      }
    });
  }

  async function runSearch(text: string, m: ScanMethod): Promise<void> {
    const q = text.trim();
    const digits = q.replace(/[\s-]/g, '');
    if (/^\d{8,14}$/.test(digits)) return identifyBarcode(digits, m === 'search' ? 'manual' : m);
    if (q.length < 2) { setNotice(tr('u6.sf.min_chars')); return; }
    await guarded(tr('u6.sf.searching'), async () => {
      try {
        const [r, cq] = await Promise.all([search.mutateAsync({ query: q, kind }), kind === 'food' ? searchCiqual(q) : Promise.resolve([] as CiqualFood[])]);
        setFailure(null);
        setCandidates(r.candidates ?? []);
        setCiqual(cq);
        setPick(defaultPick({ candidates: (r.candidates ?? []).length, ciqual: cq.length, byBarcode: false }));
        setLookup({ recalls: [], recall_check: null, database: r.database, message: r.message ?? undefined, outage: r.lookup_status === 'unavailable' || r.lookup_status === 'saturated', byBarcode: false });
        setScannedBarcode(null);
        setManualNameRaw(q);
        setNotice(null);
        setMethod(m);
        haptic('selection');
        goTo('confirm');
      } catch (e) {
        setFailure({ kind: failureKind(e), message: friendlyError(e, tr('u6.sf.search_failed')), retry: () => runSearch(text, m) });
      }
    });
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

  function applyReading(r: TextReading) {
    setOcr(r);
    const text = r.ingredients ?? r.text.trim().slice(0, 2000);
    if (text) { setIngredients(text); setOrigin('ocr_reviewed'); }
    if (r.precautions) setPrecautions(r.precautions);
  }

  async function fromPhoto(source: 'camera' | 'library', purpose: 'product' | 'ingredients') {
    if (!localText && !localBarcode) { setNotice(tr('l7.recog.unavailable')); return; }
    let res: ImagePicker.ImagePickerResult;
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        if (source === 'camera') setCameraDenied(perm.canAskAgain ? 'ask' : 'settings');
        else setNotice(tr('u6.sf.photos_access'));
        return;
      }
      res = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: false });
    } catch {
      setNotice(source === 'camera' ? tr('u6.sf.camera_open_failed') : tr('u6.sf.gallery_open_failed'));
      return;
    }
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    setBusy(tr('u6.sf.reading_photo'));
    try {
      if (purpose === 'product') {
        const codes = localBarcode ? await readBarcodesFromImage(uri) : [];
        if (codes[0]) { setBusy(null); await identifyBarcode(codes[0], source === 'camera' ? 'photo_barcode' : 'import'); return; }
        const r = await readTextFromImage(uri);
        if (r.ingredients) applyReading(r);
        if (r.printedBarcode) { setBusy(null); await identifyBarcode(r.printedBarcode, source === 'camera' ? 'photo' : 'import'); return; }
        const q = frontTextToQuery(r.text);
        if (q.length >= 2) { setQuery(q); setBusy(null); await runSearch(q, source === 'camera' ? 'photo' : 'import'); return; }
        setNotice(tr('u6.sf.nothing_readable'));
      } else {
        const r = await readTextFromImage(uri);
        applyReading(r);
        if (step === 'identify') {
          setMethod('ingredients_photo');
          if (r.printedBarcode) { setBusy(null); await identifyBarcode(r.printedBarcode, 'ingredients_photo'); return; }
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

  /** Produit choisi à l'étape « Est-ce bien ce produit ? » (null : rien de valable). */
  const picked: ConfirmedSubject | null = (() => {
    if (pick?.kind === 'candidate') {
      const c = candidates[pick.index];
      return c ? { candidate: c, name: c.name, brand: c.brand, barcode: c.barcode || scannedBarcode, imageUrl: c.image_url } : null;
    }
    if (pick?.kind === 'ciqual') {
      const f = ciqual[pick.index];
      return f ? { candidate: null, ciqual: f, name: f.nom, brand: null, barcode: null, imageUrl: null } : null;
    }
    if (pick?.kind === 'manual' && manualName.trim().length >= 2) {
      return { candidate: null, name: manualName.trim(), brand: manualBrand.trim() || null, barcode: scannedBarcode, imageUrl: null };
    }
    return null;
  })();

  function confirmSubject(s: ConfirmedSubject | null = picked) {
    if (!s) return;
    const key = subjectKey(s);
    const sameAsBefore = key === detailsFor.current;
    const first = detailsFor.current === null;
    if (!sameAsBefore && !first) {
      // Un AUTRE produit : ses précisions ne décrivent pas celui-ci (aucune information reprise par erreur)
      setPtype(null); setExposure(null); setZone(null); setPrecautions(''); setPao(''); setAnswers({}); setOpenedText('');
      setIngredients(''); setOrigin(null); setOcr(null);
    }
    setSubject(s);
    const c = s.candidate;
    if (c && !sameAsBefore) {
      setPtype(asProductType(c.product_type));
      // Première confirmation : une liste lue sur la photo (relue par la personne) reste prioritaire sur la base
      const keepOcr = first && origin === 'ocr_reviewed';
      if (c.ingredients_text && !keepOcr) { setIngredients(c.ingredients_text); setOrigin('database'); }
      if (c.precautions_text && !(first && precautions)) setPrecautions(c.precautions_text);
      if (c.period_after_opening && !(first && pao)) setPao(c.period_after_opening);
    }
    detailsFor.current = key;
    // Rappels : déjà vérifiés par la recherche du code-barres, sinon vérification pour CE produit
    if (!sameAsBefore && !(lookup.recall_check && s.barcode && s.barcode === scannedBarcode)) void refreshRecalls(s);
    haptic('selection');
    goTo('profile');
  }

  function continueProfile() {
    if (!profile || needsAge) return;
    haptic('selection');
    goTo('details');
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

  async function analyse(): Promise<void> {
    if (!subject || !profile) { setFailure({ kind: 'other', message: tr('u6.sf.choose_who'), retry: analyse }); return; }
    if (inFlight.current) return;
    inFlight.current = true;
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
      // Confirmation APRÈS l'enregistrement réel : la fiche existe
      setFailure(null);
      haptic('success');
      leaving.current = true;
      router.replace(`/scanner/result/${id}`);
    } catch (e) {
      if (e instanceof QuotaReachedError) setQuotaReached(true);
      else setFailure({ kind: failureKind(e), message: friendlyError(e, tr('u6.sf.save_failed')), retry: analyse });
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  return {
    kind, step, dir, goTo, back, leaving,
    // identification
    query, setQuery, runSearch, identifyBarcode, busy, notice, failure, clearFailure: () => setFailure(null),
    camera: { on: cameraOn, setOn: setCameraOn, reading, denied: cameraDenied, open: openCamera, onScanned },
    photo: { localText, localBarcode, fromPhoto }, ocr, method,
    // confirmation
    candidates, ciqual, lookup, scannedBarcode, pick, setPick, picked, manualName, setManualName, manualBrand, setManualBrand, confirmSubject, subject,
    // profil
    options, selectedKey, setProfileKey, generic, profile, needsAge, ageText, setAgeText, allergiesText, setAllergiesText, continueProfile,
    // précisions
    ptype, setPtype, exposure, setExposure, zone, setZone, ingredients, setIngredients, origin, setOrigin, precautions, setPrecautions, pao, setPao,
    answers, setAnswers, openedText, setOpenedText, questions,
    // analyse
    quota, quotaReached, analyse,
  };
}

export type ScanWizard = ReturnType<typeof useScanWizard>;
