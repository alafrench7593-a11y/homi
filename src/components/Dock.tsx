/**
 * Barre d'onglets HOMI (13/11/2026) : Accueil · Santé · Bébé · Famille · Communauté.
 * Style « Keynote premium » : capsule flottante en verre (BlurView + voile), minuit en clair ; en sombre, verre
 * relevé plus clair que le fond (« plus haut = plus clair »), liseré lilas et ombre haute pour la détacher du fond ;
 * nuit : surface opaque tamisée, sans flou ni ombre.
 *
 * Libellés : chaque onglet prend la largeur de son libellé (au moins 44 px), la taille commune reste à 12 px et ne
 * descend qu'au quart de pixel près (≥ 11 px à 320 px de large), jamais d'ellipse (`tabLayout`, testé).
 * Mouvement (src/motion) : enfoncement en ressort à la pression (`usePressScale`) et pastille active qui GLISSE
 * d'un onglet à l'autre (translateX en ressort « doux ») ; Réduire les animations / économie d'énergie : état final
 * immédiat ; nuit : fondu court sans rebond.
 *
 * Bouton d'action rond à droite de la capsule, SUR LA MÊME LIGNE (jamais posé sur le contenu) : « + » ajout rapide
 * par défaut ; un écran peut le remplacer (`useDockAction` : Communauté → Publier, accueil d'un enfant → Ajouter).
 * Un seul bouton d'action par écran. Les écrans d'onglet réservent `TAB_SCREEN_INSET` en bas de leur contenu.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, glass, palette, physicalShadow, primaryGradient, radius, spacing, themes, type Theme } from '@/theme/tokens';
import { useMotion, usePressScale } from '@/motion';
import { useScope } from '@/lib/data/hooks-scope';
import { ACTIVE_ALIAS, dockGeometry, estimateLabelWidth, NAV_TABS, TAB_BAR_H, TAB_LABEL_MAX, tabLayout, type NavTab } from '@/features/hubs/hubMap';
import { Sheet } from './Overlays';
import { tint } from './ToolGlyph';
import { haptic, Icon, type IconName, Text } from './ui';
import { useDockActionFor, type DockAction } from './dockAction';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';

/** Hauteur de la ligne du bas (capsule de 64 px + marge) au-dessus de la zone sûre. */
export const DOCK_HEIGHT = TAB_BAR_H + 10;
/**
 * Espace UNIQUE à réserver sous le contenu des écrans d'onglet (`<Screen bottomInset>` ou `paddingBottom` d'une
 * liste, en plus de la zone sûre) : la barre et son bouton d'action sont sur la même ligne, rien d'autre ne flotte.
 */
export const TAB_SCREEN_INSET = DOCK_HEIGHT + spacing.xs;
const LONG_PRESS = 'tabLongPress' as const;
/** Pastille d'état actif (derrière l'icône), et position verticale fixe de l'icône dans l'onglet. */
const PILL_W = 44;
const PILL_H = 30;
const ICON_TOP = 8;

/** Encres de la barre : capsule toujours sombre, donc encres du thème sombre (nuit : ses propres encres tamisées). */
function useBarInk() {
  const t = useTheme();
  return t.isDark ? t.colors : themes.dark.colors;
}

/** Matière de la capsule selon le thème (voir l'en-tête). */
function barSurface(t: Theme) {
  if (t.name === 'night') return { fill: t.colors.surfaceAlt, edge: t.colors.border, highlight: 'transparent', blur: false, shadow: undefined };
  if (t.isDark) return { fill: glass.dark.floating.fill, edge: tint(themes.dark.colors.primary, 0.34), highlight: glass.dark.floating.highlight, blur: true, shadow: physicalShadow('high', true) };
  return { fill: t.colors.tabBar, edge: tint(themes.dark.colors.primary, 0.28), highlight: tint(palette.white, 0.16), blur: true, shadow: physicalShadow('high', false) };
}

function TabItem({ tab, width, focused, label, a11y, fontSize, onPress, onLongPress }: { tab: NavTab; width: number; focused: boolean; label: string; a11y: string; fontSize: number; onPress: () => void; onLongPress: () => void }) {
  const ink = useBarInk();
  const p = usePressScale({ scale: 0.9, haptic: 'none' });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      aria-selected={focused}
      accessibilityLabel={a11y}
      testID={`tab-${tab.name}`}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      style={{ width, height: TAB_BAR_H }}
    >
      <Animated.View style={[{ flex: 1, alignItems: 'center', paddingTop: ICON_TOP, gap: 3 }, p.style]}>
        <View style={{ height: PILL_H, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={tab.icon} size={21} color={focused ? ink.primary : ink.textMuted} />
        </View>
        <Text
          style={{ fontFamily: focused ? fonts.bodyBold : fonts.bodyMedium, fontSize, lineHeight: Math.round(fontSize * 1.3), letterSpacing: -0.15, textAlign: 'center' }}
          color={focused ? ink.text : ink.textMuted}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Pastille lilas de l'onglet actif : glisse d'un onglet à l'autre (transform seulement). */
function ActivePill({ x, visible }: { x: number; visible: boolean }) {
  const ink = useBarInk();
  const m = useMotion();
  const tx = useSharedValue(x);
  const op = useSharedValue(visible ? 1 : 0);
  const placed = useRef(false);
  useEffect(() => {
    // première position : posée sans animation ; ensuite, glissement en ressort doux (interruptible)
    tx.value = placed.current ? m.spring(x, 'doux') : x;
    placed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x]);
  useEffect(() => { op.value = m.timing(visible ? 1 : 0, 160, 'standard'); }, [visible, m, op]);
  const style = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: tx.value }] }));
  return (
    <Animated.View pointerEvents="none" testID="tab-indicator"
      style={[{ position: 'absolute', left: 0, top: ICON_TOP, width: PILL_W, height: PILL_H, borderRadius: radius.pill, backgroundColor: tint(ink.primary, 0.24), borderWidth: 1, borderColor: tint(ink.primary, 0.34) }, style]} />
  );
}

/** Bouton d'action de la barre : « + » (ajout rapide) ou l'action de l'écran affiché (`useDockAction`). */
export function DockActionButton({ route, size = 56, onQuickAdd }: { route: string; size?: number; onQuickAdd?: () => void }) {
  const t = useTheme();
  const custom = useDockActionFor(route);
  const p = usePressScale({ scale: 0.92 });
  const action: DockAction = custom ?? { icon: 'plus', label: tr('nav.quickAdd'), hint: tr('nav.quickAddHint'), testID: 'quick-add', onPress: () => onQuickAdd?.() };
  const night = t.name === 'night';
  return (
    <Pressable
      testID={action.testID}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityHint={action.hint}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => { haptic('light'); action.onPress(); }}
      style={{ width: size, height: size }}
    >
      <Animated.View style={[{ flex: 1, borderRadius: size / 2, boxShadow: night ? undefined : physicalShadow('mid', t.isDark) }, p.style]}>
        <LinearGradient colors={night ? [t.colors.primary, t.colors.primary, t.colors.primary] : primaryGradient(t.isDark)} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tint(palette.white, t.isDark ? 0.35 : 0.4) }}>
          <Icon name={action.icon as IconName} size={size >= 56 ? 25 : 22} color={t.colors.primaryText} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const surface = barSurface(t);

  const focusedName = state.routes[state.index]?.name ?? 'index';
  const activeName = ACTIVE_ALIAS[focusedName] ?? focusedName;
  const tabs = NAV_TABS.map((tab) => ({ tab, route: state.routes.find((r) => r.name === tab.name) })).filter((x): x is { tab: NavTab; route: (typeof state.routes)[number] } => !!x.route);
  const labels = tabs.map((x) => tr(x.tab.label));

  const g = dockGeometry(width);
  // Libellés jamais coupés : largeur réelle mesurée (police chargée, langue active, taille de texte du téléphone),
  // estimation prudente avant la première mesure
  const [natural, setNatural] = useState<Record<string, number>>({});
  const widthsKey = labels.map((l) => natural[l] ?? estimateLabelWidth(l)).join('|');
  const layout = useMemo(() => tabLayout(g.inner, widthsKey.split('|').map(Number)), [g.inner, widthsKey]);
  const activeIndex = tabs.findIndex((x) => x.tab.name === activeName);
  const at = Math.max(activeIndex, 0);
  const pillX = g.pad + layout.widths.slice(0, at).reduce((a, w) => a + w, 0) + ((layout.widths[at] ?? PILL_W) - PILL_W) / 2;
  const bottom = Math.max(insets.bottom, 10);

  const go = (route: (typeof state.routes)[number]) => {
    const focused = focusedName === route.name;
    const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !ev.defaultPrevented) {
      haptic('selection');
      navigation.navigate(route.name);
    }
  };

  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: bottom, alignItems: 'center' }}>
        {/* Mesure invisible des libellés à la taille de référence, en graisse active (la plus large) */}
        <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
          <View style={{ width: 1000, alignItems: 'flex-start' }}>
            {labels.map((l) => (
              <Text key={l} onLayout={(e) => { const w = Math.ceil(e.nativeEvent.layout.width); if (w > 0) setNatural((m) => (m[l] === w ? m : { ...m, [l]: w })); }}
                style={{ fontFamily: fonts.bodyBold, fontSize: TAB_LABEL_MAX, letterSpacing: -0.15 }} maxFontSizeMultiplier={1.2} numberOfLines={1}>{l}</Text>
            ))}
          </View>
        </View>
        <View pointerEvents="box-none" style={{ width: g.row, flexDirection: 'row', alignItems: 'center', gap: g.gap }}>
          <View
            accessibilityRole="tablist"
            accessibilityLabel={tr('nav.tablist')}
            style={{ height: TAB_BAR_H, width: g.barW, borderRadius: radius.pill, backgroundColor: Platform.OS === 'android' || !surface.blur ? surface.fill : 'transparent', flexDirection: 'row', alignItems: 'center', paddingHorizontal: g.pad,
              borderWidth: 1, borderColor: surface.edge, boxShadow: surface.shadow }}
          >
            {Platform.OS !== 'android' && surface.blur ? (
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, overflow: 'hidden' }]}>
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: surface.fill }]} />
                {/* reflet de verre sur l'arête haute */}
                <View style={{ position: 'absolute', top: 0, left: 28, right: 28, height: 1, backgroundColor: surface.highlight }} />
              </View>
            ) : null}
            <ActivePill x={pillX} visible={activeIndex >= 0} />
            {tabs.map(({ tab, route }, i) => (
              <TabItem
                key={route.key}
                tab={tab}
                width={layout.widths[i]}
                label={labels[i]}
                a11y={descriptors[route.key]?.options.title ?? labels[i]}
                focused={activeName === tab.name}
                fontSize={layout.fontSize}
                onPress={() => go(route)}
                onLongPress={() => navigation.emit({ type: LONG_PRESS, target: route.key })}
              />
            ))}
          </View>
          <DockActionButton route={focusedName} size={g.action} onQuickAdd={() => setOpen(true)} />
        </View>
      </View>
      <QuickAddSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Actions d'ajout rapide (ancien bouton « + ») : TOUJOURS pour le profil affiché.
 * Biberon, tétée, couche, minuteur : uniquement quand un bébé né est affiché ; jamais pour une grossesse.
 */
function useQuickAdd(onBefore?: () => void) {
  const scope = useScope();
  const child = scope.child;
  const childId = scope.childId;
  const baby = scope.scope === 'baby';
  const kid = baby || scope.scope === 'child';
  const go = (fn: () => void) => () => { if (onBefore) { onBefore(); setTimeout(fn, 180); } else fn(); };
  const track = (kind: string) => go(() => router.push({ pathname: '/track/[kind]', params: { kind, child: childId ?? '' } }));
  const items: { icon: IconName; label: string; onPress: () => void; show: boolean }[] = [
    { icon: 'coffee', label: tr('dock.q.bottle'), onPress: track('bottle'), show: baby },
    { icon: 'droplet', label: tr('dock.q.breastfeed'), onPress: track('breastfeed'), show: baby },
    { icon: 'wind', label: tr('dock.q.diaper'), onPress: track('diaper'), show: baby },
    { icon: 'moon', label: tr('dock.q.sleep'), onPress: go(() => router.push(`/night?child=${childId}`)), show: kid },
    { icon: 'feather', label: tr('dock.q.meal'), onPress: track('meal'), show: kid },
    { icon: 'thermometer', label: tr('dock.q.health'), onPress: track('observation'), show: kid },
    { icon: 'clock', label: tr('dock.q.timer'), onPress: go(() => router.push(`/bottle/${childId}`)), show: baby },
    { icon: 'trending-up', label: tr('pj.q.weight'), onPress: go(() => router.push('/pregnancy/weight')), show: scope.scope === 'pregnancy' },
    { icon: 'droplet', label: tr('pj.q.period'), onPress: go(() => router.push('/cycle/bleeding')), show: ['avoid', 'ttc', 'cycle'].includes(scope.scope) },
    { icon: 'edit-3', label: tr('pj.q.checkin'), onPress: go(() => router.push('/postpartum/checkin')), show: scope.scope === 'postpartum' || (scope.scope === 'baby' && !!scope.postpartum) },
    { icon: 'heart', label: tr('dock.q.mood'), onPress: go(() => router.push('/me/mood')), show: !kid },
    { icon: 'maximize', label: tr('dock.q.scanner'), onPress: go(() => router.push('/scanner')), show: true },
    // Missions familiales : une demande pratique au foyer, depuis n'importe quel écran
    { icon: 'send', label: tr('dock.q.mission'), onPress: go(() => router.push('/family/missions/new')), show: true },
    // Courses : ajout rapide d'un article à la liste partagée du foyer
    { icon: 'shopping-cart', label: tr('dock.q.shopping'), onPress: go(() => router.push('/meals/shopping?add=1')), show: true },
  ];
  return { child, go, items: items.filter((i) => i.show) };
}

export function QuickAddGrid({ compact, onBefore }: { compact?: boolean; onBefore?: () => void }) {
  const t = useTheme();
  const { items, go, child } = useQuickAdd(onBefore);
  return (
    <View style={{ gap: spacing.xs }}>
      {child ? <Text variant="small" weight="bold" testID="quick-for">{tr('dock.forChild', { name: child.first_name })}</Text> : null}
      {compact ? (
        <Tappable accessibilityRole="button" onPress={go(() => router.push('/assistant/chat'))}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: tint(palette.lavender, 0.35), backgroundColor: pressed ? palette.nightSoft : palette.night })}>
          <Icon name="message-circle" color={palette.lavender} />
          <Text weight="bold" color={palette.milk} style={{ flex: 1 }}>{tr('dock.ask')}</Text>
          <Icon name="chevron-right" size={18} color={palette.milk} />
        </Tappable>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {items.map((i) => (
          <Tappable
            key={i.label}
            accessibilityRole="button"
            accessibilityLabel={tr('dock.addA11y', { label: i.label })}
            onPress={() => { haptic('light'); i.onPress(); }}
            style={({ pressed }) => ({ width: compact ? '31.5%' : '23%', flexGrow: compact ? 0 : 1, minHeight: compact ? 72 : 76, borderRadius: radius.lg, borderWidth: compact ? 1 : 0, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : compact ? t.colors.surface : t.colors.background, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: compact ? spacing.xs : 0 })}
          >
            <Icon name={i.icon} color={t.colors.text} />
            <Text variant="caption" weight="medium" center style={{ paddingHorizontal: 4 }}>{i.label}</Text>
          </Tappable>
        ))}
      </View>
    </View>
  );
}

function QuickAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { child, go } = useQuickAdd(onClose);
  return (
    <Sheet visible={visible} onClose={onClose} title={child ? tr('dock.forChild', { name: child.first_name }) : tr('dock.add')}>
      <Tappable
        accessibilityRole="button"
        onPress={go(() => router.push('/assistant/chat'))}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: tint(palette.lavender, 0.35), backgroundColor: pressed ? palette.nightSoft : palette.night })}
      >
        <Icon name="message-circle" color={palette.lavender} />
        <View style={{ flex: 1 }}>
          <Text weight="bold" color={palette.milk}>{tr('dock.ask')}</Text>
          <Text variant="small" color={tint(palette.milk, 0.78)}>{tr('dock.askSub')}</Text>
        </View>
      </Tappable>
      <QuickAddGrid onBefore={onClose} />
    </Sheet>
  );
}
