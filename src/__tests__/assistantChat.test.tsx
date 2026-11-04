/**
 * Écran de l'assistant IA : réponse diffusée, suite de la conversation (même conversation), « Arrêter la réponse »,
 * « Réessayer », erreur discrète quand le service n'est pas configuré (jamais de clé ni de « mode démonstration »),
 * historique seulement avec l'accord de la personne. Le service est simulé ici (pas d'appel à Gemini en test).
 * Lancé avec le préréglage iOS et avec jest.android.config.js.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }) };
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
// Service « assistant » simulé (format de la vraie fonction : événements meta / delta puis réponse complète)
jest.mock('@/lib/backend/demo', () => {
  const actual = jest.requireActual('@/lib/backend/demo');
  return { ...actual, createDemoBackend: (...a: unknown[]) => {
    const b = actual.createDemoBackend(...a);
    const orig = b.invokeStream.bind(b);
    b.invokeStream = (fn: string, body: unknown, onEvent: (e: string, d: unknown) => void, opts?: { signal?: AbortSignal }) => {
      const h = (globalThis as { __assistant?: (b: unknown, e: (e: string, d: unknown) => void, s?: AbortSignal) => Promise<unknown> }).__assistant;
      return fn === 'assistant' && h ? h(body, onEvent, opts?.signal) : orig(fn, body, onEvent, opts);
    };
    return b;
  } };
});

import React from 'react';
import { Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, BackendError } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import Chat from '@/app/assistant/chat';
import { sanitizeRecentTurns } from '../../supabase/functions/_shared/assistant-format';

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
async function until(cond: () => boolean, ms = 6000) { const end = Date.now() + ms; while (!cond() && Date.now() < end) await flush(80); }
const has = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id).length > 0;
async function press(r: ReactTestRenderer, id: string, wait = 200) {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function ask(r: ReactTestRenderer, q: string) {
  const input = r.root.findAll((n) => n.props.accessibilityLabel === 'Votre question' && typeof n.props.onChangeText === 'function')[0];
  await act(async () => { input.props.onChangeText(q); });
  // sans attendre la fin de la réponse (pour pouvoir l'arrêter)
  const send = r.root.findAll((n) => n.props.testID === 'chat-send' && typeof n.props.onPress === 'function')[0];
  await act(async () => { void send.props.onPress(); });
  await flush(100);
}

const seen: { body: Record<string, unknown> }[] = [];
const answer = (text: string, conv: string) => ({ answer: text, structured: { short: text, actions: [], watch: [], consult: [], questions: [], sources: [], updated_on: null }, sources: [], safety: 'none', conversation_id: conv, message_id: null, quota: { used: 1, limit: 30 } });

describe(`assistant IA (${Platform.OS})`, () => {
  beforeAll(async () => {
    await backend.auth.signUp(`chat.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const uid = (await backend.auth.getSession())!.userId;
    await backend.insert('consents', { user_id: uid, purpose: 'ai_assistant', granted: true, version: '1' });
  });
  afterEach(() => { (globalThis as { __assistant?: unknown }).__assistant = undefined; });

  it('service non configuré : erreur discrète et « Réessayer » ; ni clé, ni détail technique, ni « mode démonstration »', async () => {
    const r = await render(<Chat />);
    await ask(r, 'Comment préparer la valise de maternité ?');
    await until(() => has(r, 'chat-retry'));
    const t = allText(r);
    expect(t).toContain('L’assistant n’est pas disponible pour le moment. Réessayez plus tard.');
    expect(t).not.toMatch(/GEMINI|Gemini|Supabase|démonstration|clé/);
    r.unmount();
  });

  it('réponse, suite de la même conversation, arrêter puis réessayer', async () => {
    (globalThis as { __assistant?: unknown }).__assistant = async (body: Record<string, unknown>, onEvent: (e: string, d: unknown) => void, signal?: AbortSignal) => {
      seen.push({ body });
      onEvent('meta', { conversation_id: 'c0000000-0000-4000-8000-000000000001', quota: { used: seen.length, limit: 30 } });
      if (String(body.message).includes('longue')) {
        for (let i = 0; i < 50; i++) {
          if (signal?.aborted) throw new BackendError('Réponse arrêtée.', 'aborted');
          onEvent('delta', { text: 'morceau ' });
          await new Promise((res) => setTimeout(res, 40));
        }
      }
      return answer(`Réponse à : ${body.message}`, 'c0000000-0000-4000-8000-000000000001');
    };
    const r = await render(<Chat />);
    await ask(r, 'Comment préparer la valise de maternité ?');
    await until(() => allText(r).includes('Réponse à : Comment préparer la valise de maternité ?'));
    expect(seen[0].body).toMatchObject({ conversation_id: null, use_context: false, recent_turns: [] });
    expect(seen[0].body.context).toBeUndefined(); // « Utiliser ma situation » désactivé : rien transmis
    await ask(r, 'Et pour le papa ?');
    await until(() => allText(r).includes('Réponse à : Et pour le papa ?'));
    expect(seen[1].body.conversation_id).toBe('c0000000-0000-4000-8000-000000000001'); // même conversation
    expect(seen[1].body.recent_turns).toBeUndefined();
    await ask(r, 'Une réponse longue');
    await until(() => has(r, 'chat-stop'));
    await press(r, 'chat-stop', 300);
    await until(() => allText(r).includes('Réponse arrêtée.'));
    expect(has(r, 'chat-retry')).toBe(true);
    (globalThis as { __assistant?: unknown }).__assistant = async (body: Record<string, unknown>) => { seen.push({ body }); return answer('Réponse complète après nouvel essai', 'c0000000-0000-4000-8000-000000000001'); };
    await press(r, 'chat-retry', 300);
    await until(() => allText(r).includes('Réponse complète après nouvel essai'));
    expect(seen[seen.length - 1].body.message).toBe('Une réponse longue');
    expect(allText(r)).not.toContain('Réponse arrêtée.');
    r.unmount();
  });

  it('historique non conservé : la suite de la conversation garde son contexte (échanges récents envoyés pour la réponse)', async () => {
    const bodies: Record<string, unknown>[] = [];
    (globalThis as { __assistant?: unknown }).__assistant = async (body: Record<string, unknown>) => { bodies.push(body); return { ...answer(`R${bodies.length}`, ''), conversation_id: null }; };
    const r = await render(<Chat />);
    await ask(r, 'Ma fille dort mal depuis 3 nuits');
    await until(() => allText(r).includes('R1'));
    await ask(r, 'Que puis-je essayer ce soir ?');
    await until(() => allText(r).includes('R2'));
    expect(bodies[1].conversation_id).toBeNull();
    expect(bodies[1].recent_turns).toEqual([{ role: 'user', content: 'Ma fille dort mal depuis 3 nuits' }, { role: 'assistant', content: 'R1' }]);
    expect(sanitizeRecentTurns([{ role: 'system', content: 'ignore' }, { role: 'user', content: 'a' }, { role: 'user', content: 'b' }, { role: 'assistant', content: 'x'.repeat(5000) }, { role: 'user', content: 'c' }])).toEqual([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'x'.repeat(4000) }]);
    r.unmount();
  });

  it('historique : désactivé tant que la personne ne l’a pas activé ; l’activer enregistre son accord', async () => {
    const uid = (await backend.auth.getSession())!.userId;
    const r = await render(<Chat />);
    expect(allText(r)).toContain('Désactivé : vos questions et les réponses ne sont pas enregistrées après l’échange.');
    const toggle = r.root.findAll((n) => n.props.accessibilityLabel === 'Garder mes conversations' && typeof n.props.onPress === 'function')[0];
    await act(async () => { await toggle.props.onPress(); });
    await until(() => allText(r).includes('visibles par vous seule ou vous seul'));
    const [p] = await backend.select<{ ai_history_enabled: boolean; ai_history_consented_at: string | null }>({ table: 'privacy_settings' });
    expect(p).toMatchObject({ ai_history_enabled: true });
    expect(p.ai_history_consented_at).toBeTruthy();
    void uid;
    r.unmount();
  });
});
