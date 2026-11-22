/**
 * Siestes comparées (Victory Native XL 42 sur Skia) : une barre par sieste comparable (de la plus ancienne à la plus
 * récente), puis la session regardée. Pleine = dans la plage ; contour seul = hors plage ; la session regardée porte
 * l'accent. La plage centrale est bordée de deux traits en tirets. Distinguable sans couleur.
 * Doigt posé / glissé : la barre sous le doigt est lue au-dessus du graphique (date, heure, durée) ; aucune
 * interpolation : seules des siestes réellement notées sont dessinées.
 *
 * Web : chargé APRÈS CanvasKit (SkiaHost.web.tsx) ; iOS / Android : Skia natif.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Circle, DashPathEffect, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { CartesianChart, useChartPressState } from 'victory-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export interface NapCompareProps {
  samples: readonly { started_at: string; minutes: number }[];
  current: { started_at: string; minutes: number; label: string };
  low: number | null;
  high: number | null;
  height?: number;
}

export default function NapCompareChart({ samples, current, low, high, height = 150 }: NapCompareProps) {
  const t = useTheme();
  const rows = [...samples].reverse().map((s, i) => ({ i, min: s.minutes, at: s.started_at, current: false }))
    .concat([{ i: samples.length, min: current.minutes, at: current.started_at, current: true }]);
  const { state, isActive } = useChartPressState({ x: 0, y: { min: 0 } });
  const [picked, setPicked] = useState<number | null>(null);
  useAnimatedReaction(() => (state.isActive.value ? state.matchedIndex.value : -1), (v, prev) => { if (v !== prev) scheduleOnRN(setPicked, v >= 0 ? v : null); });
  const shown = picked != null ? rows[picked] : rows[rows.length - 1];
  const inRange = (m: number) => low != null && high != null && m >= low && m <= high;
  const ink = t.colors.text;
  const accent = t.colors.primary;
  return (
    <View style={{ gap: spacing.xs }} testID="nap-compare-chart" accessible accessibilityLabel={rows.map((r) => `${r.current ? current.label : formatDate(r.at, { weekday: 'short', day: 'numeric' })} ${span(r.min)}`).join(', ')}>
      <Text variant="small" weight="bold" style={{ fontVariant: ['tabular-nums'] }} testID="nap-compare-readout">
        {shown ? `${shown.current ? current.label : `${formatDate(shown.at, { weekday: 'short', day: 'numeric' })} · ${clock(new Date(shown.at))}`} · ${span(shown.min)}${shown.current || inRange(shown.min) ? '' : ` · ${tr('nn.facts.outside')}`}` : ''}
      </Text>
      <View style={{ height }}>
        <CartesianChart data={rows} xKey="i" yKeys={['min']} chartPressState={state} domain={{ y: [0, Math.max(...rows.map((r) => r.min), high ?? 0) * 1.15] }} domainPadding={{ left: 22, right: 22, top: 8 }}>
          {({ points, chartBounds, yScale }) => {
            const w = Math.max(8, Math.min(28, ((chartBounds.right - chartBounds.left) / rows.length) * 0.55));
            return (
              <>
                {low != null && high != null ? [low, high].map((v) => (
                  <Line key={v} p1={vec(chartBounds.left, yScale(v))} p2={vec(chartBounds.right, yScale(v))} color={accent} strokeWidth={1.5}>
                    <DashPathEffect intervals={[5, 4]} />
                  </Line>
                )) : null}
                {points.min.map((p, k) => {
                  const r = rows[k];
                  const top = p.y ?? chartBounds.bottom;
                  const sel = isActive && picked === k;
                  const filled = r.current || inRange(r.min);
                  return (
                    <React.Fragment key={k}>
                      <RoundedRect x={p.x - w / 2} y={top} width={w} height={Math.max(2, chartBounds.bottom - top)} r={6}
                        color={r.current ? accent : ink} style={filled ? 'fill' : 'stroke'} strokeWidth={2} opacity={sel || r.current ? 1 : 0.62} />
                      {r.current ? <Circle cx={p.x} cy={top - 9} r={4} color={accent} /> : null}
                    </React.Fragment>
                  );
                })}
              </>
            );
          }}
        </CartesianChart>
      </View>
    </View>
  );
}
