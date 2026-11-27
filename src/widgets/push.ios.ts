/**
 * Envoi du contenu aux widgets iOS (expo-widgets SDK 57, stockage partagé du groupe d'apps).
 * - Une frise d'entrées par widget (le système passe d'une entrée à l'autre sans réveiller l'app).
 * - Envoi seulement si le contenu a changé (pas de rechargement inutile : budget d'actualisation iOS).
 * - Sans module natif (Expo Go, build sans widget) : rien à faire, jamais d'erreur.
 * Aucun appel réseau ni IA ici : le widget n'affiche que ce que l'app a déjà chargé.
 */
import { t as tr, type TKey } from '@/i18n';
import { WIDGET_NAMES, type Entry, type WidgetName } from './model';
import { WIDGET_LOGO_PNG_BASE64 } from './logo';

/** Logo HOMI écrit une fois dans le dossier partagé app ↔ widgets ; son adresse est passée à chaque widget. */
let logoUri: string | null = null;
function logo(): string {
  if (logoUri !== null) return logoUri;
  logoUri = '';
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { widgetsDirectory } = require('expo-widgets') as typeof import('expo-widgets');
    const { File } = require('expo-file-system') as typeof import('expo-file-system');
    /* eslint-enable @typescript-eslint/no-require-imports */
    if (!widgetsDirectory) return logoUri;
    const f = new File(widgetsDirectory, 'homi-logo-v1.png');
    if (!f.exists) f.write(WIDGET_LOGO_PNG_BASE64, { encoding: 'base64' });
    logoUri = f.uri;
  } catch { /* pas de dossier partagé (Expo Go) : widgets sans logo */ }
  return logoUri;
}

type Updatable = { updateTimeline: (e: { date: Date; props: object }[]) => void; getTimeline: () => Promise<unknown[]> };
const last = new Map<WidgetName, string>();
/** Diagnostic (Réglages › Notifications › Widgets) : dernier envoi de chaque widget, ou l'erreur rencontrée. */
export type WidgetStatus = { at: number; state: string; error: string | null; stored: number | null };
const status = new Map<WidgetName, WidgetStatus>();
export async function widgetStatus(): Promise<Record<string, WidgetStatus>> {
  const out: Record<string, WidgetStatus> = {};
  for (const name of WIDGET_NAMES) {
    const s = status.get(name) ?? { at: 0, state: '', error: null, stored: null };
    let stored: number | null = null;
    try { const w = load(name); stored = w ? (await w.getTimeline()).length : null; } catch (e) { s.error = s.error ?? String((e as Error)?.message ?? e); }
    out[name] = { ...s, stored };
  }
  return out;
}
/** Renvoie tout de suite le contenu de chaque widget (efface la mémoire anti-doublon) et demande à iOS de les redessiner. */
const listeners = new Set<() => void>();
export function subscribeRefresh(cb: () => void): () => void { listeners.add(cb); return () => { listeners.delete(cb); }; }
export function refreshWidgets(): void {
  last.clear();
  for (const cb of listeners) cb();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('expo-widgets/build/ExpoWidgets') as { default?: { reloadAllWidgets?: () => void } }).default?.reloadAllWidgets?.();
  } catch { /* module absent */ }
}

function load(name: WidgetName): Updatable | null {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    switch (name) {
      case 'CycleWidget': return (require('./CycleWidget') as typeof import('./CycleWidget')).default as unknown as Updatable;
      case 'BabyWidget': return (require('./BabyWidget') as typeof import('./BabyWidget')).default as unknown as Updatable;
      case 'SleepWidget': return (require('./SleepWidget') as typeof import('./SleepWidget')).default as unknown as Updatable;
      case 'PregnancyWidget': return (require('./PregnancyWidget') as typeof import('./PregnancyWidget')).default as unknown as Updatable;
      case 'TasksWidget': return (require('./TasksWidget') as typeof import('./TasksWidget')).default as unknown as Updatable;
      case 'PlanningWidget': return (require('./PlanningWidget') as typeof import('./PlanningWidget')).default as unknown as Updatable;
    }
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch {
    return null;
  }
  return null;
}

export function pushWidget<P extends object>(name: WidgetName, entries: Entry<P>[]): boolean {
  if (!entries.length) return false;
  const lg = logo();
  entries = entries.map((e) => ({ ...e, props: { ...e.props, logo: lg } }));
  // La première entrée porte « maintenant » : exclue de la clé, sinon chaque rendu renverrait la frise
  const key = JSON.stringify(entries.map((e, i) => [i === 0 ? 0 : e.date.getTime(), e.props]));
  if (last.get(name) === key) return true;
  const w = load(name);
  if (!w) { status.set(name, { at: Date.now(), state: 'no-module', error: 'module widget indisponible', stored: null }); return false; }
  try {
    w.updateTimeline(entries);
    last.set(name, key);
    status.set(name, { at: Date.now(), state: String((entries[0].props as { s?: string }).s ?? '?'), error: null, stored: null });
    return true;
  } catch (e) {
    status.set(name, { at: Date.now(), state: 'error', error: String((e as Error)?.message ?? e), stored: null });
    return false;
  }
}

const TITLE: Record<WidgetName, TKey> = {
  CycleWidget: 'wg.cycle.titleD', BabyWidget: 'wg.baby.title', SleepWidget: 'wg.sleep.title',
  PregnancyWidget: 'wg.preg.titleD', TasksWidget: 'wg.tasks.title', PlanningWidget: 'wg.plan.title',
};

export function clearAllWidgets(): void {
  const now = new Date();
  for (const name of WIDGET_NAMES) {
    last.delete(name);
    pushWidget(name, [{ date: now, props: { s: 'out', title: tr(TITLE[name]), url: 'homi://', msg: tr('wg.out') } }]);
  }
}
