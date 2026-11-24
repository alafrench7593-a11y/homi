/**
 * Programme Ambassadeurs : calculs DÉTERMINISTES (24/11/2026). Mêmes formules que `public.ambassador_split` (SQL) :
 * TVA incluse dans le prix TTC, puis commission du store sur le hors-taxe, puis taux de l'ambassadeur ; montants en
 * centimes arrondis à l'unité. Aucun prix ni taux ici : tout vient des conditions actives (`ambassador_terms_public`).
 * Utilisé par le simulateur (site, app), l'écran ambassadeur et Aura (jamais d'IA pour un montant).
 */

export type Tier = { key: string; label: string; rate: number; min_conversions: number; enabled: boolean };
export type Plan = { key: string; label: string; price: number; months: number };
export type AmbassadorTerms = {
  version: number;
  base_rate: number;
  max_rate: number;
  tiers: Tier[];
  commission_months: number;
  hold_days: number;
  payout_threshold_cents: number;
  eligible_products: string[];
  reference: { currency: string; vat_rate: number; store_fee_rate: number; trial_days?: number; family_supplement?: number; plans: Plan[]; note?: string };
  product_lines?: { key: string; label: string; kind: string; rate: number | null; enabled: boolean }[];
  conditions_md?: string;
};

export type Split = { taxCents: number; storeFeeCents: number; netCents: number; amountCents: number };

const toCents = (euros: number) => Math.round(euros * 100);

/** Répartition d'un paiement TTC (centimes) — identique à ambassador_split. */
export function split(priceCents: number, vatRate: number, storeFeeRate: number, rate: number): Split {
  const ht = Math.round(priceCents / (1 + (vatRate || 0) / 100));
  const fee = Math.round((ht * (storeFeeRate || 0)) / 100);
  const net = ht - fee;
  return { taxCents: priceCents - ht, storeFeeCents: fee, netCents: net, amountCents: Math.round((net * rate) / 100) };
}

/** Taux applicable : dérogation, sinon niveau ouvert, sinon taux de base ; jamais au-delà du maximum. */
export function rateFor(terms: AmbassadorTerms, tierKey?: string | null, override?: number | null): number {
  const tier = terms.tiers.find((x) => x.key === tierKey && x.enabled);
  return Math.min(override ?? tier?.rate ?? terms.base_rate, terms.max_rate);
}

/** Commission mensuelle par abonné (centimes) pour un abonnement mensuel de référence. */
export function monthlyCommissionCents(terms: AmbassadorTerms, rate = terms.base_rate, planKey = 'monthly'): number {
  const plan = terms.reference.plans.find((p) => p.key === planKey) ?? terms.reference.plans[0];
  if (!plan) return 0;
  return split(toCents(plan.price), terms.reference.vat_rate, terms.reference.store_fee_rate, rate).amountCents;
}

/**
 * Simulation : N abonnés mensuels restés actifs toute la durée rémunérée, sans remboursement. Résultat indicatif,
 * jamais garanti. `perMonth` est arrondi par abonné (comme les vraies commissions), puis multiplié.
 */
export function simulate(terms: AmbassadorTerms, subscribers: number, rate = terms.base_rate): { perSubscriberCents: number; monthlyCents: number; totalCents: number; months: number } {
  const n = Math.max(0, Math.floor(subscribers || 0));
  const per = monthlyCommissionCents(terms, rate);
  return { perSubscriberCents: per, monthlyCents: per * n, totalCents: per * n * terms.commission_months, months: terms.commission_months };
}

/** Prochain niveau ouvert à atteindre (null : déjà au plus haut niveau ouvert). */
export function nextTier(terms: AmbassadorTerms, conversions: number): Tier | null {
  return terms.tiers.filter((t) => t.enabled && t.min_conversions > conversions).sort((a, b) => a.min_conversions - b.min_conversions)[0] ?? null;
}

/** Versement possible ce mois-ci ? (montant payable ≥ seuil) */
export function payoutReady(payableCents: number, terms: AmbassadorTerms): boolean {
  return payableCents >= terms.payout_threshold_cents;
}

/** Montant en euros lisible (« 3,19 € ») — format fixe, indépendant de la langue de l'appareil pour la cohérence. */
export function euros(cents: number, currency = 'EUR', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);
}

/** Code ambassadeur normalisé (comme le serveur) : lettres et chiffres en majuscules, 4 à 16 caractères. */
export function normalizeCode(raw: string): string | null {
  const c = (raw || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(c) ? c : null;
}
