/**
 * Moteur de conseils du cycle : types.
 *
 * Principes (non négociables) :
 *  - règles DÉTERMINISTES, lisibles et testées ; aucune IA ne décide d'un niveau de risque ni d'une recommandation ;
 *  - un conseil dépend UNIQUEMENT de ce que l'utilisatrice a renseigné (une absence de réponse n'est jamais un « non ») ;
 *  - aucun diagnostic, aucun traitement prescrit, aucune probabilité individuelle de grossesse ;
 *  - les estimations du calendrier ne sont jamais présentées comme des certitudes, ni comme le seul critère d'un risque ;
 *  - chaque règle cite ses sources et sa date de révision ; les textes sont dans les dictionnaires (adv.*), pas dans l'interface.
 */

/** Niveaux, du plus léger au plus pressant (ordre d'affichage inverse). */
export const PRIORITIES = ['info', 'practical', 'followup', 'consult', 'prompt', 'emergency'] as const;
export type Priority = (typeof PRIORITIES)[number];
export const rank = (p: Priority) => PRIORITIES.indexOf(p);

export type ActionId =
  | 'learn' // fiche ou source officielle liée
  | 'ec_info' // informations officielles sur la contraception d'urgence
  | 'pregnancy_risk' // comprendre le risque de grossesse (explication dans l'app)
  | 'find_pro' // rechercher un professionnel de santé
  | 'edit' // modifier ma réponse
  | 'review' // vérifier les informations enregistrées
  | 'emergency'; // numéros d'urgence

export type EventType = 'sex' | 'pain' | 'discharge' | 'bleeding' | 'cycle';
export interface EventRef { type: EventType; id: string; date: string }

/** Ce qui a déclenché le conseil (affiché à l'utilisatrice) : clé adv.trig.<key> + paramètres. */
export interface Trigger { key: string; params?: Record<string, string | number> }

export interface Advice {
  ruleId: string;
  /** Messages d'un même groupe pour un même événement : un seul est affiché (le plus prioritaire, déclencheurs réunis). */
  group: string;
  priority: Priority;
  event: EventRef;
  /** Clés adv.<ruleId>.<variant>.title / .body */
  variant: string;
  params: Record<string, string | number>;
  triggers: Trigger[];
  actions: ActionId[];
  /** Question de précision facultative (clé adv.q.<clarify>), au lieu d'une conclusion. */
  clarify?: string;
  sources: string[];
  reviewedOn: string;
  /** Change si une information utile change : le conseil réapparaît comme « mis à jour ». */
  signature: string;
}

export type Match = Pick<Advice, 'priority' | 'variant' | 'triggers' | 'actions'> & { params?: Advice['params']; clarify?: string };

export interface Rule<E> {
  id: string;
  group: string;
  appliesTo: EventType;
  /** Informations utilisées (documentation, tests). */
  uses: string[];
  /** Conditions qui EMPÊCHENT le déclenchement (documentation, tests). */
  guards: string[];
  /** Variantes de messages possibles (toutes doivent exister dans chaque langue). */
  variants: string[];
  sources: string[];
  reviewedOn: string;
  evaluate: (event: E, ctx: AdviceContext) => Match | null;
}

/** Statut d'une date par rapport à la fenêtre fertile ESTIMÉE (jamais une confirmation d'ovulation). */
export type FertileStatus = 'in' | 'near' | 'out' | 'unknown';

export interface AdviceContext {
  now: Date;
  today: string;
  /** Parcours déclaré : seulement une indication par défaut, jamais une présomption sur la vie sexuelle ou la contraception. */
  journey: 'ttc' | 'avoid' | 'cycle' | null;
  pregnant: boolean;
  fertileStatusOn: (iso: string) => { status: FertileStatus; reliable: boolean };
  /** Règles enregistrées autour d'une date (début ou fin à ±2–3 jours). */
  nearRecordedPeriod: (iso: string) => boolean;
  data: {
    periods: { id: string; start_date: string; end_date: string | null }[];
    pain: PainEvent[];
    sex: SexEvent[];
    discharge: DischargeEvent[];
    bleeding: BleedingEvent[];
  };
  estimate: { nextPeriod: string | null; /** Règles attendues après les DERNIÈRES enregistrées (sans report automatique) : sert au retard. */ expectedNext: string | null; averageLength: number | null; variability: number | null; reliability: 'insufficient' | 'low' | 'moderate' };
}

export interface SexEvent {
  id: string; occurred_on: string; occurred_time?: string | null; kind?: string | null;
  condom?: string | null; condom_incident?: string | null; usual_contraception?: string | null; contraception_incident?: string | null;
  ejaculation?: string | null; ec_taken?: string | null; pregnancy_wish?: string | null; professional_seen?: string | null;
}
export interface PainEvent {
  id: string; logged_on: string; pain_intensity?: number | null; pain_locations?: string[]; pain_duration?: string | null; pain_onset?: string | null;
  pain_pattern?: string | null; pain_impact?: string[]; pain_associated?: string[]; pain_pregnancy?: string | null; pain_relief?: string | null;
}
export interface DischargeEvent {
  id: string; observed_at: string; amount?: string | null; color?: string | null; textures?: string[]; odor?: string | null; symptoms?: string[]; pregnancy?: string | null;
}
export interface BleedingEvent { id: string; occurred_on: string; kind: string; amount?: string | null; pain?: boolean | null; pregnancy?: string | null }
