/** Famille FOYER (agenda, tâches, missions, place, routines, courses, stocks, carnet, rappels, sorties). */
import { calendar, circle, rrect, type HomiIconDef } from '../geometry';

const HOUSE = 'M4.25 10.6 12 4.25l7.75 6.35v8.15a1.75 1.75 0 0 1-1.75 1.75H6a1.75 1.75 0 0 1-1.75-1.75z';
const BELL = 'M6.25 16.25V11a5.75 5.75 0 0 1 11.5 0v5.25l1.5 1.75H4.75z';
const CAL_FILL = rrect(3.5, 5, 17, 15.5, 2.25);
const PLANE = 'M20.5 3.5 3.5 10.5l6.5 3 3 6.5z';
const TRAY = 'M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z';
const PIN = 'M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z';

export const FOYER = {
  /** Agenda familial : le calendrier et ses jours. */
  calendarGrid: {
    fill: CAL_FILL, stroke: calendar(3.5, 5, 17, 15.5),
    dots: [[8, 12.75, 1.05], [12, 12.75, 1.05], [16, 12.75, 1.05], [8, 16.5, 1.05], [12, 16.5, 1.05], [16, 16.5, 1.05]],
  },
  /** Tâches du foyer : la liste cochée. */
  checklist: { fill: circle(6, 18.25, 2), stroke: `M3.5 6.75l1.9 1.9L8.75 5.1M3.5 12.75l1.9 1.9 3.35-3.55${circle(6, 18.25, 2)}M11.75 7h8.75M11.75 13h8.75M11.75 18.25h6` },
  /** Missions familiales : l'avion de papier. */
  plane: { fill: PLANE, stroke: `${PLANE}M20.5 3.5 10 13.5` },
  /** Missions terminées : la double coche. */
  doubleCheck: { stroke: 'M2.75 12.75l4 4 8-8.5M11.25 15.75l1 1 8.5-8.5' },
  /** Ma place dans la famille : une personne dans la maison. */
  housePerson: { fill: HOUSE, stroke: `${HOUSE}${circle(12, 12, 2)}M8.75 20.5c.4-2.1 1.7-3.5 3.25-3.5s2.85 1.4 3.25 3.5` },
  /** Routines du foyer : la boucle. */
  loop: { stroke: 'M4.5 11V9.5a3 3 0 0 1 3-3h12M16.5 3.5l3 3-3 3M19.5 13v1.5a3 3 0 0 1-3 3h-12M7.5 20.5l-3-3 3-3' },
  /** Historique des tâches : la liste et l'horloge. */
  listClock: { fill: circle(16.5, 16.5, 4.25), stroke: `M4 6.5h13M4 11.5h8M4 16.5h4.5${circle(16.5, 16.5, 4.25)}M16.5 14.25v2.25l1.5 1` },
  /** Vider ma tête : la corbeille d'arrivée et la flèche. */
  trayDown: { fill: TRAY, stroke: `${TRAY}M12 3.5v8.5M8.75 8.75 12 12l3.25-3.25` },
  /** Échéances à préparer : le calendrier coché. */
  calendarCheck: { fill: CAL_FILL, stroke: `${calendar(3.5, 5, 17, 15.5)}M8.75 14.5l2.25 2.25 4.25-4.5` },
  /** Liste de courses : le chariot. */
  cart: { fill: 'M6.6 7.5h13.15l-2 7.5H8.2z', stroke: `M3 4.5h2.5l2.25 10.5h10l2-7.5H6.6${circle(9.25, 19, 1.5)}${circle(16.5, 19, 1.5)}` },
  /** Stocks du foyer : le carton. */
  box: { fill: 'M12 3.25l8 4-8 4-8-4z', stroke: 'M12 3.25l8 4v9.5l-8 4-8-4v-9.5zM4 7.25l8 4 8-4M12 11.25v9.5M8 5.25l8 4' },
  /** Carnet de la maison : la clé. */
  key: { fill: circle(8, 15.5, 4.25), stroke: `${circle(8, 15.5, 4.25)}M11 12.5l8.5-8.5M16 7.5l2.5 2.5M18.5 5l2 2` },
  /** Rappels : la cloche qui sonne. */
  bellRing: { fill: BELL, stroke: `${BELL}M10 20.25a2 2 0 0 0 4 0M12 3.25v2M3.25 8.75c.3-1.6 1-3 2.2-4.1M20.75 8.75c-.3-1.6-1-3-2.2-4.1` },
  /** Sorties en famille : l'épingle sur la carte. */
  pin: { fill: PIN, stroke: `${PIN}${circle(12, 10, 2.4)}` },
  /** Animaux du foyer : l'empreinte de patte. */
  paw: {
    fill: `M12 12.5c-2.8 0-5 2.6-5 4.8 0 1.6 1.2 2.4 2.6 2.4 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.4 0 2.6-.8 2.6-2.4 0-2.2-2.2-4.8-5-4.8z`,
    stroke: `M12 12.5c-2.8 0-5 2.6-5 4.8 0 1.6 1.2 2.4 2.6 2.4 1 0 1.6-.5 2.4-.5s1.4.5 2.4.5c1.4 0 2.6-.8 2.6-2.4 0-2.2-2.2-4.8-5-4.8z${circle(5.5, 10.5, 1.6)}${circle(9.25, 6.5, 1.75)}${circle(14.75, 6.5, 1.75)}${circle(18.5, 10.5, 1.6)}`,
  },
} satisfies Record<string, HomiIconDef>;
