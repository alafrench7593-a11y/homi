/**
 * Interrupteurs de fonctionnalités (09/11/2026).
 *
 * aiAssistantOnline : l'assistant IA en ligne (Gemini) est « Bientôt disponible » tant que cet interrupteur est faux.
 * Le code de l'assistant est conservé tel quel ; pour le rallumer : passer la valeur à true ici ET définir le secret
 * serveur ASSISTANT_ENABLED=true sur la fonction « assistant » (sinon elle refuse les appels, réponse « coming_soon »).
 * Les réponses à partir des articles (/assistant/local, sans IA en ligne) restent disponibles.
 */
export const FEATURES = {
  aiAssistantOnline: false,
  /** Backend de démonstration en Premium strict (miroir de premium_policy.strict côté serveur). Tests historiques : faux. */
  demoStrictPremium: true,
};

export const aiAssistantOnline = (): boolean => FEATURES.aiAssistantOnline;
