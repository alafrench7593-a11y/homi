/** Guide complet — lot 05 (27/10/2026) : alimentation équilibrée de l'enfant de 3 à 10 ans. Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page, quand elle est précise.
const S = {
  ameliRepas: { label: 'ameli.fr — Des repas équilibrés bien répartis dans la journée de l’enfant (3 à 18 ans)', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-de-l-enfant-et-de-l-adolescent-de-3-18-ans/repas-equilibres-fil-journee', consulted_on: C, published: '2024-06-27' },
  ameliAliments: { label: 'ameli.fr — Aliments à consommer chaque jour par un enfant (3 à 18 ans)', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-de-l-enfant-et-de-l-adolescent-de-3-18-ans/aliments-consommer-quotidien', consulted_on: C, published: '2025-03-27' },
  ameliSurpoids: { label: 'ameli.fr — Prévenir le surpoids et l’obésité de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/surpoids-obesite-enfant-adolescent/prevention', consulted_on: C },
  ameliSuivi: { label: 'ameli.fr — 4 examens de suivi médical entre les 4 ans et 10 ans de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/suivi-medical-entre-4-et-10-ans', consulted_on: C, published: '2026-02-18' },
  spf411: { label: 'Santé publique France — Alimentation des enfants de 4 à 11 ans : une campagne d’information pour guider les parents', url: 'https://www.santepubliquefrance.fr/index.php/presse/alimentation-des-enfants-de-4-a-11-ans-une-campagne-dinformation-pour-guider-les-parents', consulted_on: C, published: '2024-09-10' },
  spfShu: { label: 'Santé publique France — Syndrome hémolytique et urémique pédiatrique : les mesures de prévention', url: 'https://www.santepubliquefrance.fr/les-actualites/2022/syndrome-hemolytique-et-uremique-pediatrique-les-mesures-de-prevention-face-aux-risques-de-l-ete', consulted_on: C, published: '2022-07-19' },
  santeGouts: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Comment développer les goûts de votre enfant et son plaisir à manger ?', url: 'https://www.sante.fr/node/8364303', consulted_on: C, published: '2024-06-11' },
  santeFL: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Fruits et légumes : au moins 5 par jour', url: 'https://www.sante.fr/node/800561', consulted_on: C, published: '2023-10-11' },
  santeReduire: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Réduire les boissons sucrées, aliments gras, sucrés, salés et ultra-transformés', url: 'https://www.sante.fr/node/1869521', consulted_on: C, published: '2024-06-14' },
  santeSel: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Limiter les produits salés et le sel pour préserver sa santé', url: 'https://www.sante.fr/node/1869523', consulted_on: C, published: '2024-06-14' },
  santeReco: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Les recommandations sur l’alimentation, l’activité physique et la sédentarité', url: 'https://www.sante.fr/node/4566467', consulted_on: C, published: '2021-11-04' },
  santeLegSecs: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Augmenter les légumes secs', url: 'https://www.sante.fr/node/1869507', consulted_on: C, published: '2023-02-09' },
  santeFeculents: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Privilégier les féculents complets', url: 'https://www.sante.fr/node/1869511', consulted_on: C, published: '2024-06-14' },
  santePoisson: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Privilégier le poisson pour une alimentation saine', url: 'https://www.sante.fr/node/1869513', consulted_on: C, published: '2024-06-14' },
  santeNutriScore: { label: 'Santé.fr (Santé publique France — Manger Bouger) — Comment bien utiliser le Nutri-Score ?', url: 'https://www.sante.fr/node/19793899', consulted_on: C, published: '2025-03-24' },
  ansesEnfants: { label: 'Anses — Nutrition des enfants, des personnes âgées et des femmes enceintes ou allaitantes', url: 'https://www.anses.fr/fr/content/nutrition-des-enfants-des-personnes-agees-et-des-femmes-enceintes-ou-allaitantes-lanses', consulted_on: C, published: '2019-06-25' },
  ansesAvis: { label: 'Anses — Avis relatif à l’actualisation des repères alimentaires du PNNS pour les enfants de 4 à 17 ans', url: 'https://www.anses.fr/fr/system/files/NUT2017SA0142.pdf', consulted_on: C, published: '2019-12-23' },
  ansesHygiene: { label: 'Anses — Conseils d’hygiène dans la cuisine : dix gestes simples pour prévenir les risques microbiologiques', url: 'https://www.anses.fr/fr/content/conseils-dhygiene-dans-la-cuisine-dix-gestes-simples-pour-prevenir-les-risques', consulted_on: C, published: '2020-12-24' },
  eduCantine: { label: 'Ministère de l’Éducation nationale — La restauration scolaire', url: 'https://www.education.gouv.fr/la-restauration-scolaire-6254', consulted_on: C },
  malletteAlim: { label: 'La Mallette des parents (Éducation nationale) — La place de l’alimentation dans l’apprentissage', url: 'https://mallettedesparents.education.gouv.fr/print/pdf/node/145', consulted_on: C, published: '2020-03-16' },
  malletteDents: { label: 'La Mallette des parents (Éducation nationale) — Une bonne santé bucco-dentaire', url: 'https://mallettedesparents.education.gouv.fr/print/pdf/node/260', consulted_on: C, published: '2019-10-22' },
  cnrcVege: { label: 'Conseil national de la restauration collective (ministère de l’Agriculture) — Tout savoir sur le menu végétarien', url: 'https://draaf.normandie.agriculture.gouv.fr/IMG/pdf/20200825-Guide_composition_menu_vegetarien_4_pages_cle056da7.pdf', consulted_on: C },
} satisfies Record<string, ArticleSource>;

/** Champs communs : parcours enfant, 3 à 10 ans. */
const K: Pick<LibArticle, 'journeys' | 'status'> & { min_age_months: number; max_age_months: number } = {
  journeys: ['child'], min_age_months: 36, max_age_months: 131, status: 'to_review',
};

const FIN = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel de santé (médecin, pédiatre, diététicien·ne).';

export const GUIDE_B05: LibArticle[] = [
  {
    ...K, slug: 'petit-dejeuner-enfant-3-10-ans-composer', category: 'alimentation',
    title: 'Petit-déjeuner de l’enfant de 3 à 10 ans : comment le composer',
    summary: 'Les trois éléments d’un petit-déjeuner équilibré, des idées variées pour la semaine et des astuces pour les matins pressés.',
    tags: ['petit-déjeuner', 'petit déjeuner enfant', 'céréales', 'tartines', 'matin', 'école', 'équilibre alimentaire'],
    sources: [S.ameliRepas, S.malletteAlim, S.santeFeculents],
    body_md: `## En bref
- Le petit-déjeuner apporte l’énergie nécessaire pour la matinée et aide l’enfant à se concentrer en classe.
- Un repère simple : **un produit céréalier** (de préférence complet et peu sucré), **un produit laitier** et **un fruit**, avec de l’eau si l’enfant a soif.
- Les céréales du petit-déjeuner très sucrées, les viennoiseries et les pâtes à tartiner gagnent à rester occasionnelles.
- Le prendre ensemble, même rapidement, en fait un moment agréable plutôt qu’une corvée.

## Comprendre
L’Assurance Maladie rappelle que le petit-déjeuner, pris chaque matin, fournit l’énergie dont l’enfant a besoin jusqu’au déjeuner. La Mallette des parents du ministère de l’Éducation nationale souligne qu’il aide l’enfant à se concentrer et à apprendre, et qu’il peut aussi être un moment convivial partagé en famille.

Le petit-déjeuner « type » associe trois familles d’aliments :
- **Un produit céréalier** : pain (complet, aux céréales ou semi-complet), flocons d’avoine, ou céréales du petit-déjeuner à condition qu’elles soient complètes et peu sucrées. Santé publique France recommande au moins un féculent complet par jour : le matin est un bon moment pour le placer.
- **Un produit laitier** : un verre de lait, un yaourt nature, du fromage blanc ou un morceau de fromage.
- **Un fruit** : entier, coupé en morceaux ou en compote sans sucre ajouté. Un jus de fruits ne remplace pas le fruit entier.

L’eau reste la boisson de référence. Les boissons sucrées et les jus n’ont pas besoin de faire partie du petit-déjeuner quotidien.

## Au quotidien
**Des idées pour varier sur la semaine** (à adapter à l’appétit de votre enfant) :
- tartines de pain complet avec un peu de beurre, un verre de lait et une clémentine ;
- bol de flocons d’avoine avec du lait et des morceaux de pomme ;
- fromage blanc nature avec une banane écrasée et une tranche de pain ;
- pain aux céréales avec un morceau de fromage et une poire ;
- yaourt nature, compote sans sucre ajouté et une petite tartine de confiture.

**Les matins pressés**
- Préparez la table ou le plateau la veille au soir : bols, pain tranché, fruits lavés.
- Levez-vous quelques minutes plus tôt si c’est possible, pour éviter de manger debout en courant.
- Si l’enfant prend le bus très tôt, la Mallette des parents suggère une boisson ou un produit laitier à la maison, complétés par une petite collation (fruit, pain, fromage) avant le début des cours.

**Lire les étiquettes des céréales** : comparez les produits d’un même rayon avec le Nutri-Score et préférez ceux qui sont complets et les moins sucrés. Les céréales présentées « pour enfants » sont souvent parmi les plus sucrées.

**Rendre l’enfant acteur** : à partir de 4 ou 5 ans, il peut choisir entre deux fruits, verser son lait, étaler sa tartine. Ces petites responsabilités donnent envie de manger.

## Questions fréquentes
**Les céréales du petit-déjeuner sont-elles un bon choix ?**
Elles peuvent l’être si elles sont complètes et peu sucrées. Selon l’Assurance Maladie, les céréales du petit-déjeuner ne comptent comme produit céréalier intéressant que dans ce cas ; les versions fourrées, chocolatées ou très sucrées sont à réserver aux occasions.

**Peut-on donner du pain blanc ?**
Oui, mais varier avec du pain complet, aux céréales ou semi-complet apporte davantage de fibres. Si votre enfant n’aime pas le goût du complet, commencez par du semi-complet.

**Mon enfant veut toujours la même chose le matin…**
Ce n’est pas un problème si le petit-déjeuner reste varié sur l’ensemble de ses composantes. Vous pouvez faire tourner les fruits et les produits laitiers tout en gardant la tartine qu’il aime.

**Faut-il ajouter un jus de fruits ?**
Ce n’est pas nécessaire. Avant 11 ans, Santé publique France conseille de ne pas dépasser un demi-verre de jus par jour, et le fruit entier reste préférable.

## Quand demander conseil
Parlez-en au médecin de votre enfant s’il est souvent fatigué le matin, s’il se plaint régulièrement de maux de ventre au réveil, si son appétit change nettement ou si sa courbe de croissance vous inquiète. Les examens de suivi prévus à 4, 5, 6 ans et entre 8 et 9 ans sont aussi l’occasion d’en parler. En cas de malaise, de gêne respiratoire ou de gonflement du visage après un aliment, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'enfant-pas-faim-le-matin-que-faire', category: 'alimentation',
    title: 'Mon enfant n’a pas faim le matin : que faire ?',
    summary: 'Comprendre pourquoi certains enfants ne mangent pas au réveil et trouver des solutions douces, sans forcer.',
    tags: ['petit-déjeuner', 'pas faim le matin', 'ne mange pas le matin', 'appétit', 'collation', 'école'],
    sources: [S.ameliRepas, S.malletteAlim, S.ansesAvis],
    body_md: `## En bref
- Beaucoup d’enfants ont peu d’appétit au réveil : le forcer crée surtout des tensions.
- Un petit-déjeuner peut être léger : un produit laitier, un fruit, un morceau de pain suffisent pour commencer.
- Le rythme de la soirée (dîner tardif, grignotage, coucher tardif) joue souvent sur l’appétit du matin.
- Une collation simple emportée pour plus tard peut dépanner si l’enfant part très tôt.

## Comprendre
L’Assurance Maladie recommande de prendre un petit-déjeuner chaque matin pour avoir de l’énergie pendant la matinée. Elle insiste aussi sur l’importance d’**écouter la faim et la satiété** de l’enfant et de ne pas l’obliger à finir son assiette. Ces deux messages ne s’opposent pas : il s’agit d’offrir un petit-déjeuner adapté, sans en faire un bras de fer.

Plusieurs raisons peuvent expliquer un manque d’appétit au réveil :
- un **dîner copieux ou tardif**, ou des grignotages dans la soirée ;
- un **réveil précipité** : l’appétit met parfois un peu de temps à venir ;
- un **sommeil insuffisant**, l’Assurance Maladie rappelant de respecter le rythme de sommeil de l’enfant ;
- une **appréhension** (contrôle, dispute, changement d’école) qui « noue » le ventre.

La Mallette des parents rappelle que l’équilibre alimentaire se construit sur plusieurs repas : un petit-déjeuner plus léger un jour n’est pas un échec.

## Au quotidien
**Ajuster la soirée**
- Gardez un dîner à heure régulière, ni trop tard ni trop copieux.
- Évitez le grignotage après le dîner, devant un écran notamment.
- Préservez un coucher régulier, pour un réveil moins difficile.

**Ajuster le matin**
- Réveillez votre enfant un peu plus tôt pour laisser à l’appétit le temps de venir : s’habiller d’abord, manger ensuite fonctionne pour certains enfants.
- Proposez de petites quantités : un verre de lait ou un yaourt nature, quelques morceaux de fruit et une demi-tartine peuvent suffire.
- Asseyez-vous avec lui, même si vous ne mangez pas : manger seul à la va-vite donne moins envie.
- Laissez-le choisir entre deux options (fromage blanc ou lait, pomme ou banane).

**Emporter quelque chose**
Si votre enfant part tôt (bus scolaire, garderie), la Mallette des parents propose une boisson ou un produit laitier à la maison, puis une petite collation (fruit, pain, fromage) à prendre avant les cours. Dans l’enseignement élémentaire, aucune collation n’est organisée par l’école : renseignez-vous auprès de l’enseignant ou de l’accueil périscolaire sur ce qui est possible.

**Éviter les fausses bonnes idées**
Les biscuits, viennoiseries et barres chocolatées dans le cartable sont riches en sucres et peu rassasiants. L’Anses recommande de privilégier les fruits frais, les produits laitiers nature, le pain et les fruits à coque (adaptés à l’âge) pour les collations, qui ne devraient répondre qu’à une vraie faim.

## Questions fréquentes
**Faut-il le forcer à manger avant l’école ?**
Non. Forcer risque d’associer le repas à une contrainte. Proposez, sans insister, et laissez-lui la possibilité d’emporter quelque chose.

**Il mange énormément au goûter et au dîner : est-ce lié ?**
C’est possible : un goûter très copieux ou tardif réduit la faim du dîner, puis du lendemain matin. Un goûter d’un ou deux aliments, pas trop près du dîner, aide à retrouver un rythme.

**Une boisson chocolatée suffit-elle ?**
Un lait (chocolaté ou non) apporte un produit laitier. Si vous ajoutez du cacao sucré, dosez-le légèrement et complétez, si l’enfant le peut, avec un fruit ou un peu de pain.

**Est-ce grave s’il ne mange rien certains matins ?**
Ponctuellement, l’équilibre se rattrape sur la journée. Si cela devient systématique et s’accompagne de fatigue ou de difficultés en classe, parlez-en au médecin.

## Quand demander conseil
Consultez le médecin si l’absence d’appétit est nouvelle et persistante, si elle s’accompagne d’une perte de poids, de maux de ventre fréquents, de nausées, d’une grande fatigue ou de changements d’humeur. Si vous percevez chez votre enfant une angoisse importante liée à l’école, parlez-en aussi à l’enseignant ou au médecin scolaire. Si vous-même vous sentez épuisé ou en détresse, le **3114** répond jour et nuit. En urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'gouter-enfant-3-10-ans-idees-equilibrees', category: 'alimentation',
    title: 'Le goûter de l’enfant : repères et idées équilibrées',
    summary: 'Ce que contient un bon goûter, ce qui reste occasionnel et des idées concrètes pour la semaine, à la maison comme à la sortie de l’école.',
    tags: ['goûter', 'quatre heures', 'collation', 'idées goûter', 'biscuits', 'sucre', 'sortie d’école'],
    sources: [S.ameliRepas, S.spf411, S.ansesEnfants],
    body_md: `## En bref
- **Un seul goûter** par jour, composé d’**un ou deux aliments** et d’une boisson (eau ou lait).
- Les bons choix : fruits, produits laitiers, pain ou produits céréaliers complets, fruits à coque adaptés à l’âge, voire légumes.
- Viennoiseries, gâteaux, biscuits, chips et pâtes à tartiner restent **peu fréquents**.
- Le goûter se prend **pas trop près du dîner**.

## Comprendre
Le goûter est le quatrième moment alimentaire de la journée de l’enfant. Selon l’Assurance Maladie, il comprend un ou deux aliments choisis parmi les fruits, les fruits à coque, les légumes, les laitages et les produits céréaliers complets, accompagnés d’eau ou de lait.

L’Anses a souligné que le goûter contribue fortement aux apports excessifs en sucres chez les enfants : boissons sucrées, pâtisseries, biscuits et gâteaux y sont fréquents alors qu’ils sont riches en sucres et peu intéressants sur le plan nutritionnel. Elle recommande de les remplacer par des produits laitiers sans sucres ajoutés, des fruits frais et des fruits à coque.

Santé publique France, dans ses repères pour les 4-11 ans, propose par exemple du pain avec un peu de chocolat, de beurre ou de confiture, un fruit, une compote ou un produit laitier, et recommande d’éviter surtout les biscuits notés **E** au Nutri-Score.

## Au quotidien
**Des idées de goûters simples**
- un morceau de pain et deux carrés de chocolat, avec un verre d’eau ;
- un yaourt nature et une pomme ;
- une tartine de pain complet avec un peu de beurre et une clémentine ;
- du fromage blanc et une compote sans sucre ajouté ;
- un morceau de fromage, du pain et quelques bâtonnets de concombre ;
- un verre de lait et une banane ;
- pour un enfant de plus de 6 ans, quelques amandes ou noisettes entières et un fruit (avant cet âge, préférez-les en poudre ou dans une préparation, en raison du risque d’étouffement).

**À la sortie de l’école**
Préparez le goûter à l’avance dans une petite boîte : fruit entier, pain, fromage à pâte dure, compote en gourde sans sucre ajouté. Les produits frais comme les yaourts supportent mal plusieurs heures hors du réfrigérateur : l’Anses conseille de ne pas laisser un aliment plus de 2 heures à température ambiante.

**Gérer les envies de gâteaux**
Les gâteaux et biscuits ne sont pas interdits : gardez-les pour certains jours (le week-end, un anniversaire) plutôt que d’en faire une habitude quotidienne. Un gâteau fait maison permet de maîtriser la quantité de sucre et de matières grasses.

**Bien choisir en magasin**
Comparez les biscuits et barres d’un même rayon grâce au Nutri-Score et préférez les meilleures notes. Méfiez-vous des emballages « spécial enfant », qui ne garantissent pas une meilleure composition.

## Questions fréquentes
**Mon enfant a très faim à 16 h 30, puis ne dîne pas…**
Proposez un goûter rassasiant mais modeste (pain et fromage, par exemple) et évitez de le servir trop tard. Si le dîner est très tardif, un goûter un peu plus consistant peut se justifier, à ajuster selon son appétit du soir.

**Le jus de fruits est-il une bonne boisson pour le goûter ?**
L’eau ou le lait sont préférables. Avant 11 ans, Santé publique France conseille de ne pas dépasser un demi-verre de jus par jour, et un jus ne compte pas comme une portion de fruits.

**Faut-il un goûter le week-end ou pendant les vacances ?**
Oui, le rythme de quatre repas par jour reste le même. Le goûter peut être l’occasion de préparer quelque chose ensemble.

**Et s’il goûte chez des amis ou à l’accueil périscolaire ?**
Vous ne pouvez pas tout maîtriser, et ce n’est pas nécessaire : l’équilibre se juge sur plusieurs jours. Vous pouvez compenser au dîner avec des légumes et un fruit.

## Quand demander conseil
Parlez-en au médecin si votre enfant réclame à manger en permanence, s’il ne mange presque rien d’autre que des produits sucrés, si sa courbe de poids s’emballe ou au contraire stagne, ou s’il a souvent mal au ventre après le goûter. En cas de gêne respiratoire, de gonflement des lèvres ou du visage ou de malaise après un aliment, appelez immédiatement le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'gouter-pique-nique-enfant-a-emporter-hygiene', category: 'alimentation',
    title: 'Goûter, pique-nique et boîte repas de l’enfant : bien préparer et bien conserver',
    summary: 'Composer un goûter ou un pique-nique équilibré à emporter et respecter les règles d’hygiène pour éviter les intoxications.',
    tags: ['pique-nique', 'boîte repas', 'goûter à emporter', 'sortie scolaire', 'hygiène', 'conservation', 'glacière'],
    sources: [S.ansesHygiene, S.ameliRepas, S.spfShu],
    body_md: `## En bref
- Un pique-nique se compose comme un repas : féculent, légumes ou fruit, source de protéines, produit laitier, et de l’eau.
- Les aliments périssables ne devraient pas rester **plus de 2 heures à température ambiante** : prévoyez un sac isotherme avec un bloc réfrigérant.
- Lavez-vous les mains avant de préparer, lavez soigneusement fruits et légumes crus, séparez le cru du cuit.
- Les aliments non consommés et restés au chaud ne se gardent pas pour le lendemain.

## Comprendre
L’Anses rappelle qu’en France, environ un tiers des toxi-infections alimentaires déclarées surviennent au domicile, souvent à cause de gestes simples oubliés. Pour un repas emporté (sortie scolaire, centre de loisirs, journée au parc), le risque principal vient du temps passé hors du réfrigérateur : l’Anses recommande de ne pas laisser les aliments plus de 2 heures à température ambiante, et de maintenir le réfrigérateur à 4 °C dans sa zone la plus froide.

Santé publique France, dans ses conseils de prévention du syndrome hémolytique et urémique chez l’enfant, insiste sur le lavage des mains, le lavage soigneux des légumes, fruits et herbes mangés crus, la séparation des aliments crus et cuits, et la mise rapide au réfrigérateur des restes.

Côté équilibre, les repères de l’Assurance Maladie s’appliquent aussi au pique-nique : un féculent, des fruits et légumes, une source de protéines (viande, poisson, œuf ou légumineuses), un produit laitier, et l’eau comme boisson.

## Au quotidien
**Idées de pique-niques équilibrés**
- sandwich de pain complet au poulet cuit et crudités, bâtonnets de carotte, morceau de fromage à pâte dure, une pomme ;
- salade de pâtes avec thon, maïs et tomates cerises (coupées en deux pour les plus jeunes), un yaourt gardé au frais, une poire ;
- œufs durs, pain, concombre, emmental, une banane ;
- salade de lentilles et riz, quelques radis, une compote en gourde sans sucre ajouté.

**Les règles de conservation**
- Préparez la veille et gardez au réfrigérateur jusqu’au départ.
- Utilisez un sac isotherme avec un bloc réfrigérant, surtout pour les produits laitiers frais, la viande, le poisson, les œufs et les salades composées.
- Une gourde d’eau congelée la veille peut servir de pain de glace et rafraîchir le sac.
- Privilégiez les aliments qui supportent mieux le transport : fruits entiers, pain, fromages à pâte dure, compotes en gourde fermée.
- Ce qui revient à la maison après plusieurs heures au chaud se jette, surtout les préparations à base de viande, de poisson, d’œufs ou de mayonnaise.

**Les gestes d’hygiène**
- Lavez-vous les mains à l’eau et au savon avant et pendant la préparation.
- Utilisez une planche pour la viande et le poisson crus, une autre pour les aliments cuits et les légumes.
- Lavez la boîte repas et la gourde chaque jour.
- Apprenez à votre enfant à se laver les mains avant de manger ; prévoyez des lingettes ou du gel si aucun point d’eau n’est disponible.

## Questions fréquentes
**Peut-on mettre du jambon ou du poulet dans un sandwich pour la journée ?**
Oui, à condition de le garder au frais avec un bloc réfrigérant et de le consommer dans la journée. Sans moyen de garder au frais, préférez des aliments moins fragiles.

**Les œufs durs sont-ils une bonne idée ?**
Oui, s’ils sont bien cuits, gardés au frais et consommés le jour même.

**Faut-il éviter la mayonnaise ?**
Les préparations à base de sauce, de viande ou d’œufs sont plus fragiles : gardez-les bien au frais, ou remplacez la sauce par un filet d’huile de colza ou d’olive.

**Comment éviter le gaspillage du goûter rapporté intact ?**
Discutez avec votre enfant de ce qu’il aime et de la taille des portions. Un fruit entier non entamé se garde ; un laitage resté longtemps au chaud, non.

## Quand demander conseil
Consultez rapidement si votre enfant présente une diarrhée, surtout si elle contient du sang, des vomissements répétés, de la fièvre ou des douleurs abdominales importantes après un repas. Santé publique France recommande de consulter immédiatement un médecin en cas de diarrhée sanglante, de grande fatigue, de pâleur ou de diminution des urines dans les jours qui suivent. En cas de signes de déshydratation, de somnolence inhabituelle ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'cantine-equilibrer-les-repas-a-la-maison', category: 'ecole-garde',
    title: 'Mon enfant mange à la cantine : comment équilibrer les autres repas ?',
    summary: 'Ce que prévoient les règles de la restauration scolaire et comment adapter le petit-déjeuner, le goûter et le dîner en conséquence.',
    tags: ['cantine', 'restauration scolaire', 'menu cantine', 'dîner', 'équilibre alimentaire', 'école'],
    sources: [S.eduCantine, S.malletteAlim, S.ameliRepas],
    body_md: `## En bref
- À l’école, le déjeuner suit des règles nutritionnelles nationales : 4 ou 5 plats, dont un plat principal avec garniture et un produit laitier.
- Les menus sont souvent affichés ou publiés en ligne : les consulter permet d’adapter le dîner.
- L’équilibre se juge sur la journée, voire sur plusieurs jours, pas sur un seul repas.
- Si votre enfant mange peu à la cantine, mieux vaut en comprendre la raison que compenser par du grignotage.

## Comprendre
Selon le ministère de l’Éducation nationale, à l’école primaire, la cantine relève de la commune (ou de l’intercommunalité). Les repas respectent des règles nutritionnelles : quatre ou cinq plats par repas, dont un plat principal avec garniture et un produit laitier, des portions adaptées, une variété minimale des plats, et des règles pour l’eau, le pain, le sel et les sauces. L’objectif est aussi de réduire les sucres ajoutés et les graisses, notamment saturées.

Le ministère donne une répartition indicative de l’énergie sur la journée : environ **20 % le matin, 40 % au déjeuner, 10 % au goûter et 30 % le soir**. Autrement dit, le déjeuner est le repas le plus important, et le dîner peut être plus léger.

La Mallette des parents rappelle que, depuis 2017, l’inscription à la cantine des écoles primaires, lorsque le service existe, est un droit pour tous les enfants scolarisés, et que des représentants de parents peuvent participer aux commissions des menus.

## Au quotidien
**Consulter le menu de la semaine**
Le menu est souvent affiché à l’école ou disponible sur le site de la commune. En un coup d’œil, vous pouvez repérer ce que votre enfant a mangé à midi.

**Adapter le dîner**
- Midi avec viande ou poisson : le soir, un plat à base d’œufs, de légumineuses ou simplement de légumes et de féculents suffit souvent.
- Midi pauvre en légumes (ou légumes peu mangés) : misez sur une soupe, une poêlée ou des crudités le soir.
- Midi avec frites ou plat pané : le soir, un repas plus simple, avec légumes, féculent complet et produit laitier.
- Pensez au fruit : en dessert ou au goûter.

**Le mercredi et les vacances**
Ces jours-là, le déjeuner se prend à la maison ou au centre de loisirs : les mêmes repères s’appliquent (féculent, légumes, une source de protéines, un produit laitier, un fruit).

**Parler de la cantine**
Demandez à votre enfant ce qu’il a aimé, sans interroger chaque bouchée. La Mallette des parents rappelle que les goûts se forment progressivement, notamment à la cantine : un aliment refusé à midi pourra être reproposé à la maison sous une autre forme.

## Questions fréquentes
**Il dit qu’il ne mange rien à la cantine…**
Échangez avec l’équipe (animateurs, personnel de service) : le temps de repas, le bruit ou la fatigue jouent souvent. Un goûter consistant et un dîner équilibré aident à compenser, sans pour autant multiplier les collations.

**Faut-il éviter de servir le même plat le soir ?**
Ce n’est pas interdit, mais varier permet de diversifier les apports et le plaisir.

**Que faire si mon enfant a une allergie ?**
Un projet d’accueil individualisé (PAI) peut être mis en place avec l’école et le médecin. Selon le ministère, il peut prévoir un plat de substitution ou un panier repas fourni par la famille, sous sa responsabilité et en respectant la chaîne du froid.

**La cantine coûte cher : existe-t-il des aides ?**
Le tarif en primaire est fixé par la commune, souvent selon le quotient familial. Renseignez-vous auprès de la mairie ou de la caisse des écoles ; les familles en difficulté peuvent aussi solliciter l’assistante sociale.

## Quand demander conseil
Parlez-en au médecin si votre enfant mange très peu de façon durable, perd du poids, se plaint souvent de maux de ventre ou semble anxieux à l’idée d’aller à la cantine. Si un enfant allergique présente une gêne respiratoire, un gonflement du visage ou un malaise après un repas, appelez immédiatement le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'menu-vegetarien-cantine-et-maison-enfant', category: 'alimentation',
    title: 'Repas végétarien à la cantine et à la maison : les repères pour l’enfant',
    summary: 'Ce qu’est un menu végétarien en restauration scolaire, comment l’équilibrer et des idées de repas sans viande ni poisson à la maison.',
    tags: ['menu végétarien', 'végétarien', 'cantine', 'légumes secs', 'protéines végétales', 'EGalim', 'sans viande'],
    sources: [S.cnrcVege, S.santeLegSecs, S.ameliAliments],
    body_md: `## En bref
- Un menu végétarien ne contient ni viande, ni poisson, ni crustacés ou mollusques ; il peut contenir des œufs et des produits laitiers.
- La loi EGalim a introduit dans les cantines au moins un menu végétarien par semaine.
- Associer légumes secs et féculents (lentilles et riz, pois chiches et semoule) permet de remplacer la viande dans un repas.
- Viande, poisson et œufs ne sont pas nécessaires à chaque repas : l’équilibre se fait sur la semaine.

## Comprendre
Selon le guide du Conseil national de la restauration collective (CNRC), un menu végétarien ne comprend ni viande ni poisson, ni crustacés ni mollusques, que ce soit dans l’entrée, le plat, la garniture, la sauce ou le dessert. Il peut en revanche contenir des œufs ou des produits laitiers. La loi EGalim a prévu, d’abord à titre expérimental, au moins un menu végétarien par semaine dans la restauration scolaire, du primaire au lycée.

Pour que ce repas soit équilibré, le CNRC recommande de privilégier les plats faits maison et les produits bruts, de proposer des légumes secs, et de limiter les produits ultra-transformés ainsi que la répétition des plats à base de fromage ou d’œufs.

L’Assurance Maladie rappelle de son côté qu’il n’est pas nécessaire de manger de la viande, du poisson ou des œufs à chaque repas : les **légumineuses** (lentilles, pois chiches, haricots), à proposer au moins deux fois par semaine, sont une bonne alternative. Santé publique France précise qu’associés à des féculents complets ou semi-complets, les légumes secs peuvent remplacer la viande.

## Au quotidien
**Des idées de repas végétariens pour la famille**
- dhal de lentilles corail et riz, avec des carottes ;
- curry doux de pois chiches et semoule complète ;
- chili de haricots rouges et maïs, avec un peu de riz ;
- omelette aux légumes, pommes de terre et salade ;
- gratin de pâtes complètes aux légumes et un peu de fromage ;
- soupe épaisse de pois cassés avec du pain.

**Les associations gagnantes**
Pois chiches et semoule, lentilles et riz, haricots rouges et maïs : ces associations classiques combinent légumes secs et céréales.

**Le faire accepter**
- Partez des plats que votre enfant aime déjà (pâtes, galettes, gratins) et ajoutez-y des légumes secs.
- Mixez une partie des lentilles dans une sauce tomate ou une soupe.
- Proposez des galettes ou des beignets de pois chiches à manger avec les doigts.

**Le jour du menu végétarien à la cantine**
Le soir, vous pouvez servir un plat avec de la viande, du poisson ou des œufs, ou un autre repas végétarien : il n’y a pas d’obligation, l’important est la variété sur la semaine.

## Questions fréquentes
**Un repas végétarien apporte-t-il assez de protéines à un enfant ?**
Un repas qui associe légumes secs, féculents et produit laitier, ou qui contient des œufs, apporte des protéines. C’est l’équilibre de l’ensemble de la semaine qui compte.

**Peut-on remplacer la viande par du fromage à chaque fois ?**
Mieux vaut varier : le CNRC conseille de ne pas multiplier les plats à base de fromage ou d’œufs, et de donner une vraie place aux légumes secs.

**Les produits végétaux transformés (steaks végétaux, nuggets végétaux) sont-ils une bonne solution ?**
Ils peuvent dépanner, mais ils sont souvent ultra-transformés : comparez-les avec le Nutri-Score et lisez la liste des ingrédients. Les légumes secs simples restent la base.

**Et si notre famille souhaite un régime entièrement végétarien pour l’enfant ?**
Parlez-en avec le médecin ou un·e diététicien·ne, qui vous aidera à couvrir tous les besoins de croissance, notamment en fer, en calcium et en vitamines.

## Quand demander conseil
Consultez le médecin si votre enfant semble fatigué, pâle, s’il mange très peu de variété, si son poids ou sa taille stagnent, ou si vous envisagez d’exclure durablement des groupes d’aliments (viande et poisson, produits laitiers, œufs). Les ballonnements peuvent survenir quand on augmente trop vite les fibres : allez-y progressivement et faites boire de l’eau. En cas de malaise ou de difficulté à respirer après un repas, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'sucre-enfant-limiter-sans-interdire', category: 'alimentation',
    title: 'Sucre et enfant : limiter sans interdire',
    summary: 'Où se cache le sucre dans l’alimentation des enfants, pourquoi le limiter et comment faire au quotidien sans frustration.',
    tags: ['sucre', 'bonbons', 'sucreries', 'gâteaux', 'desserts', 'caries', 'surpoids', 'sucres ajoutés'],
    sources: [S.santeReduire, S.ansesEnfants, S.malletteDents],
    body_md: `## En bref
- L’Anses a constaté des apports en sucres **excessifs** chez les enfants, surtout les plus jeunes.
- Le sucre en excès favorise la prise de poids et les caries.
- Le goûter, les boissons sucrées, les biscuits, les céréales du petit-déjeuner et les desserts lactés sucrés sont les principales sources.
- L’objectif n’est pas d’interdire, mais de réserver les produits sucrés à certains moments et de cuisiner davantage maison.

## Comprendre
Santé publique France recommande, chez l’enfant, d’introduire les produits sucrés le plus tard possible et en quantité limitée, car leur excès favorise la prise de poids et peut provoquer des caries. L’Anses a alerté sur les apports excessifs en sucres chez les enfants et a demandé une action rapide pour les réduire, notamment en diminuant les sucres ajoutés dans les produits transformés.

Le sucre n’est pas seulement dans les bonbons. On en trouve beaucoup dans :
- les **boissons sucrées** : sodas, sirops, boissons aux fruits, nectars, et même les jus de fruits ;
- les **céréales du petit-déjeuner**, surtout celles destinées aux enfants ;
- les **biscuits, gâteaux, viennoiseries** et pâtes à tartiner ;
- les **desserts lactés** (crèmes dessert, yaourts aromatisés ou aux fruits), les glaces ;
- certains plats préparés et sauces.

Les sucres naturellement présents dans les fruits frais entiers ne sont pas concernés par ces messages : l’Anses présente les fruits frais comme la source de sucres la plus intéressante.

La Mallette des parents rappelle que les aliments et boissons sucrés, y compris « light », nourrissent les bactéries responsables des caries, d’où l’intérêt d’éviter le grignotage et de ne proposer que de l’eau la nuit.

## Au quotidien
**Remplacer plutôt qu’interdire**
- Yaourt nature avec un fruit écrasé à la place d’un yaourt aromatisé.
- Pain et un peu de chocolat au goûter à la place d’une barre chocolatée.
- Eau (éventuellement aromatisée d’une rondelle de citron ou de feuilles de menthe) à la place des sirops.
- Céréales complètes peu sucrées ou flocons d’avoine à la place de céréales fourrées.

**Cuisiner maison**
Faire soi-même un gâteau ou une compote permet de choisir la quantité de sucre : l’Anses souligne que les préparations maison aident à mieux connaître et contrôler les apports en sucres. Vous pouvez réduire progressivement le sucre indiqué dans vos recettes habituelles.

**Donner une place aux douceurs**
Un dessert sucré ou un bonbon n’a pas besoin d’être un événement interdit. Réservez-les à des moments identifiés (une fête, un goûter du week-end) et évitez de les utiliser comme **récompense** ou comme **consolation** : cela leur donne une valeur particulière.

**Lire les étiquettes**
Le Nutri-Score aide à comparer des produits d’un même rayon ; limitez ceux classés D ou E. Dans la liste des ingrédients, le sucre peut apparaître sous plusieurs noms (sirop de glucose, dextrose, saccharose…).

**Protéger les dents**
Brossage des dents deux fois par jour avec un dentifrice fluoré adapté à l’âge, rendez-vous chez le dentiste au moins une fois par an, et pas d’aliment ni de boisson sucrée après le brossage du soir.

## Questions fréquentes
**Les produits « light » ou avec édulcorants sont-ils une solution ?**
Santé publique France indique que les boissons « light » contiennent peu de calories mais entretiennent le goût du sucre : leur consommation est aussi à limiter.

**Le miel ou le sucre de canne sont-ils meilleurs ?**
Ce sont aussi des sucres. Les mêmes repères de modération s’appliquent.

**Mon enfant réclame des bonbons après l’école…**
Fixez un cadre clair et prévisible (par exemple, pas de bonbons en semaine) et proposez un goûter qu’il aime. Un « non » posé calmement et tenu dans le temps est souvent mieux accepté qu’une négociation quotidienne.

**Que faire des bonbons des anniversaires ou de fêtes ?**
Vous pouvez les ranger et les proposer de temps en temps au dessert ou au goûter, plutôt que tous d’un coup ou en grignotage.

## Quand demander conseil
Parlez-en au médecin si votre enfant prend du poids rapidement, s’il a une soif inhabituelle, urine beaucoup ou maigrit sans raison (ces signes doivent faire consulter rapidement), ou si vous constatez des taches ou douleurs dentaires (consultez le dentiste). Les examens M’T dents sont pris en charge tous les trois ans, de 3 à 24 ans. En cas de malaise, de somnolence inhabituelle ou de difficulté à respirer, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'boissons-sucrees-jus-sodas-enfant', category: 'alimentation',
    title: 'Jus de fruits, sodas, sirops : quelles boissons pour l’enfant ?',
    summary: 'Pourquoi l’eau reste la seule boisson recommandée, ce que valent jus, nectars et sodas, et comment faire évoluer les habitudes.',
    tags: ['boissons sucrées', 'jus de fruits', 'soda', 'sirop', 'nectar', 'smoothie', 'eau', 'light'],
    sources: [S.ameliAliments, S.santeReduire, S.santeFL],
    body_md: `## En bref
- **L’eau** est la seule boisson recommandée, à volonté, pendant et entre les repas.
- Avant 11 ans, pas plus d’**un demi-verre par jour** de boisson sucrée, jus de fruits compris.
- Un jus de fruits ne compte pas comme une portion de fruits.
- Une canette de soda de 33 cl contient l’équivalent d’environ **6 morceaux de sucre**.

## Comprendre
L’Assurance Maladie et Santé publique France s’accordent : l’eau est la seule boisson recommandée pour l’enfant. Elle doit être disponible à table, entre les repas et pendant l’activité physique.

Les **boissons sucrées** regroupent les sodas (y compris « light »), les sirops, les boissons aux fruits, les nectars, les thés glacés et les jus de fruits, même « 100 % pur jus ». Elles sont riches en sucres et pauvres en fibres, et apportent peu de satiété. Santé publique France recommande de ne pas dépasser un demi-verre par jour avant 11 ans ; parmi elles, l’Assurance Maladie conseille de préférer un jus sans sucres ajoutés.

Pourquoi le jus ne remplace-t-il pas le fruit ? Le fruit entier demande de mastiquer, apporte des fibres et rassasie davantage. Selon Santé publique France, les yaourts aux fruits et les biscuits aux fruits ne comptent pas non plus, car ils contiennent très peu de fruits.

Pour les smoothies, l’Assurance Maladie précise qu’un smoothie réalisé à partir de fruits ou de légumes entiers, sans sucre ajouté, peut remplacer une ou deux portions. Les nectars et boissons aux fruits sucrées sont, eux, fortement déconseillés.

Quant aux boissons « light », Santé publique France souligne qu’elles entretiennent le goût du sucre et sont aussi à limiter.

## Au quotidien
**Faire de l’eau la boisson naturelle de la famille**
- Mettez une carafe d’eau sur la table à chaque repas.
- Donnez à votre enfant sa propre gourde pour l’école et les activités.
- Proposez de l’eau plate ou gazeuse, fraîche, avec une rondelle d’agrume, de concombre ou quelques feuilles de menthe pour changer.

**Faire évoluer les habitudes progressivement**
- Commencez par supprimer les boissons sucrées des repas de la semaine.
- Diluez de plus en plus les sirops, puis réservez-les aux occasions.
- N’achetez plus de grandes bouteilles de soda « pour la maison » : ce qui n’est pas dans le placard ne se boit pas.

**Montrer l’exemple**
Les enfants imitent ce qu’ils voient : si les adultes boivent de l’eau à table, l’enfant suivra plus facilement.

**En sortie ou à une fête**
Une boisson sucrée exceptionnelle n’est pas un problème. Ce qui compte, c’est l’habitude quotidienne.

## Questions fréquentes
**Le jus d’orange du matin est-il indispensable pour la vitamine C ?**
Non. Un fruit entier (orange, kiwi, clémentine, fraises selon la saison) apporte de la vitamine C, des fibres et rassasie mieux.

**Les eaux aromatisées du commerce sont-elles de l’eau ?**
Beaucoup contiennent du sucre ou des édulcorants. Lisez l’étiquette : si du sucre ou un édulcorant figure dans les ingrédients, elles relèvent des boissons sucrées ou « light ».

**Mon enfant ne boit pas assez d’eau, il n’aime pas ça…**
Proposez-la fraîche, dans un verre ou une gourde qu’il a choisi, et à des moments réguliers (au réveil, aux repas, au retour de l’école, après le sport).

**Et le lait, compte-t-il comme boisson ?**
Le lait est un produit laitier, c’est-à-dire un aliment. Il peut accompagner le petit-déjeuner ou le goûter, mais ne remplace pas l’eau pour se désaltérer.

## Quand demander conseil
Consultez rapidement si votre enfant a une soif intense et inhabituelle, urine beaucoup, se lève la nuit pour boire ou maigrit sans raison. Par forte chaleur, en cas de fièvre, de diarrhée ou de vomissements, surveillez les signes de déshydratation (bouche sèche, urines rares et foncées, somnolence) : appelez le **15** ou le **112** s’il est abattu, difficile à réveiller ou ne parvient pas à boire.

${FIN}`,
  },
  {
    ...K, slug: 'eau-lait-cafeine-boissons-enfant-3-10-ans', category: 'alimentation',
    title: 'Eau, lait, thé, boissons énergisantes : ce que boit l’enfant de 3 à 10 ans',
    summary: 'L’eau comme boisson de base, la place du lait et les raisons d’éviter café, thé et boissons énergisantes chez l’enfant.',
    tags: ['eau', 'boire', 'hydratation', 'lait', 'thé', 'café', 'boissons énergisantes', 'caféine', 'gourde'],
    sources: [S.santeReduire, S.ameliAliments, S.malletteDents],
    body_md: `## En bref
- L’eau, du robinet ou en bouteille, est la boisson de référence de l’enfant, à volonté.
- Le lait est un produit laitier : demi-écrémé dès 3 ans, il apporte autant de calcium que le lait entier.
- Café, thé et boissons énergisantes sont **déconseillés** aux enfants et aux adolescents.
- La nuit, seule l’eau est recommandée pour protéger les dents.

## Comprendre
**L’eau.** Santé publique France et l’Assurance Maladie rappellent que l’eau est la seule boisson recommandée. Elle accompagne les repas, se boit entre les repas et pendant l’activité physique. Les tisanes non sucrées peuvent aussi contribuer à l’hydratation.

**Le lait.** L’Assurance Maladie précise que le lait demi-écrémé convient dès 3 ans et que la teneur en calcium est la même, que le lait soit entier ou écrémé. Le lait fait partie des produits laitiers de la journée : c’est un aliment plus qu’une boisson pour se désaltérer. Elle ajoute qu’avant 5 ans, il faut éviter le lait cru et les fromages au lait cru, sauf l’emmental et le comté.

**Les boissons caféinées.** Santé publique France déconseille aux enfants et aux adolescents les boissons contenant de la caféine (café, thé, boissons énergisantes). Elles peuvent perturber le sommeil et, à plus long terme, augmenter le risque d’hypertension, de diabète, d’anxiété et de dépression. Les sodas au cola contiennent aussi de la caféine en plus du sucre. L’Assurance Maladie déconseille également les boissons caféinées chez l’enfant.

**Les dents.** La Mallette des parents rappelle que les boissons sucrées, y compris « light », favorisent les caries, et qu’après le brossage du soir seule l’eau est recommandée.

## Au quotidien
**Encourager à boire de l’eau**
- Une gourde personnelle pour l’école, le sport et les sorties, lavée chaque jour.
- Une carafe sur la table à chaque repas.
- Des moments repères : au réveil, au retour de l’école, après une activité physique, au coucher.
- Par temps chaud, proposez à boire régulièrement sans attendre que l’enfant le demande.

**Le lait au quotidien**
- Un verre de lait au petit-déjeuner ou au goûter compte comme un produit laitier.
- Si votre enfant aime le lait chocolaté, préférez du cacao en poudre peu sucré et dosez légèrement.
- Les boissons végétales (soja, amande, avoine…) ne sont pas des produits laitiers : l’Assurance Maladie précise que les préparations au soja ne les remplacent pas. Parlez-en au médecin si votre enfant ne consomme pas de lait.

**Café, thé, boissons énergisantes**
- Ne proposez pas de café ni de thé aux enfants, même « juste un peu » : ces habitudes s’installent vite.
- Expliquez à votre enfant, surtout en fin d’école primaire, ce que contiennent les boissons énergisantes (caféine et sucre) et pourquoi elles ne lui sont pas destinées.
- Méfiez-vous des sodas au cola, qui associent sucre et caféine.

## Questions fréquentes
**Les tisanes conviennent-elles aux enfants ?**
Santé publique France cite les tisanes non sucrées parmi les boissons qui contribuent à l’hydratation. Servez-les tièdes ou froides, sans sucre ni miel ajouté, et évitez les thés, qui contiennent de la théine.

**Combien d’eau doit boire mon enfant ?**
Les besoins varient avec l’âge, la chaleur et l’activité. L’essentiel est que l’eau soit disponible à volonté et proposée régulièrement ; demandez conseil au médecin si vous avez un doute.

**Une boisson énergisante après le sport, c’est utile ?**
Non. Pour un enfant, l’eau suffit pendant et après l’effort. Les boissons énergisantes sont déconseillées.

**Le thé glacé compte-t-il comme du thé ?**
Il contient en général du sucre, et souvent de la théine (caféine) : il cumule les inconvénients des boissons sucrées et caféinées.

## Quand demander conseil
Consultez rapidement si votre enfant a une soif excessive et inhabituelle, urine beaucoup ou maigrit. Si un enfant a bu par erreur une boisson énergisante ou du café en grande quantité et présente des palpitations, une agitation importante, des vomissements ou un malaise, appelez le **15** ou le **112**. En cas de forte chaleur avec fièvre, somnolence ou refus de boire, appelez aussi le **15**.

${FIN}`,
  },
  {
    ...K, slug: 'grignotage-enfant-faim-ennui-ecrans', category: 'alimentation',
    title: 'Grignotage de l’enfant : faim, ennui, écrans… comment réagir ?',
    summary: 'Pourquoi les enfants grignotent, ce que cela change pour leur santé et des solutions concrètes pour retrouver des repas réguliers.',
    tags: ['grignotage', 'grignoter', 'entre les repas', 'écrans', 'publicité', 'faim', 'ennui', 'surpoids', 'caries'],
    sources: [S.ameliRepas, S.ansesAvis, S.ameliSurpoids],
    body_md: `## En bref
- Le grignotage entre les repas favorise le **surpoids** et les **caries**.
- Quatre repas réguliers (petit-déjeuner, déjeuner, goûter, dîner) aident à arriver à table avec une vraie faim.
- Les écrans et la publicité alimentaire poussent à manger sans faim.
- Une collation ne devrait répondre qu’à une **vraie faim**, et se choisir parmi les fruits, produits laitiers nature ou pain.

## Comprendre
L’Assurance Maladie recommande d’éviter le grignotage entre les repas, car il favorise le surpoids et les caries dentaires. Elle cite un chiffre marquant : les publicités alimentaires augmentent le grignotage de **45 %** dans les minutes qui suivent leur diffusion.

L’Anses, dans son avis sur les repères alimentaires des 4-17 ans, précise que les collations ne doivent répondre qu’à un réel signal de faim, et qu’il vaut mieux alors privilégier les fruits frais, les produits laitiers nature, les fruits secs ou à coque (adaptés à l’âge) et l’eau.

Les enfants grignotent souvent pour d’autres raisons que la faim :
- **l’ennui** ou le désœuvrement ;
- **les écrans** : on mange sans y prêter attention, et la publicité donne envie ;
- **les émotions** (fatigue, contrariété, besoin de réconfort) ;
- **la disponibilité** : des paquets ouverts à portée de main ;
- **un repas sauté ou trop léger**, qui laisse une vraie faim.

L’Assurance Maladie, dans ses conseils pour prévenir le surpoids, recommande des repas sans écran centrés sur la famille et l’absence de télévision dans la chambre de l’enfant.

## Au quotidien
**Structurer la journée**
- Des horaires de repas réguliers, connus de l’enfant.
- Un goûter d’un ou deux aliments, pas trop près du dîner.
- En dehors de ces moments, la cuisine « ferme » : on peut boire de l’eau à volonté.

**Réduire les tentations**
- Rangez biscuits et paquets hors de vue ; laissez plutôt une corbeille de fruits accessible.
- Évitez d’acheter en grande quantité les produits que votre enfant grignote le plus.
- Ne mangez pas devant les écrans, et limitez l’exposition aux publicités (programmes sans coupure, enregistrements).

**Répondre aux vraies causes**
- Ennui : proposez une activité, une sortie, un jeu ; l’activité physique quotidienne est aussi recommandée.
- Émotion : mettez des mots, proposez un câlin ou un moment calme plutôt qu’un aliment réconfort.
- Faim réelle : vérifiez que les repas sont assez consistants (féculent à chaque repas, produit laitier, fruits et légumes).

**Expliquer la publicité**
À partir de 6-7 ans, vous pouvez regarder une publicité avec votre enfant et lui demander ce qu’elle cherche à lui faire acheter. Comprendre le mécanisme aide à prendre du recul.

## Questions fréquentes
**Grignoter un fruit entre les repas, est-ce grave ?**
Un fruit est un meilleur choix qu’un biscuit, mais l’idéal reste de le placer au goûter ou au dessert pour garder des repas réguliers et préserver l’appétit.

**Mon enfant dit tout le temps qu’il a faim…**
Observez à quel moment il le dit (devant la télévision, après l’école, quand il s’ennuie). S’il a réellement faim aux repas et mange de bon appétit, la demande est peut-être liée à autre chose. Si sa faim semble excessive, parlez-en au médecin.

**Faut-il interdire totalement les chips et biscuits ?**
Non : ils peuvent avoir leur place de temps en temps, à table ou au goûter, plutôt qu’en grignotage.

**Les écrans pendant le repas, vraiment un problème ?**
Ils détournent l’attention des sensations de faim et de satiété, et réduisent les échanges. L’Assurance Maladie recommande des repas sans écran.

## Quand demander conseil
Parlez-en au médecin si le grignotage s’accompagne d’une prise de poids rapide, si votre enfant semble manger pour calmer une angoisse ou de la tristesse, s’il cache de la nourriture, ou si les tensions autour de la nourriture deviennent pesantes pour la famille. Si vous vous sentez dépassé, le **3114** est joignable jour et nuit. En urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'fruits-legumes-enfant-portions-astuces', category: 'alimentation',
    title: 'Fruits et légumes de l’enfant : combien, quelle portion, sous quelle forme ?',
    summary: 'Le repère « au moins 5 par jour » adapté aux enfants, la taille d’une portion selon l’âge et les formes qui comptent.',
    tags: ['fruits et légumes', '5 par jour', 'portion', 'légumes', 'fruits', 'surgelés', 'conserves', 'compote', 'vitamine C'],
    sources: [S.santeFL, S.ameliAliments, S.spf411],
    body_md: `## En bref
- Repère : **au moins 5 portions de fruits et légumes par jour**, avec plus de légumes que de fruits, à atteindre progressivement.
- Une portion correspond environ à la taille du **poing** ; entre 4 et 6 ans, la portion d’un enfant est environ la moitié de celle d’un adulte.
- Frais, surgelés, en conserve, crus ou cuits : tout compte.
- Les jus, nectars, yaourts aux fruits et biscuits aux fruits ne comptent pas comme une portion.

## Comprendre
Santé publique France recommande de proposer des fruits et légumes à chaque repas, pour que l’enfant atteigne progressivement le repère d’au moins 5 portions par jour à l’âge adulte, en les présentant comme une source de plaisir et de découverte. L’Assurance Maladie conseille de privilégier les légumes, par exemple 4 légumes et 1 fruit, ou 3 légumes et 2 fruits.

**La portion.** Pour un adulte, une portion pèse environ 80 à 100 g : une tomate moyenne, un bol de soupe, une pomme, une banane, deux abricots, quatre ou cinq fraises. Pour l’enfant, Santé publique France indique qu’entre 4 et 6 ans la portion est environ la moitié de celle de l’adulte, puis qu’elle augmente progressivement à partir de 7 ans pour atteindre celle d’un adulte vers 11 ans. Un repère pratique : une portion a à peu près la taille du poing de la personne qui mange.

**Ce qui compte.** Un plat contenant plusieurs légumes compte pour une portion (une soupe de légumes variés, par exemple), tout comme un petit bol de compote. Fruits secs : riches en sucres naturels, à consommer occasionnellement.

**Ce qui ne compte pas.** Les jus de fruits, boissons aux fruits, nectars, yaourts aux fruits et biscuits aux fruits.

**Pourquoi c’est important.** Les fruits et légumes apportent fibres, vitamines et minéraux. L’Assurance Maladie signale que 888 enfants ont été hospitalisés pour un scorbut (carence en vitamine C) en France entre janvier 2015 et novembre 2023, avec une hausse marquée depuis 2020. Santé publique France rapportait aussi qu’en 2015, seul un quart des 6-10 ans mangeaient suffisamment de fruits et légumes.

## Au quotidien
**Un exemple de journée**
- Petit-déjeuner : une clémentine.
- Déjeuner : carottes râpées en entrée, haricots verts avec le plat.
- Goûter : une pomme.
- Dîner : soupe de légumes.

**Quand le temps manque**
Les légumes surgelés nature, en conserve ou en bocal ont une très bonne qualité nutritionnelle et se préparent vite. Gardez toujours au congélateur un sachet de légumes nature et une soupe prête.

**Petit budget**
Privilégiez les fruits et légumes de saison, moins chers en pleine récolte ; sur les marchés, les prix baissent souvent en fin de matinée.

**L’intégrer partout**
Ajoutez des légumes dans les gratins, les tartes salées ou sucrées, les sauces tomate maison, les omelettes, les pâtes. Une petite augmentation est déjà bénéfique.

**Les cuissons**
Cuisez les légumes à la vapeur ou avec peu d’eau pour préserver les vitamines, selon l’Assurance Maladie.

## Questions fréquentes
**Les compotes en gourde comptent-elles ?**
Une compote sans sucre ajouté compte comme une portion de fruit. Lisez l’étiquette pour vérifier l’absence de sucres ajoutés.

**Une soupe contenant cinq légumes compte-t-elle pour cinq portions ?**
Non, un bol de soupe compte pour une portion, quel que soit le nombre de légumes qu’elle contient.

**Le bio est-il indispensable ?**
Santé publique France recommande le bio quand c’est possible, mais manger des fruits et légumes, bio ou non, reste la priorité.

**Mon enfant ne mange que deux ou trois légumes…**
Proposez-les souvent : Santé publique France indique qu’un légume préféré peut revenir plusieurs fois par semaine. Continuez en parallèle à proposer d’autres légumes, sans forcer.

## Quand demander conseil
Consultez si votre enfant refuse quasiment tous les fruits et légumes, s’il a des gencives qui saignent, une grande fatigue, des douleurs dans les jambes, des bleus inhabituels ou une perte de poids : ces signes doivent être examinés par un médecin. Si les refus alimentaires sont très nombreux et s’accompagnent d’une détresse au moment des repas, parlez-en aussi au médecin. En urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'faire-aimer-les-legumes-enfant', category: 'alimentation',
    title: 'Faire goûter et aimer les légumes à son enfant',
    summary: 'Des méthodes concrètes et bienveillantes pour élargir les goûts de l’enfant de 3 à 10 ans, sans conflit à table.',
    tags: ['légumes', 'refuse les légumes', 'goûts', 'néophobie', 'nouveaux aliments', 'difficile à table', 'variété'],
    sources: [S.santeGouts, S.santeFL, S.malletteAlim],
    body_md: `## En bref
- Les goûts se construisent pendant l’enfance, au fil des expériences.
- Face à un aliment nouveau, ne forcez pas mais **reproposez-le régulièrement** : il faut parfois une dizaine d’essais espacés.
- Varier les préparations et les cuissons change l’aspect et le goût d’un même légume.
- Laisser un choix, ajouter de la couleur et cuisiner ensemble donnent envie de goûter.

## Comprendre
Santé publique France explique que les goûts de l’enfant se forment à partir des expériences qu’il vit. Devant un aliment nouveau, il est conseillé de ne pas le forcer, mais de continuer à le proposer : il faut parfois une dizaine d’essais, espacés dans le temps, pour qu’un enfant l’accepte. Au-delà d’une dizaine de tentatives, il est inutile d’insister davantage : l’enfant peut simplement ne pas aimer cet aliment, comme chacun d’entre nous.

Les enfants perçoivent souvent les saveurs différemment des adultes : ce qui paraît fade à un adulte peut sembler trop fort pour un enfant.

La Mallette des parents rappelle que les goûts se forment progressivement pendant l’enfance et l’adolescence, en famille, à la cantine ou en cuisinant, et qu’il faut du temps pour accepter de nouvelles saveurs.

## Au quotidien
**Varier les préparations**
Un même légume change de visage selon qu’il est servi en vinaigrette, en soupe, en tarte, en gratin, dans un pot-au-feu ou en purée. Santé publique France prend l’exemple du poireau : en vinaigrette, en potage, en tarte ou en pot-au-feu, ce n’est pas tout à fait le même aliment pour l’enfant.

**Varier les cuissons**
Vapeur, four, papillote, gril, nature, en sauce ou légèrement épicé : chaque cuisson révèle des couleurs, des textures et des parfums différents.

**Laisser un choix encadré**
Proposez deux options d’une même catégorie : « carottes râpées ou concombre ? ». L’enfant se sent écouté, et il mange quand même un légume.

**Garder un légume « refuge »**
Proposez plusieurs fois par semaine un légume que votre enfant aime beaucoup (la tomate, par exemple), à côté des légumes à découvrir.

**Soigner la présentation**
Ajoutez de la couleur : légumes dans les pâtes, herbes fraîches sur le poisson, assiette avec plusieurs couleurs. Un poisson en papillote avec des herbes et des légumes en dés peut plaire davantage qu’un filet nature.

**Faire participer**
Choisir un légume au marché, le laver, l’éplucher (avec un économe adapté), le mélanger : un enfant qui a préparé un plat a souvent plus envie d’y goûter.

**Petites portions, sans pression**
Servez une petite quantité du légume nouveau à côté d’aliments familiers. Pas de chantage, pas de dessert en récompense, pas de punition : goûter doit rester une proposition.

## Questions fréquentes
**Faut-il obliger à « goûter une bouchée » ?**
Mieux vaut encourager sans obliger. L’enfant peut toucher, sentir, poser l’aliment sur le bord de son assiette : ce sont déjà des étapes vers le goût.

**Peut-on « cacher » les légumes dans les plats ?**
Mixer des légumes dans une sauce ou une soupe augmente les apports, mais n’aide pas l’enfant à reconnaître et apprécier le légume. Associez les deux approches : une version mixée, une version visible.

**Mon enfant mangeait de tout petit, il refuse tout depuis quelque temps…**
La méfiance face à des aliments nouveaux, voire déjà connus, est fréquente chez le jeune enfant. Restez patient, continuez à proposer et à manger vous-même ces aliments devant lui.

**Combien de temps dure cette période ?**
Elle varie d’un enfant à l’autre. Ce qui compte est de garder une ambiance agréable à table et une offre variée.

## Quand demander conseil
Parlez-en au médecin si votre enfant mange un nombre très restreint d’aliments, si les refus s’accompagnent de haut-le-cœur, de vomissements ou d’une grande anxiété, si son poids ou sa croissance ralentissent, ou si les repas sont devenus une source de conflit permanente. Si l’épuisement vous gagne, le **3114** est joignable jour et nuit. En cas de gêne respiratoire ou de gonflement après un aliment, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'fruits-a-coque-fruits-secs-enfant-age-etouffement', category: 'alimentation', safety_critical: true,
    title: 'Noix, amandes, fruits secs : à quel âge et comment les proposer à l’enfant ?',
    summary: 'L’intérêt des fruits à coque et des fruits secs pour l’enfant, les précautions contre l’étouffement selon l’âge et la conduite à tenir.',
    tags: ['fruits à coque', 'noix', 'amandes', 'noisettes', 'cacahuètes', 'fruits secs', 'étouffement', 'fausse route', 'goûter'],
    sources: [S.ameliAliments, S.ansesAvis, S.santeFL],
    body_md: `## En bref
- Les fruits à coque **non salés** (noix, noisettes, amandes…) sont une bonne option de goûter.
- **Avant 3-4 ans**, ne donnez pas de fruits à coque entiers : le risque d’étouffement est réel.
- **Jusqu’à 6 ans**, l’Assurance Maladie conseille de les proposer en poudre ou intégrés à la cuisine.
- Les fruits secs (raisins, abricots, dattes) sont riches en sucres naturels : à proposer de temps en temps.

## Comprendre
Santé publique France recommande d’augmenter la consommation de fruits à coque non salés dans l’alimentation de la famille. L’Anses les cite parmi les aliments à privilégier au goûter, à la place des biscuits et pâtisseries, et comme source de fer.

Mais ces petits aliments durs et ronds présentent un **risque d’étouffement** chez le jeune enfant, qui ne mastique pas encore aussi efficacement qu’un adulte et peut les inhaler en riant, en courant ou en parlant. C’est pourquoi l’Assurance Maladie indique que les fruits à coque entiers sont déconseillés avant 3-4 ans, et qu’il est préférable, jusqu’à 6 ans, de les donner en poudre ou dans des préparations.

Les **fruits secs** (raisins secs, abricots secs, dattes, figues) sont riches en vitamines et minéraux, mais aussi en sucres. Santé publique France conseille de les consommer occasionnellement. Ils ne remplacent pas un fruit frais.

**Allergies.** L’arachide (cacahuète) et les fruits à coque font partie des allergènes à déclaration obligatoire. Si votre enfant a déjà réagi à l’un de ces aliments, suivez les consignes de son médecin.

## Au quotidien
**Avant 6 ans : en poudre ou cuisinés**
- poudre d’amande ou de noisette dans un gâteau, une crêpe, un crumble ;
- noix mixées dans une sauce, un pesto maison, un yaourt ;
- purée d’amande ou de cacahuète étalée finement sur du pain (sans sucre ajouté, à lire sur l’étiquette).

**Après 6 ans : entiers, avec quelques règles**
- Une petite poignée au goûter, avec un fruit et de l’eau.
- L’enfant mange **assis**, au calme, sans courir ni jouer.
- Pas de fruits à coque en voiture, pendant un jeu, devant un écran ou en s’endormant.
- Choisissez-les **non salés** et non enrobés (ni caramélisés, ni chocolatés).

**Autres aliments à risque d’étouffement chez les plus jeunes**
Raisins frais et tomates cerises entiers, bonbons durs, popcorn, morceaux de saucisse ronds : coupez les fruits ronds en quatre dans le sens de la longueur pour les plus jeunes, et restez à proximité pendant les repas.

**Fruits secs**
- Quelques abricots secs ou raisins secs peuvent accompagner un goûter de temps en temps.
- Pensez au brossage des dents : les fruits secs collent aux dents.

## Questions fréquentes
**Mon enfant de 4 ans réclame des cacahuètes à l’apéritif…**
Avant 6 ans, mieux vaut proposer autre chose : bâtonnets de légumes, tomates cerises coupées, dés de fromage. Les cacahuètes entières sont aussi souvent salées.

**Les fruits à coque sont-ils trop gras pour un enfant ?**
Ils contiennent des matières grasses de bonne qualité et sont recommandés par Santé publique France, en petite quantité et non salés.

**Les barres de céréales aux fruits secs sont-elles un bon goûter ?**
Beaucoup sont riches en sucres ajoutés. Comparez-les avec le Nutri-Score et lisez la liste d’ingrédients ; un fruit et un morceau de pain restent souvent un meilleur choix.

**Faut-il éviter les fruits à coque à l’école ?**
Certaines écoles accueillent des enfants allergiques et demandent d’éviter ces aliments : respectez les consignes de l’établissement.

## Quand demander conseil
**Étouffement : appelez immédiatement le 15 ou le 112** si votre enfant ne peut plus parler, tousser ou respirer, devient bleu ou perd connaissance. S’il tousse fort, laissez-le tousser sans lui taper dans le dos, ne mettez pas les doigts dans sa bouche et restez près de lui. Une formation aux gestes de premiers secours permet de connaître les gestes adaptés à l’âge. Après un épisode d’étouffement, même résolu, consultez un médecin si une toux, une gêne respiratoire ou un sifflement persistent. En cas de gonflement des lèvres, d’urticaire, de vomissements ou de gêne respiratoire après avoir mangé un fruit à coque, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'viande-poisson-oeufs-enfant-quelles-portions', category: 'alimentation',
    title: 'Viande, poisson, œufs : quelles quantités pour un enfant de 3 à 10 ans ?',
    summary: 'Les repères de portions selon l’âge, la fréquence conseillée et comment varier les sources de protéines dans la semaine.',
    tags: ['viande', 'poisson', 'œufs', 'protéines', 'portion', 'jambon', 'nuggets', 'quantité enfant'],
    sources: [S.ameliAliments, S.santePoisson, S.ameliRepas],
    body_md: `## En bref
- Viande, poisson ou œufs **ne sont pas nécessaires à chaque repas** : on les alterne au fil de la semaine, avec les légumineuses.
- Entre 4 et 6 ans, une portion correspond environ à **50 g** de viande, de volaille ou de poisson, ou **1 œuf**.
- Vers 11 ans, la portion rejoint celle d’un adulte, environ 100 g ou 2 œufs.
- Préférez la volaille et les morceaux maigres ; limitez la charcuterie (sauf jambon blanc et volaille) et les produits panés.

## Comprendre
L’Assurance Maladie présente viande, poisson et œufs comme une famille d’aliments à consommer **en alternance**, pas forcément à chaque repas. Les légumineuses (lentilles, pois chiches, haricots) et les céréales peu raffinées sont des sources alternatives de protéines.

**Les portions selon l’âge**
- **4-6 ans** : environ 1 œuf ou 50 g de volaille, de viande ou de poisson.
- **À partir de 7 ans** : la portion augmente progressivement.
- **Vers 11 ans** : environ 100 g de viande ou de poisson, ou 2 œufs, soit une portion d’adulte.

Une équivalence pratique : **50 g de viande = 50 g de poisson = 1 œuf**.

**La fréquence**
- **Poisson** : deux fois par semaine, dont un poisson gras (sardine, maquereau, hareng, saumon).
- **Viande rouge** (bœuf, porc, veau, agneau) : à limiter ; la volaille est à privilégier.
- **Charcuterie** : avant 11 ans, à consommer seulement de temps en temps, à l’exception du jambon blanc et de la charcuterie de volaille, selon l’Assurance Maladie.
- **Produits panés** (nuggets, cordons-bleus) et **burgers** : souvent ultra-transformés, à limiter ; lisez les étiquettes.

## Au quotidien
**Une semaine type, à titre d’exemple**
- Lundi : poulet rôti le midi, soupe et omelette le soir.
- Mardi : poisson à la cantine, dîner végétarien (lentilles et riz).
- Mercredi : boulettes de bœuf maison, bien cuites.
- Jeudi : menu végétarien à la cantine, filet de poisson le soir.
- Vendredi : œufs durs et salade composée.
- Le week-end : un plat familial, et des légumes secs dans un des repas.

**Visualiser une portion**
Pour un enfant de 4 à 6 ans, la portion représente environ la moitié de celle d’un adulte : 50 g de viande ou de poisson, ou un œuf. Pesez une fois une portion pour vous faire une idée, puis ajustez selon son appétit.

**Choisir les produits**
- Préférez les morceaux maigres et les préparations simples (rôti, escalope, filet).
- Pour le poisson, variez les espèces et les lieux d’approvisionnement.
- Pour les plats préparés, comparez les produits avec le Nutri-Score.

**Cuisiner en sécurité**
Faites bien cuire à cœur la viande hachée (steak haché, boulettes) : elle ne doit plus être rosée à l’intérieur.

## Questions fréquentes
**Mon enfant ne mange presque pas de viande : faut-il s’inquiéter ?**
Pas forcément. Le poisson, les œufs, les légumineuses associées aux féculents et les produits laitiers apportent aussi des protéines. Parlez-en au médecin si votre enfant mange peu de variété ou paraît fatigué.

**Il réclame sans arrêt des nuggets…**
Vous pouvez en servir de temps en temps, en les accompagnant de légumes. Des aiguillettes de poulet panées maison, cuites au four, sont une alternative appréciée.

**Faut-il servir de la viande le soir s’il en a mangé à la cantine ?**
Non. Un dîner à base d’œufs, de légumineuses ou simplement de légumes, féculents et produit laitier convient très bien.

**Le jambon blanc est-il une charcuterie à limiter ?**
L’Assurance Maladie le cite comme la charcuterie à privilégier ; il contient tout de même du sel, alors gardez des quantités modérées.

## Quand demander conseil
Parlez-en au médecin si votre enfant refuse durablement plusieurs familles d’aliments, s’il est pâle et fatigué, si sa croissance ralentit, ou si vous envisagez une alimentation sans viande ni poisson : il vous aidera à couvrir ses besoins. En cas de diarrhée sanglante après un repas de viande hachée, consultez immédiatement. En cas de malaise ou de difficulté à respirer, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'poisson-enfant-lequel-choisir-et-cuisiner', category: 'alimentation',
    title: 'Le poisson chez l’enfant : lequel choisir, comment le cuisiner et le faire aimer ?',
    summary: 'Pourquoi proposer du poisson deux fois par semaine, comment alterner poissons gras et maigres, et des astuces pour les enfants réticents.',
    tags: ['poisson', 'poisson gras', 'oméga-3', 'sardine', 'saumon', 'surgelé', 'sushi', 'poisson cru', 'arêtes'],
    sources: [S.santePoisson, S.ameliAliments, S.ansesHygiene],
    body_md: `## En bref
- Proposez du poisson **deux fois par semaine**, dont un **poisson gras** (sardine, maquereau, hareng, saumon).
- Entre 4 et 6 ans, une portion représente environ **50 g** ; elle rejoint les 100 g d’un adulte vers 11 ans.
- **Jusqu’à 6 ans**, pas de poisson cru ni de coquillages crus (donc pas de sushis au poisson cru).
- Le poisson surgelé ou en conserve a les mêmes qualités nutritionnelles que le frais et coûte souvent moins cher.

## Comprendre
Santé publique France recommande de manger du poisson deux fois par semaine, dont un poisson gras. Le poisson apporte des protéines de très bonne qualité et du fer. Les poissons gras sont riches en **oméga-3**, des acides gras dits « essentiels », car le corps ne sait pas les fabriquer : ils doivent venir de l’alimentation. Ils contribuent à la santé du cœur, de la rétine, du cerveau et du système nerveux. Les noix et les huiles de colza ou de noix en apportent aussi.

**Les portions de l’enfant.** De 4 à 6 ans, la portion est environ la moitié de celle d’un adulte, soit 50 g. À partir de 7 ans, elle augmente progressivement pour atteindre environ 100 g vers 11 ans.

**Varier.** Certains poissons peuvent contenir des polluants : il est recommandé de varier les espèces et les lieux d’approvisionnement, en alternant poissons gras et maigres (cabillaud, colin, merlu, lieu…).

**Le cru.** Jusqu’à 6 ans, il ne faut pas donner de coquillages crus ni de poisson cru. L’Anses déconseille plus largement aux jeunes enfants le poisson cru (tartare, carpaccio).

## Au quotidien
**Des idées que les enfants apprécient souvent**
- papillote de saumon ou de colin avec des légumes en dés et des herbes ;
- rillettes de sardines maison sur du pain ;
- parmentier de poisson (purée et poisson émietté) ;
- salade de pâtes ou de lentilles au thon ;
- filets de poisson en croûte de chapelure maison, cuits au four ;
- maquereau au four avec des pommes de terre.

**Limiter les odeurs de cuisson**
Santé publique France conseille la papillote (au four ou au micro-ondes), quelques morceaux de citron dans le plat, un court-bouillon avec thym et laurier, ou un morceau de gingembre frais dans la poêle.

**Les arêtes**
Choisissez des filets, vérifiez-les du bout des doigts avant de servir, et émiettez le poisson pour les plus jeunes. Apprenez progressivement à votre enfant à repérer les arêtes.

**Petit budget**
Le poisson surgelé (nature) et les conserves (sardines, maquereau, thon) sont économiques et pratiques. Attention aux poissons panés ou cuisinés en sauce, souvent plus riches en matières grasses : lisez l’étiquette et comparez avec le Nutri-Score.

## Questions fréquentes
**Les bâtonnets de poisson panés comptent-ils ?**
Ils contiennent du poisson, mais aussi de la panure et des matières grasses. Ils peuvent dépanner de temps en temps ; préférez les versions avec le meilleur Nutri-Score et alternez avec du poisson nature.

**Mon enfant de 5 ans peut-il manger des sushis ?**
Avant 6 ans, pas de poisson cru. Les makis au concombre, à l’avocat, à l’omelette ou au poisson cuit sont possibles.

**Et le poisson fumé ?**
Le saumon fumé n’est pas cuit : pour les jeunes enfants, les précautions du poisson cru s’appliquent. Il est aussi salé : pour les plus grands, gardez-le pour des occasions, en petite quantité.

**Il n’aime pas le poisson…**
Reproposez-le régulièrement sous des formes différentes (émietté dans une purée, en rillettes, en papillote), sans forcer. Les goûts évoluent.

## Quand demander conseil
Si une arête reste coincée dans la gorge et que votre enfant a du mal à avaler, bave beaucoup ou a mal, consultez rapidement. S’il ne peut plus respirer, tousser ou parler, appelez immédiatement le **15** ou le **112**. Une allergie au poisson se manifeste parfois par une urticaire, un gonflement des lèvres, des vomissements ou une gêne respiratoire : en cas de gêne respiratoire ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'securite-alimentaire-enfant-viande-hachee-lait-cru', category: 'securite', safety_critical: true,
    title: 'Viande hachée, lait cru, pâte crue : protéger l’enfant des intoxications alimentaires',
    summary: 'Les gestes recommandés pour éviter les infections alimentaires graves chez l’enfant, dont le syndrome hémolytique et urémique, et les signes qui doivent alerter.',
    tags: ['intoxication alimentaire', 'E. coli', 'SHU', 'syndrome hémolytique et urémique', 'steak haché', 'lait cru', 'fromage au lait cru', 'pâte à cookie crue', 'hygiène'],
    sources: [S.spfShu, S.ansesHygiene, S.ameliAliments],
    body_md: `## En bref
- Faites **bien cuire à cœur** la viande hachée et les préparations à base de viande hachée : elles ne doivent plus être rosées.
- **Avant 5 ans**, pas de lait cru ni de fromages au lait cru, sauf les fromages à pâte pressée cuite (emmental, comté) ou pasteurisés.
- Ne faites pas goûter de **pâte crue à base de farine** (pâte à cookies, à pizza, à gâteau).
- Une **diarrhée avec du sang** chez un enfant impose de consulter immédiatement.

## Comprendre
Certaines bactéries, comme les *E. coli* producteurs de shigatoxines, peuvent provoquer chez l’enfant une diarrhée souvent sanglante, puis parfois une complication grave des reins : le **syndrome hémolytique et urémique (SHU)**. Santé publique France indique que les enfants de moins de 16 ans et les personnes âgées sont particulièrement concernés par les mesures de prévention.

Les principales sources de contamination sont la viande hachée insuffisamment cuite, le lait cru et les produits au lait cru, les préparations à base de farine consommées crues, les légumes et fruits mal lavés, l’eau non traitée, et le contact avec les animaux de ferme.

L’Anses rappelle que la viande hachée doit être consommée bien cuite à cœur par les jeunes enfants, et déconseille fortement à ces mêmes enfants la viande ou le poisson crus (tartare, carpaccio) et les produits au lait cru, à l’exception des fromages à pâte pressée cuite comme le gruyère ou le comté. L’Assurance Maladie précise qu’avant 5 ans, il faut éviter le lait cru et les fromages au lait cru, sauf l’emmental et le comté.

## Au quotidien
**En cuisine**
- Lavez-vous les mains avant de préparer les repas.
- Cuisez bien à cœur steaks hachés, boulettes, hamburgers, lasagnes ou sauce bolognaise : coupez pour vérifier que l’intérieur n’est plus rosé.
- Séparez les aliments crus des aliments cuits ou prêts à manger ; utilisez une planche différente pour la viande crue.
- Lavez soigneusement les légumes, la salade, les fruits et les herbes, surtout s’ils sont mangés crus.
- Nettoyez ustensiles et plans de travail après contact avec de la viande crue ou des fromages au lait cru.
- Réfrigérez rapidement les restes (pas plus de 2 heures à température ambiante, selon l’Anses) et réchauffez-les bien.
- Maintenez la zone la plus froide du réfrigérateur à 4 °C.

**Au fromage**
Pour les moins de 5 ans, choisissez des fromages pasteurisés ou à pâte pressée cuite (emmental, comté). Lisez l’étiquette : la mention « au lait cru » y figure.

**En pâtisserie avec les enfants**
Ne laissez pas goûter la pâte crue (cookies, gâteaux, pâte à pizza) : même sans œuf, la farine crue peut être contaminée.

**En sortie et à la ferme**
- Ne faites pas boire d’eau non traitée (puits, rivière, source, torrent).
- Évitez que l’enfant avale l’eau de baignade.
- Pour les moins de 5 ans, évitez le contact avec les vaches, veaux, moutons, chèvres et leur environnement ; après tout contact avec des animaux, lavez les mains à l’eau et au savon avant de les porter à la bouche.

## Questions fréquentes
**Un steak haché « à point » suffit-il ?**
Pour un enfant, il doit être bien cuit à cœur, sans partie rosée à l’intérieur.

**Le comté et l’emmental au lait cru sont-ils autorisés avant 5 ans ?**
Oui, l’Assurance Maladie et l’Anses font une exception pour ces fromages à pâte pressée cuite.

**Peut-on cuisiner quand on a une gastro-entérite ?**
L’Anses conseille d’éviter de cuisiner pour les autres. Si personne ne peut vous remplacer, renforcez le lavage des mains et préparez des plats simples.

**Combien de temps garder les restes ?**
Pour les plats cuisinés et produits très périssables sans date limite, l’Anses indique qu’une conservation de moins de 3 jours au réfrigérateur est souvent recommandée. Dans le doute, demandez conseil au commerçant ou jetez.

## Quand demander conseil
Selon Santé publique France, l’infection se manifeste en général 3 à 4 jours après la contamination (10 jours au maximum) par une diarrhée souvent sanglante, des douleurs abdominales et parfois des vomissements. **Consultez immédiatement un médecin** si votre enfant a une diarrhée sanglante, ou si, dans les jours suivants, il est très fatigué, pâle, urine moins ou a des urines plus foncées. En cas de convulsions, de somnolence inhabituelle, de signes de déshydratation importante ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'legumineuses-enfant-lentilles-pois-chiches-haricots', category: 'alimentation',
    title: 'Lentilles, pois chiches, haricots : les légumineuses dans l’assiette de l’enfant',
    summary: 'Pourquoi proposer des légumes secs au moins deux fois par semaine, comment les préparer simplement et les faire apprécier aux enfants.',
    tags: ['légumineuses', 'légumes secs', 'lentilles', 'pois chiches', 'haricots rouges', 'fibres', 'protéines végétales', 'houmous'],
    sources: [S.santeLegSecs, S.ameliAliments, S.cnrcVege],
    body_md: `## En bref
- Les légumes secs (lentilles, pois chiches, haricots, pois cassés, fèves) sont à proposer **au moins deux fois par semaine**.
- Riches en **fibres** et en **protéines végétales**, ils peuvent remplacer la viande s’ils sont associés à un féculent.
- Les versions en conserve, en bocal ou surgelées sont prêtes en quelques minutes.
- Augmentez-les **progressivement** et faites boire de l’eau pour limiter les ballonnements.

## Comprendre
Santé publique France recommande de manger des légumes secs au moins deux fois par semaine, pour toute la famille. L’Assurance Maladie reprend ce repère pour les enfants de 3 à 18 ans et précise que les légumineuses peuvent remplacer la viande.

**Ce qu’ils apportent.** Les légumes secs sont riches en fibres et contiennent des protéines végétales. Associés à des féculents complets ou semi-complets, ils peuvent remplacer la viande dans un repas : pois chiches et semoule, lentilles et riz, haricots rouges et maïs sont des associations classiques. Les fibres favorisent le transit, rassasient pendant et entre les repas, et participent à la prévention du diabète et des maladies cardiovasculaires.

**Les variétés.** Lentilles vertes, corail ou noires ; haricots blancs, rouges ou noirs ; pois chiches ; pois cassés ; fèves. Le soja fait aussi partie des légumineuses citées par l’Assurance Maladie.

**À la cantine.** Le Conseil national de la restauration collective recommande de proposer des légumes secs dans les menus, notamment végétariens.

**Une précaution.** Trop de fibres d’un coup peut provoquer des ballonnements ou des douleurs intestinales : Santé publique France conseille d’augmenter les quantités progressivement et de bien boire.

## Au quotidien
**Gagner du temps**
- Les lentilles corail cuisent en une dizaine de minutes, sans trempage.
- Les conserves et bocaux (pois chiches, haricots, lentilles) sont déjà cuits : rincez-les et utilisez-les directement.
- Les légumes secs bruts demandent parfois un trempage : le matin pour le soir, ou la veille pour le lendemain.

**Des recettes qui plaisent souvent aux enfants**
- houmous maison avec des bâtonnets de carotte et du pain ;
- soupe de lentilles corail et carottes, au lait de coco ou non ;
- galettes ou beignets de pois chiches à manger avec les doigts ;
- chili doux de haricots rouges avec du riz ;
- salade de lentilles avec dés de tomate et de fromage ;
- curry doux de pois chiches et riz complet ;
- gâteau au chocolat et aux haricots rouges, proposé par Santé publique France.

**Les introduire en douceur**
- Mélangez quelques lentilles à une sauce bolognaise, une soupe ou une purée.
- Mixez-les au début (houmous, velouté), puis proposez-les entiers.
- Servez une petite portion à côté d’un aliment que l’enfant aime.

**Où les trouver**
Rayon pâtes et riz, rayon bio ou vrac pour les légumes secs bruts, rayon conserves pour les versions cuites.

## Questions fréquentes
**Les légumineuses comptent-elles comme légume ou comme féculent ?**
Elles occupent une place à part : riches en fibres comme les légumes, elles apportent aussi des glucides comme les féculents et des protéines végétales.

**Mon enfant a mal au ventre après les lentilles…**
Commencez par de petites quantités, essayez les versions mixées (velouté, houmous), et faites-le boire suffisamment. Si les douleurs persistent, parlez-en au médecin.

**Peut-on remplacer la viande par des légumineuses à chaque repas ?**
Les légumineuses peuvent remplacer la viande dans certains repas. Si vous envisagez de supprimer durablement viande et poisson, demandez conseil au médecin ou à un·e diététicien·ne.

**Les conserves sont-elles moins intéressantes ?**
Non, ce sont des légumes secs déjà cuits, très pratiques. Rincez-les pour enlever une partie du sel de l’eau de conserve.

## Quand demander conseil
Consultez si votre enfant présente des douleurs abdominales importantes ou persistantes, des troubles digestifs durables, ou une perte de poids. Une allergie (par exemple au soja, à l’arachide ou au lupin) se manifeste parfois par une urticaire, un gonflement, des vomissements ou une gêne respiratoire : en cas de gêne respiratoire ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'feculents-complets-enfant-pain-pates-riz', category: 'alimentation',
    title: 'Pain, pâtes, riz, pommes de terre : la place des féculents (et du complet) chez l’enfant',
    summary: 'Pourquoi proposer un féculent à chaque repas, l’intérêt des versions complètes et comment les faire adopter progressivement.',
    tags: ['féculents', 'pain complet', 'pâtes complètes', 'riz', 'pommes de terre', 'céréales', 'fibres', 'énergie'],
    sources: [S.santeFeculents, S.ameliAliments, S.santeNutriScore],
    body_md: `## En bref
- Un **féculent à chaque repas**, en quantité adaptée à l’appétit et à l’activité de l’enfant.
- **Au moins un féculent complet par jour** : pain complet, pâtes, riz ou semoule complets ou semi-complets.
- Les féculents apportent une énergie libérée progressivement et rassasient, ce qui limite le grignotage.
- Les versions semi-complètes sont une bonne étape pour s’habituer au goût et à la texture.

## Comprendre
L’Assurance Maladie recommande des féculents à chaque repas chez l’enfant de 3 à 18 ans, de préférence complets ou peu raffinés : pain, riz, pâtes, pommes de terre, quinoa, sarrasin… en fonction de l’appétit et de l’activité physique. Les céréales du petit-déjeuner ne comptent que si elles sont complètes et non sucrées.

Santé publique France conseille **au moins un féculent complet par jour**. Les féculents apportent des glucides complexes, qui libèrent leur énergie progressivement, contrairement aux produits sucrés. Les versions raffinées (à base de farine blanche) sont moins riches en fibres, en minéraux et en vitamines. Les fibres favorisent le transit, rassasient et participent à la prévention du diabète et des maladies cardiovasculaires.

Idée reçue : selon Santé publique France, les féculents ne font pas grossir ; leur effet rassasiant aide au contraire à limiter le grignotage. Ce sont plutôt les sauces grasses, le fromage en grande quantité ou la friture qui alourdissent le plat.

Santé publique France note aussi que les produits semi-complets peuvent être mieux digérés par certains enfants.

## Au quotidien
**Faire évoluer les habitudes en douceur**
- Remplacez une partie des pâtes habituelles par des pâtes complètes ou semi-complètes, puis augmentez la proportion.
- Préférez le pain complet, aux céréales ou semi-complet pour les tartines et les sandwichs.
- Utilisez de la farine complète (ou moitié-moitié) pour les crêpes, cakes et gâteaux.
- Essayez le riz semi-complet, la semoule complète, le boulgour, le sarrasin.

**Varier la place des féculents**
- En plat principal, associés à des légumes et des légumes secs (pâtes aux légumes et pois chiches).
- En accompagnement d’une viande ou d’un poisson.
- Sous forme de pain, au petit-déjeuner, au goûter ou au repas.

**Relever sans alourdir**
Plutôt que des pâtes nature avec beaucoup de beurre et de fromage, proposez une sauce tomate maison, du basilic, des légumes poêlés, un filet d’huile d’olive.

**Les pommes de terre**
Elles font partie des féculents. Préférez-les vapeur, au four, en purée maison ; les frites et chips restent occasionnelles.

**Bien choisir en magasin**
Pour les céréales du petit-déjeuner, le pain de mie ou les biscottes, comparez avec le Nutri-Score les produits d’un même rayon, et lisez la liste des ingrédients : « complet » ou « intégral » doit y figurer.

## Questions fréquentes
**Mon enfant refuse le pain complet…**
Commencez par du pain semi-complet ou aux céréales, ou alternez avec la baguette.

**Les pâtes tous les jours, c’est trop ?**
Non, les féculents peuvent être consommés tous les jours. L’important est de varier les céréales et d’accompagner les pâtes de légumes et d’une source de protéines.

**Les céréales soufflées ou fourrées comptent-elles ?**
Selon l’Assurance Maladie, seules les céréales complètes et non sucrées comptent comme un vrai produit céréalier ; les autres sont plutôt des produits sucrés.

**Et pour un enfant intolérant au gluten ?**
La maladie cœliaque se traite par l’exclusion du gluten, sur avis médical. Riz, pommes de terre, quinoa, sarrasin, maïs et légumes secs sont alors des féculents possibles, en lisant attentivement les étiquettes.

## Quand demander conseil
Parlez-en au médecin si votre enfant a souvent des douleurs abdominales, des ballonnements, une diarrhée ou une constipation persistante, s’il ne grandit ou ne grossit pas comme attendu, ou si vous suspectez une intolérance au gluten : n’excluez pas le gluten avant d’en avoir parlé, car cela peut fausser les examens. En cas de malaise ou de difficulté à respirer après un repas, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'produits-laitiers-enfant-combien-lesquels', category: 'alimentation',
    title: 'Lait, yaourts, fromages : combien de produits laitiers pour l’enfant de 3 à 10 ans ?',
    summary: 'Le nombre de produits laitiers conseillé, les équivalences pratiques, ce qui ne compte pas et les précautions avec le lait cru.',
    tags: ['produits laitiers', 'lait', 'yaourt', 'fromage', 'calcium', 'vitamine D', 'lait cru', 'desserts lactés'],
    sources: [S.ameliAliments, S.spf411, S.ansesAvis],
    body_md: `## En bref
- Santé publique France recommande **3 produits laitiers par jour** pendant l’enfance et l’adolescence (l’Assurance Maladie évoque 3 à 4).
- Ils apportent des protéines, du **calcium** et de la vitamine D.
- Préférez les produits laitiers **nature ou peu sucrés** ; crèmes dessert, glaces et barres lactées chocolatées ne comptent pas.
- **Avant 5 ans**, pas de lait cru ni de fromage au lait cru, sauf l’emmental et le comté.

## Comprendre
Les produits laitiers (lait, yaourts, fromage blanc, petits-suisses, fromages) participent à la construction des os pendant la croissance. Santé publique France recommande 3 produits laitiers par jour pour les enfants et adolescents, contre 2 pour les adultes ; l’Assurance Maladie indique 3 à 4 par jour.

**Des équivalences proposées par l’Assurance Maladie** pour une « portion » de produit laitier : un verre de lait, un yaourt nature, 20 g d’emmental, 3 petits-suisses ou 50 g de camembert.

**Ce qui ne compte pas comme produit laitier** : le beurre, la crème, les desserts lactés (crèmes dessert, flans), les glaces, les biscuits et les barres chocolatées au lait. Les préparations à base de soja ne remplacent pas non plus les produits laitiers, selon l’Assurance Maladie.

**Entier ou demi-écrémé ?** La teneur en calcium est la même ; le lait demi-écrémé convient dès 3 ans.

**Vitamine D.** Elle est surtout fabriquée par la peau sous l’effet du soleil : jouer dehors y contribue. Le médecin vous dira si un complément est nécessaire pour votre enfant.

**Peu sucrés, de préférence.** L’Anses recommande des produits laitiers nature ou peu sucrés, et les présente comme le moyen le plus pertinent de couvrir les besoins en calcium. Elle conseille notamment de les préférer aux pâtisseries et biscuits au goûter.

## Au quotidien
**Une journée type, à titre d’exemple**
- Petit-déjeuner : un bol de lait.
- Déjeuner : un morceau de fromage.
- Goûter : un yaourt nature.
- Dîner : du fromage râpé sur les pâtes, ou un fromage blanc en dessert.

**Sucrer soi-même, légèrement**
Un yaourt nature avec un fruit écrasé, un peu de compote ou une petite cuillère de miel ou de confiture vous permet de doser vous-même le sucre, plutôt qu’un yaourt aromatisé. L’Anses recommande des produits laitiers nature ou peu sucrés.

**Varier les fromages**
Les fromages apportent du calcium mais aussi du sel et des graisses : variez-les et gardez des portions modestes. Les fromages à pâte fondue et les bleus sont parmi les plus salés ; la mozzarella l’est moins.

**Lire les étiquettes**
Pour les moins de 5 ans, vérifiez la mention « au lait cru ». Les fromages pasteurisés et les pâtes pressées cuites (emmental, comté) peuvent être proposés.

## Questions fréquentes
**Mon enfant n’aime pas le lait : comment faire ?**
Le lait n’est pas indispensable s’il consomme d’autres produits laitiers : yaourts, fromage blanc, fromages, ou du lait intégré à une purée, une béchamel, un flan maison peu sucré.

**Les boissons végétales peuvent-elles remplacer le lait ?**
Elles ne sont pas équivalentes au lait sur le plan nutritionnel. Si votre enfant ne consomme pas de produits laitiers (choix familial, allergie, intolérance), demandez conseil au médecin.

**Allergie ou intolérance au lactose : quelle différence ?**
L’Assurance Maladie rappelle que l’intolérance au lactose n’est pas une allergie. L’allergie aux protéines de lait de vache disparaît le plus souvent vers 3 à 5 ans. Dans les deux cas, le diagnostic et l’adaptation de l’alimentation se font avec un médecin.

**Trop de produits laitiers, est-ce possible ?**
Au-delà des repères, les produits laitiers peuvent prendre la place d’autres aliments et apporter beaucoup de graisses ou de sucres s’ils sont sucrés. Restez sur les repères et variez.

## Quand demander conseil
Consultez si votre enfant présente des douleurs abdominales, des ballonnements, une diarrhée ou des éruptions cutanées répétées après les produits laitiers, s’il refuse tous les produits laitiers, ou s’il a des fractures à répétition. En cas d’urticaire étendue, de gonflement du visage, de vomissements avec malaise ou de gêne respiratoire après un aliment, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'sel-enfant-reduire-sel-cache', category: 'alimentation',
    title: 'Le sel dans l’alimentation de l’enfant : où il se cache et comment le réduire',
    summary: 'Pourquoi limiter le sel dès l’enfance, les principaux aliments salés et des astuces pour assaisonner autrement.',
    tags: ['sel', 'sel caché', 'saler', 'chips', 'charcuterie', 'fromage', 'pain', 'plats préparés', 'sel iodé'],
    sources: [S.santeSel, S.ansesAvis, S.ameliSuivi],
    body_md: `## En bref
- L’Anses recommande de **ne pas ajouter de sel** lors de la préparation ni à table pour les enfants.
- L’essentiel du sel consommé est **caché** : pain, fromages, charcuteries, plats préparés, soupes, biscuits, condiments.
- Herbes, épices douces, aromates et citron permettent de donner du goût sans sel.
- Quand vous salez, choisissez du **sel iodé**.

## Comprendre
Un excès de sel favorise l’hypertension artérielle, qui peut à son tour entraîner des maladies cardiovasculaires. Pour les adultes, Santé publique France fixe un repère de **5 g de sel par jour maximum**. Santé publique France précise que les enfants n’ont pas les mêmes besoins que les adultes, et qu’avant 1 an il ne faut pas saler les aliments du bébé.

L’Anses recommande pour les enfants de **ne pas ajouter de sel** lors de la préparation des aliments ni au moment de les consommer.

**Sel visible et sel caché.** Le sel visible est celui qu’on ajoute en cuisinant ou à table. Le sel caché, présent naturellement ou ajouté lors de la fabrication, est la **principale source** de sel : pain, fromages, charcuteries, condiments (moutarde, bouillon cube), plats préparés, soupes industrielles, biscuits apéritifs.

Santé publique France donne des repères parlants : environ **1 g de sel** (un cinquième de la limite quotidienne d’un adulte) correspond à une rondelle de saucisson, une poignée de biscuits apéritifs, un tiers de sandwich, un bol de soupe, 4 tranches de pain ou une part de pizza.

**Le sel iodé.** Santé publique France conseille de choisir du sel iodé, l’iode étant indispensable au bon fonctionnement de la thyroïde.

## Au quotidien
**En cuisine**
- Salez peu l’eau de cuisson des pâtes, du riz et des légumes, voire pas du tout.
- Relevez les plats avec des herbes (persil, basilic, ciboulette, coriandre, fraîches, séchées ou surgelées), des aromates (ail, oignon, échalote), des épices douces (cumin, paprika doux, curcuma), un zeste ou un filet de citron.
- Cuisinez maison quand vous le pouvez : vous maîtrisez la quantité de sel.
- Ne resalez pas les conserves, déjà salées.

**À table**
- Retirez la salière de la table, ou gardez-la pour les adultes.
- Apprenez à votre enfant à goûter avant de saler.

**Au supermarché**
- Limitez les plats préparés, charcuteries, biscuits apéritifs et snacks salés.
- Pour les plats préparés, choisissez celui qui a le meilleur Nutri-Score dans son rayon.
- Variez les fromages : les fromages à pâte fondue et les bleus sont très salés, la mozzarella l’est moins.

**Pour l’apéritif ou les anniversaires**
Remplacez chips et cacahuètes par des tomates cerises (coupées pour les plus jeunes), des radis, des bâtonnets de carotte ou de concombre avec du houmous, des dés de fromage.

## Questions fréquentes
**Mon enfant trouve les plats fades sans sel…**
Réduisez petit à petit plutôt que d’un coup, et misez sur les herbes, les aromates et les épices douces, comme le conseille Santé publique France.

**Le pain est-il trop salé pour un enfant ?**
Le pain fait partie des féculents recommandés, mais il contient du sel : 4 tranches représentent environ 1 g de sel. Proposez-le à chaque repas en quantité adaptée à l’appétit, sans en faire un en-cas permanent.

**Le sel de mer ou le sel rose sont-ils meilleurs ?**
Ce sont aussi du sel : les mêmes repères s’appliquent. Le sel iodé reste le choix conseillé quand on sale.

**Les bouillons cubes sont-ils à éviter ?**
Ils sont très salés : utilisez-les avec parcimonie, ou remplacez-les par des herbes et des légumes qui parfument le bouillon.

## Quand demander conseil
Les examens de suivi (à 4, 5, 6 ans et entre 8 et 9 ans) sont l’occasion de parler de l’alimentation au médecin, notamment si votre enfant consomme beaucoup de produits salés, s’il est en surpoids ou s’il existe des antécédents d’hypertension dans la famille. Si un jeune enfant a avalé une grande quantité de sel (par exemple une salière), appelez le **15** ou un centre antipoison, même sans symptôme ; s’il vomit, est somnolent ou fait un malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'matieres-grasses-charcuterie-panes-enfant', category: 'alimentation',
    title: 'Huiles, beurre, charcuterie, fritures : les matières grasses chez l’enfant',
    summary: 'Quelles matières grasses privilégier dans la cuisine familiale, et comment limiter charcuteries, produits panés et fritures sans les bannir.',
    tags: ['matières grasses', 'huile de colza', 'huile d’olive', 'beurre', 'charcuterie', 'frites', 'nuggets', 'graisses saturées'],
    sources: [S.santeReco, S.ameliAliments, S.santeReduire],
    body_md: `## En bref
- Les enfants ont besoin de matières grasses, mais pas de n’importe lesquelles.
- Santé publique France recommande de privilégier les huiles de **colza, de noix et d’olive**.
- Limitez les graisses saturées : charcuterie, beurre, crème, produits panés et frits.
- Avant 11 ans, la charcuterie reste **occasionnelle**, sauf le jambon blanc et la charcuterie de volaille.

## Comprendre
Les matières grasses font partie d’une alimentation équilibrée : elles apportent de l’énergie et des acides gras indispensables, dont les oméga-3. Le tout est de choisir les bonnes et d’en limiter certaines.

**À privilégier.** Dans ses recommandations pour toute la famille, Santé publique France conseille d’« aller vers » les huiles de colza, de noix et d’olive. Les huiles de colza et de noix sont riches en oméga-3, comme les poissons gras et les noix.

**À limiter.** L’Assurance Maladie recommande, chez l’enfant de 3 à 18 ans, de limiter les graisses saturées (charcuterie, beurre, crème), les produits panés et frits, et de choisir des morceaux de viande maigres. Elle précise :
- avant 11 ans, la charcuterie se consomme seulement de temps en temps, à l’exception du jambon blanc et de la charcuterie de volaille ;
- les produits panés (nuggets) et les burgers sont souvent ultra-transformés : lisez les étiquettes.

Santé publique France rappelle aussi que les produits ultra-transformés sont souvent gras, sucrés ou salés et contiennent des additifs ; elle conseille de les réduire et de préférer, quand on les achète, ceux qui ont la liste d’additifs la plus courte.

## Au quotidien
**Dans la cuisine familiale**
- Assaisonnez les crudités et salades avec de l’huile de colza ou de noix, ou un mélange colza-olive.
- Cuisinez avec de l’huile d’olive ou de colza.
- Gardez le beurre pour la tartine du matin ou une touche sur les légumes, en petite quantité.
- Préférez les cuissons vapeur, au four, en papillote, à la poêle avec peu de matière grasse.

**Charcuterie et apéritif**
- Le jambon blanc (de préférence avec le meilleur Nutri-Score) peut figurer dans le sandwich ou les pâtes.
- Saucisson, chorizo, pâtés, rillettes et lardons restent occasionnels.
- Pour l’apéritif familial, préférez des légumes à croquer, du houmous, des dés de fromage.

**Frites, nuggets, panés : sans les bannir**
- Gardez-les pour certains repas, accompagnés de légumes ou d’une salade.
- Faites des frites au four avec un filet d’huile, et des panures maison (chapelure ou flocons d’avoine) cuites au four.
- Comparez les produits surgelés panés avec le Nutri-Score.

**Lire les étiquettes**
Le Nutri-Score permet de comparer des produits d’un même rayon ou consommés à la même occasion. Limitez ceux classés D ou E.

## Questions fréquentes
**Faut-il donner du lait écrémé ou des produits allégés à un enfant ?**
L’Assurance Maladie indique que le lait demi-écrémé convient dès 3 ans. Pour le reste, l’important est l’équilibre général de l’alimentation plutôt que le recours aux produits allégés. En cas de surpoids, demandez conseil au médecin, qui accompagnera les ajustements.

**Le beurre est-il interdit ?**
Non. Il peut être utilisé en petite quantité ; l’idée est de varier et de donner une large place aux huiles végétales recommandées.

**Les pâtes à tartiner chocolatées entrent-elles dans les matières grasses ?**
Elles sont à la fois très sucrées et grasses : Santé publique France les cite parmi les produits à limiter. Une tartine de pain avec un peu de chocolat ou de beurre et de confiture est une alternative.

**Les fritures font-elles partie des repas de fête ?**
Oui, ponctuellement. Ce qui compte, c’est la fréquence : pas tous les jours, et de préférence accompagnées de légumes.

## Quand demander conseil
Parlez-en au médecin si votre enfant prend du poids rapidement, s’il existe dans la famille des antécédents de cholestérol élevé ou de maladie cardiovasculaire précoce, ou s’il a souvent mal au ventre après des repas gras. En cas de brûlure par de l’huile chaude en cuisine, refroidissez immédiatement la zone sous l’eau tempérée et appelez le **15** ou le **112** si la brûlure est étendue, profonde, ou touche le visage, les mains ou les parties génitales.

${FIN}`,
  },
  {
    ...K, slug: 'cuisiner-avec-son-enfant-par-age-securite', category: 'alimentation',
    title: 'Cuisiner avec son enfant : idées par âge et règles de sécurité',
    summary: 'Pourquoi associer l’enfant à la cuisine, quelles tâches lui confier de 3 à 10 ans et comment le faire en sécurité et avec hygiène.',
    tags: ['cuisiner avec son enfant', 'cuisine enfant', 'recettes enfant', 'atelier cuisine', 'sécurité', 'hygiène', 'goûts'],
    sources: [S.spf411, S.santeGouts, S.spfShu],
    body_md: `## En bref
- Cuisiner avec son enfant fait partie des conseils d’éducation alimentaire de Santé publique France.
- Un enfant qui a préparé un plat a souvent plus envie d’y goûter.
- Chaque âge a ses tâches : laver et mélanger vers 3-4 ans, couper des aliments tendres avec un couteau adapté vers 6-7 ans, suivre une recette simple vers 8-10 ans.
- Lavage des mains, surveillance près des sources de chaleur et pas de pâte crue à goûter.

## Comprendre
Santé publique France encourage les parents d’enfants de 4 à 11 ans à manger ensemble à table, à éviter les écrans pendant les repas, à respecter l’appétit de l’enfant sans le forcer, et à **cuisiner avec lui**. Elle propose sur son site Manger Bouger des « recettes à 4 mains » à réaliser en famille.

Cuisiner ensemble permet à l’enfant de toucher, sentir, observer les aliments, de comprendre d’où ils viennent et comment ils se transforment. Santé publique France rappelle que les goûts se construisent à partir des expériences vécues : manipuler un légume, le voir changer à la cuisson, c’est déjà une expérience de goût.

C’est aussi un moment de partage, qui développe l’autonomie, la motricité fine, le langage (nommer les ingrédients, les ustensiles) et même les mathématiques (compter, peser, mesurer).

## Au quotidien
**Des tâches selon l’âge (à adapter à chaque enfant)**
- **3-4 ans** : laver les légumes et les fruits, déchirer la salade, verser des ingrédients déjà mesurés, mélanger, étaler une pâte, décorer une assiette.
- **5-6 ans** : casser un œuf, peser avec une balance, éplucher avec un économe adapté et sous surveillance, presser un agrume, couper des aliments tendres (banane, champignon) avec un couteau à bout rond.
- **7-8 ans** : lire une recette simple, mesurer seul, couper des légumes avec un petit couteau, toujours sous surveillance, préparer une vinaigrette, garnir une tarte.
- **9-10 ans** : suivre une recette complète, utiliser la plaque ou le four avec un adulte à côté, préparer un goûter ou une entrée pour la famille.

**Des recettes simples pour commencer**
- salade de fruits de saison ;
- houmous et bâtonnets de légumes ;
- pizza maison (pâte achetée ou maison) garnie de légumes ;
- soupe de légumes mixée ;
- crêpes à la farine semi-complète ;
- compote de pommes sans sucre ajouté ;
- crumble aux fruits.

**Les règles d’hygiène**
- Se laver les mains à l’eau et au savon avant de commencer, et après avoir touché de la viande crue ou des œufs.
- Laver soigneusement les fruits, légumes et herbes mangés crus.
- Séparer les aliments crus des aliments cuits.
- **Ne pas goûter la pâte crue** à base de farine (cookies, gâteau, pizza) : Santé publique France déconseille de consommer crues ces préparations.

**Les règles de sécurité**
- Un adulte reste toujours à côté pendant l’utilisation des couteaux, de l’économe, des plaques et du four.
- Tournez les manches des casseroles vers l’intérieur et utilisez de préférence les feux arrière.
- Gardez les jeunes enfants à distance des plats chauds, de l’huile chaude et de la vapeur.
- Rangez les couteaux et les appareils électriques (mixeur, robot) hors de portée après usage.
- Un marchepied stable plutôt qu’une chaise pour atteindre le plan de travail.

## Questions fréquentes
**Cuisiner avec un enfant prend du temps…**
Commencez petit : une seule tâche pendant que vous préparez le repas, ou un atelier le week-end. Le temps passé est aussi un temps de jeu et d’échange.

**Mon enfant ne veut pas goûter ce qu’il a préparé…**
Ne le forcez pas : la manipulation est déjà une étape. Il goûtera peut-être la prochaine fois.

**Les ustensiles spéciaux enfants sont-ils utiles ?**
Un couteau à bout rond, un économe adapté à sa main et un tablier suffisent souvent. Vérifiez le marquage CE et l’âge indiqué pour les ustensiles vendus comme jouets.

**Peut-il lécher la cuillère du gâteau ?**
Non si la pâte est crue, même sans œuf : la farine crue peut être contaminée. Proposez-lui plutôt de goûter le gâteau cuit.

## Quand demander conseil
En cas de **brûlure**, refroidissez immédiatement la zone sous l’eau tempérée pendant plusieurs minutes, retirez ce qui n’adhère pas à la peau, et appelez le **15** ou le **112** si la brûlure est étendue, profonde, sur le visage, les mains ou les parties génitales, ou si l’enfant est très jeune. En cas de coupure qui saigne beaucoup ou ne s’arrête pas malgré une compression, appelez aussi le **15**. Une diarrhée sanglante dans les jours qui suivent la consommation de pâte crue ou de viande peu cuite doit faire consulter immédiatement.

${FIN}`,
  },
  {
    ...K, slug: 'repas-en-famille-ambiance-sans-ecran', category: 'alimentation',
    title: 'Le repas en famille : ambiance, écrans, conflits à table',
    summary: 'Pourquoi manger ensemble compte, comment créer une ambiance détendue sans écrans et désamorcer les conflits autour de l’assiette.',
    tags: ['repas en famille', 'à table', 'écrans', 'télévision', 'conflits', 'finir son assiette', 'récompense', 'ambiance'],
    sources: [S.ameliRepas, S.spf411, S.ameliSurpoids],
    body_md: `## En bref
- Le déjeuner et le dîner se prennent à **horaires réguliers**, si possible **en famille**.
- Les repas sans écran, au calme, avec le temps de manger, aident l’enfant à écouter sa faim.
- Ne pas obliger à finir l’assiette, ne pas utiliser la nourriture comme récompense ou punition.
- Le repas est aussi un moment d’échange : l’enfant apprend en imitant les adultes.

## Comprendre
L’Assurance Maladie recommande des repas à horaires réguliers, si possible en famille, dans une ambiance sereine, sans écrans, avec assez de temps pour ne pas manger trop vite. Elle conseille de ne pas obliger l’enfant à finir son assiette et d’écouter sa faim et sa satiété.

Santé publique France, dans ses repères pour les 4-11 ans, cite les mêmes leviers d’éducation alimentaire : manger ensemble à table, éviter les écrans, cuisiner avec les enfants et respecter leur appétit sans jamais les forcer.

Les écrans pendant le repas détournent l’attention des sensations de faim et de satiété et facilitent le grignotage. L’Assurance Maladie, dans ses conseils pour prévenir le surpoids, recommande des repas sans écran, centrés sur la famille, et pas de télévision dans la chambre.

Manger ensemble ne veut pas dire repas parfaits : un repas simple partagé dans la bonne humeur a plus de valeur qu’un repas élaboré sous tension.

## Au quotidien
**Créer une ambiance détendue**
- Éteignez la télévision et posez les téléphones (adultes compris) loin de la table.
- Fixez des horaires réguliers ; prévenez quelques minutes avant pour que l’enfant termine son jeu.
- Laissez à l’enfant le temps de manger, sans se presser, comme le recommande l’Assurance Maladie.
- Parlez d’autre chose que de la nourriture : la journée, un projet, un souvenir.

**Impliquer l’enfant**
- Mettre la table, servir l’eau, apporter le pain, choisir un légume pour la semaine.
- Se servir soi-même (à partir de 4-5 ans), avec une petite portion d’abord et la possibilité de se resservir.

**Éviter les pièges classiques**
- **« Finis ton assiette »** : remplacez-le par « tu as encore faim ? ».
- **Le dessert récompense** : servez le dessert prévu, qu’il ait mangé ou non son plat, sans en faire une monnaie d’échange.
- **Le chantage, la punition** : ils rendent le repas stressant et peuvent renforcer les refus.
- **Le menu à la carte** : proposez un repas pour toute la famille, avec au moins un aliment que l’enfant accepte (le pain, un féculent), sans cuisiner un second plat.

**Quand il y a des tensions**
Si un repas tourne au conflit, il vaut mieux arrêter calmement que d’insister. Le repas suivant est une nouvelle occasion.

## Questions fréquentes
**Nos horaires ne permettent pas de dîner ensemble tous les soirs…**
Faites ce qui est possible : un petit-déjeuner partagé, les repas du week-end, un adulte qui s’assoit avec l’enfant même s’il ne mange pas. La régularité compte plus que la perfection.

**Mon enfant se lève sans arrêt de table…**
Pour les plus jeunes, rester assis longtemps est difficile. Un repas pas trop long, une chaise confortable, des pieds qui reposent sur un support, et des règles simples (on reste assis tant qu’on mange) aident.

**Faut-il le laisser sortir de table s’il ne mange plus ?**
Vous pouvez lui demander de rester quelques minutes pour partager le moment, puis le laisser sortir. S’il n’a pas mangé, ne compensez pas par un en-cas une heure après : attendez le repas suivant.

**Les écrans l’aident à manger : sans eux, il ne mange rien…**
La transition peut prendre quelques jours. Expliquez la nouvelle règle, proposez des petites portions et maintenez-la dans le calme.

## Quand demander conseil
Parlez-en au médecin si les repas sont devenus une source de conflit permanent, si votre enfant semble anxieux à l’approche des repas, mange très peu de variété, perd du poids ou au contraire en prend rapidement. Si vous vous sentez à bout, le **3114** répond jour et nuit, gratuitement. Si un enfant est en danger dans sa famille, le **119** est joignable à toute heure. En urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'portions-enfant-ecouter-appetit-faim-satiete', category: 'alimentation',
    title: 'Quelle quantité donner à son enfant ? Portions selon l’âge et écoute de l’appétit',
    summary: 'Les repères de portions de Santé publique France selon l’âge, et comment respecter la faim et la satiété de l’enfant.',
    tags: ['portions', 'quantité', 'appétit', 'faim', 'satiété', 'petit mangeur', 'gros appétit', 'surpoids', 'courbe de croissance'],
    sources: [S.spf411, S.santeFL, S.ameliSuivi],
    body_md: `## En bref
- **Entre 4 et 6 ans**, une portion représente en moyenne **la moitié** de celle d’un adulte.
- À partir de **7 ans**, elle augmente progressivement pour rejoindre celle d’un adulte **après 11 ans**.
- L’appétit varie d’un jour à l’autre et d’un enfant à l’autre : on respecte la faim, sans forcer.
- La croissance est suivie par le médecin grâce aux courbes du carnet de santé.

## Comprendre
Santé publique France indique qu’entre 4 et 6 ans, la portion d’un enfant est en moyenne la moitié de celle d’un adulte, qu’elle augmente progressivement à partir de 7 ans et qu’elle atteint celle d’un adulte après 11 ans. Pour les fruits et légumes, un repère pratique est la taille du **poing** de celui qui mange : un petit poing, une petite portion. Pour la viande ou le poisson, cela représente environ 50 g entre 4 et 6 ans.

Ces repères sont des **moyennes**. Un enfant très actif, en pleine poussée de croissance, ou au contraire fatigué et malade, n’aura pas le même appétit. Santé publique France et l’Assurance Maladie recommandent de respecter l’appétit de l’enfant sans jamais le forcer, et d’éviter de lui imposer de finir son assiette.

**Faim et satiété.** Santé publique France recommande de respecter l’appétit de l’enfant sans le forcer. Insister pour qu’il mange davantage, ou au contraire le restreindre sans avis médical, l’éloigne de ses propres repères.

**Le suivi de la croissance.** L’Assurance Maladie rappelle les examens de suivi prévus à 4 ans, 5 ans, 6 ans et entre 8 et 9 ans, remboursés à 100 %. Le médecin mesure et pèse l’enfant, reporte les valeurs sur les courbes du carnet de santé et repère une insuffisance de poids, un surpoids débutant ou un retard de croissance. C’est l’évolution de la courbe, plus qu’une pesée isolée, qui renseigne.

## Au quotidien
**Servir petit, laisser se resservir**
Servez une petite portion de chaque élément du repas. Si l’enfant a encore faim, il peut se resservir. Cela évite le gaspillage et les assiettes « montagne » décourageantes.

**Utiliser une vaisselle adaptée**
Une assiette et des couverts à sa taille aident à proposer des quantités adaptées.

**Repérer les signaux**
- Faim : il réclame, mange avec entrain.
- Satiété : il ralentit, joue avec la nourriture, repousse l’assiette, dit qu’il n’a plus faim.

**Garder des repas réguliers**
Quatre moments par jour, sans grignotage entre les deux, permettent d’arriver à table avec une vraie faim.

**Ne pas compenser**
S’il mange peu à un repas, pas besoin de lui proposer un biscuit une heure plus tard : le repas ou le goûter suivant viendra.

## Questions fréquentes
**Mon enfant mange très peu, est-ce inquiétant ?**
Certains enfants sont de « petits mangeurs ». Si sa croissance suit sa courbe, qu’il est en forme et actif, c’est rassurant. Parlez-en au médecin si vous avez un doute.

**Il mange plus que son grand frère…**
Les besoins varient selon l’âge, la taille, l’activité et le moment de la croissance. Gardez des repas équilibrés et réguliers, et parlez-en au médecin si sa courbe de poids s’accélère.

**Faut-il le peser à la maison ?**
Ce n’est pas nécessaire. Le suivi par le médecin, avec les courbes, est plus fiable et évite de focaliser l’enfant sur son poids.

**Peut-on parler de « régime » à un enfant ?**
Il vaut mieux éviter : en cas de surpoids, le médecin accompagne des ajustements pour toute la famille, sans régime restrictif ni discours culpabilisant.

## Quand demander conseil
Consultez le médecin si la courbe de poids ou de taille change d’allure (cassure, accélération), si votre enfant perd du poids, s’il refuse de manger plusieurs jours de suite, s’il semble préoccupé par son corps ou son poids, ou s’il a une faim et une soif inhabituelles. Si vous percevez chez lui une détresse ou des idées noires, le **3114** répond jour et nuit. En cas de malaise, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...K, slug: 'bien-nourrir-son-enfant-petit-budget', category: 'alimentation',
    title: 'Bien nourrir son enfant avec un petit budget',
    summary: 'Des repères concrets pour une alimentation équilibrée de l’enfant sans dépenser plus : produits de saison, surgelés, légumes secs, aides à la cantine.',
    tags: ['petit budget', 'pas cher', 'économies', 'courses', 'surgelés', 'conserves', 'légumes secs', 'cantine', 'aide'],
    sources: [S.santeFL, S.santeLegSecs, S.eduCantine],
    body_md: `## En bref
- Les **fruits et légumes de saison**, surgelés nature ou en conserve sont économiques et nutritifs.
- Les **légumes secs** (lentilles, pois chiches, haricots) sont peu chers et peuvent remplacer la viande dans certains repas.
- Le **poisson surgelé ou en conserve** a les mêmes qualités nutritionnelles que le frais.
- Des **aides** existent pour la cantine : tarifs selon le quotient familial, fonds social, caisse des écoles.

## Comprendre
Bien manger ne signifie pas manger cher. Santé publique France rappelle que les fruits et légumes surgelés, en conserve ou en bocal ont une très bonne qualité nutritionnelle. Les produits de saison sont moins chers en pleine récolte, et sur les marchés, les prix baissent souvent en fin de matinée.

Les légumes secs sont parmi les aliments les plus économiques. Riches en fibres et en protéines végétales, associés à des féculents (lentilles et riz, pois chiches et semoule), ils peuvent remplacer la viande dans certains repas, comme le recommande Santé publique France.

Pour le poisson, Santé publique France indique que le surgelé (thon, hareng, sardine) est souvent moins cher et a les mêmes qualités nutritionnelles que le frais, et que les conserves permettent des recettes économiques.

Côté école, le ministère de l’Éducation nationale précise qu’en primaire, la participation des familles à la cantine est fixée par la commune, souvent selon le **quotient familial**. Un **fonds social pour les cantines** peut aider les familles, et l’assistante sociale peut être sollicitée en cas de difficulté.

## Au quotidien
**Faire ses courses**
- Préparez une liste à partir des menus de la semaine, en tenant compte de la cantine.
- Achetez les produits de base en format familial ou en vrac (riz, pâtes, semoule, lentilles, flocons d’avoine).
- Comparez le prix au kilo, indiqué sur l’étiquette du rayon.
- Les marques de distributeur ou premiers prix peuvent être de bonne qualité : comparez-les avec le Nutri-Score.

**Les aliments malins**
- légumes surgelés nature (haricots verts, épinards, poêlées sans sauce) ;
- conserves de tomates, de maïs, de pois chiches, de lentilles ;
- sardines et maquereaux en conserve ;
- œufs, une source de protéines économique ;
- pommes de terre, carottes, choux, poireaux, oignons, souvent bon marché ;
- yaourts nature en grand conditionnement, lait, fromage à la coupe.

**Cuisiner pour plusieurs repas**
- Une grande soupe de légumes de saison se congèle en portions.
- Un plat de lentilles ou de pois chiches peut se décliner en salade le lendemain.
- Les restes se gardent au réfrigérateur, refroidis rapidement et bien réchauffés.

**Limiter les dépenses qui pèsent peu sur l’équilibre**
Boissons sucrées, biscuits individuels, céréales « enfant », produits apéritifs et plats préparés coûtent cher pour un intérêt nutritionnel faible. Les réduire libère du budget pour les fruits, les légumes et les produits laitiers.

## Questions fréquentes
**Le bio est-il indispensable pour bien nourrir son enfant ?**
Santé publique France le recommande quand c’est possible, mais la priorité reste de manger des fruits, des légumes, des légumes secs et des féculents complets, bio ou non.

**Les surgelés ont-ils perdu leurs vitamines ?**
Non, Santé publique France indique qu’ils conservent une très bonne qualité nutritionnelle. Choisissez-les nature, sans sauce ni panure.

**Comment payer moins cher la cantine ?**
Renseignez-vous auprès de la mairie ou de la caisse des écoles sur les tarifs selon le quotient familial. Pour le collège ou le lycée, le secrétariat de l’établissement peut vous orienter vers le fonds social.

**Et si nous avons du mal à remplir le réfrigérateur ?**
Les centres communaux d’action sociale (CCAS), les assistantes sociales du département et les associations d’aide alimentaire peuvent vous accompagner. N’hésitez pas à les solliciter.

## Quand demander conseil
Parlez-en au médecin ou à la PMI (jusqu’à 6 ans) si vous avez du mal à assurer une alimentation suffisante, si votre enfant perd du poids, semble souvent fatigué ou pâle. Une assistante sociale peut vous aider dans vos démarches. Si la situation vous pèse moralement, le **3114** répond jour et nuit. En urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
];
