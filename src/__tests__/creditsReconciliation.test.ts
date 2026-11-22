/**
 * Réconciliation des crédits (brief « De la saisie au relais parent », page 19) : départ 300 ; PENDANT la réservation
 * 297 disponibles + 3 réservés ; après succès 297 disponibles, 0 réservé, 3 consommés ; après échec la réservation
 * est rendue (300, 0, 0) ; rejouer la confirmation ne débite pas deux fois. Démonstration = mêmes règles que le SQL.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { createCredits } from '@/lib/backend/demoCredits';

function setup() {
  const tables: Record<string, Record<string, unknown>[]> = {};
  let n = 0;
  const c = createCredits({
    T: (k) => (tables[k] ??= []), me: () => 'parent', nowIso: () => new Date().toISOString(), uuid: () => `id-${++n}`,
    activeSub: (u) => (u === 'parent' ? { product_id: 'homi_premium_monthly' } : null), giver: () => null,
  });
  c.rpcs.demo_credit_purchase({ product_id: 'homi_credits_300', transaction_id: 'tx-1' });
  const st = () => { const s = c.status()!; return { available: Number(s.monthly_remaining) + Number(s.purchased_remaining), reserved: Number(s.reserved), consumed: Number(s.used_this_period ?? 0) }; };
  const consumed = () => (tables.credit_reservations ?? []).filter((r) => r.status === 'committed').reduce((x, r) => x + Number(r.cost), 0);
  return { c, st, consumed, tables };
}

describe('crédits : réservation, débit, restitution', () => {
  it('300 → pendant la réservation 297 + 3 réservés → après succès 297, 0 réservé, 3 consommés', () => {
    const { c, st, consumed } = setup();
    expect(st()).toMatchObject({ available: 300, reserved: 0 });
    const r = c.reserve('tool_analysis');
    expect(r.cost).toBe(3);
    expect(st()).toMatchObject({ available: 297, reserved: 3 });
    expect(c.commit(r.reservation_id)).toBe(true);
    expect(c.commit(r.reservation_id)).toBe(true); // rejoué : idempotent
    expect({ ...st(), consumed: consumed() }).toMatchObject({ available: 297, reserved: 0, consumed: 3 });
  });
  it('échec technique : la réservation est rendue, rien n’est consommé', () => {
    const { c, st, consumed } = setup();
    const r = c.reserve('tool_analysis');
    c.release(r.reservation_id, 'ai_error');
    expect({ ...st(), consumed: consumed() }).toMatchObject({ available: 300, reserved: 0, consumed: 0 });
    expect(c.commit(r.reservation_id)).toBe(false); // une réservation rendue ne peut plus être débitée
  });
  it('achat rejoué (même transaction) : crédité une seule fois', () => {
    const { c, st } = setup();
    c.rpcs.demo_credit_purchase({ product_id: 'homi_credits_300', transaction_id: 'tx-1' });
    expect(st().available).toBe(300);
  });
});
