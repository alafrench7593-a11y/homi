/**
 * Audit navigation (13/11/2026, docs/audit/01_navigation.md, N-01) : une carte d'outil « d'un autre profil » (onglets
 * Santé, Bébé, Famille › « Outils des autres profils ») sélectionnait le profil AVANT l'élévation de la carte ; la carte
 * changeait alors de section, était démontée, l'élévation annulée… et l'outil ne s'ouvrait jamais (clic sans effet).
 * Le profil est désormais choisi au moment de l'ouverture, juste avant la navigation.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({}), usePathname: () => '/baby', Link: () => null }));
// Élévation contrôlée par le test : le rappel n'est exécuté que si l'animation va à son terme
const pending: (() => void)[] = [];
jest.mock('@/motion', () => {
  const actual = jest.requireActual('@/motion');
  return { ...actual, useCardLift: () => ({ style: {}, shadow: {}, open: (cb: () => void) => { pending.push(cb); }, settle: () => {}, lift: { value: 0 } }) };
});

import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { router } from 'expo-router';
import { ToolCard } from '@/components/ToolCard';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import { ThemeProvider } from '@/theme/ThemeProvider';

const tool: CatalogTool = { id: 'sleep:/sleep/abc', key: 'kid_sleep_rhythm', theme: 'sleep', icon: 'trending-up', label: 'Planning de sommeil', href: '/sleep/abc' };

it('le profil n’est choisi qu’à l’ouverture (la carte n’est pas démontée avant la navigation)', async () => {
  const beforeOpen = jest.fn();
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider><ToolCard tool={tool} width={160} favorite={false} onToggleFavorite={() => {}} beforeOpen={beforeOpen} /></ThemeProvider>); });
  const card = r.root.find((n) => n.props?.accessibilityRole === 'button' && typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('Planning de sommeil') && typeof n.props.onPress === 'function');
  await act(async () => { card.props.onPress({ nativeEvent: { pageY: 100 } }); });
  // pendant l'élévation : profil inchangé (sinon la carte change de section et l'élévation est annulée)
  expect(beforeOpen).not.toHaveBeenCalled();
  expect(pending).toHaveLength(1);
  await act(async () => { pending.shift()!(); });
  expect(beforeOpen).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/sleep/abc');
});

it('urgence : profil choisi et outil ouvert immédiatement', async () => {
  const beforeOpen = jest.fn();
  (router.push as jest.Mock).mockClear();
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<ThemeProvider><ToolCard tool={{ ...tool, urgent: true, href: '/family/sos' }} width={160} favorite={false} onToggleFavorite={() => {}} beforeOpen={beforeOpen} /></ThemeProvider>); });
  const card = r.root.find((n) => n.props?.accessibilityRole === 'button' && typeof n.props.onPress === 'function' && String(n.props.accessibilityLabel).startsWith('Planning'));
  await act(async () => { card.props.onPress({ nativeEvent: { pageY: 100 } }); });
  expect(beforeOpen).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith('/family/sos');
});
