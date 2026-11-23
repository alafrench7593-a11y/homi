/**
 * Onboarding v2 (« première ouverture immersive », 19/11/2026) — logique PURE, testée (src/__tests__/onboardingPersonalize.test.ts).
 *
 * Les réponses (situation, besoins, foyer, répartition des tâches) deviennent :
 *  - les parcours HOMI réellement activés (`journeysFor`) ;
 *  - une synthèse calculée (`personalize`) : objectif principal, besoin prioritaire, 3 outils recommandés (de VRAIS
 *    outils du registre src/lib/journeys/tools.ts, autorisés pour les parcours choisis), première action proposée,
 *    fonctions Premium pertinentes (catalogue réel src/lib/premium/features.ts) ;
 *  - la charge utile enregistrée dans `profiles.onboarding_answers` (`answersPayload`, bornée).
 * Aucun texte ici : seulement des clés et des identifiants (traduits par l'écran).
 */
import type { FamilySituation, Journey } from '@/lib/types';
import type { PremiumFeature } from '@/lib/premium/features';
import { TOOL_BY_ID, screenAllowed, type Scope } from '@/lib/journeys/tools';

/** Version du parcours enregistrée avec les réponses (1 = ancien onboarding sans réponses détaillées). */
export const ONBOARDING_VERSION = 2;

export type Situation = 'ttc' | 'cycle' | 'pregnant' | 'baby' | 'kids' | 'home';
export const SITUATIONS: Situation[] = ['ttc', 'pregnant', 'baby', 'kids', 'cycle', 'home'];
/** Objectif du suivi du cycle (sous-choix de « Suivre mon cycle »). */
export type CycleGoal = 'cycle' | 'avoid';

export type Need = 'mental_load' | 'sleep' | 'health' | 'appointments' | 'meals' | 'community';
export const NEEDS: Need[] = ['mental_load', 'sleep', 'health', 'appointments', 'meals', 'community'];
/** On garde les besoins vraiment prioritaires : 2 au plus. */
export const MAX_NEEDS = 2;

export type Helper = 'nanny' | 'daycare';
export const HELPERS: Helper[] = ['nanny', 'daycare'];

/** Destinataire d'une tâche glissée à l'étape « Qui s'en occupe ? ». */
export type Assignee = 'me' | 'other' | 'later';
export type TaskKey = 'appt' | 'night' | 'shopping' | 'meals' | 'laundry' | 'daycare' | 'nanny' | 'school' | 'admin' | 'bag';

export interface OnboardingAnswers {
  situations: Situation[];
  cycleGoal: CycleGoal;
  needs: Need[];
  sharing: FamilySituation | null;
  helpers: Helper[];
  split: Partial<Record<TaskKey, Assignee>>;
}

export const emptyAnswers = (): OnboardingAnswers => ({ situations: [], cycleGoal: 'cycle', needs: [], sharing: null, helpers: [], split: {} });

// ------------------------------------------------------------------------------------------------ situation
/** Situations qui s'excluent : un seul suivi du corps à la fois (projet bébé, grossesse, cycle). */
const BODY: Situation[] = ['ttc', 'pregnant', 'cycle'];

/** Sélection (multiple) d'une situation, en gardant un seul suivi du corps. */
export function toggleSituation(list: Situation[], s: Situation): Situation[] {
  if (list.includes(s)) return list.filter((x) => x !== s);
  const base = BODY.includes(s) ? list.filter((x) => !BODY.includes(x)) : list;
  return [...base, s];
}

/** Besoins (2 au plus, dans l'ordre de choix ; le plus ancien cède sa place). */
export function toggleNeed(list: Need[], n: Need): Need[] {
  if (list.includes(n)) return list.filter((x) => x !== n);
  const next = [...list, n];
  return next.length > MAX_NEEDS ? next.slice(next.length - MAX_NEEDS) : next;
}

/** Parcours HOMI réellement activés par les réponses (même modèle que l'ancien onboarding). */
export function journeysFor(a: Pick<OnboardingAnswers, 'situations' | 'cycleGoal'>): Journey[] {
  const out: Journey[] = [];
  for (const s of a.situations) {
    if (s === 'ttc') out.push('ttc');
    else if (s === 'cycle') out.push(a.cycleGoal === 'avoid' ? 'avoid' : 'cycle');
    else if (s === 'pregnant') out.push('pregnant');
    else if (s === 'baby') out.push('newborn');
    else if (s === 'kids') out.push('family');
  }
  return [...new Set(out)];
}

/** Réponses déduites d'un ancien brouillon (parcours seuls). */
export function situationsFromJourneys(journeys: Journey[]): Pick<OnboardingAnswers, 'situations' | 'cycleGoal'> {
  const s: Situation[] = [];
  if (journeys.includes('ttc')) s.push('ttc');
  if (journeys.includes('pregnant')) s.push('pregnant');
  if (journeys.includes('cycle') || journeys.includes('avoid')) s.push('cycle');
  if (journeys.includes('newborn')) s.push('baby');
  if (journeys.includes('family') || journeys.includes('child')) s.push('kids');
  return { situations: s, cycleGoal: journeys.includes('avoid') ? 'avoid' : 'cycle' };
}

export const needsPregnancyForm = (a: Pick<OnboardingAnswers, 'situations'>) => a.situations.includes('pregnant');
export const needsChildrenForm = (a: Pick<OnboardingAnswers, 'situations'>) => a.situations.includes('baby') || a.situations.includes('kids');

/** Portées (registre des outils) que ces réponses ouvriront. */
export function scopesFor(a: Pick<OnboardingAnswers, 'situations' | 'cycleGoal'>): Scope[] {
  const out = new Set<Scope>();
  for (const s of a.situations) {
    if (s === 'ttc') out.add('ttc');
    else if (s === 'cycle') out.add(a.cycleGoal === 'avoid' ? 'avoid' : 'cycle');
    else if (s === 'pregnant') out.add('pregnancy');
    else if (s === 'baby') { out.add('baby'); out.add('postpartum'); }
    else if (s === 'kids') { out.add('child'); out.add('family'); }
  }
  if (!out.size || a.situations.includes('home')) out.add('none');
  return [...out];
}

/** Situation principale (ordre d'importance au quotidien). */
const PRIMARY_ORDER: Situation[] = ['baby', 'pregnant', 'kids', 'ttc', 'cycle', 'home'];
export function primarySituation(a: Pick<OnboardingAnswers, 'situations'>): Situation {
  return PRIMARY_ORDER.find((s) => a.situations.includes(s)) ?? 'home';
}

/** Besoin prioritaire : le premier choisi, sinon celui que la situation rend le plus probable. */
const DEFAULT_NEED: Record<Situation, Need> = { baby: 'sleep', pregnant: 'appointments', kids: 'mental_load', ttc: 'health', cycle: 'health', home: 'mental_load' };
export function priorityNeed(a: Pick<OnboardingAnswers, 'situations' | 'needs'>): Need {
  return a.needs[0] ?? DEFAULT_NEED[primarySituation(a)];
}

/** Centres d'intérêt du profil (profiles.interests) déduits des besoins. */
export function interestsFor(a: Pick<OnboardingAnswers, 'needs'>): ('health' | 'community')[] {
  return (['health', 'community'] as const).filter((k) => a.needs.includes(k));
}

// ------------------------------------------------------------------------------------------------ outils recommandés
/** Outils candidats par besoin, puis par situation (identifiants du registre TOOLS, adresses sans enfant). */
const NEED_TOOLS: Record<Need, string[]> = {
  mental_load: ['mental_load', 'family_missions', 'brain_dump', 'family_tasks'],
  sleep: ['kid_sleep', 'family_nights', 'sleep'],
  health: ['preg_evolution', 'ttc_cycle', 'cycle_home', 'avoid_contraception', 'consult_questions', 'mood'],
  appointments: ['appointments', 'preg_calendar', 'family_calendar'],
  meals: ['family_shopping', 'meals', 'preg_eat'],
  community: ['community'],
};
const SITUATION_TOOLS: Record<Situation, string[]> = {
  baby: ['baby_bottle_history', 'kid_sleep', 'family_nights'],
  pregnant: ['preg_evolution', 'preg_calendar', 'preg_lists'],
  kids: ['family_missions', 'family_calendar', 'kid_routines'],
  ttc: ['ttc_cycle', 'ttc_calendar', 'cycle_stats'],
  cycle: ['cycle_home', 'cycle_stats', 'cycle_symptoms', 'avoid_contraception'],
  home: ['family_tasks', 'family_shopping', 'family_calendar'],
};

export interface RecommendedTool { id: string; route: string; icon: string }

/** Adresse d'un outil pour une portée (sans enfant choisi), ou null s'il n'est pas ouvert à ces portées. */
export function toolRoute(id: string, scopes: Scope[]): string | null {
  const def = TOOL_BY_ID[id];
  if (!def) return null;
  const scope = def.scopes.find((s) => scopes.includes(s));
  if (!scope) return null;
  const href = def.href({ scope });
  if (!href || (def.when && !def.when({ scope }))) return null;
  return screenAllowed(href.split('?')[0], scopes) ? href : null;
}

export function recommendTools(a: OnboardingAnswers, count = 3): RecommendedTool[] {
  const scopes = scopesFor(a);
  const primary = primarySituation(a);
  const order = [
    ...a.needs.flatMap((n) => NEED_TOOLS[n]),
    ...SITUATION_TOOLS[primary],
    ...a.situations.filter((s) => s !== primary).flatMap((s) => SITUATION_TOOLS[s]),
    ...NEED_TOOLS[priorityNeed(a)],
    'family_tasks', 'appointments', 'family_calendar',
  ];
  const out: RecommendedTool[] = [];
  const seenRoute = new Set<string>();
  // Tour 1 : au plus un outil par besoin choisi (les deux besoins sont servis), puis on complète dans l'ordre
  const firstPass = a.needs.map((n) => NEED_TOOLS[n].find((id) => toolRoute(id, scopes))).filter((x): x is string => !!x);
  for (const id of [...firstPass, ...order]) {
    if (out.length >= count) break;
    const route = toolRoute(id, scopes);
    if (!route || out.some((x) => x.id === id) || seenRoute.has(route)) continue;
    seenRoute.add(route);
    out.push({ id, route, icon: TOOL_BY_ID[id].icon });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ première action
export type FirstActionKey = 'bottle' | 'week' | 'mission' | 'period' | 'fertility' | 'brain_dump' | 'shopping' | 'appointment' | 'night';
export interface FirstAction { key: FirstActionKey; route: string }

export function firstAction(a: OnboardingAnswers): FirstAction {
  const scopes = scopesFor(a);
  const need = priorityNeed(a);
  const shared = a.sharing === 'couple' || a.sharing === 'coparenting';
  const pick = (key: FirstActionKey, route: string): FirstAction | null => (screenAllowed(route.split('?')[0], scopes) ? { key, route } : null);
  const byNeed: (FirstAction | null)[] = [
    need === 'mental_load' ? (shared ? pick('mission', '/family/missions/new') : pick('brain_dump', '/family/brain-dump')) : null,
    need === 'meals' ? pick('shopping', '/meals/shopping') : null,
    need === 'appointments' ? pick('appointment', '/appointments') : null,
    need === 'sleep' && (a.situations.includes('baby') || a.situations.includes('kids')) ? pick('night', '/night') : null,
  ];
  const bySituation: Record<Situation, FirstAction | null> = {
    baby: pick('bottle', '/bottle'),
    pregnant: pick('week', '/pregnancy'),
    ttc: pick('fertility', '/fertility'),
    cycle: pick('period', '/cycle'),
    kids: shared ? pick('mission', '/family/missions/new') : pick('brain_dump', '/family/brain-dump'),
    home: pick('brain_dump', '/family/brain-dump'),
  };
  return byNeed.find(Boolean) ?? bySituation[primarySituation(a)] ?? { key: 'brain_dump', route: '/family/brain-dump' };
}

// ------------------------------------------------------------------------------------------------ Premium pertinent
const NEED_PREMIUM: Partial<Record<Need, PremiumFeature>> = {
  sleep: 'sleep_insights', meals: 'weekly_menu', appointments: 'summaries', community: 'community_groups', mental_load: 'family_summary',
};
const SITUATION_PREMIUM: Record<Situation, PremiumFeature[]> = {
  baby: ['sleep_insights', 'summaries', 'voice_entry'],
  pregnant: ['summaries', 'premium_content', 'assistant_suggestions'],
  kids: ['family_summary', 'weekly_menu', 'development_full'],
  ttc: ['cycle_insights', 'cycle_trends', 'cycle_monthly'],
  cycle: ['cycle_insights', 'cycle_trends', 'cycle_share'],
  home: ['weekly_menu', 'more_reminders', 'more_lists'],
};
/** Fonctions Premium à présenter (réelles, liées aux réponses) ; le partage avec le coparent si le foyer est partagé. */
export function premiumHighlights(a: OnboardingAnswers, count = 3): PremiumFeature[] {
  const primary = primarySituation(a);
  const shared = a.sharing === 'couple' || a.sharing === 'coparenting';
  const out: PremiumFeature[] = [];
  const push = (f: PremiumFeature | undefined) => { if (f && !out.includes(f) && out.length < count) out.push(f); };
  // Le résumé familial n'a de sens qu'avec des enfants suivis
  const fit = (f: PremiumFeature | undefined) => (f === 'family_summary' && !needsChildrenForm(a) ? undefined : f === 'sleep_insights' && !needsChildrenForm(a) ? undefined : f);
  for (const n of a.needs) push(fit(NEED_PREMIUM[n]));
  if (shared) push('coparent_invite');
  for (const f of SITUATION_PREMIUM[primary]) push(fit(f));
  for (const s of a.situations) for (const f of SITUATION_PREMIUM[s]) push(fit(f));
  return out;
}

// ------------------------------------------------------------------------------------------------ répartition
/** Cartes de tâches à répartir (3 à 4), choisies selon la situation, les besoins et les aides du foyer. */
export function splitDeck(a: OnboardingAnswers): TaskKey[] {
  const out: TaskKey[] = [];
  const add = (k: TaskKey) => { if (!out.includes(k)) out.push(k); };
  const p = primarySituation(a);
  if (a.situations.includes('baby')) add('night');
  if (a.situations.includes('pregnant')) add('bag');
  add('appt');
  if (a.helpers.includes('daycare')) add('daycare');
  if (a.helpers.includes('nanny')) add('nanny');
  if (a.needs.includes('meals')) add('meals');
  add('shopping');
  if (p === 'kids' || a.situations.includes('kids')) add('school');
  add('laundry');
  add('admin');
  return out.slice(0, 4);
}

/** Destinataires proposés : « moi » et l'autre parent, ou « moi » et « plus tard / à confier » seul·e. */
export function assignees(a: Pick<OnboardingAnswers, 'sharing' | 'helpers'>): { left: Assignee; right: Assignee } {
  return { left: 'me', right: a.sharing === 'couple' || a.sharing === 'coparenting' ? 'other' : 'later' };
}

export function splitCounts(split: OnboardingAnswers['split']): Record<Assignee, number> {
  const c: Record<Assignee, number> = { me: 0, other: 0, later: 0 };
  for (const v of Object.values(split)) if (v) c[v] += 1;
  return c;
}

// ------------------------------------------------------------------------------------------------ synthèse
export interface Personalization {
  primary: Situation;
  need: Need;
  tools: RecommendedTool[];
  first: FirstAction;
  premium: PremiumFeature[];
  journeys: Journey[];
}

export function personalize(a: OnboardingAnswers): Personalization {
  return {
    primary: primarySituation(a),
    need: priorityNeed(a),
    tools: recommendTools(a),
    first: firstAction(a),
    premium: premiumHighlights(a),
    journeys: journeysFor(a),
  };
}

// ------------------------------------------------------------------------------------------------ enregistrement
/** Nettoie des réponses venues d'un brouillon (valeurs inconnues retirées). */
export function sanitizeAnswers(raw: unknown): OnboardingAnswers {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const list = <T extends string>(v: unknown, allowed: readonly T[]) => (Array.isArray(v) ? [...new Set(v.filter((x): x is T => (allowed as readonly string[]).includes(x as string)))] : []);
  const TASKS: TaskKey[] = ['appt', 'night', 'shopping', 'meals', 'laundry', 'daycare', 'nanny', 'school', 'admin', 'bag'];
  const split: OnboardingAnswers['split'] = {};
  if (r.split && typeof r.split === 'object') {
    for (const [k, v] of Object.entries(r.split as Record<string, unknown>)) {
      if ((TASKS as string[]).includes(k) && (v === 'me' || v === 'other' || v === 'later')) split[k as TaskKey] = v;
    }
  }
  const sharing = r.sharing === 'solo' || r.sharing === 'couple' || r.sharing === 'coparenting' ? r.sharing : null;
  return {
    situations: list(r.situations, SITUATIONS),
    cycleGoal: r.cycleGoal === 'avoid' ? 'avoid' : 'cycle',
    needs: list(r.needs, NEEDS).slice(0, MAX_NEEDS),
    sharing,
    helpers: list(r.helpers, HELPERS),
    split,
  };
}

/** Charge utile de `profiles.onboarding_answers` (aucune donnée de santé détaillée : seulement les choix du parcours). */
export function answersPayload(a: OnboardingAnswers, p: Personalization, now: Date = new Date()) {
  const s = sanitizeAnswers(a);
  return {
    v: ONBOARDING_VERSION,
    situations: s.situations,
    cycle_goal: s.situations.includes('cycle') ? s.cycleGoal : null,
    needs: s.needs,
    sharing: s.sharing,
    helpers: s.helpers,
    split: s.split,
    recommendations: { primary: p.primary, need: p.need, tools: p.tools.map((x) => x.id), first_action: p.first.key, premium: p.premium },
    completed_at: now.toISOString(),
  };
}
