/**
 * Demande d'autorisation des notifications AU BON MOMENT : on explique d'abord pourquoi,
 * dans l'app, puis seulement le téléphone affiche sa demande système.
 */
import { Linking } from 'react-native';
import { confirm } from '@/components/Overlays';
import { getPermission, notificationsSupported, requestPermission, type PermissionState } from './notifications';

export async function askNotificationPermission(reason: string): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  const current = await getPermission();
  if (current === 'granted') return current;
  if (current === 'denied') {
    const open = await confirm(
      'Notifications désactivées',
      `${reason}\n\nLes notifications sont refusées pour Au fil de nous. Vous pouvez les réactiver dans les réglages du téléphone.`,
      'Ouvrir les réglages',
      false,
    );
    if (open) await Linking.openSettings().catch(() => undefined);
    return 'denied';
  }
  const ok = await confirm(
    'Recevoir ce rappel ?',
    `${reason}\n\nLe téléphone va vous demander l’autorisation d’envoyer des notifications. Vous pourrez la retirer à tout moment.`,
    'Continuer',
    false,
  );
  if (!ok) return 'undetermined';
  return requestPermission();
}
