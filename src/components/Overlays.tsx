/** Feuille modale, notifications éphémères (toasts) et confirmation. */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Icon, IconButton, Text } from './ui';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }]} onPress={onClose} accessibilityLabel="Fermer" accessibilityRole="button" />
      <View style={[styles.sheet, { backgroundColor: t.isDark ? t.colors.surface : '#FBF8F4', paddingBottom: insets.bottom + spacing.md }]}>
        <View style={[styles.grabber, { backgroundColor: t.colors.border }]} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg }}>
          <Text variant="heading" style={{ flex: 1 }} accessibilityRole="header">{title}</Text>
          <IconButton icon="x" label="Fermer" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
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
      {toast && <ToastView key={toast.key} msg={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
      {Platform.OS === 'web' && <ConfirmHost />}
    </ToastContext.Provider>
  );
}

function ToastView({ msg, tone, onDone }: { msg: string; tone: ToastTone; onDone: () => void }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: reduce ? 0 : 220, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(anim, { toValue: 0, duration: reduce ? 0 : 220, useNativeDriver: true }),
    ]).start(onDone);
  }, [anim, onDone, reduce]);
  const icon = tone === 'success' ? 'check-circle' : tone === 'error' ? 'alert-circle' : 'info';
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { top: insets.top + 8, backgroundColor: t.isDark ? '#2A2F4E' : '#2B2433', opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}
    >
      <Icon name={icon} size={18} color={tone === 'error' ? '#F5A3A3' : '#F2DFC1'} />
      <Text variant="small" color="#F7F1E8" style={{ flex: 1 }}>{msg}</Text>
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
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
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
  if (!req) return null;
  const done = (v: boolean) => { req.resolve(v); setReq(null); };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => done(false)}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: t.colors.overlay }]} onPress={() => done(false)} accessibilityLabel="Fermer" />
      <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, top: '30%', borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, backgroundColor: t.isDark ? '#22152C' : '#FFFFFF' }} accessibilityViewIsModal accessibilityRole="alert">
        <Text variant="heading">{req.title}</Text>
        {req.message ? <Text muted>{req.message}</Text> : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Annuler" onPress={() => done(false)} style={{ flex: 1, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="bold">Annuler</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={req.confirmLabel} onPress={() => done(true)} style={{ flex: 1, minHeight: 48, borderRadius: radius.pill, backgroundColor: req.destructive ? t.colors.danger : t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="bold" color="#FFFFFF">{req.confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.xs },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: spacing.xs },
  toast: { position: 'absolute', left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, zIndex: 1000, elevation: 10 },
});
