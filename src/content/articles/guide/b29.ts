/**
 * Guide complet — lot 29 (27/10/2026) : école et vie scolaire
 * (inscription en mairie et admission, changement d'école et dérogation, absences et assiduité, horaires d'accueil et de sortie,
 * allocation de rentrée scolaire et budget, assurance scolaire, petite section, passage au CP, évaluations Repères, devoirs,
 * difficultés scolaires et PPRE, relation avec l'enseignant, parents séparés, conseil d'école, périscolaire, cantine,
 * sorties scolaires et parents accompagnateurs, fatigue scolaire, téléphone portable et écrans, harcèlement et cyberharcèlement,
 * refus scolaire anxieux, examens de santé, trajet de l'école).
 * Articles rédigés avec l'aide d'une IA à partir de pages officielles ou de référence françaises réellement consultées le 2026-10-27
 * (Service-Public.fr / DILA, justice.fr, Éduscol, Assemblée nationale, ameli.fr, mpedia.fr, Caf, info.gouv.fr, jeunes.gouv.fr,
 * collectivites-locales.gouv.fr, DREETS Occitanie, préfectures du Calvados et de Loir-et-Cher) : statut « À vérifier ».
 * Note : plusieurs fiches Service-Public.fr ont été lues dans leur version traduite (?lang=en) de la même fiche ; l'URL indiquée est celle de la fiche française.
 */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27. `published` = date de publication, de vérification ou de mise à jour affichée par la page.
const S = {
  spMaternelle: { label: 'Service-Public.fr (DILA) — Inscription à l’école maternelle', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1864', consulted_on: C, published: '2025-11-06' },
  spElementaire: { label: 'Service-Public.fr (DILA) — Inscrire son enfant à l’école primaire (élémentaire)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1865', consulted_on: C, published: '2025-01-10' },
  spInstruction: { label: 'Service-Public.fr (DILA) — Instruction obligatoire', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1898', consulted_on: C, published: '2025-11-06' },
  spAssiduite: { label: 'Service-Public.fr (DILA) — Assiduité scolaire et absentéisme', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A16575', consulted_on: C, published: '2025-11-06' },
  spSurveillance: { label: 'Service-Public.fr (DILA) — Surveillance des élèves à l’école primaire (maternelle ou élémentaire)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F424', consulted_on: C, published: '2026-01-23' },
  spARS: { label: 'Service-Public.fr (DILA) — Allocation de rentrée scolaire (ARS)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1878', consulted_on: C, published: '2026-08-04' },
  spAssurance: { label: 'Service-Public.fr (DILA) — À quoi sert l’assurance scolaire ?', url: 'https://www.service-public.gouv.fr/associations/vosdroits/F1871', consulted_on: C, published: '2025-09-15' },
  spInfoParents: { label: 'Service-Public.fr (DILA) — Maternelle et élémentaire : information des parents sur la scolarité de leur enfant', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1391', consulted_on: C, published: '2024-01-29' },
  spConseilEcole: { label: 'Service-Public.fr (DILA) — Conseil d’école à l’école primaire (maternelle et élémentaire)', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1399', consulted_on: C, published: '2026-09-28' },
  spPortable: { label: 'Service-Public.fr (DILA) — Pause numérique : interdiction du téléphone portable au lycée à la rentrée 2026, quelles modalités ?', url: 'https://www.service-public.gouv.fr/particuliers/actualites/A19051', consulted_on: C, published: '2026-08-25' },
  spHarcelement: { label: 'Service-Public.fr (DILA) — Harcèlement scolaire au collège et au lycée', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F31985', consulted_on: C, published: '2025-11-04' },
  justicePPRE: { label: 'justice.fr (fiche Service-Public.fr) — Qu’est-ce qu’un programme personnalisé de réussite éducative (PPRE) ?', url: 'https://www.justice.fr/fiche/programme-personnalise-reussite-educative-ppre', consulted_on: C, published: '2024-10-14' },
  eduscolSorties: { label: 'Éduscol (ministère de l’Éducation nationale) — Guide relatif à l’organisation des sorties et voyages scolaires dans le premier degré (décembre 2025)', url: 'https://eduscol.education.gouv.fr/sites/default/files/document/guide-sorties-et-voyages-scolaires-premier-degre-101622.pdf', consulted_on: C },
  eduscolReperes: { label: 'Éduscol (ministère de l’Éducation nationale, DEPP) — Évaluations nationales Repères CP-CE1-CE2-CM1-CM2, septembre 2026 (présentation)', url: 'https://eduscol.education.gouv.fr/sites/default/files/document/educationnationalereperes26diaporama-de-presentation-128812.pdf', consulted_on: C },
  anDevoirs: { label: 'Assemblée nationale — Question écrite n° 19422 sur les devoirs à la maison et réponse du ministère de l’Éducation nationale (JO du 23 juillet 2013)', url: 'https://www.assemblee-nationale.fr/dyn/14/questions/QANR5L14QE19422.pdf', consulted_on: C, published: '2013-07-23' },
  ameli4a10: { label: 'ameli.fr — 4 examens de suivi médical entre les 4 ans et 10 ans de l’enfant', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/suivi-medical-entre-4-et-10-ans', consulted_on: C, published: '2026-02-18' },
  ameliSommeil: { label: 'ameli.fr — Une bonne hygiène de vie pour que mon enfant dorme bien', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/hygiene-vie-bon-sommeil-enfant', consulted_on: C, published: '2026-03-12' },
  ameliDortMal: { label: 'ameli.fr — Mon enfant dort mal : comment réagir ?', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/que-faire-enfant-dort-mal', consulted_on: C },
  mpediaMaternelle: { label: 'mpedia.fr (AFPA) — Entrée à l’école maternelle : un grand pas vers la sociabilisation', url: 'https://www.mpedia.fr/art-entree-a-lecole-maternelle/', consulted_on: C, published: '2023-08-31' },
  mpediaLecture: { label: 'mpedia.fr (AFPA) — Lecture : apprentissage, troubles et solutions', url: 'https://www.mpedia.fr/art-apprentissage-lecture/', consulted_on: C, published: '2019-07-09' },
  cafRefus: { label: 'Caf (Vies de famille) — Quand l’angoisse empêche d’aller à l’école', url: 'https://www.caf.fr/allocataires/vies-de-famille/articles/quand-l-angoisse-empeche-d-aller-l-ecole', consulted_on: C, published: '2025-10-30' },
  cafAstuces: { label: 'Caf (Vies de famille) — Les 5 astuces conso de la rentrée', url: 'https://www.caf.fr/allocataires/vies-de-famille/articles/les-5-astuces-conso-de-la-rentree', consulted_on: C, published: '2026-08-03' },
  dreetsFournitures: { label: 'DREETS Occitanie (DGCCRF) — Rentrée scolaire : bien choisir les fournitures de vos enfants (conseils DGCCRF)', url: 'https://occitanie.dreets.gouv.fr/Rentree-scolaire-choisissez-des-fournitures-sans-risques-pour-vos-enfants', consulted_on: C, published: '2026-09-16' },
  infoHarcelement: { label: 'info.gouv.fr — Le harcèlement et le cyberharcèlement à l’école', url: 'https://www.info.gouv.fr/toute-l-actualite/le-harcelement-a-lecole', consulted_on: C },
  infoCyber: { label: 'info.gouv.fr — Cyberharcèlement : comment le reconnaître et agir ?', url: 'https://www.info.gouv.fr/actualite/cyberharcelement-comment-le-reconnaitre-et-agir', consulted_on: C, published: '2026-09-25' },
  infoTemoin: { label: 'info.gouv.fr — Victime ou témoin, dites non au harcèlement', url: 'https://www.info.gouv.fr/actualite/victime-ou-temoin-dites-non-au-harcelement', consulted_on: C, published: '2022-02-23' },
  jeunesACM: { label: 'jeunes.gouv.fr (ministère chargé de la jeunesse) — Parents, ce qu’il faut savoir sur les accueils collectifs de mineurs', url: 'https://www.jeunes.gouv.fr/parents-ce-qu-il-faut-savoir-sur-les-accueils-collectifs-de-mineurs-211', consulted_on: C },
  pref41Periscolaire: { label: 'Préfecture de Loir-et-Cher — Les accueils de loisirs périscolaires', url: 'https://www.loir-et-cher.gouv.fr/index.php/Actions-de-l-Etat/Jeunesse-sports-et-vie-associative/Jeunesse/Projet-Educatif-de-Territoire-Plan-Mercredi/Les-accueils-de-loisirs-periscolaires', consulted_on: C, published: '2018-08-07' },
  collectivitesCantine: { label: 'collectivites-locales.gouv.fr — La restauration scolaire', url: 'https://www.collectivites-locales.gouv.fr/animer-les-territoires/services-la-population/les-services-publics-locaux/lenfance-et-lenseignement/la-restauration-scolaire', consulted_on: C },
  calvadosTrajet: { label: 'Préfecture du Calvados — Rendre le trajet de l’école plus sûr : nos conseils pour une rentrée en toute sécurité', url: 'https://www.calvados.gouv.fr/Actualites/Securite-Risques-Securite-Routiere-Justice/Rendre-le-trajet-de-l-ecole-plus-sur-nos-conseils-pour-une-rentree-en-toute-securite', consulted_on: C, published: '2023-11-14' },
} satisfies Record<string, ArticleSource>;

const CHILD = { journeys: ['child'] as LibArticle['journeys'], status: 'to_review' as const };
const FIN = 'Cet article vous informe de façon générale et ne remplace pas l’avis d’un professionnel (enseignant, directeur d’école, médecin, psychologue) qui connaît votre situation.';

export const GUIDE_B29: LibArticle[] = [
  // ───────────────────────────── Inscription et démarches ─────────────────────────────
  {
    ...CHILD,
    slug: 'inscription-ecole-elementaire-cp-mairie-admission',
    title: 'Inscrire son enfant au CP : mairie, pièces à fournir et admission à l’école',
    summary: 'Les deux étapes de l’inscription à l’école élémentaire publique (mairie puis école), le calendrier, les justificatifs demandés et les cas particuliers, pour aborder l’entrée au CP sans stress administratif.',
    category: 'ecole-garde',
    tags: ['inscription école', 'CP', 'école élémentaire', 'mairie', 'certificat d’inscription', 'vaccins', 'rentrée'],
    min_age_months: 60, max_age_months: 84,
    body_md: `L’entrée au CP marque le passage à l’école élémentaire. Côté démarches, tout se joue en deux temps : la mairie, puis l’école. Voici comment s’y retrouver, selon les informations de Service-Public.fr.

## En bref
- Dans l’école publique, l’inscription se fait **d’abord en mairie**, qui délivre un **certificat d’inscription** indiquant l’école d’affectation, **puis à l’école** pour l’admission définitive.
- L’inscription en mairie doit être faite **au plus tard en juin** avant la rentrée ; elle commence souvent en mars, parfois plus tôt selon les communes.
- Pièces habituelles : justificatif d’identité de l’enfant et du parent, justificatif de domicile récent, puis à l’école le justificatif des **vaccinations obligatoires**.
- Si l’école de votre enfant comprend maternelle et élémentaire, le passage en CP se fait en général **sans nouvelle inscription**.
- L’inscription en école élémentaire publique est **gratuite**.

## Comprendre
L’instruction est obligatoire dès 3 ans ; pour l’élémentaire, l’enfant entre au CP à la rentrée de l’année civile de ses 6 ans. Un enfant ne reste pas en maternelle au-delà de 6 ans, sauf décision d’une commission spécialisée. Une admission plus précoce en élémentaire peut être possible sous conditions.

**Étape 1 : la mairie.** Elle vérifie votre domicile et affecte l’enfant à l’école de son secteur. Les pièces demandées sont, selon Service-Public.fr :
- un document prouvant votre identité et celle de l’enfant (livret de famille, carte d’identité, passeport, copie d’acte de naissance ou attestation sur l’honneur) ;
- un justificatif de domicile récent (une attestation sur l’honneur peut être acceptée).

D’autres documents peuvent être demandés pour la cantine ou le périscolaire. La mairie remet ensuite le certificat d’inscription.

**Étape 2 : l’école.** Présentez-vous dès que possible à l’école indiquée, avec le certificat de la mairie et un document attestant que l’enfant a reçu les vaccins obligatoires pour son âge (ou justifiant d’une contre-indication). Le directeur procède alors à l’admission.

**Cas fréquents :**
- l’école ne compte que des classes de maternelle : l’enfant est affecté à l’élémentaire de son secteur ;
- vous souhaitez une autre école que celle du secteur : il faut demander une **dérogation** à la mairie, qui n’est pas automatique ;
- vous déménagez : une procédure d’inscription dans la nouvelle commune s’applique.

Pour une école privée, l’inscription se fait directement auprès de l’établissement, selon ses propres dates et conditions ; des frais de scolarité peuvent être demandés.

## Au quotidien
- **Notez la période d’inscription** de votre commune dès l’hiver : site de la mairie, panneau d’affichage, accueil de l’école.
- **Préparez un dossier** : copie du livret de famille, justificatif de domicile, carnet de santé (pages vaccins). Gardez des copies numériques.
- **Profitez du passage en mairie** pour vous renseigner sur la cantine, l’accueil du matin et du soir, le mercredi.
- **Préparez l’enfant** : passez devant la nouvelle école, parlez de ce qui va changer (cour plus grande, lecture, nouvel enseignant), sans en faire une épreuve.
- **Anticipez le premier jour** : horaires, qui accompagne, qui vient chercher l’enfant le soir.

## Questions fréquentes
**Faut-il réinscrire mon enfant chaque année ?**
Non, tant qu’il reste dans la même école. Une nouvelle démarche est nécessaire en cas de changement d’école ou de commune.

**Je n’ai pas de justificatif de domicile à mon nom. Que faire ?**
Service-Public.fr indique qu’une attestation sur l’honneur peut être acceptée. Renseignez-vous auprès de la mairie ; en cas de difficulté, les services départementaux de l’Éducation nationale peuvent être sollicités.

**Mon enfant n’a pas toutes ses vaccinations obligatoires. Peut-il être admis ?**
Le justificatif des vaccins obligatoires (ou d’une contre-indication) est demandé. Parlez-en rapidement avec votre médecin pour mettre à jour le calendrier vaccinal.

**Que risque-t-on si l’enfant n’est pas inscrit ?**
Sans motif valable, l’absence d’inscription peut être sanctionnée, sauf si l’enfant est instruit en famille avec autorisation. L’inscription est surtout la garantie de sa place et de son suivi.

## Quand demander conseil
Adressez-vous à la mairie pour toute question d’affectation, au directeur d’école pour l’admission, et aux services départementaux de l’Éducation nationale si la situation est bloquée. Si votre enfant a un besoin particulier de santé ou un handicap, signalez-le dès l’inscription pour préparer son accueil. En cas d’urgence médicale, appelez le 15 ou le 112.

${FIN}`,
    sources: [S.spElementaire, S.spInstruction],
  },
  {
    ...CHILD,
    slug: 'changer-d-ecole-derogation-secteur-demenagement',
    title: 'Changer d’école : secteur scolaire, dérogation et déménagement',
    summary: 'Pourquoi votre enfant est affecté à une école précise, comment demander une dérogation, et que faire en cas de déménagement en cours d’année pour qu’il retrouve vite une classe.',
    category: 'ecole-garde',
    tags: ['dérogation', 'carte scolaire', 'secteur scolaire', 'changer d’école', 'déménagement', 'mairie'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Déménagement, garde alternée, envie d’une autre école plus proche du travail : changer d’école soulève des questions pratiques. Le principe, les exceptions et les délais à connaître, d’après Service-Public.fr.

## En bref
- En principe, l’enfant va dans l’école de son **secteur**, en général la plus proche du domicile ; la sectorisation est décidée par le **conseil municipal**.
- Pour une autre école, une **demande de dérogation** s’adresse à la **mairie** ; elle n’est **pas automatique**.
- Pour une école d’une **autre commune**, l’accord du maire de la commune d’accueil est nécessaire, généralement pour une situation particulière.
- En cas de **déménagement**, l’inscription dans le nouvel établissement doit être faite **dans les 8 jours** auprès de la mairie de la nouvelle résidence.
- Un enfant inscrit dans une commune d’accueil peut y poursuivre sa scolarité du même cycle (maternelle ou élémentaire).

## Comprendre
**Le secteur scolaire.** Chaque adresse dépend d’une école publique. C’est la mairie qui affecte l’enfant et délivre le certificat d’inscription. Ce système permet de répartir les élèves entre les écoles de la commune.

**La dérogation.** Vous pouvez demander qu’il soit scolarisé dans une autre école. La demande se fait à la mairie, souvent avec un formulaire et des justificatifs. Service-Public.fr cite comme exemples de situations particulières l’absence d’école dans la commune ou des parents séparés dont les enfants sont scolarisés dans des villes différentes. Si la dérogation est accordée, l’inscription définitive se fait dans l’école choisie, et il faut prévenir le directeur de l’école où l’enfant aurait dû aller.

**Le passage maternelle-élémentaire.** Si l’enfant est en maternelle dans une autre commune et que vous souhaitez qu’il y reste en élémentaire, une nouvelle demande de dérogation est nécessaire. Pour revenir dans votre commune, l’inscription se fait d’abord en mairie, puis à l’école.

**Le déménagement.** L’obligation d’instruction continue : Service-Public.fr précise que l’inscription doit être faite dans les 8 jours auprès de la mairie du nouveau domicile. Pour un enfant instruit en famille, le changement est à signaler au directeur académique dans le même délai.

## Au quotidien
- **Anticipez** : si un déménagement est prévu, contactez la future mairie avant le départ pour connaître les pièces et l’école de secteur.
- **Prévenez l’école actuelle** : le directeur pourra vous indiquer comment transmettre le dossier scolaire et le livret de votre enfant.
- **Gardez une copie** des derniers bilans du livret scolaire et, le cas échéant, du PAI, du PAP ou du PPS : cela facilite l’accueil dans la nouvelle classe.
- **Argumentez une dérogation avec des éléments concrets** : horaires de travail, mode de garde, fratrie, santé. Un dossier clair est plus simple à étudier.
- **Préparez l’enfant** : expliquez-lui le changement, visitez la nouvelle école si possible, et gardez des liens avec ses anciens camarades.

## Questions fréquentes
**Mon enfant doit-il forcément changer d’école quand nous déménageons ?**
Si vous quittez la commune, l’inscription dans la commune de votre nouvelle résidence est la règle ; rester dans l’ancienne école suppose en général une dérogation et l’accord des communes concernées. Renseignez-vous auprès des deux mairies.

**La dérogation a été refusée. Ai-je un recours ?**
La décision relève de la mairie. Vous pouvez demander les motifs et, si votre situation évolue, présenter une nouvelle demande. Le directeur de l’école ou l’inspection peuvent vous orienter.

**Faut-il refaire une inscription en mairie en cas de dérogation ?**
Oui : la dérogation passe par la mairie, puis l’inscription définitive se fait dans l’école retenue.

**Et pour une école privée ?**
L’inscription se fait directement auprès de l’établissement, sans secteur ni dérogation municipale.

## Quand demander conseil
Pour toute difficulté d’affectation, contactez la mairie puis, si besoin, les services départementaux de l’Éducation nationale. Si un changement d’école est envisagé à cause d’un mal-être ou de violences subies, parlez-en d’abord avec la direction et, si un enfant est en danger, appelez le 119. En cas de détresse ou d’idées suicidaires chez un proche, le 3114 répond jour et nuit.

${FIN}`,
    sources: [S.spMaternelle, S.spElementaire, S.spInstruction],
  },
  {
    ...CHILD,
    slug: 'absences-scolaires-justifier-assiduite-primaire',
    title: 'Absences à l’école : comment les justifier et ce que prévoit la règle d’assiduité',
    summary: 'Prévenir l’école, motifs reconnus, certificat médical, absences répétées : ce que les parents doivent savoir sur l’assiduité à l’école maternelle et élémentaire.',
    category: 'ecole-garde',
    tags: ['absence', 'assiduité', 'justificatif', 'certificat médical', 'école primaire', 'vacances', 'absentéisme'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Un rhume, un rendez-vous, un mariage dans la famille : il arrive que votre enfant manque l’école. L’instruction étant obligatoire dès 3 ans, les absences sont encadrées. Voici les repères donnés par Service-Public.fr.

## En bref
- Un élève inscrit doit être présent aux heures de classe ; les parents doivent **justifier toute absence**, quels que soient sa date et son motif.
- Prévenez l’école **le plus tôt possible** ; si l’absence est prévisible, informez-la **à l’avance**.
- Motifs reconnus : maladie de l’enfant (ou d’un proche si elle est contagieuse), réunion solennelle de famille, incident de transport, déplacement des parents hors vacances avec l’enfant ; d’autres motifs peuvent être examinés.
- Un **certificat médical** n’est exigé que pour une **maladie contagieuse**.
- Des absences non justifiées répétées entraînent un dialogue avec l’école, puis des mesures d’accompagnement ; l’absentéisme n’entraîne pas la suspension des allocations familiales.

## Comprendre
**Le cadre.** Dès l’inscription, le directeur présente le règlement intérieur, qui précise comment les absences sont contrôlées ; il est signé par les parents. L’enseignant fait l’appel chaque demi-journée et signale les absences à la direction, qui contacte la famille si elle n’a pas été prévenue.

**Ce qui se passe en cas d’absences non justifiées**, selon Service-Public.fr :
- **dès la première** : l’enseignant ou le directeur rappelle l’importance de l’assiduité ; sans justificatif ou avec un motif inexact, le directeur peut informer le directeur académique (Dasen), qui adresse un avertissement et présente les dispositifs de soutien à la parentalité ;
- **à partir de 4 demi-journées dans le mois** : l’équipe éducative se réunit pour comprendre les causes ; des mesures d’accompagnement sont proposées dans un document signé par les parents et la direction, avec un référent (souvent l’enseignant) ;
- **au-delà de 10 demi-journées dans le mois** : réunion avec les parents, dispositif d’aide formalisé et information du Dasen ; si la situation persiste, le procureur peut être saisi.

Des sanctions pénales existent en dernier recours. L’objectif affiché est d’abord de comprendre ce qui empêche l’enfant de venir et d’aider la famille.

**Maternelle.** L’obligation s’applique dès la petite section ; un aménagement du temps de présence peut être discuté pour les plus jeunes (voir avec la direction).

## Au quotidien
- **Prévenez dès le matin** par le moyen prévu par l’école (téléphone, cahier de liaison, messagerie de l’école).
- **Donnez un motif simple et exact** : « malade », « rendez-vous médical », « obsèques ».
- **Au retour**, remplissez le coupon ou le mot d’absence demandé ; joignez un certificat seulement si la maladie est contagieuse ou si l’école le précise pour ce cas.
- **Rendez-vous médicaux** : quand c’est possible, choisissez des horaires hors classe ; sinon, prévenez à l’avance.
- **Récupérez le travail** manqué auprès de l’enseignant ou d’un camarade, sans surcharger l’enfant convalescent.
- **Absences répétées le matin** (mal au ventre, pleurs) : prenez le temps d’en parler avec l’enfant et l’enseignant ; une angoisse ou un souci à l’école peuvent se cacher derrière.

## Questions fréquentes
**Puis-je partir en vacances quelques jours avant les dates officielles ?**
Le départ anticipé en vacances n’est pas cité parmi les motifs reconnus. Un déplacement des parents hors vacances scolaires avec l’enfant peut être un motif d’absence ; les autres motifs sont examinés par l’Éducation nationale. Parlez-en à l’avance avec le directeur.

**Faut-il un certificat médical pour une gastro ou une otite ?**
Le certificat n’est exigé que pour les maladies contagieuses. Le règlement de l’école peut préciser les cas : renseignez-vous auprès du directeur ou de votre médecin.

**Les retards comptent-ils ?**
Des retards répétés donnent lieu à un dialogue avec la famille. S’ils persistent, l’école peut prendre d’autres mesures prévues par la réglementation.

**Mon enfant refuse d’aller à l’école. Est-ce une absence « injustifiée » ?**
Signalez la situation à l’école sans attendre : un refus lié à une angoisse demande un accompagnement, et l’équipe éducative peut proposer des aménagements.

## Quand demander conseil
Si les absences s’accumulent parce que votre enfant va mal (fatigue inhabituelle, douleurs, peur d’aller à l’école), consultez votre médecin et parlez-en avec l’équipe éducative. Si vous pensez qu’un enfant est en danger, appelez le 119. En cas de détresse psychique d’un proche, le 3114 répond 24 h/24. Urgence vitale : 15 ou 112.

${FIN}`,
    sources: [S.spAssiduite, S.spSurveillance, S.spMaternelle],
  },
  {
    ...CHILD,
    slug: 'horaires-accueil-sortie-ecole-qui-peut-recuperer-enfant',
    title: 'Accueil du matin, sortie de classe : qui est responsable et qui peut venir chercher votre enfant ?',
    summary: 'Les 10 minutes d’accueil, la sortie en maternelle et en élémentaire, les personnes autorisées, le passage à la cantine ou au périscolaire et les retards : les règles de surveillance à l’école primaire.',
    category: 'ecole-garde',
    tags: ['horaires école', 'sortie d’école', 'personne autorisée', 'rentrer seul', 'retard', 'surveillance', 'maternelle'],
    min_age_months: 36, max_age_months: 131,
    body_md: `À quelle heure l’école prend-elle le relais ? Votre enfant de CM1 peut-il rentrer seul ? Une voisine peut-elle venir le chercher en maternelle ? Service-Public.fr détaille ces règles de surveillance.

## En bref
- Les élèves sont accueillis **10 minutes avant** le début de chaque demi-journée ; avant, l’enfant reste sous la responsabilité de l’adulte qui l’accompagne.
- En **maternelle**, l’enfant est **remis directement aux parents** ou aux personnes qu’ils ont **désignées par écrit** ; l’école ne peut pas exiger d’âge minimum pour ces personnes.
- En **élémentaire**, l’enseignant accompagne les élèves jusqu’à la porte ; ensuite, l’enfant est sous la responsabilité des parents et peut attendre dehors ou rentrer seul.
- À la cantine ou au périscolaire, la responsabilité passe à l’organisateur (souvent la mairie).
- Des **retards répétés** donnent lieu à un dialogue avec la famille, puis à d’autres mesures s’ils persistent.

## Comprendre
**Le principe.** Dès que vous confiez votre enfant à l’école, l’équipe devient responsable de sa surveillance pendant tout le temps scolaire : classe, récréation, déplacements vers la piscine ou le gymnase, sorties. Le directeur organise cet accueil et un tableau de surveillance est affiché dans l’école.

**L’arrivée.** L’accueil commence 10 minutes avant la classe (l’école peut élargir ce créneau). Si vous déposez votre enfant plus tôt devant le portail, il reste sous votre responsabilité.

**La sortie en maternelle.** L’enseignant remet l’enfant aux parents ou aux personnes inscrites sur la liste remise en début d’année. Il peut s’agir d’un grand-parent, d’un voisin, d’une assistante maternelle ou d’un grand frère : l’école ne peut pas s’opposer à une personne désignée par écrit ni fixer d’âge minimum.

**La sortie en élémentaire.** Les élèves sont accompagnés jusqu’aux portes. Au-delà, c’est à la famille de décider : attendre un adulte, rentrer seul, rejoindre une activité.

**Cantine et périscolaire.** Les enseignants surveillent les enfants jusqu’à leur prise en charge par la cantine ou l’accueil périscolaire ; l’organisateur (par exemple la mairie pour la cantine d’une école publique) prend alors le relais.

**Sécurité.** Chaque année, deux exercices de mise en sûreté (mise à l’abri ou confinement) sont organisés.

## Au quotidien
- **Remplissez soigneusement la fiche de rentrée** : noms et téléphones des personnes autorisées, à mettre à jour en cours d’année si besoin.
- **Prévenez l’enseignant** par écrit si une autre personne vient exceptionnellement.
- **Rentrer seul en élémentaire** : faites le trajet plusieurs fois ensemble, repérez les traversées, convenez de ce qu’il fait si personne n’est à la maison.
- **Retard imprévu** : appelez l’école ou le périscolaire, et ayez un « plan B » (un parent d’élève, un voisin).
- **Expliquez à l’enfant** ce qu’il doit faire s’il ne voit personne à la sortie : retourner vers l’enseignant ou un adulte de l’école.

## Questions fréquentes
**À partir de quel âge mon enfant peut-il rentrer seul ?**
Aucun âge n’est fixé pour l’élémentaire : c’est une décision des parents, selon la maturité de l’enfant et le trajet. En maternelle, l’enfant est toujours remis à un adulte désigné.

**L’école peut-elle refuser de confier mon enfant de maternelle à son frère de 12 ans ?**
Si la personne a été désignée par écrit, l’école ne peut pas s’y opposer ni exiger d’âge minimum, selon Service-Public.fr.

**Que se passe-t-il en cas de retards fréquents le soir ?**
Un dialogue est engagé avec la famille pour trouver des solutions (périscolaire, relais). Si les retards persistent, l’école peut prendre des mesures plus contraignantes.

**Qui est responsable pendant le trajet en car scolaire ?**
Le département est chargé de la surveillance pendant le transport scolaire, et le maire de la sécurité sur la voie publique, notamment aux arrêts.

## Quand demander conseil
Pour toute question d’organisation, adressez-vous au directeur d’école ou au service périscolaire de la mairie. Si votre enfant se blesse à l’école, l’équipe vous prévient ; en cas d’urgence, elle appelle le 15 ou le 112. Si vous craignez pour la sécurité d’un enfant, le 119 répond jour et nuit.

${FIN}`,
    sources: [S.spSurveillance],
  },
  {
    ...CHILD,
    slug: 'allocation-de-rentree-scolaire-et-budget-fournitures',
    title: 'Allocation de rentrée scolaire et budget fournitures : les bons réflexes',
    summary: 'Qui peut recevoir l’allocation de rentrée scolaire 2026, quand elle est versée, quelles démarches faire, et des astuces pour des fournitures moins chères et plus sûres.',
    category: 'droits-demarches',
    tags: ['allocation de rentrée scolaire', 'ARS', 'Caf', 'fournitures scolaires', 'budget rentrée', 'liste de fournitures'],
    min_age_months: 60, max_age_months: 131,
    body_md: `La rentrée a un coût : fournitures, cartable, tenue de sport. L’allocation de rentrée scolaire (ARS) aide de nombreuses familles. Voici ses conditions pour 2026 selon Service-Public.fr, et des conseils de la Caf et de la DGCCRF pour bien acheter.

## En bref
- L’ARS concerne les enfants de **6 à 18 ans** scolarisés (pour 2026 : nés entre le 16 septembre 2008 et le 31 décembre 2020), sous **conditions de ressources**.
- Montants 2026 en métropole : **426,87 €** (6-10 ans), **450,41 €** (11-14 ans), **466,02 €** (15-18 ans).
- Versement **à partir du 18 août 2026** (dès le 4 août à La Réunion et Mayotte).
- Pour un enfant de moins de 16 ans, si vous êtes allocataire, **aucune démarche** en dehors de vos déclarations de revenus.
- Pour les fournitures : anticiper, trier ce que l’on a, acheter groupé, penser à l’occasion, et lire les étiquettes.

## Comprendre
**Les plafonds 2026** (revenu net catégoriel 2024), selon Service-Public.fr :
- 1 enfant : 28 956 € ;
- 2 enfants : 35 638 € ;
- 3 enfants : 42 320 €, puis 6 682 € par enfant supplémentaire.

En cas de léger dépassement, une allocation réduite (dite différentielle) peut être versée.

**Les démarches :**
- **allocataire, enfant de moins de 16 ans** : rien à faire, à condition d’avoir déclaré vos revenus ;
- **enfant de 16 à 18 ans** : il faut déclarer en ligne, à partir de mi-juillet, qu’il sera scolarisé ou apprenti à la rentrée ;
- **non-allocataire** : remplir une déclaration de situation et de ressources ; si un enfant de moins de 6 ans entre au CP, joindre un certificat de scolarité.

**Bien choisir les fournitures.** La DREETS Occitanie (DGCCRF) rappelle que les fournitures contiennent plastiques, caoutchouc, métal et substances chimiques, dont certaines peuvent présenter des risques. Elle conseille des produits simples et robustes, de lire l’étiquette des produits « en mélange » (encres, colles), de vérifier les labels et la pertinence des allégations environnementales, et de comparer les prix.

## Au quotidien
Les cinq astuces de la Caf :
- **anticiper** les achats pour profiter des promotions et éviter les rayons vides ;
- **confier la liste** à un magasin qui la prépare, pour gagner du temps et éviter les doublons ;
- **acheter en lots ou en groupe** avec d’autres parents ; certaines écoles facilitent les commandes groupées ;
- **faire le tri** à la maison : stylos, cahiers peu entamés, trousse de l’an dernier ;
- **penser à l’occasion** et aux vide-greniers, notamment pour le matériel de sport.

Autres réflexes :
- **attendez la liste de l’enseignant** avant d’acheter les fournitures spécifiques ;
- **préférez les fournitures sobres** plutôt que parfumées, pailletées ou ressemblant à des friandises ou à des jouets ;
- **marquez le nom** de l’enfant sur ses affaires ;
- **consultez Rappel Conso** si vous avez un doute sur un article.

## Questions fréquentes
**Mon enfant entre au CP à 5 ans. Ai-je droit à l’ARS ?**
L’ARS vise les enfants de 6 à 18 ans ; pour un enfant de moins de 6 ans inscrit au CP, Service-Public.fr mentionne l’envoi d’un certificat de scolarité dans le cas des non-allocataires. Vérifiez votre situation auprès de votre Caf ou de la MSA.

**Je n’ai rien reçu le 18 août. Que faire ?**
Vérifiez que vos déclarations de revenus sont à jour et, pour un enfant de 16 ans ou plus, que la déclaration de scolarité a été faite. Contactez ensuite votre Caf ou votre MSA.

**L’ARS doit-elle servir uniquement aux fournitures ?**
Elle est destinée à aider à faire face aux dépenses de la rentrée ; c’est à la famille d’organiser son budget.

**Comment réduire le coût du cartable ?**
Réutiliser celui de l’an dernier s’il est en bon état, ou en choisir un solide et réglable, qui durera plusieurs années.

## Quand demander conseil
Pour vos droits, adressez-vous à votre Caf ou à votre MSA. Si la rentrée met votre budget en difficulté, la mairie, le centre communal d’action sociale ou l’assistante sociale de secteur peuvent vous orienter vers des aides locales (cantine, centre de loisirs). Si un produit a provoqué une blessure ou une intoxication, appelez le 15 ou le 112.

${FIN}`,
    sources: [S.spARS, S.cafAstuces, S.dreetsFournitures],
  },
  {
    ...CHILD,
    slug: 'assurance-scolaire-obligatoire-ou-facultative',
    title: 'Assurance scolaire : obligatoire ou non, et comment vérifier si votre enfant est déjà couvert',
    summary: 'Responsabilité civile, garantie accidents corporels, activités obligatoires ou facultatives, cantine et sorties : ce que couvre l’assurance scolaire et quand elle peut être demandée.',
    category: 'droits-demarches',
    tags: ['assurance scolaire', 'responsabilité civile', 'individuelle accidents', 'attestation d’assurance', 'sortie scolaire', 'cantine'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Chaque rentrée, la question revient : faut-il souscrire une assurance scolaire ? La réponse dépend des activités et des contrats que vous avez déjà. Les repères de Service-Public.fr et du guide des sorties scolaires du ministère de l’Éducation nationale.

## En bref
- En principe, l’assurance scolaire **n’est pas obligatoire**.
- Pour les **activités obligatoires** (inscrites à l’emploi du temps, comme la piscine ou le gymnase), elle reste **facultative**.
- Pour les **sorties facultatives** du premier degré, le guide ministériel indique qu’aucune attestation n’est à fournir, tout en encourageant **vivement** les familles à être assurées.
- Elle **peut être exigée** pour la **cantine** et les **activités organisées par la commune** après la classe.
- Vérifiez vos contrats existants : votre assurance habitation couvre souvent la **responsabilité civile**.

## Comprendre
**Deux garanties principales**, selon Service-Public.fr :
- la **responsabilité civile** : elle couvre les dommages que votre enfant cause à autrui (casser des lunettes, blesser un camarade) ;
- la **garantie accident corporel** : elle couvre les dommages qu’il subit lui-même, y compris lorsqu’il se blesse seul.

Certains contrats ajoutent des garanties (vol, racket, assistance pour suivre les cours à domicile en cas de maladie).

**Deux formules :**
- l’**assurance scolaire**, limitée aux activités scolaires et au trajet domicile-école ;
- l’**assurance extrascolaire**, qui couvre l’enfant toute l’année, 24 h sur 24, y compris pendant les loisirs et les vacances.

**Les sorties scolaires.** Le guide de décembre 2025 précise qu’un élève n’a pas à fournir d’attestation d’assurance pour participer à une sortie, mais que les familles sont vivement encouragées à en avoir une. Pour un voyage, une assurance annulation est fortement recommandée, et pour une sortie en Europe, la carte européenne d’assurance maladie de l’enfant est conseillée.

## Au quotidien
- **Relisez vos contrats** : multirisques habitation (responsabilité civile), garantie individuelle accidents, garantie des accidents de la vie. Si votre enfant est déjà couvert, une assurance scolaire supplémentaire n’est pas nécessaire.
- **Demandez une attestation** à votre assureur si la mairie l’exige pour la cantine ou le périscolaire.
- **Comparez** les offres : les associations de parents d’élèves proposent souvent des contrats collectifs ; votre assureur habituel aussi. Service-Public.fr indique des tarifs débutant généralement autour de 10 € par an et par enfant.
- **Regardez les plafonds et les exclusions** de la garantie accident corporel, plutôt que le seul prix.
- **Prévenez votre assureur** en cas de changement d’école.

## Questions fréquentes
**L’école peut-elle refuser mon enfant à la piscine s’il n’a pas d’assurance ?**
Non : pour les activités obligatoires inscrites à l’emploi du temps, l’assurance est facultative. Elle reste toutefois utile pour couvrir les accidents corporels.

**Et pour la classe découverte ?**
C’est une sortie facultative. Le guide ministériel indique qu’aucune attestation n’est à fournir, mais recommande fortement d’être assuré, avec une assurance annulation si les frais sont importants.

**Mon assurance habitation suffit-elle ?**
Elle couvre souvent la responsabilité civile, mais pas toujours les blessures que votre enfant se fait lui-même. Vérifiez si vous avez une garantie accidents corporels.

**Je suis parent accompagnateur : dois-je m’assurer ?**
Le guide incite fortement les accompagnateurs bénévoles à souscrire une responsabilité civile et une assurance individuelle accidents corporels.

## Quand demander conseil
Pour une question de garanties, adressez-vous à votre assureur. Pour savoir ce qui est demandé (cantine, périscolaire), interrogez la mairie ou le directeur d’école. Si votre enfant se blesse, l’urgence passe avant les papiers : appelez le 15 ou le 112 si besoin, puis déclarez le sinistre à l’assureur.

${FIN}`,
    sources: [S.spAssurance, S.eduscolSorties],
  },
  // ───────────────────────────── Maternelle et CP ─────────────────────────────
  {
    ...CHILD,
    slug: 'petite-section-premieres-semaines-separation-fatigue',
    title: 'Petite section : traverser les premières semaines (séparation, fatigue, temps de présence)',
    summary: 'L’instruction obligatoire dès 3 ans, la possibilité d’aménager le temps de présence, le moment de la séparation, la fatigue du soir et le dialogue avec l’enseignant pendant les premières semaines de maternelle.',
    category: 'ecole-garde',
    tags: ['petite section', 'maternelle', 'séparation', 'pleurs', 'adaptation', 'sieste', 'doudou', 'rentrée'],
    min_age_months: 30, max_age_months: 48,
    body_md: `La première rentrée en maternelle est un grand moment, pour l’enfant comme pour ses parents. Les premiers jours peuvent être émouvants, puis la plupart des enfants trouvent leurs repères. Des pistes pour accompagner ce passage, à partir de mpedia.fr et de Service-Public.fr.

## En bref
- L’instruction est **obligatoire dès 3 ans** : l’enfant entre en maternelle à la rentrée de l’année civile de ses 3 ans, sauf instruction en famille.
- En **petite section**, les **horaires de présence peuvent être aménagés** : parlez-en avec la direction si votre enfant est très fatigué.
- Les pleurs à la séparation sont fréquents les premiers jours ; l’enfant se calme le plus souvent peu après le départ du parent.
- Un au revoir **court, confiant et annoncé** (« je reviens après la sieste ») aide davantage qu’une séparation qui s’éternise.
- La fatigue du soir est fréquente au début : prévoyez un retour au calme.

## Comprendre
**Un grand changement.** Pour un enfant de 3 ans, l’école signifie quitter ses parents pour une journée en groupe, avec des règles nouvelles. Le Dr Jean-Paul Blanc (mpedia.fr) souligne que le passage est souvent plus facile pour un enfant déjà habitué à la collectivité (crèche, halte-garderie) ou à de petites séparations bien vécues.

**Une journée chargée.** Activités manuelles, motricité, comptines, chants, premiers repères sur les lettres et les nombres, ateliers, récréations, cantine pour certains, sieste pour récupérer. Le soir, l’enfant peut être très fatigué et s’endormir tôt ; il retrouve en général son rythme après quelques jours.

**Le cadre réglementaire.** Selon Service-Public.fr, l’obligation d’instruction prend effet à la rentrée de l’année civile des 3 ans. Un enfant de 2 ans peut parfois être admis, sous conditions et selon les places. Pour les élèves de petite section, les horaires de présence peuvent être aménagés : la demande se discute avec l’école.

## Au quotidien
**Avant la rentrée :**
- impliquez l’enfant dans les préparatifs (choisir le sac, des vêtements faciles à enlever) ;
- lisez des albums sur l’école et racontez vos propres souvenirs ;
- passez devant l’école, visitez-la si c’est proposé ;
- valorisez ce qu’il va découvrir, sans lui répéter sans cesse qu’il est « grand ».

**Le jour J et les suivants :**
- arrivez à l’heure, sans précipitation ;
- dites au revoir avec un bisou, annoncez quand vous reviendrez avec un repère concret, puis partez sans vous retourner ;
- évitez de partir en cachette : l’enfant a besoin de savoir que vous partez et que vous revenez ;
- si la séparation est très difficile pour vous, un proche peut l’accompagner, de préférence toujours le même ;
- glissez le doudou dans le sac si l’école l’accepte.

**Le soir :**
- soyez disponible pour un moment calme (jeu, histoire, câlin) ;
- intéressez-vous à sa journée sans le questionner sans fin : il a le droit de garder des choses pour lui ;
- racontez-lui aussi votre journée, cela le rassure ;
- couchez-le à heure régulière.

## Questions fréquentes
**Mon enfant pleure tous les matins depuis deux semaines. Que faire ?**
Parlez-en avec l’enseignant : il voit comment se passe la suite de la matinée. Ensemble, vous pouvez ajuster le rituel d’arrivée, et discuter si besoin d’un aménagement du temps de présence.

**Peut-il ne venir que le matin ?**
En petite section, les horaires de présence peuvent être aménagés. La demande se fait auprès de la direction, qui en étudie les modalités.

**Il ne veut rien raconter de sa journée. Est-ce inquiétant ?**
Beaucoup d’enfants de cet âge racontent peu, ou plus tard (au bain, au coucher). Des questions précises (« avec qui as-tu joué ? ») marchent souvent mieux que « c’était bien ? ».

**Et s’il n’est pas encore propre ?**
Parlez-en avec l’école avant la rentrée pour connaître son organisation et prévoir des vêtements de rechange.

## Quand demander conseil
Si, après plusieurs semaines, votre enfant reste très triste, dort mal, a des douleurs répétées le matin ou régresse nettement, parlez-en à l’enseignant et à votre médecin ou pédiatre. Si vous vous sentez vous-même dépassé, n’hésitez pas à en parler ; en cas de détresse, le 3114 répond 24 h/24. Urgence vitale : 15 ou 112.

${FIN}`,
    sources: [S.mpediaMaternelle, S.spMaternelle, S.spInstruction],
  },
  {
    ...CHILD,
    slug: 'passage-grande-section-cp-ce-qui-change',
    title: 'De la grande section au CP : ce qui change et comment accompagner votre enfant',
    summary: 'Lecture, journées plus structurées, nouvel environnement : ce que représente l’entrée au CP, le rôle de l’examen médical des 6 ans, et des idées concrètes pour aider sans mettre la pression.',
    category: 'ecole-garde',
    tags: ['CP', 'grande section', 'entrée au CP', 'lecture', 'apprentissages', 'examen 6 ans', 'rentrée'],
    min_age_months: 60, max_age_months: 84,
    body_md: `L’entrée au CP est souvent vécue comme « la vraie école ». Votre enfant va apprendre à lire, écrire et compter de façon plus structurée. Comment l’aider à aborder cette étape avec confiance ? Repères tirés d’ameli.fr, de mpedia.fr et de Service-Public.fr.

## En bref
- L’entrée au CP demande à l’enfant de **s’adapter et d’apprendre dans un nouvel environnement** : un **examen médical à 6 ans** a été ajouté début 2025 pour repérer tôt d’éventuelles difficultés.
- Apprendre à lire mobilise la vue, l’ouïe, le langage, la concentration et la mémoire : chaque enfant avance **à son rythme**.
- Le rôle des parents : **lire des histoires**, reprendre les sons vus en classe, **encourager sans forcer**.
- Un livret scolaire unique suit l’enfant en élémentaire ; des **évaluations Repères** ont lieu en début de CP.
- Sommeil régulier et activité physique quotidienne soutiennent les apprentissages.

## Comprendre
**Ce qui change.** Au CP, les journées sont plus structurées, avec davantage de temps assis et d’attention soutenue. L’enfant découvre souvent une nouvelle cour, parfois une nouvelle école, des élèves plus âgés.

**Apprendre à lire.** L’orthophoniste Monique Touzin (mpedia.fr) explique que l’enfant doit reconnaître les lettres, les associer à des sons et en tirer du sens. Au bout de deux ou trois mois de CP, un enfant qui progresse sans difficulté particulière identifie déjà quelques mots simples. L’enseignant repère ceux qui avancent moins vite et peut reprendre les bases en petits groupes, notamment la conscience des sons qui composent les mots.

**L’examen des 6 ans.** Selon ameli.fr, il fait partie des quatre examens de suivi entre 4 et 10 ans, pris en charge à 100 %. Il permet de vérifier la vision, l’audition, le langage, la motricité et de repérer d’éventuels troubles des apprentissages.

**Le suivi scolaire.** Service-Public.fr précise qu’en élémentaire, un livret scolaire unique regroupe les bilans périodiques et de fin de cycle ; il peut être consulté en ligne.

## Au quotidien
- **Lisez ensemble chaque jour**, pour le plaisir : albums, documentaires, recettes. L’objectif est que la lecture ne devienne pas une corvée.
- **Demandez à l’enseignant quels sons sont travaillés** et jouez avec à la maison (« quel mot commence par “m” ? »).
- **Valorisez les efforts** plus que les résultats : « tu as lu ce mot tout seul ! ».
- **Gardez du temps libre** : jeu, dessin, sorties, ennui. Le CP fatigue.
- **Prenez rendez-vous pour l’examen des 6 ans** chez le médecin traitant ou le pédiatre, quand l’enfant n’est pas malade.
- **Préparez la logistique** : cartable adapté, trousse simple, affaires marquées à son nom.
- **Veillez au sommeil** : horaires réguliers et écrans éteints une à deux heures avant le coucher, comme le conseille ameli.fr.

## Questions fréquentes
**Faut-il apprendre à lire à mon enfant avant le CP ?**
Ce n’est pas demandé. Lui lire des histoires, jouer avec les mots et les sons, l’intéresser aux livres prépare déjà très bien le terrain.

**Mon enfant mélange encore des lettres en novembre. Dois-je m’inquiéter ?**
Les rythmes varient beaucoup. Parlez-en avec l’enseignant, qui observe ses progrès. Selon mpedia.fr, ne pas avoir compris la correspondance lettres-sons en fin de CP, ou des difficultés de langage oral, sont des signaux qui justifient un avis médical.

**Que vérifie-t-on à l’examen des 6 ans ?**
Croissance, dents, vision, audition, langage, motricité, apprentissages, comportement, vaccinations, et des conseils sur le sommeil et les écrans.

**Mon enfant est né en fin d’année : est-il désavantagé ?**
Les enfants d’une même classe peuvent avoir près d’un an d’écart ; cela se ressent parfois au début. Si vous avez un doute, échangez avec l’enseignant.

## Quand demander conseil
Consultez votre médecin si votre enfant semble mal voir ou mal entendre, a des difficultés de langage, ou si des difficultés persistent malgré l’aide de l’école ; le médecin pourra orienter vers un orthophoniste si nécessaire. Parlez à l’enseignant de tout changement de comportement. Urgence : 15 ou 112.

${FIN}`,
    sources: [S.ameli4a10, S.mpediaLecture, S.spInfoParents],
  },
  {
    ...CHILD,
    slug: 'evaluations-reperes-cp-ce1-comprendre-resultats',
    title: 'Évaluations nationales « Repères » : à quoi servent-elles et comment lire les résultats ?',
    summary: 'Du CP au CM2, des évaluations en français et en mathématiques ont lieu en septembre : calendrier 2026, compétences évaluées, documents remis aux familles et façon d’en parler avec votre enfant.',
    category: 'ecole-garde',
    tags: ['évaluations nationales', 'Repères', 'CP', 'CE1', 'CM2', 'français', 'mathématiques', 'résultats'],
    min_age_months: 60, max_age_months: 131,
    body_md: `En septembre, votre enfant passe peut-être des « évaluations nationales ». Elles inquiètent parfois les familles. D’après la présentation officielle 2026 de la DEPP (ministère de l’Éducation nationale), voici ce qu’il faut en savoir.

## En bref
- Les évaluations **Repères** concernent le **CP, le CE1, le CE2, le CM1 et le CM2**, avec un **point d’étape à mi-année au CP**.
- En 2026, la passation a eu lieu **du 7 au 18 septembre**.
- Elles portent sur le **français** (oral, lecture, écriture, vocabulaire, grammaire, orthographe) et les **mathématiques** (nombres, calcul, problèmes, géométrie…).
- Leur but : faire un **bilan de début d’année** pour aider l’enseignant à organiser les apprentissages.
- Les familles reçoivent une **fiche de positionnement** de l’enfant par discipline, avec des documents explicatifs.

## Comprendre
**Pourquoi en début d’année ?** Ces évaluations donnent à l’enseignant une photographie des acquis de chaque élève au moment où il commence l’année. Elles l’aident à repérer qui a besoin de consolider tel ou tel point et à ajuster son enseignement.

**Au CP**, l’évaluation porte notamment sur la préparation à la lecture : les habiletés phonologiques (percevoir et manipuler les sons de la langue) et le principe alphabétique (le lien entre lettres et sons). Le point d’étape de mi-année permet d’apprécier la progression en lecture, écriture et numération.

**Ce que reçoivent les familles**, selon la présentation 2026 :
- une fiche expliquant le contexte et l’objectif de l’évaluation ;
- une fiche de positionnement de l’élève par discipline, par rapport à des seuils ;
- des fiches décrivant les exercices et une infographie.

**À quoi servent les résultats.** La présentation officielle décrit ces évaluations comme un appui pour l’enseignant et pour l’accompagnement pédagogique. Certains documents détaillés, comme la liste des élèves en deçà des seuils, sont réservés à l’équipe de la classe.

## Au quotidien
- **Dédramatisez** : expliquez à votre enfant que ces exercices servent à l’enseignant pour savoir comment l’aider ; il n’y a rien à « réviser ».
- **Pas de préparation intensive** : un sommeil suffisant et un petit déjeuner sont plus utiles que des exercices supplémentaires.
- **Lisez la fiche de résultats avec recul** : elle situe votre enfant à un moment donné, sur des compétences précises. Un résultat fragile signale un point à travailler, pas un échec.
- **Demandez un échange avec l’enseignant** si vous souhaitez comprendre les résultats ou savoir ce qui sera mis en place.
- **Valorisez les points forts** que révèle la fiche, et parlez des difficultés en termes de progrès possibles.

## Questions fréquentes
**Les résultats comptent-ils pour le passage dans la classe supérieure ?**
Ce n’est pas leur objet : la présentation officielle les décrit comme un bilan de début d’année destiné à aider l’enseignant à organiser les apprentissages. Pour toute question sur le passage, parlez-en avec l’enseignant.

**Mon enfant est sous le seuil en lecture. Que va-t-il se passer ?**
L’enseignant dispose d’informations détaillées pour adapter son travail. Il peut proposer des aides ciblées ; si les difficultés persistent, un programme personnalisé de réussite éducative (PPRE) peut être mis en place.

**Peut-on refuser que son enfant les passe ?**
Ces évaluations se déroulent pendant le temps scolaire. Si vous avez des questions, parlez-en avec le directeur ou l’enseignant.

**Mon enfant a été très stressé. Que faire ?**
Écoutez ce qu’il ressent, rappelez que l’objectif est de l’aider et non de le juger, et prévenez l’enseignant si le stress revient souvent.

## Quand demander conseil
Si les résultats confirment des difficultés que vous aviez remarquées (langage, lecture, attention), parlez-en avec l’enseignant et votre médecin, qui pourra faire le point sur la vision, l’audition et le développement. Si votre enfant manifeste une anxiété importante autour de l’école, n’attendez pas pour en parler. Urgence : 15 ou 112.

${FIN}`,
    sources: [S.eduscolReperes, S.justicePPRE],
  },
  {
    ...CHILD,
    slug: 'devoirs-a-la-maison-primaire-accompagner-sans-conflit',
    title: 'Devoirs à l’école primaire : ce que dit la règle et comment accompagner sans conflit',
    summary: 'Pas de devoirs écrits en principe à l’école élémentaire, mais des leçons à relire ou à apprendre : le cadre officiel et des idées concrètes pour un moment de travail court, serein et utile.',
    category: 'ecole-garde',
    tags: ['devoirs', 'leçons', 'école élémentaire', 'travail à la maison', 'lecture du soir', 'organisation', 'conflit'],
    min_age_months: 72, max_age_months: 131,
    body_md: `« Fais tes devoirs ! » : pour beaucoup de familles, le moment des leçons du soir est source de tension. Que demande vraiment l’école élémentaire, et comment rendre ce moment plus serein ? Le cadre est rappelé dans une réponse du ministère de l’Éducation nationale publiée au Journal officiel.

## En bref
- L’interdiction des **devoirs écrits** à faire hors de la classe à l’école élémentaire a été **réaffirmée à plusieurs reprises depuis 1956**.
- En revanche, dès le CP, l’enseignant peut demander de **relire un texte, revoir une leçon, apprendre une poésie ou des tables**.
- Au **CM**, un travail personnel (recherche, exposé, entraînement au calcul) peut être demandé pour préparer l’entrée en 6e.
- Le temps de classe comprend des moments de travail écrit encadrés par l’enseignant, ce qui aide notamment les enfants qui ont peu d’appui à la maison.
- Côté parents : un moment **court, régulier, au calme**, et un rôle d’**encouragement** plutôt que de professeur.

## Comprendre
Dans sa réponse publiée au Journal officiel en juillet 2013, le ministère distingue :
- les **exercices écrits** à faire à la maison, interdits en principe à l’école élémentaire ;
- le **travail de mémorisation et de relecture** (leçons, poésies, tables, lecture), qui fait partie des habitudes dès le CP.

Le ministère souligne aussi que de nombreux parents souhaitent que leur enfant ait des devoirs, et que l’intégration de temps de travail dans la journée de classe est particulièrement utile aux enfants qui ne trouvent pas d’aide ou de matériel à la maison.

Concrètement, chaque enseignant organise ce travail à sa manière : parlez-en lors de la réunion de rentrée.

## Au quotidien
**Organiser le moment :**
- choisissez un horaire régulier, après un goûter et un temps de détente ;
- installez l’enfant au calme, sans télévision ni écran allumé ;
- visez un temps court : mieux vaut un quart d’heure concentré qu’une heure de bataille.

**Accompagner sans faire à sa place :**
- demandez-lui d’expliquer ce qu’il a à faire ;
- pour une leçon, faites-la lui reformuler avec ses mots, puis interrogez-le ;
- pour une poésie, découpez-la en petits morceaux, à répéter à plusieurs moments ;
- pour la lecture du CP, alternez : il lit une ligne, vous lisez la suivante ;
- encouragez sans forcer, en valorisant les progrès, comme le recommande l’orthophoniste Monique Touzin (mpedia.fr) pour la lecture.

**Désamorcer les conflits :**
- si la tension monte, faites une pause ou passez le relais à un autre adulte ;
- ne transformez pas les leçons en punition ;
- si les devoirs prennent beaucoup trop de temps, notez-le et parlez-en à l’enseignant.

**Se renseigner sur les aides** : certaines écoles ou communes proposent une étude surveillée ou un accompagnement après la classe.

## Questions fréquentes
**L’enseignant donne des fiches d’exercices à faire à la maison. Est-ce autorisé ?**
Le principe est l’absence de devoirs écrits à l’élémentaire. Si la charge vous paraît importante, abordez le sujet calmement avec l’enseignant pour comprendre ses objectifs.

**Combien de temps mon enfant doit-il y passer ?**
Aucune durée n’est fixée dans la réponse ministérielle. Un temps bref et régulier est généralement plus efficace ; si cela devient très long, signalez-le à l’enseignant.

**Je ne maîtrise pas bien le français. Comment l’aider ?**
Vous pouvez l’encourager, lui demander d’expliquer sa leçon, lui lire ou lui raconter des histoires et vous intéresser à ce qu’il apprend. L’étude ou l’aide aux devoirs de la commune peut compléter.

**Il refuse systématiquement ses leçons. Que faire ?**
Cherchez la cause : fatigue, difficulté de compréhension, conflit, inquiétude liée à l’école. Un échange avec l’enseignant aide souvent à trouver une solution.

## Quand demander conseil
Si les difficultés persistent (lecture, mémorisation, attention), parlez-en à l’enseignant, qui peut proposer une aide adaptée, et à votre médecin pour faire le point sur la vision, l’audition et le développement. Si le moment des devoirs vous épuise ou génère des colères que vous ne maîtrisez plus, demandez de l’aide ; en cas de détresse, le 3114 répond 24 h/24.

${FIN}`,
    sources: [S.anDevoirs, S.mpediaLecture, S.spSurveillance],
  },
  {
    ...CHILD,
    slug: 'difficultes-scolaires-ppre-a-qui-s-adresser',
    title: 'Votre enfant a des difficultés à l’école : PPRE, aide de l’enseignant et avis médical',
    summary: 'Repérer une difficulté d’apprentissage, comprendre le programme personnalisé de réussite éducative (PPRE), savoir quand demander un avis médical ou orthophonique : les étapes pour aider votre enfant.',
    category: 'ecole-garde',
    tags: ['difficultés scolaires', 'PPRE', 'soutien scolaire', 'lecture', 'orthophoniste', 'troubles des apprentissages', 'enseignant'],
    min_age_months: 60, max_age_months: 131,
    body_md: `Lecture qui ne décolle pas, calcul laborieux, cahier rempli de remarques : quand votre enfant peine à l’école, il est utile d’agir tôt et avec l’équipe éducative. Voici les dispositifs et les étapes, d’après justice.fr (fiche Service-Public.fr), mpedia.fr et ameli.fr.

## En bref
- Le **PPRE** (programme personnalisé de réussite éducative) est un plan d’actions écrit, mis en place quand l’équipe repère des difficultés pouvant gêner la scolarité.
- Il porte surtout sur le **français** et les **mathématiques**, pour une **durée déterminée**, puis fait l’objet d’un **bilan**.
- Il est présenté aux parents et à l’enfant ; leur **accord n’est pas requis**, mais leur **adhésion** facilite sa réussite.
- Une difficulté qui persiste mérite un **avis médical** (médecin traitant, pédiatre, médecin scolaire) avant toute rééducation.
- Les examens de santé de **6 ans** et de **8-9 ans** sont l’occasion de faire le point sur la vision, l’audition et les apprentissages.

## Comprendre
**Comment les difficultés sont repérées.** Les enseignants les observent en classe, lors des évaluations nationales et des conseils de cycle. Selon la fiche, le PPRE peut être mis en place à tout moment de l’année ; il l’est automatiquement en cas de redoublement.

**Ce que contient un PPRE :**
- les compétences à travailler et l’objectif à atteindre ;
- les personnes impliquées et la période ;
- l’intervention éventuelle de professionnels extérieurs (orthophoniste, psychologue) et de partenaires (soutien scolaire, dispositifs de réussite éducative) ;
- la façon d’évaluer les progrès.

À son terme, l’équipe dresse un bilan : le PPRE est arrêté ou prolongé avec de nouveaux objectifs.

**Les causes possibles** d’une difficulté de lecture, citées par l’orthophoniste Monique Touzin (mpedia.fr) : peu de contact avec l’écrit à la maison, langage oral insuffisamment maîtrisé, déficit visuel ou auditif, ou certaines particularités du développement. Un « réel trouble d’apprentissage » justifie une prise en charge orthophonique ; selon les cas, un soutien pédagogique ou une aide psychologique peuvent compléter.

**Le rôle des examens de santé.** Ameli.fr indique que les examens entre 4 et 10 ans recherchent notamment des difficultés de langage et de parole, ainsi que des troubles comme la dyslexie, la dysorthographie, la dysgraphie ou la dyspraxie.

## Au quotidien
- **Demandez un rendez-vous** à l’enseignant pour décrire ce que vous observez à la maison et écouter ce qu’il voit en classe.
- **Posez des questions concrètes** : sur quoi porte la difficulté ? que fait-on en classe ? que puis-je faire à la maison ?
- **Lisez le PPRE** s’il est proposé et demandez quand aura lieu le bilan.
- **À la maison**, privilégiez des moments courts et positifs : lecture partagée, jeux de mots, jeux de société avec des nombres.
- **Prenez rendez-vous chez le médecin** si la difficulté persiste, en apportant le livret scolaire et les remarques de l’enseignant.
- **Préservez la confiance** : rappelez à votre enfant ce qu’il réussit, en classe comme ailleurs.

## Questions fréquentes
**Le PPRE veut-il dire que mon enfant va redoubler ?**
Non. C’est un outil d’aide temporaire. Il est mis en place automatiquement en cas de redoublement, mais il est surtout utilisé pour éviter que les difficultés ne s’installent.

**Puis-je refuser un PPRE ?**
Votre accord n’est pas requis, mais le programme doit vous être présenté. Votre adhésion facilite sa réussite : n’hésitez pas à poser vos questions.

**Faut-il consulter un orthophoniste directement ?**
Mpedia.fr conseille de commencer par une consultation médicale (pédiatre ou médecin de famille) pour faire le point ; l’orthophoniste intervient ensuite, sur prescription, si un trouble est suspecté.

**Et si un trouble « dys » ou un TDAH est diagnostiqué ?**
D’autres dispositifs existent (plan d’accompagnement personnalisé, projet personnalisé de scolarisation). Parlez-en avec l’école et le médecin.

## Quand demander conseil
Consultez votre médecin si votre enfant voit ou entend mal, s’exprime difficilement, ou si les difficultés persistent malgré l’aide de l’école. Si l’école devient source de grande souffrance (pleurs, refus, troubles du sommeil, propos très négatifs sur lui-même), n’attendez pas pour en parler à un professionnel ; en cas d’idées noires, appelez le 3114. Urgence : 15 ou 112.

${FIN}`,
    sources: [S.justicePPRE, S.mpediaLecture, S.ameli4a10],
  },
  {
    ...CHILD,
    slug: 'communiquer-avec-l-enseignant-cahier-de-liaison-rendez-vous',
    title: 'Bien communiquer avec l’enseignant : cahier de liaison, réunions et rendez-vous',
    summary: 'Les outils d’information des parents à l’école maternelle et élémentaire, les réunions prévues dans l’année, et des conseils pour préparer un rendez-vous constructif avec l’enseignant.',
    category: 'ecole-garde',
    tags: ['enseignant', 'maîtresse', 'cahier de liaison', 'réunion de rentrée', 'rendez-vous', 'livret scolaire', 'règlement intérieur'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Une remarque dans le cahier, une inquiétude sur le comportement, une question sur les progrès : un dialogue de qualité entre parents et enseignants aide l’enfant. Ce que prévoient les textes, d’après Service-Public.fr, et comment en tirer le meilleur.

## En bref
- Les parents ont le **droit d’être informés** de la scolarité et de la vie scolaire de leur enfant.
- Le **cahier de correspondance** (ou cahier de liaison, parfois numérique) sert aux échanges : sorties, absences, comportement, demande de rendez-vous.
- Une **rencontre** est prévue avant la **fin de la 3e semaine** de classe pour les nouveaux élèves, et au moins **deux rencontres par an** entre parents et enseignants par classe.
- En **maternelle**, un suivi des apprentissages est transmis plusieurs fois par an, avec une synthèse des acquis en fin de cycle ; en **élémentaire**, le **livret scolaire unique** regroupe les bilans.
- Le **règlement intérieur**, signé par les parents, précise les modalités d’échange avec l’équipe.

## Comprendre
**Les outils de suivi.** Selon Service-Public.fr :
- en **maternelle**, l’enseignant informe régulièrement les familles de ce que l’enfant apprend et de ses réussites, et une synthèse des acquis est communiquée en fin de maternelle ;
- en **élémentaire**, le **livret scolaire unique** rassemble les bilans périodiques, les bilans de fin de cycle et les attestations (premiers secours, sécurité routière, savoir nager…). En fin de cycle, la maîtrise de chaque domaine est évaluée sur quatre niveaux : insuffisante, fragile, satisfaisante, très bonne. Le livret peut être consulté en ligne.

**Les réunions.** Elles doivent se tenir à des horaires accessibles aux parents. La réunion de rentrée présente souvent l’organisation de la classe, les attentes, le fonctionnement des leçons et des sorties.

**Le règlement intérieur.** Rédigé par le directeur et voté en conseil d’école, il est affiché dans l’école et présenté aux familles. Il précise les horaires, les règles d’hygiène et de sécurité, la prévention du harcèlement, les sanctions et encouragements, et la façon d’échanger avec l’équipe.

**Les représentants de parents** peuvent aussi relayer des questions collectives.

## Au quotidien
- **Consultez le cahier de liaison chaque soir** (ou l’application de l’école) et signez les mots demandés.
- **Venez à la réunion de rentrée** : c’est le meilleur moment pour comprendre la classe et poser vos questions générales.
- **Demandez un rendez-vous par écrit** pour une question personnelle, plutôt qu’à la porte de l’école devant les autres enfants.
- **Préparez l’entretien** : notez deux ou trois points précis, des exemples concrets, et ce que vous observez à la maison.
- **Commencez par écouter** ce que l’enseignant observe, puis partagez votre point de vue.
- **Repartez avec une piste** : ce que fait l’école, ce que vous pouvez faire, quand refaire le point.
- **Informez l’école** des événements qui peuvent toucher votre enfant (naissance, deuil, séparation, déménagement) : l’enseignant pourra mieux le comprendre.

## Questions fréquentes
**Je ne suis pas d’accord avec une décision de l’enseignant. Que faire ?**
Demandez d’abord un échange pour comprendre ses raisons. Si le désaccord persiste, vous pouvez solliciter le directeur d’école, puis l’inspecteur de l’éducation nationale de la circonscription.

**Je travaille en horaires décalés et ne peux pas venir aux réunions.**
Les réunions doivent être organisées à des horaires accessibles ; signalez vos contraintes et proposez un échange téléphonique ou par écrit.

**L’enseignant écrit souvent sur le comportement de mon enfant.**
Demandez un rendez-vous pour comprendre ce qui se passe et chercher ensemble des solutions, plutôt que de répondre à chaud dans le cahier.

**Puis-je demander à voir le livret scolaire en cours d’année ?**
Le livret scolaire unique peut être consulté en ligne ; les bilans périodiques vous sont communiqués au fil de l’année.

## Quand demander conseil
Si votre enfant exprime une souffrance à l’école (peur, plaintes répétées, isolement, violences subies), signalez-le rapidement à l’enseignant et au directeur. En cas de harcèlement, le 3018 conseille gratuitement les familles. Si vous pensez qu’un enfant est en danger, appelez le 119. Urgence : 15 ou 112.

${FIN}`,
    sources: [S.spInfoParents, S.spConseilEcole],
  },
  {
    ...CHILD,
    slug: 'parents-separes-ecole-information-et-decisions',
    title: 'Parents séparés et école : qui est informé, qui décide ?',
    summary: 'Droit à l’information de chaque parent, décisions scolaires en cas d’autorité parentale conjointe ou exclusive, changements à signaler : les règles qui s’appliquent à l’école maternelle et élémentaire.',
    category: 'ecole-garde',
    tags: ['parents séparés', 'divorce', 'autorité parentale', 'école', 'garde alternée', 'information des parents', 'livret scolaire'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Après une séparation, l’école reste un repère essentiel pour l’enfant. Les deux parents gardent en général un rôle dans sa scolarité. Voici ce que prévoit la réglementation, d’après Service-Public.fr.

## En bref
- Le **droit à l’information** sur la scolarité existe pour chaque parent, **même sans autorité parentale**.
- En début d’année, la fiche de renseignements doit indiquer les **coordonnées des deux parents**.
- Parents séparés avec **autorité parentale conjointe** (cas le plus fréquent) : l’école transmet **les mêmes informations à chacun**.
- Si un seul parent exerce l’autorité parentale, c’est lui qui prend les **décisions** (choix de l’école, signature du livret, autorisations d’absence) ; une copie du jugement est à remettre au directeur.
- Tout **changement** (situation familiale, adresse, décision du juge) doit être **signalé à l’école**.

## Comprendre
**L’autorité parentale conjointe.** Après une séparation ou un divorce, l’autorité parentale reste en principe exercée par les deux parents. L’école envoie alors les mêmes documents (bulletins, convocations, informations sur la vie de la classe) à chacun, en main propre ou à l’adresse indiquée. Lorsque les parents vivent ensemble, une information transmise à l’un est réputée transmise aux deux.

**Quand un seul parent exerce l’autorité parentale.** L’autre parent peut garder un droit de surveillance. Le directeur, qui doit avoir reçu une copie de la décision du juge aux affaires familiales, lui transmet les décisions importantes relatives à la scolarité, mais pas tous les détails de la vie scolaire. Les décisions éducatives reviennent au parent titulaire de l’autorité.

**Les sorties facultatives.** Le guide ministériel des sorties scolaires précise que l’autorisation écrite d’un seul titulaire de l’autorité parentale suffit, sauf si l’autre parent fait connaître son désaccord.

**Le choix de l’école.** Service-Public.fr cite le choix de l’école parmi les décisions qui reviennent au parent titulaire de l’autorité parentale lorsqu’il est seul à l’exercer ; en autorité conjointe, c’est une décision à prendre à deux.

## Au quotidien
- **Remplissez ensemble (ou chacun de votre côté) la fiche de rentrée** avec les deux adresses, téléphones et courriels.
- **Informez l’enseignant de l’organisation** de la garde (semaines alternées, jours de sortie) pour qu’il sache qui vient chercher l’enfant.
- **Transmettez la copie du jugement** si une décision particulière a été prise.
- **Faites circuler le cahier et les affaires** entre les deux domiciles : une pochette dédiée ou un double des fournitures peuvent aider.
- **Évitez de faire passer des messages par l’enfant** ou par l’enseignant : l’école n’a pas à arbitrer les conflits parentaux.
- **Pensez aux deux comptes** des outils numériques de l’école, si l’établissement le permet.
- **Prévenez l’école** si la séparation est récente : l’enseignant pourra être attentif à l’humeur de l’enfant.

## Questions fréquentes
**Mon ex-conjoint ne me transmet pas les informations de l’école. Que faire ?**
Adressez-vous directement au directeur : en autorité parentale conjointe, l’école doit vous transmettre les mêmes informations qu’à l’autre parent, à condition d’avoir vos coordonnées.

**L’autre parent peut-il venir chercher l’enfant à l’école en dehors de « ses » jours ?**
L’école applique les informations et décisions de justice qu’on lui a communiquées. Si un jugement encadre les modalités, transmettez-le au directeur.

**Qui signe le livret scolaire ?**
Si un seul parent exerce l’autorité parentale, c’est lui qui signe. En autorité conjointe, les deux parents sont concernés : demandez au directeur comment l’école organise la signature et la transmission des documents.

**Nous ne sommes pas d’accord sur l’école à choisir.**
Essayez d’abord d’en discuter, éventuellement avec l’aide d’une médiation familiale. En cas de désaccord persistant, le juge aux affaires familiales peut trancher.

## Quand demander conseil
Pour les questions de droits, un point d’accès au droit, une médiation familiale ou un avocat peuvent vous aider. Si votre enfant semble très affecté par la séparation (troubles du sommeil, tristesse, chute des résultats), parlez-en avec l’enseignant et votre médecin. Si un enfant est exposé à des violences, appelez le 119 ; en cas de danger immédiat, le 17 ou le 112.

${FIN}`,
    sources: [S.spInfoParents, S.eduscolSorties],
  },
  {
    ...CHILD,
    slug: 'conseil-d-ecole-representants-parents-d-eleves',
    title: 'Conseil d’école et représentants de parents d’élèves : à quoi ça sert, comment participer ?',
    summary: 'Rôle du conseil d’école, sa composition, ses réunions, et la place des représentants de parents élus : de quoi s’informer et comment s’impliquer dans la vie de l’école de votre enfant.',
    category: 'ecole-garde',
    tags: ['conseil d’école', 'représentants de parents', 'élections de parents d’élèves', 'règlement intérieur', 'projet d’école', 'vie de l’école'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Chaque automne, les familles sont invitées à élire leurs représentants de parents d’élèves. Que font-ils, et que se décide-t-il au conseil d’école ? Les repères de Service-Public.fr.

## En bref
- Le **conseil d’école** vote le **règlement intérieur**, adopte le **projet d’école** et donne son avis sur la vie de l’école.
- Il se réunit **au moins une fois par trimestre**, et obligatoirement dans le **mois qui suit l’élection** des représentants des parents.
- Les **représentants de parents élus** y siègent avec droit de vote, en nombre **égal au nombre de classes**.
- Le **compte rendu** est affiché dans un lieu accessible aux parents.
- Les membres sont élus ou désignés pour **une année scolaire**.

## Comprendre
**Ce que fait le conseil d’école**, selon Service-Public.fr :
- il vote le règlement intérieur et adopte le projet d’école ;
- il donne son avis sur les actions pédagogiques, l’utilisation des moyens, l’accueil des enfants en situation de handicap, les activités périscolaires, la restauration scolaire, l’hygiène, la sécurité des enfants à l’école et pendant le périscolaire ;
- il donne son accord à l’organisation d’activités éducatives, sportives ou culturelles complémentaires ;
- il fixe le calendrier des rencontres entre enseignants et parents ;
- il peut proposer une organisation de la semaine scolaire, la décision finale revenant au directeur académique après concertation avec le maire.

**Qui y siège avec droit de vote :** le directeur (qui préside), les enseignants, le maire et un conseiller municipal (ou le président de l’intercommunalité), les représentants élus des parents, et le délégué départemental de l’Éducation nationale. D’autres personnes peuvent être invitées sans droit de vote (inspecteur, suppléants des parents, équipe de santé scolaire, ATSEM, intervenants).

**Le rôle des représentants de parents.** Ils font remonter les questions des familles, participent aux décisions du conseil, informent les parents et doivent rendre compte de leurs actions. Le conseil peut se tenir même si aucun représentant n’a pu être élu.

## Au quotidien
- **Votez** aux élections de parents d’élèves (une fois par an, en début d’année scolaire) : c’est simple et c’est votre voix au conseil.
- **Lisez les comptes rendus** affichés à l’école : vous y trouverez des informations sur la cantine, les travaux, les sorties, les projets.
- **Transmettez vos questions** aux représentants avant le conseil, de préférence des questions d’intérêt collectif.
- **Pensez à vous présenter** si vous en avez l’envie et le temps : une liste peut être portée par une association de parents ou par des parents non affiliés.
- **Gardez les questions individuelles** (comportement, notes) pour un rendez-vous avec l’enseignant.

## Questions fréquentes
**Faut-il appartenir à une association pour être représentant ?**
Non : des listes de parents indépendants peuvent se présenter, aux côtés des associations de parents d’élèves.

**Que peut-on aborder au conseil d’école ?**
Tout ce qui concerne le fonctionnement de l’école : sécurité, cantine, périscolaire, sorties, hygiène, projets pédagogiques, rythmes, travaux. Les situations individuelles d’élèves n’y ont pas leur place.

**Combien de temps cela prend-il ?**
Au minimum trois réunions dans l’année, plus le temps d’échanger avec les autres parents. L’implication varie selon les écoles et les projets.

**Les comptes rendus sont-ils publics ?**
Le directeur rédige un compte rendu, affiché dans un lieu accessible aux parents d’élèves.

## Quand demander conseil
Pour toute question sur le fonctionnement de l’école, le directeur et les représentants de parents sont vos premiers interlocuteurs. Si un sujet de sécurité vous inquiète (accès, trajets, bâtiments), signalez-le sans attendre la prochaine réunion. Si un enfant est en danger, appelez le 119 ; en cas d’urgence, le 15 ou le 112.

${FIN}`,
    sources: [S.spConseilEcole, S.spInfoParents],
  },
  {
    ...CHILD,
    slug: 'periscolaire-garderie-mercredi-accueil-de-loisirs',
    title: 'Périscolaire, garderie et mercredi : comment fonctionnent les accueils autour de l’école ?',
    summary: 'Accueil du matin et du soir, pause méridienne, mercredi : ce qu’est le temps périscolaire, qui l’organise, comment il est encadré et quelles questions poser avant d’inscrire votre enfant.',
    category: 'ecole-garde',
    tags: ['périscolaire', 'garderie', 'mercredi', 'accueil de loisirs', 'centre de loisirs', 'étude', 'animateurs'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Avant l’école, après la classe, le mercredi : beaucoup d’enfants passent du temps dans les accueils périscolaires. Comment sont-ils organisés et encadrés ? Les repères du ministère chargé de la jeunesse, de la préfecture de Loir-et-Cher et de Service-Public.fr.

## En bref
- Le **périscolaire** désigne les accueils organisés **les jours d’école** et **le mercredi**, même sans école ; l’**extrascolaire** couvre les vacances, le samedi sans école et le dimanche.
- Ces accueils sont souvent organisés par la **commune** ou une **association**, et doivent être **déclarés** aux services de l’État.
- Ils sont **encadrés** par un directeur et des animateurs, selon des normes d’encadrement et de qualification.
- Les parents fournissent notamment une **fiche sanitaire** et les informations sur certains **vaccins**.
- Aucun médicament n’est donné **sans ordonnance**.

## Comprendre
**Le temps périscolaire.** Selon la préfecture de Loir-et-Cher, il permet à l’enfant de nouer d’autres relations avec des adultes et des enfants de son âge, de découvrir son environnement et de développer sa créativité et son autonomie. Le « Plan mercredi » vise des activités de qualité le mercredi, de la maternelle au CM2.

**L’encadrement.** Les accueils collectifs de mineurs sont encadrés par l’État. Le site jeunes.gouv.fr précise qu’un directeur et des animateurs forment l’équipe, selon des normes réglementaires, et que l’organisateur rédige un **projet éducatif** ; le directeur écrit avec l’équipe un **projet pédagogique** (activités, rythme entre activités et repos, accueil des enfants malades ou en situation de handicap). La préfecture de Loir-et-Cher présente les taux d’encadrement applicables : par exemple, pour un accueil périscolaire de moins de 5 heures par jour, un animateur pour 10 enfants de moins de 6 ans et un pour 14 enfants de plus de 6 ans (taux différents pour les accueils plus longs ou labellisés).

**La responsabilité.** Service-Public.fr rappelle que les enseignants surveillent les élèves jusqu’à leur prise en charge par la cantine ou le périscolaire ; l’organisateur devient alors responsable.

**La santé.** Un membre de l’équipe assure le suivi sanitaire et tient un registre des soins. L’organisateur doit informer la famille sans délai de tout accident, incident grave ou maladie.

## Au quotidien
- **Renseignez-vous tôt** auprès de la mairie : modalités d’inscription, tarifs, horaires, réservation à l’avance ou non.
- **Demandez le projet pédagogique** : activités proposées, temps calmes, organisation du goûter.
- **Remplissez la fiche sanitaire** avec soin (allergies, traitements, contacts) et signalez un PAI le cas échéant.
- **Prévoyez l’ordonnance** si un médicament doit être donné, avec le nom de l’enfant.
- **Observez votre enfant** : longues journées, fatigue, envie de jouer librement. Si possible, alternez avec des journées plus courtes.
- **Parlez avec les animateurs** à l’arrivée ou au départ : ils connaissent bien les enfants.

## Questions fréquentes
**Le périscolaire est-il obligatoire ?**
Non, c’est un service proposé aux familles. Les conditions d’accès et les tarifs sont fixés par l’organisateur.

**Mon enfant a une allergie ou une maladie chronique. Peut-il être accueilli ?**
Oui, les enfants ayant des troubles de santé ou un handicap peuvent être accueillis ; l’équipe doit être informée à l’avance pour adapter l’organisation.

**Comment vérifier qu’un accueil est déclaré ?**
Selon jeunes.gouv.fr, vous pouvez contacter les services départementaux de l’Éducation nationale (DSDEN) du siège de l’organisateur.

**Qui contacter en cas de problème ?**
D’abord le directeur de l’accueil, puis l’organisateur (souvent la mairie). Tout problème touchant à la protection des mineurs peut être signalé à la DSDEN ou à la préfecture.

## Quand demander conseil
Si votre enfant revient avec une blessure inexpliquée, se plaint d’un adulte ou refuse soudain d’y aller, parlez-en avec lui calmement puis avec le directeur de l’accueil ; si vous pensez qu’un enfant est en danger, appelez le 119. Urgence : 15 ou 112.

${FIN}`,
    sources: [S.jeunesACM, S.pref41Periscolaire, S.spSurveillance],
  },
  {
    ...CHILD,
    slug: 'cantine-scolaire-inscription-tarifs-droit-acces',
    title: 'Cantine scolaire : droit d’inscription, tarifs et qui surveille la pause du midi',
    summary: 'La cantine n’est pas obligatoire pour les communes, mais quand elle existe tous les enfants scolarisés en primaire peuvent s’y inscrire : règles d’accès, fixation des tarifs, surveillance, assurance et santé.',
    category: 'ecole-garde',
    tags: ['cantine', 'restauration scolaire', 'tarifs cantine', 'inscription cantine', 'pause méridienne', 'allergie', 'mairie'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Pour beaucoup de familles, la cantine est indispensable à l’organisation de la semaine. Qui décide des tarifs ? Un enfant peut-il être refusé ? Qui le surveille à midi ? Réponses à partir du site officiel des collectivités locales et de Service-Public.fr.

## En bref
- La restauration scolaire du primaire est un **service public facultatif** : une commune n’est pas obligée de créer une cantine.
- Quand elle existe, **l’inscription est un droit pour tous les enfants scolarisés** en primaire, **sans discrimination** ; un refus n’est possible que si la **capacité d’accueil maximale** est atteinte.
- Les **tarifs** sont fixés par la collectivité et **ne peuvent pas dépasser le coût** du service par usager (subventions déduites).
- Refuser un enfant pour un **trouble de santé** comme une allergie alimentaire peut constituer une **discrimination**.
- Pendant la cantine d’une école publique, la **mairie** est responsable de la surveillance ; une **assurance** peut être exigée.

## Comprendre
**Un service organisé par la collectivité.** La cantine d’une école publique dépend de la commune (ou de l’intercommunalité), qui fixe les règles d’inscription et les tarifs. Elle peut moduler les tarifs, à condition que ces modulations soient liées à l’objet du service. Certaines communes proposent des tarifs selon les ressources : renseignez-vous auprès de la vôtre.

**Un droit d’accès.** Le code de l’éducation prévoit que, lorsqu’un service de restauration scolaire existe, l’inscription à la cantine est un droit pour tous les enfants scolarisés, sans discrimination selon leur situation ou celle de leur famille.

**La santé.** Selon le site des collectivités locales, refuser un enfant en raison d’un trouble de santé, comme une allergie alimentaire, peut être discriminatoire. Pour un enfant allergique ou atteint d’une maladie chronique, un **projet d’accueil individualisé (PAI)** organise les conditions du repas.

**La surveillance.** Service-Public.fr précise que les enseignants surveillent les élèves jusqu’à leur prise en charge par la cantine, puis que la responsabilité passe à l’organisateur, par exemple la mairie dans une école publique.

**L’assurance.** Elle n’est en principe pas obligatoire pour l’école, mais elle peut être exigée pour la cantine et les activités organisées par la commune après la classe.

## Au quotidien
- **Inscrivez votre enfant tôt**, souvent au moment de l’inscription en mairie ou via le portail famille de la commune.
- **Demandez la grille tarifaire** et les justificatifs à fournir pour un tarif selon les revenus, s’il existe.
- **Signalez toute allergie** et engagez la démarche de PAI avec le médecin et le directeur avant la rentrée.
- **Consultez les menus** affichés ou en ligne pour équilibrer les autres repas de la journée.
- **Préparez votre enfant** : se servir, couper sa viande, demander de l’aide à un adulte.
- **Écoutez son ressenti** : bruit, rythme, copains. La pause du midi compte dans sa fatigue.

## Questions fréquentes
**La mairie peut-elle refuser mon enfant parce que je ne travaille pas ?**
Lorsque la cantine existe, l’inscription est un droit pour tous les enfants scolarisés, sans discrimination. Seule une capacité d’accueil atteinte peut justifier un refus.

**Le tarif de la cantine me paraît élevé. Existe-t-il des aides ?**
Les tarifs sont fixés par la commune, qui peut les moduler. Renseignez-vous auprès de la mairie ou du centre communal d’action sociale sur les tarifs selon les ressources ou les aides locales.

**Mon enfant mange très peu à la cantine. Que faire ?**
Parlez-en avec lui et, si besoin, avec le personnel de cantine. Un petit déjeuner et un goûter adaptés, sans excès, peuvent compléter. En cas de perte de poids ou de fatigue, consultez votre médecin.

**Qui contacter en cas de problème pendant la pause du midi ?**
Dans une école publique, le service de restauration ou le service périscolaire de la mairie, responsable de ce temps.

## Quand demander conseil
Pour toute question d’inscription ou de tarif, contactez la mairie. Pour une allergie ou un besoin de santé, parlez-en à votre médecin et au directeur pour mettre en place un PAI. En cas de réaction allergique grave (gêne respiratoire, gonflement du visage, malaise), il faut appeler immédiatement le 15 ou le 112.

${FIN}`,
    sources: [S.collectivitesCantine, S.spSurveillance, S.spAssurance],
  },
  {
    ...CHILD,
    slug: 'sorties-scolaires-autorisation-cout-classe-decouverte',
    title: 'Sorties et voyages scolaires : autorisation, coût et préparation',
    summary: 'Sorties obligatoires ou facultatives, autorisation parentale, participation financière, encadrement, santé et PAI : ce que prévoit le guide ministériel des sorties et voyages scolaires du premier degré.',
    category: 'ecole-garde',
    tags: ['sortie scolaire', 'classe découverte', 'voyage scolaire', 'autorisation parentale', 'participation financière', 'PAI', 'école primaire'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Musée, piscine, classe verte : les sorties scolaires font partie de la vie de l’école. Le ministère de l’Éducation nationale a publié en décembre 2025 un guide qui précise les règles. Voici ce qui concerne directement les familles.

## En bref
- Trois types : **sorties régulières** (piscine…), **sorties occasionnelles sans nuitée** (une journée maximum) et **voyages avec nuitée**.
- Les sorties **obligatoires** ont lieu pendant les heures de classe, sont **gratuites** et ne demandent **pas d’autorisation parentale**.
- Les sorties **facultatives** (dont tous les voyages avec nuitée) demandent une **autorisation écrite** d’un titulaire de l’autorité parentale.
- Une **participation financière** peut être demandée pour une sortie facultative ; elle doit rester limitée et **ne jamais empêcher un enfant de partir** pour des raisons financières.
- Les parents sont **informés à l’avance** de toutes les sorties.

## Comprendre
**Obligatoire ou facultative ?** Une sortie obligatoire se déroule pendant le temps d’enseignement inscrit à l’emploi du temps : tous les élèves y participent, comme en classe. Les voyages avec nuitée et les sorties sans nuitée dans les pays frontaliers sont facultatifs.

**L’argent.** Selon le guide :
- les sorties obligatoires sont gratuites ; le repas des demi-pensionnaires est pris en charge par la commune ;
- pour une sortie facultative, la participation doit rester limitée, ne pas dépasser le coût réel et être annoncée dans le budget ; des facilités de paiement (en 2 ou 3 fois) doivent être proposées, et les chèques-vacances peuvent être acceptés ; des fonds sociaux peuvent être sollicités ;
- le coût des accompagnateurs ne peut pas être reporté sur les familles ;
- les frais liés au handicap ou à un besoin médical d’un élève ne peuvent pas être facturés à sa famille.

**L’encadrement.** Il y a toujours au moins deux adultes, dont un enseignant. Par exemple, en maternelle, deux adultes jusqu’à 16 élèves puis un adulte de plus par tranche de 8 ; en élémentaire sans nuitée, deux adultes jusqu’à 30 élèves puis un de plus par tranche de 15. Les activités sportives demandent des taux renforcés.

**Le transport.** Départ et retour se font en principe à l’école. En car, le chauffeur est professionnel et les encadrants vérifient que chaque enfant attache sa ceinture.

**Hors de France.** Une **autorisation de sortie du territoire** est nécessaire, signée par un titulaire de l’autorité parentale et accompagnée de la copie de sa pièce d’identité.

## Au quotidien
- **Lisez attentivement le mot d’information** : date, horaires, tenue, pique-nique, coût.
- **Rendez l’autorisation signée à temps** pour une sortie facultative.
- **Remplissez la fiche sanitaire** (ou un pli cacheté) pour les informations de santé utiles, et signalez tout traitement.
- **PAI** : l’enseignant emporte le PAI et les médicaments pendant toute la sortie ; vérifiez qu’ils sont à jour et non périmés.
- **Parlez de la sortie avec votre enfant**, surtout s’il dort pour la première fois loin de la maison : ce qu’il va faire, comment il pourra donner des nouvelles.
- **Préparez un sac adapté**, marqué à son nom, avec un objet rassurant si besoin.
- **En cas de difficulté financière**, parlez-en discrètement au directeur : des solutions existent.

## Questions fréquentes
**Puis-je refuser que mon enfant participe à une sortie ?**
Pour une sortie obligatoire, non : elle fait partie de l’enseignement. Pour une sortie facultative, votre autorisation est demandée.

**Faut-il une attestation d’assurance ?**
Le guide indique qu’aucune attestation n’est à fournir par l’élève, mais il encourage vivement les familles à être assurées.

**Les deux parents doivent-ils signer ?**
La signature d’un seul titulaire de l’autorité parentale suffit, sauf si l’autre parent exprime son désaccord.

**Mon enfant a un handicap. Peut-il partir ?**
Ses besoins (transport, hébergement, aide humaine, soins) doivent être anticipés ; un AESH peut l’accompagner avec l’accord de son employeur, et aucun surcoût ne peut vous être facturé.

## Quand demander conseil
Parlez au directeur de toute question d’organisation ou de coût. Pour un enfant ayant un problème de santé, faites le point avec votre médecin avant un séjour. Pendant la sortie, en cas d’urgence, l’équipe appelle le 15 ou le 112 et vous prévient.

${FIN}`,
    sources: [S.eduscolSorties],
  },
  {
    ...CHILD,
    slug: 'parent-accompagnateur-sortie-scolaire-role',
    title: 'Accompagner une sortie scolaire : le rôle du parent accompagnateur',
    summary: 'Autorisation du directeur, rôle dans le groupe, contrôle d’honorabilité pour les voyages, assurance conseillée : ce qu’il faut savoir avant de se porter volontaire pour une sortie de classe.',
    category: 'ecole-garde',
    tags: ['parent accompagnateur', 'sortie scolaire', 'bénévole', 'encadrement', 'assurance responsabilité civile', 'voyage scolaire'],
    min_age_months: 36, max_age_months: 131,
    body_md: `L’enseignant cherche des parents pour la sortie au théâtre ou la classe de neige ? Accompagner une sortie est une belle façon de participer à la vie de l’école. Voici les règles, d’après le guide ministériel des sorties et voyages scolaires du premier degré (décembre 2025).

## En bref
- Les sorties sont toujours encadrées par **au moins un enseignant** ; les autres adultes peuvent être des **parents bénévoles**.
- Le parent accompagnateur doit être **autorisé par écrit par le directeur d’école**.
- Il participe à l’encadrement **du groupe** ; il n’est **pas chargé d’un enfant en particulier**.
- Pour un **voyage avec nuitée**, un **contrôle d’honorabilité** est réalisé à partir de son état civil avant le départ.
- Une **assurance responsabilité civile** et une **individuelle accidents corporels** sont fortement conseillées ; le bénévole **ne paie pas** son séjour.

## Comprendre
**Pourquoi des parents ?** Les taux d’encadrement imposent au moins deux adultes par sortie, dont un enseignant, et davantage selon le nombre d’élèves et l’activité. Les parents permettent souvent que la sortie ait lieu.

**Le rôle.** Vous aidez l’enseignant à encadrer un petit groupe, à faire respecter les consignes de sécurité, à compter les enfants, à accompagner les déplacements. L’enseignant reste responsable de l’organisation. Le guide précise qu’un parent ne peut pas être chargé d’un enfant en particulier : l’accompagnement individuel d’un élève en situation de handicap relève de l’AESH.

**Les formalités.** Pour une sortie à la journée, l’autorisation écrite du directeur suffit. Pour un voyage, le parent fournit son sexe, son nom de naissance, son prénom, sa date et son lieu de naissance : ces informations servent à un contrôle d’honorabilité effectué par les services de l’Éducation nationale.

**Les premiers secours.** Pendant un voyage, si personne de la structure d’accueil n’est formé, un accompagnateur formé aux premiers secours doit être présent sur le lieu d’hébergement, y compris la nuit.

**L’argent.** Le coût des accompagnateurs ne peut pas être reporté sur les familles, et les accompagnateurs bénévoles n’ont pas à payer leur séjour.

## Au quotidien
**Avant :**
- demandez à l’enseignant le programme, les horaires, le trajet et ses attentes précises ;
- vérifiez votre assurance (responsabilité civile, accidents corporels) ;
- prévoyez une tenue pratique, un téléphone chargé, de l’eau.

**Pendant :**
- connaissez les prénoms des enfants de votre groupe et comptez-les régulièrement ;
- restez attentif lors des traversées, des montées dans le car (ceintures attachées) et des lieux très fréquentés ;
- appliquez les consignes de l’enseignant et signalez-lui tout problème ;
- évitez de photographier les enfants sans accord de l’enseignant, et ne publiez rien sur les réseaux sociaux ;
- restez discret sur ce que vous observez des autres enfants.

**Avec votre propre enfant :**
- prévenez-le que vous serez là « pour tout le groupe » ;
- s’il est plus collant ou plus agité que d’habitude, c’est souvent passager.

## Questions fréquentes
**Puis-je accompagner si je n’ai pas de formation ?**
Le guide ne mentionne pas de formation exigée pour une sortie à la journée : il faut l’autorisation écrite du directeur. Pour un voyage, une personne formée aux premiers secours doit être présente si la structure d’accueil n’en a pas.

**Qui est responsable si un enfant se blesse ?**
L’enseignant organise et encadre la sortie ; les accompagnateurs ont aussi une obligation de surveillance. D’où l’intérêt d’une assurance personnelle adaptée.

**Puis-je donner un médicament à un enfant ?**
Non, sauf consignes précises : pour un enfant qui a un PAI, c’est l’enseignant qui conserve le PAI et les médicaments et organise la conduite à tenir.

**Puis-je venir avec un petit frère ou une petite sœur ?**
Posez la question à l’enseignant avant la sortie : votre attention doit pouvoir être consacrée au groupe d’enfants qui vous est confié.

## Quand demander conseil
Posez vos questions à l’enseignant avant la sortie. Pendant la sortie, en cas d’accident ou de malaise d’un enfant, prévenez immédiatement l’enseignant ; l’appel au 15 ou au 112 se fait sans attendre en cas d’urgence. Si vous êtes témoin d’un comportement inquiétant envers un enfant, signalez-le à l’enseignant et au directeur ; le 119 peut aussi être appelé.

${FIN}`,
    sources: [S.eduscolSorties, S.spSurveillance],
  },
  // ───────────────────────────── Bien-être et santé à l'école ─────────────────────────────
  {
    ...CHILD,
    slug: 'fatigue-scolaire-sommeil-enfant-rythme',
    title: 'Fatigue scolaire : repérer le manque de sommeil et retrouver un bon rythme',
    summary: 'Somnolence en classe, irritabilité, difficultés à se lever : les signes d’un manque de sommeil chez l’écolier, les habitudes qui aident (horaires, écrans, activité physique) et quand consulter.',
    category: 'sante-enfant',
    tags: ['fatigue scolaire', 'sommeil enfant', 'rythme', 'coucher', 'écrans', 'rentrée', 'somnolence'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Votre enfant traîne des pieds le matin, s’énerve pour un rien ou s’endort sur le canapé à 18 heures ? La fatigue fait partie de la vie scolaire, mais un manque de sommeil durable pèse sur l’humeur et les apprentissages. Repères tirés d’ameli.fr et de mpedia.fr.

## En bref
- Signes possibles d’un manque de sommeil : **fatigue dans la journée**, **somnolence** (jusqu’à s’endormir en classe), **agitation**, **agressivité** ou au contraire **repli**.
- Des **horaires réguliers** de coucher et de lever, **y compris le week-end et pendant les vacances**, sont le premier levier.
- **Éteindre les écrans une à deux heures avant le coucher** et les ranger hors de la chambre.
- **Une heure d’activité physique par jour** améliore la qualité du sommeil, en évitant les activités très stimulantes dans les 3 heures avant le coucher.
- Ne jamais donner de médicament pour faire dormir un enfant sans avis médical.

## Comprendre
**Une journée bien remplie.** Entre la classe, la cantine, le périscolaire et les activités, la journée d’un écolier est longue. En maternelle, mpedia.fr souligne que la fatigue du soir est fréquente les premiers jours, avant que l’enfant retrouve son rythme.

**Les signes à repérer**, selon ameli.fr : un enfant fatigué ou qui somnole dans la journée, des changements d’humeur (très agité, agressif ou replié). Certains signes peuvent évoquer un problème de santé et justifient un avis médical : ronflements, pauses respiratoires la nuit, infections ORL fréquentes, difficultés respiratoires, retard de croissance, fièvre ou douleurs.

**Les écrans.** Ameli.fr recommande pour les 3-10 ans un usage modéré, avec des programmes adaptés, des écrans éteints une à deux heures avant le coucher et rangés hors de la chambre.

**L’environnement.** Une chambre calme, peu lumineuse le soir, aérée, sans fumée de tabac, entre 18 et 20 °C, sans bruit de fond comme une télévision.

## Au quotidien
- **Fixez une heure de coucher** en fonction de l’heure du réveil, et tenez-la les soirs d’école comme le week-end, autant que possible.
- **Avancez progressivement le coucher** à la fin des vacances plutôt que de tout changer la veille de la rentrée.
- **Instaurez un rituel calme** : douche, histoire, discussion, câlin.
- **Limitez les activités du soir** : une journée avec périscolaire long et activité tardive peut être trop chargée.
- **Bougez dans la journée** : trajet à pied ou à vélo, jeux dehors, sport.
- **Évitez les boissons caféinées** (thé, cola, boissons énergisantes).
- **Après une mauvaise nuit**, évitez la grasse matinée prolongée qui décale le rythme.
- **Parlez avec l’enseignant** s’il remarque une somnolence en classe.

## Questions fréquentes
**Mon enfant de CP est épuisé le vendredi. Faut-il s’inquiéter ?**
Une fatigue en fin de semaine est fréquente au début de l’année. Si elle persiste, s’accompagne d’autres signes ou retentit sur son humeur, parlez-en à votre médecin.

**La sieste est-elle utile en maternelle ?**
Elle permet aux plus jeunes de récupérer d’une journée chargée. À la maison, ameli.fr conseille de la limiter au début de l’après-midi et de la raccourcir si nécessaire.

**Il met plus d’une demi-heure à s’endormir. Que faire ?**
Revoyez les habitudes du soir (écrans, activités, horaires). Ameli.fr indique de consulter si l’endormissement dépasse régulièrement 30 minutes, si les réveils nocturnes sont fréquents et longs, ou si la journée en est perturbée.

**La mélatonine peut-elle aider ?**
Ameli.fr déconseille la mélatonine en complément alimentaire chez l’enfant. Parlez-en à votre médecin, qui recherchera d’abord la cause.

## Quand demander conseil
Consultez si la fatigue est inhabituelle, dure plusieurs semaines, s’accompagne de ronflements avec pauses respiratoires, de fièvre, de douleurs, d’une perte de poids, ou si votre enfant semble triste ou anxieux. Notez son sommeil une dizaine de jours avant le rendez-vous. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
    sources: [S.ameliDortMal, S.ameliSommeil, S.mpediaMaternelle],
  },
  {
    ...CHILD,
    slug: 'telephone-portable-ecrans-et-ecole-regles',
    title: 'Téléphone portable et écrans : ce que prévoit l’école et comment s’organiser à la maison',
    summary: 'Le portable est interdit à l’école et au collège depuis 2018, et au lycée depuis la rentrée 2026 ; écrans du soir et sommeil, premier téléphone : des repères pour accompagner votre enfant.',
    category: 'education',
    tags: ['téléphone portable', 'pause numérique', 'écrans', 'école', 'collège', 'sommeil', 'premier téléphone'],
    min_age_months: 36, max_age_months: 131,
    body_md: `Faut-il un téléphone pour aller à l’école ? Que dit la règle ? Et comment éviter que les écrans du soir ne grignotent le sommeil ? Repères tirés de Service-Public.fr et d’ameli.fr.

## En bref
- L’utilisation du **téléphone portable par les élèves est interdite** depuis **2018** dans les écoles maternelles, élémentaires et les collèges ; l’interdiction est **étendue aux lycées** depuis la **rentrée 2026**.
- Des **exceptions** peuvent être prévues par le règlement (usage pédagogique encadré), et l’usage pour **raison médicale** reste autorisé.
- En cas de non-respect, l’établissement apporte une réponse **progressive** ; le téléphone peut être **confisqué**.
- À la maison, entre 3 et 10 ans : un usage **modéré** et des programmes **adaptés à l’âge**.
- **Écrans éteints une à deux heures avant le coucher** et **rangés hors de la chambre**.

## Comprendre
**La règle à l’école.** Selon Service-Public.fr, l’interdiction concerne l’école primaire et le collège depuis 2018 ; la loi du 24 août 2026 visant à protéger les mineurs des risques liés aux réseaux sociaux l’étend au lycée. Chaque établissement précise les modalités dans son règlement intérieur (casiers, boîte collective, pochette verrouillable). Un élève en situation de handicap ou atteint d’un trouble de santé invalidant peut utiliser un appareil pour un motif médical.

**Écrans et sommeil.** Ameli.fr recommande d’éteindre télévision, téléphone, ordinateur et consoles une à deux heures avant le coucher, et de ranger les appareils en dehors de la chambre. Lors des examens de santé de l’enfant, les médecins abordent aussi : pas de téléviseur dans la chambre, pas d’écran pour calmer l’enfant ou pendant les repas.

**Écrans et activité.** Ameli.fr conseille au moins une heure d’activité physique par jour et de limiter le temps passé devant les écrans.

**Le numérique scolaire.** L’école peut utiliser des outils numériques (espace numérique de travail, cahier de liaison en ligne). Ces usages encadrés sont distincts du téléphone personnel.

## Au quotidien
- **Lisez le règlement intérieur** de l’école ou du collège sur les téléphones et objets connectés.
- **Premier téléphone** : demandez-vous à quoi il servira (joindre les parents sur le trajet ?). Un appareil simple peut suffire ; fixez des règles avant de le donner.
- **Paramétrez** le contrôle parental et parlez des risques en ligne (messages, photos, inconnus).
- **Créez des moments sans écran** : repas, trajet, heure avant le coucher.
- **Installez une « station de recharge »** hors des chambres pour la nuit, pour toute la famille.
- **Proposez des alternatives** : jeux, lecture, sport, activités dehors.
- **Montrez l’exemple** : les enfants imitent les usages des adultes.
- **Si l’école utilise un ENT**, consultez-le avec votre enfant et limitez ensuite l’écran au nécessaire.

## Questions fréquentes
**Mon enfant peut-il garder son téléphone éteint dans son sac ?**
Les modalités sont fixées par le règlement de chaque établissement (casier, pochette, boîte). Renseignez-vous auprès de l’école ou du collège.

**Il a besoin d’un appareil pour son diabète ou une autre maladie.**
L’usage d’un téléphone ou d’un objet connecté pour raison médicale reste autorisé. Faites-le figurer dans le PAI ou le projet de scolarisation.

**Les écrans pour les devoirs, ça compte ?**
Oui, ils s’ajoutent au temps d’écran de la journée. Gardez des pauses et évitez les écrans en fin de soirée.

**Mon enfant reçoit des messages blessants sur un groupe de discussion.**
Conservez les preuves, rassurez-le, prévenez l’école et appelez le 3018 (gratuit, 7 j/7, de 9 h à 23 h) pour être conseillé.

## Quand demander conseil
Parlez-en à votre médecin si votre enfant dort mal, s’isole, ne peut plus se passer de l’écran ou présente des troubles de l’humeur. En cas de cyberharcèlement, le 3018 aide les familles. Si un enfant est en danger, appelez le 119 ; en cas de détresse ou d’idées suicidaires, le 3114 répond 24 h/24.

${FIN}`,
    sources: [S.spPortable, S.ameliSommeil, S.ameli4a10],
  },
  {
    ...CHILD,
    slug: 'harcelement-scolaire-enfant-temoin-ou-auteur',
    title: 'Harcèlement à l’école : si votre enfant est témoin… ou auteur',
    summary: 'Comment aider un enfant qui assiste à du harcèlement, et comment réagir si l’école vous apprend que votre enfant harcèle un camarade : écouter, ne pas diaboliser, travailler avec l’école.',
    category: 'ecole-garde',
    tags: ['harcèlement scolaire', 'témoin', 'harceleur', 'auteur de harcèlement', '3018', 'pHARe', 'empathie'],
    min_age_months: 48, max_age_months: 131,
    safety_critical: true,
    body_md: `On pense spontanément aux enfants harcelés. Mais un harcèlement implique aussi des témoins, et des auteurs qui sont eux aussi des enfants. Si votre enfant est dans l’une de ces situations, votre réaction compte beaucoup. Repères tirés d’info.gouv.fr et de Service-Public.fr.

## En bref
- Le harcèlement est une **violence répétée** (verbale, physique ou psychologique) d’un ou plusieurs élèves envers un autre ; il peut se poursuivre en ligne.
- Selon info.gouv.fr, en 2023, **5 % des élèves de CE2 à CM2** se déclaraient victimes.
- Un **témoin** doit **alerter un adulte** de l’école et peut appeler le **3018** ; il ne doit **pas intervenir seul** auprès de l’auteur.
- Si votre enfant est **auteur**, cherchez à **comprendre** l’origine de son comportement, **sans le diaboliser**, tout en rappelant la gravité des faits.
- Le programme **pHARe** prévoit **10 heures par an**, du CP à la terminale, de prévention et de travail sur les compétences psychosociales.

## Comprendre
**Le rôle des témoins.** Le harcèlement s’installe souvent devant d’autres enfants. Les témoins peuvent avoir peur d’être visés à leur tour, ou ne pas savoir quoi faire. Service-Public.fr indique que le témoin doit alerter un adulte de l’établissement, qui prendra la situation en charge, et qu’il peut aussi appeler le 3018 pour signaler ce qu’il observe et obtenir des conseils.

**Quand l’enfant est auteur.** Info.gouv.fr recommande aux parents de chercher l’origine de cette violence : difficultés de communication, peur de l’autre, ou harcèlement subi auparavant. Il s’agit de procéder par étapes, sans mettre l’enfant en accusation ni le « diaboliser », tout en lui rappelant que le harcèlement est un délit, avec des sanctions possibles à l’école et des poursuites possibles en justice, puis de réfléchir avec lui aux valeurs de l’école. Un adulte de l’établissement peut l’accompagner et proposer une aide éducative ou psychologique.

**Ce que fait l’école.** Lorsqu’une situation est signalée, l’équipe reçoit séparément la victime, les témoins et les auteurs ainsi que leurs parents ; l’auteur est informé des faits reprochés et de leurs conséquences pour la victime. Au collège et au lycée, une procédure disciplinaire est engagée ; dans certains cas graves, l’élève harceleur peut être changé d’établissement.

## Au quotidien
**Si votre enfant est témoin :**
- félicitez-le de vous en avoir parlé : ce n’est pas « rapporter », c’est protéger ;
- aidez-le à identifier un adulte de confiance à l’école (enseignant, directeur, animateur) ;
- rappelez-lui de ne pas affronter seul l’auteur et de ne pas relayer de messages ou d’images blessants ;
- prévenez vous-même l’école si les faits sont graves ou s’il a peur ;
- encouragez les gestes simples : rester à côté de l’enfant isolé, l’inviter à jouer.

**Si votre enfant est désigné comme auteur :**
- prenez le temps d’écouter sa version, sans valider ni condamner tout de suite ;
- rencontrez l’école pour connaître les faits ;
- nommez clairement ce qui n’est pas acceptable et parlez de ce que ressent la victime ;
- cherchez ce qui se passe pour lui : conflit, mal-être, influence d’un groupe, violences subies ;
- envisagez une réparation adaptée à son âge, avec l’école ;
- faites un point régulier avec l’enseignant.

## Questions fréquentes
**Mon enfant a peur d’être harcelé s’il dénonce les faits.**
Expliquez-lui que l’adulte alerté agira avec discrétion et que le 3018 est anonyme et confidentiel. Vous pouvez aussi faire le signalement vous-même.

**Mon enfant dit que « c’était pour rire ».**
Expliquez-lui que ce qui compte, c’est l’effet sur l’autre : des moqueries répétées blessent, même présentées comme des jeux.

**Un enfant de 8 ans peut-il être sanctionné pénalement ?**
Avant 13 ans, un auteur ne peut être ni emprisonné ni condamné à une amende, mais des mesures éducatives existent. À l’école, des réponses éducatives et disciplinaires sont prévues.

**Faut-il contacter les parents de l’autre enfant ?**
Service-Public.fr conseille de ne pas tenter de régler le problème seul en contactant l’auteur des faits. Passez par l’école.

## Quand demander conseil
Le 3018 (gratuit, anonyme, 7 j/7 de 9 h à 23 h) conseille les enfants, les parents et les témoins. Si votre enfant, victime ou auteur, montre des signes de grande souffrance (repli, troubles du sommeil, propos de mort), consultez rapidement ; en cas d’idées suicidaires, appelez le 3114, et le 15 ou le 112 en cas de danger immédiat. Si un enfant est en danger, le 119 répond jour et nuit.

${FIN}`,
    sources: [S.infoTemoin, S.spHarcelement, S.infoHarcelement],
  },
  {
    ...CHILD,
    slug: 'cyberharcelement-enfant-reagir-preuves-3018',
    title: 'Cyberharcèlement : que faire si votre enfant est visé en ligne ?',
    summary: 'Messages humiliants, rumeurs, photos diffusées, faux comptes : comment reconnaître le cyberharcèlement, conserver les preuves, faire retirer les contenus, alerter l’école et appeler le 3018.',
    category: 'ecole-garde',
    tags: ['cyberharcèlement', 'harcèlement en ligne', 'réseaux sociaux', '3018', 'preuves', 'captures d’écran', 'PHAROS', 'plainte'],
    min_age_months: 72, max_age_months: 131,
    safety_critical: true,
    body_md: `Avec les messageries, les jeux en ligne et les réseaux sociaux, le harcèlement peut suivre un enfant jusque dans sa chambre. Les étapes pour réagir, d’après info.gouv.fr (septembre 2026) et Service-Public.fr.

## En bref
- Le cyberharcèlement passe par des **outils numériques** : réseaux sociaux, messageries, forums, **jeux en ligne**, courriels.
- Formes fréquentes : insultes, menaces, **rumeurs**, messages humiliants, **diffusion de photos ou vidéos**, usurpation d’identité, faux comptes, attaques coordonnées.
- Premiers réflexes : **ne pas répondre dans l’urgence**, **conserver les preuves**, **bloquer** l’auteur puis **signaler** à la plateforme.
- Alertez **l’école** et appelez le **3018** : gratuit, anonyme, confidentiel, 7 j/7 de 9 h à 23 h, pour les jeunes, les parents et les professionnels.
- Une **plainte** est possible, même contre X ; en cas de danger immédiat, appelez le **17** ou le **112**.

## Comprendre
**Ce qui le rend particulier.** Info.gouv.fr souligne que la diffusion rapide sur les réseaux peut amplifier les faits et leurs effets : isolement, anxiété, troubles du sommeil, difficultés scolaires, atteinte à la santé. Le cyberharcèlement peut prolonger un harcèlement scolaire ou exister uniquement en ligne.

**Une infraction.** Le Code pénal fait de l’usage d’un service en ligne une circonstance aggravante du harcèlement moral. Une victime peut porter plainte sans avoir à qualifier elle-même l’infraction, au commissariat ou à la gendarmerie de son choix, ou par courrier au procureur.

**Le rôle des parents.** Info.gouv.fr recommande d’alerter l’établissement (direction, enseignant, infirmier scolaire), d’appeler le 3018, et d’accompagner l’enfant : l’écouter, le rassurer, conserver les preuves, signaler les contenus. La page déconseille de régler la situation directement avec l’auteur.

**Même chez les plus jeunes.** Les jeux en ligne avec messagerie et les groupes de discussion de classe peuvent concerner des enfants d’école élémentaire.

## Au quotidien
**Dès que vous découvrez les faits :**
- restez calme et remerciez votre enfant de vous en avoir parlé ; évitez de lui confisquer d’emblée son appareil, ce qui pourrait le dissuader de revenir vers vous ;
- faites des **captures d’écran datées** (messages, profils, adresses des pages, noms des comptes) ;
- **bloquez** l’auteur après avoir conservé les preuves ;
- **signalez** les contenus à la plateforme et demandez leur suppression ;
- **sécurisez les comptes** : mots de passe changés et distincts, double authentification, paramètres de confidentialité.

**Ensuite :**
- prévenez l’école, surtout si les auteurs sont des camarades ;
- appelez le 3018 pour être conseillé, y compris sur le retrait des contenus ;
- les contenus illicites publics peuvent être signalés sur PHAROS ;
- envisagez une plainte avec les preuves rassemblées.

**Prévenir :**
- parlez tôt des règles en ligne : ne pas partager de photo d’un autre sans accord, ne pas relayer de contenus méchants ;
- limitez les informations personnelles visibles ;
- gardez le dialogue ouvert sur ce que votre enfant vit en ligne.

## Questions fréquentes
**Mon enfant est témoin dans un groupe de classe. Que lui conseiller ?**
Ne pas partager, commenter ni relayer les contenus, aider la victime à conserver les preuves et prévenir un adulte. Le 3018 est aussi destiné aux témoins.

**Les auteurs sont des élèves de sa classe. L’école peut-elle agir alors que cela se passe hors de l’école ?**
Le harcèlement entre élèves peut se dérouler à l’intérieur comme à l’extérieur de l’établissement, et le cyberharcèlement prolonge souvent le harcèlement scolaire. Signalez-le à la direction.

**Faut-il supprimer le compte de mon enfant ?**
Commencez par conserver les preuves. Ensuite, bloquer, signaler et sécuriser sont souvent plus utiles qu’une suppression immédiate, qui peut effacer des éléments.

**Combien de temps pour porter plainte ?**
Pour un mineur victime de harcèlement scolaire, Service-Public.fr indique un délai de 6 ans après les faits.

## Quand demander conseil
Appelez le 3018 pour tout cyberharcèlement. Si votre enfant change brusquement (repli, peur d’aller à l’école, troubles du sommeil, tristesse), consultez votre médecin ou un psychologue. En cas d’idées suicidaires, appelez le 3114 ; en cas de menace ou de danger immédiat, le 17 ou le 112. Si un enfant est en danger, le 119 répond 24 h/24.

${FIN}`,
    sources: [S.infoCyber, S.spHarcelement, S.infoHarcelement],
  },
  {
    ...CHILD,
    slug: 'refus-scolaire-anxieux-angoisse-aller-a-l-ecole',
    title: 'Quand l’angoisse empêche d’aller à l’école : comprendre le refus scolaire anxieux',
    summary: 'Crises le matin, maux de ventre, peur panique à l’idée d’entrer en classe : ce que recouvre le refus scolaire anxieux, pourquoi agir vite avec l’école, et quels professionnels peuvent aider.',
    category: 'sante-mentale',
    tags: ['refus scolaire anxieux', 'phobie scolaire', 'angoisse', 'anxiété enfant', 'mal au ventre école', 'AJPP', 'pédopsychiatre'],
    min_age_months: 48, max_age_months: 131,
    safety_critical: true,
    body_md: `Certains enfants voudraient aller à l’école mais n’y arrivent pas : pleurs, panique, douleurs au moment de partir. Ce n’est ni un caprice ni de la paresse. Ce que l’on sait, d’après un article de la Caf s’appuyant sur une pédopsychiatre du CHU de Montpellier, et les règles d’assiduité rappelées par Service-Public.fr.

## En bref
- Le **refus scolaire anxieux** (souvent appelé « phobie scolaire ») désigne un enfant qui **ne peut pas aller à l’école malgré sa volonté** ; il résulte d’un ou plusieurs **troubles anxieux** à identifier.
- Signes possibles : **crises et larmes**, **peur panique**, **troubles du sommeil** à l’idée d’aller à l’école, **tristesse**, baisse de l’estime de soi, **honte** de ne pas y arriver.
- **Contactez l’école très tôt** pour chercher des solutions ensemble ; l’enfant ne s’en sortira pas seul.
- Une **prise en charge** par un pédopsychiatre, un psychiatre ou un psychologue est **indispensable** ; la thérapie comportementale et cognitive est citée comme méthode à l’efficacité démontrée.
- Les parents qui doivent rester auprès de leur enfant peuvent demander l’**allocation journalière de présence parentale (AJPP)**.

## Comprendre
**Un enfant « en lutte ».** Le Dr Hélène Dénis, pédopsychiatre citée par la Caf, préfère le terme de refus scolaire anxieux à celui de phobie scolaire : le trouble est plus complexe qu’une simple peur de l’école. Ces enfants veulent y aller, mais leur angoisse les en empêche ; leur peur dépasse souvent le seul cadre scolaire.

**Pourquoi agir vite.** Plus le temps passe, plus le retour en classe devient difficile. L’article insiste sur l’importance d’agir rapidement et collectivement pour éviter la déscolarisation.

**Ce que peut faire l’école.** Des aménagements adaptés aux peurs de l’enfant peuvent être proposés : ne plus aller à la cantine, entrer par une autre porte, avoir un adulte référent. Ils ne sont pas toujours simples à mettre en place et ne suffisent pas toujours, mais ils peuvent aider.

**Le cadre de l’assiduité.** Service-Public.fr rappelle que les absences doivent être justifiées et que, en cas d’absences répétées, l’équipe éducative se réunit pour comprendre les causes et proposer un accompagnement. Informer l’école de la situation permet d’entrer dans cette logique d’aide.

## Au quotidien
- **Prenez au sérieux** les plaintes répétées du matin (maux de ventre, de tête, nausées) qui disparaissent le week-end : parlez-en avec votre médecin pour faire le point.
- **Écoutez sans juger** : « je vois que c’est très dur pour toi ; on va trouver de l’aide ».
- **Évitez les menaces ou la force** pour le faire entrer en classe, qui risquent d’augmenter la panique.
- **Prévenez l’enseignant et le directeur** et demandez une rencontre ; proposez de chercher ensemble des aménagements.
- **Gardez un lien avec l’école** même pendant les absences : travail transmis, contact avec un camarade.
- **Maintenez un rythme** à la maison (lever, repas, coucher) et des activités qui lui font du bien.
- **Prenez soin de vous** : cette situation est éprouvante pour les parents aussi.

## Questions fréquentes
**Comment distinguer un refus anxieux d’une simple envie de rester à la maison ?**
Le refus anxieux s’accompagne d’une détresse importante : panique, pleurs, troubles du sommeil, honte. Seul un professionnel peut évaluer la situation ; en cas de doute, consultez.

**Faut-il le laisser à la maison le temps que ça passe ?**
L’article de la Caf met en garde contre l’attente : les solutions sont à chercher rapidement avec l’école et un professionnel de santé, pour éviter que l’enfant ne s’éloigne durablement de l’école.

**Quels professionnels consulter ?**
Votre médecin traitant ou pédiatre, qui pourra orienter vers un pédopsychiatre, un psychiatre ou un psychologue. Ameli.fr indique que le médecin peut proposer un suivi psychologique via le dispositif Mon soutien psy, accessible dès 3 ans.

**Existe-t-il une aide financière si je dois arrêter de travailler ?**
L’AJPP peut être demandée par les parents qui doivent rester auprès de leur enfant ; renseignez-vous auprès de votre Caf ou de la MSA.

## Quand demander conseil
Consultez sans attendre si votre enfant manque souvent l’école à cause de l’angoisse, s’il ne dort plus, s’isole ou exprime des idées noires. En cas d’idées suicidaires, appelez le 3114 (24 h/24) ; en cas de danger immédiat, le 15 ou le 112. Si l’angoisse est liée à des violences ou à du harcèlement, signalez-le à l’école et appelez le 3018 ou le 119.

${FIN}`,
    sources: [S.cafRefus, S.spAssiduite, S.ameliDortMal],
  },
  {
    ...CHILD,
    slug: 'examens-de-sante-4-10-ans-ecole-depistages',
    title: 'Examens de santé de 4 à 10 ans : ce qui est vérifié pendant les années d’école',
    summary: 'Examens à 4, 5, 6 et 8-9 ans, visite à l’école avec le médecin scolaire, dépistage de la scoliose en CM1 : ce que regardent les médecins (vision, audition, langage, apprentissages) et comment s’y préparer.',
    category: 'sante-enfant',
    tags: ['examen 6 ans', 'visite médicale école', 'médecin scolaire', 'vision', 'audition', 'dépistage', 'carnet de santé', 'scoliose'],
    min_age_months: 48, max_age_months: 131,
    body_md: `Entre la maternelle et le CM2, quatre examens de suivi sont prévus pour votre enfant. Ils sont l’occasion de vérifier sa croissance, sa vue, son audition, son langage et de repérer tôt ce qui pourrait gêner ses apprentissages. Les repères d’ameli.fr (mise à jour février 2026).

## En bref
- Quatre examens de suivi sont prévus **à 4 ans, 5 ans, 6 ans et entre 8 et 9 ans** ; celui de **6 ans** a été ajouté **début 2025**.
- À **5 ans**, la visite a le plus souvent lieu **à l’école** avec le médecin de santé scolaire, en présence d’un parent ; à défaut, prenez rendez-vous chez le médecin traitant.
- Un **dépistage de la scoliose** est organisé en **CM1** par l’Assurance Maladie et l’Éducation nationale.
- Ces consultations sont **prises en charge à 100 %**, sans avance de frais (hors dépassements d’honoraires).
- Pensez au **carnet de santé** et notez vos questions à l’avance.

## Comprendre
**Pourquoi un examen à 6 ans ?** Selon ameli.fr, l’entrée au CP demande à l’enfant de s’adapter et d’apprendre dans un nouvel environnement : il est important de repérer tôt les difficultés.

**Ce que regarde le médecin :**
- **croissance et poids** : taille, poids, courbes, recherche d’une insuffisance pondérale ou d’un surpoids débutant ;
- **propreté** : y compris pipi au lit et contrôle des selles ;
- **dents** : caries, malpositions ;
- **vision et audition** : une surdité même légère (parfois liée à une otite séreuse) ou un trouble visuel (strabisme, difficulté à voir de loin, fatigue oculaire) peuvent gêner la communication et les apprentissages ;
- **motricité** : courir, s’habiller seul, sauter sur un pied ;
- **langage et apprentissages** : troubles de la parole, bégaiement, et repérage de troubles comme la dyslexie, la dysorthographie, la dysgraphie ou la dyspraxie ;
- **comportement** : amitiés, attention, agitation ;
- **vaccinations** : mise à jour des vaccins obligatoires.

**Des conseils de prévention** sont aussi abordés : sommeil régulier, écrans (pas de téléviseur dans la chambre, arrêt une heure avant le coucher), pas d’écouteurs pour endormir l’enfant, alimentation, au moins une activité physique par jour, brossage des dents et bilan bucco-dentaire gratuit, tabagisme passif à éviter.

**Le médecin traitant.** Depuis 2016, les parents d’enfants de moins de 16 ans sont invités à déclarer un médecin traitant pour leur enfant (généraliste, pédiatre…).

## Au quotidien
- **Notez les dates** des examens dans votre agenda, en vous aidant du carnet de santé.
- **Répondez à la convocation** de la santé scolaire pour la visite de 5 ans ; si vous ne pouvez pas venir, prévenez et prenez rendez-vous chez votre médecin.
- **Préparez vos observations** : comment il parle, voit, entend, dort ; ce que dit l’enseignant ; ce qui vous questionne.
- **Apportez le carnet de santé** et, si utile, le livret scolaire ou les remarques de l’enseignant.
- **Expliquez à votre enfant** ce qui va se passer (lire des lettres au loin, écouter des sons, sauter sur un pied) pour le rassurer.
- **Suivez les conseils donnés** : rendez-vous chez l’ophtalmologiste, l’ORL ou l’orthophoniste si nécessaire.

## Questions fréquentes
**Mon enfant a-t-il besoin d’un examen s’il n’est jamais malade ?**
Oui : ces examens de suivi ont lieu justement quand l’enfant va bien, pour repérer des difficultés qui ne se voient pas forcément (légère baisse de l’audition, trouble visuel, difficulté de langage).

**Que faire si la visite de l’école n’a pas eu lieu ?**
Ameli.fr conseille, en l’absence de cet examen, de prendre rendez-vous avec le médecin traitant quand l’enfant n’est pas malade.

**Faut-il avancer les frais ?**
Non, ces consultations sont prises en charge à 100 % par l’Assurance Maladie sans avance de frais ; seuls d’éventuels dépassements d’honoraires restent à votre charge.

**Des signes de puberté à 7 ans, est-ce à signaler ?**
Oui : ameli.fr indique que des signes de puberté avant 8 ans chez une fille ou avant 9 ans chez un garçon justifient une consultation et un bilan.

## Quand demander conseil
N’attendez pas l’examen prévu si vous remarquez que votre enfant plisse les yeux, se rapproche des écrans, fait répéter souvent, parle difficilement, a des douleurs, ou si son comportement change nettement : consultez votre médecin. En cas d’urgence, appelez le 15 ou le 112.

${FIN}`,
    sources: [S.ameli4a10],
  },
  {
    ...CHILD,
    slug: 'trajet-de-l-ecole-a-pied-a-velo-securite',
    title: 'Le trajet de l’école à pied ou à vélo : apprendre à circuler en sécurité',
    summary: 'S’entraîner sur le trajet, traverser, être visible, rouler à vélo avec casque et équipement obligatoire, permis piéton en CE2 : des conseils pour rendre votre enfant progressivement autonome.',
    category: 'securite',
    tags: ['trajet école', 'enfant piéton', 'sécurité routière', 'vélo', 'casque', 'permis piéton', 'gilet réfléchissant'],
    min_age_months: 36, max_age_months: 131,
    safety_critical: true,
    body_md: `Aller à l’école à pied ou à vélo, c’est bon pour la forme et pour l’autonomie. Encore faut-il que votre enfant connaisse les dangers de la rue. Les conseils de la préfecture du Calvados (sécurité routière), complétés par ameli.fr et Service-Public.fr.

## En bref
- **Faites le trajet ensemble** plusieurs fois et montrez les endroits dangereux : sorties de garages et de parkings, passages piétons.
- **Traverser** : au passage piéton, en regardant de chaque côté, **sans courir**, en restant attentif aux bruits.
- **Être visible** : bandes **rétroréfléchissantes** sur les vêtements et le cartable, surtout en hiver.
- À vélo, le **casque est obligatoire jusqu’à 12 ans**, et le vélo doit être équipé (freins, sonnette, feux, catadioptres).
- Le **permis piéton**, destiné aux élèves de **CE2**, aide à préparer l’autonomie.

## Comprendre
**L’enfant piéton.** Un jeune enfant voit et entend la circulation différemment d’un adulte : il est plus petit, moins visible et s’arrête difficilement quand il court. L’apprentissage se fait donc progressivement, en accompagnant l’enfant et en lui expliquant chaque étape.

**À vélo**, selon la préfecture du Calvados :
- vérifiez d’abord que l’enfant sait rouler seul, puis entraînez-vous ensemble sur le trajet ;
- choisissez des vêtements clairs et évitez les accessoires longs (écharpe, sac en bandoulière) ;
- rappelez les règles : s’arrêter au feu rouge et au stop, laisser la priorité à droite, ne pas prendre les sens interdits, rouler à droite, utiliser les pistes cyclables, signaler ses changements de direction, se méfier des portières et des sorties de garage ;
- équipement obligatoire : sonnette audible à 50 m, deux freins, feu avant jaune ou blanc, feu arrière rouge, dispositifs réfléchissants, casque jusqu’à 12 ans ; siège enfant obligatoire jusqu’à 5 ans pour le transporter ; gilet réfléchissant hors agglomération la nuit ou par faible visibilité.

**À l’école.** Service-Public.fr précise qu’en élémentaire, l’enseignant accompagne les élèves jusqu’à la porte, puis l’enfant est sous la responsabilité de ses parents ; c’est à vous de décider s’il peut rentrer seul. Le livret scolaire peut comporter une attestation de sécurité routière.

**Bouger chaque jour.** Ameli.fr cite la marche ou le vélo pour aller à l’école parmi les façons d’atteindre au moins une activité physique quotidienne.

## Au quotidien
- **Choisissez l’itinéraire le plus sûr**, même s’il est un peu plus long : trottoirs larges, passages protégés, feux.
- **Montrez l’exemple** : traversez toujours au passage piéton, au feu vert pour les piétons.
- **Faites-le guider** : laissez-le décider quand traverser, en le corrigeant si besoin.
- **Expliquez les pièges** : voiture qui recule, bus à l’arrêt qui masque la vue, ballon qui roule sur la route.
- **Équipez cartable et manteau** de bandes réfléchissantes ; pensez au gilet les matins sombres.
- **Vérifiez le vélo** régulièrement : freins, pneus, éclairage, réglage du casque.
- **Passez par étapes** vers l’autonomie : accompagner, puis suivre de loin, puis le laisser faire une partie du trajet avec un camarade.
- **Fixez des règles** : pas de téléphone ni d’écouteurs en marchant ou en roulant.

## Questions fréquentes
**À quel âge peut-il aller seul à l’école ?**
Aucun âge n’est fixé. Cela dépend de sa maturité, du trajet et de votre organisation. Le permis piéton proposé en CE2 est un bon repère pour en parler.

**Le casque est-il vraiment obligatoire ?**
Oui, jusqu’à 12 ans, que l’enfant conduise le vélo ou soit transporté. Choisissez un casque à sa taille et bien réglé.

**Le gilet réfléchissant est-il obligatoire ?**
À vélo, il l’est hors agglomération la nuit ou par faible visibilité. Pour un enfant piéton, des bandes réfléchissantes sur les vêtements et le cartable sont vivement conseillées dès qu’il fait sombre.

**Et la trottinette ?**
Les mêmes réflexes de prudence s’appliquent (vitesse modérée, visibilité, casque conseillé). Vérifiez les règles de l’école pour la ranger.

## Quand demander conseil
Si votre enfant a eu un accident, même léger, consultez en cas de choc à la tête, de vomissements, de somnolence ou de douleur persistante ; en cas d’urgence, appelez le 15 ou le 112. Si votre enfant a très peur du trajet, parlez-en avec lui et avec l’école.

${FIN}`,
    sources: [S.calvadosTrajet, S.spSurveillance, S.ameli4a10],
  },
];
