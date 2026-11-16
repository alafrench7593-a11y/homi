/**
 * Barre d'onglets HOMI (v5 « Lumière corail », 16/11/2026) : Accueil · Santé · Bébé · Famille · Communauté.
 * Barre PLEINE LARGEUR posée en bas : fond surface, fine ligne de séparation en haut, aucune capsule flottante, aucun
 * verre, aucune ombre épaisse. Icônes d'une seule famille (Feather, via `Icon`).
 *
 * Libellés ENTIERS (jamais coupés, jamais d'ellipse) : chaque onglet prend la largeur de son libellé mesuré (au moins
 * 44 px), la taille commune descend par quarts de pixel (12 → 10 px) ; « Communauté » tient à 320 et 390 px. Au-delà
 * (texte agrandi + langue longue) : icônes seules, nom accessible = libellé complet (`tabLayout`, testé).
 *
 * Onglet actif : icône corail sur une pastille teintée + libellé en gras (couleur + graisse + forme). Changer d'onglet
 * ne glisse pas (pairs, pas une hiérarchie) : l'état actif s'affiche directement ; seule la pression a un ressort.
 *
 * Bouton d'action INTÉGRÉ à droite, dans la barre et à la même hauteur de base que les onglets (rectangle aux angles
 * souples, aplat de l'action principale) : « + » ajout rapide par défaut ; un écran peut le remplacer
 * (`useDockAction` : Communauté → Publier, accueil d'un enfant → Ajouter). Il ne chevauche jamais le contenu.
 * Les écrans d'onglet réservent `TAB_SCREEN_INSET` en bas de leur contenu.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { usePressScale } from '@/motion';
import { GlowCard } from './GlowCard';
import { useScope } from '@/lib/data/hooks-scope';
import { ACTIVE_ALIAS, dockGeometry, estimateLabelWidth, NAV_TABS, TAB_BAR_H, TAB_LABEL_MAX, tabLayout, type NavTab } from '@/features/hubs/hubMap';
import { Sheet } from './Overlays';
import { haptic, Icon, type IconName, Text } from './ui';
import { useDockActionFor, type DockAction } from './dockAction';
import { useKeyboardVisible } from './keyboard';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';

/** Hauteur de la barre au-dessus de la zone sûre. */
export const DOCK_HEIGHT = TAB_BAR_H + 4;
/**
 * Espace UNIQUE à réserver sous le contenu des écrans d'onglet (`<Screen bottomInset>` ou `paddingBottom` d'une
 * liste, en plus de la zone sûre) : la barre et son bouton d'action sont sur la même ligne, rien d'autre ne flotte.
 */
export const TAB_SCREEN_INSET = DOCK_HEIGHT + spacing.xs;
const LONG_PRESS = 'tabLongPress' as const;
/** Pastille de l'onglet actif (derrière l'icône) et position verticale de l'icône dans l'onglet. */
const PILL_W = 44;
const PILL_H = 28;
const ICON_TOP = 6;
/** Icônes seules : icône et pastille centrées verticalement dans la barre. */
const ICON_TOP_ALONE = (TAB_BAR_H - PILL_H) / 2;

function TabItem({ tab, width, focused, label, a11y, fontSize, iconsOnly, onPress, onLongPress }: { tab: NavTab; width: number; focused: boolean; label: string; a11y: string; fontSize: number; iconsOnly: boolean; onPress: () => void; onLongPress: () => void }) {
  const t = useTheme();
  const p = usePressScale({ scale: 0.92, haptic: 'none' });
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
      <Animated.View style={[{ flex: 1, alignItems: 'center', paddingTop: iconsOnly ? ICON_TOP_ALONE : ICON_TOP, gap: 2 }, p.style]}>
        <View style={{ width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? t.material.lines.iconWell : 'transparent' }}
          testID={focused ? 'tab-indicator' : undefined}>
          <Icon name={tab.icon} size={iconsOnly ? 23 : 21} color={focused ? t.colors.primary : t.colors.textMuted} />
        </View>
        {/* Icônes seules (petit écran + texte agrandi) : libellé non affiché, le nom accessible reste le libellé complet */}
        {iconsOnly ? null : <Text
          style={{ fontFamily: focused ? fonts.bodyBold : fonts.bodyMedium, fontSize, lineHeight: Math.round(fontSize * 1.3), letterSpacing: -0.1, textAlign: 'center' }}
          color={focused ? t.colors.text : t.colors.textMuted}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {label}
        </Text>}
      </Animated.View>
    </Pressable>
  );
}

/** Bouton d'action de la barre : « + » (ajout rapide) ou l'action de l'écran affiché (`useDockAction`). */
export function DockActionButton({ route, size = 48, onQuickAdd }: { route: string; size?: number; onQuickAdd?: () => void }) {
  const t = useTheme();
  const custom = useDockActionFor(route);
  const p = usePressScale({ scale: 0.94 });
  const action: DockAction = custom ?? { icon: 'plus', label: tr('nav.quickAdd'), hint: tr('nav.quickAddHint'), testID: 'quick-add', onPress: () => onQuickAdd?.() };
  return (
    <Pressable
      testID={action.testID}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityHint={action.hint}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => { haptic('light'); action.onPress(); }}
      hitSlop={size < 48 ? (48 - size) / 2 : 0}
      style={{ width: size, height: size }}
    >
      {/* Rectangle aux angles souples, aplat de l'action principale (prune en clair, corail en sombre), sans dégradé */}
      <Animated.View style={[{ flex: 1, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.action.fill }, p.style]}>
        <Icon name={action.icon as IconName} size={22} color={t.tokens.action.text} />
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
  const bottom = Math.max(insets.bottom, 4);
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
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: bottom, alignItems: 'center', display: keyboard ? 'none' : 'flex',
          backgroundColor: t.colors.tabBar, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border }}>
        {/* Mesure invisible des libellés à la taille de référence, en graisse active (la plus large) */}
        <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
          <View style={{ width: 1000, alignItems: 'flex-start' }}>
            {labels.map((l) => (
              <Text key={l} onLayout={(e) => { const w = Math.ceil(e.nativeEvent.layout.width); if (w > 0) setNatural((m) => (m[l] === w ? m : { ...m, [l]: w })); }}
                style={{ fontFamily: fonts.bodyBold, fontSize: TAB_LABEL_MAX, letterSpacing: -0.1 }} maxFontSizeMultiplier={1.2} numberOfLines={1}>{l}</Text>
            ))}
          </View>
        </View>
        <View testID="tab-bar-glass" pointerEvents="box-none" style={{ width: g.row, height: TAB_BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: g.pad, gap: g.gap }}>
          <View
            accessibilityRole="tablist"
            accessibilityLabel={tr('nav.tablist')}
            style={{ height: TAB_BAR_H, flexDirection: 'row', alignItems: 'center', width: g.inner }}
          >
            {tabs.map(({ tab, route }, i) => (
              <TabItem
                key={route.key}
                tab={tab}
                width={layout.widths[i]}
                label={labels[i]}
                a11y={descriptors[route.key]?.options.title ?? labels[i]}
                focused={activeName === tab.name}
                fontSize={layout.fontSize}
                iconsOnly={layout.iconsOnly}
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
