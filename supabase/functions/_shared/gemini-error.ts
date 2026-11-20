/**
 * Erreur d'un appel à Gemini — module à part (sans `fetch`, `AbortSignal.timeout` ni `TextDecoder`) pour que le code
 * partagé avec l'application (aura-run.ts, utilisé par la démonstration) n'embarque pas le client Gemini sur le
 * téléphone. `gemini.ts` la ré-exporte : rien ne change pour les fonctions serveur.
 */
export class GeminiError extends Error {
  constructor(message: string, public status: number, public blocked = false) { super(message); }
}
