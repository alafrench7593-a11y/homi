/** Espace « Moi aussi » : règles utilisées par les écrans humeur, documents, notifications et rendez-vous. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/lib/notifications', () => ({ syncLocalReminders: jest.fn(async () => ({ scheduled: 0, skipped: 0 })) }));

import { createDemoBackend } from '@/lib/backend/demo';
import { BackendError, eq, isNull } from '@/lib/backend/types';
import { leadOf, reminderAt } from '@/lib/data/hooks-me';
import type { AppNotification, MoodCheckin, Reminder } from '@/lib/types';

describe('espace Moi aussi (moteur local)', () => {
  const db = createDemoBackend();
  let household = '';

  beforeAll(async () => {
    await db.auth.signUp('moi@exemple.test', 'MotDePasse!2026');
    household = await db.rpc<string>('create_household', { p_name: 'Moi' });
  });

  it('bilan d’humeur privé, puis suppression', async () => {
    const [m] = await db.insert<MoodCheckin>('mood_checkins', { checked_at: new Date().toISOString(), mood: 1, feelings: ['Fatigue'], safety_concern: true, journal: null });
    expect(m.safety_concern).toBe(true);
    expect(await db.select({ table: 'mood_checkins' })).toHaveLength(1);
    await db.remove('mood_checkins', [eq('id', m.id)]);
    expect(await db.select({ table: 'mood_checkins' })).toHaveLength(0);
  });

  it('quota de documents de la version gratuite', async () => {
    const limit = await db.rpc<number>('plan_limit', { p_key: 'documents_count' });
    expect(limit).toBe(15);
    const rows = Array.from({ length: limit }, (_, i) => ({ household_id: household, category: 'other', title: `Doc ${i}`, storage_path: `${household}/${i}.pdf`, mime_type: 'application/pdf', size_bytes: 10 }));
    await db.insert('documents', rows);
    const err = await db.insert('documents', { ...rows[0], storage_path: `${household}/extra.pdf` }).catch((e) => e);
    expect(err).toBeInstanceOf(BackendError);
    expect((err as BackendError).isPremiumRequired).toBe(true);
  });

  it('notifications : tout marquer comme lu', async () => {
    await db.rpc('admin_broadcast', { p_title: 'Bienvenue', p_body: 'Test' });
    await db.rpc('admin_broadcast', { p_title: 'Deuxième', p_body: 'Test', p_deep_link: '/me' });
    const me = (await db.auth.getSession())!.userId;
    await db.update('notifications', { read_at: new Date().toISOString() }, [eq('user_id', me), isNull('read_at')]);
    const all = await db.select<AppNotification>({ table: 'notifications' });
    expect(all.length).toBe(2);
    expect(all.every((n) => n.read_at)).toBe(true);
  });

  it('rappel ponctuel avant un rendez-vous', async () => {
    const starts = '2030-03-10T09:00:00.000Z';
    expect(reminderAt(starts, 1440)).toBe('2030-03-09T09:00:00.000Z');
    const [r] = await db.insert<Reminder>('reminders', { category: 'appointment', title: 'Écho', schedule: { type: 'once', at: reminderAt(starts, 180) }, enabled: true, appointment_id: 'a1' });
    expect(leadOf(r, starts)).toBe(180);
    expect(leadOf(undefined, starts)).toBe(0);
  });
});
