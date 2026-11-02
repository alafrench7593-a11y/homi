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
import { t as tr } from '@/i18n';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;
const apiKey = Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;

export type PurchaseMode = 'store' | 'test' | 'unavailable';
/** Mode d'achat pour un mode de backend et une clé RevenueCat donnés. */
export function purchaseModeFor(backendMode: string, key: string | undefined): PurchaseMode {
  return backendMode === 'demo' ? 'test' : key ? 'store' : 'unavailable';
}
/**
 * Mode d'achat COURANT, relu à chaque appel : la démonstration peut être activée après le chargement de ce module
 * (reprise de la démo à l'ouverture, « Découvrir sans compte »). Calculé une seule fois au chargement, il restait
 * « store » ou « unavailable » pendant toute la démonstration d'une version configurée avec Supabase.
 */
export function getPurchaseMode(): PurchaseMode {
  return purchaseModeFor(backend.mode, apiKey);
}

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
const testPlans = (): Plan[] => [
  { id: 'toietmoi_premium_monthly', period: 'monthly', title: tr('l1.pur.monthly'), price: tr('l1.pur.testMonthlyPrice'), detail: tr('l1.pur.perMonthNoCommitment'), trialLabel: tr('l1.pur.trialDays', { count: 3 }), trialDays: 3, billed: tr('l1.pur.testBilledMonthly') },
  { id: 'toietmoi_premium_annual', period: 'annual', title: tr('l1.pur.annual'), price: tr('l1.pur.testAnnualPrice'), detail: tr('l1.pur.testAnnualDetail'), trialLabel: tr('l1.pur.trialDays', { count: 7 }), trialDays: 7, billed: tr('l1.pur.testBilledAnnual') },
];

let configuredFor: string | null = null;

export async function configurePurchases(userId: string) {
  if (getPurchaseMode() !== 'store' || !apiKey) return;
  if (configuredFor === userId) return;
  if (!configuredFor) Purchases.configure({ apiKey, appUserID: userId });
  else await Purchases.logIn(userId);
  configuredFor = userId;
}

export async function resetPurchasesUser() {
  // Déconnexion de RevenueCat dès qu'un utilisateur y a été connecté, même si la démonstration a pris le relais entre-temps
  if (!configuredFor) return;
  try {
    await Purchases.logOut();
  } catch {
    // utilisateur anonyme : rien à faire
  }
  configuredFor = null;
}

export async function getPlans(): Promise<Plan[]> {
  if (getPurchaseMode() !== 'store') return testPlans();
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  const plans: Plan[] = pkgs
    .filter((p) => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL')
    .map((p) => ({
      id: p.product.identifier,
      period: p.packageType === 'ANNUAL' ? 'annual' : 'monthly',
      title: p.packageType === 'ANNUAL' ? tr('l1.pur.annual') : tr('l1.pur.monthly'),
      price: p.product.priceString,
      detail: p.packageType === 'ANNUAL' ? tr('l1.pur.perYear') : tr('l1.pur.perMonthNoCommitment'),
      trialLabel: p.product.introPrice?.price === 0 ? tr(p.product.introPrice.periodUnit === 'DAY' ? 'l1.pur.trialDays' : p.product.introPrice.periodUnit === 'WEEK' ? 'l1.pur.trialWeeks' : 'l1.pur.trialMonths', { count: p.product.introPrice.periodNumberOfUnits }) : undefined,
      trialDays: p.product.introPrice?.price === 0 ? p.product.introPrice.periodNumberOfUnits * (p.product.introPrice.periodUnit === 'WEEK' ? 7 : p.product.introPrice.periodUnit === 'MONTH' ? 30 : 1) : 0,
      billed: p.packageType === 'ANNUAL' ? tr('l1.pur.billedAnnual', { price: p.product.priceString }) : tr('l1.pur.billedMonthly', { price: p.product.priceString }),
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
  const purchaseMode = getPurchaseMode();
  if (purchaseMode === 'test') {
    await backend.rpc('set_demo_subscription', { active: true, period: plan.period, product_id: plan.id, trial: !!plan.trialLabel });
    return true;
  }
  if (purchaseMode !== 'store' || !plan.pkg) throw new Error(tr('l1.pur.notConfigured'));
  await Purchases.purchasePackage(plan.pkg);
  return waitForServerEntitlement();
}

export async function restore(): Promise<boolean> {
  const purchaseMode = getPurchaseMode();
  if (purchaseMode === 'test') return backend.rpc<boolean>('has_premium');
  if (purchaseMode !== 'store') throw new Error(tr('l1.pur.notConfigured'));
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
  const purchaseMode = getPurchaseMode();
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
