/**
 * Rappel du prochain biberon — scénarios demandés, de bout en bout sur le moteur local et expo-notifications simulé :
 * 13 h 10 + 3 h 30 → 16 h 40 ; nouveau biberon à 16 h 50 → 20 h 20 ; modification de l'intervalle ; report de 30 min ;
 * annulation ; application fermée (déclencheur système absolu) ; redémarrage du téléphone ; autorisation refusée puis
 * accordée ; deux enfants avec deux rappels indépendants ; aucune notification en double ; changement d'heure.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

type Req = { content: { title?: string; body?: string; data?: Record<string, unknown>; categoryIdentifier?: string }; trigger: { type: string; date: Date; channelId?: string } };
const mockScheduled = new Map<string, Req>();
let mockSeq = 0;
const mockPerm = { granted: false };
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  // Comme le système : sans autorisation, la programmation est refusée
  scheduleNotificationAsync: jest.fn(async (req: Req) => {
    if (!mockPerm.granted) throw new Error('Notifications non autorisées');
    const id = `n${++mockSeq}`;
    mockScheduled.set(id, req);
    return id;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockScheduled.delete(id); }),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.entries()].map(([identifier, r]) => ({ identifier, content: r.content, trigger: r.trigger }))),
  getLastNotificationResponse: jest.fn(() => null),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: mockPerm.granted, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: mockPerm.granted })),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('@/lib/backend', () => {
  const { createDemoBackend } = jest.requireActual('@/lib/backend/demo');
  const types = jest.requireActual('@/lib/backend/types');
  return { ...types, backend: createDemoBackend(), isDemo: true };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend, eq } from '@/lib/backend';
import { startBottleTimer } from '@/lib/data/hooks-bottle';
import {
  cancelTimer, computeDueAt, formatClock, modifyInterval, nextReminderSentence, setReminderAt, snoozeTimer,
} from '@/lib/domain/bottleTimer';
import { handleBottleNotificationResponse, setBottleShowQuantity, syncBottleTimers } from '@/lib/notifications';
import type { Child } from '@/lib/types';
import type { BottleTimer } from '@/lib/types-bottle';

const PARIS = 'Europe/Paris';
/** Instant correspondant à une heure de Paris (20/10/2026, heure d'été UTC+2). */
const paris = (h: number, m: number, day = 20) => new Date(Date.UTC(2026, 9, day, h - 2, m));

describe('rappel du prochain biberon : calcul', () => {
  it('biberon à 13 h 10, rappel dans 3 h 30 → 16 h 40', () => {
    const due = computeDueAt(paris(13, 10), 210);
    expect(formatClock(due, PARIS)).toBe('16 h 40');
    expect(nextReminderSentence('Lina', due, paris(13, 11), PARIS)).toBe('Prochain rappel de biberon de Lina à 16 h 40.');
  });
  it('nouveau biberon à 16 h 50, intervalle conservé → 20 h 20', () => {
    expect(formatClock(computeDueAt(paris(16, 50), 210), PARIS)).toBe('20 h 20');
  });
  it('modification de l’intervalle : recalcul depuis le dernier biberon', () => {
    const t = { child_id: 'lina', planned_ml: null, status: 'active' as const, last_bottle_at: paris(13, 10).toISOString(), interval_minutes: 210, due_at: paris(16, 40).toISOString() };
    expect(formatClock(modifyInterval(t, 150).due_at, PARIS)).toBe('15 h 40');
  });
  it('report de 30 min', () => {
    const t = { child_id: 'lina', planned_ml: null, status: 'active' as const, last_bottle_at: paris(13, 10).toISOString(), interval_minutes: 210, due_at: paris(16, 40).toISOString() };
    expect(formatClock(snoozeTimer(t, 30, paris(16, 30)).due_at, PARIS)).toBe('17 h 10');
    // Rappel déjà passé (notification ouverte à 16 h 45) : le report part de maintenant
    expect(formatClock(snoozeTimer(t, 30, paris(16, 45)).due_at, PARIS)).toBe('17 h 15');
  });
  it('heure du rappel choisie directement : future, après le biberon, au plus 2 jours après', () => {
    const t = { last_bottle_at: paris(13, 10).toISOString() };
    expect(formatClock(setReminderAt(t, paris(17, 0), paris(14, 0)).due_at, PARIS)).toBe('17 h 00');
    expect(() => setReminderAt(t, paris(13, 30), paris(14, 0))).toThrow(/à venir/);
    expect(() => setReminderAt(t, paris(13, 0, 23), paris(14, 0))).toThrow(/2 jours/);
  });
  it('changement d’heure (25/10/2026, 3 h → 2 h) : 3 h réellement écoulées, heure affichée correcte', () => {
    const at = new Date(Date.UTC(2026, 9, 24, 23, 30)); // 1 h 30 heure d'été
    expect(formatClock(at, PARIS)).toBe('1 h 30');
    const due = computeDueAt(at, 180);
    expect(due.getTime() - at.getTime()).toBe(3 * 3600_000);
    expect(formatClock(due, PARIS)).toBe('3 h 30'); // heure d'hiver après le recul d'une heure
  });
  it('fuseau horaire : l’instant ne change pas, seul l’affichage suit le fuseau', () => {
    const due = computeDueAt(paris(13, 10), 210);
    expect(formatClock(due, 'America/Martinique')).toBe('10 h 40');
  });
});

describe('rappel du prochain biberon : notifications', () => {
  let lina: Child;
  let noe: Child;
  const bottleNotifs = () => [...mockScheduled.entries()].filter(([, r]) => r.content.data?.kind === 'bottle');
  const notifFor = (c: Child) => bottleNotifs().filter(([, r]) => r.content.data?.childId === c.id);
  const activeFor = async (c: Child) => (await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', c.id), eq('status', 'active')] }))[0];

  beforeAll(async () => {
    await backend.auth.signUp('biberon@exemple.test', 'MotDePasse!2026');
    const hid = await backend.rpc<string>('create_household', { p_name: 'Test' });
    [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-09-01' });
    [noe] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Noé', birth_date: '2026-09-01' });
  });

  it('autorisation refusée : rien n’est programmé (le rappel reste visible dans l’app), puis accordée : programmé une seule fois', async () => {
    const at = new Date(Date.now() - 10 * 60_000);
    await startBottleTimer({ childId: lina.id, lastBottleAt: at, intervalMinutes: 210, plannedMl: 150 });
    expect((await syncBottleTimers()).scheduled).toBe(0);
    expect(notifFor(lina)).toHaveLength(0);
    mockPerm.granted = true;
    expect((await syncBottleTimers()).scheduled).toBe(1);
    expect((await syncBottleTimers()).scheduled).toBe(0);
    const [, req] = notifFor(lina)[0];
    expect(req.trigger.type).toBe('date'); // déclencheur système absolu : délivré application fermée
    expect(req.trigger.date.getTime()).toBe(at.getTime() + 210 * 60_000);
    expect(req.content).toMatchObject({ title: 'Biberon de Lina', body: 'Rappel choisi pour Lina : le prochain biberon était prévu maintenant.' });
    expect(req.content.data?.url).toBe(`/bottle/${lina.id}`); // ouvre directement l'écran de Lina
  });

  it('deux enfants, deux rappels ; un biberon pour Lina ne touche jamais le rappel de Noé', async () => {
    await startBottleTimer({ childId: noe.id, lastBottleAt: new Date(Date.now() - 5 * 60_000), intervalMinutes: 180 });
    await syncBottleTimers();
    const noeBefore = notifFor(noe).map(([id]) => id);
    const linaBefore = notifFor(lina).map(([id]) => id);
    expect(noeBefore).toHaveLength(1);
    // Nouveau biberon de Lina : l'ancien rappel est clos et remplacé
    await startBottleTimer({ childId: lina.id, lastBottleAt: new Date(), intervalMinutes: 210, replace: 'new_bottle' });
    await syncBottleTimers();
    expect(notifFor(lina)).toHaveLength(1);
    expect(notifFor(lina)[0][0]).not.toBe(linaBefore[0]);
    expect(notifFor(noe).map(([id]) => id)).toEqual(noeBefore);
    expect((await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', lina.id), eq('status', 'active')] }))).toHaveLength(1);
    expect(notifFor(noe)[0][1].content.title).toBe('Biberon de Noé');
  });

  it('modification de l’intervalle et report de 30 min : l’ancienne notification est remplacée, jamais doublée', async () => {
    let t = await activeFor(lina);
    await backend.update('bottle_timers', modifyInterval(t, 150), [eq('id', t.id)]);
    await syncBottleTimers();
    expect(notifFor(lina)).toHaveLength(1);
    expect(notifFor(lina)[0][1].trigger.date.getTime()).toBe(Date.parse(t.last_bottle_at) + 150 * 60_000);
    t = await activeFor(lina);
    const snoozed = snoozeTimer(t, 30);
    await backend.update('bottle_timers', snoozed, [eq('id', t.id)]);
    await syncBottleTimers();
    expect(notifFor(lina)).toHaveLength(1);
    expect(notifFor(lina)[0][1].trigger.date.toISOString()).toBe(snoozed.due_at);
  });

  it('report de 30 min depuis le bouton de la notification', async () => {
    const t = await activeFor(noe);
    const [id, req] = notifFor(noe)[0];
    await handleBottleNotificationResponse({ actionIdentifier: 'bottle-snooze-30', notification: { date: Date.now(), request: { identifier: id, content: req.content, trigger: req.trigger } } } as never);
    expect(Date.parse((await activeFor(noe)).due_at)).toBe(Date.parse(t.due_at) + 30 * 60_000);
    expect(notifFor(noe)).toHaveLength(1);
  });

  it('aucune notification en double, même avec des synchronisations simultanées', async () => {
    await Promise.all([syncBottleTimers(), syncBottleTimers(), syncBottleTimers()]);
    expect(notifFor(lina)).toHaveLength(1);
    expect(notifFor(noe)).toHaveLength(1);
  });

  it('téléphone redémarré / application relancée : les rappels sont conservés et pas reprogrammés en double', async () => {
    const before = bottleNotifs().map(([id]) => id).sort();
    // Nouvelle instance du module (mémoire perdue) ; le système et le stockage local, eux, conservent leurs données
    await new Promise((r) => setTimeout(r, 300)); // la base locale est enregistrée sur l'appareil
    let fresh!: typeof import('@/lib/notifications');
    jest.isolateModules(() => { fresh = require('@/lib/notifications'); });
    expect((await fresh.syncBottleTimers()).scheduled).toBe(0);
    expect(bottleNotifs().map(([id]) => id).sort()).toEqual(before);
    // Stockage local perdu (réinstallation) : les orphelines sont retirées et chaque rappel est reprogrammé une fois
    await AsyncStorage.removeItem('toietmoi.bottle-scheduled.v1');
    await syncBottleTimers();
    expect(notifFor(lina)).toHaveLength(1);
    expect(notifFor(noe)).toHaveLength(1);
  });

  it('quantité dans la notification seulement si le parent l’autorise', async () => {
    await startBottleTimer({ childId: lina.id, lastBottleAt: new Date(), intervalMinutes: 210, plannedMl: 120, replace: 'new_bottle' });
    await syncBottleTimers();
    expect(notifFor(lina)[0][1].content.body).not.toMatch(/ml/);
    await setBottleShowQuantity(true);
    expect(notifFor(lina)).toHaveLength(1);
    expect(notifFor(lina)[0][1].content.body).toMatch(/Quantité notée : 120 ml/);
    await setBottleShowQuantity(false);
  });

  it('annulation : plus de rappel ni de notification pour Lina, celui de Noé reste', async () => {
    const t = await activeFor(lina);
    await backend.update('bottle_timers', cancelTimer(), [eq('id', t.id)]);
    await syncBottleTimers();
    expect(notifFor(lina)).toHaveLength(0);
    expect(notifFor(noe)).toHaveLength(1);
  });
});

describe('profils concernés par le biberon', () => {
  const today = new Date('2026-10-21T12:00:00Z');
  it('bébé de 0 à 2 ans ou profil « Mon bébé est né » : oui ; enfant plus grand : non', async () => {
    const { isBottleChild } = require('@/lib/domain/bottleTimer') as typeof import('@/lib/domain/bottleTimer');
    expect(isBottleChild('2026-09-01', null, today)).toBe(true);
    expect(isBottleChild('2025-09-01', 'child', today)).toBe(true); // 13 mois
    expect(isBottleChild('2024-10-22', null, today)).toBe(true); // 23 mois
    expect(isBottleChild('2024-10-21', null, today)).toBe(false); // 2 ans pile
    expect(isBottleChild('2020-11-01', 'child', today)).toBe(false); // ~6 ans (Noé)
    expect(isBottleChild('2023-01-01', 'baby', today)).toBe(true); // profil « Mon bébé est né » choisi par le parent
  });
});
