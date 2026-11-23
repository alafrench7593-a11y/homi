/**
 * Santé de l'enfant — journal des observations (température, symptômes, digestion, note), table `child_observations`
 * (22/11/2026). Monté en tête de « Suivi de santé » (/child/[id]/health-tracking) et sous le formulaire
 * `/track/observation` :
 *  · donnée principale : la dernière température des 48 dernières heures (« 38,4 °C ») ou la dernière observation ;
 *  · courbe des températures (MeasureCurve : un point = une prise réelle, bulle au-dessus du point, liste équivalente) ;
 *  · 7 jours en barres (jour sans observation = pointillés « rien de noté », jamais 0), le jour choisi reste dans
 *    l'adresse (`?day=`) ; sa liste : heure en colonne, pastille, libellé + détail, chevron ;
 *  · toucher une ligne / un point → fiche (Tray) ; « Corriger » : heure, valeur ou intensité PROVISOIRES, Annuler,
 *    Enregistrer verrouillé contre le double appui, brouillon conservé si l'écriture échoue (`useEditLog`, le chemin
 *    du formulaire manuel).
 * Aucune interprétation : pas de « fièvre », pas de seuil, pas de conseil de dose. La température est affichée telle
 * que notée, avec sa méthode.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton, GlassSegmentedControl } from '@/components/glass';
import { MeasureCurve } from '@/components/measureCurve';
import { Field, haptic, Text, type IconName } from '@/components/ui';
import { formatDate, formatNumber, t as tr, type TKey } from '@/i18n';
import { useLogs } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { useEditLog } from '@/lib/data/hooks-quickTrack';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { clock } from '@/lib/domain/sleepPlanner';
import { hhmm, proposedTime } from '@/lib/domain/quickTrack';
import { nudge, parseMeasure } from '@/lib/domain/measureCurve';
import {
  INTENSITY_KINDS, lastObservation, observationPatch, observationsByDay, recentTemperature, tempValue, temperaturePoints,
  TEMP_MAX, TEMP_MIN, TEMP_STEP, type ObsKind,
} from '@/lib/domain/healthTrack';
import type { Child, Observation } from '@/lib/types';
import { DayBars } from '@/features/quickTrack/DayBars';
import { EditActions, EditHeader, EntryTray, HERO, TimeEditor, useGuardedSave } from '@/features/quickTrack/EntryTray';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { HeroEntry, JournalList, TABULAR, type JournalRow } from './TimedJournal';

const MIN = 60_000;
export const OBS_ICON: Record<ObsKind, IconName> = {
  temperature: 'thermometer', symptom: 'alert-circle', medication: 'package', note: 'edit-3', vomit: 'droplet', regurgitation: 'droplet',
  diarrhea: 'wind', abdominal_pain: 'frown', bloating: 'circle', crying: 'volume-2',
};
export const obsKindLabel = (k: ObsKind) => tr(`u7.track.obs.${k}` as TKey);
export const tempText = (v: number) => formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** « Sous le bras », « Moyenne », libellé saisi… (jamais une interprétation). */
export function obsDetail(o: Observation): string | null {
  const parts: string[] = [];
  if (o.kind === 'temperature' && o.temp_method) parts.push(tr(`u7.track.m.${o.temp_method}` as TKey));
  if (INTENSITY_KINDS.includes(o.kind) && o.intensity) parts.push(tr(`u7.track.i.${o.intensity}` as TKey));
  if (o.kind !== 'temperature' && o.label) parts.push(o.label);
  return parts.length ? parts.join(' · ') : null;
}
/** Titre d'une ligne : « 38,4 °C » pour une température, sinon le type. */
export function obsTitle(o: Observation): string {
  const v = tempValue(o);
  return v != null ? tr('ht.obs.tempValue', { value: tempText(v) }) : obsKindLabel(o.kind);
}

export function ObservationLog({ child }: { child: Child }) {
  const now = useNow(60_000);
  const params = useLocalSearchParams<{ day?: string; obs?: string }>();
  const q = useLogs<Observation>('observation', child.id, 31);
  const all = useMemo(() => (q.data ?? []).filter((o) => o.child_id === child.id), [q.data, child.id]);
  const days = useMemo(() => observationsByDay(all, child.id, now, 7), [all, child.id, now]);
  const points = useMemo(() => temperaturePoints(all, child.id, (o) => [clock(new Date(o.at)), obsDetail(o), o.note].filter(Boolean).join(' · ')), [all, child.id]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  // Lien direct (catégorie, accueil) : `?obs=<id>` ouvre la fiche de cette observation
  useEffect(() => {
    if (!params.obs || !all.some((o) => o.id === params.obs)) return;
    setOpenId(params.obs); setVisible(true); router.setParams({ obs: undefined } as never);
  }, [params.obs, all]);
  if (q.isLoading && !q.data) return null;
  const open = (id: string) => { setOpenId(id); setVisible(true); };
  const selectedDay = days.find((d) => d.day === params.day) ?? days[days.length - 1];
  const temp = recentTemperature(all, child.id, now, 48);
  const last = lastObservation(all, child.id);
  const selected = all.find((o) => o.id === openId) ?? null;
  const rows: JournalRow[] = selectedDay.entries.map((o) => ({
    id: o.id, time: clock(new Date(o.at)), icon: OBS_ICON[o.kind] ?? 'circle', title: obsTitle(o), detail: obsDetail(o), hasNote: !!o.note,
    mark: o.kind === 'temperature' ? 'filled' : 'outline',
  }));
  const dayTitle = formatDate(`${selectedDay.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <View style={{ gap: spacing.sm }} testID="ht-obs">
      {temp ? (
        <HeroEntry testID="ht-obs-hero" icon="thermometer" label={tr('ht.obs.lastTemp', { name: child.first_name })}
          value={tempText(tempValue(temp)!)} unit="°C" sub={`${tr('ht.obs.atClock', { time: clock(new Date(temp.at)) })} · ${agoLabel(temp.at, now)}${temp.temp_method ? ` · ${tr(`u7.track.m.${temp.temp_method}` as TKey)}` : ''}`}
          a11y={`${tr('ht.obs.lastTemp', { name: child.first_name })}. ${tr('ht.obs.tempValue', { value: tempText(tempValue(temp)!) })}. ${clock(new Date(temp.at))}. ${agoLabel(temp.at, now)}`}
          onPress={() => open(temp.id)} />
      ) : last ? (
        <HeroEntry testID="ht-obs-hero" icon={OBS_ICON[last.kind] ?? 'circle'} label={tr('ht.obs.last', { name: child.first_name })}
          value={agoLabel(last.at, now)} sub={`${obsTitle(last)} · ${tr('ht.obs.atClock', { time: clock(new Date(last.at)) })}`}
          a11y={`${tr('ht.obs.last', { name: child.first_name })}. ${obsTitle(last)}. ${clock(new Date(last.at))}`} onPress={() => open(last.id)} />
      ) : (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }} testID="ht-obs-empty">
          <Text weight="bold">{tr('ht.obs.emptyTitle', { name: child.first_name })}</Text>
          <Text variant="small" muted>{tr('ht.obs.emptyBody')}</Text>
        </Glass>
      )}
      {points.length ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.xs }} testID="ht-obs-curve-card">
          <Text variant="label" accessibilityRole="header">{tr('ht.obs.curveTitle')}</Text>
          <MeasureCurve points={points} unit="°C" digits={2} minYSpan={1.5} periods={['1m']} title={tr('ht.obs.curveTitle')} onOpen={open} testID="ht-obs-curve" height={200} />
        </Glass>
      ) : null}
      {all.length ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="ht-obs-week">
          <Text variant="label" accessibilityRole="header">{tr('ht.obs.weekTitle')}</Text>
          <DayBars testID="ht-obs-bars" days={days.map((d) => ({ day: d.day, value: d.count }))} selected={selectedDay.day} minMax={3}
            onSelect={(day) => router.setParams({ day } as never)}
            describe={(d) => (d.value != null ? tr('ht.obs.count', { count: d.value }) : tr('ht.none'))} />
          <JournalList testID="ht-obs-day" title={dayTitle} count={selectedDay.count != null ? tr('ht.obs.count', { count: selectedDay.count }) : null}
            rows={rows} onOpen={open} emptyLabel={tr('ht.noneDay')} openHint={tr('ht.openToFix')} />
        </Glass>
      ) : null}
      <ObservationTray child={child} obs={selected} open={visible && !!selected} onOpenChange={setVisible} />
    </View>
  );
}

export function ObservationTray({ child, obs, open, onOpenChange }: { child: Child; obs: Observation | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!obs) return null;
  const at = new Date(obs.at);
  const v = tempValue(obs);
  return (
    <EntryTray open={open} onOpenChange={onOpenChange} testID="ht-obs-tray" title={tr('ht.obs.trayTitle', { name: child.first_name })}
      hero={v != null ? tr('ht.obs.tempValue', { value: tempText(v) }) : obsKindLabel(obs.kind)}
      lines={[
        `${tr('ht.obs.atClock', { time: clock(at) })} · ${formatDate(at, { weekday: 'long', day: 'numeric', month: 'long' })}`,
        v != null ? obsKindLabel(obs.kind) : null,
        obsDetail(obs),
        obs.note ? tr('ht.note', { note: obs.note }) : null,
      ]}
      editLabel={tr('ht.fix')}
      editor={<ObsEditView key={`${obs.id}:${obs.at}:${obs.value_num}:${obs.label}:${obs.intensity}`} obs={obs} />}
      onFullForm={() => router.push({ pathname: '/track/[kind]', params: { kind: 'observation', child: child.id, id: obs.id } } as never)} />
  );
}

function ObsEditView({ obs }: { obs: Observation }) {
  const t = useTheme();
  const { goBack } = useTray();
  const edit = useEditLog('observation');
  const g = useGuardedSave();
  const at0 = new Date(obs.at);
  const temp0 = tempValue(obs);
  const [time, setTime] = useState(hhmm(at0));
  const [tempText0] = useState(temp0 != null ? formatNumber(temp0, { maximumFractionDigits: 2, useGrouping: false }) : '');
  const [tempInput, setTempInput] = useState(tempText0);
  const [label, setLabel] = useState(obs.label ?? '');
  const [intensity, setIntensity] = useState<number | null>(obs.intensity ?? null);
  const at = proposedTime(obs.at, time);
  const temp = obs.kind === 'temperature' ? parseMeasure(tempInput, TEMP_MIN, TEMP_MAX) : null;
  const patch = observationPatch(obs, { at, temp, label, intensity });
  const changed = !!patch && Object.keys(patch).length > 0;
  const isTemp = obs.kind === 'temperature';
  const isIntensity = INTENSITY_KINDS.includes(obs.kind);
  const step = (d: number) => { const b = at ?? at0; const n = new Date(b.getTime() + d * MIN); if (n.getTime() <= Date.now()) setTime(hhmm(n)); g.setError(null); };
  const moveTemp = (d: number) => { setTempInput(formatNumber(nudge(temp ?? temp0 ?? 37, d, 1, TEMP_MIN, TEMP_MAX), { maximumFractionDigits: 1, useGrouping: false })); g.setError(null); };
  const cancel = () => { setTime(hhmm(at0)); setTempInput(tempText0); setLabel(obs.label ?? ''); setIntensity(obs.intensity ?? null); g.setError(null); goBack(); };
  const save = () => g.run(async () => {
    if (!patch || !Object.keys(patch).length) return tr('ht.edit.invalid');
    const res = await edit(obs.id, patch, obs as unknown as Record<string, unknown>);
    if (res === 'changed') return tr('ht.edit.changedMeanwhile');
    haptic('success');
    goBack();
    return 'ok';
  });
  const heroNow = isTemp ? (temp != null ? tr('ht.obs.tempValue', { value: tempText(temp) }) : '—') : isIntensity ? `${obsKindLabel(obs.kind)}${intensity ? ` · ${tr(`u7.track.i.${intensity}` as TKey)}` : ''}` : obsKindLabel(obs.kind);
  const heroBefore = isTemp && temp0 != null ? tr('ht.obs.tempValue', { value: tempText(temp0) }) : obsKindLabel(obs.kind);
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="ht-obs-editor">
      <EditHeader title={tr('ht.obs.fixTitle')} />
      <Text testID="ht-obs-edit-hero" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
        style={[HERO, { color: changed ? t.colors.primary : t.colors.text, textAlign: 'center', fontSize: 44, lineHeight: 50 }, TABULAR]}>{heroNow}</Text>
      <Text weight="bold" center style={TABULAR} testID="ht-obs-edit-proposed">
        {changed && at ? tr('ht.obs.proposed', { what: heroNow, time: clock(at) }) : tr('ht.obs.recorded', { what: heroBefore, time: clock(at0) })}
      </Text>
      {changed ? <Text variant="small" muted center testID="ht-obs-edit-before">{tr('ht.obs.before', { what: heroBefore, time: clock(at0) })}</Text> : null}
      {isTemp ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
          <GlassButton variant="secondary" label={tr('ht.obs.minus')} accessibilityLabel={tr('ht.obs.minusA11y')} testID="ht-obs-edit-minus" onPress={() => moveTemp(-TEMP_STEP)} />
          <View style={{ flex: 1 }}>
            <Field label={tr('ht.obs.tempLabel')} value={tempInput} onChangeText={(x) => { setTempInput(x); g.setError(null); }} keyboardType="decimal-pad" suffix="°C" maxLength={5} testID="ht-obs-edit-temp"
              error={temp == null ? tr('ht.obs.tempBad', { min: TEMP_MIN, max: TEMP_MAX }) : undefined} />
          </View>
          <GlassButton variant="secondary" label={tr('ht.obs.plus')} accessibilityLabel={tr('ht.obs.plusA11y')} testID="ht-obs-edit-plus" onPress={() => moveTemp(TEMP_STEP)} />
        </View>
      ) : isIntensity ? (
        <GlassSegmentedControl testID="ht-obs-edit-intensity" label={tr('ht.obs.intensity')} value={(intensity ? String(intensity) : '0') as '0' | '1' | '2' | '3'}
          onChange={(x) => { setIntensity(x === '0' ? null : Number(x)); g.setError(null); }}
          options={[{ value: '0' as const, label: tr('ht.obs.noIntensity') }, ...([1, 2, 3] as const).map((k) => ({ value: String(k) as '1' | '2' | '3', label: tr(`u7.track.i.${k}` as TKey), testID: `ht-obs-edit-i${k}` }))]} />
      ) : (
        <Field label={obs.kind === 'note' ? tr('ht.obs.titleLabel') : tr('ht.obs.labelLabel')} value={label} onChangeText={(x) => { setLabel(x); g.setError(null); }} maxLength={160} testID="ht-obs-edit-label"
          error={!label.trim() && obs.kind !== 'note' ? tr('ht.obs.labelNeeded') : undefined} />
      )}
      <TimeEditor text={time} onText={(x) => { setTime(x); g.setError(null); }} onStep={step} valid={!!at} testID="ht-obs-edit" />
      <EditActions onCancel={cancel} onSave={save} canSave={changed} busy={g.busy} error={g.error} testID="ht-obs-edit" />
    </View>
  );
}
