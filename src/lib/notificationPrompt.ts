/**
 * Demande d'autorisation des notifications AU BON MOMENT : on explique d'abord pourquoi,
 * dans l'app, puis seulement le téléphone affiche sa demande système.
 */
import { Linking } from 'react-native';
import { t as tr } from '@/i18n';
import { confirm } from '@/components/Overlays';
import { getPermission, notificationsSupported, requestPermission, type PermissionState } from './notifications';

export async function askNotificationPermission(reason: string): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  const current = await getPermission();
  if (current === 'granted') return current;
  if (current === 'denied') {
    const open = await confirm(
      tr('l8.np.deniedTitle'),
      tr('l8.np.deniedBody', { reason }),
      tr('l8.np.openSettings'),
      false,
    );
    if (open) await Linking.openSettings().catch(() => undefined);
    return 'denied';
  }
  const ok = await confirm(
    tr('l8.np.askTitle'),
    tr('l8.np.askBody', { reason }),
    tr('l8.np.continue'),
    false,
  );
  if (!ok) return 'undetermined';
  return requestPermission();
}
