/**
 * Aura dans « Se comprendre » (ticket 5) — logique pure, testée.
 * Trois aides d'écriture, toutes servies par la même demande « reformulate » du serveur (3 propositions douces) :
 *  - reformuler un message ; - exprimer un besoin calmement ; - préparer une discussion.
 * Le choix de la personne devient un BROUILLON de « Se comprendre » (modifiable) : rien n'est envoyé au partenaire
 * sans « Envoyer à … » puis la confirmation de l'écran de rédaction.
 */
export const TRANSLATOR_GOALS = ['reformulate', 'need', 'discussion'] as const;
export type TranslatorGoal = (typeof TRANSLATOR_GOALS)[number];

export const toTranslatorGoal = (v: unknown): TranslatorGoal => ((TRANSLATOR_GOALS as readonly string[]).includes(String(v)) ? (v as TranslatorGoal) : 'reformulate');

/** Route réelle : l'écran d'Aura sur le thème « traducteur émotionnel », avec l'aide choisie. */
export function translatorRoute(goal: TranslatorGoal) {
  return { pathname: '/assistant' as const, params: { theme: 'emotion_translator', goal } };
}
