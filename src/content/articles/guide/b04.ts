/** Guide complet — lot 04 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ».
 * Thème : les repas de l'enfant de 1 à 3 ans. Aucune quantité de lait, aucun grammage ni rythme de biberon n'est recommandé par l'application :
 * ces repères relèvent du professionnel qui suit l'enfant. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page.
const S = {
  spfPasAPas: { label: 'Santé publique France — Pas à pas, votre enfant mange comme un grand (brochure, de la diversification à 3 ans)', url: 'https://www.santepubliquefrance.fr/nutrition-et-activite-physique/brochure/pas-a-pas-votre-enfant-mange-comme-un-grand', consulted_on: C, published: '2026-10-23' },
  sante13: { label: 'Santé.fr (information mpedia) — Alimentation équilibrée, 1 et 3 ans', url: 'https://www.sante.fr/alimentation-equilibree-1-et-3-ans', consulted_on: C, published: '2022-01-24' },
  sante1223: { label: 'Santé.fr (information mpedia) — Alimentation du bébé de 12 à 23 mois : menus types et besoins nutritionnels', url: 'https://www.sante.fr/alimentation-du-bebe-de-12-23-mois-menus-types-et-besoins-nutritionnels', consulted_on: C, published: '2026-04-20' },
  mpedia1224: { label: 'mpedia.fr (AFPA) — Menus de 12 à 24 mois : vers une alimentation de grands', url: 'https://www.mpedia.fr/art-menus-types-entre-mois/', consulted_on: C, published: '2023-01-24' },
  santeAppetit: { label: 'Santé.fr (information mpedia) — Différencier perte d’appétit pathologique, faibles besoins alimentaires et alimentation déséquilibrée', url: 'https://www.sante.fr/differencier-perte-dappetit-pathologique-faibles-besoins-alimentaires-et-alimentation-desequilibree', consulted_on: C, published: '2025-12-10' },
  santeSelectivite: { label: 'Santé.fr (information mpedia) — Mon enfant ne mange pas de légumes, la sélectivité alimentaire', url: 'https://www.sante.fr/mon-enfant-ne-mange-pas-de-legumes-la-selectivite-alimentaire', consulted_on: C, published: '2024-10-30' },
  santeVege: { label: 'Santé.fr (information mpedia) — Enfant végétarien ou végétalien : quelles précautions pour sa santé ?', url: 'https://www.sante.fr/enfant-vegetarien-ou-vegetalien-est-ce-sans-danger-pour-sa-sante', consulted_on: C, published: '2026-01-30' },
  ameliInhale: { label: 'ameli.fr — Corps étranger inhalé par « fausse route »', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/inhale', consulted_on: C, published: '2018-04-12' },
  santeAccidents: { label: 'Santé.fr (information mpedia) — Accidents domestiques : protéger au quotidien votre enfant', url: 'https://www.sante.fr/accidents-domestiques-proteger-au-quotidien-votre-enfant', consulted_on: C, published: '2026-01-26' },
  ufsbdCarie: { label: 'UFSBD (Union française pour la santé bucco-dentaire) — Fiche conseil : alimentation et carie chez l’enfant', url: 'https://www.ufsbd.fr/wp-content/uploads/2013/08/ficheAlimentation-carie-enfant.pdf', consulted_on: C },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du médecin, de la PMI ou du professionnel de santé qui connaît votre enfant.';

export const GUIDE_B04: LibArticle[] = [
  // ───────────────────────────── Organisation des repas ─────────────────────────────
  {
    slug: 'repas-de-2-a-3-ans',
    title: 'Les repas de 2 à 3 ans : vers l’assiette de la famille',
    summary: 'Entre 2 et 3 ans, l’enfant mange presque comme vous : comment composer ses repas, adapter les textures et garder le plaisir malgré les premiers refus.',
    body_md: `Votre enfant a passé 2 ans : il mange à table avec vous, réclame ce qu'il voit dans votre assiette et commence aussi à trier. Voici les repères pour composer ses repas entre 2 et 3 ans, sans compter chaque bouchée.

## En bref
- L'enfant mange de plus en plus comme la famille, avec des préparations peu salées et des textures adaptées à sa mastication.
- La journée s'organise autour de trois repas et d'un goûter, sans grignotage entre les deux.
- Le lait et les produits laitiers restent présents chaque jour ; les quantités se discutent avec le médecin.
- L'eau est la seule boisson indispensable.
- Vers 2–3 ans, beaucoup d'enfants deviennent plus méfiants face aux aliments nouveaux : on continue à proposer, sans forcer.

## Comprendre
Entre 1 et 3 ans, l'enfant apprend progressivement à manger « comme les grands ». Avant 2 ans, il accepte souvent volontiers les nouveautés ; entre 2 et 3 ans apparaît fréquemment la néophobie, c'est-à-dire la méfiance envers les aliments inconnus. Les repas pris en famille ou à la crèche l'aident à découvrir de nouvelles saveurs, parce qu'il imite ce qu'il voit.

Les repères des professionnels pour cet âge sont simples : des fruits et des légumes à chaque repas, des féculents (pain, pâtes, riz, semoule, pommes de terre, légumes secs) à chaque repas, une petite quantité de viande, de poisson ou d'œuf dans la journée, des produits laitiers, et des matières grasses de bonne qualité, notamment des huiles végétales ajoutées crues. Le poisson est conseillé deux fois par semaine, dont un poisson gras. Les quantités précises varient selon l'enfant : c'est son appétit, sa vitalité et sa courbe de croissance qui servent de repère.

Jusqu'à 3 ans, Santé publique France conseille de ne pas saler les plats préparés pour l'enfant et de ne pas ajouter de sucre aux fruits. Les produits ultra-transformés (chips, nuggets, pizzas industrielles, sodas), souvent gras, sucrés ou salés, sont à limiter.

## Au quotidien
- **Partez du plat familial** : prélevez la part de l'enfant avant d'ajouter le sel ou les sauces fortes, puis adaptez la texture (écrasé, coupé en petits morceaux tendres).
- **Composez l'assiette simplement** : un légume, un féculent, éventuellement un peu de protéines au déjeuner, un filet d'huile crue (colza, noix, olive).
- **Servez de petites portions** et resservez s'il le demande, plutôt que de remplir l'assiette.
- **Variez les recettes d'un même légume** : en soupe, en gratin, en purée, en tarte. Le goût et l'aspect changent, l'envie aussi.
- **Laissez-le participer** : laver les légumes, mélanger, mettre la table.
- **Gardez un cadre** : c'est l'adulte qui décide du menu ; l'enfant décide de la quantité qu'il mange.

Exemple de journée, à adapter : un petit-déjeuner avec du lait ou un laitage, du pain et un fruit ; un déjeuner avec légumes, féculents et une petite part de poisson ; un goûter avec une tartine et un fruit ; un dîner avec une soupe de légumes, des pâtes et un fromage.

## Questions fréquentes
**Peut-il manger exactement la même chose que nous ?**
De plus en plus, oui, à condition de limiter le sel, le sucre, les fritures et les aliments très gras ou très salés comme la charcuterie, et d'adapter la texture à sa mastication.

**Il ne veut plus de légumes qu'il aimait avant, que faire ?**
Ce rejet est fréquent vers 2 ans. Continuez à en proposer, sous d'autres formes, et à en manger devant lui. Le repas doit rester un moment agréable.

**Faut-il encore des produits « spécial bébé » ?**
Santé publique France indique que des yaourts, petits-suisses ou fromages blancs nature courants conviennent, et qu'il est inutile de multiplier les produits spécifiques, souvent plus chers. Évitez les produits allégés, écrémés ou demi-écrémés.

**Comment savoir s'il mange assez ?**
Regardez sa forme, son énergie et l'évolution de sa courbe dans le carnet de santé, plutôt que le contenu de chaque assiette.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant refuse durablement des familles entières d'aliments, perd du poids ou change de couloir sur sa courbe, semble fatigué, ou si les repas deviennent une source d'angoisse. En cas d'étouffement avec impossibilité de respirer, appelez immédiatement le 15 ou le 112. Si l'épuisement ou l'angoisse vous submergent, le 3114 répond jour et nuit.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['repas', '2 ans', '3 ans', 'menu enfant', 'assiette', 'equilibre alimentaire'],
    min_age_months: 24,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13],
    status: 'to_review',
  },
  {
    slug: 'rythme-des-repas-1-3-ans',
    title: 'Trois repas et un goûter : organiser la journée du tout-petit',
    summary: 'Pourquoi des repas à heures régulières aident l’enfant de 1 à 3 ans à manger avec appétit, et comment caler la journée avec la sieste, la crèche et les imprévus.',
    body_md: `À quelle heure faire manger un enfant de 18 mois ? Faut-il un en-cas le matin ? Que faire quand la sieste décale tout ? Un rythme régulier aide beaucoup le tout-petit à arriver à table avec faim et à mieux vivre les repas.

## En bref
- Vers 1 an, la journée s'organise autour de trois repas et d'un goûter : petit-déjeuner, déjeuner, goûter, dîner.
- En dehors de ces moments, il est conseillé de ne rien proposer à manger, pour qu'il arrive à table avec appétit.
- Des horaires réguliers rassurent l'enfant et facilitent l'écoute de sa faim.
- Un repas peu mangé ne se compense pas avant le repas suivant.
- La régularité compte davantage que l'heure exacte : adaptez-la à votre famille et au mode de garde.

## Comprendre
Santé publique France indique que, vers 1 an, l'enfant prend trois repas par jour et un goûter. Ce rythme, souvent appelé « quatre repas », est conseillé jusqu'à l'adolescence. Il permet de couvrir les besoins de l'enfant tout en laissant à la faim le temps de revenir entre deux prises.

Lorsque l'enfant mange un peu tout au long de la journée, il arrive au repas sans faim, mange moins, et l'adulte a l'impression qu'il « ne mange rien ». Les professionnels de mpedia rappellent que, chez un enfant qui grandit bien, la difficulté vient souvent de la répartition : du lait plusieurs fois par jour, des boissons sucrées ou du grignotage coupent l'appétit au moment du repas. Un enfant en bonne santé n'a pas besoin de collation en plus des quatre repas.

Les prises alimentaires répétées jouent aussi sur les dents : l'Union française pour la santé bucco-dentaire explique que chaque prise acidifie la bouche, et que des prises trop rapprochées abîment l'émail. Regrouper les repas en quatre temps protège donc aussi les dents de lait.

## Au quotidien
- **Fixez des repères simples** : par exemple un petit-déjeuner au réveil, un déjeuner vers midi, un goûter au milieu de l'après-midi et un dîner en début de soirée. Ajustez à vos horaires.
- **Composez avec la sieste** : si elle tombe à l'heure du déjeuner, avancez légèrement le repas plutôt que de réveiller un enfant affamé et grognon.
- **Annoncez le repas** quelques minutes avant : ranger les jouets, se laver les mains, s'installer. Ce petit rituel aide à passer du jeu à la table.
- **Un seul goûter** : si la crèche ou l'assistante maternelle en a déjà donné un, inutile d'en proposer un second au retour.
- **Pas de nourriture en libre accès** : évitez de laisser des aliments visibles ou à portée de main entre les repas.
- **Si le repas a été peu mangé**, attendez tranquillement le suivant, sans proposer un biscuit ou un laitage « pour compenser ».

## Questions fréquentes
**Faut-il une collation le matin à la crèche ou à la maison ?**
Les repères de mpedia et de Santé publique France reposent sur trois repas et un goûter. Si votre enfant a très faim le matin, regardez d'abord son petit-déjeuner et l'heure du déjeuner, et parlez-en avec la structure d'accueil.

**Le dîner se termine très tard à cause de nos horaires, est-ce un problème ?**
Un enfant fatigué mange souvent moins bien. Vous pouvez lui servir son dîner un peu plus tôt et partager avec lui un moment à table quand vous mangez, par exemple autour d'un fruit ou d'un laitage s'il n'en a pas eu.

**Il réclame à manger entre les repas, dois-je refuser ?**
Proposez de l'eau, rappelez-lui quand aura lieu le prochain repas, et occupez-le autrement. Si les demandes sont très fréquentes, regardez si les repas sont suffisamment variés et rassasiants, et parlez-en au médecin si vous avez un doute.

**Le week-end, tout se décale : est-ce gênant ?**
Quelques variations ne posent pas de difficulté. C'est la régularité générale qui aide l'enfant.

## Quand demander conseil
Consultez si votre enfant semble avoir faim en permanence, ou au contraire ne montre presque jamais de faim, s'il perd du poids, s'il est moins dynamique ou si sa courbe change. Une perte d'appétit qui dure mérite toujours un avis médical. En cas de malaise ou de difficulté à respirer, appelez le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['rythme des repas', 'horaires', 'gouter', 'collation', 'quatre repas', 'sieste'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.santeAppetit, S.ufsbdCarie],
    status: 'to_review',
  },
  {
    slug: 'gouter-du-tout-petit-1-3-ans',
    title: 'Le goûter du tout-petit : quoi proposer entre 1 et 3 ans ?',
    summary: 'Le goûter est un vrai repas pour l’enfant de 1 à 3 ans : des idées simples, ce qu’il vaut mieux limiter et comment faire quand la crèche en donne déjà un.',
    body_md: `Biscuits, compote, tartine, fruit ? Le goûter est souvent le repas le plus improvisé de la journée, alors qu'il compte vraiment pour un tout-petit. Voici comment le composer simplement.

## En bref
- Le goûter fait partie des quatre temps de repas de la journée : il n'est pas un « en-cas » facultatif.
- Un seul goûter par jour : s'il a été donné à la crèche ou chez l'assistante maternelle, on n'en ajoute pas un second.
- Les bonnes bases : une tartine, un fruit ou une compote, un produit laitier.
- Viennoiseries, gâteaux, biscuits et chocolat sont à limiter et à introduire le plus tard possible.
- L'eau reste la boisson du goûter.

## Comprendre
Pour l'enfant de 1 à 3 ans, Santé publique France compte le goûter parmi les repas de la journée. Il permet de tenir jusqu'au dîner sans grignoter. La brochure « Pas à pas, votre enfant mange comme un grand » conseille d'y privilégier une tartine, un fruit ou une compote, ou un produit laitier, et de limiter au maximum les viennoiseries, les gâteaux, les biscuits et le chocolat. Elle précise aussi que les biscuits et produits du commerce présentés comme destinés aux moins de 3 ans sont souvent trop gras et trop sucrés.

Le chocolat fait l'objet d'une recommandation particulière : l'Anses et le Haut Conseil de la santé publique, cités par mpedia, conseillent d'en limiter la consommation chez les jeunes enfants. Côté boissons, l'eau est la seule boisson indispensable ; les jus de fruits, même sans sucres ajoutés, sont très sucrés et Santé publique France ne les recommande pas.

Enfin, un goûter pris à heure régulière, assis, sans écran, aide l'enfant à reconnaître sa faim et sa satiété, comme aux autres repas.

## Au quotidien
Quelques idées de goûters simples, à faire tourner :
- **Pain et fruit** : une tartine de pain (éventuellement avec un peu de beurre) et des quartiers de fruit bien mûr coupés en petits morceaux.
- **Laitage et fruit** : un yaourt nature dans lequel vous écrasez une banane ou des fraises, plutôt qu'un dessert lacté sucré.
- **Compote et pain** : une compote sans sucre ajouté avec un morceau de pain.
- **Fromage et fruit** : quelques dés de fromage pasteurisé avec des morceaux de poire.
- **Fait maison de temps en temps** : un gâteau peu sucré préparé ensemble, pour le plaisir de cuisiner.

Côté organisation :
- **Coordonnez-vous avec la crèche ou la nounou** : demandez ce qui a été donné, pour ne pas doubler le goûter.
- **Prévoyez un goûter transportable** pour le parc ou la sortie d'école d'un aîné : un fruit facile, un morceau de pain, une gourde d'eau.
- **Gardez les biscuits et gâteaux pour les occasions**, sans en faire une récompense.

## Questions fréquentes
**Un petit gâteau au goûter, c'est grave ?**
Il ne s'agit pas d'interdire, mais de garder ces produits pour certaines occasions. Au quotidien, les tartines, fruits et laitages sont plus adaptés.

**Les gourdes de compote sont-elles une bonne idée ?**
Elles sont pratiques en sortie. Choisissez une compote sans sucre ajouté et proposez-la de préférence à la cuillère ou dans un bol à la maison, pour que l'enfant continue à mâcher et à manger assis.

**Il ne prend presque rien au goûter puis réclame à 18 heures, que faire ?**
Vous pouvez avancer légèrement le dîner. Évitez de reproposer un goûter en fin d'après-midi, qui couperait l'appétit du soir.

**Peut-on donner du lait au goûter ?**
Oui, le lait et les produits laitiers font partie des repères de cet âge. Les quantités quotidiennes se discutent avec le médecin.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant ne veut plus manger qu'au goûter ou au petit-déjeuner, s'il réclame sans cesse des produits sucrés, ou si sa courbe de croissance s'infléchit. En cas d'étouffement avec un aliment, appelez immédiatement le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['gouter', 'collation', 'biscuits', 'compote', 'idees gouter', 'creche'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13],
    status: 'to_review',
  },
  {
    slug: 'grignotage-tout-petit',
    title: 'Grignotage chez le tout-petit : pourquoi l’éviter et comment s’y prendre',
    summary: 'Biscuits dans la poussette, compotes pour patienter : le grignotage coupe l’appétit et fragilise les dents. Des pistes concrètes pour en sortir sans conflit.',
    body_md: `Un biscuit pour patienter dans la file d'attente, une compote pour calmer un chagrin, des gâteaux apéritif qui traînent sur la table basse… Le grignotage s'installe facilement. Voici pourquoi il vaut mieux l'éviter chez l'enfant de 1 à 3 ans et comment faire concrètement.

## En bref
- En dehors des trois repas et du goûter, il est conseillé de ne rien donner à manger à l'enfant.
- Le grignotage coupe l'appétit au moment des repas et peut entretenir l'impression qu'il « ne mange rien ».
- Les prises répétées favorisent les caries des dents de lait.
- La nourriture n'est pas un outil pour consoler, occuper ou récompenser.
- Ranger les aliments hors de vue et proposer de l'eau aident beaucoup.

## Comprendre
Santé publique France recommande de ne pas proposer à manger à l'enfant en dehors des repas et du goûter, pour qu'il arrive à table avec faim. Les professionnels de mpedia expliquent que, chez un enfant dont la croissance est normale, le manque d'appétit aux repas vient souvent d'une mauvaise répartition : le grignotage, les boissons sucrées ou du lait pris à de multiples reprises coupent la faim. Ils rappellent qu'un enfant en bonne santé n'a pas besoin de collation en dehors des quatre repas.

Le grignotage a aussi un effet sur les dents. Selon l'Union française pour la santé bucco-dentaire, chaque prise alimentaire acidifie la bouche, et la répétition de ces moments abîme l'émail, plus fragile sur les dents de lait. Les aliments sucrés, collants ou fondants (biscuits, bonbons, gâteaux, chips) sont particulièrement en cause.

Enfin, manger pour s'occuper ou se consoler peut brouiller les signaux de faim et de satiété que l'enfant est en train d'apprendre à reconnaître.

## Au quotidien
- **Rangez les aliments hors de vue** : pas de corbeille de biscuits sur la table basse, pas de placard à goûters accessible à l'enfant. Santé publique France conseille de ne pas le laisser se servir seul dans le placard ou le réfrigérateur.
- **Proposez de l'eau** quand il réclame entre les repas, et rappelez-lui le prochain moment de repas : « On goûtera après le parc. »
- **Préparez les sorties** : un jouet, un livre, une chanson pour patienter, plutôt qu'un biscuit.
- **Consolez autrement** : un câlin, des mots, un moment au calme. Une chute ou une colère n'appellent pas de friandise.
- **Prévenez l'entourage** : grands-parents, amis, aînés. Expliquez simplement que vous évitez les en-cas entre les repas.
- **Soignez les vrais repas** : des repas variés, avec des féculents et des légumes, rassasient mieux et réduisent les fringales.

## Questions fréquentes
**Il a vraiment faim avant le dîner, je le laisse attendre ?**
Vous pouvez avancer le dîner, ou proposer dès que vous commencez à cuisiner une entrée de légumes (crudités adaptées à son âge, soupe) qui fera partie du repas.

**Et pendant un long trajet en voiture ?**
Organisez si possible le trajet autour des heures de repas et du goûter, avec une pause pour manger assis. Restez attentif aux risques d'étouffement : un enfant ne devrait pas manger en étant seul à l'arrière sans surveillance.

**Les gâteaux apéritif lors des fêtes de famille ?**
Ces occasions restent ponctuelles. Évitez cependant les aliments petits, durs et ronds comme les cacahuètes ou les olives, à l'origine de fausses routes chez les jeunes enfants.

**Le lait en biberon entre les repas, c'est aussi du grignotage ?**
Des biberons de lait répétés dans la journée peuvent couper l'appétit et favoriser les caries une fois les dents apparues. Parlez-en au médecin pour organiser les prises de lait.

## Quand demander conseil
Consultez si votre enfant réclame à manger en permanence, s'il prend du poids rapidement ou au contraire stagne, ou si vous remarquez des taches sur ses dents. Un chirurgien-dentiste peut examiner les dents de lait dès qu'elles apparaissent. En cas de fausse route avec gêne respiratoire, appelez le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['grignotage', 'en-cas', 'biscuits', 'appetit', 'caries', 'entre les repas'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.santeAppetit, S.ufsbdCarie],
    status: 'to_review',
  },
  // ───────────────────────────── Lait et boissons ─────────────────────────────
  {
    slug: 'quel-lait-apres-1-an',
    title: 'Quel lait donner après 1 an : lait de croissance ou lait de vache ?',
    summary: 'Lait de croissance, lait de vache entier, allaitement qui continue : ce que disent les repères officiels pour l’enfant de 1 à 3 ans, et les points à discuter avec le médecin.',
    body_md: `À 1 an, beaucoup de parents se demandent s'il faut passer au lait de vache « comme tout le monde » ou continuer un lait infantile. Voici ce que disent les recommandations, sans quantités : elles se fixent avec le professionnel qui suit votre enfant.

## En bref
- Le lait et les produits laitiers restent importants chaque jour entre 1 et 3 ans.
- Si votre enfant n'est pas allaité, le lait de croissance est conseillé de 1 à 3 ans, notamment parce qu'il est enrichi en fer.
- Le lait de vache entier est possible à partir de 12 mois, en alternance ou si l'alimentation est par ailleurs bien équilibrée ; il doit être entier.
- Les boissons végétales et le lait de soja ne remplacent pas le lait avant 3 ans.
- Le lait est un aliment, pas une boisson : pour la soif, c'est l'eau.

## Comprendre
**L'allaitement** peut se poursuivre au-delà d'un an, aussi longtemps que vous et votre enfant le souhaitez.

**Le lait de croissance** est un lait infantile destiné aux enfants de 1 à 3 ans. Santé publique France le conseille à cet âge en l'absence d'allaitement, car il est enrichi en fer. Les pédiatres de mpedia précisent qu'il apporte, par rapport au lait de vache, davantage de fer, d'acides gras essentiels, de zinc et de vitamines, avec moins de protéines. La brochure de Santé publique France conseille de le choisir nature, sans sucre ni arôme ajouté, et rappelle que les formules en poudre sont moins chères.

**Le lait de vache entier** est possible à partir de 12 mois. Santé publique France propose par exemple de l'alterner avec le lait de croissance, un bol ou un biberon sur deux. Il doit être entier, car les besoins en matières grasses sont plus élevés avant 3 ans. Si l'enfant ne boit que du lait de vache, la brochure conseille de veiller aux aliments riches en fer (légumes secs, poisson, œufs, viande) et aux aliments riches en vitamine C, comme les agrumes, qui améliorent l'absorption du fer.

**Les autres produits laitiers** (yaourts, petits-suisses, fromages) comptent aussi, mais ils n'ont pas exactement la même composition que le lait : l'équivalence ne vaut que pour le calcium. Le lait cru et les fromages au lait cru ne sont pas recommandés chez le jeune enfant.

## Au quotidien
- **Lisez l'étiquette** : « lait de croissance » ou « lait infantile pour enfants en bas âge », nature, sans arôme ni sucre ajouté. Évitez les laits demi-écrémés ou écrémés.
- **Pour le lait de vache**, choisissez un lait entier UHT et pensez à varier les sources de fer dans les repas.
- **Proposez le lait au bol ou à la tasse** de plus en plus souvent, en particulier au petit-déjeuner et au goûter.
- **Évitez les biberons de lait à répétition** dans la journée ou la nuit : ils peuvent couper l'appétit aux repas et, une fois les dents sorties, favoriser les caries.
- **Les quantités** de lait et de produits laitiers adaptées à votre enfant se discutent avec le médecin ou la PMI : un excès comme un manque peuvent poser question.

## Questions fréquentes
**Mon enfant refuse le lait de croissance, que faire ?**
Vous pouvez essayer de le proposer autrement (dans un bol, tiède ou froid, dans une préparation comme une semoule au lait) et miser sur les autres produits laitiers. Parlez-en au médecin, qui verra avec vous s'il faut adapter.

**Les laits de croissance aromatisés sont-ils intéressants ?**
Santé publique France recommande un lait nature, sans arôme ni sucre ajouté.

**Peut-on donner du lait de chèvre ou de brebis ?**
Les repères officiels consultés concernent le lait de croissance et le lait de vache entier. Pour tout autre lait, demandez l'avis du médecin.

**Il boit beaucoup de lait et mange peu, est-ce lié ?**
C'est possible : les pédiatres rappellent que le lait pris plusieurs fois par jour peut couper l'appétit aux repas. Parlez-en au médecin pour réorganiser la journée.

## Quand demander conseil
Consultez si votre enfant boit surtout du lait et refuse la plupart des aliments, s'il est pâle ou très fatigué, si sa courbe de croissance change, ou si vous envisagez de supprimer les produits laitiers. Tout signe de malaise, de difficulté à respirer ou de réaction allergique grave (gonflement du visage, gêne respiratoire) impose d'appeler le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation-bebe',
    tags: ['lait de croissance', 'lait de vache', 'lait apres 1 an', 'lait entier', 'fer', 'produits laitiers'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13, S.sante1223],
    status: 'to_review',
  },
  {
    slug: 'boissons-vegetales-et-soja-avant-3-ans',
    title: 'Boissons végétales et lait de soja avant 3 ans : ce qu’il faut savoir',
    summary: 'Avoine, amande, riz, soja : ces boissons dites « laits végétaux » ne remplacent pas le lait chez le tout-petit. Pourquoi, et quoi faire en cas d’allergie ou de choix familial.',
    body_md: `Les boissons à base d'avoine, d'amande, de riz ou de soja sont souvent appelées « laits végétaux ». Beaucoup de familles en consomment et se demandent si elles conviennent à leur enfant de 1 à 3 ans. Voici les repères des professionnels.

## En bref
- Les boissons végétales ne sont pas équivalentes au lait et ne couvrent pas les besoins du jeune enfant.
- Santé publique France déconseille le lait de soja et les produits à base de soja avant 3 ans.
- Si l'enfant n'est pas allaité, le lait de croissance reste conseillé jusqu'à 3 ans.
- En cas d'allergie au lait ou de choix d'alimentation sans produits animaux, l'avis du médecin est indispensable.
- Ne donnez pas de compléments alimentaires de votre propre initiative.

## Comprendre
Santé publique France rappelle que les boissons végétales sont appelées « lait » mais qu'elles ne sont pas équivalentes au lait. Elles ne contiennent pas les mêmes quantités de protéines, de matières grasses, de calcium, de fer ou de vitamines que le lait maternel, les laits infantiles ou le lait de vache entier. Les pédiatres de mpedia précisent que les boissons végétales courantes ne sont pas adaptées aux jeunes enfants.

La brochure « Pas à pas » indique aussi que le lait de soja et les produits à base de soja sont déconseillés avant 3 ans, car ils contiennent un composant suspecté d'être un perturbateur endocrinien.

Pour les familles qui suivent une alimentation végétalienne, mpedia précise qu'avant 3 ans, en l'absence d'allaitement, seules certaines préparations infantiles spécifiques, prescrites et suivies par un professionnel, sont considérées comme adaptées. Santé publique France rappelle qu'une alimentation végétalienne n'est pas adaptée aux enfants, au moins jusqu'à 3 ans, en raison des risques de carences en fer, protéines, calcium et vitamines.

## Au quotidien
- **Gardez le bon lait pour l'enfant** : allaitement, lait de croissance ou lait de vache entier selon les conseils du médecin, même si le reste de la famille boit une boisson végétale.
- **Expliquez-le à l'entourage** : grands-parents, crèche ou assistante maternelle doivent savoir que l'enfant boit son propre lait, et non la boisson végétale de la famille.
- **Lisez les étiquettes** : une boisson végétale, même présentée avec un enfant sur l'emballage, n'est pas un lait de croissance. En cas de doute, montrez le produit au médecin ou au pharmacien.
- **Ne remplacez pas le lait par un jus ou une boisson aromatisée** : l'eau reste la seule boisson indispensable.
- **Ne donnez pas de compléments** (calcium, vitamines) sans avis médical : un médecin peut prescrire ce qui est nécessaire.

## Questions fréquentes
**Mon enfant digère mal le lait, puis-je passer à une boisson végétale ?**
Non sans avis médical. Des troubles digestifs ou une suspicion d'allergie au lait de vache doivent être évalués par le médecin, qui proposera une solution adaptée.

**Nous ne mangeons pas de viande : que boira notre enfant ?**
Une alimentation végétarienne qui garde les produits laitiers et les œufs peut convenir à un enfant si elle est variée et suivie. Le lait reste alors un pilier, et le fer demande une attention particulière. Parlez-en au médecin.

**Les desserts au soja sont-ils concernés ?**
Santé publique France déconseille les produits à base de soja avant 3 ans, pas seulement les boissons.

**À partir de quand une boisson végétale devient-elle possible ?**
Les repères consultés concernent les moins de 3 ans. Au-delà, demandez conseil au médecin, qui tiendra compte de l'ensemble de l'alimentation.

## Quand demander conseil
Consultez avant toute modification importante de l'alimentation de votre enfant, en particulier pour supprimer le lait ou les produits animaux, et en cas de fatigue inhabituelle, de pâleur ou de croissance qui ralentit. Une réaction après un aliment avec gonflement du visage, gêne respiratoire ou malaise impose d'appeler immédiatement le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['boisson vegetale', 'lait vegetal', 'lait de soja', 'lait d avoine', 'lait d amande', 'vegan'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.santeVege],
    status: 'to_review',
  },
  {
    slug: 'du-biberon-au-verre-apres-1-an',
    title: 'Du biberon au verre : boire comme un grand après 1 an',
    summary: 'Tasse, verre, gourde, biberon du soir : comment accompagner l’enfant vers le verre, protéger ses dents de lait et gérer le biberon de réconfort.',
    body_md: `Après 1 an, beaucoup d'enfants boivent encore au biberon, notamment le matin et le soir. Le passage au verre se fait progressivement, à son rythme. Voici quelques repères, avec une attention particulière pour les dents.

## En bref
- L'eau peut être proposée à la tasse ou au verre dès 6 mois ; après 1 an, l'enfant apprend à boire de plus en plus seul, avec votre aide.
- Le biberon n'est pas interdit, mais les biberons de lait répétés, surtout la nuit, peuvent favoriser les caries une fois les dents apparues.
- Un biberon de réconfort ne devrait contenir que de l'eau.
- Pas de biberon sucré après le brossage des dents.
- L'eau du robinet convient pour la boisson de l'enfant.

## Comprendre
Santé publique France indique que l'eau est la seule boisson indispensable et qu'on peut la proposer à la tasse ou au verre dès 6 mois. Vers 1 an et au-delà, l'enfant gagne en autonomie : la brochure « Pas à pas » cite la cuillère, la tasse, puis la fourchette, avec l'aide de l'adulte pour boire au verre.

Le biberon pose surtout la question des dents. L'Union française pour la santé bucco-dentaire explique qu'après l'apparition des dents il vaut mieux éviter de multiplier les biberons sucrés, surtout la nuit, car même le lait au biberon peut provoquer des caries, et qu'il ne faut jamais donner de biberon sucré après le brossage. Les pédiatres de mpedia ajoutent que, si le biberon sert de réconfort, il ne doit contenir que de l'eau, pour limiter les caries. Les jus de fruits, sirops et sodas ne sont pas recommandés au biberon.

## Au quotidien
- **Proposez un petit verre ou une tasse à chaque repas**, rempli d'un fond d'eau : il pourra s'entraîner sans tout renverser.
- **Aidez-le au début** en tenant le verre avec lui, puis laissez-le faire de plus en plus seul.
- **Choisissez un verre adapté** : petit, stable, facile à tenir, incassable ; vérifiez qu'il est indiqué pour le contact alimentaire et adapté à l'âge.
- **Passez le lait du matin au bol** quand votre enfant est prêt, en gardant si besoin un biberon le soir dans un premier temps.
- **Séparez biberon et sommeil** : évitez qu'il s'endorme avec un biberon de lait dans la bouche ; s'il a besoin d'un biberon pour se rassurer la nuit, proposez de l'eau.
- **Brossez les dents après le dernier repas** et ne redonnez ensuite que de l'eau.

## Questions fréquentes
**À quel âge faut-il arrêter complètement le biberon ?**
Les sources consultées ne fixent pas d'âge précis. L'important est de développer peu à peu l'usage du verre et de limiter les biberons de lait ou sucrés, surtout la nuit. Parlez-en au médecin ou au chirurgien-dentiste si vous hésitez.

**Les tasses à bec ou les gourdes, c'est bien ?**
Elles sont pratiques en sortie. À la maison, le verre ou la tasse ouverte permettent d'apprendre à boire comme un grand. Quel que soit le contenant, l'eau reste la boisson de choix entre les repas.

**Il refuse l'eau et ne veut que du lait, que faire ?**
Continuez à proposer de l'eau régulièrement, dans un verre qu'il aime, et demandez conseil au médecin si le lait remplace une partie des repas.

**Peut-on partager sa cuillère ou nettoyer la tétine avec sa bouche ?**
L'UFSBD conseille d'éviter ces gestes, car les bactéries responsables des caries se transmettent souvent des parents à l'enfant.

## Quand demander conseil
Montrez rapidement votre enfant à un chirurgien-dentiste ou au médecin si vous voyez des taches blanches, jaunes ou brunes sur ses dents, s'il a mal en mangeant ou si ses gencives sont gonflées. Consultez aussi s'il boit beaucoup moins que d'habitude, mouille moins ses couches ou paraît anormalement fatigué ; en cas de malaise, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation-bebe',
    tags: ['biberon', 'verre', 'tasse', 'caries', 'biberon du soir', 'dents de lait'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.ufsbdCarie, S.sante1223],
    status: 'to_review',
  },
  // ───────────────────────────── Sucre, sel, matières grasses ─────────────────────────────
  {
    slug: 'sucre-et-produits-sucres-avant-3-ans',
    title: 'Sucre, bonbons, gâteaux : quelle place avant 3 ans ?',
    summary: 'Le goût du sucré est inné, mais l’habitude se construit : comment limiter le sucre ajouté chez le tout-petit sans interdits ni drames, y compris lors des fêtes.',
    body_md: `Les tout-petits aiment spontanément le sucré, et les produits sucrés sont partout : desserts lactés, biscuits, céréales du petit-déjeuner, boissons. Voici comment garder le sucre à sa juste place entre 1 et 3 ans, sans en faire un enjeu.

## En bref
- L'attirance pour le sucré est naturelle chez l'enfant ; les habitudes prises tôt comptent.
- Santé publique France conseille de ne pas ajouter de sucre aux fruits, crus ou cuits, et de sucrer les laitages avec des fruits écrasés.
- Bonbons, miel et chocolat sont à proposer avec parcimonie, de préférence au moment d'un repas.
- Jus de fruits, boissons aux fruits et sodas, même « light », ne sont pas recommandés.
- Le dessert n'est ni une récompense ni une punition.

## Comprendre
Les pédiatres de mpedia rappellent que les enfants sont attirés par les aliments gras et sucrés et rejettent spontanément l'acide et l'amer. Ce n'est pas un défaut d'éducation : c'est une préférence de départ. L'éducation au goût, elle, peut faire évoluer les habitudes : mpedia rappelle qu'elle repose d'abord sur le plaisir et sur la découverte répétée d'aliments variés.

Les repères pour cet âge vont dans le même sens : Santé publique France conseille de limiter au maximum viennoiseries, gâteaux, biscuits et chocolat, et de les introduire le plus tard possible ; elle note que les produits du commerce destinés aux moins de 3 ans sont souvent trop gras et trop sucrés, et que le ketchup contient beaucoup de sucre. Les jus de fruits, même sans sucres ajoutés, et les sodas, même allégés, ne sont pas recommandés. mpedia précise que sirops et sodas devraient être réservés aux occasions festives.

Le sucre joue aussi sur les dents : l'Union française pour la santé bucco-dentaire rappelle que les sucreries et les aliments collants favorisent les caries, d'autant plus lorsqu'ils sont consommés entre les repas.

## Au quotidien
- **Achetez nature** : yaourts, fromages blancs et petits-suisses nature, que vous pouvez agrémenter d'une banane écrasée, de fraises ou d'une compote sans sucre ajouté.
- **Préférez le fruit entier** au jus : il apporte des fibres et rassasie.
- **Gardez les produits sucrés pour certains moments** : un morceau de gâteau d'anniversaire, une crêpe le dimanche, de préférence au dessert ou au goûter plutôt qu'entre les repas.
- **Cuisinez moins sucré** : dans les gâteaux maison, réduire le sucre de la recette passe souvent inaperçu.
- **Ne promettez pas de dessert en échange d'une assiette finie** : cela rend le sucré encore plus désirable et les légumes moins attirants.
- **Parlez-en à l'entourage** : grands-parents et amis offrent volontiers des bonbons. Proposez-leur d'autres façons de faire plaisir (un livre, une sortie, un jeu).

## Questions fréquentes
**Faut-il interdire totalement le sucre ?**
Non. Il s'agit de limiter le sucre ajouté au quotidien et de garder les produits sucrés pour des occasions, sans en faire un tabou, ce qui peut les rendre encore plus attirants.

**Et les fêtes, les anniversaires ?**
Ce sont des moments de partage : votre enfant peut y goûter. Veillez surtout à ce qu'il mange assis, sous surveillance, et évitez les bonbons durs, ronds ou collants, qui exposent aux fausses routes.

**Le miel est-il plus « sain » que le sucre ?**
mpedia le cite parmi les produits à proposer avec parcimonie, comme les bonbons et le chocolat. Rappelez-vous aussi qu'il ne doit pas être donné avant 1 an.

**Les céréales du petit-déjeuner pour enfants ?**
Beaucoup sont sucrées. Du pain, éventuellement complet, avec un peu de beurre, est une alternative simple. Le Nutri-Score peut aider à comparer les produits d'une même catégorie.

## Quand demander conseil
Parlez-en au médecin si votre enfant refuse tout aliment non sucré, s'il réclame sans cesse des sucreries, ou si sa courbe de corpulence augmente rapidement. Consultez un chirurgien-dentiste si vous voyez des taches ou des trous sur ses dents. En cas d'étouffement avec un bonbon ou un aliment, appelez immédiatement le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['sucre', 'bonbons', 'gateaux', 'chocolat', 'dessert', 'miel', 'anniversaire'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13, S.ufsbdCarie],
    status: 'to_review',
  },
  {
    slug: 'sel-et-plats-sales-tout-petit',
    title: 'Le sel chez le tout-petit : cuisiner sans saler jusqu’à 3 ans',
    summary: 'Pourquoi ne pas saler les plats d’un enfant de moins de 3 ans, où se cache le sel (charcuterie, plats industriels, biscuits apéritif) et comment donner du goût autrement.',
    body_md: `Quand l'enfant commence à manger le plat familial, la question du sel se pose à chaque repas : faut-il saler sa part ? Les repères sont clairs jusqu'à 3 ans, et il existe de nombreuses façons de donner du goût sans sel.

## En bref
- Jusqu'à 3 ans, Santé publique France conseille de ne pas saler les préparations faites maison ni les petits pots.
- Les légumes se cuisent sans sel, et on n'en ajoute pas ensuite.
- Beaucoup de sel vient de produits déjà salés : charcuterie, plats préparés, biscuits apéritif, fromages, pain.
- La charcuterie est à éviter avant 5 ans, notamment à cause du sel.
- Herbes, épices douces, oignon, ail, citron ou huiles parfumées apportent du goût.

## Comprendre
La brochure « Pas à pas » de Santé publique France recommande, jusqu'à 3 ans, de ne pas saler le fait maison ni les petits pots, et de cuire les légumes à l'eau ou à la vapeur sans sel. mpedia précise qu'on peut éventuellement ajouter une toute petite quantité de sel pour un légume très fade, sans en faire une habitude.

Le sel se cache aussi dans des aliments du quotidien. La charcuterie est déconseillée avant 5 ans par les pédiatres de mpedia, notamment pour sa teneur en sel et parce qu'il s'agit souvent de viande salée non cuite ; le jambon cuit découenné est l'option la moins problématique, sans en faire une habitude. Les produits ultra-transformés (chips, nuggets, pizzas industrielles), souvent salés et gras, sont à limiter.

## Au quotidien
- **Prélevez la part de l'enfant avant de saler** le plat familial, puis salez pour les adultes.
- **Ne mettez pas de salière sur la table** pendant ses repas : il imitera vos gestes.
- **Donnez du goût autrement** : herbes fraîches ou séchées (persil, ciboulette, basilic, thym), épices douces (cumin, curry doux, paprika doux, cannelle), oignon et ail cuits, un filet de citron, une huile de noix ou d'olive.
- **Faites revenir ou rôtir** certains légumes au four avec un peu d'huile : la cuisson développe leurs saveurs.
- **Limitez les produits déjà salés** : charcuterie, cubes de bouillon, sauces industrielles, biscuits apéritif, plats préparés.
- **Lisez les étiquettes** des plats préparés et comparez-les ; le Nutri-Score peut aider à choisir au sein d'une même catégorie.

## Questions fréquentes
**Un plat sans sel, il ne va pas l'aimer ?**
Les herbes, les épices douces et les associations de saveurs permettent de rendre un plat appétissant sans sel. Comme pour tout aliment nouveau, proposez-le plusieurs fois, sans insister, et mangez-le avec lui.

**Le fromage et le pain contiennent du sel, faut-il les éviter ?**
Non, ils font partie d'une alimentation variée. C'est le sel ajouté et les produits très salés qui sont à limiter.

**Et le jambon ?**
mpedia indique que le jambon cuit découenné est l'option la moins problématique parmi les charcuteries, sans en faire une habitude. Les autres charcuteries sont à éviter avant 5 ans.

**Les petits pots du commerce sont-ils salés ?**
Les repères de Santé publique France demandent de ne pas les saler davantage. Lisez la liste des ingrédients pour connaître leur composition.

## Quand demander conseil
Parlez-en au médecin si votre enfant réclame systématiquement des aliments très salés, ou s'il refuse tout aliment non salé au point que ses repas se restreignent fortement. Si votre enfant avale un produit non alimentaire (cube de lave-vaisselle, produit ménager), appelez le 15 ou le 112, ou un centre antipoison.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['sel', 'saler', 'charcuterie', 'jambon', 'epices', 'plats prepares'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante1223, S.mpedia1224],
    status: 'to_review',
  },
  {
    slug: 'matieres-grasses-tout-petit',
    title: 'Huile, beurre, crème : les matières grasses du tout-petit',
    summary: 'Avant 3 ans, l’enfant a des besoins importants en graisses de bonne qualité : quelles huiles ajouter, la place du beurre, pourquoi éviter les produits allégés et les fritures.',
    body_md: `Beaucoup de parents ont le réflexe de « faire léger » pour leur enfant. Or, avant 3 ans, les besoins en matières grasses sont importants. Voici comment bien les choisir et les utiliser.

## En bref
- Les enfants de moins de 3 ans ont des besoins importants en lipides.
- Ajoutez de l'huile végétale crue dans les légumes : colza, noix, olive notamment.
- Le beurre ou la crème fraîche peuvent remplacer l'huile de temps en temps, plutôt crus.
- Les produits allégés, écrémés ou demi-écrémés ne conviennent pas au tout-petit ; le lait de vache doit être entier.
- Les fritures et les plats industriels gras sont à éviter.

## Comprendre
Santé publique France rappelle que les enfants de moins de 3 ans ont des besoins importants en lipides et conseille d'ajouter de l'huile crue (colza, noix, olive) ou, de temps en temps, un peu de beurre. Les pédiatres de mpedia indiquent que les jeunes enfants ont souvent des apports insuffisants en graisses et recommandent d'ajouter des huiles végétales crues dans les légumes, en privilégiant le colza, la noix et le soja, l'huile d'olive pouvant être utilisée aussi. Ils rappellent que chauffer ces matières grasses altère leurs propriétés : on les ajoute plutôt en fin de préparation.

Ces graisses apportent notamment des acides gras essentiels, utiles au développement. Le poisson gras, proposé une fois par semaine, en est aussi une source.

À l'inverse, les fritures sont à éviter selon mpedia, et les produits ultra-transformés, souvent gras, sucrés ou salés, à limiter. Les produits laitiers allégés, écrémés ou demi-écrémés ne sont pas adaptés aux plus jeunes, et le lait de vache, s'il est donné, doit être entier.

## Au quotidien
- **Ajoutez un filet d'huile crue** dans la purée, les légumes ou les pâtes de votre enfant, au moment de servir. Les quantités adaptées peuvent être précisées par le médecin ou la PMI.
- **Alternez les huiles** : colza et noix pour leurs acides gras, olive pour le goût ; gardez une bouteille de chaque, bien fermée, à l'abri de la lumière.
- **Une noisette de beurre** ou un peu de crème fraîche crue de temps en temps, par exemple dans une purée.
- **Préférez les cuissons douces** : vapeur, eau, four, plutôt que la friture.
- **Choisissez des laitages entiers** et nature : yaourts au lait entier, fromage blanc, petits-suisses.
- **Limitez les biscuits, viennoiseries et plats préparés**, qui apportent surtout des graisses de moindre qualité.

## Questions fréquentes
**Mon enfant est un peu rond, faut-il réduire les matières grasses ?**
Pas sans avis médical. Les besoins en graisses restent importants avant 3 ans. Si sa courbe de corpulence vous inquiète, le médecin regardera l'ensemble de l'alimentation, le grignotage, les boissons sucrées et l'activité physique.

**Puis-je cuire avec l'huile de colza ou de noix ?**
mpedia conseille de les utiliser crues, car la chaleur altère leurs propriétés. Ajoutez-les plutôt dans l'assiette, une fois le plat cuit et un peu refroidi.

**Les frites, jamais ?**
Les fritures sont à éviter au quotidien. Des pommes de terre rôties au four avec un peu d'huile sont une alternative appréciée.

**Et les fruits à coque (noix, amandes, noisettes) ?**
Ils apportent aussi de bonnes graisses, mais Santé publique France recommande de ne les proposer chez le jeune enfant qu'en poudre ou finement écrasés, jamais entiers, à cause du risque de fausse route.

## Quand demander conseil
Consultez si votre enfant a des selles très grasses ou décolorées, des diarrhées qui durent, ou une croissance qui ralentit : ces signes méritent un avis médical. En cas de suspicion d'allergie (boutons, gonflement, gêne respiratoire après un aliment), appelez le 15 ou le 112 si la respiration est gênée.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['matieres grasses', 'huile', 'beurre', 'huile de colza', 'omega 3', 'produits alleges'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13, S.sante1223],
    status: 'to_review',
  },
  // ───────────────────────────── Textures, autonomie, faim ─────────────────────────────
  {
    slug: 'morceaux-et-mastication-apres-1-an',
    title: 'Morceaux et mastication après 1 an : avancer à son rythme',
    summary: 'Votre enfant de plus d’un an refuse les morceaux ou les recrache ? Comment faire évoluer les textures, rassurer et repérer quand en parler à un professionnel.',
    body_md: `Après 1 an, la plupart des enfants passent progressivement des purées aux morceaux. Certains les adorent, d'autres les trient, les recrachent ou font des haut-le-cœur. Voici comment accompagner cette étape importante.

## En bref
- Les textures évoluent progressivement : grumeleux, puis morceaux fondants, puis aliments à croquer, bien cuits et de taille adaptée.
- Santé publique France recommande d'introduire une nouvelle texture à la fois, pour que l'enfant apprenne à mâcher.
- Les morceaux mous à prendre avec les doigts (légumes fondants, fruits mûrs, dés de fromage, pain) facilitent l'apprentissage.
- Un enfant qui refuse les morceaux à la maison et les accepte à la crèche, cela arrive souvent : on continue à proposer.
- Toujours assis, toujours sous le regard d'un adulte.

## Comprendre
La mastication s'apprend. Les pédiatres de mpedia rappellent que les textures grumeleuses et les morceaux doivent être introduits progressivement, sans trop tarder, et que la texture s'adapte à la maturité de chaque enfant. Entre 12 et 23 mois, l'alimentation passe par des aliments grumeleux puis des morceaux fondants ou à croquer, bien cuits et de taille adaptée ; l'enfant peut alors manger seul avec ses doigts.

La brochure de Santé publique France décrit les signes qui montrent qu'un enfant est prêt pour des textures plus épaisses : il avale bien les purées lisses, tient sa tête et son dos droits, essaie de prendre des aliments dans votre assiette, fait des mouvements de mâchonnement et tente de se nourrir seul. Elle indique aussi qu'un quignon de pain de temps en temps stimule la mastication.

Le refus des morceaux peut avoir plusieurs raisons, comme la surprise devant une texture inconnue ou la préférence pour ce qui est connu. mpedia note qu'il est fréquent qu'un enfant refuse les morceaux à la maison et les accepte en collectivité, où il voit d'autres enfants manger.

## Au quotidien
- **Une seule nouveauté de texture à la fois** : par exemple, gardez une purée lisse qu'il aime et ajoutez à côté quelques petits morceaux très tendres.
- **Commencez par des aliments qui s'écrasent entre la langue et le palais** : banane, poire très mûre, carotte bien cuite, pâtes bien cuites, omelette, poisson émietté.
- **Laissez-le toucher et porter à la bouche avec ses doigts** : il contrôle mieux ce qu'il met en bouche.
- **Mangez la même chose en même temps** : il observe vos mouvements de mastication.
- **Écrasez à la fourchette plutôt que de mixer** finement : la texture évolue en douceur.
- **Évitez les aliments à risque** : petits, durs et ronds (cacahuètes, noix entières, bonbons durs) ; coupez en deux ou en quatre les aliments ronds et mous (raisins épépinés, tomates cerises).

## Questions fréquentes
**Il a des haut-le-cœur avec les morceaux, c'est une fausse route ?**
Un haut-le-cœur est un réflexe qui fait revenir l'aliment vers l'avant de la bouche ; l'enfant reste rouge, tousse ou recrache. Une fausse route grave se manifeste par une impossibilité de tousser, de pleurer ou de respirer, parfois des lèvres bleues : c'est une urgence, appelez le 15 ou le 112.

**Il n'a pas encore beaucoup de dents, peut-il mâcher ?**
Des aliments très tendres peuvent être écrasés par les gencives. Adaptez simplement la texture et la taille des morceaux.

**Il ne veut que des purées lisses à 18 mois, que faire ?**
Continuez à proposer des morceaux tendres, sans forcer et sans dramatiser, à côté d'aliments qu'il accepte. Si le refus est total et durable, parlez-en au médecin.

**Les petits pots « avec morceaux » aident-ils ?**
Santé publique France conseille de varier marques et recettes, car la consistance et la taille des morceaux changent d'un produit à l'autre. Le fait maison permet aussi d'ajuster précisément la texture.

## Quand demander conseil
Consultez le médecin ou la PMI si votre enfant refuse toute texture autre que lisse au-delà de quelques mois d'essais, s'il s'étouffe ou tousse souvent en mangeant, vomit régulièrement aux repas, ou si sa croissance ralentit. Un enfant qui ne peut plus respirer, tousser ou parler après avoir avalé un aliment : appelez immédiatement le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation-bebe',
    tags: ['morceaux', 'textures', 'mastication', 'haut-le-coeur', 'refus des morceaux', 'puree'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante1223, S.ameliInhale],
    status: 'to_review',
  },
  {
    slug: 'manger-seul-autonomie-a-table',
    title: '« Moi tout seul ! » : accompagner l’autonomie à table',
    summary: 'Doigts, cuillère, fourchette, verre : comment laisser le tout-petit apprendre à manger seul, accepter un peu de désordre et garder la sécurité du repas.',
    body_md: `Vers 1 an, votre enfant veut attraper la cuillère, plonger les mains dans son assiette et boire seul. C'est salissant, plus long, parfois frustrant… et c'est une étape précieuse de son développement. Voici comment l'accompagner.

## En bref
- Manger seul s'apprend progressivement : doigts, cuillère, tasse, puis fourchette.
- Les morceaux tendres à prendre avec les doigts favorisent l'autonomie et l'éveil.
- Votre enfant doit être bien assis et sous le regard d'un adulte pendant tout le repas.
- Accepter un peu de désordre fait partie de l'apprentissage.
- Vous pouvez l'aider tout en le laissant faire : deux cuillères, une pour lui, une pour vous.

## Comprendre
Santé publique France décrit l'autonomie à table comme une progression : la cuillère, la tasse, puis la fourchette, avec la possibilité de prendre des morceaux tendres avec les doigts et l'aide de l'adulte pour boire au verre. Les pédiatres de mpedia ajoutent qu'entre 12 et 23 mois les enfants peuvent manger seuls avec leurs doigts des légumes fondants, des fruits mûrs, des dés de fromage ou des morceaux de pain.

Toucher les aliments, les écraser, les sentir fait partie de la découverte : c'est ainsi que l'enfant apprivoise les textures, les couleurs et les goûts. La brochure « Pas à pas » encourage d'ailleurs à le laisser toucher et sentir les produits, y compris lors des courses.

Cette envie de « faire seul » s'accompagne aussi d'une affirmation de soi. Laisser l'enfant décider de certaines choses (prendre tel morceau, manger avec les doigts ou la cuillère) l'aide à vivre le repas comme un moment agréable plutôt qu'un rapport de force.

## Au quotidien
- **Installez-le bien** : assis droit, stable, à hauteur de table, attaché s'il est dans une chaise haute. Santé.fr rappelle de rester près de lui et d'éloigner la chaise de la table pour éviter qu'il ne se pousse en arrière avec les pieds.
- **Proposez des aliments faciles à attraper** : bâtonnets de légumes bien cuits, pâtes de grande taille, morceaux de fruits mûrs, dés d'omelette, petits morceaux de pain.
- **Choisissez des couverts adaptés** : une petite cuillère à bord arrondi, une assiette stable, un verre petit et solide, conçus pour le contact alimentaire et adaptés à son âge.
- **Utilisez deux cuillères** : la sienne pour s'entraîner, la vôtre pour l'aider s'il le souhaite.
- **Protégez plutôt que de gronder** : bavoir à manches, toile cirée sous la chaise, petites quantités dans l'assiette.
- **Restez présent et attentif** : ne le laissez jamais manger seul dans une pièce, même quelques instants.
- **Laissez-lui le temps**, sans faire durer le repas indéfiniment.

## Questions fréquentes
**Il joue avec la nourriture, dois-je l'arrêter ?**
Explorer fait partie de l'apprentissage. Quand il ne mange plus du tout et ne fait plus que jouer ou jeter, c'est souvent qu'il n'a plus faim : vous pouvez calmement terminer le repas.

**Il veut manger seul mais avale très peu, puis-je le nourrir ?**
Vous pouvez proposer votre aide à la cuillère, en lui laissant la sienne. S'il refuse, respectez-le : un repas peu mangé ne se compense pas avant le suivant.

**À quel âge saura-t-il utiliser une fourchette ?**
Chaque enfant avance à son rythme. La fourchette vient généralement après la cuillère et la tasse. Montrez-lui, laissez-le essayer, sans pression.

**Il ne veut plus rester sur sa chaise haute, que faire ?**
Il peut s'installer sur une chaise adaptée à la table familiale avec un rehausseur stable et sûr. Ce qui compte : qu'il mange assis, jamais en marchant ou en courant, à cause du risque de fausse route.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant ne montre aucun intérêt pour porter des aliments à sa bouche, s'il a de grandes difficultés à saisir des objets, ou s'il s'étouffe souvent en mangeant. Après une chute de la chaise haute avec choc à la tête, somnolence ou vomissements, consultez en urgence ; appelez le 15 ou le 112 en cas de perte de connaissance.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation',
    tags: ['manger seul', 'autonomie', 'cuillere', 'fourchette', 'chaise haute', 'manger avec les doigts'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante1223, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'faim-et-satiete-du-tout-petit',
    title: 'Faim et satiété : faire confiance à l’appétit de son enfant',
    summary: 'Comment reconnaître les signes de faim et de rassasiement d’un enfant de 1 à 3 ans, pourquoi ne pas le forcer à finir son assiette et comment servir des portions adaptées.',
    body_md: `« Encore une cuillère ! » Beaucoup de parents ont peur que leur enfant ne mange pas assez. Pourtant, le tout-petit sait le plus souvent ajuster ce qu'il mange à ses besoins. Apprendre à lire ses signaux aide à vivre les repas plus sereinement.

## En bref
- L'enfant sait en général manger à sa faim : un repas copieux est souvent suivi d'un repas plus léger.
- Il montre qu'il a faim en ouvrant la bouche ou en s'agitant ; qu'il est rassasié en ralentissant, en tournant la tête ou en voulant quitter sa chaise.
- On propose sans jamais forcer, ni à finir l'assiette ni le biberon.
- Servez de petites quantités et resservez s'il le demande.
- La courbe de croissance du carnet de santé est le meilleur repère.

## Comprendre
Les pédiatres de mpedia le rappellent : les enfants savent manger à leur faim, et il faut leur faire confiance. Un repas peu consommé ne doit pas être compensé avant le suivant. Ils conseillent aussi de ne pas forcer un enfant qui mange peu, et de ne pas le féliciter ni le récompenser quand il mange beaucoup : l'objectif est qu'il mange parce qu'il a faim, pas pour faire plaisir.

Santé publique France décrit les signes à observer : l'enfant affirme sa faim en ouvrant la bouche ou en s'agitant ; il signale qu'il est rassasié en ralentissant, en tournant la tête ou en voulant quitter sa chaise. La brochure rappelle que l'appétit varie d'un jour à l'autre et que les écrans pendant le repas rendent l'enfant moins attentif à sa satiété.

mpedia insiste sur l'apprentissage de l'autorégulation : laisser l'enfant ajuster ses quantités, sans insister, l'aide à écouter sa faim et sa satiété. À l'inverse, forcer, remplacer un plat refusé par un autre ou laisser grignoter peut créer des déséquilibres et des habitudes de sélectivité.

## Au quotidien
- **Servez peu** : une petite portion dans une petite assiette ; il pourra en redemander.
- **Observez ses signaux** : bouche fermée, tête qui se détourne, jeux avec la nourriture, envie de descendre. Vous pouvez alors simplement proposer : « Tu as fini ? »
- **Évitez les phrases qui poussent à manger** : « encore une bouchée pour papa », « finis ton assiette ». Préférez : « Tu as encore faim ? »
- **Ne compensez pas** un repas peu mangé par un dessert supplémentaire, un biscuit ou un biberon de lait.
- **Éteignez les écrans** : sans distraction, il perçoit mieux quand il n'a plus faim.
- **Gardez le cadre des repas** : heures régulières, pas de grignotage, pour que la faim revienne naturellement.
- **Surveillez la courbe** lors des consultations, plutôt que chaque assiette.

## Questions fréquentes
**Il redemande souvent, dois-je limiter ?**
S'il dépasse systématiquement les quantités proposées, mpedia conseille de surveiller l'évolution de sa courbe de corpulence. Proposez d'abord des légumes et des féculents, et parlez-en au médecin si la courbe monte rapidement.

**Il mange énormément un jour et presque rien le lendemain, est-ce inquiétant ?**
Ces variations sont fréquentes à cet âge. C'est l'équilibre sur plusieurs jours et la croissance qui comptent.

**Faut-il le féliciter quand il mange bien ?**
mpedia conseille de ne pas récompenser un enfant parce qu'il a beaucoup mangé. Vous pouvez en revanche valoriser le moment partagé : « C'était un bon repas ensemble. »

**Et s'il ne mange rien du tout au repas ?**
Terminez le repas calmement et attendez le suivant. Si cela se répète, ou si votre enfant semble fatigué ou malade, consultez.

## Quand demander conseil
Consultez si votre enfant perd du poids, change de couloir sur sa courbe, semble fatigué, triste ou moins dynamique, ou si la perte d'appétit dure. Parlez-en aussi si les repas sont devenus un conflit quotidien. Si vous vous sentez dépassé, le 3114 répond jour et nuit ; en cas de malaise de l'enfant, appelez le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['appetit', 'faim', 'satiete', 'finir son assiette', 'portions', 'forcer a manger'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13, S.santeSelectivite],
    status: 'to_review',
  },
  // ───────────────────────────── Refus, néophobie, petits mangeurs ─────────────────────────────
  {
    slug: 'neophobie-alimentaire-comprendre',
    title: 'Néophobie alimentaire : pourquoi votre enfant se méfie des aliments nouveaux',
    summary: 'Entre 18 mois et 6 ans, la peur des aliments nouveaux touche beaucoup d’enfants : d’où elle vient, combien de temps elle dure et comment éviter qu’elle ne devienne une sélectivité.',
    body_md: `Votre enfant mangeait de tout et, soudain, il refuse ce qu'il ne connaît pas, examine son assiette, repousse les plats « bizarres ». Ce comportement porte un nom : la néophobie alimentaire. Comprendre son origine aide à l'accompagner sans tension.

## En bref
- La néophobie est la réticence à goûter des aliments nouveaux ; elle apparaît souvent entre 18 mois et 2–3 ans et peut durer jusqu'à 6 ans environ.
- Elle est très répandue : les pédiatres la considèrent comme une étape du développement.
- La présentation répétée d'un aliment, sous différentes formes, est la stratégie la plus efficace.
- Ni forcer, ni céder systématiquement : une fermeté bienveillante aide.
- Si la liste des aliments acceptés se réduit fortement, il faut en parler au médecin.

## Comprendre
La néophobie, expliquent les pédiatres de mpedia, est une réticence à goûter des aliments nouveaux. Chez les omnivores, elle a un rôle protecteur : se méfier de ce qu'on ne connaît pas évite d'avaler des produits toxiques. Elle survient en moyenne entre 18 mois et 6 ans. Santé publique France note que, vers 2 ans, beaucoup d'enfants deviennent plus « difficiles », et rejettent parfois des aliments qu'ils appréciaient, surtout les légumes.

Les enfants sont naturellement attirés par le sucré et le gras et rejettent spontanément l'acide et l'amer. Vers 2 ou 3 ans, ils associent aussi l'aspect d'un aliment à sa capacité à rassasier : les aliments peu denses, comme les fruits et les légumes, sont les premiers refusés.

L'éducation peut orienter cette étape. Selon mpedia, une attitude très permissive (faire les courses selon les goûts de l'enfant, utiliser la nourriture comme récompense) est associée à une sélectivité plus marquée. À l'inverse, forcer transforme le repas en lutte. L'équilibre consiste à proposer, montrer l'exemple et garder le plaisir.

## Au quotidien
- **Reproposez sans relâche, mais sans pression** : mpedia indique qu'il faut en moyenne 7 à 8 présentations d'un aliment, et Santé publique France évoque jusqu'à 10 fois, à quelques jours d'intervalle.
- **Changez la forme** : en gratin, en soupe, en purée, en bâtonnets. mpedia cite l'exemple d'une crèche où bien plus d'enfants choisissaient le chou-fleur en gratin qu'en salade.
- **Associez le nouveau au connu** : une petite quantité de l'aliment nouveau à côté d'un plat qu'il aime.
- **Mangez-le devant lui, avec plaisir** : l'exemple de l'adulte est un moteur puissant.
- **Impliquez-le** : choisir un légume au marché, le laver, mélanger la préparation.
- **Ne remplacez pas systématiquement** le plat refusé par un autre ; prévoyez plutôt dans le repas un aliment qu'il accepte.
- **Gardez une ambiance détendue**, sans écran, sans commentaire sur ce qu'il mange ou non.

## Questions fréquentes
**Dois-je l'obliger à goûter ?**
Mieux vaut encourager que contraindre. Vous pouvez l'inviter à regarder, sentir, toucher, puis goûter s'il en a envie. L'obligation risque de renforcer le refus.

**Il refuse à la maison mais mange tout à la crèche, pourquoi ?**
Voir d'autres enfants manger et l'absence d'enjeu affectif aident souvent. C'est plutôt encourageant : continuez à proposer à la maison.

**La néophobie peut-elle durer ?**
Elle est fréquente jusqu'à 6 ans environ. Selon mpedia, un refus qui persiste au-delà est plus souvent lié à la façon dont les repas se déroulent, et peut être travaillé avec l'aide du médecin.

**Comment faire la différence avec un vrai dégoût ?**
Santé publique France invite à distinguer le refus d'un aliment nouveau d'un véritable dégoût. Dans les deux cas, ne forcez pas : laissez passer quelques jours avant de le reproposer, sous une autre forme.

## Quand demander conseil
Consultez le médecin si votre enfant n'accepte plus qu'un nombre très réduit d'aliments, si des familles entières (tous les fruits et légumes, toutes les viandes) disparaissent, s'il semble avoir peur de s'étouffer, si sa croissance ralentit ou si les repas sont devenus une source d'angoisse. Le médecin peut orienter vers un spécialiste. Si vous êtes à bout, le 3114 répond jour et nuit.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['neophobie', 'refus alimentaire', 'enfant difficile', 'gouter', 'nouveaux aliments', 'selectivite'],
    min_age_months: 18,
    max_age_months: 36,
    sources: [S.santeSelectivite, S.santeAppetit, S.spfPasAPas],
    status: 'to_review',
  },
  {
    slug: 'faire-gouter-les-legumes-tout-petit',
    title: 'Faire découvrir et aimer les légumes au tout-petit',
    summary: 'Les légumes sont souvent les premiers refusés vers 2 ans : des idées concrètes de recettes, de jeux et d’attitudes pour les rendre familiers, sans forcer.',
    body_md: `Brocolis repoussés, haricots verts triés, soupe boudée : les légumes sont souvent les grands perdants du « non » des tout-petits. Il existe pourtant de nombreuses façons de les rendre familiers et appétissants.

## En bref
- Les légumes sont souvent les premiers aliments refusés vers 2–3 ans, en particulier ceux au goût marqué comme les choux.
- La répétition, la variété des recettes et l'exemple des adultes sont les leviers les plus efficaces.
- Faire participer l'enfant aux courses, à la cuisine ou à un petit potager éveille sa curiosité.
- Les surgelés nature sont une bonne solution pour varier facilement.
- On propose des légumes à chaque repas, sans obliger à les finir.

## Comprendre
Les pédiatres de mpedia expliquent que les enfants apprécient spontanément peu les légumes, notamment les poivrons, les épinards et les choux, et préfèrent les aliments doux et denses. Vers 2 ou 3 ans, ils associent l'aspect d'un aliment à sa capacité à rassasier : les légumes, peu denses, sont ainsi souvent les premiers rejetés.

Ce refus n'est pas une fatalité. Selon mpedia, présenter un aliment sous différentes formes augmente les chances qu'il soit mangé, et montrer l'exemple encourage l'enfant à le goûter à nouveau. Santé publique France conseille de mettre plus de légumes au menu de toute la famille, de varier les recettes d'un même légume (en salade, en tarte, en pot-au-feu) et d'associer l'enfant à la découverte : faire les courses ensemble, nommer les produits, les toucher, les sentir, faire pousser un pot de basilic ou de tomates sur un balcon.

Côté organisation, Santé publique France et mpedia rappellent que les légumes surgelés nature sont une bonne alternative : surgelés peu après la récolte, ils conservent bien leurs qualités et sont prêts à cuire.

## Au quotidien
Idées de recettes à tester :
- **Purée mélangée** : carotte et pomme de terre, courge et patate douce, petits pois et pomme de terre.
- **Gratin doux** : chou-fleur ou brocoli avec un peu de fromage râpé, sans sel ajouté.
- **Soupe veloutée** : poireau, potiron, courgette, avec une noisette de beurre ou un filet d'huile.
- **Légumes rôtis au four** en bâtonnets, avec un peu d'huile et des herbes.
- **Légumes cachés et visibles** : vous pouvez en mixer dans une sauce tomate maison, mais gardez aussi des légumes reconnaissables dans l'assiette, pour qu'il apprenne à les connaître.

Attitudes qui aident :
- **Une petite quantité de légume à chaque repas**, sans obligation de finir.
- **Le même légume, plusieurs préparations** au fil des semaines.
- **Des couleurs et des formes variées** : bâtonnets, rondelles, petits dés.
- **Des livres et des jeux** autour des fruits et légumes, une sortie au marché.
- **Votre propre assiette** : mangez des légumes avec plaisir, en en parlant positivement.

## Questions fréquentes
**Faut-il cacher les légumes dans les plats ?**
Cela peut aider à varier, mais l'enfant a aussi besoin de les voir et de les reconnaître pour s'y habituer. Combinez les deux.

**Il mange seulement des carottes, est-ce suffisant ?**
C'est un point de départ. Continuez à proposer d'autres légumes à côté de ceux qu'il accepte, en douceur.

**Les fruits peuvent-ils remplacer les légumes ?**
Les repères pour cet âge prévoient des fruits et des légumes : ils ne se remplacent pas complètement, mais un enfant qui mange bien les fruits a déjà de bonnes habitudes.

**Les petits pots de légumes du commerce sont-ils intéressants ?**
Ils sont pratiques et peuvent dépanner. Le fait maison permet plus de goûts et de textures ; variez les recettes dans tous les cas.

## Quand demander conseil
Parlez-en au médecin si votre enfant refuse tous les fruits et légumes pendant une longue période, s'il souffre de constipation persistante, ou si la liste des aliments qu'il accepte se réduit fortement. En cas de réaction après un aliment avec gêne respiratoire ou gonflement du visage, appelez le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['legumes', 'refuse les legumes', 'recettes enfant', 'brocoli', 'soupe', 'potager'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.santeSelectivite, S.spfPasAPas, S.sante13],
    status: 'to_review',
  },
  {
    slug: 'petit-mangeur-1-3-ans',
    title: 'Mon enfant mange peu : petit appétit ou vraie difficulté ?',
    summary: 'Certains enfants mangent naturellement peu. Les questions à se poser (courbe, répartition, lait, grignotage) et les signes qui doivent amener à consulter.',
    body_md: `Votre enfant picore, laisse la moitié de son assiette et vous avez l'impression qu'il ne mange « rien ». Beaucoup de tout-petits ont un petit appétit tout en grandissant bien. D'autres situations demandent un avis médical. Voici comment y voir plus clair.

## En bref
- Un enfant qui a de l'énergie et suit sa courbe de croissance mange, le plus souvent, ce dont il a besoin.
- Certains enfants sont naturellement minces, notamment ceux nés avec un petit poids.
- Souvent, le problème vient de la répartition : lait plusieurs fois par jour, boissons sucrées ou grignotage coupent l'appétit.
- Forcer un enfant à manger aggrave généralement la situation.
- Une perte d'appétit qui dure, une fatigue inhabituelle ou une courbe qui fléchit doivent faire consulter.

## Comprendre
Les pédiatres de mpedia distinguent deux situations : l'inquiétude de parents dont l'enfant mange en réalité suffisamment pour sa taille, et une véritable perte d'appétit liée à une maladie, qui demande une consultation. Le repère principal est la courbe poids-taille du carnet de santé : si elle reste régulière, l'enfant mange assez.

mpedia propose quelques questions à se poser. Le manque d'appétit est-il réel ? Un enfant qui fait quatre repas variés, sans difficulté, avec une bonne forme et une courbe harmonieuse, a probablement ce qu'il lui faut. La répartition est-elle en cause ? Certains enfants mangent beaucoup au petit-déjeuner et au goûter et peu aux autres repas ; le grignotage et les boissons (lait, jus, sodas) apportent des calories qui coupent la faim. Une maladie passagère peut-elle l'expliquer ? Un rhume, une otite ou une gastro-entérite réduisent l'appétit quelques jours.

Le forçage, le remplacement des plats refusés et le grignotage peuvent, selon mpedia, créer des déséquilibres et des habitudes de sélectivité. Les pédiatres sont clairs : forcer un enfant à manger n'apporte que des problèmes.

## Au quotidien
- **Regardez la courbe** avec le médecin plutôt que les assiettes.
- **Faites le point sur une journée type** : nombre de prises de lait, boissons autres que l'eau, petits en-cas, heure des repas.
- **Resserrez le cadre** : trois repas et un goûter, de l'eau entre les deux, pas d'aliments en libre accès.
- **Servez de petites portions** dans une petite assiette, pour ne pas le décourager.
- **Proposez des aliments variés et nourrissants** : féculents, légumes avec un filet d'huile, produits laitiers, un peu de viande, de poisson ou d'œuf.
- **Gardez le plaisir** : repas en famille, ambiance détendue, pas de chantage ni de récompense.

## Questions fréquentes
**Faut-il lui donner des compléments alimentaires pour l'appétit ?**
Santé publique France déconseille de donner des compléments de votre propre initiative. Si un besoin existe, le médecin peut prescrire ce qui convient.

**Il mangeait bien bébé et mange moins depuis ses 18 mois, pourquoi ?**
mpedia rappelle que l'appétit varie selon les phases de croissance. La néophobie, fréquente à cet âge, joue aussi. La courbe dira si tout se passe bien.

**Est-ce que je dois lui préparer ce qu'il aime pour qu'il mange au moins quelque chose ?**
Prévoir dans le repas un aliment qu'il accepte est utile. En revanche, préparer systématiquement un autre plat à la demande risque d'entretenir la sélectivité.

**Il était prématuré, est-ce différent ?**
Les enfants nés avec un poids insuffisant peuvent rester minces les premières années ; s'ils suivent leur courbe, ce n'est pas inquiétant selon mpedia. Le suivi médical reste essentiel.

## Quand demander conseil
mpedia cite plusieurs signes qui imposent une consultation : une perte d'appétit brutale ou progressive qui persiste ; un enfant plus triste, moins dynamique ou qui dort davantage ; un poids, puis une taille, qui fléchissent sur la courbe ; un enfant qui enlève systématiquement le gras, émiette, mange très lentement ou exclut des aliments ; des difficultés alimentaires larges ou durables. En cas de malaise, de somnolence inhabituelle ou de difficulté à respirer, appelez le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['mange peu', 'petit mangeur', 'appetit', 'courbe de croissance', 'perte d appetit', 'enfant mince'],
    min_age_months: 12,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.santeAppetit, S.sante13, S.spfPasAPas],
    status: 'to_review',
  },
  {
    slug: 'enfant-malade-mange-moins',
    title: 'Rhume, otite, dents : quand le tout-petit malade mange moins',
    summary: 'Un enfant malade perd souvent l’appétit pour quelques jours. Comment l’alimenter en douceur, garder l’hydratation en tête et repérer les signes qui imposent de consulter.',
    body_md: `Fièvre, nez bouché, otite ou poussée dentaire : votre enfant boude son assiette. C'est souvent passager, mais la question de l'alimentation et surtout de l'hydratation se pose. Voici comment l'accompagner.

## En bref
- Les infections bénignes de l'hiver (rhume, otite, gastro-entérite) réduisent souvent l'appétit pendant quelques jours, sans conséquence sur la croissance.
- Pendant ces jours-là, ne forcez pas : proposez des aliments simples qu'il aime, en petites quantités.
- L'hydratation passe avant tout : proposez à boire régulièrement, surtout en cas de fièvre, de diarrhée ou de vomissements.
- L'appétit revient en général quand l'enfant va mieux.
- Une perte d'appétit qui dure au-delà de la maladie, ou datée précisément sans cause évidente, mérite un avis médical.

## Comprendre
Les pédiatres de mpedia expliquent qu'un rhume, une otite ou une gastro-entérite réduisent l'appétit pendant quelques jours, et que les infections ORL bénignes de l'hiver n'ont pas de conséquence sur la croissance.

mpedia distingue cette baisse passagère d'une véritable perte d'appétit liée à une maladie. Une perte d'appétit brutale peut accompagner des douleurs à la déglutition ou une maladie aiguë ; une perte progressive peut révéler le début d'une maladie chronique. Un manque d'appétit qui dure, une fatigue inhabituelle ou une courbe qui s'infléchit doivent conduire à consulter.

Le plus important pendant une maladie aiguë reste de prévenir la déshydratation, en particulier quand il y a de la fièvre, de la diarrhée ou des vomissements. Le médecin est la bonne personne pour vous dire comment réhydrater votre enfant si besoin.

## Au quotidien
- **Proposez à boire souvent**, en petites quantités : de l'eau, le sein s'il est allaité, et les solutions recommandées par le médecin en cas de gastro-entérite.
- **Simplifiez les repas** : soupe, purée, compote, laitage, pâtes, des aliments faciles à avaler qu'il aime.
- **Fractionnez si nécessaire** pendant quelques jours, sur conseil du médecin, puis revenez au rythme habituel dès que l'appétit revient.
- **Lavez-lui le nez** avant les repas s'il est encombré, selon les conseils de votre médecin ou pharmacien.
- **Ne forcez pas** : il risque de vomir ou de garder un mauvais souvenir du repas.
- **Observez** : couches moins mouillées, bouche sèche, somnolence, changement de comportement.
- **Après la maladie**, reprenez le cadre habituel (trois repas, un goûter, pas de grignotage) pour que l'appétit se régule.

## Questions fréquentes
**Il ne veut que du lait quand il est malade, puis-je lui en donner ?**
Pendant quelques jours, le lait peut l'aider à s'alimenter. Demandez conseil au médecin, notamment en cas de diarrhée, et revenez à des repas variés dès que possible.

**Les poussées dentaires coupent-elles l'appétit ?**
Une poussée dentaire peut rendre les repas moins agréables. Proposez des aliments tendres qu'il aime, sans insister. Si la fièvre est élevée ou s'il semble malade, cherchez une autre cause avec le médecin.

**Combien de temps peut durer cette baisse d'appétit ?**
Lors d'une infection bénigne, elle dure en général quelques jours. Si elle se prolonge après la guérison, parlez-en au médecin.

**Faut-il donner des vitamines pour qu'il reprenne des forces ?**
Ne donnez pas de compléments de votre propre initiative. Le médecin peut prescrire ce dont votre enfant a besoin.

## Quand demander conseil
Consultez rapidement si votre enfant boit très peu, mouille beaucoup moins ses couches, a la bouche sèche, les yeux creux, s'il vomit tout ce qu'il boit, s'il a de la diarrhée importante, une fièvre mal tolérée, s'il est inhabituellement somnolent, geignard ou difficile à réveiller. Appelez le 15 ou le 112 en cas de malaise, de difficulté à respirer, de teint gris ou d'enfant qui ne réagit plus. Consultez aussi si la perte d'appétit persiste après la maladie ou s'accompagne d'une perte de poids.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['enfant malade', 'perte d appetit', 'fievre', 'otite', 'rhume', 'hydratation', 'deshydratation'],
    min_age_months: 12,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.santeAppetit, S.sante1223],
    status: 'to_review',
  },
  // ───────────────────────────── Repas hors de la maison et en famille ─────────────────────────────
  {
    slug: 'repas-creche-assistante-maternelle',
    title: 'Repas à la crèche ou chez l’assistante maternelle : bien se coordonner',
    summary: 'Habitudes, goûter, refus, morceaux acceptés là-bas mais pas à la maison : comment dialoguer avec les professionnels qui nourrissent votre enfant et garder une cohérence.',
    body_md: `Votre enfant prend une partie de ses repas à la crèche ou chez une assistante maternelle. Il y mange parfois mieux qu'à la maison, parfois moins. Comment garder une cohérence entre ces deux univers ?

## En bref
- Parlez de vos habitudes et de vos choix alimentaires avec les personnes qui gardent votre enfant, pour qu'ils soient pris en compte.
- Un seul goûter par jour : s'il a goûté à la crèche, on n'en redonne pas un au retour.
- Signalez les aliments qu'il refuse et ce qui marche : le dialogue aide de chaque côté.
- Beaucoup d'enfants acceptent en collectivité des morceaux ou des aliments qu'ils refusent à la maison.
- En cas d'allergie alimentaire, informez la structure et suivez les démarches indiquées par le médecin.

## Comprendre
Santé publique France conseille de parler des habitudes alimentaires souhaitées avec les personnes qui gardent l'enfant, pour que les choix des parents soient respectés, et de leur signaler les aliments refusés. Elle rappelle aussi qu'il ne faut pas redonner de goûter si l'enfant a déjà goûté à la crèche ou chez son assistante maternelle.

La collectivité est souvent un atout. Les pédiatres de mpedia indiquent que les repas en famille ou à la crèche facilitent la découverte de nouvelles saveurs, et qu'il est fréquent qu'un enfant refuse des morceaux à la maison tout en les acceptant en crèche ou chez son assistante maternelle. Voir d'autres enfants manger, un cadre régulier et l'absence d'enjeu affectif aident.

Pour les familles qui ont des choix particuliers, comme une alimentation végétarienne, mpedia conseille d'en parler tôt, de donner la liste des aliments acceptés et de rester ouvert aux compromis. Un projet d'accueil individualisé (PAI) concerne les situations de santé comme une allergie, pas les choix alimentaires familiaux.

## Au quotidien
- **À l'inscription**, présentez les habitudes de votre enfant : textures acceptées, façon de manger (cuillère, doigts), rythme, aliments déjà introduits.
- **Demandez des nouvelles du repas** au moment de récupérer votre enfant : ce qu'il a mangé, le goûter, s'il a bien bu.
- **Ajustez le dîner** : s'il a peu mangé à midi, proposez un dîner complet ; s'il a très bien mangé, un dîner plus léger peut suffire.
- **Partagez vos astuces** dans les deux sens : un légume accepté en gratin, une recette qu'il adore.
- **Harmonisez les règles** : pas de chantage, pas de dessert-récompense, eau comme boisson.
- **Pour une allergie**, apportez les documents médicaux et suivez la procédure prévue par la structure et le médecin.
- **Si vous apportez des repas** (selon le mode de garde), respectez la chaîne du froid : sac isotherme, conservation au réfrigérateur.

## Questions fréquentes
**Il mange tout à la crèche et rien à la maison, ai-je fait quelque chose de mal ?**
Non. La collectivité stimule souvent l'envie de manger. Mangez avec lui à la maison, dans une ambiance détendue, et continuez à proposer.

**Puis-je demander qu'on ne lui donne pas de sucreries ?**
Oui, vous pouvez en parler avec les professionnels. Les structures ont généralement leurs propres menus ; le dialogue permet de trouver un fonctionnement cohérent.

**Il ne mange presque rien à la crèche les premières semaines, faut-il s'inquiéter ?**
L'adaptation au nouveau lieu peut jouer. Échangez avec l'équipe, surveillez sa forme et consultez si la situation se prolonge ou s'il perd du poids.

**Faut-il lui donner un goûter dans la voiture au retour ?**
Si un goûter a déjà été donné, Santé publique France conseille de ne pas en ajouter un second.

## Quand demander conseil
Consultez le médecin si votre enfant mange très peu partout, à la maison comme en collectivité, s'il perd du poids, s'il tousse ou s'étouffe souvent en mangeant, ou en cas de réaction après un aliment. Une réaction allergique avec gonflement du visage, gêne respiratoire ou malaise impose d'appeler immédiatement le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'ecole-garde',
    tags: ['creche', 'assistante maternelle', 'nounou', 'repas en collectivite', 'gouter', 'transmissions'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante1223, S.santeVege],
    status: 'to_review',
  },
  {
    slug: 'repas-en-famille-sans-ecran',
    title: 'Le repas en famille, sans écran : pourquoi et comment',
    summary: 'Manger ensemble aide le tout-petit à découvrir les goûts et à écouter sa faim ; l’écran, lui, détourne son attention. Des idées pour des repas partagés et apaisés.',
    body_md: `Un dessin animé pour qu'il mange sa purée, le téléphone posé sur la table, la télévision allumée en fond : les écrans s'invitent facilement aux repas. Pour le tout-petit, le repas partagé sans écran est pourtant un vrai moment d'apprentissage.

## En bref
- Les repas en famille aident l'enfant à découvrir de nouveaux aliments, parce qu'il imite ce qu'il voit.
- Santé publique France recommande pas d'écran avant 3 ans et d'éviter les écrans pendant les repas.
- Devant un écran, l'enfant est moins attentif à sa satiété.
- Le repas est aussi un moment d'échange et de langage.
- Le repas n'a pas à être parfait : quelques minutes partagées à table comptent déjà.

## Comprendre
Santé publique France explique que les écrans pendant le repas rendent l'enfant moins attentif à ses sensations de satiété, et que le repas est aussi un moment d'échange. La brochure « Pas à pas » recommande de ne pas exposer l'enfant aux écrans avant 3 ans et d'éviter les écrans pendant les repas. Les pédiatres de mpedia conseillent, eux aussi, d'éteindre la télévision pour que le repas reste un moment de partage.

Manger ensemble a de nombreux avantages. L'enfant voit les adultes goûter et apprécier des aliments variés : selon mpedia, l'exemple des parents est l'un des meilleurs moyens d'aider un enfant à goûter un aliment qu'il refuse. Santé publique France souligne qu'une alimentation familiale variée aide toute la famille à prendre de bonnes habitudes.

Le repas est aussi un moment de langage : nommer les aliments, décrire les couleurs, les goûts, raconter sa journée.

## Au quotidien
- **Rangez les téléphones** pendant le repas, adultes compris, et éteignez la télévision.
- **Installez l'enfant à la table familiale**, dans une chaise haute ou sur un rehausseur stable, attaché si besoin, face aux autres convives.
- **Partagez au moins un repas par jour** quand c'est possible, même si le dîner de l'enfant est servi un peu plus tôt : asseyez-vous avec lui.
- **Parlez de ce qu'il y a dans l'assiette** : « C'est orange, c'est de la carotte ; c'est croquant. »
- **Gardez une durée raisonnable** : inutile de prolonger quand il n'a plus faim.
- **Évitez les reproches et les commentaires** sur ce qu'il mange : parlez d'autre chose, valorisez le moment.
- **Remplacez l'écran** par un rituel : une chanson avant de commencer, mettre la table ensemble, choisir sa cuillère.

## Questions fréquentes
**Sans dessin animé, il ne mange pas, que faire ?**
Le changement peut demander un peu de temps. Expliquez-lui calmement le changement, proposez un petit rituel à la place, et acceptez qu'il mange un peu moins au début. Son appétit se régulera.

**Et au restaurant ou chez des amis ?**
Prévoyez un livre, un petit jeu silencieux ou un moment de dessin pour patienter avant ou après le plat, plutôt qu'un écran pendant qu'il mange.

**Nous rentrons tard : comment faire des repas en famille en semaine ?**
Faites au mieux : un petit-déjeuner partagé, les repas du week-end, ou simplement s'asseoir près de lui pendant qu'il dîne.

**Il ne tient pas assis plus de dix minutes, est-ce un problème ?**
Les tout-petits ont un temps d'attention court. Le repas peut être bref ; l'important est qu'il mange assis, sous votre regard.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si les repas sont devenus une source de conflit permanent, si votre enfant ne peut manger qu'avec un écran depuis longtemps, ou si vous vous sentez épuisé. Le 3114 répond jour et nuit si vous traversez une période difficile. En cas d'étouffement pendant un repas, appelez immédiatement le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['repas en famille', 'ecrans', 'television', 'dessin anime', 'manger ensemble', 'rituel'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.santeSelectivite, S.sante13],
    status: 'to_review',
  },
  // ───────────────────────────── Familles d'aliments et sécurité ─────────────────────────────
  {
    slug: 'viande-poisson-oeufs-1-3-ans',
    title: 'Viande, poisson, œufs entre 1 et 3 ans : repères et précautions',
    summary: 'De petites quantités suffisent au tout-petit : comment varier viande, poisson et œufs, quels poissons éviter ou limiter, et pourquoi tout doit être bien cuit.',
    body_md: `Combien de viande donner à un enfant de 2 ans ? Peut-il manger du thon, des œufs à la coque, du steak saignant ? Voici les repères officiels, sans grammages : les quantités adaptées se discutent avec le professionnel qui suit votre enfant.

## En bref
- Les tout-petits ont besoin de petites quantités de viande, de poisson ou d'œuf ; un excès de protéines n'est pas souhaitable.
- On les propose plutôt au déjeuner, en variant les sources.
- Le poisson est conseillé deux fois par semaine, dont un poisson gras ; certains poissons sont à éviter ou à limiter.
- Viande, poisson et œufs doivent toujours être bien cuits à cœur ; pas de préparations à base d'œuf cru.
- La charcuterie est à éviter avant 5 ans.

## Comprendre
Les pédiatres de mpedia précisent que les besoins en protéines animales sont faibles entre 1 et 3 ans et qu'un excès pourrait être associé à un risque accru de surpoids plus tard. Ils conseillent de concentrer ces aliments au déjeuner et de varier les sources. La viande, rouge ou blanche, peut être proposée chaque jour ; viandes et abats apportent du fer bien absorbé. Les abats sont possibles dès 1 an, bien cuits et en petite quantité. Un œuf peut remplacer la viande ou le poisson.

Pour le poisson, la recommandation est de deux fois par semaine, dont une fois un poisson maigre et une fois un poisson gras, pour les acides gras essentiels. mpedia indique que certains poissons sont à éviter chez le jeune enfant à cause des polluants (notamment anguille, barbeau, carpe, silure, espadon, requin, marlin, lamproie) et que les poissons prédateurs sauvages (comme la lotte, le bar, le thon, le brochet, la dorade, la raie, le flétan) doivent rester limités. Santé publique France rappelle de varier les espèces.

Côté sécurité, Santé publique France demande que la viande, le poisson et les œufs soient toujours bien cuits à cœur, et qu'on évite les préparations à base d'œufs crus ou insuffisamment cuits, comme la mousse au chocolat ou la mayonnaise maison. La charcuterie est déconseillée avant 5 ans par mpedia ; le jambon cuit découenné est l'option la moins problématique.

## Au quotidien
- **Servez une petite part** de viande, de poisson ou d'œuf, et laissez plus de place aux légumes et aux féculents. Le médecin ou la PMI peut vous donner un repère de quantité pour votre enfant.
- **Variez au fil de la semaine** : volaille, bœuf, porc, agneau, poisson blanc, poisson gras, œuf.
- **Adaptez la texture** : viande hachée ou finement coupée, poisson émietté sans arêtes, omelette ou œuf dur écrasé.
- **Cuisez bien** : steak haché bien cuit à cœur, volaille sans partie rosée, œufs à jaune et blanc pris.
- **Évitez le cru** : pas de tartare, de carpaccio ni de poisson cru.
- **Pensez aux légumineuses** (lentilles, pois chiches, haricots), riches en fibres, en fer et en protéines, qui peuvent compléter les repas.

## Questions fréquentes
**Puis-je donner de la viande le midi et le soir ?**
mpedia conseille plutôt de concentrer la viande, le poisson ou l'œuf sur un repas, en général le déjeuner. Le soir, un repas à base de légumes, de féculents et de produits laitiers convient.

**Le thon en boîte est-il autorisé ?**
Le thon fait partie des poissons prédateurs à limiter chez le jeune enfant selon mpedia. Variez avec d'autres poissons.

**Et les fruits de mer ?**
mpedia indique que les crustacés et fruits de mer cuits, issus d'élevages contrôlés, sont possibles. Comme le reste, ils doivent être bien cuits.

**Mon enfant ne veut pas de viande, est-ce un problème ?**
Proposez-la sous d'autres formes (hachée dans une sauce, en boulettes) et misez sur le poisson, l'œuf et les légumineuses. Le fer demande alors une attention particulière : parlez-en au médecin.

## Quand demander conseil
Consultez si votre enfant refuse toutes les sources de protéines animales, s'il est pâle ou très fatigué, ou si sa croissance ralentit. En cas de diarrhée avec sang, de fièvre élevée ou de vomissements répétés après un repas, consultez rapidement ; appelez le 15 ou le 112 si votre enfant est somnolent, déshydraté ou fait un malaise.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['viande', 'poisson', 'oeuf', 'proteines', 'thon', 'cuisson', 'charcuterie'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.sante1223, S.spfPasAPas, S.sante13],
    status: 'to_review',
  },
  {
    slug: 'aliments-a-eviter-ou-adapter-avant-3-ans',
    title: 'Aliments à éviter ou à adapter entre 1 et 3 ans',
    summary: 'Lait cru, œufs crus, fruits à coque entiers, charcuterie, certains poissons, produits très sucrés ou salés : la liste des précautions pour le tout-petit, et pourquoi.',
    body_md: `Votre enfant mange de plus en plus comme vous, mais certains aliments demandent encore des précautions. Voici une liste claire, avec les raisons, pour cuisiner sereinement entre 1 et 3 ans.

## En bref
- **Risque infectieux** : pas de lait cru ni de fromages au lait cru, pas de viande, de poisson ou d'œuf insuffisamment cuits, pas de préparations à base d'œufs crus.
- **Risque d'étouffement** : pas d'aliments petits, durs et ronds avant 5 ans (cacahuètes, noix entières, bonbons durs) ; fruits à coque seulement en poudre ou finement écrasés.
- **Polluants** : certains poissons à éviter, d'autres à limiter.
- **Sel et sucre** : charcuterie à éviter avant 5 ans, boissons sucrées et produits ultra-transformés à limiter.
- **Soja et boissons végétales** : pas de produits à base de soja avant 3 ans selon Santé publique France.

## Comprendre
**Les risques infectieux.** En raison des risques infectieux, Santé publique France recommande de ne pas donner de lait cru ni de fromages au lait cru, et de toujours bien cuire à cœur viande, poisson et œufs. Elle déconseille les préparations à base d'œufs crus ou peu cuits, comme la mousse au chocolat ou la mayonnaise maison. mpedia précise que les fromages au lait cru sont déconseillés jusqu'à 5 ans.

**Les fausses routes.** Santé publique France recommande de ne pas donner aux moins de 5 ans d'aliments petits, durs et ronds, comme les cacahuètes ; de couper en deux les aliments mous, ronds ou ovales et d'enlever les pépins des raisins. Les fruits à coque ne sont proposés qu'en poudre ou finement écrasés, par exemple dans un gâteau. ameli.fr cite aussi les pistaches, noisettes, amandes et bonbons parmi les aliments à risque.

**Les polluants.** mpedia indique que certains poissons sont à éviter chez le jeune enfant (anguille, barbeau, carpe, silure, espadon, requin, marlin, lamproie) et que les poissons prédateurs sauvages (lotte, bar, thon, brochet, dorade, raie, flétan) doivent rester limités. Les pédiatres citent aussi l'avis de l'Anses et du Haut Conseil de la santé publique qui recommandent de limiter le chocolat chez les jeunes enfants.

**Le sel et le sucre.** La charcuterie est déconseillée avant 5 ans (sel, viande salée non cuite), et les produits ultra-transformés, souvent gras, sucrés ou salés, sont à limiter. Jus de fruits et sodas ne sont pas recommandés par Santé publique France.

**Le soja.** La brochure « Pas à pas » déconseille le lait de soja et les produits à base de soja avant 3 ans, en raison d'un composant suspecté d'être un perturbateur endocrinien.

## Au quotidien
- **Lisez les étiquettes des fromages** : choisissez la mention « lait pasteurisé » ; les fromages au lait cru peuvent être réservés aux adultes.
- **Vérifiez la cuisson** : steak haché cuit à cœur, volaille sans partie rosée, œufs aux jaune et blanc pris.
- **Préparez sans œuf cru** : mousse, tiramisu, mayonnaise maison sont réservés aux plus grands.
- **Coupez les petits fruits ronds** dans la longueur, en deux ou en quatre, et retirez les pépins.
- **Écrasez ou réduisez en poudre** les fruits à coque si vous en utilisez.
- **Rangez apéritifs et confiseries** hors de portée lors des fêtes.
- **Conservez bien** : réfrigérateur réglé à 4 °C maximum dans sa zone la plus froide, plats préparés consommés rapidement.

## Questions fréquentes
**Peut-on utiliser des noix ou des amandes en poudre ?**
Oui : Santé publique France indique que les fruits à coque peuvent être proposés en poudre, non salés, de temps en temps. Entiers ou en morceaux, ils restent à éviter avant 5 ans.

**Les fromages à pâte dure comme le comté sont-ils concernés ?**
Ce qui compte est la mention lait cru ou lait pasteurisé sur l'étiquette. Demandez conseil au médecin ou au fromager en cas de doute.

**Et les épices ?**
Les sources consultées n'interdisent pas les épices douces. Allez-y progressivement et évitez les plats très relevés.

**Pourquoi la charcuterie jusqu'à 5 ans ?**
Selon mpedia, en raison de sa richesse en sel et parce qu'il s'agit souvent de viande salée non cuite. Le jambon cuit découenné est l'option la moins problématique, sans en faire une habitude.

## Quand demander conseil
Consultez rapidement en cas de fièvre, de vomissements répétés ou de diarrhée après un repas, surtout si votre enfant semble abattu. Appelez le 15 ou le 112 s'il s'étouffe, ne peut plus respirer ou parler, ou en cas de réaction allergique grave. Si votre enfant a avalé un produit non alimentaire, appelez le 15, le 112 ou un centre antipoison.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['aliments interdits', 'lait cru', 'oeuf cru', 'fruits a coque', 'charcuterie', 'poissons a eviter', 'soja'],
    min_age_months: 12,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.spfPasAPas, S.sante1223, S.ameliInhale],
    status: 'to_review',
  },
  {
    slug: 'prevenir-les-fausses-routes-a-table',
    title: 'Prévenir les fausses routes à table chez le tout-petit',
    summary: 'Couper les aliments ronds, éviter les petits aliments durs, manger assis sous surveillance : les gestes de prévention au quotidien, et ce qu’il faut faire si l’enfant s’étouffe.',
    body_md: `Les fausses routes alimentaires font partie des accidents les plus redoutés par les parents. La bonne nouvelle : quelques gestes simples à table réduisent beaucoup le risque. Voici les repères de prévention pour les enfants de 1 à 3 ans, et les premiers réflexes.

## En bref
- Une fausse route survient quand un aliment passe dans les voies respiratoires au lieu de l'œsophage.
- Avant 5 ans, on évite les aliments petits, durs et ronds (cacahuètes, noix entières, bonbons durs, olives) et on coupe en deux les aliments mous, ronds ou ovales.
- L'enfant mange toujours assis et sous le regard d'un adulte, jamais en marchant, en courant ou en jouant.
- Rangez hors de portée les aliments à risque, y compris les croquettes des animaux.
- Si l'enfant ne peut plus respirer, tousser ou pleurer : appelez immédiatement le 15 ou le 112.

## Comprendre
ameli.fr définit la fausse route comme le passage d'un aliment ou d'un petit objet dans les voies respiratoires au lieu de l'œsophage, ce qui peut provoquer une asphyxie. Elle se manifeste par une toux brutale, une difficulté à respirer, une agitation. Souvent, la toux expulse l'aliment. Mais chez le jeune enfant, les signes peuvent être peu visibles.

Les jeunes enfants sont particulièrement exposés : ils apprennent encore à mâcher, mettent tout à la bouche et bougent beaucoup en mangeant. Santé publique France recommande de ne pas donner aux moins de 5 ans d'aliments petits, durs et ronds, de couper en deux les aliments mous, ronds ou ovales et d'enlever les pépins des raisins, et de proposer les fruits à coque uniquement en poudre. ameli.fr cite comme aliments à risque les cacahuètes, pistaches, noisettes, amandes, bonbons, et les croquettes pour animaux ; Santé.fr ajoute les petits fruits et les olives.

## Au quotidien
- **Installez l'enfant assis, droit et attaché** dans sa chaise haute ou sur un rehausseur stable, et restez près de lui.
- **Ne le laissez jamais manger seul**, ni dans une autre pièce, ni seul à l'arrière de la voiture.
- **Pas de nourriture en marchant, en courant, en jouant ou en riant aux éclats** : on mange, puis on joue.
- **Coupez** dans la longueur, en deux ou en quatre, les aliments mous, ronds ou ovales : raisins (sans pépins), tomates cerises, petites boulettes.
- **Adaptez les textures** à sa mastication : légumes bien cuits, viande hachée ou finement coupée, pomme crue râpée ou en fines lamelles plutôt qu'en gros morceaux durs.
- **Évitez** les cacahuètes, pistaches, noisettes, amandes et noix entières, les bonbons et les olives entières.
- **Lors des fêtes**, rangez les bols d'apéritif et les confiseries hors de portée, et prévenez les autres adultes.
- **Formez-vous aux gestes de premiers secours** pédiatriques : des formations existent près de chez vous.

## Questions fréquentes
**Comment faire la différence entre un haut-le-cœur et une fausse route grave ?**
Lors d'un haut-le-cœur ou d'une fausse route avec toux efficace, l'enfant tousse, pleure, devient rouge : la toux aide à expulser l'aliment. ameli.fr indique alors de ne pas intervenir (ni doigts dans la bouche, ni tapes dans le dos), de le garder assis et de le surveiller. Les signes graves sont l'impossibilité de tousser, de parler ou de pleurer, des lèvres bleues, une pâleur, un enfant immobile : c'est une asphyxie.

**Que faire en cas d'asphyxie ?**
Appelez le 15 ou le 112 dès les premiers signes. ameli.fr décrit, pour l'enfant de moins de 3 ans, des tapes dans le dos, l'enfant placé à plat ventre sur votre cuisse, tête vers le bas, puis d'autres manœuvres si elles échouent. Suivez les consignes du régulateur au téléphone. Consultez aussi l'article de l'application sur la fausse route.

**L'enfant a toussé puis tout est rentré dans l'ordre, faut-il consulter ?**
ameli.fr précise qu'après une fausse route, une vérification à l'hôpital est nécessaire pour s'assurer que l'aliment a bien été expulsé. Une toux qui persiste ou une respiration sifflante dans les jours qui suivent doivent aussi faire consulter.

**Quels petits objets surveiller aussi ?**
ameli.fr cite les piles rondes, les capuchons de stylo, les pièces de monnaie, les petites pièces de jouets, les perles et les yeux de peluche amovibles. Rangez-les hors de portée, au même titre que les aliments à risque.

## Quand demander conseil
Appelez immédiatement le 15 ou le 112 si votre enfant ne peut plus respirer, tousser, parler ou pleurer, si ses lèvres bleuissent ou s'il perd connaissance. Ces numéros sont gratuits et joignables depuis un mobile, même sans crédit. Consultez après toute fausse route, même si elle semble résolue, et si une toux ou une gêne respiratoire persiste.

${END}`,
    journeys: ['child'],
    category: 'securite',
    tags: ['fausse route', 'etouffement', 'raisins', 'cacahuetes', 'prevention', 'aliments a risque'],
    min_age_months: 12,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.ameliInhale, S.spfPasAPas, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'tout-petit-vegetarien',
    title: 'Un tout-petit végétarien : quelles précautions entre 1 et 3 ans ?',
    summary: 'Une alimentation végétarienne avec produits laitiers et œufs peut convenir à un jeune enfant si elle est variée et suivie ; le végétalisme n’est pas adapté avant 3 ans. Les points clés.',
    body_md: `Votre famille mange peu ou pas de viande et vous vous demandez si votre enfant peut suivre le même mode d'alimentation. Les professionnels distinguent nettement l'alimentation végétarienne et l'alimentation végétalienne. Voici les repères pour les 1–3 ans.

## En bref
- Une alimentation végétarienne qui garde les produits laitiers et les œufs peut convenir à un enfant si elle est variée et équilibrée.
- Le fer demande une attention particulière ; le médecin peut prescrire une supplémentation si besoin.
- L'alimentation végétalienne (sans aucun produit animal) n'est pas adaptée aux enfants, au moins jusqu'à 3 ans, selon Santé publique France.
- Les boissons végétales ne remplacent pas le lait chez le tout-petit.
- Un suivi médical régulier de la croissance est recommandé, et aucun complément ne se donne sans avis médical.

## Comprendre
Les pédiatres de mpedia expliquent qu'un régime végétarien peut convenir à un enfant s'il est varié et équilibré, en particulier s'il conserve les produits laitiers et les œufs. Les sources végétales intéressantes sont les légumineuses, les céréales complètes, les graines, les légumes et les fruits ; les fruits à coque sont, chez le tout-petit, proposés seulement en poudre ou finement écrasés.

Le fer est le point de vigilance principal : le fer des végétaux est moins bien absorbé que celui de la viande. mpedia conseille de l'associer à des aliments riches en vitamine C (agrumes, fraises, brocoli) et rappelle que le trempage des légumineuses et des céréales complètes améliore son absorption. Les protéines végétales gagnent à être associées au cours d'un même repas, par exemple lentilles et semoule, ou haricots et riz.

Pour l'alimentation végétalienne, les avis sont plus réservés : Santé publique France indique qu'elle n'est pas adaptée aux enfants, au moins jusqu'à 3 ans, en raison des risques de carences en fer, protéines, calcium et vitamines. mpedia détaille un risque accru de carences notamment en vitamine B12, fer, calcium, zinc, iode, vitamine D et oméga-3, qui peuvent retentir sur la croissance et le développement.

## Au quotidien
- **Gardez le lait au centre** : allaitement, lait de croissance ou lait de vache entier selon l'avis du médecin, et des produits laitiers chaque jour.
- **Proposez des œufs**, bien cuits, comme alternative à la viande ou au poisson.
- **Mettez les légumineuses au menu** : lentilles corail en purée, houmous, pois chiches écrasés, haricots bien cuits.
- **Associez céréales et légumineuses** dans un même plat : semoule et pois chiches, riz et lentilles.
- **Ajoutez une source de vitamine C** au repas : quartiers d'orange, fraises, brocoli, poivron cuit.
- **Utilisez des huiles riches en oméga-3** (colza, noix) crues dans les plats.
- **Limitez les substituts de viande ultra-transformés**, souvent riches en additifs, en sel ou en sucre selon mpedia.
- **À la crèche ou chez l'assistante maternelle**, parlez tôt de vos choix ; un PAI n'est pas prévu pour un choix alimentaire familial.

## Questions fréquentes
**Le poisson est-il indispensable ?**
Il est recommandé deux fois par semaine pour ses acides gras. Si votre famille n'en consomme pas, parlez-en au médecin, qui pourra vérifier les apports, notamment en iode et en oméga-3.

**Faut-il des compléments ?**
Ne donnez rien de votre propre initiative. mpedia rappelle que la vitamine D est recommandée pour tous les enfants, quel que soit le régime, et que le médecin peut prescrire d'autres suppléments selon la situation.

**Notre enfant peut-il être végétalien s'il est bien suivi ?**
Santé publique France considère que ce mode d'alimentation n'est pas adapté avant 3 ans. Si c'est votre projet familial, un accompagnement médical spécialisé est indispensable avant de l'appliquer à votre enfant.

**La crèche peut-elle s'adapter à nos choix ?**
mpedia conseille d'en parler tôt avec l'équipe, de fournir la liste des aliments acceptés et de rester ouvert aux compromis, par exemple sur les œufs ou les produits laitiers.

## Quand demander conseil
Consultez un pédiatre ou un professionnel formé en nutrition avant de mettre en place une alimentation qui exclut des groupes d'aliments, surtout avant 3 ans, puis faites suivre régulièrement la croissance. Consultez rapidement si votre enfant est pâle, très fatigué, moins dynamique, si sa croissance ralentit ou s'il perd des acquisitions. En cas de malaise, appelez le 15 ou le 112.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['vegetarien', 'vegetalien', 'vegan', 'sans viande', 'fer', 'legumineuses'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.santeVege, S.spfPasAPas],
    status: 'to_review',
  },
  {
    slug: 'cuisiner-pour-le-tout-petit-fait-maison-conservation',
    title: 'Cuisiner pour le tout-petit : fait maison, plats préparés et conservation',
    summary: 'Fait maison, surgelés, petits pots, restes : comment préparer, réchauffer et conserver les repas d’un enfant de 1 à 3 ans en toute sécurité et sans y passer des heures.',
    body_md: `Cuisiner pour un tout-petit n'est pas forcément long ni compliqué. Entre le fait maison, les surgelés et les petits pots, chaque famille trouve son équilibre. Voici les repères pour bien choisir, réchauffer et conserver.

## En bref
- Le fait maison permet plus de goûts et de textures et une maîtrise de la composition.
- Les légumes surgelés nature sont une excellente solution pour varier rapidement.
- Les petits pots sont pratiques ; on les réchauffe hors de leur barquette plastique et on ne les sale pas.
- Une purée maison se garde au maximum 24 heures au réfrigérateur dans une boîte hermétique, ou peut être congelée.
- Testez toujours la température avant de servir, surtout après le micro-ondes.

## Comprendre
Santé publique France met en avant le fait maison, qui offre plus de goûts et de textures et permet de maîtriser ce qu'il y a dans l'assiette. Elle conseille de privilégier les produits de saison et locaux et, si possible, bio pour les fruits, les légumes, les féculents complets et les légumineuses. Les légumes surgelés nature, non cuisinés, sont une bonne alternative ; mpedia précise qu'ils sont surgelés peu après la récolte et gardent bien leurs vitamines.

Les petits pots et plats pour bébé du commerce sont pratiques mais moins variés que le fait maison. Santé publique France conseille de varier marques et recettes, de vérifier après ouverture la durée de consommation indiquée sur l'étiquette, et de ne pas réchauffer les plats dans leur barquette plastique : on les transvase dans une casserole ou une assiette. mpedia recommande aussi de limiter les plats industriels, souvent peu équilibrés et riches en additifs, et de préférer des contenants en verre, inox ou céramique pour cuire, réchauffer et conserver.

Côté hygiène, la brochure « Pas à pas » rappelle de nettoyer régulièrement surfaces, ustensiles et réfrigérateur, et de régler celui-ci à 4 °C maximum dans sa zone la plus froide, avec un thermomètre.

## Au quotidien
- **Cuisinez en double** : une partie du plat familial non salée et adaptée en texture pour l'enfant.
- **Cuisez à l'eau ou à la vapeur, sans sel**, puis ajoutez un filet d'huile crue au moment de servir.
- **Congelez en portions** : Santé publique France propose par exemple un bac à glaçons, puis un sachet fermé, daté et identifié, à utiliser dans les 2 mois.
- **Au réfrigérateur**, conservez une purée maison 24 heures au maximum, dans une boîte hermétique en verre.
- **Réchauffez dans une assiette ou une casserole**, jamais dans une barquette plastique. Mélangez bien pour éviter les points chauds.
- **Vérifiez la température** en goûtant ou en touchant : Santé.fr rappelle que l'assiette sortie du micro-ondes peut être brûlante.
- **Par prudence, ne réchauffez qu'une fois** une portion et jetez les restes de l'assiette de l'enfant.
- **Lisez les étiquettes** des plats préparés : liste d'ingrédients courte, peu de sel et de sucre ajoutés ; le Nutri-Score aide à comparer.
- **Consultez les rappels de produits** sur le site officiel Rappel Conso si un produit de votre placard vous semble concerné.

## Questions fréquentes
**Le fait maison est-il obligatoire ?**
Non. Les petits pots et les surgelés nature peuvent tout à fait trouver leur place. Le fait maison, même simple, permet de varier les goûts et les textures.

**Puis-je recongeler une purée décongelée ?**
Par prudence, une préparation décongelée se consomme rapidement et ne se recongèle pas.

**Les conserves sont-elles adaptées ?**
mpedia les juge moins intéressantes : le goût change, et les fruits au sirop contiennent souvent du sucre ajouté. Préférez les fruits frais ou surgelés et les compotes sans sucre ajouté.

**Le micro-ondes est-il déconseillé ?**
mpedia recommande d'éviter de chauffer dans des contenants en plastique. Dans un récipient en verre ou en céramique, mélangez bien et vérifiez la température.

## Quand demander conseil
Consultez en cas de diarrhée, de vomissements ou de fièvre après un repas, surtout si plusieurs membres de la famille sont touchés ou si votre enfant semble déshydraté. Appelez le 15 ou le 112 en cas de brûlure étendue, de brûlure du visage ou de la bouche, ou si votre enfant est somnolent ou fait un malaise.

${END}`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['fait maison', 'petits pots', 'surgeles', 'conservation', 'congelation', 'micro-ondes', 'restes'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.sante13, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'chantage-recompense-et-dessert-a-table',
    title: 'Chantage, récompense, dessert : poser un cadre bienveillant à table',
    summary: '« Si tu finis, tu auras un dessert » : pourquoi ces phrases se retournent souvent contre les parents, et comment poser des limites claires et apaisées pendant les repas.',
    body_md: `« Encore une cuillère pour maman », « pas de dessert si tu ne finis pas tes légumes »… Ces phrases sortent souvent d'elles-mêmes, par fatigue ou par inquiétude. Les professionnels conseillent pourtant d'autres façons de faire, plus efficaces à long terme.

## En bref
- Le chantage affectif et le dessert-récompense sont déconseillés : l'enfant doit manger parce qu'il a faim.
- La nourriture n'est ni une récompense, ni une punition, ni une consolation.
- L'adulte décide de la composition et des horaires des repas ; l'enfant décide de la quantité qu'il mange.
- Un refus ne se compense pas par plus de dessert ou un goûter plus copieux.
- Une fermeté bienveillante aide l'enfant à traverser les périodes de refus.

## Comprendre
Santé publique France cite explicitement deux phrases à éviter : « Encore une petite cuillère pour me faire plaisir » et « Si tu finis ton assiette, tu auras un bon dessert ». Elle rappelle que l'enfant doit manger parce qu'il a faim, que le dessert ne doit pas être une récompense, et qu'il ne faut pas compenser un refus par davantage de dessert ou un goûter plus important. La brochure ajoute que c'est le parent qui décide de la composition du repas.

Les pédiatres de mpedia montrent pourquoi : utiliser la nourriture comme récompense fait partie des pratiques associées à une plus grande sélectivité de l'enfant. Promettre un dessert en échange des légumes revient justement à utiliser la nourriture comme récompense. À l'inverse, forcer un enfant transforme le repas en rapport de force : plus le parent contraint, plus l'opposition s'affirme.

mpedia parle de « fermeté bienveillante » : des règles claires et stables, posées sans colère, qui permettent de traverser la période de néophobie. Il ne s'agit ni de tout céder, ni de tout imposer.

## Au quotidien
- **Annoncez le menu, sans négocier** : « Ce soir, il y a des courgettes, des pâtes et un yaourt. »
- **Servez tout le repas sans conditions** : le dessert fait partie du repas, il n'est pas « mérité ».
- **Laissez-le décider de la quantité** : il peut goûter un peu, manger beaucoup, ou laisser.
- **Ne préparez pas de plat de remplacement** à la demande ; prévoyez simplement dans le repas un aliment qu'il accepte.
- **Si le repas tourne au conflit**, terminez-le calmement : « Tu n'as plus faim, on débarrasse. Le prochain repas sera le goûter. »
- **Encouragez sans juger** : remarquez sa curiosité (« tu as regardé la carotte de près »), plutôt que la quantité avalée.
- **Gardez la nourriture hors des récompenses et des consolations** : un autocollant, une histoire ou un câlin font très bien l'affaire.
- **Accordez-vous avec l'autre parent et les personnes qui gardent l'enfant**, pour que les règles soient les mêmes.

## Questions fréquentes
**S'il ne mange rien du repas, a-t-il droit au dessert ?**
Les repères officiels conseillent de ne pas utiliser le dessert comme récompense ni comme punition, et de ne pas compenser par un dessert plus copieux. Un dessert simple, prévu au menu (fruit, laitage), peut être servi comme d'habitude.

**Et si je cède parfois, par fatigue ?**
Cela arrive à tous les parents. L'important est la tendance générale. Revenez au cadre habituel au repas suivant, sans culpabiliser.

**Mon enfant négocie chaque bouchée, comment sortir de ce jeu ?**
Arrêtez la négociation : proposez, puis passez à autre chose. Le repas perd alors son intérêt comme terrain d'opposition.

**Les compliments, c'est aussi une récompense ?**
mpedia déconseille de féliciter ou récompenser un enfant parce qu'il a beaucoup mangé. Valorisez plutôt le moment partagé et ses découvertes.

## Quand demander conseil
Parlez-en au médecin, à la PMI ou à un psychologue si les repas sont devenus une source de conflit quotidien, si votre enfant semble anxieux à table ou a peur de certains aliments, ou si sa croissance s'infléchit. Si vous vous sentez à bout ou craignez de perdre votre calme, le 3114 répond jour et nuit ; si un enfant est en danger, appelez le 119.

${END}`,
    journeys: ['child'],
    category: 'education',
    tags: ['chantage', 'recompense', 'dessert', 'conflit a table', 'limites', 'fermete bienveillante'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.spfPasAPas, S.santeSelectivite, S.santeAppetit],
    status: 'to_review',
  },
];
