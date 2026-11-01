/** Saisie rapide et chronologie du suivi quotidien. */
import { STOOL_COLORS, STOOL_CONSISTENCY } from '@/lib/domain/childCare';
import { useRecorderLabel } from '@/lib/data/hooks-bottle';
import { useHouseholdMembers } from '@/lib/data/hooks';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Chip, Field, Icon, type IconName, Row, Text } from '@/components/ui';
import { formatDuration, formatTime } from '@/lib/domain/dates';
import type { Bottle, Breastfeed, Diaper, LogKind, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { formatNumber, t as tr } from '@/i18n';

export const KIND_META: Record<LogKind, { label: string; icon: IconName; tracking: string }> = {
  bottle: { get label() { return tr('u5.trk.kind_bottle'); }, icon: 'coffee', tracking: 'bottle' },
  breastfeed: { get label() { return tr('u5.trk.kind_breastfeed'); }, icon: 'droplet', tracking: 'breastfeed' },
  pumping: { get label() { return tr('u5.trk.kind_pumping'); }, icon: 'droplet', tracking: 'breastfeed' },
  diaper: { get label() { return tr('u5.trk.kind_diaper'); }, icon: 'wind', tracking: 'diaper' },
  sleep: { get label() { return tr('u5.trk.kind_sleep'); }, icon: 'moon', tracking: 'sleep' },
  meal: { get label() { return tr('u5.trk.kind_meal'); }, icon: 'feather', tracking: 'meal' },
  observation: { get label() { return tr('u5.trk.kind_observation'); }, icon: 'thermometer', tracking: 'any' },
};

/** Choix de l'heure : maintenant, il y a X min, ou une heure précise (aujourd'hui / hier). */
/**
 * Choix d'une heure. Par défaut : une heure passée (saisie d'un événement).
 * `future` : heure à venir (rappel) ; une heure déjà passée aujourd'hui est lue comme demain.
 */
export function TimePicker({ value, onChange, label = tr('u5.trk.time'), future = false }: { value: Date; onChange: (d: Date) => void; label?: string; future?: boolean }) {
  const [custom, setCustom] = useState('');
  const [yesterday, setYesterday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presets = [{ l: tr('u5.trk.now'), m: 0 }, { l: tr('u5.trk.m15'), m: 15 }, { l: tr('u5.trk.m30'), m: 30 }, { l: tr('u5.trk.h1'), m: 60 }, { l: tr('u5.trk.h2'), m: 120 }];
  const applyCustom = (text: string, y = yesterday) => {
    setCustom(text);
    const m = text.match(/^(\d{1,2})[h:.]?(\d{2})?$/);
    if (!m) return setError(text ? tr('u5.trk.fmt') : null);
    const h = Number(m[1]);
    const min = Number(m[2] ?? 0);
    if (h > 23 || min > 59) return setError(tr('u5.trk.invalid'));
    const d = new Date();
    d.setHours(h, min, 0, 0);
    if (future) {
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
      setError(null);
      return onChange(d);
    }
    if (y) d.setDate(d.getDate() - 1);
    if (d.getTime() > Date.now() + 60_000) return setError(tr('u5.trk.future'));
    setError(null);
    onChange(d);
  };
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label} : {formatTime(value)}{value.toDateString() !== new Date().toDateString() ? (value.getTime() > Date.now() ? ` (${tr('u5.trk.tomorrow')})` : ` (${tr('u5.trk.yesterday_p')})`) : ''}</Text>
      {future ? null : <Row wrap>
        {presets.map((p) => (
          <Chip key={p.l} label={p.l} selected={!custom && Math.abs(Date.now() - p.m * 60000 - value.getTime()) < 90_000} onPress={() => { setCustom(''); setError(null); onChange(new Date(Date.now() - p.m * 60000)); }} />
        ))}
      </Row>}
      <Row>
        <View style={{ flex: 1 }}>
          <Field label={future ? tr('u5.trk.exact') : tr('u5.trk.or_exact')} placeholder={tr('u5.trk.ph')} value={custom} onChangeText={(v) => applyCustom(v)} error={error} keyboardType="numbers-and-punctuation" />
        </View>
        {future ? null : (
          <View style={{ paddingTop: 26 }}>
            <Chip label={tr('u5.trk.yesterday')} selected={yesterday} onPress={() => { setYesterday(!yesterday); if (custom) applyCustom(custom, !yesterday); }} />
          </View>
        )}
      </Row>
    </View>
  );
}

export function Stepper({ label, value, onChange, step = 10, unit = 'ml', presets }: { label: string; value: number | null; onChange: (v: number | null) => void; step?: number; unit?: string; presets?: number[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label}</Text>
      <Row>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('u5.trk.dec', { step, unit })} onPress={() => onChange(Math.max(0, (value ?? 0) - step))} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="minus" />
        </Tappable>
        <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={tr('u5.trk.value_a11y', { label, value: value ?? 0, unit })} accessibilityLiveRegion="polite">
          <Text variant="title">{value ?? 0}</Text>
          <Text variant="caption" muted>{unit}</Text>
        </View>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('u5.trk.inc', { step, unit })} onPress={() => onChange((value ?? 0) + step)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" />
        </Tappable>
      </Row>
      {presets && (
        <Row wrap style={{ justifyContent: 'center' }}>
          {presets.map((p) => <Chip key={p} label={`${p}`} selected={value === p} onPress={() => onChange(p)} />)}
        </Row>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- Chronologie
export type LogItem =
  | { type: 'bottle'; data: Bottle } | { type: 'breastfeed'; data: Breastfeed } | { type: 'pumping'; data: Pumping }
  | { type: 'diaper'; data: Diaper } | { type: 'sleep'; data: Sleep } | { type: 'meal'; data: Meal } | { type: 'observation'; data: Observation };

export function logTime(l: LogItem): string {
  return 'at' in l.data ? l.data.at : l.data.started_at;
}

const minutesBetween = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 60000;

export function describeLog(l: LogItem): string {
  switch (l.type) {
    case 'bottle': {
      const b = l.data;
      return [b.consumed_ml != null ? tr('u5.trk.drunk', { ml: b.consumed_ml }) : null, b.prepared_ml != null ? tr('u5.trk.prepared', { ml: b.prepared_ml }) : null, b.milk_type].filter(Boolean).join(' · ') || KIND_META.bottle.label;
    }
    case 'breastfeed': {
      const f = l.data;
      const side = { left: tr('u5.trk.left'), right: tr('u5.trk.right'), both: tr('u5.trk.both') }[f.side];
      return tr('u5.trk.breast', { side, state: f.ended_at ? formatDuration(minutesBetween(f.started_at, f.ended_at)) : tr('u5.trk.ongoing') });
    }
    case 'pumping': return tr('u5.trk.pumped', { ml: l.data.amount_ml });
    case 'diaper': {
      const d = l.data;
      const color = d.stool_color ? STOOL_COLORS.find((c) => c.value === d.stool_color)?.label.toLowerCase() : null;
      const cons = d.stool_consistency ? STOOL_CONSISTENCY.find((c) => c.value === d.stool_consistency)?.label.toLowerCase() : null;
      const stool = d.stool ? [tr('u5.trk.stool'), color, cons, d.blood_seen ? tr('u5.trk.blood') : null].filter(Boolean).join(' ') : null;
      return [d.wet ? tr('u5.trk.wet') : null, stool].filter(Boolean).join(' + ') || tr('u5.trk.change');
    }
    case 'sleep': {
      const s = l.data;
      const k = s.kind === 'nap' ? `${tr('u5.trk.nap')} · ` : s.kind === 'night' ? `${tr('u5.trk.night')} · ` : '';
      return s.ended_at ? `${k}${formatDuration(minutesBetween(s.started_at, s.ended_at))}${s.wakeups ? ` · ${tr('u5.trk.wakeups', { count: s.wakeups })}` : ''}` : `${k}${tr('u5.trk.in_progress')}`;
    }
    case 'meal': return l.data.description || l.data.foods.join(', ') || KIND_META.meal.label;
    case 'observation': {
      const o = l.data;
      const prefix = { temperature: tr('u5.trk.o_temperature'), medication: tr('u5.trk.o_medication'), symptom: tr('u5.trk.o_symptom'), note: tr('u5.trk.o_note'), vomit: tr('u5.trk.o_vomit'), regurgitation: tr('u5.trk.o_regurgitation'), diarrhea: tr('u5.trk.o_diarrhea'), abdominal_pain: tr('u5.trk.o_abdominal_pain'), bloating: tr('u5.trk.o_bloating'), crying: tr('u5.trk.o_crying') }[o.kind];
      const value = o.kind === 'temperature' && o.value_num != null ? `${formatNumber(o.value_num)} °C` : o.label ?? o.note ?? '';
      return value ? `${prefix} · ${value}` : prefix;
    }
  }
}

export function Timeline({ logs, childId }: { logs: LogItem[]; childId: string }) {
  const t = useTheme();
  // « Qui a noté » : affiché seulement quand plusieurs personnes partagent le foyer
  const recorder = useRecorderLabel();
  const { data: members } = useHouseholdMembers();
  const shared = (members?.length ?? 0) > 1;
  const sorted = useMemo(() => [...logs].sort((a, b) => logTime(b).localeCompare(logTime(a))), [logs]);
  if (!sorted.length) {
    return <Text muted center style={{ paddingVertical: spacing.lg }}>{tr('u5.trk.empty')}</Text>;
  }
  return (
    <View style={{ gap: 2 }}>
      {sorted.map((l) => (
        <Tappable
          key={`${l.type}-${l.data.id}`}
          accessibilityRole="button"
          accessibilityLabel={tr('u5.trk.item_a11y', { kind: KIND_META[l.type].label, time: formatTime(logTime(l)), desc: describeLog(l) })}
          onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: l.type, child: childId, id: l.data.id } })}
          style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: 10, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' })}
        >
          <Text variant="small" muted style={{ width: 46 }}>{formatTime(logTime(l))}</Text>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={KIND_META[l.type].icon} size={16} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="medium">{KIND_META[l.type].label}</Text>
            <Text variant="small" muted>{describeLog(l)}</Text>
            {shared && recorder(l.data.created_by) ? <Text variant="caption" muted>{tr('u5.trk.by', { name: recorder(l.data.created_by) as string })}</Text> : null}
          </View>
          <Icon name="edit-2" size={14} color={t.colors.textMuted} />
        </Tappable>
      ))}
    </View>
  );
}
