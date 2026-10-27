/** Guide complet — lot 01 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  spfGuide: { label: 'Santé publique France — Guide Manger Bouger « De la grossesse à l’arrivée de bébé »', url: 'https://www.santepubliquefrance.fr/sites/default/files/cadic_files/documents/spf00006707.pdf', consulted_on: C },
  santeAEviter: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Quels aliments éviter et quelles précautions prendre quand on est enceinte ?', url: 'https://www.sante.fr/node/7070507', consulted_on: C, published: '2025-10-15' },
  santePrecautions: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Les précautions alimentaires pendant la grossesse', url: 'https://www.sante.fr/prendre-des-precautions-alimentaires-pendant-la-grossesse', consulted_on: C, published: '2024-12-02' },
  santeAutorises: { label: 'Santé.fr (mpedia) — Grossesse : les aliments autorisés, déconseillés et interdits', url: 'https://www.sante.fr/grossesse-les-aliments-autorises-deconseilles-et-interdits', consulted_on: C, published: '2026-04-24' },
  santeLimiter: { label: 'Santé.fr — Manger mieux pendant la grossesse : les aliments à limiter ou éviter', url: 'https://www.sante.fr/manger-mieux-pendant-la-grossesse-les-aliments-limiter-ou-eviter', consulted_on: C, published: '2023-07-05' },
  santeEquilibre: { label: 'Santé.fr (mpedia) — Enceinte, une alimentation saine et équilibrée durant la grossesse', url: 'https://www.sante.fr/enceinte-une-alimentation-saine-et-equilibree-durant-la-grossesse', consulted_on: C, published: '2025-08-28' },
  santePoisson: { label: 'Santé.fr — Les femmes enceintes doivent-elles éviter de manger du poisson ?', url: 'https://www.sante.fr/decryptage/nos-reponses/les-femmes-enceintes-doivent-elles-eviter-de-manger-du-poisson', consulted_on: C, published: '2025-03-17' },
  santeListeriose: { label: 'Santé.fr — Listériose', url: 'https://www.sante.fr/listeriose-1', consulted_on: C, published: '2026-08-13' },
  santeSalmonellose: { label: 'Santé.fr (mpedia) — Salmonellose enceinte, comment l’éviter ?', url: 'https://www.sante.fr/salmonellose-enceinte-comment-leviter', consulted_on: C, published: '2026-02-10' },
  santeSel: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Limiter les produits salés et le sel pour préserver sa santé', url: 'https://www.sante.fr/limiter-les-produits-sales-et-le-sel-pour-preserver-sa-sante', consulted_on: C, published: '2024-06-14' },
  santeSucres: { label: 'Santé.fr (Anses) — Sucres dans l’alimentation', url: 'https://www.sante.fr/sucres-dans-lalimentation', consulted_on: C, published: '2024-03-18' },
  santeLegumesSecs: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Augmenter les légumes secs', url: 'https://www.sante.fr/augmenter-les-legumes-secs', consulted_on: C, published: '2023-02-09' },
  santeFeculents: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Privilégier les féculents complets pour une alimentation saine', url: 'https://www.sante.fr/privilegier-les-feculents-complets-pour-une-alimentation-saine', consulted_on: C, published: '2024-06-14' },
  santeHuiles: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Aller vers l’huile de colza, de noix et d’olive', url: 'https://www.sante.fr/aller-vers-lhuile-de-colza-de-noix-et-dolive', consulted_on: C, published: '2021-01-02' },
  santeEau: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — L’eau, à consommer à volonté', url: 'https://www.sante.fr/leau-consommer-volonte', consulted_on: C, published: '2025-10-13' },
  ameliAlimentation: { label: 'ameli.fr — Adapter son alimentation pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/alimentation-grossesse', consulted_on: C, published: '2026-06-18' },
  ameliDigestion: { label: 'ameli.fr — Nausées, vomissements, remontées acides et constipation lors de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/enceinte-problemes-de-digestion', consulted_on: C, published: '2026-06-19' },
  ameliToxo: { label: 'ameli.fr — Toxoplasmose : gestes de prévention à adopter lors de la grossesse', url: 'https://www.ameli.fr/assure/sante/themes/toxoplasmose/prevention', consulted_on: C, published: '2024-05-28' },
  ameliEau: { label: 'ameli.fr — L’eau', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-adulte/alimentation-adulte-types-aliments/eau', consulted_on: C, published: '2024-06-24' },
  ameliFer: { label: 'ameli.fr — Bien couvrir ses besoins en fer et consulter en cas de saignement', url: 'https://www.ameli.fr/assure/sante/themes/anemie-par-carence-en-fer/couvrir-besoins-fer-age', consulted_on: C, published: '2023-07-31' },
  ameliEnvironnement: { label: 'ameli.fr — Grossesse et petite enfance : agir sur l’environnement', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-environnement/grossesse-environnement', consulted_on: C, published: '2026-06-22' },
  ansesPoissons: { label: 'Anses — Poissons et produits de la pêche : conseils de consommation', url: 'https://www.anses.fr/fr/system/files/ANSES-Ft-RecosPoissons.pdf', consulted_on: C, published: '2016-02' },
  ansesEdulcorants: { label: 'Anses — Édulcorants intenses : pas de bénéfice nutritionnel démontré (actualité, version anglaise)', url: 'https://www.anses.fr/en/news/no-nutritional-value-found-intense-sweeteners-human-diet', consulted_on: C, published: '2015-01-09' },
  ansesReglisse: { label: 'Anses — Consommation de réglisse : quels sont les risques ?', url: 'https://www.anses.fr/fr/content/consommation-de-reglisse-quels-sont-les-risques', consulted_on: C, published: '2025-07-15' },
  ansesComplements: { label: 'Anses — Compléments alimentaires et grossesse : ne pas cumuler les sources de vitamines et minéraux (actualité, version anglaise)', url: 'https://www.anses.fr/en/news/food-supplements-and-pregnancy-anses-warns-against-combining-multiple-sources-vitamins-and', consulted_on: C, published: '2017-06-07' },
  ansesIode: { label: 'Anses — Iode (fiche nutriment, version anglaise)', url: 'https://www.anses.fr/en/article/iodine', consulted_on: C, published: '2022-11-03' },
  ansesVitD: { label: 'Anses — Vitamine D : pourquoi et comment assurer des apports suffisants ? (version anglaise)', url: 'https://www.anses.fr/en/article/vitamin-why-do-i-need-adequate-intake-and-how-can-i-make-sure-i-get-it', consulted_on: C, published: '2022-03-02' },
  ansesGibier: { label: 'Anses — Consommation de gibier sauvage : réduire l’exposition au plomb (actualité, version anglaise)', url: 'https://www.anses.fr/en/news/consumption-wild-game-action-needed-reduce-exposure-chemical-contaminants-and-lead-particular', consulted_on: C, published: '2018-03-23' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe ; il ne remplace pas l’avis de la sage-femme, du médecin ou du diététicien qui vous accompagne._';
const URG = 'En cas d’urgence, appelez le **15** (SAMU) ou le **112**.';
const FIEVRE = 'Une **fièvre pendant la grossesse**, même isolée, ou des courbatures et maux de tête inexpliqués doivent faire **consulter rapidement**, en signalant ce que vous avez mangé : une listériose se traite d’autant mieux qu’elle est repérée tôt.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({ journeys: ['pregnant'], status: 'to_review', ...x });

export const GUIDE_B01: LibArticle[] = [
  // ------------------------------------------------------------------ produits laitiers
  a({
    slug: 'fromages-enceinte-lesquels-choisir',
    title: 'Fromages enceinte : lesquels choisir, lesquels éviter ?',
    summary: 'Le point fromage par fromage : pâtes pressées cuites, pâtes molles, bleus, fromages frais, râpés et croûtes pendant les neuf mois.',
    category: 'alimentation-grossesse', tags: ['fromage', 'listériose', 'lait cru', 'comté', 'camembert', 'fromage râpé', 'croûte'], safety_critical: true,
    sources: [S.santeAEviter, S.santePrecautions, S.spfGuide],
    body_md: `## En bref
- **À privilégier** : les fromages à **pâte pressée cuite** (comté, beaufort, emmental, gruyère, parmesan), **sans la croûte**.
- **À éviter pendant neuf mois** : fromages au **lait cru**, fromages à **pâte molle** (camembert, brie, munster, pont-l’évêque), à **croûte fleurie ou lavée**, **bleus**, et pâtes pressées non cuites à affinage court (reblochon, morbier), **même pasteurisés**.
- **Pas de fromage râpé en sachet** : râpez vous-même un morceau de comté ou d’emmental.
- Les fromages **bien cuits au four** (gratin, quiche) restent possibles.

## Comprendre
La principale raison de ces précautions s’appelle *Listeria*. Cette bactérie, présente dans l’environnement, peut contaminer certains fromages et **se multiplier même au réfrigérateur**, à 4 °C. Un aliment contaminé a généralement un aspect, une odeur et un goût tout à fait ordinaires : on ne peut pas le repérer à l’œil.

Chez la femme enceinte, la listériose ressemble souvent à une simple grippe, avec de la fièvre, des maux de tête et des douleurs musculaires. Elle est peu grave pour la mère mais peut l’être pour le bébé. Ces précautions concernent donc toutes les femmes enceintes, quel que soit le résultat de leurs prises de sang.

Les fromages ne présentent pas tous le même niveau de risque :
- les **pâtes pressées cuites** (gruyère, comté, emmental, beaufort, parmesan) sont autorisées, y compris au lait cru pour le gruyère ou le comté, **à condition de retirer la croûte** ;
- les **pâtes molles** à croûte fleurie ou lavée et les **bleus** sont exclus, **même au lait pasteurisé** ;
- le **fromage râpé industriel** vendu en sachet est à éviter ;
- le **fromage fondu à tartiner** fait partie des fromages autorisés.

Le guide de Santé publique France précise que les fromages pasteurisés sont autorisés, **en dehors de ces exceptions**. Il déconseille aussi les **substituts de fromage à base de boissons végétales**.

## Au quotidien
- **Lisez l’étiquette** : la mention « au lait cru » doit vous alerter, sauf pour les pâtes pressées cuites.
- **À la coupe**, demandez au fromager le type de pâte et de lait ; n’hésitez pas à préciser que vous êtes enceinte.
- **Retirez toujours la croûte**, quel que soit le fromage.
- **Râpez vous-même** votre fromage juste avant de l’utiliser.
- **Conservez** les fromages bien emballés au réfrigérateur, à 4 °C maximum, et consommez-les rapidement une fois entamés.
- **Plateau de fromages** chez des amis : servez-vous de comté, d’emmental ou de parmesan, et laissez de côté les pâtes molles et les bleus.
- **Variez** : certains fromages, comme les bleus ou les pâtes persillées, sont aussi très salés.

### Idées pour garder le plaisir du fromage
- Un gratin de légumes avec du comté râpé maison.
- Une quiche ou une tarte salée bien cuite.
- Des copeaux de parmesan sur des pâtes chaudes.
- Un morceau de beaufort avec du pain complet au goûter.

## Questions fréquentes
**Les fromages de chèvre sont-ils autorisés ?**
Une bûche à croûte fleurie est à éviter. Un chèvre frais au lait pasteurisé, sans croûte, entre dans les fromages pasteurisés autorisés par le guide de Santé publique France. En cas de doute sur un fromage précis, demandez à votre sage-femme.

**Puis-je manger un camembert cuit au four ?**
Les sources consultées autorisent les fromages bien cuits dans un plat (gratin, quiche). Un fromage simplement tiédi ou coulant n’offre pas les mêmes garanties : si vous avez un doute, préférez un plat où le fromage est cuit longuement et servi très chaud.

**Et la raclette ou la fondue ?**
Le fromage y est fondu plutôt que cuit longuement au four, et il s’agit souvent de pâtes pressées non cuites. Les sources consultées ne détaillent pas ce cas : parlez-en à votre sage-femme ou à votre médecin avant d’en manger.

**J’ai mangé un fromage à éviter avant de savoir que j’étais enceinte. Que faire ?**
Pas de panique : la listériose reste rare. Surveillez l’apparition de fièvre ou de courbatures dans les semaines qui suivent et consultez si cela arrive, en signalant ce que vous avez mangé.

**Ces précautions continuent-elles après l’accouchement ?**
Elles visent la grossesse. Après la naissance, demandez à votre sage-femme ce qui change pour vous, notamment si vous allaitez ; l’alcool reste déconseillé pendant l’allaitement.

## Quand demander conseil
${FIEVRE} Vous pouvez aussi demander à votre sage-femme une liste personnalisée des fromages adaptés à vos habitudes. ${URG}

${FIN}`,
  }),
  a({
    slug: 'lait-yaourts-calcium-grossesse',
    title: 'Lait, yaourts et calcium pendant la grossesse',
    summary: 'Pourquoi le calcium compte, quels produits laitiers choisir, que faire si vous n’en consommez pas, et ce qu’il vaut mieux éviter.',
    category: 'alimentation-grossesse', tags: ['calcium', 'lait', 'yaourt', 'produits laitiers', 'lait cru', 'eau minérale', 'phytostérols'],
    sources: [S.ameliAlimentation, S.spfGuide, S.santeEquilibre],
    body_md: `## En bref
- Le **calcium** sert à construire le squelette et les dents du bébé, surtout au **3e trimestre**.
- Les **produits laitiers** en sont la meilleure source : comptez **2 à 3 par jour** selon les repères (Santé publique France en recommande 2, ameli en cite 3).
- **Évitez le lait cru** et les produits au lait cru, sauf les fromages à pâte pressée cuite.
- Sans produits laitiers, d’autres sources existent : **eaux minérales riches en calcium**, chou vert, oranges, légumes secs, amandes.

## Comprendre
Pendant la grossesse, le bébé puise dans vos apports pour former ses os. Les besoins augmentent surtout en fin de grossesse. Une alimentation qui comprend des produits laitiers chaque jour couvre en général ces besoins : en l’absence de carence ou de régime particulier, un complément de calcium n’est pas nécessaire.

La **vitamine D** aide l’organisme à absorber le calcium. Elle est en partie fabriquée par la peau au soleil et apportée par certains aliments ; une supplémentation est souvent prescrite en fin de grossesse.

Les produits laitiers apportent aussi des protéines et de l’**iode**, utile au développement du cerveau du bébé.

Ce qui est à éviter :
- le **lait cru** et les produits au lait cru (risque de listériose et de salmonellose) ;
- les **produits enrichis en phytostérols**, présentés comme réduisant le cholestérol (certains yaourts, boissons lactées ou margarines), sauf avis médical contraire ;
- les **boissons et desserts au soja**, déconseillés par précaution pendant la grossesse ;
- les **substituts de fromage à base de boissons végétales**.

## Au quotidien
- **Répartissez** vos produits laitiers dans la journée : un bol de lait ou un yaourt le matin, un morceau de fromage à pâte pressée cuite à midi, un fromage blanc au goûter.
- **Le goûter**, possible dès le 2e trimestre, est une bonne occasion : yaourt nature et fruit, pain complet et emmental.
- **Choisissez** du lait pasteurisé ou stérilisé et vérifiez l’étiquette des produits fermiers.
- **Respectez les dates limites** et consommez rapidement les produits entamés.
- **Cuisinez-les** : gratins, sauces béchamel, flans, riz au lait.
- **Vous ne buvez pas de lait ?** Les yaourts, fromages blancs et petits-suisses en apportent aussi. Les eaux minérales riches en calcium peuvent compléter : leur composition figure sur l’étiquette.
- **Sources végétales** : chou vert, oranges, légumes, légumes secs et amandes participent aussi aux apports.

## Questions fréquentes
**Les yaourts « au lait cru » vendus à la ferme sont-ils possibles ?**
Le lait cru et les produits au lait cru sont à éviter pendant la grossesse. Préférez des produits au lait pasteurisé.

**Je digère mal le lait. Que faire ?**
Parlez-en à votre médecin ou à votre sage-femme : une intolérance ou une allergie se gère avec un professionnel, qui vous aidera à trouver d’autres sources de calcium.

**Les crèmes dessert et yaourts aromatisés comptent-ils ?**
Ils font partie des produits laitiers, mais ils sont souvent sucrés : gardez-les pour le plaisir et préférez au quotidien les yaourts nature, que vous pouvez agrémenter d’un fruit.

**Faut-il prendre un complément de calcium ?**
Pas systématiquement. Il peut être proposé si vous consommez peu de produits laitiers ou suivez un régime particulier : seul un professionnel peut en juger.

**Et si je suis végétalienne ?**
Une alimentation végétalienne expose à des manques de calcium, de vitamine D, de vitamine B12, d’iode et de fer. Parlez-en tôt à votre médecin ou à votre sage-femme : des supplémentations sont nécessaires.

## Quand demander conseil
Consultez si vous ne consommez aucun produit laitier, si vous suivez un régime d’exclusion ou si vous avez des crampes ou une grande fatigue : votre professionnel fera le point sur vos apports. Ne prenez aucun complément sans son avis. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ charcuterie, œufs
  a({
    slug: 'charcuterie-jambon-saucisson-grossesse',
    title: 'Charcuterie enceinte : jambon, saucisson, pâté, que retenir ?',
    summary: 'Pourquoi la charcuterie demande des précautions pendant la grossesse, lesquelles éviter et comment en manger autrement, bien cuite.',
    category: 'alimentation-grossesse', tags: ['charcuterie', 'jambon', 'saucisson', 'pâté', 'rillettes', 'foie gras', 'listériose', 'salmonellose'], safety_critical: true,
    sources: [S.santeAEviter, S.spfGuide, S.santeListeriose],
    body_md: `## En bref
- **À éviter** : rillettes, pâtés, foie gras, produits en gelée, **saucisson sec**, **jambon sec ou cru**.
- **Charcuteries cuites à conserver au froid** (jambon blanc, par exemple) : les recommandations récentes conseillent de les éviter **sauf si elles sont recuites**.
- **Possible** : les charcuteries **que vous cuisez vous-même** (saucisses, boudin), bien cuites et mangées chaudes.
- **À limiter** de toute façon : environ **150 g par semaine** selon le guide de Santé publique France.

## Comprendre
La charcuterie concentre plusieurs risques pendant la grossesse :
- la **listériose** : la bactérie *Listeria* peut se développer dans les charcuteries conservées au froid, même au réfrigérateur ;
- la **salmonellose** : les produits secs et crus, comme le saucisson sec ou le jambon sec, ne sont pas cuits ;
- la **toxoplasmose**, si vous n’êtes pas immunisée : les viandes séchées, fumées ou marinées doivent d’abord être bien cuites.

Les sources ne sont pas toutes formulées de la même façon pour le **jambon blanc** : certaines pages le citent parmi les aliments autorisés, tandis que Santé publique France recommande d’éviter les charcuteries cuites conservées au froid lorsqu’elles ne sont pas recuites. Par prudence, vous pouvez le consommer **dans un plat bien cuit et servi chaud** (croque, quiche, gratin), ou en parler avec votre sage-femme.

La charcuterie est aussi **très salée** et grasse : même en dehors de la grossesse, elle reste à consommer occasionnellement et en petite quantité.

## Au quotidien
- **Faites cuire** : saucisses, boudin, lardons, chipolatas doivent être bien cuits à cœur et mangés aussitôt.
- **Recuisez** les charcuteries crues ou séchées si vous les utilisez en cuisine : un chorizo ou un jambon cru cuits dans une pizza ou un plat mijoté, bien chauds, ne posent plus le même problème qu’à froid.
- **Évitez** d’ajouter du jambon cru **après** la cuisson d’une pizza ou d’une tarte.
- **Consommez vite** les produits tranchés une fois l’emballage ouvert, et respectez les dates limites.
- **Séparez** les aliments crus des aliments prêts à manger dans le réfrigérateur et sur le plan de travail.
- **Remplacez** à l’apéritif : bâtonnets de carotte et houmous, tomates cerises, radis, plutôt que saucisson.
- **Au restaurant ou chez des amis**, demandez si la charcuterie a été cuite dans le plat.

## Questions fréquentes
**Le jambon blanc sous vide est-il interdit ?**
Les avis divergent selon les sources. Santé publique France recommande d’éviter les charcuteries cuites conservées au froid si elles ne sont pas recuites. Le plus prudent est de le manger chaud, dans un plat cuit, et d’en parler avec votre professionnel si vous en consommez souvent.

**Le saucisson est-il dangereux même en petite quantité ?**
Le saucisson sec et le jambon sec sont déconseillés pendant toute la grossesse, en raison notamment du risque de salmonellose et de listériose. Il n’existe pas de « petite quantité » recommandée.

**Puis-je manger du foie gras à Noël ?**
Le foie gras est à éviter pendant la grossesse (risque de listériose), et le foie est par ailleurs très riche en vitamine A. Vous pourrez le retrouver après la naissance.

**Les lardons sont-ils autorisés ?**
Oui, s’ils sont bien cuits à la poêle ou dans un plat, et consommés chauds.

**Je suis immunisée contre la toxoplasmose : puis-je manger du saucisson ?**
L’immunité protège de la toxoplasmose, mais pas de la listériose ni de la salmonellose. Les recommandations restent donc les mêmes.

## Quand demander conseil
${FIEVRE} Consultez aussi en cas de diarrhée avec fièvre, de vomissements qui empêchent de boire ou de douleurs inhabituelles du ventre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'oeufs-cuisson-grossesse',
    title: 'Les œufs pendant la grossesse : bien cuits, oui !',
    summary: 'Les œufs sont précieux pendant la grossesse s’ils sont bien cuits : quelles cuissons choisir, lesquelles éviter et les bons gestes en cuisine.',
    category: 'alimentation-grossesse', tags: ['œufs', 'salmonellose', 'œuf à la coque', 'omelette', 'cuisson', 'protéines'],
    sources: [S.santeSalmonellose, S.santePrecautions, S.santeEquilibre],
    body_md: `## En bref
- Les œufs **bien cuits** sont autorisés et intéressants : protéines, fer du jaune, iode, vitamine D.
- **À éviter** : œufs **crus ou peu cuits** (coque, mollet, jaune coulant) et préparations maison à base d’œufs crus.
- Le risque principal est la **salmonellose**, une infection d’origine alimentaire.
- **Lavez-vous les mains** après avoir manipulé des œufs crus et séparez cru et cuit.

## Comprendre
Les salmonelles sont des bactéries qui peuvent se trouver sur ou dans les œufs crus. Chez un adulte en bonne santé, la salmonellose provoque surtout une gastro-entérite (diarrhée, fièvre, troubles digestifs), en général entre 6 et 48 heures après le repas. Pendant la grossesse, elle reste le plus souvent limitée au tube digestif, mais une forte fièvre, une déshydratation importante ou, plus rarement, une infection passée dans le sang peuvent perturber la grossesse.

On ne s’immunise pas durablement : on peut l’attraper plusieurs fois. La cuisson détruit les bactéries, c’est pourquoi seuls les œufs bien cuits sont recommandés.

Côté nutrition, l’œuf est un aliment pratique :
- il apporte des **protéines** et peut remplacer la viande ou le poisson ;
- le **jaune** contient du fer, de l’iode et de la vitamine D ;
- il contient aussi des **folates** (vitamine B9) ;
- certains œufs sont **enrichis en oméga-3**, utiles au développement du cerveau du bébé.

## Au quotidien
- **Cuissons à privilégier** : œuf dur, omelette bien prise, œufs brouillés fermes, œuf au plat dont le jaune est cuit, œufs dans un gâteau, une quiche ou un flan bien cuits.
- **Cuissons à éviter** : œuf à la coque, œuf mollet, œuf poché coulant, œuf au plat au jaune liquide.
- **Hygiène** : lavez-vous les mains au savon après avoir cassé des œufs, nettoyez le plan de travail et les ustensiles.
- **Cuisine** : ne goûtez pas une pâte à gâteau crue contenant des œufs.
- **Conservation** : respectez la date indiquée sur la boîte et ne gardez pas les restes de plats aux œufs plus de trois jours au réfrigérateur.

### Idées de repas avec des œufs
- Omelette aux légumes et pain complet.
- Œufs durs en salade avec lentilles et crudités bien lavées.
- Frittata au four avec épinards et emmental.
- Clafoutis aux fruits, bien cuit.

## Questions fréquentes
**Les œufs extra-frais peuvent-ils être mangés à la coque ?**
Même très frais, un œuf peu cuit n’est pas débarrassé des salmonelles. Les sources de santé publique recommandent les œufs bien cuits pendant toute la grossesse.

**Combien d’œufs puis-je manger par semaine ?**
Les sources consultées ne fixent pas de nombre précis pour la grossesse. Les œufs font partie des protéines à consommer chaque jour, en alternance avec la viande, le poisson et les légumes secs.

**Les œufs bio ou de plein air sont-ils plus sûrs ?**
Le mode d’élevage ne change pas la règle : quelle que soit leur origine, mangez-les bien cuits.

**Les œufs de cailles ou de canard suivent-ils les mêmes règles ?**
Oui : comme tous les œufs, ils doivent être bien cuits.

## Quand demander conseil
Consultez rapidement en cas de **fièvre élevée ou qui dure**, de **diarrhée avec du sang** ou persistante, de **vomissements** qui empêchent de boire ou de manger, de grand malaise, de **douleurs du ventre inhabituelles**, de **contractions** ou si vous sentez **moins bouger** votre bébé. Ne prenez pas de médicament sans avis : un éventuel traitement doit être compatible avec la grossesse. ${URG}

${FIN}`,
  }),
  a({
    slug: 'desserts-sauces-maison-oeufs-crus-grossesse',
    title: 'Mayonnaise, mousse au chocolat, tiramisu : les préparations maison',
    summary: 'Les recettes à base d’œufs crus et les desserts alcoolisés pendant la grossesse : ce qui pose problème et des alternatives gourmandes.',
    category: 'alimentation-grossesse', tags: ['mayonnaise', 'mousse au chocolat', 'tiramisu', 'crème anglaise', 'desserts', 'œufs crus', 'alcool'],
    sources: [S.santeAEviter, S.santePrecautions, S.santeAutorises],
    body_md: `## En bref
- Les préparations **maison à base d’œufs crus** (mayonnaise, mousse au chocolat, tiramisu) sont **à éviter** pendant la grossesse.
- Les mêmes préparations **du commerce** sont considérées comme **peu à risque**.
- La **crème anglaise** et certains desserts peu cuits font aussi partie des préparations déconseillées.
- **Pas d’alcool**, y compris dans les desserts et les plats cuisinés : une partie reste même après une longue cuisson.

## Comprendre
Un œuf cru peut contenir des salmonelles, des bactéries responsables d’intoxications alimentaires. Dans une mousse ou une mayonnaise maison, les œufs ne sont pas cuits : rien ne détruit les bactéries. Santé publique France invite à la prudence avec ces recettes, **surtout lorsqu’elles sont préparées à l’avance**.

Les versions du commerce de ces préparations sont, elles, considérées comme peu à risque par les sources de santé publique.

Pour l’alcool, aucune quantité n’est connue comme étant sans effet pour le bébé. Contrairement à une idée répandue, la cuisson ne fait pas tout disparaître : il en reste même après plus de deux heures. Desserts flambés, babas, tiramisus au marsala, sauces au vin sont donc à mettre de côté pendant la grossesse.

## Au quotidien
### Remplacer les recettes à risque
- **Mayonnaise** : choisissez une mayonnaise du commerce, ou une sauce au yaourt, au fromage blanc et aux herbes bien lavées.
- **Mousse au chocolat** : préférez une crème au chocolat cuite, un fondant ou un moelleux bien cuit.
- **Tiramisu** : réalisez une version « sans œufs crus » (par exemple à base de mascarpone pasteurisé et de crème) et sans alcool, ou choisissez un tiramisu du commerce sans alcool.
- **Crème anglaise** : une version du commerce, ou un flan, une crème renversée bien prise.

### Desserts bien cuits, simples à faire
- Clafoutis, flan pâtissier, gâteau au yaourt, crumble.
- Riz au lait, semoule au lait.
- Compotes et fruits cuits au four.

### En pratique
- **Au restaurant**, demandez si un dessert contient des œufs crus ou de l’alcool.
- **Chez des amis**, n’hésitez pas à expliquer que vous évitez les préparations maison à base d’œufs crus pendant la grossesse.
- **Gardez la modération** : ces desserts restent riches en sucre et en matières grasses.

## Questions fréquentes
**Une mayonnaise maison faite à l’instant est-elle possible ?**
Les sources recommandent d’éviter les préparations maison à base d’œufs crus, en soulignant surtout le risque lorsqu’elles sont préparées à l’avance. Même fraîchement préparée, elle contient un œuf cru : préférez une mayonnaise du commerce.

**Les glaces et sorbets sont-ils concernés ?**
Les sources consultées ne détaillent pas ce point. Pour une glace artisanale ou maison, demandez si elle contient des œufs crus ou du lait cru, et parlez-en à votre sage-femme en cas de doute.

**Un gâteau au rhum ou au vin cuit au four est-il possible ?**
Non, il vaut mieux l’éviter : une partie de l’alcool reste dans la préparation, même après une cuisson prolongée.

**J’ai goûté une mousse maison. Dois-je m’inquiéter ?**
Pas de panique. Surveillez l’apparition de diarrhée, de fièvre ou de vomissements dans les deux jours qui suivent et consultez si cela arrive.

## Quand demander conseil
Consultez rapidement en cas de fièvre élevée ou persistante, de diarrhée avec du sang, de vomissements qui empêchent de boire, de douleurs du ventre inhabituelles, de contractions ou si votre bébé bouge moins. Si vous avez du mal à vous passer d’alcool, parlez-en sans crainte à votre sage-femme ou à votre médecin : un accompagnement existe. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ poissons et fruits de mer
  a({
    slug: 'poissons-especes-a-choisir-grossesse',
    title: 'Quels poissons manger enceinte ? Le guide espèce par espèce',
    summary: 'Les poissons à privilégier, à limiter et à éviter pendant la grossesse, avec les cas particuliers de la pêche en eau douce et des séjours en zone tropicale.',
    category: 'alimentation-grossesse', tags: ['poisson', 'mercure', 'thon', 'saumon', 'sardine', 'eau douce', 'ciguatera', 'oméga-3'],
    sources: [S.santePoisson, S.ansesPoissons, S.spfGuide],
    body_md: `## En bref
- **Deux portions de poisson par semaine**, dont **un poisson gras** : c’est bénéfique pour le bébé.
- **À privilégier**, bien cuits : sardine, maquereau, hareng et saumon non fumés, cabillaud, colin, lieu, merlu, merlan, sole, truite, anchois, poissons d’élevage.
- **À limiter** : grands prédateurs sauvages comme le thon (y compris en conserve), la lotte, le bar et la daurade sauvages, la raie, le flétan, le brochet.
- **À éviter** : espadon, marlin, siki, requin, lamproie, ainsi que le foie de morue.

## Comprendre
Le poisson apporte des **oméga-3 à longue chaîne** (EPA et DHA), essentiels au développement du système nerveux du fœtus, ainsi que de l’**iode**, du sélénium, du zinc et des **vitamines A, D et E**. Il serait dommage de s’en priver.

Certains poissons accumulent toutefois des polluants :
- le **méthylmercure**, surtout chez les grands poissons carnivores situés en haut de la chaîne alimentaire ;
- les **dioxines et PCB**, qui se concentrent dans certains poissons gras comme l’anguille et dans les poissons d’eau douce dits « bio-accumulateurs ».

Le cerveau de l’enfant est particulièrement sensible à ces substances jusqu’à 3 ans : c’est pourquoi l’Anses a formulé des recommandations spécifiques pour les femmes enceintes ou allaitantes et les jeunes enfants.

Une **portion cuite** correspond à environ **100 g**.

## Au quotidien
- **Alternez** un poisson gras (sardine, maquereau, hareng, saumon non fumé) et un poisson maigre (cabillaud, colin, merlan, sole).
- **Variez les espèces et les lieux d’approvisionnement**, pour ne pas accumuler les mêmes polluants.
- **Cuisez bien** le poisson, à cœur : il doit s’effeuiller facilement.
- **Conservez** le poisson frais dans la zone la plus froide du réfrigérateur et cuisinez-le rapidement.
- **Conserves** : les sardines et maquereaux en conserve sont des poissons cuits et pratiques ; le thon en boîte fait partie des poissons à limiter. N’utilisez jamais une conserve bombée, rouillée ou malodorante.
- **Labels** : pour une pêche plus responsable, les labels bio, ASC (élevage) ou MSC (pêche sauvage) peuvent guider vos achats.

### Pêche en eau douce
Si vous ou vos proches pêchez en rivière ou en étang, sachez que l’anguille, le barbeau, la brème, la carpe, le poisson-chat et le silure sont des poissons bio-accumulateurs : pendant la grossesse, **au maximum une fois tous les deux mois, voire pas du tout**.

### Séjour en zone tropicale
Dans certaines régions tropicales, de grands poissons de mer carnivores (barracuda, mérou, carangue, sarde, pagre) peuvent contenir une toxine appelée ciguatera, qui peut notamment provoquer un accouchement prématuré : évitez-les sur place.

## Questions fréquentes
**Le thon en boîte est-il interdit ?**
Non, il est **à limiter**, pas à supprimer. Variez avec des sardines, du maquereau ou du saumon cuit.

**Le saumon est-il recommandé ?**
Oui, le saumon **cuit et non fumé** fait partie des poissons gras à privilégier. Le saumon fumé ou cru est à éviter.

**Les poissons panés ou surgelés comptent-ils ?**
Un poisson surgelé nature, bien cuit, est une bonne option. Les poissons panés sont plus riches en matières grasses : comparez les Nutri-Score et cuisez-les complètement.

**Ces recommandations valent-elles pendant l’allaitement ?**
Pendant l’allaitement, l’Anses recommande toujours de limiter les grands prédateurs sauvages et d’éviter espadon, marlin, siki, requin et lamproie.

**Je n’aime pas le poisson. Est-ce un problème ?**
Parlez-en à votre sage-femme ou à votre médecin : ce professionnel vous indiquera d’autres sources d’oméga-3 et d’iode, et si un complément se discute dans votre situation.

## Quand demander conseil
Si vous consommez souvent du poisson de pêche locale, du poisson en zone tropicale ou si vous ne mangez jamais de poisson, faites le point avec votre sage-femme ou votre médecin. ${URG}

${FIN}`,
  }),
  a({
    slug: 'sushis-poisson-cru-fume-grossesse',
    title: 'Sushis, poisson cru, saumon fumé : que faire pendant la grossesse ?',
    summary: 'Pourquoi le poisson cru, fumé ou mariné est déconseillé pendant la grossesse, et comment garder le plaisir du poisson autrement.',
    category: 'alimentation-grossesse', tags: ['sushi', 'sashimi', 'saumon fumé', 'tarama', 'surimi', 'poisson cru', 'listériose', 'ceviche'], safety_critical: true,
    sources: [S.santePoisson, S.santePrecautions, S.santeListeriose],
    body_md: `## En bref
- **À éviter pendant la grossesse** : sushis et sashimis au poisson cru, tartares, ceviches et poissons marinés, **poissons fumés** (saumon, truite), tarama, œufs de poisson crus.
- Le **surimi** figure aussi parmi les produits que Santé.fr déconseille aux femmes enceintes.
- **La congélation ne détruit pas *Listeria*** : un poisson cru surgelé n’est pas plus sûr.
- Le poisson **bien cuit** (au-delà de 65 °C à cœur) reste recommandé deux fois par semaine.

## Comprendre
Le poisson cru ou simplement fumé peut transmettre deux types de risques :
- la **listériose**, une infection rare mais grave pour le bébé, due à une bactérie qui survit et se multiplie au froid ;
- des **parasites**, qui sont détruits par une cuisson complète.

Le fumage et la marinade (citron, vinaigre, sel) ne remplacent pas la cuisson : ils ne garantissent pas la destruction des bactéries et des parasites. C’est pourquoi le saumon gravlax, le ceviche ou le hareng mariné sont concernés au même titre que le sashimi.

Ces précautions s’appliquent à **toutes** les femmes enceintes, qu’elles soient immunisées ou non contre la toxoplasmose : l’immunité ne protège pas de la listériose.

## Au quotidien
- **Au restaurant japonais**, choisissez des plats **entièrement cuits** et servis chauds : brochettes grillées, soupes, poisson cuit, tempura, riz sauté. Demandez comment sont préparés les makis : certains sont uniquement végétariens ou garnis d’ingrédients cuits.
- **Méfiez-vous des crudités** dont vous ne connaissez pas le lavage (salades, herbes, garnitures) : en cas de doute, préférez les plats cuits.
- **À la maison**, cuisinez le saumon fumé : dans une quiche, des pâtes chaudes ou un gratin, une fois bien cuit, il ne présente plus le même risque.
- **Œufs de poisson** : ils figurent parmi les produits de la mer à privilégier **bien cuits**, mais sont à éviter crus (œufs de saumon, caviar, tarama).
- **Apéritif** : remplacez le tarama ou le saumon fumé par des rillettes maison de sardines ou de maquereau cuits, un houmous ou des légumes à tremper.

## Questions fréquentes
**Un maki au saumon cuit est-il possible ?**
Oui, si le poisson est réellement cuit et que la préparation est récente. N’hésitez pas à demander au restaurant comment il est préparé.

**Pourquoi le surimi est-il déconseillé alors qu’il est cuit ?**
Santé.fr le cite, comme le tarama, parmi les aliments à éviter pendant la grossesse en raison du risque de listériose, sans détailler ce produit en particulier. En cas de doute, demandez à votre sage-femme.

**J’ai mangé des sushis avant de savoir que j’étais enceinte. Que faire ?**
Pas de panique. Surveillez l’apparition d’une fièvre ou de courbatures dans les semaines qui suivent et consultez si c’est le cas, en précisant ce que vous avez mangé.

**Le poisson cru congelé par le restaurant est-il plus sûr ?**
Non : **la congélation ne tue pas *Listeria***. Le poisson cru reste déconseillé, qu’il ait été congelé ou non.

**Pourrai-je en manger pendant l’allaitement ?**
Les précautions décrites ici visent la grossesse. Demandez à votre sage-femme ce qui change après la naissance, notamment si vous allaitez.

## Quand demander conseil
${FIEVRE} ${URG}

${FIN}`,
  }),
  a({
    slug: 'fruits-de-mer-coquillages-crustaces-grossesse',
    title: 'Fruits de mer enceinte : huîtres, moules, crevettes, que choisir ?',
    summary: 'Coquillages et crustacés pendant la grossesse : jamais crus, toujours bien cuits, et pourquoi acheter les crevettes crues pour les cuire soi-même.',
    category: 'alimentation-grossesse', tags: ['fruits de mer', 'huîtres', 'moules', 'crevettes', 'coquillages', 'crustacés', 'listériose', 'hépatite A'], safety_critical: true,
    sources: [S.santePoisson, S.santeAEviter, S.ameliToxo],
    body_md: `## En bref
- **Jamais crus**, même congelés : huîtres crues, coquillages crus ou peu cuits sont à éviter.
- **Bien cuits**, les fruits de mer sont possibles : la chair doit devenir **opaque**.
- **Évitez les crustacés vendus déjà cuits et décortiqués** (crevettes, langoustines) : achetez-les crus et cuisez-les vous-même.
- Les plats **marinés** à base de fruits de mer sont aussi déconseillés.

## Comprendre
Les fruits de mer peuvent être contaminés par :
- la bactérie *Listeria*, dangereuse pour le bébé ;
- le **virus de l’hépatite A** ;
- des **toxines d’algues** et des **polluants**.

Les crustacés vendus déjà cuits et décortiqués font partie des produits à éviter, en raison du risque de listériose. Santé publique France conseille de les acheter crus et de les cuire vous-même. Rappelez-vous aussi que la congélation ne détruit pas *Listeria* : un fruit de mer cru surgelé reste un fruit de mer cru.

Les huîtres, moules et autres coquillages crus figurent aussi parmi les aliments à éviter si vous n’êtes pas immunisée contre la toxoplasmose.

Les fruits de mer bien cuits apportent de l’**iode**, utile à la thyroïde et au développement du cerveau du bébé, ainsi que du **fer** bien absorbé.

## Au quotidien
- **Moules** : cuisez-les jusqu’à ce que la chair soit bien opaque, dans une marmite couverte, en remuant.
- **Coquilles Saint-Jacques** : cuisez-les à cœur, sans les laisser translucides au centre.
- **Crevettes et langoustines** : achetez-les **crues** (fraîches ou surgelées) et cuisez-les complètement à la maison.
- **Plateau de fruits de mer** : il associe souvent des huîtres crues et des crustacés cuits à l’avance ; pendant la grossesse, mieux vaut s’en passer.
- **Paella, risotto, soupe de poissons** : possibles s’ils sont préparés avec des fruits de mer crus cuits dans le plat, servis bien chauds.
- **Restes** : conservez-les au réfrigérateur, réchauffez-les à cœur et mangez-les sous trois jours.

### Au restaurant
Demandez comment sont préparés les fruits de mer : cuits sur place ou achetés cuits, servis chauds ou froids. Un plat chaud cuisiné à la commande est plus rassurant qu’une salade de crevettes froides.

## Questions fréquentes
**Les huîtres cuites ou gratinées sont-elles possibles ?**
Les sources insistent sur le fait de ne **jamais** consommer de fruits de mer crus. Bien cuits, à chair opaque, ils sont autorisés : une huître simplement tiédie ne l’est pas.

**Les crevettes entières vendues cuites sont-elles concernées ?**
Les recommandations visent surtout les crustacés vendus cuits et décortiqués. Par prudence, préférez des crevettes crues à cuire vous-même, ou faites-les recuire dans un plat chaud.

**Le surimi et les bâtonnets de crabe sont-ils autorisés ?**
Santé.fr cite le surimi parmi les aliments à éviter pendant la grossesse.

**Les bulots et bigorneaux ?**
Ce sont des coquillages : ils doivent être bien cuits. Ceux vendus cuits et conservés au froid sont à considérer avec la même prudence que les crustacés cuits.

## Quand demander conseil
${FIEVRE} Consultez aussi en cas de jaunisse (peau ou yeux jaunes), de grande fatigue ou de troubles digestifs importants après un repas de fruits de mer. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ viandes
  a({
    slug: 'viande-cuisson-a-coeur-grossesse',
    title: 'Viande enceinte : bien cuite à cœur, comment faire ?',
    summary: 'Bœuf, volaille, porc, viande hachée : pourquoi et comment bien cuire la viande pendant la grossesse, et quelles préparations éviter.',
    category: 'alimentation-grossesse', tags: ['viande', 'cuisson', 'steak haché', 'tartare', 'carpaccio', 'toxoplasmose', 'barbecue', 'fer'], safety_critical: true,
    sources: [S.ameliToxo, S.santePrecautions, S.spfGuide],
    body_md: `## En bref
- Toutes les viandes, **rouges comme blanches**, doivent être **bien cuites** pendant la grossesse.
- Repère : plus de **68 °C à cœur** ; en pratique, **aucun jus rosé** ne s’écoule à la découpe.
- **À éviter** : tartare, carpaccio, filet américain, viande saignante, viandes seulement fumées, marinées ou salées.
- **Privilégiez la volaille** et limitez les autres viandes à environ **500 g par semaine**.

## Comprendre
La viande crue ou peu cuite peut transmettre :
- la **toxoplasmose**, un parasite surtout dangereux si vous n’êtes pas immunisée ;
- la **listériose** et la **salmonellose**, des infections bactériennes qui ne dépendent pas de votre statut vis-à-vis de la toxoplasmose.

C’est pourquoi Santé publique France recommande une viande bien cuite **pendant toute la grossesse**, même si votre prise de sang montre que vous êtes immunisée contre la toxoplasmose.

La cuisson est la méthode la plus fiable. Le micro-ondes ne détruit pas mieux le parasite que les autres modes de cuisson. Les techniques comme le fumage, la marinade ou le salage ne suffisent pas.

La viande reste un aliment intéressant : la **viande rouge** apporte un fer bien absorbé par l’organisme, utile car les besoins augmentent pendant la grossesse.

## Au quotidien
- **Viande hachée** : cuisez-la toujours **à cœur**, jusqu’à ce que l’intérieur ne soit plus rosé.
- **Rôtis et pièces épaisses** : un thermomètre de cuisine aide à vérifier la température au centre.
- **Barbecue et grill** : l’extérieur cuit vite mais l’intérieur peut rester cru. Préférez des morceaux fins, coupez pour vérifier, ou optez pour des plats mijotés.
- **Volaille** : elle ne doit jamais être rosée près de l’os.
- **Viandes marinées ou séchées** : elles doivent être bien cuites. Le grand gibier sauvage (cerf, sanglier) est, lui, déconseillé pendant la grossesse à cause du plomb.
- **Plats mijotés** (bœuf carottes, blanquette, tajine) : une cuisson longue permet de cuire la viande à cœur.

### Hygiène en cuisine
- Lavez-vous les mains au savon **au moins 30 secondes**, ongles compris, après avoir touché de la viande crue.
- Utilisez une planche et un couteau dédiés à la viande crue, ou lavez-les avant de couper un aliment prêt à manger.
- Nettoyez le plan de travail après chaque utilisation.
- Rangez la viande crue emballée, séparée des aliments cuits, dans le réfrigérateur à 4 °C maximum, et décongelez-la au réfrigérateur.

### Au restaurant
Demandez une cuisson « bien cuite ». Évitez les plats dont la viande est servie rosée par défaut (magret, carpaccio, tataki).

## Questions fréquentes
**Je suis immunisée contre la toxoplasmose. Puis-je manger ma viande saignante ?**
Les recommandations de Santé publique France demandent une viande bien cuite pendant toute la grossesse, notamment à cause du risque de listériose, qui ne dépend pas de l’immunité.

**Congeler la viande suffit-il ?**
Une congélation d’au moins trois jours en dessous de –18 °C est une option contre le parasite de la toxoplasmose, mais elle ne remplace pas la cuisson pour les autres microbes. La viande doit rester bien cuite.

**Le porc et l’agneau sont-ils concernés ?**
Oui, toutes les viandes : bœuf, veau, agneau, porc, volaille.

**Faut-il manger de la viande rouge tous les jours pour le fer ?**
Non. La volaille, le poisson, les œufs et les légumes secs complètent les apports. Votre professionnel vérifie votre taux de fer par une prise de sang et prescrit un traitement si besoin.

## Quand demander conseil
${FIEVRE} Si vous n’êtes pas immunisée contre la toxoplasmose, une surveillance par prise de sang est prévue régulièrement : signalez à votre sage-femme toute consommation de viande crue. ${URG}

${FIN}`,
  }),
  a({
    slug: 'foie-abats-gibier-grossesse',
    title: 'Foie, foie gras, abats et gibier pendant la grossesse',
    summary: 'Pourquoi le foie est à limiter, le foie gras à éviter et le grand gibier déconseillé pendant la grossesse, et ce qu’il en est des autres abats.',
    category: 'alimentation-grossesse', tags: ['foie', 'foie gras', 'abats', 'vitamine A', 'gibier', 'plomb', 'sanglier', 'pâté'],
    sources: [S.santeLimiter, S.santePrecautions, S.ansesGibier],
    body_md: `## En bref
- **Foie et produits à base de foie** : à **limiter autant que possible**, car ils sont très riches en **vitamine A**.
- **Foie gras, pâtés, mousses de foie** : **à éviter**, en raison du risque de listériose.
- **Grand gibier sauvage** (cerf, sanglier) : à éviter, à cause du **plomb** des munitions.
- **Foie de morue** : également à éviter pendant la grossesse.

## Comprendre
### Le foie et la vitamine A
La vitamine A est indispensable, mais à des taux trop élevés elle peut être nocive pour le bébé. Le foie (de veau, de volaille, d’agneau) en contient beaucoup. Les sources de santé publique recommandent donc de le **limiter**, voire de ne le consommer qu’exceptionnellement pendant la grossesse.

Les **compléments alimentaires** peuvent aussi contenir des vitamines dont un apport élevé est déconseillé pendant la grossesse : ne les prenez pas sans avis médical ni ordonnance.

### Le foie gras et les pâtés
Le foie gras, les pâtés, les mousses de foie et les produits en gelée sont des charcuteries conservées au froid, dans lesquelles la bactérie *Listeria* peut se développer.

### Le gibier et le plomb
Le gros gibier tué par des munitions au plomb peut contenir des fragments de ce métal. Le plomb est nocif pendant le développement du fœtus et pendant l’enfance. L’Anses recommande aux **femmes en âge d’avoir un enfant** et aux enfants d’**éviter totalement** la consommation de grand gibier sauvage.

### Les autres abats
Les abats sont cités parmi les aliments riches en fer. Dans les sources consultées, seul le foie fait l’objet d’une recommandation de limitation liée à la vitamine A. Comme toute viande, les abats doivent être **bien cuits**.

## Au quotidien
- **Remplacez le foie** par d’autres sources de fer : viande rouge bien cuite, poisson, légumes secs, œufs.
- **Fêtes de fin d’année** : remplacez le foie gras par une terrine de légumes, des noix de Saint-Jacques bien cuites, un velouté de châtaignes.
- **Chasseurs dans l’entourage** : déclinez le civet de sanglier ou de chevreuil pendant la grossesse, et pensez-y aussi pour les jeunes enfants.
- **Boudin noir** : il fait partie des charcuteries à cuire soi-même ; bien cuit et mangé chaud, il est possible.
- **Lisez les étiquettes** des terrines et préparations : certaines contiennent du foie.

## Questions fréquentes
**Une petite tranche de foie gras une fois dans l’année, c’est grave ?**
Le foie gras est déconseillé pendant toute la grossesse. Si vous en avez mangé, surveillez une éventuelle fièvre dans les semaines qui suivent et consultez si elle apparaît.

**Le foie de volaille cuit est-il autorisé ?**
Il est à limiter fortement, même bien cuit, à cause de sa richesse en vitamine A : gardez-le pour une occasion exceptionnelle, après en avoir parlé avec votre professionnel si vous en mangez souvent.

**Et le petit gibier (faisan, lièvre) ?**
Les recommandations de l’Anses citées ici portent sur le **grand gibier**. Pour le petit gibier, parlez-en à votre sage-femme ; dans tous les cas, la viande doit être bien cuite.

**Mon complément « spécial grossesse » contient de la vitamine A. Que faire ?**
Montrez-le à votre médecin, votre sage-femme ou votre pharmacien. Les compléments vendus librement sont déconseillés sans avis, car ils peuvent exposer à des surdosages.

## Quand demander conseil
Parlez-en à votre professionnel si vous consommez régulièrement du foie, des produits de chasse, ou si vous prenez des compléments alimentaires. En cas de fièvre pendant la grossesse, consultez rapidement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ végétaux
  a({
    slug: 'legumes-crudites-salades-grossesse',
    title: 'Légumes crus, salades et crudités : les bons gestes enceinte',
    summary: 'Comment laver légumes, salades et herbes, quand préférer les légumes cuits et pourquoi éviter les graines germées crues pendant la grossesse.',
    category: 'alimentation-grossesse', tags: ['légumes', 'crudités', 'salade', 'lavage', 'toxoplasmose', 'graines germées', 'pesticides', 'jardin'],
    sources: [S.santePrecautions, S.ameliToxo, S.spfGuide],
    body_md: `## En bref
- Les légumes sont essentiels : visez **au moins 3 portions de légumes** par jour, dans les 5 fruits et légumes.
- **Lavez soigneusement** légumes, salades (même « prêtes à l’emploi ») et herbes : sous l’eau courante, pour enlever toute la terre.
- **Hors de chez vous**, si vous ne savez pas comment ils ont été lavés, choisissez des **légumes cuits**.
- **Évitez les graines germées crues** et les végétaux **cueillis à l’état sauvage**, champignons compris.

## Comprendre
Les fruits et légumes crus peuvent transmettre la **toxoplasmose** (le parasite vit dans la terre), d’autres parasites ou des bactéries comme *Listeria*. Ce risque compte surtout si vous n’êtes pas immunisée contre la toxoplasmose, mais un bon lavage est utile à toutes.

Le lavage à l’eau claire, en frottant pour éliminer la terre, est la méthode recommandée. Le vinaigre n’est pas nécessaire. Santé publique France conseille de laver les légumes, les salades « prêtes à consommer » et les herbes **deux fois**.

Les **graines germées crues** (alfalfa, radis, soja…) sont citées parmi les aliments à risque de listériose. Les végétaux, herbes et champignons **cueillis dans la nature** sont aussi à éviter pendant la grossesse.

Les sources recommandent enfin de privilégier, si possible, des produits cultivés avec des méthodes limitant l’exposition aux pesticides, par exemple issus de l’agriculture biologique, sans que cela dispense du lavage.

## Au quotidien
- **Lavez** sous l’eau courante, feuille par feuille pour la salade, en frottant les légumes racines.
- **Épluchez** quand c’est possible (carottes, concombres, radis).
- **Herbes fraîches** : lavez-les avec le même soin que la salade.
- **Lavez-vous les mains** et nettoyez la planche après avoir manipulé des légumes terreux.
- **Cuisez** : soupes, poêlées, légumes rôtis au four, gratins sont d’excellentes options, surtout hors de chez vous.
- **Surgelés et conserves** de légumes nature sont pratiques et comptent dans vos portions.
- **Jardinage** : portez des gants et lavez-vous les mains ensuite, même avec des gants.

### Hors de chez vous
- À la cantine, au restaurant ou en restauration rapide, préférez les légumes cuits si vous ne savez pas comment les crudités ont été préparées.
- Pour votre déjeuner au travail, préparez vos crudités vous-même, lavées le matin ou la veille.

## Questions fréquentes
**Les salades en sachet « lavées, prêtes à l’emploi » doivent-elles être relavées ?**
Oui. Santé publique France conseille de laver aussi les salades prêtes à consommer, deux fois à l’eau.

**Faut-il laver les légumes bio ?**
Oui. Le mode de culture ne change rien à la présence de terre ou de microbes : tous les légumes se lavent.

**Puis-je manger les légumes de mon potager ?**
Oui, bien lavés. Portez des gants pour jardiner et lavez-vous les mains après.

**Les germes de soja dans un wok sont-ils autorisés ?**
Les graines germées sont déconseillées **crues**. Bien cuites dans un plat chaud, elles ne posent plus ce problème.

**Je suis immunisée contre la toxoplasmose : dois-je quand même laver mes légumes ?**
Oui, le lavage protège aussi d’autres microbes, comme *Listeria*.

## Quand demander conseil
${FIEVRE} Si vous n’êtes pas immunisée contre la toxoplasmose, n’hésitez pas à demander à votre sage-femme de revoir avec vous les gestes de prévention. ${URG}

${FIN}`,
  }),
  a({
    slug: 'fruits-lavage-jus-grossesse',
    title: 'Les fruits pendant la grossesse : lavage, jus, fruits secs',
    summary: 'Combien de fruits, comment les laver, pourquoi limiter les jus et quelle place donner aux fruits secs pendant la grossesse.',
    category: 'alimentation-grossesse', tags: ['fruits', 'jus de fruits', 'fruits secs', 'fraises', 'lavage', 'vitamine C', 'fibres'],
    sources: [S.spfGuide, S.ameliToxo, S.santeSucres],
    body_md: `## En bref
- Repère : **au moins 5 fruits et légumes par jour**, dont environ **2 fruits**.
- **Lavez** tous les fruits sous l’eau courante, y compris les fraises et les fruits rouges ; épluchez-les si possible.
- Les **jus de fruits** comptent parmi les boissons sucrées : **un verre par jour au maximum**, toutes boissons sucrées confondues.
- **Évitez les fruits cueillis à l’état sauvage** (mûres ou fraises des bois ramassées en promenade).

## Comprendre
Les fruits apportent des **fibres**, des **vitamines** (dont la vitamine C) et de l’eau. La **vitamine C** aide l’organisme à mieux absorber le fer des aliments végétaux : un fruit au dessert est donc un bon réflexe. Certains fruits, comme les **oranges**, participent aussi aux apports en calcium.

Comme les légumes, les fruits peuvent porter de la terre et donc le parasite de la **toxoplasmose**, ou d’autres microbes. Le lavage à l’eau claire courante est recommandé ; le vinaigre n’est pas utile.

Les **jus**, même « 100 % pur jus » ou pressés maison, contiennent des sucres sous forme liquide, qui favorisent la prise de poids selon l’Anses. Santé publique France recommande de limiter l’ensemble des boissons sucrées (jus, sirops, sodas) à **un verre par jour**. Le fruit entier, qui garde ses fibres et rassasie, reste préférable.

Les **fruits secs** (abricots, figues, pruneaux, dattes) sont riches en fibres et participent aux apports en folates. Ils sont aussi concentrés en sucres : une petite quantité suffit.

## Au quotidien
- **Lavez** les fruits juste avant de les manger, sous l’eau courante, en les frottant.
- **Fruits rouges** : rincez-les délicatement mais soigneusement.
- **Fruits cuits** : compotes, fruits rôtis, crumbles sont une bonne solution si vous n’êtes pas sûre du lavage, par exemple à l’extérieur.
- **Au petit-déjeuner** : un fruit frais plutôt qu’un grand verre de jus.
- **Au goûter**, possible dès le 2e trimestre : un fruit et un yaourt, ou quelques fruits secs et une petite poignée de noix.
- **Constipation** : les fruits frais, les fruits secs et les pruneaux, avec de l’eau, aident le transit.
- **Saison** : les fruits de saison sont souvent plus savoureux et moins chers ; les fruits surgelés nature et les compotes sans sucres ajoutés dépannent bien.

## Questions fréquentes
**Les fruits peuvent-ils remplacer les légumes ?**
Les deux sont complémentaires : le repère de Santé publique France est d’environ 3 légumes et 2 fruits par jour.

**Un jus pressé maison est-il meilleur qu’un jus du commerce ?**
Il est souvent plus savoureux, mais il reste une boisson sucrée. Gardez-le pour un verre de temps en temps.

**Le matin, j’ai faim dès le réveil. Un jus peut-il aider ?**
Un jus de fruits frais ou un verre d’eau au réveil peut aider à patienter, avant une collation légère. L’essentiel est de ne pas rester à jeun trop longtemps.

**Les fruits sont-ils autorisés en cas de diabète gestationnel ?**
Oui, mais leur répartition dans la journée se discute avec le professionnel qui vous suit, en fonction de vos glycémies.

**Faut-il éviter certains fruits pendant la grossesse ?**
Les sources consultées ne déconseillent aucun fruit en particulier, à condition qu’il soit bien lavé et ne provienne pas d’une cueillette sauvage.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si vous avez un diabète gestationnel, si vous ne parvenez pas à manger de fruits ou de légumes (nausées, dégoûts) ou si la constipation persiste malgré ces conseils. ${URG}

${FIN}`,
  }),
  a({
    slug: 'legumes-secs-legumineuses-grossesse',
    title: 'Lentilles, pois chiches, haricots : les légumes secs enceinte',
    summary: 'Les légumineuses apportent fibres, protéines, fer et folates : comment les intégrer pendant la grossesse, et le cas particulier du soja.',
    category: 'alimentation-grossesse', tags: ['légumes secs', 'légumineuses', 'lentilles', 'pois chiches', 'haricots', 'fibres', 'soja', 'protéines végétales'],
    sources: [S.santeLegumesSecs, S.spfGuide, S.santePrecautions],
    body_md: `## En bref
- Repère : des **légumes secs au moins 2 fois par semaine** (lentilles, pois chiches, haricots, pois cassés, fèves).
- Ils apportent **fibres**, **protéines végétales**, **fer** et **folates** (vitamine B9).
- Associés à une céréale (riz, semoule, pain), ils peuvent **remplacer la viande** dans un repas.
- **Le soja fait exception** : boissons, desserts, tofu et compléments à base de soja sont déconseillés par précaution.

## Comprendre
Les légumes secs sont des alliés de la grossesse :
- leurs **fibres** favorisent le transit, souvent ralenti pendant la grossesse, et aident à mieux contrôler la glycémie ;
- leurs **protéines** complètent celles des céréales : lentilles et riz, pois chiches et semoule, haricots rouges et maïs ;
- ils contiennent du **fer** d’origine végétale, mieux absorbé si le repas comporte aussi des aliments riches en vitamine C ;
- ils participent aux apports en **folates** et en calcium.

Le **soja** occupe une place à part. Il contient des phyto-œstrogènes, des substances végétales qui peuvent agir comme des hormones. Par précaution, Santé publique France et le Haut Conseil de la santé publique recommandent d’éviter les aliments et boissons à base de soja pendant la grossesse et l’allaitement, et de ne pas prendre de compléments à base d’extraits de soja. Certaines pages mentionnent une tolérance d’un produit au soja par jour au maximum : en cas de doute, parlez-en avec votre professionnel. La sauce soja, en petite quantité occasionnelle, reste possible.

## Au quotidien
- **Commencez progressivement** : en trop grande quantité d’un coup, les fibres peuvent provoquer ballonnements et douleurs. Buvez bien en parallèle.
- **Faites tremper** les légumes secs bruts le matin pour le soir, ou la veille pour le lendemain.
- **Gagnez du temps** avec les conserves (pois chiches, lentilles, haricots déjà cuits, à rincer) ou les surgelés ; les lentilles corail cuisent en une dizaine de minutes.
- **Variez les recettes** : soupe de lentilles, curry de pois chiches et riz complet, salade de haricots, purée de pois cassés, houmous maison.
- **Graines germées** : évitez-les crues ; cuites dans un plat chaud, elles sont possibles.

### Idées de repas
- Dahl de lentilles corail, riz et légumes.
- Salade de pois chiches, crudités bien lavées et œuf dur.
- Chili aux haricots rouges et maïs, bien mijoté.
- Velouté de pois cassés et pain complet.

## Questions fréquentes
**Les légumes secs font-ils grossir ?**
Non. Riches en fibres, ils rassasient et aident à limiter le grignotage. Ce sont plutôt les sauces grasses qui les accompagnent qui apportent des calories.

**Les conserves sont-elles aussi intéressantes ?**
Oui, elles gardent leurs fibres et leurs protéines. Rincez-les pour enlever une partie du sel, et n’utilisez pas une boîte bombée ou rouillée.

**Je suis végétarienne : les légumes secs suffisent-ils ?**
Ils sont une base précieuse, mais une alimentation végétarienne demande une attention particulière au fer, à l’iode, à la vitamine B12 et aux oméga-3. Parlez-en tôt à votre sage-femme ou à votre médecin.

**Le tofu est-il interdit ?**
Par précaution, Santé publique France déconseille les produits à base de soja, dont le tofu, pendant la grossesse et l’allaitement. Demandez conseil si le soja tient une grande place dans votre alimentation.

## Quand demander conseil
Consultez si les ballonnements ou douleurs abdominales sont importants ou persistent, si vous suivez une alimentation végétarienne ou végétalienne, ou si vous êtes très fatiguée. Ne prenez pas de complément sans avis. ${URG}

${FIN}`,
  }),
  a({
    slug: 'fibres-feculents-complets-grossesse',
    title: 'Fibres et féculents complets : un atout contre la constipation',
    summary: 'Pain, pâtes, riz complets et autres sources de fibres pendant la grossesse : pourquoi ils aident, comment les introduire et les gestes contre la constipation.',
    category: 'alimentation-grossesse', tags: ['fibres', 'féculents', 'pain complet', 'constipation', 'transit', 'céréales complètes', 'glycémie'],
    sources: [S.santeFeculents, S.ameliDigestion, S.spfGuide],
    body_md: `## En bref
- Un **féculent à chaque repas**, selon l’appétit, dont **au moins un complet par jour** (pain, pâtes, riz, semoule complets).
- Les **fibres** facilitent le transit, rassasient et aident à mieux contrôler la glycémie.
- **Augmentez-les progressivement** et **buvez de l’eau** pour éviter ballonnements et douleurs.
- Pendant la grossesse, la constipation est fréquente : alimentation, eau et marche sont les premiers leviers.

## Comprendre
Les féculents apportent des glucides complexes, qui libèrent leur énergie progressivement. Dans leur version **raffinée** (pain blanc, pâtes classiques), le germe et l’enveloppe du grain ont été retirés : ils contiennent moins de fibres, de minéraux et de vitamines. Les versions **complètes ou semi-complètes** gardent ces atouts.

En France, la consommation de fibres est faible : selon Santé publique France, seules 8 % des femmes adultes atteignent l’objectif recommandé.

Pendant la grossesse, plusieurs facteurs ralentissent le transit :
- l’effet relaxant de la **progestérone** sur l’intestin ;
- la **compression** de l’intestin par l’utérus ;
- la **baisse d’activité physique** ;
- un éventuel **supplément de fer** ;
- une **déshydratation** liée aux vomissements.

## Au quotidien
### Augmenter les fibres
- **Pain complet ou aux céréales** au petit-déjeuner et en accompagnement.
- **Pâtes, riz, semoule complets ou semi-complets** : commencez par les semi-complets si vous craignez le goût ou la digestion.
- **Légumes secs** au moins 2 fois par semaine.
- **Légumes verts, fruits frais, fruits secs** et oléagineux non salés.
- **Farine complète** pour les crêpes, cakes ou gâteaux.
- **Son d’avoine ou de blé** dans un yaourt, en petite quantité au début.

### Les bons gestes contre la constipation
- **Buvez régulièrement** dans la journée, y compris sous forme de soupes et potages.
- **Marchez** chaque jour, sauf contre-indication médicale : l’activité stimule le transit.
- **Allez aux toilettes à heure fixe**, une demi-heure à une heure après un repas, sans forcer, et ne vous retenez pas.
- **Prenez votre temps** et posez vos pieds sur un petit marchepied.
- **Limitez** les aliments gras et sucrés.

## Questions fréquentes
**Les féculents font-ils grossir pendant la grossesse ?**
Non. Ce sont les ajouts (sauces grasses, fromage en quantité) qui apportent des calories en plus. Les féculents rassasient et limitent le grignotage.

**Puis-je prendre un laxatif ?**
Ne prenez aucun médicament, en particulier aucun laxatif, sans l’avis de votre médecin ou de votre sage-femme. S’il le juge utile, il vous orientera vers un traitement adapté à la grossesse.

**Mon supplément de fer me constipe. Que faire ?**
Parlez-en à la personne qui vous l’a prescrit : n’arrêtez pas le traitement de vous-même.

**J’ai des ballonnements depuis que je mange plus de fibres. Que faire ?**
Augmentez plus lentement, sur plusieurs semaines, et buvez davantage. Les versions semi-complètes sont souvent mieux tolérées.

**Les féculents sont-ils permis en cas de diabète gestationnel ?**
Oui, ils restent nécessaires. Leur quantité et leur répartition se décident avec le professionnel qui vous suit ; les versions complètes sont généralement privilégiées.

## Quand demander conseil
Consultez si la constipation dure malgré ces mesures, si elle s’accompagne de **douleurs importantes**, de **sang dans les selles**, de **vomissements** ou d’un ventre gonflé et dur. Des douleurs du ventre rythmées peuvent aussi être des contractions : appelez la maternité. ${URG}

${FIN}`,
  }),
  a({
    slug: 'fruits-a-coque-graines-grossesse',
    title: 'Noix, amandes, noisettes : les fruits à coque enceinte',
    summary: 'Une petite poignée par jour : ce que les fruits à coque apportent pendant la grossesse, comment les choisir et ce que l’on sait des allergies.',
    category: 'alimentation-grossesse', tags: ['fruits à coque', 'noix', 'amandes', 'noisettes', 'arachide', 'allergie', 'collation', 'oméga-3'],
    sources: [S.spfGuide, S.santeEquilibre, S.ameliDigestion],
    body_md: `## En bref
- Repère : une **petite poignée de fruits à coque non salés par jour** (noix, amandes, noisettes, pistaches, noix de cajou).
- Ils apportent des **fibres**, des **bons acides gras** (oméga-3 des noix), du **calcium** (amandes) et du **fer**.
- **Ne les évitez pas pour prévenir une allergie** chez votre enfant : cela pourrait au contraire augmenter le risque.
- Si **vous-même** êtes allergique, continuez bien sûr à les éviter et parlez-en à votre médecin.

## Comprendre
Les fruits à coque font partie des aliments que Santé publique France recommande de consommer chaque jour, en petite quantité. Ils sont concentrés en énergie, d’où la notion de « petite poignée ».

Leurs atouts pendant la grossesse :
- les **noix** et l’huile de noix apportent des oméga-3, utiles au développement du cerveau et des yeux du bébé ;
- les **amandes** participent aux apports en calcium ;
- les noix, amandes et châtaignes contiennent des **folates** ;
- leurs **fibres** aident le transit : ameli cite les oléagineux non salés parmi les aliments utiles en cas de constipation.

Concernant les **allergies**, les connaissances ont évolué : éviter les aliments allergisants pendant la grossesse ne protège pas l’enfant, et pourrait même augmenter le risque. Sauf allergie chez vous, il n’y a donc pas de raison de les supprimer.

## Au quotidien
- **Au goûter** : une petite poignée d’amandes avec un fruit, ou des noix avec un yaourt.
- **Dans les plats** : noix dans une salade de crudités bien lavées, amandes effilées sur des haricots verts, noisettes concassées sur un gratin.
- **En purée** : purée d’amandes ou de cacahuètes sans sucre ajouté sur du pain complet.
- **Choisissez-les nature**, sans sel ni sucre ajoutés : les versions salées de l’apéritif apportent beaucoup de sel, et les versions enrobées, du sucre.
- **Conservez-les** au sec et à l’abri de la chaleur, bien fermés.
- **Châtaignes cuites** : en soupe ou en accompagnement, elles apportent fibres et folates.
- **Nausées du début de grossesse** : ameli conseille de ne pas rester longtemps à jeun et de manger en petites quantités, plus souvent. Quelques amandes ou noisettes à portée de main peuvent servir de petite collation.

### À ne pas confondre
Les **graines germées crues** (alfalfa, radis, soja germé) sont, elles, déconseillées pendant la grossesse à cause du risque de listériose. Cela ne concerne pas les fruits à coque.

## Questions fréquentes
**Les cacahuètes sont-elles autorisées ?**
Oui, sauf si vous y êtes allergique. Choisissez-les non salées.

**Mon conjoint ou mon premier enfant est allergique. Dois-je éviter les fruits à coque ?**
Parlez-en à votre médecin ou à votre allergologue : la décision dépend de votre situation. D’une manière générale, éviter les allergènes pendant la grossesse n’est pas recommandé pour prévenir l’allergie chez l’enfant.

**Les pâtes à tartiner aux noisettes comptent-elles ?**
Elles contiennent surtout du sucre et des matières grasses ajoutées : elles relèvent des produits sucrés, à limiter.

**Les fruits à coque aident-ils en cas de constipation ?**
Ils font partie, avec les légumes, les fruits, les légumes secs et les céréales complètes, des aliments riches en fibres recommandés par ameli. Augmentez les fibres progressivement et buvez régulièrement pour éviter les ballonnements.

**Les fruits à coque font-ils grossir ?**
Ils sont riches en énergie, mais une petite poignée par jour, à la place d’un biscuit ou d’une viennoiserie, s’intègre très bien dans une alimentation équilibrée.

## Quand demander conseil
En cas de **réaction après avoir mangé** (gonflement des lèvres ou du visage, gêne pour respirer, malaise, éruption généralisée), appelez immédiatement le **15** ou le **112**. Si vous avez une allergie connue ou des antécédents familiaux, parlez-en à votre médecin pendant la grossesse.

${FIN}`,
  }),
  // ------------------------------------------------------------------ graisses, sucre, sel
  a({
    slug: 'matieres-grasses-huiles-grossesse',
    title: 'Huiles, beurre, margarine : les matières grasses enceinte',
    summary: 'Quelles matières grasses choisir pendant la grossesse, en quelle quantité, et pourquoi éviter les produits enrichis en phytostérols.',
    category: 'alimentation-grossesse', tags: ['matières grasses', 'huile de colza', 'huile de noix', 'huile d’olive', 'beurre', 'phytostérols', 'cuisson', 'ustensiles'],
    sources: [S.santeHuiles, S.spfGuide, S.ameliEnvironnement],
    body_md: `## En bref
- Des **matières grasses chaque jour, en petites quantités** : elles sont indispensables.
- **À privilégier** : huiles de **colza**, de **noix** et d’**olive** ; le beurre plutôt cru, en petite quantité.
- **À limiter** : produits gras industriels (viennoiseries, biscuits, fritures, plats préparés riches en graisses saturées).
- **À éviter** : margarines, yaourts ou boissons **enrichis en phytostérols** (« anti-cholestérol »), sauf avis médical.

## Comprendre
Toutes les graisses ne se valent pas. Certaines sont dites **essentielles** : le corps ne sait pas les fabriquer et doit les trouver dans l’alimentation. C’est le cas des **oméga-3**, utiles au cerveau, à la rétine et au système nerveux, et donc au développement du bébé. On les trouve dans les poissons gras, les noix et les huiles de colza et de noix.

Un excès de graisses favorise en revanche la prise de poids et les maladies cardiovasculaires. Pendant la grossesse, les plats gras peuvent aussi aggraver les **nausées** et les **remontées acides**.

Les **phytostérols** sont ajoutés à certains produits pour faire baisser le cholestérol. Ils sont déconseillés pendant la grossesse, sauf avis contraire de votre médecin.

## Au quotidien
- **Assaisonnement** : alternez huile de colza, de noix et d’olive dans vos vinaigrettes.
- **Cuisson** : l’huile d’olive convient bien ; dosez à la cuillère plutôt que de verser directement (une cuillère à café correspond à 5 mL, une cuillère à soupe à 15 mL).
- **Modes de cuisson** : vapeur, papillote, four, grill, étuvée demandent peu de matières grasses.
- **Beurre** : de préférence cru, en fine couche sur une tartine ou en noisette sur des légumes.
- **Crème fraîche** : en petite quantité ; un yaourt ou du fromage blanc la remplacent bien dans certaines sauces.
- **Produits allégés** : la mention « allégé » signifie environ 30 % de matières grasses en moins, pas l’absence de graisses. Ils n’aident que si l’on n’en consomme pas davantage.
- **Plats préparés** : comparez les Nutri-Score à l’intérieur d’une même catégorie.

### Ustensiles
Pour la cuisson, ameli conseille de privilégier les poêles en **inox, en fonte ou en fer** plutôt que les revêtements antiadhésifs, et de remplacer progressivement les contenants en plastique par du **verre**.

## Questions fréquentes
**Faut-il manger plus gras pendant la grossesse ?**
Non. Les besoins augmentent modérément en fin de grossesse ; c’est surtout la **qualité** des graisses qui compte.

**Puis-je cuire avec de l’huile de noix ?**
L’huile de noix s’utilise plutôt à froid, en assaisonnement. Pour la cuisson, préférez l’huile d’olive ou de colza.

**Les compléments d’huile de poisson sont-ils utiles ?**
Ne prenez aucun complément sans l’avis de votre médecin ou de votre sage-femme. Le repère recommandé pour les oméga-3 reste deux portions de poisson par semaine, dont un poisson gras.

**J’ai du cholestérol : puis-je garder ma margarine habituelle ?**
Si elle est enrichie en phytostérols, parlez-en à votre médecin : ces produits sont déconseillés pendant la grossesse, sauf avis médical.

## Quand demander conseil
Parlez-en à votre professionnel si vous avez un trouble du cholestérol, un diabète gestationnel ou une prise de poids qui vous inquiète. Les remontées acides gênantes ou persistantes méritent aussi d’être signalées. ${URG}

${FIN}`,
  }),
  a({
    slug: 'sucre-produits-sucres-grossesse',
    title: 'Sucre et produits sucrés pendant la grossesse',
    summary: 'Pourquoi limiter les produits sucrés et les boissons sucrées pendant la grossesse, où se cache le sucre et comment garder le plaisir.',
    category: 'alimentation-grossesse', tags: ['sucre', 'boissons sucrées', 'sodas', 'jus', 'grignotage', 'Nutri-Score', 'diabète gestationnel', 'collation'],
    sources: [S.spfGuide, S.santeSucres, S.ameliAlimentation],
    body_md: `## En bref
- **Limitez les produits sucrés** (bonbons, pâtisseries, biscuits, céréales sucrées) et intégrez-les plutôt aux repas.
- **Boissons sucrées** (sodas, même « light », jus, sirops, boissons énergisantes) : **un verre par jour au maximum**.
- **L’eau** est la seule boisson recommandée, à volonté.
- Une **collation** équilibrée, dès le 2e trimestre, aide à éviter le grignotage.

## Comprendre
Les sucres apportent de l’énergie, mais leur excès favorise la prise de poids, le diabète de type 2, les maladies cardiovasculaires et les caries. L’Anses souligne que les sucres consommés **sous forme liquide** (sodas, nectars, jus, smoothies) contribuent particulièrement à la prise de poids. Pour un adulte, l’Anses fixe une limite de 100 g de sucres totaux par jour (hors sucres du lait), en cohérence avec l’Organisation mondiale de la santé.

Pendant la grossesse, une prise de poids trop importante augmente le risque de **diabète gestationnel** et d’**hypertension**. Il ne s’agit pas de supprimer tout plaisir, mais de garder les produits sucrés pour des moments choisis.

Le sucre se cache sous de nombreux noms dans la liste des ingrédients : sirop de glucose ou de fructose, sucre inverti, jus concentrés, sirops de fruits, miel. Le **Nutri-Score** aide à comparer : Santé publique France conseille de limiter les produits classés **D et E**.

Les **boissons énergisantes** sont à éviter pendant la grossesse : elles contiennent beaucoup de caféine et sont ultratransformées.

## Au quotidien
- **Petit-déjeuner** : pain complet et produit laitier plutôt que viennoiseries ou céréales très sucrées.
- **Desserts** : un fruit ou un yaourt nature, que vous pouvez sucrer légèrement vous-même.
- **Goûter** : yaourt, fromage, pain complet, fruit, petite poignée de fruits à coque, plutôt que des gâteaux.
- **Boissons** : une carafe d’eau à table, de l’eau plate ou gazeuse peu salée, des infusions non sucrées, de l’eau avec quelques rondelles de citron ou des feuilles de menthe.
- **Courses** : comparez les Nutri-Score dans une même catégorie (céréales, biscuits, yaourts aromatisés).
- **Fait maison** : un gâteau maison permet de réduire la quantité de sucre de la recette.
- **Envie sucrée** : faites une pause, buvez un verre d’eau, puis choisissez un aliment qui vous fait vraiment plaisir et dégustez-le lentement.

## Questions fréquentes
**Le miel ou le sucre de canne sont-ils plus sains ?**
Ce sont aussi des sucres. Ils comptent de la même façon dans les apports.

**Le chocolat est-il autorisé ?**
Oui, avec modération. Le cacao apporte un peu de fer, mais les tablettes et pâtes à tartiner contiennent beaucoup de sucre et de matières grasses.

**Les sodas « zéro » sont-ils une bonne alternative ?**
Santé publique France les inclut dans la limite d’un verre de boisson sucrée par jour. L’Anses rappelle que les boissons édulcorées ne doivent pas remplacer l’eau.

**J’ai un diabète gestationnel. Puis-je encore manger sucré ?**
Votre alimentation s’organise avec la diététicienne, la sage-femme ou le médecin qui vous suit, en fonction de vos glycémies. Ne supprimez pas de groupe d’aliments sans leur avis.

**Comment faire face aux envies de sucre ?**
Vous n’êtes pas seule à les ressentir pendant la grossesse. Parlez-en à votre sage-femme : elle peut vous aider à trouver des collations qui rassasient.

## Quand demander conseil
Consultez si votre prise de poids vous paraît rapide, si vous avez très soif ou urinez beaucoup plus que d’habitude, ou si votre rapport à la nourriture devient une source de souffrance. Si vous traversez une détresse importante ou des idées noires, appelez le **3114** (24 h/24, gratuit). ${URG}

${FIN}`,
  }),
  a({
    slug: 'edulcorants-boissons-light-grossesse',
    title: 'Édulcorants et boissons « light » pendant la grossesse',
    summary: 'Ce que dit l’Anses des édulcorants intenses, pourquoi ils ne remplacent pas l’eau et comment réduire le goût sucré pendant la grossesse.',
    category: 'alimentation-grossesse', tags: ['édulcorants', 'aspartame', 'stévia', 'boissons light', 'sodas zéro', 'sucre', 'diabète gestationnel'],
    sources: [S.ansesEdulcorants, S.santeSucres, S.spfGuide],
    body_md: `## En bref
- Selon l’Anses, les **édulcorants intenses** n’ont **pas de bénéfice démontré** sur le contrôle du poids ni de la glycémie.
- Les **femmes enceintes** ont été **insuffisamment étudiées** : l’Anses appelle à des recherches complémentaires.
- Les **boissons édulcorées** ne doivent **pas remplacer l’eau**.
- Santé publique France compte les sodas « light » dans la limite d’**un verre de boisson sucrée par jour**.

## Comprendre
Les édulcorants intenses (aspartame, acésulfame, sucralose, glycosides de stéviol, etc.) ont un pouvoir sucrant très supérieur à celui du sucre, sans apporter de calories notables. On les trouve dans les sodas « zéro » ou « light », certains yaourts, chewing-gums, desserts et produits allégés.

En 2015, l’Anses a publié une évaluation complète de leurs bénéfices et risques nutritionnels :
- **aucune preuve** qu’ils aident à contrôler son poids, à réguler la glycémie chez les personnes diabétiques ou à prévenir le diabète de type 2 ;
- **aucun lien établi** avec le cancer, le diabète de type 2 ou les naissances prématurées, mais certaines études justifient des travaux complémentaires ;
- les **femmes enceintes**, les enfants et les grands consommateurs ont été insuffisamment étudiés.

L’Anses conclut qu’il n’y a pas de raison d’encourager le remplacement du sucre par des édulcorants. Pour réduire les sucres, elle recommande plutôt de **diminuer globalement le goût sucré** de l’alimentation.

## Au quotidien
- **Désaltérez-vous avec de l’eau** : plate, gazeuse peu salée, ou aromatisée maison avec du citron, de la menthe, du concombre.
- **Infusions et tisanes** non sucrées, chaudes ou glacées, sont une autre façon de boire.
- **Réduisez progressivement** le sucre ou l’édulcorant dans le café ou le thé : le palais s’habitue peu à peu.
- **Yaourts** : choisissez-les nature et ajoutez un fruit frais ou de la compote sans sucres ajoutés.
- **Lisez la liste des ingrédients** : les édulcorants y sont mentionnés, y compris dans des produits qui ne s’affichent pas comme « light ».
- **Boissons énergisantes**, même sans sucre : à éviter pendant la grossesse, à cause de leur teneur en caféine.

## Questions fréquentes
**Un soda light de temps en temps pose-t-il problème ?**
Les sources consultées ne l’interdisent pas. Elles recommandent de limiter l’ensemble des boissons sucrées ou édulcorées à un verre par jour et de garder l’eau comme boisson principale.

**La stévia est-elle plus naturelle et donc préférable ?**
La stévia fait partie des édulcorants intenses. Son origine végétale ne change pas la recommandation générale : réduire le goût sucré plutôt que remplacer le sucre.

**En cas de diabète gestationnel, faut-il passer aux édulcorants ?**
L’Anses n’a pas démontré de bénéfice des édulcorants sur la glycémie. Votre alimentation se construit avec la diététicienne ou le médecin qui vous suit : posez-leur la question.

**Les chewing-gums sans sucre sont-ils autorisés ?**
Ils contiennent des édulcorants ou des polyols. Les sources consultées ne les détaillent pas pour la grossesse : avec modération, et parlez-en à votre professionnel si vous en consommez beaucoup.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin si vous consommez beaucoup de boissons « light », si vous avez un diabète gestationnel ou si vous avez du mal à boire de l’eau (nausées, dégoût). ${URG}

${FIN}`,
  }),
  a({
    slug: 'sel-et-sel-iode-grossesse',
    title: 'Le sel pendant la grossesse : moins, mais iodé',
    summary: 'Pourquoi limiter le sel sans le supprimer, où se cache le sel et pourquoi choisir du sel iodé pendant la grossesse.',
    category: 'alimentation-grossesse', tags: ['sel', 'sel iodé', 'iode', 'tension', 'sel caché', 'épices', 'eau gazeuse'],
    sources: [S.santeSel, S.spfGuide, S.ameliEau],
    body_md: `## En bref
- Pour un adulte, il est recommandé de ne pas dépasser **5 g de sel par jour**.
- La plus grande partie du sel est **cachée** : pain, fromages, charcuteries, plats préparés, soupes, biscuits.
- **Choisissez du sel iodé** : l’iode est essentiel au développement du cerveau du bébé.
- **Remplacez une partie du sel** par des épices, des herbes et des aromates.

## Comprendre
Un excès de sel favorise l’**hypertension artérielle**, qui augmente le risque de maladies cardiovasculaires. Pendant la grossesse, la tension est surveillée à chaque consultation.

On distingue :
- le **sel visible**, que l’on ajoute en cuisinant ou à table ;
- le **sel caché**, présent dans les aliments ou ajouté lors de leur fabrication. C’est la principale source de sel dans l’alimentation.

Quelques repères de Santé publique France : chacun de ces aliments apporte environ **1 g de sel**, soit un cinquième de la limite quotidienne : une tranche de saucisson, une poignée de biscuits apéritifs, un tiers de sandwich, un bol de soupe, quatre tranches de pain, une part de pizza.

Le **sel iodé** contribue aux apports en iode, qui augmentent pendant la grossesse. Il est reconnaissable à la mention « iodé » sur l’emballage. Santé publique France recommande de limiter le sel **et** d’utiliser du sel iodé.

## Au quotidien
- **Goûtez avant de saler**, et ne salez pas les conserves.
- **Salez moins l’eau de cuisson** des pâtes, du riz et des légumes.
- **Relevez les plats** avec des épices, des condiments, des aromates (ail, oignon, échalote), des herbes fraîches bien lavées, séchées ou surgelées (persil, basilic, coriandre).
- **Limitez** les plats préparés, charcuteries, biscuits apéritifs et snacks ; comparez les Nutri-Score des plats préparés d’une même catégorie.
- **Fromages** : variez ; les bleus, les persillés et les fromages à fondue sont très salés.
- **Apéritif** : tomates cerises, radis, bâtonnets de carottes et houmous plutôt que chips et cacahuètes salées.
- **Eaux gazeuses** : certaines sont riches en sodium ; choisissez-en une pauvre en sel en lisant l’étiquette.

## Questions fréquentes
**Faut-il supprimer complètement le sel pendant la grossesse ?**
Non. La recommandation est de le limiter et de choisir du sel iodé. Un régime sans sel strict ne se suit que sur avis médical.

**Le sel de mer ou la fleur de sel apportent-ils de l’iode ?**
Seul le sel portant la mention « iodé » est enrichi en iode. Vérifiez l’emballage.

**J’ai les jambes qui gonflent. Dois-je arrêter le sel ?**
Ne modifiez pas votre alimentation sans en parler à votre sage-femme ou à votre médecin : un gonflement doit être signalé, car il peut avoir plusieurs causes.

**Le pain est-il une source importante de sel ?**
Oui : selon Santé publique France, quatre tranches de pain apportent environ 1 g de sel. Le pain reste utile (le pain complet apporte des fibres) : il s’agit surtout de limiter les autres sources de sel caché autour.

**Les envies de salé pendant la grossesse sont-elles un problème ?**
Elles sont fréquentes. Privilégiez des aliments naturellement savoureux (olives en petite quantité, fromage à pâte pressée cuite, légumes grillés) et gardez un œil sur les produits très salés.

## Quand demander conseil
Consultez **en urgence** en cas de **maux de tête intenses**, de **troubles de la vue** (points lumineux, vision floue), de **douleur en haut du ventre** ou de **gonflement brutal** du visage et des mains : ces signes peuvent traduire une hypertension de la grossesse. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------------ nutriments
  a({
    slug: 'iode-grossesse-sources-precautions',
    title: 'L’iode pendant la grossesse : où le trouver, sans excès',
    summary: 'Le rôle de l’iode dans le développement du cerveau du bébé, les aliments qui en apportent et pourquoi éviter de cumuler les sources sans avis.',
    category: 'alimentation-grossesse', journeys: ['pregnant', 'ttc'], tags: ['iode', 'thyroïde', 'sel iodé', 'poisson', 'algues', 'compléments', 'végétarienne'],
    sources: [S.ansesIode, S.santeEquilibre, S.ansesComplements],
    body_md: `## En bref
- L’**iode** sert à fabriquer les hormones thyroïdiennes, essentielles au **développement du cerveau** du bébé, notamment en début de grossesse.
- Les besoins **augmentent** pendant la grossesse et l’allaitement.
- **Sources** : poissons de mer et fruits de mer bien cuits, produits laitiers, œufs, sel iodé, algues.
- **Ni carence, ni excès** : ne cumulez pas compléments et produits iodés sans avis médical.

## Comprendre
La thyroïde utilise l’iode pour produire des hormones qui règlent la croissance, la température du corps et la dépense d’énergie. Au début de la grossesse, le bébé dépend des hormones de sa mère : un statut en iode adéquat est donc important pour son développement neurologique.

Une **carence** peut entraîner une augmentation du volume de la thyroïde (goitre) et, dans les formes sévères, une hypothyroïdie (fatigue, frilosité, prise de poids). Chez l’enfant, une carence importante peut retentir sur le développement intellectuel.

À l’inverse, l’Anses souligne qu’un **apport excessif** d’iode pendant la grossesse, **par voie orale ou par la peau**, augmente le risque de troubles de la thyroïde chez le nouveau-né. Elle met en garde contre le cumul de plusieurs sources de vitamines et minéraux sans besoin identifié.

Un complément d’iode peut être envisagé dans certaines situations, **sur avis médical** : alimentation végétarienne ou végétalienne, tabagisme, grossesses rapprochées, régions carencées. Un bilan nutritionnel avant la conception est recommandé.

## Au quotidien
- **Poisson de mer** deux fois par semaine, bien cuit, dont un poisson gras.
- **Produits laitiers** chaque jour : leur teneur en iode dépend de l’alimentation des animaux.
- **Œufs bien cuits** : le jaune apporte de l’iode.
- **Sel iodé** à la maison, en quantité limitée.
- **Fruits de mer** bien cuits, jamais crus.
- **Algues** : elles en contiennent, parfois beaucoup ; évitez d’en consommer régulièrement en grande quantité sans en parler à votre professionnel.
- **Évitez les aliments ou compléments « enrichis spécial grossesse »** non prescrits : ils sont inutiles avec une alimentation variée et exposent à des surdosages.
- **Signalez** à votre médecin, sage-femme ou pharmacien tout produit iodé que vous utilisez, y compris appliqué sur la peau, et tout complément acheté sans ordonnance.

## Questions fréquentes
**Dois-je prendre un complément d’iode ?**
Pas systématiquement. Il peut être proposé selon votre situation (alimentation, tabac, grossesses rapprochées). Seul votre médecin ou votre sage-femme peut en décider.

**J’ai un problème de thyroïde. Que faire ?**
Signalez-le dès le début de la grossesse : les troubles de la thyroïde demandent un suivi médical attentif, et votre traitement pourra être ajusté.

**Et si je ne mange ni poisson ni produits laitiers ?**
Parlez-en à votre professionnel : votre risque de manque est plus élevé, et un complément peut se discuter.

**Les sushis aux algues sont-ils une bonne source ?**
Les algues apportent de l’iode, mais les sushis au poisson cru sont déconseillés pendant la grossesse. Des makis végétariens bien préparés restent possibles occasionnellement.

**Le sel iodé suffit-il ?**
Il contribue aux apports, mais le sel doit rester limité. Il complète une alimentation variée comprenant poisson, produits laitiers et œufs.

## Quand demander conseil
Consultez si vous avez des antécédents de maladie de la thyroïde, une fatigue inhabituelle, une frilosité marquée ou un gonflement à l’avant du cou, et avant de prendre tout complément. ${URG}

${FIN}`,
  }),
  a({
    slug: 'vitamine-d-grossesse',
    title: 'La vitamine D pendant la grossesse',
    summary: 'À quoi sert la vitamine D, comment le soleil et l’alimentation y contribuent et pourquoi la supplémentation passe par une prescription.',
    category: 'alimentation-grossesse', tags: ['vitamine D', 'soleil', 'calcium', 'os', 'poissons gras', 'supplémentation', 'compléments'],
    sources: [S.ansesVitD, S.spfGuide, S.santeEquilibre],
    body_md: `## En bref
- La **vitamine D** aide à absorber le calcium et à **minéraliser les os** du bébé.
- Elle est fabriquée par la **peau au soleil** et apportée par quelques aliments : **poissons gras**, jaune d’œuf, beurre, produits laitiers enrichis.
- Les apports alimentaires sont souvent **insuffisants** : une supplémentation est fréquemment **prescrite au 3e trimestre**.
- **Pas d’automédication** : un excès de vitamine D peut être nocif.

## Comprendre
La vitamine D fait monter le taux de calcium et de phosphore dans le sang. Elle contribue ainsi à la solidité des os et des dents, mais aussi à la contraction musculaire et au fonctionnement du système immunitaire.

L’Anses cite les **femmes enceintes** parmi les personnes plus exposées à un manque, comme les nouveau-nés, les personnes à **peau mate ou foncée** (qui en fabriquent moins au soleil) et celles qui excluent viande, poisson, œufs et produits laitiers.

En France, une supplémentation est fortement recommandée au 3e trimestre ; elle prend souvent la forme d’une ou deux prises **prescrites** par la sage-femme ou le médecin.

Le **surdosage** existe : souvent lié aux compléments, il provoque un excès de calcium dans le sang (hypercalcémie), avec des risques pour le cœur et les reins. L’Anses recommande de privilégier les médicaments, dont la dose est clairement indiquée, et de ne pas cumuler plusieurs produits contenant de la vitamine D sans avis.

## Au quotidien
- **Soleil** : Santé publique France indique qu’une exposition de **15 à 30 minutes par jour**, en dehors des heures les plus chaudes (12 h à 16 h), contribue aux besoins. Pensez à vous protéger en été.
- **Poissons gras** : sardine, maquereau, hareng, saumon non fumé, anchois, bien cuits, une fois par semaine.
- **Œufs** bien cuits : le jaune apporte de la vitamine D.
- **Produits laitiers enrichis** : certains le sont, l’étiquette l’indique.
- **Champignons** : certains (girolles, bolets, morilles) en contiennent ; achetez-les dans le commerce et cuisez-les bien, car les champignons cueillis soi-même sont déconseillés pendant la grossesse.
- **Signalez** à votre professionnel tous les compléments et multivitamines que vous prenez.

## Questions fréquentes
**Dois-je acheter de la vitamine D en pharmacie ou en magasin ?**
Non, sans prescription. Votre sage-femme ou votre médecin vous prescrira la supplémentation adaptée au moment opportun.

**Je prends déjà un complément multivitaminé. Est-ce suffisant ?**
Montrez-le à votre professionnel : il vérifiera ce qu’il contient pour éviter un cumul avec la supplémentation prescrite.

**J’ai la peau foncée ou je sors peu. Suis-je plus concernée ?**
Oui, ces situations exposent davantage au manque. Parlez-en à votre sage-femme ou à votre médecin.

**L’huile de foie de morue est-elle une bonne idée ?**
Le foie de morue figure parmi les produits à éviter pendant la grossesse. Ne prenez pas non plus d’huile de foie de morue en complément sans avis.

**Bébé aura-t-il besoin de vitamine D ?**
Les nouveau-nés font partie des personnes qui peuvent avoir besoin d’une supplémentation ; le médecin ou la sage-femme vous l’expliquera après la naissance.

## Quand demander conseil
Parlez-en si vous suivez une alimentation sans produits animaux, si vous sortez très peu ou si vous prenez des compléments. Consultez en cas de **nausées, vomissements, maux de tête et grande fatigue** inhabituels après la prise de compléments. ${URG}

${FIN}`,
  }),
  a({
    slug: 'omega-3-dha-grossesse',
    title: 'Oméga-3 et DHA pendant la grossesse : où les trouver ?',
    summary: 'Le rôle des oméga-3 dans le développement du cerveau et des yeux du bébé, les meilleures sources alimentaires et la question des compléments.',
    category: 'alimentation-grossesse', tags: ['oméga-3', 'DHA', 'poissons gras', 'huile de colza', 'noix', 'cerveau', 'compléments'],
    sources: [S.santeEquilibre, S.santePoisson, S.santeHuiles],
    body_md: `## En bref
- Les **oméga-3**, notamment le **DHA**, sont essentiels au développement du **cerveau** et des **yeux** du bébé.
- Le corps ne sait pas les fabriquer : ils viennent de l’**alimentation**.
- **Sources** : poissons gras (sardine, maquereau, hareng, saumon), noix, huiles de colza et de noix, œufs enrichis, microalgues.
- **Deux portions de poisson par semaine**, dont un poisson gras, sont le repère recommandé.

## Comprendre
Les oméga-3 sont des acides gras dits « essentiels ». Parmi eux :
- l’**EPA** et le **DHA**, dits à longue chaîne, se trouvent surtout dans les produits de la mer. Le DHA intervient dans le développement du système nerveux ;
- d’autres oméga-3 se trouvent dans les **noix** et les huiles de **colza** et de **noix**.

Pendant la grossesse, le poisson reste la source la plus intéressante, à condition de bien choisir les espèces : certains grands poissons prédateurs accumulent du mercure et sont à limiter (thon, bar, daurade) ou à éviter (espadon, requin, marlin, siki, lamproie). Le poisson doit être **bien cuit**, ni cru ni fumé.

Les **compléments** d’oméga-3 ou d’huile de poisson ne doivent pas être pris sans avis médical : même vendus librement, les compléments peuvent ne pas être adaptés à la grossesse.

## Au quotidien
- **Une fois par semaine**, un poisson gras bien cuit : sardines grillées, maquereau au four, filet de saumon en papillote, hareng non fumé cuit.
- **Une fois par semaine**, un poisson maigre : cabillaud, colin, merlan, sole.
- **Huile de colza ou de noix** dans les vinaigrettes, en alternance avec l’huile d’olive.
- **Quelques noix** au goûter ou dans une salade.
- **Œufs enrichis en oméga-3**, bien cuits.
- **Conserves** de sardines ou de maquereau : pratiques pour une salade composée ou des tartines.

### Idées de menus
- Rillettes maison de maquereau cuit et fromage blanc, sur pain complet.
- Pâtes complètes, saumon cuit et brocolis.
- Salade de mâche, noix, betterave et œuf dur, vinaigrette à l’huile de noix.

## Questions fréquentes
**Je ne mange pas de poisson. Comment faire ?**
Parlez-en à votre sage-femme ou à votre médecin. Les noix, l’huile de colza, les œufs enrichis et les microalgues apportent des oméga-3, mais un apport en DHA demande une attention particulière : un complément peut se discuter avec lui.

**Les œufs enrichis en oméga-3 sont-ils utiles ?**
Ils font partie des sources d’oméga-3 citées pour la grossesse, au même titre que les noix et les microalgues. Mangez-les bien cuits, et gardez le poisson comme source principale si vous en consommez.

**Le saumon fumé est-il une bonne source ?**
Il contient des oméga-3, mais le poisson fumé est déconseillé pendant la grossesse à cause du risque de listériose. Choisissez du saumon cuit.

**Le thon en conserve compte-t-il comme poisson gras ?**
Le thon fait partie des grands prédateurs à limiter pendant la grossesse. Pour votre poisson gras de la semaine, préférez sardine, maquereau, hareng ou saumon.

**Faut-il des compléments d’oméga-3 pour que bébé soit plus intelligent ?**
Aucune source consultée ne recommande de complément systématique. Le repère reste une alimentation variée avec du poisson deux fois par semaine ; votre professionnel vous dira si votre situation nécessite autre chose.

## Quand demander conseil
Parlez-en si vous ne mangez jamais de poisson, si vous êtes végétarienne ou végétalienne, ou si vous envisagez de prendre un complément. ${URG}

${FIN}`,
  }),
  a({
    slug: 'fer-grossesse-aliments-absorption',
    title: 'Le fer pendant la grossesse : aliments et astuces d’absorption',
    summary: 'Pourquoi les besoins en fer augmentent, quels aliments en apportent, comment mieux l’absorber et quand un traitement est prescrit.',
    category: 'alimentation-grossesse', tags: ['fer', 'anémie', 'fatigue', 'viande rouge', 'légumes secs', 'vitamine C', 'thé', 'café'],
    sources: [S.ameliFer, S.santeEquilibre, S.spfGuide],
    body_md: `## En bref
- Les besoins en **fer** sont **très augmentés** pendant la grossesse, surtout en fin de grossesse.
- Le fer des **viandes, poissons et fruits de mer** (fer héminique) est **mieux absorbé** que celui des végétaux.
- La **vitamine C** (fruits, crudités) aide à absorber le fer ; le **thé et le café pendant les repas** le freinent.
- Un traitement est **prescrit si besoin**, après évaluation par un professionnel.

## Comprendre
Le fer sert à fabriquer les globules rouges, qui transportent l’oxygène. Pendant la grossesse, il est utilisé pour le développement du bébé et du placenta et pour l’augmentation du volume de sang. Le risque d’**anémie** (manque de globules rouges) est donc particulièrement élevé, surtout en fin de grossesse. Elle peut se traduire par une fatigue, une baisse des défenses ou un essoufflement.

L’organisme n’absorbe qu’une petite partie du fer des aliments :
- le **fer héminique**, présent uniquement dans la chair animale (viande, abats, poissons, fruits de mer), est le mieux absorbé ;
- le **fer non héminique** se trouve dans de nombreux aliments : légumes secs, noix, céréales, jaune d’œuf, légumes à feuilles vertes, cacao, pain complet.

Le **foie**, très riche en fer, est cependant à limiter pendant la grossesse à cause de son excès de vitamine A.

Seul un professionnel de santé peut évaluer un risque de carence. La prise de sang permet de vérifier votre taux, et du fer est prescrit si nécessaire.

## Au quotidien
- **Viande rouge bien cuite**, volaille, poisson : en alternance, sans excès (environ 500 g de viande hors volaille par semaine).
- **Légumes secs** au moins 2 fois par semaine : lentilles, pois chiches, haricots.
- **Associez la vitamine C** : crudités bien lavées en entrée, fruit au dessert, persil frais lavé.
- **Thé et café** : prenez-les **à distance des repas**, pas pendant ni juste avant.
- **Pain complet** et céréales complètes plutôt que raffinés.
- **Œufs bien cuits**, légumes verts à feuilles (épinards, mâche).

### Exemples d’associations
- Lentilles et carottes, puis une orange.
- Bœuf mijoté, légumes et salade verte, puis des fraises bien lavées.
- Pois chiches et semoule complète avec tomates et poivrons.

## Questions fréquentes
**Dois-je prendre du fer systématiquement ?**
Non. Le fer est prescrit selon vos besoins, évalués par votre sage-femme ou votre médecin. Ne prenez pas de complément de vous-même.

**Le fer prescrit me constipe. Que faire ?**
Parlez-en au prescripteur sans arrêter de vous-même. Fibres, eau et marche aident aussi le transit.

**Les épinards sont-ils vraiment riches en fer ?**
Les légumes à feuilles vertes en contiennent, mais sous une forme moins bien absorbée que le fer de la viande. Associés à de la vitamine C, ils participent aux apports.

**Je suis végétarienne. Vais-je manquer de fer ?**
Le risque est plus élevé. Une alimentation bien composée et un suivi par votre professionnel permettent d’y faire face ; un complément peut être nécessaire.

**Le boudin noir est-il recommandé pour le fer ?**
C’est une charcuterie à cuire soi-même : bien cuit et mangé chaud, il peut faire partie de vos repas, sans dépasser les repères de charcuterie.

## Quand demander conseil
Consultez si vous êtes **très fatiguée**, **essoufflée**, pâle, si vous avez des **vertiges** ou des palpitations. Consultez aussi en cas de **saignements** (vaginaux, dans les selles ou les urines). En cas de saignement abondant ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  }),
  // ------------------------------------------------------------------ boissons, saveurs
  a({
    slug: 'eau-hydratation-grossesse',
    title: 'Bien s’hydrater enceinte : eau du robinet, minérale, gazeuse',
    summary: 'Pourquoi l’eau est la boisson de référence pendant la grossesse, quelle eau choisir et des astuces pour boire suffisamment.',
    category: 'alimentation-grossesse', tags: ['eau', 'hydratation', 'eau du robinet', 'eau minérale', 'eau gazeuse', 'chaleur', 'tisanes', 'constipation'],
    sources: [S.santeEau, S.ameliEau, S.ameliDigestion],
    body_md: `## En bref
- **L’eau est la seule boisson recommandée**, à volonté, tout au long de la grossesse.
- Buvez **dès que la soif se fait sentir**, et un peu plus par forte chaleur ou après une activité.
- **L’eau du robinet** est très contrôlée en France et convient aux femmes enceintes.
- Les **eaux gazeuses** peuvent être riches en sel : choisissez-en une **pauvre en sodium**.

## Comprendre
L’eau représente plus de 60 % du poids du corps d’un adulte, et nous en perdons chaque jour par les urines, la transpiration et la respiration. Pour un adulte, ameli donne le repère de **1 à 1,5 litre d’eau par jour**, sauf limitation médicale.

Pendant la grossesse, bien boire aide notamment à lutter contre la **constipation** et à mieux supporter la **chaleur**. Les besoins augmentent aussi pendant l’allaitement.

L’**eau du robinet** est l’aliment le plus contrôlé en France : elle doit respecter une soixantaine de critères (absence de bactéries, de virus, de pesticides et de nitrates en excès). Santé.fr indique qu’elle convient à toute la famille, y compris aux femmes enceintes et allaitantes. Elle apporte aussi du calcium et du magnésium. Vous pouvez vérifier sa qualité sur le site de votre agence régionale de santé, en mairie ou sur la note jointe à votre facture d’eau.

Certaines **eaux minérales** sont riches en calcium : elles peuvent aider si vous consommez peu de produits laitiers. Leur composition figure sur l’étiquette.

## Au quotidien
- **Gardez une carafe ou une gourde** à portée de main, en verre ou en inox plutôt qu’en plastique.
- **Goût de chlore** : laissez l’eau reposer dans une carafe ouverte au réfrigérateur ; elle se garde 24 à 48 heures.
- **Après une absence**, laissez couler l’eau quelques secondes, jusqu’à deux minutes après plusieurs jours.
- **Variez** : infusions et tisanes non sucrées, eau aromatisée avec du citron ou de la menthe, soupes et potages.
- **En cas de nausées**, buvez plutôt **entre les repas** que pendant, par petites gorgées.
- **Par forte chaleur**, buvez régulièrement sans attendre la soif.
- **À éviter** : alcool (aucune quantité), boissons énergisantes, sodas et eaux aromatisées sucrées ; café à limiter (pas plus de trois tasses par jour).

## Questions fréquentes
**L’eau du robinet est-elle vraiment adaptée pendant la grossesse ?**
Oui, si elle est déclarée potable dans votre commune. Si votre logement a des canalisations anciennes en plomb (souvent avant 1948), laissez couler l’eau avant de la boire et demandez conseil.

**Et l’eau de puits ou de source privée ?**
Une eau dont la qualité n’est pas contrôlée peut contenir des microbes ou des polluants. Pendant la grossesse, préférez une eau du réseau public déclarée potable ou une eau en bouteille. La fiche d’ameli sur la prévention de la toxoplasmose conseille d’ailleurs de boire de préférence de l’eau en bouteille : en cas de doute sur votre eau, parlez-en à votre sage-femme.

**Combien de verres dois-je boire ?**
Le repère général est de 1 à 1,5 litre par jour pour un adulte, à adapter à la soif, à la chaleur et à l’activité. Votre professionnel vous indiquera si votre situation demande autre chose.

**L’eau gazeuse est-elle possible ?**
Les sources consultées ne la déconseillent pas. Choisissez-la pauvre en sodium, et préférez l’eau plate si elle vous gêne (ballonnements, brûlures d’estomac).

## Quand demander conseil
Consultez rapidement si vous **vomissez au point de ne rien garder**, si vous urinez très peu ou des urines très foncées, si vous avez des vertiges ou une bouche très sèche : ce sont des signes de déshydratation. ${URG}

${FIN}`,
  }),
  a({
    slug: 'epices-herbes-plantes-reglisse-grossesse',
    title: 'Épices, herbes, tisanes et réglisse : ce qu’il faut savoir enceinte',
    summary: 'Comment utiliser épices et herbes aromatiques pendant la grossesse, pourquoi éviter les plantes cueillies et pourquoi signaler sa consommation de réglisse.',
    category: 'alimentation-grossesse', tags: ['épices', 'herbes aromatiques', 'tisanes', 'réglisse', 'plantes', 'gingembre', 'nausées', 'remontées acides'],
    sources: [S.ansesReglisse, S.santePrecautions, S.spfGuide],
    body_md: `## En bref
- Les **épices et aromates** aident à donner du goût en **réduisant le sel**.
- En cas de **nausées** ou de **remontées acides**, les plats **épicés** peuvent aggraver les symptômes.
- **Lavez soigneusement les herbes fraîches** et évitez les plantes, herbes et champignons **cueillis dans la nature**.
- **Réglisse** : bonbons, pastis sans alcool, tisanes « digestives » ou compléments en contiennent ; l’Anses demande aux femmes enceintes de **signaler leur consommation** à un professionnel.

## Comprendre
### Les épices et les herbes en cuisine
Les sources consultées ne déconseillent pas les épices utilisées pour assaisonner. Santé publique France les recommande même, avec les herbes et les condiments, pour limiter le sel. En revanche, elle conseille d’éviter les aliments gras, acides ou épicés lorsqu’ils favorisent les brûlures d’estomac.

Les **herbes fraîches** (persil, coriandre, basilic, menthe) peuvent porter de la terre et donc le parasite de la toxoplasmose : elles se lavent comme la salade.

### Les plantes cueillies
Pendant la grossesse, il est conseillé d’éviter les fruits, légumes, herbes et plantes **fraîchement cueillis à l’état sauvage**, y compris les champignons.

### La réglisse
La réglisse contient de l’acide glycyrrhizique. Consommée en excès, elle peut faire monter la tension artérielle et baisser le potassium dans le sang, avec un risque de troubles du rythme cardiaque. On la trouve dans les confiseries, certaines boissons (pastis, y compris sans alcool), des sirops, des **tisanes « digestives »**, des compléments alimentaires et comme arôme dans divers produits. L’Anses classe les femmes enceintes ou allaitantes parmi les personnes devant signaler toute consommation à un professionnel et conseille de ne pas cumuler plusieurs produits qui en contiennent.

### Les compléments à base de plantes
Comme tous les compléments, ils ne doivent pas être pris sans avis médical ou de votre sage-femme.

## Au quotidien
- **Assaisonnez** avec cumin, paprika doux, curry, muscade, cannelle, ail, oignon, échalote, herbes séchées ou surgelées.
- **Adaptez** si vous avez des nausées ou des brûlures d’estomac : plats doux, peu odorants, en petites portions.
- **Lavez les herbes fraîches** deux fois, feuille par feuille, juste avant usage.
- **Tisanes** : lisez la composition et repérez la réglisse ; variez les infusions plutôt que de boire chaque jour la même tisane composée.
- **Bonbons et bâtons de réglisse** : à éviter en quantité, et à ne pas cumuler avec d’autres produits qui en contiennent.
- **Gingembre** contre les nausées : Santé.fr indique qu’il peut être envisagé **sur avis médical** ; demandez d’abord conseil à votre médecin ou à votre sage-femme.

## Questions fréquentes
**Puis-je manger épicé pendant la grossesse ?**
Oui, si vous le supportez bien. Si les épices vous donnent des brûlures d’estomac ou des nausées, réduisez-les.

**Les tisanes sont-elles toutes autorisées ?**
Les infusions non sucrées font partie des boissons conseillées. Certaines tisanes à visée « digestive » contiennent de la réglisse, et les plantes médicinales ne sont pas anodines : demandez conseil à votre pharmacien ou à votre sage-femme pour toute tisane prise régulièrement ou dans un but de soin.

**Le curcuma ou la cannelle en gélules sont-ils une bonne idée ?**
Ce sont des compléments : ne les prenez pas sans avis médical pendant la grossesse. En cuisine, comme assaisonnement, ils ne font pas l’objet de mise en garde dans les sources consultées.

**Le pastis sans alcool est-il une alternative ?**
Il ne contient pas d’alcool, mais il contient souvent de la réglisse. Parlez-en à votre professionnel si vous en buvez régulièrement.

## Quand demander conseil
Consultez si vous avez des **maux de tête**, des **crampes** ou des douleurs musculaires inhabituelles, des palpitations, ou si votre tension est élevée, en signalant votre consommation de réglisse et de tisanes. En cas de troubles du rythme cardiaque ou de malaise, appelez le **15** ou le **112**.

${FIN}`,
  }),
];
