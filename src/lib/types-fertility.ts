/** Types des parcours fertilité (alignés sur supabase/migrations/20261016000100_fertility.sql). */

export type FertilityJourney = 'ttc' | 'avoid';

/** Rapport noté (parcours « concevoir ») : PRIVÉ, visible uniquement par la personne qui l'a saisi. */
export interface IntercourseLog { id: string; user_id: string; occurred_on: string; note: string | null; created_at: string }

export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'egg_white' | 'watery' | 'unusual' | 'unknown';
/** Libellés alignés sur « Comprendre mon cycle et mes tests » (src/lib/cycleAnalysis/mucus.ts). */
export const CERVICAL_MUCUS: { value: CervicalMucus; label: string }[] = [
  { value: 'dry', label: 'Sèche ou absente' },
  { value: 'sticky', label: 'Épaisse ou collante' },
  { value: 'creamy', label: 'Crémeuse' },
  { value: 'egg_white', label: 'Transparente et étirable' },
  { value: 'watery', label: 'Aqueuse' },
  { value: 'unusual', label: 'Inhabituelle' },
  { value: 'unknown', label: 'Je ne sais pas' },
];

export interface FertilityObservation {
  id: string; user_id: string; observed_on: string;
  bbt_celsius: number | null; cervical_mucus: CervicalMucus | null; note: string | null; created_at: string;
  mucus_texture?: string | null; mucus_sensation?: string | null;
  photo_suggestion?: string | null; photo_confidence?: number | null; photo_path?: string | null;
}

/** Test d'ovulation ou de grossesse (avec les champs d'analyse photo, tous facultatifs). */
export interface CycleTest {
  id: string; user_id: string; tested_at: string; result: string; note: string | null; created_at: string;
  brand_id?: string | null; brand_label?: string | null; format?: string | null;
  minutes_after?: number | null; within_read_window?: 'yes' | 'no' | 'unknown' | null;
  analysis_outcome?: string | null; analysis_confidence?: number | null; analysis_method?: string | null;
  user_confirmed?: boolean; photo_path?: string | null; expected_period_on?: string | null;
}

export interface CyclePreferences { user_id: string; track_intercourse: boolean }

export type ContraceptionMethodKind =
  | 'pill' | 'iud_copper' | 'iud_hormonal' | 'implant' | 'patch' | 'ring' | 'injection'
  | 'condom' | 'internal_condom' | 'diaphragm' | 'sterilisation' | 'natural' | 'other';

export interface ContraceptionMethod {
  id: string; user_id: string; method: ContraceptionMethodKind; label: string | null;
  started_on: string | null; renewal_due_on: string | null; active: boolean; note: string | null;
  created_at: string; updated_at: string;
}

export interface ConsultationQuestion {
  id: string; user_id: string; household_id: string | null; journey: FertilityJourney;
  question: string; answer: string | null; done: boolean; shared: boolean; position: number;
  created_at: string; updated_at: string;
}
