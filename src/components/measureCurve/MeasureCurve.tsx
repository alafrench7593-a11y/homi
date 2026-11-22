/**
 * Courbe de mesures tactile, commune à Croissance, Poids de grossesse et Température (22/11/2026).
 *
 *  · CHAQUE point est une mesure réellement enregistrée ; segments droits entre deux mesures (rien n'est lissé ni
 *    interpolé) ; aucune mesure = aucun point (jamais un zéro) ;
 *  · lecture : le doigt (glisser), la souris (survol, web), le clavier (←/→, Début/Fin, Entrée) et VoiceOver / TalkBack
 *    (balayage haut/bas) sélectionnent le point RÉEL le plus proche ; date, valeur, unité et note changent ENSEMBLE
 *    (ligne de lecture + bulle au-dessus du point + repère vertical pointillé) ; la sélection reste au relâchement ;
 *  · toucher bref sur un point, « Voir la mesure » ou une ligne de la liste : la mesure d'origine s'ouvre (`onOpen`) ;
 *  · période (1 mois / 3 mois / 1 an / tout) proposée seulement quand elle change ce qui est montré ;
 *  · repère de référence facultatif (OMS) très discret, sans aucune interprétation.
 * Couche de lecture reprise de src/features/napLive/NapCompareChart.tsx ; dessin Skia chargé comme SkiaHost.web.tsx.
 */
import React, { useMemo, useRef, useState } from 'react';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import { Platform, View, type GestureResponderEvent } from 'react-native';
import { GlassButton, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, formatNumber, t as tr, type TKey } from '@/i18n';
import {
  curveDomain, inPeriod, keepSelection, nearestIndex, projector, stepIndex, timeTicks, usefulPeriods, valueTicks,
  type CurvePeriod, type CurvePoint,
} from '@/lib/domain/measureCurve';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import type { CurveReference } from './MeasureCurveCanvas';
import { MeasureCurveSkia } from './MeasureCurveHost';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const BOX = { left: 46, right: 16, top: 44, bottom: 28 };
const BUBBLE_W = 128;
/** Un toucher bref n'ouvre la mesure que s'il tombe près d'un point (sinon il sélectionne seulement). */
const OPEN_SLOP = 28;

export interface MeasureCurveProps {
  /** Toutes les mesures réelles (src/lib/domain/measureCurve.ts › toCurvePoints) */
  points: readonly CurvePoint[];
  unit: string;
  /** Décimales affichées (kg : 2, cm : 1, °C : 2) */
  digits: number;
  /** Nom de la courbe pour les lecteurs d'écran */
  title: string;
  /** Écart vertical minimal (unités) : une variation de 0,05 °C ne doit pas remplir tout le graphique */
  minYSpan: number;
  periods?: readonly Exclude<CurvePeriod, 'all'>[];
  reference?: CurveReference | null;
  referenceLabel?: string;
  onOpen: (id: string) => void;
  height?: number;
  testID?: string;
  /** Instant de référence des périodes (tests) */
  now?: number;
}

export const dayLabel = (iso: string) => formatDate(`${iso.slice(0, 10)}T00:00:00Z`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function MeasureCurve({ points, unit, digits, title, minYSpan, periods = ['3m', '1y'], reference, referenceLabel, onOpen, height = 220, testID = 'measure-curve', now }: MeasureCurveProps) {
  const t = useTheme();
  const nowMs = now ?? Date.now();
  const [period, setPeriod] = useState<CurvePeriod>('all');
  const [selId, setSelId] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [showList, setShowList] = useState(false);
  const gesture = useRef({ x: 0, moved: false });

  const options = useMemo(() => usefulPeriods(points, periods, nowMs), [points, periods, nowMs]);
  const active: CurvePeriod = options.includes(period) ? period : 'all';
  const shown = useMemo(() => inPeriod(points, active, nowMs), [points, active, nowMs]);
  const idx = keepSelection(shown, selId);
  const sel = idx >= 0 ? shown[idx] : null;
  const domain = useMemo(() => curveDomain(shown, { minYSpan }), [shown, minYSpan]);
  const box = { width, height, ...BOX };
  const proj = domain && width ? projector(domain, box) : null;
  const xs = proj ? shown.map((p) => proj.px(p.x)) : [];

  const fmt = (v: number) => formatNumber(v, { maximumFractionDigits: digits });
  const valueText = (v: number) => tr('ct.value', { value: fmt(v), unit });
  const readoutOf = (p: CurvePoint) => (p.note ? tr('ct.readoutNote', { date: dayLabel(p.date), value: valueText(p.y), note: p.note }) : tr('ct.readout', { date: dayLabel(p.date), value: valueText(p.y) }));
  const readout = sel ? readoutOf(sel) : '';

  const pick = (k: number) => {
    const p = shown[Math.max(0, Math.min(shown.length - 1, k))];
    if (p && p.id !== sel?.id) { haptic('selection'); setSelId(p.id); }
  };
  const at = (x: number) => nearestIndex(xs, x);
  const open = (p: CurvePoint | null | undefined) => { if (p) { setSelId(p.id); onOpen(p.id); } };

  const changePeriod = (p: CurvePeriod) => { setPeriod(p); setSelId(null); };
  const ticksX = domain ? timeTicks(domain.x0, domain.x1, width && width < 340 ? 3 : 4) : [];
  const multiYear = domain ? new Date(domain.x0).getUTCFullYear() !== new Date(domain.x1).getUTCFullYear() : false;
  const tickLabel = (k: { at: number; unit: 'month' | 'day' }) => formatDate(k.at, k.unit === 'month'
    ? { month: 'short', ...(multiYear ? { year: '2-digit' as const } : {}), timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const ticksY = domain ? valueTicks(domain.y0, domain.y1, 4) : [];

  const webProps = Platform.OS === 'web' ? {
    tabIndex: 0,
    onPointerMove: (e: { nativeEvent: { offsetX?: number; locationX?: number } }) => { if (xs.length) pick(at(e.nativeEvent.offsetX ?? e.nativeEvent.locationX ?? 0)); },
    onKeyDown: (e: { key: string; preventDefault?: () => void; nativeEvent?: { key?: string } }) => {
      const key = e.key ?? e.nativeEvent?.key;
      const map: Record<string, () => void> = {
        ArrowLeft: () => pick(stepIndex(idx, -1, shown.length)), ArrowDown: () => pick(stepIndex(idx, -1, shown.length)),
        ArrowRight: () => pick(stepIndex(idx, 1, shown.length)), ArrowUp: () => pick(stepIndex(idx, 1, shown.length)),
        Home: () => pick(0), End: () => pick(shown.length - 1), Enter: () => open(sel), ' ': () => open(sel),
      };
      if (map[key]) { e.preventDefault?.(); map[key](); }
    },
  } as object : {};

  if (!points.length) return <Nothing testID={`${testID}-empty`} label={tr('ct.none')} height={height} />;

  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      {options.length > 1 ? (
        <GlassSegmentedControl label={tr('ct.period.label')} value={active} onChange={changePeriod} testID={`${testID}-period`}
          options={options.map((o) => ({ value: o, label: tr(`ct.period.${o}` as TKey) }))} />
      ) : null}
      {!shown.length ? <Nothing testID={`${testID}-empty-period`} label={tr('ct.nonePeriod')} height={height} /> : (
        <>
          <Text variant="small" weight="bold" style={TABULAR} testID={`${testID}-readout`} accessibilityLiveRegion="polite" numberOfLines={2}>{readout}</Text>
          <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} testID={`${testID}-plot`}>
            {/* Graduations (React Native : polices du thème) — sous le dessin */}
            {proj ? ticksY.map((v) => (
              <View key={`y${v}`} pointerEvents="none" style={{ position: 'absolute', left: BOX.left, right: BOX.right, top: proj.py(v), height: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: t.colors.border }} />
            )) : null}
            {domain && proj ? (
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
                <MeasureCurveSkia rows={shown} domain={domain} box={BOX} selected={idx}
                  colors={{ line: t.colors.primary, ink: t.colors.text, ref: t.colors.lavender, halo: t.colors.primary }} reference={reference} />
              </View>
            ) : null}
            {proj ? ticksY.map((v) => (
              <Text key={`yl${v}`} variant="caption" muted numberOfLines={1} pointerEvents="none"
                style={[TABULAR, { position: 'absolute', left: 0, width: BOX.left - 6, textAlign: 'right', top: proj.py(v) - 8 }]}>{fmt(v)}</Text>
            )) : null}
            <Text variant="caption" muted pointerEvents="none" style={{ position: 'absolute', left: 0, width: BOX.left - 6, textAlign: 'right', top: BOX.top - 26 }} testID={`${testID}-unit`}>{unit}</Text>
            {proj ? ticksX.map((k) => (
              <Text key={`x${k.at}`} variant="caption" muted numberOfLines={1} pointerEvents="none"
                style={[TABULAR, { position: 'absolute', width: 64, textAlign: 'center', left: Math.max(0, Math.min(width - 64, proj.px(k.at) - 32)), top: height - BOX.bottom + 6 }]}>{tickLabel(k)}</Text>
            )) : null}
            {/* Bulle de la mesure sélectionnée : « 72 cm » au-dessus du point */}
            {proj && sel ? (
              <View pointerEvents="none" testID={`${testID}-bubble`} style={{ position: 'absolute', width: BUBBLE_W, alignItems: 'center', left: Math.max(0, Math.min(width - BUBBLE_W, proj.px(sel.x) - BUBBLE_W / 2)), top: Math.max(0, proj.py(sel.y) - 46) }}>
                <View style={{ backgroundColor: t.colors.text, ...whoopEdge(t, t.colors.text), borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={[TABULAR, { color: t.colors.surface, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 }]} numberOfLines={1}>{valueText(sel.y)}</Text>
                </View>
              </View>
            ) : null}
            {/* Couche de lecture : doigt, souris (survol), clavier, VoiceOver / TalkBack */}
            <View
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              testID={`${testID}-touch`}
              accessible accessibilityRole="adjustable"
              accessibilityLabel={sel ? tr('ct.a11y', { title, pos: idx + 1, count: shown.length, readout }) : title}
              accessibilityHint={tr('ct.a11yHint')}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
              onAccessibilityAction={(e) => {
                if (e.nativeEvent.actionName === 'increment') pick(stepIndex(idx, 1, shown.length));
                else if (e.nativeEvent.actionName === 'decrement') pick(stepIndex(idx, -1, shown.length));
                else if (e.nativeEvent.actionName === 'activate') open(sel);
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={(e: GestureResponderEvent) => { gesture.current = { x: e.nativeEvent.locationX, moved: false }; pick(at(e.nativeEvent.locationX)); }}
              onResponderMove={(e: GestureResponderEvent) => { if (Math.abs(e.nativeEvent.locationX - gesture.current.x) > 8) gesture.current.moved = true; pick(at(e.nativeEvent.locationX)); }}
              onResponderRelease={(e: GestureResponderEvent) => {
                if (gesture.current.moved) return; // glisser : la sélection reste, rien ne s'ouvre
                const k = at(e.nativeEvent.locationX);
                if (k >= 0 && Math.abs(xs[k] - e.nativeEvent.locationX) <= OPEN_SLOP) open(shown[k]);
              }}
              {...webProps}
            />
          </View>
          {shown.length === 1 ? <Text variant="caption" muted testID={`${testID}-single`}>{tr('ct.single')}</Text> : <Text variant="caption" muted>{tr('ct.hint')}</Text>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
            <GlassButton variant="primary" icon="eye" label={tr('ct.open')} testID={`${testID}-open`} disabled={!sel} onPress={() => open(sel)} />
            <Tappable accessibilityRole="button" accessibilityState={{ expanded: showList }} onPress={() => setShowList((v) => !v)} testID={`${testID}-list-toggle`}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs }}>
              <Icon name="list" size={16} color={t.colors.text} />
              <Text variant="small" weight="bold">{showList ? tr('ct.list.hide') : tr('ct.list.show')}</Text>
              <Text variant="caption" muted style={TABULAR}>{tr('ct.list.count', { count: shown.length })}</Text>
            </Tappable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Legend color={t.colors.primary} label={tr('ct.legend.measure')} dot />
            {reference && referenceLabel ? <Legend color={t.colors.lavender} label={referenceLabel} /> : null}
          </View>
          {showList ? (
            <View style={{ gap: 2 }} testID={`${testID}-list`}>
              {shown.slice().reverse().map((p) => (
                <Tappable key={p.id} accessibilityRole="button" accessibilityLabel={tr('ct.list.rowA11y', { readout: readoutOf(p) })} accessibilityState={{ selected: p.id === sel?.id }}
                  onPress={() => open(p)} testID={`${testID}-row`}
                  style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, paddingHorizontal: spacing.xs, borderRadius: radius.md, backgroundColor: p.id === sel?.id ? t.colors.border : 'transparent' }}>
                  <Text weight="bold" style={[TABULAR, { minWidth: 84 }]}>{valueText(p.y)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="small" style={TABULAR}>{dayLabel(p.date)}</Text>
                    {p.note ? <Text variant="caption" muted numberOfLines={1}>{p.note}</Text> : null}
                  </View>
                  <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
                </Tappable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

/** Rien de noté : cadre pointillé (jamais un zéro). */
function Nothing({ label, height, testID }: { label: string; height: number; testID: string }) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ height: Math.round(height * 0.6), borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
      <Text muted center>{label}</Text>
    </View>
  );
}

function Legend({ color, label, dot }: { color: string; label: string; dot?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={dot ? { width: 8, height: 8, borderRadius: 4, backgroundColor: color } : { width: 16, height: 8, borderRadius: 3, backgroundColor: color, opacity: 0.35 }} />
      <Text variant="caption" muted>{label}</Text>
    </View>
  );
}
