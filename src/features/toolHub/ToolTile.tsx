/**
 * Tuile d'outil COMPACTE en verre (`GlassMaterial` « card ») — favoris, récents, « Pour <profil> » du centre d'outils
 * et de la recherche. Pictogramme + nom (2 lignes) : une petite surface, jamais un paragraphe (la description complète
 * est dans la fiche et dans les listes opaques, `ToolRow`). Langage de `GlassToolCard` :
 *  - toucher : compression 0,97 (`usePress`, fil UI), voile d'appui, l'ombre de repos se fond dans l'ombre de contact,
 *    haptique léger ; l'ouverture part après l'enfoncement perçu (`openTool`) ;
 *  - ENTRÉE (une fois, au montage) : la tuile se pose (0,94 → 1, 8 pt de montée), décalée de 45 ms par rang —
 *    TRANSFORM SEULEMENT : on n'estompe jamais un verre ni l'un de ses ancêtres (le flou se figerait) ;
 *  - « Réduire les animations » : aucune entrée, aucune échelle (le voile d'appui reste) ; « Réduire la transparence »,
 *    mode nuit, Android sans cible de flou : surface opaque (repli de `GlassMaterial`).
 * Nom accessible : nom de l'outil + profil éventuel (« pour Léa »).
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { GlassMaterial, glassShadow, useGlass } from '@/components/glass';
import { ToolGlyph } from '@/components/ToolGlyph';
import { Text } from '@/components/ui';
import { cascadeDelay, useMotion, usePress } from '@/motion';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import { radius as R, spacing } from '@/theme/tokens';

export const TOOL_TILE = { width: 100, glyph: 44, minHeight: 112 } as const;

export const ToolTile = React.memo(function ToolTile({ tool, profile, index = 0, width = TOOL_TILE.width, onPress, testID }: {
  tool: CatalogTool;
  /** Profil d'un autre membre du foyer (« Léa ») : annoncé et affiché en petit */
  profile?: string;
  /** Rang dans la rangée (décalage d'entrée) */
  index?: number;
  width?: number | `${number}%`;
  onPress: () => void;
  testID?: string;
}) {
  const m = useMotion();
  const { spec, tier } = useGlass('card');
  const p = usePress({ scale: 0.97, haptic: 'light' });
  // Entrée : transform seulement (jamais l'opacité d'un verre)
  const enter = useSharedValue(m.level === 'full' ? 0 : 1);
  useEffect(() => {
    if (m.level !== 'full') { enter.value = 1; return; }
    enter.value = m.delay(cascadeDelay(index), m.spring(1, 'doux'));
    return () => cancelAnimation(enter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - enter.value) * 8 }, { scale: (0.94 + 0.06 * enter.value) * (1 - 0.03 * p.progress.value) }],
  }));
  const veil = useAnimatedStyle(() => ({ opacity: p.progress.value }));
  const rest = useAnimatedStyle(() => ({ opacity: 1 - p.progress.value }));
  const down = useAnimatedStyle(() => ({ opacity: p.progress.value }));
  const a11y = [tool.label, profile].filter(Boolean).join(', ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} testID={testID ?? `tool-shortcut-${tool.id}`} pressRetentionOffset={16}
      onPressIn={p.onPressIn} onPressOut={p.onPressOut} onPress={onPress} style={{ width }}>
      <Animated.View style={[styles.tile, style]}>
        {spec.shadow ? (
          <>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: R.lg, boxShadow: glassShadow(spec, tier) }, rest]} />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: R.lg, boxShadow: glassShadow(spec, tier, true) }, down]} />
          </>
        ) : null}
        <GlassMaterial variant="card" radius={R.lg} testID={`tool-tile-${tool.id}`} />
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: R.lg, backgroundColor: spec.press }, veil]} />
        <View style={styles.body}>
          <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={TOOL_TILE.glyph} />
          <Text variant="caption" weight="bold" center numberOfLines={2} color={spec.inks.text} style={styles.name}>{tool.label}</Text>
          {profile ? <Text variant="caption" center numberOfLines={1} color={spec.inks.muted}>{profile}</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: { borderRadius: R.lg, minHeight: TOOL_TILE.minHeight },
  body: { alignItems: 'center', paddingHorizontal: spacing.xs, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 6 },
  name: { fontSize: 13, lineHeight: 17 },
});
