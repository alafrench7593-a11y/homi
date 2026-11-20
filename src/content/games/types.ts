/** Jeux et activités éducatifs HOMI (outil 132) : types partagés par les textes de chaque langue. */
export const GAME_IDS = [
  // 0–1 an
  'coucou_cache', 'jeu_des_sons', 'boite_tresors', 'sur_le_ventre', 'petit_orchestre', 'comptines_gestes', 'balle_roule', 'promenade_mots',
  // 1–3 ans
  'transvaser', 'tri_couleurs', 'parcours_coussins', 'faire_semblant', 'bulles', 'imagier', 'tresors_parc', 'pate_a_sel',
  // 3–6 ans
  'jacques_a_dit', 'memory_maison', 'chasse_couleurs', 'course_cuillere', 'histoire_trois_mots', 'marelle', 'bateau_papier', 'graine',
  // 6–10 ans
  'marchande', 'cuisiner', 'carte_tresor', 'quiz_famille', 'mots_caches', 'jeu_de_piste', 'coule_flotte', 'ombres',
] as const;
export type GameId = (typeof GAME_IDS)[number];
export type GameBand = '0_1' | '1_3' | '3_6' | '6_10';
export type GamePlace = 'in' | 'out' | 'both';
/** Texte d'un jeu : titre, déroulé, matériel du quotidien, rappel de sécurité propre au jeu (facultatif). */
export interface GameText { title: string; how: string; material: string; safety?: string }
/** Une langue fournit EXACTEMENT les mêmes jeux que le français (contrôlé par le compilateur). */
export type GameTexts = Record<GameId, GameText>;
