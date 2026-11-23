/**
 * Preuve sociale du paywall (refonte du 21/11/2026) : note du PROGRAMME DE TEST interne de HOMI, présentée comme telle
 * (« Retours du programme de test HOMI »), jamais comme une note de l'App Store.
 *
 * Source : chiffres et synthèse VALIDÉS par la propriétaire le 21/11/2026 (moyenne 4,8/5, 100 parents ayant donné une
 * note ; trois thèmes présents dans les réponses : quotidien facilité, communication à deux, compréhension de
 * l'enfant et organisation de ses besoins). Les réponses brutes ne sont pas dans le dépôt.
 * Pour modifier : changer ces valeurs ET garder la trace de la nouvelle validation ici. `enabled: false` masque le bloc.
 */
export const TESTER_PROOF = {
  enabled: true,
  /** Moyenne des notes données (sur 5) */
  rating: 4.8,
  /** Nombre de parents ayant donné une note (dénominateur de la moyenne) */
  ratingCount: 100,
  validatedOn: '2026-11-21',
} as const;

/**
 * Histoire de l'équipe (« Un mot de l'équipe ») : texte validé par le couple fondateur le 21/11/2026.
 * `enabled: false` retire la ligne « Tout est parti d'une maman et de son idée » et la feuille.
 */
export const FOUNDER_STORY = { enabled: true, validatedOn: '2026-11-21' } as const;
