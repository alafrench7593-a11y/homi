/**
 * Rendu réel (backend de démonstration) : « Ses découvertes », « Je grandis » (« Sorties près de chez moi » : voir outings.test.tsx).
 * Deux enfants (Lina, Noé) : jamais de mélange. Version gratuite : 15 aliments, étapes principales.
 * Les services publics de cartes sont simulés ici (réponses au format documenté) : aucun appel réseau en test.
 * Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-location', () => ({ requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })), getCurrentPositionAsync: jest.fn(), Accuracy: { Low: 2 } }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-local-authentication', () => ({ hasHardwareAsync: jest.fn(async () => false), isEnrolledAsync: jest.fn(async () => false), authenticateAsync: jest.fn(async () => ({ success: true })) }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Discoveries from '@/app/child/[id]/discoveries';
import Grow from '@/app/child/[id]/grow';
import { ChildShortcuts } from '@/features/discoveries/ChildShortcuts';
import { usePremiumSheet } from '@/lib/data/hooks-premium';
import { useUiStore } from '@/lib/store';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { Child } from '@/lib/types';

jest.setTimeout(40000);

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(300);
  return r;
}
/** Attend qu'une condition soit vraie (chargement plus lent quand toutes les suites tournent en parallèle). */
async function until(cond: () => boolean, ms = 5000) {
  const end = Date.now() + ms;
  while (!cond() && Date.now() < end) await flush(100);
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, v: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`champ introuvable : ${id}`);
  await act(async () => { el.props.onChangeText(v); });
}
const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string> } }).__state.params;

describe(`découvertes, je grandis, près de chez moi (${Platform.OS})`, () => {
  let lina: Child; let noe: Child; let hid = '';
  beforeAll(async () => {
    await backend.auth.signUp(`decouvertes.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: addDays(todayISO(), -245), enabled_tracking: ['meal', 'sleep'] });
    [noe] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Noé', sex: 'male', birth_date: addDays(todayISO(), -2000), enabled_tracking: ['meal', 'sleep'] });
    await backend.insert('food_introductions', { household_id: hid, child_id: noe.id, food_key: 'carrot', food_name: 'Carotte', status: 'refused', first_tried_on: addDays(todayISO(), -2) });
  });

  it('Ses découvertes : fiche, historique, découverte de la semaine, progression, Lina et Noé séparés', async () => {
    params.id = lina.id;
    const r = await render(<Discoveries />);
    await until(() => has(r, 'dc-mosaic') && allText(r).includes('Les découvertes de Lina'));
    expect(has(r, 'dc-mosaic')).toBe(true);
    expect(allText(r)).toContain('Les découvertes de Lina');
    expect(r.root.findAll((n) => n.props.testID === 'dc-state-carrot')[0].props.children).toBe('À découvrir'); // le refus de Noé n'apparaît pas chez Lina
    await press(r, 'dc-food-carrot');
    expect(has(r, 'dc-sheet')).toBe(true);
    expect(allText(r)).toContain('À découvrir lorsque son âge et sa situation le permettent');
    await press(r, 'dc-status-liked'); await press(r, 'dc-texture-smooth'); await press(r, 'dc-prep-steamed');
    await type(r, 'dc-note', 'Grand sourire');
    await press(r, 'dc-save', 600);
    const [entry] = await backend.select<{ status: string; texture: string; preparation: string; note: string; first_tried_on: string }>({ table: 'food_introductions', filters: [eq('child_id', lina.id), eq('food_key', 'carrot')] });
    expect(entry).toMatchObject({ status: 'liked', texture: 'smooth', preparation: 'steamed', note: 'Grand sourire', first_tried_on: todayISO() });
    expect(await backend.select({ table: 'food_tastings', filters: [eq('child_id', lina.id)] })).toHaveLength(1);
    expect(has(r, 'dc-celebrate')).toBe(true);
    await flush(1500);
    expect(r.root.findAll((n) => n.props.testID === 'dc-state-carrot')[0].props.children).toBe('Déjà découvert');
    expect(allText(r)).toContain('Lina a découvert 1 légume');
    expect(has(r, 'dc-week')).toBe(true);
    // Noé garde son propre statut
    const [noeCarrot] = await backend.select<{ status: string }>({ table: 'food_introductions', filters: [eq('child_id', noe.id), eq('food_key', 'carrot')] });
    expect(noeCarrot.status).toBe('refused');
    // recherche et catégorie
    await type(r, 'dc-search', 'lentil'); await flush(100);
    expect(has(r, 'dc-food-red_lentils')).toBe(true); expect(has(r, 'dc-food-carrot')).toBe(false);
    await type(r, 'dc-search', ''); await press(r, 'dc-cat-fruit');
    expect(has(r, 'dc-food-pear')).toBe(true); expect(has(r, 'dc-food-carrot')).toBe(false);
    r.unmount();
  });

  it('réaction importante : informations de sécurité immédiates (15/112), jamais de diagnostic, notée sur la fiche', async () => {
    params.id = lina.id;
    const r = await render(<Discoveries />);
    await until(() => has(r, 'dc-mosaic') && r.root.findAll((n) => n.props.testID === 'dc-state-carrot')[0]?.props.children === 'Déjà découvert');
    await press(r, 'dc-react');
    await until(() => has(r, 'dc-rx-food-carrot'));
    await press(r, 'dc-sign-hives');
    expect(has(r, 'dc-rx-advice')).toBe(true);
    await press(r, 'dc-sign-swelling');
    expect(has(r, 'dc-rx-emergency')).toBe(true);
    expect(has(r, 'dc-call-15')).toBe(true);
    expect(allText(r)).toContain('L’application ne diagnostique jamais une allergie.');
    await press(r, 'dc-rx-food-carrot');
    await press(r, 'dc-rx-save', 500);
    const [e] = await backend.select<{ reaction: boolean; reaction_note: string }>({ table: 'food_introductions', filters: [eq('child_id', lina.id), eq('food_key', 'carrot')] });
    expect(e.reaction).toBe(true);
    expect(e.reaction_note).toMatch(/Plaques rouges.*Gonflement/);
    r.unmount();
  });

  it('version gratuite : 15 aliments par enfant, puis aperçu Premium ; catalogue complet verrouillé ; filtres avancés Premium', async () => {
    for (let i = 0; i < 14; i++) await backend.insert('food_introductions', { household_id: hid, child_id: lina.id, food_name: `Aliment ${i}`, food_key: `test_food_${i}`, status: 'not_yet' });
    params.id = lina.id;
    const r = await render(<Discoveries />);
    await until(() => allText(r).includes('Version gratuite : 15 aliment(s) suivi(s) sur 15 pour Lina.'));
    expect(allText(r)).toContain('Version gratuite : 15 aliment(s) suivi(s) sur 15 pour Lina.');
    await press(r, 'dc-food-pear');
    await press(r, 'dc-status-tasted');
    await press(r, 'dc-save', 500);
    expect(usePremiumSheet.getState().open?.feature).toBe('diversification');
    act(() => usePremiumSheet.getState().hide());
    // aliment hors des essentiels : aperçu Premium
    await press(r, 'dc-food-artichoke');
    expect(usePremiumSheet.getState().open?.feature).toBe('diversification');
    act(() => usePremiumSheet.getState().hide());
    await press(r, 'dc-filter-discovered');
    expect(usePremiumSheet.getState().open?.feature).toBe('diversification');
    act(() => usePremiumSheet.getState().hide());
    // Noé n'est pas concerné par le quota de Lina
    expect((await backend.insert('food_introductions', { household_id: hid, child_id: noe.id, food_name: 'Poire', food_key: 'pear', status: 'tasted', first_tried_on: todayISO() })).length).toBe(1);
    r.unmount();
  });

  it('Je grandis : étape principale notée, étape du suivi complet verrouillée, résumé factuel, aucun score', async () => {
    params.id = lina.id;
    const r = await render(<Grow />);
    await until(() => has(r, 'gr-step-sits_alone'));
    const t = allText(r);
    expect(t).toContain('Chaque enfant évolue à son propre rythme');
    expect(t).not.toMatch(/retard|échec|\d+ sur \d+/);
    expect(has(r, 'gr-step-sits_alone')).toBe(true); // 8 mois : tranche 6–9 mois
    await press(r, 'gr-step-sits_alone');
    await press(r, 'gr-st-observed');
    await type(r, 'gr-note', 'Tout seul sur le tapis');
    await press(r, 'gr-ask');
    await press(r, 'gr-save', 500);
    const rows = await backend.select<{ step_key: string; status: string; note: string; observed_on: string }>({ table: 'child_steps', filters: [eq('child_id', lina.id)] });
    expect(rows).toEqual([expect.objectContaining({ step_key: 'sits_alone', status: 'observed', note: 'Tout seul sur le tapis', observed_on: todayISO() })]);
    expect(await backend.select({ table: 'child_steps', filters: [eq('child_id', noe.id)] })).toHaveLength(0);
    expect(allText(r)).toContain('Ce que vous avez observé récemment');
    // étape non principale : aperçu du suivi complet
    await press(r, 'gr-step-sits_supported');
    expect(usePremiumSheet.getState().open?.feature).toBe('development_full');
    act(() => usePremiumSheet.getState().hide());
    await expect(backend.insert('child_steps', { household_id: hid, child_id: lina.id, step_key: 'sits_supported', status: 'observed' })).rejects.toThrow(/Premium/);
    await backend.insert('child_steps', { household_id: hid, child_id: lina.id, step_key: 'sits_supported', status: 'not_tracked' });
    await press(r, 'gr-summary');
    const s = allText(r);
    expect(s).toContain('Lina, 8 mois — notes du parent');
    expect(s).toContain('• Tient assis sans appui : observée');
    expect(s).toContain('? Comment l’aider à gagner en équilibre ?');
    expect(s).toContain('ne pose aucun diagnostic');
    r.unmount();
  });

  it('raccourcis de la page de l’enfant : résumé seulement, données de cet enfant', async () => {
    const r = await render(<ChildShortcuts child={lina} />);
    await until(() => /Dernière découverte : Carotte/.test(allText(r)) && allText(r).includes('Tient assis sans appui'));
    expect(allText(r)).toMatch(/Dernière découverte : Carotte/);
    expect(allText(r)).toContain('Nouvelle étape observée : Tient assis sans appui');
    r.unmount();
    const n = await render(<ChildShortcuts child={noe} />);
    expect(allText(n)).not.toContain('Tient assis sans appui');
    n.unmount();
  });

});
