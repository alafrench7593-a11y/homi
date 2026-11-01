/**
 * Version web de « react-native-purchases » : les achats intégrés n'existent que sur iOS et Android (App Store,
 * Google Play). Sur le web, aucune clé n'est configurée et ces fonctions ne sont jamais appelées en mode boutique ;
 * ce module évite d'embarquer ~1 Mo de code de paiement dans la version web.
 */
import { t as tr } from '@/i18n';

const unavailable = async (): Promise<never> => { throw new Error(tr('l2.stub.iap')); };
const Purchases = {
  configure: () => undefined,
  logIn: unavailable, logOut: unavailable, getOfferings: unavailable, purchasePackage: unavailable,
  restorePurchases: unavailable, showManageSubscriptions: unavailable,
  checkTrialOrIntroductoryPriceEligibility: async () => ({}),
  INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0, INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1, INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2, INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3 },
};
export type PurchasesPackage = { identifier: string; product: { priceString: string; price: number; title: string } };
export default Purchases;
