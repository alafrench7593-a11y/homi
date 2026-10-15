/**
 * Notifications LOCALES (rappels personnels, programmés sur le téléphone, sans réseau)
 * et PUSH (réponses du forum, abonnement, rappels officiels de produits).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { backend } from './backend';
import { IOS_PENDING_LIMIT, planReminder, toExpoWeekday, validateSchedule, type PlannedTrigger } from './domain/reminders';
import type { Reminder } from './types';

export const notificationsSupported = Platform.OS === 'ios' || Platform.OS === 'android';
const MAP_KEY = 'toietmoi.scheduled.v1';
type ScheduledMap = Record<string, { signature: string; ids: string[] }>;

export function configureNotifications() {
  if (!notificationsSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true, // le mode silencieux du téléphone reste respecté par le système
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', { name: 'Rappels', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 120, 200] }).catch(() => undefined);
    Notifications.setNotificationChannelAsync('community', { name: 'Communauté', importance: Notifications.AndroidImportance.DEFAULT }).catch(() => undefined);
    Notifications.setNotificationChannelAsync('alerts', { name: 'Alertes officielles', importance: Notifications.AndroidImportance.HIGH }).catch(() => undefined);
  }
  Notifications.setNotificationCategoryAsync('reminder', [
    { identifier: 'snooze', buttonTitle: 'Reporter de 30 min', options: { opensAppToForeground: false } },
    { identifier: 'done', buttonTitle: 'C’est fait', options: { opensAppToForeground: false } },
  ]).catch(() => undefined);
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  const current = await getPermission();
  if (current === 'granted' || current === 'denied') return current;
  const p = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return p.granted ? 'granted' : 'denied';
}

/** Enregistre le jeton push de cet appareil (plusieurs appareils par compte possibles). */
export async function registerPushToken(): Promise<string | null> {
  if (!notificationsSupported || !Device.isDevice || backend.mode === 'demo') return null;
  if ((await getPermission()) !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return null;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await backend.insert('push_devices', { expo_push_token: token, platform: Platform.OS, device_label: Device.modelName ?? null, last_seen_at: new Date().toISOString() }, { onConflict: 'expo_push_token' });
    return token;
  } catch {
    return null; // réessayé au prochain lancement
  }
}

function toTrigger(p: PlannedTrigger): Notifications.NotificationTriggerInput {
  const channelId = 'reminders';
  switch (p.kind) {
    case 'date': return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId };
    case 'daily': return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: p.hour, minute: p.minute, channelId };
    case 'weekly': return { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: toExpoWeekday(p.weekday), hour: p.hour, minute: p.minute, channelId };
  }
}

const signature = (r: Reminder) => JSON.stringify([r.title, r.body, r.schedule, r.enabled, r.snoozed_until, r.deep_link]);

/**
 * Synchronise les notifications programmées avec la liste des rappels :
 * crée, modifie (annule puis reprogramme) et annule ce qui doit l'être.
 * Idempotent : peut être appelé à chaque ouverture et sur chaque appareil.
 */
export async function syncLocalReminders(reminders: Reminder[]): Promise<{ scheduled: number; skipped: number }> {
  if (!notificationsSupported) return { scheduled: 0, skipped: 0 };
  let map: ScheduledMap = {};
  try {
    map = JSON.parse((await AsyncStorage.getItem(MAP_KEY)) ?? '{}');
  } catch {
    map = {};
  }
  const wanted = new Map(reminders.filter((r) => r.enabled && validateSchedule(r.schedule)).map((r) => [r.id, r]));

  // Annulation : rappels supprimés, désactivés ou modifiés
  for (const [id, entry] of Object.entries(map)) {
    const r = wanted.get(id);
    if (!r || signature(r) !== entry.signature) {
      await Promise.all(entry.ids.map((nid) => Notifications.cancelScheduledNotificationAsync(nid).catch(() => undefined)));
      delete map[id];
    }
  }

  let total = Object.values(map).reduce((t, e) => t + e.ids.length, 0);
  let scheduled = 0;
  let skipped = 0;
  for (const r of wanted.values()) {
    if (map[r.id]) continue;
    const plans = planReminder(r.schedule, new Date(), r.snoozed_until);
    const ids: string[] = [];
    for (const p of plans) {
      if (Platform.OS === 'ios' && total >= IOS_PENDING_LIMIT - 4) {
        skipped++;
        continue;
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: r.title,
          body: r.body ?? undefined,
          categoryIdentifier: 'reminder',
          data: { url: r.deep_link ?? '/notifications', reminderId: r.id, source: 'reminder' },
        },
        trigger: toTrigger(p),
      });
      ids.push(id);
      total++;
      scheduled++;
    }
    map[r.id] = { signature: signature(r), ids };
  }
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
  return { scheduled, skipped };
}

/** Report ponctuel (« Reporter de 30 min ») : notification unique, sans modifier le rappel. */
export async function snoozeLocally(title: string, body: string | undefined, url: string | undefined, minutes = 30) {
  if (!notificationsSupported) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, categoryIdentifier: 'reminder', data: { url, source: 'snooze' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + minutes * 60000), channelId: 'reminders' },
  });
}

export async function cancelAllLocal() {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(MAP_KEY);
}

/** Notification de test immédiate : permet de vérifier la réception sur l'appareil. */
export async function sendTestNotification() {
  if (!notificationsSupported) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Les rappels fonctionnent', body: 'Vous recevrez vos rappels ici, même application fermée.', data: { url: '/notifications' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'reminders' },
  });
  return true;
}

export async function scheduledCount(): Promise<number> {
  if (!notificationsSupported) return 0;
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}
