/**
 * Métadonnées de personnalisation des outils — TABLE JOINTE au registre (src/lib/journeys/tools.ts), sans toucher à
 * `ToolDef` : étapes de vie, tranche d'âge (mois) des outils d'enfant, mode d'alimentation concerné, données
 * nécessaires, usage de l'IA, disponibilité, et catégorie de donnée SENSIBLE (cycle, contraception, fertilité, santé
 * mentale : ces outils ne sont recommandés que si la personne les a elle-même renseignés ou choisis).
 *
 * Une fonction exposée (`h200_<n>`, liste des 200) hérite des métadonnées de son outil parent, sauf précision ici.
 * Données pures, testées (personalization.test.ts : chaque outil du registre a ses métadonnées).
 */
import { aiAssistantOnline } from '@/config/features';
import { H200_BY_ID, HOMI_200, type AiMode } from '@/lib/journeys/homi200';
import { CATEGORY_TOOLS, REAL_TOOLS, resolveTool } from '@/lib/journeys/tools';

export type LifeStage =
  | 'ttc' | 'pregnancy' | 'postpartum'
  | 'infant_0_6' | 'baby_6_12' | 'toddler_1_3' | 'child_3_6' | 'child_6_10'
  | 'parent' | 'couple' | 'household' | 'nanny';
export const LIFE_STAGES: LifeStage[] = ['ttc', 'pregnancy', 'postpartum', 'infant_0_6', 'baby_6_12', 'toddler_1_3', 'child_3_6', 'child_6_10', 'parent', 'couple', 'household', 'nanny'];
/** Étapes d'ENFANT (filtre « Âge ») et leur tranche en mois [début, fin[. */
export const CHILD_STAGES = ['infant_0_6', 'baby_6_12', 'toddler_1_3', 'child_3_6', 'child_6_10'] as const;
export type ChildStage = (typeof CHILD_STAGES)[number];
export const STAGE_MONTHS: Record<ChildStage, [number, number]> = { infant_0_6: [0, 6], baby_6_12: [6, 12], toddler_1_3: [12, 36], child_3_6: [36, 72], child_6_10: [72, 120] };
/** Étape d'un enfant selon son âge exact en mois (au-delà de 10 ans : aucune étape de la liste). */
export function childStageOf(months: number): ChildStage | null {
  return CHILD_STAGES.find((s) => months >= STAGE_MONTHS[s][0] && months < STAGE_MONTHS[s][1]) ?? null;
}

/** Mode d'alimentation déclaré (onboarding, étape 4). */
export type Feeding = 'breast' | 'pumped' | 'formula' | 'mixed' | 'solids';
export const FEEDINGS: Feeding[] = ['breast', 'pumped', 'formula', 'mixed', 'solids'];
export type RequiredData = 'child' | 'pregnancy' | 'caregiver' | 'partner';
export type Sensitive = 'cycle' | 'contraception' | 'fertility' | 'mental';

export interface ToolMeta {
  lifeStages: LifeStage[];
  /** Outils d'enfant : âge concerné, en mois [min, max[. */
  ageRange?: [number, number];
  feeding?: Feeding[];
  requiredData?: RequiredData[];
  aiMode: AiMode;
  isAvailable: boolean;
  sensitive?: Sensitive;
}

const KIDS: LifeStage[] = ['infant_0_6', 'baby_6_12', 'toddler_1_3', 'child_3_6', 'child_6_10'];
const BABY: LifeStage[] = ['infant_0_6', 'baby_6_12', 'toddler_1_3'];
const PARENT: LifeStage[] = ['parent'];
const HOME: LifeStage[] = ['household', 'parent'];
const MILK: Feeding[] = ['breast', 'pumped', 'mixed'];
const BOTTLE: Feeding[] = ['formula', 'mixed', 'pumped'];
type M = Omit<ToolMeta, 'aiMode' | 'isAvailable'> & { aiMode?: AiMode; isAvailable?: boolean };
const kid = (lifeStages: LifeStage[], ageRange: [number, number], extra: Partial<M> = {}): M => ({ lifeStages, ageRange, requiredData: ['child'], ...extra });
const st = (lifeStages: LifeStage[], extra: Partial<M> = {}): M => ({ lifeStages, ...extra });
const cyc = (sensitive: Sensitive, lifeStages: LifeStage[] = PARENT): M => ({ lifeStages, sensitive });

const RAW: Record<string, M> = {
  // alimentation
  baby_breastfeed: kid([...BABY, 'postpartum'], [0, 36], { feeding: MILK }),
  baby_bottle: kid(BABY, [0, 36], { feeding: BOTTLE }),
  baby_bottle_timer: kid(BABY, [0, 36], { feeding: BOTTLE }),
  baby_bottle_history: kid(BABY, [0, 36], { feeding: BOTTLE }),
  bottle_scoops: kid(['infant_0_6', 'baby_6_12'], [0, 24], { feeding: ['formula', 'mixed'] }),
  baby_foods: kid(['baby_6_12', 'toddler_1_3'], [4, 36], { feeding: ['solids'] }),
  meals: st(['baby_6_12', 'toddler_1_3', 'child_3_6', 'child_6_10', 'household'], { ageRange: [6, 120] }),
  meal_menu: st(HOME),
  meal_pantry: st(['household']),
  meal_rankings: st(['child_3_6', 'child_6_10', 'household']),
  preg_eat: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  scan_food: st(['pregnancy', 'postpartum', 'baby_6_12', 'toddler_1_3', 'household']),
  // sommeil
  kid_sleep: kid(KIDS, [0, 120]),
  kid_sleep_rhythm: kid(KIDS.slice(0, 4), [0, 72]),
  sleep_help: kid(KIDS.slice(0, 4), [0, 72]),
  baby_night_help: kid(BABY, [0, 24]),
  family_nights: st(['postpartum', 'infant_0_6', 'baby_6_12', 'couple'], { requiredData: ['partner'] }),
  sleep: st(['parent', 'pregnancy', 'postpartum']),
  // soins et croissance
  baby_daily: kid(BABY, [0, 24]),
  baby_diaper: kid(BABY, [0, 36]),
  kid_teeth: kid(KIDS.slice(1), [4, 120]),
  scan_product: st(['pregnancy', 'infant_0_6', 'baby_6_12', 'household']),
  scan_history: st(['household']),
  scan_compare: st(['household']),
  kid_products: st(HOME),
  journal: kid(KIDS, [0, 120]),
  kid_profile: kid(KIDS, [0, 120]),
  kid_grow: kid(KIDS.slice(0, 4), [0, 72]),
  kid_mood: kid(KIDS.slice(2), [12, 120]),
  kid_album: kid(KIDS, [0, 120]),
  // santé
  appointments: st(['parent', 'pregnancy', ...KIDS]),
  consult_questions: st(['parent', 'pregnancy', ...KIDS]),
  documents: st(HOME),
  health_book: st(HOME),
  kid_vaccines: kid(KIDS, [0, 120]),
  kid_health: kid(KIDS, [0, 120]),
  kid_treatments: kid(KIDS, [0, 120]),
  medications: st(['parent', ...KIDS]),
  kid_steps: kid(['child_3_6', 'child_6_10'], [36, 120]),
  summary: st(['parent', 'pregnancy', ...KIDS]),
  mood: cyc('mental', ['parent', 'pregnancy', 'postpartum']),
  me_diary: cyc('mental', ['parent', 'pregnancy', 'postpartum']),
  exhaustion_check: cyc('mental', ['parent', 'couple']),
  scan_avoid: st(['household']),
  recall_alerts: st(['household']),
  emergency: st(['parent', 'pregnancy', ...KIDS, 'nanny']),
  ask: st(PARENT, { aiMode: 'central' }),
  local_ai: st(PARENT, { aiMode: 'optional' }),
  library: st(['parent', 'pregnancy', 'postpartum', 'ttc']),
  guides: st(['parent', ...KIDS]),
  videos: st(['parent', ...KIDS]),
  sources: st(PARENT),
  // cycle et fertilité (données sensibles : jamais recommandés sans choix de la personne)
  cycle_home: cyc('cycle'), cycle_calendar: cyc('cycle', ['parent', 'ttc']), cycle_symptoms: cyc('cycle'), cycle_pain: cyc('cycle'),
  cycle_discharge: cyc('cycle'), cycle_bleeding: cyc('cycle'), cycle_journal: cyc('cycle'), cycle_stats: cyc('cycle'),
  cycle_advice: cyc('cycle'), cycle_month: cyc('cycle'), cycle_export: cyc('cycle'), cycle_guides: cyc('cycle'), cycle_kit: cyc('cycle'),
  avoid_contraception: cyc('contraception'), avoid_methods: cyc('contraception'), avoid_emergency: cyc('contraception'),
  avoid_reminders: cyc('contraception'), avoid_consult: cyc('contraception'), contraception_journal: cyc('contraception'),
  ttc_cycle: cyc('fertility', ['ttc']), ttc_tests: cyc('fertility', ['ttc']), ttc_mucus: cyc('fertility', ['ttc']), ttc_temperature: cyc('fertility', ['ttc']),
  ttc_intimacy: cyc('fertility', ['ttc']), ttc_exams: cyc('fertility', ['ttc']), ttc_understand: cyc('fertility', ['ttc']), ttc_consult: cyc('fertility', ['ttc']),
  ttc_reminders: cyc('fertility', ['ttc']), pma_tracker: cyc('fertility', ['ttc']),
  // grossesse et post-partum
  ttc_start_pregnancy: st(['ttc']),
  preg_evolution: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  preg_weight: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  preg_feel: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  preg_moves: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  preg_calendar: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  preg_names: st(['pregnancy', 'ttc']),
  preg_lists: st(['pregnancy'], { requiredData: ['pregnancy'] }),
  pp_recovery: st(['postpartum']),
  pp_checkin: st(['postpartum']),
  pp_history: st(['postpartum']),
  pp_body: st(['postpartum']),
  pp_mental: cyc('mental', ['postpartum']),
  pp_support: st(['postpartum']),
  pp_partner: st(['postpartum', 'couple'], { requiredData: ['partner'] }),
  // école, crèche et garde
  kid_school: kid(['toddler_1_3', 'child_3_6', 'child_6_10'], [24, 120]),
  kid_card: kid(KIDS, [0, 120]),
  kid_routines: kid(['child_3_6', 'child_6_10'], [36, 120]),
  custody: st(['parent', 'couple']),
  childcare: st(['nanny', 'infant_0_6', 'baby_6_12', 'toddler_1_3', 'child_3_6'], { ageRange: [0, 72], requiredData: ['child'] }),
  // couple et foyer
  mental_load: st(['couple', 'household']),
  family_domains: st(['couple', 'household'], { requiredData: ['partner'] }),
  couple_week: st(['couple'], { requiredData: ['partner'] }),
  couple_understand: st(['couple'], { requiredData: ['partner'] }),
  family_review: st(['household']),
  family_metime: st(['parent']),
  offduty: st(['parent']),
  family_difficult: cyc('mental', ['parent']),
  family_urgent: st(['parent']),
  family_sos: st(['parent']),
  solo_parent: st(['parent']),
  // organisation familiale
  family_calendar: st(['household', 'couple']),
  family_tasks: st(['household', 'couple']),
  family_missions: st(['household', 'couple']),
  family_my_place: st(['parent', 'couple']),
  family_routines: st(['household']),
  family_history: st(['household']),
  brain_dump: st(['household', 'parent']),
  family_prep: st(['household']),
  family_shopping: st(['household', 'couple']),
  family_stocks: st(['household']),
  house_notebook: st(['household']),
  family_papers: st(['household']),
  reminders: st(['household', 'parent']),
  nearby: st(['household', ...KIDS]),
  community: st(['parent', 'pregnancy', 'postpartum', 'ttc']),
};

/** Précisions propres à certaines fonctions exposées (le reste hérite de l'outil parent). */
const FN_RAW: Record<string, Partial<M>> = {
  h200_17: { lifeStages: ['ttc'], sensitive: 'fertility' },
  h200_24: { lifeStages: ['ttc'], sensitive: 'fertility' },
  h200_55: { lifeStages: ['postpartum'], sensitive: 'mental' },
  h200_61: { lifeStages: ['postpartum', 'infant_0_6'] },
  h200_62: { lifeStages: ['postpartum', 'pregnancy', 'household'] },
  h200_71: { feeding: ['pumped', 'mixed', 'breast'] },
  h200_78: { lifeStages: ['infant_0_6', 'baby_6_12'], ageRange: [0, 12] },
  h200_100: { lifeStages: KIDS, ageRange: [0, 120], requiredData: ['child'] },
  h200_102: { lifeStages: KIDS, ageRange: [0, 120], requiredData: ['child'] },
  h200_109: { lifeStages: KIDS, ageRange: [0, 120], requiredData: ['child'] },
  h200_111: { ageRange: [4, 18] },
  h200_115: { lifeStages: ['baby_6_12', 'toddler_1_3', 'child_3_6'], ageRange: [6, 72], requiredData: ['child'] },
  h200_116: { lifeStages: ['baby_6_12', 'toddler_1_3'], ageRange: [6, 36], requiredData: ['child'], feeding: ['solids'] },
  h200_118: { lifeStages: ['baby_6_12', 'toddler_1_3', 'child_3_6'], ageRange: [6, 72], requiredData: ['child'] },
  h200_119: { lifeStages: ['baby_6_12', 'toddler_1_3'], ageRange: [6, 36], requiredData: ['child'], feeding: ['solids'] },
  h200_121: { lifeStages: ['baby_6_12', 'toddler_1_3'], ageRange: [6, 36], requiredData: ['child'], feeding: ['solids'] },
  // Avant la garde (141–147 : chercher, comparer, budgéter ; 148–150 : une garde en place ; 151 : contrats)
  ...Object.fromEntries([141, 142, 143, 144, 145, 146, 147].map((n) => [`h200_${n}`, { lifeStages: ['parent', 'infant_0_6', 'baby_6_12', 'toddler_1_3', 'child_3_6'] as LifeStage[], requiredData: [] as RequiredData[] }])),
  ...Object.fromEntries([148, 149, 150].map((n) => [`h200_${n}`, { lifeStages: ['parent', 'nanny', 'infant_0_6', 'baby_6_12', 'toddler_1_3', 'child_3_6'] as LifeStage[], requiredData: ['child', 'caregiver'] as RequiredData[] }])),
  h200_151: { lifeStages: ['parent', 'household', 'nanny'], requiredData: [], ageRange: undefined },
  h200_152: { requiredData: ['child'] },
  h200_153: { requiredData: ['child', 'caregiver'] }, h200_154: { requiredData: ['child', 'caregiver'] }, h200_155: { requiredData: ['child', 'caregiver'] },
  h200_156: { requiredData: ['child', 'caregiver'] }, h200_157: { requiredData: ['child', 'caregiver'] }, h200_158: { requiredData: ['child', 'caregiver'] },
  h200_159: { requiredData: ['child', 'caregiver'] },
  h200_162: { lifeStages: ['couple', 'parent'] },
  h200_165: { requiredData: ['partner'] },
  h200_176: { requiredData: ['partner'] }, h200_180: { requiredData: ['partner'] },
  // Outils construits le 20/11/2026 (anciens « absents » de la liste des 200)
  h200_39: { lifeStages: ['pregnancy'], requiredData: ['pregnancy'] },
  h200_44: { lifeStages: ['pregnancy'], requiredData: ['pregnancy'] },
  h200_48: { lifeStages: ['pregnancy', 'couple'], requiredData: ['pregnancy'] },
  h200_58: { lifeStages: ['postpartum'] }, h200_60: { lifeStages: ['postpartum'] },
  h200_73: { feeding: ['breast', 'pumped', 'mixed'], ageRange: [0, 24] }, h200_74: { feeding: ['breast', 'pumped', 'mixed'], ageRange: [0, 24] },
  h200_76: { feeding: ['breast', 'mixed'], ageRange: [0, 24] }, h200_77: { feeding: ['breast', 'mixed'], ageRange: [0, 24] },
  h200_79: { lifeStages: ['infant_0_6', 'baby_6_12', 'toddler_1_3', 'nanny'], feeding: ['formula', 'mixed'], ageRange: [0, 36] },
  h200_122: { lifeStages: ['baby_6_12', 'toddler_1_3', 'child_3_6'], ageRange: [4, 36], feeding: ['solids'] },
  h200_133: { lifeStages: ['toddler_1_3', 'child_3_6', 'child_6_10'], ageRange: [12, 120] },
  h200_134: { lifeStages: ['toddler_1_3', 'child_3_6', 'child_6_10'], ageRange: [24, 120] },
  h200_172: { lifeStages: ['couple', 'household'], requiredData: ['partner'] },
  h200_179: { lifeStages: ['couple'], requiredData: ['partner'] },
  h200_186: { lifeStages: ['couple', 'household', 'parent'], requiredData: [] },
  h200_189: { lifeStages: ['household'] },
};

/** Disponibilité lue au moment de l'appel : l'assistant en ligne suit son interrupteur (config/features.ts). */
const DYNAMIC: Record<string, () => boolean> = { ask: aiAssistantOnline };
const full = (m: M, id?: string): ToolMeta => ({ aiMode: 'none', isAvailable: id && DYNAMIC[id] ? DYNAMIC[id]() : true, ...m });

/** Métadonnées d'un outil ou d'une fonction exposée (identifiant actuel ou ancien) ; null si inconnu. */
export function toolMeta(id: string): ToolMeta | null {
  const r = resolveTool(id);
  if (!r) return null;
  const base = RAW[r.def.id];
  if (!base) return null;
  if (r.sub?.fn) {
    const e = H200_BY_ID[r.id];
    return full({ ...base, ...(FN_RAW[r.id] ?? {}), aiMode: e?.ai ?? 'none' });
  }
  return full(base, r.def.id);
}

/** Identifiants (outils du registre) sans métadonnées : doit rester vide (test). */
export const missingMeta = () => REAL_TOOLS.filter((d) => !RAW[d.id]).map((d) => d.id);
/** Nombre d'outils couverts (contrôle) : les 9 catégories et la Communauté. */
export const metaCoverage = () => ({ tools: CATEGORY_TOOLS.length + 1, h200: HOMI_200.length });
