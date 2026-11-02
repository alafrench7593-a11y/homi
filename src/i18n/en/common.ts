import type { common as fr } from '../fr/common';
import type { Messages } from '../types';

export const common: Messages<typeof fr> = {
  'common.loadingA11y': 'Loading…',
  'common.ok': 'OK',
  'common.add': 'Add',
  'common.showPassword': 'Show password',
  'common.optional': 'optional',
  'common.hidePassword': 'Hide password',
  'common.cannotShow': 'We couldn’t load this',
  'common.appLoading': '{app} is loading',
  'error.screen.title': 'Sorry, something went wrong on this screen',
  'error.screen.body': 'Your data is safe. Try again, or head back to the home screen.',
  'error.screen.home': 'Back to home',
  'error.screen.detail': 'Detail for support: {detail}',
  'error.screen.emergency': 'In an emergency, call your local emergency number (112 in Europe).',
  'demo.badgeShort': 'Demo',
  'demo.badge': 'Demo',
  'demo.badgeA11y': 'Demo: sample data, stored only on this device',
  'demo.leave': 'Exit',
  'demo.leaveA11y': 'Exit the demo',
  'sync.offline': 'Offline',
  'sync.offlinePending': { one: 'Offline · {count} waiting', other: 'Offline · {count} waiting' },
  'sync.toCheck': { one: '{count} entry to review', other: '{count} entries to review' },
  'sync.syncing': 'Syncing · {count}',
  'sync.openA11y': '{label}. Open sync details',
  'sync.done': { one: '{count} entry synced.', other: '{count} entries synced.' },
};
