/**
 * HOMI Aura côté application : modèle (modes, coût, repli local honnête, cartes d'action), agrégats minimisés des
 * analyses, mode vocal absent (non retenu), démonstration (même déroulé que le serveur avec un modèle SIMULÉ), et écran :
 * conversation, actions TOUJOURS confirmées avant écriture, crédits affichés et débités, détresse gratuite,
 * repli local. Aucune IA n'est appelée.
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
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { FEATURES } from '@/config/features';
import { AuraScreen } from '@/features/aura/AuraScreen';
import {
  AURA_THEME_IDS, AURA_THEME_TOOLS, auraMode, auraRoute, creditActionFor, defaultThemeFor, eventInputFrom, featuredFor, isServerOff, journalPayload, localReply, missionInputFrom, themeSuggestions,
} from '@/features/aura/model';
import { cycleAggregate, loadAggregate, moodAggregate, previewRows, sleepAggregate } from '@/features/aura/analysis';
import { classifyAuraError } from '@/features/aura/api';
import { simulatedTurn } from '@/lib/backend/demoAura';
import { auraCreditAction } from '../../supabase/functions/_shared/aura-data';
import { tMaybe } from '@/i18n';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import type { MoodCheckin } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; readdirSync(p: string): string[] };
jest.setTimeout(90000);

const tool = (id: string, label = id): CatalogTool => ({ id, key: id, category: 'family', theme: 'tasks', icon: 'calendar', label, sub: 'desc', href: `/${id}`, profiles: [], free: false, also: [], subs: [] } as unknown as CatalogTool);
const mood = (id: string, days: number, m: 1 | 2 | 3 | 4 | 5, journal: string | null = null, feelings = ['tired']): MoodCheckin =>
  ({ id, user_id: 'u', checked_at: new Date(Date.parse('2026-11-20T12:00:00Z') - days * 86_400_000).toISOString(), mood: m, feelings, safety_concern: false, journal });

describe('Aura : modèle', () => {
  it('11 entrées thématiques, 3 suggestions traduites chacune dans les 5 langues, route /assistant?theme=', () => {
    expect(AURA_THEME_IDS).toHaveLength(11);
    for (const th of AURA_THEME_IDS) {
      expect(auraRoute(th)).toBe(`/assistant?theme=${th}`);
      for (const k of themeSuggestions(th)) expect([k, !!tMaybe(k)]).toEqual([k, true]);
    }
    expect(AURA_THEME_TOOLS.discovery).toEqual([]);
    for (const l of ['en', 'de', 'es', 'it']) {
      const fr = Object.keys(require('@/i18n/fr/aura').aura).sort();
      expect(Object.keys(require(`@/i18n/${l}/aura`).aura).sort()).toEqual(fr);
    }
  });
  it('mode : en ligne, démonstration (simulée), sinon LOCAL ; IA coupée côté serveur → local', () => {
    expect(auraMode({ aiOnline: true, demoBackend: false })).toBe('online');
    expect(auraMode({ aiOnline: false, demoBackend: true })).toBe('demo');
    expect(auraMode({ aiOnline: false, demoBackend: false })).toBe('local');
    expect(auraMode({ aiOnline: true, demoBackend: false, serverOff: true })).toBe('local');
    expect(auraMode({ aiOnline: true, demoBackend: false, forceLocal: true })).toBe('local');
    expect(['ai_not_configured', 'coming_soon', 'ai_disabled'].every(isServerOff)).toBe(true);
  });
  it('coût affiché = coût du serveur (même règle)', () => {
    for (const k of ['chat', 'reformulate', 'analysis'] as const) for (const j of [false, true]) for (const a of [null, 'sleep', 'diary', 'load'] as const) {
      expect(creditActionFor(k, { journal: j, analysis: a })).toBe(auraCreditAction(k, { journal: j, analysis: a }));
    }
  });
  it('profil affiché → suggestions du thème le plus proche', () => {
    expect(defaultThemeFor({ type: 'pregnancy', id: 'p' })).toBe('pregnancy');
    expect(defaultThemeFor({ type: 'child', id: 'c' }, { childMonths: 5 })).toBe('baby_health');
    expect(defaultThemeFor({ type: 'child', id: 'c' }, { childMonths: 40 })).toBe('education');
    expect(defaultThemeFor({ type: 'family' })).toBe('household');
    expect(defaultThemeFor(null)).toBe('personal');
  });
  it('outils mis en avant : seulement ceux du profil, dans l’ordre du thème', () => {
    expect(featuredFor('household', [tool('brain_dump'), tool('mental_load'), tool('other')]).map((x) => x.id)).toEqual(['mental_load', 'brain_dump']);
  });
  it('repli local HONNÊTE : rien de trouvé = rien d’inventé', () => {
    expect(localReply({ results: [], understood: false, tokens: [] }, null)).toEqual({ kind: 'local', tools: [], article: null, found: false });
    const r = localReply({ results: [{ tool: tool('baby_breastfeed'), score: 3 }], understood: true, tokens: [] }, { kind: 'answer', related: [], confidence: 0.1, main: { slug: 's', title: 'T', section: '', sources: [] }, answer: 'x' });
    expect(r.tools.map((x) => x.id)).toEqual(['baby_breastfeed']);
    expect(r.article).toBeNull(); // trop loin : pas proposé
  });
  it('écritures préparées seulement à partir d’une proposition RELUE ; mission confiée à personne', () => {
    expect(eventInputFrom({ title: 'Pédiatre', date: '2026-11-24', time: '10:00', duration_minutes: 30, notes: null })).toMatchObject({ title: 'Pédiatre', all_day: false, kind: 'custom' });
    expect(eventInputFrom({ title: ' ', date: '2026-11-24', time: null, duration_minutes: null, notes: null })).toBeNull();
    expect(missionInputFrom({ title: 'Courses', category: 'shopping', due_date: null, notes: null })).toMatchObject({ assignee_id: null });
  });
  it('journal choisi : seulement les entrées cochées, texte tronqué, aucun identifiant', () => {
    const rows = [mood('a', 1, 2, 'x'.repeat(900)), mood('b', 2, 4, 'secret non choisi')];
    const p = journalPayload('diary', rows, new Set(['a']));
    expect(p.entries).toHaveLength(1);
    expect(p.entries[0].text).toHaveLength(400);
    expect(JSON.stringify(p)).not.toMatch(/secret|"a"|user_id/);
    expect(journalPayload('mood', rows, new Set(['a', 'b'])).entries.every((e) => e.text === '')).toBe(true);
  });
  it('erreurs : réseau, crédits, IA coupée', () => {
    expect(classifyAuraError({ code: 'function_error' })).toBe('network');
    expect(classifyAuraError({ code: 'x' }, false)).toBe('network');
    expect(classifyAuraError({ code: 'insufficient_credits', status: 402 })).toBe('credits');
    expect(classifyAuraError({ code: 'ai_not_configured', status: 503 })).toBe('off');
    expect(classifyAuraError({ code: 'duplicate_request', status: 409 })).toBe('duplicate');
  });
});

describe('Analyser avec HOMI IA : agrégats minimisés', () => {
  const now = new Date('2026-11-20T12:00:00Z');
  it('humeur : comptes et mots-clés, aucun texte', () => {
    const a = moodAggregate([mood('a', 1, 2, 'Je suis triste'), mood('b', 3, 4), mood('c', 60, 1)], now)!;
    expect(a).toEqual({ window_days: 30, checkins: 2, distribution: { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0 }, top_feelings: ['tired'] });
    expect(JSON.stringify(a)).not.toContain('triste');
    expect(moodAggregate([], now)).toBeNull();
  });
  it('cycle, sommeil, charge mentale : chiffres seulement, « moi / l’autre », jamais un prénom', () => {
    expect(cycleAggregate({ cycles: [1, 2], averageLength: 28.44, shortest: 27, longest: 30, averagePeriod: 5, symptomCounts: [{ key: 'cramps', count: 3 }] }))
      .toEqual({ cycles_count: 2, avg_cycle_days: 28.4, min_cycle_days: 27, max_cycle_days: 30, avg_period_days: 5, top_symptoms: ['cramps'] });
    expect(sleepAggregate({ ageMonths: 8, daysNoted: 6, nightMinutes: 600 } as never)).toMatchObject({ age_months: 8, days_noted: 6, avg_night_minutes: 600 });
    const l = loadAggregate([{ person: 'me', thought: 5, done: 3, assigned: 0, domains: 0 }, { person: 'you', thought: 1, done: 2, assigned: 0, domains: 0 }], 'me',
      [{ category: 'shopping', created_at: '2026-11-18T10:00:00Z' }], now)!;
    expect(l.by_person).toEqual([{ who: 'me', count: 8 }, { who: 'other', count: 3 }]);
    expect(previewRows(l).map((r) => r.key)).toEqual(['window_days', 'tasks_total', 'by_person', 'by_category']);
  });
});

describe('Mode vocal : non retenu (décision du 20/11/2026)', () => {
  it('aucun micro, aucune lecture à voix haute, aucun interrupteur vocal, aucun code ElevenLabs', () => {
    expect('auraVoice' in FEATURES).toBe(false);
    for (const f of fs.readdirSync('src/features/aura')) expect([f, /expo-audio|expo-av|expo-speech|elevenlabs|voice|micro/i.test(fs.readFileSync(`src/features/aura/${f}`, 'utf8'))]).toEqual([f, false]);
    expect(fs.readFileSync('app.config.ts', 'utf8')).toMatch(/microphonePermission: false/);
  });
});

describe('Démonstration : modèle simulé (même interface que Gemini)', () => {
  it('1er tour : recherche d’outil ; 2e : propositions ; 3e : texte', () => {
    const t1 = simulatedTurn({ system: '', turns: [], contents: [{ role: 'user', parts: [{ text: 'Organise la semaine et le rendez-vous chez la pédiatre' }] }], functions: [] as never }, '2026-11-20');
    expect(t1.calls[0].name).toBe('search_tools');
    const t2 = simulatedTurn({ system: '', turns: [], contents: [{ role: 'user', parts: [{ text: 'Organise la semaine et le rendez-vous chez la pédiatre' }] }, { role: 'model', parts: [] }, { role: 'user', parts: [{ functionResponse: { name: 'search_tools', response: { tools: [] } } }] }], functions: [] as never }, '2026-11-20');
    expect(t2.calls.map((c) => c.name)).toEqual(['propose_calendar_event', 'propose_plan']);
  });
});

// ------------------------------------------------------------------ écran
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
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, id: string, text: string) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onChangeText === 'function')[0];
  await act(async () => { el.props.onChangeText(text); });
}
async function say(r: ReactTestRenderer, text: string) { await type(r, 'aura-input', text); await press(r, 'aura-send', 400); }
/** Solde et crédits utilisés (même lecture que l'écran « Mes crédits »). */
const status = async () => backend.rpc<{ monthly_remaining: number; purchased_remaining: number; used_this_period: number }>('credits_status');
const left = async () => { const s = await status(); return s.monthly_remaining + s.purchased_remaining; };

describe('Écran HOMI Aura (démonstration : réponses simulées, crédits de démonstration)', () => {
  beforeAll(async () => {
    await backend.auth.signUp('aura@exemple.test', 'MotDePasse!2026');
    const uid = (await backend.auth.getSession())!.userId;
    await backend.rpc<string>('create_household', { p_name: 'Foyer Aura' });
    await backend.insert('consents', { user_id: uid, purpose: 'ai_assistant', granted: true, version: '1' });
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
  });
  afterEach(() => { for (const k of Object.keys(mockParams)) delete mockParams[k]; FEATURES.aiAssistantOnline = true; });
  afterAll(async () => { await flush(1200); });

  it('conversation : coût affiché AVANT, propositions affichées, RIEN d’écrit avant confirmation, débit d’1 crédit', async () => {
    const r = await render(<AuraScreen />);
    expect(allText(r)).toContain('1 crédit par question');
    expect(allText(r)).toMatch(/1\s000 crédits disponibles/);
    const before = await status();
    await say(r, 'Aide-moi à organiser la semaine et le rendez-vous chez la pédiatre');
    await until(() => has(r, 'aura-reply'));
    expect(has(r, 'aura-action-event')).toBe(true);
    expect(has(r, 'aura-action-plan')).toBe(true);
    expect(allText(r)).toContain('1 crédit utilisé.');
    expect((await status()).used_this_period).toBe(before.used_this_period + 1);
    expect(await left()).toBe(before.monthly_remaining + before.purchased_remaining - 1);
    // aucune écriture tant que la personne n'a pas confirmé
    expect((await backend.select({ table: 'family_events' })) ?? []).toHaveLength(0);
    await press(r, 'aura-event-open');
    expect(has(r, 'aura-event-sheet')).toBe(true);
    expect((await backend.select({ table: 'family_events' })) ?? []).toHaveLength(0);
    await type(r, 'aura-event-title', 'Pédiatre de Léo');
    await press(r, 'aura-event-confirm', 600);
    const events = (await backend.select<{ title: string }>({ table: 'family_events' })) ?? [];
    expect(events.map((e) => e.title)).toEqual(['Pédiatre de Léo']);
    // une étape du plan → mission, après confirmation seulement
    const tasksBefore = ((await backend.select({ table: 'family_tasks' })) ?? []).length;
    await press(r, 'aura-plan-step-0');
    expect(((await backend.select({ table: 'family_tasks' })) ?? []).length).toBe(tasksBefore);
    await press(r, 'aura-mission-confirm', 600);
    expect(((await backend.select({ table: 'family_tasks' })) ?? []).length).toBe(tasksBefore + 1);
    r.unmount();
  });

  it('DÉTRESSE : orientation humaine immédiate, aucun crédit, aucune requête', async () => {
    const r = await render(<AuraScreen />);
    const n = await left();
    await say(r, 'je veux mourir');
    expect(has(r, 'aura-safety')).toBe(true);
    expect(allText(r)).toContain('3114');
    expect(has(r, 'aura-pending')).toBe(false);
    expect(await left()).toBe(n); // ni réserve, ni débit
    r.unmount();
  });

  it('solde épuisé : feuille des packs, la question ne part pas ; la sécurité reste disponible', async () => {
    await backend.rpc('demo_credit_adjust', { monthly: 0, purchased: 0 });
    const r = await render(<AuraScreen />);
    await say(r, 'Quel outil pour les courses ?');
    await until(() => allText(r).includes('Vous n’avez plus de crédits'));
    await say(r, 'je veux en finir');
    expect(has(r, 'aura-safety')).toBe(true);
    await backend.rpc('demo_credit_adjust', { monthly: 500 });
    r.unmount();
  });

  it('compte en ESSAI : HOMI Aura demande un abonnement actif (aucun crédit d’essai) et propose le repli local', async () => {
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: true });
    const r = await render(<AuraScreen />);
    await until(() => has(r, 'aura-needs-sub'));
    expect(allText(r)).toContain('l’essai gratuit donne accès aux outils, pas à l’IA');
    expect(has(r, 'aura-consent')).toBe(false);
    await press(r, 'aura-sub-local');
    expect(allText(r)).toContain('Mode local, sans IA');
    await backend.rpc('set_demo_subscription', { active: true, period: 'monthly', trial: false });
    r.unmount();
  });

  it('IA éteinte : repli LOCAL honnête (aucune requête, gratuit) ; rien trouvé = il le dit', async () => {
    FEATURES.aiAssistantOnline = false;
    mockParams.mode = 'local';
    const n = await left();
    const r = await render(<AuraScreen />);
    expect(allText(r)).toContain('Mode local, sans IA');
    expect(allText(r)).toContain('Gratuit, sur ce téléphone');
    await say(r, 'zzkx qwvb');
    await until(() => has(r, 'aura-local-reply'));
    expect(allText(r)).toContain('je ne comprends pas vraiment ton message');
    expect(has(r, 'aura-local-none')).toBe(true);
    expect(await left()).toBe(n); // aucune requête facturée
    r.unmount();
  });

  it('174 sans IA : formulations écrites à l’avance de « Se comprendre », gardées en brouillon, rien envoyé', async () => {
    FEATURES.aiAssistantOnline = false;
    Object.assign(mockParams, { theme: 'emotion_translator', mode: 'local' });
    const r = await render(<AuraScreen />);
    expect(has(r, 'aura-translator')).toBe(true);
    await press(r, 'aura-ref-situation-fatigue');
    const options = [...new Set(r.root.findAll((n) => n.props.testID === 'aura-ref-option' && typeof n.props.onPress === 'function').map((n) => n.props.onPress as () => void))];
    expect(options.length).toBe(4); // base, plus courte, plus douce, plus directe
    await act(async () => { options[2](); });
    await press(r, 'aura-ref-use', 400);
    const { router } = require('expo-router');
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/family/understand/compose', params: { situation: 'fatigue' } }));
    expect(((await backend.select({ table: 'couple_messages' })) ?? []).length).toBe(0);
    r.unmount();
  });

  it('200 découverte : visite guidée proposée', async () => {
    Object.assign(mockParams, { theme: 'discovery' });
    const r = await render(<AuraScreen />);
    expect(has(r, 'aura-tour')).toBe(true);
    expect(allText(r)).toContain('Que peut faire HOMI pour moi ?');
    r.unmount();
  });
});
