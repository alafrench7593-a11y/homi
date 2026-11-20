/** 27 — Calendrier des examens (parcours fertilité) : logique pure, testée (partiels2.test.ts). */
import type { Appointment } from '@/lib/types';

export type ExamRow = Appointment & { result_note?: string | null; care_track?: string | null; _pending?: boolean };

/** À venir (dans l'ordre, l'heure en cours comprise) et passés (les plus récents d'abord). */
export function splitExams(rows: ExamRow[], now: Date): { upcoming: ExamRow[]; past: ExamRow[] } {
  const cutoff = now.getTime() - 3600_000;
  const list = rows.filter((r) => r.care_track === 'fertility');
  return {
    upcoming: list.filter((r) => Date.parse(r.starts_at) >= cutoff).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    past: list.filter((r) => Date.parse(r.starts_at) < cutoff).sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
  };
}
