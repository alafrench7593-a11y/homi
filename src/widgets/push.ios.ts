/**
 * Envoi du contenu aux widgets iOS (expo-widgets SDK 57, stockage partagé du groupe d'apps).
 * - Une frise d'entrées par widget (le système passe d'une entrée à l'autre sans réveiller l'app).
 * - Envoi seulement si le contenu a changé (pas de rechargement inutile : budget d'actualisation iOS).
 * - Sans module natif (Expo Go, build sans widget) : rien à faire, jamais d'erreur.
 * Aucun appel réseau ni IA ici : le widget n'affiche que ce que l'app a déjà chargé.
 */
import { t as tr, type TKey } from '@/i18n';
import { WIDGET_NAMES, type Entry, type WidgetName } from './model';

type Updatable = { updateTimeline: (e: { date: Date; props: object }[]) => void };
const last = new Map<WidgetName, string>();

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
  // La première entrée porte « maintenant » : exclue de la clé, sinon chaque rendu renverrait la frise
  const key = JSON.stringify(entries.map((e, i) => [i === 0 ? 0 : e.date.getTime(), e.props]));
  if (last.get(name) === key) return true;
  const w = load(name);
  if (!w) return false;
  try {
    w.updateTimeline(entries);
    last.set(name, key);
    return true;
  } catch {
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
