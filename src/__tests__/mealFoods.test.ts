/** F-02 / F-03 (QA 02/11/2026) : aliments d'un repas reliés à « Ses découvertes », sans doublon, à la date locale. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/lib/backend', () => {
  const { createDemoBackend } = jest.requireActual('@/lib/backend/demo');
  const types = jest.requireActual('@/lib/backend/types');
  return { ...types, backend: createDemoBackend(), isDemo: true };
});
import { backend, eq } from '@/lib/backend';
import { matchFoodKey } from '@/content/discoveries/foods';
import { recordMealFoods } from '@/lib/data/hooks-discoveries';
import { toISODate } from '@/lib/domain/dates';

it('reconnaît les aliments du catalogue en français et en anglais', () => {
  const k = matchFoodKey('Brocoli');
  expect(k).toBeTruthy();
  expect(matchFoodKey('brocolis')).toBe(k);
  expect(matchFoodKey('Broccoli')).toBe(k);
  expect(matchFoodKey('Plat inventé')).toBeNull();
});

it('repas : clé du catalogue enregistrée, pas de doublon, aliments hors catalogue gardés', async () => {
  await backend.auth.signUp('repas@exemple.test', 'MotDePasse!2026');
  const hid = await backend.rpc<string>('create_household', { p_name: 'Test' });
  const [child] = await backend.insert<{ id: string; household_id: string }>('children', { household_id: hid, first_name: 'Lina', birth_date: '2026-03-01' });
  const date = '2026-11-03';
  const before = (await backend.select<{ id: string }>({ table: 'food_introductions', filters: [eq('child_id', child.id)] })).length;
  await recordMealFoods(child, ['Brocoli', 'brocolis', 'Plat de mamie'], date, null);
  const rows = await backend.select<{ food_key: string | null; food_name: string; first_tried_on: string }>({ table: 'food_introductions', filters: [eq('child_id', child.id)] });
  const added = rows.slice(before);
  expect(added.map((r) => r.food_key)).toEqual([matchFoodKey('Brocoli'), null]);
  expect(added.every((r) => r.first_tried_on === date)).toBe(true);
  // un second repas avec le même aliment n'ajoute rien
  expect(await recordMealFoods(child, ['Brocoli'], date, null)).toBe(0);
});

it('date locale : un repas à 0 h 15 compte pour le jour même', () => {
  const d = new Date(2026, 10, 3, 0, 15);
  expect(toISODate(d)).toBe('2026-11-03');
});
