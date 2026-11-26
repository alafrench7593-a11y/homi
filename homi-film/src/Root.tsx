import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { Pub30 } from './ad/Pub30';
import { Grossesse30 } from './ad/Grossesse30';
import { Communaute30 } from './ad/Communaute30';
import { DURATION, SCENES } from './data/script';

/** Film long (animatic + master) et publicité 30 s (verticale et horizontale, avec ou sans voix). */
export const Root: React.FC = () => (
  <>
    <Composition id="Pub30-Vertical" component={Pub30} durationInFrames={1800} fps={60} width={1080} height={1920} defaultProps={{ vertical: true, voice: true }} />
    <Composition id="Pub30-Horizontal" component={Pub30} durationInFrames={1800} fps={60} width={3840} height={2160} defaultProps={{ vertical: false, voice: true }} />
    <Composition id="Grossesse30-Vertical" component={Grossesse30} durationInFrames={1800} fps={60} width={1080} height={1920} defaultProps={{ vertical: true, voice: true }} />
    <Composition id="Grossesse30-Horizontal" component={Grossesse30} durationInFrames={1800} fps={60} width={3840} height={2160} defaultProps={{ vertical: false, voice: true }} />
    <Composition id="Communaute30-Vertical" component={Communaute30} durationInFrames={1800} fps={60} width={1080} height={1920} defaultProps={{ vertical: true, voice: true }} />
    <Composition id="Communaute30-Horizontal" component={Communaute30} durationInFrames={1800} fps={60} width={3840} height={2160} defaultProps={{ vertical: false, voice: true }} />
    <Composition id="Animatic" component={Film} durationInFrames={DURATION * 30} fps={30} width={1280} height={720} defaultProps={{ captions: true }} />
    <Composition id="Master" component={Film} durationInFrames={DURATION * 60} fps={60} width={3840} height={2160} defaultProps={{ captions: false }} />
    {SCENES.map((s) => <Composition key={s.id} id={`Scene-${s.id}`} component={Film} durationInFrames={Math.round((s.to - s.from) * 30)} fps={30} width={1280} height={720} defaultProps={{ captions: true, only: s.id }} />)}
  </>
);
