/**
 * Introduction « Je suis… » (src/features/intro), pictogrammes HOMI (src/brand/icons) et main de la visite guidée :
 *  - modèle pur : 5 profils × 3 tableaux, geste (seuil, lancer, sans profil, bords, RTL), préremplissage de
 *    l'onboarding, brouillon local `intro.profile` ;
 *  - rendu : « Je suis… » propose les 5 profils ; choisir un profil enregistre le brouillon et montre son premier
 *    tableau avec de vrais composants ; « Passer » mène à « Commencer » ; chaque scène se rend sans appel serveur ;
 *  - textes présents dans les 5 langues ; pictogrammes : grille 24, trait 1,75 arrondi, aucune couleur en dur ;
 *  - numéros d'aide selon le pays (plus de 3114 écrit en dur).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
// les tuiles de données sont des sources de transition de carte (écran affiché ?) : hors navigation dans ce test
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), navigate: jest.fn(), canGoBack: () => false }, useLocalSearchParams: () => ({}), usePathname: () => '/intro', useIsFocused: () => true, useFocusEffect: () => undefined, Link: () => null, Stack: { Screen: () => null } }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: null, ready: true }), useUserId: () => null }));
const mockBackendCalls: string[] = [];
jest.mock('@/lib/backend', () => {
  const rec = (name: string): object => new Proxy(() => undefined, {
    get: (_t, p) => (p === 'then' ? undefined : rec(`${name}.${String(p)}`)),
    apply: () => { mockBackendCalls.push(name); return rec(`${name}()`); },
  });
  // fonctions de requête réelles (eq, inList…), serveur et démonstration du foyer enregistrés
  return { ...jest.requireActual('@/lib/backend'), backend: rec('backend'), isDemo: false, supabase: rec('supabase') };
});

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale } from '@/i18n';
import { useUiStore } from '@/lib/store';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { IntroFlow } from '@/features/intro/IntroFlow';
import { IntroLayerContext, SceneView } from '@/features/intro/IntroScenes';
import {
  clampPage, INTRO_PROFILE_KEY, INTRO_PROFILES, INTRO_SCENES, introSituations, LAST_PAGE, loadIntroProfile, saveIntroProfile, swipeTarget, type IntroScene,
} from '@/features/intro/model';
import { HOMI_ICONS, HOMI_ICON_NAMES, HomiIcon, ICON_GROUPS } from '@/brand/icons';
import { HAND_PATH, HandGlyph } from '@/features/tour/TourHand';
import { crisisLine, emergencySummary } from '@/lib/domain/emergencyNumbers';

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  await act(async () => { r = create(<GestureHandlerRootView><QueryClientProvider client={qc}><ThemeProvider>{el}</ThemeProvider></QueryClientProvider></GestureHandlerRootView>); });
  mounted.push(r);
  return r;
}
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];

beforeAll(() => setLocale('fr'));
beforeEach(() => {
  jest.useFakeTimers();
  mockBackendCalls.length = 0;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: false }); });
});
afterEach(() => {
  act(() => { mounted.splice(0).forEach((r) => r.unmount()); });
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('modèle de l’introduction', () => {
  it('5 profils, 3 tableaux chacun, tous différents par profil', () => {
    expect(INTRO_PROFILES).toEqual(['pregnant', 'newborn', 'child', 'coparent', 'explore']);
    for (const p of INTRO_PROFILES) {
      expect(INTRO_SCENES[p]).toHaveLength(3);
      expect(new Set(INTRO_SCENES[p]).size).toBe(3);
    }
  });
  it('geste : un tiers de la largeur ou un lancer ; sans profil on reste sur « Je suis… » ; bornes ; RTL', () => {
    const base = { width: 390, rtl: false, hasProfile: true };
    expect(swipeTarget({ ...base, page: 1, dx: -140, vx: 0 })).toBe(2);
    expect(swipeTarget({ ...base, page: 1, dx: -60, vx: 0 })).toBe(1);
    expect(swipeTarget({ ...base, page: 1, dx: -20, vx: -900 })).toBe(2);
    expect(swipeTarget({ ...base, page: 2, dx: 160, vx: 0 })).toBe(1);
    expect(swipeTarget({ ...base, page: LAST_PAGE, dx: -300, vx: 0 })).toBe(LAST_PAGE);
    expect(swipeTarget({ ...base, page: 0, dx: 300, vx: 0 })).toBe(0);
    expect(swipeTarget({ ...base, page: 0, dx: -300, vx: 0, hasProfile: false })).toBe(0);
    expect(swipeTarget({ ...base, page: 1, dx: 140, vx: 0, rtl: true })).toBe(2);
    expect(clampPage(Number.NaN)).toBe(0);
    expect(clampPage(9)).toBe(LAST_PAGE);
  });
  it('préremplit la première question de l’onboarding', () => {
    expect(introSituations('pregnant')).toEqual(['pregnant']);
    expect(introSituations('newborn')).toEqual(['baby']);
    expect(introSituations('child')).toEqual(['kids']);
    expect(introSituations('explore')).toEqual([]);
    expect(introSituations(null)).toEqual([]);
  });
  it('brouillon local « intro.profile » : écrit, relu, valeur inconnue ignorée', async () => {
    await saveIntroProfile('coparent');
    expect(JSON.parse((await AsyncStorage.getItem(INTRO_PROFILE_KEY))!).profile).toBe('coparent');
    expect(await loadIntroProfile()).toBe('coparent');
    await AsyncStorage.setItem(INTRO_PROFILE_KEY, JSON.stringify({ profile: 'pirate' }));
    expect(await loadIntroProfile()).toBeNull();
  });
});

describe('textes (5 langues)', () => {
  it('chaque clé de l’introduction existe dans chaque langue et n’est pas vide', () => {
    const keys = Object.keys(DICTIONARIES.fr!).filter((k) => k.startsWith('intro6.') || k.startsWith('sc6.'));
    expect(keys.length).toBeGreaterThan(40);
    for (const l of Object.keys(DICTIONARIES)) for (const k of keys) expect(String(DICTIONARIES[l]![k] ?? '').trim().length).toBeGreaterThan(0);
    for (const p of INTRO_PROFILES) for (const s of INTRO_SCENES[p]) expect(DICTIONARIES.fr![`intro6.s.${s}`]).toBeTruthy();
  });
});

describe('rendu', () => {
  it('« Je suis… » : 5 profils ; choisir enregistre le brouillon et montre le premier tableau (vrais composants)', async () => {
    const onProfile = jest.fn();
    const r = await render(<IntroFlow onProfile={onProfile} onLeave={jest.fn()} onLanguage={jest.fn()} />);
    for (const p of INTRO_PROFILES) expect(byTestId(r, `intro-profile-${p}`).length).toBe(1);
    await act(async () => { pressable(r, 'intro-profile-newborn').props.onPress(); });
    expect(onProfile).toHaveBeenCalledWith('newborn');
    expect(byTestId(r, 'intro-scene-feedTimer').length).toBe(1);
    expect(byTestId(r, 'intro-timer').length).toBe(1);
    expect(byTestId(r, 'intro-next').length).toBe(1);
    expect(mockBackendCalls).toEqual([]);
  });
  it('« Passer » mène à « Commencer », « J’ai déjà un compte », « Découvrir sans compte »', async () => {
    const onLeave = jest.fn();
    const r = await render(<IntroFlow onProfile={jest.fn()} onLeave={onLeave} onLanguage={jest.fn()} />);
    await act(async () => { pressable(r, 'intro-skip').props.onPress(); });
    expect(byTestId(r, 'intro-scene-start').length).toBe(1);
    await act(async () => { pressable(r, 'intro-start').props.onPress(); });
    expect(onLeave).toHaveBeenCalledWith('sign-up');
    expect(byTestId(r, 'intro-sign-in').length + byTestId(r, 'intro-demo').length).toBe(2);
  });
  it('chaque scène se rend, sans aucun appel au serveur', async () => {
    const all = [...new Set(INTRO_PROFILES.flatMap((p) => INTRO_SCENES[p]))] as IntroScene[];
    for (const s of all) {
      const r = await render(<IntroLayerContext.Provider value={null}><SceneView scene={s} active /></IntroLayerContext.Provider>);
      expect(r.toJSON()).toBeTruthy();
    }
    expect(mockBackendCalls).toEqual([]);
  });
  it('les tableaux d’outils montrent les vraies rangées de « Mes outils » (au moins 3 outils trouvés dans le registre)', async () => {
    for (const s of ['pregTools', 'kidTools', 'coparentTools'] as IntroScene[]) {
      const r = await render(<IntroLayerContext.Provider value={null}><SceneView scene={s} active /></IntroLayerContext.Provider>);
      expect(r.root.findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string' && n.props.testID.startsWith('hub-tool-')).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('pictogrammes HOMI', () => {
  it('famille complète : barre du bas, en-tête, bouton central, 9 catégories', () => {
    const names = ICON_GROUPS.flatMap((g) => g.names);
    for (const n of ['today', 'me', 'child', 'family', 'add', 'community', 'notifications', 'emergency', 'feeding', 'sleep', 'care', 'health', 'cycle', 'pregnancy', 'school', 'couple']) expect(names).toContain(n);
    expect(ICON_GROUPS.find((g) => g.key === 'categories')!.names).toHaveLength(9);
  });
  it('grille 24, trait 1,75 arrondi, aplat sous le trait, aucune couleur écrite dans les tracés', async () => {
    for (const n of HOMI_ICON_NAMES) {
      const d = HOMI_ICONS[n] as { stroke: string; fill?: string };
      expect(d.stroke).not.toMatch(/#|rgb/);
      const nums = `${d.stroke} ${d.fill ?? ''}`.match(/-?\d*\.?\d+/g)!.map(Number);
      expect(Math.max(...nums)).toBeLessThanOrEqual(24);
      const r = await render(<HomiIcon name={n} active />);
      const strokes = r.root.findAll((x) => x.props.strokeWidth != null);
      expect(strokes[0]!.props.strokeLinecap).toBe('round');
      expect(strokes[0]!.props.strokeLinejoin).toBe('round');
      if (n !== 'add') expect(strokes[0]!.props.strokeWidth).toBe(1.75);
    }
  });
  it('la main de la visite est un tracé (aucune image)', async () => {
    expect(HAND_PATH.startsWith('M')).toBe(true);
    const r = await render(<HandGlyph size={40} />);
    expect(r.root.findAll((x) => x.props.d === HAND_PATH).length).toBeGreaterThanOrEqual(2); // ombre + main
  });
});

describe('numéros d’aide selon le pays', () => {
  it('France : 15 · 112 · 3114 et ligne d’écoute ; ailleurs : les numéros du pays, aucune ligne inventée', () => {
    expect(emergencySummary('FR')).toBe('15 · 112 · 3114');
    expect(crisisLine('FR')).toBe('3114');
    expect(emergencySummary('US')).toBe('911');
    expect(crisisLine('US')).toBeNull();
    expect(emergencySummary('GB')).toBe('999 · 112');
    expect(emergencySummary('ZZ')).toBe('112');
  });
});
