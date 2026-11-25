/**
 * Sélecteur d'heure intégré aux champs « heure » (25/11/2026, retour iPhone « sélecteur d'heure dans toutes les saisies ») :
 * un appui sur l'horloge → les heures, puis les minutes (pas de 5) ; « Maintenant » en un geste. Le texte reste modifiable.
 * Format rendu : celui du champ (« 14:30 » ou « 14h30 » si l'exemple du champ utilise « h »).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Tappable } from './Tappable';
import { Text } from './ui';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Champ heure reconnu à son exemple : « 14:30 », « 14h », « 15h30 », « 7:30am », « HH:MM ». Une DURÉE se déclare avec time={false}. */
export const isTimePlaceholder = (p: unknown): boolean => typeof p === 'string' && /^(\d{1,2}:\d{2}\s*(am|pm)?|\d{1,2}h(\d{2})?|hh:mm)$/i.test(p.trim());

export function formatClock(h: number, m: number, sep: ':' | 'h' = ':'): string {
  return `${String(h).padStart(2, '0')}${sep}${String(m).padStart(2, '0')}`;
}

/** Heure lue dans le texte du champ (« 7h », « 07:30 », « 19 h 45 »), sinon null. */
export function parseClock(v: string): { h: number; m: number } | null {
  const r = /^\s*(\d{1,2})\s*[:hH.]?\s*(\d{2})?\s*$/.exec(v ?? '');
  if (!r) return null;
  const h = Number(r[1]); const m = Number(r[2] ?? 0);
  return h <= 23 && m <= 59 ? { h, m } : null;
}

export function InlineClock({ value, sep = ':', onPick, testID = 'inline-clock' }: { value: string; sep?: ':' | 'h'; onPick: (text: string) => void; testID?: string }) {
  const th = useTheme();
  const cur = parseClock(value);
  const [hour, setHour] = useState<number | null>(null);
  const cell = (label: string, selected: boolean, onPress: () => void, id: string) => (
    <Tappable key={id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={label} onPress={onPress} testID={`${testID}-${id}`}
      style={{ width: '15.2%', minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md,
        backgroundColor: selected ? th.tokens.action.fill : th.colors.surface, borderWidth: 1, borderColor: th.colors.border }}>
      <Text weight={selected ? 'bold' : 'medium'} color={selected ? th.tokens.action.text : th.colors.text}>{label}</Text>
    </Tappable>
  );
  const now = () => { const d = new Date(); onPick(formatClock(d.getHours(), d.getMinutes(), sep)); };
  return (
    <View testID={testID} style={{ gap: spacing.xs, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: th.colors.border, backgroundColor: th.colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" weight="bold">{hour == null ? tr('clock.hour') : tr('clock.minute', { h: String(hour).padStart(2, '0') })}</Text>
        <Tappable accessibilityRole="button" onPress={hour == null ? now : () => setHour(null)} testID={`${testID}-${hour == null ? 'now' : 'back'}`} style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.xs }}>
          <Text variant="small" weight="bold" color={th.colors.primary}>{hour == null ? tr('clock.now') : tr('clock.back')}</Text>
        </Tappable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between' }}>
        {hour == null
          ? Array.from({ length: 24 }, (_, h) => cell(String(h).padStart(2, '0'), cur?.h === h, () => setHour(h), `h${h}`))
          : Array.from({ length: 12 }, (_, i) => i * 5).map((m) => cell(`:${String(m).padStart(2, '0')}`, cur?.h === hour && cur?.m === m, () => { onPick(formatClock(hour, m, sep)); setHour(null); }, `m${m}`))}
      </View>
    </View>
  );
}
