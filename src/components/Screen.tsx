import React from 'react';
import { parentRoute } from '@/lib/parentRoute';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { KEYBOARD_BEHAVIOR, KeyboardScopeContext, useKeyboardScopeFor, useKeyboardVisible } from './keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useIsFocused, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { timeTo } from '@/theme/motion';
import { cappedScale, useFontScale } from '@/theme/fontScale';
import { fitTitleSize } from './layoutFit';
import { ScreenChromeContext, ScreenFocusContext, type ScrollerEntry } from './screenChrome';
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
import { useDemoInset } from './demoInset';

/** Action principale de l'outil (gros bouton en bas de l'écran). */
export interface ScreenAction {
  label: string;
  /** Libellé court, affiché si le libellé complet ne tient pas sur une ligne (petit écran, texte agrandi). */
  shortLabel?: string;
  icon?: IconName;
  /** Une promesse renvoyée affiche le chargement et ignore les appuis suivants jusqu'à la fin (pas de double envoi). */
  onPress: () => unknown;
  testID?: string;
  disabled?: boolean;
  /** Chargement imposé par l'écran (enregistrement en cours ailleurs). */
  loading?: boolean;
}

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
  action?: ScreenAction;
}

/** En dessous de cette hauteur visible (paysage, écran partagé, clavier ouvert), l'en-tête est replié d'office. */
export const HEADER_TIGHT_HEIGHT = 520;
/** Défilement (px) au-delà duquel l'en-tête d'un écran `scroll={false}` se replie. */
export const HEADER_COLLAPSE_AT = 24;

/**
 * Mode de l'en-tête (logique pure, testée). « Grand » : glyphe + grand titre + sous-titre ; « compact » : titre sur
 * une ligne à côté du bouton retour. Écran qui défile (`scroll`) : le grand titre défile avec le contenu (titre
 * large iOS) et le titre compact apparaît dès qu'il est passé sous l'en-tête. Écran `scroll={false}` : le grand titre
 * est fixe et se replie quand la place manque (clavier, fenêtre basse) ou quand sa zone de contenu défile.
 */
export function headerMode(p: { scroll: boolean; keyboard: boolean; height: number; innerScrolled: boolean; scrolledPastTitle: boolean }): { largeInContent: boolean; largeFixed: boolean; compact: boolean } {
  if (p.scroll) return { largeInContent: true, largeFixed: false, compact: p.scrolledPastTitle };
  const tight = p.keyboard || p.height < HEADER_TIGHT_HEIGHT;
  const collapsed = tight || p.innerScrolled;
  return { largeInContent: false, largeFixed: !collapsed, compact: collapsed };
}

/**
 * Repli d'un en-tête fixe au défilement, avec hystérésis : replié au-delà de `HEADER_COLLAPSE_AT` seulement si le
 * contenu reste défilable une fois l'en-tête replié (sinon il se déplierait aussitôt) ; déplié tout en haut.
 */
export function nextInnerScrolled(cur: boolean, e: { y: number; contentH: number; viewH: number; titleH: number }): boolean {
  if (!cur) return e.y > HEADER_COLLAPSE_AT && e.contentH - (e.viewH + e.titleH) > HEADER_COLLAPSE_AT * 2;
  return e.y > 2;
}

export function Screen({ children, title, subtitle, back, right, account, scroll = true, padded = true, stars: _stars, footer, contentStyle, bottomInset = 0, tool: forcedTool, action }: ScreenProps) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const fontScale = useFontScale();
  // Haut de l'écran : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const top = insets.top + useDemoInset();
  const focused = useIsFocused();
  // Clavier : la zone qui défile garde le champ actif visible ; quitter l'écran ferme le clavier ouvert par un de ses champs
  const scrollRef = React.useRef<ScrollView>(null);
  const { scope: keyboardScope, onScroll: onKeyboardScroll } = useKeyboardScopeFor(scrollRef);
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

  // ------------------------------------------------------------ en-tête qui se replie
  const [titleH, setTitleH] = React.useState(0);
  const [scrolledPastTitle, setScrolledPastTitle] = React.useState(false);
  const [innerScrolled, setInnerScrolled] = React.useState(false);
  const titleHRef = React.useRef(0);
  titleHRef.current = titleH;
  const mode = headerMode({ scroll, keyboard: keyboardVisible, height: winH, innerScrolled, scrolledPastTitle });
  // Titre : réduit (32 → 21 px) pour tenir en 2 lignes sans couper de mot ; glyphe plus petit sur écran étroit
  const glyphSize = winW < 360 || fontScale > 1.15 ? 40 : 52;
  const hasGlyph = !!(origin || tool);
  const avail = Math.min(winW, CONTENT_MAX_WIDTH) - spacing.lg * 2 - (hasGlyph ? glyphSize + spacing.md : 0);
  const titleStyle = React.useMemo(() => (title ? fitTitleSize(title, avail, cappedScale(fontScale, typography.headingXL.maxScale)) : null), [title, avail, fontScale]);

  // Zones qui défilent inscrites (la principale, ou celle d'un écran `scroll={false}`) : repli + `useScreenScroll`
  const scrollers = React.useRef<ScrollerEntry[]>([]);
  const mainOffset = React.useRef(0);
  const chrome = React.useMemo(() => ({
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const ne = e.nativeEvent;
      setInnerScrolled((cur) => nextInnerScrolled(cur, { y: ne.contentOffset.y, contentH: ne.contentSize?.height ?? 0, viewH: ne.layoutMeasurement?.height ?? 0, titleH: titleHRef.current }));
    },
    register: (entry: ScrollerEntry) => { scrollers.current.push(entry); return () => { scrollers.current = scrollers.current.filter((x) => x !== entry); }; },
    current: () => scrollers.current[scrollers.current.length - 1] ?? null,
  }), []);
  React.useEffect(() => (scroll ? chrome.register({ ref: scrollRef, offset: () => mainOffset.current }) : undefined), [scroll, chrome]);
  const onMainScroll = React.useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    mainOffset.current = y;
    onKeyboardScroll(e);
    // le titre compact apparaît quand le grand titre est passé sous l'en-tête
    const past = titleHRef.current > 0 && y > titleHRef.current - 12;
    setScrolledPastTitle((c) => (c === past ? c : past));
  }, [onKeyboardScroll]);

  // Titre compact : fondu court (immédiat avec « Réduire les animations ») ; grand titre fixe : repli en hauteur
  const compactV = React.useRef(new Animated.Value(mode.compact ? 1 : 0)).current;
  const largeV = React.useRef(new Animated.Value(mode.largeFixed || mode.largeInContent ? 1 : 0)).current;
  React.useEffect(() => { timeTo(compactV, mode.compact ? 1 : 0, 160, reduce).start(); }, [compactV, mode.compact, reduce]);
  React.useEffect(() => { timeTo(largeV, mode.largeFixed || mode.largeInContent ? 1 : 0, 200, reduce).start(); }, [largeV, mode.largeFixed, mode.largeInContent, reduce]);

  const titleBlock = title ? (
    <View
      onLayout={(e) => { const h = Math.round(e.nativeEvent.layout.height); if (h > 0 && Math.abs(h - titleHRef.current) > 1) setTitleH(h); }}
      style={{ paddingHorizontal: mode.largeInContent && padded ? 0 : spacing.lg, paddingTop: mode.largeInContent ? 0 : spacing.xs }}
    >
      {accent ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: -spacing.lg, bottom: -spacing.sm, left: mode.largeInContent && padded ? -spacing.lg : 0, right: mode.largeInContent && padded ? -spacing.lg : 0 }]}>
          <Svg width="100%" height="100%">
            <Defs>
              {/* lueur qui s'éteint AVANT les bords du cadre (aucune arête rectangulaire visible) */}
              <RadialGradient id={glowId} cx="30%" cy="50%" rx="30%" ry="50%">
                <Stop offset="0" stopColor={accent} stopOpacity={t.isDark ? 0.24 : 0.18} />
                <Stop offset="1" stopColor={accent} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowId})`} />
          </Svg>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }} testID={tool ? `miniapp-${tool.id}` : undefined}>
        {origin ? <ArrivalGlyph origin={origin} size={glyphSize - 8} /> : tool ? <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={glyphSize} play={1} /> : null}
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text variant="title" accessibilityRole="header" style={[titleStyle, NO_HYPHENS]} testID="screen-title">{title}</Text>
          {subtitle ? <Text muted>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  ) : null;

  // Grand titre fixe (écran `scroll={false}`) : se replie en hauteur ; masqué aux lecteurs d'écran une fois replié
  const fixedTitle = title && !scroll ? (
    <Animated.View
      style={{ overflow: 'hidden', opacity: largeV, height: titleH ? largeV.interpolate({ inputRange: [0, 1], outputRange: [0, titleH] }) : undefined }}
      pointerEvents={mode.largeFixed ? 'auto' : 'none'}
      accessibilityElementsHidden={!mode.largeFixed}
      importantForAccessibility={mode.largeFixed ? 'auto' : 'no-hide-descendants'}
      {...(!mode.largeFixed ? ({ 'aria-hidden': true } as object) : null)}
    >
      <View style={titleH ? { position: 'absolute', left: 0, right: 0, top: 0 } : undefined}>{titleBlock}</View>
    </Animated.View>
  ) : null;

  const header = (title || back || right || account) && (
    <View style={[styles.header, styles.wide, { paddingTop: top + spacing.xs }]} testID="screen-header">
      <View style={styles.headerRow}>
        {back ? (
          <IconButton icon="arrow-left" label={tr('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace(parentRoute(pathname) as never))} testID="screen-back" />
        ) : (
          <View style={{ width: title ? spacing.md : 4 }} />
        )}
        {/* Titre compact (en-tête replié) : une ligne ; le titre complet reste dans le grand titre et pour les lecteurs d'écran */}
        <Animated.View style={{ flex: 1, minWidth: 0, opacity: compactV }} pointerEvents="none"
          accessibilityElementsHidden={!(mode.compact && !scroll)} importantForAccessibility={mode.compact && !scroll ? 'auto' : 'no-hide-descendants'}
          {...(!(mode.compact && !scroll) ? ({ 'aria-hidden': true } as object) : null)}>
          {title && mode.compact ? (
            <Text variant="heading" numberOfLines={1} intentionalTruncation accessibilityRole={scroll ? undefined : 'header'} testID="screen-title-compact"
              style={{ fontSize: 18, lineHeight: 24 }} maxFontSizeMultiplier={1.3}>{title}</Text>
          ) : null}
        </Animated.View>
        {/* Actions groupées à droite : sur un écran étroit, elles passent à la ligne au lieu de sortir de l'écran */}
        <View style={{ flexShrink: 1, maxWidth: '75%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', minWidth: 0 }}>
          {right}
          {account ? <AccountActions /> : null}
        </View>
      </View>
      {fixedTitle}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      onScroll={onMainScroll}
      onScrollEndDrag={onMainScroll}
      onMomentumScrollEnd={onMainScroll}
      scrollEventThrottle={32}
      testID="screen-scroll"
      contentContainerStyle={[styles.wide, { paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? spacing.xs : top + spacing.md, paddingBottom: insets.bottom + spacing.xxl + bottomInset, gap: spacing.md }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {titleBlock}
      {content}
      {/* Chaque outil : ses articles « Pour aller plus loin » */}
      {tool ? <ToolArticles toolId={tool.id} /> : null}
    </ScrollView>
  ) : (
    <View style={[styles.wide, { flex: 1, paddingHorizontal: padded ? spacing.lg : 0, paddingTop: header ? 0 : top }, contentStyle]} testID="screen-scroll">
      {/* écran à liste : la liste ajoute elle-même « Pour aller plus loin » en bas */}
      <ScreenToolContext.Provider value={tool ? tool.id : null}>{content}</ScreenToolContext.Provider>
    </View>
  );

  return (
    <ScreenFocusContext.Provider value={focused}>
    <Animated.View ref={rootRef} onLayout={measureOffset} style={[{ flex: 1, backgroundColor: 'transparent' }, entrance]} pointerEvents={focused ? 'auto' : 'none'}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      {/* Pages du bébé et de l'enfant : vidéo des galets le jour et l'animation de la maman avec son enfant */}
      {isChildPage(pathname, tool?.id) ? <ChildBackdrop /> : null}
      {/* v3 : plus de particules décoratives (« étoiles ») ; `stars` est conservé pour compatibilité */}
      {/* « padding » sur iOS et Android : Android est toujours edge-to-edge (Expo 54+), adjustResize ne réduit plus l'écran */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR} keyboardVerticalOffset={keyboardOffset}>
        <ScreenChromeContext.Provider value={chrome}>
        <KeyboardScopeContext.Provider value={keyboardScope}>
        {header}
        {body}
        {footer || action ? (
          <View testID="screen-footer" style={{ ...styles.wide, paddingHorizontal: spacing.lg, paddingBottom: keyboardVisible ? spacing.sm : bottomInset > 0 ? Math.max(insets.bottom, 10) + bottomInset : insets.bottom + spacing.sm, paddingTop: spacing.sm, gap: spacing.sm }}>
            {/* écran d'onglet (barre du bas) : le bouton d'action reste au-dessus de la barre */}
            {action ? (paidTool ? <PaidToolAction tool={paidTool} action={action} /> : <ActionButton action={action} />) : null}
            {footer}
          </View>
        ) : null}
        </KeyboardScopeContext.Provider>
        </ScreenChromeContext.Provider>
      </KeyboardAvoidingView>
    </Animated.View>
    </ScreenFocusContext.Provider>
  );
}

/** Titres : jamais de coupure de mot avec trait d'union (la taille est réduite pour que chaque mot tienne). */
const NO_HYPHENS = (Platform.OS === 'web' ? { hyphens: 'manual' } : null) as unknown as TextStyle;

function ActionButton({ action, disabled }: { action: ScreenAction; disabled?: boolean }) {
  // la promesse éventuelle est RENVOYÉE au bouton : chargement + appuis suivants ignorés jusqu'à la fin
  return <Button label={action.label} shortLabel={action.shortLabel} icon={action.icon ?? 'plus'} size="lg" full loading={action.loading}
    onPress={() => { Keyboard.dismiss(); return action.onPress(); }} disabled={action.disabled || disabled} testID={action.testID ?? 'miniapp-action'} />;
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

function PaidToolAction({ tool, action }: { tool: PaidTool; action: ScreenAction }) {
  const locked = !useToolAccess(tool).allowed;
  return <ActionButton action={action} disabled={locked} />;
}

/** Le glyphe de la carte touchée arrive dans l'en-tête (glisse depuis le bas, se réduit, se pose). */
function ArrivalGlyph({ origin, size = 44 }: { origin: ToolOrigin; size?: number }) {
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
      <ToolGlyph id={origin.id} theme={origin.theme} icon={origin.icon} urgent={origin.urgent} size={size} play={play} />
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

/** Accès au défilement de l'écran courant (remonter en haut, défiler jusqu'à un élément). */
export { useScreenScroll, type ScreenScroll } from './screenChrome';
