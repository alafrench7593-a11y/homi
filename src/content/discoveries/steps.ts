/**
 * « Je grandis » : étapes du développement, rédaction originale de l'application à partir de sources françaises
 * officielles ou de pédiatres (Santé publique France – 1000 premiers jours sur Santé.fr, articles mpedia de
 * l'Association française de pédiatrie ambulatoire republiés par Santé.fr). Les âges sont des REPÈRES GÉNÉRAUX
 * (moyennes), jamais des échéances : « Chaque enfant évolue à son propre rythme ». Aucune étape non observée
 * n'est interprétée : l'application ne pose aucun diagnostic.
 * `main` : étape principale (version gratuite) ; les autres font partie du suivi complet (Premium).
 */
export type StepCategory = 'gross_motor' | 'fine_motor' | 'communication' | 'language' | 'social' | 'emotions' | 'awakening' | 'autonomy' | 'eating' | 'sleep';
export const STEP_CATEGORIES: StepCategory[] = ['gross_motor', 'fine_motor', 'communication', 'language', 'social', 'emotions', 'awakening', 'autonomy', 'eating', 'sleep'];

export type StepStatus = 'observed' | 'in_progress' | 'not_yet' | 'not_tracked';
export const STEP_STATUSES: StepStatus[] = ['observed', 'in_progress', 'not_yet', 'not_tracked'];

/** Tranches d'âge (mois) : [début, fin) */
export const AGE_BANDS: { key: string; from: number; to: number }[] = [
  { key: '0_3', from: 0, to: 3 }, { key: '3_6', from: 3, to: 6 }, { key: '6_9', from: 6, to: 9 }, { key: '9_12', from: 9, to: 12 },
  { key: '12_18', from: 12, to: 18 }, { key: '18_24', from: 18, to: 24 }, { key: '24_36', from: 24, to: 36 }, { key: '36_72', from: 36, to: 72 },
];

export type StepSource = 'sf_etapes' | 'sf_lang_2_12' | 'sf_lang_1_3' | 'mp_3_6' | 'mp_9_12' | 'sf_proprete' | 'sf_nuits' | 'sf_sieste' | 'sf_diversification' | 'spf_diversification';
export const STEP_SOURCES: Record<StepSource, { label: string; url: string; published?: string; consulted: string }> = {
  sf_etapes: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Les étapes du développement de bébé', url: 'https://www.sante.fr/les-etapes-du-developpement-de-bebe', published: '2025-06-17', consulted: '2026-10-22' },
  sf_lang_2_12: { label: 'Santé.fr (mpedia) — Progrès du langage de 2 à 12 mois', url: 'https://www.sante.fr/progres-du-langage-de-2-12-mois', consulted: '2026-10-22' },
  sf_lang_1_3: { label: 'Santé.fr (mpedia) — Progrès du langage de 1 à 3 ans', url: 'https://www.sante.fr/progres-du-langage-de-1-3-ans', consulted: '2026-10-22' },
  mp_3_6: { label: 'mpedia (Dr Jacques Langue) — Le développement psychomoteur entre 3 et 6 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-3-6-mois/', published: '2021-01-05', consulted: '2026-10-22' },
  mp_9_12: { label: 'mpedia (Dr Jacques Langue) — Le développement psychomoteur entre 9 et 12 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-9-12-mois/', published: '2021-01-05', consulted: '2026-10-22' },
  sf_proprete: { label: 'Santé.fr (mpedia, AFPA) — Comment mon enfant va-t-il devenir propre ?', url: 'https://www.sante.fr/comment-mon-enfant-va-t-il-devenir-propre', published: '2026-08-07', consulted: '2026-10-22' },
  sf_nuits: { label: 'Santé.fr (mpedia, AFPA) — Rythme veille-sommeil, quand va-t-il « faire ses nuits » ?', url: 'https://www.sante.fr/rythme-veille-sommeil-quand-va-t-il-faire-ses-nuits', published: '2026-08-31', consulted: '2026-10-22' },
  sf_sieste: { label: 'Santé.fr (mpedia, AFPA) — La sieste, sommeil de l’enfant en journée', url: 'https://www.sante.fr/la-sieste-sommeil-de-lenfant-en-journee', published: '2020-09-21', consulted: '2026-10-22' },
  sf_diversification: { label: 'Santé.fr (Manger Bouger) — Entre 4 et 6 mois : l’introduction des aliments en douceur', url: 'https://www.sante.fr/node/799513', consulted: '2026-10-22' },
  spf_diversification: { label: 'Santé publique France — Pas à pas, votre enfant mange comme un grand', url: 'https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/documents/brochure/pas-a-pas-votre-enfant-mange-comme-un-grand', published: '2022-05-24', consulted: '2026-10-22' },
};

export interface StepDef {
  key: string;
  category: StepCategory;
  title: string;
  /** repère général en mois [de, à] */
  around: [number, number];
  main?: boolean;
  /** explication simple */
  what: string;
  /** petite activité ou jeu */
  play: string;
  /** précaution de sécurité */
  safety: string;
  /** question à préparer pour un rendez-vous */
  ask: string;
  source: StepSource;
}

const S = (key: string, category: StepCategory, title: string, around: [number, number], source: StepSource, what: string, play: string, safety: string, ask: string, main = false): StepDef =>
  ({ key, category, title, around, source, what, play, safety, ask, main });

const FLOOR = 'Jouez au sol, sur un tapis, jamais sur un lit, un canapé ou une table à langer sans votre main sur lui.';
const SMALL = 'Gardez hors de portée les petits objets qui tiennent dans la bouche (piles bouton, aimants, billes).';
const CALM = 'Rien à forcer : on propose, on observe, on recommence un autre jour.';

export const STEPS: StepDef[] = [
  // ---------------------------------------------------------------- motricité globale
  S('lifts_head', 'gross_motor', 'Soulève la tête sur le ventre', [1, 3], 'sf_etapes', 'Allongé sur le ventre, éveillé, il relève la tête puis les épaules pour regarder autour de lui.', 'Quelques minutes sur le ventre quand il est bien réveillé, face à votre visage ou à un jouet coloré.', `${FLOOR} Pour dormir : toujours sur le dos.`, 'Combien de temps sur le ventre, éveillé, conseillez-vous à son âge ?', true),
  S('holds_head', 'gross_motor', 'Tient sa tête', [3, 4], 'mp_3_6', 'Porté contre vous ou assis avec un appui, sa tête reste droite sans balancer.', 'Portez-le face au monde quelques instants pour qu’il découvre la pièce.', 'Soutenez encore sa nuque lors des changements de position rapides.', 'Comment le porter pour qu’il soit bien installé ?', true),
  S('rolls_over', 'gross_motor', 'Se retourne', [5, 7], 'mp_3_6', 'Il roule du dos sur le côté, puis passe du dos au ventre.', 'Posez un jouet un peu sur le côté pour l’inviter à tourner.', 'Dès qu’il se retourne, il peut tomber : ne le laissez jamais seul en hauteur.', 'S’il se retourne sur le ventre la nuit, que faire ?', true),
  S('sits_supported', 'gross_motor', 'Tient assis avec un appui', [6, 7], 'mp_3_6', 'Calé dans le dos par un coussin ou par vous, il reste assis et regarde ses mains et ses jouets.', 'Asseyez-le entre vos jambes, un jouet devant lui.', 'Entourez-le de coussins : il bascule encore facilement.', 'À quel moment l’installer assis pour jouer ?'),
  S('sits_alone', 'gross_motor', 'Tient assis sans appui', [6, 9], 'sf_etapes', 'Il tient bien assis seul et utilise ses mains pour jouer.', 'Des jouets à attraper autour de lui, pour qu’il se penche et se rattrape.', FLOOR, 'Comment l’aider à gagner en équilibre ?', true),
  S('moves_around', 'gross_motor', 'Se déplace', [9, 12], 'mp_9_12', 'Il se déplace à sa façon : en rampant, à quatre pattes, sur les fesses…', 'Un parcours de coussins au sol, un ballon qui roule à aller chercher.', 'Barrières aux escaliers, prises protégées, produits ménagers hors de portée. Le trotteur est déconseillé (chutes, brûlures).', 'Quels aménagements de sécurité prévoir à la maison ?', true),
  S('stands_up', 'gross_motor', 'Se met debout en se tenant', [10, 12], 'mp_9_12', 'Il se hisse debout en s’accrochant aux meubles, puis apprend à se tenir debout.', 'Un meuble bas et stable avec des jouets posés dessus.', 'Fixez au mur les meubles qui peuvent basculer.', 'Faut-il des chaussures à cet âge ?'),
  S('walks', 'gross_motor', 'Marche seul', [12, 18], 'sf_etapes', 'Il fait ses premiers pas seul, puis marche de plus en plus loin. Les âges varient beaucoup d’un enfant à l’autre.', 'Pieds nus à la maison sur un sol non glissant ; un porteur ou un chariot à pousser.', 'Sécurisez escaliers, fenêtres et piscine.', 'Comment l’accompagner dans ses premiers pas ?', true),
  S('climbs_stairs', 'gross_motor', 'Monte les escaliers', [16, 24], 'sf_etapes', 'Il monte les marches, souvent à quatre pattes au début, en se tenant.', 'Une ou deux marches avec vous à côté.', 'Toujours un adulte dans l’escalier ; barrière en haut et en bas.', 'À partir de quand le laisser essayer seul ?'),
  S('kicks_ball', 'gross_motor', 'Frappe dans un ballon', [23, 30], 'sf_etapes', 'Il donne un coup de pied dans un ballon sans tomber.', 'Un ballon léger au parc, des petits buts avec deux chaussures.', 'Choisissez un espace dégagé, loin de la rue.', 'Quelles activités physiques à son âge ?'),
  // ---------------------------------------------------------------- motricité fine
  S('grasps', 'fine_motor', 'Attrape un objet', [3, 6], 'mp_3_6', 'Il attrape volontairement ce qui est à sa portée et le garde dans sa main.', 'Un hochet léger ou un anneau de tissu tendu devant lui.', SMALL, 'Quels jouets sont adaptés à son âge ?', true),
  S('hand_to_hand', 'fine_motor', 'Passe un objet d’une main à l’autre', [6, 8], 'mp_3_6', 'Il fait passer un cube ou un jouet d’une main dans l’autre.', 'Deux cubes en tissu, un dans chaque main ; échangez à tour de rôle.', SMALL, 'Comment l’encourager à utiliser ses deux mains ?', true),
  S('empties_fills', 'fine_motor', 'Vide et remplit', [9, 12], 'mp_9_12', 'Il sort les objets d’un sac ou d’une boîte, puis commence à les remettre.', 'Un panier de petits objets sûrs du quotidien (gobelets, foulards, cuillères en bois).', SMALL, 'Quels objets du quotidien peut-il manipuler sans danger ?'),
  // ---------------------------------------------------------------- communication
  S('smiles', 'communication', 'Sourit et vous regarde', [1, 2], 'sf_etapes', 'Il vous regarde dans les yeux et sourit.', 'Face à face, à 20–30 cm, parlez-lui doucement en souriant.', CALM, 'Que me conseillez-vous pour échanger avec lui ?', true),
  S('reacts_voice', 'communication', 'Réagit à la voix', [2, 3], 'sf_etapes', 'Il gazouille et réagit quand on lui parle.', 'Répondez à ses sons, puis faites une pause pour lui laisser « la parole ».', CALM, 'Comment savoir s’il entend bien ?'),
  S('makes_sounds', 'communication', 'Fait des sons', [2, 6], 'sf_lang_2_12', 'Il vocalise, gazouille, puis babille avec des syllabes comme « ba-ba ».', 'Le jeu du « chacun son tour » : imitez son son, ajoutez-en un, attendez sa réponse.', 'Évitez les écrans : ils ne remplacent pas un vrai échange.', 'Comment l’aider à babiller ?', true),
  S('name', 'communication', 'Réagit à son prénom', [5, 9], 'sf_lang_2_12', 'Il tourne la tête ou s’arrête quand on l’appelle par son prénom.', 'Appelez-le doucement depuis un côté de la pièce, puis de l’autre.', CALM, 'Que faire si j’ai un doute sur son audition ?', true),
  S('waves_bye', 'communication', 'Fait « au revoir »', [8, 12], 'sf_etapes', 'Il fait les marionnettes et « au revoir » de la main.', 'Comptines à gestes : « Ainsi font font font ».', CALM, 'Quelles comptines à gestes lui proposer ?'),
  S('points', 'communication', 'Montre du doigt', [10, 14], 'sf_lang_2_12', 'Il tend la main ou l’index vers un objet pour le montrer ou demander son nom.', 'Nommez ce qu’il montre ; regardez des imagiers ensemble.', CALM, 'Comment l’encourager à communiquer ?', true),
  // ---------------------------------------------------------------- langage
  S('first_words', 'language', 'Dit ses premiers mots', [9, 14], 'sf_lang_2_12', 'Les premiers mots apparaissent, souvent « papa », « mama », parfois déformés.', 'Lisez des imagiers en nommant chaque image ; chantez.', CALM, 'Comment l’aider à enrichir son vocabulaire ?', true),
  S('understands_simple', 'language', 'Comprend des phrases simples', [11, 14], 'sf_etapes', 'Il comprend certaines phrases simples du quotidien (« donne », « viens »).', 'Décrivez ce que vous faites pendant le bain ou les repas.', CALM, 'Comment savoir ce qu’il comprend ?'),
  S('says_words', 'language', 'Prononce certains mots', [16, 20], 'sf_etapes', 'Il dit plusieurs mots et fait de petites expressions ; il comprend bien plus de mots qu’il n’en dit.', 'Reformulez ce qu’il dit avec le bon mot, sans le corriger ; lisez des histoires courtes.', CALM, 'Que faire s’il parle peu ?', true),
  S('two_words', 'language', 'Associe deux mots', [18, 24], 'sf_lang_1_3', 'Il commence à associer deux mots (« moi manger ») et dit « moi » ou son prénom.', 'Posez des questions à choix (« pomme ou banane ? »).', CALM, 'Comment soutenir son langage au quotidien ?', true),
  S('sentences', 'language', 'Fait des phrases', [24, 36], 'sf_lang_1_3', 'Ses phrases s’allongent, il dit « je » et pose beaucoup de questions.', 'Racontez votre journée chacun à votre tour ; jeux de rôle (dînette, garage).', CALM, 'Comment l’aider à se faire comprendre ?', true),
  // ---------------------------------------------------------------- interactions sociales
  S('familiar_people', 'social', 'Reconnaît les personnes familières', [3, 5], 'sf_etapes', 'Il réagit différemment aux personnes qu’il connaît.', 'Regardez des photos de la famille en nommant chacun.', CALM, 'Comment préparer un nouveau mode d’accueil ?', true),
  S('strangers', 'social', 'Remarque les personnes inconnues', [5, 9], 'sf_etapes', 'Il remarque les personnes qu’il ne connaît pas et peut se blottir contre vous.', 'Laissez-lui le temps d’observer avant qu’on le prenne dans les bras.', CALM, 'Comment l’aider face aux personnes nouvelles ?'),
  S('imitates', 'social', 'Imite les adultes', [11, 18], 'sf_etapes', 'Il aime faire comme vous : téléphoner, balayer, cuisiner.', 'Donnez-lui une cuillère en bois et un saladier pendant que vous cuisinez.', 'Cuisine : tenez-le loin des plaques et des casseroles chaudes.', 'Quels jeux d’imitation lui proposer ?', true),
  S('plays_with_adult', 'social', 'Vous invite à jouer', [23, 30], 'sf_etapes', 'Il imite la vie quotidienne et vient vous chercher pour jouer.', 'Dînette, poupée, garage : suivez son histoire.', CALM, 'Comment l’aider à jouer avec d’autres enfants ?', true),
  // ---------------------------------------------------------------- émotions
  S('shows_emotions', 'emotions', 'Montre ses émotions', [2, 4], 'sf_etapes', 'Il exprime la joie, la colère ou la peur, par son visage et ses pleurs.', 'Mettez des mots sur ce qu’il semble ressentir.', CALM, 'Comment l’apaiser quand il pleure beaucoup ?', true),
  S('laughs', 'emotions', 'Rit aux éclats', [3, 5], 'mp_3_6', 'Il rit franchement quand on joue avec lui.', 'Coucou-caché, chatouilles douces, grimaces.', CALM, 'Quels jeux lui proposer à cet âge ?', true),
  S('soothed_voice', 'emotions', 'S’apaise à votre voix', [4, 6], 'sf_etapes', 'Il peut s’arrêter de pleurer en entendant votre voix.', 'Une chanson toujours la même pour les moments calmes.', 'Si les pleurs vous épuisent, posez-le en sécurité dans son lit et appelez quelqu’un : on ne secoue jamais un bébé.', 'Que faire quand les pleurs deviennent difficiles à vivre ?'),
  S('says_no', 'emotions', 'Dit « non »', [12, 24], 'sf_lang_1_3', 'Il utilise de plus en plus le « non » : il affirme ses envies.', 'Proposez deux choix acceptables plutôt qu’une question ouverte.', CALM, 'Comment réagir à ses colères ?'),
  // ---------------------------------------------------------------- éveil
  S('mirror', 'awakening', 'Sourit à son reflet', [5, 7], 'mp_3_6', 'Il sourit à son image dans un miroir incassable.', 'Un miroir de sécurité au sol, à côté du tapis d’éveil.', 'Miroir incassable uniquement.', 'Quels jeux d’éveil pour son âge ?'),
  S('throws_toys', 'awakening', 'Lance ses jouets pour qu’on les ramasse', [8, 11], 'sf_etapes', 'Il fait tomber ses jouets et regarde où ils vont… et si vous les ramassez.', 'Un jeu de « tombe – ramasse » avec un objet doux.', SMALL, 'Comment l’occuper pendant les repas ?'),
  S('explores', 'awakening', 'Explore son environnement', [11, 14], 'sf_etapes', 'Il devient plus autonome et part découvrir la pièce.', 'Une caisse de « trésors » à fouiller : boîtes, tissus, cuillères.', 'Rangez en hauteur médicaments, produits ménagers et objets coupants.', 'Comment sécuriser la maison pour qu’il explore ?', true),
  S('stories', 'awakening', 'Aime qu’on lui raconte des histoires', [16, 20], 'sf_etapes', 'Il aime qu’on lui raconte des histoires et attire votre attention.', 'Un livre chaque soir, souvent le même : il adore la répétition.', CALM, 'Quels livres choisir à son âge ?', true),
  // ---------------------------------------------------------------- autonomie
  S('says_me', 'autonomy', 'Dit « moi » ou son prénom', [18, 24], 'sf_lang_1_3', 'Il parle de lui en disant « moi » ou son prénom.', 'Laissez-le choisir entre deux vêtements.', CALM, 'Comment l’aider à gagner en autonomie ?'),
  S('spoon_alone', 'autonomy', 'Utilise seul sa cuillère', [22, 26], 'sf_etapes', 'Il mange seul avec sa cuillère, même si tout n’arrive pas dans la bouche.', 'Une cuillère à sa taille et des aliments qui tiennent bien (purée épaisse).', 'Toujours assis et sous votre regard pendant le repas.', 'Comment l’encourager à manger seul ?', true),
  S('potty_interest', 'autonomy', 'S’intéresse au pot', [18, 30], 'sf_proprete', 'L’apprentissage de la propreté commence souvent entre 18 et 24 mois, parfois plus tard. Il peut prendre de quelques jours à plusieurs mois.', 'Proposez le pot après le repas ou avant la sieste, quelques minutes, sans insister.', 'Ne jamais forcer : la pression peut entraîner une constipation.', 'Comment savoir s’il est prêt ?', true),
  // ---------------------------------------------------------------- alimentation
  S('food_interest', 'eating', 'S’intéresse à vos aliments', [4, 6], 'sf_diversification', 'Il tient sa tête et regarde avec intérêt ce que vous mangez : des signes qui peuvent annoncer la diversification.', 'Installez-le à table avec vous pendant vos repas.', 'Pas d’aliment avant 4 mois ; demandez conseil pour un bébé né prématuré.', 'Quand et comment commencer la diversification ?', true),
  S('soft_pieces', 'eating', 'Mange de petits morceaux fondants', [8, 10], 'spf_diversification', 'Il accepte des morceaux très mous qui s’écrasent entre la langue et le palais.', 'Une seule nouvelle texture par repas, à côté d’un plat qu’il connaît.', 'Toujours assis, sous votre regard ; aliments ronds coupés en quatre.', 'Comment faire évoluer les textures ?', true),
  S('crunchy_pieces', 'eating', 'Croque de petits morceaux', [10, 14], 'spf_diversification', 'Il commence à croquer des morceaux avec ses dents.', 'Des bâtonnets de légumes cuits fondants à tenir dans la main.', 'Pas d’aliment petit, dur et rond (cacahuète entière, noix) avant 5 ans.', 'Quels aliments éviter pour limiter les fausses routes ?'),
  // ---------------------------------------------------------------- sommeil
  S('longer_nights', 'sleep', 'Fait des nuits plus longues', [4, 6], 'sf_nuits', 'Entre 4 et 6 mois en moyenne, beaucoup de bébés dorment plus longtemps la nuit. Avant 3–4 mois, on suit son rythme.', 'La journée : lumière et bruits normaux ; la nuit : lumière basse, voix douce.', 'Couchage sur le dos, dans un lit à barreaux, sans couette, oreiller ni tour de lit.', 'Comment l’aider à distinguer le jour et la nuit ?', true),
  S('two_naps', 'sleep', 'Fait deux siestes', [10, 14], 'sf_sieste', 'Vers 12 mois, il fait souvent une sieste le matin et une l’après-midi.', 'Un petit rituel avant la sieste (chanson, doudou).', 'Même couchage sûr pour la sieste que pour la nuit.', 'Combien de temps de sieste pour son âge ?'),
  S('one_nap', 'sleep', 'Fait une seule sieste', [18, 36], 'sf_sieste', 'Vers 18 mois, la sieste du matin disparaît au profit d’une sieste plus longue en début d’après-midi.', 'Un temps calme après le déjeuner.', 'Une sieste très longue peut retarder le coucher : demandez conseil si besoin.', 'Comment gérer le passage à une sieste ?', true),
];

export const STEP_BY_KEY: Record<string, StepDef> = Object.fromEntries(STEPS.map((s) => [s.key, s]));
export const MAIN_STEP_KEYS = STEPS.filter((s) => s.main).map((s) => s.key);
