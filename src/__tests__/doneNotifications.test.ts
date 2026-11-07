/**
 * Notifications automatiques et « C'est fait » (07/11/2026), expo-notifications simulé :
 * programmation idempotente, annulation de celles qui ne sont plus voulues (et d'elles seules),
 * « C'est fait » sur une tâche et sur un rappel, « Dans 15 min ».
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
import { handleDoneResponse, syncAutoNotifications, TASK_DONE, TASK_SNOOZE } from '@/lib/notifications';
import type { AutoPlan } from '@/lib/domain/autoNotifs';

const resp = (actionIdentifier: string, data: Record<string, unknown>) =>
  ({ actionIdentifier, notification: { request: { content: { title: 'T', body: 'B', data } } } }) as never;

describe('notifications automatiques et « C’est fait »', () => {
  let uid = '';
  let hid = '';
  beforeAll(async () => {
    await backend.auth.signUp('fait@exemple.test', 'MotDePasse!2026');
    uid = (await backend.auth.getSession())!.userId;
    hid = await backend.rpc<string>('create_household', { p_name: 'Test' });
    mockScheduled.set('autre', { content: { title: 'Rappel perso', data: { source: 'reminder' } }, trigger: { type: 'date', date: new Date(Date.now() + 86400_000) } });
  });
  const autos = () => [...mockScheduled.entries()].filter(([, r]) => r.content.data?.kind === 'auto');
  const at = new Date(Date.now() + 3 * 3600_000);
  const plan = (id: string, extra: Partial<AutoPlan> = {}): AutoPlan => ({ id, kind: 'appointment', at, title: `Titre ${id}`, body: 'Corps', url: '/calendar', ...extra });

  it('programme une fois, puis retire seulement ce qui n’est plus voulu', async () => {
    expect((await syncAutoNotifications([plan('a'), plan('t', { kind: 'task', taskId: 'x1' })])).scheduled).toBe(2);
    expect((await syncAutoNotifications([plan('a'), plan('t', { kind: 'task', taskId: 'x1' })])).scheduled).toBe(0);
    const task = autos().find(([, r]) => r.content.data?.taskId === 'x1')![1];
    expect(task.content.categoryIdentifier).toBe('task');
    expect(task.trigger.type).toBe('date');
    expect(task.trigger.date.getTime()).toBe(at.getTime());
    const res = await syncAutoNotifications([plan('a', { title: 'Changé' })]);
    expect(res).toEqual({ scheduled: 1, cancelled: 2 });
    expect(autos().map(([, r]) => r.content.title)).toEqual(['Changé']);
    expect(mockScheduled.has('autre')).toBe(true);
  });

  it('« C’est fait » sur une tâche la marque faite, avec l’heure et la personne', async () => {
    const [t] = await backend.insert<{ id: string }>('family_tasks', { household_id: hid, title: 'Lessive', status: 'todo' });
    expect(await handleDoneResponse(resp(TASK_DONE, { taskId: t.id }))).toBe(true);
    const [row] = await backend.select<{ status: string; done_at: string | null; done_by: string | null }>({ table: 'family_tasks', filters: [eq('id', t.id)] });
    expect(row.status).toBe('done');
    expect(row.done_at).toBeTruthy();
    expect(row.done_by).toBe(uid);
  });

  it('« C’est fait » sur un rappel l’enregistre pour aujourd’hui, une seule fois', async () => {
    const [r] = await backend.insert<{ id: string }>('reminders', { title: 'Vitamine D', kind: 'custom', time_of_day: '09:00' });
    expect(await handleDoneResponse(resp('done', { reminderId: r.id, source: 'reminder' }))).toBe(true);
    await handleDoneResponse(resp('done', { reminderId: r.id, source: 'reminder' }));
    const rows = await backend.select<{ source: string }>({ table: 'daily_checks', filters: [eq('reminder_id', r.id)] });
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe('notification');
  });

  it('« Dans 15 min » reprogramme une seule notification sans changer la tâche', async () => {
    const before = mockScheduled.size;
    expect(await handleDoneResponse(resp(TASK_SNOOZE, { taskId: 'zz' }))).toBe(true);
    expect(mockScheduled.size).toBe(before + 1);
    const last = [...mockScheduled.values()].pop()!;
    expect(last.trigger).toMatchObject({ type: 'timeInterval', seconds: 900 });
    expect(last.content.data?.kind).toBe('auto-snooze');
  });

  it('un appui simple n’est pas traité comme « C’est fait »', async () => {
    expect(await handleDoneResponse(resp('expo.modules.notifications.actions.DEFAULT', { taskId: 'zz' }))).toBe(false);
  });
});
