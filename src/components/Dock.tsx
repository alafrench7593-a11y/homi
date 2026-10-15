/**
 * Barre de navigation flottante « Neuf lunes » : 5 onglets + bouton central « + »
 * qui ouvre l'ajout rapide (et « Poser une question », accessible de partout).
 */
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, NACRE, palette, radius, spacing } from '@/theme/tokens';
import { useActiveSubject, useChildren } from '@/lib/data/hooks';
import { Sheet } from './Overlays';
import { haptic, Icon, type IconName, Text } from './ui';

const TAB_ICONS: Record<string, IconName> = { index: 'home', track: 'activity', ask: 'message-circle', discover: 'compass', community: 'users' };
const SHORT: Record<string, string> = { index: 'Accueil', track: 'Suivi', ask: 'Questions', discover: 'Découvrir', community: 'Entraide' };

export const DOCK_HEIGHT = 74;

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = routes.indexOf(route);
    const focused = state.index === index;
    const label = SHORT[route.name] ?? descriptors[route.key].options.title ?? route.name;
    return (
      <Pressable
        key={route.key}
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
        <Feather name={TAB_ICONS[route.name] ?? 'circle'} size={21} color={focused ? palette.gold : 'rgba(251,248,244,0.62)'} />
        <Text style={{ fontFamily: focused ? fonts.bodyMedium : fonts.body, fontSize: 10.5, lineHeight: 13, letterSpacing: 0.3 }} color={focused ? palette.milk : 'rgba(251,248,244,0.62)'} numberOfLines={1}>
          {label}
        </Text>
        {focused && <View style={{ position: 'absolute', top: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: palette.gold }} />}
      </Pressable>
    );
  };

  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: spacing.sm }}>
        <View style={{ height: DOCK_HEIGHT - 10, borderRadius: radius.xl, backgroundColor: t.colors.tabBar, borderWidth: 1, borderColor: 'rgba(216,188,133,0.28)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
          {left.map(renderTab)}
          <View style={{ width: 70, alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter ou poser une question"
              onPress={() => { haptic('light'); setOpen(true); }}
              style={({ pressed }) => ({ width: 60, height: 60, borderRadius: 30, marginTop: -28, borderWidth: 4, borderColor: t.colors.background, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] })}
            >
              <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              <Feather name="plus" size={26} color={palette.night} />
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
    { icon: 'maximize', label: 'Scanner', onPress: go(() => router.push('/scanner')), show: true },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title={child ? `Pour ${child.first_name}` : 'Ajouter'}>
      <Pressable
        accessibilityRole="button"
        onPress={go(() => router.push('/assistant/chat'))}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(216,188,133,0.35)', backgroundColor: pressed ? palette.nightSoft : palette.night })}
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
