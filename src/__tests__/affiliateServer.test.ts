/**
 * @jest-environment node
 *
 * HOMI Ambassadors côté serveur (sans réseau) : encaissé net calculé seulement depuis les champs de l'événement
 * RevenueCat (jamais depuis un prix affiché), essai gratuit non commissionné, renouvellement commissionné,
 * remboursement → annulation, webhook rejoué → l'écriture idempotente est retentée sans double compte.
 * La règle (30 %, 6 mois, délai, attribution figée) est testée en base : supabase/tests/sql/98zr_ambassadors.sql.
 */
jest.mock('../../supabase/functions/_shared/http.ts', () => ({
  json: (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  safeEqual: (a: string, b: string) => a === b,
}));
import { affiliateActionFor, minorFactor, netMinorOf, type AffiliateAction } from '../../supabase/functions/_shared/affiliate';
type Row = { user_id: string; [k: string]: unknown };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handleWebhook } = require('../../supabase/functions/_shared/subscription-run') as {
  handleWebhook(r: Request, d: Record<string, unknown>): Promise<Response>;
};

const base = { type: 'INITIAL_PURCHASE', price_in_purchased_currency: 14.99, currency: 'EUR', tax_percentage: 0.1667, commission_percentage: 0.15, transaction_id: 'tx-1', product_id: 'homi_premium_monthly', purchased_at_ms: Date.UTC(2026, 11, 1) };

describe('encaissé net', () => {
  it('14,99 € TTC, TVA 20 % (16,67 % du TTC), Apple 15 % → 10,61 €', () => {
    expect(netMinorOf(base)).toEqual({ netMinor: 1061, currency: 'EUR' });
  });
  it('repli : taxe + part reversée (takehome)', () => {
    expect(netMinorOf({ ...base, commission_percentage: null, takehome_percentage: 0.85 })?.netMinor).toBe(1061);
  });
  it('champs manquants : aucune estimation depuis le prix', () => {
    expect(netMinorOf({ ...base, tax_percentage: null })).toBeNull();
    expect(netMinorOf({ ...base, price_in_purchased_currency: 0 })).toBeNull();
    expect(netMinorOf({ ...base, currency: 'euro' })).toBeNull();
  });
  it('devises sans décimales', () => {
    expect(minorFactor('JPY')).toBe(1);
    expect(netMinorOf({ ...base, price_in_purchased_currency: 2000, currency: 'JPY', tax_percentage: 0.0909, commission_percentage: 0.15 })?.netMinor).toBe(1545);
  });
});

describe('événements', () => {
  it('essai gratuit : rien ; conversion (RENEWAL) et achat payé : commission', () => {
    expect(affiliateActionFor({ ...base, type: 'INITIAL_PURCHASE', period_type: 'TRIAL' })).toBeNull();
    expect(affiliateActionFor({ ...base, type: 'INITIAL_PURCHASE', period_type: 'NORMAL' })).toMatchObject({ kind: 'commission', netMinor: 1061, transactionId: 'tx-1' });
    expect(affiliateActionFor({ ...base, type: 'RENEWAL' })?.kind).toBe('commission');
  });
  it('remboursement : annulation ; annulation simple (fin de renouvellement) : rien', () => {
    expect(affiliateActionFor({ ...base, type: 'CANCELLATION', cancel_reason: 'CUSTOMER_SUPPORT' })).toEqual({ kind: 'reversal', transactionId: 'tx-1' });
    expect(affiliateActionFor({ ...base, type: 'CANCELLATION', cancel_reason: 'UNSUBSCRIBE' })).toBeNull();
  });
  it('sans identifiant de transaction : rien (impossible de garantir l\'idempotence)', () => {
    expect(affiliateActionFor({ ...base, type: 'RENEWAL', transaction_id: null })).toBeNull();
  });
});

describe('webhook RevenueCat', () => {
  const U = '11111111-1111-4111-8111-111111111111';
  const setup = (fail = false) => {
    const rows: Record<string, Row> = {};
    const calls: AffiliateAction[] = [];
    let failing = fail;
    const deps = {
      secret: 's', entitlement: 'HOMI_PREMIUM', api: null, now: () => Date.UTC(2026, 11, 1, 12),
      db: { read: async (id: string) => rows[id] ?? null, write: async (r: Row) => { rows[r.user_id] = { ...rows[r.user_id], ...r }; return true; },
        notify: async () => undefined, locale: async () => 'fr', premium: async () => true },
      credits: null,
      affiliate: {
        commission: async (_u: string, a: AffiliateAction) => { if (failing) return false; calls.push(a); return true; },
        reverse: async (tx: string) => { calls.push({ kind: 'reversal', transactionId: tx }); return true; },
      },
    };
    return { deps, calls, heal: () => { failing = false; } };
  };
  const send = (deps: Record<string, unknown>, event: Record<string, unknown>) =>
    handleWebhook(new Request('https://x/', { method: 'POST', headers: { Authorization: 'Bearer s' }, body: JSON.stringify({ event }) }), deps);
  const ev = { ...base, id: 'ev-1', type: 'INITIAL_PURCHASE', period_type: 'NORMAL', app_user_id: U, entitlement_ids: ['HOMI_PREMIUM'], event_timestamp_ms: Date.UTC(2026, 11, 1), expiration_at_ms: Date.UTC(2027, 0, 1), store: 'APP_STORE' };

  it('achat payé : une commission transmise au grand livre', async () => {
    const { deps, calls } = setup();
    expect((await send(deps, ev)).status).toBe(200);
    expect(calls).toEqual([expect.objectContaining({ kind: 'commission', netMinor: 1061, currency: 'EUR' })]);
  });
  it('échec du grand livre : 500 (RevenueCat réessaie), le réessai écrit la commission', async () => {
    const { deps, calls, heal } = setup(true);
    expect((await send(deps, ev)).status).toBe(500);
    heal();
    expect((await send(deps, ev)).status).toBe(200);
    expect(calls).toHaveLength(1);
  });
});
