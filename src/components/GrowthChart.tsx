/**
 * Courbe de croissance avec repères OMS : bandes 3e–97e et 15e–85e centile, médiane, et les
 * mesures saisies par la famille. Les repères se dessinent d'abord (de gauche à droite), puis
 * la courbe de l'enfant se trace et ses points apparaissent. Couleurs du thème uniquement.
 */
import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText, Circle, Defs, ClipPath, Rect } from 'react-native-svg';
import { AnimatedPath, useProgress } from './MotionKit';
import { tint } from './ToolGlyph';
import { referenceCurves, type GrowthIndicator, type Sex } from '@/lib/domain/growthStandards';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { Text } from './ui';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export function GrowthChart({ indicator, sex, points, unit, accessibilityLabel }: {
  indicator: GrowthIndicator; sex: Sex; points: { m: number; y: number; label: string }[]; unit: string; accessibilityLabel: string;
}) {
  const t = useTheme();
  const key = `${indicator}:${sex}:${points.map((p) => `${p.m.toFixed(2)}:${p.y}`).join('|')}`;
  const bands = useProgress(`b:${key}`, 900);
  const draw = useProgress(`d:${key}`, 1500);
  const w = 320; const h = 210;
  const pad = { l: 38, r: 12, t: 12, b: 28 };
  const maxAge = Math.max(...points.map((p) => p.m), 0);
  const minAge = Math.min(...points.map((p) => p.m), 0);
  const from = Math.max(0, Math.floor(minAge) - 1);
  const to = Math.min(60, Math.max(6, Math.ceil(maxAge) + 3));
  const curves = referenceCurves(indicator, sex, from, to, (to - from) / 60);
  const ys = [...curves.flatMap((c) => [c.v[3], c.v[97]]), ...points.map((p) => p.y)];
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const spanY = maxY - minY || 1;
  const y0 = minY - spanY * 0.04; const y1 = maxY + spanY * 0.04;
  const px = (m: number) => pad.l + ((m - from) / (to - from || 1)) * (w - pad.l - pad.r);
  const py = (v: number) => pad.t + (1 - (v - y0) / (y1 - y0)) * (h - pad.t - pad.b);
  const line = (p: number) => curves.map((c, i) => `${i ? 'L' : 'M'}${px(c.m).toFixed(1)} ${py(c.v[p]).toFixed(1)}`).join(' ');
  const band = (lo: number, hi: number) => `${curves.map((c, i) => `${i ? 'L' : 'M'}${px(c.m).toFixed(1)} ${py(c.v[hi]).toFixed(1)}`).join(' ')} ${curves.slice().reverse().map((c) => `L${px(c.m).toFixed(1)} ${py(c.v[lo]).toFixed(1)}`).join(' ')} Z`;
  const sorted = points.slice().sort((a, b) => a.m - b.m);
  const child = sorted.map((p, i) => `${i ? 'L' : 'M'}${px(p.m).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ');
  let len = 0;
  for (let i = 1; i < sorted.length; i++) len += Math.hypot(px(sorted[i].m) - px(sorted[i - 1].m), py(sorted[i].y) - py(sorted[i - 1].y));
  len = Math.max(len, 1);
  const ticksX = Array.from({ length: 5 }, (_, i) => from + ((to - from) * i) / 4);
  const ageLabel = (m: number) => (m < 24 ? `${Math.round(m)} m` : `${(m / 12).toFixed(m % 12 ? 1 : 0).replace('.', ',')} a`);
  const fmtV = (v: number) => (spanY < 5 ? v.toFixed(1) : Math.round(v).toString()).replace('.', ',');
  const c = t.colors.lavender;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${accessibilityLabel}. ${sorted.map((p) => `${p.label} : ${String(p.y).replace('.', ',')} ${unit}`).join(', ')}`}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <ClipPath id="gc-reveal"><AnimatedRect x={pad.l} y={0} height={h} width={bands.interpolate({ inputRange: [0, 1], outputRange: [0, w - pad.l - pad.r] })} /></ClipPath>
        </Defs>
        {[0, 0.5, 1].map((f) => {
          const y = pad.t + f * (h - pad.t - pad.b);
          return (
            <G key={f}>
              <Line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={t.colors.border} strokeDasharray="3 5" />
              <SvgText x={pad.l - 6} y={y + 4} fontSize={10.5} fill={t.colors.textMuted} textAnchor="end" fontFamily={fonts.body}>{fmtV(y1 - f * (y1 - y0))}</SvgText>
            </G>
          );
        })}
        {ticksX.map((m) => <SvgText key={m} x={px(m)} y={h - 8} fontSize={10.5} fill={t.colors.textMuted} textAnchor="middle" fontFamily={fonts.body}>{ageLabel(m)}</SvgText>)}
        <G clipPath="url(#gc-reveal)">
          <Path d={band(3, 97)} fill={tint(c, t.isDark ? 0.16 : 0.12)} />
          <Path d={band(15, 85)} fill={tint(c, t.isDark ? 0.2 : 0.16)} />
          <Path d={line(50)} fill="none" stroke={tint(c, 0.85)} strokeWidth={1.4} strokeDasharray="5 4" />
          {[3, 97].map((p) => <Path key={p} d={line(p)} fill="none" stroke={tint(c, 0.45)} strokeWidth={1} />)}
        </G>
        {sorted.length > 1 ? (
          <AnimatedPath d={child} fill="none" stroke={t.colors.primary} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={`${len} ${len}`} strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [len, 0] })} />
        ) : null}
        {sorted.map((p, i) => (
          <Circle key={`${p.m}-${i}`} cx={px(p.m)} cy={py(p.y)} r={4.2} fill={t.colors.primary} stroke={t.colors.surface} strokeWidth={1.5} />
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Legend color={t.colors.primary} label="Mesures de l’enfant" solid />
        <Legend color={tint(c, 0.85)} label="Médiane OMS" dashed />
        <Legend color={tint(c, 0.35)} label="15e–85e et 3e–97e centiles" />
      </View>
    </View>
  );
}

function Legend({ color, label, solid, dashed }: { color: string; label: string; solid?: boolean; dashed?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 16, height: dashed ? 0 : solid ? 4 : 10, borderRadius: 3, backgroundColor: dashed ? 'transparent' : color, borderTopWidth: dashed ? 2 : 0, borderStyle: dashed ? 'dashed' : 'solid', borderColor: color }} />
      <Text variant="caption" style={{ color: t.colors.textMuted }}>{label}</Text>
    </View>
  );
}
