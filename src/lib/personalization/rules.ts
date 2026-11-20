/**
 * Règles DÉCLARATIVES du moteur de recommandation (un tableau, pas des `if` dispersés), sans IA.
 * Chaque règle : une condition sur les faits (src/lib/personalization/facts.ts), des outils pondérés (identifiants du
 * registre ou sous-accès `h200_<n>`), et la RAISON lisible affichée sous l'outil (« Parce que Lina a 8 mois »).
 * Les règles d'enfant s'évaluent pour CHAQUE enfant suivi (âge exact, alimentation, diversification, nounou).
 * Les outils sensibles (cycle, contraception, fertilité, santé mentale) n'apparaissent que via une règle déclenchée
 * par un choix de la personne elle-même (son parcours, sa réponse) — voir `optIn` dans engine.ts.
 */
import type { Priority } from './answers';
import type { ChildFact, ProfileFacts } from './facts';

export type ReasonKey =
  | 'pz.r.pregMine' | 'pz.r.pregShared' | 'pz.r.ttc' | 'pz.r.cycle' | 'pz.r.avoid' | 'pz.r.postpartum' | 'pz.r.dad'
  | 'pz.r.partner' | 'pz.r.invite' | 'pz.r.solo' | 'pz.r.separated' | 'pz.r.discover' | 'pz.r.caregiver'
  | 'pz.r.age' | 'pz.r.diversifSoon' | 'pz.r.diversif' | 'pz.r.nanny' | 'pz.r.school'
  | 'pz.r.feed.breast' | 'pz.r.feed.pumped' | 'pz.r.feed.formula' | 'pz.r.feed.mixed' | 'pz.r.feed.solids'
  | `pz.r.prio.${Priority}` | 'pz.r.pinned';

export interface Reason { key: ReasonKey; name?: string; months?: number; weeks?: number }
type W = [id: string, weight: number];

export interface ProfileRule { id: string; when: (f: ProfileFacts) => boolean; tools: W[] | ((f: ProfileFacts) => W[]); reason: (f: ProfileFacts) => Reason }
export interface ChildRule { id: string; when: (c: ChildFact, f: ProfileFacts) => boolean; tools: W[] | ((c: ChildFact, f: ProfileFacts) => W[]); reason: (c: ChildFact, f: ProfileFacts) => Reason }

const has = (f: ProfileFacts, t: ProfileFacts['answers']['profile'][number]) => f.answers.profile.includes(t);
const prio = (f: ProfileFacts, p: Priority) => f.answers.priorities.includes(p);
const isDad = (f: ProfileFacts) => has(f, 'dad') || f.role === 'coparent';
const kids = (f: ProfileFacts) => f.children.length > 0;
const baby = (f: ProfileFacts) => f.children.some((c) => c.months < 12);
const age = (c: ChildFact): Reason => ({ key: 'pz.r.age', name: c.name, months: c.months });

/** Règles de PROFIL (une fois pour la personne). */
export const PROFILE_RULES: ProfileRule[] = [
  { id: 'pregnancy-mine', when: (f) => !!f.pregnancy?.mine, reason: (f) => ({ key: 'pz.r.pregMine', weeks: f.pregnancy?.weeks ?? undefined }),
    tools: (f) => [['preg_evolution', 10], ['preg_calendar', 9], ['preg_feel', 8], ['h200_33', 6], ['preg_lists', 6], ['preg_weight', 6], ['preg_eat', 5], ['preg_names', 5], ['h200_41', 5], ...((f.pregnancy?.weeks ?? 0) >= 18 ? [['preg_moves', 7] as W] : []),
      ...((f.pregnancy?.weeks ?? 0) >= 24 ? [['h200_44', 5] as W] : []), ...((f.pregnancy?.weeks ?? 0) >= 32 ? [['h200_39', 7] as W] : [])] },
  { id: 'pregnancy-shared', when: (f) => !!f.pregnancy && !f.pregnancy.mine, reason: () => ({ key: 'pz.r.pregShared' }),
    tools: (f) => [['preg_evolution', 9], ['preg_calendar', 8], ['preg_names', 7], ['preg_lists', 7], ['h200_33', 6], ['family_missions', 4], ...((f.pregnancy?.weeks ?? 0) >= 28 ? [['h200_48', 7] as W] : [])] },
  { id: 'ttc', when: (f) => f.body === 'ttc', reason: () => ({ key: 'pz.r.ttc' }),
    tools: [['ttc_cycle', 9], ['h200_17', 8], ['ttc_tests', 7], ['ttc_temperature', 6], ['h200_23', 5], ['ttc_intimacy', 4], ['preg_names', 3]] },
  { id: 'cycle', when: (f) => f.body === 'cycle', reason: () => ({ key: 'pz.r.cycle' }),
    tools: [['cycle_home', 8], ['cycle_calendar', 7], ['cycle_symptoms', 6], ['cycle_stats', 4]] },
  { id: 'avoid', when: (f) => f.body === 'avoid', reason: () => ({ key: 'pz.r.avoid' }),
    tools: [['avoid_contraception', 8], ['avoid_reminders', 7], ['cycle_calendar', 6], ['cycle_symptoms', 4]] },
  { id: 'postpartum', when: (f) => f.postpartum, reason: () => ({ key: 'pz.r.postpartum' }),
    tools: [['pp_recovery', 8], ['h200_52', 7], ['sleep', 6], ['h200_61', 5], ['h200_58', 5], ['pp_support', 4], ['h200_60', 4]] },
  { id: 'dad', when: (f) => isDad(f) && (kids(f) || !!f.pregnancy), reason: () => ({ key: 'pz.r.dad' }),
    tools: (f) => [['family_my_place', 6], ['family_missions', 5], ['family_calendar', 4], ...(baby(f) ? [['family_nights', 7] as W] : [])] },
  { id: 'partner', when: (f) => f.answers.household === 'partner', reason: () => ({ key: 'pz.r.partner' }),
    tools: [['family_calendar', 5], ['family_tasks', 4], ['mental_load', 4], ['family_shopping', 3], ['couple_understand', 3], ['h200_179', 2], ['h200_186', 2]] },
  { id: 'invite', when: (f) => f.answers.invite, reason: () => ({ key: 'pz.r.invite' }), tools: [['h200_162', 6]] },
  { id: 'solo', when: (f) => f.answers.household === 'solo', reason: () => ({ key: 'pz.r.solo' }), tools: [['solo_parent', 7], ['family_calendar', 4], ['family_sos', 3]] },
  { id: 'separated', when: (f) => f.answers.household === 'separated', reason: () => ({ key: 'pz.r.separated' }), tools: [['custody', 8], ['family_calendar', 6], ['h200_186', 4], ['h200_165', 3]] },
  // priorités choisies à l'étape 5 (chacune ne propose que ce qui existe pour le foyer)
  { id: 'prio-pregnancy', when: (f) => prio(f, 'pregnancy'), reason: () => ({ key: 'pz.r.prio.pregnancy' }), tools: (f) => (f.pregnancy ? [['preg_evolution', 6], ['preg_calendar', 5]] : [['ttc_start_pregnancy', 6]]) },
  { id: 'prio-meals', when: (f) => prio(f, 'meals'), reason: () => ({ key: 'pz.r.prio.meals' }), tools: [['meal_menu', 6], ['family_shopping', 5], ['meals', 5]] },
  { id: 'prio-sleep', when: (f) => prio(f, 'sleep'), reason: () => ({ key: 'pz.r.prio.sleep' }), tools: (f) => [...(kids(f) ? [['kid_sleep', 7] as W, ['kid_sleep_rhythm', 5] as W] : []), ['family_nights', 5], ['sleep', 4]] },
  { id: 'prio-growth', when: (f) => prio(f, 'growth'), reason: () => ({ key: 'pz.r.prio.growth' }), tools: [['h200_92', 6], ['kid_grow', 5], ['h200_95', 4]] },
  { id: 'prio-appointments', when: (f) => prio(f, 'appointments'), reason: () => ({ key: 'pz.r.prio.appointments' }), tools: [['appointments', 7], ['consult_questions', 5], ['family_calendar', 4]] },
  { id: 'prio-tasks', when: (f) => prio(f, 'tasks'), reason: () => ({ key: 'pz.r.prio.tasks' }), tools: [['family_tasks', 7], ['family_missions', 6], ['mental_load', 5]] },
  { id: 'prio-communication', when: (f) => prio(f, 'communication'), reason: () => ({ key: 'pz.r.prio.communication' }), tools: [['couple_understand', 8], ['couple_week', 6], ['h200_172', 5], ['h200_176', 4], ['h200_179', 4]] },
  { id: 'prio-find_nanny', when: (f) => prio(f, 'find_nanny'), reason: () => ({ key: 'pz.r.prio.find_nanny' }), tools: [['h200_141', 8], ['h200_142', 7], ['h200_144', 6], ['h200_145', 5], ['h200_146', 5], ['h200_147', 4], ['h200_143', 3], ['childcare', 3]] },
  { id: 'prio-childcare_days', when: (f) => prio(f, 'childcare_days'), reason: () => ({ key: 'pz.r.prio.childcare_days' }), tools: [['childcare', 7], ['h200_153', 6]] },
  { id: 'prio-school', when: (f) => prio(f, 'school'), reason: () => ({ key: 'pz.r.prio.school' }), tools: [['kid_school', 7], ['kid_routines', 6], ['h200_139', 4]] },
  { id: 'prio-activities', when: (f) => prio(f, 'activities'), reason: () => ({ key: 'pz.r.prio.activities' }), tools: [['h200_131', 6], ['nearby', 5]] },
  { id: 'prio-meet_parents', when: (f) => prio(f, 'meet_parents'), reason: () => ({ key: 'pz.r.prio.meet_parents' }), tools: [['community', 7], ['h200_192', 5]] },
  // rien de connu, ou « je souhaite simplement découvrir HOMI » : de quoi explorer le quotidien du foyer
  { id: 'discover', when: (f) => has(f, 'discover') || (!kids(f) && !f.pregnancy && !f.body && !f.answers.priorities.length && !f.answers.household),
    reason: () => ({ key: 'pz.r.discover' }),
    tools: [['family_calendar', 3], ['family_tasks', 3], ['meals', 2], ['appointments', 2], ['family_shopping', 2], ['library', 2], ['community', 2], ['sleep', 1], ['brain_dump', 1], ['nearby', 1]] },
];

/** Règles d'ENFANT (évaluées pour chaque enfant suivi). */
export const CHILD_RULES: ChildRule[] = [
  { id: 'age-0-6', when: (c) => c.months < 6, reason: age,
    tools: [['kid_sleep', 8], ['baby_diaper', 7], ['baby_daily', 6], ['h200_92', 5], ['kid_vaccines', 5], ['h200_88', 4]] },
  { id: 'age-6-12', when: (c) => c.months >= 6 && c.months < 12, reason: age,
    tools: [['kid_sleep', 7], ['kid_teeth', 5], ['kid_sleep_rhythm', 5], ['kid_grow', 4], ['kid_vaccines', 4], ['h200_88', 3]] },
  { id: 'diversif-soon', when: (c) => c.months >= 4 && c.months < 12 && !c.diversification, reason: (c) => ({ key: 'pz.r.diversifSoon', name: c.name }), tools: [['h200_111', 6]] },
  { id: 'diversif', when: (c) => c.diversification && c.months < 36, reason: (c) => ({ key: 'pz.r.diversif', name: c.name }),
    tools: [['baby_foods', 8], ['h200_114', 6], ['h200_116', 5], ['h200_113', 4]] },
  { id: 'age-1-3', when: (c) => c.months >= 12 && c.months < 36, reason: age,
    tools: [['kid_grow', 6], ['kid_sleep', 5], ['meals', 5], ['kid_teeth', 4], ['h200_131', 4], ['journal', 3], ['kid_vaccines', 3], ['h200_133', 3]] },
  { id: 'age-3-6', when: (c) => c.months >= 36 && c.months < 72, reason: age,
    tools: [['kid_routines', 5], ['h200_131', 5], ['kid_grow', 4], ['h200_134', 4], ['journal', 3], ['meals', 3], ['h200_133', 3], ['kid_vaccines', 2]] },
  { id: 'age-6-10', when: (c) => c.months >= 72 && c.months < 120, reason: age,
    tools: [['kid_routines', 6], ['h200_139', 5], ['journal', 3], ['nearby', 3], ['h200_133', 3], ['h200_134', 3], ['kid_steps', 2], ['kid_health', 2]] },
  // âge scolaire (3 ans) : outils scolaires PROPOSÉS, sans présumer d'une inscription
  { id: 'school-age', when: (c) => c.months >= 36 && c.months < 132, reason: (c) => ({ key: 'pz.r.school', name: c.name }), tools: [['kid_school', 6]] },
  { id: 'nanny', when: (_c, f) => f.caregiverLinked, reason: (c) => ({ key: 'pz.r.nanny', name: c.name }), tools: (c) => (c.months < 72 ? [['childcare', 8], ['h200_153', 7], ['h200_148', 6], ['h200_149', 5], ['h200_150', 5], ['h200_158', 4]] : []) },
];

/** Alimentation déclarée (étape 4) : s'applique au plus jeune enfant de moins de 2 ans. */
export const FEEDING_TOOLS: Record<'breast' | 'pumped' | 'formula' | 'mixed' | 'solids', W[]> = {
  breast: [['baby_breastfeed', 10], ['h200_67', 6], ['h200_76', 5], ['h200_68', 4], ['h200_73', 3]],
  pumped: [['h200_71', 9], ['baby_bottle', 8], ['h200_73', 7], ['h200_70', 4]],
  formula: [['baby_bottle', 10], ['baby_bottle_timer', 7], ['h200_79', 6], ['bottle_scoops', 5], ['h200_70', 4]],
  mixed: [['baby_breastfeed', 9], ['baby_bottle', 9], ['h200_79', 5], ['h200_70', 4], ['h200_73', 3]],
  solids: [['baby_foods', 9], ['h200_111', 7], ['h200_114', 6], ['h200_116', 5], ['h200_122', 4]],
};

/** Compte qui garde des enfants (nounou) : SEULEMENT les outils de la garde (parmi « Avant la garde » : heures et absences). */
export const CAREGIVER_TOOLS: W[] = [['childcare', 10], ['h200_153', 9], ['h200_157', 8], ['h200_159', 7], ['h200_154', 6], ['h200_155', 6], ['h200_156', 5], ['h200_158', 4], ['h200_149', 4], ['h200_150', 4]];
