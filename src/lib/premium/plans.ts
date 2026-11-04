/**
 * Formules « Au fil de nous Premium » (logique pure, testée par Jest) : 1 mois, 6 mois, 12 mois — un seul droit
 * RevenueCat (AU_FIL_DE_NOUS_PREMIUM), les 3 formules donnent le même Premium.
 *
 * Prix : TOUJOURS ceux de la boutique (App Store / Google Play) transmis par RevenueCat — priceString, price,
 * currencyCode. Le prix par mois et l'économie par rapport au mensuel sont CALCULÉS à partir de ces prix réels.
 * Seule exception : le mode démonstration (moteur local, aucune boutique), qui affiche la grille tarifaire
 * prévue (DEMO_GRID) avec la mention « démonstration ».
 *
 * Essai gratuit : jamais simulé. Affiché seulement si la boutique le propose réellement à cette personne :
 *  - iOS : introPrice gratuit ET éligibilité confirmée par Apple (checkTrialOrIntroductoryPriceEligibility) ;
 *  - Android : phase gratuite (freePhase) de l'option appliquée par défaut à l'achat (defaultOption). Google Play ne
 *    renvoie plus une offre « nouveaux clients » déjà utilisée dans subscriptionOptions (doc RevenueCat
 *    « Subscription offers »), et la vérification d'éligibilité RevenueCat n'est pas disponible sur Android.
 */
import type { PurchasesPackage, PurchasesStoreProduct } from 'react-native-purchases';

export type PlanPeriod = 'monthly' | 'six_months' | 'annual';
export const PREMIUM_ENTITLEMENT = 'AU_FIL_DE_NOUS_PREMIUM';
export const PLAN_ORDER: PlanPeriod[] = ['annual', 'six_months', 'monthly'];
export const PLAN_MONTHS: Record<PlanPeriod, number> = { monthly: 1, six_months: 6, annual: 12 };
export const PRODUCT_IDS: Record<PlanPeriod, string> = {
  monthly: 'aufildenous_premium_monthly',
  six_months: 'aufildenous_premium_6months',
  annual: 'aufildenous_premium_annual',
};
/** Badges : 12 mois « MEILLEURE OFFRE », 6 mois « ÉCONOMISEZ », mensuel « SANS ENGAGEMENT LONGUE DURÉE ». */
export const PLAN_BADGE: Record<PlanPeriod, 'best' | 'save' | 'flex'> = { annual: 'best', six_months: 'save', monthly: 'flex' };

/** Grille tarifaire affichée UNIQUEMENT en démonstration (aucune boutique, aucun paiement). */
export const DEMO_CURRENCY = 'EUR';
export const DEMO_GRID: Record<PlanPeriod, { amount: number; trialDays: number }> = {
  monthly: { amount: 10.99, trialDays: 3 },
  six_months: { amount: 54.99, trialDays: 0 },
  annual: { amount: 99.99, trialDays: 0 },
};

export interface Plan {
  /** Identifiant du produit de la boutique */
  id: string;
  period: PlanPeriod;
  months: number;
  /** Prix tel que formaté par la boutique (priceString) */
  price: string;
  amount: number;
  currency: string;
  /** Prix ramené à un mois, calculé depuis le prix réel (null pour le mensuel) */
  perMonth: string | null;
  /** Économie par rapport à 6 ou 12 mensualités au prix réel du mensuel (arrondie à l'entier inférieur) */
  savingsPct: number | null;
  /** Essai gratuit réellement proposé (0 : aucun) */
  trialDays: number;
  /** Grille de démonstration (jamais en mode boutique) */
  demo: boolean;
  pkg?: PurchasesPackage;
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Formule d'un package RevenueCat : type prédéfini ($rc_monthly, $rc_six_month, $rc_annual), sinon période ISO du produit. */
export function packagePeriod(pkg: Pick<PurchasesPackage, 'packageType'> & { product: Pick<PurchasesStoreProduct, 'subscriptionPeriod'> }): PlanPeriod | null {
  switch (String(pkg.packageType)) {
    case 'MONTHLY': return 'monthly';
    case 'SIX_MONTH': return 'six_months';
    case 'ANNUAL': return 'annual';
  }
  switch ((pkg.product.subscriptionPeriod ?? '').toUpperCase()) {
    case 'P1M': return 'monthly';
    case 'P6M': return 'six_months';
    case 'P1Y': case 'P12M': return 'annual';
  }
  return null;
}

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** Durée de l'essai gratuit proposé par la boutique pour ce produit (0 : aucun). Voir l'en-tête du fichier. */
export function trialDaysOf(product: Pick<PurchasesStoreProduct, 'introPrice' | 'defaultOption'>, os: string): number {
  if (os === 'android') {
    const free = product.defaultOption?.freePhase;
    if (!free?.billingPeriod) return 0;
    return free.billingPeriod.value * (UNIT_DAYS[String(free.billingPeriod.unit)] ?? 0);
  }
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) return 0;
  return intro.periodNumberOfUnits * (UNIT_DAYS[String(intro.periodUnit)] ?? 0);
}

export function savingsPct(amount: number, months: number, monthlyAmount: number | null | undefined): number | null {
  if (!monthlyAmount || monthlyAmount <= 0 || months <= 1 || !(amount > 0)) return null;
  const pct = Math.floor((1 - amount / (monthlyAmount * months)) * 100 + 1e-9);
  return pct >= 1 ? pct : null;
}

interface RawPlan { id: string; period: PlanPeriod; price: string; amount: number; currency: string; trialDays: number; demo: boolean; pkg?: PurchasesPackage }

function finish(raw: RawPlan[], locale: string): Plan[] {
  const monthly = raw.find((p) => p.period === 'monthly');
  return PLAN_ORDER.map((period) => raw.find((p) => p.period === period)).filter((p): p is RawPlan => !!p).map((p) => {
    const months = PLAN_MONTHS[p.period];
    const sameCurrency = monthly && monthly.currency === p.currency;
    return {
      ...p,
      months,
      perMonth: months > 1 && p.amount > 0 ? formatMoney(Math.round((p.amount / months) * 100) / 100, p.currency, locale) : null,
      savingsPct: sameCurrency ? savingsPct(p.amount, months, monthly!.amount) : null,
    };
  });
}

/** Packages de l'offre courante → formules (une par durée ; les autres packages sont ignorés). */
export function buildPlans(pkgs: PurchasesPackage[], os: string, locale: string): Plan[] {
  const raw: RawPlan[] = [];
  for (const pkg of pkgs) {
    const period = packagePeriod(pkg);
    if (!period || raw.some((r) => r.period === period)) continue;
    raw.push({ id: pkg.product.identifier, period, price: pkg.product.priceString, amount: pkg.product.price, currency: pkg.product.currencyCode, trialDays: trialDaysOf(pkg.product, os), demo: false, pkg });
  }
  return finish(raw, locale);
}

/** Démonstration : grille prévue, calculs identiques (économies dérivées des montants, jamais écrites en dur). */
export function demoPlans(locale: string): Plan[] {
  return finish(PLAN_ORDER.map((period) => ({
    id: PRODUCT_IDS[period], period, price: formatMoney(DEMO_GRID[period].amount, DEMO_CURRENCY, locale), amount: DEMO_GRID[period].amount,
    currency: DEMO_CURRENCY, trialDays: DEMO_GRID[period].trialDays, demo: true,
  })), locale);
}

/** Date du premier prélèvement (après l'essai éventuel) et du renouvellement suivant. */
export function billingDates(plan: Pick<Plan, 'period' | 'trialDays'>, from: Date = new Date()) {
  const first = new Date(from.getTime() + (plan.trialDays ?? 0) * 86_400_000);
  const renew = new Date(first);
  renew.setMonth(renew.getMonth() + PLAN_MONTHS[plan.period]);
  return { firstCharge: first, renewal: renew };
}

/** Identifiant de produit comparable (Google Play : « abonnement:offre-de-base » → « abonnement »). */
export const baseProductId = (id: string | null | undefined) => (id ?? '').split(':')[0].toLowerCase();

/**
 * Changement de formule sur Google Play : sans ces informations, acheter une autre formule créerait un SECOND
 * abonnement. Passage à une formule plus longue : immédiat, au prorata du temps restant ; vers une plus courte :
 * à l'échéance (DEFERRED). Sur iOS, les 3 produits sont dans le même groupe d'abonnements : Apple gère le changement.
 */
export function productChangeFor(os: string, activeProductId: string | null | undefined, activePeriod: PlanPeriod | null, plan: Pick<Plan, 'id' | 'period'>) {
  if (os !== 'android' || !activeProductId) return null;
  if (activeProductId === plan.id) return null;
  const longer = activePeriod ? PLAN_MONTHS[plan.period] > PLAN_MONTHS[activePeriod] : true;
  // Google Play attend l'identifiant de l'abonnement, sans l'offre de base (1 abonnement à 3 offres de base OU 3 abonnements)
  return { oldProductIdentifier: activeProductId.split(':')[0], replacementMode: (longer ? 'WITH_TIME_PRORATION' : 'DEFERRED') as 'WITH_TIME_PRORATION' | 'DEFERRED' };
}

/**
 * Ce que la page Premium et la feuille Premium peuvent montrer à la place des formules — jamais d'écran vide, jamais
 * de prix inventé, jamais de Premium accordé localement :
 *  - « ready » : formules renvoyées par la boutique (ou grille de démonstration, signalée comme telle) ;
 *  - « web » : version web, pas d'achat intégré (l'abonnement se prend dans l'application mobile) ;
 *  - « unconfigured » : application mobile compilée sans clé publique RevenueCat (achats non ouverts dans cette version) ;
 *  - « not_ready » : la boutique répond mais ne propose encore aucune formule (produits pas encore créés / validés dans
 *    App Store Connect, Google Play ou RevenueCat : offre courante vide, erreur de configuration RevenueCat) ;
 *  - « offline » : pas de connexion ; « store_error » : boutique injoignable pour une autre raison ; « loading ».
 */
export type PlansAvailability = 'ready' | 'loading' | 'web' | 'unconfigured' | 'not_ready' | 'offline' | 'store_error';

/** Codes d'erreur RevenueCat (PURCHASES_ERROR_CODE) : configuration / produits indisponibles, réseau. */
const RC_NOT_READY = new Set(['23', '5', 'CONFIGURATION_ERROR', 'PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR', 'ConfigurationError', 'ProductNotAvailableForPurchaseError']);
const RC_OFFLINE = new Set(['10', '35', 'NETWORK_ERROR', 'OFFLINE_CONNECTION_ERROR', 'NetworkError', 'OfflineConnectionError']);

/** Nature d'une erreur de chargement des formules (SDK RevenueCat). */
export function plansErrorKind(e: unknown): 'not_ready' | 'offline' | 'store_error' {
  const x = (e ?? {}) as { code?: unknown; readableErrorCode?: unknown; userInfo?: { readableErrorCode?: unknown }; message?: unknown; underlyingErrorMessage?: unknown };
  const codes = [x.code, x.readableErrorCode, x.userInfo?.readableErrorCode].filter((c) => c != null).map(String);
  if (codes.some((c) => RC_NOT_READY.has(c))) return 'not_ready';
  if (codes.some((c) => RC_OFFLINE.has(c))) return 'offline';
  const text = `${String(x.message ?? '')} ${String(x.underlyingErrorMessage ?? '')}`;
  if (/no products registered|could not be fetched|offerings.{0,40}empty|why-are-offerings-empty|configuration/i.test(text)) return 'not_ready';
  if (/network|internet|offline|timed? ?out/i.test(text)) return 'offline';
  return 'store_error';
}

export function plansAvailability(s: { mode: 'store' | 'test' | 'unavailable'; os: string; isLoading?: boolean; isError?: boolean; error?: unknown; count: number }): PlansAvailability {
  if (s.os === 'web' && s.mode !== 'test') return 'web';
  if (s.mode === 'unavailable') return 'unconfigured';
  if (s.isError) return plansErrorKind(s.error);
  if (s.isLoading) return 'loading';
  return s.count > 0 ? 'ready' : 'not_ready';
}

/** Formule d'un identifiant de produit (même règle que le serveur). */
export function periodOfProduct(productId: string | null | undefined): PlanPeriod | null {
  for (const part of (productId ?? '').toLowerCase().split(':').reverse()) {
    if (/(six|6)[_-]?(months?|mois)|semest|half[_-]?year/.test(part)) return 'six_months';
    if (/annual|year|annuel|12[_-]?(months?|mois)/.test(part)) return 'annual';
    if (/month|mensuel/.test(part)) return 'monthly';
  }
  return null;
}
