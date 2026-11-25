import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { DURATION, SCENES } from './data/script';

/** Animatic (aperçu léger) et Master (4K 60 i/s) : même film, seuls la taille et la fréquence changent. */
export const Root: React.FC = () => (
  <>
    <Composition id="Animatic" component={Film} durationInFrames={DURATION * 30} fps={30} width={1280} height={720} defaultProps={{ captions: true }} />
    <Composition id="Master" component={Film} durationInFrames={DURATION * 60} fps={60} width={3840} height={2160} defaultProps={{ captions: false }} />
    {SCENES.map((s) => <Composition key={s.id} id={`Scene-${s.id}`} component={Film} durationInFrames={Math.round((s.to - s.from) * 30)} fps={30} width={1280} height={720} defaultProps={{ captions: true, only: s.id }} />)}
  </>
);
