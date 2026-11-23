/**
 * Petites saisies communes aux outils de suivi (moment daté, échelle de douleur 0–10) : mêmes composants partout
 * (Field, Chip), aucune couleur propre. Utilisés par le mode embrouille, les moments à deux, la rééducation, la
 * cicatrisation, le stock de lait, les difficultés d'allaitement.
 */
import React from 'react';
import { View } from 'react-native';
import { Chip, Field, Row, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';

export interface WhenValue { date: string; time: string }
const pad = (n: number) => String(n).padStart(2, '0');

/** Valeur initiale : un instant (ou maintenant) → date JJ/MM/AAAA et heure HH:MM locales. */
export function whenOf(iso?: string | null): WhenValue {
  const d = iso ? new Date(iso) : new Date();
  return { date: toFrDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

/** Date et heure saisies → instant ISO ; null si illisible. Sans heure (`withTime` faux) : midi. */
export function whenToIso(v: WhenValue, withTime = true): string | null {
  const day = frToISO(v.date);
  if (!day) return null;
  const m = withTime ? v.time.trim().match(/^([01]?\d|2[0-3])[h:.]?([0-5]\d)?$/) : null;
  if (withTime && !m) return null;
  const [y, mo, d] = day.split('-').map(Number);
  const at = new Date(y, mo - 1, d, m ? Number(m[1]) : 12, m ? Number(m[2] ?? 0) : 0, 0, 0);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}
/** AAAA-MM-JJ de la date saisie (ou null). */
export const whenDay = (v: WhenValue) => frToISO(v.date);

export function WhenFields({ value, onChange, withTime = true, days = 'future', testID, dateLabel, timeLabel }: {
  value: WhenValue; onChange: (v: WhenValue) => void; withTime?: boolean; days?: 'future' | 'past'; testID?: string; dateLabel?: string; timeLabel?: string;
}) {
  const today = todayISO();
  const quick = days === 'future'
    ? [{ k: 'today', l: tr('care.when.today'), d: today }, { k: 'tomorrow', l: tr('care.when.tomorrow'), d: addDays(today, 1) }, { k: 'after', l: tr('care.when.afterTomorrow'), d: addDays(today, 2) }]
    : [{ k: 'today', l: tr('care.when.today'), d: today }, { k: 'yesterday', l: tr('care.when.yesterday'), d: addDays(today, -1) }];
  return (
    <View style={{ gap: spacing.xs }}>
      <Row wrap>
        {quick.map((q) => <Chip key={q.k} label={q.l} selected={frToISO(value.date) === q.d} onPress={() => onChange({ ...value, date: toFrDate(q.d) })} testID={testID ? `${testID}-${q.k}` : undefined} />)}
      </Row>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 3 }}>
          <Field label={dateLabel ?? tr('care.when.date')} value={value.date} onChangeText={(date) => onChange({ ...value, date })} keyboardType="numbers-and-punctuation"
            placeholder={tr('care.when.datePh')} testID={testID ? `${testID}-date` : undefined} />
        </View>
        {withTime ? (
          <View style={{ flex: 2 }}>
            <Field label={timeLabel ?? tr('care.when.time')} value={value.time} onChangeText={(time) => onChange({ ...value, time })} keyboardType="numbers-and-punctuation"
              placeholder={tr('care.when.timePh')} testID={testID ? `${testID}-time` : undefined} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Échelle 0–10 : une pastille par valeur ; « non noté » possible (appui sur la valeur choisie). */
export function PainScale({ value, onChange, label, testID }: { value: number | null; onChange: (v: number | null) => void; label?: string; testID?: string }) {
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <Text variant="label">{label ?? tr('care.pain.label')}</Text>
      <Row wrap gap={spacing.xs}>
        {Array.from({ length: 11 }, (_, n) => (
          <Chip key={n} label={String(n)} selected={value === n} onPress={() => onChange(value === n ? null : n)} accessibilityLabel={tr('care.pain.a11y', { n })}
            testID={testID ? `${testID}-${n}` : undefined} />
        ))}
      </Row>
      <Text variant="caption" muted>{tr('care.pain.hint')}</Text>
    </View>
  );
}
