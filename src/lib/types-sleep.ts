/** « Mon sommeil » : le sommeil du parent (table parent_sleep_logs, privée). */

/** Réveil nocturne détaillé : heure « HH:MM » et durée d'éveil approximative, toutes deux facultatives. */
export interface NightWaking { at: string | null; minutes: number | null }

/** Sieste du jour : heures « HH:MM ». */
export interface Nap { start: string; end: string }

export type Scale5 = 1 | 2 | 3 | 4 | 5;

export interface ParentSleepLog {
  id: string;
  user_id: string;
  /** Jour du réveil (AAAA-MM-JJ) : la nuit du 14 au 15 est rangée au 15. */
  log_date: string;
  bedtime: string | null;
  wake_time: string | null;
  night_wakings: number;
  waking_details: NightWaking[];
  sleep_minutes: number | null;
  duration_edited: boolean;
  naps: Nap[];
  quality: Scale5 | null;
  fatigue: Scale5 | null;
  mood: Scale5 | null;
  note: string | null;
  created_at: string;
  updated_at?: string;
}

export type ParentSleepInput = Omit<ParentSleepLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
