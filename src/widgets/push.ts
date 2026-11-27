/** Widgets : iOS seulement (voir push.ios.ts). Ailleurs (web, Android, tests), rien à mettre à jour. */
import type { Entry, WidgetName } from './model';

export function pushWidget<P extends object>(_name: WidgetName, _entries: Entry<P>[]): boolean {
  return false;
}
export type WidgetStatus = { at: number; state: string; error: string | null; stored: number | null };
export async function widgetStatus(): Promise<Record<string, WidgetStatus>> { return {}; }
export function refreshWidgets(): void {}
export function registerWidgets(): void {}
export function subscribeRefresh(_cb: () => void): () => void { return () => undefined; }
/** Efface le contenu de tous les widgets (déconnexion, changement de compte, suppression du compte). */
export function clearAllWidgets(): void {}
export const STORY_PHOTO_MAX = 300;
/** Photo « Mon histoire » du widget : iOS seulement ; ailleurs, aucune photo. */
export async function storyPhotoFile(_photo: { id: string; width?: number | null; height?: number | null }, _signedUrl: () => Promise<string>): Promise<string> { return ''; }
export function purgeStoryPhotos(): void {}
