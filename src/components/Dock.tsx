/**
 * Barre d'onglets HOMI (13/11/2026) : Accueil · Santé · Bébé · Famille · Communauté.
 * Style « Keynote premium » : capsule flottante en verre minuit (BlurView + voile `tabBar` du thème), lisible en
 * clair comme en sombre ; état actif = pastille lilas derrière l'icône + libellé appuyé ; libellés complets
 * (taille calculée pour tenir à 320 px de large, jamais d'ellipse) ; cibles ≥ 56 px ; haptique discrète ;
 * « Réduire les animations » : aucun mouvement. Profil : avatar en haut à droite des écrans (AccountActions).
 *
 * Ajout rapide (biberon, tétée, couche, sommeil, humeur…) : bouton rond toujours présent au-dessus de la barre,
 * à droite (remplace l'ancien onglet Suivi et l'appui long sur « Outils »). Masqué seulement sur l'Accueil d'un
 * enfant, où « + Ajouter » du cocon joue le même rôle au même endroit.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { springTo } from '@/theme/motion';
import { fonts, NACRE, palette, radius, spacing, themes } from '@/theme/tokens';
import { useScope } from '@/lib/data/hooks-scope';
import { ACTIVE_ALIAS, NAV_TABS, tabLabelSize, type NavTab } from '@/features/hubs/hubMap';
import { Sheet } from './Overlays';
import { tint } from './ToolGlyph';
import { haptic, Icon, type IconName, Text } from './ui';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';

/** Hauteur réservée à la barre (capsule de 64 px + marge) : utilisée par les boutons flottants des écrans. */
export const DOCK_HEIGHT = 74;
const BAR_H = DOCK_HEIGHT - 10;
const FAB = 54;
const FAB_SMALL = 48;
const LONG_PRESS = 'tabLongPress' as const;
/** Taille de référence des libellés (px) : réduite seulement si le plus long ne tient pas (plancher 9 px). */
const LABEL_BASE = 12;
export const fitLabelSize = (tabW: number, widest: number) => Math.max(9, Math.min(LABEL_BASE, Math.floor(((LABEL_BASE * (tabW - 6)) / widest) * 4) / 4));

/** Encres de la barre : la capsule est toujours en verre minuit, donc encres du thème sombre (nuit : ses propres encres tamisées). */
function useBarInk() {
  const t = useTheme();
  return t.isDark ? t.colors : themes.dark.colors;
}

function TabItem({ tab, focused, label, a11y, fontSize, onPress, onLongPress }: { tab: NavTab; focused: boolean; label: string; a11y: string; fontSize: number; onPress: () => void; onLongPress: () => void }) {
  const ink = useBarInk();
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { springTo(v, focused ? 1 : 0, 'pop', reduce).start(); }, [v, focused, reduce]);
  return (
    <Tappable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      aria-selected={focused}
      accessibilityLabel={a11y}
      testID={`tab-${tab.name}`}
      onPress={onPress}
      onLongPress={onLongPress}
      pressScale={0.94}
      hoverLift={0}
      style={{ flex: 1, minWidth: 0, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 }}
    >
      <View style={{ width: 52, height: 30, alignItems: 'center', justifyContent: 'center' }}>
        {/* Pastille d'état actif (lilas) : apparaît en s'élargissant depuis le centre */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, backgroundColor: tint(ink.primary, 0.24), borderWidth: 1, borderColor: tint(ink.primary, 0.32), opacity: v, transform: [{ scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }] }]} />
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
    </Tappable>
  );
}

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
  const t = useTheme();
  const ink = useBarInk();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scope = useScope();
  const [open, setOpen] = useState(false);

  const focusedName = state.routes[state.index]?.name ?? 'index';
  const activeName = ACTIVE_ALIAS[focusedName] ?? focusedName;
  const tabs = NAV_TABS.map((tab) => ({ tab, route: state.routes.find((r) => r.name === tab.name) })).filter((x): x is { tab: NavTab; route: (typeof state.routes)[number] } => !!x.route);
  const labels = tabs.map((x) => tr(x.tab.label));

  const side = width < 360 ? spacing.xs : spacing.sm;
  const fab = width < 360 ? FAB_SMALL : FAB;
  const barW = Math.min(width - side * 2, 560);
  const tabW = (barW - 8) / Math.max(tabs.length, 1);
  // Libellés jamais coupés : largeur réelle mesurée (police chargée, langue active, taille de texte du téléphone),
  // puis taille commune réduite juste assez pour le plus long ; estimation prudente avant la première mesure
  const [natural, setNatural] = useState<Record<string, number>>({});
  const widest = Math.max(0, ...labels.map((l) => natural[l] ?? 0));
  const measured = labels.every((l) => natural[l] != null) && widest > 0;
  const fontSize = measured ? fitLabelSize(tabW, widest) : tabLabelSize(tabW, Math.max(0, ...labels.map((l) => l.length)));
  const bottom = Math.max(insets.bottom, 10);
  // Accueil d'un enfant : « + Ajouter » du cocon est déjà à cet endroit
  const cocoonAdd = focusedName === 'index' && (scope.scope === 'baby' || scope.scope === 'child') && !!scope.child;

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
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: bottom, paddingHorizontal: side, alignItems: 'center' }}>
        {cocoonAdd ? null : (
          <View pointerEvents="box-none" style={{ position: 'absolute', right: side + 4, bottom: bottom + BAR_H + 10 }}>
            <Tappable
              testID="quick-add"
              accessibilityRole="button"
              accessibilityLabel={tr('nav.quickAdd')}
              accessibilityHint={tr('nav.quickAddHint')}
              onPress={() => { haptic('light'); setOpen(true); }}
              pressScale={0.92}
              style={{ width: fab, height: fab, borderRadius: fab / 2, shadowColor: palette.nightDeep, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
            >
              <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: fab / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tint(palette.white, 0.55) }}>
                <Icon name="plus" size={fab > FAB_SMALL ? 26 : 23} color={palette.white} />
              </LinearGradient>
            </Tappable>
          </View>
        )}
        {/* Mesure invisible des libellés à la taille de référence, en graisse active (la plus large) */}
        <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
          <View style={{ width: 1000, alignItems: 'flex-start' }}>
            {labels.map((l) => (
              <Text key={l} onLayout={(e) => { const w = Math.ceil(e.nativeEvent.layout.width); setNatural((m) => (m[l] === w ? m : { ...m, [l]: w })); }}
                style={{ fontFamily: fonts.bodyBold, fontSize: LABEL_BASE, letterSpacing: -0.15 }} maxFontSizeMultiplier={1.2} numberOfLines={1}>{l}</Text>
            ))}
          </View>
        </View>
        <View
          accessibilityRole="tablist"
          accessibilityLabel={tr('nav.tablist')}
          style={{ height: BAR_H, width: barW, borderRadius: radius.pill, backgroundColor: Platform.OS === 'android' ? t.colors.tabBar : 'transparent', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4,
            borderWidth: StyleSheet.hairlineWidth, borderColor: tint(ink.primary, 0.28), shadowColor: palette.nightDeep, shadowOpacity: t.isDark ? 0.35 : 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 10 }}
        >
          {Platform.OS !== 'android' ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.pill, overflow: 'hidden' }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.tabBar }]} />
              {/* reflet de verre sur l'arête haute */}
              <View style={{ position: 'absolute', top: 0, left: 28, right: 28, height: 1, backgroundColor: tint(ink.text, 0.16) }} />
            </View>
          ) : null}
          {tabs.map(({ tab, route }, i) => (
            <TabItem
              key={route.key}
              tab={tab}
              label={labels[i]}
              a11y={descriptors[route.key]?.options.title ?? labels[i]}
              focused={activeName === tab.name}
              fontSize={fontSize}
              onPress={() => go(route)}
              onLongPress={() => navigation.emit({ type: LONG_PRESS, target: route.key })}
            />
          ))}
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
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: tint(palette.gold, 0.35), backgroundColor: pressed ? palette.nightSoft : palette.night })}>
          <Icon name="message-circle" color={palette.gold} />
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
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: tint(palette.gold, 0.35), backgroundColor: pressed ? palette.nightSoft : palette.night })}
      >
        <Icon name="message-circle" color={palette.gold} />
        <View style={{ flex: 1 }}>
          <Text weight="bold" color={palette.milk}>{tr('dock.ask')}</Text>
          <Text variant="small" color="rgba(251,248,244,0.7)">{tr('dock.askSub')}</Text>
        </View>
      </Tappable>
      <QuickAddGrid onBefore={onClose} />
    </Sheet>
  );
}
