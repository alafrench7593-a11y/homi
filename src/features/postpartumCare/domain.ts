/**
 * 58 — Rééducation périnéale PRESCRITE (séances prévues / faites / manquées, rappels) et 60 — Cicatrisation (journal :
 * date, ressenti, douleur 0–10, note, photo privée facultative). Données personnelles de la personne seulement.
 * Aucun conseil médical, aucun exercice proposé, aucune interprétation d'une photo : un rappel fixe invite à consulter
 * en cas d'inquiétude. Logique pure, testée.
 */
export type SessionStatus = 'planned' | 'done' | 'missed';
export type Feeling = 'better' | 'same' | 'worse';

export interface CareLog {
  id: string; user_id: string; kind: 'pelvic_session' | 'healing'; at: string; status: SessionStatus | null;
  practitioner: string | null; feeling: Feeling | null; pain: number | null; note: string | null;
  document_id: string | null; reminder_id: string | null; created_at: string; updated_at: string; _pending?: boolean;
}

/** Séances : à venir (prévues, de la plus proche), passées (faites / manquées / prévues dépassées, plus récentes d'abord). */
export function splitSessions(list: CareLog[], now: Date = new Date()) {
  const s = list.filter((x) => x.kind === 'pelvic_session');
  const t = now.getTime();
  return {
    upcoming: s.filter((x) => x.status === 'planned' && Date.parse(x.at) >= t - 3600_000).sort((a, b) => a.at.localeCompare(b.at)),
    toConfirm: s.filter((x) => x.status === 'planned' && Date.parse(x.at) < t - 3600_000).sort((a, b) => b.at.localeCompare(a.at)),
    past: s.filter((x) => x.status !== 'planned').sort((a, b) => b.at.localeCompare(a.at)),
  };
}

/** Repères de suivi (pas un score) : séances faites et séances prévues restantes. */
export function sessionCounts(list: CareLog[]): { done: number; planned: number } {
  const s = list.filter((x) => x.kind === 'pelvic_session');
  return { done: s.filter((x) => x.status === 'done').length, planned: s.filter((x) => x.status === 'planned').length };
}

/** Rappel d'une séance : `minutesBefore` avant (par défaut 1 h), jamais dans le passé. */
export function reminderAt(atIso: string, minutesBefore = 60, now: Date = new Date()): string | null {
  const at = Date.parse(atIso) - minutesBefore * 60_000;
  return at > now.getTime() ? new Date(at).toISOString() : null;
}

/** Journal de cicatrisation, plus récent d'abord. */
export const healingEntries = (list: CareLog[]) => list.filter((x) => x.kind === 'healing').sort((a, b) => b.at.localeCompare(a.at));

export const PAIN_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export function validPain(p: number | null | undefined): boolean {
  return p == null || (Number.isInteger(p) && p >= 0 && p <= 10);
}
