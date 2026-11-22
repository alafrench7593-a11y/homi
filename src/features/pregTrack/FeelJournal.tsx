/**
 * « Comment je me sens » — journal daté (22/11/2026). Lit les MÊMES notes que le formulaire (`pregnancy_symptom_logs`) :
 *  · sept jours : une barre par jour (notes du jour), jour sans note = pointillés « rien de noté », jamais 0 ;
 *    jour choisi gardé dans l'adresse (`?day=`) ;
 *  · liste du jour : heure en colonne, symptôme · intensité, note, chevron ;
 *  · fiche (Tray) : symptôme en grand, intensité, heure de début, note ; « Corriger » = valeurs PROVISOIRES (intensité,
 *    heure de début, note), Annuler, Enregistrer verrouillé contre le double appui, brouillon conservé si échec ;
 *    « Formulaire complet » reprend la note dans le formulaire ; « Supprimer » après confirmation.
 * Aucune interprétation : les repères affichés après l'enregistrement restent ceux du formulaire.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Chip, Field, haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useSaveSymptoms, type PregnancySymptomLog } from '@/lib/data/hooks-care';
import { useNow } from '@/lib/data/hooks-bottle';
import { isoDay } from '@/lib/domain/journalTrack';
import { entriesByDay } from '@/lib/domain/pregTrack';
import { hhmm, proposedTime } from '@/lib/domain/quickTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { DayBars } from '@/features/quickTrack/DayBars';
import { EditActions, EditHeader, EntryTray, HERO, TABULAR, useGuardedSave } from '@/features/quickTrack/EntryTray';

const symLabel = (k: string) => tr(`care.sym.${k}` as TKey);
const intLabel = (n: number | null) => (n ? tr(`care.feel.int${n}` as TKey) : null);
/** Instant d'une note : l'heure de début si elle a été donnée, sinon l'heure d'enregistrement. */
export const feelAt = (l: Pick<PregnancySymptomLog, 'started_at' | 'logged_at'>) => l.started_at ?? l.logged_at;

export function FeelJournal({ logs, onFullEdit, onDelete }: {
  logs: PregnancySymptomLog[];
  onFullEdit: (l: PregnancySymptomLog) => void;
  onDelete: (l: PregnancySymptomLog) => Promise<void> | void;
}) {
  const t = useTheme();
  const now = useNow(60_000);
  const p = useLocalSearchParams<{ day?: string }>();
  const days = useMemo(() => entriesByDay(logs, feelAt, now, 7), [logs, now]);
  const selDay = days.find((d) => d.day === p.day)?.day ?? isoDay(now);
  const sel = days.find((d) => d.day === selDay)!;
  const [openId, setOpenId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const selected = logs.find((l) => l.id === openId) ?? null;
  const open = (id: string) => { haptic('selection'); setOpenId(id); setVisible(true); };
  const older = logs.filter((l) => !days.some((d) => d.day === isoDay(new Date(feelAt(l))))).slice(0, 20);
  return (
    <View style={{ gap: spacing.sm }} testID="feel-journal">
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }}>
        <Text variant="label">{tr('pg.f.week')}</Text>
        <DayBars testID="feel-bars" days={days.map((d) => ({ day: d.day, value: d.value }))} selected={selDay} minMax={3}
          onSelect={(day) => router.setParams({ day } as never)} describe={(d) => (d.value == null ? tr('pg.none') : tr('pg.f.count', { count: d.value }))} />
        <Text variant="label" testID="feel-day-title">{formatDate(`${selDay}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {sel.rows.length ? sel.rows.map((l) => <FeelRow key={l.id} l={l} onPress={() => open(l.id)} />) : (
          <View testID="feel-day-none" style={{ minHeight: 48, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="small" muted>{tr('pg.none')}</Text>
          </View>
        )}
      </Glass>
      {older.length ? (
        <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID="feel-older">
          <Text variant="label">{tr('pg.f.older')}</Text>
          {older.map((l) => <FeelRow key={l.id} l={l} withDate onPress={() => open(l.id)} />)}
        </Glass>
      ) : null}
      {selected ? (
        <EntryTray open={visible} onOpenChange={setVisible} testID="feel-tray" title={tr('pg.f.trayTitle')}
          hero={symLabel(selected.symptom)}
          lines={[
            [intLabel(selected.intensity), selected.frequency ? tr(`care.feel.freq.${selected.frequency}` as TKey) : null].filter(Boolean).join(' · ') || tr('pg.f.noIntensity'),
            `${formatDate(feelAt(selected), { weekday: 'long', day: 'numeric', month: 'long' })} · ${selected.started_at ? tr('pg.f.startedAt', { time: clock(new Date(selected.started_at)) }) : tr('pg.f.loggedAt', { time: clock(new Date(selected.logged_at)) })}${selected.week_sa != null ? ` · ${tr('care.cal.sa', { w: selected.week_sa })}` : ''}`,
            selected.note ? tr('pg.note', { note: selected.note }) : null,
          ]}
          editLabel={tr('pg.fix')}
          onFullForm={() => onFullEdit(selected)}
          editor={<FeelEdit key={`${selected.id}:${selected.intensity}:${selected.started_at}:${selected.note}`} l={selected} onDelete={async () => { setVisible(false); await onDelete(selected); }} />} />
      ) : null}
    </View>
  );
}

function FeelRow({ l, onPress, withDate }: { l: PregnancySymptomLog; onPress: () => void; withDate?: boolean }) {
  const t = useTheme();
  const at = new Date(feelAt(l));
  const what = [symLabel(l.symptom), intLabel(l.intensity)?.toLowerCase()].filter(Boolean).join(' · ');
  return (
    <Tappable accessibilityRole="button" testID={`feel-row-${l.id}`} onPress={onPress}
      accessibilityLabel={`${withDate ? `${formatDate(at, { weekday: 'long', day: 'numeric', month: 'long' })}, ` : ''}${clock(at)}. ${what}. ${tr('pg.openToFix')}`}
      style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
      <Text weight="bold" style={[{ width: withDate ? 96 : 72 }, TABULAR]}>{withDate ? formatDate(at, { day: 'numeric', month: 'short' }) : clock(at)}</Text>
      <View style={{ flex: 1 }}>
        <Text>{what}</Text>
        {l.note ? <Text variant="caption" muted numberOfLines={1}>{l.note}</Text> : null}
      </View>
      <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
    </Tappable>
  );
}

type Int = '0' | '1' | '2' | '3';

function FeelEdit({ l, onDelete }: { l: PregnancySymptomLog; onDelete: () => Promise<void> }) {
  const t = useTheme();
  const { goBack } = useTray();
  const save = useSaveSymptoms();
  const g = useGuardedSave();
  const int0 = String(l.intensity ?? 0) as Int;
  const time0 = l.started_at ? hhmm(new Date(l.started_at)) : '';
  const [int, setInt] = useState<Int>(int0);
  const [time, setTime] = useState(time0);
  const [note, setNote] = useState(l.note ?? '');
  const startedAt = time.trim() ? proposedTime(l.started_at ?? l.logged_at, time) : null;
  const timeOk = !time.trim() || !!startedAt;
  const changed = int !== int0 || time.trim() !== time0 || note.trim() !== (l.note ?? '');
  const cancel = () => { setInt(int0); setTime(time0); setNote(l.note ?? ''); g.setError(null); goBack(); };
  const submit = () => g.run(async () => {
    if (!timeOk) return tr('qt.edit.badTime');
    await save.mutateAsync({ id: l.id, rows: [{ pregnancy_id: l.pregnancy_id, symptom: l.symptom, intensity: int === '0' ? null : (Number(int) as 1 | 2 | 3), started_at: startedAt ? startedAt.toISOString() : null, frequency: l.frequency, note: note.trim() || null, week_sa: l.week_sa }] });
    haptic('success'); goBack();
    return 'ok';
  });
  const label = (v: Int) => (v === '0' ? tr('pg.f.noIntensity') : tr(`care.feel.int${v}` as TKey));
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="feel-editor">
      <EditHeader title={tr('pg.f.fixTitle')} />
      <Text testID="feel-edit-hero" maxFontSizeMultiplier={1.3} style={[HERO, { fontSize: 36, lineHeight: 42, color: t.colors.text, textAlign: 'center' }]}>{symLabel(l.symptom)}</Text>
      <Text weight="bold" center testID="feel-edit-proposed" accessibilityLiveRegion="polite">
        {changed ? tr('pg.f.proposed', { what: label(int) }) : tr('pg.f.recorded', { what: label(int0) })}
      </Text>
      <Text variant="label">{tr('care.feel.intensity')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup" testID="feel-edit-int">
        {(['0', '1', '2', '3'] as Int[]).map((v) => <Chip key={v} label={label(v)} selected={int === v} onPress={() => { haptic('selection'); setInt(v); g.setError(null); }} testID={`feel-edit-int-${v}`} />)}
      </View>
      <Field label={tr('care.feel.start')} optional value={time} onChangeText={(v) => { setTime(v); g.setError(null); }} placeholder="08:30" keyboardType="numbers-and-punctuation" maxLength={5}
        error={timeOk ? undefined : tr('qt.edit.badTime')} testID="feel-edit-time" />
      <Field label={tr('care.feel.note')} optional value={note} onChangeText={(v) => { setNote(v); g.setError(null); }} maxLength={1000} multiline testID="feel-edit-note" />
      <EditActions onCancel={cancel} onSave={submit} canSave={changed && timeOk} busy={g.busy} error={g.error} testID="feel-edit" />
      <GlassButton variant="tertiary" icon="trash-2" label={tr('pg.delete')} testID={`feel-delete-${l.id}`} disabled={g.busy} onPress={() => void onDelete()} />
    </View>
  );
}
