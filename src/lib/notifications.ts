/**
 * Notifications LOCALES (rappels personnels, programmés sur le téléphone, sans réseau)
 * et PUSH (réponses du forum, abonnement, rappels officiels de produits).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DIGEST_NOTIFICATION, parseTime } from './domain/dailyDigest';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { backend, eq, inList } from './backend';
import { bottleTimerUrl, cancelTimer, notificationContent, snoozeTimer } from './domain/bottleTimer';
import { IOS_PENDING_LIMIT, planReminder, toExpoWeekday, validateSchedule, type PlannedTrigger } from './domain/reminders';
import type { Child, Reminder } from './types';
import type { BottleTimer } from './types-bottle';

export const notificationsSupported = Platform.OS === 'ios' || Platform.OS === 'android';
const MAP_KEY = 'toietmoi.scheduled.v1';
type ScheduledMap = Record<string, { signature: string; ids: string[] }>;

export const TREATMENT_CATEGORY = 'treatment';
export const TREAT_TAKEN = 'treat-taken';
export const TREAT_SNOOZE = 'treat-snooze';
export const TREAT_SKIP = 'treat-skip';
export const TREAT_NOTE = 'treat-note';
const doseOf = (r: Reminder) => {
  const s = r.schedule as { hour?: number; minute?: number };
  return s.hour != null ? `${String(s.hour).padStart(2, '0')}:${String(s.minute ?? 0).padStart(2, '0')}` : null;
};

/** Prise prévue correspondant à une notification : le jour de la notification, à l'heure saisie par le parent. */
export function doseScheduledFor(notifiedAt: number, dose: string | null): string {
  const d = new Date(notifiedAt);
  if (dose && /^\d{2}:\d{2}$/.test(dose)) { const [h, m] = dose.split(':').map(Number); d.setHours(h, m, 0, 0); }
  else d.setSeconds(0, 0);
  return d.toISOString();
}

/**
 * Réponse à un rappel de traitement depuis la notification. L'application n'interprète rien : elle note
 * « pris », « reporté » ou « ignoré » pour la prise prévue. « Ajouter une note » ouvre la fiche.
 */
export async function handleTreatmentResponse(response: Notifications.NotificationResponse): Promise<boolean> {
  const c = response.notification.request.content;
  const data = (c.data ?? {}) as { source?: string; treatmentId?: string; householdId?: string; dose?: string | null; url?: string };
  if (data.source !== 'treatment' || !data.treatmentId) return false;
  const status = response.actionIdentifier === TREAT_TAKEN ? 'taken' : response.actionIdentifier === TREAT_SKIP ? 'skipped' : response.actionIdentifier === TREAT_SNOOZE ? 'snoozed' : null;
  if (!status) return false;
  const scheduled_for = doseScheduledFor(response.notification.date, data.dose ?? null);
  const existing = await backend.select<{ id: string }>({ table: 'treatment_logs', filters: [eq('treatment_id', data.treatmentId), eq('scheduled_for', scheduled_for)], limit: 1 });
  if (existing[0]) await backend.update('treatment_logs', { status }, [eq('id', existing[0].id)]);
  else await backend.insert('treatment_logs', { treatment_id: data.treatmentId, household_id: data.householdId, scheduled_for, status });
  if (status === 'snoozed') await snoozeLocally(c.title ?? 'Traitement', c.body ?? undefined, data.url);
  return true;
}

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
    // Écran verrouillé : contenu masqué (PRIVATE) par défaut ; le système affiche « contenu masqué » si l'utilisatrice l'a choisi
    Notifications.setNotificationChannelAsync('reminders', { name: 'Rappels', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 120, 200], lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PRIVATE }).catch(() => undefined);
    Notifications.setNotificationChannelAsync('community', { name: 'Communauté', importance: Notifications.AndroidImportance.DEFAULT }).catch(() => undefined);
    Notifications.setNotificationChannelAsync('alerts', { name: 'Alertes officielles', importance: Notifications.AndroidImportance.HIGH }).catch(() => undefined);
    // Sommeil : estimations choisies par le parent, contenu masqué sur l'écran verrouillé, importance normale
    Notifications.setNotificationChannelAsync(SLEEP_CHANNEL, { name: 'Sommeil (estimations)', importance: Notifications.AndroidImportance.DEFAULT, lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PRIVATE }).catch(() => undefined);
    Notifications.setNotificationChannelAsync(BOTTLE_CHANNEL, { name: 'Biberons', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 200, 120, 200], lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PRIVATE }).catch(() => undefined);
  }
  Notifications.setNotificationCategoryAsync('reminder', [
    { identifier: 'snooze', buttonTitle: 'Reporter de 30 min', options: { opensAppToForeground: false } },
    { identifier: 'done', buttonTitle: 'C’est fait', options: { opensAppToForeground: false } },
  ]).catch(() => undefined);
  // Minuteur biberon : « Noter le biberon » (ouvre la saisie), « Reporter 15 min », « Annuler » (sans ouvrir l'application),
  // « Modifier l'intervalle » (ouvre le minuteur). Android n'affiche que les 3 premiers boutons : un appui sur la
  // notification ouvre aussi le minuteur, où l'intervalle se modifie.
  Notifications.setNotificationCategoryAsync(BOTTLE_CATEGORY, [
    { identifier: BOTTLE_ACTION_RECORD, buttonTitle: 'Noter le biberon', options: { opensAppToForeground: true } },
    { identifier: BOTTLE_ACTION_SNOOZE, buttonTitle: 'Reporter 15 min', options: { opensAppToForeground: false } },
    { identifier: BOTTLE_ACTION_CANCEL, buttonTitle: 'Annuler', options: { opensAppToForeground: false, isDestructive: true } },
    { identifier: BOTTLE_ACTION_EDIT, buttonTitle: 'Modifier l’intervalle', options: { opensAppToForeground: true } },
  ]).catch(() => undefined);
  // Traitement prescrit d'un enfant : « Pris », « Reporter », « Ignorer », « Ajouter une note »
  Notifications.setNotificationCategoryAsync(TREATMENT_CATEGORY, [
    { identifier: TREAT_TAKEN, buttonTitle: 'Pris', options: { opensAppToForeground: false } },
    { identifier: TREAT_SNOOZE, buttonTitle: 'Reporter', options: { opensAppToForeground: false } },
    { identifier: TREAT_SKIP, buttonTitle: 'Ignorer', options: { opensAppToForeground: false } },
    { identifier: TREAT_NOTE, buttonTitle: 'Ajouter une note', options: { opensAppToForeground: true } },
  ]).catch(() => undefined);
  if (!bottleResponseSub) {
    bottleResponseSub = Notifications.addNotificationResponseReceivedListener((r) => {
      handleBottleNotificationResponse(r).catch(() => undefined);
      handleTreatmentResponse(r).catch(() => undefined);
    });
  }
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
          categoryIdentifier: r.treatment_id ? TREATMENT_CATEGORY : 'reminder',
          data: r.treatment_id
            ? { url: r.deep_link ?? '/notifications', reminderId: r.id, source: 'treatment', treatmentId: r.treatment_id, householdId: r.household_id, dose: doseOf(r) }
            : { url: r.deep_link ?? '/notifications', reminderId: r.id, source: 'reminder' },
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
  // Même chemin de synchronisation (ouverture de l'app, modification des rappels) : minuteurs biberon
  await syncBottleTimers().catch(() => undefined);
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
  await AsyncStorage.multiRemove([MAP_KEY, BOTTLE_MAP_KEY, SLEEP_MAP_KEY]);
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

// =====================================================================
// Minuteur biberon : notifications LOCALES à échéance absolue (déclencheur DATE)
// =====================================================================
/**
 * Où sont les données ?
 *  - Les minuteurs : table `bottle_timers` (Supabase, partagée dans le foyer selon le domaine
 *    « daily ») ou moteur local en mode démonstration. Ils survivent à la fermeture de l'app,
 *    au redémarrage du téléphone et au changement d'appareil : syncBottleTimers() reprogramme
 *    tout au démarrage (appelée depuis syncLocalReminders).
 *  - Les identifiants des notifications programmées SUR CET APPAREIL : AsyncStorage
 *    `toietmoi.bottle-scheduled.v1` ({ [timerId]: { signature, ids } }) — l'ancienne
 *    notification est annulée avant toute reprogrammation (modification, report, annulation).
 *  - L'interrupteur « Notifications du minuteur biberon » : AsyncStorage `toietmoi.bottle-notifs.v1`
 *    ({ enabled: boolean }, activé par défaut), propre à CET appareil. Désactivé : plus aucune
 *    notification biberon n'est programmée ici ; le minuteur reste affiché dans l'application.
 */
const BOTTLE_MAP_KEY = 'toietmoi.bottle-scheduled.v1';
export const BOTTLE_PREFS_KEY = 'toietmoi.bottle-notifs.v1';
const BOTTLE_HANDLED_KEY = 'toietmoi.bottle-handled.v1';
const BOTTLE_CHANNEL = 'bottle';
export const BOTTLE_CATEGORY = 'bottle';
export const BOTTLE_ACTION_SNOOZE = 'bottle-snooze-15';
export const BOTTLE_ACTION_SNOOZE_30 = 'bottle-snooze-30';
export const BOTTLE_ACTION_CANCEL = 'bottle-cancel';
export const BOTTLE_ACTION_RECORD = 'bottle-record';
export const BOTTLE_ACTION_EDIT = 'bottle-edit';

/** Écran à ouvrir pour une réponse à une notification ; null = action traitée sans ouvrir d'écran. */
export function notificationRoute(actionIdentifier: string, data: { url?: string; source?: string; childId?: string } | undefined): string | null {
  const url = data?.url && data.url.startsWith('/') ? data.url : null;
  if (actionIdentifier === 'snooze' || actionIdentifier === 'done') return null;
  if (actionIdentifier.startsWith('treat-') && actionIdentifier !== 'treat-note') return null;
  if (actionIdentifier === BOTTLE_ACTION_RECORD && data?.childId) return `/track/bottle?child=${data.childId}`;
  if (actionIdentifier === BOTTLE_ACTION_EDIT && data?.childId) return `/bottle/${data.childId}?edit=1`;
  if (actionIdentifier.startsWith('bottle-')) return null; // reporter, annuler : traités sans ouvrir l'application
  return url;
}
let bottleResponseSub: { remove: () => void } | null = null;

type BottleScheduledMap = Record<string, { signature: string; ids: string[] }>;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface BottlePrefs { enabled?: boolean; showQuantity?: boolean }

export async function getBottleNotificationsEnabled(): Promise<boolean> {
  const prefs = await readJson<BottlePrefs>(BOTTLE_PREFS_KEY, {});
  return prefs.enabled !== false;
}

/** La quantité notée n'apparaît dans la notification que si le parent l'a autorisé (désactivé par défaut). */
export async function getBottleShowQuantity(): Promise<boolean> {
  return (await readJson<BottlePrefs>(BOTTLE_PREFS_KEY, {})).showQuantity === true;
}

/** Active / désactive les notifications du rappel biberon sur cet appareil, puis resynchronise. */
export async function setBottleNotificationsEnabled(enabled: boolean): Promise<void> {
  const prefs = await readJson<BottlePrefs>(BOTTLE_PREFS_KEY, {});
  await AsyncStorage.setItem(BOTTLE_PREFS_KEY, JSON.stringify({ ...prefs, enabled }));
  await syncBottleTimers().catch(() => undefined);
}

/** Affiche ou masque la quantité dans la notification (les notifications déjà programmées sont refaites). */
export async function setBottleShowQuantity(showQuantity: boolean): Promise<void> {
  const prefs = await readJson<BottlePrefs>(BOTTLE_PREFS_KEY, {});
  await AsyncStorage.setItem(BOTTLE_PREFS_KEY, JSON.stringify({ ...prefs, showQuantity }));
  await syncBottleTimers().catch(() => undefined);
}

/** Identifiants programmés sur cet appareil pour un minuteur (vide = aucune notification en attente ici). */
export async function scheduledBottleIds(timerId: string): Promise<string[]> {
  if (!notificationsSupported) return [];
  return (await readJson<BottleScheduledMap>(BOTTLE_MAP_KEY, {}))[timerId]?.ids ?? [];
}

export interface BottleSyncResult { scheduled: number; cancelled: number; active: number }

let bottleChain: Promise<unknown> = Promise.resolve();

/**
 * Synchronise les notifications biberon de CET appareil avec les minuteurs actifs :
 * annule ce qui a été annulé / modifié / reporté, programme ce qui manque.
 * Idempotente et sérialisée (deux synchronisations ne se chevauchent jamais : pas de doublon).
 * Appelée au démarrage (via syncLocalReminders), après chaque action sur un minuteur
 * et quand l'interrupteur de notifications change.
 */
export function syncBottleTimers(): Promise<BottleSyncResult> {
  const run = bottleChain.then(doSyncBottleTimers, doSyncBottleTimers);
  bottleChain = run.catch(() => undefined);
  return run;
}

async function doSyncBottleTimers(): Promise<BottleSyncResult> {
  if (!notificationsSupported) return { scheduled: 0, cancelled: 0, active: 0 };
  // Action « Reporter » / « Annuler » choisie pendant que l'application était fermée
  await applyPendingBottleResponse().catch(() => undefined);

  const session = await backend.auth.getSession().catch(() => null);
  const enabled = await getBottleNotificationsEnabled();
  const showQty = await getBottleShowQuantity();
  let timers: BottleTimer[] = [];
  let names = new Map<string, string>();
  let fetched = !session; // déconnecté : tout est annulé
  if (session && enabled) {
    try {
      timers = await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('status', 'active')] });
      const ids = [...new Set(timers.map((t) => t.child_id))];
      const children = ids.length ? await backend.select<Child>({ table: 'children', filters: [inList('id', ids)] }) : [];
      names = new Map(children.map((c) => [c.id, c.first_name]));
      fetched = true;
    } catch {
      fetched = false; // hors connexion : on garde ce qui est déjà programmé
    }
  } else if (!enabled) {
    fetched = true;
  }
  const map = await readJson<BottleScheduledMap>(BOTTLE_MAP_KEY, {});
  if (!fetched) return { scheduled: 0, cancelled: 0, active: Object.keys(map).length };

  const now = Date.now();
  const wanted = new Map(timers.filter((t) => Date.parse(t.due_at) > now && names.has(t.child_id)).map((t) => [t.id, t]));
  const sig = (t: BottleTimer) => JSON.stringify([t.due_at, showQty ? t.planned_ml : null, names.get(t.child_id), t.child_id]);

  let cancelled = 0;
  for (const [id, entry] of Object.entries(map)) {
    const t = wanted.get(id);
    if (!t || sig(t) !== entry.signature) {
      await Promise.all(entry.ids.map((nid) => Notifications.cancelScheduledNotificationAsync(nid).catch(() => undefined)));
      cancelled += entry.ids.length;
      delete map[id];
    }
  }
  // Notifications biberon orphelines (carte locale perdue, réinstallation…) : seules celles marquées
  // data.kind === 'bottle' et absentes de la carte sont annulées. Les autres notifications
  // programmées (rappels, rendez-vous, forum) ne sont JAMAIS touchées ici.
  try {
    const owned = new Set(Object.values(map).flatMap((e) => e.ids));
    for (const n of await Notifications.getAllScheduledNotificationsAsync()) {
      const d = (n.content.data ?? {}) as { kind?: string };
      if (d.kind === 'bottle' && !owned.has(n.identifier)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined);
        cancelled++;
      }
    }
  } catch {
    // liste indisponible : rien d'autre n'est annulé
  }
  let scheduled = 0;
  for (const t of wanted.values()) {
    if (map[t.id]) continue;
    const { title, body } = notificationContent(names.get(t.child_id) ?? 'votre enfant', t.planned_ml, showQty);
    try {
      const nid = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          categoryIdentifier: BOTTLE_CATEGORY,
          // Le gestionnaire existant (_layout) ouvre data.url : le minuteur du bon enfant
          data: { url: bottleTimerUrl(t.child_id), source: 'bottle', kind: 'bottle', timerId: t.id, childId: t.child_id, dueAt: t.due_at },
        },
        // Instant absolu : correct quel que soit le fuseau et à travers le changement d'heure
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(t.due_at), channelId: BOTTLE_CHANNEL },
      });
      map[t.id] = { signature: sig(t), ids: [nid] };
      scheduled++;
    } catch {
      // programmation refusée par le système : réessayée à la prochaine synchronisation
    }
  }
  await AsyncStorage.setItem(BOTTLE_MAP_KEY, JSON.stringify(map));
  return { scheduled, cancelled, active: wanted.size };
}

/** Réponse à une notification biberon (bouton « Reporter 15 min » ou « Annuler »). */
export async function handleBottleNotificationResponse(response: Notifications.NotificationResponse): Promise<boolean> {
  const handled = await applyBottleAction(response);
  if (handled) await syncBottleTimers().catch(() => undefined);
  return handled;
}

async function applyPendingBottleResponse() {
  const last = Notifications.getLastNotificationResponse?.();
  if (last) await applyBottleAction(last);
}

/** Met à jour le minuteur en base (sans resynchroniser). Dédoublonné : chaque réponse n'est traitée qu'une fois. */
async function applyBottleAction(response: Notifications.NotificationResponse): Promise<boolean> {
  const request = response.notification.request;
  const data = (request.content.data ?? {}) as { source?: string; timerId?: string };
  const action = response.actionIdentifier;
  if (data.source !== 'bottle' || !data.timerId || (action !== BOTTLE_ACTION_SNOOZE && action !== BOTTLE_ACTION_SNOOZE_30 && action !== BOTTLE_ACTION_CANCEL)) return false;
  const snoozeMin = action === BOTTLE_ACTION_SNOOZE_30 ? 30 : 15;
  const key = `${request.identifier}:${action}:${response.notification.date}`;
  const done = await readJson<string[]>(BOTTLE_HANDLED_KEY, []);
  if (done.includes(key)) return false;
  await AsyncStorage.setItem(BOTTLE_HANDLED_KEY, JSON.stringify([...done, key].slice(-30)));
  try {
    const [timer] = await backend.select<BottleTimer>({ table: 'bottle_timers', filters: [eq('id', data.timerId)] });
    if (!timer || timer.status !== 'active') return true;
    const patch = action === BOTTLE_ACTION_CANCEL ? cancelTimer() : snoozeTimer(timer, snoozeMin);
    await backend.update('bottle_timers', patch, [eq('id', timer.id)]);
  } catch {
    // Hors connexion : le report reste assuré par une notification ponctuelle sur cet appareil
    if (action !== BOTTLE_ACTION_CANCEL) {
      await Notifications.scheduleNotificationAsync({
        // Sans kind 'bottle' : ce report ponctuel hors connexion n'est pas annulé par la synchronisation suivante
        content: { title: request.content.title ?? 'Biberon', body: request.content.body ?? undefined, categoryIdentifier: BOTTLE_CATEGORY, data: { ...data, kind: 'bottle-offline-snooze' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + snoozeMin * 60_000), channelId: BOTTLE_CHANNEL },
      }).catch(() => undefined);
    }
  }
  return true;
}

// =====================================================================
// Sommeil : notifications LOCALES issues du planning estimé (déclencheur DATE)
// =====================================================================
/**
 * Le planning est recalculé à chaque relevé (endormissement, réveil, modification, suppression) : la liste voulue
 * remplace alors entièrement l'ancienne pour CET enfant (annulation puis reprogrammation). Les notifications d'un
 * autre enfant, les rappels, biberons, rendez-vous ou forum ne sont jamais touchés. Rien n'est envoyé à un serveur :
 * tout est programmé sur l'appareil.
 */
export const SLEEP_CHANNEL = 'sleep';
const SLEEP_MAP_KEY = 'toietmoi.sleep-notifs.v1';
type SleepMap = Record<string, { signature: string; ids: string[] }>;
export interface SleepNotificationRequest { id: string; at: number; title: string; body: string; kind: string }
let sleepChain: Promise<unknown> = Promise.resolve();

export function syncSleepNotifications(childId: string, wanted: SleepNotificationRequest[]): Promise<{ scheduled: number; cancelled: number }> {
  const run = sleepChain.then(() => doSyncSleep(childId, wanted), () => doSyncSleep(childId, wanted));
  sleepChain = run.catch(() => undefined);
  return run;
}

async function doSyncSleep(childId: string, wanted: SleepNotificationRequest[]) {
  if (!notificationsSupported) return { scheduled: 0, cancelled: 0 };
  const map = await readJson<SleepMap>(SLEEP_MAP_KEY, {});
  const future = wanted.filter((n) => n.at > Date.now());
  const signature = JSON.stringify(future.map((n) => [n.id, n.at, n.body]));
  if (map[childId]?.signature === signature) return { scheduled: 0, cancelled: 0 };
  let cancelled = 0;
  const previous = map[childId]?.ids ?? [];
  await Promise.all(previous.map((nid) => Notifications.cancelScheduledNotificationAsync(nid).catch(() => undefined)));
  cancelled += previous.length;
  // Orphelines de CET enfant (carte locale perdue) : uniquement data.kind === 'sleep' et data.childId identique
  try {
    for (const n of await Notifications.getAllScheduledNotificationsAsync()) {
      const d = (n.content.data ?? {}) as { kind?: string; childId?: string };
      if (d.kind === 'sleep' && d.childId === childId && !previous.includes(n.identifier)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined);
        cancelled++;
      }
    }
  } catch {
    // liste indisponible : rien d'autre n'est annulé
  }
  const ids: string[] = [];
  for (const n of future) {
    try {
      ids.push(await Notifications.scheduleNotificationAsync({
        content: { title: n.title, body: n.body, data: { url: `/sleep/${childId}`, source: 'sleep', kind: 'sleep', childId, estimate: n.kind } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at), channelId: SLEEP_CHANNEL },
      }));
    } catch {
      // refusée par le système : reprogrammée au prochain recalcul
    }
  }
  if (ids.length) map[childId] = { signature, ids }; else delete map[childId];
  await AsyncStorage.setItem(SLEEP_MAP_KEY, JSON.stringify(map));
  return { scheduled: ids.length, cancelled };
}

// ---------------------------------------------------------------- résumé du matin et du soir (choisis par la personne)
const DIGEST_KEY = 'toietmoi.digest-notifs.v1';

/**
 * Programme (ou retire) les notifications quotidiennes du résumé. Contenu générique : aucun détail personnel sur l'écran
 * verrouillé ; ouvrir la notification affiche le résumé à jour (/today). Rien n'est programmé si la personne ne l'a pas choisi.
 */
export async function syncDigestNotifications(prefs: { morning: boolean; morning_time: string; evening: boolean; evening_time: string } | null): Promise<number> {
  if (!notificationsSupported) return 0;
  let saved: { signature: string; ids: string[] } = { signature: '', ids: [] };
  try { saved = JSON.parse((await AsyncStorage.getItem(DIGEST_KEY)) ?? '{"signature":"","ids":[]}'); } catch { /* état local perdu : on reprogramme */ }
  const signature = JSON.stringify(prefs ? [prefs.morning, prefs.morning_time, prefs.evening, prefs.evening_time] : null);
  if (signature === saved.signature) return saved.ids.length;
  await Promise.all(saved.ids.map((nid) => Notifications.cancelScheduledNotificationAsync(nid).catch(() => undefined)));
  const ids: string[] = [];
  for (const moment of ['morning', 'evening'] as const) {
    if (!prefs?.[moment]) continue;
    const t = parseTime(prefs[`${moment}_time`]);
    if (!t) continue;
    try {
      ids.push(await Notifications.scheduleNotificationAsync({
        content: { ...DIGEST_NOTIFICATION[moment], data: { url: `/today?moment=${moment}`, source: 'digest', kind: 'digest' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: t.hour, minute: t.minute, channelId: 'reminders' },
      }));
    } catch {
      // refusée par le système (permission) : reprogrammée à la prochaine ouverture
    }
  }
  await AsyncStorage.setItem(DIGEST_KEY, JSON.stringify({ signature, ids }));
  return ids.length;
}
