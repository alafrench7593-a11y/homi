/**
 * Barre d'onglets HOMI (refonte du 17/11/2026) : Aujourd'hui · Moi · [action centrale] · Enfant · Famille.
 * Barre PLEINE LARGEUR posée en bas : fond surface, fine ligne de séparation en haut, aucune capsule flottante, aucun
 * verre, aucune ombre épaisse. Icônes d'une seule famille (Feather, via `Icon`).
 *
 * Libellés ENTIERS (jamais coupés, jamais d'ellipse) : chaque onglet prend la largeur de son libellé mesuré (au moins
 * 44 px), la taille commune descend par quarts de pixel (12 → 10 px). Au-delà (texte agrandi + langue longue) : icônes
 * seules, nom accessible = libellé complet (`tabLayout`, testé).
 *
 * L'onglet « Enfant » s'adapte au foyer (`childTabMode`) : « Enfant », « Grossesse » (grossesse sans enfant), ou
 * l'écran qui propose d'ajouter un enfant ou une grossesse.
 *
 * ACTION RAPIDE CENTRALE (nom accessible « Ajouter ») : au centre de la barre, à portée de pouce. Elle ouvre une
 * feuille du bas avec 4 à 6 actions du profil affiché (`quickActions.ts`), que la personne peut choisir, plus l'entrée
 * fixe « Tous mes outils ». Un écran peut encore la remplacer (`useDockAction` : Communauté → Publier).
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
import { useScope } from '@/lib/data/hooks-scope';
import { useActivePregnancy, useMyMembership, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useUserId } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { ACTIVE_ALIAS, CHILD_TAB, childTabMode, dockGeometry, dockLayout, estimateLabelWidth, NAV_CENTER_AFTER, NAV_TABS, TAB_BAR_H, TAB_LABEL_MAX, type NavTab } from '@/features/hubs/hubMap';
import { QUICK_ACTIONS, QUICK_MAX, QUICK_MIN, quickAvailable, quickHref, quickProfile, quickShown, type QuickActionKey, type QuickCtx } from '@/features/quickActions/quickActions';
import { TodayAddSheet } from '@/features/homeToday/TodayAddSheet';
import { Sheet, useToast } from './Overlays';
import { Button, haptic, Icon, type IconName, Text } from './ui';
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

function TabItem({ tab, icon, width, focused, label, a11y, fontSize, iconsOnly, onPress, onLongPress }: { tab: NavTab; icon: IconName; width: number; focused: boolean; label: string; a11y: string; fontSize: number; iconsOnly: boolean; onPress: () => void; onLongPress: () => void }) {
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
          <Icon name={icon} size={iconsOnly ? 23 : 21} color={focused ? t.colors.primary : t.colors.textMuted} />
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

/** Bouton d'action central : « Ajouter » (actions rapides du profil) ou l'action de l'écran affiché (`useDockAction`). */
export function DockActionButton({ route, size = 48, onQuickAdd }: { route: string; size?: number; onQuickAdd?: () => void }) {
  const t = useTheme();
  const custom = useDockActionFor(route);
  const p = usePressScale({ scale: 0.94 });
  const action: DockAction = custom ?? { icon: 'plus', label: tr('qa.buttonA11y'), hint: tr('qa.buttonHint'), testID: 'quick-add', onPress: () => onQuickAdd?.() };
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
        <Icon name={action.icon as IconName} size={24} color={t.tokens.action.text} />
      </Animated.View>
    </Pressable>
  );
}

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const { data: kids } = useTrackedChildren();
  const pregnancy = useActivePregnancy();
  const childTab = CHILD_TAB[childTabMode({ children: kids?.length ?? 0, pregnancy: !!pregnancy })];

  const focusedName = state.routes[state.index]?.name ?? 'index';
  const activeName = ACTIVE_ALIAS[focusedName] ?? focusedName;
  const tabs = NAV_TABS.map((tab) => ({ tab, route: state.routes.find((r) => r.name === tab.name) })).filter((x): x is { tab: NavTab; route: (typeof state.routes)[number] } => !!x.route);
  // L'onglet « Enfant » porte le libellé de la situation du foyer (Enfant / Grossesse)
  const labels = tabs.map((x) => tr(x.tab.name === 'baby' ? childTab.label : x.tab.label));
  const icons = tabs.map((x) => (x.tab.name === 'baby' ? childTab.icon : x.tab.icon));

  const g = dockGeometry(width);
  // Libellés jamais coupés : largeur réelle mesurée (police chargée, langue active, taille de texte du téléphone),
  // estimation prudente avant la première mesure
  const [natural, setNatural] = useState<Record<string, number>>({});
  const widthsKey = labels.map((l) => natural[l] ?? estimateLabelWidth(l)).join('|');
  // Deux moitiés égales de part et d'autre du bouton : il reste au milieu de l'écran quel que soit le libellé
  const layout = useMemo(() => dockLayout(g.inner, widthsKey.split('|').map(Number)), [g.inner, widthsKey]);
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
  const item = ({ tab, route }: (typeof tabs)[number], i: number) => (
    <TabItem
      key={route.key}
      tab={tab}
      icon={icons[i]}
      width={layout.widths[i]}
      label={labels[i]}
      a11y={tab.name === 'baby' ? labels[i] : descriptors[route.key]?.options.title ?? labels[i]}
      focused={activeName === tab.name}
      fontSize={layout.fontSize}
      iconsOnly={layout.iconsOnly}
      onPress={() => go(route)}
      onLongPress={() => navigation.emit({ type: LONG_PRESS, target: route.key })}
    />
  );

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
        {/* Onglets de part et d'autre de l'action centrale : Aujourd'hui · Moi · [Ajouter] · Enfant · Famille */}
        <View testID="tab-bar-glass" accessibilityRole="tablist" accessibilityLabel={tr('nav.tablist')}
          style={{ width: g.row, height: TAB_BAR_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: g.pad }}>
          {tabs.slice(0, NAV_CENTER_AFTER).map((x, i) => item(x, i))}
          <View style={{ marginHorizontal: g.gap }}>
            <DockActionButton route={focusedName} size={g.action} onQuickAdd={() => setOpen(true)} />
          </View>
          {tabs.slice(NAV_CENTER_AFTER).map((x, i) => item(x, i + NAV_CENTER_AFTER))}
        </View>
      </View>
      <QuickActionSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------- action rapide centrale
/** Contexte de l'action rapide pour le profil affiché. */
export function useQuickCtx(): { ctx: QuickCtx; childId: string | null; childName: string | null; pregnancy: boolean } {
  const scope = useScope();
  const { data: profile } = useProfile();
  return {
    ctx: { profile: quickProfile(scope.scope), postpartum: scope.postpartum, hideWeight: !!profile?.hide_weight_module },
    childId: scope.childId ?? null, childName: scope.child?.first_name ?? null, pregnancy: scope.scope === 'pregnancy',
  };
}

/** Choix des actions rapides du profil affiché (cases à cocher, 4 à 6) : feuille centrale et mode « Personnaliser ». */
export function QuickActionPicker({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const { ctx } = useQuickCtx();
  const chosen = useUiStore((s) => s.quickActionFavorites[ctx.profile]);
  const setChosen = useUiStore((s) => s.setQuickActionFavorites);
  const [draft, setDraft] = useState<QuickActionKey[]>(() => quickShown(ctx, chosen));
  const available = quickAvailable(ctx);
  return (
    <View style={{ gap: spacing.xs }} testID="qa-picker">
      <Text variant="small" muted>{tr('qa.pickHint', { min: QUICK_MIN, max: QUICK_MAX })}</Text>
      {available.map((k) => {
        const on = draft.includes(k);
        return (
          <Tappable key={k} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} testID={`qa-pick-${k}`} accessibilityLabel={tr(QUICK_ACTIONS[k].label)}
            onPress={() => { haptic('selection'); if (on) setDraft(draft.filter((x) => x !== k)); else if (draft.length >= QUICK_MAX) toast(tr('qa.max', { max: QUICK_MAX }), 'info'); else setDraft([...draft, k]); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
            <Icon name={on ? 'check-square' : 'square'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
            <Icon name={QUICK_ACTIONS[k].icon} size={20} color={t.colors.text} />
            <Text weight="medium" style={{ flex: 1 }}>{tr(QUICK_ACTIONS[k].label)}</Text>
          </Tappable>
        );
      })}
      <Button label={tr('common.save')} full testID="qa-pick-save" onPress={() => { if (draft.length < QUICK_MIN) { toast(tr('qa.min', { min: QUICK_MIN }), 'info'); return; } setChosen(ctx.profile, draft); onDone(); }} />
      <Button label={tr('qa.pickReset')} variant="ghost" testID="qa-pick-reset" onPress={() => { setChosen(ctx.profile, null); onDone(); }} />
    </View>
  );
}

function QuickActionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { ctx, childId, childName, pregnancy } = useQuickCtx();
  const chosen = useUiStore((s) => s.quickActionFavorites[ctx.profile]);
  const me = useUserId();
  const membership = useMyMembership();
  const canEdit = !!membership && (membership.role === 'owner' || (membership.can_edit ?? []).includes('lists'));
  const [picking, setPicking] = useState(false);
  const [task, setTask] = useState(false);
  const keys = quickShown(ctx, chosen);
  const close = () => { setPicking(false); onClose(); };
  const after = (fn: () => void) => { close(); setTimeout(fn, 180); };
  const run = (k: QuickActionKey) => {
    haptic('light');
    const href = quickHref(k, { childId, pregnancy });
    after(href ? () => router.push(href as never) : () => setTask(true));
  };
  return (
    <>
      <Sheet visible={visible} onClose={close} title={picking ? tr('qa.pickTitle') : childName ? tr('dock.forChild', { name: childName }) : tr('qa.title')}>
        {picking ? <QuickActionPicker onDone={() => setPicking(false)} /> : (
          <View testID="quick-sheet" style={{ gap: spacing.sm }}>
            {/* 4 à 6 actions du profil : grandes cibles sur deux colonnes, pictogramme AU-DESSUS du libellé explicite
                (à 320 pt, un libellé à côté de l'icône était coupé au milieu des mots) */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {keys.map((k) => (
                <Tappable key={k} accessibilityRole="button" accessibilityLabel={tr(QUICK_ACTIONS[k].label)} testID={`qa-${k}`} onPress={() => run(k)}
                  style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, minHeight: 92, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: spacing.xs, paddingVertical: spacing.sm,
                    backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, alignItems: 'center', justifyContent: 'center', gap: 6 })}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.lines.iconWell }}>
                    <Icon name={QUICK_ACTIONS[k].icon} size={20} color={t.colors.primary} />
                  </View>
                  <Text variant="small" weight="bold" center>{tr(QUICK_ACTIONS[k].label)}</Text>
                </Tappable>
              ))}
            </View>
            {/* Entrée fixe : tous les outils (recherche, favoris), quel que soit le profil */}
            <Tappable accessibilityRole="button" accessibilityLabel={tr('qa.tools')} testID="qa-tools" onPress={() => { haptic('light'); after(() => router.push('/tools')); }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: t.tokens.border.active, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
              <Icon name="grid" color={t.colors.primary} />
              <Text weight="bold" style={{ flex: 1 }}>{tr('qa.tools')}</Text>
              <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
            </Tappable>
            <Button label={tr('qa.customize')} icon="sliders" variant="ghost" size="sm" testID="qa-customize" onPress={() => { haptic('selection'); setPicking(true); }} />
          </View>
        )}
      </Sheet>
      {/* « Créer une tâche » : disponible depuis tous les onglets (avant : seulement sur l'accueil) */}
      <TodayAddSheet visible={task} onClose={() => setTask(false)} me={me} canEdit={canEdit} />
    </>
  );
}

/**
 * Grille d'ajouts du profil affiché (écran « Outils ») : TOUJOURS pour le profil affiché.
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
    { icon: 'moon', label: tr('dock.q.sleep'), onPress: track('sleep'), show: kid },
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
