/** Éléments partagés des écrans d'allaitement : enfant concerné, libellés, anneau du chronomètre, barres des volumes. */
import React from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui';
import { useActiveSubject, useTrackedChildren } from '@/lib/data/hooks';
import { durationParts, type MilkKind } from '@/lib/domain/lactation';
import { formatTime } from '@/lib/domain/dates';
import type { Child } from '@/lib/types';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

/** Enfant concerné : celui de l'adresse s'il est suivi, sinon le profil affiché, sinon le premier enfant suivi. */
export function useFeedingChild(param?: string | null): { child: Child | null; children: Child[]; loading: boolean; name: string | null } {
  const q = useTrackedChildren();
  const { subject } = useActiveSubject();
  const list = q.data ?? [];
  const id = (param && list.some((c) => c.id === param) ? param : null)
    ?? (subject.type === 'child' && list.some((c) => c.id === subject.id) ? subject.id : list[0]?.id) ?? null;
  const child = list.find((c) => c.id === id) ?? null;
  // Prénom seulement s'il existe
  const name = child?.first_name?.trim() ? child.first_name.trim() : null;
  return { child, children: list, loading: (q.isLoading && !q.data), name };
}

export const sideWord = (s: 'left' | 'right' | 'both') => tr(s === 'left' ? 'lac.side.leftLower' : s === 'right' ? 'lac.side.rightLower' : 'lac.side.bothLower');
export const sideTitle = (s: 'left' | 'right' | 'both') => tr(s === 'left' ? 'lac.side.left' : s === 'right' ? 'lac.side.right' : 'lac.side.both');
/** « gauche puis droit » (ordre des passages, sans répétition). */
export function sidesPhrase(sides: ('left' | 'right' | 'both')[]): string {
  const words = sides.map(sideWord);
  if (words.length <= 1) return words[0] ?? '';
  return words.slice(1).reduce((acc, w) => tr('lac.side.then', { a: acc, b: w }), words[0]);
}
export const milkWord = (k: MilkKind) => tr(`lac.hist.milk.${k}` as TKey);

/** « 12 minutes 5 secondes » (lecteurs d'écran) */
export function durationPhrase(ms: number): string {
  const p = durationParts(ms);
  return [p.h ? tr('lac.timer.h', { count: p.h }) : null, p.m || p.h ? tr('lac.timer.m', { count: p.m }) : null, tr('lac.timer.s', { count: p.s })].filter(Boolean).join(' ');
}
/** « 14 min », « 1 h 05 » (affichage court, sans secondes) */
export function shortDuration(ms: number): string {
  const p = durationParts(ms + 30_000);
  return p.h ? `${p.h} h ${String(p.m).padStart(2, '0')}` : `${p.m} min`;
}
export const at = (iso: string) => formatTime(iso);

/**
 * Anneau du chronomètre : un fil qui tourne lentement et un halo qui respire tant que la tétée est en cours.
 * Il ne se remplit jamais et ne marque aucune durée : rien n'indique un temps « attendu ».
 * Animations natives (transform, opacité) ; immobile si « réduire les animations » est activé ou en pause.
 */
export function FeedRing({ running, size = 228, children, testID }: { running: boolean; size?: number; children: React.ReactNode; testID?: string }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const spin = React.useRef(new Animated.Value(0)).current;
  const breathe = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!running || reduce) { spin.stopAnimation(); breathe.stopAnimation(); breathe.setValue(0); return; }
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14_000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    const b = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    spin.setValue(0);
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, [running, reduce, spin, breathe]);
  const stroke = 3;
  const r = size / 2 - 10;
  const dot = 12;
  return (
    <View style={{ width: size, height: size, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }} testID={testID} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={{ position: 'absolute', width: size, height: size, opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [running ? 0.55 : 0.3, 0.95] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.colors.primary} strokeOpacity={t.isDark ? 0.5 : 0.35} strokeWidth={stroke} fill="none" />
        </Svg>
      </Animated.View>
      {running ? (
        <Animated.View style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
          <View style={{ position: 'absolute', top: 10 - dot / 2 + stroke / 2, left: size / 2 - dot / 2, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: t.colors.primary }} />
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

/** Le libellé du sein glisse et apparaît en fondu à chaque changement (transition discrète). */
export function SideSwap({ side, children }: { side: string; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = React.useRef(new Animated.Value(1)).current;
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (reduce) { v.setValue(1); return; }
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }).start();
  }, [side, reduce, v]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [side === 'right' ? 24 : -24, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

/** Barres simples des volumes par jour, sans seuil ni ligne de référence ; l'équivalent textuel est fourni à côté. */
export function VolumeBars({ values, labels, height = 96, testID }: { values: number[]; labels: string[]; height?: number; testID?: string }) {
  const t = useTheme();
  const max = Math.max(1, ...values);
  const dense = values.length > 10;
  return (
    <View style={{ gap: 4 }} testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: values.length > 10 ? 2 : 6 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, height: v ? Math.max(4, (v / max) * height) : 2, borderRadius: values.length > 10 ? 2 : 6, backgroundColor: v ? t.colors.primary : t.colors.border, opacity: v ? 0.85 : 0.6 }} />
        ))}
      </View>
      {dense ? (
        // 30 jours : seules la première et la dernière date tiennent sous les barres
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" muted style={{ fontSize: 11 }}>{labels[0]}</Text>
          <Text variant="caption" muted style={{ fontSize: 11 }}>{labels[labels.length - 1]}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {labels.map((l, i) => <Text key={i} variant="caption" muted center style={{ flex: 1, fontSize: 11 }}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

export const gap = spacing.md;
