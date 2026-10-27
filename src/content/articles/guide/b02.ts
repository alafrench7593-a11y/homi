/** Guide complet — lot 02 (27/10/2026) : alimentation pendant la grossesse, situations du quotidien. Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
/** Pages officielles françaises réellement lues le 2026-10-27. `published` = date affichée par la page. */
const S = {
  spfBrochure: { label: 'Santé publique France — De la grossesse à l’arrivée de bébé, avec sérénité : alimentation, activité physique et bien-être (brochure 2026)', url: 'https://www.santepubliquefrance.fr/sites/default/files/cadic_files/documents/spf00006707.pdf', consulted_on: C, published: '2026-06-10' },
  santeAlimentation: { label: 'Santé.fr — Enceinte, une alimentation saine et équilibrée durant la grossesse', url: 'https://www.sante.fr/enceinte-une-alimentation-saine-et-equilibree-durant-la-grossesse', consulted_on: C, published: '2025-08-28' },
  santeAliments: { label: 'Santé.fr — Quels aliments éviter et quelles précautions prendre quand on est enceinte ?', url: 'https://www.sante.fr/node/7070507', consulted_on: C, published: '2025-10-15' },
  santeListeriose: { label: 'Santé.fr — Listériose pendant la grossesse, quels aliments éviter ?', url: 'https://www.sante.fr/listeriose-pendant-la-grossesse-quels-aliments-eviter', consulted_on: C, published: '2025-04-25' },
  ameliDigestion: { label: 'ameli.fr — Nausées, vomissements, remontées acides et constipation lors de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/enceinte-problemes-de-digestion', consulted_on: C, published: '2026-06-19' },
  ameliNausees: { label: 'ameli.fr — Nausées et vomissements chez la femme enceinte : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-nausees-et-vomissements/nauses-vomissements-grossesse-consultation-traitement', consulted_on: C, published: '2026-06-22' },
  ameliSurpoids: { label: 'ameli.fr — Surpoids ou obésité : particularités du suivi de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/surpoids-obesite-et-grossesse/surpoids-obesite-suivi-grossesse', consulted_on: C },
  santeDiabete: { label: 'Santé.fr — Diabète gestationnel', url: 'https://www.sante.fr/diabete-gestationnel', consulted_on: C, published: '2026-08-13' },
  ameliDiabete: { label: 'ameli.fr — Diabète gestationnel : diététique, activité physique, insuline et surveillance', url: 'https://www.ameli.fr/assure/sante/themes/diabete-gestationnel/traitement-suivi-femme-enceinte-bebe', consulted_on: C },
  ameliToxo: { label: 'ameli.fr — Toxoplasmose : gestes de prévention à adopter lors de la grossesse', url: 'https://www.ameli.fr/assure/sante/themes/toxoplasmose/prevention', consulted_on: C, published: '2024-05-28' },
  ansesFrigo: { label: 'Anses — Comment garantir l’hygiène des aliments dans son réfrigérateur ?', url: 'https://www.anses.fr/fr/content/comment-garantir-lhygiene-des-aliments-dans-son-refrigerateur', consulted_on: C, published: '2020-12-11' },
  santePoids: { label: 'Santé.fr — La prise de poids pendant la grossesse', url: 'https://www.sante.fr/la-prise-de-poids-pendant-la-grossesse', consulted_on: C, published: '2022-04-01' },
} satisfies Record<string, ArticleSource>;

/** Phrase de fin commune : l'article informe, il ne remplace pas un professionnel. */
const FIN = '_Cet article vous informe ; il ne remplace pas l’avis de la sage-femme, du médecin ou du diététicien qui vous accompagne._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({ journeys: ['pregnant'], status: 'to_review', ...x });

export const GUIDE_B02: LibArticle[] = [
  // ------------------------------------------------------------------ régimes particuliers
  a({
    slug: 'vegetarienne-enceinte-composer-ses-repas',
    title: 'Végétarienne et enceinte : bien composer ses repas',
    summary: 'Poursuivre une alimentation végétarienne pendant la grossesse est possible si elle est bien équilibrée : les nutriments à surveiller et des idées concrètes pour vos assiettes.',
    journeys: ['pregnant', 'ttc'],
    category: 'alimentation-grossesse', tags: ['végétarienne', 'végétarien', 'sans viande', 'protéines', 'fer', 'B12', 'DHA', 'légumineuses'],
    sources: [S.santeAlimentation, S.spfBrochure],
    body_md: `## En bref
- Une alimentation **végétarienne bien équilibrée** peut être poursuivie pendant la grossesse, avec un suivi médical, idéalement dès le projet de bébé.
- Cinq points d’attention : **protéines, fer, vitamine B12, iode et DHA** (un oméga-3).
- Associer **légumineuses et céréales** dans la journée aide à couvrir les besoins en protéines ; œufs, produits laitiers et, si vous en mangez, poisson complètent.
- Une supplémentation (fer, B12, iode) peut être proposée **sur avis médical** selon vos besoins.

## Comprendre
Pendant la grossesse, l’objectif n’est pas de manger deux fois plus mais « deux fois mieux » : une alimentation variée qui apporte au bébé et à vous-même tout ce dont vous avez besoin. Santé.fr rappelle qu’une alimentation végétarienne peut être maintenue si elle est équilibrée et accompagnée d’un suivi.

Sans viande, certains nutriments demandent plus d’attention. Les **protéines** se trouvent dans les œufs, les produits laitiers, les légumineuses (lentilles, pois chiches, haricots secs) et les céréales ; associer les deux dernières dans la journée améliore leur complémentarité. Le **fer** d’origine végétale est moins bien absorbé, et Santé publique France rappelle que le thé bu pendant ou juste avant le repas réduit encore cette absorption. La **vitamine B12** est surtout présente dans les produits animaux. L’**iode** vient notamment du poisson de mer et du sel iodé. Le **DHA**, un oméga-3 utile au développement du bébé, se trouve dans les poissons gras, les œufs enrichis ou les microalgues.

Seul un professionnel peut évaluer un éventuel manque, par exemple avec une prise de sang, et décider d’un complément.

## Au quotidien
- **Légumineuses au moins deux fois par semaine**, et plus souvent si vous ne mangez pas de viande : dahl de lentilles corail avec du riz, chili sans viande, houmous avec du pain complet, salade de pois chiches cuits.
- **Céréales complètes** : au moins un féculent complet par jour (pain, riz, pâtes complètes, flocons d’avoine, quinoa).
- **Œufs bien cuits** : omelette, œuf dur, quiche maison bien cuite. Évitez les œufs crus ou peu cuits et les préparations maison à base d’œufs crus.
- **Produits laitiers** : environ deux par jour selon les repères 2026 de Santé publique France, pasteurisés ou à pâte pressée cuite, en retirant la croûte.
- **Si vous mangez du poisson** : deux fois par semaine, dont un poisson gras (sardine, maquereau, hareng, saumon), toujours bien cuit.
- **Sel iodé**, en petite quantité.
- **Soja** : Santé publique France recommande d’éviter les produits à base de soja pendant la grossesse (boissons, desserts, compléments) ; la sauce soja occasionnelle reste possible. Variez donc les sources de protéines végétales.
- **Thé** : prenez-le plutôt à distance des repas, pour ne pas gêner l’absorption du fer.

### Exemple de journée
Matin : pain complet, fromage à pâte pressée cuite, fruit. Midi : lentilles aux légumes et riz, yaourt. Goûter : fromage blanc et poignée de noix non salées. Soir : omelette, poêlée de légumes, pâtes complètes, compote.

## Questions fréquentes
**Dois-je recommencer à manger de la viande ?**
Non, rien ne l’impose si votre alimentation est variée et suivie. Parlez de vos habitudes dès la première consultation pour adapter le suivi.

**Faut-il prendre des compléments d’office ?**
L’acide folique (vitamine B9) est conseillé à toutes, dès le projet de grossesse. Les autres compléments (fer, B12, iode) ne se prennent que sur prescription, selon vos besoins.

**Les galettes végétales du commerce sont-elles un bon choix ?**
Elles dépannent. Lisez la liste des ingrédients : évitez celles à base de soja et privilégiez les produits peu transformés, au meilleur Nutri-Score.

**Et si je ne mange ni œufs ni produits laitiers ?**
On parle alors d’alimentation végétalienne, qui demande un accompagnement plus rapproché (voir l’article dédié).

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si vous êtes très fatiguée, essoufflée, pâle, si vous perdez du poids ou si vous avez du mal à varier vos repas. Un diététicien peut vous aider à construire vos menus. ${URG}

${FIN}`,
  }),
  a({
    slug: 'vegetalienne-vegan-enceinte-suivi',
    title: 'Végétalienne (vegan) et enceinte : ce qu’il faut savoir',
    summary: 'Une alimentation sans aucun produit animal expose à des manques pendant la grossesse : pourquoi un accompagnement rapproché et une supplémentation sont recommandés.',
    journeys: ['pregnant', 'ttc'],
    category: 'alimentation-grossesse', tags: ['végétalienne', 'vegan', 'végane', 'B12', 'fer', 'iode', 'oméga-3', 'carences'],
    sources: [S.santeAlimentation, S.spfBrochure],
    body_md: `## En bref
- Sans aucun produit animal, le risque de manque en **vitamine B12, fer, iode et acides gras essentiels** est réel pendant la grossesse.
- Santé.fr recommande une **supplémentation vitaminique** et un **suivi rapproché**, y compris avec un diététicien.
- Signalez votre alimentation **dès le projet de grossesse** ou la première consultation.
- Il ne s’agit pas de vous juger : l’objectif est de protéger votre santé et celle de votre bébé.

## Comprendre
L’alimentation végétalienne exclut viande, poisson, œufs, produits laitiers et souvent miel. Pendant la grossesse, les besoins de certains nutriments augmentent, et quelques-uns sont difficiles à obtenir sans produits animaux.

La **vitamine B12** en est l’exemple le plus net : elle est presque absente des végétaux. Santé publique France rappelle que le végétalisme expose à une carence en B12, à évaluer avec un professionnel de santé qui peut prescrire un supplément. Le **fer** végétal est moins bien absorbé. L’**iode** et les **oméga-3 à longue chaîne** (DHA) sont surtout apportés par les produits de la mer. Le **calcium** demande aussi de l’attention sans produits laitiers : Santé publique France conseille d’en parler à un professionnel pour couvrir vos besoins.

Santé.fr décrit des risques sérieux en cas de carences et insiste sur deux points : une supplémentation et une surveillance attentive. Ce suivi permet d’ajuster les apports au fil des trimestres.

## Au quotidien
- **Prenez rendez-vous avec un diététicien** dès que possible : il évaluera vos apports réels et proposera des menus adaptés.
- **Ne commencez aucun complément de vous-même**, en particulier les produits « grossesse » ou enrichis cumulés : Santé.fr met en garde contre le risque de surdosage. Suivez la prescription.
- **Légumineuses tous les jours** : lentilles, pois chiches, haricots, pois cassés, associées à des céréales complètes.
- **Fruits à coque et graines** non salés : une petite poignée par jour (noix, amandes), et des huiles de colza ou de noix pour les oméga-3.
- **Sources de calcium végétales** : certains légumes verts, légumes secs, amandes ; votre professionnel vous dira si cela suffit.
- **Soja** : Santé publique France recommande d’éviter les produits à base de soja pendant la grossesse. Cela réduit les options végétaliennes habituelles ; d’où l’intérêt d’un accompagnement pour varier.
- **Sel iodé** en petite quantité.
- **Thé** : à distance des repas pour ne pas gêner l’absorption du fer.

### Questions à poser en consultation
- Quels examens pour vérifier la B12, le fer et l’iode ?
- Quel complément, et jusqu’à quand ?
- Comment couvrir le calcium et les oméga-3 ?
- Que prévoir pour l’allaitement si je le souhaite ?

## Questions fréquentes
**Puis-je rester végétalienne pendant toute ma grossesse ?**
C’est une discussion à mener avec votre médecin ou votre sage-femme. Les recommandations insistent sur la supplémentation et le suivi rapproché plutôt que sur un arrêt imposé.

**Les boissons végétales remplacent-elles le lait ?**
Elles n’ont pas la même composition. Celles au soja sont à éviter pendant la grossesse selon Santé publique France. Demandez conseil pour les autres.

**Les aliments enrichis en B12 suffisent-ils ?**
Seul un professionnel peut le dire, au vu de vos apports et de vos analyses.

**Et après la naissance ?**
Parlez de votre projet d’allaitement avec votre professionnel : le suivi diététique et les compléments sont à réévaluer à ce moment-là.

## Quand demander conseil
Consultez sans tarder en cas de grande fatigue, d’essoufflement, de fourmillements dans les mains ou les pieds, de pâleur, de perte de poids ou si vous ne parvenez pas à suivre vos compléments. ${URG}

${FIN}`,
  }),
  a({
    slug: 'manger-moins-de-viande-enceinte-flexitarien',
    title: 'Manger moins de viande pendant la grossesse : repères et idées',
    summary: 'Vous mangez peu de viande ou souhaitez en réduire la quantité : comment équilibrer vos repas pendant la grossesse avec la volaille, le poisson, les œufs et les légumineuses.',
    category: 'alimentation-grossesse', tags: ['flexitarien', 'moins de viande', 'légumineuses', 'volaille', 'protéines', 'repères'],
    sources: [S.spfBrochure, S.santeAlimentation, S.santeAliments],
    body_md: `## En bref
- Santé publique France conseille de **privilégier la volaille** et de limiter les autres viandes à **500 g par semaine**.
- La **charcuterie** est à limiter à **150 g par semaine**, de préférence des produits à cuire soi-même.
- Les **légumineuses**, au moins **deux fois par semaine**, sont une bonne source de protéines et de fibres.
- Le **poisson deux fois par semaine**, dont un gras, et les **œufs bien cuits** complètent.

## Comprendre
Beaucoup de futures mères réduisent la viande, par goût, par dégoût passager ou pour des raisons de budget. Bonne nouvelle : les repères officiels vont dans ce sens. Dans sa brochure 2026, Santé publique France recommande de privilégier la volaille, de limiter les autres viandes (bœuf, porc, veau, agneau…) à 500 g par semaine et la charcuterie à 150 g par semaine.

La viande apporte des protéines et du fer, en particulier la viande rouge. Si vous en mangez moins, il faut simplement veiller à trouver ces apports ailleurs : poisson, œufs, produits laitiers, légumineuses associées à des céréales. Santé publique France rappelle aussi que manger moins de viande et plus de produits de saison peut aider à maîtriser son budget.

Quelle que soit la viande, elle doit être **bien cuite à cœur** pendant la grossesse, pour prévenir la toxoplasmose : sans jus rosé à la coupe, selon ameli. Le foie et les produits à base de foie sont à éviter en raison de leur teneur en vitamine A.

## Au quotidien
- **Planifiez la semaine** : par exemple deux repas de volaille, un ou deux de viande rouge, deux de poisson, deux ou trois avec légumineuses ou œufs.
- **Associez** légumineuses et céréales : lentilles et riz, pois chiches et semoule, haricots rouges et maïs, pois cassés et pain.
- **Mélangez** : un plat avec moitié moins de viande hachée et des lentilles (bolognaise, chili, farce de légumes).
- **Œufs** : durs, en omelette, en quiche bien cuite. Pas d’œufs à la coque ni de mayonnaise maison.
- **Poisson bien cuit** : papillote de cabillaud, sardines grillées, maquereau au four. Évitez espadon, marlin, siki, requin et lamproie ; limitez anguille, lotte, bar, dorade, raie et thon.
- **Charcuterie** : préférez les produits à cuire (saucisses, boudin) bien cuits ; évitez rillettes, pâtés, foie gras, saucisson sec et jambon sec, ainsi que le jambon cuit non recuit.
- **Fer** : prenez le thé à distance des repas.

### Idées de plats
Curry de pois chiches et épinards, dahl de lentilles corail, galettes de haricots maison, gratin de pâtes complètes au poulet, omelette aux légumes, soupe de pois cassés.

## Questions fréquentes
**Je n’ai plus du tout envie de viande depuis que je suis enceinte, est-ce un problème ?**
Les dégoûts sont fréquents. Compensez avec poisson, œufs, produits laitiers et légumineuses, et parlez-en si cela dure ou si vous mangez peu.

**Le steak haché doit-il être bien cuit ?**
Oui, comme toutes les viandes : cuit à cœur, sans partie rosée.

**Le jambon blanc est-il autorisé ?**
Les charcuteries cuites prêtes à consommer, comme le jambon, sont déconseillées par Santé.fr sauf si vous les recuisez (dans un gratin, une quiche, une pizza bien chaude).

**Faut-il un complément de fer si je mange peu de viande ?**
Seul un professionnel peut évaluer ce besoin, souvent à partir d’une prise de sang.

## Quand demander conseil
Parlez-en lors du suivi si vous êtes très fatiguée, essoufflée, si vous mangez très peu ou si votre alimentation devient très restreinte. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ envies, dégoûts, nausées
  a({
    slug: 'envies-alimentaires-grossesse',
    title: 'Les envies alimentaires pendant la grossesse : les écouter sans se laisser déborder',
    summary: 'Envie soudaine de sucré, de salé ou d’un aliment précis : comment composer avec ces envies tout en gardant des repas équilibrés et sûrs.',
    category: 'alimentation-grossesse', tags: ['envies', 'fringales', 'sucré', 'salé', 'plaisir', 'grignotage'],
    sources: [S.santePoids, S.spfBrochure, S.ameliSurpoids],
    body_md: `## En bref
- Les petites faims et envies de grignoter sont **fréquentes**, surtout en début de grossesse.
- Le **plaisir** a toute sa place : il s’agit de trouver un équilibre, pas de se priver.
- Des **repas complets et riches en fibres** aident à limiter les fringales.
- Si les envies portent sur des aliments à éviter (lait cru, alcool…), il existe souvent une **version adaptée**.

## Comprendre
Santé.fr indique que les petites faims et les envies de grignoter sont courantes pendant la grossesse, en particulier au début. Elles peuvent viser le sucré, le salé, un aliment précis ou une texture (croquant, frais, acide).

Il n’est pas utile de culpabiliser. Le message des autorités de santé est de manger « deux fois mieux, pas deux fois plus » : les besoins n’augmentent que légèrement, même avec des jumeaux, selon Santé publique France. Céder de temps en temps à une envie fait partie de la vie ; c’est la répétition quotidienne de produits très sucrés ou gras qui peut peser sur la prise de poids et l’équilibre.

Si les envies de sucre ou de gras deviennent difficiles à gérer, ameli rappelle qu’un diététicien ou un médecin peut vous accompagner, et aussi repérer un éventuel trouble du comportement alimentaire, qui peut réapparaître pendant la grossesse.

## Au quotidien
- **Ne sautez pas de repas** : trois repas par jour limitent les fringales, et une collation peut s’ajouter à partir du 2e trimestre.
- **Misez sur les fibres** aux repas : légumes, fruits, céréales complètes, légumineuses. Elles « calent » plus longtemps.
- **Gardez une partie du repas pour plus tard** : Santé publique France suggère de manger le plat principal, puis de garder le produit laitier ou le fruit pour une petite faim.
- **Buvez de l’eau** : elle aide à équilibrer l’appétit.
- **Envie de sucré** : fruit entier, compote, yaourt nature avec un fruit, pain complet et un carré de chocolat. Préférez le fruit entier au jus, que Santé.fr range parmi les boissons sucrées.
- **Envie de salé** : quelques fruits à coque non salés, bâtonnets de légumes avec une sauce au fromage blanc, pain complet avec du fromage à pâte pressée cuite.
- **Envie d’un aliment à éviter** : fromage au lait cru → fromage à pâte pressée cuite sans la croûte, ou fromage bien cuit dans un plat chaud ; sushis → maki aux légumes ou poisson cuit ; tiramisu maison → version industrielle ou dessert sans œuf cru ; boisson alcoolisée → cocktail sans alcool maison.
- **Courses** : n’achetez pas en grande quantité ce qui vous fait craquer, et gardez à portée de main des collations simples.

## Questions fréquentes
**Les envies traduisent-elles un manque ?**
Aucune source officielle ne permet de l’affirmer. Si vous vous sentez très fatiguée ou avez des envies inhabituelles (terre, glace en grande quantité, objets non alimentaires), parlez-en à votre professionnel de santé.

**Puis-je manger du chocolat ?**
Oui, avec modération. Le chocolat contient un peu de caféine, à prendre en compte avec le café et le thé.

**Je grignote le soir, que faire ?**
Vérifiez que votre dîner est assez complet (légumes, féculent, protéines) et prévoyez un produit laitier ou un fruit pour plus tard.

**Les envies sont-elles plus fortes avec le diabète gestationnel ?**
Pas nécessairement, mais si vous êtes concernée, l’équipe qui vous suit vous aidera à les intégrer à vos repas.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si les envies s’accompagnent d’une prise de poids rapide, de pertes de contrôle répétées, de vomissements provoqués ou d’une grande détresse. En cas de souffrance psychique, le **3114** répond 24 h/24. ${URG}

${FIN}`,
  }),
  a({
    slug: 'degouts-aversions-alimentaires-grossesse',
    title: 'Dégoûts et aversions alimentaires pendant la grossesse : comment s’adapter',
    summary: 'Plus envie de viande, de café ou de légumes, odeurs insupportables : des solutions pour continuer à manger varié malgré les dégoûts.',
    max_week: 20,
    category: 'alimentation-grossesse', tags: ['dégoût', 'aversion', 'odeurs', 'nausées', 'viande', 'légumes', 'premier trimestre'],
    sources: [S.ameliDigestion, S.spfBrochure, S.santeAlimentation],
    body_md: `## En bref
- Les changements hormonaux du début de grossesse rendent certaines **odeurs** et certains **goûts** difficiles à supporter.
- Ces gênes s’atténuent **le plus souvent après le 3e mois**.
- L’idée : **remplacer** l’aliment rejeté par un autre du même groupe, plutôt que de supprimer tout un groupe.
- Des **aliments froids et peu odorants** sont souvent mieux tolérés.

## Comprendre
Au premier trimestre, beaucoup de futures mères découvrent qu’un aliment autrefois apprécié leur devient insupportable : la viande, le poisson, le café, l’ail, les plats en sauce, parfois même l’odeur du frigo. Ameli explique que les nausées sont liées aux changements hormonaux et aggravées par certaines odeurs. Elles disparaissent le plus souvent après le troisième mois.

Ces dégoûts ne sont pas une faute ni un caprice. Le principal enjeu est de garder une alimentation suffisamment variée pendant cette période. Santé publique France le dit simplement : manger ce que l’on peut, quand on peut. Les repères d’équilibre se retrouvent ensuite progressivement.

## Au quotidien
### Remplacer dans le même groupe
- **Viande rejetée** → œufs bien cuits, poisson bien cuit, volaille froide en salade, légumineuses, produits laitiers.
- **Poisson rejeté** → l’iode peut venir du sel iodé ; revenez au poisson quand ce sera possible, en commençant par un poisson blanc au goût doux.
- **Légumes rejetés** → fruits, soupes froides (gaspacho, velouté froid), légumes râpés bien lavés, purées.
- **Produits laitiers rejetés** → fromage à pâte pressée cuite en petits dés, yaourt bien frais, lait dans une préparation (semoule au lait, flan).
- **Café rejeté** → parfait : Santé publique France conseille de toute façon de ne pas dépasser 3 tasses par jour.

### Gérer les odeurs
- **Aérez** la cuisine et la maison régulièrement, comme le conseille ameli.
- **Préférez le froid** : salades composées, sandwichs, taboulé, plats servis tièdes.
- **Déléguez la cuisine** quand c’est possible, ou cuisinez fenêtre ouverte, hotte en marche.
- **Évitez** la fumée de cigarette et les odeurs fortes.
- Rangez les aliments entamés dans des **boîtes hermétiques** : le frigo sent moins, et c’est aussi plus hygiénique.

### Garder le cap
- Ne restez **pas trop longtemps l’estomac vide** : petites quantités, souvent.
- **Buvez entre les repas** plutôt que pendant.
- Notez ce qui passe bien : cela aide à faire les courses et à préparer des repas sans y réfléchir.

## Questions fréquentes
**Mon bébé manque-t-il de quelque chose si je ne mange plus de viande pendant quelques semaines ?**
Si vous compensez avec d’autres sources de protéines et de fer, l’alimentation peut rester équilibrée. Parlez-en lors de votre suivi si le dégoût dure.

**Je ne supporte plus l’eau plate, que boire ?**
Essayez l’eau gazeuse, l’eau très fraîche, aromatisée de rondelles de citron ou de concombre, ou des infusions froides. Limitez les boissons sucrées à un verre par jour.

**Les dégoûts peuvent-ils durer toute la grossesse ?**
Ils s’atténuent le plus souvent après le premier trimestre, mais certaines aversions persistent. L’essentiel est de trouver des remplaçants.

**Est-ce que je peux me forcer ?**
Inutile de vous forcer jusqu’au malaise. Proposez-vous l’aliment sous une autre forme, plus tard.

## Quand demander conseil
Consultez si vous ne parvenez plus à manger ni à boire, si vous perdez du poids, si vous vomissez plusieurs fois par jour ou si vous vous sentez très faible. Des urines foncées et rares, une bouche sèche ou des vertiges doivent faire consulter rapidement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'manger-avec-des-nausees-idees-de-repas',
    title: 'Manger malgré les nausées : idées de repas et de collations',
    summary: 'Quand tout vous écœure, quelques principes simples et des idées concrètes, du réveil au coucher, pour continuer à vous alimenter.',
    max_week: 20,
    category: 'alimentation-grossesse', tags: ['nausées', 'mal au cœur', 'repas', 'collations', 'réveil', 'premier trimestre', 'idées'],
    sources: [S.ameliDigestion, S.santeAlimentation, S.spfBrochure],
    body_md: `## En bref
- **Petites quantités, souvent** : ne laissez pas l’estomac vide trop longtemps.
- **Mangez ce qui vous fait envie**, parmi les aliments autorisés.
- **Buvez entre les repas** plutôt que pendant.
- Préférez des aliments **froids, peu odorants**, peu gras et peu épicés.
- Une petite collation **dès le réveil** aide souvent.

## Comprendre
Les nausées du début de grossesse sont liées aux changements hormonaux. Elles disparaissent le plus souvent après le troisième mois, selon ameli. Pendant cette période, l’objectif n’est pas un équilibre parfait à chaque repas : Santé publique France invite à manger ce que l’on peut, quand on peut.

Plusieurs conseils reviennent dans les sources officielles : fractionner les repas en petites portions avec des collations, éviter les aliments gras ou épicés, bien s’hydrater, manger quelque chose de léger au réveil. Le gingembre est parfois évoqué ; Santé.fr précise qu’il se prend sur avis médical.

## Au quotidien
### Au réveil
Gardez près du lit quelque chose de simple : biscottes, pain grillé, quelques biscuits secs, un verre d’eau. Mangez avant de vous lever, puis levez-vous doucement.

### Dans la journée
- **Toutes les deux à trois heures**, une petite prise : yaourt, fruit, tartine, fromage à pâte pressée cuite, compote, quelques amandes non salées.
- **Plats froids ou tièdes** : taboulé, salade de pâtes, riz au lait, semoule, œuf dur, sandwich au poulet bien cuit, gaspacho.
- **Féculents simples** : riz, pâtes, pommes de terre, pain. Ils sont souvent bien tolérés et apportent de l’énergie ; préférez-les complets quand ça passe, pour les fibres.
- **Goûts frais** : certaines futures mères tolèrent mieux un fruit très frais ou une boisson fraîche.
- **Mangez lentement**, dans un endroit aéré.

### Boire
- Petites gorgées **entre les repas**.
- Eau plate ou gazeuse, bien fraîche, infusions froides.
- Évitez la caféine, que ameli conseille de limiter en cas de nausées.

### Ce qui aide autour du repas
- Aérer la pièce, cuisiner le moins possible soi-même, éviter la fumée de cigarette.
- Ne pas vous allonger juste après avoir mangé.
- Si vous vomissez : rincez-vous la bouche à l’eau, puis attendez au moins une heure avant de vous brosser les dents pour protéger l’émail, comme le recommande ameli.

### Garder les bons réflexes de sécurité
Même avec des nausées, gardez les précautions alimentaires de la grossesse : pas de lait cru, de viande ou de poisson crus, d’œufs crus. Les biscottes et le riz sont pratiques ; les plats préparés achetés doivent être réchauffés bien chauds.

## Questions fréquentes
**Mon bébé souffre-t-il si je mange peu pendant quelques semaines ?**
Au premier trimestre, la prise de poids peut être faible ou nulle selon Santé publique France. En revanche, une perte de poids, une déshydratation ou l’impossibilité de garder quoi que ce soit doivent faire consulter.

**Puis-je prendre des remèdes naturels ?**
Demandez d’abord conseil : ameli rappelle que l’aromathérapie est contre-indiquée pendant la grossesse, et le gingembre se prend sur avis médical.

**Mes vitamines de grossesse me donnent la nausée, puis-je les arrêter ?**
N’arrêtez rien sans en parler. Votre médecin ou sage-femme peut adapter vos compléments si besoin.

**Est-ce que manger du sucré soulage ?**
Certaines le ressentent, mais les produits très sucrés calent peu. Associez-les à un féculent ou un produit laitier.

## Quand demander conseil
Ameli recommande de consulter si vous avez des nausées et vomissements en début de grossesse, sur rendez-vous ou en urgence selon leur intensité. Consultez rapidement si vous ne gardez ni liquides ni aliments, si vous perdez du poids, avez très soif, des urines rares et foncées, des vertiges ou une grande fatigue. ${URG}

${FIN}`,
  }),
  a({
    slug: 'vomissements-grossesse-hydratation-signes-alerte',
    title: 'Vomissements importants pendant la grossesse : hydratation et signes d’alerte',
    summary: 'Quand les vomissements empêchent de manger et de boire : repérer la déshydratation, comprendre l’hyperémèse gravidique et savoir quand consulter.',
    max_week: 24, safety_critical: true,
    category: 'sante-grossesse', tags: ['vomissements', 'hyperémèse gravidique', 'déshydratation', 'perte de poids', 'nausées', 'urgence'],
    sources: [S.ameliNausees, S.ameliDigestion],
    body_md: `## En bref
- La plupart des nausées restent gênantes mais **sans complication**.
- On parle d’**hyperémèse gravidique** quand il y a une **perte de poids d’au moins 5 %**, une **déshydratation** ou un score de gravité élevé.
- La priorité est de **boire** et de **consulter** si rien ne passe.
- Des traitements existent : **ne restez pas seule** face à des vomissements qui durent.

## Comprendre
Ameli distingue deux situations. Les nausées et vomissements **sans complication** : perte de poids inférieure à 5 %, pas de déshydratation. Ils se prennent en charge à domicile. L’**hyperémèse gravidique** : perte de poids d’au moins 5 % par rapport au poids d’avant la grossesse, déshydratation ou score de gravité élevé. Un bilan est alors prescrit (prise de sang, échographie, contrôle de la thyroïde).

Pour évaluer la gravité, le médecin ou la sage-femme utilise un questionnaire simple, le **score PUQE**, que vous pouvez remplir avant la consultation. Il ou elle regarde aussi la fréquence des vomissements, leur retentissement sur votre vie, votre poids, votre soif, votre fatigue, et contrôle tension, pouls, température et urines.

Une hospitalisation peut être proposée en cas de vomissements importants mal tolérés, de déshydratation marquée, de perte de poids d’au moins 10 % ou d’un bilan sanguin perturbé. Elle permet une réhydratation par perfusion avec des vitamines, des médicaments contre les vomissements et un soutien psychologique.

Enfin, ameli précise que des vomissements qui persistent au-delà d’environ 9 semaines de grossesse doivent faire rechercher une autre cause (gastro-entérite, infection urinaire, appendicite, pré-éclampsie…).

## Au quotidien
### Boire avant tout
- **Petites gorgées régulières**, entre les prises alimentaires : eau fraîche, eau gazeuse, bouillon, infusion froide.
- Essayez des **aliments riches en eau** : compote, soupe, fruit frais, yaourt.
- Surveillez vos **urines** : rares et foncées, elles signalent un manque d’eau.

### Manger ce qui passe
- Petites quantités, souvent, de ce qui vous fait envie : féculents simples, biscuits secs, aliments froids et peu odorants.
- Aérez, évitez les odeurs fortes, la fumée et la caféine.

### Protéger vos dents
Après un vomissement, rincez-vous la bouche à l’eau ou avec un bain de bouche au bicarbonate ou au fluor, puis attendez au moins une heure avant le brossage. Signalez-le à votre dentiste.

### Les traitements
- **Aucun médicament sans avis médical**, y compris en vente libre.
- Le médecin peut adapter vos compléments, proposer un traitement et organiser un suivi, parfois avec une infirmière à domicile.
- L’aromathérapie est contre-indiquée pendant la grossesse.

### Se faire soutenir
L’hyperémèse épuise physiquement et moralement. Demandez de l’aide pour les repas, les enfants, le travail : un arrêt de travail peut être discuté avec votre médecin. Des associations de patientes existent, citées par ameli.

## Questions fréquentes
**Comment savoir si j’ai perdu 5 % de mon poids ?**
Divisez votre poids d’avant grossesse par 20 : c’est environ 5 %. Par exemple, 3 kg pour 60 kg. Pesez-vous et notez-le pour la consultation.

**L’hyperémèse est-elle dangereuse pour le bébé ?**
L’important est qu’elle soit prise en charge. Les soins décrits par ameli visent d’abord à corriger la déshydratation et à apporter des vitamines (notamment B1) à la mère. Posez vos questions à l’équipe qui vous suit.

**Faut-il forcément être hospitalisée ?**
Non. Ameli précise que l’hospitalisation n’est nécessaire qu’en cas d’hyperémèse grave.

**Les vomissements peuvent-ils revenir au 3e trimestre ?**
Des vomissements nouveaux en fin de grossesse doivent faire consulter : ils peuvent avoir une autre cause.

## Quand demander conseil
Consultez **le jour même** si vous ne gardez aucun liquide depuis plusieurs heures, si vos urines sont très rares ou foncées, si vous avez des vertiges, un malaise, une perte de poids, du sang dans les vomissements, de la fièvre ou des douleurs au ventre. Appelez le **15** ou le **112** en cas de malaise, de confusion ou de grande faiblesse. Si vous vous sentez à bout, le **3114** répond 24 h/24.

${FIN}`,
  }),
  // ------------------------------------------------------------------ budget et courses
  a({
    slug: 'bien-manger-enceinte-petit-budget',
    title: 'Bien manger enceinte avec un petit budget',
    summary: 'Légumes de saison, légumineuses, surgelés nature, œufs : des astuces concrètes pour suivre les repères alimentaires de la grossesse sans dépenser plus.',
    category: 'alimentation-grossesse', tags: ['budget', 'pas cher', 'économies', 'courses', 'saison', 'légumineuses', 'précarité'],
    sources: [S.spfBrochure, S.santeAlimentation, S.santePoids],
    body_md: `## En bref
- Les **produits de saison** coûtent généralement moins cher.
- **Moins de viande, plus de légumineuses** : c’est conforme aux repères et plus économique.
- Les **surgelés nature** et les **conserves simples** de légumes ou de légumineuses sont de bons alliés.
- Les **aliments enrichis** et produits « spécial grossesse » ne sont pas nécessaires.
- Des **aides** existent : parlez-en à la PMI ou à une assistante sociale.

## Comprendre
Manger équilibré pendant la grossesse ne demande pas de produits chers ou spécifiques. Santé publique France rappelle que les produits de saison sont généralement moins coûteux, et que manger moins de viande en privilégiant les produits de saison peut compenser le coût d’autres achats, comme le bio si vous le souhaitez et le pouvez.

Les repères 2026 sont simples : au moins cinq fruits et légumes par jour, des féculents chaque jour dont au moins un complet, des légumineuses au moins deux fois par semaine, deux produits laitiers par jour, du poisson deux fois par semaine, de l’eau à volonté. Plusieurs de ces aliments (lentilles, pois chiches, riz, pâtes, flocons d’avoine, carottes, pommes, œufs) font partie des moins chers du rayon.

Santé publique France précise aussi que les aliments enrichis et les compléments pris sans prescription sont inutiles avec une alimentation variée ; seule la vitamine B9 est normalement prescrite au début.

## Au quotidien
### Faire ses courses
- **Liste** et **menus de la semaine** : on achète moins sur un coup de tête.
- **Fruits et légumes de saison**, au marché en fin de matinée ou en vrac.
- **Surgelés nature** (épinards, haricots verts, filets de poisson) : pratiques, sans gaspillage.
- **Conserves** de légumineuses et de légumes (à rincer pour réduire le sel), de tomates, de sardines ou de maquereau.
- **Marques distributeur** : comparez le prix au kilo et le Nutri-Score.
- **Fromage à pâte pressée cuite à la coupe** ou en bloc, plutôt que râpé en sachet (déconseillé pendant la grossesse).

### Cuisiner malin
- **Grandes quantités** de soupe, de dahl, de chili : une partie au réfrigérateur (3 jours maximum), une partie au congélateur.
- **Œufs** bien cuits : omelette, œufs durs, quiche.
- **Restes** : réchauffés bien chauds, une seule fois.
- **Eau du robinet** : la boisson la moins chère.

### Exemple de menu économique
Petit-déjeuner : flocons d’avoine au lait, pomme. Midi : salade de lentilles, carottes râpées bien lavées, yaourt. Goûter : pain, fromage, fruit. Soir : soupe de légumes, omelette, pâtes, compote.

### Les aides
La PMI de votre département propose un suivi gratuit pendant la grossesse. Une assistante sociale (CAF, mairie, maternité) peut vous informer sur vos droits et sur les aides alimentaires près de chez vous.

## Questions fréquentes
**Le bio est-il indispensable ?**
Non. Santé publique France le conseille pour les fruits, légumes, légumineuses et féculents s’il est accessible, mais l’important est de manger varié.

**Les conserves sont-elles moins bonnes ?**
Les légumes et légumineuses en conserve gardent un intérêt nutritionnel. Choisissez-les nature et rincez-les.

**Les compléments « grossesse » valent-ils leur prix ?**
Ils ne sont pas recommandés sans avis médical et peuvent exposer à un surdosage. Suivez ce que vous prescrit votre professionnel.

**Comment manger du poisson sans trop dépenser ?**
Sardines, maquereaux, harengs (y compris en conserve) et filets surgelés sont abordables. Les poissons fumés restent à éviter.

## Quand demander conseil
Si vous avez du mal à manger à votre faim, parlez-en sans gêne à votre sage-femme, à la PMI ou à une assistante sociale : des solutions existent. Consultez aussi en cas de perte de poids ou de grande fatigue. ${URG} En cas de détresse, le **3114** est joignable 24 h/24.

${FIN}`,
  }),
  a({
    slug: 'faire-ses-courses-enceinte-liste-reperes',
    title: 'Faire ses courses enceinte : la liste et les repères au rayon',
    summary: 'Rayon par rayon, ce qu’il est utile de mettre dans le chariot pendant la grossesse, ce qu’il vaut mieux laisser, et comment lire les étiquettes.',
    category: 'alimentation-grossesse', tags: ['courses', 'liste de courses', 'supermarché', 'étiquettes', 'Nutri-Score', 'DLC', 'fromage'],
    sources: [S.santeAliments, S.spfBrochure, S.santeListeriose],
    body_md: `## En bref
- Une **liste préparée** à l’avance évite les oublis et les achats impulsifs.
- Au rayon frais, vérifiez le **mode de fabrication** (lait cru ou pasteurisé) et la **date limite de consommation**.
- Certains produits pratiques sont **à éviter** pendant la grossesse : fromage râpé en sachet, saumon fumé, tarama, crustacés décortiqués cuits.
- Le **Nutri-Score** aide à comparer des produits d’une même catégorie.
- Rangez les produits frais **au réfrigérateur dès le retour**.

## Comprendre
Pendant la grossesse, deux infections d’origine alimentaire sont particulièrement surveillées : la **listériose** et la **toxoplasmose**. S’y ajoute la **salmonellose**. Une partie de la prévention se joue dès les courses, en choisissant les bons produits. Santé.fr rappelle aussi que la congélation ne détruit pas Listeria : un produit à risque reste à risque, même congelé.

## Au quotidien
### Rayon fruits et légumes
Fruits et légumes de saison, frais, surgelés nature ou en conserve. Évitez les **graines germées** crues. Prévoyez de bien laver ce qui se mange cru.

### Rayon crèmerie
- **Oui** : yaourts, fromage blanc, lait pasteurisé ou UHT, fromages à pâte pressée cuite (comté, emmental, beaufort, gruyère, parmesan) à râper vous-même.
- **Non** : fromages au lait cru, fromages à croûte fleurie ou lavée (camembert, brie, munster…), pâtes pressées non cuites à affinage court (reblochon, morbier…), fromage râpé en sachet, substituts végétaux de fromage.

### Rayon boucherie, traiteur, charcuterie
- **Oui** : volaille, viandes à cuire, saucisses à cuire.
- **Non** : rillettes, pâtés, foie gras, produits en gelée, saucisson sec, jambon sec, jambon cuit si vous ne le recuisez pas, plats traiteur à base d’œufs crus.

### Rayon poissonnerie
- **Oui** : poissons à cuire (cabillaud, merlu, lieu, saumon, sardine, maquereau, hareng, truite…), crustacés crus à cuire vous-même.
- **Non** : poissons crus, fumés ou marinés, tarama, coquillages crus, crustacés décortiqués vendus cuits. Évitez espadon, marlin, siki, requin et lamproie ; limitez thon, bar, dorade, lotte, raie, anguille.

### Épicerie
Légumineuses, féculents complets, conserves de poisson, sel iodé, huiles de colza, de noix et d’olive, fruits à coque non salés. Évitez les produits au soja et les produits « anti-cholestérol » (phytostérols).

### Lire l’étiquette
- **DLC** (« à consommer jusqu’au ») : ne la dépassez jamais.
- **Lait cru ou pasteurisé** : vérifiez-le sur l’emballage des fromages et produits laitiers.
- **Nutri-Score** : comparez des produits similaires ; limitez ceux classés D et E.
- **Liste d’ingrédients** : une liste courte signale souvent un produit peu transformé.

### Le retour à la maison
Sac isotherme pour les produits frais, rangement immédiat au réfrigérateur réglé à 4 °C maximum, viandes et poissons crus dans la zone la plus froide.

## Questions fréquentes
**Le tarama est-il autorisé ?**
Non : Santé.fr et Santé publique France le citent parmi les préparations à base de poisson cru à éviter.

**Les plats préparés sont-ils déconseillés ?**
Non, à condition de les réchauffer bien chauds et de respecter la date limite. Choisissez-les avec un bon Nutri-Score.

**Un fromage pasteurisé à croûte fleurie convient-il ?**
Santé.fr déconseille ces fromages pendant la grossesse, qu’ils soient au lait cru ou pasteurisé, sauf bien cuits (gratin, tarte chaude).

**Et les produits bio ?**
Ils suivent les mêmes règles : un fromage bio au lait cru reste à éviter.

## Quand demander conseil
En cas de fièvre, de courbatures ou de symptômes ressemblant à une grippe pendant la grossesse, consultez rapidement : ce peut être une listériose, qui se soigne mieux quand elle est traitée tôt. ${URG}

${FIN}`,
  }),
  a({
    slug: 'repas-au-travail-enceinte-lunch-box',
    title: 'Enceinte au travail : bien gérer la pause déjeuner et la lunch box',
    summary: 'Cantine, gamelle, sandwich ou distributeur : comment manger équilibré et en sécurité sur votre lieu de travail pendant la grossesse.',
    category: 'alimentation-grossesse', tags: ['travail', 'lunch box', 'gamelle', 'cantine', 'pause déjeuner', 'sandwich', 'collation'],
    sources: [S.santeAliments, S.ansesFrigo, S.spfBrochure],
    body_md: `## En bref
- Une **lunch box** préparée la veille garde ses qualités si elle reste **au frais** jusqu’au repas.
- Au **restaurant d’entreprise**, préférez les plats **cuits** et servis chauds.
- Prévoyez des **collations** simples pour éviter les fringales.
- **Ne sautez pas** le déjeuner, même en cas de réunion ou de nausées.

## Comprendre
Pendant la grossesse, il est recommandé de prendre trois repas par jour sans en sauter, pour éviter les fringales et garder une énergie stable. Au travail, cela se heurte parfois aux horaires, au manque de réfrigérateur ou à une cantine peu adaptée. Quelques réflexes permettent de garder des repas variés tout en respectant les précautions de la grossesse : cuisson, conservation au froid et lavage des crudités.

L’Anses rappelle que les aliments doivent être conservés entre 0 et 4 °C au point le plus froid du réfrigérateur et qu’un plat chaud ne doit pas attendre plus de deux heures à température ambiante avant d’être réfrigéré.

## Au quotidien
### La lunch box
- **Préparez-la la veille** et mettez-la tout de suite au réfrigérateur.
- **Transport** : sac isotherme avec pain de glace, surtout s’il fait chaud.
- **Sur place** : rangez-la au réfrigérateur dès votre arrivée. Sans frigo, choisissez des aliments qui se conservent mieux (fromage à pâte pressée cuite, pain, fruits, légumes cuits) et gardez le sac isotherme fermé.
- **Réchauffage** : bien chaud et à cœur, en remuant à mi-cuisson au micro-ondes.
- Idées : salade de pâtes complètes, poulet rôti et légumes grillés ; riz, lentilles et carottes au cumin ; quiche maison bien cuite et salade ; restes de la veille réchauffés.

### La cantine ou le restaurant d’entreprise
- **Plats chauds** cuits : viande ou poisson bien cuits, légumes cuits, féculents.
- **Crudités** : si vous ne savez pas comment elles ont été lavées, Santé.fr conseille de les éviter et de préférer les légumes cuits.
- **Fromages** : choisissez une pâte pressée cuite ou un yaourt.
- **Desserts** : évitez les mousses et tiramisus maison à base d’œufs crus ; fruit, compote, yaourt sont de bons choix.
- N’hésitez pas à **demander** comment un plat est préparé.

### Le sandwich
Pain (complet si possible), poulet ou œuf dur bien cuits, fromage à pâte pressée cuite, légumes lavés. Évitez jambon cru, saumon fumé, tarama et sauce mayonnaise maison.

### Collations au bureau
Fruits, compotes en gourde, fruits à coque non salés, pain complet, biscuits secs simples. Une bouteille d’eau sur le bureau aide à boire régulièrement. Évitez les distributeurs de boissons sucrées et limitez les cafés (3 tasses maximum par jour).

### Les nausées au travail
Grignotez de petites quantités régulièrement, aérez, sortez quelques minutes. Si les nausées gênent votre travail, parlez-en à votre médecin : le médecin du travail peut aussi proposer des aménagements.

## Questions fréquentes
**Puis-je réchauffer deux fois un plat ?**
Mieux vaut réchauffer seulement la portion que vous mangez, une seule fois, bien chaud.

**Combien de temps une gamelle peut-elle rester hors du frigo ?**
Le moins longtemps possible : au-delà de deux heures à température ambiante, les microbes peuvent se multiplier.

**Ma cantine sert du poisson cru (tartare, sushis), que faire ?**
Choisissez un autre plat : le poisson cru est déconseillé pendant la grossesse.

**J’ai faim en milieu de matinée, est-ce gênant ?**
Non : une collation peut s’intégrer, comme un yaourt ou un fruit.

## Quand demander conseil
Consultez en cas de fièvre, de douleurs, de vomissements importants ou de malaise au travail. ${URG} Pour adapter votre poste ou vos horaires, adressez-vous au médecin du travail.

${FIN}`,
  }),
  // ------------------------------------------------------------------ restaurant, fêtes, repas chez les autres
  a({
    slug: 'restaurant-enceinte-que-choisir',
    title: 'Au restaurant enceinte : comment choisir sur la carte',
    summary: 'Entrée, plat, fromage, dessert, boisson : les réflexes pour profiter d’un repas au restaurant pendant la grossesse en évitant les aliments à risque.',
    category: 'alimentation-grossesse', tags: ['restaurant', 'carte', 'menu', 'sortie', 'cuisson', 'crudités', 'dessert'],
    sources: [S.santeAliments, S.ameliToxo, S.spfBrochure],
    body_md: `## En bref
- Au restaurant, on ne sait pas toujours comment les **crudités** ont été lavées : préférez les **légumes cuits**.
- Demandez une **viande bien cuite**, sans partie rosée, et un **poisson cuit**.
- Fromages : choisissez les **pâtes pressées cuites** ou passez au dessert.
- Méfiez-vous des desserts **maison à base d’œufs crus** et des plats **flambés ou alcoolisés**.
- **N’hésitez pas à demander** comment les plats sont préparés.

## Comprendre
Sortir au restaurant reste un plaisir pendant la grossesse. Les précautions sont les mêmes qu’à la maison, avec une difficulté : on ne maîtrise ni le lavage, ni la cuisson, ni la conservation. Ameli conseille, au restaurant ou chez des amis, d’éviter les crudités et de préférer les légumes cuits, et de consommer la viande bien cuite. Santé.fr ajoute qu’on peut éviter les fruits, légumes et herbes crus dont on ne connaît pas le lavage.

L’alcool est à éviter totalement, y compris dans les plats et desserts : Santé.fr rappelle qu’une partie de l’alcool reste présente même après une longue cuisson.

## Au quotidien
### Les entrées
- **Plutôt** : soupe, velouté, légumes grillés ou rôtis, tarte salée bien chaude, œuf dur, gratin.
- **À éviter** : carpaccio, tartare, poisson cru ou mariné (ceviche, gravlax), saumon fumé, huîtres et coquillages crus, foie gras, terrines et pâtés, charcuterie sèche, salades crues dont le lavage est inconnu.

### Les plats
- Demandez une **cuisson à cœur** pour la viande : « bien cuite », y compris pour le burger et l’entrecôte.
- **Poissons cuits** : grillés, au four, en papillote. Évitez espadon, marlin, requin.
- **Crustacés et coquillages** : seulement bien cuits ; évitez les crustacés décortiqués servis froids.
- **Œufs** : omelette bien cuite, pas d’œuf mollet, poché ou au plat avec jaune coulant.
- **Sauces** : méfiez-vous de la mayonnaise, de l’aïoli, de la sauce béarnaise ou hollandaise maison, souvent préparées avec des œufs peu cuits. Demandez.
- **Restaurant japonais** : makis aux légumes, à l’omelette bien cuite, brochettes cuites, riz, poisson cuit. Santé publique France recommande d’éviter les produits à base de soja ; la sauce soja reste possible de temps en temps.

### Fromages et desserts
- Fromages à pâte pressée cuite (comté, beaufort, emmental, parmesan), sans la croûte. Fromage fondu bien chaud (tartiflette, raclette, gratin) convient aussi.
- Desserts : préférez tartes cuites, crème brûlée ou flan cuits, sorbets, fruits cuits. Évitez mousse au chocolat, tiramisu, île flottante ou crème anglaise maison si les œufs sont peu cuits, et les desserts flambés ou au rhum.

### Les boissons
Eau plate ou gazeuse, jus en petit verre, cocktails sans alcool. Pas de vin, même un verre. Limitez le café (3 tasses maximum par jour, en comptant ceux de la journée).

### Oser demander
Une phrase simple suffit : « Je suis enceinte, pouvez-vous me dire si ce plat contient des œufs crus / du fromage au lait cru, et cuire la viande à cœur ? »

## Questions fréquentes
**Les pizzas sont-elles autorisées ?**
Oui, bien cuites et servies chaudes. Évitez les garnitures ajoutées après cuisson, comme le jambon cru, le saumon fumé ou des crudités dont vous ignorez le lavage.

**Puis-je manger une raclette ?**
Le fromage bien fondu et chaud convient ; évitez la charcuterie crue ou sèche et choisissez du jambon cuit recuit ou du poulet.

**Le restaurant ne sait pas me répondre, que faire ?**
Choisissez le plat le plus simple et le plus cuit possible.

## Quand demander conseil
Si vous avez de la fièvre, des courbatures, des diarrhées ou des vomissements dans les jours ou semaines qui suivent un repas, consultez votre médecin ou votre sage-femme en précisant que vous êtes enceinte. ${URG}

${FIN}`,
  }),
  a({
    slug: 'plats-a-emporter-livraison-fast-food-enceinte',
    title: 'Plats à emporter, livraison et restauration rapide pendant la grossesse',
    summary: 'Kebab, burger, pizza, poke bowl, plats livrés : comment choisir et conserver un repas tout prêt quand on est enceinte.',
    category: 'alimentation-grossesse', tags: ['fast-food', 'livraison', 'plats à emporter', 'burger', 'pizza', 'kebab', 'poke bowl', 'sushis'],
    sources: [S.santeAliments, S.ameliToxo, S.santeListeriose],
    body_md: `## En bref
- Les repas tout prêts dépannent : choisissez des plats **cuits et servis chauds**.
- Évitez les garnitures **crues** (poisson, viande, œuf) et les sauces à base d’**œufs crus** maison.
- Un plat livré doit être **mangé rapidement** ou mis au **réfrigérateur sans tarder**.
- Les **restes** se réchauffent bien chauds et se consomment rapidement.

## Comprendre
Fatigue, nausées, horaires chargés : il est fréquent de commander ou d’acheter un repas tout prêt pendant la grossesse. Ce n’est pas un problème en soi. Les précautions restent les mêmes : cuisson suffisante des produits animaux, pas de produits crus à risque, respect du froid.

Santé.fr rappelle que la listériose est favorisée par une mauvaise conservation et que les restes et plats cuisinés doivent être réchauffés et consommés rapidement. Ameli rappelle que la viande doit être cuite à cœur pour prévenir la toxoplasmose.

## Au quotidien
### Selon le type de repas
- **Burger** : steak bien cuit (à demander), poulet cuit ou version végétarienne. Retirez la salade crue si vous doutez de son lavage. Les sauces industrielles en sachet sont préférables aux sauces maison à base d’œufs crus.
- **Pizza** : bien cuite, servie chaude. Évitez les ingrédients ajoutés après cuisson (jambon cru, saumon fumé, crudités dont le lavage est incertain).
- **Kebab, tacos, wrap** : viande bien cuite et chaude, crudités à éviter si le lavage est incertain.
- **Cuisine asiatique** : riz sauté, nouilles, currys, plats mijotés, raviolis cuits. Évitez sushis et sashimis au poisson cru ainsi que les plats à base de tofu ou de soja, que Santé.fr déconseille pendant la grossesse (la sauce soja occasionnelle reste possible).
- **Poke bowl** : choisissez une version au poulet ou au poisson cuit, avec des légumes cuits, et évitez le poisson cru.
- **Boulangerie** : quiche ou tarte salée réchauffées, sandwich au poulet ou à l’œuf dur, fromage à pâte pressée cuite. Évitez sandwichs au jambon cru ou au saumon fumé.
- **Plats traiteur en barquette** : vérifiez la date limite, réchauffez à cœur.

### La livraison
- Mangez **dès réception**, ou placez le plat au réfrigérateur **dans les deux heures**.
- Réchauffez **bien chaud et à cœur**, en remuant.
- Ne gardez pas les restes plus de **trois jours** au réfrigérateur, selon Santé publique France.

### L’équilibre
Un repas rapide de temps en temps ne déséquilibre pas une semaine. Complétez-le par un fruit, un yaourt, et privilégiez l’eau plutôt que les sodas (Santé publique France recommande au maximum un verre de boisson sucrée par jour, light compris). Pour le repas suivant, misez sur des légumes et des féculents complets.

## Questions fréquentes
**Les frites sont-elles autorisées ?**
Oui, elles ne posent pas de problème de sécurité. Elles sont simplement grasses et salées : de temps en temps.

**Les boissons énergisantes ?**
Santé publique France recommande de les éviter pendant la grossesse.

**Un plat livré tiède est-il encore bon ?**
Réchauffez-le bien chaud avant de le manger, surtout s’il contient viande, poisson, œufs ou riz.

**Et les sushis cuits ?**
Les makis à l’omelette bien cuite, aux légumes, à la crevette cuite par le restaurant ou au poisson cuit sont des options ; demandez la composition.

## Quand demander conseil
Consultez si vous présentez de la fièvre, des courbatures, des diarrhées ou des vomissements après un repas, en signalant votre grossesse. Consultez rapidement en cas de signes de déshydratation (urines rares et foncées, grande soif, vertiges) ou de forte douleur. ${URG}

${FIN}`,
  }),
  a({
    slug: 'repas-de-fetes-enceinte',
    title: 'Repas de fêtes enceinte : foie gras, huîtres, fromages… que choisir ?',
    summary: 'Noël, Nouvel An, mariages, anniversaires : des idées de menus festifs adaptés à la grossesse et des alternatives aux classiques à éviter.',
    category: 'alimentation-grossesse', tags: ['fêtes', 'Noël', 'réveillon', 'foie gras', 'huîtres', 'saumon fumé', 'champagne', 'bûche'],
    sources: [S.santeAliments, S.spfBrochure, S.santeListeriose],
    body_md: `## En bref
- Plusieurs classiques des fêtes sont à éviter pendant la grossesse : **foie gras, huîtres et coquillages crus, saumon fumé, fromages au lait cru ou à croûte fleurie, alcool**.
- Il existe de nombreuses **alternatives festives** et sûres.
- Les **desserts maison à base d’œufs crus** et les desserts alcoolisés sont à éviter.
- Prévenez vos hôtes à l’avance : c’est plus simple pour tout le monde.

## Comprendre
Les menus de fête concentrent beaucoup d’aliments concernés par les précautions de la grossesse. Le **foie gras** et les produits en gelée sont cités par Santé.fr parmi les charcuteries à éviter (risque de listériose) ; le foie est aussi déconseillé en raison de sa richesse en vitamine A. Les **huîtres et autres coquillages crus**, le **saumon fumé ou mariné** et les **crustacés décortiqués vendus cuits** sont à éviter. Les **fromages** au lait cru, à croûte fleurie ou lavée sont déconseillés. Enfin, **zéro alcool** : aucun seuil n’est établi, et l’alcool persiste en partie dans les plats cuisinés et desserts.

## Au quotidien
### Idées d’apéritif
Gougères bien cuites, légumes rôtis, houmous maison, tartinades de légumes, mini-quiches chaudes, crevettes achetées crues et cuites à la maison, toasts de rillettes de maquereau maison (poisson cuit), cocktails sans alcool.

### Idées d’entrée
Velouté de potimarron, coquilles Saint-Jacques bien cuites, saumon frais cuit au four servi tiède, terrine de légumes maison, moules ou coques bien cuites.

### Idées de plat
Volaille rôtie (chapon, dinde, pintade) cuite à cœur, filet de poisson en croûte, rôti bien cuit, légumes d’hiver, purée de céleri ou de châtaignes.

### Le plateau de fromages
Comté, beaufort, emmental, gruyère, parmesan, sans la croûte. Un fromage chaud (raclette, fondue, camembert rôti au four bien chaud) peut remplacer les pâtes molles.

### Les desserts
- **Plutôt** : bûche pâtissière ou glacée industrielle, gâteau cuit, crème brûlée, fruits frais lavés, salade d’agrumes, sorbet.
- **À éviter** : mousse au chocolat, tiramisu, bûche à la crème au beurre maison si les œufs ne sont pas cuits, desserts au rhum ou flambés. Les versions industrielles de ces desserts sont, selon Santé.fr, considérées comme peu à risque pour la salmonellose.

### Boissons
Cocktails de jus et d’eau gazeuse, infusions glacées, boissons pétillantes sans alcool. Pensez aussi à boire de l’eau régulièrement au cours de ces longs repas.

### Le rythme des fêtes
Les repas s’enchaînent et se prolongent : servez-vous de petites portions, levez-vous entre les plats, marchez un peu dans la journée. Les remontées acides sont fréquentes après un repas copieux ; attendre avant de vous coucher peut aider.

## Questions fréquentes
**Le foie gras mi-cuit en conserve est-il autorisé ?**
Santé.fr cite le foie gras parmi les charcuteries à éviter, et Santé publique France déconseille le foie et les produits à base de foie pendant la grossesse.

**Les huîtres chaudes, gratinées, conviennent-elles ?**
Seulement bien cuites à cœur. Ameli conseille d’éviter les moules, huîtres et autres mollusques crus.

**Un fond de champagne pour trinquer ?**
Les autorités de santé recommandent zéro alcool pendant toute la grossesse. Trinquez avec une boisson pétillante sans alcool.

**La dinde aux marrons d’un traiteur ?**
Oui, réchauffée bien chaude et consommée rapidement.

**Que faire des restes du réveillon ?**
Mettez-les au réfrigérateur dans les deux heures, gardez-les trois jours au maximum et réchauffez-les à cœur. Les plateaux restés longtemps sur la table sont à jeter.

## Quand demander conseil
Après les fêtes, consultez si vous avez de la fièvre, des courbatures, des maux de ventre, des diarrhées ou des vomissements. ${URG} Si l’ambiance des fêtes est difficile à vivre (fatigue, solitude, tensions), parlez-en à votre sage-femme ; le **3114** répond aussi 24 h/24.

${FIN}`,
  }),
  a({
    slug: 'barbecue-pique-nique-repas-ete-enceinte',
    title: 'Barbecue, pique-nique et repas d’été pendant la grossesse',
    summary: 'Cuisson au barbecue, glacière, salades composées et chaleur : les bons gestes pour profiter des repas d’été en toute sérénité quand on est enceinte.',
    category: 'alimentation-grossesse', tags: ['barbecue', 'pique-nique', 'été', 'chaleur', 'glacière', 'salades', 'cuisson'],
    sources: [S.ameliToxo, S.ansesFrigo, S.santeAliments],
    body_md: `## En bref
- Au barbecue, la viande doit être **cuite à cœur**, sans jus rosé : l’extérieur grillé ne suffit pas.
- Utilisez des **ustensiles et plats différents** pour le cru et le cuit.
- En pique-nique, gardez les aliments au **frais** dans une glacière et ne les laissez pas au soleil.
- Lavez soigneusement **fruits, légumes et herbes** ; en cas de doute, préférez-les cuits.
- Pensez à **boire** régulièrement quand il fait chaud.

## Comprendre
L’été multiplie les repas dehors, souvent plus difficiles à maîtriser. Deux points comptent particulièrement pendant la grossesse. La **cuisson** : ameli recommande de cuire la viande à cœur, à plus de 68 °C, sans jus rosé à la coupe, pour prévenir la toxoplasmose. Or le barbecue saisit vite l’extérieur, alors que le centre peut rester cru. La **chaîne du froid** : l’Anses rappelle que les aliments périssables se conservent entre 0 et 4 °C, et qu’un plat ne doit pas rester plus de deux heures à température ambiante avant d’être réfrigéré. Par forte chaleur, les microbes se multiplient plus vite.

## Au quotidien
### Au barbecue
- **Coupez** un morceau au centre pour vérifier : la chair doit être uniforme, sans partie rouge ou rosée, et le jus clair.
- Préférez les **morceaux fins** (brochettes, émincés, saucisses à cuire) qui cuisent plus régulièrement, ou précuisez au four.
- **Évitez** les viandes marinées crues servies peu cuites, et ne réutilisez pas la marinade crue comme sauce sans la faire bouillir.
- **Deux plats** : un pour la viande crue, un propre pour la viande cuite. Lavez la pince entre les deux usages.
- **Poisson** : bien cuit, qui se détache en lamelles.
- **Lavez-vous les mains** après avoir manipulé la viande crue.

### En pique-nique
- **Glacière ou sac isotherme** avec pains de glace ; ouvrez-la le moins possible.
- **Préparez la veille** et gardez au réfrigérateur jusqu’au départ.
- **Aliments pratiques** : salade de pâtes ou de riz, taboulé, poulet rôti froid, œufs durs, tortilla bien cuite, fromage à pâte pressée cuite, légumes cuits, fruits lavés à la maison, pain.
- **À éviter** : charcuterie sèche, pâtés et rillettes, salades composées à la mayonnaise maison, fromages au lait cru ou à croûte fleurie.
- Jetez ce qui est resté **longtemps au soleil**.

### Salades composées
Lavez soigneusement les crudités et les herbes à l’eau claire (ameli précise que le vinaigre n’est pas nécessaire). Évitez les graines germées crues. Ajoutez du poulet bien cuit, des œufs durs, du thon en conserve (à limiter) ou des pois chiches.

### Chaleur
Buvez souvent, même sans soif, mangez des aliments riches en eau (melon, pastèque, concombre lavés, soupes froides) et restez à l’ombre aux heures chaudes.

## Questions fréquentes
**Les merguez et chipolatas sont-elles autorisées ?**
Oui, ce sont des charcuteries à cuire : faites-les cuire complètement, jusqu’au centre.

**Le melon est-il déconseillé ?**
Il ne figure pas parmi les aliments à éviter listés par Santé.fr. Lavez l’écorce avant de le couper et conservez-le au frais une fois entamé.

**La glace du marchand ambulant ?**
Choisissez de préférence une glace emballée et vérifiez qu’elle est bien congelée.

**Je n’ai pas de glacière, que prévoir ?**
Des aliments qui supportent mieux la température : fruits entiers, pain, fromage à pâte pressée cuite, fruits secs, biscuits.

## Quand demander conseil
Consultez en cas de fièvre, de courbatures, de diarrhée ou de vomissements après un repas. Par forte chaleur, des maux de tête, des vertiges, une grande soif ou un malaise doivent faire consulter rapidement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'repas-chez-les-autres-enceinte-oser-dire',
    title: 'Manger chez la famille ou des amis enceinte : oser en parler',
    summary: 'Comment prévenir vos hôtes, refuser un plat sans vexer et proposer des solutions simples pour que les repas partagés restent agréables pendant la grossesse.',
    category: 'alimentation-grossesse', tags: ['repas de famille', 'invitation', 'amis', 'dire non', 'belle-famille', 'précautions'],
    sources: [S.ameliToxo, S.santeAliments],
    body_md: `## En bref
- Prévenir vos hôtes **à l’avance** facilite tout : ils peuvent adapter le menu.
- Vous n’avez pas à annoncer votre grossesse si vous ne le souhaitez pas : un simple « je ne mange pas ça en ce moment » suffit.
- Au moment du repas, privilégiez les **plats cuits** et servis chauds.
- **Proposez d’apporter** un plat ou un dessert : vous êtes sûre d’avoir quelque chose qui vous convient.

## Comprendre
Les précautions alimentaires de la grossesse ne sont pas toujours connues de l’entourage, et elles ont évolué au fil des années. Une grand-mère peut proposer de bonne foi un foie gras maison ou des œufs mimosa à la mayonnaise faite main. Ameli conseille, au restaurant comme chez des amis, d’éviter les crudités et de préférer les légumes cuits, et de consommer la viande bien cuite. Santé.fr liste les aliments à éviter : fromages au lait cru ou à croûte fleurie, charcuteries prêtes à consommer, viande, poisson et coquillages crus, poisson fumé, œufs crus ou peu cuits et préparations maison qui en contiennent, alcool.

Dire non à un plat n’est pas impoli : c’est une façon de prendre soin de vous et de votre bébé.

## Au quotidien
### Avant le repas
- **Un message simple** : « Je suis enceinte et je dois éviter les fromages au lait cru, le poisson cru, la charcuterie et les œufs crus. Ne vous inquiétez pas, il y aura plein de choses que je pourrai manger ! »
- **Si vous ne voulez pas l’annoncer** : « Je suis un régime particulier en ce moment » ou « je ne digère pas bien certains aliments ».
- **Proposez d’apporter** quelque chose : une salade de légumes cuits, un gâteau, un fromage à pâte pressée cuite, une boisson sans alcool.

### Pendant le repas
- **Servez-vous vous-même** pour choisir les morceaux bien cuits.
- **Demandez discrètement** si la mayonnaise ou la mousse sont faites maison.
- **Viande** : demandez un morceau du bord ou bien cuit, ou remettez-le à cuire.
- **Fromages** : prenez une pâte pressée cuite et retirez la croûte.
- **Alcool** : un verre d’eau pétillante dans un verre à pied passe inaperçu si vous préférez.

### Les phrases qui aident
- « Merci, ça a l’air délicieux, mais je vais me régaler avec le reste. »
- « Ma sage-femme m’a demandé d’éviter ça pendant quelques mois. »
- « J’en reprendrai avec plaisir après la naissance ! »

### Si l’on insiste
Restez simple et ferme. Un partenaire ou un proche peut relayer pour vous. Les recommandations officielles sont faciles à montrer, par exemple sur ameli.fr ou sante.fr.

## Questions fréquentes
**J’ai mangé par erreur un aliment déconseillé, que faire ?**
Pas de panique. Surveillez l’apparition de fièvre, de courbatures, de troubles digestifs dans les semaines qui suivent et parlez-en à votre sage-femme ou à votre médecin.

**Puis-je manger les légumes crus si c’est moi qui les ai lavés ?**
Oui, s’ils ont été soigneusement lavés à l’eau.

**Les crudités préparées par mes hôtes ?**
Si vous ne savez pas comment elles ont été lavées, préférez les légumes cuits.

**Et si on me reproche d’en faire trop ?**
Ces précautions sont celles recommandées par les autorités de santé françaises. Vous avez le droit de les appliquer sans vous justifier.

## Quand demander conseil
Si vous avez de la fièvre, des courbatures ou des troubles digestifs après un repas, consultez en précisant que vous êtes enceinte. ${URG} Si les remarques de l’entourage vous pèsent, parlez-en à votre sage-femme ; le **3114** est joignable 24 h/24 en cas de détresse.

${FIN}`,
  }),
  a({
    slug: 'ramadan-jeune-grossesse',
    title: 'Ramadan et jeûne pendant la grossesse : en parler avant de décider',
    summary: 'Jeûner enceinte soulève des questions d’hydratation, d’énergie et de suivi médical : les points à aborder avec votre sage-femme ou votre médecin et des repères pour les repas.',
    category: 'alimentation-grossesse', tags: ['ramadan', 'jeûne', 'religion', 'hydratation', 'iftar', 'suhoor', 'shour', 'diabète gestationnel'],
    sources: [S.santeAlimentation, S.spfBrochure, S.ameliDigestion],
    body_md: `## En bref
- Les repères alimentaires de la grossesse recommandent **trois repas par jour sans en sauter** et de boire régulièrement : le jeûne s’en écarte.
- Avant de jeûner, **parlez-en** à votre sage-femme ou à votre médecin : votre situation (nausées, diabète gestationnel, anémie, terme) compte beaucoup.
- Si vous jeûnez, **apprenez les signes** qui doivent faire rompre le jeûne et consulter.

## Comprendre
Pendant la grossesse, Santé.fr conseille de prendre trois repas par jour sans en sauter, pour éviter les fringales et stabiliser la glycémie. Santé publique France recommande de boire de l’eau à volonté et davantage qu’en temps habituel. Un jeûne de la journée, surtout s’il tombe en période chaude ou de longues journées, réduit les apports et l’hydratation sur de nombreuses heures.

Certaines situations rendent le jeûne particulièrement délicat : nausées et vomissements, diabète gestationnel ou autre maladie chronique, anémie, faible prise de poids, fin de grossesse, travail physique. Seul votre professionnel peut évaluer votre cas. Cette discussion se fait sans jugement : il s’agit de trouver avec vous la solution qui respecte vos convictions et votre santé.
## Au quotidien
### Si vous décidez de jeûner, en accord avec votre professionnel
- **Repas du soir** (rupture du jeûne) : commencez par boire, puis un repas complet avec légumes, féculents de préférence complets, protéines bien cuites, produit laitier et fruit. Évitez les repas très copieux, gras ou frits, qui favorisent les remontées acides.
- **Repas de l’aube** : ne le sautez pas. Privilégiez des aliments qui calent : pain complet, flocons d’avoine, œufs bien cuits, produit laitier, fruits, eau.
- **Collation** dans la soirée : yaourt, fruit, fruits à coque non salés.
- **Boire** : répartissez l’eau entre la rupture du jeûne et l’aube, par petites quantités régulières. Limitez le thé et le café, ainsi que les boissons sucrées.
- **Dattes et pâtisseries** : quelques dattes ont leur place ; les pâtisseries très sucrées sont à garder pour les occasions.
- **Reposez-vous** pendant la journée, évitez les efforts et la chaleur.
- **Couchez-vous** environ trois heures après le dernier repas si vous avez des remontées acides, comme le conseille ameli.

### Alternatives possibles
Selon votre situation, vous pouvez en discuter avec votre sage-femme ou votre médecin : ne pas jeûner certains jours, ou décaler le jeûne après la grossesse ou l’allaitement, par exemple. Ces choix vous appartiennent ; le rôle du professionnel est de vous aider à protéger votre santé et celle du bébé.

## Questions fréquentes
**Le jeûne est-il possible avec un diabète gestationnel ?**
Le diabète gestationnel demande des repas et collations répartis dans la journée et une surveillance de la glycémie : parlez-en impérativement à l’équipe qui vous suit avant toute décision.

**Et si j’ai des nausées ?**
Les nausées justifient de manger souvent en petites quantités et de bien boire. Le jeûne risque de les aggraver et d’entraîner une déshydratation.

**Le bébé prend-il ce dont il a besoin malgré tout ?**
On ne peut pas le garantir pour chaque grossesse : c’est pourquoi un avis médical personnalisé est important.

**Puis-je jeûner pendant l’allaitement ?**
Les besoins en eau et en énergie restent élevés : demandez conseil à votre sage-femme ou à votre médecin.

## Quand demander conseil
Rompez le jeûne et consultez rapidement en cas de vertiges, malaise, maux de tête intenses, grande soif, urines rares et foncées, vomissements, contractions, douleurs au ventre ou si vous sentez moins bouger votre bébé. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ diabète gestationnel au quotidien
  a({
    slug: 'diabete-gestationnel-composer-ses-repas',
    title: 'Diabète gestationnel : composer ses repas au quotidien',
    summary: 'Glucides répartis, fibres, féculents complets, moins de sucres et de graisses : comment construire ses assiettes avec un diabète gestationnel, en lien avec l’équipe qui vous suit.',
    min_week: 20,
    category: 'alimentation-grossesse', tags: ['diabète gestationnel', 'glycémie', 'glucides', 'féculents', 'sucre', 'fibres', 'repas', 'index glycémique'],
    sources: [S.ameliDiabete, S.santeDiabete, S.ameliSurpoids],
    body_md: `## En bref
- Le premier traitement du diabète gestationnel repose sur l’**alimentation** et l’**activité physique**.
- Les **glucides ne doivent pas être supprimés** : ils sont **répartis** sur la journée, à chaque repas.
- L’alimentation conseillée est **pauvre en sucres et en graisses**, **riche en fibres**, avec **trois repas et deux collations**.
- Les apports sont **personnalisés** : un diététicien peut vous aider à les traduire en menus.

## Comprendre
Le diabète gestationnel est une glycémie trop élevée qui apparaît pendant la grossesse, le plus souvent vers la fin du deuxième trimestre. Santé.fr indique que sa prise en charge commence par des mesures d’hygiène de vie : une alimentation pauvre en graisses et en sucres, riche en fibres, et des repas répartis sur la journée (trois repas et deux collations), associée à une activité physique régulière.

Ameli précise que l’apport alimentaire est déterminé **au cas par cas**, selon votre poids, votre prise de poids et vos habitudes. Les glucides doivent être présents à chaque repas : « il est primordial de ne pas les éliminer complètement ». Les supprimer priverait votre bébé et vous-même d’une source d’énergie essentielle.

Pour les futures mères en surpoids, ameli conseille de privilégier les aliments à index glycémique bas : céréales complètes, fruits, légumes, légumineuses, oléagineux non salés, produits laitiers non sucrés et eau. Ces repères sont utiles plus largement pour composer des repas qui font monter la glycémie plus progressivement.

## Au quotidien
### Construire l’assiette
- **Légumes** à chaque repas, crus bien lavés ou cuits : ils apportent des fibres et du volume.
- **Un féculent à chaque repas**, en quantité adaptée selon les conseils de votre équipe : pain complet, riz complet, pâtes complètes, quinoa, légumineuses.
- **Une source de protéines** : viande ou poisson bien cuits, œufs bien cuits, légumineuses.
- **Un produit laitier** non sucré : yaourt nature, fromage blanc, fromage à pâte pressée cuite.
- **Un fruit entier** plutôt qu’un jus.
- **Matières grasses** en petite quantité : huile de colza, de noix, d’olive.

### Ce qui aide
- **Les fibres** : légumes, légumineuses et céréales complètes ralentissent le passage des sucres dans le sang.
- **Les fruits** : entiers, intégrés à un repas ou une collation plutôt que seuls en grande quantité.
- **L’eau** comme boisson principale.

### Ce qu’il vaut mieux limiter
- Sodas, jus de fruits, sirops.
- Pâtisseries, viennoiseries, biscuits, confiseries.
- Produits laitiers sucrés, céréales du petit-déjeuner sucrées.
- Plats très gras ou frits.

### Exemple de journée
Matin : pain complet, fromage blanc nature, fruit. Collation : yaourt nature et quelques amandes. Midi : crudités bien lavées, poulet bien cuit, lentilles, fruit. Collation : pain complet et fromage. Soir : soupe de légumes, poisson bien cuit, riz complet, yaourt nature.
Cet exemple est indicatif : les quantités sont à définir avec votre équipe.

## Questions fréquentes
**Dois-je arrêter le pain et les pâtes ?**
Non. Les féculents restent nécessaires ; c’est leur répartition et leur quantité qui sont ajustées. Préférez les versions complètes.

**Les édulcorants sont-ils une solution ?**
Parlez-en avec l’équipe qui vous suit avant d’en consommer régulièrement : elle vous conseillera selon votre situation.

**Et si ma glycémie reste élevée malgré mes efforts ?**
Ameli indique qu’une insuline est proposée si la glycémie n’est pas normalisée après environ dix jours de mesures hygiéno-diététiques. Ce n’est pas un échec : cela concerne un peu plus d’un diabète gestationnel sur quatre.

**Puis-je faire un régime pour moins grossir ?**
Non : les régimes amaigrissants sont contre-indiqués pendant la grossesse. Suivez les conseils personnalisés.

## Quand demander conseil
Appelez l’équipe qui vous suit si vos glycémies sont souvent au-dessus des objectifs fixés, si vous avez du mal à manger, ou en cas de malaise, de sueurs, de tremblements. Consultez rapidement en cas de maux de tête intenses, de troubles de la vue, de gonflement brutal du visage ou des mains, de diminution des mouvements du bébé. ${URG}

${FIN}`,
  }),
  a({
    slug: 'diabete-gestationnel-collations-activite-organisation',
    title: 'Diabète gestationnel : collations, activité et organisation de la journée',
    summary: 'Comment répartir les repas et collations, bouger au quotidien et organiser l’autosurveillance de la glycémie quand on a un diabète gestationnel.',
    min_week: 20,
    category: 'alimentation-grossesse', tags: ['diabète gestationnel', 'collation', 'activité physique', 'glycémie', 'autosurveillance', 'marche', 'organisation'],
    sources: [S.santeDiabete, S.ameliDiabete, S.ameliSurpoids],
    body_md: `## En bref
- Santé.fr recommande des repas **répartis sur la journée** : **trois repas et deux collations**.
- L’**activité physique régulière** fait partie du traitement : ameli cite environ **30 minutes, 3 à 5 fois par semaine**, en l’absence de contre-indication.
- L’**autosurveillance de la glycémie** se fait selon le rythme indiqué par votre médecin, en général à jeun et après les repas.
- Un **carnet** (papier ou application) aide à faire le lien entre repas, activité et glycémie.

## Comprendre
Avec un diabète gestationnel, l’objectif est de garder une glycémie stable tout au long de la journée. Répartir les glucides en plusieurs prises évite de grosses montées après un repas trop chargé et des « trous » trop longs entre deux repas. C’est pourquoi Santé.fr parle de trois repas et deux collations.

L’activité physique aide les muscles à utiliser le sucre du sang. Ameli recommande, si la grossesse ne présente pas de contre-indication, une activité régulière d’environ 30 minutes par jour, 3 à 5 fois par semaine. En cas de surpoids, ameli décrit une intensité légère à modérée : on peut encore parler pendant l’effort.

L’autosurveillance glycémique, avec un lecteur et des bandelettes, est indispensable en cas d’insuline et utile avec un traitement par alimentation seule si votre médecin ou sage-femme la conseille. La fréquence est personnalisée.

## Au quotidien
### Organiser les collations
- **Moments** : en milieu de matinée et dans l’après-midi, ou selon le plan défini avec votre équipe (parfois en soirée).
- **Idées** : yaourt nature et quelques amandes ; pain complet et fromage à pâte pressée cuite ; fromage blanc nature et un fruit entier ; bâtonnets de légumes et houmous ; une poignée de noix non salées.
- **À éviter** en collation : jus de fruits, biscuits sucrés, barres de céréales sucrées, viennoiseries.

### Bouger
- **Marche**, natation, aquagym, yoga, vélo d’appartement, gymnastique douce : ce sont les activités citées par ameli. Une courte marche après le repas s’intègre facilement.
- **Fractionnez** : trois fois dix minutes comptent aussi.
- **Évitez** les sports à risque de chute ou de choc et la plongée.
- **Limitez la sédentarité** : levez-vous régulièrement si vous travaillez assise.
- **Hydratez-vous** et adaptez l’effort à la chaleur.

### L’autosurveillance
- Notez **l’heure, le résultat** et ce que vous avez mangé ou fait juste avant.
- **Lavez-vous les mains** avant chaque mesure, comme on vous l’a montré.
- Apportez votre carnet à chaque consultation.
- Ne modifiez pas seule votre traitement : appelez l’équipe en cas de doute.

### Exemple d’organisation
Petit-déjeuner, collation vers 10 h, déjeuner, marche de 15 à 20 minutes, collation vers 16 h, dîner, marche courte. Les mesures sont faites aux moments indiqués par votre médecin.

## Questions fréquentes
**Les collations sont-elles obligatoires ?**
Elles font partie des recommandations de répartition. Si vous n’avez pas faim, parlez-en avec votre diététicien pour ajuster.

**Je suis trop fatiguée pour bouger, que faire ?**
Commencez par de courtes marches et augmentez progressivement. Toute activité compte.

**Le diabète disparaît-il après l’accouchement ?**
Santé.fr signale un risque accru de diabète de type 2 plus tard pour l’enfant, et ameli conseille aux femmes concernées de continuer à surveiller leur glycémie, à manger sainement et à bouger. Demandez à votre médecin quel suivi prévoir après la naissance.

**Faut-il se peser souvent ?**
La prise de poids fait partie de la surveillance, selon Santé.fr : suivez le rythme de pesée conseillé par votre équipe.

## Quand demander conseil
Contactez l’équipe en cas de glycémies répétées hors objectifs, de malaise avec sueurs ou tremblements, de vomissements empêchant de manger. Consultez en urgence en cas de contractions, de saignements, de perte de liquide, de maux de tête intenses avec troubles de la vue ou de diminution des mouvements du bébé. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ collations, fringales
  a({
    slug: 'collations-grossesse-idees',
    title: 'Les collations pendant la grossesse : quand et quoi choisir',
    summary: 'Goûter, en-cas du matin ou petite faim du soir : des idées de collations équilibrées et pratiques pour chaque trimestre.',
    category: 'alimentation-grossesse', tags: ['collation', 'goûter', 'en-cas', 'petite faim', 'idées', 'fruits à coque'],
    sources: [S.spfBrochure, S.santeAlimentation, S.santePoids],
    body_md: `## En bref
- Une **collation** n’est pas obligatoire, mais elle peut aider, notamment à partir du **2e trimestre**.
- Les meilleures idées : **produit laitier, fruit, pain complet, petite poignée de fruits à coque non salés**.
- Gâteaux, biscuits et viennoiseries sont à **limiter**, surtout ceux classés **Nutri-Score D ou E**.
- La collation **complète** les repas, elle ne les remplace pas.

## Comprendre
Santé.fr conseille trois repas par jour sans en sauter et indique qu’à partir du deuxième trimestre, un goûter équilibré peut s’ajouter (fruit, produit laitier, poignée d’oléagineux). Santé publique France propose dans sa brochure 2026 plusieurs idées : yaourt, fromage, pain complet, fromage blanc avec un fruit, petite poignée de fruits à coque non salés, et conseille de limiter gâteaux et biscuits.

Au premier trimestre, les petites prises fréquentes aident aussi en cas de nausées. En fin de grossesse, quand l’estomac a moins de place, fractionner l’alimentation peut limiter les remontées acides.

Santé.fr suggère aussi une collation du matin, comme un yaourt et/ou un fruit, pour limiter les fringales, et de préférer le fruit entier ou la compote au jus.

## Au quotidien
### Collations « fraîches »
- Yaourt nature et fruits frais coupés.
- Fromage blanc, un peu de miel et une poignée de flocons d’avoine.
- Fromage à pâte pressée cuite et quelques tomates cerises bien lavées.
- Riz au lait ou semoule au lait maison.

### Collations « à emporter »
- Fruit entier (pomme, banane, clémentine), compote sans sucre ajouté en gourde.
- Petite poignée d’amandes, de noix ou de noisettes non salées.
- Pain complet et un carré de chocolat.
- Fruits secs (abricots, pruneaux, figues) : utiles en cas de constipation.

### Collations « qui calent »
- Tartine de pain complet avec fromage.
- Bâtonnets de légumes et houmous.
- Œuf dur.
- Bol de soupe.

### Boissons
De l’eau à volonté. Un verre de jus ou de boisson sucrée maximum par jour selon Santé publique France. Le thé est à prendre à distance des repas.

### Quand prendre sa collation ?
Selon votre rythme : milieu de matinée si le petit-déjeuner est tôt, après-midi si le dîner est tardif. Évitez de grignoter en continu.

### Selon le trimestre
- **1er trimestre** : en cas de nausées, de petites prises fréquentes de ce qui passe bien (biscuits secs, pain, yaourt, fruit), et un en-cas dès le réveil.
- **2e trimestre** : un goûter équilibré peut s’ajouter, comme le propose Santé.fr.
- **3e trimestre** : si l’estomac manque de place, des repas un peu moins copieux et une ou deux collations aident à couvrir les besoins.

### Penser à la sécurité
Même en collation, gardez les précautions de la grossesse : pas de fromage au lait cru ou à croûte fleurie, pas de charcuterie prête à consommer, fruits bien lavés.

## Questions fréquentes
**Je n’ai jamais faim entre les repas, dois-je prendre une collation ?**
Non. Si vos repas sont complets et que vous n’avez pas faim, la collation n’est pas nécessaire.

**Les barres de céréales sont-elles un bon choix ?**
Elles sont souvent sucrées. Vérifiez la liste d’ingrédients et le Nutri-Score, ou préférez un fruit et quelques amandes.

**Faut-il éviter les fruits à coque pendant la grossesse ?**
Non, sauf si vous y êtes vous-même allergique : Santé publique France recommande même une petite poignée de fruits à coque non salés par jour.

**Et la nuit, si j’ai faim ?**
Un produit laitier ou un fruit peut aider. Si les fringales nocturnes sont fréquentes, parlez-en à votre sage-femme.

## Quand demander conseil
Parlez-en si vous avez souvent faim malgré des repas complets, si vous prenez ou perdez du poids rapidement, ou si vous avez des malaises. ${URG}

${FIN}`,
  }),
  a({
    slug: 'faim-grignotage-grossesse-reperes',
    title: 'Faim fréquente et grignotage pendant la grossesse : retrouver des repères',
    summary: 'Vous avez l’impression d’avoir tout le temps faim : pourquoi, et comment organiser vos repas pour être rassasiée sans grignoter en continu.',
    category: 'alimentation-grossesse', tags: ['faim', 'grignotage', 'fringales', 'satiété', 'fibres', 'prise de poids', 'manger deux fois plus'],
    sources: [S.santePoids, S.spfBrochure, S.ameliSurpoids],
    body_md: `## En bref
- Les besoins augmentent **légèrement** pendant la grossesse, même avec des jumeaux : il ne s’agit pas de manger pour deux.
- Des repas **complets et riches en fibres** rassasient plus longtemps.
- Manger **lentement**, à heures assez régulières, aide à mieux sentir la satiété.
- Les **régimes amaigrissants** sont contre-indiqués : on ajuste, on ne se prive pas.

## Comprendre
Santé.fr rappelle que les petites faims et envies de grignoter sont courantes, surtout en début de grossesse. Santé publique France précise que les besoins ne sont que légèrement supérieurs, même en cas de grossesse gémellaire. Manger « pour deux » n’est donc pas nécessaire, et un grignotage continu de produits sucrés ou gras peut contribuer à une prise de poids importante.

La prise de poids est normale et progressive, plus marquée au dernier trimestre. Elle dépend de votre poids de départ ; une pesée une ou deux fois par mois suffit en général. Si vous pensez avoir pris trop de poids, Santé.fr conseille de demander des conseils adaptés à votre professionnel de santé plutôt que de faire un régime.

Ameli souligne qu’un diététicien ou un médecin peut aider à gérer les fringales et les envies de sucre, de gras ou de sel, et repérer un trouble du comportement alimentaire, qui peut réapparaître pendant la grossesse.

## Au quotidien
### Des repas qui tiennent
- **Trois repas** à heures assez régulières, sans en sauter.
- **Légumes** à chaque repas, en entrée ou en accompagnement.
- **Féculents complets** : pain complet, riz complet, pâtes complètes, flocons d’avoine.
- **Légumineuses** au moins deux fois par semaine.
- **Protéines** au déjeuner et au dîner : viande ou poisson bien cuits, œufs bien cuits, légumineuses, produits laitiers.

### Des astuces simples
- **Gardez le fruit ou le laitage** du repas pour une petite faim plus tard, comme le propose Santé publique France.
- **Buvez de l’eau** : elle aide à équilibrer l’appétit.
- **Mangez assise**, sans écran, en prenant votre temps.
- **Préparez des collations** à l’avance pour éviter le placard à biscuits.
- **Rangez hors de vue** les produits qui vous font craquer.
- **Reposez-vous** autant que possible : la fatigue rend les repas plus difficiles à organiser.
- **Bougez chaque jour** : la marche peut aussi aider à couper une envie.

### Repérer la faim et l’envie
Avant de grignoter, demandez-vous : ai-je faim (ventre qui gargouille, fatigue, baisse d’énergie) ou envie (ennui, stress, habitude) ? Si c’est une envie, un verre d’eau, une courte marche ou un appel à une amie peuvent suffire. Si c’est la faim, une collation complète est plus adaptée qu’un biscuit.

### Faire équipe
Santé.fr note que changer ses habitudes avec son ou sa partenaire les rend plus faciles à tenir.

## Questions fréquentes
**Faut-il manger plus au 3e trimestre ?**
Les besoins augmentent un peu, mais restent modestes. Suivez votre appétit, avec des repas variés et, si besoin, une collation.

**Je mange pour deux, mon entourage insiste : que répondre ?**
Les autorités de santé recommandent de manger « deux fois mieux, pas deux fois plus ».

**Le grignotage peut-il favoriser le diabète gestationnel ?**
Une prise de poids excessive augmente le risque de diabète gestationnel et d’hypertension, selon Santé.fr. Parlez-en lors de votre suivi.

**Je n’arrive plus à contrôler ce que je mange, à qui en parler ?**
À votre sage-femme ou à votre médecin, sans honte : un accompagnement, par exemple avec un diététicien ou un psychologue, peut vous aider.

## Quand demander conseil
Consultez si vous prenez ou perdez du poids rapidement, si vous avez des crises de grignotage incontrôlables, des vomissements provoqués ou une grande détresse. Le **3114** répond 24 h/24 en cas de souffrance psychique. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ hygiène et conservation
  a({
    slug: 'refrigerateur-grossesse-temperature-rangement',
    title: 'Le réfrigérateur pendant la grossesse : température, rangement et nettoyage',
    summary: 'Régler le froid à 4 °C maximum, ranger chaque aliment au bon endroit et nettoyer régulièrement : des gestes simples qui limitent le risque de listériose.',
    category: 'alimentation-grossesse', tags: ['réfrigérateur', 'frigo', 'température', 'listeria', 'rangement', 'nettoyage', 'hygiène'],
    sources: [S.ansesFrigo, S.santeListeriose, S.spfBrochure],
    body_md: `## En bref
- Température idéale : **entre 0 et 4 °C** au point le plus froid, à vérifier avec un **thermomètre**.
- Viandes et poissons crus, préparations maison à base d’œufs et plats en sauce vont dans la **zone la plus froide**.
- **Emballez** les aliments entamés, retirez les suremballages, ne surchargez pas.
- **Nettoyez** régulièrement à l’eau savonneuse, puis rincez à l’eau légèrement javellisée.

## Comprendre
La bactérie Listeria a une particularité : elle peut se multiplier au froid. C’est pourquoi un réfrigérateur bien réglé et bien entretenu est un élément important de la prévention de la listériose pendant la grossesse. Santé.fr rappelle de régler la température à 4 °C, de nettoyer souvent le réfrigérateur puis de le désinfecter à l’eau de Javel diluée, et de respecter les dates limites de consommation. Santé publique France ajoute qu’une mauvaise conservation favorise Listeria et que la congélation ne la détruit pas.

L’Anses détaille les bons gestes : contrôler régulièrement la température, ranger les aliments selon leur fragilité, éviter de mettre des aliments chauds et entretenir l’appareil.

## Au quotidien
### Régler et contrôler
- Placez un **thermomètre** dans la zone la plus froide et vérifiez-le régulièrement.
- Certains réfrigérateurs récents ont une **pastille** qui indique si la zone la plus froide est bien sous 4 °C.
- **Limitez les ouvertures** fréquentes et prolongées, et vérifiez que la porte ferme bien : une condensation permanente peut signaler un défaut de joint.

### Ranger
- **Zone la plus froide** (indiquée dans la notice) : viandes et poissons crus, préparations maison à base d’œufs crus, plats de viande en sauce.
- **Retirez les suremballages** (cartons de yaourts, par exemple) pour limiter les contaminations et laisser circuler l’air.
- **Ne surchargez pas** : le froid doit circuler.
- **Emballez** les aliments entamés dans un film ou une boîte hermétique.
- **Séparez le cru et le cuit** : pas de viande crue au-dessus d’un plat prêt à manger.
- **Pas d’aliments chauds** directement au frigo, mais pas plus de **deux heures** à température ambiante avant de les y mettre.

### Nettoyer
- Dès qu’il y a une salissure, et **régulièrement** : eau savonneuse, puis rinçage à l’eau légèrement javellisée. Évitez la Javel pure sur les parois.
- **Désinfectez l’éponge** avant (eau javellisée ou chaleur) : elle peut être très chargée en bactéries.
- **Dégivrez** régulièrement, et plus tôt si la glace se forme anormalement vite.

### Dates et restes
- **DLC** (« à consommer jusqu’au ») : ne la dépassez jamais. Consommez rapidement après ouverture.
- **Restes** : trois jours maximum, réchauffés à cœur.
- **Décongélation** : toujours au réfrigérateur, jamais à température ambiante.

## Questions fréquentes
**Quelle est la zone la plus froide de mon frigo ?**
Cela dépend du modèle : consultez la notice ou mesurez avec un thermomètre.

**Faut-il laver les aliments avant de les ranger ?**
Lavez plutôt les fruits et légumes juste avant de les consommer. Retirer les emballages extérieurs suffit au rangement.

**À quelle fréquence nettoyer ?**
Dès qu’il y a une salissure et régulièrement ; pendant la grossesse, un nettoyage fréquent est conseillé par Santé.fr.

**La porte du frigo convient-elle au lait ?**
La porte est généralement la zone la moins froide : réservez-la aux produits les moins fragiles (boissons, condiments) et vérifiez la température avec un thermomètre.

## Quand demander conseil
Une fièvre, des courbatures ou des symptômes ressemblant à une grippe pendant la grossesse doivent faire consulter rapidement : la listériose se traite d’autant mieux que le traitement est commencé tôt. ${URG}

${FIN}`,
  }),
  a({
    slug: 'hygiene-cuisine-grossesse-gestes',
    title: 'Hygiène en cuisine pendant la grossesse : les gestes qui protègent',
    summary: 'Lavage des mains, des légumes et des planches, séparation du cru et du cuit, cuisson à cœur : les gestes clés contre la toxoplasmose, la listériose et la salmonellose.',
    category: 'alimentation-grossesse', tags: ['hygiène', 'cuisine', 'lavage des mains', 'planche à découper', 'cuisson', 'toxoplasmose', 'listériose', 'salmonellose'],
    sources: [S.ameliToxo, S.santeListeriose, S.santeAliments],
    body_md: `## En bref
- **Lavez-vous les mains** au savon au moins 30 secondes, ongles compris, avant de cuisiner et après avoir touché de la viande crue ou des légumes terreux.
- **Rincez soigneusement** fruits, légumes et herbes à l’eau claire.
- **Séparez le cru et le cuit**, nettoyez planches et ustensiles après chaque usage.
- **Cuisez à cœur** viandes, poissons, coquillages et œufs.

## Comprendre
Trois infections d’origine alimentaire sont surveillées pendant la grossesse. La **toxoplasmose** concerne les femmes non immunisées, ce qu’indique une prise de sang en début de grossesse : le parasite peut être présent dans la viande peu cuite et sur les végétaux souillés de terre. La **listériose** concerne toutes les femmes enceintes, car on ne peut pas être immunisé : la bactérie se trouve dans certains produits laitiers, charcuteries et produits de la mer. La **salmonellose** est liée notamment aux œufs crus.

Une grande partie de la prévention se fait dans la cuisine, avec des gestes simples. Ameli et Santé.fr les détaillent.

## Au quotidien
### Les mains
- Au savon, **au moins 30 secondes**, ongles compris.
- **Avant** de cuisiner et de manger, **après** avoir manipulé viande crue, poisson cru, œufs, légumes terreux, après le jardinage, le contact avec des animaux ou la litière, après être allée aux toilettes ou avoir changé une couche.
- Santé.fr ajoute de se laver les mains après avoir manipulé des aliments, même cuits.

### Les fruits, légumes et herbes
- **Rincez à l’eau claire** pour retirer toute trace de terre ; le vinaigre n’est pas nécessaire selon ameli.
- **Épluchez** si besoin et lavez sous l’eau courante les fraises, les salades feuille à feuille, les herbes aromatiques.
- Les **graines germées crues** sont à éviter.
- En cas de doute sur le lavage, préférez-les **cuits**.

### Planches, couteaux et plans de travail
- Une planche pour le **cru**, une pour le **cuit** et les crudités, ou un lavage soigneux entre deux usages.
- Nettoyez **surfaces et ustensiles après chaque usage**, surtout après avoir découpé de la viande crue.
- Changez souvent les **torchons** et désinfectez les **éponges**.

### La cuisson
- **Viande** : à cœur, à plus de 68 °C, sans jus rosé à la coupe. Le micro-ondes n’est pas plus efficace que les autres modes de cuisson.
- **Poisson et coquillages** : bien cuits.
- **Œufs** : jaune et blanc bien pris. Pas de mayonnaise, de mousse ou de tiramisu maison à base d’œufs crus.
- **Plats cuisinés et restes** : réchauffés bien chauds et consommés rapidement.

### Bon à savoir
Ameli indique que congeler la viande au moins trois jours à moins de −18 °C agit contre le toxoplasme, mais la congélation ne détruit pas Listeria. Cuire reste le geste le plus sûr.

## Questions fréquentes
**Puis-je goûter la pâte à gâteau crue ?**
Si elle contient des œufs crus, mieux vaut s’abstenir pendant la grossesse.

**Mon partenaire cuisine, doit-il suivre les mêmes règles ?**
Oui, c’est même une excellente façon de partager les précautions.

**Faut-il ajouter du vinaigre à l’eau de lavage ?**
Ameli recommande un rinçage soigneux à l’eau claire et précise que le vinaigre n’est pas nécessaire.

**Je suis immunisée contre la toxoplasmose, puis-je relâcher ?**
Les précautions contre la toxoplasmose ne vous concernent plus, mais celles contre la listériose et la salmonellose restent valables.

## Quand demander conseil
Consultez rapidement en cas de fièvre, de courbatures, de troubles digestifs ou de symptômes de type grippal pendant la grossesse. ${URG}

${FIN}`,
  }),
  a({
    slug: 'cuisiner-a-l-avance-restes-congelation-grossesse',
    title: 'Cuisiner à l’avance, restes et congélation pendant la grossesse',
    summary: 'Préparer ses repas pour plusieurs jours, conserver les restes et utiliser le congélateur en respectant les précautions de la grossesse.',
    category: 'alimentation-grossesse', tags: ['batch cooking', 'restes', 'congélation', 'décongélation', 'réchauffer', 'organisation', 'fatigue'],
    sources: [S.santeAliments, S.ansesFrigo, S.santeListeriose],
    body_md: `## En bref
- Cuisiner en plus grande quantité **fait gagner du temps** quand la fatigue se fait sentir.
- Les **restes** se gardent **trois jours maximum** au réfrigérateur et se **réchauffent à cœur**.
- Mettez les plats au froid **dans les deux heures** qui suivent la cuisson.
- **Décongelez toujours au réfrigérateur**, jamais à température ambiante.
- La congélation ne détruit pas Listeria : elle ne « rattrape » pas un aliment à risque.

## Comprendre
Préparer ses repas à l’avance est une stratégie utile pendant la grossesse : on cuisine quand on a de l’énergie, on évite les odeurs de cuisson les jours de nausées, et on a toujours un repas équilibré sous la main. Quelques règles permettent de le faire en toute sécurité.

Santé publique France et Santé.fr indiquent de réchauffer à cœur les restes et plats cuits, de ne pas les garder plus de trois jours et de ne jamais décongeler hors du réfrigérateur. Une mauvaise conservation favorise Listeria, qui se multiplie au froid et résiste à la congélation. L’Anses recommande de ne pas laisser un plat plus de deux heures à température ambiante avant de le réfrigérer, car certaines préparations peuvent contenir des spores qui germent et produisent des toxines à température ambiante, et de ne pas mettre d’aliments brûlants directement au réfrigérateur.

## Au quotidien
### Organiser une séance de cuisine
- **Choisissez 2 ou 3 recettes** qui se conservent bien : soupe, dahl de lentilles, chili, ratatouille, gratin de légumes, poulet rôti, riz ou pâtes complètes, boulettes cuites.
- **Faites cuire à cœur** viandes, poissons et œufs.
- **Laissez tiédir** puis répartissez en **boîtes individuelles** hermétiques.
- **Étiquetez** avec le nom du plat et la date.
- **Au réfrigérateur** : ce que vous mangerez dans les trois jours. **Au congélateur** : le reste.

### Réchauffer
- **Bien chaud, à cœur**, en remuant au micro-ondes à mi-cuisson.
- Réchauffez **seulement la portion** que vous allez manger.
- Un plat réchauffé et non terminé ne se remet pas au frigo.

### Congeler et décongeler
- Congelez des plats **refroidis**, en portions.
- **Décongelez au réfrigérateur** la veille, ou directement à la cuisson.
- Ne recongelez pas un plat décongelé, sauf s’il a été recuit entre-temps.

### Les aliments à ne pas préparer à l’avance
Les préparations à base d’œufs crus (mayonnaise, mousse) restent à éviter. Les crudités se lavent et se préparent plutôt au moment du repas.

### Avec l’aide de l’entourage
Proposer à vos proches de cuisiner un plat de plus est une belle façon de vous aider, en fin de grossesse comme après la naissance. Transmettez-leur ces règles simples.

## Questions fréquentes
**Le riz cuit peut-il être conservé ?**
Oui, au réfrigérateur rapidement après la cuisson, comme les autres plats, et réchauffé bien chaud.

**Combien de temps garder un plat au congélateur ?**
Suivez les indications de votre congélateur et consommez de préférence dans les semaines qui suivent pour garder le goût.

**Un reste de quatre jours sent bon, puis-je le manger ?**
Pendant la grossesse, il est recommandé de ne pas dépasser trois jours, même si l’aspect et l’odeur semblent corrects.

**Les plats préparés achetés en barquette ?**
Respectez leur date limite et consommez-les rapidement après ouverture, bien réchauffés.

## Quand demander conseil
Consultez en cas de fièvre, de courbatures, de diarrhée ou de vomissements, en signalant votre grossesse. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ situations particulières
  a({
    slug: 'surpoids-grossesse-manger-equilibre-sans-regime',
    title: 'Surpoids ou obésité pendant la grossesse : manger équilibré sans régime',
    summary: 'Pas de régime amaigrissant pendant la grossesse, mais des repères concrets, un objectif de prise de poids personnalisé et un accompagnement adapté.',
    category: 'alimentation-grossesse', tags: ['surpoids', 'obésité', 'IMC', 'prise de poids', 'régime', 'index glycémique', 'chirurgie bariatrique'],
    sources: [S.ameliSurpoids, S.santePoids, S.spfBrochure],
    body_md: `## En bref
- Les **régimes amaigrissants sont contre-indiqués** pendant la grossesse.
- Un **objectif de prise de poids adapté à votre IMC** est fixé dès le début, avec un suivi régulier.
- Les aliments à **index glycémique bas** sont à privilégier : céréales complètes, fruits, légumes, légumineuses, oléagineux non salés, produits laitiers non sucrés et eau.
- L’**activité physique** est recommandée, quel que soit votre poids, sauf contre-indication.
- Un **diététicien** peut vous accompagner sans jugement.

## Comprendre
En cas de surpoids ou d’obésité, la grossesse bénéficie d’un suivi un peu plus attentif. Ameli explique qu’un objectif de prise de poids adapté à l’IMC est défini dès le début, avec des pesées régulières et des conseils personnalisés. Une alimentation équilibrée associée à une activité physique légère à modérée et encadrée limite la prise de poids et réduit les risques d’hypertension, de diabète gestationnel et de bébé de poids élevé (macrosomie).

Le but n’est pas de perdre du poids pendant la grossesse : Santé.fr et Santé publique France rappellent que les régimes amaigrissants sont contre-indiqués. Il s’agit de manger « mieux », de façon variée, en limitant les produits très sucrés, gras ou ultra-transformés.

Après une **chirurgie de l’obésité** (chirurgie bariatrique), le risque de carences et de diabète gestationnel est plus élevé, surtout si la grossesse débute moins d’un an après l’opération. Ameli indique qu’un dépistage précoce du diabète, un bilan diététique et une supplémentation peuvent alors être proposés.

## Au quotidien
### Dans l’assiette
- **Légumes** à chaque repas, en bonne place.
- **Féculents complets** à chaque repas, en quantité raisonnable.
- **Légumineuses** plusieurs fois par semaine.
- **Protéines** bien cuites : volaille, poisson, œufs, légumineuses.
- **Produits laitiers non sucrés**.
- **Fruits entiers** plutôt que jus.
- **Eau** comme boisson, boissons sucrées limitées (un verre maximum par jour, light compris).
- Lisez les **étiquettes** et le **Nutri-Score** pour repérer les produits très gras, sucrés ou salés.

### Bouger
Ameli conseille une activité d’intensité légère à modérée (on peut parler pendant l’effort), 30 à 60 minutes par jour, 3 à 5 jours par semaine : marche, natation, vélo d’appartement, yoga, gymnastique douce, aquagym. Les sports à risque de chute ou de choc et la plongée sont déconseillés. Limitez aussi le temps passé assise.

### Le suivi
- Pesée régulière, éventuellement **automesure de la tension** à domicile.
- **Dépistage du diabète gestationnel**.
- **Entretien prénatal précoce** et séances de préparation à la naissance.
- Les échographies peuvent être plus difficiles : des techniques existent pour améliorer les images.

## Questions fréquentes
**Puis-je essayer de ne pas grossir du tout ?**
Non, sauf avis médical particulier. Un objectif adapté vous sera proposé ; ne vous restreignez pas seule.

**J’ai des fringales et des envies de sucré, qui peut m’aider ?**
Un diététicien ou un médecin spécialiste peut vous aider à les gérer, ainsi que les nausées.

**J’ai eu des épisodes de boulimie, faut-il le dire ?**
Oui. Ameli note qu’une boulimie connue peut reprendre pendant la grossesse ; un suivi attentif est alors proposé.

**Le choix de la maternité dépend-il de mon poids ?**
Il est discuté avec vous dès le début de grossesse, en tenant compte de votre IMC, de votre lieu de vie et de vos préférences.

## Quand demander conseil
Parlez-en lors du suivi si votre prise de poids s’écarte de l’objectif ou si vous vous sentez jugée. Consultez rapidement en cas de maux de tête intenses, de troubles de la vue, de gonflement brutal, de saignements ou de contractions. ${URG} En cas de souffrance psychique, le **3114** répond 24 h/24.

${FIN}`,
  }),
  a({
    slug: 'fin-de-grossesse-petits-repas-estomac-comprime',
    title: 'Fin de grossesse : manger quand l’estomac manque de place',
    summary: 'Au 3e trimestre, le bébé prend de la place : fractionner les repas, limiter les remontées acides et la constipation tout en continuant à bien manger.',
    min_week: 27,
    category: 'alimentation-grossesse', tags: ['troisième trimestre', 'fin de grossesse', 'repas fractionnés', 'remontées acides', 'constipation', 'satiété', 'dîner'],
    sources: [S.ameliDigestion, S.spfBrochure, S.santePoids],
    body_md: `## En bref
- En fin de grossesse, la pression du bébé sur l’estomac favorise les **remontées acides** et une **satiété rapide**.
- **Fractionnez** : des repas moins copieux, complétés par une ou deux collations.
- **Couchez-vous environ trois heures** après le dîner.
- Contre la **constipation** : fibres, eau, marche.
- La prise de poids est **plus marquée** au dernier trimestre : c’est attendu.

## Comprendre
Au troisième trimestre, l’utérus remonte et comprime l’estomac et l’intestin. Ameli explique que cette pression favorise les régurgitations et les brûlures liées au reflux. La compression du côlon, le ralentissement de l’activité physique, la progestérone et parfois une supplémentation en fer favorisent aussi la constipation.

Les besoins, eux, restent à couvrir. Santé publique France rappelle que la prise de poids est plus marquée en fin de grossesse et que l’objectif reste une alimentation variée. La solution est donc de **répartir** l’alimentation plutôt que de manger moins.

## Au quotidien
### Fractionner
- Trois repas **moins copieux**, plus une collation le matin et/ou l’après-midi.
- Gardez le **dessert pour plus tard** si vous êtes vite rassasiée.
- **Mangez lentement** et mâchez bien.

### Limiter les remontées acides
- **Évitez les repas trop copieux**, très gras, acides ou épicés.
- **Ne vous penchez pas** en avant juste après le repas et évitez les efforts intenses.
- **Dîner tôt** : ameli conseille d’attendre environ trois heures avant de vous coucher.
- **Surélevez la tête du lit**.
- **Buvez** de préférence entre les repas.

### Prévenir la constipation
- **Fibres** augmentées progressivement : légumes verts, fruits frais, légumineuses, pain et céréales complets, fruits secs comme les pruneaux, fruits à coque non salés.
- **Au moins 1,5 litre d’eau** par jour, soupes comprises, selon ameli.
- **Marche** quotidienne si votre grossesse le permet ; levez-vous régulièrement si vous êtes assise longtemps.
- **Toilettes** : à heure régulière, sans forcer, avec un petit marchepied sous les pieds.
- **Aucun laxatif sans avis médical** : ameli précise que certains peuvent déclencher des contractions.

### Idées de petits repas
Velouté de légumes et tartine de pain complet au fromage ; omelette et poêlée de courgettes ; poisson bien cuit, purée de légumes ; salade de pâtes complètes et poulet ; yaourt et compote en collation.

## Questions fréquentes
**Je n’ai plus faim le soir, est-ce gênant ?**
Un dîner léger convient si vos apports de la journée sont suffisants. Une collation dans l’après-midi peut compenser.

**Les brûlures d’estomac m’empêchent de dormir, que faire ?**
Dînez plus tôt et plus léger, surélevez la tête du lit, et parlez-en à votre sage-femme ou médecin avant de prendre un médicament.

**Faut-il préparer quelque chose pour la maternité ?**
Des collations simples dans la valise (fruits secs, biscuits secs, compotes en gourde) sont pratiques pour l’accompagnant et pour vous si l’équipe l’autorise.

**Mes jambes gonflent, dois-je boire moins ?**
Non, continuez à boire. Signalez tout gonflement, surtout s’il est brutal ou touche le visage et les mains.

## Quand demander conseil
Consultez rapidement en cas de douleur intense en haut du ventre ou sous les côtes, de maux de tête violents, de troubles de la vue, de gonflement brutal du visage ou des mains, de vomissements en fin de grossesse, de contractions régulières, de perte de liquide, de saignements ou de diminution des mouvements du bébé. ${URG}

${FIN}`,
  }),
];
