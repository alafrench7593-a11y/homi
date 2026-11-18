/**
 * Adaptateur natif du calendrier de l'iPhone (EventKit, via expo-calendar 57).
 *
 * - Chargé À LA DEMANDE, sous try/catch : une version de l'appli compilée sans le module, Expo Go, le web ou
 *   Android ne plantent pas — le calendrier est simplement « indisponible ».
 * - Inerte hors iPhone et en démonstration (la famille d'exemple ne lit ni n'écrit rien sur le téléphone).
 * - Deux API d'expo-calendar, chacune pour ce qu'elle fait de sûr :
 *     · l'API objet (`expo-calendar`) : autorisations (accès complet / écriture seule, iOS 17+), calendriers,
 *       création d'un événement (elle fonctionne aussi en écriture seule) ;
 *     · l'API historique (`expo-calendar/legacy`) : lecture d'une plage, relecture / mise à jour / suppression
 *       par identifiant. L'identifiant rendu à la création est un `calendarItemIdentifier`, et c'est cette API
 *       qui le relit avec `calendarItem(withIdentifier:)` ; toute la série d'un événement répété est visée.
 * - Ce fichier ne contient aucune règle : elles sont dans service.ts (testé). Rien ici n'est vérifiable sans iPhone.
 */
import { Platform } from 'react-native';
import { isDemo } from '@/lib/backend';
import { resolveAccess } from './model';
import type { CalendarAccess, DeviceCalendarAdapter, DeviceCalendarInfo, DeviceEvent, NativeEventInput, UnavailableReason } from './types';

type Next = typeof import('expo-calendar');
type Legacy = typeof import('expo-calendar/legacy');

let next: Next | null | undefined;
let legacy: Legacy | null | undefined;
function loadNext(): Next | null {
  if (next !== undefined) return next;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { next = require('expo-calendar') as Next; } catch { next = null; }
  return next;
}
function loadLegacy(): Legacy | null {
  if (legacy !== undefined) return legacy;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { legacy = require('expo-calendar/legacy') as Legacy; } catch { legacy = null; }
  return legacy;
}

function unavailable(): UnavailableReason | null {
  if (Platform.OS !== 'ios') return 'platform';
  if (isDemo) return 'demo';
  return loadNext() && loadLegacy() ? null : 'module';
}

const iso = (d: unknown): string => (d instanceof Date ? d.toISOString() : typeof d === 'string' ? d : '');
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

function toCalendar(c: { id: string; title?: string; color?: string | null; source?: { name?: string } | null; allowsModifications?: boolean }): DeviceCalendarInfo {
  return { id: c.id, title: c.title ?? '', color: c.color ?? null, sourceName: text(c.source?.name), writable: c.allowsModifications !== false };
}
function toEvent(e: { id: string; calendarId: string; title?: string; startDate: string | Date; endDate: string | Date; allDay?: boolean; location?: string | null; notes?: string | null; url?: string | null }): DeviceEvent {
  return { id: e.id, calendarId: e.calendarId, title: e.title ?? '', start: iso(e.startDate), end: iso(e.endDate), allDay: !!e.allDay, location: text(e.location), notes: text(e.notes), url: text(e.url) };
}

/** « Introuvable » et rien d'autre : une erreur d'accès ou de module ne doit jamais passer pour une suppression. */
function isNotFound(e: unknown): boolean {
  const code = (e as { code?: string } | null)?.code ?? '';
  const message = e instanceof Error ? e.message : String(e ?? '');
  return /EVENT_NOT_FOUND|ITEM_NO_LONGER_EXISTS/i.test(code) || /could not be found|no longer exists/i.test(message);
}

/** Détails écrits sur iOS. Dates en chaînes ISO (instants absolus) ; fuseau explicite pour un événement horaire. */
function details(i: NativeEventInput) {
  const L = loadLegacy()!;
  const frequency = { daily: L.Frequency.DAILY, weekly: L.Frequency.WEEKLY, monthly: L.Frequency.MONTHLY } as const;
  return {
    title: i.title, startDate: i.startDate, endDate: i.endDate, allDay: i.allDay, location: i.location ?? '', notes: i.notes ?? '', url: i.url,
    alarms: i.alarms.map((a) => ({ relativeOffset: a.relativeOffset })),
    ...(i.timeZone && !i.allDay ? { timeZone: i.timeZone } : {}),
    ...(i.recurrenceRule ? { recurrenceRule: { frequency: frequency[i.recurrenceRule.frequency], interval: i.recurrenceRule.interval, ...(i.recurrenceRule.endDate ? { endDate: i.recurrenceRule.endDate } : {}) } } : {}),
  };
}

async function getAccess(): Promise<CalendarAccess> {
  const N = loadNext();
  if (!N) return 'unavailable';
  const full = await N.getCalendarPermissions(false);
  if (full.granted) return 'full';
  // Écriture seule : question séparée (iOS 17+). Une erreur ici ne change rien à la réponse « accès complet ».
  const writeOnly = await N.getCalendarPermissions(true).catch(() => null);
  return resolveAccess(full, writeOnly);
}

export const nativeAdapter: DeviceCalendarAdapter = {
  get unavailable() { return unavailable(); },
  getAccess,
  async requestAccess() {
    const N = loadNext();
    if (!N) return 'unavailable';
    // iOS n'affiche sa demande qu'une fois ; ensuite, seul Réglages change la réponse
    await N.requestCalendarPermissions(false);
    return getAccess();
  },
  async listCalendars() {
    const N = loadNext()!;
    if ((await getAccess()) === 'writeOnly') {
      // Écriture seule : iOS ne montre qu'un calendrier virtuel, celui où il range les ajouts
      const c = N.getDefaultCalendarSync();
      return [{ ...toCalendar(c), writable: true }];
    }
    return (await N.getCalendars(N.EntityTypes.EVENT)).map(toCalendar);
  },
  async defaultCalendarId() {
    try { return loadNext()!.getDefaultCalendarSync().id ?? null; } catch { return null; }
  },
  async listEvents(calendarIds, from, to) {
    if (!calendarIds.length) return [];
    try {
      return (await loadLegacy()!.getEventsAsync(calendarIds, from, to)).map(toEvent);
    } catch (e) {
      // Repli sur l'API récente si l'ancienne lecture échoue sur cet appareil
      const N = loadNext();
      if (!N) throw e;
      const list = await N.listEvents(calendarIds, from, to);
      return list.map((ev) => toEvent(ev as unknown as Parameters<typeof toEvent>[0]));
    }
  },
  async getEvent(id) {
    try { return toEvent(await loadLegacy()!.getEventAsync(id)); } catch (e) { if (isNotFound(e)) return null; throw e; }
  },
  async createEvent(calendarId, input) {
    const N = loadNext()!;
    const calendar = await N.ExpoCalendar.get(calendarId);
    const created = await calendar.createEvent(details(input));
    if (!created?.id) throw new Error('expo-calendar: created event has no id');
    return created.id;
  },
  async updateEvent(id, input) {
    await loadLegacy()!.updateEventAsync(id, details(input), { futureEvents: true });
  },
  async deleteEvent(id) {
    await loadLegacy()!.deleteEventAsync(id, { futureEvents: true });
  },
};

/** Fuseau IANA du téléphone (« Europe/Paris »). */
export function deviceTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'; } catch { return 'Europe/Paris'; }
}
