import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film';
import { Pub30 } from './ad/Pub30';
import { Grossesse30 } from './ad/Grossesse30';
import { Communaute30 } from './ad/Communaute30';
import { Cover } from './ad/Cover';
import { CAROUSELS, Carousel, Highlight, PostVisual, REEL_POSTS, Reel, ReelCover, Story } from './insta/Insta';
import { HIGHLIGHTS, POSTS } from './insta/data';
const nn = (n: number) => String(n).padStart(2, '0');
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
    <Composition id="Couverture-Facebook" component={Cover} durationInFrames={1} fps={30} width={1640} height={856} />
    {POSTS.map((p) => <Composition key={'p' + p.n} id={`Insta-Post-${nn(p.n)}`} component={PostVisual} durationInFrames={1} fps={30} width={1080} height={1350} defaultProps={{ n: p.n }} />)}
    {CAROUSELS.flatMap((c) => Array.from({ length: c.count }).map((_, i) => <Composition key={`c${c.n}-${i}`} id={`Insta-Carrousel-${nn(c.n)}-${i + 1}`} component={Carousel} durationInFrames={1} fps={30} width={1080} height={1350} defaultProps={{ n: c.n, i }} />))}
    {POSTS.map((p) => <Composition key={'s' + p.n} id={`Insta-Story-${nn(p.n)}`} component={Story} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ n: p.n }} />)}
    {REEL_POSTS.map((n) => <Composition key={'rc' + n} id={`Insta-CouvertureReel-${nn(n)}`} component={ReelCover} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ n }} />)}
    {REEL_POSTS.map((n) => <Composition key={'r' + n} id={`Insta-Reel-${nn(n)}`} component={Reel} durationInFrames={900} fps={60} width={1080} height={1920} defaultProps={{ n }} />)}
    {HIGHLIGHTS.map((h) => <Composition key={'h' + h.id} id={`Insta-ALaUne-${h.id}`} component={Highlight} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ id: h.id }} />)}
    <Composition id="Animatic" component={Film} durationInFrames={DURATION * 30} fps={30} width={1280} height={720} defaultProps={{ captions: true }} />
    <Composition id="Master" component={Film} durationInFrames={DURATION * 60} fps={60} width={3840} height={2160} defaultProps={{ captions: false }} />
    {SCENES.map((s) => <Composition key={s.id} id={`Scene-${s.id}`} component={Film} durationInFrames={Math.round((s.to - s.from) * 30)} fps={30} width={1280} height={720} defaultProps={{ captions: true, only: s.id }} />)}
  </>
);
