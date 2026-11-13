/** Types des données d'allaitement (migration 20261113000100_allaitement.sql). */
import type { Breastfeed, Pumping } from './types';
import type { PumpComfort, StashStatus, StashStorage } from './domain/lactation';

/** Tétée : `session_id` relie les segments d'une tétée chronométrée (null pour une saisie simple). */
export type BreastfeedRecord = Breastfeed & { session_id?: string | null };

/** Tirage : `amount_ml` reste le total ; quantités par sein, durée et confort facultatifs. */
export type PumpingRecord = Pumping & {
  left_ml?: number | null;
  right_ml?: number | null;
  duration_min?: number | null;
  comfort?: PumpComfort | null;
};

export interface MilkStashRecord {
  id: string;
  client_id: string | null;
  household_id: string;
  child_id: string;
  pumping_id: string | null;
  volume_ml: number;
  collected_at: string;
  storage: StashStorage;
  location: string | null;
  status: StashStatus;
  status_at: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
