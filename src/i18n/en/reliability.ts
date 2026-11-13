import type { reliability as fr } from '../fr/reliability';
import type { Messages } from '../types';

export const reliability: Messages<typeof fr> = {
  'rel.task.conflict': 'Someone else in the household changed this task in the meantime. Nothing was overwritten: the latest version is shown, check it and try again.',
  'rel.task.notFound': 'This task no longer exists or is no longer available to you.',
  'rel.queued': 'Kept on this phone: it will be sent automatically as soon as the connection is back.',
  'rel.signOut.pending': {
    one: '{count} entry has not been sent yet (no network). It will be sent the next time you sign in on this phone with this account; it will be erased if another account signs in.',
    other: '{count} entries have not been sent yet (no network). They will be sent the next time you sign in on this phone with this account; they will be erased if another account signs in.',
  },
};
