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

/** Confirmation multiplateforme (Alert natif, window.confirm sur le web). */
export function confirm(title: string, message: string, confirmLabel = 'Confirmer', destructive = true): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? true);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]),
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.xs },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: spacing.xs },
  toast: { position: 'absolute', left: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, zIndex: 1000, elevation: 10 },
});
