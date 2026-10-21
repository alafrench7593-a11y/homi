/**
 * Appels effectués par les écrans « famille » (profil enfant, prénoms, listes,
 * modification de grossesse) sur le moteur local de démonstration.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { BackendError, eq } from '@/lib/backend/types';
import type { Checklist, Child, NameFavorite, NameVote, Pregnancy } from '@/lib/types';

describe('écrans famille (mode démonstration)', () => {
  const db = createDemoBackend();
  let household = '';
  let child: Child;
  let userId = '';

  beforeAll(async () => {
    await db.auth.signUp('famille@exemple.test', 'MotDePasse!2026');
    userId = (await db.auth.getSession())!.userId;
    household = await db.rpc<string>('create_household', { p_name: 'Famille' });
    [child] = await db.insert<Child>('children', { household_id: household, first_name: 'Iris', birth_date: '2025-09-01', enabled_tracking: [], allergies_declared: [], archived: false });
  });

  it('limite gratuite : 3 enfants puis premium_required', async () => {
    expect(await db.rpc<number>('plan_limit', { p_key: 'children_count' })).toBe(3);
    await db.insert('children', { household_id: household, first_name: 'Malo', birth_date: '2023-01-01' });
    await db.insert('children', { household_id: household, first_name: 'Lou', birth_date: '2022-01-01' });
    const err = await db.insert('children', { household_id: household, first_name: 'Zoé', birth_date: '2021-01-01' }).catch((e) => e);
    expect(err).toBeInstanceOf(BackendError);
    expect((err as BackendError).isPremiumRequired).toBe(true);
  });

  it('mesures, étapes, santé et diversification rattachées à l’enfant', async () => {
    await db.insert('child_measurements', { child_id: child.id, household_id: child.household_id, measured_on: '2026-01-01', weight_kg: 7.2, height_cm: null, head_cm: null, source: 'professional', note: null });
    await db.insert('child_milestones', { child_id: child.id, household_id: child.household_id, kind: 'milestone', title: 'Premier sourire', happened_on: '2025-10-20', note: null });
    const [h] = await db.insert<{ id: string; done_on: string | null }>('child_health_items', { child_id: child.id, household_id: child.household_id, kind: 'vaccine_to_check', label: 'Rappel', details: null, due_on: null, done_on: null });
    await db.update('child_health_items', { done_on: '2026-02-01' }, [eq('id', h.id)]);
    await db.rpc('set_demo_subscription', { state: 'active', expires_in_days: 30 }); // suivi de la diversification : Premium
    await db.insert('food_introductions', { child_id: child.id, household_id: child.household_id, food_name: 'Courgette', first_tried_on: '2026-03-01', reaction_note: null });
    await db.rpc('set_demo_subscription', { active: false });
    for (const t of ['child_measurements', 'child_milestones', 'child_health_items', 'food_introductions']) {
      expect(await db.select({ table: t, filters: [eq('child_id', child.id)] })).toHaveLength(1);
    }
  });

  it('modification puis suppression du profil enfant (cascade)', async () => {
    await db.update('children', { first_name: 'Iris-Lou', allergies_declared: ['arachide'] }, [eq('id', child.id)]);
    const [updated] = await db.select<Child>({ table: 'children', filters: [eq('id', child.id)] });
    expect(updated.first_name).toBe('Iris-Lou');
    await db.remove('children', [eq('id', child.id)]);
    expect(await db.select({ table: 'child_milestones', filters: [eq('child_id', child.id)] })).toHaveLength(0);
    expect(await db.select({ table: 'food_introductions', filters: [eq('child_id', child.id)] })).toHaveLength(0);
  });

  it('prénoms : favori, vote puis changement de vote sans doublon', async () => {
    const [fav] = await db.insert<NameFavorite>('name_favorites', { household_id: household, name: 'Alix', list_label: 'Favoris', added_by: userId });
    await db.insert('name_votes', { favorite_id: fav.id, household_id: household, user_id: userId, vote: 1 });
    await db.update('name_votes', { vote: -1 }, [eq('favorite_id', fav.id), eq('user_id', userId)]);
    const votes = await db.select<NameVote>({ table: 'name_votes', filters: [eq('household_id', household)] });
    expect(votes).toHaveLength(1);
    expect(votes[0].vote).toBe(-1);
  });

  it('listes : 4 listes gratuites, éléments cochés, suppression en cascade', async () => {
    expect(await db.rpc<number>('plan_limit', { p_key: 'checklists_count' })).toBe(4);
    const created: Checklist[] = [];
    for (let i = 0; i < 4; i++) created.push((await db.insert<Checklist>('checklists', { household_id: household, kind: 'custom', title: `Liste ${i}` }))[0]);
    await expect(db.insert('checklists', { household_id: household, kind: 'custom', title: 'Une de trop' })).rejects.toMatchObject({ hint: 'premium_required' });
    const [item] = await db.insert<{ id: string; household_id: string }>('checklist_items', { checklist_id: created[0].id, label: 'Siège auto', position: 0 });
    expect(item.household_id).toBe(household);
    await db.update('checklist_items', { done: true, done_by: userId }, [eq('id', item.id)]);
    await db.remove('checklists', [eq('id', created[0].id)]);
    expect(await db.select({ table: 'checklist_items', filters: [eq('checklist_id', created[0].id)] })).toHaveLength(0);
  });

  it('grossesse : changement de terme, de nombre de bébés, puis naissance', async () => {
    const [p] = await db.insert<Pregnancy>('pregnancies', { household_id: household, due_date: '2027-01-20', multiplicity: 'single', status: 'active' });
    await db.insert('expected_babies', { pregnancy_id: p.id, position: 1, nickname: null });
    await db.update('pregnancies', { due_date: '2027-01-25', multiplicity: 'twins' }, [eq('id', p.id)]);
    await db.insert('expected_babies', { pregnancy_id: p.id, household_id: household, position: 2, nickname: 'Petit Soleil' });
    expect(await db.select({ table: 'expected_babies', filters: [eq('pregnancy_id', p.id)] })).toHaveLength(2);
    await db.update('pregnancies', { status: 'born', ended_on: '2027-01-24' }, [eq('id', p.id)]);
    const [after] = await db.select<Pregnancy>({ table: 'pregnancies', filters: [eq('id', p.id)] });
    expect(after.status).toBe('born');
  });
});
