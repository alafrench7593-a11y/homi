/**
 * Faits de profil du moteur de recommandation — calculés (purs) à partir des données RÉELLES de la personne :
 * ses réponses d'onboarding, son rôle dans le foyer, SES parcours (jamais ceux de l'autre adulte), la grossesse
 * visible (à elle ou partagée), les enfants suivis et leur âge exact, la diversification réellement commencée, la
 * nounou associée. Recalcul automatique : les faits sont recalculés à chaque rendu depuis les données à jour
 * (nouvelle grossesse, naissance enregistrée, âge qui avance, diversification, nounou ajoutée).
 */
import { readJourneyAnswers, type JourneyAnswers } from './answers';
import { childStageOf, type ChildStage, type Feeding } from './toolMeta';
import type { Scope, ScopeCtx } from '@/lib/journeys/tools';

export type HouseholdRole = 'owner' | 'coparent' | 'caregiver' | null;

export interface ChildFact {
  id: string;
  name: string;
  /** Âge exact en mois (révolus). */
  months: number;
  stage: ChildStage | null;
  /** Diversification commencée : aliments déjà notés pour cet enfant, ou déclarée. */
  diversification: boolean;
}

export interface ProfileFacts {
  role: HouseholdRole;
  caregiverOnly: boolean;
  answers: JourneyAnswers;
  /** Mon parcours du cycle (choisi par moi) : ouvre les outils sensibles correspondants. */
  body: 'ttc' | 'avoid' | 'cycle' | null;
  /** Grossesse visible : `mine` = c'est mon parcours (données du corps), sinon grossesse partagée du foyer. */
  pregnancy: { mine: boolean; weeks: number | null; id?: string } | null;
  /** Mon post-partum (parcours à moi), ou « je viens d'avoir un bébé » déclaré. */
  postpartum: boolean;
  children: ChildFact[];
  /** Nounou associée au foyer (membre « garde »). */
  caregiverLinked: boolean;
  /** Mode d'alimentation déclaré (le nourrisson le plus jeune), ou null. */
  feeding: Feeding | null;
  activeChildId: string | null;
}

export interface FactsInput {
  now?: Date;
  answers?: unknown;
  role?: HouseholdRole;
  caregiverOnly?: boolean;
  /** Types de MES parcours actifs (user_journeys de la personne connectée). */
  myJourneys?: string[];
  pregnancy?: { id?: string; mine: boolean; weeks: number | null } | null;
  children?: { id: string; first_name: string; birth_date: string }[];
  /** Enfants pour lesquels au moins un aliment a été noté (food_introductions). */
  foodsStarted?: string[];
  caregiverLinked?: boolean;
  activeChildId?: string | null;
}

/** Mois révolus entre une date de naissance (AAAA-MM-JJ) et `now`. */
export function monthsBetween(birth: string, now: Date): number {
  const [y, m, d] = birth.split('-').map(Number);
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  return Math.max(0, months);
}

export function buildFacts(i: FactsInput): ProfileFacts {
  const now = i.now ?? new Date();
  const answers = readJourneyAnswers(i.answers) ?? { profile: [], household: null, invite: false, feeding: null, priorities: [] };
  const mine = i.myJourneys ?? [];
  const body = (['ttc', 'avoid', 'cycle'] as const).find((b) => mine.includes(b)) ?? (answers.profile.includes('ttc') ? 'ttc' : null);
  const started = new Set(i.foodsStarted ?? []);
  const declared = answers.feeding && answers.feeding !== 'undisclosed' ? answers.feeding : null;
  const children: ChildFact[] = (i.children ?? []).map((c) => {
    const months = monthsBetween(c.birth_date, now);
    return { id: c.id, name: c.first_name, months, stage: childStageOf(months), diversification: started.has(c.id) || (declared === 'solids' && months < 36) };
  }).sort((a, b) => a.months - b.months);
  const dad = answers.profile.includes('dad');
  const postpartum = mine.includes('postpartum') || (answers.profile.includes('new_baby') && !dad && i.role !== 'coparent' && children.some((c) => c.months < 12));
  return {
    role: i.role ?? null,
    caregiverOnly: !!i.caregiverOnly,
    answers,
    body,
    pregnancy: i.pregnancy ?? null,
    postpartum,
    children,
    caregiverLinked: !!i.caregiverLinked,
    feeding: declared && children.some((c) => c.months < 24) ? declared : null,
    activeChildId: i.activeChildId ?? null,
  };
}

/** Contextes d'ouverture des outils (portées du registre) que ces faits rendent atteignables. */
export function factContexts(f: ProfileFacts): ScopeCtx[] {
  const baby = f.children.find((c) => c.months < 24)?.id ?? null;
  const out: ScopeCtx[] = [{ scope: (f.body ?? 'none') as Scope, postpartum: f.postpartum, babyId: baby }];
  if (f.pregnancy) out.push({ scope: 'pregnancy', pregnancyId: f.pregnancy.id ?? 'p', postpartum: f.postpartum });
  if (f.postpartum) out.push({ scope: 'postpartum', babyId: baby, postpartum: true });
  for (const c of f.children) out.push({ scope: c.months < 24 ? 'baby' : 'child', childId: c.id, postpartum: f.postpartum, babyId: baby });
  if (f.children.length || f.pregnancy) out.push({ scope: 'family', postpartum: f.postpartum });
  return out;
}
