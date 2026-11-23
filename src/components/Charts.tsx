/** Graphiques simples et lisibles (SVG). Descriptifs uniquement : aucune zone « normale/anormale ». */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Text } from './ui';
import { AnimatedCircle, AnimatedPath, useProgress } from './MotionKit';
import { Animated } from 'react-native';
import { formatNumber } from '@/i18n';

/** Valeur d'axe / de point au format de la langue (« 62,7 » en français, « 62.7 » en anglais), 1 décimale au plus. */
export function chartNumber(v: number, decimals = 1): string {
  return formatNumber(v, { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

/**
 * Lisibilité d'un histogramme selon le nombre de barres (pur, testé). Jusqu'à 10 barres (7 jours) : libellé et
 * valeur sur chaque barre. Au-delà (30 jours : décision audit 09 — 30 barres quotidiennes plutôt qu'une agrégation
 * par semaine, pour que « 30 jours » montre bien chaque jour) : barres fines, libellé (numéro du jour) une barre
 * sur 5 et la dernière, valeur seulement sur la dernière barre et sur la plus haute ; toutes les valeurs restent
 * lues par le lecteur d'écran.
 */
export function barChartLayout(values: number[]): { compact: boolean; showLabel: (i: number) => boolean; showValue: (i: number) => boolean } {
  const n = values.length;
  if (n <= 10) return { compact: false, showLabel: () => true, showValue: (i) => values[i] > 0 };
  const step = n <= 16 ? 2 : 5;
  const last = n - 1;
  const maxI = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
  return {
    compact: true,
    // le dernier libellé est toujours montré ; celui qui le précède de trop près est omis (pas de chevauchement)
    showLabel: (i) => i === last || (i % step === 0 && last - i >= Math.ceil(step / 2)),
    showValue: (i) => values[i] > 0 && (i === last || i === maxI),
  };
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export function BarChart({ data, unit, height = 150, accessibilityLabel }: { data: { label: string; value: number; date?: Date }[]; unit: string; height?: number; accessibilityLabel: string }) {
  const t = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 320;
  const bw = (w - 16) / Math.max(1, data.length);
  const lay = barChartLayout(data.map((d) => d.value));
  // Beaucoup de barres (30 jours) : le jour du mois (« 14 ») plutôt que le jour de la semaine répété
  const labelOf = (d: { label: string; date?: Date }) => (lay.compact && d.date ? String(d.date.getDate()) : d.label);
  const summary = data.map((d) => `${d.date && lay.compact ? `${d.label} ${d.date.getDate()}` : d.label} : ${chartNumber(d.value)} ${unit}`).join(', ');
  // Les barres montent l'une après l'autre quand les données (réelles) changent
  const grow = useProgress(data.map((d) => d.value).join('|'), 700 + data.length * 60);
  const n = data.length;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${accessibilityLabel}. ${summary}`}>
      <Svg width="100%" height={height + 28} viewBox={`0 0 ${w} ${height + 28}`}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * (height - 18), 2);
          const x = 8 + i * bw + bw * (lay.compact ? 0.15 : 0.18);
          const barW = bw * (lay.compact ? 0.7 : 0.64);
          const start = (i / Math.max(n, 1)) * 0.5;
          const ah = grow.interpolate({ inputRange: [start, Math.min(1, start + 0.5)], outputRange: [2, h], extrapolate: 'clamp' });
          const ay = grow.interpolate({ inputRange: [start, Math.min(1, start + 0.5)], outputRange: [height - 2, height - h], extrapolate: 'clamp' });
          return (
            <G key={i}>
              <AnimatedRect x={x} y={ay} width={barW} height={ah} rx={Math.min(8, barW / 2)} fill={i === data.length - 1 ? t.colors.primary : t.colors.accent} opacity={i === data.length - 1 ? 1 : 0.65} />
              {lay.showValue(i) && (
                <SvgText x={x + barW / 2} y={height - h - 6} fontSize={11} fill={t.colors.textMuted} textAnchor="middle" fontFamily={fonts.bodyMedium}>{chartNumber(d.value)}</SvgText>
              )}
              {lay.showLabel(i) ? (
                <SvgText x={x + barW / 2} y={height + 18} fontSize={11.5} fill={t.colors.textMuted} textAnchor="middle" fontFamily={fonts.body}>{labelOf(d)}</SvgText>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export function LineChart({ points, unit, height = 170, accessibilityLabel, formatX }: { points: { x: number; y: number; label?: string }[]; unit: string; height?: number; accessibilityLabel: string; formatX?: (x: number) => string }) {
  const t = useTheme();
  const draw = useProgress(points.map((p) => `${p.x}:${p.y}`).join('|'), 1100);
  if (points.length === 0) return null;
  const w = 320;
  const pad = { l: 36, r: 12, t: 14, b: 26 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const spanY = Math.max(...ys) - Math.min(...ys) || 1;
  const minY = Math.min(...ys) - spanY * 0.25;
  const maxY = Math.max(...ys) + spanY * 0.25;
  const px = (x: number) => pad.l + ((x - minX) / (maxX - minX || 1)) * (w - pad.l - pad.r);
  const py = (y: number) => pad.t + (1 - (y - minY) / (maxY - minY || 1)) * (height - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ');
  const summary = points.map((p) => `${p.label ?? (formatX ? formatX(p.x) : p.x)} : ${chartNumber(p.y, 2)} ${unit}`).join(', ');
  // La courbe se trace de gauche à droite ; les points apparaissent quand le trait les atteint
  let len = 0;
  for (let i = 1; i < points.length; i++) len += Math.hypot(px(points[i].x) - px(points[i - 1].x), py(points[i].y) - py(points[i - 1].y));
  len = Math.max(len, 1);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${accessibilityLabel}. ${summary}`}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
        {[0, 0.5, 1].map((f) => {
          const y = pad.t + f * (height - pad.t - pad.b);
          const v = maxY - f * (maxY - minY);
          return (
            <G key={f}>
              <Line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={t.colors.border} strokeDasharray="3 5" />
              <SvgText x={pad.l - 6} y={y + 4} fontSize={10.5} fill={t.colors.textMuted} textAnchor="end" fontFamily={fonts.body}>{chartNumber(v)}</SvgText>
            </G>
          );
        })}
        <AnimatedPath d={d} stroke={t.colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={`${len} ${len}`} strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [len, 0] })} />
        {points.map((p, i) => {
          const at = points.length > 1 ? (px(p.x) - px(points[0].x)) / Math.max(1, px(points[points.length - 1].x) - px(points[0].x)) : 0;
          return (
            <AnimatedCircle key={i} cx={px(p.x)} cy={py(p.y)} r={4.5} fill={t.colors.surface} stroke={t.colors.primary} strokeWidth={2}
              opacity={draw.interpolate({ inputRange: [Math.max(0, at - 0.05), Math.min(1, at + 0.05)], outputRange: [0, 1], extrapolate: 'clamp' })} />
          );
        })}
        {formatX && [points[0], points[points.length - 1]].map((p, i) => (
          <SvgText key={i} x={px(p.x)} y={height - 6} fontSize={10.5} fill={t.colors.textMuted} textAnchor={i ? 'end' : 'start'} fontFamily={fonts.body}>{formatX(p.x)}</SvgText>
        ))}
      </Svg>
    </View>
  );
}

export function ProgressRing({ progress, size = 120, children, label }: { progress: number; size?: number; children?: React.ReactNode; label: string }) {
  const t = useTheme();
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={label}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.colors.border} strokeWidth={6} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.colors.gold} strokeWidth={6} fill="none" strokeDasharray={`${c * Math.max(0, Math.min(1, progress))} ${c}`} strokeLinecap="round" rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

export function StatPill({ value, label }: { value: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 90, padding: 12, borderRadius: 16, backgroundColor: t.colors.surfaceAlt, gap: 2 }} accessible accessibilityLabel={`${label} : ${value}`}>
      <Text variant="heading">{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}
