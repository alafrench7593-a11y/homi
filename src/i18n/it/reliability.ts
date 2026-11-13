import type { reliability as fr } from '../fr/reliability';
import type { Messages } from '../types';

export const reliability: Messages<typeof fr> = {
  'rel.task.conflict': 'Un’altra persona della famiglia ha modificato questa attività nel frattempo. Nulla è stato sovrascritto: è mostrata la versione aggiornata, controllala e riprova.',
  'rel.task.notFound': 'Questa attività non esiste più o non ti è più accessibile.',
  'rel.queued': 'Salvato su questo telefono: sarà inviato automaticamente appena torna la connessione.',
  'rel.signOut.pending': {
    one: '{count} inserimento non è ancora stato inviato (nessuna rete). Partirà al tuo prossimo accesso su questo telefono con questo account; sarà cancellato se accede un altro account.',
    other: '{count} inserimenti non sono ancora stati inviati (nessuna rete). Partiranno al tuo prossimo accesso su questo telefono con questo account; saranno cancellati se accede un altro account.',
  },
};
