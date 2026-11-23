/**
 * « Mon sommeil » (sommeil de la mère) — suivi (22/11/2026). Même donnée que le carnet (`parent_sleep_logs`, privé) :
 *  · donnée principale (scène) : la durée de la nuit choisie (« 6 h 40 »), coucher → réveil et réveils notés dessous ;
 *    nuit non notée → « Rien de noté pour cette nuit » en pointillé (jamais 0 h) ;
 *  · 7 nuits en barres (jour du réveil), nuit choisie gardée dans l'adresse (`?day=`), une nuit sans durée = pointillés ;
 *  · toucher la nuit → sa fiche (Tray, `?night=`) : « Corriger » coucher, réveil et nombre de réveils — valeurs
 *    provisoires, Annuler, Enregistrer verrouillé, brouillon gardé si l'écriture échoue ; « Formulaire complet » ouvre
 *    le formulaire du carnet (siestes, échelles, note).
 * Aucune cible, aucune norme, aucune moyenne : seulement ce qui a été noté.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass } from '@/components/glass';
import { StageHero } from '@/components/stage/StageHero';
import { Text } from '@/components/ui';
import { DayBars } from '@/features/quickTrack/DayBars';
import { HmEmpty, HmFixTray, HmRow, TABULAR } from '@/features/homeTrack/kit';
import { t as tr } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import { lastDays, nightFix, nightsByDay, nightsKnown, urlDay } from '@/lib/domain/careTrack';
import { formatDuration, todayISO } from '@/lib/domain/dates';
import { nightLabel, nightMinutes, timeOfIso } from '@/lib/domain/parentSleep';
import type { ParentSleepLog } from '@/lib/types-sleep';
import { radius, spacing } from '@/theme/tokens';

const range = (l: ParentSleepLog) => (l.bedtime && l.wake_time ? `${timeOfIso(l.bedtime)} → ${timeOfIso(l.wake_time)}` : null);
const wakings = (l: ParentSleepLog) => tr('ct.sleep.wakings', { count: l.night_wakings ?? 0 });

export function MySleepTrack({ logs, onFullForm }: { logs: readonly ParentSleepLog[]; onFullForm: (l: ParentSleepLog | null, day: string) => void }) {
  const params = useLocalSearchParams<{ day?: string; night?: string }>();
  const today = todayISO();
  const day = urlDay(params.day, today);
  const days = useMemo(() => nightsByDay(logs, lastDays(today, 7)), [logs, today]);
  const sel = days.find((d) => d.day === day) ?? { day, log: logs.find((l) => l.log_date === day) ?? null, minutes: null };
  const log = sel.log;
  const minutes = log ? nightMinutes(log) : null;
  const k = nightsKnown(days);
  const opened = params.night ? logs.find((l) => l.id === params.night) ?? null : null;
  const isLast = day === today;
  return (
    <View style={{ gap: spacing.sm }} testID="ct-sleep">
      {log ? (
        <StageHero testID="ct-sleep-hero" eyebrow={isLast ? tr('ct.sleep.lastNight') : nightLabel(day)}
          value={minutes != null ? formatDuration(minutes) : '—'}
          caption={minutes != null ? tr('ct.sleep.sleptLabel') : tr('ct.sleep.noDuration')}
          detail={[range(log), wakings(log)].filter(Boolean).join(' · ')}
          a11y={`${isLast ? tr('ct.sleep.lastNight') : nightLabel(day)}. ${minutes != null ? formatDuration(minutes) : tr('ct.sleep.noDuration')}. ${[range(log), wakings(log)].filter(Boolean).join(', ')}`} />
      ) : (
        <HmEmpty testID="ct-sleep-none" label={isLast ? tr('ct.sleep.noneLast') : tr('ct.sleep.noneNight', { night: nightLabel(day) })} />
      )}
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="ct-sleep-week">
        <Text variant="label" accessibilityRole="header">{tr('ct.sleep.weekTitle')}</Text>
        <DayBars testID="ct-sleep-bars" days={days.map((d) => ({ day: d.day, value: d.minutes }))} selected={day} minMax={6 * 60}
          onSelect={(d) => router.setParams({ day: d === today ? undefined : d, night: undefined } as never)}
          describe={(d) => (d.value != null ? formatDuration(d.value) : tr('ct.nothing'))} />
        <Text variant="caption" muted style={TABULAR} testID="ct-sleep-known">
          {[tr('ct.sleep.known', { count: k.known }), k.wakings != null ? tr('ct.sleep.wakingsWeek', { count: k.wakings }) : null].filter(Boolean).join(' · ')}
        </Text>
        {log ? (
          <HmRow time={log.wake_time ? timeOfIso(log.wake_time) : null} icon="moon" title={nightLabel(log.log_date)}
            detail={[minutes != null ? formatDuration(minutes) : tr('ct.sleep.noDuration'), range(log), wakings(log)].filter(Boolean).join(' · ')}
            testID="ct-sleep-row" a11y={`${nightLabel(log.log_date)}. ${minutes != null ? formatDuration(minutes) : tr('ct.sleep.noDuration')}. ${tr('ct.openToFix')}`}
            onPress={() => router.setParams({ night: log.id } as never)} />
        ) : (
          <HmRow icon="plus" title={tr('ct.sleep.addThis')} detail={nightLabel(day)} testID="ct-sleep-add" onPress={() => onFullForm(null, day)} />
        )}
      </Glass>
      {opened ? <NightTray log={opened} onClose={() => router.setParams({ night: undefined } as never)} onFullForm={() => onFullForm(opened, opened.log_date)} /> : null}
    </View>
  );
}

function NightTray({ log, onClose, onFullForm }: { log: ParentSleepLog; onClose: () => void; onFullForm: () => void }) {
  const edit = useCareEdit('parent_sleep_logs');
  const m = nightMinutes(log);
  const err = (r: 'time' | 'same' | 'wakings') => tr(r === 'wakings' ? 'ct.sleep.badWakings' : r === 'same' ? 'ct.sleep.sameTimes' : 'ct.sleep.badTime');
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="ct-sleep-tray"
      title={nightLabel(log.log_date)} hero={m != null ? formatDuration(m) : tr('ct.sleep.noDuration')}
      lines={[range(log), wakings(log), log.duration_edited ? tr('ct.sleep.durationTyped') : null, log.note ? tr('ct.note', { note: log.note }) : null]}
      editLabel={tr('ct.fix')} editTitle={tr('ct.sleep.fixTitle')} onFullForm={onFullForm}
      fields={[
        { key: 'bed', label: tr('ct.sleep.bed'), kind: 'time' },
        { key: 'wake', label: tr('ct.sleep.wake'), kind: 'time', hint: tr('ct.sleep.recomputeHint') },
        { key: 'wakings', label: tr('ct.sleep.wakingsField'), kind: 'number', step: 1 },
      ]}
      initial={{ bed: timeOfIso(log.bedtime), wake: timeOfIso(log.wake_time), wakings: String(log.night_wakings ?? 0) }}
      validate={(d) => { const r = nightFix(log, d as { bed: string; wake: string; wakings: string }); return r.ok ? null : err(r.reason); }}
      onSave={async (d) => {
        const r = nightFix(log, d as { bed: string; wake: string; wakings: string });
        if (!r.ok) return err(r.reason);
        const res = await edit(log.id, r.patch, log as unknown as Record<string, unknown>);
        return res === 'changed' ? tr('ct.changedMeanwhile') : 'ok';
      }} />
  );
}
