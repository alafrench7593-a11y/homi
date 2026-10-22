/**
 * Fond vidéo en boucle (muet, plein écran, « cover »), derrière toutes les pages.
 * La vidéo est lue en streaming depuis son URL ; tant qu'elle n'est pas prête
 * (ou si le réseau manque), le fond aurore reste affiché dessous.
 * Un voile teinté par le thème garde le texte lisible de jour comme de nuit.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';

/** Mode économie d'énergie (iPhone : « Mode économie d'énergie », Android : économiseur de batterie). */
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove: () => void } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Battery = require('expo-battery') as typeof import('expo-battery');
      Battery.isLowPowerModeEnabledAsync().then(setLow).catch(() => undefined);
      sub = Battery.addLowPowerModeListener(({ lowPowerMode }) => setLow(lowPowerMode));
    } catch { /* module absent (Expo Go ancien) : vidéo conservée */ }
    return () => sub?.remove();
  }, []);
  return low;
}

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

export const BACKGROUND_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260717_120352_eb988725-1351-43b3-8095-16e4a1005e3d.mp4';

function useFadeIn(ready: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (ready) Animated.timing(opacity, { toValue: 1, duration: 1000, delay: 200, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [ready, opacity]);
  return opacity;
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
    src: BACKGROUND_VIDEO_URL,
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
  const player = useVideoPlayer(BACKGROUND_VIDEO_URL, (p) => {
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
  // Économie d'énergie ou animations réduites : pas de vidéo, l'aurore reste en fond
  if (lowPower || reduceMotion) return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{fallback}</View>;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {fallback}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        {Platform.OS === 'web' ? <WebVideo onReady={onReady} playing={foreground} /> : <NativeVideo onReady={onReady} playing={foreground} />}
        {/* Voile de lisibilité : clair et chaleureux le jour, sombre le soir */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: night ? 'rgba(20,13,28,0.38)' : 'rgba(255,240,236,0.42)' }]} />
      </Animated.View>
    </View>
  );
}
