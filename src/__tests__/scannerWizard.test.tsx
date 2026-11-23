/**
 * Assistant du scanner (refonte v3) :
 *  - règles pures : étapes, retour, identité du produit confirmé, présélection, nature d'une erreur, tuiles de résultat
 *    (états inconnus explicites, aucune valeur inventée) ;
 *  - rendu réel (mode démonstration) : le retour à l'étape précédente (flèche ronde, segment de progression, flèche de
 *    l'en-tête) CONSERVE la saisie ; produit inconnu explicite ; erreur réseau avec « Réessayer » ; bouton principal
 *    désactivé tant que la réponse n'est pas valable ; tuiles de résultat.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true };
  const state = { params: {} as Record<string, string>, listeners: [] as Function[] };
  return {
    router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/scanner/product',
    useNavigation: () => ({ addListener: (_: string, cb: Function) => {
      state.listeners.push(cb); return () => { state.listeners = state.listeners.filter((x) => x !== cb); }; } }),
    __state: state,
  };
});
jest.mock('expo-camera', () => ({ CameraView: () => null, useCameraPermissions: () => [{ granted: false, canAskAgain: true }, jest.fn(async () => ({ granted: false, canAskAgain: false }))] }));
// Panne réseau simulée sur la recherche du code-barres (mockNet.fail appels)
const mockNet = { fail: 0 };
jest.mock('@/lib/data/hooks-scanner', () => {
  const actual = jest.requireActual('@/lib/data/hooks-scanner');
  const { BackendError: BE } = jest.requireActual('@/lib/backend/types');
  return {
    ...actual,
    useLookupBarcode: () => {
      const m = actual.useLookupBarcode();
      return { ...m, mutateAsync: async (a: unknown) => { if (mockNet.fail > 0) { mockNet.fail -= 1; throw new BE('offline', 'network'); } return m.mutateAsync(a); } };
    },
  };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(), requestMediaLibraryPermissionsAsync: jest.fn(), launchCameraAsync: jest.fn(), launchImageLibraryAsync: jest.fn(),
}));

import React from 'react';
import * as ExpoRouter from 'expo-router';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import ScanProductScreen from '@/app/scanner/product';
import ScanResultScreen from '@/app/scanner/result/[id]';
import { canJumpTo, defaultPick, failureKind, previousStep, resultTiles, subjectKey } from '@/features/scanner/wizard';
import type { StoredAnalysis } from '@/features/scanner/components';

const mockRouter = (ExpoRouter as unknown as { router: { replace: jest.Mock } }).router;
const routerState = (ExpoRouter as unknown as { __state: { params: Record<string, string>; listeners: ((e: { preventDefault: () => void }) => void)[] } }).__state;

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 30) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type !== 'string');
const one = (r: ReactTestRenderer, id: string) => {
  const found = r.root.findAll((n) => n.props.testID === id);
  if (!found.length) throw new Error(`testID introuvable : ${id}\n${allText(r)}`);
  return found[0];
};
const checked = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && n.props['aria-checked'] !== undefined)[0]?.props['aria-checked'];
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;

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
/** Appuie sur l'élément (testID ou libellé) qui porte un `onPress`. */
async function tap(r: ReactTestRenderer, key: string) {
  const el = r.root.findAll((n) => (n.props.testID === key || n.props.label === key) && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`Élément introuvable : ${key}\n${allText(r)}`);
  await act(async () => { await el.props.onPress(); });
  await flush(80);
}
async function type(r: ReactTestRenderer, testID: string, value: string) {
  const el = r.root.findAll((n) => n.props.testID === testID && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`Champ introuvable : ${testID}`);
  await act(async () => { el.props.onChangeText(value); });
  await flush(20);
}
const valueOf = (r: ReactTestRenderer, testID: string) => r.root.findAll((n) => n.props.testID === testID && typeof n.props.onChangeText === 'function')[0]?.props.value;
const primaryDisabled = (r: ReactTestRenderer, testID: string) => !!r.root.findAll((n) => n.props.testID === testID && typeof n.props.onPress === 'function')[0]?.props.disabled;

describe('assistant du scanner : règles pures', () => {
  it('étapes : retour d’une étape, la première reste la première ; seules les étapes franchies sont accessibles', () => {
    expect(previousStep('details')).toBe('profile');
    expect(previousStep('confirm')).toBe('identify');
    expect(previousStep('identify')).toBe('identify');
    expect(canJumpTo('profile', 'identify')).toBe(true);
    expect(canJumpTo('confirm', 'details')).toBe(false);
    expect(canJumpTo('confirm', 'confirm')).toBe(false);
  });

  it('identité du produit : même produit ⇒ même clé ; produit différent ⇒ clé différente', () => {
    const c = { id: 'p1', barcode: '123', name: 'Crème', brand: 'X' } as never;
    expect(subjectKey({ candidate: c, name: 'Crème', brand: 'X', barcode: '123', imageUrl: null })).toBe(subjectKey({ candidate: c, name: 'Autre', brand: null, barcode: null, imageUrl: null }));
    expect(subjectKey({ candidate: null, name: 'Lait', brand: null, barcode: null, imageUrl: null })).not.toBe(subjectKey({ candidate: null, name: 'Lait 2', brand: null, barcode: null, imageUrl: null }));
    expect(subjectKey(null)).toBeNull();
  });

  it('présélection : un seul produit trouvé par code-barres seulement', () => {
    expect(defaultPick({ candidates: 1, ciqual: 0, byBarcode: true })).toEqual({ kind: 'candidate', index: 0 });
    expect(defaultPick({ candidates: 1, ciqual: 0, byBarcode: false })).toBeNull();
    expect(defaultPick({ candidates: 3, ciqual: 0, byBarcode: true })).toBeNull();
    expect(defaultPick({ candidates: 0, ciqual: 0, byBarcode: true })).toBeNull();
  });

  it('erreur réseau distinguée des autres erreurs', () => {
    expect(failureKind(new BackendError('x', 'network'))).toBe('network');
    expect(failureKind(new TypeError('Failed to fetch'))).toBe('network');
    expect(failureKind(new BackendError('Refusé', '42501'))).toBe('other');
    expect(failureKind(new Error('?'))).toBe('other');
  });

  const base = {
    verdict: 'Informations insuffisantes', verdictReason: '', certainty: 'low', certaintyReasons: [], profile: { kind: 'adult' }, profileLabel: 'Adulte',
    findings: [], missing: [], askProfessional: null, recallDisclaimer: '', sources: [], demo: false, demoLabel: null, disclaimer: '', engineVersion: '1', analysedOn: '2026-11-10', score: null,
  };
  it('tuiles : composition, rappels et date inconnus ⇒ états inconnus explicites (jamais « 0 »)', () => {
    const a = {
      ...base, kind: 'product', product: { name: 'P', brand: null, barcode: null, imageUrl: null, type: null, typeLabel: 'Autre' },
      exposure: { type: 'unknown', label: '', explanation: '' }, zone: { type: 'unknown', label: '' }, ingredients: [], fragranceAllergens: [], perfume: 'unknown', essentialOils: [],
      packagingPrecautions: null, periodAfterOpening: null, pregnancyInfo: [], childInfo: [], recalls: [], recallCheck: { checked: false, source: 'RappelConso', error: 'hors ligne', checkedOn: '2026-11-10' },
      dataSource: { label: 'Saisie manuelle', retrieved_on: null, is_demo: false },
    } as unknown as StoredAnalysis;
    const [allergens, watch, recalls, source] = resultTiles(a);
    expect(allergens).toMatchObject({ count: null, unknown: 'no_composition' });
    expect(watch).toMatchObject({ count: null, unknown: 'no_composition' });
    expect(recalls).toMatchObject({ count: null, unknown: 'not_checked' });
    expect(source).toMatchObject({ date: null, unknown: 'no_date' });
  });

  it('tuiles : valeurs réelles (allergènes, ingrédients signalés, rappel officiel, date de la source)', () => {
    const a = {
      ...base, kind: 'product', product: { name: 'P', brand: null, barcode: '1', imageUrl: null, type: null, typeLabel: 'Soin' },
      exposure: { type: 'leave_on', label: '', explanation: '' }, zone: { type: 'body', label: '' },
      ingredients: [{ name: 'Aqua', functions: null, functionSource: null, restrictions: null, flags: [] }, { name: 'Linalool', functions: null, functionSource: null, restrictions: null, flags: ['fragrance_allergen'] }],
      fragranceAllergens: ['Linalool'], declaredAllergens: ['Linalool', 'Lait'], perfume: 'present', essentialOils: [], packagingPrecautions: null, periodAfterOpening: null, pregnancyInfo: [], childInfo: [],
      recalls: [{ id: 'r', title: 'Rappel lot 12', reason: null, recommended_action: null, official_url: null, source: 'RappelConso', published_on: null, match: 'gtin', is_demo: false }],
      recallCheck: { checked: true, source: 'RappelConso', error: null, checkedOn: '2026-11-12' },
      dataSource: { label: 'Open Beauty Facts', retrieved_on: '2026-11-01', is_demo: false },
    } as unknown as StoredAnalysis;
    const [allergens, watch, recalls, source] = resultTiles(a);
    expect(allergens).toMatchObject({ count: 2, items: ['Linalool', 'Lait'], tone: 'warning', unknown: null });
    expect(watch).toMatchObject({ count: 1, items: ['Linalool'], tone: 'warning' });
    expect(recalls).toMatchObject({ count: 1, tone: 'danger', date: '2026-11-12' });
    expect(source).toMatchObject({ date: '2026-11-01', items: ['Open Beauty Facts'], unknown: null });
  });

  it('tuiles aliment : allergènes non communiqués ⇒ inconnu (pas « aucun »)', () => {
    const a = {
      ...base, kind: 'food', food: { name: 'Brie', brand: null, barcode: null, imageUrl: null }, facets: [], ingredients: ['lait cru'], nutrition: null, answers: {}, unanswered: [],
      findings: [{ id: 'p_raw', level: 'avoid', title: 'Lait cru', explanation: '', sourceIds: [] }, { id: 'i', level: 'info', title: 'Info', explanation: '', sourceIds: [] }],
      recalls: [], recallCheck: { checked: true, source: 'RappelConso', error: null, checkedOn: '2026-11-12' }, dataSource: { label: 'Ciqual', retrieved_on: '2025-01-01', is_demo: false },
    } as unknown as StoredAnalysis;
    const [allergens, watch, recalls] = resultTiles(a);
    expect(allergens).toMatchObject({ count: null, unknown: 'not_declared' });
    expect(watch).toMatchObject({ count: 1, items: ['Lait cru'], tone: 'danger' });
    expect(recalls).toMatchObject({ count: 0, unknown: null, tone: 'neutral' });
  });
});

describe('assistant du scanner : rendu (mode démonstration)', () => {
  beforeAll(async () => {
    await backend.auth.signUp('assistant.scanner@exemple.test', 'MotDePasse!2026');
  });
  beforeEach(() => { routerState.params = {}; routerState.listeners = []; });

  it('retour à l’étape précédente : la saisie est conservée à chaque étape', async () => {
    const r = await render(<ScanProductScreen />);
    expect(allText(r)).toContain('Étape 1 sur 4 · Identifier');
    expect(primaryDisabled(r, 'scan-search')).toBe(true);
    await type(r, 'scan-query', '0000000000062');
    expect(primaryDisabled(r, 'scan-search')).toBe(false);
    await tap(r, 'scan-search');
    expect(has(r, 'scan-step-confirm')).toBe(true);
    expect(allText(r)).toContain('Étape 2 sur 4 · Confirmer');
    // un seul produit trouvé par son code : présélectionné
    expect(checked(r, 'scan-candidate-0')).toBe(true);

    // ← étape 1 : le code saisi est toujours là
    await tap(r, 'scan-prev');
    expect(has(r, 'scan-step-identify')).toBe(true);
    expect(valueOf(r, 'scan-query')).toBe('0000000000062');
    await tap(r, 'scan-search');
    await tap(r, 'scan-confirm');
    expect(has(r, 'scan-step-profile')).toBe(true);

    await tap(r, 'scan-profile-baby');
    expect(primaryDisabled(r, 'scan-next')).toBe(true); // âge requis
    await type(r, 'scan-age', '6');
    await type(r, 'scan-allergies', 'lait de vache');
    await tap(r, 'scan-next');
    expect(has(r, 'scan-step-details')).toBe(true);
    await type(r, 'scan-ingredients', 'Aqua, Glycerin');

    // ← étape 3 : âge et allergies conservés ; → étape 4 : ingrédients conservés
    await tap(r, 'scan-prev');
    expect(valueOf(r, 'scan-age')).toBe('6');
    expect(valueOf(r, 'scan-allergies')).toBe('lait de vache');
    await tap(r, 'scan-next');
    expect(valueOf(r, 'scan-ingredients')).toBe('Aqua, Glycerin');

    // Progression : toucher le segment 2 revient à « Confirmer », le choix est conservé ; re-confirmer le MÊME produit garde les précisions
    await tap(r, 'scan-progress-seg-1');
    expect(has(r, 'scan-step-confirm')).toBe(true);
    expect(checked(r, 'scan-candidate-0')).toBe(true);
    await tap(r, 'scan-confirm');
    await tap(r, 'scan-next');
    expect(valueOf(r, 'scan-ingredients')).toBe('Aqua, Glycerin');

    // Flèche de l'en-tête / retour Android : étape précédente (l'écran n'est pas quitté)
    const prevented = jest.fn();
    await act(async () => { routerState.listeners.forEach((cb) => cb({ preventDefault: prevented })); });
    await flush(40);
    expect(prevented).toHaveBeenCalled();
    expect(has(r, 'scan-step-profile')).toBe(true);
    expect(valueOf(r, 'scan-age')).toBe('6');
    r.unmount();
  });

  it('produit inconnu : état explicite, rien n’est deviné, il faut le nommer pour continuer', async () => {
    const r = await render(<ScanProductScreen />);
    await type(r, 'scan-query', '4006381333931');
    await tap(r, 'scan-search');
    expect(has(r, 'scan-unknown')).toBe(true);
    expect(allText(r)).toContain('Produit non trouvé dans les bases consultées.');
    expect(allText(r)).toContain('Code-barres lu : 4006381333931');
    expect(primaryDisabled(r, 'scan-confirm')).toBe(true);
    await type(r, 'scan-manual-name', 'Surligneur');
    expect(primaryDisabled(r, 'scan-confirm')).toBe(false);
    expect(allText(r)).toContain('Continuer avec ce nom');
    await tap(r, 'scan-confirm');
    expect(allText(r)).toContain('Surligneur');
    expect(allText(r)).toContain('EAN 4006381333931');
    r.unmount();
  });

  it('erreur réseau : message réel, « Réessayer » relance la même recherche ; la saisie reste', async () => {
    mockNet.fail = 1;
    const r = await render(<ScanProductScreen />);
    await type(r, 'scan-query', '0000000000062');
    await tap(r, 'scan-search');
    expect(has(r, 'scan-error-network')).toBe(true);
    expect(allText(r)).toContain('Pas de connexion');
    expect(has(r, 'scan-step-identify')).toBe(true);
    expect(valueOf(r, 'scan-query')).toBe('0000000000062');
    await tap(r, 'scan-retry');
    expect(has(r, 'scan-step-confirm')).toBe(true);
    expect(has(r, 'scan-error-network')).toBe(false);
    r.unmount();
  });

  it('analyse puis fiche résultat : tuiles réelles et états inconnus explicites', async () => {
    const r = await render(<ScanProductScreen />);
    await type(r, 'scan-query', '0000000000062');
    await tap(r, 'scan-search');
    await tap(r, 'scan-confirm');
    await tap(r, 'scan-profile-baby');
    await type(r, 'scan-age', '6');
    await tap(r, 'scan-next');
    await tap(r, 'scan-analyse');
    const id = String(mockRouter.replace.mock.calls.at(-1)[0]).split('/').pop()!;
    r.unmount();
    routerState.params = { id };
    const res = await render(<ScanResultScreen />);
    await flush(120);
    for (const k of ['allergens', 'watch', 'recalls', 'source']) expect(byId(res, `scan-tile-${k}`).length).toBeGreaterThan(0);
    expect(has(res, 'scan-verdict')).toBe(true);
    const t = allText(res);
    expect(t).toContain('Rappels officiels');
    expect(t).toContain('Source vérifiée le');
    expect(t).not.toMatch(/\/ ?100|sans danger garanti/);
    res.unmount();
  });

  it('fiche introuvable : état vide explicite', async () => {
    routerState.params = { id: 'inexistant' };
    const r = await render(<ScanResultScreen />);
    await flush(80);
    expect(has(r, 'scan-result-missing')).toBe(true);
    r.unmount();
  });
});
