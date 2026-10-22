/**
 * Mise à jour du widget iOS depuis l'application (iOS seulement ; sans effet ailleurs).
 * Discret par défaut : « Toi & Moi · Ouvrir l'application ». Détaillé (jour du cycle, prochaines règles estimées)
 * uniquement si la personne l'a activé, et jamais si le cycle est masqué sur l'accueil ou verrouillé.
 */
import { Platform } from 'react-native';

import type { WidgetContent } from './widgetContent';

export { widgetContent, type WidgetContent } from './widgetContent';

export async function syncCycleWidget(c: WidgetContent): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    // Chargé à la demande : absent d'Expo Go et des builds sans le widget (aucun plantage, simplement rien à faire)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CycleWidget = (require('./CycleWidget') as typeof import('./CycleWidget')).default;
    CycleWidget.updateSnapshot(c);
    return true;
  } catch {
    return false; // module natif absent (Expo Go, build sans le widget) : rien à faire
  }
}
