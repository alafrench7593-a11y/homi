/**
 * Humeur → journal (refonte v3) : logique pure (semaine, relais d'aide, validation), sélecteur à lumière qui se
 * déplace (ajout rétro-compatible de ChoiceGroup), et parcours RÉELS sur le moteur local (mode démonstration) :
 * choisir → saisir → enregistrer (une seule soumission) → résultat réel → historique → détail → supprimer ;
 * journal : humeur d'abord, page, modification depuis le détail ; Réduire les animations.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/me/mood', __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
let mockFail: Error | null = null;
jest.mock('@/lib/offline', () => {
  const actual = jest.requireActual('@/lib/offline');
  return { ...actual, insertOrQueue: jest.fn((...a: unknown[]) => (mockFail ? Promise.reject(mockFail) : actual.insertOrQueue(...a))) };
});

import React from 'react';
import { AccessibilityInfo, Alert, StyleSheet } from 'react-native';
import * as ExpoRouter from 'expo-router';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { ChoiceGroup, CHOICE, orbCenter, orbGatherOffset } from '@/components/controls';
import { excerpt, fromMoodKey, supportLevel, toMoodKey, validateCheckin, weekSummary } from '@/features/mood/model';
import { resetDiaryDraft } from '@/features/mood/useMoodJournal';
import type { MoodCheckin } from '@/lib/types';
import MoodScreen from '@/app/me/mood/index';
import MoodEntryDetail from '@/app/me/mood/[id]';
import Diary from '@/app/me/diary';

const mockRouter = (ExpoRouter as unknown as { router: { replace: jest.Mock; push: jest.Mock; back: jest.Mock } }).router;
const routerState = (ExpoRouter as unknown as { __state: { params: Record<string, string> } }).__state;

function texts(node: ReactTestInstance | string): string[] {
  if (typeof node === 'string') return [node];
  return node.children.flatMap((c) => texts(c as ReactTestInstance | string));
}
const allText = (r: ReactTestRenderer) => texts(r.root).join('\n');
const flush = async (ms = 30) => { await act(async () => { await new Promise((res) => setTimeout(res, ms)); }); };
const byId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const pressId = async (r: ReactTestRenderer, id: string) => {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`introuvable : ${id}\n${allText(r)}`);
  await act(async () => { await el.props.onPress(); });
  await flush(80);
};
const typeIn = async (r: ReactTestRenderer, id: string, v: string) => {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  if (!el) throw new Error(`champ introuvable : ${id}`);
  await act(async () => { el.props.onChangeText(v); });
};

async function render(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  let r!: ReactTestRenderer;
  await act(async () => {
    r = create(<QueryClientProvider client={qc}><AuthProvider><ThemeProvider><ToastProvider>{el}</ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>);
  });
  await flush(80);
  return r;
}

const countRows = async () => (await backend.select<MoodCheckin>({ table: 'mood_checkins' })).length;
const ck = (id: string, at: Date, mood: MoodCheckin['mood'], journal: string | null = null): MoodCheckin => ({ id, user_id: 'u', checked_at: at.toISOString(), mood, feelings: [], safety_concern: false, journal });

describe('humeur → journal : logique', () => {
  const now = new Date(2026, 10, 13, 18, 0);
  const day = (n: number, h = 9) => { const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d; };

  it('semaine : comptes réels, une humeur par jour (la dernière), rien d’inventé', () => {
    const w = weekSummary([ck('a', day(0, 8), 2), ck('b', day(0, 17), 4, 'Texte'), ck('c', day(3), 3), ck('old', day(9), 1, 'Ancien')], now);
    expect(w.count).toBe(3);
    expect(w.days).toBe(2);
    expect(w.pages).toBe(1);
    expect(w.series).toEqual([null, null, null, 3, null, null, 4]);
    expect(w.real).toBe(2);
    expect(w.today).toBe(true);
    const empty = weekSummary(undefined, now);
    expect(empty).toMatchObject({ count: 0, days: 0, pages: 0, real: 0, today: false });
    expect(empty.series.every((v) => v === null)).toBe(true);
  });

  it('relais d’aide : pensées de se faire du mal ou ressenti très lourd → urgent ; très difficile → doux', () => {
    expect(supportLevel(4, [], true)).toBe('urgent');
    expect(supportLevel(3, ['Désespoir'], false)).toBe('urgent');
    expect(supportLevel(1, [], false)).toBe('soft');
    expect(supportLevel(3, ['Fatigue'], false)).toBeNull();
  });

  it('validation, clés d’humeur, extrait', () => {
    expect(validateCheckin(null, '')).toBe('mood');
    expect(validateCheckin(3, 'x'.repeat(6001))).toBe('long');
    expect(validateCheckin(3, '')).toBeNull();
    expect(toMoodKey(4)).toBe('4');
    expect(toMoodKey(null)).toBeNull();
    expect(fromMoodKey('5')).toBe(5);
    expect(fromMoodKey('9')).toBeNull();
    expect(excerpt('court')).toBe('court');
    const e = excerpt('mot '.repeat(60), 40);
    expect(e.endsWith('…')).toBe(true);
    expect(e.length).toBeLessThanOrEqual(41);
  });

  it('orbes : centres réguliers et choix qui se rapprochent du choix actif', () => {
    expect(orbCenter(0, 5, 260)).toBeCloseTo((260 - 16) / 5 / 2);
    expect(orbCenter(4, 5, 260)).toBeCloseTo(260 - (260 - 16) / 5 / 2);
    expect(orbGatherOffset(0, 2)).toBe(CHOICE.orbGather);
    expect(orbGatherOffset(4, 2)).toBe(-CHOICE.orbGather);
    expect(orbGatherOffset(2, 2)).toBe(0);
    expect(orbGatherOffset(1, -1)).toBe(0);
    // 320 px : aucune place libre entre l'orbe agrandi et ses voisins → pas de décalage (jamais de chevauchement)
    expect(orbGatherOffset(0, 2, 256, 5)).toBe(0);
    expect(orbGatherOffset(4, 2, 326, 5)).toBe(-CHOICE.orbGather);
  });
});

describe('ChoiceGroup orbes : lumière qui se déplace (rétro-compatible)', () => {
  const opts = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }];
  it('défaut « each » : aucune lumière mobile (comportement historique)', async () => {
    const r = await render(<ChoiceGroup variant="orbs" label="g" value="b" onChange={() => undefined} options={opts} />);
    expect(byId(r, 'choice-light')).toHaveLength(0);
    r.unmount();
  });
  it('« travel » : une seule lumière, posée sous le choix', async () => {
    const r = await render(<ChoiceGroup variant="orbs" light="travel" label="g" value="b" onChange={() => undefined} options={opts} />);
    expect(byId(r, 'choice-light')).toHaveLength(1);
    const radios = r.root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.type === 'string');
    expect(radios.filter((n) => n.props.accessibilityState?.checked)).toHaveLength(1);
    r.unmount();
  });
});

describe('humeur → journal : parcours (mode démonstration)', () => {
  beforeAll(async () => {
    await backend.auth.signUp('humeur.journal@exemple.test', 'MotDePasse!2026');
  });
  beforeEach(() => { routerState.params = {}; mockRouter.push.mockClear(); mockRouter.back.mockClear(); resetDiaryDraft(); });
  afterEach(() => jest.restoreAllMocks());

  let entryId = '';

  it('bilan : choisir → la saisie apparaît → enregistrer une seule fois → résultat réel → historique', async () => {
    const r = await render(<MoodScreen />);
    expect(byId(r, 'mood-details')).toHaveLength(0);
    const disabledOf = (id: string) => r.root.findAll((n) => n.props.testID === id && n.props.accessibilityState)[0]?.props.accessibilityState?.disabled;
    expect(disabledOf('mood-main-action')).toBe(true); // présent mais éteint tant qu'aucune humeur n'est choisie
    expect(allText(r)).toContain('Aucun bilan pour l’instant');
    expect(byId(r, 'tile-empty').length).toBeGreaterThan(0); // tuiles : état vide explicite

    await pressId(r, 'mood-4');
    expect(disabledOf('mood-main-action')).toBe(false);
    expect(byId(r, 'mood-details').length).toBeGreaterThan(0);
    expect(allText(r)).toContain('Aujourd’hui : Plutôt bien');
    await typeIn(r, 'mood-note', 'Une promenade au soleil.');

    const before = await countRows();
    const btn = r.root.findAll((n) => n.props.testID === 'mood-main-action' && typeof n.props.onPress === 'function')[0];
    await act(async () => { const a = btn.props.onPress(); const b = btn.props.onPress(); await Promise.all([a, b]); });
    await flush(150);
    expect(await countRows()).toBe(before + 1); // double appui : un seul bilan

    expect(byId(r, 'mood-result-sent').length).toBeGreaterThan(0);
    expect(allText(r)).toContain('Bilan enregistré');
    expect(byId(r, 'mood-details')).toHaveLength(0); // composeur refermé
    expect(disabledOf('mood-main-action')).toBe(true); // le bouton reste en place (pas de double appui sur la liste)
    const rows = r.root.findAll((n) => n.props.testID === 'mood-entry' && typeof n.props.onPress === 'function');
    expect(rows).toHaveLength(1);
    expect(allText(r)).toContain('Une promenade au soleil.');
    await act(async () => { rows[0].props.onPress(); });
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/me/mood/[id]' }));
    entryId = mockRouter.push.mock.calls.at(-1)[0].params.id;
    r.unmount();
  });

  it('bilan : échec réel → message d’erreur, le choix est gardé, rien n’est annoncé comme fait', async () => {
    const r = await render(<MoodScreen />);
    await pressId(r, 'mood-2');
    mockFail = Object.assign(new Error('permission denied'), { code: '42501' });
    await pressId(r, 'mood-main-action');
    mockFail = null;
    expect(byId(r, 'mood-result-error').length).toBeGreaterThan(0);
    expect(byId(r, 'mood-result-sent')).toHaveLength(0);
    expect(byId(r, 'mood-details').length).toBeGreaterThan(0);
    r.unmount();
  });

  it('bilan : réponse inquiétante → relais d’aide immédiat', async () => {
    const r = await render(<MoodScreen />);
    await pressId(r, 'mood-3');
    const toggle = r.root.findAll((n) => n.props.accessibilityRole === 'switch' && typeof n.props.onPress === 'function')[0]
      ?? r.root.findAll((n) => n.props.label === 'J’ai eu des pensées de me faire du mal' && typeof n.props.onChange === 'function')[0];
    await act(async () => { (toggle.props.onPress ?? (() => toggle.props.onChange(true)))(); });
    await flush(50);
    expect(byId(r, 'mood-support-now').length).toBeGreaterThan(0);
    expect(allText(r)).toContain('3114');
    r.unmount();
  });

  it('détail : lecture, puis « Modifier la page » ouvre le journal en modification', async () => {
    routerState.params = { id: entryId };
    const r = await render(<MoodEntryDetail />);
    expect(byId(r, 'mood-detail').length).toBeGreaterThan(0);
    expect(allText(r)).toContain('Une promenade au soleil.');
    expect(allText(r)).toContain('Plutôt bien');
    await pressId(r, 'mood-detail-edit');
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/me/diary', params: { edit: entryId } });
    r.unmount();

    routerState.params = { edit: entryId };
    const d = await render(<Diary />);
    await flush(80);
    expect(allText(d)).toContain('Modification de la page');
    await typeIn(d, 'diary-text', 'Une promenade au soleil, puis un thé.');
    await pressId(d, 'diary-save');
    expect(allText(d)).toContain('Page modifiée');
    expect(allText(d)).toContain('Une promenade au soleil, puis un thé.');
    d.unmount();
  });

  it('journal : humeur d’abord, puis la page ; erreur si vide ; page gardée une seule fois', async () => {
    const r = await render(<Diary />);
    expect(byId(r, 'diary-text')).toHaveLength(0);
    expect(r.root.findAll((n) => n.props.testID === 'diary-save' && n.props.accessibilityState)[0].props.accessibilityState.disabled).toBe(true);
    await pressId(r, 'diary-mood-5');
    expect(byId(r, 'diary-text').length).toBeGreaterThan(0);
    await pressId(r, 'diary-save');
    expect(allText(r)).toContain('Écrivez quelques mots avant de garder cette page.');
    await typeIn(r, 'diary-text', 'Premiers pas de Léa.');
    const before = await countRows();
    const btn = r.root.findAll((n) => n.props.testID === 'diary-save' && typeof n.props.onPress === 'function')[0];
    await act(async () => { await Promise.all([btn.props.onPress(), btn.props.onPress()]); });
    await flush(150);
    expect(await countRows()).toBe(before + 1);
    expect(byId(r, 'diary-result-sent').length).toBeGreaterThan(0);
    expect(r.root.findAll((n) => n.props.testID === 'diary-page' && typeof n.props.onPress === 'function')).toHaveLength(2);
    r.unmount();
  });

  it('détail : supprimer (confirmation) → retour seulement après la suppression réelle ; introuvable ensuite', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { const b = buttons?.find((x) => x.style === 'destructive') ?? buttons?.at(-1); b?.onPress?.(); });
    routerState.params = { id: entryId };
    const r = await render(<MoodEntryDetail />);
    await pressId(r, 'mood-detail-delete');
    await flush(150);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    r.unmount();
    const again = await render(<MoodEntryDetail />);
    expect(byId(again, 'mood-detail-missing').length).toBeGreaterThan(0);
    again.unmount();
  });

  it('Réduire les animations : la saisie apparaît d’emblée, entièrement visible', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const r = await render(<MoodScreen />);
    await flush(50);
    await pressId(r, 'mood-1');
    const reveal = byId(r, 'mood-details')[0];
    const style = StyleSheet.flatten(reveal.props.style) as { opacity?: number };
    expect(style.opacity ?? 1).toBe(1);
    expect(byId(r, 'mood-support-now').length).toBeGreaterThan(0); // très difficile → relais doux
    r.unmount();
  });
});
