/**
 * Barre d'onglets HOMI : Aujourd'hui · Moi · [action centrale] · Enfant · Famille — rendue par `GlassTabBar`
 * (HOMI_DESIGN_SYSTEM.md § 10, 18/11/2026). Capsule de verre FLOTTANTE posée au-dessus du contenu (qui défile dessous),
 * indicateur de l'onglet actif qui GLISSE d'un onglet à l'autre (ressort « panneau »), petite réaction de l'icône
 * choisie, haptique « sélection » discret. Le changement d'onglet lui-même est immédiat (des pairs, pas une hiérarchie).
 * Zones sûres : la capsule se pose sur la zone sûre du bas (ou à 8 pt du bord sans zone sûre).
 *
 * Libellés ENTIERS (jamais coupés, jamais d'ellipse) : chaque onglet prend la largeur de son libellé mesuré (au moins
 * 44 px), la taille commune descend par quarts de pixel (12 → 10 px). Au-delà (texte agrandi + langue longue) : icônes
 * seules, nom accessible = libellé complet (`tabLayout`, testé).
 *
 * L'onglet « Enfant » s'adapte au foyer (`childTabMode`) : « Enfant », « Grossesse » (grossesse sans enfant), ou
 * l'écran qui propose d'ajouter un enfant ou une grossesse.
 *
 * ACTION RAPIDE CENTRALE (nom accessible « Ajouter ») : au centre de la capsule, à portée de pouce, aplat OPAQUE de
 * l'action principale (pas de verre dans le verre). Elle ouvre une feuille de verre (`GlassSheet`) avec 4 à 6 actions
 * du profil affiché (`quickActions.ts`), que la personne peut choisir, plus l'entrée fixe « Tous mes outils ». Un écran
 * peut encore la remplacer (`useDockAction` : Communauté → Publier).
 * Les écrans d'onglet réservent `TAB_SCREEN_INSET` en bas de leur contenu : la barre translucide ne cache jamais le
 * dernier élément d'une page (vérifié en défilant jusqu'en bas, e2e/navigation.py).
 */
import { useMemo, useState } from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { usePressScale } from '@/motion';
import { useScope } from '@/lib/data/hooks-scope';
import { useActivePregnancy, useMemberships, useMyMembership, useProfile, useTrackedChildren } from '@/lib/data/hooks';
import { useMyChildcare } from '@/lib/data/hooks-nounou';
import { isCaregiverOnly } from '@/lib/domain/nounou';
import { useUserId } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { ACTIVE_ALIAS, CHILD_TAB, childTabMode, dockGeometry, dockLayout, estimateLabelWidth, NAV_CENTER_AFTER, NAV_TABS, TAB_LABEL_MAX, type NavTab } from '@/features/hubs/hubMap';
import { QUICK_ACTIONS, QUICK_MAX, QUICK_MIN, quickAvailable, quickHref, quickProfile, quickShown, type QuickActionKey, type QuickCtx } from '@/features/quickActions/quickActions';
import { TodayAddSheet } from '@/features/homeToday/TodayAddSheet';
import { useToast } from './Overlays';
import { GLASS_TAB_BAR, GlassButton, GlassSheet, GlassTabBar, type GlassTab } from './glass';
import { haptic, Icon, type IconName, Text } from './ui';
import { HomiIcon, type HomiIconName } from '@/brand/icons';
import { TAB_IMAGES, TAB_LIT } from '@/brand/tabs';
import { TabLight } from '@/brand/toolGlass/TabLight';
import { useDockActionFor, type DockAction } from './dockAction';
import { useKeyboardVisible } from './keyboard';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';
import { useTourAnchor } from '@/features/tour/anchors';
import { tourEvent, tourQuickChosen } from '@/features/tour/store';

/**
 * Hauteur visuelle de la barre au-dessus de la zone sûre : capsule de verre flottante (60 + 2 × 4) et l'écart qui la
 * sépare du bas quand il n'y a pas de zone sûre (`GLASS_TAB_BAR.floatGap`). Avec une zone sûre, la capsule se pose
 * dessus : sa hauteur visible reste ≤ `DOCK_HEIGHT` + zone sûre.
 */
export const DOCK_HEIGHT = GLASS_TAB_BAR.height + GLASS_TAB_BAR.inset * 2 + GLASS_TAB_BAR.floatGap;
/**
 * Espace UNIQUE à réserver sous le contenu des écrans d'onglet (`<Screen bottomInset>` ou `paddingBottom` d'une
 * liste, en plus de la zone sûre) : la barre est translucide et flotte AU-DESSUS du contenu, qui défile dessous ; le
 * dernier élément d'une page doit pouvoir remonter au-dessus d'elle (`glassScreens.test.tsx`, e2e « défiler jusqu'en
 * bas »).
 */
export const TAB_SCREEN_INSET = DOCK_HEIGHT + spacing.xs;
const LONG_PRESS = 'tabLongPress' as const;
/** Onglet → pictogramme HOMI (l'onglet « Enfant » choisit Enfant ou Grossesse selon le foyer). */
const TAB_GLYPH: Record<string, HomiIconName> = { index: 'today', health: 'me', baby: 'child', household: 'family' };
/** En dessous de cette largeur, la barre ne flotte plus (pleine largeur, collée en bas) : les marges de la capsule
 *  coûteraient 24 pt et feraient passer les libellés en icônes seules à 320 pt. */
export const DOCK_FLOAT_MIN_W = 360;

/** Barre flottante ou pleine largeur, et largeur disponible pour les onglets (bouton central et ses marges déduits). */
export function dockInner(width: number) {
  const g = dockGeometry(width);
  const floating = width >= DOCK_FLOAT_MIN_W;
  const capsule = Math.min(width, 600) - (floating ? GLASS_TAB_BAR.floatMargin * 2 : 0);
  return { action: g.action, floating, capsule, inner: capsule - GLASS_TAB_BAR.inset * 2 - g.action - spacing.xs * 2 };
}

/** Bouton d'action central : « Ajouter » (actions rapides du profil) ou l'action de l'écran affiché (`useDockAction`). */
export function DockActionButton({ route, size = 48, onQuickAdd }: { route: string; size?: number; onQuickAdd?: () => void }) {
  const t = useTheme();
  const custom = useDockActionFor(route);
  const p = usePressScale({ scale: 0.94 });
  const anchor = useTourAnchor('quick-add');
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
      <View {...anchor} style={{ flex: 1 }}>
      {/* Rectangle aux angles souples, aplat de l'action principale (prune en clair, corail en sombre), sans dégradé */}
      <Animated.View style={[{ flex: 1, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: action.icon === 'plus' ? 'transparent' : t.tokens.action.fill }, p.style]}>
        {/* « Ajouter » : tuile illustrée de la barre ; une action d'écran garde son icône sur l'aplat */}
        {action.icon === 'plus' ? (
          // lumière jaune douce derrière « + » (même lumière que les onglets, toujours vive : c'est l'action principale)
          <TabLight size={size} active lit={TAB_LIT.add} testID="dock-add-light"><Image source={TAB_IMAGES.add} accessibilityIgnoresInvertColors style={{ width: size, height: size }} /></TabLight>
        )
          : <Icon name={action.icon as IconName} size={24} color={t.tokens.action.text} />}
      </Animated.View>
      </View>
    </Pressable>
  );
}

export function Dock({ state, navigation, descriptors }: BottomTabBarProps) {
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
  // Pictogrammes de la famille HOMI (src/brand/icons) : Aujourd'hui, Moi, Enfant / Grossesse, Famille
  const glyphs = tabs.map((x) => (x.tab.name === 'baby' ? (childTab.icon === 'heart' ? 'pregnancy' : 'child') : TAB_GLYPH[x.tab.name]));

  const g = dockInner(width);
  // Libellés jamais coupés : largeur réelle mesurée (police chargée, langue active, taille de texte du téléphone),
  // estimation prudente avant la première mesure
  const [natural, setNatural] = useState<Record<string, number>>({});
  const widthsKey = labels.map((l) => natural[l] ?? estimateLabelWidth(l)).join('|');
  // Deux moitiés égales de part et d'autre du bouton : il reste au milieu de l'écran quel que soit le libellé
  const layout = useMemo(() => dockLayout(g.inner, widthsKey.split('|').map(Number)), [g.inner, widthsKey]);
  // Clavier ouvert : la barre s'efface (elle recouvrait le champ actif sur le web et en fenêtre réduite) ; elle
  // reste montée (mesures des libellés conservées) mais hors mise en page : ni visible, ni touchable, ni annoncée
  const keyboard = useKeyboardVisible();
  const caregiver = isCaregiverOnly(useMemberships().data);

  const glassTabs: GlassTab[] = tabs.map(({ tab, route }, i) => ({
    key: route.name,
    label: labels[i],
    icon: icons[i],
    glyph: glyphs[i],
    image: glyphs[i] && glyphs[i] in TAB_IMAGES ? TAB_IMAGES[glyphs[i] as keyof typeof TAB_IMAGES] : undefined,
    imageLit: glyphs[i] && glyphs[i] in TAB_LIT ? TAB_LIT[glyphs[i] as keyof typeof TAB_LIT] : undefined,
    accessibilityLabel: tab.name === 'baby' ? labels[i] : descriptors[route.key]?.options.title ?? labels[i],
    width: layout.widths[i],
    testID: `tab-${tab.name}`,
  }));

  // Changement d'onglet immédiat ; l'haptique « sélection » part de la barre (une seule par changement)
  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (focusedName !== route.name && !ev.defaultPrevented) navigation.navigate(route.name);
  };
  const longPress = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (route) navigation.emit({ type: LONG_PRESS, target: route.key });
  };

  // Compte qui n'est QUE nounou : ni onglets ni profils du foyer ; « Mes gardes » + « Ajouter un événement » (enfant gardé)
  if (caregiver) {
    return (
      <View pointerEvents="box-none" testID="dock" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', display: keyboard ? 'none' : 'flex' }}>
        <GlassTabBar testID="tab-bar-glass" tabs={[{ key: 'garde', label: tr('nn.home.title'), icon: 'briefcase', glyph: 'notebook', testID: 'tab-garde' }]} activeKey=""
          onChange={() => router.push('/garde' as never)} center={<CareAddButton size={g.action} />} centerAfter={1} floating={g.floating}
          labelSize={layout.fontSize} accessibilityLabel={tr('nav.tablist')} style={{ width: Math.min(width, 600) }} />
      </View>
    );
  }

  return (
    <>
      <View pointerEvents="box-none" testID="dock"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', display: keyboard ? 'none' : 'flex' }}>
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
        <GlassTabBar
          testID="tab-bar-glass"
          tabs={glassTabs}
          activeKey={activeName}
          onChange={go}
          onLongPress={longPress}
          center={<DockActionButton route={focusedName} size={g.action} onQuickAdd={() => setOpen(true)} />}
          centerAfter={NAV_CENTER_AFTER}
          floating={g.floating}
          labelSize={layout.fontSize}
          iconsOnly={layout.iconsOnly}
          accessibilityLabel={tr('nav.tablist')}
          style={{ width: Math.min(width, 600) }}
        />
      </View>
      <QuickActionSheet visible={open} family={activeName === 'household'} onClose={() => setOpen(false)} />
    </>
  );
}

/** Action centrale d'un compte nounou : « Ajouter un événement » pour l'enfant gardé (le premier accès actif). */
function CareAddButton({ size }: { size: number }) {
  const t = useTheme();
  const p = usePressScale({ scale: 0.94 });
  const care = useMyChildcare().data ?? [];
  const child = care.find((l) => l.status === 'active' && l.child)?.child ?? null;
  return (
    <Pressable testID="care-quick-add" accessibilityRole="button" accessibilityLabel={child ? `${tr('nn.add.cta')}, ${child.first_name}` : tr('nn.add.cta')}
      onPressIn={p.onPressIn} onPressOut={p.onPressOut} hitSlop={size < 48 ? (48 - size) / 2 : 0} style={{ width: size, height: size }}
      onPress={() => { haptic('light'); router.push((child ? `/garde/${child.id}/ajouter` : '/garde') as never); }}>
      <Animated.View style={[{ flex: 1, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: t.tokens.action.fill }, p.style]}>
        <HomiIcon name="add" size={26} color={t.tokens.action.text} tone={null} />
      </Animated.View>
    </Pressable>
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
      <GlassButton label={tr('common.save')} variant="primary" full testID="qa-pick-save" onPress={() => { if (draft.length < QUICK_MIN) { toast(tr('qa.min', { min: QUICK_MIN }), 'info'); return; } setChosen(ctx.profile, draft); onDone(); }} />
      <GlassButton label={tr('qa.pickReset')} variant="tertiary" testID="qa-pick-reset" onPress={() => { setChosen(ctx.profile, null); onDone(); }} />
    </View>
  );
}

function QuickActionSheet({ visible, family, onClose }: { visible: boolean; family?: boolean; onClose: () => void }) {
  const t = useTheme();
  const { ctx, childId, childName, pregnancy } = useQuickCtx();
  const chosen = useUiStore((s) => s.quickActionFavorites[ctx.profile]);
  const me = useUserId();
  const membership = useMyMembership();
  const canEdit = !!membership && (membership.role === 'owner' || (membership.can_edit ?? []).includes('lists'));
  const [picking, setPicking] = useState(false);
  const [task, setTask] = useState(false);
  // Onglet Famille : « Confier une mission » et « Créer une tâche » d'abord (le foyer), puis les actions du profil
  const keys = family ? [...new Set<QuickActionKey>(['mission', 'task', ...quickShown(ctx, chosen)])].slice(0, QUICK_MAX) : quickShown(ctx, chosen);
  const close = () => { setPicking(false); onClose(); };
  const after = (fn: () => void) => { close(); setTimeout(fn, 180); };
  const run = (k: QuickActionKey) => {
    haptic('light');
    const href = quickHref(k, { childId, pregnancy });
    // Visite guidée : une action est choisie (son formulaire s'ouvre ; la tâche est une feuille sur place)
    tourQuickChosen(k, !!href);
    after(href ? () => router.push(href as never) : () => setTask(true));
  };
  return (
    <>
      <GlassSheet visible={visible} onClose={close} title={picking ? tr('qa.pickTitle') : childName ? tr('dock.forChild', { name: childName }) : tr('qa.title')}>
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
            <GlassButton label={tr('qa.customize')} icon="sliders" variant="tertiary" size="sm" testID="qa-customize" onPress={() => { haptic('selection'); setPicking(true); }} />
          </View>
        )}
      </GlassSheet>
      {/* « Créer une tâche » : disponible depuis tous les onglets (avant : seulement sur l'accueil) */}
      <TodayAddSheet visible={task} onClose={() => { setTask(false); tourEvent({ type: 'quickFormClosed' }); }} me={me} canEdit={canEdit} />
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
