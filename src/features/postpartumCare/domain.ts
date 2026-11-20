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

// ---------------------------------------------------------------- 51 / 57 rendez-vous postnataux saisis
export interface PostnatalAppt { id: string; kind: string; title: string; starts_at: string; questions: string[]; for_parent?: boolean; created_by?: string | null; completed_at?: string | null }
const POSTNATAL_KINDS = new Set(['postnatal', 'perineal_rehab']);
/**
 * Rendez-vous postnataux et de rééducation SAISIS (aucun n'est ajouté par l'application), situés par rapport à la
 * naissance : semaines révolues depuis la date de naissance de l'enfant le plus jeune (aucune si inconnue ou avant).
 */
export function postnatalTimeline<A extends PostnatalAppt>(list: A[], birthDate: string | null, now: Date = new Date()) {
  const birth = birthDate ? Date.parse(`${birthDate}T00:00:00`) : NaN;
  const items = list.filter((a) => POSTNATAL_KINDS.has(a.kind)).map((a) => {
    const d = Date.parse(a.starts_at) - birth;
    return { appt: a, weeksAfterBirth: Number.isFinite(d) && d >= 0 ? Math.floor(d / (7 * 86_400_000)) : null };
  });
  const cut = now.getTime() - 3600_000;
  return {
    upcoming: items.filter((x) => Date.parse(x.appt.starts_at) >= cut).sort((a, b) => a.appt.starts_at.localeCompare(b.appt.starts_at)),
    past: items.filter((x) => Date.parse(x.appt.starts_at) < cut).sort((a, b) => b.appt.starts_at.localeCompare(a.appt.starts_at)),
  };
}

/** Questions postnatales pas encore posées et absentes du rendez-vous (casse et ponctuation finale ignorées). */
export function questionsToCopy(questions: { question: string; done: boolean }[], inAppointment: string[]): string[] {
  const key = (q: string) => q.trim().replace(/\s+/g, ' ').replace(/[\s?!.…]+$/u, '').toLowerCase();
  const seen = new Set(inAppointment.map(key));
  const out: string[] = [];
  for (const q of questions) {
    const k = key(q.question);
    if (q.done || !k || seen.has(k)) continue;
    seen.add(k);
    out.push(q.question.trim().slice(0, 200));
  }
  return out;
}

// ---------------------------------------------------------------- 53 récupération physique (check-in)
export type BodyFeeling = 'better' | 'same' | 'worse' | 'not_concerned';
export type Bleeding = 'none' | 'spotting' | 'light' | 'moderate' | 'heavy';
export const BODY_FEELINGS: BodyFeeling[] = ['better', 'same', 'worse', 'not_concerned'];
export const BLEEDINGS: Bleeding[] = ['none', 'spotting', 'light', 'moderate', 'heavy'];

/** Une ligne par jour noté, pour l'historique : seulement ce qui a été saisi. */
export function bodyNotes(c: { checkin_date: string; scar_feeling?: BodyFeeling | null; perineum_feeling?: BodyFeeling | null; bleeding?: Bleeding | null }) {
  return { day: c.checkin_date, scar: c.scar_feeling ?? null, perineum: c.perineum_feeling ?? null, bleeding: c.bleeding ?? null };
}
/** Jours (récents d'abord) où au moins un des trois champs a été noté. */
export function bodyHistory<C extends { checkin_date: string; scar_feeling?: BodyFeeling | null; perineum_feeling?: BodyFeeling | null; bleeding?: Bleeding | null }>(list: C[]) {
  return list.map(bodyNotes).filter((b) => b.scar || b.perineum || b.bleeding).sort((a, b) => b.day.localeCompare(a.day));
}
