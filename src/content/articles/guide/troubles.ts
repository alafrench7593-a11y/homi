/** Guide « troubles et maladies de l'enfant » (27/10/2026) : TDAH, autisme, dys, maladies chroniques, handicap… rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles françaises). `published` = date affichée par la page, quand elle est précise.
const S = {
  pco: { label: 'Santé.fr — Repérage et prise en soins des troubles du neuro-développement grâce aux plateformes de coordination', url: 'https://www.sante.fr/reperage-et-prise-en-soins-des-troubles-du-neuro-developpement-grace-aux-plateformes-de-coordination', consulted_on: C, published: '2024-02-07' },
  forfait: { label: 'Handicap.gouv.fr — Fiche technique : forfait d’intervention précoce (troubles du neurodéveloppement), mars 2025', url: 'https://handicap.gouv.fr/sites/handicap/files/2025-04/TND-fiche-technique-forfait-intervention-2025.pdf', consulted_on: C },
  reperageTnd: { label: 'Santé.fr — Repérage précoce des troubles du neurodéveloppement chez les enfants', url: 'https://www.sante.fr/node/19853257', consulted_on: C, published: '2025-07-29' },
  dys: { label: 'Mon Parcours Handicap — Troubles dys : quels aménagements pour la scolarité ?', url: 'https://www.monparcourshandicap.gouv.fr/actualite/troubles-dys-quels-amenagements-pour-la-scolarite', consulted_on: C, published: '2025-10-10' },
  amenagements: { label: 'Mon Parcours Handicap — Quels aménagements et adaptations à l’école ?', url: 'https://www.monparcourshandicap.gouv.fr/scolarite/quels-amenagements-et-adaptations-lecole', consulted_on: C, published: '2026-04-29' },
  aeeh: { label: 'Mon Parcours Handicap — AEEH : allocation d’éducation de l’enfant handicapé', url: 'https://www.monparcourshandicap.gouv.fr/glossaire/aeeh', consulted_on: C },
  aeehFiche: { label: 'Code du travail numérique (fiche Service-Public) — Allocation d’éducation de l’enfant handicapé (AEEH)', url: 'https://code.travail.gouv.fr/fiche-service-public/allocation-deducation-de-lenfant-handicape-aeeh', consulted_on: C, published: '2026-06-01' },
  autisme: { label: 'Mon Parcours Handicap — Journée mondiale de sensibilisation à l’autisme', url: 'https://www.monparcourshandicap.gouv.fr/index.php/actualite/journee-mondiale-de-sensibilisation-lautisme', consulted_on: C, published: '2026-04-01' },
  autismeFiche: { label: 'Maison de l’autisme (gouvernement) — Fiche pratique : qu’est-ce que l’autisme ?', url: 'https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Quest-ce-que-lautisme.pdf', consulted_on: C },
  aidant: { label: 'Maison de l’autisme (gouvernement) — Fiche pratique : proche aidant de personne autiste', url: 'https://maisondelautisme.gouv.fr/app/uploads/2025/09/Fiche-pratique-Proche-aidant-de-personne-autiste.pdf', consulted_on: C },
  tdah: { label: 'Santé.fr — Hyperactivité et trouble de l’attention chez l’enfant', url: 'https://www.sante.fr/node/2055605', consulted_on: C, published: '2026-08-12' },
  tdahJournee: { label: 'Santé.fr (Handicap.gouv.fr) — Journée nationale de sensibilisation au TDAH', url: 'https://www.sante.fr/node/7000373', consulted_on: C, published: '2025-06-12' },
  cognitifs: { label: 'Santé.fr (mpedia) — Troubles cognitifs, les troubles qui ne se voient pas', url: 'https://www.sante.fr/node/1093926', consulted_on: C, published: '2025-03-07' },
  tics: { label: 'Santé.fr (Inserm) — Syndrome Gilles de La Tourette : des tics indomptables', url: 'https://www.sante.fr/node/20103641', consulted_on: C, published: '2026-07-23' },
  begaiement: { label: 'Santé.fr (mpedia) — Le bégaiement, un problème de rythme de la parole', url: 'https://www.sante.fr/le-begaiement-un-probleme-de-rythme-de-la-parole', consulted_on: C, published: '2025-12-08' },
  santeMentale: { label: 'info.gouv.fr — La santé mentale à tous les âges', url: 'https://www.info.gouv.fr/grand-dossier/parlons-sante-mentale/la-sante-mentale-a-tous-les-ages', consulted_on: C, published: '2026-08-03' },
  toc: { label: 'Santé.fr (Inserm) — Troubles obsessionnels compulsifs (TOC) : une prise en charge le plus souvent efficace', url: 'https://www.sante.fr/node/4757389', consulted_on: C, published: '2021-12-28' },
  depression: { label: 'Santé.fr (mpedia) — La dépression de l’enfant, un mal pas toujours perceptible', url: 'https://www.sante.fr/la-depression-de-lenfant-un-mal-pas-toujours-perceptible', consulted_on: C, published: '2026-08-07' },
  depressionAdo: { label: 'Santé.fr — Dépression chez l’enfant et l’adolescent', url: 'https://www.sante.fr/node/2055581', consulted_on: C, published: '2026-08-12' },
  hpi: { label: 'Santé.fr (Inserm) — Identifier le haut potentiel intellectuel avec un test sur Internet, vraiment ?', url: 'https://www.sante.fr/node/6501373', consulted_on: C, published: '2023-04-13' },
  epilepsie: { label: 'Santé.fr — Comprendre l’épilepsie : causes, symptômes et traitements', url: 'https://www.sante.fr/epilepsie', consulted_on: C, published: '2026-08-13' },
  diabete: { label: 'Santé.fr — Diabète de type 1 chez l’enfant : savoir reconnaître les signes pour limiter les complications', url: 'https://www.sante.fr/node/17809241', consulted_on: C, published: '2025-09-12' },
  drepano: { label: 'Santé.fr (Inserm) — Drépanocytose, la maladie génétique la plus fréquente en France', url: 'https://www.sante.fr/node/4750839', consulted_on: C, published: '2023-06-19' },
  depistageNeonatal: { label: 'ARS Île-de-France — Le programme national de dépistage néonatal', url: 'https://www.iledefrance.ars.sante.fr/le-programme-national-de-depistage-neonatal', consulted_on: C, published: '2025-03-26' },
  eczema: { label: 'Santé.fr — Eczéma (dermatite atopique)', url: 'https://www.sante.fr/sinformer/pathologie/maladies-peau/eczema-dermatite-atopique', consulted_on: C },
  peau: { label: 'Santé.fr — Problèmes de peau chez les enfants', url: 'https://www.sante.fr/problemes-de-peau-chez-les-enfants', consulted_on: C, published: '2026-08-12' },
  pollens: { label: 'Santé.fr — Effets des pollens sur la santé', url: 'https://www.sante.fr/effets-des-pollens-sur-la-sante-1', consulted_on: C, published: '2026-05-06' },
  surpoids: { label: 'Santé.fr (mpedia) — Comment gérer le surpoids de votre enfant ?', url: 'https://www.sante.fr/node/1093934', consulted_on: C, published: '2026-01-26' },
  pai: { label: 'Bulletin officiel de l’Éducation nationale n° 9 du 4 mars 2021 — Circulaire sur le projet d’accueil individualisé (PAI)', url: 'https://www.education.gouv.fr/bo/21/Hebdo9/MENE2104832C.htm', consulted_on: C, published: '2021-03-04' },
  maladiesRares: { label: 'ARS Bretagne (portail d’accompagnement des professionnels de santé) — Mémo ressources maladies rares', url: 'https://bretagne.paps.sante.fr/media/67713/download', consulted_on: C },
} satisfies Record<string, ArticleSource>;

const FIN = 'Cet article vous informe et vous aide à vous repérer ; il ne permet pas de poser un diagnostic et ne remplace pas l’avis du médecin ou des professionnels qui suivent votre enfant.';
const NEURO = { journeys: ['child', 'newborn'] as LibArticle['journeys'], status: 'to_review' as const, category: 'neurodeveloppement' as const };
const KID = { journeys: ['child'] as LibArticle['journeys'], status: 'to_review' as const };
const CHRONIC = { journeys: ['child'] as LibArticle['journeys'], status: 'to_review' as const, category: 'maladies-chroniques' as const };

export const GUIDE_TROUBLES: LibArticle[] = [
  // ------------------------------------------------------------------ troubles du neurodéveloppement
  {
    ...NEURO, slug: 'tnd-plateforme-pco-forfait-intervention-precoce', tags: ['neuro', 'pco', 'forfait', 'repérage', 'tnd'],
    title: 'Plateformes de coordination (PCO) et forfait d’intervention précoce : comment ça marche ?',
    summary: 'Quand un médecin repère un développement inhabituel, une plateforme de coordination peut organiser bilans et séances sans attendre un diagnostic, pris en charge par l’Assurance maladie.',
    sources: [S.pco, S.forfait, S.reperageTnd],
    body_md: `## En bref
- Les **plateformes de coordination et d’orientation (PCO)** organisent un parcours de bilans et d’interventions précoces **sans attendre un diagnostic stabilisé**.
- Elles concernent les **troubles du neurodéveloppement (TND)** : autisme, TDAH, troubles « dys », trouble du développement intellectuel…
- On y accède **uniquement sur prescription médicale** (médecin traitant, pédiatre, médecin de PMI, de crèche ou scolaire).
- Le **forfait d’intervention précoce** finance bilans et séances d’ergothérapeute, de psychologue et de psychomotricien : la famille n’avance pas les frais une fois le parcours validé.

## Comprendre
Les troubles du neurodéveloppement concernent, selon Santé.fr, environ **une personne sur six**. La stratégie nationale 2023-2027 fait du repérage et de l’accompagnement **le plus tôt possible** une priorité : agir tôt aide l’enfant et évite d’ajouter des difficultés aux difficultés.

Une PCO ne pose pas d’étiquette d’emblée. Son rôle est de **lever un doute ou d’avancer vers un diagnostic** tout en proposant déjà des interventions utiles. Le parcours dure **24 mois** et peut être renouvelé. Il s’adresse d’abord aux enfants de **0 à 6 ans inclus** ; une extension aux **7-12 ans** existe depuis 2021.

Les étapes décrites par Santé.fr :
1. Vous consultez un médecin (traitant, pédiatre, PMI, médecin scolaire).
2. Si les signes le justifient, il adresse l’enfant à une PCO et prescrit le parcours.
3. Le médecin coordonnateur de la PCO valide la demande **dans les 15 jours** et propose un parcours adapté.
4. La PCO prend les rendez-vous auprès de structures ou de professionnels qui ont signé avec elle, **au plus près du domicile**.
5. Un accompagnement psychologique et administratif est possible si la famille le souhaite.

## Au quotidien
**Ce que couvre le forfait** (fiche technique handicap.gouv.fr, mars 2025) : un **bilan** (simple ou neuropsychologique complet) et, en moyenne, **35 séances de 45 minutes** ; il peut se limiter au bilan ou mobiliser les trois professions. Sa durée est d’**un an, renouvelable une fois**. Les comptes rendus, la coordination et les déplacements des professionnels sont inclus. L’enfant peut aussi voir un orthophoniste ou un kinésithérapeute, remboursés de façon habituelle.

**Avant le rendez-vous** : notez ce qui vous interroge (langage, contact, motricité, attention, sommeil), apportez le carnet de santé et, si possible, de courtes vidéos du quotidien. Pour les 0-3 ans, un livret de repérage existe pour les parents et les professionnels ; pour les 7-12 ans, un livret avec des volets familles, enseignants et médecins.

## Questions fréquentes
**Faut-il un diagnostic pour être aidé ?** Non. C’est justement l’intérêt du dispositif : les interventions commencent pendant que l’évaluation se poursuit.

**Peut-on contacter la PCO directement ?** L’orientation se fait sur **prescription médicale** : commencez par votre médecin, qui fera le lien.

**Est-ce payant ?** Les professionnels du forfait sont rémunérés par l’Assurance maladie ; une fois le parcours validé, la famille **n’avance pas de frais**.

**Et après le forfait ?** La PCO aide à préparer la suite, notamment une éventuelle demande à la MDPH si des besoins durables se confirment.

## Quand demander conseil
- Dès qu’un écart de développement vous inquiète : **parlez-en à votre médecin** sans attendre la visite suivante.
- Toute **perte d’une compétence acquise** (mots, jeux, gestes) mérite un avis rapide.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'autisme-signes-d-alerte-et-reperage', tags: ['neuro', 'autisme', 'tsa', 'repérage', 'signes'],
    title: 'Autisme : les signes qui doivent amener à consulter',
    summary: 'Pas de babillage à 12 mois, pas de mots à 18 mois, perte de langage : ces signaux d’alerte justifient d’en parler à un médecin, qui peut orienter vers un bilan précoce.',
    sources: [S.autisme, S.autismeFiche, S.pco],
    body_md: `## En bref
- L’autisme, ou **trouble du spectre de l’autisme (TSA)**, est un trouble du neurodéveloppement qui apparaît dès l’enfance et dure toute la vie.
- Les signes peuvent souvent être **repérés avant 3 ans**.
- Signaux d’alerte : **pas de babillage ni de gestes sociaux vers 12 mois**, **pas de mots vers 18 mois**, désintérêt pour l’entourage, et **perte de langage ou de compétences sociales à tout âge**.
- En cas de doute, consultez : le médecin peut prescrire un **parcours de bilan et d’intervention précoce** via une plateforme de coordination (PCO).

## Comprendre
Selon la Maison de l’autisme, l’autisme se manifeste surtout par :
- des **difficultés de communication et d’interaction sociales** : langage oral retardé ou absent, répétition de mots ou de phrases (écholalie), compréhension « au premier degré », contact visuel inhabituel, difficulté à comprendre les codes sociaux ou à partager ses intérêts ;
- des **comportements et intérêts restreints ou répétitifs** : routines rigides, difficulté à accepter les changements, intérêts très intenses, stéréotypies motrices ou verbales ;
- des **particularités sensorielles** : hyper- ou hyposensibilité aux bruits, lumières, textures…

Chaque personne autiste est unique, d’où le terme de **spectre** : les profils, les forces et les besoins varient beaucoup. Le terme TSA remplace depuis 2013 celui de « troubles envahissants du développement ». L’autisme est reconnu comme un handicap en France depuis 1996.

Origine : l’autisme est **multifactoriel**, avec une forte part génétique et des facteurs environnementaux périnataux. Les scientifiques s’accordent sur un point important pour les familles : **les caractéristiques psychologiques des parents n’ont aucun rôle** dans sa survenue.

## Au quotidien
- **Observez sans vous alarmer** : notez ce qui vous interroge (réponse au prénom, pointage, jeux, réactions aux bruits), à quel âge, dans quelles situations.
- **Parlez-en** au médecin traitant, au pédiatre, au médecin de PMI, de crèche ou de l’Éducation nationale. Ces professionnels peuvent prescrire le parcours de bilan précoce pris en charge par une PCO.
- **N’attendez pas un diagnostic** pour agir : les interventions précoces (ergothérapie, psychomotricité, psychologue) peuvent commencer pendant l’évaluation.
- Pour être écouté et orienté : **Autisme Info Service, 0 800 71 40 40** (gratuit, du lundi au vendredi de 9 h à 13 h, et le mardi de 18 h à 20 h).

## Questions fréquentes
**Qui pose le diagnostic ?** Seul un **médecin**, en s’appuyant sur les bilans de professionnels, peut poser un diagnostic de trouble du spectre de l’autisme.

**Mon enfant parle tard : est-ce forcément de l’autisme ?** Non. Un retard de langage a de nombreuses explications ; c’est l’ensemble des signes, leur durée et leur retentissement qu’évalue le médecin.

**Est-ce que l’éducation y est pour quelque chose ?** Non. Les connaissances actuelles écartent tout rôle de la personnalité ou de l’attitude des parents.

**Qu’apporte un repérage précoce ?** Un dépistage précoce **améliore la prise en charge** : l’accompagnement peut être adapté plus tôt aux besoins de l’enfant.

## Quand demander conseil
- Absence de babillage, de gestes ou de mots aux âges indiqués, ou **perte d’une compétence acquise** : consultez rapidement.
- Si vous vous sentez épuisé ou seul : votre médecin, la PMI, Autisme Info Service.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'autisme-au-quotidien-communication-routines', tags: ['neuro', 'autisme', 'tsa', 'quotidien', 'aidants'],
    title: 'Vivre avec un enfant autiste : communication, routines et soutien des parents',
    summary: 'Prévisibilité, attention aux sensibilités sensorielles, communication adaptée et droits des aidants : des repères pour le quotidien d’une famille avec un enfant autiste.',
    sources: [S.autismeFiche, S.aidant, S.autisme],
    body_md: `## En bref
- Chaque enfant autiste a **ses forces et ses difficultés** : l’accompagnement se construit à partir de son profil, avec les professionnels qui le suivent.
- Les **routines** et la **prévisibilité** aident souvent, car les changements peuvent être difficiles à accepter.
- Les **particularités sensorielles** (bruit, lumière, textures) expliquent beaucoup de réactions : les repérer change le quotidien.
- Les parents sont des **aidants** : ils ont droit à une formation, à des solutions de répit et à un soutien.

## Comprendre
L’autisme touche la **communication sociale** et s’accompagne d’**intérêts restreints ou répétitifs** et de **particularités sensorielles** (hyper- ou hyposensibilité). La Maison de l’autisme rappelle que l’évolution est possible avec un accompagnement adapté et individualisé.

Ce qui peut sembler être un « caprice » est parfois une réaction à une surcharge sensorielle, à un imprévu ou à une consigne mal comprise : l’enfant peut comprendre les mots **au premier degré** et avoir du mal à saisir le sous-entendu.

## Au quotidien
**Rendre la journée prévisible**
- Annoncez à l’avance ce qui va se passer, et prévenez des changements autant que possible.
- Gardez des repères stables pour les moments clés (lever, repas, coucher).

**Adapter la communication**
- Utilisez des phrases courtes et concrètes, une consigne à la fois.
- Vérifiez que la consigne est comprise plutôt que de la répéter plus fort.
- Les professionnels (orthophoniste, psychologue, ergothérapeute) peuvent proposer des outils adaptés à votre enfant : demandez-leur comment les reprendre à la maison.

**Tenir compte des sensibilités**
- Repérez ce qui déclenche l’inconfort (bruit, foule, vêtements, aliments) et ce qui apaise.
- Prévoyez un endroit calme où l’enfant peut se ressourcer.

**Prendre soin de vous**
- Le **statut d’aidant familial** est défini par la loi et ouvre des aides.
- Vous avez **droit à une formation** pour mieux accompagner votre enfant, et à des **solutions de répit**.
- Après le diagnostic, la **MDPH** évalue les besoins et ouvre des droits : allocation (AEEH), aides humaines ou matérielles, accompagnement scolaire.

## Questions fréquentes
**Où trouver de l’aide près de chez moi ?** La MDPH, les **centres de ressources autisme (CRA)**, les services sociaux et les associations locales. La Maison de l’autisme (Aubervilliers) informe et accompagne les familles.

**Quels numéros peuvent m’aider ?** Autisme Info Service **0 800 71 40 40** ; le **0 800 360 360** (conseils de proximité pour les personnes handicapées et leurs aidants, gratuit) ; le **0 805 805 110** (numéro vert sur l’école inclusive).

**Mon enfant peut-il aller à l’école ordinaire ?** Oui, avec ou sans aménagements : PAP, PPS, aide humaine (AESH), selon ses besoins et les décisions de la MDPH.

**Je me sens dépassé, est-ce grave ?** Non, c’est un signal à écouter : parlez-en à votre médecin, aux professionnels qui suivent l’enfant, ou à une association.

## Quand demander conseil
- Changement brutal de comportement, refus alimentaire, troubles du sommeil importants : parlez-en au médecin.
- Détresse d’un parent ou idées noires : **3114** (24 h/24, gratuit).
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'tdah-signes-et-vie-a-la-maison', tags: ['neuro', 'tdah', 'hyperactivité', 'attention', 'quotidien'],
    title: 'TDAH : reconnaître les signes et organiser la vie à la maison',
    summary: 'Inattention, agitation, impulsivité qui durent et gênent la vie de l’enfant : voici comment reconnaître le TDAH et organiser un quotidien plus serein.',
    sources: [S.tdah, S.tdahJournee],
    body_md: `## En bref
- Le **TDAH** (trouble du déficit de l’attention avec ou sans hyperactivité) est un **trouble du neurodéveloppement**.
- Il associe, de façon **durable et gênante**, **inattention**, **agitation** et **impulsivité**.
- Il ne vient **pas d’une mauvaise éducation** et ne disparaît pas forcément à 18 ans.
- À la maison, une journée **structurée**, des **objectifs simples** et de l’**activité physique** aident beaucoup.

## Comprendre
Santé.fr distingue l’enfant simplement vif de l’enfant dont les symptômes **le handicapent** et sont difficiles à vivre pour l’entourage. Quand une hyperactivité s’accompagne de **grandes difficultés à rester attentif, de manière durable**, le TDAH doit être évoqué.

Les signes décrits :
- **Hyperactivité** : l’enfant est constamment agité, ne tient pas en place.
- **Impulsivité** : il agit souvent sans réfléchir.
- **Inattention** : il ne parvient pas à se concentrer plus de quelques minutes, même sur ses jouets, et s’énerve vite s’il ne réussit pas.
- Autres manifestations possibles : hyperémotivité, sautes d’humeur, crises de colère, endormissement difficile et sommeil court.

Ces difficultés peuvent conduire à un **rejet** à l’école ou dans la famille, d’où l’importance de les comprendre. Selon le ministère chargé des personnes handicapées, environ **6 % des enfants** et **3 % des adultes** seraient concernés en France. Les causes sont mal connues ; un facteur génétique semble important, et la prématurité pourrait jouer un rôle.

## Au quotidien
Les conseils de Santé.fr :
- **Organisez la journée toujours de la même façon** : école, activité physique, jeux, repas, coucher, avec de bonnes conditions de sommeil.
- **Fixez des objectifs simples et rapides**, et **valorisez chaque réussite** pour restaurer la confiance de l’enfant.
- **Ne punissez pas les échecs** : cela risque d’installer agressivité et agitation.
- **Offrez un exutoire physique** : une activité sportive régulière réduit l’agitation et favorise le sommeil.
- **Renseignez-vous** : des hôpitaux et des associations organisent des réunions de parents.

Pensez aussi à vous : les parents d’enfants avec un TDAH sont souvent épuisés et inquiets. La prise en charge prévoit d’ailleurs un accompagnement **des parents** autant que de l’enfant.

## Questions fréquentes
**Mon enfant bouge beaucoup : a-t-il un TDAH ?** Pas forcément. Ce qui compte, c’est l’intensité, la durée et le retentissement des difficultés. Seul un spécialiste peut poser le diagnostic.

**Est-ce de ma faute ?** Non. Le TDAH n’est pas causé par une mauvaise éducation.

**Les écrans aggravent-ils les choses ?** Les sources consultées ne tranchent pas pour le TDAH ; une journée régulière, avec du mouvement et un bon sommeil, reste le socle conseillé.

**Le TDAH disparaît-il à l’adolescence ?** Pas toujours : il peut persister à l’âge adulte, d’où l’intérêt d’un suivi.

## Quand demander conseil
- Si l’inattention ou l’agitation **durent** et gênent l’école, les relations ou la vie de famille : consultez le médecin traitant ou le pédiatre.
- Si l’enfant est triste, se dévalorise ou parle de mourir : consultez vite ; **3114** (24 h/24).
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'tdah-diagnostic-et-prises-en-charge', tags: ['neuro', 'tdah', 'diagnostic', 'traitement', 'tcc'],
    title: 'TDAH : qui fait le diagnostic et quelles prises en charge ?',
    summary: 'Le diagnostic du TDAH relève d’un spécialiste ; la prise en charge commence par une aide psychothérapeutique de l’enfant et des parents, parfois complétée par un médicament.',
    sources: [S.tdah, S.pco, S.forfait],
    body_md: `## En bref
- Selon Santé.fr, **seul un pédopsychiatre ou un neurologue** peut diagnostiquer le TDAH.
- La prise en charge commence par un **accompagnement psychothérapeutique de l’enfant et des parents**.
- Les **thérapies cognitivo-comportementales** sont efficaces dans de nombreux cas, même sans médicament.
- Un **médicament psychostimulant** peut être ajouté après 6 ans, toujours en complément et avec un suivi.

## Comprendre
**Le parcours** : tout commence souvent chez le médecin traitant ou le pédiatre, à qui vous décrivez les difficultés. Pour les jeunes enfants, une **plateforme de coordination et d’orientation (PCO)** peut organiser des bilans et des séances (ergothérapeute, psychologue, psychomotricien) prises en charge par l’Assurance maladie, **sans attendre que le diagnostic soit posé**. Le diagnostic lui-même relève du spécialiste.

**Les prises en charge non médicamenteuses** décrites par Santé.fr :
- un soutien psychothérapeutique de l’enfant **et des parents**, souvent épuisés ;
- des **thérapies cognitivo-comportementales (TCC)** menées par des spécialistes formés : elles aident l’enfant à améliorer sa mémoire et à mieux organiser son temps ;
- selon les troubles associés : **orthophonie, psychomotricité, relaxation**…

**Les médicaments** : chez l’enfant de **plus de 6 ans**, un psychostimulant peut être proposé **en complément** de la psychothérapie. Il nécessite l’avis d’un pédopsychiatre et doit toujours être associé à une prise en charge psychothérapeutique et psychopédagogique. Il est souvent interrompu les week-ends et vacances. Il peut ralentir un peu la croissance (effet compensé lors des pauses) et accélérer légèrement le cœur ou la tension : une **surveillance régulière** est donc prévue. Le ministère rappelle que la France **ne surprescrit pas** ce traitement.

## Au quotidien
- **Préparez la consultation** : exemples concrets à la maison et à l’école, bulletins, remarques des enseignants, sommeil.
- **Impliquez l’école** : des aménagements (PAP, voire PPS via la MDPH) peuvent être mis en place.
- **Suivez le traitement tel que prescrit** et notez ce que vous observez (appétit, sommeil, humeur) pour en parler au médecin.
- **Ne modifiez jamais seul** un traitement : posez vos questions au prescripteur.

## Questions fréquentes
**Faut-il forcément un médicament ?** Non. Les TCC et l’accompagnement des parents sont la première étape ; le médicament est un complément possible, discuté avec le spécialiste.

**Le délai pour voir un spécialiste est long : que faire ?** Commencez par le médecin traitant ; pour un enfant jeune, demandez-lui si une orientation vers une **PCO** est possible.

**Le médicament change-t-il la personnalité ?** Les sources consultées décrivent un effet régulateur qui améliore la vie à l’école et à la maison ; parlez de toute inquiétude au prescripteur.

**Qui paie les séances d’ergothérapie ou de psychomotricité ?** Dans le cadre du forfait d’intervention précoce validé par une PCO, l’Assurance maladie rémunère ces professionnels.

## Quand demander conseil
- Effets inattendus d’un traitement (sommeil, appétit, palpitations) : contactez le médecin qui suit l’enfant.
- Tristesse durable, propos inquiétants : consultez vite ; **3114**.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'tdah-et-troubles-dys-amenagements-a-l-ecole', tags: ['neuro', 'tdah', 'dys', 'école', 'pap', 'pps', 'aesh'],
    title: 'TDAH, dys : quels aménagements à l’école (PAP, PPS, AESH) ?',
    summary: 'PAP sans reconnaissance de handicap, PPS décidé par la MDPH, aide humaine, matériel adapté, temps majoré aux examens : le point sur les aménagements possibles.',
    sources: [S.amenagements, S.dys],
    body_md: `## En bref
- Le **PAP** (plan d’accompagnement personnalisé) concerne les troubles des apprentissages durables, **sans reconnaissance de handicap**.
- Le **PPS** (projet personnalisé de scolarisation) est décidé après une demande à la **MDPH** et peut prévoir une aide humaine (AESH) et du matériel.
- Le **pôle d’appui à la scolarité (PAS)** apporte une première réponse rapide, sans attendre une reconnaissance de handicap.
- Aux examens : **temps majoré** (en principe jusqu’à un tiers du temps), pauses, matériel, secrétaire…

## Comprendre
Mon Parcours Handicap décrit plusieurs dispositifs selon la situation :
- **PPRE** : pour des difficultés d’acquisition du socle commun, de courte durée.
- **PAI** : pour un trouble de santé (traitement, régime, protocole d’urgence).
- **PAP** : pour des difficultés **durables** liées à un trouble des apprentissages (dyslexie, dyspraxie, dysphasie…), quand PPRE et PAI ne suffisent pas. Il peut prévoir un **allègement du travail**, du **temps supplémentaire**, des **supports adaptés**, des **évaluations aménagées**, une place particulière en classe ou une prise en charge extérieure pendant le temps scolaire.
- **PPS** : pour un élève reconnu en situation de handicap par la MDPH. Il définit les adaptations, un emploi du temps aménagé (fatigue, soins, rééducations), l’aide humaine, le **matériel pédagogique adapté**, voire une scolarité en **Ulis**. L’**équipe de suivi de la scolarisation (ESS)** veille à sa mise en œuvre.

Le **livret parcours inclusif (LPI)** permet de suivre les aménagements, avec l’accord des parents.

## Au quotidien
Exemples d’aménagements cités : reformuler les consignes, photocopies recto seul, **police plus grande**, cours sur **clé USB**, fiches mémo, place adaptée en classe, ordinateur, allègement du travail.

Démarches :
1. Parlez-en à l’enseignant et au directeur ou chef d’établissement dès que les difficultés apparaissent.
2. Pour un PAP, le médecin de l’Éducation nationale donne son avis sur le trouble.
3. Pour un PPS ou une aide humaine, déposez une demande à la **MDPH** ; l’**enseignant référent** vous accompagne.
4. Pour un examen, envoyez la demande d’aménagement **dès l’inscription** au médecin désigné, et une copie sans information médicale au service des examens.

## Questions fréquentes
**PAP ou PPS : comment choisir ?** Le PAP ne nécessite pas de reconnaissance de handicap ; le PPS passe par la MDPH et permet notamment une aide humaine ou du matériel attribué.

**Mon enfant peut-il redoubler la maternelle ?** Le maintien en maternelle est une mesure **exceptionnelle**, que seule la CDAPH peut décider dans le cadre d’un PPS.

**Les aménagements suivent-ils l’enfant en changeant d’école ?** Le chef d’établissement assure la continuité ; le LPI aide à transmettre l’information.

**Qui contacter en cas de blocage ?** L’enseignant référent, la MDPH, le numéro vert école inclusive **0 805 805 110**.

## Quand demander conseil
- Si votre enfant s’épuise, perd confiance ou refuse d’aller à l’école : parlez-en à l’équipe et au médecin.
- Mal-être important ou propos inquiétants : **3114** ; enfant en danger : **119**.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'dyslexie-dysorthographie-enfant', tags: ['neuro', 'dys', 'dyslexie', 'dysorthographie', 'lecture'],
    title: 'Dyslexie et dysorthographie : comprendre et accompagner',
    summary: 'Une lecture lente et coûteuse, des erreurs d’orthographe persistantes malgré les efforts : voici comment reconnaître ces troubles et où trouver de l’aide.',
    sources: [S.cognitifs, S.dys, S.amenagements],
    body_md: `## En bref
- La **dyslexie** est un trouble de l’acquisition de la **lecture** ; la **dysorthographie**, de l’**orthographe**. Elles sont souvent associées.
- Ce sont des **troubles durables**, chez un enfant **sans déficience intellectuelle**.
- Plus le trouble est repéré tôt, plus les aides sont efficaces.
- Bilan **pluridisciplinaire**, rééducation orthophonique et aménagements scolaires (PAP, PPS) sont les principales réponses.

## Comprendre
Selon mpedia (repris par Santé.fr), l’enfant dyslexique **lit lentement**, fait de nombreuses erreurs et **comprend mal ce qu’il lit**. Mon Parcours Handicap précise que la lecture demande une **attention soutenue**, source de **fatigue**. La dysorthographie se traduit par des erreurs fréquentes dans l’écriture des mots.

Ces troubles font partie des **troubles spécifiques des apprentissages** : ils touchent une fonction précise, sans que l’intelligence soit en cause. Ils peuvent s’associer à d’autres « dys » ou à un TDAH. Souvent mal connus, ils sont parfois confondus avec de simples difficultés, et l’enfant peut se sentir **incompris et dévalorisé**.

## Au quotidien
**Le repérage** peut venir des parents, des enseignants ou des professionnels de la petite enfance. Le **dépistage** relève des médecins, des infirmiers de PMI ou des médecins scolaires.

**Le bilan** : dès qu’un trouble est suspecté, un bilan pluridisciplinaire est recommandé, prescrit par un pédiatre, un neuropédiatre ou un pédopsychiatre, avec en général un **bilan orthophonique** et un **bilan psychologique**.

**À la maison**
- Valorisez les efforts et les progrès plutôt que le nombre d’erreurs.
- Lisez-lui des histoires, alternez lecture partagée et écoute.
- Avec l’équipe soignante, choisissez d’éventuels **outils numériques** (logiciels d’aide à la lecture ou à l’écriture).

**À l’école** : reformulation des consignes, police plus grande, temps supplémentaire, évaluations aménagées, orthographe non sanctionnée aux examens selon les cas (PAP ou PPS).

## Questions fréquentes
**À partir de quand peut-on parler de dyslexie ?** Le diagnostic est posé par des professionnels après un bilan, une fois l’apprentissage de la lecture engagé ; parlez de vos inquiétudes dès qu’elles apparaissent.

**Mon enfant est-il moins intelligent ?** Non. Par définition, ces troubles touchent une fonction précise chez un enfant sans déficience intellectuelle.

**La rééducation est-elle remboursée ?** Les séances d’orthophonie sont prises en charge sur prescription selon les règles habituelles de l’Assurance maladie.

**Peut-on obtenir une aide financière ?** Selon la situation, une demande à la MDPH (CDAPH) peut ouvrir des droits comme l’AEEH.

## Quand demander conseil
- Lecture très laborieuse qui ne progresse pas, refus de lire, fatigue scolaire : parlez-en à l’enseignant et au médecin.
- Perte de confiance, tristesse : consultez ; **3114** si détresse.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'dyspraxie-trouble-de-la-coordination', tags: ['neuro', 'dys', 'dyspraxie', 'tdc', 'motricité', 'écriture'],
    title: 'Dyspraxie (trouble de la coordination) : quand les gestes ne s’automatisent pas',
    summary: 'Maladresse marquée, écriture difficile, lenteur pour s’habiller : la dyspraxie touche les gestes automatisés et se compense avec des rééducations et des aménagements.',
    sources: [S.cognitifs, S.dys, S.amenagements],
    body_md: `## En bref
- La **dyspraxie** (aussi appelée trouble de l’acquisition de la coordination) est un trouble du **développement moteur et des fonctions visuospatiales**.
- Les **gestes s’automatisent mal** : maladresse, **écriture et dessin difficiles** (dysgraphie), lenteur.
- L’enfant s’épuise en **double tâche** : écrire et réfléchir en même temps lui coûte beaucoup.
- Ergothérapie, psychomotricité et **outils informatiques** font souvent partie de l’accompagnement.

## Comprendre
Selon mpedia (repris par Santé.fr), la dyspraxie est une altération des **gestes automatisés**. L’enfant est souvent **lent**, a du mal à **s’habiller**, à utiliser les outils scolaires ou du quotidien (ciseaux, règle, compas, couverts) et se **repère mal sur une feuille ou un plan**.

Mon Parcours Handicap souligne la difficulté en **double tâche** : quand un geste n’est pas automatique, il mobilise l’attention que l’enfant ne peut plus consacrer au contenu (par exemple, copier une leçon et la comprendre).

La dyspraxie appartient aux troubles « dys », sans déficience intellectuelle. Elle peut s’associer à d’autres troubles. Santé.fr (Inserm) signale aussi que des enfants à haut potentiel au profil hétérogène peuvent présenter ce type de difficulté.

## Au quotidien
**Le bilan** est pluridisciplinaire, coordonné par un médecin (pédiatre, neuropédiatre, pédopsychiatre), avec selon les besoins **psychomotricien, ergothérapeute, orthoptiste, neuropsychologue**.

**À la maison**
- Laissez du temps pour s’habiller ; privilégiez des vêtements faciles (scratchs, élastiques).
- Décomposez les gestes complexes, une étape à la fois.
- Valorisez ce qui réussit à l’oral, souvent un point fort.

**À l’école**
- **Ordinateur** ou matériel numérique pour limiter l’écriture manuscrite, cours fournis sur clé USB ou photocopiés.
- **Temps supplémentaire**, réduction de la copie, évaluations à l’oral quand c’est possible.
- Ces aménagements passent par un **PAP** ou, après demande à la MDPH, un **PPS** (avec éventuellement du **matériel pédagogique adapté**).

## Questions fréquentes
**Mon enfant est maladroit : est-il dyspraxique ?** La maladresse seule ne suffit pas ; c’est son intensité, sa durée et son retentissement que le bilan évalue.

**Faut-il l’empêcher d’écrire à la main ?** Non : l’objectif est de choisir, avec l’ergothérapeute, ce qui lui permet d’apprendre sans s’épuiser.

**L’ergothérapie est-elle prise en charge ?** Dans le cadre d’un forfait d’intervention précoce validé par une PCO, oui ; sinon, renseignez-vous auprès de la MDPH.

**Le sport est-il déconseillé ?** Non ; choisissez une activité où l’enfant prend du plaisir, en parlant de ses besoins à l’encadrant.

## Quand demander conseil
- Difficultés motrices qui gênent l’autonomie ou l’école, refus d’écrire, fatigue importante : parlez-en au médecin.
- Perte de confiance, isolement : consultez ; **3114** si détresse.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'dyscalculie-difficultes-avec-les-nombres', tags: ['neuro', 'dys', 'dyscalculie', 'mathématiques'],
    title: 'Dyscalculie : quand les nombres restent difficiles',
    summary: 'Comprendre et utiliser les nombres, compter, retenir les tables : la dyscalculie est un trouble durable qui se repère et s’accompagne.',
    sources: [S.cognitifs, S.dys, S.amenagements],
    body_md: `## En bref
- La **dyscalculie** est une **difficulté durable à comprendre et utiliser les nombres**.
- Elle se traduit par des difficultés en **calcul**, en **comptage** et une **mémorisation fragile** des faits numériques (tables, résultats simples).
- Elle fait partie des troubles « dys », chez un enfant sans déficience intellectuelle.
- Un **bilan** permet d’adapter rééducation et aménagements scolaires.

## Comprendre
Mon Parcours Handicap et mpedia décrivent la dyscalculie comme une difficulté à **comprendre et manipuler les nombres**, à **compter** et à **retenir les chiffres**, avec un impact possible sur la scolarité. Elle peut exister seule ou s’associer à d’autres troubles (dyslexie, dyspraxie, TDAH).

Comme les autres « dys », elle est souvent **repérée tard**, confondue avec un manque de travail ou d’attention. L’enfant peut alors se décourager ou se dévaloriser.

## Au quotidien
**Le repérage** : les parents et les enseignants remarquent souvent que l’enfant compte sur ses doigts longtemps, confond les nombres, peine à estimer une quantité ou à retenir ce qui a été appris.

**Le bilan** : pluridisciplinaire, prescrit par un pédiatre, un neuropédiatre ou un pédopsychiatre, souvent avec un **bilan orthophonique** et un **bilan psychologique**.

**À la maison**
- Utilisez des objets concrets (jetons, pièces, recettes de cuisine) pour donner du sens aux nombres.
- Jouez : jeux de société avec dés, cartes, courses.
- Évitez les comparaisons ; valorisez les progrès.

**À l’école** (PAP ou PPS) : temps supplémentaire, tables ou fiches mémo autorisées, calculatrice selon les cas, consignes reformulées, évaluations aménagées.

## Questions fréquentes
**Mon enfant n’aime pas les maths : est-il dyscalculique ?** Pas forcément. Ce sont la persistance des difficultés malgré l’enseignement et leur retentissement qui justifient un bilan.

**À quel âge consulter ?** Dès que les difficultés vous inquiètent ou que l’enseignant les signale ; un repérage précoce rend les aides plus efficaces.

**La calculatrice l’empêchera-t-elle d’apprendre ?** C’est un aménagement à décider avec l’équipe, pour lui permettre de raisonner sans être bloqué par le calcul.

**Existe-t-il des aides financières ?** Selon le retentissement, une demande à la MDPH peut ouvrir des droits (AEEH, matériel).

## Quand demander conseil
- Difficultés persistantes en calcul qui gênent la scolarité : parlez-en à l’enseignant et au médecin.
- Angoisse avant l’école, maux de ventre répétés, tristesse : consultez ; **3114** si détresse.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'tics-et-syndrome-gilles-de-la-tourette', tags: ['neuro', 'tics', 'gilles de la tourette', 'tcc'],
    title: 'Tics et syndrome de Gilles de la Tourette',
    summary: 'Gestes ou sons involontaires apparus vers 5-8 ans : ce que sont les tics, ce qui définit le syndrome de Gilles de la Tourette et comment il se prend en charge.',
    sources: [S.tics],
    body_md: `## En bref
- Les **tics** sont des **gestes ou des sons involontaires** : clignements, mouvements du visage ou des épaules, raclements de gorge, reniflements…
- Ils apparaissent généralement **entre 5 et 8 ans** ; un début après 10 ans est extrêmement rare.
- Le **syndrome de Gilles de la Tourette** associe plusieurs tics moteurs et au moins un tic vocal pendant **plus d’un an**.
- La plupart des formes sont **légères ou modérées** ; la prise en charge repose d’abord sur les **thérapies cognitives et comportementales**.

## Comprendre
L’Inserm (sur Santé.fr) distingue :
- les **tics moteurs** : clignements des yeux, mouvements du visage, du cou ou des épaules ;
- les **tics vocaux** : raclements de gorge, reniflements, toux ;
- les tics **simples**, brefs et répétitifs, et les tics **complexes**, plus élaborés (sautillements, demi-tours, répétition des mots des autres ou de ses propres mots).

Le diagnostic de syndrome de Gilles de la Tourette repose sur la présence de **plusieurs tics moteurs et d’au moins un tic vocal**, persistant **plus d’un an** chez une personne de moins de 18 ans. La coprolalie (gros mots involontaires), souvent associée au syndrome dans l’imaginaire collectif, est **rare** (environ 5 % des patients).

Les causes ne sont pas précisément connues : elles associeraient des facteurs **génétiques** (des antécédents familiaux sont retrouvés dans plus de la moitié des cas) et **environnementaux**.

## Au quotidien
- **Ne demandez pas à l’enfant d’arrêter** ses tics : ils sont involontaires, et la remarque augmente souvent la tension.
- **Informez l’entourage** (école, activités) pour éviter moqueries et punitions.
- **Notez** quand les tics apparaissent ou augmentent (fatigue, émotion) : utile pour le médecin.
- Si les tics gênent la vie de l’enfant, une **thérapie cognitive et comportementale** est proposée en première intention ; d’autres traitements existent pour les formes plus sévères, décidés par les spécialistes.

## Questions fréquentes
**Les tics de mon enfant vont-ils durer toute sa vie ?** La source consultée n’aborde pas l’évolution ; le médecin qui suit votre enfant est le mieux placé pour en parler.

**Est-ce psychologique ?** Les tics sont des mouvements involontaires, liés à des facteurs génétiques et environnementaux ; ils ne sont pas un caprice.

**Qui consulter ?** Le médecin traitant ou le pédiatre, qui peut orienter vers un neurologue ou un centre de référence.

**L’école peut-elle aider ?** Oui : informer l’enseignant permet d’éviter les reproches et d’adapter si besoin (par exemple, autoriser une pause).

## Quand demander conseil
- Tics qui gênent la vie quotidienne, la scolarité, ou font souffrir l’enfant : consultez.
- Moqueries, harcèlement, tristesse : parlez-en à l’école ; **3114** en cas de détresse.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, slug: 'begaiement-de-l-enfant', tags: ['langage', 'bégaiement', 'orthophonie', 'parole'],
    title: 'Le bégaiement de l’enfant : quand consulter et comment l’aider',
    summary: 'Le bégaiement est un trouble du rythme de la parole ; s’il persiste plus de deux mois, un bilan orthophonique est conseillé, et l’attitude de l’entourage aide beaucoup.',
    sources: [S.begaiement],
    body_md: `## En bref
- Le **bégaiement** est un **trouble du rythme de la parole** : l’enfant bute sur des mots, répète des syllabes, prolonge des sons ou se bloque.
- Ce n’est **ni un problème d’intelligence**, ni un trouble de la prononciation : c’est une difficulté de communication.
- Un bégaiement passager peut apparaître au début du langage ; **s’il dure plus de deux mois**, il faut consulter.
- L’**orthophoniste** est l’intervenant clé, avec une guidance des parents.

## Comprendre
Selon mpedia (repris par Santé.fr), un bégaiement dit « physiologique » peut apparaître au début du langage, quand l’enfant **pense plus vite qu’il ne parle**. Il dure en général un à deux mois et disparaît seul vers deux ans et demi. S’il persiste au-delà de deux mois, il peut s’agir d’un bégaiement qui nécessite une prise en charge. Il peut aussi apparaître plus tard, par exemple après un événement traumatisant.

Certains facteurs jouent un rôle : un **parent qui bégaie** (risque environ triplé), un événement difficile dans la petite enfance, des difficultés d’apprentissage de la parole. Le plus souvent, la cause n’est pas identifiée.

Sur trois enfants qui bégaient, deux voient leur bégaiement s’améliorer seuls ; un continue, parfois jusqu’à l’âge adulte. Comme **rien ne permet de prédire** l’évolution, tout bégaiement mérite d’être pris au sérieux.

## Au quotidien
**À privilégier**
- **Ne pas stresser** l’enfant, prendre le temps de l’écouter.
- L’accompagner **sans le presser** : regard bienveillant, geste rassurant.
- Se concentrer sur **ce qu’il dit**, pas sur la façon dont il le dit.
- Reformuler pour vérifier que vous avez compris.
- Éviter de l’exposer devant les autres.

**À éviter**
- Moqueries et reproches.
- Les injonctions comme « calme-toi » ou « respire ».
- Lui demander des efforts, ou faire comme si de rien n’était en rompant le regard.

Informez la famille, la crèche ou l’école pour que tout le monde adopte les mêmes attitudes.

## Questions fréquentes
**Faut-il attendre que ça passe ?** Si cela dure plus de deux mois, consultez le médecin traitant, qui prescrira un **bilan orthophonique**. Un diagnostic précoce est recommandé.

**Comment aider le médecin ?** Des **enregistrements** faits à la maison peuvent l’aider à évaluer le bégaiement.

**Le stress provoque-t-il le bégaiement ?** Un événement traumatisant peut en être le déclencheur, mais le plus souvent la cause reste inexpliquée.

**L’orthophonie est-elle utile même chez un petit ?** Oui : l’orthophoniste spécialisé suit l’enfant et guide les parents.

## Quand demander conseil
- Bégaiement qui dure **plus de deux mois**, qui s’accompagne de tensions, de grimaces, ou qui fait souffrir l’enfant : consultez.
- Moqueries ou isolement à l’école : parlez-en à l’équipe.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, journeys: ['child'], slug: 'anxiete-et-mal-etre-de-l-enfant', tags: ['santé mentale', 'anxiété', 'phobie', 'mal-être', 'émotions'],
    title: 'Anxiété et mal-être de l’enfant : les signes à repérer et où trouver de l’aide',
    summary: 'Troubles du sommeil, colères, isolement, baisse des résultats, maux de ventre : un changement de comportement inexpliqué doit alerter ; voici à qui s’adresser.',
    sources: [S.santeMentale, S.pai],
    body_md: `## En bref
- Chez l’enfant, **tout changement de comportement inexpliqué** doit alerter.
- Signes fréquents : **troubles du sommeil**, **pipi au lit**, **colères disproportionnées**, **isolement**, **baisse de concentration ou des résultats**, **perte d’appétit**.
- L’**anxiété** se manifeste souvent par des changements de comportement et des **symptômes physiques**.
- En cas de doute, **mieux vaut consulter** que d’attendre.

## Comprendre
Le dossier gouvernemental « La santé mentale à tous les âges » rappelle que les enfants expriment rarement leur souffrance avec des mots. Elle passe par le **corps** (maux de ventre, de tête, troubles du sommeil) et par le **comportement** (colères, repli, difficultés scolaires).

Chez l’adolescent, consulter est recommandé si ces signes **se répètent** : troubles du sommeil, plaintes physiques, difficulté à faire face au quotidien, isolement, troubles alimentaires, automutilation, actes agressifs.

Les troubles anxieux font partie des troubles de santé **psychiques** qui peuvent justifier, à l’école, un **projet d’accueil individualisé (PAI)** quand ils durent et nécessitent des aménagements.

## Au quotidien
- **Accueillez ce que dit l’enfant** sans minimiser (« ce n’est rien ») ni dramatiser.
- **Gardez des repères** : horaires réguliers, sommeil, moments partagés.
- **Repérez les déclencheurs** (séparation, école, conflits, événement de vie) et parlez-en avec lui.
- **Faites le lien avec l’école** si les difficultés touchent la classe : l’équipe et le médecin de l’Éducation nationale peuvent proposer des aménagements.

**Où trouver de l’aide**
- Le **médecin traitant** ou le pédiatre, pour un premier avis.
- Les **centres médico-psychologiques (CMP)**, les **Maisons des adolescents (MDA)** et la **PMI** : accueil des jeunes et des familles, accompagnement gratuit.
- **Mon soutien psy** : dès 3 ans, jusqu’à **12 séances** avec un psychologue partenaire, prises en charge.
- **Fil Santé Jeunes** (12-25 ans) : **0 800 235 236**, tous les jours de 9 h à 23 h, anonyme et gratuit.

## Questions fréquentes
**Toute peur est-elle un trouble anxieux ?** Non. Les peurs font partie du développement ; ce qui inquiète, c’est leur **intensité**, leur **durée** et leur **retentissement** sur la vie de l’enfant.

**Mon enfant refuse d’aller à l’école : que faire ?** Ne laissez pas la situation s’installer : parlez-en à l’école et au médecin rapidement.

**Les séances de psychologue sont-elles remboursées ?** Avec **Mon soutien psy**, jusqu’à 12 séances sont prises en charge dès 3 ans, chez un psychologue partenaire.

**Dois-je en parler à mon enfant ?** Oui, simplement : lui dire que vous avez remarqué qu’il va moins bien et que vous allez chercher de l’aide ensemble.

## Quand demander conseil
- Changement de comportement **durable** et inexpliqué : consultez.
- **Propos inquiétants, repli, rupture avec l’entourage** : intervenez rapidement ; **3114** (24 h/24, gratuit), pour l’enfant comme pour l’entourage.
- Enfant en danger : **119**. Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, journeys: ['child'], slug: 'toc-trouble-obsessionnel-compulsif-enfant', tags: ['santé mentale', 'toc', 'anxiété', 'tcc'],
    title: 'Les TOC chez l’enfant : repérer et faire soigner',
    summary: 'Pensées angoissantes qui reviennent et rituels pour les apaiser : les TOC débutent souvent dans l’enfance, sont parfois cachés, et se soignent.',
    sources: [S.toc],
    body_md: `## En bref
- Le **trouble obsessionnel compulsif (TOC)** associe des **obsessions** (pensées angoissantes qui reviennent) et des **compulsions** (rituels pour apaiser l’angoisse).
- Environ **un quart des TOC débutent avant 14 ans**.
- Chez l’enfant, le TOC peut se manifester par de l’**agitation**, de l’**agressivité**, un **repli** ou des **difficultés scolaires** ; les plus grands le cachent souvent par honte.
- Il ne guérit généralement pas seul, mais **se soigne** : la **thérapie cognitivo-comportementale (TCC)** est un traitement de première intention.

## Comprendre
Selon l’Inserm (sur Santé.fr), les **obsessions** portent par exemple sur la propreté, l’ordre, la symétrie, la peur de commettre une erreur ou de faire du mal, ou un sentiment excessif de responsabilité pour la sécurité des autres. Pour réduire l’anxiété, la personne répète des **gestes ou des actes mentaux** : lavage, rangement, vérification… qui peuvent occuper **plusieurs heures par jour**.

Les thèmes sont proches chez l’enfant et chez l’adulte. Mais les jeunes enfants ont du mal à décrire ce qu’ils vivent ; ils l’expriment par leur comportement. Les plus grands, eux, ressentent souvent **honte et culpabilité** et dissimulent leurs symptômes, ce qui retarde le diagnostic.

Les formes précoces sont plus fréquentes chez les garçons ; à l’âge adulte, femmes et hommes sont touchés à parts égales.

## Au quotidien
- **Observez sans juger** : des rituels qui prennent beaucoup de temps, qui retardent le départ à l’école ou provoquent une détresse si on les interrompt doivent amener à consulter.
- **Évitez de participer aux rituels** ou de rassurer sans fin : demandez au professionnel comment réagir.
- **Expliquez à l’enfant** que ce n’est pas de sa faute et qu’il existe des soins.
- Gardez une vie familiale aussi régulière que possible.

**Les soins** : le diagnostic est clinique et peut être posé par un **psychologue**, un **médecin généraliste** ou un **psychiatre**. Les deux traitements de première intention sont la **TCC**, une psychothérapie courte, et, selon la situation, un médicament décidé par le médecin. Selon l’Inserm, ces traitements améliorent le quotidien d’environ **deux tiers** des patients.

## Questions fréquentes
**Les manies d’ordre de mon enfant sont-elles un TOC ?** Pas forcément. On parle de TOC quand les pensées et les rituels sont **envahissants**, angoissants et gênent la vie quotidienne.

**Pourquoi mon enfant me l’a-t-il caché ?** La honte et la culpabilité sont fréquentes ; accueillez ce qu’il vous confie sans reproche.

**La TCC convient-elle aux enfants ?** C’est un traitement de première intention ; le professionnel l’adapte à l’âge.

**Où trouver un professionnel ?** Par votre médecin, ou via l’annuaire de Santé.fr ; **Mon soutien psy** permet des séances prises en charge.

## Quand demander conseil
- Rituels envahissants, détresse, refus scolaire : consultez.
- Tristesse profonde, propos inquiétants : **3114** (24 h/24).
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...NEURO, journeys: ['child'], safety_critical: true, slug: 'depression-enfant-adolescent-signes', tags: ['santé mentale', 'dépression', 'adolescent', 'suicide', '3114'],
    title: 'Dépression de l’enfant et de l’adolescent : les signes et comment réagir',
    summary: 'Tristesse, irritabilité, chute scolaire, troubles du sommeil, maux répétés : la dépression existe chez l’enfant et peut être masquée chez l’adolescent ; elle se soigne.',
    sources: [S.depression, S.depressionAdo, S.santeMentale],
    body_md: `## En bref
- La dépression touche environ **0,5 % des enfants** et **3 % des adolescents** en France.
- Chez l’enfant : **difficultés scolaires nouvelles**, sautes d’humeur, **perte d’intérêt**, dévalorisation, troubles du sommeil, **maux de tête ou de ventre** répétés.
- Chez l’adolescent, elle est souvent **masquée** (provocation, conduites à risque, automutilation) et peut se révéler par une tentative de suicide.
- Elle **se soigne** : psychothérapie d’abord, parfois avec un traitement décidé par un pédopsychiatre.

## Comprendre
Santé.fr et mpedia décrivent une maladie qui se signale souvent par un **changement** : les parents remarquent que l’enfant « **n’était pas comme ça avant** ». Les signes apparaissent souvent brutalement.

**Chez l’enfant** : tristesse, irritabilité, repli, perte d’intérêt pour les activités habituelles, dévalorisation, inquiétudes excessives, changement d’appétit, ennui, endormissement difficile, cauchemars, fatigue, plaintes physiques sans cause médicale. Des formes atypiques existent : un enfant très brillant et surinvesti à l’école, ou au contraire agité et agressif, peut cacher un mal-être.

**Chez l’adolescent** : consommation d’alcool ou de drogues, fugues, désinvestissement scolaire soudain, **automutilation**, troubles alimentaires. Les filles se plaignent plus souvent de douleurs ; les garçons manifestent plus d’agressivité.

Facteurs possibles : deuil, difficultés familiales, **harcèlement**, sentiment de dévalorisation, antécédents familiaux.

## Au quotidien
- **Rassurez** votre enfant sur votre soutien et votre affection.
- **Restez présent** : moments partagés, écoute, accompagnement dans ses activités.
- **Acceptez qu’il se confie** à quelqu’un d’autre (grand-parent, enseignant, ami de la famille) : il ne doit pas rester seul avec sa souffrance.
- **Cherchez la cause** possible (école, famille, deuil) sans vous culpabiliser.
- **Consultez rapidement** si rien ne s’améliore ou si cela s’aggrave.

**Les soins** : un soutien psychothérapeutique (individuel ou familial) est la première étape ; chez le jeune enfant, la thérapie passe souvent par le jeu. Un antidépresseur peut être prescrit par un **pédopsychiatre** dans certaines situations, avec une **surveillance étroite** les premières semaines. Un **suivi régulier** est conseillé, même après un seul épisode.

## Questions fréquentes
**Un enfant peut-il vraiment être déprimé ?** Oui. Le diagnostic est plus difficile car il exprime moins bien ses émotions.

**Comment distinguer une mauvaise passe d’une dépression ?** Ce qui doit alerter, ce sont des comportements **nouveaux, récurrents et durables**.

**Où consulter ?** Médecin traitant, pédiatre, CMP, Maison des adolescents ; **Mon soutien psy** dès 3 ans ; **Fil Santé Jeunes 0 800 235 236** pour les 12-25 ans.

**Faut-il parler du suicide avec lui ?** Tout propos inquiétant doit être pris au sérieux : écoutez, ne restez pas seul, appelez le **3114** pour être conseillé.

## Quand demander conseil
- Propos sur la mort, automutilation, repli brutal, rupture avec l’entourage : **appelez le 3114** (24 h/24, gratuit) ou consultez en urgence.
- Danger immédiat ou tentative de suicide : **15** ou **112**.
- Enfant en danger (violences, harcèlement grave) : **119**.

${FIN}`,
  },
  {
    ...NEURO, journeys: ['child'], slug: 'haut-potentiel-intellectuel-hpi', tags: ['hpi', 'haut potentiel', 'zèbre', 'évaluation', 'neuro'],
    title: 'Haut potentiel intellectuel (HPI) : ce que l’on sait vraiment',
    summary: 'Un test en ligne ne suffit pas : l’évaluation du HPI se fait par un psychologue, et beaucoup d’idées reçues circulent sur ces enfants.',
    sources: [S.hpi],
    body_md: `## En bref
- Le **HPI** correspond généralement à un **QI d’au moins 130**, soit un peu plus de **2 %** de la population ; le concept fait encore débat.
- Pour les 6-17 ans, le test de référence est le **WISC-V**, passé avec un **psychologue ou neuropsychologue** spécialisé.
- Un **test sur Internet** a peu de valeur.
- Les enfants HPI ne sont **pas tous** en difficulté, et tous les enfants en difficulté ne sont pas HPI.

## Comprendre
Selon l’Inserm (sur Santé.fr), le WISC-V ne donne pas qu’un chiffre : il décrit un **profil** à travers cinq indices (compréhension verbale, visuo-spatial, raisonnement fluide, mémoire de travail, vitesse de traitement). Il est recommandé de présenter les résultats sous forme d’**intervalles** plutôt qu’un score unique, et de les replacer dans l’histoire de l’enfant, sa famille et sa scolarité.

**Idées reçues à oublier**
- Tous les enfants HPI ne sont pas en décrochage scolaire ni en souffrance.
- Ils n’ont pas forcément un « profil type » (par exemple maladroit).
- Un enfant turbulent ou en difficulté n’est pas forcément HPI : d’autres causes existent.

**Difficultés possibles** chez certains enfants : un profil **hétérogène** (grands écarts entre les capacités), parfois avec des faiblesses de motricité fine pouvant évoquer une dyspraxie ; **isolement**, **anxiété** (fréquente selon les études citées), réactions fortes à la frustration, difficultés dans les relations. Ces difficultés passent souvent inaperçues car l’enfant compense.

## Au quotidien
- **Ne cherchez pas une étiquette** : partez de ce que vit votre enfant (plaisir d’apprendre, ennui, relations, émotions).
- **Valorisez l’effort** autant que la réussite.
- **Parlez avec l’école** si l’enfant s’ennuie, se démotive ou a des difficultés malgré des facilités apparentes.
- Envisagez une **évaluation globale** (développement, attention, langage, aspects émotionnels) plutôt qu’un simple score.

## Questions fréquentes
**Quand faire évaluer mon enfant ?** L’Inserm suggère d’y penser quand un enfant au développement verbal précoce présente des **difficultés de comportement dès la maternelle**, plutôt que d’attendre le collège.

**Qui fait le test ?** Un psychologue ou neuropsychologue clinicien spécialisé, avec des outils standardisés.

**Un enfant HPI peut-il avoir un trouble dys ou un TDAH ?** Des troubles des apprentissages sont possibles ; c’est pourquoi une évaluation complète est préférable.

**Faut-il lui faire sauter une classe ?** Les sources consultées ne tranchent pas ; c’est une décision à prendre avec l’école et les professionnels, selon son bien-être global.

## Quand demander conseil
- Anxiété importante, isolement, refus scolaire, tristesse : consultez le médecin ou un psychologue.
- Propos inquiétants : **3114** (24 h/24).
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  // ------------------------------------------------------------------ maladies chroniques et handicap
  {
    ...CHRONIC, safety_critical: true, slug: 'epilepsie-enfant-que-faire-en-cas-de-crise', tags: ['épilepsie', 'crise', 'urgence', 'pai', 'neurologie'],
    title: 'Épilepsie de l’enfant : les bons gestes pendant une crise',
    summary: 'Position latérale de sécurité, ne rien mettre dans la bouche, chronométrer la crise : les gestes à connaître et quand appeler le 15.',
    sources: [S.epilepsie, S.pai],
    body_md: `## En bref
- L’**épilepsie** est une maladie neurologique chronique : des **crises** se répètent, dues à une hyperactivité d’un groupe de neurones.
- Elle est **fréquente chez l’enfant** ; plus de la moitié des enfants concernés **guérissent avant l’âge adulte**.
- Pendant une crise : **position latérale de sécurité**, espace dégagé, **ne rien mettre dans la bouche**, **noter la durée**.
- Appelez le **15** si la crise dure **plus de 5 minutes**, si les crises **s’enchaînent**, si l’enfant **ne reprend pas conscience en 10 minutes** ou s’il s’est **blessé**.

## Comprendre
Selon Santé.fr, les symptômes dépendent de la zone du cerveau concernée :
- **crises focales (partielles)** : signes parfois discrets (regard fixe, gestes répétés, fourmillements, contractions, trou de mémoire) ;
- **crises généralisées** : **absences** (fréquentes chez l’enfant) ou crises **tonico-cloniques**, avec perte de connaissance, secousses, parfois perte d’urines et morsure de langue.

Le traitement de l’enfant vise à éviter des séquelles et à limiter le retentissement sur la **scolarité** et la vie sociale. Il est le plus souvent médicamenteux, à prendre **régulièrement et sans oubli**.

## Au quotidien
**Pendant une crise : à faire**
- Placer l’enfant en **position latérale de sécurité**, dans un endroit dégagé.
- Desserrer ses vêtements ; glisser un vêtement plié sous sa tête ; retirer ses lunettes.
- **Rester avec lui** et le laisser récupérer.
- **Noter l’heure de début et la durée**.

**À ne pas faire**
- Le déplacer, sauf s’il est dans un endroit dangereux.
- Bloquer ses mouvements.
- Lui donner à boire ou un médicament par la bouche.
- **Mettre les doigts dans sa bouche** : risque de morsure. L’idée qu’il pourrait « avaler sa langue » est fausse.

**Pour limiter les crises** (Santé.fr) : sommeil suffisant et à heures régulières, limiter le stress et le bruit, éviter les boissons caféinées, limiter les **stimulations lumineuses clignotantes** (contraste des écrans, jeux vidéo), et pratiquer un sport régulier en évitant ceux où une perte de connaissance serait dangereuse.

**À l’école** : un **projet d’accueil individualisé (PAI)** précise les aménagements et la **conduite à tenir en cas d’urgence**, avec une trousse d’urgence accessible et emportée lors des sorties.

## Questions fréquentes
**Faut-il appeler le 15 à chaque crise ?** Pour une épilepsie connue, suivez le protocole donné par le médecin ; appelez le **15** dans les situations listées plus haut ou au moindre doute. Pour une **première crise**, appelez le 15.

**Mon enfant pourra-t-il faire du sport ?** Oui, l’activité régulière est encouragée, en évitant les sports où une chute ou une perte de connaissance serait dangereuse, et avec l’avis du médecin.

**Les écrans sont-ils interdits ?** Il est conseillé de limiter les stimulations lumineuses intermittentes ; parlez-en au médecin selon le type d’épilepsie.

**Que dire à l’école ?** Demandez la mise en place d’un **PAI** avec le médecin de l’Éducation nationale.

## Quand demander conseil
- **Première crise**, crise de plus de 5 minutes, crises répétées, absence de réveil en 10 minutes, blessure, difficulté à respirer : **15** ou **112**.
- Crises plus fréquentes, effets du traitement, questions sur l’école : contactez le médecin qui suit l’enfant.

${FIN}`,
  },
  {
    ...CHRONIC, safety_critical: true, slug: 'diabete-type-1-enfant-signes-d-alerte', tags: ['diabète', 'type 1', 'acidocétose', 'urgence', 'soif'],
    title: 'Diabète de type 1 de l’enfant : les signes qui doivent alerter',
    summary: 'Soif intense, envies fréquentes d’uriner, pipi au lit qui revient, amaigrissement, grande fatigue : reconnaître tôt le diabète de type 1 évite une complication grave.',
    sources: [S.diabete, S.pai],
    body_md: `## En bref
- Quatre signes doivent faire penser au **diabète de type 1** : **envies fréquentes d’uriner** (et pipi au lit qui revient), **soif importante**, **amaigrissement** malgré l’appétit, **grande fatigue**.
- Le diagnostic est **simple et rapide** : une mesure de la **glycémie** chez le médecin.
- Sans diagnostic, une complication grave peut survenir : l’**acidocétose** (vomissements, nausées, mal de ventre, respiration rapide).
- Selon Santé.fr, près d’**un enfant sur deux** arrive encore au diagnostic en acidocétose, faute de signes reconnus.

## Comprendre
Le diabète de type 1 peut être diagnostiqué dès **9 mois à 1 an**. Le Dr Pigeon-Kherchiche, endocrinologue pédiatrique cité par Santé.fr, décrit le **syndrome cardinal** :
- des **envies fréquentes d’uriner**, avec un **pipi au lit** qui réapparaît chez l’enfant de 4 à 10 ans, ou des réveils nocturnes pour uriner chez l’adolescent ;
- une **soif importante** ;
- un **amaigrissement** important malgré une alimentation plus abondante ;
- une **grande fatigue** inexpliquée.

L’**acidocétose** rend le sang trop acide. Ses signes (vomissements, nausées, douleurs abdominales) sont facilement **confondus avec une gastro-entérite**. Sévère, elle peut mettre la vie en danger.

## Au quotidien
**Si vous remarquez ces signes** : consultez **le jour même** et demandez une **mesure de la glycémie**. Une glycémie par piqûre au bout du doigt chez le médecin ou une prise de sang suffit à orienter.

**Après le diagnostic**, la prise en charge repose sur trois piliers décrits par Santé.fr :
- l’**insuline**, en injections ou avec une pompe (des capteurs existent ; les doses sont réglées avec l’équipe soignante) ;
- une **alimentation équilibrée**, en limitant les produits ultra-transformés, avec des portions adaptées à l’âge et à l’activité ;
- l’**activité physique** régulière.

**À l’école** : un **PAI** organise les soins, les repas, les collations et la conduite à tenir en cas d’urgence, avec une trousse emportée lors des sorties.

Des associations, comme l’Aide aux Jeunes Diabétiques, accompagnent les familles.

## Questions fréquentes
**Mon enfant boit beaucoup en été : dois-je m’inquiéter ?** La chaleur fait boire ; ce qui doit alerter, c’est l’**association** soif + urines fréquentes + amaigrissement ou fatigue.

**Une gastro peut-elle cacher un diabète ?** Oui : des vomissements avec une respiration rapide et ample chez un enfant qui n’est pas dans son état habituel doivent faire consulter en urgence.

**Le diabète de type 1 vient-il d’une mauvaise alimentation ?** Les sources consultées ne le décrivent pas ainsi ; parlez des causes avec l’équipe qui suit votre enfant.

**Mon enfant pourra-t-il faire du sport ?** Oui, l’activité physique fait partie de la prise en charge.

## Quand demander conseil
- Soif, urines fréquentes, amaigrissement, fatigue : **consultez le jour même** pour une glycémie.
- Vomissements, mal de ventre, **respiration rapide**, somnolence chez un enfant qui n’est pas dans son état habituel : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, journeys: ['child', 'newborn'], slug: 'drepanocytose-enfant', tags: ['drépanocytose', 'maladie génétique', 'crise', 'dépistage néonatal'],
    title: 'Drépanocytose de l’enfant : comprendre et prévenir les complications',
    summary: 'Maladie génétique la plus fréquente en France, la drépanocytose expose à l’anémie, à des crises douloureuses et à des infections ; un suivi régulier et des gestes simples aident.',
    sources: [S.drepano, S.depistageNeonatal],
    body_md: `## En bref
- La **drépanocytose** est une **maladie génétique** des globules rouges ; c’est la plus fréquente en France.
- Les globules rouges, déformés en faucille, causent **anémie**, **crises douloureuses** et **infections** parfois graves.
- Elle se transmet quand **les deux parents** transmettent le gène : si les deux sont porteurs sains, le risque est d’**1 sur 4** à chaque grossesse.
- Le **dépistage néonatal** permet une prise en charge précoce, qui retarde les complications.

## Comprendre
Selon l’Inserm (sur Santé.fr), une anomalie de l’hémoglobine rend les globules rouges **fragiles et rigides**. Ils vivent environ vingt jours au lieu de 120, d’où une **anémie** (pâleur, fatigue, parfois jaunisse).

Les nourrissons vont généralement bien les premiers mois, puis peuvent apparaître :
- des **crises vaso-occlusives** : douleurs aiguës, surtout dans les os, les articulations, le dos ou la poitrine ; chez le tout-petit, un **gonflement douloureux des mains et des pieds** ;
- des **infections** (pneumonies, méningites, septicémies), car la rate protège moins bien ;
- d’autres complications : aggravation brutale de l’anémie, **syndrome thoracique aigu** (difficulté à respirer, douleur à la poitrine, parfois fièvre), accidents vasculaires cérébraux.

## Au quotidien
**La prévention**, selon l’Inserm :
- **antibiotiques préventifs** et **vaccinations renforcées** chez le jeune enfant, selon la prescription ;
- **suivi médical régulier**, avec notamment un examen (Doppler transcrânien) pour surveiller le risque d’AVC.

**Les gestes qui aident à éviter les crises**
- **Bien boire** tout au long de la journée.
- Éviter les **températures extrêmes** et les changements brusques.
- Éviter les **efforts intenses** et les sports d’endurance, les pièces mal aérées et les séjours **au-delà de 1 500 m d’altitude**.
- Porter des **vêtements amples**.
- Avoir une alimentation équilibrée et une bonne hygiène de vie.

**Les traitements** (décidés par l’équipe spécialisée) : antalgiques et hospitalisation si la douleur persiste, transfusions dans certaines situations, traitement de fond pour réduire les crises ; la greffe de moelle est le seul traitement curatif, réservée aux formes sévères.

À l’école, un **PAI** permet d’organiser hydratation, pauses et conduite à tenir.

## Questions fréquentes
**Mon bébé a-t-il été dépisté ?** Le dépistage se fait sur la goutte de sang prélevée au talon à la maternité, **48 à 72 heures** après la naissance, avec l’accord des parents.

**Les porteurs sains sont-ils malades ?** Non, ils n’ont pas de symptômes, mais peuvent transmettre le gène.

**La fièvre est-elle grave ?** Les infections peuvent être sévères chez ces enfants : consultez **sans attendre** en cas de fièvre, selon les consignes de l’équipe qui suit votre enfant.

**Peut-il aller à l’école normalement ?** Oui, avec un PAI et des aménagements si besoin.

## Quand demander conseil
- Fièvre, douleur qui ne cède pas, pâleur ou fatigue inhabituelles : contactez rapidement l’équipe qui suit l’enfant.
- Difficulté à respirer, douleur à la poitrine, faiblesse d’un côté du corps, trouble de la parole, somnolence : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, journeys: ['newborn', 'child'], slug: 'depistage-neonatal-maladies-rares', tags: ['dépistage néonatal', 'buvard', 'mucoviscidose', 'drépanocytose', 'maladies rares'],
    title: 'Le dépistage néonatal : 13 maladies repérées dès la naissance',
    summary: 'Quelques gouttes de sang prélevées au talon à la maternité permettent de dépister des maladies rares et graves, dont la mucoviscidose et la drépanocytose, pour agir tôt.',
    sources: [S.depistageNeonatal, S.drepano],
    body_md: `## En bref
- Depuis 1972, **tous les nouveau-nés** peuvent bénéficier d’un dépistage de maladies **rares, graves et souvent génétiques**.
- Il se fait par une **petite piqûre au talon**, **48 à 72 heures** après la naissance : quelques gouttes de sang sur un **buvard**.
- L’**accord des parents** est nécessaire.
- **13 maladies** sont dépistées, dont la **mucoviscidose** et la **drépanocytose** ; un **test de l’audition** complète le dispositif.

## Comprendre
L’objectif, rappelle l’ARS Île-de-France, est de **repérer tôt** des maladies pour lesquelles un traitement ou un accompagnement précoce change l’avenir de l’enfant.

**Les maladies dépistées**
- La liste historique : **phénylcétonurie**, **hypothyroïdie congénitale**, **hyperplasie congénitale des surrénales**, **mucoviscidose**, **drépanocytose**, **déficit en MCAD**.
- Depuis le 1er janvier 2023, **sept maladies** supplémentaires : homocystinurie, leucinose, tyrosinémie de type 1, acidurie glutarique de type 1, acidurie isovalérique, déficit LCHAD et déficit en captation de la carnitine.
- La **surdité** n’est pas recherchée sur le buvard, mais par un **test de l’audition** à la maternité.

Pour la drépanocytose, l’Inserm souligne que la prise en charge précoce **retarde les complications**.

## Au quotidien
- **À la maternité** : l’équipe vous explique le prélèvement et recueille votre accord.
- **Si vous sortez tôt** : demandez à la maternité comment et quand le prélèvement sera réalisé.
- **Gardez le carnet de santé** à portée de main : il garde la trace des examens.

## Questions fréquentes
**Comment se fait le prélèvement ?** Par une petite piqûre au talon ; quelques gouttes de sang sont déposées sur un buvard analysé en laboratoire.

**Si on ne me rappelle pas, est-ce bon signe ?** La page consultée ne détaille pas la façon dont les résultats sont communiqués : demandez-le à la maternité.

**Un résultat anormal veut-il dire que mon bébé est malade ?** Un dépistage n’est pas un diagnostic : des examens de contrôle sont alors proposés par l’équipe spécialisée.

**Puis-je refuser ?** L’accord des parents est demandé ; parlez de vos questions avec l’équipe pour décider en connaissance de cause.

## Quand demander conseil
- Si vous ne savez pas si le dépistage a été fait (sortie précoce, transfert) : contactez la maternité ou votre sage-femme.
- Bébé qui s’alimente mal, somnolent, qui respire difficilement ou a de la fièvre avant 3 mois : consultez en urgence ; **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, journeys: ['child', 'newborn'], slug: 'eczema-atopique-enfant', tags: ['eczéma', 'dermatite atopique', 'peau', 'allergie'],
    title: 'Eczéma atopique de l’enfant : apaiser la peau au quotidien',
    summary: 'L’eczéma atopique évolue par poussées ; des soins doux, une hydratation régulière et le traitement prescrit aident à espacer les rechutes.',
    sources: [S.eczema, S.peau],
    body_md: `## En bref
- L’**eczéma atopique** (dermatite atopique) est une **affection chronique** qui évolue **par poussées**, entrecoupées d’accalmies.
- Le **diagnostic** est posé par un médecin (pédiatre, dermatologue, médecin traitant) **après examen** ; les examens complémentaires sont en général inutiles.
- Des **gestes d’hygiène quotidiens** améliorent l’efficacité du traitement et aident à **prévenir les rechutes**.
- Une peau qui **suinte**, avec du pus ou de la fièvre, doit faire consulter dans la journée.

## Comprendre
Santé.fr présente l’eczéma atopique comme une maladie de peau fréquente chez l’enfant, qui **revient par poussées** : la peau devient rouge, sèche, et **démange**. Le grattage abîme la peau et entretient le problème.

Le traitement repose sur les soins quotidiens et sur ce que prescrit le médecin pour les poussées. Bien suivre les gestes de base rend ce traitement **plus efficace**.

## Au quotidien
Les conseils de Santé.fr pour une peau sensible :
- **Toilette douce** : produits doux ou surgras, hypoallergéniques si la peau est très sensible.
- **Bains courts** : éviter les bains longs ou trop fréquents, surtout si la peau est sèche.
- **Bien sécher** la peau en tamponnant après la toilette ou la baignade.
- **Hydrater régulièrement** avec une crème adaptée, en particulier par temps froid ou sec.
- **Couper les ongles** de l’enfant pour limiter les lésions dues au grattage.

Notez ce qui semble précéder les poussées pour en parler au médecin.

## Questions fréquentes
**L’eczéma est-il contagieux ?** Non, il ne se transmet pas.

**Faut-il faire des tests d’allergie ?** Selon les sources consultées, les examens complémentaires sont **en général inutiles** ; c’est le médecin qui décide au cas par cas.

**Comment savoir ce qui déclenche les poussées ?** Notez ce que vous observez et parlez-en au médecin, qui adaptera les conseils à votre enfant.

**La crème suffit-elle ?** L’hydratation est la base ; pendant les poussées, suivez le traitement prescrit par le médecin, sans l’arrêter de vous-même.

## Quand demander conseil
**Consultez dans la journée** si :
- votre enfant a de la **fièvre** ou n’est pas dans son état habituel ;
- la peau **suinte** ou semble **infectée** (pus) ;
- les symptômes d’une allergie connue deviennent nettement plus sévères.

**Consultez dans les jours qui viennent** si les démangeaisons deviennent insupportables ou si rien ne s’améliore après 48 heures de soins.

**Urgence** : gonflement du visage ou de la langue, difficulté à respirer : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, slug: 'allergie-aux-pollens-rhinite-enfant', tags: ['allergie', 'pollens', 'rhinite', 'rhume des foins', 'asthme'],
    title: 'Allergie aux pollens et rhinite allergique de l’enfant',
    summary: 'Éternuements, nez qui coule ou bouché, yeux qui piquent au printemps : la rhinite allergique se reconnaît, se diagnostique et mérite d’être suivie, car elle peut précéder l’asthme.',
    sources: [S.pollens],
    body_md: `## En bref
- En France, environ **20 % des enfants** à partir de 9 ans sont allergiques aux pollens, et ces allergies sont **en hausse**.
- La **rhinite allergique** donne **éternuements**, **nez qui gratte**, **nez bouché ou qui coule**, souvent avec des **yeux qui piquent ou larmoient**.
- Elle est un **facteur de risque d’asthme**, qui apparaît souvent après elle.
- Le **médecin traitant** fait le point et peut orienter vers un **allergologue** (tests cutanés, mesure du souffle).

## Comprendre
Santé.fr explique que certains pollens (bouleau, graminées, cyprès, ambroisie…) provoquent des réactions au contact des **yeux** et des **voies respiratoires**. La **pollution** peut aggraver les symptômes, et le **changement climatique** modifie les périodes et les quantités de pollens.

Quand la rhinite est liée aux pollens, on parle de rhinite **saisonnière** ; le « rhume des foins » désigne surtout l’allergie aux graminées. Si les yeux sont touchés, on parle de **rhino-conjonctivite**, parfois avec des paupières gonflées.

Le lien avec l’asthme est important : environ **80 % des personnes asthmatiques** ont aussi une rhino-conjonctivite. Soigner et suivre une rhinite allergique, c’est aussi surveiller l’apparition d’une gêne respiratoire.

## Au quotidien
- **Notez les périodes** où votre enfant a des symptômes : cela aide le médecin à faire le lien avec un pollen.
- **Observez sa respiration** : toux la nuit, sifflements, essoufflement à l’effort doivent être signalés.
- **Parlez-en à l’école** si les symptômes gênent l’attention ou le sommeil ; un PAI peut être utile en cas d’asthme associé.
- Suivez le **traitement prescrit** par le médecin pendant la saison concernée.

## Questions fréquentes
**Comment savoir si c’est un rhume ou une allergie ?** Une rhinite qui revient à la même saison, sans fièvre, avec des démangeaisons du nez et des yeux, évoque une allergie : le médecin confirmera.

**Faut-il faire des tests ?** Le diagnostic repose sur l’examen du médecin et, si besoin, des **tests cutanés** ou une **mesure du souffle** chez l’allergologue.

**Mon enfant peut-il jouer dehors ?** Oui ; parlez avec le médecin des précautions adaptées pendant les pics de pollens.

**L’allergie peut-elle évoluer en asthme ?** La rhinite est un facteur de risque : signalez toute gêne respiratoire.

## Quand demander conseil
- Symptômes qui reviennent chaque saison ou gênent le sommeil et l’école : consultez le médecin traitant.
- Toux nocturne, sifflements, essoufflement : consultez rapidement.
- **Difficulté à respirer**, lèvres bleutées, gonflement du visage : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, slug: 'surpoids-de-l-enfant-accompagner-sans-culpabiliser', tags: ['surpoids', 'obésité', 'corpulence', 'alimentation', 'activité'],
    title: 'Surpoids de l’enfant : accompagner sans culpabiliser',
    summary: 'Courbe de corpulence, repas réguliers, mouvement au quotidien, écrans limités et bienveillance : agir tôt et en famille, sans régime ni interdits.',
    sources: [S.surpoids],
    body_md: `## En bref
- Le médecin repère un surpoids grâce à la **courbe de corpulence** (IMC) du **carnet de santé**.
- Plus il est repéré tôt, plus il est **facile d’agir**.
- **Pas de régime strict ni d’interdits** : des repas réguliers, plus de mouvement, moins d’écrans, en impliquant **toute la famille**.
- L’attitude des parents compte : **sans culpabiliser**, ni faire de la nourriture une récompense ou une punition.

## Comprendre
Selon mpedia (repris par Santé.fr), le médecin calcule l’**IMC** et le place sur la **courbe de corpulence** de référence. On parle de surpoids au-delà du 97e percentile. Un enfant qui prend du poids plus vite que les courbes peut être au début d’une surcharge.

Les causes sont souvent multiples : déséquilibre entre ce que l’on mange et ce que l’on dépense, hérédité, événements de vie (deuil, séparation, déménagement), **manque de sommeil**, habitudes autour des repas, plus rarement un problème hormonal (qui ralentit souvent la courbe de taille).

## Au quotidien
**Les repas**
- Repas à **heures régulières**, **assis**, **sans écran**.
- Un petit-déjeuner consistant ; des **légumes** et des féculents en quantités adaptées ; limiter le très gras et le très sucré ; éviter le grignotage.
- Le goûter est le plus petit repas ; **l’eau est la meilleure boisson**.
- Ne pas interdire d’aliments, ne pas forcer à finir l’assiette.

**Le mouvement**
- Environ **une heure par jour** de jeux dehors, promenades, vélo ou marche plutôt que voiture, escaliers.
- Proposer une activité que l’enfant **a envie de découvrir**, sans imposer un sport.

**Les écrans**
- Limiter le temps d’écran, pas d’écran pendant les repas ni dans la chambre ; proposer des activités partagées (l’ennui pousse souvent à grignoter).

**L’attitude**
- Parler avec l’enfant de ce qu’il ressent, **sans le culpabiliser**.
- Le motiver par des bénéfices concrets (moins d’essoufflement, plus d’aisance) plutôt que par le poids.
- Faire évoluer **toute la famille** pour qu’il ne se sente pas différent.
- Préférer des changements **progressifs et durables**.

## Questions fréquentes
**Faut-il mettre mon enfant au régime ?** Non : les régimes stricts et les interdits sont déconseillés ; on agit sur les habitudes de toute la famille.

**Faut-il peser l’enfant souvent à la maison ?** Le suivi se fait avec le médecin, sur la courbe du carnet de santé.

**Et s’il grignote en cachette ?** Cherchez la raison (stress, ennui, solitude) et parlez-en avec lui ; trop d’interdits peuvent favoriser ce comportement.

**Qui peut nous aider ?** Le médecin traitant ou le pédiatre, qui peut orienter vers une prise en charge adaptée.

## Quand demander conseil
- Courbe qui monte plus vite que la référence, essoufflement, moqueries : parlez-en au médecin.
- Tristesse, repli, rapport difficile à la nourriture : consultez ; **3114** en cas de détresse.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, slug: 'pai-projet-d-accueil-individualise-maladie-chronique', tags: ['pai', 'école', 'maladie chronique', 'allergie', 'asthme', 'diabète', 'épilepsie'],
    title: 'Le PAI : scolariser un enfant avec une maladie chronique',
    summary: 'Allergie, asthme, diabète, épilepsie, troubles anxieux… Le projet d’accueil individualisé organise les soins, les repas, les sorties et la conduite à tenir en cas d’urgence à l’école.',
    sources: [S.pai, S.amenagements],
    body_md: `## En bref
- Le **PAI** concerne les enfants avec un **trouble de santé durable**, physique (allergie, asthme, diabète, épilepsie…) ou psychique (troubles anxieux, syndrome dépressif…).
- Les **parents** le demandent ; le **médecin de l’Éducation nationale** (ou de la PMI) le rédige avec la famille et l’école.
- Il prévoit les **aménagements**, les **soins**, et une fiche **« conduite à tenir en cas d’urgence »**.
- Il est valable pour la scolarité dans un même établissement et **mis à jour à chaque rentrée**.

## Comprendre
La circulaire du 10 février 2021 encadre le PAI. Il permet à l’enfant de **suivre sa scolarité** et de **manger avec ses camarades** malgré sa maladie, en précisant :
- une partie administrative ;
- les **aménagements communs**, y compris pédagogiques (horaires, dispenses d’activités incompatibles, activités de remplacement, prise de traitement) ;
- une partie propre à la pathologie, qui **ne révèle pas le diagnostic** ;
- si besoin, un **volet périscolaire** (cantine, garderie).

Le médecin qui suit l’enfant transmet les éléments médicaux **sous pli confidentiel**. Le directeur ou le chef d’établissement veille à la mise en œuvre.

## Au quotidien
**La trousse d’urgence**
- Elle doit être **accessible à tout moment**, dans un lieu repérable par tous mais hors de portée des élèves.
- Elle **accompagne l’enfant lors des sorties**, avec le PAI.
- La famille fournit les médicaments et vérifie leur **date de péremption**.

**La fiche d’urgence** est remplie et signée par le médecin qui suit l’enfant ou le médecin scolaire ; elle est actualisée chaque année si besoin. En cas d’urgence, l’école appelle le **15**.

**La cantine** : l’enfant doit pouvoir déjeuner avec les autres ; le **panier repas** n’est pas la première solution. Le PAI concerne les allergies ou intolérances **médicalement avérées**.

**Les sorties** : le PAI précise si l’enfant peut participer (avec ou sans nuitée) et comment ; l’accompagnateur emporte la trousse et le PAI.

## Questions fréquentes
**À qui faire la demande ?** Au directeur d’école ou chef d’établissement, au médecin de l’Éducation nationale, à la PMI ou à la structure d’accueil.

**Faut-il refaire le PAI chaque année ?** Il reste valable dans le même établissement mais est **mis à jour à chaque rentrée**, avec une ordonnance récente ; il reste en vigueur en début d’année le temps de recevoir les nouveaux éléments.

**PAI, PAP, PPS : quelle différence ?** Le PAI concerne la **santé** ; le PAP, les **troubles des apprentissages** ; le PPS, une situation de **handicap reconnue** par la MDPH. Ils peuvent se cumuler.

**Le PAI fonctionne-t-il à la crèche ?** Oui, le médecin de la structure ou de la PMI peut le rédiger.

## Quand demander conseil
- Dès le diagnostic d’une maladie chronique ou avant l’entrée à l’école : demandez un PAI.
- Changement de traitement : prévenez l’école et faites mettre à jour la fiche d’urgence.
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, journeys: ['child', 'newborn'], category: 'maladies-chroniques', slug: 'aeeh-aides-enfant-en-situation-de-handicap', tags: ['handicap', 'aeeh', 'mdph', 'aidants', 'droits'],
    title: 'Enfant en situation de handicap : l’AEEH et les premières aides',
    summary: 'Allocation d’éducation de l’enfant handicapé, MDPH, droits des parents aidants : le point sur les aides et les interlocuteurs.',
    sources: [S.aeeh, S.aeehFiche, S.aidant],
    body_md: `## En bref
- L’**AEEH** (allocation d’éducation de l’enfant handicapé) aide à compenser les **dépenses liées au handicap** d’un enfant de **moins de 20 ans** vivant en France.
- Elle est accordée par la **CDAPH**, après une demande déposée à la **MDPH**.
- Elle peut être complétée par une **majoration pour parent isolé** et des **compléments** selon les surcoûts et la réduction d’activité des parents.
- Les parents sont des **aidants** : formation, solutions de répit et soutien existent.

## Comprendre
Selon Mon Parcours Handicap, la **MDPH** (maison départementale des personnes handicapées) évalue les besoins de l’enfant ; la **CDAPH** décide des droits : AEEH, aides humaines ou matérielles, accompagnement scolaire (PPS, AESH), orientation.

Une loi du 12 juin 2026 prévoit une expérimentation pour **raccourcir les délais** de traitement de l’AEEH, avec une avance versée en l’absence de réponse ; ces mesures attendent leurs textes d’application.

La fiche de la Maison de l’autisme rappelle que le **statut d’aidant familial** est défini par la loi et ouvre des aides pour accompagner son enfant et se protéger.

## Au quotidien
**Constituer le dossier MDPH**
- Formulaire de demande, **certificat médical** récent, bilans des professionnels (orthophoniste, psychomotricien, psychologue…), et tout document décrivant le quotidien (école, sommeil, autonomie).
- Décrivez **concrètement** les besoins et les frais (soins non remboursés, matériel, temps de trajet, réduction d’activité).
- De nombreuses MDPH proposent une **demande en ligne**.

**Se faire aider**
- **0 800 360 360** : conseils de proximité pour les personnes handicapées et leurs aidants (gratuit).
- **0 805 805 110** : numéro vert sur l’école inclusive.
- Les plateformes Mon Parcours Handicap, Service-Public.fr et Ma boussole aidants.
- Les associations de familles, souvent de bon conseil pour remplir le dossier.

## Questions fréquentes
**Faut-il un diagnostic pour demander l’AEEH ?** La CDAPH s’appuie sur l’évaluation des besoins et le certificat médical ; parlez-en avec le médecin qui suit l’enfant.

**Qui contacter pour le versement ?** La page consultée ne le détaille pas : la MDPH et votre caisse d’allocations familiales peuvent vous renseigner.

**Combien de temps dure la décision ?** Les délais varient selon les départements ; une expérimentation vise à les raccourcir.

**Je suis épuisé : existe-t-il du répit ?** Oui : des solutions de répit existent pour les aidants ; renseignez-vous auprès de la MDPH, du 0 800 360 360 ou des associations.

## Quand demander conseil
- Dès que des besoins durables apparaissent (soins, école, aide humaine) : contactez la MDPH ou l’enseignant référent.
- Épuisement, idées noires : parlez-en à votre médecin ; **3114** (24 h/24).
- Urgence vitale : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHRONIC, journeys: ['child', 'newborn'], slug: 'maladie-rare-ou-s-informer-et-etre-accompagne', tags: ['maladies rares', 'orphanet', 'centres de référence', 'filières'],
    title: 'Maladie rare : où s’informer et être accompagné ?',
    summary: 'Filières de santé, centres de référence et de compétence, Orphanet, Maladies Rares Info Services : les ressources pour les familles confrontées à une maladie rare.',
    sources: [S.maladiesRares, S.depistageNeonatal],
    body_md: `## En bref
- Environ **3 millions de personnes** sont concernées par une maladie rare en France (Alliance maladies rares).
- **23 filières de santé maladies rares** coordonnent diagnostic, suivi, recherche et information.
- Plus de **2 200 centres** : 387 **centres de référence** et plus de 1 800 **centres de compétence** pour le suivi de proximité.
- **Orphanet** et **Maladies Rares Info Services** informent et orientent les familles.

## Comprendre
Une maladie rare touche peu de personnes, mais l’ensemble des maladies rares concerne beaucoup de familles. Le parcours peut être long avant le diagnostic, et l’information est parfois difficile à trouver : des réseaux nationaux existent pour cela.

- **Les filières de santé maladies rares** regroupent, par grand domaine (cœur, système neuromusculaire…), les équipes expertes, les associations et les laboratoires.
- **Les centres de référence** ont une expertise sur une maladie ou un groupe de maladies ; **les centres de compétence** assurent le suivi plus près de chez vous.
- **Orphanet** propose une encyclopédie des maladies rares, un répertoire des ressources expertes et le guide **« Vivre avec une maladie rare en France »**, qui recense les aides et prestations.
- **Maladies Rares Info Services** est un service national d’information, d’orientation et de soutien, joignable par téléphone, mail et forums.

Certaines maladies rares sont repérées dès la naissance grâce au **dépistage néonatal** (13 maladies sur le buvard, plus un test de l’audition).

## Au quotidien
- **Demandez au médecin** qui suit votre enfant à quel centre de référence ou de compétence il est rattaché.
- **Gardez un dossier** : comptes rendus, ordonnances, coordonnées des équipes ; une fiche résumée est utile en cas d’urgence.
- **À l’école** : un **PAI** organise les soins et la conduite à tenir ; selon les besoins, un **PPS** via la MDPH.
- **Droits** : le guide Orphanet « Vivre avec une maladie rare en France » recense les aides ; selon la situation, une demande à la MDPH peut ouvrir des droits.

## Questions fréquentes
**Comment trouver une association de patients ?** Orphanet et les filières de santé recensent les associations par maladie.

**Mon enfant n’a pas encore de diagnostic : à qui m’adresser ?** Le médecin peut orienter vers la filière ou le centre de référence adapté aux symptômes ; Maladies Rares Info Services peut vous aider à vous repérer.

**Les informations trouvées sur Internet sont-elles fiables ?** Privilégiez Orphanet, les filières et les centres de référence, et parlez-en avec l’équipe qui suit votre enfant.

**Existe-t-il un soutien pour les parents ?** Oui : associations, Maladies Rares Info Services, et aides aux aidants.

## Quand demander conseil
- Aggravation, nouveau symptôme : contactez l’équipe qui suit votre enfant.
- Épuisement, détresse : votre médecin ; **3114** (24 h/24).
- Urgence vitale : **15** ou **112**, en présentant la fiche d’urgence si vous en avez une.

${FIN}`,
  },
];
