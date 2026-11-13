import type { reliability as fr } from '../fr/reliability';
import type { Messages } from '../types';

export const reliability: Messages<typeof fr> = {
  'rel.task.conflict': 'Eine andere Person im Haushalt hat diese Aufgabe inzwischen geändert. Nichts wurde überschrieben: Die aktuelle Version wird angezeigt, prüfe sie und versuche es erneut.',
  'rel.task.notFound': 'Diese Aufgabe gibt es nicht mehr oder sie ist für dich nicht mehr zugänglich.',
  'rel.queued': 'Auf diesem Telefon gespeichert: wird automatisch gesendet, sobald die Verbindung zurück ist.',
  'rel.signOut.pending': {
    one: '{count} Eintrag wurde noch nicht gesendet (kein Netz). Er wird bei deiner nächsten Anmeldung mit diesem Konto auf diesem Telefon gesendet; er wird gelöscht, wenn sich ein anderes Konto anmeldet.',
    other: '{count} Einträge wurden noch nicht gesendet (kein Netz). Sie werden bei deiner nächsten Anmeldung mit diesem Konto auf diesem Telefon gesendet; sie werden gelöscht, wenn sich ein anderes Konto anmeldet.',
  },
};
