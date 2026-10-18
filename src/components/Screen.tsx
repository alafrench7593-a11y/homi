import React from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { IconButton, Text } from './ui';
import { StarField } from './StarField';
import { useFocusEntrance } from './Motion';

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
  const focused = useIsFocused();
  // Continuité de navigation : le contenu entre en fondu et monte légèrement à chaque arrivée sur l'écran
  const entrance = useFocusEntrance(focused);
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
    <Animated.View style={[{ flex: 1, backgroundColor: 'transparent' }, entrance]} pointerEvents={focused ? 'auto' : 'none'}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {(stars || t.isDark) && <StarField density={t.name === 'night' ? 30 : stars ? 26 : 16} color="#FFF1E6" />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {body}
        {footer ? <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.sm, paddingTop: spacing.sm }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
});
