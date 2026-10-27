/** Guide complet — lot 35 (27/10/2026) : articles rédigés avec l'aide d'une IA à partir de sources officielles consultées, statut « À vérifier ». */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
const MP = 'mpedia.fr (Association française de pédiatrie ambulatoire)';
// Sources réellement consultées (pages officielles ou de référence françaises).
const S = {
  // Dents
  ameliDentsLait: { label: 'ameli.fr — L’importance des dents de lait et les risques liés aux caries chez le tout-petit', url: 'https://www.ameli.fr/assure/sante/themes/poussee-dentaire/dents-lait-importance-risque-lie-caries', consulted_on: C },
  ameliPoussee: { label: 'ameli.fr — Comprendre les poussées dentaires', url: 'https://www.ameli.fr/assure/sante/themes/poussee-dentaire/comprendre-poussee-dents-de-lait', consulted_on: C },
  ameliBrosser: { label: 'ameli.fr — Comment bien se brosser les dents ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/quotidien/brosser-dents', consulted_on: C },
  ameliTrauma: { label: 'ameli.fr — Traumatisme dentaire : dent contuse, fêlée, cassée ou luxée', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/traumatisme-dentaire', consulted_on: C },
  mpediaBrossage: { label: `${MP} — Brossage de dent du bébé : quelles recommandations ?`, url: 'https://www.mpedia.fr/art-brossage-dent-bebe-recommandations/', consulted_on: C, published: '2023-07-17' },
  ufsbdPremiere: { label: 'UFSBD (Union française pour la santé bucco-dentaire) — Fiche conseil « Sa première fois chez le dentiste »', url: 'https://www.ufsbd.fr/wp-content/uploads/2013/08/Fiche-Sa-premiere-fois-chez-le-dentiste.pdf', consulted_on: C },
  ufsbdMtDents: { label: 'UFSBD — Fiche conseil « L’examen bucco-dentaire de prévention M’T dents ! »', url: 'https://www.ufsbd.fr/wp-content/uploads/2021/11/Fiche-conseils-au-patient-RENDEZ-VOUS-PREVENTION-MT-DENTS.pdf', consulted_on: C, published: '2021-09' },
  santeMtDents: { label: 'Santé.fr — Examens et soins bucco-dentaires gratuits pour les jeunes (M’T Dents)', url: 'https://www.sante.fr/node/1247628', consulted_on: C, published: '2025-09-23' },
  guideDiversif: { label: '1000-premiers-jours.fr — Le petit guide de la diversification alimentaire « Pas à pas, votre enfant mange comme un grand » (brochure)', url: 'https://www.1000-premiers-jours.fr/sites/default/files/2021-09/Brochure%20diversification%20alimentaire.pdf', consulted_on: C },
  // Croissance et puberté
  mpediaCourbes: { label: `${MP} — À quoi servent les courbes de croissance : poids, taille et périmètre crânien`, url: 'https://www.mpedia.fr/art-les-courbes-croissance/', consulted_on: C, published: '2022-02-07' },
  mpediaRetards: { label: `${MP} — Les retards de croissance chez l’enfant de six à onze ans`, url: 'https://www.mpedia.fr/art-les-retards-croissance/', consulted_on: C, published: '2021-06-23' },
  santeRetard: { label: 'Santé.fr — Retard de croissance chez l’enfant', url: 'https://www.sante.fr/retard-de-croissance-chez-lenfant', consulted_on: C, published: '2023-08-07' },
  ameliSurpoids: { label: 'ameli.fr — Détecter le surpoids de l’enfant et de l’adolescent(e) et connaître les complications', url: 'https://www.ameli.fr/assure/sante/themes/surpoids-obesite-enfant-adolescent/detecter-surpoids-connaitre-complications', consulted_on: C, published: '2025-12-02' },
  ameliPuberte: { label: 'ameli.fr — Puberté précoce et puberté tardive', url: 'https://www.ameli.fr/assure/sante/themes/puberte/puberte-precoce-tardive', consulted_on: C },
  mpediaPuberte: { label: `${MP} — Démarrage de la puberté : premiers signes et puberté précoce`, url: 'https://www.mpedia.fr/art-demarrage-puberte/', consulted_on: C, published: '2020-10-21' },
  // Prénom et nom
  spPrenom: { label: 'Service-Public.fr — Choix du prénom de l’enfant', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F882', consulted_on: C, published: '2026-03-20' },
  spChangementPrenom: { label: 'Service-Public.fr — Changement de prénom', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F885', consulted_on: C, published: '2026-10-09' },
  spNomUsage: { label: 'Service-Public.fr — Nom d’usage d’un enfant mineur : utilisation du nom des parents', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F36441', consulted_on: C, published: '2025-08-07' },
  // Biberon et laits
  ameliBiberon: { label: 'ameli.fr — Bien préparer un biberon', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/preparer-biberon', consulted_on: C, published: '2024-11-12' },
  ansesBiberon: { label: 'Anses — Biberon : comment le préparer et le conserver ?', url: 'https://www.anses.fr/fr/content/biberon-comment-le-preparer-et-le-conserver', consulted_on: C, published: '2013-01-17' },
  spfAllaitement: { label: 'Santé publique France — Le guide de l’allaitement maternel (édition 2023, diffusé par l’ARS Provence-Alpes-Côte d’Azur)', url: 'https://www.paca.ars.sante.fr/system/files/2023-04/GuideAllaitement.pdf', consulted_on: C, published: '2023-01' },
  santeLait: { label: 'Santé.fr (contenu mpedia / AFPA) — Quel lait infantile choisir ?', url: 'https://www.sante.fr/quel-lait-infantile-choisir', consulted_on: C, published: '2026-07-24' },
  santePremiersBib: { label: 'Santé.fr (contenu mpedia / AFPA) — Premiers biberons à la maternité : mode d’emploi', url: 'https://www.sante.fr/premiers-biberons-la-maternite-mode-demploi', consulted_on: C, published: '2022-02-10' },
  santeColiques: { label: 'Santé.fr (contenu mpedia / AFPA) — Coliques et pleurs du nourrisson, comment les décoder ?', url: 'https://www.sante.fr/coliques-et-pleurs-du-nourrisson-comment-les-decoder', consulted_on: C, published: '2022-04-27' },
  // Poids, grossesse, post-partum
  ameliRetourMaison: { label: 'ameli.fr — Après l’accouchement : le retour à la maison', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-domicile', consulted_on: C, published: '2026-08-27' },
  ameliMaternite: { label: 'ameli.fr — Suivi de la mère à la maternité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-mere-apres-accouchement', consulted_on: C, published: '2026-03-12' },
  mpediaAllaitAlim: { label: `${MP} — Que boire et manger quand on allaite ?`, url: 'https://www.mpedia.fr/art-allaitement-et-alimentation/', consulted_on: C, published: '2019-09-13' },
  ameliNausees: { label: 'ameli.fr — Nausées et vomissements chez la femme enceinte : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-nausees-et-vomissements/nauses-vomissements-grossesse-consultation-traitement', consulted_on: C },
  cngofHg: { label: 'CNGOF — Nausées et vomissements gravidiques : recommandations pour la pratique clinique (consensus formalisé d’experts, 2022)', url: 'https://cngof.fr/app/uploads/2025/11/Nausees-et-vomissements-gravidiques202022-CFE.pdf', consulted_on: C, published: '2022-09-21' },
  // Sexualité
  qsApresBebe: { label: 'QuestionSexualité (Santé publique France) — La sexualité après l’arrivée d’un enfant', url: 'https://www.questionsexualite.fr/connaitre-son-corps-et-sa-sexualite/la-sexualite-au-cours-de-la-vie/la-sexualite-apres-l-arrivee-d-un-enfant', consulted_on: C },
  qsDyspareunie: { label: 'QuestionSexualité (Santé publique France) — Dyspareunies : douleurs pendant les rapports sexuels', url: 'https://www.questionsexualite.fr/s-informer-sur-les-infections-et-les-maladies/les-troubles-de-la-sexualite/dyspareunies-douleurs-pendant-les-rapports-sexuels', consulted_on: C },
  ameliContraception: { label: 'ameli.fr — Quelle contraception après un accouchement ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-et-nouveau-ne/contraception-apres-un-accouchement', consulted_on: C },
  hasReeducation: { label: 'HAS (ANAES) — Rééducation dans le cadre du post-partum, recommandations (décembre 2002)', url: 'https://www.has-sante.fr/upload/docs/application/pdf/post_partum_rap.pdf', consulted_on: C, published: '2002-12' },
  // Second parent, entourage
  santePnp: { label: 'Santé.fr (contenu 1000 premiers jours / Santé publique France) — Les séances de préparation à la naissance et à la parentalité', url: 'https://www.sante.fr/les-seances-de-preparation-la-naissance-et-la-parentalite', consulted_on: C, published: '2022-10-21' },
  mpediaPapa: { label: `${MP} — Place du papa à la naissance`, url: 'https://www.mpedia.fr/art-place-du-papa/', consulted_on: C, published: '2019-11-15' },
  mpjSoutienAllaitement: { label: '1000-premiers-jours.fr (Santé publique France) — Le soutien à l’allaitement (transcription vidéo)', url: 'https://admin.1000-premiers-jours.fr/fr/transcription/le-soutien-lallaitement', consulted_on: C, published: '2021-11-03' },
  santeVieFamille: { label: 'Santé.fr (contenu 1000 premiers jours / Santé publique France) — La vie de famille après la naissance', url: 'https://www.sante.fr/la-vie-de-famille-apres-la-naissance', consulted_on: C, published: '2024-08-26' },
  cafAad: { label: 'caf.fr — Parents : tout savoir sur l’aide et l’accompagnement à domicile !', url: 'https://www.caf.fr/allocataires/actualites/actualites-nationales/parents-tout-savoir-sur-l-aide-et-l-accompagnement-domicile', consulted_on: C, published: '2026-10-05' },
  // Santé mentale
  ameliToc: { label: 'ameli.fr (espace sage-femme) — Troubles anxieux et TOC durant la grossesse', url: 'https://www.ameli.fr/sage-femme/sante-et-prevention/sante-mentale-et-maternite/troubles-anxieux-et-toc-durant-la-grossesse', consulted_on: C },
  psycomParents: { label: 'Psycom — La santé mentale des parents', url: 'https://www.psycom.org/sinformer/la-sante-mentale/la-sante-mentale-des-parents/', consulted_on: C, published: '2026-08-04' },
  psycomBrochure: { label: 'Psycom — Brochure « Santé mentale, grossesse et parentalité »', url: 'https://www.psycom.org/wp-content/uploads/2024/04/PSYCOM_Brochures-A5_SM_Grossesse_2025_WEB.pdf', consulted_on: C, published: '2025-03' },
  psycomToc: { label: 'Psycom — Le TOC et les troubles apparentés', url: 'https://www.psycom.org/sinformer/la-sante-mentale/les-troubles-psy/le-toc-et-les-troubles-apparentes/', consulted_on: C, published: '2026-07-06' },
} satisfies Record<string, ArticleSource>;

const FIN = '_Cet article vous informe ; il ne remplace pas l’avis d’un professionnel de santé (médecin, sage-femme, chirurgien-dentiste, pédiatre, psychologue) ni, pour les démarches, celui de votre mairie ou d’un juriste._';
const URG = 'En cas d’urgence vitale, appelez le **15** (Samu) ou le **112**.';
const ENF = 'Si vous pensez qu’un enfant est en danger, appelez le **119** (Allô Enfance en danger), gratuit, jour et nuit.';
const PSY = 'Si vous vous sentez à bout ou envahi(e) par des idées noires, appelez le **3114** (numéro national de prévention du suicide), gratuit, jour et nuit.';

const a = (x: Omit<LibArticle, 'status' | 'journeys'> & { journeys?: LibArticle['journeys'] }): LibArticle => ({
  journeys: ['child'], status: 'to_review', ...x,
});

export const GUIDE_B35: LibArticle[] = [
  // ------------------------------------------------------------ dents
  a({
    slug: 'premiere-visite-chez-le-dentiste-enfant-age-preparer',
    title: 'La première visite chez le dentiste : à quel âge et comment la préparer ?',
    summary: 'Pourquoi ne pas attendre l’école ou une douleur, ce qui se passe pendant ce premier rendez-vous et comment aider votre enfant à le vivre sereinement.',
    category: 'sante-enfant', tags: ['dentiste', 'premier rendez-vous dentiste', 'dentiste bébé', 'dentiste enfant', 'peur du dentiste', 'dents de lait', 'contrôle dentaire', 'carie'],
    min_age_months: 6, max_age_months: 72, journeys: ['newborn', 'child'],
    sources: [S.ufsbdPremiere, S.ameliDentsLait, S.mpediaBrossage],
    body_md: `## En bref
- L’Assurance maladie situe la **première visite entre 6 et 12 mois** ; l’UFSBD conseille qu’elle ait lieu dans les six mois qui suivent la première dent, et au plus tard avant le premier anniversaire.
- Il n’est pas utile d’attendre l’entrée à l’école ni une douleur : ce rendez-vous sert d’abord à **prévenir**.
- Le dentiste repère les enfants plus exposés aux caries, donne des conseils aux parents et commence à créer une relation de confiance.
- Votre attitude compte : parlez-en positivement et ne présentez jamais le dentiste comme une punition.

## Comprendre
Les dents de lait ont un rôle important : elles permettent de croquer et de mastiquer, de bien prononcer, et elles guident les dents définitives vers leur place. Leur émail est plus fin que celui des dents définitives, donc plus vulnérable aux caries. Une carie précoce peut faire mal et gêner le sommeil, l’alimentation ou la parole, rappelle l’Assurance maladie.

C’est pour cela que la première visite est conseillée tôt. Selon l’Assurance maladie, elle permet de repérer les enfants fragiles, de mettre en place une prévention adaptée et d’instaurer une relation de confiance. Le praticien en profite pour conseiller les parents.

D’après la fiche de l’UFSBD, pendant ce rendez-vous le dentiste :
- regarde s’il existe une blessure, une carie ou un autre problème ;
- évalue si votre enfant est particulièrement exposé au risque de carie ;
- nettoie les dents et explique les gestes d’hygiène ;
- aborde la dentition et les habitudes comme la tétine ou le pouce ;
- décide des soins éventuels et de la date de la prochaine visite.

Ensuite, en l’absence de risque particulier, les pédiatres de mpedia indiquent qu’un contrôle annuel suffit à partir de 3 ans. En cas de risque carieux familial ou personnel, le dentiste peut proposer des visites plus rapprochées.

## Au quotidien
**Avant le rendez-vous**
- Choisissez si possible un rendez-vous **le matin**, moment où beaucoup d’enfants sont plus coopératifs (conseil de l’UFSBD).
- Si vous avez vous-même un rendez-vous, mpedia suggère d’emmener votre enfant pour qu’il découvre le lieu, le fauteuil, les bruits.
- Lisez ensemble un livre sur le dentiste ou jouez « au dentiste » avec une peluche : compter les dents, ouvrir grand la bouche.
- Préparez vos questions : brossage, dentifrice, tétine, biberon du soir, chute à venir.

**Pendant la visite**
- Restez calme : les enfants perçoivent les émotions des adultes. Si vous redoutez vous-même le dentiste, gardez cette inquiétude pour vous.
- Laissez le praticien parler directement à votre enfant.
- Si votre enfant refuse d’ouvrir la bouche, ce n’est pas un échec : la première visite sert aussi à se familiariser.

**Après**
- Valorisez ce qu’il a fait (« tu as montré tes dents au dentiste »).
- Notez dans le carnet de santé la date du prochain contrôle.

**Les mots à éviter** : « ça ne fera pas mal », « si tu ne te brosses pas les dents, le dentiste va te piquer ». La visite ne doit jamais servir de menace.

## Questions fréquentes
**Mon bébé n’a que deux dents, est-ce vraiment utile ?**
Oui : l’Assurance maladie situe la première visite entre 6 et 12 mois, justement pour prévenir avant que les problèmes apparaissent et conseiller les parents sur l’hygiène et l’alimentation.

**Faut-il un dentiste spécialisé pour enfants ?**
Votre dentiste habituel peut recevoir votre enfant. Certains praticiens se consacrent davantage aux enfants ; demandez conseil à votre dentiste ou à votre médecin si votre enfant a des besoins particuliers.

**La visite est-elle prise en charge ?**
Les consultations chez le chirurgien-dentiste sont remboursées par l’Assurance maladie, et à partir de 3 ans le dispositif M’T dents permet un examen de prévention chaque année sans avance de frais.

**Mon enfant a très peur. Que faire ?**
Parlez-en au dentiste à la prise de rendez-vous. Plusieurs courtes visites de familiarisation peuvent aider. Évitez de minimiser sa peur : nommez-la et rassurez-le.

## Quand demander conseil
Consultez rapidement un chirurgien-dentiste si vous voyez une dent qui noircit ou se creuse, si votre enfant a mal en mangeant, s’il dort mal à cause d’une douleur, après un choc sur une dent, ou si la succion du pouce ou de la tétine persiste après 4 ans. Un gonflement de la joue avec fièvre demande un avis médical sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'mt-dents-examen-bucco-dentaire-gratuit-enfant-chaque-annee',
    title: 'M’T dents : l’examen bucco-dentaire offert à votre enfant chaque année',
    summary: 'De 3 à 24 ans, un rendez-vous de prévention chez le dentiste est pris en charge chaque année, sans avance de frais, ainsi que les soins réalisés dans les 6 mois qui suivent.',
    category: 'droits-demarches', tags: ['M’T dents', 'mt dents', 'examen bucco-dentaire', 'dentiste gratuit', 'prévention dentaire', 'carte Vitale', 'invitation ameli', 'soins dentaires enfant'],
    min_age_months: 36, max_age_months: 216, journeys: ['child'],
    sources: [S.santeMtDents, S.ufsbdMtDents, S.ameliDentsLait],
    body_md: `## En bref
- Le dispositif **M’T dents** s’adresse aux enfants et jeunes de **3 à 24 ans**, qui y ont droit **chaque année** (Santé.fr, page publiée en septembre 2025).
- L’examen est pris en charge par l’Assurance maladie et la complémentaire santé, **sans avance de frais**.
- Les **soins réalisés dans les 6 mois** qui suivent l’examen bénéficient aussi de la dispense d’avance de frais, sauf certaines exceptions (prothèses, orthodontie, inlay-onlays).
- L’invitation n’est pas obligatoire : il suffit de préciser « M’T dents » en prenant rendez-vous.

## Comprendre
Pendant longtemps, M’T dents proposait un examen tous les trois ans (3, 6, 9, 12 ans…), comme l’indiquent encore certaines fiches plus anciennes. Selon la page de Santé.fr publiée le 23 septembre 2025, le dispositif s’adresse désormais aux 3–24 ans **chaque année**. Il concerne tous les mineurs et jeunes majeurs rattachés à l’Assurance maladie, quelle que soit leur nationalité, au régime général comme au régime agricole.

**Ce que comprend l’examen** (Santé.fr) :
- le repérage des facteurs de risque : grignotage, sucres ou aliments acides, brossage insuffisant, succion du pouce, tabac ;
- l’examen des dents et des gencives ;
- des conseils sur le brossage (méthode, fréquence, fluor), l’alimentation, la protection des dents pendant le sport, et la vaccination contre les papillomavirus (HPV) ;
- si besoin, un plan de soins. Des radiographies peuvent être réalisées.

**Ce qui n’en fait pas partie** : les traitements orthodontiques et les prothèses. Si le dentiste en propose, il doit vous informer des tarifs et des remboursements.

**La prise en charge** : l’Assurance maladie règle 60 % et la complémentaire 40 %. Sans complémentaire, l’Assurance maladie prend en charge la totalité.

## Au quotidien
**Comment faire**
1. Prenez rendez-vous chez un chirurgien-dentiste (habituel ou proche de chez vous) en précisant « M’T dents tous les ans ».
2. Apportez la carte Vitale de l’enfant ou celle du parent qui l’a rattaché, et votre carte de mutuelle.
3. Apportez le **carnet de santé** pour que le dentiste le complète.

**L’invitation** : elle est envoyée aux parents jusqu’aux 17 ans, puis directement au jeune. Elle arrive par courrier à 3, 6, 12 et 18 ans, et par e-mail les autres années ; un compte ameli est nécessaire pour la recevoir.

**Ce qui est surveillé selon l’âge** (fiche UFSBD) :
- **3 ans** : la mise en place des dents de lait, l’hygiène et l’alimentation ;
- **6 ans** : l’arrivée des premières molaires définitives, qui peuvent bénéficier d’un scellement des sillons ;
- **9 ans** : l’éruption des incisives et la surveillance orthodontique ;
- **12 ans** : les deuxièmes molaires définitives et la fin de la denture de lait ;
- **15 ans et plus** : orthodontie éventuelle, tabac, piercings, dents de sagesse.

**Une astuce** : notez le mois anniversaire de votre enfant comme rappel annuel, même si vous ne recevez pas l’invitation.

## Questions fréquentes
**L’examen est-il obligatoire ?**
Le Code de la santé publique prévoit des examens bucco-dentaires de prévention ; l’UFSBD rappelle que les examens à 6 et 12 ans figurent parmi les examens obligatoires, avec une page dédiée dans le carnet de santé. Profiter de l’examen chaque année reste le plus simple.

**Et si mon enfant a une carie ?**
Les soins réalisés dans les 6 mois suivant l’examen sont dispensés d’avance de frais, à l’exception des inlay-onlays, des prothèses et des traitements d’orthopédie dento-faciale.

**J’ai perdu l’invitation.**
Elle n’est pas indispensable : présentez simplement la carte Vitale et la carte de mutuelle en précisant le dispositif.

**L’orthodontie est-elle couverte ?**
Non, pas dans le cadre de M’T dents. Interrogez votre dentiste et votre complémentaire sur les conditions de prise en charge.

## Quand demander conseil
N’attendez pas l’examen annuel si votre enfant a mal, si une dent change de couleur, après un choc dentaire ou en cas de gonflement de la joue : consultez un dentiste rapidement. Pour vos droits, votre caisse d’Assurance maladie ou votre compte ameli peuvent vous renseigner. ${URG}

${FIN}`,
  }),
  a({
    slug: 'dentifrice-fluor-quel-dentifrice-selon-age-enfant',
    title: 'Dentifrice et fluor : lequel choisir selon l’âge de votre enfant ?',
    summary: 'Le fluor protège l’émail, mais en excès il peut tacher les dents : les repères officiels de concentration et de quantité de dentifrice, du premier sourire à l’école.',
    category: 'sante-enfant', tags: ['dentifrice enfant', 'fluor', 'ppm', 'fluorose', 'quantité dentifrice', 'brossage bébé', 'brosse à dents enfant', 'petit pois'],
    min_age_months: 6, max_age_months: 144, journeys: ['newborn', 'child'],
    sources: [S.ameliDentsLait, S.ameliBrosser, S.mpediaBrossage],
    body_md: `## En bref
- Le fluor renforce l’émail et limite les caries ; en excès pendant la formation des dents, il peut provoquer des **taches blanches** (fluorose).
- L’Assurance maladie recommande une concentration **adaptée à l’âge** : ≤ 500 ppm avant 3 ans, 500 ppm dès 3 ans, 1 000 à 1 500 ppm dès 6 ans.
- La **quantité** compte aussi : une **trace** de dentifrice dès les premières dents, puis la **taille d’un petit pois** à partir des premières molaires (vers 12–18 mois).
- Votre dentiste peut adapter ces repères au risque carieux de votre enfant.

## Comprendre
Les jeunes enfants ne savent pas encore cracher : ils avalent une partie du dentifrice. C’est pour cela que la teneur en fluor doit être adaptée à l’âge, explique l’Assurance maladie. Un excès pendant la minéralisation des dents peut laisser des taches blanches sur l’émail.

**Les repères de l’Assurance maladie** (page « L’importance des dents de lait ») :
- **jusqu’à 3 ans** : dentifrice dont la teneur en fluor est inférieure ou égale à 500 ppm ;
- **dès 3 ans** : 500 ppm ;
- **dès 6 ans** : 1 000 à 1 500 ppm.

La concentration figure sur le tube, en **ppm** (parties par million) de fluor. Lisez aussi l’âge indiqué sur l’emballage.

**Des repères qui peuvent varier.** Les pédiatres de mpedia citent les recommandations de l’UFSBD, qui proposent des concentrations différentes selon que le risque carieux est faible ou élevé. C’est le dentiste ou le médecin qui évalue ce risque : si vous recevez des conseils différents, suivez ceux du professionnel qui connaît votre enfant.

## Au quotidien
**Dès la première dent (vers 6 mois)**
- Nettoyez les dents chaque soir avant le coucher avec une compresse humide ou une brosse imprégnée d’une **trace** de dentifrice fluoré adapté à l’âge (Assurance maladie).
- Avant 1 an, une compresse enroulée autour du doigt ou un doigtier en silicone peut suffire (mpedia).

**Dès les premières molaires (12–18 mois)**
- Au moins un brossage par jour, avec une quantité de dentifrice de la **taille d’un petit pois**.
- Brosse à petite tête et poils souples, à changer dès que les poils s’écartent, et au moins tous les trois mois.
- Mpedia conseille de passer à deux brossages par jour après 2 ans : le matin après le petit déjeuner et le soir avant le coucher, sans rien manger ensuite.

**Qui brosse ?**
- **De 0 à 3 ans** : un adulte.
- **De 3 à 6 ans** : l’adulte brosse ou aide l’enfant, selon ses capacités.
- Après, gardez un œil sur le brossage du soir, en particulier sur la **première molaire définitive** qui pousse vers 6 ans tout au fond, derrière les dents de lait.

**Rendre le moment agréable**
- Un sablier de deux minutes, une chanson, un brossage « en miroir » avec vous.
- Les goûts fruités sont souvent mieux acceptés que le menthol (mpedia).
- La formule « du rose vers le blanc » aide les enfants à brosser de la gencive vers la dent (ameli).

**Bien choisir et ranger**
- Vérifiez l’âge et la teneur en fluor indiqués sur le tube.
- Rangez le dentifrice hors de portée : un tube n’est pas un jouet ni une friandise.
- Chaque brosse est personnelle et sèche à l’air libre.

## Questions fréquentes
**Mon enfant avale tout le dentifrice. Est-ce grave ?**
C’est justement pour cela que les quantités sont très petites chez le jeune enfant. Respectez la trace ou le petit pois, et rangez le tube hors de portée. En cas d’ingestion d’une grande quantité, appelez un centre antipoison ou le 15.

**Faut-il un dentifrice sans fluor ?**
L’Assurance maladie recommande un dentifrice fluoré, en adaptant la concentration à l’âge. Parlez-en au dentiste si vous hésitez.

**Les comprimés ou gouttes de fluor sont-ils utiles ?**
Ils ne se donnent que sur avis d’un professionnel, après évaluation de l’ensemble des apports en fluor. Ne les ajoutez jamais de votre propre initiative.

**Dois-je rincer après le brossage ?**
Demandez au dentiste : il vous indiquera la pratique adaptée à l’âge de votre enfant.

## Quand demander conseil
Consultez le dentiste si vous voyez des taches blanches ou brunes, une dent qui noircit, des gencives qui saignent souvent, ou si le brossage est impossible depuis plusieurs semaines. En cas d’ingestion importante de dentifrice ou d’un produit d’hygiène, appelez un centre antipoison. ${URG}

${FIN}`,
  }),
  a({
    slug: 'caries-precoces-biberon-du-soir-boissons-sucrees-prevenir',
    title: 'Caries précoces : biberon du soir, boissons sucrées et habitudes qui protègent',
    summary: 'La « carie du biberon » peut détruire très vite les dents de lait : comprendre le mécanisme et adopter des gestes simples, du coucher au goûter.',
    category: 'sante-bebe', tags: ['carie du biberon', 'caries précoces', 'biberon du soir', 'jus de fruits', 'boissons sucrées', 'dents de lait noires', 'tétine', 'grignotage'],
    min_age_months: 0, max_age_months: 72, journeys: ['newborn', 'child'],
    sources: [S.ameliDentsLait, S.ufsbdPremiere, S.guideDiversif],
    body_md: `## En bref
- Les caries se développent quand les dents restent en contact avec des liquides sucrés, y compris le **lait** (et le lait maternel), rappelle l’Assurance maladie.
- Le **biberon au coucher** est la situation la plus à risque : la nuit, la salive ne nettoie plus les dents.
- L’**eau** est la boisson à privilégier en dehors des repas ; évitez que votre enfant se promène avec un biberon ou un gobelet de boisson sucrée.
- Un **brossage le soir**, après le dernier repas, protège les dents dès la première.

## Comprendre
L’émail des dents de lait est plus fin que celui des dents définitives, donc plus fragile. Les bactéries de la bouche transforment les sucres en acides qui attaquent l’émail. Plus le contact est long et fréquent, plus le risque augmente.

L’Assurance maladie décrit la « **carie du biberon** » : quand l’enfant s’endort avec un biberon, la boisson reste dans la bouche pendant le sommeil, la salive ne joue plus son rôle de nettoyage et les dents se détériorent très vite. L’UFSBD précise qu’elle touche surtout les **incisives du haut**.

Les conséquences ne sont pas anodines : douleurs, difficultés à dormir, à manger ou à parler si la dent est détruite. Les enfants qui ont des caries très jeunes risquent davantage d’en avoir sur leurs dents définitives.

Les bactéries se transmettent aussi par la salive : l’Assurance maladie conseille de ne pas partager la cuillère ou la tétine de l’enfant.

## Au quotidien
**Au coucher**
- Ne donnez pas de biberon de lait, de jus ou de soda au lit (Assurance maladie). La brochure de 1000 premiers jours déconseille de laisser l’enfant dans son lit avec un biberon, car il peut s’habituer à avoir besoin de nourriture pour s’endormir.
- Placez le dernier biberon avant le brossage et le rituel du soir, pas pendant l’endormissement.
- Si votre enfant a besoin de succion pour s’endormir, parlez-en au médecin ou à la PMI pour trouver une alternative adaptée à son âge.

**Dans la journée**
- Proposez de l’**eau** comme boisson.
- Évitez qu’il se promène avec un biberon de lait ou un gobelet à bec contenant une boisson sucrée.
- Réservez les jus de fruits et les sodas à des occasions, plutôt qu’en boisson courante.
- Gardez des repas et un goûter à heures régulières, plutôt que du grignotage en continu.
- Ne trempez pas la tétine dans du sucre, du miel ou du sirop.

**Le brossage**
- Dès la première dent, nettoyez-la chaque soir avec une compresse ou une brosse et une trace de dentifrice fluoré adapté à l’âge.
- Brossez le soir après le dernier repas : rien à manger ni à boire de sucré ensuite.

**La tétine et le pouce**
L’Assurance maladie conseille d’arrêter l’habitude idéalement vers 2 ans, sans la prolonger au-delà de 4 ans, et de préférer les tétines de forme physiologique.

## Questions fréquentes
**Le lait maternel peut-il provoquer des caries ?**
L’Assurance maladie cite le lait, y compris maternel, parmi les liquides qui favorisent les caries quand ils restent au contact des dents. L’allaitement reste recommandé ; l’important est le nettoyage des dents dès leur apparition. Parlez-en à la sage-femme ou au dentiste si vous allaitez la nuit.

**Les jus « sans sucres ajoutés » sont-ils sans effet sur les dents ?**
Non : les jus de fruits contiennent naturellement des sucres et sont acides. L’eau reste la boisson de référence.

**Comment reconnaître une carie ?**
Une tache blanche ou brune, une dent qui noircit, se creuse ou se casse, une douleur au chaud, au froid ou au sucré. Consultez un dentiste rapidement.

**Mon enfant refuse de s’endormir sans biberon. Comment faire ?**
Avancez progressivement le biberon avant le brossage, puis remplacez le biberon du lit par un doudou, une berceuse ou votre présence. La puéricultrice de PMI peut vous accompagner.

## Quand demander conseil
Consultez rapidement un dentiste si une dent noircit, se creuse ou tombe en morceaux, ou si votre enfant a mal, dort mal ou refuse de manger. Une carie suspectée demande des soins sans tarder, rappelle l’Assurance maladie. En cas de joue gonflée avec fièvre, demandez un avis médical rapidement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'chute-des-dents-de-lait-arrivee-dents-definitives',
    title: 'Chute des dents de lait et arrivée des dents définitives : ce qui se passe',
    summary: 'Entre 5–6 ans et environ 12 ans, la bouche de votre enfant change : la première molaire définitive, les dents qui bougent et les bons réflexes.',
    category: 'sante-enfant', tags: ['dent qui bouge', 'chute dents de lait', 'dents définitives', 'molaire 6 ans', 'petite souris', 'molaire définitive', 'dentition', 'orthodontie'],
    min_age_months: 48, max_age_months: 156, journeys: ['child'],
    sources: [S.ameliPoussee, S.ameliDentsLait, S.ameliTrauma],
    body_md: `## En bref
- Les **20 dents de lait** ont une durée de vie limitée, **entre 6 et 13 ans** selon les dents (Assurance maladie).
- Les **premières dents définitives** sortent vers **5–6 ans**, les dernières vers **12 ans** environ ; les dents de sagesse, inconstantes, arrivent vers 18–20 ans.
- La **première molaire définitive** pousse vers 6 ans tout au fond, **sans qu’aucune dent ne tombe** : elle passe souvent inaperçue alors qu’elle est fragile.
- Les dents de lait doivent être soignées jusqu’au bout : elles guident les dents définitives.

## Comprendre
Selon l’Assurance maladie, les dents de lait se forment pendant la grossesse ; à 3 ans, la plupart des enfants les ont toutes. Vers 4–5 ans, des espaces peuvent apparaître entre les incisives de lait : ils accompagnent la croissance de la mâchoire et laisseront la place aux dents définitives, plus volumineuses.

Les dents de lait ne sont pas de simples dents « provisoires ». Elles définissent le visage, permettent de mastiquer et de parler sans trouble de l’articulation, et **guident les dents définitives** vers leur bonne position. Une dent de lait cariée ou perdue trop tôt mérite donc l’avis d’un dentiste.

**La molaire de 6 ans.** Elle s’ajoute derrière les molaires de lait. Comme aucune dent ne tombe à ce moment-là, beaucoup de parents ne la remarquent pas. L’Assurance maladie la décrit comme très importante mais fragile et souvent vite cariée : d’où l’intérêt de la brosser dès son apparition. Lors des examens de prévention, le dentiste peut vous proposer des soins pour la protéger.

Le rythme varie beaucoup d’un enfant à l’autre : un enfant peut perdre ses premières dents plus tôt ou plus tard que ses camarades.

## Au quotidien
**Quand une dent bouge**
- Laissez-la tomber d’elle-même ; évitez de l’arracher de force.
- Quand elle tombe, un petit saignement peut survenir. En cas de saignement de la bouche après un choc, l’Assurance maladie conseille de faire mordre une compresse propre pliée.
- La « petite souris » peut accompagner ce moment : beaucoup d’enfants sont fiers de cette étape.

**Le brossage pendant cette période**
- Continuez d’aider ou de vérifier le brossage du soir, même si votre enfant se brosse seul.
- Insistez tout au fond sur la molaire de 6 ans, avec une brosse à petite tête.
- Dès 6 ans, l’Assurance maladie conseille un dentifrice dosé de 1 000 à 1 500 ppm de fluor.

**L’alimentation**
- Les zones où une dent manque peuvent rendre la mastication moins confortable : proposez des aliments faciles à croquer en morceaux.
- Limitez le grignotage et les boissons sucrées, qui exposent les nouvelles dents aux caries.

**Les rendez-vous**
- L’examen M’T dents annuel permet de suivre la poussée, de repérer un mauvais positionnement et de discuter d’un éventuel avis orthodontique.

## Questions fréquentes
**Une dent définitive pousse derrière la dent de lait qui n’est pas tombée. Que faire ?**
Parlez-en au dentiste : il vérifiera si la dent de lait doit être retirée ou si la situation va se régler d’elle-même.

**Mon enfant a 7 ans et n’a perdu aucune dent. Faut-il s’inquiéter ?**
Les âges varient beaucoup. Demandez l’avis du dentiste lors du contrôle annuel ; il pourra examiner la bouche et, si besoin, proposer une radiographie.

**Une dent définitive est tombée après une chute. Que faire ?**
C’est une urgence. Selon l’Assurance maladie, tenez la dent uniquement par la couronne (la partie visible), jamais par la racine, rincez-la très légèrement à l’eau si elle est sale sans la frotter, conservez-la dans du lait ou du sérum physiologique (jamais à sec ni dans la glace) et consultez un chirurgien-dentiste le plus vite possible : les meilleurs résultats sont obtenus dans les 20 minutes.

**Et si c’est une dent de lait qui tombe après un choc ?**
L’Assurance maladie précise qu’il ne faut pas la remettre en place, car le germe de la dent définitive pourrait s’infecter. Consultez quand même le dentiste.

## Quand demander conseil
Consultez un dentiste en cas de douleur, de dent qui noircit, de gonflement de la gencive ou de la joue, de dent définitive qui pousse de travers, ou si la succion du pouce persiste après 4 ans. Après un choc, consultez un dentiste en urgence si une dent est tombée, cassée ou déplacée. Appelez les secours si le choc a touché violemment la tête, en cas de perte de connaissance ou de vomissements. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ croissance
  a({
    slug: 'lire-courbes-de-croissance-carnet-de-sante',
    title: 'Lire les courbes de croissance du carnet de santé',
    summary: 'Poids, taille, périmètre crânien, IMC : comment se lisent les courbes du carnet de santé, ce que signifie un « couloir » et pourquoi c’est l’évolution qui compte.',
    category: 'developpement', tags: ['courbe de croissance', 'carnet de santé', 'couloir', 'percentile', 'écart-type', 'périmètre crânien', 'IMC enfant', 'courbe de poids'],
    min_age_months: 0, max_age_months: 216, journeys: ['newborn', 'child'],
    sources: [S.mpediaCourbes, S.santeRetard, S.ameliSurpoids],
    body_md: `## En bref
- Le carnet de santé contient des courbes de **poids**, de **taille**, de **périmètre crânien** et d’**IMC**, différentes pour les filles et les garçons.
- Chaque mesure est un point ; reliés entre eux, ces points dessinent la **trajectoire** de votre enfant.
- Un enfant suit en général son propre **« couloir »** : c’est la régularité de la courbe qui compte, plus qu’un chiffre isolé.
- Une **cassure**, une accélération inhabituelle ou un changement de couloir doivent être signalés au médecin.

## Comprendre
**Ce qui est mesuré.** Selon Santé.fr, le médecin mesure le périmètre crânien chez le nourrisson, la taille et le poids, puis calcule l’IMC (indice de masse corporelle). Les valeurs sont reportées sur les courbes du carnet de santé et comparées aux références françaises. Il est conseillé de mesurer l’enfant tous les 3 mois la première année, au moins tous les 6 mois de 1 à 4 ans, puis au moins une fois par an jusqu’à la puberté.

**Les lignes du graphique.** Les courbes de référence dessinent une zone de valeurs habituelles. Les pédiatres de mpedia expliquent que l’enfant évolue normalement dans son couloir de départ, entre +2 et −2 écarts-types pour la taille. Pour l’IMC, les références françaises sont exprimées en **centiles** : sous le 3e centile, on parle d’insuffisance pondérale ; au-delà du 97e, de surpoids.

**Une courbe, pas une note.** Être « en bas » ou « en haut » de la zone n’est pas un problème en soi si la courbe reste régulière. Pour le périmètre crânien, mpedia souligne que la régularité compte davantage que la valeur absolue. Pour la taille, le médecin tient compte de la **taille cible**, estimée à partir de la taille des deux parents.

**L’IMC évolue avec l’âge.** Contrairement à l’adulte, l’IMC de l’enfant n’a pas de seuil fixe : il augmente la première année, diminue entre 1 et 6 ans, puis remonte. Ce point de remontée s’appelle le **rebond d’adiposité** ; l’Assurance maladie précise qu’il se situe normalement vers six ans et qu’un rebond avant cinq ans augmente le risque de surpoids.

## Au quotidien
**Pour bien suivre la courbe**
- Apportez le carnet de santé à chaque consultation, y compris chez un remplaçant.
- Demandez au médecin de vous montrer la courbe : « Où se situe-t-il ? Sa courbe est-elle régulière ? »
- Les courbes sont aussi disponibles dans le carnet de santé numérique de **Mon espace santé**, où vous pouvez saisir des mesures.

**Pour mesurer à la maison (si on vous le demande)**
- Toujours dans les mêmes conditions : même balance, enfant déshabillé, à la même heure.
- Pendant le premier mois, mpedia conseille de peser bébé idéalement sur la même balance (sage-femme, PMI) plutôt que sur des balances différentes.
- Évitez de peser trop souvent : un chiffre isolé fluctue.

**Pour lire sans s’inquiéter**
- Repérez le couloir dans lequel la courbe évolue depuis plusieurs mois.
- Comparez la courbe à elle-même, pas à celle d’un frère, d’une cousine ou d’un camarade.
- Un petit écart ponctuel, par exemple après une maladie, peut se rattraper : c’est la tendance sur plusieurs mesures qui compte.

## Questions fréquentes
**Mon enfant est sous la courbe du milieu. Est-il trop petit ?**
La ligne du milieu représente la moyenne, pas une norme à atteindre. Si sa courbe est régulière et dans la zone de référence, le médecin tiendra compte de la taille des parents pour interpréter.

**Pourquoi l’IMC plutôt que le poids ?**
Selon mpedia, la courbe de corpulence est plus sensible que la courbe de poids pour repérer tôt une dérive vers la maigreur ou le surpoids, car elle rapporte le poids à la taille.

**Les courbes sont-elles les mêmes pour un bébé allaité ?**
Les pédiatres interprètent la courbe en tenant compte du mode d’alimentation et du contexte. Posez la question à votre médecin si vous avez un doute.

**Faut-il tracer la courbe soi-même ?**
Ce n’est pas indispensable, mais cela aide à comprendre. Le médecin reste le mieux placé pour l’interpréter.

## Quand demander conseil
Parlez-en au médecin si la courbe de taille, de poids ou de périmètre crânien fléchit ou casse, si elle accélère de façon inhabituelle, si elle change de couloir, ou si l’IMC remonte avant 5 ans. Chez le nouveau-né, mpedia conseille de consulter si le poids de naissance n’est pas retrouvé à 10 jours. Une perte de poids rapide, un refus de boire ou un bébé très somnolent demandent un avis médical sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'croissance-2-a-10-ans-taille-poids-imc-reperes',
    title: 'La croissance de 2 à 10 ans : taille, poids et IMC',
    summary: 'Combien grandit un enfant entre 2 ans et la puberté, comment évolue sa corpulence et quels repères aident à suivre une croissance harmonieuse.',
    category: 'developpement', tags: ['croissance enfant', 'taille enfant', 'poids enfant', 'IMC enfant', 'rebond d’adiposité', 'centimètres par an', 'corpulence', 'examen médical'],
    min_age_months: 24, max_age_months: 120, journeys: ['child'],
    sources: [S.santeRetard, S.mpediaRetards, S.ameliSurpoids],
    body_md: `## En bref
- La croissance ralentit après les deux premières années : selon Santé.fr, l’enfant gagne en moyenne un peu plus de 8 cm la troisième année et environ 7 cm la quatrième.
- Avant la puberté, mpedia indique un gain d’environ **5 à 6 cm par an**, avec parfois un léger ralentissement juste avant le pic pubertaire.
- Entre 1 et 6 ans, l’**IMC diminue** : l’enfant paraît de plus en plus mince. Il remonte ensuite, normalement vers 6 ans.
- Les moyennes ne sont que des moyennes : la régularité de la courbe est le meilleur repère.

## Comprendre
**La taille.** Santé.fr rappelle les gains moyens : environ 24 cm la première année, 11 cm la deuxième, un peu plus de 8 cm la troisième, environ 7 cm la quatrième. Pour les enfants de 6 à 11 ans, le Dr Liliane Cret (mpedia) cite environ 5 à 6 cm par an avant la puberté. Un léger ralentissement peut survenir avant le pic pubertaire, vers 9–10 ans chez les filles et vers 12 ans chez les garçons ; il est transitoire et se rattrape.

**La corpulence.** L’IMC se calcule en divisant le poids (en kg) par la taille (en mètres) au carré. Chez l’enfant, il se lit sur les **courbes de corpulence** du carnet de santé, car il change avec l’âge. Il diminue entre 1 et 6 ans, au moment où l’enfant marche, court et dépense davantage, puis remonte : c’est le **rebond d’adiposité**. L’Assurance maladie précise qu’un rebond avant cinq ans augmente le risque de surpoids pendant l’enfance. Elle cite aussi deux signaux qui alertent le médecin : une courbe d’IMC qui monte sans cesse depuis la naissance, et le passage à un couloir supérieur, à tout âge.

**Ce qui influence la croissance.** L’hérédité joue un rôle important : le médecin estime une taille cible à partir de la taille des parents. Le sommeil, l’alimentation, l’activité physique et le bien-être affectif comptent aussi.

**Les examens de suivi.** Le médecin mesure et pèse l’enfant lors des examens de santé prévus dans le carnet ; Santé.fr conseille au moins une mesure tous les 6 mois de 1 à 4 ans, puis au moins une par an jusqu’à la puberté.

## Au quotidien
**Ce qui favorise une croissance harmonieuse**
- Des **repas réguliers** et variés, sans forcer l’enfant à finir son assiette.
- De l’**eau** comme boisson, et peu de boissons sucrées.
- Bouger chaque jour : jeux dehors, marche, vélo, parc, et limiter le temps passé assis devant les écrans.
- Un **sommeil suffisant** et des horaires réguliers.

**Les signes que l’Assurance maladie invite à surveiller**
- Des vêtements qui deviennent vite trop larges ;
- un essoufflement à la course ;
- des moqueries sur l’apparence.

**À l’inverse**, Santé.fr cite comme signes qui peuvent amener à consulter pour une petite taille : des vêtements qui s’usent avant d’être trop petits, une taille qui ne change plus, un enfant souvent pris pour plus jeune.

**Parler du corps sans blesser**
- Évitez les commentaires sur le poids ou la taille devant l’enfant.
- Parlez plutôt de forme, d’énergie, de plaisir à bouger.

## Questions fréquentes
**Mon enfant mange peu mais grandit bien. Faut-il s’inquiéter ?**
Si sa courbe reste régulière, c’est un repère rassurant à discuter avec le médecin. L’appétit varie d’un jour à l’autre chez l’enfant.

**Puis-je calculer l’IMC de mon enfant avec un calculateur pour adultes ?**
Non : l’Assurance maladie précise que les seuils adultes ne s’appliquent pas. Chez l’enfant, c’est la courbe de corpulence selon l’âge et le sexe qui fait référence.

**Mon enfant est plus petit que ses camarades.**
Comparez sa courbe à elle-même et tenez compte de la taille des parents. Le médecin pourra en parler avec vous lors de la prochaine visite.

**Le rebond d’adiposité, c’est grave ?**
C’est une étape normale de la courbe d’IMC. C’est sa **précocité** (avant 5 ans) qui doit amener à en parler au médecin, pour agir tôt sur l’alimentation et l’activité.

## Quand demander conseil
Consultez si la courbe de taille ou de poids change de couloir, si votre enfant grandit nettement moins vite, si l’IMC remonte avant 5 ans, si vous observez un essoufflement important, une fatigue durable, des troubles du sommeil ou des moqueries qui le font souffrir. Une perte de poids inexpliquée demande un avis médical rapide. ${ENF}

${FIN}`,
  }),
  a({
    slug: 'cassure-courbe-croissance-petite-taille-quand-consulter',
    title: 'Cassure de la courbe, petite taille : quand consulter ?',
    summary: 'Une courbe régulièrement basse n’a pas la même signification qu’une courbe qui ralentit : les signes qui doivent amener à consulter et ce que fait le médecin.',
    category: 'sante-enfant', tags: ['cassure de courbe', 'petite taille', 'retard de croissance', 'ne grandit plus', 'hormone de croissance', 'âge osseux', 'taille cible', 'endocrinologue'],
    min_age_months: 0, max_age_months: 192, journeys: ['newborn', 'child'], safety_critical: true,
    sources: [S.santeRetard, S.mpediaRetards, S.mpediaCourbes],
    body_md: `## En bref
- On parle le plus souvent de retard de croissance quand la taille se situe à plus de **2 écarts-types sous la moyenne** pour l’âge et le sexe, ou quand l’enfant gagne **moins de 3,5 cm en 12 mois** (Santé.fr).
- Une courbe **régulièrement basse**, parallèle aux courbes de référence, correspond souvent à une petite taille familiale.
- Une courbe qui **ralentit ou sort de son couloir** (cassure) doit amener à consulter.
- Plus de 70 % des retards de croissance ont une cause constitutionnelle ; d’autres sont liés à une maladie qui se soigne.

## Comprendre
**Deux situations différentes.** Pour une petite taille, le Dr Liliane Cret (mpedia) distingue :
1. la courbe régulièrement basse, qui évolue parallèlement aux courbes de référence : le médecin estime alors la taille cible à partir de la taille des parents, et recherche d’autres éléments (taille à la naissance, prématurité) ;
2. la courbe qui ralentit et sort de son couloir : c’est la **cassure**, qui demande un bilan.

**Les causes possibles.** Santé.fr les classe en trois groupes :
- **constitutionnelles** (plus de 70 % des cas), souvent génétiques, ou chez des enfants nés petits pour leur âge gestationnel ;
- **acquises**, liées à une autre maladie : digestive (maladie cœliaque, maladie de Crohn, allergie aux protéines du lait de vache), hormonale (thyroïde, hormone de croissance), rénale, cardiaque, respiratoire, sanguine, ou psychologique ;
- **idiopathiques**, quand aucune cause n’est retrouvée.

Mpedia ajoute que des événements de vie (deuil, séparation, naissance d’un frère ou d’une sœur) peuvent ralentir transitoirement la croissance.

**Le bilan.** Le médecin examine la morphologie et le stade pubertaire, interroge sur les antécédents familiaux, les symptômes digestifs, respiratoires ou urinaires et l’alimentation. Selon la situation, il peut demander une radiographie de l’**âge osseux**, des analyses de sang et d’urine, ou orienter vers un spécialiste. Un traitement par hormone de croissance n’est envisagé que dans des situations précises, quand un déficit est prouvé et que des critères de taille et de vitesse de croissance sont réunis (Santé.fr).

## Au quotidien
**Rassembler les bonnes informations avant la consultation**
- Le carnet de santé, avec toutes les mesures depuis la naissance.
- Votre taille et celle de l’autre parent, et l’âge de votre propre puberté si vous le connaissez.
- Les maladies chroniques, traitements au long cours, symptômes digestifs (diarrhée, ventre gonflé), fatigue.
- Les changements récents dans la vie de l’enfant.

**Les signes que Santé.fr cite pour consulter**
- Les vêtements s’usent avant d’être trop petits, ou la taille n’a pas changé depuis longtemps.
- L’enfant est plus petit que ses parents, ses frères et sœurs au même âge.
- Il est nettement plus petit que les enfants de son âge, souvent pris pour plus jeune, ou moqué pour sa taille.

**Accompagner votre enfant**
- Valorisez ses qualités et ses réussites, sans faire de la taille un sujet permanent.
- Prenez au sérieux les moqueries : parlez-en à l’enseignant si besoin.

## Questions fréquentes
**Mon enfant est petit comme nous. Faut-il consulter ?**
Si sa courbe est régulière et cohérente avec la taille des parents, le médecin vous le dira lors du suivi habituel. Une cassure, en revanche, justifie un avis même dans une famille de petite taille.

**Le bilan est-il douloureux ?**
Il repose surtout sur l’examen, la courbe et parfois une radiographie de la main et des prises de sang. Le médecin vous expliquera chaque étape.

**Le sport ou l’alimentation peuvent-ils faire grandir davantage ?**
Une alimentation suffisante et équilibrée, un bon sommeil et l’activité physique soutiennent la croissance, mais ne remplacent pas un bilan en cas de cassure.

**Une petite taille peut-elle cacher une maladie ?**
Parfois, oui : c’est l’objet du bilan. Santé.fr rappelle aussi que, sans cause claire, le pédiatre peut temporiser et rassurer.

## Quand demander conseil
Consultez votre médecin si la courbe de taille fléchit ou casse, si votre enfant ne grandit presque plus, s’il perd du poids, s’il a des maux de ventre ou des diarrhées persistants, une grande fatigue, des maux de tête répétés ou des troubles de la vue. Une perte de poids rapide ou un enfant très abattu demandent un avis médical sans attendre. ${URG}

${FIN}`,
  }),
  a({
    slug: 'puberte-precoce-signes-qui-doivent-faire-consulter',
    title: 'Puberté précoce : les signes qui doivent faire consulter',
    summary: 'Seins, poils pubiens, testicules qui grossissent, croissance qui s’emballe : à partir de quel âge on parle de puberté précoce et ce que fait le médecin.',
    category: 'sante-enfant', tags: ['puberté précoce', 'seins petite fille', 'poils pubiens', 'testicules', 'croissance rapide', 'âge osseux', 'endocrinologue pédiatrique', 'puberté avancée'],
    min_age_months: 24, max_age_months: 132, journeys: ['child'], safety_critical: true,
    sources: [S.ameliPuberte, S.mpediaPuberte, S.ameliSurpoids],
    body_md: `## En bref
- L’Assurance maladie parle de puberté précoce quand les signes apparaissent **avant 8 ans chez la fille** et **avant 9 ans chez le garçon** (mpedia retient avant 10 ans chez le garçon).
- Les signes à repérer : **développement des seins**, **poils pubiens**, augmentation du **volume des testicules**, parfois premières règles.
- Une **accélération de la croissance** (plus de 9 cm par an selon l’Assurance maladie) peut précéder ou accompagner ces signes.
- Une consultation médicale est indispensable : le plus souvent aucune cause n’est retrouvée, mais un bilan est nécessaire.

## Comprendre
**Les âges habituels.** Selon mpedia, la puberté débute en général vers 10 ans chez la fille (entre 9 et 13 ans) et vers 12 ans chez le garçon (le plus souvent entre 11 et 14 ans). Entre 8 et 10 ans chez la fille, ou 9 et 11 ans chez le garçon, l’Assurance maladie parle de **puberté avancée**, qui n’est pas considérée comme anormale.

**Les premiers signes**
- **Chez la fille** : les seins se développent, parfois de façon douloureuse et asymétrique au début ; puis viennent les poils pubiens, ceux des aisselles, et les règles environ deux ans après le début.
- **Chez le garçon** : les testicules augmentent de volume (parfois d’un seul côté au début), puis apparaissent les poils pubiens.
- **Dans les deux cas** : la croissance s’accélère.

**Pourquoi consulter.** Une puberté qui démarre trop tôt peut isoler l’enfant de ses camarades et, à l’extrême, réduire la taille adulte, car les os mûrissent plus vite (mpedia). Le plus souvent, aucune cause n’est retrouvée. Mais le bilan recherche une cause qui nécessiterait un traitement : anomalie au niveau du cerveau (hypothalamus, hypophyse), des ovaires, des testicules ou des glandes surrénales, prise de certains médicaments, anomalie chromosomique (Assurance maladie).

Mpedia cite aussi des facteurs pouvant jouer un rôle : antécédents familiaux, conditions de vie, surpoids chez les filles. L’Assurance maladie note qu’en cas de surpoids, la puberté peut être avancée chez les filles.

**Le bilan possible** : suivi de la courbe de croissance, radiographie de la main et du poignet pour l’âge osseux, prise de sang hormonale, échographie pelvienne chez la fille ou des testicules chez le garçon, parfois IRM cérébrale ou recherche génétique.

**Le traitement.** Il dépend de l’âge, de la cause et de l’évolution. Les signes régressent parfois spontanément, notamment quand seul un caractère se développe (seins ou poils seuls). Quand un traitement est nécessaire, il freine la puberté ; mpedia indique qu’il est bien toléré et qu’à l’arrêt la puberté reprend son cours.

## Au quotidien
- Notez ce que vous observez et depuis quand.
- Apportez le carnet de santé : la courbe de taille est un élément clé.
- Signalez les médicaments ou crèmes utilisés à la maison.
- Expliquez simplement à votre enfant pourquoi vous allez voir le médecin, avec des mots adaptés à son âge, sans dramatiser.
- Respectez sa pudeur : il peut préférer que l’examen se fasse avec un seul parent.
- Préparez-le aux changements avec des livres adaptés à son âge, en particulier aux règles si les seins se développent tôt.

## Questions fréquentes
**Ma fille de 7 ans a un petit bourgeon sous un mamelon. Faut-il consulter ?**
Oui : avant 8 ans, l’Assurance maladie considère que les signes pubertaires justifient une consultation. Le médecin dira s’il s’agit d’un début de puberté et s’il faut un bilan.

**Quelques poils pubiens à 6 ans, est-ce une puberté ?**
Pas forcément, mais seul un examen permet de le dire. Prenez rendez-vous avec le médecin de votre enfant.

**La puberté précoce est-elle de ma faute ?**
Non. Le plus souvent, aucune cause n’est retrouvée.

**Que se passe-t-il en cas de puberté tardive ?**
L’Assurance maladie parle de retard pubertaire en l’absence de développement des seins à 13 ans ou de règles à 15 ans chez la fille, et en l’absence de développement des testicules à 14 ans chez le garçon. Une consultation est aussi indispensable.

## Quand demander conseil
Consultez le médecin de votre enfant devant un développement des seins ou des poils pubiens avant 8 ans chez la fille, une augmentation du volume des testicules ou des poils pubiens avant 9 ans chez le garçon, des saignements génitaux chez une petite fille, ou une croissance qui s’accélère nettement. Des maux de tête inhabituels, des troubles de la vue ou des vomissements associés demandent un avis rapide. ${URG} ${ENF}

${FIN}`,
  }),
  // ------------------------------------------------------------ prénom et nom
  a({
    slug: 'choisir-un-prenom-ce-que-dit-la-loi',
    title: 'Choisir un prénom : ce que dit la loi',
    summary: 'Les parents sont libres de choisir le prénom de leur enfant, dans certaines limites : prénoms contraires à son intérêt, signalement au procureur, orthographe et accents.',
    category: 'droits-demarches', tags: ['prénom', 'choisir un prénom', 'prénom refusé', 'procureur', 'officier d’état civil', 'déclaration de naissance', 'prénom composé', 'accents prénom'],
    journeys: ['pregnant', 'newborn'],
    sources: [S.spPrenom, S.spChangementPrenom],
    body_md: `## En bref
- Les parents choisissent librement le ou les prénoms au moment de la **déclaration de naissance** : il n’existe **pas de liste officielle** de prénoms autorisés.
- Le prénom ne doit pas être **contraire à l’intérêt de l’enfant** (par exemple ridicule ou grossier), seul ou associé au nom de famille.
- L’officier d’état civil **ne peut pas refuser** un prénom, mais il peut **prévenir le procureur de la République**, qui peut saisir le juge aux affaires familiales.
- Seules les lettres de l’alphabet français sont admises ; l’orthographe et les tirets se précisent à la déclaration.

## Comprendre
**Une liberté encadrée.** Selon Service-Public.fr (fiche vérifiée le 20 mars 2026), vous pouvez reprendre un prénom existant ou en créer un. La loi ne fixe pas de nombre maximal de prénoms, mais l’officier d’état civil peut estimer qu’un nombre excessif va contre l’intérêt de l’enfant.

**Les limites**
- Le prénom, seul ou avec le nom, ne doit pas nuire à l’enfant : un prénom ridicule, grossier, ou une association prénom-nom qui l’exposerait aux moqueries.
- Il ne doit pas porter atteinte au droit d’une autre personne à protéger son nom de famille (par exemple utiliser comme prénom le nom d’une personne connue).
- Un enfant qui ne porte que le nom d’un parent ne peut pas recevoir comme prénom le nom de famille de l’autre parent.

**Le contrôle.** L’officier d’état civil vérifie chaque prénom, leur combinaison et leur association avec le nom. S’il estime le choix contraire à l’intérêt de l’enfant, il ne refuse pas l’inscription : il **avertit le procureur de la République**. Celui-ci peut saisir le **juge aux affaires familiales (JAF)**, qui peut ordonner la suppression du prénom des registres et, faute d’un nouveau choix des parents, en attribuer un.

**L’écriture**
- Plusieurs prénoms sont séparés par des virgules.
- Pour un prénom composé, vous indiquez s’il s’écrit avec un tiret ou une espace.
- Seules les lettres de l’alphabet français sont autorisées ; la fiche donne l’exemple du « ñ », refusé.
- Une erreur d’orthographe peut être rectifiée sur l’acte de naissance.

**L’ordre des prénoms.** N’importe quel prénom inscrit sur l’acte peut servir de prénom usuel, quelle que soit sa place. En revanche, la carte d’identité et le passeport suivent l’ordre de l’acte ; le modifier demande une procédure de changement de prénom.

## Au quotidien
**Avant la naissance**
- Dites le prénom à voix haute avec le nom de famille, et imaginez-le à l’école, à l’adolescence, à l’âge adulte.
- Vérifiez les initiales et les jeux de mots possibles.
- Mettez-vous d’accord sur l’orthographe exacte, les accents, les tirets et l’ordre des prénoms.
- Notez-le par écrit pour la personne qui fera la déclaration.

**Le jour de la déclaration**
- Épelez chaque prénom et précisez les séparateurs (virgule, tiret, espace).
- Relisez attentivement l’orthographe des prénoms sur l’acte de naissance, et demandez une rectification au plus vite en cas d’erreur.

**En cas de désaccord entre parents**
Service-Public.fr indique que le juge aux affaires familiales tranche ; il est saisi auprès du tribunal judiciaire, sans avocat obligatoire. Avant d’en arriver là, chercher un compromis (prénoms multiples, prénom usuel différent) apaise souvent la situation.

## Questions fréquentes
**Puis-je donner un prénom inventé ?**
Oui, il n’existe pas de liste officielle. La seule limite est l’intérêt de l’enfant et le respect du nom d’autrui.

**Combien de prénoms puis-je donner ?**
La loi ne fixe pas de limite, mais un nombre excessif peut être jugé contraire à l’intérêt de l’enfant.

**Que se passe-t-il si le procureur est saisi ?**
Le prénom est inscrit, puis le procureur peut saisir le JAF. Si le juge ordonne sa suppression, vous pouvez proposer un autre prénom ; à défaut, le juge en attribue un.

**L’enfant pourra-t-il changer de prénom plus tard ?**
Oui, une procédure existe en mairie, avec un « intérêt légitime ». Elle est détaillée dans un article dédié.

## Quand demander conseil
Pour toute question sur votre situation, adressez-vous au service d’état civil de votre mairie ou à Allô Service Public (gratuit), qui répond aux questions générales. En cas de conflit, un juriste ou un point-justice peut vous orienter. Si les tensions dans le couple deviennent pesantes ou violentes, parlez-en à un professionnel ; en cas de danger, appelez le **17** ou le **112**. ${PSY}

${FIN}`,
  }),
  a({
    slug: 'changer-le-prenom-d-un-enfant-mineur-demarche',
    title: 'Changer le prénom d’un enfant mineur : démarche en mairie',
    summary: 'Changer, ajouter, supprimer un prénom ou en modifier l’ordre : qui fait la demande, l’accord de l’enfant de plus de 13 ans, le dossier et ce qui se passe ensuite.',
    category: 'droits-demarches', tags: ['changement de prénom', 'changer prénom enfant', 'intérêt légitime', 'cerfa 16234', 'mairie', 'procureur', 'juge aux affaires familiales', 'prénom usuel'],
    journeys: ['newborn', 'child'],
    sources: [S.spChangementPrenom, S.spPrenom],
    body_md: `## En bref
- La demande se fait à la **mairie** (du lieu de résidence ou qui détient l’acte de naissance), avec le formulaire **cerfa n° 16234** ; la démarche est **gratuite**.
- Elle doit reposer sur un **intérêt légitime** et ne pas être contraire à l’intérêt de l’enfant.
- Quand l’autorité parentale est conjointe, **les deux parents** font la demande ; l’**accord de l’enfant de plus de 13 ans** est obligatoire.
- Si l’officier d’état civil doute de l’intérêt légitime, il saisit le **procureur de la République**.

## Comprendre
Selon Service-Public.fr (fiche vérifiée le 9 octobre 2026), la procédure permet de **changer** un prénom, d’en **ajouter**, d’en **supprimer** ou de **modifier l’ordre** des prénoms.

Avant de lancer la démarche, rappelez-vous que tout prénom inscrit sur l’acte de naissance peut déjà servir de **prénom usuel**, quelle que soit sa position. Si votre enfant se fait appeler par son deuxième prénom, aucune procédure n’est nécessaire pour la vie quotidienne.

**Qu’est-ce qu’un intérêt légitime ?** La fiche cite notamment : l’usage prolongé d’un autre prénom que celui de l’état civil, la suppression d’un prénom ou d’une association nom-prénom jugée ridicule, l’ajout ou la suppression d’un tiret après un usage prolongé, la transidentité.

**Qui fait la demande ?**
- Le ou les représentants légaux de l’enfant.
- En cas d’autorité parentale conjointe, les deux parents ensemble.
- Si des parents séparés ne sont pas d’accord, le parent qui souhaite le changement saisit le juge aux affaires familiales.
- L’enfant de plus de 13 ans signe le formulaire pour donner son accord.

**Une précision d’actualité.** La fiche signale qu’un décret doit préciser l’application d’une loi du 27 juillet 2026 ; certains justificatifs ne seront exigés qu’après sa publication. Vérifiez la fiche à jour avant de déposer votre dossier.

## Au quotidien
**Le dossier (selon Service-Public.fr)**
- Le formulaire signé par le ou les représentants légaux, et par l’enfant de plus de 13 ans.
- La pièce d’identité du représentant légal et, si besoin, la preuve de sa qualité de représentant.
- Un justificatif de domicile récent.
- La copie intégrale de l’acte de naissance de l’enfant de moins de 3 mois et sa pièce d’identité.
- Des documents qui montrent l’intérêt de la demande : carnet de santé, documents scolaires, attestations de proches, inscription à une activité.
- Pour un enfant de plus de 13 ans, le bulletin n° 3 du casier judiciaire.
Aucun certificat médical n’est exigé.

**Le déroulement**
1. Vous déposez le dossier et recevez un récépissé.
2. L’officier d’état civil examine la demande. S’il l’accepte, il vous notifie sa décision et met à jour les actes.
3. S’il estime que l’intérêt légitime n’est pas démontré, il saisit le procureur, qui accepte ou refuse.
4. En cas de refus, un recours est possible devant le juge aux affaires familiales, avec avocat obligatoire.

**Après l’acceptation** : la carte d’identité et le passeport doivent être mis à jour dans les **3 mois** suivant la mise à jour de l’acte de naissance. Pensez aussi à prévenir l’école, la caisse d’Assurance maladie, la Caf.

## Questions fréquentes
**Combien de temps cela prend-il ?**
La fiche ne donne pas de délai fixe : il dépend de la mairie et d’une éventuelle saisine du procureur.

**Mon enfant de 10 ans doit-il donner son accord ?**
L’accord écrit est obligatoire à partir de 13 ans. Pour un enfant plus jeune, l’écouter et lui expliquer la démarche reste important.

**Peut-on simplement ajouter un tiret ?**
Oui, l’ajout ou la suppression d’un tiret après un usage prolongé fait partie des exemples d’intérêt légitime.

**La démarche coûte-t-elle quelque chose ?**
Non, elle est gratuite en mairie. Seul un recours devant le juge implique un avocat.

## Quand demander conseil
Votre mairie (service état civil) et Allô Service Public peuvent répondre à vos questions générales ; un point-justice ou un avocat peut vous aider en cas de désaccord ou de refus. Si votre enfant vit une souffrance importante liée à son prénom ou à son identité, parlez-en avec son médecin ou un psychologue. ${PSY} ${ENF}

${FIN}`,
  }),
  a({
    slug: 'nom-d-usage-double-nom-enfant-mineur',
    title: 'Nom d’usage et double nom de l’enfant : ce qui est possible',
    summary: 'Sans changer l’état civil, votre enfant peut porter au quotidien le nom de ses deux parents : qui décide, l’information de l’autre parent, l’accord dès 13 ans et les papiers d’identité.',
    category: 'droits-demarches', tags: ['nom d’usage', 'double nom', 'nom de la mère', 'nom du père', 'ajouter nom', 'carte d’identité enfant', 'autorité parentale', 'loi 2022'],
    journeys: ['newborn', 'child'],
    sources: [S.spNomUsage],
    body_md: `## En bref
- Le **nom d’usage** est le nom utilisé au quotidien ; il ne remplace pas le nom de famille inscrit à l’état civil.
- Pour un enfant mineur, il peut s’agir d’un **double nom** (son nom + celui du parent qui ne l’a pas transmis), du **seul nom de l’autre parent**, ou d’une partie du double nom d’un parent.
- Les parents qui exercent l’autorité parentale le choisissent ; un parent peut aussi **ajouter son nom** seul, à condition d’**informer l’autre parent à l’avance**.
- À partir de **13 ans**, le **consentement de l’enfant** est obligatoire.

## Comprendre
Selon Service-Public.fr (fiche vérifiée le 7 août 2025), le nom d’usage est **facultatif**, **jamais automatique** et relève d’un choix. Il s’appuie sur la loi du 2 mars 2022 relative au choix du nom issu de la filiation.

**Les noms possibles**
- Un **double nom** composé du nom de l’enfant et du nom du parent qui ne l’a pas transmis, dans la limite d’un nom par parent, dans l’ordre que vous choisissez.
- Le **nom du parent** qui ne l’a pas transmis, à la place.
- Si un parent seul porte un double nom, l’un des éléments de ce nom.
Le nom du parent doit figurer sur l’acte de naissance de l’enfant.

**Qui décide ?**
- **Autorité parentale conjointe** : les parents choisissent ensemble ; il est conseillé de formaliser l’accord par écrit (un modèle existe en annexe d’une circulaire du 15 juin 2023). En cas de désaccord, le juge aux affaires familiales peut être saisi.
- **Autorité parentale exercée par un seul parent** : ce parent décide.
- **Le parent qui n’a pas transmis son nom** peut l’**ajouter** dans l’usage sans l’accord de l’autre, mais doit l’en **informer au préalable** pour qu’il puisse s’y opposer ou saisir le juge. Il est conseillé de garder une preuve de cette information. Dans ce cas, l’ordre des noms ne peut pas être modifié et le nom ne peut pas être substitué.
- **Dès 13 ans**, l’enfant doit consentir ; s’il refuse, il ne peut pas porter ce nom d’usage.

**À ne pas confondre** : le choix du nom de famille à la naissance, et le changement de nom de famille, sont d’autres procédures. Le nom d’usage, lui, ne modifie pas l’acte de naissance.

## Au quotidien
**Faire figurer le nom d’usage sur les papiers d’identité**
Lors d’une demande de carte d’identité ou de passeport :
- remplissez la rubrique « Nom d’usage » du formulaire ou de la pré-demande ;
- joignez l’accord écrit des deux parents, ou la preuve que l’autre parent a été informé ;
- joignez le consentement de l’enfant s’il a 13 ans ou plus ;
- si l’état civil du lieu de naissance n’est pas dématérialisé, fournissez un acte de naissance de moins de 3 mois mentionnant les deux parents.

**Au renouvellement** : si le nom d’usage ne change pas, il suffit de remplir la rubrique. Pour le modifier ou l’abandonner, les mêmes justificatifs sont demandés.

**Dans la vie de tous les jours** : le nom d’usage peut être utilisé dans tous les actes de la vie privée, familiale et sociale. Dès la demande, l’administration doit l’employer dans ses courriers. Prévenez les organismes (école, Assurance maladie via le compte ameli, Caf).

**Parler avec votre enfant** : expliquez-lui pourquoi il porte deux noms ou en porte un nouveau, avec des mots simples ; c’est une partie de son histoire.

## Questions fréquentes
**Le nom d’usage remplace-t-il le nom de famille ?**
Non. Le nom de famille reste celui de l’acte de naissance ; le nom d’usage s’y ajoute pour la vie courante.

**L’autre parent peut-il bloquer l’ajout de mon nom ?**
Il peut saisir le juge, mais selon la fiche, son désaccord ou la saisine du juge n’empêchent pas l’ajout. Le juge peut ensuite trancher.

**Peut-on choisir l’ordre des noms ?**
Oui lorsque les deux parents décident ensemble. Quand un seul parent ajoute son nom, l’ordre ne peut pas être modifié.

**À 13 ans, mon enfant peut-il refuser ?**
Oui, son consentement est obligatoire à partir de 13 ans.

## Quand demander conseil
Votre mairie, Allô Service Public, un point-justice ou un avocat peuvent vous aider à vérifier votre situation. Si le sujet ravive des conflits importants entre parents, une médiation familiale (renseignements auprès de la Caf) peut aider. En cas de violences, appelez le **17** ou le **112**. ${ENF}

${FIN}`,
  }),
  // ------------------------------------------------------------ biberon
  a({
    slug: 'conserver-transporter-biberons-sorties-creche-voyage',
    title: 'Conserver et transporter les biberons : sorties, crèche et voyage',
    summary: 'Eau et poudre séparées, délais à respecter, lait maternel au frais, réchauffage sans micro-ondes : les règles d’hygiène pour nourrir bébé hors de la maison.',
    category: 'alimentation-bebe', tags: ['transporter biberon', 'biberon sortie', 'biberon crèche', 'biberon voyage', 'conserver lait', 'lait maternel transport', 'sac isotherme', 'biberon à l’avance'],
    min_age_months: 0, max_age_months: 24, journeys: ['newborn'],
    sources: [S.ameliBiberon, S.ansesBiberon, S.spfAllaitement],
    body_md: `## En bref
- Une fois reconstitué, le lait infantile en poudre devient **très fragile** : l’Anses rappelle que la poudre n’est pas stérile.
- En sortie, transportez **l’eau dans le biberon et la poudre à part**, et mélangez au dernier moment.
- Un biberon préparé se boit **dans l’heure** à température ambiante, **dans la demi-heure** après réchauffage ; un biberon entamé ne se garde **jamais** pour la tétée suivante.
- Le lait maternel tiré se transporte au **froid** (glacière ou sac isotherme avec pack réfrigérant).

## Comprendre
Les préparations pour nourrissons en poudre peuvent contenir de rares micro-organismes, qui se multiplient après reconstitution. L’Anses souligne que des contaminations peuvent provoquer des infections graves, surtout chez les prématurés et les bébés de faible poids. Les laits liquides prêts à l’emploi sont stériles tant qu’ils ne sont pas ouverts.

**Les délais de référence** (ameli.fr, Anses) :
- à température ambiante : **une heure maximum**, puis on jette ;
- après réchauffage : **dans la demi-heure** ;
- au réfrigérateur, exceptionnellement, pour un biberon préparé à l’avance : **à 4 °C maximum**, dans la partie la plus froide, jamais dans la porte ;
- lait liquide stérile entamé : 48 heures maximum, dans son emballage d’origine, dans la partie la plus froide du réfrigérateur.

**Le lait maternel** se conserve différemment. Le guide de l’allaitement de Santé publique France indique : 4 heures maximum à température ambiante, 48 heures au réfrigérateur (4 °C ou moins), 4 mois au congélateur (−18 °C). Le lait décongelé se consomme dans les 24 heures et ne se recongèle jamais.

## Au quotidien
**Pour une sortie courte**
- Avant de partir : un biberon propre rempli d’eau (froide du robinet ou eau en bouteille adaptée aux nourrissons) et la poudre mesurée dans une boîte doseuse propre et sèche.
- Sur place : lavez-vous soigneusement les mains, ajoutez la poudre, agitez fortement, vérifiez l’absence de grumeaux.
- Le lait peut être donné à température ambiante : le réchauffer n’est pas indispensable.

**Pour la crèche ou l’assistante maternelle**
- Renseignez-vous auprès de la structure ou de l’assistante maternelle sur son organisation (fourniture du lait, boîte à apporter, horaires).
- Pour le lait maternel : notez sur chaque récipient la date et l’heure du recueil (et le nom de votre enfant si on vous le demande), remplissez-le aux trois quarts, transportez-le dans une glacière ou un sac isotherme avec pack réfrigérant, et remettez-le au réfrigérateur dès l’arrivée.

**En voyage**
- Emportez suffisamment de poudre dans son emballage d’origine et une réserve d’eau adaptée.
- Une bouteille d’eau entamée se garde au réfrigérateur et se consomme dans les 24 heures (ameli).
- À l’étranger, sans eau potable ni eau en bouteille adaptée, l’Assurance maladie indique qu’on peut utiliser de l’eau bouillie puis refroidie.
- Prévoyez de quoi laver les biberons : goupillon, liquide vaisselle, séchage à l’air libre.

**Réchauffer hors de chez soi**
- Au bain-marie ou au chauffe-biberon, rapidement. **Jamais au micro-ondes** : il crée des points très chauds qui peuvent brûler la bouche et la gorge.
- Agitez, puis testez quelques gouttes sur l’intérieur du poignet.

## Questions fréquentes
**Puis-je préparer le biberon de nuit à l’avance ?**
L’idéal est de le préparer juste avant la tétée. À titre exceptionnel, ameli indique qu’un biberon préparé peut être gardé au réfrigérateur à 4 °C maximum, dans la partie la plus froide.

**Bébé n’a bu que la moitié. Puis-je garder le reste ?**
Non : un biberon entamé ne se conserve pas pour la tétée suivante, même au réfrigérateur.

**Puis-je utiliser l’eau d’une carafe filtrante ?**
Non : l’Anses et ameli déconseillent l’eau filtrée ou adoucie, qui peut favoriser la multiplication des microbes.

**Faut-il stériliser les biberons en voyage ?**
La stérilisation systématique n’est plus jugée nécessaire ; un lavage soigneux à l’eau chaude avec liquide vaisselle et goupillon, puis un séchage à l’air libre, suffisent.

## Quand demander conseil
Demandez l’avis du médecin, de la sage-femme ou de la PMI si votre bébé est prématuré ou de petit poids, avant un voyage dans un pays où l’eau n’est pas potable, ou en cas de diarrhée ou de vomissements. Un bébé qui refuse de boire, vomit à répétition, a de la fièvre avant 3 mois, mouille peu ses couches ou paraît très somnolent doit être vu rapidement. ${URG}

${FIN}`,
  }),
  a({
    slug: 'lait-infantile-bien-choisir-age-etiquette-laits-non-adaptes',
    title: 'Laits infantiles : bien choisir selon l’âge et éviter les laits non adaptés',
    summary: 'Premier âge, deuxième âge, lait de croissance : à quoi correspond chaque étape, comment lire l’étiquette sans se fier au marketing, et pourquoi lait de vache, laits de ferme et boissons végétales ne conviennent pas au nourrisson.',
    category: 'alimentation-bebe', tags: ['lait infantile', 'lait 1er âge', 'lait 2e âge', 'lait de croissance', 'boisson végétale bébé', 'lait de chèvre bébé', 'étiquette lait bébé', 'préparation pour nourrissons'],
    min_age_months: 0, max_age_months: 36, journeys: ['newborn', 'child'],
    sources: [S.santeLait, S.guideDiversif, S.ameliBiberon],
    body_md: `## En bref
- L’allaitement maternel reste la référence ; quand bébé est nourri au biberon, il reçoit une **préparation pour nourrissons** (« 1er âge ») jusqu’au début de la diversification.
- On passe au **2e âge** (préparation de suite) quand l’enfant prend au moins un **repas complet sans lait** par jour ; entre 1 et 3 ans, un **lait de croissance** peut être proposé.
- Tous les laits infantiles vendus en France respectent une **réglementation européenne stricte** de composition.
- Le **lait de vache** avant 1 an, les **laits de ferme** (chèvre, brebis, ânesse…) et les **boissons végétales** ne sont pas adaptés au nourrisson.

## Comprendre
**Les étapes** (brochure de 1000 premiers jours et Santé.fr) :
- **1er âge** : de la naissance jusqu’au début de la diversification, entre 4 et 6 mois.
- **2e âge** : dès que l’enfant a au moins un repas complet sans lait par jour.
- **Lait de croissance** : entre 1 et 3 ans, enrichi en fer, à choisir sans sucre ni arôme ajouté. La brochure indique qu’il peut être alterné avec du lait de vache entier UHT, à condition de proposer des aliments riches en fer et en vitamine C.

**Une composition encadrée.** Santé.fr rappelle que la composition des préparations pour nourrissons et de suite est fixée par un règlement européen, et que la publicité pour les laits 1er âge est interdite afin de ne pas concurrencer l’allaitement. Il existe trois catégories : les laits **standard**, les laits pour **troubles fonctionnels** (petits troubles digestifs) et les laits **thérapeutiques**, vendus uniquement en pharmacie (allergie aux protéines du lait de vache, reflux, intolérance au lactose).

**Les laits non adaptés**
- **Lait de vache avant 1 an** : trop de protéines, de sodium et de sels minéraux, pas assez de fer, de zinc, de vitamines et d’acides gras essentiels.
- **Laits demi-écrémés, écrémés** : ne conviennent pas aux nourrissons, qui ont besoin de matières grasses pour se développer.
- **Boissons végétales** (amande, avoine, riz, soja, coco…) : même enrichies en calcium, elles ne couvrent pas les besoins des moins de 1 an et exposent à des carences. Le soja est déconseillé avant 3 ans selon la brochure.
- **Laits de chèvre, brebis, jument, ânesse** produits à la ferme : non conformes. Seules les préparations infantiles transformées pour respecter la réglementation conviennent.

## Au quotidien
**Bien choisir en magasin ou en pharmacie**
- Vérifiez la **dénomination** : « préparation pour nourrissons » (1er âge) ou « préparation de suite » (2e âge).
- Vérifiez l’**âge** indiqué sur la boîte.
- Demandez conseil au médecin ou à la sage-femme avant de choisir un lait 1er âge, recommande Santé.fr : le choix dépend de l’âge, de la santé et des particularités de votre enfant (risque allergique, tolérance).
- Ne vous fiez pas aux mentions marketing : les laits standard sont tous strictement contrôlés.
- En cas d’antécédents d’allergie dans la famille, demandez s’il faut un lait hypoallergénique.

**Bien conserver la boîte**
- Une boîte de poudre ouverte se garde environ un mois, bien refermée, au frais et au sec (ameli).
- Utilisez uniquement la dosette fournie, gardez-la sèche, et respectez une dose rase pour 30 ml d’eau.

**Changer de lait ?**
Santé.fr déconseille de changer sans cesse de lait infantile : tout changement se décide avec le médecin, selon les symptômes observés. Les laits « anti-régurgitations », « confort » ou « satiété » relèvent de situations précises.

**Les rappels de produits** : consultez le site officiel Rappel Conso en cas de doute sur un lot.

## Questions fréquentes
**Le lait le plus cher est-il le meilleur ?**
Non. Tous les laits standard respectent la même réglementation. Le bon lait est celui qui convient à votre enfant, choisi avec le professionnel qui le suit.

**Puis-je donner du lait de vache à 10 mois ?**
Non : le lait de vache n’est pas adapté avant 1 an.

**Une boisson à l’amande « enrichie » peut-elle remplacer le lait infantile ?**
Non, les boissons végétales ne couvrent pas les besoins des moins de 1 an, même enrichies.

**Et si je veux arrêter l’allaitement ?**
Parlez-en à la sage-femme ou au médecin : ils vous aideront à choisir la préparation et à organiser la transition.

## Quand demander conseil
Consultez le médecin si votre bébé vomit souvent, a du sang dans les selles, de l’eczéma important, pleure beaucoup après les biberons, ne prend pas de poids, ou si vous envisagez un lait spécial. Des vomissements répétés, un bébé qui refuse de boire, mouille peu ses couches ou paraît très mou demandent un avis rapide. ${URG}

${FIN}`,
  }),
  a({
    slug: 'signes-de-faim-et-satiete-bebe-nourri-au-biberon',
    title: 'Bébé au biberon : reconnaître les signes de faim et de satiété',
    summary: 'Mouvements de succion, bouche ouverte, tête qui se détourne : apprendre à lire les signaux de votre bébé pour le nourrir à son rythme, sans le forcer.',
    category: 'alimentation-bebe', tags: ['signes de faim', 'satiété bébé', 'biberon à la demande', 'bébé ne finit pas biberon', 'forcer biberon', 'rythme biberon', 'pleurs faim', 'rot'],
    min_age_months: 0, max_age_months: 12, journeys: ['newborn'],
    sources: [S.guideDiversif, S.santePremiersBib, S.santeColiques],
    body_md: `## En bref
- Les **signes de faim** : bébé s’agite, fait des mouvements de succion, ouvre la bouche à l’approche du biberon ; les pleurs viennent souvent plus tard.
- Les **signes de satiété** : il ralentit, s’endort, tourne la tête, regarde ailleurs.
- On **propose sans jamais forcer** : l’appétit varie d’un jour à l’autre, et on n’oblige jamais un enfant à finir son biberon.
- Les **quantités** et le nombre de biberons se voient avec le médecin ou la sage-femme, selon l’âge, le poids et la courbe de votre bébé.

## Comprendre
Santé.fr (contenu mpedia) conseille de répondre à la demande du bébé lorsqu’il manifeste sa faim, plutôt que de suivre un horaire strict, sans avoir besoin de surveiller la montre. Le moment de proposer le biberon, c’est quand le bébé bouge ou fait des **mouvements de succion**.

La brochure de 1000 premiers jours décrit les signaux :
- **faim** : pleurs, agitation des bras et des jambes, bouche ouverte à l’approche du sein, du biberon ou de la cuillère ;
- **satiété** : endormissement pendant la tétée, ralentissement, tête tournée, regard ailleurs.

Chaque bébé a sa façon de s’exprimer : en l’observant pendant quelques jours, vous apprendrez à reconnaître ses propres signaux.

**Les pleurs ne veulent pas toujours dire faim.** Santé.fr (pleurs et coliques) rappelle que si la courbe de poids est régulière, des pleurs fréquents ne signifient pas forcément que bébé a faim : « la solution ne se trouve pas dans l’augmentation des rations ». Les pleurs du soir sont souvent apaisés par le bercement, le portage, la présence ou la succion, plutôt que par un repas supplémentaire.

## Au quotidien
**Pendant le biberon** (conseils de Santé.fr)
- Installez-vous confortablement, bébé en position **demi-assise**, la tête soutenue. Ne donnez pas le biberon allongé, à cause du risque de fausse route.
- Inclinez le biberon pour que la tétine reste pleine de lait.
- Frottez doucement la tétine contre ses lèvres pour déclencher la succion.
- Regardez-le, parlez-lui : c’est un moment d’échange.
- S’il s’agite, faites une **pause**, mettez-le contre l’épaule pour un rot, puis reprenez s’il le souhaite.
- S’il boit bien, laissez-le téter à son rythme, sans l’interrompre.

**Quand il montre qu’il n’a plus faim**
- Arrêtez, même s’il reste du lait : un biberon entamé ne se garde pas pour la suite.
- Ne le relancez pas en secouant le biberon ou en insistant.
- Pour un bébé qui avale goulûment, des pauses et un repas au calme peuvent aider.

**Garder des repères**
- Notez si besoin l’heure des biberons et l’état des couches les premières semaines, pour en parler au professionnel.
- La meilleure façon de savoir si votre bébé mange assez reste le suivi de son **poids** et de sa **courbe** par le médecin, la sage-femme ou la PMI.

## Questions fréquentes
**Combien de millilitres doit-il boire ?**
Les besoins varient selon l’âge, le poids et chaque enfant. Demandez au médecin, à la sage-femme ou à la PMI de vous indiquer des repères adaptés et de suivre sa courbe.

**Faut-il le réveiller pour le biberon ?**
Chez le nouveau-né, Santé.fr indique que s’il ne réclame pas pendant 3 à 4 heures la nuit, il n’est pas nécessaire de le réveiller, l’objectif étant le total sur 24 heures. Demandez conseil si votre bébé est prématuré, de petit poids ou s’il prend mal du poids.

**Il réclame encore juste après avoir fini. Dois-je refaire un biberon ?**
Il peut avoir besoin de succion, de réconfort ou de câlins. Si cela se répète souvent ou si sa courbe vous inquiète, parlez-en au médecin.

**Ajouter des céréales pour qu’il dorme mieux ?**
Ne modifiez pas la préparation sans avis médical : respectez la dose de poudre indiquée et parlez au médecin de vos difficultés de nuit.

## Quand demander conseil
Consultez le médecin si votre bébé refuse régulièrement le biberon, boit très peu, vomit souvent, pleure intensément pendant ou après les repas, prend mal du poids ou mouille peu ses couches. Un bébé très mou, difficile à réveiller, qui refuse de boire ou a de la fièvre avant 3 mois doit être vu en urgence. ${URG}

${FIN}`,
  }),
  // ------------------------------------------------------------ poids
  a({
    slug: 'retrouver-son-poids-apres-grossesse-sans-regime',
    title: 'Retrouver son poids après la grossesse, sans régime',
    summary: 'Pourquoi le corps garde des réserves, pourquoi les régimes sont déconseillés au début, et comment avancer à votre rythme avec l’allaitement, le sommeil et une reprise progressive de l’activité.',
    category: 'post-partum', tags: ['poids après grossesse', 'perdre du poids après accouchement', 'régime post-partum', 'allaitement poids', 'kilos de grossesse', 'ventre après bébé', 'reprise sport', 'alimentation post-partum'],
    min_age_months: 0, max_age_months: 24, journeys: ['newborn', 'parents_sleep'],
    sources: [S.ameliRetourMaison, S.mpediaAllaitAlim, S.ameliMaternite],
    body_md: `## En bref
- L’Assurance maladie rappelle qu’il est fréquent de **ne pas retrouver tout de suite son poids** d’avant la grossesse : le corps a constitué des réserves, notamment pour l’allaitement.
- **Pas de régime** pendant l’allaitement, ni avant les **3 mois** de l’enfant si vous n’allaitez pas.
- Une alimentation **variée et équilibrée**, en mangeant **à sa faim**, et une bonne hydratation suffisent au début.
- L’**activité physique** reprend progressivement, après avis médical et rééducation périnéale pour les sports à impact.

## Comprendre
**Le corps a besoin de temps.** À la maternité, la sage-femme surveille le retour de l’utérus à sa taille habituelle, qui prend **environ deux mois**, précise l’Assurance maladie. Le ventre reste donc arrondi plusieurs semaines après la naissance.

**L’allaitement et le poids.** Les pédiatres de mpedia expliquent que produire du lait demande de l’énergie, sans qu’il soit nécessaire de « manger pour deux » : l’organisme puise dans les réserves de graisse constituées pendant la grossesse, ce qui explique que l’allaitement puisse favoriser la perte de poids. Ils déconseillent tout régime amaigrissant pendant cette période. Aucun régime particulier n’est nécessaire : il suffit de manger varié, à sa faim, sans excès, et de boire régulièrement.

**Pourquoi pas de régime tout de suite ?** Les semaines qui suivent la naissance demandent beaucoup d’énergie : récupération de l’accouchement, nuits courtes, éventuellement allaitement. L’Assurance maladie recommande de ne pas faire de régime pendant l’allaitement, ni avant les 3 mois de l’enfant si vous n’allaitez pas.

**L’activité physique.** Selon l’Assurance maladie, elle reprend progressivement, d’abord en intensité légère à modérée (marche, escaliers, natation), après avis médical, en général 4 à 6 semaines après un accouchement par voie basse et 8 à 10 semaines après une césarienne. Les activités à impact (course, sports collectifs, trampoline) attendent la fin de la rééducation périnéale et l’accord du médecin. L’allaitement n’est pas altéré par l’activité physique.

## Au quotidien
**Dans l’assiette**
- Des repas à heures à peu près régulières, même simples : légumes, féculents, une source de protéines, un produit laitier, un fruit.
- Des en-cas pratiques à portée de main pendant les tétées : fruit, yaourt, pain, fromage.
- De l’eau à proximité ; si vous allaitez, mpedia conseille environ 1,5 litre de liquide par jour.
- Acceptez les repas proposés par l’entourage : c’est une aide précieuse.

**Bouger sans s’épuiser**
- Les promenades avec bébé en poussette ou en porte-bébé sont un bon début.
- Écoutez votre fatigue : courtes siestes, relais avec l’autre parent ou un proche.
- Attendez l’avis du professionnel après la consultation postnatale pour aller plus loin.

**Le regard sur soi**
- Comparez-vous à vous-même, pas aux photos des réseaux sociaux.
- Le corps a porté et mis au monde un enfant : vergetures, ventre, seins peuvent changer durablement, et chacune se réapproprie son corps à son rythme.

## Questions fréquentes
**Au bout de combien de temps retrouve-t-on son poids ?**
Il n’existe pas de délai valable pour toutes. Cela dépend de la prise de poids pendant la grossesse, de l’allaitement, du sommeil et de l’activité. Parlez-en à la consultation postnatale.

**Puis-je commencer un régime après 3 mois si j’allaite ?**
L’Assurance maladie et mpedia déconseillent le régime pendant l’allaitement. Si vous souhaitez perdre du poids, demandez un accompagnement au médecin, à la sage-femme ou à un diététicien.

**Faire des abdominaux aide-t-il à retrouver un ventre plat ?**
La rééducation périnéale passe avant, puis la rééducation abdominale si nécessaire. Demandez au professionnel les exercices adaptés.

**Je n’arrive pas à manger, je n’ai pas le temps.**
C’est fréquent les premières semaines. Simplifiez les repas, déléguez les courses et la cuisine, et parlez-en si vous perdez du poids rapidement ou si vous n’avez plus d’appétit.

## Quand demander conseil
Parlez-en au médecin ou à la sage-femme si vous perdez du poids très vite, si vous n’avez plus d’appétit, si vous vous sentez épuisée, triste, ou si votre rapport à la nourriture devient une source d’angoisse (restriction, crises de grignotage, culpabilité). Une fièvre, des saignements abondants ou une douleur au mollet après l’accouchement demandent un avis rapide. ${URG} ${PSY}

${FIN}`,
  }),
  a({
    slug: 'hyperemese-gravidique-perte-de-poids-quand-consulter-vite',
    title: 'Vomissements sévères pendant la grossesse : perte de poids et quand consulter vite',
    summary: 'L’hyperémèse gravidique se repère à la perte de poids, à la déshydratation et à l’intensité des vomissements : les seuils utilisés, la prise en charge et le soutien possible.',
    category: 'sante-grossesse', tags: ['hyperémèse gravidique', 'vomissements grossesse', 'perte de poids grossesse', 'déshydratation', 'score PUQE', 'nausées sévères', 'hospitalisation grossesse', 'vitamine B1'],
    min_week: 4, max_week: 24, journeys: ['pregnant'], safety_critical: true,
    sources: [S.ameliNausees, S.cngofHg],
    body_md: `## En bref
- On parle d’**hyperémèse gravidique** en cas de **perte de poids d’au moins 5 %** par rapport au poids d’avant la grossesse, de **signes de déshydratation**, ou d’un **score PUQE d’au moins 7** (Assurance maladie, CNGOF).
- Une **perte de poids de 10 % ou plus**, une déshydratation importante, des vomissements mal tolérés ou un bilan sanguin perturbé peuvent conduire à une **hospitalisation**.
- Il ne faut prendre **aucun médicament sans avis médical** ; plusieurs traitements existent.
- Un **soutien psychologique** est proposé : ces vomissements peuvent être très éprouvants.

## Comprendre
Les nausées et vomissements touchent une grande majorité des femmes enceintes et disparaissent en général à la fin du premier trimestre. Ils restent le plus souvent sans gravité. L’hyperémèse gravidique en est une forme sévère.

**Le poids, un repère clé.** Le poids de référence est celui d’**avant la grossesse**. Par exemple, pour une personne qui pesait 60 kg, une perte de 3 kg correspond à 5 %, et une perte de 6 kg à 10 %. D’où l’intérêt de vous peser régulièrement et de noter les chiffres.

**Le score PUQE.** Ce questionnaire de trois questions évalue, sur 24 heures, la durée des nausées, le nombre de vomissements et les haut-le-cœur. Le CNGOF distingue les formes légères (6 ou moins), modérées (7 à 12) et sévères (13 ou plus). L’Assurance maladie conseille de le préparer avant la consultation.

**Pourquoi c’est sérieux.** Des vomissements répétés peuvent perturber le potassium et le sodium dans le sang et altérer le fonctionnement des reins. Lors d’une réhydratation par perfusion, la **vitamine B1** est systématiquement donnée pour prévenir une complication neurologique rare mais grave, l’encéphalopathie de Gayet-Wernicke.

**La prise en charge** (Assurance maladie, CNGOF)
- Sans complication : traitement à domicile, sans bilan systématique.
- En cas d’hyperémèse : un bilan évalue les conséquences sur l’équilibre nutritionnel et recherche d’autres causes, surtout si les vomissements persistent après 9 semaines.
- Le médecin peut suspendre les vitamines prénatales contenant du fer au premier trimestre, en gardant l’acide folique.
- Plusieurs médicaments contre les vomissements existent ; le choix se fait selon leur tolérance.
- L’aromathérapie est déconseillée pendant la grossesse.
- À l’hôpital, l’isolement (chambre dans le noir, téléphone retiré) n’est **pas** recommandé par le CNGOF.

## Au quotidien
- **Mangez ce que vous supportez, quand vous le supportez** : il n’existe pas de régime prouvé efficace (CNGOF).
- Privilégiez de petites quantités, à votre rythme.
- Buvez par petites gorgées, régulièrement.
- Pesez-vous régulièrement, dans les mêmes conditions, et notez le poids pour le montrer au professionnel.
- Notez le nombre de vomissements par jour et ce qui passe ou non : ces informations aident le professionnel.
- Reposez-vous ; demandez de l’aide pour les courses, les repas, les enfants.
- Parlez de votre état à votre médecin ou sage-femme : la capacité à travailler fait partie des éléments évalués.

## Questions fréquentes
**Les vomissements peuvent-ils faire du mal au bébé ?**
Le bilan évalue justement les conséquences pour vous et pour l’enfant à naître. Une prise en charge adaptée permet de limiter les complications : n’attendez pas pour consulter.

**Le gingembre ou l’acupression peuvent-ils suffire ?**
Ils peuvent être proposés pour les formes légères, mais leur efficacité n’est pas clairement démontrée. Ils ne remplacent pas une consultation en cas de perte de poids ou de déshydratation.

**Est-ce que ça recommencera à la prochaine grossesse ?**
Le risque de récidive est mal connu et varie beaucoup selon les études ; le CNGOF recommande une vigilance accrue lors des grossesses suivantes.

**Je me sens découragée, isolée.**
C’est une réaction fréquente face à des vomissements intenses. Un soutien psychologique est proposé, et des associations de patientes peuvent vous accompagner, vous et vos proches.

## Quand demander conseil
Consultez rapidement votre médecin, votre sage-femme ou les urgences de la maternité si vous ne gardez **ni liquide ni aliment** depuis plusieurs heures, si vous avez **perdu 5 % de votre poids** ou plus, si vous urinez peu ou foncé, avez la bouche sèche et une soif intense, des vertiges, des vomissements de sang, des douleurs abdominales, de la fièvre, ou une confusion, des troubles de la vue ou de l’équilibre. ${URG} ${PSY}

${FIN}`,
  }),
  // ------------------------------------------------------------ sexualité
  a({
    slug: 'reprise-de-la-sexualite-apres-l-accouchement',
    title: 'Reprendre une vie sexuelle après l’accouchement',
    summary: 'Il n’y a pas de délai « normal » : récupération du corps, désir qui fluctue, contraception à anticiper dès le 21e jour, et des pistes pour retrouver une intimité à deux.',
    category: 'sexualite', tags: ['sexualité après accouchement', 'reprise des rapports', 'post-partum', 'premier rapport après bébé', 'contraception post-partum', 'lochies', 'libido', 'intimité'],
    min_age_months: 0, max_age_months: 24, journeys: ['newborn'],
    sources: [S.qsApresBebe, S.ameliContraception, S.ameliRetourMaison],
    body_md: `## En bref
- Il **n’existe pas de norme** : certains parents ressentent moins de désir, d’autres aucune différence (QuestionSexualité).
- Le corps a besoin de **temps** : saignements (lochies) pendant deux à six semaines, périnée sensible, cicatrice éventuelle.
- Une **grossesse est possible avant le retour des règles** : sans allaitement, une contraception est nécessaire dès le **21e jour** après l’accouchement (ameli).
- La reprise se fait **quand vous êtes prête**, à deux, sans pression.

## Comprendre
**Le corps récupère.** Selon QuestionSexualité, le site d’information de Santé publique France, les saignements sont abondants les premières 24 à 48 heures puis ressemblent à des règles ; ils peuvent durer de deux à six semaines. Le périnée est temporairement étiré, parfois gonflé et sensible. Une épisiotomie ou une déchirure peut faire mal plusieurs jours, une cicatrice de césarienne quelques semaines.

**Le désir change.** La fatigue, les nuits courtes, la nouvelle image de son corps, les émotions intenses des premières semaines et la charge mentale pèsent sur le désir. L’allaitement fait baisser les œstrogènes, ce qui peut diminuer le désir chez certaines femmes et favoriser une sécheresse vaginale, tout en libérant de l’ocytocine, une hormone liée au plaisir.

**La contraception, à anticiper.** L’Assurance maladie rappelle qu’une nouvelle grossesse est possible avant le retour des règles. Sans allaitement, l’ovulation ne reprend pas avant le 21e jour ; à partir de là, une contraception est nécessaire. En allaitement exclusif, la méthode MAMA n’est fiable que si trois conditions sont réunies : bébé a moins de 6 mois, il est nourri exclusivement au sein, à la demande, jour et nuit, et vos règles ne sont pas revenues. Le choix de la méthode se fait avec le médecin ou la sage-femme, idéalement dès la maternité.

**La consultation postnatale**, entre 6 et 8 semaines après l’accouchement, est un bon moment pour parler sexualité, contraception et douleurs. Des séances de rééducation périnéale peuvent y être prescrites (ameli).

## Au quotidien
- **Parlez-en** à deux : de vos envies, de vos craintes, de votre fatigue. Le sujet peut sembler tabou, mais il se partage.
- **Retrouvez la tendresse** avant tout : caresses, baisers, massages, moments de proximité sans objectif.
- **Ne vous limitez pas à la pénétration** : QuestionSexualité invite à privilégier la sensualité et à construire le désir par les gestes et les mots.
- **Utilisez un lubrifiant** : la sécheresse est fréquente après l’accouchement, surtout en allaitant.
- **Variez les positions** ; après une césarienne, évitez celles qui appuient sur le ventre.
- **Si vous allaitez**, une tétée ou un tirage avant le rapport peut limiter les fuites de lait.
- **Créez des moments pour le couple** : un temps dédié, un lieu tranquille.
- **Partagez les tâches** : QuestionSexualité souligne qu’un partage équitable des tâches domestiques et des soins au bébé laisse plus de place au désir.

## Questions fréquentes
**Faut-il attendre la visite postnatale pour reprendre les rapports ?**
Aucun délai unique ne s’impose : le bon moment dépend de la cicatrisation, des saignements et de votre envie. En cas de doute, posez la question à la sage-femme ou au médecin.

**Je n’ai aucune envie depuis la naissance. Est-ce inquiétant ?**
La baisse du désir est fréquente après une naissance. Si elle s’accompagne d’une tristesse persistante, d’une grande fatigue ou d’un désintérêt pour tout, parlez-en : ce peut être un signe de dépression du post-partum, qui se soigne.

**L’allaitement protège-t-il d’une grossesse ?**
Seulement si les trois conditions de la méthode MAMA sont réunies. Dès que les tétées s’espacent, que bébé prend un biberon, que les règles reviennent ou qu’il atteint 6 mois, une autre contraception est nécessaire.

**Et pour le second parent ?**
Lui aussi peut ressentir fatigue, inquiétude ou changement de désir. En parler ensemble aide chacun à trouver sa place.

## Quand demander conseil
Consultez si les rapports sont douloureux ou si la douleur persiste, si les saignements durent au-delà de six semaines, en cas de fièvre, de pertes malodorantes ou de douleurs du bas-ventre, ou pour choisir une contraception. Une sage-femme, un médecin, un psychologue ou un sexologue peuvent vous accompagner. ${PSY} En cas de violences dans le couple, appelez le **3919** (gratuit, anonyme) ou, en danger, le **17** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'douleurs-pendant-les-rapports-apres-la-naissance',
    title: 'Douleurs pendant les rapports après la naissance : en parler et se faire aider',
    summary: 'Cicatrice d’épisiotomie, sécheresse, périnée contracté, appréhension : les douleurs lors des rapports après un accouchement sont fréquentes et méritent d’être prises en charge.',
    category: 'sexualite', tags: ['douleurs rapports après accouchement', 'dyspareunie', 'épisiotomie', 'sécheresse vaginale', 'périnée', 'rééducation périnéale', 'déchirure', 'post-partum'],
    min_age_months: 0, max_age_months: 24, journeys: ['newborn'],
    sources: [S.qsDyspareunie, S.hasReeducation, S.qsApresBebe],
    body_md: `## En bref
- Avoir mal pendant ou après un rapport **n’est pas une fatalité** : QuestionSexualité rappelle qu’il ne faut pas s’y résigner, et que des solutions existent quelle que soit la cause.
- Après un accouchement, ces douleurs sont **fréquentes** : des études citées par la HAS rapportent des douleurs chez une part importante des femmes à 2 mois.
- Les causes possibles : **cicatrice** d’épisiotomie ou de déchirure, **sécheresse** vaginale (notamment en allaitant), **périnée** contracté, appréhension.
- La sage-femme, le médecin ou le gynécologue sont les premiers interlocuteurs ; la **rééducation périnéale** peut aider.

## Comprendre
**Un problème fréquent et sous-estimé.** Le rapport de la HAS (anciennement ANAES) sur la rééducation post-partum, publié en 2002, cite une étude britannique où 53 % des femmes déclaraient une douleur lors des rapports deux mois après l’accouchement. Les douleurs du périnée étaient plus fréquentes après une épisiotomie qu’avec un périnée intact.

**Les causes possibles** (QuestionSexualité)
- Une lubrification insuffisante ou une **sécheresse vaginale**, fréquente après l’accouchement et pendant l’allaitement.
- Une **cicatrice d’épisiotomie** ou de déchirure.
- Un **dysfonctionnement musculaire du périnée** (contraction).
- Une infection (mycose, infection sexuellement transmissible).
- Des facteurs psychologiques, une fois les causes physiques écartées : un **accouchement vécu comme difficile**, l’anxiété, un état dépressif, des tensions dans le couple. La douleur est alors bien réelle.

Sans prise en charge, ces douleurs peuvent entraîner une baisse du désir et des difficultés de couple.

**Le rôle de la rééducation.** Selon la HAS, la rééducation périnéale n’est pas systématique : elle découle des symptômes et de l’examen de la consultation postnatale. Des douleurs périnéales persistantes, surtout avec des douleurs lors des rapports, en font partie des indications. À la consultation postnatale, le professionnel interroge sur la douleur (où, quand, quelle intensité) et sur ses conséquences sur la vie quotidienne et sexuelle.

## Au quotidien
- **Ne forcez pas** : si c’est douloureux, arrêtez. Avoir mal peut nourrir l’appréhension du rapport suivant.
- **Utilisez un gel lubrifiant**, premier geste conseillé par QuestionSexualité ; demandez au pharmacien un produit compatible avec les préservatifs si vous en utilisez.
- **Prenez votre temps** : préliminaires plus longs, positions qui vous permettent de contrôler la profondeur et le rythme.
- **Explorez d’autres formes de plaisir** que la pénétration le temps de la récupération.
- **Parlez-en à votre partenaire** : il ou elle ne mesure pas toujours la douleur ressentie.
- **Notez** ce qui déclenche la douleur (entrée du vagin, en profondeur, après le rapport) pour le décrire au professionnel.
- Les crèmes anesthésiantes diminuent aussi la sensibilité : demandez conseil à un médecin ou un pharmacien avant de les utiliser.

## Questions fréquentes
**À qui en parler ?**
À la sage-femme, au médecin traitant ou au gynécologue en premier. Un masseur-kinésithérapeute formé au périnée, un sexologue ou un psychologue peuvent compléter la prise en charge.

**La rééducation périnéale est-elle remboursée ?**
QuestionSexualité indique qu’elle est prise en charge à 100 % par l’Assurance maladie lorsqu’elle est prescrite, en général après la consultation postnatale.

**J’ai mal à cause du souvenir de l’accouchement.**
Un accouchement vécu comme difficile peut laisser une appréhension qui se manifeste dans le corps. En parler à un professionnel, sage-femme ou psychologue, permet souvent d’avancer.

**Combien de temps cela dure-t-il ?**
C’est très variable. Le rapport de la HAS cite des douleurs encore présentes chez une partie des femmes plus d’un an après l’accouchement : ne restez pas seule avec ce problème.

## Quand demander conseil
Consultez si la douleur persiste au-delà des premières semaines, si elle empêche les rapports, si la cicatrice est rouge, gonflée ou suinte, en cas de fièvre, de pertes inhabituelles ou de saignements anormaux. Si la douleur s’accompagne d’une grande tristesse ou d’une anxiété envahissante, parlez-en aussi. ${PSY} En cas de rapports imposés ou de violences, appelez le **3919** ou, en danger, le **17** ou le **112**.

${FIN}`,
  }),
  a({
    slug: 'desir-fatigue-et-couple-apres-bebe',
    title: 'Désir, fatigue et couple après bébé',
    summary: 'Nuits courtes, charge mentale, corps qui change : comment préserver le lien amoureux pendant les premiers mois, sans culpabilité et en avançant au rythme de chacun.',
    category: 'sexualite', tags: ['couple après bébé', 'désir après bébé', 'fatigue parents', 'charge mentale', 'libido post-partum', 'vie de couple', 'tendresse', 'conseiller conjugal'],
    min_age_months: 0, max_age_months: 36, journeys: ['newborn', 'parents_sleep'],
    sources: [S.qsApresBebe, S.psycomParents, S.spfAllaitement],
    body_md: `## En bref
- Après une naissance, chaque couple doit trouver un **nouvel équilibre** entre son rôle d’amants et son rôle de parents (QuestionSexualité).
- La **fatigue**, l’**image du corps**, les **émotions** et la **charge mentale** pèsent souvent sur le désir, chez l’un comme chez l’autre.
- **Partager équitablement** les tâches et les soins au bébé laisse plus de place au désir.
- La reprise des relations intimes se fait **quand la mère est prête** : c’est une affaire de couple (guide de l’allaitement de Santé publique France).

## Comprendre
**Un bouleversement pour les deux.** Psycom rappelle qu’après la naissance, la vie de couple, la famille et le quotidien se réorganisent, et que devenir parent peut réveiller des angoisses liées à sa propre enfance. Chacun peut ressentir de la culpabilité, des doutes, et hésiter à en parler par peur d’être jugé.

**Ce qui freine le désir** (QuestionSexualité)
- La **fatigue** : un nouveau-né demande de l’attention jour et nuit.
- L’**image de soi** : ventre, seins, vergetures changent, et chacune se réapproprie son corps à son rythme.
- Les **émotions** : baby blues fréquent, parfois chez le père aussi.
- La **charge mentale**, souvent portée par les femmes, qui laisse peu de place au désir.
- L’**allaitement**, qui modifie les hormones et peut diminuer le désir chez certaines femmes.

**Le second parent aussi.** Le désir, la fatigue et l’inquiétude concernent les deux parents. Psycom souligne qu’un père peut se sentir désemparé si sa compagne ne va pas bien, et que la dépression périnatale touche aussi environ un homme sur dix.

## Au quotidien
**Prendre soin du lien**
- Gardez des **gestes de tendresse** au quotidien : un câlin, une main sur l’épaule, un mot gentil.
- Prévoyez des **moments à deux**, même courts : un repas, une promenade, une soirée sans écrans.
- Parlez de **vos besoins** respectifs sans reproches : « j’ai besoin de dormir », « tu me manques ».

**Alléger la fatigue**
- Faites la liste de ce qui doit vraiment être fait et de ce qui peut attendre.
- Répartissez clairement : courses, repas, lessive, change, bain, nuits.
- Acceptez l’aide de l’entourage ou renseignez-vous sur l’aide à domicile (Caf, PMI).
- Alternez les nuits ou les siestes quand c’est possible.

**Le désir**
- Il se construit aussi par l’imagination, les mots et les caresses, rappelle QuestionSexualité.
- Ne vous comparez pas à d’autres couples : chacun avance à son rythme.
- Si vous allaitez, une tétée avant un moment d’intimité peut limiter les fuites de lait.

## Questions fréquentes
**Nous ne faisons plus l’amour depuis des mois. Est-ce grave ?**
Il n’y a pas de norme. Ce qui compte, c’est que chacun puisse en parler et que la situation ne devienne pas une source de souffrance. Sinon, un professionnel peut vous aider.

**Mon partenaire se sent mis de côté.**
C’est un ressenti fréquent. Lui proposer de participer aux soins du bébé, parler ensemble et prévoir des moments à deux aide chacun à trouver sa place.

**Nous nous disputons beaucoup depuis la naissance.**
La fatigue et la nouvelle organisation créent souvent des tensions. Psycom cite l’augmentation des conflits parmi les signes possibles de dépression chez le père : si l’irritabilité ou le repli s’installent, parlez-en à un professionnel.

**Qui peut nous aider ?**
Une sage-femme, un psychologue, un sexologue ou un conseiller conjugal. QuestionSexualité cite l’Association française des centres de consultation conjugale.

## Quand demander conseil
Consultez si la fatigue devient épuisement, si l’un de vous se sent triste, vide ou irritable depuis plus de deux semaines, si les disputes deviennent violentes, ou si la sexualité est source de souffrance. ${PSY} En cas de violences conjugales, appelez le **3919** ou, en danger, le **17** ou le **112**. ${ENF}

${FIN}`,
  }),
  // ------------------------------------------------------------ second parent et entourage
  a({
    slug: 'second-parent-et-allaitement-comment-soutenir',
    title: 'Le second parent et l’allaitement : comment soutenir au quotidien',
    summary: 'Peau à peau, gestion des visites, soins au bébé, tâches de la maison, biberon de lait maternel : le rôle essentiel du père ou du co-parent dans un allaitement serein.',
    category: 'post-partum', tags: ['père allaitement', 'co-parent allaitement', 'soutenir allaitement', 'peau à peau papa', 'lait maternel biberon', 'second parent', 'visites maternité', 'tire-lait'],
    min_age_months: 0, max_age_months: 24, journeys: ['pregnant', 'newborn'],
    sources: [S.spfAllaitement, S.mpjSoutienAllaitement, S.mpediaPapa],
    body_md: `## En bref
- Le soutien du partenaire **aide la mère à traverser les difficultés** et à gagner en assurance ; il aide aussi à comprendre les signaux du bébé (1000 premiers jours).
- Avant la naissance : s’informer **ensemble** (séances de préparation, réunions d’associations de soutien à l’allaitement).
- Après la naissance : **peau à peau**, protection du calme et du repos, soins au bébé, tâches de la maison.
- Un **biberon de lait maternel** donné par le partenaire est possible ponctuellement, une fois l’allaitement bien installé.

## Comprendre
Le guide de l’allaitement maternel de Santé publique France (2023) consacre une large place au partenaire. Il rappelle qu’un père mieux informé soutient souvent davantage la mère, et que le projet d’allaiter peut se réfléchir à deux.

Pour le Dr Daniel Marcelli (mpedia), juste après la naissance, la mère vit souvent quelques semaines de grande proximité avec son bébé. Le second parent peut se glisser peu à peu dans cette « bulle », sans s’interposer, en participant aux soins et aux tâches, ce qui permet à la mère de se reposer des tétées de nuit. Il crée son propre lien en berçant l’enfant, en lui parlant, en le regardant.

Allaiter n’empêche donc pas l’autre parent de nourrir la relation avec le bébé : le bain, le change, le portage, l’endormissement sont autant de moments à lui.

## Au quotidien
**Pendant la grossesse**
- Participez aux séances de préparation à la naissance et à la parentalité, et, si possible, à une réunion d’association de soutien à l’allaitement.
- Lisez ensemble le guide de l’allaitement ; repérez à l’avance les personnes ressources (sage-femme, consultante en lactation, PMI).

**À la maternité**
- Après une césarienne, si la mère ne peut pas prendre tout de suite le bébé contre elle, vous pouvez faire du **peau à peau** en attendant.
- Veillez à **limiter le nombre de visites** en même temps pour préserver le calme.

**À la maison**
- Prenez en charge une grande partie des **tâches** : repas, courses, ménage, aînés.
- Apportez un verre d’eau, un coussin, une collation au moment des tétées.
- Occupez-vous du **bain**, du **change**, du **portage** ; en fin de journée, quand bébé pleure, vous pouvez le porter, le masser, le promener en écharpe.
- Si les pleurs deviennent difficiles à supporter : couchez bébé sur le dos dans son lit, quittez la pièce pour souffler, revenez régulièrement. **Ne secouez jamais un bébé.**
- Aidez à trouver de l’aide : entourage, PMI, aide à domicile via la Caf.

**Le biberon de lait maternel**
- La mère peut tirer son lait pour que vous le donniez en son absence. Une fois la lactation bien établie et le bébé habitué au sein, un biberon occasionnel ne pose pas de problème selon le guide.
- Le lait se donne au biberon, à la tasse, à la cuillère ou à la pipette ; respectez les règles de conservation (48 heures au réfrigérateur, 4 mois au congélateur).
- Le guide déconseille les biberons de complément sans indication médicale, car ils peuvent réduire la production de lait.

## Questions fréquentes
**Je me sens inutile pendant les tétées.**
Votre présence compte. Mpedia suggère de vous installer tout contre la mère et le bébé pendant la tétée. Et tout le reste du temps, vos soins créent votre propre lien.

**Faut-il que je donne un biberon la nuit pour qu’elle dorme ?**
Le guide recommande à la mère d’allaiter la nuit, berceau près d’elle, car ces tétées entretiennent la production de lait. Vous pouvez en revanche vous lever pour le change, le rot, le recoucher.

**Elle a mal en allaitant. Que faire ?**
Encouragez-la à consulter rapidement une sage-femme, une consultante en lactation ou la PMI : la douleur se prend en charge.

**Et si l’allaitement s’arrête plus tôt que prévu ?**
Votre rôle est de soutenir son choix, quel qu’il soit, sans jugement.

## Quand demander conseil
Contactez la sage-femme, la PMI ou le médecin si la mère a une douleur intense, de la fièvre, un sein rouge et chaud, si le bébé tète peu, mouille peu ses couches ou prend mal du poids. Si l’un de vous se sent épuisé, triste ou irritable depuis plus de deux semaines, parlez-en. ${PSY} ${URG}

${FIN}`,
  }),
  a({
    slug: 'second-parent-se-preparer-naissance-sejour-maternite',
    title: 'Second parent : se préparer à la naissance et au séjour à la maternité',
    summary: 'Séances de préparation, rôle pendant l’accouchement, premiers jours à la maternité, démarches et retour à la maison : une feuille de route pour le père ou le co-parent.',
    category: 'accouchement', tags: ['futur papa', 'co-parent accouchement', 'préparation naissance père', 'maternité second parent', 'salle de naissance', 'déclaration de naissance', 'retour maison', 'congé paternité'],
    min_week: 20, max_week: 42, journeys: ['pregnant', 'newborn'],
    sources: [S.santePnp, S.ameliMaternite, S.ameliRetourMaison],
    body_md: `## En bref
- La femme enceinte a droit à **7 séances** de préparation à la naissance et à la parentalité ; l’**autre parent peut assister à certaines**, dont certaines sont ouvertes aux futurs pères (Santé.fr).
- Pendant l’accouchement, votre rôle : **présence, soutien, relais** avec l’équipe, et respect des choix de la future mère.
- À la maternité, le séjour a duré en moyenne **3,7 jours** en 2021 (ameli) : c’est le moment d’apprendre les soins au bébé.
- La **déclaration de naissance** se fait en mairie **dans les 5 jours** ; l’enfant peut être inscrit sur la carte Vitale de l’autre parent.

## Comprendre
**Les séances de préparation.** Selon Santé.fr, elles commencent par l’entretien prénatal précoce, idéalement au premier trimestre, puis se déroulent le plus souvent à partir du 7e mois, en groupe ou parfois en individuel. Elles abordent la grossesse, l’accouchement, les suites de couches, les besoins du bébé et le retour à la maison. Un père témoigne y avoir appris à aider sa compagne « plutôt que d’être simple spectateur ». Ces séances sont prises en charge à 100 % lorsqu’elles sont assurées par un médecin ou une sage-femme.

**À la maternité** (ameli). Après un accouchement par voie basse, la mère reste au moins deux heures en salle de naissance, sous surveillance. En suites de couches, la sage-femme l’examine chaque jour et évalue son moral. L’équipe vous montre aussi la toilette, le change, l’allaitement ou les biberons, et vous aide à décoder les pleurs. La durée moyenne de séjour était de 3,7 jours en 2021.

**Le retour à la maison** (ameli). Une sage-femme peut suivre la mère et le bébé à domicile jusqu’au 12e jour ; en cas de sortie précoce, le dispositif PRADO organise sa visite dans les 24 heures. La consultation postnatale a lieu dans les 6 à 8 semaines.

## Au quotidien
**Pendant la grossesse**
- Participez à l’entretien prénatal précoce si la future mère le souhaite, et aux séances ouvertes aux pères ou co-parents.
- Repérez le trajet vers la maternité, le parking, l’entrée de nuit.
- Préparez avec elle la valise et les papiers ; gardez les numéros utiles dans votre téléphone.
- Organisez à l’avance la garde des aînés et des animaux.
- Renseignez-vous auprès de votre employeur sur vos congés.

**Le jour J**
- Restez disponible et attentif : massages, boissons si autorisées, encouragements, présence calme.
- Faites le lien avec l’équipe sans parler à la place de la future mère.
- Si l’accouchement ne se passe pas comme prévu, vous pouvez ressentir de la peur : n’hésitez pas à en parler ensuite à l’équipe ou à un professionnel.

**À la maternité et après**
- Participez aux premiers soins : change, bain, peau à peau.
- Filtrez les visites pour préserver le repos.
- Faites la déclaration de naissance en mairie dans les 5 jours, puis l’affiliation auprès de la CPAM via le compte ameli.
- Au retour, prenez en charge les repas, les courses et l’organisation de la maison.

## Questions fréquentes
**Puis-je assister à toutes les séances de préparation ?**
Certaines seulement sont ouvertes à l’autre parent. Renseignez-vous auprès de la sage-femme qui les anime.

**Puis-je rester la nuit à la maternité ?**
Cela dépend des établissements. Posez la question lors de l’inscription ou de la visite de la maternité.

**Je ne me sens pas à la hauteur.**
Beaucoup de futurs parents ressentent cela. Les séances de préparation, la sage-femme et la PMI sont là pour vous accompagner.

**Quand faire la déclaration de naissance ?**
Selon l’Assurance maladie, elle se fait en mairie dans les 5 jours qui suivent la naissance. Renseignez-vous à l’avance sur les pièces demandées par la mairie du lieu de naissance ; le second parent peut s’en charger pendant que la mère est encore à la maternité.

## Quand demander conseil
Appelez la maternité ou le **15** en cas de saignements abondants, de perte des eaux, de contractions régulières avant terme, de fièvre, de maux de tête intenses ou de diminution des mouvements du bébé. Après la naissance, consultez si la mère a de la fièvre, des saignements très abondants ou une douleur au mollet, ou si vous la trouvez très triste ou confuse. ${URG} ${PSY}

${FIN}`,
  }),
  a({
    slug: 'grands-parents-entourage-demander-et-organiser-l-aide',
    title: 'Grands-parents et entourage : demander et organiser l’aide',
    summary: 'Dire ce dont vous avez besoin, répartir les coups de main, accueillir les conseils sans vous laisser déborder et connaître l’aide à domicile proposée par la Caf.',
    category: 'vie-pratique', tags: ['grands-parents', 'aide entourage', 'demander de l’aide', 'conseils famille', 'visites', 'aide à domicile caf', 'TISF', 'famille élargie'],
    min_age_months: 0, max_age_months: 36, journeys: ['pregnant', 'newborn'],
    sources: [S.santeVieFamille, S.cafAad, S.psycomParents],
    body_md: `## En bref
- L’arrivée d’un bébé **transforme toute la famille** : les parents deviennent grands-parents, les frères et sœurs oncles et tantes. Une source de joie, parfois aussi de tensions (Santé.fr).
- Pour bien vivre cette période : **communiquer, exprimer ses besoins, écouter ceux des autres**, et prendre du recul face aux nombreux conseils.
- L’entourage peut aider concrètement : **repas, courses, aînés, garde ponctuelle** pour que vous puissiez souffler.
- Si l’entourage est loin ou ne suffit pas, la **Caf** cofinance une **aide et un accompagnement à domicile** pendant la grossesse et jusqu’aux 2 ans de l’enfant.

## Comprendre
**Un nouvel équilibre.** Santé.fr (contenu 1000 premiers jours) rappelle que l’arrivée d’un bébé change les places de chacun dans la famille élargie. Les grands-parents peuvent avoir leurs habitudes, leurs souvenirs et leurs idées sur la façon de faire. Les conseils, même bienveillants, peuvent être nombreux et parfois contradictoires avec ceux des professionnels.

**Vous êtes les parents.** Faire confiance à son ressenti fait partie des conseils de Santé.fr : vous connaissez votre enfant. Accueillir l’expérience des grands-parents n’oblige pas à tout appliquer.

**Pourquoi demander de l’aide.** Psycom cite le manque de soutien et le manque chronique de sommeil parmi les situations qui fragilisent la santé mentale des parents, et propose comme pistes de répit de confier les enfants à un proche, de déléguer et de rencontrer d’autres parents.

**L’aide à domicile de la Caf.** Selon caf.fr (actualité du 5 octobre 2026), l’aide et l’accompagnement à domicile s’adresse aux familles qui vivent un événement bouleversant l’équilibre familial, dont la grossesse, la naissance (jusqu’aux 2 ans de l’enfant) ou l’adoption. Les interventions sont assurées par un accompagnant éducatif et social (AES) ou un technicien de l’intervention sociale et familiale (TISF). Une participation est demandée selon le quotient familial. La demande se fait directement auprès d’un service d’aide à domicile conventionné, jusqu’à un an après l’événement.

## Au quotidien
**Dire ce dont vous avez besoin**
- Faites une liste concrète : un repas par semaine, les courses, la lessive, emmener l’aîné à l’école, garder bébé une heure pour une sieste.
- Quand on vous demande « Tu as besoin de quelque chose ? », répondez par une tâche précise.
- Proposez à chacun ce qu’il aime faire : cuisiner, se promener avec la poussette, jouer avec l’aîné.

**Organiser les visites**
- Fixez des créneaux courts, à des moments où vous êtes disponibles.
- Demandez qu’on prévienne avant de passer, et qu’on évite de venir malade.
- Invitez les visiteurs à s’intéresser aussi aux aînés, conseil de Santé.fr pour accompagner la fratrie.

**Accueillir les conseils**
- Remerciez, écoutez, puis décidez à deux : « Merci, on va y réfléchir. »
- Sur la santé et la sécurité (couchage, alimentation, siège auto), appuyez-vous sur l’avis de votre médecin, de la sage-femme ou de la PMI, et partagez-le avec les grands-parents.
- Quand bébé dort chez eux, transmettez par écrit vos habitudes : couchage sur le dos, préparation des biberons, numéros utiles.

**Si l’entourage est loin**
- Les appels vidéo gardent le lien.
- Renseignez-vous auprès de la Caf, de la PMI et des lieux d’accueil enfants-parents de votre ville.

## Questions fréquentes
**Les grands-parents s’imposent trop. Comment le dire ?**
Exprimez vos besoins calmement, en parlant de vous : « Nous avons besoin de calme ces jours-ci. » Proposez une autre façon d’aider.

**Ma mère critique mes choix.**
Les désaccords sont fréquents. Rappelez que les recommandations évoluent et que vous suivez celles des professionnels. Si les tensions persistent, une médiation familiale peut aider.

**Je n’ose pas demander, j’ai peur de déranger.**
Beaucoup de proches attendent qu’on leur dise comment aider. Accepter de l’aide n’est pas un aveu de faiblesse.

**L’aide à domicile de la Caf, est-ce pour tout le monde ?**
Elle s’adresse aux allocataires du régime général qui attendent un enfant ou ont un enfant à charge et vivent un événement comme une naissance. Le service d’aide à domicile évalue votre situation.

## Quand demander conseil
Parlez-en à la sage-femme, à la PMI ou au médecin si vous vous sentez isolée, épuisée, si vous n’arrivez plus à dormir même quand bébé dort, ou si la tristesse s’installe. Si des tensions familiales deviennent violentes, appelez le **17** ou le **112**. ${PSY} ${ENF}

${FIN}`,
  }),
  // ------------------------------------------------------------ santé mentale
  a({
    slug: 'anxiete-du-post-partum-reperer-et-se-faire-aider',
    title: 'Anxiété du post-partum : la repérer et se faire aider',
    summary: 'Inquiétude permanente pour le bébé, hypervigilance, sommeil impossible même quand il dort : l’anxiété après la naissance est fréquente, se repère et se soigne.',
    category: 'sante-mentale', tags: ['anxiété post-partum', 'angoisse après accouchement', 'peur pour bébé', 'hypervigilance', 'crise d’angoisse', 'santé mentale périnatale', 'entretien postnatal', 'Mon soutien psy'],
    min_age_months: 0, max_age_months: 24, journeys: ['newborn', 'parents_sleep'], safety_critical: true,
    sources: [S.ameliToc, S.psycomBrochure, S.psycomParents],
    body_md: `## En bref
- Environ **15 % des parents** seraient concernés par des troubles anxieux pendant la période périnatale (Psycom).
- Les signes fréquents : **inquiétude excessive** pour le bébé ou sa capacité à être parent, **hypervigilance**, **troubles du sommeil** et de la concentration, symptômes physiques (douleurs, maux de tête), repli sur soi (ameli).
- L’anxiété est souvent **mêlée à la dépression** du post-partum ; les deux se soignent.
- Les **entretiens et consultations** après la naissance sont des moments pour en parler ; une **psychothérapie** est recommandée quelle que soit la sévérité.

## Comprendre
**Une période propice à l’anxiété.** Psycom rappelle que la grossesse et la naissance entraînent des changements corporels, émotionnels et identitaires. Le manque de sommeil, un accouchement différent de ce qui était prévu, un bébé né prématurément ou des difficultés d’allaitement peuvent peser.

**Ce qui la caractérise** (ameli, espace professionnel sage-femme)
- Une anxiété excessive et anticipatoire : pour le bébé, pour sa santé, pour sa capacité à être mère.
- Une hypervigilance : vérifier sans cesse que le bébé respire, ne pas réussir à le confier.
- Des troubles du sommeil et de la concentration.
- Des symptômes physiques marqués, comme des douleurs ou des maux de tête.
- Un repli sur soi.
- Un risque de consommer de l’alcool ou d’autres substances pour calmer l’angoisse.
Les principaux troubles anxieux sont le trouble anxieux généralisé et le trouble panique (crises d’angoisse).

**Les facteurs de risque** cités par ameli : antécédents d’anxiété, de TOC ou de dépression, événement très stressant, antécédents de traumatisme, précarité, faible soutien, problème de santé de la mère ou du bébé.

**Le second parent aussi.** Psycom souligne que l’anxiété peut toucher les pères, par exemple après un accouchement difficile, avec la peur d’avoir perdu sa compagne ou son bébé.

## Au quotidien
**Ce qui aide, selon ameli**
- Protéger son **sommeil** autant que possible : relais la nuit, siestes quand bébé dort.
- Lutter contre l’**isolement** : parler à des proches, à d’autres parents.
- Manger équilibré, éviter l’alcool, arrêter le tabac.
- Bouger un peu chaque jour, de façon adaptée.

**Des gestes simples au quotidien**
- Notez vos inquiétudes sur un carnet pour les poser au professionnel plutôt que de les ressasser.
- Limitez les recherches répétées sur internet, qui entretiennent souvent l’angoisse.
- Ralentissez, ménagez-vous des moments calmes, parlez de vos peurs avec votre partenaire (Psycom).

**Les rendez-vous pour en parler**
- Les visites de la sage-femme jusqu’au 12e jour, l’**entretien postnatal précoce** entre la 4e et la 8e semaine, la **consultation postnatale** entre la 6e et la 8e semaine.
- Le dispositif **Mon soutien psy** permet des séances chez un psychologue conventionné, remboursées par l’Assurance maladie, pour une souffrance psychique légère à modérée.
- Les psychologues de PMI et les centres médico-psychologiques (CMP) peuvent aussi vous recevoir.

## Questions fréquentes
**Toutes les mères s’inquiètent. Comment savoir si c’est trop ?**
Quand l’inquiétude est presque permanente, empêche de dormir même quand bébé dort, de se détendre, de confier le bébé, ou quand elle s’accompagne de crises d’angoisse, il est utile d’en parler à un professionnel.

**Les médicaments sont-ils compatibles avec l’allaitement ?**
Signalez toujours que vous allaitez : le médecin adapte le traitement. La psychothérapie peut suffire dans les formes légères à modérées.

**Je n’ose pas en parler, j’ai peur qu’on me juge.**
C’est une crainte fréquente. Les professionnels de la périnatalité sont formés à ces difficultés : en parler, c’est prendre soin de vous et de votre bébé.

**Existe-t-il des lignes d’écoute ?**
Psycom cite notamment Allo Parents bébé (0 800 003 456) et l’association Maman Blues.

## Quand demander conseil
Consultez rapidement votre médecin, votre sage-femme ou la PMI si l’angoisse vous empêche de dormir ou de manger, si vous avez des crises d’angoisse, si vous évitez de rester seule avec votre bébé, ou si la tristesse s’installe plus de deux semaines. En cas d’idées suicidaires, appelez le **3114** ou rendez-vous aux urgences. Si vous ne dormez plus du tout, entendez ou voyez des choses inhabituelles, ou craignez de vous faire du mal ou de faire du mal à votre bébé, appelez le **15** ou le **112**. ${ENF}

${FIN}`,
  }),
  a({
    slug: 'pensees-intrusives-toc-du-post-partum',
    title: 'Pensées intrusives et TOC du post-partum : comprendre et se faire aider',
    summary: 'Des images effrayantes de faire du mal à son bébé qui s’imposent et horrifient : ce que sont les pensées intrusives, quand on parle de TOC, et vers qui se tourner sans honte.',
    category: 'sante-mentale', tags: ['pensées intrusives', 'TOC post-partum', 'phobie d’impulsion', 'peur de faire du mal à bébé', 'obsessions', 'vérifications', 'anxiété post-partum', 'TCC'],
    min_age_months: 0, max_age_months: 24, journeys: ['newborn', 'parents_sleep'], safety_critical: true,
    sources: [S.ameliToc, S.psycomToc, S.psycomParents],
    body_md: `## En bref
- Les **pensées intrusives** sont des idées ou images qui s’imposent, répétitives et dérangeantes ; **tout le monde en a parfois** (Psycom).
- Après une naissance, elles prennent souvent la forme d’une **peur de faire du mal à son bébé** (« phobie d’impulsion »), accompagnée de vérifications ou de rituels (ameli).
- Dans le **TOC**, ces pensées deviennent envahissantes et douloureuses, et la personne les **vit comme étrangères** à ses désirs.
- Ces troubles **se soignent**, notamment par une thérapie cognitive et comportementale ; en parler est la première étape.

## Comprendre
**Ce que sont les obsessions.** Psycom les décrit comme des idées, images ou impulsions intrusives, répétitives et inappropriées, dont la personne essaie de se débarrasser sans y parvenir. La plupart des personnes savent que leurs pensées sont exagérées ou absurdes, mais elles les prennent au sérieux et en ressentent une forte angoisse. Parmi les thèmes fréquents : les **obsessions agressives**, c’est-à-dire la peur de perdre le contrôle et de blesser quelqu’un, sans aucun désir de passer à l’acte.

**Après la naissance.** L’Assurance maladie (espace sage-femme) décrit, dans le TOC du post-partum, la **peur de faire du mal à son bébé**, avec une crainte irrationnelle de commettre un acte violent ou irréparable, et des compulsions mentales (répéter des mots, vérifier). Psycom cite aussi la peur de se faire du mal ou de faire du mal à son bébé parmi les symptômes possibles de la dépression du post-partum. Le TOC peut apparaître ou s’aggraver après un événement de vie comme une naissance.

**Le cercle vicieux.** La pensée surgit, l’angoisse monte, la personne cherche à la neutraliser : éviter de donner le bain, cacher les couteaux, ne plus rester seule avec le bébé, demander sans cesse d’être rassurée. Le soulagement est bref, et la pensée revient plus fort. L’évitement entretient la peur (Psycom).

**Une différence importante.** Dans les pensées intrusives et le TOC, la personne est **horrifiée** par ses pensées. C’est très différent de la **psychose du post-partum**, rare, où la personne perd le contact avec la réalité (idées délirantes, hallucinations, agitation, perte totale de sommeil) : c’est une urgence médicale.

## Au quotidien
- **Nommez ce qui se passe** : « c’est une pensée intrusive, pas une envie ». Psycom explique que la psychoéducation aide à considérer ces pensées comme des symptômes et non comme des menaces réelles.
- **Parlez-en** à une personne de confiance et à un professionnel : la honte entretient le secret, le secret entretient le trouble.
- **Évitez de tout réorganiser autour des peurs** : l’entourage, même bienveillant, renforce le TOC en participant aux rituels. Mieux vaut convenir avec lui d’un cadre, par exemple limiter les demandes de réassurance.
- **Prenez soin de vous** : sommeil, repas, sortir, ne pas rester seule toute la journée.
- **Pour le partenaire** : écoutez sans juger ni tourner les rituels en dérision, et aidez à prendre rendez-vous.

**Les soins.** Psycom indique que la **thérapie cognitive et comportementale** (TCC) est le traitement recommandé en premier, avec une technique spécifique d’exposition progressive. Des médicaments peuvent être proposés en complément ; signalez au médecin la grossesse ou l’allaitement. La psychothérapie peut débuter sans attendre, avec Mon soutien psy, un psychologue de PMI ou un CMP, en parallèle d’un avis médical (ameli).

## Questions fréquentes
**Avoir ces pensées veut-il dire que je suis dangereuse ?**
Dans le TOC, ces pensées sont vécues comme insupportables et contraires à ce que vous voulez : c’est justement ce qui les rend si angoissantes. Un professionnel peut évaluer la situation avec vous et vous aider.

**On va m’enlever mon bébé si j’en parle ?**
Les professionnels de la périnatalité connaissent ces pensées. En parler permet d’être aidée et soignée, pour vous et pour votre bébé.

**Le second parent peut-il en avoir ?**
Oui, les pensées intrusives peuvent toucher tout parent.

**Est-ce que ça passe tout seul ?**
Le TOC disparaît rarement seul, mais il se soigne bien avec un traitement adapté (Psycom).

## Quand demander conseil
Parlez-en dès que possible à votre médecin, votre sage-femme, la PMI ou un psychologue si ces pensées vous envahissent, si vous évitez des soins au bébé ou si les vérifications prennent beaucoup de temps. Appelez le **15** ou le **112** sans attendre si vous sentez que vous pourriez passer à l’acte, si vous ne dormez plus du tout, si vous entendez ou voyez des choses inhabituelles, ou si un proche semble confus ou coupé de la réalité. En cas d’idées suicidaires, appelez le **3114**. ${ENF}

${FIN}`,
  }),
];
