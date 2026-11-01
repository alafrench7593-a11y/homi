/**
 * Campagne QA du 02/11/2026, A-07 : deux synchronisations simultanées des rappels locaux
 * les programmaient en double, et le doublon restait même après une nouvelle synchronisation.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockScheduled = new Map<string, { content: { data?: Record<string, unknown> } }>();
let mockSeq = 0;
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  scheduleNotificationAsync: jest.fn(async (req: { content: { data?: Record<string, unknown> } }) => {
    await new Promise((r) => setTimeout(r, 1)); // le système répond de façon asynchrone
    const id = `n${++mockSeq}`;
    mockScheduled.set(id, req);
    return id;
  }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockScheduled.delete(id); }),
  getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.entries()].map(([identifier, r]) => ({ identifier, content: r.content }))),
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncLocalReminders } from '@/lib/notifications';
import type { Reminder } from '@/lib/types';

const reminder = (id: string, hour: number): Reminder => ({
  id, user_id: 'u', household_id: null, child_id: null, pregnancy_id: null, appointment_id: null,
  category: 'custom', title: `Rappel ${id}`, body: null, schedule: { type: 'daily', hour, minute: 0 },
  timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: null, created_at: '', updated_at: '',
});
const countBy = () => {
  const out: Record<string, number> = {};
  for (const n of mockScheduled.values()) {
    const id = String(n.content.data?.reminderId ?? '');
    if (id) out[id] = (out[id] ?? 0) + 1;
  }
  return out;
};

beforeEach(async () => { mockScheduled.clear(); await AsyncStorage.clear(); });

it('deux synchronisations simultanées ne programment chaque rappel qu’une fois', async () => {
  const list = [reminder('a', 8), reminder('b', 20)];
  await Promise.all([syncLocalReminders(list), syncLocalReminders(list), syncLocalReminders(list)]);
  expect(countBy()).toEqual({ a: 1, b: 1 });
});

it('les doublons laissés par une ancienne version sont annulés à la synchronisation suivante', async () => {
  const list = [reminder('a', 8)];
  await syncLocalReminders(list);
  // doublon orphelin (table perdue / ancienne version)
  mockScheduled.set('orphelin', { content: { data: { reminderId: 'a', source: 'reminder' } } });
  // notification sans rapport : conservée
  mockScheduled.set('report', { content: { data: { source: 'snooze' } } });
  await syncLocalReminders(list);
  expect(countBy()).toEqual({ a: 1 });
  expect(mockScheduled.has('report')).toBe(true);
});

it('la synchronisation suivante utilise la liste la plus récente', async () => {
  await Promise.all([syncLocalReminders([reminder('a', 8)]), syncLocalReminders([reminder('b', 9)])]);
  expect(countBy()).toEqual({ b: 1 });
});
