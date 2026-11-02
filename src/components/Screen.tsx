import React from 'react';
import { parentRoute } from '@/lib/parentRoute';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useIsFocused, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { IconButton, Text } from './ui';
import { StarField } from './StarField';
import { useFocusEntrance } from './Motion';
import { ToolGlyph } from './ToolGlyph';
import { AccountActions } from './AccountActions';
import { peekToolOrigin, takeToolOrigin, type ToolOrigin } from '@/lib/toolOrigin';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { NATIVE_DRIVER } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { toolForPath, type PathTool } from '@/lib/domain/toolForPath';
import { glyphColor } from './ToolGlyph';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Button, type IconName } from './ui';
import { ToolArticles } from '@/features/ToolArticles';
import { ScreenToolContext } from '@/lib/screenTool';
import { ChildBackdrop, isChildPage } from '@/features/story/ChildBackdrop';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  /** Écran principal : accès au Profil et aux Réglages en haut à droite. */
  account?: boolean;
  scroll?: boolean;
  padded?: boolean;
  stars?: boolean;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Espace réservé en bas (barre d'onglets, bouton flottant) */
  bottomInset?: number;
  /**
   * Identité « mini-app » : par défaut retrouvée depuis l'adresse (catégorie et icône de l'outil) ;
   * `false` pour un écran qui n'en veut pas.
   */
  tool?: PathTool | null | false;
  /** Action principale de l'outil : gros bouton toujours à portée de pouce, en bas de l'écran. */
  action?: { label: string; icon?: IconName; onPress: () => void; testID?: string; disabled?: boolean };
}

export function Screen({ children, title, subtitle, back, right, account, scroll = true, padded = true, stars, footer, contentStyle, bottomInset = 0, tool: forcedTool, action }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  // Continuité de navigation : le contenu entre en fondu et monte légèrement à chaque arrivée sur l'écran
  const entrance = useFocusEntrance(focused);
  // Arrivée depuis une carte « Outils » : son glyphe se pose à côté du titre
  const pathname = usePathname();
  const [origin] = React.useState<ToolOrigin | null>(() => peekToolOrigin(pathname));
  React.useEffect(() => { if (origin) takeToolOrigin(pathname); }, [origin, pathname]);
  const tool = React.useMemo(() => (forcedTool === false ? null : forcedTool ?? (title ? toolForPath(pathname) : null)), [forcedTool, pathname, title]);
  const accent = tool ? glyphColor(t, tool.theme, tool.urgent) : null;
  const glowId = `g${React.useId().replace(/:/g, '')}`;
  const header = (title || back || right || account) && (
    <View style={[styles.header, styles.wide, { paddingTop: insets.top + spacing.xs }]}>
      {accent ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id={glowId} cx="18%" cy="62%" rx="55%" ry="70%">
                <Stop offset="0" stopColor={accent} stopOpacity={t.isDark ? 0.24 : 0.18} />
                <Stop offset="1" stopColor={accent} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowId})`} />
          </Svg>
        </View>
      ) : null}
      <View style={styles.headerRow}>
        {back ? (
          <IconButton icon="arrow-left" label={tr('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace(parentRoute(pathname) as never))} />
        ) : (
          <View style={{ width: 4 }} />
        )}
        {/* Actions groupées à droite : sur un écran étroit, elles passent à la ligne au lieu de sortir de l'écran */}
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
          {right}
          {account ? <AccountActions /> : null}
        </View>
      </View>
      {title ? (
        <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }} testID={tool ? `miniapp-${tool.id}` : undefined}>
          {origin ? <ArrivalGlyph origin={origin} /> : tool ? <ToolGlyph theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={52} play={1} /> : null}
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title" accessibilityRole="header">{title}</Text>
            {subtitle ? <Text muted>{subtitle}</Text> : null}
          </View>
        </View>
      ) : null}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.wide, { paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? spacing.md : insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl + bottomInset, gap: spacing.md }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
      {/* Chaque outil : ses articles « Pour aller plus loin » */}
      {tool ? <ToolArticles toolId={tool.id} /> : null}
    </ScrollView>
  ) : (
    <View style={[styles.wide, { flex: 1, paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? 0 : insets.top }, contentStyle]}>
      {/* écran à liste : la liste ajoute elle-même « Pour aller plus loin » en bas */}
      <ScreenToolContext.Provider value={tool ? tool.id : null}>{children}</ScreenToolContext.Provider>
    </View>
  );

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: 'transparent' }, entrance]} pointerEvents={focused ? 'auto' : 'none'}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {/* Pages du bébé et de l'enfant : vidéo des galets le jour et l'animation de la maman avec son enfant */}
      {isChildPage(pathname, tool?.id) ? <ChildBackdrop /> : null}
      {(stars || t.isDark) && <StarField density={t.name === 'night' ? 30 : stars ? 26 : 16} color="#FFF1E6" />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        {body}
        {footer || action ? (
          <View style={{ ...styles.wide, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.sm, paddingTop: spacing.sm, gap: spacing.sm }}>
            {action ? <Button label={action.label} icon={action.icon ?? 'plus'} size="lg" full onPress={action.onPress} disabled={action.disabled} testID={action.testID ?? 'miniapp-action'} /> : null}
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

/** Le glyphe de la carte touchée arrive dans l'en-tête (glisse depuis le bas, se réduit, se pose). */
function ArrivalGlyph({ origin }: { origin: ToolOrigin }) {
  const reduce = useReduceMotion();
  const v = React.useRef(new Animated.Value(reduce || origin.urgent ? 1 : 0)).current;
  const [play, setPlay] = React.useState(0);
  React.useEffect(() => {
    if (reduce || origin.urgent) return;
    Animated.spring(v, { toValue: 1, tension: 140, friction: 18, useNativeDriver: NATIVE_DRIVER }).start();
    const id = setTimeout(() => setPlay(1), 260);
    return () => clearTimeout(id);
  }, [v, reduce, origin.urgent]);
  const fromY = Math.max(24, Math.min(220, (origin.y ?? 160) - 120));
  return (
    <Animated.View style={{ opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.45, 1] }) }] }}>
      <ToolGlyph theme={origin.theme} icon={origin.icon} urgent={origin.urgent} size={44} play={play} />
    </Animated.View>
  );
}

export const CONTENT_MAX_WIDTH = 760;

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  /** Tablette, ordinateur : colonne de lecture centrée (lignes trop longues illisibles), téléphone : pleine largeur. */
  wide: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
});
