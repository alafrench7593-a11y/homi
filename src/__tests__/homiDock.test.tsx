/**
 * Rendu réel de la barre d'onglets HOMI : 5 onglets accessibles (rôle « tab », état sélectionné), libellés complets,
 * anciennes routes absentes de la barre mais qui allument leur onglet parent, bouton d'ajout rapide toujours là.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/' };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));

import React from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { Dock } from '@/components/Dock';
import { useDockAction } from '@/components/dockAction';
import { setLocale } from '@/i18n';

const ROUTES = ['index', 'health', 'baby', 'household', 'community', 'agenda', 'track', 'tools', 'ask', 'moi', 'profile'];
const TITLES: Record<string, string> = { index: 'Accueil', health: 'Santé', baby: 'Bébé', household: 'Famille', community: 'Communauté' };

function props(focused: string, navigate = jest.fn()) {
  const routes = ROUTES.map((name) => ({ key: `${name}-k`, name }));
  const descriptors = Object.fromEntries(routes.map((r) => [r.key, { options: { title: TITLES[r.name] ?? r.name, href: TITLES[r.name] ? undefined : null } }]));
  return {
    state: { index: ROUTES.indexOf(focused), routes },
    navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate },
    descriptors,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as React.ComponentProps<typeof Dock>;
}

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
  await act(async () => { await new Promise((res) => setTimeout(res, 40)); });
  return r;
}
const tabs = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'tab');

describe('Barre d’onglets HOMI', () => {
  beforeAll(() => setLocale('fr'));

  it('5 onglets, libellés complets, Accueil sélectionné, ajout rapide présent', async () => {
    const r = await render(<Dock {...props('index')} />);
    const list = tabs(r);
    expect(list.map((n) => n.props.testID)).toEqual(['tab-index', 'tab-health', 'tab-baby', 'tab-household', 'tab-community']);
    expect(list.map((n) => texts(n).join(''))).toEqual(['Accueil', 'Santé', 'Bébé', 'Famille', 'Communauté']);
    expect(list.map((n) => !!n.props.accessibilityState?.selected)).toEqual([true, false, false, false, false]);
    expect(r.root.findAll((n) => n.props.testID === 'quick-add' && typeof n.type === 'string').length).toBeGreaterThan(0);
    expect(r.root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'tablist')).toHaveLength(1);
    act(() => r.unmount());
  });

  it('un seul bouton d’action : l’écran Communauté remplace « + » par « Publier » (même place, même ligne)', async () => {
    const onPublish = jest.fn();
    function Publish() {
      useDockAction('community', { icon: 'edit-3', label: 'Publier', testID: 'community-publish', onPress: onPublish });
      return null;
    }
    const host = (n: { type: unknown; props: { testID?: string } }, id: string) => typeof n.type === 'string' && n.props.testID === id;
    const r = await render(<><Publish /><Dock {...props('community')} /></>);
    expect(r.root.findAll((n) => host(n, 'quick-add'))).toHaveLength(0);
    const pub = r.root.findAll((n) => n.props.testID === 'community-publish' && typeof n.props.onPress === 'function')[0];
    expect(pub.props.accessibilityLabel).toBe('Publier');
    act(() => { pub.props.onPress(); });
    expect(onPublish).toHaveBeenCalledTimes(1);
    // ailleurs (Accueil), le « + » revient
    await act(async () => { r.update(<QueryClientProvider client={new QueryClient()}><AuthProvider><ThemeProvider><ToastProvider><Publish /><Dock {...props('index')} /></ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
    expect(r.root.findAll((n) => host(n, 'quick-add')).length).toBeGreaterThan(0);
    expect(r.root.findAll((n) => host(n, 'tab-indicator'))).toHaveLength(1);
    act(() => r.unmount());
  });

  it('une ancienne route (Questions) allume son onglet parent (Santé) ; toucher Santé y revient', async () => {
    const navigate = jest.fn();
    const r = await render(<Dock {...props('ask', navigate)} />);
    expect(tabs(r).map((n) => !!n.props.accessibilityState?.selected)).toEqual([false, true, false, false, false]);
    const health = r.root.findAll((n) => n.props.testID === 'tab-health' && typeof n.props.onPress === 'function')[0];
    act(() => { health.props.onPress({ nativeEvent: {} }); });
    expect(navigate).toHaveBeenCalledWith('health');
    act(() => r.unmount());
  });
});
