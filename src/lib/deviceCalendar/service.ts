/**
 * Calendrier de l'iPhone : règles d'usage, au-dessus d'un adaptateur (natif, ou faux dans les tests) et d'un
 * stockage local. Testé dans src/__tests__/deviceCalendar.test.ts.
 *
 * RÈGLES ABSOLUES, tenues ici et nulle part ailleurs :
 *  1. HOMI ne modifie ni ne supprime JAMAIS un événement qu'il n'a pas créé : `updateEvent` / `deleteEvent` ne sont
 *     appelés qu'avec un identifiant tiré du lien local, et seulement si l'événement relu sur le téléphone porte
 *     encore la marque HOMI du même élément ;
 *  2. un événement créé par HOMI n'est modifié ou retiré que par `update` / `remove`, appelés par un geste explicite ;
 *  3. un élément HOMI n'est jamais ajouté deux fois (lien local + verrou pendant l'écriture) ;
 *  4. rien de ce qui est lu sur le téléphone n'est enregistré ni envoyé : seuls les préférences et les liens
 *     (identifiants) sont gardés, sur cet appareil.
 */
import { buildExport, canAdd, isOutdated, keyFromMarker, sameShape, type ExportOptions, type ExportPlan, type ExportSource } from './model';
import type { CalendarAccess, CalendarLink, DeviceCalendarAdapter, DeviceCalendarInfo, DeviceCalendarPrefs, DeviceCalendarState, DeviceEvent, KeyValueStore } from './types';

/** Préfixe « toietmoi. » : effacé avec le reste des données locales à la suppression du compte (localWipe). */
export const STORAGE_KEY = 'toietmoi.deviceCalendar.v1';
const EMPTY: DeviceCalendarState = { prefs: { visibleCalendarIds: [], targetCalendarId: null }, links: {} };

export type LinkStatus =
  /** Pas dans le calendrier de l'iPhone. */
  | 'none'
  /** Ajouté, identique à HOMI. */
  | 'linked'
  /** Ajouté, mais l'élément HOMI a changé depuis : « Mettre à jour » proposé. */
  | 'outdated'
  /** Ajouté, puis supprimé à la main dans le calendrier de l'iPhone. */
  | 'missing'
  /** Lien connu, mais l'accès actuel ne permet pas de relire le calendrier (écriture seule, refus). */
  | 'unverified';

export type AddResult =
  | { status: 'added'; plan: ExportPlan; calendarId: string }
  /** Déjà dans le calendrier : rien n'a été écrit. */
  | { status: 'already'; link: CalendarLink; verified: boolean }
  | { status: 'denied'; access: CalendarAccess }
  | { status: 'noCalendar' };
export type UpdateResult = { status: 'updated'; plan: ExportPlan } | { status: 'missing' } | { status: 'notLinked' } | { status: 'notOwned' } | { status: 'denied'; access: CalendarAccess };
export type RemoveResult = { status: 'removed' } | { status: 'missing' } | { status: 'notLinked' } | { status: 'notOwned' } | { status: 'denied'; access: CalendarAccess };

export interface ServiceDeps {
  adapter: DeviceCalendarAdapter;
  store: KeyValueStore;
  /** Fuseau IANA du téléphone. */
  timeZone: () => string;
  now?: () => Date;
}

export function createDeviceCalendarService({ adapter, store, timeZone, now = () => new Date() }: ServiceDeps) {
  let state: DeviceCalendarState | null = null;
  let loading: Promise<DeviceCalendarState> | null = null;
  const listeners = new Set<() => void>();
  /** Écritures en cours, par élément HOMI : un double appui attend la première et lit son résultat. */
  const busy = new Map<string, Promise<unknown>>();

  async function load(): Promise<DeviceCalendarState> {
    if (state) return state;
    loading ??= (async () => {
      let parsed: Partial<DeviceCalendarState> | null = null;
      try { const raw = await store.getItem(STORAGE_KEY); parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
      const prefs = parsed?.prefs;
      state = {
        prefs: {
          visibleCalendarIds: Array.isArray(prefs?.visibleCalendarIds) ? prefs.visibleCalendarIds.filter((x): x is string => typeof x === 'string') : [],
          targetCalendarId: typeof prefs?.targetCalendarId === 'string' ? prefs.targetCalendarId : null,
        },
        links: parsed?.links && typeof parsed.links === 'object' ? Object.fromEntries(Object.entries(parsed.links).filter(([, l]) => !!l && typeof l.eventId === 'string' && typeof l.fingerprint === 'string')) : {},
      };
      return state;
    })();
    return loading;
  }
  async function save(next: DeviceCalendarState) {
    state = next;
    listeners.forEach((l) => l());
    await store.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }
  const setLink = async (key: string, link: CalendarLink | null) => {
    const s = await load();
    const links = { ...s.links };
    if (link) links[key] = link; else delete links[key];
    await save({ ...s, links });
  };
  /** Une seule écriture à la fois par élément HOMI. */
  function exclusive<T>(key: string, job: () => Promise<T>): Promise<T> {
    const prev = busy.get(key) ?? Promise.resolve();
    const run = prev.catch(() => undefined).then(job);
    busy.set(key, run);
    return run.finally(() => { if (busy.get(key) === run) busy.delete(key); });
  }
  const plan = (source: ExportSource, o: Partial<ExportOptions> = {}, link?: CalendarLink | null) =>
    buildExport(source, { deviceTimeZone: timeZone(), now: now(), ...o, occurrenceStart: link?.mode === 'occurrence' && link.occurrenceStart ? link.occurrenceStart : o.occurrenceStart });

  const access = async (): Promise<CalendarAccess> => (adapter.unavailable ? 'unavailable' : adapter.getAccess().catch(() => 'unavailable' as const));

  /** Calendriers du téléphone (accès complet ou écriture seule : alors un seul calendrier, celui par défaut). */
  async function calendars(): Promise<DeviceCalendarInfo[]> {
    if (!canAdd(await access())) return [];
    return adapter.listCalendars();
  }

  /**
   * Calendriers affichés, parmi ceux qui existent encore. Un calendrier supprimé sur le téléphone sort des
   * préférences sans bruit (rien à afficher, rien à casser).
   */
  async function visibleCalendars(known?: DeviceCalendarInfo[]): Promise<DeviceCalendarInfo[]> {
    const s = await load();
    const all = known ?? await calendars();
    const ids = new Set(all.map((c) => c.id));
    const kept = s.prefs.visibleCalendarIds.filter((id) => ids.has(id));
    const targetGone = !!s.prefs.targetCalendarId && !ids.has(s.prefs.targetCalendarId);
    if (all.length && (kept.length !== s.prefs.visibleCalendarIds.length || targetGone)) {
      await save({ ...s, prefs: { visibleCalendarIds: kept, targetCalendarId: targetGone ? null : s.prefs.targetCalendarId } });
    }
    return all.filter((c) => kept.includes(c.id));
  }

  /** Lecture seule des événements des calendriers choisis. Sans accès complet : rien (jamais d'erreur à l'écran). */
  async function events(from: Date, to: Date): Promise<{ events: DeviceEvent[]; calendars: DeviceCalendarInfo[] }> {
    if ((await access()) !== 'full') return { events: [], calendars: [] };
    const cals = await visibleCalendars();
    if (!cals.length) return { events: [], calendars: [] };
    return { events: await adapter.listEvents(cals.map((c) => c.id), from, to), calendars: cals };
  }

  /** Calendrier par défaut du téléphone pour les nouveaux événements (sinon le premier calendrier modifiable). */
  async function defaultCalendar(known?: DeviceCalendarInfo[]): Promise<DeviceCalendarInfo | null> {
    const writable = (known ?? await calendars()).filter((c) => c.writable);
    const def = await adapter.defaultCalendarId().catch(() => null);
    return writable.find((c) => c.id === def) ?? writable[0] ?? null;
  }

  /**
   * Calendrier où HOMI ajoute : celui choisi s'il existe encore et accepte l'écriture, sinon le calendrier par
   * défaut du téléphone, sinon le premier calendrier modifiable.
   */
  async function targetCalendar(preferredId?: string | null): Promise<{ calendar: DeviceCalendarInfo | null; fellBack: boolean }> {
    const s = await load();
    const all = await calendars();
    const wanted = preferredId ?? s.prefs.targetCalendarId;
    const chosen = wanted ? all.find((c) => c.id === wanted && c.writable) : undefined;
    if (chosen) return { calendar: chosen, fellBack: false };
    return { calendar: await defaultCalendar(all), fellBack: !!wanted };
  }

  /** L'événement iOS du lien, s'il existe encore ET porte toujours la marque HOMI de cet élément. */
  async function owned(key: string, link: CalendarLink): Promise<{ event: DeviceEvent | null; owned: boolean }> {
    const event = await adapter.getEvent(link.eventId);
    return { event, owned: !!event && keyFromMarker(event.url) === key };
  }

  /** État du lien d'un élément HOMI. Avec l'accès complet, on relit le téléphone (détection d'une suppression à la main). */
  async function status(source: ExportSource, o: Partial<ExportOptions> = {}): Promise<{ status: LinkStatus; link: CalendarLink | null; plan: ExportPlan }> {
    const s = await load();
    const first = plan(source, o);
    const link = s.links[first.key] ?? null;
    if (!link) return { status: 'none', link: null, plan: first };
    const p = plan(source, o, link);
    if ((await access()) !== 'full') return { status: 'unverified', link, plan: p };
    const event = await adapter.getEvent(link.eventId);
    if (!event) return { status: 'missing', link, plan: p };
    return { status: isOutdated(link, p) ? 'outdated' : 'linked', link, plan: p };
  }

  /** Ajoute l'élément HOMI au calendrier. Jamais deux fois : un lien existant renvoie « déjà dans le calendrier ». */
  function add(source: ExportSource, o: Partial<ExportOptions> & { calendarId?: string | null } = {}): Promise<AddResult> {
    const first = plan(source, o);
    return exclusive(first.key, async () => {
      const a = await access();
      if (!canAdd(a)) return { status: 'denied', access: a };
      const s = await load();
      const link = s.links[first.key];
      if (link) {
        // Écriture seule : impossible de relire, donc on fait confiance au lien — jamais de doublon
        if (a !== 'full') return { status: 'already', link, verified: false };
        if (await adapter.getEvent(link.eventId)) return { status: 'already', link, verified: true };
        // supprimé à la main sur le téléphone : l'ancien lien ne vaut plus rien, on recrée
      }
      const { calendar } = await targetCalendar(o.calendarId);
      if (!calendar) return { status: 'noCalendar' };
      const eventId = await adapter.createEvent(calendar.id, first.input);
      await setLink(first.key, linkOf(first, eventId, calendar.id));
      return { status: 'added', plan: first, calendarId: calendar.id };
    });
  }

  const linkOf = (p: ExportPlan, eventId: string, calendarId: string): CalendarLink => ({
    eventId, calendarId, fingerprint: p.fingerprint, mode: p.mode, allDay: p.input.allDay, ...(p.occurrenceStart ? { occurrenceStart: p.occurrenceStart } : {}), savedAt: now().toISOString(),
  });

  /** Geste explicite « Mettre à jour » : réécrit l'événement iOS créé par HOMI avec l'état actuel de l'élément. */
  function update(source: ExportSource, o: Partial<ExportOptions> = {}): Promise<UpdateResult> {
    const key = plan(source, o).key;
    return exclusive(key, async () => {
      const a = await access();
      if (a !== 'full') return { status: 'denied', access: a };
      const link = (await load()).links[key];
      if (!link) return { status: 'notLinked' };
      const check = await owned(key, link);
      if (!check.event) return { status: 'missing' };
      if (!check.owned) return { status: 'notOwned' };
      const p = plan(source, o, link);
      if (sameShape(link, p)) {
        await adapter.updateEvent(link.eventId, p.input);
        await setLink(key, linkOf(p, link.eventId, check.event.calendarId || link.calendarId));
        return { status: 'updated', plan: p };
      }
      // Série ↔ date seule, journée entière ↔ horaire : on retire l'ancien (créé par HOMI) puis on recrée.
      // Dans cet ordre : un échec au milieu laisse zéro événement et aucun lien, jamais un doublon.
      const fresh = plan(source, o);
      await adapter.deleteEvent(link.eventId);
      await setLink(key, null);
      const all = await calendars();
      const calendarId = all.find((c) => c.id === link.calendarId && c.writable)?.id ?? (await targetCalendar()).calendar?.id;
      if (!calendarId) return { status: 'missing' };
      const eventId = await adapter.createEvent(calendarId, fresh.input);
      await setLink(key, linkOf(fresh, eventId, calendarId));
      return { status: 'updated', plan: fresh };
    });
  }

  /** Geste explicite « Retirer du calendrier » : supprime l'événement iOS créé par HOMI, puis le lien. */
  function remove(key: string): Promise<RemoveResult> {
    return exclusive(key, async () => {
      const a = await access();
      if (a !== 'full') return { status: 'denied', access: a };
      const link = (await load()).links[key];
      if (!link) return { status: 'notLinked' };
      const check = await owned(key, link);
      if (!check.event) { await setLink(key, null); return { status: 'missing' }; }
      if (!check.owned) return { status: 'notOwned' };
      await adapter.deleteEvent(link.eventId);
      await setLink(key, null);
      return { status: 'removed' };
    });
  }

  /** Oublie le lien sans toucher au calendrier de l'iPhone (événement supprimé à la main, ou accès en écriture seule). */
  const forget = (key: string) => exclusive(key, () => setLink(key, null));

  async function setPrefs(patch: Partial<DeviceCalendarPrefs>) {
    const s = await load();
    await save({ ...s, prefs: { ...s.prefs, ...patch, ...(patch.visibleCalendarIds ? { visibleCalendarIds: [...new Set(patch.visibleCalendarIds)] } : {}) } });
  }

  return {
    load, access, requestAccess: async (): Promise<CalendarAccess> => (adapter.unavailable ? 'unavailable' : adapter.requestAccess()),
    unavailable: () => adapter.unavailable,
    calendars, visibleCalendars, events, defaultCalendar, targetCalendar, status, add, update, remove, forget, setPrefs,
    snapshot: () => state ?? EMPTY,
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export type DeviceCalendarService = ReturnType<typeof createDeviceCalendarService>;
