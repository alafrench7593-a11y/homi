/**
 * « Ma journée biberons » : frise verticale au fil d'or de toute la journée.
 * - biberons notés (perle pleine, quantités réelles, touchés : modification) ;
 * - le suivant (perle qui pulse, mis en avant) ;
 * - créneaux oubliés : « Remplir » en un geste (heure et quantité habituelle pré-remplies, à vérifier) ;
 * - créneaux prévus jusqu'au soir (discrets).
 * Les créneaux viennent seulement du délai choisi par le parent ; sans délai, il le choisit ici en un geste.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { router } from 'expo-router';
import { GlassSurface } from '@/components/Glass';
import { Chip, Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { DELAY_PRESETS, formatHM } from '@/lib/domain/bottleTimer';
import { slotClock, type DaySlot } from '@/lib/domain/bottleDayPlan';
import { BottleClock } from './bottleClock';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const NODE = 22;

/** Ouvre la saisie d'un biberon pré-remplie (heure du créneau et quantité habituelle), toujours vérifiable avant d'enregistrer. */
export function openSlot(childId: string, slot: DaySlot, timerId?: string | null) {
  const at = Date.parse(slot.at) > Date.now() ? new Date().toISOString() : slot.at;
  router.push({
    pathname: '/track/[kind]',
    params: { kind: 'bottle', child: childId, at, from: 'day', ...(slot.suggestedMl != null ? { planned: String(slot.suggestedMl) } : {}), ...(timerId ? { timer: timerId } : {}) },
  });
}

function PulseNode({ color }: { color: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { isInteraction: false, toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return (
    <View style={{ width: NODE, height: NODE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: NODE, height: NODE, borderRadius: NODE, backgroundColor: color,
        opacity: reduce ? 0.25 : v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
        transform: [{ scale: reduce ? 1.3 : v.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }] }} />
      <View style={{ width: NODE, height: NODE, borderRadius: NODE, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="droplet" size={12} color="#FFFFFF" />
      </View>
    </View>
  );
}

export function BottleDayTimeline({ childId, slots, intervalMinutes, timerId, onPickInterval, name }: {
  childId: string;
  slots: DaySlot[];
  intervalMinutes: number | null;
  timerId?: string | null;
  /** Le parent choisit son délai (crée le rappel à partir du dernier biberon). */
  onPickInterval: (minutes: number) => void;
  name: string;
}) {
  const t = useTheme();
  const gold = t.colors.gold;
  const accent = t.colors.primary;
  const line = tint(t.isDark ? '#E7C08F' : '#B8865A', 0.55);

  if (!slots.length) {
    return (
      <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
        <View style={{ padding: spacing.lg, gap: 6 }} testID="bottle-day-empty">
          <Text variant="heading">{tr('u7.bottleDay.title')}</Text>
          <Text muted>{tr('u7.bottleDay.emptyBody', { name })}</Text>
        </View>
      </GlassSurface>
    );
  }

  const done = slots.filter((s) => s.status === 'done').length;
  return <DayCard {...{ childId, slots, intervalMinutes, timerId, onPickInterval, done, gold, accent, line }} />;
}

function DayCard({ childId, slots, intervalMinutes, timerId, onPickInterval, done, gold, accent, line }: {
  childId: string; slots: DaySlot[]; intervalMinutes: number | null; timerId?: string | null; onPickInterval: (m: number) => void; done: number; gold: string; accent: string; line: string;
}) {
  const t = useTheme();
  const [showList, setShowList] = useState(false);
  return (
    <View style={{ borderRadius: 26, borderWidth: 1, borderColor: t.isDark ? 'rgba(255,231,176,0.22)' : 'rgba(156,102,80,0.22)' }}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }} testID="bottle-day">
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text variant="heading">{tr('u7.bottleDay.title')}</Text>
          <Text variant="caption" muted>{done}/{slots.length}</Text>
        </View>
        {intervalMinutes ? (
          <Text variant="caption" muted>{tr('u7.bottleDay.every', { interval: formatHM(intervalMinutes) })}</Text>
        ) : (
          <View style={{ gap: 6 }} testID="bottle-day-pick">
            <Text variant="small" muted>{tr('u7.bottleDay.pick')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {DELAY_PRESETS.map((p) => <Chip key={p.minutes} icon="clock" label={p.label} onPress={() => onPickInterval(p.minutes)} testID={`bottle-day-interval-${p.minutes}`} />)}
            </View>
          </View>
        )}

        {/* cadran doré : la journée d'un coup d'œil */}
        <View style={{ marginTop: spacing.xs }}>
          <BottleClock childId={childId} slots={slots} timerId={timerId} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md }}>
          {[{ k: 'done', c: gold, fill: true }, { k: 'next', c: accent, fill: true }, { k: 'planned', c: gold, fill: false }].map((x) => (
            <View key={x.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: x.fill ? x.c : 'transparent', borderWidth: x.fill ? 0 : 1.5, borderColor: x.c, alignItems: 'center', justifyContent: 'center' }}>
                {x.k === 'next' ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' }} /> : null}
              </View>
              <Text variant="caption" muted>{tr(x.k === 'done' ? 'u7.bottleDay.given' : x.k === 'next' ? 'u7.bottleDay.next' : 'u7.bottleDay.planned')}</Text>
            </View>
          ))}
        </View>
        <Tappable accessibilityRole="button" onPress={() => setShowList((v) => !v)} testID="bottle-day-toggle"
          style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text variant="caption" weight="bold" color={accent}>{showList ? tr('u7.bottleDay.hide') : tr('u7.bottleDay.show')}</Text>
          <Icon name={showList ? 'chevron-up' : 'chevron-down'} size={14} color={accent} />
        </Tappable>
        {showList ? <View style={{ marginTop: spacing.xs }}>
          {slots.map((s, i) => {
            const last = i === slots.length - 1;
            const isNext = s.status === 'next';
            const color = s.status === 'done' ? gold : isNext ? accent : s.status === 'missed' ? t.colors.heart : line;
            const ml = s.status === 'done'
              ? [s.bottle?.prepared_ml != null ? tr('u7.bottleDay.prepared', { ml: s.bottle.prepared_ml }) : null, s.bottle?.consumed_ml != null ? tr('u7.bottleDay.drunk', { ml: s.bottle.consumed_ml }) : null].filter(Boolean).join(' · ') || tr('u7.bottleDay.noted')
              : s.suggestedMl != null ? tr('u7.bottleDay.usual', { ml: s.suggestedMl }) : tr('u7.bottleDay.qty');
            const label = s.status === 'done' ? tr('u7.bottleDay.given') : isNext ? tr('u7.bottleDay.next') : s.status === 'missed' ? tr('u7.bottleDay.toFill') : tr('u7.bottleDay.planned');
            return (
              <View key={`${s.at}-${i}`} style={{ flexDirection: 'row', gap: spacing.md }}>
                {/* fil d'or vertical et perles */}
                <View style={{ width: NODE, alignItems: 'center' }}>
                  {isNext ? <PulseNode color={accent} /> : (
                    <View style={{ width: NODE, height: NODE, borderRadius: NODE, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: s.status === 'done' ? gold : 'transparent', borderWidth: s.status === 'done' ? 0 : 2, borderColor: color, borderStyle: s.status === 'missed' ? 'dashed' : 'solid' }}>
                      {s.status === 'done' ? <Icon name="check" size={13} color="#FFFFFF" /> : null}
                    </View>
                  )}
                  {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: line, marginVertical: 2, borderRadius: 1 }} /> : null}
                </View>
                <Tappable
                  bare
                  accessibilityRole="button"
                  accessibilityLabel={tr(s.status === 'done' ? 'u7.bottleDay.a11yDone' : s.status === 'planned' ? 'u7.bottleDay.a11yPlanned' : 'u7.bottleDay.a11yFill', { label, clock: slotClock(s.at), ml })}
                  disabled={s.status === 'planned'}
                  onPress={() => (s.status === 'done' && s.bottle ? router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: childId, id: s.bottle.id } }) : openSlot(childId, s, timerId))}
                  testID={`bottle-slot-${i}`}
                  style={{ flex: 1, marginBottom: last ? 0 : spacing.sm, paddingVertical: isNext ? spacing.sm : 2, paddingHorizontal: isNext ? spacing.md : 0, borderRadius: 18,
                    backgroundColor: isNext ? tint(accent, t.isDark ? 0.18 : 0.1) : 'transparent', borderWidth: isNext ? 1 : 0, borderColor: tint(accent, 0.35) }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                        <Text weight="bold" style={{ fontSize: isNext ? 22 : 17, opacity: s.status === 'planned' ? 0.7 : 1 }}>{slotClock(s.at)}</Text>
                        <Text variant="caption" weight="bold" color={s.status === 'planned' ? t.colors.textMuted : color}>{label.toUpperCase()}</Text>
                      </View>
                      <Text variant="small" muted>{ml}</Text>
                    </View>
                    {s.status === 'done' ? <Icon name="edit-2" size={15} color={t.colors.textMuted} /> : s.status === 'planned' ? <Icon name="clock" size={15} color={t.colors.textMuted} /> : (
                      <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: isNext ? accent : tint(accent, t.isDark ? 0.2 : 0.12) }}>
                        <Text variant="caption" weight="bold" color={isNext ? t.colors.primaryText : accent}>{isNext ? tr('u7.bottleDay.log') : tr('u7.bottleDay.fill')}</Text>
                      </View>
                    )}
                  </View>
                </Tappable>
              </View>
            );
          })}
        </View> : null}
        <Text variant="caption" muted>{tr('u7.bottleDay.footer')}</Text>
      </View>
    </View>
  );
}
