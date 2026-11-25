/**
 * Crédits HOMI Aura — modèle côté application (logique pure, testée par Jest : src/__tests__/credits.test.ts).
 * Le SERVEUR fait foi (grand livre : supabase/migrations/20261126000100_credits_ia.sql, docs/CREDITS_IA.md) : l'application
 * ne fait qu'afficher le solde, le coût d'une action AVANT consentement, et proposer un pack quand le solde est épuisé.
 *
 * Prix : TOUJOURS ceux de la boutique (StoreKit / Play via RevenueCat). La grille DEMO_PACK_PRICES ne sert qu'au mode
 * démonstration (faux magasin, aucun paiement), signalée comme telle.
 */
import { CREDIT_PACK_IDS, CREDITS_OFFERING, PACK_CREDITS, type CreditPackId } from '../../../supabase/functions/_shared/credits';
import type { TKey } from '@/i18n';
import { DEMO_PACK_GRID } from '../premium/plans';

export { CREDIT_PACK_IDS, CREDITS_OFFERING, PACK_CREDITS, type CreditPackId };

/** Démonstration uniquement (grille de plans.ts, seul fichier autorisé à porter des montants) : 300 / 800 / 2 000 crédits. */
export const DEMO_PACK_PRICES: Record<CreditPackId, number> = DEMO_PACK_GRID;

/** Actions facturées en crédits (clés `cost.<action>` de credit_settings). */
export type CreditAction =
  | 'assistant_question' | 'tool_analysis' | 'journal_summary' | 'action_plan' | 'document_read' | 'scan_explain' | 'cycle_photo' | 'community_summary';

/** Coûts par défaut (miroir des valeurs initiales du serveur) : utilisés seulement si la configuration est illisible. */
export const DEFAULT_COSTS: Record<CreditAction, number> = {
  assistant_question: 1, tool_analysis: 3, journal_summary: 5, action_plan: 3, document_read: 5, scan_explain: 1, cycle_photo: 3, community_summary: 1,
};
export const DEFAULT_GRANTS = { premium: 1000, family: 1500 } as const;

export interface CreditConfig {
  ai_enabled: boolean;
  costs: Partial<Record<string, number>>;
  packs: Partial<Record<string, number>>;
  grants: { premium: number; family: number };
  purchase_requires_subscription: boolean;
}

export interface CreditStatus {
  subscribed: boolean;
  tier: 'premium' | 'family' | null;
  holder_kind: 'user' | 'household';
  payer_is_me: boolean | null;
  monthly_allowance: number;
  monthly_remaining: number;
  purchased_remaining: number;
  reserved: number;
  used_this_period: number;
  period_start: string | null;
  next_renewal: string | null;
  ai_enabled: boolean;
}

export type HistoryKind = 'monthly_grant' | 'purchase' | 'debit' | 'expire' | 'refund' | 'adjust';
export interface CreditHistoryRow {
  id: string;
  kind: HistoryKind;
  amount: number;
  action: string | null;
  product_id: string | null;
  by_me: boolean | null;
  created_at: string;
}

export const costOf = (action: CreditAction, config: CreditConfig | null | undefined): number => {
  const v = config?.costs?.[action];
  return typeof v === 'number' && v > 0 ? v : DEFAULT_COSTS[action];
};

export const totalRemaining = (s: Pick<CreditStatus, 'monthly_remaining' | 'purchased_remaining'> | null | undefined): number =>
  Math.max(0, (s?.monthly_remaining ?? 0) + (s?.purchased_remaining ?? 0));

/** Le solde couvre-t-il ce coût ? (le serveur tranche de toute façon à la réserve) */
export const canAfford = (s: CreditStatus | null | undefined, cost: number): boolean => totalRemaining(s) >= cost;

/** Erreur « solde insuffisant » renvoyée par une fonction serveur (assistant, analyses). */
export const isInsufficientCredits = (e: unknown): boolean => (e as { code?: string } | null)?.code === 'insufficient_credits';
/** IA coupée par l'interrupteur serveur ou non configurée. */
export const isAiOff = (e: unknown): boolean => ['ai_disabled', 'ai_not_configured', 'coming_soon'].includes(String((e as { code?: string } | null)?.code ?? ''));

const ACTION_LABEL: Record<string, TKey> = {
  assistant_question: 'cr.action.assistant_question',
  tool_analysis: 'cr.action.tool_analysis',
  journal_summary: 'cr.action.journal_summary',
  action_plan: 'cr.action.action_plan',
  document_read: 'cr.action.document_read',
  scan_explain: 'cr.action.scan_explain',
  cycle_photo: 'cr.action.cycle_photo',
  community_summary: 'cr.action.community_summary',
};

/**
 * Libellé lisible d'une ligne d'historique (JAMAIS le contenu d'une question : seul le type d'action est connu).
 * Renvoie une clé de traduction et ses paramètres.
 */
export function historyLabel(row: Pick<CreditHistoryRow, 'kind' | 'action' | 'product_id'>): { key: TKey; params?: Record<string, string | number> } {
  switch (row.kind) {
    case 'monthly_grant': return { key: 'cr.hist.grant' };
    case 'purchase': {
      const n = PACK_CREDITS[row.product_id as CreditPackId];
      return n ? { key: 'cr.hist.purchasePack', params: { count: n } } : { key: 'cr.hist.purchase' };
    }
    case 'debit': return { key: (row.action && ACTION_LABEL[row.action]) || 'cr.action.other' };
    case 'expire': return { key: 'cr.hist.expire' };
    case 'refund': return { key: 'cr.hist.refund' };
    default: return { key: 'cr.hist.adjust' };
  }
}

/** Montant signé affiché (« +1 000 », « −1 »). */
export function signedAmount(n: number, format: (v: number) => string): string {
  if (n === 0) return format(0);
  return `${n > 0 ? '+' : '−'}${format(Math.abs(n))}`;
}

/**
 * Utilisation Aura (25/11/2026) : la capacité mensuelle est présentée en pourcentage utilisé, jamais « 1 message = 1 crédit ».
 * Calcul sur le solde SERVEUR (allocation mensuelle / restant mensuel). Les crédits achetés s'ajoutent à part.
 */
export function usagePercent(s: Pick<CreditStatus, 'monthly_allowance' | 'monthly_remaining'> | null | undefined): number | null {
  if (!s || !(s.monthly_allowance > 0)) return null;
  const used = s.monthly_allowance - Math.max(0, Math.min(s.monthly_allowance, s.monthly_remaining));
  return Math.round((used / s.monthly_allowance) * 100);
}

/** Seuil d'information : 75 % (discret), 90 % (bientôt atteinte), 100 % (capacité mensuelle épuisée). */
export type UsageLevel = 'ok' | 'high' | 'almost' | 'full';
export function usageLevel(s: Pick<CreditStatus, 'monthly_allowance' | 'monthly_remaining' | 'purchased_remaining'> | null | undefined): UsageLevel {
  const p = usagePercent(s);
  if (p == null) return 'ok';
  if (p >= 100) return (s!.purchased_remaining > 0 ? 'almost' : 'full');
  if (p >= 90) return 'almost';
  if (p >= 75) return 'high';
  return 'ok';
}

/** Catégories compréhensibles (sans tokens ni modèles). */
export type UsageGroup = 'assist' | 'analysis' | 'summary' | 'documents' | 'other';
const GROUP: Record<string, UsageGroup> = {
  assistant_question: 'assist', action_plan: 'assist',
  tool_analysis: 'analysis', cycle_photo: 'analysis',
  journal_summary: 'summary', community_summary: 'summary',
  document_read: 'documents', scan_explain: 'documents',
};
export const usageGroupOf = (action: string | null | undefined): UsageGroup => (action && GROUP[action]) || 'other';

/** Répartition des débits de la période en cours (lignes d'historique déjà chargées), en crédits par catégorie. */
export function usageBreakdown(rows: Pick<CreditHistoryRow, 'kind' | 'action' | 'amount' | 'created_at'>[], periodStart: string | null | undefined): { group: UsageGroup; used: number }[] {
  const from = periodStart ? Date.parse(periodStart) : -Infinity;
  const acc: Record<UsageGroup, number> = { assist: 0, analysis: 0, summary: 0, documents: 0, other: 0 };
  for (const r of rows) {
    if (r.kind !== 'debit' && r.kind !== 'refund') continue;
    if (Date.parse(r.created_at) < from) continue;
    acc[usageGroupOf(r.action)] += r.kind === 'debit' ? Math.abs(r.amount) : -Math.abs(r.amount);
  }
  return (Object.keys(acc) as UsageGroup[]).map((group) => ({ group, used: Math.max(0, acc[group]) })).filter((x) => x.used > 0).sort((a, b) => b.used - a.used);
}
