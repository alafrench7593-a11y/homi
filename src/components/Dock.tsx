/**
 * Barre d'onglets HOMI (v3, 13/11/2026) : Accueil · Santé · Bébé · Famille · Communauté. Capsule flottante en VERRE
 * OPTIQUE (src/components/surfaces) avec indicateur de verre qui glisse vers l'onglet actif.
 * Style « Liquid Glass » : capsule flottante en verre (`LiquidGlass` : GlassView natif sur iOS 26+, sinon flou +
 * remplissage), teintée d'un dégradé pastel de la palette, arête claire en haut, ombre colorée douce dessous.
 * Clair : verre ivoire ; sombre : verre fumé plus clair que le graphite ; nuit : surface opaque tamisée, sans flou ni ombre.
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
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { PressSheen, useMotion, usePressScale, usePressSheen } from '@/motion';
import { LiquidGlass, liquidShadow } from './Glass';
import { GlowCard } from './GlowCard';
import { useScope } from '@/lib/data/hooks-scope';
import { ACTIVE_ALIAS, dockGeometry, estimateLabelWidth, NAV_TABS, TAB_BAR_H, TAB_LABEL_MAX, tabLayout, type NavTab } from '@/features/hubs/hubMap';
import { Sheet } from './Overlays';
import { tint } from './ToolGlyph';
import { haptic, Icon, type IconName, Text } from './ui';
import { useDockActionFor, type DockAction } from './dockAction';
import { useKeyboardVisible } from './keyboard';
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

/** Encres de la barre : celles du thème (verre clair en clair, fumé en sombre). */
function useBarInk() {
  return useTheme().colors;
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

/**
 * Indicateur de VERRE de l'onglet actif (v3, référence « Lightly ») : capsule de verre teinté de la palette, arête
 * claire, lumière diffuse dessous ; elle GLISSE d'un onglet à l'autre (translateX, ressort « panneau » interruptible).
 */
function ActivePill({ x, visible }: { x: number; visible: boolean }) {
  const t = useTheme();
  const ink = useBarInk();
  const m = useMotion();
  const night = t.name === 'night';
  const tx = useSharedValue(x);
  const op = useSharedValue(visible ? 1 : 0);
  const placed = useRef(false);
  useEffect(() => {
    // première position : posée sans animation ; ensuite, glissement en ressort (interruptible)
    tx.value = placed.current ? m.spring(x, 'panneau') : x;
    placed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x]);
  useEffect(() => { op.value = m.timing(visible ? 1 : 0, 160, 'standard'); }, [visible, m, op]);
  const style = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: tx.value }] }));
  return (
    <Animated.View pointerEvents="none" testID="tab-indicator"
      style={[{ position: 'absolute', left: 0, top: ICON_TOP, width: PILL_W, height: PILL_H, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: tint(ink.primary, t.isDark ? 0.2 : 0.14), borderWidth: 1, borderColor: tint(ink.primary, 0.36),
        boxShadow: night ? undefined : [{ offsetX: 0, offsetY: 4, blurRadius: 14, spreadDistance: -2, color: tint(t.tokens.accent.glow[0], t.isDark ? 0.5 : 0.4) }] }, style]}>
      {!night ? <LinearGradient colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0)']} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 0.9 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /> : null}
    </Animated.View>
  );
}

/** Bouton d'action de la barre : « + » (ajout rapide) ou l'action de l'écran affiché (`useDockAction`). */
export function DockActionButton({ route, size = 56, onQuickAdd }: { route: string; size?: number; onQuickAdd?: () => void }) {
  const t = useTheme();
  const custom = useDockActionFor(route);
  const p = usePressScale({ scale: 0.92 });
  const sheen = usePressSheen();
  const action: DockAction = custom ?? { icon: 'plus', label: tr('nav.quickAdd'), hint: tr('nav.quickAddHint'), testID: 'quick-add', onPress: () => onQuickAdd?.() };
  const night = t.name === 'night';
  return (
    <Pressable
      testID={action.testID}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityHint={action.hint}
      onPressIn={() => { p.onPressIn(); sheen.play(); }}
      onPressOut={p.onPressOut}
      onPress={() => { haptic('light'); action.onPress(); }}
      style={{ width: size, height: size }}
    >
      {/* Bouton capsule rond : dégradé de la palette, arête claire, ombre colorée ; reflet qui glisse à la pression */}
      <Animated.View style={[{ flex: 1, borderRadius: size / 2, boxShadow: liquidShadow(t, 'mid') }, p.style]}>
        <LinearGradient colors={night ? [t.colors.primary, t.colors.primary, t.colors.primary] : t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tint('#FFFFFF', t.isDark ? 0.3 : 0.45), overflow: 'hidden' }}>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: size * 0.22, right: size * 0.22, height: 1, backgroundColor: 'rgba(255,255,255,0.5)' }} />
          <Icon name={action.icon as IconName} size={size >= 56 ? 25 : 22} color={t.colors.primaryText} />
          <PressSheen sheen={sheen} intensity={0.45} />
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
  // Clavier ouvert : la barre s'efface (elle recouvrait le champ actif sur le web et en fenêtre réduite) ; elle
  // reste montée (mesures des libellés conservées) mais hors mise en page : ni visible, ni touchable, ni annoncée
  const keyboard = useKeyboardVisible();

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
      <View pointerEvents="box-none" testID="dock"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: bottom, alignItems: 'center', display: keyboard ? 'none' : 'flex' }}>
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
          <LiquidGlass testID="tab-bar-glass" radius={radius.pill} style={{ height: TAB_BAR_H, width: g.barW }}>
          <View
            accessibilityRole="tablist"
            accessibilityLabel={tr('nav.tablist')}
            style={{ height: TAB_BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: g.pad - 1 }}
          >
            <ActivePill x={pillX - 1} visible={activeIndex >= 0} />
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
          </LiquidGlass>
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
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: t.tokens.border.active, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
          <Icon name="message-circle" color={t.colors.primary} />
          <Text weight="bold" style={{ flex: 1 }}>{tr('dock.ask')}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </Tappable>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {items.map((i) => (
          <Tappable
            key={i.label}
            accessibilityRole="button"
            accessibilityLabel={tr('dock.addA11y', { label: i.label })}
            onPress={() => { haptic('light'); i.onPress(); }}
            style={({ pressed }) => ({ width: compact ? '31.5%' : '23%', flexGrow: compact ? 0 : 1, minHeight: compact ? 72 : 76, borderRadius: radius.lg, borderWidth: 1, borderColor: compact ? t.colors.border : t.tokens.border.rest, backgroundColor: pressed ? t.colors.surfaceAlt : compact ? t.colors.surface : t.material.lines.controlFill, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: compact ? spacing.xs : 0 })}
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
  const t = useTheme();
  const { child, go } = useQuickAdd(onClose);
  return (
    <Sheet visible={visible} onClose={onClose} title={child ? tr('dock.forChild', { name: child.first_name }) : tr('dock.add')}>
      {/* Action importante de la feuille : carte lumineuse (filet dégradé + halo), seule mise en avant de l'écran */}
      <GlowCard active emphasis="action" onPress={go(() => router.push('/assistant/chat'))} accessibilityLabel={`${tr('dock.ask')}, ${tr('dock.askSub')}`} testID="quick-ask">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="message-circle" color={t.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr('dock.ask')}</Text>
            <Text variant="small" muted>{tr('dock.askSub')}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
      </GlowCard>
      <QuickAddGrid onBefore={onClose} />
    </Sheet>
  );
}
