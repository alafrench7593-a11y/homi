/** Guide complet — lot 06 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  santeAplv: { label: 'Santé.fr — Allergie aux protéines du lait de vache', url: 'https://sante.fr/allergie-aux-proteines-du-lait-de-vache', consulted_on: C, published: '2026-08-13' },
  mpediaAplv: { label: 'mpedia.fr (AFPA) — APLV : l’allergie aux protéines du lait de vache', url: 'https://www.mpedia.fr/art-aplv-allergie-proteines-lait-vache/', consulted_on: C, published: '2021-05-25' },
  mpediaPrevention: { label: 'mpedia.fr (AFPA) — Prévenir les allergies de mon bébé', url: 'https://www.mpedia.fr/art-prevention-des-allergies/', consulted_on: C, published: '2020-08-27' },
  mpediaAllaitement: { label: 'mpedia.fr (AFPA) — Allaitement : faut-il suivre un régime particulier ?', url: 'https://www.mpedia.fr/art-allaitement-et-alimentation/', consulted_on: C, published: '2019-09-13' },
  mpediaEczema: { label: 'mpedia.fr (AFPA) — Eczéma du bébé : que faire ?', url: 'https://www.mpedia.fr/art-eczema-bebe/', consulted_on: C, published: '2024-05-07' },
  mpediaGluten: { label: 'mpedia.fr (AFPA) — Gluten : faut-il l’éviter ? (maladie cœliaque)', url: 'https://www.mpedia.fr/art-gluten-recommandations/', consulted_on: C, published: '2021-02-25' },
  santePrevenir: { label: 'Santé.fr (contenu mpedia) — Prévenir les allergies de mon bébé', url: 'https://www.sante.fr/prevenir-les-allergies-de-mon-bebe', consulted_on: C },
  santeAllergie: { label: 'Santé.fr — Allergie alimentaire', url: 'https://www.sante.fr/allergie-alimentaire-0', consulted_on: C, published: '2026-08-13' },
  santeAllergenes: { label: 'Santé.fr (DGCCRF) — Allergènes alimentaires', url: 'https://www.sante.fr/allergenes-alimentaires', consulted_on: C, published: '2019-06-11' },
  santeIntolerance: { label: 'Santé.fr — Gluten, lactose… qu’est-ce qu’une intolérance alimentaire ?', url: 'https://www.sante.fr/gluten-lactose-etc-quest-ce-quune-intolerance-alimentaire', consulted_on: C, published: '2026-08-13' },
  santeDiversif: { label: 'Santé.fr (contenu mpedia) — Diversification alimentaire du bébé : le guide complet', url: 'https://www.sante.fr/commencer-la-diversification', consulted_on: C, published: '2026-09-21' },
  brochureDiversif: { label: '1000 premiers jours (Santé publique France) — Le petit guide de la diversification alimentaire', url: 'https://www.1000-premiers-jours.fr/sites/default/files/2021-09/Brochure%20diversification%20alimentaire.pdf', consulted_on: C },
  ameliAllergieDef: { label: 'ameli.fr — Allergie alimentaire : définition et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/allergie-alimentaire/definition-symptomes', consulted_on: C, published: '2025-06-27' },
  ameliAllergieConsult: { label: 'ameli.fr — Allergie alimentaire : la consultation médicale et les mesures au quotidien', url: 'https://www.ameli.fr/assure/sante/themes/allergie-alimentaire/que-faire-consultation-medicale', consulted_on: C, published: '2025-02-26' },
  ameliAllergieTrait: { label: 'ameli.fr — Allergie alimentaire : traitement et prévention', url: 'https://www.ameli.fr/assure/sante/themes/allergie-alimentaire/traitement-prevention', consulted_on: C, published: '2020-12-09' },
  ameliAllergieSympt: { label: 'ameli.fr — Symptômes et diagnostic de l’allergie', url: 'https://www.ameli.fr/assure/sante/themes/allergie/symptomes-diagnostic', consulted_on: C, published: '2026-06-15' },
  ameliQuincke: { label: 'ameli.fr — Œdème de Quincke (angiœdème)', url: 'https://www.ameli.fr/assure/sante/urgence/pathologies/oedeme-quincke', consulted_on: C, published: '2026-03-11' },
  croixRougeQuincke: { label: 'Croix-Rouge française — Œdème de Quincke : symptômes, dangers et gestes d’urgence', url: 'https://www.croix-rouge.fr/les-gestes-de-premiers-secours/oedeme-de-quincke-symptomes-dangers-et-gestes-durgence', consulted_on: C },
  ameliCoeliaqueDef: { label: 'ameli.fr — Maladie cœliaque ou intolérance au gluten : définition, causes et fréquence', url: 'https://www.ameli.fr/assure/sante/themes/intolerance-gluten-maladie-coeliaque/definition-causes-facteurs-favorisants', consulted_on: C, published: '2024-02-15' },
  ameliCoeliaqueRegime: { label: 'ameli.fr — Régime alimentaire sans gluten', url: 'https://www.ameli.fr/assure/sante/themes/intolerance-gluten-maladie-coeliaque/regime-alimentaire', consulted_on: C },
  ameliCoeliaqueSuivi: { label: 'ameli.fr — Suivi médical et vie quotidienne en cas d’intolérance au gluten (maladie cœliaque)', url: 'https://www.ameli.fr/assure/sante/themes/intolerance-gluten-maladie-coeliaque/suivi-medical-vie-quotidienne', consulted_on: C, published: '2026-08-03' },
  ameliSansGlutenRemb: { label: 'ameli.fr — Remboursement des aliments sans gluten avec l’application du compte ameli', url: 'https://www.ameli.fr/assure/remboursements/rembourse/medicaments-vaccins-dispositifs-medicaux/remboursement-aliments-sans-gluten-ameli', consulted_on: C },
  ameliLactoseDef: { label: 'ameli.fr — Intolérance au lactose : définition et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/intolerance-lactose/definition-symptomes', consulted_on: C, published: '2024-07-30' },
  ameliLactoseRegime: { label: 'ameli.fr — Intolérance au lactose : quel régime alimentaire ?', url: 'https://www.ameli.fr/assure/sante/themes/intolerance-lactose/alimentation-evolution', consulted_on: C, published: '2024-07-31' },
  ameliLactoseConsult: { label: 'ameli.fr — Mauvaise digestion du lait : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/intolerance-lactose/que-faire-quand-consulter', consulted_on: C },
  ameliGrossesseAlim: { label: 'ameli.fr — Adapter son alimentation pendant la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-alimentation/alimentation-grossesse', consulted_on: C, published: '2026-06-18' },
  ameliPai: { label: 'ameli.fr — Médicaments pour les enfants en collectivités : le projet d’accueil individualisé (PAI)', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/gerer-medicaments-enfants-collectivites-pai', consulted_on: C, published: '2021-01-03' },
  eduPai: { label: 'education.gouv.fr — La mise en place d’un projet d’accueil individualisé', url: 'https://www.education.gouv.fr/l-accueil-des-eleves-besoins-specifiques-la-mise-en-place-d-un-projet-d-accueil-individualise-6695', consulted_on: C, published: '2025-04-04' },
  boPai: { label: 'Bulletin officiel de l’Éducation nationale — Circulaire du 10 février 2021 : projet d’accueil individualisé pour raison de santé', url: 'https://www.education.gouv.fr/bo/21/Hebdo9/MENE2104832C.htm', consulted_on: C, published: '2021-03-04' },
  ecoEtiquetage: { label: 'economie.gouv.fr — Denrées alimentaires : les règles d’étiquetage', url: 'https://www.economie.gouv.fr/particuliers/denrees-alimentaires-regles-etiquetage', consulted_on: C },
  ecoRappels: { label: 'economie.gouv.fr — Retraits et rappels de produits : comment signaler et s’informer ?', url: 'https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/retraits-et-rappels-de-produits-comment-signaler-et-sinformer-sur-les-produits-risque', consulted_on: C, published: '2026-03-30' },
  rappelConso: { label: 'RappelConso (site officiel des rappels de produits) — rappels liés aux allergènes', url: 'https://rappel.conso.gouv.fr/categorie/0/9/allerg%C3%A8ne', consulted_on: C },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe et vous aide à préparer vos échanges avec les professionnels ; il ne remplace pas l’avis du médecin, de l’allergologue, de la sage-femme ou du pédiatre qui vous suit._';
const BASE = { status: 'to_review' as const };

export const GUIDE_B06: LibArticle[] = [
  // ------------------------------------------------------------------ lait de vache
  {
    ...BASE, journeys: ['newborn'], category: 'alimentation-bebe', max_age_months: 24, safety_critical: true,
    slug: 'aplv-reconnaitre-les-signes-chez-le-nourrisson',
    title: 'Allergie aux protéines du lait de vache : reconnaître les signes chez le nourrisson',
    summary: 'Signes immédiats ou retardés, différence avec l’intolérance au lactose, examens et premiers réflexes quand on suspecte une APLV chez son bébé.',
    tags: ['APLV', 'allergie lait de vache', 'bébé allergique', 'régurgitations', 'eczéma', 'sang dans les selles', 'coliques'],
    sources: [S.santeAplv, S.mpediaAplv, S.ameliAllergieDef],
    body_md: `## En bref
- L’**allergie aux protéines du lait de vache (APLV)** touche surtout les nourrissons et les enfants de moins de 3 ans ; elle disparaît le plus souvent avec l’âge.
- Les signes peuvent être **cutanés, digestifs, respiratoires ou généraux**, et apparaître quelques minutes… ou plusieurs heures, voire jours, après la prise de lait.
- L’APLV n’est **pas une intolérance au lactose** : c’est une réaction du système immunitaire.
- Ne changez pas de lait de vous-même : le diagnostic et le choix d’un lait adapté se font **avec le médecin**.
- Gonflement du visage, gêne pour respirer, malaise : appelez le **15** ou le **112**.

## Comprendre
Selon Santé.fr, l’APLV concerne environ **un bébé sur quarante** en France, et environ un bébé sur cinq lorsque les deux parents ont un terrain allergique. Elle est souvent associée à d’autres allergies alimentaires (œuf, protéines de blé, arachide). Les premiers signes apparaissent en général entre trois semaines et huit à dix mois.

Les pédiatres de mpedia distinguent deux formes :
- la **forme immédiate** (dite « IgE-médiée ») : les symptômes surviennent de quelques minutes à deux heures après le biberon. Ce sont des démangeaisons, une urticaire, un gonflement, des vomissements, une diarrhée, une rhinite, une gêne respiratoire, parfois un malaise. C’est la forme qui peut être grave ;
- la **forme retardée** (non IgE-médiée) : les signes apparaissent plusieurs heures à plusieurs jours après et s’installent dans la durée : eczéma, reflux, coliques, diarrhée persistante, sang dans les selles, constipation, toux chronique, cassure de la courbe de poids, sommeil perturbé.

Le lait maternel lui-même ne provoque pas d’allergie, rappelle l’Assurance Maladie. Mpedia précise que, rarement, des protéines du lait de vache consommées par la mère passent dans son lait et entraînent des symptômes chez un bébé allaité.

Non prise en charge, l’APLV peut abîmer l’intestin, gêner l’absorption des nutriments et freiner la croissance. D’où l’intérêt d’en parler tôt.

**Comment le diagnostic est posé.** Pour la forme immédiate, le médecin peut demander un test cutané (prick-test) et une prise de sang. Un test positif seul montre une sensibilisation, pas forcément une allergie. Pour la forme retardée, il n’existe pas de test fiable : le diagnostic repose sur une **éviction encadrée** des protéines de lait de vache pendant plusieurs semaines, avec un lait spécifique prescrit, puis une réintroduction décidée par le médecin.

## Au quotidien
- **Tenez un petit carnet** : heure des biberons ou tétées, type de lait, signes observés, délai d’apparition. Des photos de la peau ou des selles aident beaucoup en consultation.
- **Apportez le carnet de santé** : la courbe de poids et de taille compte autant que les symptômes.
- **Ne passez pas** à un lait de chèvre, de brebis, de jument ou à une préparation au soja sans avis médical : Santé.fr rappelle qu’ils peuvent être tout aussi allergisants.
- **Les boissons végétales** (amande, riz, avoine…) ne sont pas adaptées aux nourrissons.
- **Vérifiez les produits de toilette** : shampooings et crèmes ne doivent pas contenir de protéines de lait.
- **Gardez en tête** que pleurs, régurgitations ou petits boutons ont de nombreuses causes chez le bébé : c’est l’ensemble du tableau qui oriente le médecin.

## Questions fréquentes
**Mon bébé régurgite beaucoup : est-ce forcément une APLV ?**
Non. Les régurgitations sont fréquentes chez les nourrissons pour bien d’autres raisons. Si elles s’accompagnent d’autres signes (eczéma, diarrhée, sang dans les selles, poids qui stagne), parlez-en à votre médecin.

**Les tests sont-ils toujours positifs en cas d’APLV ?**
Non. Dans la forme retardée, prick-test et prise de sang sont souvent négatifs : c’est l’essai d’éviction encadré qui permet de conclure.

**Mon bébé va-t-il guérir ?**
Le plus souvent, oui : selon Santé.fr, huit enfants sur dix guérissent avant 2 ans et neuf sur dix avant 6 ans. Certaines formes persistent plus longtemps et demandent un suivi spécialisé.

**Faut-il arrêter d’allaiter ?**
Non. L’allaitement reste à privilégier. Si votre bébé allaité a des symptômes, le médecin vous dira si un régime est utile pour vous.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre bébé a un gonflement du visage ou des lèvres, du mal à respirer, une pâleur ou un malaise, ou des vomissements répétés après un biberon.

**Consultez rapidement** en cas de plaques rouges qui démangent, de régurgitations ou vomissements plus fréquents, de diarrhée ou coliques qui reviennent après les repas, de sang dans les selles, d’alternance diarrhée-constipation, d’irritabilité constante ou de prise de poids insuffisante.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'alimentation-bebe', max_age_months: 36,
    slug: 'aplv-laits-prescrits-et-vie-quotidienne',
    title: 'APLV : laits prescrits, laits à éviter et organisation au quotidien',
    summary: 'Hydrolysats, formules d’acides aminés, laits HA, laits d’autres animaux, boissons végétales : ce qu’il faut savoir quand bébé ne tolère pas le lait de vache.',
    tags: ['APLV', 'hydrolysat', 'lait sans protéines de lait de vache', 'lait HA', 'lait de chèvre', 'boisson végétale', 'remboursement lait'],
    sources: [S.santeAplv, S.mpediaAplv, S.ameliAllergieTrait],
    body_md: `## En bref
- En cas d’APLV, l’allaitement reste à **privilégier** ; sinon, le médecin prescrit un **lait adapté** vendu en pharmacie.
- Les laits **HA** (hypoallergéniques) servent à la prévention, pas au traitement d’une allergie déclarée.
- Les laits de **chèvre, brebis, jument** et les **boissons végétales** ne sont pas des solutions de remplacement.
- Toutes les protéines de lait doivent être évitées, y compris celles **cachées** dans les produits transformés et cosmétiques.
- Une diététicienne peut vous aider à garder une alimentation équilibrée.

## Comprendre
Quand l’APLV est confirmée ou fortement suspectée, le traitement consiste à **supprimer les protéines du lait de vache** de l’alimentation du bébé. Pour un bébé nourri au biberon, Santé.fr et mpedia décrivent les options utilisées :
- les **hydrolysats poussés** (ou extensifs) de protéines de lait de vache : les protéines y sont découpées en très petits fragments que le système immunitaire ne reconnaît plus ;
- les **hydrolysats de protéines de riz**, autre possibilité citée par mpedia ;
- les **formules à base d’acides aminés**, réservées aux formes sévères ou quand les symptômes persistent malgré un hydrolysat. Elles sont très coûteuses.

Le choix du lait, sa quantité et le rythme des biberons relèvent du médecin qui suit votre enfant. L’Assurance Maladie indique que certains de ces substituts sont **remboursés**.

**Les laits HA ne conviennent pas** à un bébé qui a déjà des symptômes : ils sont destinés à prévenir l’allergie chez certains bébés à risque, sur conseil du pédiatre.

**Pourquoi éviter les autres laits ?** Santé.fr explique que l’allergie concerne très souvent aussi les protéines des laits de chèvre, de brebis ou de jument. Mpedia recommande d’exclure les laits de tous les mammifères, en raison de cette allergie croisée, et appelle aussi à la prudence avec les préparations à base de soja. Quant aux boissons végétales vendues en magasin, elles ne couvrent pas les besoins d’un nourrisson.

## Au quotidien
- **Préparez les biberons** exactement selon les consignes de l’ordonnance et de l’emballage.
- **Prévenez tous ceux qui gardent votre bébé** (crèche, assistante maternelle, grands-parents) : un biberon de lait « classique » donné par erreur peut suffire à déclencher des symptômes.
- **Lisez les étiquettes** : le lait figure parmi les allergènes mis en évidence (en gras, souligné ou en italique). Repérez les mots qui le signalent : lait, beurre, crème, lactosérum, caséine, protéines de lait.
- **Pensez aux produits de toilette** : crèmes ou shampooings peuvent contenir des protéines de lait.
- **Gardez un stock** du lait prescrit pour éviter de vous retrouver sans solution un week-end.
- **Faites-vous accompagner** par une diététicienne, surtout au moment de la diversification.

## Questions fréquentes
**Le lait sans lactose convient-il ?**
Non. Un lait « sans lactose » contient toujours les protéines du lait de vache, responsables de l’allergie. Le lactose est un sucre, pas une protéine.

**Mon bébé n’aime pas le goût de son nouveau lait. Que faire ?**
Parlez-en au médecin plutôt que de changer de vous-même : il existe plusieurs types de laits adaptés, et une transition se discute.

**Peut-on alterner avec un lait classique « de temps en temps » ?**
Non, sauf indication médicale : la réintroduction du lait de vache se fait selon un protocole décidé par le médecin ou l’allergologue, parfois en milieu hospitalier.

**Le régime est-il définitif ?**
Non, le plus souvent. Une réintroduction est généralement envisagée vers la fin de la première année ou un peu après, selon l’avis médical (voir l’article sur la réintroduction du lait).

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de gonflement du visage, de difficulté à respirer, de vomissements répétés ou de malaise après un biberon ou un aliment.

**Consultez** si les symptômes persistent malgré le lait prescrit, si votre bébé refuse ses biberons, ne prend pas assez de poids ou si vous avez un doute sur un produit. Si la fatigue ou l’inquiétude deviennent lourdes, parlez-en aussi ; en cas de détresse, le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'alimentation-bebe', max_age_months: 24,
    slug: 'aplv-bebe-allaite-regime-de-la-mere',
    title: 'Bébé allaité et APLV : quand le régime de la mère est discuté',
    summary: 'Pourquoi l’allaitement reste conseillé, dans quels cas un régime sans lait de vache est proposé à la mère et comment le suivre sans carences.',
    tags: ['APLV', 'allaitement', 'régime maman allaitante', 'sans produits laitiers', 'calcium', 'allergie bébé allaité'],
    sources: [S.mpediaAplv, S.santeAplv, S.mpediaAllaitement],
    body_md: `## En bref
- L’allaitement est **à privilégier** et à poursuivre autant que possible chez un bébé allergique.
- Une APLV chez un bébé **exclusivement allaité** est **rare** : elle est due aux protéines du lait de vache consommées par la mère et passées dans son lait.
- Dans ce cas seulement, et **sur avis médical**, la mère peut suivre un régime sans lait de vache, avec des **compléments** prescrits.
- Sans allergie démontrée, la mère allaitante **n’a pas de régime d’éviction** à suivre.
- Une diététicienne aide à garder une alimentation équilibrée.

## Comprendre
Le lait maternel est le meilleur aliment pour le nourrisson, y compris quand il existe un terrain allergique. Mpedia rappelle qu’une petite partie des protéines des aliments consommés par la mère passe dans son lait, ce qui aide l’enfant à construire sa **tolérance**. C’est pourquoi, en l’absence d’allergie avérée, la mère allaitante ne doit exclure aucun aliment, même ceux réputés allergisants comme l’arachide.

Il arrive pourtant, rarement, qu’un bébé allaité réagisse aux protéines du lait de vache présentes en petite quantité dans le lait de sa mère. Les signes sont ceux de l’APLV : eczéma, coliques, reflux, diarrhée, sang dans les selles, prise de poids insuffisante. Dans cette situation, mpedia décrit la conduite suivante :
- la mère suit un **régime sans lait de vache** (lait, laitages, fromages, produits qui en contiennent) ; pendant la phase de diagnostic, mpedia indique qu’il est aussi conseillé d’éviter la viande bovine ;
- elle reçoit un apport de **calcium** et de **vitamine D**, prescrit par le médecin ;
- si l’allaitement s’arrête, un **lait adapté** prescrit prend le relais.

Santé.fr confirme : si le bébé réagit à des substances qui passent dans le lait maternel, la mère doit éviter les produits laitiers et prendre des compléments de calcium.

## Au quotidien
- **N’entamez pas de régime seule** : un régime inutile vous fatigue, complique vos repas et n’apporte rien si l’allergie n’est pas en cause.
- **Notez vos repas** et les réactions de votre bébé pendant quelques jours avant la consultation.
- **Si un régime est prescrit**, apprenez à repérer le lait caché : beurre, crème, lactosérum, caséine, poudre de lait dans le pain, les biscuits, les plats préparés, les sauces.
- **Compensez le calcium** comme indiqué par le médecin : les compléments prescrits remplacent l’apport des produits laitiers que vous ne consommez plus.
- **Organisez-vous à deux** : courses, préparation de repas simples, plats à congeler. Le régime est plus facile quand toute la famille cuisine « sans lait » à certains repas.
- **Demandez une diététicienne** ou une consultante en lactation si vous vous sentez dépassée.

## Questions fréquentes
**Mon bébé a des coliques : dois-je arrêter les laitages ?**
Pas sans avis médical. Les coliques ont de nombreuses causes. Le médecin évaluera l’ensemble des signes avant de proposer, éventuellement, un essai d’éviction.

**Combien de temps dure le régime ?**
C’est le médecin qui en décide, selon la réponse de votre bébé. Un essai d’éviction dure en général quelques semaines, puis une réintroduction permet de vérifier le lien.

**Est-ce que je dois arrêter d’allaiter si mon bébé est allergique ?**
Non. L’allaitement reste conseillé ; le régime de la mère, quand il est nécessaire, permet justement de le poursuivre.

**Puis-je manger des produits « sans lactose » ?**
Ils contiennent toujours les protéines du lait de vache. S’ils vous ont été déconseillés, ils le sont aussi.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre bébé présente un gonflement du visage, une gêne respiratoire, une pâleur ou un malaise.

**Consultez** si votre bébé a du sang dans les selles, ne prend pas de poids, a un eczéma qui s’aggrave ou des troubles digestifs persistants. Parlez aussi de votre propre fatigue : un régime pendant l’allaitement demande de l’énergie. En cas de détresse psychologique, le **3114** répond 24 h/24.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'alimentation-bebe', min_age_months: 4, max_age_months: 48,
    slug: 'aplv-diversification-et-reintroduction-du-lait',
    title: 'APLV : diversifier l’alimentation et réintroduire le lait',
    summary: 'Comment diversifier sans protéines de lait de vache, à quel moment la réintroduction est envisagée et pourquoi elle se fait sous contrôle médical.',
    tags: ['APLV', 'diversification', 'réintroduction lait', 'lait cuit', 'guérison APLV', 'allergologue'],
    sources: [S.mpediaAplv, S.santeAplv, S.ameliAllergieTrait],
    body_md: `## En bref
- Un bébé allergique au lait de vache se **diversifie à peu près au même âge** que les autres, en excluant les produits laitiers et les aliments qui en contiennent.
- Les autres allergènes (œuf, poisson, gluten…) ne sont **pas à retarder** sans avis médical.
- La **réintroduction du lait** est tentée vers la fin de la première année ou un peu après, **toujours selon le protocole du médecin**.
- Le lait **très cuit** (gâteaux) est souvent toléré avant le lait cru ou peu cuit.
- La plupart des enfants guérissent dans les premières années.

## Comprendre
L’Assurance Maladie décrit une diversification « prudente » entre 4 et 6 mois chez le bébé allergique au lait de vache : on introduit les légumes, fruits, féculents, viandes, poissons et œufs, mais on écarte les **produits laitiers** et les **aliments contenant du lait**. Le lait prescrit (hydrolysat ou autre formule) reste l’aliment lacté principal.

**La réintroduction.** Santé.fr indique qu’elle est tentée progressivement vers 12 à 14 mois ; l’Assurance Maladie évoque 9 à 12 mois, sous surveillance médicale. La date exacte dépend de votre enfant, de la forme d’allergie et des résultats des tests. Mpedia distingue :
- la **forme immédiate** (IgE-médiée) : la réintroduction se fait sous suivi allergologique, **en milieu hospitalier**, car une réaction sévère reste possible ;
- la **forme retardée** : après contrôle des tests, elle peut parfois être réalisée à domicile, selon les consignes précises du médecin, pour rechercher la quantité tolérée.

Mpedia note que la tolérance s’acquiert souvent d’abord pour les produits laitiers **très cuits** (par exemple un gâteau bien cuit au four), puis pour des formes moins cuites. Cette étape facilite la vie quotidienne, sans forcément accélérer la guérison.

**Les chances de guérison** sont bonnes : huit enfants sur dix guérissent avant 2 ans et neuf sur dix avant 6 ans, selon Santé.fr. Certaines formes persistent et demandent un suivi au long cours.

## Au quotidien
- **Cuisinez « sans lait »** facilement : purées à l’huile ou avec le lait prescrit, compotes, féculents, viandes, poissons, œufs bien cuits.
- **Lisez chaque étiquette** de petits pots, biscuits, céréales infantiles : le lait y est souvent présent.
- **Introduisez les autres aliments** un à la fois, en petite quantité, pour repérer facilement une réaction.
- **Ne commencez jamais la réintroduction seul**, même si votre enfant « a l’air d’aller mieux » : suivez le calendrier et les étapes fixés par le médecin.
- **Gardez la trousse d’urgence** à portée si elle a été prescrite.
- **Pensez au calcium** : la diététicienne peut proposer des aliments et menus adaptés.

## Questions fréquentes
**Faut-il aussi retarder l’œuf ou l’arachide ?**
Pas systématiquement. Les repères actuels déconseillent de retarder les aliments allergisants. Comme l’APLV est souvent associée à d’autres allergies, demandez au médecin s’il souhaite faire des tests avant certaines introductions.

**Mon enfant a mangé un biscuit au beurre par erreur et n’a rien eu. Est-il guéri ?**
Pas forcément. Une absence de réaction ponctuelle ne permet pas de conclure. Signalez-le au médecin, qui décidera de la suite.

**À partir de quand peut-il boire du lait de vache comme les autres enfants ?**
Quand le médecin a validé la réintroduction complète. Avant cela, le lait prescrit reste la référence.

**Les fromages de chèvre sont-ils une alternative ?**
Non : l’allergie concerne très souvent aussi les laits de chèvre et de brebis, et mpedia recommande d’exclure les laits de tous les mammifères.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas d’urticaire étendue, de gonflement du visage ou de la gorge, de gêne respiratoire, de vomissements répétés ou de malaise pendant ou après une réintroduction. Utilisez l’auto-injecteur d’adrénaline s’il a été prescrit.

**Contactez le médecin** pour toute réaction, même légère, pendant le protocole, ou si vous avez un doute sur une étape.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'sante-enfant', min_age_months: 12, max_age_months: 131,
    slug: 'intolerance-au-lactose-chez-l-enfant',
    title: 'Intolérance au lactose chez l’enfant : la reconnaître et adapter sans tout supprimer',
    summary: 'Différence avec l’allergie au lait, intolérance passagère après une gastro, seuil de tolérance, produits laitiers mieux digérés et calcium.',
    tags: ['intolérance au lactose', 'lactose', 'ballonnements', 'diarrhée', 'produits laitiers', 'calcium', 'gastro-entérite'],
    sources: [S.ameliLactoseDef, S.ameliLactoseRegime, S.ameliLactoseConsult],
    body_md: `## En bref
- L’intolérance au lactose est un **inconfort digestif** : gaz, ballonnements, douleurs, diarrhée. Elle **n’est pas une allergie**.
- Chez le jeune enfant, elle est souvent **passagère**, par exemple après une gastro-entérite.
- On **adapte** la consommation à la tolérance de l’enfant ; on supprime rarement tous les produits laitiers.
- Yaourts, fromages affinés et produits délactosés sont souvent mieux tolérés.
- Chez un enfant, ne restez pas sur une suspicion : **consultez**.

## Comprendre
Le **lactose** est le sucre du lait. Il est découpé dans l’intestin par une enzyme, la **lactase**. Quand elle manque, le lactose non digéré arrive dans le côlon, où des bactéries le font fermenter : cela produit des gaz et attire de l’eau, d’où ballonnements et diarrhée. Les symptômes apparaissent le plus souvent **30 minutes à 2 heures** après le repas, et sont plus marqués quand on boit beaucoup de lait d’un coup.

L’Assurance Maladie distingue plusieurs situations :
- **chez le nourrisson**, le manque de lactase est exceptionnel : son activité est maximale à la naissance ;
- **chez l’enfant**, une intolérance **temporaire** est fréquente après une gastro-entérite ou une infection intestinale : elle disparaît quand la muqueuse de l’intestin a cicatrisé ;
- **avec l’âge**, l’activité de la lactase baisse chez environ deux tiers des personnes, à partir de 2 à 3 ans, de façon très variable. La plupart gardent toutefois une tolérance suffisante pour une consommation raisonnable de produits laitiers.

**Allergie ou intolérance ?** L’allergie aux protéines du lait de vache est une réaction **immunitaire**, surtout chez le nourrisson, qui peut toucher la peau, la respiration et le système digestif, et devenir grave. L’intolérance au lactose reste un **inconfort digestif** sans complication. « Il n’existe pas d’allergie au lactose », résume l’Assurance Maladie.

## Au quotidien
- **N’éliminez pas le lait au hasard** : le médecin peut proposer une éviction de deux semaines, puis une réintroduction progressive pour trouver le **seuil de tolérance** de votre enfant.
- **Tenez un journal** de ce qu’il mange et des symptômes pendant cette période.
- **Privilégiez les produits mieux tolérés** : yaourts (leurs ferments dégradent une partie du lactose), fromages à pâte dure ou bien affinés, qui n’en contiennent quasiment plus, beurre, produits délactosés.
- **Servez le lait dans un plat** (purée, gratin, clafoutis) plutôt qu’en grand verre bu à jeun.
- **Répartissez** les produits laitiers sur la journée et proposez-les au cours d’un repas.
- **Repérez le lactose caché** : pain au lait, crêpes, gaufres, plats en sauce, fromages fondus avec poudre de lait.
- **Pensez au calcium** : s’il consomme peu de produits laitiers, demandez conseil au médecin ou à une diététicienne.

## Questions fréquentes
**Mon enfant a eu une gastro et digère mal le lait depuis. Est-ce durable ?**
C’est souvent passager. Le médecin peut conseiller de limiter le lactose quelques jours, le temps que l’intestin guérisse, puis de reprendre une alimentation normale.

**Peut-on remplacer le lait par une boisson végétale ?**
Chez le nourrisson, non : les boissons végétales ne remplacent pas les laits infantiles et peuvent entraîner des carences graves. Chez l’enfant plus grand, demandez conseil au médecin, car elles ne couvrent pas les mêmes besoins.

**Comment confirmer le diagnostic ?**
Le médecin s’appuie sur les symptômes et leur lien avec l’alimentation. Un test respiratoire à l’hydrogène peut être prescrit.

**Un écart est-il grave ?**
L’intolérance au lactose n’entraîne pas de complication grave : un écart peut donner un inconfort passager. Évitez donc un régime trop strict qui priverait votre enfant de calcium.

## Quand demander conseil
**Consultez sans attendre** si vous suspectez une intolérance chez votre enfant, comme le recommande l’Assurance Maladie, et surtout s’il perd du poids, a du sang dans les selles, une diarrhée qui dure, des vomissements ou des signes de déshydratation.

**Appelez le 15 ou le 112** si des signes surviennent juste après un produit laitier et touchent la peau ou la respiration (urticaire, gonflement, gêne respiratoire) : ce n’est plus une intolérance, mais une possible réaction allergique.

${FIN}`,
  },
  // ------------------------------------------------------------------ allergènes fréquents de l'enfant
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'sante-enfant', max_age_months: 131, safety_critical: true,
    slug: 'allergie-a-l-oeuf-chez-l-enfant',
    title: 'Allergie à l’œuf chez l’enfant : repérer l’œuf partout et organiser les repas',
    summary: 'Où se cache l’œuf, comment lire les étiquettes, que dire avant un vaccin, comment cuisiner sans œuf et quand appeler les secours.',
    tags: ['allergie œuf', 'oeuf', 'allergie alimentaire', 'étiquette', 'vaccin et œuf', 'pâtisserie sans œuf', 'enfant allergique'],
    sources: [S.ameliAllergieDef, S.santeAllergie, S.santeAllergenes],
    body_md: `## En bref
- L’œuf fait partie des **allergènes les plus fréquents** chez l’enfant, avec le lait, l’arachide, les fruits à coque et le poisson.
- Il se cache dans de **nombreux produits** : pâtisseries, pâtes fraîches, sauces, panures, plats préparés.
- Sur les produits emballés, l’œuf fait partie des **14 allergènes** à mettre en évidence dans la liste des ingrédients.
- Signalez l’allergie **avant toute vaccination** : le médecin vérifiera la composition des vaccins.
- Gonflement, gêne respiratoire, malaise : **15 ou 112**.

## Comprendre
Selon Santé.fr, l’œuf, l’arachide, le lait de vache, la moutarde, les fruits à coque et le poisson représentent environ les **trois quarts** des allergies alimentaires de l’enfant. L’Assurance Maladie rappelle que l’allergie se met en place en deux temps : un premier contact sensibilise l’organisme sans symptôme, puis un contact suivant déclenche la réaction.

Les signes sont variés : démangeaisons, urticaire, poussée d’eczéma, gonflement des lèvres ou des paupières, vomissements, douleurs de ventre, diarrhée, rhinite, toux, crise d’asthme. Ils surviennent en général rapidement après le repas. La forme la plus grave, le **choc anaphylactique**, touche plusieurs organes à la fois et met la vie en danger.

Le diagnostic est posé par le médecin ou l’allergologue (interrogatoire, tests cutanés, prise de sang, parfois test de provocation à l’hôpital). C’est lui qui précise si l’enfant doit éviter **tout** œuf, quelle que soit sa forme, et s’il faut une trousse d’urgence.

**Vaccins.** Santé.fr signale que les enfants allergiques aux protéines de l’œuf peuvent réagir à certains vaccins qui en contiennent. Des tests préalables permettent, si besoin, d’établir un protocole de vaccination sous surveillance médicale. Ce n’est pas une raison de renoncer aux vaccins : c’est une information à donner au médecin.

## Au quotidien
- **Lisez toutes les étiquettes**, à chaque achat : les recettes changent. L’œuf apparaît en gras, souligné ou en italique dans la liste des ingrédients ; s’il n’y a pas de liste, la mention « contient » est obligatoire.
- **Repérez les produits à risque** : gâteaux, biscuits, brioches, crêpes, gaufres, crèmes desserts, mayonnaise et sauces émulsionnées, pâtes fraîches, quiches, gratins, panures, nuggets, farces, certaines glaces et meringues.
- **En boulangerie, au restaurant, à la cantine**, demandez l’information écrite sur les allergènes, obligatoire pour les produits non emballés.
- **Cuisinez sans œuf** : compote, banane écrasée, fécule ou graines de lin moulues mélangées à de l’eau peuvent lier une pâte à gâteau. Testez d’abord à la maison.
- **Prévenez tous les adultes** qui s’occupent de votre enfant et laissez-leur la conduite à tenir écrite.
- **À l’école ou à la crèche**, demandez un **PAI** (projet d’accueil individualisé).
- **Gardez la trousse d’urgence** avec vous si elle a été prescrite.

## Questions fréquentes
**Mon enfant peut-il manger un gâteau où l’œuf est bien cuit ?**
Ne le faites pas sans l’accord de l’allergologue. Seul le bilan permet de savoir quelles formes d’œuf sont tolérées ou non.

**L’allergie à l’œuf peut-elle disparaître ?**
Certaines allergies alimentaires de l’enfant évoluent avec l’âge. L’allergologue suit votre enfant et décide si une réintroduction peut être tentée, parfois à l’hôpital.

**Faut-il éviter aussi le poulet ?**
L’allergie à l’œuf ne signifie pas automatiquement allergie à la viande de volaille. Posez la question à l’allergologue plutôt que de supprimer des aliments par précaution.

**Mon bébé a des antécédents d’allergie dans la famille : faut-il retarder l’œuf ?**
Non, pas sans avis médical : les repères actuels recommandent d’introduire l’œuf bien cuit pendant la diversification, comme les autres aliments. Demandez conseil au médecin ou à la PMI en cas d’antécédents.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** (gratuits, même sans crédit) en cas de gonflement du visage, des lèvres ou de la gorge, de voix changée, de difficulté à respirer, de malaise, de pâleur, de vomissements répétés, ou si plusieurs signes apparaissent ensemble après un repas. Utilisez l’auto-injecteur d’adrénaline s’il a été prescrit, sans attendre.

**Consultez votre médecin** après toute réaction, même légère, pour faire le point et adapter la conduite à tenir.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'sante-enfant', min_age_months: 6, max_age_months: 131, safety_critical: true,
    slug: 'allergie-a-l-arachide-vigilance-au-quotidien',
    title: 'Allergie à l’arachide : vigilance au quotidien, en voyage et en collectivité',
    summary: 'Étiquettes, mentions « peut contenir des traces », repas hors de la maison, voyages et trousse d’urgence quand un enfant est allergique à la cacahuète.',
    tags: ['allergie arachide', 'cacahuète', 'beurre de cacahuète', 'traces', 'voyage enfant allergique', 'auto-injecteur', 'PAI'],
    sources: [S.ameliAllergieConsult, S.santeAllergie, S.santeAllergenes],
    body_md: `## En bref
- L’**arachide** (cacahuète) fait partie des allergènes les plus fréquents chez l’enfant et peut provoquer des **réactions graves**.
- Elle figure parmi les **14 allergènes** obligatoirement signalés et mis en évidence sur les étiquettes.
- La mention « **peut contenir des traces** » signale un risque de contamination : demandez à l’allergologue comment la prendre en compte.
- En voyage, renseignez-vous sur la cuisine locale : certains pays utilisent beaucoup l’arachide.
- Si un auto-injecteur d’adrénaline a été prescrit, il doit **toujours** accompagner l’enfant.

## Comprendre
L’allergie à l’arachide se manifeste comme les autres allergies alimentaires : démangeaisons, urticaire, gonflement des lèvres ou des paupières, vomissements, douleurs abdominales, toux, gêne respiratoire, et parfois **choc anaphylactique**. Santé.fr souligne que les réactions peuvent avoir tendance à s’aggraver d’une exposition à l’autre : une première réaction modérée doit donc être prise au sérieux.

Après le bilan, l’allergologue remet en général une **carte d’allergie** (allergènes, réactions possibles, numéros d’urgence) et, si nécessaire, la composition d’une **trousse d’urgence** avec son protocole, précise l’Assurance Maladie.

**Arachide et fruits à coque** sont deux catégories distinctes sur les étiquettes. Un enfant peut être allergique à l’une, à l’autre ou aux deux : seul le bilan le dit.

**L’étiquetage de précaution.** Les règles d’étiquetage portent sur les ingrédients ajoutés volontairement. La mention « peut contenir des traces de… » indique un risque de contamination accidentelle (fabrication, stockage, transport) que le fabricant n’a pas pu maîtriser. Elle n’est pas obligatoire : son absence ne garantit pas l’absence de traces.

## Au quotidien
- **Lisez chaque étiquette** : biscuits, barres de céréales, chocolats, glaces, sauces asiatiques ou africaines, apéritifs, pâtes à tartiner, céréales du petit déjeuner.
- **Méfiez-vous du vrac et du fait maison** des autres : pâtisseries, sandwichs, plats à emporter. Demandez l’information écrite sur les allergènes, obligatoire pour les produits non emballés.
- **Au restaurant**, signalez l’allergie dès la commande et demandez la liste des allergènes de chaque plat.
- **Anniversaires et goûters** : apportez une part de gâteau sûre, prévenez les parents qui invitent.
- **Apprenez à votre enfant**, selon son âge, à dire qu’il est allergique et à refuser un aliment inconnu.
- **En voyage**, emportez la trousse d’urgence en permanence, prévoyez des en-cas, apprenez quelques mots dans la langue du pays et renseignez-vous sur les habitudes alimentaires. Hors Union européenne, les règles d’étiquetage peuvent être différentes.
- **Sport** : l’allergie n’empêche pas de faire du sport. Préparez vous-même les collations d’après l’effort.

## Questions fréquentes
**Faut-il éviter les produits « peut contenir des traces » ?**
Cela dépend de la sensibilité de votre enfant. Suivez la consigne écrite donnée par l’allergologue, et posez-lui la question si elle n’est pas précisée.

**Mon enfant peut-il aller à la cantine ?**
Oui, dans le cadre d’un **projet d’accueil individualisé (PAI)** établi avec l’école, le médecin scolaire et votre médecin. Il précise le régime, les aliments exclus, la trousse d’urgence et les gestes à faire.

**Peut-on désensibiliser un enfant à l’arachide ?**
C’est une question à poser à l’allergologue : lui seul peut dire si un traitement de fond est envisageable pour votre enfant, et dans quel cadre. N’essayez jamais de « l’habituer » à la maison en lui donnant de petites quantités.

**L’huile d’arachide est-elle concernée ?**
Posez la question à l’allergologue et lisez les étiquettes : la conduite à tenir dépend du produit et de votre enfant.

## Quand demander conseil
**Appelez le 15 ou le 112** dès un gonflement des lèvres, de la langue ou de la gorge, une voix changée, une gêne respiratoire, un malaise, des vomissements répétés ou plusieurs signes ensemble. Injectez l’adrénaline si elle a été prescrite, sans attendre les secours : toute injection nécessite ensuite une surveillance à l’hôpital.

**Consultez** après toute réaction, même légère, et avant un voyage pour mettre à jour la trousse et le protocole.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'sante-enfant', max_age_months: 131, safety_critical: true,
    slug: 'fruits-a-coque-allergie-et-etouffement',
    title: 'Fruits à coque chez l’enfant : allergie, étiquettes et risque d’étouffement',
    summary: 'Noix, noisettes, amandes, cajou, pistaches : comment les proposer sans danger d’étouffement, repérer une allergie et lire les étiquettes.',
    tags: ['fruits à coque', 'noisette', 'amande', 'noix de cajou', 'pistache', 'allergie', 'étouffement', 'fausse route'],
    sources: [S.santeAllergenes, S.brochureDiversif, S.ameliQuincke],
    body_md: `## En bref
- Les **fruits à coque** (amandes, noisettes, noix, cajou, pécan, macadamia, noix du Brésil, pistaches…) font partie des **14 allergènes** signalés sur les étiquettes.
- Chez le tout-petit, ils se proposent **en poudre ou finement mixés**, jamais entiers : risque d’**étouffement**.
- Aucun aliment petit, dur et rond (comme une cacahuète ou une noisette entière) **avant 5 ans**.
- Une allergie peut se manifester par un **gonflement des lèvres, de la bouche ou de la gorge** : c’est une urgence.
- L’allergie à l’arachide et celle aux fruits à coque sont **distinctes** : seul le bilan dit lesquels éviter.

## Comprendre
La liste réglementaire des allergènes, publiée par la DGCCRF, regroupe sous le terme « fruits à coque » : amandes, noisettes, noix, noix de cajou, noix de pécan, noix de macadamia, noix du Brésil, noix du Queensland et pistaches. Chacun doit être nommé clairement dans la liste des ingrédients.

**Deux risques à bien distinguer :**
- **l’étouffement**, qui concerne tous les enfants : le guide de la diversification de Santé publique France recommande de ne proposer les fruits à coque qu’**en poudre**, non salés, mélangés à une purée, et de ne pas donner d’aliments petits, durs et ronds avant 5 ans ;
- **l’allergie**, qui concerne certains enfants : l’Assurance Maladie cite les fruits à coque parmi les principaux aliments responsables de l’œdème de Quincke, un gonflement brutal du visage, des lèvres, de la langue ou de la gorge.

Les repères actuels recommandent de ne **pas retarder** l’introduction des fruits à coque chez le bébé : les goûter tôt, sous une forme adaptée, favoriserait la tolérance. En cas d’antécédents d’allergie dans la famille, le guide conseille de demander d’abord l’avis du médecin traitant ou de la PMI.

## Au quotidien
- **Pour le bébé** : une pincée de poudre d’amande ou de noisette dans une compote ou une purée connue, un aliment nouveau à la fois, de préférence en début de journée pour pouvoir observer.
- **Pour les plus grands** : fruits à coque entiers seulement à partir de 5 ans, assis, au calme, jamais en courant ou en riant.
- **Rangez** les apéritifs hors de portée des petits, surtout lors des fêtes.
- **Si votre enfant est allergique** : lisez toutes les étiquettes (pâtisseries, pralinés, nougats, pâtes à tartiner, laits et crèmes végétales, pestos, céréales, barres), méfiez-vous des produits en vrac, demandez l’information allergènes en boulangerie et au restaurant.
- **Huiles et cosmétiques** : certains contiennent des huiles de fruits à coque ; demandez conseil à l’allergologue.
- **PAI et trousse d’urgence** : à mettre en place avec l’école, la crèche et le médecin.

## Questions fréquentes
**Un enfant allergique à la noisette doit-il éviter tous les fruits à coque ?**
Pas forcément. L’allergologue précise, selon les tests, lesquels éviter. Ne supprimez pas tout « par précaution » sans avis.

**Mon enfant a avalé une cacahuète entière et tousse fort. Que faire ?**
S’il tousse efficacement, encouragez-le à tousser et ne lui donnez rien à boire. S’il ne peut plus respirer, parler ou tousser, appelez le 15 ou le 112 et pratiquez les gestes de désobstruction. Une toux qui persiste après un épisode d’étouffement doit faire consulter.

**Les « laits » d’amande conviennent-ils à un bébé ?**
Non : les boissons végétales ne couvrent pas les besoins des enfants de moins d’un an, même enrichies en calcium.

**La mention « peut contenir des traces de fruits à coque » est-elle importante ?**
Elle signale un risque de contamination. L’allergologue vous dira si votre enfant doit éviter ces produits.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de gonflement du visage, de voix faible ou changée, de difficulté à respirer, de malaise, de vomissements répétés après un aliment, ou si votre enfant s’étouffe et ne peut plus respirer.

**Consultez** après toute réaction, même discrète (démangeaisons de la bouche, plaques), pour faire un bilan.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'sante-enfant', min_age_months: 6, max_age_months: 131, safety_critical: true,
    slug: 'allergie-poisson-crustaces-mollusques-enfant',
    title: 'Poisson, crustacés, mollusques : l’allergie chez l’enfant et les fausses alertes',
    summary: 'Trois allergènes distincts sur les étiquettes, réactions possibles, pièges du quotidien et différence avec une réaction à l’histamine d’un poisson mal conservé.',
    tags: ['allergie poisson', 'fruits de mer', 'crustacés', 'mollusques', 'crevettes', 'histamine', 'œdème de Quincke'],
    sources: [S.ameliAllergieDef, S.santeAllergenes, S.ameliQuincke],
    body_md: `## En bref
- **Poissons**, **crustacés** (crevettes, crabes, homards…) et **mollusques** (moules, huîtres, calamars…) sont **trois allergènes distincts** sur les étiquettes.
- Le poisson fait partie des allergies alimentaires fréquentes de l’enfant ; les fruits de mer sont souvent en cause dans l’œdème de Quincke.
- Une réaction après un poisson **pas assez frais** peut ressembler à une allergie : c’est un mécanisme différent, lié à l’histamine.
- Seul le **bilan allergologique** précise ce que votre enfant doit éviter.
- Gonflement du visage ou gêne respiratoire : **15 ou 112**.

## Comprendre
L’Assurance Maladie cite le poisson parmi les aliments le plus souvent responsables d’allergie chez l’enfant, avec le lait, l’œuf, l’arachide, les fruits exotiques et les fruits à coque. Chez l’adulte, poissons, crustacés et mollusques figurent aussi en bonne place. La page consacrée à l’œdème de Quincke mentionne les **fruits de mer** parmi les principaux aliments déclencheurs.

Sur les produits emballés, la réglementation européenne impose de signaler séparément : les **poissons**, les **crustacés** et les **mollusques**. Être allergique à l’un ne signifie pas forcément l’être aux autres : c’est l’allergologue qui fait le tri, à partir des tests.

**La fausse alerte de l’histamine.** Certains aliments, dont le poisson, peuvent contenir de l’histamine, surtout s’ils ont été mal conservés. Chez certaines personnes, elle provoque des signes proches d’une allergie (rougeurs, démangeaisons, parfois gêne respiratoire). L’Assurance Maladie précise qu’il ne s’agit **pas d’une allergie**. Seul un médecin peut faire la différence : ne concluez pas seul, dans un sens comme dans l’autre.

**Introduire le poisson chez le bébé.** Le poisson fait partie des aliments à proposer pendant la diversification, comme les autres allergènes : bien cuit, sans arêtes, en variant les espèces. Si un aîné ou un parent est allergique au poisson, parlez-en d’abord au médecin.

## Au quotidien
- **Lisez les étiquettes** : surimi, soupes, sauces (certaines sauces asiatiques contiennent du poisson), bouillons, pizzas, taboulés, salades composées, plats préparés, chips aromatisées.
- **Méfiez-vous des vapeurs et projections** : demandez à l’allergologue si votre enfant doit éviter d’être à proximité d’une cuisson de poisson ou de fruits de mer.
- **Au restaurant**, signalez l’allergie et demandez si les mêmes friteuses, plans de travail ou ustensiles servent pour le poisson.
- **À la cantine**, un **PAI** organise les menus et la conduite à tenir.
- **Conservez bien vos poissons** : chaîne du froid respectée, cuisson rapide après l’achat, restes au réfrigérateur.

## Questions fréquentes
**Mon enfant est allergique au poisson : peut-il manger des crevettes ?**
Pas sans avis. Poissons et crustacés sont deux allergènes différents : seul le bilan dit ce qui est toléré.

**Mon enfant a eu des plaques après du thon en conserve. Est-ce une allergie ?**
Peut-être, peut-être pas : une réaction à l’histamine est possible. Notez ce qu’il a mangé, gardez l’emballage et consultez pour faire le point.

**La gélatine de poisson pose-t-elle problème ?**
La réglementation prévoit quelques exceptions d’étiquetage, par exemple la gélatine de poisson utilisée comme support de vitamines. Pour un enfant très sensible, demandez conseil à l’allergologue.

**L’allergie au poisson disparaît-elle ?**
Cela varie selon les enfants. L’allergologue réévalue régulièrement la situation.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** en cas de gonflement soudain du visage, des lèvres ou de la langue, de voix faible, de difficulté à respirer, de malaise, de vomissements ou douleurs de ventre intenses après un repas. Utilisez l’auto-injecteur d’adrénaline s’il a été prescrit.

**Consultez votre médecin** après toute réaction, même légère, pour envisager un bilan allergologique.

${FIN}`,
  },
  // ------------------------------------------------------------------ gluten
  {
    ...BASE, journeys: ['child'], category: 'sante-enfant', max_age_months: 131,
    slug: 'allergie-au-ble-maladie-coeliaque-hypersensibilite',
    title: 'Allergie au blé, maladie cœliaque, hypersensibilité au gluten : trois choses différentes',
    summary: 'Mécanismes, signes et conséquences pratiques de trois troubles souvent confondus, et pourquoi il ne faut pas supprimer le gluten avant le diagnostic.',
    tags: ['gluten', 'maladie cœliaque', 'allergie au blé', 'hypersensibilité au gluten', 'intolérance au gluten', 'sans gluten'],
    sources: [S.ameliCoeliaqueDef, S.mpediaGluten, S.ameliAllergieDef],
    body_md: `## En bref
- La **maladie cœliaque** est une maladie **auto-immune** de l’intestin déclenchée par le gluten : le traitement est un régime **strictement sans gluten, à vie**.
- L’**allergie au blé** est une réaction allergique, souvent rapide après le repas ; elle peut disparaître pendant l’enfance.
- L’**hypersensibilité au gluten** est un trouble digestif fonctionnel, sans maladie cœliaque.
- Les trois se ressemblent parfois, mais le diagnostic, le suivi et le régime **ne sont pas les mêmes**.
- Ne supprimez **pas** le gluten avant les examens : cela peut fausser le diagnostic.

## Comprendre
**La maladie cœliaque.** L’Assurance Maladie la décrit comme une maladie chronique auto-immune de l’intestin grêle, déclenchée par le gluten chez des personnes génétiquement prédisposées. Le système immunitaire réagit à la gliadine, une protéine du gluten : l’inflammation abîme les **villosités intestinales**, ce qui gêne l’absorption du fer, du calcium, de la vitamine D ou des folates. Elle touche environ 1 % de la population, plus souvent les femmes. Le gluten se trouve dans le blé (dont blé dur, épeautre, kamut), l’orge, le seigle et leurs hybrides. Mpedia souligne que ce n’est **ni une allergie, ni un déficit enzymatique**.

**L’allergie au blé.** C’est une allergie « classique », qui fait intervenir les anticorps IgE. Elle provoque une réaction **immédiate** après l’ingestion : troubles digestifs, éruption, œdème de Quincke, crise d’asthme. Selon l’Assurance Maladie, elle peut disparaître pendant l’enfance. Chez l’adulte, l’effort physique après un repas contenant de la farine de blé peut favoriser une réaction grave.

**L’hypersensibilité au gluten.** C’est un trouble fonctionnel digestif : la personne se sent mieux en réduisant le blé, sans avoir de maladie cœliaque. Les travaux récents évoquent d’autres composants du blé ou les FODMAP, des sucres qui fermentent dans l’intestin.

**Pourquoi c’est important.** La maladie cœliaque exige un régime strict et un suivi médical, car elle expose à des carences et à des complications si elle n’est pas traitée. L’allergie au blé demande d’éviter le blé, avec parfois une trousse d’urgence. L’hypersensibilité se gère au cas par cas. Mélanger les trois, c’est risquer un régime inutilement contraignant… ou insuffisant.

## Au quotidien
- **Notez les symptômes** : délai après le repas (minutes, heures, jours), type de signes, aliments consommés.
- **Gardez le gluten dans l’alimentation** jusqu’aux examens, sauf avis médical contraire.
- **Apportez le carnet de santé** : la courbe de croissance aide à repérer une maladie cœliaque chez l’enfant.
- **Signalez les antécédents familiaux** : diabète de type 1, maladie de la thyroïde, maladie cœliaque chez un proche.
- **Ne vous fiez pas** à un test vendu en ligne ou à une « amélioration » sous régime : seul le bilan médical tranche.

## Questions fréquentes
**Le « sans gluten » est-il meilleur pour la santé d’un enfant qui n’a pas de maladie cœliaque ?**
Rien ne permet de le dire. Mpedia déconseille fermement d’entreprendre un régime sans gluten sans diagnostic établi.

**Mon enfant allergique au blé doit-il éviter l’orge et le seigle ?**
C’est l’allergologue qui le précise, selon les tests. L’allergie au blé ne se gère pas forcément comme la maladie cœliaque.

**La maladie cœliaque peut-elle guérir ?**
Non : l’Assurance Maladie indique qu’elle est définitive. Le régime sans gluten permet en revanche de faire disparaître les symptômes et de réparer l’intestin.

**L’avoine contient-elle du gluten ?**
L’avoine pure est tolérée par la grande majorité des personnes cœliaques, mais elle est souvent contaminée par le blé. Seuls les produits à l’avoine destinés aux personnes cœliaques sont conseillés.

## Quand demander conseil
**Appelez le 15 ou le 112** si un enfant présente, juste après un repas, un gonflement du visage, une gêne respiratoire, un malaise ou des vomissements répétés.

**Consultez** en cas de diarrhée qui dure, de ventre gonflé, de perte d’appétit, de poids ou de taille qui stagnent, de fatigue ou de tristesse inhabituelle, ou si des troubles digestifs reviennent régulièrement après les repas.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'maladies-chroniques', min_age_months: 4, max_age_months: 131, safety_critical: true,
    slug: 'maladie-coeliaque-enfant-signes-et-diagnostic',
    title: 'Maladie cœliaque chez l’enfant : les signes qui doivent alerter et le diagnostic',
    summary: 'Diarrhée chronique, cassure de croissance, ventre gonflé, changement d’humeur : comment la maladie cœliaque se révèle et comment elle est confirmée.',
    tags: ['maladie cœliaque', 'intolérance au gluten', 'cassure de la courbe', 'diarrhée chronique', 'anticorps anti-transglutaminase', 'endoscopie'],
    sources: [S.mpediaGluten, S.ameliCoeliaqueDef, S.santeIntolerance],
    body_md: `## En bref
- La maladie cœliaque peut apparaître chez le **jeune enfant après l’introduction du gluten**, mais aussi plus tard, voire à l’âge adulte.
- Signes typiques : **diarrhée chronique, ventre gonflé, perte d’appétit, ralentissement de la croissance**, enfant triste ou anormalement calme.
- Les formes peuvent être **discrètes** : fatigue, douleurs de ventre, carence en fer.
- Le diagnostic repose sur une **prise de sang** (anticorps) puis, le plus souvent, une **endoscopie** : ne supprimez pas le gluten avant.
- Les **proches** d’un enfant cœliaque ont un risque plus élevé.

## Comprendre
La maladie cœliaque est une maladie auto-immune déclenchée par le gluten chez des enfants génétiquement prédisposés. L’inflammation abîme la paroi de l’intestin grêle, qui absorbe moins bien les nutriments. Santé.fr rappelle qu’elle survient souvent chez l’enfant au moment de l’introduction des farines et que, non dépistée, elle peut entraîner une atrophie de la paroi intestinale.

**Les signes chez l’enfant**, décrits par mpedia :
- un **ralentissement de la croissance** en poids puis en taille, visible sur les courbes du carnet de santé ;
- des **troubles digestifs** : diarrhée chronique, parfois vomissements ou constipation ;
- une **perte d’appétit** et un **changement de caractère** : tristesse, calme inhabituel.

Santé.fr cite aussi les ballonnements, l’amaigrissement, la fatigue, et, dans les formes modérées, des douleurs abdominales après les repas contenant du gluten. Chez le nourrisson, un ventre gonflé et douloureux, des selles molles et malodorantes, des gaz abondants ou un bébé apathique doivent faire consulter.

**Les terrains à risque.** L’Assurance Maladie indique que le risque atteint environ **10 %** chez les parents au premier degré (parents, frères et sœurs, enfants) d’une personne cœliaque. La maladie est aussi plus fréquente en cas de diabète de type 1, de maladie auto-immune de la thyroïde, de déficit en IgA, de trisomie 21 ou de syndrome de Turner.

**Le diagnostic.** Le médecin prescrit d’abord une **prise de sang** à la recherche d’anticorps spécifiques (anti-transglutaminase). Mpedia indique que le diagnostic est ensuite confirmé par une **endoscopie digestive** avec biopsies. L’enfant doit **continuer à manger du gluten** jusqu’aux examens : un régime commencé trop tôt peut rendre les résultats faussement rassurants.

## Au quotidien
- **Regardez les courbes** de poids et de taille avec votre médecin à chaque visite.
- **Notez** la fréquence et l’aspect des selles, l’appétit, l’humeur, la fatigue.
- **Ne commencez pas** de régime sans gluten « pour voir » : mpedia le déconseille formellement sans diagnostic.
- **Si un proche est cœliaque**, parlez-en au médecin, qui jugera de l’intérêt d’un dépistage.
- **Posez vos questions** à l’équipe avant l’endoscopie : déroulement, préparation, temps d’hospitalisation. Expliquer simplement l’examen à votre enfant l’aide à mieux le vivre.

## Questions fréquentes
**Introduire le gluten plus tard protège-t-il de la maladie ?**
Non. Selon mpedia, ni le retard d’introduction ni l’allaitement ne modifient le risque ; une introduction tardive est seulement associée à un début plus tardif.

**Mon enfant n’a pas de diarrhée : la maladie cœliaque est-elle exclue ?**
Non. Les formes discrètes existent : fatigue, carence en fer, petite taille, douleurs abdominales. Le médecin peut prescrire une prise de sang en cas de doute.

**Une prise de sang suffit-elle ?**
Elle oriente fortement. La confirmation passe le plus souvent par l’endoscopie ; le médecin vous expliquera la démarche adaptée à votre enfant.

**Que se passe-t-il après le diagnostic ?**
Un régime strictement sans gluten, à vie, accompagné par une diététicienne. Les symptômes régressent en quelques semaines et la croissance reprend.

## Quand demander conseil
**Consultez rapidement** si votre enfant a une diarrhée qui dure, perd du poids ou ne grandit plus, a le ventre gonflé et douloureux, mange beaucoup moins, ou semble triste et sans énergie.

**Appelez le 15 ou le 112** en cas de signes de déshydratation importante (bébé très somnolent, ne boit plus, yeux creusés, plus de couches mouillées) ou d’altération de l’état général.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'maladies-chroniques', max_age_months: 131,
    slug: 'regime-sans-gluten-enfant-courses-et-cuisine',
    title: 'Régime sans gluten de l’enfant : courses, cuisine et gluten caché',
    summary: 'Céréales interdites et autorisées, avoine, mentions « sans gluten », pièges des produits transformés et idées pour cuisiner en famille.',
    tags: ['régime sans gluten', 'maladie cœliaque', 'gluten caché', 'avoine', 'étiquette sans gluten', 'farine sans gluten', 'enfant cœliaque'],
    sources: [S.ameliCoeliaqueRegime, S.santeIntolerance, S.mpediaGluten],
    body_md: `## En bref
- En cas de maladie cœliaque, le **régime strictement sans gluten** est le seul traitement efficace, à poursuivre **toute la vie**.
- Interdits : **blé** (y compris blé dur, épeautre, kamut), **orge**, **seigle** et leurs hybrides.
- Autorisés : **riz, maïs, sarrasin, pomme de terre**, et aussi tapioca, châtaigne, quinoa, millet, légumineuses.
- Le gluten se **cache** dans de nombreux produits : sauces, charcuteries, épices, sucre glace…
- Une **diététicienne** aide à mettre en place un régime équilibré et vivable.

## Comprendre
L’Assurance Maladie explique que le régime sans gluten, suivi strictement, fait disparaître les symptômes, permet la cicatrisation de l’intestin et prévient les complications. Mpedia insiste sur sa poursuite pendant toute l’enfance pour assurer une bonne croissance, puis à l’âge adulte.

**Ce qui contient du gluten** : pain, viennoiseries, pâtisseries, pâtes, semoule, biscuits, la plupart des céréales du petit déjeuner et des céréales infantiles, aliments panés ou en beignets, pains de viande ou de poisson à la chapelure, soupes et sauces liées à la farine de blé, bières, seitan.

**Le gluten caché.** L’Assurance Maladie cite la charcuterie, le sucre glace, les poivres moulus, les mélanges d’épices et assaisonnements, ainsi que certains médicaments. Santé.fr ajoute certaines moutardes, sauces et chocolats, et des mentions comme « amidon » ou « extrait de malt ».

**L’avoine.** L’avoine pure est consommée sans problème par plus de 95 % des personnes cœliaques, mais elle est souvent contaminée par d’autres céréales. Par précaution, choisissez uniquement les produits à l’avoine **destinés aux personnes cœliaques**.

**Les mentions sur l’emballage.** La mention « **sans gluten** » correspond à un seuil réglementaire très bas, fixé au niveau européen. La mention « **très faible teneur en gluten** » est **déconseillée** en cas de maladie cœliaque.

## Au quotidien
- **Lisez les étiquettes à chaque achat** : les céréales contenant du gluten sont signalées en gras, souligné ou italique dans la liste des ingrédients.
- **Bâtissez les repas** autour d’aliments naturellement sans gluten : légumes, fruits, viandes, poissons, œufs, produits laitiers nature, riz, pommes de terre, maïs, légumineuses.
- **Évitez les contaminations** à la maison : grille-pain, planche à pain et passoire réservés, beurre et confiture non partagés avec des couteaux pleins de miettes, plats sans gluten préparés en premier.
- **Fabriquez des basiques** : crêpes au sarrasin, gâteaux à la farine de riz ou de châtaigne, sauces liées à la fécule de maïs ou de pomme de terre.
- **Compensez les fibres** avec riz complet, maïs, pommes de terre et légumes, comme le conseille l’Assurance Maladie.
- **Signalez la maladie** au pharmacien : certains médicaments contiennent du gluten parmi leurs excipients.
- **Impliquez votre enfant** : lui apprendre à lire une étiquette le rend plus autonome chez les copains et à la cantine.

## Questions fréquentes
**Un petit écart de temps en temps, est-ce grave ?**
L’Assurance Maladie présente le régime **strictement** sans gluten comme le seul traitement efficace pour garantir le bien-être et éviter les complications. Si les écarts sont fréquents, parlez-en au médecin ou à la diététicienne : ils peuvent vous aider à trouver des solutions concrètes.

**Les produits sans gluten du commerce sont-ils indispensables ?**
Non, mais ils facilitent la vie. Une partie peut être remboursée sous conditions (voir l’article sur le suivi et les remboursements).

**Toute la famille doit-elle manger sans gluten ?**
Ce n’est pas nécessaire, mais partager des repas sans gluten simplifie l’organisation et limite les contaminations.

**L’adolescence complique-t-elle le régime ?**
Souvent, oui, reconnaît l’Assurance Maladie. Un accompagnement par une diététicienne, un soutien psychologique ou une association de patients peut aider.

## Quand demander conseil
**Consultez** si les symptômes persistent après quelques semaines de régime, s’ils réapparaissent, ou si votre enfant ne reprend pas de poids. Demandez une diététicienne pour construire des menus équilibrés.

**Si le régime pèse sur le moral** de votre enfant ou le vôtre, parlez-en au médecin ; en cas de détresse, le **3114** répond jour et nuit. En cas d’urgence (malaise, déshydratation importante), appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'maladies-chroniques', min_age_months: 24, max_age_months: 131,
    slug: 'maladie-coeliaque-suivi-ecole-remboursements',
    title: 'Maladie cœliaque : suivi médical, école et remboursement des produits sans gluten',
    summary: 'Contrôles après le diagnostic, PAI pour la cantine, paniers-repas, aide de l’Assurance Maladie pour les aliments sans gluten et démarches dans l’application ameli.',
    tags: ['maladie cœliaque', 'PAI', 'cantine sans gluten', 'panier repas', 'remboursement sans gluten', 'ALD', 'ameli'],
    sources: [S.ameliCoeliaqueSuivi, S.ameliSansGlutenRemb, S.ameliCoeliaqueRegime],
    body_md: `## En bref
- Après le diagnostic, les symptômes diminuent **en quelques semaines** de régime ; les anticorps disparaissent en général en un an environ.
- Des **prises de sang régulières** vérifient l’efficacité du régime ; une biopsie de contrôle peut être demandée.
- À la crèche et à l’école, un **PAI** organise les repas sans gluten : repas adapté par la cantine ou panier-repas.
- L’Assurance Maladie **rembourse une partie** des aliments sans gluten, sous conditions, notamment via l’application ameli.
- Diététicienne, soutien psychologique et associations de patients peuvent accompagner la famille.

## Comprendre
**Le suivi médical.** L’Assurance Maladie décrit plusieurs étapes : les symptômes s’atténuent puis disparaissent en quelques semaines ; des prises de sang régulières montrent la baisse puis la disparition des anticorps spécifiques, en général en un an environ, parfois plus. Des biopsies de contrôle de l’intestin grêle peuvent être demandées 12 à 24 mois après le début du régime. Au moment du diagnostic, des **carences** (fer, vitamine D…) peuvent nécessiter un traitement.

**L’école et la crèche.** Un **projet d’accueil individualisé (PAI)** formalise les repas sans gluten à la crèche, à l’école, au collège ou au lycée, et peut s’étendre au périscolaire. Il est élaboré à la demande de la famille, avec le médecin scolaire ou de PMI, à partir de l’ordonnance du médecin qui suit l’enfant. Deux possibilités :
- la restauration collective **fournit un repas sans gluten** ;
- la famille prépare un **panier-repas** et/ou un goûter : elle en assume alors la responsabilité, et le PAI précise le transport, le stockage et la consommation, dans le respect de la chaîne du froid.

**Le remboursement.** L’Assurance Maladie prend en charge **60 %** du prix des aliments diététiques sans gluten, dans la limite d’un plafond mensuel (plus bas pour un enfant de moins de 10 ans que pour un adulte). Conditions : une maladie cœliaque **confirmée par biopsie** et un **accord de prise en charge** au titre d’une affection de longue durée.

## Au quotidien
- **Gardez un calendrier** des prises de sang et consultations de suivi.
- **Demandez le PAI** dès l’inscription à la crèche, à l’école ou au centre de loisirs, et faites-le actualiser à chaque changement d’établissement.
- **Si vous fournissez un panier-repas** : boîte isotherme, pain de glace, contenants étiquetés au nom de l’enfant.
- **Préparez une réserve** de goûters sans gluten pour l’école et les anniversaires.
- **Pour le remboursement dans l’application ameli** (sur smartphone ou tablette, pas sur ordinateur) : activez « Mes prises en charge de la maladie cœliaque » dans les paramètres, puis, dans « Mes démarches », scannez les codes-barres des produits et indiquez le prix payé.
- **Conservez** tickets de caisse, factures et codes-barres pendant **24 mois** : ils peuvent être demandés en cas de contrôle.
- **Sans application**, un formulaire papier est envoyé par l’Assurance Maladie : on y colle les étiquettes, avec la copie de l’ordonnance et les tickets de caisse.

## Questions fréquentes
**Combien de temps avant que mon enfant aille mieux ?**
Le plus souvent, quelques semaines. Si les symptômes persistent ou si de nouveaux apparaissent, consultez : un gluten caché ou une autre cause peut être en jeu.

**La cantine est-elle obligée de proposer un repas sans gluten ?**
Le PAI organise la solution retenue avec l’établissement et la collectivité. Selon les cas, il s’agit d’un repas adapté ou d’un panier-repas fourni par la famille.

**Tous les aliments sans gluten sont-ils remboursés ?**
Non : seuls les aliments diététiques sans gluten entrant dans le dispositif, dans la limite du plafond mensuel, et pour les personnes qui ont l’accord de prise en charge.

**Où trouver du soutien ?**
L’Assurance Maladie cite l’Association française des intolérants au gluten (AFDIAG). Le médecin peut aussi proposer un soutien psychologique.

## Quand demander conseil
**Consultez** si les symptômes ne disparaissent pas après quelques semaines de régime strict, s’ils reviennent, si la croissance ne reprend pas, ou si votre enfant vit mal son régime.

En cas de détresse de votre enfant ou de vous-même, le **3114** (prévention du suicide) répond 24 h/24. En cas d’urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn'], category: 'alimentation-bebe', min_age_months: 4, max_age_months: 18,
    slug: 'gluten-et-diversification-quand-et-comment',
    title: 'Gluten et diversification : quand l’introduire et que faire en cas d’antécédents de maladie cœliaque',
    summary: 'Les repères actuels pour introduire le gluten chez le bébé, ce que l’on sait du risque de maladie cœliaque et les signes à surveiller ensuite.',
    tags: ['gluten bébé', 'diversification', 'céréales infantiles', 'maladie cœliaque', 'antécédents familiaux', 'pain bébé'],
    sources: [S.mpediaGluten, S.santeDiversif, S.brochureDiversif],
    body_md: `## En bref
- Le **gluten** peut être introduit pendant la diversification, **entre 4 et 12 mois** selon la société européenne de pédiatrie citée par mpedia.
- Le retarder **ne protège pas** de la maladie cœliaque ; l’allaitement non plus, selon les données récentes.
- On commence par de **petites quantités**, puis on augmente progressivement.
- En cas d’**antécédents familiaux** (maladie cœliaque, allergies), demandez l’avis du médecin ou de la PMI.
- Surveillez ensuite la croissance, les selles et l’appétit.

## Comprendre
Pendant longtemps, on a pensé que le moment d’introduction du gluten pouvait changer le risque de maladie cœliaque. Mpedia explique que ces notions sont aujourd’hui **discutées** : ni le retard d’introduction ni l’allaitement ne semblent modifier ce risque. Une introduction plus tardive est seulement associée à un début de maladie plus tardif.

Les repères actuels, rappelés par Santé.fr et par le guide de la diversification de Santé publique France :
- **aucun aliment autre que le lait avant 4 mois** ;
- entre 4 et 6 mois, toutes les familles d’aliments peuvent être découvertes, **y compris les allergènes et le gluten** ;
- retarder les aliments dits allergènes ne protège pas contre les allergies ;
- chez les enfants qui ont une maladie ou qui sont nés prématurés, la diversification se fait après avis médical.

Mpedia précise qu’en pratique, des farines contenant du gluten sont souvent proposées à partir de 7 mois, en petites quantités au début. Les céréales infantiles sans gluten peuvent être ajoutées au lait dès 4 mois révolus. Le lait (maternel ou infantile) reste l’aliment principal du bébé pendant la diversification.

**Si un parent, un frère ou une sœur est cœliaque**, le risque de l’enfant est plus élevé, car la maladie survient chez des personnes génétiquement prédisposées. Cela ne veut pas dire qu’il faut retarder ou supprimer le gluten, mais qu’il est utile d’en parler au médecin et d’être attentif aux signes.

## Au quotidien
- **Commencez petit** : un peu de semoule fine ou de pâtes très cuites écrasées dans une purée connue, un morceau de pain à tremper selon l’âge et la texture adaptée.
- **Un aliment nouveau à la fois**, de préférence en début de journée, pour pouvoir observer votre bébé.
- **Une fois le gluten toléré**, continuez à le proposer régulièrement.
- **Évitez les morceaux durs ou trop gros** : croûtons, biscuits qui se cassent en éclats, à cause du risque d’étouffement.
- **Notez** dans le carnet de santé la date d’introduction : utile si des symptômes apparaissent plus tard.
- **Ne passez pas au « sans gluten »** sans diagnostic : cela retarde un éventuel dépistage et complique l’alimentation.

## Questions fréquentes
**Mon bébé a 5 mois : puis-je lui proposer du pain ?**
Le gluten peut être introduit dès le début de la diversification, sous une forme adaptée à son âge et à sa capacité à mâcher et avaler. Un petit morceau de mie trempée dans une purée ou de la semoule fine sont plus sûrs qu’un croûton.

**Un parent est cœliaque : faut-il attendre 1 an ?**
Pas nécessairement : les données actuelles ne montrent pas de bénéfice à retarder. Demandez au médecin comment procéder et quels signes surveiller.

**Quels signes doivent faire penser à une maladie cœliaque après l’introduction ?**
Diarrhée qui dure, ventre gonflé, perte d’appétit, poids ou taille qui stagnent, bébé triste ou inhabituellement calme. Le médecin peut alors prescrire une prise de sang.

**Les céréales infantiles « avec gluten » sont-elles indispensables ?**
Non. Pain, pâtes, semoule adaptés à l’âge apportent aussi du gluten. L’essentiel est la régularité et la progressivité.

## Quand demander conseil
**Consultez** si votre bébé a une diarrhée persistante, des vomissements, le ventre gonflé et douloureux, s’il refuse de manger ou si sa courbe de poids ralentit.

**Appelez le 15 ou le 112** en cas de gonflement du visage, de gêne respiratoire ou de malaise après un aliment, ou si votre bébé est très somnolent et ne boit plus.

${FIN}`,
  },
  // ------------------------------------------------------------------ grossesse, allaitement, prévention
  {
    ...BASE, journeys: ['pregnant'], category: 'alimentation-grossesse',
    slug: 'enceinte-faut-il-eviter-les-allergenes',
    title: 'Enceinte : faut-il éviter l’arachide, l’œuf ou le lait pour prévenir l’allergie de bébé ?',
    summary: 'Pourquoi les régimes d’éviction pendant la grossesse ne sont plus conseillés, ce qui compte vraiment quand la famille est allergique et à qui en parler.',
    tags: ['grossesse', 'allergie bébé', 'arachide enceinte', 'régime d’éviction', 'terrain allergique', 'prévention allergie'],
    sources: [S.santeAllergie, S.santePrevenir, S.mpediaPrevention],
    body_md: `## En bref
- **Éviter les allergènes** pendant la grossesse **ne prévient pas** les allergies chez les bébés à risque, selon Santé.fr.
- La tolérance aux aliments **commence à se construire in utero** : une petite partie des protéines que vous mangez passe jusqu’au fœtus.
- Sauf raison médicale, une femme enceinte **n’a pas à faire de régime d’exclusion** : alimentation variée, sans excès.
- Le risque d’allergie est plus élevé quand un parent ou un aîné est allergique : parlez-en à la sage-femme ou au médecin.
- Si vous êtes vous-même allergique, **continuez votre propre régime** d’éviction.

## Comprendre
Il y a quelques années, on conseillait parfois aux futures mères de familles allergiques de supprimer certains aliments (arachide, œuf, lait…) pendant la grossesse et l’allaitement. Ces pratiques ont été abandonnées : Santé.fr indique qu’éviter les allergènes pendant la grossesse ou l’allaitement **ne prévient pas** les allergies chez les nourrissons à risque. Un régime inutile peut en revanche **déséquilibrer** votre alimentation au moment où vos besoins augmentent.

Mpedia explique pourquoi : la **tolérance alimentaire** se met en place très tôt. Une petite partie des protéines consommées par la mère passe dans le sang du fœtus, puis, après la naissance, dans le lait maternel. Ce contact précoce et progressif aide l’organisme du bébé à reconnaître ces aliments comme inoffensifs. La femme enceinte ou allaitante « ne doit pas faire de régime » et doit consommer tous types d’aliments, sans excès, sauf rares cas médicaux.

**Qui est « à risque » ?** Selon mpedia, le risque d’allergie de l’enfant est d’environ 20 % quand un parent du premier degré (père, mère, frère, sœur) a une allergie prouvée, et d’environ 43 % quand les deux parents sont allergiques. Ce sont des repères, pas des prédictions : beaucoup d’enfants de parents allergiques ne le deviennent pas.

**Ce qui aide vraiment, d’après les repères actuels :** allaiter si vous le pouvez et le souhaitez, débuter la diversification entre 4 et 6 mois, puis proposer **tous les aliments**, y compris les allergènes, sans les retarder.

## Au quotidien
- **Mangez varié** : fruits, légumes, féculents, produits laitiers pasteurisés, protéines, en suivant les précautions habituelles de la grossesse (pas d’alcool, pas de lait cru, viandes et œufs bien cuits).
- **Ne supprimez pas** l’arachide, les œufs, le poisson ou le lait « au cas où ».
- **Signalez les antécédents familiaux** d’allergie à votre sage-femme ou médecin, et notez-les pour le pédiatre.
- **Si vous êtes allergique**, gardez votre régime d’éviction, votre trousse d’urgence si elle a été prescrite, et faites le point avec votre médecin.
- **Préparez l’après** : renseignez-vous sur la diversification et sur les laits adaptés si vous n’allaitez pas, à discuter avec le pédiatre.

## Questions fréquentes
**Le papa est allergique à l’arachide : dois-je arrêter d’en manger ?**
Non, sauf si vous êtes vous-même allergique. L’éviction pendant la grossesse ne protège pas votre bébé.

**Les probiotiques ou compléments « anti-allergie » sont-ils utiles ?**
Ne prenez aucun complément sans avis médical pendant la grossesse, même s’il est vendu librement : certains peuvent être contre-indiqués. Rien ne justifie de les prendre « pour prévenir l’allergie » sans conseil d’un professionnel.

**L’allaitement protège-t-il complètement des allergies ?**
Il est présenté comme la meilleure prévention, mais il n’est pas efficace à 100 %.

**Faut-il un lait spécial si je n’allaite pas ?**
Pour un bébé à risque, le pédiatre peut conseiller un lait hypoallergénique (HA). Parlez-en avant la naissance.

## Quand demander conseil
**Parlez-en** à votre sage-femme, votre médecin ou à la consultation de suivi si votre famille compte plusieurs allergiques, si vous suivez un régime particulier ou si vous avez du mal à manger équilibré.

**Appelez le 15 ou le 112** si vous présentez vous-même une réaction allergique importante (gonflement du visage, gêne respiratoire, malaise). Si l’anxiété autour de la santé de votre futur bébé devient envahissante, parlez-en ; en cas de détresse, le **3114** répond 24 h/24.

${FIN}`,
  },
  {
    ...BASE, journeys: ['pregnant', 'ttc'], category: 'alimentation-grossesse',
    slug: 'enceinte-et-allergique-ou-coeliaque',
    title: 'Enceinte avec une allergie alimentaire ou une maladie cœliaque : garder un régime sûr et équilibré',
    summary: 'Poursuivre son régime d’éviction ou sans gluten pendant la grossesse, couvrir ses besoins en fer, calcium et folates, et préparer la trousse d’urgence.',
    tags: ['grossesse', 'allergie alimentaire', 'maladie cœliaque', 'sans gluten enceinte', 'carences', 'vitamine B9', 'trousse d’urgence'],
    sources: [S.ameliGrossesseAlim, S.ameliAllergieConsult, S.ameliCoeliaqueRegime],
    body_md: `## En bref
- Une allergie alimentaire ou une maladie cœliaque **ne s’arrête pas** pendant la grossesse : votre régime reste nécessaire.
- Les besoins augmentent, notamment en **fer, calcium, vitamine D et folates (vitamine B9)** : un régime restrictif demande plus d’attention.
- Parlez de votre régime **dès le début** à votre sage-femme ou à votre médecin, comme le conseille l’Assurance Maladie.
- Ne prenez **aucun complément** sans avis médical.
- Si une trousse d’urgence vous a été prescrite, gardez-la sur vous et signalez votre grossesse au médecin qui vous suit pour l’allergie.

## Comprendre
Pendant la grossesse, l’Assurance Maladie recommande une alimentation équilibrée et diversifiée : fruits et légumes, féculents à chaque repas, produits laitiers, protéines chaque jour, eau à volonté. Certains besoins augmentent :
- la **vitamine B9** (folates), essentielle au développement du système nerveux de l’embryon, fait l’objet d’un complément prescrit idéalement avant la conception et jusqu’à 12 semaines d’aménorrhée ;
- le **calcium**, surtout au 3e trimestre, dont les produits laitiers sont la meilleure source ;
- la **vitamine D**, qui aide à absorber le calcium ;
- le **fer**, surtout en fin de grossesse.

**Si vous êtes allergique au lait**, l’apport en calcium devient un vrai sujet ; **si vous êtes cœliaque**, l’Assurance Maladie rappelle que des carences en fer ou en vitamine D sont fréquentes au moment du diagnostic, et que le régime réduit l’apport en fibres. D’où l’intérêt d’un accompagnement par une diététicienne.

**Le régime d’éviction reste la règle.** L’Assurance Maladie insiste : suivre le régime prescrit, lire attentivement les étiquettes, être prudente avec les produits non emballés et signaler son allergie au restaurant. Le **régime sans gluten strict** reste le seul traitement efficace de la maladie cœliaque.

## Au quotidien
- **Faites un point** avec votre sage-femme ou médecin dès la déclaration de grossesse : régime suivi, aliments exclus, compléments déjà pris.
- **Demandez une diététicienne** pour vérifier que vos menus couvrent les besoins de la grossesse.
- **Si vous évitez le lait** : demandez comment couvrir vos besoins en calcium (eaux minérales riches en calcium, autres aliments, complément si le médecin le juge utile).
- **Si vous êtes cœliaque** : choisissez des féculents complets sans gluten (riz complet, sarrasin, quinoa, maïs), des légumineuses, des légumes, pour les fibres et le fer.
- **Nausées du début de grossesse** : préparez des en-cas sûrs (galettes de riz, fruits, compotes) pour ne pas « craquer » sur un produit non vérifié.
- **À la maternité** : signalez votre allergie ou votre régime sans gluten lors de l’inscription, pour les repas pendant le séjour.
- **Trousse d’urgence** : vérifiez les dates de péremption et gardez-la à portée.

## Questions fréquentes
**Mon allergie risque-t-elle d’être transmise à mon bébé ?**
Le terrain allergique augmente le risque, sans le rendre certain. Ce n’est pas une raison pour éviter d’autres aliments que ceux qui vous sont interdits.

**Je suis cœliaque : faut-il un suivi particulier pendant la grossesse ?**
Parlez-en à votre médecin et à la sage-femme : ils pourront adapter le suivi, par exemple pour rechercher une carence en fer, et vérifier avec vous que votre régime reste équilibré.

**Puis-je prendre un complément « spécial grossesse » vendu librement ?**
Pas sans avis médical : l’Assurance Maladie rappelle que certains contiennent des vitamines ou oligo-éléments dont un apport élevé est contre-indiqué pendant la grossesse. Vérifiez aussi la présence d’allergènes ou de gluten dans la composition.

**Mes réactions allergiques peuvent-elles changer pendant la grossesse ?**
Chaque situation est différente. Signalez toute réaction nouvelle ou plus forte à votre médecin.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de gonflement du visage, des lèvres ou de la gorge, de gêne respiratoire, de malaise ou de vomissements après un repas. Utilisez votre auto-injecteur s’il a été prescrit, sans attendre.

**Consultez** si vous avez du mal à vous nourrir, si vous perdez du poids, si vous êtes très fatiguée ou si vous doutez de votre régime. Si l’inquiétude prend trop de place, parlez-en ; le **3114** répond en cas de détresse.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'pregnant'], category: 'alimentation-bebe', max_age_months: 12,
    slug: 'bebe-a-risque-d-allergie-ce-qui-aide-vraiment',
    title: 'Bébé à risque d’allergie : allaitement, lait HA, diversification… ce qui aide vraiment',
    summary: 'Qui est concerné, ce que disent les repères actuels sur l’allaitement, les laits hypoallergéniques et l’introduction des allergènes, et les soins de peau.',
    tags: ['bébé à risque allergique', 'terrain atopique', 'lait HA', 'hypoallergénique', 'allaitement', 'diversification', 'prévention allergie'],
    sources: [S.mpediaPrevention, S.brochureDiversif, S.mpediaEczema],
    body_md: `## En bref
- Un bébé est dit **à risque** quand un parent, un frère ou une sœur a une **allergie prouvée**.
- L’**allaitement** est la meilleure prévention connue, sans être efficace à 100 %.
- Sans allaitement (ou en complément), le pédiatre peut conseiller un **lait hypoallergénique (HA) 1er âge** ; il ne traite pas une allergie déjà présente.
- La diversification commence **entre 4 et 6 mois** et les aliments allergisants **ne sont pas retardés**.
- Hydrater la peau en cas d’eczéma fait partie des soins de base.

## Comprendre
Mpedia chiffre le risque : environ **20 %** quand un parent du premier degré a une allergie prouvée, environ **43 %** quand les deux parents sont allergiques, et environ **33 %** d’allergie aux protéines du lait de vache quand un aîné en a eu une.

**Ce qui est recommandé aujourd’hui :**
- **Allaiter** si vous le pouvez et le souhaitez : une petite partie des protéines de votre alimentation passe dans le lait et aide votre bébé à construire sa tolérance. Vous n’avez pas de régime d’exclusion à suivre.
- **Si vous n’allaitez pas ou si vous complétez**, un lait **HA 1er âge** ayant fait preuve de son efficacité est recommandé pour les bébés à risque, à valider avec le pédiatre.
- **Diversifier entre 4 et 6 mois**, ni avant, ni après, en introduisant chaque aliment progressivement.
- **Ne pas retarder** les aliments réputés allergènes (œuf, poisson, arachide sous forme adaptée, fruits à coque en poudre, gluten, kiwi, céleri…) : le guide de la diversification de Santé publique France rappelle que plus les enfants les goûtent tôt, plus leur tolérance se développe.

En cas d’antécédents familiaux d’allergie, ce même guide conseille de **demander l’avis du médecin traitant ou de la PMI** avant de commencer.

**Et la peau ?** Mpedia rappelle que l’eczéma du nourrisson n’est pas forcément une allergie, mais qu’une peau mal protégée peut s’enflammer plus facilement. Les émollients appliqués tous les jours restaurent la barrière cutanée. Chez les bébés à risque, l’allaitement exclusif des premiers mois pourrait réduire le risque d’eczéma.

## Au quotidien
- **Préparez la question avant la naissance** : notez les allergies de chaque parent et des aînés, et parlez-en à la maternité ou au pédiatre.
- **Biberons de complément à la maternité** : si vous souhaitez un lait HA, signalez-le à l’équipe.
- **Diversification** : un nouvel aliment à la fois, en petite quantité, mélangé à une purée connue, de préférence le matin ou à midi. Œuf toujours bien cuit, arachide en pâte diluée, fruits à coque en poudre, jamais entiers.
- **Une fois un aliment toléré**, proposez-le régulièrement.
- **Soins de peau** : bain court et tiède, produits lavants sans savon ni parfum, séchage en tamponnant, émollient quotidien.
- **Notez toute réaction** (heure, aliment, signes) et montrez-la au médecin.

## Questions fréquentes
**Le lait HA convient-il à un bébé déjà allergique au lait de vache ?**
Non. Les laits HA servent à la prévention ; un bébé qui a déjà des symptômes a besoin d’un lait spécifique prescrit par le médecin.

**Faut-il éviter les animaux, les fleurs, le tabac ?**
Le tabac est à éviter dans l’entourage de tous les bébés. Pour le reste, demandez conseil au pédiatre selon votre situation.

**Doit-on faire des tests d’allergie avant la diversification ?**
Ce n’est pas systématique. Le médecin peut le proposer, par exemple si votre bébé a un eczéma important ou a déjà réagi à un aliment.

**Diversifier plus tard protège-t-il ?**
Non : il n’est plus recommandé de retarder la diversification chez les enfants à risque.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre bébé présente un gonflement du visage, une gêne respiratoire, une pâleur, une somnolence inhabituelle ou des vomissements répétés après un aliment.

**Consultez** en cas de plaques qui démangent, d’eczéma qui s’étend ou ne s’améliore pas, de troubles digestifs persistants ou de toute réaction après un nouvel aliment.

${FIN}`,
  },
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'sante-bebe', max_age_months: 36,
    slug: 'eczema-du-bebe-est-ce-une-allergie-alimentaire',
    title: 'Eczéma du bébé : est-ce une allergie alimentaire ?',
    summary: 'Le lien réel entre eczéma atopique et alimentation, les soins de peau qui comptent, les régimes à ne pas faire seul et quand demander un bilan allergologique.',
    tags: ['eczéma bébé', 'dermatite atopique', 'allergie alimentaire', 'émollient', 'peau sèche', 'bilan allergologique'],
    sources: [S.mpediaEczema, S.ameliAllergieDef, S.ameliAllergieConsult],
    body_md: `## En bref
- L’**eczéma atopique** du nourrisson est fréquent, non contagieux, et **n’est pas forcément une allergie**.
- Chez environ **un tiers** des nourrissons concernés, certains aliments peuvent le déclencher ou l’aggraver (lait de vache, œuf, oléagineux, céréales).
- La base du traitement, ce sont les **soins de peau quotidiens** (émollients) et les traitements prescrits lors des poussées.
- **Ne supprimez pas d’aliments** sans avis médical : un régime inutile peut déséquilibrer l’alimentation.
- Un **bilan allergologique** se discute avec le médecin selon la situation.

## Comprendre
Mpedia décrit l’eczéma atopique (ou dermatite atopique) comme une maladie inflammatoire chronique de la peau, qui apparaît souvent **vers 2 à 6 mois**. Elle évolue par poussées, entrecoupées de périodes calmes, et régresse avec l’âge chez la plupart des enfants. Avant 2 ans, les plaques touchent surtout les joues, le front, le menton et le corps, mais pas le siège ; après 2 ans, elles se placent plutôt dans les plis, sur les mains, les poignets et les chevilles.

Les déclencheurs sont multiples : saison, pollution, stress, irritants (lessive, adoucissant, gel lavant), allergies respiratoires… et parfois **allergies alimentaires**. L’Assurance Maladie souligne que l’eczéma est très fréquent chez les nourrissons allergiques : 80 % d’entre eux ont des signes cutanés la première année, mais seulement 4 % restent concernés après 15 ans.

**Eczéma et allergie : qui vient en premier ?** Une peau sèche et fragile laisse plus facilement entrer les irritants. L’eczéma n’est donc pas toujours la conséquence d’un aliment. C’est pourquoi le médecin regarde l’ensemble : ancienneté, étendue, réponse aux soins, autres signes (digestifs, respiratoires), réactions rapides après un repas.

**Le bilan.** Si une allergie est suspectée, le médecin peut orienter vers un allergologue. L’Assurance Maladie précise que les tests cutanés (prick-tests) se pratiquent chez le jeune enfant, mais ne sont pas toujours réalisables en cas d’eczéma très étendu : une prise de sang peut alors être proposée.

## Au quotidien
- **Émollient tous les jours**, parfois plusieurs fois par jour, même quand la peau va bien : c’est ce qui espace les poussées.
- **Bain court**, eau tiède, sans savon, un jour sur un ou deux ; séchage en tamponnant, puis émollient.
- **Produits lavants doux**, sans parfum ; lessive liquide peu ou non parfumée, peu d’assouplissant.
- **Vêtements en coton**, ongles courts pour limiter les lésions de grattage.
- **Pendant les poussées**, utilisez le traitement prescrit comme indiqué par le médecin, sans l’arrêter trop tôt par crainte.
- **Tenez un journal** si vous suspectez un aliment : date, aliment, délai, aspect de la peau, photos.
- **Diversification** : continuez à introduire les aliments selon les repères, en demandant conseil au médecin si l’eczéma est important.

## Questions fréquentes
**Faut-il arrêter le lait ou l’œuf pour soigner l’eczéma ?**
Pas sans avis médical. Un régime n’a d’intérêt que si une allergie est démontrée, et l’éviction se fait alors de façon encadrée.

**L’eczéma de mon bébé va-t-il le suivre toute sa vie ?**
Le plus souvent, il régresse avec l’âge. Certains enfants gardent une peau sensible ou développent d’autres manifestations allergiques : le suivi permet de les repérer.

**Les crèmes prescrites pour les poussées sont-elles dangereuses ?**
Utilisées comme le médecin l’a indiqué, elles sont le traitement de référence des poussées. Posez toutes vos questions lors de la consultation.

**Mon bébé allaité a de l’eczéma : dois-je changer mon alimentation ?**
Non, sauf avis médical. Le régime de la mère n’est discuté que dans des situations précises, rares.

## Quand demander conseil
**Consultez** si l’eczéma s’étend, saigne, suinte, forme des croûtes jaunes ou des petites cloques, s’il empêche votre bébé de dormir, ou s’il ne s’améliore pas malgré les soins. Consultez aussi si des plaques, un gonflement ou des troubles digestifs apparaissent peu après un aliment.

**Appelez le 15 ou le 112** en cas de gonflement du visage, de gêne respiratoire ou de malaise, ou si votre bébé a de la fièvre et une éruption qui s’aggrave très vite.

${FIN}`,
  },
  // ------------------------------------------------------------------ urgences
  {
    ...BASE, journeys: ['newborn', 'child'], category: 'premiers-secours', max_age_months: 131, safety_critical: true,
    slug: 'choc-anaphylactique-enfant-reconnaitre-et-agir',
    title: 'Choc anaphylactique et œdème de Quincke chez l’enfant : reconnaître et agir',
    summary: 'Les signes d’une réaction allergique grave, les gestes à faire en attendant les secours et ce qui se passe après.',
    tags: ['choc anaphylactique', 'anaphylaxie', 'œdème de Quincke', 'urgence allergie', 'adrénaline', '15', '112', 'gonflement visage'],
    sources: [S.ameliAllergieDef, S.ameliQuincke, S.croixRougeQuincke],
    body_md: `## En bref
- Le **choc anaphylactique** est la réaction allergique la plus grave : il touche **plusieurs organes** à la fois et met la vie en danger.
- L’**œdème de Quincke** est un gonflement brutal du visage, des lèvres, de la langue ou de la gorge : il est grave quand il gêne la respiration.
- Le geste qui sauve : **l’adrénaline** en injection dans la cuisse, si un auto-injecteur a été prescrit, **sans attendre** les secours.
- **Appelez le 15 ou le 112** immédiatement, même si l’injection a été faite.
- Toute injection d’adrénaline impose une **surveillance à l’hôpital**.

## Comprendre
Selon l’Assurance Maladie, le choc anaphylactique peut associer :
- des signes **neurologiques** : vertiges, malaise, perte de connaissance ;
- des signes **respiratoires** : crise d’asthme, gêne pour respirer ;
- des signes **digestifs** : vomissements importants, douleurs de ventre ;
- des signes **cutanés et muqueux** : urticaire étendue, gonflement (œdème de Quincke) ;
- des signes **cardiovasculaires** : troubles du rythme, chute de tension.

L’**œdème de Quincke** (angiœdème) touche surtout la tête et le cou. Il devient dangereux quand il atteint la gorge ou le larynx, car il peut empêcher l’air de passer. Les aliments (fruits de mer, fruits à coque…), les médicaments, les piqûres d’insectes et le latex sont les principaux allergènes en cause. Les signes surviennent vite, en général en moins de deux heures, et un nouveau contact peut provoquer une réaction plus rapide et plus intense.

**Les signes d’alerte** à connaître, d’après l’Assurance Maladie et la Croix-Rouge : gonflement soudain du visage, des lèvres, des yeux, de la langue ; voix faible, rauque ou changée ; sensation de gorge serrée ; difficulté à avaler ; respiration bruyante ou difficile ; malaise, grande faiblesse, pâleur, agitation ; nausées, vomissements, diarrhée, douleurs abdominales.

## Au quotidien
**Les gestes en cas de réaction grave :**
1. **Injectez l’adrénaline** si un auto-injecteur a été prescrit : sur la face externe de la cuisse, en maintenant la pression le temps indiqué (l’Assurance Maladie mentionne 10 secondes). Cela peut se faire à travers les vêtements si la notice le prévoit.
2. **Appelez le 15 ou le 112** (gratuits, même depuis un téléphone verrouillé ou sans crédit). Donnez votre nom, votre numéro, l’adresse exacte (étage, code), l’âge de l’enfant, ce qu’il a mangé, les signes observés, et l’injection faite. Ne raccrochez pas avant qu’on vous le dise.
3. **Installez l’enfant dans la position où il respire le mieux** : assis à demi s’il a du mal à respirer, allongé sur le dos s’il est très faible ou pâle. Desserrez ses vêtements, rassurez-le, ne lui donnez rien à manger ni à boire.
4. **Surveillez** sa respiration et sa conscience jusqu’à l’arrivée des secours. Notez l’heure de l’injection.
5. **Suivez le protocole écrit** (PAI, ordonnance) remis par le médecin, qui peut prévoir d’autres étapes.

**Après la crise**, consultez le médecin pour confirmer la cause et faire un bilan allergologique : il pourra prescrire une trousse d’urgence et un protocole si ce n’est pas déjà fait.

## Questions fréquentes
**J’ai peur de faire l’injection « pour rien ». Que faire en cas de doute ?**
Suivez le protocole établi par le médecin. En cas de doute sur une réaction grave, appelez le 15 : le médecin régulateur vous guidera. L’Assurance Maladie recommande d’utiliser le stylo dès les premiers signes, sans attendre les secours.

**Les signes ont disparu après l’injection : faut-il quand même aller à l’hôpital ?**
Oui. Toute injection d’adrénaline nécessite une surveillance médicale et une prise en charge hospitalière.

**Une réaction légère la première fois veut-elle dire que la suivante sera légère ?**
Non. Les personnes qui font un choc ont souvent eu auparavant une réaction moins forte. Toute réaction doit être signalée au médecin.

**L’effort physique peut-il jouer ?**
Oui, surtout chez l’adulte : l’Assurance Maladie décrit des chocs déclenchés par un effort après un repas contenant de la farine de blé ou des épices.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** dès qu’un gonflement du visage, de la langue ou de la gorge, une gêne respiratoire, une voix changée, un malaise ou plusieurs signes associés apparaissent après un aliment, une piqûre ou un médicament.

**Consultez ensuite** votre médecin pour un bilan, même si tout est rentré dans l’ordre.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'premiers-secours', max_age_months: 131, safety_critical: true,
    slug: 'auto-injecteur-adrenaline-enfant-au-quotidien',
    title: 'Stylo d’adrénaline de l’enfant : l’avoir sur soi, savoir l’utiliser, le transmettre',
    summary: 'Ce que contient la trousse d’urgence, comment s’entraîner, où ranger les stylos, vérifier les dates et former l’entourage, l’école et l’enfant lui-même.',
    tags: ['auto-injecteur', 'stylo adrénaline', 'trousse d’urgence', 'allergie grave', 'PAI', 'carte d’allergie', 'stylo d’entraînement'],
    sources: [S.ameliAllergieConsult, S.ameliQuincke, S.boPai],
    body_md: `## En bref
- En cas d’allergie marquée, le médecin peut prescrire une **trousse d’urgence** avec un **auto-injecteur d’adrénaline**, à utiliser **sans attendre** les secours.
- Elle doit **toujours accompagner l’enfant** : maison, école, sorties, vacances.
- Entraînez-vous avec le **stylo d’entraînement** et apprenez le geste à l’entourage.
- Vérifiez régulièrement les **dates de péremption** et renouvelez l’ordonnance chaque année.
- Après toute injection : **15 ou 112** et passage à l’hôpital.

## Comprendre
L’adrénaline est le traitement d’urgence du choc anaphylactique : elle accélère le cœur, fait remonter la tension et ouvre les bronches. L’auto-injecteur permet de l’administrer rapidement dans le muscle de la cuisse. Le choix du dispositif et du dosage relève exclusivement du médecin, selon l’âge et le poids de l’enfant.

À l’issue du bilan, l’allergologue remet en général une **carte d’allergie** (allergènes, réactions possibles, numéros d’urgence, personnes à prévenir) et, si besoin, la composition de la trousse d’urgence et le **protocole de soins** associé, explique l’Assurance Maladie.

**Les consignes d’usage** données par l’Assurance Maladie :
- garder le stylo **toujours sur soi** ;
- savoir **reconnaître les premiers signes** d’un choc et manipuler le stylo, en s’entraînant avec le stylo d’entraînement ;
- appliquer le stylo sur le **bord extérieur de la cuisse** et maintenir la pression sur le bouton pendant **dix secondes** ;
- **informer l’entourage** de son mode d’emploi.

**À l’école**, la circulaire de 2021 sur le PAI prévoit que la trousse d’urgence et les médicaments soient rangés dans un **lieu repérable par tous les adultes** concernés et inaccessible aux élèves, et qu’ils soient **emportés à chaque sortie** avec le PAI. À chaque rentrée, la famille fournit une ordonnance à jour et des médicaments dont la date de péremption a été vérifiée.

## Au quotidien
- **Préparez une trousse complète** : stylo(s) prescrit(s), copie de l’ordonnance et du protocole, carte d’allergie, numéros à appeler.
- **Rangez-la** à l’abri de la chaleur et du froid extrêmes, comme indiqué sur la notice, et jamais dans une voiture en plein soleil.
- **Notez les dates de péremption** dans votre agenda ou votre téléphone, avec un rappel un mois avant.
- **Entraînez-vous régulièrement** avec le stylo d’entraînement, et faites essayer les grands-parents, la nounou, les parents des copains.
- **Apprenez à votre enfant**, selon son âge, à reconnaître les signes, à dire « je suis allergique », à montrer où est sa trousse et, quand il est assez grand et si le médecin l’y autorise, à se faire l’injection.
- **À l’école et à la crèche** : PAI signé, trousse remise, adultes formés par le médecin scolaire ou de la structure.
- **En voyage** : trousse en bagage à main, ordonnance avec vous, numéros d’urgence du pays notés.

## Questions fréquentes
**Combien de stylos faut-il ?**
C’est le médecin qui le décide, selon la situation. Prévoyez assez de trousses pour les différents lieux de vie de votre enfant, comme il vous l’indiquera.

**Peut-on faire l’injection à travers un pantalon ?**
Suivez la notice de votre dispositif et les consignes du médecin : elles précisent si l’injection est possible à travers les vêtements.

**Mon enfant a peur de la piqûre. Comment l’aider ?**
Jouez avec le stylo d’entraînement, sans aiguille, pour dédramatiser. Expliquez-lui que ce geste le protège et qu’il est rapide.

**Le stylo est périmé et une réaction survient : que faire ?**
Appelez immédiatement le 15 ou le 112 et suivez les consignes du médecin régulateur. Ensuite, faites renouveler la trousse sans tarder.

## Quand demander conseil
**Appelez le 15 ou le 112** dès qu’une réaction allergique grave se présente, que l’injection ait été faite ou non : une surveillance à l’hôpital est toujours nécessaire après l’adrénaline.

**Consultez** votre médecin ou l’allergologue pour faire réévaluer la trousse chaque année, après toute réaction, quand votre enfant a beaucoup grandi, ou si vous vous sentez mal à l’aise avec le geste.

${FIN}`,
  },
  // ------------------------------------------------------------------ démarches et vie pratique
  {
    ...BASE, journeys: ['child', 'newborn'], category: 'ecole-garde', max_age_months: 131,
    slug: 'pai-allergie-alimentaire-etapes-renouvellement-sorties',
    title: 'PAI pour une allergie ou une intolérance alimentaire : les étapes, le renouvellement et les sorties',
    summary: 'Qui demande le PAI, qui le rédige, ce qu’il contient, comment il est renouvelé, ce qui est prévu pour la cantine, le périscolaire, les sorties et la confidentialité.',
    tags: ['PAI', 'projet d’accueil individualisé', 'allergie école', 'crèche allergie', 'cantine', 'sortie scolaire', 'trousse d’urgence', 'périscolaire'],
    sources: [S.boPai, S.ameliPai, S.eduPai],
    body_md: `## En bref
- Le **projet d’accueil individualisé (PAI)** permet d’accueillir en collectivité un enfant qui a un problème de santé durable, comme une allergie alimentaire ou une maladie cœliaque.
- Il est établi **à la demande de la famille** (ou proposé par l’école avec son accord), à partir de l’ordonnance du médecin qui suit l’enfant.
- Il précise le **régime**, les **aliments exclus**, la **trousse d’urgence** et la **conduite à tenir**.
- Il vaut pour la durée de la scolarité **dans le même établissement**, à condition de transmettre chaque année les documents à jour.
- La trousse et le PAI **suivent l’enfant lors des sorties**.

## Comprendre
La circulaire du 10 février 2021 encadre le PAI pour raison de santé. Elle s’applique à l’école et aux établissements scolaires, sert de référence aux **crèches**, haltes-garderies et jardins d’enfants, et peut s’étendre au **temps périscolaire** (cantine, centre de loisirs) quand l’organisateur signe le PAI.

**Les acteurs :**
- **vous, les parents** : vous demandez le PAI, fournissez les documents, le matériel et les médicaments, et informez toutes les structures qui accueillent votre enfant ;
- **le médecin qui suit l’enfant** : il rédige l’ordonnance et la fiche « conduite à tenir en cas d’urgence », transmises **sous pli confidentiel** ;
- **le médecin de l’Éducation nationale** (ou de la PMI, ou de la structure) : il examine la demande, rédige et signe le PAI, et forme les équipes aux gestes d’urgence ;
- **le directeur ou chef d’établissement** : il organise la mise en œuvre, informe l’équipe (y compris les remplaçants) et veille au rangement des médicaments.

**Le contenu :** une partie administrative, les aménagements (régime, horaires, dispenses, activités de remplacement), une partie spécifique à la pathologie qui constitue la fiche d’urgence, et, le cas échéant, un volet périscolaire. Le diagnostic n’a pas à y figurer : seules les conséquences utiles à l’accueil sont partagées.

**La cantine.** L’enfant doit pouvoir déjeuner avec les autres. Tout enfant dont le régime est défini dans le PAI doit pouvoir accéder à la restauration collective ; le **panier-repas** n’est pas la première solution et se fait sous conditions strictes. Le PAI concerne les allergies ou intolérances **médicalement avérées**, pas les choix familiaux.

## Au quotidien
- **Anticipez** : demandez le PAI dès l’inscription, sans attendre la rentrée.
- **Préparez le dossier** avec votre médecin : ordonnance récente, fiche de conduite à tenir, médicaments en quantité suffisante.
- **À chaque rentrée**, demandez la poursuite du PAI et fournissez une nouvelle ordonnance, des médicaments **non périmés** et la fiche d’urgence actualisée si besoin. En attendant, le PAI de l’année précédente reste valide pour éviter une rupture.
- **Sorties et voyages scolaires** : le PAI précise si votre enfant peut y participer, avec ou sans nuitée, et comment. La trousse et le PAI doivent être emportés à chaque sortie.
- **Changement d’école ou de collège** : un nouveau PAI est élaboré dans le nouvel établissement.
- **Centre de loisirs, sport, garderie** : vérifiez que l’organisateur a bien signé le volet périscolaire.

## Questions fréquentes
**Le PAI est-il obligatoire ?**
Il est établi à la demande de la famille. Il protège votre enfant en organisant clairement qui fait quoi en cas de problème.

**Le personnel peut-il refuser de faire l’injection ?**
Le PAI désigne les conduites à tenir et le médecin forme les équipes. Les enseignants et personnels en contact avec l’élève prennent connaissance des gestes et les appliquent, y compris lors des sorties. En cas d’urgence, le 15 est toujours appelé.

**Que se passe-t-il si l’ordonnance a expiré ?**
Sans ordonnance valide ni trousse à jour, les soins prévus ne peuvent être mis en œuvre qu’une fois les éléments fournis. En cas d’urgence, le personnel appelle le 15. D’où l’importance de tout renouveler à temps.

**Le nom de mon enfant sera-t-il affiché ?**
Non : l’affichage public des noms et des pathologies est strictement interdit. Les informations sont partagées avec votre accord et limitées au nécessaire.

## Quand demander conseil
**Contactez** le directeur, le médecin ou l’infirmier scolaire si le PAI n’est pas en place à la rentrée, si une sortie se prépare ou si la situation de votre enfant change. Faites relire la fiche d’urgence par votre médecin après toute réaction.

**En cas de réaction grave**, le personnel suit la fiche d’urgence et appelle le **15** ou le **112**.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child', 'newborn', 'pregnant'], category: 'alimentation',
    slug: 'lire-les-etiquettes-allergenes-traces-vrac-restaurant',
    title: 'Lire les étiquettes quand on est allergique : 14 allergènes, mentions de traces, vrac et restaurant',
    summary: 'Ce que la loi impose sur les emballages, ce que signifie « peut contenir des traces », comment obtenir l’information en boulangerie, au marché ou au restaurant.',
    tags: ['étiquette', 'allergènes', '14 allergènes', 'traces', 'vrac', 'restaurant allergie', 'boulangerie', 'règlement INCO'],
    sources: [S.santeAllergenes, S.ameliAllergieConsult, S.ecoEtiquetage],
    body_md: `## En bref
- En Europe, **14 catégories d’allergènes** doivent être signalées sur les produits alimentaires.
- Sur un produit **emballé**, ils figurent dans la liste des ingrédients et sont **mis en évidence** (gras, souligné, italique…).
- Pour les produits **non emballés** (boulangerie, traiteur, marché, restaurant), l’information doit être disponible **par écrit**.
- « **Peut contenir des traces de…** » signale un risque de contamination accidentelle, pas un ingrédient ajouté.
- La lecture des étiquettes est **le premier moyen** de réduire le risque.

## Comprendre
**Les 14 allergènes** listés par la réglementation européenne (règlement dit « INCO ») :
1. céréales contenant du **gluten** (blé, seigle, orge, avoine, épeautre, kamut et hybrides) ;
2. **crustacés** ;
3. **œufs** ;
4. **poissons** ;
5. **arachides** ;
6. **soja** ;
7. **lait** (y compris le lactose) ;
8. **fruits à coque** (amandes, noisettes, noix, cajou, pécan, macadamia, noix du Brésil, du Queensland, pistaches) ;
9. **céleri** ;
10. **moutarde** ;
11. **graines de sésame** ;
12. **anhydride sulfureux et sulfites** au-delà d’un certain seuil ;
13. **lupin** ;
14. **mollusques**.

**Sur les produits emballés**, la DGCCRF précise que chaque allergène doit apparaître sous son **nom clair** dans la liste des ingrédients (par exemple « lécithine de soja », et non simplement « lécithine » ou un code d’additif), et être mis en relief. Les produits sans liste d’ingrédients portent la mention « **contient** » suivie de l’allergène.

**Pour les produits non emballés**, un décret de 2015 impose une information **écrite**, placée près du produit. Au restaurant, l’Assurance Maladie rappelle que l’établissement doit tenir une information écrite sur les allergènes à disposition des clients.

**Les traces.** Les règles portent sur les ingrédients ajoutés volontairement. Une contamination accidentelle (fabrication, stockage, transport) reste possible ; les fabricants doivent évaluer et réduire ce risque. La mention « peut contenir des traces » est une solution de dernier recours, quand le risque ne peut pas être maîtrisé. Elle n’est pas obligatoire.

**Les limites.** L’Assurance Maladie prévient que l’étiquetage peut ne pas être exhaustif (traces possibles, formulations imprécises). La liste réglementaire est révisée régulièrement et n’est pas forcément complète : un enfant peut être allergique à un aliment qui n’y figure pas. Hors Union européenne, les règles diffèrent.

## Au quotidien
- **Relisez à chaque achat**, même pour un produit habituel : les recettes changent.
- **Cherchez les mots en gras** dans la liste des ingrédients, puis la mention éventuelle de traces.
- **Apprenez les noms cachés** de l’allergène de votre enfant (pour le lait : beurre, crème, lactosérum, caséine ; pour l’œuf : blanc ou jaune d’œuf, ovalbumine…).
- **Gardez l’emballage** des produits consommés lors d’une réaction : il aidera le médecin et permet un signalement.
- **En boulangerie, au marché, chez le traiteur** : demandez à voir l’information écrite sur les allergènes.
- **Au restaurant** : signalez l’allergie dès l’arrivée, demandez la liste des allergènes des plats et les précautions en cuisine.
- **À l’étranger** : préparez une carte expliquant l’allergie dans la langue du pays.

## Questions fréquentes
**Un produit sans mention de traces est-il forcément sûr ?**
Non. L’absence de mention ne garantit pas l’absence de contamination. Suivez les consignes de l’allergologue.

**L’huile de soja raffinée doit-elle être évitée en cas d’allergie au soja ?**
La réglementation exclut certains dérivés très transformés de l’obligation d’étiquetage (comme l’huile de soja entièrement raffinée). Demandez à l’allergologue s’ils conviennent à votre enfant.

**La cantine doit-elle afficher les allergènes ?**
En restauration collective, la DGCCRF indique qu’un dispositif permettant d’écarter un allergène n’est pas obligatoire ; c’est pourquoi le PAI organise les repas de l’enfant allergique.

**Une application peut-elle remplacer la lecture de l’étiquette ?**
Elle peut aider, mais l’étiquette du produit que vous avez en main reste la référence.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de réaction grave (gonflement du visage, gêne respiratoire, malaise) et utilisez l’auto-injecteur s’il a été prescrit.

**Signalez** un étiquetage erroné ou incomplet à la direction départementale de la protection des populations (DDPP) de votre département ou via SignalConso. Consultez votre médecin après toute réaction, même légère, en apportant l’emballage.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child', 'newborn', 'pregnant'], category: 'alimentation',
    slug: 'rappel-de-produit-allergene-non-declare',
    title: 'Rappel de produit pour un allergène non déclaré : s’informer et réagir',
    summary: 'Comment suivre les rappels sur RappelConso, que faire si vous avez acheté un produit rappelé et comment signaler un problème d’étiquetage.',
    tags: ['rappel conso', 'RappelConso', 'allergène non déclaré', 'rappel produit', 'SignalConso', 'étiquetage erreur', 'sécurité alimentaire'],
    sources: [S.rappelConso, S.ecoRappels, S.santeAllergenes],
    body_md: `## En bref
- **RappelConso** est le site officiel qui publie les rappels de produits en France, dont de nombreux rappels pour **allergène non mentionné** sur l’étiquette.
- Un **rappel** concerne un produit déjà vendu : il faut le mettre de côté, puis le rapporter ou le détruire selon les consignes.
- Gardez l’**emballage**, le **numéro de lot** et la **preuve d’achat**.
- Un problème d’étiquetage peut être **signalé** via SignalConso ou à la direction départementale de protection des populations.
- Après une réaction à un produit rappelé, demandez **conseil à un professionnel de santé**.

## Comprendre
**Retrait ou rappel ?** Le ministère de l’Économie distingue :
- le **retrait** : le produit est encore en magasin et les professionnels le retirent des rayons ;
- le **rappel** : le produit a déjà été vendu et les consommateurs doivent le rapporter ou le détruire. Il n’y a pas de rappel sans retrait.

**RappelConso** est le portail unique d’information sur les rappels de produits alimentaires et non alimentaires. Chaque fiche indique le produit (avec une photo), le **motif** du rappel (par exemple un allergène présent mais absent de l’étiquette), les **risques**, l’entreprise concernée, la date et la conduite à tenir. Un moteur de recherche, des catégories et des flux d’alerte permettent de suivre les nouveaux rappels. Les médicaments et dispositifs médicaux relèvent, eux, de l’ANSM.

**Pourquoi c’est important quand on est allergique.** Les règles d’étiquetage imposent de mentionner et de mettre en évidence les 14 allergènes réglementaires. Une erreur d’étiquette, un changement de recette ou une contamination peuvent pourtant arriver : de nombreux rappels publiés sur RappelConso concernent justement un allergène présent mais non déclaré.

## Au quotidien
- **Abonnez-vous** aux alertes de RappelConso (flux par mot-clé, par exemple le nom de l’allergène de votre enfant) ou consultez le site régulièrement.
- **Si vous avez acheté un produit rappelé** :
  1. mettez-le de côté pour qu’il ne soit pas consommé par erreur ;
  2. gardez l’emballage, l’étiquette et le numéro de lot ;
  3. suivez l’avis de rappel : retour en magasin pour remboursement, destruction selon les consignes ou contact avec le service client ;
  4. conservez la preuve d’achat.
- **Vérifiez le lot** : un rappel ne concerne souvent que certains lots ou certaines dates.
- **Prévenez les proches** qui achètent pour votre enfant (grands-parents, nounou).
- **Après une réaction** à un aliment, gardez l’emballage : il aide le médecin et peut servir à un signalement.

## Questions fréquentes
**Mon enfant a déjà mangé le produit rappelé et n’a rien eu. Que faire ?**
Arrêtez d’utiliser le produit et surveillez votre enfant. En cas de doute ou de signe inhabituel, demandez conseil à un professionnel de santé. En cas de signes graves, appelez le 15.

**Comment signaler un produit dont l’étiquette me semble fausse ?**
Pour une denrée alimentaire, vous pouvez contacter la direction départementale de la protection des populations (DDPP ou DDETSPP) du lieu de l’établissement, ou utiliser SignalConso, qui oriente les démarches.

**Et si je subis un effet indésirable lié à un produit ?**
Il peut être signalé au ministère chargé de la santé via son portail de signalement en ligne.

**Le magasin peut-il refuser le remboursement ?**
L’avis de rappel précise les modalités. En cas de litige, une association de consommateurs agréée peut vous aider.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre enfant présente, après avoir consommé un produit, un gonflement du visage, une gêne respiratoire, un malaise ou des vomissements répétés. Utilisez l’auto-injecteur s’il a été prescrit.

**Consultez votre médecin** après toute réaction, même légère, et apportez l’emballage du produit.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child', 'newborn'], category: 'sante-enfant', max_age_months: 131,
    slug: 'bilan-allergologique-tests-expliques',
    title: 'Bilan allergologique de l’enfant : prick-test, prise de sang, test de provocation expliqués',
    summary: 'Comment se déroule la consultation, à quoi sert chaque test, pourquoi un test positif ne suffit pas et ce que vous rapportez à la maison.',
    tags: ['bilan allergologique', 'prick-test', 'test cutané', 'IgE', 'test de provocation orale', 'allergologue', 'carte d’allergie'],
    sources: [S.ameliAllergieConsult, S.ameliAllergieSympt, S.mpediaAplv],
    body_md: `## En bref
- En cas de suspicion d’allergie, consultez votre **médecin traitant**, qui peut orienter vers un **allergologue**.
- Le bilan commence par un **interrogatoire** détaillé : un journal alimentaire est précieux.
- Les **prick-tests** (tests cutanés) se font dès le plus jeune âge ; la **prise de sang** (IgE spécifiques) les complète si besoin.
- Un test positif montre une **sensibilisation**, pas forcément une allergie : c’est l’ensemble qui compte.
- Le **test de provocation** se fait à l’hôpital, en cas de doute persistant ou pour vérifier une guérison.

## Comprendre
**L’interrogatoire.** L’Assurance Maladie décrit une consultation qui passe en revue les antécédents personnels et familiaux d’allergie, les traitements en cours, les liens entre symptômes et aliments, et l’alimentation des jours précédents. Le délai entre le repas et les signes est un élément clé : une allergie immédiate se manifeste de quelques minutes à 2 ou 3 heures après.

**Les tests cutanés (prick-tests).** On dépose une goutte d’allergène sur la peau, puis on fait une petite piqûre superficielle. Un témoin sert de comparaison. Rougeur et gonflement sont lus au bout de **15 minutes**. Le test est possible chez le jeune enfant, mais pas toujours en cas d’eczéma très étendu ou si un antihistaminique ne peut pas être arrêté.

**La prise de sang.** Le dosage des **IgE spécifiques** est prescrit si les tests cutanés sont impossibles ou peu concluants. Il aide aussi à suivre l’évolution : une baisse peut indiquer l’acquisition d’une tolérance.

**L’éviction-réintroduction.** L’aliment suspecté est retiré pendant 2 à 4 semaines, puis réintroduit sous surveillance médicale. Pour certaines allergies digestives « retardées » (comme certaines formes d’APLV), mpedia précise que les tests sont souvent négatifs et que cette épreuve est la principale méthode de diagnostic.

**Le test de provocation orale.** Plus rare, il consiste à donner l’aliment en quantités croissantes, **en milieu hospitalier**, en raison du risque de réaction grave. Il sert en cas de doute persistant, ou plus tard pour vérifier qu’une tolérance est acquise.

**À la fin du bilan**, l’allergologue remet une **carte d’allergie** et, si nécessaire, la composition d’une trousse d’urgence et son protocole.

## Au quotidien
- **Avant la consultation** : notez les réactions (date, aliment, quantité approximative, délai, signes), prenez des photos, gardez les emballages.
- **Demandez** si un médicament doit être arrêté avant les tests cutanés, et combien de temps avant.
- **Expliquez le test** à votre enfant avec des mots simples : quelques petites gouttes, une sensation de piqûre légère, parfois des démangeaisons qui passent.
- **Apportez** le carnet de santé et la liste des aliments déjà consommés sans problème.
- **Repartez avec des consignes écrites** : aliments à éviter, aliments autorisés, conduite en cas de réaction, date du prochain contrôle.

## Questions fréquentes
**Mon enfant a un test positif mais mange cet aliment sans problème. Faut-il l’arrêter ?**
Pas sans avis. Une sensibilisation sans symptôme n’impose pas toujours d’éviter l’aliment. Seul l’allergologue peut conclure.

**Les tests sont-ils douloureux ?**
Les prick-tests sont superficiels ; ils peuvent provoquer des démangeaisons passagères au point de test.

**À quel âge peut-on faire un bilan ?**
Les tests cutanés sont réalisables chez le jeune enfant, y compris chez le nourrisson si le médecin le juge utile.

**Peut-on faire un test d’allergie en pharmacie ou en ligne ?**
Ces tests ne remplacent pas le bilan médical, qui associe l’histoire de l’enfant, l’examen et des tests interprétés par un médecin.

## Quand demander conseil
**Consultez** si les réactions deviennent plus fréquentes, si de nouveaux signes apparaissent ou si un malaise survient après un repas, comme le recommande l’Assurance Maladie.

**Appelez le 15 ou le 112** en cas de gonflement du visage, de gêne respiratoire, de malaise ou de plusieurs signes associés après un aliment.

${FIN}`,
  },
  {
    ...BASE, journeys: ['child'], category: 'vie-pratique', min_age_months: 24, max_age_months: 131, safety_critical: true,
    slug: 'enfant-allergique-anniversaires-sorties-voyages',
    title: 'Enfant allergique : anniversaires, centre de loisirs, sport et voyages sans s’isoler',
    summary: 'Préparer les goûters, prévenir les autres adultes, partir en voyage avec la trousse d’urgence et aider l’enfant à devenir autonome face à son allergie.',
    tags: ['enfant allergique', 'anniversaire', 'goûter', 'voyage allergie', 'centre de loisirs', 'sport', 'autonomie', 'trousse d’urgence'],
    sources: [S.santeAllergie, S.ameliAllergieConsult, S.boPai],
    body_md: `## En bref
- Une allergie alimentaire **n’empêche pas** de vivre comme les autres : elle demande surtout de **l’anticipation**.
- Prévenez **tous les adultes** qui encadrent votre enfant et laissez-leur la **conduite à tenir écrite**.
- Prévoyez des **en-cas sûrs** pour les goûters, anniversaires, sorties et voyages.
- La **trousse d’urgence** (si elle a été prescrite) part **toujours** avec l’enfant.
- Apprenez à votre enfant, selon son âge, à **reconnaître** ses allergènes et à **dire non** à un aliment inconnu.

## Comprendre
Santé.fr rappelle qu’une allergie alimentaire n’empêche pas la pratique sportive, et conseille de préparer soi-même les collations d’après l’effort. Pour les voyages, il recommande d’emporter en permanence une trousse d’urgence, de se renseigner sur les habitudes alimentaires de la destination et, pour un enfant allergique à l’arachide, d’être particulièrement prudent dans les pays où elle est très présente. L’allergologue peut aussi proposer des tests pour certains aliments exotiques.

L’Assurance Maladie invite à la prudence avec les produits non emballés (pâtisseries, sandwichs, plats à emporter), dont les ingrédients sont difficiles à connaître, et rappelle que les règles d’étiquetage diffèrent hors Union européenne.

**Centre de loisirs et périscolaire.** La circulaire de 2021 sur le PAI prévoit qu’il peut couvrir le temps périscolaire lorsque l’organisateur le signe, et que les accueils collectifs de mineurs (centres de loisirs, colonies) peuvent s’en inspirer. Elle insiste sur un principe : l’enfant doit pouvoir partager les repas et activités avec les autres, en évitant la stigmatisation et en développant son autonomie.

## Au quotidien
**Anniversaires et goûters**
- Prévenez les parents qui invitent, simplement et sans dramatiser.
- Proposez d’apporter une part de gâteau ou un goûter sûr pour votre enfant.
- Gardez une boîte d’en-cas sûrs à l’école ou au centre de loisirs pour les occasions imprévues.

**Grands-parents, nounou, amis**
- Écrivez sur une fiche : allergènes, aliments interdits, signes d’alerte, gestes à faire, numéros à appeler, emplacement de la trousse.
- Montrez-leur le stylo d’entraînement.
- Relisez ensemble les étiquettes des produits qu’ils achètent.

**Sport et activités**
- Informez l’entraîneur ou l’animateur et confiez-lui la conduite à tenir.
- Préparez vous-même collations et boissons.

**Voyages**
- Trousse d’urgence en bagage à main, ordonnance, carte d’allergie, numéros d’urgence du pays.
- Carte expliquant l’allergie dans la langue locale.
- Renseignez-vous sur la cuisine du pays et sur l’accès aux soins sur place.
- Prévoyez des en-cas pour le trajet.

**Autonomie de l’enfant**
- Dès qu’il le peut, apprenez-lui le nom de ses allergènes, à demander « est-ce qu’il y a… ? », à refuser poliment, à dire qu’il ne se sent pas bien.
- Valorisez ses progrès, sans faire peser sur lui toute la responsabilité.

## Questions fréquentes
**Mon enfant peut-il partir en classe verte ou en colonie ?**
Oui, le plus souvent, avec un PAI ou un protocole adapté au séjour. La circulaire prévoit que le PAI précise les conditions de participation aux sorties avec ou sans nuitée.

**Comment éviter que mon enfant se sente « différent » ?**
Impliquez-le dans la préparation de ses goûters, proposez des recettes que tout le monde peut partager et parlez de l’allergie comme d’une simple information.

**L’inquiétude me gâche les sorties. Est-ce fréquent ?**
Vous n’êtes pas seul(e) à ressentir cette inquiétude. En parler avec l’allergologue, une association de patients ou un psychologue peut aider, tout comme un protocole écrit clair et bien connu de tous.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre enfant présente un gonflement du visage, une gêne respiratoire, un malaise ou plusieurs signes ensemble après un aliment, et utilisez l’auto-injecteur s’il a été prescrit.

**Consultez** avant un voyage pour mettre à jour la trousse et le protocole. Si l’anxiété liée à l’allergie devient envahissante pour vous ou votre enfant, parlez-en ; en cas de détresse, le **3114** répond 24 h/24.

${FIN}`,
  },
];
