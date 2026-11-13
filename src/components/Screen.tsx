import React from 'react';
import { parentRoute } from '@/lib/parentRoute';
import { Animated, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KEYBOARD_BEHAVIOR, KeyboardScopeContext, useKeyboardScopeFor, useKeyboardVisible } from './keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useIsFocused, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { IconButton, Text } from './ui';
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
import { ToolAccessBanner } from '@/features/offers/ToolOffer';
import { useToolAccess } from '@/lib/data/hooks-access';
import { isPaidTool, type PaidTool } from '@/lib/premium/offers';
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

export function Screen({ children, title, subtitle, back, right, account, scroll = true, padded = true, stars: _stars, footer, contentStyle, bottomInset = 0, tool: forcedTool, action }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  // Clavier : la zone qui défile garde le champ actif visible ; quitter l'écran ferme le clavier ouvert par un de ses champs
  const scrollRef = React.useRef<ScrollView>(null);
  const { scope: keyboardScope, onScroll } = useKeyboardScopeFor(scrollRef);
  const keyboardVisible = useKeyboardVisible();
  React.useEffect(() => {
    if (!focused) keyboardScope.dismissIfOwned();
  }, [focused, keyboardScope]);
  React.useEffect(() => () => keyboardScope.dismissIfOwned(), [keyboardScope]);
  // Écran présenté en modale iOS (feuille décalée vers le bas) : KeyboardAvoidingView compte depuis son parent,
  // on lui donne le décalage réel dans la fenêtre pour que le bas de l'écran remonte entièrement au-dessus du clavier
  const rootRef = React.useRef<View>(null);
  const [keyboardOffset, setKeyboardOffset] = React.useState(0);
  const measureOffset = React.useCallback(() => {
    setTimeout(() => rootRef.current?.measureInWindow?.((_x, y) => { const v = Math.max(0, Math.round(y)); setKeyboardOffset((o) => (Math.abs(o - v) > 2 ? v : o)); }), 450);
  }, []);
  // Continuité de navigation : le contenu entre en fondu et monte légèrement à chaque arrivée sur l'écran
  const entrance = useFocusEntrance(focused);
  // Arrivée depuis une carte « Outils » : son glyphe se pose à côté du titre
  const pathname = usePathname();
  const [origin] = React.useState<ToolOrigin | null>(() => peekToolOrigin(pathname));
  React.useEffect(() => { if (origin) takeToolOrigin(pathname); }, [origin, pathname]);
  const tool = React.useMemo(() => (forcedTool === false ? null : forcedTool ?? (title ? toolForPath(pathname) : null)), [forcedTool, pathname, title]);
  // Outils « à vie » (07/11/2026) : après le mois gratuit et sans achat, le contenu reste lisible mais l'ajout est bloqué
  const paidTool = isPaidTool(tool?.id) ? (tool!.id as PaidTool) : null;
  const content = paidTool ? <PaidToolGate tool={paidTool} scroll={scroll}>{children}</PaidToolGate> : children;
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
          {origin ? <ArrivalGlyph origin={origin} /> : tool ? <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={52} play={1} /> : null}
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
      ref={scrollRef}
      onScroll={onScroll}
      onScrollEndDrag={onScroll}
      onMomentumScrollEnd={onScroll}
      scrollEventThrottle={64}
      contentContainerStyle={[styles.wide, { paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? spacing.md : insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl + bottomInset, gap: spacing.md }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
      {/* Chaque outil : ses articles « Pour aller plus loin » */}
      {tool ? <ToolArticles toolId={tool.id} /> : null}
    </ScrollView>
  ) : (
    <View style={[styles.wide, { flex: 1, paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? 0 : insets.top }, contentStyle]}>
      {/* écran à liste : la liste ajoute elle-même « Pour aller plus loin » en bas */}
      <ScreenToolContext.Provider value={tool ? tool.id : null}>{content}</ScreenToolContext.Provider>
    </View>
  );

  return (
    <Animated.View ref={rootRef} onLayout={measureOffset} style={[{ flex: 1, backgroundColor: 'transparent' }, entrance]} pointerEvents={focused ? 'auto' : 'none'}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {/* Pages du bébé et de l'enfant : vidéo des galets le jour et l'animation de la maman avec son enfant */}
      {isChildPage(pathname, tool?.id) ? <ChildBackdrop /> : null}
      {/* v3 : plus de particules décoratives (« étoiles ») ; `stars` est conservé pour compatibilité */}
      {/* « padding » sur iOS et Android : Android est toujours edge-to-edge (Expo 54+), adjustResize ne réduit plus l'écran */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR} keyboardVerticalOffset={keyboardOffset}>
        <KeyboardScopeContext.Provider value={keyboardScope}>
        {header}
        {body}
        {footer || action ? (
          <View style={{ ...styles.wide, paddingHorizontal: spacing.lg, paddingBottom: keyboardVisible ? spacing.sm : bottomInset > 0 ? Math.max(insets.bottom, 10) + bottomInset : insets.bottom + spacing.sm, paddingTop: spacing.sm, gap: spacing.sm }}>
            {/* écran d'onglet (barre du bas) : le bouton d'action reste au-dessus de la barre */}
            {action ? (paidTool ? <PaidToolAction tool={paidTool} action={action} /> : <Button label={action.label} icon={action.icon ?? 'plus'} size="lg" full onPress={() => { Keyboard.dismiss(); action.onPress(); }} disabled={action.disabled} testID={action.testID ?? 'miniapp-action'} />) : null}
            {footer}
          </View>
        ) : null}
        </KeyboardScopeContext.Provider>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

/** Outil payant : bandeau d'offre, puis contenu lisible mais non modifiable quand le mois gratuit est terminé sans achat. */
function PaidToolGate({ tool, scroll, children }: { tool: PaidTool; scroll: boolean; children: React.ReactNode }) {
  const locked = !useToolAccess(tool).allowed;
  return (
    <>
      <ToolAccessBanner tool={tool} />
      <View pointerEvents={locked ? 'none' : 'auto'} style={[scroll ? { gap: spacing.md } : { flex: 1 }, locked ? { opacity: 0.55 } : null]} testID={locked ? 'tool-locked-content' : undefined}>{children}</View>
    </>
  );
}

function PaidToolAction({ tool, action }: { tool: PaidTool; action: NonNullable<ScreenProps['action']> }) {
  const locked = !useToolAccess(tool).allowed;
  return <Button label={action.label} icon={action.icon ?? 'plus'} size="lg" full onPress={() => { Keyboard.dismiss(); action.onPress(); }} disabled={action.disabled || locked} testID={action.testID ?? 'miniapp-action'} />;
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
      <ToolGlyph id={origin.id} theme={origin.theme} icon={origin.icon} urgent={origin.urgent} size={44} play={play} />
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
