/**
 * Grossesse et post-partum — fonctions PURES du suivi (22/11/2026), testées dans src/__tests__/pregTrack.test.ts.
 *
 * Séance de comptage des mouvements (famille « temps et sessions ») : rangée dans la table EXISTANTE
 * `pregnancy_symptom_logs` (aucune nouvelle table, aucune migration), sous le symptôme `kick_count` :
 *  · une ligne « séance » : `frequency` = 'continuous' tant qu'elle est ouverte, 'several' une fois terminée ;
 *    `started_at` = début ; `logged_at` = fin (égal au début tant qu'elle est ouverte) ; `note` = note de la personne ;
 *  · une ligne par mouvement senti : `frequency` = 'once', `started_at` = début de SA séance (le lien), `logged_at` =
 *    l'instant de l'appui.
 * Le minuteur se lit dans la donnée (maintenant − début) : fermer l'application ne l'arrête pas. Le compte est le
 * nombre de mouvements réellement notés. Aucun seuil, aucun « objectif », aucune interprétation.
 */
import { isoDay, shiftDay } from './journalTrack';

export const KICK = 'kick_count';

export interface KickRow {
  id: string; symptom: string; started_at: string | null; logged_at: string;
  frequency: 'once' | 'several' | 'continuous' | null; note: string | null; week_sa?: number | null; pregnancy_id?: string | null;
}

export interface KickSession {
  /** Ligne « séance » (sa ligne d'en-tête) */
  id: string;
  start: string;
  /** Fin (null : en cours) */
  end: string | null;
  ongoing: boolean;
  /** Mouvements notés, du plus ancien au plus récent */
  taps: KickRow[];
  count: number;
  note: string | null;
  header: KickRow;
}

const stamp = (s: string | null | undefined) => (s ? Date.parse(s) : NaN);

/** Regroupe les lignes `kick_count` en séances (la plus récente d'abord). Un mouvement sans séance est ignoré. */
export function kickSessions(rows: readonly KickRow[]): KickSession[] {
  const kicks = rows.filter((r) => r.symptom === KICK);
  const headers = kicks.filter((r) => r.frequency !== 'once' && r.started_at);
  const taps = kicks.filter((r) => r.frequency === 'once' && r.started_at);
  return headers.map((h) => {
    const s0 = stamp(h.started_at);
    const own = taps.filter((tp) => stamp(tp.started_at) === s0).sort((a, b) => stamp(a.logged_at) - stamp(b.logged_at));
    const ongoing = h.frequency === 'continuous';
    return { id: h.id, start: h.started_at!, end: ongoing ? null : h.logged_at, ongoing, taps: own, count: own.length, note: h.note, header: h };
  }).sort((a, b) => stamp(b.start) - stamp(a.start));
}

/** Séance ouverte (la plus récente), s'il y en a une. */
export const ongoingKick = (sessions: readonly KickSession[]) => sessions.find((s) => s.ongoing) ?? null;

/** Durée en secondes : en cours → maintenant − début ; terminée → fin − début (jamais négative). */
export function kickSeconds(s: Pick<KickSession, 'start' | 'end'>, now: Date): number {
  const end = s.end ? stamp(s.end) : now.getTime();
  return Math.max(0, Math.floor((end - stamp(s.start)) / 1000));
}

/**
 * Correction du compte d'une séance : pour passer de `taps` (du plus ancien au plus récent) à `target`, on retire
 * les mouvements les plus RÉCENTS (ce sont ceux qu'on a pu noter en trop) ou on en ajoute à la fin de la séance.
 */
export function countPlan(taps: readonly { id: string }[], target: number): { remove: string[]; add: number } {
  const n = Math.max(0, Math.round(target));
  if (n >= taps.length) return { remove: [], add: n - taps.length };
  return { remove: taps.slice(n).map((x) => x.id), add: 0 };
}

/**
 * Heures proposées d'une séance corrigée. Début et fin « HH:MM » du même jour que le début d'origine ; une fin
 * antérieure au début passe au lendemain (séance autour de minuit). Refuse un début dans le futur, une fin dans le
 * futur, une séance de plus de 12 h.
 */
export function proposedRange(origStart: string, startText: string, endText: string | null, now: Date): { start: Date; end: Date | null } | null {
  const at = (text: string, base: Date) => {
    const m = text.trim().match(/^(\d{1,2})[:h ]?(\d{2})$/i);
    if (!m) return null;
    const h = Number(m[1]); const mi = Number(m[2]);
    if (h > 23 || mi > 59) return null;
    const d = new Date(base); d.setHours(h, mi, 0, 0); return d;
  };
  const base = new Date(origStart);
  const start = at(startText, base);
  if (!start || start.getTime() > now.getTime()) return null;
  // même minute que l'origine : on garde les secondes d'origine (pas de dérive au simple fait d'ouvrir/enregistrer)
  const s = start.getHours() === base.getHours() && start.getMinutes() === base.getMinutes() ? base : start;
  if (endText == null) return { start: s, end: null };
  let end = at(endText, s);
  if (!end) return null;
  if (end.getTime() < s.getTime()) end = new Date(end.getTime() + 86_400_000);
  if (end.getTime() > now.getTime() + 60_000 || end.getTime() - s.getTime() > 12 * 3_600_000) return null;
  return { start: s, end };
}

/** Jours (AAAA-MM-JJ) des `n` derniers jours, du plus ancien à aujourd'hui. */
export function lastDays(now: Date, n: number): string[] {
  const today = isoDay(now);
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
}

/**
 * Mouvements comptés par jour (jour du DÉBUT de la séance). Jour sans séance → `null` (« rien de noté »), jamais 0 ;
 * une séance terminée sans aucun mouvement compte 0 (c'est une vraie donnée : la séance a eu lieu).
 */
export function kicksByDay(sessions: readonly KickSession[], now: Date, n: number): { day: string; value: number | null; sessions: KickSession[] }[] {
  return lastDays(now, n).map((day) => {
    const own = sessions.filter((s) => isoDay(new Date(s.start)) === day);
    return { day, value: own.length ? own.reduce((a, s) => a + s.count, 0) : null, sessions: own };
  });
}

/** Entrées d'un journal daté par jour : jour sans entrée → `null` (« rien de noté »). */
export function entriesByDay<T>(rows: readonly T[], at: (r: T) => string, now: Date, n: number): { day: string; value: number | null; rows: T[] }[] {
  return lastDays(now, n).map((day) => {
    const own = rows.filter((r) => isoDay(new Date(at(r))) === day).sort((a, b) => Date.parse(at(b)) - Date.parse(at(a)));
    return { day, value: own.length || null, rows: own };
  });
}

/** Rendez-vous à venir le plus proche (non réalisé, pas plus d'une heure dans le passé). */
export function nextAppt<T extends { starts_at: string; completed_at?: string | null }>(list: readonly T[], now: Date): T | null {
  const from = now.getTime() - 3600_000;
  return [...list].filter((a) => !a.completed_at && Date.parse(a.starts_at) >= from).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0] ?? null;
}

/** Jours entiers entre aujourd'hui et un instant (0 : aujourd'hui, 1 : demain). */
export function daysAhead(stampIso: string, now: Date): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(stampIso); const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Bilans post-partum (un par jour) des `n` derniers jours : jour sans bilan → null. */
export function checkinsByDay<T extends { checkin_date: string }>(list: readonly T[], now: Date, n: number): { day: string; checkin: T | null }[] {
  return lastDays(now, n).map((day) => ({ day, checkin: list.find((c) => c.checkin_date === day) ?? null }));
}

/** Échelles du bilan rapide (même ordre que le point du jour). Valeur 1–5 ; null = non renseigné. */
export const QUICK_SCALES = ['feeling', 'fatigue', 'stress', 'sleep_quality'] as const;
export type QuickScale = typeof QUICK_SCALES[number];

/** Nombre d'échelles renseignées d'un bilan (pour « 3 réponses sur 4 »), sans aucun score. */
export function answered(c: Partial<Record<QuickScale, number | null>>): number {
  return QUICK_SCALES.filter((k) => c[k] != null).length;
}

/** Champs modifiés entre l'origine et le brouillon (aucun appel si rien n'a changé). */
export function changedFields<T extends Record<string, unknown>>(orig: T, draft: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(draft) as (keyof T)[]) if (draft[k] !== orig[k]) out[k] = draft[k];
  return out;
}

/** Restant / fait d'une liste : éléments restants dans l'ordre, faits ensuite ; progression en entier (0–100). */
export function checklistSplit<T extends { done?: boolean | null; position?: number }>(items: readonly T[]): { left: T[]; done: T[]; pct: number; total: number } {
  const sorted = [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const left = sorted.filter((i) => !i.done); const done = sorted.filter((i) => !!i.done);
  return { left, done, total: items.length, pct: items.length ? Math.round((done.length / items.length) * 100) : 0 };
}
