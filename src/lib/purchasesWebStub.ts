/**
 * Version web de « react-native-purchases » : les achats intégrés n'existent que sur iOS et Android (App Store,
 * Google Play). Sur le web, aucune clé n'est configurée et ces fonctions ne sont jamais appelées en mode boutique ;
 * ce module évite d'embarquer ~1 Mo de code de paiement dans la version web.
 */
const unavailable = async (): Promise<never> => { throw new Error('Achats intégrés indisponibles sur le web'); };
const Purchases = {
  configure: () => undefined,
  logIn: unavailable, logOut: unavailable, getOfferings: unavailable, purchasePackage: unavailable,
  restorePurchases: unavailable, showManageSubscriptions: unavailable,
};
export type PurchasesPackage = { identifier: string; product: { priceString: string; price: number; title: string } };
export default Purchases;
