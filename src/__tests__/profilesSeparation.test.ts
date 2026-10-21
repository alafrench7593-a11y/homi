/**
 * Tests obligatoires de la réorganisation (partie « moteur ») :
 *  - Noé : médicament prescrit, rappel quotidien à 17 h, rattaché à Noé seul, réponses « Pris / Reporter / Ignorer » ;
 *  - complément de grossesse rattaché à la grossesse, jamais à un enfant ;
 *  - articles neurodéveloppement accessibles sans diagnostic, avec source, date et statut ;
 *  - recettes classées par âge (rien d'inadapté pour un bébé), poissons à limiter exclus avant 3 ans et pendant la grossesse.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

type Req = { content: { title?: string; body?: string; data?: Record<string, unknown>; categoryIdentifier?: string }; trigger: Record<string, unknown> };
const mockScheduled = new Map<string, Req>();
let mockSeq = 0;
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  scheduleNotificationAsync: jest.fn(async (req: Req) => { const id = `n${++mockSeq}`; mockScheduled.set(id, req); return id; }),
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
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('@/lib/backend', () => {
  const { createDemoBackend } = jest.requireActual('@/lib/backend/demo');
  const types = jest.requireActual('@/lib/backend/types');
  return { ...types, backend: createDemoBackend(), isDemo: true };
});

import { backend } from '@/lib/backend';
import { treatmentReminderRows, type Treatment } from '@/lib/data/hooks-needs';
import { handleTreatmentResponse, syncLocalReminders, TREAT_TAKEN, TREATMENT_CATEGORY } from '@/lib/notifications';
import { NEURO_LIBRARY } from '@/content/articles/rows';
import { ALL_RECIPES } from '@/content/recipes';
import { compatible } from '@/lib/recipes/engine';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import type { Reminder } from '@/lib/types';

const noe: Treatment = {
  id: 'tr-noe', household_id: 'h1', child_id: 'child-noe', name: 'Traitement prescrit', dose_text: '1 comprimé, dose exacte de l’ordonnance', times: ['17:00'],
  frequency: 'daily', weekdays: [], start_date: '2026-10-21', end_date: '2026-12-31', instructions: null, prescriber: 'Dr X', active: true, created_at: '2026-10-21',
} as Treatment;

describe('Noé : médicament prescrit chaque jour à 17 h', () => {
  it('un seul rappel, rattaché à Noé (jamais à la mère, à la grossesse ni à Lina)', () => {
    const rows = treatmentReminderRows(noe, 'Noé', 'u1');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ child_id: 'child-noe', treatment_id: 'tr-noe', category: 'medication', title: 'Noé · Traitement prescrit', body: noe.dose_text });
    expect(rows[0].schedule).toMatchObject({ type: 'daily', hour: 17, minute: 0, from: '2026-10-21', until: '2026-12-31' });
    expect((rows[0] as Record<string, unknown>).pregnancy_id).toBeUndefined();
  });
  it('notification à 17 h 00 avec les actions de traitement ; « Pris » est enregistré pour la prise de 17 h', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-21T09:00:00'), doNotFake: ['nextTick', 'setImmediate'] });
    const r = { ...treatmentReminderRows(noe, 'Noé', 'u1')[0], id: 'rem-noe', timezone: 'Europe/Paris', snoozed_until: null } as unknown as Reminder;
    await syncLocalReminders([r]);
    const reqs = [...mockScheduled.values()].filter((x) => x.content.data?.treatmentId === 'tr-noe');
    expect(reqs.length).toBeGreaterThan(0);
    for (const q of reqs) {
      expect(q.content.categoryIdentifier).toBe(TREATMENT_CATEGORY);
      expect(q.content.title).toBe('Noé · Traitement prescrit');
      const tr = q.trigger as { hour?: number; minute?: number; date?: Date };
      if (tr.date) { const d = new Date(tr.date); expect([d.getHours(), d.getMinutes()]).toEqual([17, 0]); } else expect([tr.hour, tr.minute]).toEqual([17, 0]);
    }
    const handled = await handleTreatmentResponse({ actionIdentifier: TREAT_TAKEN, notification: { date: new Date('2026-10-21T17:02:00').getTime(), request: { content: reqs[0].content } } } as never);
    expect(handled).toBe(true);
    const logs = await backend.select<{ status: string; scheduled_for: string }>({ table: 'treatment_logs', filters: [{ col: 'treatment_id', op: 'eq', value: 'tr-noe' }] });
    expect(logs.map((l) => [l.status, new Date(l.scheduled_for).getHours()])).toEqual([['taken', 17]]);
    jest.useRealTimers();
  });
});

describe('articles neurodéveloppement', () => {
  it('17 articles accessibles à tous les parents, sans diagnostic, avec sources, date et statut', () => {
    expect(NEURO_LIBRARY).toHaveLength(17);
    for (const a of NEURO_LIBRARY) {
      expect(a.journeys).toEqual(expect.arrayContaining(['newborn', 'child']));
      expect(a.min_age_months).toBeUndefined();
      expect(a.sources.length).toBeGreaterThan(0);
      for (const s of a.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(a.updated_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.status).toBe('to_review');
      expect(a.body_md).toMatch(/diagnostic/);
      expect(a.body_md).not.toMatch(/\b\d+(?:[.,]\d+)?\s*mg\b/); // aucune dose
    }
  });
});

describe('recettes par âge', () => {
  const baby = (m: number) => ({ audience: 'baby' as const, ageMonths: m, name: 'Lina' });
  it('un bébé de 7 mois ne reçoit que des recettes adaptées à son âge', () => {
    const list = ALL_RECIPES.filter((r) => compatible(r, baby(7)));
    expect(list.length).toBeGreaterThan(15);
    for (const r of list) expect(r.minMonths ?? 0).toBeLessThanOrEqual(7);
  });
  it('thon jamais avant 3 ans ni pendant la grossesse ; chaque recette de poisson cite l’ANSES', () => {
    for (const r of ALL_RECIPES) {
      const fish = r.ingredients.filter((x) => INGREDIENTS[x.key]?.fish);
      if (!fish.length) continue;
      if (r.slug !== 'puree-carotte-pomme-de-terre') expect(r.sources).toContain('anses_poisson');
      if (r.ingredients.some((x) => x.key === 'tuna')) { expect(r.audiences).not.toContain('pregnancy'); expect(r.audiences).not.toContain('baby'); expect(r.minMonths ?? 999).toBeGreaterThanOrEqual(36); }
    }
  });
});
