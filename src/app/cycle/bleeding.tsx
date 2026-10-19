/**
 * Saignements inhabituels : entre les règles, après un rapport, rosés ou brunâtres, d'origine inconnue, pendant une grossesse.
 * L'orientation (urgence, consulter, noter) s'affiche AVANT l'enregistrement et dès le premier choix : aucune animation,
 * aucun calcul ni aucune étape ne retarde l'accès aux numéros d'urgence. Aucun diagnostic n'est posé.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, haptic, Row } from '@/components/ui';
import { confirm, useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { removeOwn, saveOwn, useBleedingLogs, type BleedingLog } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { BLEEDING_KINDS, bleedingOrientation, DISCHARGE } from '@/lib/domain/cycleV2';
import { toFrDate } from '@/lib/validation';
import { uuid } from '@/lib/uuid';
import { Choices, CycleIcon, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { useEmergencyNumbers } from '@/features/cycle/emergency';
import { fmtDayYear } from '@/features/cycle/format';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const AMOUNTS = ['spotting', 'light', 'moderate', 'heavy', 'very_heavy'] as const;
type YesNo = 'yes' | 'no';

export default function BleedingScreen() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const emergency = useEmergencyNumbers();
  const { data: logs } = useBleedingLogs();
  const [editing, setEditing] = useState<BleedingLog | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [pain, setPain] = useState<YesNo | null>(null);
  const [pregnancy, setPregnancy] = useState<string | null>(null);
  const [day, setDay] = useState(toFrDate(todayISO()));
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  React.useEffect(() => { const b = editId ? logs?.find((x) => x.id === editId) : null; if (b && editing?.id !== b.id) edit(b); }, [editId, logs?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const orientation = kind ? bleedingOrientation({ kind, amount, pain: pain == null ? null : pain === 'yes', pregnancy }) : null;

  function reset() { setEditing(null); setKind(null); setAmount(null); setPain(null); setPregnancy(null); setDay(toFrDate(todayISO())); setNote(''); setErr(null); }
  function edit(b: BleedingLog) {
    setEditing(b); setKind(b.kind); setAmount(b.amount); setPain(b.pain == null ? null : b.pain ? 'yes' : 'no'); setPregnancy(b.pregnancy);
    setDay(toFrDate(b.occurred_on)); setNote(b.note ?? ''); setErr(null); haptic('selection');
  }
  async function save() {
    const d = frToISO(day);
    if (!kind) return setErr(tr('cy.bl.errKind'));
    if (!d || d > todayISO()) return setErr(tr('cy.err.start'));
    setErr(null); setBusy(true);
    try {
      const row = { occurred_on: d, kind, amount, pain: pain == null ? null : pain === 'yes', pregnancy, note: note.trim() || null };
      const newId = editing?.id ?? uuid();
      await saveOwn('bleeding_logs', editing ? row : { id: newId, user_id: userId, ...row }, editing?.id);
      inv('bleeding_logs'); haptic('success'); toast(tr('cy.bl.saved')); reset();
      router.push(`/cycle/recap?type=bleeding&id=${newId}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove(b: BleedingLog) {
    if (!(await confirm(tr('cy.delete.title', { what: tr('cy.what.bleeding') }), tr('cy.delete.body'), tr('common.delete')))) return;
    try { await removeOwn('bleeding_logs', b.id); inv('bleeding_logs'); if (editing?.id === b.id) reset(); toast(tr('cy.deleted')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('cy.bl.title')} subtitle={tr('cy.bl.subtitle')}>
      {/* Accès immédiat à l'aide, sans rien remplir */}
      <Banner tone="danger" title={tr('cy.bl.redFlagsTitle')} action={<Button label={tr('cy.orient.call')} variant="danger" size="sm" onPress={() => router.push('/emergency')} />}>
        {tr('cy.bl.redFlags', { numbers: emergency })}
      </Banner>

      <Glass>
        <Ink variant="heading">{editing ? tr('cy.bl.editTitle') : tr('cy.bl.newTitle')}</Ink>
        <Choices label={tr('cy.bl.kindQ')} options={BLEEDING_KINDS} value={kind} onChange={(v) => setKind(v as string | null)} labelOf={(k) => tr(`cy.bl.kind.${k}` as TKey)} />
        {orientation === 'urgent' ? (
          <Banner tone="danger" title={tr('cy.orient.urgentTitle')} action={<Button label={tr('cy.orient.call')} variant="danger" size="sm" onPress={() => router.push('/emergency')} />}>{tr('cy.orient.urgentBleeding', { numbers: emergency })}</Banner>
        ) : orientation === 'see_soon' ? (
          <Banner tone="warning" title={tr('cy.orient.seeTitle')}>{tr('cy.orient.seeBleeding')}</Banner>
        ) : orientation === 'mention' ? <Banner tone="info">{tr('cy.orient.mentionBleeding')}</Banner> : null}
        <Choices label={tr('cy.bl.amountQ')} options={AMOUNTS} value={amount} onChange={(v) => setAmount(v as string | null)} labelOf={(a) => tr(`cy.bl.amount.${a}` as TKey)} />
        <Choices label={tr('cy.bl.painQ')} options={['yes', 'no'] as YesNo[]} value={pain} onChange={(v) => setPain(v as YesNo | null)} labelOf={(v) => tr(`cy.${v}` as TKey)} />
        <Choices label={tr('cy.dis.pregnancyQ')} options={DISCHARGE.pregnancy} value={pregnancy} onChange={(v) => setPregnancy(v as string | null)} labelOf={(v) => tr(`cy.dis.pregnancy.${v}` as TKey)} />
        <Field label={tr('cy.bl.date')} value={day} onChangeText={setDay} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
        <Field label={tr('cy.dis.note')} optional value={note} onChangeText={setNote} multiline maxLength={2000} style={{ minHeight: 72, textAlignVertical: 'top' }} />
        {err ? <Banner tone="warning">{err}</Banner> : null}
        <Button label={editing ? tr('cy.period.update') : tr('common.save')} icon="check" loading={busy} onPress={save} full />
        {editing ? <Button label={tr('common.cancel')} variant="ghost" onPress={reset} full /> : null}
        <Ink variant="caption" soft>{tr('cy.bl.notice')}</Ink>
      </Glass>

      <Ink variant="heading">{tr('cy.bl.history')}</Ink>
      {!(logs ?? []).length ? <Ink soft>{tr('cy.bl.empty')}</Ink> : null}
      {(logs ?? []).map((b, i) => (
        <Rise key={b.id} delay={Math.min(i, 6) * 30}>
          <Glass>
            <Row style={{ alignItems: 'flex-start' }}>
              <CycleIcon name="bleeding" color={c.period} />
              <View style={{ flex: 1, gap: 2 }}>
                <Ink weight="medium">{tr(`cy.bl.kind.${b.kind}` as TKey)}</Ink>
                <Ink variant="caption" soft>{[fmtDayYear(b.occurred_on), b.amount ? tr(`cy.bl.amount.${b.amount}` as TKey) : null, b.pain ? tr('cy.bl.withPain') : null, b.note].filter(Boolean).join(' · ')}</Ink>
              </View>
            </Row>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Button label={tr('common.edit')} size="sm" variant="ghost" onPress={() => edit(b)} />
              <Button label={tr('common.delete')} size="sm" variant="ghost" onPress={() => remove(b)} />
            </View>
          </Glass>
        </Rise>
      ))}
      <Ink variant="caption" soft>{tr('cy.private')}</Ink>
    </Screen>
  );
}
