/** Guide complet — lot 22 (27/10/2026) : projet bébé, approfondissements (cycle et hormones, examens de fertilité, travail et expositions, chaque méthode de contraception en détail, arrêter sa contraception, grossesse après une fausse couche). Articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». Aucune dose de médicament, aucune marque. */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles ou de référence françaises). `published` = date affichée par la page, quand elle est indiquée.
const S = {
  // Cycle et hormones
  ameliRegles: { label: 'ameli.fr — Informations et conseils sur les règles ou menstruations', url: 'https://www.ameli.fr/assure/sante/themes/puberte/informations-conseils-regles', consulted_on: C, published: '2026-09-29' },
  qsCycle: { label: 'QuestionSexualité (Santé publique France) — Le cycle menstruel', url: 'https://www.questionsexualite.fr/comprendre-la-conception-et-la-grossesse/la-sexualite-reproductive/le-cycle-menstruel', consulted_on: C },
  santeFecondation: { label: 'Santé.fr — La fécondation : comment ça marche ?', url: 'https://www.sante.fr/ma-fertilite/la-fecondation-comment-ca-marche', consulted_on: C, published: '2025-07-04' },
  ameliAmenorrhee: { label: 'ameli.fr — Qu’est-ce qu’une aménorrhée et quand faut-il s’inquiéter de l’absence de règles ?', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/amenorrhee-regles-retard-absence', consulted_on: C },
  ameliAmenorrheeCauses: { label: 'ameli.fr — Aménorrhée secondaire, arrêt des règles de plus de 3 mois : quelles causes ?', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/amenorrhee-regles-retard-absence-0', consulted_on: C },
  ameliAmenorrheeConsult: { label: 'ameli.fr — Consultation et bilan médical en cas d’absence de règles', url: 'https://www.ameli.fr/assure/sante/themes/retard-absence-de-regles-ou-amenorrhee/absence-de-regles-consultation', consulted_on: C, published: '2026-03-30' },
  // Examens de fertilité
  ameliBilan: { label: 'ameli.fr — Bilan médical de l’infertilité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/sterilite-pma-infertilite/bilan-medical-infertilite-sterilite', consulted_on: C, published: '2025-12-08' },
  santeExamens: { label: 'Santé.fr (Agence de la biomédecine) — Choisir la solution la mieux adaptée à chacun : les examens d’infertilité', url: 'https://www.sante.fr/ma-fertilite/choisir-la-solution-la-mieux-adaptee-chacun-les-examens-dinfertilite', consulted_on: C, published: '2025-07-01' },
  abmExamensHomme: { label: 'Agence de la biomédecine (procreation-medicale.fr) — L’exploration de l’infertilité masculine', url: 'https://www.procreation-medicale.fr/examens-homme/', consulted_on: C, published: '2025-12-05' },
  santeCauses: { label: 'Santé.fr (Agence de la biomédecine) — Comprendre les différentes causes de l’infertilité', url: 'https://www.sante.fr/comprendre-les-differentes-causes-de-linfertilite', consulted_on: C, published: '2024-06-27' },
  // Travail et environnement
  inrsReproduction: { label: 'INRS — Reproduction : ce qu’il faut retenir', url: 'https://www.inrs.fr/risques/reproduction/ce-qu-il-faut-retenir.html', consulted_on: C, published: '2017-08-02' },
  inrsFemmesEnceintes: { label: 'INRS — Femmes enceintes : ce qu’il faut retenir', url: 'https://www.inrs.fr/demarche/femmes-enceintes/ce-qu-il-faut-retenir.html', consulted_on: C, published: '2018-10-22' },
  inrsProduits: { label: 'INRS — Produits chimiques : protégez votre grossesse (dépliant ED 6261)', url: 'https://www.inrs.fr/dam/inrs/CataloguePapier/ED/TI-ED-6261.pdf', consulted_on: C, published: '2025-07' },
  inrsFocus: { label: 'INRS — Femmes enceintes au travail : quelle réglementation applicable ?', url: 'https://www.inrs.fr/publications/juridique/focus-juridiques/focus-femmes-enceintes.html', consulted_on: C, published: '2018-09-14' },
  // Contraception
  qsPilule: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que la pilule contraceptive ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/la-pilule-comment-ca-marche', consulted_on: C },
  ameliHormonale: { label: 'ameli.fr — Contraception hormonale : pilule, patch, anneau vaginal, implant, injection intramusculaire', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-contraception-hormonale', consulted_on: C, published: '2026-09-10' },
  santeGenerations: { label: 'Santé.fr — Pilules de 3e et 4e générations (contraceptifs oraux combinés)', url: 'https://www.sante.fr/pilules-de-3e-et-4e-generations-contraceptifs-oraux-combines', consulted_on: C, published: '2024-08-02' },
  santeReglesContraception: { label: 'Santé.fr — L’impact de la contraception sur les règles', url: 'https://www.sante.fr/limpact-de-la-contraception-sur-les-regles', consulted_on: C, published: '2024-02-23' },
  qsPatch: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que le patch contraceptif ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/le-patch-contraceptif-comment-ca-marche', consulted_on: C },
  qsAnneau: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que l’anneau vaginal ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/l-anneau-vaginal-comment-ca-marche', consulted_on: C },
  qsImplant: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que l’implant contraceptif ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/l-implant-comment-ca-marche', consulted_on: C },
  santeDiu: { label: 'Santé.fr (Fil santé jeunes) — Les D.I.U. ou stérilets', url: 'https://sante.fr/les-diu-ou-sterilets', consulted_on: C, published: '2016-11-22' },
  ameliCu: { label: 'ameli.fr — Quelles méthodes de contraception d’urgence ?', url: 'https://www.ameli.fr/assure/sante/themes/contraception-urgence/comprendre-contraception-urgence', consulted_on: C, published: '2025-12-15' },
  qsTableau: { label: 'QuestionSexualité (Santé publique France) — Tous les moyens de contraception dans un tableau comparatif', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/tableau-comparatif-pour-vous-guider-dans-votre-choix-de-contraception', consulted_on: C },
  qsPresExt: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que le préservatif externe ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/le-preservatif-externe-ou-masculin-comment-ca-marche', consulted_on: C },
  qsPresInt: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que le préservatif interne ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/le-preservatif-interne-ou-feminin-comment-ca-marche', consulted_on: C },
  qsDiaphragme: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que le diaphragme contraceptif ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/le-diaphragme-comment-ca-marche', consulted_on: C },
  qsCape: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que la cape cervicale ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/la-cape-cervicale-comment-ca-marche', consulted_on: C },
  qsSpermicides: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que les spermicides ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/les-spermicides-comment-ca-marche', consulted_on: C },
  ameliSterilisation: { label: 'ameli.fr — Stérilisation à visée contraceptive chez l’homme et chez la femme', url: 'https://www.ameli.fr/assure/sante/themes/contraception/sterilisation-contraceptive-homme-femme', consulted_on: C },
  qsMasculine: { label: 'QuestionSexualité (Santé publique France) — La contraception masculine', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/contraception-masculine-comment-ca-marche', consulted_on: C },
  // Arrêter une contraception
  qsChanger: { label: 'QuestionSexualité (Santé publique France) — Contraception : comment en changer ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/comment-changer-de-contraception', consulted_on: C },
  santePeurSterile: { label: 'Santé.fr (Fil santé jeunes) — J’ai peur d’être stérile', url: 'https://www.sante.fr/ma-fertilite/jai-peur-detre-sterile', consulted_on: C, published: '2022-07-27' },
  ameliPreconception: { label: 'ameli.fr — Consulter avant d’être enceinte : la consultation préconceptionnelle', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/avant-d-etre-enceinte-la-consultation-preconceptionnelle', consulted_on: C },
  ameliVaccinsProjet: { label: 'ameli.fr — Projet de grossesse : vaccinations et médicaments', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/projet-de-grossesse-vaccinations-et-medicaments', consulted_on: C, published: '2024-11-26' },
  // Après une fausse couche
  ameliFC: { label: 'ameli.fr — Fausse couche', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/fausse-couche', consulted_on: C },
  ameliArretFC: { label: 'ameli.fr — Fausse couche et interruption médicale de grossesse : arrêt de travail sans délai de carence', url: 'https://www.ameli.fr/assure/remboursements/indemnites-journalieres-maladie-maternite-paternite/arret-sans-carence-fausse-couche-interruption-medicale', consulted_on: C },
  santeEmotions: { label: 'Santé.fr (1000 premiers jours) — Les émotions pendant la grossesse', url: 'https://www.sante.fr/les-emotions-pendant-la-grossesse', consulted_on: C, published: '2025-10-03' },
  ameliPsyGrossesse: { label: 'ameli.fr — Grossesse : bouleversement émotionnel, anxiété et dépression', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-sante-psychique/troubles-psychiques-grossesse', consulted_on: C },
} satisfies Record<string, ArticleSource>;

const T: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['ttc'], status: 'to_review' };
const A: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['avoid'], status: 'to_review' };
const AT: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['avoid', 'ttc'], status: 'to_review' };
const TP: Pick<LibArticle, 'journeys' | 'status'> = { journeys: ['ttc', 'pregnant'], status: 'to_review' };

const FIN = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel de santé (médecin, sage-femme, pharmacien).';

export const GUIDE_B22: LibArticle[] = [
  {
    ...T, slug: 'cycle-menstruel-hormones-phase-par-phase', category: 'cycle',
    title: 'Le cycle menstruel phase par phase : FSH, LH, œstrogènes et progestérone expliqués',
    summary: 'Ce que font les hormones à chaque étape du cycle, de la croissance du follicule à l’ovulation puis aux règles, pour mieux comprendre son corps quand on souhaite un enfant.',
    tags: ['cycle menstruel', 'hormones', 'FSH', 'LH', 'œstrogènes', 'progestérone', 'ovulation', 'phase lutéale', 'phase folliculaire', 'corps jaune', 'glaire cervicale'],
    sources: [S.ameliRegles, S.qsCycle, S.santeFecondation],
    body_md: `## En bref
- Le cycle commence le premier jour des règles et se termine la veille des règles suivantes. Il dure en moyenne 28 jours, avec des variations habituelles de 23 à 35 jours.
- Le cerveau, par l’hypophyse, envoie deux hormones (FSH et LH) qui pilotent les ovaires. Les ovaires répondent en produisant des œstrogènes puis de la progestérone.
- Ce qui varie le plus d’une personne à l’autre, c’est la première partie du cycle. La seconde partie, après l’ovulation, est plus stable : 12 à 16 jours.
- L’ovule reste fécondable environ 24 heures, alors que les spermatozoïdes peuvent survivre jusqu’à cinq jours dans l’appareil génital féminin.

## Comprendre
**Un dialogue entre le cerveau et les ovaires.** L’hypophyse, une petite glande située à la base du cerveau, sécrète l’hormone folliculo-stimulante (**FSH**) et l’hormone lutéinisante (**LH**). Ces deux hormones agissent sur les ovaires, qui produisent à leur tour des hormones sexuelles. Celles-ci renvoient à leur tour un signal au cerveau.

**La phase folliculaire.** Elle commence avec les règles. Sous l’effet de la FSH, des follicules (petites poches qui contiennent chacune un ovocyte) se développent dans l’ovaire. Le plus souvent, un seul arrive à maturité. Les follicules sécrètent des **œstrogènes**, qui épaississent la muqueuse de l’utérus (l’endomètre) et modifient la glaire cervicale. À l’approche de l’ovulation, la glaire devient plus liquide et filante, ce qui facilite le passage des spermatozoïdes.

**L’ovulation.** Un pic de LH, déclenché par la hausse des œstrogènes, provoque la rupture du follicule. L’ovule est libéré et rejoint la trompe, puis chemine vers l’utérus. Dans un cycle de 28 jours, cela se produit en moyenne vers le 14e jour, mais ce repère varie selon la durée de vos cycles.

**La phase lutéale.** Le follicule vidé se transforme en **corps jaune**, qui produit de la **progestérone**. Cette hormone prépare la muqueuse utérine à une éventuelle nidation de l’embryon.

**Les règles.** S’il n’y a pas eu de fécondation, le corps jaune régresse, la progestérone chute, et la couche superficielle de la muqueuse se détache : ce sont les règles, qui durent en général 3 à 6 jours et sont souvent plus abondantes les trois premiers jours. Un nouveau cycle commence.

## Au quotidien
- **Notez vos dates de règles** sur un carnet ou une application : premier jour, durée, abondance. Après quelques mois, vous connaîtrez la durée habituelle de vos cycles.
- **Repérez la durée de la seconde phase.** Comme elle varie peu, c’est surtout la longueur de la première phase qui explique qu’un cycle soit plus long ou plus court. Une ovulation « vers le 14e jour » ne vaut donc que pour un cycle d’environ 28 jours.
- **Observez votre glaire si cela vous intéresse.** Une glaire plus fluide et filante accompagne la période proche de l’ovulation. Ce n’est pas un test précis, mais un repère sur votre propre corps.
- **Le stress compte aussi.** Lors d’un stress physique ou émotionnel important, le corps sécrète du cortisol, qui peut, à forte dose, suspendre temporairement le cycle. Les règles peuvent alors disparaître quelque temps.
- **Les signes prémenstruels** (seins tendus, ballonnements, nervosité, humeur changeante) surviennent dans les jours qui précèdent les règles et disparaissent avec elles. S’ils sont importants, parlez-en à un médecin : des solutions existent.

## Questions fréquentes
**Mon cycle dure 32 jours : est-ce un problème pour concevoir ?**
Un cycle de 23 à 35 jours fait partie des variations habituelles décrites par l’Assurance Maladie. Ce qui compte surtout, c’est sa régularité d’un mois à l’autre. Avec un cycle long, l’ovulation survient simplement plus tard qu’au 14e jour.

**Combien de temps l’ovule et les spermatozoïdes restent-ils fécondants ?**
L’ovule peut être fécondé pendant environ 24 heures après l’ovulation. Les spermatozoïdes peuvent survivre jusqu’à cinq jours dans l’appareil génital féminin. C’est pourquoi des rapports dans les jours qui précèdent l’ovulation peuvent aboutir à une grossesse.

**Les hormones peuvent-elles être mesurées ?**
Oui, par une prise de sang, mais elle n’est pas utile en routine quand tout se passe bien. Elle fait partie du bilan proposé par un médecin en cas de difficulté à concevoir ou de troubles du cycle, à des jours du cycle qu’il vous indiquera.

## Quand demander conseil
Consultez un médecin ou une sage-femme si vos règles sont absentes depuis plus de trois mois, très abondantes ou très longues, si vos douleurs sont intenses ou reviennent à chaque cycle, ou si les signes prémenstruels vous gênent beaucoup. En cas de saignement très abondant avec malaise, appelez le **15** ou le **112**. Si l’attente d’une grossesse pèse sur votre moral au point de vous sentir à bout, vous pouvez appeler le **3114**, à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'cycles-irreguliers-ou-absents-projet-bebe', category: 'cycle',
    title: 'Cycles irréguliers, très longs ou règles absentes quand on veut un enfant',
    summary: 'Pourquoi les règles peuvent s’espacer ou disparaître, quelles causes un médecin recherche, et comment se déroule le bilan quand on a un projet de grossesse.',
    tags: ['cycles irréguliers', 'aménorrhée', 'absence de règles', 'retard de règles', 'SOPK', 'prolactine', 'stress', 'sport intensif', 'post-pilule', 'projet bébé'],
    sources: [S.ameliAmenorrhee, S.ameliAmenorrheeCauses, S.ameliAmenorrheeConsult],
    body_md: `## En bref
- Un cycle régulier dure en moyenne 28 jours, entre 26 et 31 jours selon la page de l’Assurance Maladie consacrée à l’aménorrhée.
- On parle d’**aménorrhée secondaire** quand les règles sont absentes depuis plus de trois mois chez une femme jusque-là réglée : une cause doit alors être recherchée.
- Les causes sont variées : grossesse, allaitement, stress important, sport intense avec apports insuffisants, arrêt de pilule, syndrome des ovaires polykystiques (SOPK), excès de prolactine, entre autres.
- Le bilan commence par un échange et un examen, puis, si besoin, une prise de sang hormonale et une échographie.

## Comprendre
Quand on souhaite un enfant, des cycles imprévisibles compliquent le repérage de la période fertile et peuvent inquiéter. Des règles espacées ou absentes signifient souvent que l’ovulation ne se produit pas ou se produit irrégulièrement. Cela ne veut pas dire qu’une grossesse est impossible : beaucoup de causes sont temporaires ou se traitent.

**Les situations à écarter d’abord.** La grossesse est la première cause d’absence de règles. Un test urinaire en pharmacie est fiable à environ 95 % ; en cas de doute, même après un test négatif, consultez. L’allaitement bloque aussi souvent l’ovulation.

**Les causes « fonctionnelles », souvent réversibles.** Un événement traumatisant, un sport très intense lorsque les apports énergétiques ne couvrent pas la dépense, une restriction alimentaire ou une perte de poids importante peuvent mettre le cycle en pause. Les règles reviennent en général quand la situation s’améliore. Après l’arrêt d’une pilule, la reprise peut être lente : quelques semaines d’absence de règles peuvent se voir, mais au-delà de trois mois une cause doit être recherchée.

**Les causes hormonales.** Le **SOPK** concerne 5 à 10 % des femmes en âge de procréer ; il associe souvent des cycles de plus de 35 à 40 jours, parfois une absence de règles, et des signes d’excès d’androgènes (pilosité, acné, peau grasse). Un **excès de prolactine** (hormone de la lactation) bloque l’ovulation ; il peut être lié à une petite tumeur bénigne de l’hypophyse ou à certains médicaments. L’**insuffisance ovarienne prématurée** correspond à un épuisement des ovocytes avant 40 ans.

**Les causes liées à l’utérus.** Plus rares, des accolements des parois de l’utérus (synéchies) peuvent survenir après certains gestes sur l’utérus.

## Au quotidien
- **Tenez un relevé** des dates de règles sur plusieurs mois : c’est la première information demandée.
- **Préparez la consultation** : âge des premières règles, dates des dernières règles, contraception utilisée et date d’arrêt, grossesses, fausses couches ou interventions sur l’utérus, sport pratiqué, changements de poids, traitements en cours, antécédents familiaux (âge des règles de votre mère et de vos sœurs).
- **Signalez les signes associés** : bouffées de chaleur, pilosité ou acné inhabituelles, écoulement par les mamelons en dehors de l’allaitement, maux de tête.
- **N’essayez pas de « régulariser » seule** avec une pilule : l’Assurance Maladie rappelle qu’une pilule provoque des saignements artificiels qui peuvent rassurer à tort. Le diagnostic doit être posé avant.

## Questions fréquentes
**Que va faire le médecin ?**
Il vous interroge, vous examine (poids, taille, signes d’excès d’androgènes) et, avec votre accord, peut réaliser un examen gynécologique. Il peut prescrire un dosage de bêta-hCG si une grossesse est possible, puis des dosages hormonaux (estradiol, progestérone, LH, FSH, prolactine, parfois testostérone) et une échographie pelvienne.

**Le sport peut-il vraiment arrêter les règles ?**
Oui, surtout dans les sports d’endurance, les sports esthétiques ou à catégories de poids, quand les apports, notamment en graisses, sont insuffisants. Augmenter les apports suffit souvent à retrouver des cycles.

**J’ai un SOPK : vais-je pouvoir être enceinte ?**
Le SOPK est une cause fréquente de troubles de l’ovulation, et un accompagnement adapté existe. Parlez-en à votre médecin pour construire un suivi personnalisé.

## Quand demander conseil
Consultez si vos règles sont absentes depuis plus de trois mois, si vos cycles sont devenus très irréguliers alors qu’ils étaient réguliers, ou si votre test de grossesse est positif. Appelez le **15** ou le **112** en cas de douleur intense dans le bas-ventre, de saignement abondant ou de malaise, surtout si une grossesse est possible. Si votre rapport à l’alimentation ou au poids vous fait souffrir, ou si vous vous sentez dépassée, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'bilan-hormonal-feminin-fertilite-explique', category: 'difficultes-conception',
    title: 'Bilan hormonal de fertilité chez la femme : TSH, estradiol, LH, FSH, AMH, prolactine expliqués',
    summary: 'À quoi sert chaque dosage de la prise de sang d’un bilan de fertilité, ce qu’il cherche et comment s’y préparer.',
    tags: ['bilan hormonal', 'prise de sang', 'AMH', 'FSH', 'LH', 'estradiol', 'TSH', 'prolactine', 'réserve ovarienne', 'infertilité', 'sérologies'],
    sources: [S.ameliBilan, S.ameliAmenorrheeConsult, S.santeCauses],
    body_md: `## En bref
- La prise de sang fait partie des premiers examens du bilan de fertilité. Le médecin vous indique le jour du cycle où la faire.
- Elle explore la thyroïde (**TSH**), le fonctionnement des ovaires et de l’hypophyse (**estradiol, progestérone, LH, FSH**) et, selon les cas, la **prolactine** et les **androgènes**.
- L’**AMH** (hormone anti-müllérienne) est un marqueur de la réserve ovarienne. Elle est demandée quand une baisse de cette réserve est suspectée ou qu’une assistance médicale à la procréation est envisagée.
- Le même bilan comprend des **sérologies** : recherche d’infections et vérification de l’immunité.

## Comprendre
Le cycle dépend d’un dialogue entre le cerveau (hypothalamus et hypophyse) et les ovaires. Un déséquilibre à n’importe quel niveau peut perturber l’ovulation. La prise de sang permet de repérer où se situe un éventuel problème. Chaque résultat s’interprète avec le reste du bilan, le moment du cycle et votre histoire : un chiffre isolé ne permet pas de conclure.

**Ce que cherche chaque dosage, d’après l’Assurance Maladie :**
- **TSH** : elle reflète le fonctionnement de la thyroïde, qui influence le cycle.
- **Estradiol, progestérone, LH, FSH** : ils renseignent sur le fonctionnement des ovaires et de l’hypophyse, qui commande les ovaires.
- **AMH** : c’est un marqueur de la réserve ovarienne, c’est-à-dire du stock de follicules disponibles dans les ovaires.
- **Prolactine** : demandée en cas de suspicion d’anomalie de l’hypophyse. Un excès de prolactine peut empêcher l’ovulation.
- **Androgènes** (dont la testostérone) : demandés en cas de suspicion de syndrome des ovaires polykystiques (SOPK), notamment en présence de pilosité excessive, d’acné ou de peau grasse.
- **Sérologies** : VIH, hépatites B et C, syphilis, rubéole, toxoplasmose, varicelle, chlamydia notamment.

L’Agence de la biomédecine rappelle que les troubles hormonaux du cycle représentent environ 20 % des causes féminines d’infertilité, le SOPK étant le plus fréquent. Elle cite aussi l’excès de prolactine et l’insuffisance ovarienne prématurée.

## Au quotidien
- **Respectez le jour indiqué.** Certains dosages n’ont de sens qu’à un moment précis du cycle. Notez bien le premier jour de vos règles et comptez à partir de là.
- **Demandez s’il faut être à jeun.** Les consignes dépendent des examens prescrits ; le laboratoire ou le médecin vous le précisera.
- **Apportez la liste de vos traitements**, y compris une contraception hormonale en cours ou récemment arrêtée et les compléments alimentaires : certains peuvent modifier les résultats.
- **Gardez vos anciens résultats.** Si certains examens ont déjà été faits, la plupart n’ont normalement pas à être refaits.
- **Faites le point en consultation.** Les résultats arrivent souvent avant le rendez-vous : essayez de ne pas les interpréter seule à partir des valeurs de référence, qui ne tiennent pas compte de votre situation.

## Questions fréquentes
**Une AMH basse veut-elle dire que je ne pourrai pas être enceinte ?**
L’AMH renseigne sur la réserve de follicules, pas sur la qualité des ovocytes ni sur vos chances à elle seule. Son interprétation se fait avec votre âge, l’échographie et le reste du bilan, par le médecin qui vous suit.

**Pourquoi vérifier la rubéole ou la toxoplasmose ?**
Ces infections peuvent être dangereuses pendant une grossesse. Savoir si vous êtes immunisée permet de vous vacciner avant la grossesse si besoin (rubéole) ou d’adapter les précautions (toxoplasmose).

**Mon conjoint doit-il aussi faire une prise de sang ?**
Oui, le bilan concerne le couple. Chez l’homme, des sérologies sont demandées et, si le spermogramme montre une anomalie, un bilan hormonal (testostérone, FSH) peut être ajouté.

**Pourquoi l’âge compte-t-il dans l’interprétation ?**
La réserve d’ovocytes est fixée à la naissance et diminue avec le temps, nettement à partir de 38 ans selon l’Agence de la biomédecine.

## Quand demander conseil
Consultez si vous essayez de concevoir depuis un an sans succès, ou plus tôt si vos cycles sont très irréguliers ou absents, ou si vous avez des antécédents gynécologiques (chirurgie pelvienne, endométriose, infection génitale) ou plus de 35 ans : parlez-en à votre médecin, qui jugera s’il faut démarrer le bilan. Si l’attente des résultats ou du diagnostic devient trop lourde, parlez-en à votre médecin ; en cas de détresse, le **3114** répond jour et nuit. En cas d’urgence, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...T, slug: 'echographie-hysterographie-hysteroscopie-fertilite', category: 'difficultes-conception',
    title: 'Échographie pelvienne, hystérosalpingographie, hystéroscopie : les examens de l’utérus et des trompes',
    summary: 'Comment se déroulent les examens d’imagerie du bilan de fertilité, ce qu’ils recherchent et pourquoi l’état des trompes oriente la suite du parcours.',
    tags: ['échographie pelvienne', 'échographie endovaginale', 'hystérosalpingographie', 'hystérographie', 'hystéroscopie', 'cœlioscopie', 'trompes bouchées', 'fibrome', 'polype', 'endométriose', 'bilan infertilité'],
    sources: [S.ameliBilan, S.santeExamens],
    body_md: `## En bref
- L’**échographie pelvienne**, le plus souvent par voie vaginale et vessie vide, visualise les ovaires et l’utérus. L’Agence de la biomédecine la décrit comme un examen indolore.
- L’**hystérosalpingographie** (ou hystérographie) montre la cavité de l’utérus et vérifie si les trompes sont perméables. Elle se fait en première partie de cycle, après les règles.
- L’**hystéroscopie** observe directement l’intérieur de l’utérus avec une fibre optique.
- La **cœlioscopie**, l’**IRM** ou l’**hystérosonographie** sont des examens de second temps, demandés seulement si besoin.

## Comprendre
Pour qu’une grossesse débute, l’ovule doit pouvoir rencontrer les spermatozoïdes dans la trompe, puis l’embryon doit s’implanter dans un utérus accueillant. Les examens d’imagerie vérifient ces étapes « mécaniques ». Le médecin commence par les plus simples et les moins invasifs, puis propose des examens plus poussés si nécessaire.

**L’échographie pelvienne** évalue la réserve ovarienne (en comptant les petits follicules) et recherche une cause ovarienne ou utérine : kystes, aspect d’ovaires polykystiques, fibromes, polypes, malformation de l’utérus, signes d’endométriose.

**L’hystérosalpingographie** consiste à injecter un produit dans l’utérus puis à prendre des clichés radiologiques. Elle recherche une anomalie de la cavité (fibrome, polype, utérus cloisonné) et une **obstruction des trompes**, qui empêche l’ovule de rejoindre l’utérus. L’Agence de la biomédecine souligne que l’état des trompes oriente le choix entre insémination et fécondation in vitro si une assistance médicale à la procréation est envisagée.

**L’hystéroscopie** peut remplacer ou compléter l’hystérographie : une fibre optique est introduite dans la cavité utérine pour en voir directement les parois.

**La cœlioscopie** est une intervention qui permet d’examiner les trompes et le bassin (anomalies des trompes, endométriose) et, parfois, de traiter dans le même temps.

## Au quotidien
- **Notez le premier jour de vos règles** : l’hystérosalpingographie se programme dans la première partie du cycle, après les règles, et le cabinet vous demandera cette date.
- **Signalez tout risque de grossesse**, vos allergies connues et vos traitements en cours, au moment de la prise de rendez-vous.
- **Posez vos questions avant l’examen** : déroulement, durée, possibilité d’être accompagnée, conduite à tenir après. N’hésitez pas à dire si un examen gynécologique vous est difficile ; l’équipe peut adapter son approche.
- **Prévoyez un moment calme** après les examens invasifs et demandez quels signes doivent vous faire rappeler.
- **Rassemblez les comptes rendus** dans un même dossier : ils seront utiles à chaque étape et évitent de refaire des examens.

## Questions fréquentes
**L’échographie par voie vaginale est-elle obligatoire ?**
C’est la voie habituelle, car elle donne une image plus précise des ovaires et de l’utérus. Si elle vous pose problème, dites-le : le professionnel vous expliquera les alternatives possibles dans votre situation.

**Que se passe-t-il si une trompe est bouchée ?**
Le médecin en discute avec vous. Selon l’atteinte, des examens complémentaires ou une technique d’assistance médicale à la procréation adaptée peuvent être proposés : l’état des trompes fait partie des éléments qui orientent vers l’insémination ou vers la fécondation in vitro.

**Pourquoi refaire une échographie si j’en ai déjà eu une ?**
L’échographie du bilan de fertilité cherche des éléments précis (nombre de follicules, aspect de la cavité). Apportez vos anciens comptes rendus : la plupart des examens déjà faits n’ont normalement pas à être refaits.

## Quand demander conseil
Après un examen de l’utérus ou des trompes, contactez rapidement le cabinet ou votre médecin en cas de fièvre, de douleurs du bas-ventre qui augmentent ou de pertes inhabituelles. Appelez le **15** ou le **112** en cas de douleur abdominale intense, de saignement abondant ou de malaise. Si le parcours de fertilité vous épuise moralement, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'courbe-temperature-serologies-caryotype-bilan-fertilite', category: 'difficultes-conception',
    title: 'Courbe de température, sérologies, caryotype, test post-coïtal : les autres examens du bilan de fertilité',
    summary: 'Les examens moins connus du bilan d’infertilité, à quoi ils servent et dans quels cas ils sont proposés.',
    tags: ['courbe de température', 'sérologies', 'caryotype', 'test de Hühner', 'test post-coïtal', 'biopsie endomètre', 'IRM pelvienne', 'bilan infertilité', 'couple'],
    sources: [S.ameliBilan, S.santeExamens],
    body_md: `## En bref
- La **courbe de température** aide à évaluer la durée, la régularité des cycles et l’ovulation, et sert à fixer les dates des autres examens. Elle se fait sur trois mois au maximum.
- Les **sérologies** concernent les deux membres du couple : elles recherchent des infections et vérifient certaines immunités.
- Le **caryotype** recherche une anomalie des chromosomes, chez la femme comme chez l’homme, lorsque le médecin le juge utile.
- Le **test post-coïtal** (test de Hühner) n’est pas recommandé dans le bilan initial.

## Comprendre
Le bilan de fertilité suit une logique progressive : examens simples d’abord, plus spécialisés ensuite. À côté de la prise de sang hormonale, de l’échographie et du spermogramme, plusieurs examens peuvent compléter le tableau.

**La courbe de température.** Chaque matin, avant de vous lever, vous prenez votre température avec un thermomètre médical et la reportez sur une courbe, à partir du premier jour des règles. Selon l’Assurance Maladie, cet examen permet d’évaluer la durée et la régularité des cycles ainsi que la qualité de l’ovulation, et de programmer les autres examens.

**Les sérologies.** Chez la femme, elles recherchent notamment le VIH, les hépatites B et C, la syphilis, la rubéole, la toxoplasmose, la varicelle et les chlamydiae. Chez l’homme, le VIH, les hépatites B et C et la syphilis. Ils permettent de traiter une infection si besoin et de préparer la future grossesse, par exemple en vaccinant contre la rubéole une femme non immunisée.

**Le caryotype.** Cette prise de sang étudie les chromosomes. Il est demandé pour rechercher une anomalie chromosomique pouvant expliquer l’infertilité ; chez l’homme, il fait partie des examens proposés si le premier bilan, notamment le spermogramme, montre une anomalie.

**La biopsie de l’endomètre.** Un petit fragment de la muqueuse de l’utérus est prélevé, dans la seconde partie du cycle. Elle n’est pas systématique.

**L’IRM pelvienne.** Elle complète l’échographie si besoin, par exemple pour préciser une endométriose ou une malformation.

**Le test de Hühner.** Un prélèvement de glaire cervicale est réalisé 6 à 12 heures après un rapport, pour observer la glaire et la mobilité des spermatozoïdes. Très spécialisé, il n’est plus recommandé d’emblée et peut être proposé dans un second temps.

## Au quotidien
- **Pour la courbe** : prenez la température à la même heure, au réveil, avant de poser le pied par terre, avec le même thermomètre et par la même voie. Notez aussi les jours de règles, les rapports, une nuit écourtée ou une fièvre, qui peuvent fausser un point.
- **Ne transformez pas la courbe en contrainte.** Elle sert au médecin pour une durée limitée ; si elle devient une source d’angoisse, dites-le, d’autres moyens d’évaluer l’ovulation existent.
- **Gardez une copie de vos sérologies** et de votre carnet de vaccination : ils seront redemandés.
- **Demandez pourquoi un examen est proposé** et ce qu’il changera dans la suite du parcours. Vous avez le droit de prendre le temps de réfléchir.

## Questions fréquentes
**La courbe de température suffit-elle à savoir quand j’ovule ?**
Elle donne une indication après coup sur le cycle écoulé ; elle ne prévoit pas l’ovulation à venir. C’est un outil d’évaluation pour le médecin, sur une période limitée.

**Pourquoi faire un caryotype si nous sommes en bonne santé ?**
Certaines anomalies des chromosomes n’entraînent aucun symptôme mais peuvent gêner la conception ou favoriser des fausses couches. Le médecin le propose quand votre situation le justifie.

**Le test post-coïtal est-il encore pratiqué ?**
Il existe toujours, mais il n’est pas recommandé dans le bilan initial. Il peut être demandé dans un second temps, selon les résultats des autres examens.

## Quand demander conseil
Si vous essayez de concevoir depuis un an sans succès (plus tôt après 35 ans ou en cas de cycles irréguliers), demandez un bilan à votre médecin ou à votre sage-femme. En cas de fièvre, de douleurs inhabituelles ou de saignements après un examen, contactez le professionnel qui l’a réalisé ; en cas de malaise ou de douleur intense, appelez le **15** ou le **112**. Si l’attente vous pèse lourdement, le **3114** est joignable à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'spermogramme-se-preparer-deroulement', category: 'difficultes-conception',
    title: 'Le spermogramme pas à pas : se préparer, le recueil au laboratoire, les délais',
    summary: 'Pourquoi le spermogramme est demandé dès le début d’un bilan de fertilité, comment s’y préparer et comment se passe le recueil.',
    tags: ['spermogramme', 'fertilité masculine', 'recueil de sperme', 'abstinence', 'laboratoire', 'spermoculture', 'test de migration survie', 'bilan infertilité', 'futur père'],
    sources: [S.ameliBilan, S.santeExamens, S.abmExamensHomme],
    body_md: `## En bref
- Le spermogramme est un examen **indispensable** du bilan de fertilité : il permet d’identifier la plupart des infertilités masculines. Il est généralement prescrit dès le début du bilan.
- Il se fait après **quelques jours sans éjaculation** : deux à cinq jours selon l’Agence de la biomédecine, trois à cinq jours selon l’Assurance Maladie. Le laboratoire vous précisera sa consigne.
- Le recueil se fait par masturbation, **au laboratoire**, pour éviter que les spermatozoïdes ne s’altèrent pendant le transport.
- Il doit être réalisé **à distance d’une fièvre** ou de certains médicaments. En cas d’anomalie, il est refait pour confirmer.

## Comprendre
L’infertilité concerne le couple, et une cause masculine, seule ou associée, est fréquente. L’Agence de la biomédecine rappelle d’ailleurs que l’infertilité masculine n’a rien à voir avec l’impuissance sexuelle : on peut avoir des érections et des éjaculations tout à fait habituelles et un spermogramme perturbé.

L’examen étudie au microscope le **nombre** de spermatozoïdes, leur **mobilité** et leur **aspect** (anomalies de la tête ou du flagelle). Des spermatozoïdes trop peu nombreux, peu mobiles ou trop souvent atypiques peuvent avoir du mal à atteindre l’ovocyte.

Le nombre de spermatozoïdes varie beaucoup d’un examen à l’autre. C’est pourquoi un résultat anormal n’est jamais interprété seul : un second spermogramme est demandé, deux à trois mois plus tard. Un épisode de fièvre ou certains médicaments peuvent perturber la fabrication des spermatozoïdes et fausser le résultat.

D’autres examens peuvent accompagner le spermogramme : la **spermoculture**, qui recherche une infection du sperme, et le **test de migration-survie**, qui mesure la proportion de spermatozoïdes encore mobiles après 24 heures et complète systématiquement le spermogramme avant une assistance médicale à la procréation. Un **examen clinique andrologique** est souvent proposé en premier.

## Au quotidien
- **Renseignez-vous auprès du laboratoire** : tous ne réalisent pas cet examen, et il se fait souvent sur rendez-vous.
- **Respectez le délai d’abstinence demandé**, ni trop court ni trop long, pour que les résultats successifs soient comparables.
- **Décalez l’examen** si vous avez eu de la fièvre récemment ou si vous prenez un nouveau traitement : signalez-le au laboratoire, qui vous dira s’il faut reporter.
- **Suivez les consignes d’hygiène et de recueil** données sur place. Si une partie du recueil a été perdue, signalez-le au laboratoire : il en tiendra compte.
- **Vivez-le simplement.** Ce moment peut être gênant ou stressant ; c’est un examen médical courant, réalisé chaque jour dans les laboratoires spécialisés.
- **Prenez vos résultats avec le médecin** qui a prescrit l’examen, plutôt que de les comparer seul à des normes trouvées en ligne.

## Questions fréquentes
**Peut-on faire le recueil à la maison ?**
Le recueil au laboratoire est privilégié pour éviter l’altération des spermatozoïdes pendant le transport. Si cela vous paraît impossible, parlez-en au laboratoire avant le rendez-vous.

**Combien de temps pour avoir les résultats ?**
Cela dépend du laboratoire et des examens associés (la spermoculture demande un temps de culture). Le laboratoire vous indiquera le délai.

**Un spermogramme anormal veut-il dire que je suis stérile ?**
Non. Un premier résultat anormal doit être confirmé par un second examen deux à trois mois plus tard. Même confirmée, une anomalie ne signifie pas forcément une impossibilité de concevoir : des examens complémentaires et des solutions existent.

**Faut-il changer quelque chose avant l’examen ?**
Suivez simplement les consignes du laboratoire. Si vous souhaitez améliorer votre santé globale (tabac, alcool, chaleur, exposition professionnelle à certains produits), parlez-en avec votre médecin : ces démarches sont utiles, mais elles ne remplacent pas l’examen.

## Quand demander conseil
Consultez votre médecin si vous ressentez une douleur, une grosseur ou un gonflement au niveau des testicules, ou si vous avez des troubles de l’érection ou de l’éjaculation. Une douleur brutale et intense d’un testicule est une urgence : appelez le **15** ou le **112**. Si le parcours de fertilité affecte votre moral, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'spermogramme-anormal-comprendre-compte-rendu', category: 'difficultes-conception',
    title: 'Spermogramme anormal : comprendre les mots du compte rendu et la suite du bilan',
    summary: 'Azoospermie, oligospermie, asthénospermie, tératospermie : ce que désignent ces termes et quels examens peuvent suivre.',
    tags: ['spermogramme anormal', 'azoospermie', 'oligospermie', 'asthénospermie', 'tératospermie', 'OATS', 'infertilité masculine', 'caryotype', 'échographie testiculaire', 'bilan hormonal homme'],
    sources: [S.abmExamensHomme, S.santeCauses, S.santeExamens],
    body_md: `## En bref
- Un premier résultat anormal doit être **confirmé** par un second spermogramme, deux à trois mois plus tard : le nombre de spermatozoïdes varie beaucoup d’un examen à l’autre.
- Les mots du compte rendu décrivent une anomalie : de nombre (**oligospermie**, **azoospermie**), de mobilité (**asthénospermie**) ou de forme (**tératospermie**). Leur association s’appelle **OATS**.
- Si l’anomalie se confirme, d’autres examens cherchent la cause : bilan hormonal, échographie, caryotype ou tests génétiques, parfois bilan immunologique.
- Certaines causes se traitent, et l’assistance médicale à la procréation propose des techniques adaptées à chaque situation.

## Comprendre
**Le vocabulaire, d’après l’Agence de la biomédecine :**
- **Azoospermie** : absence de spermatozoïdes dans l’éjaculat.
- **Oligospermie** : nombre de spermatozoïdes insuffisant.
- **Asthénospermie** : défaut de mobilité.
- **Tératospermie** : proportion élevée de formes anormales (tête ou flagelle).
- **OATS** (oligo-asthéno-tératospermie) : association des trois.

**D’où peuvent venir ces anomalies ?** Le plus souvent d’un trouble de la fabrication des spermatozoïdes (spermatogenèse), lié à des causes génétiques, à une maladie, à un traumatisme des testicules, à une chimiothérapie ou à des drogues. Il peut aussi s’agir d’un **obstacle** sur les voies génitales : absence de naissance des canaux déférents, séquelles d’infection, de chirurgie ou de traumatisme. Un déséquilibre hormonal (testostérone, hormones de l’hypophyse) peut également réduire la production.

**L’âge et l’environnement comptent.** La concentration et la qualité des spermatozoïdes diminuent à partir de 40 ans, puis plus nettement après 50 ans. L’Agence de la biomédecine cite aussi le tabac, les drogues, une mauvaise alimentation, le surpoids et des polluants (métaux lourds, solvants, pesticides, perturbateurs endocriniens) parmi les facteurs défavorables.

**Les examens complémentaires possibles :**
- **Bilan hormonal** par prise de sang, pour évaluer le fonctionnement des testicules.
- **Échographie de l’appareil génital**, qui visualise testicules, prostate et vésicules séminales.
- **Caryotype et tests génétiques**, à la recherche d’une anomalie chromosomique.
- **Bilan immunologique**, en cas de suspicion d’anticorps dirigés contre les spermatozoïdes.

## Au quotidien
- **Ne tirez pas de conclusion d’un seul examen.** Attendez le contrôle, réalisé dans les mêmes conditions d’abstinence.
- **Notez ce qui a pu perturber le premier résultat** : fièvre, nouveau traitement, recueil incomplet. Signalez-le au médecin.
- **Agissez sur ce qui dépend de vous**, sans culpabilité : arrêt du tabac et des drogues, alimentation équilibrée, activité physique, attention aux expositions professionnelles. Ces mesures sont bénéfiques pour la santé globale, même si elles ne règlent pas toutes les situations.
- **Parlez-en à deux.** Une anomalie du spermogramme peut toucher l’estime de soi. Le projet est celui du couple, et le parcours se construit ensemble.

## Questions fréquentes
**Une azoospermie signifie-t-elle qu’aucune paternité biologique n’est possible ?**
Pas forcément. L’Agence de la biomédecine explique que si l’azoospermie est due à un obstacle (par exemple des épididymes bouchés), une chirurgie peut tenter de désobstruer les voies, ou des spermatozoïdes peuvent être prélevés en amont de l’obstacle.

**Les anomalies peuvent-elles s’améliorer ?**
Un résultat peut être faussé par un épisode de fièvre ou certains médicaments, d’où l’examen de contrôle. Certaines anomalies confirmées sont traitables, par exemple un obstacle sur les voies génitales. Le médecin vous dira ce qui est envisageable dans votre cas.

**Qui consulter ?**
Votre médecin vous orientera vers un spécialiste de la fertilité masculine (andrologue ou urologue) et, si besoin, vers un centre d’assistance médicale à la procréation.

## Quand demander conseil
Consultez si vous remarquez une grosseur, une douleur ou un changement de volume d’un testicule. Une douleur testiculaire brutale et intense nécessite d’appeler le **15** ou le **112**. Si l’annonce d’un résultat vous affecte profondément ou que vous vous sentez au bout du rouleau, parlez-en à un professionnel ; le **3114** répond jour et nuit.

${FIN}`,
  },
  {
    ...T, slug: 'projet-bebe-travail-risques-reproduction', category: 'preparer-grossesse',
    title: 'Projet de bébé et travail : quelles expositions peuvent compter pour la fertilité et la grossesse ?',
    summary: 'Produits chimiques, chaleur, rayonnements, infections, horaires de nuit : ce que dit l’INRS des risques professionnels pour la reproduction, et pourquoi y penser dès le projet.',
    tags: ['travail', 'risques professionnels', 'fertilité', 'reprotoxique', 'CMR', 'rayonnements ionisants', 'travail de nuit', 'port de charges', 'projet de grossesse', 'INRS'],
    sources: [S.inrsReproduction, S.inrsFemmesEnceintes, S.inrsProduits],
    body_md: `## En bref
- Certaines expositions au travail peuvent réduire la fertilité, chez l’homme comme chez la femme, ou présenter un risque pour une future grossesse.
- L’INRS cite les **agents chimiques** (notamment les produits classés toxiques pour la reproduction), les **agents biologiques** (virus, bactéries), les **rayonnements ionisants**, la **chaleur**, mais aussi le **port de charges**, la **station debout prolongée**, le **bruit**, le **stress** et les **horaires de nuit ou irréguliers**.
- Pour certains produits, des précautions sont à prendre **avant même la conception**, y compris pour le futur père.
- Le **médecin du travail** peut être consulté dès le projet de grossesse, dans le respect du secret médical.

## Comprendre
**Pour la fertilité.** Selon l’INRS, c’est le plus souvent l’appareil reproducteur masculin qui est touché, avec une baisse du nombre ou de la qualité des spermatozoïdes. Certains produits chimiques sont en cause, comme le plomb, certains éthers de glycol ou certains phtalates. Les fortes chaleurs affectent aussi la reproduction masculine, et au-delà d’une certaine dose, les rayonnements ionisants peuvent provoquer une stérilité chez l’homme comme chez la femme. Selon la substance, ces effets peuvent être réversibles ou non.

**Pour la grossesse.** Les expositions professionnelles peuvent être associées, selon les agents, à des fausses couches, des retards de croissance, une prématurité, des malformations ou des troubles du développement du système nerveux. Comme certains produits présentent des risques avant même la conception, l’INRS conseille d’agir **dès le projet**, sans attendre la visite médicale périodique.

**Quels métiers ?** L’INRS cite notamment les infirmières, les professionnelles de la petite enfance, les dentistes et assistantes dentaires, les chercheuses, les vétérinaires, les techniciennes de laboratoire, les vendeuses et les employées de maison. Mais des produits à risque se trouvent dans de nombreuses branches : peintures, colles, graisses, encres, solvants, désherbants.

**Et l’employeur ?** Il doit évaluer les risques, informer les salariées des risques de leur poste, y compris pendant la grossesse et l’allaitement, et mettre en place des mesures de prévention. Certains travaux sont interdits aux femmes enceintes ou allaitantes.

## Au quotidien
- **Faites l’inventaire de votre poste**, chacun de votre côté : produits manipulés, tâches physiques, horaires, exposition à des enfants ou à des malades, rayonnements, chaleur.
- **Lisez les étiquettes** des produits que vous utilisez et repérez les mentions de danger pour la fertilité ou le fœtus (voir l’article dédié aux produits chimiques).
- **Demandez une visite au médecin du travail** sans attendre la visite périodique. Il est tenu au secret : il n’informe pas l’employeur de votre projet.
- **Parlez-en aussi à votre médecin ou à votre sage-femme** lors de la consultation préconceptionnelle : ils s’intéressent à la pénibilité de votre travail et aux substances auxquelles vous êtes exposée.
- **Pensez aux activités hors travail** : bricolage, jardinage, rénovation exposent parfois aux mêmes produits.

## Questions fréquentes
**Dois-je annoncer mon projet de grossesse à mon employeur ?**
Non. Vous n’êtes pas obligée de déclarer votre projet ni même votre grossesse. Le médecin du travail peut, avec votre accord et sans dévoiler votre situation médicale, proposer des adaptations de poste.

**Mon conjoint est-il concerné ?**
Oui. L’INRS rappelle que les pères sont aussi concernés et que, pour certains produits, des précautions sont à prendre surtout dans les trois mois qui précèdent la conception.

**Nous n’arrivons pas à concevoir : le travail peut-il jouer ?**
C’est possible. En cas de difficulté à concevoir, le médecin du travail peut rechercher si les conditions de travail de l’un ou l’autre parent y contribuent. Signalez votre métier lors du bilan de fertilité.

**Et après la naissance, si j’allaite ?**
La vigilance continue : l’INRS indique que certains produits chimiques auxquels la mère est exposée peuvent passer dans le lait maternel. Parlez-en au médecin du travail avant votre reprise.

## Quand demander conseil
Prenez rendez-vous avec le médecin du travail dès que vous avez un projet de grossesse et que vous êtes exposé·e à des produits, des rayonnements, des infections, de la chaleur ou à des tâches physiques importantes. En cas d’exposition accidentelle (projection, inhalation, malaise), suivez la procédure de votre entreprise et appelez le **15** ou le **112** si nécessaire. Si la situation au travail vous met en grande détresse, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'produits-chimiques-travail-etiquettes-projet-grossesse', category: 'preparer-grossesse',
    title: 'Produits chimiques au travail : lire les étiquettes et se protéger avant de concevoir',
    summary: 'Les mentions de danger H360, H361 et H362 expliquées, les questions à poser au médecin du travail et les protections prévues par le Code du travail.',
    tags: ['produits chimiques', 'étiquette', 'H360', 'H361', 'H362', 'reprotoxique', 'CMR', 'solvants', 'peinture', 'médecin du travail', 'projet de grossesse'],
    sources: [S.inrsProduits, S.inrsReproduction, S.inrsFocus],
    body_md: `## En bref
- Certains produits chimiques peuvent **réduire la fertilité**, **perturber la grossesse**, **affecter le développement de l’enfant** ou **passer dans le lait maternel**.
- Sur l’étiquette, les mentions **H360F/H360D** (peut nuire à la fertilité / au fœtus), **H361f/H361d** (susceptible de nuire) et **H362** (peut être nocif pour les bébés allaités) signalent ces dangers.
- L’INRS rappelle qu’**absence d’étiquette ne signifie pas absence de risque** : beaucoup de produits sont peu étudiés.
- Il est interdit d’affecter une femme enceinte ou allaitante à un poste l’exposant à certains agents toxiques pour la reproduction ; l’employeur doit proposer un autre emploi compatible, sans baisse de salaire.

## Comprendre
**Où trouve-t-on ces produits ?** Au travail, mais aussi à la maison et au jardin : peintures, colles, graisses, encres, solvants, désherbants notamment. Ils peuvent pénétrer dans l’organisme par inhalation (vapeurs, poussières), par contact avec la peau, par projection ou en portant les mains à la bouche.

**Lire les mentions de danger.** Le dépliant de l’INRS détaille les mentions à repérer :
- **H360F** : peut nuire à la fertilité. **H360D** : peut nuire au fœtus.
- **H361f** : susceptible de nuire à la fertilité. **H361d** : susceptible de nuire au fœtus.
- **H362** : peut être nocif pour les bébés nourris au lait maternel.
- D’autres mentions signalent des dangers graves : **H340/H341** (anomalies génétiques), **H350/H351** (cancer), **H370/H372** (atteinte d’organes).
Sur d’anciens emballages, vous pouvez encore trouver les mentions R60 à R64, qui correspondent aux mêmes dangers.

**Avant la conception, et pour les deux parents.** Certains produits présentent des risques avant même la grossesse. Pour certains d’entre eux, des précautions sont à prendre surtout dans les trois mois qui précèdent la conception, y compris chez le futur père. L’INRS cite par exemple le plomb, certains éthers de glycol et certains phtalates parmi les substances pouvant altérer la fertilité masculine.

**Ce que prévoit la réglementation.** Le Code du travail interdit d’affecter ou de maintenir une femme enceinte ou allaitante à un poste l’exposant à certains agents classés toxiques pour la reproduction (catégories 1A ou 1B), ainsi qu’au benzène, à certains antiparasitaires, au plomb et à certains dérivés des hydrocarbures aromatiques. L’employeur peut remplacer un produit dangereux par un autre moins dangereux ou aménager le poste ; à défaut, il propose un autre emploi, sans baisse de rémunération.

## Au quotidien
- **Faites la liste des produits** que vous utilisez et photographiez leurs étiquettes.
- **Préparez vos questions pour le médecin du travail**, comme le suggère l’INRS : quels produits sont dangereux, à quelles doses, à quelle fréquence, y a-t-il un risque d’inhalation, de contact avec la bouche ou d’éclaboussures, quelles protections collectives (ventilation, aspiration) et individuelles (gants, masque, lunettes) existent ?
- **Appliquez les règles d’hygiène** : ne pas manger, boire ou fumer au poste de travail, se laver les mains avant les pauses, retirer les vêtements de travail avant de rentrer.
- **À la maison**, reportez les travaux de peinture, de décapage ou de traitement du jardin, ou confiez-les à quelqu’un d’autre, et aérez bien.

## Questions fréquentes
**Le produit que j’utilise n’a pas de pictogramme : suis-je tranquille ?**
Pas forcément. L’INRS souligne que de nombreux produits sont peu étudiés et que l’absence d’étiquette ne prouve pas l’absence de risque. Le médecin du travail peut vous aider à évaluer votre exposition.

**Le médecin du travail va-t-il prévenir mon employeur ?**
Non. Il conseille sans mettre votre emploi en jeu, dans le respect du secret médical. C’est vous qui décidez d’informer ou non votre employeur.

**Mon médecin traitant peut-il intervenir ?**
Oui. Selon l’INRS, il peut, si besoin, contacter le médecin du travail.

## Quand demander conseil
Consultez le médecin du travail dès le projet de grossesse si vous manipulez des produits portant les mentions H360, H361 ou H362, ou des produits dont vous ignorez la composition. En cas d’exposition accidentelle importante, de malaise, de brûlure ou de difficulté à respirer, appelez le **15** ou le **112** ; le centre antipoison peut aussi être contacté. Si votre situation au travail vous angoisse au point de vous sentir dépassé·e, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'medecin-du-travail-des-le-projet-de-grossesse', category: 'preparer-grossesse',
    title: 'Consulter le médecin du travail dès le projet de grossesse : pourquoi et comment',
    summary: 'Le rôle du médecin du travail avant et pendant la grossesse, le secret médical, les aménagements possibles et vos droits si votre poste comporte des risques.',
    tags: ['médecin du travail', 'visite à la demande', 'projet de grossesse', 'aménagement de poste', 'secret médical', 'travail de nuit', 'déclaration de grossesse', 'droits salariée'],
    sources: [S.inrsFemmesEnceintes, S.inrsFocus, S.inrsProduits],
    body_md: `## En bref
- Une salariée peut demander une visite au médecin du travail **dès le projet de grossesse** ou au début de celle-ci, pour vérifier que son poste est compatible.
- Le médecin du travail est **tenu au secret** : il n’informe pas l’employeur tant que vous ne l’avez pas fait vous-même.
- Il peut proposer des **adaptations du poste ou du temps de travail**, après échange avec l’employeur.
- Vous n’êtes **pas obligée** de déclarer votre grossesse, mais l’INRS note que l’annoncer tôt permet de bénéficier des protections prévues.

## Comprendre
**Un rôle de prévention.** Le médecin du travail ne suit pas la grossesse elle-même (c’est le rôle du médecin ou de la sage-femme que vous avez choisis). Il s’occupe des **risques liés à votre travail** : il doit informer les salariées enceintes des risques professionnels pouvant nuire à la grossesse, et il peut intervenir bien avant, au moment du projet.

**Pourquoi y aller avant d’être enceinte ?** Certains produits présentent des risques avant même la conception, pour la femme comme pour l’homme, et une adaptation se prépare mieux à l’avance. L’INRS conseille donc d’informer le médecin du travail tôt, sans attendre la visite périodique. En cas de difficulté à concevoir, il peut aussi rechercher si vos conditions de travail y contribuent.

**Les aménagements possibles.** L’employeur peut adapter le poste en tenant compte des conclusions écrites du médecin du travail, ou remplacer un produit dangereux. À défaut, la salariée est affectée à un autre poste compatible. Ces mesures sont temporaires et n’entraînent pas de baisse de rémunération. Si aucun changement n’est possible, le contrat est suspendu avec maintien de la rémunération.

**Les horaires.** Aucun texte ne prévoit de réduction générale du temps de travail journalier pendant la grossesse, mais certaines conventions collectives en prévoient une. Le travail de nuit n’est pas interdit ; une salariée enceinte peut demander un poste de jour, que l’employeur ne peut pas refuser, sans baisse de salaire.

**Les absences.** Pendant la grossesse, les absences pour les examens médicaux obligatoires sont autorisées, rémunérées et comptées comme du temps de travail effectif.

## Au quotidien
- **Demandez la visite** auprès du service de prévention et de santé au travail de votre entreprise. Ce que vous direz au médecin reste couvert par le secret médical.
- **Préparez-la** : description de vos tâches, horaires, produits utilisés (avec leurs étiquettes), port de charges, station debout, contact avec des enfants, des malades ou des animaux, rayonnements, déplacements.
- **Apportez votre carnet de vaccination** et vos sérologies si vous les avez : l’immunité contre la rubéole, par exemple, compte pour certains postes.
- **Notez les propositions** du médecin et demandez si elles feront l’objet d’un écrit.
- **Si vous travaillez à votre compte**, parlez de vos expositions à votre médecin traitant ou à votre sage-femme, et renseignez-vous auprès des organismes de prévention de votre profession.

## Questions fréquentes
**Le médecin du travail peut-il me déclarer inapte parce que je veux un enfant ?**
Son rôle est de prévenir les risques et de proposer des adaptations. L’INRS précise qu’il conseille sans mettre votre emploi en jeu.

**Mon conjoint peut-il aussi consulter son médecin du travail ?**
Oui. Les pères sont concernés par certaines expositions, notamment dans les mois qui précèdent la conception.

**Et après la naissance ?**
Une visite de reprise doit être organisée par l’employeur dans les huit jours suivant le retour de congé maternité. Elle vérifie la compatibilité du poste et peut aboutir à des adaptations.

## Quand demander conseil
Demandez la visite dès que le projet se précise si votre poste comporte des produits chimiques, des rayonnements, un contact avec des enfants ou des malades, de la chaleur, du port de charges ou des horaires de nuit. En cas d’accident ou de malaise au travail, appelez le **15** ou le **112**. Si une situation de travail vous fait souffrir moralement, n’attendez pas : le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'metiers-exposes-infections-projet-grossesse', category: 'preparer-grossesse',
    title: 'Santé, petite enfance, laboratoire, vétérinaire : préparer une grossesse quand on est exposée aux infections',
    summary: 'Rubéole, varicelle, toxoplasmose : pourquoi vérifier son immunité et ses vaccins avant de concevoir quand on travaille au contact d’enfants, de malades ou d’animaux.',
    tags: ['risque biologique', 'petite enfance', 'crèche', 'soignante', 'infirmière', 'vétérinaire', 'laboratoire', 'rubéole', 'varicelle', 'toxoplasmose', 'vaccins', 'projet de grossesse'],
    sources: [S.inrsFemmesEnceintes, S.inrsFocus, S.ameliVaccinsProjet],
    body_md: `## En bref
- L’INRS cite les professions de **santé** et de la **petite enfance** parmi les plus exposées à des infections comme la rubéole ou la varicelle, ainsi que les métiers de **laboratoire** et les **vétérinaires** parmi ceux à risque pendant la grossesse.
- La réglementation interdit d’exposer une femme enceinte à la **rubéole** ou à la **toxoplasmose** sur son poste, sauf si elle est immunisée.
- Avant la grossesse, faites vérifier votre **immunité** et mettez à jour vos **vaccins**. Les vaccins vivants (rougeole-oreillons-rubéole, varicelle) se font **avant** la grossesse, avec une contraception pendant le mois qui suit.
- Le médecin du travail peut évaluer votre poste dès le projet.

## Comprendre
Certaines infections, bénignes pour l’adulte, peuvent être graves pour le fœtus si elles surviennent pendant la grossesse. Quand on travaille au contact d’enfants, de patients, d’échantillons biologiques ou d’animaux, le risque de les croiser est plus élevé. La bonne nouvelle, c’est que plusieurs d’entre elles se préviennent par la vaccination, à condition de s’y prendre avant la grossesse.

**Rubéole.** L’Assurance Maladie indique que la vaccination est indispensable avant la grossesse si la sérologie est négative ou si vous n’avez pas reçu deux doses de vaccin. Le vaccin est combiné à celui de la rougeole, dont l’infection pendant la grossesse peut provoquer une fausse couche.

**Varicelle.** Si vous ne l’avez jamais eue, la vaccination est possible avant la grossesse.

**Délai après un vaccin vivant.** Par précaution, il faut éviter toute grossesse pendant le mois qui suit une vaccination contre la rougeole, les oreillons, la rubéole ou la varicelle, et donc utiliser une contraception pendant ce mois. Ces vaccins sont à éviter pendant la grossesse.

**Toxoplasmose.** La sérologie, faite avant ou en début de grossesse, indique si vous êtes immunisée. Sinon, des précautions d’hygiène s’imposent, et certains postes ne peuvent pas être tenus pendant la grossesse.

**Les autres vaccins.** Le projet de grossesse est aussi le moment de rattraper le tétanos, la diphtérie, la poliomyélite, l’hépatite B et la **coqueluche**, particulièrement importante pour protéger les nourrissons. La grippe et le Covid-19 sont recommandés selon les recommandations en vigueur.

## Au quotidien
- **Retrouvez votre carnet de vaccination** et vos anciennes sérologies avant la consultation préconceptionnelle.
- **Demandez une sérologie** rubéole, toxoplasmose et, si vous n’êtes pas sûre d’avoir eu la varicelle, varicelle.
- **Planifiez les vaccins vivants** avant d’arrêter votre contraception, pour respecter le délai d’un mois.
- **Renforcez les gestes d’hygiène** au travail : lavage des mains, gants pour les changes et les soins, pas de contact des mains avec la bouche.
- **Prenez rendez-vous avec le médecin du travail** pour évaluer votre poste et anticiper les adaptations si vous n’êtes pas immunisée.

## Questions fréquentes
**Je travaille en crèche et je ne suis pas immunisée contre la rubéole : que faire ?**
Faites-vous vacciner avant la grossesse et utilisez une contraception pendant le mois suivant. Parlez-en au médecin du travail pour votre poste en attendant.

**J’ai été vaccinée sans savoir que j’étais déjà enceinte : est-ce grave ?**
Parlez-en sans tarder au médecin ou à la sage-femme qui vous suit : il vous expliquera la conduite à tenir dans votre situation.

**L’employeur peut-il me changer de poste ?**
Si votre poste vous expose à la rubéole ou à la toxoplasmose et que vous n’êtes pas immunisée, une adaptation ou une autre affectation doit être recherchée pendant la grossesse, sans baisse de rémunération.

## Quand demander conseil
Consultez votre médecin ou votre sage-femme si vous êtes enceinte ou essayez de l’être et que vous avez été en contact avec une personne atteinte de rubéole, de varicelle ou d’une éruption fébrile, ou si vous avez de la fièvre. En cas de fièvre élevée avec malaise ou de difficulté à respirer, appelez le **15** ou le **112**. Si l’inquiétude devient envahissante, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'futur-pere-travail-fertilite-expositions', category: 'preparer-grossesse',
    title: 'Futur père : chaleur, solvants, plomb, médicaments… ce qui compte avant la conception',
    summary: 'Pourquoi les expositions professionnelles et les traitements du futur père méritent aussi un point avant de concevoir, et à qui en parler.',
    tags: ['futur père', 'fertilité masculine', 'spermatozoïdes', 'chaleur', 'plomb', 'solvants', 'éthers de glycol', 'phtalates', 'médicaments', 'médecin du travail', 'projet bébé'],
    sources: [S.inrsReproduction, S.inrsProduits, S.ameliVaccinsProjet],
    body_md: `## En bref
- Selon l’INRS, quand le travail affecte la fertilité, c’est le plus souvent l’appareil reproducteur **masculin** qui est touché, avec une baisse du nombre ou de la qualité des spermatozoïdes.
- Sont notamment cités certains **produits chimiques** (plomb, certains éthers de glycol, certains phtalates), les **fortes chaleurs** et, au-delà d’une certaine dose, les **rayonnements ionisants**.
- Pour certains produits, les précautions comptent surtout dans les **trois mois** qui précèdent la conception.
- Certains **médicaments** peuvent aussi affecter les spermatozoïdes : faites le point avec votre médecin dès le projet.

## Comprendre
La préparation d’une grossesse est souvent pensée côté femme. Pourtant, la qualité des spermatozoïdes participe directement à la conception, et les spermatozoïdes sont produits en continu tout au long de la vie : ce que vit le futur père dans les mois qui précèdent le projet compte donc aussi.

**Les expositions professionnelles.** L’INRS explique que certains agents chimiques agissent sur la fertilité masculine à l’âge adulte, et que selon la substance, les effets sont réversibles ou non. Les fortes chaleurs, quand le poste y expose, affectent aussi la reproduction masculine. Les rayonnements ionisants, au-delà d’une certaine dose, peuvent provoquer une stérilité.

**Les produits à surveiller.** Peintures, colles, encres, graisses, solvants, désherbants : l’étiquette peut porter les mentions **H360F** (peut nuire à la fertilité) ou **H361f** (susceptible de nuire à la fertilité). Le dépliant de l’INRS précise que les pères sont concernés et que, pour certains produits, des précautions sont à prendre surtout dans les trois mois avant la conception.

**Les médicaments.** L’Assurance Maladie rappelle que, côté père, certains médicaments peuvent affecter les spermatozoïdes et réduire la fertilité. N’arrêtez jamais un traitement de vous-même : le médecin peut l’adapter si besoin.

## Au quotidien
- **Listez vos expositions** : produits manipulés (avec leurs étiquettes), chaleur, rayonnements, horaires. Pensez aussi au bricolage et au jardinage.
- **Demandez une visite au médecin du travail**. Il conseille dans le respect du secret médical et peut proposer des protections ou des adaptations.
- **Portez les protections prévues** (gants, masque, ventilation) et appliquez les règles d’hygiène : se laver les mains avant de manger, ne pas rapporter les vêtements de travail souillés à la maison.
- **Faites le point sur vos traitements** avec votre médecin traitant, y compris les produits pris sans ordonnance et les compléments.
- **Accompagnez votre partenaire** à la consultation préconceptionnelle si vous le souhaitez : c’est l’occasion de parler de vos antécédents et de votre mode de vie (tabac, alcool, drogues).

## Questions fréquentes
**J’ai été exposé à un produit à risque : est-ce que cela compromet notre projet ?**
Pas nécessairement : tout dépend du produit, de la dose et de la durée. Parlez-en au médecin du travail et à votre médecin. En cas de difficulté à concevoir, un spermogramme fait partie du bilan.

**Mon travail peut-il expliquer que nous n’arrivions pas à avoir d’enfant ?**
C’est une piste parmi d’autres. Le médecin du travail peut rechercher si les conditions de travail de l’un ou l’autre parent contribuent à une difficulté à concevoir. Mentionnez votre métier lors du bilan de fertilité.

**Faut-il changer de poste ?**
Ce n’est pas systématique. Des mesures de protection ou un aménagement peuvent suffire ; le médecin du travail vous aidera à évaluer la situation.

## Quand demander conseil
Consultez si vous avez une douleur, une grosseur ou un gonflement d’un testicule, ou si vous essayez de concevoir depuis un an sans succès. En cas d’exposition accidentelle importante (projection, inhalation, brûlure) ou de malaise, appelez le **15** ou le **112** ; le centre antipoison peut aussi être contacté. Si vous traversez une période de grande détresse, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...A, slug: 'pilule-combinee-en-detail', category: 'cycle',
    title: 'La pilule combinée en détail : fonctionnement, prise, oublis et risques',
    summary: 'Comment agit la pilule œstroprogestative, les différentes plaquettes, ce qui compte en cas de retard, les générations et les situations où elle est déconseillée.',
    tags: ['pilule', 'pilule combinée', 'œstroprogestative', 'plaquette 21', 'plaquette 28', 'oubli de pilule', 'thrombose', 'générations de pilule', 'tabac', 'migraine', 'contraception'],
    sources: [S.qsPilule, S.ameliHormonale, S.santeGenerations],
    body_md: `## En bref
- La pilule combinée associe un **œstrogène** et un **progestatif**. Elle **bloque l’ovulation**.
- Elle se prend **chaque jour à heure fixe**. Son efficacité est supérieure à 99,7 % en utilisation parfaite, mais d’environ 91 % en utilisation courante, surtout à cause des oublis.
- Au-delà de **12 heures de retard**, la protection n’est plus assurée (3 heures pour certaines pilules en prise continue, selon QuestionSexualité). Ayez toujours une contraception d’urgence à portée de main.
- Elle augmente le risque de **thrombose** (caillot dans une veine ou une artère). Les pilules de 1re et 2e générations sont à privilégier ; les 3e et 4e générations ne sont pas recommandées en première intention.

## Comprendre
**Comment elle agit.** Les hormones de synthèse empêchent l’ovulation. Les saignements qui surviennent pendant la pause ne sont pas de « vraies » règles : ils sont dus à la chute des hormones à l’arrêt de la plaquette.

**Les plaquettes.**
- **21 comprimés** : trois semaines de prise, puis sept jours d’arrêt.
- **28 comprimés** : prise continue, avec des comprimés actifs suivis de comprimés sans hormones (par exemple 24 + 4 ou 21 + 7).

**Le démarrage.** Si le premier comprimé est pris le premier jour des règles, la protection est immédiate selon QuestionSexualité ; l’Assurance Maladie conseille par prudence une méthode barrière pendant les sept premiers jours. Si vous commencez à un autre moment, un préservatif est nécessaire pendant sept jours. Le plus simple est de suivre la consigne donnée par le professionnel qui vous la prescrit.

**Les générations.** Elles dépendent du progestatif : 2e génération (lévonorgestrel, norgestrel), 3e génération (désogestrel, gestodène, norgestimate), et d’autres parfois appelées 4e génération (drospirénone, chlormadinone, diénogest, nomégestrol). Le risque de thrombose veineuse est plus élevé avec les 3e et 4e générations. Ordre de grandeur cité par QuestionSexualité, pour 10 000 femmes par an : environ 0,5 à 1 cas sans pilule, 2 avec une pilule de 2e génération, 3 à 4 avec une 3e ou 4e génération, et 29 pendant une grossesse.

**Les contre-indications.** Antécédent de phlébite, d’embolie pulmonaire, d’AVC ou d’infarctus, thrombophilie, certaines maladies du foie, cancer du sein ou de l’utérus, hypertension ou diabète compliqués, entre autres. La migraine avec aura est une contre-indication ; après 35 ans, la migraine (avec ou sans aura) et le **tabac** aussi.

## Au quotidien
- **Associez la prise à un geste quotidien** (brossage des dents, réveil) ou programmez une alarme.
- **En cas de vomissements ou de diarrhée importante** peu après la prise, ou de nouveau traitement, demandez conseil à votre pharmacien : l’efficacité peut être diminuée.
- **Gardez une pilule d’urgence** chez vous : elle est délivrée gratuitement en pharmacie, sans ordonnance.
- **Pour le renouvellement**, une ordonnance de moins d’un an peut être prolongée six mois au maximum par un infirmier ou un pharmacien. Une consultation au moins une fois par an reste recommandée.
- **Pour le coût**, les pilules de 1re et 2e générations sont remboursées à 65 % et gratuites jusqu’à 26 ans ; les 3e et 4e générations ne sont pas remboursées.

## Questions fréquentes
**Puis-je enchaîner deux plaquettes pour éviter les saignements ?**
Avec une pilule combinée, la prise en continu supprime les saignements de privation. Demandez à votre médecin ou à votre sage-femme si c’est adapté à votre pilule et comment procéder.

**La pilule fait-elle grossir ou baisser le désir ?**
Les effets varient selon les personnes. Si un effet vous gêne (saignements, acné, douleurs des seins, sécheresse vaginale, baisse de moral), parlez-en : changer de pilule ou de méthode est possible, avec l’aide du professionnel qui vous suit pour éviter toute période sans protection.

**Je fume : puis-je la prendre ?**
La pilule combinée n’est pas conseillée aux fumeuses de 35 ans et plus. Avant cet âge, le tabac augmente aussi le risque de thrombose : parlez-en avec le professionnel qui vous suit.

**La pilule rend-elle stérile à long terme ?**
Non. Après l’arrêt, il faut parfois un ou deux cycles pour retrouver un rythme naturel.

## Quand demander conseil
Appelez le **15** ou le **112** sans attendre en cas de douleur ou gonflement d’un mollet, d’essoufflement brutal, de douleur dans la poitrine, de crachats de sang, de faiblesse ou d’engourdissement d’un côté du corps, de trouble soudain de la parole ou de la vue, ou de mal de tête brutal et inhabituel : ce peuvent être des signes de thrombose. Consultez si une migraine apparaît ou change, ou en cas de saignements persistants. Après un oubli, demandez conseil à votre pharmacien.

${FIN}`,
  },
  {
    ...A, slug: 'pilule-progestative-en-detail', category: 'cycle',
    title: 'La pilule progestative (microprogestative) en détail : pour qui, comment, quels effets',
    summary: 'Une pilule sans œstrogène, prise sans interruption : son fonctionnement, la tolérance au retard selon le progestatif, ses effets sur les règles et ses avantages quand la pilule combinée est déconseillée.',
    tags: ['pilule progestative', 'microprogestative', 'désogestrel', 'lévonorgestrel', 'sans œstrogène', 'oubli', 'saignements', 'spotting', 'tabac', 'après 35 ans', 'contraception'],
    sources: [S.qsPilule, S.ameliHormonale, S.santeReglesContraception],
    body_md: `## En bref
- La pilule progestative ne contient **qu’un progestatif**, à faible dose, sans œstrogène.
- Elle se prend **tous les jours, à la même heure, sans pause** (plaquettes de 28 comprimés).
- Le **retard toléré** dépend du progestatif : **3 heures** pour le lévonorgestrel, **12 heures** pour le désogestrel.
- Elle peut être utilisée quand la pilule combinée est déconseillée, par exemple après 35 ans ou en cas de tabagisme. Elle peut modifier les règles : saignements irréguliers ou disparition des règles.

## Comprendre
**Comment elle agit.** Toutes les pilules progestatives épaississent la glaire cervicale, ce qui gêne le passage des spermatozoïdes, et modifient la muqueuse de l’utérus. Le **désogestrel** supprime en plus l’ovulation ; le **lévonorgestrel** ne la bloque que partiellement, chez environ la moitié des utilisatrices selon QuestionSexualité.

**L’efficacité.** Elle est supérieure à 99,7 % en utilisation parfaite et d’environ 91 à 93 % en utilisation courante, à cause des oublis, des vomissements ou diarrhées et de certaines interactions avec d’autres médicaments.

**Les effets sur les règles.** Santé.fr explique que certaines pilules progestatives n’empêchent pas l’ovulation, et les règles reviennent alors environ toutes les quatre semaines. D’autres suppriment l’ovulation, et certaines femmes n’ont plus du tout de règles. De petits saignements (spotting) peuvent apparaître au début, le temps que le corps s’adapte ; s’ils persistent, la méthode peut être revue.

**Les effets indésirables.** Chez environ une femme sur dix : troubles de l’humeur, prise de poids, acné, douleurs des seins, maux de tête ou règles irrégulières. Elle est utilisable en cas d’endométriose. L’Assurance Maladie signale pour le désogestrel un très faible risque de méningiome (tumeur, le plus souvent bénigne, des enveloppes du cerveau), observé après au moins un an d’utilisation et qui disparaît un an après l’arrêt.

**Le coût.** La pilule progestative est remboursée par l’Assurance Maladie ; une pilule à la drospirénone existe aussi, mais elle n’est pas remboursée.

## Au quotidien
- **Choisissez une heure fixe** qui vous convient tous les jours, y compris le week-end, et programmez un rappel.
- **Notez le nom de votre progestatif** : c’est lui qui détermine si votre marge est de 3 ou de 12 heures.
- **Démarrage** : si le premier comprimé est pris le premier jour des règles, QuestionSexualité indique une protection immédiate ; sinon, utilisez un préservatif pendant sept jours. Suivez la consigne de votre prescripteur.
- **En voyage**, pensez au décalage horaire pour garder un intervalle régulier entre deux prises.
- **Tenez un petit relevé** de vos saignements les premiers mois : il sera utile si vous devez en reparler.

## Questions fréquentes
**Je n’ai plus de règles : suis-je enceinte ?**
Avec certaines pilules progestatives, l’absence de règles est un effet connu. En cas de doute (oubli, symptômes), faites un test de grossesse.

**Je fume et j’ai plus de 35 ans : est-ce une option ?**
Oui, c’est justement l’une des situations où l’Assurance Maladie oriente vers une pilule progestative plutôt que combinée. Le choix se fait avec votre médecin ou votre sage-femme, selon votre santé.

**Comment savoir si ma pilule tolère 3 ou 12 heures de retard ?**
Regardez le nom du progestatif sur la boîte ou la notice (lévonorgestrel ou désogestrel), ou demandez à votre pharmacien.

**Que faire en cas d’oubli ?**
Prenez le comprimé oublié dès que possible et demandez conseil à votre pharmacien : selon le délai et les rapports récents, une contraception d’urgence et un préservatif pendant quelques jours peuvent être nécessaires.

## Quand demander conseil
Consultez en cas de saignements persistants ou abondants, de maux de tête inhabituels qui s’installent, ou de baisse de moral importante. Appelez le **15** ou le **112** en cas de mal de tête brutal et intense, de trouble soudain de la vue ou de la parole, de faiblesse d’un côté du corps, de douleur thoracique ou d’essoufflement brutal. Si vous vous sentez très mal moralement, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...A, slug: 'patch-et-anneau-contraceptifs-en-detail', category: 'cycle',
    title: 'Patch et anneau vaginal contraceptifs : utilisation, décollement, expulsion et précautions',
    summary: 'Deux méthodes combinées qui évitent la prise quotidienne : comment les utiliser, que faire s’ils se décollent ou sont expulsés, et pour qui ils sont envisagés.',
    tags: ['patch contraceptif', 'anneau vaginal', 'contraception combinée', 'décollement patch', 'expulsion anneau', 'semaine d’arrêt', 'thrombose', 'non remboursé', 'contraception'],
    sources: [S.qsPatch, S.qsAnneau, S.ameliHormonale],
    body_md: `## En bref
- Le **patch** et l’**anneau vaginal** contiennent, comme la pilule combinée, un œstrogène et un progestatif. Ils bloquent l’ovulation.
- **Patch** : un nouveau chaque semaine pendant trois semaines, puis une semaine sans patch. **Anneau** : gardé trois semaines, retiré pendant sept jours, puis un nouvel anneau.
- Leur efficacité est d’environ 99,7 % en utilisation parfaite et 91 à 93 % en utilisation courante.
- Ils ont les **mêmes contre-indications** que la pilule combinée, sont prescrits en **deuxième intention** et **ne sont pas remboursés**.

## Comprendre
**Le patch** est un timbre adhésif qui libère les hormones à travers la peau. On le colle sur le ventre, les épaules ou le bas du dos, **jamais près d’un sein**. La quatrième semaine, sans patch, des saignements apparaissent. Il est moins efficace au-delà de 90 kg, car la concentration d’hormones dans le sang diminue.

**L’anneau vaginal** est un anneau souple qui diffuse les hormones à travers la paroi du vagin. On l’insère soi-même, comme un tampon ; la position exacte compte peu, l’important est qu’il tienne et qu’on ne le sente pas. Il est retiré au début de la quatrième semaine, ce qui provoque les règles, et un nouvel anneau est remis sept jours après.

**Le démarrage.** Posés le premier jour des règles, ils sont efficaces immédiatement. Sinon, une méthode complémentaire (préservatif) est nécessaire pendant sept jours. Pour l’anneau, QuestionSexualité précise qu’un début entre le 2e et le 5e jour du cycle demande aussi sept jours de précaution.

**Les risques.** Le risque de thrombose veineuse de l’anneau est au moins équivalent à celui des pilules de 2e génération. L’Assurance Maladie mentionne aussi, pour l’anneau à l’étonogestrel, le risque de méningiome. Les effets indésirables ressemblent à ceux de la pilule combinée : nausées, seins gonflés ou douloureux, maux de tête, saignements irréguliers.

## Au quotidien
**Patch**
- Changez-le **le même jour chaque semaine** et notez-le dans votre agenda.
- Vérifiez chaque jour qu’il est bien collé, surtout après la douche, la piscine ou le sport.
- **Décollé depuis moins de 24 heures** : recollez-le ou posez-en un nouveau au plus vite. **Plus de 24 heures** : posez un nouveau patch, considérez que c’est un nouveau cycle et utilisez un préservatif pendant sept jours.
- Oubli de changement : la protection reste assurée 48 heures selon QuestionSexualité.

**Anneau**
- **Expulsé depuis moins de 3 heures** : rincez-le et remettez-le.
- **Plus de 3 heures** : posez un nouvel anneau, à garder trois semaines, et utilisez un préservatif pendant sept jours.
- Il demande d’être à l’aise avec le fait de toucher son sexe et d’y introduire les doigts.

**Dans les deux cas**, si vous avez eu des rapports dans les cinq jours qui précèdent un décollement ou une expulsion prolongés, une contraception d’urgence est conseillée le plus tôt possible.

## Questions fréquentes
**Pourquoi ne me les propose-t-on pas en premier ?**
Ils sont prescrits en deuxième intention, après avoir envisagé d’autres méthodes. Pour l’anneau, l’Assurance Maladie l’explique notamment par la manipulation nécessaire. Le choix se fait avec un médecin ou une sage-femme.

**L’anneau se sent-il pendant les rapports ?**
Il peut parfois être ressenti. Si cela vous gêne, parlez-en au professionnel qui vous suit.

**Combien coûtent-ils ?**
Environ 15 € par mois chacun (prix indicatif), sans remboursement. Ils sont délivrés en pharmacie sur ordonnance.

## Quand demander conseil
Appelez le **15** ou le **112** en cas de douleur ou de gonflement d’un mollet, d’essoufflement brutal, de douleur dans la poitrine, de faiblesse d’un côté du corps, de trouble soudain de la parole ou de la vue, ou de mal de tête brutal et intense. Consultez en cas de saignements persistants, d’irritation importante au point de pose ou de migraine qui apparaît ou change. En cas de doute après un décollement ou une expulsion, votre pharmacien peut vous conseiller.

${FIN}`,
  },
  {
    ...A, slug: 'implant-contraceptif-en-detail', category: 'cycle',
    title: 'L’implant contraceptif en détail : pose, efficacité, effets sur les règles et retrait',
    summary: 'Un bâtonnet sous la peau du bras efficace trois ans : comment il est posé et retiré, ce qu’il change sur les règles, la surveillance à faire et les signes d’alerte.',
    tags: ['implant', 'implant contraceptif', 'bras', 'étonogestrel', 'progestatif', 'saignements', 'absence de règles', 'retrait implant', 'migration implant', 'contraception longue durée'],
    sources: [S.qsImplant, S.ameliHormonale],
    body_md: `## En bref
- L’implant est un **petit bâtonnet souple** (environ 4 cm sur 2 mm) placé sous la peau du bras. Il libère en continu un progestatif, l’étonogestrel, qui **supprime l’ovulation**.
- Son efficacité est de **99,9 %** pendant **3 ans au maximum**, sans prise à penser.
- Il modifie souvent les règles : absence de règles, règles irrégulières, saignements fréquents surtout les six premiers mois.
- Palpez votre bras **environ toutes les deux semaines** et consultez **à 3 mois** après la pose. Il peut être retiré **à tout moment**, sur demande.

## Comprendre
**La pose.** Un médecin ou une sage-femme l’insère sous la peau du bras non dominant, avec un applicateur, après une anesthésie locale (une crème anesthésiante peut aussi être utilisée). Cela ne prend que quelques minutes. Il est fortement recommandé que la pose et le retrait soient faits par des professionnels formés à ces gestes.

**Quand est-il efficace ?** Posé entre le 1er et le 5e jour des règles, il est efficace immédiatement. Posé à un autre moment, il faut utiliser un préservatif pendant sept jours.

**La durée.** Trois ans au maximum. Chez les personnes en surpoids, le médecin peut décider de le changer plus tôt, entre 24 et 30 mois, car la concentration de progestatif diminue quand le poids augmente. Certains médicaments (traitements de l’épilepsie, de la tuberculose, de certaines infections) et le millepertuis peuvent réduire son efficacité.

**Les effets indésirables.** Modifications des règles (absence, irrégularité, durée variable), saignements fréquents surtout au début, acné qui réapparaît ou s’aggrave, prise de poids chez certaines personnes. Il diminue souvent les douleurs de règles. L’Assurance Maladie mentionne aussi le risque de méningiome lié à l’étonogestrel.

**Un risque rare mais grave : la migration.** L’implant peut, très rarement, migrer dans les vaisseaux jusqu’à l’artère pulmonaire, souvent après une insertion trop profonde. D’où l’importance de la palpation régulière.

**Les contre-indications** incluent notamment un antécédent de phlébite ou d’embolie pulmonaire, une tumeur sensible aux hormones sexuelles, des saignements vaginaux inexpliqués ou une maladie grave du foie.

## Au quotidien
- **Apprenez à le sentir** sous la peau lors de la pose, puis vérifiez-le environ toutes les deux semaines.
- **Notez la date de pose et la date de changement** prévue dans votre agenda ou votre téléphone.
- **Tenez un relevé de vos saignements** les premiers mois pour en parler à la visite de contrôle.
- **Signalez l’implant** à tout professionnel qui vous prescrit un médicament.
- **Coût** : environ 100 € avant remboursement, remboursé à 65 % ; il est délivré gratuitement en pharmacie aux 18-26 ans, et gratuitement en centre de santé sexuelle pour les mineures souhaitant le secret et les majeures sans assurance maladie.

## Questions fréquentes
**Le retrait est-il compliqué ?**
Le professionnel anesthésie la peau, fait une petite incision et retire l’implant avec une pince. Un nouvel implant peut être posé immédiatement.

**Je saigne souvent depuis la pose : que faire ?**
Les saignements fréquents sont surtout présents les six premiers mois. S’ils sont très fréquents ou vous gênent, consultez : des solutions peuvent être discutées.

**Je veux un enfant : dois-je attendre la fin des 3 ans ?**
Non, il peut être retiré à tout moment. Profitez-en pour prévoir une consultation préconceptionnelle.

**Protège-t-il des infections sexuellement transmissibles ?**
Non. Seuls les préservatifs protègent des IST.

## Quand demander conseil
Contactez rapidement le professionnel qui vous suit si vous ne sentez plus l’implant sous la peau. Appelez le **15** ou le **112** sans attendre en cas de douleur dans la poitrine, de difficulté à respirer, de toux inhabituelle ou de sang dans les crachats. Consultez aussi en cas de saignements très fréquents, de douleur, de rougeur ou de gonflement au point de pose.

${FIN}`,
  },
  {
    ...A, slug: 'diu-sterilet-cuivre-hormonal-en-detail', category: 'cycle',
    title: 'Le stérilet (DIU) au cuivre ou hormonal en détail : pose, durée, effets et retrait',
    summary: 'Les deux types de dispositif intra-utérin, leur fonctionnement, leur durée, leurs effets sur les règles, et ce qu’il faut savoir sur la pose et le retrait.',
    tags: ['stérilet', 'DIU', 'DIU au cuivre', 'DIU hormonal', 'lévonorgestrel', 'pose stérilet', 'retrait stérilet', 'règles abondantes', 'contraception d’urgence', 'sans hormone', 'contraception longue durée'],
    sources: [S.santeDiu, S.ameliCu, S.qsTableau],
    body_md: `## En bref
- Le **DIU au cuivre** est sans hormone. Il est efficace dès la pose et se garde **3 à 10 ans** selon le modèle. Il peut aussi servir de **contraception d’urgence** jusqu’à 5 jours après un rapport non protégé.
- Le **DIU hormonal** libère un progestatif, le lévonorgestrel. Il se garde **5 ans** et diminue souvent la durée et l’abondance des règles.
- Leur efficacité pratique est très élevée : 99,2 % pour le cuivre et 99,8 % pour l’hormonal selon le tableau de QuestionSexualité.
- Il peut être posé **même sans avoir eu d’enfant**. La pose et le retrait se font par un médecin ou une sage-femme.

## Comprendre
**Le DIU au cuivre** est un petit dispositif en forme de T ou de manchon portant du cuivre. Le cuivre altère les spermatozoïdes, ce qui empêche la fécondation, et modifie la muqueuse de l’utérus. Ses effets sont réversibles dès le retrait. Il peut en revanche **allonger ou augmenter** les règles.

**Le DIU hormonal** épaissit la glaire du col (ce qui gêne les spermatozoïdes), ralentit la formation de la muqueuse utérine et, chez certaines femmes, empêche l’ovulation. Les premiers mois, il peut provoquer de petits saignements répétés ; ensuite, les règles diminuent souvent, voire disparaissent, ce qui est sans gravité mais peut dérouter. Il peut soulager des règles douloureuses et abondantes. Une prise de poids ou une poussée d’acné sont possibles chez certaines personnes.

**La pose.** Elle est réalisée de préférence en fin de règles (dans la semaine qui suit les règles pour le DIU hormonal). Après un examen du vagin et du col, le professionnel place le dispositif au fond de l’utérus et coupe les fils, qui dépassent du col pour permettre le retrait. Un antidouleur peut être prescrit avant la pose : demandez-le si vous êtes inquiète. Des modèles plus petits existent pour les utérus de petite taille.

**Les risques.** Pour le DIU au cuivre, Santé.fr cite un risque d’infection en cas de partenaires multiples, de grossesse extra-utérine et d’expulsion du dispositif.

**Le coût.** Le DIU au cuivre coûte environ 30 € et le DIU hormonal environ 125 € ; tous deux sont délivrés en pharmacie sur prescription et remboursés à 65 %.

## Au quotidien
- **Préparez la consultation de pose** : date de vos dernières règles, éventuelle infection récente, questions sur la douleur.
- **Notez la date de pose et la durée** de votre modèle.
- **Le sport et les tampons** sont possibles (en changeant les tampons plusieurs fois par jour).
- **Si les fils gênent** pendant les rapports, le médecin peut les raccourcir. Le DIU ne doit pas provoquer de douleur pendant les rapports.
- **Pour un remplacement**, l’ancien DIU est retiré et le nouveau posé au cours de la même consultation.
- **Protégez-vous des IST** avec le préservatif en cas de nouveau partenaire : le DIU ne protège pas des infections.

## Questions fréquentes
**Le retrait est-il douloureux ?**
Il est réalisé par le professionnel en tirant doucement sur les fils, de préférence pendant ou après les règles. Santé.fr le décrit comme simple.

**Puis-je être enceinte rapidement après le retrait ?**
Pour le DIU au cuivre, l’effet est réversible dès le retrait. Si vous avez un projet de grossesse, profitez du rendez-vous pour faire une consultation préconceptionnelle.

**Le DIU peut-il servir après un rapport à risque ?**
Le DIU au cuivre est la méthode d’urgence la plus efficace, à condition d’être posé dans les 5 jours, après une consultation qui vérifie les contre-indications.

## Quand demander conseil
Consultez en cas de douleurs du bas-ventre, de fièvre, de pertes inhabituelles, de saignements persistants, de douleur pendant les rapports, ou si vous ne sentez plus les fils ou sentez le dispositif au niveau du col. Faites un test de grossesse en cas de retard de règles. Appelez le **15** ou le **112** en cas de douleur abdominale intense, surtout avec un retard de règles, des saignements ou un malaise.

${FIN}`,
  },
  {
    ...A, slug: 'preservatifs-externe-interne-bien-utiliser', category: 'cycle',
    title: 'Préservatif externe et préservatif interne : bien les choisir et bien les utiliser',
    summary: 'Les gestes qui évitent les échecs, le choix du lubrifiant et des normes, la gratuité pour les moins de 26 ans et la conduite à tenir après un accident.',
    tags: ['préservatif', 'préservatif externe', 'préservatif masculin', 'préservatif interne', 'préservatif féminin', 'lubrifiant', 'norme NF', 'marquage CE', 'IST', 'rupture préservatif', 'gratuit moins de 26 ans'],
    sources: [S.qsPresExt, S.qsPresInt, S.ameliCu],
    body_md: `## En bref
- Les préservatifs externe et interne sont les **seules méthodes** qui protègent à la fois d’une grossesse et des **infections sexuellement transmissibles** (IST).
- Leur efficacité dépend beaucoup de l’utilisation : environ 98 % en usage parfait et 85 % en usage courant pour le préservatif externe ; 95 % et 79 % pour le préservatif interne.
- Choisissez un préservatif portant le marquage **CE** ou **NF**, de la bonne taille, et un lubrifiant **à base d’eau ou de silicone**, jamais gras.
- Après une rupture ou un glissement, une **contraception d’urgence** est à prendre le plus tôt possible.

## Comprendre
**Le préservatif externe** se déroule sur le pénis en érection, avant toute pénétration. Il retient le sperme et fait barrière entre les muqueuses. Il existe en latex et, pour les personnes allergiques au latex, en polyuréthane.

**Le préservatif interne** est une gaine munie d’un anneau souple à chaque extrémité, placée dans le vagin. Il peut être mis en place **jusqu’à huit heures avant** le rapport, ne nécessite pas que le partenaire se retire juste après l’éjaculation et s’adapte à toutes les formes de vagin. Il existe en nitrile, polyuréthane ou latex.

**Pourquoi des échecs ?** Pose trop tardive, utilisation pas à chaque rapport, lubrifiant gras qui fragilise la matière, superposition de deux préservatifs, utilisation simultanée d’un externe et d’un interne (risque de déchirure), retrait tardif après l’éjaculation qui favorise le glissement.

**Le coût.** Depuis 2023, certains préservatifs externes sont gratuits en pharmacie, sans ordonnance, pour les moins de 26 ans ; c’est aussi le cas de certains préservatifs internes depuis janvier 2024. À partir de 26 ans, ils sont remboursés à 60 % sur prescription. Ils sont gratuits dans les centres de santé sexuelle, les CeGIDD et les associations de lutte contre le VIH.

## Au quotidien
**Préservatif externe, pas à pas**
- Ouvrez le sachet avec les doigts, sans les dents ni ciseaux.
- Posez-le dans le bon sens sur le pénis en érection, pincez le réservoir pour chasser l’air, déroulez-le jusqu’à la base.
- Ajoutez un peu de lubrifiant à base d’eau sur l’extérieur si besoin.
- Après l’éjaculation, retirez-vous avant la fin de l’érection en tenant la base du préservatif. Faites un nœud et jetez-le à la poubelle. Un préservatif neuf à chaque rapport.

**Préservatif interne, pas à pas**
- Pincez le petit anneau entre le pouce et l’index et insérez-le dans le vagin sans le tordre, puis poussez-le le plus loin possible avec l’index. Le grand anneau reste à l’extérieur.
- À la fin, tournez le grand anneau pour refermer le préservatif, retirez-le doucement et jetez-le.
- Il ne s’utilise pas avec un anneau vaginal contraceptif.

**Les bons réflexes**
- Vérifiez la date de péremption et l’état de l’emballage.
- Entraînez-vous à le poser et à le retirer en dehors des rapports.
- Gardez une pilule d’urgence à la maison : elle est délivrée gratuitement en pharmacie, sans ordonnance.

## Questions fréquentes
**Le préservatif a craqué : que faire ?**
Une contraception d’urgence est à prendre le plus tôt possible : la pilule au lévonorgestrel jusqu’à 3 jours, celle à l’ulipristal jusqu’à 5 jours, ou un DIU au cuivre posé dans les 5 jours. Pensez aussi au risque d’IST : un centre de santé sexuelle ou un CeGIDD peut vous conseiller sur un dépistage.

**Peut-on l’associer à une autre contraception ?**
Oui, c’est même conseillé en cas de nouveau partenaire : la « double protection » associe la pilule, un DIU ou un implant contre la grossesse, et le préservatif contre les IST.

**Comment choisir la taille ?**
Un préservatif qui serre ou qui glisse augmente le risque d’accident. Plusieurs tailles existent : essayez pour trouver la vôtre.

## Quand demander conseil
Après un accident de préservatif, rendez-vous en pharmacie sans attendre pour une contraception d’urgence, puis faites un test de grossesse si les règles tardent. Consultez en cas de brûlures, de pertes inhabituelles, de plaies ou de douleurs génitales. Après un rapport à risque d’infection par le VIH, un traitement d’urgence peut être proposé aux urgences ou en CeGIDD, idéalement dans les heures qui suivent. En cas d’urgence vitale, appelez le **15** ou le **112** ; si vous avez subi un rapport non consenti, vous pouvez aussi appeler le **17**.

${FIN}`,
  },
  {
    ...A, slug: 'diaphragme-cape-cervicale-spermicides', category: 'cycle',
    title: 'Diaphragme, cape cervicale et spermicides : les méthodes barrières sans hormone',
    summary: 'Comment fonctionnent ces méthodes à utiliser à chaque rapport, leur efficacité réelle, leur entretien et les situations où elles sont déconseillées.',
    tags: ['diaphragme', 'cape cervicale', 'spermicides', 'méthode barrière', 'sans hormone', 'contraception non hormonale', 'ovule spermicide', 'gel spermicide', 'efficacité'],
    sources: [S.qsDiaphragme, S.qsCape, S.qsSpermicides],
    body_md: `## En bref
- Le **diaphragme** (environ 7 cm) et la **cape cervicale** (2 à 3 cm) sont des coupelles souples placées dans le vagin contre le col de l’utérus. Ils s’achètent en pharmacie **sur ordonnance**.
- Ils s’utilisent **avec un spermicide** et doivent rester en place **au moins 8 heures** après le rapport, **au maximum 24 heures**.
- Leur efficacité en utilisation courante est plus faible que celle des méthodes hormonales ou du DIU : environ 88 % pour le diaphragme et 84 % pour la cape (moins après des accouchements).
- Les **spermicides** seuls sont peu efficaces ; ils sont surtout à associer à une méthode barrière. Aucune de ces méthodes ne protège des IST.

## Comprendre
**Le diaphragme** bloque le passage des spermatozoïdes vers l’utérus. Sa taille se détermine avec un professionnel formé (médecin ou sage-femme), mais des modèles à taille unique existent. Il se pose juste avant le rapport ou jusqu’à deux heures avant, se lave à l’eau et au savon neutre et se réutilise pendant deux ans. Il coûte environ 33 € en latex et 42 € en silicone, remboursé à 65 %, et il est gratuit pour les moins de 26 ans.

**La cape cervicale**, plus petite, se pose aussi jusqu’à deux heures avant le rapport et se réutilise pendant un an. Son efficacité est plus faible chez les femmes qui ont déjà eu des enfants. Elle coûte environ 60 € et n’est pas remboursée.

**Les spermicides** (crèmes, gels, ovules, éponges) inactivent ou détruisent les spermatozoïdes. Les ovules doivent fondre 10 à 15 minutes avant d’être efficaces, pendant environ une heure ; crèmes et gels agissent immédiatement, pendant environ une heure ; les éponges sont efficaces jusqu’à 24 heures et restent en place au moins 6 heures après la dernière éjaculation. Ils coûtent environ 5 à 20 €, sans remboursement. Utilisés seuls, ils ont un taux d’échec de 18 à 29 % selon QuestionSexualité.

**Pour qui ?** Ces méthodes conviennent notamment aux personnes à qui la contraception hormonale est contre-indiquée ou qui n’en veulent pas, et qui sont à l’aise pour toucher l’intérieur de leur vagin. Elles sont déconseillées lorsqu’une grossesse serait dangereuse (par exemple en cas de maladie cardiaque), en cas d’infections urinaires à répétition ou de descente d’organes (prolapsus).

## Au quotidien
- **Lavez-vous les mains** avant la pose et utilisez uniquement des lubrifiants à base d’eau.
- **Gardez une routine** : spermicide appliqué selon la notice, pose avant le rapport, retrait pas avant 8 heures.
- **Après un rapport avec spermicide**, évitez le savon pendant 6 à 8 heures et les injections vaginales pendant 6 heures : ils peuvent l’inactiver.
- **Signalez tout traitement vaginal** (ovule ou crème contre une mycose) : il peut rendre le spermicide inactif.
- **Vérifiez régulièrement l’état** du diaphragme ou de la cape et respectez leur durée d’utilisation.
- **Associez le préservatif** pour vous protéger des IST si besoin.

## Questions fréquentes
**Le diaphragme se sent-il ?**
Une fois bien posé, il ne doit pas gêner. La pose est indolore. Si vous le sentez ou s’il bouge, faites vérifier la taille avec le professionnel qui vous l’a prescrit.

**Les spermicides sont-ils compatibles avec les préservatifs ?**
Oui, ainsi qu’avec le diaphragme et la cape. En revanche, ils peuvent irriter la muqueuse vaginale, ce qui augmente le risque de transmission du VIH et des IST.

**Et si une grossesse survient malgré les spermicides ?**
QuestionSexualité indique qu’ils ne sont pas nocifs pour la grossesse. Consultez pour débuter le suivi.

**Après un accouchement, puis-je les utiliser ?**
Avec prudence : demandez conseil au pharmacien ou à la sage-femme, surtout si vous allaitez et avez accouché depuis moins de six semaines.

## Quand demander conseil
Consultez en cas d’irritation, de brûlures, de pertes inhabituelles, de douleurs ou d’infections urinaires répétées. Après un rapport où la méthode a été mal utilisée (diaphragme retiré trop tôt, spermicide oublié), une contraception d’urgence est possible en pharmacie, le plus tôt possible. Appelez le **15** ou le **112** en cas de fièvre élevée avec malaise, de douleur intense du bas-ventre ou de saignement abondant.

${FIN}`,
  },
  {
    ...AT, slug: 'sterilisation-contraceptive-vasectomie-ligature', category: 'cycle',
    title: 'Vasectomie et ligature des trompes : la contraception définitive expliquée',
    summary: 'Les conditions légales, le délai de réflexion de quatre mois, le déroulement de chaque intervention et le délai avant efficacité de la vasectomie.',
    tags: ['vasectomie', 'ligature des trompes', 'stérilisation', 'contraception définitive', 'délai de réflexion', 'contraception masculine', 'spermogramme de contrôle', 'irréversible'],
    sources: [S.ameliSterilisation, S.qsMasculine],
    body_md: `## En bref
- La stérilisation à visée contraceptive est possible pour **toute personne majeure**, sans condition d’âge au-delà de 18 ans, de nombre d’enfants ou de situation de couple.
- Elle est considérée comme **permanente et irréversible**. Un **délai de réflexion de 4 mois** sépare la première consultation du consentement écrit.
- La **vasectomie** se fait en ambulatoire, souvent sous anesthésie locale. Elle ne modifie ni l’érection, ni l’éjaculation, ni le plaisir, mais n’est efficace qu’après **8 à 16 semaines**, vérifiée par un spermogramme.
- La **ligature des trompes** se fait le plus souvent sous anesthésie générale. L’équilibre hormonal et la vie sexuelle sont conservés.

## Comprendre
**Le cadre légal.** Lors d’une première consultation, le médecin vous informe sur les méthodes, leurs risques et leur caractère définitif. Un accompagnement peut être proposé (conseiller conjugal, psychologue). Après au moins quatre mois de réflexion, vous confirmez par écrit lors d’une seconde consultation. Selon QuestionSexualité, si un médecin refuse de pratiquer l’intervention, il doit vous orienter vers un confrère.

**La vasectomie.** L’urologue sectionne ou obture les canaux déférents, qui transportent les spermatozoïdes, par une petite incision au niveau des bourses. L’intervention dure environ un quart d’heure. Les complications sont rares : hématome, infection, douleur des bourses. La production d’hormones, la libido et le plaisir ne changent pas ; l’éjaculation persiste, mais sans spermatozoïdes. Il faut **8 à 16 semaines et une vingtaine d’éjaculations** pour que le sperme n’en contienne plus : une autre contraception est indispensable pendant ce temps, jusqu’à ce qu’un spermogramme confirme leur absence. En France, 30 288 vasectomies ont été réalisées en 2022 selon QuestionSexualité.

**La ligature des trompes.** Les trompes sont fermées par ligature, électrocoagulation ou pose d’un anneau ou d’un clip, en général sous anesthésie générale, par cœlioscopie ou par voie vaginale, parfois au cours d’une autre intervention comme une césarienne. L’hospitalisation dure de un à trois jours ; les complications sont rares. La reperméabilisation des trompes est parfois tentée, avec des résultats très aléatoires.

**Ce qu’elles ne font pas.** Aucune de ces méthodes ne protège des IST.

## Au quotidien
- **Prenez le temps de réfléchir** : vos motivations, la liberté de votre choix, la connaissance des autres méthodes très efficaces et réversibles (DIU, implant), la crainte de regretter.
- **Parlez-en à deux** si vous êtes en couple, même si la décision vous appartient.
- **Préparez vos questions** pour la première consultation : technique, anesthésie, suites, délai d’efficacité.
- **Après une vasectomie**, notez la date et gardez une contraception jusqu’au résultat du spermogramme de contrôle.
- **Si vous envisagez un jour un enfant**, parlez-en avant : le caractère définitif est au cœur de la décision.

## Questions fréquentes
**Faut-il avoir déjà des enfants ?**
Non. La loi n’exige ni âge minimal au-delà de 18 ans, ni nombre d’enfants, ni statut marital.

**La vasectomie est-elle efficace tout de suite ?**
Non. Des spermatozoïdes restent présents pendant 8 à 16 semaines. Seul le spermogramme de contrôle confirme l’efficacité.

**Existe-t-il d’autres méthodes masculines ?**
En dehors du préservatif et de la vasectomie, les méthodes thermiques (comme le slip chauffant ou l’anneau masculin) ne sont pas reconnues par l’OMS et doivent toujours se faire avec un accompagnement médical. Les méthodes hormonales masculines restent au stade de la recherche. Le retrait n’est pas une méthode fiable.

## Quand demander conseil
Après l’intervention, consultez en cas de fièvre, de gonflement important ou croissant, de rougeur ou de douleur qui augmente. Appelez le **15** ou le **112** en cas de douleur abdominale intense, de saignement important ou de malaise. Si la question du projet d’enfant ou de la contraception crée une souffrance importante dans votre vie de couple, un professionnel peut vous accompagner ; en cas de détresse, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...AT, slug: 'arreter-sa-contraception-pour-concevoir', category: 'preparer-grossesse',
    title: 'Arrêter sa contraception pour concevoir : ce qui se passe selon la méthode',
    summary: 'Pilule, patch, anneau, implant, DIU : comment arrêter, quand les cycles reviennent, et à partir de quand une absence de règles doit faire consulter.',
    tags: ['arrêter la pilule', 'arrêt contraception', 'retour de fertilité', 'retirer implant', 'retirer stérilet', 'aménorrhée post-pilule', 'cycles irréguliers', 'projet bébé', 'tomber enceinte après la pilule'],
    sources: [S.santePeurSterile, S.ameliAmenorrheeCauses, S.ameliVaccinsProjet],
    body_md: `## En bref
- La pilule **ne rend pas stérile**, même prise pendant des années. Après l’arrêt, l’organisme peut mettre **un ou deux cycles** à retrouver son rythme.
- Quelques semaines sans règles après l’arrêt de la pilule peuvent se voir ; **au-delà de trois mois**, une cause doit être recherchée.
- L’**implant** et le **DIU** peuvent être retirés quand vous le décidez, en consultation.
- Arrêter sa contraception est un bon moment pour faire une **consultation préconceptionnelle** et commencer l’acide folique (vitamine B9).

## Comprendre
**Méthodes combinées (pilule, patch, anneau).** Elles bloquent l’ovulation. Les saignements pendant la pause ne sont pas de vraies règles. À l’arrêt, l’ovulation reprend, mais pas toujours immédiatement ni régulièrement : Santé.fr indique qu’il faut parfois un ou deux cycles pour que le rythme naturel revienne. L’Assurance Maladie précise que la reprise peut être lente et que quelques semaines d’absence de règles peuvent se voir.

**Méthodes progestatives (pilule progestative, implant, DIU hormonal).** Certaines suppriment l’ovulation et les règles. À l’arrêt, le cycle se remet progressivement en place.

**Implant et DIU.** Ils sont retirés en consultation par un médecin ou une sage-femme, au moment que vous choisissez, sans devoir attendre la fin de leur durée d’efficacité. Le DIU au cuivre ne contient pas d’hormone.

**Pourquoi ne pas tout mettre sur le compte de la contraception ?** Santé.fr rappelle que des règles irrégulières ou absentes peuvent aussi être liées à un changement de rythme, au manque de sommeil, à la fatigue, au stress, à une maladie ou à l’alimentation. L’Assurance Maladie cite aussi le sport intense, la perte de poids, un excès de prolactine ou un syndrome des ovaires polykystiques. D’où l’intérêt de consulter si les règles ne reviennent pas.

## Au quotidien
- **Demandez conseil** à votre médecin, à votre sage-femme ou à votre pharmacien sur la meilleure façon d’arrêter votre méthode.
- **Notez la date d’arrêt** puis la date des premières règles qui suivent : vous saurez rapidement comment votre cycle se remet en route.
- **Ne vous mettez pas la pression sur le premier cycle.** Même avec des cycles réguliers, la conception prend souvent plusieurs mois. Santé.fr rappelle qu’un rapport au moment de l’ovulation donne environ 25 % de chances de fécondation.
- **Si vous n’êtes pas tout à fait prêts**, ne laissez pas de « trou » : utilisez le préservatif en attendant.
- **Faites le point sur vos vaccins** : les vaccins vivants (rubéole, varicelle) se font avant d’arrêter la contraception, car il faut éviter une grossesse pendant le mois qui suit.

## Questions fréquentes
**Faut-il attendre quelques mois après la pilule avant d’essayer ?**
Les sources consultées n’indiquent pas de délai à respecter. Parlez-en lors de la consultation préconceptionnelle, qui permet aussi de démarrer la vitamine B9 au moins quatre semaines avant la conception.

**Mes règles ne reviennent pas depuis l’arrêt de la pilule : que faire ?**
Faites d’abord un test de grossesse. Si le test est négatif et que l’absence de règles dépasse trois mois, consultez pour en rechercher la cause.

**J’ai pris la pilule d’urgence plusieurs fois : ai-je abîmé ma fertilité ?**
Non. Santé.fr précise que la pilule d’urgence n’est pas dangereuse et ne rend pas stérile, même si elle n’est pas une contraception régulière.

## Quand demander conseil
Consultez si vos règles ne sont pas revenues trois mois après l’arrêt, si vos cycles restent très irréguliers ou si vous essayez depuis un an sans succès (plus tôt si vous avez plus de 35 ans ou des antécédents gynécologiques, à discuter avec votre médecin). Appelez le **15** ou le **112** en cas de douleur intense du bas-ventre, de saignement abondant ou de malaise, surtout si une grossesse est possible. Si l’attente devient trop lourde moralement, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...AT, slug: 'arret-contraception-preparer-projet-preconception', category: 'preparer-grossesse',
    title: 'Avant d’arrêter sa contraception : préparer le projet de grossesse (consultation, vaccins, vitamine B9)',
    summary: 'Les démarches à prévoir avant ou au moment d’arrêter la contraception : consultation préconceptionnelle, vaccins vivants, médicaments, acide folique.',
    tags: ['projet bébé', 'consultation préconceptionnelle', 'arrêter contraception', 'vitamine B9', 'acide folique', 'vaccin rubéole', 'vaccin varicelle', 'médicaments', 'sérologies', 'préparer grossesse'],
    sources: [S.ameliPreconception, S.ameliVaccinsProjet, S.qsChanger],
    body_md: `## En bref
- La **consultation préconceptionnelle**, avec un médecin ou une sage-femme, fait le point sur votre santé avant la grossesse. Elle est facultative et prise en charge à 70 %.
- Les **vaccins vivants** (rougeole-oreillons-rubéole, varicelle) se font **avant** la grossesse, avec une contraception pendant le **mois** qui suit : mieux vaut donc les prévoir **avant d’arrêter** votre contraception.
- L’**acide folique** (vitamine B9) est recommandé, sur prescription, idéalement **au moins 4 semaines avant la conception**, puis jusqu’à 12 semaines d’aménorrhée.
- Les **traitements en cours**, les vôtres et ceux du futur père, sont à revoir avec un professionnel.

## Comprendre
Décider d’arrêter sa contraception, c’est souvent le vrai début concret du projet. C’est le bon moment pour vérifier que tout est en place pour une grossesse dans de bonnes conditions, sans attendre d’être enceinte.

**Ce que couvre la consultation préconceptionnelle**, d’après l’Assurance Maladie :
- vos **antécédents familiaux** (maladies génétiques, malformations, maladies chroniques) et **personnels** (cycles, endométriose, SOPK, fibromes, interventions, maladies chroniques, difficultés psychiques, projets de grossesse antérieurs) ;
- votre **contraception** et la date de son arrêt éventuel ;
- vos **habitudes de vie** (tabac, drogues) ;
- vos **vaccins**, notamment la coqueluche ;
- des examens : **groupe sanguin et Rhésus**, immunité contre la **rubéole**, l’**hépatite B** et la **toxoplasmose**, dépistage de l’hépatite C, du VIH et de la syphilis, glycémie ;
- votre **travail** : pénibilité, exposition à des substances à risque, temps de trajet.

**Les vaccins vivants.** Ils sont à éviter pendant la grossesse. Si votre sérologie de rubéole est négative ou si vous n’avez pas reçu deux doses, la vaccination est indispensable avant la grossesse, avec une contraception pendant le mois suivant. Même chose pour la varicelle si vous ne l’avez jamais eue.

**Les médicaments.** Faites le point sur tous les traitements, y compris l’automédication et les compléments alimentaires, dont certains contiennent des vitamines ou oligo-éléments à éviter en excès. En cas de maladie chronique (asthme, diabète, épilepsie, troubles thyroïdiens, troubles psychiques), le traitement peut être adapté **avant** la grossesse. N’arrêtez jamais un traitement de vous-même.

## Au quotidien
- **Prenez rendez-vous** quelques mois avant la date d’arrêt envisagée, si possible.
- **Rassemblez vos documents** : carnet de santé et de vaccinations, anciennes prises de sang, comptes rendus d’échographies ou d’opérations, résultats de frottis.
- **Venez à deux** si vous le souhaitez : les antécédents et le mode de vie du futur père comptent aussi.
- **Organisez l’ordre des étapes** : vaccins vivants si besoin, puis un mois de contraception, puis arrêt.
- **Gardez une protection** si vous n’êtes pas tout à fait prêts : QuestionSexualité recommande de ne pas arrêter la pilule sans solution de relais et d’en parler avec un professionnel avant.

## Questions fréquentes
**La consultation est-elle obligatoire ?**
Non, elle est facultative, mais recommandée. Le professionnel consulté n’est pas forcément celui qui suivra votre grossesse.

**Je prends un traitement au long cours : dois-je l’arrêter avant d’arrêter ma contraception ?**
Non, n’arrêtez rien seule. Parlez-en à votre médecin : il pourra adapter le traitement si nécessaire avant la grossesse.

**Puis-je parler de mes inquiétudes ?**
Oui. La consultation est aussi un moment pour exprimer vos craintes ou difficultés, y compris matérielles ou relationnelles. Si vous vous sentez isolée ou en danger dans votre couple, vous pouvez en parler : de l’aide existe.

## Quand demander conseil
Consultez avant d’arrêter votre contraception si vous avez une maladie chronique, un traitement régulier, des antécédents de fausse couche, de grossesse difficile ou de troubles psychiques. En cas de violences, le **3919** (violences faites aux femmes) est gratuit et anonyme ; en danger immédiat, appelez le **17** ou le **112**. En cas d’urgence médicale, appelez le **15**. Si vous traversez une période de grande détresse, le **3114** répond à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'nouvelle-grossesse-apres-fausse-couche', category: 'preparer-grossesse',
    title: 'Envisager une nouvelle grossesse après une fausse couche',
    summary: 'Ce que l’on sait sur les grossesses suivantes, quand reprendre les rapports et les essais, les démarches utiles et la place à laisser au vécu de chacun.',
    tags: ['fausse couche', 'après une fausse couche', 'nouvelle grossesse', 'réessayer', 'retomber enceinte', 'consultation préconceptionnelle', 'arrêt de travail', 'Rhésus négatif', 'deuil'],
    sources: [S.ameliFC, S.ameliPreconception, S.ameliArretFC],
    body_md: `## En bref
- La fausse couche concerne environ **15 % des grossesses**. Elle est le plus souvent **isolée**, et l’Assurance Maladie indique que les grossesses suivantes se déroulent généralement sans difficulté.
- Il n’existe pas de délai précis imposé : une nouvelle grossesse peut être envisagée **dès que vous vous sentez rétablie**, physiquement et émotionnellement, idéalement après une consultation préconceptionnelle.
- Après la fausse couche, il est conseillé d’attendre **environ deux semaines** avant les rapports sexuels et d’éviter les tampons.
- Un **arrêt de travail** peut être prescrit si votre état le nécessite, **sans délai de carence** depuis 2024.

## Comprendre
**Pourquoi c’est arrivé ?** Une fausse couche précoce isolée est le plus souvent due à une anomalie du développement de l’embryon, probablement chromosomique. Ce n’est pas la conséquence d’une faute de votre part. C’est aussi pour cette raison qu’un bilan est rarement réalisé après une seule fausse couche. Le risque augmente avec l’âge, et certains facteurs le favorisent : obésité, tabac, excès de café, d’alcool ou de drogues, exposition aux pesticides, carence en vitamine B9 ou B12.

**Le corps après la fausse couche.** Les saignements diminuent progressivement. Si vous êtes de groupe **Rhésus négatif**, une injection de sérum anti-Rhésus est faite juste après la fausse couche, pour éviter une immunisation qui pourrait concerner une grossesse future. Une consultation de contrôle peut être programmée.

**Quand réessayer ?** L’Assurance Maladie ne fixe pas de délai : la grossesse peut être envisagée dès le rétablissement. La consultation préconceptionnelle est l’occasion de reparler de ce qui s’est passé, de vérifier les vaccins et les sérologies, de commencer l’acide folique et de poser vos questions.

**Le vécu.** Une fausse couche peut être très douloureuse, même très précoce. Tristesse, sentiment de vide, culpabilité ou colère peuvent apparaître, chez la femme comme chez son ou sa partenaire, à des rythmes différents. Être prête physiquement ne signifie pas forcément être prête émotionnellement, et inversement.

## Au quotidien
- **Accordez-vous du temps** : il n’y a pas de bon ou de mauvais moment universel pour réessayer.
- **Parlez-en à deux.** Il arrive que l’un souhaite réessayer vite et l’autre ait besoin d’attendre. Nommer ces différences aide à décider ensemble.
- **Reprenez ou commencez la vitamine B9** sur prescription, et faites le point sur le tabac, l’alcool et les autres consommations, avec de l’aide si besoin.
- **Notez la date des premières règles** qui suivent : elle vous aidera à repérer vos cycles et à dater une éventuelle grossesse.
- **Au travail**, si vous avez besoin d’un arrêt, le médecin utilise un formulaire spécifique : l’arrêt est indemnisé dès le premier jour pour les salariées, artisanes, commerçantes et professionnelles libérales qui remplissent les conditions.
- **Entourez-vous** : proches, professionnels, associations, groupes de parole. Vous n’avez pas à traverser cela seule.

## Questions fréquentes
**Faut-il attendre le retour des règles avant de réessayer ?**
Les sources consultées ne fixent pas de règle. Parlez-en au professionnel qui vous suit ; attendre les premières règles peut simplement faciliter la datation d’une future grossesse.

**Ai-je plus de risques de refaire une fausse couche ?**
Après une fausse couche isolée, les grossesses suivantes se déroulent généralement sans difficulté. On parle de fausses couches à répétition à partir de trois fausses couches consécutives avant 14 semaines, et un bilan est alors indispensable.

**Mon compagnon ne parle pas de la perte : est-ce qu’il s’en moque ?**
Chacun vit et exprime le deuil à sa façon. Le silence n’est pas forcément de l’indifférence. Proposer d’en parler, ou de voir un professionnel ensemble, peut aider.

## Quand demander conseil
Appelez le **15** ou le **112** en cas de saignements abondants, de malaise, de vertiges, d’accélération du cœur, ou de douleur intense du ventre qui peut irradier vers l’épaule. Consultez rapidement en cas de fièvre, de frissons ou de douleur qui augmente après la fausse couche. Si la tristesse, la culpabilité ou l’angoisse persistent ou vous envahissent, parlez-en à votre médecin ; en cas de détresse ou d’idées noires, appelez le **3114**, à toute heure.

${FIN}`,
  },
  {
    ...T, slug: 'fausses-couches-a-repetition-bilan', category: 'difficultes-conception',
    title: 'Fausses couches à répétition : définition, causes recherchées et bilan',
    summary: 'À partir de quand on parle de fausses couches à répétition, quelles causes un bilan cherche et comment s’y préparer.',
    tags: ['fausses couches à répétition', 'fausses couches répétées', 'bilan fausse couche', 'syndrome des antiphospholipides', 'caryotype', 'utérus cloisonné', 'hystéroscopie', 'thyroïde', 'SOPK', 'infertilité'],
    sources: [S.ameliFC, S.ameliBilan],
    body_md: `## En bref
- On parle de **fausses couches à répétition** à partir de **trois fausses couches spontanées consécutives avant 14 semaines**, chez une femme de moins de 40 ans, avec le même partenaire. Cela concerne environ **1,5 % des femmes**.
- Dans ce cas, un **bilan est indispensable** pour rechercher une cause.
- Les causes les plus fréquentes sont des anomalies de l’utérus, des anomalies génétiques du couple, des troubles hormonaux et des troubles de la coagulation, notamment le syndrome des antiphospholipides.
- Dans certains cas, **aucune cause n’est trouvée** ; un suivi attentif de la grossesse suivante reste possible.

## Comprendre
Une fausse couche isolée est fréquente et le plus souvent liée à une anomalie de développement de l’embryon, probablement chromosomique. Quand elles se répètent, l’hypothèse d’une cause commune devient plus probable, et le bilan prend tout son sens.

**Les causes recherchées, d’après l’Assurance Maladie :**
- **Malformations de l’utérus** : utérus cloisonné, exposition au Distilbène pendant la vie intra-utérine de la mère.
- **Anomalies de la cavité utérine** : polypes, fibromes, synéchies (accolements des parois).
- **Anomalies génétiques du couple** : certaines anomalies des chromosomes, sans symptôme chez les parents, peuvent se transmettre à l’embryon.
- **Troubles hormonaux** : insuffisance de sécrétion hormonale après l’ovulation, syndrome des ovaires polykystiques, troubles de la thyroïde, diabète.
- **Troubles de la coagulation**, notamment le **syndrome des antiphospholipides**.
- **Facteurs favorisants** : obésité, tabac, excès de café, d’alcool ou de drogues, exposition aux pesticides, carence en vitamine B9 ou B12, âge.

**Les examens possibles.** Ils reprennent ceux du bilan de fertilité, orientés vers ces causes : **échographie pelvienne**, **hystéroscopie** ou **hystérosalpingographie** pour explorer la cavité utérine, **prises de sang** hormonales (dont la thyroïde), recherche de troubles de la coagulation, et **caryotype** des deux partenaires à la recherche d’une anomalie chromosomique. Le médecin choisit les examens selon votre histoire.

## Au quotidien
- **Rassemblez les informations** sur chaque grossesse : dates, terme au moment de la fausse couche, comptes rendus d’échographie, d’hospitalisation ou d’analyse des tissus si elle a été faite, groupe sanguin, traitements reçus.
- **Venez à deux** si possible : le bilan concerne le couple, et certains examens (caryotype) concernent les deux partenaires.
- **Préparez vos questions** : quels examens, dans quel ordre, quels délais, que changeront les résultats ?
- **Prenez soin de vous entre deux examens.** L’attente des résultats peut raviver la douleur des pertes. Prévoyez des moments de répit et de soutien.
- **Agissez sur les facteurs modifiables** si vous le pouvez, avec de l’aide : arrêt du tabac, alimentation, vitamine B9 sur prescription. Ce n’est pas une question de faute, mais de moyens à votre portée.

## Questions fréquentes
**Faut-il attendre trois fausses couches pour demander un avis ?**
La définition retient trois fausses couches, mais rien ne vous empêche d’en parler plus tôt avec votre médecin, notamment si vous avez des antécédents médicaux ou une inquiétude importante. Il évaluera ce qui est utile.

**Si aucune cause n’est trouvée, que se passe-t-il ?**
C’est une situation possible. Elle est difficile à entendre, mais elle n’empêche pas une nouvelle grossesse. Le professionnel vous proposera un accompagnement adapté pour la suite.

**Qui consulter ?**
Votre gynécologue ou votre médecin traitant, qui pourra vous orienter vers une équipe spécialisée.

## Quand demander conseil
Pendant une grossesse, appelez le **15** ou le **112** en cas de saignements abondants, de malaise, de vertiges, de fièvre ou de douleur intense du ventre pouvant irradier vers l’épaule ; consultez dans la journée en cas de saignements modérés. Les fausses couches répétées sont une épreuve : si vous vous sentez submergée, sans espoir ou avez des idées noires, appelez le **3114**, à toute heure.

${FIN}`,
  },
  {
    ...TP, slug: 'enceinte-apres-fausse-couche-apprivoiser-inquietude', category: 'sante-mentale',
    title: 'Enceinte après une fausse couche : apprivoiser l’inquiétude',
    summary: 'Pourquoi l’angoisse est fréquente lors d’une grossesse qui suit une perte, comment être soutenue et quels signes doivent amener à demander de l’aide.',
    tags: ['grossesse après fausse couche', 'angoisse', 'anxiété grossesse', 'peur de perdre le bébé', 'grossesse arc-en-ciel', 'soutien psychologique', 'entretien prénatal précoce', 'deuil périnatal'],
    sources: [S.santeEmotions, S.ameliPsyGrossesse, S.ameliFC],
    body_md: `## En bref
- Après une fausse couche, une nouvelle grossesse peut faire coexister **joie et peur**. Cette ambivalence est fréquente et ne dit rien de votre capacité à être parent.
- Une **grossesse qui suit une grossesse douloureuse**, ou obtenue après une période d’infertilité, fait partie des situations où les émotions sont plus intenses, selon l’Assurance Maladie.
- Parlez de vos inquiétudes **à chaque consultation** : le médecin ou la sage-femme peut adapter l’accompagnement.
- L’**entretien prénatal précoce**, proposé au 4e mois, et les séances de **préparation à la naissance** sont des moments pour en parler.

## Comprendre
Quand une grossesse précédente s’est arrêtée, il est difficile de se projeter. Certaines femmes et certains partenaires décrivent une attente « en apnée » jusqu’au terme où la perte avait eu lieu, une vigilance de chaque instant face à la moindre sensation, ou la difficulté à annoncer la grossesse et à s’attacher. Santé.fr rapporte le témoignage d’une future mère si angoissée à l’idée de revivre une fausse couche qu’elle ne pensait plus qu’à cela, et qui a trouvé du soutien auprès de proches ayant vécu la même chose.

Ces émotions sont compréhensibles. Elles méritent d’être accueillies, car l’anxiété peut devenir épuisante. L’Assurance Maladie estime que l’anxiété concerne 5 à 15 % des femmes enceintes et la dépression environ 10 %. Il est conseillé de consulter quand l’anxiété devient intolérable, que les craintes sont permanentes ou obsédantes, en cas de crises d’angoisse, d’irritabilité permanente, de besoin très fréquent d’être rassurée ou de troubles du sommeil ou de l’alimentation.

**Un repère rassurant**, d’après l’Assurance Maladie : la fausse couche est le plus souvent isolée et les grossesses suivantes se déroulent généralement sans difficulté. De même, environ un quart des femmes ont un saignement au premier trimestre et poursuivent leur grossesse ; un saignement isolé n’annonce pas toujours une fausse couche.

## Au quotidien
- **Dites-le dès le premier rendez-vous** : « J’ai fait une fausse couche, je suis très inquiète. » Cela permet au professionnel de mieux vous accompagner.
- **Demandez ce qui est prévu** : dates des échographies, personne à joindre en cas de doute, conduite à tenir en cas de saignement.
- **Trouvez ce qui vous apaise** : marche, nature, respiration, musique, temps à deux ou seule. Allégez les obligations quand c’est possible.
- **Choisissez à qui annoncer la grossesse, et quand**, sans vous sentir obligée de suivre un calendrier.
- **Limitez les recherches en ligne** si elles augmentent l’angoisse ; notez plutôt vos questions pour la consultation.
- **Pensez au soutien psychologique** : psychologue, centre de PMI, dispositif Mon soutien psy (séances avec un psychologue conventionné prises en charge par l’Assurance Maladie, selon les conditions du dispositif), groupes de parole.
- **Associez votre partenaire** : il ou elle peut porter la même peur, ou une autre. Informez-le aussi des signes qui doivent vous faire demander de l’aide.

## Questions fréquentes
**Est-ce que mon stress peut provoquer une fausse couche ?**
Une fausse couche précoce isolée est le plus souvent due à une anomalie de développement de l’embryon. Prendre soin de votre stress est important pour vous, mais vous n’êtes pas responsable de ce qui est arrivé.

**Je n’arrive pas à me réjouir : est-ce que je vais mal aimer mon bébé ?**
Santé.fr rappelle qu’un inconfort ou des doutes pendant la grossesse n’annoncent pas un mauvais parent. L’attachement se construit progressivement, souvent au fil de la grossesse et après la naissance.

**Puis-je demander des examens supplémentaires pour être rassurée ?**
Parlez-en avec votre médecin ou votre sage-femme. Il vous dira ce qui est utile médicalement et pourra proposer un accompagnement adapté à votre inquiétude.

## Quand demander conseil
Appelez le **15** ou le **112** en cas de saignements abondants, de malaise, de vertiges, de fièvre ou de douleur intense du ventre ; consultez dans la journée en cas de saignements modérés ou de douleurs proches de celles des règles. Parlez rapidement à un professionnel si l’angoisse vous empêche de dormir, de manger ou de vivre votre quotidien, ou si une grande tristesse s’installe. En cas de détresse ou d’idées noires, appelez le **3114**, à toute heure.

${FIN}`,
  },
];
