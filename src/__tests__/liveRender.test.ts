/**
 * Live Activities : rendu de CHAQUE type dans le VRAI moteur de l'extension iOS.
 *  - la vue est compilée comme pour l'iPhone (babel-preset-expo, appelant Metro / iOS : plugin « widget » d'expo-widgets) ;
 *  - la chaîne obtenue est évaluée dans un contexte isolé avec ExpoWidgets.bundle (le moteur réellement embarqué,
 *    construit par node_modules/expo-widgets/scripts/build-bundle.mjs s'il manque) puis rendue par __expoWidgetRender ;
 *  - chaque région (bannière, Dynamic Island compacte, minimale, déployée) × clair / sombre × à jour / périmé ;
 *  - aucun type de nœud non géré par DynamicView.swift (sinon vue VIDE en production), aucun « slot », aucun
 *    modificateur inconnu du registre natif, aucun texte « undefined » / « NaN ».
 */
import { bottleLive, breastLive, contractionsLive, pumpLive, relayLive, sleepLive, type LiveCtx } from '@/live/model';
import type { LiveProps } from '@/live/types';

declare const __dirname: string;
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; existsSync(p: string): boolean; readdirSync(p: string): string[]; statSync(p: string): { isDirectory(): boolean } };
const vm = require('vm') as { createContext(o: object): object; runInContext(code: string, ctx: object): unknown };
const babel = require('@babel/core') as { transformFileSync(f: string, o: object): { code: string } };
const cp = require('child_process') as { execSync(c: string, o: object): unknown };
/* eslint-enable @typescript-eslint/no-require-imports */

const ROOT = `${__dirname}/../..`;
const BUNDLE = `${ROOT}/node_modules/expo-widgets/bundle/build/ExpoWidgets.bundle`;
const HANDLED = new Set(['TextView', 'HStackView', 'VStackView', 'ZStackView', 'RectangleView', 'RoundedRectangleView', 'CapsuleView', 'CircleView', 'ImageView', 'AccessoryWidgetBackgroundView', 'DividerView', 'EllipseView', 'LabelView', 'ProgressView', 'SpacerView', 'UnevenRoundedRectangleView', 'GaugeView', 'ChartView', 'Button', 'react.fragment', 'LinkView']);
const REGIONS = ['banner', 'compactLeading', 'compactTrailing', 'minimal', 'expandedLeading', 'expandedTrailing', 'expandedBottom'];

/** Modificateurs réellement enregistrés côté natif (@expo/ui + expo-widgets), plus ceux propres à Image. */
function nativeModifiers(): Set<string> {
  const out = new Set<string>(['resizable', 'widgetAccentedRenderingMode']);
  const scan = (dir: string) => {
    for (const f of fs.readdirSync(dir)) {
      const p = `${dir}/${f}`;
      if (fs.statSync(p).isDirectory()) scan(p);
      else if (f.endsWith('.swift')) for (const m of fs.readFileSync(p, 'utf8').matchAll(/register\("([A-Za-z]+)"/g)) out.add(m[1]);
    }
  };
  scan(`${ROOT}/node_modules/@expo/ui/ios`);
  scan(`${ROOT}/node_modules/expo-widgets/ios`);
  return out;
}

/** Chaînes passées à createLiveActivity, compilées exactement comme dans le bundle iOS de l'app. */
function compiledLayouts(): Record<string, string> {
  const file = `${ROOT}/src/live/LiveActivities.tsx`;
  const { code } = babel.transformFileSync(file, {
    cwd: ROOT, filename: file, babelrc: false, configFile: false, presets: ['babel-preset-expo'],
    caller: { name: 'metro', platform: 'ios', bundler: 'metro', isDev: false, supportsStaticESM: false },
  });
  const layouts: Record<string, string> = {};
  const fakeRequire = (m: string) => (m === 'expo-widgets'
    ? { createLiveActivity: (name: string, layout: string) => { layouts[name] = layout; return {}; } }
    : new Proxy({}, { get: () => () => ({}) }));
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', code)(fakeRequire, mod, mod.exports);
  return layouts;
}

type Node = { type?: string; props?: Record<string, unknown> };
function walk(n: unknown, visit: (n: Node) => void) {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) { n.forEach((c) => walk(c, visit)); return; }
  const node = n as Node;
  if (node.type) visit(node);
  walk(node.props?.children, visit);
}

const NOW = new Date(2026, 10, 27, 14, 0, 0);
const T = NOW.getTime();
const iso = (minAgo: number) => new Date(T - minAgo * 60_000).toISOString();
const ctx = (o: Partial<LiveCtx> = {}): LiveCtx => ({ now: NOW, discreet: false, detailed: false, logo: 'file:///shared/homi-logo-v1.png', url: (p) => `homi://${p.replace(/^\//, '')}`, ...o });
const child = { id: 'c1', first_name: 'Lina' };

function samples(): Record<string, LiveProps[]> {
  const ctr = [
    { id: 'a', session_id: 's', started_at: iso(12), ended_at: iso(11) },
    { id: 'b', session_id: 's', started_at: iso(6), ended_at: iso(5) },
    { id: 'c', session_id: 's', started_at: iso(0.5), ended_at: null },
  ];
  const all = (fns: (() => { props: LiveProps } | null)[]) => fns.map((f) => f()).filter(Boolean).map((s) => s!.props);
  return {
    HomiBreastLive: all([
      () => breastLive({ id: 'f', child_id: 'c1', started_at: iso(9), ended_at: null, side: 'left', segments: [{ side: 'left', from: iso(9), to: null }] } as never, child, ctx()),
      () => breastLive({ id: 'f', child_id: 'c1', started_at: iso(9), ended_at: null, side: 'both', segments: null } as never, child, ctx({ discreet: true, logo: '' })),
    ]),
    HomiBottleLive: all([
      () => bottleLive({ id: 'b', started_at: iso(10), paused_at: null, paused_seconds: 0, prepared_ml: 120 }, child, ctx()),
      () => bottleLive({ id: 'b', started_at: iso(10), paused_at: iso(2), paused_seconds: 60, prepared_ml: null }, child, ctx({ discreet: true })),
    ]),
    HomiSleepLive: all([() => sleepLive([{ id: 's', started_at: iso(40), ended_at: null, kind: 'nap' }], child, ctx()), () => sleepLive([{ id: 'n', started_at: iso(300), ended_at: null, kind: 'night' }], child, ctx({ logo: '' }))]),
    HomiContractionsLive: all([() => contractionsLive(ctr, ctx()), () => contractionsLive(ctr.slice(0, 2), ctx({ detailed: true }))]),
    HomiPumpLive: all([() => pumpLive({ childId: 'c1', since: T - 7 * 60_000 }, child, ctx())]),
    HomiRelayLive: all([
      () => relayLive([{ id: 'r', kind: 'night', user_id: 'u2', starts_at: iso(120), ends_at: new Date(T + 240 * 60_000).toISOString() }], () => ({ isMe: false, name: 'Sam' }), ctx()),
      () => relayLive([{ id: 'r', kind: 'night', user_id: 'u1', starts_at: iso(120), ends_at: new Date(T + 1000).toISOString() }], () => ({ isMe: true, name: 'Moi' }), ctx()),
    ]),
  };
}

describe('Live Activities dans le vrai moteur expo-widgets', () => {
  beforeAll(() => {
    if (!fs.existsSync(BUNDLE)) cp.execSync(`node node_modules/expo-widgets/scripts/build-bundle.mjs ${JSON.stringify(ROOT)}`, { cwd: ROOT, stdio: 'ignore', timeout: 600_000 });
  }, 620_000);

  const layouts = compiledLayouts();
  const MODS = nativeModifiers();
  const SAMPLES = samples();

  it('six types, chacun compilé en chaîne autonome (aucune importation, aucun slot)', () => {
    expect(Object.keys(layouts).sort()).toEqual(['HomiBottleLive', 'HomiBreastLive', 'HomiContractionsLive', 'HomiPumpLive', 'HomiRelayLive', 'HomiSleepLive']);
    for (const l of Object.values(layouts)) {
      expect(typeof l).toBe('string');
      expect(l).not.toMatch(/require\(|_swiftUi|_modifiers|_interopRequire|currentValueLabel|minimumValueLabel|maximumValueLabel/);
    }
    for (const [name, list] of Object.entries(SAMPLES)) expect(list.length).toBeGreaterThan(0), expect(name).toBeTruthy();
  });

  for (const name of ['HomiBreastLive', 'HomiBottleLive', 'HomiSleepLive', 'HomiContractionsLive', 'HomiPumpLive', 'HomiRelayLive']) {
    it(`${name} : toutes les régions, clair / sombre, à jour / périmé`, () => {
      const engine = vm.createContext({ console }) as Record<string, unknown>;
      vm.runInContext(fs.readFileSync(BUNDLE, 'utf8'), engine);
      engine.__layout = layouts[name];
      // Comme WidgetsJSRuntime.swift : la chaîne est évaluée telle quelle « (layout) »
      vm.runInContext('globalThis.__expoWidgetLayout = eval("(" + __layout + ")")', engine);
      for (const props of SAMPLES[name]) {
        for (const colorScheme of ['light', 'dark']) {
          for (const isStale of [false, true]) {
            engine.__p = JSON.parse(JSON.stringify(props)); // les props traversent ActivityKit en JSON
            engine.__e = { colorScheme, isStale, isLuminanceReduced: false, isActivityFullscreen: false };
            const out = JSON.parse(vm.runInContext('JSON.stringify(__expoWidgetRender(__p, __e))', engine) as string) as Record<string, unknown>;
            for (const region of REGIONS) {
              expect(out[region]).toBeTruthy();
              let texts = 0;
              walk(out[region], (n) => {
                expect(HANDLED.has(n.type as string)).toBe(true);
                for (const m of (n.props?.modifiers as { $type: string }[] | undefined) ?? []) expect(MODS.has(m.$type) ? m.$type : `inconnu:${m.$type}`).toBe(m.$type);
                if (n.type === 'TextView') {
                  texts++;
                  const p = n.props ?? {};
                  if (typeof p.text === 'string') expect(p.text).not.toMatch(/undefined|NaN|\[object|^lv\./);
                  else expect(p.date != null || p.timerInterval != null).toBe(true);
                  const ti = p.timerInterval as { lower: number; upper: number } | undefined;
                  if (ti) expect(Number(ti.lower)).toBeLessThanOrEqual(Number(ti.upper));
                  if (p.date != null) expect(Number.isFinite(Number(p.date))).toBe(true);
                }
                if (n.type === 'ImageView' || n.type === 'CircleView') texts++;
                if (n.type === 'ImageView') expect(String(n.props?.uiImage)).toMatch(/^file:\/\//);
              });
              expect(texts).toBeGreaterThan(0); // jamais une région vide
            }
            // Bannière : fond adapté au thème, contenu de santé masqué iPhone verrouillé
            expect(JSON.stringify(out.banner)).toContain('activityBackgroundTint');
            if (props.sens) expect(JSON.stringify(out.banner)).toContain('privacySensitive');
            if (props.who) expect(JSON.stringify(out.banner)).toContain('privacySensitive');
          }
        }
      }
    });
  }
});
