/**
 * APPARITION ÉCHELONNÉE — une liste qui arrive (résultats, cartes d'outils) entre rang après rang : fondu + montée de
 * 10 px, 45 ms entre deux rangs, plafonnée à 360 ms (voir `Cascade`). À réserver au contenu que l'on vient de
 * demander ; JAMAIS sur les lignes d'une liste virtualisée (elles se recyclent : l'animation rejouerait au défilement).
 *
 *   <StaggerList gap={12}>{tools.map((t) => <GlassToolCard key={t.id} … />)}</StaggerList>
 *
 * 'off' : tout est visible d'emblée ; 'minimal' (nuit) : fondu court, sans déplacement ni décalage.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Cascade } from './Cascade';

export function StaggerList({ children, gap, style, itemStyle, from = 0, testID }: {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  /** Rang du premier élément (pour enchaîner après un en-tête déjà échelonné) */
  from?: number;
  testID?: string;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View testID={testID} style={[gap ? { gap } : null, style]}>
      {items.map((child, i) => (
        <Cascade key={React.isValidElement(child) && child.key != null ? String(child.key) : `s${i}`} index={from + i} style={itemStyle}>{child}</Cascade>
      ))}
    </View>
  );
}
