/**
 * Suivi des douleurs : silhouette simplifiée (abstraite, non sexualisée, pédagogique — elle ne localise aucune pathologie)
 * et jauge d'intensité 0–10. Chaque zone est aussi disponible dans une liste accessible (même état).
 * Animations : la zone choisie s'illumine (anneau qui s'étend une fois), la jauge se remplit progressivement ;
 * tout est immobile si « réduire les animations » est activé.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Ellipse, G, Rect, Text as SvgText } from 'react-native-svg';
import { haptic, Text } from '@/components/ui';
import { AnimatedCircle } from '@/components/MotionKit';
import { springTo } from '@/theme/motion';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { Ink, useCyclePalette } from './kit';
import { Tappable } from '@/components/Tappable';

export const PAIN_ZONES = ['lower_abdomen', 'lower_left', 'lower_right', 'upper_abdomen', 'lower_back', 'thighs', 'chest', 'head', 'other'] as const;
export type PainZone = (typeof PAIN_ZONES)[number];

/** Formes des zones (vue de face à gauche, vue de dos à droite). Gauche/droite = côté de la personne. */
const SHAPES: Record<Exclude<PainZone, 'other'>, { cx: number; cy: number; rx: number; ry: number }[]> = {
  head: [{ cx: 60, cy: 26, rx: 15, ry: 17 }],
  chest: [{ cx: 60, cy: 74, rx: 24, ry: 14 }],
  upper_abdomen: [{ cx: 60, cy: 102, rx: 21, ry: 11 }],
  lower_abdomen: [{ cx: 60, cy: 128, rx: 13, ry: 11 }],
  lower_right: [{ cx: 43, cy: 130, rx: 9, ry: 11 }], // côté droit de la personne = à gauche sur la vue de face
  lower_left: [{ cx: 77, cy: 130, rx: 9, ry: 11 }],
  thighs: [{ cx: 48, cy: 176, rx: 10, ry: 24 }, { cx: 72, cy: 176, rx: 10, ry: 24 }],
  lower_back: [{ cx: 180, cy: 118, rx: 24, ry: 12 }],
};

export function BodyMap({ value, onToggle, intensity }: { value: string[]; onToggle: (z: PainZone) => void; intensity: number | null }) {
  const c = useCyclePalette();
  const reduce = useReduceMotion();
  const ring = useRef(new Animated.Value(1)).current;
  const [last, setLast] = useState<PainZone | null>(null);
  useEffect(() => {
    if (!last || reduce) return;
    ring.setValue(0);
    springTo(ring, 1, 'gentle', reduce).start();
  }, [last, ring, reduce]);
  const heat = intensity == null ? 0.55 : 0.35 + (intensity / 10) * 0.6;
  const body = c.pearl;
  const tap = (z: PainZone) => { haptic('selection'); setLast(z); onToggle(z); };
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center' }}>
      <Svg width="100%" height={230} viewBox="0 0 240 230" style={{ maxWidth: 360 }}>
        {/* Silhouettes abstraites : formes arrondies, sans détail anatomique */}
        <G>
          <Circle cx={60} cy={26} r={17} fill={body} />
          <Rect x={34} y={48} width={52} height={96} rx={24} fill={body} />
          <Rect x={38} y={140} width={20} height={70} rx={10} fill={body} />
          <Rect x={62} y={140} width={20} height={70} rx={10} fill={body} />
          <Circle cx={180} cy={26} r={17} fill={body} />
          <Rect x={154} y={48} width={52} height={96} rx={24} fill={body} />
          <Rect x={158} y={140} width={20} height={70} rx={10} fill={body} />
          <Rect x={182} y={140} width={20} height={70} rx={10} fill={body} />
        </G>
        {(Object.keys(SHAPES) as Exclude<PainZone, 'other'>[]).map((z) => SHAPES[z].map((s, i) => {
          const on = value.includes(z);
          return (
            <Ellipse key={`${z}${i}`} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} onPress={() => tap(z)}
              fill={on ? c.period : c.lavender} fillOpacity={on ? heat : 0.35} stroke={on ? c.period : c.estimate} strokeWidth={on ? 1.6 : 1} strokeDasharray={on ? undefined : '3 3'} />
          );
        }))}
        {last && last !== 'other' && value.includes(last) ? SHAPES[last].map((s, i) => (
          <AnimatedCircle key={`ring${i}`} cx={s.cx} cy={s.cy} fill="none" stroke={c.period} strokeWidth={1.4}
            r={ring.interpolate({ inputRange: [0, 1], outputRange: [Math.max(s.rx, s.ry), Math.max(s.rx, s.ry) + 9] })}
            opacity={ring.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] })} />
        )) : null}
        <SvgText x={60} y={226} fontSize={10} fontFamily={fonts.body} fill={c.inkSoft} textAnchor="middle">{tr('cy.pain.front')}</SvgText>
        <SvgText x={180} y={226} fontSize={10} fontFamily={fonts.body} fill={c.inkSoft} textAnchor="middle">{tr('cy.pain.back')}</SvgText>
        <SvgText x={22} y={134} fontSize={9} fontFamily={fonts.body} fill={c.inkSoft} textAnchor="middle">{tr('cy.pain.rightShort')}</SvgText>
        <SvgText x={98} y={134} fontSize={9} fontFamily={fonts.body} fill={c.inkSoft} textAnchor="middle">{tr('cy.pain.leftShort')}</SvgText>
      </Svg>
    </View>
  );
}

const DESC = (n: number) => (n === 0 ? 'none' : n <= 3 ? 'mild' : n <= 6 ? 'moderate' : n <= 8 ? 'strong' : 'severe');

/** Jauge 0–10 : glisser sur la barre, ou boutons −/+ ; ajustable au lecteur d'écran. */
export function IntensityMeter({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  const c = useCyclePalette();
  const reduce = useReduceMotion();
  const fill = useRef(new Animated.Value(value ?? 0)).current;
  const width = useRef(1);
  useEffect(() => { springTo(fill, value ?? 0, 'gentle', reduce).start(); }, [value, fill, reduce]);
  const set = (n: number) => { const v = Math.max(0, Math.min(10, Math.round(n))); if (v !== value) { haptic('selection'); onChange(v); } };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4,
    onPanResponderGrant: (e) => set((e.nativeEvent.locationX / width.current) * 10),
    onPanResponderMove: (e) => set((e.nativeEvent.locationX / width.current) * 10),
  })).current;
  const label = value == null ? tr('cy.pain.notSet') : `${value}/10 · ${tr(`cy.pain.level.${DESC(value)}` as TKey)}`;
  return (
    <View style={{ gap: spacing.xs }}
      accessible accessibilityRole="adjustable" accessibilityLabel={tr('cy.pain.intensityQ')} accessibilityValue={{ min: 0, max: 10, now: value ?? undefined, text: label }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set((value ?? 0) + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Ink variant="label" weight="medium">{tr('cy.pain.intensityQ')}</Ink>
        <Ink weight="bold" style={{ color: value != null && value >= 7 ? c.period : c.ink }}>{label}</Ink>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Step label="−" onPress={() => set((value ?? 1) - 1)} a11y={tr('cy.pain.less')} />
        <View {...pan.panHandlers} onLayout={(e: LayoutChangeEvent) => { width.current = e.nativeEvent.layout.width || 1; }}
          style={{ flex: 1, height: MIN_TOUCH, justifyContent: 'center' }}>
          <View style={{ height: 14, borderRadius: 7, backgroundColor: c.pearl, overflow: 'hidden' }}>
            <Animated.View style={{ height: 14, borderRadius: 7, backgroundColor: c.period, opacity: fill.interpolate({ inputRange: [0, 10], outputRange: [0.35, 1] }),
              width: fill.interpolate({ inputRange: [0, 10], outputRange: ['0%', '100%'] }) }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text variant="caption" color={c.inkSoft}>0</Text><Text variant="caption" color={c.inkSoft}>5</Text><Text variant="caption" color={c.inkSoft}>10</Text>
          </View>
        </View>
        <Step label="+" onPress={() => set((value ?? -1) + 1)} a11y={tr('cy.pain.more')} />
      </View>
    </View>
  );
}

function Step({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  const c = useCyclePalette();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={6}
      style={({ pressed }) => ({ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: c.line, backgroundColor: pressed ? c.lavender : 'transparent' })}>
      <Text weight="bold" color={c.ink} style={{ fontSize: 20 }}>{label}</Text>
    </Tappable>
  );
}
