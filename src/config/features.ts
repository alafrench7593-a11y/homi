/**
 * Interrupteurs de fonctionnalités (09/11/2026).
 *
 * aiAssistantOnline : l'assistant IA en ligne (Gemini) est « Bientôt disponible » tant que cet interrupteur est faux.
 * Le code de l'assistant est conservé tel quel ; pour le rallumer : passer la valeur à true ici ET définir le secret
 * serveur ASSISTANT_ENABLED=true sur la fonction « assistant » (sinon elle refuse les appels, réponse « coming_soon »).
 * Les réponses à partir des articles (/assistant/local, sans IA en ligne) restent disponibles.
 */
export const FEATURES = {
  /** Nuit calme (24/11/2026) : aucune vibration entre 21 h et 7 h sans accord. Tests historiques (heure réelle) : faux. */
  nightQuietHours: true,
  aiAssistantOnline: true, // ouverte le 21/11/2026 (accord de la propriétaire)
  /** Backend de démonstration en Premium strict (miroir de premium_policy.strict côté serveur). Tests historiques : faux. */
  demoStrictPremium: true,
  /**
   * Démo publique du site web (/demo) : tous les outils ouverts, aucun paywall ni tarif (décision de la propriétaire du
   * 23/11/2026 : l'app n'est pas en vente, aucun prix sur le site public). Sans effet sur iOS / Android.
   */
  webDemoOpen: true,
  /**
   * « J'ai un code ambassadeur » dans le paywall : masqué pour la 1re soumission (24/11/2026, audit App Store) tant que
   * les codes d'offre ne sont pas créés dans App Store Connect (sinon l'écran d'Apple affiche une erreur).
   */
  ambassadorOfferCodes: false,
};

export const aiAssistantOnline = (): boolean => FEATURES.aiAssistantOnline;
export const ambassadorOfferCodes = (): boolean => FEATURES.ambassadorOfferCodes;
