/** Widgets : iOS seulement (voir push.ios.ts). Ailleurs (web, Android, tests), rien à mettre à jour. */
import type { Entry, WidgetName } from './model';

export function pushWidget<P extends object>(_name: WidgetName, _entries: Entry<P>[]): boolean {
  return false;
}
export type WidgetStatus = { at: number; state: string; error: string | null; stored: number | null };
export async function widgetStatus(): Promise<Record<string, WidgetStatus>> { return {}; }
export function refreshWidgets(): void {}
export function subscribeRefresh(_cb: () => void): () => void { return () => undefined; }
/** Efface le contenu de tous les widgets (déconnexion, changement de compte, suppression du compte). */
export function clearAllWidgets(): void {}
