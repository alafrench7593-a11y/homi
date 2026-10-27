/**
 * Guide complet — lot 21 (27/10/2026) : santé mentale et émotions des parents
 * (anxiété et peur de l'accouchement, entretiens prénatal et postnatal, dépression périnatale des deux parents,
 * psychose puerpérale, pensées intrusives, place du second parent, charge mentale, épuisement parental,
 * culpabilité, solitude, couple, reprise du travail, pleurs et « être à bout », néonatologie, deuil périnatal, 3114).
 * Articles rédigés avec l'aide d'une IA à partir de pages officielles ou de référence françaises réellement consultées le 2026-10-27
 * (Santé.fr / ministère de la Santé, Santé publique France – 1000 premiers jours, Psycom, Caf / Cnaf, MSA, info.gouv.fr,
 * Conseil national de l'Ordre des sages-femmes, Réseau de périnatalité de Normandie) : statut « À vérifier ».
 */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27. `published` = date de publication ou de mise à jour affichée par la page.
const S = {
  santeEPP: { label: 'Santé.fr (ministère chargé de la santé) — L’entretien prénatal précoce', url: 'https://www.sante.fr/node/19940569', consulted_on: C, published: '2026-08-31' },
  spfEPNP: { label: 'Santé publique France (BEH 2025, n° 14) — L’entretien postnatal précoce réalisé par les sages-femmes de PMI', url: 'https://www.santepubliquefrance.fr/sante-mentale/depression-et-anxiete/article/lentretien-postnatal-precoce-realise-par-les-sages-femmes-de-la-protection-maternelle-et-infantile', consulted_on: C, published: '2025-07-22' },
  santeMonSoutienPsy: { label: 'Santé.fr (ministère chargé de la santé) — Le remboursement des séances de psychologues : Mon soutien psy', url: 'https://www.sante.fr/node/7240885', consulted_on: C, published: '2024-09-20' },
  ppjBabyBlues: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Le baby blues et la dépression post-partum', url: 'https://www.sante.fr/node/1871157', consulted_on: C, published: '2025-10-20' },
  santeDPP: { label: 'Santé.fr (ministère chargé de la santé) — Dépression post-partum : un accompagnement possible', url: 'https://www.sante.fr/node/8776845', consulted_on: C, published: '2026-10-06' },
  ppjEmotions: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Les émotions pendant la grossesse', url: 'https://www.sante.fr/node/1871147', consulted_on: C, published: '2025-10-03' },
  ppjOrganisation: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — L’organisation du quotidien des parents', url: 'https://www.sante.fr/node/1871167', consulted_on: C, published: '2024-08-26' },
  ppjPleurs: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Calmer les pleurs de bébé', url: 'https://www.sante.fr/node/1875891', consulted_on: C, published: '2025-06-03' },
  sante3114: { label: 'Santé.fr — 3114, le numéro de prévention du suicide : « si vous vous posez la question d’appeler, c’est qu’il faut appeler »', url: 'https://www.sante.fr/node/9896945', consulted_on: C, published: '2025-02-06' },
  santeLignes: { label: 'Santé.fr — Trouver de l’aide en santé mentale : les lignes d’écoute', url: 'https://www.sante.fr/trouver-aide-sante-mentale/selon-votre-profil/lignes-ecoute', consulted_on: C },
  psycom: { label: 'Psycom — Santé mentale, grossesse et parentalité (brochure, édition mars 2025)', url: 'https://psycom.org/wp-content/uploads/2024/04/PSYCOM_Brochures-A5_SM_Grossesse_2025_WEB.pdf', consulted_on: C },
  spfEpuisement: { label: 'Santé publique France (La Santé en action n° 466, mai 2024) — Entourer les parents pour prévenir l’épuisement parental', url: 'https://www.santepubliquefrance.fr/sites/default/files/rdd/document/731835_spf00005245.pdf', consulted_on: C },
  infoInjonctions: { label: 'info.gouv.fr — Parents parfaits, enfants parfaits ? Comment les injonctions éducatives pèsent sur la santé mentale des parents', url: 'https://www.info.gouv.fr/actualite/parents-parfaits-enfants-parfaits-comment-les-injonctions-educatives-pesent-sur-la-sante-mentale-des-parents', consulted_on: C, published: '2026-07-31' },
  carnet1000j: { label: 'Ministère des Solidarités et de la Santé, Cnaf, Cnam, CCMSA — Les 1000 premiers jours : carnet de bienvenue dans la parentalité', url: 'https://solidarites.gouv.fr/sites/solidarite/files/2023-01/1000-premiers-jours-carnet-de-bienvenue-dans-la-parentalite_0.pdf', consulted_on: C },
  cnafAideDomicile: { label: 'Cnaf (communiqué) — L’aide à domicile pour les parents, une solution plus accessible en 2024 grâce à la Caf', url: 'https://www.caf.Fr/sites/default/files/medias/cnaf/Nous_connaitre/Presse/2024/240130%20Cp%20Laide%20%C3%A0%20domicile%20pour%20les%20parents%20une%20solution%20plus%20accessible%20en%202024%20gr%C3%A2ce%20%C3%A0%20la%20Caf%20FV.pdf', consulted_on: C, published: '2024-01-30' },
  cafLaep: { label: 'Caf — Livret des lieux d’accueil enfants-parents (LAEP)', url: 'https://www.caf.fr/sites/default/files/medias/771/vie_personnelle/2022/soutien-parents/livret_laep.pdf', consulted_on: C },
  cafAngoisses: { label: 'Caf (Vies de famille) — Angoisses pendant la grossesse : l’importance d’en parler', url: 'https://caf.fr/allocataires/vies-de-famille/articles/angoisses-pendant-la-grossesse-l-importance-d-en-parler', consulted_on: C, published: '2022-05-12' },
  cafPeurAccouchement: { label: 'Caf (Vies de famille) — Comment surmonter la peur de l’accouchement ?', url: 'https://caf.fr/allocataires/vies-de-famille/articles/comment-surmonter-la-peur-de-l-accouchement', consulted_on: C, published: '2022-05-13' },
  caf3114: { label: 'Caf (Vies de famille) — Crise suicidaire : un numéro pour oser en parler, le 3114', url: 'https://caf.fr/allocataires/vies-de-famille/articles/crise-suicidaire-un-numero-pour-oser-en-parler-le-3114-0', consulted_on: C, published: '2023-02-02' },
  cafDeuil: { label: 'Caf (Vies de famille) — Deuil périnatal : briser le tabou', url: 'https://caf.fr/allocataires/vies-de-famille/articles/deuil-perinatal-briser-le-tabou', consulted_on: C, published: '2022-05-12' },
  msaDeuil: { label: 'MSA / Caf — Guide « Deuil : décès d’un enfant avant la naissance »', url: 'https://mps.msa.fr/lfp/documents/11566/215320500/Guide+deuil+d%C3%A9c%C3%A8s+enfant+avant+la+naissance.pdf', consulted_on: C },
  ordreSFSansVie: { label: 'Conseil national de l’Ordre des sages-femmes — Quelles sont les règles de déclaration d’état civil d’un enfant né sans vie ?', url: 'https://www.ordre-sages-femmes.fr/faq/quelles-sont-les-regles-de-declaration-detat-civil-dun-enfant-ne-sans-vie/', consulted_on: C },
  perinatNormandie: { label: 'Réseau de périnatalité de Normandie — Enfant né sans vie ou né vivant non viable', url: 'https://www.perinat-normandie.fr/accouchement/accouchement-demarches/enfant-ne-sans-vie-ou-ne-vivant-non-viable/', consulted_on: C },
  charteNouveauNe: { label: 'info.gouv.fr — La charte du nouveau-né hospitalisé', url: 'https://www.info.gouv.fr/actualite/la-charte-du-nouveau-ne-hospitalise', consulted_on: C, published: '2021-11-19' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis d’un professionnel (médecin, sage-femme, psychologue ou psychiatre) qui connaît votre situation.';

const PREG = { journeys: ['pregnant'] as LibArticle['journeys'], status: 'to_review' as const };
const NEWBORN = { journeys: ['newborn', 'parents_sleep'] as LibArticle['journeys'], status: 'to_review' as const };
const PARENTS = { journeys: ['newborn', 'child', 'parents_sleep'] as LibArticle['journeys'], status: 'to_review' as const };
const PERI = { journeys: ['pregnant', 'newborn'] as LibArticle['journeys'], status: 'to_review' as const };

export const GUIDE_B21: LibArticle[] = [
  // ───────────────────────────── Grossesse : anxiété et peurs ─────────────────────────────
  {
    ...PREG,
    slug: 'anxiete-pendant-la-grossesse-peurs-et-soutien',
    title: 'Anxiété pendant la grossesse : comprendre ses peurs et trouver du soutien',
    summary: 'Peur de la fausse couche, de l’accouchement, de ne pas être « à la hauteur » : pourquoi les inquiétudes sont fréquentes pendant la grossesse, ce qui peut apaiser et quand l’angoisse mérite d’être accompagnée.',
    category: 'sante-mentale',
    body_md: `Attendre un enfant peut rendre heureuse et inquiète à la fois. Les peurs qui surgissent pendant ces neuf mois sont très répandues ; elles méritent d’être entendues, sans jugement, et parfois accompagnées.

## En bref
- Les inquiétudes sont fréquentes pendant la grossesse : peur de l’inconnu, de la fausse couche, de l’accouchement, de ne pas aimer son bébé ou de ne pas savoir s’en occuper.
- Selon la Caf, **5 à 15 % des femmes** développeraient des troubles anxieux pendant la grossesse : un phénomène courant, à ne pas négliger.
- **En parler** (couple, proches, professionnels) aide souvent à aller mieux et évite que le stress ne s’installe.
- L’**entretien prénatal précoce** et la préparation à la naissance sont des moments prévus pour parler de ses émotions.
- Si l’angoisse devient envahissante, un psychologue ou un psychiatre peut vous accompagner ; de nombreuses maternités proposent ces consultations.

## Comprendre
La grossesse bouscule beaucoup de repères en même temps : le corps se transforme, les hormones évoluent, les places changent dans la famille, au travail, parmi les amis. Santé publique France (1000 premiers jours) rappelle que ces changements soulèvent des questions légitimes : la grossesse va-t-elle bien se passer, le bébé sera-t-il en bonne santé, saurai-je m’en occuper, restera-t-il du temps pour moi et pour le couple ?

Les inquiétudes évoluent souvent au fil des trimestres. L’article de la Caf, qui s’appuie sur une psychologue clinicienne hospitalière, décrit :
- au **premier trimestre**, la peur de la fausse couche et un sentiment d’étrangeté, parfois amplifiés par les nausées et la fatigue ;
- au **deuxième trimestre**, le ventre devient visible et le regard des autres peut peser ;
- au **troisième trimestre**, les angoisses liées à l’accouchement, au rôle de parent, à la relation de couple et à la rencontre avec le bébé.

Il est aussi possible de désirer profondément un enfant et de vivre la grossesse comme pénible : cela ne fait pas de vous un mauvais parent. L’**ambivalence** (penser une chose et son contraire, changer d’avis d’un jour à l’autre) est fréquente, mais elle peut fatiguer. Le passage à la parentalité peut également réveiller des souvenirs ou des blessures anciennes.

## Au quotidien
- **Repérez ce qui vous apaise** et autorisez-vous à le faire : un moment seule au calme, du temps à deux ou avec des amis, lire, écouter de la musique, dessiner, marcher, être dans la nature.
- **Allégez les obligations** que vous vous imposez : triez ce qui est vraiment important pour retrouver du temps et un peu de recul.
- **Prenez soin de votre équilibre** : alimentation variée, activité physique adaptée, sommeil suffisant.
- **Triez les informations** : les récits très personnels ou alarmants lus en ligne ne disent rien de votre propre grossesse. Notez plutôt vos questions pour la prochaine consultation.
- **Parlez-en** : avec votre partenaire, une amie, une personne de la famille qui a vécu une situation proche. Une future mère citée par 1000 premiers jours raconte combien échanger avec des cousines ayant connu une fausse couche l’a soulagée.
- **Explorez des méthodes de détente** selon vos goûts : sophrologie, yoga, relaxation, haptonomie sont citées par la Caf.

## Questions fréquentes
**Je m’inquiète tout le temps pour le bébé. Est-ce que cela peut lui nuire ?**
S’inquiéter pour son enfant est très courant et ne fait pas de vous une « mauvaise » future mère. Si l’inquiétude prend beaucoup de place, en parler à la sage-femme ou au médecin permet de vous rassurer sur ce qui peut l’être et de trouver un soutien adapté.

**À qui en parler si je n’ose pas le dire à mes proches ?**
À la sage-femme ou au médecin qui suit la grossesse, en centre de PMI (protection maternelle et infantile), ou à un psychologue. Le dispositif Mon soutien psy permet un accompagnement psychologique remboursé, avec un accès direct à un psychologue conventionné.

**Mon conjoint aussi est stressé : est-ce fréquent ?**
Le futur second parent peut lui aussi traverser des doutes et des peurs, comme le montre un témoignage de futur père cité par 1000 premiers jours. L’entretien prénatal précoce peut se faire à deux.

**Les séances de préparation à la naissance peuvent-elles aider ?**
Elles permettent de comprendre le déroulement de la naissance, d’échanger avec d’autres futurs parents et d’évoquer ses émotions avec une sage-femme.

## Quand demander conseil
Consultez sans attendre si l’angoisse vous empêche de dormir, de manger ou de faire vos activités, si vous avez des crises de panique, si une tristesse s’installe plus de deux semaines ou si vous perdez l’envie de tout. En cas d’idées noires ou de pensées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['anxiété grossesse', 'angoisse enceinte', 'peur', 'stress grossesse', 'inquiétude', 'émotions', 'troubles anxieux', 'soutien psychologique'],
    sources: [S.ppjEmotions, S.cafAngoisses, S.santeMonSoutienPsy],
  },
  {
    ...PREG,
    slug: 'peur-de-l-accouchement-l-apprivoiser',
    title: 'Peur de l’accouchement : comment l’apprivoiser pendant la grossesse',
    summary: 'Douleur, complications, peur de ne pas réussir : d’où vient la crainte de l’accouchement et quelles pistes concrètes (information, préparation, hypnose, sophrologie, soutien du partenaire) peuvent aider à l’aborder plus sereinement.',
    category: 'sante-mentale',
    min_week: 12,
    max_week: 41,
    body_md: `« Et si je n’y arrivais pas ? » Beaucoup de futures mères redoutent le jour de la naissance, surtout lors d’une première grossesse ou après une expérience difficile. Cette peur peut s’apprivoiser, à son rythme.

## En bref
- La peur de l’accouchement est une crainte **courante**, plus fréquente lors d’une première grossesse ou après des difficultés médicales passées.
- Elle porte souvent sur la **douleur**, les **complications** ou la peur de **ne pas réussir à pousser**.
- S’informer auprès de professionnels, **trier les récits anxiogènes** et suivre la **préparation à la naissance** aident à se sentir plus prête.
- Hypnose, auto-hypnose, sophrologie et soutien du partenaire sont des pistes citées par la Caf.
- Si la peur devient envahissante, un accompagnement psychologique est possible.

## Comprendre
Au troisième trimestre, les angoisses liées à l’accouchement prennent souvent plus de place. La Caf, dans un article s’appuyant sur une sage-femme praticienne en hypnose, explique que ces craintes portent souvent sur l’inconnu, la douleur, la peur de complications ou celle de ne pas savoir pousser. Elles peuvent être plus fortes lors d’un premier bébé, ou lorsque l’on garde en mémoire un accouchement précédent difficile.

Santé publique France (1000 premiers jours) rappelle que les peurs liées à la naissance et à la douleur sont très répandues, et que beaucoup de femmes découvrent ce jour-là des forces insoupçonnées. La peur fait partie du chemin ; l’objectif n’est pas de la faire disparaître à tout prix, mais d’éviter qu’elle ne vous submerge.

La façon de regarder les contractions compte aussi. Selon la sage-femme interrogée par la Caf, les percevoir comme une force hostile venue de l’extérieur peut amplifier la peur ; les voir comme le travail de votre propre corps, qui rapproche de la rencontre avec bébé, aide souvent à mieux les vivre.

## Au quotidien
- **Posez vos questions personnelles** au gynécologue ou à la sage-femme : comment se passe le début du travail, quand partir à la maternité, quelles possibilités pour soulager la douleur, ce qui se passe en cas d’imprévu.
- **Faites le tri dans les récits** : chaque accouchement est singulier. Les témoignages très détaillés ou dramatiques, en ligne ou dans l’entourage, ne prédisent pas votre propre histoire. Vous pouvez dire gentiment : « Je préfère ne pas entendre ce récit pour l’instant ».
- **Suivez la préparation à la naissance et à la parentalité** : elle permet de comprendre le déroulé du jour J, la gestion des contractions et la poussée, et d’échanger avec d’autres futurs parents.
- **Testez des outils de détente** : respiration, relaxation, sophrologie, hypnose. La Caf indique que l’auto-hypnose peut s’apprendre en deux ou trois séances.
- **Impliquez votre partenaire ou un proche** : il ou elle peut vous encourager, vous rassurer et refaire avec vous les exercices de respiration.
- **Écrivez ce qui vous fait peur** puis apportez la liste à votre rendez-vous : mettre des mots sur la peur la rend souvent plus concrète, donc plus abordable.

## Questions fréquentes
**Mon premier accouchement s’est mal passé, j’ai peur que cela recommence. Que faire ?**
Parlez-en tôt à la sage-femme ou au médecin qui vous suit. Revenir sur ce qui s’est passé, comprendre ce qui pourrait être différent cette fois et préparer la suite avec l’équipe peut beaucoup apaiser. Un soutien psychologique peut aussi aider.

**L’entretien prénatal précoce peut-il servir à parler de cette peur ?**
Oui. Proposé dès la déclaration de grossesse, il accorde une place importante aux angoisses et permet d’envisager des solutions adaptées à votre situation.

**Mon partenaire a peur aussi. Comment l’aider à m’aider ?**
Il ou elle peut participer aux séances de préparation, apprendre les exercices de respiration et réfléchir avec vous à son rôle le jour J. Se sentir utile rassure souvent les deux parents.

**Et si la peur est si forte que je pense sans cesse à l’accouchement ?**
Une peur qui envahit les pensées, empêche de dormir ou provoque des crises d’angoisse mérite un accompagnement par un psychologue ou un psychiatre. Beaucoup de maternités proposent ce type de consultation.

## Quand demander conseil
Parlez-en à votre sage-femme ou à votre médecin dès que la peur vous gêne au quotidien. Si vous vous sentez submergée, sans issue, ou si des idées noires apparaissent, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de saignement, de perte de liquide, de contractions inhabituelles ou de baisse des mouvements du bébé, contactez la maternité ou appelez le **15** (ou le **112**).

${END}`,
    tags: ['peur accouchement', 'tocophobie', 'angoisse accouchement', 'préparation à la naissance', 'hypnose', 'sophrologie', 'douleur', 'troisième trimestre'],
    sources: [S.cafPeurAccouchement, S.cafAngoisses, S.ppjEmotions],
  },
  {
    ...PREG,
    slug: 'entretien-prenatal-precoce-parler-de-soi',
    title: 'L’entretien prénatal précoce : un temps pour parler de vous, pas seulement du bébé',
    summary: 'Obligatoire depuis 2020 et pris en charge à 100 %, l’entretien prénatal précoce est un moment d’écoute avec une sage-femme ou un médecin pour parler de vos émotions, de votre situation et de vos besoins d’accompagnement.',
    category: 'sante-mentale',
    body_md: `Ce rendez-vous ne ressemble pas aux autres consultations de grossesse : pas d’examen, pas de prise de sang, mais un temps pour parler. C’est souvent le premier endroit où l’on ose dire ce qui inquiète.

## En bref
- L’entretien prénatal précoce (EPP) est **obligatoire depuis mai 2020** ; il a été créé en 2007.
- Il est proposé **dès la déclaration de grossesse** (souvent autour du 4e mois) par une **sage-femme ou un médecin**, en libéral, en centre de PMI ou à la maternité.
- Il est **pris en charge à 100 %** par l’Assurance maladie.
- Ce n’est **pas une consultation médicale** : c’est un temps d’écoute et d’échange sur les dimensions psychologique, émotionnelle et sociale de la grossesse.
- Vous pouvez y venir **seule ou en couple**.

## Comprendre
Le ministère chargé de la santé présente l’EPP comme le premier temps clé du parcours des « 1000 premiers jours ». Son objectif est d’évaluer avec vous vos besoins d’accompagnement pendant la grossesse et après la naissance : besoin d’information, de soutien psychologique, d’aide sociale ou pratique.

Pourquoi parler d’émotions si tôt ? Parce que la grossesse est une période de grands changements, et que la plupart des difficultés psychiques de la période périnatale sont plus faciles à accompagner lorsqu’elles sont repérées tôt. Psycom rappelle que le manque de soutien, l’isolement, les violences, les antécédents de troubles psychiques, une grossesse non prévue ou un deuil font partie des situations qui fragilisent ; l’EPP permet d’en parler et d’être orientée si besoin.

Cet entretien est aussi l’occasion de poser toutes vos questions et d’exprimer vos souhaits pour la suite : préparation à la naissance, allaitement, retour à la maison, organisation du couple.

## Au quotidien
**Comment le préparer ?** Rien n’est obligatoire, mais quelques notes peuvent aider :
- ce qui vous réjouit et ce qui vous inquiète dans cette grossesse ;
- comment vous dormez, mangez, comment va votre moral ;
- qui peut vous aider autour de vous, et ce qui vous manque ;
- votre situation de travail, de logement, vos préoccupations financières ;
- des événements passés qui pèsent encore (grossesse précédente difficile, perte, accouchement mal vécu) ;
- vos questions sur l’accouchement, l’allaitement, les premières semaines.

**Pendant l’entretien**, vous pouvez dire « je ne sais pas » ou « je n’ai pas envie d’en parler maintenant ». Le professionnel n’est pas là pour juger mais pour comprendre. Si une question vous met mal à l’aise, vous pouvez le signaler.

**Après l’entretien**, le professionnel peut vous proposer, selon vos besoins, un suivi avec un psychologue, la PMI, un travailleur social, des séances de préparation adaptées ou d’autres ressources.

## Questions fréquentes
**Est-il trop tard si je suis déjà au 6e ou 7e mois ?**
Il est recommandé tôt, mais un entretien plus tardif garde tout son intérêt. Demandez-le à votre sage-femme, à votre médecin ou à la maternité.

**Mon partenaire peut-il venir ?**
Oui, vous pouvez venir en couple. Vous pouvez aussi choisir d’y aller seule, par exemple si certains sujets sont plus faciles à aborder sans lui ou sans elle.

**Que se passe-t-il si je dis que je ne vais pas bien ?**
Le professionnel vous écoute et réfléchit avec vous au soutien le plus adapté : consultations avec un psychologue (le dispositif Mon soutien psy permet jusqu’à 12 séances remboursées par année civile), suivi en PMI, orientation vers une équipe spécialisée. Dire que l’on va mal est le premier pas pour être aidée.

**L’EPP remplace-t-il les consultations prénatales ?**
Non. Il s’ajoute aux consultations médicales de suivi de grossesse, qui restent indispensables.

## Quand demander conseil
N’attendez pas l’EPP si vous vous sentez très mal : parlez-en à votre sage-femme, votre médecin ou la PMI. Si vous avez des idées noires ou suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, composez le **15** ou le **112** ; si vous subissez des violences, le **3919** vous écoute 24 h/24.

${END}`,
    tags: ['entretien prénatal précoce', 'EPP', 'sage-femme', 'PMI', '4e mois', 'parler de ses émotions', 'accompagnement grossesse', 'prise en charge'],
    sources: [S.santeEPP, S.psycom, S.santeMonSoutienPsy],
  },
  {
    ...NEWBORN,
    slug: 'entretien-postnatal-precoce-a-quoi-sert-il',
    title: 'L’entretien postnatal précoce : faire le point sur votre moral après la naissance',
    summary: 'Obligatoire depuis 2022, l’entretien postnatal précoce a lieu entre la 4e et la 8e semaine après l’accouchement pour repérer tôt les signes de dépression du post-partum et évaluer les besoins de la mère et du second parent.',
    category: 'post-partum',
    min_age_months: 0,
    max_age_months: 3,
    body_md: `Quelques semaines après la naissance, toutes les attentions sont souvent tournées vers le bébé. L’entretien postnatal précoce remet au centre la personne qui vient d’accoucher, et son entourage.

## En bref
- L’entretien postnatal précoce (EPNP) est **obligatoire en France depuis 2022**.
- Il se déroule **entre la 4e et la 8e semaine** après l’accouchement.
- Il vise à **repérer tôt les premiers signes de dépression du post-partum** ou ses facteurs de risque, et à **évaluer les besoins** de la mère ou de son conjoint.
- Il peut être réalisé notamment par une **sage-femme**, y compris en PMI.
- Il comprend souvent un **court questionnaire** de repérage de la dépression du post-partum, et peut déboucher sur une orientation vers un soutien adapté.

## Comprendre
Après une naissance, les émotions vont du bonheur à la fatigue extrême, en passant par le doute. Le baby blues touche une majorité de mères quelques jours après l’accouchement et passe en général en quelques jours. Mais lorsque le malaise dure plus de deux semaines ou s’intensifie, il peut s’agir d’une dépression du post-partum, qui concerne **15 à 20 % des femmes** ayant accouché d’après l’enquête nationale périnatale de 2021, citée par le ministère.

L’EPNP a été créé pour ne pas laisser ces difficultés passer inaperçues. Santé publique France a publié en 2025 une étude menée dans l’Hérault auprès de mères vues en entretien par des sages-femmes de PMI entre la 4e et la 8e semaine. Parmi elles, 40 % avaient vécu difficilement leur grossesse et 31 % leur accouchement ; la fatigue (73 %), l’isolement (39 %) et l’anxiété (33 %) étaient fréquemment rapportés. Près de 3 mères sur 10 présentaient des signes modérés à importants de dépression du post-partum au questionnaire de dépistage utilisé. Ces chiffres montrent combien ce temps de parole est utile.

Pendant l’entretien, le professionnel peut vous proposer de remplir un court questionnaire sur votre humeur des derniers jours. Ce n’est pas un examen à réussir : vos réponses servent à vous orienter.

## Au quotidien
- **Prenez rendez-vous** auprès de la sage-femme qui vous a suivie, de la maternité, de votre médecin ou de la PMI ; demandez-le si personne ne vous l’a proposé.
- **Notez ce qui a changé** depuis la naissance : sommeil (en dehors des réveils du bébé), appétit, envie de faire les choses, pleurs, irritabilité, inquiétudes, pensées qui vous font peur.
- **Revenez sur l’accouchement** si vous en gardez un souvenir difficile : c’est un sujet à part entière.
- **Parlez du retour à la maison** : qui vous aide, ce qui est lourd, ce dont vous auriez besoin (aide à domicile, relais, visites de la PMI).
- **Pensez au second parent** : l’entretien peut aussi évaluer ses besoins. Près d’un père sur dix traverse une dépression autour de la naissance.
- **Demandez si vous pouvez venir avec le bébé**, si c’est plus simple pour vous.

## Questions fréquentes
**Je vais bien, dois-je quand même y aller ?**
Oui, c’est un temps de prévention. Il permet aussi de parler de l’organisation, du sommeil, du couple, et de savoir vers qui se tourner si les choses changent dans les mois suivants.

**Quelle différence avec la consultation postnatale ?**
La consultation postnatale, réalisée dans les semaines qui suivent l’accouchement, est un examen médical. L’EPNP est un entretien centré sur votre état émotionnel et vos besoins.

**J’ai peur qu’on me juge si je dis que je n’éprouve pas encore beaucoup d’amour pour mon bébé : puis-je en parler ?**
Oui, c’est justement le lieu pour le dire. Les professionnels qui mènent ces entretiens sont là pour écouter sans juger et pour proposer un soutien si besoin.

**Et si les difficultés arrivent après la 8e semaine ?**
La dépression du post-partum peut apparaître dans les semaines ou les mois suivant la naissance. Vous pouvez consulter à tout moment votre médecin, votre sage-femme ou la PMI.

## Quand demander conseil
Consultez sans attendre l’EPNP si une tristesse, une anxiété ou un épuisement durent plus de deux semaines, ou si vous avez du mal à vous occuper de votre bébé. En cas de pensées suicidaires ou de peur de faire du mal à votre enfant, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, de confusion ou de comportement inhabituel après l’accouchement, appelez le **15** ou le **112**.

${END}`,
    tags: ['entretien postnatal précoce', 'EPNP', 'post-partum', 'dépression post-partum', 'baby blues', 'sage-femme', 'PMI', 'moral après accouchement'],
    sources: [S.spfEPNP, S.santeDPP, S.ppjBabyBlues],
  },
  {
    ...PREG,
    slug: 'depression-pendant-la-grossesse-reperer',
    title: 'Dépression pendant la grossesse : la reconnaître et se faire aider',
    summary: 'La dépression périnatale peut commencer dès la grossesse : ses signes, les situations qui fragilisent, ce qui aide et à qui s’adresser pour être soignée sans attendre la naissance.',
    category: 'sante-mentale',
    body_md: `On parle beaucoup de la dépression « après » la naissance. Pourtant, la dépression périnatale peut aussi commencer pendant la grossesse. La repérer tôt permet de se soigner et d’arriver à la naissance mieux entourée.

## En bref
- La **dépression périnatale** peut survenir **pendant la grossesse** ou au cours de la première année après la naissance.
- Selon Psycom, elle concerne environ **20 % des femmes** et **10 % des hommes** sur cette période.
- Elle se traduit par des symptômes **presque quotidiens pendant au moins deux semaines** : tristesse, perte d’intérêt, fatigue, troubles du sommeil ou de l’appétit, culpabilité, anxiété.
- Elle **se soigne** : soutien social, suivi psychologique et, selon les cas, traitement.
- Sage-femme, médecin, PMI, psychologue : il existe plusieurs portes d’entrée.

## Comprendre
Il est fréquent de traverser des hauts et des bas pendant la grossesse. La dépression se distingue par sa **durée** et son **intensité**. Psycom décrit des symptômes présents presque tous les jours pendant au moins deux semaines : humeur triste, perte d’intérêt ou de plaisir, anxiété, douleurs physiques, fatigue, troubles de l’appétit et du sommeil, difficultés de concentration, sentiment de culpabilité ou de désespoir. Parfois apparaissent des pensées qui font peur, comme la crainte de se faire du mal ou de faire du mal au bébé, ou des idées suicidaires.

Pendant la grossesse, certains signes (fatigue, sommeil perturbé, appétit modifié) peuvent ressembler aux changements physiques de cette période. N’hésitez pas à en parler : c’est au professionnel de faire la part des choses, surtout si la perte de plaisir ou la tristesse s’installent.

Plusieurs situations augmentent le risque, sans qu’aucune ne soit une fatalité : antécédents personnels ou familiaux de troubles psychiques, partenaire lui-même déprimé ou anxieux, manque de sommeil, événements stressants (déménagement, séparation, difficultés professionnelles), manque de soutien, violences, grossesse non prévue, complications médicales, deuil périnatal antérieur.

## Au quotidien
- **Parlez-en à un professionnel** : la sage-femme ou le médecin qui suit votre grossesse, la PMI, votre médecin traitant. L’entretien prénatal précoce est un bon moment, mais vous pouvez en parler à n’importe quelle consultation.
- **Consultez un psychologue** : avec Mon soutien psy, vous pouvez prendre rendez-vous directement avec un psychologue conventionné, jusqu’à 12 séances par année civile.
- **Si vous avez déjà un traitement** pour un trouble psychique, posez toutes vos questions à l’équipe qui vous suit avant toute décision ; ne modifiez rien de vous-même.
- **Acceptez l’aide concrète** : repas, courses, accompagnement aux rendez-vous. Dites précisément ce qui vous soulagerait.
- **Gardez de petits repères** : une sortie dehors chaque jour, un repas partagé, une activité douce. Ce ne sont pas des remèdes à eux seuls, mais ils soutiennent le soin.
- **Informez votre partenaire** de ce que vous traversez, pour qu’il ou elle puisse vous soutenir et prendre soin de sa propre santé mentale.

## Questions fréquentes
**Être déprimée enceinte, est-ce que cela veut dire que je ne veux pas de ce bébé ?**
Non. La dépression est une maladie, pas un manque d’amour. Il est possible de désirer profondément un enfant et d’aller mal pendant la grossesse.

**Est-ce que la dépression va forcément continuer après la naissance ?**
Personne ne peut le prédire. Être accompagnée dès la grossesse permet en revanche de préparer l’après-naissance, avec un soutien déjà en place au retour à la maison.

**Puis-je être soignée pendant la grossesse ?**
Oui. Le suivi psychologique, le soutien de l’entourage et, si besoin, un traitement décidé avec un médecin font partie des soins possibles. Dans certaines situations, une prise en charge spécialisée en psychiatrie périnatale peut être proposée.

**Je n’ose pas en parler de peur qu’on pense que je serai une mauvaise mère : comment faire ?**
Les professionnels de la périnatalité connaissent bien ces difficultés. En parler, c’est déjà prendre soin de vous et de votre bébé.

## Quand demander conseil
Consultez si la tristesse, la perte d’intérêt ou l’anxiété durent plus de deux semaines. En cas d’idées suicidaires, de sentiment qu’il n’y a plus d’issue ou de peur de vous faire du mal, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, appelez le **15** ou le **112**.

${END}`,
    tags: ['dépression grossesse', 'dépression périnatale', 'déprime enceinte', 'tristesse', 'santé mentale grossesse', 'psychologue', 'Mon soutien psy', 'facteurs de risque'],
    sources: [S.psycom, S.ppjEmotions, S.santeMonSoutienPsy],
  },
  {
    ...NEWBORN,
    slug: 'depression-post-partum-se-soigner',
    title: 'Dépression du post-partum : comment se soigner et qui peut aider',
    summary: 'La dépression du post-partum se soigne, et plus tôt elle est prise en charge, mieux c’est : les portes d’entrée vers le soin, le rôle du psychologue et du médecin, les unités parents-bébé et le soutien de l’entourage.',
    category: 'post-partum',
    min_age_months: 0,
    max_age_months: 12,
    body_md: `Vous avez reconnu chez vous des signes de dépression du post-partum, ou un proche s’inquiète pour vous ? L’étape suivante est souvent la plus difficile : demander de l’aide. Voici comment s’organisent les soins.

## En bref
- La dépression du post-partum est **une maladie qui se soigne**, généralement avec un accompagnement et souvent un traitement.
- **Plus elle est prise en charge tôt**, plus ses conséquences peuvent être limitées.
- Les portes d’entrée sont nombreuses : **sage-femme, médecin traitant, PMI, psychologue, consultation de psychiatrie périnatale**.
- Le dispositif **Mon soutien psy** permet des séances chez un psychologue conventionné, en accès direct.
- Dans certaines situations, une **hospitalisation en unité mère-enfant ou parents-bébé** permet de soigner le parent sans le séparer de son bébé.

## Comprendre
D’après l’enquête nationale périnatale de 2021, citée par le ministère chargé de la santé, 15 à 20 % des femmes ayant accouché sont concernées. Santé publique France (1000 premiers jours) précise qu’elle apparaît souvent progressivement, dans les semaines ou les mois suivant la naissance, et qu’elle peut durer des mois, parfois plus d’un an si rien n’est fait. Beaucoup de situations ne sont pas identifiées.

Les signes à connaître : manque d’énergie, difficulté à s’occuper du bébé ou des tâches du quotidien, perte de plaisir, tristesse profonde, pensées négatives ou sentiment d’incompétence, troubles du sommeil et de l’appétit. La maladie peut peser sur la qualité de vie, le couple et la relation avec l’enfant ; dans les cas les plus graves, elle peut entraîner des pensées suicidaires.

Le soin repose sur plusieurs piliers, que Psycom résume ainsi : le **soutien social**, un **suivi psychologique** et, **selon les cas, un traitement médicamenteux** décidé avec un médecin. Lorsque c’est nécessaire, une hospitalisation dans une unité mère-enfant ou parents-bébé permet d’être soignée tout en gardant le lien avec son enfant.

## Au quotidien
**Premier pas : en parler à un professionnel.** Vous pouvez dire simplement : « Depuis la naissance, je ne me sens pas bien, et cela dure. » La sage-femme, le médecin traitant, la puéricultrice ou la PMI vous orienteront.

**Le psychologue** : avec Mon soutien psy, vous pouvez prendre rendez-vous directement avec un psychologue conventionné (annuaire sur le site de l’Assurance maladie), dans la limite de 12 séances par année civile. Les séances sont remboursées, sans dépassement d’honoraires. Le médecin reste utile pour orienter, notamment en cas de signes d’alerte.

**Le psychiatre ou l’équipe de psychiatrie périnatale** : si la dépression est plus sévère, un suivi spécialisé peut être proposé, parfois à l’hôpital.

**L’entourage** : pendant les soins, l’aide concrète compte beaucoup. Laissez votre partenaire, un proche ou une aide à domicile (la Caf et la PMI peuvent vous renseigner) prendre en charge une partie des nuits, des repas, du ménage.

**Les lieux de parole** : groupes de parents, lieux d’accueil enfants-parents, associations de soutien à la parentalité permettent de rompre l’isolement.

## Questions fréquentes
**Combien de temps faut-il pour aller mieux ?**
Cela dépend des personnes et de la sévérité. L’important est de commencer tôt et de ne pas interrompre le suivi dès les premiers progrès sans en parler avec le professionnel.

**Puis-je continuer d’allaiter si on me propose un traitement ?**
Posez la question au médecin qui prescrit, en lui précisant que vous allaitez. Ne modifiez pas un traitement de vous-même.

**Mon partenaire ne comprend pas ce qui m’arrive. Que lui dire ?**
Que la dépression du post-partum est une maladie fréquente, qui se soigne, et que son soutien concret aide. Vous pouvez lui proposer de venir à une consultation avec vous. Il ou elle doit aussi être attentif à sa propre santé mentale.

**Est-ce que mon bébé va en souffrir ?**
Se soigner est justement la meilleure façon de protéger la relation avec votre enfant. Les professionnels peuvent aussi vous accompagner dans le lien avec votre bébé.

## Quand demander conseil
Consultez dès que les symptômes durent plus de deux semaines. En cas d’idées suicidaires, de sentiment que votre famille serait mieux sans vous, ou de peur de faire du mal à votre bébé, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, de confusion, d’agitation ou de propos inhabituels, appelez le **15** ou le **112**. Si vous craignez pour la sécurité d’un enfant, le **119** est joignable 24 h/24.

${END}`,
    tags: ['dépression post-partum', 'soigner dépression post-partum', 'psychiatrie périnatale', 'unité mère-enfant', 'Mon soutien psy', 'psychologue', 'post-partum', 'moral après bébé'],
    sources: [S.santeDPP, S.ppjBabyBlues, S.psycom],
  },
  {
    ...NEWBORN,
    slug: 'psychose-puerperale-signes-urgence',
    title: 'Psychose du post-partum : les signes qui doivent faire appeler les urgences',
    summary: 'Rare mais grave, la psychose puerpérale survient en général dans les deux semaines qui suivent l’accouchement : comment la distinguer du baby blues et de la dépression, et pourquoi il faut appeler le 15 sans attendre.',
    category: 'post-partum',
    safety_critical: true,
    min_age_months: 0,
    max_age_months: 2,
    body_md: `La psychose du post-partum (ou psychose puerpérale) est rare, mais c’est une urgence médicale. La connaître permet à l’entourage de réagir vite.

## En bref
- Elle touche **1 à 2 femmes pour 1 000 naissances**, selon Psycom.
- Elle survient en général **dans les deux semaines suivant l’accouchement**.
- Elle se manifeste par un **épisode délirant** : agitation, insomnie totale, propos incohérents, hallucinations, comportement inhabituel.
- Elle est **totalement différente** du baby blues et de la dépression du post-partum.
- Il faut **contacter les urgences (15 ou 112)** sans attendre : elle se soigne, mais elle nécessite des soins rapides.

## Comprendre
Après une naissance, trois situations très différentes peuvent être confondues :
- le **baby blues**, fréquent (50 à 80 % des mères), qui apparaît environ 2 à 4 jours après l’accouchement et dure de quelques heures à quelques jours : pleurs, irritabilité, sentiment d’être dépassée ;
- la **dépression du post-partum**, qui s’installe plus progressivement et dure plus de deux semaines : tristesse, perte de plaisir, épuisement ;
- la **psychose puerpérale**, plus rare, où la personne perd le contact avec la réalité.

Psycom décrit la psychose puerpérale comme un épisode délirant, avec agitation, insomnie totale, propos incohérents, hallucinations, et un risque pour la mère ou pour l’enfant. Concrètement, l’entourage peut remarquer des propos qui n’ont pas de sens, une agitation inhabituelle, une absence totale de sommeil, ou des perceptions que les autres ne partagent pas (hallucinations).

Certains troubles psychiques, comme les troubles bipolaires, peuvent aussi apparaître pour la première fois ou s’aggraver pendant la période périnatale. Pour une femme déjà suivie pour un trouble psychique, Psycom recommande d’en parler dès le projet de grossesse avec l’équipe qui la suit, afin d’anticiper la période qui suit la naissance.

## Au quotidien
Ce que l’entourage peut faire :
- **Ne pas minimiser** un changement de comportement inquiétant en le mettant sur le compte de la fatigue.
- **Appeler le 15 (ou le 112)** dès que des signes évocateurs apparaissent, en décrivant précisément ce que vous observez.
- **Ne pas laisser la mère seule avec le bébé** en attendant l’aide, sans la brusquer : restez calme, rassurant, présent.
- **Prévenir la maternité** si la sortie est récente : l’équipe connaît le dossier.
- **Rassembler les informations utiles** : date de l’accouchement, traitements en cours, antécédents connus.

Pour les femmes déjà suivies pour un trouble psychique ou ayant des antécédents familiaux, préparer avec les soignants un « plan » pour les premières semaines (qui alerter, quels signes surveiller, comment protéger le sommeil) peut aider.

Les soins peuvent nécessiter une hospitalisation ; une unité mère-enfant ou parents-bébé permet alors de soigner la mère en préservant le lien avec son enfant.

## Questions fréquentes
**Comment faire la différence avec un gros baby blues ?**
Dans le baby blues, la mère est émue, fatiguée, pleure facilement, mais reste en contact avec la réalité. Dans la psychose, le discours devient incohérent, des idées délirantes ou des hallucinations apparaissent, le sommeil disparaît complètement. Au moindre doute, appelez le 15 : ce sont les professionnels qui feront la différence.

**Est-ce que cela arrive seulement aux femmes qui ont déjà eu des problèmes psychiques ?**
Les antécédents personnels ou familiaux font partie des facteurs de risque cités par Psycom. Mais l’absence d’antécédent ne doit pas faire écarter des signes inquiétants : au moindre doute, appelez le 15.

**La mère pourra-t-elle s’occuper de son bébé après ?**
La psychose puerpérale se soigne. L’accompagnement, parfois en unité mère-enfant, vise justement à rétablir la santé de la mère et à soutenir la relation avec le bébé.

**Le second parent peut-il être aidé lui aussi ?**
Oui. Vivre cette situation est éprouvant. Il peut en parler au médecin traitant, à un psychologue, ou appeler le 3114 en cas de détresse.

## Quand demander conseil
Appelez immédiatement le **15** ou le **112** en cas d’agitation, d’insomnie totale, de propos incohérents, d’hallucinations, d’idées étranges au sujet du bébé ou de risque pour la mère ou l’enfant. Pour une détresse psychique ou des idées suicidaires, le **3114** répond 24 h/24, 7 j/7. Si un enfant est en danger, le **119** est joignable à tout moment.

${END}`,
    tags: ['psychose puerpérale', 'psychose post-partum', 'urgence psychiatrique', 'délire après accouchement', 'insomnie', 'hallucinations', 'unité mère-enfant', 'trouble bipolaire'],
    sources: [S.psycom, S.ppjBabyBlues],
  },
  {
    ...NEWBORN,
    slug: 'pensees-effrayantes-peur-de-faire-du-mal-a-bebe',
    title: 'Pensées effrayantes après la naissance : « Et si je faisais du mal à mon bébé ? »',
    summary: 'Des pensées qui surgissent malgré soi, comme la peur de laisser tomber son bébé ou de lui faire du mal, font partie des symptômes décrits dans l’anxiété et la dépression périnatales : pourquoi en parler, et à qui.',
    category: 'sante-mentale',
    min_age_months: 0,
    max_age_months: 12,
    body_md: `Certains parents sont assaillis, après la naissance, par des images ou des pensées qui les terrifient : le bébé qui tombe, un geste dangereux, un accident. Ces pensées font honte, alors on les tait. Pourtant, en parler est souvent le premier soulagement.

## En bref
- Les **troubles anxieux** concernent environ **15 % des parents** pendant la période périnatale, selon Psycom.
- La peur de se faire du mal ou de faire du mal au bébé (appelée **phobie d’impulsion**) figure parmi les symptômes décrits dans la **dépression périnatale**.
- Ces pensées surgissent **malgré soi** et font souvent honte : on les tait, alors qu’elles méritent d’être dites.
- Elles méritent d’être **dites à un professionnel**, qui saura faire la part des choses et proposer un accompagnement.
- Si vous sentez que vous pourriez passer à l’acte, il s’agit d’une **urgence**.

## Comprendre
Devenir parent rend hypervigilant : on guette la respiration du bébé, on vérifie, on anticipe les dangers. Chez certains parents, cette vigilance se transforme en pensées intrusives, qui s’imposent sans qu’on le veuille : « Et si je le lâchais dans l’escalier ? », « Et si je le noyais dans le bain ? ». Ces pensées provoquent de l’effroi, de la culpabilité et poussent souvent à éviter certaines situations (ne plus donner le bain, ne plus porter le bébé près d’une fenêtre).

Psycom cite ces « phobies d’impulsion » parmi les symptômes possibles de la dépression périnatale, aux côtés de la tristesse, de l’anxiété, de la fatigue et du sentiment de culpabilité. Les troubles anxieux sont eux aussi fréquents à cette période. Le manque de sommeil, un accouchement difficile, un bébé qui a eu des soucis de santé ou un manque de soutien peuvent les favoriser.

Seul un professionnel peut évaluer votre situation : c’est pourquoi il est important d’en parler plutôt que de rester seul avec ces pensées.

## Au quotidien
- **Mettez des mots** : « J’ai des pensées qui me font peur à propos de mon bébé. » Vous pouvez le dire à votre sage-femme, votre médecin, la puéricultrice de PMI ou un psychologue. Ces professionnels accompagnent les difficultés psychiques de la période périnatale.
- **Évitez de rester seul avec la honte** : en parler à votre partenaire ou à un proche de confiance permet aussi d’organiser des relais.
- **Protégez votre sommeil** autant que possible : organisez des nuits ou des siestes de récupération, en confiant le bébé à l’autre parent ou à un proche.
- **Ne vous imposez pas l’isolement** : sortir, voir d’autres parents (lieux d’accueil enfants-parents, groupes de PMI) aide à relativiser.
- **Si une situation vous angoisse trop** (bain, change sur une table en hauteur), demandez à quelqu’un de la faire avec vous le temps d’être accompagné.
- **Un suivi psychologique** peut aider à comprendre et apaiser ces pensées ; Mon soutien psy permet de consulter directement un psychologue conventionné.

## Questions fréquentes
**Avoir ces pensées veut-il dire que je suis dangereux pour mon enfant ?**
Ces pensées sont décrites comme des symptômes d’anxiété ou de dépression périnatale, vécus avec effroi par les parents. Seul un professionnel peut évaluer votre situation : en parler est la meilleure protection pour vous et pour votre enfant.

**Va-t-on me retirer mon bébé si j’en parle ?**
Les professionnels de la périnatalité sont là pour vous soigner et soutenir le lien avec votre enfant. Parler de ce que vous vivez permet de mettre en place l’aide adaptée, pour vous comme pour lui.

**Le second parent peut-il aussi vivre cela ?**
Oui. Les troubles anxieux et la dépression périnatale touchent aussi les pères et les seconds parents, qui peuvent consulter de la même façon.

**Ces pensées vont-elles disparaître ?**
Un accompagnement adapté aide à les comprendre et à les apaiser. Plus on en parle tôt, plus l’aide peut se mettre en place rapidement.

## Quand demander conseil
Parlez-en dès que ces pensées reviennent souvent, vous font peur ou vous conduisent à éviter votre bébé. Si vous sentez que vous pourriez passer à l’acte, mettez le bébé en sécurité dans son lit, éloignez-vous et appelez le **15** ou le **112**. En cas d’idées suicidaires ou de détresse, le **3114** répond 24 h/24, 7 j/7. Si vous êtes inquiet pour la sécurité d’un enfant, appelez le **119**.

${END}`,
    tags: ['pensées intrusives', 'phobie d’impulsion', 'peur de faire du mal à bébé', 'anxiété post-partum', 'TOC post-partum', 'dépression périnatale', 'honte', 'culpabilité'],
    sources: [S.psycom, S.santeMonSoutienPsy, S.santeLignes],
  },
  {
    ...PERI,
    slug: 'depression-du-pere-second-parent',
    title: 'Dépression du père ou du second parent : des signes souvent différents',
    summary: 'Environ un père sur dix traverse une dépression pendant la grossesse ou après la naissance : irritabilité, retrait, alcool, envie de fuir… comment la reconnaître et où trouver de l’aide.',
    category: 'sante-mentale',
    body_md: `On imagine souvent que la dépression autour de la naissance ne concerne que les mères. Pourtant, les pères et les seconds parents peuvent aussi être touchés, avec des signes qui passent plus facilement inaperçus.

## En bref
- **Près d’un père sur dix** traverse une dépression pendant la grossesse ou peu après la naissance, selon Santé publique France (1000 premiers jours) et Psycom.
- Le **principal facteur de risque** est une dépression chez la partenaire.
- Les signes peuvent être **différents** : irritabilité, colère, retrait, consommation d’alcool ou de drogues, conflits dans le couple, envie de quitter le domicile.
- Le **burn-out parental** peut avoir chez les pères des conséquences particulièrement graves, selon Santé publique France.
- Médecin traitant, psychologue, PMI, lignes d’écoute : les mêmes aides sont ouvertes au second parent.

## Comprendre
L’arrivée d’un enfant bouleverse aussi celui ou celle qui n’a pas porté la grossesse : nouvelles responsabilités, fatigue, changement dans le couple, parfois le sentiment de ne pas trouver sa place.

Santé publique France (1000 premiers jours) décrit des signes possibles chez le père : doutes, perte de confiance en soi, désintérêt pour le bébé, envie de quitter le domicile, peur d’être jugé, sentiment de ne pas trouver sa place. Ils peuvent s’accompagner d’anxiété, de consommation d’alcool ou de drogues, de troubles du sommeil ou de conflits conjugaux. Psycom ajoute l’irritabilité, la colère et le retrait social.

Ces manifestations sont souvent interprétées comme de la mauvaise humeur, du stress au travail ou un manque d’implication, ce qui retarde l’aide. Or, lorsque la mère souffre elle-même de dépression du post-partum, le second parent doit être particulièrement attentif à sa propre santé mentale.

Le stress chronique lié à la parentalité peut aussi conduire à un épuisement parental. L’article de *La Santé en action* consacré à ce sujet souligne que ses conséquences peuvent être plus graves chez les pères, notamment en termes d’idées suicidaires.

## Au quotidien
- **Repérez les changements qui durent** : vous rentrez de plus en plus tard pour éviter la maison, vous buvez davantage, vous vous énervez pour un rien, vous ne prenez plus de plaisir à rien.
- **Parlez-en** : à votre partenaire, à un ami, à votre médecin traitant. Dire « je ne vais pas bien depuis la naissance » est un acte de responsabilité, pas une faiblesse.
- **Prenez votre place auprès du bébé** à votre façon : jouer, parler, chanter, porter, bercer, donner le bain, faire du peau à peau sont autant d’occasions de créer le lien.
- **Utilisez les rendez-vous prévus** : l’entretien prénatal précoce peut se faire en couple, et l’entretien postnatal précoce peut aussi évaluer les besoins du conjoint.
- **Consultez un psychologue** : Mon soutien psy est ouvert à tous, sans passage obligatoire par un médecin.
- **Soyez attentif à votre consommation d’alcool** : son augmentation fait partie des signes possibles de dépression chez les pères, selon Psycom.

## Questions fréquentes
**Ma compagne est en dépression du post-partum. Puis-je dire que moi aussi je vais mal ?**
Oui. Prendre soin de vous fait partie du soutien que vous lui apportez. Vous pouvez consulter de votre côté et en parler ensemble avec un professionnel.

**Je n’arrive pas à m’attacher au bébé. Est-ce grave ?**
Le désintérêt pour le bébé fait partie des signes décrits par 1000 premiers jours chez les pères qui vont mal : ce ressenti mérite d’être entendu. Parlez-en à un professionnel, surtout s’il s’accompagne de tristesse, de retrait ou d’irritabilité qui durent.

**Les seconds parents dans un couple de femmes sont-ils concernés ?**
Les sources parlent surtout des pères, mais tout parent qui accueille un enfant peut traverser une période difficile : les mêmes aides lui sont ouvertes.

## Quand demander conseil
Consultez si les signes durent plus de deux semaines, si vous consommez plus d’alcool ou de substances, ou si la colère vous fait peur. En cas d’idées suicidaires ou de sentiment d’être un poids, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, composez le **15** ou le **112**. Si vous craignez pour la sécurité de votre enfant, le **119** répond à tout moment.

${END}`,
    tags: ['dépression paternelle', 'père déprimé', 'second parent', 'dépression post-partum père', 'irritabilité', 'alcool', 'co-parent', 'santé mentale des pères'],
    sources: [S.ppjBabyBlues, S.psycom, S.spfEpuisement],
  },
  {
    ...PERI,
    slug: 'trouver-sa-place-pere-second-parent',
    title: 'Père ou second parent : trouver sa place avant et après la naissance',
    summary: 'Se sentir à l’écart pendant la grossesse ou l’allaitement, douter de savoir faire, craindre que le couple change : des idées concrètes pour créer le lien avec le bébé et prendre sa part sans s’épuiser.',
    category: 'sante-mentale',
    body_md: `Pendant la grossesse, tout semble se passer dans le corps de l’autre. Après la naissance, l’allaitement, les visites et les conseils se concentrent souvent sur la mère. Beaucoup de pères et de seconds parents se demandent alors : « Et moi, où est ma place ? »

## En bref
- Le père ou second parent peut **se sentir exclu**, notamment quand la mère allaite, et craigne de ne pas créer de lien avec l’enfant.
- Le lien se tisse par **de nombreux gestes** : jouer, parler, chanter, porter, bercer, câliner, donner le bain, faire du peau à peau.
- Les congés liés à la naissance permettent de **prendre ses marques** à la maison.
- Partager les tâches **protège les deux parents** du stress et de la fatigue.
- Le second parent a, lui aussi, droit à des **doutes** et à un **soutien**.

## Comprendre
Le carnet des 1000 premiers jours, édité par les pouvoirs publics, le dit simplement : le père ou second parent peut se sentir mis à l’écart, surtout pendant l’allaitement, et avoir peur de ne pas réussir à créer un lien avec son bébé. Pourtant, de nombreuses activités permettent de construire ce lien dès les premiers jours.

Pendant la grossesse aussi, les émotions sont présentes. Santé publique France (1000 premiers jours) rapporte le témoignage d’un futur père heureux de l’arrivée du bébé, mais inquiet que sa compagne l’aime moins ensuite. Ces sentiments mélangés sont fréquents ; ils gagnent à être partagés plutôt que gardés pour soi.

Enfin, la place du second parent ne se résume pas à « aider » : c’est une **co-responsabilité**. Santé publique France rappelle que la charge du quotidien (tâches et anticipation) repose souvent sur les mères, ce qui accroît leur stress, leur fatigue et le risque de dépression du post-partum. Un meilleur partage protège chacun et libère du temps pour le bébé et le couple.

## Au quotidien
**Pendant la grossesse**
- Venez aux rendez-vous quand c’est possible, notamment l’**entretien prénatal précoce** (il peut se faire en couple) et les séances de **préparation à la naissance**.
- Parlez avec votre partenaire de la façon dont vous imaginez les premières semaines : nuits, visites, répartition des tâches, congés.
- Renseignez-vous tôt sur votre **congé de paternité et d’accueil de l’enfant** auprès de votre employeur et de votre caisse.

**Après la naissance**
- **Prenez des moments rien qu’à vous deux** avec le bébé : le bain, le change, le peau à peau, la promenade en porte-bébé, une chanson le soir.
- **Si la mère allaite**, vous pouvez apporter le bébé pour les tétées de nuit, le recoucher, assurer le change et le câlin qui suit. Si elle tire son lait, vous pouvez donner certains biberons de lait maternel.
- **Prenez en charge des domaines entiers** (courses, repas, rendez-vous du bébé) plutôt que d’attendre des consignes : cela aide à alléger la charge mentale.
- **Acceptez de faire à votre façon** : pour le bébé, l’essentiel est la douceur et la disponibilité, pas la perfection des gestes.
- **Gardez du temps pour le couple**, même court : un repas sans écran, quelques minutes pour se dire comment chacun va.

## Questions fréquentes
**Je me sens maladroit avec le bébé. Comment prendre confiance ?**
La confiance vient avec la pratique. Demandez à la sage-femme ou à la puéricultrice de PMI de vous montrer les gestes, puis faites-les régulièrement, seul avec le bébé.

**Le bébé se calme mieux avec sa mère : est-ce que je m’y prends mal ?**
Pas forcément. Chaque parent trouve ses propres façons d’apaiser le bébé, et cela demande du temps passé ensemble : restez régulièrement seul avec lui pour développer vos gestes à vous.

**Je suis fatigué et je reprends vite le travail. Comment tenir ?**
Parlez-en ensemble pour organiser des temps de repos pour chacun. Si la fatigue, l’irritabilité ou la tristesse s’installent, consultez : le second parent peut aussi faire une dépression autour de la naissance.

## Quand demander conseil
Parlez à votre médecin ou à un psychologue si vous vous sentez durablement à l’écart, triste, irritable ou si vous avez envie de fuir la maison. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['père', 'second parent', 'co-parent', 'place du père', 'lien avec bébé', 'peau à peau', 'congé paternité', 'partage des tâches'],
    sources: [S.carnet1000j, S.ppjOrganisation, S.ppjEmotions],
  },
  {
    ...PARENTS,
    slug: 'charge-mentale-parentale-mieux-partager',
    title: 'Charge mentale des parents : la repérer et mieux la partager',
    summary: 'Penser aux repas, aux rendez-vous, aux vaccins, aux vêtements trop petits : la charge mentale pèse souvent sur un seul parent et augmente le stress et le risque de dépression. Des pistes concrètes pour la répartir.',
    category: 'sante-mentale',
    body_md: `« Tu n’avais qu’à me demander ! » Cette phrase résume bien la charge mentale : ce n’est pas seulement faire les tâches, c’est penser à tout, tout le temps, et devoir les rappeler aux autres.

## En bref
- La **charge mentale** désigne l’anticipation et l’organisation du quotidien : repas, courses, rendez-vous, papiers, affaires de l’enfant.
- Avec un bébé, les tâches ménagères et cette charge **augmentent fortement**.
- Selon Santé publique France, elle repose **souvent sur les femmes**, ce qui accroît le stress, la fatigue et le **risque de dépression du post-partum**.
- La charge mentale et le manque de soutien font partie des **facteurs d’épuisement parental**.
- Dialoguer, revoir ses exigences, accepter la façon de faire de l’autre et se faire aider sont les principaux leviers.

## Comprendre
La page « L’organisation du quotidien des parents » de Santé publique France (1000 premiers jours) explique que l’arrivée d’un bébé démultiplie les tâches et la charge mentale. Mieux équilibrer le partage protège chacun et libère du temps pour le bébé, le couple et soi.

La charge mentale est souvent invisible : elle ne se voit pas dans la liste des tâches faites, mais dans la liste de celles auxquelles il faut penser. Celui ou celle qui la porte se sent responsable de tout ; l’autre peut être de bonne volonté, mais attendre qu’on lui dise quoi faire, ce qui maintient le déséquilibre.

L’article de *La Santé en action* sur l’épuisement parental cite la charge de travail importante et la charge mentale, notamment pour les mères, parmi les facteurs de risque, à côté du perfectionnisme, des difficultés d’organisation et du manque de soutien. À l’inverse, le **soutien du second parent** fait partie des principales ressources protectrices.

## Au quotidien
**Rendre la charge visible**
- Listez ensemble, pendant une semaine, tout ce qui doit être pensé et fait : repas, linge, courses, rendez-vous médicaux, vaccins, crèche, papiers Caf, anniversaires, vêtements à racheter…
- Repérez qui y pense, et pas seulement qui l’exécute.

**Répartir des domaines entiers**
- Plutôt que de « donner un coup de main », chaque parent prend la responsabilité complète d’un domaine : par exemple l’un gère les repas de la semaine (menus, courses, cuisine), l’autre le suivi médical du bébé (rendez-vous, carnet de santé, ordonnances).
- Utilisez un agenda partagé et une liste de courses commune.

**Revoir le niveau d’exigence**
- Santé publique France le dit clairement : passer du temps avec bébé est plus profitable que faire le ménage à fond.
- Acceptez que l’autre fasse différemment : pour le bébé, ce qui compte est la douceur et l’attention, pas la perfection.

**Se faire aider**
- Entraide entre parents (courses groupées), proches pour un service ponctuel, garde occasionnelle pour souffler.
- La PMI et la Caf peuvent renseigner sur une aide à domicile.

**Faire le point régulièrement**
- Un court moment chaque semaine pour ajuster : qu’est-ce qui pèse ? qu’est-ce qui a marché ?

## Questions fréquentes
**Mon partenaire dit qu’il en fait déjà beaucoup. Comment en parler sans dispute ?**
Partez de la liste concrète plutôt que des reproches, et parlez de vos besoins (« j’ai besoin de ne plus penser aux rendez-vous ») plutôt que de ses manques. Le but est d’organiser, pas de compter les points.

**Je n’arrive pas à lâcher prise, j’ai peur que ce soit mal fait : que faire ?**
Commencez par un domaine où l’enjeu est faible, et laissez l’autre s’en occuper entièrement, à sa manière.

**Je suis parent solo, comment alléger ma charge ?**
Simplifiez au maximum, acceptez l’aide proposée et renseignez-vous auprès de votre Caf ou de la PMI sur l’aide à domicile et les lieux de soutien à la parentalité.

## Quand demander conseil
Si la fatigue, l’irritabilité ou le sentiment d’être dépassé s’installent malgré les ajustements, parlez-en à votre médecin, à la PMI ou à un psychologue : c’est peut-être le début d’un épuisement parental. Si vous vous sentez à bout ou avez des idées noires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['charge mentale', 'partage des tâches', 'organisation familiale', 'couple', 'tâches ménagères', 'épuisement', 'parents', 'agenda partagé'],
    sources: [S.ppjOrganisation, S.spfEpuisement, S.carnet1000j],
  },
  // ───────────────────────────── Épuisement, culpabilité, solitude, couple ─────────────────────────────
  {
    ...PARENTS,
    slug: 'epuisement-parental-burn-out-reconnaitre',
    title: 'Épuisement parental (burn-out parental) : savoir le reconnaître',
    summary: 'Épuisement physique et émotionnel, distance avec l’enfant, sentiment de ne plus être un bon parent : les trois signes du burn-out parental, ce qui l’entretient et ce qui protège, d’après Santé publique France.',
    category: 'sante-mentale',
    body_md: `Être fatigué quand on a des enfants est courant. Le burn-out parental, lui, va plus loin : c’est un épuisement qui dure et qui change la relation avec son enfant. Le reconnaître permet de chercher de l’aide avant que la situation ne s’aggrave.

## En bref
- Le burn-out parental naît d’un **déséquilibre durable** entre les exigences du quotidien et les ressources pour y faire face.
- Il associe **trois signes** : épuisement physique et émotionnel dans le rôle de parent, **distance émotionnelle** avec l’enfant, **sentiment d’inefficacité** et d’insatisfaction en tant que parent.
- Il concernerait **environ 6 % des parents** en France, principalement des femmes, selon Santé publique France.
- Il peut être confondu avec une dépression ou un épuisement professionnel.
- Il ne dit rien de l’amour que vous portez à vos enfants : c’est un signal qu’il faut **plus de soutien**.

## Comprendre
L’article de *La Santé en action* (Santé publique France, 2024) décrit l’épuisement parental comme le résultat d’un déséquilibre entre les « stresseurs » et les ressources. Quand ce déséquilibre dure trop longtemps, il devient un burn-out parental. Tous les signes n’ont pas besoin d’être présents : il commence souvent par l’épuisement physique et émotionnel, qui réduit la disponibilité mentale, puis la capacité d’empathie.

**Ce qui pèse dans la balance** (facteurs de risque cités) :
- le perfectionnisme parental, la pression de « bien faire » ;
- des responsabilités multiples (santé, développement, apprentissages de l’enfant) amplifiées par les médias et les injonctions ;
- des difficultés d’organisation familiale ;
- le manque de soutien social ;
- une charge de travail et une charge mentale importantes.

**Ce qui protège** : le soutien du second parent, les compétences de gestion du stress et des émotions, des repères éducatifs qui aident l’enfant à se comporter de façon constructive, et l’entourage proche.

Les conséquences ne sont pas anodines : irritabilité, conflits plus fréquents dans le couple, problèmes de santé, conduites addictives, pensées suicidaires. Le risque de négligence ou de violence envers l’enfant est multiplié, y compris chez des parents qui n’avaient jamais eu ces comportements. C’est pourquoi il est important d’agir tôt, sans culpabiliser.

## Au quotidien
Quelques questions pour faire le point :
- Vous sentez-vous « vidé » le matin, avant même que la journée commence ?
- Avez-vous l’impression de faire les gestes du quotidien en pilote automatique, sans plaisir ?
- Avez-vous pris de la distance avec vos enfants, comme si vous n’aviez plus d’énergie pour eux ?
- Vous dites-vous que vous n’êtes plus le parent que vous étiez ou que vous vouliez être ?
- Vous énervez-vous plus vite et plus fort qu’avant ?

Si plusieurs réponses sont « oui » depuis des semaines :
- **Parlez-en** à votre partenaire, à un proche, à votre médecin.
- **Identifiez ce qui peut être allégé** tout de suite : une tâche déléguée, une exigence abandonnée, une soirée de répit.
- **Cherchez du soutien concret** : relais de l’entourage, aide à domicile (renseignez-vous auprès de la Caf), lieux d’accueil enfants-parents.
- **Réduisez l’autodénigrement** : vous n’êtes pas un « mauvais parent », vous êtes un parent qui a besoin d’aide.

## Questions fréquentes
**Quelle différence avec la dépression ?**
Les signes peuvent se ressembler, et Santé publique France note que les professionnels eux-mêmes peuvent les confondre. Le burn-out parental se définit par rapport au rôle de parent ; seul un professionnel peut faire la différence, et les deux se prennent en charge.

**Faut-il forcément un arrêt de travail ?**
Pas forcément. L’article de Santé publique France note que les mères ont surtout besoin d’un soutien dans les tâches parentales, et que le travail peut même offrir du recul. Le médecin peut vous aider à évaluer votre situation.

**Les pères peuvent-ils faire un burn-out parental ?**
Oui. Les conséquences peuvent même être plus graves chez eux, notamment en termes d’idées suicidaires et de négligence.

**Mon conjoint semble épuisé, comment l’aider ?**
En reconnaissant son besoin d’aide sans le juger, en le rassurant sur le fait que le stress chronique peut toucher tous les parents, et en prenant en charge une partie concrète des tâches.

## Quand demander conseil
Consultez votre médecin traitant si l’épuisement dure, si vous avez peur de vos réactions envers vos enfants ou si vous consommez davantage d’alcool ou de médicaments. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). Si un enfant est en danger ou si vous craignez de lui faire du mal, appelez le **119** ; en cas d’urgence, le **15** ou le **112**.

${END}`,
    tags: ['burn-out parental', 'épuisement parental', 'fatigue parent', 'parent à bout', 'stress parental', 'santé mentale des parents', 'charge mentale', 'perfectionnisme'],
    sources: [S.spfEpuisement, S.infoInjonctions],
  },
  {
    ...PARENTS,
    slug: 'epuisement-parental-ou-trouver-de-l-aide',
    title: 'Parent à bout : où trouver de l’aide concrète et une écoute',
    summary: 'Lignes d’écoute gratuites pour les parents, aide à domicile financée par la Caf, PMI, lieux d’accueil enfants-parents, psychologue remboursé : le tour des soutiens quand on n’en peut plus.',
    category: 'sante-mentale',
    body_md: `Quand on est épuisé, chercher de l’aide demande déjà de l’énergie. Voici, rassemblés au même endroit, les principaux soutiens publics et associatifs qui existent pour les parents en France.

## En bref
- **Allô Parents Bébé** (0 800 00 34 56) écoute les parents d’enfants de moins de 3 ans, gratuitement et anonymement.
- **Allô, parents en crise** (0 805 382 300) répond gratuitement aux parents en difficulté, quel que soit l’âge des enfants.
- La **Caf** peut financer une **aide à domicile** (AES ou TISF) lors de l’arrivée d’un enfant, d’une séparation, d’une maladie ou d’un décès.
- La **PMI** offre gratuitement l’écoute et les conseils de professionnels de la petite enfance.
- Le **3114** répond 24 h/24 en cas de grande détresse ou d’idées suicidaires.

## Comprendre
Demander de l’aide n’est pas un échec, rappelle le site du gouvernement info.gouv.fr dans un article consacré à la pression qui pèse sur les parents. Le médecin généraliste y est présenté comme le premier interlocuteur, capable d’orienter vers un psychologue ; la PMI, les lieux d’accueil enfants-parents et la Caf comme des espaces d’écoute et de soutien.

Les **lignes d’écoute** permettent de parler tout de suite, sans rendez-vous. Santé.fr en recense un grand nombre. Pour les parents :
- **Allô Parents Bébé** (association Enfance et Partage) : parents d’enfants de moins de 3 ans, professionnels de la petite enfance, du lundi au vendredi, 10 h-13 h et 14 h-18 h, au 0 800 00 34 56.
- **Allô, parents en crise** (École des parents) : pour les parents angoissés ou à bout, anonyme et gratuit, en journée en semaine, au 0 805 382 300.
- **SOS Préma** (0 800 96 60 60) pour les parents d’un bébé prématuré ou hospitalisé.

L’**aide à domicile de la Caf** : selon la Cnaf, un accompagnant éducatif et social (AES) peut aider pour les tâches du quotidien (ménage, repas) et un technicien de l’intervention sociale et familiale (TISF) peut épauler les parents auprès de leurs enfants. La participation est calculée selon le quotient familial ; depuis 2024, elle a été fortement réduite pour les familles les plus modestes.

## Au quotidien
- **Choisissez une seule démarche** à faire aujourd’hui : un appel, un message à votre médecin, un rendez-vous à la PMI.
- **Pour l’aide à domicile**, contactez votre Caf avec votre numéro d’allocataire, ou un service d’aide à domicile conventionné ; une évaluation de vos besoins est faite avant l’intervention.
- **Pour souffler**, pensez aux **lieux d’accueil enfants-parents** (gratuits, sans inscription), aux haltes-garderies et à l’accueil occasionnel en crèche.
- **Pour un soutien psychologique**, Mon soutien psy permet de consulter directement un psychologue conventionné, jusqu’à 12 séances remboursées par année civile.
- **Pour l’entourage**, dites précisément ce qui aiderait : un repas, une garde d’une heure, une course, un appel le soir.
- **Gardez les numéros** dans votre téléphone, pour ne pas avoir à les chercher un soir difficile.

## Questions fréquentes
**Je ne suis pas allocataire de la Caf : puis-je demander une aide à domicile ?**
La Cnaf indique que l’aide concerne les familles ayant au moins un enfant à charge ou attendant un premier enfant. Renseignez-vous auprès de votre Caf ou d’un service conventionné pour connaître les conditions dans votre département.

**Est-ce que les lignes d’écoute peuvent me juger ou me signaler ?**
Allô Parents Bébé et Allô, parents en crise sont anonymes et gratuites ; leur rôle est d’écouter et d’orienter. Si un enfant est en danger, le 119 est le numéro dédié.

**J’ai honte d’appeler pour « si peu » : ces lignes sont-elles vraiment pour moi ?**
Ces lignes s’adressent aux parents angoissés, fatigués ou à bout : il n’y a pas de seuil à atteindre pour appeler.

## Quand demander conseil
Si l’épuisement s’accompagne de tristesse durable, d’idées noires ou d’un sentiment qu’il n’y a plus d’issue, appelez le **3114** (gratuit, 24 h/24, 7 j/7). Si vous avez peur de faire du mal à votre enfant, mettez-le en sécurité, éloignez-vous et appelez le **119** ou, en cas d’urgence, le **15** ou le **112**.

${END}`,
    tags: ['aide parents', 'Allô Parents Bébé', 'Allô parents en crise', 'aide à domicile Caf', 'TISF', 'PMI', 'ligne d’écoute', 'parent épuisé'],
    sources: [S.santeLignes, S.cnafAideDomicile, S.infoInjonctions],
  },
  {
    ...PARENTS,
    slug: 'culpabilite-parentale-parent-suffisamment-bon',
    title: 'Culpabilité parentale : sortir du mythe du parent parfait',
    summary: 'Conseils contradictoires, réseaux sociaux, « parentalité intensive » : pourquoi tant de parents se sentent coupables, et comment viser un parent « suffisamment bon » plutôt que parfait.',
    category: 'sante-mentale',
    body_md: `Trop d’écrans, pas assez de légumes, une colère de trop, un biberon au lieu du sein… Beaucoup de parents se couchent le soir avec une liste de reproches. La culpabilité est devenue une compagne fréquente de la parentalité, mais elle n’est pas une fatalité.

## En bref
- Les conseils aux parents n’ont jamais été aussi **nombreux**, et parfois **contradictoires**.
- Les **réseaux sociaux** renforcent la pression par la comparaison avec des scènes idéalisées.
- Les chercheurs parlent de **« parentalité intensive »** : l’idée qu’un bon parent doit toujours donner plus, sans jamais se tromper.
- L’enfant a besoin d’un parent **« suffisamment bon »**, qui répond à ses besoins essentiels et accepte ses erreurs.
- Le perfectionnisme fait partie des **facteurs d’épuisement parental**.

## Comprendre
Dans un article publié en 2026, info.gouv.fr décrit comment les injonctions éducatives pèsent sur la santé mentale des parents. Les progrès des connaissances sur le développement de l’enfant ont multiplié les recommandations ; elles sont utiles, mais peuvent nourrir le sentiment de ne jamais en faire assez. Les réseaux sociaux ajoutent la comparaison permanente.

L’article rappelle la notion de **parent « suffisamment bon »** proposée par le pédiatre et psychanalyste Donald Winnicott : un parent qui répond aux besoins essentiels de son enfant tout en acceptant ses propres erreurs. Ce qui fragilise le plus l’enfant n’est pas l’imperfection, mais l’épuisement de parents qui cherchent sans cesse la perfection.

Santé publique France, dans son article sur l’épuisement parental, cite justement le **perfectionnisme parental** parmi les facteurs de risque, et recommande de **réduire l’autodénigrement** et d’accepter ses failles sans fuir les émotions difficiles.

Psycom souligne de son côté que le décalage entre l’idéal imaginé et la réalité vécue peut générer doutes, culpabilité et difficultés à en parler. Mettre des mots sur ce décalage est souvent un premier soulagement.

## Au quotidien
- **Triez les conseils** : il n’existe pas de méthode universelle. Gardez les repères de santé publique (sécurité, sommeil, alimentation) et laissez de côté ce qui ne vous correspond pas.
- **Faites-vous confiance** : vous connaissez votre enfant mieux que quiconque.
- **Réduisez la comparaison** : limitez le temps passé sur les comptes qui vous font vous sentir « en dessous ». Rappelez-vous qu’une photo ne montre jamais la nuit blanche d’avant.
- **Changez la question** : au lieu de « ai-je tout bien fait ? », demandez-vous « mon enfant a-t-il été nourri, en sécurité, aimé aujourd’hui ? ».
- **Réparez plutôt que vous flageller** : après une colère, revenez vers votre enfant, nommez ce qui s’est passé, excusez-vous si besoin.
- **Partagez les responsabilités** et accordez-vous du temps pour vous, sans le vivre comme un luxe.
- **Parlez-en** avec d’autres parents : on découvre souvent qu’on n’est pas seul à douter.

## Questions fréquentes
**Je culpabilise de reprendre le travail. Est-ce mauvais pour mon enfant ?**
Le travail peut aussi être une ressource et offrir du recul, note Santé publique France. Pour l’enfant, l’essentiel reste un lien chaleureux avec ses parents et un mode d’accueil où il est en sécurité.

**Je culpabilise d’avoir arrêté l’allaitement : comment prendre du recul ?**
Chaque situation est différente. Si cette culpabilité vous pèse, parlez-en à la sage-femme, au médecin ou à la PMI : ils peuvent vous aider à prendre du recul.

**Comment soutenir un ami parent qui se dévalorise ?**
En l’écoutant sans jugement et en proposant une aide concrète : un repas, une garde, des nouvelles régulières.

**Quand la culpabilité devient-elle un problème ?**
Quand elle est permanente, vous empêche de dormir, vous fait vous sentir incapable ou s’accompagne de tristesse. Ce peut être un signe d’épuisement ou de dépression.

## Quand demander conseil
Parlez-en à votre médecin, à la PMI ou à un psychologue si la culpabilité ne vous quitte plus ou si vous vous sentez « nul » en tant que parent depuis des semaines. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['culpabilité parentale', 'parent parfait', 'parent suffisamment bon', 'injonctions', 'réseaux sociaux', 'comparaison', 'perfectionnisme', 'mère parfaite'],
    sources: [S.infoInjonctions, S.spfEpuisement, S.psycom],
  },
  {
    ...PARENTS,
    slug: 'solitude-isolement-jeunes-parents',
    title: 'Solitude des jeunes parents : rompre l’isolement après la naissance',
    summary: 'Journées seul avec le bébé, amis qui s’éloignent, famille loin : l’isolement est fréquent après une naissance et fragilise le moral. Lieux d’accueil enfants-parents, groupes de PMI, lignes d’écoute : des pistes pour retrouver du lien.',
    category: 'sante-mentale',
    min_age_months: 0,
    max_age_months: 36,
    body_md: `Le congé parental ou les premières semaines avec un bébé peuvent être des moments très solitaires. On parle peu à des adultes, on sort moins, les amis sans enfant ont d’autres rythmes. Cette solitude n’a rien d’anodin pour le moral.

## En bref
- L’isolement est **fréquent** après une naissance : dans une étude de Santé publique France sur l’entretien postnatal précoce, **39 % des mères** rapportaient se sentir isolées.
- Le **manque de soutien** et l’éloignement familial font partie des facteurs de risque de dépression périnatale.
- Il est conseillé de **ne pas rester seul avec ses questions** : en parler à l’autre parent, à des proches ou à des professionnels.
- Les **lieux d’accueil enfants-parents (LAEP)** sont gratuits, sans inscription, et accueillent les enfants de 0 à 6 ans avec un adulte, ainsi que les futurs parents.
- Maternité, PMI, Caf, MSA, centres sociaux et crèches proposent des **groupes de parents**.

## Comprendre
Le carnet des 1000 premiers jours rappelle que l’arrivée d’un enfant bouleverse l’organisation du quotidien et les relations avec l’entourage. Chacun traverse des hauts et des bas ; il est recommandé de ne pas rester seul avec ses questions et, en cas d’isolement, de se tourner vers des professionnels à l’écoute.

Psycom cite le manque de soutien et les événements comme l’éloignement familial ou un déménagement parmi les situations qui augmentent le risque de troubles psychiques pendant la période périnatale. À l’inverse, le soutien social fait partie des ressources qui protègent.

Les **lieux d’accueil enfants-parents (LAEP)**, financés par la Caf, sont conçus pour cela : ce sont des espaces de rencontre, d’échange et de jeu, avec au moins deux accueillants formés à l’écoute. Ils ne sont ni un mode de garde ni un lieu de soin ; leur but est notamment de **rompre l’isolement**, de créer du lien entre familles et de valoriser les compétences des parents. L’accès est libre, gratuit ou avec une participation symbolique, dans le respect de l’anonymat.

## Au quotidien
- **Sortez chaque jour**, même brièvement : une promenade, le marché, le parc. Croiser d’autres adultes compte.
- **Repérez les lieux près de chez vous** : LAEP, groupes de parents et ateliers collectifs (sommeil, alimentation, lecture, écrans) proposés par la maternité, la PMI, la Caf, la MSA, le centre social ou la crèche.
- **Gardez le contact** avec vos amis à votre rythme : un message, un appel pendant la sieste, une visite courte.
- **Créez un réseau de parents** : rencontres au parc, à la PMI, en LAEP. L’entraide (courses groupées, garde croisée) allège aussi le quotidien.
- **Planifiez des moments pour vous** : une heure de relais par l’autre parent ou un proche, sans culpabilité.
- **Appelez une ligne d’écoute** quand la journée est trop longue : Allô Parents Bébé (0 800 00 34 56) pour les parents d’enfants de moins de 3 ans.
- **Si vous êtes parent solo**, renseignez-vous auprès de votre Caf sur les aides et l’accompagnement possibles.

## Questions fréquentes
**Je n’ose pas aller dans un groupe de parents, je ne connais personne : comment me lancer ?**
C’est justement le principe : les accueillants sont là pour faciliter les premiers échanges. Vous pouvez venir, rester un moment, et revenir si cela vous a plu.

**Mon partenaire travaille beaucoup et je me sens seule le soir : que faire ?**
Parlez-en ensemble : votre besoin de lien est légitime. Cherchez ensemble des moments de partage et des relais extérieurs.

**Les LAEP accueillent-ils aussi les pères et les futurs parents ?**
Oui, ils accueillent les enfants accompagnés d’un parent ou d’un adulte référent, ainsi que les futurs parents.

## Quand demander conseil
Si la solitude s’accompagne de tristesse, de perte d’envie, de pleurs fréquents ou d’un sentiment de vide qui dure plus de deux semaines, parlez-en à votre médecin, à votre sage-femme ou à la PMI. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['solitude', 'isolement', 'jeune parent', 'LAEP', 'lieu d’accueil enfants-parents', 'groupe de parents', 'congé parental', 'parent solo'],
    sources: [S.carnet1000j, S.cafLaep, S.spfEPNP],
  },
  {
    ...PARENTS,
    slug: 'couple-apres-bebe-tensions-et-dialogue',
    title: 'Le couple après bébé : apaiser les tensions et garder le dialogue',
    summary: 'Fatigue, partage des tâches, intimité qui change : les tensions sont fréquentes après une naissance. Comment en parler sans s’épuiser, quand se faire aider, et quand une situation relève de la violence.',
    category: 'sante-mentale',
    body_md: `On s’attend à ce que le bébé rapproche le couple ; il le bouscule aussi. Fatigue, nouvelles responsabilités et changement de rythme font monter les tensions chez beaucoup de parents. Les reconnaître permet de ne pas les laisser s’installer.

## En bref
- La naissance change la **vie de couple**, la façon d’être parents et la **répartition des tâches**.
- L’épuisement rend **plus irritable** et favorise des conflits plus fréquents et plus intenses.
- **Dialoguer**, exprimer ses besoins et écouter ceux de l’autre aide à se soutenir mutuellement.
- Le **soutien du second parent** est l’une des principales protections contre l’épuisement parental.
- Des **conseillers conjugaux et familiaux** et des **médiateurs familiaux** peuvent aider ; en cas de violences, le **3919** répond 24 h/24.

## Comprendre
Le carnet des 1000 premiers jours rappelle que les changements liés à l’arrivée d’un enfant touchent aussi la vie de couple, la façon d’être parents et la répartition des tâches, et invite à en parler à deux pour se soutenir mutuellement.

La fatigue joue un rôle majeur. L’article de *La Santé en action* sur l’épuisement parental décrit, parmi ses conséquences, une irritabilité accrue et des conflits plus nombreux et plus intenses dans le couple. Inversement, le soutien du second parent est l’une des principales ressources contre l’épuisement.

Psycom rappelle aussi que le second parent peut traverser une dépression autour de la naissance, avec parfois de l’irritabilité, de la colère, un retrait ou une augmentation des conflits conjugaux : une tension persistante dans le couple peut donc cacher une souffrance à soigner. L’intimité, enfin, reprend à un rythme propre à chaque couple ; en parler sans pression aide souvent davantage que de se fixer une échéance.

## Au quotidien
- **Choisissez le bon moment** : évitez de régler les désaccords à 3 h du matin ou en pleine crise de pleurs. Notez le sujet et reprenez-le à un moment calme.
- **Parlez en « je »** : « je me sens dépassée le soir », « j’ai besoin de dormir une nuit entière par semaine », plutôt que « tu ne fais jamais rien ».
- **Écoutez l’autre jusqu’au bout** avant de répondre ; reformulez ce que vous avez compris.
- **Revoyez ensemble l’organisation** : qui s’occupe de quoi, qui se lève la nuit, quels moments de repos pour chacun.
- **Revoyez les exigences à la baisse** pour un temps : maison moins rangée, repas plus simples.
- **Protégez de petits moments à deux** : un café, une promenade, dix minutes sans écran pour se demander « comment vas-tu vraiment ? ».
- **Pensez aux gestes d’attention** : un mot, un merci, un câlin, qui rappellent que vous êtes une équipe.
- **Faites-vous aider** : conseil conjugal et familial, médiation familiale, lignes d’écoute comme Allô, parents en crise (0 805 382 300).

## Questions fréquentes
**Nous nous disputons tous les jours depuis la naissance. Est-ce le signe que notre couple ne tiendra pas ?**
Pas nécessairement : la fatigue et l’adaptation augmentent les tensions chez beaucoup de couples. Si les disputes s’installent, un tiers (conseiller conjugal et familial, psychologue) peut aider à renouer le dialogue.

**Mon partenaire se renferme, boit plus ou devient très irritable : que faut-il comprendre ?**
Ces signes peuvent traduire une dépression chez le second parent, qui concerne environ un homme sur dix pendant la période périnatale selon Psycom. Encouragez-le à consulter son médecin ou un psychologue.

**Comment distinguer conflit et violence ?**
Un conflit oppose deux personnes qui peuvent exprimer leur désaccord. La violence installe la peur et le contrôle : humiliations, menaces, coups, contrôle de l’argent ou des sorties, pressions sexuelles. Psycom cite les violences conjugales ou intrafamiliales parmi les situations qui fragilisent la santé mentale pendant la grossesse et après la naissance. Elles ne sont jamais de votre faute.

## Quand demander conseil
Si vous avez peur de votre partenaire ou subissez des violences, appelez le **3919** (Violences Femmes Info, gratuit, anonyme, 24 h/24) ; en cas de danger immédiat, le **17** ou le **112**. Si un enfant est exposé ou en danger, appelez le **119**. En cas de détresse ou d’idées suicidaires, le **3114** répond 24 h/24, 7 j/7.

${END}`,
    tags: ['couple après bébé', 'disputes', 'tensions couple', 'communication', 'intimité', 'conseiller conjugal', 'violences conjugales', '3919'],
    sources: [S.carnet1000j, S.spfEpuisement, S.psycom],
  },
  {
    ...NEWBORN,
    slug: 'reprise-du-travail-apres-bebe-emotions',
    title: 'Reprendre le travail après bébé : vivre la séparation et retrouver son équilibre',
    summary: 'Tristesse de confier son bébé, soulagement mêlé de culpabilité, fatigue des premières semaines : comment préparer émotionnellement la reprise, s’organiser à deux et connaître les possibilités d’aménagement.',
    category: 'sante-mentale',
    min_age_months: 2,
    max_age_months: 36,
    body_md: `La fin du congé approche et les sentiments se mélangent : envie de retrouver les collègues, peur de manquer des moments importants, inquiétude de confier son enfant. Il n’y a pas de « bonne » façon de vivre la reprise ; il y a des moyens de la préparer.

## En bref
- La reprise du travail réveille souvent des **émotions contradictoires** : tristesse, soulagement, culpabilité, appréhension.
- Le travail peut aussi être une **ressource** : selon Santé publique France, il peut offrir du recul et même un soulagement à certains parents.
- Une **adaptation progressive** au mode d’accueil aide l’enfant et le parent à apprivoiser la séparation.
- **Réduction du temps de travail**, **congé parental** total ou partiel, journées pour enfant malade selon l’employeur : plusieurs aménagements existent.
- Un **partage équitable** des tâches à la maison limite l’épuisement des premières semaines.

## Comprendre
Le carnet des 1000 premiers jours rappelle que les modes d’accueil (crèches, assistants maternels, garde à domicile) permettent de concilier vie professionnelle et vie familiale, et que chacun des deux parents peut prendre un congé parental, à tout moment jusqu’aux 3 ans de l’enfant, y compris à temps partiel. Santé publique France (1000 premiers jours) cite aussi la possibilité de demander une réduction du temps de travail pour l’un ou l’autre parent, voire les deux.

Sur le plan émotionnel, la séparation se travaille des deux côtés. L’enfant découvre d’autres adultes de confiance ; le parent apprend à confier. Les lieux d’accueil enfants-parents, par exemple, comptent parmi leurs objectifs celui de faciliter la séparation.

La culpabilité est fréquente, nourrie par l’idée qu’un « bon parent » devrait tout donner. L’article d’info.gouv.fr sur les injonctions éducatives rappelle qu’un parent « suffisamment bon », qui répond aux besoins essentiels de son enfant, est ce dont l’enfant a besoin. Et l’article de *La Santé en action* sur l’épuisement parental note que, pour certaines mères, l’activité professionnelle est un lieu de respiration plutôt qu’une charge supplémentaire.

## Au quotidien
**Avant la reprise**
- Organisez une **période d’adaptation** avec la crèche ou l’assistant maternel, avec des temps d’accueil courts puis plus longs.
- Faites des **essais de journée type** : heure de lever, trajet, dépôt, retour, pour repérer ce qui coince.
- **Répartissez les rôles** à deux : qui dépose, qui récupère, qui reste si l’enfant est malade, qui gère le sac et les rendez-vous.
- **Échangez avec votre employeur** sur vos horaires, un éventuel temps partiel, le télétravail si votre poste le permet.

**Les premières semaines**
- Prévoyez un **rituel de séparation** court et toujours le même (un câlin, un mot, un geste), et dites au revoir plutôt que de partir en cachette.
- **Allégez le reste** : repas simples, courses en ligne, aide de l’entourage.
- **Gardez des moments de qualité** le soir et le week-end plutôt que de vouloir compenser par une activité permanente.
- **Écoutez votre fatigue** : les premières semaines cumulent souvent nuits courtes, petites maladies de l’enfant et rythme professionnel.

**Si vous allaitez**, renseignez-vous sur les possibilités de tirer votre lait au travail auprès de la sage-femme, de la PMI ou de votre employeur.

## Questions fréquentes
**Je pleure en déposant mon bébé : est-ce que je lui transmets mon angoisse ?**
Être émue au moment de la séparation est très courant. Un au revoir clair et tendre, puis un départ sans s’éterniser, aide souvent l’enfant comme le parent. Parlez-en avec les professionnels de l’accueil, qui ont l’habitude de ces moments.

**Je suis soulagée de retrouver le travail et je m’en veux : est-ce grave ?**
Ce soulagement est légitime : Santé publique France note que le travail peut offrir du recul. Avoir d’autres espaces de vie peut vous aider à être plus disponible pour votre enfant.

**Comment savoir si je suis simplement fatiguée ou si je m’épuise ?**
Si la fatigue ne passe pas avec le repos, si vous vous sentez vidée, irritable, détachée de votre enfant ou incapable de faire face, parlez-en à votre médecin : il peut s’agir d’un épuisement parental ou d’une dépression.

## Quand demander conseil
Parlez à votre médecin, à la PMI ou à un psychologue si l’angoisse de séparation, la tristesse ou l’épuisement durent plus de deux semaines. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['reprise du travail', 'fin du congé maternité', 'séparation', 'crèche', 'adaptation', 'culpabilité', 'congé parental', 'temps partiel'],
    sources: [S.carnet1000j, S.ppjOrganisation, S.spfEpuisement],
  },
  {
    ...NEWBORN,
    slug: 'a-bout-face-aux-pleurs-de-bebe',
    title: 'À bout face aux pleurs de bébé : les gestes qui protègent, ne jamais secouer',
    summary: 'Les pleurs d’un nourrisson peuvent épuiser les parents les plus patients : que faire quand la colère ou le découragement montent, pourquoi il ne faut jamais secouer un bébé, et qui appeler.',
    category: 'sante-mentale',
    safety_critical: true,
    min_age_months: 0,
    max_age_months: 12,
    body_md: `Il pleure depuis une heure, vous avez tout essayé, vous n’avez presque pas dormi. La tension monte, et vous avez peur de craquer. Ce moment arrive à beaucoup de parents ; ce qui compte, c’est d’avoir un plan pour le traverser en sécurité.

## En bref
- Les pleurs d’un bébé en bonne santé sont **les plus intenses vers 6 semaines** et peuvent durer **2 à 3 heures par jour** en tout, avant de diminuer.
- Un bébé ne pleure **ni par caprice ni pour embêter** : il exprime un besoin ou cherche du réconfort.
- **Il ne faut jamais secouer un bébé** : cela peut causer un handicap à vie ou la mort.
- Quand vous êtes à bout : **posez bébé sur le dos dans son lit**, sans objets autour, **quittez la pièce**, calmez-vous, **demandez un relais**.
- **Allô Parents Bébé** (0 800 00 34 56) et le **119** peuvent vous écouter ; le **15** en cas de signes inquiétants.

## Comprendre
Santé publique France (1000 premiers jours) rappelle que les pleurs sont le langage du nourrisson : faim, sommeil, chaleur, couche, douleur, ou simple besoin de bras et d’attention. La plupart du temps, ils ne signalent pas de problème de santé. Mais leur répétition met les nerfs à rude épreuve, surtout quand le sommeil manque.

Ressentir de l’exaspération, de la colère ou un sentiment d’impuissance face à un bébé qui pleure n’est pas un signe que vous êtes un mauvais parent. Le danger, c’est le geste brusque qu’elles peuvent entraîner. Le carnet des 1000 premiers jours est très clair : il ne faut jamais secouer un bébé, il peut en mourir ou rester handicapé à vie. Un seul geste peut suffire.

Avoir un « plan de sortie » préparé à l’avance, quand on est calme, aide à réagir au bon moment.

## Au quotidien
**Pour tenter de l’apaiser**
- Vérifiez ses besoins : faim, sommeil, chaleur, couche, signe de douleur.
- Prenez-le contre vous, bercez-le, parlez-lui doucement ou chantonnez, massez-le, promenez-le, faites du peau à peau s’il est très petit.
- Créez un environnement calme et peu lumineux.
- Essayez la position à plat ventre sur votre avant-bras, qui peut soulager un mal de ventre.
- Évitez les cris et les mots durs : ils ne calment pas et peuvent rendre l’enfant anxieux.

**Quand vous sentez que vous allez craquer**
1. Posez bébé **sur le dos, dans son lit**, sans couverture, coussin ni peluche autour.
2. **Sortez de la pièce** quelques minutes : votre bébé est en sécurité dans son lit, même s’il pleure.
3. **Calmez-vous** : respirez lentement, buvez un verre d’eau, bougez un peu, passez de l’eau fraîche sur votre visage.
4. **Passez le relais** à l’autre parent ou à un proche de confiance, ou appelez quelqu’un pour parler.
5. **Ne reprenez votre bébé qu’une fois apaisé.**

**En prévention**
- Expliquez à toutes les personnes qui gardent votre bébé qu’il ne faut jamais le secouer, et ce qu’il faut faire quand on est à bout.
- Organisez des relais pour dormir, et consultez le médecin ou la PMI **avant d’être épuisé**.

## Questions fréquentes
**Combien de temps puis-je le laisser pleurer dans son lit ?**
Le temps nécessaire pour vous calmer, en restant à proximité. Si les pleurs vous inquiètent ou ne ressemblent pas à d’habitude, appelez le médecin ou le 15.

**Comment savoir si ses pleurs cachent une douleur ?**
Ventre tendu, bébé qui se tortille, ne mange plus ou ne dort plus, se frotte l’oreille, vomit, a de la fièvre : appelez le médecin. En cas de signes inquiétants, appelez le 15.

**J’ai eu un geste brusque et j’ai peur qu’il soit blessé : que faire ?**
Appelez immédiatement le 15 et expliquez ce qui s’est passé, sans attendre de voir si des signes apparaissent. Le dire est la meilleure façon de protéger votre bébé.

## Quand demander conseil
Appelez le **15** (ou le **112**) en cas de signes inquiétants chez le bébé ou après une secousse. Pour parler quand vous êtes à bout : **Allô Parents Bébé** (0 800 00 34 56, en semaine) ou le **119** (24 h/24) si vous craignez pour la sécurité de votre enfant. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7).

${END}`,
    tags: ['pleurs bébé', 'bébé pleure', 'à bout', 'syndrome du bébé secoué', 'ne jamais secouer', 'colère parent', 'Allô Parents Bébé', 'épuisement'],
    sources: [S.ppjPleurs, S.carnet1000j, S.santeLignes],
  },
  {
    ...NEWBORN,
    slug: 'bebe-hospitalise-en-neonatologie-parents',
    title: 'Bébé hospitalisé en néonatologie : prendre soin de vous pendant l’attente',
    summary: 'Naissance prématurée ou bébé qui a besoin de soins : comment vivre l’hospitalisation, trouver votre place de parent auprès de lui, et vous faire soutenir pendant et après le séjour.',
    category: 'sante-mentale',
    min_age_months: 0,
    max_age_months: 6,
    body_md: `Rien ne se passe comme imaginé : le bébé est dans une couveuse, les machines sonnent, les visites se font entre les soins. L’hospitalisation d’un nouveau-né bouleverse les parents. Prendre soin de vous fait partie de ce dont votre bébé a besoin.

## En bref
- Environ **75 000 nouveau-nés** sont hospitalisés chaque année en France, selon la charte du nouveau-né hospitalisé (2021).
- Cette charte s’appuie sur l’idée que le nouveau-né a besoin d’une **relation continue avec ses parents** et intègre les parents comme **partenaires de soins**, dans une logique de « zéro séparation ».
- Une naissance prématurée ou un bébé ayant des besoins médicaux particuliers font partie des situations qui **fragilisent la santé mentale** des parents, selon Psycom.
- **SOS Préma** propose une ligne gratuite pour les parents (0 800 96 60 60).
- Les deux parents peuvent être touchés par l’anxiété ou la dépression, pendant et **après** l’hospitalisation.

## Comprendre
La charte du nouveau-né hospitalisé, présentée en 2021 par SOS Préma, la Société française de néonatalogie et le gouvernement, décrit dix besoins essentiels des nouveau-nés hospitalisés. Elle repose sur la théorie de l’attachement et sur les **soins de développement**, qui associent les parents aux soins. D’après la présentation officielle, ces soins réduisent en moyenne la durée d’hospitalisation et améliorent le développement et la santé de l’enfant.

Pour les parents, cette période peut mêler peur, attente, culpabilité (« qu’ai-je fait de travers ? »), fatigue et moments de grande émotion. Psycom cite la naissance prématurée, les complications de la grossesse ou de l’accouchement et le bébé ayant des besoins médicaux particuliers parmi les facteurs de risque de troubles psychiques périnataux : il est donc important d’être attentif à vous, pendant l’hospitalisation comme après le retour à la maison.

## Au quotidien
**Auprès de votre bébé**
- Demandez à l’équipe comment **participer aux soins** : change, toilette, mise au sein ou tire-lait, peau à peau quand c’est possible.
- **Parlez-lui, chantez** : votre voix fait partie de son environnement.
- Notez vos questions pour les temps d’échange avec les médecins et les infirmiers ; demandez qu’on vous réexplique si besoin.

**Pour vous**
- **Relayez-vous** entre parents et avec des proches, pour que chacun puisse dormir, manger, se laver.
- **Acceptez l’aide** pour la maison, les aînés, les repas.
- **Demandez s’il est possible de rencontrer un psychologue** dans le service ou à la maternité si vous en ressentez le besoin.
- **Échangez avec d’autres parents** qui vivent la même situation, dans le service ou via une association de parents.
- **Gardez un lien avec vos proches** en choisissant ce que vous partagez, à votre rythme.

**Au retour à la maison**
- Préparez avec l’équipe le suivi prévu (rendez-vous, PMI, éventuelles aides).
- Continuez de prêter attention à votre moral, même une fois rentrés.

## Questions fréquentes
**Je n’arrive pas à me sentir parent de ce bébé derrière la couveuse. Est-ce que le lien se fera ?**
Le lien se construit aussi à travers les soins, la voix, le toucher et le temps partagé. Parlez de ce ressenti à l’équipe : elle peut vous aider à trouver votre place auprès de lui, au fil des soins.

**Mon partenaire et moi ne vivons pas la situation de la même façon : comment rester unis ?**
Chacun réagit à sa manière : l’un parle, l’autre agit ou se tait. Se dire comment chacun va, sans juger la façon de l’autre, aide à rester une équipe.

**À qui parler en dehors de l’hôpital ?**
À votre médecin traitant, à la PMI, à un psychologue (Mon soutien psy permet un accès direct), ou à la ligne de SOS Préma.

## Quand demander conseil
Parlez-en à l’équipe ou à votre médecin si l’angoisse, les cauchemars, la tristesse ou l’épuisement durent ou s’aggravent, y compris après le retour à la maison. En cas de détresse ou d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). À la maison, en cas de signes inquiétants chez le bébé, appelez le **15** ou le **112**.

${END}`,
    tags: ['néonatologie', 'prématuré', 'bébé hospitalisé', 'couveuse', 'soins de développement', 'SOS Préma', 'parents en néonat', 'charte du nouveau-né hospitalisé'],
    sources: [S.charteNouveauNe, S.psycom, S.santeLignes],
  },
  // ───────────────────────────── Deuil périnatal ─────────────────────────────
  {
    ...PERI,
    slug: 'deuil-perinatal-traverser-la-perte',
    title: 'Deuil périnatal : traverser la perte d’un bébé, ne pas rester seul',
    summary: 'Perdre un bébé pendant la grossesse ou peu après la naissance est un deuil à part entière. Ce que vivent souvent les parents, ce qui peut aider, et les associations et professionnels vers qui se tourner.',
    category: 'sante-mentale',
    body_md: `La perte d’un bébé, avant ou peu après sa naissance, est un choc immense. Ce deuil reste souvent entouré de silence. Pourtant, il est reconnu, et vous n’avez pas à le traverser seul.

## En bref
- Le deuil périnatal désigne la **perte d’un bébé avant ou peu après sa naissance** ; il concernerait environ **7 000 familles chaque année**, selon la Caf.
- L’annonce est un **choc** ; les parents se sentent souvent fragiles, vulnérables et doutent de pouvoir surmonter l’épreuve.
- **Ne pas rester seul** est le plus important : sans soutien, l’isolement peut favoriser la dépression.
- Des **associations spécialisées** (Naître et Vivre, Spama…) et des **professionnels** (médecin, sage-femme, psychologue) accompagnent les parents.
- La **Caf ou la MSA** propose un accompagnement social gratuit, à tout moment, même des mois après.

## Comprendre
La Caf rappelle qu’il existe un tabou social autour de la mort, et plus encore autour de celle d’un tout-petit. Certains couples s’enferment et ne s’autorisent pas à considérer ce qu’ils vivent comme un véritable deuil. Il l’est, quel que soit le terme de la grossesse.

Le deuil prend du temps et chacun le vit à sa façon. Tristesse, colère, culpabilité, sentiment d’injustice, vide, difficulté à voir des femmes enceintes ou des bébés : ces réactions peuvent se succéder ou se mêler. Avec le temps, selon la Caf, la douleur devient plus supportable ; l’objectif n’est pas d’oublier, mais de construire une nouvelle histoire familiale qui fait une place à cet enfant.

Psycom cite le deuil périnatal (après une fausse couche, une interruption de grossesse ou le décès du bébé à la naissance) parmi les situations qui augmentent le risque de troubles psychiques. Être accompagné n’est donc pas un luxe : c’est une protection.

## Au quotidien
- **Prenez le temps** dont vous avez besoin : il n’y a pas de bonne durée ni de bonne façon de vivre ce deuil.
- **Faites ce qui a du sens pour vous** : donner un prénom, organiser un rite, en parler… ou pas. Les équipes de maternité peuvent vous présenter les possibilités et vous accompagner dans ces choix.
- **Acceptez l’accompagnement** :
  - associations de parents endeuillés, qui proposent écoute, entretiens individuels ou familiaux, groupes de parole et parfois ateliers pour les enfants : **Naître et Vivre** (deuil périnatal, ligne 01 47 23 05 08, 24 h/24), **Spama** (07 87 85 37 81, en semaine le matin), **Empreintes** et la **Fédération européenne Vivre son deuil** (tous deuils) ;
  - professionnels : médecin traitant, sage-femme, gynécologue, psychologue ou psychiatre ; vous pouvez leur demander s’ils sont formés au deuil ;
  - travailleur social de la Caf ou de la MSA, qui peut vous aider pour les démarches, les droits et la recherche de soutien.
- **Prenez soin de votre corps** : la récupération physique après une naissance ou une interruption de grossesse a aussi besoin d’un suivi.
- **Dites à vos proches ce qui vous aide** : parler de votre bébé, vous laisser du calme, une aide concrète.

## Questions fréquentes
**Est-ce un « vrai » deuil si la grossesse était encore précoce ?**
Oui, c’est un deuil dès lors que vous le vivez comme une perte. Naître et Vivre, par exemple, accompagne les parents ayant perdu un enfant pendant la grossesse ou dans ses premières années.

**Nous ne vivons pas le deuil de la même façon dans le couple : est-ce un problème ?**
C’est fréquent : chacun a son rythme et sa manière d’exprimer la peine. En parler, éventuellement avec un professionnel ou dans une association, aide à ne pas s’éloigner.

**Quand puis-je reprendre le travail ?**
Il n’y a pas de règle sur le ressenti. Vos droits (congés, arrêts) dépendent de votre situation ; le travailleur social de la Caf ou de la MSA et votre médecin peuvent vous informer.

## Quand demander conseil
Consultez si la tristesse vous empêche de manger, de dormir ou de fonctionner pendant des semaines, si vous vous isolez, ou si vous consommez davantage d’alcool ou de médicaments. En cas d’idées suicidaires ou d’envie de « rejoindre » votre bébé, appelez immédiatement le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['deuil périnatal', 'perte d’un bébé', 'mort in utero', 'bébé décédé', 'Naître et Vivre', 'Spama', 'soutien deuil', 'association'],
    sources: [S.cafDeuil, S.msaDeuil, S.santeLignes],
  },
  {
    ...PERI,
    slug: 'deuil-perinatal-demarches-et-droits',
    title: 'Deuil périnatal : démarches, état civil et droits des parents',
    summary: 'Acte d’enfant sans vie, livret de famille, prénom, obsèques, congés maternité et paternité, congé de deuil, allocation en cas de décès : les repères administratifs, pour savoir à qui demander de l’aide.',
    category: 'droits-demarches',
    body_md: `Au moment où l’on a le moins de forces, il faut parfois prendre des décisions et faire des démarches. Voici les principaux repères ; vous n’avez pas à tout gérer seul.

## En bref
- Si l’enfant est **né sans vie** ou **né vivant mais non viable**, les parents peuvent demander un **acte d’enfant sans vie**, sur présentation d’un **certificat médical d’accouchement**.
- Cet acte permet d’inscrire l’enfant à l’**état civil** et sur le **livret de famille**, avec, à la demande des parents, son ou ses **prénoms** ; il ne crée pas de lien de filiation.
- Il ouvre notamment le droit d’**organiser des obsèques**, qui peuvent aussi être prévues avec l’hôpital.
- Au-delà du **seuil de viabilité**, les **congés maternité et paternité** sont accordés dans leur totalité, et un **congé de deuil** peut être demandé.
- La Caf ou la MSA verse sous conditions une **allocation en cas de décès d’enfant** et peut revoir vos droits.

## Comprendre
**L’acte d’enfant sans vie.** Le Conseil national de l’Ordre des sages-femmes explique qu’il peut être établi par l’officier d’état civil pour un enfant né sans vie ou né vivant mais non viable. Il faut un certificat d’accouchement, établi par un médecin ou une sage-femme. À la demande des parents, l’acte peut comporter le ou les prénoms de l’enfant ainsi que le nom du père, de la mère ou les deux ; les parents peuvent obtenir sa mention sur le livret de famille. Aucune filiation n’est établie et l’enfant n’acquiert pas la personnalité juridique. Le guide de la MSA et de la Caf précise que cette inscription est **un choix des parents, pas une obligation**.

**Si l’enfant est né vivant puis décédé**, ce sont les règles habituelles qui s’appliquent : constat et déclaration du décès dans les 24 heures, obsèques organisées dans les 6 jours, actes de naissance et de décès.

**Les obsèques.** Avec un acte d’enfant sans vie, la famille peut faire procéder à une inhumation ou une crémation et choisir les pompes funèbres. Des rites peuvent aussi être prévus à l’hôpital. Si vous ne souhaitez pas vous en occuper, parlez-en avec l’équipe de la maternité. Des aides financières peuvent exister auprès de la Sécurité sociale, de la mutuelle, de l’assurance ou de l’employeur.

**Les congés.** Selon le guide MSA-Caf, dès qu’un acte d’enfant sans vie est établi au-delà du seuil de viabilité, les congés de maternité et de paternité sont accordés en totalité. Un **congé de deuil** peut aussi être demandé, en plus des jours accordés par l’employeur pour événement familial : 8 jours pour les salariés, 15 jours pour certains non-salariés et personnes au chômage, indemnisés par l’Assurance maladie et à prendre dans l’année. Le Réseau de périnatalité de Normandie précise qu’en dessous du seuil de viabilité (moins de 22 semaines d’aménorrhée selon l’OMS, d’après ce réseau), la mère bénéficie d’un arrêt maladie et non d’un congé maternité.

**Les prestations.** Une **allocation versée en cas de décès d’enfant** peut être attribuée à partir de la 20e semaine de grossesse, avec un montant qui dépend des ressources. Les prestations en cours peuvent être réexaminées : transmettez l’acte d’enfant sans vie à la Caf ou à la MSA.

## Au quotidien
- **Demandez à la maternité** le certificat médical d’accouchement et les informations sur les choix possibles (prénom, rites, obsèques).
- **Laissez-vous accompagner** : la Caf ou la MSA contacte en principe les familles dès qu’elle a connaissance du décès ; vous pouvez dire que vous n’êtes pas prêt et reprendre contact plus tard. Caf : 3230 ou caf.fr.
- **Déléguez** ce qui peut l’être à un proche de confiance.

## Questions fréquentes
**Y a-t-il un délai pour demander l’acte d’enfant sans vie ?**
Renseignez-vous auprès de la mairie ou de la maternité sur les délais et les modalités. Pour les enfants non viables, la loi permet une inscription sur le livret de famille de façon rétroactive pour les enfants nés après le 11 janvier 1993.

**Le second parent a-t-il droit à un congé ?**
Oui, le congé de paternité est accordé en totalité lorsqu’un acte d’enfant sans vie est établi au-delà du seuil de viabilité ; sa partie facultative se discute avec l’employeur. Le congé de deuil peut aussi être demandé.

**Qui peut m’aider pour toutes ces démarches ?**
L’équipe de la maternité, le travailleur social de la Caf ou de la MSA, et les associations de parents endeuillés.

## Quand demander conseil
Si les démarches vous submergent, demandez l’aide du travailleur social de la Caf ou de la MSA, ou d’une association de parents endeuillés. Si vous vous sentez au bord de l’effondrement ou avez des idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['acte d’enfant sans vie', 'enfant né sans vie', 'deuil périnatal démarches', 'livret de famille', 'obsèques bébé', 'congé de deuil', 'congé maternité', 'allocation décès enfant'],
    sources: [S.msaDeuil, S.ordreSFSansVie, S.perinatNormandie],
  },
  {
    ...PERI,
    slug: 'deuil-perinatal-soutenir-un-proche',
    title: 'Deuil périnatal : comment soutenir des parents qui ont perdu leur bébé',
    summary: 'Famille, amis, collègues : les phrases à éviter, les gestes qui aident vraiment et la façon de rester présent dans la durée auprès de parents endeuillés.',
    category: 'sante-mentale',
    body_md: `Un ami, une sœur, une collègue vient de perdre son bébé. On voudrait aider, mais on a peur de mal faire, alors on se tait ou on s’éloigne. Pourtant, votre présence compte énormément.

## En bref
- Le plus important pour des parents endeuillés est de **ne pas rester seuls** ; l’entourage a un rôle clé.
- Les **phrases maladroites**, même bienveillantes, qui banalisent la souffrance blessent : par exemple « tu es jeune, tu en auras d’autres ».
- **Être présent**, écouter, proposer une **aide concrète** et **nommer le bébé** si les parents le souhaitent aident souvent davantage que les conseils.
- Le deuil dure : votre soutien est précieux **dans les semaines et les mois** qui suivent.
- Vous pouvez orienter vers les **associations spécialisées** et les professionnels, sans forcer.

## Comprendre
La Caf, dans son article « Deuil périnatal : briser le tabou », rappelle que la mort d’un tout-petit reste très taboue. Les parents se sentent fragiles et vulnérables ; certains n’osent pas considérer ce qu’ils vivent comme un vrai deuil. Le soutien des proches n’est pas toujours à la hauteur. Or, sans soutien, l’isolement peut favoriser la dépression.

Reconnaître leur peine sans la comparer ni la minimiser, se souvenir de leur bébé, prononcer son prénom s’ils le souhaitent : ces gestes simples disent aux parents qu’ils ne sont pas seuls. Chaque parent est différent : certains veulent parler, d’autres se taire. L’essentiel est de suivre leur rythme.

Psycom rappelle que le deuil périnatal augmente le risque de troubles psychiques. Votre attention peut aider à repérer qu’un parent va de plus en plus mal, et à l’encourager à se faire aider.

## Au quotidien
**Ce qui aide souvent**
- Dire simplement : « Je suis désolé(e) pour votre bébé », « Je pense à vous », « Je suis là si vous voulez parler ».
- Utiliser le prénom du bébé si les parents lui en ont donné un.
- Écouter sans chercher à consoler à tout prix ni à trouver une explication.
- Proposer une aide précise plutôt qu’un vague « dis-moi si tu as besoin » : apporter un repas, faire des courses, garder les aînés, accompagner à un rendez-vous, s’occuper d’un appel administratif.
- Donner des nouvelles régulièrement, même sans réponse : un message court suffit.
- Se souvenir des dates importantes (date prévue de l’accouchement, anniversaire) : un mot ce jour-là peut beaucoup toucher.

**Ce qui blesse souvent**
- Minimiser : « Ce n’était pas encore vraiment un bébé », « Au moins, tu ne l’as pas connu ».
- Tourner vers l’avenir trop vite : « Tu en auras d’autres ».
- Chercher une cause ou une faute : « Tu as peut-être trop travaillé ».
- Fixer un délai : « Il faut tourner la page ».
- Éviter les parents ou ne plus jamais en parler.

**Au travail**, les collègues peuvent préparer le retour avec discrétion : demander au parent ce qu’il souhaite que l’on dise ou non, et respecter son choix.

**Orienter vers un soutien** : les associations de parents endeuillés proposent écoute, groupes de parole et accompagnement (Naître et Vivre, Spama, Agapa ou Petite Émilie, citées par Psycom ou la MSA). La Caf ou la MSA propose aussi un accompagnement social gratuit.

## Questions fréquentes
**J’ai peur de raviver leur peine en parlant du bébé : vaut-il mieux se taire ?**
Éviter le sujet peut renforcer le sentiment d’isolement que décrit la Caf. Vous pouvez demander : « As-tu envie d’en parler ? » et respecter la réponse.

**Je suis moi-même enceinte : dois-je m’éloigner ?**
Pas forcément. Vous pouvez dire que vous comprenez si c’est difficile pour eux en ce moment, et leur laisser choisir la distance qui leur convient.

**Les grands-parents vivent aussi un deuil : comment les aider ?**
Ils perdent un petit-enfant et voient souffrir leur propre enfant. Ils peuvent eux aussi trouver écoute auprès des associations de deuil.

## Quand demander conseil
Encouragez un parent endeuillé à consulter s’il ne mange plus, ne dort plus, s’isole complètement ou semble désespéré. S’il évoque l’envie de mourir ou de « rejoindre » son bébé, ne le laissez pas seul et appelez le **3114** (gratuit, 24 h/24, 7 j/7), qui répond aussi aux proches inquiets. En cas de danger immédiat, composez le **15** ou le **112**.

${END}`,
    tags: ['deuil périnatal entourage', 'soutenir un proche', 'que dire', 'phrases à éviter', 'perte d’un bébé', 'amis', 'famille', 'collègues'],
    sources: [S.cafDeuil, S.msaDeuil, S.psycom],
  },
  {
    ...PERI,
    slug: 'deuil-perinatal-couple-et-freres-et-soeurs',
    title: 'Deuil périnatal : le couple, le second parent et les frères et sœurs',
    summary: 'Chaque parent vit la perte à sa façon, le second parent est souvent oublié, les aînés posent des questions : des repères pour traverser ce deuil en famille, et les soutiens qui existent pour chacun.',
    category: 'sante-mentale',
    body_md: `Après la perte d’un bébé, chaque membre de la famille est touché, mais pas de la même manière. Le couple peut se sentir décalé, le second parent oublié, les aînés désorientés. Reconnaître ces différences aide à rester unis.

## En bref
- Les deux parents vivent un **deuil**, chacun à sa manière.
- Chacun a **son rythme et sa façon** d’exprimer la peine ; ces décalages peuvent créer des tensions dans le couple.
- Certains couples **s’enferment** dans le silence ; la Caf souligne l’importance de ne pas rester seuls.
- Les **frères et sœurs** sont eux aussi concernés ; les associations proposent parfois des **ateliers pour les enfants** et des **entretiens familiaux**.
- Le **congé de paternité** est accordé en totalité lorsqu’un acte d’enfant sans vie est établi au-delà du seuil de viabilité, et un **congé de deuil** peut être demandé.

## Comprendre
**Dans le couple.** La Caf rappelle que certains couples, face au tabou, s’isolent et ne vivent pas ce qu’ils traversent comme un vrai deuil. L’association Naître et Vivre, citée dans cet article, propose d’ailleurs des ateliers sur les conséquences du deuil sur le couple, la reprise du travail et l’arrivée d’un enfant suivant. L’un peut avoir besoin d’en parler souvent, l’autre de se réfugier dans l’action ou le travail. Ces différences ne veulent pas dire que l’un souffre moins.

**Le second parent.** Il ou elle a parfois porté la gestion des démarches, l’annonce aux proches, le soutien à sa partenaire, parfois en mettant sa propre peine de côté. Il a pourtant droit, lui aussi, à du temps et à un accompagnement. Le guide de la MSA et de la Caf rappelle que le congé de paternité est accordé en totalité dans cette situation, et qu’un congé de deuil peut être demandé.

**Les frères et sœurs.** Les aînés sont eux aussi touchés, par la perte et par la tristesse qui règne à la maison. Les associations de deuil proposent, selon le guide MSA-Caf, des entretiens familiaux et des ateliers pour les enfants, qui peuvent aider à mettre des mots sur ce qui s’est passé.

## Au quotidien
**Pour le couple**
- Prenez des moments pour vous dire **comment chacun va**, sans juger la façon de l’autre.
- **Respectez les besoins différents** : l’un peut aller à un groupe de parole, l’autre préférer un entretien individuel.
- **Décidez ensemble**, à votre rythme, de ce que vous souhaitez garder ou faire pour vous souvenir du bébé.
- **Faites-vous accompagner** si le dialogue devient difficile : psychologue, association, conseiller conjugal et familial.

**Pour le second parent**
- Parlez de votre peine à un proche, à votre médecin ou à une association : vous n’avez pas à « tenir » pour tout le monde.
- Renseignez-vous sur vos droits à congé auprès de votre employeur et de votre caisse.

**Pour les aînés**
- **Dites-leur la vérité avec des mots simples**, adaptés à leur âge, plutôt que de laisser le silence ou des explications floues.
- **Rassurez-les** : ils n’y sont pour rien, et ils peuvent poser des questions.
- **Gardez leurs repères** (école, rituels, activités) autant que possible.
- **Demandez conseil** à l’association, au médecin ou au psychologue sur la façon d’en parler, et observez leurs réactions dans le temps (sommeil, peurs, comportement).

## Questions fréquentes
**Mon partenaire ne veut plus en parler : est-ce qu’il oublie notre bébé ?**
Le silence peut être une façon de se protéger, pas un oubli. Dites-lui ce dont vous avez besoin, et proposez-lui un espace de parole à lui, si cela lui convient mieux.

**Faut-il emmener nos enfants aux obsèques ?**
Il n’y a pas de réponse unique. Vous pouvez leur expliquer ce qui va se passer et leur laisser une part de choix selon leur âge. Les associations peuvent vous aider à y réfléchir.

**Notre aîné joue comme si de rien n’était : est-ce inquiétant ?**
Chaque enfant exprime sa peine à sa manière, parfois par petites touches, entre deux jeux. Restez disponibles et attentifs aux changements qui durent.

## Quand demander conseil
Consultez si l’un de vous s’effondre, s’isole ou consomme davantage d’alcool, ou si un enfant présente des troubles qui durent. En cas d’idées suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas d’urgence, composez le **15** ou le **112**.

${END}`,
    tags: ['deuil périnatal couple', 'second parent deuil', 'père endeuillé', 'frères et sœurs', 'fratrie', 'parler du deuil aux enfants', 'Naître et Vivre', 'congé paternité'],
    sources: [S.cafDeuil, S.msaDeuil],
  },
  {
    ...PREG,
    slug: 'grossesse-apres-un-deuil-perinatal',
    title: 'Une nouvelle grossesse après un deuil périnatal : vivre l’espoir et la peur',
    summary: 'Joie, peur que cela recommence, culpabilité envers le bébé disparu : une grossesse après la perte d’un enfant mêle souvent des émotions intenses. Comment se faire accompagner dès le début.',
    category: 'sante-mentale',
    body_md: `Être de nouveau enceinte après avoir perdu un bébé est souvent un mélange d’espoir et d’angoisse. Chaque échographie, chaque symptôme peut raviver la peur. Ces émotions méritent un accompagnement attentif, dès le début.

## En bref
- Les émotions sont souvent **mêlées** : joie, peur que cela se reproduise, tristesse, parfois culpabilité envers le bébé décédé.
- Les inquiétudes de grossesse, dont la **peur de perdre à nouveau le bébé**, méritent d’être reconnues sans jugement.
- L’**entretien prénatal précoce**, pris en charge à 100 %, est un temps privilégié pour parler de votre histoire et de vos besoins.
- Un **suivi psychologique** peut être proposé ; Mon soutien psy permet un accès direct à un psychologue conventionné.
- Des associations, comme **Naître et Vivre**, proposent des ateliers sur l’arrivée d’un enfant suivant.

## Comprendre
Santé publique France (1000 premiers jours) cite le témoignage d’une future mère très angoissée à l’idée d’une nouvelle fausse couche, malgré les paroles rassurantes de sa sage-femme ; échanger avec des proches ayant vécu la même épreuve lui a fait du bien. Ces doutes et ces peurs ne sont pas superficiels : ils font partie de votre histoire.

Une nouvelle grossesse ne remplace pas l’enfant perdu, et il peut arriver de craindre de « l’oublier » ou de se sentir coupable d’être heureux. La Caf rappelle que l’objectif du deuil n’est pas d’oublier, mais de construire une nouvelle histoire familiale. Le bébé à venir et celui qui est parti peuvent chacun avoir leur place.

Psycom cite le deuil périnatal parmi les situations qui augmentent le risque de troubles psychiques pendant la grossesse et après la naissance. Il est donc utile d’en parler tôt à l’équipe qui vous suit, pour qu’elle puisse vous proposer un accompagnement adapté.

## Au quotidien
- **Dites votre histoire** à la sage-femme ou au médecin dès les premiers rendez-vous, même si c’est difficile : cela leur permet d’adapter leur accompagnement et leurs explications.
- **Demandez l’entretien prénatal précoce** : il est l’occasion de parler de vos peurs, de vos besoins et de ce qui pourrait vous rassurer.
- **Préparez vos questions** avant chaque consultation : ce qui sera surveillé, quand et qui appeler en cas d’inquiétude.
- **Identifiez ce qui vous apaise** et ce qui vous angoisse : certaines personnes préfèrent ne pas annoncer la grossesse tout de suite, d’autres ont besoin d’être entourées.
- **Faites une place à vos émotions** : il est possible d’être heureux et triste à la fois.
- **Impliquez le second parent**, qui vit lui aussi cette grossesse avec son histoire et ses craintes ; l’entretien prénatal peut se faire en couple.
- **Rapprochez-vous d’une association** de parents endeuillés si vous en ressentez le besoin : échanger avec des parents qui ont vécu une grossesse après une perte aide souvent.

## Questions fréquentes
**Je n’arrive pas à m’attacher à ce bébé de peur de le perdre : est-ce grave ?**
Ce mouvement de protection est compréhensible. Parlez-en à la sage-femme ou à un psychologue : être accompagné peut vous aider à vous autoriser, peu à peu, à investir cette grossesse.

**Les dates anniversaires tombent pendant la grossesse : comment les vivre ?**
Ces moments peuvent être particulièrement chargés. Prévoyez du soutien ce jour-là, et faites ce qui a du sens pour vous.

**Comment en parler aux aînés ?**
Avec des mots simples et vrais, à leur rythme. Les associations et les professionnels peuvent vous aider à trouver les mots.

**Faut-il attendre avant de concevoir à nouveau ?**
C’est une question à aborder avec votre médecin ou votre sage-femme, qui tiendront compte de votre santé physique et de votre situation émotionnelle.

## Quand demander conseil
Parlez-en sans attendre si l’angoisse vous empêche de dormir, de manger ou de vivre la grossesse, ou si une tristesse durable s’installe. En cas d’idées noires ou suicidaires, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de saignements, de douleurs, de perte de liquide ou de baisse des mouvements du bébé, contactez la maternité ou appelez le **15** (ou le **112**).

${END}`,
    tags: ['grossesse après deuil', 'bébé arc-en-ciel', 'grossesse après perte', 'peur de perdre le bébé', 'deuil périnatal', 'anxiété grossesse', 'entretien prénatal précoce', 'enfant suivant'],
    sources: [S.ppjEmotions, S.cafDeuil, S.santeEPP],
  },
  // ───────────────────────────── Ressource transversale ─────────────────────────────
  {
    ...PARENTS,
    journeys: ['pregnant', 'newborn', 'child', 'parents_sleep'],
    slug: '3114-et-lignes-d-ecoute-pour-les-parents',
    title: 'Le 3114 et les lignes d’écoute : qui appeler quand on ne va pas bien ?',
    summary: 'Idées suicidaires, détresse, inquiétude pour un proche, épuisement, deuil : à quoi sert le 3114, comment se passe un appel, et quelles autres lignes gratuites existent pour les parents et futurs parents.',
    category: 'sante-mentale',
    safety_critical: true,
    body_md: `Il y a des moments où l’on ne sait plus vers qui se tourner, parfois en pleine nuit. Connaître les bons numéros à l’avance permet de ne pas rester seul avec sa détresse, ou avec son inquiétude pour un proche.

## En bref
- Le **3114** est le **numéro national de prévention du suicide** : gratuit, confidentiel, **24 h/24 et 7 j/7**.
- Il répond aux personnes en détresse ou ayant des idées suicidaires, aux **proches inquiets**, aux personnes **endeuillées par un suicide** et aux professionnels.
- Ce sont des **professionnels de santé mentale** (infirmiers, psychologues) qui répondent, avec l’appui de psychiatres.
- **« Si vous vous posez la question d’appeler, c’est qu’il faut appeler. »**
- D’autres lignes existent pour les parents : Allô Parents Bébé, Allô parents en crise, Naître et Vivre, Spama, SOS Préma, 3919, 119.

## Comprendre
Le 3114 a été mis en place en octobre 2021. Selon Santé.fr, les répondants sont répartis dans 18 centres régionaux et formés à l’évaluation du risque suicidaire. Leurs propos sont couverts par le secret médical.

**Comment se passe un appel ?** Un message vocal confirme que l’appel est bien reçu, puis un professionnel se présente. Il évalue d’abord s’il existe un risque de passage à l’acte immédiat. Si ce n’est pas le cas, il prend le temps de comprendre votre situation, d’apaiser l’émotion, puis de vous proposer des ressources près de chez vous, comme un centre médico-psychologique. Un rappel quelques jours plus tard est parfois proposé. Souvent, la crise est désamorcée par téléphone.

La Caf rappelle que la crise suicidaire s’installe souvent progressivement, sur plusieurs mois, ce qui laisse le temps d’agir, et que l’isolement joue un rôle important. Une personne en crise hésite souvent à parler pour ne pas inquiéter ses proches : l’encourager à en parler peut tout changer.

## Au quotidien
**Les numéros à garder dans votre téléphone** (d’après le répertoire des lignes d’écoute de Santé.fr) :
- **3114** : détresse psychique, idées suicidaires, proches inquiets, 24 h/24.
- **15** ou **112** : urgence vitale, danger immédiat.
- **Allô Parents Bébé** : 0 800 00 34 56, parents d’enfants de moins de 3 ans, en semaine.
- **Allô parents en crise** : 0 805 382 300, parents à bout ou angoissés, en semaine.
- **Naître et Vivre** : 01 47 23 05 08, parents ayant perdu un enfant, 24 h/24.
- **Spama** : 07 87 85 37 81, deuil périnatal et fin de vie d’un tout-petit, en semaine le matin.
- **SOS Préma** : 0 800 96 60 60, parents d’un bébé prématuré ou hospitalisé.
- **3919** : Violences Femmes Info, 24 h/24, anonyme et gratuit.
- **119** : Allô Enfance en danger, 24 h/24, pour un enfant en danger ou un adulte inquiet.

**Si vous êtes inquiet pour un proche** : parlez-lui directement de ce que vous observez, demandez-lui comment il va vraiment, et n’hésitez pas à appeler le 3114 vous-même pour savoir comment l’aider.

**En dehors de l’urgence**, le médecin traitant, la sage-femme, la PMI et les psychologues conventionnés (Mon soutien psy) peuvent assurer un suivi dans la durée.

## Questions fréquentes
**Je n’ai pas d’idées suicidaires, mais je vais très mal : puis-je appeler le 3114 ?**
Oui. Le 3114 s’adresse aux personnes en détresse psychique, sans attendre d’être « au bord du gouffre ».

**Mes propos resteront-ils confidentiels ?**
Oui. L’appel est gratuit et les échanges sont couverts par le secret médical.

**Que se passe-t-il si le répondant pense que je suis en danger ?**
Il évalue le risque avec vous et, si nécessaire, organise une aide adaptée, qui peut aller jusqu’à l’intervention des secours. Souvent, l’échange permet de désamorcer la crise et d’orienter vers des soins proches de chez vous.

## Quand demander conseil
Appelez le **3114** dès que vous avez des pensées suicidaires, que vous vous sentez submergé ou que vous êtes inquiet pour quelqu’un. Si la vie d’une personne est menacée dans l’immédiat, appelez le **15** ou le **112**. Si un enfant est en danger, appelez le **119**.

${END}`,
    tags: ['3114', 'prévention du suicide', 'idées suicidaires', 'ligne d’écoute', 'numéro d’urgence', 'détresse', 'proche inquiet', 'santé mentale parents'],
    sources: [S.sante3114, S.caf3114, S.santeLignes],
  },
];
