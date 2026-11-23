/**
 * Verre liquide d'une carte de contenu (textes, analyses, listes) : même lèvre, même reflet orienté et même ombre que
 * la barre (réglages du laboratoire), posés sur la surface de la carte, sans filtre de réfraction (rien à réfracter sur
 * le fond uni de la page). Calque décoratif : sans toucher, caché aux lecteurs d'écran.
 */
import React from 'react';
import { LiquidLensMaterial } from './LiquidLens';
import { useLensStore } from './store';

export function CardLens({ radius, testID = 'card-lens' }: { radius: number; testID?: string }) {
  const params = useLensStore((s) => s.params);
  return <LiquidLensMaterial radius={radius} params={params} refract={false} fill="transparent" testID={testID} />;
}
