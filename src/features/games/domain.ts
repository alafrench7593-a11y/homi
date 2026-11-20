/**
 * 132 — Jeux éducatifs adaptés à l'âge : logique pure, testée (partiels2.test.ts). Filtres âge, durée, lieu ;
 * favoris et « on l'a fait » (aucune série, aucun objectif, aucune note).
 */
import { GAMES, type GameBand, type GameId, type GameMeta } from '@/content/games';
import type { ISODate } from '@/lib/domain/dates';

export type Duration = 'short' | 'medium' | 'long';
export type PlaceFilter = 'in' | 'out';

export interface GameMark {
  id: string; household_id: string; child_id: string; game_key: string; favorite: boolean; done_count: number; last_done_on: ISODate | null;
  _pending?: boolean;
}

/** Tranche d'âge d'un enfant (mois) ; au-delà de 10 ans, la dernière. */
export function bandForMonths(months: number): GameBand {
  if (months < 12) return '0_1';
  if (months < 36) return '1_3';
  if (months < 72) return '3_6';
  return '6_10';
}

export const durationOf = (minutes: number): Duration => (minutes <= 10 ? 'short' : minutes <= 20 ? 'medium' : 'long');

export interface GameFilter { band: GameBand | null; duration: Duration | null; place: PlaceFilter | null; favoritesOnly?: boolean }

export function filterGames(filter: GameFilter, marks: Pick<GameMark, 'game_key' | 'favorite'>[] = [], all: GameMeta[] = GAMES): GameMeta[] {
  const fav = new Set(marks.filter((m) => m.favorite).map((m) => m.game_key));
  return all.filter((g) => (!filter.band || g.band === filter.band)
    && (!filter.duration || durationOf(g.minutes) === filter.duration)
    && (!filter.place || g.place === filter.place || g.place === 'both')
    && (!filter.favoritesOnly || fav.has(g.id)));
}

export const markOf = <M extends Pick<GameMark, 'game_key'>>(marks: M[], id: GameId): M | undefined => marks.find((m) => m.game_key === id);

/** Ligne à enregistrer après « favori » (bascule) ou « on l'a fait » (date du jour). */
export function nextMark(prev: Pick<GameMark, 'favorite' | 'done_count' | 'last_done_on'> | undefined, action: 'favorite' | 'done', today: ISODate) {
  const base = { favorite: prev?.favorite ?? false, done_count: prev?.done_count ?? 0, last_done_on: prev?.last_done_on ?? null };
  if (action === 'favorite') return { ...base, favorite: !base.favorite };
  return { ...base, done_count: Math.min(999, base.done_count + 1), last_done_on: today };
}
