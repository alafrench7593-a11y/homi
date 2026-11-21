/**
 * Parcours « première réussite » avant l'abonnement (03/12/2026) — modèle PUR (testé : src/__tests__/firstWin.test.ts).
 *
 * Avant tout compte : (1) étape de vie → (2) « Qu'est-ce qui te faciliterait la journée ? » → (3) mini-démo guidée
 * par Aura (messages prédéfinis, AUCUN appel IA, données d'exemple signalées) → (4) résultat juste après l'action →
 * (5) paywall dont le titre reprend ce bénéfice. Le compte est créé ENTRE le choix de la formule et l'achat (RevenueCat
 * logIn avant purchase : le webhook ignore les achats anonymes) ; la progression (étape, besoin, résultat de démo,
 * formule) est gardée sur l'appareil (`homi.pending-firstwin.v1`, même principe que les invitations en attente de
 * src/lib/authFlow.ts) et reprise après l'inscription.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TKey } from '@/i18n';
import type { IntroProfile } from '@/features/intro/model';
import type { PlanPeriod, PlanTier } from '@/lib/premium/plans';

export type LifeStage = 'pregnancy' | 'baby' | 'child';
export const STAGES: LifeStage[] = ['pregnancy', 'baby', 'child'];

/** Besoins proposés (au plus 4 par étape). Chacun mène à une démo d'un outil qui EXISTE dans HOMI. */
export type NeedId = 'prepare_birth' | 'feed_sleep' | 'mornings' | 'relay';
export const NEEDS: Record<LifeStage, NeedId[]> = {
  pregnancy: ['prepare_birth', 'relay'],
  baby: ['feed_sleep', 'relay'],
  child: ['mornings', 'relay'],
};
export const MAX_NEEDS_PER_STAGE = 4;

export type DemoKind = 'checklist' | 'sleepLog' | 'routine' | 'relay';
export const DEMO_OF: Record<NeedId, DemoKind> = { prepare_birth: 'checklist', feed_sleep: 'sleepLog', mornings: 'routine', relay: 'relay' };

/**
 * Outil réel ouvert après l'achat (« Ouvrir … ») : checklists (dont la valise de maternité), suivi de bébé (repas,
 * siestes), routines en pictogrammes de l'enfant, foyer (inviter le co-parent). Tous réservés à Premium.
 */
export const TOOL_ROUTE: Record<DemoKind, string> = {
  checklist: '/lists',
  sleepLog: '/track',
  routine: '/family/kid-routines',
  relay: '/settings/family',
};

/** Profil de l'introduction correspondant (préremplit la première question de l'onboarding après l'inscription). */
export const STAGE_PROFILE: Record<LifeStage, IntroProfile> = { pregnancy: 'pregnant', baby: 'newborn', child: 'child' };

export const needsFor = (stage: LifeStage | null): NeedId[] => (stage ? NEEDS[stage].slice(0, MAX_NEEDS_PER_STAGE) : []);
export const isStage = (v: unknown): v is LifeStage => typeof v === 'string' && (STAGES as string[]).includes(v);
export const isNeed = (v: unknown): v is NeedId => typeof v === 'string' && v in DEMO_OF;

// ------------------------------------------------------------------ titre du paywall et test A/B
/** Variante du test A/B : titre générique, ou titre qui reprend le besoin choisi (même démo, design et prix). */
export type TitleVariant = 'generic' | 'need';
export const TITLE_VARIANTS: TitleVariant[] = ['generic', 'need'];

/** Titre du paywall (et du résultat) qui reprend le bénéfice obtenu dans la démo. */
export const NEED_TITLE: Record<NeedId, TKey> = {
  prepare_birth: 'fw.title.prepare_birth',
  feed_sleep: 'fw.title.feed_sleep',
  mornings: 'fw.title.mornings',
  relay: 'fw.title.relay',
};

export function paywallTitleKey(need: NeedId | null, variant: TitleVariant): TKey {
  return variant === 'need' && need ? NEED_TITLE[need] : 'fw.title.generic';
}

/** Hachage FNV-1a 32 bits (stable, sans dépendance). */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Assignation STABLE par installation : même identifiant d'installation → même variante, 50/50. */
export function assignVariant(installId: string, experiment = 'paywall_title_v1'): TitleVariant {
  return fnv1a(`${experiment}:${installId}`) % 2 === 0 ? 'generic' : 'need';
}

// ------------------------------------------------------------------ progression gardée sur l'appareil
export interface DemoResult {
  kind: DemoKind;
  /** Élément d'exemple coché / ajouté (identifiant de la donnée de démonstration, jamais une saisie personnelle) */
  itemKey: string;
  /** Heure de l'action (ISO) */
  at: string;
}

export interface FirstWinProgress {
  v: 1;
  stage: LifeStage | null;
  need: NeedId | null;
  demoDone: boolean;
  result: DemoResult | null;
  /** Formule choisie sur le paywall */
  plan: { tier: PlanTier; period: PlanPeriod } | null;
  /** Le paywall attend la création ou la connexion d'un compte avant l'achat */
  awaitingAccount: boolean;
  /** Après l'achat : outil à ouvrir quand l'onboarding du foyer sera terminé */
  openAfter: string | null;
  savedAt: number;
}

export const PROGRESS_KEY = 'homi.pending-firstwin.v1';
/** Même durée que l'invitation en attente (7 jours). */
export const PROGRESS_TTL_MS = 7 * 86_400_000;

export const emptyProgress = (now = Date.now()): FirstWinProgress => ({
  v: 1, stage: null, need: null, demoDone: false, result: null, plan: null, awaitingAccount: false, openAfter: null, savedAt: now,
});

/** Relecture tolérante : toute donnée illisible, d'une autre version ou expirée est ignorée. */
export function parseProgress(raw: string | null, now = Date.now()): FirstWinProgress | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<FirstWinProgress>;
    if (!v || v.v !== 1 || typeof v.savedAt !== 'number' || now - v.savedAt > PROGRESS_TTL_MS) return null;
    return {
      ...emptyProgress(v.savedAt),
      stage: isStage(v.stage) ? v.stage : null,
      need: isNeed(v.need) ? v.need : null,
      demoDone: v.demoDone === true,
      result: v.result && typeof v.result.itemKey === 'string' && typeof v.result.at === 'string' && (Object.values(DEMO_OF) as string[]).includes(v.result.kind) ? v.result : null,
      plan: v.plan && (v.plan.tier === 'premium' || v.plan.tier === 'family') && ['monthly', 'six_months', 'annual'].includes(v.plan.period) ? v.plan : null,
      awaitingAccount: v.awaitingAccount === true,
      openAfter: typeof v.openAfter === 'string' && v.openAfter.startsWith('/') ? v.openAfter : null,
    };
  } catch {
    return null;
  }
}

export async function loadProgress(now = Date.now()): Promise<FirstWinProgress | null> {
  try { return parseProgress(await AsyncStorage.getItem(PROGRESS_KEY), now); } catch { return null; }
}
export async function saveProgress(p: Partial<FirstWinProgress>, now = Date.now()): Promise<FirstWinProgress> {
  const next = { ...((await loadProgress(now)) ?? emptyProgress(now)), ...p, v: 1 as const, savedAt: now };
  try { await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* meilleur effort */ }
  return next;
}
export async function clearProgress(): Promise<void> {
  try { await AsyncStorage.removeItem(PROGRESS_KEY); } catch { /* rien */ }
}

/**
 * Où reprendre à l'ouverture (écran de lancement), une fois connecté·e :
 *  - abonné·e (droits confirmés par le serveur) : jamais le parcours de vente (null) ;
 *  - compte créé pendant le paywall : retour au paywall, formule choisie présélectionnée.
 */
export function resumeRoute(p: FirstWinProgress | null, o: { signedIn: boolean; premium: boolean | undefined }): string | null {
  if (!p || !o.signedIn || o.premium !== false) return null;
  if (p.awaitingAccount && p.plan) return '/start/offers?resume=1';
  return null;
}

/**
 * Étape où rouvrir le parcours (refonte du 21/11/2026 : deux écrans) :
 *  - `profile` : étape de vie ET besoin sur la même page (les besoins se révèlent sous la réponse) ;
 *  - `demo` : la démo guidée ; une fois l'action faite, le résultat reste affiché dans le vrai composant (plus d'écran
 *    « résultat » intermédiaire) et le bouton ouvre l'offre.
 */
export type FlowStep = 'profile' | 'demo';
export const FLOW_STEPS: FlowStep[] = ['profile', 'demo'];
export function stepFor(p: FirstWinProgress | null): FlowStep {
  return p?.stage && p.need ? 'demo' : 'profile';
}
/** Anciennes adresses (`?step=stage|need|demo|result`) : lues avec le nouveau découpage. */
export function parseStep(v: unknown): FlowStep | undefined {
  if (v === 'profile' || v === 'stage' || v === 'need') return 'profile';
  if (v === 'demo' || v === 'result') return 'demo';
  return undefined;
}

/** Bouton qui suit le résultat de la démo et ouvre l'offre (libellé lié au besoin). */
export const USE_CTA: Record<NeedId, TKey> = {
  feed_sleep: 'fw.use.feed_sleep',
  relay: 'fw.use.relay',
  prepare_birth: 'fw.use.prepare_birth',
  mornings: 'fw.use.mornings',
};

/** Message d'Aura sur le paywall (prédéfini, deux lignes au plus, aucun appel IA à l'ouverture). */
export const PAYWALL_AURA: Record<NeedId, TKey> = {
  feed_sleep: 'fw.pw.aura.feed_sleep',
  relay: 'fw.pw.aura.relay',
  prepare_birth: 'fw.pw.aura.prepare_birth',
  mornings: 'fw.pw.aura.mornings',
};
