/**
 * Lumière JAUNE d'une icône de la barre d'onglets (consigne de la propriétaire, 21/11/2026) : elle reste À L'INTÉRIEUR
 * du dessin. Une image « allumée » pré-calculée (src/brand/tabs.ts TAB_LIT, masque de la silhouette du symbole) est
 * posée sur l'icône ; seule son opacité varie (vive sous l'onglet actif, discrète sinon). Rien ne déborde de la tuile.
 */
import React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { TAB_LIGHT } from '@/theme/toolLogo';

export function TabLight({ size, active, lit, children, testID }: { size: number; active: boolean; lit?: ImageSourcePropType; children: React.ReactNode; testID?: string }) {
  const a = active ? TAB_LIGHT.active : TAB_LIGHT.idle;
  return (
    <View style={{ width: size, height: size }}>
      {children}
      {lit ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }}>
          <Image testID={testID} source={lit} accessibilityIgnoresInvertColors style={{ width: size, height: size, opacity: a }} />
        </View>
      ) : null}
    </View>
  );
}
