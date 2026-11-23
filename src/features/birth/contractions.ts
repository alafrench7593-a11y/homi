/**
 * 39 — Chronomètre des contractions : logique pure (testée, src/__tests__/birthFeeding.test.ts).
 * Tout repose sur des HORODATAGES ABSOLUS (début, fin) enregistrés dès l'appui : l'application peut passer en
 * arrière-plan ou être fermée, la contraction en cours et la séance se retrouvent telles quelles. Aucun compteur
 * gardé en mémoire, aucun seuil médical : seulement des durées, des intervalles et des moyennes de ce qui a été noté.
 */
import { formatDate, t as tr } from '@/i18n';

export interface Contraction { id: string; session_id: string; started_at: string; ended_at: string | null; pregnancy_id?: string | null; _pending?: boolean }

export interface TimedContraction extends Contraction {
  /** Durée en secondes (null : en cours). */
  durationSec: number | null;
  /** Intervalle depuis le DÉBUT de la contraction précédente de la séance (secondes) ; null pour la première. */
  intervalSec: number | null;
}

const sec = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 1000));

/** Contraction en cours (sans fin) la plus récente, s'il y en a une. */
export function running(list: Contraction[]): Contraction | null {
  return [...list].filter((c) => !c.ended_at).sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null;
}

/** Contractions d'une séance, de la plus ancienne à la plus récente, avec durée et intervalle. */
export function timed(list: Contraction[]): TimedContraction[] {
  const sorted = [...list].sort((a, b) => a.started_at.localeCompare(b.started_at));
  return sorted.map((c, i) => ({
    ...c,
    durationSec: c.ended_at ? sec(c.started_at, c.ended_at) : null,
    intervalSec: i > 0 ? sec(sorted[i - 1].started_at, c.started_at) : null,
  }));
}

/** Séance courante : celle de la contraction la plus récente (une nouvelle séance se démarre à la main). */
export function currentSessionId(list: Contraction[]): string | null {
  return [...list].sort((a, b) => b.started_at.localeCompare(a.started_at))[0]?.session_id ?? null;
}

/** Séances, de la plus récente à la plus ancienne. */
export function sessions(list: Contraction[]): { id: string; items: TimedContraction[]; from: string; to: string }[] {
  const by = new Map<string, Contraction[]>();
  for (const c of list) by.set(c.session_id, [...(by.get(c.session_id) ?? []), c]);
  return [...by.entries()].map(([id, items]) => {
    const t = timed(items);
    return { id, items: t, from: t[0].started_at, to: t[t.length - 1].ended_at ?? t[t.length - 1].started_at };
  }).sort((a, b) => b.from.localeCompare(a.from));
}

export interface WindowStats { count: number; avgDurationSec: number | null; avgIntervalSec: number | null }

/**
 * Moyennes sur les `minutes` dernières minutes : contractions TERMINÉES commencées dans la fenêtre ; intervalle moyen
 * entre débuts successifs de ces contractions (il en faut au moins deux). Simples moyennes, aucune interprétation.
 */
export function windowStats(list: Contraction[], minutes: number, now: Date = new Date()): WindowStats {
  const from = now.getTime() - minutes * 60_000;
  const inWin = timed(list).filter((c) => Date.parse(c.started_at) >= from && Date.parse(c.started_at) <= now.getTime());
  const done = inWin.filter((c) => c.durationSec != null);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null);
  const starts = inWin.map((c) => Date.parse(c.started_at));
  const gaps = starts.slice(1).map((s, i) => Math.round((s - starts[i]) / 1000));
  return { count: done.length, avgDurationSec: avg(done.map((c) => c.durationSec as number)), avgIntervalSec: avg(gaps) };
}

/** « 1 min 05 s », « 45 s » ; « — » si inconnu. */
export function fmtSec(s: number | null): string {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? tr('ctr.fmt.minSec', { m, s: String(r).padStart(2, '0') }) : tr('ctr.fmt.sec', { s: r });
}

/** Valeur courte des tuiles (m:ss) : tient à 320 pt. */
export function shortSec(s: number | null): string {
  if (s == null) return '—';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Chronomètre affiché : mm:ss (ou h:mm:ss) depuis un instant absolu. */
export function clock(fromIso: string, now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - Date.parse(fromIso)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

/** Sections de l'export pour la maternité (PDF ou texte) : séance par séance, heure, durée, intervalle. */
export function exportSections(list: Contraction[], now: Date = new Date()): { heading: string; lines: string[] }[] {
  const s30 = windowStats(list, 30, now);
  const s60 = windowStats(list, 60, now);
  const summary = { heading: tr('ctr.export.summary'), lines: [
    tr('ctr.export.window', { minutes: 30, count: s30.count, duration: fmtSec(s30.avgDurationSec), interval: fmtSec(s30.avgIntervalSec) }),
    tr('ctr.export.window', { minutes: 60, count: s60.count, duration: fmtSec(s60.avgDurationSec), interval: fmtSec(s60.avgIntervalSec) }),
  ] };
  return [summary, ...sessions(list).map((s) => ({
    heading: tr('ctr.export.session', { date: formatDate(s.from, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) }),
    lines: s.items.map((c) => tr('ctr.export.line', {
      time: formatDate(c.started_at, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      duration: c.durationSec == null ? tr('ctr.running') : fmtSec(c.durationSec),
      interval: fmtSec(c.intervalSec),
    })),
  }))];
}
