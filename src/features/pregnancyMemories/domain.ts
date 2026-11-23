/**
 * 50 — Journal de grossesse et souvenirs : logique pure (testée).
 * Un souvenir = une date, la semaine d'aménorrhée (calculée à partir du terme saisi, modifiable), un titre, un texte,
 * jusqu'à 6 photos ou échographies (documents PRIVÉS du coffre). Rien n'est généré ; les souvenirs restent après la
 * naissance (ils ne dépendent pas d'une grossesse en cours).
 */
import { pregnancyProgress } from '@/lib/domain/pregnancy';

export type MemoryKind = 'moment' | 'ultrasound' | 'belly' | 'letter' | 'other';
export const MEMORY_KINDS: MemoryKind[] = ['moment', 'ultrasound', 'belly', 'letter', 'other'];
export const MAX_PHOTOS = 6;

export interface PregnancyMemory {
  id: string; user_id: string; pregnancy_id: string | null; happened_on: string; week_sa: number | null; kind: MemoryKind;
  title: string | null; body: string | null; photo_ids: string[]; created_at?: string; updated_at?: string; _pending?: boolean;
}

/** Semaine d'aménorrhée d'une date, d'après le terme saisi ; null hors de la grossesse (avant le début, longtemps après le terme). */
export function weekOn(dueDate: string | null | undefined, date: string): number | null {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const p = pregnancyProgress(dueDate, date);
  if (p.daysSinceLmp <= 0 || p.weeksSA > 45) return null;
  return p.weeksSA;
}

export type MemoryError = 'pmem.err.date' | 'pmem.err.future' | 'pmem.err.empty' | 'pmem.err.week' | 'pmem.err.photos';
export function validateMemory(d: { date: string | null; week: number | null; title: string; body: string; photos: string[] }, today: string): MemoryError | null {
  if (!d.date) return 'pmem.err.date';
  if (d.date > today) return 'pmem.err.future';
  if (d.week != null && (!Number.isInteger(d.week) || d.week < 0 || d.week > 45)) return 'pmem.err.week';
  if (d.photos.length > MAX_PHOTOS) return 'pmem.err.photos';
  if (!d.title.trim() && !d.body.trim() && !d.photos.length) return 'pmem.err.empty';
  return null;
}

/** « 22 SA » → 22 ; vide → null ; autre chose → NaN (erreur affichée). */
export function parseWeek(raw: string): number | null {
  const s = raw.trim().replace(/\s*SA$/i, '');
  if (!s) return null;
  return /^\d{1,2}$/.test(s) ? Number(s) : Number.NaN;
}

/** Du plus récent au plus ancien, regroupés par trimestre (1 : jusqu'à 14 SA + 6 j, 2 : jusqu'à 28 SA + 6 j, 3 : après). */
export function byTrimester(list: PregnancyMemory[]): { trimester: 1 | 2 | 3 | null; items: PregnancyMemory[] }[] {
  const sorted = [...list].sort((a, b) => b.happened_on.localeCompare(a.happened_on) || (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  const tri = (w: number | null): 1 | 2 | 3 | null => (w == null ? null : w < 15 ? 1 : w < 29 ? 2 : 3);
  const out: { trimester: 1 | 2 | 3 | null; items: PregnancyMemory[] }[] = [];
  for (const m of sorted) {
    const t = tri(m.week_sa);
    const last = out[out.length - 1];
    if (last && last.trimester === t) last.items.push(m);
    else out.push({ trimester: t, items: [m] });
  }
  return out;
}
