/**
 * Guide complet « bébé de 0 à 2 ans » (27/10/2026) : toutes les questions des parents d'un tout-petit et de la mère après la naissance,
 * classées par catégorie. Articles rédigés avec l'aide d'une IA à partir de pages officielles françaises réellement consultées
 * le 2026-10-27 (ameli.fr, Santé.fr, mpedia.fr, service-public.gouv.fr, caf.fr, QuestionSexualité) : statut « À vérifier ».
 * Aucune quantité de lait ni aucun rythme n'est recommandé par l'application : ces repères relèvent du professionnel qui suit l'enfant.
 */
import type { ArticleSource, LibArticle } from '../library';

const C = '2026-10-27';
// Sources réellement consultées le 2026-10-27 (pages officielles françaises). `published` = date affichée par la page.
const S = {
  santeCordon: { label: 'Santé.fr (information mpedia) — Soin du cordon ombilical après la naissance', url: 'https://www.sante.fr/soin-du-cordon-ombilical-apres-la-naissance', consulted_on: C, published: '2022-01-20' },
  ameliBain: { label: 'ameli.fr — Comment bien donner le bain à un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/donner-bain-bebe', consulted_on: C, published: '2025-12-22' },
  ameliChange: { label: 'ameli.fr — Comment changer un nourrisson et faire sa toilette ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/changer-bebe-faire-toilette', consulted_on: C, published: '2025-12-22' },
  ameliRetourMaison: { label: 'ameli.fr — Après l’accouchement : le retour à la maison', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-domicile', consulted_on: C, published: '2026-08-27' },
  santeMaternite: { label: 'Santé.fr (information mpedia) — Soins et examens médicaux de mon bébé à la maternité', url: 'https://www.sante.fr/soins-et-examens-medicaux-de-mon-bebe-la-maternite', consulted_on: C, published: '2023-02-28' },
  santeJaunisse: { label: 'Santé.fr — Jaunisse du nourrisson', url: 'https://www.sante.fr/jaunisse-du-nourrisson', consulted_on: C, published: '2026-08-13' },
  santeBesoins04: { label: 'Santé.fr (information mpedia) — Entre 0 et 4 mois, quels sont les besoins alimentaires de mon bébé ?', url: 'https://www.sante.fr/entre-0-et-4-mois-quels-sont-les-besoins-alimentaires-de-mon-bebe', consulted_on: C, published: '2019-07-10' },
  ameliSuivi2mois: { label: 'ameli.fr — Examens de suivi médical jusqu’aux 2 mois du nourrisson', url: 'https://www.ameli.fr/assure/sante/themes/suivi-medical-de-l-enfant-et-de-l-adolescent/suivi-medical-jusqu-aux-2-mois-du-nourrisson', consulted_on: C },
  santeCarnet: { label: 'Santé.fr — Carnet de santé : à quoi sert-il ?', url: 'https://www.sante.fr/carnet-de-sante-quoi-sert-il', consulted_on: C, published: '2025-07-04' },
  ameliVaccins: { label: 'ameli.fr — Vaccination : pour les enfants et les adultes aussi', url: 'https://www.ameli.fr/assure/sante/assurance-maladie/campagnes-vaccination/calendrier-vaccinations-adulte-enfant', consulted_on: C, published: '2026-04-28' },
  mpediaMonteeLait: { label: 'mpedia.fr — Montée de lait : tout savoir pour bien la gérer et la soulager', url: 'https://www.mpedia.fr/art-gerer-la-montee-de-lait/', consulted_on: C, published: '2024-09-02' },
  mpediaSeins: { label: 'mpedia.fr — Prendre soin de ses seins pendant l’allaitement', url: 'https://www.mpedia.fr/art-allaitement-prendre-soin-de-ses-seins/', consulted_on: C, published: '2022-11-07' },
  mpediaTirerLait: { label: 'mpedia.fr — Techniques pour tirer et conserver son lait', url: 'https://www.mpedia.fr/art-tirer-et-conserver-son-lait/', consulted_on: C, published: '2021-01-15' },
  cafAllaitTravail: { label: 'caf.fr — Allaitement et travail, comment s’organiser ?', url: 'https://caf.fr/allocataires/vies-de-famille/articles/allaitement-et-travail-comment-s-organiser', consulted_on: C, published: '2026-10-05' },
  santeMixte: { label: 'Santé.fr (information mpedia) — L’allaitement mixte en pratique', url: 'https://www.sante.fr/lallaitement-mixte-en-pratique', consulted_on: C, published: '2024-09-02' },
  santeSevrage: { label: 'Santé.fr — Sevrage de l’allaitement : réussir l’arrêt progressif des tétées', url: 'https://www.sante.fr/conseils-pour-un-sevrage-de-bebe-reussi', consulted_on: C, published: '2026-09-14' },
  santeLait: { label: 'Santé.fr (information mpedia) — Quel lait infantile choisir ?', url: 'https://www.sante.fr/quel-lait-infantile-choisir', consulted_on: C, published: '2026-07-24' },
  sante4a6: { label: 'Santé.fr — Entre 4 et 6 mois : l’introduction des aliments en douceur', url: 'https://www.sante.fr/entre-4-et-6-mois-lintroduction-des-aliments-en-douceur', consulted_on: C, published: '2025-10-24' },
  santeDiversif: { label: 'Santé.fr (information mpedia) — Diversification alimentaire du bébé : le guide complet', url: 'https://www.sante.fr/commencer-la-diversification', consulted_on: C, published: '2026-09-21' },
  sante12a23: { label: 'Santé.fr — Alimentation du bébé de 12 à 23 mois : menus types et besoins nutritionnels', url: 'https://www.sante.fr/alimentation-du-bebe-de-12-23-mois-menus-types-et-besoins-nutritionnels', consulted_on: C, published: '2026-04-20' },
  ameliBronchio: { label: 'ameli.fr — Bronchiolite : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/bronchiolite/bons-reflexes', consulted_on: C },
  mpediaBronchio: { label: 'mpedia.fr — Bronchiolite du bébé : symptômes et traitement', url: 'https://www.mpedia.fr/art-bronchiolite-bebe/', consulted_on: C, published: '2023-09-28' },
  ameliRhino: { label: 'ameli.fr — Rhinopharyngite de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/rhinopharyngite-enfant/que-faire-cas-faut-consulter', consulted_on: C, published: '2026-02-05' },
  ameliGastro: { label: 'ameli.fr — Diarrhée et gastro-entérite de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/gastro-enterite-enfant/que-faire-quand-consulter', consulted_on: C, published: '2025-01-03' },
  santeColiques: { label: 'Santé.fr (information mpedia) — Coliques et pleurs du nourrisson, comment les décoder ?', url: 'https://www.sante.fr/coliques-et-pleurs-du-nourrisson-comment-les-decoder', consulted_on: C, published: '2022-04-27' },
  ameliDents: { label: 'ameli.fr — Les symptômes de la poussée dentaire', url: 'https://www.ameli.fr/assure/sante/themes/poussee-dentaire/symptomes-poussee-dentaire', consulted_on: C },
  santeSommeil: { label: 'Santé.fr (information Réseau Morphée) — Sommeil normal du bébé : de la naissance à 3 ans', url: 'https://www.sante.fr/sommeil-normal-du-bebe-de-la-naissance-3-ans', consulted_on: C, published: '2019-07-01' },
  mpediaNuits: { label: 'mpedia.fr — Rythme veille-sommeil, quand va-t-il « faire ses nuits » ?', url: 'https://www.mpedia.fr/art-aider-bebe-faire-ses-nuits/', consulted_on: C, published: '2023-01-13' },
  mpediaDev03: { label: 'mpedia.fr — Le développement psychomoteur des enfants de la naissance à 3 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-0-3-mois/', consulted_on: C, published: '2023-09-05' },
  mpediaDev69: { label: 'mpedia.fr — Le développement psychomoteur des enfants de 6 à 9 mois', url: 'https://www.mpedia.fr/art-developpement-psychomoteur-6-9-mois/', consulted_on: C, published: '2021-01-05' },
  santeDev912: { label: 'Santé.fr — Le développement psychomoteur des enfants de 9 à 12 mois', url: 'https://www.sante.fr/le-developpement-psychomoteur-des-enfants-de-9-12-mois', consulted_on: C, published: '2025-05-27' },
  mpediaMarche: { label: 'mpedia.fr — La marche, un apprentissage qui commence dès la naissance', url: 'https://www.mpedia.fr/art-apprentissage-marche/', consulted_on: C, published: '2021-01-05' },
  santeLangage212: { label: 'Santé.fr — Progrès du langage de 2 à 12 mois', url: 'https://www.sante.fr/progres-du-langage-de-2-12-mois', consulted_on: C, published: '2025-05-22' },
  santeLangage13: { label: 'Santé.fr (information mpedia) — Progrès du langage de 1 à 3 ans', url: 'https://www.sante.fr/progres-du-langage-de-1-3-ans', consulted_on: C, published: '2025-07-09' },
  mpediaJeux01: { label: 'mpedia.fr — Jeux de 0 à 1 an : choisir le bon, au bon moment', url: 'https://www.mpedia.fr/art-jeux-de-0-a-1-an/', consulted_on: C, published: '2021-01-05' },
  santeAccidents: { label: 'Santé.fr — Accidents domestiques : protéger au quotidien votre enfant', url: 'https://www.sante.fr/accidents-domestiques-proteger-au-quotidien-votre-enfant', consulted_on: C, published: '2026-01-26' },
  ameliInhale: { label: 'ameli.fr — Corps étranger inhalé par « fausse route »', url: 'https://www.ameli.fr/assure/sante/urgence/corps-etrangers/inhale', consulted_on: C, published: '2018-04-12' },
  ameliIntox: { label: 'ameli.fr — Intoxication par voie orale (par ingestion)', url: 'https://www.ameli.fr/assure/sante/urgence/accidents-domestiques/intoxication-voie-orale-ingestion', consulted_on: C, published: '2025-09-11' },
  mpediaSiege: { label: 'mpedia.fr — Quel siège auto choisir pour votre enfant ?', url: 'https://www.mpedia.fr/art-sieges-auto/', consulted_on: C, published: '2023-07-17' },
  santeChaleur: { label: 'Santé.fr (information RecoSanté) — Comment protéger votre santé et celle de vos enfants en cas de fortes chaleurs ?', url: 'https://www.sante.fr/comment-proteger-votre-sante-et-celle-de-vos-enfants-en-cas-de-fortes-chaleurs', consulted_on: C, published: '2025-07-17' },
  mpediaSoleil: { label: 'mpedia.fr — Comment protéger son enfant du soleil ?', url: 'https://www.mpedia.fr/art-soleil-quelles-protections/', consulted_on: C, published: '2023-07-06' },
  ameliBabyBlues: { label: 'ameli.fr — Après l’accouchement : baby blues et dépression du post-partum', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/baby-blues-depression-post-partum-grossesse', consulted_on: C, published: '2025-10-17' },
  santeSuiviApres: { label: 'Santé.fr — Le suivi médical après l’accouchement', url: 'https://www.sante.fr/le-suivi-medical-apres-laccouchement', consulted_on: C, published: '2024-08-09' },
  santeActivite: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — L’activité physique après l’accouchement', url: 'https://www.sante.fr/lactivite-physique-apres-laccouchement', consulted_on: C, published: '2021-12-03' },
  qsContraPost: { label: 'QuestionSexualité (Santé publique France) — Quelle contraception choisir après votre accouchement ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/ma-contraception-et-moi/quelle-contraception-choisir-apres-votre-accouchement', consulted_on: C },
  santeFamille: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — La vie de famille après la naissance', url: 'https://www.sante.fr/la-vie-de-famille-apres-la-naissance', consulted_on: C, published: '2024-08-26' },
  spDeclaration: { label: 'Service-Public.fr — Déclaration de naissance', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F961', consulted_on: C, published: '2026-06-18' },
  spPaternite: { label: 'Service-Public.fr — Congé de paternité et d’accueil de l’enfant d’un salarié du secteur privé', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F3156', consulted_on: C, published: '2026-06-01' },
  spNaissance: { label: 'Service-Public.fr — Un salarié peut-il prendre un congé de paternité à la suite de son congé de naissance ?', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F12647', consulted_on: C, published: '2026-06-01' },
  spCongeParental: { label: 'Service-Public.fr — Congé parental d’éducation à temps plein d’un salarié du secteur privé', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2280', consulted_on: C, published: '2026-06-01' },
  spGarde: { label: 'Service-Public.fr — J’ai besoin de faire garder mes enfants', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F601', consulted_on: C, published: '2025-09-01' },
  spCMG: { label: 'Service-Public.fr — Complément de libre choix du mode de garde (CMG) : emploi direct', url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F39152', consulted_on: C, published: '2026-06-26' },
} satisfies Record<string, ArticleSource>;

const END = 'Cet article informe et accompagne ; il ne remplace pas l’avis du médecin, de la sage-femme ou de la PMI qui connaissent votre enfant et votre situation.';

export const GUIDE_BEBE: LibArticle[] = [
  // ───────────────────────────── Allaitement, biberon, diversification ─────────────────────────────
  {
    slug: 'allaitement-crevasses-douleurs-mamelons',
    title: 'Allaitement : douleurs et crevasses aux mamelons',
    summary: 'Une douleur pendant la tétée est un signal à écouter : le plus souvent, corriger la position et la prise du sein permet de soulager et de cicatriser.',
    body_md: `Les premiers jours d'allaitement s'accompagnent souvent de sensations nouvelles dans les seins. Mais une douleur qui s'installe, ou des petites plaies sur le mamelon, ne sont pas un passage obligé : elles indiquent presque toujours qu'il y a quelque chose à ajuster, et l'aide d'un professionnel change souvent tout.

## En bref
- Une douleur persistante pendant les tétées mérite toujours d'en parler à un professionnel formé à l'allaitement.
- Les crevasses viennent le plus souvent d'une position du bébé ou d'une prise du sein à corriger.
- Un peu de lait maternel déposé sur le mamelon après la tétée, puis un séchage à l'air, aide la peau à cicatriser.
- Les crèmes nourrissent la peau mais ne suffisent pas si la prise du sein n'est pas corrigée.
- Une douche par jour suffit : laver les seins avant chaque tétée n'est pas utile.

## Comprendre
Une crevasse est une petite fissure de la peau du mamelon. Elle apparaît surtout quand le bébé ne prend pas assez de sein en bouche : il tète alors le bout du mamelon, qui frotte et s'abîme. Les succions prolongées « pour le réconfort », quand elles s'éternisent, peuvent aussi entretenir l'irritation.

Le lait maternel a des propriétés hydratantes et protectrices : c'est pourquoi on conseille d'en étaler un peu sur le mamelon après la tétée. Les crèmes à base de lanoline peuvent apporter du confort, mais la vraie cicatrisation passe par la correction de la prise du sein. Sans cela, la plaie risque de se rouvrir à chaque tétée, voire de s'infecter (par exemple par une mycose).

Côté hygiène, les gestes simples suffisent : se laver les mains avant la tétée, nettoyer à l'eau et au savon ce qui touche les seins ou la bouche du bébé, préférer des produits sans parfum. Laver les seins à chaque tétée efface leur odeur naturelle, qui aide le bébé à s'orienter.

## Au quotidien
- **Observez la prise du sein** : bouche grande ouverte, lèvres retroussées, menton contre le sein, une bonne partie de l'aréole en bouche. Si vous avez un doute, demandez à la sage-femme ou à une consultante en lactation d'observer une tétée.
- **Variez les positions** (madone, ballon de rugby, allongée) pour répartir les points de pression.
- **Pour retirer le bébé du sein**, glissez doucement un doigt au coin de sa bouche pour rompre la succion, plutôt que de tirer.
- **Après la tétée**, exprimez quelques gouttes de lait, étalez-les sur le mamelon et laissez sécher à l'air libre.
- **Changez souvent les coussinets** d'allaitement pour garder la peau au sec.
- **Notez ce qui soulage** et ce qui aggrave : cela aidera le professionnel à comprendre la situation.

## Questions fréquentes
**Est-ce que ça doit faire mal au début ?**
Une sensibilité les premiers jours peut exister, mais selon les professionnels de l'allaitement, une vraie douleur n'a pas à être supportée : elle doit amener à consulter pour trouver ce qui la provoque.

**Faut-il arrêter d'allaiter avec des crevasses ?**
Pas forcément. Le plus souvent, on corrige la position et la prise du sein et l'allaitement continue. Si la douleur est trop forte, un professionnel peut proposer des solutions temporaires (tirer son lait du côté abîmé, par exemple).

**Les bouts de sein en silicone règlent-ils le problème ?**
Ils peuvent dépanner, mais ils ne corrigent pas la cause. Leur usage est à discuter avec un professionnel de l'allaitement.

**Faut-il désinfecter les seins ?**
Non : un produit antiseptique n'est pas nécessaire. Une douche quotidienne et des mains propres suffisent.

## Quand demander conseil
Parlez-en à votre sage-femme, à votre médecin, à la PMI ou à une consultante en lactation si :
- la douleur persiste au-delà de quelques tétées ou s'aggrave ;
- une crevasse ne cicatrise pas, saigne, ou se couvre de plaques blanches ;
- le sein devient rouge, chaud, douloureux, ou si vous avez de la fièvre (voir l'article sur l'engorgement et la mastite) ;
- votre bébé semble mal téter ou peu prendre de poids.

En cas d'urgence pour vous ou pour votre bébé, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allaitement', 'crevasses', 'douleur', 'mamelons', 'seins'],
    max_age_months: 24,
    sources: [S.mpediaSeins, S.mpediaMonteeLait],
    status: 'to_review',
  },
  {
    slug: 'allaitement-engorgement-mastite',
    title: 'Montée de lait, engorgement et mastite',
    summary: 'Les seins tendus de la montée de lait se soulagent avec quelques gestes simples ; fièvre ou douleur qui persiste doivent faire consulter rapidement.',
    body_md: `Quelques jours après la naissance, les seins changent : ils deviennent plus lourds, plus tendus, parfois douloureux. C'est la montée de lait. La plupart du temps, des gestes simples suffisent à passer ce cap. Il est aussi utile de savoir reconnaître ce qui doit faire consulter vite.

## En bref
- La montée de lait survient environ 3 à 5 jours après l'accouchement, parfois avec une légère fièvre.
- L'engorgement (seins gonflés, durs, douloureux) se soulage par des tétées fréquentes, de la chaleur avant et du froid entre les tétées.
- Une mastite est une inflammation du sein qui peut s'infecter : elle fait souvent suite à un engorgement non soulagé.
- Fièvre élevée ou qui dure, douleur qui persiste ou s'aggrave : consultez rapidement.

## Comprendre
Pendant les premiers jours, le bébé reçoit le colostrum, en petite quantité. Puis un lait « de transition », plus abondant, prend le relais : c'est la montée de lait. Les seins se gorgent de lait mais aussi de liquide (un œdème), ce qui les rend tendus et parfois difficiles à prendre en bouche pour le bébé.

L'engorgement correspond à ce gonflement important. Il n'est pas une maladie, mais s'il n'est pas soulagé, le lait stagne et une inflammation peut apparaître : c'est la mastite. Elle peut devenir infectieuse et nécessite alors un traitement adapté, prescrit par un professionnel.

## Au quotidien
- **Proposez le sein souvent**, à la demande, sans attendre que les seins soient très pleins. La tétée reste le meilleur moyen de les drainer.
- **Avant la tétée, un peu de chaleur** : douche chaude, compresse tiède, massage doux. Exprimez quelques gouttes, à la main ou au tire-lait, juste pour assouplir l'aréole et faciliter la prise du sein.
- **Entre les tétées, du froid** : une compresse froide soulage le gonflement.
- **Évitez de trop stimuler** : tirer beaucoup de lait « pour vider » relance la production. Le but est d'assouplir, pas de vider.
- **Changez de position** pour que le bébé draine toutes les zones du sein.
- **Reposez-vous** autant que possible et faites-vous aider pour le reste.

## Questions fréquentes
**Un peu de fièvre pendant la montée de lait, est-ce inquiétant ?**
Une légère fièvre peut accompagner la montée de lait. Si elle est élevée ou qu'elle persiste, parlez-en à l'équipe de la maternité ou, si vous êtes rentrée, à un professionnel de santé.

**Faut-il arrêter d'allaiter en cas de mastite ?**
C'est au professionnel de santé de vous conseiller selon la situation. Le plus souvent, drainer le sein reste important. Ne prenez pas de décision ni de traitement seule.

**Les choux, le tire-lait, les coquilles… qu'est-ce qui marche vraiment ?**
Les repères officiels mettent en avant les tétées fréquentes, la chaleur avant, le froid entre les tétées et l'expression douce pour assouplir. Pour le reste, demandez conseil à votre sage-femme ou à une consultante en lactation.

**Combien de temps dure l'engorgement ?**
Il est en général transitoire. S'il ne s'améliore pas ou s'il s'accompagne de rougeur, de fièvre ou d'une douleur localisée, consultez.

## Quand demander conseil
Consultez rapidement votre sage-femme, votre médecin ou la maternité si :
- vous avez une fièvre élevée ou qui dure ;
- une douleur du sein persiste ou s'aggrave, ou une zone devient rouge, chaude et dure ;
- vous vous sentez « grippée », très fatiguée ;
- votre bébé n'arrive plus à prendre le sein.

En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allaitement', 'montee-de-lait', 'engorgement', 'mastite', 'seins'],
    max_age_months: 12,
    safety_critical: true,
    sources: [S.mpediaMonteeLait, S.mpediaSeins],
    status: 'to_review',
  },
  {
    slug: 'tirer-et-conserver-son-lait',
    title: 'Tirer et conserver son lait maternel',
    summary: 'Tire-lait, hygiène, contenants, durées de conservation, décongélation et transport : les repères pratiques pour donner son lait en toute sécurité.',
    body_md: `Tirer son lait permet de continuer à nourrir son bébé quand on est séparés : reprise du travail, sortie, fatigue, bébé hospitalisé… Quelques règles d'hygiène et de conservation suffisent pour que ce lait garde ses qualités.

## En bref
- Lavez-vous les mains avant chaque utilisation ; nettoyez le matériel à l'eau chaude savonneuse après chaque tirage.
- Repères de conservation (Anses) : 1 heure à température ambiante (19 à 22 °C), 48 heures au réfrigérateur (4 °C ou moins), 4 mois au congélateur (-18 °C).
- Le lait se décongèle au réfrigérateur et ne se recongèle jamais.
- Le micro-ondes est déconseillé pour le réchauffer.
- Notez sur chaque contenant la date et l'heure du recueil.

## Comprendre
Il existe des tire-lait manuels, discrets et pratiques pour un usage occasionnel, et des tire-lait électriques, plus rapides, surtout à double pompage, plus adaptés à un usage régulier. Le tire-lait doit être bien ajusté : il ne doit provoquer ni douleur ni lésion. Il est souvent possible d'en louer un sur prescription : demandez à votre sage-femme ou à votre médecin.

Le lait maternel est un aliment vivant. Bien conservé, il garde ses qualités ; mal conservé, il peut se dégrader ou se contaminer. D'où l'importance de la chaîne du froid et des durées à respecter.

## Au quotidien
**Tirer son lait**
- Installez-vous au calme, massez doucement le sein, commencez à faible puissance puis augmentez progressivement.
- En cas de douleur, vérifiez que le mamelon est bien centré dans la téterelle ou baissez la puissance ; si la douleur persiste, demandez conseil.

**Contenants**
- Privilégiez le verre ou le polypropylène.
- Remplissez aux trois quarts (le lait se dilate en congelant).
- Congelez par petites portions pour limiter le gaspillage.
- Ne mélangez pas du lait tiède avec du lait froid, et n'ajoutez jamais de lait frais sur du lait déjà congelé.

**Conserver (repères de l'Anses)**
- Température ambiante (19 à 22 °C) : 1 heure maximum.
- Réfrigérateur (4 °C ou moins) : 48 heures.
- Congélateur (-18 °C) : 4 mois, en congelant dans les 24 heures après refroidissement au réfrigérateur.

**Décongeler et réchauffer**
- Décongelez au réfrigérateur. Le lait décongelé se garde 24 heures au réfrigérateur ou 1 heure à température ambiante, et ne se recongèle jamais.
- Tiédissez au bain-marie, au chauffe-biberon ou sous l'eau chaude du robinet. Évitez le micro-ondes (risque de brûlure et perte de qualité).
- Testez la température sur l'intérieur de l'avant-bras. Le lait réchauffé se consomme dans la demi-heure ; le reste se jette.

**Transporter**
- Glacière ou sac isotherme avec pack réfrigérant, sans rompre la chaîne du froid.

## Questions fréquentes
**Faut-il stériliser le matériel à chaque fois ?**
Les repères consultés recommandent de stériliser avant le premier usage, puis de nettoyer à l'eau chaude savonneuse, rincer, laisser égoutter et couvrir d'un linge propre après chaque tirage.

**Le lait a changé d'aspect au réfrigérateur, est-il abîmé ?**
Le lait maternel peut se séparer en couches (la crème remonte) : un mouvement doux pour le mélanger suffit. En cas de doute sur une odeur ou un aspect inhabituel, demandez conseil à un professionnel.

**Combien de lait faut-il préparer pour la personne qui garde mon bébé ?**
Les besoins varient d'un enfant à l'autre : parlez-en avec la sage-femme, le médecin ou la PMI, et observez les signes de faim et de satiété de votre bébé.

## Quand demander conseil
Demandez conseil à votre sage-femme, à une consultante en lactation ou à la PMI si tirer votre lait est douloureux, si la production vous semble diminuer, ou si vous hésitez sur l'organisation. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allaitement', 'tire-lait', 'conservation', 'lait-maternel', 'congelation'],
    max_age_months: 24,
    sources: [S.mpediaTirerLait, S.cafAllaitTravail],
    status: 'to_review',
  },
  {
    slug: 'allaitement-et-reprise-du-travail',
    title: 'Continuer d’allaiter en reprenant le travail',
    summary: 'Une heure par jour pour allaiter ou tirer son lait pendant la première année, un endroit adapté, une organisation anticipée : vos droits et des repères pratiques.',
    body_md: `Reprendre le travail ne veut pas forcément dire arrêter d'allaiter. Selon votre envie et votre organisation, vous pouvez tirer votre lait au travail, garder les tétées du matin et du soir, ou combiner les deux. La loi prévoit des droits pour vous y aider.

## En bref
- Pendant l'année qui suit la naissance, la loi prévoit une heure par jour pour allaiter ou tirer son lait pendant le temps de travail.
- Cette heure se divise en principe en deux pauses de 30 minutes ; elle n'est en principe pas rémunérée, sauf accord ou convention plus favorable.
- Au-delà de 100 salariés, l'employeur doit aménager un local ; en dessous, il doit proposer un endroit convenable.
- Anticipez : parlez-en tôt avec votre employeur et préparez la transition quelques jours ou semaines avant.

## Comprendre
Le Code du travail protège l'allaitement pendant la première année de l'enfant. L'heure quotidienne se répartit en principe en deux pauses de 30 minutes, l'une le matin, l'autre l'après-midi ; sans accord, chaque pause se place au milieu de la demi-journée. Votre convention collective peut prévoir mieux : rémunération de ces pauses, aménagements… Il n'existe pas de congé légal spécifique pour prolonger le congé maternité afin d'allaiter, mais certaines conventions en prévoient.

Côté lactation, la production de lait répond à la stimulation. Tirer son lait régulièrement en l'absence du bébé aide à la maintenir. Les week-ends et jours de congé, multiplier les tétées la relance. Le stress, la fatigue et les nuits hachées peuvent la faire baisser : c'est fréquent et cela se travaille, avec de l'aide.

## Au quotidien
- **Échangez tôt avec votre employeur ou les RH** : horaires des pauses, lieu pour tirer votre lait, accès à un réfrigérateur.
- **Consultez votre convention collective** : elle peut être plus favorable que la loi.
- **Introduisez le biberon quelques jours avant la reprise** si votre bébé en aura besoin, de préférence donné par une autre personne que vous.
- **Préparez le matériel** : tire-lait, contenants étiquetés, sac isotherme avec pack réfrigérant.
- **Gardez les tétées qui comptent** pour vous deux (matin, retour à la maison, soir, nuit).
- **Transmettez le lait tiré** à la personne qui garde votre enfant, avec les consignes de conservation (voir l'article dédié).

## Questions fréquentes
**Mon employeur peut-il refuser ces pauses ?**
L'heure d'allaitement est un droit prévu par la loi pendant l'année qui suit la naissance. En cas de difficulté, vous pouvez vous renseigner auprès des représentants du personnel, de l'inspection du travail ou consulter les fiches de Service-Public.fr.

**Et si je n'ai pas de local ?**
Dans une entreprise de moins de 100 salariés, l'employeur doit proposer un endroit convenable. Au-delà, il doit aménager un local dans l'établissement ou à proximité.

**Mon bébé refuse le biberon, que faire ?**
C'est fréquent. Proposez de petites quantités quand il est réceptif et pas affamé, sans forcer, et faites-le donner par une autre personne. La tasse est une alternative. Demandez conseil à la PMI ou à une consultante en lactation.

**Puis-je passer à un allaitement partiel ?**
Oui : beaucoup de mères gardent quelques tétées et complètent avec du lait infantile. Le choix du lait se fait avec le médecin.

## Quand demander conseil
Une consultante en lactation, la sage-femme, la PMI ou le médecin peuvent vous aider à préparer la reprise, notamment si la production baisse, si tirer votre lait est douloureux, ou si vous vous sentez épuisée. En cas de détresse, le 3114 répond 24 h/24. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allaitement', 'travail', 'droits', 'tire-lait', 'reprise'],
    max_age_months: 24,
    sources: [S.cafAllaitTravail, S.santeMixte, S.mpediaTirerLait],
    status: 'to_review',
  },
  {
    slug: 'allaitement-mixte-en-pratique',
    title: 'L’allaitement mixte : sein et biberon',
    summary: 'Associer tétées et biberons de lait infantile est possible : attendre que la lactation soit installée et remplacer les tétées progressivement aide à réussir la transition.',
    body_md: `Allaiter et donner aussi des biberons de lait infantile, c'est l'allaitement mixte. Il répond à des situations très différentes : reprise du travail, fatigue, souhait de partager les repas, lactation qui ne suffit pas… Il se prépare pour préserver le plaisir des tétées qui restent.

## En bref
- L'allaitement exclusif est recommandé jusqu'à 6 mois, mais chaque mère choisit ce qui lui convient.
- Avant d'introduire le biberon, il est conseillé d'attendre environ 6 semaines, le temps que la lactation s'installe.
- On remplace les tétées une par une, en commençant par la moins abondante de l'après-midi.
- Le choix du lait infantile se fait avec un professionnel de santé.
- Tirer son lait en l'absence du bébé aide à maintenir la production.

## Comprendre
Le lait maternel reste la référence pour nourrir un nourrisson, et chaque tétée compte. Une tétine de biberon, ou une sucette proposée trop tôt, peut gêner la succion au sein : au biberon, le lait coule plus facilement, et certains bébés finissent par préférer cette facilité. C'est pourquoi on conseille d'attendre que l'allaitement soit bien installé.

La production de lait s'adapte à la demande : moins le sein est stimulé, moins il produit. Supprimer les tétées trop vite peut provoquer un engorgement, et réduire la lactation plus que souhaité.

## Au quotidien
- **Commencez par la tétée de l'après-midi** la moins abondante ; attendez quelques jours, selon la tension des seins, avant d'en remplacer une autre.
- **Gardez de préférence** les tétées du matin, du soir et de la nuit.
- **Demandez conseil pour le lait** : un lait « 1er âge » jusqu'à la diversification, puis « 2e âge ». Le pédiatre ou le médecin vous aide à choisir.
- **Les week-ends et jours de congé**, multipliez les tétées et limitez les biberons pour soutenir la production.
- **Pour la reprise du travail**, introduisez les biberons quelques jours avant ; le lait tiré peut être donné par la personne qui garde votre enfant.
- **Observez votre bébé** : ce sont ses signes de faim et de satiété qui guident, jamais un chiffre à atteindre.

## Questions fréquentes
**Mon bébé ne voudra plus du sein ?**
Ce risque existe surtout si le biberon arrive très tôt. En attendant que l'allaitement soit installé et en gardant des tétées régulières, beaucoup de bébés alternent sans difficulté.

**Je n'ai pas assez de lait, dois-je compléter ?**
Avant de compléter, faites le point avec une sage-femme, la PMI ou une consultante en lactation : une prise du sein à corriger ou des tétées plus fréquentes suffisent parfois. Si un complément est nécessaire, il sera adapté avec le professionnel.

**Quel lait choisir ?**
Il existe des laits standards, des laits pour petits troubles digestifs et des laits thérapeutiques vendus en pharmacie. Ne changez pas de lait sans avis : parlez-en au médecin.

## Quand demander conseil
Parlez-en à votre sage-femme, à la PMI, à votre médecin ou à une consultante en lactation si vous avez des douleurs, des seins durs ou rouges, si votre bébé refuse l'un ou l'autre, ou s'il vous semble peu prendre de poids. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allaitement-mixte', 'biberon', 'lait-infantile', 'tetee'],
    max_age_months: 24,
    sources: [S.santeMixte, S.santeLait],
    status: 'to_review',
  },
  {
    slug: 'sevrage-allaitement-progressif',
    title: 'Arrêter l’allaitement en douceur',
    summary: 'Il n’y a pas d’âge unique pour sevrer : supprimer une tétée à la fois, à votre rythme, protège vos seins et facilite la transition pour votre bébé.',
    body_md: `Arrêter d'allaiter est une décision personnelle, qui vous appartient. Que ce soit à quelques semaines, au moment de la reprise du travail ou bien plus tard, le plus important est de vous sentir bien avec ce choix et d'avancer progressivement.

## En bref
- Il n'existe pas d'âge idéal unique pour sevrer ; l'OMS recommande l'allaitement exclusif jusqu'à 6 mois, puis sa poursuite avec une alimentation diversifiée jusqu'à 2 ans ou plus, si on le souhaite.
- On supprime une tétée à la fois et on attend environ 3 à 4 jours avant la suivante.
- La tétée supprimée est remplacée par un lait infantile adapté à l'âge (avant 1 an) ou par un repas selon l'âge.
- Le sevrage ne nécessite aucun médicament : la production diminue d'elle-même.
- Pour une reprise du travail, anticipez environ 15 jours à 3 semaines avant.

## Comprendre
La production de lait dépend de la stimulation des seins. En réduisant les tétées progressivement, la lactation baisse doucement, ce qui limite les tensions et les risques d'engorgement. Un arrêt brutal est possible si la situation l'impose, mais il est souvent plus inconfortable.

Le sevrage est aussi une étape émotionnelle, pour la mère comme pour l'enfant. Un bébé s'adapte mieux quand la décision est claire et que la mère est soutenue par son entourage.

## Au quotidien
- **Commencez par la tétée la moins appréciée** ou la plus courte.
- **Attendez 3 à 4 jours** si tout se passe bien avant d'en supprimer une autre.
- **Gardez certaines tétées** si vous le souhaitez (matin et soir, par exemple) : l'allaitement partiel est une option.
- **Seins tendus ?** Espacez davantage les suppressions, et exprimez un peu de lait en douceur, juste pour soulager.
- **Refus du biberon ?** C'est très fréquent : proposez de petites quantités quand il est réceptif, faites-le donner par une autre personne, essayez la tasse. La patience est souvent récompensée en quelques semaines.
- **Pour faciliter la transition**, vous pouvez d'abord proposer votre lait au biberon, puis introduire progressivement le goût de la préparation.

## Questions fréquentes
**Puis-je sevrer avant 6 mois ?**
Oui. Il faudra alors une préparation pour nourrissons adaptée à l'âge de votre bébé : choisissez-la avec le médecin.

**Je dois prendre un médicament, dois-je arrêter d'allaiter ?**
Très peu de médicaments sont contre-indiqués pendant l'allaitement. Demandez l'avis d'un professionnel formé à l'allaitement avant de décider.

**Et les tétées de nuit ?**
Elles peuvent être conservées quand l'enfant reçoit solides et biberons dans la journée, ou supprimées en dernier, à votre rythme.

**Je me sens triste d'arrêter, est-ce que ça arrive à d'autres ?**
Oui, beaucoup de mères ressentent un mélange de soulagement et de nostalgie. Si la tristesse s'installe, parlez-en à un professionnel.

## Quand demander conseil
Consultez votre sage-femme ou votre médecin si un sein devient rouge, chaud, douloureux, ou si vous avez de la fièvre. Parlez-en aussi si votre bébé refuse toute autre alimentation et semble moins bien. En cas de détresse, appelez le 3114 ; en cas d'urgence, le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation-bebe',
    tags: ['sevrage', 'allaitement', 'biberon', 'reprise-travail'],
    max_age_months: 36,
    sources: [S.santeSevrage, S.santeMixte],
    status: 'to_review',
  },
  {
    slug: 'laits-infantiles-choisir-et-changer',
    title: 'Laits infantiles : comment s’y retrouver ?',
    summary: 'Lait 1er âge, 2e âge, laits pour petits troubles, laits thérapeutiques : à quoi ils servent, pourquoi éviter lait de vache et boissons végétales, et pourquoi ne pas changer sans avis.',
    body_md: `Si vous ne pouvez pas ou ne souhaitez pas allaiter, ou en complément de l'allaitement, les préparations infantiles apportent à votre bébé ce dont il a besoin. Les rayons proposent de nombreuses références : voici comment les comprendre, et pourquoi le choix se fait avec un professionnel.

## En bref
- Le lait « 1er âge » (préparation pour nourrissons) convient de la naissance au début de la diversification, vers 4 à 6 mois.
- Le lait « 2e âge » prend le relais dès qu'un biberon est remplacé par un repas à la cuillère.
- Lait de vache, laits de chèvre ou de brebis et boissons végétales ne conviennent pas aux nourrissons.
- Les laits « thérapeutiques » (allergie, reflux, intolérance) sont vendus en pharmacie et relèvent d'un avis médical.
- Changer souvent de lait n'aide pas : parlez-en d'abord au médecin.

## Comprendre
Les préparations infantiles sont très encadrées par la réglementation. On distingue :
- **les laits standards**, pour les bébés sans problème particulier, en pharmacie ou en grande surface ;
- **les laits pour troubles fonctionnels**, pour de petits désagréments digestifs (régurgitations, constipation, coliques, selles molles) ;
- **les laits thérapeutiques**, uniquement en pharmacie, destinés à des situations médicales comme l'allergie aux protéines du lait de vache, le reflux ou l'intolérance au lactose. Les laits anti-régurgitations (AR) en font partie.

Le lait de vache contient trop de protéines et de sodium, et pas assez de fer, de zinc et de vitamines pour un nourrisson. Les boissons végétales ne respectent pas la réglementation des laits infantiles et exposent à des carences. Une exception existe : certaines préparations à base de protéines de riz hydrolysées, vendues en pharmacie, sont conformes.

## Au quotidien
- **Choisissez le lait avec le médecin** ou la PMI, selon l'âge, la santé de votre bébé, un éventuel risque d'allergie et sa façon de réagir aux biberons.
- **Préparez les biberons** en suivant scrupuleusement la notice (dosage, eau, hygiène) : voir l'article sur la préparation et l'hygiène des biberons.
- **Respectez son appétit** : ne le forcez jamais à finir. Les quantités se discutent avec le professionnel qui le suit.
- **Gardez le même lait** tant qu'il convient : beaucoup de pleurs ont des causes non digestives.
- **À la diversification**, passez au 2e âge, puis demandez conseil pour la suite vers 1 an.

## Questions fréquentes
**Les laits « premium » ou plus chers sont-ils meilleurs ?**
Tous les laits infantiles respectent la même réglementation de composition. Le choix d'une référence se fait selon les besoins de l'enfant, avec un professionnel.

**Mon bébé régurgite beaucoup, faut-il un lait AR ?**
Les régurgitations sont fréquentes chez le nourrisson. Avant de changer de lait, parlez-en au médecin, qui évaluera s'il y a lieu de le faire.

**Puis-je préparer un lait « maison » ou une boisson végétale ?**
Non : ces boissons ne sont pas adaptées et peuvent entraîner des carences importantes.

## Quand demander conseil
Consultez si votre bébé refuse régulièrement ses biberons, vomit souvent, a du sang dans les selles, des diarrhées, des plaques sur la peau, ou s'il prend peu de poids. Une difficulté à respirer, un gonflement du visage ou des lèvres après un biberon imposent d'appeler le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['lait-infantile', 'biberon', '1er-age', '2e-age', 'allergie'],
    max_age_months: 24,
    sources: [S.santeLait, S.santeBesoins04],
    status: 'to_review',
  },
  {
    slug: 'nourrir-bebe-0-4-mois',
    title: 'Nourrir son bébé de 0 à 4 mois',
    summary: 'Jusqu’à 4 à 6 mois, le lait — maternel ou infantile — suffit : on suit l’appétit du bébé, on ne le force jamais, et la courbe de poids aide à vérifier que tout va bien.',
    body_md: `Les premiers mois, la question « mange-t-il assez ? » revient souvent. Bonne nouvelle : votre bébé sait réguler son appétit. Votre rôle est de lui proposer le lait quand il le demande, et le suivi médical permet de vérifier qu'il grandit bien.

## En bref
- Jusqu'à 4 à 6 mois, le lait est le seul aliment du bébé : lait maternel ou lait infantile « 1er âge ».
- Au sein, les tétées se font à la demande, avec une grande variabilité en nombre et en durée.
- Au biberon, on respecte l'appétit : ne jamais forcer à terminer un biberon.
- Les quantités se discutent avec le médecin ou la PMI ; l'application n'en recommande aucune.
- La pesée régulière et la courbe de croissance du carnet de santé sont les meilleurs repères.

## Comprendre
Après la naissance, le bébé reçoit d'abord le colostrum si sa mère allaite, puis le lait prend le relais au bout de 3 ou 4 jours. Les laits végétaux, de chèvre ou de jument non adaptés ne conviennent pas.

La prise de poids varie beaucoup d'un jour à l'autre, d'un bébé à l'autre. C'est pourquoi on regarde la tendance sur plusieurs semaines plutôt qu'une pesée isolée, et on préfère peser une fois par semaine au plus, sauf avis médical différent (en cas de diarrhée par exemple). Les examens de suivi des premières semaines servent justement à vérifier la croissance.

## Au quotidien
- **Repérez les signes d'éveil et de faim** : bébé qui s'agite, tourne la tête, porte les mains à la bouche, avant même de pleurer.
- **Au sein**, proposez-le à la demande ; la durée et la fréquence varient d'une tétée à l'autre.
- **Au biberon**, préparez selon la notice, laissez votre bébé faire des pauses, et arrêtez quand il détourne la tête ou s'endort.
- **N'ajoutez rien** au lait (céréales, sucre…) avant la diversification, sauf avis médical.
- **Notez si vous le souhaitez** les tétées, biberons, couches : cela aide à répondre aux questions du professionnel.

## Questions fréquentes
**Faut-il le réveiller pour manger ?**
Les premiers jours, et selon la situation (petit poids, jaunisse…), l'équipe de la maternité ou la sage-femme peut vous le conseiller. Ensuite, on suit en général son rythme. Demandez ce qui convient à votre bébé.

**Faut-il lui donner de l'eau ?**
Le lait couvre ses besoins en eau. On propose de l'eau en plus seulement dans certaines situations (fortes chaleurs, fièvre, diarrhée), selon les conseils du professionnel.

**Mon bébé boit moins qu'avant, est-ce inquiétant ?**
L'appétit varie. Ce qui doit alerter, c'est un bébé qui boit nettement moins sur plusieurs repas, qui semble moins bien, ou qui mouille moins ses couches : consultez alors.

## Quand demander conseil
Consultez rapidement si votre bébé refuse plusieurs repas d'affilée, vomit beaucoup, a moins de couches mouillées, semble somnolent ou mou, ou s'il a de la fièvre avant 3 mois. En cas de malaise, de difficulté à respirer ou de bébé très difficile à réveiller, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allaitement', 'biberon', 'appetit', 'poids', '0-4-mois'],
    max_age_months: 6,
    sources: [S.santeBesoins04, S.ameliSuivi2mois],
    status: 'to_review',
  },
  {
    slug: 'diversification-premiers-aliments',
    title: 'Diversification : les premiers aliments',
    summary: 'Entre 4 et 6 mois, bébé découvre les aliments un par un, en purées lisses, sans sel ni sucre ajoutés : le lait reste son aliment principal et on ne force jamais.',
    body_md: `La diversification, c'est le passage progressif d'une alimentation uniquement lactée à une alimentation variée. C'est une période de découvertes, de grimaces et de petites victoires. Il n'y a pas de course : chaque bébé avance à son rythme.

## En bref
- La diversification peut commencer entre 4 et 6 mois, pour un bébé né à terme et en bonne santé ; pour un bébé prématuré ou malade, demandez un avis médical.
- Il n'y a pas d'ordre imposé : on introduit un aliment nouveau à la fois.
- Les fruits et légumes sont cuits, sans sel ni sucre ajoutés ; on ajoute un peu de matière grasse aux purées.
- Le lait reste l'aliment principal pendant toute la diversification.
- Un aliment peut devoir être proposé jusqu'à 10 fois avant d'être accepté : on ne force jamais.

## Comprendre
Votre bébé est prêt quand il tient bien sa tête, se tient assis avec un bon maintien, porte des objets à la bouche, s'intéresse à vos repas et ouvre la bouche à l'approche de la cuillère. S'il rejette fortement la cuillère ou ne tient pas sa tête, mieux vaut attendre un peu.

Au début, on propose des purées ou compotes très lisses : légumes cuits mixés (carotte, courgette, haricots verts, petits pois…), puis fruits cuits. Entre 6 et 12 mois s'ajoutent les féculents, de petites quantités de protéines (viande, poisson, œuf) et les matières grasses variées (huile de colza, de noix, de tournesol, beurre). Les textures évoluent ensuite vers des préparations plus épaisses, écrasées, puis de petits morceaux fondants.

Les légumes très riches en fibres (vert de poireau, artichaut, salsifis) sont à éviter au début. Le sucre se propose le plus tard possible : avant 3 ans, mieux vaut éviter sirops, sodas, chocolat, biscuits et jus de fruits.

## Au quotidien
- **Commencez par un seul repas par jour**, au moment qui convient à votre famille.
- **Un nouvel aliment à la fois**, séparément, puis mélangez ensuite.
- **Laissez-le toucher** les aliments avec ses doigts s'il en a envie : c'est aussi une découverte.
- **Pas de quantité cible** : les besoins varient d'un enfant à l'autre.
- **Installez-le assis, bien droit**, et restez toujours à côté de lui pendant le repas.
- **Évitez les aliments à risque d'étouffement** : fruits à coque et cacahuètes entiers, raisins entiers, carotte crue dure, bonbons, gros morceaux fermes.

## Questions fréquentes
**Par quoi commencer, légumes ou fruits ?**
Il n'y a pas d'ordre imposé. Beaucoup de familles commencent par des légumes, mais l'important est d'avancer un aliment à la fois.

**Il recrache tout, dois-je arrêter ?**
Recracher fait partie de l'apprentissage. Proposez à nouveau quelques jours plus tard, sans insister. Si le refus est total et durable, parlez-en au médecin ou à la PMI.

**Faut-il donner de l'eau ?**
Le lait assure l'hydratation ; l'eau peut être proposée en plus lors de fortes chaleurs. Les jus et boissons sucrées sont déconseillés.

**Et les allergènes ?**
Ils ne doivent pas être retardés : voir l'article « Allergènes : les introduire tôt ».

## Quand demander conseil
Parlez-en au médecin ou à la PMI pour un bébé prématuré ou ayant une maladie, en cas d'allergies dans la famille, ou si votre bébé refuse durablement de manger, vomit, a du sang dans les selles ou prend peu de poids. Une gêne respiratoire, un gonflement des lèvres ou du visage après un repas : appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['diversification', 'purees', 'premiers-aliments', '4-6-mois'],
    min_age_months: 3,
    max_age_months: 18,
    sources: [S.sante4a6, S.santeDiversif],
    status: 'to_review',
  },
  {
    slug: 'allergenes-introduire-tot',
    title: 'Allergènes : les introduire tôt, sans les retarder',
    summary: 'Œuf, arachide, gluten, poisson, fruits à coque : proposés tôt, en petites quantités et sous une forme adaptée, ils favorisent la tolérance de l’enfant.',
    body_md: `Longtemps, on a conseillé de retarder les aliments « allergisants ». Les repères ont changé : aujourd'hui, on recommande au contraire de ne pas les retarder, car les goûter tôt peut aider l'organisme à les tolérer.

## En bref
- Tous les groupes d'aliments, y compris les allergènes (œufs, arachide) et le gluten, peuvent être découverts entre 4 et 6 mois.
- Plus ils sont goûtés tôt, plus la tolérance peut se développer.
- On les propose en petites quantités, sous une forme adaptée : œuf bien cuit, poisson, produits laitiers, pâte d'arachide (jamais d'arachide entière), fruits à coque finement mixés, gluten.
- En cas d'allergies dans la famille, demandez l'avis du médecin ou de la PMI.
- Une réaction grave (gêne respiratoire, gonflement du visage) impose d'appeler le 15.

## Comprendre
Une allergie alimentaire est une réaction du système immunitaire à un aliment. Les repères officiels actuels indiquent que plus ces aliments sont goûtés tôt, plus la tolérance peut se développer : retarder leur introduction n'est donc plus conseillé. D'où le message actuel : ne pas attendre.

Sous une forme adaptée à l'âge, c'est essentiel : un enfant ne doit jamais recevoir de cacahuète ou de fruit à coque entiers, à cause du risque d'étouffement. On utilise donc des purées, des poudres très fines ou des pâtes lisses, délayées dans un repas.

## Au quotidien
- **Une nouveauté à la fois**, pour repérer facilement une éventuelle réaction.
- **Au début de la journée de préférence**, quand vous pouvez observer votre enfant dans les heures qui suivent.
- **En petite quantité**, mélangée à une purée qu'il connaît déjà.
- **Œuf** : toujours bien cuit.
- **Arachide** : en pâte lisse diluée, jamais entière.
- **Fruits à coque** : finement mixés ou en poudre.
- **Gluten** : un peu de pain, de semoule ou de pâtes bien cuites selon l'âge.
- **Une fois toléré**, continuez à le proposer régulièrement.

## Questions fréquentes
**Faut-il un test avant d'introduire un allergène ?**
Pas de façon systématique. Si votre enfant a un eczéma sévère, une allergie connue, ou s'il y a des allergies importantes dans la famille, demandez l'avis du médecin, qui vous dira comment procéder.

**Mon bébé a eu quelques rougeurs autour de la bouche, est-ce une allergie ?**
Certaines rougeurs viennent d'un simple frottement ou de l'acidité d'un aliment. Notez ce qu'il a mangé et parlez-en au médecin, surtout si la réaction se répète.

**Il a déjà 9 mois et n'a jamais goûté d'œuf, est-ce trop tard ?**
Non, il n'est pas trop tard : introduisez-le comme les autres, en petite quantité. En cas de doute (eczéma important, allergie connue), demandez conseil.

## Quand demander conseil
Appelez immédiatement le 15 ou le 112 si votre enfant, après un repas, a du mal à respirer, une voix ou un cri modifié, un gonflement des lèvres, de la langue ou du visage, des vomissements répétés avec malaise, ou s'il devient mou ou pâle.
Consultez le médecin si des plaques, des démangeaisons, des vomissements ou des diarrhées apparaissent après un aliment, ou si vous avez des allergies dans la famille.

${END}`,
    journeys: ['newborn'],
    category: 'alimentation-bebe',
    tags: ['allergenes', 'allergie', 'diversification', 'oeuf', 'arachide', 'gluten'],
    min_age_months: 3,
    max_age_months: 24,
    safety_critical: true,
    sources: [S.sante4a6, S.santeDiversif],
    status: 'to_review',
  },
  {
    slug: 'eau-et-boissons-du-tout-petit',
    title: 'Eau, jus, boissons : que donner à boire à un tout-petit ?',
    summary: 'Le lait suffit les premiers mois ; ensuite, l’eau est la seule boisson recommandée : jus et boissons sucrées restent occasionnels ou à éviter avant 3 ans.',
    body_md: `Faut-il donner de l'eau à un nourrisson ? Les jus de fruits sont-ils une bonne idée ? Quand il fait chaud, comment faire ? Voici les repères pour hydrater votre enfant de la naissance à 2 ans.

## En bref
- Les premiers mois, le lait (maternel ou infantile) assure l'hydratation : pas besoin d'eau en plus, sauf en cas de fortes chaleurs ou sur conseil médical.
- À partir de la diversification et après 1 an, l'eau est la seule boisson recommandée.
- Jus de fruits, même « 100 % pur jus », sirops et sodas sont déconseillés avant 3 ans ; le fruit entier est préférable.
- Un biberon de réconfort ne doit contenir que de l'eau, pour protéger les dents.
- Par forte chaleur, proposez à boire régulièrement, sans attendre qu'il le demande.

## Comprendre
Le lait est composé en grande partie d'eau. Pour un bébé allaité ou nourri au biberon selon son appétit, il couvre les besoins les premiers mois. Certaines situations augmentent les pertes en eau : forte chaleur, fièvre, diarrhée, vomissements. Dans ces cas, les professionnels peuvent conseiller de proposer de l'eau ou une solution de réhydratation (voir l'article sur la gastro-entérite).

Les boissons sucrées habituent au goût sucré, apportent du sucre sans rassasier et favorisent les caries, surtout au biberon. C'est pourquoi elles sont à éviter, et que les jus de fruits restent occasionnels.

## Au quotidien
- **Après la diversification**, proposez de l'eau au verre, à la tasse ou au biberon, au cours et entre les repas.
- **Pour la préparation des biberons**, suivez les consignes de la notice et des professionnels (type d'eau, dosage).
- **En cas de chaleur** : faites boire régulièrement, laissez votre bébé en couche ou en body léger, gardez-le dans la pièce la plus fraîche, et ne le laissez jamais dans une voiture.
- **Pas de boisson sucrée au biberon**, surtout au coucher.
- **Le fruit entier** plutôt que le jus : il apporte des fibres et rassasie.

## Questions fréquentes
**Mon bébé de 2 mois a chaud, puis-je lui donner de l'eau ?**
Par forte chaleur, proposez-lui le sein ou le biberon plus souvent et de l'eau en petites quantités si un professionnel vous l'a conseillé. Surveillez les signes de déshydratation.

**Il refuse l'eau à 1 an, est-ce grave ?**
Beaucoup d'enfants boivent peu d'eau quand ils prennent encore du lait et des purées riches en eau. Continuez à en proposer régulièrement, dans un verre qu'il aime. En cas de chaleur, de fièvre ou de diarrhée, soyez plus attentif.

**Les eaux aromatisées sont-elles une bonne option ?**
Elles contiennent souvent du sucre ou des arômes : l'eau plate reste la meilleure boisson.

## Quand demander conseil
Consultez rapidement si votre enfant boit beaucoup moins que d'habitude, mouille moins ses couches, a la bouche sèche, les yeux creux, s'il est anormalement endormi ou au contraire très agité, surtout en cas de diarrhée, de vomissements ou de fièvre. En cas de malaise ou d'enfant difficile à réveiller, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation-bebe',
    tags: ['eau', 'boissons', 'jus', 'hydratation', 'chaleur'],
    max_age_months: 36,
    sources: [S.sante4a6, S.sante12a23, S.santeChaleur],
    status: 'to_review',
  },
  {
    slug: 'repas-de-12-a-24-mois',
    title: 'Les repas de 1 à 2 ans',
    summary: 'Entre 12 et 23 mois, l’enfant mange de plus en plus comme la famille : quatre repas, des morceaux tendres, le lait encore présent, et l’eau comme boisson.',
    body_md: `Après 1 an, votre enfant découvre les morceaux, veut manger seul, goûte ce qu'il y a dans votre assiette. C'est l'âge du « moi tout seul » à table, avec ses joies et ses refus. Voici les repères pour l'accompagner sans pression.

## En bref
- Le rythme reste de 4 repas par jour : petit-déjeuner, déjeuner, goûter, dîner.
- Le lait reste important ; le lait de croissance est préférable jusqu'à 3 ans, le lait de vache entier est possible à partir de 12 mois si le reste de l'alimentation est bien équilibré. Les quantités se discutent avec le médecin.
- La plupart des enfants peuvent manger des morceaux bien cuits et tendres, à prendre avec les doigts.
- L'eau est la seule boisson recommandée.
- On évite la charcuterie avant 5 ans et on privilégie les compotes sans sucre ajouté.

## Comprendre
Entre 12 et 23 mois, l'assiette se rapproche de celle de la famille : légumes, fruits, féculents, matières grasses, et une petite quantité de protéines animales (viande, poisson, œuf). Les textures progressent vers les morceaux, ce qui entraîne la mastication et prépare le langage.

L'appétit d'un jeune enfant varie beaucoup d'un repas à l'autre et d'un jour à l'autre : c'est sur la semaine qu'on regarde l'équilibre. Il est aussi fréquent qu'un enfant refuse des morceaux à la maison et les accepte à la crèche : on continue à proposer, sans forcer.

## Au quotidien
- **Mangez ensemble quand c'est possible** : l'enfant apprend en imitant.
- **Laissez-le se servir de ses doigts** et d'une petite cuillère, même si c'est salissant.
- **Coupez en petits morceaux tendres** ; évitez les aliments durs, ronds ou glissants entiers (raisins, tomates cerises entières, fruits à coque, bonbons).
- **Restez toujours à côté de lui** et installez-le assis, bien droit.
- **Proposez sans insister** : un aliment refusé aujourd'hui sera peut-être accepté dans quelques jours.
- **Pas de sucreries en récompense** ni de boissons sucrées au biberon.

## Questions fréquentes
**Il ne mange presque rien certains jours, dois-je m'inquiéter ?**
Les variations d'appétit sont fréquentes à cet âge. Ce qui compte, c'est sa vitalité, sa croissance sur la courbe du carnet de santé, et l'équilibre sur plusieurs jours. En cas de doute, parlez-en au médecin.

**Lait de croissance ou lait de vache ?**
Le lait de croissance est préférable jusqu'à 3 ans. Le lait de vache entier est possible dès 12 mois si l'alimentation est par ailleurs parfaitement équilibrée. Demandez conseil au médecin.

**Peut-il manger la même chose que nous ?**
De plus en plus, oui, à condition d'adapter la texture et de limiter le sel, le sucre et les aliments très gras ou très salés comme la charcuterie.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre enfant refuse durablement toute texture, s'étouffe souvent en mangeant, perd du poids ou stagne sur sa courbe, ou si les repas deviennent une source de conflit et d'inquiétude. En cas d'étouffement avec impossibilité de respirer, appelez immédiatement le 15 ou le 112 (voir l'article sur la fausse route).

${END}`,
    journeys: ['newborn', 'child'],
    category: 'alimentation-bebe',
    tags: ['repas', '12-24-mois', 'morceaux', 'lait-de-croissance'],
    min_age_months: 12,
    max_age_months: 24,
    sources: [S.sante12a23, S.santeDiversif],
    status: 'to_review',
  },
  // ───────────────────────────── Santé et petits soucis du bébé ─────────────────────────────
  {
    slug: 'examens-du-bebe-a-la-maternite',
    title: 'Les soins et examens de bébé à la maternité',
    summary: 'Premier examen, vitamine K, visite du pédiatre, dépistage néonatal au talon, examen de sortie : ce qui est proposé à votre bébé pendant son séjour.',
    body_md: `Pendant les premiers jours, votre bébé est examiné à plusieurs reprises. Ces examens vérifient que tout se met en place et permettent de repérer tôt certaines maladies rares, pour lesquelles une prise en charge précoce change beaucoup.

## En bref
- Juste après la naissance, le bébé reste contre sa mère environ deux heures, sous la surveillance d'une sage-femme.
- Un premier examen vérifie notamment les réflexes, l'absence de malformation et la stabilité des hanches ; le bébé reçoit de la vitamine K par la bouche.
- Le pédiatre l'examine dans les 24 premières heures, puis à nouveau avant la sortie.
- Vers le 3e jour, quelques gouttes de sang sont prélevées au talon : c'est le dépistage néonatal.
- D'autres examens sont prévus après le retour à la maison, car certaines anomalies n'apparaissent que plus tard.

## Comprendre
**En salle de naissance**, le peau à peau favorise la rencontre, la régulation de la température et la première tétée si la mère le souhaite. La sage-femme surveille la respiration, le teint et le tonus du bébé.

**Le premier examen** contrôle les réflexes, vérifie que l'anus, l'œsophage et les narines sont perméables, et que les hanches sont stables. La vitamine K donnée par voie orale aide à prévenir des hémorragies.

**La visite du pédiatre** dans les premières 24 heures porte sur le tonus, les réflexes, le cœur (recherche d'un souffle) et les hanches (recherche d'une luxation).

**Le dépistage néonatal** consiste à prélever quelques gouttes de sang au talon, déposées sur un papier buvard. Il recherche des maladies rares mais graves, que l'on peut mieux prendre en charge si elles sont repérées très tôt. Si un résultat nécessite un contrôle, l'équipe vous recontacte.

**La visite de sortie** est un second examen complet. Le carnet de santé, remis à la naissance, regroupe ensuite tout le suivi.

## Au quotidien
- **Posez vos questions** à chaque examen : c'est le moment d'en parler.
- **Gardez le carnet de santé** à portée de main : il vous suivra à chaque consultation.
- **Repérez les prochains rendez-vous** : l'Assurance Maladie vous envoie le calendrier des examens de suivi.
- **Si vous sortez tôt**, un suivi par une sage-femme à domicile peut être organisé (voir l'article sur le retour à la maison).

## Questions fréquentes
**Le prélèvement au talon fait-il mal ?**
Il peut être un peu désagréable. Le faire pendant une tétée ou en peau à peau aide souvent à le réconforter.

**Si on ne me rappelle pas pour le dépistage, cela veut dire que tout va bien ?**
En général, seuls les résultats nécessitant un contrôle donnent lieu à un appel. En cas de doute, posez la question à la maternité.

**Pourquoi d'autres examens si tout va bien à la sortie ?**
Certaines anomalies ne sont visibles qu'après quelques jours ou semaines : c'est le rôle des examens de suivi obligatoires.

## Quand demander conseil
Après la sortie, contactez la sage-femme, le médecin ou la maternité si votre bébé tète mal, a la peau très jaune, a de la fièvre ou une température basse, vomit, ou vous semble inhabituellement endormi. En cas de difficulté à respirer, de malaise, de teint gris ou bleuté, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'sante-bebe',
    tags: ['maternite', 'depistage-neonatal', 'vitamine-k', 'examens', 'nouveau-ne'],
    max_age_months: 1,
    sources: [S.santeMaternite, S.ameliRetourMaison],
    status: 'to_review',
  },
  {
    slug: 'jaunisse-du-nouveau-ne',
    title: 'La jaunisse du nouveau-né',
    summary: 'Fréquente dans les jours qui suivent la naissance, la jaunisse est le plus souvent passagère ; une jaunisse qui dure, s’accentue ou apparaît tôt doit être vue par un médecin.',
    body_md: `Dans les jours qui suivent la naissance, la peau de nombreux bébés prend une teinte jaune-orangée, parfois aussi le blanc des yeux. C'est la jaunisse, ou ictère. Elle est le plus souvent passagère, mais elle se surveille.

## En bref
- La jaunisse « physiologique » apparaît vers 2 à 3 jours de vie et disparaît d'elle-même avant la deuxième semaine.
- Elle vient d'un foie encore immature, qui élimine moins vite la bilirubine.
- Une jaunisse liée à l'allaitement peut apparaître vers le 5e ou 6e jour ; elle est sans gravité.
- Une jaunisse qui apparaît dans les premières heures, qui dure ou qui s'accentue doit être vue par un médecin.
- Si besoin, la photothérapie (lumière bleue) est un traitement indolore.

## Comprendre
La bilirubine est une substance qui provient de la destruction naturelle des globules rouges. Chez le nouveau-né, le foie met quelques jours à fonctionner pleinement : la bilirubine s'accumule un peu et colore la peau. Cela concerne particulièrement les bébés prématurés.

D'autres causes, plus rares et plus sérieuses, existent : une incompatibilité de groupes sanguins entre la mère et le bébé (la jaunisse survient alors dans les heures qui suivent la naissance), ou un fonctionnement anormal du foie. C'est pour cela que l'équipe surveille la couleur de la peau et, si nécessaire, mesure la bilirubine.

**La photothérapie** consiste à exposer le bébé, les yeux protégés, à une lumière bleue qui transforme la bilirubine en une substance plus facile à éliminer. Les séances durent quelques heures, plusieurs jours de suite, et ne font pas mal.

## Au quotidien
- **Observez la couleur de sa peau** à la lumière du jour, ainsi que le blanc de ses yeux.
- **Proposez-lui à boire régulièrement** (tétées ou biberons) : une bonne alimentation aide à éliminer la bilirubine.
- **Signalez à la sage-femme ou au médecin** toute jaunisse qui persiste après votre retour à la maison.
- **Regardez aussi ses selles et ses urines** : des selles très claires (décolorées) ou des urines foncées sont à signaler sans attendre.

## Questions fréquentes
**Faut-il exposer mon bébé au soleil pour faire passer la jaunisse ?**
Non : n'exposez pas votre bébé directement au soleil. Le traitement, s'il est nécessaire, se fait avec une lumière adaptée, sous surveillance médicale.

**Dois-je arrêter d'allaiter ?**
Non, sauf avis médical contraire. La jaunisse liée à l'allaitement est sans gravité.

**Combien de temps peut durer la jaunisse ?**
La forme physiologique disparaît avant la deuxième semaine. Au-delà, ou si elle s'accentue, une consultation dans la journée est conseillée.

## Quand demander conseil
Consultez un médecin dans la journée si :
- la jaunisse dure plus de cinq jours ou ne disparaît pas au bout d'une semaine ;
- elle s'accentue au lieu de diminuer ;
- elle apparaît dans les premières heures de vie, ou chez un nourrisson plus âgé ;
- les selles sont très claires ou les urines foncées.

Appelez le 15 ou le 112 si votre bébé est très difficile à réveiller, refuse de boire, devient mou, ou si vous êtes inquiet de son état général.

${END}`,
    journeys: ['newborn'],
    category: 'sante-bebe',
    tags: ['jaunisse', 'ictere', 'nouveau-ne', 'bilirubine', 'phototherapie'],
    max_age_months: 2,
    safety_critical: true,
    sources: [S.santeJaunisse, S.santeMaternite],
    status: 'to_review',
  },
  {
    slug: 'soins-du-cordon-ombilical',
    title: 'Les soins du cordon ombilical',
    summary: 'Garder le cordon propre et sec, ne pas le couvrir avec la couche, surveiller quelques signes : le cordon tombe en général en une quinzaine de jours.',
    body_md: `Le reste de cordon ombilical impressionne souvent les jeunes parents. Les soins sont pourtant simples, et ne font pas mal au bébé. Le cordon sèche puis tombe tout seul, en général en une quinzaine de jours.

## En bref
- Le cordon doit rester propre et sec : eau et savon si besoin, puis séchage soigneux.
- La désinfection n'est pas obligatoire.
- Ne plaquez pas le cordon sous la couche : repliez la couche en dessous.
- Le bain est possible avant la chute du cordon.
- Saignement régulier, cordon qui ne sèche pas, mauvaise odeur ou cordon toujours présent à 2 mois : consultez.

## Comprendre
Après la naissance, le cordon est coupé et pincé avec un clamp, souvent retiré vers le deuxième jour (certaines maternités le laissent). Le reste de cordon se dessèche progressivement, noircit, puis tombe, le plus souvent au bout d'une quinzaine de jours ; une fourchette plus large, de 1 à 8 semaines, est parfois évoquée.

Les soins ne sont pas douloureux : le bébé peut pleurer parce que le liquide est froid. L'emmailloter par le haut pendant le soin l'aide à se sentir en sécurité.

Après la chute, il peut rester une petite boule rouge et humide au fond du nombril : c'est un bourgeon ombilical. Il n'est pas forcément inquiétant, mais il doit être montré à un professionnel, qui peut proposer un traitement local.

## Au quotidien
- **Lavez-vous les mains** avant le soin.
- **Nettoyez à l'eau et au savon** si besoin, en insistant doucement sous la pince et autour de la base, notamment pour retirer les croûtes de sang.
- **Séchez bien**, en tamponnant.
- **Positionnez le cordon** le plus verticalement possible et rabattez la couche en dessous, pour qu'il reste à l'air.
- **Chez un garçon**, orientez le pénis vers le bas dans la couche pour que l'urine ne mouille pas le cordon.
- **Après la chute**, continuez à sécher le nombril et retirez délicatement les petites croûtes au fond, jusqu'à cicatrisation complète.

## Questions fréquentes
**Puis-je donner le bain avant que le cordon tombe ?**
Oui, le bain n'est plus déconseillé. Pensez simplement à bien sécher le cordon ensuite.

**Faut-il utiliser un antiseptique ?**
Ce n'est pas obligatoire. Certaines maternités utilisent de la chlorhexidine : suivez les conseils qui vous ont été donnés.

**Le cordon saigne un peu quand il tombe, est-ce grave ?**
Quelques gouttes au moment de la chute peuvent arriver. Un saignement régulier doit en revanche être montré à un professionnel.

## Quand demander conseil
Consultez la sage-femme ou le médecin si :
- le cordon saigne régulièrement ;
- il ne sèche pas ou suinte ;
- il a une odeur désagréable, ou si la peau autour devient rouge, gonflée ou chaude ;
- il n'est pas tombé à 2 mois ;
- une petite boule rouge persiste au fond du nombril.

Si votre bébé a de la fièvre, boit mal ou semble moins bien, consultez sans attendre ; en cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['cordon', 'nombril', 'soins', 'nouveau-ne'],
    max_age_months: 3,
    sources: [S.santeCordon],
    status: 'to_review',
  },
  {
    slug: 'bronchiolite-du-nourrisson',
    title: 'La bronchiolite du nourrisson',
    summary: 'Fréquente en hiver, la bronchiolite se soigne le plus souvent à la maison avec des lavages de nez et des repas fractionnés ; certains signes imposent d’appeler le 15.',
    body_md: `La bronchiolite est une infection virale des petites bronches, très fréquente chez les bébés de moins de 2 ans, surtout en automne et en hiver. Le plus souvent, elle se soigne à la maison, avec une surveillance attentive. Connaître les signes de gravité permet de réagir vite si besoin.

## En bref
- Elle commence souvent par un rhume, puis une toux ; la respiration peut devenir rapide et sifflante.
- Elle ne relève pas de l'automédication : un examen médical est nécessaire.
- Lavages de nez, repas fractionnés, chambre aérée et pas de tabac sont les gestes clés.
- Antitussifs et fluidifiants sont contre-indiqués chez le petit enfant.
- Lèvres bleues, pauses respiratoires, grande gêne pour respirer, bébé qui ne boit plus ou très somnolent : appelez le 15 ou le 112.

## Comprendre
Le virus en cause (souvent le VRS) gonfle et encombre les petites bronches. Le bébé tousse pour évacuer les sécrétions, et sa respiration peut devenir plus rapide. Les symptômes s'aggravent souvent pendant les 2 à 3 premiers jours, puis s'améliorent. La guérison survient en général en 5 à 10 jours, mais la toux peut durer plusieurs semaines.

Avant 6 mois, un bébé respire surtout par le nez : un nez bouché le gêne beaucoup pour respirer et pour boire. D'où l'importance des lavages de nez.

Des moyens de prévention existent : un traitement préventif par anticorps, souvent proposé avant la sortie de maternité, et la vaccination de la femme enceinte en fin de grossesse. Parlez-en avec les professionnels qui vous suivent.

## Au quotidien
- **Lavez le nez** au sérum physiologique avant les repas et aussi souvent que nécessaire.
- **Fractionnez les repas** : de petites quantités plus souvent, car il se fatigue vite et peut vomir pendant les quintes de toux. Si vous allaitez et qu'il est trop fatigué pour téter, vous pouvez tirer votre lait.
- **Gardez-le droit quand il est éveillé** ; pour dormir, couchez-le sur le dos, comme d'habitude.
- **Aérez la chambre** et ne la chauffez pas trop (pas plus de 19 °C).
- **Aucun tabac** dans son environnement : il aggrave la maladie.
- **En cas de fièvre** qui le gêne, demandez au médecin ou au pharmacien quoi faire.
- **Gardez-le à la maison** pendant la phase aiguë et lavez-vous souvent les mains.

## Questions fréquentes
**Faut-il des séances de kinésithérapie ?**
Ce n'est pas systématique : c'est le médecin qui juge de l'utilité d'un soin selon l'état de votre bébé.

**Peut-il retourner à la crèche ?**
Il est conseillé de le garder à la maison pendant la phase aiguë. Demandez au médecin quand il pourra retourner en collectivité.

**Mon bébé a déjà fait une bronchiolite, peut-il en refaire une ?**
Oui, c'est possible. Les gestes barrières (lavage des mains, masque pour un proche enrhumé, aération) limitent le risque.

## Quand demander conseil
**Consultez le médecin dans la journée** si votre bébé a des symptômes : toux, respiration plus rapide, rhume important.

**Reconsultez** si les symptômes s'aggravent, si la fièvre augmente après quelques jours, ou s'il boit moins de la moitié de ses biberons à trois repas de suite, vomit systématiquement, ou si son comportement vous inquiète (somnolence, manque de tonus, pleurs inhabituels). Les bébés de moins de 2 mois, les prématurés et ceux qui ont une maladie du cœur ou des poumons doivent être vus rapidement.

**Appelez le 15 ou le 112 sans attendre** en cas de lèvres ou doigts bleus, de pâleur avec geignements, de pauses respiratoires, de respiration très rapide ou au contraire lente et irrégulière, de battements des ailes du nez, de creusement entre les côtes ou au-dessus des clavicules, de refus total de boire, de malaise ou de grande somnolence.

${END}`,
    journeys: ['newborn'],
    category: 'sante-bebe',
    tags: ['bronchiolite', 'vrs', 'toux', 'respiration', 'lavage-de-nez', 'hiver'],
    max_age_months: 24,
    safety_critical: true,
    sources: [S.ameliBronchio, S.mpediaBronchio],
    status: 'to_review',
  },
  {
    slug: 'rhume-et-lavage-de-nez',
    title: 'Rhume du bébé : laver le nez et surveiller',
    summary: 'Le rhume (rhinopharyngite) guérit seul en moins de dix jours : lavages de nez, hydratation et surveillance suffisent le plus souvent ; certains signes doivent faire consulter.',
    body_md: `Nez qui coule, nez bouché, petite toux, parfois de la fièvre : le rhume, ou rhinopharyngite, est la maladie la plus fréquente des tout-petits, surtout quand ils commencent à fréquenter une collectivité. Il est d'origine virale et guérit tout seul. Votre rôle : soulager et surveiller.

## En bref
- La rhinopharyngite est virale et guérit spontanément en moins de dix jours.
- Le lavage de nez au sérum physiologique soulage, surtout avant les repas et le coucher.
- Faites boire souvent, même s'il ne le demande pas.
- Les vasoconstricteurs nasaux sont contre-indiqués avant 15 ans ; antitussifs et fluidifiants avant 2 ans.
- Un écoulement jaune ou vert n'est pas forcément le signe d'une surinfection.

## Comprendre
Le virus irrite le nez et la gorge. Les sécrétions sont abondantes et peuvent changer de couleur au fil des jours, sans que cela signifie forcément qu'il faut un antibiotique. La toux aide à dégager les voies respiratoires : il ne faut pas chercher à la bloquer.

Un tout-petit ne sait pas se moucher. Avant 6 mois, il respire surtout par le nez : le dégager l'aide à respirer, à boire et à dormir.

## Au quotidien
- **Lavez-lui le nez** au sérum physiologique ou avec une solution d'eau de mer en dosettes, avant les repas, avant le coucher et dès que nécessaire. Allongez-le sur le côté, versez le sérum dans la narine du dessus, puis faites de même de l'autre côté.
- **Limitez le mouche-bébé**, qui peut irriter la muqueuse.
- **Faites boire régulièrement** et fractionnez les repas s'il est gêné.
- **Gardez une pièce aérée et pas trop chaude** (18 à 20 °C) ; évitez la climatisation, qui assèche les muqueuses.
- **En cas de fièvre**, découvrez-le un peu (sans le déshabiller entièrement) et évitez les bains froids. Avant de donner un médicament, demandez conseil au médecin ou au pharmacien, surtout avant 3 mois.
- **Mouchoirs jetables** et lavage des mains pour limiter la transmission.

## Questions fréquentes
**Faut-il un antibiotique ?**
Non, pas pour un rhume viral. C'est le médecin qui décide d'un traitement en cas de complication (otite, par exemple).

**Combien de rhumes par hiver, est-ce trop ?**
Les tout-petits en collectivité enchaînent souvent les rhumes, le temps de construire leur immunité. Si cela vous inquiète, parlez-en au médecin.

**Le lavage de nez lui fait peur, que faire ?**
Faites-le rapidement, calmement, en le rassurant par la voix, et toujours avant les repas plutôt qu'après pour éviter qu'il vomisse. Demandez à la sage-femme ou au pharmacien de vous montrer le geste.

## Quand demander conseil
**Consultez sans attendre, ou appelez le 15**, en cas de fièvre chez un bébé de moins de 3 mois, de fièvre de 40 °C ou plus, de difficultés à respirer, de somnolence, de réactions faibles, de pleurs faibles ou inhabituels, de pâleur marquée, de taches violacées sur la peau, de vomissements ou diarrhées importants.

**Consultez le médecin** si la fièvre dépasse 38,5 °C pendant plus de trois jours ou apparaît après le troisième jour, si le nez ou la toux ne s'améliorent pas après dix jours, en cas de douleur ou d'écoulement d'oreille, d'œil rouge qui coule, de paupières gonflées, de difficultés à manger, ou si son comportement change.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'sante-bebe',
    tags: ['rhume', 'rhinopharyngite', 'lavage-de-nez', 'fievre', 'toux'],
    max_age_months: 36,
    safety_critical: true,
    sources: [S.ameliRhino],
    status: 'to_review',
  },
  {
    slug: 'gastro-enterite-bebe-deshydratation',
    title: 'Gastro-entérite du bébé : éviter la déshydratation',
    summary: 'Diarrhée et vomissements font perdre beaucoup d’eau à un tout-petit : la solution de réhydratation orale (SRO), donnée souvent et en petites quantités, est le geste essentiel.',
    body_md: `La gastro-entérite est fréquente chez les jeunes enfants. Le principal risque, chez un bébé, est la déshydratation, qui peut s'installer vite. Bien réhydrater et savoir quand consulter sont les deux clés.

## En bref
- Avant 2 ans, consultez rapidement en cas de diarrhée aiguë (au moins trois selles liquides en quelques heures), avec ou sans vomissements.
- Donnez de la solution de réhydratation orale (SRO), souvent et en petites quantités, selon ses besoins.
- Continuez l'allaitement, en proposant la SRO entre les tétées.
- Ne réhydratez pas avec de l'eau seule, des sodas ou des boissons sucrées.
- Somnolence, enfant très difficile à réveiller, yeux creux, langue sèche, vomissements qui continuent : consultez en urgence.

## Comprendre
La diarrhée et les vomissements font perdre de l'eau et des sels minéraux. Un nourrisson a peu de réserves : il peut se déshydrater en quelques heures. La SRO, vendue en pharmacie, contient exactement ce qu'il faut pour compenser ces pertes. Prescrite par un médecin, elle est prise en charge pour les enfants de moins de 5 ans.

Les bébés de moins de 6 mois et les enfants ayant une maladie chronique sont plus à risque.

## Au quotidien
- **SRO à volonté** : commencez par de très petites quantités plusieurs fois par heure, puis augmentez progressivement. En cas de vomissements, donnez de petites gorgées ou à la cuillère toutes les 5 à 10 minutes.
- **Allaitement** : continuez, avec de la SRO entre les tétées.
- **Lait en poudre** : selon les repères officiels, il peut être remplacé par de la SRO pendant 4 à 6 heures au maximum, puis le lait habituel est réintroduit, avec la SRO entre les biberons. Suivez les conseils du médecin.
- **Alimentation diversifiée** : gardez ses aliments habituels et proposez la SRO à volonté.
- **Surveillez** : poids si possible, température, nombre de selles, de vomissements et de biberons, comportement.
- **Ne modifiez pas la dilution** de la SRO.
- **Hygiène** : lavez-vous les mains après chaque change et gardez-le à la maison pour limiter la contagion.

## Questions fréquentes
**Puis-je lui donner un médicament contre la diarrhée ou les vomissements ?**
Pas sans avis médical : plusieurs médicaments sont déconseillés chez le jeune enfant (certains anti-diarrhéiques avant 12 ans, les médicaments à base d'argile avant 2 ans, les antiémétiques sans ordonnance). En cas de fièvre, demandez conseil.

**Combien de temps dure une gastro ?**
Souvent quelques jours. Si la diarrhée dure plus de deux jours ou s'aggrave, consultez.

**Existe-t-il un vaccin ?**
Un vaccin contre le rotavirus, principal virus des gastro-entérites du nourrisson, est recommandé : parlez-en à votre médecin.

## Quand demander conseil
**Consultez sans délai un médecin ou allez aux urgences** si :
- votre bébé vomit de façon répétée et ne boit plus ;
- la diarrhée dure plus de deux jours ou s'aggrave ;
- la fièvre dépasse 38,5 °C ;
- les selles contiennent des glaires ou du sang ;
- des signes de déshydratation apparaissent : agitation ou au contraire apathie et sommeil excessif, enfant difficile à réveiller, gémissements, teint pâle, yeux creux, langue sèche et collante, respiration rapide, perte de poids.

En cas de malaise, d'enfant inconscient ou très difficile à réveiller, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'sante-bebe',
    tags: ['gastro-enterite', 'diarrhee', 'vomissements', 'deshydratation', 'sro'],
    max_age_months: 60,
    safety_critical: true,
    sources: [S.ameliGastro],
    status: 'to_review',
  },
  {
    slug: 'coliques-et-pleurs-du-soir',
    title: 'Coliques et pleurs du soir',
    summary: 'Les pleurs du soir culminent vers 6 semaines et s’atténuent vers 3 à 4 mois : apaiser, se relayer et ne jamais secouer, et faire examiner un bébé qui pleure beaucoup.',
    body_md: `Votre bébé a bu, il est changé, câliné… et pourtant il pleure, souvent en fin de journée, parfois pendant des heures. Ces pleurs épuisent et inquiètent. Ils sont fréquents et finissent par s'atténuer, mais un bébé qui pleure beaucoup doit être examiné, et les parents ont besoin d'être soutenus.

## En bref
- Les pleurs du soir surviennent surtout entre 18 h et minuit, commencent vers 3 semaines, culminent vers 6 semaines et s'atténuent vers 3 à 4 mois.
- Le mot « coliques » est souvent utilisé à tort : ces pleurs ne signalent pas forcément un problème digestif.
- Portage, câlins, bain, promenade, lumière tamisée, musique douce peuvent apaiser.
- Évitez de changer souvent de lait.
- Si vous sentez la tension monter : posez bébé en sécurité dans son lit, sortez de la pièce, appelez quelqu'un. Ne secouez jamais un bébé.

## Comprendre
En fin de journée, certains bébés semblent souffrir : visage rouge, poings serrés, ventre tendu. Pourtant, selon les repères consultés, ces pleurs ne sont pas liés à une maladie et ne relèvent pas d'un problème digestif dans la plupart des cas. On parle de pleurs excessifs quand ils durent plus de 3 heures par jour, plus de 3 jours par semaine.

Il est très important qu'un bébé qui pleure beaucoup soit examiné par un médecin, pour écarter une cause médicale (infection, reflux, autre problème).

## Au quotidien
- **Vérifiez les besoins de base** : faim, couche, température, environnement pas trop bruyant ni surchauffé, sans fumée.
- **Pendant les repas** : laissez-le téter lentement, avec des pauses pour le rot ; desserrez la couche et les vêtements à la taille ; au biberon, une tétine adaptée peut aider.
- **Pour l'apaiser** : portage, peau à peau, bercement, massage du ventre, bain, promenade en poussette ou en voiture, lumière tamisée, chansons ou musique douce.
- **Relayez-vous** avec l'autre parent ou un proche ; prévoyez des temps de repos.
- **Si vous êtes à bout** : posez doucement le bébé sur le dos dans son lit, dites-lui que vous avez besoin d'une pause, changez de pièce quelques minutes, appelez une personne de confiance. Un bébé qui pleure dans son lit est en sécurité.

## Questions fréquentes
**Faut-il changer de lait ?**
Les changements fréquents de lait n'aident pas et peuvent perturber. Parlez-en au médecin avant toute modification.

**Les probiotiques ou les tisanes marchent-ils ?**
Certains ont montré un intérêt chez certains enfants, mais aucun médicament ne s'impose. Demandez conseil au médecin avant d'en donner.

**Est-ce que je le gâte si je le prends dans les bras ?**
Non. Répondre aux pleurs d'un nourrisson le rassure.

## Quand demander conseil
**Consultez le médecin** si votre bébé pleure beaucoup, pour écarter une cause médicale, et surtout s'il a de la fièvre, vomit, boit mal, a du mal à finir ses biberons, prend peu de poids, ou si ses pleurs sont différents de d'habitude.

**Pour vous** : fatigue intense, sentiment d'être dépassé·e, idées noires : parlez-en à votre médecin, à la sage-femme ou à la PMI ; le 3114 répond 24 h/24.

**Appelez le 15 ou le 112** si votre bébé a un malaise, devient mou, gris, a du mal à respirer, ou s'il a été secoué.

${END}`,
    journeys: ['newborn'],
    category: 'sante-bebe',
    tags: ['coliques', 'pleurs', 'pleurs-du-soir', 'bebe-secoue', 'apaiser'],
    max_age_months: 6,
    safety_critical: true,
    sources: [S.santeColiques],
    status: 'to_review',
  },
  {
    slug: 'poussees-dentaires-bebe',
    title: 'Les poussées dentaires',
    summary: 'Salive, gencives gonflées, envie de mordiller, sommeil perturbé : la poussée dentaire peut gêner, mais elle n’explique ni une forte fièvre ni une diarrhée.',
    body_md: `Les premières dents arrivent souvent au cours de la première année. Certaines passent inaperçues, d'autres rendent bébé grognon. Savoir ce qui relève des dents, et ce qui n'en relève pas, évite de passer à côté d'une maladie.

## En bref
- La poussée dentaire peut entraîner douleurs, irritabilité, salivation abondante, joues rouges et envie de mordiller.
- Elle peut perturber le sommeil et l'appétit.
- Une fièvre liée aux dents ne dépasse pas 38 °C, et l'enfant reste en bon état général.
- Une fièvre plus élevée, une diarrhée ou un enfant qui va mal ne doivent pas être attribués aux dents : consultez.
- Le brossage commence dès la première dent.

## Comprendre
La dent bouge dans l'os de la mâchoire puis traverse la gencive : cela peut faire mal. La salive abondante hydrate la bouche et protège la gencive, mais elle peut irriter la peau du menton. On observe parfois un frottement du visage, des oreilles, des gencives gonflées et sensibles, ou une petite zone foncée près de la dent qui arrive.

Selon les repères officiels, les poussées dentaires ne provoquent pas de fièvre supérieure à 38 °C, ni d'altération de l'état général, ni de diarrhée. Si ces signes apparaissent, il faut chercher une autre cause.

## Au quotidien
- **Proposez-lui de quoi mordiller** : un anneau de dentition adapté à son âge, propre, sous surveillance.
- **Massez doucement sa gencive** avec un doigt propre.
- **Essuyez régulièrement son menton** et protégez la peau si elle est irritée.
- **Évitez les colliers** (ambre ou autres) : ils exposent à un risque de strangulation, qui cause des décès chaque année en France.
- **Demandez conseil** au médecin ou au pharmacien avant tout produit ou médicament.
- **Dès la première dent**, commencez le brossage (voir l'article sur les dents et le brossage).

## Questions fréquentes
**Les dents peuvent-elles donner de la fièvre ?**
Une petite élévation, sans dépasser 38 °C, chez un bébé en forme. Au-delà, ou si votre bébé semble malade, consultez.

**Mon bébé a la diarrhée, c'est à cause des dents ?**
Selon les repères officiels, non : une diarrhée ne doit pas être attribuée aux dents. Surveillez l'hydratation et consultez si besoin.

**Il se frotte les oreilles, est-ce une otite ?**
Le frottement des oreilles peut accompagner une poussée dentaire, mais une otite est possible aussi, surtout avec de la fièvre ou un rhume. Faites-le examiner en cas de doute.

## Quand demander conseil
Consultez le médecin si votre bébé a une fièvre au-dessus de 38 °C, une diarrhée, s'il pleure de façon inhabituelle, semble mal en point, ou si les symptômes vous paraissent inhabituels. Pour une question sur les dents elles-mêmes, le chirurgien-dentiste peut aussi vous répondre. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'sante-bebe',
    tags: ['dents', 'poussee-dentaire', 'fievre', 'salive'],
    min_age_months: 3,
    max_age_months: 36,
    sources: [S.ameliDents, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'vaccins-obligatoires-du-nourrisson',
    title: 'Les vaccins obligatoires du nourrisson',
    summary: 'Onze maladies, huit rendez-vous de 2 à 18 mois, souvent combinés avec les examens obligatoires : ce que prévoit le calendrier vaccinal et pourquoi il compte.',
    body_md: `Les vaccins protègent votre enfant contre des maladies qui peuvent être graves dans les premières années de vie. En France, onze vaccinations sont obligatoires pour les enfants nés depuis le 1er janvier 2018. Elles sont réalisées pour la plupart pendant les examens de suivi.

## En bref
- Les vaccins obligatoires protègent contre 11 maladies : diphtérie, tétanos, poliomyélite, Haemophilus influenzae b, coqueluche, hépatite B, rougeole, oreillons, rubéole, méningocoques ACWY et B, pneumocoque.
- Le parcours comporte 8 rendez-vous et 13 injections (grâce aux vaccins combinés), à 2, 3, 4, 5, 6, 11 et 12 mois, puis entre 16 et 18 mois.
- Ils sont pour la plupart pris en charge par l'Assurance Maladie.
- Ils sont exigés pour l'entrée en collectivité (crèche, école), sauf contre-indication médicale certifiée.
- Le carnet de santé garde la trace de chaque vaccin.

## Comprendre
Un vaccin apprend au système immunitaire à reconnaître un microbe, sans provoquer la maladie, pour mieux se défendre ensuite. Chez le tout-petit, plusieurs doses sont nécessaires pour obtenir une bonne protection, d'où ce calendrier resserré pendant les deux premières années.

Les vaccins combinés permettent de protéger contre plusieurs maladies avec une seule injection, ce qui réduit le nombre de piqûres. Le calendrier est mis à jour régulièrement par les autorités de santé : votre médecin, la sage-femme ou la PMI appliquent le calendrier en vigueur.

Jusqu'à 11 ans, un médecin ou une sage-femme peut vacciner votre enfant ; la PMI le peut jusqu'à 6 ans, souvent gratuitement.

D'autres vaccins sont recommandés selon l'âge ou la situation (par exemple contre le rotavirus) : votre médecin vous en parlera. Pendant la grossesse, certains vaccins de la mère protègent aussi le nouveau-né (coqueluche, VRS en fin de grossesse).

## Au quotidien
- **Apportez le carnet de santé** à chaque rendez-vous.
- **Notez les dates** du calendrier dans votre agenda ou dans l'application.
- **Pendant l'injection**, le tenir contre vous, l'allaiter ou lui parler doucement peut l'aider.
- **Après le vaccin**, une rougeur, un petit gonflement ou une fièvre modérée peuvent apparaître : demandez au médecin ce qu'il conseille.
- **En cas de retard**, le calendrier se rattrape : parlez-en au médecin plutôt que de repousser encore.

## Questions fréquentes
**Faire plusieurs vaccins le même jour, n'est-ce pas trop ?**
Le calendrier est conçu pour protéger au plus tôt, au moment où le risque est le plus élevé. Le système immunitaire d'un bébé est capable de répondre à plusieurs vaccins à la fois.

**Mon enfant a un rhume, peut-on le vacciner ?**
Un petit rhume n'empêche en général pas la vaccination ; le médecin juge le jour du rendez-vous.

**La crèche peut-elle refuser mon enfant s'il n'est pas vacciné ?**
Oui : il faut justifier des vaccinations obligatoires pour l'admission en collectivité, sauf certificat médical de contre-indication visant un vaccin précis.

## Quand demander conseil
Parlez-en au médecin si vous avez des questions ou des inquiétudes avant un vaccin. Après une vaccination, consultez si la fièvre est élevée ou dure, si votre bébé pleure de façon inhabituelle ou semble mal. Appelez le 15 ou le 112 en cas de gêne respiratoire, de gonflement du visage, de malaise ou de bébé très difficile à réveiller.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'sante-bebe',
    tags: ['vaccins', 'vaccination', 'calendrier', 'obligatoire', 'collectivite'],
    max_age_months: 24,
    sources: [S.ameliVaccins, S.ameliSuivi2mois],
    status: 'to_review',
  },
  {
    slug: 'examens-de-sante-et-carnet',
    title: 'Les examens de santé obligatoires et le carnet de santé',
    summary: 'Vingt examens de suivi de la naissance à l’adolescence, dont plusieurs la première année : à quoi ils servent, ce qu’on y vérifie, et comment utiliser le carnet de santé.',
    body_md: `Même quand tout va bien, votre enfant a rendez-vous régulièrement chez le médecin. Ces examens obligatoires suivent sa croissance, son développement, sa vue, son audition, et sont l'occasion de faire ses vaccins et de poser toutes vos questions.

## En bref
- Vingt examens de suivi sont obligatoires de la naissance à l'adolescence ; ils sont pris en charge à 100 % sans avance de frais.
- Jusqu'à 2 mois, quatre consultations sont prévues : à la 2e semaine, avant la fin du 1er mois, au 1er mois et au 2e mois.
- Certains examens donnent lieu à un certificat de santé : au 8e jour, au 9e mois et au 24e mois.
- Le carnet de santé suit votre enfant jusqu'à 18 ans ; il est confidentiel.
- Il est conseillé de choisir un médecin traitant pour votre enfant.

## Comprendre
À chaque examen, le médecin mesure le poids, la taille et le périmètre crânien, et les reporte sur les courbes du carnet de santé : ce sont ces courbes, plus qu'une mesure isolée, qui montrent si l'enfant grandit bien. Il examine aussi les yeux (motricité, strabisme), l'audition, le développement, et répond à vos questions sur l'alimentation, le sommeil, le comportement.

Le carnet de santé est un véritable tableau de bord. Il fait le lien entre les professionnels et les parents. Seuls les professionnels soumis au secret médical peuvent le consulter ; hors consultation médicale, on ne peut vous demander que les certificats de vaccination (par exemple pour une inscription en collectivité).

Les vaccinations obligatoires commencent dès 2 mois et sont souvent faites pendant ces examens.

## Au quotidien
- **Gardez le carnet de santé** dans le sac de l'enfant ou près de vos papiers importants.
- **Préparez vos questions** avant le rendez-vous (l'application peut vous aider à les noter).
- **Notez vos observations** : sommeil, appétit, progrès, ce qui vous inquiète.
- **Déclarez un médecin traitant** pour votre enfant (généraliste ou pédiatre), en ligne avec la carte Vitale.
- **Ne sautez pas un examen** parce que tout va bien : ils servent aussi à repérer tôt ce qui ne se voit pas.

## Questions fréquentes
**Qui peut faire ces examens ?**
Un médecin généraliste, un pédiatre ou un médecin de PMI.

**Je n'ai pas eu le calendrier des examens, où le trouver ?**
L'Assurance Maladie l'envoie après la naissance ; il est aussi disponible sur ameli.fr et dans Mon espace santé.

**La crèche me demande le carnet de santé, dois-je le donner ?**
Hors consultation médicale, seuls les certificats de vaccination peuvent être exigés.

## Quand demander conseil
Entre deux examens, consultez si votre enfant prend peu de poids, ne semble pas bien voir ou entendre, si son développement vous inquiète, ou pour toute question. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'sante-bebe',
    tags: ['examens-obligatoires', 'carnet-de-sante', 'suivi', 'certificat', 'medecin-traitant'],
    sources: [S.santeCarnet, S.ameliSuivi2mois],
    status: 'to_review',
  },
  {
    slug: 'poids-et-croissance-du-nourrisson',
    title: 'Le poids et la croissance de bébé',
    summary: 'Le poids varie d’un jour à l’autre : c’est la courbe sur plusieurs semaines qui compte. Pesées espacées, suivi médical et appétit respecté sont les bons repères.',
    body_md: `« Grossit-il assez ? » Cette question accompagne souvent les premiers mois. La prise de poids d'un bébé n'est pas régulière jour après jour, et chaque enfant suit sa propre courbe. Voici comment lire ces chiffres sans s'inquiéter à tort.

## En bref
- Les courbes de croissance du carnet de santé sont le meilleur repère : on regarde la tendance, pas une pesée isolée.
- Le poids varie beaucoup d'un jour à l'autre ; mieux vaut ne pas peser trop souvent (une fois par semaine au plus, sauf avis médical).
- Poids, taille et périmètre crânien sont mesurés à chaque examen de suivi.
- On respecte l'appétit de l'enfant : on ne force jamais à finir.
- Une stagnation ou une perte de poids doit être montrée au médecin.

## Comprendre
Après la naissance, il est habituel que le bébé perde un peu de poids les premiers jours, avant de le reprendre ; l'équipe de la maternité et la sage-femme surveillent cette période. Ensuite, la prise de poids est rapide les premiers mois puis ralentit progressivement, avec de fortes variations d'un jour à l'autre et d'un enfant à l'autre.

Les courbes du carnet de santé montrent dans quel « couloir » se situe votre enfant. Un enfant peut être petit ou grand, mince ou rond : ce qui compte, c'est qu'il suive sa courbe de manière harmonieuse. Un changement brusque de couloir mérite un avis.

## Au quotidien
- **Faites peser votre bébé lors des consultations** ou à la PMI ; à la maison, une pesée hebdomadaire suffit si on vous l'a conseillée.
- **Notez ses repas et ses couches** si on vous le demande : un bébé qui mouille régulièrement ses couches et qui est éveillé et tonique s'alimente généralement bien.
- **Pour l'allaitement**, une prise du sein efficace et des tétées à la demande soutiennent la croissance ; demandez de l'aide en cas de doute.
- **Au biberon**, suivez son appétit et la notice ; les quantités se discutent avec le professionnel.
- **Regardez l'ensemble** : vitalité, sommeil, éveil, pas seulement la balance.

## Questions fréquentes
**Mon bébé allaité grossit moins vite que celui de ma sœur nourri au biberon, est-ce un problème ?**
Les bébés allaités et nourris au biberon peuvent avoir des courbes un peu différentes. C'est l'évolution sur sa propre courbe qui compte : parlez-en au médecin si vous avez un doute.

**Faut-il acheter une balance ?**
Ce n'est pas nécessaire. Des pesées trop fréquentes peuvent inquiéter sans raison, à cause des variations normales d'un jour à l'autre.

**Il est en bas de la courbe, est-il trop petit ?**
Être en bas de la courbe n'est pas un problème en soi s'il la suit régulièrement. Le médecin interprète la courbe avec vous.

## Quand demander conseil
Consultez si votre bébé ne reprend pas son poids de naissance dans les délais indiqués par la maternité ou la sage-femme, s'il perd du poids, stagne, boit mal, mouille moins de couches, vomit souvent, ou s'il est peu tonique. En cas de bébé très difficile à réveiller ou de refus de boire, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'sante-bebe',
    tags: ['poids', 'croissance', 'courbe', 'pesee'],
    max_age_months: 24,
    sources: [S.santeBesoins04, S.ameliSuivi2mois, S.santeCarnet],
    status: 'to_review',
  },
  // ───────────────────────────── Soins du quotidien et sommeil ─────────────────────────────
  {
    slug: 'retour-a-la-maison-suivi-sage-femme',
    title: 'Le retour à la maison et le suivi par une sage-femme',
    summary: 'Visites de sage-femme à domicile, service Prado, déclaration de naissance, entretien postnatal : comment s’organise l’accompagnement après la maternité.',
    body_md: `Rentrer à la maison avec son bébé, c'est une grande étape, souvent faite de joie, de fatigue et de questions. Vous n'êtes pas seuls : un accompagnement est prévu pour la mère et pour l'enfant pendant les premières semaines.

## En bref
- Une sortie est dite précoce quand elle a lieu dans les 3 jours après la naissance (96 heures après une césarienne).
- Avec le service Prado, une sage-femme de votre choix passe chez vous dans les 24 heures après la sortie, puis organise une ou deux visites suivantes.
- Un suivi à domicile par une sage-femme est proposé jusqu'au 12e jour ; deux séances de suivi postnatal sont possibles entre le 8e jour et la 14e semaine.
- Une puéricultrice de PMI peut aussi venir à domicile si besoin.
- La déclaration de naissance se fait en mairie dans les 5 jours.

## Comprendre
Le retour à la maison est un moment de bouleversement. La sage-femme vérifie votre récupération (saignements, cicatrice, seins, moral) et la santé du bébé (poids, alimentation, jaunisse, cordon). C'est aussi le moment de parler de l'allaitement ou des biberons, du sommeil, de la contraception, et de tout ce qui vous préoccupe.

Prado, le service de retour à domicile de l'Assurance Maladie, est proposé notamment lors des sorties précoces. Un conseiller passe à la maternité, puis la sage-femme organise les visites. Ce suivi est pris en charge à 100 % jusqu'au 12e jour.

Pour la mère, un entretien postnatal précoce est prévu entre la 4e et la 8e semaine, et une consultation postnatale entre la 6e et la 8e semaine. Pour l'enfant, l'Assurance Maladie envoie le calendrier des examens obligatoires.

## Au quotidien
- **Préparez votre liste de questions** pour la visite de la sage-femme.
- **Acceptez l'aide** : repas, courses, linge, garde des aînés. Ce n'est pas le moment de tout faire seule.
- **Reposez-vous quand le bébé dort**, au moins une partie du temps.
- **Limitez les visites** si vous en ressentez le besoin.
- **Gardez à portée de main** le carnet de santé, les numéros utiles (sage-femme, maternité, médecin, PMI) et le 15.
- **Ne secouez jamais un bébé**, même pour jouer ou le calmer.

## Questions fréquentes
**Puis-je choisir ma sage-femme ?**
Oui, dans le cadre de Prado, c'est une sage-femme de votre choix qui organise les visites.

**Et si je ne suis pas sortie tôt ?**
Le suivi à domicile par une sage-femme reste proposé jusqu'au 12e jour, et les séances de suivi postnatal sont possibles ensuite.

**Le père ou le co-parent peut-il poser ses questions ?**
Bien sûr : ces visites concernent toute la famille.

## Quand demander conseil
Pour vous, contactez rapidement la sage-femme, le médecin ou la maternité en cas de fièvre, de saignements abondants ou malodorants, de douleur qui augmente, de sein rouge et douloureux, de tristesse ou d'anxiété envahissantes. Pour votre bébé, en cas de fièvre, de refus de boire, de jaunisse qui s'accentue, de somnolence inhabituelle. En cas d'urgence, appelez le 15 ou le 112 ; en cas de détresse psychique, le 3114.

${END}`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['retour-maison', 'sage-femme', 'prado', 'pmi', 'sortie-maternite'],
    max_age_months: 3,
    sources: [S.ameliRetourMaison, S.santeSuiviApres],
    status: 'to_review',
  },
  {
    slug: 'bain-du-bebe-pas-a-pas',
    title: 'Donner le bain à son bébé, pas à pas',
    summary: 'Un bain tous les deux ou trois jours suffit, dans une eau à 37 °C maximum et une pièce chaude : préparez tout avant, et ne laissez jamais votre enfant seul dans l’eau.',
    body_md: `Le bain peut être un moment de détente et de complicité… à condition de bien le préparer. Quelques repères simples rendent ce moment plus serein, et évitent les deux principaux risques : la brûlure et la noyade.

## En bref
- Le bain est possible dès le retour de la maternité, même si le cordon n'est pas tombé.
- Un bain tous les deux ou trois jours suffit ; entre deux, on nettoie le visage, les mains et le siège à chaque change.
- Pièce entre 22 et 25 °C, eau à 37 °C maximum, vérifiée au thermomètre ; 8 à 12 cm d'eau.
- Ne laissez jamais votre enfant seul dans son bain, même quelques secondes, même s'il tient assis.
- Utilisez un nettoyant sans savon et un shampooing doux pour bébé.

## Comprendre
La peau du nourrisson est fine et fragile. Même doux, les produits de toilette la fragilisent un peu : c'est pourquoi il est conseillé d'espacer les bains. Le vernix, cette substance blanchâtre présente à la naissance, n'a pas besoin d'être retiré.

Les deux grands dangers du bain sont la brûlure (eau trop chaude) et la noyade, qui peut survenir en quelques minutes, même dans très peu d'eau. L'hypothermie est aussi un risque si la pièce est froide.

## Au quotidien
**Avant le bain**
- Préparez tout à portée de main : thermomètre, produit lavant, serviette, couche, vêtements.
- Éteignez votre téléphone, retirez vos bijoux, lavez-vous les mains.
- Faites couler l'eau froide puis la chaude ; refroidissez le robinet et tournez le mitigeur sur le côté.
- Une baignoire posée au sol est plus stable.

**Pendant le bain**
- Déshabillez bébé sur la table à langer, sans jamais l'y laisser seul.
- Soutenez sa tête et sa nuque.
- Lavez les cheveux 2 à 3 fois par semaine avec un shampooing doux, puis savonnez du haut vers le bas, les fesses en dernier.
- Rincez à la main, sans faire couler l'eau du robinet.

**Après le bain**
- Enveloppez-le dans une serviette, séchez bien les plis, mettez la couche et habillez-le vite.
- Videz la baignoire.

**Si vous devez quitter la pièce** : emportez votre bébé enveloppé dans une serviette.

## Questions fréquentes
**À quel moment de la journée donner le bain ?**
Quand cela vous convient. En fin d'après-midi, il peut aider à apaiser certains bébés qui pleurent le soir.

**Les transats et sièges de bain sont-ils sûrs ?**
Ils peuvent être utilisés selon les indications du fabricant, mais ils ne remplacent jamais votre surveillance : restez à côté, une main sur votre enfant.

**Sans thermomètre, comment vérifier la température ?**
Testez l'eau avec le coude, mais le thermomètre reste la méthode la plus fiable.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si sa peau est très sèche, rouge, fissurée, ou présente des plaques. En cas de brûlure ou de bébé qui a avalé de l'eau et respire mal, appelez immédiatement le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['bain', 'toilette', 'hygiene', 'noyade', 'brulure'],
    max_age_months: 36,
    sources: [S.ameliBain, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'change-et-toilette-du-nourrisson',
    title: 'Le change et la toilette du nourrisson',
    summary: 'Changer bébé, nettoyer ses yeux, son nez, ses oreilles, couper ses ongles : les gestes simples recommandés, et les règles de sécurité sur la table à langer.',
    body_md: `Changer une couche, nettoyer un petit nez, couper des ongles minuscules… Ces gestes reviennent plusieurs fois par jour. Ils deviennent vite naturels avec quelques repères, et un principe de base : ne jamais laisser bébé seul sur la table à langer.

## En bref
- Le matériel de base : eau tiède, savon doux, gant ou coton, serviette propre ; des lingettes sans parfum si vous n'avez pas d'eau.
- Pour une fille, on nettoie la vulve du pubis vers l'anus ; pour un garçon, on ne décalotte pas.
- Une crème protectrice n'est pas nécessaire ; une pommade à l'oxyde de zinc peut aider si la peau est irritée.
- Jamais de coton-tige dans les oreilles.
- Restez toujours à côté de votre bébé sur la table à langer.

## Comprendre
La peau du siège est exposée à l'humidité et aux selles : un nettoyage doux et un séchage soigneux suffisent dans la plupart des cas. Les produits parfumés ou trop nombreux peuvent irriter.

Le prépuce des petits garçons est normalement serré à cet âge : il ne faut pas chercher à le décalotter.

## Au quotidien
**Le change**
1. Lavez-vous les mains et installez bébé sur une serviette propre.
2. Retirez la couche, repliez-la.
3. Tenez ses pieds d'une main, soulevez doucement ses fesses et nettoyez de l'autre, en insistant sur les plis de l'aine et entre les fesses.
4. Nettoyez les organes génitaux : vulve du pubis vers l'anus pour une fille, bourses et pénis sans décalotter pour un garçon.
5. Rincez, séchez en tamponnant, remettez une couche propre.
6. Lavez-vous les mains.

**Le visage**
- **Yeux** : quelques gouttes de sérum physiologique, puis essuyez avec une compresse, de l'extérieur vers l'intérieur.
- **Nez** : sérum physiologique dans chaque narine, puis essuyez, ou mèche de coton imbibée.
- **Oreilles** : nettoyez le pavillon et derrière l'oreille, puis l'entrée du conduit avec une serviette fine ou une mèche de coton, jamais de coton-tige.

**Cuir chevelu** : un lavage 2 à 3 fois par semaine suffit ; un brossage quotidien avec une brosse douce limite les croûtes de lait.

**Ongles** : ne coupez pas les ongles collés à la peau les premiers jours. Ensuite, coupez-les après le bain ou pendant la sieste, avec des ciseaux à bout rond : arrondis pour les mains, droits pour les pieds.

**Sécurité** : préparez tout à l'avance ; si vous devez attraper un objet, gardez une main sur bébé ; après le change, posez-le dans un endroit sûr, comme son lit.

## Questions fréquentes
**Les lingettes sont-elles adaptées ?**
L'eau et un savon doux restent la référence. Des lingettes sans parfum peuvent dépanner quand vous n'avez pas d'eau.

**Ses fesses sont rouges, que faire ?**
Changez-le souvent, nettoyez à l'eau, séchez bien et laissez si possible les fesses à l'air quelques minutes. Une pommade à l'oxyde de zinc peut aider (voir aussi l'article sur la peau et les fesses rouges).

**Un œil colle le matin, est-ce grave ?**
Nettoyez au sérum physiologique. Consultez si l'œil est rouge avec un écoulement de pus.

## Quand demander conseil
Consultez si l'érythème fessier ne s'améliore pas en quelques jours, saigne ou s'étend, en cas d'œil rouge qui coule, de plaques sur la peau, ou si vous remarquez quelque chose d'inhabituel au niveau des organes génitaux. En cas de chute de la table à langer avec choc à la tête, de somnolence ou de vomissements, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['change', 'couche', 'toilette', 'yeux', 'ongles', 'table-a-langer'],
    max_age_months: 36,
    sources: [S.ameliChange, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'sommeil-du-bebe-rythmes-et-nuits',
    title: 'Le sommeil de bébé : rythmes, cycles et nuits',
    summary: 'Un nouveau-né dort 16 à 17 heures sans distinguer le jour de la nuit ; le rythme se construit peu à peu, et beaucoup de bébés font leurs nuits entre 4 et 6 mois.',
    body_md: `« Quand va-t-il faire ses nuits ? » est l'une des questions les plus fréquentes des jeunes parents. Le sommeil d'un bébé est très différent de celui d'un adulte, et il évolue beaucoup pendant les premières années. Comprendre son fonctionnement aide à mieux vivre les nuits.

## En bref
- Un nouveau-né dort 16 à 17 heures par jour, par périodes de 3 à 4 heures, sans distinguer le jour de la nuit.
- Les cycles de sommeil sont courts (50 à 60 minutes chez le nouveau-né) ; les éveils brefs entre deux cycles font partie du sommeil.
- Beaucoup de bébés « font leurs nuits » entre 4 et 6 mois, mais chacun à son rythme.
- La lumière du jour, l'activité et la régularité aident à construire le rythme jour/nuit.
- Couchage toujours sur le dos, dans son lit, sans oreiller ni couverture (voir l'article sur le couchage sûr).

## Comprendre
**De 0 à 6 mois**, le bébé dort beaucoup, par petites périodes. Avant 3 à 4 mois, se réveiller après 2 à 4 heures de sommeil fait partie du développement : ce rythme est dicté par le cerveau, pas seulement par la faim. Les siestes s'organisent progressivement (matin, début et fin d'après-midi).

**De 6 mois à 1 an**, le sommeil dure environ 13 à 14 heures, dont l'essentiel la nuit ; la sieste de fin d'après-midi disparaît.

**De 1 à 3 ans**, la sieste du matin disparaît vers 18 mois ; il reste en général une sieste en début d'après-midi. Des éveils nocturnes persistent, souvent sans qu'on s'en aperçoive : l'enfant se rendort seul.

Les cycles de sommeil s'allongent avec l'âge, et le sommeil se structure comme celui de l'adulte vers 3 ans.

## Au quotidien
- **Avant 3 à 4 mois, suivez son rythme** sans chercher à l'imposer.
- **Le jour : lumière et activité** ; **la nuit : pénombre, calme, peu de paroles**. Ces « donneurs de temps » l'aident à différencier jour et nuit.
- **Ne cherchez pas à le faire boire davantage le soir** : cela n'allonge pas ses nuits et peut provoquer des régurgitations.
- **Après 6 mois**, laissez-lui une chance de se rendormir seul avant d'intervenir ; s'il pleure fort, rassurez-le par la voix, une caresse, sans forcément proposer à boire à chaque réveil.
- **Un rituel du coucher** calme et répété (bain, chanson, histoire) peut l'aider à se préparer au sommeil.
- **Partager la chambre** de vos parents est conseillé les premiers mois, dans son propre lit.

## Questions fréquentes
**Mon bébé de 2 mois se réveille toutes les 3 heures, est-ce un problème ?**
À cet âge, les réveils fréquents font partie du développement du sommeil. Parlez-en au médecin si vous êtes épuisé·e ou si autre chose vous inquiète.

**Faut-il le réveiller pour manger ?**
Les premiers jours, la maternité ou la sage-femme peuvent vous le conseiller selon sa situation. Ensuite, on suit en général son rythme : demandez ce qui convient à votre bébé.

**Il s'endort uniquement au sein ou dans les bras, est-ce grave ?**
C'est fréquent. Progressivement, après quelques mois, vous pourrez l'aider à s'endormir dans son lit. Demandez conseil si la situation vous pèse.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé dort très peu ou énormément, si son sommeil est très agité, s'il ronfle fort avec des pauses, ou si les nuits vous épuisent. Un bébé anormalement difficile à réveiller, mou, ou qui respire mal impose d'appeler le 15 ou le 112. Si la fatigue vous submerge, le 3114 répond 24 h/24.

${END}`,
    journeys: ['newborn'],
    category: 'sommeil',
    tags: ['sommeil', 'nuits', 'rythme', 'siestes', 'cycles'],
    max_age_months: 36,
    sources: [S.santeSommeil, S.mpediaNuits],
    status: 'to_review',
  },
  // ───────────────────────────── Développement et éveil ─────────────────────────────
  {
    slug: 'developpement-moteur-premiere-annee',
    title: 'Le développement moteur pendant la première année',
    summary: 'Tenir sa tête, se retourner, s’asseoir, ramper, se mettre debout : les grandes étapes de la première année, avec de grandes différences d’un enfant à l’autre.',
    body_md: `En un an, votre bébé passe du nouveau-né blotti dans vos bras à l'enfant qui se met debout en s'agrippant aux meubles. Ces progrès suivent un ordre assez constant, mais à un rythme propre à chaque enfant. Les âges ci-dessous sont des repères, pas des examens à réussir.

## En bref
- Vers 2 mois, il commence à soulever la tête, sourit en réponse et suit du regard ; vers 3 mois, il tient sa tête droite quand on le porte assis.
- Vers 4 mois, il se retourne ; vers 6 à 7 mois, il sautille quand on le tient debout.
- Entre 7 et 9 mois, il apprend à s'asseoir seul, puis se déplace en roulant, rampant ou à quatre pattes.
- Entre 9 et 12 mois, il se met debout en s'appuyant, utilise la pince pouce-index, pointe du doigt.
- Les différences entre enfants sont importantes : en cas de doute, parlez-en au médecin.

## Comprendre
**De 0 à 3 mois**, les réflexes du nouveau-né (marche automatique, agrippement) disparaissent progressivement : inutile de les provoquer. Le bébé découvre le monde par le regard, le toucher, la voix. Il est plus attiré par les contrastes noir et blanc que par les couleurs vives.

**De 3 à 6 mois**, il gagne en tonus, découvre ses mains, attrape les objets, se retourne.

**De 6 à 9 mois**, il apprend à s'asseoir seul : d'abord appuyé sur les mains (« en trépied »), puis le dos droit, ce qui libère ses mains pour jouer et manger. Il se déplace en roulant, en rampant, à quatre pattes ou assis sur les fesses. La pince pouce-index apparaît ; il tend les bras pour être pris.

**De 9 à 12 mois**, il se met debout en passant par la position à genoux, se déplace le long des meubles, empile deux ou trois cubes avec aide, vide et remplit des contenants. Vers 8 mois, l'angoisse de séparation est fréquente.

Une préférence pour une main ne veut pas dire qu'il sera gaucher ou droitier, ni qu'il a une gêne de l'autre côté.

## Au quotidien
- **Laissez-le bouger librement** sur un tapis au sol, dans un espace sécurisé, sous votre regard.
- **Variez les positions** quand il est éveillé, et toujours sur le dos pour dormir.
- **Jouez avec lui** : regards, chansons, objets à attraper, cache-cache pour apprivoiser la séparation.
- **Évitez le trotteur**, qui n'aide pas la marche et expose à des chutes.
- **Sécurisez l'espace** au fur et à mesure qu'il se déplace (escaliers, prises, petits objets).

## Questions fréquentes
**Il ne se met pas à quatre pattes, est-ce un problème ?**
Certains enfants ne passent pas par le quatre pattes et se déplacent autrement (sur les fesses, en rampant). C'est la progression globale qui compte.

**Faut-il l'asseoir avant qu'il tienne seul ?**
Il est préférable de le laisser découvrir les positions par lui-même, à son rythme, plutôt que de le maintenir dans une position qu'il ne maîtrise pas encore.

**Il est plus « en retard » que son cousin du même âge…**
Les comparaisons sont tentantes mais peu fiables : les écarts sont grands entre enfants. Le médecin suit son développement à chaque examen.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé ne tient pas sa tête vers 4 mois, ne cherche pas à attraper les objets, semble très raide ou au contraire très mou, n'utilise qu'un côté de son corps, a perdu des acquisitions, ou si vous avez simplement un doute. Le repérage précoce permet d'accompagner au mieux.

${END}`,
    journeys: ['newborn'],
    category: 'developpement',
    tags: ['developpement', 'motricite', 'etapes', 'eveil', 'premiere-annee'],
    max_age_months: 12,
    sources: [S.mpediaDev03, S.mpediaDev69, S.santeDev912],
    status: 'to_review',
  },
  {
    slug: 'premiers-pas-et-marche',
    title: 'Les premiers pas et l’apprentissage de la marche',
    summary: 'La plupart des enfants marchent entre 12 et 18 mois : espace pour explorer, pieds nus à la maison, pas de trotteur, et beaucoup d’encouragements.',
    body_md: `Les premiers pas sont un moment très attendu. Ils arrivent quand l'enfant est prêt, après des mois d'entraînement : se retourner, ramper, se mettre debout, se déplacer le long des meubles. Voici comment l'accompagner sans le presser.

## En bref
- La marche apparaît en moyenne entre 12 et 18 mois ; marcher à 17 ou 18 mois peut tout à fait arriver chez un enfant qui se développe bien.
- Avant, l'enfant se met debout en s'appuyant, puis se déplace en se tenant aux meubles.
- Laissez-le explorer, pieds nus à la maison, dans un espace sécurisé.
- Le trotteur est déconseillé (chutes, notamment dans les escaliers).
- Pour sortir, des chaussures souples et légères, faciles à enfiler.

## Comprendre
Dès la naissance, le bébé a un réflexe de marche qui disparaît ensuite. La vraie marche se construit étape par étape : tenue de la tête, retournements, position assise, déplacements au sol, station debout avec appui. Entre 10 et 12 mois, beaucoup d'enfants se mettent debout seuls, après avoir maîtrisé la position assise et la position à genoux.

Marcher pieds nus permet de mieux sentir le sol et de trouver son équilibre. Le trotteur, lui, n'apporte rien au développement et augmente le risque d'accident : la grande majorité des accidents de trotteur sont des chutes dans les escaliers.

## Au quotidien
- **Laissez-lui de l'espace** pour se déplacer, contourner des obstacles, tomber sur les fesses et recommencer.
- **Tenez-le par les mains** si vous l'aidez, sans lever ses bras au-dessus de ses épaules.
- **Encouragez-le** en vous plaçant un peu hors de sa portée, sans le brusquer : la pression ralentit souvent les progrès.
- **Proposez des jouets à pousser** ou des porteurs.
- **Sécurisez la maison** : barrières en haut et en bas des escaliers, coins de meubles, objets fragiles hors de portée.

## Questions fréquentes
**Mon enfant a 15 mois et ne marche pas encore, dois-je m'inquiéter ?**
La majorité des enfants marchent entre 12 et 15 mois, et marcher à 18 mois peut tout à fait se produire. Si vous avez un doute, ou s'il ne se met pas debout avec appui, parlez-en au médecin.

**Quelles chaussures choisir ?**
À la maison, pieds nus de préférence. Pour sortir : semelle souple et fine, chaussure légèrement montante, contrefort rigide, facile à enfiler.

**Il marche sur la pointe des pieds, est-ce grave ?**
Parlez-en au médecin si cela persiste ou si vous avez un doute.

## Quand demander conseil
Consultez le médecin si votre enfant ne marche pas vers 18 mois, s'il ne tient pas debout avec appui, s'il boite, semble avoir mal, perd des acquisitions, ou si sa marche vous paraît inhabituelle. En cas de chute avec choc à la tête suivie de vomissements, de somnolence ou de comportement anormal, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'developpement',
    tags: ['marche', 'premiers-pas', 'trotteur', 'chaussures', 'motricite'],
    min_age_months: 8,
    max_age_months: 24,
    sources: [S.mpediaMarche, S.santeDev912, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'langage-premiere-annee',
    title: 'Le langage pendant la première année',
    summary: 'Sourires et vocalises, gazouillis, babillage, premiers mots vers 9 à 12 mois : comment le langage se construit et comment l’encourager au quotidien.',
    body_md: `Bien avant de dire « papa » ou « maman », votre bébé communique : par ses pleurs, ses regards, ses sourires, ses sons. Le langage commence par la compréhension et les échanges. Et vous en êtes le premier partenaire.

## En bref
- Vers 2 mois, bébé sourit, vocalise et imite l'intonation de votre voix.
- Vers 5 à 6 mois, il gazouille avec des consonnes, reconnaît son prénom et commence à babiller (ba-ba, pa-pa).
- Entre 6 et 9 mois, il comprend des mots dans leur contexte ; le geste « au revoir » est souvent un des premiers.
- Les premiers mots apparaissent entre 9 et 12 mois ; vers 12 mois, il dit « non » et montre du doigt.
- Parlez-lui, chantez, lisez, et limitez la télévision, qui n'offre aucun échange.

## Comprendre
Un bébé apprend à parler en écoutant, en observant et surtout en échangeant. Quand vous répétez ses sons puis faites une pause pour qu'il vous réponde, vous jouez au « chacun son tour », la base de la conversation. Ce jeu peut commencer dès 2 ou 3 mois.

Les « mots » du début peuvent être des bruitages ou des mots très déformés : ils comptent s'ils désignent toujours la même chose. Ils s'accompagnent souvent de gestes, comme pointer du doigt pour partager une découverte.

## Au quotidien
- **Parlez-lui souvent** de ce que vous faites, avec des mots variés, en articulant, accompagnés de gestes.
- **Nommez les objets** en les montrant.
- **Répondez à ses sons** et laissez-lui le temps de « répondre ».
- **Chantez des comptines**, lisez des imagiers, des livres en tissu ou en plastique.
- **Limitez la télévision et les écrans** : ils ne remplacent pas l'échange.
- **Regardez-le dans les yeux** quand vous lui parlez.

## Questions fréquentes
**Faut-il lui parler « bébé » ?**
Une voix douce et chantante l'attire, mais des mots corrects et variés l'aident à apprendre. Parlez-lui naturellement.

**Nous parlons deux langues à la maison, est-ce un problème ?**
Parlez-lui dans la ou les langues que vous maîtrisez et avec lesquelles vous êtes à l'aise. En cas de question, parlez-en au médecin ou à la PMI.

**Il ne dit pas encore de mots à 10 mois…**
Les premiers mots apparaissent entre 9 et 12 mois, parfois un peu plus tard. Ce qui compte surtout, c'est qu'il communique : regards, sourires, babillage, gestes.

## Quand demander conseil
Consultez le médecin ou la PMI si votre bébé ne sursaute pas lors d'un bruit soudain, ne babille pas, ne répond pas à votre voix par des sons, ne regarde pas quand on l'appelle, ou s'il existe des troubles du langage ou de l'audition dans la famille. Des tests permettent de dépister tôt les difficultés d'audition et de langage.

${END}`,
    journeys: ['newborn'],
    category: 'developpement',
    tags: ['langage', 'babillage', 'premiers-mots', 'communication', 'audition'],
    max_age_months: 12,
    sources: [S.santeLangage212, S.mpediaDev69],
    status: 'to_review',
  },
  {
    slug: 'langage-de-1-a-3-ans',
    title: 'Le langage de 1 à 3 ans',
    summary: 'Un mot pour une phrase, puis deux mots associés, puis de vraies phrases : les grandes étapes du langage du tout-petit et les signes qui doivent faire consulter.',
    body_md: `Entre 1 et 3 ans, le langage fait des bonds spectaculaires. L'enfant comprend bien plus de mots qu'il n'en dit, puis il les assemble, pose mille questions, raconte. Votre façon de lui répondre l'aide à progresser.

## En bref
- De 1 an à 18 mois, un seul mot sert souvent de phrase (« gâteau » pour « je veux un gâteau ») ; le « non » s'installe.
- De 18 mois à 2 ans, il connaît souvent plusieurs centaines de mots, dit « moi », associe deux mots (« moi-manger »).
- De 2 à 3 ans, les phrases s'allongent, il pose sans cesse des questions et utilise « je ».
- Ne reprenez pas sa prononciation : répétez simplement le mot correctement.
- L'absence de phrases correctes vers 2 à 3 ans, ou une compréhension difficile, doit faire consulter.

## Comprendre
La compréhension précède toujours la parole : votre enfant comprend beaucoup de choses avant de pouvoir les dire. L'articulation s'acquiert sur plusieurs années, et il est fréquent qu'un enfant de 2 ans déforme encore beaucoup de mots.

Vers 2 à 3 ans, il commence à situer les objets dans l'espace (dedans, dehors), à distinguer hier et demain, et son vocabulaire s'enrichit : tailles, couleurs, formes, premiers chiffres.

## Au quotidien
- **Parlez avec lui** dans une ambiance agréable, avec des échanges, des regards, des sourires.
- **Laissez-le exprimer** ses besoins et ses envies, sans parler à sa place.
- **Reformulez** ses phrases quand elles sont incomplètes (« Tu veux de l'eau ? Oui, tu veux de l'eau dans ton verre »), et posez-lui des questions.
- **Félicitez ses progrès** sans exiger une prononciation parfaite.
- **Chantez, racontez, lisez** ; jouez à la dînette, au memory, aux jeux d'imitation.
- **Limitez les écrans** au profit des échanges.

## Questions fréquentes
**Il dit peu de mots mais comprend tout, est-ce rassurant ?**
Une bonne compréhension est un élément important. Si à 2 ans il associe peu ou pas de mots, parlez-en au médecin, qui évaluera la situation.

**Il bégaie depuis quelques semaines, que faire ?**
Restez calme, laissez-lui le temps de finir sans terminer ses phrases à sa place, et parlez-en au médecin si cela persiste ou le gêne.

**Faut-il corriger ses erreurs ?**
Plutôt que de le reprendre, répétez le mot ou la phrase correctement, naturellement.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si :
- votre enfant est difficile à comprendre et sa parole ne s'améliore pas ;
- il bégaie ou a une parole très saccadée ;
- il ne fait pas de phrases correctes vers 2 à 3 ans ;
- il a du mal à comprendre ce qu'on lui dit, ou son attention décroche très vite ;
- il existe des troubles du langage dans la famille, ou l'entourage (crèche, école) vous signale un retard.

Des tests permettent un repérage précoce et une prise en charge plus efficace (voir aussi les articles « Neurodéveloppement »).

${END}`,
    journeys: ['newborn', 'child'],
    category: 'developpement',
    tags: ['langage', 'parole', 'mots', 'phrases', 'begaiement'],
    min_age_months: 12,
    max_age_months: 36,
    sources: [S.santeLangage13],
    status: 'to_review',
  },
  {
    slug: 'jouer-avec-bebe-eveil',
    title: 'Jouer avec son bébé : l’éveil au fil des mois',
    summary: 'Le jeu est essentiel au développement : des idées adaptées à chaque âge, du hochet aux encastrements, avec les parents comme premier « jouet », et sans écran.',
    body_md: `Pour un bébé, jouer, c'est apprendre : découvrir son corps, les objets, les autres. Pas besoin de jouets sophistiqués. Le jeu le plus précieux, c'est celui qu'il partage avec vous.

## En bref
- Le jeu nourrit le développement affectif, intellectuel et physique.
- Un jouet adapté à l'âge est celui qui n'est ni trop facile ni trop difficile.
- De 0 à 6 mois : regards, voix, hochets, mobiles, portiques ; de 6 à 9 mois : jeux répétitifs, tapis d'éveil, livres en tissu ; vers 1 an : cubes, encastrements, comptines à gestes.
- La télévision et les écrans sont à éviter chez le tout-petit.
- Vérifiez que les jouets sont adaptés à l'âge et sans petites pièces détachables.

## Comprendre
**De 0 à 6 mois**, votre bébé aime vous regarder, vous imiter, écouter votre voix. Il observe son environnement : changer le transat de place lui offre de nouveaux points de vue. Hochets, mobiles et portiques éveillent ses sens.

**Vers 6 mois**, il rit aux chatouilles et adore les jeux répétitifs avec une petite variante. Son attention retombe vite : changez de jeu sans insister.

**Jusqu'à 9 mois**, la pince pouce-index apparaît : il manipule, tape, découvre que ses gestes produisent des effets. Tapis d'éveil, jeux multi-activités, livres en tissu ou en plastique pour le bain lui plaisent.

**Vers 1 an**, il s'intéresse aux formes, aux couleurs, aux cubes et aux encastrements, explore l'espace et adore les comptines à gestes et les jeux de doigts. Il commence à s'intéresser aux images et aux histoires très courtes.

Les écrans fascinent mais rendent l'enfant passif : il ne bouge plus, ne découvre plus son corps en mouvement. Rien ne remplace les jeux partagés.

## Au quotidien
- **Accordez-lui des temps au sol**, sur un tapis, dans un espace sécurisé.
- **Jouez à coucou-caché** : il apprend que ce qui disparaît revient, ce qui l'aide à vivre les séparations.
- **Lisez-lui des histoires courtes** dans un moment de câlin.
- **Faites tourner les jouets** plutôt que de tout laisser à disposition.
- **Vérifiez l'âge indiqué** sur les jouets et retirez ceux qui sont cassés.
- **Laissez-le s'ennuyer un peu** : c'est aussi comme cela qu'il explore.

## Questions fréquentes
**Faut-il beaucoup de jouets ?**
Non. Quelques jouets adaptés, des objets du quotidien sûrs (gobelets, boîtes) et surtout votre présence suffisent.

**Les applications « éducatives » pour bébé sont-elles utiles ?**
Chez le tout-petit, les échanges réels avec l'adulte sont bien plus bénéfiques que les écrans, même présentés comme éducatifs (voir l'article sur les écrans).

**Il se lasse vite de ses jouets…**
Son attention est courte à cet âge : c'est attendu. Variez les propositions et suivez ses envies.

## Quand demander conseil
Parlez-en au médecin ou à la PMI si votre bébé s'intéresse peu aux personnes ou aux objets, ne sourit pas en réponse, ne cherche pas à attraper vers 5 à 6 mois, ou si vous avez un doute sur son développement. En cas d'objet avalé ou de gêne respiratoire, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'developpement',
    tags: ['eveil', 'jeux', 'jouets', 'ecrans', 'lecture'],
    max_age_months: 24,
    sources: [S.mpediaJeux01, S.mpediaDev03],
    status: 'to_review',
  },
  // ───────────────────────────── Sécurité et accidents ─────────────────────────────
  {
    slug: 'prevenir-accidents-domestiques-tout-petits',
    title: 'Prévenir les accidents domestiques des tout-petits',
    summary: 'Chutes, brûlures, intoxications, noyade, étouffement, strangulation, électrocution : les gestes de prévention pièce par pièce, car la surveillance reste la meilleure protection.',
    body_md: `Dès qu'un bébé commence à bouger, à attraper, puis à se déplacer, la maison devient un terrain d'exploration… et de dangers. La plupart des accidents domestiques peuvent être évités par quelques aménagements simples. Le risque zéro n'existe pas : la surveillance d'un adulte reste la meilleure protection.

## En bref
- Ne laissez jamais bébé seul sur la table à langer ni dans le bain.
- Barrières homologuées dans les escaliers, fenêtres et balcons sécurisés, pas de trotteur.
- Médicaments et produits ménagers en hauteur, dans un placard fermé, dans leur emballage d'origine.
- Petits objets et aliments à risque (cacahuètes, fruits secs, perles, pièces) hors de portée.
- Pas de collier, ni d'ambre ni d'autre, au cou d'un enfant.

## Comprendre
Les accidents de la vie courante sont une cause importante de blessures graves chez les jeunes enfants. Selon Santé.fr, la noyade est la première cause de décès par accident domestique avant 13 ans, et la strangulation (colliers, cordons) cause des décès chaque année. Les chutes dans les escaliers sont fréquentes avec les trotteurs.

Le tout-petit ne perçoit pas le danger. Il grimpe, porte tout à la bouche, tire sur ce qui dépasse. C'est donc à l'environnement de s'adapter, au fil de ses progrès.

## Au quotidien
**Chutes**
- Barrières de sécurité homologuées en haut et en bas des escaliers.
- Fenêtres et balcons sécurisés, sans meuble ni jouet sur lequel grimper à proximité.
- Toujours attaché dans la chaise haute et le transat ; jamais seul sur un meuble en hauteur.
- Pas de trotteur.

**Brûlures**
- Bain à 37 °C au maximum, vérifié au thermomètre ; chauffe-eau réglé au minimum.
- Enfant éloigné de la cheminée, de l'insert et des radiateurs brûlants.
- Queues de casseroles tournées vers l'intérieur ; fer à repasser débranché et rangé.
- Température des aliments et biberons testée, surtout après un passage au micro-ondes.
- Ne buvez pas de boisson chaude avec bébé dans les bras.

**Intoxications**
- Médicaments rangés en hauteur, dans un placard fermé à clé, jamais dans un sac à main.
- Produits ménagers jamais transvasés dans une bouteille alimentaire.
- Méfiance avec les dosettes de lessive liquide et les piles bouton.
- Cosmétiques (dissolvant, teinture) hors de portée.

**Noyade**
- Jamais seul dans le bain avant 3 ans, même dans un siège de bain.
- Piscine : surveillance active, portillon fermé, volet ou bâche remis après usage.

**Étouffement et strangulation**
- Petits aliments durs et petits objets hors de portée ; jouets cassés retirés.
- Pas de collier, cordon, ni gri-gri autour du cou.

**Électrocution**
- Cache-prises sur toutes les prises accessibles ; appareils électriques débranchés et rangés.

## Questions fréquentes
**À partir de quand sécuriser la maison ?**
Dès que bébé commence à se retourner et à attraper, puis à chaque nouvelle étape (ramper, se mettre debout, grimper).

**Les cache-prises suffisent-ils ?**
Ils sont utiles, mais rien ne remplace la surveillance et le rangement des appareils.

**Où trouver le numéro du centre antipoison ?**
Notez-le dès maintenant dans votre téléphone ; il est indiqué sur ameli.fr et sur le site des centres antipoison. En cas d'enfant inconscient ou de détresse, c'est le 15 ou le 112.

## Quand demander conseil
**Appelez le 15 ou le 112** en cas de chute avec perte de connaissance, vomissements ou somnolence, de brûlure étendue ou au visage, aux mains ou aux organes génitaux, d'enfant retiré de l'eau, d'étouffement, ou d'intoxication avec enfant inconscient ou en difficulté. Pour une ingestion de produit chez un enfant conscient, appelez le centre antipoison sans attendre les symptômes. Consultez un médecin pour toute blessure qui vous inquiète.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'securite',
    tags: ['accidents-domestiques', 'chutes', 'brulures', 'noyade', 'intoxication', 'prevention'],
    max_age_months: 72,
    safety_critical: true,
    sources: [S.santeAccidents, S.ameliIntox],
    status: 'to_review',
  },
  {
    slug: 'etouffement-fausse-route-que-faire',
    title: 'Étouffement par fausse route : reconnaître et réagir',
    summary: 'Un aliment ou un objet coincé dans les voies respiratoires est une urgence : appeler le 15 ou le 112, connaître les gestes adaptés à l’âge, et surtout prévenir.',
    body_md: `Une cacahuète, un grain de raisin, une petite pièce de jouet : chez un tout-petit, un objet peut partir dans les voies respiratoires au lieu de l'œsophage. C'est la fausse route. Savoir la reconnaître et réagir peut sauver une vie. Une formation aux gestes de premiers secours est vivement utile pour tous les parents.

## En bref
- Toux brutale, gêne pour respirer, agitation : l'enfant tousse encore ? On ne fait rien d'autre que le laisser tousser, en le surveillant.
- S'il ne peut plus tousser, ni crier, ni respirer, ou devient bleu : appelez immédiatement le 15 ou le 112.
- Ne mettez jamais les doigts dans sa bouche à l'aveugle et ne le suspendez jamais par les pieds.
- Les gestes d'expulsion dépendent de l'âge : apprenez-les lors d'une formation aux premiers secours.
- Après une fausse route grave, un avis médical à l'hôpital est nécessaire.

## Comprendre
Quand l'objet bloque partiellement les voies respiratoires, l'enfant tousse : cette toux est le meilleur moyen d'expulser l'objet. Il ne faut pas l'interrompre. Toute manœuvre dans ce cas pourrait déplacer l'objet et aggraver l'obstruction.

Quand l'obstruction est complète, l'enfant ne tousse plus, ne peut plus parler ni pleurer, ses lèvres peuvent bleuir, il perd son tonus : c'est une urgence vitale. Chez le petit enfant, les signes sont parfois discrets.

## Au quotidien
**En cas d'asphyxie (il ne tousse plus, ne respire plus)**
- Appelez le 15 ou le 112, ou faites appeler, immédiatement.
- Ne l'allongez pas : laissez-le dans la position qu'il prend, souvent assis et penché en avant.
- Appliquez les gestes enseignés pour son âge, sur les conseils du médecin régulateur. Selon ameli.fr :
  - **enfant de moins de 3 ans** : le placer à plat ventre sur votre cuisse, tête vers le bas, et donner des coups secs entre les omoplates (manœuvre de Mofenson) ;
  - **à partir de 3 ans** : jusqu'à 5 claques dans le dos, entre les omoplates, enfant penché en avant ;
  - **à partir de 1 an**, si les claques échouent : compressions brusques vers le haut, poing placé entre le nombril et le bas du sternum (manœuvre de Heimlich).
- Arrêtez dès que l'objet est expulsé ou que l'enfant tousse à nouveau.
- Restez au téléphone avec le Samu et suivez ses consignes ; une évaluation à l'hôpital est nécessaire.

**Pour prévenir**
- Pas de cacahuètes, fruits à coque ou raisins entiers, ni de bonbons durs pour les jeunes enfants ; coupez les aliments ronds.
- Rangez petits objets, piles, pièces de monnaie et croquettes d'animaux hors de portée.
- Choisissez des jouets adaptés à l'âge, sans petites pièces détachables.
- Faites manger l'enfant assis, calme, sous surveillance, sans courir ni jouer en mangeant.

## Questions fréquentes
**Il a toussé fort après avoir avalé de travers mais va bien maintenant, que faire ?**
S'il respire normalement, parle ou pleure normalement, surveillez-le. S'il garde une toux, une gêne respiratoire, un sifflement, ou si vous pensez qu'un objet a pu être inhalé, consultez rapidement.

**Il a avalé une pile bouton, est-ce une urgence ?**
Oui : une pile bouton avalée peut causer des lésions très graves. Appelez immédiatement le 15 ou le 112.

**Où apprendre les gestes ?**
Des formations aux premiers secours sont proposées par des associations agréées ; certaines maternités et PMI en organisent pour les parents.

## Quand demander conseil
**Urgence : appelez le 15 ou le 112** dès que l'enfant ne peut plus tousser, respirer, parler ou pleurer, devient bleu ou perd connaissance, ou en cas de pile bouton avalée. Consultez un médecin si une toux ou une gêne persiste après un épisode d'étouffement.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'securite',
    tags: ['etouffement', 'fausse-route', 'premiers-secours', 'urgence', 'pile-bouton'],
    safety_critical: true,
    sources: [S.ameliInhale, S.santeAccidents, S.ameliIntox],
    status: 'to_review',
  },
  {
    slug: 'enfant-a-avale-un-produit-que-faire',
    title: 'Mon enfant a avalé un produit ou un médicament : que faire ?',
    summary: 'Agir vite même sans symptôme : appeler le centre antipoison (ou le 15 si l’enfant est inconscient), ne pas faire vomir, ne rien donner à boire, garder l’emballage.',
    body_md: `Un flacon mal refermé, un médicament oublié sur une table, une dosette de lessive : en quelques secondes, un tout-petit peut avaler un produit dangereux. Les bons réflexes, dans les premières minutes, sont essentiels.

## En bref
- Agissez vite, même si votre enfant n'a aucun symptôme.
- Enfant inconscient : appelez le 15 ou le 112 et placez-le en position latérale de sécurité.
- Enfant conscient : appelez le centre antipoison le plus proche.
- Ne le faites pas vomir, ne lui donnez ni lait ni eau.
- Gardez l'emballage, la notice et les restes du produit.

## Comprendre
Faire vomir peut aggraver les brûlures d'un produit caustique en le faisant repasser par l'œsophage et la bouche. Le lait peut accélérer l'absorption de certains produits, et l'eau peut faire mousser un détergent. C'est pourquoi le seul bon réflexe est d'appeler, pour recevoir un conseil adapté au produit, à la quantité et à l'âge de l'enfant.

Les signes de gravité possibles : baisse de la conscience, confusion, comportement ou mouvements anormaux, difficulté à respirer, pupilles très petites ou très dilatées, douleurs au ventre, vomissements, diarrhée, brûlures ou irritation de la bouche, douleur pour avaler, salive abondante. L'absence de symptômes au début ne signifie pas que tout va bien.

## Au quotidien
**Si cela arrive**
- Restez calme et éloignez le produit.
- Préparez les informations : âge et poids de l'enfant, nom du produit, quantité estimée, heure, symptômes éventuels.
- Ne le laissez pas seul et ne le transportez pas de vous-même sans avis.
- En cas d'hospitalisation, emportez l'emballage.

**Pour prévenir**
- Médicaments en hauteur, dans une armoire fermée à clé, jamais dans un sac à main ni sur une table de nuit.
- Produits ménagers dans leur emballage d'origine, en hauteur ou sous clé.
- Dosettes de lessive liquide hors de vue et de portée.
- Piles bouton rangées, compartiments à piles des jouets vissés.
- Produits de beauté, cigarettes, liquides de vapotage, tabac hors de portée.
- Notez dès aujourd'hui le numéro de votre centre antipoison dans votre téléphone.

## Questions fréquentes
**Il a peut-être avalé un peu de produit, mais je ne suis pas sûr·e…**
Appelez quand même le centre antipoison : il vous dira quoi faire. Mieux vaut un appel pour rien qu'un retard.

**Il a bu un peu de mon verre d'alcool, est-ce grave ?**
L'alcool est toxique pour un jeune enfant, même en petite quantité. Appelez le centre antipoison ou le 15.

**Il a mis une pile bouton dans sa bouche et elle a disparu…**
C'est une urgence : appelez immédiatement le 15 ou le 112.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre enfant est inconscient, somnolent, convulse, respire mal, ou s'il a avalé une pile bouton. **Appelez le centre antipoison** pour toute autre ingestion, même sans symptôme. Les numéros d'urgence (15, 18, 112) sont gratuits, même sans crédit.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'securite',
    tags: ['intoxication', 'centre-antipoison', 'medicaments', 'produits-menagers', 'urgence'],
    safety_critical: true,
    sources: [S.ameliIntox, S.santeAccidents],
    status: 'to_review',
  },
  {
    slug: 'siege-auto-bebe',
    title: 'Le siège auto de bébé',
    summary: 'Siège adapté à la taille, dos à la route le plus longtemps possible, airbag désactivé à l’avant, harnais bien ajusté : les règles pour chaque trajet, même court.',
    body_md: `En voiture, un siège auto adapté et bien installé protège votre enfant en cas de choc. C'est vrai pour chaque trajet, même très court : une part importante des accidents graves d'enfants passagers surviennent près de chez soi.

## En bref
- Le siège auto est obligatoire jusqu'à 10 ans, ou jusqu'à ce que l'enfant soit assez grand pour la ceinture seule (environ 1,35 à 1,50 m).
- Les tout-petits voyagent dos à la route ; avec un siège i-Size (norme R129), c'est possible jusqu'à environ 15 mois.
- À l'avant, un siège dos à la route n'est possible que si l'airbag passager est désactivé.
- Le harnais doit être bien ajusté : retirez la doudoune ou la combinaison avant d'attacher l'enfant.
- Évitez les sièges d'occasion dont vous ne connaissez pas l'historique.

## Comprendre
La tête d'un bébé est lourde par rapport à son corps, et son cou est encore fragile. Dos à la route, le siège répartit la force d'un choc frontal sur tout le dos et protège la tête et la nuque. C'est pourquoi on garde cette position le plus longtemps possible.

La norme R129 (i-Size) est plus exigeante que l'ancienne norme R44 : elle impose notamment des tests de choc latéral et sélectionne le siège selon la taille de l'enfant. Les sièges très anciens ne doivent plus être utilisés.

Les grandes familles de sièges : la nacelle (bébé allongé, perpendiculaire à la route), la coque (semi-couchée, dos à la route), les sièges évolutifs, puis le rehausseur. La coque ne doit pas servir de transat en dehors de la voiture pour de longues périodes.

## Au quotidien
- **Lisez la notice** du siège et celle de la voiture.
- **Vérifiez la fixation** : Isofix bien enclenché, ou ceinture bien tendue, ni tordue ni lâche.
- **Ajustez le harnais** : une main doit à peine passer entre le harnais et l'enfant ; sangles sur les épaules et l'entrejambe.
- **Pas de vêtements épais** sous le harnais : mettez la couverture ou le manteau par-dessus une fois attaché.
- **Vérifiez le « clic »** de la boucle, bloquez les portes arrière.
- **Rangez les objets** posés sur la banquette, qui deviennent des projectiles en cas de choc.
- **Ne laissez jamais un enfant seul dans la voiture**, même quelques minutes, surtout par temps chaud.

## Questions fréquentes
**Puis-je installer la coque à l'avant ?**
Seulement si l'airbag passager est désactivé. L'arrière reste recommandé.

**Un siège d'occasion, est-ce une bonne idée ?**
C'est déconseillé : un siège qui a subi un choc peut être fragilisé sans que cela se voie.

**Sur un trajet de 5 minutes, est-ce vraiment nécessaire ?**
Oui : beaucoup d'accidents surviennent sur de courts trajets.

## Quand demander conseil
Demandez conseil au vendeur ou à des professionnels de la sécurité routière pour l'installation. Après un accident, même léger, faites examiner votre enfant s'il pleure de façon inhabituelle, vomit, semble somnolent ou si vous avez un doute ; en cas de signe inquiétant, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'securite',
    tags: ['siege-auto', 'voiture', 'securite-routiere', 'i-size', 'airbag'],
    sources: [S.mpediaSiege],
    status: 'to_review',
  },
  {
    slug: 'bebe-chaleur-et-soleil',
    title: 'Bébé, chaleur et soleil',
    summary: 'Les tout-petits se déshydratent vite : faire boire souvent, garder au frais, éviter le soleil aux heures chaudes et ne jamais laisser un enfant dans une voiture.',
    body_md: `Les nourrissons et les jeunes enfants supportent mal la chaleur : ils transpirent moins efficacement et peuvent se déshydrater rapidement. Leur peau est aussi très sensible au soleil. Quelques précautions suffisent à passer l'été sereinement.

## En bref
- Par forte chaleur, proposez à boire régulièrement (sein, biberon, eau selon l'âge), sans attendre qu'il le demande.
- Laissez bébé en couche ou en body léger, dans la pièce la plus fraîche.
- Sorties tôt le matin (avant 11 h) ou le soir (après 21 h) pendant les épisodes de canicule.
- Évitez au maximum l'exposition directe au soleil ; vêtements couvrants, chapeau à larges bords.
- Ne laissez jamais un enfant dans une voiture, même quelques minutes.

## Comprendre
La chaleur fait perdre beaucoup d'eau. Chez un bébé, cette perte peut entraîner une déshydratation, voire un coup de chaleur, en peu de temps. Les signes à surveiller : enfant qui boit moins, couches moins mouillées, somnolence ou agitation inhabituelle, fièvre, peau chaude et sèche.

Le soleil est aussi dangereux pour la peau et les yeux des enfants. Les coups de soleil de l'enfance augmentent le risque de cancer de la peau plus tard. Les meilleures protections sont l'ombre, les vêtements et le chapeau ; la crème solaire vient en complément pour les zones découvertes, chez l'enfant plus grand.

## Au quotidien
**Par forte chaleur**
- Faites boire régulièrement ; un bébé allaité peut téter plus souvent.
- Bains tièdes sous surveillance permanente, ou brumisation d'eau sur le visage et le corps.
- Pièce la plus fraîche du logement ; aérez seulement quand l'air extérieur est plus frais.
- Jamais seul près d'une fenêtre ouverte ou sur un balcon.
- Activités calmes ; emportez toujours de l'eau en voiture.

**Au soleil**
- Évitez le soleil entre 10 h et 16 h.
- Vêtements couvrants (manches longues, pantalon léger), de préférence anti-UV à la plage.
- Chapeau à larges bords plutôt qu'une casquette.
- Lunettes de soleil adaptées pour l'enfant plus grand (catégorie 3 ou 4, marquage CE).
- Pour les zones découvertes de l'enfant plus grand : crème solaire pédiatrique, indice élevé (50 ou 50+), renouvelée au moins toutes les 2 heures. Pour un bébé, demandez conseil au médecin ou au pharmacien.

## Questions fréquentes
**Faut-il donner de l'eau à un bébé allaité quand il fait très chaud ?**
Proposez d'abord le sein plus souvent. Demandez conseil à la sage-femme, à la PMI ou au médecin pour savoir s'il faut proposer de l'eau en plus selon son âge.

**La poussette avec une couverture dessus protège-t-elle du soleil ?**
Couvrir la poussette d'un tissu peut faire monter la température à l'intérieur. Privilégiez l'ombre et une ombrelle adaptée, et vérifiez souvent que bébé n'a pas trop chaud.

**Peut-on utiliser un ventilateur ?**
Il peut aider à rafraîchir la pièce s'il n'est pas dirigé directement sur l'enfant et reste hors de sa portée.

## Quand demander conseil
**Appelez le 15 ou le 112** si votre enfant est très somnolent, difficile à réveiller, a une fièvre élevée avec peau chaude et sèche, vomit, refuse de boire ou fait un malaise. **Consultez** s'il boit moins, mouille moins ses couches ou a un coup de soleil important.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'securite',
    tags: ['chaleur', 'canicule', 'soleil', 'deshydratation', 'ete'],
    sources: [S.santeChaleur, S.mpediaSoleil],
    status: 'to_review',
  },
  // ───────────────────────────── La mère après la naissance ─────────────────────────────
  {
    slug: 'baby-blues-depression-post-partum-reperer',
    title: 'Baby blues ou dépression du post-partum : savoir les repérer',
    summary: 'Le baby blues est passager ; la dépression du post-partum peut survenir dans l’année et se soigne : en parler tôt change tout, pour la mère, le co-parent et le bébé.',
    body_md: `Après la naissance, les émotions peuvent être intenses et contradictoires. Le baby blues, fréquent et passager, n'a rien à voir avec une dépression du post-partum, qui touche une femme sur six environ et nécessite un accompagnement. Le reconnaître, c'est se donner la possibilité d'aller mieux.

## En bref
- Le baby blues apparaît entre le 2e et le 5e jour (pic vers le 3e jour) et disparaît en deux semaines.
- La dépression du post-partum peut survenir dans l'année qui suit la naissance, surtout entre le 2e et le 6e mois ; elle toucherait environ 17 % des femmes deux mois après l'accouchement.
- Elle se soigne : psychothérapie, parfois traitement, accompagnement de la famille.
- Un entretien postnatal précoce, entre la 4e et la 8e semaine, sert notamment à repérer ces difficultés.
- Le co-parent peut aussi être touché.

## Comprendre
**Le baby blues** associe irritabilité, sautes d'humeur, pleurs, troubles du sommeil, fatigue, anxiété, impression d'être délaissée ou peur de ne pas savoir s'occuper du bébé. Il ne nécessite pas de traitement, mais il faut consulter s'il est très marqué ou s'il dure plus de deux semaines.

**La dépression du post-partum** peut se manifester par : sentiment de ne pas être une bonne mère, peur de faire du mal à son bébé, irritabilité ou rejet de l'enfant, anxiété intense ou crises de panique, tristesse, repli sur soi, épuisement, perte d'intérêt, troubles du sommeil ou de l'appétit, douleurs multiples, forte culpabilité. Elle peut survenir après un accouchement difficile, une séparation d'avec le bébé, dans des conditions de vie dures… ou sans raison identifiée. Ce n'est jamais une faute.

**La psychose puerpérale** est rare (1 à 2 cas pour 1 000 accouchements) : confusion, idées délirantes, grandes variations d'humeur, le plus souvent dans les 4 semaines après la naissance. C'est une urgence.

Plus de 10 % des pères présenteraient aussi des symptômes dépressifs dans les deux mois qui suivent la naissance.

## Au quotidien
- **Parlez de ce que vous ressentez** à votre partenaire, à un proche, à la sage-femme, au médecin.
- **Acceptez l'aide** pour les nuits, les repas, la maison.
- **Profitez des rendez-vous prévus** : entretien postnatal précoce (4e à 8e semaine), consultation postnatale (6e à 8e semaine), séances de suivi avec une sage-femme.
- **Le dispositif « Mon soutien psy »** permet des séances avec un psychologue prises en charge par l'Assurance Maladie.
- **Partenaire, proches** : soyez attentifs aux changements, proposez votre aide concrète et encouragez à consulter.

## Questions fréquentes
**Je n'éprouve pas l'amour « immédiat » que j'imaginais, suis-je une mauvaise mère ?**
Non. Le lien se construit souvent progressivement. Si cette impression s'accompagne de tristesse ou d'anxiété qui durent, parlez-en à un professionnel.

**Un traitement est-il compatible avec l'allaitement ?**
Le médecin en tient compte dans le choix du traitement. N'arrêtez rien et ne commencez rien sans avis.

**Qui peut m'aider si je suis seule ?**
La PMI, la sage-femme, le médecin traitant, les lieux d'accueil enfants-parents, l'association Maman Blues, le numéro Allô Parent Bébé (0 800 00 34 56) et le 3114.

## Quand demander conseil
Parlez-en sans attendre à votre sage-femme, à votre médecin ou à la PMI si le baby blues dure plus de deux semaines ou si vous reconnaissez des signes de dépression. **Appelez le 3114 (24 h/24) ou le 15** si vous avez des idées noires, des pensées de vous faire du mal ou de faire du mal à votre bébé, ou si vous remarquez chez une proche une confusion ou des propos étranges : c'est une urgence.

${END}`,
    journeys: ['newborn'],
    category: 'sante-mentale',
    tags: ['baby-blues', 'depression-post-partum', 'sante-mentale', 'post-partum', '3114', 'co-parent'],
    max_age_months: 12,
    safety_critical: true,
    sources: [S.ameliBabyBlues, S.santeSuiviApres],
    status: 'to_review',
  },
  {
    slug: 'suivi-medical-de-la-mere-apres-accouchement',
    title: 'Le suivi médical de la mère après l’accouchement',
    summary: 'Entretien postnatal précoce, consultation postnatale à 6-8 semaines, visites de sage-femme, rééducation si besoin : les rendez-vous pour vous, et les signes qui doivent faire consulter.',
    body_md: `Après la naissance, l'attention se porte souvent sur le bébé. Pourtant, votre corps et votre moral ont, eux aussi, besoin de soins et de suivi. Plusieurs rendez-vous sont prévus pour vous accompagner.

## En bref
- Un entretien postnatal précoce est prévu entre la 4e et la 8e semaine, avec un médecin, une sage-femme ou un gynécologue.
- La consultation postnatale a lieu entre la 6e et la 8e semaine : examen de contrôle, allaitement, contraception, rééducation si besoin.
- Des visites de sage-femme à domicile et des séances de suivi postnatal sont possibles.
- Fièvre, saignements anormaux ou pertes malodorantes doivent faire consulter rapidement.
- Tristesse, irritabilité, culpabilité qui durent : parlez-en.

## Comprendre
**L'entretien postnatal précoce** fait le point sur votre ressenti depuis la naissance, repère les premiers signes de dépression du post-partum et identifie vos besoins d'accompagnement. Un second entretien peut être proposé entre la 10e et la 14e semaine.

**La consultation postnatale** porte sur votre état de santé, l'allaitement, la relation avec le bébé, et comprend un examen clinique. C'est souvent à ce moment que la rééducation périnéale et abdominale est prescrite si nécessaire, et que la contraception est discutée.

**Les séances de suivi postnatal** avec une sage-femme, entre le 8e jour et la 14e semaine, permettent de faire le point sur votre récupération.

## Au quotidien
- **Notez vos rendez-vous** dans l'application ou votre agenda.
- **Préparez vos questions** : saignements, cicatrice, seins, transit, sommeil, moral, sexualité, contraception, reprise du sport.
- **Reposez-vous** et mangez régulièrement, même simplement.
- **Ne restez pas seule avec une douleur** ou une inquiétude : appelez la sage-femme ou le médecin.

## Questions fréquentes
**Combien de temps durent les saignements après l'accouchement ?**
Ils diminuent progressivement sur plusieurs semaines. Des saignements qui redeviennent abondants, avec des caillots importants ou une mauvaise odeur, doivent faire consulter.

**J'ai des fuites urinaires quand je tousse, est-ce que ça va passer ?**
Parlez-en lors de la consultation postnatale : la rééducation périnéale peut être prescrite. N'hésitez pas à aborder ce sujet, fréquent et pris en charge.

**Quand pourrai-je reprendre le sport ?**
La marche douce est possible rapidement ; les activités plus intenses se reprennent après la rééducation périnéale, en général 6 à 8 semaines après l'accouchement (voir l'article dédié).

## Quand demander conseil
**Consultez rapidement** en cas de fièvre, de saignements anormaux ou abondants, de pertes malodorantes, de douleur qui augmente (ventre, cicatrice, mollet), de sein rouge et douloureux, de maux de tête intenses ou de troubles de la vue. **Parlez-en** en cas de fuites urinaires, de gêne dans le bas du ventre, de tristesse, d'irritabilité ou de culpabilité. **Urgence : 15 ou 112** ; **détresse psychique : 3114**.

${END}`,
    journeys: ['newborn'],
    category: 'post-partum',
    tags: ['post-partum', 'consultation-postnatale', 'entretien-postnatal', 'suivi', 'mere'],
    max_age_months: 6,
    safety_critical: true,
    sources: [S.santeSuiviApres, S.ameliBabyBlues, S.ameliRetourMaison],
    status: 'to_review',
  },
  {
    slug: 'perinee-et-reprise-activite-apres-accouchement',
    title: 'Périnée et reprise du sport après l’accouchement',
    summary: 'Marche douce rapidement, rééducation périnéale si besoin, activités plus intenses vers 6 à 8 semaines, environ 2 mois après une césarienne : reprendre progressivement.',
    body_md: `La grossesse et l'accouchement sollicitent beaucoup le périnée et les abdominaux. Reprendre une activité physique fait du bien au corps et au moral, à condition de le faire progressivement et dans le bon ordre : d'abord le périnée, ensuite l'intensité.

## En bref
- La marche à faible ou moyenne intensité est possible très vite après un accouchement par voie basse.
- Les activités intenses ou avec port de charges se reprennent après la rééducation périnéale, en général 6 à 8 semaines après l'accouchement.
- Après une césarienne, il faut attendre la reconstitution de la paroi abdominale, environ 2 mois.
- Les séances de rééducation périnéale prescrites sont prises en charge à 100 % (dans la limite des tarifs de base).
- Fuites urinaires, sensation de pesanteur : parlez-en à la consultation postnatale.

## Comprendre
Le périnée est l'ensemble des muscles qui soutiennent la vessie, l'utérus et le rectum. Pendant la grossesse et l'accouchement, il est étiré et peut être fragilisé. Reprendre trop tôt des activités à impact (course, sauts) ou avec charges peut augmenter les fuites et la sensation de pesanteur.

La rééducation périnéale, prescrite si besoin lors de la consultation postnatale, aide à retrouver un périnée fonctionnel. Elle est réalisée par une sage-femme ou un kinésithérapeute. Après une épisiotomie, la reprise se fait sur avis du professionnel qui vous suit.

## Au quotidien
- **Marchez** dès que vous vous en sentez capable, à votre rythme.
- **Écoutez votre corps** : fatigue, douleurs, saignements qui augmentent sont des signaux pour ralentir.
- **Évitez de porter lourd** les premières semaines quand c'est possible ; faites-vous aider.
- **Profitez de la consultation postnatale** pour faire le point et obtenir une prescription de rééducation si besoin.
- **Reprenez ensuite progressivement**, en privilégiant d'abord des activités douces (natation, vélo d'appartement, renforcement doux) selon les conseils du professionnel.
- **Demandez des exercices adaptés** à votre situation au professionnel qui vous suit.

## Questions fréquentes
**Je n'ai aucune fuite, dois-je faire la rééducation ?**
C'est le professionnel qui l'évalue lors de la consultation postnatale. Parlez-en avec lui.

**Puis-je faire des abdominaux classiques tout de suite ?**
Demandez conseil au professionnel : certains exercices sont à éviter tant que le périnée et la paroi abdominale ne sont pas rééduqués.

**Et après une césarienne ?**
La paroi abdominale a besoin d'environ 2 mois pour se reconstituer. La marche douce reste possible selon votre confort et les conseils de l'équipe.

## Quand demander conseil
Consultez si vous avez des fuites urinaires, une sensation de pesanteur dans le bas du ventre, des douleurs pendant les rapports, des saignements qui reprennent, ou une douleur de cicatrice qui augmente. En cas de fièvre, de saignements abondants ou de douleur intense, consultez rapidement ; en cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'reeducation',
    tags: ['perinee', 'reeducation', 'sport', 'post-partum', 'cesarienne'],
    max_age_months: 12,
    sources: [S.santeActivite, S.santeSuiviApres],
    status: 'to_review',
  },
  {
    slug: 'contraception-apres-accouchement',
    title: 'La contraception après l’accouchement',
    summary: 'L’ovulation peut revenir avant les règles, dès 21 jours après l’accouchement : anticiper sa contraception, avec ou sans allaitement, évite une grossesse rapprochée non souhaitée.',
    body_md: `Après un accouchement, une nouvelle grossesse peut survenir plus vite qu'on ne le croit, parfois même avant le retour des règles. Penser à sa contraception tôt, idéalement dès la maternité, permet de choisir sereinement.

## En bref
- L'ovulation peut revenir avant les règles : une ovulation est possible à partir de 21 jours après l'accouchement.
- Les règles reviennent souvent dans les 6 à 8 semaines, mais ce délai varie beaucoup.
- Plusieurs méthodes sont possibles selon votre situation : préservatif, pilule microprogestative, implant, DIU.
- L'allaitement ne protège d'une grossesse que dans des conditions très strictes (méthode MAMA).
- Parlez-en pendant la grossesse ou à la maternité : certaines méthodes peuvent être prescrites dès la sortie.

## Comprendre
On ne peut pas prévoir la date du retour de l'ovulation. Une grossesse est donc possible avant même les premières règles. Avoir une contraception avant de reprendre une vie sexuelle évite une grossesse rapprochée non souhaitée. Prévoir sa contraception ne signifie pas devoir reprendre les rapports à une date précise : chacun va à son rythme.

**Les méthodes possibles**, selon les repères de QuestionSexualité :
- **préservatifs** (internes ou externes) : utilisables dans tous les cas ;
- **pilule microprogestative** : possible à partir de 3 semaines après l'accouchement, avec un professionnel de santé ;
- **implant** : pose possible dès l'accouchement, avec un professionnel de santé ;
- **DIU** (au cuivre ou hormonal) : pose possible environ 4 semaines après l'accouchement, plus tard après une césarienne ; une autre méthode est nécessaire en attendant.

L'implant et le DIU restent efficaces quel que soit le moment du sevrage. Le choix d'une méthode se fait avec un professionnel, qui tient compte de l'allaitement et de votre santé.

**La méthode MAMA** (allaitement et aménorrhée) n'est envisageable que si toutes ces conditions sont réunies : allaitement exclusif (aucune autre nourriture ni boisson), tétées à la demande jour et nuit sans intervalle de plus de 4 heures le jour et 6 heures la nuit, bébé de moins de 6 mois, et règles non revenues. Son efficacité pratique est inférieure à celle des autres méthodes.

## Au quotidien
- **Abordez le sujet** avec la sage-femme ou le médecin avant la sortie de maternité.
- **Faites le point** à la consultation postnatale.
- **Gardez des préservatifs** à disposition en attendant une méthode choisie.
- **Si vous utilisez la méthode MAMA**, changez de méthode dès le retour des règles, la réduction des tétées, l'introduction d'un biberon ou les 6 mois du bébé.

## Questions fréquentes
**J'allaite, puis-je prendre la pilule ?**
Certaines pilules sont compatibles avec l'allaitement : c'est au professionnel de santé de vous proposer la méthode adaptée.

**Je n'ai pas encore eu mes règles, puis-je être enceinte ?**
Oui, c'est possible, car l'ovulation précède les règles.

**Et en cas d'oubli ou de rapport non protégé ?**
La contraception d'urgence existe : voir l'article dédié, et demandez conseil rapidement à un pharmacien ou un professionnel de santé.

## Quand demander conseil
Parlez-en à votre sage-femme, votre médecin, votre gynécologue ou un centre de santé sexuelle. Consultez en cas de saignements inhabituels, de douleurs, ou si vous pensez être enceinte. En cas d'urgence, appelez le 15 ou le 112.

${END}`,
    journeys: ['newborn'],
    category: 'post-partum',
    tags: ['contraception', 'post-partum', 'allaitement', 'mama', 'implant', 'diu'],
    max_age_months: 12,
    sources: [S.qsContraPost, S.santeSuiviApres],
    status: 'to_review',
  },
  {
    slug: 'couple-et-famille-apres-la-naissance',
    title: 'Le couple et la famille après la naissance',
    summary: 'L’arrivée d’un bébé bouleverse l’équilibre du couple et de la famille : communiquer, se soutenir, partager, accompagner les aînés et demander de l’aide.',
    body_md: `Un bébé arrive, et avec lui une nouvelle organisation, de la fatigue, des émotions fortes. Le couple devient un couple de parents, les aînés deviennent grands frères ou grandes sœurs, les grands-parents trouvent leur place. Ces transformations prennent du temps, et c'est en avançant ensemble qu'on trouve un nouvel équilibre.

## En bref
- Les besoins des parents passent souvent au second plan : se soutenir et en parler aide chacun à trouver sa place.
- Exprimer ses besoins et écouter ceux de l'autre limite les malentendus.
- Après une période d'adaptation, l'énergie revient.
- Les aînés peuvent se sentir inquiets, jaloux ou rejetés, et régresser un temps : rassurez-les et faites-leur une place.
- Prenez du recul face aux nombreux conseils et faites confiance à votre ressenti.

## Comprendre
La fatigue, les nuits hachées, les nouvelles responsabilités mettent à l'épreuve le couple. Les tensions sont fréquentes dans les premiers mois. Ce n'est pas un échec : c'est une période de transition. Partager les tâches, prendre des décisions ensemble, se réserver de petits moments à deux aident à traverser cette étape.

La sexualité reprend à un rythme propre à chaque couple, en tenant compte de la récupération physique, de la fatigue et du désir de chacun. Il n'y a pas de « bon moment » imposé.

Pour les aînés, l'arrivée d'un bébé est un grand changement. Les préparer, les rassurer sur l'amour qu'on leur porte, leur réserver des moments rien qu'à eux et les impliquer selon leur âge les aident.

Les grands-parents vivent aussi une transformation : leur soutien est précieux, à condition que chacun respecte la place des parents.

## Au quotidien
- **Parlez-vous** : de la fatigue, de ce qui pèse, de ce qui vous ferait du bien.
- **Répartissez les tâches** (nuits, repas, linge, rendez-vous) et ajustez régulièrement.
- **Gardez de petits moments à deux**, même courts.
- **Pour les aînés** : un moment privilégié chaque jour, des mots rassurants, une petite mission auprès du bébé s'ils le souhaitent.
- **Acceptez l'aide** de l'entourage, et dites ce dont vous avez besoin.
- **Utilisez l'application** pour partager l'organisation (tâches, relais de nuit).

## Questions fréquentes
**Nous nous disputons beaucoup depuis la naissance, est-ce grave ?**
Les tensions sont fréquentes dans cette période. Si elles deviennent permanentes ou pesantes, un conseiller conjugal, un psychologue ou la PMI peuvent vous accompagner.

**L'aîné fait à nouveau pipi au lit, que faire ?**
Une régression passagère peut accompagner l'arrivée d'un bébé. Rassurez-le, évitez les reproches et parlez-en au médecin si cela dure.

**Mon partenaire ne trouve pas sa place, comment l'aider ?**
Partager les soins du bébé (bain, change, portage, biberon si c'est le cas) permet à chacun de créer son lien.

## Quand demander conseil
Parlez-en à un professionnel (médecin, sage-femme, PMI, psychologue, conseiller conjugal) si la tristesse, l'irritabilité ou les conflits s'installent. En cas de violences dans le couple, appelez le 3919 ; en cas de danger immédiat, le 17 ou le 112. Pour un enfant en danger, le 119. En cas de détresse psychique, le 3114.

${END}`,
    journeys: ['newborn'],
    category: 'post-partum',
    tags: ['couple', 'famille', 'aines', 'fratrie', 'organisation'],
    max_age_months: 24,
    sources: [S.santeFamille, S.ameliBabyBlues],
    status: 'to_review',
  },
  // ───────────────────────────── Droits, démarches et garde ─────────────────────────────
  {
    slug: 'declaration-de-naissance-demarches',
    title: 'La déclaration de naissance et les premières démarches',
    summary: 'La naissance se déclare en mairie dans les 5 jours, souvent depuis la maternité : qui déclare, quels documents, nom de l’enfant, reconnaissance et livret de famille.',
    body_md: `Dans les jours qui suivent la naissance, une démarche est obligatoire : la déclaration de naissance. Elle permet d'établir l'acte de naissance de votre enfant. Bonne nouvelle : elle peut souvent se faire directement depuis la maternité.

## En bref
- La déclaration se fait dans les 5 jours qui suivent l'accouchement (le jour de la naissance ne compte pas).
- Elle se fait à la mairie du lieu de naissance ; beaucoup de maternités ont un service qui s'en charge.
- Elle peut être faite par le père, la seconde mère (couple de femmes), un professionnel ou toute personne ayant assisté à l'accouchement.
- Documents : pièces d'identité, certificat d'accouchement, déclaration de choix de nom le cas échéant, acte de reconnaissance s'il existe, livret de famille s'il existe.
- Un retard entraîne une procédure au tribunal : ne laissez pas passer le délai.

## Comprendre
**Le délai** : 5 jours après l'accouchement, sans compter le jour de la naissance. Si le dernier jour tombe un week-end ou un jour férié, il est reporté au jour ouvrable suivant.

**Le nom de famille** : si les parents souhaitent choisir le nom de l'enfant (nom de l'un, de l'autre, ou les deux accolés), ils remettent une déclaration conjointe de choix de nom.

**Les parents non mariés** : la filiation avec la mère est établie par l'acte de naissance. Le père doit reconnaître l'enfant s'il ne l'a pas fait avant la naissance ; il fournit alors un justificatif de domicile de moins de 3 mois. Les couples de femmes peuvent faire une reconnaissance conjointe anticipée.

**Le livret de famille** : s'il existe, l'enfant y est inscrit lors de la déclaration ; à la naissance d'un premier enfant, il est délivré aux parents.

**En cas de retard**, l'officier d'état civil ne peut pas régulariser seul : il faut un jugement déclaratif de naissance, et le déclarant s'expose à des sanctions.

## Au quotidien
- **Préparez les documents** avant l'accouchement dans un dossier.
- **Renseignez-vous auprès de la maternité** sur le service qui enregistre les déclarations.
- **Pensez aux démarches suivantes** : déclaration à la Caf et à l'Assurance Maladie (rattachement de l'enfant), choix d'un médecin traitant, mutuelle, employeur(s).
- **Demandez plusieurs copies** de l'acte de naissance si besoin (elles sont gratuites).

## Questions fréquentes
**Qui peut déclarer si la mère est seule ?**
Lorsque la mère accouche seule à l'hôpital, l'obligation revient à l'établissement. Un proche muni du certificat d'accouchement peut aussi déclarer.

**Peut-on choisir le nom après la déclaration ?**
Le choix de nom se fait lors de la déclaration, par une déclaration conjointe. Renseignez-vous en amont auprès de la mairie ou sur Service-Public.fr.

**La reconnaissance avant la naissance est-elle utile ?**
Pour les parents non mariés, elle permet d'établir la filiation dès la naissance et de simplifier les démarches.

## Quand demander conseil
Pour toute question, la mairie, le service de la maternité, ou Service-Public.fr peuvent vous renseigner. En cas de situation particulière (naissance à l'étranger, enfant né sans vie, difficulté de filiation), demandez conseil à la mairie ou à un juriste.

${END}`,
    journeys: ['newborn', 'pregnant'],
    category: 'droits-demarches',
    tags: ['declaration-de-naissance', 'mairie', 'nom', 'reconnaissance', 'livret-de-famille', 'demarches'],
    max_age_months: 1,
    sources: [S.spDeclaration, S.ameliRetourMaison],
    status: 'to_review',
  },
  {
    slug: 'conge-de-paternite-et-d-accueil',
    title: 'Le congé de paternité et d’accueil de l’enfant',
    summary: '3 jours de congé de naissance puis 25 jours de congé de paternité (32 pour des naissances multiples), dont 4 obligatoires : qui y a droit, comment le prendre et être indemnisé.',
    body_md: `L'arrivée d'un enfant concerne les deux parents. Le second parent — père, conjoint, partenaire de Pacs ou personne vivant en couple avec la mère — a droit à des congés pour être présent pendant ces premières semaines. Voici comment ils fonctionnent pour un salarié du secteur privé.

## En bref
- Le congé de naissance de 3 jours ouvrables est pris en premier, le jour de la naissance ou le premier jour ouvrable suivant.
- Le congé de paternité et d'accueil de l'enfant dure 25 jours calendaires (32 en cas de naissances multiples).
- 4 jours sont obligatoires, juste après le congé de naissance ; les 21 jours restants (28 en cas de naissances multiples) se prennent dans les 6 mois, en une ou deux fois (au moins 5 jours chacune).
- Prévenez votre employeur au moins 1 mois avant la date prévue de la naissance.
- Aucune condition d'ancienneté ; des indemnités journalières peuvent être versées par la CPAM sous conditions.

## Comprendre
**Qui en bénéficie ?** Le père de l'enfant, ou le conjoint, partenaire ou concubin de la mère. En cas de reconnaissance conjointe anticipée, la mère qui n'a pas accouché (couples de femmes). Le congé est ouvert quel que soit le contrat de travail.

**Le déroulement** : 3 jours de congé de naissance, puis 4 jours obligatoires de congé de paternité, puis 21 jours (ou 28) à prendre dans les 6 mois, d'un seul tenant ou en deux périodes d'au moins 5 jours. Des reports sont possibles en cas d'hospitalisation de l'enfant ou de décès de la mère.

**Prévenir l'employeur** : au moins 1 mois avant la date prévue de la naissance, en indiquant les dates. Si ce délai est respecté, l'employeur ne peut pas refuser. Si l'enfant naît plus tôt que prévu, le congé peut être pris dans le mois suivant, en informant l'employeur. Une lettre recommandée ou remise en main propre contre décharge est conseillée.

**Indemnisation** : la CPAM peut verser des indemnités journalières, sous conditions d'affiliation et d'activité. Votre convention collective peut prévoir un maintien de salaire plus favorable. Le congé suspend le contrat ; il compte pour l'ancienneté, et vous retrouvez ensuite votre poste ou un poste similaire.

## Au quotidien
- **Anticipez** avec votre employeur dès que la date du terme est connue.
- **Organisez la période facultative** selon vos besoins : juste après la naissance, ou plus tard pour un relais (reprise du travail de la mère, par exemple).
- **Déclarez le congé** selon la procédure de votre CPAM et de votre employeur.
- **Profitez de ce temps** pour prendre votre place auprès du bébé : soins, nuits, rendez-vous.

## Questions fréquentes
**Je suis indépendant, ai-je droit à un congé ?**
Oui, avec des règles particulières : renseignez-vous auprès de votre caisse.

**Puis-je fractionner tout le congé ?**
Seule la période facultative peut être fractionnée en deux périodes d'au moins 5 jours. Les 3 jours de naissance et les 4 jours obligatoires se prennent d'affilée.

**Existe-t-il d'autres congés ensuite ?**
Un congé supplémentaire de naissance peut suivre selon la réglementation en vigueur, et le congé parental d'éducation reste possible (voir l'article dédié). Vérifiez votre situation sur Service-Public.fr.

## Quand demander conseil
Pour votre situation précise, consultez Service-Public.fr, votre CPAM, les représentants du personnel ou les ressources humaines. Si le congé vous est refusé alors que le délai a été respecté, le conseil de prud'hommes peut être saisi.

${END}`,
    journeys: ['newborn', 'pregnant'],
    category: 'droits-demarches',
    tags: ['conge-paternite', 'conge-naissance', 'second-parent', 'droits', 'employeur'],
    max_age_months: 6,
    sources: [S.spPaternite, S.spNaissance],
    status: 'to_review',
  },
  {
    slug: 'conge-parental-et-prepare',
    title: 'Le congé parental d’éducation et la PreParE',
    summary: 'Arrêter ou réduire son activité pour s’occuper de son enfant : conditions, durée jusqu’aux 3 ans, démarches auprès de l’employeur et aide de la Caf.',
    body_md: `Après le congé maternité ou paternité, certains parents souhaitent arrêter ou réduire leur activité pour s'occuper de leur enfant. Le congé parental d'éducation le permet, avec la possibilité d'une aide financière de la Caf, la PreParE. Voici l'essentiel pour un salarié du secteur privé.

## En bref
- Il faut au moins 1 an d'ancienneté dans l'entreprise.
- Le congé dure 1 an au maximum, renouvelable 2 fois pour 1 ou 2 enfants nés en même temps ; il prend fin au plus tard au 3e anniversaire de l'enfant.
- Demande à l'employeur au moins 2 mois avant (1 mois avant la fin du congé maternité s'il le suit), par lettre recommandée ou remise en main propre contre décharge.
- L'employeur ne peut pas refuser.
- Le congé n'est pas rémunéré par l'employeur, mais la PreParE (Caf ou MSA) peut être versée sous conditions.

## Comprendre
**Durée et renouvellement** : pour une naissance, la durée initiale est d'un an au maximum, renouvelable deux fois (pour 1 ou 2 enfants nés simultanément) ou cinq fois (pour 3 enfants ou plus). Le congé se termine au 3e anniversaire de l'enfant, à l'entrée en maternelle pour des jumeaux, ou au 6e anniversaire pour 3 enfants ou plus. Une prolongation d'un an est possible en cas de maladie, d'accident ou de handicap grave de l'enfant.

**Temps plein ou temps partiel** : le congé peut être pris à temps plein ou sous forme de temps partiel. Le passage de l'un à l'autre ou la prolongation se demandent au moins 1 mois avant la fin de la période en cours.

**La rémunération** : pendant le congé, l'employeur ne verse pas de salaire pour le temps non travaillé, sauf disposition conventionnelle. La Caf ou la MSA peut verser la PreParE (prestation partagée d'éducation de l'enfant), sous conditions, ainsi que l'allocation de base sous conditions de ressources.

**Le retour** : vous retrouvez votre poste ou un poste similaire, avec une rémunération au moins équivalente, et pouvez bénéficier d'un entretien professionnel. La moitié de la durée du congé compte pour l'ancienneté.

## Au quotidien
- **Simulez vos droits** sur caf.fr avant de décider.
- **Discutez à deux** de l'organisation : la PreParE peut être partagée entre les parents selon les règles en vigueur.
- **Envoyez votre demande** dans les délais, en précisant date de début et durée.
- **Anticipez le retour** : mode de garde, entretien professionnel.

## Questions fréquentes
**Mon employeur peut-il refuser ?**
Non, s'il est demandé dans les conditions prévues. En cas de refus, le conseil de prud'hommes peut être saisi.

**Puis-je reprendre plus tôt ?**
Oui, en prévenant par lettre recommandée au moins 1 mois avant. L'accord de l'employeur n'est pas nécessaire en cas de décès de l'enfant ou de baisse importante des ressources du foyer.

**Le congé parental a-t-il changé récemment ?**
Des réformes sont discutées ou mises en place (par exemple un congé de naissance) : vérifiez toujours la fiche à jour sur Service-Public.fr et caf.fr avant de décider.

## Quand demander conseil
Pour votre situation précise : Service-Public.fr, votre Caf ou MSA, les ressources humaines ou les représentants du personnel. Pour les difficultés financières, le service social de votre mairie ou de votre Caf peut vous accompagner.

${END}`,
    journeys: ['newborn', 'child'],
    category: 'droits-demarches',
    tags: ['conge-parental', 'prepare', 'caf', 'droits', 'employeur'],
    max_age_months: 36,
    sources: [S.spCongeParental],
    status: 'to_review',
  },
  {
    slug: 'modes-de-garde-et-aides',
    title: 'Choisir un mode de garde et connaître les aides',
    summary: 'Crèche, micro-crèche, assistante maternelle, garde à domicile : les options pour un enfant de moins de 3 ans, où chercher, et les aides comme le CMG ou le crédit d’impôt.',
    body_md: `Trouver un mode de garde est souvent une préoccupation dès la grossesse. Les options sont variées, les places parfois rares selon les territoires, et des aides existent pour réduire le coût. Voici un panorama pour vous aider à y voir clair.

## En bref
- Les principaux modes de garde : crèche (collective, familiale, parentale), micro-crèche, assistante maternelle agréée, garde à domicile, garde partagée.
- Le site monenfant.fr (Cnaf) recense les modes d'accueil et certaines places disponibles près de chez vous.
- Le complément de libre choix du mode de garde (CMG), versé par la Caf ou la MSA, couvre une partie des frais d'une assistante maternelle ou d'une garde à domicile.
- Un crédit d'impôt et des aides de l'employeur (comme le CESU préfinancé) peuvent s'ajouter, sous conditions.
- Les vaccinations obligatoires sont exigées pour l'entrée en collectivité.

## Comprendre
**L'accueil collectif** (crèches, micro-crèches) offre un cadre avec une équipe de professionnels de la petite enfance et la vie en groupe. **L'accueil individuel** (assistante maternelle agréée, à son domicile ou dans une maison d'assistants maternels ; garde à domicile) offre souvent plus de souplesse horaire.

**Le CMG « emploi direct »** concerne les parents qui emploient directement une assistante maternelle ou une garde à domicile. Il est versé en général jusqu'aux 6 ans de l'enfant (jusqu'à 12 ans pour un parent isolé, selon les règles en vigueur), sous conditions d'activité. Son montant dépend des ressources du foyer, du nombre d'enfants, du coût horaire et du nombre d'heures. Les cotisations sociales sont prises en charge à 100 % pour une assistante maternelle agréée et à 50 % pour une garde à domicile, dans la limite d'un plafond. Les salaires se déclarent chaque mois via Pajemploi. Depuis le 1er décembre 2025, en cas de garde alternée, le CMG peut être versé à chacun des deux parents.

## Au quotidien
- **Commencez tôt vos recherches**, parfois dès la grossesse.
- **Consultez monenfant.fr** et le relais petite enfance ou la mairie de votre commune.
- **Visitez, posez vos questions** : horaires, adaptation, repas, sorties, maladies, projet pédagogique.
- **Simulez vos aides** sur caf.fr avant de choisir.
- **Prévoyez une période d'adaptation** progressive avant la reprise du travail.
- **Préparez le carnet de santé** et le certificat de vaccinations.

## Questions fréquentes
**Je n'ai pas de place en crèche, que faire ?**
Élargissez la recherche (micro-crèches, assistantes maternelles, garde partagée) et rapprochez-vous du relais petite enfance de votre secteur.

**Je suis sans emploi et parent isolé, existe-t-il une aide ?**
Une aide à la garde d'enfant spécifique existe pour le parent isolé sans emploi : renseignez-vous sur Service-Public.fr et auprès de votre Caf.

**Comment se passe l'adaptation ?**
Elle est progressive, sur quelques jours à quelques semaines, pour que l'enfant découvre le lieu et les personnes en douceur. Si vous allaitez, anticipez l'organisation (voir l'article sur l'allaitement et la reprise du travail).

## Quand demander conseil
Pour les aides : caf.fr, votre Caf ou MSA, Pajemploi, Service-Public.fr. En cas de difficultés financières : le service d'action sociale de la mairie ou un Point Info Famille. Si quelque chose vous inquiète dans l'accueil de votre enfant, parlez-en d'abord avec la structure ou l'assistante maternelle, puis avec la PMI, qui délivre les agréments ; en cas de danger pour un enfant, appelez le 119.

${END}`,
    journeys: ['newborn', 'child', 'pregnant'],
    category: 'ecole-garde',
    tags: ['mode-de-garde', 'creche', 'assistante-maternelle', 'cmg', 'caf', 'aides'],
    max_age_months: 72,
    sources: [S.spGarde, S.spCMG],
    status: 'to_review',
  },
];
