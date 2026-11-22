/**
 * Navigation de verre : `GlassTabBar`, `GlassSegmentedControl`, `GlassProfileSwitcher` (HOMI_DESIGN_SYSTEM.md § 10).
 * Composants de PRÉSENTATION purs, pilotés par props : ils ne lisent ni le routeur ni le magasin.
 *
 * Les trois partagent le DÉPLACEMENT D'INDICATEUR (`useItemLayouts` + `useIndicator`, src/motion) : l'élément de
 * sélection glisse vers le choix actif (ressort « panneau », pose immédiate avec « Réduire les animations »).
 * La sélection n'est jamais portée par la couleur seule : indicateur + graisse du libellé + état annoncé.
 *
 * Brancher sur l'existant (sans les modifier ici) :
 *  - `Dock` : `tabs` = ses onglets (`key` = nom de route, `width` = largeur calculée par `dockLayout`, `labelSize`,
 *    `iconsOnly`), `center` = `<DockActionButton />`, `centerAfter` = `NAV_CENTER_AFTER`, `onChange` = sa fonction `go` ;
 *  - `ProfileSwitcher` : `profiles` = `useProfileList().list` (avatar = `UserAvatar` / `ChildAvatar` / glyphe),
 *    `activeKey` = clé du profil affiché, `onChange` = `select`.
 */
import React, { useEffect, useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius as R, spacing } from '@/theme/tokens';
import { motionHaptic, useIndicator, useItemLayouts, useLiquidIndicator, useMotion, usePress } from '@/motion';
import { t as tr } from '@/i18n';
import { Icon, Text, type IconName } from '../ui';
import { HomiIcon, type HomiIconName } from '@/brand/icons';
import { TabLight } from '@/brand/toolGlass/TabLight';
import { Glass, useGlass } from './Glass';
import { LiquidLensMaterial } from './liquid/LiquidLens';
import type { LensParams } from './liquid/params';

// ---------------------------------------------------------------------------------------------- barre d'onglets
export interface GlassTab {
  key: string;
  label: string;
  icon: IconName;
  /** Pictogramme de la famille HOMI (prioritaire sur `icon`) : trait d'encre + aplat de l'accent, plus présent quand l'onglet est actif. */
  glyph?: HomiIconName;
  /** Tuile illustrée (prioritaire sur `glyph`) : pleine quand l'onglet est actif, estompée sinon. */
  image?: ImageSourcePropType;
  /** Lumière intérieure du dessin (même cadrage que `image`) */
  imageLit?: ImageSourcePropType;
  /** Nom annoncé (défaut : `label`) */
  accessibilityLabel?: string;
  /** Largeur imposée (ex. `dockLayout`) ; sinon les onglets se partagent la place */
  width?: number;
  testID?: string;
}

export interface GlassTabBarProps {
  tabs: GlassTab[];
  activeKey: string;
  onChange: (key: string) => void;
  onLongPress?: (key: string) => void;
  /** Emplacement central pour une action (ex. `<GlassFab />`, `<DockActionButton />`) */
  center?: React.ReactNode;
  /** Nombre d'onglets avant l'emplacement central (défaut : la moitié) */
  centerAfter?: number;
  /** `true` (défaut) : capsule flottante avec marges ; `false` : barre pleine largeur collée en bas */
  floating?: boolean;
  /** Zone sûre du bas : lue par défaut (`useSafeAreaInsets`) ; `0` si le parent la gère déjà */
  bottomInset?: number;
  labelSize?: number;
  iconsOnly?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * Verre LIQUIDE (réfraction de la lèvre, reflet orienté, frange réglable : `./liquid`). Absent : verre « chrome »
   * habituel. Réglé en direct par le laboratoire `/dev/liquid-glass`.
   */
  liquid?: LensParams;
}

export const GLASS_TAB_BAR = { height: 60, inset: 4, floatMargin: 12, floatGap: 8 } as const;

function TabItem({ tab, active, labelSize, iconsOnly, onPress, onLongPress, onLayout }: {
  tab: GlassTab; active: boolean; labelSize: number; iconsOnly: boolean; onPress: () => void; onLongPress?: () => void; onLayout: React.ComponentProps<typeof Pressable>['onLayout'];
}) {
  const { spec } = useGlass('chrome');
  const m = useMotion();
  const p = usePress({ scale: 0.92, haptic: 'none' });
  // Réaction de l'icône : petit saut quand l'onglet DEVIENT actif (jamais au montage)
  const pop = useSharedValue(1);
  const was = useRef(active);
  useEffect(() => {
    if (active && !was.current && m.level === 'full') {
      pop.value = 1.16;
      pop.value = m.spring(1, 'rebondLeger');
    }
    was.current = active;
  }, [active, m, pop]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const ink = active ? spec.inks.text : spec.inks.muted;
  const accent = useTheme().colors.primary;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      aria-selected={active}
      accessibilityLabel={tab.accessibilityLabel ?? tab.label}
      testID={tab.testID ?? `glass-tab-${tab.key}`}
      onLayout={onLayout}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      pressRetentionOffset={12}
      style={[{ height: GLASS_TAB_BAR.height, minWidth: 44 }, tab.width ? { width: tab.width } : { flex: 1 }]}
    >
      <Animated.View style={[styles.tab, p.style]}>
        <Animated.View style={iconStyle}>
          {tab.image ? (
            // lumière jaune douce derrière l'icône : vive sous l'onglet actif, discrète sinon
            <TabLight size={iconsOnly ? 34 : 30} active={active} lit={tab.imageLit} testID={`${tab.testID ?? `glass-tab-${tab.key}`}-light${active ? '-active' : ''}`}>
              <Image source={tab.image} accessibilityIgnoresInvertColors style={{ width: iconsOnly ? 34 : 30, height: iconsOnly ? 34 : 30, opacity: active ? 1 : 0.55 }} />
            </TabLight>
          )
            : tab.glyph ? <HomiIcon name={tab.glyph} size={iconsOnly ? 26 : 24} color={ink} tone={accent} active={active} /> : <Icon name={tab.icon} size={iconsOnly ? 24 : 22} color={ink} />}
        </Animated.View>
        {iconsOnly ? null : (
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} color={ink}
            style={{ fontFamily: active ? fonts.bodyBold : fonts.bodyMedium, fontSize: labelSize, lineHeight: Math.round(labelSize * 1.3), letterSpacing: -0.1, textAlign: 'center' }}>{tab.label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function GlassTabBar({ tabs, activeKey, onChange, onLongPress, center, centerAfter, floating = true, bottomInset, labelSize = 11, iconsOnly = false, accessibilityLabel, style, testID = 'glass-tab-bar', liquid }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { spec } = useGlass('chrome');
  const lensLit = theme.name !== 'night';
  const { layouts, onItemLayout } = useItemLayouts<string>();
  // indicateur LIQUIDE : glisse et s'étire dans le sens du trajet (docs/DA_LIQUID_GLASS.md)
  const indicator = useLiquidIndicator(layouts[activeKey]);
  const safe = bottomInset ?? insets.bottom;
  const split = center ? (centerAfter ?? Math.ceil(tabs.length / 2)) : tabs.length;
  const radius = floating ? (GLASS_TAB_BAR.height + GLASS_TAB_BAR.inset * 2) / 2 : 0;
  const item = (tab: GlassTab) => (
    <TabItem key={tab.key} tab={tab} active={tab.key === activeKey} labelSize={labelSize} iconsOnly={iconsOnly} onLayout={onItemLayout(tab.key)}
      onPress={() => { if (tab.key !== activeKey) motionHaptic('selection'); onChange(tab.key); }}
      onLongPress={onLongPress ? () => onLongPress(tab.key) : undefined} />
  );
  return (
    <View pointerEvents="box-none" testID={testID}
      style={[floating ? { paddingHorizontal: GLASS_TAB_BAR.floatMargin, paddingBottom: Math.max(safe, GLASS_TAB_BAR.floatGap) } : null, style]}>
      <TabBarMaterial liquid={liquid} radius={radius} floating={floating} testID={`${testID}-glass`}
        contentStyle={{ paddingHorizontal: GLASS_TAB_BAR.inset, paddingTop: GLASS_TAB_BAR.inset, paddingBottom: GLASS_TAB_BAR.inset + (floating ? 0 : safe) }}>
        <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel ?? tr('glass.tabs')} style={styles.tabRow}>
          {/* LENTILLE de l'onglet actif (référence 03 / 04, 21/11/2026) : verre bombé qui glisse d'un onglet à l'autre —
              reflet clair en haut, arête lumineuse (sans lueur colorée : la lumière reste dans le symbole, TabLight). Décor seul :
              le rendu des pictogrammes d'onglet reste celui de `TabItem`. Nuit : lentille plate, sans lueur. */}
          <Animated.View pointerEvents="none" testID={`${testID}-indicator`}
            style={[styles.indicator, { borderRadius: GLASS_TAB_BAR.height / 2, backgroundColor: spec.indicator, borderColor: spec.indicatorEdge, boxShadow: spec.indicatorShadow, overflow: 'hidden' }, indicator]}>
            {lensLit ? (
              <>
                {/* Ticket 2 : plus de lueur colorée au centre de la lentille — elle se lisait comme une lumière débordant
                    du pictogramme. La lumière est DANS le symbole (TabLight) ; la lentille garde son reflet clair et son arête. */}
                <LinearGradient colors={[spec.highlight[0], spec.highlight[1]]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.lensSheen} />
                <View style={[StyleSheet.absoluteFill, { borderRadius: GLASS_TAB_BAR.height / 2, borderTopWidth: 1, borderColor: theme.tokens.glow.edge, opacity: 0.7 }]} />
              </>
            ) : null}
          </Animated.View>
          {tabs.slice(0, split).map(item)}
          {center ? <View style={styles.center}>{center}</View> : null}
          {tabs.slice(split).map(item)}
        </View>
      </TabBarMaterial>
    </View>
  );
}

/** Support de la barre : verre « chrome » habituel, ou verre LIQUIDE (calque sous les onglets, qui restent nets). */
function TabBarMaterial({ liquid, radius, floating, testID, contentStyle, children }: {
  liquid?: LensParams; radius: number; floating: boolean; testID: string; contentStyle: ViewStyle; children: React.ReactNode;
}) {
  if (!liquid) {
    return <Glass variant="chrome" radius={radius} edges={floating ? 'all' : 'top'} testID={testID} contentStyle={contentStyle}>{children}</Glass>;
  }
  return (
    <View testID={testID} style={{ borderRadius: radius }}>
      <LiquidLensMaterial radius={radius} params={liquid} testID={`${testID}-liquid`} />
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------- sélecteur segmenté
export interface GlassSegment<T extends string> { value: T; label: string; icon?: IconName; testID?: string }

export function GlassSegmentedControl<T extends string>({ options, value, onChange, label, style, testID = 'glass-segmented' }: {
  options: GlassSegment<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Nom du groupe annoncé aux lecteurs d'écran */
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { spec } = useGlass('chrome');
  const { layouts, onItemLayout } = useItemLayouts<T>();
  const indicator = useIndicator(layouts[value]);
  return (
    <Glass variant="chrome" radius={R.control + 4} testID={testID} style={style} contentStyle={{ padding: 4 }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segRow}>
        <Animated.View pointerEvents="none" testID={`${testID}-indicator`}
          style={[styles.indicator, { borderRadius: R.control, backgroundColor: spec.indicator, borderColor: spec.indicatorEdge, boxShadow: spec.indicatorShadow }, indicator]} />
        {options.map((o) => {
          const active = o.value === value;
          const ink = active ? spec.inks.text : spec.inks.muted;
          return (
            <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: active, checked: active }} aria-checked={active} accessibilityLabel={o.label}
              testID={o.testID ?? `${testID}-${o.value}`} onLayout={onItemLayout(o.value)} hitSlop={{ top: 4, bottom: 4 }}
              onPress={() => { if (!active) { motionHaptic('selection'); onChange(o.value); } }} style={({ pressed }) => [styles.segment, pressed && !active ? { opacity: 0.7 } : null]}>
              {o.icon ? <Icon name={o.icon} size={16} color={ink} /> : null}
              <Text variant="small" numberOfLines={1} maxFontSizeMultiplier={1.4} color={ink} style={{ fontFamily: active ? fonts.bodyBold : fonts.bodyMedium, flexShrink: 1 }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Glass>
  );
}

// ---------------------------------------------------------------------------------------------- sélecteur de profil
export interface GlassProfile {
  key: string;
  label: string;
  /** Nom annoncé (ex. « Léa, 8 mois ») ; défaut : `label` */
  accessibilityLabel?: string;
  /** Avatar déjà rendu à la taille `size` (photo, initiale, glyphe) */
  avatar: React.ReactNode;
  testID?: string;
}

export const GLASS_PROFILE = { size: 48, ring: 5, item: 68 } as const;

export function GlassProfileSwitcher({ profiles, activeKey, onChange, onAdd, addLabel, addCaption, addTestID, ringTestID, scrollProps, size = GLASS_PROFILE.size, glass = true, label, style, testID = 'glass-profile-switcher' }: {
  profiles: GlassProfile[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Affiche « ajouter un profil » en bout de rangée */
  onAdd?: () => void;
  /** Nom annoncé de « ajouter » (ex. « Ajouter un profil ») */
  addLabel?: string;
  /** Libellé visible court sous « + » (défaut : `addLabel`) */
  addCaption?: string;
  addTestID?: string;
  ringTestID?: string;
  /** Propriétés supplémentaires de la rangée défilante (ex. exclusion d'un geste parent) */
  scrollProps?: Partial<React.ComponentProps<typeof ScrollView>>;
  size?: number;
  /** `true` (défaut) : rangée posée dans une capsule de verre ; `false` : rangée nue (fond uni) */
  glass?: boolean;
  /** Nom du groupe annoncé (défaut : « Profils ») */
  label?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const { spec } = useGlass('chrome');
  const { layouts, onItemLayout } = useItemLayouts<string>();
  const slide = useIndicator(layouts[activeKey]);
  const scroll = useRef<ScrollView>(null);
  const ring = size + GLASS_PROFILE.ring * 2;
  const itemW = Math.max(GLASS_PROFILE.item, ring + 8);
  const x = layouts[activeKey]?.x;
  // le profil actif reste visible dans la rangée
  useEffect(() => { if (x !== undefined) scroll.current?.scrollTo({ x: Math.max(0, x - itemW), animated: true }); }, [x, itemW]);
  const text = glass ? spec.inks.text : t.colors.text;
  const muted = glass ? spec.inks.muted : t.colors.textMuted;
  const row = (
    <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" accessibilityLabel={label ?? tr('glass.profiles')} {...scrollProps}
      contentContainerStyle={{ paddingHorizontal: glass ? spacing.xs : 0, paddingVertical: glass ? spacing.xs : 2 }}>
      {/* Anneau de sélection : UN seul, qui glisse d'un avatar à l'autre */}
      <Animated.View pointerEvents="none" testID={ringTestID ?? `${testID}-ring`} style={[styles.ringTrack, { top: glass ? spacing.xs : 2, height: ring }, slide]}>
        <View style={{ width: ring, height: ring, borderRadius: ring / 2, borderWidth: 2.5, borderColor: glass ? spec.inks.accent : t.colors.primary }} />
      </Animated.View>
      {profiles.map((p) => {
        const active = p.key === activeKey;
        return (
          <Pressable key={p.key} accessibilityRole="radio" accessibilityState={{ selected: active, checked: active }} aria-checked={active}
            accessibilityLabel={p.accessibilityLabel ?? p.label} testID={p.testID ?? `${testID}-${p.key}`} onLayout={onItemLayout(p.key)}
            onPress={() => { if (!active) { motionHaptic('selection'); onChange(p.key); } }} style={({ pressed }) => ({ width: itemW, alignItems: 'center', gap: 2, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
            <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>{p.avatar}</View>
            <Text variant="caption" weight={active ? 'bold' : 'medium'} color={active ? text : muted} numberOfLines={1} center style={{ maxWidth: itemW - 4 }}>{p.label}</Text>
          </Pressable>
        );
      })}
      {onAdd && addLabel ? (
        <Pressable accessibilityRole="button" accessibilityLabel={addLabel} testID={addTestID ?? `${testID}-add`} onPress={onAdd} style={({ pressed }) => ({ width: itemW, alignItems: 'center', gap: 2, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
          <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: muted }}>
              <Icon name="plus" size={20} color={text} />
            </View>
          </View>
          <Text variant="caption" weight="medium" color={muted} numberOfLines={1} center style={{ maxWidth: itemW - 4 }}>{addCaption ?? addLabel}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
  if (!glass) return <View testID={testID} style={style}>{row}</View>;
  return <Glass variant="chrome" radius={R.xl} testID={testID} style={style} contentStyle={{ borderRadius: R.xl, overflow: 'hidden' }}>{row}</Glass>;
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', alignItems: 'center', height: GLASS_TAB_BAR.height },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  center: { marginHorizontal: spacing.xs, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', left: 0, top: 0, bottom: 0, borderWidth: StyleSheet.hairlineWidth },
  lensSheen: { position: 'absolute', left: 0, right: 0, top: 0, height: '52%' },
  segRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: 40 },
  segment: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: spacing.sm },
  ringTrack: { position: 'absolute', left: 0, alignItems: 'center', justifyContent: 'center' },
});
