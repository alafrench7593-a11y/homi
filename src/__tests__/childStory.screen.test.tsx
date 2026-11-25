/** Mon histoire (26/11/2026) : livre et frise construits à partir de l'album et des premières fois, rien d'inventé. */
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
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import ChildStory from '@/app/child/[id]/story';
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


describe('Mon histoire', () => {
  beforeAll(async () => {
    await backend.auth.signUp('histoire@exemple.test', 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hh = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Foyer Histoire' });
    const [c] = await backend.insert<{ id: string }>('children', { household_id: hh, first_name: 'Lina', birth_date: '2025-03-10' });
    mockParams.id = c.id;
    await backend.insert('child_milestones', { child_id: c.id, household_id: hh, kind: 'milestone', title: 'Premiers pas', happened_on: '2026-03-15', note: 'Vers maman, papa était fier.' });
    await backend.insert('child_milestones', { child_id: c.id, household_id: hh, kind: 'tooth', title: 'Première dent', happened_on: '2025-10-01', note: null });
  });
  it('chapitres par âge, pages fidèles, frise', async () => {
    const r = await render(<ChildStory />);
    await until(() => has(r, 'story-book'));
    const txt = allText(r);
    expect(txt).toContain('Mon histoire');
    expect(txt).toContain('Mes premières fois');
    expect(txt).toContain('Je découvre le monde');
    expect(has(r, 'section-intro-story')).toBe(true);
    await press(r, 'story-mode-timeline', 300);
    const t2 = allText(r);
    expect(t2).toContain('Premiers pas');
    expect(t2).toContain('Vers maman, papa était fier.');
    expect(t2).toContain('Ajoute une note à ce moment pour le raconter.'); // dent sans note : rien d'inventé
    expect(has(r, 'story-chapter-birth')).toBe(true); // chapitre atteint, vide : invitation
  });
});
