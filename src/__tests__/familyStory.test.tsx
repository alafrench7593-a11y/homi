/**
 * « Au fil de nous » : étape selon le profil affiché (cycle, grossesse, âge de l'enfant, jumeaux, famille), poses
 * et poses intermédiaires, dessin sans valeur invalide, présentation, version fixe (animations réduites).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/story', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), Redirect: () => null };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import {
  bellyForWeek, DAY_PALETTE, drawPose, elbow, kidHeight, kidSkeleton, lerpPose, NIGHT_PALETTE, poseFor, poseSvg, sceneFor, SHOULDER,
  STORY_CHAPTERS, storyA11y, storyCaption, storyPoseAt, WOMAN_ALONE,
} from '@/lib/domain/familyStory';
import { addDays, todayISO } from '@/lib/domain/dates';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { FamilyStoryArt } from '@/features/story/FamilyStoryArt';
import Story from '@/app/story';

const TODAY = '2026-10-26';
const born = (days: number) => addDays(TODAY, -days);
const due = (weeksSA: number) => addDays(TODAY, (40 - weeksSA) * 7); // terme à 41 SA en France : marge d'une semaine
const kid = (id: string, days: number, group: string | null = null) => ({ id, birth_date: born(days), multiple_group: group });

describe('étape selon le profil affiché', () => {
  it('cycle, désir d’enfant, contraception, aucun parcours : une femme seule', () => {
    for (const scope of ['cycle', 'ttc', 'avoid', 'none']) expect(sceneFor({ scope, today: TODAY })).toEqual(WOMAN_ALONE);
  });
  it('grossesse : le ventre s’arrondit avec les semaines ; un peu plus pour des jumeaux', () => {
    const at = (w: number, m: 'single' | 'twins' = 'single') => sceneFor({ scope: 'pregnancy', pregnancy: { due_date: due(w), multiplicity: m }, today: TODAY }).belly;
    expect(at(8)).toBe(0);
    expect(at(20)).toBeGreaterThan(at(14));
    expect(at(32)).toBeGreaterThan(at(20));
    expect(at(39)).toBeGreaterThan(0.95);
    expect(at(30, 'twins')).toBeGreaterThan(at(30));
    expect(sceneFor({ scope: 'pregnancy', pregnancy: { due_date: due(30), multiplicity: 'single' }, today: TODAY }).kids).toEqual([]);
  });
  it('bébé ou enfant : SON âge à lui, sans les frères et sœurs ; ses jumeaux s’il en a', () => {
    const lina = kid('lina', 245); const noe = kid('noe', 365 * 4);
    const s = sceneFor({ scope: 'baby', child: lina, children: [lina, noe], today: TODAY });
    expect(s.kids).toHaveLength(1);
    expect(s.kids[0].ageYears).toBeCloseTo(245 / 365.25, 2);
    const a = kid('a', 100, 'g1'); const b = kid('b', 100, 'g1');
    expect(sceneFor({ scope: 'baby', child: a, children: [a, b, noe], today: TODAY }).kids.map((k) => k.id)).toEqual(['a', 'b']);
    // au-delà de 10 ans : on garde l'étape des dix ans
    expect(sceneFor({ scope: 'child', child: kid('grand', 365 * 13), today: TODAY }).kids[0].ageYears).toBe(10);
  });
  it('famille : toute la famille renseignée, le plus jeune près de sa mère, trois enfants au plus ; grossesse en cours', () => {
    const list = [kid('c', 365 * 8), kid('a', 60), kid('b', 365 * 4), kid('d', 365 * 9)];
    const s = sceneFor({ scope: 'family', children: list, pregnancy: { due_date: due(30), multiplicity: 'single' }, today: TODAY });
    expect(s.kids.map((k) => k.id)).toEqual(['a', 'b', 'c']);
    expect(s.belly).toBeGreaterThan(0.5);
  });
  it('légendes et descriptions accessibles', () => {
    expect(storyCaption({ scope: 'cycle' })).toBe('Votre histoire, à votre rythme');
    expect(storyCaption({ scope: 'pregnancy', weeksLabel: '24 SA' })).toBe('Le ventre s’arrondit · 24 SA');
    expect(storyCaption({ scope: 'baby', child: kid('a', 10), childName: 'Lina', twinNames: ['Noé'], childAgeLabel: '10 jours' })).toBe('Lina et Noé, 10 jours');
    expect(storyA11y(WOMAN_ALONE)).toMatch(/femme seule/);
    expect(storyA11y({ belly: 0, multiple: false, kids: [{ id: 'a', ageYears: 0.05 }, { id: 'b', ageYears: 0.05 }] })).toMatch(/deux nouveau-nés/);
  });
});

describe('poses', () => {
  it('nouveau-né dans les bras, bébé assis, premiers pas main dans la main, dix ans main dans la main', () => {
    const nb = poseFor({ belly: 0, multiple: false, kids: [{ id: 'k', ageYears: 0.04 }] });
    expect(nb.kids[0].bundle).toBe(1);
    const sit = poseFor({ belly: 0, multiple: false, kids: [{ id: 'k', ageYears: 0.7 }] });
    expect(sit.kids[0].sit).toBe(1);
    expect(sit.kids[0].backHand).toBeNull();
    for (const age of [1.15, 3, 6, 10]) {
      const p = poseFor({ belly: 0, multiple: false, kids: [{ id: 'k', ageYears: age }] });
      const k = p.kids[0];
      expect(k.sit).toBe(0);
      expect(k.backHand).toEqual(p.hand); // la main de l'enfant est dans celle de sa mère
      const s = kidSkeleton(k);
      expect(Math.hypot(p.hand[0] - s.shoulder[0], p.hand[1] - s.shoulder[1])).toBeLessThanOrEqual(s.arm + 0.01);
      expect(Math.hypot(p.hand[0] - SHOULDER[0], p.hand[1] - SHOULDER[1])).toBeLessThanOrEqual(55);
    }
  });
  it('l’enfant grandit (taille croissante jusqu’à dix ans), la tête devient proportionnellement plus petite', () => {
    let prev = 0;
    for (let a = 0; a <= 10; a += 0.5) { expect(kidHeight(a)).toBeGreaterThan(prev); prev = kidHeight(a); }
    expect(kidHeight(10) / kidHeight(0)).toBeGreaterThan(2.5);
  });
  it('jumeaux : deux bébés dans les bras ; fratrie debout : les mains se donnent de proche en proche', () => {
    const twins = poseFor({ belly: 0, multiple: false, kids: [{ id: 'a', ageYears: 0.05 }, { id: 'b', ageYears: 0.05 }] });
    expect(twins.kids.map((k) => k.bundle)).toEqual([1, 1]);
    const sib = poseFor({ belly: 0, multiple: false, kids: [{ id: 'a', ageYears: 3 }, { id: 'b', ageYears: 7 }] });
    expect(sib.kids[0].frontHand).toEqual(sib.kids[1].backHand);
    expect(sib.kids[1].x).toBeGreaterThan(sib.kids[0].x + 10);
  });
  it('transitions douces : poses intermédiaires continues, un enfant qui apparaît arrive en fondu', () => {
    for (let p = 0; p < STORY_CHAPTERS.length - 1.01; p += 0.05) {
      const a = storyPoseAt(p); const b = storyPoseAt(p + 0.05);
      expect(Math.hypot(a.hand[0] - b.hand[0], a.hand[1] - b.hand[1])).toBeLessThan(6);
      expect(Math.abs(a.belly - b.belly)).toBeLessThan(0.2);
    }
    expect(storyPoseAt(0)).toEqual(poseFor(STORY_CHAPTERS[0].scene));
    expect(storyPoseAt(STORY_CHAPTERS.length - 1).hand).toEqual(poseFor(STORY_CHAPTERS[STORY_CHAPTERS.length - 1].scene).hand);
    const mid = lerpPose(poseFor(WOMAN_ALONE), poseFor({ belly: 0, multiple: false, kids: [{ id: 'k', ageYears: 3 }] }), 0.5);
    expect(mid.kids[0].opacity).toBeCloseTo(0.5);
  });
  it('dessin : aucune valeur invalide, de jour comme de nuit, à toutes les étapes', () => {
    for (let p = 0; p <= STORY_CHAPTERS.length - 1; p += 0.25) {
      for (const pal of [DAY_PALETTE, NIGHT_PALETTE]) {
        const svg = poseSvg(storyPoseAt(p), pal);
        expect(svg).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
    expect(drawPose(poseFor(WOMAN_ALONE), DAY_PALETTE).length).toBeGreaterThan(10);
    const e = elbow([0, 0], [100, 0], 10, 10);
    expect(Math.hypot(e.h[0], e.h[1])).toBeLessThanOrEqual(20); // main hors de portée : bras tendu, jamais allongé
  });
  it('traits brun chaud le jour, tons bleu nuit et prune la nuit', () => {
    expect(DAY_PALETTE.line).toBe('#7A5546');
    expect(poseSvg(poseFor(WOMAN_ALONE), NIGHT_PALETTE)).toContain(NIGHT_PALETTE.dress);
  });
});

describe('affichage', () => {
  const flush = async (ms = 50) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
  const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
  it('illustration annoncée aux lecteurs d’écran ; version fixe quand les animations sont réduites', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<ThemeProvider><FamilyStoryArt scene={WOMAN_ALONE} label="Illustration : une femme seule, sereine." testID="art" /></ThemeProvider>); });
    await flush();
    const art = r.root.findAll((n) => n.props.testID === 'art' && n.props.accessibilityLabel)[0];
    expect(art.props.accessibilityLabel).toBe('Illustration : une femme seule, sereine.');
    r.unmount();
    // présentation : avec animations réduites, chaque chapitre a sa propre image fixe
    await act(async () => { r = create(<ThemeProvider><Story /></ThemeProvider>); });
    await flush();
    expect(has(r, 'story-art')).toBe(false);
    for (const c of STORY_CHAPTERS) expect(has(r, `story-ch-${c.key}`)).toBe(true);
    expect(r.root.findAll((n) => n.props.accessibilityRole === 'image').length).toBeGreaterThanOrEqual(STORY_CHAPTERS.length);
    r.unmount();
  });
  it('présentation animée : l’illustration suit le défilement', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<ThemeProvider><Story /></ThemeProvider>); });
    await flush();
    expect(has(r, 'story-art')).toBe(true);
    const label = () => r.root.findAll((n) => n.props.accessibilityRole === 'image' && typeof n.props.accessibilityLabel === 'string')[0].props.accessibilityLabel;
    expect(label()).toMatch(/femme seule/);
    const scroll = r.root.findAll((n) => n.props.testID === 'story-scroll' && typeof n.props.onScroll === 'function')[0];
    await act(async () => { scroll.props.onScroll({ nativeEvent: { contentOffset: { y: 10_000 } } }); });
    await flush();
    expect(label()).toMatch(/main dans la main/);
    r.unmount();
  });
});

it('date du jour utilisée par défaut', () => {
  expect(sceneFor({ scope: 'baby', child: { id: 'x', birth_date: todayISO(), multiple_group: null } }).kids[0].ageYears).toBe(0);
});

describe('personnages générés de « Notre histoire »', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chapterIndexForScene, STORY_CHAPTERS } = require('@/lib/domain/familyStory');
  it('chaque chapitre retrouve sa propre image', () => {
    STORY_CHAPTERS.forEach((c: { scene: unknown }, i: number) => expect(chapterIndexForScene(c.scene)).toBe(i));
  });
  it('jumeaux ou fratrie déjà nés : le dessin animé reste utilisé ; grossesse multiple : image de grossesse', () => {
    expect(chapterIndexForScene({ belly: 0.6, multiple: true, kids: [] })).toBe(2);
    expect(chapterIndexForScene({ belly: 0, multiple: false, kids: [{ id: 'a', ageYears: 2 }, { id: 'b', ageYears: 2 }] })).toBeNull();
  });
});
