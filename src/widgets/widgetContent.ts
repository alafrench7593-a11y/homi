/** Contenu du widget du cycle : discret par défaut, détaillé seulement si choisi et jamais si le cycle est masqué. */
export interface WidgetContent { title: string; line1: string; line2: string }

export function widgetContent(o: { detailed: boolean; hidden: boolean; appName: string; open: string; cycleDay: string | null; next: string | null }): WidgetContent {
  if (!o.detailed || o.hidden) return { title: o.appName, line1: o.open, line2: '' };
  return { title: o.appName, line1: o.cycleDay ?? '', line2: o.next ?? '' };
}
