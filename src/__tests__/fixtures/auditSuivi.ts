/**
 * Audit 06 « Outils de suivi et résultats » — jeux de données dont la sortie attendue est calculée À LA MAIN
 * (commentaires). Heures exprimées en Europe/Paris (fuseau des tests Jest, voir scripts/jest-global-setup.js) :
 *  - 29/03/2026 : passage à l'heure d'été (2 h → 3 h, journée de 23 h) ;
 *  - 25/10/2026 : retour à l'heure d'hiver (3 h → 2 h, journée de 25 h).
 * Les biberons et la grossesse sont aussi rejoués dans la démo web par e2e/audit_suivi.py.
 */

/** Instant ISO d'une heure murale à Paris (+01:00 en hiver, +02:00 en été) — décalage écrit à la main. */
export const paris = (local: string, offset: '+01:00' | '+02:00') => new Date(`${local}${offset}`).toISOString();

/** Sommeils autour du passage à l'heure d'été. */
export const SLEEP_DST_SPRING = [
  // Nuit du 28 au 29 : 21 h (CET) → 7 h (CEST) = 9 h réelles (540 min), et non 10 h
  { started_at: paris('2026-03-28T21:00:00', '+01:00'), ended_at: paris('2026-03-29T07:00:00', '+02:00'), wakeups: 1 },
  // Sieste du 29 : 13 h → 14 h 30 = 90 min
  { started_at: paris('2026-03-29T13:00:00', '+02:00'), ended_at: paris('2026-03-29T14:30:00', '+02:00'), wakeups: 0 },
  // Nuit du 29 au 30 : 22 h → 6 h = 8 h ; dont 2 h le 29 (22 h → minuit) et 6 h le 30
  { started_at: paris('2026-03-29T22:00:00', '+02:00'), ended_at: paris('2026-03-30T06:00:00', '+02:00'), wakeups: 2 },
  // Sommeil commencé le 30 à 0 h 30 (le piège « minuit + 1 h ») : 30 min, appartient au 30, jamais au 29
  { started_at: paris('2026-03-30T00:30:00', '+02:00'), ended_at: paris('2026-03-30T01:00:00', '+02:00'), wakeups: 0 },
];

/** Sommeils autour du retour à l'heure d'hiver. */
export const SLEEP_DST_AUTUMN = [
  // Nuit du 25 au 26 : 22 h → 6 h (CET) = 8 h ; dont 2 h le 25 (22 h → minuit, journée de 25 h)
  { started_at: paris('2026-10-25T22:00:00', '+01:00'), ended_at: paris('2026-10-26T06:00:00', '+01:00'), wakeups: 0 },
  // Sieste le 25 de 23 h 30 à 23 h 50 : 20 min, appartient au 25 (dernière heure de la journée de 25 h)
  { started_at: paris('2026-10-25T23:30:00', '+01:00'), ended_at: paris('2026-10-25T23:50:00', '+01:00'), wakeups: 0 },
];

/**
 * Biberons d'une semaine (du lundi 9 au dimanche 15/11/2026, « maintenant » = 15/11 20 h à Paris), avec deux jours
 * SANS saisie (mardi 10 et jeudi 12) et un biberon dont la quantité bue n'est pas notée.
 *  - lun 9  : 120 bu + 150 bu           → 2 biberons, 270 ml bus
 *  - mer 11 : 90 bu                     → 1 biberon, 90 ml
 *  - ven 13 : préparé 180, bu NON noté  → 1 biberon, aucune quantité bue notée (jamais 180)
 *  - sam 14 : 23 h 50 → 100 bu          → compte le 14 (pas le 15)
 *  - dim 15 : 0 h 10 → 110 bu ; 7 h → 130 bu → 2 biberons, 240 ml
 * Semaine : 7 biberons, 700 ml bus notés (6 biberons dont la quantité bue est connue).
 */
export const BOTTLES_WEEK = [
  { id: 'b1', at: paris('2026-11-09T08:00:00', '+01:00'), prepared_ml: 150, consumed_ml: 120, milk_type: null },
  { id: 'b2', at: paris('2026-11-09T12:00:00', '+01:00'), prepared_ml: 150, consumed_ml: 150, milk_type: null },
  { id: 'b3', at: paris('2026-11-11T09:00:00', '+01:00'), prepared_ml: 120, consumed_ml: 90, milk_type: null },
  { id: 'b4', at: paris('2026-11-13T10:00:00', '+01:00'), prepared_ml: 180, consumed_ml: null, milk_type: null },
  { id: 'b5', at: paris('2026-11-14T23:50:00', '+01:00'), prepared_ml: 120, consumed_ml: 100, milk_type: null },
  { id: 'b6', at: paris('2026-11-15T00:10:00', '+01:00'), prepared_ml: 120, consumed_ml: 110, milk_type: null },
  { id: 'b7', at: paris('2026-11-15T07:00:00', '+01:00'), prepared_ml: 150, consumed_ml: 130, milk_type: null },
];
export const BOTTLES_NOW = new Date(paris('2026-11-15T20:00:00', '+01:00'));

/** Cycle régulier de 28 jours (débuts saisis) : prochaines règles et fenêtre fertile ESTIMÉES. */
export const CYCLE_REGULAR = [
  { start_date: '2026-01-01' }, { start_date: '2026-01-29' }, { start_date: '2026-02-26' }, { start_date: '2026-03-26' },
];
