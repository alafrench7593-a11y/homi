/**
 * Journal intime : les pages sont les bilans d'humeur qui portent un texte (table `mood_checkins`, champ `journal`),
 * donc privées par construction (politique « propriétaire uniquement »). Aucune donnée n'est générée.
 */
import type { MoodCheckin } from '@/lib/types';

export const DIARY_MAX = 6000;
export type DiaryError = 'empty' | 'mood' | 'long';

export function validateDiary(text: string, mood: number | null): DiaryError | null {
  if (!text.trim()) return 'empty';
  if (text.trim().length > DIARY_MAX) return 'long';
  if (!mood || mood < 1 || mood > 5) return 'mood';
  return null;
}

/** Les pages du journal : uniquement les bilans qui portent un texte, de la plus récente à la plus ancienne. */
export function diaryPages(moods: MoodCheckin[] | undefined): MoodCheckin[] {
  return (moods ?? []).filter((m) => !!m.journal && m.journal.trim().length > 0).sort((a, b) => b.checked_at.localeCompare(a.checked_at));
}

export interface DiaryMonth { key: string; pages: MoodCheckin[] }
/** Regroupe par mois civil local (clé « AAAA-MM »), en gardant l'ordre reçu. */
export function groupByMonth(pages: MoodCheckin[]): DiaryMonth[] {
  const out: DiaryMonth[] = [];
  for (const p of pages) {
    const d = new Date(p.checked_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const last = out[out.length - 1];
    if (last && last.key === key) last.pages.push(p); else out.push({ key, pages: [p] });
  }
  return out;
}
