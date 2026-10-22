/**
 * Widget du cycle : seul iOS a un widget (voir syncCycleWidget.ios.ts). Ailleurs, rien à mettre à jour
 * (et le code du widget n'est pas embarqué dans les versions web et Android).
 */
import type { WidgetContent } from './widgetContent';

export { widgetContent, type WidgetContent } from './widgetContent';

export async function syncCycleWidget(_c: WidgetContent): Promise<boolean> {
  return false;
}
