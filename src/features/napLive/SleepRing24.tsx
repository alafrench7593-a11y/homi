/**
 * Anneau du sommeil sur 24 h (refonte « motion », lot 2 — 24/11/2026).
 * Cadran de 24 h (minuit en haut) : chaque sommeil NOTÉ est un arc à son heure réelle ; nuit pleine, sieste plus claire ;
 * un sommeil en cours s'arrête au repère « maintenant ». Total cumulé au centre. Le reste est « rien de noté » (jamais
 * « éveil »). Aucune phase inventée. Toucher un arc sélectionne la même sieste que la frise (selectedId / onSelect).
 * Animation : tracé progressif des arcs (désactivé avec « Réduire les animations ») ; données = la source de vérité.
 */
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Card, Row, Text } from '@/components/ui';
import { tint } from '@/components/ToolGlyph';
import { formatDuration } from '@/lib/domain/dates';
import { arcPath, sleepRing } from '@/lib/domain/sleepRing';
import type { Sleep } from '@/lib/types';
import { useMotion } from '@/motion/useMotion';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const SIZE = 236;
const C = SIZE / 2;
const R = 86;
const STROKE = 16;

function Arc({ d, length, color, width, progress, selected, onPress, testID, label }: {
  d: string; length: number; color: string; width: number; progress: { value: number }; selected: boolean;
  onPress?: () => void; testID: string; label: string;
}) {
  const props = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));
  return (
    <AnimatedPath d={d} stroke={color} strokeWidth={selected ? width + 4 : width} strokeLinecap="round" fill="none"
      strokeDasharray={`${length} ${length}`} animatedProps={props} onPress={onPress} testID={testID}
      accessibilityLabel={label} />
  );
}

export function SleepRing24({ childId, sleeps, now, selectedId, onSelect, testID = 'sleep-ring' }: {
  childId: string; sleeps: readonly Sleep[]; now: Date; selectedId?: string | null; onSelect?: (id: string) => void; testID?: string;
}) {
  const t = useTheme();
  const motion = useMotion();
  // Recalcul à la minute : `now` change chaque seconde ailleurs, l'anneau n'a pas besoin de plus
  const minute = Math.floor(now.getTime() / 60_000);
  const ring = useMemo(() => sleepRing(sleeps, childId, new Date(minute * 60_000)), [sleeps, childId, minute]);
  const progress = useSharedValue(motion.off ? 1 : 0);
  const sig = ring.arcs.map((a) => `${a.id}:${Math.round(a.minutes)}`).join('|');
  useEffect(() => { progress.value = 0; progress.value = motion.timing(1, 700); }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  const night = t.colors.primary;
  const nap = tint(t.colors.primary, 0.55);
  const nowRad = ((ring.nowAngle - 90) * Math.PI) / 180;
  const a11y = tr('sr.a11y', { total: formatDuration(ring.totalMin), night: formatDuration(ring.nightMin), nap: formatDuration(ring.napMin) });

  return (
    <Card testID={testID}>
      <View style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text weight="bold">{tr('sr.title')}</Text>
          <Text variant="caption" muted>{tr('sr.window')}</Text>
        </Row>
        <View style={{ alignItems: 'center' }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
          <View style={{ width: SIZE, height: SIZE }}>
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {/* piste : rien de noté */}
              <Circle cx={C} cy={C} r={R} stroke={t.colors.border} strokeWidth={STROKE} fill="none" strokeDasharray="2 4" />
              {/* heures repères */}
              {[0, 6, 12, 18].map((h) => {
                const rad = ((h * 15 - 90) * Math.PI) / 180;
                return (
                  <SvgText key={h} x={C + (R + STROKE + 6) * Math.cos(rad)} y={C + (R + STROKE + 6) * Math.sin(rad) + 4} fontSize={10} fill={t.colors.textMuted} textAnchor="middle" fontFamily={fonts.body}>{`${h}h`}</SvgText>
                );
              })}
              <G>
                {ring.arcs.map((a) => (
                  <Arc key={a.id} d={arcPath(C, C, R, a.from, a.to)} length={(R * Math.PI * (a.to - a.from)) / 180}
                    color={a.kind === 'night' ? night : nap} width={STROKE} progress={progress} selected={a.id === selectedId}
                    onPress={onSelect ? () => onSelect(a.id) : undefined} testID={`${testID}-arc-${a.id}`}
                    label={`${a.kind === 'night' ? tr('sr.night') : tr('sr.nap')} ${formatDuration(a.minutes)}`} />
                ))}
              </G>
              {/* maintenant */}
              <Line x1={C + (R - STROKE) * Math.cos(nowRad)} y1={C + (R - STROKE) * Math.sin(nowRad)} x2={C + (R + STROKE) * Math.cos(nowRad)} y2={C + (R + STROKE) * Math.sin(nowRad)}
                stroke={t.colors.text} strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
            <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text weight="bold" style={{ fontSize: 26, lineHeight: 30, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2} testID={`${testID}-total`}>
                {ring.totalMin ? formatDuration(ring.totalMin) : '—'}
              </Text>
              <Text variant="caption" muted maxFontSizeMultiplier={1.2}>{tr('sr.noted')}</Text>
            </View>
          </View>
        </View>
        {ring.totalMin ? (
          <Row wrap style={{ justifyContent: 'center', columnGap: spacing.md }}>
            {ring.nightMin ? <Legend color={night} label={`${tr('sr.night')} · ${formatDuration(ring.nightMin)}`} /> : null}
            {ring.napMin ? <Legend color={nap} label={`${tr('sr.nap')} · ${formatDuration(ring.napMin)}`} /> : null}
            <Legend color={t.colors.border} dashed label={tr('sr.none')} />
          </Row>
        ) : <Text variant="small" muted center testID={`${testID}-empty`}>{tr('sr.empty')}</Text>}
      </View>
    </Card>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <Row gap={6} style={{ alignItems: 'center' }}>
      <View style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: dashed ? 'transparent' : color, borderWidth: dashed ? 1 : 0, borderStyle: 'dashed', borderColor: color }} />
      <Text variant="caption" muted>{label}</Text>
    </Row>
  );
}
