/**
 * Relais parent (audit du 23/11/2026) : le mot du parent est gardé ; la relecture FIGE le message (ce qui est relu est
 * ce qui part) ; une saisie arrivée entre-temps est signalée et « Actualiser le brouillon » la prend en compte sans
 * perdre le mot ; après l'envoi, le mot est effacé.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
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

import React from 'react';
import { Share } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import RelayScreen from '@/app/family/relay';
import { useRelayStore } from '@/features/relay/relayStore';
import { addDays, todayISO } from '@/lib/domain/dates';
import type { Child } from '@/lib/types';

jest.setTimeout(60000);
function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function until(cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(100); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string> } }).__state.params;
const preview = (r: ReactTestRenderer) => texts(r.root.findAll((n) => n.props.testID === 'relay-preview')[0]).join('\n');

describe('relais : mot du parent, relecture figée, actualisation', () => {
  let lina: Child; let hid: string;
  beforeAll(async () => {
    await backend.auth.signUp('relais@exemple.test', 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test relais' });
    [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: addDays(todayISO(), -240), enabled_tracking: ['sleep', 'bottle'] });
    await backend.insert('bottles', { child_id: lina.id, household_id: hid, at: new Date(Date.now() - 60 * 60_000).toISOString(), consumed_ml: 150 });
  });

  it('le mot reste, l’aperçu ne bouge pas tout seul, « Actualiser le brouillon » intègre la nouvelle saisie', async () => {
    params.child = lina.id;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider><RelayScreen /></ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
    await until(() => has(r, 'relay-items'));
    const field = r.root.findAll((n) => n.props.testID === 'relay-note' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { field.props.onChangeText('doudou dans le sac'); });
    await press(r, 'relay-review');
    expect(preview(r)).toMatch(/150 ml/);
    expect(preview(r)).toMatch(/Mot : doudou dans le sac/);
    expect(has(r, 'relay-stale')).toBe(false);

    // Une autre saisie arrive pendant la relecture
    await backend.insert('bottles', { child_id: lina.id, household_id: hid, at: new Date(Date.now() - 10 * 60_000).toISOString(), consumed_ml: 90 });
    await act(async () => { await qc.invalidateQueries(); });
    await until(() => has(r, 'relay-stale'));
    expect(has(r, 'relay-stale')).toBe(true);
    expect(preview(r)).not.toMatch(/90 ml/); // ce qui est relu = ce qui part

    await press(r, 'relay-refresh');
    expect(has(r, 'relay-stale')).toBe(false);
    expect(preview(r)).toMatch(/90 ml/);
    expect(preview(r)).toMatch(/Mot : doudou dans le sac/);

    // Envoi : le mot est effacé ; rien n'est transmis sans ce geste
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction } as never);
    expect(useRelayStore.getState().notes[lina.id]).toBe('doudou dans le sac');
    await press(r, 'relay-confirm', 500);
    expect(share).toHaveBeenCalledTimes(1);
    expect(String((share.mock.calls[0][0] as { message: string }).message)).toMatch(/90 ml[\s\S]*Mot : doudou/);
    expect(useRelayStore.getState().notes[lina.id]).toBeUndefined();
    expect(allText(r)).toMatch(/Dernier relais transmis/);
    act(() => r.unmount());
    await flush(300);
  });
});
