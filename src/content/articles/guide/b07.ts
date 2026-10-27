/** Guide complet — lot 07 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ».
 * Thème : bien choisir l'alimentation (étiquettes, Nutri-Score, labels, petits pots, ultra-transformés, conservation, hygiène, rappels).
 * Aucune marque n'est citée ; aucune quantité de lait ni rythme de biberon n'est recommandé par l'application. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page.
const S = {
  etiquetage: { label: 'economie.gouv.fr (Bercy Infos) — Denrées alimentaires : quelles sont les règles d’étiquetage ?', url: 'https://www.economie.gouv.fr/particuliers/mes-droits-conso/alimentation/denrees-alimentaires-quelles-sont-les-regles-detiquetage', consulted_on: C, published: '2025-03-14' },
  nutriLecture: { label: 'economie.gouv.fr — Alimentation : comment lire les étiquettes nutritionnelles ?', url: 'https://www.economie.gouv.fr/particuliers/etiquette-obligations-alimentaire', consulted_on: C },
  dlcEco: { label: 'economie.gouv.fr (Bercy Infos) — Date limite de consommation (DLC), date de durabilité minimale (DDM) : quelle différence ?', url: 'https://www.economie.gouv.fr/particuliers/date-limite-consommation-dlc-ddm', consulted_on: C },
  dlcSante: { label: 'Santé.fr (ministère de l’Agriculture) — Comment conserver les aliments ? DLC, DDM, quelle différence ?', url: 'https://www.sante.fr/comment-conserver-les-aliments-dlc-ddm-quelle-difference', consulted_on: C, published: '2024-10-09' },
  nutriSpf: { label: 'Santé publique France — Nutri-Score', url: 'https://www.santepubliquefrance.fr/nutrition-et-activite-physique/nutri-score', consulted_on: C, published: '2026-03-19' },
  nutriUsage: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Comment bien utiliser le Nutri-Score ?', url: 'https://www.sante.fr/comment-bien-utiliser-le-nutri-score', consulted_on: C, published: '2025-03-24' },
  nutriArrete: { label: 'Santé publique France — Signature de l’arrêté Nutri-Score : un pas de plus vers une meilleure information nutritionnelle des consommateurs', url: 'https://www.santepubliquefrance.fr/les-actualites/2025/signature-de-l-arrete-nutri-score-un-pas-de-plus-vers-une-meilleure-information-nutritionnelle-des-consommateurs', consulted_on: C, published: '2025-03-17' },
  allegations: { label: 'DGCCRF (economie.gouv.fr) — Allégations nutritionnelles et de santé', url: 'https://www.economie.gouv.fr/dgccrf/Publications/Vie-pratique/Fiches-pratiques/Allegations-nutrionnelles-et-de-sante', consulted_on: C },
  ultra: { label: 'Santé.fr — Comment repérer les aliments ultratransformés ?', url: 'https://www.sante.fr/decryptage/nos-reponses/comment-reperer-les-aliments-ultratransformes', consulted_on: C, published: '2024-09-27' },
  additifs: { label: 'Santé.fr (DGCCRF) — Additifs alimentaires : conditions et modalités d’utilisation', url: 'https://www.sante.fr/additifs-alimentaires-conditions-et-modalites-dutilisation', consulted_on: C, published: '2019-06-11' },
  bio: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — Alimentation : comprendre le label bio', url: 'https://www.sante.fr/alimentation-comprendre-le-label-bio', consulted_on: C, published: '2024-08-22' },
  labels: { label: 'economie.gouv.fr (Bercy Infos) — AOP-AOC, IGP, AB… : les labels de qualité dans l’alimentation', url: 'https://www.economie.gouv.fr/particuliers/aop-aoc-igp-stg-labels-alimentation', consulted_on: C, published: '2018-12-17' },
  sucres: { label: 'Santé.fr (Anses) — Sucres dans l’alimentation', url: 'https://www.sante.fr/sucres-dans-lalimentation', consulted_on: C, published: '2024-03-18' },
  sel: { label: 'Santé.fr (Fédération française de cardiologie) — Réduire sa consommation de sel', url: 'https://www.sante.fr/reduire-sa-consommation-de-sel', consulted_on: C, published: '2019-10-16' },
  diversif: { label: '1000 premiers jours (Santé publique France) — Le petit guide de la diversification alimentaire « Pas à pas, votre enfant mange comme un grand » (brochure)', url: 'https://www.1000-premiers-jours.fr/sites/default/files/2021-09/Brochure%20diversification%20alimentaire.pdf', consulted_on: C },
  laitInfantile: { label: 'Santé.fr — Quel lait infantile choisir ?', url: 'https://www.sante.fr/quel-lait-infantile-choisir', consulted_on: C, published: '2026-07-24' },
  spf411: { label: 'Santé publique France — Alimentation des enfants de 4 à 11 ans : une campagne d’information pour guider les parents', url: 'https://www.santepubliquefrance.fr/index.php/presse/alimentation-des-enfants-de-4-a-11-ans-une-campagne-dinformation-pour-guider-les-parents', consulted_on: C, published: '2024-09-10' },
  anses10: { label: 'Anses — Conseils d’hygiène dans la cuisine : dix gestes simples pour prévenir les risques microbiologiques', url: 'https://www.anses.fr/fr/content/conseils-dhygiene-dans-la-cuisine-dix-gestes-simples-pour-prevenir-les-risques', consulted_on: C, published: '2020-12-24' },
  ansesFrigo: { label: 'Anses — Comment garantir l’hygiène des aliments dans son réfrigérateur ?', url: 'https://www.anses.fr/fr/content/comment-garantir-lhygiene-des-aliments-dans-son-refrigerateur', consulted_on: C, published: '2020-12-11' },
  chaineFroid: { label: 'DGCCRF — La chaîne du froid (dépliant, juin 2015)', url: 'https://bourgogne-franche-comte.dreets.gouv.fr/sites/bourgogne-franche-comte.dreets.gouv.fr/IMG/pdf/depliant-chaine-du-froid-juin2015.pdf', consulted_on: C },
  ars: { label: 'ARS Auvergne-Rhône-Alpes — Intoxication alimentaire : comment se protéger et réagir en cas de symptômes ?', url: 'https://www.auvergne-rhone-alpes.ars.sante.fr/intoxication-alimentaire-comment-se-proteger-et-reagir-en-cas-de-symptomes', consulted_on: C, published: '2025-08-28' },
  ameliGastro: { label: 'ameli.fr — Gastro-entérite de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-enfant/que-faire-quand-consulter', consulted_on: C, published: '2021-03-23' },
  materiaux: { label: 'DGCCRF (economie.gouv.fr) — Prenez garde aux matériaux mis au contact des aliments', url: 'https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/prenez-garde-aux-materiaux-mis-au-contact-des-aliments', consulted_on: C },
  rappels: { label: 'economie.gouv.fr — Retraits et rappels de produits : comment signaler et s’informer sur les produits à risque ?', url: 'https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/retraits-et-rappels-de-produits-comment-signaler-et-sinformer-sur-les-produits-risque', consulted_on: C, published: '2026-03-30' },
  champignons: { label: 'Santé.fr (RecoSanté, recommandations Anses) — Cueillette de champignons : comment prévenir les intoxications ?', url: 'https://sante.fr/cueillette-de-champignons-comment-prevenir-les-intoxications', consulted_on: C, published: '2025-07-23' },
  eauBib: { label: 'Santé.fr (mpedia, AFPA) — Quelle eau choisir pour le biberon ?', url: 'https://sante.fr/quelle-eau-choisir-pour-le-biberon', consulted_on: C, published: '2022-01-31' },
  eau: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — L’eau, à consommer à volonté', url: 'https://www.sante.fr/leau-consommer-volonte', consulted_on: C, published: '2025-10-13' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du médecin, de la sage-femme, de la PMI ou du professionnel de santé qui vous suit.';
const FAMILY: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['pregnant', 'newborn', 'child'], status: 'to_review' };

export const GUIDE_B07: LibArticle[] = [
  // ───────────────────────────── Lire les étiquettes ─────────────────────────────
  {
    ...FAMILY,
    slug: 'etiquette-alimentaire-mentions-obligatoires',
    title: 'Lire une étiquette alimentaire : les mentions obligatoires expliquées',
    summary: 'Dénomination, ingrédients, allergènes, quantité, dates, origine : ce que doit afficher un produit emballé et comment s’en servir pour mieux choisir pour toute la famille.',
    body_md: `Au supermarché, avec un bébé dans les bras ou un enfant qui réclame des biscuits, on a rarement le temps de tout lire. Quelques repères suffisent pourtant pour comprendre une étiquette.

## En bref
- Les produits préemballés doivent porter des mentions obligatoires, rédigées en français et qui ne doivent pas induire en erreur.
- La liste des ingrédients est classée du plus important au moins important en poids, additifs et arômes compris.
- Les allergènes doivent être mis en évidence dans la liste des ingrédients.
- La date limite (DLC ou DDM), les conditions de conservation et la déclaration nutritionnelle font partie des informations obligatoires.
- Les mentions marketing (« naturel », « sans conservateurs ») ne doivent pas être trompeuses, mais elles ne remplacent pas la lecture de la liste des ingrédients.

## Comprendre
En France comme dans toute l'Union européenne, l'étiquetage des denrées alimentaires suit le règlement européen n° 1169/2011. Pour un produit préemballé, plusieurs informations doivent obligatoirement figurer :
- **la dénomination de vente**, c'est-à-dire le nom précis du produit (par exemple « confiture extra de coings ») ;
- **la liste des ingrédients**, par ordre d'importance pondérale décroissante, y compris les additifs et les arômes ;
- **les allergènes**, mentionnés et mis en relief (en gras, en couleur ou soulignés) ;
- **la quantité de certains ingrédients**, notamment ceux mis en avant dans le nom ou sur l'emballage (le pourcentage de jambon d'une « pizza au jambon », par exemple) ;
- **la quantité nette**, et le poids net égoutté pour un produit présenté dans un liquide ;
- **la DLC** (« à consommer jusqu'au… ») ou **la DDM** (« à consommer de préférence avant… ») ;
- **le nom et l'adresse de l'opérateur** établi dans l'Union européenne, et un **numéro de lot** qui permet la traçabilité ;
- **le mode d'emploi** si nécessaire et **les conditions de conservation** particulières ;
- **la déclaration nutritionnelle** (le tableau des valeurs nutritionnelles) ;
- **l'origine**, obligatoire pour certaines denrées.

Pour la viande bovine, les lieux de naissance, d'élevage et d'abattage doivent être indiqués, préemballée ou non. Pour la viande de porc, de mouton, de chèvre et de volaille préemballée, ce sont les lieux d'élevage et d'abattage. En restauration hors domicile, y compris en vente à emporter, l'origine de ces viandes doit aussi être indiquée.

Les produits vendus sans emballage (pain, pâtisserie, vrac) ne portent pas d'étiquette complète, mais une affichette à proximité doit indiquer leur nom, la présence d'allergènes le cas échéant et leur état (décongelé, cuit…).

## Au quotidien
- **Commencez par le nom exact du produit.** « Préparation à base de… » ou « saveur… » ne désigne pas la même chose que le produit lui-même.
- **Regardez les trois premiers ingrédients** : ce sont ceux qui pèsent le plus dans la recette.
- **Vérifiez le pourcentage de l'ingrédient mis en avant** : une soupe « aux légumes » ou un yaourt « aux fruits » doit afficher la part de légumes ou de fruits.
- **Repérez la date et la conservation** avant de mettre le produit dans le chariot, surtout pour les produits frais destinés à un enfant ou à une femme enceinte.
- **Gardez l'emballage** des produits entamés ou congelés : il porte le numéro de lot, utile en cas de rappel.

## Questions fréquentes
**L'étiquette est-elle forcément en français ?** Oui : pour les produits préemballés vendus en France, les mentions obligatoires sont en français.

**Que vaut une mention comme « naturel » ou « sans conservateurs » ?** Ces mentions sont volontaires. Elles ne doivent pas être trompeuses ni présenter comme particulière une caractéristique que tous les produits similaires possèdent. Elles ne disent rien, à elles seules, de la qualité nutritionnelle du produit.

**Pourquoi l'origine du produit diffère-t-elle parfois de celle de l'ingrédient principal ?** Depuis le 1er avril 2020, si l'étiquette indique une origine pour le produit et que l'ingrédient primaire (celui qui représente au moins la moitié du produit, ou celui que l'on associe à son nom) vient d'ailleurs, cette autre origine doit être précisée.

**Les fruits secs vendus en vrac ont-ils une origine affichée ?** Depuis 2025, l'origine est obligatoire pour certains produits non préemballés, notamment les noix, noisettes, amandes et pistaches sans coque et les fruits séchés.

## Quand demander conseil
Si votre enfant suit un régime particulier (allergie, maladie cœliaque, diabète…), demandez au médecin ou à la diététicienne qui le suit de vous montrer les points de l'étiquette à surveiller pour lui. Si un aliment vous semble mal étiqueté ou trompeur, vous pouvez le signaler sur la plateforme SignalConso. En cas de malaise, de gêne respiratoire ou de gonflement du visage après un repas, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['étiquette', 'lire une étiquette', 'mentions obligatoires', 'origine', 'courses', 'emballage', 'supermarché'],
    sources: [S.etiquetage, S.dlcEco],
  },
  {
    ...FAMILY,
    slug: 'liste-des-ingredients-ordre-pourcentages-lire',
    title: 'La liste des ingrédients : ce que révèlent l’ordre, les pourcentages et les noms inconnus',
    summary: 'Apprendre à lire la liste des ingrédients pour repérer ce qui compose vraiment un produit, les sucres ajoutés et les signes d’une forte transformation.',
    body_md: `La liste des ingrédients est souvent écrite en petits caractères au dos de l'emballage. C'est pourtant l'un des repères les plus utiles pour savoir ce que l'on donne à manger à sa famille.

## En bref
- Les ingrédients sont classés du plus présent au moins présent en poids.
- L'ingrédient mis en valeur dans le nom ou sur l'image doit être accompagné de son pourcentage.
- Les additifs apparaissent par leur nom ou par leur code E précédé de leur catégorie.
- Une liste longue, avec des ingrédients que l'on n'utilise pas en cuisine, est un indice de produit ultratransformé.
- Le sucre peut se cacher sous plusieurs noms : sirops, dextrose, jus concentrés…

## Comprendre
La réglementation impose que la liste des ingrédients soit présentée par ordre d'importance pondérale décroissante, en incluant les additifs et les arômes. Le premier ingrédient est donc celui qui pèse le plus dans la recette. Quand un ingrédient est mis en avant dans la dénomination ou sur l'emballage, sa quantité doit être indiquée, le plus souvent sous forme de pourcentage.

Les additifs doivent figurer soit par leur nom (par exemple « bicarbonate de sodium »), soit par leur code européen précédé du nom de leur catégorie (par exemple « colorant E 102 »).

Santé.fr explique que la liste des ingrédients est le meilleur repère pour identifier un produit ultratransformé : ces produits contiennent souvent plus de cinq ingrédients, dont certains qu'on n'utilise pas pour cuisiner à la maison (sirop de glucose-fructose, amidon modifié, isolat de protéines, huile hydrogénée, arômes…). Aucun logo officiel n'indique le degré de transformation : c'est à la lecture de la liste que l'on s'en rend compte.

Les sucres peuvent apparaître sous différents noms. L'Anses cite notamment le glucose, le fructose, le saccharose (sucre de table), le maltose, mais aussi le sucre inverti, les sirops de glucose et de fructose, les jus concentrés, les sirops de fruits et le miel.

## Au quotidien
- **Lisez d'abord les trois premiers ingrédients.** Si le sucre ou un sirop y figure pour un produit qui n'est pas censé être sucré (sauce, céréales salées, plat préparé), c'est un signal.
- **Comparez les pourcentages** : deux compotes, deux soupes ou deux jambons-purée du rayon peuvent contenir des proportions très différentes de l'ingrédient principal.
- **Repérez les « arômes »** : quand la mention « arôme » n'est pas suivie de « naturel de… », il s'agit d'un arôme qui ne provient pas forcément de l'aliment évoqué.
- **Préférez les listes courtes et compréhensibles**, surtout pour les produits du quotidien des enfants (yaourts, pain, céréales, compotes).
- **Comptez les sources de sucre** : si plusieurs noms de sucres apparaissent séparément, leur total peut être important même si chacun semble loin dans la liste.
- **Faites-en un jeu avec les enfants** à partir de 6–7 ans : chercher le premier ingrédient ou le pourcentage de fruits sur l'emballage les rend acteurs de leurs choix.

## Questions fréquentes
**Un produit avec beaucoup d'ingrédients est-il forcément moins bon ?** Pas forcément : un plat mijoté peut contenir de nombreux légumes et épices. Ce qui alerte, ce sont surtout les ingrédients industriels (sirops, amidons modifiés, isolats, arômes) et les additifs à visée cosmétique (texture, couleur, goût).

**« Sans sucres ajoutés » veut-il dire sans sucre ?** Non. Le produit peut contenir des sucres naturellement présents (fruits, lait). La liste des ingrédients et la ligne « dont sucres » du tableau nutritionnel vous renseignent.

**Le bio dispense-t-il de lire la liste ?** Non. Un produit bio peut lui aussi être ultratransformé ou riche en sucre, en sel ou en graisses.

**Où se trouvent les allergènes ?** Ils doivent être mis en relief dans la liste des ingrédients (gras, couleur, soulignement). Pour les questions d'allergie, un article dédié de l'application détaille les mentions de traces.

## Quand demander conseil
Si votre enfant a une alimentation très restreinte, si vous avez des doutes sur la place des produits transformés dans ses repas ou si vous suivez un régime particulier pendant la grossesse, parlez-en au médecin, à la sage-femme, à la PMI ou à une diététicienne. En cas de réaction brutale après un repas (gêne respiratoire, gonflement, malaise), appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['liste des ingrédients', 'ingrédients', 'étiquette', 'sucre caché', 'arômes', 'additifs', 'ultratransformé'],
    sources: [S.etiquetage, S.ultra, S.sucres],
  },
  {
    ...FAMILY,
    slug: 'tableau-nutritionnel-lire-pour-100-g-portion',
    title: 'Le tableau des valeurs nutritionnelles : lire « pour 100 g » et « par portion »',
    summary: 'Énergie, graisses, sucres, sel : comprendre le tableau nutritionnel obligatoire et l’utiliser pour comparer deux produits du même rayon.',
    body_md: `Le tableau des valeurs nutritionnelles figure sur presque tous les produits emballés. Bien lu, il permet de comparer deux céréales, deux biscuits ou deux plats préparés en un coup d'œil.

## En bref
- La déclaration nutritionnelle est obligatoire sur les denrées préemballées depuis décembre 2016, avec quelques exceptions.
- Elle indique l'énergie, les matières grasses dont acides gras saturés, les glucides dont sucres, les protéines et le sel.
- Les valeurs sont toujours données pour 100 g ou 100 ml : c'est la colonne à utiliser pour comparer.
- Les valeurs « par portion » dépendent de la portion choisie par le fabricant, qui ne correspond pas forcément à celle d'un enfant.
- Les lignes « dont sucres » et « sel » sont les plus utiles au quotidien.

## Comprendre
Le tableau se présente sous une forme uniformisée. Il comporte obligatoirement :
- la **valeur énergétique** (en kJ et kcal) ;
- les **matières grasses**, **dont acides gras saturés** ;
- les **glucides**, **dont sucres** ;
- les **protéines** ;
- le **sel**, exprimé en grammes.

D'autres éléments peuvent être ajoutés volontairement, comme les fibres, certaines vitamines ou certains minéraux. Les aliments non transformés composés d'un seul ingrédient, le thé, les infusions et les très petits emballages en sont dispensés.

Les valeurs sont exprimées au minimum pour 100 g ou 100 ml. Le fabricant peut ajouter des valeurs par portion, à condition d'indiquer combien de portions contient l'emballage, et des pourcentages des apports de référence. Ces repères de portion et d'apport sont établis pour un adulte : ils ne s'appliquent pas tels quels à un jeune enfant.

Le sel mérite une attention particulière : il est présent dans de très nombreux produits transformés (pain, charcuterie, fromages, soupes et plats préparés). Les sucres aussi : l'Anses rappelle que leur excès favorise notamment le surpoids, le diabète de type 2 et les caries.

## Au quotidien
- **Comparez toujours sur la colonne « pour 100 g »** : c'est la seule qui soit identique d'un produit à l'autre.
- **Regardez les lignes « dont sucres » et « sel »** pour les produits que vos enfants consomment souvent : céréales du petit-déjeuner, biscuits, desserts lactés, boissons, sauces, plats préparés.
- **Méfiez-vous des portions affichées** : une « portion » de céréales ou de biscuits sur l'emballage est parfois plus petite que ce qui est réellement servi, ou au contraire calculée pour un adulte.
- **Comparez des produits qui se ressemblent** : deux mueslis, deux pains de mie, deux soupes. Comparer un yaourt nature à un biscuit n'a pas de sens.
- **Associez le tableau à la liste des ingrédients** : le tableau dit combien, la liste dit d'où cela vient (sucre ajouté ou sucre du fruit, par exemple).
- **Utilisez le Nutri-Score quand il est présent** : il résume en une lettre une partie de ces informations.

## Questions fréquentes
**Faut-il calculer les apports de mon enfant avec ces chiffres ?** Ce n'est pas nécessaire. Le tableau sert surtout à comparer des produits entre eux. Pour savoir si l'alimentation de votre enfant couvre ses besoins, c'est sa croissance et son appétit, suivis par le médecin, qui comptent.

**Pourquoi les sucres sont-ils notés « dont sucres » ?** Parce qu'ils font partie des glucides. Le chiffre inclut les sucres naturellement présents (lactose du lait, sucres des fruits) et les sucres ajoutés, sans les distinguer.

**Les fruits et légumes frais n'ont pas de tableau : est-ce un problème ?** Non, les aliments bruts d'un seul ingrédient sont dispensés de cette déclaration.

**D'où viennent les chiffres ?** D'une analyse du produit par le fabricant ou de calculs à partir des valeurs moyennes des ingrédients ou d'une table de composition des aliments.

## Quand demander conseil
Si vous vous inquiétez du poids, de l'appétit ou de la croissance de votre enfant, ou si vous avez un diabète gestationnel et devez surveiller les glucides, demandez un accompagnement au médecin, à la sage-femme ou à une diététicienne plutôt que de vous fier aux seules étiquettes. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['tableau nutritionnel', 'valeurs nutritionnelles', 'pour 100 g', 'portion', 'sucres', 'sel', 'étiquette'],
    sources: [S.nutriLecture, S.sel, S.sucres],
  },
  {
    ...FAMILY,
    slug: 'nutri-score-comprendre-et-comparer',
    title: 'Le Nutri-Score : comprendre les lettres et s’en servir pour comparer',
    summary: 'De A à E, ce que dit le Nutri-Score, comment il est calculé, ce qui a changé avec le nouveau calcul et comment l’utiliser intelligemment en famille.',
    body_md: `Le Nutri-Score est ce logo à cinq lettres colorées, de A vert foncé à E orange foncé, présent sur beaucoup d'emballages. Il ne dit pas tout d'un aliment, mais il aide à faire de meilleurs choix au rayon, rapidement.

## En bref
- Le Nutri-Score classe la qualité nutritionnelle d'un produit de A (plus favorable) à E (moins favorable).
- Il est calculé pour 100 g ou 100 ml à partir des éléments à favoriser et de ceux à limiter.
- Il sert à comparer des produits d'un même rayon, des versions d'un même produit ou des aliments consommés au même moment.
- Son affichage est facultatif pour les entreprises.
- Son calcul a été révisé : en France, les entreprises ont jusqu'en mars 2027 pour l'appliquer sur leurs emballages.

## Comprendre
Le Nutri-Score a été lancé en France en 2017. Santé publique France explique qu'il est calculé pour 100 g ou 100 ml de produit en tenant compte :
- des **éléments à favoriser** : fibres, protéines, fruits, légumes et légumineuses ;
- des **éléments à limiter** : énergie, acides gras saturés, sucres et sel, ainsi que les édulcorants pour les boissons.

Le score obtenu détermine la lettre et la couleur. Le tableau des valeurs nutritionnelles reste obligatoire ; le Nutri-Score, lui, est apposé volontairement par les entreprises.

Le calcul a évolué pour mieux suivre les recommandations alimentaires. D'après Santé publique France, avec le nouveau calcul, entre 30 et 40 % des produits changent de note, sans que leur recette change. Les produits salés et sucrés sont notés plus sévèrement ; les huiles riches en bonnes graisses (olive, colza, noix) passent de C à B ; certains poissons gras comme les sardines ou les maquereaux sont mieux notés ; les féculents complets se distinguent plus facilement des raffinés. Parmi les boissons, seule l'eau est notée A, et les boissons contenant des édulcorants sont désormais classées entre C et E. Depuis le 16 mars 2025, les entreprises disposent de deux ans pour appliquer ce nouveau calcul ; un encadré « nouveau calcul » peut signaler les produits concernés.

## Au quotidien
Santé.fr propose trois façons d'utiliser le Nutri-Score :
- **dans un même rayon** : les céréales du petit-déjeuner, par exemple, vont de A à E ;
- **pour un même produit de marques différentes** : des lasagnes à la bolognaise peuvent être notées A, B, C ou D selon la recette ;
- **pour des produits consommés au même moment** : au dessert, une mousse au chocolat peut se comparer à un yaourt aux fruits ou à une crème caramel.

Quelques réflexes utiles :
- **Partez des repères alimentaires**, puis utilisez le Nutri-Score pour départager : plus de légumes secs, des féculents complets, moins de produits gras, sucrés, salés et ultratransformés.
- **Tenez compte de la catégorie** : certaines familles d'aliments, comme les huiles ou les fromages, ne peuvent pas obtenir A. Un fromage noté C peut être un bon choix dans sa catégorie.
- **Ne cherchez pas le Nutri-Score sur les produits frais** : fruits, légumes et poisson frais n'en portent pas, et ce sont des aliments à privilégier.
- **Pour le goûter des enfants**, Santé publique France conseille, si vous achetez des biscuits, d'éviter surtout ceux notés E.

## Questions fréquentes
**Un produit noté A peut-il être mangé à volonté ?** Le Nutri-Score compare des produits ; il ne dit pas en quelle quantité les consommer. L'équilibre se construit sur l'ensemble des repas.

**Le Nutri-Score tient-il compte des additifs et de la transformation ?** Non. Il évalue la composition nutritionnelle, pas le degré de transformation. Un produit ultratransformé peut être bien noté ; la liste des ingrédients reste utile.

**Pourquoi un même produit change-t-il de lettre ?** Le plus souvent à cause du nouveau calcul, appliqué progressivement. Pendant la transition, deux produits proches peuvent afficher une note calculée selon l'ancienne ou la nouvelle méthode.

**Le Nutri-Score suffit-il pour choisir les aliments de bébé ?** Non : pour un bébé, ce sont les repères de diversification (textures, absence de sel et de sucre ajoutés, variété) donnés par le médecin ou la PMI qui guident les choix.

## Quand demander conseil
Le Nutri-Score ne remplace pas un avis personnalisé. Si votre enfant a une alimentation très sélective, une prise ou une perte de poids qui vous inquiète, ou si vous avez un diabète gestationnel, parlez-en au médecin, à la sage-femme ou à une diététicienne. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['nutri-score', 'nutriscore', 'logo', 'comparer', 'qualité nutritionnelle', 'courses', 'nouveau calcul'],
    sources: [S.nutriSpf, S.nutriUsage, S.nutriArrete],
  },
  {
    ...FAMILY,
    slug: 'dlc-ddm-dates-limites-comprendre',
    title: 'DLC et DDM : « à consommer jusqu’au » ou « de préférence avant » ?',
    summary: 'Comprendre la différence entre date limite de consommation et date de durabilité minimale pour protéger sa famille et gaspiller moins.',
    body_md: `Un yaourt dont la date est passée d'un jour, un paquet de pâtes oublié au fond du placard : faut-il jeter ? Tout dépend de la mention inscrite sur l'emballage.

## En bref
- La DLC (« à consommer jusqu'au… ») est une limite impérative pour les produits très périssables.
- Après la DLC, l'aliment ne doit plus être consommé : il peut provoquer une intoxication alimentaire.
- La DDM (« à consommer de préférence avant… ») concerne les produits secs, stérilisés ou déshydratés.
- Après la DDM, le produit peut perdre en goût ou en texture, mais il peut encore être consommé si l'emballage et l'aspect sont intacts.
- La DLC ne vaut que si la température de conservation indiquée a été respectée.

## Comprendre
**La DLC, date limite de consommation**, concerne les denrées microbiologiquement très périssables, à conserver au frais : viandes, poissons, charcuterie, plats cuisinés réfrigérés, certains produits laitiers. Elle est fixée par les fabricants à partir de tests de vieillissement. Une fois la date dépassée, ces aliments sont considérés comme impropres à la consommation et leur vente est interdite. En cas de rupture de la chaîne du froid, le produit n'est plus propre à la consommation, même avant la date.

**La DDM, date de durabilité minimale**, a remplacé l'ancienne « DLUO ». Elle concerne les produits secs, stérilisés ou déshydratés : café, lait UHT, jus de fruits, gâteaux secs, conserves, pâtes, riz, sucre, farine. Dépasser la DDM ne rend pas l'aliment dangereux, mais il peut perdre une partie de ses qualités gustatives ou nutritionnelles. Son format dépend de la durée de conservation : jour et mois pour moins de trois mois, mois et année jusqu'à 18 mois, année seule au-delà.

Pour lutter contre le gaspillage, un décret de 2022 permet aux fabricants d'ajouter à côté de la DDM une mention indiquant que le produit reste consommable après cette date, ou une formule du type « pour une dégustation optimale ».

Enfin, une **date de congélation** (« produit congelé le… ») est obligatoire pour les viandes congelées, les préparations de viande congelées et les produits de la pêche congelés non transformés.

## Au quotidien
- **Rangez devant** les produits dont la DLC est la plus proche, au réfrigérateur comme dans le placard.
- **Respectez strictement la DLC** des produits frais, en particulier pour les jeunes enfants, les femmes enceintes et les personnes fragiles, plus sensibles aux intoxications.
- **Pour un produit en DDM dépassée**, vérifiez l'emballage (boîte bombée ou abîmée, sachet percé), l'aspect et l'odeur avant de le consommer.
- **Lisez la conservation après ouverture** : beaucoup de produits en DDM (lait UHT, compotes, sauces) doivent être gardés au frais et consommés rapidement une fois ouverts.
- **Faites vos courses en conséquence** : achetez les produits très périssables en quantité adaptée à ce que vous pourrez consommer avant la date.
- **Pour les petits pots et laits infantiles entamés**, suivez la durée indiquée sur l'étiquette.

## Questions fréquentes
**Un yaourt un jour après la DLC, est-ce grave ?** La DLC est une limite impérative fixée pour des raisons sanitaires : les autorités demandent de la respecter. Par prudence, ne le donnez pas à un enfant ni à une femme enceinte.

**Puis-je congeler un produit frais juste avant sa DLC ?** Pour congeler un produit frais, il faut qu'il soit encore en bon état et conservé au froid depuis l'achat. Notez la date sur l'emballage et ne le recongelez jamais après décongélation.

**Pourquoi le lait UHT a-t-il une DDM et le lait frais une DLC ?** Le lait UHT est stérilisé et se conserve longtemps fermé ; le lait frais pasteurisé reste périssable et doit être gardé au froid.

**Les produits vendus en ligne affichent-ils la date ?** Pour la vente à distance, la date peut n'être communiquée qu'à la livraison.

## Quand demander conseil
En cas de symptômes digestifs après avoir mangé un produit douteux (vomissements, diarrhée, fièvre), consultez un médecin, surtout pour un nourrisson, un jeune enfant, une femme enceinte ou une personne fragile. Si l'état se dégrade rapidement (signes de déshydratation, somnolence inhabituelle, sang dans les selles), appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['dlc', 'ddm', 'date de péremption', 'périmé', 'date limite', 'gaspillage', 'conservation'],
    sources: [S.dlcEco, S.dlcSante],
  },
  {
    ...FAMILY,
    slug: 'sucres-caches-reperer-sur-l-etiquette',
    title: 'Sucres cachés : les repérer sur l’étiquette des produits du quotidien',
    summary: 'Sirops, dextrose, jus concentrés : comment trouver le sucre ajouté dans les céréales, yaourts, sauces ou boissons, et réduire le goût sucré en famille.',
    body_md: `Le sucre ne se trouve pas seulement dans les bonbons et les gâteaux. Il se glisse aussi dans des produits que l'on n'imagine pas sucrés : sauces, plats préparés, pains de mie, céréales « nature » ou boissons aromatisées.

## En bref
- L'Anses fixe des repères maximaux de sucres par jour, plus bas pour les enfants que pour les adultes.
- La plupart des enfants de 4 à 12 ans dépassent ces repères.
- Le sucre peut apparaître sous de nombreux noms dans la liste des ingrédients.
- La ligne « dont sucres » du tableau nutritionnel permet de comparer des produits similaires.
- Les boissons sucrées sont une source importante de sucres ; l'eau reste la seule boisson indispensable.

## Comprendre
Selon l'Anses, il ne faut pas dépasser 100 g de sucres par jour chez l'adulte et l'adolescent (hors lactose et galactose, les sucres du lait), 75 g chez l'enfant de 8 à 12 ans et 60 g chez l'enfant de 4 à 7 ans, avec au maximum un verre de boisson sucrée. Or 75 % des enfants de 4 à 7 ans et 60 % des 8 à 12 ans dépassent ces repères. Pour les plus petits, la brochure des 1000 premiers jours recommande de ne pas ajouter de sucre et d'éviter de sucrer les laitages autrement qu'avec des fruits écrasés.

Un excès de sucres favorise le surpoids, le diabète de type 2, les maladies cardiovasculaires et les caries. Sous forme liquide (sodas, nectars, jus, smoothies), les sucres contribuent particulièrement à la prise de poids.

Sur l'étiquette, le sucre peut s'appeler : saccharose, glucose, fructose, dextrose, maltose, sucre inverti, sirop de glucose, sirop de fructose, sirop de glucose-fructose, jus de fruits concentré, sirop de fruits, moût, miel… Les édulcorants intenses, eux, n'apportent pas de bénéfice démontré sur le poids ou la glycémie selon l'Anses.

## Au quotidien
- **Cherchez les sucres dans les trois premiers ingrédients** des céréales, biscuits, desserts lactés et boissons.
- **Additionnez les noms différents** : un produit qui contient du sucre, du sirop de glucose et du dextrose peut être très sucré, même si chaque ingrédient est loin dans la liste.
- **Comparez la ligne « dont sucres » pour 100 g** entre deux produits du même rayon.
- **Préférez les versions nature** (yaourt, fromage blanc, céréales) et sucrez vous-même légèrement, ou avec un fruit écrasé pour les plus jeunes.
- **Mettez une carafe d'eau sur la table** et réservez les jus et sodas aux occasions. Les jus de fruits, même sans sucre ajouté, ne sont pas recommandés chez les jeunes enfants.
- **Réduisez progressivement** : le goût s'habitue. Diminuer peu à peu le sucre dans le chocolat du matin ou les gâteaux maison passe souvent inaperçu.
- **Méfiez-vous des produits « allégés en sucres »** : la mention compare le produit à une version de référence, pas à un aliment peu sucré.

## Questions fréquentes
**Les sucres des fruits et du lait comptent-ils ?** La ligne « dont sucres » les inclut. Les repères de l'Anses excluent le lactose et le galactose (sucres du lait). Les fruits entiers, riches en fibres, restent recommandés ; ce sont surtout les sucres des boissons et produits sucrés qu'il est utile de limiter.

**Le miel ou le sucre de coco sont-ils meilleurs que le sucre blanc ?** Ce sont aussi des sucres. Pour les repères de santé publique, ils se comptent comme les autres. Le miel est par ailleurs à éviter avant 1 an.

**Remplacer le sucre par des édulcorants est-il une bonne idée pour les enfants ?** L'Anses ne retrouve pas de bénéfice démontré des édulcorants intenses, et l'objectif reste de réduire le goût sucré dans son ensemble. L'eau reste la boisson à privilégier.

**Que faire si mon enfant réclame des produits très sucrés ?** Évitez de les interdire totalement ou de les utiliser comme récompense ; proposez-les ponctuellement, en petite quantité, et gardez des goûters simples (pain, fruit, produit laitier) au quotidien.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant boit beaucoup de boissons sucrées et a du mal à s'en passer, s'il a des caries, ou si sa courbe de poids vous inquiète. Une soif intense inhabituelle, des envies d'uriner très fréquentes et une perte de poids chez un enfant doivent faire consulter rapidement ; en cas de somnolence, de vomissements ou de respiration rapide, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['sucre caché', 'sucres ajoutés', 'sirop de glucose', 'étiquette', 'boissons sucrées', 'céréales', 'goûter'],
    sources: [S.sucres, S.nutriLecture, S.diversif],
  },
  {
    ...FAMILY,
    slug: 'allegations-sans-sucres-ajoutes-allege-source-de',
    title: '« Sans sucres ajoutés », « allégé », « source de fibres » : décrypter les allégations',
    summary: 'Ce qu’ont le droit d’affirmer les emballages, ce que ces mentions garantissent vraiment et pourquoi elles ne suffisent pas à juger un produit.',
    body_md: `« Riche en vitamine C », « source de fibres », « sans sucres ajoutés », « bon pour la croissance » : les emballages multiplient les promesses. Ces mentions sont encadrées, mais elles mettent en avant une seule qualité du produit.

## En bref
- Les allégations nutritionnelles et de santé sont des mentions volontaires, encadrées par un règlement européen depuis 2007.
- Seules les allégations figurant sur des listes autorisées peuvent être utilisées.
- « Sans sucres ajoutés » ne peut pas figurer sur un produit contenant des édulcorants.
- Aucun aliment ne peut prétendre prévenir, traiter ou guérir une maladie.
- Une allégation ne dit rien de la qualité globale du produit : la liste des ingrédients, le tableau nutritionnel et le Nutri-Score restent les meilleurs repères.

## Comprendre
La DGCCRF distingue deux types de mentions :
- **l'allégation nutritionnelle** affirme qu'un aliment contient (ou ne contient pas) une certaine quantité d'énergie ou de nutriments : « riche en vitamine C », « source de fibres », « sans matières grasses », « allégé en sucres » ;
- **l'allégation de santé** relie un aliment ou l'un de ses composants à la santé : « le calcium est nécessaire au maintien d'une ossature normale ». Certaines concernent spécifiquement le développement et la santé des enfants.

Ces mentions sont régies par le règlement (CE) n° 1924/2006 et fonctionnent selon le principe des listes positives : seules les allégations autorisées après évaluation scientifique peuvent être utilisées. Le nutriment mis en avant doit être présent en quantité significative pour une portion raisonnable.

Plusieurs pratiques sont interdites : affirmer qu'un aliment prévient ou guérit une maladie, annoncer une vitesse de perte de poids, utiliser des recommandations de professionnels de santé. La mention « convient aux diabétiques » n'est plus autorisée depuis 2016. Les mentions comme « super-aliment » doivent s'appuyer sur une allégation autorisée.

Santé.fr souligne aussi que les produits « allégés en sucres » ou « allégés en matières grasses » contiennent souvent des additifs pour retrouver le goût et la texture d'origine : c'est un indice possible de produit ultratransformé.

## Au quotidien
- **Lisez l'allégation comme un argument publicitaire encadré**, pas comme une garantie de produit sain : des céréales « source de fibres » peuvent être très sucrées.
- **« Sans sucres ajoutés »** signifie qu'aucun sucre ni édulcorant n'a été ajouté ; le produit peut contenir des sucres naturellement présents (compote, jus). Regardez la ligne « dont sucres ».
- **« Allégé » ou « réduit en »** compare le produit à une version de référence de la même gamme ; un biscuit allégé reste un biscuit.
- **« Enrichi en vitamines »** ne compense pas un excès de sucre, de sel ou de graisses.
- **Les allégations destinées aux enfants** (croissance, os, concentration) visent souvent les parents. Pour un enfant en bonne santé qui mange varié, des aliments simples apportent ces nutriments.
- **Comparez avec le Nutri-Score** et le tableau nutritionnel pour 100 g plutôt qu'avec le slogan.

## Questions fréquentes
**Une allégation de santé est-elle une preuve d'efficacité ?** Elle signifie que le lien entre un nutriment et une fonction du corps a été reconnu ; elle ne prouve pas que ce produit, consommé dans votre famille, apporte un bénéfice particulier.

**« Naturel » est-il une allégation ?** C'est une mention marketing qui ne doit pas être trompeuse, mais elle n'est pas une allégation nutritionnelle et ne renseigne pas sur la composition.

**Les mentions « scientifiquement prouvé » sont-elles fiables ?** La DGCCRF les déconseille aux fabricants : elles peuvent induire le consommateur en erreur.

**Où signaler une allégation douteuse ?** Sur la plateforme SignalConso, administrée par la DGCCRF.

## Quand demander conseil
Si un produit présenté comme « adapté » à une maladie (diabète, allergie, troubles digestifs) vous intéresse pour vous ou votre enfant, demandez l'avis du médecin, de la sage-femme ou d'une diététicienne avant de l'intégrer à l'alimentation. En cas de réaction après un repas (gêne respiratoire, gonflement, malaise), appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['allégation', 'sans sucres ajoutés', 'allégé', 'light', 'source de fibres', 'enrichi', 'marketing'],
    sources: [S.allegations, S.ultra],
  },
  {
    journeys: ['newborn', 'child'],
    status: 'to_review',
    slug: 'produits-speciaux-enfants-faut-il-les-acheter',
    title: 'Biscuits, laitages et céréales « spécial enfant » : faut-il les acheter ?',
    summary: 'Les produits présentés comme conçus pour les enfants sont-ils utiles ? Ce que disent les repères de santé publique et comment choisir sans se laisser guider par l’emballage.',
    body_md: `Personnages de dessins animés, couleurs vives, promesses de croissance : de nombreux produits du rayon sont pensés pour attirer les enfants… et rassurer les parents. Sont-ils pour autant nécessaires ?

## En bref
- Les produits laitiers « spécial bébé » sont plus chers sans être nécessaires, selon la brochure des 1000 premiers jours.
- Les biscuits, gâteaux et produits chocolatés destinés aux moins de 3 ans sont souvent trop gras et trop sucrés.
- À partir de 1 an environ, l'enfant peut manger progressivement les mêmes aliments que la famille, avec des textures adaptées et sans sel ajouté jusqu'à 3 ans.
- Pour le goûter, des aliments simples (pain, fruit, produit laitier) sont recommandés.
- Le Nutri-Score et la liste des ingrédients aident à départager les produits destinés aux enfants.

## Comprendre
Hors laits infantiles et aliments pour bébés, encadrés par une réglementation spécifique, les repères de santé publique s'appuient sur des aliments courants. La brochure des 1000 premiers jours précise que les produits laitiers « spécial bébé » coûtent plus cher sans être nécessaires, et que les biscuits, gâteaux et produits chocolatés pour moins de 3 ans sont souvent trop gras et trop sucrés.

Pour les enfants de 4 à 11 ans, Santé publique France recommande de limiter viennoiseries et aliments sucrés et gras au goûter et de proposer par exemple du pain avec un peu de chocolat, de beurre ou de confiture, un fruit, une compote ou un produit laitier. Si vous achetez des biscuits, mieux vaut éviter surtout ceux classés E au Nutri-Score.

Les emballages destinés aux enfants mettent souvent en avant des allégations (« riche en calcium », « source de vitamines »). Ces mentions sont encadrées, mais elles ne disent rien du sucre ou du sel que contient le produit.

## Au quotidien
- **Comparez le produit « enfant » à sa version classique** : un yaourt nature ordinaire, un fromage blanc ou un petit-suisse nature conviennent très bien. Vous pouvez les sucrer avec un fruit écrasé.
- **Pour les céréales**, regardez la ligne « dont sucres » et le Nutri-Score. Du pain, éventuellement complet, avec un peu de beurre est une alternative simple.
- **Préférez les portions familiales** : servir dans un bol ce que l'enfant va manger revient souvent moins cher que les formats individuels.
- **Évitez les boissons pour enfants aromatisées** : l'eau reste la seule boisson indispensable ; les jus, même sans sucre ajouté, ne sont pas recommandés chez les plus petits.
- **Parlez publicité avec les plus grands** : à partir de 5–6 ans, expliquer pourquoi un personnage est dessiné sur la boîte aide l'enfant à prendre du recul.
- **Gardez une place au plaisir** : un biscuit de temps en temps n'est pas un problème ; c'est la régularité qui compte.

## Questions fréquentes
**Les laitages « croissance » apportent-ils plus de calcium ?** Ils peuvent être enrichis, mais les produits laitiers ordinaires apportent déjà du calcium. Santé publique France recommande trois produits laitiers par jour pendant l'enfance, sans exiger de produits spécifiques.

**Et les petits pots pour bébé ?** Ils obéissent à une réglementation particulière qui limite notamment pesticides et additifs ; ils peuvent dépanner pendant la diversification. Un article dédié de l'application explique comment les choisir.

**Mon enfant ne veut que les produits avec un personnage : que faire ?** Proposez sans en faire un enjeu : servez le produit ordinaire dans un joli bol, laissez-le choisir entre deux options que vous avez sélectionnées, faites-le participer à la préparation.

**Les biscuits « bébé » aident-ils à la mastication ?** La brochure des 1000 premiers jours signale que les biscuits pour moins de 3 ans sont souvent trop gras et trop sucrés ; les morceaux d'aliments du repas, adaptés à son âge, permettent aussi de s'entraîner à mâcher.

## Quand demander conseil
Si votre enfant mange très peu de variétés d'aliments, refuse durablement certains groupes d'aliments ou si sa courbe de croissance vous préoccupe, parlez-en au médecin, à la PMI ou à une diététicienne. En cas d'étouffement ou de réaction brutale après un repas, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['produits enfants', 'biscuits bébé', 'laitage enfant', 'céréales enfant', 'marketing', 'goûter', 'publicité'],
    min_age_months: 6,
    max_age_months: 132,
    sources: [S.diversif, S.spf411, S.nutriUsage],
  },
  {
    journeys: ['newborn', 'child'],
    status: 'to_review',
    slug: 'petits-pots-bebe-lire-etiquette-conserver',
    title: 'Petits pots et plats bébé du commerce : lire l’étiquette, conserver, réchauffer',
    summary: 'Comment choisir un petit pot ou un plat pour bébé au rayon, puis le conserver une fois ouvert et le réchauffer correctement.',
    body_md: `Les petits pots dépannent bien des parents, en semaine comme en voyage. Quelques repères permettent de bien les choisir et de les utiliser en toute sécurité.

## En bref
- Les petits pots et plats destinés aux moins de 3 ans obéissent à une réglementation qui limite la présence de pesticides et d'additifs.
- Ils sont pratiques mais moins variés en goûts et en textures que le fait maison : alterner les deux est une bonne solution.
- Ne salez pas les petits pots et ne les réchauffez pas dans leur barquette en plastique.
- Une fois ouvert, un petit pot se conserve selon la durée indiquée sur l'étiquette, au réfrigérateur.
- Les quantités à proposer dépendent de l'âge et de l'appétit de votre bébé : le professionnel qui le suit vous guide.

## Comprendre
La brochure des 1000 premiers jours présente les petits pots comme une solution pratique quand on manque de temps ou en déplacement, avec une limite : ils offrent moins de variété de goûts et de textures que les préparations maison. Les produits destinés aux moins de 3 ans limitent la présence de pesticides et d'additifs.

Sur l'étiquette, vous retrouvez les informations obligatoires : dénomination, liste des ingrédients, allergènes mis en évidence, quantité nette, date (le plus souvent une DDM pour les pots stérilisés, une DLC pour les plats frais), conditions de conservation avant et après ouverture, mode d'emploi. L'âge indiqué sur l'emballage renseigne sur la texture prévue.

Côté sécurité, l'Anses rappelle que les repas des nourrissons ne doivent pas être conservés plus de 48 heures à 4 °C, et que le réfrigérateur doit être à 4 °C maximum dans sa zone la plus froide.

## Au quotidien
**Au rayon**
- **Lisez la liste des ingrédients** : la part de légumes, de viande ou de poisson doit être précisée lorsqu'ils sont mis en avant.
- **Vérifiez l'absence de sel et de sucre ajoutés** dans la liste ; pour les desserts, préférez les fruits sans sucre ajouté.
- **Variez les recettes et les fabricants** : la consistance et la taille des morceaux changent d'un produit à l'autre, ce qui aide bébé à découvrir de nouvelles textures.
- **Choisissez la texture adaptée** au stade de votre enfant plutôt que de vous fier uniquement à l'âge indiqué.
- **Contrôlez l'emballage** : un couvercle bombé ou un opercule abîmé doivent faire renoncer au produit.

**À la maison**
- **Servez dans une assiette** la quantité que bébé va manger, plutôt que de faire manger directement dans le pot : la cuillère passée dans sa bouche contamine le reste.
- **Refermez et mettez au réfrigérateur** le reste aussitôt, en respectant la durée indiquée sur l'étiquette.
- **Ne réchauffez pas dans la barquette plastique** : transvasez dans une casserole ou une assiette.
- **Mélangez bien et vérifiez la température** avant de servir, surtout après un passage au micro-ondes qui chauffe de façon inégale.
- **Ajoutez une petite cuillère de matière grasse crue** (huile de colza, de noix ou d'olive, ou un peu de beurre) comme le recommandent les repères de diversification.
- **En sortie**, emportez les pots fermés ; un pot ouvert se transporte dans un sac isotherme.

## Questions fréquentes
**Les petits pots sont-ils moins bons que le fait maison ?** Ils respectent une réglementation stricte, mais apportent moins de variété. Alterner avec des purées maison permet de profiter des deux.

**Puis-je saler un petit pot qui me semble fade ?** Non : jusqu'à 3 ans, il est recommandé de ne pas saler, ni le fait maison ni les petits pots. Les herbes et aromates donnent du goût.

**Un petit pot réchauffé non terminé peut-il être resservi ?** Par prudence, jetez ce qui a été réchauffé et entamé à la cuillère.

**Les gourdes de compote sont-elles une bonne idée ?** Elles dépannent, mais faire manger à la cuillère ou en morceaux aide l'enfant à découvrir les textures et à mastiquer.

## Quand demander conseil
Pour savoir quelles quantités proposer et à quel rythme faire évoluer les textures, appuyez-vous sur le médecin, la PMI ou la sage-femme qui suit votre bébé. En cas de vomissements répétés, de diarrhée chez un nourrisson ou de signes de déshydratation, consultez rapidement ; s'il est très somnolent, gémit ou respire vite, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation-bebe',
    tags: ['petits pots', 'petit pot bébé', 'plat bébé', 'diversification', 'conservation', 'réchauffer', 'micro-ondes'],
    min_age_months: 4,
    max_age_months: 36,
    sources: [S.diversif, S.anses10, S.etiquetage],
  },
  {
    journeys: ['child'],
    status: 'to_review',
    slug: 'lait-de-croissance-boissons-lactees-lire-l-etiquette',
    title: 'Lait de croissance, laits aromatisés, boissons végétales : s’y retrouver au rayon',
    summary: 'Après 1 an, comment distinguer lait de croissance, lait de vache, laits aromatisés et boissons végétales en lisant l’étiquette, sans quantités imposées.',
    body_md: `Au rayon des laits, les briques et les boîtes se ressemblent : lait de croissance, lait entier, lait chocolaté, « lait » d'avoine ou d'amande… Voici comment lire les emballages pour faire un choix adapté à votre enfant.

## En bref
- Après 1 an, les repères des 1000 premiers jours recommandent, si possible, un lait de croissance enrichi en fer, nature, sans sucre ni arôme ajouté.
- On peut alterner lait de croissance et lait de vache entier.
- Les boissons végétales vendues comme « lait » n'en sont pas et ne répondent pas aux besoins des jeunes enfants.
- Les boissons et produits à base de soja sont déconseillés avant 3 ans.
- La quantité de lait adaptée à votre enfant se discute avec le médecin ou la PMI.

## Comprendre
Avant 1 an, les laits infantiles (1er âge puis 2e âge) suivent une réglementation européenne stricte. Le lait de vache n'est pas adapté au nourrisson : trop riche en protéines, en sodium et en sels minéraux, et pas assez riche en fer, en zinc, en vitamines et en acides gras essentiels.

À partir de 1 an, la brochure des 1000 premiers jours indique que le lait de croissance, enrichi en fer, est recommandé s'il est possible, de préférence nature, sans sucre ni arôme ajouté ; les formules en poudre sont moins chères. On peut aussi alterner avec du lait de vache entier UHT. Si l'enfant ne boit que du lait de vache, il est conseillé de lui proposer des aliments riches en fer et en vitamine C. L'allaitement peut bien sûr se poursuivre.

Les boissons végétales (amande, avoine, riz, coco…) vendues sous l'appellation « lait » ne sont pas des laits et, même enrichies en calcium, ne répondent pas aux besoins des moins de 1 an ; leur usage peut entraîner des carences. Les boissons et produits à base de soja sont déconseillés avant 3 ans.

Avec le nouveau calcul du Nutri-Score, le lait, les laits aromatisés et sucrés, les yaourts à boire et les boissons végétales sont désormais notés comme des boissons, ce qui aide à repérer les versions sucrées.

## Au quotidien
- **Lisez la dénomination** : « lait de croissance », « lait entier », « boisson à base de… ». Une « boisson » végétale n'est pas un lait.
- **Choisissez une version nature** : évitez les laits de croissance ou laits de vache aromatisés (vanille, chocolat, céréales), qui contiennent des sucres ajoutés.
- **Vérifiez la liste des ingrédients** à la recherche de sucres (sirop de glucose, saccharose, dextrose…) et d'arômes.
- **Comparez les formats** : la poudre est souvent plus économique que les briques liquides. Pour la préparation, suivez strictement le mode d'emploi.
- **Respectez la conservation après ouverture** : une brique entamée se garde au réfrigérateur et se consomme rapidement, selon l'étiquette.

## Questions fréquentes
**Le lait de croissance est-il obligatoire ?** Non. Il est recommandé lorsque c'est possible pour son apport en fer, mais l'alternance avec le lait de vache entier est possible, en veillant aux aliments riches en fer.

**Lait demi-écrémé ou entier ?** Les repères des 1000 premiers jours évoquent le lait de vache entier pour les jeunes enfants. Demandez au médecin ce qui convient à votre enfant.

**Mon enfant refuse le lait : que faire ?** Les autres produits laitiers (yaourt, fromage blanc, fromage) apportent aussi du calcium. Parlez-en au médecin si le refus dure.

**Mon enfant est allergique ou a une alimentation végétalienne : quel lait ?** C'est une situation à voir avec le médecin : les boissons végétales ne remplacent pas un lait adapté, et certains laits spécifiques ne sont vendus qu'en pharmacie.

## Quand demander conseil
La quantité de lait, le choix d'un lait spécifique en cas d'allergie, de troubles digestifs ou de régime particulier se décident avec le médecin, la PMI ou la sage-femme. Une pâleur, une grande fatigue ou un enfant qui ne boit presque que du lait et mange peu justifient une consultation. En cas de réaction allergique brutale (gêne respiratoire, gonflement du visage), appelez le 15 ou le 112.

${END}`,
    category: 'alimentation-bebe',
    tags: ['lait de croissance', 'lait après 1 an', 'lait de vache', 'boisson végétale', 'lait aromatisé', 'étiquette', 'fer'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.diversif, S.laitInfantile, S.nutriArrete],
  },
  // ───────────────────────────── Labels, transformation, additifs ─────────────────────────────
  {
    journeys: ['ttc', 'pregnant', 'newborn', 'child'],
    status: 'to_review',
    slug: 'bio-logo-ab-eurofeuille-comprendre',
    title: 'Manger bio en famille : ce que garantissent le logo AB et l’Eurofeuille',
    summary: 'Ce que certifie le label bio, pourquoi il est conseillé pendant la grossesse et les premières années, et ce qu’il ne dit pas sur la qualité nutritionnelle.',
    body_md: `Fruits, légumes, féculents, laitages, petits pots : le bio est partout. Que garantit exactement le logo, et sur quels aliments vaut-il la peine de le privilégier quand on a un budget limité ?

## En bref
- L'Eurofeuille (logo européen) et le logo AB (français) certifient un produit issu de l'agriculture biologique, contrôlé chaque année par un organisme agréé.
- Pour les végétaux, le bio exclut pesticides, herbicides et engrais de synthèse ainsi que les OGM.
- Santé publique France conseille de privilégier le bio dès que possible, surtout pour les fruits et légumes, les légumes secs et les féculents complets.
- Un produit transformé ne porte le logo que si plus de 95 % de ses ingrédients agricoles sont bio.
- Bio ne veut pas dire équilibré : un produit bio peut être gras, sucré, salé ou ultratransformé.

## Comprendre
Le **label européen « Eurofeuille »** identifie les produits alimentaires biologiques dans toute l'Europe. Il atteste que la production respecte un règlement précis, contrôlé chaque année par un organisme certificateur agréé par les pouvoirs publics. Le **logo AB**, français, l'accompagne parfois et apporte la même information. Attention : le logo AB ne garantit pas une origine française ; seule la mention « Agriculture France » sous le logo européen l'indique.

Pour les **végétaux**, le label certifie des cultures sans pesticides, herbicides ni engrais de synthèse, et sans OGM. Cela concerne les fruits et légumes frais, en sachet, en conserve ou surgelés, les légumes secs et les féculents. Pour les **animaux**, il garantit des conditions d'élevage améliorées : accès à l'extérieur, plus d'espace, usage réduit d'antibiotiques et alimentation bio.

Pour les **produits transformés** (fromages, yaourts, pain, plats cuisinés, biscuits…), plus de 95 % des ingrédients agricoles doivent être biologiques, le reste devant être indisponible en bio et autorisé. Les additifs utilisables figurent sur une liste restreinte.

Santé publique France explique que les aliments bio contiennent beaucoup moins de résidus de pesticides, soupçonnés de nuire au développement du bébé et à la fertilité. C'est pourquoi le bio est particulièrement conseillé aux personnes qui ont un projet de grossesse, aux femmes enceintes et allaitantes, et pour l'alimentation des jeunes enfants.

## Au quotidien
- **Priorisez selon votre budget** : fruits et légumes, légumes secs (lentilles, pois chiches, haricots) et féculents complets ou semi-complets sont les aliments pour lesquels le bio est le plus conseillé.
- **Pensez aux formes économiques** : légumes bio surgelés ou en conserve, légumes secs bio en vrac, fruits et légumes de saison.
- **Ne renoncez pas aux fruits et légumes faute de bio** : en manger reste plus important que leur mode de production. Lavez-les et épluchez-les soigneusement.
- **Lisez quand même l'étiquette** : une pizza, des biscuits ou une boisson bio peuvent être aussi gras, sucrés ou salés que leur équivalent conventionnel. Le Nutri-Score permet de comparer.
- **Repérez l'origine** si elle compte pour vous : seule la mention « Agriculture France » sous l'Eurofeuille garantit une origine française.
- **Ne confondez pas** avec des mentions comme « naturel » ou des logos privés : seuls les logos officiels garantissent la certification bio.

## Questions fréquentes
**Les petits pots bio sont-ils indispensables ?** Les aliments pour bébés de moins de 3 ans sont déjà soumis à des limites strictes en pesticides et en additifs. Le bio est un plus possible, pas une obligation.

**Le bio est-il meilleur pour la santé sur le plan nutritionnel ?** Les labels bio ne garantissent pas une meilleure composition en sucre, en sel ou en graisses. Leur intérêt porte surtout sur la réduction des résidus de pesticides et sur le mode de production.

**Un produit avec moins de 95 % d'ingrédients bio peut-il dire « bio » ?** Il ne peut pas porter le logo, mais les ingrédients bio peuvent être signalés comme tels dans la liste des ingrédients.

**Le bio concerne-t-il aussi les cosmétiques pour bébé ?** L'Eurofeuille ne s'applique qu'aux produits alimentaires, pas aux cosmétiques ni aux textiles.

## Quand demander conseil
Si vous avez un projet de grossesse, êtes enceinte ou allaitez et souhaitez réduire votre exposition aux pesticides et autres perturbateurs endocriniens au quotidien, parlez-en au médecin, à la sage-femme ou à la PMI, qui peuvent vous orienter. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['bio', 'label bio', 'logo AB', 'eurofeuille', 'pesticides', 'agriculture biologique', 'budget'],
    sources: [S.bio, S.diversif],
  },
  {
    ...FAMILY,
    slug: 'labels-qualite-label-rouge-aop-igp-stg',
    title: 'Label Rouge, AOP, IGP, STG : que garantissent les signes de qualité ?',
    summary: 'Comprendre les labels officiels de qualité et d’origine, et ce qu’ils ne disent pas sur l’équilibre nutritionnel ou le degré de transformation.',
    body_md: `Fromage AOP, poulet Label Rouge, jambon IGP : ces logos rassurent au moment de choisir. Ils garantissent des choses précises, mais différentes d'un label à l'autre, et aucun ne renseigne sur la qualité nutritionnelle.

## En bref
- L'AOP garantit qu'un produit est élaboré et transformé dans une zone géographique déterminée, selon un savoir-faire lié au terroir.
- L'AOC est la déclinaison française de l'AOP.
- L'IGP lie le produit à un lieu où se déroule au moins une étape de sa production ou de sa transformation.
- La STG protège une recette ou une méthode traditionnelle.
- Le Label Rouge signale une qualité supérieure par rapport aux produits similaires, selon un cahier des charges homologué.

## Comprendre
Bercy Infos décrit les principaux signes officiels :
- **AOP (appellation d'origine protégée)** : signe européen qui garantit que le produit est transformé et élaboré dans une zone géographique déterminée ; il repose sur la notion de terroir et protège le nom du produit dans toute l'Union européenne. Exemples cités : camembert de Normandie, roquefort, lentilles vertes du Puy.
- **AOC (appellation d'origine contrôlée)** : déclinaison française de l'AOP, qui protège le produit en France et constitue une étape vers l'AOP.
- **IGP (indication géographique protégée)** : signe européen pour un produit dont les caractéristiques sont liées au lieu où se déroule au moins une partie de sa production, de son élaboration ou de sa transformation ; il repose sur le savoir-faire.
- **STG (spécialité traditionnelle garantie)** : signe européen qui protège une recette traditionnelle, c'est-à-dire une composition ou une méthode de fabrication.
- **Label Rouge** : label national qui atteste une qualité supérieure à celle des produits similaires, selon un cahier des charges homologué par arrêté.
- **AB** : signe de l'agriculture biologique, qui repose sur le respect de la biodiversité et la préservation des ressources naturelles.

Santé.fr rappelle un point important : AOP, IGP, Label Rouge et bio ne donnent aucune information sur le niveau de transformation d'un produit, ni sur sa teneur en sel, en sucre ou en graisses.

## Au quotidien
- **Choisissez un label pour ce qu'il garantit** : l'origine et le savoir-faire (AOP, IGP), une recette (STG), une qualité supérieure aux produits similaires (Label Rouge), un mode de production (bio).
- **Vérifiez les logos officiels**, reconnaissables et réglementés, plutôt que des visuels évoquant la campagne ou le terroir.
- **Pour la nutrition, lisez le reste de l'étiquette** : un fromage AOP reste un fromage, qui contribue aux apports en sel ; une charcuterie IGP reste une charcuterie à limiter.
- **Pour les enfants et pendant la grossesse**, vérifiez si un fromage AOP est au lait cru : la plupart des fromages au lait cru sont déconseillés aux jeunes enfants et aux femmes enceintes, à l'exception des fromages à pâte pressée cuite comme le comté ou le gruyère.
- **Faites découvrir les produits de terroir** aux enfants : goûter un fromage, une lentille ou un fruit d'une région précise est une belle façon d'éduquer au goût.

## Questions fréquentes
**Un produit peut-il cumuler plusieurs labels ?** Un produit IGP ou STG peut aussi être Label Rouge. En revanche, Label Rouge et AOC-AOP ne peuvent pas être affichés simultanément.

**Label Rouge veut-il dire bio ?** Non, ce sont deux démarches différentes. Un produit peut être l'un, l'autre ou les deux.

**Un produit AOP est-il moins transformé ?** Pas nécessairement : le label porte sur l'origine et le savoir-faire, pas sur la transformation au sens nutritionnel.

**Où trouver la liste des produits sous signe de qualité ?** Bercy Infos renvoie vers les listes officielles des AOP, IGP et STG, en France et en Europe.

## Quand demander conseil
Pendant la grossesse ou pour un jeune enfant, si vous avez un doute sur un fromage, une charcuterie ou un produit de terroir (lait cru, cuisson), demandez à la sage-femme, au médecin ou au commerçant. En cas de fièvre, de troubles digestifs importants ou de malaise après un repas, consultez ; en cas d'urgence, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['label rouge', 'aop', 'aoc', 'igp', 'stg', 'signe de qualité', 'terroir'],
    sources: [S.labels, S.ultra, S.anses10],
  },
  {
    ...FAMILY,
    slug: 'aliments-ultratransformes-reperer-limiter',
    title: 'Aliments ultratransformés : les repérer et en manger moins, sans culpabiliser',
    summary: 'Ce que recouvre la notion d’ultratransformé, comment le repérer dans la liste des ingrédients et des idées réalistes pour en réduire la part dans les repas de la famille.',
    body_md: `Nuggets, chips, biscuits, pains de mie, plats à réchauffer : les aliments ultratransformés sont pratiques et souvent appréciés des enfants. Les autorités de santé recommandent pourtant d'en limiter la place. Voici comment les reconnaître et agir sans se compliquer la vie.

## En bref
- Les aliments ultratransformés sont fabriqués à partir d'ingrédients issus de procédés industriels et d'additifs à visée de goût, de texture ou de conservation.
- Aucun logo n'indique le degré de transformation : la liste des ingrédients est le meilleur indice.
- Santé.fr recommande de les limiter à moins de 15 % de l'alimentation, alors qu'ils en représentent environ 30 %.
- Leur consommation est associée dans des études à un risque accru de surpoids, de diabète de type 2 et de maladies cardiovasculaires.
- Cuisiner à partir de produits bruts ou peu transformés est la façon la plus simple d'en manger moins.

## Comprendre
Santé.fr s'appuie sur la classification NOVA, qui distingue quatre groupes : les aliments bruts ou peu transformés (fruits, légumes, viande, poisson, œufs, lait, graines), les ingrédients culinaires (sel, sucre, huile, beurre, farine), les aliments transformés (plats maison, pain artisanal) et les aliments ultratransformés. Ces derniers sont des produits souvent prêts à consommer, éloignés de leurs matières premières.

Exemples cités : la plupart des plats industriels prêts à réchauffer, les produits d'apéritif, les nuggets et produits à base de viande ou de poisson reconstitués, les nouilles instantanées et soupes déshydratées, la plupart des pains, viennoiseries et gâteaux industriels.

Ni le bio, ni les labels de qualité, ni le Nutri-Score ne renseignent sur le niveau de transformation : un produit bio ou bien noté peut être ultratransformé. Les mentions « allégé en sucres » ou « allégé en matières grasses » sont un indice, car ces produits ont souvent besoin d'additifs pour retrouver goût et texture.

Les études, notamment la cohorte française NutriNet-Santé, associent une forte consommation de ces produits à un risque accru de maladies métaboliques, de certains cancers, de maladies cardiovasculaires et de troubles digestifs. Ces produits sont souvent riches en sel, sucres et graisses saturées et pauvres en fibres.

## Au quotidien
**Repérer dans la liste des ingrédients**
- plus de cinq ingrédients, dont certains qu'on n'utilise pas en cuisine ;
- des sirops (glucose, fructose, glucose-fructose), du dextrose ;
- des amidons modifiés, huiles hydrogénées, isolats de protéines ou de fibres ;
- des arômes non suivis de « naturel de… » ;
- des émulsifiants, épaississants, exhausteurs de goût ou édulcorants.

**Réduire sans tout bouleverser**
- **Remplacez un produit à la fois** : le pain de mie par du pain de boulangerie, les céréales fourrées par du pain beurré ou des flocons d'avoine, le dessert industriel par un yaourt nature et un fruit.
- **Gardez des bases simples** : pâtes, riz, semoule, légumes surgelés nature, œufs, légumes secs en conserve, permettent un repas rapide.
- **Cuisinez en double** le week-end et congelez des portions pour les soirs chargés.
- **Faites participer les enfants** : une pâte à crêpes ou une compote maison leur montre ce qu'il y a dans les aliments.
- **Acceptez le dépannage** : un plat préparé de temps en temps n'est pas un échec. L'objectif est la tendance générale.

## Questions fréquentes
**Les plats pour bébé sont-ils ultratransformés ?** Les aliments pour bébés suivent une réglementation stricte qui limite les additifs. Les repères de diversification recommandent néanmoins d'éviter les produits ultratransformés souvent gras, sucrés ou salés chez les moins de 3 ans.

**Un aliment transformé est-il forcément mauvais ?** Non. Le fromage, le pain artisanal ou les légumes en conserve nature sont des aliments transformés couramment recommandés. C'est l'ultratransformation qui est visée.

**Existe-t-il un outil pour savoir si un produit est ultratransformé ?** Il n'y a pas d'étiquetage officiel. Des bases de données collaboratives permettent de scanner les codes-barres, mais la lecture de la liste des ingrédients reste la méthode la plus simple.

**Mon enfant n'aime que les nuggets : que faire ?** Proposez des versions maison (poulet ou poisson pané au four), servez-les avec un légume qu'il accepte et laissez du temps : les goûts évoluent avec les expositions répétées.

## Quand demander conseil
Si l'alimentation de votre enfant repose presque entièrement sur quelques produits industriels, s'il refuse la plupart des aliments ou si son poids vous inquiète, parlez-en au médecin, à la PMI ou à une diététicienne, sans culpabilité : ils sont là pour vous aider. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['ultratransformé', 'ultra-transformés', 'nova', 'additifs', 'fait maison', 'plats industriels', 'liste des ingrédients'],
    sources: [S.ultra, S.diversif],
  },
  {
    ...FAMILY,
    slug: 'additifs-alimentaires-codes-e-comprendre',
    title: 'Additifs alimentaires et codes E : à quoi servent-ils, comment les repérer ?',
    summary: 'Colorants, conservateurs, émulsifiants, édulcorants : comprendre les codes E, leur encadrement et comment limiter les produits qui en contiennent beaucoup.',
    body_md: `E 330, E 407, E 951… Ces codes intriguent souvent les parents. Les additifs sont autorisés et encadrés, mais savoir les reconnaître aide à choisir des produits plus simples, surtout pour les enfants.

## En bref
- Un additif est une substance ajoutée à un aliment pour une raison technologique : conservation, couleur, texture, goût sucré…
- Chaque additif autorisé porte un code européen : la lettre E suivie d'un numéro qui renseigne sur sa catégorie.
- En Europe, seuls les additifs explicitement autorisés peuvent être utilisés, après avis de l'Autorité européenne de sécurité des aliments (EFSA).
- Les additifs doivent figurer dans la liste des ingrédients, par leur nom ou leur code précédé de leur catégorie.
- Un produit contenant beaucoup d'additifs à visée de texture ou de goût est souvent un produit ultratransformé.

## Comprendre
Selon la DGCCRF, les additifs servent par exemple à améliorer la conservation, limiter l'oxydation, colorer ou renforcer le goût. Les grandes familles sont :
- les **colorants** (codes en E 100) ;
- les **conservateurs** (E 200), qui empêchent le développement de moisissures ou de bactéries ;
- les **antioxydants** (E 300), qui limitent le rancissement des graisses ou le brunissement des fruits coupés ;
- les **agents de texture** (E 400) : émulsifiants, stabilisants, épaississants, gélifiants ;
- les **édulcorants**, qui donnent un goût sucré.

L'Europe applique le principe des « listes positives » : tout additif non expressément autorisé est interdit. Une autorisation nécessite un avis de l'EFSA puis un règlement européen qui précise les doses et les aliments concernés. Un programme de réévaluation a conduit à restreindre ou supprimer certaines autorisations.

Sur l'étiquette, l'additif apparaît soit par son nom (« bicarbonate de sodium »), soit par sa catégorie suivie du code (« colorant E 102 »). Les produits contenant de l'aspartame portent la mention « contient de l'aspartame (source de phénylalanine) ».

Santé.fr cite parmi les additifs typiques des produits ultratransformés les émulsifiants et épaississants (comme la lécithine, la carraghénane ou la gomme de guar), les exhausteurs de goût (comme le glutamate), les édulcorants (comme l'aspartame, le sorbitol ou le xylitol). Les émulsifiants sont étudiés pour leurs effets possibles sur le microbiote intestinal.

## Au quotidien
- **Comptez les additifs** dans les produits que vos enfants consomment tous les jours : yaourts, pain, céréales, jambon, compotes. Choisir des versions avec peu ou pas d'additifs est souvent possible dans le même rayon.
- **Ne paniquez pas devant chaque code E** : tous les additifs autorisés ont été évalués. Ce qui compte, c'est la tendance d'ensemble de l'alimentation.
- **Méfiez-vous des produits « allégés »** ou « light », qui contiennent souvent édulcorants et agents de texture.
- **Pour les moins de 3 ans**, les aliments spécifiques pour bébés limitent les additifs ; pour le reste, les produits bruts et le fait maison restent la meilleure option.
- **Cuisinez des bases maison** (vinaigrette, purée, compote, gâteau simple) : c'est la façon la plus directe de réduire les additifs.

## Questions fréquentes
**Un additif autorisé est-il forcément inoffensif ?** Il a été évalué et autorisé dans des conditions précises (doses, aliments). Les connaissances évoluent et des autorisations peuvent être restreintes. Limiter les produits très transformés reste un conseil de santé publique.

**Les additifs « naturels » sont-ils meilleurs ?** L'origine naturelle ou synthétique ne dit pas tout : un additif d'origine naturelle reste un additif, avec son code E.

**Comment un additif est-il autorisé ?** Après un avis de l'EFSA, un avis d'un comité de la Commission européenne et la publication d'un règlement au Journal officiel de l'Union européenne, qui fixe les doses et les aliments concernés.

**Les édulcorants conviennent-ils aux enfants ?** L'Anses ne retrouve pas de bénéfice démontré des édulcorants intenses ; l'objectif reste de diminuer le goût sucré, et l'eau est la boisson à privilégier.

## Quand demander conseil
Si vous pensez qu'un aliment ou un additif provoque chez votre enfant des symptômes (troubles digestifs, éruption, comportement inhabituel), notez ce qu'il a mangé et parlez-en au médecin plutôt que de supprimer seul de nombreux aliments. En cas de gêne respiratoire, de gonflement du visage ou de malaise, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['additifs', 'code E', 'colorants', 'conservateurs', 'émulsifiants', 'édulcorants', 'aspartame'],
    sources: [S.additifs, S.ultra, S.sucres],
  },
  {
    ...FAMILY,
    slug: 'plats-prepares-traiteur-bien-choisir',
    title: 'Plats préparés et rayon traiteur : bien choisir pour les soirs pressés',
    summary: 'Comment choisir un plat préparé avec le Nutri-Score et l’étiquette, le compléter pour un repas équilibré et le conserver correctement.',
    body_md: `Après une journée de travail, avec un nourrisson qui réclame ou des enfants affamés, un plat préparé peut sauver la soirée. Bien choisi et complété, il trouve sa place dans une alimentation équilibrée.

## En bref
- Le fait maison à partir de produits bruts reste à privilégier, mais un plat préparé de temps en temps peut dépanner.
- Le Nutri-Score permet de comparer des plats équivalents : des lasagnes peuvent être notées de A à D selon la recette.
- Les plats préparés sont souvent riches en sel : comparez la ligne « sel » pour 100 g.
- Complétez le plat avec des légumes, un produit laitier ou un fruit.
- Les produits traiteur et plats cuisinés sont très périssables : respectez la DLC et la chaîne du froid.

## Comprendre
Santé.fr recommande d'abord de cuisiner à partir de produits bruts, idéalement de saison. Quand le temps ou l'énergie manquent, le Nutri-Score aide à repérer les options de meilleure qualité nutritionnelle, par exemple entre plusieurs lasagnes à la bolognaise, qui peuvent obtenir A, B, C ou D selon les fabricants.

Le sel est un point de vigilance : la Fédération française de cardiologie cite les plats préparés, les plats surgelés cuisinés, les soupes préparées, les sauces commerciales et la restauration rapide parmi les sources importantes de sel. Beaucoup de plats prêts à réchauffer sont aussi des produits ultratransformés.

Côté sécurité, l'Anses rappelle que les produits traiteur, plats cuisinés et pâtisseries à la crème non préemballés, sans date limite, sont à consommer rapidement : une conservation inférieure à 3 jours est souvent recommandée, et le commerçant peut vous conseiller. Le réfrigérateur doit être à 4 °C maximum dans sa zone la plus froide.

## Au quotidien
**Choisir**
- **Comparez le Nutri-Score** de plats similaires, puis la ligne « sel » et « acides gras saturés ».
- **Préférez les listes d'ingrédients courtes** où légumes, légumineuses, viande ou poisson figurent en tête.
- **Évitez les formats « portion enfant » systématiques** : un plat familial partagé, complété de légumes, est souvent plus économique.
- **Pensez aux surgelés nature** (légumes, filets de poisson) et aux conserves de légumes ou de légumes secs, qui permettent de composer un repas maison rapidement.

**Compléter**
- Ajoutez une crudité ou une poêlée de légumes surgelés, un morceau de pain, un yaourt nature et un fruit.
- Pour un jeune enfant, prélevez sa part avant d'ajouter sel ou sauce, et vérifiez qu'il n'y a pas d'aliments à risque d'étouffement.

**Conserver et réchauffer**
- Transportez les plats frais dans un sac isotherme et rangez-les vite au réfrigérateur.
- Respectez le mode d'emploi, chauffez bien à cœur et mélangez à mi-cuisson au micro-ondes.
- Ne réchauffez pas un plat dans un emballage qui n'est pas prévu pour cela : transvasez-le dans un plat adapté.
- Pendant la grossesse, évitez les plats traiteur à base de produits crus ou peu cuits et réchauffez bien les plats cuisinés.

## Questions fréquentes
**Les plats préparés pour adultes conviennent-ils à un enfant de 2 ans ?** Ils sont souvent trop salés pour lui : jusqu'à 3 ans, les repères recommandent de ne pas saler. Mieux vaut des préparations simples ou des plats spécifiques à son âge.

**Un plat noté A est-il un repas complet ?** Pas forcément : la note juge le plat lui-même. Ajoutez légumes, féculents ou produit laitier selon ce qu'il contient.

**Peut-on congeler un plat traiteur frais ?** Seulement s'il est encore bien avant sa DLC et a été conservé au froid ; notez la date, et ne le recongelez jamais après décongélation.

**Tous les plats préparés se valent-ils ?** Non : d'un fabricant à l'autre, la note Nutri-Score, la teneur en sel et la liste des ingrédients peuvent être très différentes pour un même plat. Comparer deux ou trois références suffit souvent à trouver une meilleure option.

## Quand demander conseil
Si votre famille dépend beaucoup des plats préparés par manque de temps ou de moyens, la PMI, une assistante sociale ou une diététicienne peuvent vous proposer des idées adaptées à votre budget. En cas de vomissements, diarrhée importante ou fièvre après un repas, surtout chez un enfant ou une femme enceinte, consultez ; en cas de signes graves, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['plats préparés', 'traiteur', 'repas rapide', 'nutri-score', 'sel', 'soirs pressés', 'plat cuisiné'],
    sources: [S.nutriUsage, S.sel, S.anses10],
  },
  // ───────────────────────────── Conservation et hygiène ─────────────────────────────
  {
    ...FAMILY,
    slug: 'surgeles-conserves-fruits-legumes-poisson-famille',
    title: 'Surgelés et conserves : des alliés pour manger équilibré sans y passer des heures',
    summary: 'Légumes surgelés, fruits en conserve, filets de poisson nature : comment bien les choisir et les utiliser pour des repas de famille simples et équilibrés.',
    body_md: `Éplucher des légumes tous les soirs avec un bébé dans les bras n'est pas toujours possible. Bonne nouvelle : les repères de santé publique comptent aussi les fruits et légumes surgelés et en conserve.

## En bref
- Santé publique France encourage à proposer des fruits et légumes sous toutes leurs formes : frais, surgelés, en conserve, crus, cuits.
- Les surgelés nature (légumes, purées de légumes, fruits en morceaux, filets de poisson) sont pratiques, y compris pour les repas de bébé.
- Préférez les versions nature, non cuisinées, sans sauce ni sel ou sucre ajoutés.
- Les surgelés se conservent à −18 °C et ne doivent jamais être recongelés après décongélation.
- Les conserves ont une date de durabilité minimale ; une boîte bombée ou abîmée ne doit pas être consommée.

## Comprendre
Pour les enfants de 4 à 11 ans, Santé publique France recommande de proposer chaque jour des fruits et légumes aux repas, sous toutes leurs formes, y compris surgelés ou en conserve, pour viser progressivement au moins cinq portions par jour à l'âge adulte. Les jus de fruits, eux, ne comptent pas comme une portion.

Pour les plus petits, la brochure des 1000 premiers jours présente les surgelés comme pratiques, à condition de les choisir nature et non cuisinés : purées de légumes, légumes et fruits épluchés en morceaux, filets de poisson nature.

La DGCCRF distingue les aliments **surgelés**, conservés à −18 °C, et les aliments **congelés**, à −12 °C. Dans les deux cas, un aliment décongelé ne doit jamais être recongelé. Les conserves, stérilisées, portent une **DDM** : passée cette date, elles peuvent perdre en qualité sans devenir dangereuses, à condition que la boîte et le contenu soient intacts.

Côté sel, les conserves cuisinées et les plats surgelés préparés peuvent être très salés : la comparaison des étiquettes est utile.

## Au quotidien
**Au rayon**
- **Lisez la liste des ingrédients** : un sachet de haricots verts surgelés devrait contenir… des haricots verts. Évitez les poêlées « cuisinées » avec sauce, crème ou sel ajoutés si vous cuisinez pour un jeune enfant.
- **Préférez les fruits au sirop léger ou au jus**, ou mieux, les compotes sans sucre ajouté.
- **Comparez le sel** des légumes secs et légumes en conserve : certaines versions sont « sans sel ajouté ».
- **Placez les surgelés en dernier dans le chariot** et transportez-les dans un sac isotherme.

**À la maison**
- **Cuisez les légumes surgelés directement**, sans les décongeler, à la vapeur ou à l'eau.
- **Gardez une réserve** : petits pois, épinards, brocolis, haricots verts, poisson nature, fruits rouges permettent un repas équilibré même quand le réfrigérateur est vide.
- **Pour bébé**, mixez des légumes surgelés nature cuits, ajoutez une matière grasse crue (huile de colza, de noix, d'olive ou un peu de beurre), sans sel.
- **Une conserve ouverte** se transvase dans un récipient fermé, se garde au réfrigérateur et se consomme rapidement.
- **Ne consommez pas** une boîte bombée, rouillée, fuyante ou dont le contenu a une odeur ou un aspect anormal.

## Questions fréquentes
**Les légumes surgelés sont-ils aussi intéressants que les frais ?** Les repères de santé publique les placent sur le même plan pour atteindre les recommandations de fruits et légumes. Ils ont l'avantage d'être déjà préparés et de limiter le gaspillage.

**Peut-on utiliser des conserves pour les repas de bébé ?** Les légumes en conserve nature peuvent dépanner, en vérifiant l'absence de sel ajouté. Pour les plus jeunes, la brochure des 1000 premiers jours met en avant les surgelés nature et les préparations maison.

**Que faire si le congélateur est tombé en panne ?** Un aliment décongelé ne doit pas être recongelé. S'il est encore froid et en bon état, il peut être cuisiné rapidement ; en cas de doute, jetez-le.

**Les fruits au sirop comptent-ils comme des fruits ?** Oui, mais le sirop apporte du sucre : préférez les versions au jus ou sans sucre ajouté.

## Quand demander conseil
Si votre enfant mange très peu de fruits et légumes malgré vos efforts, la PMI, le médecin ou une diététicienne peuvent vous aider à trouver des idées adaptées. Après la consommation d'une conserve suspecte (boîte bombée), des troubles de la vue, une difficulté à avaler ou à respirer doivent faire appeler immédiatement le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['surgelés', 'conserves', 'légumes surgelés', 'fruits', 'repas rapide', 'budget', 'congélateur'],
    sources: [S.spf411, S.diversif, S.chaineFroid],
  },
  {
    ...FAMILY,
    slug: 'chaine-du-froid-courses-refrigerateur-famille',
    title: 'Chaîne du froid : des courses au réfrigérateur, les bons gestes en famille',
    summary: 'Sac isotherme, températures, rangement et nettoyage du réfrigérateur : préserver la chaîne du froid pour limiter les intoxications alimentaires.',
    body_md: `Le froid ralentit, voire arrête, la multiplication des micro-organismes responsables d'intoxications alimentaires. Les professionnels respectent des températures réglementaires jusqu'au magasin ; ensuite, c'est à la maison que tout se joue.

## En bref
- Utilisez un sac isotherme et limitez le temps entre l'achat et le rangement.
- La zone la plus froide du réfrigérateur doit être entre 0 et +4 °C : vérifiez-la avec l'indicateur ou un thermomètre.
- Viandes et poissons crus et préparations maison à base de produits animaux vont dans la zone la plus froide.
- Ne laissez pas les aliments plus de 2 heures à température ambiante, et 1 heure par forte chaleur.
- Nettoyez régulièrement le réfrigérateur et désinfectez les éponges.

## Comprendre
La DGCCRF rappelle que le consommateur doit rester vigilant « jusqu'à l'assiette » et respecter la température indiquée sur l'étiquette. Ses repères de conservation :
- **poissons, crustacés et mollusques** : 0 à +2 °C ;
- **viandes crues ou cuites, charcuterie, pâtisseries à la crème, produits au lait cru, fromages découpés, produits décongelés** : +4 °C maximum ;
- **produits laitiers frais, desserts lactés, beurre** : +8 °C maximum ;
- **aliments congelés** : −12 °C ; **surgelés et glaces** : −18 °C.

L'Anses précise qu'en dessous de 4 °C, la multiplication de Listeria est ralentie et celle de la plupart des bactéries pathogènes, dont les salmonelles, est arrêtée. Elle recommande de ne pas surcharger le réfrigérateur, de laisser refroidir les plats chauds avant de les y mettre (la vapeur réchauffe l'appareil), mais de les réfrigérer dans les 2 heures, car certains aliments cuits peuvent contenir des spores qui produisent des toxines à température ambiante.

Ces précautions comptent particulièrement pour les nourrissons, les jeunes enfants et les femmes enceintes, plus vulnérables aux intoxications.

## Au quotidien
**Pendant les courses**
- Prenez les produits frais et surgelés en dernier, rangez-les ensemble dans un sac isotherme et rentrez directement.
- Pour un pique-nique ou une sortie, emportez une glacière avec des pains de glace.

**Au réfrigérateur**
- **Vérifiez la température** : la plupart des appareils récents ont un indicateur dans la zone la plus froide ; sinon, placez un thermomètre.
- **Rangez selon la notice** de l'appareil : viandes et poissons crus, plats maison à base d'œufs crus (mayonnaise, mousse au chocolat) dans la zone la plus froide.
- **Retirez les suremballages en carton**, sauf si la date, la température et le mode d'emploi ne figurent que dessus.
- **Emballez séparément** les aliments crus et cuits, dans des boîtes fermées ou sous film.
- **Placez devant** les produits dont la date est la plus proche.
- **Évitez d'ouvrir la porte longtemps** et vérifiez qu'elle ferme bien : une condensation persistante est un signe de mauvaise fermeture.

**Nettoyage**
- Nettoyez dès qu'il y a une fuite ou une salissure, et régulièrement : eau savonneuse, puis rinçage à l'eau légèrement javellisée, sans appliquer de javel pure sur les parois.
- Dégivrez quand la glace s'accumule.
- Désinfectez les éponges (eau javellisée ou chaleur), qui peuvent héberger beaucoup de bactéries.

## Questions fréquentes
**À quelle fréquence nettoyer le réfrigérateur ?** Les repères varient selon les documents : la DGCCRF conseille de le dégivrer et de le nettoyer une à deux fois par mois, l'Anses au moins une fois par an et dès qu'il est sali. Le plus important est de nettoyer rapidement toute fuite.

**La porte du réfrigérateur convient-elle au lait infantile entamé ?** C'est souvent la zone la moins froide. Pour les préparations destinées au bébé, utilisez la zone la plus froide et respectez les durées indiquées.

**Un produit oublié dans la voiture est-il encore bon ?** Si un produit réfrigéré est resté plus de 2 heures hors du froid (1 heure par forte chaleur), mieux vaut ne pas le consommer.

**Faut-il ranger les œufs au réfrigérateur ?** Pour les œufs du commerce, suivez les indications de l'emballage ; les recommandations sanitaires conseillent de conserver les œufs de poulailler familial au réfrigérateur.

## Quand demander conseil
En cas de vomissements, de diarrhée ou de fièvre après un repas, surtout chez un nourrisson, un enfant, une femme enceinte ou une personne fragile, consultez un médecin. Si plusieurs personnes ont les mêmes symptômes après un repas commun, signalez-le au médecin. Devant des signes de déshydratation, une somnolence inhabituelle ou du sang dans les selles, appelez le 15 ou le 112.

${END}`,
    category: 'securite',
    tags: ['chaîne du froid', 'réfrigérateur', 'frigo', 'température', 'sac isotherme', 'courses', 'listeria'],
    sources: [S.chaineFroid, S.ansesFrigo, S.ars],
  },
  {
    ...FAMILY,
    slug: 'hygiene-cuisine-famille-mains-planches-cuisson',
    title: 'Hygiène en cuisine : les gestes qui protègent toute la famille',
    summary: 'Lavage des mains, planches séparées, cuisson à cœur, gastro dans la maison : les dix gestes recommandés par l’Anses adaptés à une cuisine avec enfants.',
    body_md: `Selon l'Anses, un tiers des toxi-infections alimentaires déclarées en France surviennent à domicile. Quelques gestes simples, répétés au quotidien, réduisent nettement ce risque, en particulier pour les nourrissons, les jeunes enfants et les femmes enceintes.

## En bref
- Lavez-vous les mains à l'eau et au savon avant et pendant la préparation des repas.
- Utilisez des planches et ustensiles différents pour les aliments crus et pour les aliments cuits ou prêts à manger.
- Cuisez bien à cœur la viande hachée et la volaille pour les jeunes enfants et les femmes enceintes.
- Évitez de cuisiner pour les autres quand vous avez une gastro-entérite.
- Ne gardez pas les repas et biberons de nourrisson plus de 48 heures à 4 °C.

## Comprendre
L'Anses recommande dix gestes simples :
1. se laver les mains avant et pendant la préparation des repas ;
2. éviter de cuisiner en cas de symptômes de gastro-entérite, ou à défaut renforcer le lavage des mains et choisir des aliments demandant peu de manipulation ;
3. nettoyer rapidement les salissures du réfrigérateur et le nettoyer entièrement régulièrement ;
4. utiliser une planche pour la viande et le poisson crus et une autre pour les aliments cuits et les légumes propres, et ne pas réutiliser pour des aliments cuits un plat ayant contenu des aliments crus ;
5. ne pas laisser les aliments plus de 2 heures à température ambiante ;
6. consommer rapidement les produits traiteur et plats cuisinés non préemballés ;
7. maintenir 4 °C dans la zone la plus froide du réfrigérateur ;
8. bien cuire à cœur la viande hachée pour les jeunes enfants, les femmes enceintes et les personnes immunodéprimées ;
9. éviter pour ces mêmes personnes la viande ou le poisson crus et les produits au lait cru, à l'exception des fromages à pâte pressée cuite comme le comté ou le gruyère ;
10. ne pas conserver les repas et biberons des nourrissons plus de 48 heures à 4 °C.

L'ARS Auvergne-Rhône-Alpes ajoute quelques repères de cuisson pour les personnes à risque : viande hachée cuite à au moins 70 °C, volaille cuite jusqu'à ce que le jus soit clair, œufs cuits durs.

## Au quotidien
- **Installez un point de lavage des mains** facile d'accès, et lavez-vous aussi les mains après avoir manipulé de la viande crue, des œufs, des déchets, après être allé aux toilettes ou avoir changé une couche.
- **Utilisez deux planches de couleurs différentes** pour ne pas les confondre : une pour le cru, une pour le cuit et les légumes lavés.
- **Lavez soigneusement fruits et légumes** et épluchez-les pour les jeunes enfants.
- **Cuisez le steak haché des enfants** jusqu'à ce que l'intérieur ne soit plus rosé.
- **Pendant une gastro dans la famille**, confiez si possible la cuisine à une personne non malade et nettoyez souvent poignées, plans de travail et sanitaires.
- **Faites cuisiner les enfants en sécurité** : lavage des mains avant de commencer, et pas de goûter une pâte crue contenant des œufs crus.
- **Changez souvent torchons et éponges** et désinfectez les éponges.

## Questions fréquentes
**Le lavage à l'eau suffit-il pour les planches ?** Lavez-les à l'eau chaude savonneuse après chaque usage avec un aliment cru, et séchez-les. Séparer les planches reste la mesure clé.

**Pourquoi la viande hachée est-elle plus à risque ?** Le hachage répartit dans toute la viande les bactéries présentes en surface : seule une cuisson à cœur les détruit, ce qui compte particulièrement pour les jeunes enfants.

**Peut-on cuisiner avec un rhume ?** Ce sont surtout les symptômes digestifs qui imposent d'éviter de cuisiner pour les autres. Dans tous les cas, lavez-vous souvent les mains.

**Peut-on donner un tartare ou un carpaccio à un enfant ?** L'Anses déconseille fortement la viande ou le poisson crus aux jeunes enfants, aux femmes enceintes et aux personnes immunodéprimées.

## Quand demander conseil
Consultez rapidement un médecin si un nourrisson, un enfant, une femme enceinte ou une personne fragile présente des vomissements, une diarrhée ou de la fièvre après un repas. Appelez le 15 ou le 112 en cas de signes de déshydratation, de somnolence inhabituelle, de sang dans les selles ou de malaise.

${END}`,
    category: 'securite',
    tags: ['hygiène cuisine', 'lavage des mains', 'planche à découper', 'cuisson à cœur', 'steak haché', 'gastro', 'intoxication'],
    safety_critical: true,
    sources: [S.anses10, S.ars],
  },
  {
    ...FAMILY,
    slug: 'restes-repas-conserver-rechauffer',
    title: 'Les restes du repas : refroidir, conserver et réchauffer correctement',
    summary: 'Combien de temps laisser un plat à température ambiante, comment ranger les restes et les réchauffer pour les servir aux enfants ou pendant la grossesse.',
    body_md: `Cuisiner en grande quantité et resservir les restes fait gagner du temps et limite le gaspillage. À condition de respecter quelques règles, car certains aliments cuits peuvent devenir à risque s'ils restent trop longtemps à température ambiante.

## En bref
- Ne laissez pas un plat plus de 2 heures à température ambiante, et 1 heure par forte chaleur.
- Laissez refroidir brièvement, puis mettez au réfrigérateur dans une boîte fermée.
- Consommez les restes rapidement et ne les réchauffez qu'une seule fois.
- Pour les repas de nourrisson, la limite est de 48 heures à 4 °C.
- En cas de doute sur l'odeur ou l'aspect, ne consommez pas.

## Comprendre
L'Anses explique que certains aliments cuits peuvent contenir des spores bactériennes qui, à température ambiante, se multiplient et produisent des toxines. C'est pourquoi un plat cuit doit être réfrigéré dans les 2 heures. Il vaut mieux le laisser tiédir un peu avant de le placer au réfrigérateur, car la vapeur d'un plat brûlant fait monter la température de l'appareil ; répartir le plat dans des récipients plus petits l'aide à refroidir plus vite.

La DGCCRF recommande de placer les restes dans des emballages fermés et de les consommer rapidement. L'ARS Auvergne-Rhône-Alpes rappelle de ne pas laisser les produits sensibles (viande, poisson, produits laitiers, plats cuisinés) plus de 2 heures à température ambiante, et plus d'1 heure en cas de forte chaleur.

Pour les plus petits, l'Anses fixe une limite précise : les repas et biberons des nourrissons ne doivent pas être conservés plus de 48 heures à 4 °C. Et la brochure des 1000 premiers jours conseille de ne pas garder une purée maison plus de 24 heures au réfrigérateur, dans une boîte hermétique.

## Au quotidien
- **Rangez les restes dès la fin du repas**, sans attendre la fin de la soirée.
- **Utilisez des boîtes fermées**, de préférence en verre, et notez la date de préparation avec un feutre ou une étiquette.
- **Placez-les dans la zone la plus froide** du réfrigérateur, à 4 °C maximum.
- **Réchauffez une seule fois**, uniquement la quantité qui sera mangée, jusqu'à ce que le plat soit bien chaud au centre. Au micro-ondes, mélangez à mi-chauffe.
- **Vérifiez la température** avant de servir un enfant : le plat doit être chaud partout mais pas brûlant.
- **Jetez ce qui a été servi et entamé** dans l'assiette d'un enfant ou à la cuillère.
- **Congelez rapidement** ce qui ne sera pas mangé dans les prochains jours plutôt que d'attendre qu'il vieillisse au réfrigérateur.
- **Pendant la grossesse**, réchauffez bien les restes et les plats cuisinés, et consommez-les rapidement.

## Questions fréquentes
**Combien de jours garder des restes au réfrigérateur ?** Les documents officiels consultés ne donnent pas de durée unique pour tous les plats ; ils recommandent de consommer les restes rapidement. Pour les plats cuisinés non préemballés achetés chez un commerçant, l'Anses indique qu'une conservation de moins de 3 jours est souvent recommandée. Pour les repas de nourrisson, la limite est de 48 heures.

**Le riz et les pâtes cuits sont-ils concernés ?** Oui : ce sont des aliments cuits qui ne doivent pas rester à température ambiante. Mettez-les au frais rapidement.

**Peut-on réchauffer plusieurs fois un plat ?** Mieux vaut éviter : chaque passage à température tiède favorise la multiplication des bactéries. Ne réchauffez que la portion à consommer.

**Les restes d'un biberon peuvent-ils être redonnés ?** Non. Un biberon entamé ne se garde pas : suivez les consignes de préparation et de conservation des biberons données par le professionnel qui suit votre bébé.

## Quand demander conseil
Après un repas, des vomissements, une diarrhée ou de la fièvre chez un nourrisson, un enfant, une femme enceinte ou une personne âgée justifient de consulter rapidement. Appelez le 15 ou le 112 si l'enfant est très somnolent, ne boit plus, a la bouche sèche ou si vous voyez du sang dans les selles.

${END}`,
    category: 'securite',
    tags: ['restes', 'conserver les restes', 'réchauffer', 'réfrigérateur', 'riz cuit', 'gaspillage', 'intoxication'],
    sources: [S.ansesFrigo, S.chaineFroid, S.ars],
  },
  {
    ...FAMILY,
    slug: 'congelation-decongelation-bonnes-pratiques',
    title: 'Congeler et décongeler : les bonnes pratiques pour les repas de la famille',
    summary: 'Congélation des plats maison et des purées de bébé, décongélation au réfrigérateur, interdiction de recongeler : les règles à connaître.',
    body_md: `Le congélateur est un précieux allié des jeunes parents : purées de bébé préparées à l'avance, plats cuisinés en double, pain, poisson. Bien utilisé, il permet de manger maison même les jours chargés.

## En bref
- Congelez des aliments frais et en bon état, rapidement après leur préparation, dans des emballages adaptés et datés.
- Les surgelés du commerce se conservent à −18 °C.
- Décongelez au réfrigérateur ou au micro-ondes, jamais à température ambiante.
- Ne recongelez jamais un aliment décongelé.
- Pour les purées de bébé, la brochure des 1000 premiers jours conseille de ne pas dépasser 2 mois de congélation.

## Comprendre
La DGCCRF distingue les aliments **congelés** (−12 °C) et **surgelés** (−18 °C, comme les glaces et sorbets) et rappelle une règle à retenir : ne jamais recongeler un aliment décongelé. L'ARS Auvergne-Rhône-Alpes précise que la décongélation doit se faire au réfrigérateur ou au micro-ondes, jamais à température ambiante.

Pour les purées maison de bébé, la brochure des 1000 premiers jours propose une méthode simple : congeler les préparations dans un bac à glaçons en inox, puis transférer les cubes dans une poche plastique datée et identifiée, et ne pas dépasser 2 mois. Au réfrigérateur, une purée maison se garde au maximum 24 heures, dans une boîte hermétique en verre.

Sur les emballages du commerce, une date de congélation est obligatoire pour les viandes congelées, les préparations de viande congelées et les produits de la pêche congelés non transformés.

## Au quotidien
**Congeler**
- **Laissez tiédir puis refroidir** le plat au réfrigérateur avant de le congeler, en restant dans la limite des 2 heures à température ambiante.
- **Portionnez** : petites boîtes pour un repas d'enfant, cubes de purée pour bébé, parts individuelles de plat.
- **Étiquetez** chaque contenant avec le nom du plat et la date.
- **Utilisez des contenants prévus pour la congélation**, selon leur notice.
- **Ne surchargez pas le congélateur** et dégivrez-le quand la glace s'accumule.

**Décongeler**
- **Au réfrigérateur**, la veille pour le lendemain, dans un récipient qui retient le jus (viande, poisson).
- **Au micro-ondes**, en programme décongélation, si vous cuisinez aussitôt.
- **Les légumes surgelés** se cuisent directement, sans décongélation préalable.
- **Une fois décongelé**, l'aliment se conserve au réfrigérateur comme un produit frais (+4 °C) et se consomme rapidement.

## Questions fréquentes
**Puis-je congeler du lait maternel ?** Oui, le lait maternel se congèle selon des règles spécifiques : un article dédié de l'application les détaille, et la sage-femme ou la consultante en lactation peuvent vous conseiller.

**Combien de temps garder un plat maison au congélateur ?** Pour les purées de bébé, la brochure des 1000 premiers jours indique 2 mois maximum. Pour les autres plats, suivez les indications de la notice de votre congélateur et consommez de préférence dans les mois qui suivent.

**Quelle différence entre congelé et surgelé ?** Selon la DGCCRF, les aliments congelés se conservent à −12 °C et les surgelés à −18 °C. Dans les deux cas, un aliment décongelé ne se recongèle pas.

**Le congélateur a été débranché quelques heures : que faire ?** Les aliments décongelés ne doivent pas être recongelés. S'ils sont encore froids, cuisinez-les rapidement ; sinon, jetez-les.

## Quand demander conseil
Pour la conservation du lait maternel ou des biberons, suivez les conseils de la sage-femme, de la PMI ou du médecin. En cas de troubles digestifs, de fièvre ou de malaise après un repas, surtout chez un nourrisson, un jeune enfant ou une femme enceinte, consultez ; en cas de signes de gravité, appelez le 15 ou le 112.

${END}`,
    category: 'securite',
    tags: ['congélation', 'décongélation', 'recongeler', 'congélateur', 'purée bébé', 'batch cooking', 'surgelés'],
    sources: [S.chaineFroid, S.ars, S.diversif],
  },
  {
    ...FAMILY,
    slug: 'contenants-alimentaires-plastique-micro-ondes',
    title: 'Boîtes, films, barquettes : bien utiliser les contenants alimentaires et le micro-ondes',
    summary: 'Lire les instructions des contenants, éviter de chauffer dans les emballages plastique et ne pas détourner les emballages à usage unique, pour toute la famille.',
    body_md: `Boîtes de conservation, films étirables, barquettes de plats préparés, papier aluminium : tous ces matériaux sont en contact avec ce que nous mangeons. Bien les utiliser limite le passage de substances indésirables dans les aliments, en particulier lorsqu'ils sont chauffés.

## En bref
- Les matériaux au contact des aliments sont encadrés par la réglementation et contrôlés par la DGCCRF.
- Leurs instructions d'emploi indiquent la température maximale, les aliments à éviter et l'usage possible au micro-ondes : lisez-les et conservez-les.
- Ne chauffez pas un plat dans son emballage plastique, sauf indication contraire.
- Ne réutilisez pas les emballages à usage unique pour conserver ou cuire des aliments.
- Pour bébé, transvasez les petits pots en barquette plastique dans une assiette ou une casserole avant de les réchauffer.

## Comprendre
La DGCCRF rappelle que vaisselle, ustensiles, équipements et emballages destinés au contact des aliments obéissent à une réglementation européenne et française (dont un règlement spécifique aux matières plastiques et la loi encadrant le bisphénol A). Les fabricants doivent fournir un étiquetage complet, en français, avec les instructions d'emploi : température maximale, restrictions pour certains aliments, utilisation au four à micro-ondes.

Mais la bonne utilisation dépend aussi du consommateur. La DGCCRF déconseille notamment :
- de cuire des aliments dans des sacs de congélation ou des films étirables ;
- de chauffer directement un plat dans son emballage, sauf indication contraire ;
- de réutiliser des emballages à usage unique (barquettes, bacs à glace, gobelets, boîtes de fromage) pour conserver ou cuire des aliments ;
- de faire des papillotes en aluminium avec des aliments acides comme le citron, la chaleur favorisant la migration de l'aluminium ;
- d'utiliser des contenants non destinés au contact alimentaire ou de mettre des aliments au contact de serviettes, d'essuie-tout ou de sets de table, sauf indication contraire.

La brochure des 1000 premiers jours donne la même consigne pour les plats de bébé : ne pas les réchauffer dans leur barquette plastique, mais les transvaser dans une casserole ou une assiette.

## Au quotidien
- **Lisez l'emballage à l'achat** d'une boîte, d'un biberon ou d'un ustensile : conservez la notice et respectez l'usage indiqué (micro-ondes, lave-vaisselle, congélation, aliments gras).
- **Réchauffez dans un récipient dont la notice autorise le micro-ondes**, plutôt que dans une barquette ou un emballage jetable.
- **Lisez la notice des films étirables** avant de les utiliser au micro-ondes ou au contact d'aliments gras ; à défaut d'indication, couvrez avec un couvercle adapté.
- **Ne détournez pas les emballages** : une boîte de glace vide ou une barquette jetable n'est pas faite pour conserver ou réchauffer la soupe.
- **Évitez les papillotes en aluminium** avec des aliments acides comme le citron.
- **Mélangez et vérifiez la température** de tout ce qui sort du micro-ondes avant de le donner à un enfant.

## Questions fréquentes
**Le bisphénol A est-il encore présent dans les contenants alimentaires ?** Il fait l'objet d'une loi spécifique en France et d'une attention particulière lors des contrôles. En pratique, suivez les instructions des fabricants et évitez de chauffer dans des contenants qui ne sont pas prévus pour cela.

**Comment réchauffer un biberon ?** Suivez les consignes du professionnel qui suit votre bébé et la notice du biberon, et vérifiez toujours la température du lait avant de le donner. Un article dédié de l'application détaille la préparation des biberons.

**Les boîtes en plastique vont-elles au congélateur ?** Seulement si elles sont prévues pour cet usage : la notice le précise.

**Les ustensiles en bambou ou les gourdes réutilisables sont-ils concernés ?** Oui, tous les matériaux au contact des aliments sont encadrés. Lisez les instructions et méfiez-vous des produits sans notice ni adresse du fabricant.

## Quand demander conseil
Si un produit au contact des aliments vous paraît non conforme (absence de notice, odeur, déformation à la chaleur), vous pouvez le signaler sur SignalConso et vérifier s'il fait l'objet d'un rappel sur Rappel Conso. En cas de brûlure de la bouche chez un enfant après un aliment trop chaud, refroidissez à l'eau fraîche et demandez conseil à un médecin ; en cas de difficulté à respirer ou d'urgence, appelez le 15 ou le 112.

${END}`,
    category: 'securite',
    tags: ['micro-ondes', 'plastique', 'boîte de conservation', 'film alimentaire', 'aluminium', 'bisphénol', 'contenant alimentaire'],
    sources: [S.materiaux, S.diversif],
  },
  {
    ...FAMILY,
    slug: 'rappels-produits-alimentaires-que-faire',
    title: 'Rappel de produit alimentaire : comment être informé et que faire à la maison ?',
    summary: 'Différence entre retrait et rappel, où trouver les avis officiels et les bons gestes si vous avez acheté un produit rappelé pour vous ou votre enfant.',
    body_md: `Lait infantile, fromage, steak haché, jouet ou siège auto : des produits sont régulièrement rappelés. Savoir où s'informer et comment réagir permet de protéger sa famille sans paniquer.

## En bref
- Un retrait concerne des produits encore en magasin ; un rappel concerne des produits déjà vendus.
- Le site public Rappel Conso rassemble les avis de rappel de produits alimentaires et non alimentaires.
- Si vous possédez un produit rappelé : mettez-le de côté, ne le consommez pas et suivez les consignes de l'avis.
- Gardez l'emballage (numéro de lot, date) et la preuve d'achat.
- En cas de symptômes après consommation, demandez conseil à un professionnel de santé en mentionnant le rappel.

## Comprendre
Le **retrait** consiste à enlever des rayons ou des entrepôts un produit qui n'a pas encore été vendu. Le **rappel** vise un produit déjà acheté : les consommateurs sont invités à le rapporter au magasin ou à le détruire, et l'information est relayée par des campagnes (presse, radio…). Il n'y a pas de rappel sans retrait, mais un retrait peut exister sans rappel.

**Rappel Conso** est le portail public unique d'information sur les rappels de produits de consommation courante, de denrées alimentaires et d'aliments pour animaux. Les fiches sont classées par date, avec un moteur de recherche et des catégories. Les médicaments et dispositifs médicaux relèvent, eux, de l'ANSM. En magasin, l'information peut aussi passer par un affichage en rayon, une mention sur le ticket de caisse ou un message aux titulaires de carte de fidélité.

C'est grâce au **numéro de lot**, obligatoire sur les produits préemballés, et aux dates que l'on peut savoir si son produit est concerné.

## Au quotidien
**Si un produit que vous avez acheté est rappelé**
1. Mettez-le de côté pour que personne ne l'utilise, y compris les enfants.
2. Comparez le nom, le lot et la date de l'emballage avec ceux de l'avis de rappel.
3. Conservez l'emballage, l'étiquette et le ticket de caisse (ou une photo).
4. Suivez la marche à suivre de l'avis : retour en magasin pour remboursement, destruction selon les instructions ou contact avec le service client.
5. En cas de symptômes ou d'effet inhabituel après consommation, demandez conseil à un professionnel de santé.

**Prendre de bonnes habitudes**
- **Consultez Rappel Conso** quand un produit du quotidien de votre bébé (lait infantile, petits pots, céréales) fait parler de lui.
- **Gardez quelques jours les emballages** des produits sensibles entamés, ou prenez une photo du lot.
- **Notez la date d'achat** sur les produits que vous congelez.
- **Restez attentif aux messages** de votre magasin si vous avez une carte de fidélité.

## Questions fréquentes
**Mon enfant a déjà mangé le produit rappelé : que faire ?** Lisez l'avis de rappel, qui précise le risque (bactérie, corps étranger, allergène non déclaré…) et les symptômes à surveiller. Appelez votre médecin pour savoir quoi surveiller et pendant combien de temps. En cas de signes graves, appelez le 15.

**Le magasin doit-il me rembourser ?** L'avis de rappel indique les modalités, qui prévoient souvent un retour en magasin pour remboursement. En cas de litige, une association de consommateurs agréée peut vous aider.

**Comment signaler un produit que je trouve dangereux ?** Sur la plateforme SignalConso, administrée par la DGCCRF, ou auprès de la direction départementale de protection des populations. Les effets indésirables sur la santé peuvent aussi être déclarés sur le portail national de signalement.

**Les rappels concernent-ils aussi les jouets et le matériel de puériculture ?** Oui, toutes les catégories de produits de consommation courante figurent sur Rappel Conso.

## Quand demander conseil
Après consommation d'un produit rappelé, contactez votre médecin ou un pharmacien pour savoir quoi surveiller, en particulier pour un nourrisson, un enfant, une femme enceinte ou une personne fragile. En cas de fièvre élevée, de vomissements répétés, de diarrhée sanglante, de gêne respiratoire ou de malaise, appelez le 15 ou le 112.

${END}`,
    category: 'securite',
    tags: ['rappel conso', 'rappel produit', 'retrait', 'numéro de lot', 'signalconso', 'produit dangereux', 'remboursement'],
    safety_critical: true,
    sources: [S.rappels, S.etiquetage],
  },
  {
    ...FAMILY,
    slug: 'intoxication-alimentaire-famille-signes-que-faire',
    title: 'Intoxication alimentaire : reconnaître les signes et réagir en famille',
    summary: 'Symptômes, délais, personnes fragiles, hydratation et signes d’alerte : que faire quand un ou plusieurs membres de la famille sont malades après un repas.',
    body_md: `Vomissements, diarrhée et maux de ventre quelques heures après un repas : l'intoxication alimentaire est fréquente et le plus souvent passagère. Mais elle peut être sérieuse chez les nourrissons, les jeunes enfants et les femmes enceintes, qui demandent une attention particulière.

## En bref
- Une intoxication alimentaire est due à un aliment ou une boisson contenant des microbes (bactéries, virus, parasites) ou leurs toxines.
- Les symptômes apparaissent de quelques heures à plusieurs jours après le repas : douleurs abdominales, diarrhée, nausées, vomissements, fièvre.
- Le risque principal est la déshydratation, surtout chez le nourrisson.
- Les femmes enceintes, les nourrissons et jeunes enfants, les personnes âgées et immunodéprimées sont plus à risque de complications.
- Deux personnes ou plus malades après un même repas : c'est une toxi-infection alimentaire collective, à signaler au médecin.

## Comprendre
L'ARS Auvergne-Rhône-Alpes cite parmi les germes les plus fréquents les salmonelles, Bacillus cereus, le staphylocoque doré et Clostridium perfringens. Les signes habituels sont les douleurs ou crampes abdominales, la diarrhée (parfois sanglante selon le germe), les nausées et vomissements, la fièvre, les maux de tête et une grande fatigue. Certains germes, comme ceux de la listériose ou du botulisme, peuvent donner des troubles neurologiques.

Les formes bénignes guérissent en 24 à 72 heures, les formes modérées en 3 à 7 jours. Les formes sévères peuvent nécessiter une hospitalisation (déshydratation sévère, complications rénales ou neurologiques).

Chez la femme enceinte, certaines bactéries comme Listeria peuvent entraîner un accouchement prématuré ou une infection du nouveau-né. Chez le nourrisson, surtout avant 6 mois, la déshydratation peut s'installer vite.

Quand au moins deux personnes ont des symptômes similaires après avoir partagé un repas, on parle de toxi-infection alimentaire collective (TIAC). Sa déclaration à l'ARS, faite par le médecin, permet d'identifier l'aliment en cause et d'éviter d'autres cas.

## Au quotidien
**Prendre soin de la personne malade**
- **Faites boire régulièrement**, par petites quantités : eau, bouillons, et solutions de réhydratation orale (SRO) pour les enfants.
- **Chez le nourrisson**, poursuivez l'allaitement ou le lait habituel et proposez des SRO dès le début ; consultez dès plusieurs selles liquides en quelques heures.
- **Proposez une alimentation légère** (riz, carottes cuites, banane, compote) sans forcer, et réintroduisez progressivement les aliments habituels.
- **Évitez les sodas et boissons très sucrées** pour réhydrater un enfant.
- **Ne donnez pas de médicament contre la diarrhée ou les vomissements** à un enfant sans avis médical.

**Protéger le reste de la famille**
- La personne malade évite de cuisiner pour les autres tant qu'elle a des symptômes.
- Renforcez le lavage des mains, le nettoyage des surfaces et des toilettes.
- Gardez si possible les restes de l'aliment suspect et son emballage (numéro de lot) au réfrigérateur, isolés, pour le médecin ou les autorités.

## Questions fréquentes
**Comment distinguer intoxication alimentaire et gastro-entérite virale ?** Les symptômes se ressemblent. Le fait que plusieurs personnes soient malades après le même repas oriente vers une origine alimentaire ; seul le médecin peut faire la part des choses, parfois avec une analyse de selles.

**Je suis enceinte et j'ai de la fièvre après avoir mangé un aliment à risque : que faire ?** Consultez rapidement votre médecin ou votre sage-femme et signalez l'aliment consommé, même si les symptômes sont légers. Une fièvre pendant la grossesse doit toujours faire consulter.

**Les champignons cueillis peuvent-ils provoquer une intoxication ?** Oui, et elle peut être grave : appelez un centre antipoison et signalez cette consommation.

**Quand une personne malade peut-elle de nouveau cuisiner pour la famille ?** L'ARS recommande d'éviter de préparer des repas pour les autres tant que les symptômes persistent, car certains germes sont contagieux. Ensuite, un lavage des mains soigneux reste essentiel.

## Quand demander conseil
Consultez rapidement un médecin pour un nourrisson de moins de 2 ans qui a plusieurs selles liquides, pour une femme enceinte, ou si la diarrhée dure plus de deux jours, s'aggrave, s'accompagne de fièvre élevée, de glaires ou de sang. Appelez le 15 ou le 112 si l'enfant refuse de boire et vomit tout, s'il est anormalement somnolent ou agité, difficile à réveiller, pâle avec les yeux cernés, respire vite, ou en cas de troubles de la vue, de difficultés à avaler ou à respirer. Pour les champignons ou un produit toxique avalé, contactez aussi un centre antipoison.

${END}`,
    category: 'securite',
    tags: ['intoxication alimentaire', 'toxi-infection', 'tiac', 'vomissements', 'diarrhée', 'déshydratation', 'listeria'],
    safety_critical: true,
    sources: [S.ars, S.ameliGastro],
  },
  {
    journeys: ['pregnant', 'child'],
    status: 'to_review',
    slug: 'champignons-cueillette-famille-intoxication',
    title: 'Cueillette de champignons en famille : prévenir les intoxications',
    summary: 'Les règles de l’Anses pour cueillir, vérifier, conserver et cuire les champignons, pourquoi ne jamais en donner aux jeunes enfants et que faire en cas de symptômes.',
    body_md: `Ramasser des champignons en forêt avec les enfants est une belle sortie d'automne. Mais chaque année, des intoxications parfois graves surviennent après une confusion entre une espèce comestible et une espèce toxique.

## En bref
- Selon l'Anses, plus de 1 000 intoxications liées à des champignons cueillis ont été recensées en 2021.
- Ne ramassez que les champignons que vous connaissez parfaitement, et faites vérifier la récolte en cas de doute par un pharmacien ou une association de mycologie.
- Ne donnez jamais de champignons cueillis aux jeunes enfants ; les femmes enceintes doivent aussi les éviter.
- Ne vous fiez pas aux applications de reconnaissance sur smartphone.
- En cas de symptômes après un repas de champignons, appelez immédiatement un centre antipoison en signalant cette consommation.

## Comprendre
Les intoxications peuvent venir de la confusion avec une espèce toxique, mais aussi de champignons comestibles abîmés, mal conservés ou mal cuits. Les symptômes sont surtout digestifs (douleurs abdominales, nausées, vomissements, diarrhée), parfois accompagnés de tremblements, de vertiges ou de troubles de la vue. Ils peuvent apparaître quelques heures après le repas, ou plus de 12 heures plus tard. Les complications peuvent être graves : atteinte des reins, atteinte du foie pouvant nécessiter une greffe ; certaines intoxications sont mortelles.

Les recommandations de l'Anses, relayées par Santé.fr, précisent de ne jamais donner de champignons cueillis aux jeunes enfants et de les éviter chez les femmes enceintes et les personnes âgées.

## Au quotidien
**Avant la cueillette**
- Prenez un panier en osier, une caisse ou un carton, pas un sac plastique qui accélère la décomposition, et assez grand pour séparer les espèces.
- Évitez les lieux pollués : bords de route, zones industrielles, décharges, pâturages.

**Pendant la cueillette avec les enfants**
- Expliquez-leur qu'on ne goûte jamais un champignon cru ni une baie trouvée en forêt, et qu'on se lave les mains après avoir touché la récolte.
- Ne cueillez que des spécimens entiers (pied et chapeau) et en bon état ; évitez les très jeunes et les trop vieux.
- Souvenez-vous que des champignons toxiques peuvent pousser à l'endroit où vous aviez cueilli des comestibles une autre année.

**Après la cueillette**
- Faites vérifier la récolte au moindre doute, avant toute consommation.
- Photographiez votre cueillette avant la cuisson : en cas d'intoxication, la photo aide les médecins.
- Conservez les champignons au réfrigérateur, à l'écart des autres aliments, et consommez-les dans les deux jours.
- Ne les mangez jamais crus. Cuisez chaque espèce séparément et suffisamment : 20 à 30 minutes à la poêle, ou 15 minutes dans l'eau bouillante en jetant l'eau de cuisson.
- N'achetez pas de champignons vendus par des personnes qui ne sont pas des professionnels.

## Questions fréquentes
**À partir de quel âge un enfant peut-il manger des champignons cueillis ?** Les recommandations demandent de ne jamais en donner aux jeunes enfants, sans fixer d'âge précis. Demandez conseil au médecin pour un enfant plus grand.

**Une application peut-elle identifier un champignon ?** Non : le risque d'erreur est élevé. Seul un pharmacien ou une association de mycologie peut confirmer une identification.

**Mon enfant a mis un champignon cru dans la bouche : que faire ?** Retirez ce qui reste dans sa bouche, gardez le champignon ou une photo, et appelez un centre antipoison pour savoir quoi faire. En cas de malaise, de vomissements ou de somnolence, appelez le 15.

**Des symptômes le lendemain peuvent-ils venir des champignons ?** Oui : ils peuvent apparaître plus de 12 heures après le repas. Un délai long ne doit pas rassurer ; tout symptôme après un repas de champignons cueillis justifie un appel au centre antipoison.

## Quand demander conseil
Au moindre symptôme après un repas de champignons cueillis, appelez immédiatement un centre antipoison en précisant ce qui a été mangé et quand. En cas de vomissements importants, de malaise, de troubles de la conscience, de difficulté à respirer ou de symptômes chez un enfant ou une femme enceinte, appelez le 15 ou le 112.

${END}`,
    category: 'securite',
    tags: ['champignons', 'cueillette', 'intoxication', 'centre antipoison', 'forêt', 'automne', 'mycologie'],
    safety_critical: true,
    sources: [S.champignons, S.ars],
  },
  {
    journeys: ['pregnant', 'newborn', 'child'],
    status: 'to_review',
    slug: 'eau-robinet-ou-bouteille-famille-biberon',
    title: 'Eau du robinet ou eau en bouteille : bien choisir pour la famille et les biberons',
    summary: 'Qualité de l’eau du robinet, bons gestes au quotidien, eau embouteillée adaptée aux nourrissons : comment lire l’étiquette et choisir.',
    body_md: `L'eau est la seule boisson indispensable, pour les adultes comme pour les enfants. Mais quand un bébé arrive, beaucoup de parents se demandent s'ils peuvent continuer à boire et à utiliser l'eau du robinet, et comment choisir une eau en bouteille.

## En bref
- En France, l'eau du robinet est très contrôlée par les Agences régionales de santé et convient à toute la famille, sauf exception signalée localement.
- Après avoir vérifié sa potabilité, elle peut servir à préparer les biberons, en respectant quelques précautions.
- N'utilisez pas d'eau filtrée en carafe ni d'eau adoucie pour les biberons.
- Une eau en bouteille pour biberon doit porter la mention indiquant qu'elle convient à la préparation des aliments des nourrissons.
- Une bouteille ouverte se garde au réfrigérateur, fermée, et s'utilise dans les 24 heures.

## Comprendre
Santé publique France rappelle que l'eau du robinet est l'aliment le plus contrôlé en France : elle doit respecter une soixantaine de paramètres de qualité, contrôlés par les ARS de la production jusqu'au robinet. Elle apporte des minéraux comme le calcium et le magnésium, elle est économique et ne produit pas de déchet plastique. Il est très rare qu'elle ne soit pas consommable. La brochure des 1000 premiers jours indique qu'elle convient aux jeunes enfants, sauf exception signalée par la mairie, et qu'elle peut être proposée au verre ou à la tasse dès 6 mois.

Pour les biberons, quelques conditions s'ajoutent. Il faut utiliser uniquement l'eau froide, car l'eau chaude des canalisations peut contenir plus de métaux et favoriser les bactéries ; laisser couler l'eau quelques secondes, et jusqu'à 2 minutes après plusieurs jours d'absence ; entretenir et détartrer régulièrement le robinet. Dans les logements construits avant 1948, les canalisations peuvent contenir du plomb : il faut alors laisser couler l'eau au moins 3 minutes, et en cas de doute préférer une eau embouteillée adaptée. Les carafes filtrantes et adoucisseurs sont déconseillés pour les biberons, car ils peuvent favoriser la prolifération de bactéries.

Si vous choisissez l'eau en bouteille pour le biberon, elle doit porter la mention indiquant qu'elle convient à la préparation des aliments pour nourrissons et être faiblement minéralisée. L'eau gazeuse ne convient pas.

## Au quotidien
- **Vérifiez la qualité de votre eau** : résultats du contrôle sanitaire affichés en mairie ou disponibles sur le site de l'ARS, carte interactive du ministère de la Santé, note annuelle jointe à la facture d'eau, ou auprès du syndic en copropriété.
- **Mettez une carafe d'eau sur la table** à chaque repas, y compris les jours de fête : c'est la boisson de référence pour toute la famille.
- **En cas de goût de chlore**, laissez l'eau quelques heures dans une carafe ouverte au réfrigérateur.
- **Pour le biberon**, ne laissez pas le goulot toucher le robinet et suivez les règles de préparation données par le professionnel qui suit votre bébé.
- **Au rayon**, lisez l'étiquette de l'eau embouteillée : mention « nourrissons », eau plate, minéralisation faible.
- **Pour une bouteille entamée**, rebouchez-la, rangez-la au réfrigérateur et utilisez-la dans les 24 heures.
- **Évitez les eaux aromatisées** en bouteille, souvent sucrées.

## Questions fréquentes
**L'eau de source est-elle toujours adaptée aux biberons ?** Pas forcément : sa composition peut varier, et certaines eaux de source issues de plusieurs captages ne conviennent pas. Fiez-vous à la mention « nourrissons » sur l'étiquette.

**Faut-il faire bouillir l'eau du robinet ?** Les sources consultées ne le demandent pas lorsque l'eau est potable. En voyage, en l'absence d'eau potable ou d'eau embouteillée adaptée, l'eau peut être bouillie puis refroidie.

**Et l'eau de puits ou de pluie ?** L'eau de puits n'est pas surveillée et l'eau de pluie n'est pas potable : ne les utilisez pas pour boire ni pour les biberons.

**Pendant la grossesse, faut-il boire de l'eau en bouteille ?** L'eau du robinet potable convient. Buvez dès que vous avez soif, davantage par forte chaleur.

## Quand demander conseil
Si votre mairie signale une eau non conforme, si vous habitez un logement ancien et doutez de vos canalisations, ou si vous ne savez pas quelle eau utiliser pour le biberon, demandez conseil au pharmacien, à la PMI ou au médecin. En cas de diarrhée ou de vomissements chez un nourrisson, consultez rapidement ; s'il est somnolent, refuse de boire ou respire vite, appelez le 15 ou le 112.

${END}`,
    category: 'alimentation',
    tags: ['eau du robinet', 'eau en bouteille', 'eau biberon', 'eau nourrisson', 'plomb', 'carafe filtrante', 'potabilité'],
    sources: [S.eau, S.eauBib, S.diversif],
  },
];
