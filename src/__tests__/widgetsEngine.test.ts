/**
 * Widgets iOS : rendu de CHAQUE vue dans le VRAI moteur d'expo-widgets (ExpoWidgets.bundle, le même script que
 * l'extension évalue dans son JSContext sur l'iPhone), évalué ici dans une machine virtuelle Node.
 * Pour chaque vue : 4 formats × clair/sombre × couleur/teinté/vibrant × états (données, discret, vide, déconnecté,
 * protégé…). Vérifie : aucune erreur JavaScript (en production elle donnerait un widget VIDE), uniquement des types de
 * nœuds dessinés par ios/Widgets/DynamicView.swift (un type inconnu = vue vide), aucun « slot » (non dessiné), images
 * limitées aux fichiers du dossier partagé, fond de conteneur et lien sur chaque rendu d'écran d'accueil, chaque texte
 * limité en lignes ET réductible (jamais coupé net), aucun « undefined », « NaN » ni nombre non fini.
 *
 * Le moteur est construit par `node node_modules/expo-widgets/scripts/build-bundle.mjs .` (aussi lancé par Xcode à
 * chaque build). S'il n'est pas construit, ce fichier est ignoré, sauf si WIDGETS_ENGINE_REQUIRED=1 (échec explicite).
 */
import { auraEntries, babyEntries, cycleEntries, healthEntries, planningEntries, pregnancyEntries, relayEntries, signedOut, sleepEntries, storyEntries, tasksEntries, WIDGET_NAMES } from '@/widgets/model';

declare const __dirname: string;
declare const process: { env: Record<string, string | undefined> };
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string; existsSync(p: string): boolean };
const vm = require('vm') as { createContext(o: object): object; runInContext(code: string, ctx: object): unknown };
/* eslint-enable @typescript-eslint/no-require-imports */

jest.mock('expo-widgets', () => ({ createWidget: (name: string, layout: string) => ({ name, layout }) }));

const BUNDLE = __dirname + '/../../node_modules/expo-widgets/bundle/build/ExpoWidgets.bundle';
const HAS = fs.existsSync(BUNDLE);
/** Types de nœuds dessinés par ios/Widgets/DynamicView.swift (expo-widgets 57) ; tout autre type = vue vide en production. */
const NATIVE = new Set(['TextView', 'HStackView', 'VStackView', 'ZStackView', 'RectangleView', 'RoundedRectangleView', 'CapsuleView', 'CircleView', 'ImageView',
  'AccessoryWidgetBackgroundView', 'DividerView', 'EllipseView', 'LabelView', 'ProgressView', 'SpacerView', 'UnevenRoundedRectangleView', 'GaugeView', 'ChartView',
  'Button', 'react.fragment', 'LinkView']);

const NOW = new Date(2026, 10, 27, 14, 0, 0);
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m, 0).toISOString();
const base = { title: 'Titre du widget', msg: 'Message assez long pour tenir sur plusieurs lignes sans être coupé net', url: 'homi://x', logo: 'file:///shared/homi-logo-v1.png', actions: [{ t: '+ Biberon', u: 'homi://a' }, { t: '+ Tétée', u: 'homi://b' }] };
const letter = (d: Date) => ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'][d.getDay()];
// Libellés : un vrai objet (les props traversent la frontière native en JSON), une valeur pour chaque clé possible
const L = Object.fromEntries(('lastBottle lastFeed today next ml min feeds week avg ongoing none asleep awake naps last h day nextDiscreet days fertile fertileSoon '
  + 'pill pillDone pillTodo weekDiscreet tri toDue toDueDiscreet appt apptDiscreet open done mine late noDue hidden in step ask prio now nobody until sent events '
  + 'other vaccine due dose doses allDone age memory thisWeek yearsAgo memories photo').split(' ').map((k) => [k, `«${k}»`])) as never;
const first = <T,>(e: { props: T }[]) => e[0].props;
const LONG = 'Rendez-vous chez la pédiatre pour le contrôle des neuf mois avec questions';

function samples(): Record<string, unknown[]> {
  const babyCtx = { now: NOW, discreet: false, dayLetter: letter, side: (s: string) => s, more: (n: number) => `+${n}`, fallbackName: 'Bébé' };
  const bottles = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ at: at(27 - d, 11), consumed_ml: 120 + d * 10, prepared_ml: 150 }));
  const sleepCtx = { now: NOW, discreet: false, dayLetter: letter, more: (n: number) => `+${n}`, fallbackName: 'Bébé' };
  const sleeps = [{ started_at: at(27, 13), ended_at: null }, ...[1, 2, 3, 4, 5, 6].map((d) => ({ started_at: at(27 - d, 13), ended_at: at(27 - d, 15) }))];
  const shifts = [{ user_id: 'me', starts_at: at(27, 13), ends_at: at(27, 22), status: 'planned' }, { user_id: 'p2', starts_at: at(27, 22), ends_at: at(28, 6), status: 'confirmed' }, { user_id: 'me', starts_at: at(28, 22), ends_at: at(29, 6), status: 'planned' }];
  const relayCtx = { now: NOW, discreet: false, you: 'Toi', coparent: 'Coparent', fallbackName: 'Bébé' };
  const healthIn = { childName: 'Maximilien-Alexandre', vaccine: { date: '2026-11-20', label: 'Diphtérie, tétanos, coqueluche', due: true }, appts: [{ at: at(29, 9), title: LONG }], doses: [{ at: at(27, 8), done: true }, { at: at(27, 20), done: false }] };
  const healthCtx = { now: NOW, discreet: false, detailed: true, fallbackName: 'Bébé' };
  const storyIn = { childName: 'Lina', birth: '2025-03-02', photo: { file: 'file:///shared/homi-story-abc.jpg', taken_on: '2026-11-20', caption: 'Premier jour à la crèche, très fière' }, pages: [{ date: '2025-11-25', title: 'Premier sourire', text: null }, { date: '2026-11-24', title: null, text: 'Au parc' }] };
  const storyCtx = { now: NOW, discreet: false, ageText: () => '1 an et 8 mois', yearsAgo: (n: number) => `il y a ${n} an`, fallbackName: 'Bébé' };
  const auraIn = { step: { title: 'Note une sieste ou une nuit : HOMI calcule la durée et la prochaine fenêtre d’éveil.', cta: 'Enregistrer un premier sommeil', href: 'homi://sleep/c' }, question: { text: 'Comment savoir s’il a assez dormi ?', href: 'homi://assistant' }, tasks: { late: 2, today: 1, href: 'homi://family' }, appts: [{ title: LONG, at: at(27, 17), href: 'homi://calendar' }], tools: [{ label: 'Biberons', why: 'Pour ton bébé de 3 mois', href: 'homi://bottle' }, { label: 'Sommeil', why: 'Siestes notées', href: 'homi://sleep' }] };
  const auraCtx = { now: NOW, discreet: false, lateN: (n: number) => `${n} en retard`, todayN: (n: number) => `${n} aujourd’hui`, askCta: 'Demander' };
  return {
    BabyWidget: [
      first(babyEntries({ childName: 'Maximilien-Alexandre', otherChildren: 2, bottles, lastBottle: bottles[0], nextBottleAt: at(27, 17), lastFeed: { startedAt: at(27, 13), ongoing: true, side: 'left', minutes: 20 } }, base, babyCtx, L)),
      first(babyEntries({ childName: 'Lina', otherChildren: 0, bottles: [], lastBottle: null, nextBottleAt: null, lastFeed: { startedAt: at(27, 9), ongoing: false, side: 'both', minutes: 14 } }, base, { ...babyCtx, discreet: true }, L)),
      first(babyEntries(null, base, babyCtx, L)),
    ],
    SleepWidget: [
      first(sleepEntries({ childName: 'Noé', otherChildren: 1, sleeps }, base, sleepCtx, L)),
      first(sleepEntries({ childName: 'Noé', otherChildren: 0, sleeps: [{ started_at: at(27, 9), ended_at: at(27, 10) }] }, base, { ...sleepCtx, discreet: true }, L)),
    ],
    CycleWidget: [
      first(cycleEntries({ periods: [{ start_date: '2026-11-15' }], nextPeriod: '2026-12-13', averageLength: 28, fertileWindow: { start: '2026-11-25', end: '2026-11-30' }, cycleDayOn: () => 13, pill: { active: true, takenToday: false }, hidden: false }, base, { now: NOW, detailed: true }, L)),
      first(cycleEntries({ periods: [{ start_date: '2026-11-15' }], nextPeriod: '2026-11-27', averageLength: 28, fertileWindow: null, cycleDayOn: () => 34, pill: { active: true, takenToday: true }, hidden: false }, base, { now: NOW, detailed: false }, L)),
      first(cycleEntries({ periods: [], nextPeriod: null, averageLength: null, fertileWindow: null, cycleDayOn: () => 3, pill: null, hidden: true }, base, { now: NOW, detailed: true }, L)),
    ],
    PregnancyWidget: [
      first(pregnancyEntries({ dueDate: '2027-03-08', progressOn: () => ({ weeksSA: 25, extraDays: 3, trimester: 2, daysToDue: 101, progress: 0.64 }), nextAppt: { at: at(28, 9), title: LONG } }, base, { now: NOW, detailed: true }, L)),
      first(pregnancyEntries({ dueDate: '2027-03-08', progressOn: () => ({ weeksSA: 25, extraDays: 0, trimester: 2, daysToDue: 101, progress: 0.64 }), nextAppt: null }, base, { now: NOW, detailed: false }, L)),
    ],
    TasksWidget: [
      first(tasksEntries([{ id: '1', title: LONG, status: 'todo', due_at: at(26, 9), done_at: null, assignee_id: 'me' }, { id: '2', title: 'Couches', status: 'done', due_at: null, done_at: at(27, 9), assignee_id: null }, { id: '3', title: 'Cantine', status: 'todo', due_at: null, done_at: null, assignee_id: null }], base, { now: NOW, me: 'me', discreet: false, dayLetter: letter }, L)),
    ],
    PlanningWidget: [
      first(planningEntries([{ id: 'a', title: LONG, starts_at: at(27, 16), location_label: 'Cabinet médical du centre-ville, 2e étage' }, { id: 'b', title: 'Crèche', starts_at: at(29, 9), location_label: null }, { id: 'c', title: 'Kiné', starts_at: at(30, 9), location_label: null }], base, { now: NOW, discreet: false }, L)),
    ],
    AuraWidget: [
      first(auraEntries(auraIn, base, auraCtx, L)),
      first(auraEntries({ ...auraIn, step: null }, base, { ...auraCtx, discreet: true }, L)),
      first(auraEntries({ step: null, question: null, tasks: { late: 1, today: 0, href: 'homi://family' }, appts: [], tools: [] }, base, auraCtx, L)),
    ],
    RelayWidget: [
      first(relayEntries({ shifts, me: 'me', nameOf: () => 'Jean-Baptiste', lastSent: { at: at(27, 7), count: 12 }, childName: 'Lina' }, base, relayCtx, L)),
      first(relayEntries({ shifts: shifts.slice(1), me: 'me', nameOf: () => 'Jean-Baptiste', lastSent: null, childName: 'Lina' }, base, { ...relayCtx, discreet: true }, L)),
      first(relayEntries({ shifts: [], me: 'me', nameOf: () => 'X', lastSent: { at: at(27, 7), count: 3 }, childName: null }, base, relayCtx, L)),
    ],
    HealthWidget: [
      first(healthEntries(healthIn, base, healthCtx, L)),
      first(healthEntries(healthIn, base, { ...healthCtx, detailed: false }, L)),
      first(healthEntries({ childName: null, vaccine: null, appts: [], doses: [{ at: at(27, 8), done: true }] }, base, healthCtx, L)),
    ],
    StoryWidget: [
      first(storyEntries(storyIn, base, storyCtx, L)),
      first(storyEntries({ ...storyIn, photo: null }, base, storyCtx, L)),
      first(storyEntries(storyIn, base, { ...storyCtx, discreet: true }, L)),
    ],
  };
}

type Node = { type?: string; props?: Record<string, unknown> & { modifiers?: { $type: string }[] } };
function walk(n: unknown, visit: (n: Node) => void) {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) { n.forEach((c) => walk(c, visit)); return; }
  const node = n as Node;
  if (node.type) visit(node);
  walk(node.props?.children, visit);
}

const FAMILIES = ['systemSmall', 'systemMedium', 'systemLarge', 'accessoryRectangular'];
const describeEngine = HAS ? describe : describe.skip;

it('le moteur des widgets est construit (ou le contrôle est explicitement facultatif)', () => {
  if (process.env.WIDGETS_ENGINE_REQUIRED === '1') expect(HAS).toBe(true);
  else expect(typeof HAS).toBe('boolean');
});

describeEngine('vues des widgets dans le vrai moteur expo-widgets', () => {
  const ctx = vm.createContext({ console: { log() {}, warn() {}, error() {} } });
  beforeAll(() => { vm.runInContext(fs.readFileSync(BUNDLE, 'utf8'), ctx); });
  const SAMPLES = samples();

  it('couvre les dix widgets', () => {
    expect(WIDGET_NAMES).toHaveLength(10);
    for (const name of WIDGET_NAMES) expect(SAMPLES[name]?.length).toBeGreaterThan(0);
  });

  for (const name of WIDGET_NAMES) {
    it(`${name} : tous formats, apparences et états`, () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const layout = (require(`@/widgets/${name}`) as { default: { layout: string } }).default.layout;
      vm.runInContext(`globalThis.__expoWidgetLayout = (${layout});`, ctx);
      const render = vm.runInContext('__expoWidgetRender', ctx) as (p: object, e: object) => unknown;
      const states = [...SAMPLES[name], first(signedOut(base, NOW)), { ...base, s: 'empty' }, { ...base, s: 'locked', actions: undefined }, { s: 'out', title: 'HOMI', url: 'homi://', msg: 'Connecte-toi' }];
      let renders = 0;
      for (const props of states) {
        for (const widgetFamily of FAMILIES) {
          for (const colorScheme of ['light', 'dark']) {
            for (const widgetRenderingMode of ['fullColor', 'accented', 'vibrant']) {
              const where = `${name} ${widgetFamily} ${colorScheme} ${widgetRenderingMode} s=${(props as { s: string }).s}`;
              let tree: unknown;
              try { tree = render(JSON.parse(JSON.stringify(props)), { widgetFamily, colorScheme, widgetRenderingMode, timestamp: NOW.getTime() }); } catch (e) { throw new Error(`${where} : ${String(e)}`); }
              expect(tree && typeof tree).toBe('object');
              const json = JSON.stringify(tree);
              const bad = json.search(/undefined|NaN|Infinity|\[object/);
              if (bad >= 0) throw new Error(`${where} : valeur invalide … ${json.slice(Math.max(0, bad - 200), bad + 60)}`);
              const rootMods = ((tree as Node).props?.modifiers ?? []).map((m) => m.$type);
              expect(rootMods).toContain('widgetURL');
              if (widgetFamily.startsWith('system')) expect(rootMods).toContain('containerBackground');
              let texts = 0;
              walk(tree, (n) => {
                if (!NATIVE.has(n.type!)) throw new Error(`${where} : type de nœud non dessiné « ${n.type} »`);
                const mods = (n.props?.modifiers ?? []).map((m) => m.$type);
                if (n.type === 'TextView') {
                  texts++;
                  if (!mods.includes('lineLimit') || !mods.includes('minimumScaleFactor')) throw new Error(`${where} : texte sans lineLimit + minimumScaleFactor ${JSON.stringify(n.props).slice(0, 200)}`);
                }
                if (n.type === 'ImageView') {
                  const img = n.props as { uiImage?: string; systemName?: string };
                  if (!img.systemName && !/^file:\/\//.test(img.uiImage ?? '')) throw new Error(`${where} : image hors du dossier partagé`);
                }
                for (const slot of ['currentValueLabel', 'minimumValueLabel', 'maximumValueLabel']) if (n.props && slot in n.props) throw new Error(`${where} : slot ${slot}`);
              });
              expect(texts).toBeGreaterThan(0);
              renders++;
            }
          }
        }
      }
      expect(renders).toBe(states.length * 24);
    });
  }

  it('données sensibles masquées quand l’iPhone est verrouillé (privacySensitive)', () => {
    const sens = (name: string, props: object, family = 'systemMedium') => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      vm.runInContext(`globalThis.__expoWidgetLayout = (${(require(`@/widgets/${name}`) as { default: { layout: string } }).default.layout});`, ctx);
      return JSON.stringify((vm.runInContext('__expoWidgetRender', ctx) as (p: object, e: object) => unknown)(JSON.parse(JSON.stringify(props)), { widgetFamily: family, colorScheme: 'light', widgetRenderingMode: 'fullColor', timestamp: NOW.getTime() }));
    };
    const S = SAMPLES;
    for (const [name, idx] of [['CycleWidget', 0], ['PregnancyWidget', 0], ['HealthWidget', 0], ['StoryWidget', 0], ['BabyWidget', 0]] as const) {
      expect(sens(name, S[name][idx] as object)).toContain('privacySensitive');
    }
    // Santé : jamais de nom de médicament (le modèle n'en reçoit aucun) ; en mode non détaillé, aucun nom de vaccin
    expect(sens('HealthWidget', S.HealthWidget[1] as object, 'systemLarge')).not.toMatch(/Diphtérie|pédiatre/);
    // Mon histoire en mode discret : ni photo ni prénom
    const discreetStory = sens('StoryWidget', S.StoryWidget[2] as object, 'systemLarge');
    expect(discreetStory).not.toMatch(/homi-story-|Lina|crèche/);
  });
});
