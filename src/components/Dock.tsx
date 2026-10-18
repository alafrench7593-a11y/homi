/**
 * Barre de navigation flottante : Accueil · Suivi · [Outils] · Questions · Profil.
 * « Outils » est au centre GÉOMÉTRIQUE (deux moitiés de largeur égale). Appui long sur « Outils » :
 * ajout rapide (ancien bouton « + »), aussi présent en haut de la page Outils.
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
import { fonts, NACRE, NATIVE_DRIVER, palette, radius, spacing } from '@/theme/tokens';
import { PulseRing } from './MotionKit';
import { useActiveSubject, useChildren } from '@/lib/data/hooks';
import { Sheet } from './Overlays';
import { haptic, Icon, type IconName, Text } from './ui';

const TAB_ICONS: Record<string, IconName> = { index: 'home', track: 'activity', ask: 'message-circle', community: 'users', profile: 'user', tools: 'grid' };
const SHORT: Record<string, string> = { index: 'Accueil', track: 'Suivi', ask: 'Questions', community: 'Communauté', profile: 'Profil' };

export const DOCK_HEIGHT = 74;
/** Routes d'onglet accessibles par lien mais absentes de la barre (symétrie autour d'« Outils »). */
const HIDDEN_FROM_BAR = new Set(['community']);

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

/**
 * Bouton central « Outils » : orbe nacrée (dégradé existant) et quatre tuiles qui se déploient.
 * Toucher : enfoncement en profondeur, onde lumineuse, tuiles qui s'écartent puis se reposent.
 * Actif : anneau lumineux, libellé affirmé. Appui long : ajout rapide (ancien bouton « + »).
 */
const ORB = 50;
const TILE = 7.5;
const TILES: { x: number; y: number; round?: boolean }[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1, round: true }];

function ToolsOrb({ focused, sheetOpen, onPress, onLongPress }: { focused: boolean; sheetOpen: boolean; onPress: () => void; onLongPress: () => void }) {
  const reduce = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;      // profondeur
  const deploy = useRef(new Animated.Value(0)).current;     // tuiles écartées (0 → 1 → 0)
  const active = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const turn = useRef(new Animated.Value(0)).current;       // ajout rapide ouvert : les tuiles tournent d'un quart
  const [pulse, setPulse] = useState(0);
  useEffect(() => { springTo(active, focused ? 1 : 0, 'gentle', reduce).start(); }, [focused, active, reduce]);
  useEffect(() => { springTo(turn, sheetOpen ? 1 : 0, 'pop', reduce).start(); }, [sheetOpen, turn, reduce]);
  const burst = () => {
    if (reduce) return;
    setPulse((p) => p + 1);
    deploy.setValue(0);
    Animated.sequence([
      Animated.timing(deploy, { toValue: 1, duration: 140, useNativeDriver: NATIVE_DRIVER }),
      Animated.spring(deploy, { toValue: 0, tension: 220, friction: 11, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  };
  const gap = 3.2;
  const span = TILE * 2 + gap;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      aria-selected={focused}
      accessibilityLabel="Outils"
      accessibilityHint="Appui long : ajout rapide (biberon, couche, sommeil…)"
      onPressIn={() => springTo(press, 1, 'press', reduce).start()}
      onPressOut={() => springTo(press, 0, 'release', reduce).start()}
      onPress={() => { burst(); onPress(); }}
      onLongPress={() => { haptic('success'); burst(); onLongPress(); }}
      delayLongPress={380}
      hitSlop={6}
      style={{ width: ORB + 10, height: ORB + 10, alignItems: 'center', justifyContent: 'center' }}
    >
      <PulseRing trigger={pulse} size={ORB + 12} color="#FFFFFF" />
      {/* anneau d'état actif */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: ORB + 8, height: ORB + 8, borderRadius: (ORB + 8) / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)', opacity: active, transform: [{ scale: active.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }] }} />
      <Animated.View style={{ width: ORB, height: ORB, borderRadius: ORB / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
        transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }, { translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, 1.5] }) }] }}>
        <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* reflet de verre : s'intensifie à la pression */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 2, left: 8, right: 8, height: ORB * 0.42, borderRadius: ORB, backgroundColor: '#FFFFFF', opacity: press.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.34] }) }} />
        <Animated.View style={{ width: span, height: span, transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}>
          {TILES.map((tl, i) => {
            const dx = tl.x ? 1 : -1; const dy = tl.y ? 1 : -1;
            return (
              <Animated.View key={i} style={{ position: 'absolute', left: tl.x * (TILE + gap), top: tl.y * (TILE + gap), width: TILE, height: TILE, borderRadius: tl.round ? TILE / 2 : 2.2, backgroundColor: '#FFFFFF',
                opacity: tl.round ? active.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) : 1,
                transform: [
                  { translateX: deploy.interpolate({ inputRange: [0, 1], outputRange: [0, dx * 2.4] }) },
                  { translateY: deploy.interpolate({ inputRange: [0, 1], outputRange: [0, dy * 2.4] }) },
                  { scale: tl.round ? active.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) : 1 },
                ] }} />
            );
          })}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  // Onglets visibles (Communauté reste une route, hors de la barre) ; « Outils » au centre exact
  const visible = state.routes.filter((r) => {
    const o = descriptors[r.key].options as { href?: unknown; tabBarItemStyle?: { display?: string } };
    // expo-router traduit `href: null` en élément masqué : la route existe toujours (liens profonds), hors de la barre
    return o.href !== null && o.tabBarItemStyle?.display !== 'none' && !HIDDEN_FROM_BAR.has(r.name);
  });
  const center = visible.find((r) => r.name === 'tools');
  const sides = visible.filter((r) => r !== center);
  const half = Math.floor(sides.length / 2);
  const left = sides.slice(0, half);
  const right = sides.slice(half);
  const focusedName = state.routes[state.index]?.name;
  // Pastille lumineuse qui glisse sous l'onglet actif (positions mesurées dans la barre)
  const [tabX, setTabX] = useState<Record<string, { x: number; w: number }>>({});
  const [groupX, setGroupX] = useState<{ left: number; right: number }>({ left: 0, right: 0 });
  const pillX = useRef(new Animated.Value(0)).current;
  const pillW = useRef(new Animated.Value(0)).current;
  const pillOn = useRef(new Animated.Value(0)).current;
  const sideOf = (name: string) => (left.some((r) => r.name === name) ? 'left' : 'right');
  const pos = focusedName && tabX[focusedName] ? { x: tabX[focusedName].x + groupX[sideOf(focusedName)], w: tabX[focusedName].w } : null;
  useEffect(() => {
    springTo(pillOn, pos && focusedName !== 'tools' ? 1 : 0, 'gentle', reduce).start();
    if (!pos) return;
    springTo(pillX, pos.x, 'gentle', reduce).start();
    springTo(pillW, pos.w, 'gentle', reduce).start();
  }, [focusedName, pos?.x, pos?.w, pillX, pillW, pillOn, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (route: (typeof state.routes)[number]) => {
    const focused = focusedName === route.name;
    const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !ev.defaultPrevented) {
      haptic('selection');
      navigation.navigate(route.name);
    }
  };

  const renderTab = (route: (typeof state.routes)[number]) => {
    const focused = focusedName === route.name;
    const label = SHORT[route.name] ?? descriptors[route.key].options.title ?? route.name;
    return (
      <Pressable
        key={route.key}
        onLayout={(e) => { const { x, width } = e.nativeEvent.layout; setTabX((m) => (m[route.name]?.x === x && m[route.name]?.w === width ? m : { ...m, [route.name]: { x, w: width } })); }}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        aria-selected={focused}
        accessibilityLabel={descriptors[route.key].options.title ?? label}
        onPress={() => go(route)}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 56 }}
      >
        <TabIcon name={TAB_ICONS[route.name] ?? 'circle'} focused={focused} />
        <TabLabel label={label} focused={focused} />
      </Pressable>
    );
  };

  const toolsFocused = focusedName === 'tools';
  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: spacing.sm, alignItems: 'center' }}>
        <View style={{ height: DOCK_HEIGHT - 10, width: '100%', maxWidth: 560, borderRadius: radius.pill, backgroundColor: Platform.OS === 'android' ? t.colors.tabBar : 'transparent', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
          {Platform.OS !== 'android' ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, overflow: 'hidden' }]}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.tabBar }]} />
              <View style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
          ) : null}
          {pos ? (
            <>
              <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 7, bottom: 7, left: 0, width: pos.w, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.10)', opacity: pillOn, transform: [{ translateX: pillX }] }} />
              <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 10, left: -2, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold, opacity: pillOn, transform: [{ translateX: Animated.add(pillX, Animated.multiply(pillW, 0.5)) }] }} />
            </>
          ) : null}
          {/* Deux moitiés de largeur égale : le bouton central est au centre géométrique, quelle que soit la longueur des libellés */}
          <View onLayout={(e) => { const x = e.nativeEvent.layout.x; setGroupX((g) => (g.left === x ? g : { ...g, left: x })); }} style={{ flex: 1, flexDirection: 'row' }}>{left.map(renderTab)}</View>
          {center ? (
            <View style={{ width: 76, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 56 }}>
              {/* emplacement de la même hauteur qu'une icône d'onglet : l'orbe en déborde vers le haut, le libellé reste aligné */}
              <View style={{ width: 21, height: 21, alignItems: 'center' }}>
                <View style={{ position: 'absolute', top: -34, alignItems: 'center', justifyContent: 'center' }}>
                  <ToolsOrb focused={toolsFocused} sheetOpen={open} onPress={() => go(center)} onLongPress={() => setOpen(true)} />
                </View>
              </View>
              <TabLabel label="Outils" focused={toolsFocused} />
            </View>
          ) : null}
          <View onLayout={(e) => { const x = e.nativeEvent.layout.x; setGroupX((g) => (g.right === x ? g : { ...g, right: x })); }} style={{ flex: 1, flexDirection: 'row' }}>{right.map(renderTab)}</View>
        </View>
      </View>
      <QuickAddSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontFamily: focused ? fonts.bodyMedium : fonts.body, fontSize: label.length > 9 ? 8.5 : 9.5, lineHeight: 12, letterSpacing: label.length > 9 ? -0.3 : -0.1 }} color={focused ? '#FFFFFF' : 'rgba(255,241,245,0.5)'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
      {label}
    </Text>
  );
}

/** Actions d'ajout rapide (ancien bouton « + ») : feuille depuis la barre, ou grille dans la page Outils. */
function useQuickAdd(onBefore?: () => void) {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const childId = subject.type === 'child' ? subject.id : children?.[0]?.id;
  const child = children?.find((c) => c.id === childId);
  const go = (fn: () => void) => () => { if (onBefore) { onBefore(); setTimeout(fn, 180); } else fn(); };
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
  return { child, go, items: items.filter((i) => i.show) };
}

export function QuickAddGrid({ compact, onBefore }: { compact?: boolean; onBefore?: () => void }) {
  const t = useTheme();
  const { items, go } = useQuickAdd(onBefore);
  return (
    <View style={{ gap: spacing.xs }}>
      {compact ? (
        <Pressable accessibilityRole="button" onPress={go(() => router.push('/assistant/chat'))}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,143,177,0.35)', backgroundColor: pressed ? palette.nightSoft : palette.night })}>
          <Icon name="message-circle" color={palette.gold} />
          <Text weight="bold" color={palette.milk} style={{ flex: 1 }}>Poser une question</Text>
          <Icon name="chevron-right" size={18} color={palette.milk} />
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {items.map((i) => (
          <Pressable
            key={i.label}
            accessibilityRole="button"
            accessibilityLabel={`Ajouter : ${i.label}`}
            onPress={() => { haptic('light'); i.onPress(); }}
            style={({ pressed }) => ({ width: compact ? '31.5%' : '23%', flexGrow: compact ? 0 : 1, minHeight: compact ? 72 : undefined, aspectRatio: compact ? undefined : 1, borderRadius: radius.lg, borderWidth: compact ? 1 : 0, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : compact ? t.colors.surface : t.colors.background, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: compact ? spacing.xs : 0 })}
          >
            <Icon name={i.icon} color={t.colors.text} />
            <Text variant="caption" weight="medium" center numberOfLines={1}>{i.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function QuickAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { child, go } = useQuickAdd(onClose);
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
      <QuickAddGrid onBefore={onClose} />
    </Sheet>
  );
}
