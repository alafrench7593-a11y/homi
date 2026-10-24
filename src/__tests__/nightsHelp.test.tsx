/**
 * « M'aider pour les nuits » : bilan à partir des sommeils de l'ENFANT CHOISI (jamais d'un autre), jamais de
 * conclusion avant 3 jours notés, suggestions du jour avec avis « trop tôt / trop tard / utile », « La nuit est
 * difficile » pas à pas (signes inquiétants d'abord, jamais « laisser pleurer »), assistant IA sommeil (données de cet
 * enfant seulement, sans prénom, désactivables), carte de l'accueil du bébé, rappels personnalisables.
 * Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: true })), requestPermissionsAsync: jest.fn(async () => ({ granted: true })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));
jest.mock('@/lib/backend/demo', () => {
  const actual = jest.requireActual('@/lib/backend/demo');
  return { ...actual, createDemoBackend: (...a: unknown[]) => {
    const b = actual.createDemoBackend(...a);
    const orig = b.invokeStream.bind(b);
    b.invokeStream = (fn: string, body: unknown, onEvent: (e: string, d: unknown) => void, opts?: unknown) => {
      if (fn === 'assistant') { (globalThis as { __sent?: unknown[] }).__sent?.push(body); return Promise.resolve({ answer: 'Réponse IA', structured: { short: 'Réponse IA', actions: [], watch: [], consult: [], questions: [], sources: [], updated_on: null }, sources: [], safety: 'none', conversation_id: null, message_id: null }); }
      return orig(fn, body, onEvent, opts);
    };
    return b;
  } };
});

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import NightsHelp from '@/app/sleep/help/[childId]';
import DifficultNight from '@/app/sleep/difficult/[childId]';
import Chat from '@/app/assistant/chat';
import { NightsHelpCard } from '@/features/sleepHelpCard';
import { gentleTips, lastEvents, nightPistes, reviewLines, sleepContextFor, sleepReview } from '@/lib/domain/nightsHelp';
import { planDay, planSleepNotifications, DEFAULT_NOTIFY } from '@/lib/domain/sleepPlanner';
import { addDays, todayISO } from '@/lib/domain/dates';
import { buildSystemPrompt, sanitizeContext } from '../../supabase/functions/_shared/assistant-prompt';
import type { Child } from '@/lib/types';

jest.setTimeout(60000);
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
  await flush(400);
  return r;
}
async function until(cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(100); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string> } }).__state.params;
const setParams = (p: Record<string, string>) => { for (const k of Object.keys(params)) delete params[k]; Object.assign(params, p); };

/** Journées types : nuit 20:00 → 06:30 (n réveils), siestes 9:00–10:00 et 13:30–15:00. */
function days(childId: string, n: number, wakeups: number, bed = 20) {
  const out: Record<string, unknown>[] = [];
  const now = new Date();
  for (let i = n; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const at = (h: number, m = 0, plus = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + plus, h, m).toISOString();
    out.push({ child_id: childId, started_at: at(9), ended_at: at(10), kind: 'nap', wakeups: 0 });
    out.push({ child_id: childId, started_at: at(13, 30), ended_at: at(15), kind: 'nap', wakeups: 0 });
    out.push({ child_id: childId, started_at: at(bed), ended_at: at(6, 30, 1), kind: 'night', wakeups });
  }
  return out;
}

describe('bilan, conseils et contexte (logique)', () => {
  const now = new Date();
  it('une seule journée : pas de conclusion ; 5 jours : moyennes, temps d’éveil, coucher habituel', () => {
    const one = sleepReview(days('a', 1, 2) as never, 'a', now);
    expect(one.enough).toBe(false);
    expect(one.napsPerDay).toBeNull();
    expect(reviewLines(one)[0]).toMatch(/Une seule journée ne dit rien/);
    const five = sleepReview(days('a', 5, 2) as never, 'a', now);
    expect(five).toMatchObject({ daysNoted: 5, enough: true, napsPerDay: 2, nightWakeups: 2, usualBedtime: 20 * 60 });
    expect(five.wakeWindow).toBeGreaterThan(100);
    expect(reviewLines(five).join(' ')).toMatch(/Coucher habituel : vers 20 h 00/);
    // données d'un autre enfant ignorées
    expect(sleepReview([...days('a', 5, 0), ...days('b', 5, 4)] as never, 'a', now).nightWakeups).toBe(0);
  });
  it('conseils doux, pistes pour une nuit difficile : jamais « laisser pleurer », le parent épuisé d’abord', () => {
    const r = sleepReview(days('a', 5, 3) as never, 'a', now);
    const all = [...gentleTips(8, r, null), ...nightPistes(['many_wakings', 'crying', 'parent_exhausted'], 8).flatMap((s) => s.points)].join(' ');
    expect(all).not.toMatch(/laissez[- ]le pleurer|méthode d’extinction|faire ses nuits rapidement/i);
    expect(all).toMatch(/jamais obligé·e de le laisser pleurer|il n’est jamais nécessaire/i);
    expect(nightPistes(['parent_exhausted', 'many_wakings'], 8)[0].title).toBe('D’abord vous');
    expect(nightPistes(['unwell'], 2).flatMap((s) => s.points).join(' ')).toMatch(/ne peut pas évaluer|15/);
    expect(lastEvents([], [], now)).toEqual(['Rien n’a été noté ces dernières heures.']);
  });
  it('contexte de l’IA : chiffres seulement (aucun prénom), heures au format HH:MM, nettoyé côté serveur ; consignes sommeil', () => {
    const r = sleepReview(days('a', 5, 2) as never, 'a', now);
    const plan = planDay({ childId: 'a', birthDate: addDays(todayISO(), -240), sleeps: days('a', 5, 2) as never, now });
    const ctx = sleepContextFor(8, null, r, plan, { child_id: 'a', routine_minutes: 20, difficulties: ['night_wakings'] });
    expect(JSON.stringify(ctx)).not.toMatch(/Lina|Noé/);
    expect(ctx.usualBedtime).toBe('20:00');
    const clean = sanitizeContext({ sleep: { ...ctx, usualBedtime: '<script>', difficulties: ['night_wakings', 'pirate'], ageMonths: 8 }, childrenAgesMonths: [8] });
    expect(clean.sleep).toMatchObject({ ageMonths: 8, usualBedtime: null, difficulties: ['night_wakings'] });
    const prompt = buildSystemPrompt('Toi & Moi', clean, []);
    expect(prompt).toMatch(/M’AIDER POUR LES NUITS/);
    expect(prompt).toMatch(/ne conseilles JAMAIS de laisser pleurer/);
    expect(prompt).toMatch(/réveils noté\(s\) par nuit|2 réveil/);
    expect(buildSystemPrompt('Toi & Moi', sanitizeContext({ sleep: { ageMonths: 4, daysNoted: 1 } }), [])).toMatch(/données insuffisantes/);
    expect(buildSystemPrompt('Toi & Moi', sanitizeContext({ childrenAgesMonths: [4] }), [])).not.toMatch(/M’AIDER POUR LES NUITS/);
  });
  it('rappels : seulement si le parent les active, textes du planning, jamais de réveil programmé', () => {
    const plan = planDay({ childId: 'a', birthDate: addDays(todayISO(), -240), sleeps: days('a', 5, 2) as never, now: new Date(new Date().setHours(8, 0, 0, 0)) });
    expect(planSleepNotifications(plan, DEFAULT_NOTIFY, 'Lina', 'female', new Date(new Date().setHours(8, 0, 0, 0)))).toEqual([]);
    const on = planSleepNotifications(plan, { ...DEFAULT_NOTIFY, enabled: true, quiet_from: null, quiet_to: null }, 'Lina', 'female', new Date(new Date().setHours(8, 0, 0, 0)));
    expect(on.map((n) => n.body).join(' ')).toMatch(/La prochaine sieste de Lina est estimée autour de/);
    expect(on.map((n) => n.body).join(' ')).not.toMatch(/réveiller|réveillez/i);
    const off = planSleepNotifications(plan, { ...DEFAULT_NOTIFY, enabled: true, nap: false, signs: false, routine: false, quiet_from: null, quiet_to: null }, 'Lina', 'female', new Date(new Date().setHours(8, 0, 0, 0)));
    expect(off).toEqual([]);
  });
});

describe(`écrans (${Platform.OS})`, () => {
  let lina: Child; let noe: Child;
  beforeAll(async () => {
    await backend.auth.signUp(`nuits.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test nuits' });
    [lina] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: addDays(todayISO(), -240), enabled_tracking: ['sleep'] });
    [noe] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Noé', sex: 'male', birth_date: addDays(todayISO(), -420), enabled_tracking: ['sleep'] });
    for (const s of days(lina.id, 5, 3)) await backend.insert('sleeps', { ...s, household_id: hid });
    for (const s of days(noe.id, 5, 0, 21)) await backend.insert('sleeps', { ...s, household_id: hid });
    await backend.rpc('set_demo_subscription', { active: true });
    const uid = (await backend.auth.getSession())!.userId;
    await backend.insert('consents', { user_id: uid, purpose: 'ai_assistant', granted: true, version: '1' });
  });

  it('accueil du bébé : carte « M’aider pour les nuits » avec le sommeil récent de CET enfant, l’IA et la nuit difficile', async () => {
    const a = await render(<NightsHelpCard child={lina} />);
    await until(() => allText(a).includes('réveil(s) par nuit'));
    expect(allText(a)).toContain('M’aider pour les nuits');
    expect(allText(a)).toMatch(/3 réveil\(s\) par nuit/);
    expect(has(a, 'nights-help-ai') && has(a, 'nights-help-difficult')).toBe(true);
    a.unmount();
    const b = await render(<NightsHelpCard child={noe} />);
    await until(() => allText(b).includes('réveil(s) par nuit'));
    expect(allText(b)).toMatch(/0 réveil\(s\) par nuit/);
    b.unmount();
  });

  it('page : bilan de Lina, tendances, suggestions avec avis qui affinent les estimations, routine et rappels', async () => {
    // 7 h 15, réveil noté à 6 h 30 : une sieste et un coucher sont à venir, quelle que soit l'heure de lancement du test
    const d = new Date(); d.setHours(7, 15, 0, 0);
    jest.useFakeTimers({ advanceTimers: true, now: d });
    setParams({ childId: lina.id });
    const r = await render(<NightsHelp />);
    await until(() => has(r, 'nh-review'));
    const t = allText(r);
    expect(t).toMatch(/5 jours notés sur les 7 derniers/);
    expect(t).toMatch(/Réveils nocturnes notés : 3 par nuit/);
    expect(t).toMatch(/Coucher habituel : vers 20 h 00/);
    expect(has(r, 'nh-safe')).toBe(true); // couchage sécuritaire visible
    expect(has(r, 'nh-routine') && has(r, 'nh-reminders')).toBe(true);
    await until(() => has(r, 'nh-plan'));
    expect(has(r, 'nh-suggest-nap')).toBe(true);
    const target = 'nap';
    await press(r, `nh-${target}-early`, 500);
    const fb = await backend.select<{ child_id: string; verdict: string; target: string }>({ table: 'sleep_feedback' });
    expect(fb).toEqual([expect.objectContaining({ child_id: lina.id, verdict: 'early', target })]);
    r.unmount();
    jest.useRealTimers();
  });

  it('« La nuit est difficile » : signes inquiétants d’abord (appel du 15), événements notés de cet enfant, pistes, routine, professionnel', async () => {
    setParams({ childId: lina.id });
    const r = await render(<DifficultNight />);
    expect(allText(r)).toContain('D’abord : l’un de ces signes ?');
    await press(r, 'dn-sign-breathing');
    expect(has(r, 'dn-urgent') && has(r, 'dn-call-15')).toBe(true);
    await press(r, 'dn-sign-breathing');
    await press(r, 'dn-obs-many_wakings');
    await press(r, 'dn-obs-parent_exhausted');
    await press(r, 'dn-next');
    expect(has(r, 'dn-events')).toBe(true);
    await press(r, 'dn-next');
    const t = allText(r);
    expect(t).toContain('D’abord vous');
    expect(t).not.toMatch(/laissez[- ]le pleurer/i);
    await press(r, 'dn-next');
    expect(has(r, 'dn-routine')).toBe(true);
    await press(r, 'dn-next');
    expect(has(r, 'dn-pro') && has(r, 'dn-ai')).toBe(true);
    r.unmount();
  });

  it('assistant IA sommeil : identifié comme IA, questions proposées, données de sommeil de Lina seulement (sans prénom), désactivables', async () => {
    const sent: Record<string, unknown>[] = [];
    (globalThis as { __sent?: unknown[] }).__sent = sent;
    setParams({ topic: 'sleep', child: lina.id });
    const r = await render(<Chat />);
    await until(() => has(r, 'chat-sleep-questions'));
    expect(allText(r)).toMatch(/intelligence artificielle/i);
    expect(allText(r)).toContain('Utiliser les données de sommeil de Lina');
    const chip = r.root.findAll((n) => n.props.label === 'Que puis-je essayer après plusieurs réveils ?' && typeof n.props.onPress === 'function')[0];
    await act(async () => { await chip.props.onPress(); });
    await until(() => sent.length > 0);
    const body = sent[0] as { use_context: boolean; context: { sleep: { nightWakeups: number; ageMonths: number }; childrenAgesMonths: number[] } };
    expect(body.use_context).toBe(true);
    expect(body.context.sleep).toMatchObject({ nightWakeups: 3, ageMonths: 7 });
    expect(body.context.childrenAgesMonths).toEqual([7]); // seulement Lina, pas Noé
    expect(JSON.stringify(body)).not.toMatch(/Lina|Noé/);
    const toggle = r.root.findAll((n) => n.props.accessibilityLabel === 'Utiliser ma situation pour cette conversation' && typeof n.props.onPress === 'function')[0];
    await act(async () => { await toggle.props.onPress(); });
    await flush(300);
    const input = r.root.findAll((n) => n.props.accessibilityLabel === 'Votre question' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { input.props.onChangeText('Et sans mes données ?'); });
    await press(r, 'chat-send', 600);
    await until(() => sent.length > 1);
    expect((sent[1] as { use_context: boolean; context?: unknown }).use_context).toBe(false);
    expect((sent[1] as { context?: unknown }).context).toBeUndefined();
    r.unmount();
  });
});
