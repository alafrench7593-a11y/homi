/**
 * Rangée horizontale qui DIT qu'elle défile (21/11/2026) : elle déborde jusqu'au bord de l'écran (le dernier élément
 * visible est coupé par le bord, pas par la marge de la page) et un fondu, couleur du fond, recouvre le bord droit
 * tant qu'il reste des éléments à droite. Le fondu disparaît en fin de défilement ; aucune animation n'est nécessaire.
 * `bleed` = marge horizontale de la page (la rangée s'étend dessous, son contenu reste aligné sur le texte).
 */
import React, { useRef, useState } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, spacing } from '@/theme/tokens';

/** Il reste du contenu à droite (au-delà d'une tolérance de 4 pt) : le fondu du bord droit s'affiche. */
export const hasMoreRight = (viewport: number, content: number, x: number) => viewport > 0 && content - viewport - x > 4;

export const EDGE_FADE_WIDTH = 40;

export function FadingScrollRow({ children, testID, bleed = spacing.lg, gap = spacing.xs, contentStyle, accessibilityRole }: {
  children: React.ReactNode;
  testID?: string;
  bleed?: number;
  gap?: number;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityRole?: 'tablist';
}) {
  const t = useTheme();
  const size = useRef({ w: 0, c: 0, x: 0 });
  const [more, setMore] = useState(false);
  const update = (p: Partial<{ w: number; c: number; x: number }>) => {
    size.current = { ...size.current, ...p };
    const m = hasMoreRight(size.current.w, size.current.c, size.current.x);
    setMore((v) => (v === m ? v : m));
  };
  const bg = t.colors.background;
  return (
    <View style={{ marginHorizontal: -bleed }}>
      <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} scrollEventThrottle={32}
        accessibilityRole={accessibilityRole} testID={testID}
        onLayout={(e) => update({ w: e.nativeEvent.layout.width })}
        onContentSizeChange={(c) => update({ c })}
        onScroll={(e) => update({ w: e.nativeEvent.layoutMeasurement.width, c: e.nativeEvent.contentSize.width, x: e.nativeEvent.contentOffset.x })}
        contentContainerStyle={[{ gap, paddingHorizontal: bleed, paddingVertical: 2 }, contentStyle]}>
        {children}
      </ScrollView>
      {more ? (
        <LinearGradient pointerEvents="none" colors={[alpha(bg, 0), bg]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          testID={testID ? `${testID}-fade` : undefined} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: EDGE_FADE_WIDTH }} />
      ) : null}
    </View>
  );
}
