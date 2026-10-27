/**
 * Guide complet — lot 03 (27/10/2026) : la diversification de bébé de 4 à 12 mois, aliment par aliment.
 * Articles rédigés avec l'aide d'une IA à partir de pages officielles françaises réellement consultées le 2026-10-27
 * (Santé.fr / Santé publique France – Manger Bouger, mpedia/AFPA, HCSP, ANSES) : statut « À vérifier ».
 * Aucune quantité de lait ni d'aliment n'est recommandée par l'application : ces repères relèvent du professionnel qui suit l'enfant.
 */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles françaises). `published` = date affichée par la page.
const S = {
  sante4a6: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Entre 4 et 6 mois : l’introduction des aliments en douceur', url: 'https://www.sante.fr/entre-4-et-6-mois-lintroduction-des-aliments-en-douceur', consulted_on: C, published: '2025-10-24' },
  santeToutSavoir: { label: 'Santé.fr (Santé publique France – Manger Bouger) — Tout savoir sur la diversification alimentaire de votre enfant', url: 'https://www.sante.fr/node/19853251', consulted_on: C, published: '2025-10-24' },
  santeDiversif: { label: 'Santé.fr (information mpedia) — Diversification alimentaire du bébé : le guide complet', url: 'https://www.sante.fr/commencer-la-diversification', consulted_on: C, published: '2026-09-21' },
  sante6a12: { label: 'Santé.fr (information mpedia) — 6 à 12 mois, poursuite de la diversification alimentaire', url: 'https://www.sante.fr/6-12-mois-poursuite-de-la-diversification-alimentaire', consulted_on: C, published: '2025-06-12' },
  sante6a12Rythme: { label: 'Santé.fr (information mpedia) — Entre 6 et 12 mois, alimentation variée, rythme régulier', url: 'https://www.sante.fr/node/1068579', consulted_on: C, published: '2020-12-28' },
  santePnns: { label: 'Santé.fr (information mpedia) — La diversification mois par mois du PNNS', url: 'https://www.sante.fr/la-diversification-mois-par-mois-du-pnns', consulted_on: C, published: '2023-07-10' },
  santeVege: { label: 'Santé.fr (information mpedia) — Enfant végétarien ou végétalien : est-ce sans danger pour sa santé ?', url: 'https://www.sante.fr/node/1093906', consulted_on: C, published: '2026-01-30' },
  hcsp: { label: 'Haut Conseil de la santé publique — Avis relatif à la révision des repères alimentaires pour les enfants âgés de 0-36 mois et de 3-17 ans', url: 'https://www.hcsp.fr/Explore.cgi/Telecharger?NomFichier=hcspa20200630_rvisidesreprealimepourlesenfan.pdf', consulted_on: C, published: '2020-06-30' },
  ansesMiel: { label: 'ANSES — Pas de miel pour les enfants de moins d’un an', url: 'https://www.anses.fr/fr/content/pas-de-miel-les-enfants-de-moins-dun-an', consulted_on: C, published: '2023-10-31' },
  ansesPoisson: { label: 'ANSES — Manger du poisson : pourquoi ? comment ?', url: 'https://www.anses.fr/fr/content/manger-du-poisson-pourquoi-comment', consulted_on: C, published: '2022-06-30' },
  ansesFichePoisson: { label: 'ANSES — Poissons et produits de la pêche, conseils de consommation (fiche)', url: 'https://www.anses.fr/fr/system/files/ANSES-Ft-RecosPoissons.pdf', consulted_on: C },
  ansesNourrissons: { label: 'ANSES — L’alimentation des nourrissons (fiche, diffusée par les services de l’État à Saint-Pierre-et-Miquelon)', url: 'https://www.saint-pierre-et-miquelon.developpement-durable.gouv.fr/IMG/pdf/ANSES-Ft-AlimNourrissons.pdf', consulted_on: C },
  ansesLaitCru: { label: 'ANSES — Fromages au lait cru : quels risques pour la santé et comment mieux les prévenir ?', url: 'https://www.anses.fr/fr/content/fromages-au-lait-cru-quels-risques-pour-la-sante-et-comment-mieux-les-prevenir', consulted_on: C, published: '2022-04-08' },
  ansesHygiene: { label: 'ANSES — Conseils d’hygiène dans la cuisine : dix gestes simples pour prévenir les risques microbiologiques', url: 'https://www.anses.fr/fr/content/conseils-dhygiene-dans-la-cuisine-dix-gestes-simples-pour-prevenir-les-risques', consulted_on: C, published: '2020-12-24' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du médecin, de la sage-femme ou de la PMI qui connaissent votre enfant et votre situation.';

const BABY = { journeys: ['newborn'] as LibArticle['journeys'], category: 'alimentation-bebe' as const, status: 'to_review' as const };

export const GUIDE_B03: LibArticle[] = [
  {
    ...BABY,
    slug: 'diversification-legumes-bebe',
    title: 'Les légumes de bébé : lesquels, comment les cuire, comment les proposer',
    summary: 'Carotte, courgette, haricot vert, épinard, petits pois : les légumes se proposent cuits, mixés en purée lisse, sans sel, un par un, avec un peu de matière grasse.',
    body_md: `Les légumes sont souvent les premiers aliments que bébé découvre à la cuillère. Couleurs, odeurs, goûts plus ou moins doux ou amers : c'est tout un monde qui s'ouvre. Voici comment les choisir, les préparer et les proposer entre 4 et 12 mois.

## En bref
- Les légumes peuvent être proposés dès le début de la diversification, entre 4 et 6 mois, cuits à l'eau ou à la vapeur, sans sel, mixés en purée lisse.
- Les repères citent des légumes souvent bien tolérés pour commencer : carotte, haricot vert, épinard, courgette, petits pois.
- Au début, on évite les légumes très riches en fibres : vert de poireau, cœur d'artichaut, salsifis.
- Un nouveau légume à la fois, seul, puis mélangé une fois accepté.
- Un peu de matière grasse (huile de colza, de noix ou d'olive, ou parfois une noisette de beurre) s'ajoute aux purées.

## Comprendre
Aucun ordre n'est imposé entre les groupes d'aliments : certaines familles commencent par les légumes, d'autres par les fruits. Les légumes ont l'avantage de faire découvrir tôt des saveurs moins sucrées, ce qui élargit la palette des goûts.

Le choix peut suivre les saisons : les repères indiquent qu'aucun légume n'est strictement interdit. Ce qui compte, c'est la cuisson (bien cuits, tendres), la texture (bien lisse au début) et l'absence de sel ajouté. La pomme de terre peut servir à épaissir une purée de légume très liquide, comme la courgette, l'épinard ou la tomate.

Vers 9 mois, les repères indiquent que la plupart des légumes sont acceptés, y compris ceux au goût plus marqué ou plus riches en fibres. Les purées deviennent alors moins lisses, et de petits morceaux fondants peuvent être proposés à part.

## Au quotidien
- **Préparez simplement** : lavez, épluchez si besoin, coupez en morceaux, faites cuire à l'eau ou à la vapeur jusqu'à ce que le légume s'écrase facilement, puis mixez finement.
- **Ajustez la texture** avec un peu d'eau de cuisson ou de lait de bébé si la purée est trop épaisse, ou avec un peu de pomme de terre si elle est trop liquide.
- **Ajoutez la matière grasse au moment de servir**, crue, dans la purée tiède.
- **Un légume par découverte** : par exemple carotte plusieurs jours, puis courgette, puis un mélange carotte-courgette.
- **Gardez un petit carnet** des légumes goûtés : il aide à varier et à repérer ce qui plaît moins pour le reproposer plus tard.
- **Proposez, sans viser une quantité** : quelques cuillerées suffisent au début ; c'est l'appétit de votre bébé qui guide.
- **Surgelés nature** : des légumes surgelés sans sauce ni sel ajouté peuvent dépanner, en lisant bien la liste des ingrédients.

## Questions fréquentes
**Mon bébé grimace devant les haricots verts : faut-il abandonner ?**
Une grimace ne veut pas dire un refus. Les repères conseillent de reproposer un aliment refusé quelques jours plus tard : il faut parfois le présenter jusqu'à une dizaine de fois avant qu'il soit accepté. Sans forcer, en restant détendu.

**Puis-je mélanger légumes et féculents dès le début ?**
Au tout début, mieux vaut présenter chaque nouveau légume seul, pour que bébé découvre son goût. Une fois le légume accepté, vous pouvez le mélanger à d'autres ou à un peu de pomme de terre.

**Faut-il éplucher et épépiner la tomate ?**
Pour les premières purées très lisses, retirer peau et pépins aide à obtenir une texture homogène. La tomate peut aussi être associée à un peu de pomme de terre pour épaissir.

**Les légumes surgelés ou en conserve sont-ils adaptés ?**
Les légumes surgelés nature peuvent être pratiques. Pour les conserves, vérifiez l'étiquette : elles contiennent souvent du sel ajouté, que les repères conseillent d'éviter chez le bébé.

## Quand demander conseil
Parlez-en au médecin, à la sage-femme ou à la PMI si votre bébé refuse durablement tous les légumes, vomit régulièrement après les repas, a des selles très modifiées qui persistent ou s'il prend peu de poids. Après un repas, une gêne respiratoire, un gonflement des lèvres ou du visage, ou un bébé qui devient mou ou pâle : appelez le 15 ou le 112.

${END}`,
    tags: ['diversification', 'légumes', 'purée', 'premiers légumes', 'carotte', 'courgette', 'haricots verts', '4-6 mois'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.sante4a6, S.santeDiversif, S.sante6a12],
  },
  {
    ...BABY,
    slug: 'diversification-fruits-bebe',
    title: 'Les fruits de bébé : compotes, fruits crus, fruits entiers',
    summary: 'Les fruits se proposent d’abord cuits et mixés sans sucre ajouté, puis tendres et écrasés ; le fruit entier est préféré au jus.',
    body_md: `Les fruits plaisent souvent vite aux bébés, grâce à leur goût naturellement sucré. Ils apportent de la variété et des fibres. Voici comment les introduire entre 4 et 12 mois, du premier fruit cuit aux morceaux tendres.

## En bref
- Les fruits peuvent être introduits dès 4 à 6 mois, cuits à l'eau ou à la vapeur, sans sucre ajouté, mixés en compote lisse.
- Les repères citent pour commencer des fruits souvent bien tolérés : poire, banane, pomme.
- Ensuite viennent les fruits tendres crus (comme la banane) ou cuits écrasés à la fourchette.
- Le fruit entier est préféré au jus de fruits : les jus, même sans sucre ajouté, sont à éviter avant 3 ans.
- Les raisins entiers font partie des aliments à risque d'étouffement.

## Comprendre
Les bébés ont une préférence naturelle pour le goût sucré. Les fruits trouvent donc souvent leur place facilement. Ce n'est pas une raison pour y ajouter du sucre : les repères officiels recommandent de proposer le sucre et les produits sucrés le plus tard possible, pour ne pas renforcer cette préférence et pour prévenir les caries.

Le jus de fruits n'apporte pas les mêmes bénéfices que le fruit entier : il rassasie moins et habitue au goût sucré en boisson. Avant 3 ans, seuls le lait et l'eau sont nécessaires comme boissons.

Au fil des mois, la texture évolue : compote très lisse au début, puis fruit écrasé, puis petits morceaux tendres que bébé peut attraper. Les fruits peuvent aussi compléter le goûter ou le dîner, par exemple en compote associée à un laitage nature.

## Au quotidien
- **Compote maison simple** : un fruit de saison épluché, coupé, cuit à la casserole avec deux cuillerées d'eau, puis mixé, sans sucre.
- **Banane mûre** : elle s'écrase à la fourchette, crue, sans cuisson.
- **Un fruit nouveau à la fois**, puis des mélanges (pomme-poire, pomme-banane) une fois chacun accepté.
- **Petits morceaux tendres** quand bébé commence à manger avec les doigts : poire très mûre, banane, pêche bien mûre, coupés en morceaux adaptés à sa main.
- **Raisins, cerises, tomates cerises** : coupez-les en petits morceaux et retirez noyaux et pépins durs ; ne les donnez jamais entiers.
- **Compotes du commerce** : choisissez-les « sans sucres ajoutés » en lisant la liste des ingrédients.
- **Fruit au goûter** : une compote ou un fruit écrasé avec un yaourt nature ou un morceau de pain forme un goûter simple.

## Questions fréquentes
**Faut-il commencer par les légumes pour qu'il ne préfère pas le sucré ?**
Aucun ordre n'est imposé par les repères. Beaucoup de familles proposent les légumes le midi ou le soir et un fruit au goûter. L'essentiel est de varier et de reproposer les légumes moins aimés.

**Puis-je donner des fruits crus dès le début ?**
Au début, les fruits se proposent cuits et mixés. La banane très mûre, écrasée, fait exception car elle est tendre. Les autres fruits crus viennent ensuite, bien mûrs, écrasés ou en petits morceaux tendres.

**Les fruits rouges ou les agrumes sont-ils interdits ?**
Les repères ne les interdisent pas. Proposez-les comme les autres, un par un, sous une forme adaptée à l'âge. Si une réaction vous inquiète, notez ce que bébé a mangé et parlez-en au médecin.

**Un jus de fruits pressé maison, c'est mieux ?**
Même maison, un jus reste une boisson sucrée. Les repères conseillent d'éviter les jus de fruits avant 3 ans et de privilégier le fruit entier.

## Quand demander conseil
Consultez si des plaques, des démangeaisons, des vomissements ou une diarrhée apparaissent après un fruit, ou si votre bébé refuse durablement de manger. Si votre enfant s'étouffe et ne peut plus respirer, tousser ou crier, ou s'il présente une gêne respiratoire ou un gonflement du visage après un repas, appelez immédiatement le 15 ou le 112.

${END}`,
    tags: ['diversification', 'fruits', 'compote', 'banane', 'pomme', 'poire', 'jus de fruits', 'sucre'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.sante4a6, S.santeDiversif, S.hcsp],
  },
  {
    ...BABY,
    slug: 'diversification-feculents-bebe',
    title: 'Pommes de terre, pâtes, riz, pain : les féculents de bébé',
    summary: 'Pomme de terre, pâtes, riz, semoule, pain : les féculents trouvent leur place pendant la diversification, bien cuits et adaptés à la texture du moment.',
    body_md: `Après les premières purées de légumes et de fruits, les féculents complètent les repas de bébé : pomme de terre, pâtes, riz, semoule, pain. Ils apportent de l'énergie et permettent de varier les textures. Voici les repères pour les introduire.

## En bref
- Les repères officiels indiquent que pommes de terre, céréales et légumineuses peuvent être introduites dès 4 à 6 mois.
- Entre 6 et 12 mois, les féculents (pomme de terre, pâtes, riz, légumineuses) s'ajoutent progressivement aux repas.
- Le pain et les produits céréaliers sont à introduire au plus tard à 12 mois.
- Ils se proposent bien cuits, sans sel ajouté, mixés ou écrasés selon l'âge, puis en petits morceaux tendres.
- Les céréales infantiles sucrées sont déconseillées.

## Comprendre
La pomme de terre est souvent le premier féculent : elle se mixe facilement avec un légume et permet d'épaissir une purée trop liquide. Les pâtes, le riz et la semoule arrivent ensuite, bien cuits, mixés avec les légumes au début, puis simplement écrasés et enfin en petites formes tendres.

Le pain fait partie des produits céréaliers recommandés. Les repères de Santé publique France citent le pain complet parmi les aliments qui peuvent être découverts dès 4 à 6 mois. Une croûte de pain peut aussi accompagner un goûter quand bébé commence à manger avec les doigts, toujours assis et sous surveillance.

Les féculents contenant du gluten (pain, pâtes, semoule de blé) n'ont pas à être retardés : les repères actuels recommandent au contraire de ne pas différer le gluten pendant la diversification.

## Au quotidien
- **Débutez avec la pomme de terre** mixée avec un légume déjà connu, par exemple carotte et pomme de terre.
- **Faites bien cuire pâtes et riz**, un peu plus longtemps que pour les adultes, puis mixez-les avec la purée de légumes.
- **Faites évoluer la texture** : mixé au début, écrasé à la fourchette ensuite, puis petites pâtes ou riz bien tendre vers la fin de la première année.
- **Pas de sel dans l'eau de cuisson** pour la part de bébé : prélevez-la avant d'assaisonner le plat familial.
- **Un filet d'huile crue** (colza, noix ou olive) dans la purée au moment de servir.
- **Pain** : proposez-le en petits morceaux ou en croûte, en restant à côté de bébé, assis bien droit.
- **Lisez les étiquettes** des céréales et biscuits « bébé » : évitez ceux qui contiennent des sucres ajoutés.

## Questions fréquentes
**À partir de quand peut-il manger des pâtes ?**
Les céréales font partie des aliments qui peuvent être introduits dès 4 à 6 mois. Les pâtes se proposent bien cuites et mixées au début, puis écrasées, puis en petites formes tendres quand bébé gère les textures plus épaisses.

**Le riz et les pâtes complets conviennent-ils ?**
Les repères de Santé publique France citent le pain complet parmi les aliments possibles. Les produits complets sont plus riches en fibres : introduisez-les progressivement et observez la digestion de votre bébé.

**Faut-il éviter le gluten la première année ?**
Non. Les repères actuels recommandent de ne pas retarder le gluten et de l'introduire pendant la diversification, en petites quantités. En cas de maladie digestive connue ou d'antécédents familiaux, demandez l'avis du médecin.

**Il mange seulement la purée de pommes de terre et laisse les légumes : que faire ?**
Continuez à proposer les légumes, seuls ou mélangés, sans forcer. Reproposer régulièrement un aliment moins apprécié aide souvent à le faire accepter avec le temps.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé a une diarrhée qui persiste, un ventre très gonflé, s'il prend peu de poids ou semble moins tonique depuis l'introduction de nouveaux aliments. Si votre enfant s'étouffe et ne peut plus respirer, tousser ou crier, appelez immédiatement le 15 ou le 112.

${END}`,
    tags: ['diversification', 'féculents', 'pomme de terre', 'pâtes', 'riz', 'pain', 'semoule', 'gluten'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.sante4a6, S.santeDiversif, S.hcsp],
  },
  {
    ...BABY,
    slug: 'cereales-infantiles-et-gluten-bebe',
    title: 'Céréales infantiles et gluten : quand et comment les introduire ?',
    summary: 'Le gluten ne doit pas être retardé pendant la diversification ; les céréales infantiles sont facultatives, à choisir sans sucres ajoutés et selon les conseils du professionnel.',
    body_md: `« Faut-il mettre des céréales dans le biberon ? », « À quel âge le gluten ? » : ces questions reviennent souvent. Les repères ont évolué ces dernières années. Voici ce qu'ils disent aujourd'hui, sans fixer de quantité, qui relève du professionnel qui suit votre enfant.

## En bref
- Le gluten fait partie des aliments qui ne doivent pas être retardés : il peut être découvert pendant la diversification, entre 4 et 6 mois, en petites quantités.
- Les céréales infantiles ne sont pas indispensables ; les repères indiquent qu'elles peuvent être ajoutées plus tard, sur conseil d'un professionnel.
- Les céréales infantiles sucrées sont déconseillées.
- Le pain et les produits céréaliers doivent être introduits au plus tard à 12 mois.
- En cas de maladie digestive connue ou d'antécédents familiaux, demandez l'avis du médecin.

## Comprendre
Le gluten est une protéine présente dans le blé, l'orge et le seigle (et souvent l'épeautre). Longtemps, on a conseillé de le retarder. Les repères actuels du Haut Conseil de la santé publique et de Santé publique France recommandent au contraire de ne pas retarder les aliments dits « allergènes », dont le gluten : plus ils sont goûtés tôt, plus la tolérance peut se développer.

Les céréales infantiles sont des farines adaptées aux bébés. Elles ne sont pas obligatoires : un bébé peut découvrir les céréales par le pain, les pâtes, la semoule ou le riz bien cuits. Si vous souhaitez en utiliser, le professionnel qui suit votre enfant vous dira comment et à quel moment, notamment s'il faut ou non en mettre dans un biberon.

Les céréales « parfumées » ou sucrées habituent au goût sucré. Les repères les déconseillent et recommandent de proposer les produits sucrés le plus tard possible.

## Au quotidien
- **Découverte du gluten** : un peu de pain, de semoule de blé ou de petites pâtes bien cuites mélangés à une purée déjà connue.
- **Une nouveauté à la fois**, de préférence en début de journée, quand vous pouvez observer votre bébé dans les heures qui suivent.
- **Lisez la liste des ingrédients** des céréales infantiles : évitez celles avec sucres ajoutés, miel (interdit avant 1 an) ou arômes chocolat.
- **Ne changez pas la préparation du biberon** (ajout de céréales, épaississement) sans en avoir parlé avec le médecin, la sage-femme ou la PMI.
- **Variez les céréales** au fil des semaines : blé, riz, avoine, maïs, sous des formes adaptées.
- **Une fois toléré**, continuez à proposer régulièrement des aliments contenant du gluten.

## Questions fréquentes
**Mettre des céréales dans le biberon du soir l'aide-t-il à dormir ?**
Les repères officiels consultés ne présentent pas les céréales comme un moyen d'améliorer le sommeil. Toute modification du biberon se discute avec le professionnel qui suit votre bébé, qui tiendra compte de son âge, de sa croissance et de ses besoins.

**Mon bébé a déjà 10 mois et n'a jamais eu de gluten : est-ce trop tard ?**
Le pain et les produits céréaliers sont à introduire au plus tard à 12 mois. Il est donc encore temps : proposez-en en petite quantité, comme pour tout nouvel aliment.

**Faut-il des céréales « sans gluten » au début ?**
Ce n'est pas nécessaire pour un bébé en bonne santé. Les repères recommandent de ne pas retarder le gluten. En cas de maladie cœliaque dans la famille ou de symptômes digestifs, demandez conseil au médecin.

**Comment reconnaître une mauvaise tolérance ?**
Notez tout changement après une nouveauté : vomissements, diarrhée qui persiste, ventre très gonflé, cassure de la courbe de poids, plaques sur la peau. Ces signes justifient de consulter, sans conclure seul.

## Quand demander conseil
Consultez le médecin ou la PMI si votre bébé a une diarrhée qui dure, un ventre gonflé, qu'il semble triste ou fatigué, ou que sa courbe de poids ralentit. Appelez le 15 ou le 112 en cas de gêne respiratoire, de gonflement des lèvres ou du visage, ou si votre bébé devient mou ou pâle après un repas.

${END}`,
    tags: ['gluten', 'céréales infantiles', 'farine', 'biberon', 'diversification', 'maladie cœliaque', 'allergènes'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.hcsp, S.santeToutSavoir, S.sante4a6],
  },
  {
    ...BABY,
    slug: 'legumineuses-bebe-lentilles-pois-chiches',
    title: 'Lentilles, pois chiches, haricots secs : les légumineuses pour bébé',
    summary: 'Riches en fibres, en fer et en protéines, les légumineuses peuvent être proposées de temps en temps en purée lisse dès 4 à 6 mois, en surveillant la digestion.',
    body_md: `Lentilles corail, pois chiches, haricots blancs, pois cassés : les légumineuses (ou légumes secs) ont toute leur place dans l'alimentation des tout-petits. Elles se préparent facilement en purée et apportent des nutriments précieux. Voici comment les introduire.

## En bref
- Les légumineuses peuvent être proposées de temps en temps en purée lisse dès 4 à 6 mois, en vérifiant que bébé les digère bien.
- Elles sont riches en fibres, en fer et en protéines.
- Après 1 an, les repères recommandent d'en proposer au moins deux fois par semaine.
- Les faire tremper avant cuisson et bien les cuire aide à les rendre plus digestes.
- Elles se proposent toujours bien cuites, mixées, puis écrasées, sans sel ajouté.

## Comprendre
Les légumineuses regroupent les lentilles, les pois chiches, les haricots secs, les pois cassés, les fèves. Les repères de Santé publique France les rangent parmi les aliments qui peuvent être découverts dès le début de la diversification, sans ordre imposé.

Parce qu'elles sont riches en fibres, elles peuvent parfois provoquer des gaz ou modifier les selles. C'est pourquoi on les introduit progressivement, en petite quantité, d'abord mélangées à un légume déjà connu, en observant la digestion de bébé.

Elles apportent aussi du fer d'origine végétale. Les repères sur l'alimentation végétarienne de l'enfant conseillent d'associer ces sources de fer à des aliments riches en vitamine C (fruits, légumes), et de faire tremper les légumineuses avant cuisson.

## Au quotidien
- **Lentilles corail** : elles cuisent vite, se défont toutes seules et se mixent facilement avec une carotte ou une courge.
- **Pois chiches et haricots secs** : faites-les tremper plusieurs heures, jetez l'eau de trempage, puis cuisez-les longtemps jusqu'à ce qu'ils s'écrasent sans effort. Retirez si possible les peaux pour les premières purées.
- **Conserves** : rincez-les bien et vérifiez l'étiquette, car elles contiennent souvent du sel.
- **Mélangez à un légume connu** : par exemple purée de carotte avec un peu de lentilles corail.
- **Faites évoluer la texture** : lisse au début, écrasée ensuite, puis lentilles entières très tendres vers la fin de la première année.
- **Associez un fruit au repas ou au dessert**, comme les repères le suggèrent pour le fer végétal.
- **Ne donnez jamais de pois chiches ou de haricots entiers fermes** à un tout-petit : ronds et durs, ils peuvent provoquer une fausse route.

## Questions fréquentes
**Mon bébé a des gaz après les lentilles : dois-je arrêter ?**
Les légumineuses sont riches en fibres. Vous pouvez faire une pause, puis reproposer une plus petite quantité, bien cuite et mixée, mélangée à un légume connu. Si les troubles digestifs sont importants ou persistent, parlez-en au médecin.

**Les légumineuses peuvent-elles remplacer la viande ?**
Elles apportent des protéines et du fer, mais pas exactement les mêmes nutriments que la viande, le poisson ou l'œuf. Si vous envisagez une alimentation végétarienne pour votre bébé, parlez-en au professionnel qui le suit (voir l'article dédié).

**Et le houmous ?**
Le pois chiche en purée peut convenir, mais les houmous du commerce contiennent souvent du sel, de l'ail cru, du citron et de la crème de sésame. Une purée de pois chiches maison, sans sel, est plus adaptée. Le sésame fait partie des allergènes signalés sur les étiquettes : s'il est présent, proposez-le comme toute nouveauté, en petite quantité, en observant votre bébé.

**Les pois cassés et les fèves aussi ?**
Ce sont des légumineuses. Proposez-les de la même façon, bien cuites et mixées, en petite quantité au début. Si votre enfant a une maladie connue ou suit un régime particulier, demandez au médecin quels aliments lui conviennent.

## Quand demander conseil
Consultez si votre bébé a des douleurs abdominales importantes, des vomissements, une diarrhée qui dure, du sang dans les selles, ou s'il prend peu de poids. En cas de gêne respiratoire, de gonflement du visage ou si votre enfant s'étouffe et ne peut plus respirer, tousser ou crier : appelez immédiatement le 15 ou le 112.

${END}`,
    tags: ['légumineuses', 'légumes secs', 'lentilles', 'pois chiches', 'haricots', 'fer', 'diversification'],
    min_age_months: 4,
    max_age_months: 18,
    sources: [S.sante4a6, S.hcsp, S.santeVege],
  },
  {
    ...BABY,
    slug: 'diversification-viande-volaille-bebe',
    title: 'La viande et la volaille dans l’assiette de bébé',
    summary: 'Viande et volaille s’introduisent en très petites quantités, toujours très cuites, mixées puis hachées finement ; la quantité adaptée se discute avec le professionnel.',
    body_md: `La viande fait partie des aliments que bébé découvre pendant sa première année. Elle apporte notamment des protéines et du fer. Mais à cet âge, les besoins sont petits et les repères insistent sur deux points : de petites quantités et une cuisson complète.

## En bref
- Viande et volaille peuvent être introduites dès 4 à 6 mois, sans ordre imposé avec les autres groupes d'aliments.
- Les repères recommandent d'alterner volaille, viande, poisson et œuf.
- Les quantités sont très petites la première année : le médecin, la sage-femme ou la PMI vous indiquera ce qui convient à votre enfant.
- Avant 3 ans, viandes et poissons se proposent très cuits ; la viande hachée doit être bien cuite à cœur.
- Au début, la viande est mixée avec les légumes, puis hachée finement.

## Comprendre
Les tout-petits n'ont pas besoin de beaucoup de protéines : les repères du Haut Conseil de la santé publique indiquent des quantités très modestes, qui augmentent progressivement avec l'âge. Les pédiatres soulignent même que les jeunes enfants consomment souvent trop de protéines. Il n'est donc pas utile de proposer viande, poisson ou œuf à chaque repas, ni en grande portion.

La cuisson est essentielle. Les jeunes enfants sont plus sensibles aux infections alimentaires. L'ANSES recommande que la viande hachée soit bien cuite à cœur pour eux, et déconseille fortement les viandes crues ou peu cuites (tartare, carpaccio). Avant 3 ans, les repères demandent que viandes et poissons soient très cuits.

La viande se mélange d'abord à la purée de légumes, finement mixée. Puis, au fil des mois, elle est hachée, puis coupée en tout petits morceaux tendres.

## Au quotidien
- **Choisissez des morceaux maigres et tendres** : blanc de poulet ou de dinde, bœuf, veau, agneau, porc maigre, sans peau ni gras visible.
- **Faites cuire complètement** : à l'eau, à la vapeur ou à la poêle sans brûler, jusqu'à ce qu'il ne reste aucune partie rosée, puis mixez avec les légumes.
- **Viande hachée** : cuite à cœur, sans partie rosée au centre.
- **Pas de sel ni de bouillon cube** dans la part de bébé.
- **Alternez** : volaille un jour, poisson un autre, œuf un autre, viande rouge un autre.
- **Prélevez avant d'assaisonner** quand vous cuisinez pour toute la famille.
- **Respectez l'hygiène** : une planche pour la viande crue, une autre pour les aliments cuits ; lavez-vous les mains après avoir manipulé de la viande crue.
- **Conservez la viande cuite au réfrigérateur** rapidement : l'ANSES conseille de ne pas laisser les aliments plus de 2 heures à température ambiante.

## Questions fréquentes
**Quelle quantité de viande donner à mon bébé ?**
Les besoins sont petits et varient selon l'âge et l'enfant. L'application ne fixe pas de quantité : demandez au médecin, à la sage-femme ou à la PMI, qui suivent la croissance de votre bébé.

**Faut-il donner de la viande midi et soir ?**
Les repères ne le demandent pas : ils expriment, pour l'ensemble de la journée, des quantités de viande, poisson ou œuf très petites. Il n'est donc pas utile d'en proposer à chaque repas. Le professionnel qui suit votre enfant pourra adapter ce repère.

**Il recrache les morceaux de viande : que faire ?**
La viande est une texture plus difficile à mâcher. Revenez à une viande finement mixée ou hachée dans la purée, puis réessayez des petits morceaux très tendres plus tard, sans forcer.

**Le jambon compte-t-il comme de la viande ?**
Les repères considèrent la charcuterie comme non justifiée sur le plan nutritionnel chez le tout-petit. Seul le jambon blanc est accepté, de façon très exceptionnelle (voir l'article sur la charcuterie et les abats).

## Quand demander conseil
Consultez si votre bébé a de la fièvre, une diarrhée, des vomissements ou du sang dans les selles après un repas, surtout s'il boit moins ou mouille moins ses couches. En cas de diarrhée sanglante, de bébé très fatigué, pâle ou qui urine très peu, appelez le 15 ou le 112.

${END}`,
    tags: ['viande', 'volaille', 'poulet', 'protéines', 'fer', 'cuisson', 'diversification', 'viande hachée'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.hcsp, S.ansesHygiene, S.santeDiversif],
  },
  {
    ...BABY,
    slug: 'jambon-charcuterie-abats-bebe',
    title: 'Jambon, charcuterie, abats : que dire aux tout-petits ?',
    summary: 'La charcuterie n’est pas justifiée chez le tout-petit, seul le jambon blanc est accepté de façon exceptionnelle ; les abats sont évités au début de la diversification.',
    body_md: `Une tranche de jambon, un bout de saucisson à l'apéritif, une terrine du dimanche : la charcuterie est très présente dans les repas familiaux. Pour un bébé, les repères officiels sont clairs et plutôt prudents. Voici ce qu'ils disent, et comment faire en pratique.

## En bref
- Le Haut Conseil de la santé publique considère que la charcuterie n'est pas justifiée sur le plan nutritionnel chez le jeune enfant.
- Seul le jambon blanc est accepté, de façon très exceptionnelle.
- Les abats sont évités au début de la diversification ; les pédiatres indiquent qu'ils peuvent être introduits vers 1 an.
- Les charcuteries crues ou peu cuites et les produits traiteurs demandent une attention particulière à l'hygiène.
- Mieux vaut privilégier viande, volaille, poisson et œuf bien cuits.

## Comprendre
La charcuterie est souvent riche en sel et en graisses, et contient fréquemment des additifs. Or les repères recommandent d'éviter le sel ajouté chez le tout-petit, dont les reins sont encore immatures. C'est pourquoi le Haut Conseil de la santé publique juge la charcuterie non justifiée chez l'enfant de moins de 3 ans, à l'exception du jambon blanc, de façon très exceptionnelle.

Les pédiatres (mpedia) précisent qu'au début de la diversification, les abats et la plupart des charcuteries sont évités, et qu'un jambon blanc maigre, sans couenne, reste acceptable. Vers 1 an, ils indiquent que l'on peut élargir et introduire les abats.

Côté hygiène, l'ANSES rappelle que les produits traiteurs et les aliments très périssables vendus à la coupe se conservent peu de temps : moins de 3 jours est souvent recommandé, en demandant conseil au commerçant.

## Au quotidien
- **Préférez une viande fraîche bien cuite** à la charcuterie pour la part de bébé.
- **Si vous proposez exceptionnellement du jambon blanc**, choisissez-le maigre, sans couenne, et mixez-le ou coupez-le très finement.
- **Lisez l'étiquette** : comparez la teneur en sel entre les produits.
- **Pas de charcuterie sèche** (saucisson, chorizo, jambon cru) : elle est salée, dure à mâcher et crue.
- **Attention à l'apéritif** : les petits morceaux de saucisson, les chips et les cacahuètes ne sont pas adaptés aux tout-petits, aussi pour le risque d'étouffement.
- **Abats** : attendez les repères du professionnel ; vers 1 an, ils peuvent être proposés, bien cuits et mixés.
- **Conservez le jambon entamé au réfrigérateur**, bien emballé, et consommez-le rapidement.

## Questions fréquentes
**Le jambon blanc, c'est bien pour commencer la viande ?**
Ce n'est pas l'option recommandée. Les repères privilégient la viande ou la volaille fraîches, bien cuites et mixées. Le jambon blanc reste un dépannage exceptionnel.

**Et le jambon de volaille ?**
Il s'agit aussi d'un produit de charcuterie, souvent salé et contenant des additifs. Les repères ne citent que le jambon blanc comme exception : une volaille fraîche cuite est préférable.

**Mon enfant de 11 mois a goûté du saucisson chez ses grands-parents : est-ce grave ?**
Un écart ponctuel n'est pas une raison de vous alarmer. Expliquez simplement les repères aux proches qui le gardent. Si votre enfant présente des symptômes (vomissements, diarrhée, fièvre), parlez-en au médecin.

**Le foie est-il bon pour le fer ?**
Les abats sont riches en certains nutriments, mais ils sont évités au début de la diversification. Demandez au professionnel qui suit votre enfant à partir de quand et à quelle fréquence les proposer.

## Quand demander conseil
Consultez si votre bébé a de la fièvre, des vomissements ou une diarrhée après un repas, et rapidement s'il boit moins, mouille moins ses couches ou semble très fatigué. En cas de diarrhée sanglante, d'enfant très pâle, mou ou qui urine très peu, ou si votre enfant s'étouffe et ne peut plus respirer, appelez le 15 ou le 112.

${END}`,
    tags: ['jambon', 'charcuterie', 'abats', 'foie', 'sel', 'diversification', 'apéritif'],
    min_age_months: 4,
    max_age_months: 36,
    sources: [S.hcsp, S.sante6a12, S.ansesHygiene],
  },
  {
    ...BABY,
    slug: 'diversification-poisson-bebe',
    title: 'Le poisson pour bébé : quand, lequel, comment le préparer',
    summary: 'Le poisson se propose dès la diversification, bien cuit et sans arêtes, en alternant poisson maigre et poisson gras, environ deux fois par semaine.',
    body_md: `Cabillaud, saumon, sardine, colin : le poisson est un aliment précieux pour les tout-petits, notamment pour les oméga-3. Il fait aussi partie des allergènes à ne pas retarder. Voici comment le choisir et le préparer pour votre bébé.

## En bref
- Le poisson peut être introduit dès 4 à 6 mois, en petite quantité, sans ordre imposé avec la viande ou l'œuf.
- Les repères proposent du poisson environ deux fois par semaine : un poisson maigre et un poisson gras.
- Il se propose toujours bien cuit, sans arêtes, frais ou surgelé, non pané.
- Certaines espèces sont à éviter ou à limiter jusqu'à 3 ans (voir l'article dédié).
- Le poisson cru (sushis, tartare) et les coquillages crus sont à éviter.

## Comprendre
Le poisson apporte des protéines et, pour les poissons gras, des oméga-3 à longue chaîne, utiles au développement. C'est aussi un allergène majeur : les repères actuels recommandent de ne pas retarder son introduction, car le goûter tôt peut favoriser la tolérance.

Les repères distinguent deux familles. Les poissons maigres : cabillaud, colin, merlan, sole, merlu. Les poissons gras : saumon, maquereau, sardine, hareng. Alterner les deux, et varier les espèces et les lieux d'approvisionnement, permet de profiter des bienfaits du poisson tout en limitant l'exposition aux polluants.

La cuisson compte : avant 3 ans, les repères demandent que poissons et viandes soient très cuits. Le poisson pané ou frit n'est pas adapté aux premières découvertes.

## Au quotidien
- **Cuisson simple** : à la vapeur, au court-bouillon sans sel, ou au four en papillote, jusqu'à ce que la chair se détache en flocons opaques.
- **Retirez soigneusement les arêtes** : écrasez la chair entre vos doigts pour les sentir avant de mixer.
- **Mixez avec un légume connu** au début (poisson-courgette, poisson-carotte), puis écrasez à la fourchette, puis proposez de petits morceaux tendres.
- **Surgelés nature** : filets sans panure ni sauce, à bien cuire ; ils sont pratiques et souvent déjà sans arêtes, mais vérifiez quand même.
- **Conserves** (sardines, maquereau) : retirez la peau et l'arête centrale, et préférez les conserves au naturel ; vérifiez la teneur en sel.
- **Une nouveauté à la fois**, en début de journée de préférence, pour observer votre bébé ensuite.
- **Hygiène** : une planche pour le poisson cru, une autre pour les aliments cuits ; poisson cuit au réfrigérateur rapidement.

## Questions fréquentes
**Quel poisson choisir pour la première fois ?**
Un poisson maigre à chair blanche, bien cuit et sans arêtes, est souvent choisi pour débuter (cabillaud, colin, merlan, sole). Le saumon ou la sardine viennent compléter pour les oméga-3.

**Le poisson surgelé est-il aussi bien que le frais ?**
Les repères citent indifféremment le poisson frais ou surgelé, à condition qu'il soit nature, non pané, et bien cuit.

**Peut-il manger du thon ?**
Le thon fait partie des poissons prédateurs sauvages que l'ANSES conseille de limiter jusqu'à 3 ans. Il peut être proposé de temps en temps, sans en faire le poisson habituel. Variez avec d'autres espèces.

**Mon bébé a des rougeurs après le poisson : allergie ?**
Notez ce qu'il a mangé, l'heure et les symptômes. Des rougeurs isolées peuvent avoir d'autres causes, mais parlez-en au médecin avant de reproposer ce poisson, surtout si la réaction se répète.

## Quand demander conseil
Appelez immédiatement le 15 ou le 112 si votre enfant, après un repas, a du mal à respirer, un gonflement des lèvres, de la langue ou du visage, des vomissements répétés avec malaise, ou s'il devient mou ou pâle. Consultez le médecin en cas de plaques, de démangeaisons, de vomissements ou de diarrhée après le poisson, ou si une arête semble coincée.

${END}`,
    tags: ['poisson', 'saumon', 'cabillaud', 'sardine', 'oméga-3', 'allergènes', 'diversification', 'arêtes'],
    min_age_months: 4,
    max_age_months: 36,
    sources: [S.santePnns, S.hcsp, S.ansesPoisson],
  },
  {
    ...BABY,
    slug: 'poissons-a-eviter-ou-limiter-avant-3-ans',
    title: 'Poissons à éviter ou à limiter avant 3 ans : la liste',
    summary: 'Espadon, marlin, siki, requin et lamproie sont à éviter jusqu’à 3 ans ; plusieurs poissons prédateurs sauvages et certains poissons d’eau douce sont à limiter.',
    body_md: `Le poisson est recommandé pour les tout-petits, mais pas n'importe lequel. Certains peuvent contenir davantage de polluants, comme le méthylmercure ou les PCB, auxquels le cerveau de l'enfant est particulièrement sensible. L'ANSES a publié des conseils précis. Les voici, en pratique.

## En bref
- De la grossesse jusqu'à 3 ans, le cerveau de l'enfant est particulièrement vulnérable aux contaminants comme le méthylmercure et les PCB.
- À éviter jusqu'à 3 ans : espadon, marlin, siki, requin, lamproie.
- À limiter : lotte (baudroie), loup (bar), bonite, empereur, grenadier, flétan, brochet, dorade, raie, sabre, thon.
- Poissons d'eau douce susceptibles d'accumuler des PCB (anguille, barbeau, brème, carpe, silure) : au maximum une fois tous les deux mois chez l'enfant de moins de 3 ans.
- Poisson cru ou peu cuit, coquillages crus : à éviter.

## Comprendre
Les grands poissons prédateurs, qui vivent longtemps et se nourrissent d'autres poissons, accumulent davantage de méthylmercure. Certains poissons d'eau douce, eux, peuvent accumuler des PCB. Ces substances peuvent affecter le développement du système nerveux. Pour les enfants de moins de 3 ans, les femmes enceintes et allaitantes, l'ANSES formule donc des recommandations spécifiques.

Ces conseils ne visent pas à faire peur du poisson : ils aident à bien le choisir. La recommandation générale reste de consommer du poisson deux fois par semaine, dont un poisson gras (saumon, sardine, maquereau, hareng) et un autre poisson (colin, merlu, cabillaud, sole), en variant les espèces et les lieux d'approvisionnement.

Côté hygiène, la fiche de l'ANSES conseille aussi d'éviter le poisson cru ou insuffisamment cuit, les coquillages crus ou peu cuits, et de cuire soi-même les crustacés plutôt que d'acheter des crustacés décortiqués vendus cuits, pour les publics sensibles. Les pédiatres rappellent d'éviter le poisson cru (tartare, sushis) chez le jeune enfant.

## Au quotidien
- **Pour la routine**, misez sur les poissons cités comme habituels : cabillaud, colin, merlu, merlan, sole, saumon, sardine, maquereau, hareng.
- **Thon, dorade, bar, lotte** : de temps en temps seulement, pas comme poisson habituel.
- **Espadon, requin, marlin, siki, lamproie** : ne les proposez pas à votre enfant avant 3 ans.
- **Pêche de loisir en rivière** : respectez les avis de non-consommation locaux, et limitez fortement anguille, carpe, brème, barbeau et silure.
- **Au restaurant ou à la cantine** : demandez l'espèce si le plat indique seulement « poisson ».
- **Sushis et poisson cru** : à garder pour plus tard.
- **Fruits de mer** : les pédiatres indiquent qu'ils peuvent être introduits vers 1 an ; toujours bien cuits.

## Questions fréquentes
**Mon bébé a mangé de l'espadon une fois : que faire ?**
Le risque est lié à une consommation répétée. Une fois ne justifie pas de vous alarmer : retirez simplement cette espèce des menus jusqu'à ses 3 ans. Si vous avez un doute, parlez-en au médecin.

**Le saumon d'élevage convient-il ?**
Le saumon fait partie des poissons gras cités par l'ANSES comme intéressants pour les oméga-3. Variez les espèces et les origines plutôt que de toujours servir le même poisson.

**Les bâtonnets de poisson panés, c'est du poisson ?**
Ils contiennent du poisson, mais aussi de la panure et souvent de l'huile de friture. Les repères recommandent un poisson non pané pour les tout-petits ; les panés restent occasionnels.

**Les crevettes et les moules sont-elles autorisées ?**
Les fruits de mer, toujours bien cuits, peuvent être proposés vers la fin de la première année selon les pédiatres. Les crustacés sont des allergènes : une nouveauté à la fois, en observant votre enfant.

## Quand demander conseil
Consultez si votre enfant présente des vomissements, une diarrhée, de la fièvre ou des plaques après un plat de poisson ou de fruits de mer. Appelez immédiatement le 15 ou le 112 en cas de gêne respiratoire, de gonflement des lèvres ou du visage, ou d'enfant qui devient mou ou pâle.

${END}`,
    tags: ['poisson', 'mercure', 'méthylmercure', 'PCB', 'espadon', 'thon', 'fruits de mer', 'sushis'],
    min_age_months: 4,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.ansesPoisson, S.ansesFichePoisson, S.sante6a12],
  },
  {
    ...BABY,
    slug: 'oeuf-bebe-introduction-cuisson',
    title: 'L’œuf pour bébé : à quel âge et comment le cuire ?',
    summary: 'L’œuf est un allergène à ne pas retarder : il se propose dès la diversification, en petite quantité, toujours bien cuit, jamais cru ni coulant.',
    body_md: `L'œuf est un aliment simple, pratique et peu coûteux. C'est aussi l'un des allergènes majeurs que les repères actuels recommandent d'introduire tôt plutôt que de le retarder. Le point clé : la cuisson.

## En bref
- L'œuf peut être découvert pendant la diversification, dès 4 à 6 mois, sans ordre imposé avec la viande ou le poisson.
- Il fait partie des allergènes à ne pas retarder ; on le propose en petite quantité, une nouveauté à la fois.
- Il se donne toujours bien cuit : jaune et blanc pris.
- Les préparations à base d'œufs crus ou peu cuits (mayonnaise maison, mousse au chocolat) sont à éviter.
- En cas d'eczéma sévère, d'allergie connue ou d'allergies importantes dans la famille, demandez d'abord l'avis du médecin.

## Comprendre
Les repères du Haut Conseil de la santé publique et de Santé publique France recommandent d'introduire les allergènes majeurs, dont l'œuf, pendant la diversification, sans attendre. Le goûter tôt peut favoriser la tolérance. S'il existe un risque d'allergie identifié, l'avis d'un médecin permet de décider comment procéder.

L'œuf compte dans le groupe « viande, poisson, œuf », que les repères proposent d'alterner. Les quantités sont petites la première année : le professionnel qui suit votre enfant vous indiquera ce qui convient.

La cuisson est indispensable : les jeunes enfants sont sensibles aux infections alimentaires, et les œufs crus ou peu cuits peuvent transmettre des bactéries. Les repères demandent donc un œuf toujours bien cuit, et d'éviter mousses, mayonnaises maison et autres préparations à base d'œuf cru.

## Au quotidien
- **Œuf dur** : faites-le cuire jusqu'à ce que jaune et blanc soient bien pris, puis écrasez-le finement et mélangez-le à une purée de légumes déjà connue.
- **Omelette bien cuite** : coupée en lanières ou en petits morceaux tendres quand bébé commence à manger avec les doigts.
- **Commencez par une petite quantité**, en début de journée, pour pouvoir observer votre bébé.
- **Une fois toléré**, continuez à proposer l'œuf régulièrement, sous différentes formes.
- **Desserts maison** : préférez les préparations cuites (gâteau, flan cuit) aux mousses ou crèmes à base d'œufs crus.
- **Hygiène** : lavez-vous les mains après avoir manipulé des œufs crus et conservez-les au frais.
- **Œuf à la coque, mollet, au plat coulant** : à garder pour plus tard.

## Questions fréquentes
**Faut-il commencer par le jaune ?**
Les repères consultés ne distinguent pas le jaune et le blanc : ils recommandent un œuf bien cuit, en petite quantité. Le blanc et le jaune peuvent donc être proposés ensemble, écrasés dans une purée.

**Mon bébé a 9 mois et n'a jamais mangé d'œuf : est-ce trop tard ?**
Non, introduisez-le comme les autres aliments, en petite quantité et bien cuit. En cas d'eczéma important ou d'allergie connue, demandez conseil d'abord.

**Les gâteaux contenant de l'œuf suffisent-ils à l'introduire ?**
Un gâteau cuit contient de l'œuf cuit, mais aussi souvent du sucre, que les repères conseillent de proposer le plus tard possible. Un œuf dur écrasé dans une purée reste une option simple.

**Des rougeurs sont apparues autour de la bouche : allergie ?**
Certaines rougeurs viennent d'un simple frottement. Notez ce qu'il a mangé et parlez-en au médecin avant de reproposer l'œuf, surtout si d'autres signes apparaissent ou si la réaction se répète.

## Quand demander conseil
Appelez immédiatement le 15 ou le 112 si, après un repas, votre enfant a du mal à respirer, une voix ou un cri modifié, un gonflement des lèvres, de la langue ou du visage, des vomissements répétés avec malaise, ou s'il devient mou ou pâle. Consultez le médecin en cas de plaques, de démangeaisons, de vomissements ou de diarrhée après l'œuf.

${END}`,
    tags: ['œuf', 'oeuf', 'allergènes', 'allergie', 'cuisson', 'diversification', 'protéines'],
    min_age_months: 4,
    max_age_months: 12,
    safety_critical: true,
    sources: [S.hcsp, S.sante4a6, S.santeDiversif],
  },
  {
    ...BABY,
    slug: 'yaourt-fromage-blanc-produits-laitiers-bebe',
    title: 'Yaourts, fromage blanc, petits-suisses : les produits laitiers de bébé',
    summary: 'Yaourt et fromage blanc nature non sucrés peuvent compléter le lait pendant la diversification ; les produits demi-écrémés ou 0 % et le lait cru ne conviennent pas.',
    body_md: `Pendant la diversification, le lait maternel ou infantile reste l'aliment principal. Les produits laitiers viennent en complément : yaourt, fromage blanc, petit-suisse, fromage. Comment les choisir, et faut-il des produits « spécial bébé » ? Voici les repères.

## En bref
- Yaourt et fromage blanc non sucrés peuvent être proposés dès 4 à 6 mois, en complément du sein ou du biberon.
- Santé publique France indique qu'il n'est pas nécessaire d'acheter des produits laitiers « spécial bébé ».
- Les produits demi-écrémés, écrémés ou 0 % ne conviennent pas aux nourrissons.
- Le lait cru et les produits au lait cru sont à éviter.
- Les produits laitiers ne remplacent pas le lait maternel ou infantile : le professionnel vous dira comment les intégrer.

## Comprendre
Les produits laitiers font partie des allergènes majeurs que les repères recommandent de ne pas retarder. Ils apportent notamment du calcium et des protéines. Ils peuvent aussi être une solution lorsque bébé boude son biberon : les repères suggèrent alors de continuer à proposer le biberon et, s'il le refuse, de proposer des produits laitiers.

Les avis ont un peu varié sur les produits « bébé ». Les repères les plus récents de Santé publique France (Manger Bouger) indiquent qu'ils ne sont pas nécessaires : un yaourt ou un fromage blanc nature, non sucrés, conviennent. Ce qui compte : choisir des produits nature, non sucrés, non allégés, et jamais au lait cru. Si vous avez un doute, le professionnel qui suit votre enfant pourra vous conseiller.

Les produits allégés (0 %, demi-écrémés, écrémés) ne conviennent pas aux nourrissons, selon les repères : à cet âge, les matières grasses font partie des besoins de bébé.

## Au quotidien
- **Choisissez nature** : yaourt nature non allégé, fromage blanc nature, petit-suisse nature.
- **Évitez les desserts lactés sucrés** (crèmes desserts, yaourts aux fruits sucrés, liégeois) : le sucre est à proposer le plus tard possible.
- **Pour donner du goût sans sucre**, mélangez le laitage avec une compote maison ou un fruit écrasé.
- **Au goûter**, un laitage nature avec un fruit ou un morceau de pain forme un ensemble simple.
- **Lisez l'étiquette** : « nature », non allégé, pas de sucres ajoutés, pas d'édulcorants (proscrits avant 3 ans).
- **Respectez la chaîne du froid** : laitages au réfrigérateur, entamés consommés rapidement.
- **Pas de quantité imposée** : le nombre de produits laitiers par jour dépend aussi du lait que bébé boit encore ; parlez-en au professionnel.

## Questions fréquentes
**Les yaourts « bébé » sont-ils meilleurs ?**
Santé publique France indique qu'ils ne sont pas nécessaires. Un yaourt nature non sucré, non allégé, convient. Certains professionnels conseillent toutefois des laitages adaptés à cet âge : suivez l'avis de celui qui suit votre enfant.

**Mon bébé refuse le biberon depuis la diversification : les yaourts peuvent-ils le remplacer ?**
Les repères suggèrent de continuer à proposer le biberon matin et soir, et en cas de refus de proposer des produits laitiers. Parlez-en au médecin ou à la PMI pour vérifier que les apports restent suffisants.

**Le yaourt au lait de chèvre ou de brebis, c'est possible ?**
Les repères consultés ne détaillent pas ces produits. S'ils sont nature, au lait pasteurisé et non sucrés, demandez l'avis du professionnel avant de les proposer régulièrement.

**Et les yaourts au soja ou les desserts végétaux ?**
Ce ne sont pas des produits laitiers. Les boissons végétales courantes ne conviennent pas aux enfants de moins d'un an. Pour toute alimentation sans produits laitiers, un avis médical est nécessaire.

## Quand demander conseil
Consultez si des plaques, des démangeaisons, des vomissements, une diarrhée persistante ou du sang dans les selles apparaissent après un produit laitier, ou si votre bébé refuse durablement le lait. Appelez le 15 ou le 112 en cas de gêne respiratoire, de gonflement des lèvres ou du visage, ou si votre bébé devient mou ou pâle.

${END}`,
    tags: ['yaourt', 'fromage blanc', 'petit-suisse', 'produits laitiers', 'calcium', 'laitage', 'diversification'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.sante4a6, S.hcsp, S.sante6a12Rythme],
  },
  {
    ...BABY,
    slug: 'fromages-bebe-lait-cru',
    title: 'Le fromage pour bébé : lesquels choisir, lesquels éviter ?',
    summary: 'Le fromage râpé fondu peut entrer dans les purées dès 4 à 6 mois ; le lait cru et les fromages au lait cru sont à éviter, à l’exception des pâtes pressées cuites comme le comté ou le gruyère.',
    body_md: `En France, le fromage fait partie des repas. Pour un bébé, il peut parfumer une purée et apporter du calcium. Mais tous les fromages ne conviennent pas aux tout-petits, à cause du lait cru. Voici comment s'y retrouver.

## En bref
- Le fromage râpé, fondu dans les purées, peut être proposé dès 4 à 6 mois.
- Le lait cru et les fromages au lait cru sont à éviter chez le jeune enfant.
- Exception : les fromages à pâte pressée cuite comme le gruyère ou le comté.
- Un fromage au lait cru bien cuit (au four, par exemple) ne présente plus ce risque, selon l'ANSES.
- Enlever la croûte ne suffit pas : les bactéries peuvent se trouver dans tout le fromage.

## Comprendre
Les fromages au lait cru peuvent contenir des bactéries comme les salmonelles, certaines E. coli (dites entérohémorragiques), la listeria ou le staphylocoque doré. Chez un jeune enfant, une infection par une E. coli entérohémorragique peut entraîner une atteinte grave des reins. C'est pourquoi l'ANSES recommande aux jeunes enfants, comme aux femmes enceintes, aux personnes âgées et immunodéprimées, d'éviter les fromages au lait cru. Les repères de Santé publique France et du Haut Conseil de la santé publique vont dans le même sens.

Les fromages les plus concernés, selon l'ANSES : les pâtes molles à croûte fleurie (type camembert, brie), les pâtes pressées non cuites à affinage court (type reblochon, morbier, saint-nectaire), puis les pâtes molles à croûte lavée (type munster, maroilles). Les fromages à pâte pressée cuite (gruyère, comté) font exception.

Les pédiatres précisent par ailleurs que les fromages au goût fort ne sont pas interdits : ce qui compte avant tout, c'est d'éviter ceux au lait cru.

## Au quotidien
- **Regardez l'étiquette** : la mention « au lait cru » doit y figurer ; choisissez « lait pasteurisé » ou une pâte pressée cuite.
- **Fromage râpé fondu** : une pincée de gruyère ou de comté dans une purée chaude, bien mélangée.
- **Petits morceaux** : vers la fin de la première année, de fines lamelles de fromage à pâte pressée cuite peuvent être proposées à attraper, en restant à côté de bébé.
- **Plateau de fromages familial** : servez la part de bébé à part, avant de sortir les fromages au lait cru.
- **Gratins et plats cuits** : un fromage au lait cru cuit au four jusqu'à être bien chaud dans toute son épaisseur n'est plus un risque selon l'ANSES.
- **Conservation** : respectez les températures et les dates limites indiquées.
- **Rappels de produits** : consultez le site officiel Rappel Conso en cas d'alerte sur un fromage.

## Questions fréquentes
**Jusqu'à quel âge éviter les fromages au lait cru ?**
L'ANSES parle de « jeunes enfants » sans fixer d'âge précis dans sa page sur le sujet. Demandez au professionnel qui suit votre enfant à partir de quand il pourra en goûter.

**Et la raclette ou la tartiflette ?**
Selon l'ANSES, un fromage au lait cru bien cuit, chaud dans toute son épaisseur, ne présente plus ce risque. Un fromage seulement tiède ou fondu en surface n'offre pas cette garantie. Ces plats sont aussi très salés : pour bébé, une petite purée avec un peu de comté râpé fondu convient mieux.

**Mon bébé a mangé un peu de camembert au lait cru : que faire ?**
Surveillez-le dans les jours qui suivent. En cas de fièvre, de diarrhée (surtout avec du sang), de vomissements, de fatigue inhabituelle ou s'il urine moins, consultez rapidement.

**Le fromage fondu à tartiner, c'est possible ?**
Les fromages fondus sont fabriqués à partir de fromages chauffés. Ils sont souvent salés : lisez l'étiquette et proposez-les de façon occasionnelle.

## Quand demander conseil
Consultez rapidement si votre enfant a de la fièvre, des vomissements, une diarrhée ou de fortes douleurs abdominales après avoir mangé un fromage. Appelez le 15 ou le 112 en cas de diarrhée avec du sang, d'enfant très pâle, mou, très fatigué ou qui urine très peu.

${END}`,
    tags: ['fromage', 'lait cru', 'comté', 'gruyère', 'E. coli', 'listeria', 'diversification', 'sécurité alimentaire'],
    min_age_months: 4,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.ansesLaitCru, S.sante4a6, S.hcsp],
  },
  {
    ...BABY,
    slug: 'lait-de-vache-boissons-vegetales-avant-1-an',
    title: 'Lait de vache, boissons végétales : pourquoi pas avant 1 an ?',
    summary: 'Avant 1 an, seuls le lait maternel et les laits infantiles conviennent comme lait : le lait de vache, les autres laits animaux et les boissons végétales ne les remplacent pas.',
    body_md: `Lait de vache « pour faire comme les grands », boisson d'amande, d'avoine ou de soja par conviction ou par praticité : ces questions arrivent souvent pendant la diversification. Avant 1 an, les repères officiels sont clairs. Voici pourquoi, et quelles questions poser au professionnel.

## En bref
- Avant 1 an, le lait de bébé est le lait maternel ou un lait infantile (premier âge, puis deuxième âge).
- Les boissons courantes d'origine animale ou végétale ne conviennent pas aux enfants de moins d'un an et ne remplacent ni le lait maternel ni les laits infantiles.
- Le lait de vache entier n'est envisagé qu'après 1 an ; le lait demi-écrémé n'est pas recommandé ; le lait cru est à proscrire.
- Après 1 an, le lait de croissance est préféré au lait de vache jusqu'à 3 ans.
- En cas d'allergie ou d'intolérance, seul un médecin peut proposer un lait adapté.

## Comprendre
Pendant la première année, la croissance est très rapide. Le lait maternel et les préparations infantiles sont conçus pour couvrir les besoins du bébé. L'ANSES rappelle que les boissons courantes, qu'elles soient végétales (soja, amande, riz, avoine…) ou animales (lait de vache, de chèvre, de brebis…), ne sont pas adaptées et ne remplacent pas ces laits. Les pédiatres précisent que les laits de vache, de chèvre, d'ânesse, de jument et de brebis ne conviennent pas à cet âge.

Après 1 an, l'ANSES conseille de préférence le lait de croissance, et précise que le lait de vache ne couvre les besoins de l'enfant qu'à partir de 3 ans. Le Haut Conseil de la santé publique n'envisage le lait de vache entier qu'après 1 an ; le choix se fait avec le professionnel.

Si vous vous demandez si un peu de lait de vache peut être utilisé en cuisine (purée, flan) avant 1 an, posez la question au professionnel qui suit votre enfant.

## Au quotidien
- **Continuez le lait maternel ou le lait infantile** pendant toute la diversification : il reste l'aliment principal.
- **Ne remplacez pas le lait de bébé** par une boisson végétale ou un lait de vache, même pour quelques jours, sans avis médical.
- **Ne vous fiez pas à l'emballage** : une boisson végétale en brique ressemble à du lait, mais ce n'est ni un lait infantile ni un substitut adapté au nourrisson.
- **Pour les purées**, vous pouvez utiliser un peu de lait infantile ou d'eau de cuisson pour ajuster la texture.
- **En cas de doute sur une allergie** au lait de vache, parlez-en au médecin : il peut prescrire une préparation adaptée.
- **Pour une alimentation familiale végétale**, demandez un accompagnement : les repères déconseillent l'alimentation végétalienne chez le jeune enfant.

## Questions fréquentes
**Je ne peux plus allaiter et je voudrais éviter le lait animal : quelle option ?**
Le médecin peut vous orienter vers une préparation infantile adaptée. Les pédiatres évoquent, pour les nourrissons, des préparations infantiles à base d'hydrolysat de protéines de riz. Ce sont des préparations infantiles, pas des boissons de riz.

**Mon bébé de 10 mois peut-il boire un peu de lait de vache au petit-déjeuner ?**
Les repères réservent le lait de vache à l'après 1 an. Avant, proposez son lait habituel. Pour un usage ponctuel en cuisine, demandez conseil.

**Et les préparations infantiles à base de protéines végétales ?**
Elles sont très différentes des boissons végétales du commerce. Selon l'ANSES, un médecin peut en prescrire, par exemple en cas d'intolérance aux protéines de lait de vache. Ne les choisissez pas seul : parlez-en au médecin.

**Et après 1 an, faut-il passer au lait de vache ?**
Le lait de croissance est conseillé de préférence par l'ANSES. Le lait de vache entier n'est envisagé qu'après 1 an : discutez-en avec le médecin, qui tiendra compte de l'ensemble de l'alimentation de votre enfant.

## Quand demander conseil
Consultez si votre bébé refuse le lait, prend peu de poids, vomit régulièrement, a une diarrhée persistante, du sang dans les selles ou de l'eczéma qui s'aggrave. Appelez le 15 ou le 112 en cas de gêne respiratoire, de gonflement du visage, ou si votre bébé devient mou, pâle ou difficile à réveiller.

${END}`,
    tags: ['lait de vache', 'boisson végétale', 'lait d’amande', 'lait de soja', 'lait de croissance', 'lait infantile', 'avant 1 an'],
    min_age_months: 4,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.ansesNourrissons, S.hcsp, S.santeVege],
  },
  {
    ...BABY,
    slug: 'matieres-grasses-purees-bebe-huiles-beurre',
    title: 'Huile, beurre, crème : les matières grasses dans les purées de bébé',
    summary: 'Dès le début de la diversification, un peu de matière grasse crue s’ajoute aux purées : huiles de colza, de noix ou d’olive de préférence, parfois une noisette de beurre.',
    body_md: `On pense souvent à limiter le gras. Pour un bébé, c'est l'inverse : les matières grasses sont indispensables à sa croissance et au développement de son cerveau. Les repères recommandent d'en ajouter dans ses purées dès les premières cuillerées. Voici lesquelles choisir et comment.

## En bref
- Les matières grasses sont à introduire dès le début de la diversification.
- Les huiles de colza, de noix ou d'olive sont à privilégier.
- De temps en temps, une noisette de beurre cru ou un peu de crème fraîche non cuite peut remplacer l'huile.
- On les ajoute crues, dans la purée tiède, au moment de servir.
- Pour les petits pots du commerce, vérifiez l'étiquette et ajoutez-en si besoin.

## Comprendre
Le lait maternel et les laits infantiles sont riches en graisses. Quand les purées prennent une place dans les repas, elles doivent continuer à apporter ces graisses, et notamment des acides gras essentiels, que le corps ne sait pas fabriquer. Les légumes et les fruits seuls en contiennent très peu.

Les repères de Santé publique France recommandent d'ajouter de la matière grasse à chaque repas de légumes, de préférence de l'huile de colza, de noix ou d'olive, ou parfois une noisette de beurre. Le tableau du Programme national nutrition santé, repris par les pédiatres, cite aussi l'huile de soja, et indique que les huiles de tournesol, de maïs, de pépins de raisin et d'arachide ne font pas partie des huiles conseillées. Varier les huiles permet de varier les apports.

La quantité augmente progressivement avec l'âge et à mesure que la part de lait diminue. Le professionnel qui suit votre enfant vous indiquera ce qui convient.

## Au quotidien
- **Ajoutez l'huile crue** au moment de servir, dans la purée tiède : la cuisson à forte température n'est pas nécessaire.
- **Alternez** : huile de colza un jour, de noix un autre, d'olive un autre, et parfois une noisette de beurre.
- **Conservez les huiles** à l'abri de la lumière et de la chaleur, bouchon bien fermé.
- **Petits pots** : regardez si de la matière grasse est déjà présente dans la liste des ingrédients ; sinon, ajoutez-en un peu.
- **Pas de friture** pour bébé : préférez des matières grasses crues ajoutées au moment de servir.
- **Crème fraîche** : de temps en temps, non cuite, ajoutée dans la purée.

## Questions fréquentes
**Pourquoi ajouter du gras alors que bébé est déjà potelé ?**
Les matières grasses sont nécessaires pour couvrir ses besoins en énergie et en acides gras essentiels. La courbe de croissance, suivie par le médecin, permet de vérifier que tout va bien. En cas de question sur le poids, parlez-en au professionnel plutôt que de supprimer les graisses.

**L'huile d'olive suffit-elle ?**
Elle fait partie des huiles recommandées. Mais varier avec le colza ou la noix est intéressant, car ces huiles apportent des acides gras différents.

**Le beurre, c'est mauvais ?**
Non, il peut remplacer l'huile de temps en temps. Les repères conseillent simplement de privilégier les huiles végétales la plupart du temps.

**Peut-on utiliser de la margarine ?**
Les repères consultés ne la citent pas. Préférez les huiles recommandées et, parfois, le beurre.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé prend peu de poids, a des selles très grasses ou une diarrhée qui persiste, ou si vous avez des questions sur sa croissance. Appelez le 15 ou le 112 en cas de gêne respiratoire ou de gonflement du visage après un repas.

${END}`,
    tags: ['matières grasses', 'huile de colza', 'huile de noix', 'huile d’olive', 'beurre', 'purée', 'oméga-3'],
    min_age_months: 4,
    max_age_months: 36,
    sources: [S.sante4a6, S.santePnns, S.hcsp],
  },
  {
    ...BABY,
    slug: 'sel-sucre-edulcorants-bebe',
    title: 'Sel, sucre, édulcorants : ce que disent les repères pour bébé',
    summary: 'Pas de sel ajouté, le sucre le plus tard possible, pas d’édulcorants avant 3 ans : bébé découvre le vrai goût des aliments.',
    body_md: `Une purée sans sel peut sembler fade à un adulte. Pour un bébé qui découvre les aliments, c'est le vrai goût de la carotte ou de la courgette. Les repères officiels sont nets : pas de sel ajouté, le sucre le plus tard possible, pas d'édulcorants. Voici pourquoi et comment faire au quotidien.

## En bref
- Les repères recommandent d'éviter le sel ajouté dans l'alimentation du bébé, dont les reins sont encore immatures.
- Le sucre et les produits sucrés sont à proposer le plus tard possible.
- Avant 3 ans, mieux vaut éviter sirops, sodas, chocolat, biscuits et jus de fruits.
- Les édulcorants sont proscrits avant 3 ans ; le miel est à éviter avant 1 an.
- Herbes et épices douces permettent, plus tard, de donner du goût sans sel.

## Comprendre
**Le sel.** Les aliments contiennent naturellement du sel. Les reins d'un bébé sont immatures : les pédiatres conseillent donc de limiter le sel, et les repères du Haut Conseil de la santé publique recommandent d'éviter le sel ajouté. Les pédiatres soulignent aussi que les jeunes enfants consomment souvent trop de sel.

**Le sucre.** Les bébés ont une préférence naturelle pour le sucré. Le sucre ajouté renforce cette préférence et favorise les caries. C'est pourquoi Santé publique France recommande de le proposer le plus tard possible et d'éviter, avant 3 ans, sirops, sodas, chocolat, biscuits et jus de fruits. Seuls le lait et l'eau sont nécessaires comme boissons.

**Les édulcorants.** Ils sont proscrits avant 3 ans selon le Haut Conseil de la santé publique. On en trouve dans certains produits « allégés » ou « sans sucres ajoutés » : la liste des ingrédients permet de les repérer.

## Au quotidien
- **Prélevez la part de bébé avant de saler** le plat familial.
- **Pas de bouillon cube** dans les purées : il est très salé.
- **Lisez les étiquettes** : comparez la teneur en sel et en sucres des produits, et repérez les édulcorants (aspartame, sucralose, acésulfame, stévia, polyols…).
- **Desserts sans sucre** : fruit cuit mixé, banane écrasée, compote « sans sucres ajoutés ».
- **Goûter simple** : laitage nature, fruit, pain.
- **Pas de biscuit ou bonbon pour calmer** : proposez un câlin, un jeu ou de l'eau.
- **Vers la fin de la première année**, les herbes (basilic, persil, ciboulette, thym…) et certaines épices douces apportent du goût sans sel.
- **Prévenez les proches** qui gardent bébé : grands-parents, nounou.

## Questions fréquentes
**Ma purée maison n'a aucun goût : puis-je saler un tout petit peu ?**
Les repères recommandent d'éviter le sel ajouté. Votre bébé n'a pas vos habitudes de goût : il découvre la saveur propre de chaque légume. Les herbes aromatiques peuvent apporter du goût plus tard.

**Une compote « sans sucres ajoutés » contient-elle du sucre ?**
Oui, le sucre naturel du fruit. Cette mention signifie seulement qu'aucun sucre n'a été ajouté. Vérifiez qu'il n'y a pas d'édulcorant.

**Les biscuits « spécial bébé » sont-ils une exception ?**
Ils contiennent généralement du sucre. Les repères recommandent de proposer les produits sucrés le plus tard possible ; un morceau de pain est une alternative.

**Un peu de chocolat pour son premier anniversaire, c'est grave ?**
Une occasion festive n'est pas une habitude. Les repères conseillent de limiter les produits chocolatés avant 3 ans, sans en faire un interdit culpabilisant.

## Quand demander conseil
Parlez-en au médecin ou au dentiste si vous remarquez des taches sur les dents de votre enfant, ou au professionnel qui le suit si vous avez des doutes sur son alimentation. Consultez rapidement si votre bébé boit beaucoup moins, vomit, a une diarrhée ou semble très fatigué ; en cas de malaise ou d'enfant difficile à réveiller, appelez le 15 ou le 112.

${END}`,
    tags: ['sel', 'sucre', 'édulcorants', 'goût', 'biscuits', 'jus de fruits', 'caries', 'diversification'],
    min_age_months: 4,
    max_age_months: 36,
    sources: [S.hcsp, S.sante4a6, S.sante6a12Rythme],
  },
  {
    ...BABY,
    slug: 'miel-avant-1-an-botulisme-infantile',
    title: 'Pas de miel avant 1 an : comprendre le botulisme infantile',
    summary: 'Le miel peut contenir des spores de la bactérie du botulisme : l’ANSES déconseille d’en donner aux enfants de moins d’un an, même sur une tétine ou un doigt.',
    body_md: `Le miel a une image d'aliment naturel et doux. Pourtant, avant 1 an, il est déconseillé par les autorités sanitaires. La raison : une maladie rare mais grave, le botulisme infantile. Voici ce qu'il faut savoir.

## En bref
- L'ANSES déconseille de donner du miel, quelle que soit son origine, aux enfants de moins d'un an.
- Le miel peut contenir des spores de la bactérie Clostridium botulinum, responsable du botulisme infantile.
- C'est la seule source alimentaire identifiée de cette maladie chez le nourrisson.
- Ne mettez jamais de miel sur une tétine ou sur un doigt pour calmer un bébé, ni dans ses aliments ou son biberon.
- La constipation est souvent le premier signe ; une faiblesse générale peut suivre.

## Comprendre
Les spores de Clostridium botulinum sont présentes dans la poussière et certains sols. Les abeilles peuvent les transporter jusque dans le miel. Chez l'adulte, la flore intestinale empêche ces spores de se développer. Chez un bébé de moins d'un an, la flore n'est pas encore mature : les spores peuvent germer dans l'intestin et produire une toxine qui atteint le système nerveux.

L'ANSES décrit les signes du botulisme infantile : la constipation est le signe le plus précoce et le plus fréquent. Peuvent ensuite apparaître une faiblesse générale, une succion faible, de l'irritabilité, un visage moins expressif, une mauvaise tenue de la tête. Dans les formes graves, l'atteinte des muscles respiratoires provoque des difficultés à respirer, qui nécessitent une prise en charge urgente. La plupart des cas demandent une longue hospitalisation.

C'est une maladie rare. Mais comme le miel est la seule source alimentaire identifiée, l'éviter avant 1 an est une mesure simple, conforme aux recommandations de l'Organisation mondiale de la santé.

## Au quotidien
- **Pas de miel avant le premier anniversaire**, ni cru, ni « bio », ni local, ni dans une tisane.
- **Lisez la liste des ingrédients** des biscuits, céréales, yaourts ou compotes : le miel y figure parfois.
- **Pas de miel sur la tétine** ni sur le doigt pour apaiser un bébé, même en cas de coliques ou de pleurs.
- **Informez les proches** (grands-parents, assistante maternelle) : le « remède de grand-mère » au miel n'est pas adapté avant 1 an.
- **Pour sucrer ? Inutile** : les repères recommandent de toute façon de proposer le sucre le plus tard possible.
- **Après 1 an**, les pédiatres indiquent que le miel peut être introduit, comme les autres produits sucrés, avec modération.

## Questions fréquentes
**Le miel cuit dans un gâteau pose-t-il problème ?**
La page de l'ANSES déconseille le miel dans l'alimentation de l'enfant de moins d'un an sans faire d'exception pour les préparations cuites. Par prudence, évitez aussi les produits contenant du miel avant 1 an, et demandez conseil au professionnel en cas de doute.

**Mon bébé de 8 mois a goûté du miel : que faire ?**
Pas de panique : la maladie est rare. Surveillez-le dans les jours et semaines qui suivent. S'il devient constipé de façon inhabituelle, tète ou boit plus faiblement, semble mou ou tient moins bien sa tête, consultez rapidement en signalant qu'il a mangé du miel.

**Et le sirop d'érable ou d'agave ?**
L'ANSES identifie le miel comme seule source alimentaire du botulisme infantile. Ces sirops restent cependant des produits sucrés, que les repères conseillent d'éviter chez le tout-petit.

**Le miel pour la toux de bébé ?**
Avant 1 an, non. Pour une toux ou un rhume, demandez conseil au médecin ou au pharmacien.

## Quand demander conseil
Consultez rapidement si votre bébé de moins d'un an devient constipé de façon inhabituelle et semble en même temps plus faible, tète moins bien, a le visage moins expressif ou tient moins bien sa tête. Appelez immédiatement le 15 ou le 112 s'il a du mal à respirer, s'il est très mou, difficile à réveiller ou s'il a un malaise.

${END}`,
    tags: ['miel', 'botulisme', 'botulisme infantile', 'tétine', 'constipation', 'avant 1 an', 'sécurité alimentaire'],
    min_age_months: 0,
    max_age_months: 12,
    safety_critical: true,
    sources: [S.ansesMiel, S.ansesNourrissons, S.hcsp],
  },
  {
    ...BABY,
    slug: 'herbes-epices-aromates-bebe',
    title: 'Herbes, épices, ail, oignon : donner du goût sans sel',
    summary: 'Vers la fin de la première année, les herbes aromatiques et certaines épices douces permettent de varier les saveurs sans sel ; poivre et piment sont à éviter.',
    body_md: `Une purée sans sel peut paraître fade aux adultes. Les herbes et les épices douces sont une belle façon d'éveiller le goût de bébé et de l'habituer aux saveurs de la cuisine familiale, sans ajouter de sel. Voici les repères.

## En bref
- Les pédiatres encouragent, vers la fin de la première année, l'usage des herbes aromatiques : basilic, persil, ciboulette, estragon, aneth, laurier, thym, romarin.
- Certaines épices douces sont aussi proposées : muscade, cumin, coriandre.
- La vanille et la cannelle peuvent parfumer les desserts.
- Le poivre et le piment sont à éviter.
- Les herbes et épices aident à éviter le sel ajouté, que les repères déconseillent.

## Comprendre
La période de la diversification est une fenêtre favorable à la découverte des goûts. Le Haut Conseil de la santé publique souligne que l'exposition précoce et répétée aux aliments aide l'enfant à les accepter. Les herbes et épices douces élargissent encore cette palette et rapprochent les repas de bébé de ceux de la famille.

Les pédiatres (mpedia) indiquent qu'autour de 1 an, toutes les familles d'aliments sont introduites, et encouragent l'usage des herbes et de certaines épices pour remplacer le sel, sans poivre ni piment. Si vous souhaitez en proposer plus tôt, demandez conseil au professionnel qui suit votre bébé ; comme pour tout aliment, une nouveauté à la fois.

Les repères consultés ne détaillent pas l'ail, l'oignon ou l'échalote. Ce sont des légumes de la cuisine familiale qui, bien cuits et en petite quantité, peuvent parfumer un plat vers la fin de la première année ; crus, leur goût est très fort.

## Au quotidien
- **Herbes fraîches** : lavez-les, ciselez-les très finement, puis ajoutez une petite pincée dans la purée en fin de cuisson.
- **Laurier et thym** : faites-les cuire avec les légumes, puis retirez-les avant de mixer.
- **Épices douces** : une pointe de cumin dans une purée de carotte, de muscade dans une purée de pomme de terre, de cannelle dans une compote de pomme.
- **Vanille** : une gousse dans une compote ou un laitage maison, sans sucre ajouté.
- **Ail, oignon** : bien cuits, fondants, en petite quantité.
- **Évitez les mélanges tout prêts** (bouillons, assaisonnements en sachet) : ils contiennent souvent du sel.
- **Pas de poivre ni de piment**, ni de sauces relevées.
- **Prélevez la part de bébé** avant d'ajouter les épices fortes au plat familial.

## Questions fréquentes
**À partir de quand puis-je ajouter des herbes ?**
Les pédiatres en parlent surtout autour de 1 an, quand toutes les familles d'aliments sont introduites. Pour en proposer plus tôt, demandez l'avis du professionnel qui suit votre bébé.

**Le curry ou le paprika, c'est possible ?**
Les repères consultés citent la muscade, le cumin et la coriandre, et déconseillent le poivre et le piment. Certains mélanges ou paprikas peuvent être piquants : si vous en utilisez, choisissez des versions douces, en très petite quantité, et observez la réaction de votre bébé.

**Mon bébé grimace avec le persil : j'arrête ?**
Une grimace exprime souvent la surprise. Reproposez-le plus tard, en plus petite quantité, mélangé à un aliment qu'il aime. L'exposition répétée aide à l'acceptation.

**Les herbes séchées conviennent-elles ?**
Oui, elles peuvent être utilisées comme les herbes fraîches, en petite quantité. Vérifiez qu'il ne s'agit pas d'un mélange salé.

## Quand demander conseil
Parlez-en au médecin si des rougeurs, des démangeaisons, des vomissements ou une diarrhée apparaissent après une nouvelle épice ou une nouvelle herbe. Appelez le 15 ou le 112 en cas de gêne respiratoire, de gonflement des lèvres ou du visage, ou si votre bébé devient mou ou pâle.

${END}`,
    tags: ['herbes', 'épices', 'aromates', 'goût', 'sans sel', 'cumin', 'cannelle', 'ail'],
    min_age_months: 6,
    max_age_months: 18,
    sources: [S.sante6a12, S.hcsp],
  },
  {
    ...BABY,
    slug: 'textures-bebe-lisse-ecrase-morceaux',
    title: 'Du lisse aux morceaux : faire évoluer les textures de bébé',
    summary: 'Purée lisse au début, puis plus épaisse, écrasée, et petits morceaux fondants : les repères recommandent d’introduire les textures progressivement, avant 12 mois.',
    body_md: `Passer de la purée lisse aux petits morceaux est une étape importante, qui inquiète souvent les parents. Les repères officiels encouragent à ne pas trop attendre : la mastication s'apprend, et la première année est un moment favorable. Voici comment avancer pas à pas.

## En bref
- Au début de la diversification, les aliments se proposent en purées et compotes très lisses.
- Entre 6 et 12 mois, les textures évoluent : préparations plus épaisses, écrasées, puis petits morceaux fondants.
- Le Haut Conseil de la santé publique recommande une introduction progressive des textures entre 8 et 10 mois, et dans tous les cas avant 12 mois.
- Les morceaux doivent être bien cuits, tendres, de taille adaptée ; bébé est toujours assis et surveillé.
- Les aliments durs ou ronds (fruits à coque entiers, raisins entiers) restent à éviter.

## Comprendre
Manger des morceaux demande des compétences : déplacer l'aliment dans la bouche, l'écraser avec les gencives, le mâcher, l'avaler. Ces compétences se construisent en pratiquant. Les repères soulignent qu'il est préférable de les travailler pendant la première année, plutôt que de rester longtemps aux purées lisses.

Chaque bébé avance à son rythme. Certains acceptent vite les textures épaisses, d'autres ont besoin de plus de temps. Les pédiatres décrivent souvent une progression vers 9 mois : des purées moins lisses, et à côté, de petits morceaux de fruits et légumes fondants que l'enfant attrape lui-même, séparés de la purée.

Il est fréquent qu'un bébé ait un petit haut-le-cœur ou recrache en découvrant un morceau : c'est une façon de gérer une texture nouvelle. Il faut le distinguer d'une vraie fausse route, où l'enfant ne peut plus respirer, tousser ou crier.

## Au quotidien
- **Étape 1 : lisse** — purées et compotes mixées finement.
- **Étape 2 : plus épais** — mixez moins longtemps, ajoutez moins de liquide.
- **Étape 3 : écrasé** — écrasez à la fourchette des légumes et fruits bien cuits.
- **Étape 4 : petits morceaux fondants** — à côté de la purée : carotte très cuite, courgette, pomme de terre, banane, poire très mûre, pâtes bien cuites.
- **Le test de l'écrasement** : un bon morceau s'écrase facilement entre votre pouce et votre index, ou contre le palais avec la langue.
- **Toujours assis bien droit**, jamais allongé, jamais en marchant, et toujours avec un adulte à côté.
- **Laissez-le explorer avec les doigts** : toucher les aliments fait partie de l'apprentissage.
- **Mangez avec lui** : il apprend aussi en vous regardant mâcher.

## Questions fréquentes
**Mon bébé de 10 mois refuse tout ce qui n'est pas lisse : que faire ?**
Avancez par toutes petites étapes : une purée un peu moins mixée, puis un aliment fondant à attraper à côté. Ne forcez pas. Si le refus est total, s'il a des haut-le-cœur à chaque repas ou s'il approche de 12 mois sans aucune texture, parlez-en au médecin ou à la PMI.

**Faut-il attendre les dents pour donner des morceaux ?**
Les morceaux fondants s'écrasent avec les gencives. Les repères ne conditionnent pas l'introduction des textures à la poussée dentaire.

**Il a eu un haut-le-cœur avec un morceau : est-ce une fausse route ?**
Un haut-le-cœur, une toux ou un aliment recraché montrent que bébé gère le morceau. Une fausse route grave, c'est un enfant qui ne peut plus respirer, tousser, pleurer ni crier : il faut alors appeler immédiatement le 15 ou le 112.

**Les petits pots « avec morceaux » suffisent-ils ?**
Ils peuvent aider, mais les repères soulignent que le fait maison offre plus de variété de textures. Les morceaux à attraper avec les doigts restent complémentaires.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé a des haut-le-cœur ou des vomissements à chaque repas, s'il refuse toute texture à l'approche de 12 mois, s'il tousse souvent en mangeant ou s'il prend peu de poids. Si votre enfant s'étouffe et ne peut plus respirer, tousser ou crier, appelez immédiatement le 15 ou le 112. Se former aux gestes de premiers secours est une bonne idée pour tous les parents.

${END}`,
    tags: ['textures', 'morceaux', 'purée', 'mastication', 'haut-le-cœur', 'diversification', '8-10 mois'],
    min_age_months: 4,
    max_age_months: 12,
    sources: [S.hcsp, S.santeDiversif, S.sante6a12],
  },
  {
    ...BABY,
    slug: 'bebe-mange-avec-les-doigts-autonomie',
    title: 'Manger avec les doigts : encourager l’autonomie de bébé à table',
    summary: 'Toucher, attraper, porter à la bouche : manger avec les doigts fait partie de la découverte des aliments, en toute sécurité si bébé est assis, surveillé et que les morceaux sont adaptés.',
    body_md: `Vers le milieu de la première année, beaucoup de bébés veulent attraper ce qui est dans l'assiette. C'est salissant, parfois déroutant, mais c'est une étape riche. Les repères encouragent à laisser bébé explorer les aliments avec ses mains. Voici comment l'accompagner.

## En bref
- Les repères conseillent de laisser les doigts de bébé libres d'explorer les aliments.
- Les pédiatres proposent des aliments à manger avec les mains, souvent entre 6 et 9 mois, séparés de la purée donnée à la cuillère.
- Les morceaux sont bien cuits, tendres, de taille adaptée à sa main.
- Bébé est toujours assis bien droit et surveillé par un adulte.
- Certaines familles pratiquent la diversification menée par l'enfant (DME) : parlez-en au professionnel qui suit votre bébé.

## Comprendre
Manger, ce n'est pas seulement avaler. C'est aussi toucher, sentir, observer, jouer avec la texture. Quand bébé attrape un morceau de carotte cuite, il découvre sa forme, sa couleur, sa consistance, et entraîne sa coordination entre la main et la bouche.

Santé publique France invite à laisser les doigts libres pendant les repas. Les pédiatres (mpedia) proposent, entre 6 et 9 mois, des aliments à manger avec les mains, en séparant bien les aliments mixés, donnés à la cuillère, des petits morceaux que l'enfant porte seul à la bouche.

La diversification menée par l'enfant (DME) est une approche où le bébé se nourrit surtout seul, avec des morceaux adaptés, dès le début. Les sources officielles consultées ne la détaillent pas. Si elle vous intéresse, parlez-en au médecin ou à la PMI, qui pourront vous conseiller selon le développement de votre bébé et vous rappeler les règles de sécurité.

## Au quotidien
- **Bâtonnets fondants** : carotte, courgette, patate douce ou brocoli bien cuits, coupés en bâtonnets que bébé peut tenir dans son poing.
- **Fruits très mûrs** : banane, poire, pêche, avocat, en morceaux tendres.
- **Féculents** : grosses pâtes bien cuites, pomme de terre cuite, morceau de pain.
- **Le test de l'écrasement** : le morceau doit s'écraser facilement entre vos doigts.
- **Assis bien droit** dans une chaise haute adaptée, jamais allongé ni en mouvement.
- **Restez à côté** pendant tout le repas, sans écran.
- **Protégez plutôt que de limiter** : un bavoir couvrant, un tapis sous la chaise, et acceptez que ce soit salissant.
- **Laissez-le décider** de ce qu'il porte à sa bouche et de la quantité ; il peut aussi recevoir une purée à la cuillère en parallèle.

## Questions fréquentes
**Il joue avec la nourriture plus qu'il ne mange : est-ce un problème ?**
Explorer fait partie de l'apprentissage. Le lait reste son aliment principal la première année. Si vous avez un doute sur ses apports ou sa croissance, parlez-en au professionnel qui le suit.

**Quels aliments éviter en morceaux ?**
Les aliments durs ou ronds : fruits à coque et cacahuètes entiers, raisins entiers, tomates cerises entières, carotte crue dure, pomme crue dure, bonbons, gros morceaux fermes. Coupez, écrasez ou faites cuire.

**Il a des haut-le-cœur avec les morceaux : faut-il arrêter ?**
Un haut-le-cœur ou un aliment recraché montre que bébé gère le morceau. Revenez à des morceaux plus tendres ou plus petits. En revanche, s'il ne peut plus respirer, tousser ou crier, appelez le 15 ou le 112.

**Puis-je lui donner une cuillère ?**
Oui, laissez-le manipuler une petite cuillère adaptée pendant que vous l'aidez avec une autre. C'est un premier pas vers l'autonomie.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne s'intéresse pas du tout aux aliments à l'approche de 12 mois, s'il a des haut-le-cœur ou vomit à chaque repas, ou s'il prend peu de poids. Si votre enfant s'étouffe et ne peut plus respirer, tousser ou crier, appelez immédiatement le 15 ou le 112.

${END}`,
    tags: ['manger avec les doigts', 'autonomie', 'DME', 'morceaux', 'finger food', 'chaise haute', 'diversification'],
    min_age_months: 6,
    max_age_months: 18,
    sources: [S.sante4a6, S.sante6a12Rythme, S.santeDiversif],
  },
  {
    ...BABY,
    slug: 'aliments-risque-etouffement-bebe',
    title: 'Aliments à risque d’étouffement : lesquels et comment les préparer',
    summary: 'Fruits à coque et cacahuètes entiers, raisins entiers, carotte crue dure, bonbons : certains aliments durs ou ronds exposent les tout-petits aux fausses routes.',
    body_md: `Un grain de raisin, une cacahuète, un morceau de carotte crue : ces aliments ordinaires peuvent bloquer les voies respiratoires d'un tout-petit. Connaître les aliments à risque et la bonne façon de les préparer aide à prévenir ces accidents.

## En bref
- Les aliments durs ou ronds exposent au risque d'étouffement : fruits à coque et cacahuètes entiers, raisins entiers, carotte crue dure, bonbons durs, gros morceaux fermes.
- Une cacahuète ou un fruit à coque ne se donne jamais entier à un tout-petit : on utilise une pâte lisse ou une poudre fine.
- Les aliments sont bien cuits, tendres, coupés en morceaux adaptés à l'âge.
- Bébé mange toujours assis bien droit et surveillé, jamais allongé ni en marchant.
- Si l'enfant ne peut plus respirer, tousser ou crier : appelez immédiatement le 15 ou le 112.

## Comprendre
Les voies respiratoires d'un jeune enfant sont étroites, et la mastication s'apprend progressivement. Un aliment rond et ferme, de la taille d'un raisin ou d'une cacahuète, peut glisser dans la gorge et bloquer le passage de l'air. C'est pourquoi les repères du Haut Conseil de la santé publique et des pédiatres listent ces aliments à éviter sous leur forme entière.

Les fruits à coque et l'arachide sont aussi des allergènes que les repères recommandent de ne pas retarder. Il ne s'agit donc pas de les supprimer, mais de les proposer sous une forme adaptée : pâte lisse (purée de cacahuète, de noisette, d'amande), poudre très fine mélangée à une purée.

Les conditions du repas comptent autant que l'aliment : un enfant assis, calme, surveillé, qui ne court pas et ne rit pas la bouche pleine, est mieux protégé.

## Au quotidien
- **Raisins, tomates cerises et autres petits fruits ronds** : coupez-les en quatre dans la longueur.
- **Fruits à noyau** (cerises, prunes) : retirez le noyau et coupez en petits morceaux.
- **Carotte, pomme** : cuites et fondantes, ou râpées finement, jamais en gros morceaux crus durs.
- **Cacahuètes, noix, noisettes, amandes** : uniquement en pâte lisse ou en poudre fine.
- **Pas de bonbons, de pop-corn, de chips**, ni de petits apéritifs durs.
- **Assis, attaché dans sa chaise**, avec un adulte à côté, sans écran et sans jeux pendant le repas.
- **Attention aux aînés** : ils peuvent donner un aliment dangereux au petit sans le savoir.
- **Formez-vous** aux gestes de premiers secours chez le nourrisson et l'enfant.

## Questions fréquentes
**À partir de quel âge peut-il manger des raisins entiers ?**
Les repères consultés ne fixent pas d'âge précis. Pour les jeunes enfants, coupez-les. Demandez conseil au professionnel qui suit votre enfant.

**Quelle différence entre haut-le-cœur et étouffement ?**
Lors d'un haut-le-cœur, bébé tousse, grimace, recrache : il gère l'aliment. Lors d'un étouffement, il ne peut plus respirer, tousser, pleurer ni crier, il peut devenir bleu ou s'agiter sans bruit : c'est une urgence vitale.

**Les gâteaux apéritifs « pour bébé » sont-ils adaptés ?**
Certains biscuits fondent dans la bouche, d'autres sont durs. Restez à côté de lui et privilégiez des aliments simples et fondants. Vérifiez aussi la teneur en sel et en sucre.

**Faut-il éviter complètement les fruits à coque ?**
Non, ce sont des allergènes à ne pas retarder. Proposez-les en pâte lisse ou en poudre fine, en petite quantité, mélangés à une purée.

## Quand demander conseil
Si votre enfant s'étouffe et ne peut plus respirer, tousser ou crier, appelez immédiatement le 15 ou le 112 et suivez les consignes du régulateur. Même si l'aliment a été expulsé, consultez rapidement si votre enfant continue de tousser, a une respiration sifflante ou bruyante, ou semble gêné pour respirer dans les heures ou jours qui suivent.

${END}`,
    tags: ['étouffement', 'fausse route', 'raisins', 'cacahuète', 'fruits à coque', 'sécurité', 'morceaux'],
    min_age_months: 4,
    max_age_months: 36,
    safety_critical: true,
    sources: [S.hcsp, S.santeDiversif, S.sante4a6],
  },
  {
    ...BABY,
    slug: 'journee-repas-bebe-6-12-mois-rythme',
    title: 'Une journée de repas entre 6 et 12 mois : rythme et repères',
    summary: 'Dès 6-8 mois, la journée s’organise souvent en quatre repas, sans grignotage, avec le lait toujours présent ; les quantités suivent l’appétit de bébé et l’avis du professionnel.',
    body_md: `Entre 6 et 12 mois, les repas de bébé ressemblent de plus en plus à ceux de la famille. Comment organiser la journée ? Combien de repas ? Quelle place pour le lait ? Voici des repères généraux, à adapter avec le professionnel qui suit votre enfant, sans quantités imposées.

## En bref
- Dès 6-8 mois, les repères décrivent quatre repas par jour : petit-déjeuner, déjeuner, goûter, dîner.
- Pas de grignotage entre les repas.
- Le lait maternel ou infantile reste présent tout au long de la première année ; l'allaitement peut continuer à la demande.
- Les quantités ne sont pas fixes : l'appétit varie d'un enfant à l'autre et d'un jour à l'autre.
- Le professionnel qui suit votre enfant vous aide à ajuster, en s'appuyant sur sa courbe de croissance.

## Comprendre
Au début de la diversification, un seul repas comporte des aliments autres que le lait, souvent le midi ou le soir, avec un fruit au goûter. Puis, au fil des semaines, les repas se structurent. Les pédiatres décrivent qu'autour de 6 mois une tétée ou un biberon, souvent celui du midi, laisse progressivement la place à un repas diversifié. Le lait peut rester en dessert si bébé en a encore besoin.

Les repères ne donnent pas un menu unique. Ils encouragent la variété : légumes, fruits, féculents, un peu de viande, de poisson ou d'œuf, produits laitiers, matières grasses ajoutées. Ils insistent sur l'écoute des signaux de bébé : il montre sa faim en ouvrant la bouche, en se penchant vers la cuillère, et sa satiété en détournant la tête, en fermant la bouche, en repoussant la cuillère ou en se désintéressant du repas.

Un appétit plus faible lors d'une poussée dentaire ou d'un petit virus est fréquent ; ce qui compte, c'est que la croissance et l'énergie de bébé restent bonnes, ce que vérifie le professionnel.

## Au quotidien
Voici une organisation possible, à titre d'exemple, sans quantités :
- **Matin** : tétée ou biberon de lait infantile.
- **Midi** : purée de légumes avec un féculent, une petite part de viande, de poisson ou d'œuf, un filet d'huile ; puis un fruit ou un laitage, ou le lait.
- **Goûter** : laitage nature et fruit, ou lait, avec un morceau de pain quand il mange avec les doigts.
- **Soir** : légumes et féculent, ou soupe épaisse, avec un laitage ou une compote ; puis tétée ou biberon.
- **Horaires réguliers** : ils aident bébé à trouver son rythme.
- **Repas en famille** quand c'est possible, sans écran, dans le calme.
- **Pas d'obligation de finir** l'assiette ou le biberon.

## Questions fréquentes
**Combien doit-il manger à chaque repas ?**
Il n'existe pas de quantité idéale unique. L'application ne fixe pas de quantité : votre bébé régule lui-même, et le professionnel qui suit sa croissance vous indiquera si un ajustement est utile.

**Peut-il dîner avec nous plus tard le soir ?**
Les repères insistent sur des horaires réguliers et sur le plaisir des repas en famille. Trouvez l'organisation qui respecte à la fois le sommeil de bébé et votre vie de famille.

**Il réclame entre les repas : que faire ?**
Les repères conseillent d'éviter le grignotage. S'il a faim, il est possible d'ajuster l'heure ou le contenu des repas. Un bébé allaité peut continuer à téter à la demande.

**Faut-il supprimer le biberon du midi à 6 mois ?**
Ce passage se fait progressivement, selon l'appétit et le rythme de bébé. Le lait peut être conservé en dessert s'il en a besoin. Demandez conseil au professionnel.

## Quand demander conseil
Consultez entre deux rendez-vous si votre bébé refuse plusieurs repas d'affilée, boit moins, mouille moins ses couches, vomit souvent, ou si vous avez un doute sur sa croissance. En cas de malaise, de bébé très mou ou difficile à réveiller, appelez le 15 ou le 112.

${END}`,
    tags: ['rythme des repas', 'menu bébé', '6 mois', '9 mois', 'quatre repas', 'goûter', 'organisation'],
    min_age_months: 6,
    max_age_months: 12,
    sources: [S.santeToutSavoir, S.santeDiversif, S.sante6a12],
  },
  {
    ...BABY,
    slug: 'bebe-refuse-un-aliment-diversification',
    title: 'Bébé refuse un aliment : patience, exposition et plaisir',
    summary: 'Un aliment refusé peut être accepté après plusieurs présentations : les repères conseillent de le reproposer, jusqu’à une dizaine de fois, sans jamais forcer.',
    body_md: `Il recrache les épinards, ferme la bouche devant le brocoli, pleure à la vue de la cuillère : les refus font partie de la diversification. Ils sont souvent passagers. Voici ce que disent les repères et comment traverser ces moments sans tension.

## En bref
- Un aliment peut devoir être proposé plusieurs fois, parfois jusqu'à 8 à 10 fois, avant d'être accepté.
- Il ne faut jamais forcer un enfant à manger ou à finir son assiette.
- La période entre 5 et 18 mois est particulièrement favorable à la découverte des goûts.
- Il est utile de distinguer une simple méfiance d'un vrai dégoût.
- Un refus total et durable, ou des difficultés qui inquiètent, justifient d'en parler au professionnel.

## Comprendre
Accepter un aliment nouveau est un apprentissage. Le Haut Conseil de la santé publique recommande d'exposer l'enfant tôt et de façon répétée aux aliments peu appréciés, et souligne que la période de 5 à 18 mois est favorable. Santé publique France conseille, face à un refus, de rassurer l'enfant et de reproposer l'aliment quelques jours plus tard, parfois jusqu'à 10 fois.

Un refus peut avoir plusieurs causes : un goût nouveau, une texture surprenante, la fatigue, une poussée dentaire, un petit rhume, ou simplement l'absence de faim. Les repères rappellent aussi de tenir compte de l'humeur de l'enfant… et de celle du parent : un repas tendu n'aide personne.

Les repères déconseillent de forcer l'enfant ou de l'obliger à finir son assiette. Faire confiance à son appétit, qui varie d'un jour à l'autre, est l'un des fondements des recommandations actuelles.

## Au quotidien
- **Reproposez sans insister** : une ou deux cuillerées, quelques jours plus tard.
- **Changez la présentation** : purée, puis écrasé, puis morceaux fondants ; mélangé à un aliment aimé, puis seul.
- **Mangez le même aliment** devant lui, avec plaisir : il apprend en imitant.
- **Laissez-le toucher** l'aliment avec ses doigts, le sentir, jouer un peu.
- **Petites quantités** dans l'assiette : une grande portion peut décourager.
- **Repas calmes**, sans écran ni jouet, à heures régulières.
- **Pas de récompense ni de punition** autour de la nourriture.
- **Arrêtez le repas** quand il montre qu'il n'a plus faim : il détourne la tête, ferme la bouche, repousse la cuillère.

## Questions fréquentes
**Il refuse tous les légumes verts : va-t-il manquer de quelque chose ?**
Continuez à les proposer régulièrement sous différentes formes, et misez sur la variété des autres aliments. Si vous avez un doute sur ses apports ou sa croissance, parlez-en au médecin ou à la PMI.

**Puis-je cacher les légumes dans une purée qu'il aime ?**
Mélanger peut aider, mais les repères insistent sur la découverte du goût de chaque aliment. Alternez : parfois mélangé, parfois seul, pour qu'il apprenne à le reconnaître.

**Il mangeait de tout et refuse maintenant : pourquoi ?**
L'appétit varie selon la fatigue, les dents, les petites maladies, ou les étapes du développement. Si sa croissance et son énergie restent bonnes, continuez à proposer sans pression ; en cas de doute, consultez.

**Comment distinguer méfiance et dégoût ?**
La méfiance se manifeste par des hésitations, une grimace, un aliment recraché, qui s'atténuent au fil des présentations. Un dégoût marqué et persistant, avec des haut-le-cœur ou des vomissements répétés, mérite d'en parler au professionnel.

## Quand demander conseil
Consultez si votre bébé refuse presque tout, vomit ou a des haut-le-cœur à chaque repas, perd du poids ou ne grossit plus, boit moins, ou si les repas deviennent une source de grande inquiétude pour vous. Si vous vous sentez épuisé ou très anxieux, parlez-en aussi : en cas de détresse, le 3114 est joignable à tout moment. En cas de bébé mou, très pâle ou difficile à réveiller, appelez le 15 ou le 112.

${END}`,
    tags: ['refus alimentaire', 'néophobie', 'goûts', 'il ne mange pas', 'légumes', 'diversification', 'patience'],
    min_age_months: 4,
    max_age_months: 18,
    sources: [S.hcsp, S.santeToutSavoir, S.sante4a6],
  },
  {
    ...BABY,
    slug: 'purees-maison-hygiene-conservation-bebe',
    title: 'Purées maison : préparer, conserver et réchauffer en sécurité',
    summary: 'Mains lavées, aliments bien cuits, pas plus de 2 heures à température ambiante, repas de bébé conservés au maximum 48 heures à 4 °C : les bons gestes d’hygiène.',
    body_md: `Préparer soi-même les purées de bébé permet de varier les goûts et les textures. Comme son système immunitaire est encore immature, quelques règles d'hygiène simples protègent votre enfant des infections alimentaires. Voici les gestes recommandés par l'ANSES.

## En bref
- Lavez-vous les mains à l'eau et au savon avant et pendant la préparation des repas.
- Ne laissez pas les aliments plus de 2 heures à température ambiante avant de les mettre au réfrigérateur.
- Réglez la zone la plus froide du réfrigérateur à 4 °C.
- L'ANSES recommande de ne pas conserver les repas des nourrissons plus de 48 heures à 4 °C.
- Ne réchauffez pas un plat dans sa barquette en plastique : transvasez-le dans une assiette ou une casserole.

## Comprendre
Les enfants de moins d'un an sont plus sensibles aux infections, car leur système immunitaire n'est pas encore mature. Une purée préparée avec soin, puis mal conservée, peut voir des bactéries se multiplier. Les recommandations de l'ANSES visent à limiter ce risque à chaque étape : préparation, cuisson, refroidissement, conservation, réchauffage.

La cuisson compte aussi : la viande hachée doit être bien cuite à cœur pour les jeunes enfants, et les viandes ou poissons crus, comme les produits au lait cru, sont fortement déconseillés (sauf fromages à pâte pressée cuite).

Préparer à l'avance est pratique, à condition de respecter les durées et les températures.

## Au quotidien
- **Mains** : lavez-les avant de cuisiner, après avoir touché de la viande, du poisson, des œufs crus ou des légumes terreux, et après avoir changé une couche.
- **Planches séparées** : une pour les viandes et poissons crus, une autre pour les aliments cuits et les légumes propres.
- **Légumes et fruits** : lavez-les soigneusement, épluchez si besoin.
- **Refroidissez vite** : répartissez la purée dans de petits récipients propres et fermés, et mettez-les au réfrigérateur sans attendre plus de 2 heures.
- **Étiquetez** les récipients avec la date de préparation.
- **Ne resservez pas un reste entamé** : la cuillère passée dans la bouche de bébé apporte des microbes ; servez une petite portion dans un bol à part et gardez le reste au frais.
- **Réchauffez** dans une casserole ou une assiette adaptée, mélangez bien, et vérifiez la température avant de servir.
- **En cas de gastro-entérite**, évitez de cuisiner si quelqu'un d'autre peut le faire ; sinon, renforcez le lavage des mains.
- **Nettoyez le réfrigérateur** régulièrement, et au moins une fois par an à fond.

## Questions fréquentes
**Combien de temps garder une purée maison au réfrigérateur ?**
L'ANSES recommande de ne pas conserver les repas des nourrissons plus de 48 heures à 4 °C. Au-delà, mieux vaut les jeter.

**Puis-je congeler les purées ?**
La congélation est une façon courante de préparer à l'avance. Les pages consultées ne détaillent pas ses règles : suivez les consignes de votre appareil, congelez rapidement après refroidissement, et demandez conseil à la PMI si besoin.

**Peut-on réchauffer deux fois ?**
Réchauffez seulement la portion que bébé va manger. Un plat réchauffé puis laissé à température ambiante ne devrait pas être conservé.

**Le micro-ondes est-il adapté ?**
Il chauffe de façon irrégulière et peut créer des points très chauds. Si vous l'utilisez, mélangez bien et vérifiez la température de toute la purée avant de servir.

## Quand demander conseil
Consultez rapidement si votre bébé a de la fièvre, des vomissements ou une diarrhée, surtout s'il boit moins, mouille moins ses couches ou semble très fatigué. Appelez le 15 ou le 112 en cas de diarrhée avec du sang, de bébé mou, très pâle ou difficile à réveiller.

${END}`,
    tags: ['purée maison', 'hygiène', 'conservation', 'réfrigérateur', 'réchauffer', 'restes', 'sécurité alimentaire'],
    min_age_months: 4,
    max_age_months: 24,
    sources: [S.ansesHygiene, S.ansesNourrissons, S.sante4a6],
  },
  {
    ...BABY,
    slug: 'petits-pots-ou-fait-maison-diversification',
    title: 'Petits pots ou fait maison : comment combiner pendant la diversification ?',
    summary: 'Les petits pots sont pratiques et encadrés par une réglementation spécifique ; le fait maison offre plus de variété de goûts et de textures : les deux peuvent se combiner.',
    body_md: `Faut-il tout cuisiner soi-même ? Les petits pots sont-ils moins bons ? Il n'y a pas de bonne ou de mauvaise réponse : les repères officiels reconnaissent les avantages de chacun. Voici comment choisir selon votre quotidien.

## En bref
- Les petits pots et plats préparés pour bébé sont pratiques.
- Les produits spécifiques aux moins de 3 ans sont soumis à des règles qui limitent les pesticides et les additifs.
- Le fait maison offre plus de variété de goûts et de textures, ce que les repères encouragent.
- Pour les petits pots, vérifiez l'étiquette et ajoutez une petite quantité de matière grasse si elle n'est pas présente.
- Ne réchauffez pas un plat dans sa barquette en plastique.

## Comprendre
Santé publique France reconnaît que les petits pots et plats préparés pour bébé sont pratiques, mais souligne qu'ils sont moins variés que le fait maison, en goûts comme en textures. Or la diversité des saveurs et le passage progressif aux morceaux sont des objectifs importants de la première année. Le Haut Conseil de la santé publique encourage à privilégier les préparations maison.

Les aliments spécifiquement destinés aux enfants de moins de 3 ans sont encadrés par une réglementation plus stricte, notamment sur les résidus de pesticides et les additifs. Les pédiatres mentionnent les petits pots, les gourdes et les plats surgelés pour bébé parmi les options réglementées, à côté du fait maison, de préférence avec des produits de saison.

Beaucoup de familles combinent : fait maison quand le temps le permet, petits pots pour dépanner, en voyage ou à la crèche.

## Au quotidien
- **Lisez la liste des ingrédients** : un plat simple, avec peu d'ingrédients, sans sucres ajoutés ni sel ajouté.
- **Vérifiez l'âge indiqué** sur l'emballage, adapté à la texture du moment.
- **Matière grasse** : si l'étiquette n'en mentionne pas, ajoutez un peu d'huile de colza, de noix ou d'olive au moment de servir.
- **Réchauffage** : transvasez dans une assiette ou une casserole, mélangez, vérifiez la température.
- **Une fois ouvert**, servez une portion à part et conservez le reste au réfrigérateur selon les indications de l'emballage.
- **Gourdes** : vous pouvez verser le contenu dans une cuillère plutôt que de le faire téter directement, pour que bébé continue d'apprendre à manger à la cuillère.
- **Alternez** avec des légumes simples cuits à la maison, même en petites quantités, pour varier les textures.
- **Rappels de produits** : en cas d'alerte, consultez le site officiel Rappel Conso.

## Questions fréquentes
**Les petits pots sont-ils moins sains ?**
Ils sont encadrés par une réglementation spécifique et peuvent tout à fait faire partie de l'alimentation de bébé. Leur limite principale, selon les repères, est la moindre variété de goûts et de textures.

**Le fait maison prend trop de temps : comment simplifier ?**
Préparez une purée de légumes de saison en plus grande quantité et conservez-la en respectant les règles d'hygiène, ou prélevez la part de bébé du plat familial avant de saler.

**Les produits bio sont-ils indispensables ?**
Les repères n'en font pas une obligation. Les pédiatres évoquent une préférence pour le bio et les circuits courts quand c'est possible ; les produits spécifiques pour bébé limitent déjà les pesticides.

**Mon bébé n'aime que les petits pots : que faire ?**
Proposez des légumes faits maison proches des goûts qu'il connaît, mélangez parfois un petit pot avec une purée maison, et reproposez régulièrement. Sans pression.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé refuse durablement les textures plus épaisses, vomit souvent, ou si vous avez un doute sur son alimentation. Consultez rapidement en cas de fièvre, vomissements ou diarrhée importante ; appelez le 15 ou le 112 si votre bébé est mou, très pâle ou a du mal à respirer.

${END}`,
    tags: ['petits pots', 'fait maison', 'plats préparés', 'gourdes', 'étiquette', 'bio', 'diversification'],
    min_age_months: 4,
    max_age_months: 24,
    sources: [S.sante4a6, S.hcsp, S.sante6a12],
  },
  {
    ...BABY,
    slug: 'diversification-vegetarienne-bebe',
    title: 'Diversification végétarienne : ce qu’il faut savoir',
    summary: 'Une alimentation végétarienne avec œufs et produits laitiers peut convenir à un bébé si elle est variée et suivie ; l’alimentation végétalienne est déconseillée chez le jeune enfant.',
    body_md: `De plus en plus de familles mangent peu ou pas de viande. Peut-on diversifier un bébé sans viande ni poisson ? Les pédiatres distinguent clairement l'alimentation végétarienne et l'alimentation végétalienne. Voici les repères, et pourquoi un suivi médical est recommandé.

## En bref
- Une alimentation végétarienne (sans viande ni poisson, mais avec œufs et produits laitiers) peut convenir à un enfant si elle est variée et équilibrée.
- Elle demande une vigilance particulière sur le fer ; un complément peut parfois être prescrit par le médecin.
- L'alimentation végétalienne expose à des carences (protéines, vitamine B12, fer, calcium, zinc, iode, vitamine D, oméga-3) : elle est déconseillée chez l'enfant, surtout avant 3 ans.
- Les boissons végétales ne conviennent pas aux jeunes enfants.
- Quel que soit le régime, un suivi médical et nutritionnel personnalisé est recommandé.

## Comprendre
Les pédiatres (mpedia) indiquent qu'un régime végétarien peut convenir à l'enfant s'il reste varié et conserve œufs et produits laitiers. Le point d'attention principal est le fer : les sources végétales de fer sont moins bien absorbées. Associer ces aliments à de la vitamine C (fruits, légumes) et faire tremper les légumineuses aide à en tirer davantage.

Le régime végétalien, qui exclut aussi œufs et produits laitiers, expose à de nombreuses carences. Il est déconseillé chez l'enfant, surtout avant 3 ans, et nécessite, s'il est choisi, un suivi médical strict. Le régime macrobiotique est fortement déconseillé chez l'enfant.

Un bébé allaité par une mère végétalienne n'est pas lui-même végétalien : le lait maternel couvre ses besoins. La mère végétalienne doit, elle, anticiper une supplémentation, notamment en vitamine B12, comme le rappelle aussi l'ANSES.

## Au quotidien
- **Parlez de votre choix** au médecin ou à la PMI dès le début de la diversification.
- **Œufs bien cuits** et **produits laitiers nature** (yaourt, fromage blanc, fromage à pâte pressée cuite) trouvent leur place.
- **Légumineuses** : lentilles, pois chiches, haricots, trempés puis bien cuits, mixés au début.
- **Associez légumineuses et céréales** (lentilles et riz, pois chiches et semoule) pour varier les sources de protéines.
- **Ajoutez un fruit ou un légume riche en vitamine C** au repas.
- **Tofu** : le calcium peut aussi venir d'un tofu au sel de calcium ; proposez-le bien cuit, écrasé ou en petits morceaux tendres.
- **Matières grasses** : huiles de colza ou de noix, intéressantes pour les oméga-3.
- **Pas de complément sans avis médical** : vitamine B12, vitamine D ou fer se discutent avec le médecin.
- **Limitez les produits ultra-transformés** « végétariens » souvent riches en sel.

## Questions fréquentes
**Mon bébé aura-t-il assez de fer sans viande ?**
C'est le principal point de vigilance. Variez les sources végétales de fer et associez-les à de la vitamine C. Le médecin peut proposer un complément si nécessaire : ne le donnez pas de vous-même.

**Puis-je remplacer le lait infantile par une boisson végétale ?**
Non. Avant 1 an, seuls le lait maternel et les préparations infantiles conviennent. Les pédiatres évoquent, pour les nourrissons non allaités dont les parents souhaitent éviter les protéines animales, des préparations infantiles à base d'hydrolysat de protéines de riz, sur avis médical.

**Et à la crèche ?**
Discutez avec l'équipe. Les pédiatres rappellent qu'un choix alimentaire familial ne justifie pas à lui seul un projet d'accueil individualisé (PAI) ; le dialogue avec l'établissement reste essentiel.

**Le poisson est-il indispensable ?**
Il apporte des oméga-3 et des protéines. Si votre famille n'en mange pas, parlez-en au médecin pour trouver comment couvrir ces besoins.

## Quand demander conseil
Consultez si votre bébé prend peu de poids, semble pâle, fatigué, moins tonique, ou si vous envisagez une alimentation végétalienne. Un suivi régulier de la croissance est recommandé. En cas de bébé très mou, difficile à réveiller ou qui a du mal à respirer, appelez le 15 ou le 112.

${END}`,
    tags: ['végétarien', 'végétalien', 'vegan', 'fer', 'vitamine B12', 'légumineuses', 'diversification'],
    min_age_months: 4,
    max_age_months: 36,
    sources: [S.santeVege, S.ansesNourrissons, S.hcsp],
  },
];
