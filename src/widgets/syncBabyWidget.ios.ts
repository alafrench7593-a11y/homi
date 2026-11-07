/** Mise à jour du widget « Bébé » (iOS seulement). Sans module natif (Expo Go, build sans widget) : rien à faire. */
import { Platform } from 'react-native';
import type { BabyWidgetContent } from './babyWidgetContent';

let last = '';
export async function syncBabyWidget(c: BabyWidgetContent): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const key = JSON.stringify(c);
  if (key === last) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BabyWidget = (require('./BabyWidget') as typeof import('./BabyWidget')).default;
    BabyWidget.updateSnapshot(c);
    last = key;
    return true;
  } catch {
    return false;
  }
}
