/**
 * Introduction de première ouverture « Je suis… » (20/11/2026) — modèle PUR (testé : src/__tests__/introProfiles.test.ts).
 *
 * Avant tout compte, un choix immédiat et léger du PROFIL, puis trois tableaux courts qui montrent les VRAIS outils
 * pertinents pour ce profil (rendus par les vrais composants, données de démonstration), puis « Commencer ».
 * Le choix est gardé dans un brouillon local `intro.profile` (AsyncStorage) : l'onboarding peut le relire pour
 * préremplir sa première question (`introSituations`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Situation } from '@/lib/onboarding/personalize';
import type { JourneyAnswers } from '@/lib/personalization/answers';

export type IntroProfile = 'pregnant' | 'newborn' | 'child' | 'coparent' | 'explore';
export const INTRO_PROFILES: IntroProfile[] = ['pregnant', 'newborn', 'child', 'coparent', 'explore'];

/** Scènes possibles d'un tableau (chacune = de vrais composants avec des données d'exemple). */
export type IntroScene =
  | 'pregTiles' | 'nextAction' | 'pregTools'
  | 'feedTimer' | 'babyTiles' | 'familyProfiles'
  | 'kidProfiles' | 'weekPlan' | 'kidTools'
  | 'careBook' | 'split' | 'coparentTools'
  | 'categories' | 'everyone' | 'today';

/** Trois tableaux par profil, dans l'ordre. */
export const INTRO_SCENES: Record<IntroProfile, [IntroScene, IntroScene, IntroScene]> = {
  pregnant: ['pregTiles', 'nextAction', 'pregTools'],
  newborn: ['feedTimer', 'babyTiles', 'familyProfiles'],
  child: ['kidProfiles', 'weekPlan', 'kidTools'],
  coparent: ['careBook', 'split', 'coparentTools'],
  explore: ['categories', 'everyone', 'today'],
};

/** Pages de l'introduction : « Je suis… », trois tableaux, « Commencer ». */
export const INTRO_PAGES = 5;
export const LAST_PAGE = INTRO_PAGES - 1;
export function clampPage(n: number): number {
  'worklet';
  return Math.max(0, Math.min(LAST_PAGE, Math.round(Number.isFinite(n) ? n : 0)));
}

/**
 * Geste horizontal relâché → page visée (seuil : le tiers de la largeur, ou un lancer > 500 px/s). Sans profil
 * choisi, on ne passe pas au-delà de « Je suis… » par le geste (il faut choisir, ou « Passer »).
 */
export function swipeTarget(o: { page: number; dx: number; vx: number; width: number; rtl: boolean; hasProfile: boolean }): number {
  'worklet';
  const d = o.rtl ? -o.dx : o.dx;
  const v = o.rtl ? -o.vx : o.vx;
  let next = o.page;
  if (d < -o.width / 3 || v < -500) next = o.page + 1;
  else if (d > o.width / 3 || v > 500) next = o.page - 1;
  if (!o.hasProfile && o.page === 0 && next > 0) return 0;
  return clampPage(next);
}

/** Situations de la première question de l'onboarding (`SituationStep`) préremplies par le profil choisi. */
export function introSituations(p: IntroProfile | null): Situation[] {
  switch (p) {
    case 'pregnant': return ['pregnant'];
    case 'newborn': return ['baby'];
    case 'child': return ['kids'];
    case 'coparent': return ['kids'];
    default: return [];
  }
}

/** Onboarding en 6 étapes : le profil choisi dans l'intro préremplit l'étape 1 (et le quotidien pour un coparent). */
export function introJourneyAnswers(p: IntroProfile | null): Pick<JourneyAnswers, 'profile' | 'household'> {
  switch (p) {
    case 'pregnant': return { profile: ['pregnant'], household: null };
    case 'newborn': return { profile: ['new_baby'], household: null };
    case 'child': return { profile: ['kids'], household: null };
    case 'coparent': return { profile: ['kids'], household: 'separated' };
    case 'explore': return { profile: ['discover'], household: null };
    default: return { profile: [], household: null };
  }
}

// ------------------------------------------------------------------ brouillon local « intro.profile »
export const INTRO_PROFILE_KEY = 'intro.profile';
export const isIntroProfile = (v: unknown): v is IntroProfile => typeof v === 'string' && (INTRO_PROFILES as string[]).includes(v);

export async function saveIntroProfile(p: IntroProfile): Promise<void> {
  try { await AsyncStorage.setItem(INTRO_PROFILE_KEY, JSON.stringify({ profile: p, savedAt: new Date().toISOString() })); } catch { /* meilleur effort */ }
}
export async function loadIntroProfile(): Promise<IntroProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(INTRO_PROFILE_KEY);
    const v = raw ? (JSON.parse(raw) as { profile?: unknown }).profile : null;
    return isIntroProfile(v) ? v : null;
  } catch { return null; }
}
export async function clearIntroProfile(): Promise<void> {
  try { await AsyncStorage.removeItem(INTRO_PROFILE_KEY); } catch { /* rien */ }
}
