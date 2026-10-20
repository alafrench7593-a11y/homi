/**
 * Roue du cycle, liée aux données RÉELLES :
 *  - règles enregistrées (trait plein) ; phases, fenêtre fertile, ovulation et prochaines règles ESTIMÉES (pointillés, légende « estimée ») ;
 *  - tests d'ovulation positifs enregistrés : repère distinct « mesuré » (jamais confondu avec l'estimation) ;
 *  - incertitude visible : estimation peu fiable = phases estimées plus pâles et message explicite ;
 *  - animation : les arcs se dessinent et le repère du jour avance quand les données changent ; immobile si mouvement réduit.
 * Touchez une phase (ou un bouton de la légende) pour afficher son explication.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { AnimatedPath, useProgress } from '@/components/MotionKit';
import { haptic } from '@/components/ui';
import { fonts, MIN_TOUCH, spacing } from '@/theme/tokens';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { Ink, Rise, useCyclePalette } from './kit';
import { fmtDay } from './format';
import { Tappable } from '@/components/Tappable';

export type Phase = 'period' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'next';
export interface RingData {
  day: number | null; length: number; periodDays: number; ovulationDay: number; reliability: 'insufficient' | 'low' | 'moderate';
  nextPeriod: string | null; fertileFrom: string | null; fertileTo: string | null; measuredDays: number[]; lastStart: string | null;
}

const DAY = 86_400_000;
const dn = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY);

/** Prépare la roue à partir des règles enregistrées et de l'estimation (aucune valeur fictive). */
export function ringData(periods: { start_date: string; end_date: string | null }[], est: { averageLength: number | null; reliability: 'insufficient' | 'low' | 'moderate'; nextPeriod: string | null; fertileWindow: { start: string; end: string } | null }, today: string, positiveTests: string[]): RingData | null {
  const last = periods.map((p) => p.start_date).filter((s) => s <= today).sort().pop();
  if (!last) return null;
  const p = periods.find((x) => x.start_date === last)!;
  const day = dn(today) - dn(last) + 1;
  const avg = Math.round(est.averageLength ?? 28);
  const length = Math.max(avg, Math.min(day, 60));
  const periodDays = p.end_date ? dn(p.end_date) - dn(last) + 1 : Math.min(Math.max(day, 1), 7);
  const measuredDays = positiveTests.map((t) => dn(t) - dn(last) + 1).filter((d) => d >= 1 && d <= length);
  return { day, length, periodDays: Math.max(1, Math.min(periodDays, 15)), ovulationDay: avg - 14, reliability: est.reliability, nextPeriod: est.nextPeriod, fertileFrom: est.fertileWindow?.start ?? null, fertileTo: est.fertileWindow?.end ?? null, measuredDays, lastStart: last };
}

const SIZE = 240;
const R = 92;
const C = SIZE / 2;
function polar(angle: number, r = R) { const a = ((angle - 90) * Math.PI) / 180; return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }; }
function arc(from: number, to: number, r = R) {
  const s = polar(from, r); const e = polar(to, r);
  const large = to - from > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export function CycleRing({ data }: { data: RingData }) {
  const c = useCyclePalette();
  const [sel, setSel] = useState<Phase | null>(null);
  const draw = useProgress(`${data.lastStart}|${data.day}|${data.length}|${data.periodDays}`, 1100);
  const deg = 360 / data.length;
  const a = (day: number) => (day - 1) * deg; // début du jour
  const ov = data.ovulationDay;
  const unsure = data.reliability !== 'moderate';
  const estOpacity = data.reliability === 'insufficient' ? 0.35 : data.reliability === 'low' ? 0.6 : 0.9;
  const segs = useMemo(() => {
    const out: { phase: Phase; from: number; to: number; color: string; dashed: boolean; width: number }[] = [];
    const pEnd = data.periodDays;
    const fStart = Math.max(pEnd + 1, ov - 5);
    out.push({ phase: 'period', from: a(1), to: a(pEnd + 1) - 1.5, color: c.period, dashed: false, width: 14 });
    if (fStart - 1 > pEnd) out.push({ phase: 'follicular', from: a(pEnd + 1) + 1.5, to: a(fStart) - 1.5, color: c.pearl, dashed: true, width: 10 });
    out.push({ phase: 'fertile', from: a(fStart) + 1.5, to: a(ov + 2) - 1.5, color: c.estimate, dashed: true, width: 12 });
    out.push({ phase: 'luteal', from: a(ov + 2) + 1.5, to: 358, color: c.beige, dashed: true, width: 10 });
    return out.filter((s) => s.to > s.from);
  }, [data.periodDays, ov, deg, c]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (p: Phase) => { haptic('selection'); setSel((cur) => (cur === p ? null : p)); };
  const todayA = data.day ? a(Math.min(data.day, data.length)) + deg / 2 : 0;
  const tp = polar(todayA);
  const ovp = polar(a(ov) + deg / 2);
  const phaseNow: Phase | null = !data.day ? null : data.day <= data.periodDays ? 'period' : data.day >= ov - 5 && data.day <= ov + 1 ? 'fertile'
    : data.day < ov - 5 ? 'follicular' : data.day > data.length ? 'next' : 'luteal';

  const LEGEND: Phase[] = ['period', 'follicular', 'fertile', 'ovulation', 'luteal', 'next'];
  const summary = [tr('cy.ring.a11y', { day: data.day ?? 0, length: data.length }), phaseNow ? tr(`cy.ring.phase.${phaseNow}` as TKey) : '', unsure ? tr('cy.ring.unsure') : ''].filter(Boolean).join('. ');

  return (
    <View style={{ gap: spacing.sm }}>
      <View accessible accessibilityRole="image" accessibilityLabel={summary} style={{ alignItems: 'center' }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={C} cy={C} r={R} stroke={c.line} strokeWidth={10} fill="none" opacity={0.6} />
          {segs.map((s) => {
            const len = (R * Math.PI * (s.to - s.from)) / 180;
            const on = sel === s.phase;
            return (
              <G key={s.phase} onPress={() => pick(s.phase)}>
                <AnimatedPath d={arc(s.from, s.to)} stroke={s.color} strokeWidth={on ? s.width + 5 : s.width} strokeLinecap="round" fill="none"
                  opacity={s.phase === 'period' ? 1 : estOpacity} strokeDasharray={s.dashed ? `${on ? 7 : 5} 4` : `${len} ${len}`}
                  strokeDashoffset={s.dashed ? 0 : (draw.interpolate({ inputRange: [0, 1], outputRange: [len, 0] }) as unknown as number)} />
              </G>
            );
          })}
          {/* Ovulation ESTIMÉE : cercle creux (jamais un repère plein) */}
          <Circle cx={ovp.x} cy={ovp.y} r={sel === 'ovulation' ? 9 : 7} fill={c.paper} stroke={c.mauve} strokeWidth={2} strokeDasharray="3 2" opacity={estOpacity + 0.1} onPress={() => pick('ovulation')} />
          {/* Prochaines règles estimées : repère pointillé en haut de la roue */}
          <Path d={arc(356, 364, R + 14)} stroke={c.period} strokeWidth={3} strokeDasharray="3 3" fill="none" opacity={estOpacity} onPress={() => pick('next')} />
          {/* Tests positifs enregistrés : repère plein « mesuré » */}
          {data.measuredDays.map((d) => { const p = polar(a(d) + deg / 2, R - 18); return <Circle key={`m${d}`} cx={p.x} cy={p.y} r={4.5} fill={c.mauve} />; })}
          {/* Aujourd'hui */}
          {data.day ? <Circle cx={tp.x} cy={tp.y} r={9} fill={c.ink} stroke={c.paper} strokeWidth={3} /> : null}
          <SvgText x={C} y={C - 6} fontSize={30} fontFamily={fonts.display} fill={c.ink} textAnchor="middle">{data.day ? tr('cy.ring.day', { day: data.day }) : '—'}</SvgText>
          <SvgText x={C} y={C + 18} fontSize={12} fontFamily={fonts.body} fill={c.inkSoft} textAnchor="middle">{phaseNow ? tr(`cy.ring.short.${phaseNow}` as TKey) : ''}</SvgText>
        </Svg>
      </View>
      {unsure ? <Ink variant="caption" soft center>{tr(data.reliability === 'insufficient' ? 'cy.ring.insufficient' : 'cy.ring.unsure')}</Ink> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {LEGEND.map((p) => (
          <Tappable key={p} accessibilityRole="button" accessibilityState={{ selected: sel === p }} onPress={() => pick(p)}
            style={({ pressed }) => ({ minHeight: MIN_TOUCH - 8, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, justifyContent: 'center',
              borderWidth: 1.2, borderColor: sel === p ? c.mauve : c.line, backgroundColor: sel === p ? c.lavender : pressed ? c.pearl : 'transparent' })}>
            <Ink variant="caption" weight="medium">{tr(`cy.ring.legend.${p}` as TKey)}</Ink>
          </Tappable>
        ))}
      </View>
      {data.measuredDays.length ? <Ink variant="caption" soft center>{tr('cy.ring.measured')}</Ink> : null}
      {sel ? (
        <Rise key={sel}>
          <View style={{ padding: spacing.sm, borderRadius: 14, backgroundColor: c.pearl, gap: 4 }}>
            <Ink weight="bold">{tr(`cy.ring.legend.${sel}` as TKey)}</Ink>
            <Ink variant="small">{tr(`cy.ring.detail.${sel}` as TKey, {
              days: data.periodDays, from: data.fertileFrom ? fmtDay(data.fertileFrom) : '—', to: data.fertileTo ? fmtDay(data.fertileTo) : '—',
              date: data.nextPeriod ? fmtDay(data.nextPeriod) : '—', length: formatNumber(data.length),
            })}</Ink>
          </View>
        </Rise>
      ) : null}
    </View>
  );
}
