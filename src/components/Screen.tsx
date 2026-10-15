import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { IconButton, Text } from './ui';
import { StarField } from './StarField';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  stars?: boolean;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Espace réservé en bas (barre d'onglets, bouton flottant) */
  bottomInset?: number;
}

export function Screen({ children, title, subtitle, back, right, scroll = true, padded = true, stars, footer, contentStyle, bottomInset = 0 }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const header = (title || back || right) && (
    <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
      <View style={styles.headerRow}>
        {back ? (
          <IconButton icon="arrow-left" label="Retour" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        ) : (
          <View style={{ width: 4 }} />
        )}
        <View style={{ flex: 1 }} />
        {right}
      </View>
      {title ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: 4 }}>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          {subtitle ? <Text muted>{subtitle}</Text> : null}
        </View>
      ) : null}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[{ paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? spacing.md : insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl + bottomInset, gap: spacing.md }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? 0 : insets.top }, contentStyle]}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <LinearGradient colors={t.colors.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {(stars || t.name === 'night') && <StarField density={t.name === 'night' ? 46 : 28} />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {body}
        {footer ? <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.sm, paddingTop: spacing.sm }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
});
