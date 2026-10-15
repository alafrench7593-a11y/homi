/**
 * Synchronisation des notifications du minuteur biberon (expo-notifications simulé) :
 * déclencheur DATE absolu, lien profond vers le bon enfant, annulation avant reprogrammation,
 * interrupteur respecté, et AUCUNE autre notification (rappels, rendez-vous, forum) annulée.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockScheduled = new Map<string, { content: { title?: string; body?: string; data?: Record<string, unknown>; categoryIdentifier?: string }; trigger: { type: string; date: Date; channelId?: string } }>();
let mockSeq = 0;
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  scheduleNotificationAsync: jest.fn(async (req: { content: never; trigger: never }) => {
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
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('@/lib/backend', () => {
  const { createDemoBackend } = jest.requireActual('@/lib/backend/demo');
  const types = jest.requireActual('@/lib/backend/types');
  return { ...types, backend: createDemoBackend(), isDemo: true };
});

import { backend, eq } from '@/lib/backend';
import { newTimer, snoozeTimer } from '@/lib/domain/bottleTimer';
import { handleBottleNotificationResponse, setBottleNotificationsEnabled, syncBottleTimers } from '@/lib/notifications';
import type { Child } from '@/lib/types';
import type { BottleTimer } from '@/lib/types-bottle';

describe('notifications du minuteur biberon', () => {
  let lina: Child;
  let noe: Child;

  beforeAll(async () => {
    await backend.auth.signUp('notif@exemple.test', 'MotDePasse!2026');
    const hid = await backend.rpc<string>('create_household', { p_name: 'Test' });
    [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-09-01' });
    [noe] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Noé', birth_date: '2026-09-01' });
    // Notification d'un AUTRE module (rendez-vous) : ne doit jamais être annulée par le minuteur
    mockScheduled.set('rdv-1', { content: { title: 'Rendez-vous', data: { url: '/appointments', source: 'reminder' } }, trigger: { type: 'date', date: new Date(Date.now() + 86400_000) } });
  });

  const bottleIds = () => [...mockScheduled.entries()].filter(([, r]) => r.content.data?.kind === 'bottle').map(([id]) => id);

  it('programme une notification DATE absolue par enfant, avec lien profond', async () => {
    const now = new Date();
    await backend.insert('bottle_timers', { ...newTimer({ childId: lina.id, lastBottleAt: now, intervalMinutes: 210, plannedMl: 150 }, now) });
    await backend.insert('bottle_timers', { ...newTimer({ childId: noe.id, lastBottleAt: now, intervalMinutes: 180 }, now) });
    const res = await syncBottleTimers();
    expect(res.scheduled).toBe(2);
    const reqs = bottleIds().map((id) => mockScheduled.get(id)!);
    const forLina = reqs.find((r) => r.content.data?.childId === lina.id)!;
    expect(forLina.trigger.type).toBe('date');
    expect(forLina.trigger.channelId).toBe('bottle');
    expect(forLina.trigger.date.getTime()).toBe(now.getTime() + 210 * 60_000);
    expect(forLina.content.body).toBe('C’est bientôt l’heure du biberon de Lina. Rappel enregistré : 150 ml.');
    expect(forLina.content.data?.url).toBe(`/bottle/${lina.id}`);
    expect(forLina.content.categoryIdentifier).toBe('bottle');
    // Idempotent : pas de doublon
    expect((await syncBottleTimers()).scheduled).toBe(0);
    expect(bottleIds()).toHaveLength(2);
  });

  it('report : l’ancienne notification est annulée avant la nouvelle', async () => {
    const [t] = await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', lina.id), eq('status', 'active')] });
    const before = bottleIds().find((id) => mockScheduled.get(id)!.content.data?.childId === lina.id)!;
    await backend.update('bottle_timers', snoozeTimer(t, 30), [eq('id', t.id)]);
    const res = await syncBottleTimers();
    expect(res).toMatchObject({ scheduled: 1, cancelled: 1 });
    expect(mockScheduled.has(before)).toBe(false);
    expect(bottleIds()).toHaveLength(2);
  });

  it('action « Annuler » depuis la notification : minuteur annulé, notification retirée', async () => {
    const id = bottleIds().find((x) => mockScheduled.get(x)!.content.data?.childId === noe.id)!;
    const req = mockScheduled.get(id)!;
    const handled = await handleBottleNotificationResponse({
      actionIdentifier: 'bottle-cancel',
      notification: { date: Date.now(), request: { identifier: id, content: req.content, trigger: req.trigger } },
    } as never);
    expect(handled).toBe(true);
    const [t] = await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('child_id', noe.id)] });
    expect(t.status).toBe('cancelled');
    expect(bottleIds()).toHaveLength(1);
  });

  it('interrupteur désactivé : plus aucune notification biberon, les autres restent', async () => {
    await setBottleNotificationsEnabled(false);
    expect(bottleIds()).toHaveLength(0);
    expect(mockScheduled.has('rdv-1')).toBe(true);
    await setBottleNotificationsEnabled(true);
    expect(bottleIds()).toHaveLength(1);
    expect(mockScheduled.has('rdv-1')).toBe(true);
  });
});
