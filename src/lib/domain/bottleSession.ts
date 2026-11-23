/**
 * Biberon (refonte v3) — logique pure de la SESSION en direct et des TUILES DE SYNTHÈSE.
 *
 * Session : l'état et le temps affiché viennent UNIQUEMENT des horodatages enregistrés (début, pause, secondes de
 * pause) via `bottleElapsed` : quitter l'application, la mettre en arrière-plan ou changer d'écran ne change rien.
 * La commande principale est unique (démarrer → pause → reprendre) : seul son libellé et son icône changent.
 *
 * Synthèse : descriptive, rien n'est recommandé ni inventé. Un jour sans saisie n'est PAS un zéro : il est absent
 * de la série (le micrographique ne s'affiche qu'avec au moins deux valeurs réelles, voir `sparkPoints`).
 */
import { bottleElapsed, type BottleChrono } from './childCare';
import { dailySummaries, type BottleLike } from './bottleHistory';
import { dayKey } from './bottleTimer';

// ------------------------------------------------------------------ session en direct
export type SessionState = 'idle' | 'running' | 'paused';
export type SessionAction = 'start' | 'pause' | 'resume';

export function sessionState(running: Pick<BottleChrono, 'paused_at'> | null | undefined): SessionState {
  if (!running) return 'idle';
  return running.paused_at ? 'paused' : 'running';
}

/** Commande principale (toujours au même emplacement) : action, icône et clé de libellé selon l'état. */
export function primaryCommand(state: SessionState): { action: SessionAction; icon: 'play' | 'pause'; labelKey: 'bs.start' | 'bs.pause' | 'bs.resume' } {
  if (state === 'running') return { action: 'pause', icon: 'pause', labelKey: 'bs.pause' };
  if (state === 'paused') return { action: 'resume', icon: 'play', labelKey: 'bs.resume' };
  return { action: 'start', icon: 'play', labelKey: 'bs.start' };
}

/**
 * Chronomètre à largeur stable : « 04:07 », puis « 1:04:07 » au-delà d'une heure (les chiffres tabulaires gardent
 * chaque caractère à la même place).
 */
export function sessionClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}

/** Secondes affichées à l'instant `now` : recalculées depuis les horodatages (jamais incrémentées). */
export function sessionSeconds(running: BottleChrono | null | undefined, now: Date): number {
  return running ? bottleElapsed(running, now) : 0;
}

/** Fréquence de rafraîchissement de l'affichage : seconde par seconde en marche, au repos rien ne bouge. */
export function sessionTickMs(state: SessionState): number | null {
  return state === 'running' ? 250 : null;
}

// ------------------------------------------------------------------ tuiles de synthèse
export type StatsPeriod = 'day' | 'week';

export interface BottleStats {
  period: StatsPeriod;
  /** Biberons notés sur la période (null : aucun → état vide) */
  count: number | null;
  /** Total bu NOTÉ (ml), seulement sur les biberons dont la quantité bue a été saisie ; null si aucune */
  consumedTotal: number | null;
  /** Nombre de biberons dont la quantité bue est connue */
  consumedCount: number;
  /** Micrographique « biberons par jour » (semaine, du plus ancien au plus récent ; jour sans saisie = null) */
  countSeries: (number | null)[] | undefined;
  /** Micrographique « ml bus » (jour : chaque biberon dans l'ordre ; semaine : total par jour noté) */
  consumedSeries: (number | null)[] | undefined;
}

type StatBottle = BottleLike & { in_progress?: boolean | null };

export function bottleStats(bottles: StatBottle[], period: StatsPeriod, now: Date = new Date(), timeZone?: string): BottleStats {
  if (period === 'day') {
    const today = dayKey(now, timeZone);
    const list = bottles.filter((b) => dayKey(b.at, timeZone) === today).sort((a, b) => a.at.localeCompare(b.at));
    const drunk = list.filter((b) => b.consumed_ml != null);
    return {
      period,
      count: list.length ? list.length : null,
      consumedTotal: drunk.length ? drunk.reduce((n, b) => n + (b.consumed_ml ?? 0), 0) : null,
      consumedCount: drunk.length,
      countSeries: undefined,
      consumedSeries: drunk.length >= 2 ? drunk.map((b) => b.consumed_ml) : undefined,
    };
  }
  const days = [...dailySummaries(bottles, 7, now, timeZone)].reverse();
  const count = days.reduce((n, d) => n + d.count, 0);
  const consumedCount = days.reduce((n, d) => n + d.consumedCount, 0);
  const countSeries = days.map((d) => (d.count ? d.count : null));
  const consumedSeries = days.map((d) => (d.consumedCount ? d.consumedTotal : null));
  const real = (s: (number | null)[]) => s.filter((v) => v != null).length >= 2;
  return {
    period,
    count: count ? count : null,
    consumedTotal: consumedCount ? days.reduce((n, d) => n + d.consumedTotal, 0) : null,
    consumedCount,
    countSeries: real(countSeries) ? countSeries : undefined,
    consumedSeries: real(consumedSeries) ? consumedSeries : undefined,
  };
}
