/** Retour iPhone 26/11/2026 : « Lina a bu 150 ml » ENREGISTRE tout de suite (action simple), « Annuler » efface. */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => mockParams, useIsFocused: () => true, usePathname: () => '/assistant', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), useFocusEffect: () => undefined };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));


import React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { AuraScreen } from '@/features/aura/AuraScreen';
jest.setTimeout(90000);

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
  await flush(500);
  return r;
}
async function until(cond: () => boolean, ms = 8000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(80); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, text: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  await act(async () => { el.props.onChangeText(text); });
}
async function sayRaw(r: ReactTestRenderer, text: string) {
  await type(r, 'aura-input', text); await press(r, 'aura-send', 400);
  // 25/11/2026 : Aura propose d'abord l'outil (gratuit) ; ces tests veulent la réponse de l'IA → « Demander quand même »
  if (r.root.findAll((n) => n.props.testID === 'aura-ask-anyway' && typeof n.props.onPress === 'function').length) await press(r, 'aura-ask-anyway', 400);
}

const bottles = async (hh: string) => (await backend.select<{ consumed_ml: number }>({ table: 'bottles', filters: [eq('household_id', hh)] })).length;

describe('Aura enregistre directement une action simple', () => {
  let hh = '';
  beforeAll(async () => {
    await backend.auth.signUp('auto@exemple.test', 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hh = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Foyer Auto' });
    const me = (await backend.auth.getSession())!.userId;
    const lina = await backend.insert<{ id: string }>('children', { household_id: hh, first_name: 'Lina', birth_date: '2026-06-01', enabled_tracking: ['sleep', 'bottle', 'diaper', 'breastfeed'] });
    const id = (Array.isArray(lina) ? lina[0] : lina).id;
    await backend.insert('user_journeys', { user_id: me, household_id: hh, type: 'baby', status: 'active', child_id: id, started_on: '2026-06-01' });
  });
  it('« Lina a bu 150 ml » → enregistré sans appui, une seule fois ; « Annuler » efface', async () => {
    const r = await render(<AuraScreen />);
    await type(r, 'aura-input', 'Lina a bu 150 ml'); await press(r, 'aura-send', 400);
    await until(() => has(r, 'aura-intent-done'));
    expect(has(r, 'aura-intent-done')).toBe(true);
    expect(await bottles(hh)).toBe(1);
    await flush(600);
    expect(await bottles(hh)).toBe(1); // pas de doublon
    await press(r, 'aura-intent-undo', 600);
    expect(await bottles(hh)).toBe(0);
    expect(has(r, 'aura-intent-undone')).toBe(true);
  });
  it('plusieurs actions dans une phrase : rien sans « Enregistrer »', async () => {
    const r = await render(<AuraScreen />);
    await type(r, 'aura-input', 'Lina a bu 120 ml et couche changée'); await press(r, 'aura-send', 400);
    await until(() => has(r, 'aura-intent-save'));
    expect(await bottles(hh)).toBe(0);
    await press(r, 'aura-intent-save', 800);
    await until(() => has(r, 'aura-intent-done'));
    expect(await bottles(hh)).toBe(1);
  });
});
