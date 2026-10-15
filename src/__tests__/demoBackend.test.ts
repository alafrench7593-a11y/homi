/**
 * Parcours de bout en bout sur le moteur local (mode démonstration) :
 * mêmes appels que l'application, mêmes règles métier.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import type { Bottle, Child, FeedPost, Pregnancy, Reminder } from '@/lib/types';

describe('moteur local : parcours essentiels', () => {
  const db = createDemoBackend();
  let household = '';
  let childA: Child;

  it('inscription et connexion', async () => {
    await db.auth.signUp('test@exemple.test', 'MotDePasse!2026');
    expect((await db.auth.getSession())?.email).toBe('test@exemple.test');
    await db.auth.signOut();
    await expect(db.auth.signIn('test@exemple.test', 'faux')).rejects.toThrow(/incorrect/);
    await db.auth.signIn('test@exemple.test', 'MotDePasse!2026');
    const [profile] = await db.select<{ onboarding_completed: boolean }>({ table: 'profiles' });
    expect(profile.onboarding_completed).toBe(false);
  });

  it('création d’une grossesse de jumeaux et de plusieurs enfants', async () => {
    household = await db.rpc<string>('create_household', { p_name: 'Test' });
    const [p] = await db.insert<Pregnancy>('pregnancies', { household_id: household, due_date: '2027-01-20', multiplicity: 'twins', status: 'active' });
    await db.insert('expected_babies', [{ pregnancy_id: p.id, position: 1, nickname: 'A' }, { pregnancy_id: p.id, position: 2, nickname: 'B' }]);
    expect(await db.select({ table: 'expected_babies', filters: [eq('household_id', household)] })).toHaveLength(2);
    [childA] = await db.insert<Child>('children', { household_id: household, first_name: 'Iris', birth_date: '2026-09-01' });
    await db.insert('children', { household_id: household, first_name: 'Malo', birth_date: '2023-01-01' });
    expect(await db.select({ table: 'children' })).toHaveLength(2);
  });

  it('biberon, couche, poids et historique', async () => {
    await db.insert('bottles', { child_id: childA.id, at: new Date().toISOString(), prepared_ml: 120, consumed_ml: 90, client_id: 'c1' });
    await db.insert('bottles', { child_id: childA.id, at: new Date().toISOString(), prepared_ml: 120, client_id: 'c1' }, { onConflict: 'client_id', ignoreDuplicates: true });
    const bottles = await db.select<Bottle>({ table: 'bottles' });
    expect(bottles).toHaveLength(1); // idempotent
    expect(bottles[0].household_id).toBe(household); // rattaché au foyer de l'enfant
    await expect(db.insert('bottles', { child_id: childA.id, at: new Date().toISOString(), prepared_ml: 50, consumed_ml: 90 })).rejects.toThrow(/dépasser/);
    await db.insert('diapers', { child_id: childA.id, at: new Date().toISOString(), wet: true, stool: false });
    await db.insert('maternal_weights', { measured_on: '2026-10-15', weight_kg: 64.5 });
    expect(await db.select({ table: 'maternal_weights' })).toHaveLength(1);
  });

  it('démarrage et arrêt d’un sommeil', async () => {
    const [s] = await db.insert<{ id: string }>('sleeps', { child_id: childA.id, started_at: new Date(Date.now() - 3600_000).toISOString() });
    await expect(db.insert('sleeps', { child_id: childA.id, started_at: new Date().toISOString() })).rejects.toThrow(/déjà en cours/);
    await db.update('sleeps', { ended_at: new Date().toISOString() }, [eq('id', s.id)]);
    const open = (await db.select<{ ended_at: string | null }>({ table: 'sleeps' })).filter((x) => !x.ended_at);
    expect(open).toHaveLength(0);
  });

  it('création, modification et désactivation d’un rappel', async () => {
    const [r] = await db.insert<Reminder>('reminders', { category: 'bottle', title: 'Biberon', schedule: { type: 'daily', hour: 7, minute: 0 }, enabled: true });
    await db.update('reminders', { title: 'Biberon du matin' }, [eq('id', r.id)]);
    await db.update('reminders', { enabled: false }, [eq('id', r.id)]);
    const [after] = await db.select<Reminder>({ table: 'reminders' });
    expect(after.title).toBe('Biberon du matin');
    expect(after.enabled).toBe(false);
  });

  it('communauté : pseudonyme requis, publication, signalement', async () => {
    const forum = (await db.select<{ id: string }>({ table: 'forums' }))[0];
    await expect(db.insert('posts', { forum_id: forum.id, title: 'Bonjour', body: 'Test' })).rejects.toThrow(/pseudonyme/);
    await db.insert('community_profiles', { user_id: (await db.auth.getSession())!.userId, pseudonym: 'Testeuse' });
    await db.insert('posts', { forum_id: forum.id, title: 'Bonjour', body: 'Premier message' });
    const mine = (await db.select<FeedPost>({ table: 'forum_feed' })).filter((p) => p.is_mine);
    expect(mine).toHaveLength(1);
    expect(mine[0].pseudonym).toBe('Testeuse');
    const other = (await db.select<FeedPost>({ table: 'forum_feed' })).find((p) => !p.is_mine)!;
    await db.insert('reports', { post_id: other.id, reason: 'spam' });
    await expect(db.insert('reports', { post_id: other.id, reason: 'spam' })).rejects.toThrow(/déjà signalé/);
  });

  it('abonnement : quotas gratuits puis droits premium (mode test)', async () => {
    expect(await db.rpc('has_premium')).toBe(false);
    await db.insert('consents', { purpose: 'ai_assistant', granted: true, version: '1' });
    for (let i = 0; i < 5; i++) await db.invoke('assistant', { message: 'Comment préparer la valise de maternité ?' });
    await expect(db.invoke('assistant', { message: 'Encore une question sur la valise' })).rejects.toThrow(/questions de ce mois/);
    await db.rpc('set_demo_subscription', { active: true, period: 'annual' });
    expect(await db.rpc('has_premium')).toBe(true);
    const out = await db.invoke<{ answer: string; sources: unknown[] }>('assistant', { message: 'Comment préparer la valise de maternité ?' });
    expect(out.sources.length).toBeGreaterThan(0);
  });

  it('l’assistant oriente vers les secours sans consommer de quota', async () => {
    const out = await db.invoke<{ safety: string; answer: string }>('assistant', { message: 'Je pense au suicide' });
    expect(out.safety).toBe('crisis');
    expect(out.answer).toContain('3114');
  });

  it('scanner : produit fictif, précautions grossesse et rappel officiel', async () => {
    const out = await db.invoke<{ found: boolean; recalls: unknown[]; product: { is_demo: boolean }; assessment: { findings: { level: string }[] } }>('product-lookup', { barcode: '0000000000024', context: { pregnant: true } });
    expect(out.found).toBe(true);
    expect(out.product.is_demo).toBe(true);
    expect(out.recalls).toHaveLength(1);
    expect(out.assessment.findings.some((f) => f.level === 'avoid_advised')).toBe(true);
  });

  it('export puis suppression du compte', async () => {
    const data = await db.rpc<{ households: unknown[] }>('export_my_data');
    expect(data.households).toHaveLength(1);
    await db.invoke('delete-account', { confirm: 'SUPPRIMER' });
    expect(await db.auth.getSession()).toBeNull();
    await expect(db.auth.signIn('test@exemple.test', 'MotDePasse!2026')).rejects.toThrow();
  });
});
