/**
 * Frise verticale au fil d'or (même langage que « Ma journée biberons ») : perles reliées par un fil doré.
 * - done : perle dorée pleine cochée ;
 * - now : perle qui pulse, ligne mise en avant (c'est le moment) ;
 * - planned : perle cerclée (prévu, rendez-vous) ;
 * - later : perle discrète.
 * Chaque ligne peut porter une action en un geste (pilule à droite).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';

export type GoldState = 'done' | 'now' | 'planned' | 'later';

export interface GoldItem {
  key: string;
  title: string;
  subtitle?: string;
  /** Petite étiquette (« Fait », « Bientôt »…). */
  tag?: string;
  state: GoldState;
  icon?: IconName;
  onPress?: () => void;
  action?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
  a11y?: string;
}

const NODE = 22;

function Pulse({ color }: { color: string }) {
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
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: NODE, height: NODE, borderRadius: NODE, backgroundColor: color,
      opacity: reduce ? 0.25 : v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
      transform: [{ scale: reduce ? 1.3 : v.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }] }} />
  );
}

export function GoldTimeline({ items, testID }: { items: GoldItem[]; testID?: string }) {
  const t = useTheme();
  const gold = t.colors.gold;
  const accent = t.colors.primary;
  const line = tint(t.isDark ? '#E7C08F' : '#B8865A', 0.55);
  return (
    <View testID={testID}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const now = it.state === 'now';
        const color = it.state === 'done' ? gold : now ? accent : it.state === 'planned' ? accent : line;
        const actionBtn = it.action ? (
          <Tappable bare accessibilityRole="button" accessibilityLabel={`${it.action.label} — ${it.title}`} onPress={it.action.onPress} testID={it.action.testID} hitSlop={8}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: now ? accent : tint(accent, t.isDark ? 0.2 : 0.12) }}>
            <Text variant="caption" weight="bold" color={now ? t.colors.primaryText : accent}>{it.action.label}</Text>
          </Tappable>
        ) : null;
        // carte cliquable + action : l'action est posée sur la carte et non dedans (un bouton dans un bouton est invalide sur le web)
        const overlay = !!it.action && !!it.onPress;
        const body = (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1, gap: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <Text weight="bold" style={{ fontSize: now ? 18 : 16, opacity: it.state === 'later' ? 0.75 : 1 }}>{it.title}</Text>
                {it.tag ? <Text variant="caption" weight="bold" color={it.state === 'later' ? t.colors.textMuted : color}>{it.tag.toUpperCase()}</Text> : null}
              </View>
              {it.subtitle ? <Text variant="small" muted>{it.subtitle}</Text> : null}
            </View>
            {it.action ? (overlay ? (
              // place réservée (invisible) pour le bouton posé au-dessus de la carte
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ paddingHorizontal: 12, paddingVertical: 7, opacity: 0 }}>
                <Text variant="caption" weight="bold">{it.action.label}</Text>
              </View>
            ) : actionBtn) : it.onPress ? <Icon name="chevron-right" size={16} color={t.colors.textMuted} /> : null}
          </View>
        );
        return (
          <View key={it.key} style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ width: NODE, alignItems: 'center' }}>
              <View style={{ width: NODE, height: NODE, alignItems: 'center', justifyContent: 'center' }}>
                {now ? <Pulse color={accent} /> : null}
                <View style={{ width: NODE, height: NODE, borderRadius: NODE, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: it.state === 'done' ? gold : now ? accent : 'transparent', borderWidth: it.state === 'done' || now ? 0 : 2, borderColor: color }}>
                  {it.state === 'done' ? <Icon name="check" size={13} color="#FFFFFF" /> : now ? <Icon name={it.icon ?? 'star'} size={12} color="#FFFFFF" /> : it.state === 'planned' ? <Icon name="calendar" size={11} color={accent} /> : null}
                </View>
              </View>
              {!last ? <View style={{ flex: 1, width: 2, minHeight: 16, backgroundColor: line, marginVertical: 2, borderRadius: 1 }} /> : null}
            </View>
            <View style={{ flex: 1, marginBottom: last ? 0 : spacing.sm }}>
              {it.onPress ? (
                <Tappable bare accessibilityRole="button" accessibilityLabel={it.a11y ?? [it.title, it.tag, it.subtitle].filter(Boolean).join(', ')} onPress={it.onPress} testID={it.testID}
                  style={{ paddingVertical: now ? spacing.sm : 2, paddingHorizontal: now ? spacing.md : 0, borderRadius: 18,
                    backgroundColor: now ? tint(accent, t.isDark ? 0.18 : 0.1) : 'transparent', borderWidth: now ? 1 : 0, borderColor: tint(accent, 0.35) }}>
                  {body}
                </Tappable>
              ) : null}
              {it.onPress && overlay ? (
                <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: last ? 0 : spacing.sm, right: now ? spacing.md : 0, justifyContent: 'center' }}>
                  {actionBtn}
                </View>
              ) : null}
              {it.onPress ? null : (
                <View testID={it.testID} style={{ paddingVertical: now ? spacing.sm : 2, paddingHorizontal: now ? spacing.md : 0, borderRadius: 18,
                  backgroundColor: now ? tint(accent, t.isDark ? 0.18 : 0.1) : 'transparent', borderWidth: now ? 1 : 0, borderColor: tint(accent, 0.35) }}>
                  {body}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
