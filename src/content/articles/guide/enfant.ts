/** Guide complet « enfant » (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles françaises). `published` = date affichée par la page, quand elle est précise.
const S = {
  suiviMedical: { label: 'ameli.fr — Suivi médical de l’enfant et de l’adolescent', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent', consulted_on: C },
  sante611: { label: 'Santé.fr — Enfant de 6 ans à 11 ans : les essentiels santé', url: 'https://www.sante.fr/enfant-de-6-ans-11-ans-les-essentiels-sante', consulted_on: C, published: '2020-07-16' },
  vaccins: { label: 'Vaccination Info Service (Santé publique France) — Nourrissons et enfants (de la naissance à 10 ans)', url: 'https://www.vaccination-info-service.fr/La-vaccination-au-cours-de-la-vie/nourrissons-et-enfants-de-la-naissance-a-10-ans', consulted_on: C, published: '2026-05-03' },
  fievre: { label: 'ameli.fr — Votre enfant a de la fièvre : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2024-09-03' },
  varicelle: { label: 'ameli.fr — Varicelle : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/varicelle/que-faire-cas-faut-consulter', consulted_on: C, published: '2026-03-25' },
  pmb: { label: 'ameli.fr — Syndrome pieds-mains-bouche : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/syndrome-pieds-mains-bouche/que-faire-quand-consulter', consulted_on: C, published: '2020-01-31' },
  scarlatine: { label: 'ameli.fr — Scarlatine : définition, transmission et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/scarlatine/definition-symptomes-modes-transmission', consulted_on: C, published: '2025-03-24' },
  scarlatineTraitement: { label: 'ameli.fr — Diagnostic, traitement et évolution de la scarlatine', url: 'https://www.ameli.fr/assure/sante/themes/scarlatine/diagnostic-traitement-evolution', consulted_on: C },
  otite: { label: 'ameli.fr — Otite moyenne aiguë : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/otite-moyenne-aigue/bons-reflexes-que-faire', consulted_on: C, published: '2026-02-18' },
  angine: { label: 'ameli.fr — Définition, symptômes et diagnostic de l’angine', url: 'https://www.ameli.fr/assure/sante/themes/angine/definition-symptomes-diagnostic', consulted_on: C, published: '2026-09-04' },
  angineTraitement: { label: 'ameli.fr — Traitement de l’angine avec ou sans antibiotiques', url: 'https://www.ameli.fr/assure/sante/themes/angine/traitement', consulted_on: C, published: '2026-09-04' },
  gastro: { label: 'ameli.fr — Diarrhée et gastro-entérite de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-enfant/que-faire-quand-consulter', consulted_on: C, published: '2025-01-03' },
  asthme: { label: 'ameli.fr — Symptômes et diagnostic de l’asthme chez l’enfant de plus de 3 ans', url: 'https://www.ameli.fr/assure/sante/themes/asthme-enfant-plus-3-ans/symptomes-diagnostic', consulted_on: C, published: '2025-01-20' },
  asthmeEcole: { label: 'ameli.fr — Enfant asthmatique et scolarité', url: 'https://www.ameli.fr/assure/sante/themes/asthme-enfant-plus-3-ans/enfant-asthme-ecole', consulted_on: C, published: '2025-05-28' },
  allergie: { label: 'ameli.fr — Allergie alimentaire : définition et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/allergie-alimentaire/definition-symptomes', consulted_on: C, published: '2025-06-27' },
  allergieQueFaire: { label: 'ameli.fr — Allergie alimentaire : la consultation médicale et les mesures au quotidien', url: 'https://www.ameli.fr/assure/sante/themes/allergie-alimentaire/que-faire-consultation-medicale', consulted_on: C, published: '2024-09-18' },
  poux: { label: 'ameli.fr — Poux : comment s’en débarrasser ?', url: 'https://www.ameli.fr/assure/sante/themes/poux/bons-reflexes', consulted_on: C, published: '2018-12-07' },
  pouxReconnaitre: { label: 'ameli.fr — Reconnaître la présence de poux', url: 'https://www.ameli.fr/assure/sante/themes/poux/reconnaitre-presence-poux', consulted_on: C, published: '2025-06-25' },
  oxyures: { label: 'ameli.fr — Vers intestinaux : contamination par des oxyures et symptômes', url: 'https://www.ameli.fr/assure/sante/themes/parasitose-oxyurose/contamination-symptomes', consulted_on: C, published: '2025-10-09' },
  oxyuresTraitement: { label: 'ameli.fr — Oxyures : que faire et quel traitement ?', url: 'https://www.ameli.fr/assure/sante/themes/parasitose-oxyurose/que-faire-traitement', consulted_on: C, published: '2025-10-09' },
  yeux: { label: 'ameli.fr — La santé des yeux de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/astigmatisme/sante-yeux-enfant', consulted_on: C, published: '2026-03-18' },
  surdite: { label: 'ameli.fr — Mon enfant entend mal : dépistage, symptômes et diagnostic de la surdité', url: 'https://www.ameli.fr/assure/sante/themes/surdite-enfant/mon-enfant-entend-mal-depistage-symptomes-et-diagnostic-de-la-surdite', consulted_on: C, published: '2026-07-16' },
  audition: { label: 'Santé.fr — Préserver votre enfant de troubles de l’audition', url: 'https://www.sante.fr/preserver-votre-enfant-de-troubles-de-laudition', consulted_on: C, published: '2020-10-19' },
  malVentre: { label: 'ameli.fr — Mal de ventre : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/mal-ventre/que-faire-cas-faut-consulter', consulted_on: C, published: '2026-08-31' },
  conjonctivite: { label: 'ameli.fr — Conjonctivite : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/conjonctivite/que-faire-quand-consulter', consulted_on: C, published: '2025-05-06' },
  puberte: { label: 'ameli.fr — Puberté précoce et puberté tardive', url: 'https://www.ameli.fr/assure/sante/themes/puberte/puberte-precoce-tardive', consulted_on: C },
  puberteMpedia: { label: 'mpedia.fr (Association française de pédiatrie ambulatoire) — Repérer les premiers signes de la puberté', url: 'https://www.mpedia.fr/art-demarrage-puberte/', consulted_on: C, published: '2020-10-21' },
  enuresie: { label: 'ameli.fr — Que faire si votre enfant fait pipi au lit et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/pipi-lit-enuresie/que-faire-quand-consulter', consulted_on: C },
  sommeilTroubles: { label: 'Santé.fr — Troubles du sommeil chez l’enfant', url: 'https://www.sante.fr/troubles-du-sommeil-chez-lenfant', consulted_on: C, published: '2026-08-13' },
  parasomnies: { label: 'mpedia.fr — Parasomnies et difficultés d’endormissement de l’enfant de 6 à 11 ans', url: 'https://www.mpedia.fr/art-parasomnies-endormissement/', consulted_on: C, published: '2020-08-24' },
  sommeilEtapes: { label: 'ameli.fr — Sommeil de l’enfant : ses étapes, sa durée et ses troubles', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/sommeil-enfant-importance-troubles-etapes', consulted_on: C },
  dortMal: { label: 'ameli.fr — Mon enfant dort mal : comment réagir ?', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/que-faire-enfant-dort-mal', consulted_on: C },
  repas: { label: 'ameli.fr — Des repas équilibrés bien répartis dans la journée de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-de-l-enfant-et-de-l-adolescent-de-3-18-ans/repas-equilibres-fil-journee', consulted_on: C, published: '2024-06-27' },
  aliments: { label: 'ameli.fr — Aliments à consommer chaque jour par un enfant', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-de-l-enfant-et-de-l-adolescent-de-3-18-ans/aliments-consommer-quotidien', consulted_on: C, published: '2025-03-27' },
  cantine: { label: 'Ministère de l’Éducation nationale — La restauration scolaire', url: 'https://www.education.gouv.fr/la-restauration-scolaire-6254', consulted_on: C },
  pai: { label: 'Éduscol (Ministère de l’Éducation nationale) — Poursuite de la scolarité avec des traitements médicaux particuliers (PAI)', url: 'https://eduscol.education.gouv.fr/5427/poursuite-de-la-scolarite-avec-des-traitements-medicaux-particuliers', consulted_on: C },
  activite: { label: 'Santé.fr — Activité physique et santé', url: 'https://www.sante.fr/activite-physique-et-sante', consulted_on: C, published: '2023-05-09' },
  sport: { label: 'Santé.fr (Manger Bouger) — Les accompagner dans la pratique d’un sport', url: 'https://www.sante.fr/les-accompagner-dans-la-pratique-dun-sport', consulted_on: C, published: '2021-11-24' },
  veo: { label: 'mpedia.fr — Violences éducatives ordinaires : comment faire autrement', url: 'https://www.mpedia.fr/veo-violences-educatives-ordinaires-comment-faire-autrement/', consulted_on: C },
  limites: { label: '1000 premiers jours (Santé publique France) — Poser des limites à son enfant', url: 'https://admin.1000-premiers-jours.fr/fr/poser-des-limites-son-enfant', consulted_on: C, published: '2025-06-10' },
  caprices: { label: 'mpedia.fr — Cris, pleurs de l’enfant, réagir face aux « caprices »', url: 'https://www.mpedia.fr/art-caprices-comment-les-gerer/', consulted_on: C, published: '2022-04-20' },
  affirmation: { label: 'mpedia.fr — Affirmation de soi, entre autonomie et opposition', url: 'https://www.mpedia.fr/art-affirmation-de-soi/', consulted_on: C, published: '2020-08-24' },
  fratrie: { label: 'mpedia.fr — Les relations dans la fratrie, entre jalousie et disputes', url: 'https://www.mpedia.fr/art-les-relations-dans-fratrie/', consulted_on: C, published: '2021-03-18' },
  separation: { label: 'mpedia.fr — Séparation et divorce des parents', url: 'https://www.mpedia.fr/art-separation-parentale/', consulted_on: C, published: '2019-07-30' },
  argent: { label: 'Mes questions d’argent (Banque de France) — Quand et comment parler d’argent avec ses enfants ?', url: 'https://www.mesquestionsdargent.fr/budget/largent-et-les-enfants/quand-et-comment-parler-dargent-avec-ses-enfants', consulted_on: C, published: '2024-09-18' },
  maternelle: { label: 'Ministère de l’Éducation nationale — L’école maternelle', url: 'https://www.education.gouv.fr/l-ecole-maternelle-11534', consulted_on: C },
  inscription: { label: 'Ministère de l’Éducation nationale — L’inscription à l’école maternelle', url: 'https://www.education.gouv.fr/l-inscription-l-ecole-maternelle-8651', consulted_on: C, published: '2025-12-02' },
  lecture: { label: 'mpedia.fr — Apprentissage de la lecture, troubles et difficultés', url: 'https://www.mpedia.fr/art-apprentissage-lecture/', consulted_on: C, published: '2019-07-09' },
  harcelement: { label: 'Ministère de l’Éducation nationale — Mon enfant est victime de harcèlement', url: 'https://www.education.gouv.fr/non-au-harcelement/mon-enfant-est-victime-de-harcelement-323014', consulted_on: C },
  allo119: { label: '119 Allô Enfance en danger (GIP Enfance en danger) — Signaler une situation', url: 'https://www.allo119.gouv.fr/recueil-de-situation-adulte', consulted_on: C },
  accidents: { label: 'Santé.fr (Santé publique France, 1000 premiers jours) — Éviter les accidents domestiques des enfants', url: 'https://www.sante.fr/eviter-les-accidents-domestiques-des-enfants', consulted_on: C, published: '2025-07-11' },
  asthmeSuivi: { label: 'ameli.fr — Suivi médical et vie quotidienne de l’enfant et de l’adolescent asthmatiques', url: 'https://www.ameli.fr/assure/sante/themes/asthme-enfant-plus-3-ans/suivi-medical-vie-quotidienne', consulted_on: C },
  pileBouton: { label: 'ameli.fr — Mon enfant a avalé une pile bouton : agir vite', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/mon-enfant-avale-une-pile-bouton-agir-vite', consulted_on: C },
  signesDanger: { label: 'Ministère chargé des Solidarités — Campagne de lutte contre les violences faites aux enfants (signes d’alerte selon l’âge)', url: 'https://solidarites.gouv.fr/campagne-de-lutte-contre-les-violences-faites-aux-enfants', consulted_on: C, published: '2026-10-20' },
  noyade: { label: 'ameli.fr — Fortes chaleurs : un risque de noyade augmenté', url: 'https://www.ameli.fr/assure/sante/themes/canicule-chaleur/chaleur-noyade', consulted_on: C, published: '2026-06-01' },
  noyadeSpf: { label: 'Santé publique France — Résultats de l’enquête NOYADES 2021 : la prévention reste primordiale', url: 'https://www.santepubliquefrance.fr/presse/2022/resultats-de-l-enquete-noyades-2021-la-prevention-reste-primordiale', consulted_on: C, published: '2022-06-21' },
} satisfies Record<string, ArticleSource>;

const FIN = 'Cet article vous informe et vous aide à vous repérer ; il ne remplace pas l’avis du médecin, du pédiatre ou des professionnels qui suivent votre enfant.';
const CHILD = { journeys: ['child'] as LibArticle['journeys'], status: 'to_review' as const, min_age_months: 24, max_age_months: 131 };

export const GUIDE_ENFANT: LibArticle[] = [
  // ------------------------------------------------------------------ santé de l'enfant
  {
    ...CHILD, slug: 'examens-de-sante-enfant-2-a-16-ans', category: 'sante-enfant', tags: ['suivi', 'examens', 'carnet de santé', 'prévention'],
    title: 'Les examens de santé de l’enfant : à quoi servent-ils ?',
    summary: 'Vingt examens de suivi jalonnent l’enfance et l’adolescence : voici leur calendrier, ce qu’ils permettent de repérer et comment les préparer.',
    sources: [S.suiviMedical, S.sante611],
    body_md: `## En bref
- L’Assurance Maladie prévoit **20 examens de suivi médical**, de la naissance à 16 ans.
- Entre 4 et 10 ans, **4 examens** sont prévus ; puis 1 entre 11 et 13 ans et 1 entre 15 et 16 ans.
- Ces consultations sont **prises en charge intégralement, sans avance de frais**.
- Pensez à apporter le **carnet de santé** : la courbe de croissance y est mise à jour.

## Comprendre
Après les nombreux rendez-vous des deux premières années, le rythme des consultations se desserre : c’est souvent là qu’on les oublie. Pourtant, ces examens de prévention ne servent pas seulement quand l’enfant est malade. Ils permettent de suivre sa croissance dans le temps, de vérifier que son développement se poursuit bien, et de repérer tôt des difficultés qui passent facilement inaperçues au quotidien.

Selon l’Assurance Maladie, le calendrier comprend : un examen dans les 8 jours suivant la naissance, 3 jusqu’aux 2 mois, 7 entre 3 et 18 mois, 3 entre 23 mois et 3 ans, **4 entre 4 et 10 ans**, 1 entre 11 et 13 ans et 1 entre 15 et 16 ans. Le suivi, longtemps centré sur les 6 premières années, peut désormais aller jusqu’à 16 ans.

Santé.fr précise qu’à chaque consultation de l’enfant d’âge scolaire, le médecin met à jour la **courbe de croissance** et dépiste notamment des troubles de la **vision**, de l’**audition** et de la **scoliose** (déviation de la colonne vertébrale). Des examens ont lieu au cours de la sixième année, puis entre 8 et 9 ans et entre 11 et 13 ans.


**Ce qui est regardé, concrètement.** Lors de ces consultations, le médecin pèse et mesure votre enfant, reporte les mesures sur la courbe du carnet de santé et regarde surtout leur **évolution dans le temps** : une courbe régulière compte davantage qu’un chiffre isolé. Il examine aussi la vue, l’audition, le dos, la peau, les dents, et parle avec vous du sommeil, de l’alimentation, de l’activité physique, des écrans et de la vie à l’école. C’est un moment privilégié pour aborder des sujets qu’on n’ose pas toujours évoquer lors d’une consultation pour un rhume : comportement, émotions, apprentissages, relations avec les autres enfants.

**Le carnet de santé, un outil précieux.** Il rassemble les vaccinations, les mesures, les résultats de dépistage et les comptes rendus importants. Emportez-le à chaque consultation, en vacances et lors des inscriptions en collectivité.

## Au quotidien
- **Notez les dates** des prochains examens dans votre agenda (ou dans l’application) dès la consultation précédente.
- **Préparez vos questions** à l’avance : sommeil, appétit, comportement, école, écrans… Tout ce qui vous interroge a sa place.
- **Apportez le carnet de santé** : il garde la mémoire des vaccins, des mesures et des remarques précédentes.
- **Faites participer votre enfant** : à partir de 6-7 ans, il peut raconter lui-même ce qu’il ressent, ce qui l’aide à prendre soin de sa santé.
- Profitez-en pour faire le point sur les **vaccins** à jour et sur les **rappels** à venir.

## Questions fréquentes
**Mon enfant n’est jamais malade : ces examens sont-ils vraiment utiles ?**
Oui : leur but est justement la prévention. Une baisse de la vue, une audition moins bonne d’une oreille ou une courbe de croissance qui change d’allure ne se voient pas forcément à la maison.

**Faut-il payer ces consultations ?**
Selon l’Assurance Maladie, ces examens de suivi sont pris en charge intégralement, sans avance de frais.

**Qui peut les réaliser ?**
Le médecin traitant, le pédiatre ou, selon les âges et les départements, la PMI et la médecine scolaire participent aux dépistages.

**Et si nous avons manqué un examen ?**
Prenez simplement rendez-vous dès que possible : le médecin fera le point et reprendra le suivi là où il en est.

## Quand demander conseil
N’attendez pas l’examen suivant si votre enfant présente un changement qui vous inquiète : fatigue inhabituelle, perte de poids, plaintes répétées (maux de tête, douleurs), difficultés nouvelles à l’école ou changement de comportement. En cas d’urgence (difficultés à respirer, malaise, enfant très difficile à réveiller), appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'vaccins-enfant-rappels-et-calendrier', category: 'sante-enfant', tags: ['vaccins', 'rappels', 'collectivité'],
    title: 'Vaccins de l’enfant : obligatoires, recommandés et rappels',
    summary: 'Ce qui est obligatoire pour l’entrée en collectivité, le rappel de 6 ans et les vaccins proposés selon la situation de votre enfant.',
    sources: [S.vaccins, S.sante611, S.inscription],
    body_md: `## En bref
- Pour les enfants nés depuis 2018, **11 vaccinations sont obligatoires** et exigées pour l’entrée en collectivité (crèche, école).
- La plupart sont réalisées **avant un an**, avec des rappels ensuite.
- Un **rappel diphtérie-tétanos-coqueluche-polio** est prévu **à 6 ans**, puis entre 11 et 13 ans.
- D’autres vaccins sont **recommandés** (grippe à partir de 2 ans, par exemple) ou réservés à des situations particulières.

## Comprendre
La vaccination protège votre enfant, mais aussi les personnes de son entourage qui ne peuvent pas être vaccinées ou qui sont plus fragiles. Selon Vaccination Info Service (Santé publique France), les vaccins obligatoires des tout-petits couvrent notamment la diphtérie, le tétanos, la coqueluche, la poliomyélite, les infections à Haemophilus influenzae b, l’hépatite B, le pneumocoque, la rougeole, les oreillons, la rubéole et les méningocoques. Ils sont exigés pour l’accueil en collectivité : lors de l’inscription à l’école maternelle, la mairie demande d’ailleurs un document attestant ces vaccinations.

À 6 ans, un **rappel DTCaP** (diphtérie, tétanos, coqueluche, poliomyélite) est prévu. Santé.fr indique qu’un nouveau rappel a lieu entre 11 et 13 ans et rappelle que les contre-indications sont très rares.

Certains vaccins sont **recommandés** : la grippe saisonnière peut être proposée de 2 à 17 ans. D’autres concernent des **situations particulières** : BCG pour les enfants très exposés à la tuberculose, hépatite A dans certains cas, varicelle pour certains enfants à risque ou à partir de 12 ans pour ceux qui ne l’ont jamais eue, fièvre jaune en Guyane.


**Pourquoi des rappels ?** Après les premières injections, la protection apportée par certains vaccins diminue avec le temps. Les rappels permettent de la « relancer » à des âges précis : c’est le cas du rappel de 6 ans contre la diphtérie, le tétanos, la coqueluche et la poliomyélite. Le calendrier vaccinal est mis à jour régulièrement par les autorités de santé : votre médecin connaît la version en vigueur et adapte les recommandations à l’histoire de votre enfant (prématurité, maladie chronique, voyages).

**Bien vivre la piqûre.** Prévenez votre enfant le jour même, avec des mots simples et vrais. Restez à côté de lui, tenez-le dans vos bras pour les plus petits, proposez-lui de regarder ailleurs, de souffler ou de serrer un doudou. Félicitez son courage après, quelle qu’ait été sa réaction.

## Au quotidien
- **Gardez le carnet de santé à jour** : c’est la preuve des vaccinations demandée par l’école, les centres de loisirs ou pour un voyage.
- **Profitez des examens de suivi** pour vérifier les rappels à venir.
- **Préparez votre enfant** : expliquez simplement ce qui va se passer, sans promettre « ça ne fait pas mal », et prévoyez un câlin ou une activité agréable après.
- Après une vaccination, une **petite fièvre** ou une **rougeur** au point d’injection peuvent apparaître : demandez au médecin la conduite à tenir.
- En cas de **retard**, un rattrapage est possible : parlez-en à votre médecin.

## Questions fréquentes
**Mon enfant a raté un rappel, faut-il tout recommencer ?**
En général, le médecin organise un rattrapage à partir de ce qui a déjà été fait. Apportez le carnet de santé pour qu’il fasse le point.

**Le vaccin contre la grippe est-il obligatoire ?**
Non. Il est recommandé chaque année pour les enfants à risque de forme grave, et possible de 2 à 17 ans pour les autres.

**L’école peut-elle refuser mon enfant s’il n’est pas vacciné ?**
Les vaccinations obligatoires sont exigées pour l’entrée en collectivité. Rapprochez-vous de votre médecin pour régulariser la situation au plus vite.

**Où se faire vacciner ?**
Chez le médecin traitant ou le pédiatre, et, selon les âges et les territoires, en PMI ou en centre de vaccination.

## Quand demander conseil
Consultez si, après une vaccination, votre enfant a une fièvre élevée, pleure de façon inhabituelle, est très abattu ou présente une réaction qui vous inquiète. En cas de gêne respiratoire, de gonflement du visage ou de malaise, appelez immédiatement le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'fievre-chez-l-enfant-que-faire', category: 'sante-enfant', safety_critical: true, tags: ['fièvre', 'urgence', 'hydratation'],
    title: 'Fièvre chez l’enfant : les bons réflexes et quand consulter',
    summary: 'Installer, faire boire, surveiller le comportement : les gestes simples face à la fièvre et les signes qui doivent faire consulter vite.',
    sources: [S.fievre],
    body_md: `## En bref
- Une forte fièvre ne signifie pas forcément une maladie grave : **le comportement de l’enfant compte davantage que le chiffre**.
- Installez-le dans une pièce **fraîche et aérée (18 à 20 °C)**, découvrez-le un peu sans le déshabiller entièrement, et **proposez souvent à boire**.
- Un médicament contre la fièvre n’est pas toujours nécessaire : il sert surtout au **confort** de l’enfant.
- Certains signes imposent de **consulter en urgence** : ils sont détaillés plus bas.

## Comprendre
La fièvre est une réaction de défense de l’organisme, très fréquente chez l’enfant, souvent liée à une infection virale banale. Selon l’Assurance Maladie, une fièvre élevée ne veut pas dire à elle seule que la maladie est grave. Le plus important est d’observer votre enfant : joue-t-il, boit-il, réagit-il comme d’habitude entre deux pics ? Un enfant qui reste vif et qui boit bien est rassurant, même avec une température élevée.

Le repère de **38,5 °C** sert surtout à décider d’un médicament lorsque l’enfant est inconfortable. Le traitement peut être utile si la fièvre dure plus de deux jours, dépasse 38,5 °C, si l’enfant a moins de trois mois, s’il supporte mal la fièvre (grognon, moins d’appétit, maux de tête, moins actif) ou s’il a un problème de santé particulier. Demandez toujours au médecin ou au pharmacien quel médicament donner et à quelle dose selon le poids de votre enfant.


**Bien prendre la température.** Utilisez un thermomètre électronique et la même méthode à chaque fois pour pouvoir comparer. Notez l’heure et la valeur. Inutile de reprendre la température toutes les heures si votre enfant va bien : l’Assurance Maladie insiste sur la surveillance du **comportement** et de l’**hydratation**, plus parlante que le thermomètre.

**Les médicaments : prudence.** Ne donnez jamais deux médicaments contre la fièvre en même temps sans avis médical, vérifiez qu’ils ne contiennent pas la même substance (attention aux médicaments « contre le rhume »), et respectez les intervalles entre deux prises indiqués par le médecin ou le pharmacien. Rangez les flacons hors de portée : un enfant fiévreux reste un enfant curieux.

## Au quotidien
- **Température de la pièce** : 18 à 20 °C, sans surchauffer.
- **Vêtements** : retirez une épaisseur pour que la chaleur s’évacue, sans le laisser grelotter.
- **Boire** : eau fraîche ou boisson qu’il aime, souvent, même s’il ne demande pas. C’est essentiel pour éviter la déshydratation.
- **Pas de bain froid** : une eau beaucoup plus froide que son corps peut le faire frissonner et le mettre mal à l’aise.
- **Notez** les températures, ce qu’il boit et son comportement : ces informations aident beaucoup le médecin.
- **Laissez-le se reposer** à la maison s’il se sent mal ; il reprendra ses activités quand il ira mieux.

## Questions fréquentes
**Faut-il réveiller mon enfant pour lui donner son médicament ?**
Le traitement vise le confort : un enfant qui dort paisiblement n’a en général pas besoin d’être réveillé. En cas de doute, demandez au médecin ou au pharmacien.

**Il a fait une convulsion avec la fièvre, est-ce grave ?**
Une convulsion fébrile est très impressionnante. L’Assurance Maladie indique qu’elle est généralement sans conséquence sur le cerveau et ne se reproduit en général pas, mais elle justifie de consulter. Si la crise dure, se répète ou si l’enfant ne reprend pas vite conscience, appelez le 15.

**Combien de temps une fièvre peut-elle durer ?**
Consultez dans la journée si elle persiste plus de deux jours chez un enfant de moins de deux ans, plus de trois jours après deux ans, ou si elle revient après avoir disparu plus de 24 heures.

## Quand demander conseil
**Urgence (15 ou 112)** : nourrisson de moins de 3 mois qui a de la fièvre, ou, à tout âge, température supérieure à 40 °C ; état général qui se dégrade (refus de boire ou de manger, somnolence, réagit peu, cris faibles, peau marbrée) ; maux de tête importants, raideur de la nuque ou vomissements ; signes de déshydratation (bouche sèche, urines rares) ; douleurs abdominales avec diarrhée abondante ; difficultés à respirer (respiration rapide, pauses, creusement entre les côtes).

**Dans la journée** : enfant suivi pour une maladie chronique, fièvres fréquentes, fièvre qui dure ou qui revient, convulsion fébrile, ou tout autre symptôme qui vous inquiète.

${FIN}`,
  },
  {
    ...CHILD, slug: 'varicelle-chez-l-enfant', category: 'sante-enfant', tags: ['varicelle', 'éruption', 'contagion'],
    title: 'Varicelle : soulager votre enfant et éviter les complications',
    summary: 'Boutons qui grattent, fièvre, éviction : les soins de peau recommandés, les médicaments à éviter et les signes de complication.',
    sources: [S.varicelle],
    body_md: `## En bref
- La varicelle donne des **boutons (vésicules)** qui démangent, souvent avec de la **fièvre**.
- Soins de peau : **douche deux fois par jour** avec un produit lavant doux, séchage en tamponnant, **ongles courts**.
- **Pas d’ibuprofène, pas d’aspirine** : demandez au pharmacien ou au médecin quel médicament convient.
- L’enfant reste à la maison **jusqu’au stade de croûtes**.

## Comprendre
La varicelle est une maladie virale très contagieuse, surtout fréquente dans l’enfance. Elle se manifeste par des boutons remplis de liquide qui apparaissent par poussées, accompagnés d’une fièvre parfois élevée et de démangeaisons. Le grattage est le principal ennemi : il peut abîmer la peau, laisser des cicatrices et favoriser une surinfection par des bactéries.

L’Assurance Maladie rappelle que certains médicaments doivent être évités : l’**ibuprofène** et le **kétoprofène** (anti-inflammatoires) augmentent le risque de complications bactériennes, et l’**aspirine** expose à un syndrome rare mais grave (syndrome de Reye). Pour la fièvre mal supportée, le paracétamol peut être utilisé ; la dose dépend du poids : demandez-la à votre pharmacien ou à votre médecin.

Prévenez la crèche, l’école ou la personne qui garde votre enfant : la varicelle peut être dangereuse pour les **femmes enceintes non immunisées** et les personnes immunodéprimées.


**Comment évolue-t-elle ?** Les boutons apparaissent par poussées successives : on peut donc voir en même temps des boutons récents remplis de liquide et d’autres déjà en croûte. Les démangeaisons sont souvent le plus difficile à vivre, surtout le soir. Des vêtements légers, une chambre fraîche, des activités calmes qui occupent les mains (dessin, pâte à modeler, histoires) aident à penser à autre chose qu’au grattage.

**Protéger l’entourage.** La varicelle est très contagieuse. En prévenant la crèche, l’école ou l’assistante maternelle, vous permettez aux autres familles de surveiller leurs enfants et de protéger les personnes fragiles : femmes enceintes non immunisées, nourrissons, personnes immunodéprimées. Un adulte non immunisé en contact avec un enfant malade doit demander conseil à son médecin.

## Au quotidien
- **Douche plutôt que bain**, deux fois par jour, avec un produit doux ; séchez en tamponnant, sans frotter.
- **Eau et savon** plutôt que des antiseptiques (des réactions allergiques graves à la chlorhexidine ont été signalées).
- **Pas de talc, de poudre ni de crème** contenant un antibiotique, un antiviral ou un anesthésique.
- **Ongles courts et propres**, mains lavées souvent ; chez le tout-petit, des gants la nuit peuvent limiter le grattage.
- **Fièvre** : ne pas trop couvrir, faire boire souvent, aérer la chambre autour de 19 °C.
- **Vêtements amples** en coton pour moins d’irritation.

## Questions fréquentes
**Quand peut-il retourner à l’école ?**
L’Assurance Maladie conseille de garder l’enfant à la maison jusqu’à ce que les boutons soient au stade de croûtes.

**Je suis enceinte et mon enfant a la varicelle : que faire ?**
Si vous n’êtes pas sûre d’être immunisée, consultez rapidement : une varicelle pendant la grossesse nécessite un avis médical urgent.

**Existe-t-il un vaccin ?**
Oui, il est recommandé pour certains enfants à risque dès 12 mois et à partir de 12 ans pour ceux qui ne l’ont jamais eue. Parlez-en à votre médecin.

**Les cicatrices sont-elles inévitables ?**
Limiter le grattage et garder la peau propre réduit le risque de marques durables.

## Quand demander conseil
**Dans la journée** : bébé de moins de 6 mois, enfant avec une maladie de peau chronique, un déficit immunitaire ou un traitement par corticoïdes au long cours ; boutons qui se creusent, se remplissent de pus ou de sang avec une fièvre élevée ; toux (risque d’atteinte pulmonaire).

**Urgence (15 ou 112)** : changement de comportement, forte fièvre, troubles de l’équilibre ou état confus.

${FIN}`,
  },
  {
    ...CHILD, slug: 'syndrome-pieds-mains-bouche', category: 'sante-enfant', tags: ['pieds-mains-bouche', 'éruption', 'collectivité'],
    title: 'Syndrome pieds-mains-bouche : que faire à la maison ?',
    summary: 'Petites vésicules sur les mains, les pieds et dans la bouche : comment soulager, faire boire et quand consulter.',
    sources: [S.pmb],
    body_md: `## En bref
- La maladie se traduit par de **petites vésicules sur les mains, les pieds et dans la bouche**, parfois avec de la **fièvre**.
- L’enjeu principal est de **faire boire** l’enfant malgré la gêne dans la bouche.
- **Aliments froids ou tièdes et mous** : laitages frais, glaces, purées, soupes tièdes.
- **Prévenez la crèche ou l’école** ; l’éviction n’est pas obligatoire.

## Comprendre
Le syndrome pieds-mains-bouche est une infection virale fréquente chez les jeunes enfants, surtout en collectivité. Les lésions de la bouche peuvent rendre l’alimentation et la boisson douloureuses : c’est ce qui fait le plus souvent la gêne, et le risque principal est la déshydratation.

L’Assurance Maladie conseille, si les lésions sont nombreuses, de garder l’enfant à la maison jusqu’à ce qu’il se sente mieux et de prendre rendez-vous chez le médecin. Les femmes enceintes doivent éviter les contacts étroits avec une personne malade, car le virus peut être transmis au fœtus.


**À quoi ressemblent les lésions ?** Il s’agit de petites bulles ou de petites taches, souvent sur la paume des mains, la plante des pieds, autour de la bouche et à l’intérieur (gencives, langue, joues), parfois aussi sur les fesses. Elles peuvent être douloureuses, surtout dans la bouche, ce qui explique que l’enfant refuse de manger ou de boire.

**Hygiène pour limiter la transmission.** Le lavage des mains à l’eau et au savon est le geste le plus utile, pour l’enfant comme pour les adultes, en particulier après le change, le mouchage et avant les repas. Lavez régulièrement les jouets et objets portés à la bouche, et évitez de partager couverts, verres et serviettes pendant la maladie.

## Au quotidien
- **Boire souvent**, par petites quantités. En cas de refus de manger, de vomissements ou de diarrhée, utilisez une **solution de réhydratation orale** (SRO), disponible en pharmacie.
- **Repas** : privilégiez le froid (yaourts, fromages blancs, glaces) et le tiède (purées, soupes) ; évitez le chaud, le dur et l’acide.
- **Peau** : savon doux, séchage par tamponnement, ongles coupés et brossés, mains lavées souvent ; pas de talc, de poudre ni de crème. Demandez au pharmacien quel antiseptique local utiliser.
- **Fièvre** : ne pas trop couvrir, faire boire, chambre à 19 °C. Demandez au pharmacien ou au médecin quel médicament donner et à quelle dose ; n’utilisez pas d’aspirine sans avis médical, et l’ibuprofène est déconseillé en cas de déshydratation.
- **Hygiène** : lavage des mains de toute la famille, surtout après le change ou les toilettes.

## Questions fréquentes
**Mon enfant peut-il aller à l’école ?**
L’éviction n’est pas obligatoire : un enfant avec peu de lésions et qui se sent bien peut y aller. Prévenez l’établissement.

**Combien de temps cela dure-t-il ?**
Consultez si les symptômes ne s’améliorent pas, ou s’aggravent, au bout d’une semaine.

**Peut-on l’attraper plusieurs fois ?**
Plusieurs virus peuvent être en cause ; demandez à votre médecin si votre enfant a déjà eu des épisodes.

## Quand demander conseil
**Consultez** si les lésions sont nombreuses ou ne s’améliorent pas après une semaine ; **dans la journée** si l’enfant a moins de 6 mois, une maladie de peau (eczéma, impétigo) avec de nombreuses vésicules, un traitement au long cours, ou si une femme enceinte de l’entourage est malade.

**Signes d’alerte** : signes de déshydratation (bouche sèche, urines rares, enfant abattu), vésicules qui se remplissent de pus ou se creusent, toux avec difficultés à respirer, changement de comportement, fièvre avec maux de tête importants et vomissements. En cas de signe grave, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'scarlatine-chez-l-enfant', category: 'sante-enfant', min_age_months: 36, tags: ['scarlatine', 'angine', 'streptocoque'],
    title: 'Scarlatine : reconnaître les signes et bien la soigner',
    summary: 'Angine, fièvre brutale puis éruption rugueuse : comment se transmet la scarlatine, comment elle se diagnostique et ce qu’il faut surveiller.',
    sources: [S.scarlatine, S.scarlatineTraitement],
    body_md: `## En bref
- La scarlatine est due à une **bactérie, le streptocoque du groupe A**.
- Elle touche surtout les enfants de **5 à 10 ans**, en hiver, souvent par petites épidémies à l’école.
- Elle commence par une **fièvre brutale et une angine**, puis une **éruption rouge et rugueuse** apparaît.
- Un **test rapide** confirme le streptocoque ; un **antibiotique** est alors prescrit et réduit fortement la durée de contagion.

## Comprendre
Selon l’Assurance Maladie, la bactérie se trouve dans les sécrétions du nez et de la gorge. Elle se transmet par la toux, les éternuements, les postillons, les baisers, par les mains portées à la bouche ou au nez, plus rarement par des objets. Une personne est contagieuse avant même d’avoir des symptômes.

Après une incubation de 1 à 4 jours, la fièvre monte brutalement, avec un mal de gorge, des difficultés à avaler, des amygdales et des ganglions du cou gonflés. Maux de tête, nausées, vomissements ou douleurs de ventre sont possibles. Un à deux jours plus tard, une éruption rouge et rugueuse apparaît, d’abord dans les plis (aisselles, coudes, aine), puis sur le tronc, le visage et les extrémités, en épargnant le tour de la bouche, les paumes et les plantes. La langue devient blanche puis rouge framboise. Il existe aussi des formes plus discrètes.

Le médecin pose le diagnostic à l’examen et peut réaliser un **test rapide d’orientation diagnostique (TROD)**, indolore, recommandé à partir de 3 ans. Sans traitement, la contagion dure 10 à 21 jours ; avec un traitement adapté, elle tombe à **24 à 48 heures**.


**Une maladie qui touche surtout les écoliers.** Selon l’Assurance Maladie, la scarlatine est rare avant 2 ans, car les anticorps de la mère protègent le bébé, et vers 10 ans environ 80 % des enfants ont développé des anticorps qui les protègent ensuite. Elle circule surtout en hiver, par petites épidémies dans les écoles.

**Prévenir la transmission à la maison.** Pendant les premiers jours, évitez de partager verres, couverts et serviettes, lavez-vous souvent les mains et aérez les pièces. Si un autre enfant de la fratrie présente à son tour de la fièvre et un mal de gorge, consultez : il pourra aussi bénéficier d’un test rapide.

## Au quotidien
- **Donnez l’antibiotique jusqu’au bout**, à l’heure et pendant toute la durée prescrite, même si votre enfant va mieux.
- Pour la fièvre et la douleur, demandez au médecin le médicament et la dose adaptés ; les comprimés et gélules sont contre-indiqués avant 6 ans (risque de fausse route) : préférez les formes pédiatriques.
- **Repas froids ou tièdes**, boissons fréquentes : la gorge est douloureuse.
- **Lavage des mains** de toute la famille, mouchoirs jetables, pas de partage de verres.
- Vers le 7e au 15e jour, la peau des paumes et des plantes peut **peler** : signalez-le au médecin.

## Questions fréquentes
**Quand peut-il retourner à l’école ?**
Demandez à votre médecin : sous traitement adapté, la contagion ne dure plus que 24 à 48 heures.

**Les adultes peuvent-ils l’attraper ?**
C’est rare. Si une femme enceinte de l’entourage a été en contact, elle doit en informer son médecin.

**Pourquoi un antibiotique alors que les angines sont souvent virales ?**
Parce que la scarlatine est bactérienne : le traitement réduit la contagion et sert surtout à prévenir des complications, rares mais possibles.

## Quand demander conseil
Reconsultez si l’éruption dure plus longtemps que prévu, si la fièvre et les douleurs persistent une semaine après le début du traitement, ou si apparaissent des douleurs d’oreille, de front ou des articulations. En cas de difficulté à respirer, d’enfant très abattu ou difficile à réveiller, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'otite-chez-l-enfant', category: 'sante-enfant', tags: ['otite', 'oreille', 'ORL', 'fièvre'],
    title: 'Otite de l’enfant : soulager et savoir quand reconsulter',
    summary: 'Fièvre, douleur d’oreille, nez qui coule : ce que vous pouvez faire à la maison et les signes qui justifient un avis rapide.',
    sources: [S.otite],
    body_md: `## En bref
- L’otite moyenne aiguë associe souvent **fièvre** et **douleur d’oreille**, avec un **nez qui coule ou bouché**.
- Chez le jeune enfant, elle peut se manifester seulement par de l’**irritabilité**, moins d’appétit ou moins d’activité.
- **Consultez** dès l’apparition des signes : le médecin examine le tympan.
- **Lavages de nez** au sérum physiologique et confort contre la douleur sont la base.

## Comprendre
L’otite moyenne aiguë est une infection de l’oreille moyenne, derrière le tympan, souvent à la suite d’un rhume. Selon l’Assurance Maladie, une fièvre entre 38 et 39 °C n’est pas inquiétante en soi : elle aide l’organisme à lutter contre les microbes. Le médecin décide, selon l’âge et l’examen, si un antibiotique est utile.

Pour la douleur et la fièvre, le paracétamol est le médicament de référence en l’absence de contre-indication ; les anti-inflammatoires (ibuprofène, kétoprofène) nécessitent un avis médical, et l’aspirine ne doit pas être donnée sans avis médical. Les décongestionnants nasaux (vasoconstricteurs) sont contre-indiqués avant 15 ans.


**Pourquoi les enfants font-ils autant d’otites ?** Chez le jeune enfant, la petite trompe qui relie le nez à l’oreille est courte et fonctionne moins bien : lors d’un rhume, les sécrétions et les microbes remontent facilement vers l’oreille moyenne. C’est pourquoi l’otite suit si souvent une rhinopharyngite, et pourquoi le **lavage de nez** est un geste utile.

**Soulager la douleur la nuit.** Un médicament contre la douleur, donné selon les conseils du médecin ou du pharmacien, et votre présence rassurante aident à passer la nuit. Ne mettez jamais d’oreiller sous la tête d’un bébé.

## Au quotidien
- **Nez** : mouchoirs jetables, sérum physiologique ou eau de mer, pulvérisateurs adaptés à l’âge ; limitez le mouche-bébé.
- **Fièvre** : pièce fraîche et aérée, ne pas trop couvrir, faire boire souvent ; pas de bain froid.
- **Air** : évitez la fumée de cigarette, qui aggrave les infections ORL, et le climatiseur, qui assèche les muqueuses.
- **Tympan percé** : ne mouillez pas l’oreille pendant la toilette tant que dure la perforation.
- **Avion** : évitez-le pendant la phase aiguë.
- L’éviction n’est pas obligatoire : gardez l’enfant à la maison s’il se sent mal, pour son confort.

## Questions fréquentes
**Faut-il toujours un antibiotique ?**
Non : c’est le médecin qui décide selon l’âge, les symptômes et l’aspect du tympan.

**Mon enfant fait des otites à répétition, que faire ?**
Parlez-en à votre médecin : il pourra orienter vers un ORL, notamment si les symptômes reviennent juste après un traitement.

**Peut-il aller à la piscine ?**
Pas tant que le tympan est perforé. Demandez au médecin quand la baignade est de nouveau possible.

## Quand demander conseil
**Reconsultez** si les symptômes persistent au-delà de deux à trois jours (avec ou sans antibiotique), s’ils reviennent dans les quatre jours suivant la fin des antibiotiques, ou si une toux dure plus de dix jours.

**Urgence (15 ou 112)** : enfant de moins de 3 mois avec de la fièvre, fièvre de 40 °C ou plus, difficultés à respirer, somnolence ou réaction faible, pâleur marquée ou taches violacées, maux de tête violents, vomissements ou pleurs inexpliqués, diarrhée ou vomissements importants pouvant entraîner une déshydratation.

${FIN}`,
  },
  {
    ...CHILD, slug: 'angine-chez-l-enfant', category: 'sante-enfant', tags: ['angine', 'mal de gorge', 'antibiotiques', 'TROD'],
    title: 'Angine de l’enfant : virale ou bactérienne, que faire ?',
    summary: 'La plupart des angines sont virales : le test rapide permet de savoir si un antibiotique est utile. Conseils de confort et signes à surveiller.',
    sources: [S.angine, S.angineTraitement],
    body_md: `## En bref
- L’angine est une **inflammation des amygdales**, le plus souvent **virale**.
- Chez l’enfant, on ne peut pas savoir à l’œil nu si elle est virale ou bactérienne : le **test rapide (TROD)** tranche à partir de **3 ans**.
- Les **antibiotiques** ne servent que si le test est **positif** (streptocoque du groupe A).
- **Repas froids, boissons fréquentes**, repos : la base du confort.

## Comprendre
Selon l’Assurance Maladie, l’angine se manifeste par un mal de gorge, une difficulté à avaler et de la fièvre, parfois avec un rhume, une toux, une voix enrouée ou des maux de tête. Chez l’enfant, vomissements et douleurs de ventre sont fréquents. Les amygdales peuvent être rouges ou recouvertes d’un enduit blanchâtre.

Chez l’enfant, l’angine est virale dans **60 à 75 %** des cas. Les antibiotiques n’ont aucun effet sur les virus. Le **TROD angine** est un prélèvement indolore sur les amygdales, réalisé en quelques minutes par le médecin (ou le pharmacien selon l’âge) : il indique si un streptocoque du groupe A est en cause. Avant 3 ans, il est inutile, car l’angine à streptocoque y est très rare.

L’évolution est naturellement favorable : une angine virale guérit en trois à cinq jours. Lorsque le test est positif, l’antibiotique sert surtout à prévenir des complications rares mais sérieuses.


**Pourquoi le test est-il si utile ?** Chez l’adulte, certains signes orientent vers une angine bactérienne, mais chez l’enfant l’aspect de la gorge ne permet pas de faire la différence. Le TROD évite donc de donner des antibiotiques inutiles, qui n’ont aucun effet sur les virus et favorisent les résistances. Quand il est positif, il permet au contraire de traiter rapidement l’angine à streptocoque.

**Bien vivre les jours de mal de gorge.** Proposez des boissons fraîches à volonté, des aliments froids et mous (yaourts, compotes, purées tièdes), des temps calmes et du repos. Un enfant qui mange peu pendant deux ou trois jours n’est pas inquiétant s’il boit bien et garde son entrain entre deux pics de fièvre.

## Au quotidien
- **Douleur et fièvre** : demandez au médecin ou au pharmacien le médicament et la dose adaptés au poids ; l’aspirine ne doit pas être donnée à l’enfant, et les anti-inflammatoires sont à éviter sauf avis médical.
- **Alimentation** : froid, mou, peu acide et peu épicé ; glaces et compotes passent souvent mieux.
- **Boire beaucoup**, se reposer, maison autour de 19 °C, pas de fumée de tabac.
- **Pas de gargarismes** chez l’enfant (risque de fausse route).
- **Si un antibiotique est prescrit**, suivez l’ordonnance jusqu’au bout, même si votre enfant va mieux.

## Questions fréquentes
**Pourquoi le médecin ne prescrit-il pas d’antibiotique ?**
Parce que l’angine est probablement virale (test négatif ou enfant de moins de 3 ans) : un antibiotique n’apporterait rien et exposerait à des effets indésirables.

**Mon enfant fait beaucoup d’angines, faut-il enlever les amygdales ?**
Des angines à répétition peuvent conduire à un avis ORL : parlez-en à votre médecin.

**Combien de temps est-il contagieux ?**
Demandez au médecin ; sous antibiotique (angine bactérienne), la contagion diminue rapidement.

## Quand demander conseil
Consultez si la douleur est très forte, si l’enfant n’arrive plus à avaler sa salive ou à boire, si la fièvre persiste plusieurs jours, si un côté de la gorge ou du cou gonfle, ou si des douleurs articulaires apparaissent ensuite. **Appelez le 15 ou le 112** en cas de difficulté à respirer, de bave abondante avec impossibilité d’avaler, ou d’enfant très abattu.

${FIN}`,
  },
  {
    ...CHILD, slug: 'gastro-enterite-enfant-hydratation', category: 'sante-enfant', safety_critical: true, tags: ['gastro', 'diarrhée', 'vomissements', 'déshydratation', 'SRO'],
    title: 'Gastro-entérite de l’enfant : réhydrater et surveiller',
    summary: 'Solution de réhydratation, alimentation adaptée, ce qu’il ne faut pas faire et les signes de déshydratation qui imposent de consulter vite.',
    sources: [S.gastro],
    body_md: `## En bref
- Le risque principal d’une gastro-entérite est la **déshydratation**, surtout chez le tout-petit.
- La **solution de réhydratation orale (SRO)**, en pharmacie, est le traitement de base ; pas d’eau pure seule ni de sodas.
- Après 2 ans, l’enfant **boit bien et continue de manger** varié, en évitant les aliments difficiles à digérer.
- Plusieurs signes imposent de **consulter sans délai** : ils sont listés plus bas.

## Comprendre
La gastro-entérite provoque une diarrhée, parfois des vomissements et de la fièvre. Elle est le plus souvent virale et guérit seule en quelques jours. Ce qui compte, c’est de **compenser les pertes d’eau et de sels minéraux**. Selon l’Assurance Maladie, une diarrhée aiguë chez un enfant de moins de 2 ans justifie une consultation rapide ; en attendant, on continue l’alimentation habituelle (allaitement ou lait habituel) complétée par la SRO. Pour les moins de 5 ans, la SRO est prise en charge sur prescription.

Chez l’enfant plus grand, il faut **bien boire** (bouillons de légumes, SRO) et garder une alimentation variée pour éviter la dénutrition. Riz, banane, pommes cuites, pain grillé sont conseillés ; les aliments laxatifs ou difficiles à digérer sont à éviter. L’alimentation habituelle se reprend progressivement sur trois à quatre jours.


**Comment donner la solution de réhydratation ?** Préparez-la exactement comme indiqué sur la notice, avec la quantité d’eau prévue. Proposez-en très souvent, en petites quantités : une cuillère ou une gorgée toutes les quelques minutes est mieux tolérée qu’un grand verre d’un coup. Conservez-la au réfrigérateur et jetez ce qui reste après le délai indiqué. Pour un nourrisson nourri au lait infantile, la solution peut remplacer le lait pendant une courte période, selon les conseils du médecin.

**Prévenir la contagion.** Les virus de la gastro-entérite se transmettent très facilement par les mains et les surfaces. Lavez-vous les mains après chaque change ou passage aux toilettes, nettoyez les toilettes et les surfaces souvent touchées, et évitez de partager le linge de toilette.

## Au quotidien
- **SRO fraîche, par petites gorgées** ou à la cuillère, très souvent, surtout s’il vomit.
- **Respectez la dilution** indiquée : ne la modifiez jamais.
- **Ne donnez pas** : eau seule, sodas ou boissons très sucrées, médicaments contre les vomissements ou anti-diarrhéiques sans avis médical, argiles chez le moins de 2 ans. En cas de fièvre, évitez les anti-inflammatoires (contre-indiqués en cas de déshydratation) : demandez conseil au pharmacien.
- **Surveillez** : ce qu’il boit, les vomissements, les selles, les urines, la température et son comportement.
- **Hygiène** : lavage des mains très régulier de toute la famille, surtout après les toilettes et avant les repas.

## Questions fréquentes
**Faut-il le mettre à la diète ?**
Non : il faut au contraire continuer à le nourrir, en adaptant les aliments, pour éviter la dénutrition.

**Il vomit tout ce qu’il boit, que faire ?**
Proposez la SRO très froide, par toutes petites quantités rapprochées. Si les vomissements persistent malgré la SRO, consultez sans délai.

**Peut-il aller à l’école ?**
Gardez-le à la maison tant qu’il est malade et fatigué. Une consultation est nécessaire si plusieurs enfants sont touchés dans une collectivité (toxi-infection).

## Quand demander conseil
**Consultez sans délai ou allez aux urgences** si : l’enfant vomit de façon répétée et ne boit plus, ou ne mange ni ne boit ; la diarrhée dure plus de deux jours ou s’aggrave ; la fièvre dépasse 38,5 °C ; les selles contiennent des glaires ou du sang ; il présente des **signes de déshydratation** : agitation inhabituelle ou au contraire apathie et somnolence, difficulté à le réveiller, gémissements, pâleur, yeux creux et cernés, langue sèche, respiration rapide, perte de poids.

Les moins de 6 mois et les enfants atteints de maladies chroniques sont particulièrement exposés. En cas d’enfant très abattu ou difficile à réveiller, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'asthme-de-l-enfant', category: 'sante-enfant', min_age_months: 36, safety_critical: true, tags: ['asthme', 'respiration', 'PAI', 'école'],
    title: 'Asthme de l’enfant : reconnaître, suivre, vivre au quotidien',
    summary: 'Sifflements, toux de nuit, gêne à l’effort : les signes de l’asthme, ses déclencheurs, l’organisation à l’école et les signes de crise grave.',
    sources: [S.asthme, S.asthmeEcole, S.asthmeSuivi],
    body_md: `## En bref
- L’asthme se manifeste par des **sifflements à l’expiration**, une **toux** (souvent la nuit), une **gêne respiratoire** ou une oppression dans la poitrine.
- Les déclencheurs fréquents : **infections virales**, froid, allergènes, effort, rire, **tabagisme passif**.
- Le médecin établit un **plan d’action** personnalisé ; à l’école, un **PAI** organise la conduite à tenir.
- Une **crise grave** est une urgence : **15 ou 112**.

## Comprendre
Selon l’Assurance Maladie, chez l’enfant de plus de 3 ans les symptômes varient dans le temps et en intensité ; ils apparaissent ou s’aggravent souvent la nuit, surtout en deuxième partie de nuit. Une toux sèche, isolée, déclenchée par les émotions ou les fous rires peut être un équivalent d’asthme. L’**asthme d’effort** apparaît en général 5 à 10 minutes après l’arrêt d’un exercice intense et disparaît en moins d’une heure.

Le diagnostic repose sur l’examen médical et sur des **épreuves fonctionnelles respiratoires** réalisées hors crise : la spirométrie est possible dès 6 ans, d’autres examens sont plus adaptés entre 3 et 6 ans. Des tests cutanés peuvent rechercher une allergie. L’arrêt d’un traitement de fond, une exposition massive à un allergène ou le tabagisme passif peuvent favoriser une exacerbation.


**Bien utiliser les traitements inhalés.** Les médicaments de l’asthme se prennent le plus souvent par inhalation. L’Assurance Maladie conseille de vous assurer que votre enfant maîtrise bien les techniques d’inhalation : demandez au médecin de vous les montrer et posez-lui toutes vos questions. Le traitement prescrit pour tous les jours se prend même quand l’enfant va bien ; le traitement **de secours** (inhalateur) est à garder à portée de main. En cas de crise, suivez la prescription ou le **plan d’action écrit**.

**Un suivi régulier.** L’asthme évolue avec l’âge, les saisons et l’environnement. Des consultations régulières permettent d’ajuster le traitement, de faire le point sur les crises et les réveils nocturnes, et de mettre à jour le plan d’action et le PAI.

## Au quotidien
- **Suivez le plan d’action** remis par le médecin et gardez les médicaments nécessaires à la maison.
- **Ne stoppez pas le traitement de fond** pendant les vacances sans avis médical : les crises augmentent chaque année en septembre, dès la rentrée. Si le traitement a été arrêté, reprenez-le 7 à 10 jours avant la rentrée ou dès que possible, après avis médical.
- **À l’école** : demandez un **projet d’accueil individualisé (PAI)**. Établi à la demande de la famille avec le directeur et le médecin scolaire, il peut préciser les aménagements, les dispenses avec activités de remplacement, les médicaments et les gestes d’urgence.
- **Logement sans tabac**, aération régulière, attention aux allergènes connus.
- **Activité physique** : parlez-en avec le médecin, qui adaptera le plan d’action pour que votre enfant puisse bouger.

## Questions fréquentes
**Mon enfant tousse surtout la nuit, est-ce de l’asthme ?**
C’est possible, mais d’autres causes existent : seul le médecin peut le dire, après examen et éventuellement des tests respiratoires.

**Peut-il faire du sport ?**
Oui, le plus souvent, avec un traitement adapté : demandez au médecin comment prévenir l’asthme d’effort.

**Le PAI suffit-il ?**
Le PAI organise l’accueil, mais ne dégage pas les parents de leurs responsabilités : informez aussi les autres adultes qui encadrent l’enfant (centre de loisirs, sport).

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de grande difficulté à respirer avec creusement des côtes ou de la poitrine à chaque inspiration, lèvres ou ongles bleutés, narines qui se dilatent, difficulté à parler ou à marcher, confusion ou perte de connaissance.

**Consultez** si les symptômes reviennent souvent, réveillent votre enfant la nuit, le gênent dans ses activités, ou si le traitement de crise est utilisé plus souvent que prévu.

${FIN}`,
  },
  {
    ...CHILD, slug: 'allergies-alimentaires-enfant', category: 'sante-enfant', safety_critical: true, tags: ['allergie', 'alimentation', 'anaphylaxie', 'PAI', 'étiquettes'],
    title: 'Allergies alimentaires de l’enfant : repérer, éviter, réagir',
    summary: 'Aliments en cause, symptômes, lecture des étiquettes, PAI et trousse d’urgence : l’essentiel pour protéger un enfant allergique.',
    sources: [S.allergie, S.allergieQueFaire],
    body_md: `## En bref
- Chez l’enfant, les allergies concernent surtout les **protéines du lait de vache, l’œuf, l’arachide, les fruits à coque, le poisson** et certains fruits exotiques.
- Les signes peuvent être **cutanés, digestifs ou respiratoires** ; la forme la plus grave est le **choc anaphylactique**.
- Le diagnostic repose sur un **bilan** (allergologue) ; ensuite, **l’aliment en cause est supprimé**.
- Les étiquettes signalent **14 allergènes** ; à l’école, un **PAI** organise l’accueil et les gestes d’urgence.

## Comprendre
Selon l’Assurance Maladie, l’allergie alimentaire est une réaction anormale du système immunitaire à un aliment habituellement inoffensif. Les symptômes peuvent être respiratoires (rhinite, toux, crise d’asthme), cutanés (démangeaisons, urticaire, eczéma, très fréquent chez le jeune enfant allergique) ou digestifs (douleurs de ventre, vomissements, diarrhée). Le **choc anaphylactique** touche plusieurs organes à la fois et met la vie en danger : il nécessite une injection d’adrénaline et une prise en charge hospitalière.

L’allergie est différente de l’**intolérance** (par exemple au lactose), qui n’est pas immunitaire et s’installe dans la durée.

Le bilan comprend un interrogatoire, un suivi de l’alimentation, puis des tests cutanés, une prise de sang ou un test d’éviction-réintroduction ; un test de provocation à l’hôpital n’est fait qu’en cas de doute persistant.


**Au quotidien avec un enfant allergique.** Préparez des en-cas sûrs pour les sorties, les goûters d’anniversaire et les voyages. Apprenez progressivement à votre enfant à reconnaître ses allergènes, à refuser poliment un aliment qu’il ne connaît pas et à dire qu’il est allergique. Prévenez les adultes qui l’encadrent (centre de loisirs, sport, grands-parents) et montrez-leur où se trouve la trousse d’urgence.

**Ne pas confondre.** Une rougeur autour de la bouche après des fraises ou des tomates, un inconfort digestif après un repas copieux ne sont pas forcément une allergie. À l’inverse, une réaction qui survient rapidement après un aliment, surtout si elle touche plusieurs zones du corps, doit être prise au sérieux et faire l’objet d’un avis médical.

## Au quotidien
- **Lisez toutes les étiquettes** : les 14 allergènes (gluten, crustacés, œufs, poissons, arachides, soja, lait, fruits à coque, céleri, moutarde, sésame, sulfites, lupin, mollusques) doivent être mis en évidence. « Peut contenir des traces » signale un risque de contamination.
- **Signalez l’allergie** au restaurant, à la boulangerie, aux grands-parents, aux parents des copains.
- **À l’école ou à la crèche** : demandez un **projet d’accueil individualisé (PAI)**. Il précise le régime, les aliments exclus, les médicaments et les gestes d’urgence ; une trousse d’urgence peut être confiée avec son protocole.
- **Trousse d’urgence** : si le médecin a prescrit un **auto-injecteur d’adrénaline**, gardez-le toujours à portée, entraînez-vous avec le stylo d’entraînement et apprenez aux proches à l’utiliser.
- **Notez** les aliments qui ont provoqué des symptômes, pour les montrer au médecin.

## Questions fréquentes
**Faut-il retirer un aliment « par précaution » ?**
Non : ne supprimez pas d’aliment sans avis médical. Un régime inutile peut déséquilibrer l’alimentation de votre enfant.

**Son allergie peut-elle disparaître ?**
Certaines allergies évoluent avec l’âge. Seul l’allergologue peut décider d’une réintroduction, parfois sous surveillance.

**Après une injection d’adrénaline, faut-il quand même aller à l’hôpital ?**
Oui : une surveillance médicale et une prise en charge hospitalière sont nécessaires après toute injection.

## Quand demander conseil
**Appelez immédiatement le 15 ou le 112** (appels gratuits, même sans crédit) en cas de gonflement du visage ou de la gorge, difficultés à respirer, voix changée, malaise, pâleur, vomissements répétés après un aliment, ou si plusieurs signes apparaissent ensemble. Utilisez l’auto-injecteur s’il a été prescrit, sans attendre les secours.

**Consultez** votre médecin pour toute réaction, même légère, après un aliment.

${FIN}`,
  },
  {
    ...CHILD, slug: 'poux-chez-l-enfant', category: 'sante-enfant', max_age_months: 131, tags: ['poux', 'lentes', 'école'],
    title: 'Poux : les repérer et s’en débarrasser sans s’épuiser',
    summary: 'Comment chercher les poux, traiter efficacement en deux fois, s’occuper du linge et ce qui ne sert à rien.',
    sources: [S.pouxReconnaitre, S.poux],
    body_md: `## En bref
- Les poux touchent surtout les **enfants de 3 à 10 ans** en collectivité ; ils ne sont **pas un signe de mauvaise hygiène** et ne transmettent pas de maladie.
- Cherchez-les **mèche par mèche**, derrière les oreilles et sur la nuque, avec un **peigne fin** sur cheveux mouillés.
- Traitez **seulement les personnes infestées**, et **renouvelez l’application 7 à 10 jours plus tard**.
- **Pas d’éviction scolaire** si l’enfant est traité, mais prévenez l’école.

## Comprendre
Selon l’Assurance Maladie, jusqu’à 20 % des écoliers peuvent avoir des poux chaque année. Ils se transmettent par contact direct, cheveux à cheveux, et parfois par les objets qui touchent la tête (brosses, bonnets, écharpes, peluches). Ils ne sautent ni ne volent. Dans environ 40 % des cas, ils ne grattent pas, ce qui explique qu’ils passent inaperçus ; sinon, les démangeaisons apparaissent 2 à 6 semaines après la contamination, surtout sur la nuque et les tempes.

Les poux adultes mesurent 2 à 4 mm, gris à bruns. Les **lentes** vivantes sont brillantes, collées près de la racine ; les lentes vides, blanchâtres, adhèrent fortement au cheveu, contrairement aux pellicules.


**Une vérification hebdomadaire.** En période scolaire, prendre l’habitude d’inspecter la chevelure de votre enfant une fois par semaine, au peigne fin sur cheveux mouillés et démêlés, permet de repérer les poux tôt, avant qu’ils ne se multiplient et ne passent à toute la famille. Commencez derrière les oreilles et sur la nuque, mèche par mèche, sous une bonne lumière.

**Dédramatiser pour l’enfant.** Avoir des poux n’a rien de honteux : ils ne choisissent pas les cheveux sales. Expliquez-le à votre enfant, qui peut être moqué, et rappelez-lui de ne pas échanger bonnets, écharpes, casques ou brosses avec ses camarades.

## Au quotidien
- **Produits** : des produits à base de pyréthrine sont vendus sans ordonnance ; ceux à base de diméticone agissent par asphyxie. Lisez la notice et respectez la durée de pose. En cas d’asthme, préférez les lotions aux sprays.
- **Mode d’emploi** : appliquer sur cheveux secs, laisser poser, shampoing doux, **peigne fin**, puis sécher. **Recommencez 7 à 10 jours plus tard** pour éliminer les poux sortis des lentes. Contrôlez deux jours après.
- **Avant 2 ans** : évitez les insecticides ; peignez au peigne fin chaque jour pendant deux semaines, sur cheveux mouillés enduits de démêlant.
- **Linge** : lavez taies, bonnets, écharpes à plus de 50 °C ; enfermez les tissus fragiles 3 jours dans un sac fermé ; trempez peignes et brosses puis attendez 3 jours avant de les réutiliser.
- **Prévention** : à l’école, ranger bonnet ou foulard dans la manche du manteau ; ne pas échanger peignes, brosses, casques.

## Questions fréquentes
**Faut-il traiter toute la famille ?**
Vérifiez la tête de chacun et traitez seulement les personnes qui ont des poux. Les traitements préventifs sont inutiles et favorisent la résistance des poux.

**Le vinaigre ou les huiles essentielles marchent-ils ?**
L’eau vinaigrée n’a jamais prouvé son efficacité ; les huiles essentielles non plus, et elles peuvent provoquer des allergies. L’essence et le kérosène sont très dangereux.

**Il se gratte encore après le traitement, est-ce un échec ?**
Les démangeaisons peuvent durer quelques jours sans signifier un échec. Contrôlez au peigne fin.

## Quand demander conseil
Consultez en cas de doute sur la présence de poux, si les poux persistent après **deux traitements bien conduits**, ou si des lésions de grattage s’infectent (croûtes jaunâtres, **impétigo** : l’éviction est alors obligatoire). Le pharmacien peut aussi vous conseiller.

${FIN}`,
  },
  {
    ...CHILD, slug: 'oxyures-vers-chez-l-enfant', category: 'sante-enfant', tags: ['oxyures', 'vers', 'démangeaisons', 'hygiène'],
    title: 'Oxyures (« vers ») : reconnaître et traiter toute la famille',
    summary: 'Démangeaisons de l’anus le soir, petits vers blancs : comment se transmettent les oxyures et comment éviter qu’ils reviennent.',
    sources: [S.oxyures, S.oxyuresTraitement],
    body_md: `## En bref
- L’oxyurose est une **parasitose intestinale très fréquente** chez l’enfant, due à un petit ver blanc.
- Signe typique : **démangeaisons anales le soir et la nuit**.
- Le traitement se prend **en une fois puis se renouvelle deux à trois semaines plus tard**, pour **toute la famille en même temps**.
- **Ongles courts, mains lavées, linge changé** : l’hygiène évite la recontamination.

## Comprendre
Selon l’Assurance Maladie, l’enfant avale des œufs présents sur ses mains, dans les aliments ou sur des objets (vêtements, literie). Les larves deviennent adultes dans l’intestin en environ trois semaines ; les femelles pondent autour de l’anus, surtout la nuit. Le grattage dépose de nouveaux œufs sous les ongles, ce qui entretient la contamination. Les œufs survivent jusqu’à deux semaines hors du corps, d’où la circulation facile en fratrie et en collectivité.

Les symptômes sont souvent discrets : démangeaisons anales, diarrhées épisodiques, douleurs de ventre, irritabilité, sommeil agité ou cauchemars. Chez la petite fille, le grattage peut irriter la vulve. On peut parfois voir de petits vers blancs mobiles de 5 à 12 mm dans les selles, autour de l’anus ou dans les sous-vêtements.


**Pourquoi traiter tout le monde ?** Les œufs, invisibles à l’œil nu, se retrouvent sur les mains, les draps, les vêtements, les jouets. Même sans symptôme, les autres membres de la famille peuvent être porteurs. Traiter tout le foyer en même temps, puis renouveler la prise, évite que les oxyures « passent » d’une personne à l’autre et reviennent sans cesse.

**Expliquer à l’enfant.** Les démangeaisons sont gênantes, surtout la nuit. Expliquez-lui que se gratter fait revenir les vers, proposez des sous-vêtements propres et un pyjama ajusté, et rassurez-le : c’est une infection fréquente, sans lien avec un manque de propreté, qui se traite facilement.

## Au quotidien
- **Demandez conseil au pharmacien** : un antiparasitaire sans ordonnance, en une prise, existe. Il vous orientera vers le médecin en cas de doute.
- **Deuxième prise** deux à trois semaines plus tard, selon la notice, pour limiter la recontamination.
- **Traitez tous les membres du foyer en même temps**.
- **Le jour du traitement** : changez vêtements et linge de lit, lavez à haute température le linge possiblement contaminé, passez l’aspirateur et nettoyez les surfaces.
- **Ensuite** : ongles courts et brossés chaque jour, sous-vêtements et pyjamas changés régulièrement, lavage des mains pour tous après les toilettes et avant les repas.

## Questions fréquentes
**Les démangeaisons continuent après le traitement, est-ce grave ?**
Elles peuvent persister environ une semaine. Si elles durent davantage, consultez.

**Mon chien peut-il transmettre les oxyures ?**
Non : l’oxyure ne touche que l’être humain.

**Comment le médecin confirme-t-il ?**
Par l’examen, et si besoin un « scotch test » : un ruban adhésif appliqué sur les plis de l’anus le matin avant la toilette, analysé en laboratoire.

## Quand demander conseil
Consultez votre médecin en cas de doute sur le diagnostic, si les symptômes persistent malgré le traitement et l’hygiène, si votre enfant a de fortes douleurs de ventre, de la fièvre, des brûlures en urinant ou une perte de poids. En cas de douleur de ventre brutale et intense, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'vue-de-l-enfant-depistage', category: 'sante-enfant', tags: ['vue', 'yeux', 'dépistage', 'strabisme', 'amblyopie'],
    title: 'La vue de l’enfant : dépistages et signes d’alerte',
    summary: 'Bilans de 3-4 ans et 5-6 ans, strabisme, amblyopie : pourquoi le dépistage précoce compte et quand consulter un ophtalmologiste.',
    sources: [S.yeux, S.sante611],
    body_md: `## En bref
- Dans **trois cas sur quatre**, un enfant qui voit mal **ne se plaint de rien**.
- Des **bilans visuels** sont prévus entre **3 et 4 ans** (PMI), entre **5 et 6 ans** (médecine scolaire) et vers **12 ans**.
- Un **strabisme** (l’enfant « louche »), des maux de tête ou une vision double doivent faire consulter.
- Une **amblyopie** (« œil paresseux ») se soigne bien si elle est repérée tôt.

## Comprendre
Selon l’Assurance Maladie, les yeux des enfants sont fragiles et les troubles de la vue passent souvent inaperçus : l’enfant pense que tout le monde voit comme lui. À chaque examen de suivi, le médecin contrôle les yeux, les paupières et leurs mouvements, et peut orienter vers un ophtalmologiste. Un dépistage gratuit est aussi proposé en petite section de maternelle dans certains départements.

L’**amblyopie** survient quand les deux yeux voient très différemment (myopie, hypermétropie ou astigmatisme d’un seul côté) : le cerveau finit par ignorer l’image de l’œil le moins performant. Traitée tôt, elle guérit ; découverte après 6 ans, elle peut entraîner une perte définitive de la vision d’un œil. C’est pourquoi les dépistages de la petite enfance sont si importants.


**Les troubles les plus fréquents.** La **myopie**, l’**hypermétropie** et l’**astigmatisme** sont des défauts de la vision que seul un examen permet de mesurer ; si besoin, l’ophtalmologiste prescrit des lunettes adaptées. Le **strabisme** (yeux qui ne regardent pas dans la même direction) nécessite toujours un avis spécialisé, à tout âge.

**Après le dépistage scolaire.** Si un courrier vous signale une anomalie, ne l’ignorez pas, même si votre enfant ne se plaint de rien : prenez rendez-vous avec votre médecin ou un ophtalmologiste et apportez le compte rendu du dépistage.

## Au quotidien
- **Ne manquez pas les bilans** prévus et lisez les comptes rendus de dépistage scolaire.
- **Observez** : votre enfant plisse-t-il les yeux, s’approche-t-il beaucoup des écrans ou des livres, penche-t-il la tête, se frotte-t-il souvent les yeux ?
- **Écrans** : fixez des plages horaires et variez les activités, comme le recommande Santé.fr.
- **Lunettes** : si elles sont prescrites, le port régulier est essentiel ; choisissez une monture adaptée et solide.
- **Soleil** : protégez les yeux en été (chapeau, lunettes de soleil adaptées).

## Questions fréquentes
**Mon enfant lit bien, peut-il quand même mal voir ?**
Oui : un œil peut compenser l’autre. Seul un examen permet de le vérifier.

**À quel âge peut-on consulter un ophtalmologiste ?**
À tout âge, dès qu’un signe vous alerte ou que le médecin le conseille.

**Les écrans abîment-ils les yeux ?**
Santé.fr recommande de fixer des plages horaires et de varier les activités. Parlez-en au médecin si votre enfant se plaint de fatigue visuelle ou de maux de tête.

## Quand demander conseil
Consultez un médecin ou un ophtalmologiste si vous remarquez un **strabisme**, des **mouvements anormaux des yeux**, une **tête penchée** pour regarder, des **maux de tête**, une **vision double**, ou si un dépistage est anormal. **En urgence** (urgences ophtalmologiques, ou 15 si nécessaire) : choc ou produit dans l’œil, œil rouge et très douloureux, baisse brutale de la vue.

${FIN}`,
  },
  {
    ...CHILD, slug: 'audition-de-l-enfant', category: 'sante-enfant', tags: ['audition', 'surdité', 'bruit', 'dépistage'],
    title: 'L’audition de l’enfant : dépister et protéger ses oreilles',
    summary: 'Dépistages, signes qui doivent faire penser à une baisse d’audition et gestes simples pour protéger les oreilles du bruit.',
    sources: [S.surdite, S.audition],
    body_md: `## En bref
- L’audition est contrôlée à la **naissance**, lors des examens de **4, 9 et 24 mois**, puis à l’**école (6 et 12 ans)**.
- Un enfant qui **fait souvent répéter**, monte le son ou a des **difficultés de langage** doit être examiné.
- Les **otites à répétition** peuvent diminuer temporairement l’audition.
- **Volume modéré**, distance des enceintes, protection contre les bruits violents : les oreilles sont fragiles.

## Comprendre
Selon l’Assurance Maladie, des visites médicales scolaires incluent un dépistage auditif à 6 et 12 ans, et un dépistage des troubles de la parole est proposé en petite section de maternelle. Toute anomalie conduit vers un ORL. Santé.fr souligne que les parents sont « en première ligne » pour repérer une gêne, car une baisse d’audition peut être partielle, d’un seul côté, ou fluctuer (par exemple avec une otite séreuse).

Signes à connaître : l’enfant réagit peu aux sons ou à votre voix quand il ne vous voit pas, demande souvent de répéter, augmente le volume des écrans, a du mal à suivre en classe ou dans le bruit, parle peu ou de façon peu compréhensible pour son âge. Un comportement agressif ou, au contraire, très réservé peut aussi être un signal. Ces signes n’indiquent pas forcément une surdité, mais justifient un examen.


**Le lien avec le langage et l’école.** Bien entendre est indispensable pour apprendre à parler, à lire et à suivre en classe. Une baisse d’audition, même légère ou d’un seul côté, peut se traduire par des difficultés de prononciation, de concentration ou de compréhension des consignes, parfois prises à tort pour de l’inattention ou de l’agitation. C’est pourquoi un trouble du langage ou des difficultés scolaires doivent toujours faire vérifier l’audition.

**Écrans et écouteurs.** Avec l’usage des tablettes et des consoles, les enfants portent de plus en plus tôt des écouteurs. Réglez un volume maximal sur les appareils, privilégiez les casques adaptés aux enfants et imposez des pauses.

## Au quotidien
- **Baissez le son** des écouteurs, casques, enceintes et de la musique en voiture.
- **Concerts, fêtes, feux d’artifice** : restez loin des enceintes et prévoyez des protections adaptées.
- **Bruits soudains et violents** (pétards, outils, chantiers) : éloignez votre enfant.
- **Tabac** : évitez l’exposition à la fumée, qui favorise les otites.
- **Pendant un rhume ou une otite**, parlez face à lui, plus près, dans le calme.

## Questions fréquentes
**Mon enfant n’écoute pas : est-ce un problème d’audition ou d’attention ?**
Seul un examen permet de faire la part des choses. Commencez par le médecin traitant ou le pédiatre.

**Les otites peuvent-elles rendre sourd ?**
Des otites répétées ou une otite séreuse persistante peuvent diminuer l’audition, souvent de façon temporaire : un suivi médical est important.

**Où trouver de l’information ?**
La plateforme Surdités info service est joignable au 0 805 800 808 (numéro gratuit).

## Quand demander conseil
Consultez sans attendre en cas de doute : votre médecin vous orientera vers un **ORL** pour un bilan auditif. Consultez rapidement en cas de douleur d’oreille intense, d’écoulement, de baisse d’audition brutale ou après un traumatisme sonore. En cas de fièvre élevée avec maux de tête et vomissements, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'mal-de-ventre-chez-l-enfant', category: 'sante-enfant', safety_critical: true, tags: ['mal de ventre', 'douleur', 'urgence'],
    title: 'Mal de ventre chez l’enfant : soulager et repérer l’urgence',
    summary: 'Souvent bénin, le mal de ventre peut parfois signaler une urgence : les gestes de confort et les signes qui ne doivent pas attendre.',
    sources: [S.malVentre, S.gastro],
    body_md: `## En bref
- Le mal de ventre est fréquent chez l’enfant et souvent passager : repos, calme et petites quantités d’eau aident.
- **Pas d’anti-inflammatoire ni d’aspirine** tant qu’on ne connaît pas la cause ; demandez conseil au pharmacien ou au médecin.
- Une douleur **brutale et intense**, un **ventre dur**, des **vomissements de sang** ou une douleur après une chute imposent d’appeler le **15**.
- Une douleur qui **dure, revient ou s’accompagne de fièvre** doit faire consulter.

## Comprendre
Chez l’enfant, le mal de ventre peut avoir de nombreuses causes : constipation, gastro-entérite, infection ORL, émotion, angoisse avant l’école, plus rarement appendicite ou infection urinaire. Les jeunes enfants situent mal leur douleur et disent parfois « j’ai mal au ventre » pour exprimer un malaise plus général. Observer comment il se comporte, mange, joue et dort aide à faire la différence.

L’Assurance Maladie indique que l’aspirine et les anti-inflammatoires ne sont pas conseillés quand on ne connaît pas la cause de la douleur ; le paracétamol peut être utilisé en respectant la dose adaptée au poids, à demander au médecin ou au pharmacien.


**Ce que le médecin va chercher.** Selon la situation, il vous demandera où se situe la douleur, depuis quand elle dure, si elle va et vient, si elle réveille l’enfant la nuit, et ce qui l’accompagne : fièvre, vomissements, diarrhée ou constipation, brûlures en urinant, mal de gorge. Notez ces éléments avant la consultation. Chez l’enfant, une angine ou une infection respiratoire peuvent aussi s’accompagner de douleurs de ventre.

**Les douleurs qui reviennent.** Des maux de ventre répétés, sans autre signe, sont fréquents chez l’enfant d’âge scolaire. Ils méritent un bilan médical, puis une attention à ce que vit l’enfant (rythme, stress, école), sans le soupçonner de « faire semblant » : la douleur est réelle, même quand l’émotion y participe.

## Au quotidien
- **Installez-le confortablement**, au calme, et aidez-le à respirer tranquillement.
- **Petits repas légers**, de l’eau par petites gorgées.
- **Observez** : où est la douleur, depuis quand, avec quoi (fièvre, vomissements, diarrhée, brûlures en urinant, constipation) ?
- **Douleurs répétées le matin d’école** : prenez le temps d’en parler avec lui, sans négliger une cause physique — faites le point avec le médecin.
- **Constipation** : boissons, fruits et légumes, temps aux toilettes sans se presser ; consultez si elle dure.

## Questions fréquentes
**Comment savoir si c’est une appendicite ?**
Seul un médecin peut le dire. Une douleur qui s’installe et s’aggrave, surtout en bas à droite, avec fièvre ou vomissements, justifie une consultation dans la journée, ou le 15 si elle est intense.

**Il a souvent mal au ventre quand il est stressé, est-ce possible ?**
Oui, les émotions peuvent se traduire par des douleurs de ventre. Mais il faut toujours en parler au médecin pour ne pas passer à côté d’une autre cause.

## Quand demander conseil
**Appelez le 15 ou le 112** si la douleur est brutale et très intense, après un choc ou une chute, si l’enfant vomit du sang ou un liquide brunâtre, fait un malaise avec fièvre, est essoufflé sans raison, ou si son ventre est très dur et douloureux.

**Consultez dans la journée** en cas de nausées ou vomissements, fièvre, difficultés à uriner, absence de selles et de gaz, peau ou blanc des yeux jaunes, sang dans les selles ou selles noires, ou douleur nouvelle et persistante qui l’empêche de jouer. **Dans les jours qui viennent** si la douleur ne diminue pas après 2 jours, revient régulièrement, ou s’accompagne d’une perte de poids.

${FIN}`,
  },
  {
    ...CHILD, slug: 'conjonctivite-chez-l-enfant', category: 'sante-enfant', tags: ['conjonctivite', 'yeux', 'hygiène'],
    title: 'Conjonctivite de l’enfant : nettoyer, soulager, consulter',
    summary: 'Œil rouge qui colle ou qui gratte : les soins au sérum physiologique, les gestes d’hygiène et les situations qui demandent un avis rapide.',
    sources: [S.conjonctivite],
    body_md: `## En bref
- La conjonctivite peut être **virale, bactérienne, allergique ou due à une irritation**.
- La base : **nettoyer les yeux au sérum physiologique** plusieurs fois par jour.
- **Ne pas frotter**, se laver les mains avant et après les soins : certaines formes sont contagieuses.
- Avant **2 ans**, ou en cas de douleur, de baisse de vision ou d’œil gonflé avec fièvre : **avis médical rapide**.

## Comprendre
La conjonctive est la fine membrane qui recouvre le blanc de l’œil et l’intérieur des paupières. Son inflammation rend l’œil rouge, avec parfois un écoulement, des paupières collées au réveil ou des démangeaisons. Selon l’Assurance Maladie, la conduite à tenir dépend de la cause : une conjonctivite allergique s’accompagne souvent de démangeaisons et d’éternuements, une forme infectieuse d’un écoulement.

Une conjonctivite ne relève pas d’un appel d’urgence en elle-même, mais certaines situations demandent de voir rapidement un médecin ou un ophtalmologiste.


**Reconnaître les différentes formes.** Une conjonctivite **allergique** touche souvent les deux yeux, démange beaucoup, et s’accompagne d’éternuements ou d’un nez qui coule, surtout au printemps. Une conjonctivite **virale** fait souvent suite à un rhume, avec un écoulement clair. Une conjonctivite **bactérienne** donne plutôt un écoulement épais, jaunâtre, et des paupières collées. Seul un professionnel peut confirmer la cause, mais ces indices aident à décrire les symptômes.

**Les bons gestes en famille.** Chacun sa serviette et son gant de toilette, changement fréquent des taies d’oreiller, lavage des mains avant et après les soins : ces gestes évitent la transmission aux frères et sœurs.

## Au quotidien
- **Lavage** : sérum physiologique, plusieurs fois par jour, en essuyant avec une compresse stérile ou un mouchoir jetable (une compresse par œil). Pour une forme allergique, le sérum froid soulage davantage.
- **Yeux collés le matin** : une compresse tiède aide à décoller les cils.
- **Hygiène** : mains lavées avant et après, linge de toilette personnel, mouchoirs jetés aussitôt.
- **Irritants** : évitez la fumée, la poussière et les allergènes connus.
- **Collyres** : demandez conseil au pharmacien ; ne réutilisez pas un ancien flacon ouvert.

## Questions fréquentes
**Peut-il aller à l’école ?**
La page de l’Assurance Maladie ne fixe pas de règle : demandez l’avis du médecin ou du pharmacien, et prévenez l’établissement si la conjonctivite est infectieuse.

**Faut-il des antibiotiques ?**
Pas systématiquement : c’est au médecin d’en juger selon la cause.

**Mon enfant porte des lunettes, quelles précautions ?**
Nettoyez-les régulièrement et évitez de les prêter pendant l’épisode.

## Quand demander conseil
**Dans la journée (ophtalmologiste)** : enfant de **moins de 2 ans**, corps étranger ou produit chimique dans l’œil, **œil gonflé avec fièvre** au-dessus de 38 °C, vision brouillée qui ne se corrige pas en clignant, **œil rouge et douloureux** avec vision floue, forte gêne à la lumière.

**Dans les jours qui viennent** : écoulement qui ne cède pas aux lavages, conjonctivite allergique qui ne s’améliore pas. En cas de produit chimique projeté dans l’œil, rincez abondamment à l’eau et demandez un avis urgent (15 ou 112 si besoin).

${FIN}`,
  },
  {
    ...CHILD, slug: 'puberte-premiers-signes', category: 'sante-enfant', min_age_months: 84, tags: ['puberté', 'corps', 'croissance', 'dialogue'],
    title: 'Puberté : premiers signes, âges repères et comment en parler',
    summary: 'Ce qui change chez les filles et les garçons, à partir de quel âge on parle de puberté précoce et comment accompagner votre enfant.',
    sources: [S.puberte, S.puberteMpedia],
    body_md: `## En bref
- Chez la fille, la puberté commence souvent par le **développement des seins**, en général vers 10 ans (entre 9 et 13 ans).
- Chez le garçon, elle commence plutôt vers **12 ans** (souvent entre 11 et 14 ans), par l’**augmentation du volume des testicules**.
- Des signes **avant 8 ans chez la fille** ou **avant 9 ans chez le garçon** doivent faire consulter : on parle de **puberté précoce**.
- **Parler tôt, simplement, sans gêne** aide l’enfant à vivre sereinement ces changements.

## Comprendre
La puberté est la période où le corps se transforme pour devenir adulte, sous l’effet des hormones. Selon mpedia, chez la fille les seins se développent d’abord, puis viennent les poils du pubis et des aisselles ; les premières règles arrivent environ deux ans après le début des changements, parfois irrégulières au départ. Chez le garçon, les testicules augmentent de volume, puis apparaissent les poils, la croissance s’accélère, la voix mue, les muscles se développent ; une légère augmentation du volume des seins est possible. L’acné est fréquente, et l’humeur peut devenir plus changeante.

Selon l’Assurance Maladie, on parle de **puberté précoce** quand les signes apparaissent avant 8 ans chez la fille et avant 9 ans chez le garçon, avec souvent une accélération nette de la croissance. Entre 8 et 10 ans chez la fille et 9 et 11 ans chez le garçon, on parle de puberté avancée, qui n’est pas considérée comme anormale. Le médecin décide si des examens sont utiles.


**Le corps, mais aussi l’humeur.** Les changements ne sont pas que physiques : l’enfant cherche davantage d’indépendance, peut devenir plus susceptible, plus pudique, parfois lunatique, coléreux ou triste. Selon mpedia, garder le dialogue ouvert, écouter, banaliser ce qu’il vit, fixer des limites tout en acceptant des compromis, aide à traverser cette période. Les écarts d’âge entre camarades sont importants : certains enfants commencent plus tôt, d’autres plus tard, et cette différence peut être source de gêne.

**Parler des règles et de l’intimité.** Expliquer les règles aux filles comme aux garçons, avant qu’elles n’arrivent, évite la peur et la honte. C’est aussi le moment de parler de consentement, de respect de son corps et de celui des autres, et de rappeler qu’il peut se confier à vous ou à un adulte de confiance.

## Au quotidien
- **Anticipez** : parlez des changements avant qu’ils n’arrivent, avec des mots simples et justes.
- **Répondez aux questions**, ou cherchez les réponses ensemble ; des livres adaptés à l’âge peuvent aider.
- **Respectez sa pudeur** : frapper avant d’entrer, lui laisser un espace à lui.
- **Hygiène** : douche quotidienne, déodorant si besoin, soins de peau doux ; pour une fille, préparez ensemble une trousse pour les premières règles.
- **Prenez au sérieux** son malaise face à son corps (poids, boutons), sans dramatiser.

## Questions fréquentes
**Ma fille de 7 ans a un début de poitrine, faut-il s’inquiéter ?**
Il faut consulter : avant 8 ans, des signes de puberté justifient un avis médical.

**Mon fils a un sein un peu gonflé, est-ce grave ?**
Une légère augmentation du volume des seins peut survenir chez le garçon pendant la puberté. Parlez-en au médecin si cela vous inquiète ou si c’est douloureux.

**Il devient lunatique, est-ce la puberté ?**
Les hormones influencent l’émotivité : écoute, dialogue et limites claires restent essentiels.

## Quand demander conseil
Consultez si des signes pubertaires apparaissent **avant 8 ans chez une fille** ou **avant 9 ans chez un garçon**, si la croissance s’accélère brutalement, en cas de saignements chez une jeune fille avant les âges attendus, de maux de tête inhabituels, ou si votre enfant semble très mal dans son corps (tristesse, repli). Pour toute détresse morale, le **3114** répond aussi aux proches.

${FIN}`,
  },
  {
    ...CHILD, slug: 'pipi-au-lit-enuresie', category: 'sante-enfant', min_age_months: 60, tags: ['énurésie', 'pipi au lit', 'sommeil'],
    title: 'Pipi au lit (énurésie) : aider son enfant sans le culpabiliser',
    summary: 'Rassurer, organiser les boissons et les passages aux toilettes, tenir un calendrier : les mesures simples et quand consulter.',
    sources: [S.enuresie, S.sommeilEtapes],
    body_md: `## En bref
- Faire pipi au lit n’est **ni une faute ni un caprice** : l’enfant ne le contrôle pas.
- **Ne jamais gronder** ; valoriser les **efforts** (boire moins le soir, aller aux toilettes avant le coucher), pas les nuits sèches.
- **Boissons limitées après 18 h**, passage aux toilettes **juste avant le coucher**, accès facile la nuit.
- Une consultation est conseillée si l’enfant mouille encore son lit **après 6 ans**.

## Comprendre
L’énurésie nocturne désigne le fait d’uriner pendant le sommeil, sans s’en rendre compte, à un âge où l’on s’attend à des nuits sèches. Selon l’Assurance Maladie, des épisodes peuvent réapparaître entre 3 et 10 ans, comme d’autres manifestations du sommeil (terreurs nocturnes, somnambulisme). La **constipation** est fréquente chez ces enfants et peut faire échouer les mesures : elle doit être corrigée.

Le plus important est de dédramatiser : un enfant honteux ou puni vit plus mal la situation, sans que cela l’aide à progresser.


**Pourquoi est-ce si fréquent ?** L’acquisition des nuits sèches dépend de plusieurs facteurs : la capacité de la vessie, la production d’urine la nuit, et la capacité à se réveiller quand la vessie est pleine. Ces mécanismes mûrissent à des rythmes différents selon les enfants, et il existe souvent des antécédents familiaux. Ce n’est donc ni de la paresse, ni un manque de volonté.

**Préserver l’estime de soi.** L’énurésie peut peser sur la vie de l’enfant (nuits chez des amis, colonies) et sur son moral. Évitez d’en parler devant d’autres personnes sans son accord, valorisez ses efforts, et dites-lui qu’il n’est pas seul : beaucoup d’enfants de son âge vivent la même chose. Si votre enfant en souffre, le médecin peut proposer des solutions adaptées.

## Au quotidien
- **Expliquez avec des mots simples** que son corps apprend encore à se réveiller ou à se retenir la nuit.
- **Impliquez-le** sans le punir : il peut aider à changer les draps.
- **Boissons** : bien boire le matin et le midi, limiter après 18 h ; supprimer le soir les boissons sucrées, gazeuses, très salées ou caféinées.
- **Toilettes** : environ 5 à 6 fois par jour, dont au réveil et **juste avant le coucher**, détendu, sans pousser.
- **La nuit** : ne le réveillez pas, mais facilitez l’accès aux toilettes (veilleuse, chemin dégagé).
- **Calendrier** des nuits sèches et mouillées : il motive l’enfant et aide le médecin.
- **Literie** : alèse protectrice, pyjama et serviette de rechange à portée ; suppression progressive des couches.

## Questions fréquentes
**Faut-il le réveiller la nuit pour l’emmener aux toilettes ?**
L’Assurance Maladie conseille de ne pas le réveiller, mais de faciliter l’accès aux toilettes.

**Mon enfant était propre et recommence à mouiller son lit : pourquoi ?**
Une reprise après plus de 6 mois de nuits sèches justifie une consultation : le médecin cherchera une cause (physique ou liée à un changement de vie).

**Les camps et les nuits chez les copains sont-ils possibles ?**
Oui, avec un peu d’organisation : parlez-en discrètement avec l’adulte responsable et prévoyez une protection et des affaires de rechange.

## Quand demander conseil
**Dans la journée** si l’énurésie s’accompagne de troubles urinaires le jour (fuites, envies très fréquentes, brûlures), de fièvre, ou d’une **soif importante avec des urines très fréquentes**.

**Sans urgence** si l’enfant a plus de 6 ans, si les mesures n’aident pas après plusieurs semaines, si les nuits mouillées reprennent après 6 mois, en cas de constipation, de ronflements ou de pauses respiratoires la nuit, d’attention très difficile, ou si votre enfant semble triste, replié ou en souffrance.

${FIN}`,
  },
  // ------------------------------------------------------------------ sommeil
  {
    ...CHILD, slug: 'cauchemars-terreurs-nocturnes-somnambulisme', category: 'sommeil', tags: ['cauchemars', 'terreurs nocturnes', 'somnambulisme', 'nuit'],
    title: 'Cauchemars, terreurs nocturnes, somnambulisme : que faire ?',
    summary: 'Reconnaître ce qui se passe la nuit, savoir quand rassurer et quand ne surtout pas réveiller, et sécuriser la maison.',
    sources: [S.sommeilTroubles, S.parasomnies, S.dortMal],
    body_md: `## En bref
- Le **cauchemar** survient plutôt **en fin de nuit** : l’enfant se réveille, vous reconnaît et se souvient de son rêve. **On le rassure.**
- La **terreur nocturne** survient **en début de nuit** : il crie, s’agite, transpire, mais **dort** et ne se souviendra de rien. **On ne le réveille pas.**
- Le **somnambule** marche les yeux ouverts, l’air absent : on le **raccompagne doucement** et on **sécurise la maison**.
- **Jamais de médicament pour dormir** sans avis médical.

## Comprendre
Ces manifestations sont fréquentes dans l’enfance. Selon Santé.fr, les cauchemars surviennent pendant le sommeil paradoxal, en deuxième partie de nuit, et reflètent souvent les événements de la journée ; occasionnels, ils ne sont pas inquiétants. Les terreurs nocturnes surviennent pendant le sommeil profond, en général moins de trois heures après l’endormissement : l’enfant semble terrifié mais dort, et ces épisodes n’expriment pas une angoisse.

Selon mpedia, les cauchemars suivent souvent un changement de vie : déménagement, naissance, rentrée, jalousie, journées trop chargées. Le somnambulisme, en début de nuit, dure quelques minutes et ne laisse aucun souvenir. Parler en dormant ou se bercer pour s’endormir sont d’autres manifestations bénignes du sommeil.


**Ce qui peut favoriser ces épisodes.** La fatigue et le manque de sommeil, des horaires irréguliers, une fièvre, un événement marquant (rentrée, déménagement, arrivée d’un bébé, séparation, conflit à l’école) ou des images impressionnantes vues avant de dormir. Selon mpedia, chercher l’origine d’un trouble du sommeil permet souvent d’y mettre fin, car il est la plupart du temps lié à un problème ponctuel et passager.

**Parler des peurs dans la journée.** Après un cauchemar, en parler à tête reposée, le dessiner, imaginer une fin différente ou choisir ensemble un objet rassurant aide l’enfant à reprendre la main sur ses peurs. Évitez les films, jeux ou informations effrayants en soirée.

## Au quotidien
- **Cauchemar** : allez le rassurer par un câlin, quelques mots doux, puis laissez-le se rendormir dans son lit ; parlez-en le lendemain avec des mots simples.
- **Terreur nocturne** : ne cherchez pas à le réveiller, restez près de lui, éloignez ce qui pourrait le blesser, et n’en parlez pas le lendemain.
- **Somnambulisme** : fermez fenêtres et portes donnant sur l’extérieur, bloquez l’accès aux escaliers, rangez les objets dangereux, puis ramenez-le doucement vers son lit.
- **Rituel du soir apaisant** : horaires réguliers, activités calmes, pas d’écran le soir, chambre sombre et calme, objet rassurant.
- **Journées moins chargées** si les épisodes se multiplient : la fatigue les favorise.

## Questions fréquentes
**Faut-il le prendre dans notre lit après un cauchemar ?**
Mieux vaut le rassurer dans son propre lit, sans lui donner à boire ni jouer, pour préserver ses repères.

**Les terreurs nocturnes sont-elles le signe d’un traumatisme ?**
Santé.fr précise qu’elles n’expriment pas une angoisse. En revanche, des cauchemars intenses et répétés peuvent traduire une anxiété : parlez-en au pédiatre.

**Peut-on donner de la mélatonine ou des plantes ?**
Santé.fr déconseille formellement les médicaments pour dormir chez l’enfant, y compris à base de plantes, sauf prescription médicale dans des cas précis.

## Quand demander conseil
Consultez si les épisodes sont réguliers ou durent plus d’une semaine, si votre enfant se blesse ou risque de se blesser, s’il est fatigué ou somnolent le jour, agité, agressif ou replié, ou s’il **ronfle, fait des pauses respiratoires** ou a des infections ORL fréquentes. Avant le rendez-vous, notez pendant une dizaine de jours les heures de coucher, de réveil et les épisodes. Le dispositif « Mon soutien psy » est accessible dès 3 ans, sur orientation médicale.

${FIN}`,
  },
  {
    ...CHILD, slug: 'sommeil-de-l-enfant-3-10-ans', category: 'sommeil', min_age_months: 36, tags: ['sommeil', 'rythme', 'écrans', 'école'],
    title: 'Le sommeil de l’enfant de 3 à 10 ans : repères et bonnes habitudes',
    summary: 'Combien d’heures, la fin de la sieste, le rituel du soir et les signes d’un manque de sommeil chez l’enfant d’âge scolaire.',
    sources: [S.sommeilEtapes, S.dortMal, S.sante611],
    body_md: `## En bref
- Repères de sommeil sur 24 heures : environ **13 heures à 3 ans**, **12 heures à 6 ans**, **9 heures à 12 ans** ; Santé.fr recommande **au moins une dizaine d’heures par nuit** entre 6 et 11 ans.
- La **sieste** reste utile jusqu’à 2 à 5 ans selon l’enfant ; si elle persiste après 7 ans, elle peut signaler des nuits trop courtes.
- **Horaires réguliers**, rituel calme, **pas d’écran le soir**.
- Irritabilité, agitation, difficultés de concentration peuvent traduire un **manque de sommeil**.

## Comprendre
Selon l’Assurance Maladie, le sommeil soutient le développement du cerveau, la concentration et la mémorisation, la croissance (hormone de croissance) et la régulation de l’appétit. Entre 3 et 6 ans, les siestes disparaissent progressivement et le sommeil profond se concentre en début de nuit ; à partir de 6 ans, les nuits raccourcissent et l’endormissement peut prendre plus de temps, sans que la qualité du sommeil soit altérée.

Le manque de sommeil ne se traduit pas toujours par de la fatigue visible : chez l’enfant, il donne souvent de l’irritabilité, de l’agitation, des troubles du caractère, une somnolence en journée et des difficultés d’attention en classe. À long terme, il augmente le risque de surpoids.


**Sommeil et école.** Un enfant qui dort suffisamment se concentre mieux, retient mieux ce qu’il apprend et gère mieux ses émotions. Selon l’Assurance Maladie, le sommeil aide à mémoriser les apprentissages de la journée. La rentrée, les activités du soir, les devoirs tardifs ou les écrans dans la chambre peuvent grignoter les nuits sans qu’on s’en rende compte : faites régulièrement le point sur l’heure réelle d’endormissement.

**Les écrans dans la chambre.** Télévision, console, tablette ou téléphone dans la chambre retardent l’endormissement et favorisent les réveils. Un « parking » des écrans hors de la chambre le soir, pour toute la famille, est une habitude simple et efficace.

## Au quotidien
- **Horaires réguliers**, y compris le week-end : Santé.fr conseille de ne pas décaler le lever de plus de deux heures environ.
- **Dîner au moins une heure avant le coucher**, suffisant et équilibré.
- **Rituel** : histoire, câlin, chanson, activités calmes ; le coucher ne doit jamais ressembler à une punition.
- **Écrans** : à éviter le soir (télévision, tablette, jeux, téléphone) ; ils sont associés à des difficultés d’endormissement.
- **Chambre** : calme, sombre, température agréable ; une veilleuse peut rassurer.
- **Repérer la fatigue** : bâillements, yeux qui piquent, énervement soudain sont le signal d’aller se coucher.
- **Journées actives** : bouger et jouer dehors aide aussi à bien dormir.

## Questions fréquentes
**Il n’arrive pas à s’endormir avant 22 h, que faire ?**
Vérifiez l’heure du lever, les écrans et l’activité de la journée. Si l’endormissement dure plus de 30 minutes malgré ces mesures, parlez-en au médecin.

**Peut-il rattraper son sommeil le week-end ?**
Mieux vaut éviter les grasses matinées trop longues, qui décalent le rythme ; préférez des couchers un peu plus tôt.

**Faut-il le réveiller s’il fait encore la sieste à 6 ans ?**
L’Assurance Maladie conseille de ne pas prolonger la sieste. Si elle reste indispensable après 7 ans, interrogez-vous sur la durée des nuits.

## Quand demander conseil
Consultez si les difficultés d’endormissement ou les réveils persistent plus d’une semaine malgré les mesures simples, si votre enfant est somnolent ou très fatigué le jour, s’il **ronfle, fait des pauses respiratoires**, respire bouche ouverte, ou si son comportement change (agitation, repli, tristesse). Ne donnez aucun médicament ni complément pour dormir sans avis médical.

${FIN}`,
  },
  // ------------------------------------------------------------------ alimentation et activité
  {
    ...CHILD, slug: 'repas-equilibres-et-gouter-enfant', category: 'alimentation', min_age_months: 36, tags: ['alimentation', 'goûter', 'petit-déjeuner', 'équilibre'],
    title: 'Repas équilibrés et goûter : les repères pour l’enfant de 3 à 10 ans',
    summary: 'Quatre repas par jour, quoi mettre dans l’assiette, quel goûter proposer et comment faire face aux refus sans conflit.',
    sources: [S.repas, S.aliments, S.sante611],
    body_md: `## En bref
- **Quatre moments par jour** : petit-déjeuner, déjeuner, **un seul goûter**, dîner ; **pas de grignotage**.
- Chaque jour : **fruits et légumes** (5 portions, surtout des légumes), **féculents** à chaque repas, **3 à 4 produits laitiers**, viande, poisson, œufs ou légumineuses.
- **L’eau** est la seule boisson à volonté ; sodas et boissons sucrées restent exceptionnels.
- L’équilibre se juge **sur la journée, voire sur plusieurs jours**, pas sur un seul repas.

## Comprendre
Selon l’Assurance Maladie, le **petit-déjeuner** associe idéalement un produit céréalier complet peu sucré, un produit laitier et un fruit. Le **déjeuner** et le **dîner**, à horaires réguliers et si possible en famille, n’ont pas besoin de contenir viande, poisson ou œufs à chaque fois : les légumineuses (lentilles, pois chiches, haricots), à proposer au moins deux fois par semaine, sont une bonne alternative. Le poisson est conseillé deux fois par semaine.

Le **goûter** comprend un ou deux aliments parmi fruits, fruits à coque (adaptés à l’âge), légumes, laitages et céréales complètes, avec de l’eau ou du lait, pas trop près du dîner. Viennoiseries, biscuits, chips et pâtes à tartiner restent occasionnels. Un jus de fruit ne compte pas comme une portion de fruit, et un verre par jour est un maximum.


**Des idées de goûters simples.** Un fruit et un morceau de pain avec un carré de chocolat ; un yaourt nature et une compote ; du pain et un morceau de fromage avec quelques bâtonnets de légumes ; une poignée de fruits secs (adaptés à l’âge, entiers seulement quand l’enfant est assez grand) et un verre de lait. L’Assurance Maladie rappelle que le goûter compte un ou deux aliments et une boisson, de préférence de l’eau ou du lait.

**Les portions changent avec l’âge.** Un enfant de 4 ans n’a pas besoin de la même quantité qu’un enfant de 10 ans, et l’appétit varie d’un jour à l’autre. Servir de petites portions et laisser se resservir permet de respecter ses sensations de faim, plutôt que de le pousser à finir une assiette trop pleine.

## Au quotidien
- **Cuisinez avec lui** : laver, éplucher, mélanger donnent envie de goûter.
- **Repas au calme, sans écran**, avec le temps de manger sans se presser.
- **Écoutez la faim** : pas d’obligation de finir l’assiette, pas de dessert « récompense ».
- **Refus d’un aliment** : reproposez-le plus tard, préparé autrement, sans forcer ni punir. La méfiance face aux nouveaux aliments est fréquente chez l’enfant.
- **Lisez les étiquettes** avec lui, Nutri-Score compris, pour comparer les produits.
- **Publicité** : elle pousse au grignotage ; limitez l’exposition et expliquez-en le principe.

## Questions fréquentes
**Mon enfant ne mange pas le matin, est-ce un problème ?**
Proposez quelque chose de simple (un laitage, un fruit, du pain) ou emportez-le pour plus tard ; parlez-en au médecin si cela s’accompagne de fatigue.

**Peut-il boire du lait demi-écrémé ?**
Oui, l’Assurance Maladie indique qu’il convient dès 3 ans.

**Il réclame sans cesse des sucreries…**
Gardez-les pour des moments précis (fête, goûter du week-end), proposez de l’eau entre les repas et ne les utilisez pas comme récompense.

## Quand demander conseil
Consultez si votre enfant mange très peu de variétés au point de vous inquiéter, s’il perd du poids, si sa courbe de croissance change d’allure, s’il a souvent mal au ventre ou des troubles digestifs après certains aliments (pensez à l’allergie), ou si les repas sont devenus une source de conflit et d’angoisse. En cas de gonflement du visage, de gêne respiratoire ou de malaise après un aliment, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'cantine-scolaire-et-pai', category: 'ecole-garde', min_age_months: 36, tags: ['cantine', 'école', 'allergie', 'PAI'],
    title: 'La cantine : comment ça marche et que faire si votre enfant a un besoin de santé ?',
    summary: 'Qui organise la restauration scolaire, ce que contiennent les repas, les aides possibles et le PAI pour un enfant allergique ou malade.',
    sources: [S.cantine, S.pai, S.allergieQueFaire],
    body_md: `## En bref
- À l’école primaire, la cantine est organisée par la **commune** (ou l’intercommunalité) ; les tarifs dépendent souvent du **quotient familial**.
- Les repas suivent des **règles nutritionnelles** : 4 ou 5 plats, un plat principal avec garniture et un produit laitier, des portions adaptées à l’âge.
- Les **14 principaux allergènes** sont affichés.
- Pour un enfant allergique ou malade chronique, un **projet d’accueil individualisé (PAI)** organise les repas, les médicaments et les gestes d’urgence.

## Comprendre
Selon le ministère de l’Éducation nationale, le repas du midi représente environ 40 % des apports de la journée. Les menus doivent limiter les sucres ajoutés et les graisses, et mieux couvrir les besoins en fibres, minéraux et vitamines. Les règles encadrent aussi le service de l’eau, du pain, du sel et des sauces.

Le **PAI** est un document écrit qui permet à un élève dont l’état de santé demande des traitements ou des précautions de suivre une scolarité aussi ordinaire que possible. Selon Éduscol, il est élaboré avec le médecin qui suit l’enfant et le médecin de l’Éducation nationale ; il comporte une fiche « conduite à tenir en cas d’urgence » (asthme, allergies, diabète, épilepsie…), sans révéler le diagnostic. Dans le cadre d’un PAI, un **panier repas** fourni par la famille peut être autorisé ; la famille en assume alors la responsabilité et la chaîne du froid doit être respectée.


**Des produits de qualité.** Selon le ministère de l’Éducation nationale, la loi a fixé des objectifs pour la restauration collective, dont une part de produits durables et de qualité et au moins 20 % de produits issus de l’agriculture biologique. Les menus sont généralement établis plusieurs semaines à l’avance, souvent avec l’appui d’un diététicien.

**Faire du repas un moment agréable.** Le temps de cantine est aussi un temps de détente et de vie collective. Si votre enfant trouve le réfectoire trop bruyant ou le temps de repas trop court, échangez avec l’école ou le service périscolaire : des aménagements sont parfois possibles. À la maison, demander « qu’as-tu goûté de nouveau ? » encourage la curiosité.

## Au quotidien
- **Inscrivez votre enfant** auprès de la mairie (ou du service périscolaire) ; renseignez-vous sur les tarifs et les aides.
- **Lisez les menus** affichés ou publiés en ligne et parlez-en avec votre enfant : qu’a-t-il goûté, aimé ?
- **Adaptez le dîner** au repas de midi pour équilibrer la journée.
- **Allergie, asthme, diabète** : demandez un PAI avant la rentrée ; signalez aussi le besoin aux animateurs du temps périscolaire.
- **Trousse d’urgence** : si elle est prescrite, vérifiez les dates de péremption et qu’elle accompagne l’enfant lors des sorties.

## Questions fréquentes
**Les familles en difficulté peuvent-elles être aidées ?**
Oui : dans le primaire, la commune fixe une participation selon le quotient familial ; vous pouvez aussi contacter l’assistante sociale.

**Mon enfant mange très peu à la cantine, que faire ?**
Parlez-en avec lui et avec l’équipe (bruit, temps de repas, goûts). Un goûter et un dîner équilibrés compensent sur la journée.

**Le PAI dégage-t-il les parents de leurs responsabilités ?**
Non, il organise l’accueil mais ne dégage pas les parents de leurs responsabilités, notamment pour le panier repas.

## Quand demander conseil
Parlez au médecin traitant et au médecin scolaire de tout besoin de santé lié aux repas. En cas de réaction allergique grave (gonflement, gêne respiratoire, malaise), l’adulte présent appelle le **15** ou le **112** et applique la conduite à tenir du PAI.

${FIN}`,
  },
  {
    ...CHILD, slug: 'activite-physique-et-sport-enfant', category: 'sante-enfant', min_age_months: 36, tags: ['activité physique', 'sport', 'sédentarité', 'écrans'],
    title: 'Bouger chaque jour : activité physique et sport chez l’enfant',
    summary: 'Au moins 60 minutes d’activité par jour dès 6 ans, moins de temps assis, et un sport choisi pour le plaisir.',
    sources: [S.activite, S.sport],
    body_md: `## En bref
- De 6 à 17 ans : **au moins 60 minutes par jour** d’activité physique d’intensité modérée à élevée.
- **Limiter le temps assis**, et ne pas rester plus de **2 heures d’affilée** sans bouger.
- Le **plaisir** est la clé de la persévérance : laissez votre enfant essayer plusieurs activités.
- Entre 6 et 8 ans, privilégier **équilibre, attention, coordination** ; à partir de 8 ans, l’**endurance**.

## Comprendre
Santé.fr rappelle les repères pour les 6-17 ans : au moins une heure d’activité physique quotidienne, qui peut se répartir sur la journée (trajets à pied ou à vélo, récréation, jeux, sport), et une limitation de la sédentarité, en évitant de rester assis plus de deux heures d’affilée. Bouger renforce les muscles et les os, améliore le sommeil, la concentration et l’humeur.

Le sport peut aussi renforcer la confiance et l’estime de soi. Selon Santé.fr (Manger Bouger), les sports de combat comme le judo ou l’escrime conviennent aux enfants attirés par la lutte, le vélo, la natation ou les sports collectifs aux enfants très actifs, la danse ou le cirque aux enfants sensibles aux arts. Les séances d’essai en début d’année et les programmes multisports permettent de découvrir sans s’engager trop vite.


**Moins d’écrans, plus de mouvement.** Les temps passés assis devant un écran s’ajoutent aux heures de classe et de devoirs. Santé.fr conseille de limiter la durée totale des activités sédentaires et de les interrompre régulièrement. Fixer des plages d’écran, proposer une activité dehors avant la console et bouger en famille rendent ces repères plus faciles à suivre.

**Adapter à chaque enfant.** Un enfant timide peut préférer une activité individuelle avant de rejoindre un groupe, un enfant très énergique apprécier les sports collectifs ou d’endurance. Selon Santé.fr, le choix doit avant tout tenir compte des goûts de l’enfant : l’important est qu’il ait envie d’y retourner la semaine suivante.

## Au quotidien
- **Trajets actifs** : à pied, à trottinette ou à vélo quand c’est possible.
- **Jeux dehors** chaque jour, même courts : parc, ballon, corde à sauter, cache-cache.
- **Pauses** dans les temps d’écran ou de devoirs : se lever, s’étirer, bouger.
- **En famille** : balade, piscine, vélo le week-end ; l’exemple des parents compte.
- **Équipement adapté** et **bouteille d’eau** ; limitez l’effort lors des pics de pollution de l’air.
- **Écoutez-le** : un enfant qui n’aime pas son sport peut en changer sans que ce soit un échec.

## Questions fréquentes
**Mon enfant n’aime pas le sport, que faire ?**
Cherchez l’activité qui lui plaît : roller, piscine, danse, randonnée… Bouger ne veut pas forcément dire compétition.

**Faut-il un certificat médical ?**
Les règles dépendent des fédérations et des âges : renseignez-vous auprès du club et parlez-en lors d’un examen de suivi.

**Mon enfant a de l’asthme, peut-il faire du sport ?**
Le plus souvent oui, avec un traitement et un plan d’action adaptés : voyez-le avec son médecin.

## Quand demander conseil
Consultez si votre enfant se plaint de douleurs pendant ou après l’effort, s’essouffle anormalement, fait un malaise, a des palpitations, ou si une douleur persiste après une chute. Pendant une activité, en cas de malaise, de perte de connaissance ou de difficulté à respirer, appelez le **15** ou le **112**.

${FIN}`,
  },
  // ------------------------------------------------------------------ comportement et éducation
  {
    ...CHILD, slug: 'poser-des-limites-sans-violence', category: 'education', tags: ['limites', 'violences éducatives', 'autorité', 'éducation'],
    title: 'Poser des limites sans violence : comment faire au quotidien ?',
    summary: 'Pourquoi les règles rassurent, ce que dit la loi sur les violences éducatives et des alternatives concrètes pour les moments de tension.',
    sources: [S.limites, S.veo, S.allo119],
    body_md: `## En bref
- Les **limites protègent et rassurent** : un enfant a besoin de repères clairs, répétés et cohérents.
- Fessée, claque, insultes, moqueries, menaces : ces **violences éducatives ordinaires sont interdites par la loi depuis 2019** (« l’autorité parentale s’exerce sans violences »).
- Un jeune enfant ne cherche pas à manipuler : il **ne sait pas encore se calmer seul**, une capacité qui arrive vers 5 ou 6 ans.
- Quand vous êtes à bout : **s’isoler quelques instants, respirer, revenir** quand la tension est retombée.

## Comprendre
Selon 1000 premiers jours (Santé publique France), les jeunes enfants ne perçoivent pas les dangers : le cadre assure leur sécurité, et des règles appliquées avec constance leur donnent des repères. Réfléchir ensemble aux valeurs à transmettre, mettre en place des routines et répéter les règles, avec patience, sont la base.

Les **violences éducatives ordinaires** sont des violences physiques ou psychologiques utilisées pour éduquer, souvent banalisées. Selon mpedia, elles peuvent avoir des conséquences lourdes sur le développement affectif et cognitif de l’enfant. Gronder en jugeant, laisser pleurer seul ou minimiser ses ressentis n’aident pas non plus l’enfant à apprendre.


**Adapter au tempérament de l’enfant.** Chaque enfant réagit différemment : certains ont besoin d’être prévenus longtemps à l’avance, d’autres d’un choix limité, d’autres encore d’un moment pour se calmer seuls. Selon 1000 premiers jours, observer son enfant et communiquer avec lui permet d’ajuster ses pratiques. Les règles peuvent aussi évoluer avec l’âge et l’expérience.

**Prendre soin de soi pour tenir le cadre.** La fatigue, le stress et la solitude rendent la patience difficile. S’accorder des pauses, se relayer entre adultes, demander de l’aide à des proches ou à des professionnels ne sont pas des faiblesses : ce sont des moyens concrets de rester le parent que l’on souhaite être.

## Au quotidien
- **Annoncez à l’avance** la fin d’une activité et présentez la suivante.
- **Expliquez clairement et fermement** votre désaccord, sans juger, puis proposez une autre activité.
- **Mettez hors de portée** ce qui est dangereux ou interdit : moins d’interdits, moins de conflits.
- **Laissez-le choisir** dans les domaines non essentiels (le pull bleu ou le rouge) et **choisissez vos combats**.
- **Après une bêtise** : proposez de réparer plutôt que de punir sous le coup de la colère.
- **Transformez les contraintes en jeux** : chanson pour ranger, course pour s’habiller.
- **Matins et devoirs** : préparez les affaires la veille, prévoyez une pause sans écran après l’école, un cadre calme pour les devoirs.
- **Encouragez les progrès** plutôt que le résultat ; évitez les comparaisons.

## Questions fréquentes
**Réconforter mon enfant pendant une crise, est-ce céder ?**
Non : accueillir l’émotion (« tu es très en colère ») et proposer un câlin ne signifie pas accepter la demande.

**J’ai crié ou donné une tape, que faire ?**
Cela arrive quand on est épuisé. Excusez-vous auprès de votre enfant, expliquez ce qui s’est passé, et cherchez de l’aide pour souffler : vous n’êtes pas seul.

**Faut-il être d’accord à deux parents ?**
C’est préférable : réfléchir ensemble aux règles rend le cadre plus cohérent pour l’enfant.

## Quand demander conseil
Parlez-en à votre médecin, à la PMI ou à un professionnel de la parentalité si les colères sont très fréquentes, si vous avez peur de perdre le contrôle, ou si l’épuisement s’installe. Si vous pensez qu’un enfant est en danger, appelez le **119** (Allô Enfance en danger). En cas de danger immédiat : **17**, **15** ou **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'emotions-de-l-enfant-colere-peur-tristesse', category: 'education', tags: ['émotions', 'colère', 'pleurs', 'caprices'],
    title: 'Colère, peur, tristesse : accompagner les émotions de son enfant',
    summary: 'Comprendre les « caprices », aider l’enfant à mettre des mots sur ce qu’il ressent et garder des repères clairs.',
    sources: [S.caprices, S.limites, S.dortMal],
    body_md: `## En bref
- Les crises de cris et de pleurs font **partie du développement** : elles sont fréquentes entre 1 an et demi et 2 ans et demi, puis diminuent.
- Vers **5-6 ans**, l’enfant apprend progressivement à **se calmer seul** ; vers **7 ans**, il prend mieux en compte les autres.
- **Nommer l’émotion**, rester calme, **ne pas céder** mais réconforter : c’est ce qui l’aide le plus.
- Les **limites claires et cohérentes** le rassurent.

## Comprendre
Selon mpedia, le mot « caprice » est souvent mal compris : avant 3-4 ans, l’enfant exprime mal ce qu’il ressent, et ses cris sont parfois son seul moyen de montrer sa frustration, sa colère, sa peur ou un mal-être. Vers 5-6 ans, des crises peuvent aussi traduire une difficulté à trouver sa place dans la famille ou dans un groupe.

1000 premiers jours rappelle qu’un enfant ne cherche pas à embêter ou manipuler ses parents : il ne sait pas encore réguler ses émotions ni supporter la frustration. Le réconfort ne signifie pas céder à la demande.


**Montrer l’exemple.** Les enfants apprennent beaucoup en observant les adultes. Dire à voix haute ce que vous ressentez (« je suis agacé, je vais respirer un peu »), vous excuser quand vous vous êtes emporté, montrer comment on se calme : tout cela leur apprend que les émotions existent pour tout le monde et qu’on peut les exprimer sans faire de mal.

**Le rôle des routines.** Des journées prévisibles, avec des repères stables (repas, coucher, temps calme), réduisent les sources de frustration et d’angoisse. Annoncer les changements à l’avance et préparer les transitions (fin d’un jeu, départ de la maison) limitent bien des crises.

## Au quotidien
- **Pendant la crise** : prenez quelques secondes pour vous calmer vous-même, restez proche, mettez des mots (« tu es déçu parce que… »), proposez un câlin s’il l’accepte.
- **Après** : reparlez calmement de ce qui s’est passé et de ce qu’on peut faire la prochaine fois.
- **Un coin pour se calmer** : coussin, doudou, livre, dessin… sans que ce soit une punition.
- **Des mots pour les émotions** : livres, jeux, dessins aident à les reconnaître.
- **Prévenez** : faim, fatigue, journées trop chargées favorisent les crises.
- **Félicitez** les moments où il a su exprimer sa colère autrement.

## Questions fréquentes
**Faut-il ignorer les colères pour ne pas les « récompenser » ?**
Ne pas céder ne veut pas dire ignorer : restez présent, calme, et tenez la limite.

**Mon enfant de 8 ans pleure pour un rien, est-ce inquiétant ?**
Certains enfants sont plus sensibles. Si la tristesse dure, s’accompagne de troubles du sommeil ou de l’appétit, ou d’un repli, parlez-en au médecin.

**Il a peur du noir, des monstres…**
Les peurs sont fréquentes dans l’enfance : écoutez-les sans vous moquer, rassurez, et laissez une veilleuse si cela l’aide.

## Quand demander conseil
Consultez si les crises sont très fréquentes ou violentes (il se fait mal, fait mal aux autres), si votre enfant semble triste ou anxieux sur la durée, s’il ne joue plus, dort ou mange mal, ou si l’école vous alerte. Le dispositif « Mon soutien psy » est accessible dès 3 ans sur orientation médicale. En cas d’idées noires exprimées par l’enfant ou de détresse d’un proche, le **3114** répond 24 h/24 ; en cas de danger immédiat, **15** ou **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'confiance-en-soi-et-autonomie-enfant', category: 'education', tags: ['confiance en soi', 'autonomie', 'estime de soi'],
    title: 'Aider son enfant à avoir confiance en lui',
    summary: 'Laisser essayer, accepter l’erreur, valoriser les efforts et poser un cadre stable : les attitudes qui construisent l’estime de soi.',
    sources: [S.affirmation, S.sport, S.dortMal],
    body_md: `## En bref
- La confiance en soi se construit dans un **cadre affectueux et stable**.
- **Laisser faire ses propres expériences**, dans un cadre sûr, et **accepter qu’il se trompe**.
- **Valoriser les efforts** plutôt que le résultat ; **éviter les comparaisons**.
- Des **limites claires** et des **promesses tenues** le rassurent.

## Comprendre
Selon mpedia, le besoin d’autonomie se manifeste tôt, parfois par de l’opposition : refus, envie de tout faire seul, tests des interdits. Ces comportements font partie de la construction de l’identité. L’enfant qui se sent aimé, écouté et encadré ose davantage essayer, se tromper et recommencer.

Encourager les progrès plutôt que la performance, éviter jugements et comparaisons (mpedia, à propos des violences éducatives) protège l’estime de soi. Le sport peut aussi y contribuer, selon Santé.fr, surtout quand il est choisi pour le plaisir.


**L’autonomie au fil des âges.** Vers 3-4 ans, s’habiller avec un peu d’aide, ranger ses jouets, se laver les mains seul ; vers 5-6 ans, préparer son sac, mettre la table ; entre 7 et 10 ans, gérer une partie de ses affaires, faire de petits achats, préparer un goûter simple. Chaque enfant avance à son rythme : proposez sans imposer, et laissez du temps, même si c’est plus long que de faire à sa place.

**Le droit à l’erreur.** Un enfant qui a peur de se tromper n’ose plus essayer. Accueillir les erreurs comme des étapes (« qu’est-ce qu’on peut essayer d’autre ? ») et éviter les moqueries, y compris sur le ton de la plaisanterie, protègent sa confiance.

## Au quotidien
- **Confiez-lui des responsabilités** adaptées à son âge : mettre la table, préparer son cartable, s’occuper d’une plante.
- **Laissez-le chercher** avant d’aider : « Qu’est-ce que tu pourrais essayer ? »
- **Nommez précisément ce qui est réussi** : « Tu as recommencé trois fois, et tu y es arrivé. »
- **Dédramatisez l’erreur** : racontez les vôtres et ce que vous en avez appris.
- **Écoutez son avis**, proposez des choix, négociez quand c’est possible.
- **Passez du temps seul à seul** avec lui, sans écran.
- **Évitez les étiquettes** (« le timide », « le maladroit ») qui enferment.

## Questions fréquentes
**Faut-il beaucoup féliciter ?**
Les encouragements sincères et précis, centrés sur l’effort, sont plus utiles que des compliments généraux répétés.

**Mon enfant n’ose pas parler en classe, que faire ?**
Respectez son rythme, entraînez-vous en jouant à la maison, et échangez avec l’enseignant pour trouver des petites occasions de réussite.

**Il se dévalorise souvent (« je suis nul »)…**
Écoutez sans contredire brutalement, aidez-le à repérer ce qu’il réussit. Si cela persiste ou s’accompagne de tristesse, parlez-en au médecin.

## Quand demander conseil
Consultez si votre enfant se dévalorise constamment, évite toute nouvelle situation, semble triste ou anxieux sur la durée, refuse d’aller à l’école, ou si vous soupçonnez qu’il est mis à l’écart ou harcelé. Le médecin peut orienter vers un psychologue (« Mon soutien psy » dès 3 ans). Détresse d’un enfant ou d’un proche : **3114** ; danger immédiat : **15** ou **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'freres-et-soeurs-jalousie-disputes', category: 'education', tags: ['fratrie', 'jalousie', 'disputes'],
    title: 'Frères et sœurs : jalousie et disputes, comment réagir ?',
    summary: 'Pourquoi les disputes sont fréquentes, comment donner sa place à chacun et quand il faut intervenir.',
    sources: [S.fratrie],
    body_md: `## En bref
- Les disputes entre frères et sœurs sont **fréquentes** : la jalousie vient souvent du **partage de l’attention des parents**.
- Elles peuvent aussi apprendre **l’écoute, la négociation et la réconciliation**.
- **Pas d’égalité stricte permanente**, mais du **temps exclusif** pour chacun de temps en temps.
- **Séparer** quand la dispute dégénère (coups, insultes, enfant toujours visé), puis reparler au calme.

## Comprendre
Selon mpedia, rassurer chaque enfant sur sa place dans la famille, sans nier sa jalousie, est essentiel. Les étiquettes (« le responsable », « le bavard », « le tête-en-l’air ») enferment les enfants dans un rôle et nourrissent les rivalités. Encourager les talents de chacun, sans que cela se fasse au détriment des autres, aide chacun à trouver sa place.

Laisser les enfants régler eux-mêmes leurs petits conflits, en rappelant le respect mutuel, leur apprend à se parler. L’adulte intervient lorsque la dispute s’envenime.


**Chacun son espace, chacun son moment.** Selon mpedia, viser une égalité stricte à chaque instant est épuisant et peu utile : accorder de temps en temps à chaque enfant un moment exclusif, selon ses besoins, compte davantage. Un trajet seul avec un parent, une activité choisie par lui, une histoire rien que pour lui suffisent souvent à apaiser la jalousie.

**Les écarts d’âge.** Entre un enfant de 3 ans et un de 9 ans, les besoins, les jeux et les règles ne sont pas les mêmes. Expliquer pourquoi les règles diffèrent (heure du coucher, écrans) évite le sentiment d’injustice, à condition que chacun sache que ses propres privilèges viendront avec l’âge.

## Au quotidien
- **Gardez votre calme** : votre exemple apaise souvent la situation.
- **Aidez-les à s’expliquer** : chacun dit ce qu’il ressent, l’autre écoute, on cherche une solution ensemble.
- **Respectez l’espace de chacun** : un coin à soi si la chambre est partagée, des objets qu’on n’est pas obligé de prêter.
- **Anticipez** les moments à risque : retour de l’école, faim, fatigue, ennui ; un temps calme ou une discussion après l’école aide.
- **Réparer** : si l’un a cassé quelque chose ou fait mal, demandez-lui comment il peut réparer.
- **Valorisez** les moments où ils jouent bien ensemble.

## Questions fréquentes
**Faut-il punir les deux ?**
Mieux vaut séparer, calmer, puis écouter chacun et chercher une réparation, plutôt qu’une punition collective systématique.

**L’aîné régresse depuis la naissance du bébé…**
C’est une réaction fréquente : accordez-lui des moments rien qu’à lui et valorisez ce qu’il sait faire de « grand », sans l’obliger à aimer le bébé.

**Je n’arrive pas à aimer pareil mes enfants, est-ce grave ?**
On aime chaque enfant différemment, selon qui il est. L’important est que chacun se sente aimé et reconnu.

## Quand demander conseil
Parlez-en au médecin ou à un psychologue si la violence entre enfants est fréquente ou grave, si un enfant est constamment pris pour cible, s’il semble triste, anxieux ou se met en danger, ou si la situation épuise la famille. En cas de blessure grave, appelez le **15** ou le **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'separation-des-parents-accompagner-l-enfant', category: 'education', tags: ['séparation', 'divorce', 'résidence', 'émotions'],
    title: 'Séparation des parents : comment accompagner votre enfant ?',
    summary: 'Annoncer la séparation, organiser la vie entre deux maisons, éviter de mettre l’enfant au milieu et repérer les signes de souffrance.',
    sources: [S.separation],
    body_md: `## En bref
- **Préparez à deux** l’organisation pratique avant de l’annoncer : résidence, jours, école, trajets, fêtes.
- **Annoncez ensemble**, au calme : l’enfant **n’est pour rien** dans la séparation, ses deux parents **continuent de l’aimer et de s’occuper de lui**.
- **Pas de conflits ni de critiques de l’autre parent devant lui**, et **jamais l’enfant comme messager**.
- **Tenez vos engagements** : un rendez-vous manqué peut être vécu comme un abandon.

## Comprendre
Selon mpedia, la séparation, même fréquente, reste une épreuve pour l’enfant. Il a besoin de temps pour s’adapter, et son comportement peut changer, surtout pendant la période de conflits qui précède. Ce n’est pas tant la séparation elle-même que la **persistance des conflits** entre parents qui est associée à des difficultés psychologiques chez l’enfant.

L’autorité parentale reste conjointe : les deux parents doivent être informés des événements importants (scolarité, santé). Des règles différentes d’un foyer à l’autre sont possibles : l’enfant peut les apprendre.


**Les réactions possibles de l’enfant.** Selon mpedia, tristesse, sommeil perturbé (cauchemars, terreurs nocturnes), angoisse de séparation, comportement changeant ou agressif peuvent traduire sa souffrance. Certains enfants se sentent responsables, d’autres espèrent que leurs parents se remettront ensemble, d’autres encore cachent leurs émotions pour ne pas faire de peine. Lui redire régulièrement qu’il n’est pour rien dans la décision et qu’il peut parler de ses deux parents librement l’aide à avancer.

**Se faire aider entre adultes.** Lorsque la communication est très difficile, un professionnel peut aider les parents à organiser la vie de l’enfant et à apaiser les échanges. Le médecin de l’enfant, informé de la séparation, peut aussi être un appui.

## Au quotidien
- **Limitez les changements** dans sa vie au moment de la séparation (école, activités, amis).
- **Un espace à lui dans chaque maison** en cas de résidence alternée ; en résidence principale, une présence régulière de l’autre parent.
- **Facilitez les passages** : affaires essentielles qui suivent, doudou, cahiers ; un échange bref et cordial entre adultes.
- **Communication entre parents** : par écrit (mail, messagerie) si l’oral est difficile, mais pas par l’enfant.
- **Laissez-le exprimer** sa tristesse ou sa colère sans les juger ; il a le droit d’aimer ses deux parents.
- **Informez le médecin** de l’enfant de la séparation.

## Questions fréquentes
**À quel moment le dire aux enfants ?**
Idéalement quand la décision est prise et que l’organisation pratique est prévue, pour pouvoir expliquer concrètement ce qui va changer.

**Mon enfant ne veut plus aller chez son autre parent…**
Écoutez ce qu’il ressent, sans prendre parti, et parlez-en entre adultes ; un professionnel peut aider à comprendre ce qui se joue.

**Faut-il présenter rapidement un nouveau compagnon ?**
Laissez du temps à l’enfant pour s’adapter à la séparation avant d’ajouter d’autres changements.

## Quand demander conseil
Consultez le médecin de l’enfant ou un psychologue si vous observez une tristesse durable, des troubles du sommeil (cauchemars, terreurs), une angoisse de séparation, un comportement agressif ou un repli, une baisse scolaire. Si l’enfant est exposé à des violences entre adultes ou en est victime, appelez le **119** ; en cas de danger immédiat, **17** ou **112**.

${FIN}`,
  },
  {
    ...CHILD, slug: 'argent-de-poche-et-education-financiere', category: 'education', min_age_months: 48, tags: ['argent de poche', 'autonomie', 'budget'],
    title: 'Argent de poche : à quel âge et comment en parler ?',
    summary: 'Initier son enfant à la valeur de l’argent, verser un argent de poche régulier et l’aider à faire des choix.',
    sources: [S.argent],
    body_md: `## En bref
- Une **initiation** peut commencer vers **4 ou 5 ans** ; les enfants comptent et évaluent les prix vers **7 ou 8 ans**.
- L’**argent de poche régulier** (chaque semaine ou chaque mois) apprend à **gérer et à choisir**.
- **Parler d’argent simplement**, pendant les courses par exemple, montre comment on raisonne.
- La **tirelire** et, plus tard, un **compte** aident à épargner et à suivre son budget.

## Comprendre
Selon « Mes questions d’argent », le site d’éducation financière de la Banque de France, parler d’argent tôt aide à prendre de bonnes habitudes durables. Chaque enfant est différent, mais l’initiation peut débuter vers 4 ou 5 ans. Plus des trois quarts des parents donnent un argent de poche régulier, parfois complété par des sommes ponctuelles (anniversaire, fêtes). Le montant varie selon l’âge : il n’y a pas de somme « juste », l’essentiel est la régularité et des règles claires.

L’argent de poche n’est pas un salaire pour les tâches du quotidien : c’est un outil pour apprendre à faire des choix, attendre, économiser, et parfois se tromper sans gravité.


**Fixer des règles claires.** Décidez à l’avance de ce que l’argent de poche doit couvrir (bonbons, petits jouets, cartes à collectionner, sorties avec les copains) et de ce qui reste à la charge des parents (fournitures, vêtements). Notez le montant, le jour de versement et ce qui se passe en cas d’avance demandée. Des règles stables évitent les négociations permanentes.

**Montrer l’exemple.** Selon « Mes questions d’argent », expliquer à voix haute son raisonnement pendant les courses, distinguer les dépenses indispensables des plaisirs et comparer les prix avant un achat sont des moyens concrets d’apprendre. Les enfants observent aussi la façon dont les adultes parlent d’argent : une attitude calme et ouverte les aide à aborder le sujet sans tabou.

## Au quotidien
- **Expliquez à voix haute** vos choix pendant les courses : comparer les prix, distinguer besoins et envies.
- **Faites-lui payer de petits achats** en espèces : il voit concrètement la valeur des choses.
- **Fixez un rythme** (début de semaine ou de mois) et un montant que vous pouvez tenir.
- **Laissez-le décider** de ses dépenses, dans des limites que vous fixez (pas de produits dangereux, par exemple).
- **Tirelire** : comptez ensemble régulièrement, fixez un objectif d’épargne (un jouet, une sortie).
- **Apprenez à dire non** de temps en temps : savoir renoncer fait partie de l’apprentissage.
- Plus tard, un **livret** ou un **compte** peut responsabiliser ; des outils de suivi de budget existent.

## Questions fréquentes
**Faut-il conditionner l’argent de poche aux notes ou aux tâches ?**
Ce n’est pas obligatoire. Beaucoup de parents préfèrent séparer l’argent de poche des tâches familiales, que chacun accomplit parce qu’il vit dans la maison.

**Il a tout dépensé en une fois, faut-il compléter ?**
Mieux vaut le laisser constater les conséquences et l’aider à prévoir la prochaine fois.

**Et l’argent en ligne (jeux, applications) ?**
Expliquez que les achats en ligne sont de vrais achats, verrouillez les moyens de paiement et accompagnez-le.

## Quand demander conseil
Parlez-en avec votre enfant et, si besoin, avec un professionnel si l’argent devient source de conflits répétés, s’il se fait racketter ou subit une pression d’autres enfants (signalez-le à l’école ; le **3018** traite le harcèlement et le cyberharcèlement), ou si vous constatez des dépenses en ligne importantes et cachées.

${FIN}`,
  },
  // ------------------------------------------------------------------ école et mode de garde
  {
    ...CHILD, slug: 'entree-a-l-ecole-maternelle', category: 'ecole-garde', min_age_months: 24, max_age_months: 72, tags: ['maternelle', 'rentrée', 'inscription', 'séparation'],
    title: 'L’entrée à l’école maternelle : inscription et préparation',
    summary: 'Instruction obligatoire dès 3 ans, démarches en mairie, ce qu’on apprend en maternelle et comment préparer votre enfant à la rentrée.',
    sources: [S.inscription, S.maternelle],
    body_md: `## En bref
- L’**instruction est obligatoire dès 3 ans** ; certains enfants de 2 ans peuvent être accueillis, selon les places.
- **Première inscription en mairie** (au plus tard en juin avant la rentrée), puis **admission à l’école**.
- Documents : **livret de famille** (ou équivalent), **justificatif de domicile**, **preuve des vaccinations obligatoires**.
- En maternelle, le **langage** est le premier domaine d’apprentissage ; on apprend beaucoup **en jouant**.

## Comprendre
Selon le ministère de l’Éducation nationale, l’école maternelle comprend la petite, la moyenne et la grande section et forme le **cycle 1**, celui des apprentissages premiers. Les enseignements s’organisent autour de cinq domaines : le langage, l’activité physique, les activités artistiques, les premiers outils pour structurer la pensée (nombres, formes) et l’exploration du monde. Les enfants y découvrent aussi l’écrit.

Les parents sont membres à part entière de la communauté éducative : l’enseignant dialogue avec eux, et des représentants élus siègent au conseil d’école.


**Préparer la séparation.** Pour un enfant qui n’a pas fréquenté la crèche, l’école est souvent la première séparation longue. Des temps de garde chez un proche, des jeux de « faire semblant » (jouer à l’école, à la maîtresse), un objet de la maison dans la poche et un rituel d’au revoir toujours identique aident à apprivoiser ce changement. Restez confiant : votre sérénité le rassure.

**Les premières semaines.** Fatigue, pleurs le soir, retour de difficultés passées (sommeil, propreté) sont fréquents en début d’année. Préservez les nuits, allégez les activités, et prenez le temps d’échanger avec l’enseignant si quelque chose vous inquiète.

## Au quotidien
- **Inscription** : renseignez-vous tôt auprès de votre mairie (certaines ouvrent les inscriptions avant le printemps). Elle vous délivre un certificat d’inscription, à présenter ensuite au directeur ou à la directrice de l’école.
- **Avant la rentrée** : passez devant l’école, parlez de ce qu’on y fait, lisez des livres sur la maternelle.
- **Autonomie** : vêtements faciles à enfiler, chaussures à scratch, aller aux toilettes seul autant que possible.
- **Le jour J** : au revoir clair et chaleureux, sans vous éclipser en douce ; dites quand vous reviendrez.
- **Après l’école** : un temps calme, un goûter, et de l’écoute plutôt qu’un interrogatoire.
- **Fatigue** : les premières semaines sont intenses ; préservez le sommeil.

## Questions fréquentes
**Mon enfant n’est pas tout à fait propre, peut-il entrer à l’école ?**
Parlez-en avec l’équipe : l’apprentissage de la propreté se poursuit souvent pendant la petite section.

**Peut-on choisir son école ?**
Chaque habitant est affecté à l’école de son secteur ; une dérogation peut être accordée à titre exceptionnel par le maire. En cas de difficulté, la direction académique de votre département peut vous renseigner.

**Il pleure tous les matins, que faire ?**
C’est une réaction fréquente au début. Gardez un rituel court et rassurant, parlez avec l’enseignant, et consultez si la détresse persiste plusieurs semaines.

## Quand demander conseil
Parlez avec l’enseignant et le médecin si votre enfant reste très en détresse à la séparation après plusieurs semaines, s’il parle peu ou de façon difficile à comprendre, s’il a du mal à jouer avec les autres, ou si son sommeil et son appétit se dégradent. Un dépistage de la vue et du langage est proposé en maternelle : suivez ses résultats.

${FIN}`,
  },
  {
    ...CHILD, slug: 'apprendre-a-lire-accompagner-son-enfant', category: 'ecole-garde', min_age_months: 60, max_age_months: 107, tags: ['lecture', 'CP', 'apprentissages', 'dyslexie'],
    title: 'Apprendre à lire : comment accompagner son enfant ?',
    summary: 'Comment se déroule l’apprentissage de la lecture, ce que les parents peuvent faire à la maison et les signes qui doivent alerter.',
    sources: [S.lecture, S.sante611],
    body_md: `## En bref
- Lire, c’est **associer des lettres à des sons** pour en tirer du sens ; cela mobilise vue, ouïe, langage, attention et mémoire.
- Après **deux ou trois mois de CP**, un enfant qui progresse lit en général **quelques mots simples**.
- À la maison : **lire des histoires ensemble**, revoir les sons étudiés en classe, **encourager sans forcer**.
- Si le principe lettres-sons **n’est pas compris à Noël du CP**, parlez-en à l’enseignant et au médecin.

## Comprendre
Selon mpedia, la lecture conditionne largement la réussite dans les autres matières : une difficulté qui s’installe peut entraîner découragement et perte de motivation. Les causes possibles de difficultés sont variées : manque de contact avec les livres, langage oral encore fragile, trouble de la vue ou de l’audition, ou trouble des apprentissages. Certains enfants ont simplement besoin de plus de répétitions.

L’enseignant repère les enfants qui avancent moins vite et peut reprendre les bases en petits groupes, notamment la **conscience phonologique** (percevoir et manipuler les sons de la langue).


**Le rôle de l’oral.** Un enfant qui a beaucoup de vocabulaire, qui entend des histoires et qui a l’habitude de raconter comprend plus facilement ce qu’il déchiffre. Parler avec lui, lui poser des questions sur ce qu’il vit, raconter des souvenirs ou décrire des images sont des façons simples de soutenir la lecture, dès la maternelle.

**Les devoirs de lecture.** Des moments courts et réguliers valent mieux qu’une longue séance le dimanche. Installez-vous au calme, sans écran, après un goûter et une pause. Si la lecture du soir devient une épreuve, signalez-le à l’enseignant plutôt que d’insister : il pourra adapter les exercices.

## Au quotidien
- **Lisez-lui des histoires** tous les jours, même quand il commence à lire seul : le plaisir avant tout.
- **Jeux de sons** : trouver des mots qui riment, qui commencent par le même son, découper les mots en syllabes.
- **Revoyez les sons** travaillés en classe, en accord avec l’enseignant, sur des temps courts.
- **Lecture du quotidien** : panneaux, recettes, listes de courses, jeux de société.
- **Valorisez l’effort** plutôt que la vitesse ; évitez les comparaisons avec les frères et sœurs ou les copains.
- **Vérifiez vue et audition** lors des examens de suivi.

## Questions fréquentes
**Faut-il lui apprendre à lire avant le CP ?**
Inutile de forcer : en grande section, les jeux de sons, le vocabulaire et le plaisir des livres préparent très bien l’apprentissage.

**Il devine les mots au lieu de les déchiffrer…**
Signalez-le à l’enseignant, qui vous indiquera comment l’accompagner sur le déchiffrage.

**Les écrans éducatifs peuvent-ils aider ?**
Ils ne remplacent pas la lecture partagée ; Santé.fr conseille de fixer des plages horaires et de varier les activités.

## Quand demander conseil
Consultez le médecin traitant ou le pédiatre si les difficultés persistent, si votre enfant a eu des troubles du langage oral, si des troubles des apprentissages existent dans la famille, ou s’il se décourage, refuse d’aller à l’école ou a mal au ventre avant la classe. Le médecin fera le point et pourra prescrire un bilan, par exemple orthophonique ; le médecin scolaire est aussi un interlocuteur.

${FIN}`,
  },
  {
    ...CHILD, slug: 'harcelement-scolaire-que-faire', category: 'ecole-garde', safety_critical: true, min_age_months: 36, tags: ['harcèlement', 'cyberharcèlement', 'école', '3018'],
    title: 'Harcèlement scolaire : repérer les signes et agir',
    summary: 'Les signaux qui doivent alerter, comment en parler avec votre enfant, qui contacter à l’école et le rôle du 3018.',
    sources: [S.harcelement],
    body_md: `## En bref
- Le harcèlement, ce sont des **violences répétées** (verbales, morales, physiques, vols) ; en ligne, on parle de **cyberharcèlement**.
- Signes possibles : **repli**, nervosité, anxiété, fatigue, **troubles du sommeil ou de l’alimentation**, baisse des résultats, réactions inhabituelles au téléphone.
- **Écoutez, rassurez, notez les faits** et conservez les preuves.
- Contactez **la direction de l’école** ; en l’absence de réponse rapide, le **3018**.

## Comprendre
Selon le ministère de l’Éducation nationale, le harcèlement peut prendre des formes très variées : moqueries, mises à l’écart, rumeurs, coups, vols, messages blessants sur les réseaux ou par SMS. L’enfant victime en parle rarement spontanément, par honte ou par peur d’aggraver les choses. C’est souvent un changement de comportement qui alerte les parents.

Le **3018** est le numéro national pour les situations de harcèlement et de cyberharcèlement ; il permet aussi de demander le retrait de contenus en ligne.


**Les formes du harcèlement.** Il peut s’agir de surnoms, de moqueries sur l’apparence ou les résultats, de rumeurs, d’exclusion des jeux, de bousculades, de vols d’affaires, de menaces ou de messages et photos diffusés en ligne. Ce qui le caractérise, c’est la **répétition** et le déséquilibre entre la victime et le ou les auteurs. Le cyberharcèlement peut poursuivre l’enfant jusque chez lui, le soir et le week-end.

**Après le signalement.** Restez en lien avec l’école pour savoir ce qui a été mis en place et vérifier que la situation s’améliore. Continuez à écouter votre enfant, à valoriser ses activités et ses amitiés en dehors de l’école, et demandez un soutien psychologique s’il en a besoin.

## Au quotidien
- **Dialoguez** : posez des questions ouvertes sur ses journées, ses copains, la récréation, sans juger.
- **Rassurez-le** : ce n’est pas sa faute, il a eu raison d’en parler, et vous allez l’aider.
- **Demandez-lui ce qu’il souhaite** et associez-le aux démarches.
- **Notez** les faits, dates et noms ; faites des **captures d’écran** en cas de cyberharcèlement.
- **Rencontrez la direction** : décrivez précisément la situation et demandez quelles mesures seront prises pour le protéger.
- **Ne contactez pas vous-même l’auteur** ou sa famille : cela peut aggraver la situation.
- **En ligne** : signalez les contenus sur la plateforme concernée ; vous pouvez demander leur retrait via le 3018.

## Questions fréquentes
**Mon enfant minimise, dois-je quand même agir ?**
Si vous observez des signes répétés, parlez-en à l’équipe éducative : elle peut observer ce qui se passe à l’école.

**Peut-on porter plainte ?**
Oui, vous avez le droit de déposer plainte, en particulier en cas de cyberharcèlement ou de violences.

**Et si mon enfant est témoin ?**
Encouragez-le à en parler à un adulte de confiance : les témoins jouent un rôle important pour faire cesser le harcèlement.

## Quand demander conseil
Contactez rapidement l’école et le **3018** dès que vous suspectez un harcèlement. Consultez le médecin si votre enfant est très anxieux, triste, dort ou mange mal, refuse d’aller à l’école ou a des plaintes physiques répétées. **S’il exprime des idées suicidaires ou s’il est en danger**, appelez le **3114** (24 h/24) ou le **15** / **112** ; en cas de violence grave, le **17**.

${FIN}`,
  },
  // ------------------------------------------------------------------ sécurité
  {
    ...CHILD, slug: 'accidents-domestiques-proteger-son-enfant', category: 'securite', safety_critical: true, tags: ['accidents domestiques', 'chutes', 'brûlures', 'intoxications', 'prévention'],
    title: 'Accidents domestiques : protéger son enfant à la maison',
    summary: 'Chutes, défenestrations, brûlures, intoxications, étouffements : les gestes de prévention pièce par risque et les numéros à connaître.',
    sources: [S.accidents, S.pileBouton],
    body_md: `## En bref
- Une **surveillance par un adulte** reste la première protection ; un enfant ou un adolescent ne doit pas assurer seul la surveillance d’un tout-petit.
- **Fenêtres et balcons** : rien qui permette de grimper dessous, dispositifs de sécurité aux fenêtres.
- **Produits ménagers, médicaments, cosmétiques en hauteur ou sous clé**, jamais dans une bouteille alimentaire.
- **Meubles fixés au mur**, barrières d’escalier, cache-prises.
- Numéros : **15** (Samu), **18** (pompiers), **112** (urgence européenne), **114** (personnes sourdes ou malentendantes).

## Comprendre
Selon Santé.fr (Santé publique France), les accidents de la vie courante sont une cause importante de blessures chez l’enfant. La plupart surviennent à la maison, dans des situations banales : un instant d’inattention, un objet laissé à portée, une fenêtre ouverte. En grandissant, l’enfant grimpe, ouvre, explore : la prévention doit évoluer avec son âge.

Vérifier que les équipements (lits, jouets, sièges) portent le marquage CE ou NF fait aussi partie des précautions.


**Faire le tour de la maison à hauteur d’enfant.** Se mettre à genoux dans chaque pièce permet de voir ce qui attire un enfant : prises, tiroirs, produits sous l’évier, câbles, objets brillants. Refaites ce tour à chaque étape (il marche, il grimpe, il ouvre les portes) et lors des vacances dans un lieu inconnu, chez des grands-parents ou en location.

**Apprendre les dangers aux plus grands.** À partir de 3-4 ans, expliquer simplement pourquoi on ne touche pas le four, les médicaments ou les prises, et pourquoi on ne grimpe pas près des fenêtres, complète les aménagements. Les enfants plus âgés peuvent apprendre les numéros d’urgence et ce qu’il faut dire au téléphone.

## Au quotidien
- **Chutes et défenestrations** : écartez chaises, lits, coffres des fenêtres ; installez des bloque-fenêtres ; ne laissez pas un jeune enfant seul sur un balcon ; barrières en haut et en bas des escaliers.
- **Meubles** : fixez bibliothèques, commodes et télévision au mur ; sécurisez les tiroirs.
- **Brûlures** : eau du bain à moins de 37 °C ; queues de casseroles vers l’intérieur ; plats chauds, bougies, allumettes et appareils chauffants hors de portée ; pas de bouillotte dans le lit.
- **Intoxications** : produits ménagers, médicaments et cosmétiques rangés en hauteur ou fermés à clé ; ne jamais transvaser dans une bouteille alimentaire ; renseignez-vous sur la toxicité des plantes.
- **Étouffement** : rangez petits objets, piles boutons, sacs plastiques ; surveillez les repas, attention aux cacahuètes et aliments durs chez les petits.
- **Étranglement** : pas de cordons, colliers ou écharpes pendant le jeu et le sommeil ; cordons de stores hors de portée.
- **Électricité** : cache-prises, rallonges débranchées, pas d’appareil électrique près de l’eau.
- **Animaux** : ne laissez jamais un jeune enfant seul avec un animal.

## Questions fréquentes
**Il a avalé un produit ménager ou un médicament, que faire ?**
Ne le faites pas vomir et ne lui donnez rien à boire sans avis. Appelez le **15** ou un centre antipoison, en gardant l’emballage à portée.

**Il a avalé une pile bouton ?**
C’est une urgence, même en cas de simple doute : appelez immédiatement le **15** ou un centre antipoison en précisant qu’il s’agit d’une pile bouton. Selon l’Assurance Maladie, laissez l’enfant à jeun (ni boisson ni aliment), ne le faites pas vomir et gardez l’emballage de la pile pour les urgences.

**À quel âge peut-on relâcher la vigilance ?**
Les risques changent avec l’âge mais ne disparaissent pas : défenestrations, brûlures et intoxications concernent aussi les plus grands. Expliquez les dangers et adaptez les aménagements.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de chute de hauteur, de choc à la tête suivi de vomissements, somnolence ou comportement inhabituel, de brûlure étendue ou sur le visage, les mains ou les parties intimes, d’ingestion d’un produit ou d’une pile, de difficulté à respirer ou d’étouffement. Consultez rapidement après tout accident qui vous inquiète.

${FIN}`,
  },
  {
    ...CHILD, slug: 'noyade-prevention-enfant', category: 'securite', safety_critical: true, tags: ['noyade', 'piscine', 'baignade', 'été'],
    title: 'Prévenir la noyade : les règles d’or avec un enfant',
    summary: 'Surveillance constante, un adulte désigné, apprentissage de la nage et vigilance autour des piscines : l’essentiel pour une baignade en sécurité.',
    sources: [S.noyade, S.noyadeSpf, S.accidents],
    body_md: `## En bref
- **Ne jamais quitter un enfant des yeux** près de l’eau, et **se baigner avec lui**.
- **Un adulte responsable par enfant**, désigné à l’avance, qui ne fait rien d’autre pendant la baignade.
- **Apprendre à nager le plus tôt possible** et familiariser l’enfant avec l’eau dès le plus jeune âge.
- **Piscines** : les systèmes de sécurité sont utiles mais **ne remplacent jamais la surveillance** ; vigilance redoublée avec les piscines hors-sol.

## Comprendre
Selon l’Assurance Maladie, s’appuyant sur Santé publique France, 1 418 noyades ont été recensées entre le 1er juin et le 30 septembre 2025, dont 409 suivies d’un décès, et les enfants de moins de 6 ans représentaient 27 % des victimes. Les noyades en piscine concernent davantage les moins de 6 ans. Une noyade est rapide et **silencieuse** : un enfant qui coule ne crie pas forcément et ne se débat pas toujours.

Santé.fr rappelle qu’un bébé peut se noyer dans **moins de 5 cm d’eau** : bain, bassine, seau, pataugeoire.


**Préparer les vacances.** Avant de partir, renseignez-vous sur la présence d’une piscine sur le lieu de séjour et sur ses dispositifs de sécurité. Rappelez les règles dès l’arrivée : on ne va pas au bord de l’eau sans adulte, on attend l’autorisation pour se baigner. Lors des réunions de famille ou entre amis, c’est souvent quand tout le monde pense que « quelqu’un regarde » que personne ne surveille vraiment : désignez une personne.

**Apprendre à nager, une protection pour la vie.** Santé publique France encourage l’apprentissage de la nage le plus tôt possible et la familiarisation avec l’eau dès le plus jeune âge. Cela ne remplace jamais la surveillance, mais donne à l’enfant des réflexes et de l’aisance en cas de chute dans l’eau.

## Au quotidien
- **Désignez à voix haute** l’adulte qui surveille ; changez de surveillant en le disant clairement.
- **Pas de téléphone, de lecture ou de sieste** pendant la surveillance.
- **Bain** : restez à côté du bébé ou du jeune enfant, même quelques secondes ; videz baignoires, bassines et pataugeoires après usage.
- **Piscine privée** : activez les dispositifs de sécurité (barrière, alarme, couverture, abri) et refermez-les après chaque baignade.
- **Équipements** : Santé.fr conseille d’éviter les bouées gonflables et de préférer les brassards, sans qu’ils remplacent la surveillance.
- **Mer, lac, rivière** : zones surveillées, respect des drapeaux et des consignes ; entrez progressivement dans l’eau.
- **Cours de natation** et activités d’aisance aquatique : renseignez-vous auprès de votre commune ou de la piscine.

## Questions fréquentes
**Mon enfant sait nager, puis-je le laisser seul ?**
Non : même un enfant qui sait nager doit être surveillé en permanence, de près.

**À partir de quel âge apprendre à nager ?**
Le plus tôt possible : l’aisance aquatique se travaille dès le plus jeune âge, puis vient l’apprentissage de la nage.

**Les brassards suffisent-ils ?**
Non : ils aident, mais aucun équipement ne remplace la surveillance d’un adulte.

## Quand demander conseil
**En cas de noyade, appelez immédiatement le 15, le 18 ou le 112** (appels gratuits, même sans crédit), sortez l’enfant de l’eau si vous pouvez le faire en sécurité et suivez les consignes des secours. Après un épisode où l’enfant a bu la tasse de façon importante, toussé longtemps, ou s’il est essoufflé, somnolent ou vomit dans les heures qui suivent, consultez en urgence. Une formation aux gestes de premiers secours est précieuse pour tous les parents.

${FIN}`,
  },
  // ------------------------------------------------------------------ protection de l'enfance
  {
    ...CHILD, slug: 'enfance-en-danger-appeler-le-119', category: 'sante-mentale', safety_critical: true, tags: ['119', 'maltraitance', 'protection de l’enfance', 'violences'],
    title: 'Enfant en danger : le 119 et les bons réflexes',
    summary: 'Que faire si vous pensez qu’un enfant est maltraité ou en danger : le 119, le formulaire en ligne et les numéros d’urgence.',
    sources: [S.allo119, S.veo, S.signesDanger],
    body_md: `## En bref
- Le **119 – Allô Enfance en danger** est le numéro national dédié à la **prévention et à la protection des enfants en danger** ou en risque de l’être.
- Un **formulaire en ligne** permet aussi de signaler par écrit une situation préoccupante (il ne traite pas l’urgence).
- **Danger grave et immédiat** : **17** (police, gendarmerie), **18** (pompiers), **15** (Samu) ou **112** ; **114** par SMS pour les personnes sourdes ou malentendantes.
- Les violences éducatives (fessées, humiliations, menaces) sont **interdites par la loi** depuis 2019.

## Comprendre
Un enfant peut être en danger dans sa famille, chez des proches, à l’école ou ailleurs : violences physiques, psychologiques ou sexuelles, négligences graves, exposition aux violences entre adultes, délaissement. Selon le service 119, les éléments signalés peuvent être transmis, si nécessaire, au service de protection de l’enfance du département, afin de trouver les réponses les plus adaptées.

Le 119 concerne les enfants en danger, mais aussi ceux qui risquent de l’être : une inquiétude sérieuse suffit pour s’adresser à lui.


**Reconnaître des signes qui peuvent alerter.** Un enfant en danger ne le dit pas toujours, et les violences ne laissent pas toujours de marques visibles. Le ministère chargé des Solidarités cite, selon l’âge : des changements brusques du comportement (agitation, opposition, repli sur soi, désintérêt pour le jeu), des troubles du sommeil ou de l’alimentation, des régressions soudaines (propreté, langage), des douleurs répétées (maux de ventre, maux de tête, malaises), des difficultés scolaires, de l’irritabilité, de la tristesse ou de l’anxiété. Aucun de ces signes ne prouve à lui seul une maltraitance, mais ils justifient d’en parler à un professionnel ; le 119 peut être appelé même sans certitude.

**Le rôle de chacun.** Parents, proches, voisins, enseignants, animateurs, professionnels de santé : tout adulte qui s’inquiète pour un enfant peut s’adresser au 119. Protéger un enfant, c’est aussi soutenir les parents en difficulté, en les orientant vers les aides existantes.

## Au quotidien
- **Écoutez** un enfant qui se confie, calmement, sans l’interroger longuement ni mettre en doute sa parole ; dites-lui qu’il a bien fait de parler.
- **Ne promettez pas le secret** : expliquez que vous allez demander de l’aide pour le protéger.
- **Notez** ce que vous avez vu ou entendu (dates, faits, mots de l’enfant).
- **Ne confrontez pas** vous-même la personne soupçonnée.
- **Appelez le 119** ou utilisez le formulaire en ligne pour une situation préoccupante sans danger immédiat.
- **Parlez-en** aussi au médecin, à l’école ou à la PMI, qui ont l’habitude de ces situations.

## Questions fréquentes
**J’ai peur de me tromper, puis-je quand même appeler ?**
Oui : signaler une inquiétude de bonne foi aide les professionnels à évaluer la situation. Seul un usage abusif dans l’intention de nuire est puni par la loi.

**Je suis moi-même à bout et j’ai peur de mal faire avec mon enfant…**
Demander de l’aide est un geste protecteur : parlez-en à votre médecin ou à la PMI, qui peuvent vous orienter vers un soutien adapté.

**Le formulaire en ligne remplace-t-il l’appel ?**
Il permet un signalement écrit, sans échange immédiat ni rappel ; en cas de danger urgent, il faut appeler les secours.

## Quand demander conseil
**Appelez immédiatement le 17, le 15 ou le 112** si un enfant est en danger grave et immédiat. Pour toute inquiétude, appelez le **119**. Si un enfant ou un adolescent exprime des idées suicidaires, appelez le **3114**. Après des violences, l’enfant doit être vu par un médecin.

${FIN}`,
  },
];
