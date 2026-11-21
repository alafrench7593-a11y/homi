/**
 * Tickets 4 et 5 (21/11/2026).
 *  4 — Papiers de la famille : « Scanner un document » (action principale), garde contre les doubles appuis,
 *      refus de l'appareil photo (lien vers les Réglages), annulation, échec d'enregistrement → « Réessayer ».
 *  5 — Aura : chaque code d'erreur du serveur affiche un état clair ET l'action utile (offre, crédits, accord,
 *      réessayer, repli local) ; délai dépassé ; saisie bloquée expliquée ; raison du mode sans IA ; voix (état réel,
 *      phases de la dictée) ; « Se comprendre » (brouillon) ; analyse des biberons (agrégats, données insuffisantes) ;
 *      recherche d'outils (« Où noter sa sieste ? », « Mon bébé prend le sein ») vers la vraie route du bon profil.
 * Aucune IA n'est appelée : réponses du serveur SIMULÉES (espion sur backend.invoke) ou démonstration (modèle simulé).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => mockParams, useIsFocused: () => true, usePathname: () => '/assistant', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), useFocusEffect: () => undefined };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));

import React from 'react';
import { Linking } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, BackendError } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { FEATURES } from '@/config/features';
import { AuraScreen } from '@/features/aura/AuraScreen';
import * as auraApi from '@/features/aura/api';
import { askAura, auraErrorAction, classifyAuraError } from '@/features/aura/api';
import { bottleAggregate, analysisPeriod, previewRows } from '@/features/aura/analysis';
import { nextDictationPhase, voiceStatus, resetVoiceCaps } from '@/features/aura/voice';
import { toTranslatorGoal, translatorRoute, TRANSLATOR_GOALS } from '@/features/aura/translator';
import { createTapGuard, papersScanParams, captureOutcome } from '@/lib/documents/scanFlow';
import * as io from '@/lib/documents/io';
import { setPendingImport } from '@/lib/documents/pending';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { catalogForServer, searchForAura } from '@/features/aura/model';
import { runAura } from '../../supabase/functions/_shared/aura-run';
import { sanitizeAnalysis, auraCreditAction, AURA_ANALYSIS_KINDS } from '../../supabase/functions/_shared/aura-data';
import { simulatedTurn } from '@/lib/backend/demoAura';
import { tMaybe } from '@/i18n';
import { toolWordsKey } from '@/lib/journeys/tools';
import Papers from '@/app/family/papers';
import ScanScreen from '@/app/documents/scan';
import Understand from '@/app/family/understand/index';

jest.setTimeout(120000);
const { router } = require('expo-router') as { router: { push: jest.Mock; replace: jest.Mock } };

// ------------------------------------------------------------------ outils de rendu
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
  await flush(500);
  return r;
}
async function until(cond: () => boolean, ms = 8000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(80); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
const pressable = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, text: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  await act(async () => { el.props.onChangeText(text); });
}
async function say(r: ReactTestRenderer, text: string) { await type(r, 'aura-input', text); await press(r, 'aura-send', 400); }

beforeAll(async () => {
  await backend.auth.signUp('tickets@exemple.test', 'MotDePasse!2026');
  await backend.rpc<string>('create_household', { p_name: 'Foyer Tickets' });
});
afterEach(() => { for (const k of Object.keys(mockParams)) delete mockParams[k]; jest.restoreAllMocks(); router.push.mockClear(); router.replace.mockClear(); });
afterAll(async () => { await flush(1200); });

// ================================================================== Ticket 4
describe('Ticket 4 — logique du scanner depuis Papiers de la famille', () => {
  it('garde SYNCHRONE : deux appuis simultanés n’ouvrent qu’une fois ; le verrou retombe après un échec', async () => {
    const g = createTapGuard();
    const fn = jest.fn(async () => { await new Promise((r) => setTimeout(r, 20)); return 1; });
    const [a, b] = await Promise.all([g.run(fn), g.run(fn)]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect([a, b]).toEqual([1, undefined]);
    await expect(g.run(async () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(g.busy).toBe(false);
    expect(await g.run(async () => 2)).toBe(2);
  });
  it('paramètres : appareil photo, catégorie Démarches, retour vers les papiers, profil de l’enfant affiché', () => {
    expect(papersScanParams({ childId: 'c1', camera: true })).toEqual({ from: 'camera', origin: 'papers', cat: 'admin', child: 'c1' });
    expect(papersScanParams({ childId: null, camera: false })).toEqual({ origin: 'papers', cat: 'admin' });
  });
  it('issue de la prise de vue : refus, annulation, photo, échec', () => {
    expect(captureOutcome('denied')).toBe('denied');
    expect(captureOutcome(null)).toBe('canceled');
    expect(captureOutcome('file:///p.jpg')).toBe('taken');
    expect(captureOutcome(new Error('x'))).toBe('failed');
  });
});

describe('Ticket 4 — écrans', () => {
  it('Papiers de la famille : « Scanner un document » est l’action principale ; double appui → une seule ouverture', async () => {
    const r = await render(<Papers />);
    expect(allText(r)).toContain('Scanner un document');
    expect(allText(r)).toContain('Le document sera rangé pour la famille');
    const btn = pressable(r, 'pp-scan');
    await act(async () => { void btn.props.onPress(); void btn.props.onPress(); });
    await flush(100);
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({ pathname: '/documents/scan', params: { from: 'camera', origin: 'papers', cat: 'admin' } });
    // l'import existant reste disponible (photos de la galerie, dans le même écran de numérisation)
    expect(has(r, 'pp-import')).toBe(true);
    r.unmount();
  });

  it('scanner : refus de l’appareil photo → message + « Ouvrir les Réglages » ; double appui = une seule demande', async () => {
    let resolve!: (v: 'denied') => void;
    const cap = jest.spyOn(io, 'capturePhoto').mockImplementation(() => new Promise((res) => { resolve = res; }));
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as never);
    Object.assign(mockParams, { origin: 'papers', cat: 'admin' });
    const r = await render(<ScanScreen />);
    const take = r.root.findAll((n) => typeof n.props.onPress === 'function' && texts(n).join('').includes('Prendre une photo'))[0]
      ?? r.root.findAll((n) => typeof n.props.onPress === 'function' && n.props.icon === 'camera')[0];
    await act(async () => { void take.props.onPress(); void take.props.onPress(); });
    expect(cap).toHaveBeenCalledTimes(1);
    await act(async () => { resolve('denied'); });
    await flush(100);
    expect(has(r, 'scan-camera-denied')).toBe(true);
    await press(r, 'scan-open-settings');
    expect(settings).toHaveBeenCalled();
    r.unmount();
  });

  it('scanner : annulation → message clair, rien d’ajouté', async () => {
    jest.spyOn(io, 'capturePhoto').mockResolvedValue(null);
    const r = await render(<ScanScreen />);
    const take = r.root.findAll((n) => typeof n.props.onPress === 'function' && n.props.icon === 'camera')[0];
    await act(async () => { await take.props.onPress(); });
    await flush(100);
    expect(has(r, 'scan-camera-canceled')).toBe(true);
    r.unmount();
  });

  it('enregistrement : échec → bandeau + « Réessayer » ; nouvel essai réussi → retour aux papiers', async () => {
    setPendingImport({ kind: 'files', files: [{ uri: 'file:///livret.jpg', name: 'livret.jpg', mimeType: 'image/jpeg', size: 1200 }] });
    Object.assign(mockParams, { origin: 'papers', cat: 'admin' });
    const up = jest.spyOn(backend.storage, 'upload').mockRejectedValueOnce(new BackendError('réseau', 'network'));
    const r = await render(<ScanScreen />);
    await type(r, 'scan-title', 'Livret de famille').catch(() => undefined);
    await press(r, 'scan-save', 600);
    expect(has(r, 'scan-save-failed')).toBe(true);
    expect(((await backend.select({ table: 'documents' })) ?? []).length).toBe(0); // rien de conservé à moitié
    up.mockResolvedValue(undefined as never);
    await press(r, 'scan-save-retry', 800);
    await until(() => has(r, 'scan-back-papers'));
    expect(has(r, 'scan-back-papers')).toBe(true);
    const docs = (await backend.select<{ title: string; category: string; private_to_uploader: boolean }>({ table: 'documents' })) ?? [];
    expect(docs.map((d) => [d.title, d.category, d.private_to_uploader])).toEqual([['livret', 'admin', true]]);
    r.unmount();
  });
});

// ================================================================== Ticket 5 — erreurs
describe('Ticket 5 — erreurs du serveur : état clair et action utile', () => {
  it('classement et action de chaque code', () => {
    const e = (code: string, status?: number) => new BackendError('x', code, code === 'premium_required' ? 'premium_required' : undefined, status);
    expect(classifyAuraError(e('premium_required', 402))).toBe('premium');
    expect(classifyAuraError(e('insufficient_credits', 402))).toBe('credits');
    expect(classifyAuraError(e('consent_required', 403))).toBe('consent');
    expect(classifyAuraError(e('data_consent_required', 403))).toBe('consent');
    expect(classifyAuraError(e('ai_disabled', 503))).toBe('off');
    expect(classifyAuraError(e('ai_not_configured', 503))).toBe('off');
    expect(classifyAuraError(e('coming_soon', 503))).toBe('off');
    expect(classifyAuraError(e('timeout'))).toBe('network');
    expect(classifyAuraError(e('function_error'))).toBe('network');
    expect(classifyAuraError(e('assistant_unavailable', 503))).toBe('unavailable');
    expect(classifyAuraError(e('duplicate_request', 409))).toBe('duplicate');
    expect(auraErrorAction('premium')).toBe('offer');
    expect(auraErrorAction('credits')).toBe('credits');
    expect(auraErrorAction('consent')).toBe('consent');
    expect(auraErrorAction('network')).toBe('retry');
    expect(auraErrorAction('unavailable')).toBe('retry');
    expect(auraErrorAction('duplicate')).toBe(null);
  });

  it('délai dépassé : la demande s’arrête (code « timeout », classée réseau) au lieu d’attendre sans fin', async () => {
    const never = (() => new Promise(() => undefined)) as never;
    const err = await askAura({ kind: 'chat', message: 'bonjour' }, { timeoutMs: 30, invoke: never }).catch((x) => x);
    expect(err).toBeInstanceOf(BackendError);
    expect(err.code).toBe('timeout');
    expect(classifyAuraError(err)).toBe('network');
  });
});

describe('Ticket 5 — écran d’Aura (réponses du serveur SIMULÉES)', () => {
  beforeAll(async () => {
    const uid = (await backend.auth.getSession())!.userId;
    await backend.insert('consents', { user_id: uid, purpose: 'ai_assistant', granted: true, version: '1' });
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
  });
  beforeEach(() => { FEATURES.aiAssistantOnline = true; });
  afterAll(() => { FEATURES.aiAssistantOnline = false; });

  // réponse du serveur SIMULÉE : l'appel d'Aura échoue avec le code donné (même objet d'erreur que le client Supabase)
  const fail = (code: string, status?: number) => jest.spyOn(auraApi, 'askAura').mockRejectedValue(new BackendError('x', code, code === 'premium_required' ? 'premium_required' : undefined, status));

  it('premium_required → « Aura en ligne fait partie de HOMI Premium » + « Voir l’offre Premium » ; la saisie reste possible', async () => {
    fail('premium_required', 402);
    const r = await render(<AuraScreen />);
    await say(r, 'Quel outil pour les courses ?');
    await until(() => has(r, 'aura-error'));
    expect(allText(r)).toContain('Aura en ligne fait partie de HOMI Premium');
    await press(r, 'aura-err-offer');
    expect(router.push).toHaveBeenCalledWith('/settings/subscription');
    expect(has(r, 'aura-try-local')).toBe(true);
    expect(r.root.findAll((n) => n.props.testID === 'aura-input')[0].props.editable).toBe(true);
    r.unmount();
  });

  it('insufficient_credits → la question reste, « Ajouter des crédits » rouvre la feuille des packs', async () => {
    fail('insufficient_credits', 402);
    const r = await render(<AuraScreen />);
    await say(r, 'Quel outil pour les courses ?');
    await until(() => has(r, 'aura-err-credits'));
    expect(has(r, 'aura-msg-user')).toBe(true);
    expect(allText(r)).toContain('Tu n’as plus assez de crédits pour cette question.');
    expect(allText(r)).toContain('Tu n’as plus de crédits'); // feuille existante des packs
    r.unmount();
  });

  it('consent_required → « Lire et donner mon accord » → feuille d’accord ; accepter relance la question', async () => {
    const inv = fail('consent_required', 403);
    const r = await render(<AuraScreen />);
    await say(r, 'Quel outil pour les courses ?');
    await until(() => has(r, 'aura-err-consent'));
    await press(r, 'aura-err-consent');
    expect(has(r, 'aura-consent-sheet')).toBe(true);
    inv.mockResolvedValue({ kind: 'chat', safety: 'none', answer: 'Réponse simulée par le test', actions: [], credits: { cost: 1, charged: true } } as never);
    await press(r, 'aura-consent-sheet-accept', 800);
    await until(() => has(r, 'aura-reply'));
    expect(allText(r)).toContain('Réponse simulée par le test');
    r.unmount();
  });

  it('ai_disabled / ai_not_configured / coming_soon (503) → repli local immédiat, raison affichée', async () => {
    for (const code of ['ai_disabled', 'ai_not_configured', 'coming_soon']) {
      fail(code, 503);
      const r = await render(<AuraScreen />);
      await say(r, 'Où noter sa sieste ?');
      await until(() => has(r, 'aura-local-reply'));
      expect([code, allText(r)]).toEqual([code, expect.stringContaining('Mode local, sans IA')]);
      expect(allText(r)).toContain('Le serveur a répondu que l’IA est coupée');
      r.unmount();
      jest.restoreAllMocks();
    }
  });

  it('réseau → « Réessayer » réutilise la même clé ; nouvel essai réussi', async () => {
    const inv = fail('network');
    const r = await render(<AuraScreen />);
    await say(r, 'Quel outil pour les courses ?');
    await until(() => has(r, 'aura-retry'));
    const key1 = (inv.mock.calls[0][0] as { request_id: string }).request_id;
    inv.mockResolvedValue({ kind: 'chat', safety: 'none', answer: 'Deuxième essai', actions: [], credits: { cost: 1, charged: true } } as never);
    await press(r, 'aura-retry', 600);
    await until(() => has(r, 'aura-reply'));
    expect((inv.mock.calls[1][0] as { request_id: string }).request_id).toBe(key1);
    r.unmount();
  });

  it('sans abonnement : saisie bloquée EXPLIQUÉE juste au-dessus du champ, avec « Voir l’offre » et « Chercher sans IA »', async () => {
    await backend.rpc('set_demo_subscription', { active: false });
    const r = await render(<AuraScreen />);
    await until(() => has(r, 'aura-blocked'));
    expect(allText(r)).toContain('il faut HOMI Premium actif');
    await press(r, 'aura-blocked-offer');
    expect(router.push).toHaveBeenCalledWith('/settings/subscription');
    await press(r, 'aura-blocked-local');
    expect(allText(r)).toContain('Tu as choisi le mode sans IA');
    expect(r.root.findAll((n) => n.props.testID === 'aura-input')[0].props.editable).toBe(true);
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
    r.unmount();
  });

  it('démonstration de bout en bout (modèle SIMULÉ) : « Où noter sa sieste ? » propose d’ouvrir le suivi du sommeil', async () => {
    const r = await render(<AuraScreen />);
    await say(r, 'Où noter sa sieste ?');
    await until(() => has(r, 'aura-reply'));
    expect(allText(r)).toContain('Démonstration : réponses simulées, aucune IA');
    expect(r.root.findAll((n) => typeof n.props.testID === 'string' && /^aura-action-open/.test(n.props.testID)).length).toBeGreaterThan(0);
    r.unmount();
  });
});

describe('Ticket 5 — application telle qu’elle est livrée (Aura en ligne pas encore ouverte)', () => {
  it('mode sans IA : la raison exacte est dite, la saisie et l’envoi fonctionnent, réponse locale', async () => {
    FEATURES.aiAssistantOnline = false;
    const r = await render(<AuraScreen />);
    // démonstration : la démonstration reste disponible ; on force le chemin de production (pas de démo) via mode=local
    r.unmount();
    mockParams.mode = 'local';
    const r2 = await render(<AuraScreen />);
    expect(has(r2, 'aura-local-reason')).toBe(true);
    await say(r2, 'Mon bébé prend le sein');
    await until(() => has(r2, 'aura-local-reply'));
    expect(has(r2, 'aura-error')).toBe(false);
    r2.unmount();
  });
});

// ================================================================== Ticket 5 — voix, intro, outils
describe('Ticket 5 — voix', () => {
  it('état réel sur téléphone sans module compilé : lecture « needs_build », dictée par le clavier', () => {
    resetVoiceCaps();
    const s = voiceStatus();
    expect(s.dictation).toBe('keyboard');
    expect(['ok', 'needs_build']).toContain(s.tts);
  });
  it('phases de la dictée : écoute → traitement → fin (ou erreur, ou annulation)', () => {
    let p = nextDictationPhase('idle', 'start');
    expect(p).toBe('listening');
    p = nextDictationPhase(p, 'stop');
    expect(p).toBe('processing');
    expect(nextDictationPhase(p, 'end', true)).toBe('done');
    expect(nextDictationPhase(p, 'end', false)).toBe('idle');
    expect(nextDictationPhase('listening', 'error')).toBe('error');
    expect(nextDictationPhase('error', 'end', true)).toBe('error');
    expect(nextDictationPhase('listening', 'cancel')).toBe('idle');
  });
  it('présentation : brève, explique outil / écran / données partagées par choix ; 5 langues', () => {
    for (const l of ['fr', 'en', 'de', 'es', 'it']) {
      const s = require(`@/i18n/${l}/themesAura`).themesAura['ta.intro.hello'] as string;
      expect(s.length).toBeLessThan(260);
    }
    const fr = require('@/i18n/fr/themesAura').themesAura['ta.intro.hello'] as string;
    expect(fr).toMatch(/outil/);
    expect(fr).toMatch(/écran/);
    expect(fr).toMatch(/si tu choisis de les partager/);
  });
});

describe('Ticket 5 — Se comprendre', () => {
  it('trois aides d’Aura ouvrent la vraie route avec l’aide choisie', async () => {
    expect(TRANSLATOR_GOALS).toEqual(['reformulate', 'need', 'discussion']);
    expect(toTranslatorGoal('need')).toBe('need');
    expect(toTranslatorGoal('autre')).toBe('reformulate');
    const r = await render(<Understand />);
    expect(has(r, 'und-aura')).toBe(true);
    await press(r, 'und-aura-need');
    expect(router.push).toHaveBeenCalledWith(translatorRoute('need'));
    r.unmount();
  });
  it('« Exprimer un besoin calmement » : 3 propositions (simulées), choix → BROUILLON, rien envoyé au partenaire', async () => {
    FEATURES.aiAssistantOnline = true;
    const uid = (await backend.auth.getSession())!.userId;
    await backend.insert('consents', { user_id: uid, purpose: 'ai_assistant', granted: true, version: '1' });
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
    Object.assign(mockParams, { theme: 'emotion_translator', goal: 'need' });
    const r = await render(<AuraScreen />);
    expect(allText(r)).toContain('Exprimer un besoin calmement');
    expect(allText(r)).toContain('Le texte choisi devient un brouillon');
    await type(r, 'aura-ref-draft', 'J’ai besoin de dormir une nuit complète');
    await press(r, 'aura-ref-go', 800);
    await until(() => r.root.findAll((n) => n.props.testID === 'aura-ref-option').length > 0);
    const opt = r.root.findAll((n) => n.props.testID === 'aura-ref-option' && typeof n.props.onPress === 'function')[0];
    await act(async () => { opt.props.onPress(); });
    await press(r, 'aura-ref-use', 400);
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/family/understand/compose' }));
    expect(((await backend.select({ table: 'couple_messages' })) ?? []).length).toBe(0);
    FEATURES.aiAssistantOnline = false;
    r.unmount();
  });
});

describe('Ticket 5 — analyse des biberons (agrégats calculés sur le téléphone)', () => {
  const now = new Date('2026-11-21T20:00:00');
  const at = (daysAgo: number, h: number) => new Date(now.getTime() - daysAgo * 86_400_000 - (20 - h) * 3_600_000).toISOString();
  it('moins de 3 jours notés → données insuffisantes (null)', () => {
    expect(bottleAggregate([{ at: at(0, 8), consumed_ml: 120 }, { at: at(1, 8), consumed_ml: 100 }], '2026-06-01', now)).toBeNull();
  });
  it('moyennes, période, aucune donnée personnelle ; schéma fermé côté serveur ; coût « tool_analysis »', () => {
    const rows = [0, 1, 2].flatMap((d) => [{ at: at(d, 8), consumed_ml: 120 }, { at: at(d, 12), consumed_ml: 150 }, { at: at(d, 16), consumed_ml: null }]);
    const a = bottleAggregate(rows, '2026-06-01', now)!;
    expect(a).toEqual({ window_days: 7, days_noted: 3, age_months: 5, avg_bottles_per_day: 3, avg_ml_per_day: 270, avg_gap_minutes: expect.any(Number) });
    expect(Object.keys(a).some((k) => /name|_id$|birth|^note/.test(k))).toBe(false);
    expect(AURA_ANALYSIS_KINDS).toContain('bottle');
    expect(sanitizeAnalysis('bottle', { ...a, first_name: 'Léo' })).toEqual(a);
    expect(sanitizeAnalysis('bottle', {})).toBeNull();
    expect(auraCreditAction('analysis', { journal: false, analysis: 'bottle' })).toBe('tool_analysis');
    expect(analysisPeriod('bottle', a)).toEqual({ key: 'sa.an.period.days', days: 7 });
    expect(previewRows(a).map((r) => r.key)).toContain('avg_ml_per_day');
    for (const k of Object.keys(a)) expect([k, !!tMaybe(`aura.an.f.${k}`)]).toEqual([k, true]);
  });
});

describe('Ticket 5 — recherche d’outils vers la vraie route du BON profil', () => {
  const ctx = { scope: 'baby' as const, childId: 'enfant-actif', pregnancyId: null, babyId: 'enfant-actif', postpartum: false };
  it('local : « Où noter sa sieste ? » → suivi du sommeil de l’enfant actif ; « Mon bébé prend le sein » → Allaitement', () => {
    const cat = toolCatalog(ctx as never);
    const sieste = searchCatalog(cat, 'Où noter sa sieste ?');
    expect(sieste.understood).toBe(true);
    const top = sieste.results.slice(0, 3).map((h) => h.tool);
    const sleep = top.find((x) => /sleep/.test(x.id));
    expect(sleep).toBeTruthy();
    expect(sleep!.href).toContain('enfant-actif');
    const sein = searchCatalog(cat, 'Mon bébé prend le sein');
    expect(sein.results[0].tool.id).toBe('baby_breastfeed');
    expect(sein.results[0].tool.href).toContain('enfant-actif');
  });
  it('RÉGRESSION (vue dans l’app) : depuis le profil Grossesse, « Où noter sa sieste ? » proposait des outils de grossesse ; désormais le sommeil de l’enfant, avec sa route', () => {
    const preg = toolCatalog({ scope: 'pregnancy', childId: null, pregnancyId: 'p1', babyId: 'enfant-actif', postpartum: false } as never);
    const kid = toolCatalog(ctx as never);
    const seen = new Set<string>();
    const all = [...preg, ...kid].filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
    const before = searchCatalog(preg, 'Où noter sa sieste ?');
    expect(before.understood && before.results.slice(0, 2).every((h) => /preg/.test(h.tool.id))).toBe(true); // le défaut reproduit
    const after = searchForAura(preg, all, 'Où noter sa sieste ?', searchCatalog);
    expect(after.results[0].tool.id).toMatch(/sleep/);
    expect(after.results[0].tool.href).toContain('enfant-actif');
    // une demande de grossesse reste servie par le profil affiché
    expect(searchForAura(preg, all, 'suivre ma grossesse semaine par semaine', searchCatalog).results[0].tool.id).toMatch(/^preg/);
  });
  it('serveur (Gemini SIMULÉ) : search_tools puis propose_open_tool, seulement un outil du catalogue envoyé', async () => {
    const cat = toolCatalog(ctx as never);
    const tools = catalogForServer(cat, (id) => tMaybe(toolWordsKey(id)) || '');
    for (const [q, expected] of [['Où noter sa sieste ?', /sleep/], ['Mon bébé prend le sein', /^baby_breastfeed$/]] as const) {
      const out = await runAura({
        userId: 'u', today: '2026-11-21', consented: async () => true, geminiConfig: async () => ({ apiKey: 'test', model: 'simulation' }),
        gate: { reserve: async () => ({ ok: true, reservation_id: 'r', cost: 1, monthly_remaining: 9, purchased_remaining: 0 }), commit: async () => true, release: async () => true },
        turn: async (_c, o) => simulatedTurn(o, '2026-11-21'),
      }, { kind: 'chat', message: q, lang: 'fr', request_id: `k-${q}`, tools });
      expect(out.status).toBe(200);
      const action = (out.body.actions as { type: string; id?: string }[])[0];
      expect(action.type).toBe('open_tool');
      expect([q, action.id]).toEqual([q, expect.stringMatching(expected)]);
      const route = tools.find((t) => t.id === action.id)!.route;
      expect(route).toContain('enfant-actif');
    }
  });
});
