/** Coparent : code à 6 chiffres (26/11/2026). Le serveur (tests SQL 98zx) fait foi ; ici l'app et la démo. */
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
import JoinFamily from '@/app/join';
import { InviteCodeCard } from '@/features/family/InviteCodeCard';
import { cleanCode, codeToken, isCodeToken, isFullCode, spaced } from '@/lib/inviteCode';
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



describe('code à 6 chiffres : saisie', () => {
  it('collage, espaces, texte autour, lien', () => {
    expect(cleanCode('123 456')).toBe('123456');
    expect(cleanCode('Code : 987-654, valable 48 h')).toBe('987654');
    expect(cleanCode('homi://join?code=246810')).toBe('246810');
    expect(cleanCode('12')).toBe('12');
    expect(isFullCode('123456')).toBe(true);
    expect(isFullCode('12345a')).toBe(false);
    expect(codeToken('123456')).toBe('c6:123456');
    expect(isCodeToken('c6:123456')).toBe(true);
    expect(isCodeToken('abcdef0123456789abcd')).toBe(false);
    expect(spaced('123456')).toBe('123 456');
  });
});

describe('parcours coparent (démonstration)', () => {
  let hid = '';
  let code = '';
  beforeAll(async () => {
    await backend.auth.signUp('jade@exemple.test', 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Foyer Jade' });
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
  });
  it('le parent crée un code de 6 chiffres valable 48 h, le renouvelle', async () => {
    const r = await render(<InviteCodeCard householdId={hid} />);
    await press(r, 'invite-code-create', 600);
    await until(() => has(r, 'invite-code-value'));
    code = allText(r).match(/\b(\d{3}) (\d{3})\b/)!.slice(1).join('');
    expect(code).toMatch(/^\d{6}$/);
    expect(allText(r)).toContain('Valable jusqu');
    await press(r, 'invite-code-renew', 600);
    const code2 = allText(r).match(/\b(\d{3}) (\d{3})\b/)!.slice(1).join('');
    expect(await backend.rpc('preview_invite_code', { p_code: code })).toBeNull(); // l'ancien ne marche plus
    code = code2;
  });
  it('« Rejoindre ma famille » : bon code → famille trouvée ; faux code → refus', async () => {
    mockParams.code = code;
    const r = await render(<JoinFamily />);
    await until(() => has(r, 'join-found'));
    expect(has(r, 'join-found')).toBe(true);
    mockParams.code = '000000' === code ? '111111' : '000000';
    const r2 = await render(<JoinFamily />);
    await until(() => has(r2, 'join-invalid'));
    expect(has(r2, 'join-invalid')).toBe(true);
    delete mockParams.code;
  });
});
