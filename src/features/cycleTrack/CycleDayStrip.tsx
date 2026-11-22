/**
 * Bande de 7 jours des journaux du cycle (22/11/2026). Deux formes, même geste :
 *  · `marks` (journal du jour) : un point par saisie (jusqu'à 3) ; jour sans saisie = petit bloc en pointillés
 *    « rien de noté », JAMAIS un zéro ;
 *  · `scale` (échelle d'intensité) : une barre par jour proportionnelle à la valeur notée ; une valeur 0 notée = trait
 *    plein au ras de l'axe ; jour sans valeur = pointillés.
 * Le jour choisi porte une bulle de valeur et un repère vertical pointillé ; il reste perceptible sans couleur (bord
 * épais, chiffre en gras, état « sélectionné » annoncé). ‹ › décalent la semaine ; jamais au-delà d'aujourd'hui.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import type { StripDay } from '@/lib/domain/cycleTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const BAR_H = 64;
const BUBBLE_H = 30;

export function CycleDayStrip({ days, selected, onSelect, onShift, canForward, mode, max = 10, bubbleOf, describe, testID }: {
  days: StripDay[];
  selected: string;
  onSelect: (day: string) => void;
  /** Décale la semaine affichée (−7 / +7 jours) */
  onShift: (delta: -7 | 7) => void;
  canForward: boolean;
  mode: 'marks' | 'scale';
  max?: number;
  /** Texte de la bulle du jour choisi (« 6/10 », « 2 notes », « Rien de noté ») */
  bubbleOf: (d: StripDay) => string;
  /** Texte lu pour un jour */
  describe: (d: StripDay) => string;
  testID: string;
}) {
  const t = useTheme();
  const [rowW, setRowW] = useState(0);
  const [bubbleW, setBubbleW] = useState(0);
  const idx = days.findIndex((d) => d.day === selected);
  const sel = idx >= 0 ? days[idx] : null;
  const cellW = rowW / Math.max(1, days.length);
  const center = idx >= 0 ? cellW * idx + cellW / 2 : 0;
  const left = Math.max(0, Math.min(rowW - bubbleW, center - bubbleW / 2));
  const range = days.length ? `${formatDate(`${days[0].day}T12:00:00`, { day: 'numeric', month: 'short' })} – ${formatDate(`${days[days.length - 1].day}T12:00:00`, { day: 'numeric', month: 'short' })}` : '';
  const arrow = (delta: -7 | 7) => {
    const off = delta > 0 && !canForward;
    return (
      <Tappable accessibilityRole="button" accessibilityLabel={delta < 0 ? tr('cy.tk.strip.prev') : tr('cy.tk.strip.next')} accessibilityState={{ disabled: off }} disabled={off}
        testID={`${testID}-${delta < 0 ? 'prev' : 'next'}`} onPress={() => { haptic('selection'); onShift(delta); }}
        style={({ pressed }) => ({ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.3 : pressed ? 0.6 : 1 })}>
        <Icon name={delta < 0 ? 'chevron-left' : 'chevron-right'} size={20} color={t.colors.text} />
      </Tappable>
    );
  };
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {arrow(-7)}
        <Text variant="small" weight="medium" center style={[{ flex: 1 }, TABULAR]} testID={`${testID}-range`}>{range}</Text>
        {arrow(7)}
      </View>
      <View onLayout={(e) => setRowW(e.nativeEvent.layout.width)}>
        {/* Bulle de valeur au-dessus du jour choisi + repère vertical pointillé */}
        <View style={{ height: BUBBLE_H + 6 }}>
          {sel && rowW ? (
            <>
              <View onLayout={(e) => setBubbleW(e.nativeEvent.layout.width)} testID={`${testID}-bubble`}
                style={{ position: 'absolute', left, top: 0, height: BUBBLE_H, paddingHorizontal: 10, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
                <Text variant="small" weight="bold" style={TABULAR} numberOfLines={1}>{bubbleOf(sel)}</Text>
              </View>
              <View style={{ position: 'absolute', left: center - 0.75, top: BUBBLE_H, height: 6, borderLeftWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted }} />
            </>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {days.map((d) => {
            const on = d.day === selected;
            return (
              <Tappable key={d.day} accessibilityRole="button" accessibilityState={{ selected: on }} testID={`${testID}-${d.day}`}
                accessibilityLabel={`${formatDate(`${d.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })} : ${describe(d)}`}
                onPress={() => { haptic('selection'); onSelect(d.day); }}
                style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 4, minHeight: MIN_TOUCH, opacity: pressed ? 0.7 : 1 })}>
                {mode === 'scale' ? <ScaleBar d={d} on={on} max={max} testID={`${testID}-${d.day}`} /> : <Marks d={d} on={on} testID={`${testID}-${d.day}`} />}
                <Text variant="caption" muted={!on} weight={on ? 'bold' : undefined}>{formatDate(`${d.day}T12:00:00`, { weekday: 'narrow' })}</Text>
                <View style={{ minWidth: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2 : 0, borderColor: t.colors.text }}>
                  <Text variant="small" weight={on ? 'bold' : undefined} style={TABULAR}>{String(+d.day.slice(8, 10))}</Text>
                </View>
              </Tappable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Marks({ d, on, testID }: { d: StripDay; on: boolean; testID: string }) {
  const t = useTheme();
  if (d.count == null) {
    return <View testID={`${testID}-u`} style={{ width: 22, height: 12, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted, opacity: on ? 1 : 0.6, marginBottom: 2 }} />;
  }
  const n = Math.min(3, d.count);
  return (
    <View testID={`${testID}-k`} style={{ flexDirection: 'row', gap: 3, height: 14, alignItems: 'center' }}>
      {Array.from({ length: n }, (_, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.colors.text, opacity: on ? 1 : 0.6 }} />)}
      {d.count > 3 ? <Text variant="caption" weight="bold">+</Text> : null}
    </View>
  );
}

function ScaleBar({ d, on, max, testID }: { d: StripDay; on: boolean; max: number; testID: string }) {
  const t = useTheme();
  return (
    <View style={{ height: BAR_H, width: '62%', justifyContent: 'flex-end' }}>
      {d.value == null ? (
        <View testID={`${testID}-u`} style={{ height: 14, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted, opacity: on ? 1 : 0.6 }} />
      ) : (
        <View testID={`${testID}-k`} style={{ height: d.value <= 0 ? 3 : Math.max(6, Math.round((d.value / Math.max(1, max)) * BAR_H)), borderRadius: 6, backgroundColor: t.colors.text, opacity: on ? 1 : 0.5, borderWidth: on && d.value > 0 ? 2 : 0, borderColor: t.colors.primary }} />
      )}
    </View>
  );
}
