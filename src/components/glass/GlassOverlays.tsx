/**
 * Surfaces temporaires de verre : `GlassSheet`, `GlassModal`, `GlassMenu`, `GlassToast` (HOMI_DESIGN_SYSTEM.md § 10).
 *
 * Composition, pas duplication :
 *  - `GlassSheet` = le `Sheet` existant (gestes, crans, clavier, lecteurs d'écran : inchangés) avec un panneau de verre
 *    (`panel`, seul point d'extension ajouté à Overlays.tsx) ;
 *  - `GlassToastProvider` = le `ToastProvider` existant (même `useToast()`) avec une vue de verre (`view`).
 * `GlassModal` et `GlassMenu` n'avaient pas d'équivalent partagé (la confirmation web est interne à Overlays).
 *
 * Feuille, fenêtre et menu utilisent le verre `sheet` (voile presque opaque) : leur contenu est du TEXTE libre de
 * l'application (toutes les encres du thème y sont garanties ≥ 4,5:1). Le toast, court, utilise `chrome`.
 *
 * Mouvement : seuls transform (du verre) et opacité (du VOILE de fond, calque frère) sont animés — jamais l'opacité
 * d'un ancêtre du verre.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { radius as R, spacing } from '@/theme/tokens';
import { durations, motionHaptic, SuccessCheck, useMotion } from '@/motion';
import { t as tr } from '@/i18n';
import { useDemoInset } from '../demoInset';
import { Sheet, ToastProvider, type SheetPanelProps, type ToastViewProps } from '../Overlays';
import { Icon, Text, type IconName } from '../ui';
import { Glass, useGlass } from './Glass';
import { GlassButton, type GlassButtonVariant } from './GlassButton';

// ---------------------------------------------------------------------------------------------- feuille
function GlassSheetPanel({ testID, radius, style, contentStyle, children }: SheetPanelProps) {
  return <Glass variant="sheet" edges="top" radius={radius} testID={testID} style={style} contentStyle={contentStyle}>{children}</Glass>;
}

/** Feuille du bas en verre : même API que `Sheet` (`visible`, `onClose`, `title`, `children`). */
export function GlassSheet(p: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return <Sheet {...p} panel={GlassSheetPanel} />;
}

// ---------------------------------------------------------------------------------------------- fenêtre modale
export interface GlassModalAction { label: string; onPress: () => unknown; variant?: GlassButtonVariant; testID?: string }

/** Apparition d'une surface flottante : échelle 0,94 → 1 et montée de 10 px (ressort « doux »), voile de fond en fondu. */
function usePopIn(visible: boolean) {
  const m = useMotion();
  const v = useSharedValue(visible && m.off ? 1 : 0);
  useEffect(() => {
    if (!visible) { v.value = 0; return; }
    v.value = m.off ? 1 : m.spring(1, 'doux');
  }, [visible, m, v]);
  useEffect(() => () => cancelAnimation(v), [v]);
  const scrim = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value * 1.4) }));
  const card = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - v.value) * 10 }, { scale: 0.94 + 0.06 * v.value }] }));
  return { scrim, card };
}

export function GlassModal({ visible, onClose, title, message, children, actions, dismissable = true, testID = 'glass-modal' }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  children?: React.ReactNode;
  /** Boutons du bas (le premier est le moins engageant ; au plus deux côte à côte) */
  actions?: GlassModalAction[];
  /** Un appui sur le voile ferme la fenêtre (défaut : oui) */
  dismissable?: boolean;
  testID?: string;
}) {
  const t = useTheme();
  const pop = usePopIn(visible);
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }, pop.scrim]}>
          <Pressable style={StyleSheet.absoluteFill} disabled={!dismissable} onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('common.close')} testID={`${testID}-backdrop`} />
        </Animated.View>
        <Animated.View style={[styles.modalCard, pop.card]} accessibilityViewIsModal accessibilityRole="alert" testID={testID}>
          <Glass variant="sheet" radius={R.sheet} testID={`${testID}-glass`} contentStyle={styles.modalBody}>
            <Text variant="heading" accessibilityRole="header">{title}</Text>
            {message ? <Text muted>{message}</Text> : null}
            {children}
            {actions?.length ? (
              <View style={styles.modalActions}>
                {actions.map((a) => <GlassButton key={a.label} label={a.label} variant={a.variant ?? 'secondary'} onPress={a.onPress} testID={a.testID} style={{ flex: 1 }} full />)}
              </View>
            ) : null}
          </Glass>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------- menu
export interface GlassMenuItem { key: string; label: string; icon?: IconName; destructive?: boolean; disabled?: boolean; selected?: boolean; onPress: () => void }
export interface MenuAnchor { x: number; y: number; width: number; height: number }

export const GLASS_MENU = { width: 248, gap: 6, margin: 12, row: 48 } as const;

/** Position du menu (pur, testé) : sous l'ancre, aligné sur son bord le plus proche ; au-dessus si la place manque. */
export function menuPosition(a: MenuAnchor | null, win: { width: number; height: number }, items: number, insets = { top: 0, bottom: 0 }): { top: number; left: number; originX: 'left' | 'right'; originY: 'top' | 'bottom' } {
  const h = items * GLASS_MENU.row + 12;
  const w = Math.min(GLASS_MENU.width, win.width - GLASS_MENU.margin * 2);
  if (!a) return { top: Math.max(insets.top + GLASS_MENU.margin, (win.height - h) / 2), left: (win.width - w) / 2, originX: 'left', originY: 'top' };
  const right = a.x + a.width / 2 > win.width / 2;
  const rawLeft = right ? a.x + a.width - w : a.x;
  const left = Math.min(win.width - GLASS_MENU.margin - w, Math.max(GLASS_MENU.margin, rawLeft));
  const below = a.y + a.height + GLASS_MENU.gap;
  const fits = below + h <= win.height - insets.bottom - GLASS_MENU.margin;
  const top = fits ? below : Math.max(insets.top + GLASS_MENU.margin, a.y - GLASS_MENU.gap - h);
  return { top, left, originX: right ? 'right' : 'left', originY: fits ? 'top' : 'bottom' };
}

/** Ancre d'un menu : `ref` sur le déclencheur, `open()` mesure sa place à l'écran puis affiche le menu. */
export function useMenuAnchor() {
  const ref = useRef<View>(null);
  const [state, setState] = useState<{ visible: boolean; anchor: MenuAnchor | null }>({ visible: false, anchor: null });
  const open = useCallback(() => {
    const node = ref.current;
    if (!node?.measureInWindow) { setState({ visible: true, anchor: null }); return; }
    node.measureInWindow((x, y, width, height) => setState({ visible: true, anchor: width > 0 ? { x, y, width, height } : null }));
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, visible: false })), []);
  return { ref, open, close, visible: state.visible, anchor: state.anchor };
}

/**
 * Menu déroulant / contextuel : ancré à son déclencheur (`useMenuAnchor`) ou centré sans ancre (menu contextuel d'un
 * appui long). Rangées de 48 pt, rôle `menuitem`, action destructrice à l'encre d'alerte + pictogramme (jamais la
 * couleur seule), option cochée par une coche. Un appui hors du menu, ou la touche retour, le ferme.
 */
export function GlassMenu({ visible, onClose, items, anchor = null, label, testID = 'glass-menu' }: {
  visible: boolean;
  onClose: () => void;
  items: GlassMenuItem[];
  anchor?: MenuAnchor | null;
  /** Nom du menu annoncé (défaut : « Menu ») */
  label?: string;
  testID?: string;
}) {
  const t = useTheme();
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { spec } = useGlass('sheet');
  const pop = usePopIn(visible);
  if (!visible) return null;
  const pos = menuPosition(anchor, win, items.length, insets);
  const width = Math.min(GLASS_MENU.width, win.width - GLASS_MENU.margin * 2);
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('common.close')} testID={`${testID}-backdrop`} />
      <Animated.View testID={testID} accessibilityRole="menu" accessibilityLabel={label ?? tr('glass.menu')} accessibilityViewIsModal
        style={[{ position: 'absolute', top: pos.top, left: pos.left, width, transformOrigin: `${pos.originX} ${pos.originY}` }, pop.card]}>
        <Glass variant="sheet" radius={R.lg} testID={`${testID}-glass`} contentStyle={{ paddingVertical: 6 }}>
          {items.map((it, i) => {
            const ink = it.destructive ? t.colors.danger : t.colors.text;
            return (
              <Pressable key={it.key} accessibilityRole="menuitem" accessibilityLabel={it.label} accessibilityState={{ disabled: !!it.disabled, selected: it.selected || undefined }}
                disabled={it.disabled} testID={`${testID}-${it.key}`}
                onPress={() => { motionHaptic(it.destructive ? 'warning' : 'selection'); onClose(); it.onPress(); }}
                style={({ pressed }) => [styles.menuRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.material.lines.separator }, pressed && { backgroundColor: spec.press }, it.disabled && { opacity: 0.45 }]}>
                {it.icon ? <Icon name={it.icon} size={19} color={ink} /> : null}
                <Text color={ink} weight={it.selected ? 'bold' : 'medium'} numberOfLines={2} style={{ flex: 1 }}>{it.label}</Text>
                {it.selected ? <Icon name="check" size={18} color={t.colors.text} /> : null}
              </Pressable>
            );
          })}
        </Glass>
      </Animated.View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------------------------- toast
export const GLASS_TOAST = { lifeMs: 3000, from: -140 } as const;

/**
 * Vue de toast en verre (contrat `ToastViewProps` d'Overlays) : descend du haut (ressort « doux »), reste 3 s, repart
 * par où elle est venue (`accelerate`, plus court). Succès : coche tracée ; erreur : pictogramme d'alerte. Avec
 * « Réduire les animations » : apparition et disparition immédiates, même durée de lecture.
 */
export function GlassToast({ msg, tone, onDone, style }: ToastViewProps & { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const m = useMotion();
  const insets = useSafeAreaInsets();
  const top = insets.top + useDemoInset() + 8;
  const { spec } = useGlass('chrome');
  const y = useSharedValue(m.off ? 0 : GLASS_TOAST.from);
  const done = useRef(onDone);
  done.current = onDone;
  // Fil JS : déclarée dans le composant, confiée à scheduleOnRN par le rappel de fin d'animation
  const finish = () => done.current();
  useEffect(() => {
    y.value = m.spring(0, 'doux');
    const id = setTimeout(() => {
      y.value = m.timing(GLASS_TOAST.from, durations.base, 'accelerate', (finished) => {
        'worklet';
        if (finished) scheduleOnRN(finish);
      });
    }, GLASS_TOAST.lifeMs);
    return () => { clearTimeout(id); cancelAnimation(y); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const ink = tone === 'error' ? t.colors.danger : tone === 'success' ? t.colors.success : spec.inks.text;
  return (
    <Animated.View accessibilityLiveRegion="polite" accessibilityRole="alert" testID="glass-toast" style={[styles.toast, { top }, style, anim]}>
      <Glass variant="chrome" radius={R.md} testID="glass-toast-glass" contentStyle={styles.toastBody}>
        {/* pastille opaque : le pictogramme d'état garde son contraste quel que soit le fond */}
        <View style={[styles.toastIcon, { backgroundColor: t.tokens.surface.raised }]}>
          {tone === 'success' ? <SuccessCheck visible size={18} color={ink} /> : <Icon name={tone === 'error' ? 'alert-circle' : 'info'} size={16} color={ink} />}
        </View>
        <Text variant="small" weight="medium" color={spec.inks.text} style={{ flex: 1 }}>{msg}</Text>
      </Glass>
    </Animated.View>
  );
}

/** `ToastProvider` existant, vue de verre : `useToast()` ne change pas. */
export function GlassToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider view={GlassToast}>{children}</ToastProvider>;
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 420 },
  modalBody: { padding: spacing.lg, gap: spacing.sm },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  menuRow: { minHeight: GLASS_MENU.row, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 8 },
  toast: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 1000, elevation: 10 },
  toastBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, paddingRight: spacing.md },
  toastIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
