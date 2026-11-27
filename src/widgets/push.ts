/** Widgets : iOS seulement (voir push.ios.ts). Ailleurs (web, Android, tests), rien à mettre à jour. */
import type { Entry, WidgetName } from './model';

export function pushWidget<P extends object>(_name: WidgetName, _entries: Entry<P>[]): boolean {
  return false;
}
/** Efface le contenu de tous les widgets (déconnexion, changement de compte, suppression du compte). */
export function clearAllWidgets(): void {}
