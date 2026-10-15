/** Types du minuteur biberon (alignés sur supabase/migrations/20261016000700_bottle_timers.sql). */
import type { BottleTimerStatus } from './domain/bottleTimer';
import type { Bottle } from './types';

export type { BottleTimerStatus };

export interface BottleTimer {
  id: string;
  household_id: string;
  child_id: string;
  bottle_id: string | null;
  last_bottle_at: string;
  interval_minutes: number;
  due_at: string;
  planned_ml: number | null;
  status: BottleTimerStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Biberon avec la quantité prévue pour le suivant (colonne ajoutée par la migration du minuteur). */
export interface BottleRecord extends Bottle {
  planned_next_ml?: number | null;
}
