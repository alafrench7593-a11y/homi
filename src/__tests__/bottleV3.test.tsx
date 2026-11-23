/**
 * Biberon (refonte v3, outil à données) :
 *  - logique pure : état et commande de la session (un seul emplacement), chronomètre à largeur stable, temps
 *    recalculé depuis les horodatages, synthèse par période (aucune donnée inventée, micrographique ≥ 2 valeurs) ;
 *  - rendu réel (backend de démonstration) : démarrer → pause → reprendre AU MÊME EMPLACEMENT, temps EXACT au retour
 *    au premier plan après une mise en arrière-plan simulée, enregistrement sans double soumission et résultat réel ;
 *  - tuiles : changer de période met à jour ENSEMBLE la valeur, le libellé de période et le micrographique.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const r = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true, setParams: jest.fn() };
  return { router: r, useRouter: () => r, useLocalSearchParams: () => ({}), useIsFocused: () => true, usePathname: () => '/' };
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
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components/Overlays';
import { BottleSessionCard, SESSION, sessionLayout } from '@/features/bottleSession';
import { BottleStatsTiles } from '@/features/bottleStats';
import { Sparkline } from '@/components/controls';
import { bottleStats, primaryCommand, sessionClock, sessionSeconds, sessionState, sessionTickMs, type StatsPeriod } from '@/lib/domain/bottleSession';
import type { BottleLike } from '@/lib/domain/bottleHistory';
import type { Child } from '@/lib/types';
import { spacing } from '@/theme/tokens';

// ------------------------------------------------------------------ logique pure
describe('session de biberon : logique pure', () => {
  it('écran court (320 × 568) : cadran et carte resserrés, la commande ronde reste sous le pli (audit 10)', () => {
    // relevé web 320 × 568 (titre « Biberon de Lina » sur deux lignes) : haut de la carte à 244 px, libellé 20 px,
    // marge intérieure 16 px ; la commande ronde (88 px) doit finir avant 568 px
    const small = sessionLayout(320, 568);
    expect(244 + spacing.md + 20 + small.gap + small.dial + small.gap + SESSION.orb).toBeLessThanOrEqual(568);
    expect(small.dial).toBeGreaterThanOrEqual(168);
    // grand écran : inchangé
    expect(sessionLayout(390, 844)).toEqual({ dial: SESSION.dialMax, gap: spacing.md });
  });
  it('une seule commande principale : démarrer → pause → reprendre', () => {
    expect(sessionState(null)).toBe('idle');
    expect(sessionState({ paused_at: null })).toBe('running');
    expect(sessionState({ paused_at: '2026-11-13T10:00:00Z' })).toBe('paused');
    expect(primaryCommand('idle')).toEqual({ action: 'start', icon: 'play', labelKey: 'bs.start' });
    expect(primaryCommand('running')).toEqual({ action: 'pause', icon: 'pause', labelKey: 'bs.pause' });
    expect(primaryCommand('paused')).toEqual({ action: 'resume', icon: 'play', labelKey: 'bs.resume' });
  });

  it('chronomètre à largeur stable (chiffres tabulaires) : mm:ss puis h:mm:ss', () => {
    expect(sessionClock(0)).toBe('00:00');
    expect(sessionClock(247)).toBe('04:07');
    expect(sessionClock(3599)).toBe('59:59');
    expect(sessionClock(3847)).toBe('1:04:07');
    expect(sessionClock(-3)).toBe('00:00');
    // même nombre de caractères tout au long d'une prise de moins d'une heure
    expect(new Set([0, 9, 61, 599, 3599].map((s) => sessionClock(s).length)).size).toBe(1);
  });

  it('temps recalculé depuis les horodatages : exact après une absence, figé en pause', () => {
    const start = new Date('2026-11-13T10:00:00Z');
    const running = { started_at: start.toISOString(), paused_at: null, paused_seconds: 30, ended_at: null };
    // retour 7 min 15 s plus tard : 435 s − 30 s de pause déjà comptées
    expect(sessionSeconds(running, new Date(start.getTime() + 435_000))).toBe(405);
    const paused = { ...running, paused_at: new Date(start.getTime() + 120_000).toISOString() };
    expect(sessionSeconds(paused, new Date(start.getTime() + 3_600_000))).toBe(90);
    expect(sessionSeconds(null, new Date())).toBe(0);
    expect(sessionTickMs('running')).toBe(250);
    expect(sessionTickMs('paused')).toBeNull();
    expect(sessionTickMs('idle')).toBeNull();
  });
});

describe('synthèse des biberons par période', () => {
  const now = new Date(2026, 10, 13, 18, 0);
  const at = (daysAgo: number, h: number) => new Date(2026, 10, 13 - daysAgo, h, 0).toISOString();
  const b = (id: string, iso: string, consumed: number | null): BottleLike => ({ id, at: iso, prepared_ml: 150, consumed_ml: consumed, milk_type: null });

  it('jour : compte du jour, total bu seulement sur les quantités renseignées, série par biberon', () => {
    const s = bottleStats([b('1', at(0, 7), 120), b('2', at(0, 11), null), b('3', at(0, 15), 90), b('4', at(1, 9), 100)], 'day', now);
    expect(s.count).toBe(3);
    expect(s.consumedTotal).toBe(210);
    expect(s.consumedCount).toBe(2);
    expect(s.consumedSeries).toEqual([120, 90]);
    expect(s.countSeries).toBeUndefined();
  });

  it('semaine : un jour sans saisie est absent de la série (jamais un zéro inventé)', () => {
    const s = bottleStats([b('1', at(0, 7), 120), b('2', at(2, 7), 80), b('3', at(2, 11), null)], 'week', now);
    expect(s.count).toBe(3);
    expect(s.consumedTotal).toBe(200);
    expect(s.countSeries).toEqual([null, null, null, null, 2, null, 1]);
    expect(s.consumedSeries).toEqual([null, null, null, null, 80, null, 120]);
  });

  it('état vide explicite et pas de micrographique sans au moins deux valeurs réelles', () => {
    const empty = bottleStats([], 'week', now);
    expect(empty.count).toBeNull();
    expect(empty.consumedTotal).toBeNull();
    expect(empty.countSeries).toBeUndefined();
    const one = bottleStats([b('1', at(0, 7), 120)], 'day', now);
    expect(one.consumedSeries).toBeUndefined();
    expect(bottleStats([b('1', at(0, 7), null)], 'day', now).consumedTotal).toBeNull();
  });
});

// ------------------------------------------------------------------ rendu
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
  await flush(200);
  return r;
}
const host = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string')[0];
/** L'élément appuyable (Pressable : rôle + onPress), sinon tout nœud portant onPress. */
const pressable = (r: ReactTestRenderer, id: string) => {
  const all = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function');
  return all.find((n) => n.props.accessibilityRole === 'button') ?? all[0];
};
const textOf = (r: ReactTestRenderer, id: string) => texts(host(r, id)).join('');
async function press(r: ReactTestRenderer, id: string, wait = 250) {
  const el = pressable(r, id);
  if (!el) throw new Error(`testID introuvable : ${id}`);
  await act(async () => { await el.props.onPress(); });
  await flush(wait);
}
/** Place de la commande principale : la colonne centrale (largeur fixe) et le bouton rond (taille fixe). */
function primarySlot(r: ReactTestRenderer) {
  const row = host(r, 'bottle-session-controls');
  const kids = row.children as ReactTestInstance[];
  const slotIndex = kids.findIndex((k) => k.props.testID === 'bottle-session-primary-slot');
  const orb = r.root.findAll((n) => n.props.testID === 'bottle-session-primary' && n.props.accessibilityRole === 'button' && n.props.style != null && typeof n.props.style === 'object' && !Array.isArray(n.props.style))[0];
  return { slotIndex, slotWidths: kids.map((k) => (k.props.style as { width: number }).width), orbStyle: orb?.props.style };
}

describe(`biberon en direct (${Platform.OS})`, () => {
  let child: Child;
  beforeAll(async () => {
    await backend.auth.signUp(`biberon.v3.${Platform.OS}@exemple.test`, 'MotDePasse!2026');
    const [first] = await backend.select<{ household_id: string }>({ table: 'household_members' });
    const hid = first?.household_id ?? await backend.rpc<string>('create_household', { p_name: 'Test' });
    const birth = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    [child] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Lina', sex: 'female', birth_date: birth, enabled_tracking: ['bottle', 'diaper', 'sleep'] });
  });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  it('démarrer, pause et reprendre gardent la commande au même emplacement', async () => {
    const r = await render(<BottleSessionCard child={child} onRecordPast={() => undefined} />);
    const idle = primarySlot(r);
    expect(idle.slotIndex).toBe(1);
    expect(idle.slotWidths).toEqual([SESSION.slot, SESSION.slot, SESSION.slot]);
    expect(idle.orbStyle).toEqual({ width: SESSION.orb, height: SESSION.orb });
    expect(pressable(r, 'bottle-session-primary').props.accessibilityLabel).toBe('Démarrer');
    expect(textOf(r, 'bottle-session-clock')).toBe('00:00');

    await press(r, 'bottle-session-primary');
    expect(pressable(r, 'bottle-session-primary').props.accessibilityLabel).toBe('Pause');
    expect(primarySlot(r)).toEqual(idle);
    expect(pressable(r, 'bottle-session-finish')).toBeTruthy();
    expect(allText(r)).toContain('En cours');

    await press(r, 'bottle-session-primary');
    expect(pressable(r, 'bottle-session-primary').props.accessibilityLabel).toBe('Reprendre');
    expect(primarySlot(r)).toEqual(idle);
    expect(allText(r)).toContain('En pause');

    await press(r, 'bottle-session-primary');
    expect(pressable(r, 'bottle-session-primary').props.accessibilityLabel).toBe('Pause');
    expect(primarySlot(r)).toEqual(idle);
    await act(async () => { r.unmount(); });
  });

  it('le temps affiché est exact au retour dans l’application (arrière-plan simulé)', async () => {
    const handlers: ((s: AppStateStatus) => void)[] = [];
    const original = AppState.addEventListener;
    AppState.addEventListener = ((type: string, h: (s: AppStateStatus) => void) => {
      if (type === 'change') handlers.push(h);
      return { remove: () => undefined };
    }) as typeof AppState.addEventListener;
    const r = await render(<BottleSessionCard child={child} onRecordPast={() => undefined} />);
    expect(pressable(r, 'bottle-session-primary').props.accessibilityLabel).toBe('Pause'); // reprise du test précédent
    const [row] = await backend.select<{ started_at: string; paused_at: string | null; paused_seconds: number; ended_at: string | null }>({ table: 'bottles', filters: [eq('child_id', child.id), eq('in_progress', true)] });
    // L'application passe en arrière-plan : les minuteurs JavaScript sont suspendus, seule l'horloge avance (12 min 34 s).
    const away = Date.now() + 754_000;
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback', 'performance', 'hrtime'] });
    jest.setSystemTime(away);
    // Retour au premier plan : l'affichage est recalculé tout de suite, sans attendre le prochain tic
    act(() => { handlers.forEach((h) => h('active')); });
    expect(textOf(r, 'bottle-session-clock')).toBe(sessionClock(sessionSeconds(row, new Date(away))));
    expect(sessionSeconds(row, new Date(away))).toBeGreaterThanOrEqual(754);
    jest.useRealTimers();
    await act(async () => { r.unmount(); });
    AppState.addEventListener = original;
  });

  it('terminer : récapitulatif, un seul enregistrement malgré deux appuis, résultat réel affiché', async () => {
    const r = await render(<BottleSessionCard child={child} onRecordPast={() => undefined} />);
    await press(r, 'bottle-session-finish');
    const consumed = r.root.findAll((n) => n.props.testID === 'bottle-recap-consumed' && typeof n.props.onChangeText === 'function')[0];
    await act(async () => { consumed.props.onChangeText('90'); });
    const save = pressable(r, 'bottle-recap-save');
    await act(async () => { void save.props.onPress(); void save.props.onPress(); });
    // appui tardif, juste après l'enregistrement (la liste n'a pas encore été relue) : ignoré, la ligne reste intacte
    const late = pressable(r, 'bottle-recap-save') ?? save;
    await act(async () => { await late.props.onPress(); });
    await flush(400);
    const rows = await backend.select<{ in_progress: boolean; consumed_ml: number | null }>({ table: 'bottles', filters: [eq('child_id', child.id)] });
    expect(rows).toHaveLength(1);
    expect(rows[0].in_progress).toBe(false);
    expect(rows[0].consumed_ml).toBe(90);
    expect(host(r, 'bottle-session-result')).toBeTruthy();
    expect(allText(r)).toContain('Enregistré');
    expect(allText(r)).toContain('90 ml bus');
    expect(pressable(r, 'bottle-session-primary').props.accessibilityLabel).toBe('Démarrer');
    expect(primarySlot(r).slotWidths).toEqual([SESSION.slot, SESSION.slot, SESSION.slot]);
    await act(async () => { r.unmount(); });
  });
});

describe('tuiles de synthèse : changement de période', () => {
  const now = new Date();
  const ago = (d: number, h: number) => { const x = new Date(now); x.setDate(x.getDate() - d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
  const bottles: BottleLike[] = [
    { id: '1', at: ago(0, 0), prepared_ml: 150, consumed_ml: 120, milk_type: null },
    { id: '2', at: ago(2, 9), prepared_ml: 150, consumed_ml: 100, milk_type: null },
    { id: '3', at: ago(3, 9), prepared_ml: 150, consumed_ml: 80, milk_type: null },
  ];
  function Harness() {
    const [p, setP] = React.useState<StatsPeriod>('day');
    return <BottleStatsTiles bottles={bottles} period={p} onPeriod={setP} childId="c1" now={now} onOpen={() => undefined} />;
  }
  const tileLabel = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.props.accessibilityLabel === 'string')[0]?.props.accessibilityLabel as string;
  const sparks = (r: ReactTestRenderer) => r.root.findAllByType(Sparkline).filter((n) => n.children.length > 0).length;

  it('le libellé, la valeur et le micrographique changent ensemble', async () => {
    const r = await render(<Harness />);
    expect(tileLabel(r, 'bottle-stats-count')).toBe('Biberons notés : 1 biberon, aujourd’hui');
    expect(tileLabel(r, 'bottle-stats-ml')).toContain('120 ml');
    expect(sparks(r)).toBe(0); // une seule valeur réelle : pas de micrographique
    await press(r, 'bottle-stats-week', 100);
    expect(tileLabel(r, 'bottle-stats-count')).toContain('3 biberons, 7 derniers jours');
    expect(tileLabel(r, 'bottle-stats-ml')).toContain('300 ml');
    expect(tileLabel(r, 'bottle-stats-ml')).toContain('7 derniers jours');
    expect(sparks(r)).toBe(2); // trois jours notés : les deux micrographiques apparaissent
    await press(r, 'bottle-stats-day', 100);
    expect(tileLabel(r, 'bottle-stats-count')).toContain('aujourd’hui');
    expect(sparks(r)).toBe(0);
    await act(async () => { r.unmount(); });
  });

  it('historique vide : état explicite dans les tuiles', async () => {
    const r = await render(<BottleStatsTiles bottles={[]} period="week" onPeriod={() => undefined} childId="c1" />);
    expect(tileLabel(r, 'bottle-stats-count')).toBe('Biberons notés : Aucun biberon noté ces 7 jours');
    expect(host(r, 'tile-empty')).toBeTruthy();
    await act(async () => { r.unmount(); });
  });
});
