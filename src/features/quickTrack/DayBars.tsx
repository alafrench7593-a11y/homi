/**
 * Une barre par jour (même dessin que la catégorie Sommeil) : valeur connue → barre pleine proportionnelle ; jour sans
 * saisie → petit bloc en pointillés « rien de noté », JAMAIS une barre à zéro. Le jour choisi est souligné ; toucher
 * un jour le sélectionne (adresse : `?day=`).
 */
import React from 'react';
import { View } from 'react-native';
import { Tappable } from '@/components/Tappable';
import { haptic, Text } from '@/components/ui';
import { formatDate } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH } from '@/theme/tokens';

const BAR_H = 84;

export function DayBars({ days, selected, onSelect, testID, describe, minMax = 1 }: {
  days: { day: string; value: number | null }[];
  selected: string;
  onSelect: (day: string) => void;
  testID: string;
  /** Texte lu pour un jour (valeur avec son unité, ou « rien de noté ») */
  describe: (d: { day: string; value: number | null }) => string;
  /** Échelle minimale (ex. 60 ml) pour qu'une petite valeur ne remplisse pas toute la hauteur */
  minMax?: number;
}) {
  const t = useTheme();
  const max = Math.max(minMax, ...days.map((d) => d.value ?? 0));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }} testID={testID}>
      {days.map((d) => {
        const on = d.day === selected;
        return (
          <Tappable key={d.day} style={({ pressed }) => ({ flex: 1, paddingHorizontal: 3, alignItems: 'center', gap: 4, minHeight: MIN_TOUCH, opacity: pressed ? 0.7 : 1 })} testID={`${testID}-${d.day}`}
            accessibilityRole="button" accessibilityState={{ selected: on }}
            accessibilityLabel={`${formatDate(`${d.day}T12:00:00`, { weekday: 'long', day: 'numeric' })} : ${describe(d)}`}
            onPress={() => { haptic('selection'); onSelect(d.day); }}>
            <View style={{ height: BAR_H, width: '100%', justifyContent: 'flex-end' }}>
              {d.value != null ? (
                <View testID={`${testID}-${d.day}-k`} style={{ height: Math.max(6, Math.round((d.value / max) * BAR_H)), borderRadius: 6, backgroundColor: t.colors.text, opacity: on ? 1 : 0.55, borderWidth: on ? 2 : 0, borderColor: t.colors.primary }} />
              ) : (
                <View testID={`${testID}-${d.day}-u`} style={{ height: 14, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted, opacity: on ? 1 : 0.6 }} />
              )}
            </View>
            <Text variant="caption" muted={!on} weight={on ? 'bold' : undefined}>{formatDate(`${d.day}T12:00:00`, { weekday: 'narrow' })}</Text>
          </Tappable>
        );
      })}
    </View>
  );
}
