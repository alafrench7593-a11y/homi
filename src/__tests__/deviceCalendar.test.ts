/**
 * Calendrier de l'iPhone — logique pure (aucun module natif chargé) : autorisations, fuseaux, journées entières,
 * récurrences, anti-doublon, mise à jour, événement ou calendrier supprimé à la main, règles de propriété.
 * Les tests tournent en heure de Paris (scripts/jest-global-setup.js).
 */
import {
  allDayDate, buildExport, dayInZone, homiKey, isValidTimeZone, keyFromMarker, markerUrl, recurrenceFor, resolveAccess, toAgendaItems, zonedTimeToInstant,
  type ExportSource,
} from '@/lib/deviceCalendar/model';
import { createDeviceCalendarService, STORAGE_KEY } from '@/lib/deviceCalendar/service';
import type { CalendarAccess, DeviceCalendarAdapter, DeviceCalendarInfo, DeviceEvent, KeyValueStore, NativeEventInput, UnavailableReason } from '@/lib/deviceCalendar/types';
import type { FamilyEvent } from '@/lib/domain/calendar';

const PARIS = 'Europe/Paris';
const NOW = new Date('2026-11-17T09:00:00Z');

const event = (over: Partial<FamilyEvent> = {}): FamilyEvent => ({
  id: 'e1', household_id: 'h1', child_id: null, kind: 'activity', title: 'Piscine', starts_at: '2026-11-20T17:00:00.000Z', ends_at: '2026-11-20T18:00:00.000Z',
  all_day: false, location_label: 'Bassin nord', notes: 'privé', recurrence: null, timezone: PARIS, created_by: 'u1', created_at: '2026-11-01T00:00:00Z', ...over,
});
const evSource = (over: Partial<FamilyEvent> = {}): ExportSource => ({ kind: 'event', event: event(over) });
const apptSource = (lead = 60, over: Partial<{ id: string; title: string; starts_at: string; location_label: string | null }> = {}): ExportSource => ({
  kind: 'appointment', appointment: { id: 'a1', title: 'Pédiatre', starts_at: '2026-11-24T14:30:00.000Z', location_label: 'Cabinet', ...over }, leadMinutes: lead,
});
const plan = (s: ExportSource, tz = PARIS, extra: { occurrenceStart?: string } = {}) => buildExport(s, { deviceTimeZone: tz, now: NOW, ...extra });

// ------------------------------------------------------------------ faux téléphone
interface Phone {
  access: CalendarAccess; unavailable: UnavailableReason | null; calendars: DeviceCalendarInfo[]; defaultId: string | null;
  events: Map<string, DeviceEvent & { input?: NativeEventInput }>; calls: string[]; failGet?: Error; failCreate?: Error; createDelay?: number;
}
function fakePhone(over: Partial<Phone> = {}) {
  const phone: Phone = {
    access: 'full', unavailable: null, defaultId: 'cal-home', events: new Map(), calls: [],
    calendars: [
      { id: 'cal-home', title: 'Maison', color: '#FF0000', sourceName: 'iCloud', writable: true },
      { id: 'cal-work', title: 'Travail', color: '#0000FF', sourceName: 'Google', writable: true },
      { id: 'cal-holidays', title: 'Jours fériés', color: null, sourceName: 'Abonnements', writable: false },
    ],
    ...over,
  };
  let seq = 0;
  const adapter: DeviceCalendarAdapter = {
    get unavailable() { return phone.unavailable; },
    getAccess: async () => phone.access,
    requestAccess: async () => { phone.calls.push('request'); if (phone.access === 'notAsked') phone.access = 'full'; return phone.access; },
    listCalendars: async () => (phone.access === 'writeOnly' ? [{ id: 'virtual', title: 'Calendrier', color: null, sourceName: null, writable: true }] : phone.calendars),
    defaultCalendarId: async () => (phone.access === 'writeOnly' ? 'virtual' : phone.defaultId),
    listEvents: async (ids, from, to) => { phone.calls.push(`list:${ids.join(',')}`); return [...phone.events.values()].filter((e) => ids.includes(e.calendarId) && Date.parse(e.start) < to.getTime() && Date.parse(e.end) > from.getTime()); },
    getEvent: async (id) => { phone.calls.push(`get:${id}`); if (phone.failGet) throw phone.failGet; return phone.events.get(id) ?? null; },
    createEvent: async (calendarId, input) => {
      phone.calls.push(`create:${calendarId}`);
      if (phone.createDelay) await new Promise((r) => setTimeout(r, phone.createDelay));
      if (phone.failCreate) throw phone.failCreate;
      const id = `ios-${++seq}`;
      phone.events.set(id, { id, calendarId, title: input.title, start: input.startDate, end: input.endDate, allDay: input.allDay, location: input.location, notes: input.notes, url: input.url, input });
      return id;
    },
    updateEvent: async (id, input) => {
      phone.calls.push(`update:${id}`);
      const cur = phone.events.get(id)!;
      phone.events.set(id, { ...cur, title: input.title, start: input.startDate, end: input.endDate, allDay: input.allDay, location: input.location, url: input.url, input });
    },
    deleteEvent: async (id) => { phone.calls.push(`delete:${id}`); phone.events.delete(id); },
  };
  const mem = new Map<string, string>();
  const store: KeyValueStore = { getItem: async (k) => mem.get(k) ?? null, setItem: async (k, v) => { mem.set(k, v); } };
  const service = createDeviceCalendarService({ adapter, store, timeZone: () => PARIS, now: () => NOW });
  const writes = () => phone.calls.filter((c) => /^(create|update|delete):/.test(c));
  return { phone, service, mem, store, adapter, writes };
}
const external = (id: string, over: Partial<DeviceEvent> = {}): DeviceEvent => ({
  id, calendarId: 'cal-work', title: 'Réunion', start: '2026-11-20T09:00:00.000Z', end: '2026-11-20T10:00:00.000Z', allDay: false, location: null, notes: null, url: null, ...over,
});

// ------------------------------------------------------------------ autorisations
describe('autorisation : non demandée, refusée, accès complet, écriture seule', () => {
  it('lit l’état à partir des deux réponses d’iOS', () => {
    expect(resolveAccess({ status: 'undetermined', granted: false }, { status: 'undetermined', granted: false })).toBe('notAsked');
    expect(resolveAccess({ status: 'granted', granted: true }, { status: 'granted', granted: true })).toBe('full');
    // « Ajouter des événements uniquement » : refusé pour l'accès complet, accordé pour l'écriture seule
    expect(resolveAccess({ status: 'denied', granted: false }, { status: 'granted', granted: true })).toBe('writeOnly');
    expect(resolveAccess({ status: 'denied', granted: false }, { status: 'denied', granted: false })).toBe('denied');
    expect(resolveAccess({ status: 'denied', granted: false }, null)).toBe('denied');
    expect(resolveAccess(null, null)).toBe('notAsked');
  });

  it('permission refusée : rien n’est lu, rien n’est écrit, et on le dit', async () => {
    const { phone, service, writes } = fakePhone({ access: 'denied' });
    await service.setPrefs({ visibleCalendarIds: ['cal-work'] });
    phone.events.set('x1', external('x1'));
    expect(await service.calendars()).toEqual([]);
    expect(await service.events(new Date('2026-11-01'), new Date('2026-12-01'))).toEqual({ events: [], calendars: [] });
    expect(await service.add(evSource())).toEqual({ status: 'denied', access: 'denied' });
    expect(await service.update(evSource())).toEqual({ status: 'denied', access: 'denied' });
    expect(await service.remove(homiKey('event', 'e1'))).toEqual({ status: 'denied', access: 'denied' });
    expect(writes()).toEqual([]);
    expect(phone.calls.filter((c) => c.startsWith('list:'))).toEqual([]);
  });

  it('hors iPhone, en démonstration ou sans module natif : inerte', async () => {
    for (const reason of ['platform', 'demo', 'module'] as const) {
      const { phone, service } = fakePhone({ unavailable: reason });
      expect(await service.access()).toBe('unavailable');
      expect(await service.requestAccess()).toBe('unavailable');
      expect(await service.add(evSource())).toEqual({ status: 'denied', access: 'unavailable' });
      expect(await service.events(new Date('2026-11-01'), new Date('2026-12-01'))).toEqual({ events: [], calendars: [] });
      expect(phone.calls).toEqual([]);
    }
  });

  it('écriture seule : on peut ajouter (une seule fois), mais ni lire, ni mettre à jour, ni retirer', async () => {
    const { phone, service, writes } = fakePhone({ access: 'writeOnly' });
    const r = await service.add(evSource());
    expect(r.status).toBe('added');
    expect(writes()).toEqual(['create:virtual']);
    // ré-appui : le lien local suffit, sans relecture possible — jamais de doublon
    expect(await service.add(evSource())).toMatchObject({ status: 'already', verified: false });
    expect(writes()).toEqual(['create:virtual']);
    expect((await service.status(evSource())).status).toBe('unverified');
    expect(await service.update(evSource({ title: 'Piscine (modifié)' }))).toEqual({ status: 'denied', access: 'writeOnly' });
    expect(await service.remove(homiKey('event', 'e1'))).toEqual({ status: 'denied', access: 'writeOnly' });
    expect(await service.events(new Date('2026-11-01'), new Date('2026-12-01'))).toEqual({ events: [], calendars: [] });
    expect(phone.calls.some((c) => c.startsWith('get:') || c.startsWith('list:'))).toBe(false);
    // « Oublier » ne touche pas au téléphone
    await service.forget(homiKey('event', 'e1'));
    expect((await service.status(evSource())).status).toBe('none');
    expect(writes()).toEqual(['create:virtual']);
  });
});

// ------------------------------------------------------------------ fuseaux et instants
describe('fuseaux : instants absolus et fuseau explicite', () => {
  it('heure murale → instant, changements d’heure compris', () => {
    expect(zonedTimeToInstant('2026-11-20', 18, 0, 0, PARIS).toISOString()).toBe('2026-11-20T17:00:00.000Z');
    expect(zonedTimeToInstant('2026-07-14', 18, 0, 0, PARIS).toISOString()).toBe('2026-07-14T16:00:00.000Z');
    expect(zonedTimeToInstant('2026-11-20', 0, 0, 0, 'America/New_York').toISOString()).toBe('2026-11-20T05:00:00.000Z');
    expect(zonedTimeToInstant('2026-11-20', 0, 0, 0, 'Pacific/Auckland').toISOString()).toBe('2026-11-19T11:00:00.000Z');
    // 29 mars 2026, 2 h 30 n'existe pas à Paris : l'instant juste après le saut
    expect(zonedTimeToInstant('2026-03-29', 2, 30, 0, PARIS).toISOString()).toBe('2026-03-29T01:30:00.000Z');
    expect(dayInZone('2026-11-19T23:30:00.000Z', PARIS)).toBe('2026-11-20');
    expect(dayInZone('2026-11-19T23:30:00.000Z', 'America/New_York')).toBe('2026-11-19');
  });

  it('fuseau invalide refusé, fuseau valide accepté', () => {
    expect(isValidTimeZone('Europe/Paris')).toBe(true);
    expect(isValidTimeZone('America/Guadeloupe')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
  });

  it('événement horaire : mêmes instants que HOMI, fuseau de l’événement', () => {
    const p = plan(evSource());
    expect(p.input).toMatchObject({ startDate: '2026-11-20T17:00:00.000Z', endDate: '2026-11-20T18:00:00.000Z', allDay: false, timeZone: PARIS, title: 'Piscine', location: 'Bassin nord' });
    expect(p.mode).toBe('single');
    // Saisi en Guadeloupe, lu sur un téléphone à Paris : l'instant ne bouge pas, le fuseau d'origine est gardé
    const g = plan(evSource({ timezone: 'America/Guadeloupe', starts_at: '2026-11-20T22:00:00.000Z', ends_at: '2026-11-20T23:30:00.000Z' }));
    expect(g.input).toMatchObject({ startDate: '2026-11-20T22:00:00.000Z', endDate: '2026-11-20T23:30:00.000Z', timeZone: 'America/Guadeloupe' });
  });

  it('fuseau absent ou invalide → celui du téléphone ; sans heure de fin → une heure', () => {
    const p = plan(evSource({ timezone: 'N/Importe', ends_at: null }), 'America/New_York');
    expect(p.input.timeZone).toBe('America/New_York');
    expect(p.input.endDate).toBe('2026-11-20T18:00:00.000Z');
  });

  it('rendez-vous : une heure, fuseau du téléphone, alarme = rappel HOMI, aucune note de santé', () => {
    const p = plan(apptSource(180));
    expect(p.key).toBe('appointment:a1');
    expect(p.input).toMatchObject({ startDate: '2026-11-24T14:30:00.000Z', endDate: '2026-11-24T15:30:00.000Z', timeZone: PARIS, allDay: false, notes: null, recurrenceRule: null });
    expect(p.input.alarms).toEqual([{ relativeOffset: -180 }]);
    expect(plan(apptSource(0)).input.alarms).toEqual([]);
    expect(plan(apptSource(1440)).input.alarms).toEqual([{ relativeOffset: -1440 }]);
    // les notes de l'événement HOMI ne partent jamais : seul le texte fourni par l'écran est écrit
    expect(plan(evSource()).input.notes).toBeNull();
    expect(buildExport(evSource(), { deviceTimeZone: PARIS, now: NOW, notes: 'Ajouté depuis HOMI' }).input.notes).toBe('Ajouté depuis HOMI');
  });
});

// ------------------------------------------------------------------ journées entières
describe('journée entière : le bon jour, sans décalage', () => {
  const localDay = (iso: string, tz: string) => dayInZone(iso, tz);

  it('saisie à Paris, téléphone à Paris : minuit → 23:59:59 du même jour, sans fuseau attaché', () => {
    const p = plan(evSource({ all_day: true, starts_at: '2026-11-19T23:00:00.000Z', ends_at: null }));
    expect(p.input.allDay).toBe(true);
    expect(p.input.timeZone).toBeUndefined();
    expect(p.input.startDate).toBe('2026-11-19T23:00:00.000Z');
    expect(p.input.endDate).toBe('2026-11-20T22:59:59.000Z');
    expect(localDay(p.input.startDate, PARIS)).toBe('2026-11-20');
    expect(localDay(p.input.endDate, PARIS)).toBe('2026-11-20');
  });

  it.each([
    ['America/New_York'], ['Pacific/Auckland'], ['America/Guadeloupe'], ['Asia/Tokyo'], ['UTC'],
  ])('saisie à Paris, téléphone à %s : toujours le 20 novembre', (deviceTz) => {
    const p = plan(evSource({ all_day: true, starts_at: '2026-11-19T23:00:00.000Z', ends_at: null }), deviceTz);
    expect(localDay(p.input.startDate, deviceTz)).toBe('2026-11-20');
    expect(localDay(p.input.endDate, deviceTz)).toBe('2026-11-20');
    expect(Date.parse(p.input.endDate)).toBeGreaterThan(Date.parse(p.input.startDate));
  });

  it('fuseau de l’événement resté celui du créateur, date modifiée depuis un autre fuseau : le jour saisi est gardé', () => {
    // créé à New York, puis passé « toute la journée du 10 janvier » depuis un téléphone à Paris (minuit de Paris)
    expect(allDayDate('2027-01-09T23:00:00.000Z', 'America/New_York', PARIS)).toBe('2027-01-10');
    const p = plan(evSource({ all_day: true, timezone: 'America/New_York', starts_at: '2027-01-09T23:00:00.000Z', ends_at: null }));
    expect(localDay(p.input.startDate, PARIS)).toBe('2027-01-10');
  });

  it('jour du changement d’heure : toujours un seul jour', () => {
    for (const day of ['2026-03-29', '2026-10-25']) {
      const p = plan(evSource({ all_day: true, starts_at: zonedTimeToInstant(day, 0, 0, 0, PARIS).toISOString(), ends_at: null }));
      expect(localDay(p.input.startDate, PARIS)).toBe(day);
      expect(localDay(p.input.endDate, PARIS)).toBe(day);
    }
  });

  it('plusieurs jours : la fin exclusive à minuit ne déborde pas sur le jour suivant', () => {
    const p = plan(evSource({ all_day: true, starts_at: '2026-11-19T23:00:00.000Z', ends_at: '2026-11-22T23:00:00.000Z' }));
    expect(localDay(p.input.startDate, PARIS)).toBe('2026-11-20');
    expect(localDay(p.input.endDate, PARIS)).toBe('2026-11-22');
  });

  it('l’empreinte d’une journée entière ne change pas quand le téléphone change de fuseau', () => {
    const src = evSource({ all_day: true, starts_at: '2026-11-19T23:00:00.000Z', ends_at: null });
    expect(plan(src, 'Asia/Tokyo').fingerprint).toBe(plan(src, PARIS).fingerprint);
  });
});

// ------------------------------------------------------------------ récurrences
describe('récurrences : exportées seulement quand elles sont fidèles', () => {
  it('chaque jour / chaque semaine, avec intervalle et date de fin', () => {
    expect(plan(evSource({ recurrence: { type: 'daily' } })).input.recurrenceRule).toEqual({ frequency: 'daily', interval: 1 });
    const w = plan(evSource({ recurrence: { type: 'weekly', every: 2, until: '2027-01-31' } }));
    expect(w.mode).toBe('series');
    expect(w.limit).toBeNull();
    // la série part du premier jour, pas de l'occurrence affichée ; fin = 31 janvier 23:59:59 à Paris
    expect(w.input.startDate).toBe('2026-11-20T17:00:00.000Z');
    expect(w.input.recurrenceRule).toEqual({ frequency: 'weekly', interval: 2, endDate: '2027-01-31T22:59:59.000Z' });
    // intervalle borné comme dans HOMI (1 à 12)
    expect(plan(evSource({ recurrence: { type: 'daily', every: 99 } })).input.recurrenceRule?.interval).toBe(12);
    expect(plan(evSource({ recurrence: { type: 'daily', every: 0 } })).input.recurrenceRule?.interval).toBe(1);
  });

  it('chaque mois le 20 : oui ; le 31 : une seule occurrence, et la raison est donnée', () => {
    expect(plan(evSource({ recurrence: { type: 'monthly' } })).mode).toBe('series');
    const last = { starts_at: '2026-10-31T17:00:00.000Z', ends_at: '2026-10-31T18:00:00.000Z', recurrence: { type: 'monthly' as const } };
    const src = evSource(last);
    expect(recurrenceFor(event(last), PARIS)).toMatchObject({ rule: null, limit: 'monthEnd' });
    const p = plan(src);
    expect(p.mode).toBe('occurrence');
    expect(p.limit).toBe('monthEnd');
    expect(p.input.recurrenceRule).toBeNull();
    // prochaine occurrence HOMI après le 17 novembre : le 31 décembre (novembre n'a pas de 31)
    expect(p.occurrenceStart).toBe('2026-12-31T17:00:00.000Z');
    expect(p.input.startDate).toBe('2026-12-31T17:00:00.000Z');
    expect(p.input.endDate).toBe('2026-12-31T18:00:00.000Z');
    // l'occurrence touchée dans l'agenda est celle qui part
    expect(plan(src, PARIS, { occurrenceStart: '2027-01-31T17:00:00.000Z' }).input.startDate).toBe('2027-01-31T17:00:00.000Z');
  });

  it('type de récurrence inconnu : une occurrence, signalée', () => {
    const p = plan(evSource({ recurrence: { type: 'yearly' } as never }));
    expect(p.mode).toBe('occurrence');
    expect(p.limit).toBe('unknown');
    expect(p.input.recurrenceRule).toBeNull();
  });

  it('journée entière répétée : règle + bon jour', () => {
    const p = plan(evSource({ all_day: true, starts_at: '2026-11-19T23:00:00.000Z', ends_at: null, recurrence: { type: 'weekly' } }), 'America/New_York');
    expect(p.mode).toBe('series');
    expect(dayInZone(p.input.startDate, 'America/New_York')).toBe('2026-11-20');
    expect(p.input.recurrenceRule).toEqual({ frequency: 'weekly', interval: 1 });
  });
});

// ------------------------------------------------------------------ anti-doublon
describe('anti-doublon : un élément HOMI n’est jamais ajouté deux fois', () => {
  it('premier appui : créé dans le calendrier par défaut ; ré-appui : « déjà dans le calendrier »', async () => {
    const { phone, service, writes, mem } = fakePhone();
    const r = await service.add(evSource());
    expect(r).toMatchObject({ status: 'added', calendarId: 'cal-home' });
    expect(phone.events.size).toBe(1);
    expect([...phone.events.values()][0].url).toBe(markerUrl('event:e1'));
    const again = await service.add(evSource());
    expect(again).toMatchObject({ status: 'already', verified: true });
    expect(writes()).toEqual(['create:cal-home']);
    expect((await service.status(evSource())).status).toBe('linked');
    // le lien est gardé sur le téléphone, et seulement des identifiants (aucun titre, aucun lieu)
    const saved = mem.get(STORAGE_KEY)!;
    expect(JSON.parse(saved).links['event:e1']).toMatchObject({ eventId: 'ios-1', calendarId: 'cal-home', mode: 'single' });
    expect(saved).not.toContain('Bassin nord');
  });

  it('double appui (deux ajouts en même temps) : un seul événement', async () => {
    const { phone, service, writes } = fakePhone({ createDelay: 20 });
    const [a, b, c] = await Promise.all([service.add(evSource()), service.add(evSource()), service.add(evSource())]);
    expect([a.status, b.status, c.status].sort()).toEqual(['added', 'already', 'already']);
    expect(phone.events.size).toBe(1);
    expect(writes()).toEqual(['create:cal-home']);
  });

  it('le lien survit au redémarrage de l’appli', async () => {
    const first = fakePhone();
    await first.service.add(apptSource());
    const second = createDeviceCalendarService({ adapter: first.adapter, store: first.store, timeZone: () => PARIS, now: () => NOW });
    expect(await second.add(apptSource())).toMatchObject({ status: 'already' });
    expect(first.phone.events.size).toBe(1);
  });

  it('événement et rendez-vous de même identifiant : deux liens distincts', async () => {
    const { phone, service } = fakePhone();
    await service.add(evSource({ id: 'same' }));
    await service.add(apptSource(60, { id: 'same' }));
    expect(phone.events.size).toBe(2);
  });

  it('création en échec : aucun lien, on peut réessayer', async () => {
    const { phone, service } = fakePhone({ failCreate: new Error('calendrier plein') });
    await expect(service.add(evSource())).rejects.toThrow('calendrier plein');
    expect((await service.status(evSource())).status).toBe('none');
    phone.failCreate = undefined;
    expect((await service.add(evSource())).status).toBe('added');
    expect(phone.events.size).toBe(1);
  });

  it('relecture impossible (erreur du téléphone) : pas pris pour une suppression, donc pas de second événement', async () => {
    const { phone, service, writes } = fakePhone();
    await service.add(evSource());
    phone.failGet = new Error('EventKit indisponible');
    await expect(service.add(evSource())).rejects.toThrow('EventKit indisponible');
    expect(writes()).toEqual(['create:cal-home']);
  });
});

// ------------------------------------------------------------------ calendrier cible
describe('calendrier cible', () => {
  it('défaut = calendrier par défaut du téléphone ; choix de l’utilisateur respecté ; calendrier en lecture seule refusé', async () => {
    const { service } = fakePhone();
    expect((await service.targetCalendar()).calendar?.id).toBe('cal-home');
    await service.setPrefs({ targetCalendarId: 'cal-work' });
    expect(await service.targetCalendar()).toMatchObject({ calendar: { id: 'cal-work' }, fellBack: false });
    expect((await service.add(evSource())) as { calendarId: string }).toMatchObject({ calendarId: 'cal-work' });
    await service.setPrefs({ targetCalendarId: 'cal-holidays' });
    expect(await service.targetCalendar()).toMatchObject({ calendar: { id: 'cal-home' }, fellBack: true });
  });

  it('calendrier cible supprimé sur le téléphone : retour au calendrier par défaut, préférence nettoyée', async () => {
    const { phone, service } = fakePhone();
    await service.setPrefs({ targetCalendarId: 'cal-work', visibleCalendarIds: ['cal-work', 'cal-home'] });
    phone.calendars = phone.calendars.filter((c) => c.id !== 'cal-work');
    expect(await service.targetCalendar()).toMatchObject({ calendar: { id: 'cal-home' }, fellBack: true });
    expect((await service.visibleCalendars()).map((c) => c.id)).toEqual(['cal-home']);
    expect(service.snapshot().prefs).toEqual({ visibleCalendarIds: ['cal-home'], targetCalendarId: null, chosen: true });
    expect(await service.add(evSource())).toMatchObject({ status: 'added', calendarId: 'cal-home' });
  });

  it('aucun calendrier modifiable : rien n’est créé', async () => {
    const { phone, service, writes } = fakePhone();
    phone.calendars = phone.calendars.filter((c) => !c.writable);
    phone.defaultId = null;
    expect(await service.add(evSource())).toEqual({ status: 'noCalendar' });
    expect(writes()).toEqual([]);
  });
});

// ------------------------------------------------------------------ lecture
describe('lecture des calendriers choisis (lecture seule)', () => {
  it('seulement les calendriers choisis, sur la plage demandée', async () => {
    const { phone, service, writes } = fakePhone();
    phone.events.set('x1', external('x1'));
    phone.events.set('x2', external('x2', { calendarId: 'cal-holidays', title: 'Férié', allDay: true, start: '2026-11-10T23:00:00.000Z', end: '2026-11-11T22:59:59.000Z' }));
    phone.events.set('x3', external('x3', { start: '2027-03-01T09:00:00.000Z', end: '2027-03-01T10:00:00.000Z' }));
    // rien de choisi : au premier accès complet, tous les calendriers lisibles sont affichés (TestFlight 9)
    const first = await service.events(new Date('2026-11-01'), new Date('2026-12-01'));
    expect(first.events.map((e) => e.id).sort()).toEqual(['x1', 'x2']);
    expect(service.snapshot().prefs.chosen).toBe(true);
    // un choix explicite reste respecté
    await service.setPrefs({ visibleCalendarIds: ['cal-work'] });
    const r = await service.events(new Date('2026-11-01'), new Date('2026-12-01'));
    expect(r.events.map((e) => e.id)).toEqual(['x1']);
    expect(r.calendars.map((c) => c.title)).toEqual(['Travail']);
    expect(writes()).toEqual([]);
  });

  it('calendrier affiché supprimé sur le téléphone : plus demandé, sans erreur', async () => {
    const { phone, service } = fakePhone();
    await service.setPrefs({ visibleCalendarIds: ['cal-work', 'cal-gone'] });
    phone.events.set('x1', external('x1'));
    const r = await service.events(new Date('2026-11-01'), new Date('2026-12-01'));
    expect(r.events.map((e) => e.id)).toEqual(['x1']);
    expect(phone.calls.filter((c) => c.startsWith('list:'))).toEqual(['list:cal-work']);
    expect(service.snapshot().prefs.visibleCalendarIds).toEqual(['cal-work']);
  });

  it('agenda : nom du calendrier, et pas de double affichage de ce que HOMI a lui-même ajouté', async () => {
    const { phone, service } = fakePhone();
    await service.setPrefs({ visibleCalendarIds: ['cal-home', 'cal-work'] });
    await service.add(evSource());
    phone.events.set('x1', external('x1'));
    // ajouté par HOMI depuis un AUTRE téléphone du foyer, vu ici par un calendrier partagé
    phone.events.set('x9', external('x9', { calendarId: 'cal-home', title: 'Pédiatre', url: markerUrl('appointment:a1') }));
    // marque HOMI d'un élément inconnu de ce foyer : montré comme n'importe quel événement du téléphone
    phone.events.set('x8', external('x8', { title: 'Autre foyer', url: markerUrl('event:zzz') }));
    const r = await service.events(new Date('2026-11-01'), new Date('2026-12-01'));
    const items = toAgendaItems(r.events, r.calendars, service.snapshot().links, new Set(['event:e1', 'appointment:a1']));
    expect(items.map((i) => i.refId).sort()).toEqual(['x1', 'x8']);
    expect(items.find((i) => i.refId === 'x1')).toMatchObject({ source: 'device', calendarTitle: 'Travail', calendarColor: '#0000FF', title: 'Réunion' });
  });

  it('marque HOMI : lue seulement sur un lien HOMI bien formé', () => {
    expect(keyFromMarker(markerUrl('event:3f2a-11'))).toBe('event:3f2a-11');
    expect(keyFromMarker(markerUrl('appointment:a1'))).toBe('appointment:a1');
    expect(keyFromMarker('https://exemple.fr/?ref=event-e1')).toBeNull();
    expect(keyFromMarker(`${markerUrl('event:e1')}&x=1`)).toBeNull();
    expect(keyFromMarker(null)).toBeNull();
  });
});

// ------------------------------------------------------------------ mise à jour, retrait, suppression à la main
describe('mise à jour et retrait : seulement sur geste explicite, seulement ce que HOMI a créé', () => {
  it('l’élément HOMI change : signalé, rien n’est écrit tant qu’on n’appuie pas sur « Mettre à jour »', async () => {
    const { phone, service, writes } = fakePhone();
    await service.add(evSource());
    const changed = evSource({ title: 'Piscine (bassin sud)', starts_at: '2026-11-21T17:00:00.000Z', ends_at: '2026-11-21T18:00:00.000Z' });
    expect((await service.status(changed)).status).toBe('outdated');
    expect(writes()).toEqual(['create:cal-home']);
    expect(phone.events.get('ios-1')!.title).toBe('Piscine');
    expect(await service.update(changed)).toMatchObject({ status: 'updated' });
    expect(writes()).toEqual(['create:cal-home', 'update:ios-1']);
    expect(phone.events.get('ios-1')).toMatchObject({ title: 'Piscine (bassin sud)', start: '2026-11-21T17:00:00.000Z' });
    expect((await service.status(changed)).status).toBe('linked');
    expect(phone.events.size).toBe(1);
  });

  it('rappel du rendez-vous modifié : « à mettre à jour », puis alarme réécrite', async () => {
    const { phone, service } = fakePhone();
    await service.add(apptSource(60));
    expect((await service.status(apptSource(60))).status).toBe('linked');
    expect((await service.status(apptSource(1440))).status).toBe('outdated');
    await service.update(apptSource(1440));
    expect(phone.events.get('ios-1')!.input!.alarms).toEqual([{ relativeOffset: -1440 }]);
  });

  it('série ↔ date seule, journée entière ↔ horaire : ancien événement HOMI retiré puis recréé, jamais deux', async () => {
    const { phone, service, writes } = fakePhone();
    await service.setPrefs({ targetCalendarId: 'cal-work' });
    await service.add(evSource());
    await service.setPrefs({ targetCalendarId: null });
    expect(await service.update(evSource({ recurrence: { type: 'weekly' } }))).toMatchObject({ status: 'updated' });
    // recréé dans le calendrier où il était
    expect(writes()).toEqual(['create:cal-work', 'delete:ios-1', 'create:cal-work']);
    expect(phone.events.size).toBe(1);
    expect(phone.events.get('ios-2')!.input!.recurrenceRule).toEqual({ frequency: 'weekly', interval: 1 });
    expect(service.snapshot().links['event:e1']).toMatchObject({ eventId: 'ios-2', mode: 'series' });
    await service.update(evSource({ recurrence: { type: 'weekly' }, all_day: true, starts_at: '2026-11-19T23:00:00.000Z', ends_at: null }));
    expect(phone.events.size).toBe(1);
    expect(phone.events.get('ios-3')!.allDay).toBe(true);
  });

  it('mode « une occurrence » : l’occurrence exportée reste la même au fil des jours (pas de faux « modifié »)', async () => {
    const src = evSource({ starts_at: '2026-10-31T17:00:00.000Z', ends_at: '2026-10-31T18:00:00.000Z', recurrence: { type: 'monthly' } });
    const { phone, store, adapter } = fakePhone();
    const s1 = createDeviceCalendarService({ adapter, store, timeZone: () => PARIS, now: () => NOW });
    await s1.add(src);
    expect(phone.events.get('ios-1')!.start).toBe('2026-12-31T17:00:00.000Z');
    // trois mois plus tard, la « prochaine occurrence » a changé, pas ce qui a été exporté
    const later = createDeviceCalendarService({ adapter, store, timeZone: () => PARIS, now: () => new Date('2027-02-15T09:00:00Z') });
    expect((await later.status(src)).status).toBe('linked');
  });

  it('retirer : supprime l’événement créé par HOMI et le lien ; on peut ensuite l’ajouter de nouveau', async () => {
    const { phone, service, writes } = fakePhone();
    await service.add(evSource());
    expect(await service.remove('event:e1')).toEqual({ status: 'removed' });
    expect(phone.events.size).toBe(0);
    expect((await service.status(evSource())).status).toBe('none');
    expect((await service.add(evSource())).status).toBe('added');
    expect(writes()).toEqual(['create:cal-home', 'delete:ios-1', 'create:cal-home']);
  });

  it('événement iOS supprimé à la main : détecté, jamais « mis à jour » dans le vide, ré-ajout possible sans doublon', async () => {
    const { phone, service, writes } = fakePhone();
    await service.add(evSource());
    phone.events.delete('ios-1');
    expect((await service.status(evSource())).status).toBe('missing');
    expect(await service.update(evSource())).toEqual({ status: 'missing' });
    expect(await service.remove('event:e1')).toEqual({ status: 'missing' });
    expect((await service.status(evSource())).status).toBe('none');
    expect(await service.add(evSource())).toMatchObject({ status: 'added' });
    expect(phone.events.size).toBe(1);
    expect(writes()).toEqual(['create:cal-home', 'create:cal-home']);
  });

  it('supprimé à la main puis ré-appui direct sur « Ajouter » : recréé une seule fois', async () => {
    const { phone, service } = fakePhone();
    await service.add(evSource());
    phone.events.delete('ios-1');
    expect(await service.add(evSource())).toMatchObject({ status: 'added' });
    expect(await service.add(evSource())).toMatchObject({ status: 'already' });
    expect(phone.events.size).toBe(1);
  });

  it('JAMAIS un événement externe : sans lien, aucune écriture ; avec un lien qui ne porte plus la marque HOMI, refus', async () => {
    const { phone, service, writes } = fakePhone();
    phone.events.set('x1', external('x1'));
    // aucun lien : rien à mettre à jour ni à retirer, quel que soit l'élément
    expect(await service.update(evSource())).toEqual({ status: 'notLinked' });
    expect(await service.remove('event:e1')).toEqual({ status: 'notLinked' });
    expect(await service.remove('x1')).toEqual({ status: 'notLinked' });
    expect(writes()).toEqual([]);
    // lien corrompu pointant vers un événement externe : la marque ne correspond pas → on ne touche à rien
    await service.add(evSource());
    const link = service.snapshot().links['event:e1'];
    phone.events.set(link.eventId, { ...external(link.eventId), url: null });
    expect(await service.update(evSource({ title: 'Autre' }))).toEqual({ status: 'notOwned' });
    expect(await service.remove('event:e1')).toEqual({ status: 'notOwned' });
    phone.events.set(link.eventId, { ...external(link.eventId), url: markerUrl('event:someone-else') });
    expect(await service.remove('event:e1')).toEqual({ status: 'notOwned' });
    expect(writes()).toEqual(['create:cal-home']);
    expect(phone.events.get('x1')).toMatchObject({ title: 'Réunion' });
    expect(phone.events.get(link.eventId)!.title).toBe('Réunion');
  });

  it('lire l’agenda, relire un état, changer les préférences : aucune écriture sur le téléphone', async () => {
    const { phone, service, writes } = fakePhone();
    phone.events.set('x1', external('x1'));
    await service.setPrefs({ visibleCalendarIds: ['cal-work', 'cal-home'], targetCalendarId: 'cal-work' });
    await service.events(new Date('2026-11-01'), new Date('2026-12-01'));
    await service.status(evSource());
    await service.status(apptSource());
    await service.calendars();
    await service.visibleCalendars();
    await service.targetCalendar();
    expect(writes()).toEqual([]);
    expect(phone.calls).not.toContain('request');
  });

  it('stockage local illisible : on repart de zéro sans planter', async () => {
    const { store, adapter } = fakePhone();
    await store.setItem(STORAGE_KEY, '{pas du json');
    const s = createDeviceCalendarService({ adapter, store, timeZone: () => PARIS, now: () => NOW });
    expect((await s.load()).links).toEqual({});
    await store.setItem(STORAGE_KEY, JSON.stringify({ prefs: { visibleCalendarIds: 'x', targetCalendarId: 3 }, links: { a: null, b: { eventId: 1 } } }));
    const s2 = createDeviceCalendarService({ adapter, store, timeZone: () => PARIS, now: () => NOW });
    expect(await s2.load()).toEqual({ prefs: { visibleCalendarIds: [], targetCalendarId: null, chosen: false }, links: {} });
  });
});
