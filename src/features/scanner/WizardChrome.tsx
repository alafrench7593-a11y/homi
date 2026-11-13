/**
 * Habillage de l'assistant du scanner :
 *  - `StepProgress` : progression DISCRÈTE (« Étape 2 sur 4 · Confirmer » + 4 segments fins). Elle avance et recule
 *    AVEC le geste : le segment se remplit (ou se vide) pendant que l'étape glisse, dans la même famille « panneau »
 *    (280 ms `decelerate`, interruptible : repart de la valeur affichée). Les segments déjà franchis sont des boutons :
 *    les toucher revient à cette étape, saisie conservée. Seul `transform` est animé (fil UI).
 *  - `StepStage` : l'étape entrante glisse de 16 px dans le sens du geste (en avant : depuis la droite ; retour :
 *    depuis la gauche) avec un fondu. Nuit : fondu court sans déplacement ; Réduire les animations / économie
 *    d'énergie : changement immédiat, jamais un écran à moitié apparu.
 */
import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { durations, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function StepProgress({ labels, index, onJump, testID = 'scan-progress' }: { labels: string[]; index: number; onJump: (i: number) => void; testID?: string }) {
  const t = useTheme();
  const m = useMotion();
  const n = labels.length;
  const pos = useSharedValue(index + 1);
  const segW = useSharedValue(0);
  const first = React.useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; pos.value = index + 1; return; }
    pos.value = m.timing(index + 1, durations.panel, 'decelerate');
    AccessibilityInfo.announceForAccessibility?.(tr('scn.step.of', { n: index + 1, total: n, name: labels[index] }));
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimation(pos), [pos]);
  const caption = tr('scn.step.of', { n: index + 1, total: n, name: labels[index] });
  return (
    <View testID={testID} style={{ gap: 6 }}>
      <Text variant="caption" weight="bold" muted accessibilityRole="progressbar" accessibilityLabel={caption}
        accessibilityValue={{ min: 1, max: n, now: index + 1 }}>{caption}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {labels.map((label, i) => {
          const done = i < index;
          return (
            <Pressable key={label} disabled={!done} onPress={() => onJump(i)} hitSlop={{ top: 10, bottom: 10 }}
              accessibilityRole={done ? 'button' : undefined} accessibilityElementsHidden={!done} importantForAccessibility={done ? 'yes' : 'no-hide-descendants'}
              accessibilityLabel={done ? tr('scn.step.jump', { n: i + 1, name: label }) : undefined} testID={`${testID}-seg-${i}`}
              style={{ flex: 1, height: 20, justifyContent: 'center' }}>
              <View onLayout={i === 0 ? (e: LayoutChangeEvent) => { segW.value = e.nativeEvent.layout.width; } : undefined}
                style={{ height: 4, borderRadius: radius.pill, backgroundColor: t.material.lines.track, overflow: 'hidden' }}>
                <SegmentFill i={i} pos={pos} segW={segW} color={t.colors.primary} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SegmentFill({ i, pos, segW, color }: { i: number; pos: SharedValue<number>; segW: SharedValue<number>; color: string }) {
  const style = useAnimatedStyle(() => {
    const f = Math.max(0, Math.min(1, pos.value - i));
    // Avant la première mesure : plein ou vide (jamais de largeur animée)
    return segW.value > 0 ? { opacity: 1, transform: [{ translateX: (f - 1) * segW.value }] } : { opacity: f >= 1 ? 1 : 0, transform: [{ translateX: 0 }] };
  });
  return <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: color, borderRadius: radius.pill }, style]} />;
}

/** Contenu d'une étape (à monter avec `key={step}`) : glisse dans le sens du geste, saisie intacte (état du parent). */
export function StepStage({ dir, children, testID }: { dir: 1 | -1; children: React.ReactNode; testID?: string }) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  const level = m.level;
  useEffect(() => {
    p.value = m.minimal ? m.timing(1, durations.fast, 'standard') : m.timing(1, durations.panel, 'decelerate');
    return () => cancelAnimation(p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateX: level === 'full' ? (1 - p.value) * 16 * dir : 0 }],
  }));
  return <Animated.View testID={testID} style={[{ gap: spacing.md }, style]}>{children}</Animated.View>;
}
