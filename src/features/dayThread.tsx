/**
 * Frise de la journée au fil d'or (même langage que « Ma journée biberons ») : perles le long d'un fil,
 * élément suivant mis en avant et qui pulse, action en un geste sur chaque ligne (cocher, s'en charger,
 * confirmer…). Utilisée par l'organisation familiale, l'agenda, les rendez-vous et le relais de nuit.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { GlassSurface } from '@/components/Glass';
import { Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { THREAD_LABEL, type ThreadState } from '@/lib/domain/dayThread';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const NODE = 22;

export interface ThreadRow {
  key: string;
  state: ThreadState;
  time: string;
  title: string;
  sub?: string | null;
  icon?: IconName;
  onPress?: () => void;
  action?: { label: string; onPress: () => void; testID?: string; strong?: boolean };
  /** Seconde action, plus discrète (ex. « Confier à … », 07/11/2026). */
  action2?: { label: string; onPress: () => void; testID?: string };
  /** Libellé d'état personnalisé (sinon celui de la frise). */
  tag?: string;
  testID?: string;
}

function Pulse({ color, icon }: { color: string; icon: IconName }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { isInteraction: false, toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
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
        <Icon name={icon} size={12} color="#FFFFFF" />
      </View>
    </View>
  );
}

export function DayThread({ title, caption, rows, empty, right, testID }: {
  title: string;
  caption?: string;
  rows: ThreadRow[];
  empty?: React.ReactNode;
  right?: React.ReactNode;
  testID?: string;
}) {
  const t = useTheme();
  const gold = t.colors.gold;
  const accent = t.colors.primary;
  const line = tint(t.isDark ? '#E9CFA4' : '#76561D', 0.55);
  const done = rows.filter((r) => r.state === 'done').length;
  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }} testID={testID}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
          <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>{title}</Text>
          {right ?? (rows.length ? <Text variant="caption" muted>{done}/{rows.length}</Text> : null)}
        </View>
        {caption ? <Text variant="caption" muted>{caption}</Text> : null}
        {!rows.length ? empty ?? null : (
          <View style={{ marginTop: spacing.xs }}>
            {rows.map((r, i) => {
              const last = i === rows.length - 1;
              const hot = r.state === 'next' || r.state === 'now';
              const color = r.state === 'done' ? gold : hot ? accent : r.state === 'late' ? t.colors.heart : line;
              const faded = r.state === 'past' || r.state === 'todo' || r.state === 'anytime';
              return (
                <View key={r.key} style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ width: NODE, alignItems: 'center' }}>
                    {hot ? <Pulse color={accent} icon={r.icon ?? 'circle'} /> : (
                      <View style={{ width: NODE, height: NODE, borderRadius: NODE, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: r.state === 'done' ? gold : 'transparent', borderWidth: r.state === 'done' ? 0 : 2, borderColor: color, borderStyle: r.state === 'late' || r.state === 'anytime' ? 'dashed' : 'solid' }}>
                        {r.state === 'done' ? <Icon name="check" size={13} color="#FFFFFF" /> : null}
                      </View>
                    )}
                    {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: line, marginVertical: 2, borderRadius: 1 }} /> : null}
                  </View>
                  <Tappable bare disabled={!r.onPress} onPress={r.onPress} accessibilityRole={r.onPress ? 'button' : undefined}
                    accessibilityLabel={`${r.tag ?? THREAD_LABEL[r.state]} : ${r.time ? `${r.time}, ` : ''}${r.title}${r.sub ? `, ${r.sub}` : ''}`}
                    testID={r.testID}
                    style={{ flex: 1, marginBottom: last ? 0 : spacing.sm, paddingVertical: hot ? spacing.sm : 2, paddingHorizontal: hot ? spacing.md : 0, borderRadius: 18,
                      backgroundColor: hot ? tint(accent, t.isDark ? 0.18 : 0.1) : 'transparent', borderWidth: hot ? 1 : 0, borderColor: tint(accent, 0.35) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ flex: 1, opacity: faded ? 0.78 : 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                          {r.time ? <Text weight="bold" style={{ fontSize: hot ? 20 : 16 }}>{r.time}</Text> : null}
                          <Text variant="caption" weight="bold" color={faded ? t.colors.textMuted : color}>{(r.tag ?? THREAD_LABEL[r.state]).toUpperCase()}</Text>
                        </View>
                        <Text weight={hot ? 'bold' : 'medium'} style={{ textDecorationLine: r.state === 'done' ? 'line-through' : 'none' }} numberOfLines={2}>{r.title}</Text>
                        {r.sub ? <Text variant="caption" muted numberOfLines={2}>{r.sub}</Text> : null}
                      </View>
                      {r.action || r.action2 ? (
                        <View style={{ alignItems: 'flex-end', gap: 6 }}>
                          {r.action ? (
                            <Tappable bare onPress={r.action.onPress} accessibilityRole="button" accessibilityLabel={`${r.action.label} : ${r.title}`} testID={r.action.testID} hitSlop={8}
                              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: r.action.strong || hot ? accent : tint(accent, t.isDark ? 0.2 : 0.12) }}>
                              <Text variant="caption" weight="bold" color={r.action.strong || hot ? t.colors.primaryText : accent}>{r.action.label}</Text>
                            </Tappable>
                          ) : null}
                          {r.action2 ? (
                            <Tappable bare onPress={r.action2.onPress} accessibilityRole="button" accessibilityLabel={`${r.action2.label} : ${r.title}`} testID={r.action2.testID} hitSlop={8}
                              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: tint(accent, 0.4) }}>
                              <Text variant="caption" weight="bold" color={accent}>{r.action2.label}</Text>
                            </Tappable>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </Tappable>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </GlassSurface>
  );
}

/** Heure courte « 14 h 30 ». */
export const clockFr = (iso: string) => { const d = new Date(iso); return tr('dom.time.hm', { h: String(d.getHours()), m: String(d.getMinutes()).padStart(2, '0') }); };
