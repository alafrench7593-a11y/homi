/** Catalogue des dix widgets iOS (Réglages › Widgets et Live Activities) : nom, icône, formats, sensibilité. */
import type { IconName } from '@/components/ui';
import type { TKey } from '@/i18n';
import type { WidgetName } from './model';

export type Family = 'small' | 'medium' | 'large' | 'lock';
export interface CatalogEntry { name: WidgetName; title: TKey; desc: TKey; icon: IconName; families: Family[]; sensitive: boolean }

const ALL: Family[] = ['small', 'medium', 'large', 'lock'];
export const WIDGET_CATALOG: CatalogEntry[] = [
  { name: 'BabyWidget', title: 'wg.baby.title', desc: 'wg.cat.BabyWidget', icon: 'coffee', families: ALL, sensitive: false },
  { name: 'SleepWidget', title: 'wg.sleep.title', desc: 'wg.cat.SleepWidget', icon: 'moon', families: ALL, sensitive: false },
  { name: 'CycleWidget', title: 'wg.cycle.title', desc: 'wg.cat.CycleWidget', icon: 'circle', families: ALL, sensitive: true },
  { name: 'PregnancyWidget', title: 'wg.preg.title', desc: 'wg.cat.PregnancyWidget', icon: 'heart', families: ALL, sensitive: true },
  { name: 'TasksWidget', title: 'wg.tasks.title', desc: 'wg.cat.TasksWidget', icon: 'check-square', families: ALL, sensitive: false },
  { name: 'PlanningWidget', title: 'wg.plan.title', desc: 'wg.cat.PlanningWidget', icon: 'calendar', families: ALL, sensitive: false },
  { name: 'AuraWidget', title: 'wg.aura.title', desc: 'wg.cat.AuraWidget', icon: 'star', families: ALL, sensitive: false },
  { name: 'RelayWidget', title: 'wg.relay.title', desc: 'wg.cat.RelayWidget', icon: 'repeat', families: ALL, sensitive: false },
  { name: 'HealthWidget', title: 'wg.health.title', desc: 'wg.cat.HealthWidget', icon: 'activity', families: ALL, sensitive: true },
  { name: 'StoryWidget', title: 'wg.story.title', desc: 'wg.cat.StoryWidget', icon: 'image', families: ALL, sensitive: false },
];

/** Proportions de la grille iOS (cases) : petit 2×2, moyen 4×2, grand 4×4, écran verrouillé rectangulaire. */
export const FAMILY_SHAPE: Record<Family, { w: number; h: number; label: TKey }> = {
  small: { w: 1, h: 1, label: 'wg.fam.small' },
  medium: { w: 2.1, h: 1, label: 'wg.fam.medium' },
  large: { w: 2.1, h: 2.1, label: 'wg.fam.large' },
  lock: { w: 1.6, h: 0.55, label: 'wg.fam.lock' },
};
