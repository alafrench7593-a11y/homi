/**
 * « Découvrir HOMI » — textes localisés dérivés du modèle (purs, testés) : nom et phrase d'usage de chaque outil,
 * description « geste → résultat » de chaque démo (lue par les lecteurs d'écran et affichée avec Réduire les
 * animations), conditions d'accès. La phrase d'usage reprend le sous-titre existant de l'outil quand il existe.
 */
import { clockHM } from '@/i18n/formats';
import { formatDate, formatList, formatNumber, t as tr, tMaybe, type TKey } from '@/i18n';
import { toolLabelKey, toolSubKey } from '@/lib/journeys/tools';
import type { ChapterKey, DemoSpec, DiscoverTool, JournalSet, TaskSet, ToolAccessInfo, Unit } from './model';

export const toolName = (key: string) => tr(toolLabelKey(key));

/** Phrase d'usage : sous-titre existant de l'outil, sinon phrase dédiée (`kn.use.<outil>`). */
export function usagePhrase(key: string): string {
  return tMaybe(toolSubKey(key)) || tMaybe(`kn.use.${key}`) || '';
}
/** Source de la phrase d'usage (CSV, tests). */
export const usageSource = (key: string): 'sous-titre' | 'phrase dédiée' | 'absente' =>
  tMaybe(toolSubKey(key)) ? 'sous-titre' : tMaybe(`kn.use.${key}`) ? 'phrase dédiée' : 'absente';

export const chapterTitle = (k: ChapterKey) => tr(`kn.ch.${k}.title` as TKey);
export const chapterLead = (k: ChapterKey) => tr(`kn.ch.${k}.lead` as TKey);
export const chapterExample = (k: ChapterKey) => tr(`kn.ch.${k}.example` as TKey);

const WORD_UNITS: Partial<Record<Unit, TKey>> = { days: 'kn.unit.days', moves: 'kn.unit.moves', changes: 'kn.unit.changes', teeth: 'kn.unit.teeth', scoops: 'kn.unit.scoops' };
const SYMBOL: Partial<Record<Unit, string>> = { ml: 'ml', kg: 'kg', cm: 'cm', degC: '°C', min: 'min', h: 'h', pct: '%' };

/** Unité affichée après un nombre (mot accordé ou symbole). */
export function unitLabel(u: Unit, count: number): string {
  const k = WORD_UNITS[u];
  return k ? tr(k, { count }) : SYMBOL[u] ?? '';
}
export function formatValue(n: number, u: Unit, decimals = 0): string {
  if (u === 'pct') return formatNumber(n / 100, { style: 'percent', maximumFractionDigits: decimals });
  const num = formatNumber(n, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${num} ${unitLabel(u, n)}`;
}

export const taskItem = (set: TaskSet, i: 1 | 2 | 3) => tr(`kn.set.tasks.${set}.${i}` as TKey);
export const journalItem = (set: JournalSet, i: 1 | 2 | 3) => tr(`kn.set.journal.${set}.${i}` as TKey);

/** Heure d'exemple « HH:MM » au format de la langue. */
export function demoTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return clockHM(h, m);
}
/** Jour d'exemple (aujourd'hui + n) au format court de la langue. */
export function demoDay(inDays: number, now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + inDays, 12);
  return formatDate(d, { weekday: 'long', day: 'numeric' });
}
export const demoDate = (inDays: number, now = new Date()) =>
  formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + inDays, 12), { day: 'numeric', month: 'long' });

/** Valeurs d'exemple des démos sur mesure (constantes, partagées entre l'aperçu et sa description). */
export const CUSTOM_SAMPLE = {
  bottle: { from: 480, step: 120, countFrom: 4, chips: [90, 120, 150] },
  sleep: { at: '20:30' },
  cycle: { dayFrom: 27, length: 28 },
  pregnancy: { from: { week: 23, cm: 28.5, g: 500 }, to: { week: 24, cm: 30, g: 600 } },
  stocks: { from: 1 },
} as const;

/** « Geste » et « résultat » de la démo d'un outil, dans la langue active. */
export function describeDemo(tool: Pick<DiscoverTool, 'key' | 'demo'>): { gesture: string; result: string } {
  const d: DemoSpec = tool.demo;
  const label = toolName(tool.key);
  switch (d.kind) {
    case 'entry': {
      const chip = d.chip ?? { value: d.to - d.from, unit: d.unit };
      return {
        gesture: tr('kn.k.entry.gesture', { chip: `+${formatValue(chip.value, chip.unit, d.chip ? 0 : d.decimals)}` }),
        result: tr('kn.k.entry.result', { label, from: formatValue(d.from, d.unit, d.decimals), to: formatValue(d.to, d.unit, d.decimals) }),
      };
    }
    case 'measure': return { gesture: tr('kn.k.measure.gesture'), result: tr('kn.k.measure.result', { value: formatValue(d.next, d.unit, d.decimals) }) };
    case 'timer': return { gesture: tr('kn.k.timer.gesture'), result: tr('kn.k.timer.result', { min: d.minutes }) };
    case 'tasks': return { gesture: tr('kn.k.tasks.gesture', { item: taskItem(d.set, 1) }), result: tr('kn.k.tasks.result', { done: 1, total: 3 }) };
    case 'journal': return { gesture: tr('kn.k.journal.gesture', { item: journalItem(d.set, 1) }), result: tr('kn.k.journal.result', { item: journalItem(d.set, 1) }) };
    case 'scan': return { gesture: tr('kn.k.scan.gesture'), result: tr('kn.k.scan.result', { verdict: tr(`kn.k.scan.v.${d.set}.${d.verdict}` as TKey) }) };
    case 'read': return d.video ? { gesture: tr('kn.k.read.vgesture'), result: tr('kn.k.read.vresult') } : { gesture: tr('kn.k.read.gesture'), result: tr('kn.k.read.result') };
    case 'plan': {
      const day = demoDay(d.inDays);
      return { gesture: tr('kn.k.plan.gesture', { day }), result: tr('kn.k.plan.result', { event: tr(`kn.k.plan.${d.set}` as TKey), day, time: demoTime(d.time) }) };
    }
    case 'remind': return { gesture: tr('kn.k.remind.gesture'), result: tr('kn.k.remind.result', { time: demoTime(d.time) }) };
    case 'ask': return d.set === 'community'
      ? { gesture: tr('kn.k.ask.community.gesture'), result: tr('kn.k.ask.community.result') }
      : { gesture: tr('kn.k.ask.gesture'), result: tr('kn.k.ask.result') };
    case 'help': return { gesture: tr('kn.k.help.gesture'), result: tr('kn.k.help.result') };
    case 'setting': return d.set === 'date'
      ? { gesture: tr('kn.k.setting.dateGesture'), result: tr('kn.k.setting.dateResult', { from: demoDate(120), to: demoDate(127) }) }
      : { gesture: tr('kn.k.setting.gesture'), result: tr('kn.k.setting.result') };
    case 'custom':
      switch (d.demo) {
        case 'missions': return { gesture: tr('kn.c.missions.gesture'), result: tr('kn.c.missions.result') };
        case 'bottle': return { gesture: tr('kn.c.bottle.gesture'), result: tr('kn.c.bottle.result') };
        case 'sleep': return { gesture: tr('kn.c.sleep.gesture'), result: tr('kn.c.sleep.result', { time: demoTime(CUSTOM_SAMPLE.sleep.at) }) };
        case 'mood': return { gesture: tr('kn.c.mood.gesture'), result: tr('kn.c.mood.result') };
        case 'scanner': return { gesture: tr('kn.c.scanner.gesture'), result: tr('kn.c.scanner.result') };
        case 'cycle': return { gesture: tr('kn.c.cycle.gesture'), result: tr('kn.c.cycle.result') };
        case 'pregnancy': return { gesture: tr('kn.c.preg.gesture'), result: tr('kn.c.preg.result') };
        case 'shopping': return { gesture: tr('kn.c.shop.gesture'), result: tr('kn.c.shop.result') };
        case 'stocks': return { gesture: tr('kn.c.stock.gesture'), result: tr('kn.c.stock.result') };
      }
  }
}

/** Lignes « Accès » d'un outil (source : src/lib/premium/access.ts). */
export function accessLines(a: ToolAccessInfo): string[] {
  const out = [a.free ? tr('kn.acc.free') : tr('kn.acc.premium')];
  if (a.ai) out.push(tr('kn.acc.ai'));
  if (a.caregiver) out.push(tr('kn.acc.caregiver'));
  if (a.legacy) out.push(tr('kn.acc.legacy'));
  if (a.scopes.length) out.push(tr('kn.acc.scopes', { list: formatList(a.scopes.map((s) => tr(`kn.scope.${s}` as TKey))) }));
  return out;
}
