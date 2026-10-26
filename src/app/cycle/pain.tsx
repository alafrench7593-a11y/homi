/**
 * Douleurs : parcours progressif (intensité et zones d'abord, puis durée, début, évolution, retentissement,
 * puis signes associés seulement si l'utilisatrice veut les préciser). Enregistré dans la fiche du jour (symptom_logs) :
 * un seul suivi des symptômes, sans doublon. Après l'enregistrement : récapitulatif et conseils adaptés.
 * Historique : intensité maximale par cycle, zones et retentissement — des tendances descriptives, jamais un diagnostic.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Field, haptic } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useUserId } from '@/lib/auth';
import { useInvalidate, usePeriods } from '@/lib/data/hooks';
import { saveOwn, useAllSymptomLogs } from '@/lib/data/hooks-cycle2';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { uuid } from '@/lib/uuid';
import { toFrDate } from '@/lib/validation';
import { Bars } from '@/features/cycle/Bars';
import { BodyMap, IntensityMeter, PAIN_ZONES, type PainZone } from '@/features/cycle/PainKit';
import { Choices, Glass, Ink, Rise, useCyclePalette } from '@/features/cycle/kit';
import { fmtDay } from '@/features/cycle/format';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

const DURATION = ['lt_hour', 'hours', 'day', 'days'] as const;
const ONSET = ['before_period', 'during_period', 'outside_period', 'unsure'] as const;
const PATTERN = ['usual', 'new', 'worse', 'unsure'] as const;
const IMPACT = ['none', 'sleep', 'work', 'studies', 'daily', 'stopped'] as const;
const ASSOC = ['nausea', 'vomiting', 'faint', 'fever', 'unusual_bleeding', 'outside_period', 'painful_sex'] as const;
const PREG = ['no', 'known', 'possible', 'unknown'] as const;
const RELIEF = ['helped', 'not_helped', 'none'] as const;
type V = string | null;
const L = (g: string) => (v: string) => tr(`cy.pain.${g}.${v}` as TKey);

export default function PainScreen() {
  const c = useCyclePalette();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const params = useLocalSearchParams<{ date?: string }>();
  const logsQ = useAllSymptomLogs();
  const { data: periods } = usePeriods();
  const [day, setDay] = useState(toFrDate(params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayISO()));
  const iso = frToISO(day);
  const current = useMemo(() => (iso ? (logsQ.data ?? []).find((l) => l.logged_on === iso) ?? null : null), [logsQ.data, iso]);

  const [intensity, setIntensity] = useState<number | null>(null);
  const [zones, setZones] = useState<string[]>([]);
  const [duration, setDuration] = useState<V>(null);
  const [onset, setOnset] = useState<V>(null);
  const [pattern, setPattern] = useState<V>(null);
  const [impact, setImpact] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [assoc, setAssoc] = useState<string[]>([]);
  const [preg, setPreg] = useState<V>(null);
  const [relief, setRelief] = useState<V>(null);
  const [meds, setMeds] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIntensity(current?.pain_intensity ?? null); setZones(current?.pain_locations ?? []); setDuration(current?.pain_duration ?? null);
    setOnset(current?.pain_onset ?? null); setPattern(current?.pain_pattern ?? null); setImpact(current?.pain_impact ?? []);
    setAssoc(current?.pain_associated ?? []); setPreg(current?.pain_pregnancy ?? null); setRelief(current?.pain_relief ?? null); setMeds(current?.pain_meds ?? '');
    setMore(!!(current?.pain_associated?.length || current?.pain_pregnancy || current?.pain_relief || current?.pain_meds));
  }, [current?.id, iso]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleZone = (z: PainZone) => setZones((cur) => (cur.includes(z) ? cur.filter((x) => x !== z) : [...cur, z]));
  const setImpactSafe = (v: string[]) => { const last = v[v.length - 1]; setImpact(last === 'none' ? ['none'] : v.filter((x) => x !== 'none')); };

  async function save() {
    if (!iso || iso > todayISO()) return setErr(tr('cy.err.dateNotFuture'));
    if (intensity == null) return setErr(tr('cy.pain.errIntensity'));
    setErr(null); setBusy(true);
    const row = {
      pain_intensity: intensity, pain_locations: zones, pain_duration: duration, pain_onset: onset, pain_pattern: pattern, pain_impact: impact,
      pain_associated: assoc, pain_pregnancy: preg, pain_relief: relief, pain_meds: meds.trim() || null,
    };
    try {
      const id = current?.id ?? uuid();
      // La fiche du jour est complétée (symptômes, humeur, note restent intacts)
      await saveOwn('symptom_logs', current ? row : { id, user_id: userId, logged_on: iso, symptoms: [], ...row }, current?.id);
      inv('symptom_logs');
      haptic('success');
      router.replace(`/cycle/recap?type=pain&id=${id}` as never);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }

  // Historique : intensité maximale par cycle (débuts de règles enregistrés)
  const history = useMemo(() => {
    const starts = (periods ?? []).map((p) => p.start_date).sort();
    const byCycle = new Map<string, number>();
    const zoneCount = new Map<string, number>();
    let impacted = 0;
    for (const l of logsQ.data ?? []) {
      if (l.pain_intensity == null) continue;
      const s = [...starts].reverse().find((x) => x <= l.logged_on) ?? l.logged_on.slice(0, 7);
      byCycle.set(s, Math.max(byCycle.get(s) ?? 0, l.pain_intensity));
      for (const z of l.pain_locations ?? []) zoneCount.set(z, (zoneCount.get(z) ?? 0) + 1);
      if ((l.pain_impact ?? []).some((x) => x !== 'none')) impacted += 1;
    }
    return { cycles: [...byCycle.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8), zones: [...zoneCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), impacted };
  }, [logsQ.data, periods]);

  return (
    <Screen back title={tr('cy.pain.title')} subtitle={tr('cy.pain.subtitle')}
      action={{ label: tr('common.save'), icon: 'check', onPress: () => void save(), disabled: busy, testID: 'pain-save' }}>
      <Rise>
        <Glass>
          <Field label={tr('cy.sym.date')} value={day} onChangeText={setDay} keyboardType="numbers-and-punctuation" placeholder={tr('cy.datePh')} />
          {current?.pain_intensity != null ? <Ink variant="caption" soft>{tr('cy.pain.editing')}</Ink> : null}
          <IntensityMeter value={intensity} onChange={setIntensity} />
          <Ink variant="label" weight="medium">{tr('cy.pain.whereQ')}</Ink>
          <BodyMap value={zones} onToggle={toggleZone} intensity={intensity} />
          <Choices label={tr('cy.pain.zonesList')} options={PAIN_ZONES} value={zones} multi onChange={(v) => setZones((v as string[]) ?? [])} labelOf={L('zone')} />
          <Ink variant="caption" soft>{tr('cy.pain.mapNote')}</Ink>
        </Glass>
      </Rise>

      {intensity != null && intensity > 0 ? (
        <Rise>
          <Glass>
            <Choices label={tr('cy.pain.durationQ')} options={DURATION} value={duration} onChange={(v) => setDuration(v as V)} labelOf={L('duration')} />
            <Choices label={tr('cy.pain.onsetQ')} options={ONSET} value={onset} onChange={(v) => setOnset(v as V)} labelOf={L('onset')} />
            <Choices label={tr('cy.pain.patternQ')} options={PATTERN} value={pattern} onChange={(v) => setPattern(v as V)} labelOf={L('pattern')} />
            <Choices label={tr('cy.pain.impactQ')} options={IMPACT} value={impact} multi onChange={(v) => setImpactSafe((v as string[]) ?? [])} labelOf={L('impact')} />
            {!more ? <Button label={tr('cy.pain.moreBtn')} variant="secondary" icon="plus" onPress={() => { haptic('selection'); setMore(true); }} full /> : null}
          </Glass>
        </Rise>
      ) : null}

      {more && intensity != null && intensity > 0 ? (
        <Rise>
          <Glass>
            <Choices label={tr('cy.pain.assocQ')} options={ASSOC} value={assoc} multi onChange={(v) => setAssoc((v as string[]) ?? [])} labelOf={L('assoc')} />
            <Choices label={tr('cy.pain.pregQ')} options={PREG} value={preg} onChange={(v) => setPreg(v as V)} labelOf={(v) => tr(`cy.dis.pregnancy.${v}` as TKey)} />
            <Choices label={tr('cy.pain.reliefQ')} options={RELIEF} value={relief} onChange={(v) => setRelief(v as V)} labelOf={L('relief')} />
            <Field label={tr('cy.pain.medsQ')} optional value={meds} onChangeText={setMeds} maxLength={200} hint={tr('cy.pain.medsHint')} />
          </Glass>
        </Rise>
      ) : null}

      {err ? <Banner tone="warning">{err}</Banner> : null}
      <Ink variant="caption" soft>{tr('cy.pain.notDiagnosis')}</Ink>

      <Glass>
        <Ink variant="heading">{tr('cy.pain.history')}</Ink>
        {history.cycles.length ? (
          <Bars label={tr('cy.pain.history')} color={c.period} rows={history.cycles.map(([s, n]) => ({ label: /^\d{4}-\d{2}-\d{2}$/.test(s) ? tr('cy.st.cycleFrom', { date: fmtDay(s) }) : s, value: n, display: `${n}/10` }))} />
        ) : <Ink soft>{tr('cy.pain.historyEmpty')}</Ink>}
        {history.zones.length ? <Ink variant="small">{tr('cy.pain.topZones', { list: history.zones.map(([z, n]) => `${tr(`cy.pain.zone.${z}` as TKey)} (${n})`).join(', ') })}</Ink> : null}
        {history.impacted ? <Ink variant="small">{tr('cy.pain.impactedDays', { count: history.impacted })}</Ink> : null}
        <Ink variant="caption" soft>{tr('cy.pain.historyNote')}</Ink>
        <View style={{ height: spacing.xs }} />
      </Glass>
      <Ink variant="caption" soft>{tr('cy.private')}</Ink>
    </Screen>
  );
}
