/**
 * Visite guidée (src/features/tour) — moteur : enchaînement des 7 étapes, conditions d'avancée (événements réels),
 * persistance par compte et reprise, ancre absente (bulle centrée), pas de proposition à une nounou ni pendant une
 * urgence, aides contextuelles ; mode exercice : AUCUNE écriture ne part (base de démonstration, file hors connexion).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn(), push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));

import { backend, eq } from '@/lib/backend';
import { insertOrQueue, rpcOrQueue, useOfflineStore } from '@/lib/offline';
import { beginPractice, clearPracticeWrites, isPracticeActive, practiceWrites } from '@/lib/practice';
import {
  bubblePlacement, canOfferTour, freshProgress, holeFor, matchPath, overlayActive, rectVisible, shouldHint, showResumeCard, stepAnchors, stepOnScreen,
  TOUR_LENGTH, TOUR_STEPS, tourReducer, unionRect, type TourAction, type TourEvent, type TourProgress,
} from '@/features/tour/model';
import { startTour, tourEvent, useTourStore } from '@/features/tour/store';

const run = (actions: TourAction[], from: TourProgress = freshProgress()) => actions.reduce(tourReducer, from);
const ev = (event: TourEvent): TourAction => ({ type: 'event', event });

describe('moteur de la visite', () => {
  it('sept étapes, chacune sur un écran réel avec une ancre', () => {
    expect(TOUR_STEPS.map((s) => s.id)).toEqual(['home', 'profile', 'tools', 'quick', 'favorite', 'agenda', 'customize']);
    for (const s of TOUR_STEPS) {
      expect(stepOnScreen(s, s.goTo) || s.goTo.startsWith('/tools/')).toBe(true);
      expect(Object.values(s.anchors).flat().length).toBeGreaterThan(0);
    }
    expect(stepAnchors(TOUR_STEPS[2], '/tools')).toEqual(['tools-search', 'tools-results']);
    expect(stepAnchors(TOUR_STEPS[2], '/')).toEqual(['tools-entry']);
    expect(stepAnchors(TOUR_STEPS[4], '/tools/family')).toEqual(['tool-star']);
    expect(matchPath('/tools/*', '/tools')).toBe(false);
    expect(matchPath('/tools/*', '/tools/sleep')).toBe(true);
  });

  it('enchaînement complet par les VRAIS événements (et pas par d’autres)', () => {
    let p = run([{ type: 'start' }]);
    expect(p).toMatchObject({ status: 'running', step: 0 });
    // étape 1 : seulement au bouton « Suivant »
    p = run([ev({ type: 'profileChanged' })], p);
    expect(p.step).toBe(0);
    p = run([{ type: 'next' }], p);
    expect(p.step).toBe(1);
    // étape 2 : un autre événement ne fait rien ; le profil changé dans le magasin fait avancer
    p = run([ev({ type: 'route', path: '/tools' }), ev({ type: 'toolOpened', id: 'sleep' })], p);
    expect(p.step).toBe(1);
    p = run([ev({ type: 'profileChanged' })], p);
    expect(p.step).toBe(2);
    p = run([ev({ type: 'categoryOpened', id: 'sleep' })], p);
    expect(p.step).toBe(3);
    // étape 4 : choisir une action ne suffit pas, il faut refermer le formulaire
    p = run([ev({ type: 'quickChosen', key: 'diaper' })], p);
    expect(p.step).toBe(3);
    p = run([ev({ type: 'quickFormClosed' })], p);
    expect(p.step).toBe(4);
    p = run([ev({ type: 'favoriteChanged', id: 'sleep', on: true })], p);
    expect(p).toMatchObject({ step: 5, favoriteAdded: 'sleep' });
    p = run([ev({ type: 'route', path: '/tools' })], p);
    expect(p.step).toBe(5);
    p = run([ev({ type: 'route', path: '/calendar' })], p);
    expect(p.step).toBe(6);
    p = run([ev({ type: 'editorOpened' })], p);
    expect(p.status).toBe('done');
    expect(p.completed).toEqual(TOUR_STEPS.map((s) => s.id));
  });

  it('précédent, passer une étape, plus tard puis reprise À L’ÉTAPE EN COURS, quitter', () => {
    let p = run([{ type: 'start' }, { type: 'next' }, { type: 'skipStep' }, { type: 'skipStep' }]);
    expect(p).toMatchObject({ step: 3, skipped: ['profile', 'tools'] });
    p = run([{ type: 'back' }], p);
    expect(p.step).toBe(2);
    p = run([{ type: 'later' }], p);
    expect(p.status).toBe('paused');
    // en pause, les événements ne font rien
    expect(run([ev({ type: 'toolOpened', id: 'x' })], p)).toBe(p);
    p = run([{ type: 'start' }], p);
    expect(p).toMatchObject({ status: 'running', step: 2 });
    p = run([{ type: 'quit' }], p);
    expect(p.status).toBe('skipped');
    // relance depuis Réglages après « Quitter » ou une visite terminée : au début
    expect(run([{ type: 'start' }], p)).toMatchObject({ status: 'running', step: 0, skipped: [] });
  });

  it('favori retiré pendant la visite : plus rien à proposer de retirer', () => {
    const p = run([{ type: 'start' }, ev({ type: 'favoriteChanged', id: 'a', on: true }), ev({ type: 'favoriteChanged', id: 'a', on: false })]);
    expect(p.favoriteAdded).toBeNull();
  });

  it('nounou et urgence : jamais proposée, jamais affichée', () => {
    const paused = run([{ type: 'start' }, { type: 'later' }]);
    const running = run([{ type: 'start' }]);
    expect(canOfferTour({ caregiverOnly: true, emergency: false })).toBe(false);
    expect(canOfferTour({ caregiverOnly: false, emergency: true })).toBe(false);
    expect(canOfferTour({ caregiverOnly: false, emergency: false })).toBe(true);
    expect(showResumeCard(paused, { caregiverOnly: true, emergency: false })).toBe(false);
    expect(showResumeCard(paused, { caregiverOnly: false, emergency: false })).toBe(true);
    expect(showResumeCard(run([{ type: 'hideResume' }], paused), { caregiverOnly: false, emergency: false })).toBe(false);
    expect(overlayActive(running, { caregiverOnly: true, emergency: false })).toBe(false);
    expect(overlayActive(running, { caregiverOnly: false, emergency: true })).toBe(false);
    expect(overlayActive(running, { caregiverOnly: false, emergency: false })).toBe(true);
  });

  it('ancre absente : bulle centrée ; ancre présente : bulle à côté, jamais dessus', () => {
    expect(bubblePlacement({ hole: null, bubbleH: 200, top: 50, bottom: 800, gap: 12 })).toMatchObject({ side: 'center' });
    const low = bubblePlacement({ hole: { x: 0, y: 700, width: 100, height: 52 }, bubbleH: 240, top: 50, bottom: 800, gap: 12 });
    expect(low.side).toBe('above');
    expect(low.y + 240).toBeLessThanOrEqual(700);
    const high = bubblePlacement({ hole: { x: 0, y: 100, width: 100, height: 52 }, bubbleH: 240, top: 50, bottom: 800, gap: 12 });
    expect(high).toMatchObject({ side: 'below', y: 164 });
    // très grand texte : la bulle prend le plus grand côté et défile (maxH)
    const huge = bubblePlacement({ hole: { x: 0, y: 300, width: 100, height: 52 }, bubbleH: 900, top: 50, bottom: 568, gap: 12 });
    expect(huge.maxH).toBeLessThan(900);
    expect(holeFor({ x: 0, y: 10, width: 400, height: 40 }, 6, { width: 320, height: 568 })).toEqual({ x: 2, y: 4, width: 316, height: 52 });
    expect(unionRect([{ x: 10, y: 10, width: 10, height: 10 }, { x: 30, y: 40, width: 10, height: 10 }])).toEqual({ x: 10, y: 10, width: 30, height: 40 });
    expect(rectVisible({ x: 0, y: 900, width: 10, height: 40 }, { top: 0, bottom: 844, width: 390 })).toBe(false);
  });

  it('aides contextuelles : une fois par outil, jamais une urgence, désactivables, pas pendant la visite', () => {
    const base = { id: 'sleep', seen: [] as string[], off: false, touring: false, emergency: false };
    expect(shouldHint(base)).toBe(true);
    expect(shouldHint({ ...base, seen: ['sleep'] })).toBe(false);
    expect(shouldHint({ ...base, urgent: true })).toBe(false);
    expect(shouldHint({ ...base, off: true })).toBe(false);
    expect(shouldHint({ ...base, touring: true })).toBe(false);
    expect(shouldHint({ ...base, emergency: true })).toBe(false);
  });
});

describe('progression par compte, sur l’appareil', () => {
  it('chaque compte a sa progression ; l’application fermée en pleine visite reprend « plus tard »', async () => {
    const st = useTourStore.getState();
    st.setOwner('compte-a');
    startTour();
    useTourStore.getState().dispatch({ type: 'next' });
    tourEvent({ type: 'profileChanged' });
    expect(useTourStore.getState().byUser['compte-a']).toMatchObject({ status: 'running', step: 2 });
    useTourStore.getState().setOwner('compte-b');
    expect(useTourStore.getState().byUser['compte-b']).toBeUndefined();
    tourEvent({ type: 'profileChanged' }); // aucune visite pour ce compte : rien
    expect(useTourStore.getState().byUser['compte-b']).toBeUndefined();
    // relecture du stockage : « en cours » devient « en pause » à la même étape
    const merge = useTourStore.persist.getOptions().merge!;
    const restored = merge({ byUser: useTourStore.getState().byUser, hintsOff: true, hintsSeen: ['x'] }, useTourStore.getState()) as ReturnType<typeof useTourStore.getState>;
    expect(restored.byUser['compte-a']).toMatchObject({ status: 'paused', step: 2 });
    expect(restored.hintsOff).toBe(true);
    const saved = useTourStore.persist.getOptions().partialize!(useTourStore.getState()) as Record<string, unknown>;
    expect(Object.keys(saved).sort()).toEqual(['byUser', 'hintsOff', 'hintsSeen']);
  });
});

describe('mode exercice : rien n’est écrit', () => {
  let child = '';
  let hid = '';
  beforeAll(async () => {
    await backend.auth.signUp('visite@exemple.test', 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    [{ id: child }] = await backend.insert<{ id: string }>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-09-01' });
  });

  it('aucun appel d’écriture n’atteint la base pendant un exercice (insert, update, remove, rpc, file hors connexion)', async () => {
    const before = (await backend.select({ table: 'diapers', filters: [eq('child_id', child)] })).length;
    const end = beginPractice();
    clearPracticeWrites();
    expect(isPracticeActive()).toBe(true);
    const [row] = await backend.insert<{ id: string; wet: boolean }>('diapers', { child_id: child, household_id: hid, at: new Date().toISOString(), wet: true, stool: false });
    expect(row.wet).toBe(true); // le formulaire reçoit une réponse plausible…
    await backend.update('children', { first_name: 'Autre' }, [eq('id', child)]);
    await backend.remove('children', [eq('id', child)]);
    await backend.rpc('create_mission', { p_title: 'x' });
    expect(await insertOrQueue('diapers', { child_id: child, household_id: hid, at: new Date().toISOString(), wet: true })).toBe('sent');
    await rpcOrQueue('mission_respond', { p_id: 'x' });
    await backend.storage.upload('child-photos', 'a.jpg', { uri: 'file://a.jpg', type: 'image/jpeg', name: 'a.jpg' } as never);
    await expect(backend.invoke('assistant', {})).rejects.toThrow();
    // … les lectures passent
    expect((await backend.select<{ first_name: string }>({ table: 'children', filters: [eq('id', child)] }))[0]?.first_name).toBe('Lina');
    expect(practiceWrites().map((w) => w.kind)).toEqual(['insert', 'update', 'remove', 'rpc', 'insert', 'rpc', 'upload', 'invoke']);
    expect(useOfflineStore.getState().pending).toHaveLength(0);
    end();
    expect(isPracticeActive()).toBe(false);
    // … et rien n'est arrivé dans la base
    expect((await backend.select({ table: 'diapers', filters: [eq('child_id', child)] })).length).toBe(before);
    expect((await backend.select<{ first_name: string }>({ table: 'children', filters: [eq('id', child)] }))[0]?.first_name).toBe('Lina');
    // hors exercice, l'écriture repart normalement
    await backend.insert('diapers', { child_id: child, household_id: hid, at: new Date().toISOString(), wet: true, stool: false });
    expect((await backend.select({ table: 'diapers', filters: [eq('child_id', child)] })).length).toBe(before + 1);
  });

  it('l’exercice ne vit que pendant l’étape « Enregistrer une action » ; jamais d’écriture automatique', () => {
    const st = useTourStore.getState();
    st.setOwner('compte-exercice');
    startTour();
    const d = (a: TourAction) => useTourStore.getState().dispatch(a);
    d({ type: 'next' }); d({ type: 'skipStep' }); d({ type: 'skipStep' });
    expect(useTourStore.getState().byUser['compte-exercice'].step).toBe(3);
    expect(isPracticeActive()).toBe(false); // jamais sans choix explicite
    useTourStore.getState().setPractice(true);
    expect(isPracticeActive()).toBe(true);
    d({ type: 'event', event: { type: 'quickChosen', key: 'diaper' } });
    expect(isPracticeActive()).toBe(true);
    d({ type: 'event', event: { type: 'quickFormClosed' } });
    expect(useTourStore.getState().byUser['compte-exercice'].step).toBe(4);
    expect(isPracticeActive()).toBe(false);
    // « Plus tard » ou « Quitter » pendant l'exercice le ferment aussi
    d({ type: 'back' });
    useTourStore.getState().setPractice(true);
    d({ type: 'later' });
    expect(isPracticeActive()).toBe(false);
    expect(TOUR_LENGTH).toBe(7);
  });
});

describe('visite : plus d’apparition « au hasard » (22/11/2026)', () => {
  const { leftStep, tourReducer: r, freshProgress: fresh } = require('@/features/tour/model');
  it('quitter l’écran de l’étape après y être arrivé met la visite en pause', () => {
    expect(leftStep({ stepIndex: 0, arrivedAt: 0, path: '/premium', formOpen: false })).toBe(true);
    expect(leftStep({ stepIndex: 0, arrivedAt: 0, path: '/', formOpen: false })).toBe(false);
  });
  it('lancée depuis Réglages (pas encore arrivée) : pas de pause, la pastille emmène à l’étape', () => {
    expect(leftStep({ stepIndex: 0, arrivedAt: null, path: '/settings/help', formOpen: false })).toBe(false);
  });
  it('formulaire ouvert depuis « Enregistrer une action » : la visite attend sans se mettre en pause', () => {
    expect(leftStep({ stepIndex: 3, arrivedAt: 3, path: '/bottle/x', formOpen: true })).toBe(false);
  });
  it('l’étape qui avance par une navigation (agenda → /calendar) ne compte pas comme une sortie', () => {
    expect(leftStep({ stepIndex: 6, arrivedAt: 5, path: '/calendar', formOpen: false })).toBe(false);
  });
  it('pause automatique : la carte de reprise masquée par la personne reste masquée', () => {
    const hidden = { ...fresh(), status: 'running', resumeHidden: true };
    expect(r(hidden, { type: 'later', auto: true }).resumeHidden).toBe(true);
    expect(r(hidden, { type: 'later' }).resumeHidden).toBe(false);
  });
});

describe('tourPath (web : accueil servi à /app)', () => {
  it("/app vaut l'accueil « / » ; les autres adresses sont inchangées", () => {
    const { tourPath, leftStep } = require('@/features/tour/model');
    expect(tourPath('/app')).toBe('/');
    expect(tourPath('/tools')).toBe('/tools');
    // Arrivée sur l'accueil puis affichage à /app : la visite ne se met plus en pause
    expect(leftStep({ stepIndex: 0, arrivedAt: 0, path: tourPath('/app'), formOpen: false })).toBe(false);
  });
});
