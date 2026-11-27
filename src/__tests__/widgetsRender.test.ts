/**
 * Widgets iOS : exécute la vue COMPILÉE de chaque widget (chaîne produite par le plugin Babel d'expo-widgets, la même
 * que le moteur JavaScript du widget évalue sur l'iPhone) avec un moteur simulé, dans toutes les tailles, en clair et
 * en sombre, en couleur et en mode teinté, pour tous les états (données, vide, déconnecté, protégé).
 * Garantit : aucune référence à une variable extérieure (interdite dans un widget), aucun composant ou modificateur
 * absent d'@expo/ui, un fond de conteneur (exigé par iOS 17+) et un lien d'ouverture sur chaque rendu d'écran d'accueil.
 */
import { babyEntries, cycleEntries, planningEntries, pregnancyEntries, sleepEntries, tasksEntries, WIDGET_NAMES } from '@/widgets/model';

declare const __dirname: string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; readdirSync(p: string): string[]; existsSync(p: string): boolean };
const UI = __dirname + '/../../node_modules/@expo/ui/build/swift-ui';

jest.mock('expo-widgets', () => ({ createWidget: (name: string, layout: string) => ({ name, layout }) }));

/** Noms réellement exportés par @expo/ui (composants SwiftUI et modificateurs) : ceux que le moteur du widget expose. */
function exportedNames(): Set<string> {
  const names = new Set<string>();
  const scan = (file: string) => { for (const m of fs.readFileSync(file, 'utf8').matchAll(/export declare (?:function|const) (\w+)/g)) names.add(m[1]); };
  for (const dir of fs.readdirSync(UI)) if (fs.existsSync(`${UI}/${dir}/index.d.ts`)) scan(`${UI}/${dir}/index.d.ts`);
  for (const f of fs.readdirSync(`${UI}/modifiers`)) if (f.endsWith('.d.ts')) scan(`${UI}/modifiers/${f}`);
  scan(`${UI}/modifiers/shapes/index.d.ts`);
  return names;
}
const EXPORTED = exportedNames();
const USED = ['Link', 'background', 'padding', 'shapes', 'Image', 'resizable', 'cornerRadius', 'Chart', 'Gauge', 'HStack', 'VStack', 'Spacer', 'Text', 'ProgressView', 'containerBackground', 'font', 'foregroundStyle', 'frame', 'gaugeStyle', 'lineLimit', 'minimumScaleFactor', 'monospacedDigit', 'privacySensitive', 'tint', 'widgetURL'];

type Node = { type: string; props: Record<string, unknown> };
function engine(layout: string) {
  const comp = (type: string) => (props: Record<string, unknown>) => ({ type, props });
  const mod = (m: string) => (...a: unknown[]) => ({ m, a });
  const jsx = (type: unknown, props: Record<string, unknown>) => (typeof type === 'function' ? type(props) : { type, props });
  const scope: Record<string, unknown> = { _jsx: jsx, _jsxs: jsx, jsx, jsxs: jsx, _Fragment: 'Fragment', Fragment: 'Fragment' };
  for (const n of USED) scope[n] = /^[A-Z]/.test(n) ? comp(n) : mod(n);
  const keys = Object.keys(scope);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...keys, `"use strict"; return (${layout});`)(...keys.map((k) => scope[k])) as (p: unknown, e: unknown) => Node;
  return fn;
}
function walk(n: unknown, visit: (n: Node) => void) {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) { n.forEach((c) => walk(c, visit)); return; }
  const node = n as Node;
  if (node.type) visit(node);
  for (const v of Object.values(node.props ?? {})) walk(v, visit);
}

const NOW = new Date(2026, 10, 27, 14, 0, 0);
const at = (d: number, h: number) => new Date(2026, 10, d, h, 0, 0).toISOString();
const base = { title: 'Titre', msg: 'Message', url: 'homi://x' };
const letter = (d: Date) => String(d.getDate());
const L = new Proxy({}, { get: (_t, k) => String(k) }) as never;

const SAMPLES: Record<string, unknown[]> = {
  BabyWidget: [
    babyEntries({ childName: 'Lina', otherChildren: 1, bottles: [{ at: at(27, 11), consumed_ml: 120, prepared_ml: 120 }], lastBottle: { at: at(27, 11), consumed_ml: 120, prepared_ml: 120 }, nextBottleAt: at(27, 17), lastFeed: { startedAt: at(27, 13), ongoing: true, side: 'left', minutes: 20 } }, base, { now: NOW, discreet: false, dayLetter: letter, side: (s) => s, more: (n) => `+${n}`, fallbackName: 'Bébé' }, L)[0].props,
    babyEntries(null, base, { now: NOW, discreet: true, dayLetter: letter, side: (s) => s, more: (n) => `+${n}`, fallbackName: 'Bébé' }, L)[0].props,
  ],
  SleepWidget: [
    sleepEntries({ childName: 'Noé', otherChildren: 0, sleeps: [{ started_at: at(27, 13), ended_at: null }, { started_at: at(26, 9), ended_at: at(26, 11) }] }, base, { now: NOW, discreet: false, dayLetter: letter, more: (n) => `+${n}`, fallbackName: 'Bébé' }, L)[0].props,
  ],
  CycleWidget: [
    cycleEntries({ periods: [{ start_date: '2026-11-15' }], nextPeriod: '2026-12-13', averageLength: 28, fertileWindow: { start: '2026-11-25', end: '2026-11-30' }, cycleDayOn: () => 13, pill: { active: true, takenToday: false }, hidden: false }, base, { now: NOW, detailed: false }, L)[0].props,
    cycleEntries({ periods: [], nextPeriod: null, averageLength: null, fertileWindow: null, cycleDayOn: () => 3, pill: null, hidden: true }, base, { now: NOW, detailed: true }, L)[0].props,
  ],
  PregnancyWidget: [
    pregnancyEntries({ dueDate: '2027-03-08', progressOn: () => ({ weeksSA: 25, extraDays: 3, trimester: 2, daysToDue: 101, progress: 0.64 }), nextAppt: { at: at(28, 9), title: 'Écho' } }, base, { now: NOW, detailed: true }, L)[0].props,
  ],
  TasksWidget: [
    tasksEntries([{ id: '1', title: 'Cantine', status: 'todo', due_at: at(26, 9), done_at: null, assignee_id: 'me' }, { id: '2', title: 'Couches', status: 'done', due_at: null, done_at: at(27, 9), assignee_id: null }], base, { now: NOW, me: 'me', discreet: false, dayLetter: letter }, L)[0].props,
  ],
  PlanningWidget: [
    planningEntries([{ id: 'a', title: 'Pédiatre', starts_at: at(27, 16), location_label: 'Cabinet' }, { id: 'b', title: 'Crèche', starts_at: at(29, 9), location_label: null }], base, { now: NOW, discreet: false }, L)[0].props,
  ],
};
const FAMILIES = ['systemSmall', 'systemMedium', 'systemLarge', 'accessoryRectangular'];

describe('vues compilées des widgets', () => {
  it('n’utilisent que des composants et modificateurs exportés par @expo/ui', () => {
    for (const n of USED) expect(EXPORTED.has(n)).toBe(true);
  });

  for (const name of WIDGET_NAMES) {
    it(`${name} : se rend dans toutes les tailles et tous les états`, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const layout = (require(`@/widgets/${name}`) as { default: { layout: unknown } }).default.layout;
      expect(typeof layout).toBe('string');
      // Aucune importation résiduelle : le moteur du widget n'a que les globales d'@expo/ui
      expect(layout as string).not.toMatch(/require\(|_swiftUi|_modifiers|_interopRequire/);
      // Les « slots » (currentValueLabel…) ne sont pas dessinés par le moteur des widgets en production
      expect(layout as string).not.toMatch(/currentValueLabel|minimumValueLabel|maximumValueLabel/);
      const render = engine(layout as string);
      const states = [...(SAMPLES[name] ?? []), { ...base, s: 'out' }, { ...base, s: 'empty' }];
      for (const props of states) {
        for (const widgetFamily of FAMILIES) {
          for (const colorScheme of ['light', 'dark']) {
            for (const widgetRenderingMode of ['fullColor', 'accented']) {
              const tree = render(props, { widgetFamily, colorScheme, widgetRenderingMode, date: NOW });
              expect(tree && typeof tree).toBe('object');
              const mods: string[] = [];
              let texts = 0;
              walk(tree, (n) => {
                if (n.type === 'Text') texts++;
                for (const m of (n.props.modifiers as { m: string }[] | undefined) ?? []) mods.push(m.m);
                if (n.type === 'Text' && typeof n.props.children === 'string') expect(n.props.children).not.toMatch(/undefined|NaN|\[object/);
              });
              expect(texts).toBeGreaterThan(0);
              expect(mods).toContain('widgetURL');
              if (widgetFamily.startsWith('system')) expect(mods).toContain('containerBackground');
            }
          }
        }
      }
    });
  }
});
