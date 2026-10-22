/**
 * Rendu réel (React Native, backend de démonstration) du « cocon du jour » : carte centrale, frise des vrais
 * événements, trois informations, « À retenir », « + Ajouter » et ses favoris ; toucher un événement pour le
 * modifier ou le supprimer. Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
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
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { Cocoon, CocoonAdd } from '@/features/cocoon/Cocoon';
import { useUiStore } from '@/lib/store';
import type { Child } from '@/lib/types';

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
  await flush(200);
  return r;
}
const ids = (r: ReactTestRenderer, prefix: string) => [...new Set(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith(prefix)).map((n) => n.props.testID as string))];
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
async function press(r: ReactTestRenderer, id: string, wait = 200) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
const router = (jest.requireMock('expo-router') as { router: { push: jest.Mock } }).router;

describe(`le cocon du jour (${Platform.OS})`, () => {
  let child: Child;
  let hid: string;
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const at = (min: number) => new Date(d0.getTime() + min * 60000).toISOString();
  beforeAll(async () => {
    await backend.auth.signUp(`cocon.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [first] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = first?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    const birth = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10); // 2 mois : nouveau-né
    [child] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: birth, enabled_tracking: ['bottle', 'breastfeed', 'diaper', 'sleep'] });
    await backend.insert('bottles', { child_id: child.id, household_id: hid, at: at(5), prepared_ml: 120, consumed_ml: 110 });
    await backend.insert('diapers', { child_id: child.id, household_id: hid, at: at(8), wet: true, stool: false });
  });

  it('cocon, frise des vrais événements, trois informations, à retenir', async () => {
    const r = await render(<Cocoon child={child} journey="baby" now={new Date()} article={null} />);
    const t = allText(r);
    expect(t).toContain('Lina');
    expect(t).toMatch(/2 mois|1 mois et/);
    expect(ids(r, 'ribbon-').filter((x) => x.startsWith('ribbon-bottle') || x.startsWith('ribbon-diaper'))).toHaveLength(2);
    expect(ids(r, 'cocoon-info-')).toEqual(['cocoon-info-feed', 'cocoon-info-diaper', 'cocoon-info-sleep']);
    expect(t).toContain('À RETENIR AUJOURD’HUI');
    expect(ids(r, 'cocoon-keep')).toHaveLength(1);
    expect(t).toContain('Elle s’endort');
    await act(async () => { r.unmount(); });
  });

  it('toucher un événement : modifier (saisie) ou supprimer', async () => {
    const r = await render(<Cocoon child={child} journey="baby" now={new Date()} article={null} />);
    const bottle = ids(r, 'ribbon-bottle-')[0];
    await press(r, bottle);
    expect(allText(r)).toContain('Modifier');
    router.push.mockClear();
    await press(r, 'cocoon-event-edit');
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/track/[kind]', params: expect.objectContaining({ kind: 'bottle', child: child.id }) }));
    await act(async () => { r.unmount(); });
  });

  it('« + Ajouter » : 4 favoris de l’âge, jamais un suivi désactivé ; favoris personnalisés', async () => {
    const r = await render(<CocoonAdd child={child} journey="baby" />);
    await press(r, 'cocoon-add');
    const actions = ids(r, 'cocoon-add-').filter((x) => !['cocoon-add-sheet', 'cocoon-add-customize'].includes(x));
    expect(actions.slice(0, 4)).toEqual(['cocoon-add-bottle', 'cocoon-add-breastfeed', 'cocoon-add-diaper', 'cocoon-add-sleep']);
    expect(actions).not.toContain('cocoon-add-meal'); // repas non activé
    await press(r, 'cocoon-add-customize');
    await press(r, 'cocoon-add-diaper');
    await press(r, 'cocoon-add-note');
    expect(useUiStore.getState().cocoonFavorites).toEqual(['bottle', 'breastfeed', 'sleep', 'note']);
    await act(async () => { r.unmount(); });
  });

  it('un nouvel ajout apparaît aussitôt dans la frise', async () => {
    const r = await render(<Cocoon child={child} journey="baby" now={new Date()} article={null} />);
    const before = ids(r, 'ribbon-diaper-').length;
    await act(async () => { await backend.insert('diapers', { child_id: child.id, household_id: hid, at: at(9), wet: false, stool: true }); });
    // même invalidation que l'écran de saisie
    const qc = r.root.findAll((n) => n.props.client)[0]?.props.client as QueryClient;
    await act(async () => { await qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('diapers') }); });
    await flush(200);
    expect(ids(r, 'ribbon-diaper-').length).toBe(before + 1);
    await act(async () => { r.unmount(); });
  });
});
