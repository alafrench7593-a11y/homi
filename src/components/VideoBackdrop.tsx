/**
 * Fond vidéo en boucle (muet, plein écran, « cover »), derrière toutes les pages.
 * La vidéo est lue en streaming depuis son URL ; tant qu'elle n'est pas prête
 * (ou si le réseau manque), le fond rose poudré (ou bleu nuit) reste affiché dessous.
 * Un voile teinté par le thème garde le texte lisible de jour comme de nuit.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Image, Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';

import { useLowPower } from '@/lib/lowPower';
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
 * Vidéo de fond « Au fil de nous » (ciel rose et crème, galets flottants, bulles, plume, bateau en papier), générée
 * pour l'application le 26/10/2026 (ElevenLabs, Seedance 2.5) puis mise en boucle sans raccord visible (fondu enchaîné
 * fin → début), sans son. Fournie avec l'application : aucune dépendance à un lien externe.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const BACKGROUND_VIDEO: number = require('../../assets/video/fond-ciel.mp4');
/** Première image de la vidéo : affichée pendant le chargement et quand les animations sont réduites. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const BACKGROUND_POSTER: number = require('../../assets/video/fond-ciel.jpg');
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

function WebVideo({ onReady, playing }: { onReady: () => void; playing: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play?.().catch(() => undefined);
    else v.pause?.();
  }, [playing]);
  // Élément HTML natif : autoplay muet + playsInline.
  return React.createElement('video', {
    ref,
    src: webAssetUri(BACKGROUND_VIDEO),
    poster: webAssetUri(BACKGROUND_POSTER),
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: 'auto',
    'aria-hidden': true,
    onCanPlay: onReady,
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  });
}

function NativeVideo({ onReady, playing }: { onReady: () => void; playing: boolean }) {
  const player = useVideoPlayer(BACKGROUND_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => { if (status === 'readyToPlay') onReady(); });
    return () => sub.remove();
  }, [player, onReady]);
  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} />;
}

export function VideoBackdrop({ fallback }: { fallback?: React.ReactNode }) {
  const t = useTheme();
  const [ready, setReady] = useState(false);
  const opacity = useFadeIn(ready);
  const onReady = React.useCallback(() => setReady(true), []);
  const night = t.isDark;
  const reduceMotion = useReduceMotion();
  const lowPower = useLowPower();
  const foreground = useForeground();
  const veil = <View style={[StyleSheet.absoluteFill, { backgroundColor: night ? VIDEO_VEIL.night : VIDEO_VEIL.day }]} testID="bg-video-veil" />;
  // Économie d'énergie ou animations réduites : version fixe (première image de la vidéo, même voile)
  if (lowPower || reduceMotion) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {fallback}
        <Image source={BACKGROUND_POSTER} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors testID="bg-video-poster" />
        {veil}
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {fallback}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        {Platform.OS === 'web' ? <WebVideo onReady={onReady} playing={foreground} /> : <NativeVideo onReady={onReady} playing={foreground} />}
        {/* Voile de lisibilité : clair et chaleureux le jour, sombre le soir */}
        {veil}
      </Animated.View>
    </View>
  );
}
