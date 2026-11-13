/**
 * Carte d'outil : glyphe animé propre au thème, titre, état utile (donnée réelle) ou description,
 * favori. Hauteur fixe pour des grilles parfaitement alignées ; contenu centré sur l'axe vertical
 * de la carte (le glyphe est centré sur sa zone visuelle, pas sur sa boîte).
 *
 * États : normal · survol (web) · pressé · focus clavier · actif (outil en cours) · désactivé
 * (profil enfant à créer) · confirmation (favori). Le toucher réagit immédiatement ; la navigation
 * part pendant que le glyphe joue son animation (jamais retardée pour les urgences).
 *
 * Mouvement (Reanimated, src/motion) : enfoncement en ressort (`usePressScale`), puis la carte s'élève
 * (`useCardLift`, 140 ms) avant l'ouverture de l'outil, dont l'écran répond par son entrée ; survol web : −3 px.
 * Réduire les animations / économie d'énergie : ouverture immédiate, aucun mouvement ; nuit : sans élévation.
 */
import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { durations, useCardLift, useMotion, usePressScale } from '@/motion';
import { router } from 'expo-router';
import { GlassSurface } from './Glass';
import { usePop, usePressMotion } from './Motion';
import { glyphColor, tint, ToolGlyph } from './ToolGlyph';
import { haptic, Icon, Text } from './ui';
import type { CatalogTool, ToolStatus } from '@/lib/domain/toolCatalog';
import { THEME_TITLE } from '@/lib/domain/toolCatalog';
import { markToolOpen } from '@/lib/toolOrigin';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, palette, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export const TOOL_CARD_HEIGHT = 164;

/** Ouvre l'outil : mémorise l'origine (glyphe → en-tête) et navigue sans attendre l'animation. */
export function openTool(tool: CatalogTool, y?: number, reduce?: boolean) {
  markToolOpen({ href: tool.href, id: tool.id, theme: tool.theme, icon: tool.icon, urgent: tool.urgent, y });
  const go = () => router.push(tool.href as never);
  if (tool.urgent || reduce) go();
  else setTimeout(go, 110); // le temps que l'enfoncement soit perçu, pas plus
}

export function ToolCard({ tool, status, favorite, onToggleFavorite, width, beforeOpen }: {
  tool: CatalogTool; status?: ToolStatus; favorite: boolean; onToggleFavorite: (t: CatalogTool) => void; width: number;
  /** Outil d'un autre profil : sélectionne ce profil avant d'ouvrir l'outil. */
  beforeOpen?: () => void;
}) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const m = useMotion();
  const press = usePressScale({ scale: 0.965, haptic: 'none' });
  const lift = useCardLift();
  const hover = useSharedValue(0);
  const hoverStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hover.value * -3 }] }));
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [play, setPlay] = useState(0);
  const c = glyphColor(t, tool.theme, tool.urgent);
  const line = status?.text ?? tool.sub;
  const a11y = [tool.label, status?.text ?? tool.sub, favorite ? 'favori' : null].filter(Boolean).join(', ');

  function onPress(e: GestureResponderEvent) {
    haptic('selection');
    setPlay((p) => p + 1);
    const y = e.nativeEvent.pageY;
    // urgences : aucune attente ; sinon la carte s'élève puis l'outil s'ouvre (immédiat si le mouvement est coupé)
    if (tool.urgent) { beforeOpen?.(); openTool(tool, y, true); return; }
    // `beforeOpen` (choix du profil d'un outil « autre profil ») seulement à l'ouverture : appelé avant l'élévation,
    // il re-rangeait la carte dans la section du profil choisi, la démontait et annulait l'élévation (clic sans effet,
    // audit navigation 13/11/2026, docs/audit/01_navigation.md)
    lift.open(() => {
      beforeOpen?.();
      openTool(tool, y, true);
      setTimeout(lift.settle, durations.slow); // l'écran de l'outil recouvre déjà la carte
    });
  }

  return (
    <Reanimated.View style={[{ width, minHeight: TOOL_CARD_HEIGHT }, hoverStyle]}>
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, backgroundColor: palette.night, opacity: 0, transform: [{ translateY: 8 }, { scale: 0.96 }] }, lift.shadow]} />
      <Reanimated.View style={[{ flex: 1 }, lift.style]}>
      <Reanimated.View style={[{ flex: 1 }, press.style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityHint={THEME_TITLE[tool.theme]}
        onPress={onPress}
        onPressIn={() => { setPressed(true); press.onPressIn(); }}
        onPressOut={() => { setPressed(false); press.onPressOut(); }}
        onHoverIn={() => { setHovered(true); hover.value = m.timing(1, durations.fast, 'standard'); if (!reduce && !tool.urgent) setPlay((p) => p + 1); }}
        onHoverOut={() => { setHovered(false); hover.value = m.timing(0, durations.fast, 'standard'); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', cursor: 'pointer' } as object) : {}) }}
      >
        <GlassSurface
          fill={hovered || pressed ? t.colors.surfaceAlt : t.colors.surface}
          borderColor={focused ? c : status?.active ? tint(c, 0.55) : undefined}
          depth={hovered ? 2 : 1}
          radius={radius.lg}
          style={{ flex: 1, borderWidth: focused ? 2 : undefined }}
        >
          {/* voile de lisibilité en thème sombre (surfaces très transparentes) : couleur de fond existante */}
          {t.isDark ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: tint(t.colors.background, 0.38) }} /> : null}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 8 }}>
            <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} play={play} hovered={hovered} pressed={pressed} active={status?.active} urgent={tool.urgent} />
            {/* zone de titre d'au moins 2 lignes : la carte ne « saute » pas, et un libellé plus long agrandit la carte au lieu d'être coupé */}
            <View style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'stretch' }}>
              <Text weight="bold" center style={{ fontSize: 14.5, lineHeight: 19 }}>{tool.label}</Text>
            </View>
            <View style={{ minHeight: 17, alignSelf: 'stretch', justifyContent: 'center' }}>
              {line ? <Text variant="caption" center color={status?.tone === 'accent' ? c : undefined} muted={status?.tone !== 'accent'}>{line}</Text> : null}
            </View>
          </View>
        </GlassSurface>
      </Pressable>
      </Reanimated.View>
      </Reanimated.View>
      {tool.urgent ? null : <FavoriteButton on={favorite} label={tool.label} color={c} onPress={() => onToggleFavorite(tool)} />}
    </Reanimated.View>
  );
}

function FavoriteButton({ on, label, color, onPress }: { on: boolean; label: string; color: string; onPress: () => void }) {
  const t = useTheme();
  const pop = usePop(on, 1.4);
  return (
    <Tappable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      aria-checked={on}
      accessibilityLabel={`${label} : ${on ? 'retirer des raccourcis' : 'ajouter aux raccourcis'}`}
      onPress={() => { haptic(on ? 'light' : 'success'); onPress(); }}
      hitSlop={6}
      style={{ position: 'absolute', top: 2, right: 2, width: MIN_TOUCH - 8, height: MIN_TOUCH - 8, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[pop, { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? tint(color, 0.16) : 'transparent' }]}>
        <Icon name="star" size={15} color={on ? color : t.colors.textMuted} />
      </Animated.View>
    </Tappable>
  );
}

/** Raccourci compact (favoris) : glyphe + libellé, centré, largeur fixe. */
export function ToolShortcut({ tool, status, beforeOpen }: { tool: CatalogTool; status?: ToolStatus; beforeOpen?: () => void }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const press = usePressMotion({ pressed: 0.94, hoverLift: -2 });
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [play, setPlay] = useState(0);
  const lastY = useRef(0);
  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[tool.label, status?.text].filter(Boolean).join(', ')}
        onPress={(e) => { haptic('selection'); setPlay((p) => p + 1); lastY.current = e.nativeEvent.pageY; beforeOpen?.(); openTool(tool, e.nativeEvent.pageY, reduce); }}
        onPressIn={() => { setPressed(true); press.handlers.onPressIn(); }}
        onPressOut={() => { setPressed(false); press.handlers.onPressOut(); }}
        onHoverIn={() => { setHovered(true); press.handlers.onHoverIn?.(); }}
        onHoverOut={() => { setHovered(false); press.handlers.onHoverOut?.(); }}
        style={{ width: 84, alignItems: 'center', gap: 6, paddingVertical: 4 }}
      >
        <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} size={52} play={play} pressed={pressed} hovered={hovered} active={status?.active} />
        <Text variant="caption" weight="medium" center style={{ color: t.colors.text, minHeight: 34 }}>{tool.label}</Text>
      </Pressable>
    </Animated.View>
  );
}
