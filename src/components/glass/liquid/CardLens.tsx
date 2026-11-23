/**
 * Verre liquide d'une carte de contenu (textes, analyses, listes) : même lèvre, même reflet orienté et même ombre que
 * la barre (réglages du laboratoire), posés sur la surface de la carte, sans filtre de réfraction (rien à réfracter sur
 * le fond uni de la page). Calque décoratif : sans toucher, caché aux lecteurs d'écran.
 */
import React from 'react';
import { LiquidLensMaterial } from './LiquidLens';
import { useLensStore } from './store';

/** Cartes (23/11/2026, « liquid glass partout ») : lèvre plus large, reflet et ombre plus marqués que la barre, pour que
 * le verre se lise sur un fond uni (aucun fond décoratif derrière). */
const CARD_MIN = { bezel: 22, highlight: 0.9, shadow: 0.5 } as const;

export function CardLens({ radius, testID = 'card-lens' }: { radius: number; testID?: string }) {
  const base = useLensStore((s) => s.params);
  const params = React.useMemo(() => ({ ...base, bezel: Math.max(base.bezel, CARD_MIN.bezel), highlight: Math.max(base.highlight, CARD_MIN.highlight), shadow: Math.max(base.shadow, CARD_MIN.shadow) }), [base]);
  return <LiquidLensMaterial radius={radius} params={params} refract={false} fill="transparent" testID={testID} />;
}
