/**
 * Introduction cinématique : chronologie unique, partagée par la vidéo de fond
 * (scripts/build-intro-video.sh : mêmes durées de séquences et de transitions) et par les animations
 * de l'application (textes, fil doré, logo). Tout est exprimé en secondes depuis le début de la vidéo.
 */
import type { TKey } from '@/i18n';

/** Durée des transitions entre séquences (fondus, ouvertures) dans la vidéo. */
export const CINE_TRANSITION_S = 0.6;
/** Durées des 9 séquences, dans l'ordre de scripts/build-intro-video.sh. */
export const CINE_SEGMENTS_S = [3.4, 3.0, 3.0, 2.8, 2.8, 2.8, 2.4, 2.8, 4.6] as const;

/** Début de chaque séquence dans la vidéo montée (les transitions se chevauchent). */
export function segmentStarts(durations: readonly number[] = CINE_SEGMENTS_S, x = CINE_TRANSITION_S): number[] {
  const out: number[] = [];
  let t = 0;
  durations.forEach((d, i) => { out.push(round(t)); if (i < durations.length - 1) t += d - x; });
  return out;
}
const round = (n: number) => Math.round(n * 1000) / 1000;

const STARTS = segmentStarts();
/** Durée totale de la vidéo (22,8 s). */
export const CINE_DURATION_S = round(STARTS[STARTS.length - 1] + CINE_SEGMENTS_S[CINE_SEGMENTS_S.length - 1]);

export interface CineWindow { start: number; end: number }
export interface CineChapter extends CineWindow { n: number; title: TKey; feature: TKey }

/** Phrase d'ouverture, sur la première séquence (ciel et lumière). */
export const CINE_OPENING: CineWindow = { start: 0.5, end: round(STARTS[1] + 0.15) };

const CHAPTER_KEYS: [TKey, TKey][] = [
  ['cine.ch1.title', 'cine.ch1.feature'],
  ['cine.ch2.title', 'cine.ch2.feature'],
  ['cine.ch3.title', 'cine.ch3.feature'],
  ['cine.ch4.title', 'cine.ch4.feature'],
  ['cine.ch5.title', 'cine.ch5.feature'],
  ['cine.ch6.title', 'cine.ch6.feature'],
  ['cine.ch7.title', 'cine.ch7.feature'],
];

/** Les 7 étapes de vie (séquences 2 à 8) : chaque texte entre après la transition et sort pendant la suivante. */
export const CINE_CHAPTERS: CineChapter[] = CHAPTER_KEYS.map(([title, feature], i) => ({
  n: i + 1,
  title,
  feature,
  start: round(STARTS[i + 1] + CINE_TRANSITION_S * 0.5),
  end: round(STARTS[i + 2] + CINE_TRANSITION_S * 0.5),
}));

/** Apparition du logo, sur la dernière séquence (nuages et fil doré). */
export const CINE_LOGO: CineWindow = { start: round(STARTS[8] + 0.3), end: CINE_DURATION_S };

/** Étape affichée à l'instant t (null en ouverture et pendant le logo). */
export function chapterAt(t: number): CineChapter | null {
  return CINE_CHAPTERS.find((c) => t >= c.start && t < c.end) ?? null;
}

/**
 * Courbe d'entrée / sortie d'un élément sur sa fenêtre, prête pour Animated.interpolate :
 * 0 avant, 1 une fois entré, 0 après la sortie (fondus de `fadeIn` et `fadeOut` secondes).
 */
export function windowCurve(w: CineWindow, fadeIn = 0.45, fadeOut = 0.35, delay = 0): { inputRange: number[]; outputRange: number[] } {
  const a = round(w.start + delay);
  const b = round(Math.min(a + fadeIn, w.end - fadeOut - 0.001));
  const c = round(Math.max(b + 0.001, w.end - fadeOut));
  const d = round(Math.max(c + 0.001, w.end));
  return { inputRange: [-1, a, b, c, d, CINE_DURATION_S + 10], outputRange: [0, 0, 1, 1, 0, 0] };
}

/**
 * Version de la vidéo : 4K (2160×3840) sur iPhone et sur les Android à grand écran (≥ 2560 pixels de haut),
 * 1080×1920 ailleurs (Android d'entrée de gamme, web) : même montage, décodage plus léger.
 */
export function introVideoQuality(platform: string, longSidePx: number): '4k' | '1080p' {
  if (platform === 'ios') return '4k';
  if (platform === 'android' && longSidePx >= 2560) return '4k';
  return '1080p';
}
