/** Types des parcours fertilité (alignés sur supabase/migrations/20261016000100_fertility.sql). */
import { localized } from '@/i18n/localized';

/** Parcours des questions de consultation : fertilité, contraception, post-partum, puis (04/11/2026) grossesse, enfant et « moi » en général. */
export type FertilityJourney = 'ttc' | 'avoid' | 'postpartum' | 'pregnancy' | 'child' | 'general';

/** Rapport noté (parcours « concevoir ») : PRIVÉ, visible uniquement par la personne qui l'a saisi. */
export type Answer = 'yes' | 'no' | 'unsure' | 'prefer_not';
/** Rapport : chaque détail est FACULTATIF (null = pas de réponse, différent de « non »). */
export interface IntercourseLog {
  id: string; user_id: string; occurred_on: string; note: string | null; created_at: string; updated_at?: string;
  occurred_time?: string | null; kind?: 'vaginal' | 'other' | 'prefer_not' | null;
  condom?: Answer | null; condom_incident?: 'none' | 'broke' | 'slipped' | 'other' | 'unsure' | null;
  usual_contraception?: Answer | null; contraception_type?: string | null;
  contraception_incident?: 'none' | 'missed' | 'late' | 'misuse' | 'other' | 'unsure' | null;
  ejaculation?: Answer | null; ec_taken?: 'yes' | 'no' | 'unsure' | null; pregnancy_wish?: Answer | null; professional_seen?: 'yes' | 'no' | null;
}

export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'egg_white' | 'watery' | 'unusual' | 'unknown';
/** Libellés alignés sur « Comprendre mon cycle et mes tests » (src/lib/cycleAnalysis/mucus.ts). */
const CERVICAL_MUCUS_FR: { value: CervicalMucus; label: string }[] = [
  { value: 'dry', label: 'Sèche ou absente' },
  { value: 'sticky', label: 'Épaisse ou collante' },
  { value: 'creamy', label: 'Crémeuse' },
  { value: 'egg_white', label: 'Transparente et étirable' },
  { value: 'watery', label: 'Aqueuse' },
  { value: 'unusual', label: 'Inhabituelle' },
  { value: 'unknown', label: 'Je ne sais pas' },
];
const CERVICAL_MUCUS_EN: { value: CervicalMucus; label: string }[] = [
  { value: 'dry', label: 'Dry or absent' },
  { value: 'sticky', label: 'Thick or sticky' },
  { value: 'creamy', label: 'Creamy' },
  { value: 'egg_white', label: 'Clear and stretchy' },
  { value: 'watery', label: 'Watery' },
  { value: 'unusual', label: 'Unusual' },
  { value: 'unknown', label: 'I don’t know' },
];
export const CERVICAL_MUCUS: { value: CervicalMucus; label: string }[] = localized(CERVICAL_MUCUS_FR, CERVICAL_MUCUS_EN);

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

export interface CyclePreferences { user_id: string; track_intercourse: boolean; /** Masquer les données sensibles du cycle sur l'accueil. */ hide_on_home?: boolean; /** Conseils personnalisés (activés par défaut). */ advice_enabled?: boolean; /** Notifications détaillées (désactivées par défaut : textes neutres). */ detailed_notifications?: boolean;
  /** Raccourcis favoris (5 au plus) et date du premier choix. */ favorites?: string[] | null; favorites_set_at?: string | null;
  /** Icône des rapports dans le calendrier. */ show_intimacy_icons?: boolean; /** Verrouillage biométrique. */ lock_mode?: 'off' | 'intimate' | 'cycle'; /** Anticipation (Premium). */ anticipation?: boolean }

export type ContraceptionMethodKind =
  | 'pill' | 'iud_copper' | 'iud_hormonal' | 'implant' | 'patch' | 'ring' | 'injection'
  | 'condom' | 'internal_condom' | 'diaphragm' | 'sterilisation' | 'natural' | 'other';

export interface ContraceptionMethod {
  id: string; user_id: string; method: ContraceptionMethodKind; label: string | null;
  started_on: string | null; renewal_due_on: string | null; active: boolean; note: string | null;
  created_at: string; updated_at: string;
}

export interface ConsultationQuestion {
  id: string; user_id: string; household_id: string | null; journey: FertilityJourney; child_id?: string | null;
  question: string; answer: string | null; done: boolean; shared: boolean; position: number;
  created_at: string; updated_at: string;
}

/** Contraception prise, oubliée ou changée : déclarée par la personne, jamais une recommandation. */
export interface ContraceptionLog { id: string; user_id: string; logged_on: string; kind: string; label: string | null; note: string | null; created_at: string }
export interface CycleCustomItem { id: string; user_id: string; label: string; icon: string | null; created_at: string }
export interface CycleInsightFeedback { user_id: string; insight_key: string; helpful: boolean; created_at: string }
