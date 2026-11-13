/**
 * Audit 05 « Outils à saisie » (13/11/2026) : tests de régression des défauts corrigés, en rendu réel (backend de
 * démonstration). Chaque cas rejoue le geste fautif constaté dans le navigateur (e2e/audit_saisie.py) :
 *  - double appui sur « Enregistrer » : un seul enregistrement, pas de fausse erreur, pas d'action fantôme ;
 *  - saisie gardée sur l'appareil hors connexion : le message le dit (jamais « enregistré » seul) ;
 *  - dates avant la naissance refusées ; échec de suppression signalé ; prénom gardé après un échec.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  const state = { params: {} as Record<string, string> };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => state.params, useIsFocused: () => true, usePathname: () => '/', useNavigation: () => ({ setOptions: jest.fn(), addListener: () => () => undefined }), useFocusEffect: () => undefined, __state: state };
});
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: jest.fn(), launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-local-authentication', () => ({ hasHardwareAsync: jest.fn(async () => false), isEnrolledAsync: jest.fn(async () => false), authenticateAsync: jest.fn(async () => ({ success: true })) }));
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' }, AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  scheduleNotificationAsync: jest.fn(async () => 'n'), cancelScheduledNotificationAsync: jest.fn(async () => undefined), getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })), setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null), getPermissionsAsync: jest.fn(async () => ({ granted: false })), getLastNotificationResponse: jest.fn(() => null),
}));
jest.mock('expo-device', () => ({ isDevice: false, modelName: 'test' }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `toietmoi://${p.replace(/^\//, '')}` }));
// Hors connexion simulé : insertOrQueue peut répondre « gardé sur l'appareil »
const queueMode = { queued: false };
jest.mock('@/lib/offline', () => {
  const actual = jest.requireActual('@/lib/offline');
  return { ...actual, insertOrQueue: jest.fn(async (...a: unknown[]) => (queueMode.queued ? 'queued' : (actual.insertOrQueue as (...x: unknown[]) => Promise<string>)(...a))) };
});

// Panne ponctuelle d'une écriture (réseau coupé, droits) : la prochaine opération nommée échoue une fois
const mockFaults: Record<string, Error | undefined> = {};
jest.mock('@/lib/backend', () => {
  const actual = jest.requireActual('@/lib/backend');
  const backend = new Proxy(actual.backend, {
    get(target, prop) {
      if (typeof prop === 'string' && mockFaults[prop]) { const e = mockFaults[prop]; delete mockFaults[prop]; return () => Promise.reject(e); }
      return (target as Record<string | symbol, unknown>)[prop];
    },
  });
  return { ...actual, backend };
});

import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';
import { backend } from '@/lib/backend';
import { eq } from '@/lib/backend/types';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { useTapShield, TAP_SHIELD_MS } from '@/features/tapShield';
import { toastSaved } from '@/features/saveOutcome';
import { addDays, todayISO } from '@/lib/domain/dates';
import { dueDateFromLmp } from '@/lib/domain/pregnancy';
import Exhausted from '@/app/family/exhausted';
import Feel from '@/app/pregnancy/feel';
import ContraceptionJournal from '@/app/contraception/journal';
import Notebook from '@/app/family/notebook';
import DifficultDay from '@/app/family/difficult';
import OrgEmergency from '@/app/family/urgent';
import Names from '@/app/names';
import Wellbeing from '@/app/child/[id]/wellbeing';
import Needs from '@/app/child/[id]/needs';
import Steps from '@/app/child/[id]/steps';
import Grow from '@/app/child/[id]/grow';
import Appointments from '@/app/appointments';
import { TreatmentsPanel } from '@/features/treatments/TreatmentsPanel';

const params = (jest.requireMock('expo-router') as { __state: { params: Record<string, string> } }).__state.params;
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
  await flush(300);
  return r;
}
const handler = (r: ReactTestRenderer, id: string) => {
  const el = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0];
  if (!el) throw new Error(`testID introuvable : ${id}`);
  return el.props.onPress as () => unknown;
};
/** Appui simple, puis attente (le rendu suit). */
async function press(r: ReactTestRenderer, id: string, wait = 300) {
  const fn = handler(r, id);
  await act(async () => { await fn(); });
  await flush(wait);
}
/** Double appui : le second arrive juste après la fin du premier envoi (backend local rapide), sur le même bouton. */
async function doublePress(r: ReactTestRenderer, id: string, wait = 300) {
  const fn = handler(r, id);
  await act(async () => { await fn(); });
  // le bouton a pu disparaître entre-temps : le second appui part alors sur l'ancien bouton (même endroit à l'écran)
  const again = (() => { try { return handler(r, id); } catch { return fn; } })();
  await act(async () => { await again(); });
  await flush(wait);
}
async function pressLabel(r: ReactTestRenderer, label: string, wait = 300) {
  const el = r.root.findAll((n) => typeof n.props.onPress === 'function' && (n.props.label === label || n.props.accessibilityLabel === label))[0];
  if (!el) throw new Error(`bouton introuvable : ${label}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
async function type(r: ReactTestRenderer, match: (p: Record<string, unknown>) => boolean, v: string) {
  const el = r.root.findAll((n) => typeof n.props.onChangeText === 'function' && match(n.props))[0];
  if (!el) throw new Error('champ introuvable');
  await act(async () => { el.props.onChangeText(v); });
}
const byLabel = (l: string) => (p: Record<string, unknown>) => p.label === l;
const count = async (table: string, filters = [] as ReturnType<typeof eq>[]) => (await backend.select({ table, filters })).length;

jest.setTimeout(60000);

describe(`audit 05 — outils à saisie (${Platform.OS})`, () => {
  let me = '';
  let hid = '';
  let childId = '';
  const birth = addDays(todayISO(), -400);
  beforeAll(async () => {
    await backend.auth.signUp(`saisie.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    me = (await backend.auth.getSession())!.userId;
    const [m] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    hid = m?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    const [c] = await backend.insert<{ id: string }>('children', { household_id: hid, first_name: 'Lou', birth_date: birth, sex: 'female', enabled_tracking: [], allergies_declared: [] });
    childId = c.id;
  });
  beforeEach(() => { (router.push as jest.Mock).mockClear(); queueMode.queued = false; for (const k of Object.keys(params)) delete params[k]; });

  it('fenêtre anti double appui : ignorée juste après, de nouveau active ensuite', () => {
    let api!: ReturnType<typeof useTapShield>;
    function Probe() { api = useTapShield(); return null; }
    act(() => { create(<Probe />); });
    const fn = jest.fn(() => 'ok');
    const g = api.guard(fn);
    expect(g()).toBe('ok');
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1_000_000);
    api.arm();
    expect(api.shielded()).toBe(true);
    expect(g()).toBeUndefined();
    now.mockReturnValue(1_000_000 + TAP_SHIELD_MS + 1);
    expect(api.shielded()).toBe(false);
    expect(g()).toBe('ok');
    now.mockRestore();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('« Je suis à bout » : le second appui ne quitte pas le résultat (aucune navigation)', async () => {
    const r = await render(<Exhausted />);
    for (const q of ['tired', 'sleep', 'irritable', 'distance', 'overwhelmed', 'no_time']) await press(r, `ex-${q}-1`, 0);
    await press(r, 'ex-done', 300);
    expect(r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('ex-result-')).length).toBeGreaterThan(0);
    const anyResultButton = r.root.findAll((n) => n.props.icon === 'sun' && typeof n.props.onPress === 'function')[0];
    await act(async () => { anyResultButton.props.onPress(); });
    expect(router.push).not.toHaveBeenCalled();
    expect(await count('exhaustion_checkins')).toBe(1);
    r.unmount();
  });

  it('« Comment je me sens » : un double appui sur « Enregistrer » garde les cartes (et leurs alertes) affichées', async () => {
    const lmp = addDays(todayISO(), -10 * 7);
    const [p] = await backend.insert<{ id: string }>('pregnancies', { household_id: hid, carrier_user_id: me, status: 'active', due_date: dueDateFromLmp(lmp), lmp_date: lmp, due_date_source: 'lmp', multiplicity: 'single', topics: [] });
    await backend.insert('user_journeys', { user_id: me, household_id: hid, type: 'pregnancy', status: 'active', pregnancy_id: p.id, started_on: lmp });
    const r = await render(<Feel />);
    await press(r, 'feel-sym-bleeding', 0);
    await press(r, 'feel-intensity-3', 0);
    await press(r, 'feel-save', 400);
    expect(r.root.findAll((n) => n.props.testID === 'feel-cards').length).toBeGreaterThan(0);
    await press(r, 'feel-another', 100); // second appui du double appui, au même endroit
    expect(r.root.findAll((n) => n.props.testID === 'feel-cards').length).toBeGreaterThan(0);
    expect(allText(r)).toMatch(/15|112/);
    r.unmount();
  });

  it('journal de contraception : double appui sur « Noter » → une note, pas de « Choisissez d’abord… »', async () => {
    const r = await render(<ContraceptionJournal />);
    await press(r, 'cj-effect-headache', 0);
    await doublePress(r, 'cj-save', 300);
    expect(await count('contraception_logs', [eq('kind', 'effect')])).toBe(1);
    expect(allText(r)).not.toContain('Choisissez d’abord ce que vous ressentez.');
    r.unmount();
  });

  it('carnet de la maison : double appui sur « Enregistrer » → une seule fiche', async () => {
    const r = await render(<Notebook />);
    await press(r, 'nb-new', 300);
    await type(r, (p) => p.testID === 'nb-title', 'Code wifi');
    await doublePress(r, 'nb-save', 300);
    expect(await count('house_notes')).toBe(1);
    r.unmount();
  });

  it('journée difficile : la demande d’aide du jour est reconnue après rechargement (pas de seconde demande)', async () => {
    await backend.insert('care_requests', { household_id: hid, from_user: me, kind: 'help_today', message: 'Journée difficile', status: 'open' });
    const r = await render(<DifficultDay />);
    expect(allText(r)).toContain('Demande envoyée');
    await press(r, 'difficult-help', 200);
    expect(await count('care_requests', [eq('kind', 'help_today')])).toBe(1);
    r.unmount();
  });

  it('mode urgence : double appui sur « Demander un relais » → une seule demande', async () => {
    const r = await render(<OrgEmergency />);
    const n0 = await count('care_requests', [eq('kind', 'relay')]);
    const el = () => r.root.findAll((n) => n.props.accessibilityLabel === 'Demander un relais' && typeof n.props.onPress === 'function')[0];
    await act(async () => { el().props.onPress(); await new Promise((res) => setTimeout(res, 50)); });
    await act(async () => { el().props.onPress(); });
    await flush(300);
    expect(await count('care_requests', [eq('kind', 'relay')])).toBe(n0 + 1);
    r.unmount();
  });

  it('prénoms : Entrée deux fois → un favori ; après un échec, le prénom saisi reste dans le champ', async () => {
    const r = await render(<Names />);
    const field = (p: Record<string, unknown>) => p.label === 'Prénom' && typeof p.onSubmitEditing === 'function';
    await type(r, field, 'Maëlys');
    const submit = () => r.root.findAll((n) => field(n.props))[0].props.onSubmitEditing as () => Promise<void>;
    await act(async () => { await submit()(); });
    await act(async () => { await submit()(); });
    await flush(300);
    expect((await backend.select<{ name: string }>({ table: 'name_favorites' })).filter((f) => f.name === 'Maëlys')).toHaveLength(1);
    await type(r, field, 'Anouk');
    await flush(800); // fin de la fenêtre anti double appui
    mockFaults.insert = new Error('Réseau indisponible');
    await act(async () => { await submit()(); });
    await flush(300);
    expect((await backend.select<{ name: string }>({ table: 'name_favorites' })).some((f) => f.name === 'Anouk')).toBe(false);
    expect(r.root.findAll((n) => field(n.props))[0].props.value).toBe('Anouk');
    r.unmount();
  });

  it('humeur de l’enfant : double appui → une note', async () => {
    params.id = childId;
    const r = await render(<Wellbeing />);
    await doublePress(r, 'wellbeing-quick-4', 300);
    expect(await count('child_wellbeing', [eq('child_id', childId)])).toBe(1);
    r.unmount();
  });

  it('saisie gardée sur l’appareil (hors connexion) : le message le dit, jamais « enregistré » seul', () => {
    const toast = jest.fn();
    toastSaved(toast, 'queued', 'Noté : difficile.');
    expect(toast).toHaveBeenCalledWith('Enregistré sur l’appareil — synchronisation au retour du réseau.', 'info');
    toastSaved(toast, 'sent', 'Noté : difficile.');
    expect(toast).toHaveBeenLastCalledWith('Noté : difficile.');
  });

  it('besoin particulier et démarches : double appui → un seul profil, une seule liste', async () => {
    params.id = childId;
    params.tab = 'profile';
    const r = await render(<Needs />);
    await flush(600);
    const kinds = r.root.findAll((n) => n.props.accessibilityLabel === 'Troubles DYS' && typeof n.props.onPress === 'function');
    if (kinds[0]) await act(async () => { kinds[0].props.onPress(); });
    await doublePress(r, 'needs-save', 300);
    expect(await count('child_needs', [eq('child_id', childId)])).toBe(1);
    r.unmount();
    const s = await render(<Steps />);
    await flush(600);
    if (!s.root.findAll((n) => n.props.testID === 'kid-steps-create').length) throw new Error(allText(s).slice(0, 500));
    const n0 = await count('checklists');
    await doublePress(s, 'kid-steps-create', 400);
    expect(await count('checklists')).toBe(n0 + 1);
    s.unmount();
  });

  it('« Je grandis » : « Observé » en double appui → une seule étape ; date avant la naissance refusée', async () => {
    params.id = childId;
    const r = await render(<Grow />);
    const quick = r.root.findAll((n) => typeof n.props.testID === 'string' && n.props.testID.startsWith('gr-quick-') && typeof n.props.onPress === 'function')[0];
    const key = (quick.props.testID as string).slice('gr-quick-'.length);
    await act(async () => { quick.props.onPress(); quick.props.onPress(); });
    await flush(400);
    expect((await backend.select<{ step_key: string }>({ table: 'child_steps', filters: [eq('child_id', childId)] })).filter((x) => x.step_key === key)).toHaveLength(1);
    await press(r, `gr-step-${key}`, 300);
    await press(r, 'gr-st-observed', 0);
    await type(r, (p) => p.testID === 'gr-date', '01/01/2001');
    await press(r, 'gr-save', 300);
    expect(allText(r)).toContain('La date précède la naissance.');
    r.unmount();
  });

  it('rendez-vous : une suppression qui échoue est signalée, la fiche reste ouverte', async () => {
    const [a] = await backend.insert<{ id: string; title: string }>('appointments', { household_id: hid, kind: 'consultation', title: 'Contrôle', starts_at: new Date(Date.now() + 5 * 86400000).toISOString(), questions: [], for_parent: true, private_to_creator: false });
    const r = await render(<Appointments />);
    await flush(500);
    if (allText(r).includes('Toute la famille')) await pressLabel(r, 'Toute la famille', 300);
    const open = r.root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.includes('Contrôle') && typeof n.props.onPress === 'function')[0];
    if (!open) throw new Error(allText(r).slice(0, 600));
    await act(async () => { open.props.onPress(); });
    await flush(300);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { buttons?.[buttons.length - 1]?.onPress?.(); });
    mockFaults.remove = new Error('Réseau indisponible');
    await pressLabel(r, 'Supprimer ce rendez-vous', 400);
    alert.mockRestore();
    // (avant la correction, l'erreur remontait sans message : promesse rejetée non gérée, fiche fermée sans explication)
    expect(allText(r)).toContain('Modifier le rendez-vous');
    expect(await count('appointments', [eq('id', a.id)])).toBe(1);
    r.unmount();
  });

  it('mes traitements : double appui sur « Enregistrer » → un seul traitement, dose recopiée telle quelle', async () => {
    const r = await render(<TreatmentsPanel scope={{ kind: 'me' }} />);
    await press(r, 'me-treatment-add', 300);
    await type(r, (p) => p.testID === 't-name', 'Fer');
    await type(r, (p) => p.testID === 't-dose', '1 comprimé');
    await type(r, (p) => p.testID === 't-times', '08:00');
    await doublePress(r, 't-save', 400);
    const rows = await backend.select<{ name: string; dose_text: string }>({ table: 'my_treatments' });
    expect(rows.filter((x) => x.name === 'Fer')).toHaveLength(1);
    expect(rows[0].dose_text).toBe('1 comprimé');
    r.unmount();
  });
});
