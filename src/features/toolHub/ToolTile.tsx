/**
 * Tuile d'outil — favoris, récents, « Pour <profil> » du centre d'outils et de la recherche, raccourcis de l'accueil.
 *
 * Direction « verre minéral » (20/11/2026, docs/DA_LIQUID_GLASS.md) : l'outil est une MINI-APP — son logo (plaque
 * d'icône d'app) posé directement sur la page, nom dessous, comme sur un écran d'accueil. Plus de carte de verre
 * autour : le verre est réservé à ce qui flotte au-dessus du contenu (barre, recherche, feuilles, boutons flottants).
 *  - toucher : la tuile se comprime (0,97, `usePress`, fil UI) et la plaque s'enfonce (0,94) dès le contact, haptique
 *    léger ; à l'ouverture, le logo joue l'animation de SA famille (lune, anneau, courbe, coche, rebond, reflet) —
 *    seule la tuile touchée s'anime, jamais toute la rangée ;
 *  - ENTRÉE (une fois, au montage) : la tuile se pose (0,94 → 1, 8 pt de montée), décalée de 45 ms par rang ;
 *  - « Réduire les animations » : aucune entrée, aucune échelle, état final du logo immédiat.
 * Nom accessible : nom de l'outil + profil éventuel (« pour Léa ») + raison de la recommandation.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { ToolGlyph } from '@/components/ToolGlyph';
import { Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { cascadeDelay, useMotion, usePress } from '@/motion';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export const TOOL_TILE = { width: 100, glyph: 60, minHeight: 104 } as const;

export const ToolTile = React.memo(function ToolTile({ tool, profile, reason, index = 0, width = TOOL_TILE.width, onPress, onLongPress, a11yHint, testID, locked }: {
  tool: CatalogTool;
  /** Sans Premium : outil réservé (petit cadenas sur le logo, annoncé). */
  locked?: boolean;
  /** Profil d'un autre membre du foyer (« Léa ») : annoncé et affiché en petit */
  profile?: string;
  /** Rang dans la rangée (décalage d'entrée) */
  index?: number;
  width?: number | `${number}%`;
  onPress: () => void;
  /** Raison de la recommandation (« Parce que Lina a 8 mois »), affichée en petit sous le nom (20/11/2026). */
  reason?: string;
  onLongPress?: () => void;
  a11yHint?: string;
  testID?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const p = usePress({ scale: 0.97, haptic: 'light' });
  const [pressed, setPressed] = React.useState(false);
  const [play, setPlay] = React.useState(0);
  // Entrée : transform seulement
  const enter = useSharedValue(m.level === 'full' ? 0 : 1);
  useEffect(() => {
    if (m.level !== 'full') { enter.value = 1; return; }
    enter.value = m.delay(cascadeDelay(index), m.spring(1, 'doux'));
    return () => cancelAnimation(enter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - enter.value) * 8 }, { scale: (0.94 + 0.06 * enter.value) * (1 - 0.03 * p.progress.value) }],
  }));
  const a11y = [tool.label, profile, reason, locked ? tr('mt.lockedA11y') : null].filter(Boolean).join(', ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} testID={testID ?? `tool-shortcut-${tool.id}`} pressRetentionOffset={16}
      onPressIn={() => { setPressed(true); p.onPressIn(); }} onPressOut={() => { setPressed(false); p.onPressOut(); }}
      onPress={() => { setPlay((n) => n + 1); onPress(); }} onLongPress={onLongPress} accessibilityHint={a11yHint} style={{ width, alignSelf: 'stretch' }}>
      <Animated.View style={[styles.tile, style]}>
        <View style={styles.body} testID={`tool-tile-${tool.id}`}>
          <View>
            <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={TOOL_TILE.glyph} pressed={pressed} play={play} />
            {locked ? (
              <View pointerEvents="none" testID={`tool-tile-locked-${tool.id}`}
                style={{ position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border }}>
                <Icon name="lock" size={12} color={t.colors.textMuted} />
              </View>
            ) : null}
          </View>
          <Text variant="caption" weight="bold" center color={t.colors.text} style={styles.name}>{tool.label}</Text>
          {profile ? <Text variant="caption" center numberOfLines={1} color={t.colors.textMuted}>{profile}</Text> : null}
          {reason ? <Text variant="caption" center color={t.colors.textMuted} style={styles.reason} testID={testID ? `${testID}-reason` : undefined}>{reason}</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // Hauteur uniforme dans une rangée : la tuile remplit la hauteur de la plus haute (nom entier, jamais d'ellipse)
  tile: { minHeight: TOOL_TILE.minHeight, flexGrow: 1 },
  body: { alignItems: 'center', paddingHorizontal: 2, paddingTop: spacing.xxs, paddingBottom: spacing.xs, gap: 6 },
  name: { fontSize: 13, lineHeight: 17 },
  reason: { fontSize: 11, lineHeight: 14 },
});
