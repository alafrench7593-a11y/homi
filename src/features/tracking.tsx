/** Saisie rapide et chronologie du suivi quotidien. */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Chip, Field, Icon, type IconName, Row, Text } from '@/components/ui';
import { formatDuration, formatTime } from '@/lib/domain/dates';
import type { Bottle, Breastfeed, Diaper, LogKind, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export const KIND_META: Record<LogKind, { label: string; icon: IconName; tracking: string }> = {
  bottle: { label: 'Biberon', icon: 'coffee', tracking: 'bottle' },
  breastfeed: { label: 'Tétée', icon: 'droplet', tracking: 'breastfeed' },
  pumping: { label: 'Tire-lait', icon: 'droplet', tracking: 'breastfeed' },
  diaper: { label: 'Couche', icon: 'wind', tracking: 'diaper' },
  sleep: { label: 'Sommeil', icon: 'moon', tracking: 'sleep' },
  meal: { label: 'Repas', icon: 'feather', tracking: 'meal' },
  observation: { label: 'Santé & notes', icon: 'thermometer', tracking: 'any' },
};

/** Choix de l'heure : maintenant, il y a X min, ou une heure précise (aujourd'hui / hier). */
export function TimePicker({ value, onChange, label = 'Heure' }: { value: Date; onChange: (d: Date) => void; label?: string }) {
  const [custom, setCustom] = useState('');
  const [yesterday, setYesterday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const presets = [{ l: 'Maintenant', m: 0 }, { l: '−15 min', m: 15 }, { l: '−30 min', m: 30 }, { l: '−1 h', m: 60 }, { l: '−2 h', m: 120 }];
  const applyCustom = (text: string, y = yesterday) => {
    setCustom(text);
    const m = text.match(/^(\d{1,2})[h:.]?(\d{2})?$/);
    if (!m) return setError(text ? 'Format attendu : 14h30' : null);
    const h = Number(m[1]);
    const min = Number(m[2] ?? 0);
    if (h > 23 || min > 59) return setError('Heure invalide.');
    const d = new Date();
    d.setHours(h, min, 0, 0);
    if (y) d.setDate(d.getDate() - 1);
    if (d.getTime() > Date.now() + 60_000) return setError('Cette heure est dans le futur.');
    setError(null);
    onChange(d);
  };
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label} : {formatTime(value)}{value.toDateString() !== new Date().toDateString() ? ' (hier)' : ''}</Text>
      <Row wrap>
        {presets.map((p) => (
          <Chip key={p.l} label={p.l} selected={!custom && Math.abs(Date.now() - p.m * 60000 - value.getTime()) < 90_000} onPress={() => { setCustom(''); setError(null); onChange(new Date(Date.now() - p.m * 60000)); }} />
        ))}
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Field label="Ou une heure précise" placeholder="14h30" value={custom} onChangeText={(v) => applyCustom(v)} error={error} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={{ paddingTop: 26 }}>
          <Chip label="Hier" selected={yesterday} onPress={() => { setYesterday(!yesterday); if (custom) applyCustom(custom, !yesterday); }} />
        </View>
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
        <Pressable accessibilityRole="button" accessibilityLabel={`Diminuer de ${step} ${unit}`} onPress={() => onChange(Math.max(0, (value ?? 0) - step))} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="minus" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={`${label} : ${value ?? 0} ${unit}`} accessibilityLiveRegion="polite">
          <Text variant="title">{value ?? 0}</Text>
          <Text variant="caption" muted>{unit}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Augmenter de ${step} ${unit}`} onPress={() => onChange((value ?? 0) + step)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" />
        </Pressable>
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
      return [b.consumed_ml != null ? `${b.consumed_ml} ml bus` : null, b.prepared_ml != null ? `${b.prepared_ml} ml préparés` : null, b.milk_type].filter(Boolean).join(' · ') || 'Biberon';
    }
    case 'breastfeed': {
      const f = l.data;
      const side = { left: 'gauche', right: 'droit', both: 'les deux côtés' }[f.side];
      return `Sein ${side} · ${f.ended_at ? formatDuration(minutesBetween(f.started_at, f.ended_at)) : 'en cours'}`;
    }
    case 'pumping': return `${l.data.amount_ml} ml tirés`;
    case 'diaper': return [l.data.wet ? 'Mouillée' : null, l.data.stool ? 'Selles' : null].filter(Boolean).join(' + ') || 'Change';
    case 'sleep': {
      const s = l.data;
      return s.ended_at ? `${formatDuration(minutesBetween(s.started_at, s.ended_at))}${s.wakeups ? ` · ${s.wakeups} réveil(s)` : ''}` : 'En cours';
    }
    case 'meal': return l.data.description || l.data.foods.join(', ') || 'Repas';
    case 'observation': {
      const o = l.data;
      const prefix = { temperature: 'Température', medication: 'Traitement prescrit', symptom: 'Symptôme observé', note: 'Note' }[o.kind];
      const value = o.kind === 'temperature' && o.value_num != null ? `${String(o.value_num).replace('.', ',')} °C` : o.label ?? o.note ?? '';
      return value ? `${prefix} · ${value}` : prefix;
    }
  }
}

export function Timeline({ logs, childId }: { logs: LogItem[]; childId: string }) {
  const t = useTheme();
  const sorted = useMemo(() => [...logs].sort((a, b) => logTime(b).localeCompare(logTime(a))), [logs]);
  if (!sorted.length) {
    return <Text muted center style={{ paddingVertical: spacing.lg }}>Rien d’enregistré pour l’instant aujourd’hui.</Text>;
  }
  return (
    <View style={{ gap: 2 }}>
      {sorted.map((l) => (
        <Pressable
          key={`${l.type}-${l.data.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${KIND_META[l.type].label} à ${formatTime(logTime(l))} : ${describeLog(l)}. Modifier ou supprimer.`}
          onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: l.type, child: childId, id: l.data.id } })}
          style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: 10, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent' })}
        >
          <Text variant="small" muted style={{ width: 46 }}>{formatTime(logTime(l))}</Text>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={KIND_META[l.type].icon} size={16} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="medium">{KIND_META[l.type].label}</Text>
            <Text variant="small" muted numberOfLines={1}>{describeLog(l)}</Text>
          </View>
          <Icon name="edit-2" size={14} color={t.colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}
