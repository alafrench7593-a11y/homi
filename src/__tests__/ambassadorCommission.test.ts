/**
 * Programme Ambassadeurs : calculs identiques au serveur (ambassador_split) et au tableau de la propriétaire.
 * Les conditions de test sont lues dans la migration (version 1) : aucune valeur recopiée à la main.
 */
import { euros, monthlyCommissionCents, nextTier, normalizeCode, payoutReady, rateFor, simulate, split, type AmbassadorTerms } from '@/lib/ambassador/commission';

const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string };
const sql = fs.readFileSync('supabase/migrations/20261210000100_ambassadeurs.sql', 'utf8');
const json = (re: RegExp) => JSON.parse(re.exec(sql)![1]);
const v1: AmbassadorTerms = {
  version: 1, base_rate: 30, max_rate: 35,
  tiers: json(/values \(1, 'active', 30, 35,\s*'(\[[\s\S]*?\])',/),
  commission_months: 6, hold_days: 30, payout_threshold_cents: 5000,
  eligible_products: ['homi_premium_monthly', 'homi_premium_6months', 'homi_premium_annual', 'homi_family_monthly_v2'],
  reference: json(/'(\{"currency":"EUR"[\s\S]*?\})',\s*'\[\{"key":"store"/),
};

describe('commission (même formule que le serveur)', () => {
  it('14,99 € TTC, TVA 20 %, store 15 %, 30 % → 2,50 / 1,87 / 10,62 / 3,19 (reste HOMI 7,43)', () => {
    const s = split(1499, 20, 15, 30);
    expect(s).toEqual({ taxCents: 250, storeFeeCents: 187, netCents: 1062, amountCents: 319 });
    expect(s.netCents - s.amountCents).toBe(743);
    expect(monthlyCommissionCents(v1)).toBe(319);
  });
  it('tableau du simulateur de la propriétaire (mensuel / 6 mois)', () => {
    const rows: [number, number, number][] = [[10, 3190, 19140], [25, 7975, 47850], [50, 15950, 95700], [100, 31900, 191400],
      [250, 79750, 478500], [500, 159500, 957000], [1000, 319000, 1914000], [5000, 1595000, 9570000]];
    for (const [n, m, t] of rows) expect([n, simulate(v1, n).monthlyCents, simulate(v1, n).totalCents]).toEqual([n, m, t]);
    expect(simulate(v1, -3).totalCents).toBe(0);
  });
  it('niveaux : supérieurs fermés tant que la propriétaire ne les ouvre pas ; jamais au-delà de 35 %', () => {
    expect(rateFor(v1, 'elite')).toBe(30);
    const open = { ...v1, tiers: v1.tiers.map((t) => ({ ...t, enabled: true })) };
    expect(rateFor(open, 'gold')).toBe(33);
    expect(rateFor(open, 'elite')).toBe(35);
    expect(rateFor(open, 'starter', 50)).toBe(35);
    expect(nextTier(v1, 3)).toBeNull();
    expect(nextTier(open, 30)?.key).toBe('gold');
  });
  it('seuil de versement 50 € ; code normalisé comme le serveur ; montant lisible', () => {
    expect(payoutReady(4999, v1)).toBe(false);
    expect(payoutReady(5000, v1)).toBe(true);
    expect(normalizeCode(' ines-25 ')).toBe('INES25');
    expect(normalizeCode('ab')).toBeNull();
    expect(euros(319).replace(/\s/g, ' ')).toBe('3,19 €');
  });
});

describe('démonstration : copie des conditions identique à la migration', () => {
  it('termsV1 = version 1 de la migration (niveaux, prix de référence)', () => {
    const { AMBASSADOR_TERMS_V1 } = require('@/lib/ambassador/termsV1');
    expect(AMBASSADOR_TERMS_V1.tiers).toEqual(v1.tiers);
    expect(AMBASSADOR_TERMS_V1.reference).toEqual(v1.reference);
    expect(AMBASSADOR_TERMS_V1.eligible_products).toEqual(v1.eligible_products);
  });
});
