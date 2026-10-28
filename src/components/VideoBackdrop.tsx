/**
 * Fond vidéo (muet, plein écran, « cover »), derrière toutes les pages : plusieurs vidéos par ambiance, enchaînées.
 * Les vidéos sont fournies avec l'application ; tant qu'elle n'est pas prête
 * (ou si le réseau manque), le fond rose poudré (ou bleu nuit) reste affiché dessous.
 * Un voile teinté par le thème garde le texte lisible de jour comme de nuit.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Image, Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';

import { useLowPower } from '@/lib/lowPower';
import { BACKDROP_FADE_S, backdropPlan, type BackdropPass } from '@/lib/domain/backdropPlan';
export { useLowPower };

/** Application au premier plan ? (la vidéo est mise en pause sinon) */
function useForeground(): boolean {
  const [fg, setFg] = useState(true);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const on = () => setFg(document.visibilityState !== 'hidden');
      document.addEventListener('visibilitychange', on);
      return () => document.removeEventListener('visibilitychange', on);
    }
    const sub = AppState.addEventListener('change', (st) => setFg(st === 'active'));
    return () => sub.remove();
  }, []);
  return fg;
}

/**
 * Fonds vidéo « Au fil de nous » (26/10/2026, ElevenLabs, Kling 3 Pro) : 10 s chacun, format téléphone, sans son,
 * aux couleurs du logo. Jour : ciel rose et pêche, lumière dorée, fil doré ; nuit : bleu nuit et prune, lune,
 * étoiles, fil champagne. Fournis avec l'application : aucune dépendance à un lien externe.
 * Ils tournent en fondu enchaîné, dans un ordre tiré au hasard, parfois en miroir et à vitesse variable
 * (voir backdropPlan) : le fond n'est jamais tout à fait le même.
 */
export interface BackdropClip { video: number; poster: number }
export const BACKDROP_CLIPS: { day: BackdropClip[]; night: BackdropClip[] } = {
  day: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    { video: require('../../assets/video/jour-1.mp4'), poster: require('../../assets/video/jour-1.jpg') },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    { video: require('../../assets/video/jour-2.mp4'), poster: require('../../assets/video/jour-2.jpg') },
    // Première vidéo de fond (ciel, galets flottants, bulles, bateau en papier), gardée dans la rotation du jour
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    { video: require('../../assets/video/jour-galets.mp4'), poster: require('../../assets/video/jour-galets.jpg') },
  ],
  night: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    { video: require('../../assets/video/nuit-1.mp4'), poster: require('../../assets/video/nuit-1.jpg') },
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    { video: require('../../assets/video/nuit-2.mp4'), poster: require('../../assets/video/nuit-2.jpg') },
  ],
};
/** Compatibilité : première vidéo et première image de jour. */
export const BACKGROUND_VIDEO: number = BACKDROP_CLIPS.day[0].video;
export const BACKGROUND_POSTER: number = BACKDROP_CLIPS.day[0].poster;
/** Vidéo des galets (ciel, galets flottants, bateau en papier) : fond de l'introduction. */
export const GALETS_CLIP: BackdropClip = BACKDROP_CLIPS.day[2];
/**
 * Histoire en 3D « du fœtus aux 10 ans » (vidéo fournie le 28/10/2026), recadrée au format téléphone :
 * l'histoire complète (introduction), le bébé dans les bras, et l'enfant qui marche main dans la main.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const STORY_3D_CLIP: BackdropClip = { video: require('../../assets/video/histoire-3d.mp4'), poster: require('../../assets/video/histoire-3d.jpg') };
export const STORY_BABY_CLIP: BackdropClip = { video: require('../../assets/video/histoire-bebe.mp4'), poster: require('../../assets/video/histoire-bebe.jpg') };
export const STORY_WALK_CLIP: BackdropClip = { video: require('../../assets/video/histoire-marche.mp4'), poster: require('../../assets/video/histoire-marche.jpg') };
/* eslint-enable @typescript-eslint/no-require-imports */
/** Première vidéo de fond (boucle de 4 s, paysage) ; sa version téléphone de 8 s, jour-galets.mp4, tourne avec les fonds de jour. */
export const FIRST_BACKGROUND_VIDEO_FILE = 'assets/video/fond-ciel.mp4';
/** Vidéo du prompt MOSS (Movento), essayée le 26/10/2026, remplacée par la vidéo générée pour l'application. */
export const BACKGROUND_VIDEO_URL = 'https://cdn.5sdesign.art/projects/moss/hero.mp4';
/** Ancienne vidéo de fond (ambiance nuit), conservée pour mémoire. */
export const PREVIOUS_BACKGROUND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260717_120352_eb988725-1351-43b3-8095-16e4a1005e3d.mp4';
/** Voiles de lisibilité posés sur la vidéo : rose poudré le jour, bleu nuit et prune la nuit. */
export const VIDEO_VEIL = { day: 'rgba(242,221,216,0.22)', night: 'rgba(31,35,68,0.5)' };

function useFadeIn(ready: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (ready) Animated.timing(opacity, { toValue: 1, duration: 1000, delay: 200, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [ready, opacity]);
  return opacity;
}

/** Adresse web d'un fichier fourni avec l'application (le format renvoyé par require() varie selon l'outil). */
export function webAssetUri(mod: unknown): string | undefined {
  if (typeof mod === 'string') return mod;
  const m = mod as { uri?: string; default?: string | { uri?: string } } | null;
  if (m?.uri) return m.uri;
  if (typeof m?.default === 'string') return m.default;
  if (m?.default && typeof m.default === 'object' && m.default.uri) return m.default.uri;
  try { return (Image.resolveAssetSource?.(mod as number) as { uri?: string } | undefined)?.uri; } catch { return undefined; }
}

type Layer = { pass: BackdropPass; n: number };

/** Enchaîne les passages : deux couches qui alternent, la suivante démarre pendant la fin de la précédente. */
function usePlaylist(clips: BackdropClip[]) {
  const [plan] = useState(() => backdropPlan(clips.length, Math.random(), 24));
  const [st, setSt] = useState<{ layers: [Layer, Layer]; active: 0 | 1 }>(() => ({
    layers: [{ pass: plan[0], n: 0 }, { pass: plan[1 % plan.length], n: 1 }],
    active: 0,
  }));
  const busy = useRef(false);
  const next = React.useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setSt(({ layers, active }) => {
      const incoming: 0 | 1 = active === 0 ? 1 : 0;
      const n = layers[active].n + 1;
      const copy: [Layer, Layer] = [layers[0], layers[1]];
      copy[incoming] = { pass: plan[n % plan.length], n };
      return { layers: copy, active: incoming };
    });
    setTimeout(() => { busy.current = false; }, BACKDROP_FADE_S * 1000 + 300);
  }, [plan]);
  return { layers: st.layers, active: st.active, next };
}

function WebLayer({ clip, pass, n, active, playing, onReady, onNearEnd }: { clip: BackdropClip; pass: BackdropPass; n: number; active: boolean; playing: boolean; onReady: () => void; onNearEnd: () => void }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  // Nouveau passage sur cette couche : on repart du début, à la vitesse tirée
  useEffect(() => {
    const v = ref.current;
    if (!v || !active) return;
    try { v.currentTime = 0; } catch { /* vidéo pas encore prête */ }
    v.playbackRate = pass.rate;
    if (playing) v.play?.().catch(() => undefined);
  }, [n, active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!playing) v.pause?.();
    else if (active) v.play?.().catch(() => undefined);
  }, [playing, active]);
  return React.createElement('video', {
    ref,
    src: webAssetUri(clip.video),
    poster: webAssetUri(clip.poster),
    autoPlay: active,
    muted: true,
    playsInline: true,
    preload: 'auto',
    'aria-hidden': true,
    onCanPlay: active ? onReady : undefined,
    onTimeUpdate: (e: { currentTarget: HTMLVideoElement }) => {
      const v = e.currentTarget;
      if (active && v.duration && (v.duration - v.currentTime) / (v.playbackRate || 1) <= BACKDROP_FADE_S) onNearEnd();
    },
    onEnded: active ? onNearEnd : undefined,
    style: {
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
      opacity: active ? 1 : 0, transition: `opacity ${BACKDROP_FADE_S}s ease-in-out`,
      transform: pass.mirror ? 'scaleX(-1)' : 'none',
    },
  });
}

function NativeLayer({ clip, pass, n, active, playing, onReady, onNearEnd }: { clip: BackdropClip; pass: BackdropPass; n: number; active: boolean; playing: boolean; onReady: () => void; onNearEnd: () => void }) {
  const player = useVideoPlayer(clip.video, (p) => {
    p.loop = false;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
  });
  const fade = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: active ? 1 : 0, duration: BACKDROP_FADE_S * 1000, useNativeDriver: true }).start();
  }, [active, fade]);
  useEffect(() => {
    const a = player.addListener('statusChange', ({ status }) => { if (status === 'readyToPlay' && active) onReady(); });
    const b = player.addListener('timeUpdate', ({ currentTime }) => {
      if (active && player.duration && (player.duration - currentTime) / (player.playbackRate || 1) <= BACKDROP_FADE_S) onNearEnd();
    });
    const c = player.addListener('playToEnd', () => { if (active) onNearEnd(); });
    return () => { a.remove(); b.remove(); c.remove(); };
  }, [player, active, onReady, onNearEnd]);
  useEffect(() => {
    if (!active) return;
    player.currentTime = 0;
    player.playbackRate = pass.rate;
    if (playing) player.play();
  }, [n, active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!playing) player.pause();
    else if (active) player.play();
  }, [player, playing, active]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, transform: [{ scaleX: pass.mirror ? -1 : 1 }] }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />
    </Animated.View>
  );
}

function VideoLayers({ clips, playing, onReady }: { clips: BackdropClip[]; playing: boolean; onReady: () => void }) {
  const { layers, active, next } = usePlaylist(clips);
  const Layer = Platform.OS === 'web' ? WebLayer : NativeLayer;
  return (
    <>
      {layers.map((l, i) => (
        <Layer key={i + ':' + l.pass.clip} clip={clips[l.pass.clip]} pass={l.pass} n={l.n} active={active === i} playing={playing} onReady={onReady} onNearEnd={next} />
      ))}
    </>
  );
}

/** `only` : liste de vidéos imposée (ex. l'introduction ne montre que les galets), toujours sous le voile de jour. */
export function VideoBackdrop({ fallback, only }: { fallback?: React.ReactNode; only?: BackdropClip[] }) {
  const t = useTheme();
  const [ready, setReady] = useState(false);
  const opacity = useFadeIn(ready);
  const onReady = React.useCallback(() => setReady(true), []);
  const night = only ? false : t.isDark;
  const clips = only?.length ? only : night ? BACKDROP_CLIPS.night : BACKDROP_CLIPS.day;
  const [stillSeed] = useState(() => Math.random());
  const reduceMotion = useReduceMotion();
  const lowPower = useLowPower();
  const foreground = useForeground();
  const veil = <View style={[StyleSheet.absoluteFill, { backgroundColor: night ? VIDEO_VEIL.night : VIDEO_VEIL.day }]} testID="bg-video-veil" />;
  // Économie d'énergie ou animations réduites : image fixe (tirée parmi les fonds de l'ambiance), même voile
  if (lowPower || reduceMotion) {
    const still = clips[Math.floor(stillSeed * clips.length)] ?? clips[0];
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {fallback}
        <Image source={still.poster} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors testID="bg-video-poster" />
        {veil}
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {fallback}
      {/* tant que la vidéo charge (ou si elle ne peut pas être lue) : image du nouveau fond, jamais l'ancien ciel */}
      <Image source={(clips[Math.floor(stillSeed * clips.length)] ?? clips[0]).poster} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors testID="bg-video-poster" />
      {ready ? null : veil}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} testID={night ? 'bg-video-night' : 'bg-video-day'}>
        <VideoLayers key={night ? 'night' : 'day'} clips={clips} playing={foreground} onReady={onReady} />
        {/* Voile de lisibilité : clair et chaleureux le jour, sombre le soir */}
        {veil}
      </Animated.View>
    </View>
  );
}
