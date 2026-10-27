/** Guide complet — lot 17 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  ameliCroutesDef: { label: 'ameli.fr — Croûtes de lait du nourrisson : symptômes et causes', url: 'https://www.ameli.fr/assure/sante/themes/croutes-lait/definition-causes-evolution', consulted_on: C },
  ameliCroutesQue: { label: 'ameli.fr — Croûtes de lait du bébé : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/croutes-lait/que-faire-quand-consulter', consulted_on: C, published: '2024-02-06' },
  ameliCroutesTrt: { label: 'ameli.fr — Dermatite séborrhéique du nourrisson (croûtes de lait) : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/themes/croutes-lait/traitement-croutes-lait', consulted_on: C, published: '2024-02-06' },
  santeCroutes: { label: 'Santé.fr — Croûtes de lait (dermite séborrhéique)', url: 'https://www.sante.fr/croutes-de-lait-dermite-seborrheique', consulted_on: C, published: '2026-08-12' },
  mpediaBobos: { label: 'mpedia.fr (AFPA) — De retour de maternité : les premiers bobos de bébé', url: 'https://www.mpedia.fr/art-premiers-bobos-des-premiers-jours/', consulted_on: C, published: '2022-02-04' },
  ameliMycose: { label: 'ameli.fr — Reconnaître une mycose de la peau', url: 'https://www.ameli.fr/assure/sante/themes/mycose-cutanee-peau/reconnaitre-mycose-cutanee', consulted_on: C, published: '2026-02-25' },
  ameliMycoseReflexes: { label: 'ameli.fr — Mycose de la peau : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/mycose-cutanee-peau/bons-reflexes-que-faire', consulted_on: C, published: '2026-02-25' },
  ansmGentiane: { label: 'ANSM — Candidose mammaire et allaitement : éviter le violet de gentiane', url: 'https://ansm.sante.fr/actualites/candidose-mammaire-et-allaitement-eviter-le-violet-de-gentiane', consulted_on: C, published: '2022-06-22' },
  ameliHoquetDef: { label: 'ameli.fr — Hoquet : définition, mécanisme et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/hoquet/definition-mecanismes-symptomes-hoquet', consulted_on: C, published: '2025-04-14' },
  ameliHoquetReflexes: { label: 'ameli.fr — Comment faire passer le hoquet et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/hoquet/bons-reflexes', consulted_on: C, published: '2021-04-23' },
  mpediaRhume: { label: 'mpedia.fr (AFPA) — Rhume bébé : symptômes, soins et conseils', url: 'https://www.mpedia.fr/art-rhume-chez-nourrisson/', consulted_on: C, published: '2022-12-22' },
  santeRhino: { label: 'Santé.fr — Rhinopharyngite de l’enfant', url: 'https://www.sante.fr/rhinopharyngite-de-lenfant', consulted_on: C, published: '2026-08-12' },
  ameliLavageNez: { label: 'ameli.fr — Comment pratiquer un lavage de nez chez un enfant ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/soins/pratiquer-lavage-nez-enfant', consulted_on: C },
  mpediaSelles: { label: 'mpedia.fr (AFPA) — Selles bébé : tout savoir sur la couleur et la fréquence', url: 'https://www.mpedia.fr/art-selles-bebe-0-a-6-mois/', consulted_on: C, published: '2022-09-15' },
  santeSelles: { label: 'Santé.fr (contenu mpedia) — Selles de bébé : tout comprendre pour mieux les surveiller', url: 'https://www.sante.fr/selles-de-bebe-de-0-6-mois-decryptage-complet', consulted_on: C, published: '2025-05-20' },
  ameliExamen8j: { label: 'ameli.fr — Examen du nourrisson dans les 8 jours qui suivent sa naissance', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/examen-du-nourrisson-dans-les-8-jours-qui-suivent-sa-naissance', consulted_on: C, published: '2025-09-01' },
  ameliToilette: { label: 'ameli.fr — Comment changer un nourrisson et faire sa toilette ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/changer-bebe-faire-toilette', consulted_on: C, published: '2025-12-22' },
  ameliHernieDef: { label: 'ameli.fr — Hernie inguinale de l’enfant : définition et mode d’apparition', url: 'https://www.ameli.fr/assure/sante/themes/hernie-inguinale-enfant/hernie-inguinale-de-l-enfant-definition-et-mode-d-apparition', consulted_on: C },
  ameliHernieTrt: { label: 'ameli.fr — Hernie inguinale de l’enfant : le traitement', url: 'https://www.ameli.fr/assure/sante/themes/hernie-inguinale-enfant/hernie-inguinale-de-l-enfant-le-traitement', consulted_on: C, published: '2024-11-05' },
  ameliCryptoComp: { label: 'ameli.fr — Comprendre la cryptorchidie ou testicule non descendu', url: 'https://www.ameli.fr/assure/sante/themes/cryptorchidie-testicule-non-descendu-ectopie-testiculaire/comprendre-cryptorchidie', consulted_on: C, published: '2025-12-05' },
  ameliCryptoDiag: { label: 'ameli.fr — Cryptorchidie ou testicule non descendu : diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/themes/cryptorchidie-testicule-non-descendu-ectopie-testiculaire/diagnostic-evolution', consulted_on: C, published: '2020-04-09' },
  ameliCryptoTrt: { label: 'ameli.fr — Traitement de la cryptorchidie ou testicule non descendu', url: 'https://www.ameli.fr/assure/sante/themes/cryptorchidie-testicule-non-descendu-ectopie-testiculaire/traitement', consulted_on: C, published: '2025-12-05' },
  ameliTorsion: { label: 'ameli.fr — Réagir en cas d’urgence : torsion du testicule', url: 'https://www.ameli.fr/assure/sante/urgence/pathologies/torsion-testicule', consulted_on: C, published: '2017-03-29' },
  ameliUrgences: { label: 'ameli.fr — Les situations d’urgence chez l’enfant', url: 'https://www.ameli.fr/assure/sante/enfants/situations-urgence', consulted_on: C, published: '2024-12-12' },
  ameliPhimosisQue: { label: 'ameli.fr — Prépuce non rétractable et phimosis : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/phimosis/que-faire-quand-consulter', consulted_on: C, published: '2024-04-29' },
  ameliPhimosisDef: { label: 'ameli.fr — Définition, causes et complications possibles d’un phimosis', url: 'https://www.ameli.fr/assure/sante/themes/phimosis/definition-causes-complications-possibles', consulted_on: C, published: '2024-04-29' },
  mpediaConj: { label: 'mpedia.fr (AFPA) — Conjonctivite du bébé : symptômes, causes et traitements', url: 'https://www.mpedia.fr/art-conjonctivite-bebe-la-reconnaitre-et-la-soigner/', consulted_on: C, published: '2022-11-07' },
  mpediaChaleur: { label: 'mpedia.fr (AFPA) — Bouton de chaleur : reconnaître, prévenir et guérir', url: 'https://www.mpedia.fr/art-boutons-chaleur-prevenir-guerir/', consulted_on: C, published: '2023-07-21' },
  mpediaToilette: { label: 'mpedia.fr (AFPA) — Bain : comment réussir la toilette de bébé ?', url: 'https://www.mpedia.fr/art-toilette-les-bons-gestes/', consulted_on: C, published: '2020-11-21' },
  ameliBebeSante: { label: 'ameli.fr — La santé de bébé à la sortie de maternité jusqu’au 6e mois', url: 'https://www.ameli.fr/assure/sante/enfants/bebe-sante', consulted_on: C, published: '2024-12-11' },
  mpediaHemangiome: { label: 'mpedia.fr (AFPA) — L’hémangiome infantile : le détecter et le soigner', url: 'https://www.mpedia.fr/art-hemangiome-infantile-detecter-soigner/', consulted_on: C, published: '2022-03-18' },
  ameliRgoDef: { label: 'ameli.fr — Définition et causes du reflux gastro-œsophagien du nourrisson', url: 'https://www.ameli.fr/assure/sante/themes/rgo-nourrisson/definition-causes', consulted_on: C },
  ameliRgoTrt: { label: 'ameli.fr — RGO du nourrisson : le diagnostic et le traitement', url: 'https://www.ameli.fr/assure/sante/themes/rgo-nourrisson/diagnostic-traitement', consulted_on: C },
  mpediaPlagio: { label: 'mpedia.fr (AFPA) — Crâne déformé, tête plate de bébé, plagiocéphalie', url: 'https://www.mpedia.fr/art-plagiocephalie/', consulted_on: C, published: '2022-09-16' },
  hasPlagio: { label: 'HAS — Prévenir la plagiocéphalie sans augmenter le risque de mort inattendue du nourrisson', url: 'https://www.has-sante.fr/jcms/p_3160772/fr/prevenir-la-plagiocephalie-sans-augmenter-le-risque-de-mort-inattendue-du-nourrisson', consulted_on: C, published: '2020-03-05' },
  ameliCoucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2019-11-14' },
  ameliErythemeTrt: { label: 'ameli.fr — Consultation et traitement de l’érythème fessier', url: 'https://www.ameli.fr/assure/sante/themes/erytheme-fessier-du-nourisson-fesses-rouges/consultation-traitement', consulted_on: C, published: '2023-06-19' },
  mpediaCordon: { label: 'mpedia.fr (AFPA) — Nouveau-né : quel soin pour le cordon ombilical', url: 'https://www.mpedia.fr/art-soin-du-cordon/', consulted_on: C, published: '2022-01-20' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe et vous aide à vous repérer ; il ne remplace pas l’avis du médecin, de la sage-femme, de la puéricultrice de PMI ou du pédiatre qui suit votre enfant._';
const BASE = { status: 'to_review' as const };
const BB = { ...BASE, journeys: ['newborn'] as LibArticle['journeys'], category: 'sante-bebe' as const };

export const GUIDE_B17: LibArticle[] = [
  // ------------------------------------------------------------------ peau et cuir chevelu
  {
    ...BB, min_age_months: 0, max_age_months: 6,
    slug: 'croutes-de-lait-reconnaitre-et-enlever-en-douceur',
    title: 'Croûtes de lait : les reconnaître et les enlever en douceur',
    summary: 'Plaques grasses jaunâtres sur le crâne de bébé : ce que sont les croûtes de lait, pourquoi elles apparaissent et la méthode douce pour les faire partir à la maison.',
    tags: ['croûtes de lait', 'dermite séborrhéique', 'cuir chevelu bébé', 'plaques jaunes tête bébé', 'fontanelle', 'vaseline', 'shampoing bébé'],
    sources: [S.ameliCroutesDef, S.ameliCroutesQue, S.santeCroutes],
    body_md: `## En bref
- Les croûtes de lait sont une **dermite séborrhéique** du nourrisson : des plaques grasses, blanches ou jaunes, collées au cuir chevelu.
- Elles apparaissent en général **avant 6 mois**, souvent dès la deuxième semaine, chez un bébé par ailleurs en bonne santé.
- Elles ne démangent pas, ne gênent pas bébé et **ne sont pas contagieuses**.
- Malgré leur nom, elles **n’ont aucun lien avec le lait** : changer de lait n’a pas d’intérêt, sauf avis médical.
- Le plus efficace : commencer les soins **dès les premières croûtes**, avec un shampoing doux, de la vaseline et une brosse souple.

## Comprendre
Selon l’Assurance Maladie, les croûtes de lait correspondent à une maladie de peau courante du nourrisson, liée notamment à un **excès de sébum**. La peau des tout-petits est plus grasse que celle des adultes : les glandes situées à la racine des cheveux produisent beaucoup de sébum. Des levures présentes naturellement sur la peau (de type *Malassezia*) peuvent alors proliférer, entraîner une petite inflammation et accélérer le renouvellement des cellules, qui s’agglomèrent en croûtes.

Les plaques commencent souvent sur le haut du crâne, au niveau de la **fontanelle**, puis peuvent s’étendre derrière les oreilles, aux sourcils ou à la racine des cils. Elles sont parfois entourées d’un liseré rouge. Santé.fr précise que des produits de toilette mal adaptés à la peau fragile de bébé peuvent favoriser leur apparition, par irritation répétée. Elles touchent autant les filles que les garçons.

La fontanelle impressionne beaucoup de parents. Vous pouvez la laver et la masser doucement comme le reste du crâne : c’est même recommandé, car les croûtes s’y installent volontiers.

## Au quotidien
**Quelques croûtes seulement**
- Au bain, lavez les cheveux avec un **shampoing doux pour bébé**, fontanelle comprise.
- Retirez les croûtes en douceur avec une **brosse souple**.
- Donnez un bain quotidien jusqu’à leur disparition, puis espacez (2 à 3 fois par semaine).

**Croûtes plus épaisses** (méthode décrite par ameli)
1. Appliquez de la **vaseline** environ 2 heures avant le bain et massez doucement le cuir chevelu.
2. Lavez avec un shampoing doux.
3. Rincez abondamment, sans laisser de trace de produit.
4. Détachez les croûtes avec une brosse souple. Quelques cheveux peuvent partir avec : ils repoussent.
5. Brossez plusieurs fois par jour avec une brosse souple, lavée chaque jour à l’eau et au savon.

Si cela ne suffit pas, massez le cuir chevelu à la vaseline le soir au coucher et faites le shampoing le lendemain matin. Les croûtes disparaissent en quelques jours à quelques semaines, laissant d’abord une peau un peu rosée, puis plus claire, avant que la couleur habituelle revienne.

**À éviter**
- Gratter les plaques avec les ongles, un peigne ou une brosse dure : cela peut blesser, voire faire saigner, sans retirer les croûtes.
- Les produits de toilette pour adultes ou parfumés : préférez des produits conçus pour les bébés.
- L’huile d’amande douce : mpedia rappelle qu’elle peut sensibiliser l’enfant à l’amande.

**Pour prévenir le retour** : un shampoing doux 2 à 3 fois par semaine, un bon rinçage et un brossage quotidien avec une brosse très douce.

## Questions fréquentes
**Les croûtes de lait viennent-elles d’un lait mal toléré ?** Non. Elles sont liées au sébum et aux levures de la peau, pas à l’alimentation. Ne changez pas de lait sans avis médical.

**Puis-je toucher la fontanelle pendant le shampoing ?** Oui, avec des gestes doux. Laver cette zone fait partie de la prévention recommandée.

**Les cheveux qui tombent avec les croûtes vont-ils repousser ?** Oui, cette chute est temporaire.

**Mon bébé a-t-il mal ?** En général non : les croûtes de lait ne démangent pas et ne gênent pas le nourrisson. Un bébé grognon qui se gratte doit être montré au médecin.

## Quand demander conseil
Consultez votre médecin ou le pédiatre si, après **deux semaines de soins quotidiens**, rien ne s’améliore ; si les croûtes s’étendent, suintent, saignent ou semblent infectées ; si la zone devient rouge, irritée ou enflée ; si d’autres zones sont touchées (fesses, plis, nombril) ; ou si votre bébé a de la fièvre ou semble gêné par des démangeaisons. En cas d’urgence, appelez le 15 (ou le 112).

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 12,
    slug: 'croutes-de-lait-etendues-ou-qui-persistent',
    title: 'Croûtes de lait étendues ou qui reviennent : quand et pourquoi consulter',
    summary: 'Quand la dermite séborrhéique déborde du cuir chevelu, s’installe ou récidive : les formes étendues, ce que fait le médecin et comment la peau évolue après les soins.',
    tags: ['croûtes de lait qui reviennent', 'dermite séborrhéique étendue', 'Leiner-Moussous', 'croûtes de lait fesses', 'plis rouges bébé', 'croûtes infectées'],
    safety_critical: true,
    sources: [S.ameliCroutesDef, S.ameliCroutesTrt, S.santeCroutes],
    body_md: `## En bref
- Le plus souvent, les croûtes de lait restent sur le cuir chevelu et partent avec des soins simples.
- Plus rarement, la dermite séborrhéique **s’étend** : tout le crâne, les fesses, les plis du cou, des aisselles, des bras ou des genoux.
- Le médecin pose le diagnostic par un simple examen ; aucun examen complémentaire n’est utile en général.
- Après les soins, la peau passe par une phase rouge puis plus claire, qui se recolore en quelques semaines.
- Des récidives restent possibles jusqu’à **environ 5 à 6 mois**.

## Comprendre
L’Assurance Maladie distingue une **forme modérée**, limitée au cuir chevelu et parfois aux sourcils ou derrière les oreilles, et une **forme étendue**, plus rare. Dans cette dernière, les plaques fusionnent : le cuir chevelu peut être recouvert de lésions épaisses formant comme un casque ; les fesses peuvent être touchées dans les plis ou présenter une rougeur vive en forme de culotte ; des rougeurs apparaissent sous les aisselles, dans le cou, derrière les oreilles ou les genoux. Cette forme porte le nom d’**érythrodermie de Leiner-Moussous**.

Santé.fr mentionne d’autres évolutions possibles : une **surinfection** par des bactéries ou des levures (*Candida*), ou une évolution vers un **eczéma atopique**. Les croûtes ne sont pas graves en elles-mêmes, mais elles peuvent persister des mois et être inesthétiques, ce qui pèse parfois sur le moral des parents.

**Ce que fait le médecin** : un examen clinique suffit. Il conseille toujours de commencer ou de poursuivre les soins de toilette avec un savon doux. Si les croûtes sont étendues, il peut prescrire un traitement local : shampoing traitant adapté à l’enfant pour réguler le sébum, crème antifongique pour réduire les levures, parfois une crème anti-inflammatoire ou antiseptique. Suivez exactement son ordonnance et demandez-lui combien de temps poursuivre.

## Au quotidien
- **Gardez la routine de base** : shampoing doux, vaseline si besoin, brosse souple, rinçage soigneux.
- **Observez les plis** au moment du bain et du change : cou, aisselles, aine, derrière les oreilles. Séchez-les en tamponnant.
- **Pensez aux fesses** : une rougeur vive des fesses associée aux croûtes est un motif pour en parler au médecin.
- **Prenez des photos** datées si les plaques changent : elles aident le médecin à juger de l’évolution.
- **Soyez patient avec la peau** : après la chute des croûtes, des plaques rosées puis des zones plus claires peuvent rester quelques semaines. Elles se recolorent spontanément et les cheveux repoussent.
- **Si ça revient** : reprenez les soins dès les premières croûtes ; plus elles sont peu nombreuses, plus elles partent facilement.

## Questions fréquentes
**Les croûtes de lait peuvent-elles devenir de l’eczéma ?** Santé.fr cite cette évolution parmi les possibles. Si la peau devient sèche, rouge et que bébé se gratte, montrez-le au médecin.

**Faut-il faire une prise de sang ou un prélèvement ?** Selon ameli, l’examen du médecin suffit à confirmer le diagnostic dans la plupart des cas.

**Combien de temps dure le traitement ?** Il dépend de l’étendue des plaques. Après plusieurs jours de traitement, les croûtes se détachent ; le médecin vous dira quand arrêter.

**Mon bébé de 4 mois en refait : avons-nous mal fait ?** Non. Des récidives sont possibles jusqu’à environ 5 à 6 mois, même avec des soins bien faits.

## Quand demander conseil
Consultez dans les jours qui viennent si les croûtes s’étendent au reste du corps ou aux fesses, si elles ne disparaissent pas malgré plusieurs semaines de soins, si elles suintent, saignent ou semblent infectées, ou si la peau est enflée. Consultez rapidement si votre bébé a de la fièvre, semble inconfortable ou mange moins. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 12,
    slug: 'muguet-buccal-bebe-taches-blanches-bouche',
    title: 'Muguet : des taches blanches dans la bouche de bébé',
    summary: 'Plaques blanches sur la langue ou les joues qui ne partent pas : reconnaître le muguet, le distinguer d’un dépôt de lait et savoir pourquoi il faut consulter plutôt que traiter seul.',
    tags: ['muguet', 'muguet bébé', 'taches blanches bouche bébé', 'langue blanche nourrisson', 'candidose buccale', 'mycose bouche bébé', 'tétine'],
    sources: [S.ameliMycose, S.mpediaBobos, S.ameliErythemeTrt],
    body_md: `## En bref
- Le muguet est une **mycose de la bouche** due à une levure, *Candida albicans*, très fréquente chez le nourrisson.
- Il forme des **plaques blanches épaisses**, comme du lait caillé, sur la langue, l’intérieur des joues, les gencives ou le palais.
- Il est souvent associé à des **fesses rouges**.
- Il dure en général **une à deux semaines** ; le médecin peut prescrire un traitement local.
- Chez un enfant de moins de 12 ans, une mycose se fait voir par un médecin : on ne la traite pas soi-même.

## Comprendre
*Candida albicans* est une levure qui vit naturellement sur la peau et les muqueuses. Chez le bébé, elle peut proliférer dans la bouche et provoquer un muguet. L’Assurance Maladie le décrit comme des **plaques blanches, épaisses**, qui peuvent s’étendre au tube digestif. Le port de couches, l’humidité, la chaleur, certains traitements comme les antibiotiques favorisent les mycoses chez le nourrisson ; c’est pourquoi un muguet s’accompagne souvent d’un érythème fessier.

**Muguet ou simple trace de lait ?** Juste après une tétée ou un biberon, la langue peut paraître blanchâtre. Des plaques épaisses qui touchent aussi l’intérieur des joues, les gencives ou le palais, et qui persistent, évoquent davantage un muguet, tel que le décrit l’Assurance Maladie. Seul un professionnel peut faire la différence avec certitude : n’essayez pas de gratter les plaques.

## Au quotidien
- **Montrez la bouche de bébé** au médecin, au pédiatre ou à la sage-femme. Le médecin peut prescrire un antifongique léger à appliquer dans la bouche ; respectez la durée indiquée, même si les taches disparaissent vite.
- **Nettoyez et stérilisez après chaque usage** les tétines, téterelles et sucettes, comme le conseille mpedia.
- **Si vous allaitez**, nettoyez vos mamelons après chaque tétée et surveillez-les : douleur, brûlures, démangeaisons ou rougeurs peuvent signaler une candidose mammaire, qui se soigne en même temps que bébé.
- **Lavez-vous les mains** avant et après les soins de bouche et le change.
- **Surveillez le siège** : des fesses rouges qui ne passent pas avec les soins habituels méritent d’être signalées.
- **Ne mettez pas de produit acheté sans avis** dans la bouche de votre bébé et n’utilisez pas de remède de grand-mère.

## Questions fréquentes
**Le muguet est-il grave ?** Il est fréquent et se soigne bien, mais il doit être confirmé et traité par un professionnel, surtout chez un tout-petit.

**Pourquoi mon bébé a-t-il un muguet alors que je suis très attentive à l’hygiène ?** Le *Candida* est présent naturellement ; certains facteurs (antibiotiques, humidité, couches) favorisent sa prolifération. Ce n’est pas une question de propreté.

**Les fesses rouges ont-elles un lien ?** Souvent oui : la même levure peut coloniser un érythème fessier. D’ailleurs, quand il voit des fesses rouges, le médecin examine aussi la bouche à la recherche d’un muguet.

**Puis-je continuer à allaiter ?** Le muguet n’est pas une raison d’arrêter. Parlez-en à votre médecin ou sage-femme, qui pourra traiter la mère et le bébé si besoin.

## Quand demander conseil
Consultez si vous voyez des plaques blanches qui persistent dans la bouche, si bébé refuse de téter ou boit beaucoup moins, s’il semble douloureux, si le siège est très rouge, ou si les taches reviennent après traitement. Consultez sans attendre si bébé a de la fièvre, mouille beaucoup moins ses couches ou paraît très fatigué. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, journeys: ['newborn'], category: 'sante-bebe', min_age_months: 0, max_age_months: 12,
    slug: 'muguet-et-allaitement-soigner-maman-et-bebe',
    title: 'Muguet et allaitement : soigner la maman et le bébé en même temps',
    summary: 'Mamelons douloureux, qui brûlent ou démangent pendant que bébé a un muguet : comprendre la candidose mammaire, pourquoi traiter les deux ensemble et ce qu’il faut éviter.',
    tags: ['muguet allaitement', 'candidose mammaire', 'mycose mamelon', 'mamelons douloureux', 'violet de gentiane', 'brûlure tétée'],
    sources: [S.ameliMycose, S.ameliMycoseReflexes, S.ansmGentiane],
    body_md: `## En bref
- La levure responsable du muguet de bébé (*Candida*) peut aussi toucher le **sein** de la mère qui allaite : c’est la **candidose mammaire**.
- Signes possibles : **douleurs aux tétées**, brûlures, démangeaisons, rougeurs autour du mamelon.
- Le diagnostic se fait chez le **médecin ou la sage-femme** ; un antifongique adapté est prescrit à la mère et, si besoin, au bébé, **en même temps**.
- Le **violet de gentiane** est déconseillé en première intention : il peut être toxique pour un bébé qui tète.
- L’allaitement peut en général être poursuivi.

## Comprendre
Pendant l’allaitement, la bouche du bébé et le mamelon sont en contact plusieurs fois par jour. Si l’un des deux est colonisé par *Candida*, l’autre peut l’être aussi. L’Assurance Maladie indique que le muguet de la bouche chez l’enfant peut signaler que la candidose mammaire de la mère s’est transmise. D’où l’importance de **traiter les deux simultanément** lorsque le diagnostic est confirmé : sinon, la levure peut repasser de l’un à l’autre.

Toutes les douleurs de l’allaitement ne sont pas des mycoses : une mauvaise position, une crevasse, un engorgement peuvent aussi faire mal. C’est pourquoi un avis professionnel est nécessaire avant tout traitement.

**Le violet de gentiane** : ce colorant est parfois appliqué sur le sein pour traiter une candidose. L’ANSM a rappelé qu’ingéré par le nourrisson pendant l’allaitement, il peut être dangereux, notamment en cas d’usage prolongé. Elle recommande de ne pas l’utiliser en première intention, de ne pas s’en procurer sans ordonnance ni hors pharmacie, et de privilégier un antifongique après confirmation du diagnostic. Il est aussi déconseillé pendant la grossesse, par précaution.

## Au quotidien
- **Consultez** votre médecin ou votre sage-femme dès que les tétées deviennent douloureuses : ne vous soignez pas seule.
- **Suivez le traitement à deux** : appliquez celui de la maman et donnez celui de bébé comme prescrit, pendant toute la durée indiquée.
- **Nettoyez les mamelons** après chaque tétée et séchez-les bien : l’humidité favorise les levures.
- **Changez souvent les coussinets** d’allaitement s’ils sont humides.
- **Nettoyez et stérilisez** après chaque usage les téterelles, tétines et sucettes.
- **Lavez-vous les mains** avant et après chaque tétée et chaque soin.
- **Prenez soin de vous** : une tétée douloureuse est éprouvante. Demandez de l’aide à votre entourage, à la PMI ou à une association de soutien à l’allaitement.

## Questions fréquentes
**Dois-je arrêter d’allaiter ?** L’ANSM indique que l’allaitement peut être poursuivi. Si la douleur est trop forte, parlez-en à votre sage-femme ou médecin pour trouver une solution adaptée.

**Mon bébé n’a rien dans la bouche : faut-il le traiter quand même ?** C’est au médecin d’en décider. L’Assurance Maladie précise que l’enfant est traité s’il est lui aussi contaminé.

**Puis-je acheter un produit en pharmacie sans ordonnance ?** Pour un enfant, ameli recommande de ne pas se soigner seul. Pour vous, demandez au pharmacien ou au médecin un produit compatible avec l’allaitement.

**La douleur peut-elle venir d’autre chose ?** Oui : crevasses, mauvaise prise du sein, engorgement… Un examen permet de faire la différence.

## Quand demander conseil
Consultez si vos mamelons sont douloureux, brûlent, démangent ou rougissent, si la douleur irradie dans le sein, ou si vous avez de la fièvre. Consultez pour bébé s’il a des plaques blanches dans la bouche, tète moins bien ou a les fesses très rouges. Si l’épuisement ou la tristesse prennent le dessus, parlez-en ; le 3114 répond jour et nuit en cas de détresse. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ petits bruits et petits réflexes
  {
    ...BB, min_age_months: 0, max_age_months: 12,
    slug: 'hoquet-du-nourrisson-que-faire',
    title: 'Le hoquet du nourrisson : pourquoi il est si fréquent et que faire',
    summary: 'Bébé a souvent le hoquet après la tétée ou le biberon : comprendre ce réflexe, les petits gestes qui accompagnent sa fin et les rares situations qui demandent un avis.',
    tags: ['hoquet bébé', 'hoquet nourrisson', 'hoquet après biberon', 'hoquet après tétée', 'rot bébé', 'hoquet fœtus'],
    sources: [S.ameliHoquetDef, S.ameliHoquetReflexes, S.ameliRgoDef],
    body_md: `## En bref
- Le hoquet est un **réflexe respiratoire involontaire** : le diaphragme se contracte et la glotte se ferme, d’où le « hic ».
- Les bébés en ont **plus souvent que les adultes**, notamment après la tétée ou le biberon, surtout s’ils ont avalé de l’air.
- Il est **indolore** pour bébé et disparaît généralement **en quelques minutes**, souvent après un rot.
- Le hoquet existe déjà **avant la naissance** : beaucoup de femmes enceintes le sentent.
- Un hoquet qui dure plus de 48 heures, revient très souvent ou s’accompagne d’autres signes justifie une consultation.

## Comprendre
L’Assurance Maladie décrit le hoquet comme une contraction involontaire et répétée des muscles qui servent à inspirer (diaphragme, muscles entre les côtes), accompagnée d’une fermeture de la glotte. Son utilité reste mal comprise. Chez le nourrisson, l’estomac est petit et se distend facilement avec le lait et l’air avalé pendant le repas ; cette distension peut déclencher le réflexe.

On parle de **hoquet aigu** quand il dure de quelques secondes à quelques minutes, sans dépasser 48 heures : c’est le cas de l’immense majorité des hoquets de bébé. Le **hoquet chronique** dure plus de 48 heures ou revient très régulièrement ; il peut alors gêner l’alimentation et le sommeil et nécessite un avis médical, car il peut être lié par exemple à un reflux.

Le hoquet impressionne surtout les parents : bébé, lui, continue souvent de téter, de dormir ou de jouer.

## Au quotidien
- **Faites une pause** pendant la tétée ou le biberon pour permettre un rot : l’air avalé favorise le hoquet.
- **Tenez bébé à la verticale** contre vous quelques minutes après le repas, en soutenant bien sa tête.
- **Laissez faire** : dans la plupart des cas, le hoquet s’arrête seul. Vous pouvez câliner, bercer doucement ou reprendre la tétée si bébé le souhaite.
- **Pas d’astuces d’adulte** : les méthodes classiques (boire d’un trait, retenir sa respiration, faire peur) ne sont pas prouvées scientifiquement, selon ameli, et ne sont pas adaptées à un bébé. Ne lui faites jamais peur et ne le secouez jamais.
- **Coucher** : le hoquet n’empêche pas de coucher bébé sur le dos, dans son lit, comme d’habitude.

## Questions fréquentes
**Le hoquet fait-il mal à mon bébé ?** Selon ameli, il est indolore pour le nourrisson.

**Faut-il arrêter la tétée quand il a le hoquet ?** Ce n’est pas obligatoire. Une pause pour un rot aide souvent ; ensuite, vous pouvez reprendre si bébé est disposé à téter.

**Pourquoi mon bébé avait-il le hoquet dans mon ventre ?** Le hoquet apparaît dès la vie fœtale. Ces petites secousses régulières ressenties pendant la grossesse sont souvent du hoquet.

**Mon bébé a le hoquet plusieurs fois par jour : est-ce trop ?** Des hoquets fréquents mais courts, chez un bébé qui mange, dort et grossit bien, sont habituels à cet âge. Ce qui doit faire consulter, c’est un hoquet qui dure plus de 48 heures, qui revient sans cesse en gênant les repas ou le sommeil, ou qui s’accompagne d’autres signes.

**Peut-il être lié aux régurgitations ?** Les deux sont favorisés par un estomac plein d’air et de lait. Si bébé régurgite beaucoup, pleure pendant ou après les repas ou grossit mal, parlez-en au médecin.

## Quand demander conseil
Consultez si le hoquet dure plus de 48 heures ou revient très souvent ; s’il gêne les repas ou le sommeil ; s’il survient après la prise d’un médicament ; ou s’il s’accompagne de vomissements, de pleurs inhabituels, de fièvre, de difficultés à respirer ou à avaler, ou de tout signe qui vous inquiète. En cas de gêne respiratoire, de lèvres bleutées ou de malaise, appelez immédiatement le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 6,
    slug: 'nouveau-ne-eternue-nez-bouche-que-faire',
    title: 'Bébé éternue, a le nez bouché ou respire bruyamment : que faire ?',
    summary: 'Le nouveau-né respire surtout par le nez : pourquoi un petit encombrement le gêne vite, comment lui dégager le nez et les signes qui doivent faire consulter rapidement.',
    tags: ['bébé éternue', 'nez bouché nouveau-né', 'bébé respire fort', 'bébé ronfle', 'sérum physiologique', 'lavage de nez', 'nez qui coule bébé'],
    sources: [S.mpediaRhume, S.santeRhino, S.ameliLavageNez],
    body_md: `## En bref
- Un bébé respire surtout **par le nez** : même un petit encombrement le gêne, le fait éternuer, respirer bruyamment ou téter moins bien.
- Le moyen le plus utile pour l’aider est le **lavage de nez au sérum physiologique**, avant les repas et le coucher.
- Le **mouche-bébé** est moins efficace que le lavage, selon l’Assurance Maladie.
- Les **sprays décongestionnants (vasoconstricteurs)** sont contre-indiqués chez l’enfant.
- Un nez qui coule chez un bébé de **moins d’un mois** se fait voir par un médecin **dans la journée**.

## Comprendre
Les éternuements sont un moyen pour bébé de dégager son nez. Quand le nez est encombré, il respire plus difficilement, ce qui peut se manifester par un petit « ronflement », des bruits pendant le sommeil, une tétée hachée ou des pauses fréquentes pendant le biberon. mpedia rappelle que l’enfant est souvent plus gêné par un nez bouché que par un nez qui coule.

Quand l’encombrement s’accompagne d’un nez qui coule, d’une toux ou d’une petite fièvre, il s’agit souvent d’une **rhinopharyngite** (rhume), qui dure en général une semaine et guérit seule. Les antibiotiques n’ont pas d’intérêt dans un rhume simple, selon Santé.fr. L’enjeu est surtout de garder le nez dégagé pour que bébé puisse manger et dormir.

## Au quotidien
**Le lavage de nez chez le nourrisson** (d’après ameli)
1. Lavez-vous les mains. Utilisez des **dosettes de sérum physiologique** à usage unique (pas d’eau du robinet ni d’eau minérale, pas assez salées).
2. Allongez bébé sur le côté, ou sur le dos tête tournée sur le côté, en maintenant bien sa tête.
3. Placez l’embout à l’entrée de la **narine du dessus** et pressez la dosette.
4. Laissez le sérum ressortir, souvent par l’autre narine, et attendez que bébé ait bien avalé.
5. Essuyez avec un mouchoir jetable, puis faites de même de l’autre côté avec une nouvelle dosette si besoin.

Si vous êtes seul et que bébé bouge beaucoup, vous pouvez l’envelopper dans une serviette. Faites les lavages **avant les repas** (pour limiter les vomissements) et **avant le coucher**.

**Autres gestes utiles**
- Proposez à boire régulièrement et fractionnez les repas si bébé se fatigue en tétant.
- Couchez-le toujours **sur le dos**, à plat, sans surélever le matelas ni ajouter de coussin.
- Aérez la chambre chaque jour et évitez absolument la fumée de tabac.
- Lavez-vous les mains souvent et évitez les contacts rapprochés avec des personnes enrhumées.

## Questions fréquentes
**Mon bébé éternue souvent mais va bien : est-il enrhumé ?** Pas forcément. Les éternuements aident à dégager le nez. S’il n’a ni nez qui coule, ni toux, ni fièvre et qu’il tète bien, vous pouvez simplement observer.

**Combien de fois par jour laver le nez ?** Dès qu’il paraît encombré ; mpedia évoque jusqu’à 6 à 10 fois par jour, toujours avant les repas et le coucher. Demandez conseil à votre médecin si vous hésitez.

**Puis-je utiliser un spray d’eau de mer ?** ameli le réserve plutôt aux bébés de plus de 6 mois, à faible pression. Avant, préférez les dosettes.

**Les bruits de respiration pendant le sommeil sont-ils inquiétants ?** Un nez encombré est souvent en cause. Une respiration rapide, difficile ou sifflante demande en revanche un avis rapide.

## Quand demander conseil
Consultez dans la journée si un nouveau-né de **moins d’un mois** a le nez qui coule. Chez un bébé de moins de 3 mois, consultez en cas de fièvre (38 °C ou plus), de refus de manger, de vomissements, de toux importante ou si vous êtes inquiet. À tout âge : respiration rapide ou difficile, lèvres bleutées, bébé très somnolent ou pleurs inconsolables doivent faire appeler le **15** (ou le 112) ou consulter aux urgences.

${FIN}`,
  },
  // ------------------------------------------------------------------ couches : selles
  {
    ...BB, min_age_months: 0, max_age_months: 12,
    slug: 'couleur-des-selles-de-bebe-ce-qu-elle-dit',
    title: 'Couleur des selles de bébé : jaune, verte, marron… ce qu’elle dit',
    summary: 'Du méconium noir aux selles jaune d’or puis brunes à la diversification : les couleurs habituelles des selles du nourrisson et celles qui doivent faire consulter.',
    tags: ['couleur selles bébé', 'selles vertes bébé', 'selles jaunes', 'méconium', 'caca bébé', 'selles bébé allaité', 'selles lait infantile'],
    sources: [S.santeSelles, S.mpediaSelles],
    body_md: `## En bref
- Les **premières selles (méconium)** sont noirâtres ou vert très foncé, épaisses et collantes ; elles sont évacuées en général dans les 24 à 48 heures, parfois jusqu’au 3e jour.
- Chez le **bébé allaité**, les selles sont plutôt **jaune d’or**, parfois verdâtres, grumeleuses, peu odorantes.
- Avec un **lait infantile**, elles sont plus épaisses, jaune pâle à brun clair, plus odorantes ; certains laits peuvent les rendre verdâtres.
- À la **diversification**, elles foncent et changent selon les aliments (orange avec les carottes, vert avec les épinards).
- Des selles **blanches ou couleur mastic, noires (hors méconium) ou rouge vif** font consulter **immédiatement**.

## Comprendre
La couleur des selles dépend surtout de l’alimentation et de la bile, un liquide fabriqué par le foie qui colore les selles. C’est pour cela qu’elle varie beaucoup d’un bébé à l’autre, et d’une période à l’autre chez un même bébé.

**Le méconium** se forme pendant la grossesse à partir de cellules de l’intestin, de liquide amniotique avalé, de mucus et de bile. Il est remplacé ensuite par des **selles de transition** brun-vert, puis par les selles « de lait ».

**Bébé allaité** : selles jaune d’or, parfois vertes, souvent assez liquides et grumeleuses, rarement dures.

**Bébé au lait infantile** : selles plus pâteuses ou moulées, plus marron et plus odorantes. Santé.fr précise que certains laits acidifiés donnent une teinte verdâtre sans gravité.

**Diversification** : les selles deviennent plus brunes et plus odorantes ; de petits morceaux non digérés peuvent apparaître.

D’autres éléments peuvent modifier l’aspect des selles : un changement de lait, certains médicaments, une poussée dentaire. Du **mucus** (glaires) peut se voir lors d’un rhume ou d’une salivation abondante.

## Au quotidien
- **Regardez la couche** sans vous inquiéter de chaque nuance : c’est l’ensemble qui compte (bébé mange-t-il, grossit-il, est-il éveillé et tonique ?).
- **Notez les changements nets** : une couleur inhabituelle qui dure, du sang, des glaires associées à des selles vertes persistantes.
- **Faites une photo** de la couche en cas de doute : elle aide beaucoup le médecin.
- **Pensez à l’alimentation** : à partir de la diversification, une selle orange après des carottes ou verte après des épinards s’explique par le repas.
- **Notez vos observations** (date, aspect, ce que bébé a mangé) pour en parler lors de la prochaine consultation.

## Questions fréquentes
**Des selles vertes, est-ce inquiétant ?** Chez un bébé allaité ou nourri avec certains laits, des selles verdâtres peuvent se voir chez un bébé en pleine forme. Des selles vertes **persistantes avec des glaires**, du sang ou des douleurs font consulter rapidement.

**Mon bébé n’a pas fait de méconium à la maternité, que se passe-t-il ?** L’équipe surveille ce point : en l’absence de méconium après 3 jours, un examen est réalisé pour vérifier le fonctionnement de l’intestin.

**Les selles de mon bébé ont des grumeaux blancs : est-ce du lait mal digéré ?** Les selles d’un bébé allaité sont souvent grumeleuses. Ne confondez pas ces petits grains avec des selles entièrement **décolorées**, qui sont un signe d’alerte.

**Un changement de lait peut-il changer la couleur ?** Oui, comme certains médicaments ou une poussée dentaire. Si bébé va bien, observez ; sinon, consultez.

## Quand demander conseil
Consultez **immédiatement** si les selles sont **blanches, grises ou couleur mastic**, **noires** en dehors du méconium, ou **rouge vif**. Consultez **rapidement** en cas de selles vertes persistantes avec glaires, de sang, de douleurs au ventre, ou si les changements s’accompagnent de fièvre, de vomissements, d’une jaunisse, d’une perte d’appétit ou d’une prise de poids insuffisante. Si bébé semble très mal, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 3, safety_critical: true,
    slug: 'selles-decolorees-noires-ou-avec-du-sang-bebe-alerte',
    title: 'Selles décolorées, noires ou avec du sang chez bébé : les signes d’alerte',
    summary: 'Certaines couleurs de selles ne doivent jamais attendre : pourquoi des selles blanches ou couleur mastic sont une urgence, que faire devant du sang ou des selles noires.',
    tags: ['selles blanches bébé', 'selles décolorées', 'selles mastic', 'urines foncées bébé', 'jaunisse qui dure', 'sang dans les selles bébé', 'selles noires bébé', 'atrésie des voies biliaires'],
    sources: [S.santeSelles, S.mpediaSelles, S.ameliExamen8j],
    body_md: `## En bref
- Des selles **blanches, gris pâle ou couleur mastic** peuvent révéler un problème du **foie ou des voies biliaires** : c’est une **urgence médicale**.
- Ce signe est **rare**, mais il doit être signalé au médecin **dès qu’il apparaît**, en particulier dans les premières semaines.
- Il est encore plus important si bébé a aussi une **jaunisse** ou des **urines foncées**.
- Des selles **noires** (hors méconium) ou **rouge vif** font aussi consulter **sans attendre**.
- Un teint qui reste **jaune après deux semaines de vie** fait consulter rapidement.

## Comprendre
Les selles doivent leur couleur jaune, verte ou brune à la **bile**, fabriquée par le foie et déversée dans l’intestin. Si la bile ne s’écoule plus, les selles se **décolorent**. Santé.fr cite parmi les causes possibles une **atrésie des voies biliaires**, une maladie rare des canaux qui transportent la bile. Plus elle est repérée tôt, mieux elle est prise en charge : c’est pourquoi la couleur des selles est surveillée de près les premières semaines. mpedia insiste : des selles décolorées doivent être signalées **immédiatement** au médecin dès la première semaine à la maison, surtout avec une jaunisse et des urines foncées.

**Selles noires** : en dehors du méconium des premiers jours, elles peuvent correspondre à du **sang digéré**.

**Selles rouge vif ou traces de sang** : il s’agit souvent de sang frais. Il peut venir d’une petite fissure de l’anus (par exemple avec des selles dures) ou d’une allergie aux protéines du lait de vache, mais seul un médecin peut le dire.

## Au quotidien
- **Regardez la couleur à chaque change** pendant les premières semaines, à la lumière du jour si possible.
- **Demandez à la maternité, à la sage-femme ou à la PMI** de vous montrer les couleurs de selles à surveiller.
- **Gardez la couche ou prenez une photo** si une selle vous semble pâle : cela aide le médecin à juger.
- **Regardez aussi les urines** : des urines foncées, chez un bébé dont les selles pâlissent, sont un signe à signaler sans attendre.
- **Observez la peau et le blanc des yeux** : une jaunisse qui persiste ou réapparaît après la sortie de maternité doit être montrée.
- **Ne vous fiez pas à l’état général** : un bébé avec des selles décolorées peut téter et sembler bien ; le signe compte quand même.

## Questions fréquentes
**Les selles de mon bébé allaité sont jaune très pâle : faut-il s’inquiéter ?** Un jaune pâle n’est pas un blanc. En cas de doute, montrez une photo ou la couche à votre médecin ou à la PMI le jour même ; il vaut mieux vérifier.

**Pourquoi tant d’insistance sur ce signe rare ?** Parce qu’une maladie des voies biliaires se soigne mieux quand elle est prise en charge tôt. Repérer la couleur des selles est un geste simple qui peut changer beaucoup.

**Un peu de sang rouge sur la couche après une selle dure : est-ce grave ?** Cela peut venir d’une petite fissure, mais il faut consulter rapidement pour en avoir le cœur net, surtout chez un tout-petit.

**Les selles foncées de la diversification sont-elles concernées ?** Non : à la diversification, les selles deviennent plus brunes, ce qui n’a rien à voir avec des selles noires comme du goudron. En cas de doute, montrez une photo au médecin.

## Quand demander conseil
Appelez votre médecin ou rendez-vous aux urgences **le jour même** si les selles sont blanches, grises ou couleur mastic, noires (hors méconium) ou rouge vif. Consultez rapidement si le teint reste jaune après deux semaines, si les urines sont foncées, en cas de fièvre, de vomissements, de refus de boire ou de comportement inhabituel. Si votre médecin n’est pas joignable, appelez le **15** : un professionnel vous orientera. En cas d’urgence vitale, le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 6,
    slug: 'frequence-et-consistance-des-selles-bebe-allaite-ou-biberon',
    title: 'Combien de selles par jour ? Fréquence et consistance chez bébé allaité ou au biberon',
    summary: 'Une selle à chaque tétée ou une par semaine : pourquoi le rythme varie autant chez le nourrisson et comment repérer une vraie constipation ou une diarrhée.',
    tags: ['nombre de selles bébé', 'bébé ne fait pas caca', 'selles liquides bébé allaité', 'constipation nourrisson', 'diarrhée bébé', 'bébé pousse rouge', 'dyschésie'],
    sources: [S.mpediaSelles, S.santeSelles],
    body_md: `## En bref
- Le nombre de selles **varie énormément** d’un bébé à l’autre : plusieurs par jour, ou parfois une par semaine chez certains bébés allaités après quelques semaines.
- Ce qui compte : bébé **mange bien, grossit, n’a pas le ventre très ballonné, ne vomit pas** et semble en forme.
- Les selles d’un nourrisson sont normalement **molles à pâteuses** ; celles d’un bébé allaité sont souvent **assez liquides et grumeleuses**.
- La **constipation**, ce sont surtout des selles **dures** (petites billes, boudin sec), un ventre tendu, des pleurs à l’évacuation.
- La **diarrhée**, ce sont des selles très liquides, soudaines, abondantes et fréquentes : surveillez de près le risque de déshydratation.

## Comprendre
**Bébé allaité** : les premières semaines, il fait souvent une selle après chaque tétée. Ensuite, le rythme peut ralentir nettement. mpedia et Santé.fr expliquent que certains bébés allaités n’ont plus qu’une selle par semaine, voire moins, sans que ce soit une maladie, à condition qu’ils soient en forme, qu’ils grossissent et ne semblent pas souffrir. Le lait maternel entraîne moins souvent constipation et diarrhée.

**Bébé au lait infantile** : selles plus épaisses et moulées, souvent plus régulières. Une préparation trop concentrée peut favoriser la constipation : il est important de respecter exactement les indications de préparation données par votre médecin et la boîte.

**Bébé qui pousse, rougit et se tortille** : cela ne veut pas dire qu’il est constipé. Si les selles ne sont pas dures et sortent sans sang, il peut s’agir d’un inconfort passager, de type coliques, qui s’améliore avec le temps.

## Au quotidien
- **Observez l’ensemble** plutôt que le calendrier : appétit, prise de poids lors des pesées, éveil, couches mouillées.
- **Proposez une gymnastique douce des jambes** : flexion-extension, mouvements « en grenouille », massage doux du ventre.
- **Au biberon, vérifiez la préparation** : respectez exactement les indications données par le professionnel qui suit bébé et sur la boîte.
- **Par fortes chaleurs ou en cas de diarrhée**, veillez à l’hydratation et parlez-en au professionnel qui suit bébé.
- **À éviter** : les remèdes maison non validés, comme l’eau d’Hépar avant 3 ans, et **jamais de thermomètre** ni d’objet dans l’anus pour « aider » : risque de blessure et de saignement.
- **Suppositoire à la glycérine** : mpedia le cite pour un usage occasionnel uniquement ; demandez d’abord conseil à votre médecin ou pharmacien.

## Questions fréquentes
**Mon bébé allaité de 6 semaines n’a pas fait de selle depuis 4 jours.** Si les selles, quand elles viennent, sont molles et que bébé tète, grossit et semble bien, ce rythme peut se voir chez un bébé allaité. En cas de ventre tendu, de vomissements, de refus de téter ou de doute, consultez.

**Ses selles sont très liquides : est-ce une diarrhée ?** Les selles d’un bébé allaité sont souvent liquides. On parle de diarrhée quand elles deviennent **brutalement** plus liquides, plus abondantes et plus fréquentes, souvent avec fièvre, vomissements ou baisse de l’appétit.

**Faut-il changer de lait en cas de constipation ?** Ne changez pas de lait de votre propre initiative ; parlez-en au médecin, qui vérifiera d’abord la préparation et l’hydratation.

**Les poussées dentaires changent-elles les selles ?** Santé.fr cite les poussées dentaires parmi les causes de selles plus liquides ou acides, qui peuvent irriter les fesses.

## Quand demander conseil
Consultez rapidement si les selles sont dures avec un ventre tendu et un bébé qui hurle, s’il y a du sang, si bébé vomit, a de la fièvre, refuse de boire, mouille moins ses couches ou prend mal du poids. En cas de diarrhée chez un nourrisson, surveillez de près son état : s’il devient très somnolent, boit peu ou mouille beaucoup moins ses couches, appelez le **15** ou le 112. Des selles blanches, noires ou rouges font consulter immédiatement.

${FIN}`,
  },
  // ------------------------------------------------------------------ aine, bourses, prépuce
  {
    ...BB, journeys: ['newborn', 'child'], min_age_months: 0, max_age_months: 72, safety_critical: true,
    slug: 'hernie-inguinale-bebe-grosseur-aine',
    title: 'Une petite grosseur dans l’aine de bébé : la hernie inguinale',
    summary: 'Une boule qui apparaît dans le pli de l’aine quand bébé pleure ou pousse et disparaît au calme : ce qu’est la hernie inguinale, pourquoi elle s’opère et quand c’est urgent.',
    tags: ['hernie inguinale bébé', 'boule aine bébé', 'grosseur pli de l’aine', 'hernie étranglée', 'hernie fille ovaire', 'prématuré hernie'],
    sources: [S.ameliHernieDef, S.ameliHernieTrt, S.ameliToilette],
    body_md: `## En bref
- La hernie inguinale est une **grosseur dans le pli de l’aine** : une partie de l’intestin (ou, chez la fille, parfois l’ovaire) passe par un petit orifice resté ouvert depuis la vie avant la naissance.
- Elle touche **2 à 5 % des enfants**, surtout les garçons, et plus souvent les bébés **nés prématurés**.
- On la découvre souvent **au change ou au bain** : la boule apparaît lors des efforts (pleurs, selles) et disparaît au calme.
- Elle **ne disparaît jamais seule** et doit être **opérée**, dans un délai court chez le bébé, à cause du risque d’**étranglement**.
- Une hernie **dure, douloureuse, qui ne rentre plus**, chez un bébé qui pleure ou vomit, est une **urgence**.

## Comprendre
Pendant la grossesse, un petit canal relie l’abdomen à la bourse chez le garçon (canal péritonéo-vaginal) ou aux grandes lèvres chez la fille (canal de Nück). Il se referme normalement avant la naissance. S’il reste ouvert, une partie d’organe peut s’y glisser : c’est la hernie inguinale **congénitale**. L’Assurance Maladie précise qu’elle n’est pas due à une faiblesse des muscles mais à cet orifice resté ouvert.

Le principal risque est l’**étranglement** : la partie engagée reste coincée et n’est plus bien irriguée. Il justifie une chirurgie urgente. Il est plus fréquent chez le garçon, et les complications (notamment l’atrophie du testicule ou de l’ovaire) sont plus probables quand la hernie a été étranglée.

**Le traitement** est chirurgical, le plus souvent en ambulatoire (retour le jour même), sous anesthésie générale ou régionale. Le chirurgien referme l’orifice, par une petite incision au pli de l’aine ou par cœlioscopie. L’enfant est revu ensuite pour vérifier la cicatrisation. Les complications sont rares.

## Au quotidien
- **Regardez les plis de l’aine** au moment du change et du bain, surtout quand bébé pleure ou pousse.
- **Notez ce que vous voyez** : côté, taille, moment d’apparition. Une photo peut aider le médecin, car la boule peut avoir disparu au moment de la consultation.
- **Parlez-en au médecin rapidement** : c’est lui qui confirme le diagnostic et oriente vers un chirurgien pédiatrique.
- **N’appuyez pas** vous-même sur la boule pour la faire rentrer.
- **En attendant l’opération**, connaissez les signes d’étranglement et gardez à portée le numéro du service qui suit votre enfant.
- **Après l’opération**, suivez les consignes de soins de la cicatrice et le rendez-vous de contrôle.

## Questions fréquentes
**La hernie peut-elle se refermer toute seule avec la croissance ?** Selon ameli, non : la hernie inguinale de l’enfant ne disparaît jamais spontanément et doit être opérée.

**Les filles peuvent-elles avoir une hernie inguinale ?** Oui, plus rarement. L’ovaire peut alors passer dans le canal ; le chirurgien vérifie qu’il n’y a ni ovaire ni trompe engagés.

**Est-ce la même chose que la hernie du nombril ?** Non. La hernie inguinale se situe dans le pli de l’aine. Toute grosseur du nombril ou de l’aine se montre au médecin.

**Pourquoi opérer vite un bébé ?** Parce que le risque d’étranglement est plus important chez le nourrisson : l’opération est programmée dans un court délai après le diagnostic.

## Quand demander conseil
Prenez rendez-vous rapidement avec votre médecin si vous remarquez une grosseur dans l’aine ou la bourse, même si elle disparaît au calme. Appelez le **15** (ou le 112) ou allez aux urgences si la grosseur devient **dure, douloureuse, rouge ou violacée, et ne rentre plus**, surtout si bébé pleure de façon inhabituelle, vomit ou refuse de manger.

${FIN}`,
  },
  {
    ...BB, journeys: ['newborn', 'child'], min_age_months: 0, max_age_months: 36,
    slug: 'testicule-non-descendu-cryptorchidie-bebe',
    title: 'Testicule non descendu (cryptorchidie) : surveiller, et opérer si besoin',
    summary: 'Une bourse vide à la naissance : pourquoi le testicule peut encore descendre les premiers mois, la différence avec le testicule « ascenseur » et l’âge auquel on opère.',
    tags: ['cryptorchidie', 'testicule non descendu', 'bourse vide bébé', 'testicule ascenseur', 'orchidopexie', 'testicule bébé'],
    sources: [S.ameliCryptoComp, S.ameliCryptoDiag, S.ameliCryptoTrt],
    body_md: `## En bref
- La cryptorchidie, c’est un **testicule absent de la bourse** à la naissance, parce qu’il n’a pas terminé sa descente pendant la grossesse.
- Elle concerne **2 à 4 % des nouveau-nés à terme** et 20 à 30 % des garçons prématurés ; un seul côté est touché dans 80 % des cas.
- La plupart des cas **se corrigent seuls au cours des 3 à 6 premiers mois** ; le pédiatre surveille.
- Si le testicule n’est pas descendu **après un an**, une petite chirurgie (orchidopexie) est proposée, **entre 1 et 2 ans**.
- Le **testicule « ascenseur »**, qui remonte puis redescend facilement, est différent et ne demande pas de traitement.

## Comprendre
Pendant la vie fœtale, les testicules se forment dans l’abdomen puis descendent dans les bourses. Lorsque cette migration est incomplète, le testicule se trouve le plus souvent au-dessus de la bourse ou dans l’aine. L’origine reste mal connue ; l’Assurance Maladie cite comme facteurs de risque la naissance prématurée, un petit poids de naissance, une naissance par le siège, des antécédents familiaux et l’exposition à des perturbateurs endocriniens pendant la grossesse.

Le **diagnostic** est clinique : la bourse est vide à la palpation. Il est souvent posé dès l’examen à la maternité, puis surveillé par le pédiatre ou le médecin traitant pendant les premiers mois. Des examens complémentaires ne sont demandés que dans certains cas (testicule non palpable, atteinte des deux côtés ou autre anomalie associée).

**Pourquoi traiter ?** Un testicule qui reste hors de la bourse n’est pas à la bonne température pour bien fonctionner plus tard ; il expose à un risque plus élevé d’infertilité et, plus rarement, de cancer du testicule à l’âge adulte. Une chirurgie précoce réduit ces risques et facilite la surveillance.

**Le testicule oscillant (ascenseur)** est présent dans la bourse mais remonte sous l’effet d’un petit muscle (le crémaster). Il redescend facilement à la palpation, n’existe pas à la naissance et se stabilise à la puberté.

## Au quotidien
- **Ne cherchez pas à faire descendre** le testicule vous-même.
- **Profitez des examens de suivi** des premiers mois : le médecin palpe les bourses à chaque fois. Notez vos observations, par exemple au moment du bain.
- **Si une opération est proposée**, elle se fait le plus souvent en ambulatoire sous anesthésie générale, après une consultation d’anesthésie.
- **Après l’opération**, consultez en cas de fièvre, de douleur importante ou de gonflement de la bourse. Les parents peuvent palper régulièrement les bourses pour vérifier la présence du testicule.
- **Plus tard**, à l’adolescence, votre fils pourra apprendre à palper lui-même ses testicules.

## Questions fréquentes
**Le testicule peut-il encore descendre après la naissance ?** Oui, jusqu’à 6 mois voire un an. Au-delà d’un an, l’anomalie est considérée comme définitive.

**L’opération est-elle lourde ?** C’est une intervention courante, souvent en ambulatoire ; dans environ 90 % des cas, une seule intervention suffit lorsque le testicule est palpable.

**Mon fils aura-t-il des difficultés pour avoir des enfants ?** Le risque existe surtout si les deux côtés sont touchés ; la chirurgie précoce le réduit de moitié selon ameli. Parlez-en avec le chirurgien.

**Est-ce lié à une hernie ?** Le médecin recherche une hernie inguinale associée lors de l’examen ; les deux peuvent coexister.

## Quand demander conseil
Signalez au médecin toute bourse qui vous paraît vide ou asymétrique. Une **bourse gonflée, rouge ou douloureuse**, ou un bébé qui pleure de façon inhabituelle avec une grosse bourse, peut évoquer une torsion du testicule : c’est une urgence, appelez le **15** (ou le 112) ou allez aux urgences sans attendre.

${FIN}`,
  },
  {
    ...BB, journeys: ['newborn', 'child'], category: 'premiers-secours', min_age_months: 0, max_age_months: 216, safety_critical: true,
    slug: 'torsion-du-testicule-bebe-enfant-urgence',
    title: 'Torsion du testicule : une urgence à connaître dès la naissance',
    summary: 'Bourse gonflée chez un bébé qui pleure, douleur brutale d’un testicule chez l’enfant : reconnaître la torsion du testicule et appeler le 15 sans attendre.',
    tags: ['torsion testicule', 'bourse gonflée bébé', 'douleur testicule enfant', 'urgence testicule', 'bourse rouge', 'appeler le 15'],
    sources: [S.ameliTorsion, S.ameliUrgences, S.ameliCryptoDiag],
    body_md: `## En bref
- La torsion du testicule survient quand le testicule **tourne sur lui-même** et coupe sa propre circulation sanguine.
- C’est une **urgence chirurgicale** : l’intervention doit avoir lieu idéalement **dans les 6 heures** pour préserver le testicule.
- **Chez le bébé** : il pleure et a une **grosse bourse douloureuse et inflammatoire**.
- **Chez l’enfant et l’adolescent** : **douleur brutale et très vive d’un testicule**, qui peut irradier vers l’aine, parfois avec nausées ou vomissements.
- Le bon réflexe : **appeler le 15** (ou le 112) ou aller **immédiatement** aux urgences.

## Comprendre
Selon l’Assurance Maladie, la torsion peut survenir à tout âge chez le garçon, y compris avant la naissance. Lorsqu’elle a eu lieu pendant la grossesse, le nouveau-né peut avoir une bourse enflée, dure, parfois brunâtre ou violacée, sans douleur ; le testicule est alors souvent déjà abîmé.

Chez le grand enfant ou l’adolescent, la douleur est brutale, d’un seul côté, et peut gêner la marche. Elle peut apparaître pendant une activité ou pendant le sommeil. Au début, il n’y a ni fièvre ni signe urinaire. Un enfant peut avoir du mal à dire où il a mal, ou être gêné d’en parler : une **douleur du bas-ventre ou de l’aine** chez un garçon doit faire penser à regarder les bourses.

L’Assurance Maladie range la torsion du testicule parmi les situations de l’enfant qui imposent de se rendre aux urgences, au même titre que d’autres urgences comme une forte déshydratation ou l’ingestion d’un produit toxique. Il vaut donc mieux connaître ses signes avant d’en avoir besoin, comme on connaît ceux de l’étouffement ou de la brûlure.

Le temps est l’élément clé : au-delà de quelques heures, les chances de sauver le testicule diminuent rapidement. L’opération ne doit pas être retardée, même si une échographie est parfois faite. Un **testicule non descendu** expose aussi à un risque de torsion.

## Au quotidien
- **Apprenez à regarder les bourses** au change et au bain : taille, couleur, symétrie.
- **Expliquez simplement à votre enfant**, dès qu’il peut comprendre, qu’il doit vous prévenir s’il a mal « au zizi » ou aux testicules, sans honte.
- **N’attendez pas que ça passe** : agissez tout de suite et suivez les consignes du médecin régulateur du 15.
- **Lors de l’appel au 15** : parlez calmement, donnez votre numéro, le nom de l’enfant, l’adresse exacte, décrivez les signes et ne raccrochez pas avant qu’on vous le dise.
- **Gardez le carnet de santé** et la carte Vitale à portée pour partir vite.

## Questions fréquentes
**Mon bébé pleure et sa bourse est un peu gonflée : est-ce forcément une torsion ?** Pas forcément (cela peut aussi être une hernie, par exemple), mais seul un médecin peut le dire et le délai compte. Appelez le 15 : un professionnel vous orientera.

**Mon fils de 12 ans a eu une douleur la nuit qui est passée : faut-il consulter ?** Oui, parlez-en à un médecin rapidement, même si la douleur a cédé.

**La torsion donne-t-elle de la fièvre ?** Au début, en général non. L’absence de fièvre ne doit pas rassurer.

**Peut-on prévenir la torsion ?** On ne peut pas la prévenir à la maison ; l’essentiel est de reconnaître les signes et d’agir vite.

**Faut-il passer une échographie avant d’aller aux urgences ?** Non. Selon ameli, l’opération ne doit pas être retardée par une échographie : allez directement aux urgences ou appelez le 15.

## Quand demander conseil
Appelez **immédiatement le 15** (ou le 112 ; le 114 pour les personnes sourdes ou malentendantes) ou rendez-vous aux urgences si votre bébé a une bourse gonflée, rouge, violacée ou douloureuse, ou si votre enfant a une douleur brutale d’un testicule, de l’aine ou du bas-ventre. Ces appels sont gratuits.

${FIN}`,
  },
  {
    ...BB, journeys: ['newborn', 'child'], category: 'sante-bebe', min_age_months: 0, max_age_months: 144,
    slug: 'prepuce-bebe-garcon-toilette-sans-decalotter',
    title: 'Prépuce du petit garçon : la toilette, sans décalotter',
    summary: 'Chez le nourrisson, le prépuce ne se décalotte pas et c’est attendu : comment faire la toilette, pourquoi ne jamais forcer et quand en parler au médecin.',
    tags: ['décalotter bébé', 'prépuce bébé', 'phimosis enfant', 'toilette pénis bébé', 'paraphimosis', 'balanite', 'zizi rouge bébé'],
    sources: [S.ameliPhimosisQue, S.ameliPhimosisDef, S.ameliToilette],
    body_md: `## En bref
- Chez le nouveau-né et le petit enfant, le **prépuce ne se décalotte pas** : seuls 4 % des nouveau-nés peuvent le faire complètement.
- À la toilette, on lave le pénis et les bourses **à l’eau et au savon, sans décalotter**.
- **Ne jamais forcer** : cela fait mal et peut provoquer des lésions, une infection et des cicatrices qui favorisent un vrai phimosis.
- Le prépuce s’assouplit avec la croissance, le plus souvent **avant 5 ans**, parfois plus tard, jusqu’à la puberté.
- Un gland ou un prépuce **enflammé avec brûlures en urinant**, ou un prépuce **coincé en arrière** du gland, font consulter **en urgence**.

## Comprendre
Le phimosis désigne un prépuce trop étroit pour laisser sortir facilement le gland. Chez le bébé et le jeune enfant, cette situation est **physiologique** : le prépuce est naturellement collé et serré, ne cause habituellement aucune gêne et se corrige avec la croissance. L’Assurance Maladie indique que la situation évolue chez la plupart des garçons avant 5 ans et qu’après la puberté, le décalottage est possible chez 99 % d’entre eux.

Les anciennes habitudes de décalotter les bébés à chaque toilette ne sont plus recommandées : décalotter de force peut **blesser** et créer des **cicatrices** qui rendent ensuite le prépuce moins souple.

Deux situations demandent une attention particulière :
- **La balanite** (ou balanoposthite) : inflammation du gland et du prépuce, avec rougeur, gonflement, brûlures en urinant, parfois écoulement.
- **Le paraphimosis** : le prépuce a été tiré en arrière et ne revient plus sur le gland, qu’il serre. Il nécessite une intervention médicale rapide.

## Au quotidien
- **Au change** : nettoyez les bourses et le pénis avec de l’eau et un savon doux, rincez, séchez en tamponnant. Pas besoin de crème systématique.
- **Orientez le pénis vers le bas** dans la couche les premières semaines, pour éviter que l’urine mouille le cordon.
- **Laissez faire le temps** : avec l’âge, votre enfant pourra apprendre à décalotter lui-même, doucement et sans douleur, par exemple sous la douche ou dans le bain.
- **Apprenez-lui à toujours remettre** le prépuce en place après la toilette.
- **Parlez-en lors des consultations de suivi** si vous avez des questions : le médecin peut regarder.

## Questions fréquentes
**Ma mère me dit qu’il faut décalotter mon bébé à chaque bain. Est-ce vrai ?** Non. Les recommandations actuelles sont de ne pas décalotter le nourrisson et de ne jamais forcer.

**Mon fils de 3 ans ne se décalotte pas : faut-il consulter ?** En l’absence de gêne, on laisse le prépuce s’assouplir. Si votre enfant a plus de 5 ans et ne peut toujours pas se décalotter, abordez-le lors d’une consultation de suivi.

**Faut-il faire quelque chose pour aider le prépuce à s’assouplir ?** En l’absence de gêne, ameli conseille de laisser le prépuce s’assouplir naturellement, ce qui peut prendre du temps. Le médecin vous dira, lors du suivi, si une prise en charge est utile.

**Son zizi est rouge au bout : que faire ?** Une rougeur avec gonflement et brûlures en urinant peut être une balanite ou une infection urinaire : consultez rapidement.

## Quand demander conseil
Consultez **en urgence** si le gland ou le prépuce est enflammé avec des brûlures en urinant (possible infection urinaire), ou si le prépuce reste coincé en arrière du gland sans pouvoir le recouvrir (paraphimosis) : appelez votre médecin, le 15 ou le 112 selon l’heure et l’état de l’enfant. Prenez rendez-vous sans urgence pour un enfant de plus de 5 ans qui ne se décalotte pas, en cas de difficultés à uriner, d’anomalie connue des voies urinaires ou d’infections urinaires répétées.

${FIN}`,
  },
  // ------------------------------------------------------------------ yeux
  {
    ...BB, min_age_months: 0, max_age_months: 3, safety_critical: true,
    slug: 'conjonctivite-du-nouveau-ne-premieres-semaines',
    title: 'Conjonctivite du nouveau-né : pourquoi on ne la laisse pas traîner',
    summary: 'Œil rouge, paupières collées, sécrétions jaunes chez un bébé de quelques semaines : nettoyer les yeux, savoir que ce peut être une urgence et quand consulter vite.',
    tags: ['conjonctivite nouveau-né', 'œil rouge bébé', 'œil collé bébé', 'sécrétions jaunes œil', 'pus œil bébé', 'sérum physiologique yeux'],
    sources: [S.mpediaConj, S.ameliToilette],
    body_md: `## En bref
- La conjonctivite est une **inflammation de la membrane qui recouvre l’œil** ; elle peut être virale, bactérienne ou, plus tard dans l’enfance, allergique.
- Signes : **œil rouge**, larmoiement, **paupières collées** par des sécrétions, surtout au réveil.
- **Pendant les premières semaines de vie**, une conjonctivite peut être une **urgence** : elle se montre rapidement à un médecin.
- En attendant, on **nettoie les yeux au sérum physiologique** avec une compresse propre pour chaque œil.
- Elle est **contagieuse** : l’hygiène des mains et du linge limite la transmission.

## Comprendre
Chez le nouveau-né, mpedia souligne qu’une conjonctivite peut nécessiter un traitement rapide, car sans prise en charge à temps elle peut laisser des séquelles. Il faut donc consulter **rapidement** en particulier si l’œil est très rouge, en cas de fièvre, ou si une **petite boule rougeâtre** apparaît près de l’angle interne de l’œil (infection du sac lacrymal, appelée dacryocystite). Un nez bouché ou une toux peuvent aussi accompagner certaines formes.

**Bactérienne ou virale ?** Une conjonctivite bactérienne donne plutôt des sécrétions **purulentes** (jaunes ou verdâtres) et des cils collés le matin ; elle commence souvent d’un côté puis touche les deux yeux. La forme virale donne plutôt une rougeur avec des larmes claires abondantes. L’Assurance Maladie rappelle qu’un œil rouge avec écoulement purulent nécessite une consultation, car une conjonctivite bactérienne est probable.

Le traitement dépend de la cause : un collyre antiseptique ou antibiotique peut être prescrit. Le seul nettoyage au sérum physiologique ne suffit parfois pas.

Chez certains bébés, un **canal lacrymal pas encore perméable** fait stagner les larmes et favorise des surinfections à répétition (voir l’article dédié à l’œil qui coule).

## Au quotidien
**Nettoyer les yeux de bébé**
1. Lavez-vous les mains.
2. Instillez quelques gouttes de **sérum physiologique** (dosette à usage unique) dans l’œil.
3. Essuyez avec une **compresse stérile**, en un seul passage, de l’extérieur vers l’intérieur comme l’indique ameli.
4. Utilisez **une compresse différente pour chaque œil**.
5. Jetez les compresses et lavez-vous à nouveau les mains.

**Limiter la contagion**
- Lavez-vous souvent les mains, ainsi que celles des aînés.
- Ne partagez pas serviettes et gants de toilette ; changez-les souvent, ainsi que les taies d’oreiller.
- Nettoyez régulièrement les jouets et surfaces que bébé touche.

**Si un collyre est prescrit** : suivez l’ordonnance, sans arrêter trop tôt, et demandez au pharmacien de vous montrer comment l’instiller.

## Questions fréquentes
**Le lait maternel dans l’œil, ça marche ?** mpedia indique qu’il est souvent utilisé mais sans preuve scientifique d’efficacité. Préférez le sérum physiologique et l’avis d’un professionnel.

**Puis-je attendre quelques jours avant de consulter ?** Chez un bébé de quelques semaines, mieux vaut ne pas attendre : montrez-le au médecin rapidement, surtout en cas de pus, d’œil très rouge ou de fièvre.

**Mon bébé peut-il aller à la crèche ?** La conjonctivite se transmet facilement en collectivité. Renseignez-vous auprès de la crèche et du médecin.

**Les conjonctivites reviennent souvent : pourquoi ?** Un canal lacrymal mal perméable peut en être la cause. Parlez-en au médecin, qui peut orienter vers un ophtalmologiste si nécessaire.

## Quand demander conseil
Consultez **rapidement** (dans la journée) si votre bébé de moins de 3 mois a un œil rouge avec des sécrétions, et **sans attendre** s’il a de la fièvre, si l’œil ou la paupière sont très rouges ou gonflés, ou si une petite boule rouge apparaît au coin interne de l’œil. Si bébé semble mal, a du mal à respirer ou à boire, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 18,
    slug: 'oeil-qui-coule-bebe-canal-lacrymal-bouche',
    title: 'Œil qui coule en permanence : le canal lacrymal pas encore ouvert',
    summary: 'Un œil qui pleure sans arrêt et se salit au coin chez un bébé par ailleurs en forme : comprendre l’obstruction du canal lacrymal, les soins et quand voir l’ophtalmologiste.',
    tags: ['œil qui coule bébé', 'larmoiement bébé', 'canal lacrymal bouché', 'sténose lacrymale', 'œil sale bébé', 'massage canal lacrymal', 'sondage lacrymal'],
    sources: [S.mpediaBobos, S.mpediaConj, S.ameliToilette],
    body_md: `## En bref
- Chez beaucoup de nourrissons, le **canal qui évacue les larmes** vers le nez n’est pas encore bien ouvert.
- Résultat : un **larmoiement permanent** d’un œil (ou des deux), des sécrétions au coin de l’œil, parfois des **surinfections** à répétition.
- La situation est **très courante** et se résout **presque toujours pendant la première année**.
- Les soins : **nettoyer régulièrement au sérum physiologique** et, si le médecin le conseille, **masser doucement** le coin interne de l’œil.
- Si le problème persiste **après le premier anniversaire**, le médecin peut orienter vers un **ophtalmologiste pédiatrique**.

## Comprendre
Les larmes sont fabriquées en permanence pour protéger l’œil. Elles s’écoulent ensuite par un petit canal situé au coin interne de l’œil, qui débouche dans le nez. Chez le nouveau-né, les parois de ce canal sont parfois encore **collées** : les larmes ne peuvent pas s’évacuer, débordent sur la joue et stagnent. mpedia décrit des **yeux « sales et jaunes »**, avec des sécrétions qui s’accumulent, surtout au réveil, chez un bébé par ailleurs en forme.

Les larmes qui stagnent favorisent la prolifération de microbes : c’est pourquoi ces bébés font plus souvent des **conjonctivites**. Parfois, le sac lacrymal lui-même s’infecte (**dacryocystite**) : une petite boule rouge et sensible apparaît alors près du coin interne de l’œil. Cette situation demande une consultation rapide.

Dans la grande majorité des cas, le canal s’ouvre spontanément avec la croissance au cours de la première année. Lorsque ce n’est pas le cas, ou en cas de surinfections chroniques, un ophtalmologiste peut proposer une petite intervention, le **sondage**, pour désobstruer le canal.

## Au quotidien
- **Nettoyez l’œil plusieurs fois par jour** avec du sérum physiologique et une compresse propre, en un seul passage, puis jetez la compresse.
- **Massez doucement**, si le médecin vous l’a montré : une légère pression du doigt propre sur le coin interne de l’œil, contre le nez. Demandez-lui de vous montrer le geste.
- **Lavez-vous les mains** avant et après chaque soin.
- **Observez l’aspect des sécrétions** : des larmes claires et quelques dépôts le matin ne sont pas la même chose qu’un œil rouge avec du pus.
- **Évitez les remèdes maison** : le lait maternel est souvent utilisé, mais mpedia rappelle qu’aucune preuve scientifique ne soutient son efficacité.
- **Si un collyre est prescrit** pour une surinfection, utilisez-le pendant la durée indiquée.

## Questions fréquentes
**Pourquoi un seul œil ?** Le canal peut être plus fermé d’un côté que de l’autre. Les deux côtés peuvent aussi être touchés.

**Mon bébé pleure-t-il « trop » ?** Non, ce ne sont pas des pleurs : c’est l’évacuation des larmes qui se fait mal. L’œil déborde même quand bébé est calme.

**Faut-il consulter un ophtalmologiste tout de suite ?** Pas forcément. Le médecin ou le pédiatre suit l’évolution et oriente vers un ophtalmologiste si les signes persistent après un an ou si les surinfections se répètent.

**Les infections à répétition peuvent-elles venir d’autre chose ?** mpedia mentionne aussi qu’une vue insuffisante peut être en cause dans des conjonctivites fréquentes : c’est une raison de plus d’en parler au médecin.

## Quand demander conseil
Consultez si l’œil devient **rouge**, si les sécrétions deviennent **jaunes ou verdâtres** et abondantes, si les paupières gonflent, ou si une **boule rouge et sensible** apparaît au coin interne de l’œil (consultation rapide, surtout chez un bébé de moins de 3 mois). Parlez-en au médecin si le larmoiement persiste après le premier anniversaire. En cas de fièvre chez un nouveau-né ou de bébé qui semble mal, appelez le 15 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ boutons et taches
  {
    ...BB, min_age_months: 0, max_age_months: 3,
    slug: 'boutons-du-nouveau-ne-acne-milium-erytheme-toxique',
    title: 'Petits boutons du nouveau-né : acné, milium et érythème toxique',
    summary: 'Boutons rouges sur les joues vers un mois, points blancs sur le nez, taches qui vont et viennent : les éruptions fréquentes et bénignes des premières semaines, et ce qui doit alerter.',
    tags: ['acné du nourrisson', 'boutons bébé visage', 'points blancs nez bébé', 'milium', 'érythème toxique', 'boutons nouveau-né', 'peau bébé'],
    sources: [S.mpediaBobos, S.ameliBebeSante],
    body_md: `## En bref
- La peau du nouveau-né change beaucoup les premières semaines, et plusieurs éruptions **fréquentes et bénignes** peuvent apparaître.
- **Acné du nouveau-né** : petits boutons rouges qui ressemblent à de l’acné, souvent vers **la fin du premier mois** ; elle disparaît en quelques semaines.
- **Milium** : petits **points blancs** sur le nez, les joues, le menton, dus à une rétention de sébum ; ils partent seuls.
- **Érythème toxique** : taches rougeâtres, parfois avec un petit point jaunâtre au centre, qui apparaissent et disparaissent à différents endroits du corps, très courant les 2 à 3 premières semaines.
- Ce qui doit faire consulter : **fièvre**, bébé qui mange moins ou semble mal, boutons avec **pus** ou **cloques**, éruption qui s’étend.

## Comprendre
**L’acné du nouveau-né** apparaît en général vers la fin du premier mois, surtout sur le visage. Elle disparaît spontanément en quelques semaines. mpedia conseille d’en parler lors de la **visite du premier mois** : le médecin peut proposer un soin adapté si besoin.

**Le milium** se présente comme de minuscules points blancs, sur le nez, les joues et le menton. Il est lié à une rétention de sébum, n’est pas contagieux et disparaît seul en quelques semaines, sans traitement particulier.

**L’érythème toxique** porte un nom impressionnant, mais mpedia le décrit comme bénin et très courant pendant les deux ou trois premières semaines. Les taches rougeâtres, irrégulières, peuvent entourer de petites surélévations jaunâtres ; elles se déplacent sur le corps et disparaissent rapidement, sans traitement.

Toutes ces éruptions surviennent chez un bébé **en forme**, qui tète bien et n’a pas de fièvre. C’est ce point qui les distingue d’une éruption liée à une infection.

## Au quotidien
- **Lavez simplement le visage** à l’eau tiède, avec une compresse ou un gant propre, puis séchez en tamponnant.
- **Évitez les produits parfumés** et le savon sur le visage : l’Assurance Maladie recommande une toilette sans savon ni produit parfumé pour les tout-petits.
- **Ne percez pas les boutons** et ne grattez pas les petits grains blancs.
- **N’appliquez pas de crème pour adulte** (anti-acné, huiles essentielles, etc.).
- **Lavez les vêtements neufs** avant la première utilisation.
- **Gardez ses ongles courts** pour limiter les griffures sur une peau irritée.
- **Prenez une photo** si l’éruption change : elle aide le médecin lors de la consultation suivante.

## Questions fréquentes
**L’acné de mon bébé vient-elle de mon alimentation ou du lait ?** Les sources consultées ne font pas ce lien. Elle disparaît spontanément ; parlez-en au médecin si elle vous inquiète.

**Faut-il mettre une crème ?** En général, aucun traitement n’est nécessaire. Si l’acné est marquée, le médecin peut prescrire un soin adapté lors de la visite du premier mois.

**L’érythème toxique est-il contagieux ou allergique ?** Il est bénin et ne demande pas de traitement ; il disparaît rapidement.

**Comment savoir si c’est autre chose ?** Une éruption avec fièvre, des cloques, du pus, ou chez un bébé qui tète moins, n’entre pas dans ces petites éruptions habituelles : consultez.

## Quand demander conseil
Consultez sans tarder si l’éruption s’accompagne de **fièvre** (chez un bébé de moins de 3 mois, toute fièvre fait consulter rapidement), si les boutons contiennent du **pus**, forment des **cloques** ou des croûtes, s’ils s’étendent vite, ou si bébé est grognon, tète moins ou semble fatigué. Si votre bébé semble très mal, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, journeys: ['newborn', 'child'], min_age_months: 0, max_age_months: 72,
    slug: 'boutons-de-chaleur-bebe-miliaire',
    title: 'Boutons de chaleur chez bébé : reconnaître et prévenir la miliaire',
    summary: 'Petits boutons sur le front, le cou ou le torse quand il fait chaud : ce qu’est la miliaire, comment rafraîchir bébé et quand l’éruption doit faire consulter.',
    tags: ['boutons de chaleur', 'bourbouille', 'miliaire', 'boutons cou bébé', 'bébé transpire', 'été bébé', 'éruption chaleur'],
    sources: [S.mpediaChaleur, S.ameliBebeSante, S.ameliCoucher],
    body_md: `## En bref
- Les boutons de chaleur (**miliaire**) apparaissent quand la chaleur et l’humidité **bouchent les glandes de la sueur**.
- Chez le bébé, ils touchent surtout **le front, le cuir chevelu, le cou, le torse et les fesses**.
- Ils sont **sans gravité et non contagieux**, et disparaissent en général **en 1 à 3 jours** quand la peau est rafraîchie.
- La prévention : **vêtements amples et légers**, pièce aérée, peau propre et sèche, **bébé bien hydraté**.
- On consulte en cas de **fièvre**, de **pus**, de ganglions gonflés ou si bébé est inconfortable et mange moins.

## Comprendre
La peau du bébé est plus fine et plus sensible que celle de l’adulte. Quand il fait chaud, que bébé est trop couvert ou que des vêtements serrés frottent, la sueur s’évacue mal et de petites éruptions se forment. mpedia décrit trois formes : de petites vésicules claires très superficielles, des boutons rouges qui démangent, ou plus rarement des lésions plus profondes. Les boutons sont souvent petits, blancs, transparents ou rosés, et se sentent au toucher.

Certains facteurs favorisent la miliaire : des bodys trop ajustés en été, les frottements répétés, des crèmes épaisses qui bouchent les pores, la transpiration. D’autres affections peuvent y ressembler, comme l’eczéma (plaques rouges et sèches qui démangent fortement) ou l’urticaire (plaques en relief qui apparaissent et disparaissent vite) : en cas de doute, consultez.

## Au quotidien
- **Habillez léger** : vêtements amples, en coton ou en lin, qui laissent passer l’air. Une seule couche suffit souvent par temps chaud.
- **Vérifiez la nuque** : si elle est moite, bébé a trop chaud.
- **Aérez les pièces** et, si possible, gardez la température en dessous de 25 °C selon mpedia ; dans la chambre, les repères habituels restent entre 18 et 20 °C pour dormir.
- **Gardez la peau propre et sèche** : bain ou douche courts, séchage en tamponnant, surtout dans les plis.
- **Évitez les crèmes épaisses** et les produits gras sur les zones touchées ; préférez des produits légers, non comédogènes, adaptés aux bébés.
- **Hydratez bébé** : proposez le sein plus souvent par temps chaud ; s’il n’est pas allaité, demandez au professionnel qui le suit comment adapter les apports en eau.
- **Évitez les fortes chaleurs** : sorties aux heures fraîches, jamais de bébé dans une voiture au soleil.

## Questions fréquentes
**Faut-il mettre une crème sur les boutons de chaleur ?** En général non : les lésions disparaissent sans traitement spécifique en 1 à 3 jours, avec une peau rafraîchie et bien sèche.

**Mon bébé se gratte : est-ce grave ?** La forme rouge peut démanger. Rafraîchissez-le et allégez ses vêtements ; si les démangeaisons persistent, consultez.

**Est-ce contagieux pour la crèche ?** Non, la miliaire n’est pas contagieuse.

**Comment différencier de l’eczéma ?** L’eczéma forme des plaques sèches, rugueuses, qui démangent fortement et durent ; les boutons de chaleur sont petits et disparaissent quand bébé a moins chaud. En cas de doute, demandez l’avis du médecin.

## Quand demander conseil
Consultez rapidement si votre enfant a de la **fièvre** (pour un bébé de moins de 3 mois, toute fièvre fait consulter), si du **pus** s’écoule des boutons, si des **ganglions** gonflent, ou si un nourrisson est inconfortable, pleure, mange moins. Par forte chaleur, un bébé très somnolent, qui boit peu ou mouille beaucoup moins ses couches doit être vu en urgence : appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 3,
    slug: 'peau-seche-qui-pele-nouveau-ne',
    title: 'Peau sèche qui pèle chez le nouveau-né : quels soins ?',
    summary: 'Dans les premières semaines, la peau de bébé peut sécher et peler : comprendre ce phénomène et adopter une toilette douce, avec un émollient, qui respecte la barrière cutanée.',
    tags: ['peau qui pèle bébé', 'peau sèche nouveau-né', 'desquamation', 'xérose', 'émollient bébé', 'bain bébé', 'peau fragile'],
    sources: [S.mpediaBobos, S.mpediaToilette, S.ameliBebeSante],
    body_md: `## En bref
- Dans les premières semaines, la peau de bébé peut **sécher et peler**, par endroits ou sur une grande partie du corps.
- mpedia parle de **xérose** et conseille l’application d’un **émollient** (crème hydratante adaptée aux bébés) sur tout le corps, en massant doucement.
- La toilette doit rester **douce** : un bain court (environ 5 minutes), une eau autour de 37 °C, pas trop de lavages répétés.
- Les produits parfumés et le savon en excès sont à éviter.
- Une peau **rouge, qui démange, suinte ou se fissure** demande un avis médical.

## Comprendre
La peau du nouveau-né est plus fine que celle de l’adulte et sa **barrière cutanée** est encore immature. La couche superficielle peut alors se détacher en petites peaux. Un émollient appliqué quotidiennement aide à restaurer cette barrière, selon mpedia.

Des bains trop longs ou trop fréquents, de l’eau trop chaude, des savons agressifs ou parfumés peuvent dessécher encore la peau. mpedia rappelle qu’un bain par jour suffit et que des lavages répétés fragilisent la peau ; l’Assurance Maladie conseille une toilette sans savon ni produit parfumé, et de laver les textiles avant leur première utilisation.

Il ne faut pas confondre cette desquamation avec l’**eczéma atopique**, qui forme des plaques rouges, rugueuses, qui démangent et reviennent, ni avec les **croûtes de lait**, qui touchent le cuir chevelu.

## Au quotidien
- **Préparez la salle de bain** entre 22 et 24 °C, et vérifiez l’eau du bain (environ 37 °C) avec un thermomètre au début, puis avec le coude ou l’avant-bras.
- **Faites court** : 5 minutes de bain suffisent.
- **Peu ou pas de savon** : un produit doux, sans parfum, adapté aux bébés, en petite quantité, bien rincé.
- **Séchez en tamponnant**, sans frotter, en insistant dans les plis du cou, des aisselles, de l’aine et derrière les oreilles.
- **Appliquez un émollient** adapté aux bébés sur la peau sèche, en massant doucement. Choisissez un produit sans parfum, spécifique aux nourrissons ; demandez conseil au pharmacien.
- **Ne tirez pas** sur les petites peaux qui se détachent : laissez-les tomber seules.
- **Habillez bébé en coton**, avec des vêtements lavés avant le premier port, sans adoucissant parfumé.

## Questions fréquentes
**Mon bébé pèle beaucoup aux pieds : est-il déshydraté ?** Une desquamation de la peau n’est pas en elle-même un signe de déshydratation. Ce qui doit alerter, c’est un bébé qui boit peu, mouille moins ses couches, est très somnolent.

**Faut-il espacer les bains ?** Un bain court par jour suffit, sans obligation. Une toilette au gant les autres jours est aussi possible.

**Les huiles végétales sont-elles une bonne idée ?** Les sources consultées recommandent un émollient adapté ; mpedia déconseille l’huile d’amande douce, qui peut sensibiliser à l’amande.

**Quand penser à l’eczéma ?** Si des plaques rouges et rugueuses apparaissent, démangent et persistent malgré l’émollient, parlez-en au médecin.

## Quand demander conseil
Consultez si la peau devient **rouge, suintante, fissurée** ou si bébé se gratte et dort mal ; si des plaques reviennent régulièrement ; ou si la peau s’accompagne de **fièvre**, de cloques ou d’une jaunisse qui dure. Un bébé qui boit peu, est très somnolent ou mouille beaucoup moins ses couches doit être vu rapidement ; en cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 48,
    slug: 'hemangiome-infantile-tache-rouge-bebe',
    title: 'Une tache ou une « fraise » rouge qui grossit : l’hémangiome infantile',
    summary: 'Une tache rouge vif ou une petite boule bleutée qui apparaît le premier mois : ce qu’est l’hémangiome infantile, comment il évolue et pourquoi le montrer vite au médecin.',
    tags: ['hémangiome', 'angiome bébé', 'tache rouge bébé', 'fraise bébé', 'tache de naissance', 'boule rouge peau bébé', 'hémangiome visage'],
    sources: [S.mpediaHemangiome, S.mpediaBobos],
    body_md: `## En bref
- L’hémangiome infantile est une **tache ou une boule rouge**, de quelques millimètres à plusieurs centimètres, liée à un **développement excessif de petits vaisseaux** dans la peau.
- Il apparaît **pendant le premier mois de vie** et touche environ **4,5 % des nourrissons**, plus souvent les bébés prématurés.
- Il **grossit** surtout pendant les **6 premiers mois**, puis se **stabilise** et pâlit, généralement après un an.
- Dans **plus de 80 % des cas**, il régresse sans complication ; environ **un sur dix** nécessite un avis spécialisé.
- Il faut le **montrer rapidement** au médecin, surtout s’il est près des yeux, du nez, de la bouche, ou s’il s’ulcère.

## Comprendre
mpedia décrit trois formes : **superficielle** (plaque rouge vif, en relief, parfois appelée « fraise »), **profonde** (boule bleutée sous la peau, parfois confondue avec un bleu) et **mixte**. Les facteurs de risque cités sont la grande prématurité, les grossesses multiples, certaines complications de la grossesse et des antécédents familiaux.

L’évolution suit généralement deux phases :
- **De 0 à 6 mois, la phase de croissance** : l’hémangiome augmente de taille. C’est la période où le suivi est le plus rapproché, pour repérer les situations à risque.
- **Après un an, la stabilisation puis la régression** : il pâlit, devient plus mou et diminue peu à peu, sur plusieurs années.

Certains hémangiomes laissent des traces, discrètes (petits vaisseaux visibles) ou plus marquées (peau un peu flétrie, cicatrice). Les **localisations à risque** sont surtout le voisinage des yeux (risque pour la vision), du nez ou de la bouche (gêne pour respirer ou manger). Un hémangiome **ulcéré** (qui forme des croûtes) peut laisser une cicatrice.

Dans la majorité des cas, aucun traitement n’est nécessaire. Selon la situation, un spécialiste (souvent un dermatologue) peut proposer un traitement médicamenteux, un laser ou, plus rarement, une chirurgie.

## Au quotidien
- **Consultez tôt** dès que vous remarquez une tache rouge qui apparaît ou grossit : mpedia recommande de voir rapidement le médecin ou le pédiatre.
- **Photographiez la lésion** régulièrement, avec une règle ou une pièce à côté pour l’échelle, à la même lumière : c’est très utile pour le suivi.
- **Protégez la zone** des frottements (vêtements, bretelles de porte-bébé) et des griffures.
- **Ne mettez pas de crème** ni de produit sans avis médical.
- **Préparez-vous aux questions** de l’entourage : le regard des autres peut être difficile. Une phrase simple (« c’est un angiome, il est suivi par le médecin ») aide souvent.
- **Parlez de vos émotions** : l’inquiétude des parents est fréquente, n’hésitez pas à en parler au médecin.

## Questions fréquentes
**Est-ce une tache de naissance ?** On l’appelle souvent ainsi, mais il n’est en général pas visible à la naissance : il apparaît au cours du premier mois.

**Va-t-il disparaître complètement ?** Il diminue dans la grande majorité des cas, sur plusieurs années, mais peut laisser une marque. Le médecin vous dira si un traitement peut aider.

**Pourquoi tant d’insistance sur les hémangiomes du visage ?** Parce que près des yeux, du nez ou de la bouche, ils peuvent gêner la vision, la respiration ou l’alimentation, et justifient une consultation spécialisée.

**Faut-il s’inquiéter s’il forme une croûte ?** Un hémangiome qui s’ulcère, avec des croûtes, peut laisser une cicatrice : montrez-le rapidement au médecin pour qu’il soit pris en charge.

## Quand demander conseil
Montrez **rapidement** au médecin toute tache rouge ou boule bleutée qui apparaît ou grossit dans les premières semaines. Consultez **sans attendre** si l’hémangiome est près d’un œil, du nez ou de la bouche, s’il grossit vite, s’il saigne ou forme des croûtes. En cas de saignement important ou de gêne pour respirer, appelez le 15 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ digestion : rappel
  {
    ...BB, min_age_months: 0, max_age_months: 12,
    slug: 'regurgitation-ou-vomissement-faire-la-difference',
    title: 'Régurgitation ou vomissement ? Faire la différence et éviter les idées reçues',
    summary: 'Rejet de lait sans effort ou vomissement avec contractions : les repères pour distinguer les deux, ce qui n’est plus conseillé contre le reflux et les signes d’alerte.',
    tags: ['régurgitations', 'vomissement bébé', 'reflux bébé', 'RGO nourrisson', 'surélever le lit bébé', 'transat reflux', 'lait épaissi'],
    sources: [S.ameliRgoDef, S.ameliRgoTrt],
    body_md: `## En bref
- La **régurgitation** est un rejet de lait par la bouche **sans effort**, parfois au moment du rot, sans contraction du ventre.
- Le **vomissement** s’accompagne de **contractions musculaires** du ventre : bébé « pousse » pour rejeter.
- Les régurgitations concernent environ **deux tiers des bébés de 4 à 5 mois** et seulement 5 % à 10–12 mois : elles diminuent avec la position assise, la marche et les repas solides.
- **Surélever la tête du lit n’est plus recommandé** : bébé dort sur le dos, à plat.
- Sang dans les rejets, pleurs, refus de manger, perte de poids : **consultez**.

## Comprendre
Le **reflux gastro-œsophagien (RGO)** désigne la remontée du contenu de l’estomac dans l’œsophage. Chez le nourrisson, il est très fréquent : le petit « clapet » entre l’œsophage et l’estomac est encore immature et peut se relâcher au mauvais moment, et l’estomac, de faible capacité, se distend facilement avec le lait et l’air avalé. Les régurgitations en sont la conséquence la plus visible. Elles apparaissent souvent avant 3 mois, après les repas, et sont favorisées par l’alimentation liquide, les changements de position et la compression du ventre.

L’Assurance Maladie distingue :
- le **RGO simple**, de loin le plus fréquent : bébé régurgite mais garde l’appétit, grandit et prend du poids régulièrement. Des mesures simples suffisent ; il disparaît en général avant 1 an ;
- le **RGO compliqué**, plus rare, quand l’acidité irrite l’œsophage (œsophagite). Il nécessite un avis, des examens et parfois un traitement.

Un **vomissement**, lui, peut avoir de nombreuses causes (infection comme une gastro-entérite, par exemple). Des vomissements répétés chez un nourrisson se signalent toujours à un médecin.

## Au quotidien
- **Poursuivez l’allaitement** sans changement ; au biberon, préparez-le exactement selon les recommandations.
- **Fractionnez** : selon ameli, des repas moins copieux mais plus fréquents peuvent aider ; parlez-en au professionnel qui suit bébé avant de changer le rythme.
- **Faites des pauses** pendant la tétée ou le biberon pour un rot.
- **Évitez de coucher bébé juste après le repas** ; ensuite, couchez-le **sur le dos**, à plat. Les dispositifs pour surélever ou caler ne sont pas recommandés.
- **Limitez le transat et le siège auto** en journée : cette position comprime l’estomac et peut aggraver le reflux.
- **Le lait épaissi** peut être proposé par le médecin ; ne changez pas de lait sans son avis.
- **Protégez vos vêtements** avec un lange plutôt que de chercher à supprimer toutes les régurgitations : un bébé qui régurgite et grossit bien n’a souvent besoin que de patience.

## Questions fréquentes
**Mon bébé régurgite beaucoup mais grossit bien : faut-il un traitement ?** Dans un RGO simple bien toléré, seules des mesures pratiques sont utilisées. Les médicaments contre l’acidité sont réservés à des situations précises décidées par le médecin.

**Faut-il le coucher sur le ventre ou incliné pour éviter qu’il s’étouffe ?** Non. La position sur le dos, à plat, est recommandée pour toutes les siestes et la nuit. Surélever le lit ne réduit pas les régurgitations.

**Peut-il s’agir d’une allergie au lait ?** Le médecin peut y penser, surtout en cas d’eczéma ou d’asthme associés ; il propose alors un essai d’alimentation adaptée sous son contrôle.

**Le reflux peut-il donner de la toux ?** ameli indique que le reflux acide peut aggraver la toux, la laryngite ou l’enrouement. Parlez-en au médecin si ces signes se répètent.

## Quand demander conseil
Consultez votre médecin si les régurgitations gênent bébé (cris, pleurs, refus du biberon ou du sein), si la courbe de poids ralentit, si les mesures conseillées ne suffisent pas, ou si bébé est agité après les repas ou pendant le sommeil. Consultez **rapidement** en cas de **sang** dans les rejets, de **vomissements répétés**, de fièvre, de refus de boire ou de couches beaucoup moins mouillées. En cas de malaise, de pâleur intense ou de difficulté à respirer, appelez le **15** ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ tête plate
  {
    ...BB, category: 'developpement', min_age_months: 0, max_age_months: 6,
    slug: 'plagiocephalie-prevenir-la-tete-plate-au-quotidien',
    title: 'Prévenir la tête plate (plagiocéphalie) : les gestes du quotidien',
    summary: 'Coucher bébé sur le dos tout en évitant que sa tête s’aplatisse : temps sur le ventre, mobilité libre, nacelle plutôt que coque, et gadgets à éviter.',
    tags: ['plagiocéphalie', 'tête plate bébé', 'prévenir tête plate', 'bébé sur le ventre', 'cosi', 'transat', 'coussin anti tête plate'],
    sources: [S.hasPlagio, S.mpediaPlagio, S.ameliCoucher],
    body_md: `## En bref
- La **plagiocéphalie positionnelle** est un aplatissement d’une zone du crâne, souvent à l’arrière, lié à un **appui répété** de la tête du même côté.
- Le crâne de bébé est **plus malléable pendant les 6 premiers mois**.
- Le couchage **sur le dos reste impératif** pour le sommeil : il protège de la mort inattendue du nourrisson.
- La prévention se joue **pendant l’éveil** : bouger librement, jouer **sur le ventre sous surveillance**, varier les positions.
- **À éviter** : les cale-tête, les coussins « anti-tête plate » et le temps prolongé en coque ou en transat.

## Comprendre
Depuis que les bébés dorment sur le dos, la mort inattendue du nourrisson a beaucoup reculé : la HAS rappelle une baisse de 76 % depuis les années 1990. En parallèle, les têtes plates sont devenues plus visibles. Pour la HAS et mpedia, la cause principale n’est pas le couchage sur le dos en lui-même, mais le **manque de mobilité** : un bébé qui passe beaucoup de temps la tête appuyée au même endroit, notamment dans une **coque de transport (cosi)** ou un **transat** utilisés tôt et longtemps, tourne moins la tête.

La HAS indique que cette déformation est **bénigne** : elle n’a pas d’autre conséquence qu’esthétique selon les données citées, et disparaît le plus souvent **vers 2 ans** grâce aux mouvements spontanés de l’enfant. Mieux vaut cependant la prévenir dès les premières semaines.

## Au quotidien
**Pendant le sommeil**
- Couchez bébé **sur le dos, à plat**, dans son lit, sans coussin ni cale.
- **Alternez l’orientation de sa tête** : mpedia propose une semaine d’un côté, la suivante de l’autre (par exemple en le couchant tête d’un côté puis de l’autre du lit).
- **Changez de temps en temps la position du lit** dans la chambre par rapport à la porte ou à la fenêtre, qui attirent son regard.

**Pendant l’éveil**
- Posez-le souvent **sur le ventre**, sur un tapis ferme, toujours **sous votre surveillance** : cela renforce les muscles du cou et prépare les retournements.
- Préférez un **tapis au sol avec des jouets autour** plutôt qu’un transat avec arche ou un mobile fixé d’un seul côté.
- **Placez-vous du côté opposé** à celui vers lequel il tourne habituellement la tête, et attirez son regard avec la voix ou un jouet sonore.
- **Alternez le bras** qui le tient pendant les tétées ou les biberons, et les côtés au change.

**En promenade et en voiture**
- Utilisez une **nacelle** pour les promenades les premiers mois.
- Réservez la coque au **trajet en voiture** ; ne l’utilisez pas comme lit.

**Les gadgets** : les coussins anti-plagiocéphalie sont déconseillés par la HAS et mpedia : ils limitent la rotation de la tête et bébé risque d’y enfouir son visage.

## Questions fréquentes
**Puis-je coucher bébé sur le côté pour éviter la tête plate ?** Non. Le couchage sur le côté est instable et celui sur le ventre peut gêner la respiration : pour dormir, toujours sur le dos.

**Il n’aime pas être sur le ventre, que faire ?** Proposez de courts moments, plusieurs fois par jour, en vous mettant à sa hauteur et en lui montrant un jouet coloré ou sonore, toujours sous surveillance.

**Le transat est-il interdit ?** Non, mais mpedia et la HAS invitent à limiter le temps en transat ou en coque et à privilégier le tapis au sol, où bébé bouge librement.

**La tête plate a-t-elle un effet sur son développement ?** Selon les données citées par la HAS, non : elle n’est pas liée à un retard du développement.

## Quand demander conseil
Parlez-en au médecin lors des examens de suivi si vous voyez un méplat, une asymétrie du visage ou des oreilles, ou si bébé tourne toujours la tête du même côté. Consultez si votre bébé a **du mal à bouger le cou** (torticolis) : une kinésithérapie précoce peut être prescrite. Pour toute urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, category: 'developpement', min_age_months: 0, max_age_months: 24,
    slug: 'tete-plate-deja-installee-que-faire-torticolis',
    title: 'La tête de bébé s’aplatit déjà : que faire, et quand penser au torticolis ?',
    summary: 'Un méplat est apparu ou bébé regarde toujours du même côté : les gestes qui aident à corriger, le rôle du médecin et du kinésithérapeute, et l’orientation vers un centre spécialisé.',
    tags: ['tête plate que faire', 'plagiocéphalie traitement', 'torticolis bébé', 'bébé tourne la tête d’un côté', 'kiné bébé', 'casque plagiocéphalie', 'orthèse crânienne'],
    sources: [S.hasPlagio, S.ameliCoucher, S.ameliBebeSante],
    body_md: `## En bref
- Si un aplatissement apparaît, l’objectif est d’**éviter l’appui sur la zone plate** et de **multiplier les moments de mouvement** pendant l’éveil.
- Un bébé qui a **du mal à tourner le cou** d’un côté (torticolis) doit être vu par un médecin : une **kinésithérapie précoce** peut être prescrite.
- La plupart des têtes plates s’améliorent avec la croissance et la mobilité ; elles disparaissent le plus souvent **vers 2 ans**.
- Si la déformation **ne s’améliore pas**, l’enfant peut être orienté tôt, **dès la fin du premier semestre**, vers un **centre de référence** des malformations crânio-faciales.
- L’**orthèse crânienne** (casque) est prescrite **exceptionnellement**, par ces centres.

## Comprendre
La plagiocéphalie positionnelle donne une forme un peu oblique à la tête, avec un méplat à l’arrière d’un côté. Elle est souvent associée à une **préférence de rotation** : bébé regarde toujours du même côté, et la tête repose donc toujours au même endroit. Quand cette préférence est liée à une difficulté à tourner le cou, on parle de **torticolis** ; la HAS recommande alors de consulter un médecin, qui peut prescrire de la kinésithérapie tôt.

La HAS indique que cette déformation est bénigne, sans conséquence autre qu’esthétique selon les données disponibles, et qu’elle n’est pas associée à un retard de développement ni à des troubles de la vue. Elle disparaît le plus souvent vers 2 ans, quand l’enfant bouge, s’assoit, se retourne. Le casque n’est pas un traitement de première intention : il est réservé à des situations exceptionnelles, décidées par un centre spécialisé.

L’Assurance Maladie rappelle aussi qu’un léger aplatissement à l’arrière, avec usure des cheveux à cet endroit, est fréquent et s’atténue quand bébé change lui-même de position.

## Au quotidien
- **Évitez l’appui sur la zone plate** pendant l’éveil : portez-le, posez-le sur le ventre ou sur le côté sous surveillance, en veillant à ce qu’il ne s’endorme pas dans ces positions.
- **Pour dormir, toujours sur le dos**, à plat, sans cale ni coussin, en alternant l’orientation de sa tête et en évitant qu’elle repose toujours sur la zone plate.
- **Sollicitez le côté « difficile »** : parlez-lui, chantez, montrez les jouets et la lumière de ce côté-là ; installez la table à langer et le lit pour qu’il doive tourner la tête dans ce sens pour vous voir.
- **Faites les exercices du kinésithérapeute** si une rééducation est prescrite, à la maison, dans le jeu.
- **Limitez coques et transats** au strict nécessaire.
- **Prenez une photo du dessus de la tête** une fois par mois, toujours sous le même angle, pour suivre l’évolution avec le médecin.

## Questions fréquentes
**Faut-il un casque ?** Rarement. La HAS indique qu’une orthèse crânienne n’est prescrite qu’exceptionnellement, par des centres de référence, lorsque la déformation ne s’améliore pas malgré les mesures de mobilité.

**Le kinésithérapeute est-il utile ?** Il l’est surtout en cas de torticolis ou de difficultés à tourner la tête, sur prescription médicale.

**Peut-on utiliser un coussin spécial pendant la nuit ?** Non : les cale-tête et coussins « anti-tête plate » sont déconseillés, car ils limitent les mouvements et posent un risque pour la respiration.

**Est-ce de ma faute ?** Non. Beaucoup de bébés développent un méplat malgré des parents attentifs. L’important est d’agir pendant les premiers mois, quand le crâne est encore malléable.

## Quand demander conseil
Consultez si votre bébé tourne **toujours la tête du même côté** ou a du mal à bouger le cou, si un méplat s’accentue, si le visage ou les oreilles paraissent asymétriques, ou si la forme de la tête vous inquiète. Demandez au médecin s’il faut une orientation spécialisée si la déformation ne s’améliore pas vers 6 mois. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ soins
  {
    ...BB, category: 'vie-pratique', min_age_months: 0, max_age_months: 24,
    slug: 'couper-les-ongles-de-bebe-sans-stress',
    title: 'Couper les ongles de bébé sans stress : quand et comment',
    summary: 'Les ongles du nouveau-né sont fins et collés à la peau : attendre le bon moment, choisir lime ou ciseaux à bout rond, et les gestes pour éviter de pincer la peau.',
    tags: ['couper ongles bébé', 'ongles nouveau-né', 'lime bébé', 'ciseaux bout rond', 'bébé se griffe', 'ongle incarné bébé'],
    sources: [S.ameliToilette, S.mpediaToilette],
    body_md: `## En bref
- Les premiers jours, les ongles du nouveau-né sont **collés à la peau** : attendez qu’ils dépassent avant la première coupe.
- **Avant un mois**, une **lime en carton** est souvent plus prudente et pratique.
- Ensuite, utilisez des **ciseaux à bout rond** adaptés aux nourrissons, environ **une à deux fois par mois** selon mpedia, sans couper trop court.
- **Mains** : arrondissez légèrement les coins. **Pieds** : coupez **droit**, en laissant les coins un peu longs.
- Choisissez un **moment calme** : après le bain ou pendant le sommeil.

## Comprendre
Les ongles de bébé sont très fins ; ils peuvent le griffer au visage quand il agite les mains. Mais dans les premiers jours, ils adhèrent encore à la peau du bout des doigts : vouloir les couper trop tôt expose à pincer ou entailler la peau. L’Assurance Maladie conseille donc d’attendre qu’ils dépassent, et mpedia recommande la lime en carton avant un mois.

La façon de couper compte aussi. Aux mains, arrondir légèrement les coins évite les angles qui griffent. Aux pieds, couper droit et laisser les coins un peu plus longs limite le risque que l’ongle s’incarne dans la peau en repoussant.

Les ongles s’abîment parfois tout seuls (petits bouts qui se détachent). Ne les arrachez pas : la peau autour est fragile.

## Au quotidien
**Préparer**
- Choisissez des **ciseaux à bout rond** ou un **coupe-ongles** conçu pour les bébés, propres, et une lime douce. Vérifiez sur l’emballage l’âge indiqué et la conformité aux normes.
- Installez-vous **avec une bonne lumière**, bébé calé contre vous ou allongé.
- Le meilleur moment : **après le bain**, quand les ongles sont plus souples, ou **pendant une sieste**, quand bébé bouge moins.

**Couper**
1. Tenez fermement mais doucement le doigt de bébé entre votre pouce et votre index.
2. Appuyez légèrement sur la pulpe du doigt pour l’écarter de l’ongle.
3. Coupez par petits coups, en suivant la forme du doigt pour les mains, **droit** pour les pieds.
4. Ne coupez pas trop court : laissez une fine bordure blanche.
5. Passez la lime pour adoucir les angles.

**Si vous entaillez la peau** : pas de panique, cela arrive. Appuyez doucement avec une compresse propre jusqu’à ce que le saignement s’arrête, puis surveillez la cicatrisation.

**Astuces**
- Faites-le à deux au début : l’un tient et distrait, l’autre coupe.
- Chantez, parlez doucement : bébé s’habitue au rituel.

## Questions fréquentes
**Avant un mois, faut-il vraiment attendre ?** Oui : tant que les ongles sont collés à la peau, ameli conseille d’attendre qu’ils dépassent. La lime en carton permet d’adoucir les bords en douceur, sans lame.

**Mon bébé se griffe le visage la nuit : que faire ?** Limez les ongles régulièrement. Les petites griffures cicatrisent en général vite ; si elles rougissent ou suintent, montrez-les au médecin.

**À quelle fréquence ?** mpedia évoque une à deux fois par mois après un mois ; coupez dès qu’ils sont longs et assez durs.

**L’ongle du gros orteil rentre dans la peau : est-ce grave ?** Un ongle de pied qui s’enfonce, avec une peau rouge, gonflée ou du pus, doit être montré au médecin.

## Quand demander conseil
Consultez si la peau autour d’un ongle est **rouge, gonflée, chaude, douloureuse** ou contient du **pus**, si une coupure saigne longtemps, ou si l’inflammation s’étend. En cas de fièvre chez un bébé de moins de 3 mois, consultez rapidement. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 36,
    slug: 'fesses-rouges-qui-ne-passent-pas-mycose',
    title: 'Fesses rouges qui ne passent pas : penser à la mycose',
    summary: 'Quand l’érythème fessier résiste aux soins habituels : comment une levure peut s’y installer, ce que vérifie le médecin (y compris la bouche) et les traitements possibles.',
    tags: ['fesses rouges qui ne passent pas', 'mycose fesses bébé', 'candidose siège', 'érythème fessier mycose', 'plis rouges bébé', 'muguet'],
    sources: [S.ameliErythemeTrt, S.ameliMycose, S.ameliMycoseReflexes],
    body_md: `## En bref
- La plupart des **fesses rouges** régressent **en quelques jours** avec des changes fréquents, une toilette douce et une pâte à l’oxyde de zinc.
- Si la rougeur **persiste**, il peut s’agir d’une **infection**, le plus souvent par un **champignon** (*Candida albicans*) : on parle de candidose du siège.
- Le médecin examine aussi la **bouche** à la recherche d’un **muguet**.
- En cas de mycose, il peut prescrire une **crème antifongique** à appliquer après chaque lavage.
- Chez un enfant de moins de 12 ans, une mycose ne se traite **pas seul** : on consulte.

## Comprendre
La peau du siège est soumise à l’humidité, à la chaleur et aux frottements de la couche. Ce sont aussi les conditions que préfèrent les levures. L’Assurance Maladie explique qu’un érythème fessier peut être colonisé par un champignon si les soins ne sont pas mis en place tôt. Les mycoses cutanées sont favorisées par l’humidité, la chaleur, un séchage insuffisant après la toilette, et certains traitements comme les antibiotiques.

Une mycose des plis se manifeste souvent par des **plis rouges et suintants**, parfois fissurés, avec un dépôt jaunâtre et crémeux et des plaques rouges qui s’étendent. Lors de la consultation, le médecin vérifie l’absence d’infection et écarte d’autres causes de rougeurs du siège, comme l’**eczéma** ou la **dermite séborrhéique**. Si l’érythème récidive malgré des soins bien faits, il recherche une autre cause, par exemple une **diarrhée qui dure** : traiter la cause fait alors disparaître la rougeur.

## Au quotidien
- **Changez bébé souvent**, dès que la couche est mouillée ou souillée, sans la serrer.
- **Lavez à l’eau tiède** et avec un savon doux si besoin, rincez, puis **séchez en tamponnant**, en insistant dans les plis.
- **Laissez les fesses à l’air** quelques minutes quand c’est possible.
- **Appliquez le traitement prescrit** après chaque lavage, sur une peau sèche, pendant toute la durée indiquée.
- **Évitez les lingettes parfumées** et les produits irritants ; en déplacement, préférez des lingettes sans parfum.
- **Lavez-vous les mains** avant et après chaque change.
- **Regardez la bouche** de bébé : des plaques blanches qui persistent évoquent un muguet, à signaler au médecin.
- **Si vous allaitez**, surveillez vos mamelons : douleur, brûlures ou démangeaisons doivent faire consulter, car la levure peut passer de l’un à l’autre.

## Questions fréquentes
**Comment savoir si c’est une mycose ?** Seul le médecin peut le dire. Une rougeur qui dure malgré les soins, avec des plis rouges et suintants, doit le faire évoquer.

**Puis-je utiliser une crème antifongique que j’ai déjà à la maison ?** Non : ameli recommande de ne pas traiter seul une mycose chez un enfant de moins de 12 ans. Consultez.

**Les antibiotiques ont-ils pu jouer ?** Oui, ils font partie des facteurs qui favorisent les mycoses. Signalez au médecin tout traitement récent.

**Faut-il changer de marque de couches ?** Les sources consultées ne le recommandent pas en particulier. L’essentiel est la fréquence des changes, une couche pas trop serrée et une peau bien sèche.

## Quand demander conseil
Consultez si les fesses restent rouges **après quelques jours** de soins bien conduits, si la rougeur s’étend, suinte, forme des **cloques**, des **croûtes** ou du **pus**, si les plis sont fissurés, si bébé a des plaques blanches dans la bouche, ou si l’érythème revient sans cesse. Consultez rapidement en cas de **fièvre**, de diarrhée qui dure ou si bébé semble mal. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    ...BB, min_age_months: 0, max_age_months: 3,
    slug: 'nombril-apres-la-chute-du-cordon-bourgeon-saignement',
    title: 'Nombril après la chute du cordon : bourgeon, petit saignement, que surveiller ?',
    summary: 'Le cordon est tombé mais le nombril suinte, saigne un peu ou montre une petite boule rouge : les soins à poursuivre et les signes à signaler au médecin.',
    tags: ['nombril bébé', 'chute du cordon', 'bourgeon ombilical', 'granulome ombilical', 'nombril qui saigne', 'nombril qui sent mauvais', 'nombril qui suinte'],
    sources: [S.mpediaCordon, S.ameliToilette],
    body_md: `## En bref
- Le cordon **sèche puis tombe** en moyenne vers 15 jours, mais ce délai varie de **1 à 8 semaines** selon mpedia (1 à 3 semaines selon ameli).
- Après la chute, on **continue les soins** (nettoyage, séchage) jusqu’à ce que la cicatrisation soit **complète**.
- **Quelques traces de sang** au moment de la chute sont sans gravité.
- Une **petite boule rouge et humide** au fond du nombril est souvent un **bourgeon ombilical** (granulome), à montrer au médecin.
- Un nombril qui **saigne régulièrement**, **sent mauvais**, ne sèche pas ou dont la peau autour **rougit** doit être signalé.

## Comprendre
Le cordon ombilical est insensible : les soins ne font pas mal à bébé. Il se dessèche progressivement puis se détache. Après sa chute, il reste une petite plaie au fond du nombril, qui doit cicatriser. Il est fréquent de voir quelques croûtes de sang au fond de l’ombilic : on peut les retirer doucement lors des soins.

**Le bourgeon ombilical** (ou granulome) est une petite boule rouge, plus ou moins humide, au fond du nombril. mpedia indique qu’il n’est pas forcément inquiétant : abordez-le lors des premières consultations. Le professionnel décide si un traitement local est utile.

**Les signes qui doivent faire consulter** sont ceux d’une cicatrisation qui se passe mal ou d’une infection : saignement qui se répète, odeur désagréable, nombril qui reste humide et ne sèche pas, base du cordon ou peau autour du nombril qui rougit et se ramollit. Selon mpedia, un cordon qui n’est toujours pas tombé à **deux mois** doit aussi être montré.

## Au quotidien
**Les soins** (d’après ameli et mpedia)
1. Lavez-vous les mains.
2. Nettoyez le nombril à l’eau tiède et au savon doux, avec un gant propre ou une compresse, au moins une fois par jour (par exemple après le bain) et dès qu’il est souillé.
3. Retirez doucement les croûtes, sans forcer.
4. Rincez puis **séchez complètement**, avec une compresse ou en laissant à l’air.
5. Arrêtez les soins quand la cicatrisation est terminée.

**Autres conseils**
- **Ne tirez jamais** sur le cordon, même s’il ne tient plus qu’à un fil.
- **Repliez le bord de la couche** pour ne pas recouvrir le nombril, et chez le garçon, **orientez le pénis vers le bas**.
- **Pas d’alcool** sur le nombril. Une désinfection n’est pas nécessaire en temps normal ; si le nombril rougit, sent mauvais ou se ramollit, demandez conseil au médecin ou au pharmacien.
- **Le bain est possible** avant et après la chute, à condition de bien sécher ensuite.

## Questions fréquentes
**Le nombril saigne un peu après la chute : est-ce grave ?** Quelques traces de sang sont sans gravité. Si le saignement se répète ou ne s’arrête pas, consultez.

**Une petite boule rouge reste au fond du nombril : que faire ?** Il s’agit souvent d’un bourgeon ombilical. Montrez-le au médecin lors de la prochaine consultation ; il proposera un soin si nécessaire.

**Le nombril sort un peu : est-ce une hernie ?** Les sources consultées pour cet article ne traitent pas de la hernie ombilicale. Toute bosse au niveau du nombril, surtout si elle grossit quand bébé pleure, se montre au médecin.

**Quand peut-on arrêter les soins ?** Quand le nombril est sec et complètement cicatrisé, sans croûte ni suintement.

## Quand demander conseil
Consultez si le nombril **saigne régulièrement**, **sent mauvais**, reste **humide**, si la peau autour devient **rouge, chaude ou gonflée**, ou si le cordon n’est pas tombé à deux mois. Consultez **sans attendre** si une rougeur s’étend autour du nombril ou si bébé a de la **fièvre**, tète moins ou semble fatigué : chez un nouveau-né, appelez le 15 ou le 112 en cas de doute.

${FIN}`,
  },
];
