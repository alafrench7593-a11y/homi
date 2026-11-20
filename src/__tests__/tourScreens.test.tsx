/**
 * Visite guidée — rendu réel (React Native, backend de démonstration) :
 *  - élément introuvable : la bulle se centre et propose « Passer l'étape » (jamais de blocage) ; « Passer » avance ;
 *  - mode exercice sur le VRAI formulaire de saisie (`/track/[kind]`) : bandeau « rien ne sera enregistré », la
 *    personne touche « Enregistrer » comme d'habitude, et aucune ligne n'arrive dans la base.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string>, path: '/' };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => state.path, __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
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
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { isPracticeActive, practiceWrites } from '@/lib/practice';
import { TourHost } from '@/features/tour/TourOverlay';
import { useTourStore } from '@/features/tour/store';
import TrackEntryRoute from '@/app/track/[kind]';

const flush = async (ms = 40) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await flush(200);
  return r;
}
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 200) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
const mocked = jest.requireMock('expo-router') as { __state: { params: Record<string, string>; path: string } };

describe('visite guidée sur les vrais écrans', () => {
  let child = '';
  let hid = '';
  let me = '';
  beforeAll(async () => {
    await backend.auth.signUp('visite.ecrans@exemple.test', 'MotDePasse!2026');
    me = (await backend.auth.getSession())!.userId;
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    const birth = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    [{ id: child }] = await backend.insert<{ id: string }>('children', { household_id: hid, first_name: 'Lina', birth_date: birth, enabled_tracking: ['diaper'] });
  });

  it('élément introuvable : bulle centrée, « Passer l’étape », la visite avance (jamais bloquée)', async () => {
    mocked.__state.path = '/';
    const r = await render(<TourHost />);
    expect(useTourStore.getState().owner).toBe(me);
    expect(has(r, 'tour-overlay')).toBe(false); // aucune visite en cours : rien
    await act(async () => { useTourStore.getState().dispatch({ type: 'start' }); });
    await flush(400); // la bulle seule n'apparaît qu'après 300 ms de recherche (jamais posée au centre puis déplacée)
    expect(has(r, 'tour-overlay')).toBe(true);
    expect(has(r, 'tour-progress')).toBe(true);
    expect(has(r, 'tour-later')).toBe(true);
    expect(has(r, 'tour-skip')).toBe(true);
    await flush(2600); // « Prochaine action » n'existe pas ici
    expect(has(r, 'tour-notfound-skip')).toBe(true);
    await press(r, 'tour-notfound-skip');
    expect(useTourStore.getState().byUser[me].step).toBe(1);
    await press(r, 'tour-later');
    expect(useTourStore.getState().byUser[me].status).toBe('paused');
    expect(has(r, 'tour-overlay')).toBe(false);
    await act(async () => { r.unmount(); });
  });

  it('écran différent : pastille compacte « Reprendre », aucun voile', async () => {
    mocked.__state.path = '/settings';
    const r = await render(<TourHost />);
    await act(async () => { useTourStore.getState().dispatch({ type: 'start' }); });
    await flush(100);
    expect(has(r, 'tour-pill')).toBe(true);
    expect(has(r, 'tour-veil')).toBe(false);
    await act(async () => { useTourStore.getState().dispatch({ type: 'quit' }); r.unmount(); });
  });

  it('exercice : le vrai formulaire s’enregistre « comme d’habitude » et aucune ligne n’est créée', async () => {
    const before = (await backend.select({ table: 'diapers', filters: [eq('child_id', child)] })).length;
    // étape 4 de la visite, « Essayer sans enregistrer »
    await act(async () => {
      const st = useTourStore.getState();
      st.dispatch({ type: 'start' });
      for (let i = 0; i < 3; i++) useTourStore.getState().dispatch({ type: 'skipStep' });
      useTourStore.getState().setPractice(true);
    });
    expect(isPracticeActive()).toBe(true);
    mocked.__state.params = { kind: 'diaper', child };
    mocked.__state.path = '/track/diaper';
    const r = await render(<TrackEntryRoute />);
    expect(has(r, 'practice-banner')).toBe(true);
    await press(r, 'track-save', 600);
    expect(practiceWrites().some((w) => w.target === 'diapers')).toBe(true);
    expect((await backend.select({ table: 'diapers', filters: [eq('child_id', child)] })).length).toBe(before);
    await act(async () => { useTourStore.getState().dispatch({ type: 'event', event: { type: 'quickFormClosed' } }); r.unmount(); });
    expect(isPracticeActive()).toBe(false);
  });
});
