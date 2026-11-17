/**
 * Rendu réel de la barre d'onglets HOMI (refonte du 17/11/2026) : 4 onglets accessibles (rôle « tab », état sélectionné)
 * autour de l'action centrale « Ajouter », libellés complets, routes hors barre (Communauté comprise) qui allument leur
 * onglet parent, feuille d'actions rapides du profil.
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
const TITLES: Record<string, string> = { index: 'Aujourd’hui', health: 'Moi', baby: 'Enfant', household: 'Famille' };

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

  it('4 onglets autour de l’action centrale, libellés complets, Aujourd’hui sélectionné', async () => {
    const r = await render(<Dock {...props('index')} />);
    const list = tabs(r);
    expect(list.map((n) => n.props.testID)).toEqual(['tab-index', 'tab-health', 'tab-baby', 'tab-household']);
    expect(list.map((n) => texts(n).join(''))).toEqual(['Aujourd’hui', 'Moi', 'Enfant', 'Famille']);
    expect(list.map((n) => !!n.props.accessibilityState?.selected)).toEqual([true, false, false, false]);
    expect(r.root.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'tablist')).toHaveLength(1);
    // l'action centrale : entre le 2e et le 3e onglet, nom accessible clair (« Ajouter »), jamais un « + » muet
    const add = r.root.findAll((n) => n.props.testID === 'quick-add' && typeof n.props.onPress === 'function')[0];
    expect(add.props.accessibilityLabel).toBe('Ajouter');
    expect(add.props.accessibilityRole).toBe('button');
    const order = r.root.findAll((n) => typeof n.type === 'string' && (n.props.accessibilityRole === 'tab' || n.props.testID === 'quick-add')).map((n) => n.props.testID);
    expect(order.filter((x, i) => order.indexOf(x) === i)).toEqual(['tab-index', 'tab-health', 'quick-add', 'tab-baby', 'tab-household']);
    act(() => r.unmount());
  });

  it('l’action centrale ouvre la feuille : 4 à 6 actions au libellé explicite, « Tous mes outils », choix des actions', async () => {
    const r = await render(<Dock {...props('household')} />);
    const add = r.root.findAll((n) => n.props.testID === 'quick-add' && typeof n.props.onPress === 'function')[0];
    await act(async () => { add.props.onPress(); });
    await act(async () => { await new Promise((res) => setTimeout(res, 40)); });
    const actions = r.root.findAll((n) => typeof n.type === 'string' && /^qa-(?!tools|customize|pick)/.test(String(n.props.testID ?? '')) && n.props.accessibilityRole === 'button');
    const ids = [...new Set(actions.map((n) => n.props.testID as string))];
    expect(ids.length).toBeGreaterThanOrEqual(4);
    expect(ids.length).toBeLessThanOrEqual(6);
    // profil sans enfant ni grossesse (aucune session) : tâche et rendez-vous sont proposés, jamais un biberon
    expect(ids).toEqual(expect.arrayContaining(['qa-task', 'qa-appointment']));
    expect(ids).not.toContain('qa-bottle');
    for (const n of actions) expect(String(n.props.accessibilityLabel).length).toBeGreaterThan(6);
    expect(r.root.findAll((n) => n.props.testID === 'qa-tools' && typeof n.type === 'string').length).toBeGreaterThan(0);
    expect(r.root.findAll((n) => n.props.testID === 'qa-customize').length).toBeGreaterThan(0);
    act(() => r.unmount());
  });

  it('un seul bouton d’action : l’écran Communauté (hors barre) remplace « Ajouter » par « Publier » (même place) et allume Aujourd’hui', async () => {
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
    expect(tabs(r).map((n) => !!n.props.accessibilityState?.selected)).toEqual([true, false, false, false]);
    act(() => { pub.props.onPress(); });
    expect(onPublish).toHaveBeenCalledTimes(1);
    // ailleurs (Accueil), le « + » revient
    await act(async () => { r.update(<QueryClientProvider client={new QueryClient()}><AuthProvider><ThemeProvider><ToastProvider><Publish /><Dock {...props('index')} /></ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>); });
    expect(r.root.findAll((n) => host(n, 'quick-add')).length).toBeGreaterThan(0);
    expect(r.root.findAll((n) => host(n, 'tab-indicator'))).toHaveLength(1);
    act(() => r.unmount());
  });

  it('une route hors barre (Questions) allume son onglet parent (Moi) ; toucher Moi y revient', async () => {
    const navigate = jest.fn();
    const r = await render(<Dock {...props('ask', navigate)} />);
    expect(tabs(r).map((n) => !!n.props.accessibilityState?.selected)).toEqual([false, true, false, false]);
    const health = r.root.findAll((n) => n.props.testID === 'tab-health' && typeof n.props.onPress === 'function')[0];
    act(() => { health.props.onPress({ nativeEvent: {} }); });
    expect(navigate).toHaveBeenCalledWith('health');
    act(() => r.unmount());
  });
});
