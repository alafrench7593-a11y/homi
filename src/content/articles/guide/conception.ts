/** Guide complet « conception » (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles françaises).
const S = {
  amPreconc: { label: 'ameli.fr — Consulter avant d’être enceinte : la consultation préconceptionnelle', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/avant-d-etre-enceinte-la-consultation-preconceptionnelle', consulted_on: C },
  amVaccins: { label: 'ameli.fr — Projet de grossesse : vaccinations et médicaments', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/projet-de-grossesse-vaccinations-et-medicaments', consulted_on: C, published: '2024-11-26' },
  amHabitudes: { label: 'ameli.fr — Modifier ses habitudes de vie avant d’être enceinte', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/modifier-ses-habitudes-de-vie-avant-d-etre-enceinte', consulted_on: C, published: '2025-03-27' },
  santePreconc: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — Consultation préconceptionnelle', url: 'https://www.sante.fr/ma-fertilite/consultation-preconceptionnelle', consulted_on: C, published: '2025-10-20' },
  amGeu: { label: 'ameli.fr — Grossesse extra-utérine', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-extra-uterine', consulted_on: C },
  amFausseCouche: { label: 'ameli.fr — Fausse couche', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/fausse-couche', consulted_on: C },
  amBilan: { label: 'ameli.fr — Bilan médical de l’infertilité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/sterilite-pma-infertilite/bilan-medical-infertilite-sterilite', consulted_on: C, published: '2025-12-08' },
  amPecInfertilite: { label: 'ameli.fr — Infertilité : quel traitement et parcours de soins ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/sterilite-pma-infertilite/prise-charge-infertilite', consulted_on: C, published: '2025-12-08' },
  amBaisse: { label: 'ameli.fr — Baisse de la fertilité et de la fécondité : pourquoi ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/sterilite-pma-infertilite/baisse-de-la-fertilite-et-de-la-fecondite-pourquoi', consulted_on: C, published: '2026-02-17' },
  amEndoSymptomes: { label: 'ameli.fr — Endométriose : symptômes, diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/themes/endometriose/symptomes-diagnostic-evolution', consulted_on: C, published: '2026-04-09' },
  amEndoTraitement: { label: 'ameli.fr — Traitement de l’endométriose', url: 'https://www.ameli.fr/assure/sante/themes/endometriose/traitement', consulted_on: C },
  santeEndoAmp: { label: 'Santé.fr (contenu EndoFrance) — L’assistance médicale à la procréation (AMP ou PMA) et l’endométriose', url: 'https://www.sante.fr/node/5549145', consulted_on: C, published: '2024-01-05' },
  amSopkSymptomes: { label: 'ameli.fr — Symptômes, diagnostic et évolution du syndrome des ovaires polykystiques', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-ovaires-polykystiques/symptomes-diagnostic-evolution', consulted_on: C, published: '2026-01-12' },
  amSopkTraitement: { label: 'ameli.fr — Traitement du syndrome des ovaires polykystiques', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-ovaires-polykystiques/traitement', consulted_on: C, published: '2025-12-09' },
  santeSopk: { label: 'Santé.fr (dossier Inserm) — Syndrome des ovaires polykystiques (SOPK) : un trouble fréquent, première cause d’infertilité féminine', url: 'https://www.sante.fr/syndrome-des-ovaires-polykystiques-sopk-un-trouble-frequent-premiere-cause-dinfertilite-feminine', consulted_on: C, published: '2021-12-29' },
  amAmp: { label: 'ameli.fr — Qu’est-ce que l’assistance médicale à la procréation (AMP) ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/procreation-medicalement-assistee-pma-amp/qu-est-ce-que-l-assistance-medicale-la-procreation-amp', consulted_on: C },
  amAmpTechniques: { label: 'ameli.fr — Techniques d’AMP : insémination artificielle, FIV, accueil d’embryon', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/procreation-medicalement-assistee-pma-amp/techniques-procreation-medicalement-assistee-pma', consulted_on: C },
  amAmpAutoconservation: { label: 'ameli.fr — Autoconservation des gamètes et tissus germinaux en vue d’une AMP', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/procreation-medicalement-assistee-pma-amp/autoconservation-des-gametes-et-tissus-germinaux-en-vue-d-une-amp', consulted_on: C },
  amAmpDon: { label: 'ameli.fr — Don d’ovocytes, de spermatozoïdes et d’embryons', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/procreation-medicalement-assistee-pma-amp/don-ovocytes-spermatozoides-embryons', consulted_on: C, published: '2025-09-30' },
  amAmpRemboursement: { label: 'ameli.fr — Prise en charge de l’assistance médicale à la procréation (AMP)', url: 'https://www.ameli.fr/assure/remboursements/rembourse/assistance-medicale-la-procreation-amp/prise-en-charge-de-l-assistance-medicale-la-procreation-amp', consulted_on: C },
  santeAmpCout: { label: 'Santé.fr — « L’AMP est très coûteuse » (idée reçue)', url: 'https://www.sante.fr/node/15499539', consulted_on: C, published: '2025-07-03' },
  santeDonSperme: { label: 'Santé.fr (Agence de la biomédecine) — Le don de spermatozoïdes en 6 étapes', url: 'https://www.sante.fr/node/9000385', consulted_on: C, published: '2024-12-19' },
  abmAnonymat: { label: 'Agence de la biomédecine — Le don d’ovocytes est-il anonyme ?', url: 'https://www.agence-biomedecine.fr/fr/don-de-gametes-et-assistance-medicale-a-la-procreation/le-don-d-ovocytes-est-il-anonyme', consulted_on: C, published: '2024-12-18' },
  abmDonOvocytes: { label: 'Agence de la biomédecine (dondovocytes.fr) — Le don d’ovocytes en 5 étapes', url: 'https://www.dondovocytes.fr/don-ovocytes-cinq-etapes/', consulted_on: C },
  santeTabacFertilite: { label: 'Santé.fr — Tabac et fertilité : quel impact ?', url: 'https://www.sante.fr/node/17111781', consulted_on: C, published: '2025-08-11' },
  santeTabacGrossesse: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — L’arrêt du tabac pendant la grossesse et l’allaitement', url: 'https://www.sante.fr/node/1871137', consulted_on: C, published: '2024-02-19' },
  spfAlcool: { label: 'Santé publique France — Syndrome d’alcoolisation fœtale : « zéro alcool pendant la grossesse »', url: 'https://www.santepubliquefrance.fr/presse/2016/syndrome-d-alcoolisation-faetale-pour-eviter-tout-risque-zero-alcool-pendant-la-grossesse', consulted_on: C, published: '2016-09-05' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article informe et vous aide à préparer vos échanges avec les professionnels : il ne remplace ni une consultation, ni un avis médical personnalisé._';

export const GUIDE_CONCEPTION: LibArticle[] = [
  // ------------------------------------------------------------------ Fertilité et cycle
  {
    slug: 'fertilite-masculine-ce-qui-compte',
    title: 'Fertilité masculine : ce qui compte et comment la préserver',
    summary: 'La fertilité se joue à deux : âge, tabac, cannabis, poids, chaleur et examens du partenaire, expliqués simplement.',
    category: 'fertilite',
    journeys: ['ttc'],
    tags: ['fertilité', 'homme', 'spermogramme', 'mode de vie'],
    sources: [S.amBaisse, S.amBilan, S.santeTabacFertilite],
    status: 'to_review',
    body_md: `## En bref
- Quand une grossesse tarde, les deux partenaires sont concernés : le bilan s’adresse toujours au couple.
- La qualité des spermatozoïdes diminue avec l’âge, le tabac, le cannabis, l’alcool et l’excès de poids.
- Le spermogramme est l’examen clé chez l’homme : il repère la plupart des infertilités masculines.
- Les spermatozoïdes se renouvellent en trois mois environ : les efforts faits aujourd’hui comptent vraiment.

## Comprendre
On a longtemps parlé de la fertilité comme d’une affaire de femmes. L’Assurance Maladie rappelle pourtant que l’homme connaît moins sa propre baisse de fertilité et que la prise en compte de son âge est récente. Avec les années, le génome des spermatozoïdes s’altère (fragmentation de l’ADN), ce qui peut compliquer la conception et augmenter le risque de fausse couche. L’âge des deux partenaires se cumule : le taux de fausses couches est nettement plus élevé lorsque l’homme a plus de 40 ans et la femme plus de 35 ans.

Le **tabac** agit directement sur le sperme : moins de spermatozoïdes, moins mobiles, plus souvent anormaux, et des lésions de leur ADN liées au stress oxydatif. Ces effets sont en partie réversibles à l’arrêt. Le **cannabis**, consommé plusieurs fois par semaine pendant des années, réduit le volume et le nombre de spermatozoïdes et leur capacité à féconder ; il s’élimine plus lentement que le tabac. L’**alcool** altère aussi la fertilité, et l’Assurance Maladie recommande « zéro alcool » pour les deux parents dès le désir de grossesse.

L’**excès de poids** chez l’homme s’accompagne d’un excès d’œstrogènes et d’une baisse du nombre de spermatozoïdes. Enfin, certains polluants et perturbateurs endocriniens (bisphénol A, phtalates, pesticides…) sont associés à une baisse de la qualité du sperme.

## Au quotidien
- **Arrêter de fumer** : c’est le levier le plus documenté. Tabac Info Service (39 89) propose un accompagnement gratuit par des tabacologues. Le bénéfice sur le sperme apparaît après environ trois mois, la durée de fabrication des spermatozoïdes.
- **Arrêter le cannabis et les autres drogues**, en se faisant aider si besoin par son médecin ou une consultation d’addictologie.
- **Supprimer l’alcool** pendant la période d’essai.
- **Bouger régulièrement et viser un poids de forme**, avec une alimentation variée de type méditerranéen.
- **Éviter les pantalons trop serrés** et limiter l’exposition aux pesticides et polluants organochlorés, comme le conseille l’Assurance Maladie.
- **Faire le point sur ses médicaments** : certains traitements pris par le futur père peuvent affecter les spermatozoïdes. N’arrêtez rien sans en parler à votre médecin.

## Questions fréquentes
**Faut-il faire un spermogramme « pour voir » ?**
Il est prescrit dans le cadre d’un bilan, en général après 12 mois d’essais sans grossesse (6 mois si la femme a plus de 35 ans ou en cas de problème connu). Il se fait au laboratoire après 3 à 5 jours sans rapport, et se refait en cas d’anomalie, car un seul résultat ne suffit pas à conclure.

**Une fièvre récente peut-elle fausser le résultat ?**
Oui : le spermogramme ne doit pas être réalisé en cas de fièvre ou de prise de certains médicaments. Signalez-le au laboratoire.

**Les effets du tabac sont-ils définitifs ?**
Non, ils sont en grande partie réversibles. Arrêter avant d’essayer, ou avant un parcours d’AMP, est fortement recommandé.

**Le partenaire doit-il venir aux consultations ?**
Oui. Pour un bilan d’infertilité, l’Assurance Maladie indique que les deux membres du couple doivent être présents.

## Quand demander conseil
Parlez-en à votre médecin si la grossesse ne vient pas après 12 mois de rapports réguliers (6 mois si la femme a plus de 35 ans), ou plus tôt en cas d’antécédent de testicule non descendu, de torsion, de chirurgie d’une hernie, d’infection sexuellement transmissible, de traitement lourd ou de troubles de l’érection. Une douleur intense et brutale d’un testicule est une urgence : appelez le 15 ou le 112.

${FIN}`,
  },
  {
    slug: 'age-et-projet-d-enfant',
    title: 'Âge et projet d’enfant : ce que disent les chiffres',
    summary: 'Comment l’âge de la femme et de l’homme influence les chances de concevoir, et quand consulter plus tôt.',
    category: 'fertilite',
    journeys: ['ttc'],
    tags: ['âge', 'fertilité', 'projet bébé'],
    sources: [S.amBaisse, S.amBilan, S.amAmpAutoconservation],
    status: 'to_review',
    body_md: `## En bref
- La fertilité spontanée de la femme diminue dès 30 ans, puis nettement après 37 ans.
- L’âge de l’homme compte aussi : la qualité de l’ADN des spermatozoïdes baisse avec les années.
- Après 35 ans, il est conseillé de consulter après 6 mois d’essais sans grossesse, au lieu de 12.
- L’autoconservation des ovocytes est possible en France sans raison médicale, de 29 à 37 ans.

## Comprendre
L’Assurance Maladie distingue la **fertilité** (la capacité biologique à concevoir) de la **fécondité** (le nombre d’enfants effectivement nés). En France, l’âge moyen des mères à l’accouchement augmente régulièrement : il dépasse aujourd’hui 31 ans. Or la fertilité spontanée diminue dès 30 ans et plus nettement après 37 ans, à cause de la baisse du nombre et de la qualité des ovocytes.

Les chiffres cités par l’Assurance Maladie donnent un ordre de grandeur du risque de ne pas devenir mère : environ 4 % à 20 ans, 14 % à 35 ans, 35 % à 40 ans et 80 % après 45 ans. Le report de la maternité s’accompagne aussi de plus de fausses couches et de complications pendant la grossesse.

Chez l’homme, l’âge moyen à la naissance d’un enfant est d’environ 34 ans. Le génome des spermatozoïdes s’altère avec l’âge, ce qui peut compliquer la conception, augmenter les fausses couches et les risques génétiques pour l’enfant. L’effet de l’âge des deux partenaires se cumule.

Ces chiffres sont des moyennes : ils ne disent rien de votre situation personnelle. Ils aident surtout à ne pas trop attendre pour demander un avis lorsque la grossesse tarde.

## Au quotidien
- **Ne pas reporter la consultation préconceptionnelle** : elle permet de faire le point sur votre santé, vos cycles et vos vaccins avant d’essayer.
- **Connaître le bon délai pour consulter** : après 12 mois de rapports réguliers sans contraception, ou après 6 mois si vous avez plus de 35 ans.
- **Agir sur ce qui se modifie** : tabac, alcool, poids et sédentarité pèsent sur la fertilité à tout âge, chez la femme comme chez l’homme.
- **Penser à l’autoconservation si le projet est lointain** : elle est possible pour les femmes de leur 29e à leur 37e anniversaire, et pour les hommes de 29 à 45 ans, dans des centres autorisés. Les gamètes peuvent ensuite être utilisés jusqu’au 45e anniversaire de la femme qui portera l’enfant.

## Questions fréquentes
**À 38 ans, est-il trop tard pour essayer naturellement ?**
Non, beaucoup de femmes conçoivent à cet âge. Il est simplement recommandé de consulter plus tôt (après 6 mois) pour ne pas perdre de temps si une aide est utile.

**Un test de réserve ovarienne peut-il prédire mes chances ?**
Le dosage de l’AMH est un marqueur de la réserve ovarienne. Il est prescrit dans le cadre d’un bilan (baisse de réserve suspectée ou projet d’AMP) et s’interprète avec un médecin : il ne dit pas à lui seul si une grossesse surviendra.

**Jusqu’à quel âge l’AMP est-elle prise en charge ?**
Le prélèvement d’ovocytes est possible jusqu’au 43e anniversaire, et l’AMP jusqu’au 45e anniversaire de la femme qui portera l’enfant ; le recueil de spermatozoïdes jusqu’au 60e anniversaire de l’homme.

## Quand demander conseil
Consultez votre médecin, votre gynécologue ou votre sage-femme si la grossesse ne vient pas dans les délais indiqués, ou plus tôt en cas de cycles irréguliers, de règles très douloureuses, d’antécédent d’infection génitale ou de chirurgie pelvienne. Si le sujet de l’âge vous angoisse au point de peser sur votre moral, vous pouvez en parler à un professionnel ; en cas de détresse, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'frequence-des-rapports-pour-concevoir',
    title: 'Concevoir : à quel rythme avoir des rapports ?',
    summary: 'Les repères officiels pour optimiser ses chances sans transformer la vie intime en contrainte.',
    category: 'fertilite',
    journeys: ['ttc'],
    tags: ['rapports', 'fenêtre fertile', 'ovulation', 'couple'],
    sources: [S.amPecInfertilite, S.amBilan],
    status: 'to_review',
    body_md: `## En bref
- Pendant la période fertile, des rapports un jour sur deux offrent les meilleures chances.
- Des rapports quotidiens n’augmentent pas les chances par rapport à un jour sur deux.
- Hors période fertile, des rapports réguliers, deux ou trois fois par semaine, suffisent.
- Une méconnaissance de la période fertile est une cause simple et fréquente de grossesse qui tarde.

## Comprendre
Pour qu’une grossesse débute, un spermatozoïde doit rencontrer l’ovocyte peu après l’ovulation. Les spermatozoïdes survivent quelques jours dans les voies génitales féminines, alors que l’ovocyte ne vit que peu de temps. C’est pourquoi les rapports qui précèdent l’ovulation comptent autant que ceux du jour même.

L’Assurance Maladie, dans sa page sur le parcours de soins de l’infertilité, indique qu’une fréquence d’**un jour sur deux pendant la période fertile** offre les meilleures chances, et que des rapports quotidiens ne les augmentent pas. Pour définir une infertilité, elle parle de rapports « réguliers (deux ou trois fois par semaine) aux périodes propices » pendant 12 mois.

Lors d’un premier bilan, le médecin commence souvent par vérifier ces bases : connaissance du cycle, période fertile, fréquence des rapports. Une cause « simple et modifiable », comme une mauvaise connaissance des périodes de fécondité, est parfois retrouvée.

## Au quotidien
- **Repérer la période fertile** : sur un cycle régulier, elle se situe quelques jours avant l’ovulation, au milieu du cycle. Votre application peut vous aider à l’estimer, sans précision absolue.
- **Viser un jour sur deux** pendant cette période, sans pression de « performance ».
- **Garder une intimité qui ne se résume pas au calendrier** : le désir peut s’essouffler quand chaque rapport devient un objectif. Des rapports réguliers tout au long du cycle aident à ne pas tout miser sur quelques jours.
- **Éviter les lubrifiants sans en parler** : certains peuvent gêner les spermatozoïdes ; demandez conseil à votre pharmacien ou sage-femme si vous en avez besoin.
- **Ne pas multiplier les tests** au point de générer de l’angoisse : les tests d’ovulation sont une aide, pas une obligation.

## Questions fréquentes
**Faut-il « économiser » le sperme en espaçant les rapports ?**
Non. Les repères officiels sont des rapports un jour sur deux pendant la période fertile ; une abstinence prolongée n’est pas recommandée pour concevoir.

**Et si mes cycles sont irréguliers ?**
La période fertile est alors plus difficile à prévoir. Des rapports réguliers tout au long du cycle restent la meilleure stratégie, et des cycles très irréguliers justifient d’en parler à un médecin.

**La position après le rapport compte-t-elle ?**
Les sources officielles ne donnent aucune consigne à ce sujet. Faites ce qui vous est confortable.

**Le stress du calendrier peut-il bloquer la grossesse ?**
Il peut surtout peser sur le désir et sur le couple. Parler ensemble de ce que vous vivez, et en parler à un professionnel si besoin, aide à garder le cap.

## Quand demander conseil
Consultez après 12 mois de rapports réguliers sans grossesse, ou après 6 mois si vous avez plus de 35 ans ou si un problème gynécologique ou urologique est connu. Parlez-en plus tôt en cas de douleurs pendant les rapports, de troubles de l’érection ou de baisse de désir qui vous fait souffrir : ce sont des sujets médicaux à part entière.

${FIN}`,
  },
  {
    slug: 'tabac-et-fertilite-arreter',
    title: 'Tabac et projet de bébé : pourquoi et comment arrêter',
    summary: 'Les effets du tabac sur la fertilité des deux partenaires, ce qui est réversible et les aides gratuites pour arrêter.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['tabac', 'fertilité', 'arrêt', '39 89'],
    sources: [S.santeTabacFertilite, S.amBaisse, S.santeTabacGrossesse],
    status: 'to_review',
    body_md: `## En bref
- Le tabac réduit la fertilité de la femme et de l’homme, y compris le tabagisme passif.
- Les couples fumeurs mettent en moyenne deux fois plus de temps à concevoir.
- Les effets sont en grande partie réversibles : quelques semaines chez la femme, environ trois mois chez l’homme.
- Tabac Info Service (39 89) et les substituts nicotiniques remboursés aident à arrêter.

## Comprendre
Santé.fr détaille les effets du tabac sur la fertilité. Chez la femme, la nicotine modifie la glaire cervicale et ralentit les cils des trompes qui guident l’ovocyte vers l’utérus ; la qualité des ovocytes peut être touchée et la ménopause survient en moyenne deux ans plus tôt. Chez l’homme, les composés du tabac présents dans le sperme diminuent la mobilité des spermatozoïdes et abîment leur ADN.

Le tabac rend aussi la fécondation et l’implantation de l’embryon plus difficiles : la nicotine resserre les vaisseaux et réduit l’oxygénation de la muqueuse utérine. Il est un facteur de risque majeur de grossesse extra-utérine. En AMP, l’Assurance Maladie indique que le tabac est associé à deux fois moins de grossesses et deux fois plus de fausses couches.

La bonne nouvelle : ces effets sont réversibles. Chez la femme, les cils des trompes retrouvent un mouvement normal en quelques semaines. Chez l’homme, il faut environ trois mois, le temps de fabriquer de nouveaux spermatozoïdes. L’impact, actif ou passif, est proportionnel au nombre de cigarettes.

## Au quotidien
- **Arrêter à deux** : la fumée du partenaire compte aussi. Les substances de la fumée se déposent sur les tissus et se libèrent dans l’air intérieur.
- **Se faire accompagner** : médecin, sage-femme, pharmacien ou tabacologue peuvent prescrire un traitement. Être accompagné augmente les chances de réussite.
- **Appeler le 39 89** (Tabac Info Service) pour un suivi gratuit par un tabacologue, ou utiliser l’application et le site.
- **Utiliser des substituts nicotiniques** (patchs, gommes, pastilles, inhaleurs, sprays) : sur prescription, ils sont remboursés. Santé.fr précise qu’ils sont même recommandés pendant la grossesse, sous suivi d’un professionnel.
- **Préparer les moments difficiles** : marche, respiration, activités plaisantes, lieux sans tabac. Testez ce qui marche pour vous.
- **Ne pas culpabiliser en cas de rechute** : chaque tentative rapproche de l’arrêt.

## Questions fréquentes
**Réduire suffit-il ?**
Les effets étant proportionnels au nombre de cigarettes, réduire aide déjà, mais l’objectif recommandé avant une grossesse est l’arrêt complet, puis « zéro tabac » pendant la grossesse.

**Les substituts nicotiniques sont-ils compatibles avec un projet de grossesse ?**
Oui, ils sont recommandés pendant la grossesse et l’allaitement, sous la supervision d’un professionnel qui adapte le traitement.

**La cigarette électronique est-elle une solution ?**
Les sources consultées ne la recommandent pas spécifiquement. Parlez-en avec votre médecin ou un tabacologue, qui vous orientera vers les méthodes validées.

**Combien de temps avant d’essayer faut-il arrêter ?**
Le plus tôt possible. Côté homme, un délai d’environ trois mois permet de bénéficier de spermatozoïdes produits sans tabac.

## Quand demander conseil
Parlez-en à votre médecin, votre sage-femme ou votre pharmacien dès que vous décidez d’arrêter, et appelez le 39 89 quand vous en avez besoin. Si l’arrêt du tabac s’accompagne d’une grande détresse ou d’idées noires, appelez le 3114.

${FIN}`,
  },
  {
    slug: 'alcool-cannabis-et-projet-de-grossesse',
    title: 'Alcool, cannabis et drogues : les arrêter dès le projet de bébé',
    summary: 'Pourquoi viser zéro alcool et zéro cannabis pour les deux parents dès le désir d’enfant, et où trouver de l’aide.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['alcool', 'cannabis', 'drogues', 'addictions', 'zéro alcool'],
    sources: [S.amHabitudes, S.amBaisse, S.spfAlcool],
    status: 'to_review',
    body_md: `## En bref
- L’alcool est dangereux pour l’embryon dès la conception : objectif « zéro alcool » dès le projet de grossesse.
- L’alcool altère aussi la fertilité des deux partenaires, y compris pendant une AMP.
- Le cannabis consommé régulièrement réduit la qualité du sperme et s’élimine lentement.
- Arrêter n’est pas toujours simple : demander de l’aide est une démarche de santé, sans jugement.

## Comprendre
L’Assurance Maladie demande de cesser de consommer de l’alcool dès le projet de grossesse, car il est très dangereux pour le fœtus dès la conception. Une grossesse n’est souvent découverte qu’après plusieurs semaines : arrêter dès les premiers essais évite d’exposer l’embryon pendant cette période.

Santé publique France rappelle que l’alcool est toxique pour le fœtus : il peut entraîner un retard de croissance, des atteintes du système nerveux central et des malformations. La forme la plus grave est le syndrome d’alcoolisation fœtale. Il n’existe pas de consommation repérée comme inoffensive pendant la grossesse, d’où le message « zéro alcool ».

L’alcool n’est pas qu’une question de grossesse : il altère la fertilité des deux sexes. L’Assurance Maladie évoque aussi une possible toxicité de l’alcool sur les spermatozoïdes et recommande « zéro alcool » pour les **deux parents** dès le désir de grossesse.

Le **cannabis**, consommé plusieurs fois par semaine pendant des années, réduit le volume et le nombre de spermatozoïdes, altère leur aspect et leur mobilité. Il s’élimine plus lentement que le tabac. Les autres drogues sont aussi nocives.

## Au quotidien
- **Choisir une date d’arrêt** commune, dès l’arrêt de la contraception.
- **Prévoir des alternatives** pour les moments sociaux : boissons sans alcool, activités sans consommation.
- **Parler à votre médecin ou sage-femme** : ils peuvent vous orienter vers une consultation d’addictologie si l’arrêt est difficile.
- **Contacter Alcool Info Service** (0 980 980 930, appel anonyme et non surtaxé, 7 jours sur 7) qui consacre une rubrique à l’alcool et la grossesse.
- **Demander de l’aide pour le cannabis** auprès de votre médecin ou d’un centre spécialisé : l’Assurance Maladie y consacre une page « Addictions : à qui s’adresser ? ».

## Questions fréquentes
**J’ai bu un verre avant de savoir que j’étais enceinte. Que faire ?**
N’hésitez pas à en parler à votre médecin ou sage-femme : il ou elle répondra à vos inquiétudes et adaptera le suivi si besoin. L’important est d’arrêter dès maintenant.

**Un verre de temps en temps pendant les essais, est-ce possible ?**
Les recommandations officielles sont claires : zéro alcool dès le projet de grossesse, car l’embryon peut être exposé avant même que la grossesse soit connue.

**Le cannabis aide-t-il à gérer le stress des essais ?**
Il nuit à la fertilité et expose l’embryon. Si le stress est important, parlez-en à un professionnel : d’autres solutions existent.

**Mon partenaire doit-il arrêter aussi ?**
Oui, l’Assurance Maladie recommande zéro alcool pour les deux parents, et le cannabis réduit la qualité du sperme.

## Quand demander conseil
Consultez si vous n’arrivez pas à arrêter seule ou seul, si vous ressentez un besoin de consommer, ou si l’arrêt provoque des troubles (sommeil, anxiété, irritabilité importante). En cas de malaise grave lié à une consommation, appelez le 15 ou le 112. En cas de détresse psychique, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'poids-alimentation-et-fertilite',
    title: 'Poids, alimentation et fertilité',
    summary: 'L’influence du surpoids, de la maigreur et de l’alimentation sur la fertilité, et des repères concrets pour se préparer.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['poids', 'alimentation', 'IMC', 'fertilité', 'acide folique'],
    sources: [S.amHabitudes, S.amBaisse, S.amPecInfertilite],
    status: 'to_review',
    body_md: `## En bref
- L’obésité diminue la fertilité de l’homme et de la femme ; la grande maigreur perturbe l’ovulation.
- Corriger un surpoids avant la grossesse limite aussi certaines complications pendant la grossesse.
- Une alimentation variée, de type méditerranéen, peu transformée, est recommandée aux deux partenaires.
- L’acide folique (vitamine B9) se prend sur prescription, idéalement avant la conception.

## Comprendre
Lors de la consultation préconceptionnelle, le professionnel calcule l’IMC (indice de masse corporelle) à partir du poids et de la taille. L’Assurance Maladie indique qu’un IMC entre 18,5 et 25 correspond à un poids de forme. Selon l’enquête nationale périnatale 2021, près d’une femme sur quatre était en surpoids et environ une sur sept en situation d’obésité au moment de la grossesse.

L’**obésité**, souvent associée à la sédentarité, est un facteur d’hypofertilité chez l’homme comme chez la femme, et expose la femme à des complications pendant la grossesse. Chez l’homme, l’excès de poids entraîne un excès d’œstrogènes et une baisse du nombre de spermatozoïdes. À l’inverse, une **maigreur extrême** (par exemple une anorexie mentale prolongée) perturbe l’ovulation.

Pour l’alimentation, l’Assurance Maladie conseille un régime équilibré de type méditerranéen, de réduire le café s’il dépasse 5 à 6 tasses par jour, de limiter les produits ultra-transformés, de cuisiner maison, de laver et éplucher fruits et légumes. Les folates de l’alimentation sont en général insuffisants : un complément d’acide folique est prescrit, idéalement au moins 4 semaines avant la conception. Selon l’enquête périnatale 2021, moins d’un tiers des femmes le commencent avant la grossesse.

## Au quotidien
- **Faire le point avec votre médecin** : en cas de surpoids important, d’obésité ou de grande maigreur, une prise en charge adaptée peut être proposée.
- **Bouger chaque jour** : l’activité physique est bénéfique avant et pendant la grossesse.
- **Cuisiner simple et varié** : légumes, fruits, légumineuses, céréales complètes, poissons, huiles végétales.
- **Demander la prescription d’acide folique** dès que le projet se précise.
- **Ne pas prendre de compléments alimentaires sans avis** : certains contiennent des vitamines ou oligo-éléments à forte dose, déconseillés pour un projet de grossesse.
- **Régime végétarien ou végan** : faites le point avec un médecin, qui prescrira si besoin des suppléments adaptés.
- **Prévenir les infections alimentaires** (listériose, toxoplasmose si vous n’êtes pas immunisée) en prenant dès maintenant les bons réflexes.

## Questions fréquentes
**Faut-il perdre beaucoup de poids pour retrouver une ovulation ?**
Dans le syndrome des ovaires polykystiques, l’Assurance Maladie indique qu’une perte d’environ 10 % du poids initial, en cas de surpoids, peut améliorer les cycles et la fertilité. Votre médecin vous aidera à fixer un objectif réaliste.

**Un régime strict avant la grossesse est-il une bonne idée ?**
Les régimes très restrictifs peuvent créer des carences. Mieux vaut des changements durables, accompagnés par un professionnel.

**Le café est-il interdit ?**
Les sources recommandent de réduire une consommation élevée (plus de 5 à 6 tasses par jour).

## Quand demander conseil
Consultez votre médecin ou votre sage-femme avant d’essayer si vous avez un problème de poids important, des troubles du comportement alimentaire, un diabète ou une maladie de la thyroïde. Si votre rapport à la nourriture vous fait souffrir, vous pouvez en parler sans honte à un professionnel ; en cas de détresse, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'environnement-perturbateurs-endocriniens-avant-grossesse',
    title: 'Préparer un environnement plus sain avant la grossesse',
    summary: 'Air intérieur, produits ménagers, travaux, perturbateurs endocriniens : les gestes simples conseillés dès le projet de bébé.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['environnement', 'perturbateurs endocriniens', 'air intérieur', 'logement'],
    sources: [S.amHabitudes, S.amBaisse, S.santePreconc],
    status: 'to_review',
    body_md: `## En bref
- Certains polluants et perturbateurs endocriniens peuvent agir sur la fertilité et le développement de l’embryon.
- Aérer chaque jour, simplifier les produits ménagers et éviter parfums et huiles essentielles limite l’exposition.
- Faire vérifier les appareils de chauffage prévient l’intoxication au monoxyde de carbone.
- Les gros travaux et l’aménagement de la chambre se planifient bien avant la naissance.

## Comprendre
Les perturbateurs endocriniens sont des substances qui dérèglent le fonctionnement des hormones. L’Assurance Maladie cite notamment les parabènes, le triclosan, le bisphénol A, les phtalates, le chlordécone, les retardateurs de flamme, les composés perfluorés, et certaines substances naturelles comme le soja ou certaines huiles essentielles. On y est exposé par l’alimentation, l’air et la peau, et leurs effets peuvent se cumuler (« effet cocktail »).

Ces substances peuvent nuire à la fertilité et au développement du fœtus. Plus largement, les polluants présents dans l’air, l’eau, les sols, les aliments, les emballages, les cosmétiques ou les détergents peuvent agir sur les gamètes, la fécondation et le développement de l’embryon. Santé.fr rappelle que la consultation préconceptionnelle est l’occasion d’aborder les conditions de travail (exposition à des produits nocifs) et les moyens de rendre le logement plus sain.

L’objectif n’est pas de tout contrôler, mais de réduire raisonnablement les expositions les plus faciles à éviter.

## Au quotidien
- **Aérer plusieurs fois par jour**, été comme hiver, sans boucher les aérations, et maintenir une température d’environ 18 à 22 °C.
- **Simplifier le ménage** : produits labellisés, en petite quantité, en aérant pendant et après ; ou ingrédients traditionnels (vinaigre blanc, savon noir, bicarbonate), sans huiles essentielles.
- **Éviter parfums d’intérieur, huiles essentielles et répulsifs chimiques**, déconseillés pendant la grossesse.
- **Faire vérifier chaudière, poêle et chauffe-eau** (gaz, bois, fioul…) pour prévenir le monoxyde de carbone.
- **Logement ancien** : vérifier l’absence de canalisations en plomb.
- **Alimentation** : varier, limiter l’ultra-transformé, laver et éplucher, privilégier le bio pour ce qui ne s’épluche pas.
- **Cosmétiques** : choisir des produits simples, en nombre limité.
- **Travail** : si vous êtes exposée à des produits chimiques, des solvants ou des rayonnements, parlez-en au médecin du travail dès le projet.
- **Travaux et chambre de bébé** : prévoir les travaux avant la grossesse et finir l’aménagement bien avant la naissance, en aérant souvent.

## Questions fréquentes
**Faut-il jeter tous ses produits ?**
Non. Remplacer progressivement les produits les plus parfumés ou les plus nombreux, et aérer, réduit déjà nettement l’exposition.

**Le bio est-il indispensable ?**
Les sources conseillent de privilégier le bio pour les aliments qui ne s’épluchent pas, en complément d’une alimentation variée.

**Mon travail m’expose à des produits chimiques : que faire ?**
Parlez-en au médecin du travail et à votre médecin dès le projet de grossesse : un aménagement de poste peut être étudié.

## Quand demander conseil
Parlez-en lors de la consultation préconceptionnelle, ou au médecin du travail en cas d’exposition professionnelle. Maux de tête, nausées ou malaises de plusieurs personnes dans un même logement peuvent évoquer une intoxication au monoxyde de carbone : sortez, aérez et appelez le 15, le 18 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ Préparer sa grossesse
  {
    slug: 'consultation-preconceptionnelle-deroulement',
    title: 'La consultation préconceptionnelle, pas à pas',
    summary: 'À quoi sert ce rendez-vous avant la grossesse, avec qui le faire, comment le préparer et ce qui y est vérifié.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['consultation préconceptionnelle', 'bilan', 'projet bébé'],
    sources: [S.amPreconc, S.santePreconc],
    status: 'to_review',
    body_md: `## En bref
- C’est une consultation facultative, avant la grossesse, pour faire le point sur votre santé et votre projet.
- Elle peut être faite par un médecin généraliste, un gynécologue ou une sage-femme, idéalement à deux.
- Elle est prise en charge à 70 % par l’Assurance Maladie.
- On y vérifie les vaccins, les traitements, le groupe sanguin, certaines immunités, et on prescrit l’acide folique.

## Comprendre
La consultation préconceptionnelle permet de parler du projet d’enfant, de ses craintes, de faire un bilan de santé et de préparer le début de la grossesse dans de bonnes conditions. Le professionnel qui la réalise n’est pas forcément celui qui suivra la grossesse. Santé.fr souligne l’intérêt de venir à deux, car beaucoup de points concernent aussi le futur père ou co-parent.

Plusieurs thèmes sont abordés. Les **antécédents familiaux** : maladies génétiques (mucoviscidose, hémophilie…), malformations, maladies chroniques ; et, selon les origines familiales, la recherche de drépanocytose ou de thalassémie. Les **antécédents personnels** : cycles, endométriose, syndrome des ovaires polykystiques, fibrome, interventions gynécologiques, grossesses précédentes. Les **maladies chroniques** (diabète, hypertension, épilepsie, maladie de la thyroïde, troubles psychiques) dont le traitement peut devoir être adapté. Les **habitudes de vie** : tabac, alcool, drogues, alimentation, activité physique, sommeil, travail. Et les **conditions de vie** : difficultés matérielles, relationnelles, travail pénible ou exposition à des produits toxiques.

Un examen clinique est réalisé (poids, tension, examen gynécologique et des seins selon la situation). Un bilan peut être prescrit : groupe sanguin (ABO, Rhésus, Kell), glycémie, immunité contre la rubéole, l’hépatite B et la toxoplasmose, dépistage de l’hépatite C, du VIH et de la syphilis.

## Au quotidien
- **Préparez vos documents** : carnet de santé et de vaccinations, résultats de prises de sang, échographies, comptes rendus d’opérations, résultats de frottis.
- **Notez vos questions** à l’avance, y compris celles qui vous semblent « bêtes ».
- **Listez vos médicaments**, y compris ceux pris occasionnellement et les compléments.
- **Venez à deux** si c’est possible.
- **Parlez de votre situation**, même délicate : isolement, difficultés matérielles, violences. Le professionnel peut vous orienter ; le site arretonslesviolences.gouv.fr informe aussi, avec une option pour effacer les traces de visite.

## Questions fréquentes
**Est-elle obligatoire ?**
Non, elle est facultative, mais recommandée pour aborder la grossesse plus sereinement.

**Combien de temps avant d’essayer ?**
Idéalement quelques mois avant : l’acide folique doit être commencé au moins 4 semaines avant la conception, et certains vaccins imposent un délai d’un mois avant une grossesse.

**Mon partenaire peut-il faire des examens ?**
Oui, parfois des examens sont proposés au futur père, et ses vaccins sont aussi vérifiés.

**Je suis Rhésus négatif : est-ce un problème ?**
Ce n’est pas un problème en soi, mais cela demande une surveillance et une prévention particulières pendant la grossesse. Le professionnel vous l’expliquera.

## Quand demander conseil
Prenez rendez-vous dès que le projet se précise, et sans attendre si vous avez une maladie chronique, un traitement au long cours, des antécédents de fausses couches ou de grossesse compliquée. En cas de violences, vous pouvez appeler le 3919 ; en danger immédiat, le 17 ou le 112.

${FIN}`,
  },
  {
    slug: 'vaccins-avant-une-grossesse',
    title: 'Vaccins à vérifier avant une grossesse',
    summary: 'Rubéole, rougeole, varicelle, coqueluche, grippe : quels vaccins mettre à jour avant d’être enceinte, et avec quels délais.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['vaccins', 'rubéole', 'coqueluche', 'varicelle', 'grippe'],
    sources: [S.amVaccins, S.amPreconc, S.santePreconc],
    status: 'to_review',
    body_md: `## En bref
- Certaines infections pendant la grossesse peuvent nuire au bébé : le projet de bébé est le bon moment pour mettre ses vaccins à jour.
- Les vaccins vivants (ROR et varicelle) se font avant la grossesse, avec une contraception pendant le mois qui suit.
- La coqueluche est essentielle à cause des formes graves chez les nourrissons.
- Grippe et Covid-19 peuvent aussi être faits pendant la grossesse selon les recommandations.

## Comprendre
L’Assurance Maladie explique que la consultation préconceptionnelle sert notamment à vérifier si vous êtes vaccinée ou immunisée contre des infections qui peuvent nuire au bébé. Santé.fr ajoute que cela concerne **les deux parents** : être à jour protège l’adulte et l’enfant à venir.

Les **vaccins vivants atténués** – rougeole-oreillons-rubéole (ROR) et varicelle – ne doivent pas être faits pendant la grossesse, en raison d’un risque potentiel pour le fœtus. Une grossesse doit donc être évitée pendant le mois qui suit, grâce à une contraception.

La **rubéole** est recherchée par une prise de sang. Si la sérologie est négative, ou si vous n’avez pas reçu deux doses, la vaccination avant la grossesse est indispensable ; elle est associée à la vaccination contre la rougeole, qui peut provoquer des fausses couches pendant la grossesse. Si vous n’avez jamais eu la **varicelle**, la vaccination est possible avant la grossesse.

La **coqueluche** est particulièrement importante : les nourrissons trop jeunes pour être vaccinés peuvent faire des formes graves nécessitant une hospitalisation. Le rattrapage est possible avant la grossesse, et la vaccination est recommandée pendant la grossesse, de préférence entre 20 et 36 semaines d’aménorrhée, pour transmettre des anticorps au bébé. Le rattrapage du tétanos, de la diphtérie, de la poliomyélite et de l’hépatite B peut aussi être fait avant.

La **grippe** est conseillée avant l’hiver et possible pendant la grossesse ; le **Covid-19** est conseillé selon les recommandations en vigueur. En cas de voyage prévu, d’autres vaccins (comme la fièvre jaune) peuvent être discutés.

## Au quotidien
- **Retrouvez votre carnet de vaccination** (ou celui de votre enfance) avant la consultation.
- **Demandez une sérologie** rubéole si vous ne savez pas si vous êtes protégée.
- **Planifiez** : si un vaccin vivant est nécessaire, prévoyez un mois de contraception avant d’essayer.
- **Pensez au partenaire et à l’entourage proche** pour la coqueluche, afin de protéger le futur bébé.
- **Consultez Vaccination Info Service** pour des informations officielles complémentaires.

## Questions fréquentes
**J’ai été vaccinée contre la rubéole sans le savoir enceinte. Que faire ?**
Parlez-en rapidement à votre médecin ou sage-femme, qui fera le point avec vous sur la conduite à tenir.

**Pourquoi la coqueluche, alors que je l’ai eue enfant ?**
La protection diminue avec le temps. La vaccination de la future mère permet de transmettre des anticorps au bébé pendant ses premières semaines.

**La vaccination contre la grippe est-elle possible enceinte ?**
Oui, elle est possible pendant la grossesse et conseillée avant l’hiver.

## Quand demander conseil
Faites le point avec votre médecin, votre sage-femme ou votre pharmacien dès le projet de grossesse. Si vous êtes en contact avec une personne atteinte de rubéole, de varicelle ou de rougeole alors que vous êtes peut-être enceinte, appelez votre médecin rapidement. Fièvre élevée avec éruption ou malaise important : consultez sans attendre, ou appelez le 15.

${FIN}`,
  },
  {
    slug: 'maladie-chronique-traitements-et-projet-de-grossesse',
    title: 'Maladie chronique, traitements et projet de grossesse',
    summary: 'Diabète, épilepsie, thyroïde, asthme, santé psychique : pourquoi préparer la grossesse avec son médecin avant d’essayer.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['maladie chronique', 'médicaments', 'diabète', 'épilepsie', 'thyroïde', 'automédication'],
    sources: [S.amVaccins, S.amPreconc],
    status: 'to_review',
    body_md: `## En bref
- En cas de maladie chronique, un bilan avant la grossesse est important : le traitement peut devoir être adapté.
- N’arrêtez jamais un traitement de vous-même : c’est avec votre médecin que tout se décide.
- Pas d’automédication ni de compléments alimentaires sans avis pendant un projet de grossesse.
- Certains médicaments du futur père peuvent aussi affecter les spermatozoïdes.

## Comprendre
L’Assurance Maladie recommande de faire le point avec son médecin ou sa sage-femme, dès le projet de grossesse, sur tous les médicaments pris au quotidien ou de temps en temps. En cas de traitement pour un asthme, un diabète (type 1 ou 2), une épilepsie, un problème de thyroïde ou une maladie psychique, ce bilan est particulièrement important : certains traitements doivent être adaptés **avant** la grossesse, pour protéger à la fois la santé de la mère et le développement du bébé.

Une maladie bien équilibrée au moment de la conception est un atout pour la grossesse. C’est pourquoi on parle de « programmer » la grossesse lorsque c’est possible. La consultation préconceptionnelle aborde aussi l’hypertension, les troubles de la coagulation et les antécédents familiaux.

Les médicaments pendant la grossesse sont à éviter autant que possible. Il est utile de demander dès le projet quels médicaments pourront être pris en cas de besoin (douleur, fièvre…). L’automédication est déconseillée, tout comme les compléments alimentaires sans avis médical : certains contiennent des vitamines ou oligo-éléments dont les fortes doses sont contre-indiquées.

Enfin, le projet concerne aussi le partenaire : certains médicaments pris par le père peuvent affecter les spermatozoïdes et diminuer la fertilité.

## Au quotidien
- **Prenez rendez-vous avec le médecin qui suit votre maladie** (et/ou votre médecin traitant) avant d’arrêter la contraception.
- **Apportez la liste complète** de vos traitements, y compris ponctuels, plantes et compléments.
- **Ne modifiez rien seule** : un arrêt brutal peut déséquilibrer la maladie, ce qui serait plus dangereux.
- **Demandez la liste des médicaments utilisables** en cas de fièvre, douleur ou allergie.
- **Signalez votre projet à chaque prescripteur** (dentiste, dermatologue, etc.) et au pharmacien.
- **Commencez l’acide folique** sur prescription, idéalement au moins 4 semaines avant la conception.
- **Santé psychique** : si vous prenez un traitement, parlez de votre projet avec votre psychiatre ou médecin ; un accompagnement adapté existe.

## Questions fréquentes
**Je prends un traitement depuis des années : vais-je devoir l’arrêter ?**
Pas forcément. Souvent, le traitement est adapté ou remplacé par une alternative compatible. Seul votre médecin peut en décider.

**Et si je découvre ma grossesse sous traitement ?**
Ne l’arrêtez pas de vous-même ; appelez rapidement votre médecin pour faire le point.

**Mon partenaire prend un traitement : faut-il en parler ?**
Oui, certains médicaments peuvent affecter la fertilité masculine. Il peut en parler à son médecin.

**Puis-je prendre un complément « spécial grossesse » acheté en pharmacie ?**
Demandez d’abord l’avis de votre médecin ou sage-femme, qui prescrira ce dont vous avez réellement besoin.

## Quand demander conseil
Consultez avant d’essayer si vous avez une maladie chronique ou un traitement au long cours. Contactez votre médecin rapidement si vous apprenez que vous êtes enceinte alors que vous prenez un traitement. En cas de crise grave (convulsions, malaise, gêne respiratoire importante), appelez le 15 ou le 112. En cas de détresse psychique, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'groupe-sanguin-rhesus-et-examens-avant-grossesse',
    title: 'Groupe sanguin, Rhésus et prises de sang avant la grossesse',
    summary: 'Pourquoi on vérifie le groupe sanguin, le Rhésus et certaines immunités avant d’être enceinte, et ce que change un Rhésus négatif.',
    category: 'preparer-grossesse',
    journeys: ['ttc'],
    tags: ['groupe sanguin', 'rhésus', 'sérologies', 'toxoplasmose', 'rubéole'],
    sources: [S.amPreconc, S.amFausseCouche, S.amGeu],
    status: 'to_review',
    body_md: `## En bref
- Avant la grossesse, une prise de sang peut vérifier le groupe sanguin (ABO, Rhésus, Kell) et certaines immunités.
- Les femmes Rhésus négatif bénéficient d’une prévention spécifique pendant et après la grossesse.
- Après une fausse couche, une IVG ou une grossesse extra-utérine, une injection d’anti-D est prévue si vous êtes Rhésus négatif.
- Le bilan recherche aussi l’hépatite C, le VIH et la syphilis.

## Comprendre
Lors du bilan avant grossesse, l’Assurance Maladie indique que plusieurs examens peuvent être prescrits : le **groupe sanguin** (ABO, Rhésus et Kell), un bilan de santé générale (glycémie, bilan lipidique), l’**immunité** contre la rubéole, l’hépatite B et la toxoplasmose, et le dépistage de l’hépatite C, du VIH et de la syphilis.

Le **Rhésus** concerne seulement les femmes Rhésus négatif portant un enfant Rhésus positif. Si du sang du fœtus passe dans la circulation de la mère (accouchement, fausse couche, IVG, interruption médicale de grossesse, grossesse extra-utérine), la mère peut fabriquer des anticorps. Lors d’une grossesse suivante, ces anticorps peuvent détruire les globules rouges du bébé et provoquer une anémie grave.

C’est pourquoi, si vous êtes Rhésus négatif, une injection d’immunoglobulines anti-D (« sérum anti-rhésus ») est réalisée après chaque accouchement et après une fausse couche, une IVG, une IMG ou une grossesse extra-utérine. Une prise de sang régulière pendant la grossesse recherche ces anticorps. Si la future mère est Rhésus négatif, le groupe sanguin du père est demandé.

La **toxoplasmose** et la **rubéole** sont recherchées car ces infections peuvent nuire au bébé pendant la grossesse. Savoir si vous êtes protégée permet d’adapter les conseils (alimentation, hygiène) ou de vous vacciner contre la rubéole avant.

## Au quotidien
- **Gardez votre carte de groupe sanguin** et vos résultats avec votre carnet de santé : ils serviront pendant toute la grossesse.
- **Si vous êtes Rhésus négatif**, dites-le à chaque professionnel qui vous prend en charge, notamment en cas de saignement ou de fausse couche.
- **Si vous n’êtes pas immunisée contre la toxoplasmose**, adoptez dès le projet les gestes de prévention : viande bien cuite, fruits et légumes bien lavés, lavage des mains, gants pour jardiner.
- **Si vous n’êtes pas protégée contre la rubéole**, faites-vous vacciner avant d’essayer, avec un mois de contraception ensuite.

## Questions fréquentes
**Rhésus négatif : vais-je avoir une grossesse « à risque » ?**
Non, pas en soi. Cela demande simplement une surveillance et une prévention bien établies, que votre équipe connaît.

**Pourquoi demander le groupe du père ?**
S’il est aussi Rhésus négatif, le bébé le sera également, ce qui change la conduite à tenir. Votre professionnel vous l’expliquera.

**Ces examens sont-ils remboursés ?**
Ils sont prescrits dans le cadre de la consultation préconceptionnelle, prise en charge par l’Assurance Maladie selon les règles habituelles.

## Quand demander conseil
Si vous êtes Rhésus négatif et que vous avez des saignements en début de grossesse, après une chute ou un choc sur le ventre, contactez rapidement votre médecin ou sage-femme. Saignements abondants, douleurs intenses ou malaise : appelez le 15 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ Difficultés à concevoir et AMP
  {
    slug: 'bilan-infertilite-du-couple',
    title: 'Le bilan d’infertilité du couple : comment il se déroule',
    summary: 'Quand consulter, quels examens chez la femme et chez l’homme, et dans quel ordre : le bilan expliqué étape par étape.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['infertilité', 'bilan', 'spermogramme', 'hystérosalpingographie', 'AMH'],
    sources: [S.amBilan, S.amPecInfertilite],
    status: 'to_review',
    body_md: `## En bref
- On consulte après 12 mois de rapports réguliers sans grossesse, ou après 6 mois si la femme a plus de 35 ans.
- Le bilan concerne toujours les deux partenaires, présents ensemble à la première consultation.
- Les examens sont progressifs : d’abord les plus simples, puis, si besoin, des examens plus poussés.
- Le spermogramme est indispensable chez l’homme ; échographie, bilan hormonal et examen des trompes chez la femme.

## Comprendre
Selon l’Assurance Maladie, une consultation est conseillée en l’absence de grossesse après **12 mois de rapports réguliers** (deux ou trois fois par semaine) aux périodes propices, sans contraception. Elle peut avoir lieu après **environ 6 mois** si la femme a plus de 35 ans ou si une maladie de l’appareil génital est connue ou suspectée chez l’un ou l’autre.

La première consultation sert à confirmer la situation, repérer une cause parfois simple (comme une méconnaissance de la période fertile) et décider des examens. Le médecin interroge sur l’âge, les antécédents (cycles, endométriose, fausses couches, infections sexuellement transmissibles ; chez l’homme, testicule non descendu, torsion, chirurgie de hernie), les maladies chroniques, le mode de vie et la vie sexuelle. Il examine les deux partenaires et peut demander une courbe de température pendant trois mois au maximum.

**Chez la femme**, selon la situation : prise de sang (thyroïde, hormones, AMH pour la réserve ovarienne, sérologies), échographie pelvienne souvent endovaginale (réserve ovarienne, kyste, SOPK, fibrome, polype, endométriose), **hystérosalpingographie** pour visualiser l’utérus et les trompes (en début de cycle, après les règles), parfois hystéroscopie, cœlioscopie, IRM ou caryotype.

**Chez l’homme** : sérologies et **spermogramme**, recueilli au laboratoire après 3 à 5 jours sans rapport. En cas d’anomalie, il est refait, et peut être complété par une spermoculture, un test de migration-survie, une échographie, un bilan hormonal, un caryotype ou d’autres examens.

Le test post-coïtal (test de Hühner) n’est pas recommandé dans le bilan initial.

## Au quotidien
- **Venez à deux** à la première consultation, avec vos résultats d’examens et carnets de santé.
- **Notez vos cycles** (dates des règles, durée) quelques mois avant : cela aide le médecin.
- **Prévoyez l’organisation** : certains examens se font à des moments précis du cycle.
- **Pour le spermogramme**, respectez 3 à 5 jours d’abstinence et signalez une fièvre récente ou un traitement.
- **Posez vos questions** sur chaque examen : à quoi il sert, s’il est douloureux, comment se préparer.
- **Prenez soin du couple** : un bilan peut être éprouvant ; s’autoriser à en parler aide.

## Questions fréquentes
**L’hystérosalpingographie est-elle douloureuse ?**
Elle peut être inconfortable. Demandez au centre comment elle se déroule et si une prise en charge de la douleur est prévue.

**Et si tous les examens sont bons ?**
L’objectif est alors de rassurer le couple et d’évaluer le délai raisonnable avant une éventuelle prise en charge ; une cause n’est pas toujours retrouvée.

**Faut-il faire tous les examens d’un coup ?**
Non, le bilan suit une logique progressive, des examens les plus simples aux plus spécialisés.

## Quand demander conseil
Consultez votre médecin, gynécologue ou sage-femme dans les délais indiqués, ou plus tôt en cas de cycles très irréguliers, d’absence de règles, de règles très douloureuses, d’antécédent d’infection génitale ou de chirurgie, ou de problème testiculaire chez le partenaire. Douleur pelvienne brutale et intense : appelez le 15 ou le 112. Si l’attente pèse lourd sur votre moral, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'infertilite-traitements-et-parcours',
    title: 'Infertilité : traitements et parcours de soins',
    summary: 'Hygiène de vie, traitements de l’ovulation, chirurgie, AMP : comment se construit la prise en charge après le bilan.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['infertilité', 'traitement', 'induction ovulation', 'chirurgie', 'AMP'],
    sources: [S.amPecInfertilite, S.amAmpTechniques],
    status: 'to_review',
    body_md: `## En bref
- Après le bilan, l’équipe évalue les chances de conception naturelle et le délai souhaitable avant d’agir.
- La prise en charge peut être médicale, chirurgicale, ou passer par l’assistance médicale à la procréation (AMP).
- L’hygiène de vie (tabac, poids, alcool, drogues) fait partie du traitement, pour les deux partenaires.
- Les traitements de l’ovulation demandent une surveillance, notamment du risque de grossesse multiple.

## Comprendre
L’Assurance Maladie explique que le bilan du couple est analysé par une équipe médicale. S’il n’y a pas d’anomalie, l’objectif est d’abord de rassurer. En cas d’anomalie, la prise en charge peut être médicale ou chirurgicale, avec une amélioration de l’hygiène de vie.

**Hygiène de vie** : arrêt du tabac souhaitable pour la femme et recommandé pour l’homme avant toute AMP ; arrêt des drogues indispensable ; perte de poids en cas d’obésité, retour à un poids de forme en cas de maigreur ; rapports un jour sur deux en période fertile ; alimentation de type méditerranéen ; alcool déconseillé ; activité physique régulière sans efforts intenses répétés.

**Traitements médicaux** : traitement des infections ou troubles pouvant réduire la fertilité, et **induction de l’ovulation** par des médicaments, notamment dans le syndrome des ovaires polykystiques. Ce traitement augmente le risque de grossesses multiples et de prématurité ; un trouble visuel sous certains traitements impose de consulter.

**Traitements chirurgicaux**, quand une cause est opérable : fibrome, malformation de l’utérus, obstruction d’une trompe, certaines endométrioses, « drilling » ovarien dans le SOPK (qui rétablit l’ovulation dans environ la moitié des cas), varicocèle chez l’homme.

**AMP** : proposée après échec des traitements, ou d’emblée dans certaines situations. Elle comprend l’insémination artificielle, la fécondation in vitro (FIV, avec ou sans ICSI) et l’accueil d’embryon.

## Au quotidien
- **Demandez un plan clair** : quelle étape, combien de temps, quand réévaluer.
- **Notez vos traitements** et les dates de surveillance (échographies, prises de sang).
- **Signalez tout effet inhabituel** pendant une stimulation : gonflement ou douleurs abdominales violentes, prise de poids brutale, troubles digestifs, trouble visuel.
- **Organisez le travail** : en cas d’AMP, le Code du travail prévoit des autorisations d’absence pour les actes médicaux.
- **Prenez soin de vous et du couple** : un accompagnement psychologique peut être proposé à tout moment.

## Questions fréquentes
**Faut-il toujours passer par l’AMP ?**
Non. Selon la cause, un traitement médical, une chirurgie ou simplement des changements d’hygiène de vie peuvent suffire.

**Combien de temps dure un parcours ?**
Il varie beaucoup selon la cause et l’âge. Votre équipe vous indiquera les étapes et les délais de réévaluation.

**Les traitements de l’ovulation sont-ils remboursés ?**
Les traitements prescrits dans un parcours de soins sont pris en charge selon les règles de l’Assurance Maladie ; l’AMP est prise en charge à 100 % dans certaines limites.

## Quand demander conseil
Contactez votre centre ou votre médecin en cas d’effet indésirable pendant un traitement. Un gonflement important du ventre avec douleurs violentes, essoufflement ou malaise pendant une stimulation impose une consultation urgente : appelez le 15 ou le 112. Si le parcours devient trop lourd moralement, parlez-en ; le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'sopk-et-desir-de-grossesse',
    title: 'Syndrome des ovaires polykystiques (SOPK) et désir de grossesse',
    summary: 'Comprendre le SOPK, ses effets sur l’ovulation et les étapes possibles pour concevoir.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['SOPK', 'ovulation', 'cycles irréguliers', 'fertilité'],
    sources: [S.amSopkSymptomes, S.amSopkTraitement, S.santeSopk],
    status: 'to_review',
    body_md: `## En bref
- Le SOPK est un trouble hormonal fréquent (environ une femme sur dix) qui perturbe l’ovulation.
- Il se manifeste par des cycles longs ou absents, des signes d’excès d’androgènes (pilosité, acné) et souvent un surpoids.
- C’est une cause fréquente de difficulté à concevoir, mais des solutions existent, étape par étape.
- En cas de surpoids, perdre environ 10 % de son poids peut améliorer les cycles et la fertilité.

## Comprendre
Le syndrome des ovaires polykystiques est une maladie chronique liée à un dérèglement hormonal, avec une production excessive d’androgènes (comme la testostérone). Santé.fr, reprenant l’Inserm, indique qu’il touche environ 10 % des femmes, avec des symptômes très variables. Le mot « kystes » est trompeur : il s’agit de follicules dont le développement est resté inachevé.

Les symptômes apparaissent souvent à la puberté : **règles irrégulières**, espacées de plus de 35 à 40 jours, voire absentes ; **hyperpilosité** (environ 70 % des femmes concernées), **acné** persistante, **chute de cheveux** ; **surpoids** fréquent. Fatigue, humeur dépressive, anxiété ou image de soi négative sont possibles.

Le diagnostic chez l’adulte repose sur au moins deux critères parmi trois : excès d’androgènes, ovulations rares ou absentes, aspect d’ovaires polykystiques à l’échographie. Un bilan hormonal (entre le 2e et le 5e jour du cycle, hors contraception hormonale) et métabolique est réalisé.

Le SOPK est une cause fréquente d’infertilité, parce que l’ovulation est rare ou absente. Pendant la grossesse, les risques de diabète gestationnel, de pré-éclampsie et d’accouchement prématuré sont plus élevés, surtout en cas de surpoids : un suivi adapté est donc important.

## Au quotidien
- **Parlez de votre projet lors d’une consultation préconceptionnelle**, recommandée par l’Assurance Maladie.
- **Hygiène de vie** : en cas de surpoids, alimentation équilibrée limitant sucres rapides et graisses, et plus d’activité physique. Chez les femmes de poids de forme, maigrir n’apporte pas de bénéfice.
- **Arrêter le tabac**, pour limiter le risque cardiovasculaire.
- **Les étapes possibles pour concevoir**, décidées avec votre médecin : recherche des autres causes (trompes, sperme du partenaire), puis induction de l’ovulation par médicaments en première intention, avec surveillance du risque de grossesse multiple ; « drilling » ovarien par cœlioscopie, qui rétablit l’ovulation dans environ 50 % des cas ; puis FIV si nécessaire.
- **Santé psychique** : le dispositif « Mon soutien psy » permet des séances avec un psychologue, prises en charge.

## Questions fréquentes
**Le SOPK empêche-t-il d’avoir un enfant ?**
Non, il rend souvent la conception plus difficile, mais de nombreuses femmes avec un SOPK ont des enfants, naturellement ou avec un traitement.

**Faut-il arrêter la pilule pour faire le bilan ?**
Le bilan hormonal doit être fait hors contraception hormonale ; votre médecin vous indiquera le délai et une contraception non hormonale en attendant.

**Le SOPK disparaît-il après une grossesse ?**
C’est une maladie chronique : le suivi se poursuit, notamment pour la glycémie, le cholestérol et la tension.

## Quand demander conseil
Consultez en cas de cycles irréguliers ou absents, de pilosité ou d’acné importantes, ou si la grossesse tarde. Pendant un traitement d’induction de l’ovulation, signalez tout trouble visuel, toute douleur ou gonflement important du ventre ; en cas de malaise ou de douleur intense, appelez le 15 ou le 112. Si le SOPK pèse sur votre moral, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'endometriose-et-desir-de-grossesse',
    title: 'Endométriose et désir de grossesse',
    summary: 'Comment l’endométriose peut gêner la conception, les signes qui doivent alerter et les solutions possibles.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['endométriose', 'règles douloureuses', 'fertilité', 'AMP'],
    sources: [S.amEndoSymptomes, S.amEndoTraitement, S.santeEndoAmp],
    status: 'to_review',
    body_md: `## En bref
- L’endométriose est une maladie chronique ; 30 à 40 % des femmes concernées ont une infertilité.
- Douleurs de règles intenses, douleurs pendant les rapports, troubles digestifs ou urinaires cycliques doivent faire consulter.
- Le diagnostic repose surtout sur l’échographie endovaginale et l’IRM, faites par des professionnels formés.
- En cas de désir de grossesse, chirurgie et AMP se discutent en équipe, selon la situation.

## Comprendre
L’endométriose est une maladie chronique où un tissu proche de la muqueuse utérine se développe hors de l’utérus. Les lésions saignent à chaque cycle et laissent des cicatrices. L’Assurance Maladie décrit des **douleurs pelviennes**, surtout pendant les règles, souvent intenses et mal soulagées, des **douleurs pendant les rapports**, des **symptômes urinaires ou digestifs** (douleur à la défécation, sang dans les urines ou les selles), une **fatigue chronique**, un gonflement du ventre. L’intensité des douleurs ne dépend pas de l’étendue des lésions. Certaines femmes n’ont aucun symptôme et l’endométriose est découverte lors d’un bilan d’infertilité.

Environ **30 à 40 %** des femmes atteintes présentent une infertilité. La probabilité de concevoir est estimée entre 2 et 10 % par cycle, contre 25 à 30 % dans les couples fertiles. Plusieurs mécanismes sont évoqués : lésions ou kystes gênant les trompes, utérus moins favorable à l’implantation, réserve ovarienne diminuée, inflammation.

Le diagnostic associe consultation, **échographie endovaginale** (technique de référence) et **IRM** si besoin ; un test salivaire est indiqué dans certains cas. La cœlioscopie n’est plus recommandée pour le diagnostic seul.

## Au quotidien
- **Consultez** si vos règles vous empêchent de vivre normalement : école, travail, sorties.
- **Tenez un carnet** des douleurs, de leur moment dans le cycle et des symptômes digestifs ou urinaires : il aide le médecin.
- **Parlez tôt de votre projet d’enfant** : il change les options de traitement. Les traitements hormonaux qui arrêtent les règles ne sont pas compatibles avec un essai de grossesse.
- **Discutez des options** : Santé.fr (EndoFrance) explique que le médecin discute avec la patiente du choix entre chirurgie et AMP, idéalement en centre de référence, avec une équipe pluridisciplinaire.
- **Soulager la douleur** : les antalgiques se prennent sur avis médical ; les anti-inflammatoires ne s’utilisent pas au long cours.
- **Demander l’ALD** pour les formes lourdes : une prise en charge à 100 % est possible sous conditions.
- **Préservation de la fertilité** : en cas de maladie qui menace la fertilité (dont l’endométriose), l’autoconservation des ovocytes peut être discutée.

## Questions fréquentes
**Faut-il opérer avant d’essayer d’être enceinte ?**
Pas forcément. La chirurgie est envisagée selon les organes atteints et doit apporter plus de bénéfices que d’inconvénients ; la décision se prend avec une équipe experte.

**La grossesse guérit-elle l’endométriose ?**
Non, c’est une maladie chronique qui régresse généralement après la ménopause.

**L’AMP est-elle possible avec une endométriose ?**
Oui, l’insémination ou la FIV peuvent être proposées selon la situation, l’âge et les résultats du bilan.

## Quand demander conseil
Consultez votre médecin traitant ou gynécologue en cas de douleurs de règles intenses ou qui s’aggravent, de douleurs pendant les rapports, ou de difficultés à concevoir. Une douleur pelvienne brutale et très intense, avec fièvre ou malaise, impose d’appeler le 15 ou le 112. Si la douleur chronique pèse sur votre moral, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'amp-qui-peut-y-acceder-et-comment',
    title: 'AMP (PMA) : qui peut y accéder et comment se passe le parcours',
    summary: 'Couples, couples de femmes, femmes non mariées : conditions, âges, entretiens et délai de réflexion de l’AMP en France.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['AMP', 'PMA', 'femme seule', 'couple de femmes', 'accès'],
    sources: [S.amAmp, S.amAmpRemboursement, S.santeAmpCout],
    status: 'to_review',
    body_md: `## En bref
- Depuis la loi de bioéthique de 2021, l’AMP est ouverte aux couples hétérosexuels, aux couples de femmes et aux femmes non mariées.
- L’accès ne peut pas être refusé en raison de l’orientation sexuelle ou du statut matrimonial.
- Âges : prélèvement d’ovocytes jusqu’au 43e anniversaire, AMP jusqu’au 45e anniversaire de la femme qui porte l’enfant.
- Le parcours commence par des entretiens au centre, suivis d’un délai de réflexion d’un mois.

## Comprendre
L’assistance médicale à la procréation (AMP, aussi appelée PMA) regroupe les techniques cliniques et biologiques qui permettent l’insémination, la fécondation in vitro, la conservation des gamètes et des embryons et le transfert d’embryons. Elle répond à un **projet parental**.

L’Assurance Maladie indique que l’AMP est accessible aux **couples hétérosexuels**, aux **couples de deux femmes** et aux **femmes non mariées**. Les deux membres du couple, ou la femme seule, doivent consentir à chaque insémination ou transfert. Le décès, une séparation, une demande de divorce ou la révocation écrite du consentement font obstacle à la poursuite. En France, la gestation pour autrui, la méthode ROPA et l’AMP post-mortem restent interdites ; le double don de gamètes est autorisé depuis 2021.

Les **limites d’âge** : prélèvement d’ovocytes jusqu’au 43e anniversaire ; recueil de spermatozoïdes jusqu’au 60e anniversaire ; insémination ou transfert d’embryon jusqu’au 45e anniversaire de la femme qui portera l’enfant, et jusqu’au 60e anniversaire pour le membre du couple qui ne le portera pas.

Avec un **tiers donneur**, le couple ou la femme non mariée fait une **reconnaissance anticipée** devant notaire. Les gamètes sont attribués selon l’ordre d’inscription ; le statut matrimonial, l’orientation sexuelle ou le fait d’avoir déjà des enfants ne peuvent pas favoriser ni exclure un demandeur.

## Au quotidien
- **Choisir un centre autorisé** : l’AMP ne se pratique que dans des établissements autorisés par l’ARS.
- **Préparer les entretiens** : l’équipe évalue la demande et explique les techniques, les chances, les risques, les contraintes. Un entretien avec un psychologue ou psychiatre fait partie du parcours.
- **Le dossier-guide** remis à la fin des entretiens détaille les règles, les techniques et l’accès aux origines pour l’enfant issu d’un don.
- **Délai de réflexion d’un mois** après le dernier entretien, puis confirmation écrite de la demande.
- **Refus ou report** : les motifs sont communiqués par écrit si vous le demandez.
- **Prise en charge** : à 100 % par l’Assurance Maladie, dans la limite de 6 inséminations et 4 FIV par grossesse obtenue.

## Questions fréquentes
**Une femme seule peut-elle bénéficier de l’AMP remboursée ?**
Oui, la prise en charge est la même quel que soit le type de couple ou de situation.

**Faut-il être mariées pour un couple de femmes ?**
Non. Une reconnaissance anticipée devant notaire est faite avant l’AMP avec tiers donneur.

**L’AMP à l’étranger est-elle remboursée ?**
Dans l’Union européenne, l’Espace économique européen ou en Suisse, il s’agit de soins programmés soumis à une autorisation préalable de l’Assurance Maladie.

**Combien de temps faut-il attendre un don de spermatozoïdes ?**
Les délais varient selon les centres et le nombre de donneurs ; votre centre vous informera.

## Quand demander conseil
Parlez de votre projet à votre médecin, gynécologue ou sage-femme, qui vous orientera vers un centre. Pendant un parcours, contactez le centre en cas d’effet inhabituel ; en cas de douleurs violentes, de gonflement important du ventre ou de malaise, appelez le 15 ou le 112. Si le parcours pèse sur votre moral, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'amp-techniques-insemination-fiv-icsi',
    title: 'Insémination, FIV, ICSI : les techniques d’AMP expliquées',
    summary: 'Le déroulement de chaque technique, de la stimulation au transfert, et les effets à surveiller.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['AMP', 'insémination', 'FIV', 'ICSI', 'stimulation', 'vitrification'],
    sources: [S.amAmpTechniques, S.santeEndoAmp],
    status: 'to_review',
    body_md: `## En bref
- L’insémination dépose les spermatozoïdes dans l’utérus ; la fécondation se fait ensuite naturellement.
- La FIV fait se rencontrer ovocytes et spermatozoïdes au laboratoire, puis transfère un ou deux embryons.
- L’ICSI injecte un seul spermatozoïde dans l’ovocyte ; elle est de plus en plus utilisée.
- Pendant une stimulation, un gonflement ou des douleurs abdominales violentes imposent de consulter en urgence.

## Comprendre
**L’insémination artificielle** est la technique la plus simple. Une stimulation ovarienne est souvent prescrite pour obtenir un ou deux ovocytes. Le jour de l’ovulation, les spermatozoïdes (du conjoint, préparés le jour même, ou d’un donneur, décongelés) sont déposés dans l’utérus avec un fin tube souple. Elle suppose des trompes en bon état et se fait le plus souvent sans hospitalisation.

**La fécondation in vitro (FIV)** comporte plusieurs étapes : une **stimulation ovarienne** surveillée par échographies et prises de sang, pour faire grandir plusieurs follicules ; un **déclenchement** puis une **ponction** des ovocytes par voie vaginale sous échographie, sous anesthésie locale ou générale ; la **mise en contact** des ovocytes et des spermatozoïdes au laboratoire ; l’identification des embryons dès le lendemain ; puis le **transfert** d’un ou deux embryons dans l’utérus, 2 à 3 jours plus tard (parfois 5), avec un cathéter fin. Les embryons de bonne qualité non transférés peuvent être **congelés** et transférés plus tard sans nouvelle FIV.

**L’ICSI** est une FIV avec micro-injection : un seul spermatozoïde est injecté dans un ovocyte mature. Elle répond notamment aux infertilités masculines.

**L’accueil d’embryon** consiste à transférer des embryons congelés donnés par un couple ou une femme qui n’ont plus de projet parental. La **vitrification** (congélation ultra-rapide) des ovocytes permet le don d’ovocytes et l’autoconservation.

## Au quotidien
- **Faire les injections** à heure fixe, comme indiqué ; une infirmière peut venir à domicile si besoin.
- **Respecter le calendrier de surveillance** : il permet d’ajuster les doses et de fixer la ponction.
- **Prévoir d’être accompagnée** le jour de la ponction, pour le retour.
- **Connaître les effets fréquents** : bouffées de chaleur, douleurs abdominales, petits saignements, prise de poids transitoire.
- **Organiser le travail** : autorisations d’absence prévues par le Code du travail pour les actes du protocole.
- **Après le transfert**, suivre les consignes du centre pour le test de grossesse.

## Questions fréquentes
**Combien d’embryons sont transférés ?**
Un ou deux, selon la situation ; votre équipe vous explique ce choix.

**La ponction est-elle douloureuse ?**
Elle se fait sous anesthésie locale ou générale, à discuter avec l’équipe.

**Les embryons congelés ont-ils autant de chances ?**
Votre centre pourra vous donner des informations adaptées à votre situation ; les sources consultées ne donnent pas de chiffres généraux.

**Faut-il rester allongée après le transfert ?**
Suivez les consignes de votre centre ; les sources consultées ne donnent pas d’instruction générale à ce sujet.

## Quand demander conseil
Pendant une stimulation ou après une ponction, un gonflement important du ventre, des douleurs abdominales violentes, une prise de poids brutale, des troubles digestifs importants ou un essoufflement nécessitent une consultation médicale urgente : contactez votre centre, et appelez le 15 ou le 112 en cas de malaise. Fièvre ou saignements abondants après une ponction : consultez rapidement.

${FIN}`,
  },
  {
    slug: 'amp-prise-en-charge-et-absences-au-travail',
    title: 'AMP : remboursement, nombre de tentatives et absences au travail',
    summary: 'Ce que l’Assurance Maladie prend en charge, les limites de tentatives et d’âge, et vos droits d’absence au travail.',
    category: 'droits-demarches',
    journeys: ['ttc'],
    tags: ['AMP', 'remboursement', '100 %', 'travail', 'absences', 'droits'],
    sources: [S.amAmpRemboursement, S.santeAmpCout, S.amAmp],
    status: 'to_review',
    body_md: `## En bref
- Les actes d’AMP sont pris en charge à 100 % par l’Assurance Maladie, quel que soit le type de couple ou de situation.
- Limites : 6 inséminations (une par cycle) et 4 FIV pour obtenir une grossesse.
- Des autorisations d’absence sont prévues pour les actes médicaux, sans perte de salaire ni d’ancienneté.
- Le ou la partenaire peut s’absenter pour assister à trois des examens.

## Comprendre
Contrairement à une idée reçue que Santé.fr corrige (« L’AMP est très coûteuse » : faux), l’AMP est prise en charge à **100 %** par l’Assurance Maladie lorsqu’elle est prescrite médicalement. Cette prise en charge est limitée à **6 inséminations artificielles** (une seule par cycle) et **4 tentatives de fécondation in vitro** pour obtenir une grossesse. Elle concerne les couples hétérosexuels, les couples de femmes et les femmes non mariées.

Les conditions d’âge s’appliquent : prélèvement d’ovocytes jusqu’au 43e anniversaire, recueil de spermatozoïdes jusqu’au 60e anniversaire, AMP jusqu’au 45e anniversaire de la femme qui portera l’enfant et jusqu’au 60e anniversaire du membre du couple qui ne le portera pas.

L’équipe médicale confirme la poursuite du parcours selon la probabilité de succès et les conditions d’accueil de l’enfant. En cas de report ou de refus, les motifs peuvent être communiqués par écrit.

Côté travail, le **Code du travail (article L1225-16)** prévoit une **autorisation d’absence** pour les actes médicaux nécessaires au protocole. Ces absences sont assimilées à du temps de travail effectif pour les congés payés et l’ancienneté, et ne doivent pas entraîner de baisse de rémunération. Un justificatif peut être demandé. La personne vivant en couple avec la demandeuse peut s’absenter pour assister à **trois** de ces examens.

## Au quotidien
- **Gardez vos ordonnances et justificatifs** : ils servent pour le remboursement et pour l’employeur.
- **Informez votre employeur** seulement de ce qui est nécessaire : vous n’avez pas à détailler votre parcours.
- **Notez le nombre de tentatives** déjà réalisées : la limite s’entend par grossesse obtenue.
- **Renseignez-vous auprès de votre centre** sur les frais éventuels non couverts (dépassements, certains médicaments, transports) et sur votre complémentaire santé.
- **AMP à l’étranger** (UE, EEE, Suisse) : demandez une autorisation préalable à l’Assurance Maladie avant de commencer.

## Questions fréquentes
**Le compteur de tentatives repart-il après une naissance ?**
La prise en charge est prévue « pour obtenir une grossesse ». Demandez à votre caisse ou à votre centre comment elle s’applique à un nouveau projet.

**Mon employeur peut-il refuser mes absences ?**
La loi prévoit une autorisation d’absence pour les actes du protocole ; un justificatif peut vous être demandé.

**Les femmes seules sont-elles remboursées de la même façon ?**
Oui, la prise en charge est identique quelle que soit la situation.

## Quand demander conseil
Pour une question de remboursement, contactez votre caisse d’Assurance Maladie (compte ameli) ou le secrétariat de votre centre. Pour un conflit avec votre employeur, vous pouvez vous adresser aux représentants du personnel ou à l’inspection du travail. Si le parcours pèse sur votre moral, parlez-en ; le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'don-de-gametes-recevoir-un-don',
    title: 'Recevoir un don de gamètes : principes, délais et accès aux origines',
    summary: 'Gratuité, anonymat, accès de l’enfant à l’identité du donneur depuis 2022 : ce qu’il faut savoir avant de recevoir un don.',
    category: 'difficultes-conception',
    journeys: ['ttc'],
    tags: ['don de gamètes', 'don de spermatozoïdes', 'don d’ovocytes', 'accès aux origines'],
    sources: [S.amAmpDon, S.abmAnonymat, S.amAmp],
    status: 'to_review',
    body_md: `## En bref
- Le don de gamètes est gratuit, volontaire et anonyme entre donneurs et receveurs.
- Depuis le 1er septembre 2022, la personne née d’un don peut, à sa majorité, accéder à des informations sur le donneur et à son identité.
- Aucun lien de filiation ne peut exister entre le donneur et l’enfant.
- Les listes d’attente sont longues, en particulier pour le don d’ovocytes.

## Comprendre
Le don de spermatozoïdes ou d’ovocytes permet à un couple ou à une femme seule de réaliser un projet d’enfant lorsque ses propres gamètes ne le permettent pas, en cas de risque de maladie génétique transmissible, ou pour une femme seule ou un couple de femmes. L’**accueil d’embryon** permet aussi de recevoir des embryons congelés donnés par des personnes qui n’ont plus de projet parental.

L’Agence de la biomédecine rappelle que le don est **anonyme** entre donneurs et receveurs et qu’**aucun lien de filiation** ne peut être établi avec le donneur. Depuis la loi de bioéthique de 2021, appliquée au **1er septembre 2022**, la personne née d’un don peut, une fois majeure, demander des **données non identifiantes** (âge, caractéristiques physiques, situation familiale et professionnelle, motivations…) et l’**identité** du donneur. Tous les donneurs depuis cette date acceptent cette transmission. La commission CAPADD gère ces demandes et sollicite aussi les donneurs plus anciens.

Les gamètes sont attribués selon l’ordre d’inscription. Un appariement sur certains critères physiques peut être demandé et réalisé dans la mesure du possible ; des critères médicaux peuvent raccourcir le délai. L’Assurance Maladie fait état de listes d’attente importantes : plus de 10 000 femmes pour un don de spermatozoïdes et près de 2 800 pour un don d’ovocytes fin 2024.

## Au quotidien
- **Inscrivez-vous tôt** dans un centre autorisé : l’attente compte.
- **Faites la reconnaissance anticipée devant notaire** si vous êtes un couple ou une femme seule recourant à un tiers donneur.
- **Réfléchissez à la façon de parler du don à l’enfant** : l’accès aux origines est un droit de l’enfant devenu adulte ; des psychologues des centres peuvent vous accompagner.
- **Pensez à l’entourage** : parler du don autour de vous peut aider à recruter des donneurs, car l’attente dépend du nombre de dons.
- **Prenez soin de vous** : le deuil de la génétique partagée peut être difficile ; un accompagnement psychologique est possible.

## Questions fréquentes
**Pourrons-nous choisir le donneur ?**
Non, l’attribution suit l’ordre d’inscription, avec possibilité d’appariement physique dans la mesure du possible.

**Le donneur saura-t-il qui nous sommes ?**
Non, les donneurs n’ont aucune information sur les personnes nées de leur don.

**L’enfant pourra-t-il connaître le donneur ?**
À sa majorité, s’il le souhaite, il pourra accéder à des données non identifiantes et à l’identité du donneur, sans aucun lien de filiation.

## Quand demander conseil
Parlez de votre projet à votre médecin ou à votre centre d’AMP, qui vous expliquera le parcours et les délais. Un psychologue peut vous accompagner dans la réflexion. Si l’attente devient trop difficile à vivre, n’hésitez pas à en parler ; le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'donner-ses-ovocytes-ou-ses-spermatozoides',
    title: 'Donner ses ovocytes ou ses spermatozoïdes',
    summary: 'Qui peut donner, comment se déroule un don, ce qui est pris en charge et ce que change l’accès aux origines.',
    category: 'difficultes-conception',
    journeys: ['ttc', 'avoid'],
    tags: ['don d’ovocytes', 'don de spermatozoïdes', 'donneur', 'gratuité'],
    sources: [S.abmDonOvocytes, S.santeDonSperme, S.amAmpDon],
    status: 'to_review',
    body_md: `## En bref
- Les femmes de 18 à 37 ans et les hommes de 18 à 44 ou 45 ans en bonne santé peuvent donner, avec ou sans enfant.
- Le don est gratuit, réalisé dans un établissement autorisé ; les frais sont pris en charge.
- Les donneurs acceptent que leur identité et des données non identifiantes soient transmises aux personnes nées du don qui le demanderont à leur majorité.
- Le don d’ovocytes demande une stimulation d’environ 10 à 12 jours puis une ponction ; le don de spermatozoïdes, plusieurs recueils.

## Comprendre
Les besoins sont importants : l’Assurance Maladie fait état de plusieurs milliers de personnes en attente d’un don. L’Agence de la biomédecine (dondovocytes.fr) précise que la **donneuse d’ovocytes** doit avoir entre 18 et 37 ans inclus et être en bonne santé ; il n’est pas nécessaire d’avoir des enfants. Santé.fr indique que le **donneur de spermatozoïdes** doit être un homme en bonne santé de 18 à 44 ans inclus (ameli mentionne 18 à 45 ans), avec ou sans enfant. Le conjoint n’a pas à donner son accord.

Le parcours commence par un **bilan** : entretien médical, consultation génétique et caryotype, prises de sang (recherche de virus comme les hépatites ou le VIH), échographie et réserve ovarienne pour les femmes, et un entretien avec un psychologue systématiquement proposé. Deux consentements sont signés : au don, et à la transmission des données aux personnes nées du don. Le consentement peut être retiré jusqu’à l’utilisation des gamètes.

**Don d’ovocytes** : environ 10 à 12 jours d’injections hormonales, trois contrôles (prise de sang et échographie), puis une **ponction** à l’hôpital, d’environ 10 minutes, sous anesthésie locale ou générale courte, suivie de 2 à 3 heures de surveillance. Des douleurs proches des règles et une fatigue sont fréquentes. Les complications sont rares mais doivent être signalées sans attendre. Une contraception par préservatifs est recommandée jusqu’aux règles suivantes.

**Don de spermatozoïdes** : un premier recueil au centre après 3 à 5 jours d’abstinence, pour évaluer les spermatozoïdes et leur résistance à la congélation, puis environ 4 à 5 recueils, et parfois un dernier contrôle sanguin.

## Au quotidien
- **Contactez un centre de don** près de chez vous (listes sur les sites de l’Agence de la biomédecine).
- **Prévoyez 4 à 6 mois** pour un don d’ovocytes.
- **Autorisation d’absence** : la loi prévoit une absence sans perte de rémunération pour chaque étape (examens, stimulation, prélèvement).
- **Frais** : frais médicaux pris en charge à 100 % ; frais de transport, d’hébergement, de garde d’enfant et pertes de revenus remboursés sur justificatifs.
- **Parlez-en à votre entourage** si vous le souhaitez : le don reste anonyme pour les receveurs.

## Questions fréquentes
**Les personnes nées de mon don pourront-elles me retrouver ?**
À leur majorité, si elles le demandent, elles pourront accéder à votre identité et à des données non identifiantes. Aucun lien de filiation ne peut être établi.

**Donner ses ovocytes réduit-il ma fertilité future ?**
Selon l’Agence de la biomédecine, aucune conséquence à long terme des traitements n’a été rapportée à ce jour.

**Puis-je donner si je n’ai pas d’enfant ?**
Oui, c’est possible pour les femmes comme pour les hommes.

## Quand demander conseil
Contactez un centre de don pour toute question. Après une ponction, une douleur importante, un gonflement du ventre, une fièvre ou des saignements abondants doivent être signalés sans attendre au centre ; en cas de malaise, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    slug: 'autoconservation-des-gametes',
    title: 'Conserver ses ovocytes ou ses spermatozoïdes pour plus tard',
    summary: 'Autoconservation pour raison médicale ou sans raison médicale : âges, conditions et suivi en France.',
    category: 'fertilite',
    journeys: ['ttc', 'avoid'],
    tags: ['autoconservation', 'congélation ovocytes', 'préservation fertilité', 'vitrification'],
    sources: [S.amAmpAutoconservation, S.amAmpTechniques],
    status: 'to_review',
    body_md: `## En bref
- Depuis 2021, l’autoconservation des gamètes est possible en France sans raison médicale.
- Femmes : prélèvement des ovocytes de leur 29e à leur 37e anniversaire ; hommes : de 29 à 45 ans.
- Les gamètes peuvent être utilisés jusqu’au 45e anniversaire de la femme qui portera l’enfant.
- Pour raison médicale (traitement d’un cancer, maladie menaçant la fertilité), une préservation est proposée à tout âge.

## Comprendre
L’Assurance Maladie distingue deux situations.

**Pour raison médicale** : les personnes dont un traitement peut altérer la fertilité (par exemple un cancer) ou dont la fertilité risque de diminuer prématurément à cause d’une maladie (endométriose, lupus…). L’objectif est de conserver des gamètes ou des tissus germinaux pour une future AMP. Selon l’âge et la puberté, il peut s’agir de congélation de spermatozoïdes, de tissu ovarien ou testiculaire.

**Sans raison médicale** : les femmes et les hommes qui envisagent un recours ultérieur à l’AMP. Le prélèvement est possible pour les **femmes de leur 29e à leur 37e anniversaire**, et le recueil pour les **hommes de 29 à 45 ans**. L’utilisation des gamètes est possible jusqu’au **45e anniversaire** de la femme qui portera l’enfant, et jusqu’au 60e anniversaire du membre du couple qui ne le portera pas. Les demandes ont fortement augmenté ces dernières années.

La congélation ultra-rapide des ovocytes (**vitrification**) permet une bonne survie après décongélation. Pour les ovocytes, le parcours ressemble à celui d’une FIV : stimulation ovarienne, surveillance, puis ponction.

La conservation se fait dans des établissements autorisés par l’ARS, sans dépassements d’honoraires. Chaque année, la personne est consultée et doit confirmer par écrit la poursuite. Elle peut aussi choisir de donner ses gamètes, de les confier à la recherche ou d’arrêter la conservation (choix confirmé après un délai de réflexion de trois mois). Sans réponse pendant dix ans, la conservation prend fin.

## Au quotidien
- **Renseignez-vous auprès d’un centre** autorisé : il vous expliquera le déroulement, les examens et les frais.
- **Demandez quels frais sont pris en charge** : les sources consultées ne détaillent pas les tarifs de conservation.
- **Gardez vos coordonnées à jour** auprès du centre pour recevoir la consultation annuelle.
- **Ne repoussez pas trop** : l’âge au moment du prélèvement compte pour la qualité des ovocytes.
- **En cas de maladie grave**, demandez à votre équipe si une préservation de la fertilité est possible avant le traitement.

## Questions fréquentes
**Congeler ses ovocytes garantit-il une grossesse plus tard ?**
Non, c’est une possibilité, pas une garantie. Votre centre pourra vous informer sur les chances selon votre âge et le nombre d’ovocytes conservés.

**Puis-je le faire après 37 ans ?**
Sans raison médicale, la loi fixe la limite au 37e anniversaire pour le prélèvement.

**Que deviennent mes ovocytes si je n’en ai pas besoin ?**
Vous pouvez choisir de les donner, de les confier à la recherche ou d’arrêter la conservation.

## Quand demander conseil
Parlez-en à votre gynécologue ou à un centre d’AMP. Si un traitement lourd est prévu (chimiothérapie, chirurgie pelvienne), demandez une consultation de préservation de la fertilité avant de commencer. Après une ponction, une douleur importante, un gonflement du ventre ou un malaise imposent de consulter rapidement ; en urgence, appelez le 15 ou le 112.

${FIN}`,
  },
  {
    slug: 'vivre-un-parcours-d-infertilite',
    title: 'Vivre un parcours d’infertilité : émotions, couple et soutien',
    summary: 'Attente, déceptions, culpabilité, tensions dans le couple : comment prendre soin de soi pendant un parcours et où trouver de l’aide.',
    category: 'sante-mentale',
    journeys: ['ttc'],
    tags: ['infertilité', 'émotions', 'couple', 'soutien psychologique', 'AMP'],
    sources: [S.amAmp, S.amSopkTraitement, S.amFausseCouche],
    status: 'to_review',
    body_md: `## En bref
- Un parcours pour avoir un enfant peut être long et éprouvant : ressentir de la tristesse, de la colère ou de l’épuisement n’a rien d’un échec.
- Les centres d’AMP prévoient un entretien avec un psychologue ou un psychiatre, et un soutien peut être demandé à tout moment.
- « Mon soutien psy » permet des séances avec un psychologue prises en charge par l’Assurance Maladie.
- Chaque membre du couple vit le parcours à sa façon : en parler ensemble protège la relation.

## Comprendre
L’attente de chaque cycle, les examens, les traitements et les échecs éventuels peuvent peser lourd. Beaucoup de personnes décrivent une alternance d’espoir et de déception, une impression que la vie est « en pause », de la jalousie face aux annonces de grossesse de l’entourage, ou de la culpabilité. Ces réactions sont fréquentes et compréhensibles.

Le parcours d’AMP comporte, selon l’Assurance Maladie, des entretiens au cours desquels l’équipe aborde les motivations, les chances de réussite ou d’échec, les contraintes et la pénibilité ; un psychiatre, un psychologue ou un infirmier spécialisé fait partie de l’équipe. Un soutien psychologique est aussi recommandé dans certaines maladies associées à l’infertilité, comme le syndrome des ovaires polykystiques. Après une fausse couche, l’Assurance Maladie conseille également de demander un soutien en cas de tristesse, de sentiment de vide ou de culpabilité.

Dans le couple, chacun peut réagir différemment : l’un a besoin d’en parler, l’autre de s’en éloigner. Cela ne veut pas dire que l’un tient moins au projet. Les rapports sexuels peuvent devenir une « tâche » programmée, ce qui pèse sur le désir.

## Au quotidien
- **Donnez-vous le droit de ressentir** ce que vous ressentez, sans vous juger.
- **Fixez ensemble des moments sans « projet bébé »** : sorties, loisirs, intimité sans calendrier.
- **Choisissez à qui vous en parlez** : vous n’êtes pas obligée de tout partager, ni de vous justifier.
- **Préparez les consultations à deux** et répartissez les tâches (rendez-vous, traitements, papiers).
- **Demandez un soutien** : psychologue du centre, médecin traitant, sage-femme, ou « Mon soutien psy » (une séance d’évaluation puis jusqu’à 11 séances prises en charge, sur orientation ou en accès direct selon les règles en vigueur).
- **Associations de patients** : elles proposent des groupes de parole et des informations pratiques.
- **Prenez soin de votre corps** : sommeil, activité physique douce, alimentation, sans en faire une nouvelle pression.

## Questions fréquentes
**Le stress empêche-t-il de tomber enceinte ?**
Les sources consultées ne permettent pas d’en faire une cause. Ce qui est sûr, c’est que le stress fait souffrir : il mérite d’être pris en charge pour lui-même.

**Comment répondre aux questions de l’entourage ?**
Vous pouvez préparer une réponse courte qui protège votre intimité, ou demander à un proche de faire passer le message.

**Faut-il faire une pause entre deux tentatives ?**
C’est une décision à prendre avec votre équipe, en tenant compte de votre âge, de votre santé et de votre moral.

**Mon ou ma partenaire semble moins touché(e). Est-ce le signe d’un désintérêt ?**
Pas forcément : chacun exprime ses émotions différemment. En parler, éventuellement avec un tiers, aide à se comprendre.

## Quand demander conseil
Consultez votre médecin ou un psychologue si la tristesse dure plusieurs semaines, si vous ne prenez plus plaisir à rien, si le sommeil ou l’appétit sont perturbés, ou si le couple traverse une crise. En cas d’idées noires ou de détresse, appelez le 3114 (24 h/24, gratuit) ; en danger immédiat, le 15 ou le 112.

${FIN}`,
  },
  // ------------------------------------------------------------------ Début de grossesse : urgences et pertes
  {
    slug: 'fausse-couche-precoce-comprendre-et-traverser',
    title: 'Fausse couche précoce : comprendre, se soigner, être soutenue',
    summary: 'Signes, prise en charge, conseils après une fausse couche et soutien : ce qu’il faut savoir, avec douceur.',
    category: 'grossesse',
    journeys: ['ttc', 'pregnant'],
    tags: ['fausse couche', 'saignements', 'début de grossesse', 'deuil', 'rhésus'],
    max_week: 14,
    safety_critical: true,
    sources: [S.amFausseCouche, S.amPreconc],
    status: 'to_review',
    body_md: `## En bref
- Une fausse couche est l’arrêt spontané d’une grossesse avant 22 semaines ; elle est dite précoce avant 14 semaines.
- Elle concerne environ 15 % des grossesses ; la cause la plus fréquente est une anomalie chromosomique de l’embryon, sans lien avec ce que vous avez fait.
- Saignements abondants, signes de malaise ou douleur très forte d’un côté du ventre : urgence, appelez le 15.
- Un soutien psychologique peut aider ; un nouveau projet peut être envisagé dès que vous vous sentez prête.

## Comprendre
L’Assurance Maladie définit la fausse couche comme un arrêt spontané de la grossesse avant la 22e semaine. La fausse couche **précoce**, avant 14 semaines, est la plus fréquente. Une fausse couche isolée touche environ 15 % des grossesses, et les grossesses suivantes se déroulent en général sans difficulté. Le risque augmente avec l’âge. Les **fausses couches à répétition** (au moins trois consécutives avant 14 semaines) concernent environ 1,5 % des femmes et justifient un bilan.

Lors d’une fausse couche isolée, la cause la plus probable est une **anomalie chromosomique** de l’embryon, qui arrête son développement. Certains facteurs favorisent les fausses couches : obésité, tabac, excès de café, alcool, drogues, exposition aux pesticides, carence en vitamines B9 ou B12.

Les signes possibles : **saignements** (légers ou abondants, brunâtres ou rouge vif), expulsion de tissus ou de caillots, **douleurs** du bas du dos ou du bas-ventre, crampes comme des règles. Un saignement en début de grossesse n’annonce pas toujours une fausse couche : un quart des femmes enceintes saignent au 1er trimestre et poursuivent leur grossesse.

Le diagnostic repose sur l’examen et l’échographie, parfois un dosage de l’hormone hCG. Selon la situation : attente de l’expulsion naturelle (quelques jours à deux semaines), traitement médicamenteux pour provoquer l’expulsion, ou aspiration sous anesthésie. Si vous êtes **Rhésus négatif**, une injection d’anti-D est réalisée.

## Au quotidien
- **Pour des saignements modérés**, contactez votre médecin ou gynécologue dans la journée.
- **Après la fausse couche** : pas de tampons, attendre environ deux semaines avant les rapports sexuels, consulter en cas de fièvre, frissons, saignements abondants ou douleurs.
- **Arrêt de travail** : si votre état le nécessite, le médecin peut en prescrire un, sans délai de carence.
- **Accordez-vous du temps** : tristesse, vide, culpabilité ou colère sont des réactions fréquentes. Le ou la partenaire peut aussi être touché(e).
- **Parlez-en** à vos proches, à votre médecin, à une sage-femme ou à un psychologue.

## Questions fréquentes
**Est-ce de ma faute ?**
Dans la grande majorité des cas, la cause est une anomalie chromosomique de l’embryon, qui ne dépend pas de vous.

**Quand pourrai-je essayer à nouveau ?**
L’Assurance Maladie indique qu’un projet peut être envisagé dès le rétablissement ; une consultation préconceptionnelle permet de faire le point sur vos inquiétudes.

**Faut-il faire des examens après une première fausse couche ?**
En général non pour une fausse couche isolée ; un bilan est indispensable en cas de fausses couches à répétition.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de saignements abondants ou de signes de choc : faiblesse, vertiges, confusion, fièvre ou froid brutal, cœur qui s’accélère, nausées ou vomissements. Une **douleur abdominale sévère et persistante**, parfois vers l’épaule, avec petits saignements et faiblesse, peut évoquer une grossesse extra-utérine : urgence. Pour des saignements modérés, consultez dans la journée. Si la tristesse persiste ou devient trop lourde, le 3114 répond 24 h/24.

${FIN}`,
  },
  {
    slug: 'grossesse-extra-uterine-signes-d-alerte',
    title: 'Grossesse extra-utérine : les signes qui doivent alerter',
    summary: 'Ce qu’est une grossesse extra-utérine, pourquoi elle est une urgence, ses signes et ses traitements.',
    category: 'grossesse',
    journeys: ['ttc', 'pregnant'],
    tags: ['grossesse extra-utérine', 'GEU', 'urgence', 'douleur', 'saignements'],
    max_week: 12,
    safety_critical: true,
    sources: [S.amGeu, S.amFausseCouche, S.santeTabacFertilite],
    status: 'to_review',
    body_md: `## En bref
- Une grossesse extra-utérine (GEU) est une grossesse qui s’implante hors de l’utérus, le plus souvent dans une trompe.
- Signes : douleur du bas-ventre souvent d’un seul côté, petits saignements noirâtres, après un retard de règles.
- C’est une urgence : sans traitement, la trompe peut se rompre et provoquer une hémorragie interne.
- Le tabac est un facteur de risque majeur ; après une GEU, la fertilité peut diminuer, d’où l’intérêt d’agir vite.

## Comprendre
Dans une grossesse extra-utérine, l’œuf fécondé s’implante en dehors de la cavité de l’utérus : dans la grande majorité des cas dans une **trompe**, plus rarement sur un ovaire, dans l’abdomen ou dans le col. La grossesse ne peut pas évoluer normalement et met en danger la santé de la femme.

L’Assurance Maladie décrit des **symptômes peu spécifiques**, qui surviennent souvent après un retard de règles, quand la femme pense être enceinte ou ne le sait pas encore : **douleurs du bas-ventre**, souvent d’un seul côté, sourdes avec parfois des accès plus intenses (elles peuvent être absentes), et **saignements vaginaux** peu abondants, de couleur noirâtre. La page sur la fausse couche ajoute qu’une douleur abdominale sévère et persistante, pouvant irradier vers l’épaule, suivie de petits saignements et d’une faiblesse, doit faire consulter en urgence.

Sans traitement précoce, le danger est la **rupture de la trompe** avec une hémorragie interne. Le diagnostic repose sur l’examen gynécologique, une **échographie endovaginale** et un **dosage sanguin de l’hormone bêta-hCG**, réalisés en urgence.

Le traitement peut être **médicamenteux** si le diagnostic est précoce (injection d’un médicament qui fait régresser la grossesse, avec surveillance jusqu’à négativation de l’hCG, en général en un mois), ou **chirurgical** par cœlioscopie, en conservant la trompe si possible. Une simple surveillance est exceptionnelle. Si vous êtes **Rhésus négatif**, une injection d’anti-D est nécessaire.

Selon Santé.fr, environ une grossesse extra-utérine sur trois serait liée au tabac.

## Au quotidien
- **Faites un test de grossesse** en cas de retard de règles avec douleurs inhabituelles ou petits saignements.
- **N’attendez pas que la douleur passe** : consultez rapidement.
- **Signalez vos antécédents** (GEU, chirurgie des trompes, infections génitales) dès le début d’une grossesse : votre professionnel vous proposera une échographie précoce si besoin.
- **Arrêter le tabac** réduit le risque.
- **Après une GEU**, prenez le temps de récupérer physiquement et émotionnellement ; parlez de votre projet suivant avec votre médecin.

## Questions fréquentes
**Peut-on avoir une GEU avec un test de grossesse positif « normal » ?**
Oui : le test indique une grossesse mais pas son emplacement. Seule l’échographie le précise.

**Pourrai-je être enceinte après une GEU ?**
Oui, souvent, mais la fertilité peut diminuer. C’est pourquoi on cherche à conserver la trompe quand c’est possible ; parlez de votre projet à votre médecin.

**Le traitement médicamenteux est-il possible dans tous les cas ?**
Non, il dépend du stade et de l’absence de contre-indication ; l’équipe choisit avec vous.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** en cas de douleur abdominale violente, de douleur vers l’épaule, de malaise, de vertiges, de pâleur ou de saignements abondants, surtout si vous êtes peut-être enceinte. Pour des douleurs modérées ou de petits saignements après un retard de règles, consultez très rapidement (dans la journée) un médecin ou les urgences gynécologiques. Après une GEU, si le moral flanche, le 3114 répond 24 h/24.

${FIN}`,
  },
];
