/**
 * Événement serveur `first_billing_confirmed` (03/12/2026) — logique PURE, sans import Deno (testée par Jest :
 * src/__tests__/firstBilling.test.ts). Métrique principale du test A/B du paywall : « première facturation confirmée
 * après la fenêtre d'essai / personnes exposées » (docs/PAYWALL_ONBOARDING.md).
 *
 * Première facturation :
 *  - RENEWAL qui CONVERTIT un essai (is_trial_conversion, ou à défaut un abonnement encore « trial » côté serveur) ;
 *  - INITIAL_PURCHASE payé tout de suite (period_type NORMAL : pas d'essai, débit immédiat).
 * Dédoublonnage : par identifiant de transaction de la boutique (RevenueCat réessaie un webhook ; contrainte unique
 * (kind, transaction_id) dans conversion_events). Identifiants anonymes RevenueCat : ignorés (comme le webhook).
 * Aucune donnée personnelle : identifiant de compte, produit, magasin, environnement, date.
 */
import type { RcEvent } from './revenuecat.ts';

export interface FirstBilling {
  kind: 'first_billing_confirmed';
  transaction_id: string;
  product_id: string | null;
  after_trial: boolean;
  store: string | null;
  environment: string | null;
  occurred_at: string;
}

export function firstBillingOf(event: RcEvent, previousStatus: string | null | undefined): FirstBilling | null {
  const tx = event.transaction_id ?? event.id ?? null;
  if (!tx) return null;
  const afterTrial = event.type === 'RENEWAL' && (event.is_trial_conversion === true || (event.is_trial_conversion == null && previousStatus === 'trial'));
  const direct = event.type === 'INITIAL_PURCHASE' && (event.period_type ?? '').toUpperCase() === 'NORMAL';
  if (!afterTrial && !direct) return null;
  return {
    kind: 'first_billing_confirmed',
    transaction_id: String(tx),
    product_id: event.product_id ?? null,
    after_trial: afterTrial,
    store: event.store ?? null,
    environment: event.environment ?? null,
    occurred_at: new Date(event.purchased_at_ms ?? event.event_timestamp_ms ?? Date.now()).toISOString(),
  };
}
