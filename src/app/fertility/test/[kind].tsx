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
import type { TKey } from '@/i18n';
import { t as tr } from '@/i18n';

type Step = 'questions' | 'photo' | 'crop' | 'manual' | 'result' | 'saved';

const FORMAT_LABEL: Record<TestFormat, TKey> = { lines: 'u3.fertTest.fmtLines', cross: 'u3.fertTest.fmtCross', digital: 'u3.fertTest.fmtDigital' };

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
    if (!ruleId) e.brand = tr('u3.fertTest.errBrand');
    if (ruleId === UNKNOWN_TEST_ID && !customBrand.trim()) e.custom = tr('u3.fertTest.errCustom');
    if (hour.trim() && !parseHour(hour)) e.hour = tr('u3.fertTest.errHour');
    if (elapsed.trim() && (minutes == null || !Number.isFinite(minutes) || minutes < 0 || minutes > 1440)) e.elapsed = tr('u3.fertTest.errElapsed');
    if (kind === 'pregnancy' && expectedPeriod.trim() && !frToISO(expectedPeriod)) e.period = tr('u3.fertTest.errPeriod');
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
        setAnalysis({ ...a, messages: [tr('u3.fertTest.noOcr')] });
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
      toast(friendlyError(err, tr('u3.fertTest.errAnalyse')), 'error');
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
    if (!userId) return toast(tr('u3.fertTest.signIn'), 'error');
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

  const title = kind === 'ovulation' ? tr('u3.fertTest.tOvul') : tr('u3.fertTest.tPreg');
  const manualOptions = rule?.manualOptions ?? genericManualOptions(kind, effectiveFormat);

  return (
    <Screen back title={title} subtitle={tr('u3.fertTest.subtitle')}>
      <PrivateBanner>{tr('u3.fertTest.private')}</PrivateBanner>

      {step === 'questions' && (
        <Appear kind="soft">
          <SectionTitle title={tr('u3.fertTest.s1')} />
          <Card>
            <Text variant="label">{tr('u3.fertTest.brandModel')}</Text>
            <View style={{ gap: 6, marginTop: 6 }}>
              {rules.map((r) => <Chip key={r.id} label={`${r.brand} — ${r.model}`} selected={ruleId === r.id} onPress={() => setRuleId(r.id)} />)}
              <Chip label={tr('u3.fertTest.other')} selected={ruleId === UNKNOWN_TEST_ID} onPress={() => setRuleId(UNKNOWN_TEST_ID)} />
            </View>
            {errors.brand ? <Text variant="caption" color="#A3243A" style={{ marginTop: 4 }}>{errors.brand}</Text> : null}
            {ruleId === UNKNOWN_TEST_ID && (
              <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                <Field label={tr('u3.fertTest.brandBox')} value={customBrand} onChangeText={setCustomBrand} error={errors.custom} maxLength={80} />
                <Segmented label={tr('u3.fertTest.testType')} value={format} onChange={setFormat} options={(kind === 'pregnancy' ? ['lines', 'cross', 'digital'] : ['lines', 'digital']).map((f) => ({ value: f as TestFormat, label: tr(FORMAT_LABEL[f as TestFormat]) }))} />
                <Banner tone="warning">{tr('u3.fertTest.notListed')}</Banner>
              </View>
            )}
            {rule && (
              <View style={{ marginTop: spacing.sm, gap: 2 }}>
                <Text variant="small" weight="bold">{tr('u3.fertTest.rulesOf', { format: tr(FORMAT_LABEL[rule.format]) })}</Text>
                {rule.readingRules.map((l) => <Text key={l} variant="small" muted>• {l}</Text>)}
                {rule.source.note ? <Text variant="caption" muted>{rule.source.note}</Text> : null}
              </View>
            )}
          </Card>

          <SectionTitle title={tr('u3.fertTest.s2')} />
          <Card>
            <Field label={tr('u3.fertTest.testHour')} optional value={hour} onChangeText={setHour} error={errors.hour} placeholder={tr('u3.fertTest.hourPh')} hint={tr('u3.fertTest.hourHint')} />
            <View style={{ marginTop: spacing.sm }}>
              <Field label={tr('u3.fertTest.elapsed')} optional value={elapsed} onChangeText={setElapsed} error={errors.elapsed} keyboardType="number-pad" suffix={tr('u3.fertTest.min')} />
            </View>
            {rule && (rule.readMinMinutes != null || rule.readMaxMinutes != null) ? (
              <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u3.fertTest.readDelay', { min: rule.readMinMinutes != null ? tr('u3.fertTest.from', { n: rule.readMinMinutes }) : '', sep: rule.readMinMinutes != null && rule.readMaxMinutes != null ? ', ' : '', max: rule.readMaxMinutes != null ? tr('u3.fertTest.upTo', { n: rule.readMaxMinutes }) : '' })}</Text>
            ) : null}
            <View style={{ marginTop: spacing.sm }}>
              <Segmented label={tr('u3.fertTest.inWin')} value={inWindow} onChange={setInWindow} options={[{ value: 'yes', label: tr('u3.fertTest.yes') }, { value: 'no', label: tr('u3.fertTest.no') }, { value: 'unknown', label: tr('u3.fertTest.unknown') }]} />
            </View>
            {kind === 'pregnancy' && (
              <View style={{ marginTop: spacing.sm }}>
                <Field label={tr('u3.fertTest.expPeriod')} optional value={expectedPeriod} onChangeText={setExpectedPeriod} error={errors.period} placeholder={tr('u3.fertBody.datePh')} keyboardType="numbers-and-punctuation" />
              </View>
            )}
          </Card>
          <Button label={tr('u3.fertTest.continue')} icon="arrow-right" onPress={validateQuestions} full />
        </Appear>
      )}

      {step === 'photo' && (
        <Appear kind="soft">
          <SectionTitle title={tr('u3.fertTest.s3')} />
          <PhotoGuide kind="test" />
          {busy ? <Loading label={tr('u3.fertTest.reading')} /> : <PhotoButtons onPicked={onPicked} onError={(m) => toast(m, 'error')} />}
          <Button label={tr('u3.fertTest.manualSelf')} variant="ghost" onPress={() => setStep('manual')} />
        </Appear>
      )}

      {step === 'crop' && !!uri && (
        <Appear kind="soft">
          <SectionTitle title={tr('u3.fertTest.s4')} />
          <Card><CropPicker uri={uri} value={crop} onChange={setCrop} /></Card>
          <Button label={tr('u3.fertTest.analyse')} icon="cpu" onPress={runLines} disabled={!crop.c || !crop.t} loading={busy} full />
          <Row wrap>
            <Button label={tr('u3.fertTest.retake')} variant="secondary" icon="camera" onPress={async () => { await dropPhoto(); setStep('photo'); }} />
            <Button label={tr('u3.fertMucus.dropNow')} variant="ghost" icon="trash-2" onPress={async () => { await dropPhoto(); setStep('photo'); toast(tr('u3.fertMucus.photoDeleted')); }} />
          </Row>
        </Appear>
      )}

      {step === 'manual' && (
        <Appear kind="soft">
          <SectionTitle title={tr('u3.fertTest.sRead')} />
          <Card>
            <Text variant="small" muted>{rule?.mode === 'manual_only' ? tr('u3.fertTest.eye') : tr('u3.fertTest.seeWhat')}</Text>
            <View style={{ gap: 6, marginTop: spacing.sm }}>
              {manualOptions.map((o) => <Button key={o.value} label={o.label} variant="secondary" onPress={() => chooseManual(o.outcome as TestOutcome)} full />)}
            </View>
          </Card>
        </Appear>
      )}

      {step === 'result' && analysis && (
        <Appear kind="soft">
          <SectionTitle title={tr('u3.fertTest.s5')} />
          <AnalysisCard analysis={analysis} />

          <SectionTitle title={tr('u3.fertTest.s6')} />
          <Card>
            <Text>{tr('u3.fertTest.whatShows')}</Text>
            <View style={{ gap: 6, marginTop: spacing.sm }}>
              {outcomesFor(kind).filter((o) => o !== 'unusable').map((o) => (
                <Chip key={o} label={o === analysis.outcome ? tr('u3.fertTest.proposed', { label: OUTCOME_LABEL[o] }) : OUTCOME_LABEL[o]} selected={confirmed === o} onPress={() => setConfirmed(o)} />
              ))}
            </View>
            {analysis.outcome === 'unusable' && <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u3.fertTest.retakeOrSelf')}</Text>}
            <View style={{ marginTop: spacing.sm }}><Field label={tr('u3.fertBody.note')} optional value={note} onChangeText={setNote} maxLength={500} /></View>
            {uri ? <View style={{ marginTop: spacing.sm }}><KeepPhotoChoice value={keepPhoto} onChange={setKeepPhoto} /></View> : null}
            <Button label={tr('u3.fertTest.saveCal')} icon="check" style={{ marginTop: spacing.sm }} disabled={!confirmed} loading={save.isPending} onPress={submit} full />
          </Card>
          <Row wrap>
            {uri ? <Button label={tr('u3.fertMucus.dropNow')} variant="ghost" icon="trash-2" onPress={async () => { await dropPhoto(); setKeepPhoto(false); toast(tr('u3.fertTest.dropSaved')); }} /> : null}
            {rule?.mode !== 'manual_only' && <Button label={tr('u3.fertTest.retake')} variant="ghost" icon="camera" onPress={async () => { await dropPhoto(); setAnalysis(null); setStep('photo'); }} />}
          </Row>
        </Appear>
      )}

      {step === 'saved' && (
        <Appear kind="pop">
          <Card>
            <Text variant="heading">{tr('u3.fertTest.saved')}</Text>
            <Text muted style={{ marginTop: 4 }}>{savedPhoto ? tr('u3.fertTest.savedPhoto') : tr('u3.fertTest.savedNoPhoto')}</Text>
            {kind === 'ovulation' && <Text variant="small" muted style={{ marginTop: spacing.xs }}>{OVULATION_REMINDER}</Text>}
          </Card>
          <Button label={tr('u3.fertTest.seeCal')} icon="calendar" onPress={() => router.replace('/fertility/calendar')} full />
          <Button label={tr('u3.fertTest.another')} variant="secondary" onPress={() => { setStep('questions'); setAnalysis(null); setConfirmed(null); setNote(''); setKeepPhoto(false); }} full />
          {kind === 'pregnancy' && <Text variant="caption" muted center>{tr('u3.fertTest.today', { date: todayISO().split('-').reverse().join('/') })}</Text>}
        </Appear>
      )}
    </Screen>
  );
}
