/**
 * Audit n° 2 « Authentification et compte » (13/11/2026) : régressions côté application.
 *  1. Session absente ou expirée au démarrage : le cache des écrans relu depuis l'appareil (compte précédent) ne doit
 *     pas revenir APRÈS l'effacement (la relecture du cache et celle de la session se faisaient en parallèle).
 *  2. Profil › Mon compte : un mot de passe trop court affiche un message lisible, jamais la clé « v.password.length ».
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }), SafeAreaView: ({ children }: { children: unknown }) => children }));
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/settings/account', useFocusEffect: () => undefined };
});
jest.mock('@/lib/notifications', () => ({ cancelAllLocal: jest.fn(async () => undefined) }));
jest.mock('@/lib/offline', () => ({ setQueueOwner: jest.fn(async () => undefined) }));

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { dehydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider, type Persister } from '@tanstack/react-query-persist-client';
import { AuthProvider, PERSISTED_CACHE_KEY, useAuth } from '@/lib/auth';
import { backend } from '@/lib/backend';
import { setLocale } from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import AccountScreen from '@/app/settings/account';

jest.setTimeout(90000);
beforeAll(() => setLocale('fr'));
afterEach(() => { jest.restoreAllMocks(); });
const flush = (ms = 0) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}

describe('démarrage sans session : le cache du compte précédent ne revient pas', () => {
  it('le cache relu après la session est quand même effacé (mémoire et appareil)', async () => {
    // Cache enregistré par le compte précédent (profil affiché « Maëlle »)
    const before = new QueryClient();
    before.setQueryData(['profiles', 'u-maelle'], { display_name: 'Maëlle' });
    const saved = { timestamp: Date.now(), buster: '', clientState: dehydrate(before) };
    await AsyncStorage.setItem(PERSISTED_CACHE_KEY, JSON.stringify(saved));
    await AsyncStorage.setItem('toietmoi.lastUser', 'u-maelle');
    // Relecture du cache plus LENTE que celle de la session (session refusée au démarrage)
    const persister: Persister = {
      persistClient: jest.fn(async () => undefined),
      restoreClient: () => new Promise((r) => setTimeout(() => r(saved), 300)),
      removeClient: jest.fn(async () => undefined),
    };
    jest.spyOn(backend.auth, 'getSession').mockResolvedValue(null);
    const qc = new QueryClient();
    let seen: { ready: boolean } = { ready: false };
    function Probe() { seen = useAuth(); return null; }
    let r!: ReactTestRenderer;
    await act(async () => {
      r = create(<PersistQueryClientProvider client={qc} persistOptions={{ persister }}><AuthProvider><Probe /></AuthProvider></PersistQueryClientProvider>);
    });
    await flush(800);
    expect(seen.ready).toBe(true);
    expect(qc.getQueryData(['profiles', 'u-maelle'])).toBeUndefined();
    expect(await AsyncStorage.getItem(PERSISTED_CACHE_KEY)).toBeNull();
    await act(async () => { r.unmount(); });
  });

  it('même compte qu’à la dernière ouverture : le cache est conservé (consultation hors connexion)', async () => {
    const before = new QueryClient();
    before.setQueryData(['profiles', 'u-maelle'], { display_name: 'Maëlle' });
    const saved = { timestamp: Date.now(), buster: '', clientState: dehydrate(before) };
    await AsyncStorage.setItem('toietmoi.lastUser', 'u-maelle');
    const persister: Persister = { persistClient: jest.fn(async () => undefined), restoreClient: () => new Promise((r) => setTimeout(() => r(saved), 300)), removeClient: jest.fn(async () => undefined) };
    jest.spyOn(backend.auth, 'getSession').mockResolvedValue({ userId: 'u-maelle', email: 'm@exemple.test', providers: [] });
    const qc = new QueryClient();
    let r!: ReactTestRenderer;
    await act(async () => { r = create(<PersistQueryClientProvider client={qc} persistOptions={{ persister }}><AuthProvider>{null}</AuthProvider></PersistQueryClientProvider>); });
    await flush(800);
    expect(qc.getQueryData(['profiles', 'u-maelle'])).toEqual({ display_name: 'Maëlle' });
    await act(async () => { r.unmount(); });
  });
});

describe('Profil › Mon compte : mot de passe trop court', () => {
  it('affiche « Au moins 8 caractères. » et non une clé de traduction', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let r!: ReactTestRenderer;
    await act(async () => {
      r = create(<QueryClientProvider client={qc}><ThemeProvider><ToastProvider><AccountScreen /></ToastProvider></ThemeProvider></QueryClientProvider>);
    });
    await flush(200);
    const inputs = r.root.findAll((n) => typeof n.props.onChangeText === 'function' && n.props.secureTextEntry === true && typeof n.type === 'string');
    await act(async () => { inputs[0].props.onChangeText('abc'); inputs[1].props.onChangeText('abc'); });
    await act(async () => { inputs[1].props.onSubmitEditing?.(); });
    await flush(50);
    const all = texts(r.root).join(' ');
    expect(all).toContain('Au moins 8 caractères.');
    expect(all).not.toMatch(/v\.password|\u0001/);
    await act(async () => { r.unmount(); });
  });
});
