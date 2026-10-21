/**
 * Notifications du planificateur de sommeil (expo-notifications simulé) : déclencheur DATE, lien vers le bon enfant,
 * reprogrammation complète quand le planning change, arrêt complet, enfants séparés, autres modules jamais touchés.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockScheduled = new Map<string, { content: { title?: string; body?: string; data?: Record<string, unknown> }; trigger: { type: string; date: Date; channelId?: string } }>();
let mockSeq = 0;
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async (req: { content: never; trigger: never }) => { const id = `n${++mockSeq}`; mockScheduled.set(id, req); return id; }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockScheduled.delete(id); }),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.entries()].map(([identifier, r]) => ({ identifier, content: r.content, trigger: r.trigger }))),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));

import { syncSleepNotifications } from '@/lib/notifications';
import { DEFAULT_NOTIFY, planDay, planSleepNotifications, type SleepRecord } from '@/lib/domain/sleepPlanner';

const H = 3600_000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const sleepIds = (child?: string) => [...mockScheduled.entries()].filter(([, r]) => r.content.data?.kind === 'sleep' && (!child || r.content.data?.childId === child)).map(([id]) => id);

describe('notifications de sommeil', () => {
  beforeAll(() => {
    mockScheduled.set('rdv-1', { content: { title: 'Rendez-vous', data: { url: '/appointments', source: 'reminder' } }, trigger: { type: 'date', date: new Date(Date.now() + 86400_000) } });
    mockScheduled.set('bib-1', { content: { title: 'Biberon', data: { kind: 'bottle', childId: 'lina' } }, trigger: { type: 'date', date: new Date(Date.now() + 3 * H) } });
  });
  const list = (at: number, body = 'La prochaine sieste de Lina est estimée autour de 14 h 40.') => [{ id: 'sleep-lina-nap', at, title: 'Sommeil de Lina', body, kind: 'nap' }];

  it('programme des notifications DATE pour le bon enfant, avec lien vers son planning', async () => {
    const at = Date.now() + H;
    const r = await syncSleepNotifications('lina', list(at));
    expect(r.scheduled).toBe(1);
    const [id] = sleepIds('lina');
    const n = mockScheduled.get(id)!;
    expect(n.trigger.type).toBe('date');
    expect(n.trigger.channelId).toBe('sleep');
    expect(n.content.data).toMatchObject({ url: '/sleep/lina', childId: 'lina', kind: 'sleep' });
    // Planning inchangé : rien n'est annulé ni reprogrammé
    expect(await syncSleepNotifications('lina', list(at))).toEqual({ scheduled: 0, cancelled: 0 });
    expect(sleepIds('lina')).toEqual([id]);
  });

  it('planning modifié : l’ancienne notification est annulée, la nouvelle programmée', async () => {
    const before = sleepIds('lina');
    await syncSleepNotifications('lina', list(Date.now() + 2 * H, 'La prochaine sieste de Lina est estimée autour de 15 h 10.'));
    const after = sleepIds('lina');
    expect(after).toHaveLength(1);
    expect(before.some((id) => after.includes(id))).toBe(false);
    expect(mockScheduled.get(after[0])!.content.body).toMatch(/15 h 10/);
  });

  it('jumeaux : chaque enfant garde ses notifications', async () => {
    await syncSleepNotifications('noe', [{ id: 'sleep-noe-nap', at: Date.now() + H, title: 'Sommeil de Noé', body: 'La prochaine sieste de Noé est estimée autour de 11 h.', kind: 'nap' }]);
    expect(sleepIds('noe')).toHaveLength(1);
    expect(sleepIds('lina')).toHaveLength(1);
  });

  it('arrêt complet : tout est annulé pour cet enfant, rien d’autre n’est touché', async () => {
    await syncSleepNotifications('lina', []);
    expect(sleepIds('lina')).toHaveLength(0);
    expect(sleepIds('noe')).toHaveLength(1);
    expect(mockScheduled.has('rdv-1')).toBe(true);
    expect(mockScheduled.has('bib-1')).toBe(true);
  });

  it('du planning réel à la programmation : uniquement des heures futures', async () => {
    const sleeps: SleepRecord[] = [{ child_id: 'lina', kind: 'night', started_at: iso(14 * H), ended_at: iso(1.5 * H) }];
    const plan = planDay({ childId: 'lina', birthDate: '2026-04-15', sleeps });
    const wanted = planSleepNotifications(plan, { ...DEFAULT_NOTIFY, enabled: true, quiet_from: null, quiet_to: null, days: [0, 1, 2, 3, 4, 5, 6] }, 'Lina', 'female');
    await syncSleepNotifications('lina', wanted);
    for (const id of sleepIds('lina')) expect(mockScheduled.get(id)!.trigger.date.getTime()).toBeGreaterThan(Date.now());
    expect(sleepIds('lina').length).toBe(wanted.length);
  });
});
