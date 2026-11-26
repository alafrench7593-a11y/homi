/**
 * Refonte lot 3 (organisation familiale, journée difficile, charge mentale) : comportements corrigés.
 * - Journée difficile : « Demander un relais » ne part qu'une fois (bouton désactivé après envoi).
 * - Organisation : une seule entrée « ajouter une tâche » dans l'en-tête (plus de bouton « + » en double).
 * - Charge mentale : la barre de répartition est lisible au lecteur d'écran (personne, part, nombre).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }) };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import DifficultDay from '@/app/family/difficult';
import FamilyHome from '@/app/family/index';
import MentalLoad from '@/app/family/load';

jest.setTimeout(60000);
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(400);
  return r;
}
async function until(cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(100); }
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];

describe('refonte lot 3 : famille', () => {
  let hid = '';
  beforeAll(async () => {
    await backend.auth.signUp('lot3.famille@exemple.test', 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Foyer lot 3' });
    await backend.insert('family_tasks', { household_id: hid, title: 'Acheter du lait', category: 'other', due_at: null, assignee_id: null, priority: 'normal', essential: false, recurrence: null, notes: null, status: 'todo' });
  });

  it('journée difficile : le relais ne part qu’une fois', async () => {
    const r = await render(<DifficultDay />);
    await until(() => !!byId(r, 'difficult-relay'));
    const before = (await backend.select<{ kind: string }>({ table: 'care_requests' })).filter((x) => x.kind === 'relay').length;
    await act(async () => { await byId(r, 'difficult-relay').props.onPress(); });
    await flush(300);
    const btn = byId(r, 'difficult-relay');
    expect(btn.props.disabled || btn.props.accessibilityState?.disabled).toBeTruthy();
    const after = (await backend.select<{ kind: string }>({ table: 'care_requests' })).filter((x) => x.kind === 'relay').length;
    expect(after).toBe(before + 1);
    await act(async () => { r.unmount(); });
  });

  it('organisation : une seule action « ajouter une tâche » en tête d’écran', async () => {
    const r = await render(<FamilyHome />);
    await until(() => !!byId(r, 'family-main-action'));
    const plusInHeader = r.root.findAll((n) => n.props.accessibilityLabel === 'Nouvelle tâche' && typeof n.props.onPress === 'function');
    expect(plusInHeader).toHaveLength(0);
    await act(async () => { r.unmount(); });
  });

  it('charge mentale : barre lue en une phrase (part en %, nombre)', async () => {
    const r = await render(<MentalLoad />);
    await until(() => r.root.findAll((n) => n.props.accessibilityRole === 'image' && typeof n.props.accessibilityLabel === 'string').length > 0);
    const bars = r.root.findAll((n) => n.props.accessibilityRole === 'image' && typeof n.props.accessibilityLabel === 'string');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0].props.accessibilityLabel).toMatch(/Qui y pense : .+ 100 % \(1\)/);
    await act(async () => { r.unmount(); });
  });
});
