/**
 * Rendu réel des écrans du scanner sur le moteur local (mode démonstration) :
 * accueil, saisie d'un code, « Est-ce bien ce produit ? », analyse, fiche résultat
 * (étiquette « Données de démonstration », rappel fictif, explication IA non configurée).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/scanner', useNavigation: () => ({ addListener: () => () => undefined }), __state: state };
});
jest.mock('expo-camera', () => ({ CameraView: () => null, useCameraPermissions: () => [{ granted: false, canAskAgain: true }, jest.fn(async () => ({ granted: false, canAskAgain: false }))] }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(), requestMediaLibraryPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn(),
}));

import React from 'react';
import * as ExpoRouter from 'expo-router';
const mockRouter = (ExpoRouter as unknown as { router: { replace: jest.Mock; push: jest.Mock } }).router;
const routerState = (ExpoRouter as unknown as { __state: { params: Record<string, string> } }).__state;
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import ScannerHub from '@/app/scanner/index';
import ScanProductScreen from '@/app/scanner/product';
import ScanFoodScreen from '@/app/scanner/food';
import ScanResultScreen from '@/app/scanner/result/[id]';
import ScanHistoryScreen from '@/app/scanner/history';
import CompareScreen from '@/app/scanner/compare';

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 30) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };

async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(
      <QueryClientProvider client={qc}>
        <AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider>
      </QueryClientProvider>,
    );
  });
  await flush(60);
  return r;
}
async function press(r: ReactTestRenderer, label: string, prop: 'label' | 'title' = 'label') {
  const el = r.root.findAll((n) => n.props[prop] === label && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`Élément introuvable : ${label}\n${allText(r)}`);
  await act(async () => { await el.props.onPress(); });
  await flush(80);
}

describe('écrans du scanner (mode démonstration)', () => {
  let resultId = '';
  beforeAll(async () => {
    await backend.auth.signUp('ecrans.scanner@exemple.test', 'MotDePasse!2026');
  });

  it('accueil : deux parcours, démonstration signalée', async () => {
    const r = await render(<ScannerHub />);
    const t = allText(r);
    expect(t).toContain('Scanner un produit');
    expect(t).toContain('Scanner un aliment');
    expect(t).toContain('Données de démonstration');
    r.unmount();
  });

  it('produit : code de démonstration → confirmation → analyse enregistrée', async () => {
    const r = await render(<ScanProductScreen />);
    expect(allText(r)).toContain('Lecture locale indisponible ici : utilisez la saisie manuelle');
    await press(r, '0000000000062');
    expect(allText(r)).toContain('Est-ce bien ce produit ?');
    expect(allText(r)).toContain('Lingettes parfumées démo');
    expect(allText(r)).toContain('DONNÉES DE DÉMONSTRATION');
    await press(r, 'Oui, c’est ce produit');
    expect(allText(r)).toContain('Pour qui ?');
    await press(r, 'Bébé (moins de 3 ans)');
    const age = r.root.findAll((n) => n.props.label === 'Âge (en mois)' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { age.props.onChangeText('6'); });
    await press(r, 'Continuer');
    await press(r, 'Analyser');
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringMatching(/^\/scanner\/result\//));
    resultId = String(mockRouter.replace.mock.calls.at(-1)[0]).split('/').pop()!;
    r.unmount();
  });

  it('fiche résultat : verdict, rappel, sources, mention obligatoire, IA non configurée', async () => {
    routerState.params = { id: resultId };
    const r = await render(<ScanResultScreen />);
    await flush(120);
    const t = allText(r);
    expect(t).toContain('Déconseillé pour ce profil selon la source indiquée');
    expect(t).toContain('Données de démonstration');
    expect(t).toContain('L’absence de rappel officiel ne signifie pas que le produit est garanti sans danger.');
    expect(t).toContain('Explication IA non configurée');
    expect(t).toContain('ANSM');
    expect(t).toMatch(/Niveau de certitude : Faible/);
    expect(t).not.toMatch(/sans toxines|totalement sans danger|\/ ?100/);
    await press(r, 'Ajouter aux favoris');
    r.unmount();
  });

  it('aliment : titre et questions complémentaires', async () => {
    const r = await render(<ScanFoodScreen />);
    await press(r, '0000000000024');
    await press(r, 'Oui, c’est ce produit');
    await press(r, 'Personne enceinte');
    expect(allText(r)).toContain('Pour qui ?');
    await press(r, 'Continuer');
    await press(r, 'Analyser');
    expect(mockRouter.replace).toHaveBeenCalledTimes(2);
    r.unmount();
  });

  it('historique, favoris et comparaison', async () => {
    routerState.params = {};
    const h = await render(<ScanHistoryScreen />);
    expect(allText(h)).toContain('Lingettes parfumées démo ★');
    expect(allText(h)).toContain('Brie au lait cru démo');
    h.unmount();
    const c = await render(<CompareScreen />);
    await press(c, 'Lingettes parfumées démo', 'title');
    await press(c, 'Brie au lait cru démo (aliment)', 'title');
    expect(allText(c)).toContain('Aucun classement ni note globale');
    c.unmount();
  });
});
