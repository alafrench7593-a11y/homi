/**
 * Calendrier de l'iPhone : état pour l'interface. Volontairement HORS du cache React Query (qui est enregistré sur
 * le téléphone) : les événements lus restent en mémoire, le temps de l'écran.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { deviceCalendar } from './index';
import { sortAgenda, toAgendaItems, type DeviceAgendaItem, type ExportSource } from './model';
import type { LinkStatus } from './service';
import type { CalendarAccess, CalendarLink, DeviceCalendarInfo, DeviceCalendarState, DeviceEvent, UnavailableReason } from './types';

/** Compteur qui avance quand l'appli revient au premier plan (retour de Réglages ou de l'app Calendrier). */
function useForegroundTick(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setN((x) => x + 1); });
    return () => sub.remove();
  }, []);
  return n;
}

/** Préférences et liens (locaux), tenus à jour. */
export function useDeviceCalendarState(): DeviceCalendarState {
  useEffect(() => { void deviceCalendar.load(); }, []);
  return useSyncExternalStore(deviceCalendar.subscribe, deviceCalendar.snapshot, deviceCalendar.snapshot);
}

export interface DeviceCalendarOverview {
  access: CalendarAccess | null;
  unavailable: UnavailableReason | null;
  calendars: DeviceCalendarInfo[];
  /** Calendrier par défaut du téléphone (affiché comme cible par défaut). */
  defaultCalendar: DeviceCalendarInfo | null;
  loading: boolean;
  refresh: () => void;
  request: () => Promise<CalendarAccess>;
}

/** Autorisation et calendriers du téléphone ; relus au retour au premier plan. */
export function useDeviceCalendarOverview(): DeviceCalendarOverview {
  const tick = useForegroundTick();
  const [n, setN] = useState(0);
  const [v, setV] = useState<{ access: CalendarAccess | null; calendars: DeviceCalendarInfo[]; defaultCalendar: DeviceCalendarInfo | null; loading: boolean }>({ access: null, calendars: [], defaultCalendar: null, loading: true });
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const access = await deviceCalendar.access();
        const calendars = await deviceCalendar.calendars().catch(() => []);
        const defaultCalendar = calendars.length ? await deviceCalendar.defaultCalendar(calendars) : null;
        // Un calendrier supprimé sur le téléphone sort des préférences
        if (calendars.length) await deviceCalendar.visibleCalendars(calendars).catch(() => undefined);
        if (live) setV({ access, calendars, defaultCalendar, loading: false });
      } catch {
        if (live) setV({ access: 'unavailable', calendars: [], defaultCalendar: null, loading: false });
      }
    })();
    return () => { live = false; };
  }, [tick, n]);
  const refresh = useCallback(() => setN((x) => x + 1), []);
  const request = useCallback(async () => {
    const a = await deviceCalendar.requestAccess().catch(() => 'denied' as const);
    setN((x) => x + 1);
    return a;
  }, []);
  return { ...v, unavailable: deviceCalendar.unavailable(), refresh, request };
}

const NOTHING: { events: DeviceEvent[]; calendars: DeviceCalendarInfo[] } = { events: [], calendars: [] };

/**
 * Événements des calendriers choisis entre deux instants, prêts pour l'agenda (lecture seule).
 * `knownHomiKeys` : éléments HOMI du foyer, pour ne pas montrer deux fois ce que HOMI a lui-même ajouté.
 */
export function useDeviceAgenda(fromMs: number, toMs: number, knownHomiKeys: ReadonlySet<string>): DeviceAgendaItem[] {
  const tick = useForegroundTick();
  const state = useDeviceCalendarState();
  const [raw, setRaw] = useState(NOTHING);
  const visible = state.prefs.visibleCalendarIds.join(',');
  useEffect(() => {
    if (deviceCalendar.unavailable() || !visible) { setRaw(NOTHING); return; }
    let live = true;
    deviceCalendar.events(new Date(fromMs), new Date(toMs)).then((r) => { if (live) setRaw(r); }).catch(() => { if (live) setRaw(NOTHING); });
    return () => { live = false; };
  }, [fromMs, toMs, visible, tick]);
  return useMemo(() => sortAgenda(toAgendaItems(raw.events, raw.calendars, state.links, knownHomiKeys)), [raw, state.links, knownHomiKeys]);
}

export interface LinkView { status: LinkStatus | null; link: CalendarLink | null; access: CalendarAccess | null; refresh: () => void }

/** État du lien d'un élément HOMI avec le calendrier de l'iPhone (relu au retour au premier plan). */
export function useCalendarLink(source: ExportSource | null, occurrenceStart?: string | null): LinkView {
  const tick = useForegroundTick();
  const state = useDeviceCalendarState();
  const [n, setN] = useState(0);
  const [v, setV] = useState<{ status: LinkStatus | null; link: CalendarLink | null; access: CalendarAccess | null }>({ status: null, link: null, access: null });
  const latest = useRef(source);
  latest.current = source;
  // L'élément HOMI change (titre, heure, rappel…) : l'état est recalculé
  const signature = source ? JSON.stringify(source) : '';
  useEffect(() => {
    const src = latest.current;
    if (!src || deviceCalendar.unavailable()) { setV({ status: null, link: null, access: 'unavailable' }); return; }
    let live = true;
    (async () => {
      try {
        const access = await deviceCalendar.access();
        const s = await deviceCalendar.status(src, { occurrenceStart });
        if (live) setV({ status: s.status, link: s.link, access });
      } catch {
        // Lecture impossible à l'instant : on ne prétend ni « absent » ni « supprimé »
        if (live) setV((p) => ({ ...p, status: p.link ? 'unverified' : p.status }));
      }
    })();
    return () => { live = false; };
  }, [signature, occurrenceStart, state.links, tick, n]);
  return { ...v, refresh: useCallback(() => setN((x) => x + 1), []) };
}
