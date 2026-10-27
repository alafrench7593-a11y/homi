/** Guide complet — lot 12 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  recos5ans: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Les recommandations pour les enfants jusqu’à 5 ans', url: 'https://www.sante.fr/node/800511', consulted_on: C, published: '2023-10-10' },
  activitesBebe: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Les activités avec bébé', url: 'https://www.sante.fr/node/1875887', consulted_on: C, published: '2025-06-03' },
  livret1000: { label: 'Ministère des Solidarités et de la Santé — Le livret de nos 1000 premiers jours', url: 'https://solidarites.gouv.fr/sites/solidarite/files/2023-01/livret-1000-premiers-jours.pdf', consulted_on: C, published: '2021-08-27' },
  langage: { label: 'Santé.fr (mpedia – AFPA) — Progrès du langage de 1 à 3 ans', url: 'https://www.sante.fr/node/1093870', consulted_on: C, published: '2025-07-09' },
  santeCulturelle: { label: 'Ministère chargé des Solidarités — La santé des enfants et des parents est aussi culturelle', url: 'https://solidarites.gouv.fr/la-sante-des-enfants-et-des-parents-est-aussi-culturelle-sensibilisation-aux-pratiques-culturelles', consulted_on: C },
  lireCulture: { label: 'Ministère de la Culture — Lire avec un tout petit et son parent', url: 'https://www.culture.gouv.fr/fr/thematiques/education-artistique-et-culturelle/actualites/Lire-avec-un-tout-petit-et-son-parent', consulted_on: C, published: '2019-08-20' },
  ecrans: { label: 'Ministère chargé de la Santé — Écrans : des risques pour la santé physique et mentale des enfants, un accompagnement nécessaire', url: 'https://solidarites.gouv.fr/enfants-et-ecrans-des-risques-sanitaires-reels-un-accompagnement-necessaire', consulted_on: C, published: '2025-07-02' },
  arreteEcrans: { label: 'Ministère chargé de la Santé — Arrêté interdisant l’exposition des enfants de moins de 3 ans aux écrans dans les lieux d’accueil du jeune enfant', url: 'https://solidarites.gouv.fr/protection-de-la-petite-enfance-publication-de-larrete-interdisant-lexposition-des-enfants-de-moins-de-3-ans-aux-ecrans-dans-les-lieux-daccueil-du-jeune-enfant', consulted_on: C, published: '2025-07-02' },
  jouets: { label: 'economie.gouv.fr — Nos conseils pour choisir les jouets de vos enfants en toute sécurité', url: 'https://www.economie.gouv.fr/particuliers/choix-conseil-achat-jouets-securite-enfants', consulted_on: C },
  piles: { label: 'Santé.fr (Ministère chargé de la Santé) — Piles bouton : prévention des risques d’ingestion par les jeunes enfants', url: 'https://www.sante.fr/node/1184265', consulted_on: C, published: '2024-12-16' },
  accidents: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Éviter les accidents domestiques des enfants', url: 'https://www.sante.fr/eviter-les-accidents-domestiques-des-enfants', consulted_on: C, published: '2025-07-11' },
  airesJeux: { label: 'DGCCRF (economie.gouv.fr) — Aires collectives de jeux', url: 'https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Aires-collectives-jeux', consulted_on: C },
  noyadeSports: { label: 'Ministère des Sports — Piscine privée et jeunes enfants : les règles de sécurité pour prévenir les noyades', url: 'https://www.sports.gouv.fr/piscine-privee-et-jeunes-enfants-les-regles-de-securite-pour-prevenir-les-noyades-10176', consulted_on: C, published: '2026-05-29' },
  noyadeSante: { label: 'Santé.fr — Baignades et activités nautiques : attention aux noyades !', url: 'https://www.sante.fr/node/6851765', consulted_on: C, published: '2026-05-22' },
  soleil: { label: 'Santé.fr (mpedia – AFPA) — Comment protéger son enfant du soleil ?', url: 'https://www.sante.fr/node/1093866', consulted_on: C, published: '2023-07-06' },
  canicule: { label: 'Santé publique France — Canicule : les précautions à prendre', url: 'https://www.santepubliquefrance.fr/les-actualites/canicule-les-precautions-a-prendre', consulted_on: C, published: '2019-07-24' },
  tiques: { label: 'Santé.fr (RecoSanté) — Comment éviter les morsures de tiques ?', url: 'https://sante.fr/comment-eviter-les-morsures-de-tiques', consulted_on: C, published: '2025-07-23' },
  casque: { label: 'Sécurité routière (communiqué relayé par la préfecture de Lot-et-Garonne) — À vélo, le casque devient obligatoire pour les enfants de moins de 12 ans', url: 'https://www.lot-et-garonne.gouv.fr/contenu/telechargement/10719/98831/file/cp-obligationcasqueveloenfant2-1.pdf', consulted_on: C, published: '2016-12-22' },
  jeuLot: { label: 'Département du Lot (PMI) — Le jeu chez l’enfant', url: 'https://lot.fr/sites/lot.fr/files/le_jeu_et_lenfant_0.pdf', consulted_on: C },
  carnet: { label: 'Santé.fr (Ministère chargé de la Santé) — Le carnet de santé de l’enfant', url: 'https://www.sante.fr/le-carnet-de-sante-de-lenfant-1', consulted_on: C, published: '2024-12-27' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, de la puéricultrice de PMI ou des professionnels qui suivent votre enfant._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**.';
const SOUTIEN = 'Si vous vous sentez à bout, épuisé·e ou très seul·e, parlez-en à votre médecin ou à la PMI ; en cas de détresse ou d’idées noires, le **3114** répond jour et nuit. Si un enfant est en danger, appelez le **119**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['newborn', 'child'], min_age_months: 12, max_age_months: 36, status: 'to_review', ...x,
});

export const GUIDE_B12: LibArticle[] = [
  // ------------------------------------------------------------------ bouger
  a({
    slug: 'bouger-trois-heures-par-jour-1-3-ans',
    title: 'Bouger 3 heures par jour entre 1 et 3 ans : à quoi cela ressemble ?',
    summary: 'Le repère des « 3 heures d’activité par jour » expliqué simplement, avec des idées pour l’atteindre sans programme ni matériel.',
    category: 'activites-eveil', tags: ['activité physique', 'bouger', 'tout-petit', '3 heures', 'motricité', 'sédentarité', 'poussette', 'jouer dehors'],
    sources: [S.recos5ans, S.livret1000, S.activitesBebe],
    body_md: `## En bref
- À partir de **1 an**, Santé publique France recommande que l’enfant **bouge au moins 3 heures par jour**, au fil de la journée.
- Ces 3 heures se cumulent : marcher, courir, grimper, danser, jouer dehors… **tout compte**.
- Hors sommeil et sieste, il est conseillé de ne pas le laisser **assis ou allongé plus d’une heure d’affilée**.
- **Pas d’écran avant 3 ans** : le temps libéré profite au jeu et au mouvement.

## Comprendre
Trois heures peuvent sembler beaucoup. En réalité, il ne s’agit pas de séances de sport : c’est la somme de tous les moments où le tout-petit est en mouvement, à la maison, à la crèche, chez l’assistante maternelle ou dehors. Le jeune enfant bouge spontanément : il roule, court, saute, danse. Le rôle de l’adulte est surtout de **lui en laisser l’occasion** et de lui offrir un espace sûr.

Les recommandations de Santé publique France citent des activités simples : **marcher, courir, sauter, lancer une balle, barboter dans l’eau**, si possible en plein air. À partir de 2 ans, elles suggèrent d’aller régulièrement au parc, de jouer au ballon en famille, de découvrir le tricycle ou la trottinette et la piscine, à son rythme.

L’autre versant, c’est la **sédentarité** : rester longtemps assis dans la poussette, le siège auto, la chaise haute ou devant un écran. Les repères conseillent de ne pas laisser l’enfant immobile plus d’une heure d’affilée en dehors du sommeil, et, dès qu’il sait marcher, de **limiter la poussette** pour l’encourager à marcher.

Le livret des 1000 premiers jours rappelle enfin que l’activité physique est bonne pour l’enfant **et pour ses parents**.

## Au quotidien
Quelques idées pour répartir le mouvement sur la journée :
- **Le matin** : une petite marche jusqu’à la boulangerie, la crèche ou le marché, en laissant l’enfant marcher une partie du trajet.
- **À la maison** : un coin dégagé avec des coussins à escalader, un carton-tunnel, une danse sur sa musique préférée.
- **Après la sieste** : un passage au square, au jardin, dans un parc ; quelques lancers de balle ou une course « attrape-moi ».
- **Pendant les tâches** : le laisser vous suivre, porter un petit sac, ranger les chaussettes dans le panier.
- **Le soir** : des jeux plus calmes pour préparer le coucher, car les activités trop excitantes en soirée peuvent retarder l’endormissement.
- **Les jours de pluie** : vêtements adaptés et sortie quand même, ou parcours avec des coussins dans le salon.

N’essayez pas de chronométrer : observez plutôt si votre enfant a eu, sur la journée, plusieurs moments pour courir, grimper, se dépenser et jouer librement.

## Questions fréquentes
**Faut-il l’inscrire à une activité sportive ?**
Ce n’est pas nécessaire à cet âge. Le jeu libre, les sorties et les jeux en famille suffisent largement à proposer du mouvement. Une activité de type « bébés nageurs » ou un éveil corporel peut être un plaisir partagé, sans obligation.

**Mon enfant est gardé toute la journée : comment savoir s’il bouge assez ?**
Demandez simplement aux professionnels comment se passent les journées : temps dehors, jeux moteurs, sieste. Le soir et le week-end, privilégiez une sortie ou un moment de jeu actif.

**Il préfère les activités calmes. Est-ce un problème ?**
Chaque enfant a son tempérament. Les temps calmes ont aussi leur place. Proposez des jeux de mouvement sous forme de plaisir partagé (danse, cache-cache, balade), sans forcer.

**La poussette est-elle à bannir ?**
Non : elle reste utile pour les longs trajets ou quand il est fatigué. L’idée est de ne pas l’y laisser assis pendant les temps de jeu et de lui laisser marcher une partie des trajets.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant ne marche pas encore et que vous vous posez des questions, s’il tombe très souvent, semble peu intéressé par le mouvement, ou si vous avez un doute sur son développement. Le médecin pourra aussi en parler avec vous lors des examens de suivi. ${URG}

${FIN}`,
  }),
  a({
    slug: 'parcours-motricite-maison-tout-petit',
    title: 'Un parcours de motricité à la maison pour les 1–3 ans',
    summary: 'Coussins, cartons, tunnels et chaises : comment installer en sécurité un petit parcours pour grimper, ramper et sauter à l’intérieur.',
    category: 'activites-eveil', tags: ['parcours de motricité', 'motricité', 'jeux d’intérieur', 'jour de pluie', 'coussins', 'grimper', 'tout-petit', 'sans écran'],
    sources: [S.recos5ans, S.accidents, S.activitesBebe],
    body_md: `## En bref
- Un parcours de motricité se fabrique avec ce que vous avez : **coussins, cartons, plaids, chaises solides, scotch au sol**.
- Il permet de **grimper, ramper, enjamber, sauter, se faufiler** même quand il pleut.
- La sécurité passe par un **espace dégagé**, des meubles **fixés au mur** et un adulte présent.
- Le plus important n’est pas le matériel mais **le plaisir partagé** et le rythme de l’enfant.

## Comprendre
Entre 1 et 3 ans, l’enfant passe de ses premiers pas à la course, puis au saut. Il apprend en essayant, en tombant et en recommençant. Les recommandations de Santé publique France invitent à proposer des **activités variées et ludiques** pour qu’il bouge au moins trois heures par jour, et à ne pas le laisser assis plus d’une heure d’affilée hors sommeil.

À l’intérieur, un petit parcours est une manière simple d’y parvenir. La page « Les activités avec bébé » rappelle qu’**il n’est pas nécessaire d’acheter du matériel coûteux** : le jeu naît surtout de la présence de l’adulte et de la liberté laissée à l’enfant.

Côté sécurité, le jeune enfant n’a pas conscience du danger. Les conseils de prévention des accidents domestiques insistent sur la **surveillance**, la fixation des meubles au mur, les barrières d’escalier et l’éloignement des objets qui permettent d’escalader jusqu’à une fenêtre.

## Au quotidien
**Installer le parcours**
- Choisissez une pièce dégagée, loin des fenêtres, des angles de table et des escaliers.
- Posez un tapis ou des couvertures épaisses au sol.
- Vérifiez que les meubles alentour sont stables ou fixés au mur.

**Idées d’étapes** (à adapter à son âge)
- **Une montagne de coussins** à escalader puis à descendre sur les fesses.
- **Un tunnel** en carton ouvert aux deux bouts, ou un plaid tendu entre deux chaises lourdes, pour ramper dessous.
- **Une ligne de scotch** au sol pour marcher « comme sur un fil ».
- **Des coussins posés en pas japonais** à enjamber.
- **Un petit saut** depuis une marche basse et stable vers un coussin.
- **Un bac de balles** ou de pelotes de laine à transvaser à la fin du parcours.

**Le faire vivre**
- Montrez une fois, puis laissez-le explorer à sa façon : il inventera souvent son propre ordre.
- Accompagnez par les mots : « dessus », « dessous », « dedans », « à côté » enrichissent son vocabulaire.
- Changez une ou deux étapes d’un jour à l’autre pour renouveler l’intérêt.
- Arrêtez quand il montre des signes de fatigue ou d’agacement, sans forcer.
- Évitez les parcours très excitants juste avant le coucher.

## Questions fréquentes
**À partir de quel âge peut-on proposer un parcours ?**
Dès qu’il se déplace, en adaptant les étapes : à 12–18 mois, ramper et escalader des coussins bas ; vers 2–3 ans, sauter à pieds joints, marcher sur une ligne, se faufiler.

**Faut-il acheter des modules en mousse ?**
Ce n’est pas nécessaire. Si vous en achetez, vérifiez le **marquage CE** et l’âge indiqué, comme pour tout jouet.

**Il tombe souvent pendant le parcours. Dois-je l’arrêter ?**
Les petites chutes sur un sol amorti font partie de l’apprentissage. Restez près de lui et sécurisez les hauteurs. En revanche, un choc sur la tête suivi de vomissements, de somnolence ou d’un comportement inhabituel justifie un avis médical rapide.

**Il veut grimper partout, même sur les meubles.**
Proposez-lui des endroits où il a le droit de grimper (le parcours, les coussins) et sécurisez le reste : meubles fixés, rien qui permette d’atteindre une fenêtre ou un balcon.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant semble avoir des difficultés persistantes d’équilibre, s’il perd des acquisitions ou si vous avez un doute sur sa motricité. Après une chute, consultez rapidement en cas de perte de connaissance, de vomissements répétés, de somnolence inhabituelle ou de douleur qui l’empêche de bouger un membre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jeux-de-ballon-tout-petit',
    title: 'Jeux de ballon entre 1 et 3 ans : rouler, lancer, taper',
    summary: 'Faire rouler, lancer, attraper puis taper du pied : des idées de jeux de balle adaptés à chaque étape, à la maison comme dehors.',
    category: 'activites-eveil', tags: ['ballon', 'balle', 'lancer', 'jeux en famille', 'motricité', 'coordination', 'tout-petit', 'jouer dehors'],
    sources: [S.recos5ans, S.jeuLot, S.jouets],
    body_md: `## En bref
- Le ballon fait partie des activités recommandées pour les tout-petits : **lancer une balle** dès 1 an, **jouer au ballon en famille** dès 2 ans.
- Vers 2 ans, un jeu simple : **assis en rond, se faire rouler le ballon**.
- Choisissez une balle **adaptée à l’âge** (taille, poids, marquage CE).
- Ces jeux développent la coordination, l’attention… et le tour de rôle.

## Comprendre
Les recommandations de Santé publique France pour les moins de 5 ans citent le **lancer de balle** parmi les activités qui permettent à l’enfant de bouger au moins trois heures par jour à partir de 1 an. À partir de 2 ans, elles proposent de **jouer au ballon en famille**, par exemple assis en rond en faisant rouler le ballon vers les autres joueurs.

Un document de PMI sur le jeu cite les **ballons** parmi les jeux appréciés entre 12 et 18 mois, au moment où l’enfant marche et « touche à tout ». Avec le temps, le geste s’affine : d’abord pousser et faire rouler, puis lâcher la balle, la lancer vers l’avant, et plus tard l’attraper avec les bras, puis taper dedans avec le pied.

Au-delà de la motricité, le ballon est un jeu **relationnel** : il circule de l’un à l’autre, on attend, on se regarde, on rit ensemble. C’est une première expérience du chacun son tour.

## Au quotidien
**Vers 12–18 mois**
- Asseyez-vous face à lui, jambes écartées, et faites rouler doucement une grosse balle souple vers lui.
- Laissez-le la pousser, la suivre à quatre pattes ou en marchant.
- Jouez à « la balle dans le panier » : un grand panier à linge posé au sol suffit.

**Vers 18 mois–2 ans**
- Lancers vers un grand carton ou dans un bac.
- Balles de tailles différentes (dans le respect de l’âge indiqué) pour comparer : grosse, petite, légère.
- Taper dans le ballon en marchant : il découvre le pied qui pousse.

**Vers 2–3 ans**
- **Le jeu en rond** en famille : chacun dit le prénom de la personne vers qui il fait rouler le ballon.
- Quilles faites de bouteilles en plastique vides, à faire tomber en roulant la balle.
- Lancer de petits sacs de tissu dans un cerceau ou un seau.
- Au parc, tirer dans un « but » formé de deux sacs posés au sol.

**Le bon matériel**
- Une balle **souple et légère** pour l’intérieur.
- Vérifiez le **marquage CE** et l’âge indiqué ; évitez les petites balles qui ne conviennent pas aux moins de 36 mois.
- À l’intérieur, éloignez les objets fragiles et jouez dans une pièce dégagée.

## Questions fréquentes
**Il ne sait pas encore attraper : est-ce inquiétant ?**
Attraper demande beaucoup de coordination et vient plus tard que lancer ou pousser. Faites rouler la balle au sol plutôt que de la lancer en l’air, c’est plus facile pour lui.

**Il jette tout, pas seulement les balles. Comment réagir ?**
Lancer est une découverte importante à cet âge. Proposez-lui des objets qu’il a le droit de lancer (balles souples, sacs de tissu) et dites simplement ce qu’on ne lance pas.

**Peut-on jouer au ballon dans un appartement ?**
Oui, avec une balle souple, dans une pièce dégagée, loin des fenêtres et des objets fragiles.

**À partir de quand peut-il taper dans un ballon ?**
Cela dépend de son équilibre : beaucoup d’enfants s’y essaient vers 2 ans. Laissez-le essayer à son rythme.

## Quand demander conseil
Si votre enfant semble avoir des difficultés de coordination qui persistent, ne s’intéresse pas aux échanges ou si vous avez un doute sur son développement, parlez-en au médecin ou à la PMI. Une chute avec choc à la tête suivie de vomissements ou de somnolence nécessite un avis médical rapide. ${URG}

${FIN}`,
  }),
  a({
    slug: 'square-aire-de-jeux-tout-petit',
    title: 'Au square et sur l’aire de jeux avec un enfant de 1 à 3 ans',
    summary: 'Toboggan, balançoire, tourniquet : profiter de l’aire de jeux en choisissant les équipements adaptés à l’âge et en gardant les bons réflexes.',
    category: 'activites-eveil', tags: ['aire de jeux', 'square', 'parc', 'toboggan', 'balançoire', 'sécurité', 'jouer dehors', 'tout-petit'],
    sources: [S.recos5ans, S.airesJeux, S.accidents],
    body_md: `## En bref
- À partir de 2 ans, les recommandations conseillent d’emmener régulièrement l’enfant **au parc ou au square**, pour jouer et rencontrer d’autres enfants.
- Chaque équipement d’une aire de jeux doit afficher **la tranche d’âge prévue** : c’est votre premier repère.
- Évitez **écharpes, cordons et colliers** qui peuvent s’accrocher dans les jeux.
- Un adulte **reste à proximité** : le tout-petit n’a pas conscience du danger.

## Comprendre
L’aire de jeux est un terrain idéal pour bouger : grimper, glisser, se balancer, courir. Les recommandations de Santé publique France citent le **toboggan et les autres jeux du parc**, ainsi que le plaisir de jouer avec d’autres enfants, parmi les activités à proposer dès 2 ans. Plus tôt, l’enfant peut déjà profiter de l’herbe, du sable et des équipements prévus pour les plus petits.

Les aires collectives de jeux sont encadrées par une réglementation. Selon la fiche de la DGCCRF, chaque équipement doit indiquer **l’âge auquel il est destiné** et d’éventuels avertissements ; l’aire doit être séparée des dangers (route, parking, point d’eau), les sols sous les jeux doivent **amortir les chutes**, les équipements doivent être bien fixés et un adulte doit pouvoir atteindre tout endroit où se trouve un enfant. Les coordonnées du gestionnaire doivent être affichées à l’entrée.

Les conseils de prévention des accidents domestiques rappellent aussi le risque de **strangulation** par les colliers, écharpes et cordons, valable sur une aire de jeux comme à la maison.

## Au quotidien
**Avant de jouer**
- Repérez le panneau d’entrée et les **pictogrammes d’âge** sur chaque jeu.
- Faites un petit tour : sol amortissant en bon état, absence de débris, de verre ou de déjections dans le sable.
- Retirez écharpe, cordons de capuche, colliers ; préférez un tour de cou ou un col fermé.
- En été, privilégiez les heures fraîches et les zones ombragées, chapeau sur la tête.

**Pendant le jeu**
- Restez à portée de main sur les équipements en hauteur, surtout avant 2 ans.
- Montrez-lui comment descendre du toboggan **assis, les pieds devant**, et attendre son tour en bas de l’échelle.
- Éloignez-le de la zone de passage des balançoires et des tourniquets.
- Laissez-le explorer à son rythme : certains enfants observent longtemps avant d’oser.

**Après**
- Lavage des mains au retour, surtout après le bac à sable.
- Un signe de fatigue ou de grognon ? C’est souvent le moment de rentrer.

**Les jeux pour les plus petits**
Avant que l’enfant ne soit à l’aise sur les grands équipements, il peut s’amuser simplement : marcher sur l’herbe, ramasser des feuilles, monter une petite marche, pousser un porteur, regarder les autres enfants jouer.

## Questions fréquentes
**Puis-je le laisser monter sur un jeu prévu pour les plus grands si je l’accompagne ?**
L’âge indiqué tient compte de la taille des marches, des hauteurs et des espaces. Mieux vaut respecter ce repère et choisir les jeux conçus pour son âge.

**Il porte une écharpe en hiver : comment faire ?**
Les écharpes et cordons peuvent s’accrocher dans les jeux et serrer le cou. Préférez un tour de cou, un col montant ou un vêtement fermé, et retirez les cordons de capuche.

**J’ai remarqué un équipement abîmé. Que faire ?**
Signalez-le au gestionnaire dont les coordonnées doivent être affichées à l’entrée de l’aire, et n’utilisez pas ce jeu en attendant.

**Mon enfant n’ose pas aller vers les autres. Dois-je l’y pousser ?**
À cet âge, beaucoup d’enfants jouent à côté des autres plutôt qu’avec eux. Restez disponible, proposez sans forcer : les échanges viendront progressivement.

## Quand demander conseil
Consultez rapidement après une chute avec choc à la tête suivie de vomissements, de somnolence, de pleurs inhabituels, ou si l’enfant ne peut plus utiliser un bras ou une jambe. En cas de perte de connaissance ou de difficulté à respirer, appelez immédiatement les secours. ${URG}

${FIN}`,
  }),
  a({
    slug: 'tricycle-trottinette-draisienne-tout-petit',
    title: 'Porteur, tricycle, draisienne, trottinette : les premiers engins du tout-petit',
    summary: 'Comment choisir et utiliser en sécurité les premiers engins à roulettes entre 1 et 3 ans, et quand le casque devient obligatoire.',
    category: 'activites-eveil', tags: ['tricycle', 'trottinette', 'draisienne', 'porteur', 'casque', 'équilibre', 'vélo enfant', 'sécurité'], min_age_months: 12, max_age_months: 36,
    sources: [S.recos5ans, S.casque, S.jouets],
    body_md: `## En bref
- À partir de 2 ans, Santé publique France suggère de faire découvrir **le tricycle et la trottinette** pour développer l’équilibre et le repérage dans l’espace.
- Avant, le **porteur** (sur lequel l’enfant avance en poussant avec les pieds) est souvent le premier engin.
- Le **casque** est **obligatoire à vélo pour les moins de 12 ans**, conducteurs ou passagers ; il est aussi vivement conseillé sur les autres engins.
- Vérifiez **l’âge indiqué et le marquage CE**, et jouez loin de la circulation.

## Comprendre
Rouler, pousser, se propulser : les engins à roues passionnent les tout-petits. Ils permettent de travailler l’équilibre, la coordination et la perception de l’espace.

Les recommandations pour les moins de 5 ans proposent, à partir de 2 ans, de découvrir **tricycle et trottinette**. La draisienne, vélo sans pédales sur lequel l’enfant avance avec ses pieds, répond au même objectif d’équilibre ; l’âge à partir duquel elle convient est indiqué par le fabricant.

Côté réglementation, depuis le 22 mars 2017, le **port du casque est obligatoire à vélo pour les enfants de moins de 12 ans**, qu’ils pédalent eux-mêmes ou qu’ils soient transportés comme passagers. L’adulte qui transporte ou accompagne un enfant non casqué s’expose à une amende. Cette obligation vise à réduire les blessures graves à la tête et au visage.

## Au quotidien
**Choisir l’engin**
- Lisez l’**âge indiqué** et cherchez le **marquage CE**.
- Choisissez un modèle **à la taille de votre enfant**, en suivant les indications du fabricant.
- Préférez des mécanismes simples, sans pièces qui pincent ou se replient facilement.
- Pour un engin d’occasion, vérifiez qu’il n’a pas fait l’objet d’un rappel sur RappelConso et qu’il est en bon état.

**Le casque**
- Choisissez un casque **adapté à la taille de sa tête**, conforme à la réglementation des équipements de protection, et **toujours attaché**.
- Faites-en une habitude dès les premiers essais, même sur la trottinette ou la draisienne : l’exemple des adultes aide beaucoup.

**Où rouler**
- Dans un jardin, une cour fermée, une allée de parc ou une aire réservée, **loin des voitures, des escaliers, des pentes et des points d’eau**.
- Pas d’engin à roulettes sur un trottoir passant ni près d’une rue à cet âge : l’enfant ne sait pas freiner ni anticiper.
- Restez à côté de lui, prêt à le rattraper.

**Les premières fois**
- Laissez-le d’abord marcher avec l’engin entre les jambes.
- Ne le poussez pas trop vite : il apprend surtout à se sentir en équilibre.
- Les chutes à petite vitesse sur un sol plat sont fréquentes ; le casque protège sa tête.

## Questions fréquentes
**Le casque est-il obligatoire sur une trottinette ou une draisienne ?**
L’obligation légale vise le vélo. Pour la trottinette ou la draisienne, le casque reste fortement recommandé pour protéger la tête en cas de chute.

**Tricycle ou draisienne : lequel choisir ?**
Les deux développent la motricité de façon différente. Le tricycle fait travailler le pédalage ; la draisienne l’équilibre. Fiez-vous à l’âge indiqué, à la taille de votre enfant et à ses envies.

**Peut-il utiliser l’engin de son grand frère ?**
Mieux vaut éviter si l’âge indiqué ne correspond pas : les jouets des plus grands ne sont pas conçus pour les plus petits.

**Faut-il des genouillères ?**
Elles ne sont pas obligatoires. Le plus important est le casque, des chaussures fermées et un terrain adapté.

## Quand demander conseil
Après une chute, consultez rapidement en cas de choc à la tête suivi de vomissements, de somnolence, de maux de tête ou de comportement inhabituel, ou si l’enfant ne peut plus s’appuyer sur une jambe ou bouger un bras. ${URG}

${FIN}`,
  }),
  a({
    slug: 'marcher-sans-poussette-tout-petit',
    title: 'Moins de poussette, plus de pas : encourager la marche du tout-petit',
    summary: 'Pourquoi les repères conseillent de limiter la poussette dès que l’enfant marche, et comment rendre les trajets à pied possibles et agréables.',
    category: 'activites-eveil', tags: ['marche', 'poussette', 'sédentarité', 'promenade', 'trajets', 'tout-petit', 'activité physique', 'sortie'],
    sources: [S.recos5ans, S.livret1000, S.activitesBebe],
    body_md: `## En bref
- Dès qu’il sait marcher, les recommandations conseillent de **limiter les déplacements en poussette** et d’encourager l’enfant à marcher.
- Il ne s’agit pas de supprimer la poussette, mais de **lui laisser des morceaux de trajet** à pied.
- Évitez de le laisser assis dans la poussette **pendant les temps de jeu**, au parc comme à la maison.
- Prévoyez du temps : à cet âge, une promenade est aussi une **exploration**.

## Comprendre
La marche est l’activité physique la plus simple et la plus accessible. Les recommandations de Santé publique France pour les moins de 5 ans la citent en premier parmi les activités qui permettent à l’enfant de **bouger au moins trois heures par jour** à partir de 1 an.

Elles abordent aussi la sédentarité : ne pas laisser l’enfant assis ou allongé plus d’une heure d’affilée hors sommeil, **limiter la poussette dès qu’il sait marcher**, et éviter qu’il reste assis dans la poussette pendant les temps de jeu, tout en veillant à sa sécurité.

Le tout-petit marche lentement, s’arrête souvent, observe une fourmi, ramasse un caillou : c’est ainsi qu’il découvre le monde. Le livret des 1000 premiers jours souligne que jouer dehors favorise les apprentissages, l’attention, l’imagination et le vocabulaire, et aide à réduire le stress.

## Au quotidien
**Organiser les trajets**
- Sur un trajet connu, laissez-le marcher **une partie du chemin** (par exemple le début, quand il est encore en forme, ou après une pause).
- Gardez la poussette à portée pour les longues distances, la fatigue ou les zones dangereuses.
- Partez un peu plus tôt : vous serez moins pressé·e et plus disponible pour ses découvertes.

**Rendre la marche sûre**
- Près de la route, **tenez-lui la main** ; faites-le marcher côté maisons et placez-vous côté rue.
- Apprenez-lui dès maintenant à **s’arrêter au bord du trottoir** et à attendre votre main.
- Chaussures fermées, à sa taille, avec une semelle souple.

**Rendre la marche amusante**
- Jouez à « trouver » : un chat, une voiture rouge, une fleur jaune.
- Comptez les marches, sautez par-dessus les lignes, marchez comme un éléphant puis comme une souris.
- Nommez ce que vous voyez : il enrichit son vocabulaire en marchant.
- Prévoyez une gourde d’eau et une petite pause sur un banc.

**Au parc**
Sortez-le de la poussette dès que possible pour qu’il marche dans l’herbe, grimpe sur une petite bosse, joue avec d’autres enfants.

## Questions fréquentes
**Il réclame les bras au bout de cinq minutes. Que faire ?**
Proposez un jeu (« on va jusqu’au prochain arbre ? »), une pause, ou reprenez la poussette sans en faire un conflit. L’endurance vient progressivement.

**Il ne veut pas donner la main près de la route.**
Restez ferme et calme : c’est une règle de sécurité non négociable. Proposez-lui de tenir la poussette ou votre sac, cela lui donne un rôle.

**Le porte-bébé est-il une alternative ?**
Il peut être pratique pour certains trajets, mais l’enfant n’y marche pas davantage. Alternez selon la situation et l’état de fatigue de chacun.

**Combien de temps de marche est conseillé ?**
Aucun temps précis n’est donné pour la marche seule. Le repère global est d’au moins trois heures d’activité par jour, toutes activités confondues, réparties dans la journée.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant ne marche pas encore et que vous vous interrogez, s’il boite, se plaint souvent de douleurs aux jambes, tombe très fréquemment ou semble se fatiguer beaucoup plus vite que les autres enfants. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ langage
  a({
    slug: 'jeux-pour-aider-a-parler-1-3-ans',
    title: 'Des jeux qui aident à parler entre 1 et 3 ans',
    summary: 'Dînette, memory, imagiers, comptines : des idées de jeux quotidiens pour soutenir le langage du tout-petit, sans pression.',
    category: 'activites-eveil', tags: ['langage', 'parler', 'vocabulaire', 'jeux de langage', 'imagier', 'memory', 'dînette', 'tout-petit'],
    sources: [S.langage, S.livret1000, S.carnet],
    body_md: `## En bref
- Entre 1 et 3 ans, l’enfant **comprend bien plus de mots qu’il n’en dit**, puis associe deux mots et forme des phrases.
- Les jeux du quotidien soutiennent ces progrès : **chanter des comptines, jouer à la dînette ou au memory, lire et feuilleter des livres**.
- Évitez de corriger sa prononciation : **répétez le mot correctement**, naturellement.
- Le plus efficace reste **l’échange** : se regarder, se sourire, s’écouter.

## Comprendre
Selon mpedia (Association française de pédiatrie ambulatoire), entre **12 et 18 mois** l’enfant comprend des ordres simples et utilise souvent un seul mot pour dire une phrase entière. Entre **18 mois et 2 ans**, son vocabulaire progresse vite ; il se nomme par son prénom et commence à associer deux mots, en s’aidant de gestes. Entre **2 et 3 ans**, ses phrases deviennent plus complètes, il découvre les tailles, couleurs et formes, pose beaucoup de questions et emploie « je ».

Pour l’aider, la même source conseille de créer des **moments d’échange agréables**, de le laisser exprimer ses envies, d’encourager ses progrès, de **reformuler** ses phrases trop simplifiées et de ne pas reprendre sa prononciation. Elle cite expressément les **comptines**, la **dînette**, le **memory** et la **lecture**. Le livret des 1000 premiers jours ajoute : parlez-lui **normalement et à tout moment**, et chantez.

## Au quotidien
**Jeux de mots et d’images**
- **L’imagier** : montrez, nommez, puis laissez-le montrer à son tour (« Où est le chien ? »).
- **Le memory simplifié** : 3 ou 4 paires d’images d’objets familiers, retournées une à une ; nommez chaque image.
- **Le sac à surprises** : glissez des objets du quotidien dans un sac, il en sort un et vous le nommez ensemble.

**Jeux de faire-semblant**
- **La dînette** : « Tu me donnes une pomme ? Elle est chaude, la soupe ? » Chaque geste est une occasion de mots.
- **Le téléphone pour de faux** : on « appelle » mamie, on raconte sa journée.
- **Les animaux** : imiter le cri, puis dire le nom.

**Pendant les gestes quotidiens**
- Au bain : « l’eau coule », « l’éponge est mouillée ».
- Aux courses : il vous « aide » à trouver les bananes, les pommes, le pain.
- En cuisine : décrivez ce que vous faites, laissez-le toucher, sentir.

**Les bons réflexes**
- Quand il dit « tato », répondez simplement « Oui, un gâteau ! »
- Quand il dit « encore », enrichissez : « Encore de l’eau ? Tu as soif ? »
- Laissez-lui du temps pour répondre, sans finir sa phrase à sa place.
- Éteignez la télévision en fond : elle réduit les échanges.

## Questions fréquentes
**Il prononce mal beaucoup de mots. Faut-il le reprendre ?**
Non : reprendre sa prononciation peut le décourager. Répétez le mot correctement dans votre réponse ; l’articulation se met en place sur plusieurs années.

**Il comprend tout mais parle peu. Est-ce inquiétant ?**
À cet âge, la compréhension est souvent en avance sur l’expression. Si vous avez un doute, notamment vers 2–3 ans, parlez-en au médecin.

**Les applications « pour apprendre à parler » sont-elles utiles ?**
Les écrans sont déconseillés avant 3 ans. L’enfant apprend à parler en échangeant avec des personnes, pas devant un écran.

**Nous parlons plusieurs langues à la maison.**
Parlez-lui naturellement, dans la langue où vous êtes à l’aise : l’essentiel est la richesse et le plaisir des échanges. Le médecin peut répondre à vos questions sur le bilinguisme.

## Quand demander conseil
Selon mpedia, plusieurs situations justifient d’en parler au médecin : un enfant qui reste **très difficile à comprendre** pour son entourage, un **bégaiement** ou une élocution saccadée, **l’absence de phrases correctes vers 2 à 3 ans**, une difficulté à rester dans l’échange, des antécédents familiaux de troubles du langage ou des remarques répétées de l’entourage. Des tests permettent un dépistage précoce, et le carnet de santé, mis à jour en 2025, contient des repères pour dépister les troubles du neurodéveloppement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'comptines-jeux-de-doigts-tout-petit',
    title: 'Comptines et jeux de doigts : chanter avec son tout-petit',
    summary: 'Pourquoi chanter aide le langage et le lien, et comment faire vivre comptines, jeux de doigts et rondes au quotidien, même sans savoir chanter.',
    category: 'activites-eveil', tags: ['comptines', 'jeux de doigts', 'chanter', 'chansons', 'rondes', 'langage', 'éveil musical', 'tout-petit'],
    sources: [S.langage, S.activitesBebe, S.livret1000],
    body_md: `## En bref
- **Chanter favorise l’apprentissage du langage** : c’est un message du livret des 1000 premiers jours.
- Les **comptines** font partie des jeux conseillés par mpedia pour aider l’enfant de 1 à 3 ans à parler.
- Les **jeux de doigts** associent mots, gestes et rythme : l’enfant anticipe, imite, rit.
- Pas besoin de bien chanter : votre voix est celle qu’il préfère.

## Comprendre
Les comptines ont des phrases courtes, des rimes, des répétitions et un rythme marqué. Ces caractéristiques aident le tout-petit à repérer les sons de la langue, à mémoriser des mots et à anticiper la suite. Au fil des répétitions, il complète la fin des phrases, puis chante des morceaux entiers.

Les jeux de doigts (« Les petites marionnettes », « Ainsi font font font », « Une poule sur un mur »…) ajoutent le geste à la parole. Or, entre 18 mois et 2 ans, l’enfant s’aide encore beaucoup de gestes pour communiquer. Associer les deux soutient la compréhension.

La page « Les activités avec bébé » souligne que le tout-petit est attiré par **la musique, le mime, la danse, le chant** et que ces activités favorisent le langage, l’autonomie et la créativité, tout en offrant un moment partagé. Elle rappelle aussi que **rire et s’amuser** aide l’enfant à réguler ses émotions.

## Au quotidien
**Des moments pour chanter**
- **Au change et à l’habillage** : une comptine qui nomme les parties du corps.
- **En voiture ou en promenade** : chansons à répétition qu’il peut compléter.
- **Au bain** : chansons d’eau, de bateaux, de poissons.
- **Au coucher** : une berceuse douce, toujours la même, qui devient un repère.
- **Pendant une attente** (salle d’attente, file) : un jeu de doigts discret occupe mieux qu’un écran.

**Faire vivre les jeux de doigts**
- Allez lentement, exagérez les gestes et les mimiques.
- Marquez une petite pause avant le moment attendu (la chatouille, le « plouf ») : il apprend à anticiper.
- Laissez-le faire les gestes sur vos mains, puis tout seul.

**Varier les plaisirs**
- **Les rondes** (vers 2–3 ans) : se tenir la main, tourner, s’accroupir.
- **Les chansons d’action** : taper des mains, des pieds, se cacher les yeux.
- **Les chants de votre enfance** ou dans votre langue : ils ont une valeur affective précieuse.
- **Inventez** : remplacez un mot par le prénom de votre enfant ou de son doudou.

**Où trouver des comptines ?**
Les bibliothèques ont souvent des recueils et des albums sonores pour les tout-petits, et certaines proposent des séances d’éveil. Demandez aussi à la crèche ou à l’assistante maternelle celles qu’il chante dans la journée.

## Questions fréquentes
**Je chante faux, est-ce gênant ?**
Non. Ce qui compte pour votre enfant, c’est votre voix, votre regard et le plaisir partagé.

**Il réclame toujours la même comptine.**
La répétition le rassure et l’aide à mémoriser. Vous pouvez la varier légèrement (plus vite, plus doucement, en chuchotant).

**Les comptines en vidéo sont-elles une bonne idée ?**
Les écrans sont déconseillés avant 3 ans. Si vous utilisez un enregistrement, préférez un format audio et chantez avec lui.

**À quel âge chantera-t-il vraiment ?**
Chaque enfant a son rythme. Beaucoup commencent par compléter un mot de la fin, puis des bouts de phrases.

## Quand demander conseil
Si votre enfant ne semble pas réagir aux sons ou à la voix, ne se retourne pas quand on l’appelle, ou si son langage vous inquiète, parlez-en au médecin : un contrôle de l’audition peut être proposé. ${URG}

${FIN}`,
  }),
  a({
    slug: 'lire-des-histoires-enfant-1-3-ans',
    title: 'Lire des histoires à un enfant de 1 à 3 ans',
    summary: 'Quels livres proposer, comment lire avec un tout-petit qui tourne les pages trop vite, et pourquoi la lecture partagée compte autant.',
    category: 'activites-eveil', tags: ['lecture', 'livres', 'histoire du soir', 'album', 'imagier', 'bibliothèque', 'langage', 'tout-petit'],
    sources: [S.lireCulture, S.santeCulturelle, S.langage],
    body_md: `## En bref
- La **lecture partagée** soutient et facilite le lien entre le tout-petit et son entourage, rappelle le ministère de la Culture.
- Lire et **feuilleter des livres** fait partie des activités conseillées pour aider l’enfant à parler.
- À cet âge, **tout compte** : regarder les images, nommer, tourner les pages, mâchouiller le coin d’un livre cartonné.
- Les **bibliothèques** proposent souvent des espaces et des séances pour les tout-petits.

## Comprendre
Lire à un enfant de 1 à 3 ans ne ressemble pas toujours à une histoire lue du début à la fin. Il peut tourner plusieurs pages à la fois, revenir en arrière, s’arrêter longtemps sur une image ou partir au bout de deux minutes. Ce n’est pas un échec : il **explore le livre** comme un objet et une source de plaisir partagé.

Le ministère de la Culture souligne que la lecture partagée avec le tout-petit **soutient et facilite le tissage des liens** avec son entourage. La page ministérielle sur l’éveil culturel indique que les arts et la culture nourrissent l’imaginaire et répondent à des besoins cognitifs, émotionnels et d’expression par le langage. Le sac des 1000 premiers jours contient d’ailleurs des albums pour encourager la lecture partagée dès les premières semaines.

Côté langage, mpedia cite **lire et feuilleter des livres** parmi les jeux qui soutiennent les progrès entre 1 et 3 ans.

## Au quotidien
**Quels livres ?**
- **Vers 12–18 mois** : livres cartonnés solides, imagiers, livres à toucher, à rabats, avec des images simples.
- **Vers 18 mois–2 ans** : histoires très courtes avec des répétitions, livres sur le quotidien (le bain, le repas, le coucher), livres-comptines.
- **Vers 2–3 ans** : albums avec une petite intrigue, des personnages auxquels s’identifier, des livres pour parler des émotions ou des grands changements.

**Comment lire ?**
- Installez-vous **confortablement**, l’enfant sur vos genoux ou blotti contre vous.
- **Suivez son rythme** : s’il veut tourner les pages, laissez-le ; s’il s’arrête sur une image, commentez-la.
- **Pointez et nommez** : « Regarde, le chat dort ! » ; posez des questions simples (« Où est le ballon ? »).
- **Jouez avec la voix** : grosse voix du loup, chuchotement, bruitages.
- **Relisez** sans vous lasser : la répétition le rassure et l’aide à anticiper.
- **Laissez des livres à sa portée**, dans un panier bas, pour qu’il les prenne seul.

**Quand lire ?**
- Le soir, comme rituel de coucher, avec une histoire calme.
- Mais aussi à tout moment : dans la salle d’attente, au parc, après la sieste.

**Les livres sans dépenser**
Les bibliothèques et médiathèques prêtent des livres, souvent gratuitement pour les enfants, et beaucoup ont un espace petite enfance. Renseignez-vous à la mairie : certaines proposent des lectures pour les tout-petits.

## Questions fréquentes
**Il ne reste pas assis pendant l’histoire.**
À cet âge, c’est très fréquent. Lisez même s’il bouge autour de vous : il écoute souvent plus qu’il n’y paraît. Proposez des moments courts.

**Il abîme les livres.**
Proposez des livres cartonnés pour l’usage libre, et gardez les livres fragiles pour les moments partagés.

**Faut-il lire le texte ou raconter avec ses mots ?**
Les deux se valent. Adapter le texte à son âge, ajouter des commentaires ou raconter à partir des images enrichit l’échange.

**Une histoire racontée sur une tablette, c’est pareil ?**
Les écrans sont déconseillés avant 3 ans. Le livre papier partagé avec un adulte favorise les échanges et le lien.

## Quand demander conseil
Si votre enfant ne s’intéresse jamais aux images, ne pointe pas du doigt, ne réagit pas quand on l’appelle ou si son langage vous inquiète, parlez-en au médecin ou à la PMI. ${URG}

${FIN}`,
  }),
  a({
    slug: 'ludotheque-bibliotheque-laep-sorties-tout-petit',
    title: 'Ludothèque, bibliothèque, lieu d’accueil enfants-parents : où jouer avec son tout-petit ?',
    summary: 'Des lieux souvent gratuits ou peu coûteux pour jouer, lire, rencontrer d’autres familles et souffler un peu avec un enfant de 1 à 3 ans.',
    category: 'activites-eveil', tags: ['ludothèque', 'bibliothèque', 'LAEP', 'lieu d’accueil enfants-parents', 'PMI', 'sortie', 'gratuit', 'rencontrer d’autres parents'],
    sources: [S.activitesBebe, S.livret1000, S.santeCulturelle],
    body_md: `## En bref
- La mairie peut vous renseigner sur les **ludothèques, bibliothèques, lieux d’accueil enfants-parents (LAEP)** et **centres de PMI** près de chez vous.
- Certains de ces lieux proposent **lectures, petits spectacles ou éveil musical** pour les tout-petits.
- Les **LAEP** permettent de rencontrer des professionnels et d’autres parents, avec votre enfant.
- Ces sorties sont bonnes pour l’enfant **et pour les parents**, qui y trouvent aussi du lien.

## Comprendre
Jouer avec un tout-petit à la maison, jour après jour, peut devenir répétitif et parfois isolant. Les pages de Santé publique France consacrées aux activités avec bébé invitent à **se renseigner à la mairie** sur les ressources locales : ludothèques, bibliothèques, lieux d’accueil parents-enfants, centres de PMI. Certains proposent des **séances de lecture, de petits spectacles ou de l’éveil musical**.

Le livret des 1000 premiers jours cite aussi les **bibliothèques, centres sociaux, musées et théâtres** comme lieux d’éveil artistique et culturel, et présente les **lieux d’accueil enfants-parents** comme des endroits où rencontrer des professionnels et d’autres parents. Le ministère rappelle que bibliothèques, théâtres et musées ont souvent des **espaces dédiés à la petite enfance** et des activités en famille.

**La ludothèque** est un lieu où l’on joue sur place et où l’on peut souvent emprunter des jeux. **La bibliothèque** prête des livres et propose fréquemment un coin petite enfance. **Le LAEP** accueille les jeunes enfants avec un parent (ou un adulte proche) pour jouer, partager et échanger avec des accueillants.

## Au quotidien
**Trouver les lieux**
- Interrogez la **mairie**, le **centre de PMI**, le **relais petite enfance** ou la crèche.
- Consultez l’agenda de la médiathèque : les séances pour les tout-petits sont souvent le matin.
- Demandez aux autres parents du square : le bouche-à-oreille fonctionne bien.

**Préparer la sortie**
- Choisissez un moment où votre enfant est reposé et a mangé, par exemple en dehors de l’heure de la sieste.
- Prévoyez un change, une gourde, une collation, et éventuellement son doudou.
- Pour une première fois, restez peu de temps : il découvre un lieu nouveau, plein de bruits et d’enfants.

**Sur place**
- Laissez-le observer avant de jouer ; certains enfants ont besoin de temps.
- Restez disponible sans tout diriger : c’est aussi l’occasion pour lui de jouer à côté d’autres enfants.
- Profitez-en pour échanger avec les professionnels ou les autres parents sur ce qui vous questionne.

**Les petits plus**
- La ludothèque permet de **tester des jeux** avant d’en acheter, et d’en changer souvent.
- Les spectacles pour tout-petits sont courts et adaptés à leur attention.
- Les musées proposent parfois des visites ou ateliers en famille.

## Questions fréquentes
**Ces lieux sont-ils payants ?**
Les conditions varient selon les communes et les structures : beaucoup sont gratuits ou peu coûteux. Renseignez-vous auprès de la mairie ou du lieu lui-même.

**Mon enfant est gardé en crèche. Ces sorties ont-elles encore un intérêt ?**
Oui : ce sont des moments partagés avec vous, dans un autre cadre, et l’occasion pour vous de rencontrer d’autres parents.

**Il pleure dès qu’il y a du monde.**
Allez-y aux heures calmes, restez près de lui, et écourtez si besoin. L’habitude vient souvent avec des visites courtes et répétées.

**Puis-je aller dans un LAEP si je me sens seul·e ou dépassé·e ?**
Les LAEP sont justement pensés pour accueillir les parents avec leur enfant, sans jugement, et permettre d’échanger. La PMI peut aussi vous accompagner.

## Quand demander conseil
Si la fatigue, l’isolement ou le découragement prennent trop de place, n’attendez pas pour en parler. ${SOUTIEN} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ imitation
  a({
    slug: 'jeux-imitation-faire-semblant-tout-petit',
    title: 'Dînette, poupée, garage : les jeux d’imitation et de faire-semblant',
    summary: 'Vers 18 mois–2 ans, l’enfant commence à « faire semblant » : à quoi servent ces jeux et comment les nourrir avec peu de matériel.',
    category: 'activites-eveil', tags: ['jeu d’imitation', 'faire semblant', 'dînette', 'poupée', 'déguisements', 'jeu symbolique', 'imagination', 'tout-petit'],
    sources: [S.jeuLot, S.langage, S.activitesBebe],
    body_md: `## En bref
- Entre **18 mois et 2 ans**, l’enfant commence à **faire semblant** : nourrir sa poupée, téléphoner, préparer un repas.
- Poupées, dînettes, puis **déguisements et accessoires ménagers** vers 2–3 ans font partie des jeux appréciés à cet âge.
- Ces jeux soutiennent le **langage**, l’imagination et la compréhension du monde.
- Le matériel peut être très simple : boîtes, casseroles, vieux vêtements.

## Comprendre
Le jeu d’imitation, ou jeu de « faire-semblant », apparaît quand l’enfant devient capable de se représenter une chose absente : une boîte devient un gâteau, un bout de bois un téléphone. Un document de PMI sur le jeu situe ce moment **entre 18 mois et 2 ans**, en citant les **poupées, dînettes**, puis, entre 2 et 3 ans, les **outils et accessoires ménagers** et les **déguisements**.

En rejouant ce qu’il vit (le repas, le bain, le coucher, les courses, la crèche), l’enfant **comprend et apprivoise son quotidien**. Il essaie différents rôles, exprime ses émotions, et entraîne son langage : mpedia cite d’ailleurs la **dînette** parmi les jeux qui aident l’enfant de 1 à 3 ans à parler.

Ces jeux se pratiquent seul, avec un adulte ou, un peu plus tard, avec d’autres enfants. Les pages de Santé publique France rappellent que le jeu libre, quand il se déroule dans un cadre sûr, développe **l’autonomie et la créativité**.

## Au quotidien
**Un coin « maison » avec trois fois rien**
- Une boîte en carton qui fait office de four ou de lit de poupée.
- De vraies casseroles légères, des cuillères en bois, des boîtes vides et propres.
- Une poupée ou une peluche à nourrir, à coucher, à promener.
- Un torchon, une petite éponge, un balai à sa taille.

**Faire vivre le jeu**
- **Entrez dans son jeu** quand il vous invite : « Merci pour la soupe ! Elle est bonne ? »
- **Ajoutez une idée** sans prendre la direction : « Ta poupée a peut-être froid ? »
- **Mettez des mots** sur ce qu’il fait et sur ce que ressentent les personnages.
- **Laissez-le inventer** : une banane peut être un téléphone, c’est tout l’intérêt.

**Varier les scénarios**
- Le marchand : quelques fruits, un panier, des « sous » en carton.
- Le docteur : soigner le nounours avec un bandage.
- Le garage : des petites voitures (adaptées à l’âge), une rampe en carton.
- Les déguisements vers 2–3 ans : chapeaux, foulards courts, sacs, vieilles chaussures.

**La sécurité**
- Pas de petites pièces avant 3 ans : vérifiez l’âge indiqué sur les jouets et le pictogramme « ne convient pas aux moins de 36 mois ».
- Les déguisements ne doivent pas comporter de **cordons ou de liens** autour du cou.
- Ne détournez pas de vrais produits ménagers ou cosmétiques, même vides : rincez soigneusement les contenants alimentaires que vous réutilisez.

## Questions fréquentes
**Mon fils joue à la poupée, ma fille aux voitures : faut-il s’en préoccuper ?**
Tous les jeux d’imitation sont bénéfiques. Laissez votre enfant choisir librement ses jeux et ses rôles.

**Il rejoue toujours la même scène, parfois une colère ou un vaccin.**
Rejouer une situation marquante l’aide à la digérer. Accompagnez-le avec des mots simples, sans le forcer.

**Faut-il acheter une cuisine en jouet ?**
Ce n’est pas indispensable. Si vous en achetez une, vérifiez le marquage CE et l’âge indiqué.

**Il ne joue pas encore à faire semblant à 2 ans.**
Chaque enfant avance à son rythme. Proposez-lui des jeux en lui montrant l’exemple, et parlez-en au médecin si vous avez d’autres inquiétudes.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant, vers 2–3 ans, ne montre aucun intérêt pour le faire-semblant ni pour les échanges, joue toujours de façon très répétitive, ou si son langage vous inquiète. Le médecin pourra faire le point avec vous et, si besoin, vous orienter. ${URG}

${FIN}`,
  }),
  a({
    slug: 'tout-petit-participe-taches-maison',
    title: 'Ranger, cuisiner, arroser : quand le tout-petit veut « aider » à la maison',
    summary: 'Transformer les gestes du quotidien en jeux d’imitation utiles, en adaptant les tâches à son âge et en sécurisant la maison.',
    category: 'activites-eveil', tags: ['autonomie', 'tâches ménagères', 'aider', 'cuisiner avec son enfant', 'ranger', 'imitation', 'quotidien', 'tout-petit'],
    sources: [S.livret1000, S.jeuLot, S.accidents],
    body_md: `## En bref
- Le tout-petit adore **imiter les adultes** : ranger, balayer, mettre le linge dans la machine.
- Ces moments sont de vraies **occasions d’éveil** : gestes, vocabulaire, autonomie, fierté.
- Adaptez la tâche à son âge et **restez à côté** de lui.
- Gardez **produits ménagers, médicaments et objets coupants** hors de sa portée.

## Comprendre
Le livret des 1000 premiers jours rappelle que les **gestes du quotidien** (repas, bain, change, promenade, coucher) sont autant d’occasions d’interagir avec l’enfant, et que tout peut servir de prétexte au jeu : « vous n’avez pas besoin de grand-chose si ce n’est d’être là pour lui ».

Un document de PMI sur le jeu cite, entre **2 et 3 ans**, les **outils et accessoires ménagers** parmi les jeux appréciés : à cet âge, l’enfant affirme son « je » et veut faire « comme les grands ». Participer aux tâches lui permet d’imiter, de se sentir utile et de découvrir ce que font les adultes.

La sécurité reste centrale : le jeune enfant n’a pas conscience du danger. Les conseils de prévention rappellent de ranger **en hauteur ou sous clé** les produits ménagers, médicaments et cosmétiques, de ne jamais transvaser un produit ménager dans une bouteille de boisson, et de garder l’enfant éloigné des plaques et des liquides chauds.

## Au quotidien
**Vers 12–18 mois**
- Mettre les jouets dans un panier (« dedans ! »).
- Vous tendre les chaussettes une par une.
- Déposer son bavoir ou sa cuillère dans l’évier sous votre regard.

**Vers 18 mois–2 ans**
- Mettre le linge sale dans la machine, puis vous le passer pour l’étendre.
- Essuyer la table avec une éponge humide.
- Arroser une plante avec un petit arrosoir (en vérifiant que la plante n’est pas toxique).
- Ranger les courses non fragiles dans un placard bas.

**Vers 2–3 ans**
- Trier les couverts propres (sans couteaux pointus).
- Laver des légumes dans une bassine.
- Mélanger une pâte à gâteau, verser des ingrédients déjà mesurés.
- Assortir les paires de chaussettes : un vrai jeu de logique.

**Les bons réflexes**
- Donnez **une consigne à la fois**, avec des mots simples, et montrez.
- Acceptez que ce ne soit **pas parfait** : l’important est de participer.
- **Félicitez l’effort** plutôt que le résultat.
- Prévoyez du temps : une tâche faite avec lui prend plus longtemps, et c’est tout le principe.

**La sécurité**
- En cuisine, installez-le loin des plaques, des fours et des poignées de casseroles (tournées vers l’intérieur).
- Ne le laissez jamais seul avec un seau d’eau ou une bassine : un jeune enfant peut se noyer dans très peu d’eau.
- Rangez immédiatement produits et outils après usage.

## Questions fréquentes
**Il veut toujours aider quand je suis pressé·e.**
Proposez-lui une version courte de la tâche (« tu ranges les trois cuillères ») ou une alternative proche de vous, et gardez les vraies participations pour les moments plus calmes.

**Faut-il acheter des ustensiles en jouet ?**
Ce n’est pas indispensable : de vrais objets légers et sans danger conviennent souvent mieux. Les jouets doivent porter le marquage CE et être adaptés à son âge.

**Est-ce l’âge pour lui apprendre à ranger ses jouets ?**
On peut commencer tôt, sous forme de jeu (une chanson pour ranger, un bac par type de jouet), en rangeant avec lui.

**Il s’énerve quand il n’y arrive pas.**
Proposez une tâche plus simple, aidez-le juste un peu, et nommez son émotion : « C’est difficile, tu es fâché. »

## Quand demander conseil
En cas d’ingestion d’un produit ménager ou d’un médicament, contactez **immédiatement** un centre antipoison ou le 15, sans faire vomir l’enfant et en gardant l’emballage. En cas de brûlure étendue ou sur le visage, appelez le 15. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ créativité
  a({
    slug: 'peinture-avec-tout-petit',
    title: 'Peindre avec un enfant de 1 à 3 ans : bien démarrer',
    summary: 'Peinture au doigt, au pinceau, au rouleau : comment installer l’activité, choisir le matériel et profiter de ce moment sans stress.',
    category: 'activites-eveil', tags: ['peinture', 'peinture au doigt', 'créativité', 'activité manuelle', 'arts plastiques', 'éveil artistique', 'tout-petit', 'jeux sans écran'],
    sources: [S.jeuLot, S.jouets, S.santeCulturelle],
    body_md: `## En bref
- La **peinture** figure parmi les jeux cités par la PMI entre **18 mois et 2 ans**.
- À cet âge, l’intérêt est dans **l’expérience** (toucher, étaler, mélanger), pas dans le résultat.
- Choisissez une peinture **destinée aux jeunes enfants**, avec l’âge indiqué et le marquage CE.
- Protégez l’espace, habillez l’enfant d’un vieux t-shirt, et **restez à côté** de lui.

## Comprendre
Peindre permet à l’enfant de découvrir les couleurs, les textures, le lien entre son geste et la trace qu’il laisse. Il développe la motricité de la main et du bras, la coordination œil-main, et il s’exprime à sa manière. Le ministère chargé des solidarités rappelle que l’éveil artistique et culturel **favorise la curiosité, la construction et l’épanouissement** de l’enfant et nourrit l’imaginaire.

Un document de PMI sur le jeu cite la **peinture** et la **pâte à modeler** parmi les jeux de 18 mois à 2 ans, puis les crayons, papiers et gommettes entre 2 et 3 ans.

Pour le matériel, les conseils officiels de choix des jouets s’appliquent : **marquage CE**, lecture des avertissements et de **l’âge indiqué** sur l’emballage, et vigilance avec les produits qui ne sont pas conçus pour les enfants. Le tout-petit porte encore souvent les mains à la bouche : la surveillance d’un adulte reste indispensable.

## Au quotidien
**Installer l’atelier**
- Une grande feuille scotchée sur la table ou au sol, sur une nappe cirée ou du papier journal.
- Un vieux t-shirt ou un tablier, manches relevées.
- Peu de couleurs à la fois (deux ou trois), dans des barquettes stables.
- Un gant humide à portée de main pour essuyer.

**Les techniques selon l’âge**
- **Vers 18 mois** : peinture au doigt ou à la main, sur une grande surface. Il découvre la sensation, il étale, il tapote.
- **Vers 2 ans** : gros pinceaux, éponges, petits rouleaux, tampons faits maison (bouchons, pommes de terre coupées par l’adulte).
- **Vers 2–3 ans** : peindre sur un carton, un galet, un grand rouleau de papier au sol ; mélanger deux couleurs pour en voir apparaître une troisième.

**Accompagner sans diriger**
- Décrivez ce qu’il fait : « Tu fais des ronds bleus », « Tu as mélangé le jaune et le rouge ».
- Évitez de demander « Qu’est-ce que c’est ? » : il n’a souvent pas cherché à représenter quelque chose.
- Acceptez qu’il peigne aussi ses mains, ou qu’il préfère toucher plutôt que peindre.
- Affichez une de ses œuvres : il en sera fier.

**Après l’activité**
- Rangez la peinture hors de sa portée.
- Lavez-lui les mains et le visage.
- Proposez-lui d’aider à nettoyer les pinceaux dans une bassine, sous votre surveillance.

## Questions fréquentes
**Quelle peinture choisir ?**
Une peinture vendue pour les jeunes enfants, dont l’emballage indique l’âge minimal et porte le marquage CE. Évitez les peintures pour adultes ou pour le bricolage.

**Il met la peinture à la bouche.**
Rappelez calmement que la peinture ne se mange pas, essuyez-lui la bouche, et faites une pause dans l’activité si cela se répète. Lisez les avertissements de l’emballage et, en cas de doute ou de quantité importante avalée, contactez un centre antipoison.

**Il en met partout. Comment rester serein·e ?**
Protégez largement, choisissez un moment où vous avez le temps, et gardez l’activité courte. Dehors, l’été, c’est encore plus simple.

**À quel âge peut-il peindre seul ?**
À cet âge, un adulte reste toujours à côté. L’autonomie viendra progressivement en grandissant.

## Quand demander conseil
En cas d’ingestion d’un produit qui n’est pas destiné aux enfants (peinture pour murs, solvant, colle forte…), contactez immédiatement un centre antipoison ou le 15, sans faire vomir et en gardant l’emballage. Pour une projection dans l’œil, rincez abondamment à l’eau et demandez un avis médical. ${URG}

${FIN}`,
  }),
  a({
    slug: 'pate-a-modeler-tout-petit',
    title: 'Pâte à modeler et pâtes à malaxer : dès quand et comment ?',
    summary: 'Malaxer, écraser, rouler, découper : les bienfaits de la pâte à modeler entre 18 mois et 3 ans, et les précautions à prendre.',
    category: 'activites-eveil', tags: ['pâte à modeler', 'motricité fine', 'activité manuelle', 'créativité', 'jeux calmes', 'tout-petit', 'sécurité jouets', 'jeux sans écran'],
    sources: [S.jeuLot, S.jouets, S.accidents],
    body_md: `## En bref
- La **pâte à modeler** fait partie des jeux cités par la PMI **entre 18 mois et 2 ans**.
- Elle muscle les doigts, développe la **motricité fine** et l’imagination, et apaise souvent.
- Choisissez un produit dont **l’âge indiqué** correspond à votre enfant et qui porte le **marquage CE**.
- Restez près de lui : à cet âge, tout peut finir à la bouche, et les petits morceaux peuvent faire **fausse route**.

## Comprendre
Écraser, pincer, rouler un boudin, faire des boules, enfoncer un doigt ou un bouchon : la pâte à modeler offre une expérience à la fois sensorielle et motrice. L’enfant découvre la résistance de la matière, la transformation des formes, la satisfaction de « faire ». Elle se prête aussi aux jeux de faire-semblant : un gâteau d’anniversaire, des serpents, des crêpes…

Un document de PMI sur le jeu situe la **pâte à modeler** entre **18 mois et 2 ans**, à côté de la peinture, des puzzles et des dînettes. Ces activités calmes complètent les jeux de mouvement.

Côté sécurité, les conseils officiels sur les jouets rappellent de vérifier le **marquage CE**, de lire les **avertissements** et notamment la mention « ne convient pas aux moins de 36 mois », et de manipuler l’objet avant achat si possible. Les conseils de prévention des accidents domestiques insistent sur le risque d’étouffement par **les petits objets** : avant 3 ans, ce qui est petit peut être porté à la bouche et inhalé.

## Au quotidien
**Démarrer simplement**
- Une table dégagée, un set de table lavable ou une planche.
- Une petite quantité de pâte, d’une ou deux couleurs.
- Quelques outils sans danger : rouleau en bois, emporte-pièces sans arêtes coupantes, bouchons, fourchette en plastique pour faire des traces.

**Des idées selon l’âge**
- **Vers 18 mois–2 ans** : écraser avec la paume, faire des trous avec le doigt, arracher des morceaux, cacher un objet de grande taille dans la pâte.
- **Vers 2 ans** : rouler des boudins (des « serpents »), faire des boules, aplatir au rouleau, découper avec un emporte-pièce.
- **Vers 2–3 ans** : fabriquer un « gâteau » avec des bougies en bâtonnets, faire des empreintes d’objets, raconter une petite histoire avec des personnages en pâte.

**Accompagner**
- Mettez des mots : « long », « rond », « aplati », « gros », « petit ».
- Faites à côté de lui plutôt qu’à sa place : il imitera vos gestes s’il en a envie.
- Proposez l’activité quand il est calme et disponible, pas quand il a faim.

**Ranger**
- Refermez bien les pots après usage pour éviter qu’ils sèchent, et rangez-les hors de sa portée.
- Ramassez les miettes de pâte tombées au sol, qu’un plus petit pourrait avaler.

## Questions fréquentes
**Peut-on proposer de la pâte à modeler avant 18 mois ?**
Fiez-vous à l’âge indiqué sur l’emballage. Avant cet âge, l’enfant porte encore très souvent les objets à la bouche ; d’autres jeux sensoriels sous surveillance peuvent mieux convenir.

**Il en a mangé un morceau.**
Gardez l’emballage, lisez les informations qui y figurent et, en cas de doute, appelez un centre antipoison. S’il tousse, s’étouffe ou a du mal à respirer, appelez immédiatement le 15 ou le 112.

**Et la pâte à modeler « maison » ?**
Si vous en préparez une, rappelez-vous qu’elle peut être très attirante à goûter : surveillez l’enfant de près et conservez-la hors de sa portée. En cas d’ingestion importante, demandez conseil à un centre antipoison.

**Il mélange toutes les couleurs.**
C’est souvent ce qui l’amuse le plus. Si cela vous gêne, proposez une seule couleur à la fois ou un pot « de mélange » dédié.

## Quand demander conseil
Si votre enfant **s’étouffe** (il ne peut plus tousser, parler ou respirer), appelez le **15** ou le **112** et suivez les consignes. Pour toute ingestion d’un produit inconnu ou en grande quantité, contactez un centre antipoison. Si sa motricité fine vous semble en retard ou s’il évite systématiquement de toucher certaines matières, parlez-en au médecin. ${URG}

${FIN}`,
  }),
  a({
    slug: 'gribouillages-crayons-gommettes-tout-petit',
    title: 'Premiers gribouillages, crayons et gommettes',
    summary: 'Du gribouillis aux premiers ronds : comment accompagner l’envie de dessiner du tout-petit, avec quel matériel et quelles précautions.',
    category: 'activites-eveil', tags: ['dessin', 'gribouillage', 'crayons', 'gommettes', 'craies', 'motricité fine', 'créativité', 'tout-petit'],
    sources: [S.jeuLot, S.jouets, S.santeCulturelle],
    body_md: `## En bref
- Entre **2 et 3 ans**, la PMI cite **crayons, papiers et gommettes** parmi les jeux appréciés.
- Avant, l’enfant peut déjà laisser des traces avec de **gros crayons** ou des craies, sous surveillance.
- Le gribouillage est une étape : il précède les traits, les ronds, puis les premiers « bonshommes ».
- Choisissez du matériel **adapté à l’âge** (indication sur l’emballage, marquage CE).

## Comprendre
Le premier gribouillage est souvent une découverte : l’enfant remarque que son geste laisse une trace. Peu à peu, il contrôle mieux son bras, puis son poignet et ses doigts. Les traits deviennent des allers-retours, des tourbillons, des ronds. Il n’y a pas de « bon » dessin à cet âge : ce qui compte, c’est le plaisir du geste et de la trace.

Un document de PMI sur le jeu situe les **crayons, papiers et gommettes** entre **2 et 3 ans**, période où l’enfant « manipule tout » et affirme son « je ». Les gommettes entraînent la pince entre le pouce et l’index, utile pour la future tenue du crayon.

Le ministère chargé des solidarités rappelle que l’éveil artistique **favorise la curiosité, la construction et l’épanouissement** de l’enfant, et l’aide à exprimer ce qu’il ressent.

Pour le matériel, les conseils officiels sur les jouets s’appliquent : lire **l’âge indiqué** et les avertissements, vérifier le **marquage CE**, et ranger hors de portée les petits objets attrayants pour les plus jeunes (capuchons, petites gommettes).

## Au quotidien
**Le matériel**
- **Gros crayons** ou craies épaisses, faciles à tenir à pleine main.
- **De grandes feuilles** scotchées sur la table ou au sol : le tout-petit dessine avec tout le bras.
- **Des gommettes** de taille suffisante, à décoller et coller (vers 2–3 ans).
- **Des craies** pour dessiner dehors, sur le trottoir de la cour ou une ardoise.

**Des idées**
- Un grand rouleau de papier au sol : on dessine à plusieurs, à genoux.
- Dessiner en musique : gestes lents pour une musique douce, rapides pour une musique entraînante.
- Coller des gommettes sur une forme tracée par l’adulte (un rond, un arbre).
- Faire des traces dans une fine couche de sable ou de farine sur un plateau, avec le doigt.

**Accompagner**
- Commentez ce qu’il fait : « Tu fais de grands traits », « Tu as choisi le vert ».
- Évitez de lui demander ce qu’il a dessiné ; laissez-le en parler s’il le souhaite.
- Proposez un espace autorisé (la feuille, l’ardoise) quand il dessine sur les murs, sans gronder trop fort : il découvre les limites.
- Exposez certains dessins, rangez-en d’autres dans une boîte à souvenirs.

**La sécurité**
- Restez à côté de lui : capuchons et petites gommettes peuvent être portés à la bouche.
- Rangez feutres, stylos et ciseaux hors de sa portée après l’activité.

## Questions fréquentes
**Il tient son crayon à pleine main.**
C’est la prise habituelle des tout-petits. La tenue du crayon entre les doigts s’affine progressivement en grandissant.

**Est-il gaucher ou droitier ?**
Laissez-le utiliser la main qu’il préfère, sans le corriger : sa préférence s’affirmera avec le temps.

**Il gribouille sur les murs.**
Proposez-lui une grande surface autorisée (papier fixé au mur, ardoise). Les craies et crayons lavables facilitent le nettoyage.

**Il ne s’intéresse pas au dessin.**
Chaque enfant a ses préférences. Proposez de temps en temps, sous différentes formes (craies dehors, doigt dans le sable), sans insister.

## Quand demander conseil
Si votre enfant semble avoir des difficultés importantes pour saisir et manipuler les objets, ou si vous avez un doute sur sa motricité ou son développement, parlez-en au médecin ou à la PMI. En cas d’ingestion d’un petit objet ou de gêne respiratoire, appelez le 15. ${URG}

${FIN}`,
  }),
  a({
    slug: 'musique-danse-tout-petit',
    title: 'Musique et danse avec un enfant de 1 à 3 ans',
    summary: 'Instruments faits maison, danse, éveil musical : comment partager la musique avec un tout-petit, et ce que cela lui apporte.',
    category: 'activites-eveil', tags: ['musique', 'danse', 'éveil musical', 'instruments', 'rythme', 'chanson', 'tout-petit', 'jeux sans écran'],
    sources: [S.activitesBebe, S.santeCulturelle, S.jeuLot],
    body_md: `## En bref
- Dès le plus jeune âge, l’enfant est attiré par **la musique, le mime, la danse et le chant**.
- Ces activités favorisent **le langage, l’autonomie et la créativité**, et offrent un moment partagé.
- Des **instruments faits maison** (casserole, boîte de riz bien fermée) suffisent.
- **Danser** est aussi une façon de bouger : cela compte dans ses 3 heures d’activité quotidiennes.

## Comprendre
La page « Les activités avec bébé » de Santé publique France rappelle que le tout-petit est attiré par **la musique, le mime, la danse, la lecture à voix haute et le chant**, et que ces activités favorisent l’apprentissage du langage, l’autonomie et la créativité. Elle suggère de **le faire danser sur sa musique préférée** et indique que certaines ludothèques, bibliothèques ou lieux d’accueil proposent des séances d’**éveil musical**.

Le ministère chargé des solidarités souligne que les modes d’accueil, les lieux d’accueil enfants-parents et les PMI intègrent la **musique, le chant et la danse** dans leurs pratiques, car l’éveil culturel favorise la curiosité et l’épanouissement de l’enfant.

Un document de PMI cite les **disques et comptines** entre 12 et 18 mois et les **rondes** vers 2–3 ans. En musique, l’enfant découvre le rythme, les nuances (fort, doux, vite, lentement), le silence. Il apprend à écouter, à imiter, à attendre son tour pour taper du tambour.

## Au quotidien
**Fabriquer des instruments**
- **Maracas** : une petite bouteille en plastique remplie de riz ou de pâtes, **bouchon collé et scotché** pour qu’il ne puisse pas l’ouvrir.
- **Tambour** : une casserole retournée et une cuillère en bois, ou une boîte en carton.
- **Clochettes** : deux couvercles en métal frappés doucement l’un contre l’autre (attention aux doigts).
- Contrôlez régulièrement l’état des instruments maison : rien ne doit pouvoir se détacher et être avalé.

**Jouer avec la musique**
- **La danse-statue** : on danse, la musique s’arrête, on s’immobilise.
- **Fort / doucement** : taper très fort puis tout doucement, chanter en criant puis en chuchotant.
- **Suivre le rythme** : marcher lentement sur une musique lente, courir sur une musique rapide.
- **Les animaux en musique** : sauter comme une grenouille, ramper comme un serpent.

**Écouter**
- Faites-lui découvrir des musiques variées : chansons pour enfants, musiques du monde, musique classique, musiques de votre culture familiale.
- Gardez un **volume modéré** : les oreilles des tout-petits sont fragiles.
- Préférez l’écoute **audio** à la vidéo : les écrans sont déconseillés avant 3 ans.

**Sortir**
- Renseignez-vous à la mairie ou à la médiathèque sur les séances d’éveil musical ou les petits concerts pour tout-petits.

## Questions fréquentes
**Faut-il un instrument de musique « jouet » ?**
Ce n’est pas indispensable. Si vous en achetez un, vérifiez le marquage CE, l’âge indiqué et que les piles éventuelles sont inaccessibles.

**Il tape très fort sur tout.**
Explorer le bruit l’amuse. Proposez-lui un objet sur lequel il a le droit de taper, et jouez à alterner fort et doucement.

**Les cours d’éveil musical sont-ils utiles avant 3 ans ?**
Ils peuvent être un plaisir partagé, mais ne sont pas nécessaires : chanter et danser ensemble à la maison apporte beaucoup.

**Il n’aime pas les bruits forts.**
Certains enfants sont sensibles au bruit. Respectez sa réaction, baissez le volume et proposez des sons doux.

## Quand demander conseil
Parlez-en au médecin si votre enfant ne réagit pas aux sons, ne se retourne pas quand on l’appelle, ou au contraire semble très fortement gêné par des bruits du quotidien : un contrôle de l’audition ou un avis peut être utile. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ eau, sable
  a({
    slug: 'jeux-d-eau-tout-petit-securite',
    title: 'Jeux d’eau du tout-petit : transvaser, éclabousser… et surveiller',
    summary: 'Bassine, bain, pataugeoire, jardin : des idées de jeux d’eau pour les 1–3 ans et les règles qui évitent la noyade.',
    category: 'activites-eveil', tags: ['jeux d’eau', 'transvasement', 'bassine', 'pataugeoire', 'bain', 'noyade', 'surveillance', 'été'], safety_critical: true,
    sources: [S.noyadeSports, S.accidents, S.recos5ans],
    body_md: `## En bref
- **Barboter dans l’eau** fait partie des activités citées pour faire bouger l’enfant dès 1 an.
- Une noyade peut être **silencieuse** et survenir dans **20 cm d’eau en moins de 3 minutes** ; un bébé peut se noyer dans moins de 5 cm d’eau.
- **Jamais seul près de l’eau**, même une bassine : un adulte reste **à portée de bras** et ne le quitte pas des yeux.
- **Videz** bassines, seaux et pataugeoires après le jeu.

## Comprendre
Transvaser, verser, remplir, vider, faire flotter, éclabousser : l’eau fascine les tout-petits. Ces jeux développent la motricité fine, la coordination et la curiosité. Les recommandations de Santé publique France citent **barboter dans l’eau** parmi les activités ludiques à proposer à partir de 1 an.

Mais l’eau représente aussi un danger majeur. Le ministère des Sports rappelle qu’une noyade peut être **silencieuse** et se produire dans **20 cm d’eau en moins de 3 minutes**. Les conseils de prévention des accidents domestiques précisent qu’un bébé peut se noyer dans **moins de 5 cm d’eau** et qu’il ne faut **jamais le laisser seul près d’un point d’eau**. Les dispositifs de sécurité (barrières, couvertures de piscine, alarmes) sont utiles, mais **aucun équipement ne remplace la vigilance d’un adulte**.

## Au quotidien
**Des idées de jeux d’eau**
- **La bassine de transvasement** : gobelets, entonnoir, passoire, petite cruche, éponges.
- **Le flotte ou coule** : un bouchon, une cuillère, une balle, une feuille…
- **La vaisselle de la dînette** dans une bassine, avec une éponge.
- **L’arrosage** : un petit arrosoir pour les plantes du balcon ou du jardin.
- **La peinture à l’eau** : un pinceau et un seau d’eau pour « peindre » un mur ou le sol dehors.
- **Le bain** : gobelets, éponges, bateaux, à condition de rester à côté.

**Les règles de sécurité**
- Restez **à portée de bras**, sans téléphone ni distraction ; si vous devez vous éloigner, même quelques secondes, **sortez l’enfant de l’eau** et emmenez-le avec vous.
- En présence de plusieurs adultes, désignez **un adulte responsable** de la surveillance de chaque enfant.
- **Videz** systématiquement bassines, seaux, pataugeoires et baignoires après usage.
- Retournez les récipients qui peuvent se remplir de pluie dans le jardin.
- Si vous avez une piscine, **sécurisez l’accès** après la baignade et vérifiez que le dispositif de sécurité est bien utilisé.
- Vérifiez la température de l’eau du bain : elle ne doit pas dépasser 37 °C.

**L’été**
- Jouez à l’ombre, protégez la peau et la tête, proposez à boire régulièrement.
- Évitez les heures les plus chaudes de la journée.

## Questions fréquentes
**Une pataugeoire peu profonde est-elle sûre ?**
Non, pas sans surveillance : quelques centimètres d’eau suffisent pour une noyade chez un tout-petit. Restez à portée de bras et videz-la après le jeu.

**Les brassards suffisent-ils ?**
Les brassards sont préférables aux bouées ou jouets gonflables, mais ils ne remplacent en aucun cas la surveillance constante d’un adulte.

**Mon enfant a avalé de l’eau puis va bien.**
Sortez-le de l’eau et observez-le. S’il tousse, vomit, a du mal à respirer ou s’endort et ne revient pas à son état habituel dans les 5 minutes, appelez les secours.

**Puis-je le laisser jouer dans le bain pendant que je prends une serviette ?**
Non : préparez tout avant le bain. Si vous devez vous éloigner, sortez-le de l’eau et emmenez-le.

## Quand demander conseil
Après un incident dans l’eau, appelez le **15**, le **18** ou le **112** en cas de toux, de vomissements, de difficultés à respirer, ou si l’enfant s’endort et ne retrouve pas son état normal dans les 5 minutes. Appelez immédiatement si l’enfant ne respire pas ou ne réagit pas. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jeux-de-sable-tout-petit',
    title: 'Bac à sable et plage : jouer avec le sable entre 1 et 3 ans',
    summary: 'Pelles, seaux, moules et châteaux : ce que le sable apporte au tout-petit, et les gestes d’hygiène et de protection à garder en tête.',
    category: 'activites-eveil', tags: ['bac à sable', 'sable', 'plage', 'seau et pelle', 'jouer dehors', 'hygiène', 'soleil', 'tout-petit'],
    sources: [S.airesJeux, S.soleil, S.noyadeSante],
    body_md: `## En bref
- Creuser, remplir, tasser, démouler : le sable développe la **motricité fine**, l’imagination et le jeu à plusieurs.
- Les bacs à sable des aires collectives de jeux doivent faire l’objet d’un **contrôle d’hygiène**.
- **Lavez les mains** de l’enfant après le jeu, et évitez qu’il mette le sable à la bouche.
- À la plage, **protégez-le du soleil** et ne le quittez jamais des yeux près de l’eau.

## Comprendre
Le sable est une matière à la fois sensorielle et transformable : sec, il coule ; mouillé, il se moule. L’enfant découvre le plein et le vide, le lourd et le léger, et s’initie aux premiers jeux de construction. Le bac à sable est aussi un lieu de rencontre où l’on apprend à partager une pelle… ou à attendre son tour.

La fiche de la DGCCRF sur les aires collectives de jeux précise que **les bacs à sable doivent être contrôlés sur le plan de l’hygiène**, et que l’aire doit être séparée des dangers comme la route ou les points d’eau. Si le bac vous semble sale ou mal entretenu, mieux vaut jouer ailleurs et le signaler au gestionnaire.

À la plage, deux risques s’ajoutent : **le soleil** et **l’eau**. mpedia rappelle d’éviter l’exposition directe entre 10 h et 16 h environ, de couvrir l’enfant (vêtements, chapeau à larges bords, lunettes de soleil) et d’appliquer une crème solaire adaptée aux enfants sur les zones découvertes.

## Au quotidien
**Le matériel**
- Seau, pelle, râteau, moules, passoire, petit arrosoir : vérifiez l’âge indiqué et le marquage CE.
- Des objets du quotidien conviennent aussi : gobelets, cuillères, boîtes, entonnoir.

**Des idées de jeux**
- **Remplir et vider** : les tout-petits adorent transvaser d’un seau à l’autre.
- **Les pâtés** : tasser le sable humide dans un moule, retourner, démouler.
- **La chasse au trésor** : cacher un gros objet (trop grand pour être avalé) et le retrouver en creusant.
- **Les traces** : empreintes de mains, de pieds, de coquillages.
- **Le chemin d’eau** (à la plage ou avec un arrosoir) : creuser un petit canal et y verser de l’eau, sous surveillance.

**Les bons gestes**
- Jetez un coup d’œil au sable avant le jeu : pas de déchets, de verre, de mégots ni de déjections.
- Rappelez que le sable ne se mange pas et ne se lance pas vers les yeux.
- En cas de sable dans les yeux, ne frottez pas : rincez à l’eau claire.
- Au retour, lavez les mains, secouez les vêtements et les chaussures dehors.

**À la plage**
- Installez-vous à l’ombre, évitez le milieu de journée, couvrez la tête et les épaules.
- Renouvelez la crème solaire au moins toutes les 2 heures et après la baignade.
- Proposez de l’eau régulièrement.
- Près de l’eau, restez **à portée de bras** et sans distraction.

## Questions fréquentes
**Il met du sable à la bouche. Est-ce grave ?**
Le sable peut être souillé : retirez-le de sa bouche, rincez-la à l’eau claire et rappelez la règle calmement. Si l’enfant tousse, s’étouffe ou semble malade ensuite, demandez un avis médical.

**Le bac à sable public est-il propre ?**
Il doit être contrôlé par le gestionnaire. Observez-le avant de jouer, et signalez tout problème grâce aux coordonnées affichées à l’entrée de l’aire.

**Peut-on faire un bac à sable à la maison ?**
Oui, avec un sable adapté au jeu des enfants. Couvrez-le quand il n’est pas utilisé pour éviter que les animaux s’en servent de litière.

**Il ne veut pas prêter sa pelle.**
Partager s’apprend progressivement. Prévoyez si possible deux outils, nommez les émotions et proposez des échanges.

## Quand demander conseil
Consultez si un œil reste rouge ou douloureux malgré le rinçage, si une plaie s’infecte, ou si votre enfant présente des signes de coup de chaleur (fièvre, somnolence, vomissements) après une exposition au soleil. En cas de malaise, appelez le 15. ${URG}

${FIN}`,
  }),
  a({
    slug: 'piscine-familiarisation-eau-1-3-ans',
    title: 'Piscine et bébés nageurs : familiariser son tout-petit avec l’eau',
    summary: 'Pourquoi familiariser tôt l’enfant à l’eau, comment se passent les premières séances à la piscine et pourquoi la surveillance reste totale.',
    category: 'activites-eveil', tags: ['piscine', 'bébés nageurs', 'familiarisation aquatique', 'noyade', 'apprendre à nager', 'eau', 'tout-petit', 'aisance aquatique'], safety_critical: true,
    sources: [S.noyadeSante, S.noyadeSports, S.recos5ans],
    body_md: `## En bref
- À partir de 2 ans, Santé publique France suggère d’**aller à la piscine** pour se familiariser avec l’eau, **à son rythme**.
- Les autorités conseillent de **familiariser l’enfant avec l’eau dès le plus jeune âge** : activité de type **bébé nageur jusqu’à 3 ans**, puis **aisance aquatique** de 4 à 6 ans, et apprentissage de la nage ensuite.
- Être familiarisé avec l’eau **ne protège pas de la noyade** : la surveillance reste totale.
- Dans l’eau, **baignez-vous avec lui** et restez à portée de bras.

## Comprendre
Découvrir l’eau tôt, dans un cadre rassurant, aide l’enfant à s’y sentir à l’aise. La page de Santé.fr sur la prévention des noyades conseille de familiariser les enfants avec le milieu aquatique **dès le plus jeune âge** et de choisir un dispositif adapté à l’âge : **bébé nageur jusqu’à 3 ans**, **aisance aquatique de 4 à 6 ans**, puis **apprentissage de la nage à partir de 6 ans**. Le ministère des Sports indique qu’on peut apprendre à nager vers 3 ou 4 ans, après une familiarisation précoce.

Les recommandations pour les moins de 5 ans évoquent aussi la piscine à partir de 2 ans, **à son rythme**.

Il est essentiel de distinguer **familiarisation** et **sécurité** : être à l’aise dans l’eau ne veut pas dire savoir s’en sortir seul. Le ministère des Sports rappelle que même un enfant qui sait nager doit rester **sous surveillance continue**. Santé.fr souligne aussi que des enfants d’environ 1 an et demi à 2 ans et demi ont échappé à la vigilance de leurs parents **en dehors des temps de baignade** : la vigilance doit continuer hors de l’eau.

## Au quotidien
**Avant la séance**
- Renseignez-vous auprès de la piscine municipale : créneaux bébés nageurs ou « jardin aquatique », âge minimal, conditions.
- Préparez une couche spéciale piscine si l’établissement l’exige, une serviette, un vêtement chaud pour la sortie, un goûter.
- Choisissez un moment où l’enfant est reposé.

**Dans l’eau**
- **Restez dans l’eau avec lui**, à portée de bras, toujours.
- Commencez doucement : s’asseoir au bord, mouiller les pieds, puis entrer dans vos bras.
- Jouez : verser de l’eau avec un gobelet, faire des bulles, faire avancer un jouet flottant.
- Ne le forcez jamais : s’il pleure ou se raidit, faites une pause ou sortez.
- Une séance courte vaut mieux qu’une séance trop longue : surveillez s’il a froid (lèvres bleues, tremblements).

**Après**
- Séchez-le bien, en particulier les plis et les oreilles, et habillez-le chaudement.
- Proposez à boire et une petite collation.

**Au quotidien, hors piscine**
- Ne le laissez jamais seul près d’un point d’eau : piscine, bassin, baignoire, seau.
- Sécurisez l’accès à toute piscine privée **après la baignade**.
- Quand plusieurs adultes sont présents, **désignez un adulte responsable** de chaque enfant.

## Questions fréquentes
**Mon enfant fait les séances bébés nageurs : est-il en sécurité dans l’eau ?**
Non. Ces séances le familiarisent avec l’eau, mais ne le rendent pas capable de se sauver seul. La surveillance active reste indispensable.

**Les brassards permettent-ils de relâcher l’attention ?**
Non. Aucun équipement ne remplace la vigilance d’un adulte, même s’il porte des brassards.

**Il a peur de l’eau.**
Respectez son rythme. Les jeux dans le bain, les arrosoirs ou une bassine au jardin, sous surveillance, peuvent l’aider à s’apprivoiser.

**Dois-je attendre ses 3 ans pour aller à la piscine ?**
Non : les dispositifs de type bébé nageur existent avant 3 ans. Renseignez-vous sur les conditions d’accueil de la piscine.

## Quand demander conseil
Si votre enfant a avalé de l’eau, sortez-le de l’eau. Appelez le **15**, le **18** ou le **112** en cas de toux, de vomissements, de difficultés à respirer, ou s’il s’endort et ne revient pas à son état normal dans les 5 minutes. Si votre enfant a un problème de santé particulier, demandez l’avis de son médecin avant de commencer la piscine. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ sorties
  a({
    slug: 'balade-nature-foret-tout-petit',
    title: 'Balade en forêt et en nature avec un enfant de 1 à 3 ans',
    summary: 'Observer, ramasser, écouter : comment faire d’une sortie nature une vraie aventure pour le tout-petit, avec les bons réflexes contre les tiques.',
    category: 'activites-eveil', tags: ['nature', 'forêt', 'balade', 'promenade', 'jouer dehors', 'tiques', 'éveil sensoriel', 'tout-petit'],
    sources: [S.livret1000, S.activitesBebe, S.tiques],
    body_md: `## En bref
- **Jouer dehors**, surtout dans la nature, favorise les apprentissages, l’attention, l’imagination et le vocabulaire, et aide à réduire le stress.
- Une balade réussie avec un tout-petit est **courte, lente et pleine d’arrêts**.
- Avant de partir : **vêtements longs et clairs**, chapeau, chaussures fermées, eau.
- Au retour : **inspectez tout son corps** à la recherche de tiques, y compris le cuir chevelu.

## Comprendre
Le livret des 1000 premiers jours indique que jouer dehors – en forêt, dans un jardin ou un square – favorise **les apprentissages, l’attention, l’imagination et le vocabulaire** et aide à **réduire le stress**. Les pages « Les activités avec bébé » soulignent que les jeux dehors sont très bénéfiques, **surtout dans la nature**, et que ces sorties sont aussi bonnes pour les parents.

Pour un tout-petit, la nature est une source inépuisable de découvertes : textures (écorce, mousse, cailloux), sons (oiseaux, vent, ruisseau), couleurs, odeurs. Il n’a pas besoin d’aller loin : un court chemin peut l’occuper longtemps.

Les zones boisées, les herbes hautes et les broussailles abritent des **tiques**. Une tique infectée peut transmettre une bactérie responsable de la maladie de Lyme. Santé.fr (RecoSanté) détaille des gestes simples avant, pendant et après la sortie.

## Au quotidien
**Préparer la sortie**
- Habillez votre enfant de **vêtements longs et clairs**, d’un **chapeau** couvrant la tête et la nuque, de chaussures fermées ; rentrez le bas du pantalon dans les chaussettes.
- Emportez de l’eau, une collation, un change, un **tire-tique** acheté en pharmacie.
- Prévoyez le porte-bébé ou la poussette tout-terrain pour la fatigue.

**Pendant la balade**
- Restez sur les **chemins dégagés** et évitez les herbes hautes et les fougères.
- Pour le pique-nique, installez-vous sur une **nappe claire** plutôt que directement au sol.
- Laissez-le marcher, s’arrêter, ramasser des feuilles, des pommes de pin, des bâtons.
- Nommez ce que vous voyez et entendez : « Écoute, un oiseau ! », « La mousse est douce. »
- Jouez à cache-cache derrière un arbre, sautez dans les feuilles mortes, comptez les cailloux.
- Rappelez qu’on ne met **ni baies, ni champignons, ni plantes** à la bouche.

**Au retour**
- **Inspectez tout le corps** : aisselles, arrière des genoux, aine, nombril, oreilles, cou, sans oublier le **cuir chevelu**.
- Refaites une vérification le lendemain.
- Si vous trouvez une tique, retirez-la **sans attendre** avec un tire-tique, en tournant doucement, puis désinfectez. N’appliquez **aucun produit** sur la tique avant de la retirer.
- Lavez-lui les mains et rapportez éventuellement un « trésor » de la balade pour un bricolage.

## Questions fréquentes
**Que faire si la tête de la tique reste dans la peau ?**
Demandez conseil à votre pharmacien ou à votre médecin.

**Peut-on utiliser un répulsif sur un tout-petit ?**
Certains répulsifs ont des restrictions d’âge. Demandez conseil à votre pharmacien ou à votre médecin avant d’en utiliser un sur un enfant de moins de 3 ans.

**Il veut tout ramasser et tout rapporter.**
Fixez une règle simple : un trésor par balade, dans un petit sac. Évitez les plantes inconnues et les champignons.

**Et s’il pleut ?**
Avec des bottes et un vêtement de pluie, la sortie peut devenir un jeu (flaques, bruit de la pluie). Rentrez dès qu’il a froid.

## Quand demander conseil
Après une piqûre de tique, consultez votre médecin si une **plaque rouge qui s’étend** apparaît autour de la piqûre, en cas de fièvre, de fatigue inhabituelle ou de douleurs. En cas d’ingestion d’une plante, d’une baie ou d’un champignon, contactez immédiatement un centre antipoison ou le 15, en gardant si possible un échantillon. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jouer-dehors-ete-soleil-chaleur-tout-petit',
    title: 'Jouer dehors l’été avec un tout-petit : soleil et chaleur',
    summary: 'Horaires, vêtements, chapeau, lunettes, crème et hydratation : profiter de l’été avec un enfant de 1 à 3 ans en le protégeant du soleil et de la chaleur.',
    category: 'activites-eveil', tags: ['soleil', 'chaleur', 'canicule', 'crème solaire', 'chapeau', 'été', 'coup de chaleur', 'jouer dehors'], safety_critical: true,
    sources: [S.soleil, S.canicule, S.activitesBebe],
    body_md: `## En bref
- Évitez le soleil direct **entre 10 h et 16 h environ** : sortez tôt le matin ou en fin d’après-midi, cherchez l’ombre.
- Protégez d’abord par les **vêtements** : manches longues amples, **chapeau à larges bords**, lunettes de soleil (catégorie 3 ou 4, marquage CE).
- Sur les zones découvertes, une **crème solaire pédiatrique très haute protection**, renouvelée au moins toutes les 2 heures et après la baignade.
- **Proposez à boire régulièrement** et ne laissez jamais l’enfant dans une voiture, même très peu de temps.

## Comprendre
Les tout-petits sont particulièrement sensibles au soleil et à la chaleur. Selon mpedia, il faut éviter l’exposition directe aux heures les plus ensoleillées (environ 10 h–16 h) et protéger l’enfant **même pour une courte sortie**. La crème solaire **ne permet pas de rester plus longtemps au soleil** et ne protège pas totalement : elle complète les vêtements et l’ombre.

Santé publique France rappelle que le **coup de chaleur** (hyperthermie) concerne en priorité les nouveau-nés et les jeunes enfants. En période de fortes chaleurs, il faut faire boire l’enfant régulièrement, l’habiller léger, éviter de sortir aux heures chaudes et **ne jamais le laisser dans un véhicule ou une pièce mal ventilée**, même pour une très courte durée.

La page « Les activités avec bébé » de Santé publique France rappelle de penser à **emporter de l’eau** et à protéger l’enfant du soleil à chaque sortie.

## Au quotidien
**Organiser la journée**
- Sortez **le matin** ou **en fin d’après-midi** ; gardez les heures chaudes pour la sieste et les jeux calmes à l’intérieur, volets fermés.
- Au parc, choisissez les zones ombragées et faites des pauses à l’abri.

**Habiller et protéger**
- Vêtements **amples**, couvrants, légers ; maillot anti-UV pour l’eau.
- **Chapeau à larges bords** plutôt qu’une casquette, qui laisse la nuque et les oreilles exposées.
- **Lunettes de soleil** adaptées aux enfants, catégorie 3 ou 4, avec le marquage CE.
- **Crème solaire** pédiatrique, très haute protection, résistante à l’eau, à appliquer 15 à 30 minutes avant de sortir ; sans oublier les oreilles, la racine des cheveux et le dessus des pieds.

**Hydrater et rafraîchir**
- Proposez de l’eau **souvent**, sans attendre qu’il la réclame.
- Rafraîchissez-le avec un linge humide ou un brumisateur.
- Jeux d’eau à l’ombre, sous surveillance constante.

**Les signes à surveiller**
Crampes, fatigue inhabituelle, nausées, vomissements, maux de tête : arrêtez l’activité, mettez-le au frais, faites-le boire et rafraîchissez-le.

## Questions fréquentes
**S’il a déjà la peau bronzée, faut-il continuer à le protéger ?**
Oui. Une peau qui a bruni n’est pas protégée pour autant : continuez la protection.

**Faut-il de la crème solaire s’il porte un tee-shirt ?**
Les vêtements protègent les zones couvertes. La crème est à appliquer sur les zones découvertes (visage, mains, jambes, pieds).

**Puis-je le laisser dans la voiture le temps d’un achat rapide ?**
Non, jamais, même quelques minutes : la température dans un véhicule peut monter très vite.

**Combien doit-il boire ?**
Aucune quantité n’est donnée ici : proposez de l’eau régulièrement et demandez conseil à votre médecin si vous avez un doute, notamment s’il est malade.

## Quand demander conseil
Consultez un médecin si les signes liés à la chaleur persistent plus d’une heure ou s’aggravent. Appelez le **15** en cas de malaise, de propos incohérents, de somnolence inhabituelle ou de fièvre après une exposition à la chaleur ou au soleil. Consultez aussi en cas de coup de soleil étendu, avec cloques ou fièvre. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ sans écran
  a({
    slug: 'idees-jeux-maison-sans-ecran-1-3-ans',
    title: 'Une journée à la maison sans écran avec un enfant de 1 à 3 ans : idées concrètes',
    summary: 'Avant 3 ans, les écrans sont déconseillés : des idées de jeux simples, rangées par moment de la journée, pour les jours où l’on reste à la maison.',
    category: 'activites-eveil', tags: ['sans écran', 'jeux à la maison', 'jour de pluie', 'occuper son enfant', 'idées d’activités', 'écrans', 'tout-petit', 'jeux d’intérieur'],
    sources: [S.ecrans, S.recos5ans, S.activitesBebe],
    body_md: `## En bref
- **Avant 3 ans**, aucune exposition aux écrans n’est recommandée, y compris la télévision allumée en fond.
- Le tout-petit apprend en **explorant, touchant et échangeant** avec les adultes.
- Il n’a pas besoin de jouets coûteux : **boîtes, coussins, casseroles, livres** suffisent.
- Alternez **jeux actifs et jeux calmes**, et acceptez aussi des moments où il joue seul.

## Comprendre
Les repères officiels, intégrés au carnet de santé depuis janvier 2025, sont clairs : **pas d’écran avant 3 ans**, y compris la télévision en fond. Les recommandations de Santé publique France expliquent que l’enfant risque de s’habituer à rester devant un écran **sans bouger ni jouer**, alors que ces activités favorisent mieux son développement. La page ministérielle sur les écrans ajoute qu’ils peuvent nuire au sommeil, réduire l’activité physique et diminuer les interactions avec les adultes, essentielles au développement.

Dans la réalité, les journées à la maison peuvent être longues, surtout quand il pleut, quand un parent est seul ou fatigué. Avoir en tête quelques idées simples aide à traverser ces moments. La page « Les activités avec bébé » rappelle qu’il n’y a **pas de durée ni de fréquence type** : on suit le rythme et l’humeur de l’enfant, et on évite les activités trop excitantes le soir.

## Au quotidien
**Le matin : se dépenser**
- Un **parcours de coussins** dans le salon.
- **Danser** sur sa musique préférée, jouer à la danse-statue.
- **Cache-cache** très simple (vous vous cachez derrière une porte, il vous trouve).
- **Les animaux** : marcher comme un ours, sauter comme une grenouille.

**Avant le repas : participer**
- Laver des légumes dans une bassine, mettre la table avec des objets incassables.
- Ranger les courses non fragiles dans un placard bas.

**Après la sieste : explorer**
- **Le panier aux trésors** : objets du quotidien sans danger (cuillère en bois, brosse, gant de toilette, boîte).
- **Le transvasement** : de gros bouchons ou des balles trop grandes pour être avalées, à faire passer d’un récipient à l’autre ; évitez avant 3 ans tout ce qui est assez petit pour être porté à la bouche et avalé.
- **Les cartons** : une maison, un tunnel, une voiture.
- **La pâte à modeler** ou la **peinture**, selon son âge.

**En fin de journée : se poser**
- **Lire des livres**, regarder un imagier ensemble.
- **Puzzles** à grosses pièces, encastrements, gobelets à empiler.
- **Comptines et jeux de doigts**.
- Un bain tranquille, puis le rituel du coucher.

**Les bons réflexes**
- Préparez une **boîte à idées** : quelques jeux rangés hors de vue, ressortis les jours difficiles.
- Faites **tourner les jouets** : moins de jouets à la fois, plus d’intérêt.
- Sortez quand même un peu, même par temps gris : quelques minutes dehors changent souvent l’ambiance.

## Questions fréquentes
**Et quand j’ai besoin de 10 minutes pour cuisiner ou me doucher ?**
Installez-le en sécurité près de vous avec un jeu qu’il aime (casseroles, bac de jouets, livres), ou dans son lit le temps de la douche. Mieux vaut un moment de jeu seul en sécurité qu’un écran.

**La télévision allumée en fond, est-ce un écran ?**
Oui : les recommandations demandent d’éviter aussi la télévision en fond avant 3 ans.

**Il réclame le téléphone qu’il voit chez les autres.**
Proposez-lui un vieux téléphone éteint pour jouer à « faire semblant », et limitez votre propre usage devant lui.

**Je n’ai pas d’idées, je suis épuisé·e.**
Les jours difficiles, le simple fait d’être là, de le laisser jouer près de vous et de sortir prendre l’air suffit. Demander du relais à un proche ou en parler à la PMI peut aider.

## Quand demander conseil
Si votre enfant semble ne pas s’intéresser aux jeux ni aux échanges, ou si vous vous sentez dépassé·e, parlez-en au médecin ou à la PMI. ${SOUTIEN} ${URG}

${FIN}`,
  }),
  a({
    slug: 'television-en-fond-telephone-parents-tout-petit',
    title: 'Télévision allumée en fond, téléphone des parents : ce que cela change pour le tout-petit',
    summary: 'Pourquoi les repères officiels visent aussi la télévision en fond et l’usage des écrans par les adultes, et comment s’organiser en famille.',
    category: 'activites-eveil', tags: ['écrans', 'télévision', 'téléphone', 'technoférence', 'écran en fond', 'parents', 'interactions', 'tout-petit'],
    sources: [S.ecrans, S.arreteEcrans, S.livret1000],
    body_md: `## En bref
- Avant 3 ans, les repères officiels déconseillent toute exposition aux écrans, **y compris la télévision en fond**.
- Ils invitent aussi les parents à **limiter leur propre usage** des écrans en présence de l’enfant.
- Les interruptions liées aux écrans (**« technoférences »**) peuvent réduire les échanges dont l’enfant a besoin pour son langage et ses relations.
- Depuis 2025, un arrêté **interdit l’exposition aux écrans des 0–3 ans dans les lieux d’accueil du jeune enfant**.

## Comprendre
On pense souvent aux écrans que l’enfant regarde. Mais le tout-petit est aussi exposé aux écrans **des autres** : une télévision allumée pendant qu’il joue, un téléphone consulté pendant le repas ou le bain.

La page ministérielle sur les écrans indique que, chez les jeunes enfants, les écrans peuvent **réduire les interactions avec les adultes**, essentielles au développement. Les interruptions provoquées par les écrans, appelées **technoférences**, peuvent affecter le langage, l’attention et les compétences émotionnelles et sociales. Les repères recommandent donc, avant 3 ans, **aucune exposition aux écrans, y compris la télévision en fond**, et invitent les parents à **limiter leur usage** autour de l’enfant.

L’arrêté publié en juillet 2025 interdit l’exposition des enfants de 0 à 3 ans aux écrans (smartphones, tablettes, ordinateurs, télévisions) dans les **lieux d’accueil du jeune enfant**, en s’appuyant sur des travaux reliant l’exposition précoce à des troubles du sommeil, de la vision et du développement.

Le livret des 1000 premiers jours le résume ainsi : votre enfant **n’a pas besoin d’écrans** ; il apprend en explorant, en touchant et en échangeant avec les adultes.

## Au quotidien
**À la maison**
- **Éteignez la télévision** quand personne ne la regarde vraiment ; préférez la radio ou la musique à volume modéré si vous aimez un fond sonore.
- Placez la télévision **hors de la pièce de jeu** si c’est possible.
- Gardez **les repas** et **l’heure avant le coucher** sans écran, pour tous.
- Pas d’écran dans la chambre de l’enfant.

**Votre téléphone**
- Rangez-le dans un endroit fixe (un panier, une étagère) pendant les moments partagés : repas, bain, jeux, lecture.
- Coupez les notifications non urgentes quand vous jouez avec lui.
- Si vous devez l’utiliser, dites-le : « Je réponds à papi et je reviens jouer. »
- Le soir, une fois l’enfant couché, c’est souvent le moment le plus simple pour vos messages.

**En famille**
- Parlez-en avec l’autre parent et les proches qui gardent l’enfant : des règles communes sont plus faciles à tenir.
- Expliquez aux grands-parents ou à la baby-sitter les repères avant 3 ans.

**Avec les aînés**
Si un grand frère ou une grande sœur regarde un programme, installez-le dans une autre pièce, ou profitez-en pour un moment à deux avec le plus petit.

## Questions fréquentes
**Un dessin animé en fond, il ne le regarde même pas.**
Les repères visent justement aussi la télévision en fond : elle capte l’attention par intermittence et réduit les échanges dans la pièce.

**Les appels vidéo avec la famille éloignée sont-ils concernés ?**
Les repères ne détaillent pas ce cas. Un appel court, accompagné par un adulte qui commente et échange, est une situation différente d’un écran utilisé seul ; parlez-en avec votre médecin si vous vous interrogez.

**Je me sens coupable de regarder mon téléphone.**
Il ne s’agit pas d’être parfait, mais de protéger des moments d’échange. Quelques habitudes simples peuvent déjà faire une différence.

**Où trouver de l’aide pour les règles en famille ?**
La plateforme jeprotegemonenfant.gouv.fr propose des guides pratiques par âge.

## Quand demander conseil
Si votre enfant semble peu réagir aux échanges, si son langage vous inquiète, ou si vous avez du mal à réduire l’usage des écrans à la maison, parlez-en au médecin ou à la PMI. Depuis janvier 2025, ces repères figurent dans le carnet de santé de votre enfant. ${URG}

${FIN}`,
  }),
  a({
    slug: 'jeu-libre-jouer-seul-tout-petit',
    title: 'Jouer seul, jeu libre : laisser le tout-petit inventer',
    summary: 'Pourquoi le jeu libre et les moments où l’enfant joue seul sont précieux entre 1 et 3 ans, et comment les rendre possibles en toute sécurité.',
    category: 'activites-eveil', tags: ['jeu libre', 'jouer seul', 'autonomie', 'créativité', 'ennui', 'temps calme', 'tout-petit', 'jouets'],
    sources: [S.activitesBebe, S.livret1000, S.accidents],
    body_md: `## En bref
- Le **jeu libre seul** est bénéfique quand l’enfant joue **dans un espace sécurisé** et **pas trop longtemps** : il développe son **autonomie** et sa **créativité**.
- Les **temps calmes** et les moments où il joue seul sont aussi importants que les jeux partagés.
- L’adulte reste **à proximité**, attentif, sans tout diriger.
- Évitez d’**interrompre une découverte en cours** quand ce n’est pas nécessaire.

## Comprendre
La page « Les activités avec bébé » de Santé publique France souligne que les **temps de jeu seul** et les **temps calmes** ont leur importance, à côté des activités partagées. Le jeu libre seul est jugé bénéfique **s’il se déroule à l’abri des accidents et pas trop longtemps** ; il développe l’autonomie et la créativité. La même page invite à **respecter le rythme** de l’enfant : ne pas le forcer à continuer s’il n’en a plus envie, et **ne pas interrompre une découverte en cours**.

Le livret des 1000 premiers jours rappelle que l’enfant n’a besoin de presque rien pour jouer : « vous n’avez pas besoin de grand-chose si ce n’est d’être là pour lui ». Être là ne veut pas dire jouer en permanence à sa place : c’est aussi le regarder, l’encourager d’un mot, être disponible s’il vient vous chercher.

Pour que ce jeu soit possible, l’environnement doit être sûr. Les conseils de prévention des accidents domestiques rappellent que le jeune enfant **ne doit pas être laissé seul** sans surveillance : petits objets, piles bouton, produits ménagers et médicaments hors de portée, meubles fixés, fenêtres sécurisées.

## Au quotidien
**Préparer un espace « oui »**
- Un coin de la pièce où **tout est autorisé** : tapis, quelques jouets adaptés à son âge, livres cartonnés, coussins.
- Rien qui puisse être avalé, renversé ou escaladé jusqu’à une fenêtre.
- Vous restez dans la même pièce, à portée de regard.

**Proposer sans imposer**
- Peu de jouets à la fois, renouvelés régulièrement.
- Des objets « ouverts » qui se prêtent à mille usages : cubes, boîtes, gobelets, foulards, cartons.
- Laissez-le chercher comment faire ; attendez un peu avant d’aider.

**Observer**
- Regardez ce qui l’intéresse : vous aurez de nouvelles idées de jeux.
- Commentez de temps en temps, sans couper son élan : « Tu as mis le gobelet dans la boîte. »

**Les limites**
- Les moments de jeu seul restent **courts** chez le tout-petit et sous votre surveillance.
- Ils ne remplacent pas les échanges, la lecture, les sorties : ce sont des moments complémentaires.

## Questions fréquentes
**Il ne joue jamais seul, il me réclame tout le temps.**
Beaucoup de tout-petits ont besoin de la présence proche de l’adulte. Commencez par jouer à côté de lui, puis reculez un peu, en restant disponible. Les petits moments s’allongent progressivement.

**Il s’ennuie. Dois-je lui proposer une activité ?**
Un léger moment de flottement peut l’amener à inventer. Proposez éventuellement un objet nouveau, sans organiser toute l’activité.

**Est-ce grave s’il joue toujours avec le même jouet ?**
Le tout-petit aime répéter : c’est ainsi qu’il apprend. Proposez d’autres objets à côté, sans retirer celui qu’il préfère.

**Puis-je faire autre chose pendant qu’il joue ?**
Oui, si l’espace est sécurisé et que vous restez à proximité, attentif·ve. Ne le laissez jamais seul près de l’eau, d’une fenêtre ouverte ou d’un escalier.

## Quand demander conseil
Si votre enfant ne semble jamais intéressé par les jouets, joue de façon très répétitive en s’isolant, ou si vous avez un doute sur son développement, parlez-en au médecin ou à la PMI. ${SOUTIEN} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ jouets
  a({
    slug: 'choisir-jouets-securite-1-3-ans',
    title: 'Choisir des jouets sûrs pour un enfant de 1 à 3 ans',
    summary: 'Marquage CE, âge indiqué, pictogramme « moins de 36 mois », piles bouton, aimants, jouets d’occasion : les réflexes pour bien choisir.',
    category: 'securite', tags: ['jouets', 'sécurité des jouets', 'marquage CE', 'moins de 36 mois', 'piles bouton', 'aimants', 'petites pièces', 'RappelConso'], safety_critical: true,
    sources: [S.jouets, S.piles, S.accidents],
    body_md: `## En bref
- Vérifiez le **marquage CE** et **l’âge indiqué** ; ne donnez jamais un jouet portant la mention ou le pictogramme **« ne convient pas aux moins de 36 mois »**.
- Les **piles bouton** et les **aimants** accessibles sont particulièrement dangereux en cas d’ingestion.
- Les **jouets des plus grands** et les objets de collection ne sont pas pour les tout-petits.
- Avant d’acheter, notamment d’occasion, consultez **RappelConso**.

## Comprendre
Entre 1 et 3 ans, l’enfant explore avec les mains… et la bouche. Les petits objets peuvent provoquer un **étouffement**. Les conseils de la DGCCRF et de Santé publique France reposent sur quelques repères simples.

Le **marquage CE** atteste que le jouet est censé respecter les exigences de sécurité européennes. L’**âge indiqué** et les **avertissements** de l’emballage sont essentiels : la mention « ne convient pas aux enfants de moins de 36 mois » signale en général un risque lié à de **petites pièces**.

Les **piles bouton** présentent un risque grave : selon le ministère chargé de la santé, leur ingestion peut provoquer, parfois en moins de 2 heures, des brûlures ou perforations de l’œsophage et des hémorragies ; une **pile déchargée reste dangereuse**. On les trouve dans de nombreux jouets et objets du quotidien (télécommandes, montres, veilleuses, balances, thermomètres…).

Les **aimants** accessibles sont aussi dangereux en cas d’ingestion ; les coffrets d’expériences magnétiques portent un avertissement pour les moins de 8 ans.

Les **vieux jouets** peuvent ne plus respecter les normes actuelles.

## Au quotidien
**Avant l’achat**
- Cherchez le **marquage CE** et lisez **tous les avertissements**.
- Respectez l’**âge indiqué** sur l’emballage.
- Préférez des **mécanismes simples**, sans pièces pliantes qui pincent.
- Vérifiez que le **compartiment à piles** est fermé par une vis ou un système sécurisé.
- Préférez les plastiques **colorés dans la masse** aux jouets peints dont la peinture pourrait s’écailler.
- **Manipulez** le jouet si possible : rien ne doit se détacher facilement.
- En ligne, achetez sur des **sites de confiance**.

**À la maison**
- Lisez les notices avant la première utilisation.
- **Séparez les jouets des aînés** de ceux du tout-petit, et rangez les petits éléments hors de sa portée.
- Gardez les **piles neuves et usagées** hors de portée, dans un contenant fermé.
- Ne laissez pas à sa portée les **objets qui ne sont pas des jouets** : décorations, figurines de collection, modèles réduits.
- Vérifiez régulièrement l’état des jouets : coutures de peluches, pièces fendues, piles accessibles.
- Évitez **colliers, cordons et liens** sur les jouets et vêtements de l’enfant.

**Les jouets d’occasion**
- Vérifiez l’absence de rappel sur **RappelConso**, la présence du marquage CE et le bon état général.

## Questions fréquentes
**Un jouet sans marquage CE est-il forcément dangereux ?**
Un jouet vendu dans l’Union européenne doit porter ce marquage. En son absence, mieux vaut s’abstenir.

**Mon enfant est très éveillé : peut-il avoir un jouet indiqué « 3 ans et + » ?**
L’âge indiqué ne mesure pas l’intelligence de l’enfant mais tient compte des risques, notamment les petites pièces. Respectez-le.

**Les jouets en bois sont-ils plus sûrs ?**
La matière ne suffit pas : vérifiez le marquage CE, l’âge indiqué, l’absence d’échardes et de petites pièces.

**Où signaler un jouet dangereux ?**
Sur **SignalConso**, le service public de signalement des problèmes de consommation.

## Quand demander conseil
En cas d’**ingestion suspectée d’une pile bouton**, même sans symptôme : appelez **immédiatement** un centre antipoison ou le **15**, le **18** ou le **112**, en signalant la pile bouton ; ne donnez rien à boire ni à manger, ne faites pas vomir et gardez l’emballage ou l’objet. Chaque minute compte. Faites de même pour un aimant avalé. Si l’enfant s’étouffe et ne peut plus respirer, appelez immédiatement les secours. ${URG}

${FIN}`,
  }),
];
