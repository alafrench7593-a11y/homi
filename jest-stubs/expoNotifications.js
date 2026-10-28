// Tests Android seulement : expo-notifications charge des modules natifs Android à l'import, absents sous Node.
// Les suites qui testent les notifications fournissent leur propre jest.mock('expo-notifications', …), prioritaire.
const noop = async () => undefined;
const base = {
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval', CALENDAR: 'calendar' },
  AndroidImportance: { MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
  AndroidNotificationVisibility: { PUBLIC: 1, PRIVATE: 0, SECRET: -1 },
  setNotificationHandler: () => undefined,
  addNotificationResponseReceivedListener: () => ({ remove: () => undefined }),
  addNotificationReceivedListener: () => ({ remove: () => undefined }),
  addPushTokenListener: () => ({ remove: () => undefined }),
  getLastNotificationResponse: () => null,
  getLastNotificationResponseAsync: async () => null,
  getPermissionsAsync: async () => ({ granted: false, status: 'undetermined' }),
  requestPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
  getAllScheduledNotificationsAsync: async () => [],
  scheduleNotificationAsync: async () => 'stub',
};
module.exports = new Proxy(base, { get: (t, k) => (k in t ? t[k] : k === '__esModule' ? false : noop) });
