/**
 * HOMI Ambassadors — commissions depuis le webhook RevenueCat (serveur uniquement).
 *
 * Assiette : l'ENCAISSÉ NET (après taxe et commission de la boutique), lu dans l'événement RevenueCat
 * (price_in_purchased_currency, tax_percentage, commission_percentage, ou takehome_percentage). Si ces champs manquent,
 * AUCUNE commission n'est calculée : jamais d'estimation à partir du prix affiché dans l'application.
 * Noms de champs à revérifier dans https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 * avant la mise en service (non revérifiés au 24/11/2026 : accès réseau indisponible).
 *
 * Idempotence : la base refuse une deuxième commission (ou un deuxième remboursement) pour la même transaction.
 * Montants en unités mineures entières ; la règle (pourcentage, durée, délai) est appliquée par la base.
 */
export interface AffiliateEvent {
  type: string;
  id?: string;
  period_type?: string;
  transaction_id?: string | null;
  product_id?: string | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  tax_percentage?: number | null;
  commission_percentage?: number | null;
  takehome_percentage?: number | null;
  purchased_at_ms?: number | null;
  event_timestamp_ms?: number;
  cancel_reason?: string | null;
  expiration_reason?: string | null;
}

/** Devises sans décimales (unités mineures = unités). */
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX', 'XAF', 'XOF', 'PYG', 'HUF', 'TWD']);
export const minorFactor = (currency: string) => (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100);
const pct = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1 ? v : null);

/** Encaissé net en unités mineures (arrondi à l'inférieur), ou null si l'événement ne permet pas de le calculer. */
export function netMinorOf(e: AffiliateEvent): { netMinor: number; currency: string } | null {
  const gross = e.price_in_purchased_currency;
  const currency = (e.currency ?? '').toUpperCase();
  if (typeof gross !== 'number' || !Number.isFinite(gross) || gross <= 0 || !/^[A-Z]{3}$/.test(currency)) return null;
  const tax = pct(e.tax_percentage);
  const commission = pct(e.commission_percentage);
  const takehome = typeof e.takehome_percentage === 'number' && e.takehome_percentage > 0 && e.takehome_percentage <= 1 ? e.takehome_percentage : null;
  let net: number;
  if (tax != null && commission != null) net = gross * (1 - tax) * (1 - commission);
  else if (tax != null && takehome != null) net = gross * (1 - tax) * takehome;
  else return null;
  return { netMinor: Math.floor(net * minorFactor(currency) + 1e-9), currency };
}

/** Paiement réel (pas un essai gratuit) : premier achat payé, ou renouvellement (dont la conversion d'un essai). */
export const isPaidEvent = (e: AffiliateEvent) =>
  (e.type === 'INITIAL_PURCHASE' && e.period_type !== 'TRIAL') || e.type === 'RENEWAL';

/** Remboursement accordé par la boutique (même règle que l'abonnement : revenuecat.ts › isRefund). */
export const isRefundEvent = (e: AffiliateEvent) =>
  (e.type === 'CANCELLATION' && e.cancel_reason === 'CUSTOMER_SUPPORT') || (e.type === 'EXPIRATION' && e.expiration_reason === 'CUSTOMER_SUPPORT');

export type AffiliateAction =
  | { kind: 'commission'; transactionId: string; productId: string; netMinor: number; currency: string; paidAt: string }
  | { kind: 'reversal'; transactionId: string }
  | null;

/** Ce que l'événement demande au grand livre des ambassadeurs (null : rien). */
export function affiliateActionFor(e: AffiliateEvent, now: number = Date.now()): AffiliateAction {
  const tx = e.transaction_id ?? null;
  if (!tx) return null;
  if (isRefundEvent(e)) return { kind: 'reversal', transactionId: tx };
  if (!isPaidEvent(e)) return null;
  const net = netMinorOf(e);
  if (!net) return null;
  return { kind: 'commission', transactionId: tx, productId: e.product_id ?? '', netMinor: net.netMinor, currency: net.currency,
    paidAt: new Date(e.purchased_at_ms ?? e.event_timestamp_ms ?? now).toISOString() };
}

export interface AffiliateLedger {
  commission(userId: string, a: Extract<AffiliateAction, { kind: 'commission' }>): Promise<boolean>;
  reverse(transactionId: string): Promise<boolean>;
}

/** Applique l'action ; false : erreur technique (RevenueCat réessaiera, l'écriture est idempotente). */
export async function applyAffiliate(e: AffiliateEvent, userId: string, ledger: AffiliateLedger | null | undefined, now?: number): Promise<boolean> {
  const a = affiliateActionFor(e, now);
  if (!a || !ledger) return true;
  return a.kind === 'commission' ? ledger.commission(userId, a) : ledger.reverse(a.transactionId);
}

/** Grand livre Supabase (rôle serveur) : fonctions affiliate_record_commission / affiliate_reverse_commission. */
export function supabaseAffiliate(admin: { rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ error: unknown }> }): AffiliateLedger {
  return {
    async commission(userId, a) {
      const { error } = await admin.rpc('affiliate_record_commission', {
        p_customer: userId, p_transaction_id: a.transactionId, p_product_id: a.productId, p_net_minor: a.netMinor, p_currency: a.currency, p_paid_at: a.paidAt,
      });
      if (error) console.error('affiliate_commission_failed');
      return !error;
    },
    async reverse(transactionId) {
      const { error } = await admin.rpc('affiliate_reverse_commission', { p_transaction_id: transactionId, p_note: 'refund' });
      if (error) console.error('affiliate_reverse_failed');
      return !error;
    },
  };
}
