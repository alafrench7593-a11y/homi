/**
 * Calendrier de l'iPhone : logique pure (aucun appel natif, aucun stockage) — testée dans
 * src/__tests__/deviceCalendar.test.ts.
 *
 *  - état de l'autorisation à partir des deux réponses d'iOS (accès complet / écriture seule) ;
 *  - conversion d'un événement ou d'un rendez-vous HOMI en événement iOS : instants absolus + fuseau explicite,
 *    journées entières sans décalage d'un jour, récurrences exportées seulement quand elles sont fidèles ;
 *  - empreinte de ce qui a été écrit (pour voir que l'élément HOMI a changé depuis) ;
 *  - marque de propriété HOMI et fusion des événements du téléphone dans l'agenda (lecture seule).
 */
import { BRAND } from '@/config/brand';
import { localStamp, occurrences, type FamilyEvent } from '@/lib/domain/calendar';
import type { CalendarAccess, CalendarLink, DeviceCalendarInfo, DeviceEvent, ExportMode, NativeEventInput, NativeRecurrence } from './types';

// ------------------------------------------------------------------ autorisation
export interface PermissionLike { granted?: boolean; status?: string; canAskAgain?: boolean }

/**
 * iOS 17+ distingue « accès complet » et « ajouter des événements uniquement ». expo-calendar répond à deux
 * questions séparées ; l'écriture seule est « refusée » du point de vue de l'accès complet.
 */
export function resolveAccess(full: PermissionLike | null | undefined, writeOnly: PermissionLike | null | undefined): CalendarAccess {
  if (full?.granted || full?.status === 'granted') return 'full';
  if (writeOnly?.granted || writeOnly?.status === 'granted') return 'writeOnly';
  if (!full || full.status === 'undetermined') return 'notAsked';
  return 'denied';
}

export const canRead = (a: CalendarAccess) => a === 'full';
export const canAdd = (a: CalendarAccess) => a === 'full' || a === 'writeOnly';

// ------------------------------------------------------------------ clés et marque de propriété
export type HomiKind = 'event' | 'appointment';
export const homiKey = (kind: HomiKind, id: string) => `${kind}:${id}`;

const MARKER_BASE = `${BRAND.scheme}://calendar?ref=`;
/** Lien posé sur l'événement iOS créé par HOMI : marque de propriété, et retour vers l'agenda en un appui. */
export const markerUrl = (key: string) => `${MARKER_BASE}${key.replace(':', '-')}`;
/** Clé HOMI lue dans le lien d'un événement iOS, ou null si ce n'est pas un événement créé par HOMI. */
export function keyFromMarker(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(MARKER_BASE)) return null;
  const m = url.slice(MARKER_BASE.length).match(/^(event|appointment)-([A-Za-z0-9-]{1,64})$/);
  return m ? `${m[1]}:${m[2]}` : null;
}

// ------------------------------------------------------------------ fuseaux
export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz || typeof tz !== 'string') return false;
  try { new Intl.DateTimeFormat('en-GB', { timeZone: tz }).format(0); return true; } catch { return false; }
}

const stampToUtc = (s: string) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)), Number(s.slice(9, 11)), Number(s.slice(11, 13)), Number(s.slice(13, 15)));

/** Jour civil (« AAAA-MM-JJ ») d'un instant dans un fuseau. */
export function dayInZone(iso: string, timeZone: string): string {
  const s = localStamp(iso, timeZone);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
const isMidnightIn = (iso: string, timeZone: string) => localStamp(iso, timeZone).slice(9) === '000000';

/**
 * Instant absolu d'une heure murale dans un fuseau (changement d'heure compris). Une heure qui n'existe pas
 * (passage à l'heure d'été) donne l'instant juste après le saut.
 */
export function zonedTimeToInstant(day: string, h: number, m: number, s: number, timeZone: string): Date {
  const [y, mo, d] = day.split('-').map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, m, s);
  let guess = wall;
  let previous = wall;
  for (let i = 0; i < 4; i++) {
    const seen = stampToUtc(localStamp(new Date(guess).toISOString(), timeZone));
    if (seen === wall) return new Date(guess);
    previous = guess;
    guess += wall - seen;
  }
  // Heure inexistante : les essais oscillent autour du saut, on garde le plus tardif
  return new Date(Math.max(guess, previous));
}

/**
 * Jour d'une « journée entière » HOMI. L'application l'enregistre à minuit du téléphone qui l'a saisie : on lit
 * donc le jour dans le fuseau où cet instant EST minuit (fuseau de l'événement, sinon celui du téléphone).
 * Lire le jour dans un autre fuseau décalerait l'événement d'un jour.
 */
export function allDayDate(iso: string, eventTimeZone: string, deviceTimeZone: string): string {
  if (isMidnightIn(iso, eventTimeZone)) return dayInZone(iso, eventTimeZone);
  if (isMidnightIn(iso, deviceTimeZone)) return dayInZone(iso, deviceTimeZone);
  return dayInZone(iso, eventTimeZone);
}

// ------------------------------------------------------------------ export HOMI → iOS
export type ExportSource =
  | { kind: 'event'; event: Pick<FamilyEvent, 'id' | 'title' | 'starts_at' | 'ends_at' | 'all_day' | 'location_label' | 'recurrence' | 'timezone'> }
  | {
    kind: 'appointment';
    appointment: { id: string; title: string; starts_at: string; location_label: string | null };
    /** Rappel HOMI du rendez-vous, en minutes avant ; 0 = aucun. */
    leadMinutes?: number;
  };

export interface ExportOptions {
  /** Fuseau IANA du téléphone. */
  deviceTimeZone: string;
  now?: Date;
  /** Occurrence à exporter quand la récurrence ne peut pas l'être fidèlement (celle touchée, ou celle déjà exportée). */
  occurrenceStart?: string | null;
  /** Texte libre ajouté aux notes de l'événement iOS (« Pour Léa · ajouté depuis HOMI »). Hors empreinte. */
  notes?: string | null;
}

/** Pourquoi la récurrence n'a pas été exportée telle quelle. */
export type RecurrenceLimit = 'monthEnd' | 'unknown';

export interface ExportPlan {
  key: string;
  input: NativeEventInput;
  mode: ExportMode;
  /** Renseigné en mode « occurrence » : la série n'est pas représentable fidèlement, seule cette date est exportée. */
  limit: RecurrenceLimit | null;
  occurrenceStart: string | null;
  fingerprint: string;
}

const HOUR = 3600000;
const clampEvery = (n: number | undefined) => Math.max(1, Math.min(12, Math.floor(n ?? 1) || 1));

/**
 * Récurrence HOMI → règle iOS, seulement si le calendrier de l'iPhone donnera exactement les mêmes dates que HOMI :
 *  - chaque jour / chaque semaine (avec intervalle) : oui ;
 *  - chaque mois le 1er…28 : oui ; le 29, 30 ou 31 : NON — HOMI saute les mois trop courts, et ce comportement
 *    n'est pas garanti côté calendrier ; on exporte alors la seule occurrence choisie, et on le dit ;
 *  - type inconnu (donnée plus récente que cette version) : une occurrence.
 */
export function recurrenceFor(e: Pick<FamilyEvent, 'starts_at' | 'recurrence'>, deviceTimeZone: string): { rule: NativeRecurrence | null; limit: RecurrenceLimit | null; until: string | null } {
  const r = e.recurrence;
  if (!r) return { rule: null, limit: null, until: null };
  const until = r.until && /^\d{4}-\d{2}-\d{2}$/.test(r.until) ? r.until : null;
  if (r.type !== 'daily' && r.type !== 'weekly' && r.type !== 'monthly') return { rule: null, limit: 'unknown', until };
  if (r.type === 'monthly' && Number(dayInZone(e.starts_at, deviceTimeZone).slice(8)) > 28) return { rule: null, limit: 'monthEnd', until };
  const rule: NativeRecurrence = { frequency: r.type, interval: clampEvery(r.every) };
  if (until) rule.endDate = zonedTimeToInstant(until, 23, 59, 59, deviceTimeZone).toISOString();
  return { rule, limit: null, until };
}

/** Prochaine occurrence à partir de maintenant (sinon la première), pour l'export d'une seule date. */
function pickOccurrence(e: Pick<FamilyEvent, 'starts_at' | 'ends_at' | 'recurrence'>, now: Date, wanted?: string | null): string {
  if (wanted && !Number.isNaN(Date.parse(wanted))) return new Date(wanted).toISOString();
  const next = occurrences(e, now, new Date(now.getTime() + 400 * 24 * HOUR))[0];
  return next?.starts ?? new Date(e.starts_at).toISOString();
}

export function buildExport(source: ExportSource, o: ExportOptions): ExportPlan {
  const deviceTz = isValidTimeZone(o.deviceTimeZone) ? o.deviceTimeZone : 'UTC';
  const now = o.now ?? new Date();
  if (source.kind === 'appointment') {
    const a = source.appointment;
    const key = homiKey('appointment', a.id);
    const start = new Date(a.starts_at).toISOString();
    const lead = Math.max(0, Math.round(source.leadMinutes ?? 0));
    const input: NativeEventInput = {
      title: a.title, startDate: start, endDate: new Date(Date.parse(start) + HOUR).toISOString(), allDay: false, timeZone: deviceTz,
      location: a.location_label ?? null, notes: o.notes ?? null, url: markerUrl(key), alarms: lead ? [{ relativeOffset: -lead }] : [], recurrenceRule: null,
    };
    return { key, input, mode: 'single', limit: null, occurrenceStart: null, fingerprint: fingerprintOf(input, null, null) };
  }

  const e = source.event;
  const key = homiKey('event', e.id);
  const eventTz = isValidTimeZone(e.timezone) ? e.timezone : deviceTz;
  const { rule, limit, until } = recurrenceFor(e, deviceTz);
  // Série dont la fin précède le début : HOMI n'affiche qu'une date au plus, on n'exporte pas de règle
  const endsBeforeStart = !!rule?.endDate && Date.parse(rule.endDate) < Date.parse(e.starts_at);
  const mode: ExportMode = limit ? 'occurrence' : rule && !endsBeforeStart ? 'series' : 'single';
  const occurrenceStart = mode === 'occurrence' ? pickOccurrence(e, now, o.occurrenceStart) : null;
  const duration = e.ends_at && Date.parse(e.ends_at) > Date.parse(e.starts_at) ? Date.parse(e.ends_at) - Date.parse(e.starts_at) : null;
  const start = occurrenceStart ?? new Date(e.starts_at).toISOString();

  let input: NativeEventInput;
  let days: [string, string] | null = null;
  if (e.all_day) {
    const first = allDayDate(start, eventTz, deviceTz);
    // Fin exclusive à minuit (« du 10 au 12 » enregistré jusqu'au 13 à 0 h) : dernier jour = la veille
    const last = duration ? allDayDate(new Date(Date.parse(start) + duration - 1).toISOString(), eventTz, deviceTz) : first;
    days = [first, last < first ? first : last];
    input = {
      title: e.title, allDay: true, location: e.location_label ?? null, notes: o.notes ?? null, url: markerUrl(key), alarms: [],
      // iOS lit une journée entière dans le fuseau du téléphone : minuit → 23:59:59 du bon jour, sans fuseau attaché
      startDate: zonedTimeToInstant(days[0], 0, 0, 0, deviceTz).toISOString(),
      endDate: zonedTimeToInstant(days[1], 23, 59, 59, deviceTz).toISOString(),
      recurrenceRule: mode === 'series' ? rule : null,
    };
  } else {
    input = {
      title: e.title, allDay: false, timeZone: eventTz, location: e.location_label ?? null, notes: o.notes ?? null, url: markerUrl(key), alarms: [],
      startDate: start, endDate: new Date(Date.parse(start) + (duration ?? HOUR)).toISOString(),
      recurrenceRule: mode === 'series' ? rule : null,
    };
  }
  return { key, input, mode, limit, occurrenceStart, fingerprint: fingerprintOf(input, days, mode === 'series' ? until : null) };
}

/**
 * Empreinte de ce qui est écrit dans le calendrier. Sans les notes (elles suivent la langue de l'appli) ; une
 * journée entière y figure par ses jours, pas par ses instants (qui suivent le fuseau du téléphone en voyage).
 */
function fingerprintOf(i: NativeEventInput, days: [string, string] | null, until: string | null): string {
  return digest(JSON.stringify([
    i.title, i.allDay ? 1 : 0, days ? days[0] : i.startDate, days ? days[1] : i.endDate, i.timeZone ?? '', i.location ?? '',
    i.alarms.map((a) => a.relativeOffset), i.recurrenceRule ? [i.recurrenceRule.frequency, i.recurrenceRule.interval, until ?? ''] : 0,
  ]));
}

/** Condensé court (FNV-1a, deux graines) : le lien enregistré ne contient ni titre ni lieu, seulement cette empreinte. */
function digest(text: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x85ebca6b) + i;
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}

/** Le lien existe ; l'élément HOMI a-t-il changé depuis l'ajout au calendrier ? */
export const isOutdated = (link: CalendarLink, plan: ExportPlan) => link.fingerprint !== plan.fingerprint;

/** Une mise à jour sur place suffit-elle ? Sinon (série ↔ date seule, journée entière ↔ horaire) : retirer puis recréer. */
export const sameShape = (link: CalendarLink, plan: ExportPlan) => link.mode === plan.mode && link.allDay === plan.input.allDay;

// ------------------------------------------------------------------ lecture : téléphone → agenda HOMI
/** Événement du téléphone prêt pour l'agenda : mêmes champs utiles que les éléments HOMI, source distincte. */
export interface DeviceAgendaItem {
  key: string; source: 'device'; refId: string; title: string; starts: string; ends: string; allDay: boolean;
  location: string | null; calendarId: string; calendarTitle: string; calendarColor: string | null; notes: string | null;
}

/**
 * Événements du téléphone à montrer dans l'agenda. Ceux que HOMI a lui-même ajoutés au calendrier (lien local, ou
 * marque HOMI d'un élément connu du foyer) sont écartés : ils y sont déjà, sous leur forme HOMI.
 */
export function toAgendaItems(events: DeviceEvent[], calendars: DeviceCalendarInfo[], links: Record<string, CalendarLink>, knownHomiKeys: ReadonlySet<string> = new Set()): DeviceAgendaItem[] {
  const mine = new Set(Object.values(links).map((l) => l.eventId));
  const byId = new Map(calendars.map((c) => [c.id, c]));
  const out: DeviceAgendaItem[] = [];
  for (const ev of events) {
    if (mine.has(ev.id)) continue;
    const marked = keyFromMarker(ev.url);
    if (marked && knownHomiKeys.has(marked)) continue;
    if (Number.isNaN(Date.parse(ev.start))) continue;
    const end = Number.isNaN(Date.parse(ev.end)) || Date.parse(ev.end) < Date.parse(ev.start) ? ev.start : ev.end;
    const cal = byId.get(ev.calendarId);
    out.push({
      key: `device:${ev.id}:${ev.start}`, source: 'device', refId: ev.id, title: ev.title, starts: new Date(ev.start).toISOString(), ends: new Date(end).toISOString(),
      allDay: ev.allDay, location: ev.location, calendarId: ev.calendarId, calendarTitle: cal?.title ?? '', calendarColor: cal?.color ?? null, notes: ev.notes,
    });
  }
  return out;
}

/** Tri commun de l'agenda : journées entières d'abord, puis par heure, puis par titre. */
export function sortAgenda<T extends { allDay: boolean; starts: string; title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.allDay === b.allDay ? (a.starts < b.starts ? -1 : a.starts > b.starts ? 1 : a.title.localeCompare(b.title)) : a.allDay ? -1 : 1));
}
