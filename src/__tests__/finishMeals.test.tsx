/**
 * Menu de la semaine, « Que puis-je cuisiner ? », Classements et Vaccins (23/11/2026) : fonctions pures de
 * src/lib/domain/finishMeals.ts, puis écrans Vaccins et Garde-manger sur le backend de démo (fiche dans le Tray
 * ouverte depuis l'adresse, valeur provisoire, Annuler, Enregistrer gardé, ligne réellement corrigée).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const state = { params: {} as Record<string, string | undefined> };
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn((p: Record<string, string | undefined>) => { Object.assign(state.params, p); }) };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: true })), requestPermissionsAsync: jest.fn(async () => ({ granted: true })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-local-authentication', () => ({ hasHardwareAsync: jest.fn(async () => false), isEnrolledAsync: jest.fn(async () => false), authenticateAsync: jest.fn(async () => ({ success: true })) }));

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { backend } from '@/lib/backend';
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Vaccines from '@/app/child/[id]/vaccines';
import Pantry from '@/app/meals/pantry';
import Menu from '@/app/meals/menu';
import { loadEmbeddedRecipes, visibleRecipes } from '@/lib/data/hooks-recipes';
import { addDays, todayISO } from '@/lib/domain/dates';
import {
  menuDayDate, menuDayIndex, menuDays, pantryRows, parseSlotKey, preferenceOf, preferenceSteps, savedItemOf, slotKey, slotPatch, stockPatch,
  todayMenu, vaccineFacts, vaccinationsByDate, vaccinePatch, vaccinesOn, type VaccinationLike,
} from '@/lib/domain/finishMeals';
import type { Child } from '@/lib/types';

describe('menu (logique)', () => {
  it('jour du menu gardé dans l’adresse, borné ; sans paramètre : aujourd’hui s’il est couvert, sinon le premier', () => {
    expect(menuDayIndex('3', 7, null, '2026-11-23')).toBe(3);
    expect(menuDayIndex('9', 7, null, '2026-11-23')).toBe(0);
    expect(menuDayIndex('-1', 7, '2026-11-20', '2026-11-23')).toBe(3);
    expect(menuDayIndex(undefined, 7, '2026-11-20', '2026-11-23')).toBe(3);
    expect(menuDayIndex(undefined, 3, '2026-11-01', '2026-11-23')).toBe(0);
    expect(menuDayDate('2026-11-30', 2)).toBe('2026-12-02');
    expect(menuDayDate(null, 2)).toBeNull();
  });
  it('un repère par jour : nombre de repas, null (jamais 0) si rien de prévu', () => {
    const slots = [{ day: 0, meal: 'lunch', recipeId: 'rcp-a', servings: 2 }, { day: 0, meal: 'dinner', recipeId: 'rcp-b', servings: 2 }, { day: 2, meal: 'lunch', recipeId: 'rcp-c', servings: 2 }];
    expect(menuDays(slots, 3).map((d) => d.count)).toEqual([2, null, 1]);
    expect(menuDays(slots, 3)[0].recipeIds).toEqual(['rcp-a', 'rcp-b']);
  });
  it('repas ouvert dans l’adresse ; ligne enregistrée retrouvée seulement si jour, repas ET recette concordent', () => {
    expect(slotKey({ day: 2, meal: 'dinner' })).toBe('2-dinner');
    expect(parseSlotKey('2-dinner')).toEqual({ day: 2, meal: 'dinner' });
    expect(parseSlotKey('x-dinner')).toBeNull();
    const items = [{ id: 'i1', day: 1, meal: 'lunch', recipe_slug: 'a', servings: 2, note: null }];
    expect(savedItemOf(items, { day: 1, meal: 'lunch', recipeId: 'rcp-a', servings: 2 })?.id).toBe('i1');
    expect(savedItemOf(items, { day: 1, meal: 'lunch', recipeId: 'rcp-b', servings: 2 })).toBeNull();
  });
  it('correction : seules les colonnes changées ; personnes 1 à 12 entières', () => {
    expect(slotPatch({ servings: 2, note: undefined }, { servings: '4', note: '' })).toEqual({ ok: true, patch: { servings: 4 } });
    expect(slotPatch({ servings: 2, note: 'x' }, { servings: '2', note: '  ' })).toEqual({ ok: true, patch: { note: null } });
    expect(slotPatch({ servings: 2 }, { servings: '0', note: '' }).ok).toBe(false);
    expect(slotPatch({ servings: 2 }, { servings: '2.5', note: '' }).ok).toBe(false);
    expect(slotPatch({ servings: 2 }, { servings: '', note: '' }).ok).toBe(false);
  });
  it('remontée : repas prévus aujourd’hui seulement (aucun → null)', () => {
    const items = [{ id: 'a', day: 1, meal: 'lunch', recipe_slug: 'x', servings: 2, note: null }];
    expect(todayMenu({ start_date: '2026-11-22', days: 7 }, items, '2026-11-23')?.day).toBe(1);
    expect(todayMenu({ start_date: '2026-11-23', days: 7 }, items, '2026-11-23')).toBeNull();
    expect(todayMenu(null, items, '2026-11-23')).toBeNull();
  });
});

describe('garde-manger, classements (logique)', () => {
  const st = (id: string, key: string | null, qty: number | string | null, at: string) => ({ id, ingredient_key: key, qty_estimate: qty, notes: null, created_at: at, updated_at: at });
  it('ingrédients à la maison, du plus récent ; à zéro ou sans ingrédient : exclus', () => {
    const rows = pantryRows([st('a', 'carotte', null, '2026-11-20T10:00:00Z'), st('b', 'riz', 0, '2026-11-22T10:00:00Z'), st('c', null, 3, '2026-11-23T10:00:00Z'), st('d', 'pates', '2', '2026-11-21T10:00:00Z')]);
    expect(rows.map((r) => r.id)).toEqual(['d', 'a']);
  });
  it('correction de quantité : vide = non comptée, jamais ≤ 0', () => {
    expect(stockPatch({ qty_estimate: null, notes: null }, { qty: '3', note: '' })).toEqual({ ok: true, patch: { qty_estimate: 3 } });
    expect(stockPatch({ qty_estimate: '3', notes: null }, { qty: '3', note: 'placard' })).toEqual({ ok: true, patch: { notes: 'placard' } });
    expect(stockPatch({ qty_estimate: 3, notes: null }, { qty: '', note: '' })).toEqual({ ok: true, patch: { qty_estimate: null } });
    expect(stockPatch({ qty_estimate: 3, notes: null }, { qty: '0', note: '' }).ok).toBe(false);
    expect(stockPatch({ qty_estimate: 3, notes: null }, { qty: 'abc', note: '' }).ok).toBe(false);
  });
  it('préférence : jamais favorite ET écartée ; bascules minimales', () => {
    expect(preferenceOf('a', ['a'], [])).toBe(0);
    expect(preferenceOf('a', [], ['a'])).toBe(2);
    expect(preferenceOf('a', [], [])).toBe(1);
    expect(preferenceSteps(0, 2)).toEqual({ favorite: true, dislike: true });
    expect(preferenceSteps(1, 0)).toEqual({ favorite: true, dislike: false });
    expect(preferenceSteps(2, 2)).toEqual({ favorite: false, dislike: false });
  });
});

describe('vaccins (logique)', () => {
  const v: VaccinationLike = { id: 'v', vaccine: 'Hexavalent', given_on: '2026-06-10', dose_label: '1re dose', lot: null, given_by: null, source: 'carnet', note: null };
  it('registre du plus récent ; faits notés, doses faites / prévues / reportées', () => {
    expect(vaccinationsByDate([v, { ...v, id: 'w', given_on: '2026-08-10' }]).map((x) => x.id)).toEqual(['w', 'v']);
    expect(vaccineFacts([v, { ...v, given_on: '2026-08-10' }], [{ state: 'done' }, { state: 'planned' }, { state: 'postponed' }, { state: 'later' }]))
      .toEqual({ count: 2, last: '2026-08-10', done: 1, planned: 1, postponed: 1 });
    expect(vaccineFacts([], null)).toEqual({ count: 0, last: null, done: 0, planned: 0, postponed: 0 });
  });
  it('correction : date obligatoire, jamais future ni avant la naissance ; seules les colonnes changées', () => {
    const d = { date: '12/06/2026', dose: '1re dose', lot: ' A12 ', by: '', source: '1', note: '' };
    expect(vaccinePatch(v, d, '2026-11-23', '2026-04-01')).toEqual({ ok: true, patch: { given_on: '2026-06-12', lot: 'A12', source: 'professional' } });
    expect(vaccinePatch(v, { ...d, date: '' }, '2026-11-23', null)).toEqual({ ok: false, reason: 'format' });
    expect(vaccinePatch(v, { ...d, date: '24/11/2026' }, '2026-11-23', null)).toEqual({ ok: false, reason: 'future' });
    expect(vaccinePatch(v, { ...d, date: '01/03/2026' }, '2026-11-23', '2026-04-01')).toEqual({ ok: false, reason: 'before' });
  });
  it('remontée : vaccins notés et rendez-vous non faits du jour seulement', () => {
    const on = vaccinesOn([v, { ...v, id: 't', given_on: '2026-11-23' }], [{ starts_at: '2026-11-23T09:00:00', completed_at: null }, { starts_at: '2026-11-23T10:00:00', completed_at: '2026-11-23T10:30:00' }], '2026-11-23', (s) => s.slice(0, 10));
    expect(on.given.map((x) => x.id)).toEqual(['t']);
    expect(on.appts).toHaveLength(1);
  });
});

// ------------------------------------------------------------------ écrans
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<GestureHandlerRootView><QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider></GestureHandlerRootView>); });
  await flush(300);
  return r;
}
async function until(cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(100); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, v: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`champ introuvable : ${id}`);
  await act(async () => { el.props.onChangeText(v); });
}
const disabled = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function').some((n) => n.props.disabled === true || n.props.accessibilityState?.disabled === true);
const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string | undefined> } }).__state.params;
const setParams = (p: Record<string, string>) => { for (const k of Object.keys(params)) delete params[k]; Object.assign(params, p); };
const fr = (iso: string) => iso.split('-').reverse().join('/');

jest.setTimeout(60000);

describe(`écrans (${Platform.OS})`, () => {
  let child: Child; let hid = '';
  beforeAll(async () => {
    await backend.auth.signUp(`finish.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test repas vaccins' });
    [child] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: addDays(todayISO(), -300), enabled_tracking: [] });
  });
  // minuteries des feuilles (fermeture différée) : laissées s'écouler avant la fin de l'environnement
  afterAll(async () => { await flush(1000); });

  it('vaccins : registre daté, fiche ouverte depuis l’adresse, date provisoire refusée dans le futur, Annuler, correction écrite', async () => {
    const [vx] = await backend.insert<{ id: string }>('child_vaccinations', { household_id: hid, child_id: child.id, vaccine: 'Hexavalent', given_on: addDays(todayISO(), -200), dose_label: '1re dose', source: 'carnet' });
    setParams({ id: child.id });
    const r = await render(<Vaccines />);
    await until(() => has(r, `fm-vx-row-${vx.id}`));
    expect(has(r, 'fm-vx-hero-value')).toBe(true);
    expect(allText(r)).toMatch(/vaccin noté/);
    // ouvrir la ligne → la fiche est gardée dans l'adresse
    await press(r, `fm-vx-row-${vx.id}`);
    expect(params.vax).toBe(vx.id);
    r.unmount(); // l'adresse simulée n'est pas réactive : on rouvre l'écran avec « ?vax= »
    const r2 = await render(<Vaccines />);
    await until(() => has(r2, 'fm-vx-tray'));
    await press(r2, 'fm-vx-tray-fix');
    // date future : refusée, Enregistrer verrouillé
    await type(r2, 'fm-vx-tray-edit-date', fr(addDays(todayISO(), 2)));
    expect(has(r2, 'fm-vx-tray-edit-provisional')).toBe(true);
    expect(has(r2, 'fm-vx-tray-edit-invalid')).toBe(true);
    expect(disabled(r2, 'fm-vx-tray-edit-save')).toBe(true);
    // Annuler restitue l'original : rien n'est écrit
    await press(r2, 'fm-vx-tray-edit-cancel');
    const [same] = await backend.select<{ given_on: string }>({ table: 'child_vaccinations', filters: [eq('id', vx.id)] });
    expect(same.given_on).toBe(addDays(todayISO(), -200));
    // correction valable
    await press(r2, 'fm-vx-tray-fix');
    await type(r2, 'fm-vx-tray-edit-date', fr(addDays(todayISO(), -190)));
    await type(r2, 'fm-vx-tray-edit-lot', 'AB123');
    await press(r2, 'fm-vx-tray-edit-save', 700);
    const [fixed] = await backend.select<{ given_on: string; lot: string | null; vaccine: string }>({ table: 'child_vaccinations', filters: [eq('id', vx.id)] });
    expect(fixed).toMatchObject({ given_on: addDays(todayISO(), -190), lot: 'AB123', vaccine: 'Hexavalent' });
    r2.unmount();
  });

  it('garde-manger : ingrédients datés, fiche (?item=), quantité provisoire, correction gardée par version', async () => {
    const [s] = await backend.insert<{ id: string }>('household_stocks', { household_id: hid, label: 'Carotte', category: 'food', ingredient_key: 'carrot', source: 'pantry' });
    setParams({ item: s.id });
    const r = await render(<Pantry />);
    await until(() => has(r, `fm-pantry-row-${s.id}`) && has(r, 'fm-pantry-tray'));
    expect(has(r, 'hm-pantry-hero-value')).toBe(true);
    await press(r, 'fm-pantry-tray-fix');
    await type(r, 'fm-pantry-tray-edit-qty', '0');
    expect(disabled(r, 'fm-pantry-tray-edit-save')).toBe(true);
    await type(r, 'fm-pantry-tray-edit-qty', '3');
    await type(r, 'fm-pantry-tray-edit-note', 'Bac à légumes');
    await press(r, 'fm-pantry-tray-edit-save', 700);
    const [row] = await backend.select<{ qty_estimate: number | string | null; notes: string | null; ingredient_key: string }>({ table: 'household_stocks', filters: [eq('id', s.id)] });
    expect(Number(row.qty_estimate)).toBe(3);
    expect(row.notes).toBe('Bac à légumes');
    expect(row.ingredient_key).toBe('carrot');
    r.unmount();
  });

  it('menu : jours datés, jour choisi dans l’adresse, repas ouvert (?slot=), personnes corrigées sur la ligne enregistrée', async () => {
    const all = await loadEmbeddedRecipes();
    const [a, b] = visibleRecipes(all);
    await backend.rpc('set_demo_subscription', { active: true });
    const start = addDays(todayISO(), -1);
    const [plan] = await backend.insert<{ id: string }>('meal_plans', { household_id: hid, title: 'Menu', days: 3, servings: 2, profile: { audience: 'adult' }, start_date: start });
    const items = await backend.insert<{ id: string; day: number }>('meal_plan_items', [
      { plan_id: plan.id, household_id: hid, day: 1, meal: 'lunch', recipe_slug: a.slug, servings: 2, note: null },
      { plan_id: plan.id, household_id: hid, day: 2, meal: 'dinner', recipe_slug: b.slug, servings: 2, note: null },
    ]);
    setParams({});
    const r = await render(<Menu />);
    await until(() => has(r, 'fm-menu-day-0') && has(r, 'menu-slot-1-lunch'), 15000);
    // sans ?day= : le jour du menu qui tombe aujourd'hui (Jour 2) est choisi ; jour sans repas : « Rien de prévu », jamais 0
    expect(allText(r)).toMatch(/Jour 2 · choisi/);
    expect(allText(r)).toContain('Rien de prévu');
    await press(r, 'fm-menu-day-2');
    expect(params.day).toBe('2');
    await press(r, 'fm-menu-fix-1-lunch');
    expect(params.slot).toBe('1-lunch');
    r.unmount(); // l'adresse simulée n'est pas réactive : on rouvre l'écran avec « ?slot= »
    const r2 = await render(<Menu />);
    await until(() => has(r2, 'fm-menu-tray'), 15000);
    await press(r2, 'fm-menu-tray-fix');
    await type(r2, 'fm-menu-tray-edit-servings', '13');
    expect(disabled(r2, 'fm-menu-tray-edit-save')).toBe(true);
    await type(r2, 'fm-menu-tray-edit-servings', '4');
    await type(r2, 'fm-menu-tray-edit-note', 'Sans sel');
    await press(r2, 'fm-menu-tray-edit-save', 700);
    const lunch = items.find((i) => i.day === 1)!;
    const [row] = await backend.select<{ servings: number; note: string | null; recipe_slug: string }>({ table: 'meal_plan_items', filters: [eq('id', lunch.id)] });
    expect(row).toMatchObject({ servings: 4, note: 'Sans sel', recipe_slug: a.slug });
    r2.unmount();
  });
});
