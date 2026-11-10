/**
 * Offres du 07/11/2026 (logique pure, testée par Jest) — même catalogue que la table public.paid_tools :
 *  - « Assistant IA » : abonnement mensuel (droit RevenueCat ASSISTANT_IA), 250 questions à l'assistant en ligne
 *    par mois, mois offert = offre d'essai de la boutique ;
 *  - 10 outils « à vie » (un achat unique chacun, droit TOOL_…), ouverts gratuitement 30 jours après l'inscription
 *    (au plus tôt jusqu'au 07/12/2026). Après : données consultables, ajout réservé. Premium = tous les outils.
 * Prix : TOUJOURS ceux de la boutique ; la grille DEMO_OFFER_PRICES ne sert qu'en démonstration.
 * Les droits sont décidés par le serveur (my_access / has_tool) ; ce module ne fait qu'expliquer.
 */
export const AI_ENTITLEMENT = 'ASSISTANT_IA';
export const AI_PRODUCT_ID = 'aufildenous_ai_monthly';
export const AI_MONTHLY_QUESTIONS = 250;

export const PAID_TOOLS = [
  'pma_tracker', 'custody', 'kid_routines', 'bottle_scoops', 'contraception_journal',
  'kid_steps', 'cycle_kit', 'cycle_stats', 'meal_rankings', 'family_review',
  // charge mentale (migration 20261107000300)
  'family_domains', 'family_prep',
] as const;
export type PaidTool = (typeof PAID_TOOLS)[number];
export const isPaidTool = (id: string | null | undefined): id is PaidTool => !!id && (PAID_TOOLS as readonly string[]).includes(id);
export const toolProductId = (tool: PaidTool) => `aufildenous_tool_${tool}`;
export const toolEntitlement = (tool: PaidTool) => `TOOL_${tool.toUpperCase()}`;

/** Grille affichée UNIQUEMENT en démonstration (aucune boutique, aucun paiement). */
export const DEMO_OFFER_PRICES = { ai: 7.99, tool: 0.99 } as const;

export interface AccessInfo {
  premium: boolean;
  ai: boolean;
  trial_until: string | null;
  /** Verrouillage strict en vigueur (premium_policy) ; absent : strict */
  strict?: boolean;
  tools: { key: string; product_id: string; owned: boolean; allowed: boolean }[];
}

export interface ToolAccess { paid: boolean; allowed: boolean; owned: boolean; inTrial: boolean; trialDaysLeft: number; premium: boolean }

/** Accès à un outil d'après la réponse du serveur. Inconnu (chargement, hors ligne) → ouvert : le serveur tranche à l'ajout. */
export function toolAccess(tool: string | null | undefined, a: AccessInfo | null | undefined, now: Date = new Date()): ToolAccess {
  const open: ToolAccess = { paid: false, allowed: true, owned: false, inTrial: false, trialDaysLeft: 0, premium: !!a?.premium };
  if (!isPaidTool(tool)) return open;
  if (!a) return { ...open, paid: true };
  const t = a.tools.find((x) => x.key === tool);
  const until = a.trial_until ? Date.parse(a.trial_until) : NaN;
  const left = Number.isFinite(until) ? Math.max(0, Math.ceil((until - now.getTime()) / 86_400_000)) : 0;
  const owned = !!t?.owned;
  return { paid: true, allowed: t ? t.allowed : true, owned, inTrial: !a.premium && !owned && left > 0, trialDaysLeft: left, premium: a.premium };
}

/** Fin du mois gratuit des outils : 30 jours après l'inscription, jamais avant le 07/12/2026 (miroir du serveur). */
export function toolTrialUntil(accountCreatedAt: string | null | undefined): string {
  const floor = Date.parse('2026-12-07T00:00:00+01:00');
  const created = accountCreatedAt ? Date.parse(accountCreatedAt) : Date.now();
  return new Date(Math.max(created + 30 * 86_400_000, floor)).toISOString();
}
