/**
 * « Découvrir HOMI » : couverture (chaque outil du catalogue a une démo, une phrase d'usage et un lien valide, dans les
 * 5 langues), conditions d'accès (src/lib/premium/access.ts), données de démo ISOLÉES (aucun appel au serveur, aucune
 * écriture locale), Réduire les animations (état final, contenu complet), enchaînement (une fois, relance, sortie),
 * point d'injection du logotype.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null, MaterialCommunityIcons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()), selectionAsync: jest.fn(() => Promise.resolve()), notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@/lib/demoMode', () => ({ useBackendMode: () => ({ isDemo: false, canLeave: false }) }));
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: null, ready: true }) }));
// Tout accès au serveur (ou à la démonstration du foyer) est enregistré : une démo ne doit en faire AUCUN
const mockBackendCalls: string[] = [];
jest.mock('@/lib/backend', () => {
  const rec = (name: string): object => new Proxy(() => undefined, {
    get: (_t, p) => (p === 'then' ? undefined : rec(`${name}.${String(p)}`)),
    apply: () => { mockBackendCalls.push(name); return rec(`${name}()`); },
  });
  return { backend: rec('backend'), isDemo: () => false, supabase: rec('supabase') };
});

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale, t as tr } from '@/i18n';
import { toolCatalog } from '@/lib/domain/toolCatalog';
import { TOOLS, toolsFor, type ScopeCtx } from '@/lib/journeys/tools';
import { gateFor, isFreeRoute } from '@/lib/premium/access';
import { APP_ROUTES } from '@/lib/routes.generated';
import { isPublicRoute } from '@/lib/publicRoutes';
import { useUiStore } from '@/lib/store';
import { ThemeProvider } from '@/theme/ThemeProvider';
import {
  accessPath, CHAPTERS, CUSTOM_DEMOS, DISCOVER_BY_KEY, DISCOVER_TOOLS, GENERIC_KINDS, neighbourTool, routeExists, toolAccessInfo, toolLink, TOOL_DEMOS,
} from '@/features/discover/model';
import { accessLines, describeDemo, usagePhrase, usageSource } from '@/features/discover/texts';
import { discoverExit, KEYNOTE_STEPS, LAST_STEP, swipeStep } from '@/features/discover/flow';
import { gestureDuration } from '@/features/discover/DemoPlayer';
import { ToolDemo } from '@/features/discover/ToolDemo';
import { DiscoverKeynote } from '@/features/discover/Keynote';
import { getDiscoverOpening, OPENING, setDiscoverOpening, type DiscoverLogoProps } from '@/features/discover/opening';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readdirSync(p: string): string[]; readFileSync(p: string, e: string): string };

const CTXS: ScopeCtx[] = [
  { scope: 'avoid' }, { scope: 'ttc' }, { scope: 'cycle' }, { scope: 'none' }, { scope: 'pregnancy', pregnancyId: 'p1' },
  { scope: 'postpartum', babyId: 'c1', postpartum: true }, { scope: 'baby', childId: 'c1', postpartum: true }, { scope: 'child', childId: 'c2' }, { scope: 'family' },
];
const LOCALES = Object.keys(DICTIONARIES);

const mounted: ReactTestRenderer[] = [];
async function render(el: React.ReactElement) {
  let r!: ReactTestRenderer;
  await act(async () => { r = create(<GestureHandlerRootView><ThemeProvider>{el}</ThemeProvider></GestureHandlerRootView>); });
  mounted.push(r);
  return r;
}
const byTestId = (r: ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const pressTarget = async (r: ReactTestRenderer) => {
  const target = r.root.findAll((n) => n.props.testID === 'demo-target' && typeof n.props.onPress === 'function')[0]
    ?? r.root.findAll((n) => n.props.testID === 'demo-target' && typeof n.props.onToggle === 'function')[0];
  expect(target).toBeTruthy();
  await act(async () => { (target.props.onPress ?? (() => target.props.onToggle(true)))(); });
};
const texts = (r: ReactTestRenderer) => r.root.findAll((n) => typeof n.type === 'string').flatMap((n: ReactTestInstance) => (Array.isArray(n.props.children) ? n.props.children : [n.props.children])).filter((c): c is string => typeof c === 'string').join(' | ');

beforeAll(() => setLocale('fr'));
beforeEach(() => {
  jest.useFakeTimers();
  mockBackendCalls.length = 0;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  act(() => { useUiStore.setState({ nightMode: false, themePreference: 'light', hapticsEnabled: false }); });
});
afterEach(async () => {
  await act(async () => { while (mounted.length) mounted.pop()!.unmount(); });
  jest.useRealTimers();
  jest.restoreAllMocks();
  setLocale('fr');
});

describe('couverture : chaque outil du catalogue a sa démo', () => {
  it('les 144 outils du registre ont une démo, un chapitre, une seule fois', () => {
    expect(DISCOVER_TOOLS.length).toBe(TOOLS.length);
    expect(new Set(DISCOVER_TOOLS.map((x) => x.key)).size).toBe(TOOLS.length);
    for (const d of TOOLS) expect(TOOL_DEMOS[d.id]).toBeDefined();
    for (const k of Object.keys(TOOL_DEMOS)) expect(TOOLS.some((d) => d.id === k)).toBe(true);
    const kinds = new Set(DISCOVER_TOOLS.map((x) => x.demo.kind));
    for (const k of GENERIC_KINDS) expect(kinds.has(k)).toBe(true);
    const customs = new Set(DISCOVER_TOOLS.flatMap((x) => (x.demo.kind === 'custom' ? [x.demo.demo] : [])));
    for (const c of CUSTOM_DEMOS) expect(customs.has(c)).toBe(true);
    // outils phares : démo sur mesure
    for (const k of ['family_missions', 'baby_bottle', 'kid_sleep', 'mood', 'scan_product', 'cycle_home', 'preg_evolution', 'family_shopping', 'family_stocks']) {
      expect(DISCOVER_BY_KEY[k].demo.kind).toBe('custom');
    }
  });

  it('chaque entrée du catalogue (9 parcours, ≈ 155) mène à une démo et à une route existante', () => {
    const ids = new Set<string>();
    for (const ctx of CTXS) {
      for (const tool of toolCatalog(ctx)) {
        ids.add(tool.id);
        expect(DISCOVER_BY_KEY[tool.key]).toBeDefined();
        expect(routeExists(tool.href, APP_ROUTES)).toBe(true);
      }
    }
    expect(ids.size).toBeGreaterThanOrEqual(148);
  });

  it('table outil → démo → lien (HOMI_DEMOS_OUT=docs/audit/DEMOS_OUTILS.csv)', () => {
    const rows = new Map<string, string[]>();
    const cell = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    for (const ctx of CTXS) {
      for (const tool of toolCatalog(ctx)) {
        if (rows.has(tool.id)) continue;
        const x = DISCOVER_BY_KEY[tool.key];
        const link = toolLink(tool.key, tool.href);
        const a = toolAccessInfo(tool.key);
        const access = [a.free ? 'sans abonnement' : 'Premium', a.ai ? 'offre IA' : '', a.caregiver ? 'nounou sans abonnement' : '', a.legacy ? 'achat à vie conservé' : ''].filter(Boolean).join(' + ');
        rows.set(tool.id, [tool.id, tool.key, tool.label, x.chapter, x.demo.kind === 'custom' ? 'sur mesure' : 'type', x.demo.kind === 'custom' ? x.demo.demo : x.demo.kind,
          usageSource(tool.key), `/discover/tool/${tool.key}`, link.href, routeExists(link.href, APP_ROUTES) ? 'oui' : 'non', toolLink(tool.key).href, access]);
      }
    }
    // outils du registre absents du catalogue dédoublonné (même adresse qu'un autre outil) : présentés aussi
    const keys = new Set([...rows.values()].map((r) => r[1]));
    for (const x of DISCOVER_TOOLS.filter((d) => !keys.has(d.key))) {
      const link = toolLink(x.key);
      const a = toolAccessInfo(x.key);
      rows.set(`registre:${x.key}`, [`registre:${x.key}`, x.key, tr(`tool.${x.key}` as never), x.chapter, x.demo.kind === 'custom' ? 'sur mesure' : 'type', x.demo.kind === 'custom' ? x.demo.demo : x.demo.kind,
        usageSource(x.key), `/discover/tool/${x.key}`, link.href, routeExists(link.href, APP_ROUTES) ? 'oui' : 'non', link.href, a.free ? 'sans abonnement' : 'Premium']);
    }
    expect(new Set([...rows.values()].map((r) => r[1])).size).toBe(DISCOVER_TOOLS.length);
    for (const r of rows.values()) expect(r[9]).toBe('oui');
    const out = process.env.HOMI_DEMOS_OUT;
    if (!out) return;
    const head = ['outil_id', 'outil_cle', 'libelle_fr', 'chapitre', 'demo', 'demo_detail', 'phrase_usage', 'ecran_demo', 'lien_destination', 'route_valide', 'lien_sans_profil', 'acces'];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('fs') as { writeFileSync(p: string, d: string): void }).writeFileSync(out, [head.join(','), ...[...rows.values()].map((r) => r.map(cell).join(','))].join('\n') + '\n');
  });

  it('le lien de chaque démo pointe vers une route existante (générique ou espace hub)', () => {
    for (const x of DISCOVER_TOOLS) {
      const l = toolLink(x.key);
      expect(routeExists(l.href, APP_ROUTES)).toBe(true);
      if (!l.fallback) expect(l.href).not.toMatch(/\/child\/(enfant|:id)|\[/);
    }
    // une adresse réelle du foyer (enfant) est préférée quand elle existe
    expect(toolLink('kid_growth', '/child/c1/growth')).toEqual({ href: '/child/c1/growth', fallback: false });
    expect(toolLink('kid_growth').fallback).toBe(true);
    expect(toolLink('family_missions')).toEqual({ href: '/family/missions', fallback: false });
  });

  it.each(LOCALES.map((l) => [l]))('« %s » : nom, phrase d’usage, geste et résultat non vides pour chaque outil', (locale) => {
    setLocale(locale);
    for (const x of DISCOVER_TOOLS) {
      expect(tr(`tool.${x.key}` as never).length).toBeGreaterThan(1);
      expect(usagePhrase(x.key).length).toBeGreaterThan(3);
      const d = describeDemo(x);
      expect(d.gesture.length).toBeGreaterThan(3);
      expect(d.result.length).toBeGreaterThan(3);
      expect(`${d.gesture}${d.result}`).not.toMatch(/kn\.|\{[a-z]+\}/);
    }
  });

  it('phrases d’usage tirées des sous-titres existants quand ils existent', () => {
    const src = DISCOVER_TOOLS.map((x) => usageSource(x.key));
    expect(src.filter((s) => s === 'absente')).toEqual([]);
    expect(src.filter((s) => s === 'sous-titre').length).toBeGreaterThanOrEqual(90);
    expect(usagePhrase('family_missions')).toBe(tr('tool.family_missions.sub'));
  });

  it('chaque chapitre a des outils, ses outils mis en avant en font partie', () => {
    for (const c of CHAPTERS) {
      const keys = DISCOVER_TOOLS.filter((x) => x.chapter === c.key).map((x) => x.key);
      expect(keys.length).toBeGreaterThan(0);
      for (const f of c.featured) expect(keys).toContain(f);
    }
    expect(KEYNOTE_STEPS[0].kind).toBe('opening');
    expect(KEYNOTE_STEPS[LAST_STEP].kind).toBe('end');
    expect(KEYNOTE_STEPS.filter((s) => s.kind === 'chapter').length).toBe(8);
  });

  it('outil précédent / suivant : parcourt tout le catalogue en boucle', () => {
    let k = DISCOVER_TOOLS[0].key;
    const seen = new Set<string>();
    for (let i = 0; i < DISCOVER_TOOLS.length; i++) { seen.add(k); k = neighbourTool(k, 1); }
    expect(seen.size).toBe(DISCOVER_TOOLS.length);
    expect(neighbourTool(DISCOVER_TOOLS[0].key, -1)).toBe(DISCOVER_TOOLS[DISCOVER_TOOLS.length - 1].key);
  });
});

describe('conditions d’accès (src/lib/premium/access.ts)', () => {
  it('cohérentes avec gateFor pour chaque outil', () => {
    for (const x of DISCOVER_TOOLS) {
      const a = toolAccessInfo(x.key);
      const path = accessPath(x.key);
      expect(a.free).toBe(isFreeRoute(path));
      if (!a.free) expect(gateFor(path, false, null)).toBe('locked');
      expect(accessLines(a).length).toBeGreaterThanOrEqual(1);
    }
  });
  it('exemples : urgences gratuites, assistant ouvert par l’offre IA, tâches ouvertes à la nounou, outil acheté à vie', () => {
    expect(toolAccessInfo('emergency').free).toBe(true);
    expect(toolAccessInfo('family_sos').free).toBe(true);
    expect(toolAccessInfo('ask').ai).toBe(true);
    expect(toolAccessInfo('family_tasks').caregiver).toBe(true);
    expect(toolAccessInfo('baby_bottle').caregiver).toBe(true);
    expect(toolAccessInfo('mood').caregiver).toBe(false);
    expect(toolAccessInfo('custody').legacy).toBe(true);
    expect(toolAccessInfo('family_missions').scopes).toContain('family');
  });
  it('la présentation elle-même est libre et publique (première ouverture, sans compte)', () => {
    for (const p of ['/discover', '/discover/tools', '/discover/tool/baby_bottle']) {
      expect(isFreeRoute(p)).toBe(true);
      expect(isPublicRoute(p)).toBe(true);
    }
    for (const r of ['/discover', '/discover/tools', '/discover/tool/[id]']) expect(APP_ROUTES).toContain(r);
  });
});

describe('données de démo isolées du foyer', () => {
  it('aucun fichier des démos ne lit ni n’écrit les données (seul RealLink lit, en lecture seule)', () => {
    const dir = 'src/features/discover';
    const forbidden = /from '@\/lib\/(data|backend|demoMode|offline|supabase)|from '@\/lib\/store'|AsyncStorage|localStorage|useMutation/;
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(`${dir}/${f}`, 'utf8');
      if (f === 'RealLink.tsx') { expect(src).not.toMatch(/useMutation|mutate|insert|upsert|\.rpc\(/); continue; }
      if (f === 'useDiscoverNav.ts') { expect(src).not.toMatch(/setState|set[A-Z]\w+\(/); continue; }
      expect(`${f}: ${forbidden.test(src)}`).toBe(`${f}: false`);
    }
  });

  it('jouer et toucher les 144 démos : aucun appel au serveur, aucune écriture locale', async () => {
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    const before = JSON.stringify(useUiStore.getState());
    for (const x of DISCOVER_TOOLS) {
      const r = await render(<ToolDemo tool={x} />);
      await pressTarget(r);
      await act(async () => { jest.advanceTimersByTime(1500); });
      await act(async () => { r.unmount(); });
      mounted.pop();
    }
    expect(mockBackendCalls).toEqual([]);
    // seule la persistance des préférences d'affichage peut réécrire sa clé (inchangée) : aucune autre écriture
    expect([...new Set(setItem.mock.calls.map((c) => c[0]))].filter((k) => k !== 'toietmoi.ui')).toEqual([]);
    expect(JSON.stringify(useUiStore.getState())).toBe(before);
  });
});

describe('aperçu : un geste, son résultat', () => {
  it('mouvement complet : le doigt joue le geste puis le résultat apparaît (biberon 480 → 600 ml)', async () => {
    const r = await render(<ToolDemo tool={DISCOVER_BY_KEY.baby_bottle} />);
    expect(byTestId(r, 'demo-finger').length).toBe(1);
    const value = () => byTestId(r, 'demo-value')[0];
    expect(value()).toBeTruthy();
    await act(async () => { jest.advanceTimersByTime(gestureDuration('full') + 900); });
    expect(byTestId(r, 'demo-finger').length).toBe(0);
    expect(texts(r)).toContain(tr('kn.c.bottle.count', { count: 5 }));
  });
  it('geste réel : toucher interrompt le doigt et applique le résultat tout de suite', async () => {
    const onApplied = jest.fn();
    const r = await render(<ToolDemo tool={DISCOVER_BY_KEY.family_missions} onApplied={onApplied} />);
    await pressTarget(r);
    expect(onApplied).toHaveBeenCalledTimes(1);
    expect(texts(r)).toContain(tr('kn.c.missions.accepted'));
    await act(async () => { jest.advanceTimersByTime(3000); });
    expect(onApplied).toHaveBeenCalledTimes(1);
  });
  it('« Rejouer » remet l’état initial puis rejoue', async () => {
    const onApplied = jest.fn();
    const r = await render(<ToolDemo tool={DISCOVER_BY_KEY.family_tasks} token={0} onApplied={onApplied} />);
    await act(async () => { jest.advanceTimersByTime(gestureDuration('full') + 200); });
    expect(onApplied).toHaveBeenCalledTimes(1);
    await act(async () => { r.update(<GestureHandlerRootView><ThemeProvider><ToolDemo tool={DISCOVER_BY_KEY.family_tasks} token={1} onApplied={onApplied} /></ThemeProvider></GestureHandlerRootView>); });
    expect(byTestId(r, 'demo-finger').length).toBe(1);
    await act(async () => { jest.advanceTimersByTime(gestureDuration('full') + 200); });
    expect(onApplied).toHaveBeenCalledTimes(2);
  });
});

describe('Réduire les animations', () => {
  beforeEach(() => { jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true); });
  it('démo : état final affiché d’emblée, aucun doigt ; légende geste / résultat toujours là', async () => {
    const r = await render(<ToolDemo tool={DISCOVER_BY_KEY.family_stocks} />);
    await act(async () => { jest.advanceTimersByTime(16); });
    expect(byTestId(r, 'demo-finger').length).toBe(0);
    expect(texts(r)).toContain(tr('kn.c.stock.added'));
    expect(texts(r)).toContain(describeDemo(DISCOVER_BY_KEY.family_stocks).result);
  });
  it('« Rejouer » : état initial, consigne affichée, le geste de la personne applique le résultat', async () => {
    const r = await render(<ToolDemo tool={DISCOVER_BY_KEY.reminders} token={0} />);
    await act(async () => { jest.advanceTimersByTime(16); });
    await act(async () => { r.update(<GestureHandlerRootView><ThemeProvider><ToolDemo tool={DISCOVER_BY_KEY.reminders} token={1} /></ThemeProvider></GestureHandlerRootView>); });
    expect(byTestId(r, 'demo-wait-hint').length).toBe(1);
    expect(byTestId(r, 'demo-target-hint').length).toBe(1);
    expect(byTestId(r, 'demo-finger').length).toBe(0);
    await pressTarget(r);
    expect(byTestId(r, 'demo-wait-hint').length).toBe(0);
  });
  it('présentation : ouverture complète d’emblée, chapitres et fin accessibles par les boutons', async () => {
    const onExit = jest.fn();
    const onCatalog = jest.fn();
    const r = await render(<DiscoverKeynote onExit={onExit} onCatalog={onCatalog} onOpenTool={jest.fn()} />);
    await act(async () => { jest.advanceTimersByTime(16); });
    const press = async (id: string) => { const b = r.root.findAll((n) => n.props.testID === id && typeof n.props.onPress === 'function')[0]; expect(b).toBeTruthy(); await act(async () => { b.props.onPress(); }); };
    for (let i = 0; i < LAST_STEP; i++) await press('discover-next');
    expect(byTestId(r, 'discover-end').length).toBe(1);
    expect(texts(r)).toContain(tr('kn.end.line'));
    await press('discover-prev');
    expect(byTestId(r, 'discover-chapter-more').length).toBe(1);
    await press('discover-catalog');
    expect(onCatalog).toHaveBeenCalledTimes(1);
    await press('discover-skip');
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe('enchaînement', () => {
  it('sortie : première ouverture → dernière scène de l’introduction ; relance → retour à Réglages', () => {
    expect(discoverExit({ replay: false, session: false, introSeen: false, canGoBack: false })).toEqual({ kind: 'replace', href: '/intro?scene=start' });
    expect(discoverExit({ replay: false, session: false, introSeen: true, canGoBack: false })).toEqual({ kind: 'replace', href: '/welcome' });
    expect(discoverExit({ replay: false, session: true, introSeen: true, canGoBack: false })).toEqual({ kind: 'replace', href: '/' });
    expect(discoverExit({ replay: true, session: true, introSeen: true, canGoBack: true })).toEqual({ kind: 'dismissTo', href: '/settings' });
    expect(discoverExit({ replay: true, session: true, introSeen: true, canGoBack: false })).toEqual({ kind: 'replace', href: '/settings' });
  });
  it('geste horizontal : seuil 60 px ou lancer, bornes respectées, sens inversé en RTL', () => {
    expect(swipeStep(2, -80)).toBe(3);
    expect(swipeStep(2, 80)).toBe(1);
    expect(swipeStep(2, -20)).toBe(2);
    expect(swipeStep(2, -10, -900)).toBe(3);
    expect(swipeStep(0, 120)).toBe(0);
    expect(swipeStep(LAST_STEP, -120)).toBe(LAST_STEP);
    expect(swipeStep(2, -80, 0, true)).toBe(1);
  });
  it('la première ouverture mène à /discover (et /cinematic redirige)', () => {
    const launch = fs.readFileSync('src/app/index.tsx', 'utf8');
    expect(launch).toMatch(/!cinematicSeen\) return <Redirect href=\{'\/discover'/);
    expect(fs.readFileSync('src/app/cinematic.tsx', 'utf8')).toMatch(/\/discover\?replay=1/);
    expect(fs.readFileSync('src/app/settings/index.tsx', 'utf8')).toMatch(/\/discover\?replay=1/);
  });
});

describe('point d’injection du logotype', () => {
  afterEach(() => setDiscoverOpening(null));
  const openStage = async (r: ReactTestRenderer) => {
    // la scène d'ouverture attend la mesure de son cadre
    const stage = r.root.findAll((n) => n.props.testID === 'discover-stage' && typeof n.props.onLayout === 'function')[0];
    await act(async () => { stage.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 640 } } }); });
  };
  it('setDiscoverOpening branche HomiLogoAnimated (API stable : width, tone, still, onHousePanel / onLensPanel, onDone)', async () => {
    const seen: DiscoverLogoProps[] = [];
    function FakeHomiLogoAnimated(p: DiscoverLogoProps) {
      seen.push(p);
      return null;
    }
    setDiscoverOpening(FakeHomiLogoAnimated);
    expect(getDiscoverOpening()).toBe(FakeHomiLogoAnimated);
    const r = await render(<DiscoverKeynote onExit={jest.fn()} onCatalog={jest.fn()} onOpenTool={jest.fn()} />);
    await openStage(r);
    expect(seen.length).toBeGreaterThan(0);
    const p = seen[seen.length - 1];
    expect(p.width).toBeGreaterThan(80);
    expect(p.still).toBe(false);
    expect(p.tone).toBe('light');
    expect(typeof p.onHousePanel).toBe('function');
    expect(p.onLensPanel).toBe(p.onHousePanel);
    expect(typeof p.onDone).toBe('function');
    // aucune lentille : c'est la maison qui s'ouvre en premier panneau (texte annoncé)
    expect(tr('kn.open.a11y')).toMatch(/maison/);
    expect(tr('kn.open.a11y')).not.toMatch(/lentille/);
  });
  it('la maison qui s’ouvre (onHousePanel) lance le panneau et les scènes sans attendre', async () => {
    let house: DiscoverLogoProps['onHousePanel'];
    function FakeHomiLogoAnimated(p: DiscoverLogoProps) { house = p.onHousePanel; return null; }
    setDiscoverOpening(FakeHomiLogoAnimated);
    const r = await render(<DiscoverKeynote onExit={jest.fn()} onCatalog={jest.fn()} onOpenTool={jest.fn()} />);
    await openStage(r);
    await act(async () => { house!({ x: 150, y: 200, width: 90, height: 90 }, null); });
    await act(async () => { jest.advanceTimersByTime(OPENING.total - OPENING.handoffAt + 100); });
    expect(texts(r)).toContain(tr('kn.open.home.value'));
  });
  it('ouverture provisoire : la maison existante (BrandLogo), sans logo injecté', async () => {
    const r = await render(<DiscoverKeynote onExit={jest.fn()} onCatalog={jest.fn()} onOpenTool={jest.fn()} />);
    await openStage(r);
    expect(getDiscoverOpening()).toBeNull();
    expect(byTestId(r, 'discover-logo').length).toBe(1);
  });
});
