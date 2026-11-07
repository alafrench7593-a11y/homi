/**
 * Moral (07/11/2026) — logique pure, testée. Aucun score, aucun diagnostic : on regarde seulement ce que la
 * personne a elle-même noté dans son bilan d'humeur (privé) pour lui proposer, au bon moment, du soutien.
 *  - 'urgent' : elle a coché « pensées inquiétantes pour ma sécurité » ou « Désespoir » ces 7 derniers jours ;
 *  - 'low'    : au moins 3 JOURS différents avec une humeur basse (1 ou 2 sur 5) ces 7 derniers jours ;
 *  - null     : rien à proposer.
 */
export type MoodSupport = 'urgent' | 'low' | null;
export interface MoodLike { checked_at: string; mood: number; feelings: string[]; safety_concern: boolean }

const HEAVY = ['Désespoir'];
const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

export function moodSupport(moods: MoodLike[], now: Date): MoodSupport {
  const since = now.getTime() - 7 * 86400_000;
  const recent = moods.filter((m) => { const t = Date.parse(m.checked_at); return t >= since && t <= now.getTime() + 60_000; });
  if (recent.some((m) => m.safety_concern || m.feelings.some((f) => HEAVY.includes(f)))) return 'urgent';
  const lowDays = new Set(recent.filter((m) => m.mood <= 2).map((m) => dayKey(m.checked_at)));
  return lowDays.size >= 3 ? 'low' : null;
}

/** Semaine ISO « AAAA-Sxx » : la carte masquée par la personne ne revient pas avant la semaine suivante. */
export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400_000 + 1) / 7);
  return `${y}-S${String(w).padStart(2, '0')}`;
}

/** Prochain dimanche 18 h (aujourd'hui si on est dimanche avant 18 h) : rappel hebdomadaire du bilan d'humeur. */
export function nextWeeklyMood(now: Date): Date {
  const d = new Date(now); d.setHours(18, 0, 0, 0);
  const add = (7 - d.getDay()) % 7;
  d.setDate(d.getDate() + add);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
  return d;
}
