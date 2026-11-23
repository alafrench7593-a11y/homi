/**
 * « Me rappeler avant mon premier paiement » (03/12/2026).
 *  - programmé LOCALEMENT (expo-notifications), 24 h avant la fin de l'essai : le temps de décider ;
 *  - autorisation demandée à ce moment-là seulement (jamais au lancement), jamais bloquant ;
 *  - texte NEUTRE sur l'écran verrouillé (HOMI_NOTIFICATION_RULES.md : ni montant, ni santé, ni enfant) ;
 *  - état réel affiché : « Rappel prévu le … », autorisation refusée, échec, trop tard, non disponible (web).
 * Logique de date pure (testée : src/__tests__/firstWinOffer.test.ts) ; la programmation est faite par `scheduleTrialReminder`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { t as tr } from '@/i18n';

export const REMINDER_LEAD_MS = 24 * 3_600_000;
/** En dessous de ce délai, un rappel n'aurait plus de sens. */
export const REMINDER_MIN_AHEAD_MS = 30 * 60_000;
export const REMINDER_KEY = 'homi.trial-reminder.v1';

export type ReminderState =
  | { status: 'scheduled'; at: string }
  | { status: 'denied' } | { status: 'failed' } | { status: 'too_late' } | { status: 'unsupported' } | { status: 'none' };

/** Heure du rappel : 24 h avant la fin de l'essai ; si c'est déjà passé, 2 h avant ; sinon aucun rappel (trop tard). */
export function reminderAt(trialEnd: Date, now: Date): Date | null {
  for (const lead of [REMINDER_LEAD_MS, 2 * 3_600_000]) {
    const at = new Date(trialEnd.getTime() - lead);
    if (at.getTime() - now.getTime() >= REMINDER_MIN_AHEAD_MS) return at;
  }
  return null;
}

/** Contenu affiché sur l'écran verrouillé : neutre (aucun montant, aucune donnée personnelle). */
export const reminderContent = () => ({ title: tr('fw.rem.notifTitle'), body: tr('fw.rem.notifBody') });

export async function loadReminderState(): Promise<ReminderState> {
  try {
    const v = JSON.parse((await AsyncStorage.getItem(REMINDER_KEY)) ?? 'null') as ReminderState | null;
    if (v?.status === 'scheduled' && Date.parse(v.at) < Date.now()) return { status: 'none' };
    return v ?? { status: 'none' };
  } catch { return { status: 'none' }; }
}

/** Programme le rappel ; renvoie l'état RÉEL obtenu. Ne lève jamais d'erreur. */
export async function scheduleTrialReminder(trialEnd: Date, now = new Date()): Promise<ReminderState> {
  let state: ReminderState;
  const at = reminderAt(trialEnd, now);
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') state = { status: 'unsupported' };
  else if (!at) state = { status: 'too_late' };
  else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const n = require('@/lib/notifications') as typeof import('@/lib/notifications');
      const perm = await n.requestPermission();
      if (perm !== 'granted') state = { status: 'denied' };
      else {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications') as typeof import('expo-notifications');
        await Notifications.scheduleNotificationAsync({
          content: { ...reminderContent(), data: { url: '/settings/subscription', source: 'trial_reminder', kind: 'trial' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'reminders' },
        });
        state = { status: 'scheduled', at: at.toISOString() };
      }
    } catch {
      state = { status: 'failed' };
    }
  }
  try { await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(state)); } catch { /* état affiché quand même */ }
  return state;
}
