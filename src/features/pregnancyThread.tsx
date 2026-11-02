/**
 * Frise de la grossesse au fil d'or (même langage que « Ma journée biberons ») : perles reliées par un fil doré.
 * Aujourd'hui pulse, le prochain rendez-vous ou la prochaine fenêtre est mis en avant ; touchés, ils s'ouvrent.
 * Les libellés sont fournis par l'écran (traduits) : ce composant n'affiche aucun texte en dur.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { GlassSurface } from '@/components/Glass';
import { Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import type { PregThreadItem } from '@/lib/domain/pregnancyThread';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';

const NODE = 20;
const ICON: Record<PregThreadItem['kind'], IconName> = { today: 'heart', echo: 'radio', appt: 'calendar', due: 'star' };

function Pulse({ color, icon }: { color: string; icon: IconName }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { isInteraction: false, toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { isInteraction: false, toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  return (
    <View style={{ width: NODE, height: NODE, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: NODE, height: NODE, borderRadius: NODE, backgroundColor: color,
        opacity: reduce ? 0.25 : v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: reduce ? 1.3 : v.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }] }} />
      <View style={{ width: NODE, height: NODE, borderRadius: NODE, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={11} color="#FFFFFF" />
      </View>
    </View>
  );
}

export function PregnancyThread({ title, caption, items, labelOf, onPress, testID = 'preg-thread' }: {
  title: string;
  caption?: string;
  items: PregThreadItem[];
  /** Titre, détail et étiquette d'état (traduits) d'un élément. */
  labelOf: (i: PregThreadItem) => { title: string; sub?: string; tag?: string };
  onPress?: (i: PregThreadItem) => void;
  testID?: string;
}) {
  const t = useTheme();
  const gold = t.colors.gold;
  const accent = t.colors.primary;
  const line = tint(t.isDark ? '#E7C08F' : '#B8865A', 0.55);
  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }} testID={testID}>
        <Text variant="heading">{title}</Text>
        {caption ? <Text variant="caption" muted>{caption}</Text> : null}
        <View style={{ marginTop: spacing.xs }}>
          {items.map((it, i) => {
            const last = i === items.length - 1;
            const l = labelOf(it);
            const isToday = it.kind === 'today';
            const isNext = it.state === 'next';
            const color = it.state === 'done' ? gold : isToday ? accent : isNext ? accent : line;
            const tappable = !!onPress && !isToday && it.kind !== 'due';
            return (
              <View key={it.key} style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ width: NODE, alignItems: 'center' }}>
                  {isToday || isNext ? <Pulse color={accent} icon={ICON[it.kind]} /> : (
                    <View style={{ width: NODE, height: NODE, borderRadius: NODE, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: it.state === 'done' || it.kind === 'due' ? gold : 'transparent', borderWidth: it.state === 'done' || it.kind === 'due' ? 0 : 2, borderColor: color }}>
                      <Icon name={it.state === 'done' ? 'check' : ICON[it.kind]} size={11} color={it.state === 'done' || it.kind === 'due' ? '#FFFFFF' : color} />
                    </View>
                  )}
                  {!last ? <View style={{ flex: 1, width: 2, minHeight: 16, backgroundColor: line, marginVertical: 2, borderRadius: 1 }} /> : null}
                </View>
                <Tappable
                  bare
                  disabled={!tappable}
                  accessibilityRole={tappable ? 'button' : 'text'}
                  accessibilityLabel={[l.tag, l.title, l.sub].filter(Boolean).join(' · ')}
                  onPress={() => tappable && onPress?.(it)}
                  testID={`${testID}-${it.key}`}
                  style={{ flex: 1, marginBottom: last ? 0 : spacing.sm, paddingVertical: isNext || isToday ? spacing.sm : 2, paddingHorizontal: isNext || isToday ? spacing.md : 0, borderRadius: 18,
                    backgroundColor: isNext || isToday ? tint(accent, t.isDark ? 0.18 : 0.1) : 'transparent', borderWidth: isNext || isToday ? 1 : 0, borderColor: tint(accent, 0.35) }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8 }}>
                        <Text weight="bold" style={{ fontSize: isToday || isNext ? 18 : 16, opacity: it.state === 'later' ? 0.75 : 1 }}>{l.title}</Text>
                        {l.tag ? <Text variant="caption" weight="bold" color={it.state === 'later' ? t.colors.textMuted : color}>{l.tag.toUpperCase()}</Text> : null}
                      </View>
                      {l.sub ? <Text variant="small" muted>{l.sub}</Text> : null}
                    </View>
                    {tappable ? <Icon name="chevron-right" size={16} color={t.colors.textMuted} /> : null}
                  </View>
                </Tappable>
              </View>
            );
          })}
        </View>
      </View>
    </GlassSurface>
  );
}
