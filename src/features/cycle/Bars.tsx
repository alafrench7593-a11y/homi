/** Barres horizontales animées avec valeurs écrites et alternative textuelle complète (lecteur d'écran). */
import React from 'react';
import { Animated, View } from 'react-native';
import { useProgress } from '@/components/MotionKit';
import { spacing } from '@/theme/tokens';
import { Ink, useCyclePalette } from './kit';

/** Barres horizontales : libellé au-dessus (passe à la ligne), barre proportionnelle, valeur écrite. */
export function Bars({ rows, label, color }: { rows: { label: string; value: number; display: string }[]; label: string; color: string }) {
  const c = useCyclePalette();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const grow = useProgress(rows.map((r) => r.value).join('|'), 800);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${label}. ${rows.map((r) => `${r.label} : ${r.display}`).join(', ')}`} style={{ gap: spacing.sm }}>
      {rows.map((r) => (
        <View key={r.label} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
            <Ink variant="small" style={{ flex: 1 }}>{r.label}</Ink>
            <Ink variant="small" weight="bold">{r.display}</Ink>
          </View>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: c.pearl, overflow: 'hidden' }}>
            <Animated.View style={{ height: 10, borderRadius: 5, backgroundColor: color, width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(4, (r.value / max) * 100)}%`] }) }} />
          </View>
        </View>
      ))}
    </View>
  );
}

