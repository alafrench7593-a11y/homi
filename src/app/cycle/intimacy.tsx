/**
 * Rapports : entièrement FACULTATIF et PRIVÉ (table intercourse_logs, réservée à son propriétaire).
 * Seule la date est nécessaire ; chaque détail est facultatif, avec « je ne sais pas » et « je préfère ne pas répondre ».
 * Une absence de réponse n'est jamais interprétée comme un « non ». Après l'enregistrement, un récapitulatif affiche
 * les conseils adaptés (moteur déterministe, calculé sur l'appareil) — aucune alerte pour un rapport protégé sans incident.
 * Remplace l'ancien écran de Fertilité (même table, mêmes saisies, rien n'est perdu).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ErrorView, Skeleton } from '@/components/States';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Field, haptic } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { useInvalidate, useSetConsent } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { useCycleEstimates, useIntercourseLogs } from '@/lib/data/hooks-fertility';
import { removeOwn, saveOwn } from '@/lib/data/hooks-cycle2';
import { upcomingWindow } from '@/lib/domain/cycle';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { uuid } from '@/lib/uuid';
import { toFrDate } from '@/lib/validation';
import type { IntercourseLog } from '@/lib/types-fertility';
import { Choices, CycleIcon, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { fmtDay, fmtDayYear } from '@/features/cycle/format';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const A4 = ['yes', 'no', 'unsure', 'prefer_not'] as const;
const A3 = ['yes', 'no', 'unsure'] as const;
const KIND = ['vaginal', 'other', 'prefer_not'] as const;
const CONDOM_INCIDENT = ['none', 'broke', 'slipped', 'other', 'unsure'] as const;
const CONTRA_TYPE = ['pill', 'iud_copper', 'iud_hormonal', 'implant', 'patch', 'ring', 'injection', 'other'] as const;
const CONTRA_INCIDENT = ['none', 'missed', 'late', 'misuse', 'other', 'unsure'] as const;
type V = string | null;
const L = (group: string) => (v: string) => tr(`cy.sex.${group}.${v}` as TKey);
const ans = (v: string) => tr(`cy.ans.${v}` as TKey);

export default function IntimacyScreen() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const logsQ = useIntercourseLogs(200);
  const list = useMemo(() => logsQ.data ?? [], [logsQ.data]);
  const prefsQ = useCyclePreferences();
  const savePrefs = useSaveCyclePreferences();
  const { windows } = useCycleEstimates(2);
  const w = upcomingWindow(windows);
  const editing = id ? list.find((l) => l.id === id) ?? null : null;

  const [day, setDay] = useState(toFrDate(todayISO()));
  const [time, setTime] = useState('');
  const [details, setDetails] = useState(false);
  const [kind, setKind] = useState<V>(null);
  const [condom, setCondom] = useState<V>(null);
  const [condomIncident, setCondomIncident] = useState<V>(null);
  const [contra, setContra] = useState<V>(null);
  const [contraType, setContraType] = useState<V>(null);
  const [contraIncident, setContraIncident] = useState<V>(null);
  const [ejac, setEjac] = useState<V>(null);
  const [ec, setEc] = useState<V>(null);
  const [wish, setWish] = useState<V>(null);
  const [seen, setSeen] = useState<V>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setDay(toFrDate(editing.occurred_on)); setTime(editing.occurred_time?.slice(0, 5) ?? '');
    setKind(editing.kind ?? null); setCondom(editing.condom ?? null); setCondomIncident(editing.condom_incident ?? null);
    setContra(editing.usual_contraception ?? null); setContraType(editing.contraception_type ?? null); setContraIncident(editing.contraception_incident ?? null);
    setEjac(editing.ejaculation ?? null); setEc(editing.ec_taken ?? null); setWish(editing.pregnancy_wish ?? null); setSeen(editing.professional_seen ?? null);
    setNote(editing.note ?? '');
    setDetails(true);
  }, [editing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const d = frToISO(day);
    if (!d || d > todayISO()) return setErr(tr('cy.err.dateNotFuture'));
    if (time.trim() && !/^\d{1,2}[:h]\d{2}$/.test(time.trim())) return setErr(tr('cy.sex.errTime'));
    setErr(null); setBusy(true);
    const t = time.trim() ? time.trim().replace('h', ':').padStart(5, '0') : null;
    const row = {
      occurred_on: d, occurred_time: t, kind, condom,
      condom_incident: condom === 'yes' || condom === 'unsure' ? condomIncident : null,
      usual_contraception: contra, contraception_type: contra === 'yes' ? contraType : null, contraception_incident: contra === 'yes' ? contraIncident : null,
      ejaculation: ejac, ec_taken: ec, pregnancy_wish: wish, professional_seen: seen, note: note.trim() || null,
    };
    try {
      const newId = editing?.id ?? uuid();
      await saveOwn('intercourse_logs', editing ? row : { id: newId, user_id: userId, ...row }, editing?.id);
      inv('intercourse_logs');
      haptic('success');
      router.replace(`/cycle/recap?type=sex&id=${newId}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove(l: IntercourseLog) {
    if (!(await confirm(tr('cy.delete.title', { what: tr('cy.what.sex') }), tr('cy.delete.body'), tr('common.delete')))) return;
    try { await removeOwn('intercourse_logs', l.id); inv('intercourse_logs'); toast(tr('cy.deleted')); if (editing?.id === l.id) router.replace('/cycle/intimacy' as never); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function removeAll() {
    if (!(await confirm(tr('cy.sex.deleteAllTitle'), tr('cy.sex.deleteAllBody'), tr('cy.sex.deleteAll')))) return;
    try { for (const l of list) await removeOwn('intercourse_logs', l.id); toast(tr('cy.deleted')); } catch (e) { toast(friendlyError(e), 'error'); } finally { inv('intercourse_logs'); }
  }

  const consent = useSetConsent();
  if (prefsQ.isLoading && !prefsQ.data) return <Screen back title={tr('cy.sex.title')}><Skeleton kind="card" rows={2} /></Screen>;
  if (prefsQ.isError && !prefsQ.data) return <Screen back title={tr('cy.sex.title')}><ErrorView error={prefsQ.error} onRetry={() => void prefsQ.refetch()} /></Screen>;
  if (!prefsQ.prefs.track_intercourse) {
    return (
      <Screen back title={tr('cy.sex.title')} subtitle={tr('cy.sex.offSubtitle')}>
        <Glass>
          <Ink>{tr('cy.sex.offBody')}</Ink>
          <Button label={tr('cy.sex.enable')} icon="lock" loading={savePrefs.isPending} onPress={() => consent.mutateAsync({ purpose: 'intimate_data' as never, granted: true }).then(() => savePrefs.mutateAsync({ track_intercourse: true })).catch((e) => toast(friendlyError(e), 'error'))} full />
        </Glass>
        <Ink variant="caption" soft>{tr('cy.private')}</Ink>
      </Screen>
    );
  }

  return (
    <Screen back title={editing ? tr('cy.sex.editTitle') : tr('cy.sex.title')} subtitle={tr('cy.sex.subtitle')}>
      <Rise>
        <Glass>
          <Field label={tr('cy.sex.date')} value={day} onChangeText={setDay} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
          <Field label={tr('cy.sex.time')} optional value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="22:30" hint={tr('cy.sex.timeHint')} />
          {!details ? (
            <Button label={tr('cy.sex.addDetails')} variant="secondary" icon="plus" onPress={() => { haptic('selection'); setDetails(true); }} full />
          ) : (
            <Rise>
              <View style={{ gap: spacing.md }}>
                <Ink variant="small" soft>{tr('cy.sex.detailsHint')}</Ink>
                <Choices label={tr('cy.sex.kindQ')} options={KIND} value={kind} onChange={(v) => setKind(v as V)} labelOf={L('kind')} />
                <Choices label={tr('cy.sex.condomQ')} options={A4} value={condom} onChange={(v) => setCondom(v as V)} labelOf={ans} />
                {condom === 'yes' || condom === 'unsure' ? (
                  <Rise><Choices label={tr('cy.sex.condomIncidentQ')} options={CONDOM_INCIDENT} value={condomIncident} onChange={(v) => setCondomIncident(v as V)} labelOf={L('condom_incident')} /></Rise>
                ) : null}
                <Choices label={tr('cy.sex.contraQ')} options={A4} value={contra} onChange={(v) => setContra(v as V)} labelOf={ans} />
                {contra === 'yes' ? (
                  <Rise>
                    <View style={{ gap: spacing.md }}>
                      <Choices label={tr('cy.sex.contraTypeQ')} options={CONTRA_TYPE} value={contraType} onChange={(v) => setContraType(v as V)} labelOf={L('contra_type')} />
                      <Choices label={tr('cy.sex.contraIncidentQ')} options={CONTRA_INCIDENT} value={contraIncident} onChange={(v) => setContraIncident(v as V)} labelOf={L('contra_incident')} />
                    </View>
                  </Rise>
                ) : null}
                <Choices label={tr('cy.sex.ejacQ')} options={A4} value={ejac} onChange={(v) => setEjac(v as V)} labelOf={ans} />
                <Choices label={tr('cy.sex.ecQ')} options={A3} value={ec} onChange={(v) => setEc(v as V)} labelOf={ans} />
                <Choices label={tr('cy.sex.wishQ')} options={A4} value={wish} onChange={(v) => setWish(v as V)} labelOf={ans} />
                <Choices label={tr('cy.sex.seenQ')} options={['yes', 'no'] as const} value={seen} onChange={(v) => setSeen(v as V)} labelOf={ans} />
                <Field label={tr('cy.sex.note')} optional value={note} onChangeText={setNote} multiline maxLength={1000} style={{ minHeight: 72, textAlignVertical: 'top' }} />
              </View>
            </Rise>
          )}
          {err ? <Banner tone="warning">{err}</Banner> : null}
          <Button label={editing ? tr('cy.period.update') : tr('common.save')} icon="lock" loading={busy} onPress={save} full />
          {editing ? <Button label={tr('common.delete')} variant="ghost" onPress={() => remove(editing)} full /> : null}
          <Ink variant="caption" soft>{tr('cy.sex.why')}</Ink>
        </Glass>
      </Rise>

      {w ? (
        <Glass>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <CycleIcon name="ovulation" color={c.mauve} />
            <Ink variant="small" style={{ flex: 1 }}>{tr('cy.sex.window', { from: fmtDay(w.start), to: fmtDay(w.end) })}</Ink>
          </View>
        </Glass>
      ) : null}

      <Glass>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Ink weight="bold" style={{ flex: 1 }}>{tr('cy.sex.myEntries')}</Ink>
          {list.length ? <Button label={showList ? tr('cy.sex.hide') : tr('cy.sex.show')} size="sm" variant="ghost" onPress={() => setShowList((v) => !v)} /> : null}
        </View>
        {!list.length ? <Ink variant="small" soft>{tr('cy.sex.empty')}</Ink> : !showList ? <Ink variant="small" soft>{tr('cy.sex.hiddenCount', { count: list.length })}</Ink> : null}
        {showList ? list.slice(0, 60).map((l) => (
          <View key={l.id} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs }}>
            <Ink variant="small" style={{ flex: 1, minWidth: 140 }}>{fmtDayYear(l.occurred_on)}</Ink>
            <Button label={tr('common.edit')} size="sm" variant="ghost" onPress={() => router.replace(`/cycle/intimacy?id=${l.id}` as never)} />
            <Button label={tr('common.delete')} size="sm" variant="ghost" onPress={() => remove(l)} />
          </View>
        )) : null}
        {showList && list.length ? <Button label={tr('cy.sex.deleteAll')} variant="ghost" icon="trash-2" onPress={removeAll} full /> : null}
      </Glass>
      <Ink variant="caption" soft>{tr('cy.private')}</Ink>
    </Screen>
  );
}
