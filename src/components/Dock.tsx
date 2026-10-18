/**
 * Barre de navigation flottante « Neuf lunes » : 5 onglets + bouton central « + »
 * qui ouvre l'ajout rapide (et « Poser une question », accessible de partout).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { springTo } from '@/theme/motion';
import { usePressMotion } from './Motion';
import { fonts, NACRE, palette, radius, spacing } from '@/theme/tokens';
import { useActiveSubject, useChildren } from '@/lib/data/hooks';
import { Sheet } from './Overlays';
import { haptic, Icon, type IconName, Text } from './ui';

const TAB_ICONS: Record<string, IconName> = { index: 'home', track: 'activity', ask: 'message-circle', community: 'users', profile: 'user' };
const SHORT: Record<string, string> = { index: 'Accueil', track: 'Suivi', ask: 'Questions', community: 'Communauté', profile: 'Profil' };

export const DOCK_HEIGHT = 74;

/** Icône d'onglet : petit rebond quand l'onglet devient actif. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { springTo(v, focused ? 1 : 0, 'pop', reduce).start(); }, [v, focused, reduce]);
  return (
    <Animated.View style={{ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }) }] }}>
      <Feather name={name} size={21} color={focused ? '#FFFFFF' : 'rgba(255,241,245,0.5)'} />
    </Animated.View>
  );
}

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2);
  // Pastille lumineuse qui glisse sous l'onglet actif
  const [tabX, setTabX] = useState<Record<number, { x: number; w: number }>>({});
  const pillX = useRef(new Animated.Value(0)).current;
  const pillW = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const p = tabX[state.index];
    if (!p) return;
    springTo(pillX, p.x, 'gentle', reduce).start();
    springTo(pillW, p.w, 'gentle', reduce).start();
  }, [state.index, tabX, pillX, pillW, reduce]);
  const plus = useRef(new Animated.Value(0)).current;
  useEffect(() => { springTo(plus, open ? 1 : 0, 'pop', reduce).start(); }, [open, plus, reduce]);
  const plusPress = usePressMotion({ pressed: 0.9, hoverLift: -2 });

  const renderTab = (route: (typeof routes)[number]) => {
    const index = routes.indexOf(route);
    const focused = state.index === index;
    const label = SHORT[route.name] ?? descriptors[route.key].options.title ?? route.name;
    return (
      <Pressable
        key={route.key}
        onLayout={(e) => { const { x, width } = e.nativeEvent.layout; setTabX((m) => (m[index]?.x === x && m[index]?.w === width ? m : { ...m, [index]: { x, w: width } })); }}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={descriptors[route.key].options.title ?? label}
        onPress={() => {
          const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !ev.defaultPrevented) {
            haptic('selection');
            navigation.navigate(route.name);
          }
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 56 }}
      >
        <TabIcon name={TAB_ICONS[route.name] ?? 'circle'} focused={focused} />
        <Text style={{ fontFamily: focused ? fonts.bodyMedium : fonts.body, fontSize: label.length > 9 ? 8.5 : 9.5, lineHeight: 12, letterSpacing: label.length > 9 ? -0.3 : -0.1 }} color={focused ? '#FFFFFF' : 'rgba(255,241,245,0.5)'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label}
        </Text>

      </Pressable>
    );
  };

  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: spacing.sm }}>
        <View style={{ height: DOCK_HEIGHT - 10, borderRadius: radius.pill, backgroundColor: Platform.OS === 'android' ? t.colors.tabBar : 'transparent', marginHorizontal: spacing.xs, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
          {Platform.OS !== 'android' ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, overflow: 'hidden' }]}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.tabBar }]} />
              <View style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
          ) : null}
          {tabX[state.index] ? (
            <>
              {/* Les onglets ont la même largeur : seule la position glisse (transform uniquement) */}
              <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 7, bottom: 7, left: 0, width: tabX[state.index].w, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.10)', transform: [{ translateX: pillX }] }} />
              <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 10, left: -2, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold, transform: [{ translateX: Animated.add(pillX, Animated.multiply(pillW, 0.5)) }] }} />
            </>
          ) : null}
          {left.map(renderTab)}
          <View style={{ width: 58, alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter ou poser une question"
              onPress={() => { haptic('light'); setOpen(true); }}
              {...plusPress.handlers}
            >
              <Animated.View style={[{ width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, plusPress.style]}>
                <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 12, right: 12, height: 1, backgroundColor: 'rgba(255,255,255,0.7)' }} />
                <Animated.View style={{ transform: [{ rotate: plus.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] }) }] }}>
                  <Feather name="plus" size={26} color="#FFFFFF" />
                </Animated.View>
              </Animated.View>
            </Pressable>
          </View>
          {right.map(renderTab)}
        </View>
      </View>
      <QuickAddSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function QuickAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const childId = subject.type === 'child' ? subject.id : children?.[0]?.id;
  const child = children?.find((c) => c.id === childId);
  const go = (fn: () => void) => () => { onClose(); setTimeout(fn, 180); };
  const track = (kind: string) => go(() => router.push({ pathname: '/track/[kind]', params: { kind, child: childId ?? '' } }));

  const items: { icon: IconName; label: string; onPress: () => void; show: boolean }[] = [
    { icon: 'coffee', label: 'Biberon', onPress: track('bottle'), show: !!child },
    { icon: 'droplet', label: 'Tétée', onPress: track('breastfeed'), show: !!child },
    { icon: 'wind', label: 'Couche', onPress: track('diaper'), show: !!child },
    { icon: 'moon', label: 'Sommeil', onPress: go(() => router.push('/night')), show: !!child },
    { icon: 'feather', label: 'Repas', onPress: track('meal'), show: !!child },
    { icon: 'thermometer', label: 'Note santé', onPress: track('observation'), show: !!child },
    { icon: 'heart', label: 'Mon humeur', onPress: go(() => router.push('/me/mood')), show: true },
    { icon: 'clock', label: 'Minuteur biberon', onPress: go(() => router.push(childId ? `/bottle/${childId}` : '/bottle')), show: !!child },
    { icon: 'maximize', label: 'Scanner', onPress: go(() => router.push('/scanner')), show: true },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title={child ? `Pour ${child.first_name}` : 'Ajouter'}>
      <Pressable
        accessibilityRole="button"
        onPress={go(() => router.push('/assistant/chat'))}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,143,177,0.35)', backgroundColor: pressed ? palette.nightSoft : palette.night })}
      >
        <Icon name="message-circle" color={palette.gold} />
        <View style={{ flex: 1 }}>
          <Text weight="bold" color={palette.milk}>Poser une question</Text>
          <Text variant="small" color="rgba(251,248,244,0.7)">L’assistant répond avec ses sources</Text>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {items.filter((i) => i.show).map((i) => (
          <Pressable
            key={i.label}
            accessibilityRole="button"
            accessibilityLabel={i.label}
            onPress={i.onPress}
            style={({ pressed }) => ({ width: '23%', flexGrow: 1, aspectRatio: 1, borderRadius: radius.lg, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.background, alignItems: 'center', justifyContent: 'center', gap: 6 })}
          >
            <Icon name={i.icon} color={t.colors.text} />
            <Text variant="caption" weight="medium" center>{i.label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
