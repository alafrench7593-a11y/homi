/**
 * Programme Ambassadeurs : quel événement RevenueCat donne (ou annule) une commission. Pur, sans réseau.
 * - commission : paiement RÉEL encaissé (INITIAL_PURCHASE hors essai, RENEWAL — dont la conversion après l'essai,
 *   PRODUCT_CHANGE payé), montant > 0, environnement de production (les achats sandbox ne rapportent rien) ;
 * - annulation : remboursement (isRefund) → la commission de cette transaction est annulée ;
 * - TVA et commission du store : celles de l'événement quand RevenueCat les fournit (tax_percentage,
 *   commission_percentage), sinon celles des conditions actives (repli documenté).
 * Le calcul et les règles (6 premiers paiements, produits éligibles, ambassadeur validé) restent dans la base :
 * public._ambassador_accrue (une seule source de vérité).
 */
import { isRefund, type RcEvent } from './revenuecat.ts';

export type AmbassadorAction =
  | { kind: 'accrue'; transaction: string; product: string; priceCents: number; currency: string; vatRate: number | null; storeFeeRate: number | null; at: string }
  | { kind: 'reverse'; transaction: string }
  | null;

const PAID_TYPES = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE']);
const pct = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? Math.round(v * 10000) / 100 : null);

export function ambassadorActionFor(event: RcEvent & { tax_percentage?: number | null; commission_percentage?: number | null }, now = Date.now()): AmbassadorAction {
  const tx = event.transaction_id ?? null;
  if (!tx) return null;
  if (isRefund(event)) return { kind: 'reverse', transaction: tx };
  if (!PAID_TYPES.has(event.type) || event.period_type === 'TRIAL' || event.environment === 'SANDBOX') return null;
  const paid = event.price_in_purchased_currency;
  if (typeof paid !== 'number' || paid <= 0 || !event.currency || !/^[A-Z]{3}$/.test(event.currency) || !event.product_id) return null;
  return {
    kind: 'accrue', transaction: tx, product: event.product_id, priceCents: Math.round(paid * 100), currency: event.currency,
    vatRate: pct(event.tax_percentage), storeFeeRate: pct(event.commission_percentage),
    at: new Date(event.purchased_at_ms ?? event.event_timestamp_ms ?? now).toISOString(),
  };
}
