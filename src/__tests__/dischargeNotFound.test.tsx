/**
 * Observation de pertes : un identifiant inconnu (lien périmé, observation supprimée) affiche « introuvable » avec un
 * retour, jamais un formulaire vide ; « new » ouvre toujours le formulaire. Rendu réel, backend de démonstration.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/cycle/discharge/x', __state: state };
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
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import DischargeForm from '@/app/cycle/discharge/[id]';
import { t as tr } from '@/i18n';

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
const mock = jest.requireMock('expo-router') as { router: { back: jest.Mock }; __state: { params: Record<string, string> } };

describe('observation de pertes : identifiant inconnu', () => {
  beforeAll(async () => { await backend.auth.signUp('pertes.introuvable@exemple.test', 'MotDePasse!2026'); });

  it('affiche « introuvable » avec un retour, sans formulaire', async () => {
    mock.__state.params = { id: 'identifiant-qui-n-existe-pas' };
    const r = await render(<DischargeForm />);
    const t = allText(r);
    expect(t).toContain(tr('cy.dis.notFound'));
    expect(t).not.toContain(tr('cy.dis.step1'));
    expect(t).not.toContain(tr('common.continue'));
    const back = r.root.findAll((n) => n.props.accessibilityLabel === tr('common.back') && typeof n.props.onPress === 'function');
    expect(back.length).toBeGreaterThan(0);
    mock.router.back.mockClear();
    await act(async () => { back[back.length - 1].props.onPress(); });
    expect(mock.router.back).toHaveBeenCalled();
    await act(async () => { r.unmount(); });
  });

  it('« new » ouvre toujours le formulaire', async () => {
    mock.__state.params = { id: 'new' };
    const r = await render(<DischargeForm />);
    const t = allText(r);
    expect(t).not.toContain(tr('cy.dis.notFound'));
    expect(t).toContain(tr('cy.dis.step1'));
    await act(async () => { r.unmount(); });
  });
});
