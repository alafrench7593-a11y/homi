/** Feuille modale, notifications éphémères (toasts) et confirmation. */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { KEYBOARD_BEHAVIOR, KeyboardScopeContext, useKeyboardScopeFor } from './keyboard';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, themes } from '@/theme/tokens';
import { Button, Icon, IconButton, Text } from './ui';
import { LiquidGlass } from './Glass';
import ReAnimated, { cancelAnimation, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { motionTiming, useMotion } from '@/motion/useMotion';
import { durations, springs } from '@/motion/curves';
import { duration, easing, spring as SPRING, springTo, timeTo } from '@/theme/motion';
import { t as tr } from '@/i18n';
import { Tappable } from '@/components/Tappable';

/**
 * Crans du panneau du bas (logique pure, testée). `y` = décalage vers le bas du panneau (0 = grand cran, ouvert au
 * maximum) ; `h` = hauteur du panneau ; `screenH` = hauteur de l'écran.
 *  - un panneau haut (> 62 % de l'écran) a DEUX crans : moyen (≈ 58 % de l'écran visible) et grand (tout le panneau) ;
 *  - un panneau court n'a qu'un cran (tout le panneau) ;
 *  - relâcher : un lancer rapide (|v| > 900 px/s) va dans le sens du lancer ; sinon, cran le plus proche ;
 *    au-delà de 40 % de la hauteur visible sous le plus petit cran (ou lancer vers le bas depuis ce cran) : fermeture.
 */
export const SHEET = { mediumRatio: 0.58, tallRatio: 0.62, flingVelocity: 900, closeRatio: 0.4, rubber: 0.18 } as const;
export function sheetSnaps(h: number, screenH: number): number[] {
  'worklet';
  if (h <= 0) return [0];
  if (h > screenH * SHEET.tallRatio) return [0, Math.max(0, h - screenH * SHEET.mediumRatio)];
  return [0];
}
export function sheetRelease(o: { y: number; vy: number; snaps: number[]; h: number }): { close: boolean; to: number } {
  'worklet';
  const { y, vy, snaps, h } = o;
  const lowest = snaps[snaps.length - 1];
  if (y > lowest + (h - lowest) * SHEET.closeRatio || (vy > SHEET.flingVelocity && y >= lowest - 4)) return { close: true, to: h };
  if (Math.abs(vy) > SHEET.flingVelocity) {
    // lancer : cran suivant dans le sens du geste (au moins 24 px plus loin, sinon on resterait sur place)
    const ahead = vy > 0 ? snaps.filter((s) => s > y + 24) : snaps.filter((s) => s < y - 24);
    if (ahead.length) return { close: false, to: vy > 0 ? Math.min(...ahead) : Math.max(...ahead) };
  }
  let best = snaps[0];
  for (const s of snaps) if (Math.abs(s - y) < Math.abs(best - y)) best = s;
  return { close: false, to: best };
}

/**
 * Panneau du bas GESTUEL (v3, verre fumé / givré) — même API qu'avant : `{ visible, onClose, title, children }`.
 *  - suit le doigt (react-native-gesture-handler 3.3 + Reanimated, fil UI) depuis la poignée et l'en-tête ;
 *    au-dessus du grand cran : résistance élastique ;
 *  - crans de hauteur (`sheetSnaps`) : moyen + grand pour un contenu haut, un seul cran sinon ;
 *  - fermeture cohérente : même animation (famille « panneau », 280 ms `accelerate`) pour le geste, le voile, le
 *    bouton Fermer, la touche retour Android et `visible={false}` ;
 *  - clavier : la zone évite le clavier (KeyboardAvoidingView) et le panneau passe au grand cran tant qu'il est
 *    ouvert, pour garder le champ actif visible ; fermer le panneau ferme le clavier ouvert par un de ses champs ;
 *  - lecteurs d'écran : la poignée est un réglable (« agrandir » / « réduire ou fermer »), le bouton Fermer reste ;
 *  - Réduire les animations / économie d'énergie : positions finales immédiates (le geste suit toujours le doigt).
 */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const m = useMotion();
  const [mounted, setMounted] = useState(visible);
  const H0 = 420;
  const h = useSharedValue(H0);
  const y = useSharedValue(H0);
  const y0 = useSharedValue(0);
  const snapsSv = useSharedValue<number[]>([0]);
  const level = useSharedValue(m.level);
  useEffect(() => { level.value = m.level; }, [m.level, level]);
  useEffect(() => () => cancelAnimation(y), [y]);
  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, 1 - y.value / Math.max(1, h.value))) }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  // Clavier : le champ actif reste visible dans la feuille ; fermer la feuille ferme le clavier ouvert par un de ses champs
  const scrollRef = useRef<ScrollView>(null);
  const { scope: keyboardScope, onScroll } = useKeyboardScopeFor(scrollRef);
  useEffect(() => {
    if (!visible) keyboardScope.dismissIfOwned();
  }, [visible, keyboardScope]);
  const settle = (to: number, vy = 0) => {
    'worklet';
    if (level.value === 'full') y.value = withSpring(to, { ...springs.panneau, velocity: vy, reduceMotion: ReduceMotion.Never });
    else y.value = motionTiming(level.value, to, durations.panel, 'standard');
  };
  const closeAnim = () => {
    'worklet';
    const unmount = () => setMounted(false);
    y.value = motionTiming(level.value, h.value + 24, durations.panel, 'accelerate', (finished) => {
      'worklet';
      if (finished) scheduleOnRN(unmount);
    });
  };
  const opened = useRef(false);
  useEffect(() => {
    if (visible) {
      setMounted(true);
      opened.current = false;
    } else if (mounted) {
      closeAnim();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  // Première mesure : on part de « fermé » et on se pose sur le plus petit cran
  const onLayout = (e: { nativeEvent: { layout: { height: number } } }) => {
    const hh = Math.round(e.nativeEvent.layout.height);
    if (hh <= 0) return;
    const snaps = sheetSnaps(hh, screenH);
    h.value = hh;
    snapsSv.value = snaps;
    if (!opened.current && visible) {
      opened.current = true;
      y.value = hh + 24;
      settle(snaps[snaps.length - 1]);
    }
  };
  // Clavier ouvert : grand cran
  useEffect(() => {
    if (!visible) return;
    const sub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => settle(0));
    return () => sub.remove();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const requestClose = () => onClose();
  const pan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onStart(() => { cancelAnimation(y); y0.value = y.value; })
    .onUpdate((e) => {
      const next = y0.value + e.translationY;
      // au-dessus du grand cran : résistance élastique
      y.value = next < 0 ? next * SHEET.rubber : next;
    })
    .onEnd((e) => {
      const r = sheetRelease({ y: y.value, vy: e.velocityY, snaps: snapsSv.value, h: h.value });
      if (r.close) { closeAnim(); scheduleOnRN(requestClose); } else settle(r.to, e.velocityY);
    });
  if (!mounted) return null;
  const expand = () => { y.value = motionTiming(m.level, 0, durations.panel, 'standard'); };
  const collapse = () => {
    const snaps = snapsSv.value;
    const lowest = snaps[snaps.length - 1];
    if (y.value > lowest + 1 || snaps.length === 1) onClose();
    else y.value = motionTiming(m.level, lowest, durations.panel, 'standard');
  };
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} accessibilityViewIsModal>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ReAnimated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={tr('common.close')} accessibilityRole="button" testID="sheet-backdrop" />
        </ReAnimated.View>
        {/* La feuille remonte au-dessus du clavier (iOS et Android) et ne passe jamais sous la barre d'état */}
        <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', paddingTop: insets.top + spacing.sm }]}>
          <ReAnimated.View onLayout={onLayout} style={[styles.sheet, styles.sheetInFlow, sheetStyle]} testID="sheet">
            <LiquidGlass testID="sheet-panel" kind="frosted" edges="top" radius={radius.sheet} style={{ maxHeight: '100%', flexShrink: 1 }} contentStyle={{ paddingBottom: insets.bottom + spacing.md, paddingTop: spacing.xs, maxHeight: '100%', flexShrink: 1 }}>
              <GestureDetector gesture={pan}>
                <View collapsable={false} testID="sheet-handle-area">
                  <View
                    accessible
                    accessibilityRole="adjustable"
                    accessibilityLabel={tr('sheet.handle')}
                    accessibilityHint={tr('sheet.handleHint')}
                    accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                    onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? expand() : collapse())}
                    style={styles.grabberZone}
                    testID="sheet-handle"
                  >
                    <View style={[styles.grabber, { backgroundColor: t.isDark ? 'rgba(255,255,255,0.28)' : 'rgba(19,24,26,0.18)' }]} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg }}>
                    <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
                    <IconButton icon="x" label={tr('common.close')} onPress={onClose} tone="filled" />
                  </View>
                </View>
              </GestureDetector>
              {/* flexShrink : le contenu long défile au lieu de dépasser de l'écran */}
              <ScrollView ref={scrollRef} onScroll={onScroll} onScrollEndDrag={onScroll} onMomentumScrollEnd={onScroll} scrollEventThrottle={64} style={{ flexShrink: 1 }} contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.md }} keyboardShouldPersistTaps="handled">
                <KeyboardScopeContext.Provider value={keyboardScope}>{children}</KeyboardScopeContext.Provider>
              </ScrollView>
            </LiquidGlass>
          </ReAnimated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

type ToastTone = 'success' | 'info' | 'error';
const ToastContext = createContext<(msg: string, tone?: ToastTone) => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; tone: ToastTone; key: number } | null>(null);
  const show = useCallback((msg: string, tone: ToastTone = 'success') => setToast({ msg, tone, key: Date.now() }), []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* La fin d'un ancien message n'efface jamais le suivant */}
      {toast && <ToastView key={toast.key} msg={toast.msg} tone={toast.tone} onDone={() => setToast((cur) => (cur?.key === toast.key ? null : cur))} />}
      {Platform.OS === 'web' && <ConfirmHost />}
    </ToastContext.Provider>
  );
}

function ToastView({ msg, tone, onDone }: { msg: string; tone: ToastTone; onDone: () => void }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const icon = useRef(new Animated.Value(0)).current;
  const life = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const show = reduce ? Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: NATIVE_DRIVER }) : Animated.spring(anim, { toValue: 1, ...SPRING.pop, useNativeDriver: NATIVE_DRIVER });
    let alive = true;
    const intro = Animated.parallel([
      show,
      Animated.sequence([Animated.delay(reduce ? 0 : 120), springTo(icon, 1, 'pop', reduce)]),
      // Avec « réduire les animations », le message reste lisible le même temps
      reduce ? Animated.delay(3000) : timeTo(life, 1, 3000, false, Easing.linear),
    ]);
    intro.start(({ finished }) => {
      if (!alive || !finished) return;
      timeTo(anim, 0, duration.base, reduce, easing.accelerate).start(() => { if (alive) onDone(); });
    });
    return () => { alive = false; intro.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const name = tone === 'success' ? 'check-circle' : tone === 'error' ? 'alert-circle' : 'info';
  // Le toast est toujours sombre : lueurs du thème sombre (statuts) ou de la palette affichée
  const accent = tone === 'error' ? themes.dark.tokens.status.danger : tone === 'success' ? themes.dark.tokens.status.success : t.tokens.accent.glow[0];
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, {
        top: insets.top + 8, backgroundColor: t.isDark ? '#24252B' : '#1F1E24', opacity: anim, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', shadowColor: '#0A0908', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
      }]}
    >
      <Animated.View style={{ transform: [{ scale: icon.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { rotate: icon.interpolate({ inputRange: [0, 1], outputRange: [tone === 'error' ? '-25deg' : '-90deg', '0deg'] }) }] }}>
        <Icon name={name} size={18} color={accent} />
      </Animated.View>
      <Text variant="small" color="#F3F2F5" style={{ flex: 1 }}>{msg}</Text>
      {/* Temps restant avant disparition */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: accent, opacity: 0.6, transform: [{ scaleX: life.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }] }} />
    </Animated.View>
  );
}

export const useToast = () => useContext(ToastContext);

/** Confirmation multiplateforme : Alert natif sur iOS/Android, fenêtre intégrée à l'app sur le web
 * (les boîtes natives du navigateur peuvent être bloquées, par exemple dans un aperçu intégré). */
type ConfirmRequest = { title: string; message: string; confirmLabel: string; destructive: boolean; resolve: (v: boolean) => void };
let showConfirm: ((r: ConfirmRequest) => void) | null = null;

export function confirm(title: string, message: string, confirmLabel = 'Confirmer', destructive = true): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (!showConfirm) return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
    return new Promise((resolve) => showConfirm!({ title, message, confirmLabel, destructive, resolve }));
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: tr('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]),
  );
}

function ConfirmHost() {
  const t = useTheme();
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  useEffect(() => {
    showConfirm = setReq;
    return () => { showConfirm = null; };
  }, []);
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!req) return;
    pop.setValue(reduce ? 1 : 0);
    if (!reduce) Animated.spring(pop, { toValue: 1, ...SPRING.pop, useNativeDriver: NATIVE_DRIVER }).start();
  }, [req, pop, reduce]);
  if (!req) return null;
  const done = (v: boolean) => { req.resolve(v); setReq(null); };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => done(false)}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }]} onPress={() => done(false)} accessibilityRole="button" accessibilityLabel={tr('common.close')} />
      <Animated.View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, top: '30%', borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, backgroundColor: t.isDark ? '#22152C' : '#FFFFFF', opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }, { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }], shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 30, shadowOffset: { width: 0, height: 14 } }} accessibilityViewIsModal accessibilityRole="alert">
        <Text variant="heading">{req.title}</Text>
        {req.message ? <Text muted>{req.message}</Text> : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          <Button label={tr('common.cancel')} variant="secondary" onPress={() => done(false)} style={{ flex: 1 }} />
          <Button label={req.confirmLabel} variant={req.destructive ? 'danger' : 'primary'} onPress={() => done(true)} style={{ flex: 1 }} />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '92%', borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet },
  /** Dans la zone qui évite le clavier : la feuille suit le flux (posée en bas) et rétrécit si la place manque. */
  sheetInFlow: { position: 'relative', flexShrink: 1 },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center' },
  /** Poignée : zone tactile ≥ 48 px de haut, toute la largeur */
  grabberZone: { minHeight: 28, paddingTop: 6, paddingBottom: 10, alignSelf: 'stretch', alignItems: 'center' },
  toast: { position: 'absolute', left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, zIndex: 1000, elevation: 10 },
});
