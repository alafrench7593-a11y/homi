/** Guide complet — lot 25 (27/10/2026) : maison sûre pièce par pièce (cuisine, salle de bain, escaliers, fenêtres et balcons, chambre, séjour, chauffage, incendie, électricité, produits ménagers, médicaments, plantes, jardin, piscine, animaux, fêtes) et sorties. Articles rédigés avec l’aide d’une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
/** Pages officielles ou de référence françaises réellement lues le 2026-10-27. `published` = date affichée par la page. */
const S = {
  incCuisine: { label: 'Institut national de la consommation (INC) — La cuisine', url: 'https://www.inc-conso.fr/content/la-cuisine', consulted_on: C, published: '2024-08-06' },
  incSdb: { label: 'Institut national de la consommation (INC) — La salle de bain', url: 'https://www.inc-conso.fr/content/la-salle-de-bain', consulted_on: C, published: '2024-08-05' },
  incJardin: { label: 'Institut national de la consommation (INC) — Le jardin', url: 'https://www.inc-conso.fr/content/le-jardin', consulted_on: C, published: '2024-08-05' },
  incChambre: { label: 'Institut national de la consommation (INC) — La chambre d’enfant', url: 'https://www.inc-conso.fr/content/la-chambre-denfant', consulted_on: C, published: '2024-08-05' },
  incUrgences: { label: 'Institut national de la consommation (INC) — Numéros d’urgence, gestes qui sauvent, symboles des produits dangereux', url: 'https://www.inc-conso.fr/content/numeros-durgence-gestes-qui-sauvent-symboles-des-produits-dangereux', consulted_on: C, published: '2025-05-06' },
  incIncendie: { label: 'AQC, INC et CNPP — L’incendie chez soi : comment l’éviter (plaquette)', url: 'https://www.inc-conso.fr/sites/default/files/pdf/Guide_Eviter_Incendie.pdf', consulted_on: C, published: '2015-09' },
  sante1000Accidents: { label: 'Santé.fr (1000 premiers jours) — Éviter les accidents domestiques des enfants', url: 'https://www.sante.fr/eviter-les-accidents-domestiques-des-enfants', consulted_on: C, published: '2025-07-11' },
  santeAccidentsQuotidien: { label: 'Santé.fr (mpedia) — Accidents domestiques : protéger au quotidien votre enfant', url: 'https://www.sante.fr/accidents-domestiques-proteger-au-quotidien-votre-enfant', consulted_on: C, published: '2026-01-26' },
  mpediaAccidents: { label: 'mpedia.fr (Association française de pédiatrie ambulatoire) — Dangers au quotidien, les accidents domestiques', url: 'https://www.mpedia.fr/art-accidents-domestiques/', consulted_on: C, published: '2020-12-23' },
  mpediaRoute: { label: 'mpedia.fr — Accidents, sécurité routière et piéton', url: 'https://www.mpedia.fr/art-prevention-des-accidents-route/', consulted_on: C, published: '2019-07-10' },
  spfDefenestration: { label: 'Santé publique France — Campagne de prévention du risque de défenestration des enfants', url: 'https://www.santepubliquefrance.fr/les-actualites/sante-publique-france-renouvelle-la-campagne-de-prevention-du-risque-de-defenestration-des-enfants', consulted_on: C, published: '2017-05-04' },
  arsNormandie: { label: 'ARS Normandie — Prévention des accidents domestiques (« Fenêtre ouverte, danger »)', url: 'https://www.normandie.ars.sante.fr/fenetre-ouverte-danger-campagne-de-prevention-des-accidents-domestiques', consulted_on: C, published: '2024-03-08' },
  ameliBrulures: { label: 'ameli.fr — Brûlures de la peau : que faire ?', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/brulures-peau', consulted_on: C, published: '2026-04-24' },
  ameliElec: { label: 'ameli.fr — Électrisation et électrocution', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/electrisation-electrocution', consulted_on: C },
  ameliIntox: { label: 'ameli.fr — Intoxication par ingestion : que faire ?', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/intoxication-voie-orale-ingestion', consulted_on: C, published: '2025-09-11' },
  ameliMorsure: { label: 'ameli.fr — Morsure de chien ou de chat', url: 'https://www.ameli.fr/assure/sante/urgence/morsures-griffures-piqures/morsure-chien-chat', consulted_on: C, published: '2017-04-24' },
  ansesIntox: { label: 'Anses — Intoxications accidentelles de l’enfant : quelles sont les plus fréquentes et les plus graves ?', url: 'https://www.anses.fr/fr/content/intoxications-accidentelles-de-lenfant-quelles-sont-les-plus-frequentes-et-les-plus-graves', consulted_on: C, published: '2024-07-03' },
  vigilanses22: { label: 'Vigil’Anses n° 22 (Anses) — Avec quoi s’intoxiquent accidentellement nos enfants et comment l’éviter ?', url: 'https://vigilanses.anses.fr/sites/default/files/VigilAnses_N22.pdf', consulted_on: C, published: '2024-04' },
  ansesHE: { label: 'Anses — Huiles essentielles : risques et précautions', url: 'https://www.anses.fr/fr/content/huiles-essentielles-risques-et-precautions', consulted_on: C, published: '2024-12-17' },
  ansesNicotine: { label: 'Anses — Sachets de nicotine ou de tabac : un risque pour les jeunes', url: 'https://www.anses.fr/fr/content/sachets-de-nicotine-ou-de-tabac-un-risque-pour-les-jeunes', consulted_on: C, published: '2023-11-30' },
  vigilanses4: { label: 'Vigil’Anses n° 4 (Anses) — Cigarettes électroniques : expositions recensées par les centres antipoison', url: 'https://www.anses.fr/system/files/VigilansesN4_Cigaretteselectroniques.pdf', consulted_on: C, published: '2018-02' },
  ansesBillesEau: { label: 'Anses — Keep water beads out of the reach of children (billes d’eau)', url: 'https://www.anses.fr/en/news/keep-water-beads-out-reach-children', consulted_on: C, published: '2021-07-29' },
  ansesAimants: { label: 'Anses — Keep objects containing magnetic balls out of the reach of children (billes aimantées)', url: 'https://www.anses.fr/en/news/keep-objects-containing-magnetic-balls-out-reach-children', consulted_on: C, published: '2021-06-24' },
  ansesPlantesEte: { label: 'Anses — Cet été, à quelles plantes faire attention pour éviter les intoxications ?', url: 'https://www.anses.fr/fr/content/cet-ete-quelles-plantes-faire-attention-pour-eviter-les-intoxications', consulted_on: C, published: '2022-08-01' },
  ansesPlantesDeco: { label: 'Anses — Decorative plants: their ingestion can be toxic (houx, gui, poinsettia)', url: 'https://www.anses.fr/en/content/decorative-plants-their-ingestion-can-be-toxic-both-humans-and-animals', consulted_on: C, published: '2020-12-15' },
  ansesMorsures: { label: 'Anses — Dog bites: knowing the breed is not enough for predicting and preventing the risk', url: 'https://www.anses.fr/en/news/dog-bites-knowing-breed-not-enough-predicting-and-preventing-risk', consulted_on: C, published: '2021-02-08' },
  santeTrier: { label: 'Santé.fr — Trier son armoire à pharmacie : pourquoi ? comment ?', url: 'https://www.sante.fr/trier-son-armoire-pharmacie-pourquoi-comment', consulted_on: C, published: '2023-05-16' },
  ansmParents: { label: 'ANSM — Médicaments en pédiatrie : recommandations générales aux parents et aux prescripteurs', url: 'https://ansm.sante.fr/dossiers-thematiques/medicaments-en-pediatrie-enfants-et-adolescents/recommandations-generales-aux-parents-et-aux-prescripteurs', consulted_on: C, published: '2022-03-10' },
  santeCO: { label: 'Santé.fr — Comment éviter une intoxication au monoxyde de carbone ?', url: 'https://www.sante.fr/comment-eviter-une-intoxication-au-monoxyde-de-carbone', consulted_on: C, published: '2025-07-24' },
  santeSalmonelles: { label: 'Santé.fr (avec l’Institut Pasteur) — Salmonelloses', url: 'https://www.sante.fr/salmonelloses', consulted_on: C, published: '2024-10-30' },
  behReptiles: { label: 'BEH (Institut de veille sanitaire) — Salmonelloses chez des jeunes enfants et exposition aux reptiles domestiques, 2012', url: 'https://beh.santepubliquefrance.fr/beh/2014/1-2/2014_1-2_1.html', consulted_on: C, published: '2014-01-07' },
  spPiscine: { label: 'Service-Public.gouv.fr — Dispositif de sécurité des piscines privées familiales et collectives', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1722', consulted_on: C },
  spDetecteur: { label: 'Service-Public.gouv.fr — Détecteur de fumée : sécurité incendie dans le logement', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F19950', consulted_on: C },
  ecologiePiscines: { label: 'Ministère de la Transition écologique — Protection des piscines et des portes de garages', url: 'https://www.ecologie.gouv.fr/politiques-publiques/protection-piscines-portes-garages', consulted_on: C, published: '2016-10-27' },
  ecologieIncendie: { label: 'Ministère de la Transition écologique — Protection contre les incendies', url: 'https://www.ecologie.gouv.fr/politiques-publiques/protection-contre-incendies', consulted_on: C, published: '2021-07-28' },
  dgccrfPiscines: { label: 'DGCCRF — Piscines : respectez les exigences de sécurité !', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/piscines-respectez-les-exigences-de-securite', consulted_on: C, published: '2025-03-24' },
  dgccrfLits: { label: 'DGCCRF — Lits en hauteur : ce qu’il faut savoir avant d’acheter', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/lits-en-hauteur-ce-quil-faut-savoir-avant-dacheter', consulted_on: C, published: '2020-05-29' },
  dgccrfPuericulture: { label: 'DGCCRF — Articles de puériculture : les clés pour choisir des produits sûrs', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/articles-de-puericulture-les-cles-pour-choisir-des-produits-surs', consulted_on: C, published: '2026-04-28' },
  dgccrfAires: { label: 'DGCCRF — Aires collectives de jeux : accidents et risques', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/accidents-et-risques', consulted_on: C },
  sportsPiscine: { label: 'Ministère des Sports — Piscine privée et jeunes enfants : les règles de sécurité pour prévenir les noyades', url: 'https://www.sports.gouv.fr/piscine-privee-et-jeunes-enfants-les-regles-de-securite-pour-prevenir-les-noyades-10176', consulted_on: C, published: '2026-05-29' },
} satisfies Record<string, ArticleSource>;

/** Phrase de fin commune : l’article informe, il ne remplace pas un professionnel. */
const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, du pharmacien, de la PMI ou des professionnels qui suivent votre enfant._';
const URG = 'En cas d’urgence, appelez le **15** (Samu) ou le **112**, gratuits même depuis un mobile sans crédit ; le **114** (SMS, tchat, visio) pour les personnes sourdes ou malentendantes.';
const CAP = 'Si votre enfant a avalé, touché ou respiré un produit, même sans aucun symptôme, appelez un **centre antipoison** (24 h/24 ; les numéros régionaux sont listés sur ameli.fr), en gardant l’emballage sous les yeux.';

const a = (x: Omit<LibArticle, 'status' | 'journeys' | 'category'> & { journeys?: LibArticle['journeys']; category?: LibArticle['category'] }): LibArticle => ({
  journeys: ['newborn', 'child'], category: 'securite', status: 'to_review', ...x,
});

export const GUIDE_B25: LibArticle[] = [
  // ------------------------------------------------------------------ cuisine
  a({
    slug: 'cuisine-securiser-plaques-four-casseroles-enfant',
    title: 'Sécuriser la cuisine : plaques, four, casseroles et appareils',
    summary: 'La cuisine concentre brûlures, coupures et intoxications : les aménagements et les habitudes qui protègent un jeune enfant pendant que vous cuisinez.',
    tags: ['cuisine', 'sécurité', 'brûlure', 'casserole', 'four', 'plaques', 'micro-ondes', 'biberon', 'fer à repasser', 'accident domestique'],
    min_age_months: 4, max_age_months: 96, safety_critical: true,
    sources: [S.incCuisine, S.ameliBrulures, S.sante1000Accidents],
    body_md: `## En bref
- Selon l’Institut national de la consommation (INC), **24 % des accidents domestiques** ont lieu dans la cuisine : brûlures, coupures, chutes.
- Les **liquides brûlants** (lait, thé, café, huile) causent des brûlures souvent graves ; les enfants de 1 à 5 ans sont très exposés.
- **Manches de casseroles tournés vers le mur**, feux du fond en priorité, four à porte froide ou grille de protection.
- **Produits ménagers en hauteur**, dans un placard fermé, jamais transvasés dans une bouteille alimentaire.
- Un jeune enfant ne reste **jamais seul** dans la cuisine.

## Comprendre
La cuisine réunit tout ce qui attire un tout-petit : des bruits, des odeurs, des poignées à sa hauteur, des placards à ouvrir. L’INC indique que 27 % des brûlures domestiques surviennent dans cette pièce et qu’un quart d’entre elles concernent des enfants de 1 à 5 ans. L’enfant tire sur une nappe, un fil de bouilloire ou un manche de casserole, et reçoit le liquide chaud sur le visage, le cou ou le torse.

Selon ameli.fr, les enfants se brûlent surtout avec des liquides chauds. L’INC souligne aussi que le jeune enfant retire sa main ou son visage de la source de chaleur plus lentement qu’un adulte. Le micro-ondes ajoute un piège : le contenant peut rester tiède alors que le lait ou la purée sont brûlants au centre.

## Au quotidien
**Plaques et casseroles**
- Tournez les manches vers l’intérieur, sans qu’ils dépassent du plan de cuisson, et utilisez d’abord les feux les plus proches du mur.
- Retirez les casseroles inutilisées de la plaque : vous éviterez d’allumer le mauvais feu.
- Gardez bouilloire, soupière et friteuse hors de portée, fil compris.
- L’INC déconseille d’installer la cuisinière sous une fenêtre à rideaux ou près d’une porte, à cause des courants d’air.

**Four et micro-ondes**
- Préférez un four à porte froide (isotherme) ; à défaut, posez une grille de protection devant la vitre.
- Au micro-ondes, vérifiez le temps de chauffe, mélangez bien et goûtez avant de servir. Pour un biberon, agitez puis versez quelques gouttes sur l’intérieur de votre avant-bras.

**Eau chaude et petits appareils**
- Vérifiez la température de l’eau au robinet et apprenez à l’enfant, dès qu’il est en âge, à ouvrir d’abord l’eau froide.
- Débranchez les appareils ménagers après usage.
- Rangez le fer à repasser après chaque utilisation, même froid, ainsi que la table à repasser, qui peut basculer.

**Placards, produits et chaise haute**
- Rangez produits ménagers et médicaments en hauteur, dans un meuble fermé, idéalement à clé ; ne laissez pas traîner les emballages vides.
- Ne mélangez jamais deux produits ménagers : l’INC rappelle que le gaz dégagé est très irritant.
- Attachez l’enfant dans sa chaise haute et éloignez-la de la table, pour qu’il ne puisse pas se repousser du pied.
- Mettez les croquettes et gamelles des animaux hors de sa portée.

## Questions fréquentes
**Faut-il interdire la cuisine à mon enfant ?** Pas forcément. Une barrière de sécurité peut aider aux heures de préparation des repas, mais rien ne remplace un adulte présent. Lorsque vous cuisinez ensemble, choisissez des tâches loin des plaques et du four.

**Un feu prend dans ma poêle : que faire ?** L’INC conseille de couvrir le récipient avec un couvercle ou un linge mouillé. N’y versez jamais d’eau. Éloignez les enfants et appelez le **18** ou le **112** si le feu ne s’éteint pas.

**Comment savoir si le biberon n’est pas trop chaud ?** Agitez-le, puis testez quelques gouttes sur l’avant-bras, comme le recommande ameli.fr : le contenant ne renseigne pas sur la température du lait.

**Un extincteur est-il utile ?** L’INC recommande d’en avoir un, adapté à tous types de feux, à portée de main dans la cuisine.

## Quand demander conseil
En cas de brûlure, refroidissez sans attendre sous l’eau tempérée (environ 20 °C) pendant 20 minutes, sans glace ni crème, puis couvrez d’un linge propre. Selon ameli.fr, appelez le **15** pour tout enfant de moins de 5 ans brûlé, quelle que soit la surface, ainsi que pour une brûlure du visage, des mains, du cou ou du siège. ${CAP} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ salle de bain
  a({
    slug: 'salle-de-bain-securite-enfant-eau-chaude-glissades-appareils',
    title: 'Salle de bain : eau chaude, sol glissant, appareils électriques et petits objets',
    summary: 'Brûlures par l’eau chaude, noyade, chutes et électrisation : comment aménager la salle de bain et organiser le bain pour protéger un jeune enfant.',
    tags: ['salle de bain', 'bain', 'eau chaude', 'brûlure', 'thermomètre de bain', 'mitigeur', 'glissade', 'sèche-cheveux', 'noyade', 'cosmétiques'],
    min_age_months: 0, max_age_months: 96, safety_critical: true,
    sources: [S.incSdb, S.santeAccidentsQuotidien, S.ameliBrulures],
    body_md: `## En bref
- **20 cm d’eau suffisent** à un jeune enfant pour se noyer, sans bruit : il ne reste jamais seul dans le bain, même assis dans un siège.
- L’eau du bain se vérifie au **thermomètre : 37 °C**. Une eau à 60 °C peut brûler gravement un bébé en quelques secondes.
- Préparez tout avant le bain ; ne répondez ni au téléphone ni à la porte.
- **Sol sec, tapis antidérapants**, appareils électriques débranchés et rangés.
- Médicaments, cosmétiques, rasoirs et ciseaux **hors de portée**.

## Comprendre
La salle de bain cumule l’eau, la chaleur, l’électricité et des sols glissants. L’INC rappelle qu’environ 8 000 personnes sont hospitalisées chaque année pour une brûlure, dont plus d’un quart d’enfants de moins de 5 ans, et que trois secondes suffisent à un bébé pour subir une brûlure du troisième degré avec une eau à 60 °C. Le jeune enfant retire sa main ou son corps de l’eau chaude plus lentement qu’un adulte.

La noyade est l’autre danger. mpedia et Santé.fr insistent : avant 3 ans, l’enfant ne reste jamais seul dans le bain, même avec un siège ou un tapis antidérapant, car il peut se noyer en 20 cm d’eau sans faire de bruit. Ameli.fr ajoute qu’un enfant laissé seul peut ouvrir l’eau chaude.

## Au quotidien
**Avant le bain**
- Rassemblez savon, serviette, couche et vêtements à portée de main.
- Faites couler l’eau, mesurez-la avec un thermomètre de bain (37 °C), puis installez l’enfant.
- Si on sonne ou si le téléphone retentit, enveloppez l’enfant dans une serviette et emmenez-le avec vous.

**Limiter les brûlures**
- Un mitigeur préréglé ou un dispositif de contrôle de la température sur les robinets aide, si votre logement le permet.
- mpedia conseille de régler le chauffe-eau au minimum utile ; en logement collectif, renseignez-vous auprès du gestionnaire.
- Apprenez à l’enfant, dès qu’il est en âge, à ouvrir l’eau froide d’abord, puis à ajouter l’eau chaude et à vérifier avant d’y mettre les mains.
- Des protège-robinets en mousse limitent les chocs.

**Éviter les chutes**
- Posez des tapis antidérapants au sol, dans la baignoire et la douche.
- Essuyez le sol dès qu’il est mouillé, même après un simple lavage des mains.

**Électricité**
- Débranchez et rangez sèche-cheveux, rasoir, épilateur, fer à lisser ou chauffage mobile après usage.
- N’utilisez jamais un appareil électrique les pieds sur un sol mouillé, ni près d’une baignoire remplie ou d’un robinet ouvert.
- Rechargez téléphones et tablettes hors de la salle de bain, comme le conseille ameli.fr.

**Placards**
- Médicaments dans une armoire fermée à clé, en hauteur.
- Vernis, dissolvant, parfums, teintures, shampoings et gels douche hors de portée : leurs couleurs attirent les enfants.
- Ciseaux et rasoirs rangés : l’enfant imite les adultes.

## Questions fréquentes
**Le siège de bain permet-il de s’éloigner une minute ?** Non. L’INC et mpedia précisent que siège et tapis antidérapant ne remplacent pas la présence d’un adulte à portée de main.

**Dois-je vider la baignoire tout de suite ?** Oui, videz-la dès la sortie du bain, et ne laissez pas de bassine ou de seau rempli : une noyade peut survenir dans très peu d’eau.

**Et quand l’enfant grandit ?** Continuez à rester présent et à vérifier la température. Expliquez-lui les règles du robinet et le danger des appareils électriques près de l’eau.

## Quand demander conseil
En cas de brûlure par eau chaude, refroidissez sous l’eau tempérée (environ 20 °C) pendant 20 minutes et appelez le **15** pour tout enfant de moins de 5 ans, quelle que soit la surface brûlée. Si l’enfant a avalé de l’eau et tousse, vomit, respire mal ou reste somnolent, appelez les secours. ${CAP} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ escaliers
  a({
    slug: 'escaliers-barrieres-securite-apprendre-monter-descendre',
    title: 'Escaliers : barrières de sécurité et apprentissage de la montée et de la descente',
    summary: 'Où poser les barrières, comment les choisir, jusqu’à quand les garder et comment apprendre à l’enfant à utiliser l’escalier en sécurité.',
    tags: ['escalier', 'barrière de sécurité', 'chute', 'trotteur', 'rampe', 'marche arrière', 'quatre pattes', 'aménagement maison'],
    min_age_months: 6, max_age_months: 60, safety_critical: true,
    sources: [S.sante1000Accidents, S.mpediaAccidents, S.dgccrfPuericulture],
    body_md: `## En bref
- Dès que bébé se déplace, installez des **barrières de sécurité en haut et en bas** de l’escalier.
- Choisissez un article conforme : étiquetage en français, âge d’utilisation, notice de montage et avertissements.
- Le **trotteur** est déconseillé : selon mpedia, 80 % des accidents de trotteur sont des chutes dans l’escalier.
- Ensuite, **apprenez à l’enfant** à monter et descendre en se tenant à la rampe ou en marche arrière.
- Une barrière ouverte ou mal fixée ne protège pas : refermez-la à chaque passage.

## Comprendre
Le jeune enfant explore à quatre pattes, se met debout en s’agrippant, puis marche, sans mesurer la hauteur ni le vide. L’escalier l’attire, et une chute peut entraîner un traumatisme crânien. Santé.fr (1000 premiers jours) recommande des barrières en haut et en bas des marches et d’apprendre progressivement aux plus grands à se tenir à la rampe.

Le trotteur aggrave ce risque. mpedia indique qu’il est sans intérêt pour le développement de la marche, que la grande majorité de ses accidents sont des chutes dans l’escalier et que plus de trois quarts surviennent en présence des parents. Il permet aussi d’atteindre plus vite casseroles et tasses chaudes.

Les barrières de sécurité font partie des articles de puériculture contrôlés par la DGCCRF : elles doivent être stables, ne pas pouvoir être déverrouillées par l’enfant et ne pas le blesser.

## Au quotidien
**Choisir la barrière**
- Lisez l’emballage : nom et adresse du fabricant, référence du modèle, âge et précautions d’emploi, en français.
- Vérifiez à l’achat la solidité du verrouillage et du système de fixation.
- La DGCCRF signale qu’un article d’occasion peut être moins sûr : sans notice, avec des pièces usées. Vérifiez son fonctionnement et ne vous fiez pas à son aspect propre.

**L’installer**
- Suivez la notice à la lettre. En haut de l’escalier, préférez le modèle et la fixation recommandés par le fabricant pour cet emplacement.
- Contrôlez régulièrement les fixations et le verrou.
- Ne modifiez jamais une barrière ni ne réparez vous-même une pièce cassée : contactez le service après-vente.

**Les bons réflexes**
- Refermez la barrière à chaque passage, même pour quelques secondes.
- Ne laissez ni jouets ni objets sur les marches.
- Gardez l’escalier éclairé et dégagé.
- Évitez de porter l’enfant dans l’escalier les bras chargés : gardez une main libre pour la rampe.

**Apprendre l’escalier**
- Quand l’enfant est prêt, montez avec lui en le laissant poser les mains sur les marches.
- Pour descendre, apprenez-lui la marche arrière, à quatre pattes, comme le suggère mpedia.
- Plus grand, il descend face à l’escalier en se tenant à la rampe, un adulte juste en dessous.
- Gardez les barrières tant qu’il ne maîtrise pas seul la montée et la descente.

## Questions fréquentes
**Une seule barrière en haut suffit-elle ?** Les recommandations citent le haut et le bas : en bas pour qu’il ne grimpe pas seul, en haut pour éviter la chute.

**Mon enfant escalade la barrière : que faire ?** Ne placez rien à côté qui puisse servir de marchepied. Lorsqu’il commence à l’enjamber, la barrière devient un risque à son tour : renforcez l’apprentissage et la surveillance.

**Le trotteur peut-il servir au rez-de-chaussée ?** mpedia le déconseille dans tous les cas : en plus des escaliers, il expose aux brûlures et n’aide pas la marche. Le tapis d’éveil et le jeu au sol sont préférables.

## Quand demander conseil
Après une chute dans l’escalier, appelez le **15** si l’enfant a perdu connaissance, vomit à plusieurs reprises, est somnolent, pleure de façon inhabituelle, ne bouge plus un membre ou si son comportement change. Pour un bébé de moins d’un an, n’hésitez pas à demander un avis médical après une chute, même s’il semble bien. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ fenêtres et balcons
  a({
    slug: 'fenetres-balcons-prevenir-chutes-defenestration-enfant',
    title: 'Fenêtres et balcons : prévenir les chutes de grande hauteur',
    summary: 'Chaque année, des enfants tombent d’une fenêtre ou d’un balcon, souvent en présence d’un adulte : les situations à risque et les gestes simples qui protègent.',
    tags: ['fenêtre', 'balcon', 'défenestration', 'chute', 'bloque-fenêtre', 'meuble sous la fenêtre', 'été', 'appartement'],
    min_age_months: 9, max_age_months: 120, safety_critical: true,
    sources: [S.spfDefenestration, S.incChambre, S.arsNormandie],
    body_md: `## En bref
- Les chutes de grande hauteur concernent surtout les **enfants de moins de 6 ans**, qui n’ont pratiquement pas le sens du vide.
- Dans **la moitié des cas**, un meuble se trouvait sous la fenêtre ; dans **82 % des cas**, un adulte était dans le logement.
- **Rien sous les fenêtres** ni sur le balcon qui puisse servir de marchepied.
- **Bloque-fenêtres** hors de portée de l’enfant ; mais aucun dispositif ne remplace la vigilance.
- Les accidents surviennent surtout **au printemps et en été**, aux heures de préparation des repas.

## Comprendre
Santé publique France rappelle que plusieurs dizaines d’enfants tombent accidentellement d’une fenêtre ou d’un balcon chaque année. Son enquête de 2013 apporte des repères précieux : 62 % des enfants avaient moins de 6 ans, l’ouverture était protégée dans près de la moitié des cas, un meuble se trouvait sous l’ouverture une fois sur deux, et un adulte était présent dans le logement dans 82 % des cas. Autrement dit, ces chutes surviennent pendant les gestes banals du quotidien.

L’INC souligne qu’avant 6 ans l’enfant ne mesure pas le danger de se pencher. Les fenêtres basses sont risquées, et les fenêtres hautes aussi, car l’enfant grimpe sur une chaise, un lit, un coffre à jouets ou un cheval à bascule. Sur le balcon, un ballon, une chaise ou un pot de fleurs suffit pour se hisser.

## Au quotidien
**Organiser les pièces**
- Éloignez des fenêtres lits, canapés, chaises, coffres, bureaux et jouets à grimper.
- Vérifiez chaque pièce, y compris la chambre des aînés et la salle de bain.
- Sur le balcon, ne laissez ni chaise, ni table, ni bac, ni jouet sur lequel l’enfant pourrait monter, et vérifiez qu’il ne peut pas passer entre les barreaux.

**Équiper les ouvertures**
- Installez un système qui bloque l’ouverture des battants, placé hors de portée de l’enfant ; l’INC cite aussi les barrières scellées dans le mur.
- Fermez la porte-fenêtre du balcon quand vous ne pouvez pas surveiller.
- Retirez les cordons de rideaux et de stores de la chambre, source de risque d’étranglement.

**Aérer sans danger**
- Aérez pièce par pièce, porte fermée, en restant dans la pièce.
- Ne laissez jamais un enfant seul dans une pièce dont la fenêtre est ouverte, ni sous la garde d’un autre enfant ou d’un adolescent.
- Soyez particulièrement attentif quand vous cuisinez, au printemps et en été, lorsque les fenêtres restent ouvertes.

**Expliquer**
- Dès qu’il peut comprendre, expliquez à l’enfant que la fenêtre et la rambarde ne sont pas des jeux.
- Faites le point avec les grands-parents, la nounou et les amis qui le reçoivent.

## Questions fréquentes
**Mon bloque-fenêtre suffit-il ?** Il aide, mais l’enquête montre que la moitié des fenêtres concernées étaient protégées. L’ARS Normandie rappelle que barrières, verrous et bloque-portes ne remplacent jamais la vigilance d’un adulte.

**Y a-t-il des moments plus à risque ?** Santé publique France observe que ces chutes surviennent surtout au printemps et en été, et aux heures de préparation des repas, quand l’attention des adultes est prise ailleurs.

**Nous partons en location en étage : que vérifier ?** En arrivant, déplacez les meubles placés sous les fenêtres, repérez les ouvertures basses et fermez le balcon quand personne ne surveille.

## Quand demander conseil
Toute chute d’une fenêtre ou d’un balcon est une urgence : appelez immédiatement le **15** ou le **112**, ne déplacez pas l’enfant sauf danger immédiat et restez auprès de lui. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ chambre
  a({
    slug: 'chambre-enfant-securite-meubles-prises-cordons-fenetre',
    title: 'Chambre d’enfant : meubles, prises, cordons et fenêtre, la pièce la plus sûre de la maison',
    summary: 'Couchage, meubles à fixer, prises électriques, cordons et objets à grimper : la check-list pour faire de la chambre un lieu sûr à chaque âge.',
    tags: ['chambre', 'meuble fixé au mur', 'commode', 'cache-prise', 'cordon de store', 'bouillotte', 'lit', 'jouets', 'collier', 'strangulation'],
    min_age_months: 0, max_age_months: 96, safety_critical: true,
    sources: [S.incChambre, S.sante1000Accidents, S.santeAccidentsQuotidien],
    body_md: `## En bref
- Bébé dort **sur le dos**, dans une turbulette adaptée, sans oreiller, couette, tour de lit ni peluche.
- **Fixez les meubles au mur** et équipez les tiroirs de bloque-tiroirs.
- **Cache-prises** ou prises à éclipses, pas de rallonge branchée à portée.
- **Pas de cordons** de rideaux ou de stores près du lit, pas de collier au cou de l’enfant.
- **Rien sous la fenêtre** qui permette de grimper, et jamais de bouillotte dans le lit.

## Comprendre
L’INC résume l’objectif : la chambre de l’enfant doit être la pièce la plus sûre de la maison. C’est là qu’il passe du temps seul, au réveil, pendant la sieste ou le jeu. Les risques changent avec l’âge : étouffement et strangulation chez le nourrisson, chutes et basculement de meubles quand il grimpe, électrisation quand il explore les prises.

Santé.fr (mpedia) rappelle qu’environ 30 décès par strangulation sont évoqués chaque année en France, en lien notamment avec les colliers (y compris d’ambre), les cordons et les liens. Le site 1000 premiers jours recommande d’éloigner le lit des cordons de rideaux et de stores et précise que l’efficacité des colliers d’ambre n’est pas prouvée.

## Au quotidien
**Le couchage**
- Matelas ferme, adapté aux dimensions du lit, sans espace où la tête pourrait se glisser.
- Pour les plus petits, l’écartement des barreaux ne dépasse pas 7 cm, indique l’INC.
- Lit parapluie : seulement le matelas fourni, jamais de matelas ajouté.
- Pas de jouets ni de peluches dans le lit du nourrisson ; jetez les jouets cassés.
- Ne laissez jamais de bouillotte dans le lit : elle peut se percer et brûler gravement.
- Les animaux n’entrent pas dans la chambre de bébé.

**Les meubles**
- Fixez commodes, bibliothèques et armoires au mur, comme le recommande le site 1000 premiers jours.
- Installez des bloque-tiroirs pour éviter les doigts coincés et l’escalade des tiroirs.
- Rangez les objets lourds en bas des étagères.

**L’électricité**
- Installez des prises à éclipses ou des cache-prises à ventouse ou à clé.
- Débranchez et rangez rallonges et multiprises, évitez de les surcharger.
- Apprenez tôt à l’enfant à ne pas toucher les prises.

**La fenêtre**
- Ne placez sous la fenêtre ni lit, ni coffre à jouets, ni cheval à bascule.
- Bloquez l’ouverture des battants avec un dispositif hors de sa portée.
- Retirez les cordons de rideaux et de stores, ou fixez-les très haut.

**Les petits objets**
- Perles, billes, pièces, piles bouton : hors de portée, à la maison comme chez les aînés qui partagent la chambre.

## Questions fréquentes
**À partir de quel âge un lit superposé ?** Pas avant 6 ans pour le couchage du haut : la DGCCRF demande que ces lits portent cette mention. Voir notre article dédié aux lits en hauteur.

**Une veilleuse ou un babyphone près du lit, c’est possible ?** Oui, si le fil et l’appareil restent hors de portée de l’enfant, fixés loin du lit.

**Faut-il chauffer beaucoup la chambre ?** Non. mpedia conseille environ 19 °C et une aération régulière.

## Quand demander conseil
Si votre enfant a été pris dans un cordon, ne respire pas ou respire mal, appelez le **15** ou le **112** et suivez les consignes. Après un meuble tombé sur lui ou une électrisation, même s’il semble bien, demandez un avis médical. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ lits superposés
  a({
    slug: 'lit-superpose-mezzanine-age-normes-securite',
    title: 'Lit superposé ou mezzanine : à partir de quel âge et quoi vérifier ?',
    summary: 'Âge minimum, barrières, épaisseur du matelas, espaces autour du lit, montage : les points de sécurité indiqués par la DGCCRF avant d’acheter ou d’installer un lit en hauteur.',
    tags: ['lit superposé', 'mezzanine', 'lit en hauteur', 'chute', 'norme NF EN 747', 'barrière de lit', 'fratrie', 'chambre partagée', 'location de vacances'],
    min_age_months: 36, max_age_months: 144, safety_critical: true, category: 'materiel',
    sources: [S.dgccrfLits, S.incChambre, S.dgccrfPuericulture],
    body_md: `## En bref
- Le couchage en hauteur est **déconseillé avant 6 ans** : son accès doit être totalement interdit aux plus jeunes.
- Le lit doit porter la mention « le couchage en hauteur ne convient pas à des enfants de moins de 6 ans ».
- Barrières sur tout le pourtour, **hauteur de garde d’au moins 16 cm** au-dessus du matelas.
- Respectez l’**épaisseur de matelas** repérée sur le lit et la notice de montage.
- Aucune corde, ceinture ou sac accroché au lit : risque d’étranglement.

## Comprendre
Les lits superposés et mezzanines font gagner de la place, mais une chute depuis le couchage du haut peut être grave. La DGCCRF rappelle qu’une réglementation spécifique s’applique dès que le couchage dépasse 600 mm de hauteur. Les normes NF EN 747 (lits superposés) et NF D 62 100 (lits mezzanines) visent à prévenir les chutes, les coincements de la tête ou du corps et les enchevêtrements. Un lit fabriqué selon ces normes, ou conforme à un modèle testé par un organisme accrédité, est présumé conforme.

L’INC précise que ce type de lit convient à des enfants capables de comprendre qu’on ne chahute pas en hauteur.

## Au quotidien
**Avant d’acheter : quatre questions**
1. Le couchage supérieur est-il entouré de barrières (une seule ouverture pour l’accès) ?
2. Ces barrières dépassent-elles d’au moins 16 cm le dessus du matelas, avec un repère indiquant l’épaisseur maximale du matelas ?
3. Le lit porte-t-il la mention d’interdiction aux moins de 6 ans ?
4. La notice reprend-elle cette restriction ?

En ligne, demandez au vendeur si le produit respecte les normes et vérifiez au moins sur les photos la présence des barrières. D’occasion, contrôlez le bon fonctionnement et l’absence de modification.

**Monter et installer**
- Suivez la notice de montage et les consignes d’entretien.
- Pour une mezzanine, utilisez impérativement le dispositif anti-basculement fourni.
- Évitez les espaces dangereux autour de la barrière supérieure : la distance avec le mur, le plafond, un toit incliné ou un meuble doit être inférieure à 7,5 cm ou supérieure à 23 cm, pour qu’une tête ne puisse pas s’y coincer.
- N’installez pas le lit sous une fenêtre.

**Au fil du temps**
- Revissez régulièrement les fixations.
- N’utilisez plus le lit si une pièce manque ou est cassée.
- Gardez un matelas de l’épaisseur prévue par le fabricant : trop épais, il réduit la hauteur utile de la barrière.

**Les règles de la chambre**
- Le petit dernier dort en bas, et on ne grimpe pas en haut pour jouer.
- On ne saute pas, on ne se suspend pas à l’échelle ni aux barrières.
- Rien n’est accroché au lit : ni corde, ni ficelle, ni crochet, ni ceinture, ni sac.

## Questions fréquentes
**Mon aîné de 7 ans dort en haut, son frère de 3 ans peut-il jouer dessus ?** Non : la DGCCRF demande que l’accès au couchage supérieur soit totalement interdit aux moins de 6 ans, y compris pour jouer.

**En vacances, le lit superposé de la location me paraît fragile : que faire ?** Les mêmes précautions s’appliquent. Si le lit n’offre pas toutes les garanties, ne l’utilisez pas et signalez-le au gestionnaire.

**Peut-on retirer la barrière quand l’enfant grandit ?** La barrière fait partie de la conception du lit : ne modifiez pas l’article et respectez la notice.

## Quand demander conseil
Après une chute du lit du haut, appelez le **15** si l’enfant a perdu connaissance, vomit, est somnolent ou confus, se plaint d’une douleur intense ou ne bouge plus un membre. En cas de doute, demandez un avis médical. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ séjour
  a({
    slug: 'salon-sejour-securite-enfant-boissons-chaudes-petits-objets-receptions',
    title: 'Salon et séjour : boissons chaudes, table basse, petits objets et soirs de réception',
    summary: 'Tasse posée sur la table basse, cacahuètes à portée, meuble télé qui bascule : sécuriser la pièce de vie, surtout quand la maison est pleine.',
    tags: ['salon', 'séjour', 'boisson chaude', 'table basse', 'réception', 'apéritif', 'cacahuètes', 'étouffement', 'meuble télé', 'protège-coins'],
    min_age_months: 4, max_age_months: 72, safety_critical: true,
    sources: [S.mpediaAccidents, S.ameliBrulures, S.sante1000Accidents],
    body_md: `## En bref
- **Ne tenez pas bébé dans les bras** en buvant une boisson chaude, et ne laissez pas de tasse sur une table basse.
- Lors des réceptions, **mettez hors de portée** cacahuètes, olives, fruits secs, bonbons, pièces et perles : risque d’étouffement.
- **Fixez au mur** les meubles qui pourraient basculer.
- Gardez l’enfant à distance de la cheminée, de l’insert et des radiateurs très chauds.
- Les protège-coins et bloque-portes aident, mais la surveillance reste la vraie protection.

## Comprendre
Le séjour paraît calme, mais il réunit plusieurs dangers à hauteur d’enfant : la table basse où l’on pose café et thé, les meubles sur lesquels il se hisse, les petits objets tombés du canapé. Ameli.fr rappelle que les enfants se brûlent surtout avec des liquides chauds et qu’une boisson chaude peut brûler la bouche et l’œsophage, voire gêner la respiration. mpedia déconseille donc de tenir un bébé dans les bras en buvant chaud.

Les jours de fête, la vigilance se dilue : les adultes sont nombreux et chacun pense qu’un autre surveille. Les petits aliments ronds et durs de l’apéritif, ainsi que les jouets et les pièces des invités, deviennent accessibles.

## Au quotidien
**Boissons et plats chauds**
- Posez tasses, théières et plats au centre d’une table haute, jamais sur une table basse ni au bord.
- Évitez les nappes qui pendent : l’enfant tire dessus et renverse ce qui est posé.
- Passez bébé à un autre adulte avant de prendre votre café.

**Petits objets et petits aliments**
- Avant l’arrivée des invités, faites le tour à hauteur d’enfant : sacs posés au sol, monnaie, médicaments, briquets, cigarettes, piles bouton.
- Servez cacahuètes, fruits à coque, olives et bonbons hors de sa portée, et ramassez ce qui tombe.
- Désignez un adulte « référent » pour l’enfant pendant le repas, à tour de rôle.

**Meubles**
- Fixez au mur bibliothèques, commodes et meuble télé, comme le recommande le site 1000 premiers jours.
- Ne posez pas d’objets lourds ou attirants sur le haut d’un meuble : l’enfant grimpe pour les attraper.
- Protégez les coins vifs à hauteur de tête si votre enfant marche depuis peu.

**Chaleur**
- Cheminée et insert : la vitre devient brûlante ; installez un pare-feu stable et restez présent.
- Radiateurs très chauds : ne laissez pas l’enfant s’y appuyer.
- Fer à repasser : débranchez-le et rangez-le dès la fin du repassage.

**Fenêtres et électricité**
- Rien sous les fenêtres qui permette de grimper.
- Cache-prises sur les prises à hauteur d’enfant, fils de télévision et chargeurs hors de portée.

## Questions fréquentes
**Pourquoi les cacahuètes sont-elles si dangereuses ?** Petites, rondes et dures, elles peuvent bloquer les voies respiratoires d’un jeune enfant. Santé.fr (1000 premiers jours) qualifie les fruits à coque à portée de main de risque sérieux d’étouffement.

**Un parc est-il utile pendant une réception ?** Il peut aider quelques minutes, à condition de rester dans la pièce et de ne rien y laisser de petit ou de chaud à proximité.

**Les protège-coins suffisent-ils ?** Ils limitent la gravité des chocs, mais ne remplacent ni la fixation des meubles ni la présence d’un adulte.

## Quand demander conseil
Si votre enfant s’étouffe et ne peut plus tousser, parler ou respirer, appelez le **15** ou le **112** et pratiquez les gestes de désobstruction adaptés à son âge. En cas de brûlure, refroidissez 20 minutes sous l’eau tempérée et appelez le **15** pour un enfant de moins de 5 ans. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ chauffage
  a({
    slug: 'cheminee-poele-radiateur-chauffage-appoint-enfant-securite',
    title: 'Cheminée, poêle, radiateurs et chauffage d’appoint : brûlures et monoxyde de carbone',
    summary: 'Vitre d’insert brûlante, chauffage d’appoint utilisé en continu, conduit non ramoné : protéger l’enfant des brûlures et toute la famille du monoxyde de carbone.',
    tags: ['cheminée', 'poêle', 'insert', 'radiateur', 'chauffage d’appoint', 'monoxyde de carbone', 'ramonage', 'hiver', 'brûlure', 'pare-feu'],
    min_age_months: 0, max_age_months: 120, safety_critical: true,
    sources: [S.santeCO, S.ameliBrulures, S.vigilanses22],
    body_md: `## En bref
- Tenez l’enfant à distance de la **vitre de l’insert**, du poêle et des radiateurs très chauds ; un pare-feu stable aide.
- Faites **vérifier le chauffage avant l’hiver** et **ramoner** les conduits au moins une fois par an.
- **Aérez** au moins 10 minutes deux fois par jour, et ne bouchez jamais les entrées et sorties d’air.
- Un chauffage d’appoint non électrique ne s’utilise **pas en continu** ; brasero, barbecue et groupe électrogène jamais à l’intérieur.
- Maux de tête, nausées, malaise chez plusieurs personnes : **aérez, sortez, appelez les secours**.

## Comprendre
L’hiver ajoute deux dangers. Le premier est la brûlure : ameli.fr cite l’insert de cheminée parmi les objets chauds dont il faut tenir l’enfant éloigné, au même titre que la porte du four ou le fer à repasser. Un tout-petit qui se met debout prend appui sur ce qu’il trouve, sans mesurer la chaleur.

Le second est le monoxyde de carbone (CO), un gaz toxique, incolore et inodore produit par toute combustion incomplète (gaz, bois, fioul, charbon, butane, éthanol…). L’Anses indique qu’il est la première cause d’hospitalisation pour intoxication chez les moins de 6 ans, surtout chez les moins d’un an, souvent lors d’intoxications collectives en hiver. Santé.fr liste les sources domestiques : chaudière et chauffe-eau non électriques, insert, poêle, chauffage d’appoint non électrique, cuisinière non électrique, barbecue ou brasero.

## Au quotidien
**Contre les brûlures**
- Installez un pare-feu ou une barrière stable devant la cheminée, l’insert ou le poêle.
- Ne laissez jamais l’enfant seul dans la pièce quand le feu brûle.
- Rangez allumettes, briquets et allume-feu hors de sa portée.
- Ne faites pas sécher de linge sur un radiateur électrique, comme le rappelle ameli.fr.

**Contre le monoxyde de carbone**
- Avant chaque hiver, faites vérifier chaudière, chauffe-eau, poêle et insert par un professionnel qualifié.
- Faites ramoner mécaniquement conduits et cheminée au moins une fois par an.
- Aérez au minimum deux fois 10 minutes par jour, fenêtres grandes ouvertes, et laissez les grilles d’aération dégagées.
- Respectez le mode d’emploi de chaque appareil à combustion.
- Par grand froid ou en cas de coupure d’électricité, n’utilisez pas pour vous chauffer un appareil prévu pour autre chose (cuisinière, brasero), et faites fonctionner un chauffage d’appoint non électrique par intermittence seulement.
- Installez un groupe électrogène à l’extérieur, jamais dans la maison ni le garage.

**Le détecteur de CO**
Santé.fr précise que des détecteurs conformes à la norme NF EN 50291 sont en vente libre, sans obligation d’installation. Il ne remplace pas l’entretien des appareils. Son alarme est différente de celle du détecteur de fumée : en cas d’alarme CO, on ouvre les fenêtres et on sort.

## Questions fréquentes
**Comment reconnaître une intoxication au CO ?** Santé.fr cite les maux de tête, les nausées ou vomissements, une fatigue intense ou un malaise. Si plusieurs personnes du foyer ont ces signes en même temps, pensez au CO.

**Un chauffage d’appoint électrique est-il préférable ?** Il ne produit pas de CO, mais il chauffe : placez-le hors de portée, loin des rideaux et du lit, et ne le couvrez jamais.

**Peut-on laisser bébé faire la sieste près du poêle ?** Mieux vaut l’installer dans une pièce tempérée, loin de toute source de chaleur, plutôt qu’à proximité du poêle.

## Quand demander conseil
Si vous suspectez une intoxication au monoxyde de carbone : aérez immédiatement, arrêtez si possible les appareils à combustion, sortez du logement avec les enfants et appelez le **15**, le **18** ou le **112**. En cas de brûlure, refroidissez 20 minutes sous l’eau tempérée et appelez le **15** pour un enfant de moins de 5 ans. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ incendie
  a({
    slug: 'detecteur-de-fumee-incendie-domestique-proteger-sa-famille',
    title: 'Détecteur de fumée et incendie domestique : protéger sa famille',
    summary: 'Le détecteur de fumée est obligatoire dans chaque logement : où le poser, comment l’entretenir, et les gestes à connaître en famille en cas d’incendie.',
    tags: ['détecteur de fumée', 'DAAF', 'incendie', 'feu', 'évacuation', 'allumettes', 'briquet', 'bougie', 'norme NF EN 14604', 'assurance habitation'],
    journeys: ['pregnant', 'newborn', 'child'], category: 'vie-pratique', safety_critical: true,
    sources: [S.spDetecteur, S.ecologieIncendie, S.incIncendie],
    body_md: `## En bref
- **Au moins un détecteur de fumée** est obligatoire dans tout logement ; il porte le marquage **CE** et la référence à la norme **NF EN 14604**.
- Posez-le **au plafond**, de préférence dans le couloir qui mène aux chambres ; un par étage est recommandé.
- **Testez-le** régulièrement avec le bouton prévu et changez la pile dès le signal de pile faible.
- Selon le ministère de la Transition écologique, **80 % des victimes** d’incendie meurent intoxiquées par les fumées.
- En cas de feu chez vous : **sortez, fermez les portes, appelez le 18 ou le 112** depuis l’extérieur.

## Comprendre
Un incendie peut se déclarer à tout moment, y compris la nuit, quand tout le monde dort. Le détecteur de fumée autonome (DAAF) repère les fumées dès le début du feu et émet un signal assez fort pour réveiller. Service-Public.gouv.fr précise que le propriétaire l’installe et que l’occupant l’entretient et le remplace si besoin ; dans certaines locations (meublés, logements saisonniers, logements de fonction…), le propriétaire assume tout. Les détecteurs à ionisation sont interdits.

Les fumées sont le principal danger, bien avant les flammes. Le ministère rappelle aussi que les installations de gaz, de chauffage et d’électricité sont à l’origine d’un incendie sur quatre, et que tout se joue dans les premières minutes.

## Au quotidien
**Bien installer**
- Au plafond, solidement fixé, dans la circulation desservant les chambres ; dans un studio, le plus loin possible de la cuisine et de la salle de bain.
- Pas dans la cuisine ni la salle de bain (vapeur, déclenchements intempestifs), ni posé sur un meuble.
- Un détecteur par étage ; plusieurs dans un grand logement.
- Jamais dans les parties communes de l’immeuble : c’est interdit.
- Déclarez-le à votre assureur et gardez la preuve d’achat.

**Entretenir**
- Appuyez sur le bouton test : un signal sonore retentit quelques secondes.
- Dépoussiérez-le et remplacez la pile au signal de pile faible.
- Des modèles à signal lumineux ou vibrant existent pour les personnes sourdes ou malentendantes.

**Prévenir le départ de feu**
- Ne laissez pas casseroles, poêles, friteuse ou plats sur le feu sans surveillance.
- Évitez les multiprises surchargées, les rallonges emmêlées et les appareils au fil abîmé.
- Gardez allumettes et briquets hors de portée des enfants.
- Éloignez bougies et foyers à l’éthanol des rideaux, canapés et lits.
- Ne fumez pas au lit.

**Préparer la famille**
- Repérez ensemble les sorties et expliquez aux enfants, avec des mots simples, que la fumée est dangereuse et qu’il faut prévenir un adulte dès que le détecteur sonne.
- Faites sonner le détecteur (bouton test) devant eux pour qu’ils reconnaissent ce bruit.

## Questions fréquentes
**Que faire si le feu est dans mon logement ?** Évacuez avec les enfants, fermez la porte de la pièce en feu et la porte d’entrée, puis appelez le **18** ou le **112** depuis l’extérieur. Ne prenez jamais l’ascenseur et n’entrez pas dans les fumées.

**Et si le feu est à mon étage ou en dessous ?** Le ministère conseille de rester chez soi porte fermée, de placer des linges humides au bas des portes, de se signaler aux secours à la fenêtre et de se baisser, un linge humide sur le nez et la bouche, en cas de fumée.

**Le détecteur de fumée détecte-t-il le monoxyde de carbone ?** Non : ce sont deux appareils différents, avec des conduites à tenir différentes.

## Quand demander conseil
Toute personne exposée aux fumées, même si elle semble aller bien, doit être examinée : appelez le **15** ou le **18**. Pour des questions sur l’installation, renseignez-vous auprès de votre bailleur ou de l’Agence départementale d’information sur le logement (Adil). ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ électricité
  a({
    slug: 'electricite-maison-prises-rallonges-chargeurs-enfant',
    title: 'Électricité à la maison : prises, rallonges, chargeurs et appareils près de l’eau',
    summary: 'Un tiers des victimes d’électrisation domestique sont des enfants : les équipements et les habitudes qui limitent ce risque à chaque âge.',
    tags: ['électricité', 'prise électrique', 'cache-prise', 'prise à éclipses', 'rallonge', 'multiprise', 'chargeur', 'électrisation', 'salle de bain'],
    min_age_months: 6, max_age_months: 120, safety_critical: true,
    sources: [S.ameliElec, S.incChambre, S.incSdb],
    body_md: `## En bref
- Selon ameli.fr, en milieu domestique, **un tiers des victimes d’électrisation sont des enfants**.
- **Prises à éclipses ou cache-prises** à hauteur d’enfant, prises cassées réparées.
- **Rallonges débranchées et rangées**, pas de multiprises en cascade.
- **Aucun appareil électrique près de l’eau**, ni avec les mains mouillées ; on recharge hors de la salle de bain.
- Après toute électrisation, même légère, **un avis médical** est nécessaire.

## Comprendre
Dès qu’il se déplace, l’enfant est attiré par les prises : il y glisse un doigt, une clé, une barrette. L’INC rappelle qu’il peut ainsi s’électriser. Le corps, composé en grande partie d’eau, conduit facilement le courant, et l’humidité aggrave le risque. Le courant domestique peut provoquer des troubles du rythme cardiaque, des brûlures parfois minimes en surface mais profondes, et des chutes.

Plus tard, ce sont les chargeurs laissés branchés, les fils abîmés, les appareils utilisés dans la salle de bain ou les rallonges qui exposent l’enfant.

## Au quotidien
**Les prises**
- Installez des prises à éclipses (obturateurs intégrés) ou des cache-prises à ventouse ou à clé.
- Faites réparer sans attendre une prise cassée ou mal fixée.
- Apprenez à l’enfant, dès qu’il comprend, à ne pas toucher ni jouer avec les prises.

**Rallonges, multiprises et fils**
- Ne laissez pas de rallonge branchée à portée ; rangez-la après usage.
- Évitez de brancher plusieurs multiprises les unes sur les autres ; ameli.fr conseille un modèle avec coupe-circuit.
- Ne clouez, n’agrafez et ne coincez pas les câbles sous une porte ou un tapis.
- Jetez une rallonge fendillée et ne touchez jamais un fil dénudé.
- Débranchez en tenant la prise, pas le fil, et montrez ce geste aux enfants plus grands.

**Chargeurs et appareils**
- Ne laissez pas un chargeur branché sans appareil : l’enfant le met à la bouche ou le manipule.
- Rechargez téléphones et tablettes hors des pièces humides, en particulier de la salle de bain.
- N’utilisez jamais d’appareil électrique les mains mouillées, les pieds dans l’eau ou près d’une baignoire, d’une douche, d’un lavabo ou d’un évier.
- Un picotement au contact d’un appareil en marche impose l’intervention d’un électricien.
- Ne posez pas de récipient d’eau sur un appareil électrique.

**L’installation**
- Faites vérifier régulièrement prises, interrupteurs et tableau électrique, et au moindre doute.
- Utilisez du matériel conforme, marqué CE.

## Questions fréquentes
**Prises à éclipses ou cache-prises : que choisir ?** L’INC cite les deux solutions : prises à éclipses, ou cache-prises à ventouse ou à clé sur les prises existantes. Dans tous les cas, apprendre à l’enfant à ne pas toucher les prises reste utile.

**Que faire si un appareil prend feu ?** Ne jetez jamais d’eau sur un feu d’origine électrique. Coupez le courant si possible, fermez portes et fenêtres, appelez les pompiers (**18** ou **112**) et utilisez un extincteur adapté.

**Mon enfant a reçu une petite décharge et pleure à peine : faut-il consulter ?** Oui. Ameli.fr indique que même un accident apparemment bénin doit être évalué ; le médecin peut faire réaliser un électrocardiogramme.

## Quand demander conseil
Face à un enfant électrisé, ne le touchez pas à mains nues : coupez d’abord le courant au disjoncteur ou à la prise, ou écartez la source avec un objet sec et non conducteur. Appelez le **15**, le **18** ou le **112** dès qu’il présente un symptôme. S’il est inconscient et respire, mettez-le en position latérale de sécurité ; s’il ne respire plus, commencez le massage cardiaque. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ produits ménagers
  a({
    slug: 'produits-menagers-ranger-pictogrammes-dosettes-lessive-enfant',
    title: 'Produits ménagers : ranger, lire les pictogrammes et se méfier des dosettes de lessive',
    summary: 'Première cause d’intoxication de l’enfant signalée aux centres antipoison, les produits d’entretien se rangent et s’utilisent avec quelques règles simples.',
    tags: ['produits ménagers', 'dosettes de lessive', 'capsules', 'eau de Javel', 'déboucheur', 'pictogrammes', 'intoxication', 'placard fermé', 'bouchon de sécurité'],
    min_age_months: 6, max_age_months: 120, safety_critical: true,
    sources: [S.ansesIntox, S.incUrgences, S.ameliIntox],
    body_md: `## En bref
- Les produits de nettoyage sont la **première cause d’intoxication** de l’enfant signalée aux centres antipoison (29 %), selon l’Anses.
- Les **dosettes de lessive liquide** attirent les enfants et sont plus toxiques à quantité égale ; les **déboucheurs** causent des lésions corrosives.
- Rangez **en hauteur, dans un placard fermé**, aussitôt après usage, bouchon de sécurité refermé.
- **Jamais de transvasement** dans une bouteille d’eau, de soda ou de jus.
- **Ne mélangez jamais** deux produits.

## Comprendre
L’Anses, avec Santé publique France, a analysé les intoxications des moins de 15 ans entre 2014 et 2020. Les produits de nettoyage arrivent en tête : près de la moitié concernent les produits pour le linge (lessives liquides, dosettes, assouplissants, détachants), puis les nettoyants pour vaisselle et surfaces, les désodorisants et les produits pour piscine. Les dosettes, colorées et molles, ressemblent à des bonbons ; elles peuvent provoquer une détresse respiratoire ou des lésions de l’œil. Leur nombre d’intoxications a diminué depuis les mesures européennes obligatoires de 2015, mais elles restent dangereuses.

Le moment le plus risqué est souvent celui de l’utilisation : le flacon reste ouvert sur le sol, la boîte de dosettes sur le lave-linge.

## Au quotidien
**Ranger**
- En hauteur ou dans un placard fermé, idéalement à clé, y compris sous l’évier : un placard bas s’ouvre facilement.
- Refermez et rangez immédiatement après usage, même si vous revenez dans deux minutes.
- Gardez chaque produit dans son emballage d’origine, avec son étiquette.
- Préférez les produits munis d’un bouchon de sécurité et fermez-le à chaque fois.
- Ne laissez pas traîner les emballages vides.

**Les dosettes de lessive**
- Ne sortez pas la dosette de sa boîte à l’avance, et refermez la boîte aussitôt.
- Mettez la dosette directement dans le tambour, puis fermez le lave-linge.

**Utiliser**
- Éloignez l’enfant pendant le ménage et aérez la pièce.
- Ne mélangez jamais deux produits : le gaz dégagé peut être très irritant.
- Ne transvasez jamais un produit dans un contenant alimentaire.
- Faites attention aux produits de piscine et de bricolage, rangés eux aussi hors de portée.

**Lire les pictogrammes**
Les losanges à bord rouge signalent le danger. L’INC en détaille la signification : « corrosif » (peut brûler la peau et les yeux), « toxique ou mortel » (peut empoisonner même à faible dose), « dangereux pour la santé » (irritation, allergie, somnolence), « très dangereux pour la santé », « inflammable », « gaz sous pression »… Expliquez-les aux enfants dès qu’ils sont en âge de comprendre.

## Questions fréquentes
**Les produits présentés comme « naturels » se rangent-ils ailleurs ?** Non : lisez leur étiquette et leurs pictogrammes comme pour les autres, et rangez-les avec les mêmes précautions.

**Mon enfant a mordu une dosette mais va bien : que faire ?** Appelez un centre antipoison sans attendre, même sans symptôme. Ameli.fr rappelle de ne pas le faire vomir et de ne lui donner ni eau ni lait.

**Chez les grands-parents aussi ?** Oui : l’Anses recommande la même vigilance hors du domicile, en vacances comme chez des proches.

## Quand demander conseil
${CAP} Ne faites pas vomir l’enfant, ne lui donnez rien à boire et ne le laissez pas seul. S’il a du mal à respirer, s’il est somnolent ou inconscient, appelez le **15** ou le **112** ; s’il est inconscient et respire, placez-le en position latérale de sécurité. En cas de projection dans l’œil ou sur la peau, rincez longuement à l’eau. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ médicaments
  a({
    slug: 'medicaments-maison-armoire-pharmacie-ranger-trier-enfant',
    title: 'Médicaments à la maison : ranger l’armoire à pharmacie et la trier',
    summary: 'Les médicaments sont la première cause d’intoxication grave de l’enfant : où les ranger, comment trier l’armoire à pharmacie et éviter les erreurs de flacon.',
    tags: ['médicaments', 'armoire à pharmacie', 'rangement', 'intoxication', 'trier', 'pharmacie', 'notice', 'dispositif doseur', 'sac à main', 'grands-parents'],
    min_age_months: 0, max_age_months: 144, safety_critical: true,
    sources: [S.vigilanses22, S.santeTrier, S.ansmParents],
    body_md: `## En bref
- Les médicaments représentent **un tiers des intoxications graves** de l’enfant, selon l’Anses.
- Rangez **tous** les médicaments de la famille (adultes, enfants, animaux) **en hauteur, dans une armoire fermée**, hors de vue.
- Jamais dans un **sac à main**, sur une table de chevet ou une table de cuisine.
- Gardez chaque médicament **dans sa boîte, avec sa notice et son dispositif doseur**.
- Rapportez en pharmacie les **restes de traitement et les médicaments périmés**.

## Comprendre
L’analyse de l’Anses montre deux situations différentes selon l’âge. Avant un an, les intoxications viennent surtout d’erreurs de l’entourage, par exemple un médicament ou un flacon confondu avec un autre. Entre 1 et 5 ans, l’enfant atteint seul les médicaments, ouvre une boîte, croque des comprimés colorés. Les médicaments du système nerveux, certains médicaments cardiaques et les antalgiques sont particulièrement en cause.

Santé.fr conseille de faire régulièrement le point sur sa pharmacie familiale : on sait ce qu’on possède, on évite le gaspillage et on limite les risques.

## Au quotidien
**Ranger**
- Une armoire placée en hauteur, fermée à clé, dans la pièce la plus fraîche de la maison ; Santé.fr conseille une conservation vers 25 °C, à l’abri du soleil.
- Séparez une partie « enfants » et une partie « adultes », et isolez les traitements sur ordonnance, prescrits pour une personne.
- Les médicaments à conserver au réfrigérateur vont dans une boîte fermée, en hauteur.
- Pilulier et traitement du jour restent eux aussi hors de portée.
- Ne déconditionnez pas comprimés ou gélules à l’avance, comme le recommande l’Anses.

**Éviter les erreurs**
- Utilisez uniquement le dispositif doseur fourni avec le médicament (seringue, cuillère, gobelet), jamais celui d’un autre, comme le précise l’ANSM.
- Ne donnez pas à un enfant le médicament prescrit à un autre, même pour des symptômes semblables, sans avis médical ou pharmaceutique.
- Notez la date d’ouverture sur les sirops, sprays et collyres, qui ne se conservent que quelques semaines.
- Gardez la notice : elle est utile si vous devez appeler le Samu ou un centre antipoison.
- Ne rangez jamais une huile essentielle à côté de la vitamine D ou des soins du bébé : des confusions ont été signalées aux centres antipoison.

**Trier**
- À rapporter en pharmacie : médicaments périmés, restes d’un traitement terminé, médicaments dont l’aspect a changé. Retirez boîte et notice, à jeter au tri.
- Ne jetez jamais un médicament à la poubelle, dans l’évier ou les toilettes.
- Ne donnez pas vos médicaments à un proche.

## Questions fréquentes
**Que contient une armoire à pharmacie de base ?** Santé.fr cite de quoi soigner les petites plaies (antiseptique, pansements, compresses), un antalgique contre la fièvre et la douleur, quelques produits digestifs et du sérum physiologique. Demandez à votre pharmacien ce qui convient aux âges de vos enfants.

**Peut-on présenter un médicament comme un bonbon pour qu’il le prenne ?** Mieux vaut l’éviter : l’enfant pourrait ensuite en chercher seul. Expliquez-lui simplement que c’est un soin, donné par un adulte.

**Les grands-parents ont beaucoup de médicaments : comment faire ?** L’Anses recommande de les ranger aussi en hauteur ou sous clé chez eux. Parlez-en simplement avant la visite.

## Quand demander conseil
${CAP} Gardez la boîte et la notice, estimez la quantité manquante et notez l’heure. Ne faites pas vomir l’enfant. S’il est somnolent, respire mal, convulse ou est inconscient, appelez le **15** ou le **112**. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ huiles essentielles
  a({
    slug: 'huiles-essentielles-maison-enfant-rangement-confusion-diffuseur',
    title: 'Huiles essentielles à la maison : rangement, confusions et diffuseurs',
    summary: 'L’Anses déconseille les huiles essentielles aux enfants : pourquoi elles causent des intoxications, comment les ranger et quelles précautions prendre si vous en utilisez.',
    tags: ['huiles essentielles', 'diffuseur', 'spray', 'vitamine D', 'confusion', 'intoxication', 'aromathérapie', 'centre antipoison', 'rangement'],
    min_age_months: 0, max_age_months: 144, safety_critical: true,
    sources: [S.ansesHE, S.ameliIntox],
    body_md: `## En bref
- L’Anses indique que les huiles essentielles sont **déconseillées aux enfants et aux femmes enceintes**, en raison de substances potentiellement neurotoxiques.
- Les appels aux centres antipoison les concernant **n’ont cessé d’augmenter** entre 2011 et 2021.
- Dans **un tiers des accidents** impliquant un enfant, une huile essentielle avait été donnée **par erreur à la place d’un médicament**, surtout de la vitamine D.
- Rangez-les **hors de portée** et **jamais avec les soins du bébé**.
- Demandez conseil à un professionnel de santé **avant tout usage**.

## Comprendre
Les huiles essentielles sont souvent perçues comme douces parce qu’elles sont d’origine végétale. Elles contiennent pourtant des substances concentrées et actives. L’Anses, qui a analysé les appels aux centres antipoison, décrit surtout des accidents domestiques, le plus souvent de faible gravité, mais en augmentation régulière.

Un scénario revient souvent chez l’enfant, la confusion : un petit flacon compte-gouttes d’huile essentielle ressemble beaucoup à celui de la vitamine D ou d’un autre soin du nourrisson. Rangés côte à côte sur la table à langer ou dans le même panier, ils s’échangent facilement, surtout la nuit ou quand on est fatigué. Les autres circonstances citées par l’Anses sont les flacons laissés à portée, l’usage de sprays ou de diffuseurs dans une pièce fermée et l’application pure sur les muqueuses.

L’Anses rappelle aussi que les produits vendus comme « huile essentielle » contiennent parfois d’autres ingrédients : certains sprays comportent plus de 70 % d’éthanol.

## Au quotidien
**Ranger**
- Placez les flacons dans un placard en hauteur, fermé, avec les médicaments des adultes et non dans la salle de bain à portée.
- Séparez physiquement les huiles essentielles de tous les soins du bébé : vitamine D, sérum physiologique, crèmes.
- Gardez chaque produit dans son emballage d’origine, avec sa notice.
- Avant de donner un soin, lisez l’étiquette du flacon, même en pleine nuit, avec la lumière allumée.

**Si un adulte de la maison en utilise**
- Respectez les conditions d’emploi indiquées sur le produit.
- Aérez bien la pièce lors de l’usage d’un spray ou d’un diffuseur, et n’en utilisez pas dans la chambre d’un enfant.
- N’appliquez pas d’huile pure sur les muqueuses.
- Lavez-vous soigneusement les mains après un massage ou une application sur la peau, avant de toucher l’enfant.
- Refermez et rangez le flacon tout de suite après usage.

**Avant toute utilisation chez l’enfant**
- Parlez-en au médecin, à la sage-femme ou au pharmacien, qui vous diront si un usage est envisageable selon l’âge et le produit.
- Méfiez-vous des conseils trouvés sur les réseaux sociaux ou les forums.

## Questions fréquentes
**Un diffuseur dans le salon, est-ce un problème ?** L’Anses cite l’usage de diffuseurs et de sprays en espace clos parmi les circonstances d’exposition et appelle à bien aérer. Demandez conseil avant d’en utiliser en présence d’un jeune enfant.

**J’ai donné quelques gouttes d’huile essentielle à la place de la vitamine D : que faire ?** Appelez un centre antipoison sans attendre, même si votre bébé va bien, en ayant le flacon sous la main. Ameli.fr rappelle de ne pas faire vomir et de ne rien donner à boire.

**Les produits « bio » ou « 100 % naturels » sont-ils plus sûrs ?** Ces mentions ne disent rien de la toxicité pour un enfant : les mêmes précautions de rangement et d’usage s’appliquent.

## Quand demander conseil
${CAP} Si l’enfant somnole, vomit, respire mal, convulse ou perd connaissance, appelez le **15** ou le **112**. En cas de projection dans l’œil, rincez abondamment à l’eau et demandez conseil. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ tabac, nicotine, cannabis
  a({
    slug: 'tabac-nicotine-vapotage-cannabis-maison-ingestion-enfant',
    title: 'Tabac, nicotine, vapotage et cannabis : éviter les ingestions accidentelles de l’enfant',
    summary: 'Billes aromatiques, tabac à chauffer ou à mâcher, e-liquides, cannabis : pourquoi ces produits sont dangereux pour un jeune enfant et comment les garder hors de sa portée.',
    tags: ['tabac', 'nicotine', 'cigarette électronique', 'e-liquide', 'vapotage', 'billes aromatiques', 'tabac à chauffer', 'cannabis', 'intoxication', 'mégots'],
    min_age_months: 6, max_age_months: 120, safety_critical: true,
    sources: [S.ansesNicotine, S.vigilanses4, S.vigilanses22],
    body_md: `## En bref
- Les **billes aromatiques** pour cigarettes ont provoqué 86 appels aux centres antipoison en 2022, contre 3 en 2020 ; **trois quarts** des personnes intoxiquées avaient **moins de 3 ans**.
- Le **tabac à chauffer ou à mâcher** avalé par un enfant peut entraîner un syndrome nicotinique sévère nécessitant une hospitalisation.
- Les **e-liquides** exposent aux ingestions et aux projections dans les yeux, notamment lors du remplissage.
- Le **cannabis** est la première cause d’admission en réanimation pour intoxication chez les moins de 6 ans.
- Rangez tous ces produits **hors de portée, en toutes circonstances**, et consultez rapidement en cas de doute.

## Comprendre
L’Anses a observé une forte hausse des intoxications liées aux nouveaux produits du tabac. Les billes aromatiques, aux emballages colorés évoquant des fruits et sans fermeture de sécurité, sont confondues avec des bonbons, y compris par des adultes. Chez l’enfant, elles provoquent surtout des douleurs abdominales et des nausées. Le tabac à mâcher et le tabac à chauffer sont surtout avalés au domicile ; si la plupart des cas sont peu graves, une dizaine d’enfants ont présenté un syndrome nicotinique sévère : vomissements prolongés, convulsions, troubles de la conscience, baisse de tension.

Pour la cigarette électronique, une étude des centres antipoison (2013–2014) montrait que les enfants de moins de 4 ans représentaient 27 % des personnes exposées. Les projections dans les yeux survenaient souvent pendant le remplissage, et un e-liquide avait été pris pour un collyre. L’Anses voyait dans les bouchons de sécurité des flacons une avancée.

Enfin, l’analyse de l’Anses sur 2014–2020 montre que les intoxications au cannabis des moins de 6 ans sont de plus en plus fréquentes et graves, en particulier chez les moins d’un an.

## Au quotidien
**Ranger**
- Paquets, tabac à chauffer, billes aromatiques, sachets, cigarette électronique et recharges : en hauteur, dans un placard fermé, jamais dans un sac posé au sol ni sur une table basse.
- Refermez systématiquement le bouchon de sécurité des flacons d’e-liquide.
- Videz et nettoyez les cendriers, et ne laissez pas traîner de mégots, y compris sur le balcon ou dans le jardin.
- Le cannabis, sous toutes ses formes, se range sous clé, et l’Anses invite à ne pas banaliser sa consommation dans l’entourage de l’enfant.

**Utiliser**
- Remplissez la cigarette électronique hors de la présence de l’enfant, dans une autre pièce.
- Ne rangez jamais un e-liquide à côté des collyres ou des soins de l’enfant.
- Ne fumez pas et ne vapotez pas à l’intérieur ni en voiture : en plus du risque d’ingestion, la fumée expose l’enfant au tabagisme passif.

**Chez les autres**
- Parlez-en aux grands-parents, aux amis et à la personne qui garde votre enfant, simplement, sans jugement.

## Questions fréquentes
**Mon enfant a sucé un mégot ou une bille aromatique : est-ce grave ?** Cela dépend du produit et de la quantité. Appelez un centre antipoison sans attendre, même s’il va bien, pour savoir quoi faire.

**De l’e-liquide a giclé dans l’œil de mon enfant : que faire ?** Rincez longuement à l’eau claire et appelez un centre antipoison ou un médecin.

**Je soupçonne qu’il a avalé du cannabis : que faire ?** Consultez rapidement, même s’il s’agit d’une simple suspicion : l’Anses recommande de ne pas attendre. Dites franchement aux soignants ce qui a pu être avalé ; cela permet de bien le soigner.

**Je voudrais arrêter de fumer : qui peut m’aider ?** Votre médecin, votre sage-femme ou votre pharmacien peuvent vous accompagner et vous orienter vers un tabacologue.

## Quand demander conseil
${CAP} Appelez le **15** ou le **112** si l’enfant vomit de façon répétée, est somnolent, agité, convulse, respire mal ou perd connaissance. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ billes d'eau et petits objets
  a({
    slug: 'billes-d-eau-billes-aimantees-petits-objets-ressemblant-bonbons',
    title: 'Billes d’eau, billes aimantées, piles : les petits objets qui ressemblent à des bonbons',
    summary: 'Colorés et brillants, certains petits objets de décoration ou gadgets pour adultes deviennent très dangereux une fois avalés : les repérer et les ranger.',
    tags: ['billes d’eau', 'perles d’eau', 'billes aimantées', 'aimants', 'pile bouton', 'petits objets', 'ingestion', 'occlusion', 'décoration', 'gadget'],
    min_age_months: 6, max_age_months: 96, safety_critical: true,
    sources: [S.ansesBillesEau, S.ansesAimants, S.vigilanses22],
    body_md: `## En bref
- Les **billes d’eau** (perles absorbantes de décoration ou pour plantes) continuent de **gonfler dans le tube digestif** et peuvent provoquer une occlusion intestinale.
- Les ingestions de billes d’eau signalées aux centres antipoison sont passées de **2 cas en 2010 à 54 en 2018** ; la moitié concernait des enfants de moins de 3 ans.
- Plusieurs **billes aimantées** avalées peuvent s’agglutiner, obstruer l’intestin ou le perforer.
- Les **piles bouton** et petits objets sont rares parmi les intoxications mais représentent **6 % des cas graves**.
- Rangez ces objets **hors de portée en permanence** et appelez un centre antipoison au moindre doute.

## Comprendre
Certains objets du quotidien n’ont rien de dangereux en apparence. Les billes d’eau, vendues pour décorer un vase, arroser des plantes ou parfois comme jouets, sont multicolores et peuvent être prises pour des bonbons. Si elles n’ont pas atteint leur taille maximale, elles continuent à absorber de l’eau une fois avalées. L’Anses rapporte le décès d’un enfant après l’ingestion d’une bille d’eau passée inaperçue.

Les billes aimantées de 3 à 5 mm, vendues comme jouets antistress pour adultes ou présentes dans certains jeux de construction, sont bien plus dangereuses qu’une perle de verre de même taille : plusieurs billes avalées s’agglutinent, obstruent le tube digestif ou percent la paroi de l’intestin. Les cas graves signalés concernaient des enfants de 3 ans ou moins.

Les piles bouton, enfin, peuvent provoquer des lésions graves : l’Anses rapporte le décès d’un enfant par perforation de l’œsophage et de l’aorte, et signale 19 enfants ayant avalé une pile bouton provenant d’un jouet ou d’une télécommande.

## Au quotidien
**Faire le tri**
- Faites le tour de la maison : vases et pots décoratifs garnis de billes d’eau, gadgets de bureau aimantés, jeux de construction des aînés, télécommandes, montres, balances, cartes de vœux musicales.
- Évitez d’acheter des billes d’eau tant que vous avez de jeunes enfants, ou gardez-les hors de leur portée et de leur vue.
- Réservez les jeux aimantés aux enfants de l’âge indiqué et rangez-les en fin de partie dans une boîte fermée, hors de portée des plus petits.

**Piles et compartiments**
- Vérifiez que le compartiment à piles des jouets et télécommandes est fermé, idéalement par une vis.
- Rangez les piles neuves et usagées hors de portée, même emballées.
- Ne laissez pas un jeune enfant jouer avec une télécommande ou des clés de voiture électroniques.

**À la maison et ailleurs**
- Pensez aux sacs des visiteurs, aux trousses de toilette et aux poches.
- Expliquez aux aînés pourquoi leurs petites pièces ne restent pas au sol.
- Choisissez des jouets adaptés à l’âge, lisez les avertissements et la notice.

## Questions fréquentes
**Comment savoir s’il en a avalé une ?** Souvent, on ne le sait pas : l’ingestion passe inaperçue. Un objet manquant, une bille retrouvée près de l’enfant ou des vomissements inexpliqués doivent faire penser à une ingestion.

**Une seule bille aimantée, est-ce moins grave ?** Ne prenez pas de risque : l’Anses recommande d’appeler immédiatement un centre antipoison en cas d’ingestion confirmée ou suspectée.

**Faut-il attendre que l’objet ressorte dans les selles ?** Non. Pour les billes d’eau, les aimants et les piles bouton, appelez un centre antipoison ou le **15** sans attendre l’apparition de symptômes.

## Quand demander conseil
${CAP} Pour une pile bouton ou plusieurs aimants avalés, ou si l’enfant vomit, a mal au ventre, bave, refuse de manger ou respire mal, appelez le **15** ou le **112**. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ plantes
  a({
    slug: 'plantes-toxiques-maison-jardin-enfant-prevenir-reagir',
    title: 'Plantes d’intérieur et de jardin toxiques : prévenir et réagir',
    summary: 'Feuilles, baies et bulbes portés à la bouche sont une cause fréquente d’appels aux centres antipoison : les plantes à surveiller et les bons gestes.',
    tags: ['plantes toxiques', 'plantes d’intérieur', 'baies', 'bulbes', 'laurier rose', 'belladone', 'jardin', 'intoxication', 'centre antipoison', 'cueillette'],
    min_age_months: 6, max_age_months: 120, safety_critical: true,
    sources: [S.ansesPlantesEte, S.vigilanses22, S.ansesPlantesDeco],
    body_md: `## En bref
- Les centres antipoison reçoivent **jusqu’à 10 000 appels par an** pour des plantes ; **trois quarts** concernent de jeunes enfants ou des personnes ayant des troubles cognitifs qui ont porté une plante à la bouche.
- Chez les moins de 6 ans, environ **20 %** des enfants exposés ont des symptômes ; les **plantes sauvages** causent davantage de cas graves que les plantes d’intérieur.
- **Baies** (belladone, morelles, chèvrefeuille à baies noires), **laurier rose**, **digitale** et **bulbes** de fleurs font partie des plantes à surveiller.
- Gardez **l’étiquette ou une photo** de chaque plante.
- En cas d’ingestion : **essuyer la bouche, laver les mains, appeler un centre antipoison**, même sans symptôme.

## Comprendre
L’enfant découvre le monde avec sa bouche : une feuille de plante verte, une baie brillante ou un bulbe oublié sur la terrasse l’attirent. L’Anses indique qu’environ un tiers des personnes exposées ont des symptômes, et que certaines plantes sont très toxiques. Quelques baies de belladone, noires, luisantes et au goût sucré, peuvent provoquer des troubles de la conscience et des convulsions. Le laurier rose est hautement toxique, la digitale peut entraîner des troubles cardiaques graves. Les bulbes de narcisse, jonquille, tulipe, jacinthe, iris ou crocus sont toxiques et se confondent avec un oignon ou une échalote.

Certaines plantes agissent par simple contact : la sève du figuier, du persil, du fenouil ou de l’angélique peut, au soleil, provoquer des brûlures de la peau avec rougeur et cloques, plusieurs heures après.

## Au quotidien
**À l’intérieur**
- Renseignez-vous sur la toxicité d’une plante avant de l’acheter, et conservez son étiquette ou une photo.
- Placez les plantes hors de portée, en hauteur, et ramassez les feuilles et baies tombées.
- Attention aux plantes de fêtes : houx, gui et poinsettia (voir notre article sur les fêtes).

**Au jardin et en promenade**
- Repérez les plantes toxiques de votre jardin, surtout près de l’aire de jeux.
- Rangez les bulbes à planter hors de portée.
- Apprenez à l’enfant à ne jamais goûter une baie, une feuille ou une fleur sans demander à un adulte.
- Pour les cueillettes, l’Anses conseille de ne consommer aucune plante en cas de doute, de ne pas cueillir par brassées et de photographier la récolte.
- Protégez la peau (gants, vêtements couvrants) quand vous taillez un figuier ou manipulez des plantes photosensibilisantes, et évitez que l’enfant joue avec leur sève.

**Ne pas se fier qu’à une application**
L’Anses précise que les applications de reconnaissance de plantes ne doivent pas être le seul moyen d’identification : leur taux d’erreur n’est pas connu. En cas de doute, demandez à un pharmacien.

## Questions fréquentes
**Il a mâchonné une feuille de ma plante verte et semble bien : que faire ?** Retirez ce qui reste dans sa bouche, essuyez-la avec un linge humide, lavez-lui les mains et appelez un centre antipoison : il vous dira s’il faut consulter, selon la plante.

**Faut-il lui donner à boire ou le faire vomir ?** Non. L’Anses conseille de ne rien lui faire boire après l’essuyage de la bouche ; ameli.fr rappelle de ne jamais faire vomir.

**Comment aider le centre antipoison ?** Ayez sous la main le nom de la plante, son étiquette ou une photo, la partie mangée (feuille, baie, bulbe) et la quantité estimée.

## Quand demander conseil
${CAP} En cas de troubles sévères (somnolence, convulsions, malaise, difficultés à respirer), appelez le **15** ou le **112**. Pour un animal, contactez un centre antipoison vétérinaire. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ jardin
  a({
    slug: 'jardin-securite-enfant-outils-tondeuse-barbecue-produits',
    title: 'Jardin : outils, tondeuse, barbecue, produits et jeux d’extérieur',
    summary: 'Le jardin est un formidable terrain de jeu, à condition d’y ranger outils et produits, de tenir les enfants loin du barbecue et de bien installer les jeux.',
    tags: ['jardin', 'tondeuse', 'outils', 'barbecue', 'désherbant', 'engrais', 'balançoire', 'toboggan', 'portique', 'brûlure'],
    min_age_months: 9, max_age_months: 144, safety_critical: true,
    sources: [S.incJardin, S.santeCO, S.dgccrfAires],
    body_md: `## En bref
- **Tondez en l’absence des enfants** et rangez outils coupants, échelles et appareils électriques hors de leur portée.
- **Barbecue** : modèle stable, jamais d’alcool ni d’essence pour allumer ou raviver, enfants à distance jusqu’au refroidissement complet.
- **Jamais de barbecue ni de brasero à l’intérieur**, même dans un garage : risque de monoxyde de carbone.
- **Produits de jardin** dans leur emballage d’origine, refermés, hors de portée, et traitements faits sans les enfants.
- **Jeux d’extérieur** : notice d’installation, charge maximale et distances de sécurité respectées.

## Comprendre
Le jardin combine plusieurs familles de risques. L’INC cite les chutes, collisions et accrochages autour des jeux, les brûlures liées au barbecue (souvent au visage et aux mains, car les enfants sont à la hauteur du foyer), les blessures par outils et tondeuse, et les intoxications par engrais, désherbants, insecticides ou fongicides. S’y ajoutent les points d’eau (piscine, bassin, seau, mare, puits) et les plantes toxiques, traités dans des articles dédiés.

La DGCCRF rappelle, à propos des aires de jeux, que certains risques font partie de l’apprentissage de l’enfant, mais que ceux liés à une mauvaise conception, installation ou entretien ne sont pas acceptables.

## Au quotidien
**Outils et tondeuse**
- Rangez outils coupants, taille-haie, échelles et appareils électriques dans un local fermé.
- Débranchez les appareils électriques après usage et avant toute réparation.
- Tondez uniquement quand les enfants sont à l’intérieur, avec un matériel en bon état utilisé selon son mode d’emploi.

**Barbecue**
- Choisissez un modèle stable, de préférence à quatre pieds, portant un marquage NF ou une conformité à la norme EN.
- Utilisez uniquement des allume-barbecue, rangés hors de portée, jamais d’alcool à brûler ni d’essence.
- Délimitez une zone interdite aux enfants autour du barbecue, jusqu’à son refroidissement complet, et ne le déplacez pas en fonctionnement.
- Évitez les vêtements amples près du feu et rangez allumettes et briquets.

**Produits de jardin**
- Lisez les étiquettes et les pictogrammes de danger, respectez les doses indiquées.
- Traitez sans les enfants, en vous protégeant mains, yeux et corps.
- Ne mélangez pas les produits, gardez-les dans leur emballage d’origine et rapportez les emballages vides en déchetterie.

**Jeux d’extérieur**
- Suivez la notice d’installation, respectez les charges maximales et les distances de sécurité (l’INC cite 2 m devant un toboggan).
- Vérifiez régulièrement les fixations, l’état du bois et des cordes, l’absence de pointes ou d’arêtes.
- Retirez écharpes et cordons de capuche avant de jouer : ils peuvent s’accrocher, notamment sur un toboggan.
- Évitez les sucettes et bonbons pendant le jeu, à cause du risque d’étouffement.
- Si le terrain n’est pas clos, surveillez que l’enfant ne s’éloigne pas vers la rue.

## Questions fréquentes
**À partir de quel âge mon enfant peut-il m’aider au jardin ?** Dès tout petit, il peut arroser, ramasser des feuilles ou semer, avec des outils adaptés à sa taille et toujours sous surveillance, loin des outils coupants et des produits.

**Le toboggan en métal brûle-t-il en été ?** La DGCCRF signale que le métal exposé au soleil et les glissières peuvent surchauffer : touchez la surface avant de laisser l’enfant glisser.

**Peut-on utiliser le barbecue dans le garage s’il pleut ?** Non : Santé.fr rappelle qu’un barbecue ou un brasero ne s’utilise jamais en intérieur, garage compris, à cause du monoxyde de carbone.

## Quand demander conseil
En cas de brûlure, refroidissez 20 minutes sous l’eau tempérée et appelez le **15** pour un enfant de moins de 5 ans ou une brûlure du visage ou des mains. Pour une plaie profonde ou qui saigne beaucoup, comprimez et appelez le **15**. ${CAP} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ piscine enterrée
  a({
    slug: 'piscine-privee-enterree-dispositif-securite-obligatoire-normes',
    title: 'Piscine privée enterrée : le dispositif de sécurité obligatoire et ses limites',
    summary: 'Barrière, alarme, couverture ou abri : ce que la loi impose pour les piscines privées enterrées, comment choisir, et pourquoi la surveillance reste indispensable.',
    tags: ['piscine', 'piscine enterrée', 'barrière de piscine', 'alarme de piscine', 'couverture', 'abri de piscine', 'noyade', 'location saisonnière', 'norme NF P90'],
    min_age_months: 0, max_age_months: 120, safety_critical: true,
    sources: [S.spPiscine, S.ecologiePiscines, S.dgccrfPiscines],
    body_md: `## En bref
- Une piscine **privée, enterrée ou semi-enterrée, non close** doit être équipée d’**au moins un** dispositif normalisé : **barrière, alarme, couverture ou abri**.
- Normes de référence : **NF P90-306** (barrières), **NF P90-307** (alarmes), **NF P90-308** (couvertures), **NF P90-309** (abris).
- Chaque dispositif vise à protéger les **enfants de moins de 5 ans**.
- L’absence de dispositif expose le propriétaire à une **amende de 45 000 €**.
- Un dispositif ne protège que s’il est **refermé ou activé** : il ne remplace jamais la surveillance d’un adulte.

## Comprendre
La loi impose depuis le début des années 2000 un dispositif de sécurité pour les piscines privées enterrées ou semi-enterrées de plein air, à usage familial ou collectif. Le ministère de la Transition écologique précise que les piscines naturelles, spas et jacuzzis extérieurs sont aussi concernés, mais pas les piscines situées dans un bâtiment, ni les piscines hors-sol, gonflables ou démontables.

Chaque dispositif répond à des exigences précises :
- **Barrière** : empêcher le passage d’un enfant de moins de 5 ans sans l’aide d’un adulte, résister à ses manipulations, notamment du verrou, sans le blesser.
- **Alarme** : détecter le franchissement par un jeune enfant et déclencher une sirène, sans déclenchement intempestif, avec des commandes inaccessibles aux moins de 5 ans.
- **Couverture** : empêcher l’immersion involontaire d’un jeune enfant et supporter le poids d’un adulte.
- **Abri** : rendre le bassin inaccessible aux moins de 5 ans une fois fermé.

Un équipement conforme à la norme correspondante est réputé satisfaire aux exigences ; la référence figure sur l’emballage. Le vendeur ou l’installateur remet une note technique sur le fonctionnement, l’entretien et la prévention de la noyade.

## Au quotidien
**Choisir**
- Vérifiez la référence de la norme sur l’emballage ou demandez-la à l’installateur.
- Pensez à vos habitudes : une barrière doit être refermée à chaque passage, une couverture ou un abri remis après chaque baignade, une alarme réactivée.
- Conservez la note technique et suivez les consignes d’entretien.

**Utiliser**
- Après la baignade, retirez jouets et objets flottants, qui attirent l’enfant vers l’eau, puis remettez le dispositif en place.
- Ne calez jamais un portillon ouvert, ne laissez pas de chaise ou de table contre la barrière.
- Gardez près du bassin une perche, une bouée et un téléphone.
- Rangez les produits d’entretien de la piscine hors de portée et utilisez-les sans les enfants.

**Surveiller**
- Pendant la baignade, le dispositif est ouvert ou désactivé : un adulte désigné surveille, sans téléphone ni lecture, à portée de bras des plus petits.
- Hors baignade, sachez à tout moment où sont les enfants.

## Questions fréquentes
**Nous louons une maison avec piscine : qui est responsable ?** Service-Public.gouv.fr indique que le dispositif doit être installé et opérationnel avant l’arrivée du locataire ; pour une alarme, le propriétaire s’assure qu’elle est activée. Le locataire ne doit pas la désactiver ni la neutraliser pendant le séjour.

**Quel dispositif est le meilleur ?** La réglementation n’en privilégie aucun. Le ministère rappelle qu’une barrière, une couverture ou un abri ne protègent que verrouillés, et une alarme qu’en fonctionnement normal.

**Notre piscine est hors-sol : sommes-nous concernés ?** Pas par cette obligation, mais les enfants s’y noient aussi chaque année. Voir notre article sur les piscines hors-sol et les petits volumes d’eau.

## Quand demander conseil
Si un enfant est retrouvé dans l’eau, sortez-le, appelez le **15**, le **18** ou le **112** et commencez les gestes de secours. S’il a avalé de l’eau et tousse, vomit, respire difficilement ou reste somnolent dans les minutes qui suivent, appelez les secours. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ hors-sol et petits volumes d'eau
  a({
    slug: 'piscine-hors-sol-pataugeoire-seau-bassin-noyade-jeune-enfant',
    title: 'Piscine hors-sol, pataugeoire, seau, bassin : la noyade dans très peu d’eau',
    summary: 'Les piscines hors-sol et les petits volumes d’eau ne sont soumis à aucun dispositif obligatoire : les gestes qui protègent les tout-petits au quotidien.',
    tags: ['piscine hors-sol', 'piscine gonflable', 'pataugeoire', 'seau', 'bassin', 'mare', 'noyade', 'été', 'surveillance', 'brassards'],
    min_age_months: 6, max_age_months: 72, safety_critical: true,
    sources: [S.sportsPiscine, S.dgccrfPiscines, S.sante1000Accidents],
    body_md: `## En bref
- En 2025, **27 % des noyades** concernaient des enfants de moins de 6 ans, surtout dans des **piscines privées**.
- Une noyade est **rapide et silencieuse** : 20 cm d’eau et moins de 3 minutes suffisent ; Santé.fr cite même **moins de 5 cm d’eau**.
- Les piscines **hors-sol** n’ont pas de réglementation spécifique : **verrouillez l’accès** après chaque utilisation.
- **Videz** pataugeoires, bassines et seaux après usage.
- **Un adulte référent par enfant**, à portée de bras, qui ne fait rien d’autre.

## Comprendre
Les piscines gonflables, démontables ou hors-sol se sont multipliées dans les jardins. La DGCCRF rappelle qu’elles ne relèvent pas de l’obligation de dispositif de sécurité des piscines enterrées, mais de l’obligation générale de sécurité des produits, et que de jeunes enfants s’y noient chaque année. L’échelle laissée en place, une chaise ou un jouet contre la paroi suffisent pour qu’un enfant s’y hisse.

Le ministère des Sports insiste : la noyade survient très vite et sans bruit. Les témoignages de sa campagne évoquent des noyades survenues en dehors des temps de baignade, chez des enfants de 1 an et demi à 2 ans et demi. Le site 1000 premiers jours rappelle qu’un enfant peut se noyer dans n’importe quel point d’eau : baignoire, seau, pataugeoire, bassin.

## Au quotidien
**Piscine hors-sol**
- Retirez ou relevez l’échelle extérieure après chaque baignade et rangez ce qui pourrait servir de marchepied.
- Couvrez le bassin ou bloquez son accès dès que personne ne surveille.
- Ne laissez jamais un enfant seul dans l’eau ou au bord, même quelques secondes.

**Petits volumes d’eau**
- Videz la pataugeoire dès la fin du jeu et retournez-la.
- Ne laissez pas de seau, bassine ou arrosoir rempli dans le jardin.
- Protégez bassins d’agrément, mares, puits et récupérateurs d’eau de pluie par un couvercle ou une clôture, et surveillez l’enfant à proximité.

**Pendant la baignade**
- Désignez un adulte par enfant, à portée de bras, sans téléphone ni lecture.
- Baignez-vous avec les moins de 6 ans.
- Préférez des brassards adaptés à des bouées, et restez dans l’eau avec l’enfant.
- Si vous devez vous absenter, sortez l’enfant de l’eau et emmenez-le, enroulé dans une serviette.

**Apprendre l’eau**
Le ministère des Sports recommande d’apprendre à nager vers 3 ou 4 ans et de familiariser tôt l’enfant à l’eau. Savoir nager ne dispense jamais d’une surveillance rapprochée.

## Questions fréquentes
**Une petite piscine de 30 cm d’eau est-elle vraiment dangereuse ?** Oui : un jeune enfant peut se noyer dans 20 cm d’eau, sans crier ni se débattre de façon visible.

**Les alarmes de piscine conviennent-elles à un hors-sol ?** Vérifiez que l’équipement est prévu pour ce type de bassin dans sa notice. Aucun équipement ne remplace la vigilance d’un adulte.

**Que faire après qu’il a bu la tasse ?** Le ministère des Sports conseille d’appeler les secours s’il tousse, vomit, respire difficilement ou s’endort, et que son état ne redevient pas habituel dans les 5 minutes.

## Quand demander conseil
Si un enfant est retrouvé dans l’eau, sortez-le immédiatement, appelez le **15**, le **18** ou le **112** et commencez les gestes de secours s’il ne respire pas. Même s’il semble aller mieux, faites-le examiner. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ chien et chat
  a({
    slug: 'chien-chat-et-bebe-cohabitation-prevenir-morsures',
    title: 'Chien, chat et jeune enfant : organiser la cohabitation et prévenir les morsures',
    summary: 'La plupart des morsures de jeunes enfants surviennent au domicile : les règles de vie qui protègent l’enfant et respectent l’animal.',
    tags: ['chien', 'chat', 'bébé et chien', 'morsure', 'griffure', 'animal de compagnie', 'cohabitation', 'arrivée de bébé', 'signaux de stress'],
    min_age_months: 0, max_age_months: 120, safety_critical: true,
    sources: [S.ameliMorsure, S.ansesMorsures, S.santeAccidentsQuotidien],
    body_md: `## En bref
- **Ne laissez jamais un enfant seul avec un animal**, même familier et quelle que soit sa taille ou sa race.
- Selon l’Anses, la plupart des morsures de jeunes enfants ont lieu **au domicile** ; la race du chien ne suffit pas à prévoir le risque.
- Les jeunes enfants sont surtout mordus **à la tête et au cou**.
- Apprenez à l’enfant à **ne pas déranger** un animal qui mange, dort ou se retire, et à ne pas tirer queue et oreilles.
- Repérez les **signaux de stress** du chien : il se lèche le museau, bâille à répétition, détourne le regard.

## Comprendre
Ameli.fr rappelle que les morsures de chien et de chat sont nombreuses en France, le chien étant en cause dans trois cas sur quatre. Les enfants sont souvent mordus lorsqu’ils sont seuls avec l’animal : ils ne connaissent pas les gestes à éviter et ne repèrent pas les signes d’agacement. L’Anses souligne que même des propriétaires expérimentés décodent mal le langage canin, et que les gestes brusques d’un enfant sont souvent associés aux morsures. Le risque dépend de chaque animal : son éducation, son bien-être, sa santé, ses douleurs éventuelles.

Pour le nourrisson, Santé.fr (mpedia) conseille d’interdire l’accès de la chambre aux animaux, pour des raisons de sécurité et d’allergie, et de surveiller croquettes et gamelles, que l’enfant peut porter à la bouche.

## Au quotidien
**Avant et à l’arrivée de bébé**
- Parlez-en à votre vétérinaire : il peut vous conseiller sur l’éducation et les besoins de votre animal.
- Gardez la porte de la chambre fermée et ne laissez pas l’animal dormir dans le lit ou le berceau.
- Continuez à offrir à l’animal du temps, des sorties et un coin à lui, où personne ne le dérange.

**Règles de la maison**
- Un adulte est toujours présent et attentif quand enfant et animal sont ensemble ; sinon, séparez-les par une porte ou une barrière.
- Gamelles, croquettes et litière restent hors de portée de l’enfant.
- L’enfant ne s’approche pas d’un animal qui dort, mange, ronge un jouet ou s’est réfugié dans son panier.
- On ne grimpe pas sur son dos, on ne le serre pas fort, on ne tire ni la queue ni les oreilles.
- On ne s’interpose pas dans une bagarre entre animaux.

**Dehors**
- On ne caresse pas un chien inconnu, ni un chien tenu en laisse, sans l’accord de son propriétaire.
- On ne court pas devant un chien et on ne fixe pas un chien qui grogne.
- On ne s’approche pas d’une chienne avec ses petits.

**Lire l’animal**
Un chien qui grogne, un chat qui remue la queue, mais aussi, chez le chien, le léchage du museau, les bâillements répétés et le regard détourné : ce sont des signaux de malaise. Éloignez calmement l’enfant.

## Questions fréquentes
**Mon chien est très doux, puis-je les laisser jouer seuls quelques minutes ?** L’Anses et ameli.fr sont clairs : pas sans la surveillance active d’un adulte, quelle que soit la taille ou la race du chien.

**Le chat peut-il dormir avec bébé ?** Non. Gardez la chambre de bébé fermée aux animaux.

**L’enfant a été griffé légèrement : que faire ?** Nettoyez à l’eau et au savon, rincez, séchez et appliquez un antiseptique. Ameli.fr conseille de consulter après une morsure de chat, à cause du risque infectieux élevé.

## Quand demander conseil
Après une morsure, nettoyez la plaie à l’eau et au savon et vérifiez la vaccination contre le tétanos. Consultez si la plaie est profonde, sur la main, le pied ou une articulation, si l’animal est un chat ou s’il est inconnu, ou si la plaie s’infecte. Appelez le **15** ou le **112** pour une morsure au visage, au cou ou aux organes génitaux, une plaie déchiquetée ou un saignement abondant. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ NAC
  a({
    slug: 'reptiles-tortues-nac-salmonelle-bebe-jeune-enfant',
    title: 'Tortue, lézard, serpent et autres NAC : le risque de salmonelle pour bébé',
    summary: 'Les reptiles sont souvent porteurs sains de salmonelles, dangereuses pour les nourrissons même sans contact direct : ce qu’il faut savoir avant d’en adopter ou à l’arrivée de bébé.',
    tags: ['reptile', 'tortue', 'lézard', 'serpent', 'NAC', 'nouveaux animaux de compagnie', 'salmonelle', 'nourrisson', 'terrarium', 'lavage des mains'],
    journeys: ['pregnant', 'newborn', 'child'], min_age_months: 0, max_age_months: 72,
    sources: [S.santeSalmonelles, S.behReptiles, S.sante1000Accidents],
    body_md: `## En bref
- La grande majorité des **reptiles sont porteurs sains** de salmonelles : ils ne sont pas malades mais transmettent la bactérie.
- Ces animaux peuvent provoquer des **infections sévères chez le nourrisson**.
- Une enquête française de 2012 montre que la transmission se fait **souvent sans contact direct** avec l’animal.
- Santé.fr conseille aux nourrissons, aux femmes enceintes et aux personnes immunodéprimées **d’éviter les contacts** avec les reptiles de compagnie.
- **Lavage des mains** après tout contact avec un animal vivant ; ne nettoyez jamais le terrarium dans la baignoire ou l’évier de la cuisine.

## Comprendre
Les salmonelles vivent dans l’intestin de nombreux animaux. Santé.fr (avec l’Institut Pasteur) indique que la grande majorité des reptiles en sont porteurs sains et que ces nouveaux animaux de compagnie peuvent provoquer des infections sévères chez le nourrisson. Les jeunes enfants font partie des personnes les plus susceptibles de développer une forme grave.

Une investigation publiée dans le Bulletin épidémiologique hebdomadaire a étudié en 2012 des enfants de moins de 5 ans atteints de salmonelloses liées à des sérotypes de reptiles. Un tiers des enfants interrogés vivaient avec un reptile (surtout des tortues aquatiques, mais aussi des lézards, un serpent, un iguane) ; un seul avait eu un contact direct avec l’animal. Ils étaient très jeunes : 85 % avaient moins d’un an. La plupart avaient une gastro-entérite avec fièvre, deux une méningite. Douze familles sur treize ignoraient ce risque. Les auteurs soulignent que l’habitat et les vêtements peuvent rester contaminés et qu’un animal en bonne santé peut transmettre la bactérie.

Le site 1000 premiers jours recommande lui aussi de tenir les bébés éloignés des animaux exotiques, comme les rats, les tortues ou les reptiles.

## Au quotidien
**Vous envisagez d’adopter un NAC**
- Si vous attendez un bébé ou avez un enfant de moins de 5 ans, parlez-en d’abord à votre médecin ou à un vétérinaire. Les auteurs du BEH citent des recommandations américaines qui déconseillent d’acquérir un reptile dans un foyer avec un enfant de moins de 5 ans ; ils précisent qu’il n’existe pas de recommandation équivalente en France.

**Vous avez déjà un reptile**
- Placez le terrarium ou l’aquarium hors des pièces de vie de bébé, et jamais dans sa chambre ni dans la cuisine.
- Ne laissez pas l’animal circuler librement dans la maison.
- Lavez-vous les mains au savon après chaque contact avec l’animal, son eau, son matériel ou ses déjections, avant de toucher bébé ou de préparer un repas ou un biberon.
- Nettoyez le terrarium avec des gants, loin de la baignoire, de l’évier de cuisine et des affaires de bébé.
- Changez de vêtements après le nettoyage si vous allez porter votre bébé.
- Confiez l’entretien à un adulte, jamais à un enfant.

**Les autres animaux**
Le lavage des mains après avoir touché un animal vivant vaut pour tous, y compris lors d’une visite de ferme pédagogique, comme le rappelle Santé.fr.

## Questions fréquentes
**Notre tortue n’a jamais été malade, est-elle dangereuse ?** Un reptile porteur sain ne montre aucun signe. Aucun des animaux de l’enquête n’était malade avant l’enfant.

**Faut-il se séparer de l’animal à la naissance ?** C’est une décision à prendre avec votre médecin et un vétérinaire. Les auteurs du BEH rappellent que l’environnement peut rester contaminé après le départ de l’animal : un nettoyage soigneux est alors nécessaire.

**Quels signes doivent alerter chez bébé ?** Fièvre, diarrhée, vomissements, douleurs abdominales. Signalez au médecin la présence d’un reptile à la maison.

## Quand demander conseil
Consultez rapidement si votre bébé a de la fièvre, une diarrhée ou des vomissements, et sans attendre s’il a moins de 3 mois. Appelez le **15** ou le **112** s’il est très somnolent, gémit, refuse de boire, a le teint gris ou des difficultés à respirer. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ fêtes
  a({
    slug: 'fetes-fin-annee-noel-sapin-bougies-plantes-jouets-securite-enfant',
    title: 'Noël et fêtes de fin d’année : sapin, bougies, plantes, guirlandes et nouveaux jouets',
    summary: 'Houx, gui, bougies, guirlandes électriques, piles des nouveaux jouets, maison pleine de monde : les points de vigilance des fêtes avec un jeune enfant.',
    tags: ['Noël', 'fêtes', 'sapin', 'bougies', 'guirlande', 'houx', 'gui', 'poinsettia', 'piles', 'nouvel an', 'jouets'],
    min_age_months: 6, max_age_months: 96, safety_critical: true,
    sources: [S.ansesPlantesDeco, S.incIncendie, S.ansesIntox],
    body_md: `## En bref
- **Houx, gui et poinsettia** décorent la maison mais sont toxiques s’ils sont mangés ; près de 40 % des appels pour le houx ont lieu en décembre et janvier.
- **Bougies** et foyers à l’éthanol loin des rideaux, nappes, canapés et lits, et jamais sans surveillance.
- **Guirlandes et décorations électriques conformes**, débranchées la nuit et en votre absence.
- **Piles des nouveaux jouets** : compartiment fermé, piles neuves et usagées hors de portée.
- Maison pleine = vigilance diluée : **désignez un adulte** pour surveiller l’enfant.

## Comprendre
Les fêtes réunissent ce qui attire un jeune enfant : des lumières, des boules brillantes, des baies colorées, des emballages, des petits objets et des adultes occupés. L’Anses indique que chaque année, 60 à 80 appels aux centres antipoison concernent des enfants de moins de 15 ans ayant mis des baies de houx en bouche, et environ 40 le gui, surtout entre novembre et janvier. Le plus souvent, une ou deux baies avalées ne provoquent pas de symptôme ou de légers troubles digestifs ; de plus grandes quantités peuvent entraîner vomissements, diarrhée, somnolence, et pour le gui des troubles cardiaques. Une feuille de poinsettia mise en bouche peut causer de légers troubles digestifs.

Côté incendie, la plaquette de l’INC et de l’Agence qualité construction rappelle de tenir les flammes nues à distance des matériaux inflammables et d’utiliser des guirlandes conformes. L’Anses, enfin, signale des ingestions de piles bouton provenant de jouets ou de télécommandes.

## Au quotidien
**Plantes et décorations**
- Suspendez gui et houx en hauteur, ramassez baies et feuilles tombées, et gardez l’étiquette ou une photo des plantes.
- Fixez le sapin pour qu’il ne bascule pas si l’enfant tire dessus.
- Placez les décorations fragiles ou petites en haut du sapin, hors de portée.
- Rangez crochets, petites boules et figurines de crèche quand l’enfant est petit.

**Bougies et électricité**
- Posez bougies et photophores sur un support stable, loin des rideaux et du sapin, hors de portée, et éteignez-les en quittant la pièce.
- Achetez des guirlandes conformes, vérifiez leur état avant de les installer et jetez celles dont le fil est abîmé.
- Ne surchargez pas les multiprises et débranchez les illuminations la nuit.

**Cadeaux et jouets**
- Respectez l’âge indiqué sur l’emballage et lisez les avertissements.
- Vérifiez que le compartiment à piles est bien fermé avant de donner le jouet.
- Ramassez rapidement emballages plastiques, rubans, petites pièces et piles de rechange.
- Rangez les jouets des aînés à petites pièces hors de portée du plus jeune.

**Repas et réceptions**
- Mettez hors de portée cacahuètes, fruits secs, chocolats et bonbons, ainsi que verres et cendriers.
- Ne portez pas un enfant dans les bras en manipulant des plats ou boissons chauds.
- Pensez aux sacs des invités posés au sol : médicaments, cigarettes, piles.

## Questions fréquentes
**Il a avalé une baie de houx : que faire ?** L’Anses conseille d’essuyer sa bouche avec un linge humide, de ne rien lui donner à boire et d’appeler un centre antipoison, en ayant si possible le nom ou une photo de la plante.

**Le sapin naturel est-il plus risqué qu’un sapin artificiel ?** Dans les deux cas, fixez-le, éloignez-le des sources de chaleur et des bougies, et choisissez des guirlandes conformes.

**Et les animaux ?** Houx, gui et poinsettia sont aussi toxiques pour les chiens et les chats : en cas d’ingestion, contactez un centre antipoison vétérinaire.

## Quand demander conseil
${CAP} En cas de pile bouton avalée ou suspectée, appelez immédiatement le **15**. Si l’enfant s’étouffe et ne peut plus respirer, appelez le **15** ou le **112** et pratiquez les gestes de désobstruction. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ grands-parents et location
  a({
    slug: 'chez-grands-parents-amis-location-vacances-securiser-lieu',
    title: 'Chez les grands-parents, chez des amis ou en location : sécuriser un lieu qui n’est pas adapté',
    summary: 'Médicaments sur la table de nuit, escalier sans barrière, piscine, lit superposé : le tour rapide à faire en arrivant dans une maison qui n’est pas équipée pour un jeune enfant.',
    tags: ['grands-parents', 'vacances', 'location', 'maison de famille', 'médicaments', 'piscine', 'escalier', 'fenêtre', 'lit superposé', 'check-list'],
    min_age_months: 6, max_age_months: 96, safety_critical: true,
    sources: [S.ansesIntox, S.dgccrfLits, S.spPiscine],
    body_md: `## En bref
- Faites **le tour du lieu à hauteur d’enfant** dès l’arrivée, avant de défaire les valises.
- L’Anses rappelle de ranger **tous les médicaments en hauteur ou sous clé, y compris chez les grands-parents**.
- Repérez escaliers, fenêtres basses, balcons et **points d’eau** ; une piscine louée doit avoir son dispositif de sécurité opérationnel.
- Un **lit en hauteur** ne convient pas aux moins de 6 ans ; s’il paraît fragile, ne l’utilisez pas.
- Notez l’**adresse exacte** du lieu et les numéros d’urgence.

## Comprendre
Les accidents surviennent aussi hors de chez soi, dans des lieux que l’on connaît mal ou qui ne sont plus habitués aux tout-petits. L’Anses insiste sur ce point à propos des intoxications : à la maison comme en vacances ou chez des proches, les petits objets et les produits dangereux doivent être hors de portée. Chez des grands-parents, piluliers et boîtes de médicaments peuvent rester sur une table de chevet ou dans un sac, et certains traitements de l’adulte sont particulièrement dangereux pour un jeune enfant.

Les vacances ajoutent leurs propres risques : piscine, escaliers inhabituels, lits superposés, fenêtres sans dispositif de blocage.

## Au quotidien
**Le tour d’arrivée (10 minutes)**
- **Médicaments et produits** : demandez où ils sont rangés et proposez de les monter en hauteur ou dans un placard fermé, ainsi que produits ménagers, tabac et cigarette électronique.
- **Escaliers** : apportez une barrière si vous en avez une adaptée, ou bloquez l’accès par une porte, et surveillez.
- **Fenêtres et balcons** : déplacez les meubles placés dessous, fermez le balcon hors surveillance.
- **Prises** : emportez quelques cache-prises.
- **Cuisine** : manches de casseroles vers le mur, bouilloire et fer à repasser hors de portée.
- **Petits objets** : bibelots, pièces, piles bouton, télécommandes, plantes d’intérieur.

**Couchage**
- Pour un bébé, prévoyez un lit adapté (lit parapluie avec son seul matelas d’origine) et vérifiez qu’aucun cordon ne pend près du lit.
- Lit superposé ou mezzanine : la DGCCRF demande que le couchage en hauteur soit totalement interdit aux moins de 6 ans. Vérifiez la présence de barrières et l’état des fixations ; si le lit ne présente pas toutes les garanties, ne l’utilisez pas et signalez-le au gestionnaire.

**Eau**
- Piscine enterrée en location : Service-Public.gouv.fr précise que le dispositif de sécurité doit être installé et opérationnel avant votre arrivée ; ne désactivez pas l’alarme pendant le séjour.
- Repérez aussi bassins, mares, récupérateurs d’eau et pataugeoires.
- Désignez à chaque baignade un adulte responsable de chaque enfant.

**En parler avec bienveillance**
Les grands-parents ont élevé leurs enfants avec d’autres repères. Présentez ces gestes comme une aide pour que tout le monde profite sereinement, sans reproche.

## Questions fréquentes
**Mes parents ne veulent pas changer leurs habitudes : comment faire ?** Concentrez-vous sur l’essentiel : les médicaments, les produits dangereux, les fenêtres et l’eau. Proposez de ranger vous-même pendant le séjour.

**Que mettre dans un petit kit sécurité de voyage ?** Quelques cache-prises, un thermomètre de bain et une liste des numéros utiles, dont le centre antipoison de la région.

**Qui surveille quand nous sommes nombreux ?** Désignez à voix haute un adulte « de garde » par période : quand tout le monde surveille, plus personne ne surveille vraiment.

## Quand demander conseil
${CAP} Gardez sur vous l’adresse exacte du lieu (étage, code d’accès) pour la donner aux secours. Pour toute urgence vitale, appelez le **15** ou le **112** ; le 112 est joignable dans toute l’Union européenne. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ piéton
  a({
    slug: 'enfant-pieton-en-ville-trottoir-traverser-par-age',
    title: 'Sortir à pied avec son enfant : trottoir, traversée et autonomie selon l’âge',
    summary: 'Champ de vision réduit, difficulté à juger les distances : comment accompagner l’enfant piéton, lui apprendre à traverser et lui laisser de l’autonomie au bon moment.',
    tags: ['piéton', 'sécurité routière', 'traverser', 'trottoir', 'tenir la main', 'chemin de l’école', 'visibilité', 'bandes réfléchissantes', 'sorties'],
    journeys: ['child'], min_age_months: 18, max_age_months: 144, safety_critical: true,
    sources: [S.mpediaRoute],
    body_md: `## En bref
- L’enfant a un **champ de vision plus étroit**, il est **moins visible** et juge mal les **distances, la vitesse** et l’origine des bruits.
- **Tenir la main** est recommandé jusqu’à environ **7 ans**, puis l’enfant reste accompagné.
- Vers **8 ans**, un **court trajet seul** est envisageable s’il est sans danger, après l’avoir observé le faire ; vers **10–11 ans**, il circule de façon autonome.
- Sur le trottoir, l’enfant marche **côté maisons** ; sans trottoir, on marche **à gauche**, face aux voitures.
- Le soir, **bandes ou autocollants réfléchissants** sur le cartable et les vêtements.

## Comprendre
mpedia explique pourquoi l’enfant est un piéton vulnérable. Petit, il est facilement masqué par une voiture garée ou du mobilier urbain. Il regarde surtout devant lui, voit moins sur les côtés et a du mal à estimer la distance et la vitesse d’un véhicule, ou à savoir d’où vient un bruit. Lorsqu’il voit une voiture, il pense souvent que le conducteur l’a vu, ce qui n’est pas toujours le cas.

L’autonomie se construit donc progressivement. Vers 6 ans, l’enfant est trop jeune pour circuler seul, mais il peut commencer à apprendre. Vers 7 ans, il peut lâcher la main tout en restant accompagné. Vers 8 ans, il peut faire un court trajet seul s’il ne présente pas de danger. Vers 10–11 ans, il peut se déplacer seul, mais il ne doit pas être chargé d’accompagner un plus jeune.

## Au quotidien
**Avec un tout-petit**
- Tenez-lui la main, ou gardez-le en poussette ou en porte-bébé dans les rues passantes.
- Faites-le marcher du côté des maisons, et non du côté de la chaussée.
- Soyez attentif aux sorties de garage et de parking : un véhicule peut surgir en marche arrière.

**Apprendre à traverser**
- Traversez sur les passages piétons et au feu vert pour les piétons.
- Avant de traverser : regarder à gauche, à droite, puis encore à gauche.
- Traversez sans courir, en continuant à regarder.
- Laissez l’enfant appuyer sur le bouton d’appel du feu et expliquez-lui ce que vous faites.
- Montrez l’exemple : l’enfant apprend surtout en vous imitant.

**Hors agglomération**
- Sans trottoir, marchez sur le bord gauche de la route pour voir les voitures arriver, et montez sur l’accotement si besoin.

**Être vu**
- À la tombée de la nuit, ajoutez des bandes ou autocollants réfléchissants sur le cartable et le manteau, pour être vu de plus loin.

**Le chemin de l’école**
- Faites le trajet ensemble plusieurs fois, en commentant les endroits délicats.
- Laissez-le ensuite vous guider, puis observez-le faire seul avant de le lui confier.

## Questions fréquentes
**Mon enfant de 5 ans connaît les règles : peut-il traverser seul ?** Connaître les règles ne suffit pas : à cet âge, sa perception des distances, de la vitesse et des bruits n’est pas celle d’un adulte. mpedia recommande qu’il soit accompagné.

**Il veut lâcher ma main dans la rue, comment faire ?** Expliquez simplement la règle et proposez une alternative : tenir la poussette ou votre sac, puis lâcher la main dans les zones calmes.

**Peut-il accompagner son petit frère à l’école ?** mpedia déconseille de confier à un enfant de 10–11 ans la responsabilité d’un plus jeune.

## Quand demander conseil
Après un choc avec un véhicule, même à faible vitesse et même si l’enfant semble aller bien, appelez le **15** ou le **112** et ne le déplacez pas s’il se plaint du dos ou de la nuque. Faites-le examiner par un médecin. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ équipements de sécurité
  a({
    slug: 'equipements-securite-maison-barrieres-bloque-portes-cache-prises-choisir',
    title: 'Barrières, bloque-portes, cache-prises : bien choisir les équipements de sécurité',
    summary: 'Les équipements de sécurité aident à prévenir les accidents s’ils sont bien choisis, bien installés et utilisés à chaque fois : les repères de la DGCCRF et des pédiatres.',
    tags: ['équipements de sécurité', 'barrière', 'bloque-porte', 'cache-prise', 'protège-coins', 'bloque-tiroir', 'bloque-fenêtre', 'puériculture', 'occasion', 'RappelConso'],
    min_age_months: 4, max_age_months: 72, category: 'materiel',
    sources: [S.dgccrfPuericulture, S.santeAccidentsQuotidien, S.incChambre],
    body_md: `## En bref
- Les équipements (barrières, cache-prises, bloque-portes, bloque-tiroirs, protège-coins, bloque-fenêtres) **aident**, mais le **risque zéro n’existe pas** : la surveillance d’un adulte reste la protection principale.
- À l’achat, vérifiez **l’étiquetage en français**, le nom et l’adresse du fabricant, l’**âge** ou le **poids** d’utilisation et la **notice**.
- **Montez selon la notice**, testez régulièrement les verrous, ne modifiez jamais un article.
- **D’occasion**, un article peut être moins sûr : sans notice, pièces usées.
- Consultez **RappelConso** pour savoir si un produit a fait l’objet d’un rappel.

## Comprendre
Santé.fr (mpedia) cite les cache-prises, les bloque-portes et les protège-coins parmi les dispositifs utiles, tout en rappelant que la surveillance constante d’un adulte reste la meilleure protection. Ces équipements ne valent que s’ils sont adaptés à votre logement, correctement posés et utilisés à chaque fois : une barrière laissée ouverte ou un bloque-fenêtre déverrouillé ne protègent plus.

La DGCCRF encadre les articles de puériculture destinés aux enfants de moins de 4 ans, parmi lesquels figurent les barrières de sécurité, les barrières de lit et les parcs. Ils doivent être stables, ne pas exposer l’enfant à des coupures, pincements, étranglements ou risques de suffocation, et leurs dispositifs de verrouillage ne doivent pas pouvoir être actionnés par l’enfant. Un article fabriqué selon une norme publiée au Journal officiel, ou ayant obtenu une attestation d’examen de type d’un laboratoire accrédité, est présumé conforme.

## Au quotidien
**Faire la liste selon l’âge**
- Avant les premiers déplacements : cache-prises ou prises à éclipses, barrières d’escalier, rangement en hauteur des produits et médicaments.
- Quand il se met debout : protège-coins, fixation des meubles au mur, bloque-tiroirs.
- Quand il grimpe et ouvre tout : bloque-portes, bloque-placards, bloque-fenêtres hors de sa portée.

**Bien acheter**
- Vérifiez l’âge, la taille et le poids indiqués, ainsi que l’usage prévu.
- Lisez l’étiquette et la notice de montage, en français.
- Contrôlez la solidité des pièces sollicitées : verrou, charnières, fixations.
- D’occasion, vérifiez le bon fonctionnement, demandez la notice et ne vous fiez pas à l’aspect propre du produit.

**Bien installer et entretenir**
- Respectez la notice et l’emplacement prévu par le fabricant.
- Testez régulièrement les verrous et les fixations.
- Ne modifiez jamais la conception d’un article et ne réparez pas vous-même une pièce usée : adressez-vous au service après-vente.

**Suivre les rappels**
- Le site RappelConso recense les produits rappelés : consultez-le avant un achat d’occasion et si vous avez un doute sur un article.
- Pour signaler un produit dangereux, la DGCCRF propose le site SignalConso.

## Questions fréquentes
**Les cache-prises sont-ils tous équivalents ?** L’INC cite les prises à éclipses ainsi que les cache-prises à ventouse ou à clé. Choisissez un modèle que l’enfant ne peut pas retirer et qui reste en place.

**Un bloque-fenêtre suffit-il contre les chutes ?** Il aide, à condition d’être placé hors de portée et verrouillé. Rien ne doit se trouver sous la fenêtre, et l’enfant ne reste pas seul près d’une fenêtre ouverte.

**Faut-il tout équiper dès la naissance ?** Non : les besoins évoluent avec la motricité. Refaites le tour de la maison à hauteur d’enfant à chaque nouvelle étape : ramper, se mettre debout, marcher, grimper.

## Quand demander conseil
Si un équipement s’est cassé et que l’enfant s’est blessé, gardez l’article et son emballage et signalez-le. En cas de chute avec perte de connaissance, vomissements, somnolence ou comportement inhabituel, appelez le **15**. ${URG}

${FIN}`,
  }),
];
