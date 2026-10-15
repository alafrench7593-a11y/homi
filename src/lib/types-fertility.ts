/** Types des parcours fertilité (alignés sur supabase/migrations/20261016000100_fertility.sql). */

export type FertilityJourney = 'ttc' | 'avoid';

/** Rapport noté (parcours « concevoir ») : PRIVÉ, visible uniquement par la personne qui l'a saisi. */
export interface IntercourseLog { id: string; user_id: string; occurred_on: string; note: string | null; created_at: string }

export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg_white';
export const CERVICAL_MUCUS: { value: CervicalMucus; label: string }[] = [
  { value: 'dry', label: 'Sèche ou absente' },
  { value: 'sticky', label: 'Collante' },
  { value: 'creamy', label: 'Crémeuse' },
  { value: 'watery', label: 'Aqueuse' },
  { value: 'egg_white', label: 'Filante (blanc d’œuf)' },
];

export interface FertilityObservation {
  id: string; user_id: string; observed_on: string;
  bbt_celsius: number | null; cervical_mucus: CervicalMucus | null; note: string | null; created_at: string;
}

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
