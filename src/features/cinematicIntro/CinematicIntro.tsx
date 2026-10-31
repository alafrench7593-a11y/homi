/**
 * Introduction cinématique « Au fil de nous » (première ouverture, rejouable depuis Réglages › Mon accueil).
 *
 * Une seule vidéo de fond (assets/video/intro-cinematique.mp4, montée à partir des vidéos de l'application :
 * voir scripts/build-intro-video.sh) et, par-dessus, tout le motion design en natif :
 *  - phrase d'ouverture mot à mot, 7 étapes de vie (numéro, filet doré, titre, fonctionnalité réelle),
 *  - fil doré qui se dessine à chaque étape, particules dorées en parallaxe, halo de lumière qui glisse,
 *  - apparition du logo (halo, rotation, reflet), nom lettre à lettre, puis fondu vers l'application.
 * Une seule horloge (Animated.Value en secondes) calée sur le temps réel de la vidéo pilote TOUTES les
 * animations sur le fil natif (transform / opacity uniquement) : pas de décalage, pas de saccade.
 *
 * Ne bloque jamais l'accès : « Passer » toujours visible, sortie automatique si la vidéo ne démarre pas
 * (4 s) ou en cas d'erreur, durée plafonnée. « Réduire les animations » : version fixe (logo), 3 s.
 * Pas d'écran noir : l'image d'attente (première image de la vidéo) est affichée tout de suite et la
 * vidéo n'apparaît qu'à sa première image rendue.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, PixelRatio, Platform, StyleSheet, Text as RNText, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { BrandLogo } from '@/components/BrandLogo';
import { Tappable } from '@/components/Tappable';
import { Icon } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { t as tr } from '@/i18n';
import { CINE_CHAPTERS, CINE_DURATION_S, CINE_LOGO, CINE_OPENING, type CineChapter, introVideoQuality, windowCurve } from '@/lib/domain/cinematicIntro';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { fonts, NACRE, NATIVE_DRIVER } from '@/theme/tokens';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const VIDEO_4K = require('../../../assets/video/intro-cinematique.mp4');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const VIDEO_1080 = require('../../../assets/video/intro-cinematique-1080.mp4');
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const CINEMATIC_POSTER: number = require('../../../assets/video/intro-cinematique.jpg');
const POSTER = CINEMATIC_POSTER;

const GOLD = '#E8C48E';
const CREAM = '#FFF6EE';
const PLUM = 'rgba(34,18,44,';
const D = CINE_DURATION_S;
const START_TIMEOUT_MS = 4000;
const MAX_FONT_SCALE = 1.25;

type Clock = Animated.Value;
const lin = (clock: Clock, input: number[], output: number[], easing?: (v: number) => number) =>
  clock.interpolate({ inputRange: input, outputRange: output, extrapolate: 'clamp', easing });
/** Rotation (en degrés) pilotée par l'horloge. */
const rot = (clock: Clock, input: number[], deg: number[], easing?: (v: number) => number) =>
  clock.interpolate({ inputRange: input, outputRange: deg.map((d) => `${d}deg`), extrapolate: 'clamp', easing });
const ease = Easing.bezier(0.16, 1, 0.3, 1);

// ─────────────────────────────────────────────────────────────── calques graphiques

/** Particules dorées : trois profondeurs, vitesses et tailles différentes (parallaxe). */
function GoldDust({ clock, w, h }: { clock: Clock; w: number; h: number }) {
  const dots = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const r = (k: number) => ((Math.sin(i * 97.13 + k * 13.7) + 1) / 2);
    const depth = i % 3; // 0 loin, 2 près
    return { x: r(1) * w, y: h * (0.15 + r(2) * 0.9), size: 2 + depth * 1.6 + r(3) * 1.5, rise: 60 + depth * 120 + r(4) * 80, phase: r(5) * 3, base: 0.25 + depth * 0.18 };
  }), [w, h]);
  return (
    <>
      {dots.map((p, i) => {
        // scintillement : quelques points de passage le long de la vidéo
        const pts = [0, 3, 6, 9, 12, 15, 18, 21, D].map((s) => s + p.phase).filter((s) => s <= D + 3);
        const tw = pts.map((_, k) => (k % 2 ? p.base : p.base * 0.35));
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: p.x, top: p.y, width: p.size, height: p.size, borderRadius: p.size, backgroundColor: GOLD,
            shadowColor: GOLD, shadowOpacity: 0.9, shadowRadius: 4,
            opacity: lin(clock, pts, tw),
            transform: [{ translateY: lin(clock, [0, D], [0, -p.rise]) }, { translateX: lin(clock, [0, D / 2, D], [0, (i % 2 ? 10 : -10), 0]) }],
          }} />
        );
      })}
    </>
  );
}

/** Halo de lumière chaude qui traverse l'écran lentement (superposition « light leak »). */
function LightLeak({ clock, w, h }: { clock: Clock; w: number; h: number }) {
  const size = Math.max(w, h) * 0.9;
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, top: h * 0.05, left: -size / 2,
      opacity: lin(clock, [0, 1.2, D * 0.45, D * 0.7, D], [0, 0.22, 0.12, 0.2, 0.08]),
      transform: [{ translateX: lin(clock, [0, D], [-w * 0.1, w * 1.1]) }, { rotate: '-18deg' }, { scaleY: 0.55 }],
    }}>
      <LinearGradient colors={['rgba(255,214,165,0)', 'rgba(255,214,165,0.55)', 'rgba(255,190,200,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, borderRadius: size / 2 }} />
    </Animated.View>
  );
}

/** Fil doré qui se dessine de gauche à droite (révélation par masque glissant, sur le fil natif). */
function GoldThread({ clock, w, top, start, end, variant }: { clock: Clock; w: number; top: number; start: number; end: number; variant: number }) {
  const h = 70;
  const amp = 16 + (variant % 3) * 6;
  const k = variant % 2 ? 1 : -1;
  const d = `M -10 ${h / 2} C ${w * 0.22} ${h / 2 - amp * k}, ${w * 0.38} ${h / 2 + amp * k}, ${w * 0.55} ${h / 2} S ${w * 0.85} ${h / 2 - amp * k}, ${w + 10} ${h / 2 + 4 * k}`;
  const draw = 1.1;
  const curve = windowCurve({ start, end }, 0.25, 0.4);
  return (
    <Animated.View style={{ position: 'absolute', top, left: 0, width: w, height: h, overflow: 'hidden', opacity: lin(clock, curve.inputRange, curve.outputRange), transform: [{ translateX: lin(clock, [start, start + draw], [-w, 0], ease) }] }}>
      <Animated.View style={{ width: w, height: h, transform: [{ translateX: lin(clock, [start, start + draw], [w, 0], ease) }] }}>
        <Svg width={w} height={h}>
          <Defs>
            <SvgGradient id={`g${variant}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={GOLD} stopOpacity="0" />
              <Stop offset="0.25" stopColor={GOLD} stopOpacity="0.95" />
              <Stop offset="0.8" stopColor="#F6DDB2" stopOpacity="1" />
              <Stop offset="1" stopColor={GOLD} stopOpacity="0.2" />
            </SvgGradient>
          </Defs>
          <Path d={d} stroke={`url(#g${variant})`} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Mots qui montent un à un depuis un masque (typographie animée). */
function RisingWords({ clock, text, at, step = 0.09, style, exit }: { clock: Clock; text: string; at: number; step?: number; style: object; exit?: Animated.AnimatedInterpolation<number> }) {
  const words = text.split(' ');
  return (
    <Animated.View style={{ flexDirection: 'row', flexWrap: 'wrap', opacity: exit }}>
      {words.map((wd, i) => {
        const s = at + i * step;
        return (
          <View key={`${wd}-${i}`} style={{ overflow: 'hidden', paddingBottom: 4, marginRight: i < words.length - 1 ? 8 : 0 }}>
            <Animated.Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={[style, {
              opacity: lin(clock, [s, s + 0.35], [0, 1]),
              transform: [{ translateY: lin(clock, [s, s + 0.7], [44, 0], ease) }, { rotate: rot(clock, [s, s + 0.7], [4, 0]) }],
            }]}>{wd}</Animated.Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

/** Une étape de vie : numéro, filet doré qui s'étire, titre mot à mot, fonctionnalité réelle de l'application. */
function ChapterCard({ clock, c, bottom }: { clock: Clock; c: CineChapter; bottom: number }) {
  const curve = windowCurve(c, 0.3, 0.38);
  const out = lin(clock, curve.inputRange, curve.outputRange);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 28, right: 28, bottom, opacity: out, transform: [{ translateY: lin(clock, [c.end - 0.38, c.end], [0, -14]) }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Animated.Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 2.5, color: GOLD, opacity: lin(clock, [c.start, c.start + 0.4], [0, 1]) }}>
          {`0${c.n}`}<RNText style={{ color: 'rgba(255,246,238,0.55)' }}>{` / 0${CINE_CHAPTERS.length}`}</RNText>
        </Animated.Text>
        <Animated.View style={{ height: 1, flex: 1, marginLeft: 12, backgroundColor: GOLD, opacity: 0.8, transformOrigin: 'left', transform: [{ scaleX: lin(clock, [c.start + 0.1, c.start + 0.9], [0, 1], ease) }] }} />
      </View>
      <RisingWords clock={clock} text={tr(c.title)} at={c.start + 0.12} style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -1, color: CREAM, textShadowColor: 'rgba(30,10,30,0.35)', textShadowRadius: 12 }} />
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, opacity: lin(clock, [c.start + 0.45, c.start + 0.9], [0, 1]), transform: [{ translateX: lin(clock, [c.start + 0.45, c.start + 1.0], [-12, 0], ease) }] }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginRight: 10 }} />
        <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.bodyMedium, fontSize: 15.5, lineHeight: 21, color: 'rgba(255,246,238,0.92)', flex: 1 }}>{tr(c.feature)}</RNText>
      </Animated.View>
    </Animated.View>
  );
}

/** Logo final : halo nacré, tuile qui pivote et se pose, reflet lumineux, nom lettre à lettre, signature. */
function LogoReveal({ clock, w }: { clock: Clock; w: number }) {
  const L = CINE_LOGO.start;
  const size = Math.min(112, w * 0.28);
  const halo = size * 2.4;
  const name = BRAND.name.split('');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: lin(clock, [L, L + 1.2], [0, 1]) }]}>
        <LinearGradient colors={[`${PLUM}0)`, `${PLUM}0.28)`, `${PLUM}0.36)`, `${PLUM}0)`]} locations={[0.15, 0.4, 0.62, 0.9]} style={{ flex: 1 }} />
      </Animated.View>
      <View style={{ width: halo, height: halo, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: halo, height: halo, borderRadius: halo / 2, opacity: lin(clock, [L, L + 1.2, L + 2.6, L + 3.6, D], [0, 0.6, 0.38, 0.55, 0.45]), transform: [{ scale: lin(clock, [L, L + 1.4, L + 3, D], [0.5, 1, 1.06, 1]) }] }}>
          <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: halo / 2, opacity: 0.55 }} />
        </Animated.View>
        <Animated.View style={{ opacity: lin(clock, [L + 0.15, L + 0.7], [0, 1]), transform: [{ scale: lin(clock, [L + 0.15, L + 1.2], [0.62, 1], ease) }, { rotate: rot(clock, [L + 0.15, L + 1.2], [-14, 0], ease) }] }}>
          <View style={{ width: size, height: size, borderRadius: size * 0.23, overflow: 'hidden', shadowColor: '#7A3E55', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}>
            <BrandLogo size={size} />
            {/* reflet qui traverse la tuile */}
            <Animated.View style={{ position: 'absolute', top: -size * 0.2, bottom: -size * 0.2, width: size * 0.45, transform: [{ translateX: lin(clock, [L + 1.0, L + 1.8], [-size * 0.6, size * 1.2], ease) }, { rotate: '20deg' }] }}>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }} accessibilityLabel={BRAND.name} accessible>
        {name.map((ch, i) => {
          const s = L + 0.85 + i * 0.045;
          return (
            <Animated.Text key={i} maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.display, fontSize: 38, letterSpacing: -1.2, color: CREAM, textShadowColor: 'rgba(70,25,55,0.55)', textShadowRadius: 12, opacity: lin(clock, [s, s + 0.3], [0, 1]), transform: [{ translateY: lin(clock, [s, s + 0.55], [18, 0], ease) }] }}>
              {ch === ' ' ? ' ' : ch}
            </Animated.Text>
          );
        })}
      </View>
      {/* le fil doré se déroule sous le nom */}
      <Animated.View style={{ width: 210, height: 22, marginTop: 2, overflow: 'hidden', transform: [{ translateX: lin(clock, [L + 1.35, L + 2.3], [-210, 0], ease) }] }}>
        <Animated.View style={{ width: 210, height: 22, transform: [{ translateX: lin(clock, [L + 1.35, L + 2.3], [210, 0], ease) }] }}>
          <Svg width={210} height={22}>
            <Defs>
              <SvgGradient id="logoThread" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={GOLD} stopOpacity="0" />
                <Stop offset="0.5" stopColor="#F6DDB2" stopOpacity="1" />
                <Stop offset="1" stopColor={GOLD} stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Path d="M 4 12 C 50 2, 80 20, 105 11 S 165 3, 206 12" stroke="url(#logoThread)" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Animated.View>
      <Animated.Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.serifItalic, fontSize: 23, color: CREAM, textShadowColor: 'rgba(70,25,55,0.7)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 }, marginTop: 6, textAlign: 'center', paddingHorizontal: 32, opacity: lin(clock, [L + 1.8, L + 2.5], [0, 1]), transform: [{ translateY: lin(clock, [L + 1.8, L + 2.6], [10, 0], ease) }] }}>
        {tr('cine.logo.tagline')}
      </Animated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────── version fixe (réduire les animations)

function StillIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => { const id = setTimeout(onDone, 3000); return () => clearTimeout(id); }, [onDone]);
  return (
    <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={tr('cine.a11y')}>
      <Image source={POSTER} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `${PLUM}0.35)`, alignItems: 'center', justifyContent: 'center', gap: 14 }]}>
        <BrandLogo size={104} />
        <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.display, fontSize: 36, color: CREAM }}>{BRAND.name}</RNText>
        <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.serifItalic, fontSize: 20, color: CREAM }}>{tr('cine.logo.tagline')}</RNText>
      </View>
      <SkipButton onPress={onDone} />
    </View>
  );
}

function SkipButton({ onPress, opacity }: { onPress: () => void; opacity?: Animated.AnimatedInterpolation<number> | number }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View style={{ position: 'absolute', top: insets.top + 10, right: 16, opacity: opacity ?? 1 }}>
      <Tappable testID="cine-skip" accessibilityRole="button" accessibilityLabel={tr('cine.skipA11y')} onPress={onPress} hitSlop={8}
        style={({ pressed }) => ({ minHeight: 44, minWidth: 48, paddingHorizontal: 16, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: pressed ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.18)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.45)' })}>
        <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: CREAM }}>{tr('cine.skip')}</RNText>
        <Icon name="chevron-right" size={16} color={CREAM} />
      </Tappable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────── introduction

export function CinematicIntro({ onDone }: { onDone: () => void }) {
  const reduce = useReduceMotion();
  const finished = useRef(false);
  const done = useCallback(() => { if (finished.current) return; finished.current = true; onDone(); }, [onDone]);
  if (reduce) return <StillIntro onDone={done} />;
  return <MotionIntro onDone={done} />;
}

function MotionIntro({ onDone }: { onDone: () => void }) {
  const { width: w, height: h } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const clock = useRef(new Animated.Value(0)).current;
  const [firstFrame, setFirstFrame] = useState(false);
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const sync = useRef({ from: 0, wall: 0, running: false });
  const leaving = useRef(false);

  // 4K sur iPhone et grands écrans Android, 1080p ailleurs (choisie une fois pour toutes)
  const [source] = useState(() => (introVideoQuality(Platform.OS, Math.max(w, h) * PixelRatio.get()) === '4k' ? VIDEO_4K : VIDEO_1080));
  const player = useVideoPlayer(source, (p) => {
    p.muted = true;
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  /** (Re)lance l'horloge des animations à partir du temps réel de la vidéo. */
  const runClock = useCallback((from: number) => {
    anim.current?.stop();
    const f = Math.max(0, Math.min(D, from));
    clock.setValue(f);
    sync.current = { from: f, wall: Date.now(), running: true };
    anim.current = Animated.timing(clock, { toValue: D, duration: Math.max(1, (D - f) * 1000), easing: Easing.linear, useNativeDriver: NATIVE_DRIVER });
    anim.current.start();
  }, [clock]);
  const stopClock = useCallback(() => { anim.current?.stop(); sync.current.running = false; }, []);

  /**
   * Sortie (fin, « Passer » ou repli) : la navigation fait un fondu enchaîné de la dernière image vers
   * l'écran suivant (pas de passage par un fond uni). Jamais deux fois.
   */
  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    stopClock();
    try { player.pause(); } catch { /* lecteur déjà libéré */ }
    onDone();
  }, [onDone, player, stopClock]);

  useEffect(() => {
    const subs = [
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay') player.play();
        if (status === 'error') leave();
      }),
      player.addListener('playingChange', ({ isPlaying }) => { if (isPlaying) runClock(player.currentTime); else stopClock(); }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        const s = sync.current;
        if (!s.running) return;
        const expected = s.from + (Date.now() - s.wall) / 1000;
        if (Math.abs(expected - currentTime) > 0.18) runClock(currentTime);
      }),
      player.addListener('playToEnd', () => leave()),
    ];
    if (player.status === 'readyToPlay') player.play();
    // Ne jamais bloquer : sans démarrage rapide, on passe à l'application ; durée plafonnée de toute façon
    const startGuard = setTimeout(() => { if (!sync.current.running && !leaving.current) leave(); }, START_TIMEOUT_MS);
    const hardStop = setTimeout(() => leave(), (D + 6) * 1000);
    const app = AppState.addEventListener('change', (st) => {
      if (leaving.current) return;
      if (st === 'active') player.play(); else player.pause();
    });
    return () => { subs.forEach((s) => s.remove()); clearTimeout(startGuard); clearTimeout(hardStop); app.remove(); anim.current?.stop(); };
  }, [leave, player, runClock, stopClock]);

  const opening = windowCurve(CINE_OPENING, 0.3, 0.45);
  const openOut = lin(clock, opening.inputRange, opening.outputRange);
  const chromeIn = lin(clock, [0.4, 1.0, CINE_LOGO.start, CINE_LOGO.start + 0.6], [0, 1, 1, 0]);
  const cardBottom = insets.bottom + 54;
  const threadTop = h - cardBottom - 190;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityLabel={tr('cine.a11y')}>
      {/* image d'attente = première image de la vidéo : jamais d'écran noir */}
      <Image source={POSTER} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { opacity: firstFrame ? 1 : 0 }]}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false}
          surfaceType={Platform.OS === 'android' ? 'textureView' : undefined} onFirstFrameRender={() => setFirstFrame(true)} />
      </View>

      {/* profondeur : voiles haut et bas, halo de lumière, particules en parallaxe */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[`${PLUM}0.32)`, `${PLUM}0)`]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.22 }} />
        <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: h * 0.5, opacity: lin(clock, [0, 2.4, CINE_LOGO.start, CINE_LOGO.start + 1], [0.35, 1, 1, 0.45]) }}>
          <LinearGradient colors={[`${PLUM}0)`, `${PLUM}0.3)`, `${PLUM}0.72)`]} locations={[0, 0.5, 1]} style={{ flex: 1 }} />
        </Animated.View>
        <LightLeak clock={clock} w={w} h={h} />
        <GoldDust clock={clock} w={w} h={h} />
      </View>

      {/* ouverture : voile doux derrière la phrase (ciel très lumineux) */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: h * 0.26, height: h * 0.34, opacity: openOut }}>
        <LinearGradient colors={[`${PLUM}0)`, `${PLUM}0.34)`, `${PLUM}0.34)`, `${PLUM}0)`]} locations={[0, 0.35, 0.65, 1]} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 32, right: 32, top: h * 0.36, opacity: openOut, transform: [{ scale: lin(clock, [0, CINE_OPENING.end], [1, 1.04]) }] }}>
        <RisingWords clock={clock} text={tr('cine.open.l1')} at={CINE_OPENING.start} style={{ fontFamily: fonts.displayMedium, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: CREAM, textShadowColor: 'rgba(70,25,55,0.6)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } }} />
        <RisingWords clock={clock} text={tr('cine.open.l2')} at={CINE_OPENING.start + 0.45} style={{ fontFamily: fonts.serifItalic, fontSize: 40, lineHeight: 46, color: '#F9E3C0', textShadowColor: 'rgba(70,25,55,0.75)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } }} />
      </Animated.View>

      {/* étapes de vie : fil doré + carte */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {CINE_CHAPTERS.map((c, i) => <GoldThread key={`t${c.n}`} clock={clock} w={w} top={threadTop} start={c.start} end={c.end} variant={i} />)}
        {CINE_CHAPTERS.map((c) => <ChapterCard key={c.n} clock={clock} c={c} bottom={cardBottom} />)}
      </View>

      {/* progression des étapes */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 26, flexDirection: 'row', gap: 6, opacity: chromeIn }}>
        {CINE_CHAPTERS.map((c) => (
          <View key={c.n} style={{ flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,246,238,0.25)', overflow: 'hidden' }}>
            <Animated.View style={{ flex: 1, backgroundColor: GOLD, transformOrigin: 'left', transform: [{ scaleX: lin(clock, [c.start, c.end], [0, 1]) }] }} />
          </View>
        ))}
      </Animated.View>

      <LogoReveal clock={clock} w={w} />

      <SkipButton onPress={leave} />
    </View>
  );
}
