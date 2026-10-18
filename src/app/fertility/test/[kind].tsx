/**
 * Photographier un test d'ovulation ou de grossesse.
 * Étapes : questions (test, délai) → photo guidée → cadrage → analyse SUR LE TÉLÉPHONE
 * → résultat proposé avec niveau de confiance → confirmation par l'utilisatrice → enregistrement.
 * La photo est supprimée après l'analyse, sauf si l'utilisatrice choisit de la garder (chiffrée).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { useToast } from '@/components/Overlays';
import { PrivateBanner } from '@/components/Fertility';
import { Banner, Button, Card, Chip, Field, Loading, Row, Segmented, SectionTitle, Text, haptic } from '@/components/ui';
import { AnalysisCard, CropPicker, KeepPhotoChoice, PhotoButtons, PhotoGuide, type CropValue } from '@/features/cycleTests';
import { useUserId } from '@/lib/auth';
import { useSaveTest } from '@/lib/data/hooks-cycle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { findRule, genericManualOptions, rulesFor, UNKNOWN_TEST_ID, type TestFormat, type TestKind } from '@/lib/cycleAnalysis/brands';
import { analyseDigitalText, analyseLineTest, manualReading, OUTCOME_LABEL, outcomesFor, OVULATION_REMINDER, type ReadWindowAnswer, type TestAnalysis, type TestOutcome } from '@/lib/cycleAnalysis/interpret';
import { decodeImage } from '@/lib/cycleAnalysis/decode';
import { discardLocalImage } from '@/lib/cycleAnalysis/privacy';
import { localTextRecognitionAvailable, readTextFromImage } from '@/lib/scanner/localRecognition';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';

type Step = 'questions' | 'photo' | 'crop' | 'manual' | 'result' | 'saved';

const FORMAT_LABEL: Record<TestFormat, string> = { lines: 'Test à lignes', cross: 'Test à croix (+ / −)', digital: 'Écran numérique' };

function parseHour(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\s*[h:]\s*(\d{2})?$/i);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  const d = new Date();
  d.setHours(h, min, 0, 0);
  if (d.getTime() > Date.now() + 60_000) d.setDate(d.getDate() - 1); // test fait la veille au soir
  return d;
}

export default function TestPhotoScreen() {
  const { kind: kindParam } = useLocalSearchParams<{ kind: string }>();
  const kind: TestKind = kindParam === 'pregnancy' ? 'pregnancy' : 'ovulation';
  const toast = useToast();
  const userId = useUserId();
  const save = useSaveTest();

  const [step, setStep] = useState<Step>('questions');
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [customBrand, setCustomBrand] = useState('');
  const [format, setFormat] = useState<TestFormat>('lines');
  const [hour, setHour] = useState('');
  const [elapsed, setElapsed] = useState('');
  const [inWindow, setInWindow] = useState<ReadWindowAnswer>('unknown');
  const [expectedPeriod, setExpectedPeriod] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uri, setUri] = useState<string | null>(null);
  const uriRef = useRef<string | null>(null);
  const [crop, setCrop] = useState<CropValue>({ c: null, t: null, band: 0.22 });
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<TestAnalysis | null>(null);
  const [confirmed, setConfirmed] = useState<TestOutcome | null>(null);
  const [note, setNote] = useState('');
  const [keepPhoto, setKeepPhoto] = useState(false);
  const [savedPhoto, setSavedPhoto] = useState(false);

  const rule = findRule(ruleId);
  const rules = useMemo(() => rulesFor(kind), [kind]);
  const effectiveFormat: TestFormat = rule?.format ?? format;
  const minutes = elapsed.trim() ? Number(elapsed.replace(',', '.')) : null;
  const ctx = { kind, ruleId: ruleId === UNKNOWN_TEST_ID ? null : ruleId, format: effectiveFormat, minutesElapsed: minutes != null && Number.isFinite(minutes) ? Math.round(minutes) : null, withinReadWindow: inWindow };

  // L'image ne survit jamais à l'écran : suppression si l'on quitte sans enregistrer.
  useEffect(() => { uriRef.current = uri; }, [uri]);
  useEffect(() => () => { void discardLocalImage(uriRef.current); }, []);

  // Heure du test → minutes écoulées (modifiable)
  useEffect(() => {
    const d = parseHour(hour);
    if (d) setElapsed(String(Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))));
  }, [hour]);

  async function dropPhoto() {
    await discardLocalImage(uri);
    setUri(null);
    uriRef.current = null;
  }

  function validateQuestions() {
    const e: Record<string, string> = {};
    if (!ruleId) e.brand = 'Choisissez votre test, ou « Autre test / je ne sais pas ».';
    if (ruleId === UNKNOWN_TEST_ID && !customBrand.trim()) e.custom = 'Indiquez la marque et le modèle (tels qu’écrits sur la boîte).';
    if (hour.trim() && !parseHour(hour)) e.hour = 'Heure attendue au format 7h30 ou 07:30.';
    if (elapsed.trim() && (minutes == null || !Number.isFinite(minutes) || minutes < 0 || minutes > 1440)) e.elapsed = 'Nombre de minutes entre 0 et 1440.';
    if (kind === 'pregnancy' && expectedPeriod.trim() && !frToISO(expectedPeriod)) e.period = 'Date attendue au format JJ/MM/AAAA.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const manualOnly = rule?.mode === 'manual_only';
    setStep(manualOnly ? 'manual' : 'photo');
  }

  async function onPicked(newUri: string) {
    await discardLocalImage(uri);
    setUri(newUri);
    setAnalysis(null);
    setConfirmed(null);
    setCrop({ c: null, t: null, band: 0.22 });
    if (rule?.mode === 'digital_ocr') await runOcr(newUri);
    else setStep('crop');
  }

  async function runOcr(u: string) {
    setBusy(true);
    try {
      if (!localTextRecognitionAvailable()) {
        const a = analyseDigitalText('', ctx);
        setAnalysis({ ...a, messages: ['La lecture de l’écran sur le téléphone n’est pas disponible ici (version web ou application sans module de reconnaissance). L’application ne devine pas le résultat : indiquez ce que vous lisez.'] });
      } else {
        const r = await readTextFromImage(u);
        setAnalysis(analyseDigitalText(r.text, ctx));
      }
      setStep('result');
    } catch {
      setAnalysis(analyseDigitalText('', ctx));
      setStep('result');
    } finally {
      setBusy(false);
    }
  }

  async function runLines() {
    if (!uri || !crop.c || !crop.t) return;
    setBusy(true);
    try {
      const img = await decodeImage(uri);
      const P = (p: { x: number; y: number }) => ({ x: p.x * (img.width - 1), y: p.y * (img.height - 1) });
      setAnalysis(analyseLineTest(img, P(crop.c), P(crop.t), ctx, crop.band));
      setConfirmed(null);
      setStep('result');
    } catch (err) {
      toast(friendlyError(err, 'Analyse impossible sur cette photo. Reprenez une photo ou lisez le test vous-même.'), 'error');
    } finally {
      setBusy(false);
    }
  }

  function chooseManual(outcome: TestOutcome) {
    const a = manualReading(outcome, ctx);
    setAnalysis(a);
    setConfirmed(a.outcome);
    setStep('result');
  }

  async function submit() {
    if (!analysis || !confirmed) return;
    if (!userId) return toast('Connectez-vous pour enregistrer ce résultat.', 'error');
    try {
      const testedAt = parseHour(hour)?.toISOString() ?? new Date().toISOString();
      const res = await save.mutateAsync({
        userId, kind, ruleId: ruleId === UNKNOWN_TEST_ID ? null : ruleId,
        brandLabel: rule ? `${rule.brand} ${rule.model}` : customBrand.trim() || null,
        format: effectiveFormat, testedAt, minutesAfter: ctx.minutesElapsed, withinReadWindow: inWindow,
        expectedPeriodOn: kind === 'pregnancy' ? frToISO(expectedPeriod) : null,
        analysisOutcome: analysis.method === 'manual' ? null : analysis.outcome,
        analysisConfidence: analysis.method === 'manual' ? null : analysis.confidence,
        method: analysis.method, confirmedOutcome: confirmed, note: note.trim() || null,
        photoUri: uri, keepPhoto,
      });
      setSavedPhoto(!!res.photoPath);
      uriRef.current = null;
      setUri(null);
      haptic('success');
      setStep('saved');
    } catch (err) {
      setUri(null); // l'image locale a déjà été supprimée par l'enregistrement, même en cas d'erreur
      uriRef.current = null;
      toast(friendlyError(err), 'error');
    }
  }

  const title = kind === 'ovulation' ? 'Test d’ovulation' : 'Test de grossesse';
  const manualOptions = rule?.manualOptions ?? genericManualOptions(kind, effectiveFormat);

  return (
    <Screen back title={title} subtitle="Photo analysée sur votre téléphone, résultat à confirmer">
      <PrivateBanner>La photo est analysée sur ce téléphone puis supprimée. Rien n’est publié, rien n’est enregistré dans votre galerie.</PrivateBanner>

      {step === 'questions' && (
        <Appear kind="soft">
          <SectionTitle title="1. Votre test" />
          <Card>
            <Text variant="label">Marque et modèle</Text>
            <View style={{ gap: 6, marginTop: 6 }}>
              {rules.map((r) => <Chip key={r.id} label={`${r.brand} — ${r.model}`} selected={ruleId === r.id} onPress={() => setRuleId(r.id)} />)}
              <Chip label="Autre test / je ne sais pas" selected={ruleId === UNKNOWN_TEST_ID} onPress={() => setRuleId(UNKNOWN_TEST_ID)} />
            </View>
            {errors.brand ? <Text variant="caption" color="#C2416E" style={{ marginTop: 4 }}>{errors.brand}</Text> : null}
            {ruleId === UNKNOWN_TEST_ID && (
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <Field label="Marque et modèle (écrits sur la boîte)" value={customBrand} onChangeText={setCustomBrand} error={errors.custom} maxLength={80} />
                <Segmented label="Type de test" value={format} onChange={setFormat} options={(kind === 'pregnancy' ? ['lines', 'cross', 'digital'] : ['lines', 'digital']).map((f) => ({ value: f as TestFormat, label: FORMAT_LABEL[f as TestFormat] }))} />
                <Banner tone="warning">Ce test n’est pas dans la liste des tests compatibles : l’application ne proposera pas de résultat automatique. Vous pourrez noter ce que vous lisez.</Banner>
              </View>
            )}
            {rule && (
              <View style={{ marginTop: spacing.sm, gap: 2 }}>
                <Text variant="small" weight="bold">{FORMAT_LABEL[rule.format]} — règles de la notice</Text>
                {rule.readingRules.map((l) => <Text key={l} variant="small" muted>• {l}</Text>)}
                {rule.source.note ? <Text variant="caption" muted>{rule.source.note}</Text> : null}
              </View>
            )}
          </Card>

          <SectionTitle title="2. Le délai de lecture" />
          <Card>
            <Field label="Heure du test" optional value={hour} onChangeText={setHour} error={errors.hour} placeholder="7h30" hint="Calcule automatiquement le temps écoulé." />
            <View style={{ marginTop: spacing.sm }}>
              <Field label="Temps écoulé depuis le test" optional value={elapsed} onChangeText={setElapsed} error={errors.elapsed} keyboardType="number-pad" suffix="min" />
            </View>
            {rule && (rule.readMinMinutes != null || rule.readMaxMinutes != null) ? (
              <Text variant="caption" muted style={{ marginTop: 4 }}>{`Délai de lecture de la notice : ${rule.readMinMinutes != null ? `à partir de ${rule.readMinMinutes} min` : ''}${rule.readMinMinutes != null && rule.readMaxMinutes != null ? ', ' : ''}${rule.readMaxMinutes != null ? `au plus tard ${rule.readMaxMinutes} min` : ''}.`}</Text>
            ) : null}
            <View style={{ marginTop: spacing.sm }}>
              <Segmented label="La photo sera-t-elle prise pendant le délai de lecture indiqué par le fabricant ?" value={inWindow} onChange={setInWindow} options={[{ value: 'yes', label: 'Oui' }, { value: 'no', label: 'Non' }, { value: 'unknown', label: 'Je ne sais pas' }]} />
            </View>
            {kind === 'pregnancy' && (
              <View style={{ marginTop: spacing.sm }}>
                <Field label="Date prévue des règles" optional value={expectedPeriod} onChangeText={setExpectedPeriod} error={errors.period} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" />
              </View>
            )}
          </Card>
          <Button label="Continuer" icon="arrow-right" onPress={validateQuestions} full />
        </Appear>
      )}

      {step === 'photo' && (
        <Appear kind="soft">
          <SectionTitle title="3. La photo" />
          <PhotoGuide kind="test" />
          {busy ? <Loading label="Lecture de l’écran sur le téléphone…" /> : <PhotoButtons onPicked={onPicked} onError={(m) => toast(m, 'error')} />}
          <Button label="Je préfère lire le test moi-même" variant="ghost" onPress={() => setStep('manual')} />
        </Appear>
      )}

      {step === 'crop' && uri && (
        <Appear kind="soft">
          <SectionTitle title="4. Cadrage de la fenêtre de résultat" />
          <Card><CropPicker uri={uri} value={crop} onChange={setCrop} /></Card>
          <Button label="Analyser sur le téléphone" icon="cpu" onPress={runLines} disabled={!crop.c || !crop.t} loading={busy} full />
          <Row wrap>
            <Button label="Reprendre une photo" variant="secondary" icon="camera" onPress={async () => { await dropPhoto(); setStep('photo'); }} />
            <Button label="Supprimer la photo maintenant" variant="ghost" icon="trash-2" onPress={async () => { await dropPhoto(); setStep('photo'); toast('Photo supprimée.'); }} />
          </Row>
        </Appear>
      )}

      {step === 'manual' && (
        <Appear kind="soft">
          <SectionTitle title="Ce que vous lisez sur le test" />
          <Card>
            <Text variant="small" muted>{rule?.mode === 'manual_only' ? 'Ce format se lit à l’œil : l’analyse photo automatique n’est pas prise en charge.' : 'Indiquez ce que vous voyez, selon la notice.'}</Text>
            <View style={{ gap: 6, marginTop: spacing.sm }}>
              {manualOptions.map((o) => <Button key={o.value} label={o.label} variant="secondary" onPress={() => chooseManual(o.outcome as TestOutcome)} full />)}
            </View>
          </Card>
        </Appear>
      )}

      {step === 'result' && analysis && (
        <Appear kind="soft">
          <SectionTitle title="5. Résultat proposé" />
          <AnalysisCard analysis={analysis} />

          <SectionTitle title="6. Votre confirmation" />
          <Card>
            <Text>Qu’indique le test lorsque vous le regardez vous-même ?</Text>
            <View style={{ gap: 6, marginTop: spacing.sm }}>
              {outcomesFor(kind).filter((o) => o !== 'unusable').map((o) => (
                <Chip key={o} label={o === analysis.outcome ? `${OUTCOME_LABEL[o]} (proposé)` : OUTCOME_LABEL[o]} selected={confirmed === o} onPress={() => setConfirmed(o)} />
              ))}
            </View>
            {analysis.outcome === 'unusable' && <Text variant="caption" muted style={{ marginTop: 6 }}>Vous pouvez reprendre une photo, ou noter ce que vous lisez vous-même.</Text>}
            <View style={{ marginTop: spacing.sm }}><Field label="Note" optional value={note} onChangeText={setNote} maxLength={500} /></View>
            {uri ? <View style={{ marginTop: spacing.sm }}><KeepPhotoChoice value={keepPhoto} onChange={setKeepPhoto} /></View> : null}
            <Button label="Enregistrer dans mon calendrier privé" icon="check" style={{ marginTop: spacing.sm }} disabled={!confirmed} loading={save.isPending} onPress={submit} full />
          </Card>
          <Row wrap>
            {uri ? <Button label="Supprimer la photo maintenant" variant="ghost" icon="trash-2" onPress={async () => { await dropPhoto(); setKeepPhoto(false); toast('Photo supprimée. Le résultat peut toujours être enregistré.'); }} /> : null}
            {rule?.mode !== 'manual_only' && <Button label="Reprendre une photo" variant="ghost" icon="camera" onPress={async () => { await dropPhoto(); setAnalysis(null); setStep('photo'); }} />}
          </Row>
        </Appear>
      )}

      {step === 'saved' && (
        <Appear kind="pop">
          <Card>
            <Text variant="heading">Enregistré</Text>
            <Text muted style={{ marginTop: 4 }}>{savedPhoto ? 'Le résultat et la photo chiffrée sont dans votre calendrier privé.' : 'Le résultat est dans votre calendrier privé. La photo a été supprimée.'}</Text>
            {kind === 'ovulation' && <Text variant="small" muted style={{ marginTop: spacing.xs }}>{OVULATION_REMINDER}</Text>}
          </Card>
          <Button label="Voir mon calendrier" icon="calendar" onPress={() => router.replace('/fertility/calendar')} full />
          <Button label="Faire un autre test" variant="secondary" onPress={() => { setStep('questions'); setAnalysis(null); setConfirmed(null); setNote(''); setKeepPhoto(false); }} full />
          {kind === 'pregnancy' && <Text variant="caption" muted center>{`Date du jour : ${todayISO().split('-').reverse().join('/')}. En cas de doute, refaites un test au moment recommandé par la notice ou parlez-en à un professionnel.`}</Text>}
        </Appear>
      )}
    </Screen>
  );
}
