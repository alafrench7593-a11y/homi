/**
 * Médicaments, notifications et file hors ligne (09/11/2026) — expo-notifications et serveur simulés.
 *  - la relance 30 min d'un traitement d'enfant survit à la synchronisation des rappels ;
 *  - « Pris » depuis la notification, hors ligne : gardé en file, relance retirée, envoyé une seule fois ;
 *  - refus « premium_required » : signalé clairement, jamais renvoyé en boucle, jamais perdu ;
 *  - file : ordre conservé, pas de perte au démarrage, pas de perte d'une saisie au même identifiant ;
 *  - limite iOS (64) : médicaments d'abord, rappels mis de côté retentés quand de la place se libère ;
 *  - changement d'heure : « Pris » sur le rappel de 08:00 retire bien la relance planifiée ce jour-là.
 */
const previousTZ = process.env.TZ;
process.env.TZ = 'Europe/Paris';
afterAll(() => { process.env.TZ = previousTZ; });

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => ({ addEventListener: jest.fn(() => () => undefined) }));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));

const mockScheduled = new Map<string, { content: { title?: string; body?: string; data?: Record<string, unknown>; categoryIdentifier?: string }; trigger: Record<string, unknown> }>();
let mockSeq = 0;
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  scheduleNotificationAsync: jest.fn(async (req: never) => { const id = `n${++mockSeq}`; mockScheduled.set(id, req); return id; }),
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

type Mode = 'ok' | 'network' | 'premium' | 'server' | ((row: Record<string, unknown>) => 'ok' | 'network');
let mockMode: Mode = 'ok';
const mockSent: { table: string; row: Record<string, unknown>; opts: unknown }[] = [];
jest.mock('@/lib/backend', () => {
  class BackendError extends Error {
    code?: string; hint?: string; status?: number;
    constructor(message: string, code?: string, hint?: string, status?: number) { super(message); this.code = code; this.hint = hint; this.status = status; }
    get isNetwork() { return this.code === 'network'; }
    get isPremiumRequired() { return this.hint === 'premium_required' || this.status === 402; }
  }
  return {
    BackendError,
    eq: (col: string, value: unknown) => ({ col, op: 'eq', value }),
    inList: (col: string, value: unknown) => ({ col, op: 'in', value }),
    backend: {
      mode: 'supabase',
      auth: { getSession: jest.fn(async () => ({ userId: 'maman' })) },
      select: jest.fn(async () => []),
      update: jest.fn(async () => []),
      insert: jest.fn(async (table: string, row: Record<string, unknown>, opts: unknown) => {
        const m = typeof mockMode === 'function' ? mockMode(row) : mockMode;
        if (m === 'network') throw new BackendError('Pas de connexion', 'network');
        if (m === 'premium') throw new BackendError('Fonction Premium (child_treatments)', 'P0001', 'premium_required', 400);
        if (m === 'server') throw new BackendError('Service indisponible', '503', undefined, 503);
        mockSent.push({ table, row, opts });
        return [row];
      }),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from '@/lib/backend';
import { doseFollowUpId, doseScheduledFor, handleTreatmentResponse, syncAutoNotifications, syncLocalReminders, TREAT_SKIP, TREAT_TAKEN } from '@/lib/notifications';
import { enqueue, flushQueue, insertOrQueue, loadQueue, retryConflict, setQueueOwner, useOfflineStore } from '@/lib/offline';
import { t as tr } from '@/i18n';
import type { AutoPlan } from '@/lib/domain/autoNotifs';

const followUps = () => [...mockScheduled.values()].filter((r) => r.content.data?.kind === 'auto' && r.content.data?.autoKind === 'dose');
let respSeq = 0;
const resp = (action: string, data: Record<string, unknown>, date: number) =>
  ({ actionIdentifier: action, notification: { date, request: { identifier: `req-${++respSeq}`, content: { title: 'Rappel de traitement', body: 'Ouvrez l’appli', data } } } }) as never;
const dosePlan = (treatmentId: string, planned: Date, source: 'treatment' | 'my_treatment' = 'treatment'): AutoPlan => ({
  id: `dose-${treatmentId}-${planned.toISOString()}`, kind: 'dose', at: new Date(planned.getTime() + 30 * 60_000), title: 'Prise à noter', body: 'x', url: '/medications',
  data: { source, treatmentId, scheduledFor: planned.toISOString(), dose: '08:00', ...(source === 'treatment' ? { householdId: 'foyer' } : {}) },
});
const reminder = (id: string, extra: Record<string, unknown> = {}) => ({ id, title: id, body: null, enabled: true, schedule: { type: 'daily', hour: 9, minute: 0 }, snoozed_until: null, deep_link: null, ...extra }) as never;

beforeEach(async () => {
  mockMode = 'ok';
  mockSent.length = 0;
  mockScheduled.clear();
  await AsyncStorage.clear();
  useOfflineStore.setState({ online: true, pending: [], conflicts: [], syncing: false });
  await setQueueOwner('maman');
  await syncAutoNotifications([]); // carte locale des relances remise à zéro
});

describe('relance 30 min', () => {
  it('la relance d’un traitement d’ENFANT n’est pas supprimée par la synchronisation des rappels', async () => {
    const planned = new Date(Date.now() + 2 * 3600_000);
    await syncAutoNotifications([dosePlan('enfant-t1', planned, 'treatment'), dosePlan('moi-t1', planned, 'my_treatment')]);
    expect(followUps()).toHaveLength(2);
    await syncLocalReminders([]); // ouverture de l'appli / rechargement des rappels
    expect(followUps().map((r) => r.content.data?.treatmentId).sort()).toEqual(['enfant-t1', 'moi-t1']);
  });

  it('« Pris » depuis la notification, HORS LIGNE : relance retirée, prise gardée en file puis envoyée une seule fois', async () => {
    const planned = new Date(Date.now() + 3600_000); planned.setSeconds(0, 0);
    await syncAutoNotifications([dosePlan('enfant-t2', planned)]);
    mockMode = 'network';
    const r = resp(TREAT_TAKEN, { source: 'treatment', treatmentId: 'enfant-t2', householdId: 'foyer', scheduledFor: planned.toISOString() }, planned.getTime());
    expect(await handleTreatmentResponse(r)).toBe(true);
    expect(followUps()).toHaveLength(0);
    const { pending } = useOfflineStore.getState();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ table: 'treatment_logs', conflict: 'treatment_id,scheduled_for', merge: true, row: { status: 'taken', household_id: 'foyer', scheduled_for: planned.toISOString() } });
    // la même réponse redélivrée (relecture au démarrage) n'est pas traitée deux fois
    expect(await handleTreatmentResponse(r)).toBe(false);
    expect(useOfflineStore.getState().pending).toHaveLength(1);
    mockMode = 'ok';
    expect(await flushQueue()).toBe(1);
    expect(await flushQueue()).toBe(0);
    expect(mockSent).toHaveLength(1);
    expect(mockSent[0].opts).toEqual({ onConflict: 'treatment_id,scheduled_for', ignoreDuplicates: false });
  });

  it('« Pris » refusé par le serveur (premium_required) : relance retirée, réponse gardée « à vérifier » avec un message clair', async () => {
    const planned = new Date(Date.now() + 3600_000); planned.setSeconds(0, 0);
    await syncAutoNotifications([dosePlan('moi-t3', planned, 'my_treatment')]);
    mockMode = 'premium';
    expect(await handleTreatmentResponse(resp(TREAT_TAKEN, { source: 'my_treatment', treatmentId: 'moi-t3', scheduledFor: planned.toISOString() }, planned.getTime()))).toBe(true);
    expect(followUps()).toHaveLength(0);
    const { pending, conflicts } = useOfflineStore.getState();
    expect(pending).toHaveLength(0);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ table: 'my_treatment_logs', premium: true, error: tr('premium.locked'), row: { user_id: 'maman', status: 'taken' } });
  });

  it('changement d’heure : « Ignorer » sur le rappel de 08:00 du 25/10 retire la relance planifiée pour cette prise', async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 25, 1, 0), doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask', 'setTimeout'] });
    try {
      const planned = new Date(2026, 9, 25, 8, 0); // heure d'hiver depuis 03:00 → 07:00 UTC
      await syncAutoNotifications([dosePlan('moi-dst', planned, 'my_treatment')]);
      expect(followUps()).toHaveLength(1);
      const deliveredAt = new Date(2026, 9, 25, 8, 0, 20).getTime(); // rappel quotidien « 08:00 » délivré à l'heure murale
      expect(doseScheduledFor(deliveredAt, '08:00')).toBe('2026-10-25T07:00:00.000Z');
      expect(doseFollowUpId('moi-dst', doseScheduledFor(deliveredAt, '08:00'))).toBe(dosePlan('moi-dst', planned).id);
      expect(await handleTreatmentResponse(resp(TREAT_SKIP, { source: 'my_treatment', treatmentId: 'moi-dst', dose: '08:00' }, deliveredAt))).toBe(true);
      expect(followUps()).toHaveLength(0);
      expect(mockSent[0].row).toMatchObject({ status: 'skipped', scheduled_for: '2026-10-25T07:00:00.000Z' });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('file hors ligne', () => {
  it('premium_required pendant l’envoi : « à vérifier », message clair, jamais renvoyé en boucle', async () => {
    useOfflineStore.setState({ online: false });
    await insertOrQueue('child_measurements', { client_id: 'm1', weight_g: 4200 });
    useOfflineStore.setState({ online: true });
    mockMode = 'premium';
    expect(await flushQueue()).toBe(0);
    const calls = (backend.insert as jest.Mock).mock.calls.length;
    expect(await flushQueue()).toBe(0); // rien à renvoyer : pas de boucle
    expect((backend.insert as jest.Mock).mock.calls.length).toBe(calls);
    const { pending, conflicts } = useOfflineStore.getState();
    expect(pending).toHaveLength(0);
    expect(conflicts[0]).toMatchObject({ id: 'm1', premium: true, error: tr('premium.locked') });
    await retryConflict('m1'); // nouvel essai explicite, toujours refusé : une seule tentative, retour « à vérifier »
    expect((backend.insert as jest.Mock).mock.calls.length).toBe(calls + 1);
    expect(useOfflineStore.getState().conflicts).toHaveLength(1);
    expect(useOfflineStore.getState().pending).toHaveLength(0);
  });

  it('serveur indisponible (503) : la saisie reste en file (pas « refusée »), avec la raison', async () => {
    mockMode = 'server';
    expect(await insertOrQueue('bottles', { client_id: 'b503', prepared_ml: 90 })).toBe('queued');
    expect(await flushQueue()).toBe(0);
    const { pending, conflicts } = useOfflineStore.getState();
    expect(conflicts).toHaveLength(0);
    expect(pending.map((p) => p.id)).toEqual(['b503']);
    mockMode = 'ok';
    expect(await flushQueue()).toBe(1);
  });

  it('ordre conservé : « Pris » puis « Ignorer » sur la même prise, coupure au milieu → envoyés dans l’ordre', async () => {
    useOfflineStore.setState({ online: false });
    const key = { treatment_id: 't', scheduled_for: '2026-11-09T07:00:00.000Z', user_id: 'maman' };
    await insertOrQueue('my_treatment_logs', { ...key, status: 'taken' }, { conflict: 'treatment_id,scheduled_for', merge: true });
    await insertOrQueue('my_treatment_logs', { ...key, status: 'skipped' }, { conflict: 'treatment_id,scheduled_for', merge: true });
    useOfflineStore.setState({ online: true });
    mockMode = (row) => (row.status === 'taken' ? 'network' : 'ok'); // la première échoue, la seconde passerait
    expect(await flushQueue()).toBe(0); // rien n'est envoyé après une coupure : l'ordre ne peut pas s'inverser
    mockMode = 'ok';
    expect(await flushQueue()).toBe(2);
    expect(mockSent.map((s) => s.row.status)).toEqual(['taken', 'skipped']); // la dernière réponse gagne
  });

  it('démarrage : une saisie faite pendant la relecture de la file n’efface ni n’est effacée', async () => {
    await AsyncStorage.setItem('toietmoi.offline.v1', JSON.stringify({ pending: [{ id: 'ancienne', table: 'bottles', row: { client_id: 'ancienne' }, queuedAt: '2026-11-09T06:00:00.000Z', owner: 'maman' }], conflicts: [] }));
    useOfflineStore.setState({ pending: [], conflicts: [] });
    const loading = loadQueue();
    const adding = enqueue('bottles', { client_id: 'nouvelle' });
    await Promise.all([loading, adding]);
    expect(useOfflineStore.getState().pending.map((p) => p.id).sort()).toEqual(['ancienne', 'nouvelle']);
    const stored = JSON.parse((await AsyncStorage.getItem('toietmoi.offline.v1'))!);
    expect(stored.pending.map((p: { id: string }) => p.id).sort()).toEqual(['ancienne', 'nouvelle']);
  });

  it('une saisie modifiée (même client_id) pendant l’envoi n’est pas perdue', async () => {
    useOfflineStore.setState({ online: false });
    await insertOrQueue('bottles', { client_id: 'b1', prepared_ml: 100 }, { merge: true });
    useOfflineStore.setState({ online: true });
    let release: () => void = () => undefined;
    let first = true;
    (backend.insert as jest.Mock).mockImplementationOnce(async (table: string, row: Record<string, unknown>, opts: unknown) => {
      if (first) { first = false; await new Promise<void>((r) => { release = r; }); }
      mockSent.push({ table, row, opts });
      return [row];
    });
    const flushing = flushQueue();
    await new Promise((r) => setTimeout(r, 5));
    await enqueue('bottles', { client_id: 'b1', prepared_ml: 150 }, { merge: true }); // correction faite pendant l'envoi
    release();
    await flushing;
    await new Promise((r) => setTimeout(r, 5));
    expect(mockSent.map((s) => s.row.prepared_ml)).toEqual([100, 150]);
    expect(useOfflineStore.getState().pending).toHaveLength(0);
  });
});

describe('limite iOS de 64 notifications en attente', () => {
  it('médicaments programmés en premier ; les rappels mis de côté le sont dès qu’il y a de la place', async () => {
    const others = Array.from({ length: 70 }, (_, i) => reminder(`r${i}`));
    const med = reminder('med', { treatment_id: 'tt', household_id: 'foyer', category: 'medication', schedule: { type: 'daily', hour: 8, minute: 0 } });
    const res = await syncLocalReminders([...others, med]);
    expect(res.skipped).toBeGreaterThan(0);
    expect(mockScheduled.size).toBeLessThanOrEqual(60);
    expect([...mockScheduled.values()].some((r) => r.content.data?.reminderId === 'med')).toBe(true);
    // 30 rappels supprimés : ceux qui n'avaient pas pu être programmés le sont maintenant
    const kept = others.slice(0, 40);
    const again = await syncLocalReminders([...kept, med]);
    expect(again.skipped).toBe(0);
    const ids = new Set([...mockScheduled.values()].map((r) => r.content.data?.reminderId));
    expect(ids.size).toBe(41);
    expect(mockScheduled.size).toBe(41);
  });

  it('notifications automatiques : rien au-delà de la limite, relances de prise prioritaires', async () => {
    for (let i = 0; i < 58; i++) mockScheduled.set(`autre-${i}`, { content: { data: { source: 'digest', kind: 'digest' } }, trigger: {} });
    const soon = new Date(Date.now() + 5 * 3600_000);
    const plans: AutoPlan[] = [
      ...Array.from({ length: 5 }, (_, i): AutoPlan => ({ id: `appt-${i}`, kind: 'appointment', at: new Date(Date.now() + 3600_000), title: 'RDV', body: '', url: '/appointments' })),
      dosePlan('prio', soon),
    ];
    const res = await syncAutoNotifications(plans);
    expect(res.scheduled).toBe(2); // 58 + 2 = 60 (marge de 4 sous 64)
    expect(followUps().map((r) => r.content.data?.treatmentId)).toEqual(['prio']);
  });
});
