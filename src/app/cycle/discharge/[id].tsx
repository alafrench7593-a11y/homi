/**
 * Observation de pertes vaginales, en 3 étapes : aspect (quantité, couleur, texture), odeur et symptômes associés,
 * contexte facultatif (date, heure, grossesse, rapport, contraception, produit intime, antibiotiques) et note.
 * L'orientation (consulter / urgence) s'affiche dès qu'un signe saisi la justifie : elle ne dépend d'aucun calcul caché,
 * ne pose aucun diagnostic et ne propose aucun traitement. Les fiches liées s'ouvrent pour lire, sans conclure.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, haptic, Row } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { removeOwn, saveOwn, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { cycleDayOn, DISCHARGE, guidesFor } from '@/lib/domain/cycleV2';
import { estimateCycle } from '@/lib/domain/cycle';
import { usePeriods } from '@/lib/data/hooks';
import { daysBetween } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { guideBySlug } from '@/content/dischargeGuides';
import { dl } from '@/features/cycle/discharge';
import { Choices, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { AdviceCard } from '@/features/cycle/AdviceCard';
import { useAdvice } from '@/features/cycle/useAdvice';
import { uuid } from '@/lib/uuid';
import { getLocale, t as tr } from '@/i18n';
import { spacing } from '@/theme/tokens';

type YesNo = 'yes' | 'no';
const yn = (v: boolean | null | undefined): YesNo | null => (v == null ? null : v ? 'yes' : 'no');
const bool = (v: YesNo | null) => (v == null ? null : v === 'yes');

export default function DischargeForm() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const isNew = id === 'new';
  const { data: logs } = useDischargeLogs();
  const existing = isNew ? null : logs?.find((l) => l.id === id) ?? null;
  const { data: periods } = usePeriods();

  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [textures, setTextures] = useState<string[]>([]);
  const [odor, setOdor] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [pregnancy, setPregnancy] = useState<string | null>(null);
  const [recentSex, setRecentSex] = useState<YesNo | null>(null);
  const [contraception, setContraception] = useState<YesNo | null>(null);
  const [product, setProduct] = useState<YesNo | null>(null);
  const [antibiotics, setAntibiotics] = useState<YesNo | null>(null);
  const [note, setNote] = useState('');
  const [dayText, setDayText] = useState(toFrDate(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO()));
  const [time, setTime] = useState(() => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setAmount(existing.amount); setColor(existing.color); setTextures(existing.textures ?? []); setOdor(existing.odor); setSymptoms(existing.symptoms ?? []);
    setPregnancy(existing.pregnancy); setRecentSex(yn(existing.recent_sex)); setContraception(yn(existing.contraception)); setProduct(yn(existing.intimate_product));
    setAntibiotics(yn(existing.antibiotics)); setNote(existing.note ?? '');
    const d = new Date(existing.observed_at);
    setDayText(toFrDate(existing.observed_at.slice(0, 10)));
    setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const obs = { amount, color, textures, odor, symptoms, pregnancy };
  const { preview } = useAdvice();
  const live = preview('discharge', { id: existing?.id ?? 'draft', observed_at: `${frToISO(dayText) ?? todayISO()}T12:00:00`, ...obs });
  const top = live[0];
  const guides = useMemo(() => guidesFor(obs).map(guideBySlug).filter(Boolean), [amount, color, textures, odor, symptoms]); // eslint-disable-line react-hooks/exhaustive-deps
  const lang = getLocale() === 'en' ? 'en' : 'fr';

  function setSymptomsSafe(v: string[]) {
    // « Aucun » exclut les autres symptômes (et inversement)
    const last = v[v.length - 1];
    if (last === 'none') setSymptoms(['none']);
    else setSymptoms(v.filter((x) => x !== 'none'));
  }

  async function save() {
    const d = frToISO(dayText);
    const m = time.match(/^(\d{1,2})[:h](\d{2})$/);
    if (!d || d > todayISO() || !m) { setStep(2); return setErr(tr('cy.dis.errDate')); }
    if (!amount && !color && !odor && !textures.length && !symptoms.length && !note.trim()) { setStep(0); return setErr(tr('cy.dis.errEmpty')); }
    setErr(null); setBusy(true);
    try {
      const observed_at = new Date(`${d}T${m[1].padStart(2, '0')}:${m[2]}:00`).toISOString();
      const row = { observed_at, amount, color, textures, odor, symptoms, pregnancy, recent_sex: bool(recentSex), contraception: bool(contraception), intimate_product: bool(product), antibiotics: bool(antibiotics), note: note.trim() || null };
      const newId = existing?.id ?? uuid();
      await saveOwn('discharge_logs', existing ? row : { id: newId, user_id: userId, ...row }, existing?.id);
      inv('discharge_logs');
      haptic('success');
      toast(tr('cy.dis.saved'));
      router.replace(`/cycle/recap?type=discharge&id=${newId}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!existing || !(await confirm(tr('cy.delete.title', { what: tr('cy.what.discharge') }), tr('cy.delete.body'), tr('common.delete')))) return;
    try { await removeOwn('discharge_logs', existing.id); inv('discharge_logs'); toast(tr('cy.deleted')); router.back(); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const ynLabel = (v: YesNo) => tr(`cy.${v}` as 'cy.yes');
  const steps = [tr('cy.dis.step1'), tr('cy.dis.step2'), tr('cy.dis.step3')];

  return (
    <Screen back title={isNew ? tr('cy.dis.new') : tr('cy.dis.edit')} subtitle={tr('cy.dis.formSubtitle')}
      footer={(
        <Row>
          {step > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
          {step < 2 ? <Button label={tr('common.continue')} onPress={() => { haptic('selection'); setStep(step + 1); }} style={{ flex: 1.4 }} />
            : <Button label={tr('common.save')} icon="check" loading={busy} onPress={save} style={{ flex: 1.4 }} />}
        </Row>
      )}>
      {/* Étapes (barre lisible : chaque étape a un libellé, pas seulement une couleur) */}
      <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={tr('cy.dis.stepOf', { n: step + 1, total: 3, name: steps[step] })}>
        {steps.map((s, i) => (
          <View key={s} style={{ flex: 1, gap: 4 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? c.mauve : c.line }} />
            <Ink variant="caption" soft={i !== step} weight={i === step ? 'bold' : undefined}>{s}</Ink>
          </View>
        ))}
      </View>
      {err ? <Banner tone="warning">{err}</Banner> : null}

      {/* Orientation : visible tout de suite, sans attendre la fin du questionnaire */}
      {/* Orientation en direct, dès qu'un signe saisi la justifie (avant même l'enregistrement) */}
      {top && (top.priority === 'emergency' || top.priority === 'prompt' || top.priority === 'consult') ? <AdviceCard advice={top} compact /> : null}

      <Rise key={step}>
        <Glass>
          {step === 0 ? (
            <View style={{ gap: spacing.md }}>
              <Choices label={tr('cy.dis.amountQ')} options={DISCHARGE.amount} value={amount} onChange={(v) => setAmount(v as string | null)} labelOf={(v) => dl('amount', v)} />
              <Choices label={tr('cy.dis.colorQ')} options={DISCHARGE.color} value={color} onChange={(v) => setColor(v as string | null)} labelOf={(v) => dl('color', v)} />
              <Choices label={tr('cy.dis.texturesQ')} options={DISCHARGE.textures} value={textures} multi onChange={(v) => setTextures((v as string[]) ?? [])} labelOf={(v) => dl('textures', v)} />
            </View>
          ) : step === 1 ? (
            <View style={{ gap: spacing.md }}>
              <Choices label={tr('cy.dis.odorQ')} options={DISCHARGE.odor} value={odor} onChange={(v) => setOdor(v as string | null)} labelOf={(v) => dl('odor', v)} />
              <Choices label={tr('cy.dis.symptomsQ')} options={DISCHARGE.symptoms} value={symptoms} multi onChange={(v) => setSymptomsSafe((v as string[]) ?? [])} labelOf={(v) => dl('symptoms', v)} />
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <Field label={tr('cy.dis.date')} value={dayText} onChangeText={setDayText} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
              <Field label={tr('cy.dis.time')} value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="09:00" />
              {(() => {
                // Contexte calculé à partir des règles ENREGISTRÉES (jour du cycle) et de l'estimation (proximité des règles)
                const d = frToISO(dayText);
                const cd = d ? cycleDayOn(periods ?? [], d) : null;
                const next = estimateCycle(periods ?? [], d ?? todayISO()).nextPeriod;
                const gap = d && next ? daysBetween(d, next) : null;
                return cd || (gap != null && gap >= 0 && gap <= 10) ? (
                  <Ink variant="small">{[cd ? tr('cy.dis.cycleDay', { day: cd }) : null, gap != null && gap >= 0 && gap <= 10 ? tr('cy.dis.nearPeriod', { count: gap }) : null].filter(Boolean).join(' · ')}</Ink>
                ) : null;
              })()}
              <Ink variant="small" soft>{tr('cy.dis.contextHint')}</Ink>
              <Choices label={tr('cy.dis.pregnancyQ')} options={DISCHARGE.pregnancy} value={pregnancy} onChange={(v) => setPregnancy(v as string | null)} labelOf={(v) => dl('pregnancy', v)} />
              <Choices label={tr('cy.dis.sexQ')} options={['yes', 'no'] as YesNo[]} value={recentSex} onChange={(v) => setRecentSex(v as YesNo | null)} labelOf={ynLabel} />
              <Choices label={tr('cy.dis.contraceptionQ')} options={['yes', 'no'] as YesNo[]} value={contraception} onChange={(v) => setContraception(v as YesNo | null)} labelOf={ynLabel} />
              <Choices label={tr('cy.dis.productQ')} options={['yes', 'no'] as YesNo[]} value={product} onChange={(v) => setProduct(v as YesNo | null)} labelOf={ynLabel} />
              <Choices label={tr('cy.dis.antibioticsQ')} options={['yes', 'no'] as YesNo[]} value={antibiotics} onChange={(v) => setAntibiotics(v as YesNo | null)} labelOf={ynLabel} />
              <Field label={tr('cy.dis.note')} optional value={note} onChangeText={setNote} multiline maxLength={2000} style={{ minHeight: 80, textAlignVertical: 'top' }} />
            </View>
          )}
        </Glass>
      </Rise>

      {guides.length ? (
        <Glass>
          <Ink weight="bold">{tr('cy.dis.relatedGuides')}</Ink>
          <Ink variant="caption" soft>{tr('cy.dis.relatedHint')}</Ink>
          {guides.map((g) => <Button key={g!.slug} label={g![lang].title} variant="ghost" icon="book-open" onPress={() => router.push(`/cycle/guides/${g!.slug}` as never)} full />)}
        </Glass>
      ) : null}
      <Ink variant="caption" soft>{tr('cy.private')}</Ink>
      {existing ? <Button label={tr('cy.dis.delete')} variant="ghost" onPress={remove} full /> : null}
    </Screen>
  );
}
