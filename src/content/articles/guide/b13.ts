/** Guide complet — lot 13 (27/10/2026) : activités des 3–6 ans (jeux, arts, nature, lecture, jeux de société, bricolage, cuisine, activités calmes, sorties culturelles, ennui créatif). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
/** Pages officielles ou de référence françaises réellement lues le 2026-10-27. `published` = date affichée par la page. */
const S = {
  dev34: { label: 'Santé.fr (mpedia – AFPA) — Entre 3 et 4 ans, que d’expériences nouvelles à vivre', url: 'https://www.sante.fr/node/1093914', consulted_on: C, published: '2025-07-09' },
  dev45: { label: 'Santé.fr (mpedia – AFPA) — De 4 à 5 ans, entre imaginaire et compréhension de son monde', url: 'https://www.sante.fr/de-4-5-ans-entre-imaginaire-et-comprehension-de-son-monde', consulted_on: C, published: '2025-03-07' },
  dev56: { label: 'Santé.fr (mpedia – AFPA) — De 5 à 6 ans, l’école élémentaire en ligne de mire', url: 'https://www.sante.fr/node/1093916', consulted_on: C, published: '2025-03-07' },
  recos5: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Les recommandations pour les enfants jusqu’à 5 ans', url: 'https://www.sante.fr/node/800511', consulted_on: C, published: '2023-10-10' },
  guideMB: { label: 'Santé publique France — Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans', url: 'https://www.santepubliquefrance.fr/sites/default/files/cadic_files/documents/spf00005493.pdf', consulted_on: C, published: '2024-08-30' },
  gouts: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Comment développer les goûts de votre enfant et son plaisir à manger ?', url: 'https://www.sante.fr/node/8364303', consulted_on: C, published: '2024-06-11' },
  programme: { label: 'Éduscol (ministère de l’Éducation nationale) — Programme de l’école maternelle (cycle 1), version consolidée', url: 'https://eduscol.education.gouv.fr/sites/default/files/document/programme-cycle-1-consolide-127565.pdf', consulted_on: C },
  ecrans: { label: 'Ministère chargé de la Santé — Écrans : des risques pour la santé physique et mentale des enfants, un accompagnement nécessaire', url: 'https://solidarites.gouv.fr/enfants-et-ecrans-des-risques-sanitaires-reels-un-accompagnement-necessaire', consulted_on: C, published: '2025-07-02' },
  guideEcrans: { label: 'MILDECA (drogues.gouv.fr) — Guide « Bien grandir dans un monde d’écrans » (Ville de Saint-Denis, enfants de 0 à 6 ans)', url: 'https://www.drogues.gouv.fr/sites/default/files/2024-07/Guide_Bien%20grandir%20dans%20un%20monde%20d%27ecrans.pdf', consulted_on: C, published: '2024-04' },
  jeuLot: { label: 'Département du Lot (PMI) — Le jeu chez l’enfant', url: 'https://lot.fr/sites/lot.fr/files/le_jeu_et_lenfant_0.pdf', consulted_on: C },
  culture: { label: 'Ministère chargé des Solidarités — La santé des enfants et des parents est aussi culturelle : sensibilisation aux pratiques culturelles et artistiques', url: 'https://solidarites.gouv.fr/la-sante-des-enfants-et-des-parents-est-aussi-culturelle-sensibilisation-aux-pratiques-culturelles', consulted_on: C, published: '2021-10-27' },
  marinopoulos: { label: 'Ministère de la Culture — Rapport « Promouvoir et pérenniser l’éveil culturel et artistique de l’enfant de la naissance à 3 ans dans le lien à son parent » (S. Marinopoulos)', url: 'https://www.culture.gouv.fr/content/download/214595/2250125', consulted_on: C, published: '2019-01' },
  rituel: { label: 'Santé.fr (mpedia – AFPA) — Rituel du coucher, un moment à partager', url: 'https://www.sante.fr/node/1068916', consulted_on: C, published: '2023-09-01' },
  jouets: { label: 'economie.gouv.fr (DGCCRF) — Nos conseils pour choisir les jouets de vos enfants en toute sécurité', url: 'https://www.economie.gouv.fr/particuliers/choix-conseil-achat-jouets-securite-enfants', consulted_on: C },
  dgccrfJouets: { label: 'DGCCRF (economie.gouv.fr) — Comment la DGCCRF s’assure de la sécurité des jouets', url: 'https://www.economie.gouv.fr/dgccrf/comment-la-dgccrf-sassure-de-la-securite-des-jouets', consulted_on: C, published: '2023-12-18' },
  slime: { label: 'Anses — Le slime, une pâte très prisée : mise en garde sur ses risques', url: 'https://www.anses.fr/fr/content/le-slime-une-pate-tres-prisee-mais-pas-sans-risque', consulted_on: C, published: '2018-05-04' },
  piles: { label: 'Santé.fr (Ministère chargé de la Santé) — Piles bouton : prévention des risques d’ingestion par les jeunes enfants', url: 'https://www.sante.fr/node/1184265', consulted_on: C, published: '2024-12-16' },
  accidents: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Éviter les accidents domestiques des enfants', url: 'https://www.sante.fr/eviter-les-accidents-domestiques-des-enfants', consulted_on: C, published: '2025-07-11' },
  airesJeux: { label: 'DGCCRF (economie.gouv.fr) — Aires collectives de jeux', url: 'https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Aires-collectives-jeux', consulted_on: C },
  trampoline: { label: 'Ministère des Sports et ministère de l’Éducation nationale (préfecture de l’Allier) — Fiche vigilance : parcs de trampolines', url: 'https://www.allier.gouv.fr/contenu/telechargement/9336/69063/file/fiche_vigilance_trampoline-2.pdf', consulted_on: C },
  aisance: { label: 'sports.gouv.fr — Aisance aquatique, 1re étape', url: 'https://www.sports.gouv.fr/aisance-aquatique-1ere-etape-603', consulted_on: C },
  cafNage: { label: 'caf.fr — Apprendre à nager, même tout petit', url: 'https://caf.fr/allocataires/vies-de-famille/articles/apprendre-nager-meme-tout-petit', consulted_on: C, published: '2022-06-01' },
  noyade: { label: 'Santé.fr (Ministère chargé de la Santé) — Baignades et activités nautiques : attention aux noyades !', url: 'https://www.sante.fr/node/6851765', consulted_on: C, published: '2026-05-22' },
  tiques: { label: 'Santé.fr (RecoSanté) — Comment éviter les morsures de tiques ?', url: 'https://sante.fr/comment-eviter-les-morsures-de-tiques', consulted_on: C, published: '2025-07-23' },
  plantes: { label: 'Anses — Plante comestible et plante toxique : gare aux confusions', url: 'https://www.anses.fr/fr/content/plante-comestible-et-plante-toxique-gare-aux-confusions', consulted_on: C, published: '2020-08-17' },
  casque: { label: 'Sécurité routière (communiqué relayé par la préfecture de Lot-et-Garonne) — À vélo, le casque devient obligatoire pour les enfants de moins de 12 ans', url: 'https://www.lot-et-garonne.gouv.fr/contenu/telechargement/10719/98831/file/cp-obligationcasqueveloenfant2-1.pdf', consulted_on: C, published: '2016-12-22' },
  licences: { label: 'sports.gouv.fr — Rentrée scolaire et prise de licences sportives', url: 'https://www.sports.gouv.fr/rentree-scolaire-et-prise-de-licences-sportives-2205', consulted_on: C, published: '2023-09-10' },
} satisfies Record<string, ArticleSource>;

/** Phrase de fin commune : l'article informe, il ne remplace pas un professionnel. */
const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, de la PMI ou des professionnels qui accompagnent votre enfant._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**.';
const SOUTIEN = 'Si vous vous sentez à bout, épuisé·e ou très seul·e, parlez-en à votre médecin ou à la PMI ; en cas de détresse ou d’idées noires, le **3114** répond jour et nuit. Si un enfant est en danger, appelez le **119**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['child'], min_age_months: 36, max_age_months: 72, status: 'to_review', ...x,
});

export const GUIDE_B13: LibArticle[] = [
  // ------------------------------------------------------------------ bouger
  a({
    slug: 'bouger-trois-heures-par-jour-3-6-ans',
    title: 'Bouger au moins 3 heures par jour entre 3 et 6 ans : à quoi cela ressemble ?',
    summary: 'Le repère des 3 heures d’activité quotidienne paraît beaucoup : voici comment il se construit naturellement dans une journée d’enfant de 3 à 6 ans, entre école, trajets, jeux et maison.',
    category: 'activites-eveil', tags: ['activité physique', 'bouger', '3 ans', '4 ans', '5 ans', 'maternelle', 'sédentarité', 'jeux dehors', 'trajet école à pied'],
    sources: [S.recos5, S.guideMB, S.programme],
    body_md: `## En bref
- Santé publique France recommande qu’un jeune enfant **bouge au moins 3 heures par jour**, avec des activités variées et ludiques, en plein air autant que possible.
- Ces 3 heures se cumulent : école, trajets, square, jeux à la maison, petites tâches du quotidien, tout compte.
- Il est conseillé de ne pas laisser un enfant **assis ou allongé plus d’une heure d’affilée**, en dehors du sommeil.
- À partir de 6 ans, le repère devient **au moins 1 heure par jour** d’activité, dont des activités plus intenses plusieurs fois par semaine.

## Comprendre
Entre 3 et 6 ans, l’enfant a besoin de mouvement pour grandir : il apprend à courir, sauter, grimper, lancer, garder l’équilibre. Les repères de Santé publique France (Manger Bouger) ne demandent pas un « sport » au sens strict, mais du **mouvement sous toutes ses formes**, si possible dehors. Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans rappelle aussi que le temps passé assis ou allongé (écrans, longs trajets en voiture, poussette) mérite d’être limité, car la sédentarité favorise le surpoids et n’aide pas au développement des os.

À l’école maternelle, le programme prévoit une **activité physique quotidienne**, d’une durée effective de 30 à 45 minutes, organisée autour de quatre axes : se déplacer, construire des équilibres, s’exprimer avec son corps (danse, arts du cirque) et coopérer ou s’opposer. Le reste se joue en dehors de la classe : récréations, trajets, mercredis, soirées et week-ends.

## Au quotidien
Une journée « active » peut ressembler à ceci, sans rien d’exceptionnel :
- **Le trajet vers l’école à pied**, à trottinette ou à vélo quand c’est possible, comme le suggère le guide Manger-Bouger.
- **Le square après l’école** : toboggan, structure à grimper, course-poursuite, ballon.
- **Les petites tâches** : mettre la table, ranger ses jouets, porter un petit sac de courses, arroser les plantes.
- **Un moment de danse** dans le salon les jours de pluie, quand sortir n’est pas possible.
- **Des jeux de plein air le week-end** : balade en forêt, jeux de ballon en famille, barboter dans l’eau sous surveillance.

Quelques idées pour faciliter les choses :
- Laissez à portée de main un ballon, une corde à sauter, des craies pour dessiner une marelle.
- Proposez des « défis » : aller jusqu’à l’arbre en sautant à pieds joints, marcher sur une ligne comme un funambule, imiter les animaux (le kangourou, le crabe, l’ours).
- Coupez les longues périodes assises par une petite pause « on bouge » : une chanson mimée, une course jusqu’à la porte.
- Bougez avec lui : les enfants reproduisent ce qu’ils voient, et un parent qui marche, joue ou danse donne envie de faire pareil.
- Pensez à l’eau : proposez-lui à boire régulièrement, surtout quand il fait chaud ou après un jeu très actif.

## Questions fréquentes
**Mon enfant va déjà à l’école toute la journée, faut-il en rajouter ?** L’activité physique en classe et les récréations comptent dans la journée. Le soir et le week-end, l’idée n’est pas de rajouter un programme, mais de privilégier le jeu libre et le plein air plutôt que les écrans.

**Faut-il l’inscrire à un sport dès 3 ou 4 ans ?** Ce n’est pas une obligation. Les jeux libres, le square et les balades remplissent très bien ce rôle. Une activité d’éveil peut être un plaisir si l’enfant en a envie, sans surcharger son emploi du temps.

**Il préfère les jeux calmes, est-ce un souci ?** Chaque enfant a ses goûts. Les jeux calmes ont toute leur place ; il s’agit simplement de proposer, chaque jour, des occasions de bouger qui lui plaisent : danse, vélo, cache-cache, balade avec une mission (trouver trois feuilles différentes).

**Comment faire quand il pleut ?** Une danse, un parcours avec des coussins, une chasse au trésor dans l’appartement ou une promenade bien couverte permettent de bouger malgré la météo.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant se fatigue très vite, s’essouffle ou se plaint souvent de douleurs en jouant, s’il tombe beaucoup plus que les enfants de son âge, ou si son développement moteur vous pose question. En cas de doute, n’hésitez pas à demander un avis. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jeux-moteurs-courir-sauter-grimper-3-6-ans',
    title: 'Courir, sauter, grimper, tenir en équilibre : les jeux moteurs des 3–6 ans',
    summary: 'Entre 3 et 6 ans, l’enfant passe du saut à pieds joints à la corde à sauter : des idées de jeux pour accompagner ces progrès, à la maison et dehors.',
    category: 'activites-eveil', tags: ['motricité', 'équilibre', 'sauter', 'grimper', 'corde à sauter', 'marelle', 'parcours', 'maternelle'],
    sources: [S.dev34, S.dev56, S.programme],
    body_md: `## En bref
- Vers 3 ans, beaucoup d’enfants montent et descendent l’escalier en alternant les pieds, sautent à pieds joints et **essaient le cloche-pied**.
- Vers 5–6 ans, beaucoup **sautent à la corde**, enchaînent plusieurs sauts sur un pied et visent avec un ballon.
- Les jeux d’équilibre, de saut et de grimpe sont au cœur de l’activité physique à l’école maternelle.
- Chaque enfant progresse **à son rythme** : une difficulté sur un point ne dit pas tout de son développement.

## Comprendre
Les fiches de mpedia (Association française de pédiatrie ambulatoire) reprises par Santé.fr décrivent bien cette période. Entre 3 et 4 ans, l’enfant devient très autonome dans ses mouvements et prend beaucoup d’initiatives : il veut « faire comme les grands ». Entre 5 et 6 ans, ses gestes sont mieux coordonnés, il connaît sa droite et sa gauche, et il déborde d’énergie. Ces mêmes fiches rappellent que **chaque enfant suit son propre rythme** et qu’un enfant en retard sur un point peut être en avance sur un autre.

Le programme de l’école maternelle organise l’activité physique autour de « se déplacer » et « construire des équilibres ». Ce que l’enfant vit en classe peut se prolonger à la maison, sous forme de jeu.

## Au quotidien
**Jeux de saut**
- La marelle à la craie sur le trottoir ou avec du ruban adhésif au sol.
- Sauter par-dessus une « rivière » (deux cordes posées au sol) que l’on élargit petit à petit.
- Le jeu de la grenouille : sauter de coussin en coussin sans toucher « l’eau ».
- Vers 5–6 ans, la corde à sauter ou l’élastique, d’abord avec un adulte qui fait tourner la corde lentement.

**Jeux d’équilibre**
- Marcher sur une ligne tracée au sol, puis sur un muret bas ou un tronc couché, en tenant la main au début.
- Tenir sur un pied le temps d’une chanson, en changeant de pied.
- Porter un objet léger (une balle sur une cuillère) en marchant.

**Jeux de grimpe et de déplacement**
- Le parcours maison : passer sous la table, enjamber un coussin, ramper sous une chaise, rouler sur un tapis.
- Au square, la structure adaptée à son âge (l’âge est en principe indiqué sur ou près de chaque jeu).
- Imiter les animaux : marcher comme un ours (mains et pieds au sol), sauter comme un lapin, ramper comme un serpent.

**Quelques repères de sécurité**
- Dégagez l’espace : pas de meuble à angle vif, pas d’objet qui traîne au sol.
- Évitez les chaussettes sur un sol glissant : pieds nus ou chaussures.
- Pour la grimpe, restez à proximité sans faire à sa place : l’enfant apprend aussi à mesurer ce dont il est capable.
- Ne laissez pas un enfant grimper près d’une fenêtre ou d’un balcon : aucun meuble ni objet escaladable à proximité.

## Questions fréquentes
**Mon enfant de 5 ans n’arrive pas encore à sauter à cloche-pied, faut-il s’inquiéter ?** Les âges donnés sont des repères moyens et non des examens. Proposez-lui des jeux variés, sans pression. Si plusieurs choses vous interrogent en même temps (équilibre, chutes fréquentes, fatigue), parlez-en à son médecin.

**Il prend des risques sur les jeux, faut-il l’en empêcher ?** Laisser l’enfant essayer ce qui n’est pas dangereux fait partie de son apprentissage. Votre rôle est de choisir un cadre sûr (jeu adapté à l’âge, sol amortissant, pas de hauteur excessive) et de rester présent.

**Comment l’occuper en appartement ?** Un parcours de coussins, une marelle au ruban adhésif, un jeu de « statues musicales » ou une danse permettent de bouger dans peu d’espace.

## Quand demander conseil
Consultez le médecin si votre enfant perd des acquis, chute très souvent, boite, se plaint de douleurs qui reviennent ou semble très gêné dans ses mouvements par rapport aux enfants de son âge. Après une chute avec choc à la tête, somnolence, vomissements ou comportement inhabituel, appelez le **15**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jeux-collectifs-dehors-regles-3-6-ans',
    title: 'Chat, cache-cache, 1-2-3 soleil : les premiers jeux collectifs à règles',
    summary: 'Vers 4–5 ans, l’enfant commence à respecter les règles d’un jeu collectif : comment lui faire découvrir ces jeux et l’aider à attendre son tour ou à perdre.',
    category: 'activites-eveil', tags: ['jeux collectifs', 'règles du jeu', 'cache-cache', '1-2-3 soleil', 'jeu du chat', 'perdre', 'attendre son tour', 'récréation'],
    sources: [S.dev34, S.dev45, S.programme],
    body_md: `## En bref
- Vers 3 ans, **partager et attendre son tour restent difficiles** : l’enfant commence tout juste à jouer avec les autres.
- Vers 4–5 ans, il apprend à **respecter des règles dans un jeu collectif** et à mieux maîtriser ses émotions.
- Les jeux simples (chat, cache-cache, 1-2-3 soleil, ronde) sont idéaux pour découvrir les règles en bougeant.
- Votre rôle : expliquer, jouer avec lui, accepter que les règles soient parfois « arrangées » au début.

## Comprendre
Les fiches mpedia reprises par Santé.fr décrivent une évolution nette. Entre 3 et 4 ans, l’enfant commence à jouer avec d’autres, mais partager ses jouets et attendre son tour lui coûte encore. Entre 4 et 5 ans, il nuance davantage ses émotions, boude moins, et **apprend à respecter des règles dans un jeu collectif**. À l’école, en deuxième année de maternelle, il apprend aussi à mieux connaître ses camarades, à les respecter et à partager.

À l’école maternelle, un des axes de l’activité physique s’intitule justement « coopérer et s’opposer » : jeux de poursuite, jeux d’équipe simples, rondes. Ces jeux aident l’enfant à comprendre qu’une règle s’applique à tout le monde.

## Au quotidien
**Des jeux faciles à lancer**
- **Le chat** : un enfant « chat » touche les autres, qui deviennent chat à leur tour. Variante : le chat perché (on est protégé quand on est en hauteur, sur une marche ou un banc bas).
- **1-2-3 soleil** : on avance quand le meneur a le dos tourné, on s’immobilise quand il se retourne. Excellent pour apprendre à freiner son élan.
- **Cache-cache** : à 3 ans, l’enfant se cache souvent au même endroit ou se montre tout de suite ; c’est le plaisir d’être retrouvé qui compte.
- **Le facteur, les rondes chantées, le béret simplifié** : pour les plus grands, ou avec un adulte qui guide.
- **Les relais** : porter un objet jusqu’à un arbre et revenir le passer au suivant.

**Aider à respecter les règles**
- Expliquez une seule règle à la fois, puis montrez en jouant une première partie « pour de faux ».
- Pour les 3–4 ans, simplifiez : un terrain plus petit, peu de règles, des parties courtes.
- Faites tourner les rôles : chacun est meneur à son tour.
- Nommez les émotions : « Tu es déçu d’avoir été attrapé, je comprends. On rejoue ? »
- Valorisez la manière de jouer plutôt que la victoire : « Tu as bien attendu ton tour. »

**Sécurité**
- Jouez dans un espace dégagé, loin de la route, d’un parking ou d’un point d’eau.
- Pour cache-cache, fixez les limites à l’avance : jamais dans une voiture, un coffre, un placard qui se ferme, ni hors de la zone convenue.

## Questions fréquentes
**Mon enfant triche ou change les règles, que faire ?** À cet âge, l’enfant découvre ce qu’est une règle. Rappelez-la calmement, sans le gronder. Vous pouvez aussi décider ensemble d’une règle « maison » avant de commencer.

**Il pleure à chaque fois qu’il perd.** Perdre s’apprend. Des parties courtes, où l’on rejoue tout de suite, et un adulte qui montre qu’il sait perdre avec le sourire aident beaucoup. Si les colères sont très fréquentes et intenses, parlez-en à son médecin.

**Il ne veut pas jouer avec les autres au square.** Certains enfants observent longtemps avant de se lancer. Proposez-lui de jouer d’abord avec vous, puis d’inviter un autre enfant à vous rejoindre.

**À partir de quel âge peut-on jouer à des jeux d’équipe ?** Les jeux de coopération simples sont possibles très tôt. Les vrais jeux d’équipe, avec des règles plus nombreuses, deviennent plus faciles vers 5–6 ans.

## Quand demander conseil
Parlez-en au médecin, à la PMI ou à l’enseignant si votre enfant semble ne jamais pouvoir jouer avec les autres, s’il est souvent mis à l’écart, ou si ses réactions (colères, retrait) vous inquiètent. ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'velo-trottinette-casque-3-6-ans',
    title: 'Vélo et trottinette entre 3 et 6 ans : apprendre, s’équiper, rouler en sécurité',
    summary: 'Du tricycle au vélo sans roulettes : les étapes habituelles entre 3 et 6 ans, le casque obligatoire à vélo avant 12 ans et les bons réflexes pour rouler en sécurité.',
    category: 'activites-eveil', tags: ['vélo', 'trottinette', 'draisienne', 'petites roues', 'casque obligatoire', 'apprendre le vélo', 'sécurité routière', 'protections'],
    sources: [S.dev45, S.dev56, S.casque],
    body_md: `## En bref
- Vers 4–5 ans, beaucoup d’enfants **pédalent sur un tricycle ou un vélo à petites roues** ; vers 6 ans, beaucoup peuvent **passer au vélo sans roulettes**.
- Depuis le 22 mars 2017, le **casque est obligatoire à vélo pour les enfants de moins de 12 ans**, qu’ils conduisent ou soient passagers.
- L’adulte qui transporte ou accompagne un enfant non casqué s’expose à une amende.
- À trottinette et à vélo, le casque et des protections adaptées sont recommandés, et un adulte reste à côté.

## Comprendre
Les fiches mpedia sur le développement indiquent qu’entre 4 et 5 ans, l’enfant pédale sur un tricycle ou un vélo à petites roues, et qu’à l’approche de 6 ans, débordant d’énergie, il peut passer au vélo sans roulettes. Ce sont des repères, pas des échéances : certains enfants s’y mettent plus tôt, d’autres plus tard, selon leur envie et leurs occasions de pratiquer.

La sécurité routière rappelle que le décret de décembre 2016 a rendu le casque obligatoire pour les moins de 12 ans à vélo, conducteurs comme passagers. Le communiqué souligne aussi l’importance de l’exemple : les parents qui portent un casque sont plus enclins à le faire porter à leurs enfants. Il invite aussi à apprendre dès le plus jeune âge à utiliser des équipements de sécurité adaptés, et cite des études selon lesquelles le casque réduit nettement le risque de blessure grave à la tête.

## Au quotidien
**Choisir et régler l’équipement**
- Un vélo à la bonne taille : assis sur la selle, l’enfant pose les pieds au sol.
- Un casque à sa taille, bien ajusté (il ne bascule ni vers l’avant ni vers l’arrière), sangle attachée ; vérifiez le marquage CE et l’âge ou la taille indiqués.
- Pour la trottinette ou les rollers, des protections (genouillères, coudières) et des chaussures fermées.
- Évitez les écharpes et cordons qui pendent, qui peuvent se prendre dans les roues.

**Apprendre pas à pas**
- Commencez sur un terrain plat, dégagé et sans circulation : cour, parc, allée fermée.
- Pour l’équilibre, beaucoup d’enfants progressent en avançant d’abord en poussant avec les pieds, selle basse, avant de pédaler.
- Tenez l’enfant par l’épaule ou le haut du dos plutôt que par le guidon, pour lui laisser la direction.
- Faites des séances courtes et arrêtez avant la fatigue : la chute vient souvent quand l’enfant est épuisé.
- Félicitez les progrès (« Tu as tenu jusqu’à l’arbre ! ») plutôt que de comparer avec d’autres enfants.

**Rouler en sécurité**
- À cet âge, l’enfant ne perçoit pas encore bien les dangers de la circulation : il roule à côté d’un adulte, sur des voies calmes ou protégées.
- Apprenez-lui à s’arrêter au signal, à ne jamais traverser seul, à descendre du vélo pour traverser.
- Montrez l’exemple : casque pour vous aussi, respect des feux et des passages piétons.

## Questions fréquentes
**Le casque est-il obligatoire à trottinette ?** L’obligation légale décrite par la sécurité routière concerne le vélo pour les moins de 12 ans. Pour la trottinette et les rollers, le casque et les protections restent fortement conseillés.

**Faut-il passer par une draisienne ?** Ce n’est pas indispensable. Ce qui compte, c’est que l’enfant apprenne l’équilibre à son rythme, sur un engin adapté à sa taille.

**Il a peur depuis une chute.** Revenez à une étape plus facile, sur un terrain très sûr, et laissez-le décider quand il veut réessayer. La confiance revient souvent quand l’enfant sent qu’il garde le contrôle.

**Peut-il rouler sur le trottoir ?** Les règles dépendent de l’âge et de la situation ; dans tous les cas, à 3–6 ans, l’enfant reste à portée de main d’un adulte et à l’écart de la circulation.

## Quand demander conseil
Après une chute, appelez le **15** si votre enfant a perdu connaissance, vomit, est somnolent, a un comportement inhabituel, saigne beaucoup ou ne peut plus bouger un membre. Pour une douleur qui persiste après une chute, consultez le médecin. ${URG}

${FIN}`,
  }),
  a({
    slug: 'aire-de-jeux-trampoline-securite-3-6-ans',
    title: 'Aires de jeux, structures gonflables et trampolines : jouer en sécurité entre 3 et 6 ans',
    summary: 'Comment repérer une aire de jeux adaptée à l’âge de votre enfant, quelles règles fixer et quelles précautions prendre avec les trampolines.',
    category: 'securite', tags: ['aire de jeux', 'square', 'toboggan', 'trampoline', 'parc de trampolines', 'structure gonflable', 'chute', 'sécurité'],
    sources: [S.airesJeux, S.trampoline, S.accidents],
    body_md: `## En bref
- Sur une aire collective de jeux, la **tranche d’âge** et les avertissements doivent figurer sur ou près de chaque équipement.
- Les zones où l’enfant peut tomber doivent être recouvertes de **matériaux amortissants** en bon état.
- Dans les parcs de trampolines, des accidents graves ont été signalés : **sauts périlleux, atterrissages sur la tête et rebonds provoqués par un autre sauteur** sont les principaux dangers.
- La surveillance par un adulte reste la meilleure protection.

## Comprendre
La DGCCRF encadre les aires collectives de jeux (écoles, squares municipaux, parcs de loisirs). Parmi les exigences : afficher les coordonnées du gestionnaire à l’entrée, séparer l’aire des dangers voisins (route, parking, plan d’eau), choisir des plantes non toxiques, entretenir les bacs à sable, baliser les zones à risques, contrôler régulièrement la stabilité des équipements et indiquer l’âge visé pour chaque jeu.

Pour les trampolines, une fiche de vigilance des ministères des Sports et de l’Éducation nationale décrit les accidents survenus dans des parcs : traumatismes de la colonne vertébrale après des saltos, blessures aux jambes quand un sauteur en fait rebondir un autre, chutes sur la tête ou le cou. Elle recommande notamment de répartir les enfants selon l’âge, la taille et le poids, de réserver des zones aux plus jeunes et d’interdire les contacts entre sauteurs.

## Au quotidien
**Avant de laisser jouer votre enfant**
- Repérez le panneau d’âge du jeu : un équipement prévu pour les plus grands peut être trop haut ou trop difficile pour un enfant de 3–4 ans.
- Regardez le sol sous les jeux : il doit être amortissant et non dégradé.
- Vérifiez que l’aire est bien séparée de la route ou d’un plan d’eau.
- Repérez ce qui pourrait être cassé, instable ou coupant ; en cas de problème, signalez-le au gestionnaire dont les coordonnées sont affichées.

**Des règles simples à expliquer**
- On descend le toboggan assis, les pieds devant, un par un.
- On ne pousse pas, on attend que le précédent soit parti.
- On reste loin des balançoires qui bougent.
- On retire écharpe, cordon de capuche ou collier avant de jouer, pour éviter qu’ils se coincent.

**Trampolines et structures gonflables**
- Respectez le nombre maximal de sauteurs indiqué par le fabricant ou par le parc, et ne mélangez pas petits et grands : des enfants de même âge et de même gabarit, dans une zone dédiée.
- Pas de salto ni d’acrobatie, pas de chahut, pas de bousculade.
- Ne pas grimper aux filets ni s’asseoir sur les toiles ou bords quand d’autres sautent.
- Un adulte reste à côté pendant toute la séance, et on arrête quand l’enfant fatigue.

**Si vous signalez un problème**
La DGCCRF indique les ressources disponibles : SignalConso (signal.conso.gouv.fr) pour un problème avec un professionnel, et RappelConso (rappel.conso.gouv.fr) pour vérifier les produits rappelés.

## Questions fréquentes
**À partir de quel âge mon enfant peut-il aller seul sur un jeu ?** Il n’y a pas d’âge unique : fiez-vous au panneau d’âge du jeu, aux capacités de votre enfant et restez toujours à proximité entre 3 et 6 ans.

**Le trampoline de jardin est-il adapté à un enfant de 4 ans ?** Il peut être source de plaisir, à condition de respecter les consignes du fabricant (âge, poids, nombre de sauteurs), de l’installer sur un sol dégagé et de surveiller en permanence. Les acrobaties et les sauts à plusieurs sont à éviter.

**Mon enfant veut faire comme les grands sur la grande structure.** Expliquez-lui que ce jeu est prévu pour un autre âge et proposez un défi à sa mesure. L’envie de faire comme les grands est très présente à cet âge.

## Quand demander conseil
Appelez le **15** si, après une chute, votre enfant a perdu connaissance, vomit, est somnolent, se plaint du cou ou du dos, ne peut plus bouger un membre ou a un comportement inhabituel. Ne le déplacez pas s’il se plaint du cou ou du dos. Pour une douleur persistante, consultez le médecin. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ nature et eau
  a({
    slug: 'balade-nature-foret-activites-3-6-ans',
    title: 'Balades en nature avec un enfant de 3 à 6 ans : idées d’activités et précautions',
    summary: 'Chasse aux trésors, observation des petites bêtes, cabane : des idées pour rendre une balade passionnante entre 3 et 6 ans, avec les bons réflexes contre les tiques et les plantes toxiques.',
    category: 'activites-eveil', tags: ['nature', 'forêt', 'balade', 'promenade', 'tiques', 'plantes toxiques', 'cueillette', 'plein air', 'cabane'],
    sources: [S.guideMB, S.tiques, S.plantes],
    body_md: `## En bref
- Les balades à pied font partie des activités de plein air que recommande Santé publique France pour bouger en famille.
- Une balade devient un jeu avec une **mission** : trouver, observer, ramasser, construire.
- Contre les tiques : **vêtements longs et clairs, chaussures fermées, chapeau**, chemins plutôt que hautes herbes, et **inspection de tout le corps au retour**.
- Ne laissez jamais votre enfant goûter une baie, une feuille ou un champignon cueilli : au moindre doute, appelez un **centre antipoison**.

## Comprendre
Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans cite les balades à pied ou à vélo et les jeux de plein air (courir, sauter, lancer, barboter) parmi les moyens simples de bouger. Entre 3 et 6 ans, la nature offre en plus un terrain d’exploration : l’enfant pose mille questions, observe, compare, nomme ce qu’il voit.

Deux précautions reviennent dans les sources officielles. Santé.fr (RecoSanté) détaille la prévention des morsures de tiques, qui peuvent transmettre la bactérie responsable de la maladie de Lyme. L’Anses met en garde contre les confusions entre plantes comestibles et plantes toxiques, et rappelle qu’il ne faut jamais consommer une plante en cas de doute sur son identification.

## Au quotidien
**Des idées pour une balade réussie**
- **La chasse aux trésors** : une liste illustrée à cocher (une plume, une pomme de pin, une feuille rouge, un caillou rond).
- **Le jeu des couleurs** : trouver dans la nature un objet de chaque couleur.
- **Les petites bêtes** : observer une fourmilière, un escargot, une coccinelle, sans les abîmer ; une loupe rend le jeu magique.
- **Écouter** : s’arrêter une minute en silence pour compter les bruits (oiseaux, vent, eau).
- **Construire** : une petite cabane de branches, une « maison de lutins » au pied d’un arbre.
- **Raconter** : au retour, dessiner ce que l’on a vu ou coller ses trouvailles dans un cahier.

**Adapter la sortie à son âge**
- Prévoyez une distance raisonnable et des pauses, avec de l’eau et un goûter.
- Laissez-le marcher à son rythme et choisir parfois le chemin.
- Fixez des règles claires : on reste en vue de l’adulte, on s’arrête aux croisements, on ne s’approche pas de l’eau seul.

**Tiques : les bons réflexes (Santé.fr)**
- Vêtements longs couvrant bras et jambes, de couleur claire, bas du pantalon dans les chaussettes, chaussures fermées, chapeau couvrant la tête et le cou.
- Restez sur les sentiers, évitez broussailles, hautes herbes et fougères, et posez un tissu clair pour pique-niquer.
- Au retour, examinez tout le corps, notamment les aisselles, les plis des genoux, le nombril, les organes génitaux, derrière les oreilles, le cou et le cuir chevelu ; recommencez le lendemain.
- Si vous trouvez une tique, retirez-la sans attendre avec un tire-tique (vendu en pharmacie), sans appliquer de produit avant, puis désinfectez.

**Plantes et baies (Anses)**
- Apprenez à votre enfant qu’on regarde, on sent, on touche avec précaution, mais **on ne met rien à la bouche**.
- Ne cueillez pas « par brassées » et, en cas de doute sur une plante, ne la consommez pas.

## Questions fréquentes
**Mon enfant se plaint vite d’être fatigué en balade.** Raccourcissez le parcours, ajoutez un but (une cabane, un pont, un ruisseau) et des jeux en chemin. Le plaisir compte plus que la distance.

**Faut-il mettre un répulsif contre les tiques ?** Santé.fr évoque éventuellement un répulsif cutané sur les zones découvertes. Demandez conseil au pharmacien ou au médecin pour un produit adapté à l’âge de votre enfant.

**Mon enfant a mangé une baie inconnue.** Contactez sans attendre un centre antipoison, même sans symptôme, en gardant si possible un morceau de la plante ou une photo.

## Quand demander conseil
Après une morsure de tique, demandez conseil au médecin ou au pharmacien, notamment si la tête de la tique reste dans la peau ou si une rougeur apparaît autour de la morsure dans les jours ou semaines suivants. En cas d’ingestion d’une plante, appelez un centre antipoison ; appelez le **15** en cas de malaise, de difficulté à respirer ou de somnolence. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jardiner-potager-avec-enfant-3-6-ans',
    title: 'Jardiner avec son enfant : un potager, même sur un balcon',
    summary: 'Semer, arroser, récolter : le jardinage plaît beaucoup aux 3–6 ans et peut leur donner envie de goûter ce qu’ils ont fait pousser. Idées pratiques et précautions.',
    category: 'activites-eveil', tags: ['jardinage', 'potager', 'balcon', 'semis', 'plantes aromatiques', 'tomates cerises', 'goûter les légumes', 'plantes toxiques'],
    sources: [S.guideMB, S.gouts, S.plantes],
    body_md: `## En bref
- Santé publique France suggère de faire pousser du **basilic en pot ou des tomates cerises en jardinière**, ou de créer un petit potager en famille si vous avez un jardin.
- Les enfants acceptent plus volontiers de **goûter un légume qu’ils ont choisi, cueilli ou cuisiné**.
- Jardiner, c’est aussi bouger : porter l’arrosoir, creuser, ratisser.
- Précautions : vérifier ce que l’on plante, se laver les mains, et ne rien manger sans l’accord d’un adulte.

## Comprendre
Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans encourage à initier les enfants au jardinage et au bricolage, qui comptent aussi dans l’activité physique du quotidien. Il souligne qu’un enfant goûte plus facilement un légume qu’il a vu pousser ou qu’il a récolté. Santé.fr (Manger Bouger) rappelle par ailleurs que les goûts se forment par l’expérience et qu’il peut falloir proposer un aliment une dizaine de fois, sans forcer, avant qu’il soit accepté.

Côté sécurité, l’Anses conseille, au potager, de vérifier à quoi ressemblera la plante (photo sur le sachet de graines, livres), de se méfier des plantules qui poussent là où l’on a semé mais qui ne viennent pas forcément du semis, et de rester attentif d’une année sur l’autre.

## Au quotidien
**Sur un balcon ou un rebord de fenêtre**
- Un pot de basilic, de persil ou de ciboulette : l’enfant arrose, sent les feuilles, en ajoute dans l’assiette.
- Une jardinière de tomates cerises ou de radis, qui poussent assez vite pour garder l’attention.
- Une graine de haricot dans un pot transparent ou sur du coton humide : on voit les racines sortir.

**Dans un jardin**
- Un petit carré rien qu’à lui, délimité avec des bâtons, où il choisit ce qu’il sème.
- Des tâches à sa mesure : creuser un trou, tasser la terre, arroser avec un petit arrosoir, ramasser les feuilles, chercher les vers de terre.
- Un calendrier dessiné pour suivre la croissance : « On a semé », « Ça sort ! », « On récolte ».

**Faire le lien avec l’assiette**
- Cueillez ensemble et préparez un plat simple : radis croquants, tomates en salade, herbes sur une omelette.
- Laissez-le goûter sans obligation de finir : le fait d’avoir cultivé suffit souvent à donner envie d’essayer.

**Précautions**
- Lavez les mains après le jardinage, et lavez les légumes avant de les manger.
- Gardez les outils pointus ou tranchants pour les adultes ; proposez des outils adaptés à sa taille.
- Rangez engrais, produits de traitement et anti-limaces hors de portée, dans leur emballage d’origine.
- Apprenez-lui à ne rien mettre à la bouche sans demander : certaines plantes ornementales ou sauvages sont toxiques, et l’Anses rappelle qu’en cas de doute il ne faut pas consommer.
- Au soleil, chapeau, ombre aux heures chaudes et eau à volonté.

## Questions fréquentes
**Mon enfant se lasse vite, que planter ?** Choisissez des plantes à pousse rapide (radis, cresson, haricots) et donnez-lui une tâche précise à chaque visite.

**Il ne mange aucun légume, est-ce que ça vaut la peine ?** Le jardinage ne garantit rien, mais il crée une occasion positive de découvrir les légumes, sans pression. Proposer régulièrement, sans forcer, reste la clé.

**Peut-il manger directement au jardin ?** Mieux vaut rincer d’abord ce que l’on cueille et toujours vérifier qu’il s’agit bien de la plante semée.

**Et sans balcon ?** Des jardins partagés ou des fermes pédagogiques existent dans de nombreuses communes ; le guide Manger-Bouger suggère aussi de visiter une ferme ou un producteur pendant les vacances.

## Quand demander conseil
Si votre enfant a avalé une plante, une baie ou un produit de jardin, contactez sans attendre un centre antipoison, même sans symptôme. Appelez le **15** en cas de malaise, de difficulté à respirer, de somnolence ou de convulsions. Pour une coupure profonde ou une piqûre qui gonfle beaucoup, consultez. ${URG}

${FIN}`,
  }),
  a({
    slug: 'aisance-aquatique-piscine-3-6-ans',
    title: 'Aisance aquatique : familiariser son enfant de 3 à 6 ans avec l’eau',
    summary: 'L’aisance aquatique peut commencer dès 3 ans et s’organise en groupe à partir de 4 ans : ce que l’enfant y apprend, comment l’accompagner à la piscine et pourquoi la surveillance reste indispensable.',
    category: 'activites-eveil', tags: ['aisance aquatique', 'piscine', 'apprendre à nager', 'classes bleues', 'stages bleus', 'noyade', 'surveillance baignade', 'brassards'],
    sources: [S.aisance, S.cafNage, S.noyade],
    body_md: `## En bref
- L’**aisance aquatique** est un apprentissage pour non-nageurs, différent de l’apprentissage des nages : on apprend à entrer dans l’eau, s’immerger, flotter et regagner le bord.
- Selon le ministère des Sports, elle **peut commencer dès 3 ans** et s’organise en collectivité **à partir de 4 ans**.
- Pour les 4–6 ans, des **« classes bleues »** (temps scolaire) et des **« stages bleus »** (hors temps scolaire) proposent des séances rapprochées sur une ou deux semaines.
- Savoir être à l’aise dans l’eau **ne remplace jamais la surveillance** : un adulte désigné, à portée de regard, en permanence.

## Comprendre
Le ministère chargé des Sports présente l’aisance aquatique comme une première étape, qui se pratique dans un bassin où l’enfant n’a pas pied, sans matériel de flottaison. L’objectif est une expérience positive de l’eau : entrer et sortir seul, mettre la tête sous l’eau, flotter de différentes façons, se déplacer jusqu’au bord. La page décrit des paliers progressifs, jusqu’à parcourir 10 mètres et flotter sur le dos. Les séances des classes et stages bleus durent en général 40 à 45 minutes, une ou deux fois par jour.

La Caf souligne qu’une grande part des noyades accidentelles concerne des enfants de moins de 6 ans. Santé.fr rappelle les étapes possibles de la familiarisation : bébés nageurs jusqu’à 3 ans, aisance aquatique de 4 à 6 ans, puis apprentissage de la nage à partir de 6 ans.

## Au quotidien
**Trouver une séance**
- Renseignez-vous auprès de l’école, de la mairie, de la piscine municipale ou des clubs : certains proposent des stages bleus pendant les vacances.
- Le ministère met aussi à disposition des vidéos pour réaliser avec l’enfant, étape par étape, des gestes simples en piscine.

**À la piscine avec vous**
- Allez-y progressivement : jouer sur les marches, s’asperger, souffler dans l’eau pour faire des bulles.
- Proposez des jeux : ramasser un objet au fond là où il a pied, faire « l’étoile » sur le ventre puis sur le dos en le soutenant, sauter dans vos bras.
- Laissez-le aller à son rythme ; un enfant qui a peur progresse mieux si on ne le force pas.
- Restez dans l’eau avec lui et à portée de bras.

**Les règles de sécurité qui ne changent pas**
- Un adulte responsable de la surveillance, et un seul, pour chaque enfant pendant la baignade, comme le recommande Santé.fr.
- Une surveillance active et permanente, y compris en dehors des moments de baignade : des enfants échappent parfois à la vigilance au bord de l’eau.
- Si votre enfant porte un équipement de flottaison, préférez des **brassards** aux bouées, et gardez-le à portée de bras : ce matériel ne remplace pas la surveillance.
- Pour une piscine privée, les dispositifs de sécurité doivent être activés et ne remplacent jamais la présence d’un adulte.

## Questions fréquentes
**Mon enfant sait faire quelques mouvements, est-il en sécurité ?** Non : même un enfant à l’aise peut se noyer en quelques instants et sans bruit. La surveillance reste indispensable.

**Il refuse de mettre la tête sous l’eau.** Commencez par le visage mouillé avec les mains, les bulles, un jeu de cache-cache derrière les mains. Ne forcez pas ; l’aisance vient avec des expériences agréables répétées.

**Est-ce payant ?** La Caf indique que le dispositif d’aisance aquatique pour les 4–6 ans est gratuit ; les modalités dépendent des communes et des structures qui l’organisent.

**Faut-il attendre l’école pour apprendre à nager ?** L’apprentissage des nages commence en général vers 6 ans, mais l’aisance aquatique peut le précéder dès 3–4 ans.

## Quand demander conseil
Si votre enfant a bu la tasse et tousse longtemps, respire difficilement, est très fatigué ou a un comportement inhabituel dans les heures qui suivent, appelez le **15**. En cas de noyade, sortez l’enfant de l’eau, appelez immédiatement le **15** ou le **112** et suivez les consignes. Parlez au médecin d’une peur de l’eau très forte qui l’empêche de profiter des activités.

${FIN}`,
  }),
  // ------------------------------------------------------------------ livres et jeux
  a({
    slug: 'lire-des-histoires-enfant-3-6-ans',
    title: 'Lire des histoires à un enfant de 3 à 6 ans : pourquoi et comment',
    summary: 'Entre 3 et 6 ans, l’enfant adore qu’on lui lise des histoires : comment choisir les livres, faire de la lecture un moment de partage et l’aider à entrer dans le langage.',
    category: 'activites-eveil', tags: ['lecture', 'livres', 'histoire du soir', 'albums', 'langage', 'vocabulaire', 'imaginaire', 'maternelle'],
    sources: [S.dev45, S.programme, S.rituel],
    body_md: `## En bref
- Entre 4 et 5 ans, l’enfant **aime qu’on lui lise ou raconte des histoires**, ce qui nourrit son imaginaire.
- Lire ensemble enrichit le vocabulaire, qui se construit beaucoup pendant les années de maternelle.
- À l’école maternelle, l’enseignant lit **au moins une histoire ou un texte documentaire par jour**, et des temps de lecture « pour le plaisir » sont prévus.
- À la maison, l’histoire du soir peut faire partie du **rituel du coucher**, sans trop le prolonger.

## Comprendre
Les fiches mpedia reprises par Santé.fr encouragent les parents à lire des histoires à leur enfant ou à en inventer, à lui expliquer les mots qu’il ne comprend pas et à lui poser des **questions ouvertes** (qui n’appellent pas seulement un « oui » ou un « non »). Entre 4 et 5 ans, l’enfant raconte de petites histoires, enrichit beaucoup son vocabulaire, invente parfois des mots et peut tenir une vraie conversation.

Le programme de l’école maternelle place le langage oral et écrit au centre des apprentissages : le vocabulaire y est enseigné de façon explicite (avec un repère d’au moins 2 500 mots en fin de grande section), et la lecture quotidienne d’histoires sert à la fois la compréhension et le plaisir de lire. Ce que vous faites à la maison prolonge naturellement ce travail.

## Au quotidien
**Choisir les livres**
- Variez les genres : albums illustrés, contes, documentaires sur les animaux ou les métiers, livres de comptines, imagiers pour les plus jeunes.
- Laissez-le choisir, même si c’est le même livre pour la dixième fois : la répétition rassure et l’aide à mémoriser.
- Proposez de temps en temps une histoire un peu plus longue, lue en plusieurs soirs.

**Lire ensemble**
- Installez-vous confortablement, l’enfant à côté de vous pour voir les images.
- Lisez avec expression, changez de voix pour les personnages, ménagez le suspense avant de tourner la page.
- Arrêtez-vous pour parler : « À ton avis, que va faire le loup ? », « Pourquoi il est triste ? »
- Expliquez les mots nouveaux avec des gestes ou des exemples de sa vie.
- Inventez des histoires à partir de son quotidien ou laissez-le raconter à son tour en s’aidant des images.

**Le livre au coucher**
- Le rituel du coucher décrit par mpedia (bain, pyjama, histoire, câlin) aide l’enfant à s’apaiser.
- Fixez à l’avance le nombre d’histoires pour éviter les négociations, et gardez un moment court.
- Préférez des histoires calmes le soir, et gardez les livres « qui font peur » pour la journée.

**Les livres au fil de la journée**
- Un coin lecture accessible, avec quelques livres à sa hauteur, renouvelés régulièrement.
- Des livres dans le sac pour les salles d’attente ou les trajets.
- La bibliothèque ou la médiathèque de quartier pour varier sans acheter.

## Questions fréquentes
**Mon enfant ne tient pas en place pendant la lecture.** Choisissez des livres courts, avec beaucoup d’images ou des éléments à chercher. Laissez-le bouger, tourner les pages ou mimer. Quelques minutes de plaisir valent mieux qu’une longue lecture subie.

**Faut-il lui apprendre à lire avant le CP ?** L’école maternelle prépare progressivement à l’écrit (sons, lettres, geste d’écriture). À la maison, le plus utile reste de partager le plaisir des histoires et de parler avec lui.

**Il veut toujours la même histoire.** C’est très fréquent à cet âge : connaître la suite lui procure du plaisir et de la sécurité. Vous pouvez proposer d’alterner « son » livre avec un nouveau.

**Les livres audio ou les histoires sur écran, c’est pareil ?** Une histoire écoutée peut avoir sa place, mais rien ne remplace l’échange avec un adulte. Entre 3 et 6 ans, les repères officiels recommandent un usage des écrans exceptionnel et accompagné.

## Quand demander conseil
Parlez-en au médecin, à la PMI ou à l’enseignant si votre enfant semble avoir du mal à comprendre ce qu’on lui dit, parle très peu ou de façon difficile à comprendre pour son âge, ou s’il ne réagit pas quand on l’appelle (un contrôle de l’audition peut être utile). En cas de doute, n’hésitez pas à consulter votre pédiatre.

${FIN}`,
  }),
  a({
    slug: 'bibliotheque-ludotheque-sorties-gratuites-3-6-ans',
    title: 'Bibliothèque, ludothèque, maison de quartier : des lieux pour jouer et découvrir',
    summary: 'Médiathèques, ludothèques et lieux de quartier proposent souvent des livres, des jeux et des animations pour les 3–6 ans : comment en profiter.',
    category: 'activites-eveil', tags: ['bibliothèque', 'médiathèque', 'ludothèque', 'maison de quartier', 'centre social', 'sorties gratuites', 'heure du conte', 'jeux'],
    sources: [S.guideEcrans, S.culture, S.jeuLot],
    body_md: `## En bref
- Médiathèques, ludothèques et maisons de quartier proposent souvent des **activités gratuites ou peu coûteuses** pour les familles.
- Les bibliothèques organisent fréquemment des **activités en famille** autour du livre (lectures, heures du conte).
- La ludothèque permet de **découvrir et d’emprunter des jeux** adaptés à l’âge, sans acheter.
- Ces lieux sont aussi l’occasion de rencontrer d’autres parents et d’autres enfants.

## Comprendre
Le guide « Bien grandir dans un monde d’écrans », réalisé par la Ville de Saint-Denis et diffusé par la MILDECA, cite les maisons de quartier, les ludothèques et les médiathèques comme des lieux proposant des activités gratuites, utiles pour offrir des alternatives aux écrans. Le ministère chargé des Solidarités, dans le cadre des 1000 premiers jours, rappelle que les bibliothèques et les lieux d’accueil proposent des activités en famille, et que certains théâtres et musées ont des espaces dédiés aux jeunes enfants.

Le document de la PMI du Lot sur le jeu souligne qu’entre 3 et 6 ans, l’enfant aime les jeux symboliques, les jeux de construction et les premiers jeux à règles : la ludothèque permet de varier les plaisirs au fil de ses envies.

## Au quotidien
**À la médiathèque**
- Inscrivez votre enfant (les conditions d’inscription et d’emprunt varient selon les communes ; renseignez-vous à l’accueil ou sur le site de votre ville).
- Laissez-le choisir quelques livres lui-même, puis ajoutez-en un ou deux de votre choix.
- Repérez les animations : lectures d’histoires, ateliers, spectacles, expositions.
- Faites-en une sortie régulière, par exemple un mercredi sur deux : le rituel donne envie d’y retourner.

**À la ludothèque**
- Jouez sur place avec lui : c’est l’occasion de découvrir un jeu avant de l’emprunter.
- Demandez conseil aux ludothécaires pour des jeux adaptés à son âge et à ses goûts.
- Empruntez un jeu de société simple, un jeu de construction ou des déguisements, et rapportez-le pour en tester un autre.

**Dans les maisons de quartier et centres sociaux**
- Beaucoup proposent des ateliers parents-enfants (peinture, cuisine, musique), des sorties familiales ou des fêtes de quartier.
- Les programmes sont souvent affichés sur place ou publiés par la mairie.

**Bien vivre la sortie**
- Choisissez un moment où votre enfant n’est ni fatigué ni affamé.
- Expliquez les règles du lieu (on parle doucement, on range le jeu, on prend soin des livres).
- Préparez un sac solide pour transporter les livres et notez la date de retour.

## Questions fréquentes
**Mon enfant abîme les livres, puis-je quand même emprunter ?** Expliquez-lui comment on tourne les pages, gardez les livres empruntés dans un endroit à part et lisez-les avec lui au début. En cas d’accident, informez la bibliothèque : chaque lieu a ses règles.

**Les jeux de ludothèque sont-ils sûrs ?** Vérifiez comme pour un achat que le jeu correspond à l’âge de votre enfant et qu’il est complet et en bon état ; signalez une pièce cassée ou manquante.

**Il n’y a rien près de chez moi.** Renseignez-vous auprès de la mairie, de la PMI ou de la Caf : des bibliobus, des ludothèques itinérantes ou des animations ponctuelles existent dans certains territoires.

## Quand demander conseil
Si vous vous sentez isolé·e avec votre enfant, ces lieux et la PMI peuvent aussi être des points d’appui : n’hésitez pas à parler de vos difficultés aux professionnels. ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'jeux-de-societe-enfant-3-6-ans',
    title: 'Premiers jeux de société entre 3 et 6 ans : choisir, expliquer, apprendre à perdre',
    summary: 'Loto, dominos, jeux de mémoire, petits jeux de parcours : comment choisir un jeu de société adapté à 3–6 ans et en faire un moment agréable pour tout le monde.',
    category: 'activites-eveil', tags: ['jeux de société', 'loto', 'dominos', 'memory', 'jeu de l’oie', 'règles', 'perdre', 'jeux en famille', 'jeux coopératifs'],
    sources: [S.jeuLot, S.dev45, S.jouets],
    body_md: `## En bref
- Vers 3–4 ans, le loto, les dominos et les petits personnages font partie des jeux appréciés ; vers 5–6 ans, l’enfant peut **participer à des jeux à règles**, collectifs ou de société.
- Un bon jeu à cet âge a **peu de règles**, des parties **courtes** et un matériel solide.
- Vérifiez l’**âge indiqué** et le **marquage CE** : beaucoup de jeux contiennent de petites pièces dangereuses pour les plus jeunes de la fratrie.
- Perdre, attendre son tour, respecter la règle : tout cela s’apprend en jouant, avec votre aide.

## Comprendre
Le document de la PMI du Lot sur le jeu cite, pour les 3–4 ans, le loto, les dominos, les petits personnages et les jeux de construction, et pour les plus grands les jeux à règles. La fiche mpedia « De 4 à 5 ans » décrit la même évolution : à cet âge, l’enfant commence à nuancer et contrôler ses émotions, ses colères sont moins violentes et il apprend à respecter les règles d’un jeu collectif. Le même document de la PMI rappelle que le meilleur jouet est celui qui procure un plaisir renouvelé et correspond à l’âge et aux intérêts de l’enfant.

Jouer à un jeu de société fait travailler beaucoup de choses à la fois : compter les cases, reconnaître les couleurs et les formes, mémoriser, patienter, gérer la déception.

## Au quotidien
**Bien choisir**
- **Jeux de reconnaissance** : loto des animaux, imagiers à associer, jeux de couleurs.
- **Jeux de mémoire** : retrouver les paires de cartes face cachée, en commençant avec peu de paires.
- **Dominos** à images puis à points.
- **Petits jeux de parcours** avec un dé : on compte les cases, on avance son pion.
- **Jeux coopératifs**, où tous les joueurs gagnent ou perdent ensemble : idéaux pour les enfants qui supportent mal de perdre.

**Avant d’acheter**
- Lisez l’âge indiqué sur la boîte et les avertissements : la mention « Ne convient pas aux enfants de moins de 36 mois » signale souvent de petites pièces.
- Vérifiez le marquage CE et, avant l’achat, la rubrique jouets de RappelConso.
- Si un plus jeune vit à la maison, rangez les jeux à petites pièces en hauteur après la partie.

**Pendant la partie**
- Expliquez les règles en jouant un premier tour « pour essayer ».
- Simplifiez si besoin : moins de cartes, un plateau plus court, une règle en moins.
- Laissez l’enfant manipuler (lancer le dé, avancer son pion, compter à voix haute).
- Arrêtez avant la lassitude ; mieux vaut une partie courte réussie qu’une longue partie qui finit en larmes.

**Apprendre à perdre et à gagner**
- Ne le laissez pas gagner à chaque fois, mais adaptez la difficulté pour qu’il ait de vraies chances.
- Montrez l’exemple : « J’ai perdu, dommage ! On fait la revanche ? »
- Félicitez la façon de jouer (patience, honnêteté) plutôt que la victoire seule.
- Accueillez sa déception sans la minimiser : « Tu aurais aimé gagner, c’est frustrant. »

## Questions fréquentes
**Mon enfant triche, est-ce grave ?** Entre 3 et 5 ans, l’enfant découvre ce qu’est une règle et teste ses limites. Rappelez-la calmement ; vers 5–6 ans, la règle devient plus facile à accepter.

**À quel âge commencer ?** Des jeux très simples (loto, paires) se partagent dès 3 ans. Les jeux avec stratégie viendront plus tard.

**Il fait une crise dès qu’il perd.** Passez par des jeux coopératifs quelque temps, raccourcissez les parties et anticipez : « Parfois on gagne, parfois on perd, on verra ! »

**Peut-on y jouer avec un plus petit ?** Oui en adaptant : le petit peut lancer le dé ou piocher, tandis que le grand compte. Attention aux petites pièces pour les moins de 3 ans.

## Quand demander conseil
Si un enfant a avalé une petite pièce et tousse, s’étouffe ou respire difficilement, appelez le **15**. En cas de suspicion d’ingestion d’une pile bouton ou d’aimants, appelez immédiatement le **15** ou un centre antipoison, même sans symptôme. Si les colères sont très fréquentes et vous épuisent, parlez-en au médecin. ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'jeux-de-construction-puzzles-3-6-ans',
    title: 'Cubes, briques, puzzles : les jeux de construction entre 3 et 6 ans',
    summary: 'Empiler, assembler, encastrer : les jeux de construction et les puzzles accompagnent l’enfant dans la découverte des formes, de l’espace et de la patience.',
    category: 'activites-eveil', tags: ['jeux de construction', 'cubes', 'briques', 'puzzles', 'formes', 'motricité fine', 'jouer seul', 'petites pièces'],
    sources: [S.jeuLot, S.programme, S.jouets],
    body_md: `## En bref
- Vers 3–4 ans, les **briques et jeux de construction** font partie des jeux que la PMI cite pour cet âge, où l’attention se développe.
- Entre 3 et 6 ans, briques, jeux de construction, puzzles et bricolage font partie des jeux conseillés par la PMI.
- Ces jeux font découvrir les **formes, les tailles, l’équilibre et l’espace**, que l’école maternelle explore aussi.
- Choisissez des jeux adaptés à l’âge, surtout si un enfant de moins de 3 ans vit à la maison.

## Comprendre
Le document de la PMI du Lot sur le jeu décrit, vers 3–4 ans, une autonomie croissante et une attention qui se développe, avec des jeux comme les briques, les jeux de construction et les découpages. Il place les briques, les jeux de construction et le bricolage parmi les jeux des 3–6 ans. Le programme de l’école maternelle prévoit, dans les premiers outils mathématiques, d’**explorer les solides et les formes planes** et de se familiariser avec des **motifs organisés** : construire une tour, reproduire un modèle ou faire un puzzle en sont des prolongements très concrets.

Ces jeux ont un autre atout : beaucoup d’enfants peuvent s’y plonger seuls, un long moment, ce qui développe la concentration et l’autonomie.

## Au quotidien
**Des idées selon l’âge**
- **Vers 3 ans** : gros cubes en bois ou en mousse, grosses briques à emboîter, puzzles à encastrer ou de quelques grosses pièces.
- **Vers 4–5 ans** : briques plus petites, planchettes en bois, circuits à assembler, puzzles plus nombreux en pièces.
- **Vers 5–6 ans** : reproduire un modèle simple, construire une maison pour ses figurines, puzzles plus complexes, bricolage avec des matériaux de récupération.

**Jouer avec lui**
- Construisez à côté de lui sans prendre la main : « Moi je fais une tour, tu fais quoi ? »
- Mettez des mots sur ce qu’il fait : haut, bas, devant, derrière, à côté, plus grand, plus petit.
- Proposez des défis : la tour la plus haute avant qu’elle tombe, un pont pour faire passer la petite voiture, une maison avec une porte.
- Pour un puzzle, aidez-le à trier : d’abord les bords, puis les couleurs.

**Organiser le rangement**
- Une caisse ou un bac par type de jeu, avec une photo dessus pour qu’il range seul.
- Un tapis de jeu où les constructions peuvent rester quelques jours : démonter trop vite peut le frustrer.

**Sécurité**
- Respectez l’âge indiqué : la mention « Ne convient pas aux enfants de moins de 36 mois » signale un risque lié aux petites pièces.
- Ne laissez pas traîner les petites briques si un bébé ou un enfant de moins de 3 ans circule dans la pièce.
- Les coffrets contenant de petits aimants portent un avertissement « Ne convient pas aux enfants de moins de 8 ans » : à éviter à cet âge.
- Vérifiez le marquage CE et l’état des jeux d’occasion (pièces cassées, échardes).

## Questions fréquentes
**Mon enfant démolit tout au lieu de construire.** Faire tomber une tour fait partie du plaisir et permet de comprendre l’équilibre. Proposez-lui de construire « pour faire tomber », puis de reconstruire.

**Il s’énerve quand ça ne tient pas.** Accompagnez-le : « Les grosses pièces en bas, c’est plus solide. » Félicitez l’effort et proposez une pause si la frustration monte.

**Faut-il des jeux avec modèle ou des jeux libres ?** Les deux sont intéressants : le modèle entraîne l’observation, la construction libre nourrit l’imagination. Alternez selon ses envies.

**Les jeux de construction sur tablette remplacent-ils les vrais ?** Non : manipuler de vrais objets fait travailler les mains, l’équilibre et l’espace. Entre 3 et 6 ans, l’écran reste exceptionnel et accompagné.

## Quand demander conseil
Si votre enfant a avalé une petite pièce et tousse, s’étouffe ou respire mal, appelez le **15**. Si vous pensez qu’il a avalé un aimant ou une pile bouton, appelez immédiatement le **15** ou un centre antipoison, même s’il ne présente aucun signe. Parlez au médecin si votre enfant semble très maladroit de ses mains par rapport aux enfants de son âge. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ imaginaire et arts
  a({
    slug: 'faire-semblant-deguisements-3-6-ans',
    title: 'Faire semblant, se déguiser, jouer des rôles : l’imaginaire des 3–6 ans',
    summary: 'Marchande, docteur, super-héros : entre 3 et 6 ans, le jeu de faire-semblant prend une grande place. Pourquoi il compte, comment le nourrir et quels déguisements choisir.',
    category: 'activites-eveil', tags: ['faire semblant', 'jeu symbolique', 'déguisements', 'imaginaire', 'jeu de rôle', 'marchande', 'poupée', 'jouer seul'],
    sources: [S.jeuLot, S.dev45, S.dgccrfJouets],
    body_md: `## En bref
- Entre 3 et 6 ans, les **jeux symboliques** (faire semblant, jouer des rôles avec panoplies et déguisements) occupent une grande place.
- Entre 4 et 5 ans, l’enfant **se crée un monde qui lui est propre**, aime faire semblant et peut jouer seul.
- Ces jeux l’aident à explorer des situations nouvelles, à exprimer ses émotions et à enrichir son langage.
- Pour les déguisements, la DGCCRF conseille de surveiller l’**inflammabilité** et la **longueur des cordons**.

## Comprendre
La fiche mpedia « De 4 à 5 ans » décrit un enfant qui se construit un univers sans les barrières de la réalité, où il peut expérimenter face à des situations qu’il ne connaît pas. Il aime qu’on nourrisse cet imaginaire par des histoires et des discussions. Le document de la PMI du Lot range le faire-semblant et les jeux de rôles parmi les jeux phares des 3–6 ans, aux côtés des jeux de construction et des premiers jeux à règles.

Jouer au docteur avant un rendez-vous, à l’école avant la rentrée, ou à la maman avec sa poupée après l’arrivée d’un petit frère : le jeu permet souvent à l’enfant de « digérer » ce qu’il vit.

## Au quotidien
**Un coffre à déguisements simple**
- De vieux vêtements d’adulte, foulards, chapeaux, sacs, bijoux en plastique sans petites pièces.
- Des tissus de différentes tailles qui deviennent cape, robe, toit de cabane ou rivière.
- Quelques accessoires : téléphone éteint, trousseau de clés factice, caisse enregistreuse en carton.

**Des idées de jeux**
- **La marchande** : des boîtes vides, des fruits en tissu ou de vrais fruits, des pièces en carton. On compte, on rend la monnaie « pour de faux ».
- **Le restaurant** : un menu dessiné, une nappe, une commande prise par le serveur.
- **Le docteur ou le vétérinaire** pour les peluches : utile pour dédramatiser une consultation.
- **La cabane** : un drap sur deux chaises devient un château, une grotte ou une fusée.
- **Les marionnettes** : une chaussette, deux boutons dessinés au feutre, et un spectacle derrière le canapé.

**Votre place dans le jeu**
- Entrez dans le jeu quand il vous invite, en suivant son scénario plutôt que d’imposer le vôtre.
- Posez des questions ouvertes : « Et ensuite, que se passe-t-il ? », « Comment s’appelle ton personnage ? »
- Laissez-le aussi jouer seul : c’est un signe d’autonomie, pas d’ennui.
- Observez : le jeu révèle parfois une inquiétude dont il peut être utile de parler.

**Déguisements : les précautions (DGCCRF)**
- Tenez les déguisements loin des bougies, des barbecues, des cheminées et de toute flamme.
- Évitez les cordons longs autour du cou et les éléments qui pendent et peuvent s’accrocher.
- Vérifiez le marquage CE, l’âge indiqué et l’absence de petites pièces détachables pour les plus jeunes.
- Préférez un maquillage prévu pour les enfants et testez-le sur une petite zone ; démaquillez avant le coucher.

## Questions fréquentes
**Mon fils veut se déguiser en princesse, ma fille en pompier.** À cet âge, le déguisement est une exploration de rôles. Laissez-le choisir librement : c’est de l’imaginaire, pas une déclaration.

**Il a un ami imaginaire, faut-il s’inquiéter ?** L’imaginaire est très riche entre 3 et 6 ans, et un compagnon imaginaire peut en faire partie. Parlez-en au médecin seulement si cela s’accompagne d’autres signes qui vous préoccupent (repli, angoisses importantes).

**Il rejoue des scènes de dispute ou de violence.** Le jeu sert parfois à exprimer ce qui l’a marqué. Restez disponible, mettez des mots sur ce qu’il montre, et parlez-en à un professionnel si ces scènes sont très fréquentes ou s’il semble angoissé.

**Mon enfant mélange le vrai et le faux.** Entre 3 et 6 ans, la frontière est encore mouvante. Vous pouvez l’aider en disant « Pour de vrai ou pour de faux ? ».

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant ne joue jamais à faire semblant, semble très isolé, ou si ses jeux révèlent une peur ou une souffrance persistantes. Si vous pensez qu’un enfant est en danger, appelez le **119**. En cas de brûlure par un déguisement qui a pris feu, refroidissez à l’eau tempérée et appelez le **15**.

${FIN}`,
  }),
  a({
    slug: 'dessin-coloriage-enfant-3-6-ans',
    title: 'Dessin et coloriage entre 3 et 6 ans : du bonhomme têtard au bonhomme habillé',
    summary: 'Le dessin évolue beaucoup entre 3 et 6 ans : comment l’encourager, quel matériel proposer et comment réagir à ses dessins sans les juger.',
    category: 'activites-eveil', tags: ['dessin', 'coloriage', 'bonhomme têtard', 'crayons', 'feutres', 'tenue du crayon', 'graphisme', 'maternelle'],
    sources: [S.dev34, S.dev45, S.dev56],
    body_md: `## En bref
- Vers 3 ans, l’enfant tient son crayon de mieux en mieux et dessine souvent un **« bonhomme têtard »**, sans tronc.
- Vers 4–5 ans, il trace des **ronds, des carrés et des croix**, dessine un bonhomme avec un tronc et des membres, et ses coloriages dépassent moins.
- Vers 5–6 ans, ses bonshommes ont des **doigts, des pieds, des cheveux, des vêtements**, et sa créativité s’affirme.
- Le dessin libre compte autant que le coloriage : il permet à l’enfant d’inventer et de raconter.

## Comprendre
Les fiches mpedia sur le développement décrivent une progression que beaucoup de parents reconnaissent. Entre 3 et 4 ans, l’enfant explore les représentations graphiques avec divers matériaux (crayon, peinture, gommettes) et son bonhomme n’a pas toujours de tronc. Entre 4 et 5 ans, ses gestes sont plus maîtrisés : il trace des formes simples, articule tronc et membres, colorie plus précisément. Entre 5 et 6 ans, il nomme les couleurs et enrichit ses personnages de détails.

Ces âges restent des repères : certains enfants dessinent beaucoup, d’autres très peu, selon leurs goûts. Les fiches mpedia le rappellent : chaque enfant suit son propre rythme, et une difficulté sur un point ne signifie pas qu’il est en retard sur tout.

## Au quotidien
**Le matériel**
- Gros crayons de couleur, craies grasses et feutres lavables, faciles à tenir pour les petites mains.
- De grandes feuilles (papier kraft, dos de rouleaux de papier peint) pour dessiner avec tout le bras.
- Un tableau à craie ou une ardoise, des craies pour le trottoir aux beaux jours.
- Des cahiers de coloriage, en complément du dessin libre.

**Encourager sans juger**
- Demandez-lui de raconter plutôt que de deviner : « Tu me racontes ton dessin ? » au lieu de « C’est quoi ? ».
- Commentez ce que vous voyez : « Tu as mis beaucoup de bleu », « Ce personnage a l’air content ».
- Évitez de corriger (« Un chien n’est pas violet ») : l’imagination n’a pas de règles.
- Affichez quelques dessins : sur le frigo, dans un cadre, dans un classeur que l’on feuillette ensemble.

**Des idées pour varier**
- Dessiner la suite d’une histoire lue ensemble.
- Faire le portrait de la famille, du chat, de sa maison.
- Dessiner « à deux mains » : chacun son tour ajoute un élément.
- Tracer le contour de sa main ou de son corps allongé sur une grande feuille, puis le décorer.
- Dessiner en musique, au rythme d’un morceau lent puis rapide.

**Tenue du crayon**
- Montrez sans insister : pouce et index pincent le crayon, le majeur le soutient.
- Des activités de motricité fine (pâte à modeler, perles, pinces à linge) aident aussi la main.
- La latéralité (droitier ou gaucher) se précise souvent pendant ces années : laissez-le choisir sa main.

**Sécurité**
- Respectez l’âge indiqué sur les feutres et crayons et rangez bouchons et petits embouts loin des plus jeunes.

## Questions fréquentes
**Mon enfant de 5 ans ne dessine que des gribouillis, est-ce inquiétant ?** Certains enfants s’intéressent peu au dessin. Proposez sans forcer et observez le reste de son développement. Si plusieurs choses vous questionnent (tenue des objets, langage, attention), parlez-en à son médecin ou à l’enseignant.

**Il dessine des choses tristes ou violentes.** Le dessin est un moyen d’expression. Invitez-le à raconter, sans dramatiser. Si ces dessins s’accompagnent d’un changement de comportement, d’angoisses ou de propos inquiétants, parlez-en à un professionnel.

**Il est gaucher, faut-il le faire changer de main ?** Non. Laissez-le utiliser la main qui lui convient et adaptez l’installation (lumière, place de la feuille).

**Il refuse de colorier « dans les traits ».** Le coloriage précis vient avec la maturité du geste, souvent entre 4 et 5 ans. Le dessin libre reste à privilégier.

## Quand demander conseil
Consultez le médecin si votre enfant semble avoir beaucoup de mal à tenir un crayon ou de petits objets pour son âge, s’il perd des acquis, ou si plusieurs aspects de son développement vous inquiètent. En cas de doute, n’hésitez pas à consulter votre pédiatre. ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'peinture-collage-decoupage-3-6-ans',
    title: 'Peinture, collage, découpage : les ateliers créatifs des 3–6 ans',
    summary: 'Avec la maîtrise des ciseaux et du pinceau, les activités créatives s’enrichissent entre 3 et 6 ans : idées d’ateliers, organisation pour limiter les dégâts et choix du matériel.',
    category: 'activites-eveil', tags: ['peinture', 'collage', 'découpage', 'ciseaux', 'gommettes', 'activités manuelles', 'loisirs créatifs', 'arts plastiques'],
    sources: [S.dev34, S.programme, S.dgccrfJouets],
    body_md: `## En bref
- Vers 3 ans, beaucoup d’enfants **commencent à découper des formes simples avec des ciseaux adaptés**.
- Peinture, collage et gommettes font partie des activités d’arts visuels pratiquées régulièrement à l’école maternelle.
- Un atelier réussi, c’est surtout un **espace préparé** et un adulte qui laisse faire.
- Choisissez du matériel adapté à l’âge, avec une notice en français et le marquage CE pour les kits créatifs.

## Comprendre
La fiche mpedia « Entre 3 et 4 ans » décrit un enfant qui gagne en précision : il construit, commence à découper avec des ciseaux adaptés, tient mieux son crayon et explore crayon, peinture et gommettes. Le programme de l’école maternelle inclut les **arts visuels**, pratiqués seul ou en groupe, en mobilisant le langage et l’imaginaire.

À la maison, l’intérêt n’est pas le résultat « joli » mais l’expérience : mélanger les couleurs, sentir la texture de la colle, décider où placer un morceau de papier. La DGCCRF rappelle de vérifier, pour tout jouet ou kit, la notice en français, l’âge indiqué et les avertissements.

## Au quotidien
**Préparer l’espace**
- Une nappe cirée ou du papier journal sur la table, un vieux tee-shirt en guise de blouse.
- De petits pots de peinture plutôt que le flacon entier, une éponge et un seau d’eau à portée de main.
- Un endroit pour faire sécher les œuvres, et une règle claire : on peint sur la feuille, pas sur les murs.

**Des idées d’ateliers**
- **Peinture** : au pinceau, à l’éponge, au doigt, avec une fourchette ou une pomme de terre coupée en tampon ; peindre sur un grand carton.
- **Mélanges de couleurs** : partir de trois couleurs et découvrir ce qui apparaît.
- **Collage** : magazines, papiers de couleur, feuilles d’arbres, tissus, boutons trop gros pour être avalés.
- **Découpage** : bandes de papier à couper en morceaux, puis lignes droites, puis courbes et formes simples.
- **Gommettes** : les placer sur un trait, compléter un dessin, créer des motifs qui se répètent.
- **Œuvre collective** : une grande fresque familiale où chacun ajoute sa partie.

**Apprendre à utiliser les ciseaux**
- Des ciseaux à bouts ronds, adaptés à sa main (il existe des modèles pour gauchers).
- Montrez le geste : le pouce dessus, on ouvre et on ferme « comme la bouche d’un crocodile ».
- On découpe assis, on pose les ciseaux fermés, on ne marche pas avec.
- Gardez les cutters et ciseaux pointus pour les adultes.

**Bien choisir le matériel**
- Peintures et colles lavables, adaptées à l’âge indiqué sur l’emballage.
- Pour les kits créatifs, vérifiez la notice en français, l’âge, le marquage CE et les éventuels avertissements (surveillance d’un adulte, petites pièces).
- Les produits non conformes et dangereux repérés par la DGCCRF font l’objet de retraits ou de rappels publiés sur RappelConso : vous pouvez y vérifier un produit.
- Lavez les mains après l’atelier, surtout après la peinture au doigt.

## Questions fréquentes
**Il met de la peinture partout, j’ai du mal à le supporter.** Réduisez la quantité de peinture, choisissez un lieu facile à nettoyer (cuisine, extérieur) et prévoyez le rangement ensemble à la fin : cela fait partie de l’activité.

**Il ne fait jamais ce que montre le modèle.** C’est son œuvre : laisser libre cours à son idée nourrit sa créativité plus que la reproduction d’un modèle.

**À quel âge peut-il découper seul ?** Le découpage commence vers 3 ans avec des ciseaux adaptés, toujours sous surveillance. La précision s’améliore beaucoup jusqu’à 6 ans.

**Les paillettes et perles sont-elles adaptées ?** Elles plaisent beaucoup, mais les petites perles sont dangereuses pour les plus jeunes de la fratrie : rangez-les hors de portée.

## Quand demander conseil
Si votre enfant a avalé un produit (peinture, colle) ou s’en est mis dans les yeux, rincez et contactez un centre antipoison ; appelez le **15** en cas de gêne respiratoire, de malaise ou de somnolence. Pour une coupure qui saigne beaucoup ou qui semble profonde, consultez. ${URG}

${FIN}`,
  }),
  a({
    slug: 'pate-a-modeler-pate-a-sel-slime-3-6-ans',
    title: 'Pâte à modeler, pâte à sel, slime : modeler en toute prudence',
    summary: 'Modeler plaît beaucoup aux 3–6 ans et fait travailler les mains. Comment varier les activités, et pourquoi l’Anses appelle à la prudence avec le slime fait maison.',
    category: 'activites-eveil', tags: ['pâte à modeler', 'pâte à sel', 'slime', 'bore', 'acide borique', 'motricité fine', 'activité manuelle', 'loisirs créatifs'],
    sources: [S.slime, S.jouets, S.guideEcrans],
    body_md: `## En bref
- La pâte à modeler fait partie des **alternatives aux écrans** citées dans le guide « Bien grandir dans un monde d’écrans ».
- Rouler, aplatir, découper la pâte fait travailler la **force et la précision des mains**, utiles pour le dessin et l’écriture.
- L’Anses met en garde contre le **slime fait maison** : colles, lessives et produits contenant du **bore** manipulés de façon répétée peuvent irriter ou brûler la peau, et certains composés du bore sont toxiques.
- Pour les pâtes achetées, vérifiez l’âge indiqué, le marquage CE et les précautions d’emploi.

## Comprendre
L’Anses a alerté sur les risques du slime, cette pâte élastique très à la mode. Les recettes maison associent souvent de la colle, de la lessive, des produits pour lentilles ou de l’acide borique. L’Anses a reçu des signalements de dermatites, de brûlures, de rougeurs et d’eczéma liés à la manipulation répétée de ces produits. Le bore et ses dérivés sont toxiques pour la fertilité et le développement de l’embryon et du fœtus, et les quantités utilisées dans les recettes dépassent les usages prévus. Des analyses de la DGCCRF sur des kits vendus dans le commerce ont aussi révélé des teneurs en bore supérieures à la limite autorisée pour certains produits, qui ont été retirés et rappelés.

La pâte à modeler classique, la pâte à sel ou la pâte maison à base d’ingrédients de cuisine offrent les mêmes plaisirs de manipulation avec moins de risques, à condition de surveiller que l’enfant ne la mange pas.

## Au quotidien
**Des idées pour modeler**
- Faire des « serpents », des boules, des galettes, puis des formes plus élaborées (escargot, bonhomme, gâteau).
- Utiliser des emporte-pièces, un rouleau, un couteau en plastique, une fourchette pour faire des motifs.
- Créer une scène : une ferme, un repas pour les poupées, un aquarium.
- Mélanger deux couleurs pour en découvrir une troisième.
- Cacher de petits objets (assez gros pour ne pas être avalés) dans la pâte et les retrouver.

**La pâte à sel**
- Une recette de cuisine simple à base de farine, de sel et d’eau, réalisée avec l’adulte.
- On modèle, on fait sécher ou cuire avec un adulte, puis on peint.
- Elle est très salée : rappelez à l’enfant qu’on ne la mange pas.

**Bien choisir une pâte achetée**
- Respectez l’âge indiqué et les avertissements de l’emballage.
- Vérifiez le marquage CE et consultez au besoin RappelConso.
- Suivez les précautions d’emploi indiquées sur les kits.

**Le slime : les conseils de l’Anses**
- Évitez que l’enfant manipule de façon répétée de l’acide borique et ses dérivés, quel que soit le produit qui les contient.
- Limitez le contact prolongé et répété de la peau avec les lessives, détergents et colles.
- Ne détournez pas de leur usage des produits pour les yeux, les lentilles ou le linge.
- Si un kit est utilisé, respectez strictement ses précautions d’emploi, faites laver les mains après le jeu et gardez-le hors de portée des plus jeunes.

## Questions fréquentes
**Mon enfant met la pâte à modeler à la bouche.** Rappelez la règle (« la pâte, ça se touche, ça ne se mange pas ») et restez à côté. S’il en a avalé une petite quantité et qu’il va bien, demandez conseil à un centre antipoison en ayant l’emballage sous les yeux.

**La pâte maison à la farine est-elle sûre ?** Elle évite les produits chimiques du slime, mais reste à ne pas manger, surtout si elle est très salée.

**Ses mains sont rouges après avoir joué au slime.** Arrêtez le jeu, rincez abondamment et demandez conseil au pharmacien ou au médecin si la rougeur persiste ou s’étend.

**Comment conserver la pâte ?** Dans une boîte hermétique, à l’abri de la chaleur ; jetez-la si elle sent mauvais ou change d’aspect.

## Quand demander conseil
Contactez un centre antipoison si votre enfant a avalé du slime, de la colle, de la lessive ou un produit contenant de l’acide borique. Appelez le **15** en cas de vomissements répétés, de malaise, de difficulté à respirer ou de somnolence. Consultez pour une irritation ou une brûlure de la peau qui ne s’améliore pas. ${URG}

${FIN}`,
  }),
  a({
    slug: 'bricolage-recup-enfant-3-6-ans',
    title: 'Bricolage et récup’ avec un enfant de 3 à 6 ans',
    summary: 'Rouleaux en carton, boîtes d’œufs, bouchons : le bricolage avec des matériaux de récupération occupe, développe l’imagination et coûte peu. Idées et précautions.',
    category: 'activites-eveil', tags: ['bricolage', 'récup', 'recyclage', 'carton', 'boîte d’œufs', 'activités pas chères', 'activité manuelle', 'piles bouton'],
    sources: [S.guideEcrans, S.guideMB, S.piles],
    body_md: `## En bref
- Le guide « Bien grandir dans un monde d’écrans » propose de **transformer boîtes d’œufs, rouleaux de papier toilette ou bouchons** en jeux : une activité à très faible coût.
- Santé publique France encourage à **initier les enfants au bricolage**, qui compte aussi dans l’activité du quotidien.
- Les matériaux de récup’ laissent une grande place à l’imagination : une boîte devient voiture, maison ou robot.
- Écartez tout ce qui présente un danger : **piles bouton**, petites pièces, objets coupants, emballages de produits ménagers.

## Comprendre
Le guide réalisé par la Ville de Saint-Denis et diffusé par la MILDECA insiste sur l’intérêt d’activités simples et peu coûteuses pour remplacer les écrans. Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans cite le bricolage et le jardinage parmi les activités à faire découvrir. Santé.fr rappelle enfin que les piles bouton, présentes dans de nombreux objets du quotidien, sont dangereuses en cas d’ingestion, même déchargées.

Bricoler demande de prévoir, d’essayer, de recommencer quand ça ne tient pas. L’enfant apprend aussi à utiliser des outils simples et à prendre soin de son espace.

## Au quotidien
**La boîte à récup’**
Gardez dans un carton : rouleaux de papier toilette ou d’essuie-tout, boîtes d’œufs, boîtes de céréales, pots de yaourt rincés, gros bouchons, chutes de tissu, laine, papier cadeau, magazines, pinces à linge.

**Des idées de bricolage**
- **Jumelles** avec deux rouleaux collés et une ficelle courte.
- **Maracas** avec un pot fermé contenant du riz ou des pâtes (bien scellé, pour éviter que les petits l’ouvrent).
- **Garage ou maison de poupée** dans une boîte à chaussures.
- **Chenille** avec une boîte d’œufs découpée et peinte.
- **Robot ou fusée** en empilant boîtes et rouleaux.
- **Mangeoire à oiseaux** avec une bouteille découpée par l’adulte, à suspendre au balcon en hiver.
- **Marionnettes** avec une chaussette orpheline ou un sac en papier.

**Répartir les rôles**
- L’adulte découpe ce qui est dur ou épais et utilise les outils dangereux (cutter, pistolet à colle chaude).
- L’enfant choisit, assemble, colle, peint, décore.
- Pour les 5–6 ans, de petits outils de bricolage adaptés (marteau léger, clous à grosse tête dans du polystyrène ou du carton épais) peuvent être utilisés avec l’adulte à côté.

**Précautions**
- **Piles bouton** : n’utilisez jamais d’objets électroniques usagés ou de vieilles télécommandes comme matériel de bricolage ; une pile bouton avalée est une urgence, même déchargée.
- **Petites pièces** : bouchons, perles et boutons peuvent être avalés par les plus jeunes ; rangez-les hors de portée.
- **Emballages de produits ménagers** : ne les utilisez pas, et ne transvasez jamais un produit dans un récipient alimentaire.
- **Sacs plastiques et ficelles longues** : risque d’étouffement ou d’étranglement, surtout pour les plus petits.
- Lavez soigneusement les pots et barquettes alimentaires avant de les utiliser.

## Questions fréquentes
**Mon enfant veut tout garder, la maison déborde.** Fixez une limite (une étagère, une caisse) et prenez des photos des créations avant de vous en séparer ensemble.

**Il se décourage quand ça ne tient pas.** Proposez des solutions plus simples (ruban adhésif plutôt que colle liquide) et valorisez l’essai : « Tu as eu une idée, on cherche comment la faire tenir. »

**Quelles colles utiliser ?** Des colles en bâton ou liquides prévues pour les enfants, adaptées à l’âge indiqué. Le pistolet à colle chaude reste dans les mains de l’adulte.

## Quand demander conseil
En cas de suspicion d’ingestion d’une pile bouton, n’attendez pas de symptôme : appelez immédiatement un centre antipoison ou le **15**, ne faites pas vomir et ne donnez rien à boire ni à manger. Appelez aussi le **15** si votre enfant s’étouffe, respire mal ou a avalé un produit ménager. Consultez pour une coupure profonde ou qui saigne beaucoup. ${URG}

${FIN}`,
  }),
  a({
    slug: 'decouvrir-aliments-par-les-sens-marche-ferme-3-6-ans',
    title: 'Toucher, sentir, goûter : découvrir les aliments par le jeu entre 3 et 6 ans',
    summary: 'Marché, ferme, petites missions en cuisine, jeux de goût : des activités pour éveiller la curiosité alimentaire des 3–6 ans, sans pression ni récompense.',
    category: 'activites-eveil', tags: ['goût', 'éveil au goût', 'marché', 'ferme', 'cuisiner avec son enfant', 'légumes', 'néophobie', 'jeux sensoriels', 'courses'],
    sources: [S.guideMB, S.gouts, S.accidents],
    body_md: `## En bref
- Les goûts se forment **par l’expérience** : proposer un aliment régulièrement, parfois **une dizaine de fois**, sans forcer, aide à l’accepter.
- Santé publique France suggère d’emmener l’enfant **au marché**, de lui faire **toucher et sentir** les fruits, de visiter une **ferme ou un producteur**.
- Les très jeunes enfants peuvent participer en cuisine **sous surveillance** : tourner une cuillère, parsemer du fromage râpé, équeuter des haricots.
- La nourriture ne doit être **ni une récompense ni une punition**.

## Comprendre
Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans et Santé.fr (Manger Bouger) décrivent le goût comme quelque chose qui s’apprend. Varier les préparations (cru, vapeur, four, potage, tarte), les présentations et les couleurs, laisser parfois le choix entre deux aliments d’une même famille et montrer l’exemple sont les leviers recommandés. Le guide rappelle aussi qu’un enfant accepte plus volontiers de goûter un légume qu’il a **choisi, cueilli ou cuisiné**.

Entre 3 et 6 ans, beaucoup d’enfants se méfient des aliments nouveaux. Transformer la découverte en jeu, sans enjeu à table, permet de rendre l’aliment familier avant même de le goûter.

## Au quotidien
**Au marché ou au magasin**
- Donnez-lui une mission : trouver trois légumes verts, choisir le fruit de la semaine, compter les pommes.
- Laissez-le toucher (le velouté d’une pêche, le grain d’une poire), sentir les herbes, comparer les tailles et les couleurs.
- Préparez ensemble les menus de quelques jours, en lui laissant un choix.

**À la ferme ou chez un producteur**
- Le guide Manger-Bouger propose de visiter une ferme ou un producteur pendant les vacances ou le week-end, pour comprendre comment poussent les fruits et légumes.
- Cueillir soi-même des fraises ou des pommes, voir les animaux, poser des questions au producteur : autant de souvenirs liés aux aliments.

**Des jeux de goût à la maison**
- **Le jeu des cinq sens** : regarder, toucher, sentir, écouter le croquant, puis goûter si l’enfant le souhaite.
- **Les yeux bandés** (avec son accord) : reconnaître un fruit à l’odeur ou au toucher.
- **Sucré, salé, acide, amer** : goûter de petites quantités d’aliments du quotidien et mettre des mots sur les sensations.
- **Le même légume de trois façons** : cru, cuit, en purée, et voter pour sa préférée.

**En cuisine, des tâches à sa mesure**
- Laver les légumes, déchirer la salade, tourner une cuillère, parsemer, verser des ingrédients déjà pesés.
- Équeuter des haricots, écraser une banane, décorer une assiette.
- Apprendre à se laver les mains avant de cuisiner et à nettoyer le plan de travail.
- Sécurité : plats chauds loin du bord, queues de casserole vers l’intérieur, couteaux et plaques réservés à l’adulte.

## Questions fréquentes
**Il refuse de goûter, même après avoir cuisiné.** Ce n’est pas un échec : l’aliment devient familier. Reproposez-le plus tard, sous une autre forme, sans obligation ni marchandage.

**Peut-on promettre un dessert s’il goûte ?** Santé publique France conseille de ne pas utiliser la nourriture comme récompense ou punition, pour ne pas donner plus de valeur au dessert qu’au légume.

**Mon enfant ne mange que quelques aliments.** Une sélectivité marquée est fréquente à cet âge. Si elle est très restreinte, s’accompagne d’une perte de poids ou d’une fatigue, ou inquiète beaucoup la famille, parlez-en au médecin.

**Quelle quantité proposer ?** Les quantités dépendent de l’âge, de l’appétit et de l’activité de chaque enfant : demandez conseil au médecin si vous avez un doute, et respectez son appétit.

## Quand demander conseil
Consultez le médecin en cas de perte de poids, de refus alimentaire très large, de troubles digestifs répétés ou si les repas sont devenus une source de conflit importante. En cas d’allergie connue ou suspectée, demandez un avis avant de faire goûter un aliment nouveau. En cas de réaction après un aliment (gonflement du visage, gêne pour respirer, malaise), appelez le **15**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'musique-chant-instruments-3-6-ans',
    title: 'Chanter, écouter, jouer d’un instrument : la musique avec un enfant de 3 à 6 ans',
    summary: 'Comptines, rondes, petits instruments faits maison, éveil musical : des idées pour partager la musique avec son enfant, en protégeant ses oreilles.',
    category: 'activites-eveil', tags: ['musique', 'chant', 'comptines', 'éveil musical', 'instruments', 'rythme', 'jouets sonores', 'audition'],
    sources: [S.programme, S.culture, S.dgccrfJouets],
    body_md: `## En bref
- À l’école maternelle, les **comptines, chants et poèmes** sont mémorisés régulièrement et les « univers sonores » font partie des activités artistiques.
- Musique, chant et danse sont reconnus comme des pratiques d’**éveil culturel** qui nourrissent la curiosité et l’imaginaire.
- À la maison, chanter ensemble, taper un rythme ou fabriquer un instrument ne demande ni matériel coûteux ni connaissances musicales.
- Attention au **volume sonore** des jouets et des écouteurs : un son trop fort peut abîmer les oreilles.

## Comprendre
Le programme de l’école maternelle prévoit la mémorisation de comptines, de chants et de poèmes (environ un texte par semaine en moyenne et grande section) et inclut les univers sonores dans les activités artistiques, qui mobilisent le langage et l’imaginaire. Le ministère chargé des Solidarités, dans le cadre des 1000 premiers jours, rappelle que l’éveil artistique et culturel favorise la curiosité, la construction et l’épanouissement de l’enfant, et que musique, chant et danse sont déjà intégrés dans de nombreux lieux d’accueil.

La DGCCRF signale, parmi les points de vigilance sur les jouets électriques, le **volume sonore** qui peut abîmer les oreilles et les **piles bouton** qui ne doivent pas être accessibles.

## Au quotidien
**Chanter ensemble**
- Les comptines de votre enfance, dans votre langue ou celle de vos parents : la diversité des langues est une richesse.
- Les chansons de l’école : demandez-lui de vous les apprendre, il en sera très fier.
- Les chansons à gestes et les rondes, qui associent musique et mouvement.
- Inventer des paroles sur un air connu pour raconter la journée ou accompagner le rangement.

**Jouer avec les sons**
- Taper dans les mains un rythme simple et le faire répéter, puis inverser les rôles.
- Jouer « fort / doucement », « vite / lentement » avec la voix ou un tambourin.
- Le jeu des statues musicales : on danse, on s’arrête quand la musique s’arrête.
- Écouter les bruits du quotidien (pluie, oiseaux, voitures) et les imiter.

**Des instruments faits maison**
- Maracas : un pot bien fermé rempli de riz ou de lentilles.
- Tambour : une casserole retournée et une cuillère en bois.
- Guitare : des élastiques tendus sur une boîte à chaussures.
- Vérifiez que rien ne peut s’ouvrir ni se détacher si un plus petit est dans les parages.

**Écouter de la musique**
- Variez les styles : classique, musiques du monde, chansons pour enfants, jazz.
- Proposez de dessiner ou de danser en écoutant.
- Certains lieux (médiathèques, conservatoires, salles de spectacle) proposent des concerts ou ateliers pour les jeunes enfants.

**Protéger ses oreilles**
- Baissez le volume des jouets sonores si besoin, et préférez des sons modérés.
- Évitez les écouteurs et les casques audio à fort volume.
- Lors d’un concert ou d’une fête bruyante, éloignez-vous des enceintes et proposez des pauses au calme ; des protections auditives adaptées aux enfants existent.

## Questions fréquentes
**Je chante faux, est-ce un problème ?** Pas du tout : ce qui compte pour l’enfant, c’est de partager un moment avec vous.

**Faut-il l’inscrire à un cours d’éveil musical ?** C’est possible s’il en a envie, mais pas indispensable. Chanter et jouer à la maison apporte déjà beaucoup.

**Il veut écouter la même chanson en boucle.** La répétition fait partie du plaisir à cet âge. Vous pouvez alterner avec d’autres morceaux.

**Il semble ne pas entendre quand on lui parle.** Parlez-en à son médecin : un contrôle de l’audition peut être utile, d’autant que l’audition joue un rôle important dans l’apprentissage du langage.

## Quand demander conseil
Consultez le médecin si votre enfant fait souvent répéter, monte le son très fort, ne réagit pas aux bruits, parle peu pour son âge, se plaint d’oreilles qui sifflent ou de douleur à l’oreille. En cas de suspicion d’ingestion d’une pile bouton provenant d’un jouet, appelez immédiatement le **15** ou un centre antipoison. ${URG}

${FIN}`,
  }),
  a({
    slug: 'danse-expression-corporelle-3-6-ans',
    title: 'Danser, mimer, faire le cirque : l’expression corporelle entre 3 et 6 ans',
    summary: 'Danser dans le salon, mimer des animaux, jouer aux statues : l’expression corporelle fait bouger, exprimer ses émotions et rire. Des idées pour les 3–6 ans.',
    category: 'activites-eveil', tags: ['danse', 'expression corporelle', 'mime', 'cirque', 'jeux musicaux', 'bouger à la maison', 'mauvais temps', 'émotions'],
    sources: [S.programme, S.guideMB, S.recos5],
    body_md: `## En bref
- À l’école maternelle, **« s’exprimer avec son corps »** (danse, arts du cirque) est l’un des quatre axes de l’activité physique quotidienne.
- La danse fait partie des activités citées par Santé publique France pour bouger, y compris **à l’intérieur quand la météo ne permet pas de sortir**.
- Danser, mimer et jouer aux statues aident l’enfant à **coordonner ses mouvements** et à **exprimer des émotions**.
- Pas besoin de cours : un peu de place et de la musique suffisent.

## Comprendre
Le programme de l’école maternelle organise l’activité physique en quatre domaines : se déplacer, construire des équilibres, s’exprimer avec son corps et coopérer ou s’opposer. L’expression corporelle, qui inclut la danse et les arts du cirque, invite l’enfant à inventer des mouvements, à les enchaîner, à les montrer aux autres.

Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans cite la danse parmi les activités qui font travailler les muscles, le souffle et la souplesse, et la propose comme solution d’intérieur quand il n’est pas possible de sortir. Santé publique France rappelle aussi qu’un jeune enfant devrait bouger au moins 3 heures par jour et ne pas rester assis plus d’une heure d’affilée en dehors du sommeil.

## Au quotidien
**Des jeux de danse**
- **Les statues musicales** : on danse, on se fige quand la musique s’arrête.
- **Le miroir** : face à face, l’un fait un geste, l’autre l’imite ; puis on change.
- **Danser les émotions** : danser « comme si on était content », puis « en colère », « fatigué », « surpris ».
- **Danser avec un foulard** ou un ruban léger pour dessiner des formes dans l’air.
- **La danse des animaux** : l’éléphant lourd, l’oiseau léger, le serpent qui ondule.

**Mimer et jouer la comédie**
- Deviner un métier, un animal ou une action mimée par un autre.
- Rejouer une histoire lue ensemble, avec des gestes et sans paroles.
- Faire un petit spectacle pour la famille, avec un « rideau » et des applaudissements.

**Petits jeux de cirque**
- Marcher sur une corde posée au sol comme un funambule.
- Lancer et rattraper un foulard, puis une balle légère.
- Faire des roulades sur un matelas ou un tapis épais, dans un espace dégagé.
- Faire le clown : grimaces, chutes « pour de faux » sur un coussin, nez rouge.

**Organiser l’espace**
- Poussez la table basse, retirez les objets fragiles et les tapis qui glissent.
- Pieds nus ou chaussures, pas de chaussettes sur un sol lisse.
- Gardez de l’eau à portée de main après une danse endiablée.

## Questions fréquentes
**Mon enfant est timide et n’ose pas danser devant les autres.** Commencez à deux, sans spectateur, et dansez vous-même. La confiance vient en jouant, sans obligation de montrer.

**À partir de quel âge s’inscrire à un cours de danse ?** Des cours d’éveil existent pour les plus jeunes ; l’important est que l’enfant en ait envie et que le rythme reste léger. La danse libre à la maison suffit très bien à cet âge.

**Il devient très excité après la danse.** Terminez par une musique lente, un jeu « au ralenti » ou quelques respirations allongé sur le tapis pour revenir au calme, surtout en fin de journée.

**La danse sur une vidéo, c’est une bonne idée ?** Entre 3 et 6 ans, les repères officiels recommandent un usage des écrans exceptionnel et accompagné. Une musique seule, sans image, laisse plus de place à l’invention.

## Quand demander conseil
Parlez-en au médecin si votre enfant s’essouffle de façon inhabituelle, se plaint de douleurs articulaires répétées, chute très souvent ou semble très gêné dans sa coordination. Après une chute avec choc à la tête suivie de vomissements, de somnolence ou d’un comportement inhabituel, appelez le **15**. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ calme, ennui, écrans
  a({
    slug: 'activites-calmes-retour-au-calme-3-6-ans',
    title: 'Activités calmes et retour au calme : aider son enfant de 3 à 6 ans à s’apaiser',
    summary: 'Après l’école, avant le coucher ou après une grosse colère : des activités calmes pour aider l’enfant à ralentir, et les gestes du rituel du coucher.',
    category: 'activites-eveil', tags: ['activités calmes', 'retour au calme', 'relaxation', 'respiration', 'rituel du coucher', 'après l’école', 'apaiser', 'sommeil'],
    sources: [S.rituel, S.guideEcrans, S.dev56],
    body_md: `## En bref
- Avant le coucher, mieux vaut **éviter les jeux excitants**, les chatouilles ou les lancers de coussins, et privilégier un rituel répété chaque soir.
- Les écrans sont à **éteindre au moins une heure avant le coucher** : la lumière et le rythme rapide des images retardent l’endormissement.
- Puzzles, dessin, lecture, pâte à modeler, musique douce sont de bonnes activités pour ralentir.
- Le sommeil reste essentiel : entre 5 et 6 ans, un enfant a besoin de **10 à 12 heures par nuit**.

## Comprendre
La fiche mpedia « Rituel du coucher, un moment à partager » recommande de répéter chaque soir les mêmes gestes (bain, pyjama, lit), de fermer rideaux ou volets, de parler, chanter ou lire une histoire, et d’éviter les jeux excitants avant de dormir. Elle conseille aussi de ne pas trop faire durer le rituel, ce qui peut gêner l’endormissement.

Le guide « Bien grandir dans un monde d’écrans » explique que l’écran donne une attention superficielle plutôt qu’un vrai calme, et qu’il fatigue le cerveau. Il propose à la place un rituel de coucher fait de brossage des dents, d’histoire, de chanson ou de câlin. La fiche mpedia « De 5 à 6 ans » rappelle que le sommeil est essentiel à cet âge.

## Au quotidien
**Après l’école**
- Beaucoup d’enfants rentrent fatigués et chargés d’émotions. Un goûter, un moment de câlin ou de jeu libre au calme permet de « décompresser ».
- Évitez d’enchaîner immédiatement avec de nombreuses questions : la journée se raconte souvent plus tard, pendant le bain ou au coucher.
- Le guide « Bien grandir dans un monde d’écrans » suggère de raconter sa propre journée à l’enfant : cela l’invite à raconter la sienne.

**Des activités calmes à proposer**
- Un puzzle, un coloriage, un dessin libre.
- La pâte à modeler ou des perles à enfiler (attention aux petites pièces pour les plus jeunes).
- Un livre regardé seul ou lu ensemble.
- Une musique douce, une comptine chantée à voix basse.
- Trier des objets (boutons, cartes, petites voitures) par couleur ou par taille.

**Petits exercices pour s’apaiser**
- **La respiration du ballon** : on gonfle son ventre comme un ballon en inspirant, on le dégonfle doucement en soufflant.
- **Souffler sur une plume** ou une bougie imaginaire, très lentement.
- **Le chat qui s’étire** puis se roule en boule sur le tapis.
- **L’automassage** : se tapoter doucement les bras et les jambes, puis se faire un câlin à soi-même.
- **Un coin calme** avec coussins et livres, où l’enfant peut aller quand il en a besoin, sans que ce soit une punition.

**Le rituel du coucher**
- Les mêmes étapes chaque soir, dans le même ordre : bain ou toilette, pyjama, dents, histoire, câlin, lumière éteinte.
- Fixez le nombre d’histoires à l’avance et gardez un temps court.
- Couchez l’enfant encore éveillé pour qu’il apprenne à s’endormir seul.

## Questions fréquentes
**Mon enfant refuse les activités calmes et court partout le soir.** Une agitation en fin de journée peut traduire de la fatigue. Avancez un peu le rituel, baissez les lumières et le bruit, et proposez une activité calme avec vous plutôt que seul.

**Il fait des crises au moment du coucher.** Un rituel prévisible et rassurant aide souvent. Si les difficultés de sommeil persistent et pèsent sur toute la famille, parlez-en au médecin.

**Un dessin animé ne l’aide-t-il pas à se calmer ?** L’écran donne une impression de calme, mais il retarde l’endormissement. Les repères officiels conseillent de l’éviter au moins une heure avant le coucher.

## Quand demander conseil
Consultez le médecin si votre enfant dort mal de façon durable, ronfle fort avec des pauses respiratoires, se réveille souvent avec des peurs intenses, ou s’il semble très fatigué ou irritable dans la journée. ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'ennui-creatif-laisser-enfant-s-ennuyer-3-6-ans',
    title: '« Je m’ennuie ! » : pourquoi laisser son enfant de 3 à 6 ans s’ennuyer un peu',
    summary: 'L’ennui n’est pas un problème à régler à tout prix : il laisse de la place à l’imagination. Comment accueillir le « je m’ennuie » et aider l’enfant à trouver ses propres jeux.',
    category: 'activites-eveil', tags: ['ennui', 'je m’ennuie', 'jeu libre', 'imagination', 'créativité', 'jouer seul', 'temps libre', 'surstimulation'],
    sources: [S.guideEcrans, S.marinopoulos, S.dev45],
    body_md: `## En bref
- Le guide « Bien grandir dans un monde d’écrans » présente l’ennui comme un **atout** : « Ne rien faire libère son imagination. »
- Il n’est **pas nécessaire de proposer une activité en permanence** à son enfant.
- Le **jeu libre** et le temps non organisé ont une grande valeur, plus que l’accumulation de jouets.
- Entre 4 et 5 ans, l’enfant aime faire semblant et **peut jouer seul** : l’ennui est souvent le point de départ de ces jeux.

## Comprendre
Le guide réalisé par la Ville de Saint-Denis et diffusé par la MILDECA souligne que remplir chaque minute n’est pas utile, et qu’un moment sans activité prévue permet à l’enfant d’inventer. Le rapport remis au ministère de la Culture sur l’éveil culturel et artistique du jeune enfant valorise lui aussi le jeu libre, le temps non structuré et la nature plutôt que l’accumulation de jouets. La fiche mpedia « De 4 à 5 ans » décrit un enfant qui aime faire semblant, se crée un monde à lui et peut jouer seul.

L’ennui est inconfortable sur le moment, pour l’enfant comme pour le parent. Mais c’est souvent quand il ne sait plus quoi faire que l’enfant transforme un carton en bateau, invente une histoire à ses petites voitures ou observe les fourmis sur le balcon.

## Au quotidien
**Accueillir le « je m’ennuie »**
- Reconnaissez ce qu’il ressent : « Tu ne sais pas quoi faire, c’est désagréable. »
- Ne vous précipitez pas pour trouver la solution à sa place : « Je suis sûr que tu vas trouver une idée. »
- Restez disponible sans organiser : vous pouvez faire vos propres activités à côté de lui.

**Préparer un environnement qui donne des idées**
- Quelques jouets ouverts accessibles (cubes, figurines, tissus, cartons, crayons), plutôt qu’un grand nombre de jouets à fonction unique.
- Une **boîte à idées** dessinée ensemble : il pioche une carte (« fais une cabane », « dessine ton rêve », « construis une tour ») quand il ne sait plus quoi faire.
- Faites tourner les jouets : en ranger une partie quelques semaines leur redonne de l’intérêt.

**Laisser du temps libre dans la semaine**
- Évitez un emploi du temps trop rempli : école, activités et sorties fatiguent aussi.
- Gardez des moments sans programme, à la maison ou dehors.
- Limitez le recours à l’écran pour « occuper » : le guide décrit ce réflexe comme un cercle vicieux qui empêche l’autonomie de se développer.

**Quand l’ennui dure**
- Proposez une petite impulsion plutôt qu’une activité clé en main : poser une boîte vide et du ruban adhésif sur la table, sortir un livre, ouvrir la fenêtre pour écouter les oiseaux.
- Invitez-le à participer à ce que vous faites : plier le linge, préparer le repas, arroser les plantes.

## Questions fréquentes
**Mon enfant n’arrive pas à jouer seul.** Jouer seul s’apprend. Commencez par jouer près de lui, puis éloignez-vous un peu en restant présent. Des moments courts, répétés, l’aident à prendre confiance.

**Il dit « je m’ennuie » dès qu’on éteint l’écran.** Les premiers temps sans écran sont souvent les plus difficiles. Avec quelques idées à portée de main et un peu de patience, la plupart des enfants retrouvent le goût de jouer.

**Ne risque-t-il pas de prendre du retard s’il n’a pas d’activité ?** Le jeu libre fait partie des apprentissages : l’enfant y développe son imagination, son langage et son autonomie.

**Il s’ennuie aussi à l’école.** Parlez-en avec l’enseignant pour comprendre ce qui se passe. S’il semble triste, fatigué ou ne veut plus y aller, parlez-en aussi au médecin.

## Quand demander conseil
Si votre enfant semble ne s’intéresser à rien, se replie, paraît triste ou fatigué depuis plusieurs semaines, ou si son comportement change nettement, parlez-en au médecin ou à la PMI. ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'ecrans-3-6-ans-reperes-alternatives',
    title: 'Écrans entre 3 et 6 ans : les repères officiels et des alternatives concrètes',
    summary: 'Entre 3 et 6 ans, les repères officiels recommandent un usage exceptionnel, accompagné et limité à des contenus de qualité : comment les appliquer et que proposer à la place.',
    category: 'activites-eveil', tags: ['écrans', 'tablette', 'télévision', 'dessins animés', 'temps d’écran', '3 ans', 'carnet de santé', 'contrôle parental', 'alternatives aux écrans'],
    sources: [S.ecrans, S.guideEcrans, S.recos5],
    body_md: `## En bref
- Les repères intégrés au **carnet de santé depuis janvier 2025** prévoient, entre 3 et 6 ans, un **usage exceptionnel** des écrans, limité à des contenus éducatifs de qualité et **supervisé par un adulte**.
- Le **jeu libre et les interactions** restent prioritaires.
- Pas d’écran pendant les repas, au réveil, **au moins une heure avant le coucher**, ni dans la chambre de l’enfant.
- La 3D est déconseillée avant 5 ans ; respectez les âges indiqués pour les films et les jeux vidéo.

## Comprendre
Le ministère chargé de la Santé rappelle les risques d’une exposition excessive : sommeil de moins bonne qualité, activité physique réduite, troubles de la vue comme la myopie, et chez les plus jeunes moins d’échanges avec les adultes, ce qui peut freiner le langage, l’attention et les compétences sociales. Il conseille d’utiliser l’écran pour un objectif précis et une durée déterminée, de dialoguer sur les contenus, de partager les moments d’écran en famille et de montrer l’exemple.

Le guide « Bien grandir dans un monde d’écrans » précise que, après 3 ans, l’écran peut servir à découvrir sur de **courts temps accompagnés**, et que la télévision allumée en fond perturbe les échanges et la concentration. Il ajoute que le calme apparent devant un écran n’est pas une vraie concentration.

## Au quotidien
**Mettre en place des règles simples**
- Choisissez avec votre enfant **quand** (un moment prévu, par exemple un dessin animé le week-end) et **quoi** (un programme adapté à son âge).
- Regardez avec lui et parlez de ce que vous avez vu : « Qu’est-ce qui t’a fait rire ? »
- Utilisez une minuterie ou la fin de l’épisode comme signal d’arrêt, annoncé à l’avance.
- Installez les écrans dans les pièces communes, pas dans la chambre.
- Activez le contrôle parental, gratuit sur les appareils vendus en France depuis 2022, selon le guide.
- Éteignez la télévision quand personne ne la regarde.

**Les moments sans écran**
- Les repas, partagés et sans télévision.
- Le matin avant l’école.
- La dernière heure avant le coucher.
- Les trajets courts : un sac avec livres, coloriages et petits jeux, comme le propose le guide.

**Les alternatives qui marchent (guide « Bien grandir dans un monde d’écrans »)**
- Jeux de société, dessin, pâte à modeler, jeux de ballon, bac à sable.
- Participer à la cuisine ou préparer ses affaires avec vous.
- Un coin jeux et livres pour s’occuper pendant que vous préparez le repas.
- Les maisons de quartier, ludothèques et médiathèques, souvent gratuites.
- Laisser l’enfant s’ennuyer un peu : « Ne rien faire libère son imagination. »

**Et vous ?**
- Le ministère invite les parents à limiter leur propre usage en présence de l’enfant. Mettre son téléphone en mode avion à certains moments, comme le suggère le guide, aide à rester disponible.

## Questions fréquentes
**Combien de temps par jour, concrètement ?** Les repères du ministère parlent d’un usage exceptionnel entre 3 et 6 ans, plutôt que d’une durée quotidienne. Une page plus ancienne de Santé publique France évoquait moins d’une heure par jour entre 3 et 5 ans ; dans tous les cas, moins est préférable, toujours accompagné.

**Les applications éducatives sont-elles une bonne idée ?** Les repères admettent des contenus éducatifs de qualité, en usage exceptionnel et accompagné. Rien ne remplace cependant la manipulation, le jeu et l’échange avec un adulte.

**Je culpabilise de mettre un dessin animé pour cuisiner.** Vous n’êtes pas seul·e à jongler. Vous pouvez essayer progressivement des alternatives (coin jeux, aide en cuisine), en gardant l’écran pour des moments choisis.

**Comment gérer les crises à l’arrêt de l’écran ?** Prévenez avant la fin, proposez une activité de transition et restez ferme avec douceur. Les crises diminuent souvent quand les règles sont stables.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant réclame les écrans de façon très insistante, si ses colères à l’arrêt sont très fortes, s’il dort mal, parle peu pour son âge ou semble s’isoler. Le site jeprotegemonenfant.gouv.fr propose des repères aux familles. ${SOUTIEN}

${FIN}`,
  }),
  // ------------------------------------------------------------------ sorties et activités
  a({
    slug: 'sorties-culturelles-musee-spectacle-cinema-3-6-ans',
    title: 'Musée, spectacle, cinéma : réussir une sortie culturelle avec un enfant de 3 à 6 ans',
    summary: 'De nombreux musées, théâtres et cinémas proposent des activités pour les jeunes enfants : comment choisir une sortie adaptée et la préparer pour qu’elle reste un plaisir.',
    category: 'activites-eveil', tags: ['sortie culturelle', 'musée', 'spectacle jeune public', 'théâtre', 'cinéma', 'exposition', 'éveil culturel', 'week-end'],
    sources: [S.culture, S.marinopoulos, S.ecrans],
    body_md: `## En bref
- L’éveil artistique et culturel **favorise la curiosité, la construction et l’épanouissement** de l’enfant, selon le ministère chargé des Solidarités.
- Des **théâtres et musées ont des espaces dédiés** à la petite enfance, et des guides existent pour accompagner les tout-petits au cinéma.
- Au cinéma comme devant tout écran, **respectez les âges indiqués** pour les films.
- Une sortie réussie à cet âge est **courte, préparée** et respecte le rythme de l’enfant.

## Comprendre
Dans le cadre des 1000 premiers jours, le ministère chargé des Solidarités, en lien avec le ministère de la Culture, encourage la sensibilisation précoce aux pratiques culturelles : lecture, musique, chant, danse, spectacles, musées. Le rapport sur l’éveil culturel et artistique remis au ministère de la Culture insiste sur le **lien parent-enfant** : l’objectif n’est pas de « consommer » une sortie, mais de vivre une expérience ensemble, à son rythme. Il décrit aussi le spectacle comme un moment qui se prépare et se prolonge après.

Le ministère cite aussi, parmi les ressources, un guide pour emmener les tout-petits au cinéma. Le ministère chargé de la Santé rappelle de son côté de respecter les âges indiqués pour les films et de partager les moments d’écran en famille en dialoguant sur les contenus.

## Au quotidien
**Choisir la sortie**
- Repérez les programmations « jeune public » des théâtres, salles de spectacle, médiathèques, cinémas et musées de votre ville.
- Vérifiez l’âge conseillé, la durée et l’horaire (évitez l’heure de la sieste ou la fin de journée si votre enfant est fatigué).
- Au cinéma, respectez les âges indiqués pour les films ; les séances pour les plus jeunes sont souvent plus courtes.
- Renseignez-vous sur les tarifs et les éventuelles gratuités auprès de chaque lieu.

**Préparer**
- Parlez de la sortie à l’avance : ce qu’on va voir, comment ça se passe (le noir dans la salle, le silence, les applaudissements).
- Lisez un livre en lien avec le thème, regardez une image de l’œuvre ou de l’animal que vous verrez.
- Prévoyez un goûter, de l’eau, un passage aux toilettes avant d’entrer.

**Au musée**
- Choisissez quelques salles plutôt que tout le musée.
- Proposez un jeu : trouver un chien dans les tableaux, compter les couleurs, imiter la pose d’une statue.
- Laissez-le s’arrêter devant ce qui l’attire, même si ce n’est pas « l’œuvre importante ».
- Renseignez-vous sur les ateliers, parcours ou livrets pour enfants.

**Au spectacle ou au cinéma**
- Asseyez-vous près d’une sortie pour pouvoir sortir si votre enfant a peur ou s’agite.
- Rassurez-le pendant les moments impressionnants : le noir, le bruit, un personnage qui fait peur.
- Après, prolongez : dessiner, raconter, rejouer une scène.

## Questions fréquentes
**Mon enfant ne tient pas assis longtemps, est-ce trop tôt ?** Choisissez des formats courts et pensés pour les jeunes enfants. Si la sortie s’arrête plus tôt que prévu, ce n’est pas un échec.

**Le cinéma est-il un écran comme un autre ?** Une séance choisie, partagée et discutée en famille est différente d’un écran utilisé pour occuper. Les repères officiels recommandent toutefois un usage exceptionnel entre 3 et 6 ans et le respect des âges indiqués.

**Il a eu peur pendant le spectacle.** Parlez-en ensuite, avec des mots simples : ce qui était pour de faux, ce qu’il a ressenti. Choisissez une prochaine sortie plus douce.

**Les sorties culturelles coûtent cher.** Médiathèques, expositions en plein air, fêtes de quartier ou animations municipales sont souvent gratuites ou peu coûteuses ; les maisons de quartier en proposent aussi.

## Quand demander conseil
Si votre enfant présente des peurs très intenses qui l’empêchent de sortir ou de dormir, ou si le bruit et la foule le mettent dans un état de détresse importante et répétée, parlez-en au médecin. Un malaise ou un accident pendant une sortie : appelez le **15** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'activites-extrascolaires-3-6-ans-choisir',
    title: 'Activités extrascolaires entre 3 et 6 ans : en faut-il, et comment choisir ?',
    summary: 'Éveil sportif, danse, musique, piscine, arts plastiques : comment savoir si une activité convient à votre enfant de 3 à 6 ans, sans surcharger sa semaine, et quelles démarches prévoir.',
    category: 'activites-eveil', tags: ['activités extrascolaires', 'éveil sportif', 'club', 'mercredi', 'inscription', 'certificat médical', 'questionnaire de santé', 'fatigue', 'rythme de l’enfant'],
    sources: [S.guideMB, S.licences, S.dev56],
    body_md: `## En bref
- Une activité extrascolaire **n’est pas indispensable** entre 3 et 6 ans : le jeu libre, le plein air et les moments en famille comptent tout autant.
- Santé publique France encourage à **tester plusieurs activités** ; changer d’activité à la rentrée n’est pas un problème tant que l’enfant reste actif.
- Pour une licence sportive, le **certificat médical n’est plus obligatoire pour les mineurs** : un questionnaire de santé suffit si toutes les réponses sont négatives.
- Veillez au **rythme** : école, trajets et activités fatiguent, et le sommeil reste essentiel à cet âge.

## Comprendre
Le guide Manger-Bouger pour les parents d’enfants de 4 à 11 ans propose de faire découvrir à l’enfant différentes activités : marche, vélo, piscine, jeux de plein air, sports d’équipe, danse. Il précise que changer d’activité chaque année est sans conséquence, tant que l’enfant bouge régulièrement. Il recommande aussi des activités sportives ou culturelles en famille.

Le ministère des Sports rappelle que, pour les mineurs, l’obligation de fournir un certificat médical pour une licence a été supprimée : il suffit de remplir un **questionnaire de santé** et de fournir une attestation. Si une réponse au questionnaire est positive, une consultation médicale est nécessaire et un certificat doit être présenté. La fiche mpedia « De 5 à 6 ans » rappelle qu’à cet âge un enfant a besoin de **10 à 12 heures de sommeil par nuit**.

## Au quotidien
**Se poser les bonnes questions**
- Votre enfant a-t-il **envie** de cette activité, ou est-ce surtout votre projet ? Observez ce qui l’attire dans ses jeux.
- La semaine laisse-t-elle encore du temps pour jouer librement, se reposer, voir la famille ?
- L’horaire est-il compatible avec sa fatigue (éviter la fin de journée trop tardive) et avec votre organisation ?

**Des activités adaptées à cet âge**
- **Éveil sportif ou baby-gym** : courir, sauter, rouler, viser, dans un cadre ludique et varié plutôt que spécialisé.
- **Activités aquatiques** : la piscine fait partie des activités citées par Santé publique France ; à cet âge, il s’agit surtout de se familiariser avec l’eau, toujours sous la surveillance d’un adulte.
- **Danse, expression corporelle, cirque**.
- **Éveil musical, chorale enfant, arts plastiques, théâtre**.
- Les **accueils de loisirs** du mercredi ou des vacances proposent aussi des activités variées ; renseignez-vous auprès de votre mairie.

**Bien démarrer**
- Demandez une **séance d’essai** quand c’est possible.
- Renseignez-vous sur l’encadrement, la taille du groupe et la durée des séances, qui doit rester courte à cet âge.
- Pour une licence, remplissez le questionnaire de santé ; si une réponse est positive, prenez rendez-vous chez le médecin.
- Parlez avec l’animateur ou l’enseignant de l’activité après quelques séances.

**Accepter qu’il change d’avis**
- Encouragez-le à essayer quelques séances avant d’abandonner, sans le forcer durablement.
- S’il n’en veut plus, cherchez à comprendre (fatigue, timidité, groupe, horaire) et essayez autre chose l’année suivante.

## Questions fréquentes
**Combien d’activités par semaine à 4 ou 5 ans ?** Il n’existe pas de chiffre officiel. Une activité choisie suffit souvent ; l’essentiel est de garder du temps libre et du sommeil.

**Mon enfant pleure à chaque séance.** La séparation, le bruit ou le groupe peuvent l’impressionner. Restez au début si c’est possible, puis éloignez-vous progressivement. Si cela dure, l’activité ou le moment ne sont peut-être pas adaptés pour l’instant.

**Faut-il un certificat médical pour l’éveil sportif ?** Pour les mineurs, le questionnaire de santé remplace le certificat dans la plupart des cas ; vérifiez auprès du club, et consultez si une réponse est positive.

**Mon enfant est très fatigué depuis la rentrée.** Allégez la semaine, avancez l’heure du coucher et parlez-en au médecin si la fatigue persiste.

## Quand demander conseil
Consultez le médecin si une réponse au questionnaire de santé est positive, si votre enfant se plaint de douleurs, d’essoufflement ou de malaises pendant l’effort, ou s’il est épuisé de façon durable. En cas de malaise ou de douleur dans la poitrine pendant un effort, appelez le **15**. ${URG}

${FIN}`,
  }),
];
