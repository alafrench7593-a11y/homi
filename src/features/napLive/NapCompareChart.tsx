/**
 * Siestes comparées (Victory Native XL 42 sur Skia) : une barre par sieste comparable (de la plus ancienne à la plus
 * récente), puis la session regardée. Pleine = dans la plage ; contour seul = hors plage ; la session regardée porte un
 * point au-dessus. La plage centrale est bordée de deux traits en tirets. Distinguable sans couleur.
 *
 * Lecture au pointeur (22/11/2026) : la barre sous le DOIGT, sous la SOURIS (survol, web) ou choisie au clavier /
 * VoiceOver (ajustable) est sélectionnée ; repère vertical, date, heure et durée changent ENSEMBLE ; la sélection reste
 * quand le pointeur quitte le graphique. Toucher bref sur une barre : l'événement d'origine s'ouvre (`onOpen`).
 * (La détection d'appui de Victory passe par les touchers de Gesture Handler : sans effet au survol d'une souris.)
 */
import React, { useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import { Circle, DashPathEffect, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { CartesianChart } from 'victory-native';
import { haptic, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export interface NapCompareProps {
  samples: readonly { started_at: string; minutes: number; id?: string }[];
  current: { started_at: string; minutes: number; label: string; id?: string };
  low: number | null;
  high: number | null;
  height?: number;
  /** Toucher bref sur une barre : ouvrir la session d'origine. */
  onOpen?: (id: string) => void;
}

const PAD = 22;

export default function NapCompareChart({ samples, current, low, high, height = 150, onOpen }: NapCompareProps) {
  const t = useTheme();
  const rows = [...samples].reverse().map((s, i) => ({ i, min: s.minutes, at: s.started_at, id: s.id, current: false }))
    .concat([{ i: samples.length, min: current.minutes, at: current.started_at, id: current.id, current: true }]);
  const [picked, setPicked] = useState(rows.length - 1);
  const [width, setWidth] = useState(0);
  const pick = (k: number) => { const c = Math.max(0, Math.min(rows.length - 1, k)); if (c !== picked) { haptic('selection'); setPicked(c); } };
  // Barres régulièrement espacées entre les marges internes du graphique (domainPadding gauche/droite)
  const indexAt = (x: number) => (rows.length < 2 || !width ? rows.length - 1 : Math.round(((x - PAD) / Math.max(1, width - 2 * PAD)) * (rows.length - 1)));
  const startX = { v: 0, moved: false };
  const shown = rows[picked] ?? rows[rows.length - 1];
  const inRange = (m: number) => low != null && high != null && m >= low && m <= high;
  const ink = t.colors.text;
  const accent = t.colors.primary;
  const when = (r: typeof rows[number]) => `${formatDate(r.at, { weekday: 'short', day: 'numeric' })} · ${clock(new Date(r.at))}`;
  const readout = `${when(shown)} · ${span(shown.min)}${shown.current ? ` · ${current.label}` : inRange(shown.min) ? '' : ` · ${tr('nn.facts.outside')}`}`;
  const webPointer = {
    onPointerMove: (e: { nativeEvent: { offsetX?: number; locationX?: number } }) => pick(indexAt(e.nativeEvent.offsetX ?? e.nativeEvent.locationX ?? 0)),
  } as object;
  return (
    <View style={{ gap: spacing.xs }} testID="nap-compare-chart">
      <Text variant="small" weight="bold" style={{ fontVariant: ['tabular-nums'] }} testID="nap-compare-readout" accessibilityLiveRegion="polite">{readout}</Text>
      <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <CartesianChart data={rows} xKey="i" yKeys={['min']} domain={{ y: [0, Math.max(...rows.map((r) => r.min), high ?? 0) * 1.15] }} domainPadding={{ left: PAD, right: PAD, top: 12 }}>
          {({ points, chartBounds, yScale }) => {
            const w = Math.max(8, Math.min(28, ((chartBounds.right - chartBounds.left) / rows.length) * 0.55));
            const sel = points.min[picked];
            return (
              <>
                {low != null && high != null ? [low, high].map((v) => (
                  <Line key={v} p1={vec(chartBounds.left, yScale(v))} p2={vec(chartBounds.right, yScale(v))} color={accent} strokeWidth={1.5}>
                    <DashPathEffect intervals={[5, 4]} />
                  </Line>
                )) : null}
                {sel ? <Line p1={vec(sel.x, chartBounds.top)} p2={vec(sel.x, chartBounds.bottom)} color={ink} strokeWidth={1} opacity={0.35} /> : null}
                {points.min.map((p, k) => {
                  const r = rows[k];
                  const top = p.y ?? chartBounds.bottom;
                  const filled = r.current || inRange(r.min);
                  const on = k === picked;
                  return (
                    <React.Fragment key={k}>
                      <RoundedRect x={p.x - w / 2} y={top} width={w} height={Math.max(2, chartBounds.bottom - top)} r={6}
                        color={r.current ? accent : ink} style={filled ? 'fill' : 'stroke'} strokeWidth={2} opacity={on ? 1 : 0.5} />
                      {r.current ? <Circle cx={p.x} cy={top - 9} r={4} color={accent} /> : null}
                    </React.Fragment>
                  );
                })}
              </>
            );
          }}
        </CartesianChart>
        {/* Couche de lecture : doigt, souris (survol), clavier / VoiceOver */}
        <View
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          testID="nap-compare-touch"
          accessible accessibilityRole="adjustable" accessibilityLabel={readout}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'increment') pick(picked + 1);
            else if (e.nativeEvent.actionName === 'decrement') pick(picked - 1);
            else if (e.nativeEvent.actionName === 'activate' && shown.id) onOpen?.(shown.id);
          }}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e: GestureResponderEvent) => { startX.v = e.nativeEvent.locationX; startX.moved = false; pick(indexAt(e.nativeEvent.locationX)); }}
          onResponderMove={(e: GestureResponderEvent) => { if (Math.abs(e.nativeEvent.locationX - startX.v) > 8) startX.moved = true; pick(indexAt(e.nativeEvent.locationX)); }}
          onResponderRelease={(e: GestureResponderEvent) => { if (!startX.moved) { const r = rows[indexAt(e.nativeEvent.locationX)]; if (r?.id) onOpen?.(r.id); } }}
          {...webPointer}
        />
      </View>
    </View>
  );
}
