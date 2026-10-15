/** Graphiques simples et lisibles (SVG). Descriptifs uniquement : aucune zone « normale/anormale ». */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Text } from './ui';

export function BarChart({ data, unit, height = 150, accessibilityLabel }: { data: { label: string; value: number }[]; unit: string; height?: number; accessibilityLabel: string }) {
  const t = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 320;
  const bw = (w - 16) / data.length;
  const summary = data.map((d) => `${d.label} : ${d.value} ${unit}`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${accessibilityLabel}. ${summary}`}>
      <Svg width="100%" height={height + 28} viewBox={`0 0 ${w} ${height + 28}`}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 18);
          const x = 8 + i * bw + bw * 0.18;
          return (
            <G key={i}>
              <Rect x={x} y={height - h} width={bw * 0.64} height={Math.max(h, 2)} rx={8} fill={i === data.length - 1 ? t.colors.primary : t.colors.accent} opacity={i === data.length - 1 ? 1 : 0.65} />
              {d.value > 0 && (
                <SvgText x={x + bw * 0.32} y={height - h - 6} fontSize={11} fill={t.colors.textMuted} textAnchor="middle" fontFamily={fonts.bodyMedium}>{d.value}</SvgText>
              )}
              <SvgText x={x + bw * 0.32} y={height + 18} fontSize={11.5} fill={t.colors.textMuted} textAnchor="middle" fontFamily={fonts.body}>{d.label}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export function LineChart({ points, unit, height = 170, accessibilityLabel, formatX }: { points: { x: number; y: number; label?: string }[]; unit: string; height?: number; accessibilityLabel: string; formatX?: (x: number) => string }) {
  const t = useTheme();
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
  const summary = points.map((p) => `${p.label ?? (formatX ? formatX(p.x) : p.x)} : ${p.y} ${unit}`).join(', ');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${accessibilityLabel}. ${summary}`}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
        {[0, 0.5, 1].map((f) => {
          const y = pad.t + f * (height - pad.t - pad.b);
          const v = maxY - f * (maxY - minY);
          return (
            <G key={f}>
              <Line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={t.colors.border} strokeDasharray="3 5" />
              <SvgText x={pad.l - 6} y={y + 4} fontSize={10.5} fill={t.colors.textMuted} textAnchor="end" fontFamily={fonts.body}>{v.toFixed(1)}</SvgText>
            </G>
          );
        })}
        <Path d={d} stroke={t.colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={px(p.x)} cy={py(p.y)} r={4.5} fill={t.colors.surface} stroke={t.colors.primary} strokeWidth={2} />
        ))}
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
