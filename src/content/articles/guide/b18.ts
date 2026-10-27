/** Guide complet — lot 18 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées (pages officielles françaises).
const S = {
  temperature: { label: 'ameli.fr — Comment bien prendre la température ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/soins/prendre-temperature', consulted_on: C },
  fievreReflexes: { label: 'ameli.fr — Fièvre de l’enfant : les bons réflexes et les cas où il faut consulter', url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2024-09-03' },
  fievreMedicaments: { label: 'ameli.fr — Les médicaments en cas de fièvre chez l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/medicaments', consulted_on: C },
  fievreMpedia: { label: 'mpedia.fr (AFPA) — Fièvre bébé et enfant : que faire et quand consulter ?', url: 'https://www.mpedia.fr/art-fievre-enfant/', consulted_on: C, published: '2023-09-19' },
  fievreSante: { label: 'Santé.fr — Fièvre de l’enfant', url: 'https://www.sante.fr/fievre-de-lenfant', consulted_on: C, published: '2026-08-12' },
  convulsions: { label: 'ameli.fr — Convulsions fébriles de l’enfant', url: 'https://www.ameli.fr/assure/sante/urgence/bebe-enfant/convulsions-febriles-enfant', consulted_on: C, published: '2024-10-08' },
  suivi20: { label: 'ameli.fr — 20 examens de suivi médical de l’enfant et de l’adolescent', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/enfant-et-adolescent-20-examens-de-suivi-medical', consulted_on: C },
  suivi2mois: { label: 'ameli.fr — Examens de suivi médical jusqu’aux 2 mois du nourrisson', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/suivi-medical-jusqu-aux-2-mois-du-nourrisson', consulted_on: C },
  examen8j: { label: 'ameli.fr — Examen du nourrisson dans les 8 jours qui suivent sa naissance', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/examen-du-nourrisson-dans-les-8-jours-qui-suivent-sa-naissance', consulted_on: C, published: '2025-09-01' },
  suivi3a18: { label: 'ameli.fr — 7 examens de suivi médical entre les 3 mois et 18 mois de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/suivi-medical-du-nourrisson-entre-3-mois-et-18-mois', consulted_on: C, published: '2025-11-03' },
  suivi23m3a: { label: 'ameli.fr — 3 examens de suivi médical entre les 23 mois et les 3 ans de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/suivi-medical-entre-23-mois-et-3-ans', consulted_on: C, published: '2024-12-18' },
  bebeSante: { label: 'ameli.fr — La santé de bébé à la sortie de maternité jusqu’au 6e mois', url: 'https://www.ameli.fr/assure/sante/enfants/bebe-sante', consulted_on: C, published: '2024-12-11' },
  maternite: { label: 'ameli.fr — Suivi de l’enfant à la maternité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-et-nouveau-ne/depistage-neonatal-suivi-bebe', consulted_on: C },
  cncdn: { label: 'Centre national de coordination du dépistage néonatal (CNCDN) — FAQ parents', url: 'https://depistage-neonatal.fr/faq-parents/', consulted_on: C, published: '2025-10-13' },
  arsDepistage: { label: 'ARS Auvergne-Rhône-Alpes — Dépistage néonatal : trois nouvelles maladies dépistées à partir du 1er septembre 2025', url: 'https://www.auvergne-rhone-alpes.ars.sante.fr/depistage-neonatal-trois-nouvelles-maladies-depistees-partir-du-1er-septembre-2025', consulted_on: C, published: '2025-08-27' },
  surdite: { label: 'ameli.fr — Mon enfant entend mal : dépistage, symptômes et diagnostic de la surdité', url: 'https://www.ameli.fr/assure/sante/themes/surdite-enfant/mon-enfant-entend-mal-depistage-symptomes-et-diagnostic-de-la-surdite', consulted_on: C, published: '2026-07-16' },
  carnet: { label: 'Santé.fr (Ministère chargé de la Santé) — Le carnet de santé de l’enfant', url: 'https://www.sante.fr/le-carnet-de-sante-de-lenfant-1', consulted_on: C, published: '2024-12-27' },
  permanence: { label: 'Santé.fr (France Assos Santé) — Permanence des soins : comment accéder aux soins en dehors des horaires classiques ?', url: 'https://www.sante.fr/permanence-des-soins-comment-acceder-aux-soins-en-dehors-des-horaires-classiques', consulted_on: C, published: '2019-08-12' },
  numerosUtiles: { label: 'Santé.fr — Grand Est, numéros utiles en cas d’urgence', url: 'https://www.sante.fr/grand-est-numeros-utiles-en-cas-durgence', consulted_on: C, published: '2026-07-06' },
  pharmaGarde: { label: 'Santé.fr — Permanence des soins : pharmacies de garde', url: 'https://www.sante.fr/permanence-des-soins-pharmacies-de-garde', consulted_on: C, published: '2026-06-03' },
  urgencesParents: { label: 'ARS Pays de la Loire — Consulter les services d’urgences ou pas : recommandations aux parents', url: 'https://www.pays-de-la-loire.ars.sante.fr/consulter-les-services-durgences-ou-pas-recommandations-aux-parents', consulted_on: C },
  medecinTraitant: { label: 'ameli.fr — Choisir et déclarer votre médecin traitant', url: 'https://www.ameli.fr/assure/droits-demarches/principes/choisir-et-declarer-votre-medecin-traitant', consulted_on: C, published: '2026-01-13' },
  teleconsultation: { label: 'ameli.fr — La téléconsultation', url: 'https://www.ameli.fr/assure/remboursements/rembourse/consultations-telemedecine/telemedecine/teleconsultation', consulted_on: C, published: '2026-09-01' },
  vacancesEtranger: { label: 'ameli.fr — Vacances à l’étranger : votre prise en charge', url: 'https://www.ameli.fr/assure/droits-demarches/europe-international/protection-sociale-etranger/vacances-etranger', consulted_on: C, published: '2026-04-30' },
  trousseVoyage: { label: 'ameli.fr — Comment préparer sa trousse de médicaments pour partir en voyage ?', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/preparer-trousse-medicaments-voyage', consulted_on: C, published: '2025-07-21' },
  trousseFamiliale: { label: 'ARS Normandie — Que doit contenir ma trousse à pharmacie familiale ?', url: 'https://www.normandie.ars.sante.fr/que-doit-contenir-ma-trousse-pharmacie-familiale', consulted_on: C, published: '2026-06-24' },
  trierPharmacie: { label: 'Santé.fr — Trier son armoire à pharmacie : pourquoi ? comment ?', url: 'https://www.sante.fr/trier-son-armoire-pharmacie-pourquoi-comment', consulted_on: C, published: '2023-05-16' },
  medicamentsEnfants: { label: 'ameli.fr — Les médicaments pour les enfants et les adolescents, ce n’est pas n’importe comment', url: 'https://www.ameli.fr/assure/sante/medicaments/medicaments-et-situation-de-vie/medicaments-pour-les-enfants-et-les-adolescents', consulted_on: C, published: '2024-09-17' },
  ansmParents: { label: 'ANSM — Médicaments en pédiatrie : recommandations générales aux parents et aux prescripteurs', url: 'https://ansm.sante.fr/dossiers-thematiques/medicaments-en-pediatrie-enfants-et-adolescents/recommandations-generales-aux-parents-et-aux-prescripteurs', consulted_on: C, published: '2022-07-07' },
  reconstituer: { label: 'ameli.fr — Comment préparer un médicament buvable à partir d’une poudre ?', url: 'https://www.ameli.fr/assure/sante/medicaments/utiliser-recycler-medicaments/reconstituer-medicament-buvable', consulted_on: C, published: '2025-10-23' },
  vitDAnsm: { label: 'ANSM — Vitamine D chez l’enfant : recourir aux médicaments et non aux compléments alimentaires pour prévenir le risque de surdosage', url: 'https://ansm.sante.fr/actualites/vitamine-d-chez-lenfant-recourir-aux-medicaments-et-non-aux-complements-alimentaires-pour-prevenir-le-risque-de-surdosage', consulted_on: C, published: '2021-03-17' },
  vitDMpedia: { label: 'mpedia.fr (AFPA) — Vitamine D, carence et rachitisme', url: 'https://www.mpedia.fr/art-vitamine/', consulted_on: C, published: '2019-07-16' },
  gastro: { label: 'ameli.fr — Diarrhée et gastro-entérite de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-enfant/que-faire-quand-consulter', consulted_on: C, published: '2021-03-23' },
  pmi: { label: 'Santé.fr (Santé publique France – 1000 premiers jours) — Qu’est-ce qu’un centre de Protection maternelle et infantile (PMI) ?', url: 'https://www.sante.fr/quest-ce-quun-centre-de-protection-maternelle-et-infantile-pmi', consulted_on: C, published: '2024-08-26' },
  bronchiolite: { label: 'Santé.fr (Ministère chargé de la Santé) — Bronchiolite : les bons gestes et comportements pour limiter sa circulation', url: 'https://www.sante.fr/actualites/bronchiolite-les-bons-gestes-et-comportements-pour-limiter-sa-circulation', consulted_on: C, published: '2022-10-10' },
  coucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2019-11-14' },
  altitude: { label: 'mpedia.fr (AFPA) — Bébé en altitude : problèmes d’oreille et précautions', url: 'https://www.mpedia.fr/art-bebe-altitude/', consulted_on: C, published: '2015-01-10' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe ; il ne remplace pas l’avis du médecin, du pharmacien, de la sage-femme, de la puéricultrice de PMI ou des professionnels qui suivent votre enfant._';
const URG = 'En cas d’urgence, ou si vous avez un doute sur la gravité, appelez le **15** (SAMU) ou le **112** ; les personnes sourdes ou malentendantes peuvent joindre le **114** (SMS, tchat, visio).';
const SOUTIEN = 'Si vous vous sentez à bout ou très inquiet·e, parlez-en à votre médecin ou à la PMI ; en cas de détresse ou d’idées noires, le **3114** répond jour et nuit. Si un enfant est en danger, appelez le **119**.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['newborn'], min_age_months: 0, max_age_months: 24, status: 'to_review', ...x,
});

export const GUIDE_B18: LibArticle[] = [
  // ------------------------------------------------------------ température et fièvre
  a({
    slug: 'prendre-la-temperature-de-bebe-pas-a-pas',
    title: 'Prendre la température de bébé, pas à pas',
    summary: 'La méthode de référence avant 2 ans, les gestes pour une mesure fiable et douce, et ce que signifient les chiffres affichés.',
    category: 'sante-bebe', tags: ['température', 'prendre la température', 'thermomètre rectal', 'fièvre', 'nourrisson', '38 °C', 'thermomètre', 'bébé chaud'],
    sources: [S.temperature, S.fievreMpedia, S.fievreSante],
    body_md: `## En bref
- Avant 2 ans, la **prise rectale** est la méthode la plus précise et la plus fiable, selon l’Assurance Maladie.
- On parle de **fièvre au-delà de 38 °C** en mesure rectale, chez un enfant au repos et normalement couvert.
- La mesure sous le bras est la moins fiable : au moindre doute, on la **confirme par voie rectale**.
- Notez à chaque fois **la température et l’heure** : ces informations aident beaucoup le médecin.

## Comprendre
Un bébé qui paraît chaud, rouge ou grognon n’a pas forcément de la fièvre ; à l’inverse, un nourrisson fiévreux peut sembler simplement fatigué. Le toucher ne suffit donc pas : seul le thermomètre permet de savoir. L’Assurance Maladie définit la fièvre comme une température interne supérieure à 38 °C mesurée par voie rectale, en dehors d’un effort et dans un environnement tempéré. Les valeurs habituelles en mesure rectale se situent entre 36,6 et 38 °C.

Pour les tout-petits, la voie rectale reste la référence : mpedia (Association française de pédiatrie ambulatoire) conseille, avant 2 à 3 ans, un **thermomètre électronique à sonde souple, réservé à cet usage**. Les mesures sous l’aisselle, sur le front ou dans la bouche donnent une température plus superficielle et moins fiable. La voie buccale est déconseillée avant 5 ans, et la voie tympanique (dans l’oreille) avant 2 ans, car la position du conduit chez le nourrisson fausse souvent le résultat.

## Au quotidien
**Avant la mesure**
- Lavez-vous les mains et nettoyez l’embout du thermomètre à l’eau fraîche savonneuse, puis rincez.
- Mesurez à distance d’un moment agité (pleurs intenses, bain chaud), sur un bébé **normalement habillé**, dans une pièce qui n’est pas surchauffée.
- Si besoin, enduisez l’extrémité d’un peu de vaseline.

**La prise rectale**
- Installez bébé **sur le dos, genoux pliés** vers son ventre, sur la table à langer ou sur vos genoux, une main posée sur lui.
- Introduisez la sonde **doucement**, sur quelques centimètres seulement (l’Assurance Maladie indique environ 2,5 cm), sans forcer.
- Maintenez jusqu’au signal sonore du thermomètre électronique.
- Retirez, lisez, puis nettoyez de nouveau le thermomètre. Ne l’utilisez jamais ensuite pour une prise dans la bouche.

Soyez délicat : un geste brusque peut blesser la muqueuse. Parlez à bébé, chantez-lui quelque chose : la mesure ne dure que quelques instants.

**La prise sous l’aisselle**
Elle peut servir de premier repérage, par exemple pendant le sommeil : placez la sonde au centre de l’aisselle, bras bien rabattu contre le torse, jusqu’au signal. Si le chiffre vous interroge, confirmez par une mesure rectale.

**Après la mesure**
Notez le chiffre, l’heure, la méthode utilisée et ce que vous observez (bébé boit-il, réagit-il, sourit-il ?). Si un médicament a été donné sur conseil d’un professionnel, notez aussi lequel et à quelle heure.

## Questions fréquentes
**Faut-il prendre la température à chaque fois que bébé semble chaud ?**
Pas forcément à répétition, mais dès qu’il vous paraît inhabituel (abattu, grognon, refuse de boire), une mesure fiable est utile. Ce qui compte le plus est son état général, plus que le chiffre lui-même.

**Le thermomètre frontal ou les bandelettes suffisent-ils ?**
L’Assurance Maladie juge la mesure frontale très imprécise et ne la recommande pas chez l’enfant ; les bandelettes sont déconseillées. Gardez un thermomètre adapté à la prise rectale.

**Faut-il ajouter 0,5 °C à une mesure sous le bras ?**
Les corrections « maison » sont peu fiables. Mieux vaut confirmer par voie rectale en cas de doute, et indiquer au médecin la méthode utilisée.

**Bébé dort : faut-il le réveiller pour le mesurer ?**
Une mesure sous le bras peut donner une première idée sans le réveiller. S’il respire mal, gémit ou vous semble difficile à réveiller, n’attendez pas : appelez le 15.

## Quand demander conseil
Un bébé de **moins de 3 mois** qui a plus de 38 °C doit être vu par un médecin **le jour même**, en urgence. À tout âge, consultez rapidement si la fièvre s’accompagne d’un changement de comportement, d’un refus de boire, de difficultés à respirer ou de taches sur la peau. ${URG}

${FIN}`,
  }),
  a({
    slug: 'choisir-un-thermometre-pour-bebe',
    title: 'Quel thermomètre choisir pour bébé ?',
    summary: 'Électronique, infrarouge, frontal ou bandelette : ce que vaut chaque type de thermomètre selon l’âge, et comment bien l’acheter et l’entretenir.',
    category: 'materiel', tags: ['thermomètre', 'thermomètre bébé', 'thermomètre rectal', 'thermomètre auriculaire', 'thermomètre frontal', 'mercure', 'acheter', 'pharmacie'],
    max_age_months: 60, journeys: ['pregnant', 'newborn', 'child'],
    sources: [S.temperature, S.fievreMpedia, S.fievreSante],
    body_md: `## En bref
- Pour un bébé, le plus utile est un **thermomètre électronique** utilisable par voie rectale, idéalement à **sonde souple**, réservé à cet usage.
- Le thermomètre **à infrarouge auriculaire** (dans l’oreille) devient pratique **après 2 ans**, à condition de bien respecter la technique.
- Les thermomètres **frontaux** et les **bandelettes** sont trop imprécis pour un enfant.
- Le **mercure est interdit** dans les thermomètres depuis 1999 : un vieux modèle au mercure ne doit plus servir.

## Comprendre
Il existe plusieurs familles de thermomètres, décrites par l’Assurance Maladie :
- **Électroniques** : ils affichent la température en quelques secondes et conviennent aux voies rectale, axillaire (sous le bras) et buccale. C’est l’outil de base pour les tout-petits.
- **À infrarouge** : ils captent le rayonnement émis par le corps, surtout au niveau du tympan, parfois de la tempe. Très rapides, ils demandent une technique rigoureuse ; la voie tympanique est déconseillée avant 2 ans.
- **À gallium** (tube de verre) : ils ont remplacé le mercure. Ils sont de moins en moins utilisés ; le verre peut se briser.
- **Bandelettes frontales à cristaux liquides** : déconseillées, faute de précision.

Selon l’âge, l’Assurance Maladie propose : de la naissance à 2 ans, la voie **rectale** en premier choix et la voie axillaire en second (avec confirmation rectale au moindre doute) ; de 2 à 5 ans, rectale puis tympanique, puis axillaire ; après 5 ans, buccale, puis tympanique, puis axillaire.

## Au quotidien
**À l’achat**
- Achetez votre thermomètre en pharmacie ou dans un commerce fiable. C’est un dispositif médical : vérifiez qu’il porte le **marquage CE** et qu’une **notice en français** l’accompagne.
- Pour bébé, choisissez un modèle électronique **à embout souple**, avec signal sonore de fin de mesure et affichage lisible la nuit.
- Prévoyez, si possible, **un thermomètre dédié à la voie rectale**, que vous identifiez clairement (étiquette, couleur) pour ne pas l’utiliser ensuite dans la bouche.
- Plus tard, un thermomètre auriculaire peut compléter l’équipement ; il nécessite en général des **embouts de protection** propres.

**À l’usage et à l’entretien**
- Lisez la notice : chaque modèle a ses particularités (durée de mesure, mise en marche, changement de pile).
- Nettoyez l’embout avant et après chaque utilisation, à l’eau fraîche savonneuse, puis rincez. Évitez d’immerger un appareil électronique si la notice ne le prévoit pas.
- Rangez-le dans son étui, avec la trousse de soins de bébé, hors de portée des enfants.
- Vérifiez de temps en temps la pile, et emportez le thermomètre en vacances.

**Si vous avez un vieux thermomètre au mercure**
Ne l’utilisez plus : en cas de casse, il expose à un risque de blessure et de toxicité, comme le rappelle mpedia. Demandez à votre pharmacie ou à votre déchetterie comment le déposer.

## Questions fréquentes
**Un thermomètre « sans contact » est-il une bonne idée pour un nourrisson ?**
Les mesures à distance ou sur le front sont jugées très imprécises par l’Assurance Maladie : elles ne repèrent surtout que les fièvres élevées. Pour un bébé, gardez un thermomètre électronique utilisable par voie rectale.

**Le thermomètre auriculaire est-il fiable ?**
Il est rapide et pratique chez l’enfant de plus de 2 ans, si l’on suit bien la notice : embout propre, pavillon de l’oreille tiré vers le haut et l’arrière. Un bouchon de cérumen ou une mauvaise position peuvent fausser la mesure. En cas de doute, refaites la mesure ou utilisez la voie rectale.

**Faut-il un thermomètre spécial pour mesurer la température du bain ?**
C’est un autre objet. Un thermomètre de bain sert à vérifier l’eau ; il ne remplace jamais le thermomètre médical.

**Deux thermomètres affichent des chiffres différents : lequel croire ?**
Les valeurs varient selon la méthode. Pour un bébé, la mesure rectale avec un thermomètre électronique sert de référence. Indiquez toujours au médecin la méthode utilisée.

## Quand demander conseil
Votre pharmacien peut vous aider à choisir un modèle adapté à l’âge de votre enfant et vous montrer comment l’utiliser. Si une mesure vous inquiète chez un bébé de moins de 3 mois (plus de 38 °C), consultez le jour même. ${URG}

${FIN}`,
  }),
  a({
    slug: 'bebe-chaud-ou-fievre-habillage-et-chambre',
    title: 'Bébé a chaud ou a de la fièvre ? Habillage, chambre et bonne mesure',
    summary: 'Trop couvert, pièce surchauffée, sortie du bain : comment faire la différence entre un bébé qui a chaud et un bébé fiévreux.',
    category: 'sante-bebe', tags: ['bébé chaud', 'fièvre', 'habillage bébé', 'température chambre', 'gigoteuse', 'surchauffe', 'nuit', 'thermomètre'],
    sources: [S.temperature, S.coucher, S.fievreReflexes],
    body_md: `## En bref
- La température se mesure sur un bébé **normalement habillé**, au calme, **hors d’une pièce très chaude** : sinon le chiffre peut être faussé.
- Pour dormir, la chambre est conseillée **entre 18 et 20 °C**, aérée chaque jour.
- Préférez une **gigoteuse ou un surpyjama à sa taille** ; pas de couette ni d’édredon avant 3 ans.
- Un bébé de moins de 3 mois qui a **plus de 38 °C** après une mesure fiable doit être vu le jour même.

## Comprendre
Les nourrissons régulent encore imparfaitement leur température. Un bébé emmitouflé dans plusieurs couches, porté longtemps contre soi, ou installé près d’un radiateur peut avoir la peau chaude et les joues rouges sans être malade. À l’inverse, la fièvre est une réaction de l’organisme, le plus souvent à une infection : la température interne monte, quel que soit l’habillage.

C’est pourquoi l’Assurance Maladie demande de prendre la température **à distance d’un effort, sur une personne normalement couverte, hors d’une atmosphère très chaude**. Pour les tout-petits, la mesure rectale reste la référence : au-delà de 38 °C, on parle de fièvre.

L’environnement compte aussi pour la sécurité du sommeil. L’Assurance Maladie conseille de coucher bébé sur le dos, dans une gigoteuse adaptée, sans oreiller ni couverture, dans une chambre à 18–20 °C, aérée tous les jours.

## Au quotidien
**Repérer un bébé trop couvert**
- Observez-le : transpiration dans le cou, cheveux humides, joues très rouges, agitation, plusieurs couches de vêtements dans une pièce chauffée.
- Dans ce cas, habillez-le **normalement**, installez-le dans une pièce tempérée, proposez-lui à boire, puis **attendez un moment** avant de mesurer sa température.
- Le toucher ne suffit pas à savoir s’il a de la fièvre : seule une mesure fiable le permet.

**Habiller pour la nuit**
- Une tenue de nuit adaptée à la saison, puis une **gigoteuse ou un surpyjama à sa taille** : une gigoteuse trop grande peut laisser bébé glisser à l’intérieur.
- Pas de couverture, de couette, d’oreiller ni de peluche volumineuse dans le lit.
- Vérifiez la température de la chambre avec un simple thermomètre d’ambiance, et aérez chaque jour.
- Couchez-le **sur le dos, à plat**, pour la nuit comme pour les siestes.

**En journée**
- Adaptez sa tenue à la pièce où il se trouve plutôt qu’à l’heure ou à la saison : en voiture chauffée ou dans un magasin, retirez la combinaison épaisse.
- Après un moment d’agitation ou de pleurs, laissez-le se calmer avant toute mesure.

**Si la température reste élevée**
Une fois bébé habillé normalement et au calme, refaites une mesure rectale. Si elle dépasse 38 °C, il s’agit d’une fièvre : surveillez son état général et suivez les conseils de l’article sur le bébé fiévreux. S’il a moins de 3 mois, contactez un médecin le jour même.

## Questions fréquentes
**Peut-on se fier au toucher du front ?**
Non : un front chaud ou des joues rouges ne suffisent pas pour parler de fièvre. Pour un bébé, l’Assurance Maladie recommande la mesure rectale, la plus fiable avant 2 ans.

**Faut-il couvrir davantage un bébé fiévreux qui frissonne ?**
L’Assurance Maladie conseille de ne pas trop couvrir un enfant fiévreux, sans pour autant le déshabiller complètement, pour éviter qu’il ne grelotte. Une tenue légère et une pièce tempérée sont le bon compromis.

**Le bain chaud peut-il fausser la mesure ?**
Oui, comme toute situation de chaleur ou d’agitation. Attendez qu’il soit séché, habillé et calme avant de mesurer.

**Et s’il a vraiment de la fièvre ?**
L’Assurance Maladie conseille alors une pièce fraîche et aérée, vers 18 à 20 °C, des boissons proposées souvent, et d’éviter le bain beaucoup plus froid que sa température. Surveillez surtout son comportement : somnolence, refus de boire, cris faibles ou peau marbrée imposent de consulter en urgence.

## Quand demander conseil
Demandez conseil si bébé transpire beaucoup sans raison apparente, s’il boit moins, s’il vous paraît mou ou inhabituel, ou si la fièvre se confirme. Avant 3 mois, une fièvre confirmée nécessite une consultation le jour même. ${URG}

${FIN}`,
  }),
  a({
    slug: 'bebe-fievreux-a-la-maison-confort-et-surveillance',
    title: 'Bébé fiévreux à la maison : le confort, la surveillance, les bons réflexes',
    summary: 'Pièce, vêtements, boissons, médicaments et signes à surveiller : comment accompagner un bébé qui a de la fièvre et savoir quand consulter.',
    category: 'sante-bebe', safety_critical: true, journeys: ['newborn', 'child'], max_age_months: 36,
    tags: ['fièvre', 'bébé fiévreux', 'faire baisser la fièvre', 'hydratation', 'nuit', 'surveillance', 'quand consulter', 'paracétamol'],
    sources: [S.fievreReflexes, S.fievreMpedia, S.fievreMedicaments],
    body_md: `## En bref
- La fièvre est une **réaction de défense** ; elle n’est pas dangereuse en elle-même. C’est **l’état général** de bébé qui guide, plus que le chiffre.
- Pièce **fraîche et aérée (18–20 °C)**, vêtements **légers**, **à boire souvent** : ce sont les premières mesures.
- Pas de bain froid. Un médicament ne se donne que sur **conseil d’un médecin ou d’un pharmacien**, un seul à la fois.
- **Avant 3 mois**, toute fièvre impose une consultation **le jour même**.

## Comprendre
Chez le bébé, on parle de fièvre au-delà de 38 °C en mesure rectale. mpedia rappelle qu’elle traduit le plus souvent la réponse du système immunitaire à une infection et qu’elle ne provoque pas, à elle seule, de lésions. Le but des soins n’est donc pas de « faire tomber » la température à tout prix, mais de **soulager l’inconfort** et de **repérer les signes de gravité**.

Un bébé qui boit, réagit, sourit et joue par moments est rassurant. Un bébé geignard, très pâle, mou, qui refuse de boire ou dont le comportement change doit être vu rapidement, quelle que soit la température affichée.

## Au quotidien
**Le confort**
- Installez-le dans une pièce à **18–20 °C**, aérée, et évitez les pièces surchauffées.
- Habillez-le **légèrement** (body, pyjama léger), sans le déshabiller complètement pour éviter les frissons.
- Proposez **souvent à boire**, même s’il ne réclame pas : sein à la demande, ou biberons et eau selon ce que le professionnel vous a conseillé pour son âge. L’appétit baisse souvent ; la boisson compte davantage que les repas.
- Évitez les **bains froids** : ils augmentent l’inconfort et peuvent provoquer frissons et malaise. Une compresse fraîche sur le front peut soulager.
- Gardez-le au calme et laissez-le se reposer.

**Les médicaments**
L’Assurance Maladie rappelle que les mesures simples passent en premier. Si un médicament contre la fièvre vous semble utile (bébé très inconfortable), demandez l’avis du médecin ou du pharmacien. Les règles de sécurité : **un seul médicament à la fois**, pas d’alternance sans avis médical, vérifier qu’aucun autre produit déjà donné ne contient la même substance, **utiliser le dispositif doseur fourni** et respecter la notice. Pas d’aspirine sans avis médical. Les anti-inflammatoires sont à éviter en cas de varicelle ou de déshydratation.

**La surveillance**
- Notez la température, l’heure, les boissons prises, les couches mouillées et les médicaments donnés.
- La nuit, gardez-le couché sur le dos, dans son lit, et allez le voir régulièrement : s’il respire vite, gémit, ou se réveille difficilement, n’attendez pas.

## Questions fréquentes
**Jusqu’à quand peut-on attendre avant de consulter ?**
L’Assurance Maladie conseille de consulter dans la journée si la fièvre dure plus de **2 jours chez un enfant de moins de 2 ans**, si elle réapparaît après plus de 24 heures sans fièvre, si l’enfant a une maladie chronique, ou pour tout autre symptôme qui vous inquiète.

**Une fièvre très élevée est-elle plus grave ?**
La hauteur de la fièvre n’indique pas à elle seule la gravité. Néanmoins, une fièvre au-delà de 40 °C fait partie des situations où l’Assurance Maladie conseille de consulter en urgence.

**Peut-il aller à la crèche ?**
Un bébé fiévreux a besoin de repos et de surveillance. Renseignez-vous sur les règles de votre structure d’accueil et demandez l’avis du médecin.

**Faut-il le réveiller la nuit pour vérifier sa température ?**
Ce qui compte est de pouvoir **observer** son état : respiration, teint, réaction quand vous le touchez. S’il dort paisiblement et respire normalement, laissez-le se reposer en passant le voir régulièrement. S’il est difficile à réveiller, gémit ou respire mal, appelez le 15. Si une convulsion survient, consultez l’article dédié aux convulsions fébriles et appelez le 15 en cas de doute.

## Quand demander conseil
Consultez **en urgence** (ou appelez le 15) si bébé a moins de 3 mois, si son état se dégrade (somnolence, refus de boire, cris faibles, peau marbrée ou très pâle), s’il respire difficilement, vomit de façon répétée, présente des signes de déshydratation, une raideur de la nuque ou des **petites taches rouges qui ne s’effacent pas à la pression**. ${URG}

${FIN}`,
  }),
  a({
    slug: 'convulsion-febrile-bebe-que-faire',
    title: 'Convulsion pendant une fièvre : que faire pendant et après la crise ?',
    summary: 'Reconnaître une convulsion fébrile, protéger l’enfant pendant la crise, savoir quand appeler le 15 et ce qui se passe ensuite.',
    category: 'premiers-secours', safety_critical: true, journeys: ['newborn', 'child'], min_age_months: 6, max_age_months: 60,
    tags: ['convulsion', 'convulsion fébrile', 'crise', 'fièvre', 'position latérale de sécurité', 'urgence', '15', 'bébé qui tremble'],
    sources: [S.convulsions, S.fievreReflexes, S.fievreSante],
    body_md: `## En bref
- Une convulsion fébrile survient pendant une fièvre, en général **entre 6 mois et 5 ans**, chez un enfant en bonne santé.
- Pendant la crise : **notez l’heure**, mettez l’enfant **sur le côté**, éloignez ce qui peut le blesser, et **ne mettez rien dans sa bouche**.
- Appelez le **15** (ou le 112) **immédiatement** s’il a moins d’un an, si la crise dure, se répète, ne touche qu’un côté, ou s’il respire mal.
- Après une crise, l’enfant doit être **examiné par un médecin**.

## Comprendre
L’Assurance Maladie décrit la convulsion fébrile ainsi : pendant un épisode de fièvre (au moins 38 °C), le corps et les membres se secouent par saccades, de façon symétrique ; l’enfant perd connaissance ou paraît absent, ses yeux peuvent se révulser ou fixer un point. La crise dure le plus souvent **de 1 à 5 minutes**. Ensuite, l’enfant est somnolent puis retrouve habituellement son état en moins de 15 minutes.

C’est une scène très impressionnante pour les parents. L’Assurance Maladie précise que ces crises ne sont pas de l’épilepsie et n’ont pas de conséquence sur le cerveau ; environ 30 % des enfants en refont une lors d’un autre épisode de fièvre. Les médicaments contre la fièvre soulagent l’inconfort, mais **ne préviennent pas** les récidives.

## Au quotidien
**Pendant la crise**
- Regardez l’heure : la durée est une information importante.
- Installez l’enfant en **position latérale de sécurité**, sur le côté, la tête légèrement plus basse que le corps, sur le sol ou un lit large.
- Éloignez les objets durs ou coupants, restez près de lui et soutenez sa tête.
- Ne vous opposez pas à ses mouvements, ne le secouez pas.
- **Ne mettez rien dans sa bouche** : ni objet, ni médicament, ni doigts. Seul un corps étranger bien visible peut être retiré.
- Desserrez ses vêtements, découvrez-le.
- Ne lui donnez ni à boire ni à manger tant qu’il est somnolent.

**Après la crise**
- Laissez-le se reposer sur le côté et restez auprès de lui.
- Gérez la fièvre comme d’habitude : pièce fraîche et aérée (18–20 °C), vêtements légers, boissons fréquentes dès qu’il est bien réveillé.
- Consultez le médecin ou le pédiatre, qui recherchera la cause de la fièvre et confirmera qu’il s’agit d’une convulsion fébrile.
- Si un traitement à utiliser en cas de nouvelle crise vous a été **prescrit**, rangez-le avec l’ordonnance et demandez qu’on vous montre comment l’utiliser.

**Se préparer sans s’angoisser**
Une formation aux gestes de premiers secours (position latérale de sécurité, alerte) aide beaucoup à garder son calme. Affichez le **15** et le **112** près du téléphone, et expliquez la conduite à tenir aux personnes qui gardent votre enfant.

## Questions fréquentes
**Faut-il appeler le 15 à chaque crise ?**
L’Assurance Maladie liste les situations où il faut appeler **immédiatement** : enfant de moins d’un an ou de plus de 5 ans, crise de 15 minutes ou plus, plusieurs crises en 24 heures, secousses d’un seul côté, maladie neurologique connue, crise sans fièvre, lèvres ou mains bleutées avec respiration difficile, paralysie après la crise. Dans le doute, appelez : le médecin régulateur vous guidera.

**Mon enfant va-t-il en refaire ?**
C’est possible, comme pour environ un enfant sur trois. Parlez-en avec le médecin, qui vous expliquera la conduite à tenir pour votre enfant.

**Faut-il faire des examens ?**
Le médecin en décide après avoir examiné l’enfant ; selon l’Assurance Maladie, aucun examen complémentaire n’est en général utile pour une convulsion fébrile simple.

**Puis-je éviter la crise en donnant un médicament dès le début de la fièvre ?**
Non : les médicaments contre la fièvre ne préviennent pas les convulsions. Ils servent au confort de l’enfant, sur conseil d’un professionnel.

## Quand demander conseil
Après toute première crise, faites examiner l’enfant. Appelez le 15 sans attendre dans les situations listées ci-dessus, ou si quelque chose vous inquiète. Si l’angoisse persiste après un tel épisode, parlez-en : ${SOUTIEN} ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ pharmacie et médicaments
  a({
    slug: 'trousse-pharmacie-de-base-bebe',
    title: 'La trousse de soins de base pour bébé (sans automédication)',
    summary: 'Ce qu’il est utile d’avoir à la maison pour soigner les petits soucis de bébé, comment le choisir avec le pharmacien et bien le ranger.',
    category: 'sante-bebe', journeys: ['pregnant', 'newborn'], max_age_months: 36,
    tags: ['pharmacie', 'trousse à pharmacie', 'armoire à pharmacie', 'liste naissance', 'sérum physiologique', 'thermomètre', 'SRO', 'premiers soins'],
    sources: [S.trousseFamiliale, S.trousseVoyage, S.trierPharmacie],
    body_md: `## En bref
- Une trousse de base contient surtout du **petit matériel de soins** ; son contenu se définit **avec le pharmacien ou le médecin**, selon l’âge de bébé.
- Indispensables : un **thermomètre** adapté, du **sérum physiologique en dosettes**, des **compresses stériles**, de quoi désinfecter une petite plaie, et des **sachets de réhydratation** si le médecin le conseille.
- Les médicaments s’y ajoutent **sur conseil d’un professionnel**, jamais « au cas où » à partir de ceux des adultes.
- Rangement **en hauteur ou fermé à clé**, et **tri régulier** des produits périmés ou ouverts depuis longtemps.

## Comprendre
L’ARS Normandie rappelle qu’une trousse familiale ne devrait contenir que du **petit matériel et des médicaments dont l’usage ne nécessite pas l’intervention d’un professionnel**, et que son contenu se définit avec le pharmacien ou le médecin. Pour un nourrisson, c’est encore plus vrai : les traitements des enfants sont spécifiques, et les produits pour adultes ne se « transposent » pas.

L’idée n’est donc pas de stocker de quoi tout soigner, mais d’avoir sous la main de quoi **mesurer, nettoyer, protéger** et **attendre l’avis** d’un professionnel dans de bonnes conditions.

## Au quotidien
**Le petit matériel**
- Un **thermomètre électronique** utilisable par voie rectale, et sa notice.
- Du **sérum physiologique en unidoses**, pour le nez et les yeux.
- Des **compresses stériles** en sachets individuels, des pansements adaptés à la peau fragile, une bande, de petits ciseaux à bouts ronds.
- Une **pince à épiler** et un **tire-tiques**, utiles dès que bébé sort dans la nature.
- Un antiseptique adapté au nourrisson, **choisi avec le pharmacien** (l’Assurance Maladie signale qu’un antiseptique comme la chlorhexidine peut, rarement, provoquer une réaction allergique grave : en cas de malaise, appelez le 15).
- Des **sachets de soluté de réhydratation orale (SRO)**, à utiliser selon le mode d’emploi en cas de diarrhée, en attendant l’avis médical.
- Une crème de protection pour le siège et, pour l’été, une protection solaire adaptée aux enfants (les bébés restent avant tout à l’ombre).

**Les papiers utiles**
- Le **carnet de santé**, les ordonnances en cours, la liste des allergies éventuelles.
- Une fiche avec les numéros : **15**, **112**, **114**, médecin traitant, pharmacie, numéro de garde de votre région, centre antipoison.

**Le rangement**
- Une boîte fermée, **hors de portée et hors de vue** des enfants, idéalement dans un meuble fermé à clé, à environ 25 °C, dans un endroit frais et à l’abri du soleil.
- Gardez chaque produit **dans sa boîte, avec sa notice**.
- Notez la **date d’ouverture** sur les flacons, sirops, sprays et collyres : certains ne se conservent que quelques semaines après ouverture.

**Le tri**
Faites le point régulièrement. Rapportez en pharmacie les médicaments périmés, ceux d’un traitement terminé ou dont l’aspect a changé, dans leur emballage d’origine (cartons et notices vont au tri). Ne jetez jamais de médicament à la poubelle, dans l’évier ou les toilettes.

## Questions fréquentes
**Faut-il avoir un médicament contre la fièvre d’avance ?**
Demandez au médecin ou au pharmacien ce qui est adapté à l’âge et au poids de votre bébé, et comment l’utiliser. Ne gardez pas un médicament prescrit pour un autre enfant.

**Peut-on garder un sirop ou un collyre entamé ?**
Certains produits ne se conservent que quelques semaines après ouverture (sirops, sprays, collyres). Notez la date d’ouverture sur le flacon, vérifiez la notice, et rapportez en pharmacie ce qui est dépassé ou dont l’aspect a changé.

**Une compresse ouverte reste-t-elle stérile ?**
Non : une fois l’emballage ouvert, elle perd sa stérilité. Préférez les sachets individuels.

**Et en vacances ?**
Emportez la trousse, adaptée à la destination et à la saison, avec le carnet de santé et les ordonnances.

## Quand demander conseil
Le pharmacien est votre meilleur allié pour composer la trousse et répondre à vos questions sur un produit. En cas d’ingestion accidentelle d’un médicament ou d’un produit, appelez le 15 ou un centre antipoison sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'medicaments-bebe-regles-de-securite',
    title: 'Médicaments et bébé : les règles de sécurité à connaître',
    summary: 'Pourquoi un bébé ne prend pas « un petit peu » d’un médicament d’adulte, et les réflexes qui évitent la plupart des erreurs.',
    category: 'sante-bebe', safety_critical: true, journeys: ['newborn', 'child'], max_age_months: 36,
    tags: ['médicaments', 'automédication', 'erreur médicamenteuse', 'ordonnance', 'pharmacien', 'notice', 'pipette', 'intoxication'],
    sources: [S.medicamentsEnfants, S.ansmParents, S.fievreMedicaments],
    body_md: `## En bref
- Un traitement pour enfant est **spécifique** : il est choisi selon **l’âge et le poids**, qui figurent sur l’ordonnance.
- **Pas de médicament sans avis** d’un médecin ou d’un pharmacien chez le nourrisson ; jamais de « petit bout » d’un médicament d’adulte.
- Utilisez **uniquement le dispositif doseur fourni** avec le médicament, et lisez la notice.
- Ne réutilisez pas le traitement d’un autre enfant, et rangez tout **hors de portée**.

## Comprendre
L’Assurance Maladie insiste : les dosages, les rythmes de prise et les formes des médicaments doivent être adaptés au développement de l’enfant. Le nourrisson (de 28 jours à 23 mois) et a fortiori le nouveau-né ne métabolisent pas les médicaments comme un adulte. Un traitement pour adulte ne se divise donc pas « à l’œil ».

La plupart des erreurs viennent de gestes simples : une pipette d’un autre flacon, deux produits contenant la même substance, une prise redonnée par deux adultes qui ne se sont pas concertés, un flacon laissé sur la table à langer. Quelques réflexes suffisent à les éviter.

## Au quotidien
**Avant de donner**
- Pour un achat sans ordonnance, **précisez au pharmacien l’âge, le poids et les symptômes** de bébé, et les autres produits qu’il reçoit (y compris vitamines).
- Relisez **l’ordonnance** et **la notice** : nom du produit, moment de la prise, durée, conservation.
- Vérifiez qu’un **autre adulte** n’a pas déjà donné la prise. Un petit carnet ou une note sur le téléphone, partagé à la maison, évite les doublons.
- En cas de fièvre, un **seul médicament à la fois** ; ne combinez ni n’alternez sans avis médical, et vérifiez qu’aucun autre produit ne contient la même substance.

**Pendant le traitement**
- Utilisez **le dispositif livré avec ce médicament** (seringue, pipette, cuillère, gobelet) et jamais celui d’un autre : les graduations sont propres à chaque produit.
- Respectez les intervalles et la durée prévue, même si bébé va mieux, sauf avis contraire du médecin.
- Surveillez l’évolution : en cas d’aggravation, d’absence d’amélioration ou d’effet inattendu (éruption, vomissements…), contactez le médecin ou le pharmacien. Les effets indésirables peuvent être signalés à l’ANSM.

**Après le traitement**
- Ne gardez pas les restes « pour la prochaine fois » et ne les donnez pas à un frère ou une sœur, même avec les mêmes symptômes.
- Rapportez-les en pharmacie dans leur emballage.

**Le rangement**
En hauteur ou dans un meuble fermé à clé, hors de vue. Ne laissez jamais un flacon sur une table de nuit, dans un sac à langer ouvert ou à portée d’un aîné.

## Questions fréquentes
**L’aspirine est-elle adaptée aux bébés ?**
L’Assurance Maladie déconseille de donner de l’aspirine à un enfant sans avis médical, en raison d’un risque grave. Demandez toujours conseil.

**Les comprimés peuvent-ils être écrasés ?**
Les comprimés et gélules à avaler entiers sont déconseillés avant 6 ans à cause du risque de fausse route. N’ouvrez une gélule ou n’écrasez un comprimé que si la notice ou le professionnel l’autorise.

**Les produits « naturels » ou les compléments sont-ils plus doux ?**
Pas forcément : l’Assurance Maladie rappelle que les compléments alimentaires (vitamines, minéraux) peuvent interagir avec les médicaments. Parlez-en au médecin ou au pharmacien avant d’en donner.

**Que faire si je me suis trompé de dose ou de produit ?**
Appelez le 15 ou un centre antipoison, avec la boîte du médicament sous les yeux. N’attendez pas l’apparition de symptômes.

## Quand demander conseil
Avant tout médicament chez un nouveau-né ou un nourrisson, demandez conseil au médecin ou au pharmacien, comme le recommande l’ANSM. Consultez aussi si la fièvre est élevée ou se prolonge, pour en chercher la cause. ${URG}

${FIN}`,
  }),
  a({
    slug: 'donner-un-medicament-a-bebe-en-pratique',
    title: 'Donner un médicament à bébé : les gestes qui aident',
    summary: 'Seringue doseuse, sirop à reconstituer, mélange au biberon, bébé qui recrache : les gestes pratiques pour que le traitement soit bien pris.',
    category: 'sante-bebe', journeys: ['newborn', 'child'], max_age_months: 36,
    tags: ['donner un médicament', 'seringue', 'pipette', 'sirop', 'antibiotique', 'reconstituer', 'bébé recrache', 'goût'],
    sources: [S.reconstituer, S.medicamentsEnfants, S.ansmParents],
    body_md: `## En bref
- Lavez-vous les mains, **agitez** le flacon, et utilisez **la seringue ou la cuillère fournie avec ce médicament**.
- Avec une seringue : **pointe dans l’intérieur de la joue**, puis on pousse **lentement** le piston.
- Pour une poudre à reconstituer, suivez précisément la notice (eau plate, repère du flacon, agitation).
- Mélanger au biberon ou à un aliment n’est possible **que si la notice ou le professionnel l’autorise**.

## Comprendre
Beaucoup de traitements pour bébé sont buvables : solutions, suspensions, poudres à diluer. Bien les préparer et bien les donner permet que bébé reçoive réellement ce que le médecin a prescrit. Les fiches de l’Assurance Maladie et de l’ANSM rappellent quelques règles simples : un dispositif doseur propre à chaque médicament, une préparation conforme à la notice, une conservation respectée.

## Au quotidien
**Reconstituer un sirop à partir d’une poudre** (par exemple certains antibiotiques), selon l’Assurance Maladie :
1. Lavez-vous les mains ; tapotez et agitez le flacon pour décoller la poudre.
2. Utilisez de l’**eau non gazeuse à température ambiante** (si c’est l’eau du robinet, laissez-la couler quelques secondes).
3. Versez l’eau jusqu’aux **deux tiers** du repère, refermez, agitez une minute ; laissez reposer une minute, complétez **jusqu’au repère**, puis agitez de nouveau.
4. Si un gobelet doseur est fourni, suivez la même logique avec le trait du gobelet.
5. Notez la **date de préparation** sur le flacon et vérifiez dans la notice où et combien de temps le conserver (certains au réfrigérateur).

**Donner avec une seringue graduée**
- Agitez le flacon avant chaque prise si la notice le demande.
- Prélevez la quantité prescrite **sans bulle d’air**.
- Tenez bébé en position semi-assise, bien calé dans vos bras, jamais allongé à plat.
- Glissez la pointe **dans la joue**, sur le côté, et poussez **lentement**, en lui laissant le temps d’avaler.
- Rincez la seringue après usage et rangez-la **avec son flacon**. Ne l’utilisez jamais pour un autre médicament.

**Quand bébé n’aime pas le goût**
- Proposez ensuite une tétée, un biberon ou, chez le plus grand, un aliment qu’il apprécie.
- L’Assurance Maladie cite la possibilité de mélanger au biberon ou à un aliment : vérifiez d’abord que la notice ou le professionnel le permet, et que bébé finira bien ce mélange.
- Restez calme et rapide ; un rituel (chanson, petit mot) aide souvent.
- Avec un enfant plus grand, expliquez simplement à quoi sert le traitement.

**Après la prise**
Notez l’heure et la prise dans un carnet partagé avec l’autre parent ou la personne qui garde bébé. Terminez le traitement selon l’ordonnance, puis rapportez les restes en pharmacie : un sirop reconstitué ne se réutilise pas.

## Questions fréquentes
**Bébé a vomi juste après : faut-il redonner ?**
L’Assurance Maladie indique que si l’enfant vomit **dans les 10 minutes**, la prise peut être redonnée. Au-delà, ou si les vomissements se répètent, demandez conseil au médecin ou au pharmacien, qui pourront proposer une autre forme.

**Peut-on utiliser une seringue d’un autre flacon si on a perdu la bonne ?**
Non, car les graduations sont propres à chaque produit. Demandez un dispositif adapté à votre pharmacien.

**Et les suppositoires, gouttes ou collyres ?**
Suivez les indications de la notice et demandez au pharmacien de vous montrer le geste lors de la délivrance : c’est son rôle.

**Le sirop a changé d’aspect : peut-on le donner ?**
Un médicament dont l’aspect a changé ou dont la durée de conservation après ouverture est dépassée ne doit plus être utilisé. Rapportez-le en pharmacie.

## Quand demander conseil
Contactez le médecin ou le pharmacien si bébé refuse systématiquement le traitement, vomit à chaque prise, ou si son état ne s’améliore pas. En cas d’erreur de produit ou de quantité, appelez le 15 ou un centre antipoison. ${URG}

${FIN}`,
  }),
  a({
    slug: 'solute-rehydratation-orale-bebe-mode-d-emploi',
    title: 'Le soluté de réhydratation orale (SRO) : à quoi il sert et comment le donner',
    summary: 'Diarrhée, vomissements, chaleur : le rôle du SRO pour éviter la déshydratation du bébé, la façon de le proposer et les signes qui doivent alerter.',
    category: 'sante-bebe', safety_critical: true, journeys: ['newborn', 'child'], max_age_months: 36,
    tags: ['SRO', 'soluté de réhydratation', 'diarrhée', 'gastro', 'déshydratation', 'vomissements', 'bébé', 'pharmacie'],
    sources: [S.gastro, S.trousseVoyage, S.bebeSante],
    body_md: `## En bref
- Le **SRO** est une poudre en sachet, vendue en pharmacie, qui compense l’eau et les sels perdus en cas de diarrhée.
- On le propose **dès le début de la diarrhée**, avant même la consultation, **en petites quantités, souvent**.
- On ne modifie **jamais la dilution** indiquée et on ne le remplace pas par de l’eau pure ou un soda.
- L’allaitement **continue** ; le lait infantile n’est interrompu que **quelques heures au plus**, selon l’avis médical.

## Comprendre
Chez le nourrisson, et surtout avant 6 mois, la diarrhée et les vomissements peuvent rapidement entraîner une **déshydratation**. L’Assurance Maladie recommande la solution de réhydratation orale comme premier geste, pendant toute la durée de la diarrhée. Sur prescription, les SRO sont remboursés pour les jeunes enfants atteints de diarrhée aiguë.

Le SRO n’arrête pas la diarrhée : il **protège** l’enfant pendant que la maladie suit son cours. L’eau seule est mal tolérée et inadaptée ; les boissons uniquement sucrées et les sodas sont à éviter.

## Au quotidien
**Préparer**
- Suivez **exactement** le mode d’emploi du sachet (volume et type d’eau indiqués) ; ne concentrez pas et ne diluez pas davantage.
- Préparez-le dans un biberon ou un verre propre. Vérifiez sur la notice combien de temps la solution se conserve une fois préparée.

**Proposer**
- Au début, plusieurs fois par heure, **en très petites quantités** (quelques gorgées, à la cuillère, à la seringue ou au biberon), puis augmentez progressivement.
- En cas de vomissements, l’Assurance Maladie conseille de le donner **bien frais**, par **petites gorgées** ou à la cuillère, à intervalles rapprochés.
- Ensuite, laissez bébé boire **selon sa soif** tant que la diarrhée dure.

**L’alimentation**
- **Allaitement** : continuez les tétées et proposez le SRO entre elles.
- **Lait infantile** : il est remplacé temporairement par le SRO, puis repris au bout de **quelques heures au maximum**, en continuant le SRO entre les biberons.
- **Bébé diversifié** : gardez ses aliments habituels et proposez le SRO à volonté.

**Ce qu’on évite**
L’Assurance Maladie déconseille chez l’enfant les anti-vomitifs, les ralentisseurs du transit, les argiles avant 2 ans, les antiseptiques intestinaux vendus sans ordonnance et les anti-inflammatoires en cas de déshydratation. Ne donnez aucun médicament sans avis.

**Toujours en avoir**
Gardez quelques sachets dans la trousse de la maison et dans celle des vacances : l’Assurance Maladie les juge particulièrement utiles pour un jeune enfant en pays chaud.

## Questions fréquentes
**Bébé refuse le SRO : que faire ?**
Proposez-le très frais, à la cuillère ou à la seringue, en toutes petites quantités mais souvent. S’il refuse de boire et continue de perdre de l’eau, consultez rapidement.

**Le SRO peut-il remplacer le lait plusieurs jours ?**
Non. Il remplace le lait infantile pendant quelques heures au maximum ; l’allaitement, lui, n’est pas interrompu. Suivez l’avis du médecin.

**Combien en donner ?**
Les besoins varient selon l’âge, le poids et les pertes. Proposez-le souvent, selon sa soif, et demandez au médecin ou au pharmacien de vous guider.

**Faut-il une ordonnance ?**
Les SRO s’achètent en pharmacie ; ils sont remboursés sur prescription pour les jeunes enfants atteints de diarrhée aiguë.

## Quand demander conseil
Consultez si un nourrisson a plusieurs selles liquides en quelques heures. Consultez **sans délai** ou rendez-vous aux urgences en cas de vomissements répétés avec refus de boire, de sang ou de glaires dans les selles, de fièvre élevée, ou de signes de déshydratation : bébé anormalement agité ou au contraire mou et somnolent, difficile à réveiller, gémissant, teint pâle, yeux cernés, respiration rapide, perte de poids. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ consulter : qui, quand, où
  a({
    slug: 'signes-d-alerte-nourrisson-appeler-le-15',
    title: 'Les signes d’alerte chez le nourrisson : quand appeler le 15',
    summary: 'Respiration, comportement, teint, boissons, fièvre : les signes qui doivent faire appeler le 15 ou consulter en urgence, réunis en un seul endroit.',
    category: 'premiers-secours', safety_critical: true,
    tags: ['urgence', '15', 'SAMU', 'signes d’alerte', 'bébé malade', 'respiration', 'déshydratation', 'taches rouges', 'nourrisson'],
    sources: [S.fievreReflexes, S.fievreSante, S.urgencesParents],
    body_md: `## En bref
- Appelez le **15** (ou le **112**) **immédiatement** si bébé respire difficilement, ne réagit pas, perd connaissance ou convulse.
- Un bébé de **moins de 3 mois** avec **plus de 38 °C** doit être vu **le jour même**, en urgence.
- Un bébé **mou, très somnolent, geignard, très pâle ou marbré**, qui **refuse de boire**, doit être vu sans attendre.
- Des **petites taches rouges ou violacées qui ne s’effacent pas** quand on appuie dessus imposent un appel au 15.

## Comprendre
Les tout-petits ne savent pas dire qu’ils vont mal, et leur état peut évoluer vite. Les professionnels s’appuient donc sur des signes observables. L’ARS Pays de la Loire propose une grille simple pour les parents : bébé **boit-il, mange-t-il, réagit-il, sourit-il, communique-t-il** ? Si oui, c’est rassurant. Sinon, il faut demander un avis médical.

Le 15 n’est pas réservé aux situations dramatiques : c’est aussi le numéro à composer **en cas de doute sur la gravité**. Un médecin régulateur vous écoute, évalue la situation et vous oriente (conseil, médecin de garde, urgences, envoi d’une équipe).

## Au quotidien
**Appeler le 15 immédiatement**
- Respiration difficile : très rapide, avec des pauses, des côtes qui se creusent, un bruit inhabituel, des lèvres ou une peau bleutées.
- Bébé inconscient, qui ne réagit pas, ou très difficile à réveiller.
- Convulsions (secousses, regard fixe), surtout avant 1 an.
- Petites taches rouges ou violacées qui ne disparaissent pas à la pression, surtout avec de la fièvre.
- Pleurs inconsolables, ou au contraire cris très faibles, bébé « absent ».

**Consulter en urgence (après avis du 15 si vous hésitez)**
- Fièvre au-delà de 38 °C avant 3 mois ; fièvre supérieure à 40 °C à tout âge.
- État général qui se dégrade : **somnolence**, **refus de boire**, **cris faibles**, **peau marbrée**, baisse marquée du tonus (bébé « tout mou »).
- Signes de **déshydratation**, surtout avec vomissements et diarrhée : comportement inhabituel, fatigue anormale, difficulté à le réveiller, gémissements, pâleur, cernes, respiration accélérée.
- Douleurs du ventre ou diarrhée abondante.
- Raideur de la nuque, vomissements, ou bébé qui gémit à la moindre manipulation.
- Bébé atteint d’une **maladie chronique** qui présente de la fièvre ou des symptômes inhabituels.

**Préparer l’appel**
Restez près de bébé, téléphone en haut-parleur. Indiquez son âge, son poids si vous le connaissez, ce que vous observez, depuis quand, la température et l’heure de mesure, les médicaments déjà donnés. Gardez le carnet de santé à portée de main. Ne raccrochez pas avant qu’on vous le dise.

## Questions fréquentes
**J’ai peur de déranger le 15 pour rien.**
En cas de doute sur la gravité, le 15 est justement le bon numéro. C’est le médecin régulateur qui évalue la situation ; vous n’avez pas à le faire seul·e.

**Faut-il aller directement aux urgences ?**
Les autorités sanitaires recommandent d’appeler le 15 avant de se déplacer, sauf urgence vitale évidente. Le régulateur vous orientera vers le lieu le plus adapté.

**Le chiffre du thermomètre suffit-il pour juger de la gravité ?**
Non. La hauteur de la fièvre ne dit pas tout : un bébé qui boit, réagit et sourit par moments est rassurant, alors qu’un bébé abattu, geignard ou très pâle doit être vu, même avec une fièvre modérée. Seule exception : avant 3 mois, toute fièvre impose une consultation le jour même.

**Je suis sourd·e ou malentendant·e : comment joindre les secours ?**
Le **114** est accessible jour et nuit par SMS, tchat ou visio, et transmet votre demande au SAMU.

## Quand demander conseil
Pour un symptôme qui vous inquiète sans signe d’alerte, contactez votre médecin traitant ou le médecin de garde. Pour tout signe listé ci-dessus, n’attendez pas. ${URG} ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'bebe-malade-qui-appeler',
    title: 'Bébé est malade : qui appeler, et dans quel ordre ?',
    summary: 'Médecin traitant, pédiatre, pharmacien, PMI, médecin de garde, 15 : à qui s’adresser selon la situation et l’heure de la journée.',
    category: 'sante-bebe', journeys: ['newborn', 'child'], max_age_months: 72,
    tags: ['qui appeler', 'médecin traitant', 'pédiatre', 'pharmacien', 'PMI', 'médecin de garde', '15', 'bébé malade'],
    sources: [S.urgencesParents, S.bebeSante, S.pmi],
    body_md: `## En bref
- En journée, le premier interlocuteur est le **médecin qui suit bébé** (médecin traitant ou pédiatre).
- Sans médecin disponible, cherchez une **maison ou un centre de santé** proche, ou un lieu de soins sur **sante.fr**.
- Le soir, la nuit et le week-end, contactez le **médecin de garde** (numéro selon votre région, souvent le 116 117).
- Pour une urgence ou en cas de doute sur la gravité : le **15**, à toute heure.

## Comprendre
Face à un bébé malade, il est difficile de savoir s’il faut consulter tout de suite, demain, ou simplement surveiller. Les services d’urgences rappellent que les véritables urgences sont rares chez l’enfant et qu’une consultation suffit souvent à poser un diagnostic. S’y rendre sans nécessité expose aussi bébé aux microbes des autres patients. À l’inverse, certains signes ne doivent jamais attendre.

L’ARS Pays de la Loire résume la démarche : regardez si votre enfant **mange, boit, joue, sourit et communique**. Si ce n’est pas le cas, appelez son médecin. Et ne vous déplacez pas aux urgences sans avoir pris un avis médical, en appelant le 15.

## Au quotidien
**Selon la situation**
- **Une question simple** (érythème du siège, petit rhume sans gêne, conservation d’un médicament) : le **pharmacien**, la **sage-femme** qui vous suit après la naissance, ou la **PMI**, qui accueille gratuitement les enfants de moins de 6 ans et leurs parents.
- **Un symptôme qui dure ou qui vous inquiète, sans signe d’alerte** : le médecin traitant ou le pédiatre, dans la journée. Précisez en appelant qu’il s’agit d’un bébé malade et son âge.
- **Le médecin est indisponible** : une maison ou un centre de santé, un autre cabinet, éventuellement une téléconsultation si le médecin la juge adaptée.
- **Le soir, la nuit, le week-end** : le numéro de garde de votre région (souvent le 116 117) ou le 15.
- **Signe de gravité ou doute** : le 15, ou le 112.

**Préparer l’échange**
- Âge et poids récent de bébé (dans le carnet de santé).
- Les symptômes, depuis quand, leur évolution.
- La température, mesurée de façon fiable, avec l’heure et la méthode.
- Ce qu’il boit, le nombre de couches mouillées, ses selles, son sommeil.
- Les médicaments déjà donnés : nom, heure, quantité.
- Ses antécédents : prématurité, maladie connue, allergies.

**S’organiser à l’avance**
- Déclarez un **médecin traitant** pour votre enfant.
- Enregistrez dans votre téléphone et affichez près du réfrigérateur : médecin, pharmacie, numéro de garde, 15, 112, 114, centre antipoison.
- Notez ces numéros pour la personne qui garde bébé, avec le carnet de santé à portée.

## Questions fréquentes
**Le pharmacien peut-il examiner bébé ?**
Il ne remplace pas le médecin, mais il peut vous conseiller, vous expliquer un traitement et vous orienter vers une consultation si nécessaire. Précisez toujours l’âge et le poids de bébé.

**Je n’ai pas de médecin traitant pour mon enfant : que faire ?**
L’ARS Pays de la Loire conseille, sans médecin traitant, de contacter la maison ou le centre de santé le plus proche. Pour le suivi et les vaccinations, la PMI accueille gratuitement les enfants de moins de 6 ans. Vous pouvez aussi chercher un lieu de soins sur Santé.fr.

**Puis-je appeler la maternité ?**
Dans les premiers jours, la maternité ou la sage-femme qui vous suit à domicile peuvent répondre à certaines questions. Pour un bébé malade, l’avis d’un médecin reste nécessaire.

**Et si je ne sais vraiment pas à qui m’adresser ?**
Appelez le 15 : le médecin régulateur vous orientera.

## Quand demander conseil
Appelez le **15** sans attendre en cas de difficultés respiratoires, de bébé inconscient ou qui ne réagit pas, de convulsions, ou de fièvre chez un bébé de moins de 3 mois. ${URG}

${FIN}`,
  }),
  a({
    slug: 'medecin-et-pharmacie-de-garde-soir-week-end',
    title: 'Médecin et pharmacie de garde : comment faire le soir et le week-end ?',
    summary: 'Horaires de la permanence des soins, numéro du médecin de garde, maisons médicales de garde et pharmacie de garde : le mode d’emploi.',
    category: 'sante-bebe', journeys: ['newborn', 'child'], max_age_months: 72,
    tags: ['médecin de garde', '116 117', 'pharmacie de garde', '3237', 'week-end', 'nuit', 'jour férié', 'maison médicale de garde'],
    sources: [S.permanence, S.numerosUtiles, S.pharmaGarde],
    body_md: `## En bref
- La **permanence des soins** fonctionne en général **de 20 h à 8 h**, le **samedi à partir de midi**, le **dimanche** et les **jours fériés**.
- Pour joindre un **médecin de garde**, composez le numéro de votre région : le **116 117** dans de nombreuses régions, parfois un numéro départemental. À défaut, le **15** vous oriente.
- Pour une **pharmacie de garde** : le **3237** (service payant) ou le site **3237.fr**.
- En cas d’urgence ou de doute sur la gravité : le **15**, toujours.

## Comprendre
Quand le cabinet de votre médecin est fermé, l’Agence régionale de santé (ARS) organise une permanence des soins ambulatoires : des médecins se relaient, par secteur, pour répondre aux besoins qui ne peuvent pas attendre le lendemain sans relever des urgences hospitalières. Le numéro d’accès varie selon les territoires : le 116 117 a été déployé progressivement par région ; ailleurs, un numéro de garde départemental ou le 15 joue ce rôle. Santé.fr publie par région les numéros utiles.

Dans certaines villes, des **maisons médicales de garde** accueillent les patients le soir et le week-end. Les consultations de garde peuvent être facturées plus cher qu’une consultation habituelle.

Les **pharmacies de garde** sont organisées par la profession sous l’autorité de la préfecture. Selon Santé.fr, le service RésoGardes est joignable au **3237** (0,35 € TTC/min) et en ligne sur 3237.fr. Un forfait supplémentaire peut être appliqué selon l’heure lorsque vous présentez une ordonnance.

## Au quotidien
**Avant d’en avoir besoin**
- Cherchez dès maintenant le **numéro de garde de votre département** sur le site de votre ARS ou sur Santé.fr, et enregistrez-le.
- Repérez la maison médicale de garde la plus proche, s’il y en a une, et ses horaires.
- Gardez un thermomètre, du sérum physiologique et des sachets de réhydratation à la maison pour ne pas devoir courir à la pharmacie la nuit.

**Au moment de l’appel**
- Ayez sous les yeux le carnet de santé, la température (avec l’heure et la méthode), les médicaments déjà donnés et la liste des symptômes.
- Le professionnel vous pose des questions, puis vous donne un conseil, vous propose une consultation (cabinet de garde, maison médicale de garde, parfois visite) ou vous oriente vers le 15.

**Pour la pharmacie**
- Vérifiez la pharmacie de garde avant de partir (3237 ou 3237.fr) ; si vous ne trouvez pas, le 15 peut vous indiquer la marche à suivre.
- Emportez l’ordonnance, la carte Vitale et, si possible, l’attestation de droits où figure bébé.

## Questions fréquentes
**Le 116 117 et le 15, quelle différence ?**
Le numéro de médecin de garde sert pour un problème de santé qui ne peut pas attendre la réouverture du cabinet. Le 15 est le numéro de l’urgence médicale, joignable 24 h/24 : appelez-le si vous pensez que la situation est grave ou si vous hésitez.

**Le 116 117 ne fonctionne pas dans ma région : que faire ?**
Composez le numéro de garde indiqué par votre ARS, ou le 15, qui vous orientera vers le médecin de garde.

**Puis-je appeler SOS Médecins ?**
Là où il existe, SOS Médecins fait partie des solutions de consultation non programmée ; Santé.fr cite son numéro national, le 3624 (payant). Il ne remplace pas le 15 pour une urgence.

**Peut-on aller aux urgences pour avoir un médicament le dimanche ?**
Les urgences sont faites pour les soins qui ne peuvent pas attendre. Pour un médicament, contactez la pharmacie de garde ; pour un avis, le médecin de garde.

## Quand demander conseil
Pour un bébé de moins de 3 mois qui a de la fièvre, des difficultés à respirer, un comportement inhabituel ou des signes de déshydratation, ne cherchez pas un rendez-vous : appelez le 15. ${URG}

${FIN}`,
  }),
  a({
    slug: 'urgences-pediatriques-comment-ca-se-passe',
    title: 'Aller aux urgences avec bébé : quand, comment, et quoi emporter',
    summary: 'Les situations qui relèvent vraiment des urgences, l’intérêt d’appeler le 15 avant de partir, et comment préparer le passage à l’hôpital.',
    category: 'sante-bebe', safety_critical: true, journeys: ['newborn', 'child'], max_age_months: 72,
    tags: ['urgences pédiatriques', 'urgences', 'hôpital', '15', 'attente', 'carnet de santé', 'bébé malade', 'quoi emporter'],
    sources: [S.urgencesParents, S.permanence, S.fievreMedicaments],
    body_md: `## En bref
- **Appelez le 15 avant de vous déplacer**, sauf urgence vitale évidente : le médecin régulateur vous oriente vers le bon lieu.
- Relèvent des urgences, notamment : la **fièvre avant 3 mois**, les **signes de déshydratation**, une **gêne respiratoire**, des **convulsions**, un bébé qui **ne réagit pas**.
- Emportez le **carnet de santé**, la carte Vitale, les ordonnances et la **liste des médicaments donnés** avec les heures.
- L’ordre de passage dépend de la **gravité**, pas de l’heure d’arrivée.

## Comprendre
Les urgences hospitalières sont destinées aux soins qui ne peuvent pas être programmés et qui risquent de laisser des séquelles s’ils ne sont pas réalisés rapidement. L’ARS Pays de la Loire rappelle que beaucoup de situations de l’enfant relèvent plutôt de la médecine de ville : fièvre chez un enfant de plus de 3 mois en bon état général, vomissements ou diarrhée sans déshydratation, toux sans gêne respiratoire, éruption sans fièvre. Dans ces cas, une consultation chez le médecin traitant ou le médecin de garde est souvent plus rapide et évite à bébé d’attraper d’autres microbes.

D’autres situations, en revanche, justifient un passage rapide après appel au 15 : fièvre de plus de 38 °C avant 3 mois ; vomissements et diarrhée avec signes de déshydratation (comportement inhabituel, fatigue anormale, difficulté à le réveiller, gémissements, pâleur, cernes, respiration accélérée). Et le 15 doit être appelé **immédiatement** en cas de difficultés respiratoires, d’enfant inconscient ou de convulsions.

## Au quotidien
**Avant de partir**
- Appelez le 15 : on vous dira s’il faut venir, où, et comment (par vos propres moyens ou avec une équipe).
- Ne donnez ni à manger ni à boire à bébé s’il est très somnolent ou si on vous le demande.
- Ne conduisez pas seul·e avec un bébé dont l’état vous inquiète beaucoup : demandez de l’aide ou suivez les consignes du 15.

**Le sac à préparer**
- Le **carnet de santé**, qui rassemble ses antécédents, ses vaccins et son poids récent.
- La carte Vitale (ou l’attestation où figure bébé) et la carte de mutuelle.
- Les ordonnances en cours et les **boîtes des médicaments** donnés, avec **l’heure et la quantité** de chaque prise : l’Assurance Maladie conseille d’indiquer au médecin le médicament, la dose et la fréquence.
- Votre relevé de températures.
- Couches, change, doudou, tétine si bébé en a une, de quoi le nourrir, un vêtement de rechange pour lui et pour vous, un chargeur de téléphone.

**Sur place**
- Un professionnel évalue d’abord la gravité ; les situations les plus graves passent en priorité. L’attente peut être longue si l’état de bébé est jugé stable.
- Si l’état de bébé change pendant l’attente (respiration, teint, comportement, vomissements), prévenez immédiatement l’équipe.
- Notez les consignes de sortie, les signes qui doivent faire revenir et le suivi prévu.

## Questions fréquentes
**Faut-il aller dans des urgences pédiatriques plutôt que générales ?**
Le 15 peut vous indiquer le service adapté le plus proche. Ne perdez pas de temps à chercher par vous-même en cas d’urgence.

**On me conseille d’attendre le lendemain : est-ce raisonnable ?**
Si le médecin régulateur l’estime possible, il vous dira aussi ce qui doit vous faire rappeler. Surveillez ces signes et rappelez sans hésiter s’ils apparaissent.

**Les deux parents peuvent-ils rester ?**
Les règles varient selon les hôpitaux et l’affluence. Renseignez-vous auprès de l’accueil.

**Que faire en rentrant ?**
Suivez les consignes écrites, prenez rendez-vous avec le médecin qui suit bébé si on vous l’a demandé, et rapportez le compte rendu dans le carnet de santé.

## Quand demander conseil
En cas de doute sur la gravité, le 15 est le bon réflexe, de jour comme de nuit. ${URG} ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'teleconsultation-pour-bebe',
    title: 'La téléconsultation pour un bébé : dans quels cas, et comment bien la préparer',
    summary: 'Ce que permet une consultation vidéo pour un tout-petit, ses limites, son remboursement et les gestes pour qu’elle soit utile.',
    category: 'sante-bebe', journeys: ['newborn', 'child'], max_age_months: 72,
    tags: ['téléconsultation', 'consultation vidéo', 'médecin en ligne', 'pédiatre', 'remboursement', 'ordonnance', 'bébé malade', 'parcours de soins'],
    sources: [S.teleconsultation, S.fievreMpedia, S.suivi2mois],
    body_md: `## En bref
- La téléconsultation est une **consultation en vidéo** avec un médecin ; c’est **lui qui juge** si elle convient ou si bébé doit être examiné en présentiel.
- Pour un enfant de **moins de 16 ans**, elle n’impose pas de passer d’abord par le médecin traitant ; la pédiatrie fait partie des spécialités en **accès direct**.
- Elle est remboursée **comme une consultation classique**, si les conditions de l’Assurance Maladie sont respectées.
- Elle ne remplace pas les **examens de suivi** ni l’examen d’un bébé de **moins de 3 mois fiévreux**, qui doit être vu en personne le jour même.

## Comprendre
L’Assurance Maladie encadre la téléconsultation : elle se fait en **visio** (son et image), depuis le domicile ou depuis un lieu équipé (maison de santé, pharmacie…). Le médecin envoie un lien sécurisé, recueille votre consentement, puis rédige un compte rendu, versé dans le dossier et, sauf opposition, dans Mon espace santé. Si nécessaire, il établit une ordonnance, envoyée de façon sécurisée. Le suivi doit **alterner** téléconsultations et consultations en présentiel.

Pour les tout-petits, l’examen clinique compte beaucoup : peser, mesurer, ausculter, regarder les tympans. C’est pourquoi les **examens de suivi** obligatoires se font au cabinet, en centre de santé ou en PMI. La téléconsultation est surtout utile pour un **avis rapide**, une question sur un traitement en cours ou un suivi convenu avec le médecin.

## Au quotidien
**Quand elle peut aider**
- Une question sur l’évolution d’un rhume, d’une éruption visible, d’un traitement déjà prescrit.
- Un avis quand votre médecin habituel est absent, en attendant de le revoir.
- Un échange avec le médecin qui connaît déjà bébé, s’il le propose.

**Quand elle ne suffit pas**
- **Bébé de moins de 3 mois avec plus de 38 °C** : consultation le jour même, en personne, voire aux urgences.
- Gêne respiratoire, bébé mou ou difficile à réveiller, signes de déshydratation, convulsions : appelez le **15**.
- Douleur qui nécessite d’examiner les oreilles, le ventre, ou bébé qui ne va pas bien sans que vous sachiez dire pourquoi.

**La préparer**
- Choisissez une pièce **bien éclairée**, au calme, et vérifiez la connexion et le son.
- Ayez sous la main le **carnet de santé** (poids récent, vaccins, antécédents), le **thermomètre** et votre relevé de températures (heures et méthode).
- Notez les symptômes, depuis quand, ce que bébé boit, ses couches, les médicaments déjà donnés.
- Prévoyez de pouvoir **montrer** bébé : une éruption, sa respiration torse nu, son comportement. Un second adulte pour tenir la caméra aide beaucoup.

**Après**
- Relisez le compte rendu et l’ordonnance, et demandez ce qui doit vous faire reconsulter.
- Si la situation évolue, n’hésitez pas à demander une consultation en présentiel.

## Questions fréquentes
**Est-elle remboursée pour un enfant ?**
Oui, dans les mêmes conditions qu’une consultation en cabinet, en général à 70 % par l’Assurance Maladie, le reste pouvant être pris en charge par la mutuelle. Un médecin en secteur 2 peut pratiquer un dépassement d’honoraires.

**Faut-il passer par le médecin traitant ?**
Les moins de 16 ans sont dispensés de la règle du parcours de soins, de même que la pédiatrie. En pratique, consulter le médecin qui connaît bébé reste un atout.

**Une ordonnance peut-elle être obtenue par simple questionnaire ?**
Non : l’Assurance Maladie précise qu’une ordonnance ne peut pas être délivrée uniquement sur un questionnaire ou une messagerie ; un échange direct, en vidéo ou par téléphone, est nécessaire.

**Toutes les plateformes se valent-elles ?**
Seules certaines téléconsultations sont remboursables (médecins respectant les règles de proximité, ou salariés de sociétés agréées par le ministère). Renseignez-vous avant.

## Quand demander conseil
Si l’état de bébé vous inquiète pendant ou après la téléconsultation, demandez à être vu rapidement. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ carnet et examens obligatoires
  a({
    slug: 'carnet-de-sante-bebe-mode-d-emploi',
    title: 'Le carnet de santé de bébé : mode d’emploi',
    summary: 'Ce que contient le carnet de santé, qui peut le consulter, pourquoi l’emporter partout, et comment l’utiliser avec Mon espace santé.',
    category: 'sante-bebe', journeys: ['pregnant', 'newborn', 'child'], max_age_months: 72,
    tags: ['carnet de santé', 'confidentiel', 'courbes de croissance', 'vaccins', 'secret médical', 'Mon espace santé', 'crèche', 'certificat de santé'],
    sources: [S.carnet, S.suivi20, S.bebeSante],
    body_md: `## En bref
- Le carnet de santé est **gratuit**, remis en général **à la maternité**, et suit l’enfant **tout au long de son enfance**.
- Il est **confidentiel** : les informations sont couvertes par le **secret médical**, et personne ne peut exiger de le voir sans votre accord.
- Emportez-le à **chaque consultation**, vaccination, examen de suivi et hospitalisation.
- Une **nouvelle version** est en vigueur depuis le **1er janvier 2025**, avec davantage de repères de prévention.

## Comprendre
Selon Santé.fr, le carnet de santé regroupe les événements de santé de l’enfant depuis sa naissance : les professionnels qui assurent la prévention et les soins y notent, avec l’accord des parents, les examens, les vaccinations, les mesures de croissance, les hospitalisations. La maternité y inscrit les informations sur la naissance et les premiers jours (poids, taille, score d’Apgar, résultats des premiers dépistages).

Le carnet contient aussi des **pages de conseils** : alimentation, sommeil, écrans, éducation sans violence, repérage des troubles du neurodéveloppement. Pendant la première année, il aborde la prévention des risques liés au couchage, de la mort inattendue du nourrisson et du syndrome du bébé secoué, ainsi que le risque de dépression du post-partum. Des questions sur les écrans figurent dès 3 mois, et sur l’activité physique dès 2 ans.

Les **certificats de santé** établis lors de certains examens (dans les 8 premiers jours, vers 8–9 mois et vers 24 mois) sont associés au carnet et transmis à la PMI.

## Au quotidien
**Le garder à portée**
- Rangez-le avec la pochette des papiers de bébé, et emportez-le dans le sac à langer les jours de rendez-vous.
- En vacances ou chez les grands-parents, prenez-le avec vous.
- Glissez-y une fiche avec vos coordonnées, le médecin traitant et les allergies connues.

**L’utiliser comme un outil**
- Consultez les **courbes de croissance** avec le médecin : le poids, la taille et le périmètre crânien y sont reportés à chaque examen.
- Notez-y vos questions avant les rendez-vous.
- Vérifiez le **calendrier des vaccins** et les dates des prochains examens de suivi.
- Lisez les pages de conseils correspondant à l’âge de votre enfant : elles sont pensées pour vous.

**Le partager avec discernement**
- Les professionnels de santé le consultent avec votre accord.
- Pour la crèche, l’assistante maternelle ou l’école, demandez ce dont la structure a besoin (souvent la preuve des vaccinations) plutôt que de confier tout le carnet.

**Le compléter avec Mon espace santé**
L’Assurance Maladie explique que le parent rattaché à l’enfant peut **activer son profil** sur monespacesante.fr avec un code provisoire. La gestion du profil peut être **partagée** avec l’autre parent dans les paramètres. Les comptes rendus de consultation peuvent y être versés. Le carnet papier reste utile en complément.

## Questions fréquentes
**La crèche, l’école ou un club peuvent-ils exiger le carnet ?**
Le carnet est confidentiel ; personne ne peut exiger de le consulter sans votre consentement. Si une preuve de vaccination est demandée, parlez-en avec le médecin.

**J’ai perdu le carnet : que faire ?**
Prévenez le médecin qui suit votre enfant et la PMI de votre département : ils vous indiqueront comment obtenir un nouveau carnet et reconstituer les informations essentielles, notamment les vaccinations.

**Les deux parents peuvent-ils y écrire ?**
Le carnet est rempli par les professionnels. Vous pouvez y noter vos observations et vos questions dans les espaces prévus.

**Mon enfant a un carnet d’avant 2025 : où trouver les nouveaux conseils ?**
Santé.fr indique que le carnet en vigueur depuis le 1er janvier 2025 peut être téléchargé en PDF : vous pouvez y lire les pages de conseils. Pour toute question sur le carnet de votre enfant, demandez au médecin ou à la PMI.

## Quand demander conseil
Si vous ne comprenez pas une mention, une courbe ou un calendrier, demandez au médecin ou à la puéricultrice de PMI de vous l’expliquer. ${URG}

${FIN}`,
  }),
  a({
    slug: 'examen-du-8e-jour-et-premier-certificat',
    title: 'L’examen des 8 premiers jours et le premier certificat de santé',
    summary: 'Ce que vérifie le médecin dans les 8 jours qui suivent la naissance, à quoi sert le certificat de santé, et comment préparer ce rendez-vous.',
    category: 'sante-bebe', max_age_months: 1, journeys: ['pregnant', 'newborn'],
    tags: ['examen du 8e jour', 'certificat de santé', 'nouveau-né', 'hanches', 'examens obligatoires', 'PMI', 'maternité', 'pédiatre'],
    sources: [S.examen8j, S.maternite, S.bebeSante],
    body_md: `## En bref
- Un **examen approfondi** du nouveau-né est réalisé par un médecin **dans les 8 jours** qui suivent la naissance ; il fait partie des examens obligatoires.
- Le médecin remplit le **premier certificat de santé**, transmis à la **PMI**, et note les résultats dans le **carnet de santé**.
- L’examen est **pris en charge à 100 %**, sans avance de frais (hors éventuels dépassements d’honoraires).
- C’est aussi un moment pour **poser vos questions** et signaler les antécédents familiaux.

## Comprendre
Le nouveau-né est examiné dès la naissance, puis de nouveau avant la sortie de maternité. L’Assurance Maladie précise que l’examen des 8 premiers jours vise à repérer d’éventuelles anomalies passées inaperçues. Il est souvent réalisé par le pédiatre de la maternité ; si vous êtes rentrés très tôt, renseignez-vous pour savoir qui le fait.

**Ce que vérifie le médecin**
- Les **mesures** : poids, taille, périmètre crânien, fréquences cardiaque et respiratoire, puis un examen complet du corps.
- Les **hanches**, par une manœuvre douce, complétée si besoin d’une échographie, pour dépister une luxation.
- Les **yeux** : taille, pupilles, transparence de la cornée.
- Le **dépistage biologique** (quelques gouttes de sang, le plus souvent au talon, dans les premiers jours) et le **repérage de la surdité** proposé avant la sortie : le médecin vérifie qu’ils ont été faits.

**Le certificat de santé**
Le premier certificat est envoyé à la protection maternelle et infantile (PMI) de votre département. Ses données sont **anonymisées** et servent à des études statistiques sur la santé des enfants en France.

## Au quotidien
**Préparer le rendez-vous**
- Notez vos questions à l’avance : alimentation, sommeil, pleurs, soins du cordon, selles.
- Rassemblez les **antécédents familiaux** à signaler : maladies héréditaires, malformations, allergies, surpoids, hypertension, diabète.
- Apportez le carnet de santé et, si vous en avez, les comptes rendus de la maternité.

**Les sujets abordés**
L’Assurance Maladie cite l’alimentation, le sommeil et la façon de **coucher bébé** (sur le dos, dans son lit), ainsi que le **tabac** : la fumée est dangereuse pour le bébé et augmente le risque de problèmes respiratoires. C’est le bon moment pour en parler sans crainte, et demander de l’aide pour arrêter.

**Choisir un médecin traitant**
Les parents sont invités à choisir un médecin traitant pour leur enfant : généraliste, pédiatre ou autre médecin qui le suit. La déclaration se fait en ligne par le médecin, avec la carte Vitale.

**Limiter les infections dès les premiers jours**
Lavez-vous les mains avant et après vous être occupé de bébé, évitez les baisers sur son visage et ses mains, limitez les lieux très fréquentés, surtout en période d’épidémie.

## Questions fréquentes
**Cet examen est-il obligatoire ?**
Oui, il fait partie des 20 examens de suivi prévus de la naissance à 16 ans.

**Le certificat de santé est-il communiqué à quelqu’un d’autre ?**
Il est transmis au service de PMI ; les données utilisées pour les statistiques sont anonymisées.

**Et si le médecin trouve quelque chose ?**
Il vous expliquera ce qu’il a observé et les examens éventuels. Un traitement de la hanche, par exemple, peut durer plusieurs semaines à plusieurs mois, et se met en place tôt.

**Qui peut faire l’examen après la sortie ?**
Un médecin généraliste ou un pédiatre, en ville ou en centre de santé, ou un médecin de PMI.

## Quand demander conseil
L’Assurance Maladie conseille de consulter rapidement si bébé a de la **fièvre**, des **difficultés respiratoires**, un **comportement inhabituel**, une **diarrhée** (surtout avec vomissements), ou si son **teint reste jaune** ou ses **selles sont décolorées** après deux semaines. Ne donnez pas de médicament sans avis médical. ${URG}

${FIN}`,
  }),
  a({
    slug: 'examens-de-la-2e-semaine-au-2e-mois',
    title: 'Les examens de la 2e semaine, du 1er et du 2e mois',
    summary: 'Ce qui se passe lors des premiers rendez-vous de suivi de bébé, les premiers vaccins à 2 mois, et comment profiter au mieux de ces consultations.',
    category: 'sante-bebe', max_age_months: 3,
    tags: ['examen 1 mois', 'examen 2 mois', 'deuxième semaine', 'examens obligatoires', 'premiers vaccins', 'croissance', 'périmètre crânien', 'pédiatre'],
    sources: [S.suivi2mois, S.bebeSante, S.suivi3a18],
    body_md: `## En bref
- Après l’examen des 8 premiers jours viennent les examens de la **2e semaine**, du **1er mois** et du **2e mois**.
- Ils suivent la **croissance** (poids, taille, périmètre crânien), la **vue** et l’**audition**, et le bien-être de bébé **et de ses parents**.
- Les **premiers vaccins obligatoires** commencent **à 2 mois**.
- Ces examens sont **pris en charge à 100 %** par l’Assurance Maladie, sans avance de frais.

## Comprendre
Les premières semaines sont une période de changements rapides. L’Assurance Maladie décrit le contenu de ces consultations :
- **Les mesures** de poids, taille et périmètre crânien, reportées sur les courbes du carnet de santé. Le périmètre crânien, suivi dès la naissance, permet de repérer une croissance de la tête trop lente ou trop rapide, dont on recherche alors la cause.
- **Un examen général détaillé.**
- **Les yeux** : mouvements des yeux, recherche d’un strabisme.
- **L’audition** : examen des tympans, test éventuel. Si le dépistage de la maternité n’a pas pu évaluer l’audition ou paraît anormal, des examens sont faits avant la fin du 3e mois.

À **2 mois**, les vaccinations obligatoires débutent : diphtérie, tétanos, coqueluche, poliomyélite, infections à *Haemophilus influenzae* b, hépatite B et pneumocoque. D’autres vaccins peuvent être recommandés selon la situation de l’enfant, comme celui contre la tuberculose.

Le médecin s’intéresse aussi à **ce que vous vivez** : difficultés à comprendre les besoins de bébé, pleurs difficiles à gérer, fatigue. Ces consultations sont faites pour en parler.

## Au quotidien
**Préparer chaque rendez-vous**
- Notez dans les jours qui précèdent ce que vous observez : tétées ou biberons, sommeil, pleurs, selles, éveil.
- Préparez vos questions, même celles qui vous paraissent petites.
- Apportez le carnet de santé, toujours.

**Les sujets de conseil**
L’Assurance Maladie cite la communication avec bébé, son installation pendant l’éveil (au sol, sur un plan ferme, sur le ventre sous surveillance), l’alimentation, le sommeil, le coucher et le bain. Le médecin peut aussi vous parler des pleurs : jamais secouer un bébé ; en cas d’exaspération, le coucher sur le dos dans son lit, quitter la pièce et demander de l’aide.

**Le jour des vaccins**
- Habillez bébé avec des vêtements faciles à retirer au niveau des cuisses.
- Prévoyez de le prendre dans vos bras pour le réconforter après l’injection.
- Demandez quelles réactions peuvent suivre et ce qui doit vous faire rappeler.

**Où faire ces examens**
Chez un médecin généraliste ou un pédiatre, en cabinet ou en centre de santé, ou à la **PMI**, gratuitement, jusqu’à 6 ans.

## Questions fréquentes
**Bébé n’a pas pris beaucoup de poids : faut-il s’inquiéter ?**
Le médecin interprète le poids sur la courbe, avec l’ensemble de l’examen. Si vous avez un doute entre deux rendez-vous, contactez-le, ou la sage-femme ou la PMI, qui peuvent peser bébé.

**Peut-on décaler les vaccins ?**
Le calendrier vise à protéger bébé au moment où il est le plus vulnérable. Parlez de vos questions avec le médecin plutôt que de reporter de vous-même.

**L’autre parent peut-il venir ?**
Oui, et c’est souvent précieux : deux paires d’oreilles retiennent mieux les conseils, et chacun peut poser ses questions.

**Et si j’ai du mal à créer un lien avec bébé ?**
Dites-le au médecin : c’est l’une des choses qu’il souhaite savoir pour vous accompagner.

## Quand demander conseil
Entre deux examens, consultez si bébé a de la fièvre, respire difficilement, boit mal, a un comportement inhabituel, ou si son teint reste jaune après deux semaines. ${URG} ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'examens-de-suivi-de-3-mois-a-2-ans',
    title: 'Les examens de suivi de 3 mois à 2 ans : le calendrier expliqué',
    summary: 'À quels âges sont prévus les examens de suivi de bébé jusqu’à 2 ans, lesquels donnent lieu à un certificat de santé, et ce qui y est vérifié.',
    category: 'sante-bebe', min_age_months: 3, max_age_months: 36, journeys: ['newborn', 'child'],
    tags: ['examens obligatoires', 'calendrier', 'examen 9 mois', 'examen 24 mois', 'certificat de santé', 'développement', 'vaccins', 'suivi bébé'],
    sources: [S.suivi3a18, S.suivi23m3a, S.surdite],
    body_md: `## En bref
- Entre 3 mois et 18 mois, sept examens sont prévus : **3, 4, 5, 8, 11, 12 mois**, puis **entre 16 et 18 mois**.
- L’examen du **8e mois** donne lieu au **2e certificat de santé** obligatoire ; celui de **23–24 mois**, au **3e**.
- Ils suivent la **croissance**, la **vue**, l’**audition**, le **développement** et le **calendrier des vaccins**.
- Tous sont **pris en charge à 100 %**, sans avance de frais (hors dépassements d’honoraires).

## Comprendre
L’Assurance Maladie détaille le contenu type de ces examens :
- **Croissance** : poids, taille, périmètre crânien, reportés sur les courbes. Une cassure ou une accélération de courbe peut amener à chercher une cause.
- **Problèmes fréquents** à cet âge : reflux, hernie inguinale, testicule non descendu, phimosis, bronchiolite, eczéma atopique, infections virales à répétition.
- **Vue** : paupières, pupilles, mouvements des yeux, strabisme, capacité à suivre du regard.
- **Audition** : tympans, test éventuel. L’audition est vérifiée notamment à 4, 9 et 24 mois.
- **Développement** : tenue de la tête, position assise, debout, marche, manipulation des objets, sourire, émotions, peur de l’inconnu, premiers sons puis premiers mots.
- **Vaccinations** : rappels des premiers vaccins et vaccins contre le méningocoque, la rougeole, les oreillons et la rubéole.

L’examen de **23–24 mois** s’intéresse en plus au **langage** (association de deux mots vers 2 ans, compréhension de consignes simples), à la **motricité** et à l’autonomie, au comportement avec les autres enfants et au sommeil.

## Au quotidien
**Les sujets de prévention**
Ces consultations sont l’occasion d’aborder, selon l’âge : la diversification alimentaire, le sommeil et le couchage, le bain, l’hygiène des dents (nettoyer les dents le soir, éviter le biberon au coucher), les **écrans** (aucun avant 3 ans, pas de télévision allumée dans la pièce), les **accidents domestiques** (produits ménagers et médicaments rangés, petits objets et sacs plastiques hors de portée), le soleil, les sièges auto, le tabac et votre propre fatigue.

**Bien s’y préparer**
- Notez les nouveautés depuis le dernier rendez-vous : ce que bébé fait, ce qui vous questionne.
- Observez son jeu, ses réactions aux bruits et à votre voix, ses premiers mots.
- Apportez le carnet de santé et vérifiez les vaccins prévus.
- N’hésitez pas à parler de ce qui est difficile pour vous.

**Garder le fil**
Notez la date du prochain examen à la fin de chaque consultation. Si vous déménagez ou changez de médecin, le carnet de santé assure la continuité.

## Questions fréquentes
**Pourquoi parle-t-on souvent du « certificat du 9e mois » ?**
L’expression est encore très utilisée. Dans le calendrier présenté par l’Assurance Maladie, le 2e certificat de santé obligatoire est établi lors de l’examen approfondi du **8e mois**. Suivez les dates indiquées par votre médecin et le carnet de santé.

**Mon enfant ne marche pas à 12 mois : faut-il s’inquiéter ?**
Chaque enfant a son rythme. Le médecin évalue l’ensemble du développement lors des examens ; parlez-lui de vos questions.

**Ces examens peuvent-ils se faire à la PMI ?**
Oui, jusqu’à 6 ans, gratuitement, comme chez un médecin généraliste ou un pédiatre.

**Mon enfant semble ne pas réagir quand on l’appelle : que faire ?**
L’Assurance Maladie cite, entre 3 et 12 mois, l’absence de babillage ou de réaction aux sons forts ou à l’appel de son prénom comme des signes qui doivent faire consulter. N’attendez pas le prochain examen.

## Quand demander conseil
En dehors des examens, consultez rapidement si votre enfant a de la fièvre, une diarrhée, du sang dans les selles, des vomissements avec refus de manger, des difficultés respiratoires, s’il pleure beaucoup ou semble très fatigué. ${URG} ${SOUTIEN}

${FIN}`,
  }),
  a({
    slug: 'depistage-neonatal-test-au-talon',
    title: 'Le dépistage néonatal (test au talon) : ce qu’il faut savoir',
    summary: 'Pourquoi on prélève quelques gouttes de sang au talon de bébé, quelles maladies sont recherchées, et comment les résultats sont communiqués.',
    category: 'sante-bebe', max_age_months: 2, journeys: ['pregnant', 'newborn'],
    tags: ['dépistage néonatal', 'test de Guthrie', 'buvard', 'test au talon', 'maternité', 'mucoviscidose', 'maladies rares', 'nouveau-né'],
    sources: [S.cncdn, S.arsDepistage, S.examen8j],
    body_md: `## En bref
- Quelques gouttes de sang sont prélevées **au talon** (ou au dos de la main) de bébé, sur un **papier buvard**, dans les **premiers jours de vie**.
- Le test recherche **16 maladies rares** mais graves, que l’on peut **traiter tôt** ; trois nouvelles ont été ajoutées le **1er septembre 2025**.
- Il est **gratuit**, fortement recommandé, et se fait **avec votre accord**.
- **Pas de nouvelles = bonnes nouvelles** : sans appel dans les 3 à 4 semaines, les résultats sont normaux.

## Comprendre
Le dépistage néonatal est un programme national. Une maladie y est intégrée si elle peut être détectée avant l’apparition de lésions graves et si un traitement efficace existe. Selon le Centre national de coordination du dépistage néonatal (CNCDN), **seize maladies** sont actuellement recherchées, parmi lesquelles la phénylcétonurie, l’hypothyroïdie congénitale, la mucoviscidose et la drépanocytose. Depuis le 1er septembre 2025, s’y ajoutent l’**amyotrophie spinale infantile**, les **déficits immunitaires combinés sévères** et le **déficit en VLCAD**.

Le prélèvement est réalisé par un professionnel, le plus souvent **entre 48 et 72 heures** après la naissance, à la maternité ou, en cas de sortie précoce, à domicile par une sage-femme ou un autre professionnel habilité.

## Au quotidien
**Le jour du prélèvement**
- Le geste est rapide et en général bien toléré, même s’il peut être un peu inconfortable.
- Vous pouvez **tenir bébé dans vos bras**, lui donner **le sein ou un biberon** pendant le prélèvement : cela l’apaise.
- On vous remet une information écrite. Pour certaines maladies qui nécessitent une **analyse génétique** (comme la mucoviscidose), un **consentement écrit spécifique** vous est demandé ; vous pouvez accepter certaines recherches et en refuser d’autres.

**Après**
- Le résultat est inscrit dans le dossier ; vous n’êtes en principe **contactés que si nécessaire**.
- Un appel peut survenir **dès 1 à 2 semaines** : il signifie qu’il faut **refaire le test** (par exemple si le prélèvement était insuffisant) ou faire un **contrôle complémentaire** pour confirmer ou écarter un diagnostic.
- Si une maladie est confirmée, une **prise en charge rapide** est organisée pour limiter les complications.

**Si l’on vous rappelle**
Un rappel ne veut pas dire que bébé est malade : il existe des **faux positifs**, que les examens complémentaires permettent d’écarter. Notez vos questions, demandez qui contacter, et faites-vous accompagner si l’attente est difficile.

## Questions fréquentes
**Le dépistage est-il obligatoire ?**
Non, mais il est **fortement recommandé**. Il est proposé à tous les nouveau-nés et pris en charge par l’Assurance Maladie.

**Peut-il passer à côté d’une maladie ?**
Plus rarement, un test peut ne pas détecter une maladie à ce stade (faux négatif). Si des symptômes vous inquiètent plus tard, parlez-en au médecin, même si le dépistage était normal.

**Que deviennent les données ?**
Le CNCDN indique qu’elles sont hébergées en France, chez un hébergeur agréé pour les données de santé.

**Et si nous sommes sortis de la maternité avant le prélèvement ?**
Le prélèvement peut être fait à domicile par un professionnel habilité, dans les bons délais. Vérifiez avec la maternité ou la sage-femme qu’il est bien programmé.

## Quand demander conseil
Pour toute question, adressez-vous à la maternité, à la sage-femme, au médecin qui suit bébé, ou au centre régional de dépistage néonatal. Si l’attente d’un contrôle est très éprouvante : ${SOUTIEN} ${URG}

${FIN}`,
  }),
  a({
    slug: 'depistage-auditif-du-nouveau-ne',
    title: 'Le dépistage de l’audition du nouveau-né et la surveillance de l’ouïe',
    summary: 'Comment se déroule le test d’audition à la maternité, ce que signifie un résultat « non concluant », et les signes qui doivent faire consulter ensuite.',
    category: 'sante-bebe', journeys: ['pregnant', 'newborn'],
    tags: ['dépistage auditif', 'audition', 'surdité', 'nouveau-né', 'maternité', 'otoémissions', 'ORL', 'babillage'],
    sources: [S.surdite, S.maternite, S.suivi2mois],
    body_md: `## En bref
- Un **repérage de la surdité** est proposé à la maternité, **après 24 heures de vie**, avec votre accord.
- Un résultat **non concluant** ne veut pas dire que bébé est sourd : un **second test** est fait avant la sortie.
- Si le doute persiste, bébé est orienté vers un **spécialiste**, avec des examens à réaliser **avant la fin du 3e mois**.
- L’audition est ensuite **revérifiée** lors des examens de suivi, notamment à 4, 9 et 24 mois.

## Comprendre
Les surdités présentes dès la naissance concernent **0,5 à 1,3 nouveau-né pour mille**. Les repérer tôt permet d’accompagner l’enfant au moment où le langage se construit. L’Assurance Maladie explique que le dépistage repose sur des appareils automatisés : les **oto-émissions acoustiques provoquées** (OEA) ou les **potentiels évoqués auditifs automatisés** (PEAA). Des professionnels formés peuvent le réaliser.

Ce test ne mesure ni le degré ni le type de surdité : il sert seulement à **repérer** les bébés qui doivent voir un audiologiste. Il arrive qu’il ne soit pas concluant pour des raisons sans lien avec une surdité, d’où le second test.

Les résultats vous sont expliqués et **inscrits dans le carnet de santé**.

## Au quotidien
**À la maternité**
- Le test est proposé à partir de 24 heures de vie, parfois à domicile dans les premiers jours.
- Si le premier n’est pas concluant, un second est fait **au moins 12 heures plus tard**, avant la sortie.
- Si le second n’est pas concluant non plus, vous êtes orienté vers une structure spécialisée. L’Assurance Maladie indique que la maternité peut organiser le rendez-vous dans un délai d’un mois si vous le souhaitez, ou vous remettre les coordonnées.

**Ensuite, à la maison**
Parlez à bébé, chantez, lisez : c’est bon pour son langage, et cela vous permet d’observer ses réactions. Les examens de suivi des premiers mois comportent un examen des tympans et, si besoin, un test auditif. À 4 mois, le dépistage vise surtout les surdités profondes et sévères ; à partir de 9 mois, il inclut aussi les surdités moyennes.

**Les signes qui doivent faire consulter**
- **De 3 à 12 mois** : sons peu mélodieux, absence de babillage, pas de réaction à l’appel ou aux bruits forts.
- **De 12 à 24 mois** : aucun mot, communication surtout par gestes, inattention à ce qui se passe hors de son champ de vision, sons inhabituels et non contrôlés.
- À tout âge, des troubles de la parole ou du comportement.

## Questions fréquentes
**Comment se passe le test concrètement ?**
Il est réalisé avec un appareil automatisé, par un professionnel formé. Demandez à l’équipe de vous expliquer le déroulement et si vous pouvez rester auprès de bébé.

**Le résultat est « non concluant » : dois-je m’inquiéter ?**
Un premier résultat non concluant est fréquent et ne signifie pas une surdité. Suivez les étapes proposées : second test, puis spécialiste si besoin.

**Mon bébé réagit aux bruits : le test est-il encore utile ?**
Oui : certaines surdités sont partielles ou touchent une seule oreille et passent inaperçues. Le dépistage et les contrôles de suivi sont plus fiables que l’observation seule.

**Où trouver de l’information ?**
L’Assurance Maladie cite **Surdités info service**, au 0 805 800 808 (numéro gratuit).

## Quand demander conseil
En cas de doute sur l’audition de votre enfant, **n’attendez pas** le prochain examen : parlez-en au médecin traitant ou au pédiatre, qui pourra l’orienter vers un ORL. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ s'organiser
  a({
    slug: 'medecin-traitant-pour-bebe',
    title: 'Choisir et déclarer un médecin traitant pour bébé',
    summary: 'Pourquoi déclarer un médecin traitant pour son enfant, qui peut l’être, comment faire la démarche, et ce que cela change pour les remboursements.',
    category: 'droits-demarches', journeys: ['pregnant', 'newborn', 'child'], max_age_months: 192,
    tags: ['médecin traitant', 'pédiatre', 'généraliste', 'déclaration', 'carte Vitale', 'CPAM', 'remboursement', 'garde alternée'],
    sources: [S.medecinTraitant, S.examen8j, S.suivi20],
    body_md: `## En bref
- Les parents d’un enfant de **moins de 16 ans** sont invités à lui choisir un **médecin traitant** : généraliste, **pédiatre** ou autre médecin qui le suit.
- Le choix est fait par **au moins un des parents** (ou le titulaire de l’autorité parentale) ; **un seul médecin** est désigné, même si l’enfant a deux domiciles.
- La déclaration se fait **en ligne par le médecin**, avec la carte Vitale, ou avec un formulaire.
- Un enfant de moins de 16 ans **sans** médecin traitant **n’est pas moins bien remboursé**.

## Comprendre
Le médecin traitant coordonne le suivi : il connaît l’histoire de santé de l’enfant, ses vaccins, ses antécédents, et oriente vers un spécialiste si besoin. Pour les adultes, passer par lui conditionne le meilleur remboursement. Pour les enfants, l’Assurance Maladie précise que la déclaration est **recommandée**, mais que l’absence de médecin traitant ne diminue pas le remboursement avant 16 ans. Les 20 examens de suivi, de la naissance à 16 ans, peuvent être réalisés par un généraliste ou un pédiatre, en cabinet ou en centre de santé, et jusqu’à 6 ans en PMI.

Le médecin traitant de l’enfant peut être celui des parents, sans obligation.

## Au quotidien
**Choisir**
- Un **pédiatre** ou un **médecin généraliste** qui suit des enfants : les deux peuvent assurer les examens de suivi et les vaccinations.
- Pensez à la **proximité** et aux **horaires** : en cas de maladie, pouvoir être vu vite compte beaucoup.
- Demandez comment le cabinet gère les **consultations non programmées** pour les enfants malades et ce qui est prévu en son absence.
- La PMI et les centres de santé peuvent aussi assurer le suivi.

**Déclarer**
- Le plus simple : lors d’une consultation, le médecin fait la déclaration **en ligne** avec la carte Vitale du parent auquel l’enfant est rattaché.
- Sinon, le formulaire **S3704** est signé par le parent et le médecin, puis envoyé à la caisse de l’enfant.
- La déclaration est enregistrée auprès de la **CPAM de l’enfant**.

**Changer**
Le changement est possible **à tout moment**, sans justification ; il prend effet à la date de désignation du nouveau médecin.

**En cas de résidence alternée**
Un seul médecin traitant est désigné. Mettez-vous d’accord entre parents et partagez les informations du carnet de santé.

## Questions fréquentes
**Le médecin doit-il accepter ?**
Oui : le choix est libre, mais le médecin doit accepter d’être le médecin traitant. Certains, très sollicités, ne prennent plus de nouveaux patients ; demandez autour de vous, à la PMI ou à la maternité.

**Puis-je consulter un autre médecin si le médecin traitant est absent ?**
Oui, notamment en cas d’urgence ou d’indisponibilité. Pour l’enfant de moins de 16 ans, cela ne change pas le remboursement.

**Faut-il refaire la démarche à 16 ans ?**
À partir de 16 ans, chaque assuré doit avoir son propre médecin traitant ; la déclaration est alors à renouveler dans les conditions prévues pour les 16–17 ans.

**Les examens de suivi sont-ils remboursés même sans médecin traitant ?**
Oui : les 20 examens de suivi sont pris en charge à 100 %, quel que soit le médecin qui les réalise (hors dépassements d’honoraires).

## Quand demander conseil
Si vous ne trouvez pas de médecin pour votre enfant, la PMI, la maternité ou votre caisse d’Assurance Maladie peuvent vous orienter. Pour un problème urgent, n’attendez pas d’avoir trouvé un médecin traitant. ${URG}

${FIN}`,
  }),
  a({
    slug: 'consultations-pmi-pour-bebe',
    title: 'La PMI : des consultations gratuites pour bébé et ses parents',
    summary: 'Ce que propose un centre de protection maternelle et infantile, pour qui, avec quels professionnels, et comment le trouver près de chez vous.',
    category: 'sante-bebe', journeys: ['pregnant', 'newborn', 'child'], max_age_months: 72,
    tags: ['PMI', 'protection maternelle et infantile', 'puéricultrice', 'consultation gratuite', 'pesée', 'vaccins', 'suivi bébé', 'soutien parents'],
    sources: [S.pmi, S.suivi20, S.examen8j],
    body_md: `## En bref
- Les centres de **PMI** sont des services publics des départements, **gratuits et ouverts à tous**, pour les futurs parents, les parents et les enfants **de moins de 6 ans**.
- Ils assurent un **suivi médical gratuit** de l’enfant : examens de suivi, **vaccinations**, croissance, développement.
- On y trouve des **puéricultrices**, des **médecins**, des **sages-femmes**, et selon les lieux d’autres professionnels.
- On peut y venir pour une **question**, une **pesée**, un **conseil**, sans être malade.

## Comprendre
Santé.fr (programme des 1000 premiers jours) présente la PMI comme un lieu d’accompagnement de la grossesse jusqu’aux 6 ans de l’enfant. Après la naissance, la PMI propose un suivi médical de la mère (dont la contraception) et un **suivi médical gratuit de l’enfant jusqu’à 6 ans** : vaccinations, dépistage des handicaps, surveillance de la taille, du poids et du développement psychomoteur. Les 20 examens de suivi obligatoires peuvent y être réalisés jusqu’à 6 ans, comme chez un médecin de ville.

La PMI propose aussi des **consultations et des groupes d’échange** sur le sommeil, les pleurs, l’alimentation, la croissance et le développement. Certains centres organisent des ateliers (massage bébé, éveil, jeux). Des **interprètes** (langues parlées ou langue des signes) et des médiateurs peuvent être sollicités.

Le premier certificat de santé, rempli lors de l’examen des 8 premiers jours, est transmis à la PMI : c’est aussi par ce biais qu’elle peut vous proposer un accompagnement.

## Au quotidien
**Quand penser à la PMI**
- Pour les **examens de suivi** et les **vaccins**, si vous n’avez pas de médecin ou en complément.
- Pour **peser bébé** et parler de l’allaitement, des biberons, de la diversification.
- Pour une question sur le **sommeil**, les **pleurs**, le développement, l’organisation à la maison.
- Pour être **orienté** : modes de garde, droits, démarches, autres professionnels.
- Quand vous vous sentez **seul·e ou dépassé·e** : les équipes sont là pour écouter, sans jugement.

**Trouver un centre**
Utilisez l’annuaire de **service-public.fr**, le site de votre **département** ou demandez à la maternité. Il y a souvent plusieurs centres dans un même secteur. Renseignez-vous sur les horaires, les consultations sur rendez-vous et les permanences sans rendez-vous.

**Préparer la visite**
Apportez le **carnet de santé**, notez vos questions, et venez avec l’autre parent si vous le souhaitez : il est le bienvenu.

## Questions fréquentes
**Faut-il avoir des difficultés pour aller à la PMI ?**
Non. La PMI est ouverte à toutes les familles, quelle que soit leur situation.

**Est-ce vraiment gratuit ?**
Oui, les consultations et le suivi de l’enfant en PMI sont gratuits.

**La PMI soigne-t-elle les enfants malades ?**
Elle assure surtout la **prévention et le suivi**. Pour un enfant malade, consultez le médecin traitant, le médecin de garde ou, en cas d’urgence, appelez le 15.

**Je ne parle pas bien français : puis-je y aller ?**
Oui. Santé.fr précise que des interprètes (langues parlées ou langue des signes) et des médiateurs peuvent être sollicités si besoin. Demandez-le en prenant rendez-vous.

## Quand demander conseil
N’hésitez pas à contacter la PMI pour toute question sur la santé et le quotidien de votre bébé. ${SOUTIEN} ${URG}

${FIN}`,
  }),
  a({
    slug: 'vitamine-d-et-vitamine-k-bebe',
    title: 'Vitamine D et vitamine K chez le bébé : pourquoi, et les bonnes précautions',
    summary: 'À quoi servent la vitamine K donnée à la naissance et la vitamine D prescrite ensuite, et comment éviter les erreurs et les surdosages.',
    category: 'sante-bebe', journeys: ['newborn', 'child'], max_age_months: 72,
    tags: ['vitamine D', 'vitamine K', 'supplémentation', 'rachitisme', 'compléments alimentaires', 'surdosage', 'gouttes', 'ordonnance'],
    sources: [S.vitDAnsm, S.vitDMpedia, S.maternite],
    body_md: `## En bref
- La **vitamine K** est donnée à la maternité dans les heures qui suivent la naissance, pour **prévenir des hémorragies**.
- La **vitamine D** est recommandée **dès les premiers jours de vie** et pendant la croissance, pour **prévenir le rachitisme** ; c’est le médecin qui la prescrit.
- L’ANSM recommande de **privilégier un médicament** plutôt qu’un **complément alimentaire**, et de **ne jamais cumuler** plusieurs produits contenant de la vitamine D.
- **Trop** de vitamine D peut être **aussi dangereux** que pas assez.

## Comprendre
**La vitamine K.** L’Assurance Maladie indique qu’une prise de vitamine K1 par la bouche est administrée dans les deux heures suivant la naissance, pour prévenir les saignements. Elle est notée dans le dossier de bébé ; si l’équipe ou le médecin vous donne d’autres consignes, suivez-les.

**La vitamine D.** Elle aide l’organisme à fixer le calcium sur les os. mpedia rappelle que l’alimentation en apporte peu et que l’exposition au soleil est insuffisante en hiver ; d’où une supplémentation chez les enfants, adaptée par le médecin à l’âge et à la situation de chacun (mpedia cite par exemple une peau fortement pigmentée, des vêtements très couvrants ou certaines maladies, qui justifient une supplémentation toute l’année).

**Les risques d’erreur.** L’ANSM a signalé des surdosages chez des nourrissons après la prise de **compléments alimentaires** enrichis en vitamine D. Ces produits ont des concentrations très variables d’une goutte à l’autre et d’une marque à l’autre, peuvent contenir d’autres vitamines ou du calcium, et s’ajoutent parfois à un médicament déjà prescrit. Le surdosage provoque une **hypercalcémie** (trop de calcium dans le sang), qui peut atteindre les reins.

## Au quotidien
**Les bons réflexes**
- Utilisez **le produit prescrit**, avec le dispositif fourni, en suivant **l’ordonnance** et la notice.
- Si vous changez de produit (rupture, nouvelle prescription), **demandez au pharmacien** de vérifier la concentration : le nombre de gouttes n’est pas le même d’un produit à l’autre.
- **Ne cumulez pas** : un seul produit contenant de la vitamine D, sauf avis médical. Lisez la composition des laits et compléments.
- Évitez les produits de provenance ou de composition non garanties ; l’ANSM déconseille l’achat sur Internet.
- **Notez les prises** dans le carnet de santé ou un carnet partagé : cela évite les oublis et les doubles prises.

**Une organisation simple**
Associez la prise à un moment fixe de la journée (après le bain, par exemple), et désignez à la maison **qui la donne**. Rangez le flacon hors de portée des enfants.

**En cas d’oubli**
Ne doublez pas la prise suivante de vous-même : demandez au pharmacien ou au médecin.

## Questions fréquentes
**Mon bébé boit du lait infantile : a-t-il encore besoin de vitamine D ?**
C’est au médecin de le déterminer : il tient compte du mode d’alimentation et des besoins de votre enfant.

**Jusqu’à quel âge ?**
La supplémentation est poursuivie pendant la croissance, selon un rythme que le médecin adapte à l’âge (prises quotidiennes ou espacées). Parlez-en lors des examens de suivi.

**Le soleil suffit-il en été ?**
mpedia indique qu’une courte exposition suffit à fabriquer de la vitamine D par temps ensoleillé, mais les bébés doivent rester protégés du soleil direct. Ne modifiez pas la prescription sans avis.

**Un complément « naturel » trouvé en magasin bio est-il mieux ?**
Non : l’ANSM recommande de recourir aux médicaments, dont la teneur est contrôlée, plutôt qu’aux compléments alimentaires.

## Quand demander conseil
Contactez rapidement le médecin ou un centre antipoison si vous pensez avoir donné trop de vitamine D (double prise, erreur de produit ou de nombre de gouttes), même si votre enfant semble aller bien. Les effets indésirables peuvent être signalés à la pharmacovigilance ou à la nutrivigilance de l’Anses. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ voyage et prévention
  a({
    slug: 'voyager-avec-un-bebe-malade',
    title: 'Voyager avec un bébé malade ou qui couve quelque chose',
    summary: 'Avant de partir, pendant le trajet et sur place : comment décider avec le médecin, quoi emporter et comment se faire soigner à l’étranger.',
    category: 'vie-pratique', journeys: ['newborn', 'child'], max_age_months: 36,
    tags: ['voyage', 'bébé malade', 'avion', 'otite', 'CEAM', 'carte européenne', 'trousse de voyage', 'vacances'],
    sources: [S.trousseVoyage, S.vacancesEtranger, S.altitude],
    body_md: `## En bref
- Si bébé est malade avant un départ, **demandez l’avis du médecin** : lui seul peut dire si le voyage est raisonnable, et avec quelles précautions.
- En avion ou en montagne, un **rhume** ou une **otite** récente favorisent les **douleurs d’oreille** ; faire **téter ou boire** aide bébé à déglutir.
- Emportez le **carnet de santé**, les **ordonnances**, le **thermomètre**, du **sérum physiologique** et des **sachets de réhydratation**.
- En Europe, chaque enfant a besoin de **sa propre carte européenne d’assurance maladie (CEAM)**, à demander **au moins 15 jours** avant le départ.

## Comprendre
Un tout-petit peut tomber malade juste avant ou pendant des vacances. Les règles habituelles s’appliquent partout : un bébé de **moins de 3 mois** qui a de la fièvre doit être vu **le jour même**, et les signes de gravité (gêne respiratoire, déshydratation, bébé mou ou difficile à réveiller) imposent d’appeler les secours. À l’étranger, le **112** est le numéro d’urgence européen.

mpedia explique que les variations rapides d’altitude et de pression (avion, route de montagne, remontées mécaniques) peuvent provoquer des douleurs d’oreille, favorisées par un rhume en cours ou des otites à répétition. Faire boire l’enfant (sein ou biberon) pendant ces variations l’aide à déglutir.

## Au quotidien
**Avant de partir**
- Consultez si bébé est malade ou si vous hésitez à partir, et demandez ce qui doit vous faire consulter sur place.
- S’il suit un traitement, prévoyez-en **assez pour tout le séjour**, avec une marge, et gardez l’**ordonnance** sur vous (l’Assurance Maladie conseille d’y faire figurer les noms des médicaments en dénomination commune internationale).
- Demandez la **CEAM** de chaque membre de la famille sur votre compte ameli, au 36 46 ou en agence, **au moins 15 jours** avant ; si le départ est plus proche, un **certificat provisoire** valable 3 mois peut être délivré.
- Hors d’Europe, renseignez-vous sur une **assurance ou assistance** couvrant les frais médicaux et le rapatriement : dans certains pays, les soins coûtent très cher.

**La trousse**
Thermomètre, sérum physiologique en dosettes, compresses, pansements, antiseptique choisi avec le pharmacien, tire-tiques, crème solaire adaptée, **sachets de réhydratation orale** (très utiles en pays chaud), et les médicaments prescrits, **dans leur emballage avec leur notice**. En avion, mettez les médicaments dans le **bagage cabine**. L’Assurance Maladie rappelle que la plupart des médicaments contre la diarrhée sont contre-indiqués chez le jeune enfant : demandez un avis médical.

**Pendant le trajet**
- Proposez **à boire souvent**, surtout en avion, en voiture chaude ou en cas de diarrhée.
- Au **décollage et à l’atterrissage**, proposez le sein, le biberon ou une boisson.
- Gardez sur vous le carnet de santé et les numéros utiles.

**Sur place**
- Repérez l’adresse d’un médecin, d’une pharmacie et des urgences.
- Dans l’Union européenne, la CEAM couvre les **soins devenus nécessaires** pendant le séjour, selon les règles du pays. Gardez **factures et justificatifs** : un remboursement est possible au retour.

## Questions fréquentes
**Bébé a une otite : peut-il prendre l’avion ?**
C’est au médecin d’en juger, selon l’état de l’oreille et le traitement. Consultez avant le départ.

**Et s’il tombe malade à l’étranger ?**
Appliquez les mêmes réflexes qu’à la maison. En cas d’urgence, composez le 112. Pour un avis, adressez-vous à un médecin local avec le carnet de santé.

**Un enfant de moins de 16 ans a-t-il vraiment besoin de sa propre CEAM ?**
Oui : l’Assurance Maladie précise que la carte est individuelle et nominative, y compris pour les enfants.

**Faut-il consulter au retour ?**
Si bébé a de la fièvre ou des symptômes qui persistent après un voyage, consultez et **indiquez toujours au médecin où vous étiez** : certaines destinations exposent à des maladies particulières.

## Quand demander conseil
Reportez ou adaptez le voyage si le médecin le conseille. Sur place, consultez rapidement en cas de fièvre chez un bébé de moins de 3 mois, de signes de déshydratation ou de gêne respiratoire. ${URG}

${FIN}`,
  }),
  a({
    slug: 'proteger-bebe-des-infections-de-l-hiver',
    title: 'Protéger bébé des virus de l’hiver : les gestes qui comptent',
    summary: 'Mains, visites, bisous, lieux fréquentés, aération, tabac et vaccinations : les gestes simples qui limitent la bronchiolite et les autres virus chez le tout-petit.',
    category: 'sante-bebe', max_age_months: 24,
    tags: ['bronchiolite', 'gestes barrières', 'lavage des mains', 'virus', 'hiver', 'visites', 'masque', 'gastro'],
    sources: [S.bronchiolite, S.examen8j, S.bebeSante],
    body_md: `## En bref
- **Lavez-vous les mains** avant et après chaque soin, change, tétée ou biberon.
- **Limitez les visites** aux adultes en bonne santé ; évitez les **bisous** sur le visage et les mains, et le passage de bras en bras.
- Si vous êtes **enrhumé·e**, **portez un masque** pour vous occuper de bébé.
- Évitez les **lieux clos et très fréquentés**, surtout **avant 3 mois**, aérez chaque jour et protégez bébé de la **fumée de tabac**.

## Comprendre
Chaque hiver, les virus respiratoires (dont celui de la bronchiolite) et digestifs circulent beaucoup. Chez l’adulte, ils donnent souvent un simple rhume ; chez le nourrisson, surtout dans les premiers mois, ils peuvent gêner la respiration ou l’alimentation et conduire à une hospitalisation. Ces virus se transmettent par les mains, la toux, les éternuements et les objets.

Les recommandations du ministère chargé de la Santé, relayées par Santé.fr, et celles de l’Assurance Maladie convergent : quelques gestes au quotidien réduisent nettement les risques. Ils sont utiles toute l’année, et prennent toute leur importance pendant les épidémies.

## Au quotidien
**À la maison**
- Lavage des mains à l’eau et au savon (ou solution hydroalcoolique) avant et après s’occuper de bébé, pour tous les adultes et les aînés.
- **Aérez** chaque jour le logement, en particulier la chambre de bébé.
- Lavez régulièrement **jouets et doudous**.
- Si un frère ou une sœur est malade, tenez-le un peu à distance de bébé pendant la phase aiguë, et apprenez-lui à se laver les mains et à tousser dans son coude.
- Ne fumez pas et ne laissez personne fumer près de bébé : la fumée augmente le risque de problèmes respiratoires.

**Les visites**
- Proposez de reporter la visite aux personnes enrhumées, fiévreuses ou qui toussent.
- Demandez aux visiteurs de se laver les mains en arrivant.
- Évitez les visites de **jeunes enfants avant les 3 mois** de bébé, et les bisous sur son visage.

**Les sorties**
- Préférez les promenades en plein air aux lieux clos et bondés (supermarchés, restaurants, transports aux heures de pointe), surtout avant 3 mois.
- Évitez aussi les pics de pollution et le grand froid.

**La collectivité**
Les recommandations conseillent d’éviter, si possible, la crèche ou la garderie avant 3 mois, et de ne pas y confier bébé les jours où il est malade. Parlez-en avec la structure.

**Les vaccinations**
Faites vacciner bébé **sans retard**, selon le calendrier. Les parents et l’entourage proche ont intérêt à être à jour pour la **coqueluche** et vaccinés contre la **grippe**. Des moyens de prévention spécifiques de la bronchiolite existent : demandez au médecin ou à la sage-femme ce qui est proposé pour votre bébé.

## Questions fréquentes
**Faut-il interdire toutes les visites ?**
Non : il s’agit de privilégier des visiteurs en bonne santé, de leur demander de se laver les mains et d’éviter les bisous. Les premiers mois, des visites courtes et peu nombreuses sont plus reposantes.

**Le masque est-il utile à la maison ?**
Oui, pour la personne malade qui s’occupe de bébé : c’est elle qui le porte.

**Puis-je continuer à allaiter si je suis enrhumée ?**
Oui, en vous lavant les mains et en portant un masque. Parlez-en à votre médecin ou sage-femme en cas de doute.

**Bébé a un rhume : quand s’inquiéter ?**
Lavez-lui le nez au sérum physiologique et surveillez sa respiration et ses boissons. Consultez s’il respire vite, se creuse en respirant ou boit nettement moins.

## Quand demander conseil
Consultez rapidement, voire aux urgences, si bébé a moins de 6 semaines, est un ancien prématuré de moins de 3 mois, a une maladie respiratoire ou cardiaque, boit moins de la moitié de ses biberons sur trois repas de suite, vomit systématiquement, dort en permanence ou pleure de façon inhabituelle. ${URG}

${FIN}`,
  }),
];
