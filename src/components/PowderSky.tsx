/**
 * Ancien fond v2 (lueurs + particules) — conservé comme ALIAS pour les imports existants. En v3, le fond de coque est
 * la scène « désert sci-fi » (`src/components/scene/DesertScene.tsx`, variante calme) ; les particules décoratives
 * (« étoiles ») ont été supprimées des fonds.
 */
import React from 'react';
import { DesertScene } from './scene/DesertScene';

/** Position de la lumière selon l'heure (0..1 en x) — API conservée. */
export const lightX = (hour: number) => Math.max(0.1, Math.min(0.9, (hour - 6) / 14));

export function PowderSky({ night, still }: { hour?: number; night: boolean; still?: boolean }) {
  return <DesertScene variant="calm" still={still} testID={night ? 'bg-night' : 'bg-powder'} />;
}
