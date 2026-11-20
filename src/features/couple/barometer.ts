/**
 * 177 — Baromètre du couple : logique pure, testée (partiels2.test.ts). Une jauge hebdomadaire FACULTATIVE et
 * PERSONNELLE (5 positions décrites par des mots, jamais un nombre affiché), privée par défaut, partagée si on le
 * choisit. RIEN n'est calculé entre les deux partenaires : pas de moyenne, pas d'écart, pas de « qui va mieux ».
 */
import type { ISODate } from '@/lib/domain/dates';

export const LEVELS = [1, 2, 3, 4, 5] as const;
export type Level = (typeof LEVELS)[number];
/** Pictogramme de chaque position (météo intérieure : aucun visage triste ou content qui jugerait). */
export const LEVEL_ICON: Record<Level, 'cloud-lightning' | 'cloud-rain' | 'cloud' | 'cloud-drizzle' | 'sun'> = {
  1: 'cloud-lightning', 2: 'cloud-rain', 3: 'cloud', 4: 'cloud-drizzle', 5: 'sun',
};

export interface BarometerEntry {
  id: string; household_id: string; user_id: string; week_of: ISODate; level: Level; word: string | null; shared: boolean;
  created_at?: string; updated_at?: string;
}

/** Ma jauge de la semaine et ce que l'autre a partagé pour la même semaine ; rien de plus. */
export function weekPair(rows: BarometerEntry[], me: string | null, week: ISODate): { mine: BarometerEntry | null; shared: BarometerEntry[] } {
  const ofWeek = rows.filter((r) => r.week_of === week);
  return { mine: ofWeek.find((r) => r.user_id === me) ?? null, shared: ofWeek.filter((r) => r.user_id !== me && r.shared) };
}

/** Mes semaines passées (les miennes seulement), les plus récentes d'abord. */
export const myHistory = (rows: BarometerEntry[], me: string | null, week: ISODate, n = 6) =>
  rows.filter((r) => r.user_id === me && r.week_of < week).sort((a, b) => b.week_of.localeCompare(a.week_of)).slice(0, n);

export const isLevel = (n: unknown): n is Level => typeof n === 'number' && (LEVELS as readonly number[]).includes(n);
