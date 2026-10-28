/**
 * Abonnements (RevenueCat → achats intégrés Apple / Google).
 * La boutique encaisse ; RevenueCat prévient le serveur (webhook) ;
 * les DROITS sont toujours vérifiés côté serveur (fonction has_premium).
 *
 * Modes :
 *  - « store » : clés RevenueCat présentes, application compilée (build de développement ou de production) ;
 *  - « test »  : mode démonstration local, l'achat est simulé (aucun paiement) ;
 *  - « unavailable » : Supabase branché mais RevenueCat pas encore configuré.
 */
import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { backend } from './backend';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
const apiKey = Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;

export type PurchaseMode = 'store' | 'test' | 'unavailable';
export const purchaseMode: PurchaseMode = backend.mode === 'demo' ? 'test' : apiKey ? 'store' : 'unavailable';

export interface Plan {
  id: string;
  period: 'monthly' | 'annual';
  title: string;
  price: string;
  detail: string;
  trialLabel?: string;
  /** Durée de l'essai gratuit en jours (0 ou absent : pas d'essai) */
  trialDays?: number;
  /** Ce qui est réellement facturé, en clair (« 39,99 € facturés une fois par an ») */
  billed: string;
  pkg?: PurchasesPackage;
}

// Prix affichés en mode test uniquement ; en production ils viennent de la boutique
const TEST_PLANS: Plan[] = [
  { id: 'toietmoi_premium_monthly', period: 'monthly', title: 'Mensuel', price: '5,99 €', detail: 'par mois, sans engagement', trialLabel: '3 jours offerts', trialDays: 3, billed: '5,99 € facturés chaque mois' },
  { id: 'toietmoi_premium_annual', period: 'annual', title: 'Annuel', price: '39,99 €', detail: 'par an — soit environ 3,33 € par mois', trialLabel: '7 jours offerts', trialDays: 7, billed: '39,99 € facturés une fois par an' },
];

let configuredFor: string | null = null;

export async function configurePurchases(userId: string) {
  if (purchaseMode !== 'store' || !apiKey) return;
  if (configuredFor === userId) return;
  if (!configuredFor) Purchases.configure({ apiKey, appUserID: userId });
  else await Purchases.logIn(userId);
  configuredFor = userId;
}

export async function resetPurchasesUser() {
  if (purchaseMode !== 'store' || !configuredFor) return;
  try {
    await Purchases.logOut();
  } catch {
    // utilisateur anonyme : rien à faire
  }
  configuredFor = null;
}

export async function getPlans(): Promise<Plan[]> {
  if (purchaseMode !== 'store') return TEST_PLANS;
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  const plans: Plan[] = pkgs
    .filter((p) => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL')
    .map((p) => ({
      id: p.product.identifier,
      period: p.packageType === 'ANNUAL' ? 'annual' : 'monthly',
      title: p.packageType === 'ANNUAL' ? 'Annuel' : 'Mensuel',
      price: p.product.priceString,
      detail: p.packageType === 'ANNUAL' ? 'par an' : 'par mois, sans engagement',
      trialLabel: p.product.introPrice?.price === 0 ? `${p.product.introPrice.periodNumberOfUnits} ${p.product.introPrice.periodUnit === 'DAY' ? 'jours' : p.product.introPrice.periodUnit === 'WEEK' ? 'semaines' : 'mois'} offerts` : undefined,
      trialDays: p.product.introPrice?.price === 0 ? p.product.introPrice.periodNumberOfUnits * (p.product.introPrice.periodUnit === 'WEEK' ? 7 : p.product.introPrice.periodUnit === 'MONTH' ? 30 : 1) : 0,
      billed: p.packageType === 'ANNUAL' ? `${p.product.priceString} facturés une fois par an` : `${p.product.priceString} facturés chaque mois`,
      pkg: p,
    }));
  return applyTrialEligibility(plans);
}

/**
 * iOS : Apple n'accorde l'essai gratuit qu'une fois par groupe d'abonnements.
 * On n'affiche « 3 jours offerts » que si la boutique confirme l'éligibilité ;
 * statut inconnu ou non éligible → prix normal affiché (recommandation RevenueCat).
 * Android : Google Play applique lui-même l'éligibilité au moment de l'achat.
 */
export async function applyTrialEligibility(plans: Plan[], os: string = Platform.OS): Promise<Plan[]> {
  if (os !== 'ios') return plans;
  const withTrial = plans.filter((p) => (p.trialDays ?? 0) > 0).map((p) => p.id);
  if (!withTrial.length) return plans;
  let status: Record<string, { status: number }> = {};
  try {
    status = await Purchases.checkTrialOrIntroductoryPriceEligibility(withTrial);
  } catch {
    status = {};
  }
  return plans.map((p) => (status[p.id]?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
    ? p
    : { ...p, trialLabel: undefined, trialDays: 0 }));
}

/** Achat. Retourne true si les droits sont confirmés PAR LE SERVEUR. */
export async function purchase(plan: Plan): Promise<boolean> {
  if (purchaseMode === 'test') {
    await backend.rpc('set_demo_subscription', { active: true, period: plan.period, product_id: plan.id, trial: !!plan.trialLabel });
    return true;
  }
  if (purchaseMode !== 'store' || !plan.pkg) throw new Error('Les achats ne sont pas encore configurés pour cette version.');
  await Purchases.purchasePackage(plan.pkg);
  return waitForServerEntitlement();
}

export async function restore(): Promise<boolean> {
  if (purchaseMode === 'test') return backend.rpc<boolean>('has_premium');
  if (purchaseMode !== 'store') throw new Error('Les achats ne sont pas encore configurés pour cette version.');
  await Purchases.restorePurchases();
  return waitForServerEntitlement();
}

/** Pages officielles de gestion des abonnements (résiliation, moyen de paiement). */
export const MANAGE_URLS = { ios: 'https://apps.apple.com/account/subscriptions', android: 'https://play.google.com/store/account/subscriptions' } as const;

/** Date du premier prélèvement et du renouvellement suivant, à partir d'aujourd'hui (affichage honnête). */
export function billingDates(plan: Pick<Plan, 'period' | 'trialDays'>, from: Date = new Date()) {
  const first = new Date(from.getTime() + (plan.trialDays ?? 0) * 86_400_000);
  const renew = new Date(first);
  if (plan.period === 'annual') renew.setFullYear(renew.getFullYear() + 1); else renew.setMonth(renew.getMonth() + 1);
  return { firstCharge: first, renewal: renew };
}

export async function manageSubscription() {
  if (purchaseMode === 'test') {
    await backend.rpc('set_demo_subscription', { active: false });
    return;
  }
  if (purchaseMode === 'store') await Purchases.showManageSubscriptions();
}

/** Le webhook RevenueCat met quelques secondes à arriver : on interroge le serveur. */
async function waitForServerEntitlement(timeoutMs = 20000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await backend.rpc<boolean>('has_premium')) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}
