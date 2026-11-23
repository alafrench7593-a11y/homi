/**
 * Finitions du suivi (23/11/2026) — logique pure, testée (src/__tests__/finishTrack.test.ts) :
 *  · barres tactiles du cycle (Statistiques, Résumé du mois) : barres datées, période / mois / élément lus dans
 *    l'adresse, lien vers la fiche de correction des règles quand elle existe ;
 *  · biberon chronométré : l'heure et la DURÉE se corrigent ensemble (début, fin, pauses gardées) ;
 *  · mode nuit : état et durée depuis le dernier changement, saisies de la nuit en liste datée ;
 *  · École : brouillon de correction d'un devoir (mêmes règles que la fiche de l'app Devoirs).
 * Rien n'est interprété : des valeurs notées, comptées, jamais un zéro inventé pour un jour sans saisie.
 */
import { addDays, daysBetween, isValidISODate } from './dates';
import { symptomKeysOf } from './cycleV2';

// ------------------------------------------------------------------ barres tactiles
/** Une barre datée : `value` null = rien de noté (pointillés, jamais un zéro). */
export interface TouchBar {
  id: string;
  /** Jour AAAA-MM-JJ de la barre */
  date: string;
  value: number | null;
  /** Fiche de correction des règles liée à cette barre (sinon null) */
  periodId: string | null;
}

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

/** Indice de la barre la plus proche d'une abscisse (centres de colonnes). -1 si aucune. */
export function nearestBar(centers: readonly number[], x: number): number {
  let best = -1; let d = Infinity;
  centers.forEach((c, i) => { const e = Math.abs(c - x); if (e < d) { d = e; best = i; } });
  return best;
}

/** Sélection gardée (identifiant lu dans l'adresse) ; à défaut la plus récente barre notée, sinon -1. */
export function keepBar(bars: readonly TouchBar[], id: string | null | undefined): number {
  const i = id ? bars.findIndex((b) => b.id === id) : -1;
  if (i >= 0) return i;
  for (let k = bars.length - 1; k >= 0; k--) if (bars[k].value != null) return k;
  return -1;
}

/** Pas clavier / lecteur d'écran : barre voisine, bornée. */
export const stepBar = (i: number, delta: number, count: number) => (count ? Math.max(0, Math.min(count - 1, (i < 0 ? count - 1 : i) + delta)) : -1);

// ------------------------------------------------------------------ Statistiques du cycle
export const CYCLE_RANGES = ['6', '12', 'all'] as const;
export type CycleRange = (typeof CYCLE_RANGES)[number];

/** Période affichée (`?n=6|12|all`) ; par défaut les 6 derniers cycles. */
export function parseCycleRange(v: unknown): CycleRange {
  const s = first(v);
  return (CYCLE_RANGES as readonly string[]).includes(s as string) ? (s as CycleRange) : '6';
}

/** Périodes utiles : seulement celles qui changent ce qui est montré (« 12 » n'existe que s'il y a plus de 6 cycles). */
export function usefulCycleRanges(count: number): CycleRange[] {
  if (count <= 6) return [];
  return count > 12 ? ['6', '12', 'all'] : ['6', 'all'];
}

/**
 * Barres des longueurs de cycle : une barre par cycle complet (date = premier jour des règles qui l'ouvrent),
 * reliée à la saisie des règles correspondante pour l'ouvrir et la corriger.
 */
export function cycleBars(periods: readonly { id: string; start_date: string }[], cycles: readonly { start: string; length: number }[], range: CycleRange): TouchBar[] {
  const n = range === 'all' ? cycles.length : Number(range);
  return cycles.slice(-n).map((c) => ({ id: c.start, date: c.start, value: c.length, periodId: periods.find((p) => p.start_date === c.start)?.id ?? null }));
}

// ------------------------------------------------------------------ Résumé du mois
/** Mois lu dans l'adresse (`?m=AAAA-MM`) : jamais dans le futur ; invalide → mois en cours. */
export function parseMonthParam(v: unknown, today: string): string {
  const s = first(v);
  const cur = today.slice(0, 7);
  if (typeof s !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) return cur;
  return s > cur ? cur : s;
}

/** Jour choisi du mois (`?day=`) : dans le mois, pas après aujourd'hui ; sinon null. */
export function parseMonthDay(v: unknown, month: string, today: string): string | null {
  const s = first(v);
  return typeof s === 'string' && isValidISODate(s) && s.slice(0, 7) === month && s <= today ? s : null;
}

const INTIMATE = new Set(['libido_up', 'libido_down', 'dyspareunia', 'discomfort']);

export interface MonthDayBar extends TouchBar {
  /** Symptômes notés ce jour (hors données intimes, comme le résumé) */
  symptoms: number;
  pain: number | null;
  /** Saisie du jour dans le journal des symptômes (fiche existante) */
  logged: boolean;
}

/**
 * Barres du mois, une par jour jusqu'à aujourd'hui : hauteur = symptômes notés ; un jour de règles est marqué et
 * relié à sa saisie ; un jour sans rien = null (pointillés). Les règles sans fin connue comptent jusqu'à 9 jours au
 * plus (même règle que le résumé du mois).
 */
export function monthDayBars(month: string, input: {
  periods: readonly { id: string; start_date: string; end_date: string | null }[];
  logs: readonly { logged_on: string; symptom_keys?: string[] | null; symptoms?: string[] | null; pain_intensity?: number | null }[];
}, today: string): MonthDayBar[] {
  const start = `${month}-01`;
  const out: MonthDayBar[] = [];
  for (let d = start; d.slice(0, 7) === month && d <= today; d = addDays(d, 1)) {
    const period = input.periods.find((p) => {
      const end = p.end_date ?? (daysBetween(p.start_date, today) <= 9 ? today : p.start_date);
      return p.start_date <= d && d <= end;
    });
    const logs = input.logs.filter((l) => l.logged_on === d);
    const keys = new Set(logs.flatMap((l) => symptomKeysOf(l)).filter((k) => !INTIMATE.has(k)));
    const pains = logs.map((l) => l.pain_intensity).filter((v): v is number => typeof v === 'number');
    const pain = pains.length ? Math.max(...pains) : null;
    const noted = !!period || keys.size > 0 || pain != null || logs.length > 0;
    out.push({ id: d, date: d, value: noted ? keys.size : null, periodId: period?.id ?? null, symptoms: keys.size, pain, logged: logs.length > 0 });
  }
  return out;
}

// ------------------------------------------------------------------ biberon chronométré
export interface TimedBottle { at: string; started_at?: string | null; ended_at?: string | null; paused_seconds?: number | null }

/** Durée bue (minutes, arrondie) d'un biberon chronométré ; null pour une saisie sans minuteur. */
export function bottleDurationMin(b: TimedBottle): number | null {
  if (!b.started_at || !b.ended_at) return null;
  const s = Math.max(0, Math.floor((Date.parse(b.ended_at) - Date.parse(b.started_at)) / 1000) - (b.paused_seconds ?? 0));
  return Math.round(s / 60);
}

/**
 * Correction de l'heure et de la durée d'un biberon : pour un biberon chronométré, le début suit l'heure corrigée et
 * la fin = début + durée + pauses (les pauses notées sont gardées) ; une saisie sans minuteur ne change que l'heure.
 */
export function bottleTimingPatch(b: TimedBottle, at: Date, durationMin: number | null): Record<string, string> {
  const iso = at.toISOString();
  if (!b.started_at || !b.ended_at || durationMin == null) return { at: iso };
  const end = new Date(at.getTime() + (Math.max(0, Math.round(durationMin)) * 60 + (b.paused_seconds ?? 0)) * 1000);
  return { at: iso, started_at: iso, ended_at: end.toISOString() };
}

/** Durée saisie : entier de 1 à 120 minutes. */
export const clampBottleMinutes = (n: number) => Math.max(1, Math.min(120, Math.round(n)));

// ------------------------------------------------------------------ mode nuit
export type NightKind = 'sleep' | 'feed' | 'diaper' | 'bottle';
export interface NightEntry { id: string; kind: NightKind; at: string; end: string | null }

/** Fenêtre de « la nuit » : les 12 dernières heures. */
export const NIGHT_HOURS = 12;

/** Saisies de la nuit de CET enfant (12 dernières heures), plus récentes d'abord, au plus `max`. */
export function nightEntries(child: string, src: {
  sleeps?: readonly { id: string; child_id: string; started_at: string; ended_at: string | null }[];
  feeds?: readonly { id: string; child_id: string; started_at: string; ended_at: string | null }[];
  diapers?: readonly { id: string; child_id: string; at: string }[];
  bottles?: readonly { id: string; child_id: string; at: string; in_progress?: boolean | null }[];
}, now: Date, max = 12): NightEntry[] {
  const from = now.getTime() - NIGHT_HOURS * 3_600_000;
  const recent = (iso: string, end?: string | null) => Date.parse(iso) >= from || (end != null ? Date.parse(end) >= from : false);
  const out: NightEntry[] = [
    ...(src.sleeps ?? []).filter((s) => s.child_id === child && recent(s.started_at, s.ended_at ?? now.toISOString())).map((s) => ({ id: s.id, kind: 'sleep' as const, at: s.started_at, end: s.ended_at })),
    ...(src.feeds ?? []).filter((f) => f.child_id === child && recent(f.started_at, f.ended_at)).map((f) => ({ id: f.id, kind: 'feed' as const, at: f.started_at, end: f.ended_at })),
    ...(src.diapers ?? []).filter((d) => d.child_id === child && recent(d.at)).map((d) => ({ id: d.id, kind: 'diaper' as const, at: d.at, end: null })),
    ...(src.bottles ?? []).filter((b) => b.child_id === child && !b.in_progress && recent(b.at)).map((b) => ({ id: b.id, kind: 'bottle' as const, at: b.at, end: null })),
  ];
  return out.filter((e) => Date.parse(e.at) <= now.getTime() + 60_000).sort((a, b) => b.at.localeCompare(a.at)).slice(0, max);
}

/**
 * État de la nuit : endormi depuis le début du sommeil ouvert, sinon éveillé depuis la fin du dernier sommeil
 * (null si rien n'est noté : on n'invente pas d'heure de réveil).
 */
export function nightState(child: string, sleeps: readonly { child_id: string; started_at: string; ended_at: string | null }[], now: Date): { asleep: boolean; since: string | null; minutes: number | null } {
  const mine = sleeps.filter((s) => s.child_id === child);
  const open = mine.filter((s) => !s.ended_at).sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
  const since = open ? open.started_at : mine.filter((s) => s.ended_at).map((s) => s.ended_at!).sort().pop() ?? null;
  const minutes = since ? Math.max(0, Math.round((now.getTime() - Date.parse(since)) / 60_000)) : null;
  return { asleep: !!open, since, minutes };
}

// ------------------------------------------------------------------ École : correction d'un devoir
export interface HomeworkDraft { subject: string; instructions: string; due: string /* JJ/MM/AAAA */; done: '0' | '1' }

/** Erreur de brouillon (mêmes règles que la fiche de l'app Devoirs) : clé i18n ou null. */
export function homeworkDraftError(d: { subject: string; instructions: string }, dueIso: string | null): 'p2.hw.errSubject' | 'p2.hw.errInstructions' | 'p2.hw.errDate' | null {
  if (!d.subject.trim()) return 'p2.hw.errSubject';
  if (!d.instructions.trim()) return 'p2.hw.errInstructions';
  if (!dueIso) return 'p2.hw.errDate';
  return null;
}

/**
 * Ligne enregistrée d'après le brouillon : seuls les champs corrigés changent ; « fait » garde l'heure d'origine s'il
 * l'était déjà, prend `now` s'il vient d'être coché, et redevient null s'il est décoché.
 */
export function homeworkPatch(h: { subject: string; instructions: string; due_on: string; done_at: string | null }, d: { subject: string; instructions: string; done: '0' | '1' }, dueIso: string, now: Date) {
  return {
    subject: d.subject.trim().slice(0, 60),
    instructions: d.instructions.trim().slice(0, 500),
    due_on: dueIso,
    done_at: d.done === '1' ? (h.done_at ?? now.toISOString()) : null,
  };
}
