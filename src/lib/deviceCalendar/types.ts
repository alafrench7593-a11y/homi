/**
 * Calendrier de l'iPhone (EventKit) : types partagés par la logique pure, l'adaptateur natif et l'interface.
 * Rien ici ne dépend d'Expo : la logique se teste sans téléphone, avec un faux adaptateur.
 */

/**
 * État de l'autorisation, vu de HOMI :
 *  - `unavailable` : pas d'iPhone (web, Android), démonstration, ou module natif absent de cette version ;
 *  - `notAsked` : jamais demandée ; `denied` : refusée ou restreinte (à changer dans Réglages) ;
 *  - `writeOnly` : « Ajouter des événements uniquement » (iOS 17+) : HOMI peut ajouter, mais ne peut ni lire,
 *    ni vérifier, ni modifier, ni retirer ; `full` : accès complet.
 */
export type CalendarAccess = 'unavailable' | 'notAsked' | 'denied' | 'writeOnly' | 'full';
export type UnavailableReason = 'platform' | 'demo' | 'module';

export interface DeviceCalendarInfo {
  id: string;
  title: string;
  color: string | null;
  /** Compte d'où vient le calendrier (iCloud, Google, « Sur mon iPhone »…). */
  sourceName: string | null;
  writable: boolean;
}

/** Un événement lu sur le téléphone. Jamais enregistré, jamais envoyé au serveur. */
export interface DeviceEvent {
  id: string;
  calendarId: string;
  title: string;
  /** Instants absolus (ISO 8601). */
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  /** Lien de l'événement : porte la marque HOMI quand c'est HOMI qui l'a créé. */
  url: string | null;
}

export interface NativeRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  /** Dernier instant de la série (ISO), absent = sans fin. */
  endDate?: string;
}

/** Ce que HOMI écrit dans le calendrier de l'iPhone. */
export interface NativeEventInput {
  title: string;
  /** Instants absolus (ISO 8601). Journée entière : minuit et 23:59:59 du téléphone, pour le bon jour. */
  startDate: string;
  endDate: string;
  allDay: boolean;
  /** Fuseau IANA explicite des événements horaires ; absent pour une journée entière (date « flottante »). */
  timeZone?: string;
  location: string | null;
  notes: string | null;
  /** Marque de propriété HOMI (et lien de retour vers l'agenda). */
  url: string;
  /** Minutes par rapport au début (négatif = avant). */
  alarms: { relativeOffset: number }[];
  recurrenceRule: NativeRecurrence | null;
}

/** Tout ce qui touche au téléphone passe par cette interface (adaptateur natif, ou faux adaptateur dans les tests). */
export interface DeviceCalendarAdapter {
  /** Raison pour laquelle rien n'est possible ici ; null = le calendrier du téléphone est joignable. */
  unavailable: UnavailableReason | null;
  getAccess(): Promise<CalendarAccess>;
  requestAccess(): Promise<CalendarAccess>;
  listCalendars(): Promise<DeviceCalendarInfo[]>;
  defaultCalendarId(): Promise<string | null>;
  listEvents(calendarIds: string[], from: Date, to: Date): Promise<DeviceEvent[]>;
  /** null = l'événement n'existe plus sur le téléphone. Toute autre erreur est levée (jamais confondue avec « supprimé »). */
  getEvent(id: string): Promise<DeviceEvent | null>;
  createEvent(calendarId: string, input: NativeEventInput): Promise<string>;
  updateEvent(id: string, input: NativeEventInput): Promise<void>;
  deleteEvent(id: string): Promise<void>;
}

/** Stockage local (AsyncStorage) : une seule clé, du JSON. */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type ExportMode = 'single' | 'series' | 'occurrence';

/** Lien local « élément HOMI ↔ événement iOS créé par HOMI ». Reste sur ce téléphone. */
export interface CalendarLink {
  eventId: string;
  calendarId: string;
  /** Empreinte de ce qui a été écrit : sert à voir que l'élément HOMI a changé depuis. */
  fingerprint: string;
  mode: ExportMode;
  allDay: boolean;
  /** Mode « occurrence » : l'occurrence exportée (ISO). */
  occurrenceStart?: string;
  savedAt: string;
}

export interface DeviceCalendarPrefs {
  /** Calendriers du téléphone affichés dans l'agenda HOMI (choix de l'utilisateur, par appareil). */
  visibleCalendarIds: string[];
  /** Calendrier où HOMI ajoute ; null = calendrier par défaut du téléphone. */
  targetCalendarId: string | null;
}

export interface DeviceCalendarState {
  prefs: DeviceCalendarPrefs;
  links: Record<string, CalendarLink>;
}
