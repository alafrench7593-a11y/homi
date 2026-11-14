/**
 * Compatibilité : la scène « désert sci-fi » v3 est remplacée par les scènes d'ESPACE v4 (`SpaceScene`, une
 * composition minérale par espace, sans astre ni arc répété). Ce module garde les anciens noms pour les imports
 * existants : `DesertScene` = scène de l'Accueil.
 */
import React from 'react';
import { SpaceScene } from './SpaceScene';

export { backdropVariant, IMMERSIVE_ROUTES, pebble, SCENE, sceneAnimates, SpaceScene, webDriftStyle, type SceneVariant } from './SpaceScene';

export function DesertScene(p: Omit<React.ComponentProps<typeof SpaceScene>, 'space'>) {
  return <SpaceScene space="home" {...p} />;
}
