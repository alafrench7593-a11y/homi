/**
 * Programme Ambassadeurs côté webhook RevenueCat : seuls les paiements réels de production créent une commission ;
 * un remboursement l'annule ; essais, sandbox, montants nuls et événements sans transaction ne donnent rien.
 */
import { ambassadorActionFor } from '../../supabase/functions/_shared/ambassador';

const base = { app_user_id: 'u', product_id: 'homi_premium_monthly', transaction_id: 'tx-1', currency: 'EUR', environment: 'PRODUCTION', purchased_at_ms: Date.UTC(2026, 10, 24) };

describe('ambassadorActionFor', () => {
  it('premier paiement réel → commission (prix en centimes, TVA et frais du store de l’événement)', () => {
    expect(ambassadorActionFor({ ...base, type: 'INITIAL_PURCHASE', period_type: 'NORMAL', price_in_purchased_currency: 14.99, tax_percentage: 0.1667, commission_percentage: 0.15 } as never))
      .toEqual({ kind: 'accrue', transaction: 'tx-1', product: 'homi_premium_monthly', priceCents: 1499, currency: 'EUR', vatRate: 16.67, storeFeeRate: 15, at: '2026-11-24T00:00:00.000Z' });
  });
  it('renouvellement (dont la conversion après l’essai) → commission ; sans taux dans l’événement → repli sur les conditions', () => {
    const a = ambassadorActionFor({ ...base, type: 'RENEWAL', period_type: 'NORMAL', price_in_purchased_currency: 14.99, is_trial_conversion: true } as never);
    expect(a).toMatchObject({ kind: 'accrue', priceCents: 1499, vatRate: null, storeFeeRate: null });
  });
  it('essai gratuit, sandbox, montant nul, sans transaction → rien', () => {
    expect(ambassadorActionFor({ ...base, type: 'INITIAL_PURCHASE', period_type: 'TRIAL', price_in_purchased_currency: 0 } as never)).toBeNull();
    expect(ambassadorActionFor({ ...base, type: 'RENEWAL', environment: 'SANDBOX', price_in_purchased_currency: 14.99 } as never)).toBeNull();
    expect(ambassadorActionFor({ ...base, type: 'RENEWAL', price_in_purchased_currency: 0 } as never)).toBeNull();
    expect(ambassadorActionFor({ ...base, transaction_id: null, type: 'RENEWAL', price_in_purchased_currency: 14.99 } as never)).toBeNull();
    expect(ambassadorActionFor({ ...base, type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' } as never)).toBeNull();
  });
  it('remboursement → annulation de la commission de la transaction', () => {
    expect(ambassadorActionFor({ ...base, type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' } as never)).toEqual({ kind: 'reverse', transaction: 'tx-1' });
  });
});
