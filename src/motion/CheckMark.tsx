/**
 * COCHE D'UNE CASE — la coche se TRACE quand la case passe à « fait » (donnée réelle : après la confirmation du
 * serveur, jamais avant) et s'efface quand elle repasse à « à faire ». Au montage : état final, aucune animation
 * (une liste de tâches déjà faites ne rejoue rien). Même tracé et mêmes jetons que `SuccessCheck`.
 *
 *   <View style={box}><CheckMark checked={done} color={fg} size={18} /></View>
 *
 * 'off' : coche complète immédiate ; 'minimal' (nuit) : fondu court.
 */
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SuccessCheck } from './SuccessCheck';

export function CheckMark({ checked, size = 18, color, haptic = false, style, testID }: {
  checked: boolean;
  size?: number;
  color?: string;
  /** haptique « succès » à la coche (seulement quand elle confirme une action utile) */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return <SuccessCheck visible={checked} size={size} color={color} haptic={haptic} style={style} testID={testID} />;
}
