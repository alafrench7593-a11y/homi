/**
 * HOMI Ambassadors — règles publiques et simulateur, SANS dépendance (partagé par l'app et la page /ambassadeurs/ du site).
 * Doit rester identique à la règle par défaut en base (affiliate_commission_rules) et aux conditions v1-2026-11
 * (src/content/legalAmbassadors.ts). Aucun prix d'abonnement ici : le simulateur part d'un encaissé net d'exemple.
 */
export const PROGRAM = { percent: 30, months: 6, holdDays: 45, attributionDays: 30, thresholdMinor: 3000 } as const;

/**
 * ESTIMATION pédagogique, pas une promesse : 30 % de l'encaissé net chaque mois, au plus 6 mois par abonné,
 * en supposant que chaque abonné reste abonné tout ce temps. `byMonth` : gain de chaque mois (pour un graphique).
 */
export function simulate(netPerMonthMinor: number, newPayingPerMonth: number, monthsHorizon = 12): { perSubscriberMinor: number; monthlyAtCruiseMinor: number; totalMinor: number; byMonth: number[] } {
  const per = Math.floor((Math.max(0, netPerMonthMinor || 0) * PROGRAM.percent) / 100);
  const n = Math.max(0, Math.floor(newPayingPerMonth || 0));
  const byMonth: number[] = [];
  for (let m = 0; m < monthsHorizon; m++) byMonth.push(n * Math.min(m + 1, PROGRAM.months) * per);
  return { perSubscriberMinor: per, monthlyAtCruiseMinor: byMonth[byMonth.length - 1] ?? 0, totalMinor: byMonth.reduce((a, b) => a + b, 0), byMonth };
}

/** Code ambassadeur (même règle que la base) : 3 à 24 caractères, minuscules, chiffres, tirets. */
export const AFFILIATE_CODE = /^[a-z0-9][a-z0-9-]{2,23}$/;
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const c = raw.trim().toLowerCase();
  return AFFILIATE_CODE.test(c) ? c : null;
}
/** Clé de stockage du code en attente (lue par l'app après connexion : src/lib/affiliateReferral.ts). */
export const PENDING_KEY = 'homi.affiliate.pending.v1';
