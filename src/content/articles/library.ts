/** Bibliothèque d'articles par parcours : brouillons rédigés par une IA à partir de sources consultées, statut « À vérifier ». */
export type ArticleJourney = 'ttc' | 'avoid' | 'pregnant' | 'newborn' | 'child' | 'parents_sleep';
export interface ArticleSource { label: string; url: string; consulted_on: string; published?: string }
export interface LibArticle {
  slug: string;              // kebab-case, unique, ascii
  title: string;
  summary: string;           // one sentence
  body_md: string;
  journeys: ArticleJourney[];
  category: 'grossesse' | 'accouchement' | 'post-partum' | 'sante-mentale' | 'bebe' | 'alimentation' | 'enfant' | 'cycle' | 'reeducation' | 'sexualite' | 'sommeil' | 'neurodeveloppement';
  tags: string[];
  min_week?: number; max_week?: number;              // pregnancy weeks (SA) if relevant
  min_age_months?: number; max_age_months?: number;  // child age if relevant
  safety_critical?: boolean;  // true for content about warning signs / emergencies
  sources: ArticleSource[];   // at least 1, ideally 2
  status: 'to_review';
}

const C = '2026-10-20';

/** Pages réellement consultées le 2026-10-20. `published` = date de publication ou de mise à jour affichée par la page. */
const S = {
  // Projet bébé
  santeConditions: { label: 'Santé.fr — Les conditions physiologiques de la procréation naturelle', url: 'https://www.sante.fr/ma-fertilite/les-conditions-physiologiques-de-la-procreation-naturelle', consulted_on: C, published: '2023-10-11' },
  santeB9: { label: 'Santé.fr — La vitamine B9, le bon réflexe pour bien préparer sa grossesse', url: 'https://www.sante.fr/ma-fertilite/la-vitamine-b9-le-bon-reflexe-pour-bien-preparer-sa-grossesse', consulted_on: C, published: '2025-05-22' },
  santeInfertilite: { label: 'Santé.fr — Difficultés à concevoir : qu’est-ce que l’infertilité ?', url: 'https://www.sante.fr/ma-fertilite/difficultes-concevoir-quest-ce-que-linfertilite', consulted_on: C, published: '2025-07-02' },
  santeModeVie: { label: 'Santé.fr — Impact du mode de vie : ce qu’il faut savoir pour préserver sa fertilité', url: 'https://www.sante.fr/ma-fertilite/impact-du-mode-de-vie-ce-quil-faut-savoir-pour-preserver-sa-fertilite', consulted_on: C, published: '2026-01-19' },
  santeAge: { label: 'Santé.fr — Fertilité et âge', url: 'https://www.sante.fr/ma-fertilite/fertilite-et-age-ce-quil-faut-savoir-pour-mieux-preparer-son-projet-denfant-0', consulted_on: C, published: '2026-01-19' },
  ameliHabitudes: { label: 'ameli.fr — Modifier ses habitudes de vie avant d’être enceinte', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/modifier-ses-habitudes-de-vie-avant-d-etre-enceinte', consulted_on: C, published: '2025-03-27' },
  ameliPreconception: { label: 'ameli.fr — La consultation préconceptionnelle', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/consultation-et-mode-de-vie-en-vue-d-une-grossesse/avant-d-etre-enceinte-la-consultation-preconceptionnelle', consulted_on: C, published: '2025-05-26' },
  ameliSterilite: { label: 'ameli.fr — Comprendre l’infertilité : définition et causes', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/sterilite-pma-infertilite/comprendre-sterilite', consulted_on: C, published: '2026-01-12' },
  ameliBilan: { label: 'ameli.fr — Bilan médical de l’infertilité', url: 'https://www.ameli.fr/assure/sante/devenir-parent/concevoir-un-enfant/sterilite-pma-infertilite/bilan-medical-infertilite-sterilite', consulted_on: C, published: '2025-12-08' },
  santeTests: { label: 'Santé.fr — Les tests de grossesse', url: 'https://www.sante.fr/les-tests-de-grossesse', consulted_on: C, published: '2022-07-27' },
  ansmAutotests: { label: 'ANSM — Recommandations pour le bon usage des autotests', url: 'https://ansm.sante.fr/actualites/impression/411', consulted_on: C, published: '2021-01-08' },
  ameliPremiersSignes: { label: 'ameli.fr — Grossesse : premiers signes et déroulement', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/premiers-symptomes-grossesse', consulted_on: C, published: '2026-06-02' },
  // Contraception
  ameliNaturelles: { label: 'ameli.fr — Les méthodes naturelles de contraception', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-naturelles-contraception', consulted_on: C, published: '2025-10-01' },
  qsNaturelles: { label: 'QuestionSexualité (Santé publique France) — Qu’est-ce que la contraception naturelle ?', url: 'https://www.questionsexualite.fr/choisir-sa-contraception/tous-les-modes-de-contraception/que-sont-les-methodes-naturelles', consulted_on: C },
  ameliEfficacite: { label: 'ameli.fr — L’efficacité des moyens contraceptifs', url: 'https://www.ameli.fr/assure/sante/themes/contraception/efficacite-moyens-contraceptifs', consulted_on: C, published: '2024-11-15' },
  ameliHormonale: { label: 'ameli.fr — Contraception hormonale : pilule, patch, anneau, implant, injection', url: 'https://www.ameli.fr/assure/sante/themes/contraception/methodes-contraception-hormonale', consulted_on: C, published: '2026-09-10' },
  ameliCu: { label: 'ameli.fr — Quelles méthodes de contraception d’urgence ?', url: 'https://www.ameli.fr/assure/sante/themes/contraception-urgence/comprendre-contraception-urgence', consulted_on: C, published: '2025-12-15' },
  ameliCuReflexes: { label: 'ameli.fr — Les bons réflexes après une contraception d’urgence', url: 'https://www.ameli.fr/assure/sante/themes/contraception-urgence/bons-reflexes-contraception-urgence', consulted_on: C, published: '2025-12-16' },
  santeRapportRisque: { label: 'Santé.fr — J’ai eu un rapport sexuel non protégé, que faire ?', url: 'https://www.sante.fr/suite-un-rapport-sexuel-risque-de-grossesse', consulted_on: C, published: '2026-01-28' },
  // Grossesse
  ameliProgramme: { label: 'ameli.fr — Grossesse : le programme de suivi et la première consultation', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/grossesse-soins-dentaires-dentiste-consultation', consulted_on: C, published: '2026-07-14' },
  ameliMensuel: { label: 'ameli.fr — Suivi mensuel de la grossesse à partir du 4e mois', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/consultation-suivi-mensuel', consulted_on: C, published: '2026-06-02' },
  ameliNausees: { label: 'ameli.fr — Je suis enceinte, j’ai des nausées et je vomis : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/grossesse-nausees-et-vomissements/nausees-vomissements-que-faire', consulted_on: C, published: '2026-06-22' },
  ameliNauseesConsult: { label: 'ameli.fr — Nausées et vomissements chez la femme enceinte : consultation et traitement', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-nausees-et-vomissements/nauses-vomissements-grossesse-consultation-traitement', consulted_on: C, published: '2026-06-22' },
  ameliActive: { label: 'ameli.fr — Enceinte et active : quelles précautions ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse-activite-physique/enceinte-active-precautions', consulted_on: C, published: '2026-08-27' },
  mbGrossesse: { label: 'Manger Bouger — Peut-on faire de l’activité physique et du sport pendant la grossesse ?', url: 'https://www.mangerbouger.fr/bouger-plus/a-tout-age-et-a-chaque-etape-de-la-vie/les-recommandations-specifiques-avant-pendant-et-apres-la-grossesse/peut-on-faire-de-l-activite-physique-et-du-sport-pendant-la-grossesse', consulted_on: C, published: '2026-10-12' },
  ameliSaign1: { label: 'ameli.fr — Saignements gynécologiques du premier trimestre de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/saignements-gynecologiques-grossesse/saignements-gynecologiques-du-premier-trimestre-de-la-grossesse', consulted_on: C, published: '2026-06-24' },
  ameliSaign23: { label: 'ameli.fr — Saignements gynécologiques lors du 2e et du 3e trimestre de la grossesse', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/saignements-gynecologiques-grossesse/saignements-lors-du-deuxieme-et-du-troisieme-trimestre-de-la-grossesse', consulted_on: C, published: '2026-06-24' },
  ameliPreeclampsie: { label: 'ameli.fr — Pré-éclampsie : symptômes, diagnostic et évolution', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/preeclampsie/diagnostic-evolution', consulted_on: C, published: '2025-07-24' },
  sante8eMois: { label: 'Santé.fr — Grossesse : la consultation du 8e mois', url: 'https://www.sante.fr/grossesse-la-consultation-de-8eme-mois', consulted_on: C, published: '2018-01-11' },
  ameliPsy: { label: 'ameli.fr — Grossesse : bouleversement émotionnel, anxiété et dépression', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-sante-psychique/troubles-psychiques-grossesse', consulted_on: C, published: '2026-06-23' },
  ameliAidePsy: { label: 'ameli.fr — Anxiété, baby-blues, dépression : comment être aidée pendant et après sa grossesse ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/difficultes-et-maladies-pendant-la-grossesse/grossesse-sante-psychique/anxiete-baby-blues-depression-etre-aidee-pendant-et-apres-sa-grossesse', consulted_on: C, published: '2026-06-23' },
  nhsFatigueGrossesse: { label: 'NHS (Royaume-Uni) — Tiredness and sleep problems in pregnancy', url: 'https://www.nhs.uk/pregnancy/common-symptoms/tiredness/', consulted_on: C, published: '2024-03-11' },
  ameliPreparation: { label: 'ameli.fr — Se préparer à l’arrivée de bébé (préparation à la naissance et à la parentalité)', url: 'https://www.ameli.fr/assure/sante/devenir-parent/grossesse/grossesse-en-bonne-sante/grossesse/preparation-parentalite', consulted_on: C, published: '2026-06-02' },
  santeCouple: { label: 'Santé.fr (Santé publique France — 1000 premiers jours) — Le couple pendant la grossesse', url: 'https://www.sante.fr/le-couple-pendant-la-grossesse', consulted_on: C, published: '2025-10-20' },
  tommysSexe: { label: 'Tommy’s (association britannique, contenu relu cliniquement) — Sex in pregnancy', url: 'https://www.tommys.org/pregnancy-information/im-pregnant/sex-pregnancy', consulted_on: C, published: '2026-01-29' },
  nhsInformSexe: { label: 'NHS inform / Ready Steady Baby (Écosse) — Sex and sexual health in pregnancy', url: 'https://www.nhsinform.scot/ready-steady-baby/pregnancy/relationships-and-wellbeing-in-pregnancy/sex-and-sexual-health-in-pregnancy/', consulted_on: C, published: '2023-12-15' },
  // Bébé
  ameliCoucher: { label: 'ameli.fr — Comment bien coucher un bébé ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/coucher-bebe', consulted_on: C, published: '2024-10-10' },
  mpediaCoucher: { label: 'mpedia.fr (AFPA) — Coucher mon bébé', url: 'https://www.mpedia.fr/art-coucher-mon-bebe/', consulted_on: C, published: '2023-07-17' },
  ameliSecoue: { label: 'ameli.fr — Syndrome du bébé secoué', url: 'https://www.ameli.fr/assure/sante/urgence/bebe-enfant/syndrome-bebe-secoue', consulted_on: C, published: '2026-06-17' },
  mpediaPleurs: { label: 'mpedia.fr (AFPA) — Calmer et apaiser les pleurs du nourrisson', url: 'https://www.mpedia.fr/art-pleurs-de-mon-bebe/', consulted_on: C, published: '2021-10-26' },
  santePleurs: { label: 'Santé.fr — Pleurs de mon enfant, les comprendre et les calmer', url: 'https://www.sante.fr/pleurs-de-mon-enfant-les-comprendre-et-les-calmer', consulted_on: C, published: '2026-08-31' },
  santePremiereTetee: { label: 'Santé.fr — La première tétée', url: 'https://www.sante.fr/la-premiere-tetee', consulted_on: C, published: '2025-06-16' },
  santeRythmeTetees: { label: 'Santé.fr — Rythme des tétées', url: 'https://www.sante.fr/rythme-des-tetees', consulted_on: C, published: '2025-12-11' },
  ameliBiberon: { label: 'ameli.fr — Bien préparer un biberon', url: 'https://www.ameli.fr/assure/sante/themes/alimentation/alimentation-0-3-ans/preparer-biberon', consulted_on: C, published: '2024-11-12' },
  ansesBiberon: { label: 'Anses — Biberon : comment le préparer et le conserver ?', url: 'https://www.anses.fr/fr/content/biberon-comment-le-preparer-et-le-conserver', consulted_on: C, published: '2013-01-17' },
  ameliFievre: { label: 'ameli.fr — Votre enfant a de la fièvre : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/fievre-enfant/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2024-09-03' },
  mpediaFievre: { label: 'mpedia.fr (AFPA) — Fièvre bébé et enfant : que faire et quand consulter ?', url: 'https://www.mpedia.fr/art-fievre-enfant/', consulted_on: C, published: '2023-09-19' },
  santeSuiviPost: { label: 'Santé.fr — Le suivi médical après l’accouchement', url: 'https://www.sante.fr/le-suivi-medical-apres-laccouchement', consulted_on: C, published: '2024-08-09' },
  ameliRetourMaison: { label: 'ameli.fr — Après l’accouchement : le retour à la maison', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/suivi-domicile', consulted_on: C, published: '2026-08-27' },
  santeVeilleSommeil: { label: 'Santé.fr — Rythme veille-sommeil, quand va-t-il « faire ses nuits » ?', url: 'https://www.sante.fr/rythme-veille-sommeil-quand-va-t-il-faire-ses-nuits', consulted_on: C, published: '2026-08-31' },
  santeSommeilNormal: { label: 'Santé.fr — Sommeil normal du bébé : de la naissance à 3 ans', url: 'https://www.sante.fr/sommeil-normal-du-bebe-de-la-naissance-3-ans', consulted_on: C, published: '2019-07-01' },
  mpediaPeau: { label: 'mpedia.fr (AFPA) — Le peau à peau', url: 'https://www.mpedia.fr/art-peau-contre-peau/', consulted_on: C, published: '2019-10-24' },
  mpediaEcharpe: { label: 'mpedia.fr (AFPA) — Porter bébé avec une écharpe de portage', url: 'https://www.mpedia.fr/art-echarpe-portage/', consulted_on: C, published: '2021-11-05' },
  // Enfant
  ameliSommeilEnfant: { label: 'ameli.fr — Sommeil de l’enfant : ses étapes, sa durée et ses troubles', url: 'https://www.ameli.fr/assure/sante/themes/troubles-sommeil-enfant/sommeil-enfant-importance-troubles-etapes', consulted_on: C, published: '2026-03-12' },
  mpediaTroublesSommeil: { label: 'mpedia.fr (AFPA) — Endormissement difficile, réveils et troubles du sommeil', url: 'https://www.mpedia.fr/art-troubles-sommeil-mois-ans/', consulted_on: C, published: '2023-01-13' },
  ameliEcrans: { label: 'ameli.fr — Comment adapter l’usage des écrans à l’âge de l’enfant ?', url: 'https://www.ameli.fr/assure/sante/themes/ecrans-enfance-adolescence/usage-ecran-age', consulted_on: C, published: '2025-07-17' },
  ameliDents: { label: 'ameli.fr — Les conseils pour prendre soin des dents de votre enfant', url: 'https://www.ameli.fr/assure/sante/enfants/depistages-scolaires-assurance-maladie/depistage-dentaire-en-grande-section-de-maternelle/les-conseils-pour-prendre-soin-des-dents-de-votre-enfant', consulted_on: C, published: '2025-09-02' },
  santeAgressivite: { label: 'Santé.fr — Comment réagir face à l’agressivité persistante de mon enfant ?', url: 'https://www.sante.fr/comment-reagir-face-lagressivite-persistante-de-mon-enfant', consulted_on: C, published: '2023-09-01' },
  mpediaProprete: { label: 'mpedia.fr (AFPA) — Comment mon enfant va-t-il devenir propre ?', url: 'https://www.mpedia.fr/art-acquisition-proprete/', consulted_on: C, published: '2023-08-31' },
  mbOpposition: { label: 'Manger Bouger — Mon enfant ne veut pas manger : que faire face à son opposition ?', url: 'https://www.mangerbouger.fr/manger-mieux/a-tout-age-et-a-chaque-etape-de-la-vie/jeunes-enfants-de-0-a-3-ans-du-lait-a-la-diversification/mon-enfant-ne-veut-pas-manger-que-faire-face-a-son-opposition', consulted_on: C, published: '2025-10-27' },
  // Sommeil des parents
  nhsFatigueParents: { label: 'NHS (Royaume-Uni) — Sleep and tiredness after having a baby', url: 'https://www.nhs.uk/baby/support-and-services/sleep-and-tiredness-after-having-a-baby/', consulted_on: C, published: '2026-08-24' },
  ameliAsthenie: { label: 'ameli.fr — Fatigue (asthénie) : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/asthenie-fatigue/bons-reflexes-cas-faut-consulter', consulted_on: C, published: '2026-08-07' },
  santeSanteMentaleParents: { label: 'Santé.fr (Psycom) — La santé mentale des parents', url: 'https://www.sante.fr/la-sante-mentale-des-parents', consulted_on: C, published: '2025-08-04' },
  santeBurnout: { label: 'Santé.fr — C’est quoi le burn out parental ?', url: 'https://www.sante.fr/cest-quoi-le-burn-out-parental', consulted_on: C, published: '2020-02-03' },
  // Ajouts du 23 octobre 2026
  ameliRegurgitations: { label: 'ameli.fr — Régurgitations du nourrisson : que faire ?', url: 'https://www.ameli.fr/assure/sante/themes/rgo-nourrisson/que-faire-quand-consulter', consulted_on: '2026-10-23' },
  ameliRgoTraitement: { label: 'ameli.fr — RGO du nourrisson : le diagnostic et le traitement', url: 'https://www.ameli.fr/assure/sante/themes/rgo-nourrisson/diagnostic-traitement', consulted_on: '2026-10-23', published: '2026-03-24' },
  ameliConstipationEnfant: { label: 'ameli.fr — Constipation de l’enfant : que faire et quand consulter ?', url: 'https://www.ameli.fr/assure/sante/themes/constipation-enfant/bons-reflexes', consulted_on: '2026-10-23' },
  ameliFessesRouges: { label: 'ameli.fr — Que faire si votre nourrisson a les fesses rouges ?', url: 'https://www.ameli.fr/assure/sante/themes/erytheme-fessier-du-nourisson-fesses-rouges/bons-reflexes-que-faire', consulted_on: '2026-10-23' },
  ameliToiletteBebe: { label: 'ameli.fr — Comment changer un nourrisson et faire sa toilette ?', url: 'https://www.ameli.fr/assure/sante/bons-gestes/bebe/changer-bebe-faire-toilette', consulted_on: '2026-10-23' },
  ameliAccouchement: { label: 'ameli.fr — Comment se déroule un accouchement ?', url: 'https://www.ameli.fr/assure/sante/devenir-parent/accouchement-nouveau-ne-et-retour-la-maison/accouchement', consulted_on: '2026-10-23' },
  hasAccouchementNormal: { label: 'HAS — Accouchement normal : accompagnement de la physiologie et interventions médicales', url: 'https://www.has-sante.fr/jcms/c_2820336/fr/accouchement-normal-accompagnement-de-la-physiologie-et-interventions-medicales', consulted_on: '2026-10-23' },
  santeVieFamille: { label: 'Santé.fr (1000 premiers jours) — La vie de famille après la naissance', url: 'https://www.sante.fr/la-vie-de-famille-apres-la-naissance', consulted_on: '2026-10-23', published: '2024-08-26' },
  santeReglesDouloureuses: { label: 'Santé.fr — Règles douloureuses (dysménorrhées)', url: 'https://www.sante.fr/regles-douloureuses-dysmenorrhees', consulted_on: '2026-10-23', published: '2026-08-12' },
  santeEndometrioseRegles: { label: 'Santé.fr — Symptômes de l’endométriose : les règles douloureuses', url: 'https://www.sante.fr/endometriose/symptomes-de-lendometriose-les-regles-douloureuses', consulted_on: '2026-10-23' },
} satisfies Record<string, ArticleSource>;

export const LIBRARY_SOURCES: Record<keyof typeof S, ArticleSource> = S;

export const LIBRARY_ARTICLES: LibArticle[] = [
  // ───────────────────────────── Projet bébé ─────────────────────────────
  {
    slug: 'comprendre-fenetre-fertile',
    title: 'Comprendre la fenêtre fertile',
    summary: 'La période où une grossesse est possible ne se calcule qu’approximativement, car l’ovulation peut varier d’un cycle à l’autre.',
    body_md: `Beaucoup de calendriers et d'applications affichent une « période fertile ». Ce sont des estimations utiles pour se repérer, mais pas des certitudes.

### Ce que l'on sait
- Au cours de chaque cycle, un ovocyte est libéré lors de l'ovulation. Dans le cycle « type » décrit dans les manuels, elle se situe vers le 14e jour, mais ce repère ne vaut pas pour tout le monde.
- Les spermatozoïdes peuvent survivre jusqu'à 5 jours dans les voies génitales féminines. Des rapports dans les jours qui précèdent l'ovulation peuvent donc aboutir à une grossesse.
- L'ovulation n'a pas toujours lieu au même moment : le stress, la fatigue ou un sommeil perturbé peuvent la décaler.

### Les signes que certaines personnes observent
- La glaire cervicale devient plus abondante, fluide et filante autour de l'ovulation.
- La température du matin s'élève légèrement (0,2 à 0,5 °C) après l'ovulation : elle la confirme donc après coup, sans la prévoir.

### En pratique
Plutôt que de viser un jour précis, les sources de l'Assurance Maladie décrivent des rapports réguliers, de l'ordre de deux à trois fois par semaine. Même chez un couple fertile de 25 ans, la probabilité de grossesse est d'environ 25 % par cycle : il est fréquent que cela prenne plusieurs mois.

### Quand demander conseil
Si vos cycles sont très irréguliers, douloureux, ou si vous avez des questions sur votre santé, un médecin ou une sage-femme peut vous recevoir dès le début du projet, lors d'une consultation préconceptionnelle.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['ovulation', 'cycle', 'fertilité', 'conception'],
    sources: [S.qsNaturelles, S.ameliNaturelles, S.ameliSterilite, S.santeConditions],
    status: 'to_review',
  },
  {
    slug: 'acide-folique-avant-conception',
    title: 'Acide folique (vitamine B9) : dès le projet de grossesse',
    summary: 'La vitamine B9 participe au développement du système nerveux de l’embryon ; un professionnel peut la prescrire dès le projet de grossesse.',
    body_md: `La vitamine B9, aussi appelée acide folique ou folates, joue un rôle important dans le développement du fœtus, notamment dans la fermeture du tube neural, qui deviendra le cerveau et la moelle épinière.

### Pourquoi y penser avant d'être enceinte
Le tube neural se forme très tôt, souvent avant même que l'on sache être enceinte. C'est pourquoi les sources officielles conseillent d'avoir suffisamment de vitamine B9 dès le projet de grossesse, et jusqu'à la fin du troisième mois.

Selon l'Assurance Maladie, seules 28,3 % des femmes commençaient la supplémentation avant la grossesse en 2021 : si ce n'est pas votre cas, ce n'est pas une faute, parlez-en simplement dès que possible.

### Comment faire
- **Demandez une prescription** à votre médecin ou à votre sage-femme : c'est lui ou elle qui choisit le produit et la dose adaptés à votre situation.
- Évitez de commencer de vous-même des compléments alimentaires : certains contiennent des vitamines ou des minéraux dont un apport élevé est déconseillé.

### Dans l'assiette
Les folates se trouvent notamment dans :
- les légumes verts (épinards, salades, brocolis, asperges) et certains fruits (agrumes, bananes, avocats) ;
- les légumes secs (lentilles, pois chiches, haricots) ;
- les fruits à coque non salés et les féculents complets.

L'alimentation seule ne remplace pas la supplémentation prescrite, mais elle y contribue.

### À retenir
Une consultation préconceptionnelle avec un médecin ou une sage-femme est un bon moment pour aborder la vitamine B9, vos traitements en cours et vos vaccinations.`,
    journeys: ['ttc'],
    category: 'alimentation',
    tags: ['acide folique', 'vitamine B9', 'préconception', 'supplémentation'],
    sources: [S.santeB9, S.ameliHabitudes],
    status: 'to_review',
  },
  {
    slug: 'grossesse-qui-tarde-quand-consulter',
    title: 'Quand la grossesse se fait attendre : quand consulter ?',
    summary: 'Les repères officiels proposent de consulter après 12 mois d’essais, ou environ 6 mois si la femme a plus de 35 ans.',
    body_md: `Attendre une grossesse qui ne vient pas peut être éprouvant. Sachez que c'est fréquent : en France, environ un couple sur huit consulte pour des difficultés à concevoir.

### Les repères pour consulter
Selon l'Assurance Maladie, une consultation est conseillée :
- après **12 mois** de rapports réguliers sans contraception sans grossesse ;
- après **environ 6 mois** si la femme a plus de 35 ans, ou s'il existe une maladie gynécologique connue ou suspectée (par exemple une endométriose).

Rien ne vous empêche de consulter plus tôt si vous êtes inquiets, si les cycles sont très irréguliers ou si vous avez des antécédents particuliers.

### Pourquoi l'âge compte
La fertilité diminue avec l'âge, chez la femme comme chez l'homme. D'après Santé.fr, les chances de grossesse par cycle sont d'environ 25 % entre 25 et 30 ans, 12 % à 35 ans et 6 % au-delà de 40 ans. Les délais de prise en charge pouvant être longs, il est utile d'anticiper.

### Comment se passe le premier rendez-vous
- Il concerne **les deux membres du couple** : les causes peuvent être féminines, masculines, mixtes, ou rester inexpliquées.
- Le médecin fait le point sur les cycles, les antécédents, le mode de vie et la vie sexuelle.
- Il peut prescrire des examens : prises de sang, échographie, spermogramme.

### Prendre soin de vous
Ces démarches peuvent peser sur le moral et sur le couple. Vous pouvez en parler à votre médecin, à votre sage-femme ou à un psychologue. Et si un jour vous avez des idées noires, le 3114 répond 24 h/24.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['infertilité', 'bilan', 'quand consulter', 'âge'],
    sources: [S.ameliBilan, S.santeAge, S.santeInfertilite],
    status: 'to_review',
  },
  {
    slug: 'tests-ovulation-ce-quils-indiquent',
    title: 'Tests d’ovulation : ce qu’ils indiquent, et ce qu’ils ne disent pas',
    summary: 'Les tests d’ovulation détectent une hausse d’hormone dans les urines ; ils aident à se repérer mais ne posent aucun diagnostic.',
    body_md: `Les tests d'ovulation sont des autotests urinaires vendus sans ordonnance. Ils peuvent aider à se repérer dans son cycle, à condition de savoir ce qu'ils mesurent.

### Ce qu'ils indiquent
- Ils détectent la hausse d'une hormone, la **LH**, qui survient en général 24 à 48 heures avant l'ovulation.
- Un test « positif » signale donc que l'ovulation est probablement proche.

### Ce qu'ils ne disent pas
- Selon l'ANSM, ces tests renseignent seulement sur la présence ou l'absence d'un marqueur : **ils ne posent pas de diagnostic**.
- Comme tout autotest, ils peuvent donner des résultats faussement positifs ou faussement négatifs.
- Ils ne disent rien de la fertilité globale du couple et ne remplacent pas un avis médical si la grossesse tarde.

### Bien les utiliser
- Lisez attentivement la notice : l'heure et la fréquence des tests varient selon les marques.
- Choisissez des tests marqués CE, achetés en pharmacie ou sur le site d'une pharmacie.
- En cas de doute sur un résultat, demandez conseil à votre pharmacien ou à un professionnel de santé.

### Sans pression
Ces tests peuvent rassurer certaines personnes et en stresser d'autres. Des rapports réguliers tout au long du cycle restent une approche simple. Si vous avez l'impression que le suivi du cycle prend trop de place, vous pouvez en parler à votre médecin ou à votre sage-femme.

### Quand consulter
Après 12 mois d'essais sans grossesse, ou environ 6 mois si la femme a plus de 35 ans, une consultation est conseillée.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['test d’ovulation', 'LH', 'autotest', 'cycle'],
    sources: [S.ameliNaturelles, S.ansmAutotests, S.ameliBilan],
    status: 'to_review',
  },
  {
    slug: 'mode-de-vie-et-fertilite',
    title: 'Mode de vie et fertilité : ce qui peut aider',
    summary: 'Tabac, alcool, poids, sommeil et activité physique influencent la fertilité, chez la femme comme chez l’homme.',
    body_md: `La fertilité dépend de nombreux facteurs, dont certains ne se contrôlent pas. D'autres, liés au mode de vie, peuvent être ajustés, à votre rythme et sans culpabilité.

### Pour les deux partenaires
- **Tabac** : c'est l'un des principaux facteurs de baisse de fertilité. Chez la femme, il peut retarder la conception ; chez l'homme, il diminue la quantité et la mobilité des spermatozoïdes. Se faire aider pour arrêter est possible.
- **Alcool** : il peut perturber les cycles et la qualité du sperme. Les sources officielles conseillent d'arrêter dès le projet de grossesse.
- **Cannabis et autres drogues** : ils ont aussi des effets sur la fertilité ; demander de l'aide est une démarche courante.
- **Poids** : un surpoids important comme une grande maigreur peuvent réduire les chances de concevoir. Un médecin peut proposer un accompagnement adapté.
- **Caféine** : Santé.fr conseille de la limiter à une ou deux tasses par jour.

### Au quotidien
- Une activité physique régulière, même la marche, est favorable.
- Un sommeil réparateur compte : Santé.fr cite au moins 8 heures par nuit comme repère.
- Une alimentation variée, avec peu de produits ultra-transformés, est conseillée.
- Aérer son logement et limiter l'exposition à certains produits (parfums d'intérieur, huiles essentielles, travaux) fait partie des recommandations.

### Un point avec un professionnel
La consultation préconceptionnelle, avec un médecin ou une sage-femme, permet de revoir vos traitements, vos vaccinations et vos habitudes. N'arrêtez jamais un traitement de vous-même : parlez-en d'abord.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['mode de vie', 'tabac', 'alcool', 'fertilité', 'préconception'],
    sources: [S.santeModeVie, S.ameliHabitudes, S.ameliPreconception],
    status: 'to_review',
  },
  {
    slug: 'test-de-grossesse-quand-le-faire',
    title: 'Test de grossesse : quand le faire ?',
    summary: 'Un test urinaire fait trop tôt peut être faussement négatif ; il est plus fiable avec les urines du matin, quelques semaines après le rapport.',
    body_md: `Après un retard de règles ou un rapport, il est naturel de vouloir savoir très vite. Quelques repères aident à choisir le bon moment.

### Comment fonctionne le test
Les tests détectent l'hormone hCG. Selon l'Assurance Maladie, elle apparaît environ 10 jours après la fécondation. Si le test est fait trop tôt, la quantité d'hormone peut être insuffisante et le résultat **faussement négatif**.

### Le bon moment
- Santé.fr indique que le test urinaire peut être réalisé **21 jours après un rapport non protégé**.
- Utilisez de préférence les **premières urines du matin**, plus concentrées.
- Suivez la notice et achetez si possible le test en pharmacie.

### Urinaire ou sanguin ?
- Le test urinaire est vendu sans ordonnance. Il est fiable s'il est fait au bon moment.
- Le dosage sanguin, prescrit par un médecin ou une sage-femme, est plus précis.
- Certains médicaments, une infection urinaire ou du sang dans les urines peuvent fausser un résultat.

### Après le résultat
- **Positif** : prenez rendez-vous avec un médecin ou une sage-femme pour confirmer la grossesse et démarrer le suivi.
- **Négatif mais toujours pas de règles** : vous pouvez refaire un test quelques jours plus tard et consulter.
- **En cas de doute, même après un test négatif**, consultez.

### Signes qui ne doivent pas attendre
Des douleurs du bas-ventre, d'un côté ou diffuses, avec des saignements, un malaise ou de la fièvre, justifient une consultation en urgence.`,
    journeys: ['ttc'],
    category: 'grossesse',
    tags: ['test de grossesse', 'hCG', 'retard de règles'],
    sources: [S.santeTests, S.ameliPremiersSignes, S.ameliSaign1],
    status: 'to_review',
  },

  // ───────────────────────────── Éviter une grossesse ─────────────────────────────
  {
    slug: 'contraception-methodes-efficacite',
    title: 'Méthodes de contraception : comparer leur efficacité',
    summary: 'L’efficacité « dans la vraie vie » varie beaucoup d’une méthode à l’autre, selon qu’elle dépend ou non de gestes quotidiens.',
    body_md: `Il n'existe pas de contraception idéale pour tout le monde. Le bon choix dépend de votre santé, de votre vie et de vos préférences, à discuter avec un professionnel.

### Deux chiffres à connaître
- **Efficacité théorique** : quand la méthode est utilisée parfaitement.
- **Efficacité pratique** : dans la vie courante, avec les oublis et les erreurs possibles.

Plus l'écart est grand, plus la méthode demande de la régularité.

### Pourcentage de grossesses sur un an en usage courant
D'après le tableau publié par l'Assurance Maladie :
- implant : 0,05 % ;
- stérilet (DIU) hormonal : 0,2 % ; DIU au cuivre : 0,8 % ;
- pilule (combinée ou progestative) : 8 % ;
- préservatif masculin : 15 % ;
- méthodes naturelles : environ 20 % ;
- spermicides seuls : 29 %.

Les méthodes de longue durée (stérilet, implant) ont un écart très faible entre théorie et pratique, car elles ne dépendent pas d'un geste quotidien.

### Et les infections sexuellement transmissibles ?
Seuls les préservatifs protègent contre les IST. Ils peuvent être associés à une autre contraception.

### À qui en parler
- Votre médecin traitant, un ou une gynécologue, une sage-femme ;
- un centre de santé sexuelle (anciennement centre de planification), où l'accueil est confidentiel.

Le numéro **0 800 08 11 11** (gratuit et anonyme) répond aussi aux questions sur la contraception et la sexualité.

Changer de méthode est toujours possible si celle que vous utilisez ne vous convient plus.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception', 'efficacité', 'implant', 'stérilet', 'pilule', 'préservatif'],
    sources: [S.ameliEfficacite, S.ameliHormonale, S.santeRapportRisque],
    status: 'to_review',
  },
  {
    slug: 'calendrier-pas-une-contraception-fiable',
    title: 'Pourquoi un calendrier seul n’est pas une contraception fiable',
    summary: 'Aucun jour du cycle ne peut être considéré comme sûr à coup sûr : l’ovulation varie et les spermatozoïdes survivent plusieurs jours.',
    body_md: `Les applications et calendriers de cycle peuvent aider à connaître son corps. Mais utilisés seuls pour éviter une grossesse, ils sont parmi les méthodes les moins fiables.

### Pourquoi ce n'est pas fiable
- **L'ovulation varie** : elle n'a pas toujours lieu au même moment, même chez une personne aux cycles habituellement réguliers. Le stress, la fatigue ou un sommeil perturbé peuvent la décaler.
- **Les spermatozoïdes survivent** jusqu'à 5 jours dans les voies génitales féminines. Un rapport plusieurs jours avant l'ovulation peut donc aboutir à une grossesse.
- Un calendrier se base sur les cycles passés : il ne peut pas prévoir un décalage.

C'est pourquoi **aucun jour du cycle ne peut être présenté comme sans possibilité de grossesse**.

### Quelques chiffres
- Selon QuestionSexualité (Santé publique France), la méthode du calendrier a un taux d'échec de 15 à 25 % sur un an.
- L'Assurance Maladie estime à environ 20 % l'échec des méthodes naturelles en usage courant, contre moins de 1 % pour un stérilet ou un implant.
- Les méthodes naturelles sont déconseillées en cas de cycles irréguliers et ne protègent pas des IST.

### Si vous souhaitez une méthode sans hormones
D'autres options existent, comme le stérilet au cuivre ou le préservatif. Certaines méthodes d'observation demandent une formation et un long apprentissage. Un médecin, une sage-femme ou un centre de santé sexuelle peut vous aider à choisir.

### Après un rapport à risque
Si vous ne souhaitez pas de grossesse, la contraception d'urgence est d'autant plus efficace qu'elle est prise tôt. Votre pharmacien peut vous conseiller sans rendez-vous.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception', 'calendrier', 'méthodes naturelles', 'application de cycle'],
    sources: [S.qsNaturelles, S.ameliNaturelles, S.ameliEfficacite],
    status: 'to_review',
  },
  {
    slug: 'oubli-de-pilule-que-faire',
    title: 'Oubli de pilule : que faire ?',
    summary: 'La conduite à tenir dépend du type de pilule, du retard et des rapports récents ; le pharmacien peut vous aider à tout moment.',
    body_md: `Oublier un comprimé arrive à beaucoup de personnes. L'important est de savoir quoi faire, et de ne pas hésiter à demander conseil.

### Vérifiez d'abord votre type de pilule
Les délais diffèrent selon la pilule. D'après l'Assurance Maladie, un oubli est « court » s'il dure moins de **12 heures** pour une pilule combinée et moins de **3 heures** pour certaines pilules microprogestatives. La notice de votre pilule fait foi : relisez-la.

### Oubli court
Prenez le comprimé oublié tout de suite, puis continuez à l'heure habituelle. La contraception reste efficace.

### Oubli plus long
- Prenez immédiatement le dernier comprimé oublié, puis continuez normalement, même si cela fait deux comprimés le même jour.
- **Rapport non protégé dans les 5 jours précédant l'oubli** : une contraception d'urgence est recommandée, avec un préservatif jusqu'aux règles suivantes.
- **Pas de rapport dans ces 5 jours** : utilisez un préservatif pendant 7 jours.
- Si l'oubli concerne l'un des 7 derniers comprimés actifs, enchaînez directement sur la plaquette suivante, sans pause.

### Plusieurs comprimés oubliés, ou un doute
Demandez conseil rapidement à votre pharmacien ou à votre médecin. En cas de doute, un test de grossesse peut être fait 21 jours après l'oubli.

### Patch et anneau
Ils ont leurs propres règles (par exemple 3 heures pour un anneau expulsé). Consultez la notice et votre pharmacien.

### Pour limiter les oublis
Une alarme quotidienne peut aider. Si les oublis sont fréquents, une méthode qui ne dépend pas d'un geste quotidien (implant, stérilet) peut être discutée avec un professionnel.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['pilule', 'oubli', 'contraception d’urgence', 'préservatif'],
    sources: [S.ameliHormonale, S.ameliCuReflexes],
    status: 'to_review',
  },
  {
    slug: 'contraception-urgence-ou-et-quand',
    title: 'Contraception d’urgence : où et quand ?',
    summary: 'Plus elle est prise tôt, plus elle est efficace : la pilule d’urgence est disponible en pharmacie sans ordonnance.',
    body_md: `Après un rapport non protégé, un oubli de contraception ou un préservatif qui a glissé, la contraception d'urgence permet de réduire le risque de grossesse. Elle n'interrompt pas une grossesse déjà commencée.

### Les options
- **Pilule d'urgence au lévonorgestrel** : jusqu'à 3 jours après le rapport.
- **Pilule d'urgence à l'ulipristal acétate** : jusqu'à 5 jours après le rapport.
- **Stérilet au cuivre** : posé dans les 5 jours par un médecin ou une sage-femme, c'est la méthode la plus efficace selon l'Assurance Maladie. Il peut ensuite servir de contraception régulière.

Dans tous les cas, **plus c'est tôt, mieux c'est**. Aucune méthode n'est efficace à 100 %.

### Où l'obtenir
- En pharmacie, **sans ordonnance**. L'Assurance Maladie indique qu'elle y est délivrée gratuitement ; le pharmacien vous précisera les modalités.
- Pour les mineures : de façon anonyme, en pharmacie ou auprès de l'infirmière scolaire.
- Dans un centre de santé sexuelle.

### Après la prise
- Utilisez un préservatif à chaque rapport jusqu'aux règles suivantes.
- En cas de vomissement dans les 3 heures, demandez conseil : une nouvelle prise peut être nécessaire.
- Les règles peuvent être un peu avancées ou retardées. **Si elles ont plus de 5 jours de retard, faites un test de grossesse.**
- Certains médicaments peuvent diminuer son efficacité : signalez vos traitements au pharmacien.

### Et les IST ?
La contraception d'urgence ne protège pas des IST. Après un rapport à risque, un dépistage est possible ; pour le VIH, consultez sans dépasser 48 heures, car un traitement préventif peut être proposé.

Numéro d'information : **0 800 08 11 11** (gratuit, anonyme).`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception d’urgence', 'pilule du lendemain', 'stérilet au cuivre', 'pharmacie'],
    safety_critical: true,
    sources: [S.ameliCu, S.ameliCuReflexes, S.santeRapportRisque],
    status: 'to_review',
  },

  // ───────────────────────────── Grossesse ─────────────────────────────
  {
    slug: 'suivi-grossesse-rendez-vous-examens',
    title: 'Le suivi de grossesse : rendez-vous et examens',
    summary: 'Sept consultations, trois échographies, un entretien prénatal précoce et sept séances de préparation jalonnent le suivi habituel.',
    body_md: `Le suivi de grossesse permet de veiller à votre santé et à celle du bébé, et de répondre à vos questions. Voici le programme habituel décrit par l'Assurance Maladie, que votre professionnel adaptera à votre situation.

### Les grands rendez-vous
- **Première consultation**, avant la fin du 3e mois : bilan de santé, examen, prises de sang, déclaration de grossesse.
- **Sept consultations** au total, puis une par mois à partir du 4e mois.
- **Trois échographies** recommandées.
- **Entretien prénatal précoce** : un temps d'échange avec une sage-femme ou un médecin, conseillé dès le 4e mois. Il n'est jamais trop tard pour le demander.
- **Sept séances de préparation** à la naissance et à la parentalité.
- **Consultation d'anesthésie** au 8e mois, même sans projet de péridurale.

### Les examens
- Prises de sang (groupe sanguin, immunités, anémie) et analyses d'urine régulières.
- Selon les situations, des contrôles supplémentaires (toxoplasmose, rubéole, rhésus).
- Des vaccinations peuvent être proposées pendant la grossesse (par exemple contre la coqueluche).

### D'autres aides
- Un **bilan bucco-dentaire** est pris en charge à partir du 4e mois.
- Un **bilan prénatal de prévention** avec une sage-femme peut être proposé, si possible avant la 24e semaine.

### Entre deux rendez-vous
Vous pouvez contacter votre sage-femme, votre médecin ou votre maternité à tout moment si quelque chose vous inquiète. Contractions douloureuses ou rapprochées, saignements, perte de liquide, brûlures urinaires, fortes nausées ou humeur très changeante sont des raisons de consulter sans attendre le prochain rendez-vous.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['suivi', 'consultations', 'examens', 'entretien prénatal'],
    min_week: 4, max_week: 41,
    sources: [S.ameliProgramme, S.ameliMensuel],
    status: 'to_review',
  },
  {
    slug: 'echographies-de-grossesse',
    title: 'Les trois échographies de la grossesse',
    summary: 'Trois échographies sont recommandées, chacune avec un objectif précis : dater, observer le développement, vérifier la croissance.',
    body_md: `Les échographies sont souvent des moments forts, attendus et parfois source d'inquiétude. Savoir à quoi sert chacune peut aider à les aborder plus sereinement.

### Première échographie : vers 11 à 13 SA + 6 jours
Dite « de datation », elle permet :
- de préciser le terme et la date prévue d'accouchement ;
- de connaître le nombre de fœtus et de vérifier leur vitalité ;
- de dépister certaines malformations importantes.

Elle s'inscrit aussi dans le dépistage de la trisomie 21, qui vous est proposé et que vous êtes libre d'accepter ou non.

### Deuxième échographie : entre 20 et 24 SA
Appelée « morphologique », elle observe le développement des organes, mesure le bébé et repère la position du placenta.

### Troisième échographie : entre 30 et 35 SA
Elle contrôle la croissance, la position du bébé et le placenta, en vue de l'accouchement.

### Bon à savoir
- **SA** signifie « semaines d'aménorrhée », comptées depuis le premier jour des dernières règles.
- D'autres échographies peuvent être prescrites selon votre situation : cela ne signifie pas forcément qu'il y a un problème. N'hésitez pas à demander pourquoi.
- Vous pouvez venir accompagnée, et poser toutes vos questions pendant ou après l'examen.

### Si une anomalie est évoquée
Vous avez le droit de prendre le temps de comprendre et de demander des explications. Votre équipe peut vous orienter vers un accompagnement adapté, y compris un soutien psychologique.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['échographie', 'datation', 'morphologique', 'SA'],
    min_week: 8, max_week: 36,
    sources: [S.ameliProgramme, S.ameliMensuel],
    status: 'to_review',
  },
  {
    slug: 'nausees-de-grossesse',
    title: 'Nausées de grossesse : ce qui peut soulager',
    summary: 'Fréquentes en début de grossesse, les nausées peuvent survenir à toute heure ; certains signes doivent faire consulter rapidement.',
    body_md: `On parle souvent de « nausées du matin », mais elles peuvent survenir à n'importe quel moment de la journée. Elles sont fréquentes et peuvent être très pénibles : ce n'est pas « dans la tête ».

### Ce qui peut aider
- Manger souvent, en petites quantités, sans rester longtemps à jeun.
- Choisir ce qui vous fait envie, en évitant les plats gras, frits ou épicés.
- Réduire le thé, le café et les boissons caféinées.
- Boire régulièrement, surtout en cas de vomissements.
- Se lever doucement, aérer, éviter les odeurs qui déclenchent les nausées.
- Se reposer : la fatigue peut les aggraver. Des siestes ou des jours de repos peuvent être utiles.

### Médicaments et produits naturels
- **Aucun médicament sans avis médical.**
- Les huiles essentielles sont à éviter pendant la grossesse.
- Le gingembre peut être envisagé pour des nausées peu sévères : demandez conseil à votre pharmacien.

### Évaluer leur intensité
Un questionnaire simple, le score PUQE, permet d'évaluer les nausées sur 24 heures. Votre médecin ou votre sage-femme peut vous aider à le remplir.

### Quand consulter
- **Rapidement** : vomissements importants et persistants qui gênent la vie quotidienne, perte de poids, impossibilité de garder les liquides, signes de déshydratation (soif intense, bouche sèche, urines foncées), fièvre ou fatigue inhabituelle.
- **En urgence** : nausées et vomissements sévères (forme appelée hyperémèse gravidique), qui nécessitent un traitement rapide.

Des traitements existent : vous n'avez pas à « tenir bon » seule.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['nausées', 'vomissements', 'premier trimestre', 'hyperémèse'],
    min_week: 4, max_week: 20,
    safety_critical: true,
    sources: [S.ameliNausees, S.ameliNauseesConsult],
    status: 'to_review',
  },
  {
    slug: 'sommeil-pendant-la-grossesse',
    title: 'Mieux dormir pendant la grossesse',
    summary: 'La fatigue est fréquente pendant la grossesse ; quelques habitudes et la position sur le côté peuvent aider.',
    body_md: `La fatigue est très fréquente, surtout au premier trimestre, en raison des changements hormonaux. Plus tard, le ventre qui s'arrondit peut rendre le repos plus difficile.

### Des idées pour mieux se reposer
- Reposez-vous dès que possible et acceptez l'aide proposée.
- Prenez un moment calme avant le coucher : respiration, relaxation.
- Évitez les longues siestes en fin d'après-midi si elles vous empêchent de vous endormir le soir.
- Limitez la caféine (thé, café, cola) en soirée.
- Restez active dans la journée si votre situation le permet : marche, natation, gymnastique douce.
- Calez votre ventre avec un coussin et placez-en un entre vos genoux.

### Quelle position ?
- Dormir **sur le côté**, gauche ou droit, est la position conseillée, notamment à partir du troisième trimestre. Le service de santé britannique (NHS) cite des travaux associant le sommeil sur le dos après 28 semaines à un risque plus élevé de complications graves pour le bébé.
- Si vous vous réveillez sur le dos, pas d'inquiétude : tournez-vous simplement sur le côté.
- L'Assurance Maladie conseille aussi d'éviter de rester allongée sur le dos de façon prolongée à partir de la 24e semaine.

### Les pensées qui empêchent de dormir
Inquiétudes, rêves intenses, questions sur l'accouchement : en parler avec votre partenaire, votre sage-femme ou lors de la préparation à la naissance peut soulager.

### Quand en parler
- Si le manque de sommeil vous pèse ou dure.
- Si l'insomnie s'accompagne de tristesse, de perte d'intérêt ou d'un sentiment de désespoir : parlez-en à votre médecin ou à votre sage-femme. Des solutions existent.`,
    journeys: ['pregnant'],
    category: 'sommeil',
    tags: ['sommeil', 'fatigue', 'position', 'insomnie'],
    sources: [S.nhsFatigueGrossesse, S.ameliActive],
    status: 'to_review',
  },
  {
    slug: 'grossesse-signes-qui-doivent-faire-consulter',
    title: 'Pendant la grossesse : les signes qui doivent faire consulter',
    summary: 'Saignements, perte de liquide, contractions rapprochées ou certains maux de tête doivent faire contacter rapidement la maternité ou un professionnel.',
    body_md: `La plupart des grossesses se déroulent bien. Connaître les signes d'alerte permet simplement de réagir vite si besoin. **En cas de doute, appelez : vous ne dérangez pas.**

### Appelez le 15 (ou le 112), ou rendez-vous aux urgences
- Saignement abondant avec malaise.
- Saignements avec douleurs du bas-ventre (d'un côté ou diffuses), ou avec fièvre.
- Douleur dans la poitrine.

### Contactez sans attendre votre maternité
- **Tout saignement au 2e ou 3e trimestre**, même indolore ou après un rapport : il doit être vu en urgence.
- **Perte de liquide** continue, qui peut évoquer une rupture de la poche des eaux.
- **Contractions** douloureuses ou de plus en plus rapprochées, qui ne cèdent pas au repos.
- À partir du milieu de la grossesse : **maux de tête persistants**, troubles de la vue (taches, éclairs, vision floue), douleur en barre en haut du ventre, bourdonnements d'oreilles, gonflement brutal du visage ou des mains. Ces signes peuvent évoquer une pré-éclampsie.
- Mollet gonflé, dur et douloureux.

### Consultez rapidement
- Fièvre (38 °C ou plus), même sans autre signe.
- Saignement léger au premier trimestre, sans douleur ni malaise.
- Nausées et vomissements importants, signes de déshydratation.
- Brûlures en urinant.
- Vertiges, malaises, essoufflement anormal qui persiste au repos.

### Votre moral compte aussi
Pleurs fréquents, humeur très changeante, anxiété permanente : parlez-en à votre sage-femme ou à votre médecin. Si vous avez des idées de vous faire du mal, appelez le **3114** (gratuit, 24 h/24).

Si vous avez une inquiétude sur les mouvements de votre bébé, contactez votre maternité sans attendre.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['signes d’alerte', 'urgence', 'saignements', 'contractions', 'pré-éclampsie'],
    safety_critical: true,
    sources: [S.ameliMensuel, S.ameliSaign1, S.ameliSaign23, S.ameliPreeclampsie, S.sante8eMois],
    status: 'to_review',
  },
  {
    slug: 'activite-physique-pendant-la-grossesse',
    title: 'Bouger pendant la grossesse',
    summary: 'Sauf contre-indication, une activité physique régulière et modérée est bénéfique ; certains signes doivent faire arrêter et consulter.',
    body_md: `Sauf avis médical contraire, bouger régulièrement pendant la grossesse est bénéfique : meilleur sommeil, moins de douleurs de dos, meilleure circulation, moral soutenu.

### Les repères
- Viser environ **30 minutes par jour** d'activité modérée, comme la marche, la natation ou la gymnastique douce.
- Si vous étiez peu active, commencer par 15 minutes, au moins trois jours par semaine, et augmenter progressivement.
- Se lever régulièrement si l'on reste longtemps assise.
- La régularité compte plus que l'intensité.

### À éviter
- Les sports avec risque de chute (vélo, ski, équitation, roller) et les sports de contact ou de combat.
- La plongée sous-marine.
- Les efforts en bloquant sa respiration.
- Les environnements très chauds, l'altitude et les pics de pollution.
- Rester longtemps allongée sur le dos à partir de la 24e semaine.

### Les bons réflexes
- Échauffement, récupération douce et hydratation.
- Par forte chaleur, préférer le matin ou le soir.
- Demander conseil à votre médecin ou à votre sage-femme avant de commencer : leur avis prime sur ces repères généraux.

### Arrêtez et consultez si
- Essoufflement anormal qui persiste au repos.
- Douleur dans la poitrine : **appelez le 15**.
- Contractions régulières et douloureuses qui ne cessent pas au repos.
- Saignements vaginaux.
- Vertiges, malaise, maux de tête inhabituels.
- Mollet gonflé et dur.

Et si la fatigue vous empêche de bouger certains jours, ce n'est pas un échec : écoutez votre corps.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['activité physique', 'sport', 'marche', 'précautions'],
    sources: [S.mbGrossesse, S.ameliActive],
    status: 'to_review',
  },
  {
    slug: 'preparation-naissance-parentalite',
    title: 'La préparation à la naissance et à la parentalité',
    summary: 'Sept séances prises en charge permettent de comprendre l’accouchement, les premiers jours avec bébé et de poser vos questions.',
    body_md: `La préparation à la naissance ne sert pas qu'à apprendre à respirer. C'est aussi un espace pour poser des questions, rencontrer d'autres futurs parents et préparer le retour à la maison.

### En pratique
- **Sept séances** prises en charge à 100 % par l'Assurance Maladie.
- Animées par une sage-femme ou un médecin, en groupe ou en individuel.
- Elles se déroulent au fil de la grossesse ; leur calendrier se définit souvent lors de l'entretien prénatal précoce.

### Ce qui peut y être abordé
- Le déroulement de la fin de grossesse, de l'accouchement et du séjour à la maternité.
- Des exercices de respiration et de relaxation.
- Des postures pour soulager certains inconforts.
- Les soins au nouveau-né, l'alimentation du bébé et l'organisation du retour à la maison.

### L'entretien prénatal précoce
C'est un rendez-vous obligatoire, seule ou en couple, avec une sage-femme ou un médecin, conseillé dès le 4e mois. Il permet de parler de votre projet de naissance, de vos attentes, de vos inquiétudes et de vos besoins d'accompagnement. Préparer une petite liste de questions peut aider.

### Et le ou la partenaire ?
Certaines séances sont ouvertes aux co-parents. N'hésitez pas à le demander.

### Choisir sa maternité
Vérifiez les services proposés et le niveau de maternité adapté à votre santé. Si vous habitez à plus de 45 minutes d'une maternité, un dispositif peut prendre en charge un hébergement et des transports : renseignez-vous auprès de l'Assurance Maladie.

Il n'y a pas de « bonne » façon de vivre une naissance : la préparation vous aide à faire vos propres choix, en lien avec l'équipe.`,
    journeys: ['pregnant'],
    category: 'accouchement',
    tags: ['préparation à la naissance', 'entretien prénatal précoce', 'sage-femme', 'projet de naissance'],
    min_week: 12, max_week: 41,
    sources: [S.ameliPreparation, S.ameliProgramme],
    status: 'to_review',
  },
  {
    slug: 'humeur-pendant-la-grossesse',
    title: 'Humeur et émotions pendant la grossesse',
    summary: 'Joie, doutes et inquiétudes se mêlent souvent ; quand l’anxiété ou la tristesse s’installent, il est important d’en parler.',
    body_md: `La grossesse bouleverse le corps et la vie. Il est fréquent de ressentir à la fois de la joie, des doutes, des peurs ou des pleurs. Ces émotions ne font pas de vous une moins bonne future mère.

### Ce qui est fréquent
- Des variations d'humeur liées aux changements physiques et hormonaux.
- Des inquiétudes sur l'accouchement, la santé du bébé ou le fait de devenir parent.
- Des émotions parfois plus intenses après un parcours pour concevoir.

### Les signes qui méritent d'en parler
- Une anxiété permanente ou devenue difficile à supporter, des crises d'angoisse, un besoin constant d'être rassurée.
- Une grande tristesse, des pleurs sans raison, un sentiment d'inutilité.
- Une perte d'intérêt pour ce que vous aimiez, un manque d'énergie, des difficultés à prendre soin de vous.
- Des troubles du sommeil ou de l'appétit.

Selon l'Assurance Maladie, la dépression concerne environ une femme enceinte sur dix. Elle peut apparaître à tout moment et elle se soigne.

### À qui en parler
- Votre sage-femme ou votre médecin, à chaque consultation ou en dehors.
- L'entretien prénatal précoce, prévu dès le 4e mois.
- Un psychologue : le dispositif « Mon soutien psy » permet des séances prises en charge.
- Allô Parents Bébé : **0 800 00 34 56** (gratuit, en semaine).

### En cas de détresse
Si vous avez des pensées de vous faire du mal ou de ne plus être là, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, appelez le **15** ou le **112**.

Vous n'avez pas à traverser cela seule.`,
    journeys: ['pregnant'],
    category: 'sante-mentale',
    tags: ['humeur', 'anxiété', 'dépression', 'santé mentale', '3114'],
    safety_critical: true,
    sources: [S.ameliPsy, S.ameliAidePsy],
    status: 'to_review',
  },

  // ── Série sexualité pendant la grossesse ──
  {
    slug: 'rapports-pendant-la-grossesse-faq',
    title: 'Les rapports sont-ils possibles pendant la grossesse ?',
    summary: 'Le plus souvent oui, sauf avis médical contraire : certaines situations amènent un professionnel à conseiller autrement.',
    body_md: `C'est l'une des questions les plus fréquentes, et elle est tout à fait légitime.

### La réponse générale
Selon Santé.fr, les rapports sexuels sont possibles pendant la grossesse, **sauf avis médical contraire**. La pénétration et l'orgasme restent possibles. Le bébé est protégé par le liquide amniotique.

### Quand un professionnel peut conseiller autrement
Dans certaines situations, votre sage-femme ou votre médecin peut vous recommander d'éviter les rapports avec pénétration, par exemple :
- placenta bas inséré ou placenta prævia ;
- poche des eaux rompue ;
- antécédents de plusieurs fausses couches ;
- saignements, en attendant d'avoir été examinée.

Ces consignes sont personnelles : si l'on vous a donné une restriction, n'hésitez pas à demander ce qu'elle couvre précisément (pénétration, orgasme, autres formes d'intimité).

### Confort
- Certaines positions peuvent devenir inconfortables. Celles qui ne compriment pas le ventre, comme sur le côté, sont souvent plus agréables.
- Une sécheresse peut gêner : un lubrifiant à base d'eau peut aider.

### Infections
La grossesse ne protège pas des infections sexuellement transmissibles. En cas de risque, le préservatif reste conseillé. Le sexe oral est à éviter si l'un de vous a un bouton de fièvre (herpès).

### Quand consulter
Saignements, douleurs inhabituelles, perte de liquide ou contractions qui se rapprochent après un rapport : contactez votre maternité ou votre sage-femme.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'rapports', 'grossesse', 'FAQ'],
    sources: [S.santeCouple, S.tommysSexe, S.nhsInformSexe],
    status: 'to_review',
  },
  {
    slug: 'sexualite-grossesse-idees-recues',
    title: 'Sexualité et grossesse : démêler les idées reçues',
    summary: 'Plusieurs croyances répandues sur la sexualité pendant la grossesse ne sont pas confirmées par les sources de santé.',
    body_md: `Beaucoup d'idées circulent sur la sexualité pendant la grossesse. Voici ce qu'en disent des sources de santé publiques.

### « Les rapports peuvent faire mal au bébé »
Le bébé est protégé dans l'utérus par le liquide amniotique. Selon les sources consultées, une activité sexuelle qui ne vous fait pas mal ne lui fait pas mal non plus. Il peut simplement sentir des mouvements.

### « Faire l'amour provoque une fausse couche »
Le service de santé écossais indique qu'il n'existe pas de preuve claire d'un lien. Seules certaines situations (par exemple plusieurs fausses couches antérieures) amènent un professionnel à conseiller de s'abstenir à certaines périodes.

### « Les rapports déclenchent l'accouchement »
Les sources consultées indiquent que les rapports ne provoquent pas d'accouchement prématuré, et qu'il n'existe pas de preuve qu'ils déclenchent le travail.

### « Si le ventre se contracte, c'est le début du travail »
En fin de grossesse, un rapport ou un orgasme peut provoquer des contractions passagères, appelées contractions de Braxton Hicks. Elles sont habituelles et ne signifient pas que le travail commence. En revanche, des contractions **douloureuses, régulières ou qui se rapprochent** doivent faire contacter la maternité.

### « Il faut avoir envie, sinon c'est que quelque chose ne va pas »
Le désir varie beaucoup d'une personne à l'autre et d'un trimestre à l'autre. Avoir moins, plus ou pas d'envie est fréquent.

### Ce qui reste vrai
- Un avis médical personnalisé prime toujours sur ces informations générales.
- Saignements, douleurs inhabituelles ou perte de liquide doivent faire consulter.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'idées reçues', 'mythes', 'contractions'],
    sources: [S.nhsInformSexe, S.tommysSexe, S.santeCouple],
    status: 'to_review',
  },
  {
    slug: 'desir-pendant-la-grossesse',
    title: 'Les changements du désir pendant la grossesse',
    summary: 'Le désir peut augmenter, diminuer ou disparaître pour un temps, chez la personne enceinte comme chez son ou sa partenaire.',
    body_md: `Pendant la grossesse, le désir change souvent. Il n'y a pas de « normal » à atteindre : chaque personne et chaque couple vit cette période différemment.

### Pourquoi le désir évolue
- Les changements hormonaux et corporels.
- La fatigue, les nausées, l'inconfort.
- Les émotions et la façon dont on perçoit son corps.
- Les inquiétudes, par exemple la peur de faire mal au bébé.

Le désir peut augmenter, diminuer ou s'arrêter pour un temps, et varier d'un trimestre à l'autre. Beaucoup de couples ont moins de rapports à mesure que la grossesse avance, mais ce n'est pas une règle.

### Et le ou la partenaire ?
Son désir peut aussi changer. Les craintes de blesser le bébé sont fréquentes chez les partenaires. Un décalage d'envies entre les deux est courant et peut créer des tensions : en parler aide.

### L'intimité ne se résume pas aux rapports
Câlins, baisers, massages, caresses, moments à deux : il existe de nombreuses façons de rester proches, sans obligation d'aller plus loin.

### Après la naissance
La sexualité continue d'évoluer après l'accouchement. Prendre son temps est normal.

### Quand en parler à un professionnel
- Si la baisse de désir vous fait souffrir ou pèse sur le couple.
- Si des douleurs apparaissent pendant les rapports.
- Si vous vous sentez triste, anxieuse ou dépassée : la santé mentale fait partie du suivi de grossesse. Votre sage-femme ou votre médecin peut vous écouter et vous orienter.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'désir', 'libido', 'couple'],
    sources: [S.tommysSexe, S.santeCouple, S.nhsInformSexe],
    status: 'to_review',
  },
  {
    slug: 'communication-couple-sexualite-grossesse',
    title: 'Parler de sexualité dans le couple pendant la grossesse',
    summary: 'Exprimer ses envies, ses limites et ses inquiétudes aide chacun à trouver sa place pendant cette période de changements.',
    body_md: `La grossesse bouscule le quotidien, les habitudes et les moments à deux. La sexualité en fait partie. En parler n'est pas toujours facile, mais cela évite bien des malentendus.

### Quelques pistes pour échanger
- Choisir un moment calme, en dehors de l'intimité, pour aborder le sujet.
- Parler en « je » : « J'ai moins envie en ce moment », « J'ai peur de te faire mal ».
- Dire ce qui est agréable, ce qui ne l'est plus, et ce qui pourrait l'être.
- Respecter le rythme de chacun : un « pas ce soir » n'est pas un rejet.
- Accepter que les envies évoluent d'une semaine à l'autre.

### Garder du lien autrement
- Partager des moments à deux, même courts.
- Rester proches physiquement sans que cela mène forcément à un rapport.
- Se dire ce que l'on ressent face aux changements, aux examens, à l'arrivée du bébé.

### La place du ou de la partenaire
Il ou elle cherche souvent sa place auprès de l'enfant à venir. Être présent aux rendez-vous quand c'est possible, partager les tâches et prendre aussi soin de sa propre santé fait partie du chemin.

### Quand les tensions s'installent
Les désaccords sont fréquents. Mais si vous vous sentez contrôlée, rabaissée, menacée ou forcée, ce n'est pas un simple conflit : vous pouvez en parler à votre sage-femme ou à votre médecin, en toute confidentialité. En cas de danger immédiat, appelez le **17** ou le **112**. Pour en parler, le **3919** (Violences Femmes Info) est gratuit, anonyme et joignable 24 h/24.

Un professionnel de santé peut aussi vous accompagner si la sexualité devient source de souffrance pour l'un de vous.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'couple', 'communication', 'partenaire'],
    sources: [S.santeCouple, S.nhsInformSexe, S.tommysSexe],
    status: 'to_review',
  },
  {
    slug: 'sexualite-grossesse-quand-demander-conseil',
    title: 'Sexualité pendant la grossesse : quand demander conseil',
    summary: 'Saignements, douleurs, perte de liquide ou contractions qui se rapprochent doivent faire contacter un professionnel, sans gêne.',
    body_md: `Parler de sexualité avec un soignant peut sembler intimidant. Pourtant, ces questions font partie du suivi : votre sage-femme ou votre médecin les entend régulièrement.

### Contactez sans attendre la maternité
- **Saignements** après un rapport, surtout au 2e ou au 3e trimestre : ils doivent être vus en urgence, même s'ils sont indolores. En attendant, évitez les rapports.
- **Perte de liquide** continue, qui peut évoquer une rupture de la poche des eaux. Dans ce cas, les rapports sont déconseillés.
- **Contractions** douloureuses, régulières ou qui se rapprochent.
- **Douleur** inhabituelle ou intense au ventre.

### Demandez conseil à votre sage-femme ou à votre médecin
- Si l'on vous a parlé de **placenta bas inséré ou de placenta prævia** : demandez ce qui est possible ou non dans votre cas.
- Si vous avez eu **plusieurs fausses couches** et vous vous demandez s'il faut éviter les rapports à certaines périodes.
- Si vous avez des **douleurs pendant les rapports**, des démangeaisons ou des pertes inhabituelles.
- Après un rapport non protégé avec une personne qui pourrait avoir une **infection sexuellement transmissible** : un dépistage et un traitement sont possibles pendant la grossesse.
- Si l'un de vous a un **bouton de fièvre** (herpès) : le sexe oral est alors à éviter.

### Pour vous aider à en parler
Vous pouvez noter vos questions avant le rendez-vous, ou commencer simplement par : « J'ai une question sur la sexualité. »

Aucune question n'est déplacée.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'signes d’alerte', 'placenta prævia', 'saignements', 'IST'],
    safety_critical: true,
    sources: [S.tommysSexe, S.santeCouple, S.sante8eMois, S.ameliSaign23, S.nhsInformSexe],
    status: 'to_review',
  },

  // ───────────────────────────── Bébé né ─────────────────────────────
  {
    slug: 'sommeil-sur-du-bebe-couchage',
    title: 'Coucher bébé en sécurité',
    summary: 'Sur le dos, dans son propre lit, sans couette ni oreiller : des gestes simples réduisent le risque de mort inattendue du nourrisson.',
    body_md: `Les recommandations de couchage visent à réduire le risque de mort inattendue du nourrisson. Le coucher sur le dos a fait fortement baisser ce risque en France.

### La position
- **Sur le dos**, à plat, pour la nuit et pour toutes les siestes.
- Ni sur le ventre, ni sur le côté.
- Pas de cale-bébé, coussin ou serviette roulée pour le maintenir.
- Quand bébé sait se retourner seul, inutile de le forcer à rester sur le dos.

### Le lit
- Un lit adapté, avec un matelas ferme, aux bonnes dimensions, sans espace sur les côtés.
- Pas de couette, couverture, oreiller, tour de lit ni grosse peluche : une **turbulette** (gigoteuse) adaptée à sa taille.
- Rien qui puisse couvrir le visage ou entourer le cou (pas de collier ni de cordelette de tétine).
- Ne pas ajouter de matelas dans un lit parapluie.

### La chambre
- Entre **18 et 20 °C**, aérée chaque jour.
- Pas trop de couches de vêtements : la nuque ne doit pas être moite.
- **Aucune fumée** de tabac autour du bébé.
- Pas d'huiles essentielles, pas d'animal dans la chambre.

### Où dort bébé ?
- Dans **son propre lit**, dans la chambre des parents, idéalement jusqu'à environ 6 mois.
- Le partage du lit parental est déconseillé.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**
- Si vous êtes très fatigué(e) ou sous un médicament qui rend somnolent, recouchez bébé dans son lit avant de vous endormir.

### Si vous êtes épuisé(e)
Ne donnez jamais de médicament pour dormir à un bébé et ne le secouez jamais. Parlez de votre fatigue à votre médecin, à votre sage-femme ou à la PMI.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['sommeil sûr', 'couchage', 'mort inattendue du nourrisson', 'turbulette'],
    min_age_months: 0, max_age_months: 24,
    safety_critical: true,
    sources: [S.ameliCoucher, S.mpediaCoucher],
    status: 'to_review',
  },
  {
    slug: 'pleurs-du-nourrisson-et-bebe-secoue',
    title: 'Les pleurs du nourrisson, et quand on est à bout',
    summary: 'Les pleurs sont le langage du bébé et peuvent être intenses les premières semaines ; si vous êtes à bout, posez-le en sécurité et faites une pause.',
    body_md: `Tous les bébés pleurent, parfois beaucoup. Ce n'est pas le signe que vous faites mal : c'est leur principal moyen de communiquer.

### Ce qui est fréquent
- En moyenne, un bébé pleure environ deux heures par jour au total.
- Les « pleurs du soir » apparaissent souvent après les premières semaines, sont plus intenses vers 6 à 8 semaines, puis s'atténuent vers la fin du troisième mois.

### Ce qui peut apaiser
- Vérifier les besoins : faim, couche, chaleur ou froid, vêtements trop serrés.
- Le prendre dans les bras, le bercer, lui parler doucement, le porter, le mettre au sein.
- Réduire la lumière et le bruit, faire une promenade.
- S'il pleure en dormant, attendre un peu : il s'agit parfois d'un sommeil agité.

### Si vous êtes à bout
C'est humain, et cela arrive à beaucoup de parents.
1. **Posez bébé sur le dos dans son lit**, en sécurité.
2. Quittez la pièce et fermez la porte quelques minutes.
3. Respirez, buvez un verre d'eau, appelez un proche.
4. Demandez à quelqu'un de prendre le relais.

**Ne secouez jamais un bébé**, même quelques secondes : cela peut provoquer des lésions graves, voire mortelles.

Si vous sentez que vous pourriez perdre le contrôle, appelez le **119** (24 h/24) ou Allô Parents Bébé au **0 800 00 34 56** (en semaine).

### Quand consulter
- Pleurs inhabituels, très prolongés, ou bébé geignard, mou, qui semble souffrir.
- Bébé qui refuse de boire, vomit, a de la fièvre.

### Urgence
Si un bébé a été secoué ou présente somnolence inhabituelle, convulsions, difficultés à respirer : appelez le **15** ou le **112**.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['pleurs', 'bébé secoué', 'épuisement', 'apaiser'],
    min_age_months: 0, max_age_months: 12,
    safety_critical: true,
    sources: [S.ameliSecoue, S.santePleurs, S.mpediaPleurs],
    status: 'to_review',
  },
  {
    slug: 'allaitement-debuter',
    title: 'Allaitement : bien démarrer',
    summary: 'Peau à peau, tétées à la demande et repérage des signes d’éveil aident les premiers jours ; un professionnel peut évaluer les tétées.',
    body_md: `Démarrer un allaitement prend du temps et s'apprend, pour le bébé comme pour vous. Les débuts peuvent être hésitants : c'est fréquent.

### Juste après la naissance
- Les deux premières heures sont un moment où les réflexes du bébé sont très présents.
- En **peau à peau**, beaucoup de bébés trouvent le sein d'eux-mêmes, parfois après un long moment.
- Un environnement calme aide.

### Les premières semaines
- Les tétées se font **à la demande**, en moyenne 8 à 12 par 24 heures au démarrage.
- Les nouveau-nés dorment beaucoup : repérez les **signes d'éveil** (paupières qui bougent, mains vers la bouche, mouvements de langue, petite agitation) pour proposer le sein avant les pleurs.
- Proposez les deux seins à chaque tétée.
- La durée varie beaucoup ; ce qui compte, c'est que bébé avale régulièrement.
- Les tétées de nuit aident souvent à entretenir la lactation.

### Les pleurs ne veulent pas toujours dire « faim »
Bébé peut aussi avoir besoin de réconfort, d'être porté ou de dormir.

### Le repère principal
Selon Santé.fr, le signe le plus significatif d'un allaitement efficace est une **bonne prise de poids** du bébé, suivie par un professionnel.

### Quand demander de l'aide
- Tétées très courtes (moins de 5 minutes) ou très longues (plus de 30 à 45 minutes) de façon répétée.
- Allaitement douloureux, ou inquiétude sur la prise de poids.

Votre sage-femme, la maternité, la PMI ou votre médecin peuvent observer une tétée et vous conseiller. Et si vous choisissez de ne pas allaiter, ou d'arrêter, c'est votre décision : vous pouvez aussi être accompagnée dans ce choix.`,
    journeys: ['newborn'],
    category: 'alimentation',
    tags: ['allaitement', 'tétées', 'peau à peau', 'lactation'],
    min_age_months: 0, max_age_months: 6,
    sources: [S.santeRythmeTetees, S.santePremiereTetee],
    status: 'to_review',
  },
  {
    slug: 'biberons-preparation-hygiene',
    title: 'Biberons : préparation et hygiène',
    summary: 'Une dose rase pour 30 ml d’eau, un biberon préparé juste avant et jamais réchauffé au micro-ondes.',
    body_md: `Bien préparer un biberon limite le risque d'infection et assure un lait correctement dosé.

### Avant de commencer
- Lavez-vous les mains au savon et séchez-les avec un linge propre.
- Utilisez un biberon propre et sec.

### L'eau
- **Eau du robinet froide** possible : laissez couler quelques secondes (1 à 2 minutes si le robinet n'a pas servi depuis plusieurs heures).
- Pas d'eau filtrée en carafe, adoucie ou gazeuse.
- Eau en bouteille : faiblement minéralisée, avec la mention « convient pour la préparation des aliments des nourrissons ». Une bouteille ouverte se garde au réfrigérateur et se consomme dans les 24 heures.
- Logement construit avant 1948 : vérifiez auprès de la mairie l'absence de risque lié au plomb.

### Le dosage
- **Une mesurette rase de poudre pour 30 ml d'eau**, sans tasser.
- Utilisez la mesurette de la boîte, gardez-la sèche, jetez-la avec la boîte.
- Les quantités dépendent de l'âge et de l'appétit : demandez conseil à votre médecin ou à la PMI.

### Conservation
- Idéalement, préparez le biberon juste avant la tétée.
- À température ambiante : à donner dans l'heure.
- Réchauffé : à donner dans la demi-heure.
- **Ne gardez jamais un biberon entamé** pour la tétée suivante.
- En sortie, transportez l'eau et la poudre séparément.

### Réchauffer
Le lait peut être donné à température ambiante. S'il faut le réchauffer : bain-marie ou chauffe-biberon, **jamais au micro-ondes** (risque de brûlure). Testez quelques gouttes sur l'intérieur du poignet.

### Nettoyage
Rincez, puis lavez à l'eau chaude avec du liquide vaisselle et un goupillon. La stérilisation n'est pas nécessaire. Séchez à l'air libre, démonté, tête en bas.`,
    journeys: ['newborn'],
    category: 'alimentation',
    tags: ['biberon', 'lait infantile', 'hygiène', 'préparation'],
    min_age_months: 0, max_age_months: 12,
    sources: [S.ameliBiberon, S.ansesBiberon],
    status: 'to_review',
  },
  {
    slug: 'fievre-nourrisson-quand-consulter',
    title: 'Fièvre du nourrisson : quand consulter ?',
    summary: 'Avant 3 mois, toute fièvre impose une consultation en urgence ; à tout âge, c’est surtout l’état général du bébé qui compte.',
    body_md: `La fièvre est fréquente chez les bébés et souvent liée à une infection virale bénigne. Mais chez les tout-petits, elle doit toujours être prise au sérieux.

### Qu'appelle-t-on fièvre ?
On parle de fièvre à partir de **38 °C**, mesurée de préférence par voie rectale chez les moins de 2 à 3 ans.

### Avant 3 mois : consultez en urgence
Tout nourrisson de **moins de 3 mois** qui a de la fièvre doit être vu en urgence par un médecin, le jour même, même s'il semble aller bien.

### À tout âge : appelez le 15 ou consultez en urgence si
- difficultés à respirer : respiration rapide ou irrégulière, pauses, battements des ailes du nez, creux entre les côtes ;
- bébé somnolent, mou, qui réagit peu, cris faibles ou geignements ;
- refus de boire, signes de déshydratation ;
- peau marbrée, pâleur marquée, ou petites taches rouges qui ne s'effacent pas quand on appuie dessus ;
- vomissements répétés, raideur de la nuque ;
- fièvre au-dessus de 40 °C ;
- convulsions ;
- tout comportement qui vous paraît inhabituel ou inquiétant.

### Consultez dans la journée si
- la fièvre dure plus de 2 jours avant 2 ans ;
- elle revient après plus de 24 heures sans fièvre ;
- votre enfant a une maladie chronique ;
- un autre symptôme vous inquiète.

### En attendant
- Ne le couvrez pas trop, chambre à 18-20 °C.
- Proposez-lui souvent à boire.
- Pas de bain froid.
- Pour les médicaments contre la fièvre, suivez l'avis du médecin ou du pharmacien.

C'est l'état général de votre bébé qui compte plus que le chiffre du thermomètre. Vous le connaissez : en cas de doute, consultez.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['fièvre', 'urgence', 'nourrisson', 'quand consulter'],
    min_age_months: 0, max_age_months: 12,
    safety_critical: true,
    sources: [S.ameliFievre, S.mpediaFievre],
    status: 'to_review',
  },
  {
    slug: 'mere-apres-la-naissance',
    title: 'Prendre soin de vous après la naissance',
    summary: 'Récupération, fatigue, émotions et suivi : les semaines après l’accouchement comptent aussi pour la mère.',
    body_md: `Après la naissance, toute l'attention se porte souvent sur le bébé. Votre corps et votre moral ont pourtant besoin de temps et de soins.

### La récupération
- L'utérus met environ deux mois à reprendre sa taille ; des contractions (tranchées) sont normales au début.
- La fatigue est fréquente : grossesse, accouchement, nuits hachées. Faites de petites siestes quand bébé dort et acceptez l'aide proposée.
- Ne faites pas de régime si vous allaitez, et pas avant 3 mois sinon. Buvez régulièrement.

### Le suivi prévu
- Une sage-femme peut venir à domicile jusqu'au 12e jour du bébé, avec deux séances supplémentaires possibles ensuite.
- **Entretien postnatal précoce** entre la 4e et la 8e semaine, pour parler de votre ressenti.
- **Consultation postnatale** entre la 6e et la 8e semaine : examen, allaitement, contraception, et rééducation du périnée si besoin.
- La reprise du sport se fait progressivement, après avis médical.

### Les émotions
Le baby blues (larmes, irritabilité, hypersensibilité) est fréquent les premiers jours et passe en général vite. Parlez-en si la tristesse, l'anxiété ou l'épuisement durent, s'aggravent, ou si vous vous sentez détachée de votre bébé.

### Consultez sans attendre si
- saignements très abondants : c'est une urgence, appelez le **15** ;
- fièvre, saignements anormaux, pertes malodorantes ;
- douleur ou gêne dans le bas du ventre ;
- fuites urinaires ou gêne au niveau du périnée (à signaler, une rééducation est possible).

### En cas de détresse
Pensées de vous faire du mal : appelez le **3114** (24 h/24, gratuit). Confusion, propos incohérents, impression de perdre le contact avec la réalité, ou pensées de faire du mal à votre bébé : appelez le **15** ou le **112**. Ces pensées ne sont pas honteuses : elles signalent qu'il faut de l'aide, maintenant.`,
    journeys: ['newborn'],
    category: 'post-partum',
    tags: ['post-partum', 'récupération', 'baby blues', 'consultation postnatale', 'périnée'],
    min_age_months: 0, max_age_months: 3,
    safety_critical: true,
    sources: [S.santeSuiviPost, S.ameliRetourMaison, S.ameliAidePsy],
    status: 'to_review',
  },
  {
    slug: 'nuits-avec-un-nouveau-ne',
    title: 'Les nuits avec un nouveau-né',
    summary: 'Avant 4 à 6 mois, se réveiller toutes les 2 à 4 heures fait partie du développement normal du bébé.',
    body_md: `Les nuits avec un nouveau-né sont souvent courtes et hachées. Ce n'est ni un échec ni le signe d'une mauvaise habitude : c'est la façon dont dort un très jeune bébé.

### Comment dort un nouveau-né
- Il dort en moyenne 16 à 17 heures par 24 heures, réparties en périodes de 3 à 4 heures, sans faire de différence entre le jour et la nuit au début.
- Son rythme est réglé par la maturation de son cerveau, pas seulement par la faim.
- **Avant 4 à 6 mois, se réveiller après 2 à 4 heures de sommeil est normal.**
- En moyenne, les nuits s'allongent entre 4 et 6 mois, mais chaque bébé a son propre rythme, et certains prennent plus de temps.

### Aider bébé à distinguer le jour et la nuit
- Le jour : lumière naturelle, bruits habituels, moments d'éveil partagés.
- La nuit : peu de lumière, voix basse, gestes calmes, recoucher rapidement.

### Pendant les premiers mois
- Suivez son rythme et prenez-le dans vos bras s'il pleure.
- Inutile de réveiller un nouveau-né qui dort, sauf consigne médicale.
- Un plus gros biberon le soir ne prolonge pas le sommeil.

### En sécurité, même à 3 heures du matin
- Recouchez toujours bébé sur le dos, dans son propre lit.
- Si vous sentez que vous allez vous endormir en le nourrissant, reposez-le d'abord dans son lit.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**

### Pour vous
Se relayer, faire des siestes et accepter de l'aide est précieux. Si vous êtes épuisé(e), parlez-en à votre sage-femme, votre médecin ou la PMI.`,
    journeys: ['newborn'],
    category: 'sommeil',
    tags: ['nuits', 'réveils', 'rythme veille-sommeil', 'nouveau-né'],
    min_age_months: 0, max_age_months: 6,
    sources: [S.santeVeilleSommeil, S.santeSommeilNormal, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'peau-a-peau-et-portage',
    title: 'Peau à peau et portage',
    summary: 'Le peau à peau et le portage répondent au besoin de proximité du bébé, à condition de garder son visage visible et ses voies respiratoires libres.',
    body_md: `Être tout contre vous rappelle au bébé la chaleur et les sensations de la vie avant la naissance. Peau à peau et portage sont deux façons de répondre à ce besoin de proximité.

### Le peau à peau
Bébé, en couche ou nu, est posé contre la peau de sa mère ou de son autre parent, couvert d'un linge chaud.
- Il peut aider à apaiser les pleurs et à réguler la température du bébé.
- Il facilite souvent la première tétée.
- Le co-parent peut aussi le pratiquer, par exemple pendant que la mère se remet d'une césarienne.

Pour la sécurité : la tête du bébé est tournée sur le côté, le nez et la bouche bien dégagés. Restez éveillé(e) pendant le peau à peau et, si vous sentez le sommeil venir, recouchez bébé dans son lit, sur le dos.

### Le portage
Il peut apaiser bébé et libérer vos mains. Quelques règles de sécurité :
- bébé en position verticale, contre votre poitrine, assez haut pour pouvoir le surveiller ;
- **visage toujours visible**, jamais couvert par un tissu ou un vêtement ;
- tête et pieds dégagés, voies respiratoires libres ;
- dos arrondi, genoux repliés vers le ventre ;
- une main sous ses fesses pendant l'installation.

mpedia déconseille le portage face au monde. Une écharpe convient jusqu'à environ 10 à 12 kg ; ensuite, un porte-bébé adapté prend le relais.

### Restez attentif(ve)
Surveillez sa couleur, sa respiration et sa température. Un atelier de portage avec une sage-femme ou à la PMI peut vous aider à bien vous installer.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['peau à peau', 'portage', 'écharpe', 'lien'],
    min_age_months: 0, max_age_months: 12,
    sources: [S.mpediaPeau, S.mpediaEcharpe, S.santePremiereTetee, S.ameliCoucher],
    status: 'to_review',
  },

  // ───────────────────────────── Enfant ─────────────────────────────
  {
    slug: 'sommeil-enfant-1-6-ans',
    title: 'Le sommeil de l’enfant de 1 à 6 ans',
    summary: 'Les besoins de sommeil diminuent progressivement ; un rituel calme et des horaires réguliers aident l’enfant à s’endormir.',
    body_md: `Entre 1 et 6 ans, le sommeil de l'enfant change beaucoup. Les repères ci-dessous sont des moyennes : chaque enfant a ses propres besoins.

### Combien d'heures ?
- Vers 1 an : environ 13 à 14 heures par 24 heures.
- Vers 3 ans : environ 12 à 13 heures, avec une sieste en début d'après-midi.
- Vers 6 ans : environ 12 heures.
- La sieste du matin disparaît souvent vers 18 mois ; celle de l'après-midi diminue vers 3 ans et s'arrête souvent vers 4 ans, selon les besoins.

### Les réveils
Se réveiller brièvement entre deux cycles de sommeil est normal. La difficulté vient surtout du fait de ne pas réussir à se rendormir seul. Des étapes de vie (marche, nouveau mode de garde, déménagement, arrivée d'un bébé) peuvent perturber les nuits pour un temps.

### Ce qui peut aider
- Des horaires de coucher et de lever réguliers.
- Un rituel calme et toujours dans le même ordre : bain, pyjama, histoire, câlin.
- Un doudou ou un objet rassurant.
- Une chambre sombre, avec une petite veilleuse si besoin.
- **Pas d'écran** dans la chambre, et arrêt des écrans 1 à 2 heures avant le coucher.
- Coucher l'enfant encore éveillé, pour qu'il apprenne à s'endormir dans son lit.

### Cauchemars et terreurs nocturnes
- Cauchemar : l'enfant se réveille, effrayé. Rassurez-le.
- Terreur nocturne : en début de nuit, il crie ou s'agite sans être vraiment réveillé. Restez près de lui sans le réveiller.

### Quand en parler
Il n'existe pas de médicament du sommeil adapté aux jeunes enfants. Si les difficultés durent, si l'enfant semble très fatigué ou irritable dans la journée, ou s'il semble mal respirer en dormant, parlez-en à votre médecin ou pédiatre.`,
    journeys: ['child'],
    category: 'sommeil',
    tags: ['sommeil', 'sieste', 'rituel du coucher', 'cauchemars'],
    min_age_months: 12, max_age_months: 72,
    sources: [S.ameliSommeilEnfant, S.mpediaTroublesSommeil, S.santeSommeilNormal],
    status: 'to_review',
  },
  {
    slug: 'ecrans-et-jeunes-enfants',
    title: 'Les écrans et les jeunes enfants',
    summary: 'Pas d’écran avant 3 ans, puis un usage court et accompagné : des repères pour adapter les écrans à l’âge.',
    body_md: `Les écrans font partie du quotidien de toute la famille. Les recommandations ne visent pas à culpabiliser, mais à protéger le développement des tout-petits.

### Avant 3 ans
- Les recommandations officielles sont claires : **pas d'écran**. Certaines sociétés savantes conseillent même d'attendre 6 ans.
- Même une exposition courte peut avoir des effets sur le langage, l'attention, le sommeil ou la motricité fine.
- Exception : les appels vidéo avec des proches éloignés.
- Depuis juillet 2025, les écrans sont interdits pour les enfants dans les lieux d'accueil de la petite enfance.
- Pour calmer un bébé qui pleure, privilégiez un câlin, le calme, une musique douce, une promenade.

### De 3 à 6 ans
- Des temps courts, au maximum 30 à 40 minutes par jour, avec des programmes adaptés.
- Regarder **avec** l'enfant plutôt que le laisser seul, et en parler ensemble.
- Pas d'écran allumé en fond sonore.
- Pas de tablette personnelle à cet âge.

### Au quotidien, pour toute la famille
- Pas d'écran pendant les repas.
- Pas de télévision dans la chambre de l'enfant.
- Arrêt des écrans 1 à 2 heures avant le coucher.
- Éviter l'écran comme récompense ou comme moyen d'apaiser.
- Les adultes donnent l'exemple : des règles communes aident.

### Des alternatives simples
Livres, jeux, feutres, cuisine ensemble, sorties au parc : ce sont les échanges avec vous qui nourrissent le plus son développement.

Si vous avez des questions sur le langage, l'attention ou le sommeil de votre enfant, parlez-en à votre médecin ou à la PMI.`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['écrans', 'développement', 'tablette', 'télévision'],
    min_age_months: 0, max_age_months: 72,
    sources: [S.ameliEcrans],
    status: 'to_review',
  },
  {
    slug: 'dents-et-brossage-enfant',
    title: 'Les dents de l’enfant : brossage et habitudes',
    summary: 'Deux brossages par jour avec la bonne quantité de dentifrice fluoré, de l’eau comme boisson et un dentiste chaque année.',
    body_md: `Prendre soin des dents de lait est important : elles servent à manger, à parler et préparent l'arrivée des dents définitives.

### Le brossage
- **Deux fois par jour**, matin et soir, pendant environ 2 minutes.
- Une brosse à dents souple, adaptée à l'âge, changée environ tous les trois mois.
- Pour les plus jeunes, l'aide d'un adulte est souvent utile.

### La bonne quantité de dentifrice fluoré
D'après l'Assurance Maladie :
- jusqu'à 3 ans : **une trace** ;
- de 3 à 6 ans : **un petit pois** ;
- après 6 ans : environ un tiers de la brosse.

La quantité de fluor est indiquée sur le tube. En cas de doute sur le dentifrice adapté, demandez à votre dentiste ou pharmacien.

### Les habitudes qui protègent
- **De l'eau** comme boisson, pendant et entre les repas.
- Trois à quatre prises alimentaires par jour, plutôt que du grignotage.
- Limiter les boissons et aliments sucrés.
- Proposer des aliments croquants.
- Éviter d'endormir l'enfant avec un biberon de lait ou de boisson sucrée.

### Le dentiste
- Une visite **une fois par an**, même sans problème visible.
- De 3 à 24 ans, des examens de prévention sont pris en charge dans le cadre du programme « M'T dents tous les ans ».

### Quand consulter plus tôt
Tache brune ou noire sur une dent, douleur, gencive gonflée, ou dent abîmée après une chute : prenez rendez-vous avec un dentiste.

Faire du brossage un moment de jeu ou de chanson peut aider les enfants réticents.`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['dents', 'brossage', 'fluor', 'M’T dents'],
    min_age_months: 6, max_age_months: 72,
    sources: [S.ameliDents, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'coleres-du-jeune-enfant',
    title: 'Les colères du jeune enfant',
    summary: 'Les colères font partie du développement, surtout vers 2 ans ; l’enfant a besoin d’un adulte calme pour apprendre à gérer ses émotions.',
    body_md: `Les colères sont fréquentes chez les jeunes enfants. Elles ne signifient pas que vous vous y prenez mal : l'enfant découvre ses émotions avant d'avoir les mots pour les exprimer.

### Ce qui est habituel selon l'âge
- **Avant 2 ans** : l'enfant peut taper ou mordre, faute de langage pour dire ce qu'il veut.
- **Vers 2 ans** : c'est la période du « non ». L'enfant affirme son autonomie et supporte mal la frustration.
- **Après 3 ans** : l'agressivité physique diminue en général et devient plus verbale.

### Pendant la colère
- Assurez sa sécurité et celle des autres.
- Restez aussi calme que possible : votre calme l'aide à se calmer.
- Dites clairement et fermement ce qui n'est pas acceptable (« Je ne te laisse pas taper »), sans crier ni menacer.
- Mettez des mots sur son émotion : « Tu es très en colère parce que... ».

### Après la tempête
- Un câlin ou un moment calme pour se retrouver.
- Félicitez les progrès, même petits : un enfant souvent repris a aussi besoin d'être valorisé.

### Pour prévenir
- Des règles simples, les mêmes pour tous.
- Des moments calmes partagés, des activités pour se dépenser.
- Montrer l'exemple : rester posé lors d'un désaccord.

### Prendre soin de vous
Si vous sentez la colère monter, vous pouvez vous éloigner quelques instants en laissant l'enfant en sécurité. Demander un relais n'est pas un échec.

### Quand consulter
Si les colères sont très fréquentes, très intenses, si l'enfant n'arrive pas à se calmer ou semble en souffrance, parlez-en à votre médecin, à la PMI ou à un psychologue.`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['colères', 'émotions', 'opposition', 'éducation'],
    min_age_months: 12, max_age_months: 72,
    sources: [S.santeAgressivite],
    status: 'to_review',
  },
  {
    slug: 'proprete-sans-pression',
    title: 'La propreté, sans pression',
    summary: 'Il n’existe pas d’âge précis pour devenir propre ; l’enfant y arrive à son rythme, quand il est prêt.',
    body_md: `Devenir propre est une étape qui dépend de la maturité de l'enfant, pas de la volonté des parents. Il n'existe pas d'âge précis : chaque enfant avance à son rythme.

### Des repères
- L'apprentissage se fait souvent entre 18 et 24 mois, parfois plus tard.
- Il peut prendre de quelques jours à plusieurs mois.
- La propreté de jour vient en général avant celle de la nuit. La nuit ne s'apprend pas : elle vient avec la maturation.

### Les signes que votre enfant est peut-être prêt
- Il marche bien, monte les escaliers, s'accroupit.
- Il s'intéresse au pot ou aux toilettes, dit « pipi » ou « caca », veut enlever sa couche.

### Comment l'accompagner
- Proposez le pot **sans forcer**, à des moments clés : après les repas, avant la sieste ou le coucher, quelques minutes seulement.
- Un endroit fixe (toilettes ou salle de bain) aide à se repérer.
- Des vêtements faciles à enlever simplifient les choses.
- Encouragez et félicitez ; des livres sur le sujet peuvent l'intéresser.
- Les selles peuvent impressionner : ne pas insister évite que l'enfant se retienne.

### Les accidents
Ils font partie de l'apprentissage. Évitez de gronder. Si l'enfant refuse, faites une pause de quelques semaines avant de réessayer.

### Quand en parler à un professionnel
- Aucun progrès vers 3 ans malgré vos encouragements.
- Fuites fréquentes dans la culotte vers 4 à 5 ans.
- Toute situation qui vous inquiète.

Votre médecin ou la PMI pourra vous conseiller.`,
    journeys: ['child'],
    category: 'enfant',
    tags: ['propreté', 'pot', 'apprentissage', 'autonomie'],
    min_age_months: 15, max_age_months: 72,
    sources: [S.mpediaProprete],
    status: 'to_review',
  },
  {
    slug: 'alimentation-enfant-sans-pression',
    title: 'Quand votre enfant refuse de manger',
    summary: 'Vers 2 ans, dire « non » à table est fréquent et passager ; forcer ou négocier tend à transformer le repas en conflit.',
    body_md: `Vers 2 ans, beaucoup d'enfants refusent des aliments, y compris certains qu'ils aimaient avant, en particulier les légumes. C'est une étape habituelle de l'affirmation de soi, en général passagère.

### Ce qui aide
- **Ne pas forcer** : insister fait souvent du repas un moment de tension.
- Proposer une très petite quantité à goûter, sans obliger à finir.
- Reproposer un aliment refusé quelques semaines ou quelques mois plus tard, sous une autre forme.
- **Manger ensemble**, et montrer que vous aimez aussi ces aliments.
- Associer légumes et féculents dans un même plat.
- Rendre l'alimentation ludique : faire les courses ensemble, cuisiner, cultiver des herbes aromatiques.

### Ce qui est déconseillé
- Le chantage affectif (« Encore une cuillère pour me faire plaisir »).
- Utiliser la nourriture comme récompense ou punition.
- Compenser un repas refusé par un dessert ou un goûter plus copieux.

### Avec les autres adultes
Harmoniser les habitudes avec les personnes qui gardent votre enfant aide à garder un cadre cohérent.

### Garder confiance
L'appétit d'un jeune enfant varie d'un repas à l'autre et d'un jour à l'autre. Ce qui compte, c'est l'équilibre sur plusieurs jours et une croissance régulière, suivie lors des consultations.

### Quand en parler à un professionnel
- Si vous êtes inquiet(e) pour sa croissance ou sa santé.
- S'il accepte très peu d'aliments différents ou si les repas deviennent une source de stress importante pour la famille.
Votre médecin ou la PMI peut vérifier sa courbe de croissance et vous conseiller.`,
    journeys: ['child'],
    category: 'alimentation',
    tags: ['alimentation', 'refus alimentaire', 'repas', 'opposition'],
    min_age_months: 12, max_age_months: 72,
    sources: [S.mbOpposition],
    status: 'to_review',
  },

  // ───────────────────────────── Sommeil des parents ─────────────────────────────
  {
    slug: 'fatigue-des-parents',
    title: 'La fatigue des parents : normale, mais pas à porter seul',
    summary: 'Les nuits hachées des premiers mois épuisent ; la fatigue est fréquente et passagère, et mérite d’être prise au sérieux.',
    body_md: `Avec un bébé, le sommeil change du tout au tout. Se sentir épuisé est extrêmement fréquent, et ne dit rien de vos capacités de parent.

### D'où vient cette fatigue
- Pour la mère, la grossesse et l'accouchement s'ajoutent aux réveils nocturnes.
- Pour les deux parents : nuits fractionnées, nouvelles responsabilités, parfois d'autres enfants et le travail.

### Une phase qui évolue
Les réveils nocturnes fréquents sont une étape temporaire : les bébés dorment par périodes plus longues en grandissant, à un rythme qui varie selon chaque enfant.

### Ce qui peut alléger
- Dormir ou se reposer quand bébé dort, quand c'est possible.
- Accepter l'aide de vos proches : préparer un repas, garder bébé le temps d'une sieste, s'occuper des courses.
- Répartir les tâches de nuit et de jour entre les adultes.
- Sortir marcher un peu chaque jour avec bébé : une activité douce peut réduire la sensation de fatigue.
- Baisser vos exigences : la maison peut attendre.

### En sécurité
Quand on est très fatigué, le risque de s'endormir avec bébé dans les bras augmente. **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil**, et recouchez-le dans son lit si vous sentez le sommeil venir.

### Quand en parler
Si vous êtes à bout, si vous n'arrivez plus à dormir même quand bébé dort, ou si vous vous sentez triste ou sans espoir, parlez-en à votre médecin, à votre sage-femme ou à la PMI. Des solutions existent.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['fatigue', 'parents', 'nuits', 'aide'],
    sources: [S.nhsFatigueParents, S.ameliRetourMaison, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'se-relayer-la-nuit',
    title: 'Se relayer la nuit',
    summary: 'Partager les réveils nocturnes, même autrement que par le biberon, permet à chacun de récupérer des plages de sommeil.',
    body_md: `Quand les nuits sont courtes, s'organiser à deux (ou avec un proche) peut tout changer. Il n'y a pas d'organisation idéale : la meilleure est celle qui vous convient.

### Quelques façons de se répartir
- **Par plages horaires** : l'un gère le début de nuit, l'autre la fin, pour que chacun ait un bloc de sommeil plus long.
- **Par nuits** : une nuit sur deux, quand c'est possible, l'un dort avec des bouchons d'oreilles dans une autre pièce.
- **Avec un allaitement** : le ou la partenaire peut changer la couche, apporter bébé, le recoucher ou s'occuper des soins du matin pour que la mère se rendorme. Une fois l'allaitement bien installé, un biberon de lait maternel tiré peut parfois être donné par l'autre parent.
- **Avec des biberons** : les tétées peuvent être partagées.

### Si vous êtes seul(e)
Demandez à un proche de venir quelques jours, ou de garder bébé le temps d'une sieste. La PMI peut aussi vous orienter vers des aides.

### Pendant votre tour
- Lumière tamisée, voix basse, gestes calmes : cela aide bébé à se rendormir.
- Recouchez toujours bébé sur le dos, dans son propre lit.
- Si vous êtes sous un médicament qui rend somnolent ou très épuisé, ne gardez pas bébé dans votre lit.

### En parler
Un relais qui ne fonctionne plus, une fatigue mal partagée : c'est fréquent. En parler calmement, hors de la nuit, permet souvent d'ajuster.

Si la fatigue devient trop lourde, n'hésitez pas à consulter votre médecin.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['nuits', 'relais', 'couple', 'organisation'],
    sources: [S.nhsFatigueParents, S.ameliCoucher, S.santeVeilleSommeil],
    status: 'to_review',
  },
  {
    slug: 'siestes-des-parents',
    title: 'Les siestes des parents',
    summary: 'Une sieste courte, prise quand bébé dort, aide à récupérer ; quelques précautions la rendent plus reposante et plus sûre.',
    body_md: `Dormir la nuit d'une traite n'est pas toujours possible avec un bébé. Les siestes permettent de rattraper un peu de sommeil.

### Quand faire la sieste
- **Quand bébé dort** : c'est le conseil le plus simple, même si la tentation de « faire autre chose » est grande.
- Si vous avez peur de ne pas vous réveiller, mettez une alarme.
- Demandez à un proche de garder bébé pour une sieste plus longue de temps en temps.

### Une sieste courte peut suffire
L'Assurance Maladie cite des siestes courtes, de 5 à 20 minutes, en début d'après-midi, comme une aide contre la fatigue. Après une nuit très hachée, une sieste plus longue peut être nécessaire : écoutez vos besoins.

### Pour mieux se reposer
- Une pièce calme, peu lumineuse.
- Éviter la caféine en fin de journée si elle vous empêche ensuite de dormir.
- Laisser le téléphone de côté.
- Ne pas culpabiliser de dormir en journée : c'est une façon de prendre soin de votre famille.

### En sécurité avec bébé
- Avant de vous allonger, couchez bébé sur le dos dans son lit.
- **Ne faites jamais la sieste avec bébé sur un canapé ou dans un fauteuil.**
- Ne gardez pas bébé dans votre lit si vous êtes très fatigué(e) ou sous un médicament qui rend somnolent.

### Quand en parler
Si vous n'arrivez pas à dormir même quand bébé dort, ou si la fatigue persiste malgré le repos, parlez-en à votre médecin.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['sieste', 'fatigue', 'récupération', 'sécurité'],
    sources: [S.ameliAsthenie, S.ameliRetourMaison, S.nhsFatigueParents, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'fatigue-parent-quand-consulter',
    title: 'Quand la fatigue doit faire consulter',
    summary: 'Une fatigue qui ne passe pas avec le repos, l’impossibilité de dormir ou une tristesse persistante méritent d’en parler à un professionnel.',
    body_md: `Être fatigué avec un jeune enfant est fréquent. Mais certaines fatigues ne sont pas « juste » de la fatigue, et méritent d'être entendues.

### Parlez-en à votre médecin si
- La fatigue persiste plusieurs semaines malgré le repos.
- Elle vous empêche de faire vos activités habituelles.
- Vous n'arrivez pas à dormir, même quand bébé dort.
- Elle s'accompagne d'autres signes : fièvre, perte ou prise de poids non voulue, douleurs, règles très abondantes, soif importante.

### Quand le moral est touché
- Tristesse, perte d'intérêt pour ce que vous aimiez, sentiment de désespoir pendant plus de deux semaines.
- Anxiété permanente, irritabilité, sentiment d'être dépassé(e).
- Un baby blues qui s'intensifie ou dure plus de deux semaines.

Ces signes peuvent évoquer une dépression du post-partum, qui peut toucher les mères comme les pères, et qui se soigne.

### L'épuisement parental
Il associe souvent trois signes : une fatigue extrême que le repos ne soulage plus, une impression de s'occuper des enfants « en pilote automatique », et une perte de plaisir à être parent. Ce n'est pas un manque d'amour. Votre médecin, la PMI ou un psychologue peuvent vous aider, et des relais existent (proches, co-parent, aide à domicile via la CAF).

### Sans attendre
- Pensées de vous faire du mal ou de ne plus être là : appelez le **3114** (24 h/24, gratuit).
- Agitation intense, absence totale de sommeil, propos confus ou impression de perdre le contact avec la réalité après une naissance : appelez le **15**.
- Si vous sentez que vous pourriez faire du mal à votre enfant : mettez-le en sécurité et appelez le **119**.

Demander de l'aide, c'est prendre soin de toute la famille.`,
    journeys: ['parents_sleep'],
    category: 'sante-mentale',
    tags: ['fatigue', 'épuisement parental', 'dépression post-partum', '3114', 'quand consulter'],
    safety_critical: true,
    sources: [S.ameliAsthenie, S.nhsFatigueParents, S.santeSanteMentaleParents, S.santeBurnout, S.ameliSecoue],
    status: 'to_review',
  },
  // ---------------------------------------------------------------- ajouts du 23 octobre 2026
  {
    slug: 'regurgitations-et-reflux-du-nourrisson',
    title: 'Régurgitations et reflux du nourrisson',
    summary: 'Les régurgitations sont fréquentes les premiers mois et diminuent souvent avec l’âge ; quelques gestes simples aident, et certains signes doivent faire consulter.',
    body_md: `Beaucoup de bébés rejettent un peu de lait après la tétée ou le biberon. Ces régurgitations sont souvent bien supportées et diminuent en général quand l’enfant tient assis puis debout et mange plus solide.

### Les gestes qui peuvent aider
- Laisser bébé manger à sa faim, sans le forcer ni le restreindre ; des repas un peu moins copieux et plus fréquents.
- Au biberon : vérifier le dosage de la poudre et la préparation.
- Allaitement : le poursuivre sans changer ses habitudes.
- Faire des pauses pour le rot et garder bébé droit 20 à 30 minutes après le repas.
- Pour dormir : toujours à plat sur le dos, sans surélever la tête du lit.

### À éviter
- Épaissir soi-même le lait maternel, ajouter des céréales au lait sans avis médical.
- Le laisser longtemps dans un transat ou un siège-auto juste après le repas.
- Commencer un médicament sans avis : d’après l’Assurance Maladie, certains médicaments contre l’acidité n’ont aucun effet sur les régurgitations.
- Si un lait épaissi est envisagé, en parler au pharmacien ou au médecin.

### Quand consulter son médecin
- Régurgitations qui apparaissent après 6 mois ou durent après 1 an.
- Régurgitations douloureuses, avec pleurs ou traces de sang, ou abondantes (surtout avant 2 mois).
- Bébé qui refuse de manger, ne prend plus de poids, dort mal ou se tortille pendant les repas.

### Appelez le 15 sans attendre si
- Pendant une régurgitation, bébé devient bleu ou très pâle, perd son tonus ou a du mal à respirer.
- Un bébé de moins de 6 semaines vomit en jet après chaque repas.
- Il vomit un liquide vert.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['reflux', 'RGO', 'régurgitations', 'biberon', 'allaitement'],
    min_age_months: 0, max_age_months: 18,
    safety_critical: true,
    sources: [S.ameliRegurgitations, S.ameliRgoTraitement],
    status: 'to_review',
  },
  {
    slug: 'constipation-bebe-et-enfant',
    title: 'Constipation du bébé et de l’enfant',
    summary: 'De l’eau, des fibres adaptées à l’âge, du mouvement et des toilettes sans pression aident souvent ; jamais de laxatif ni de thermomètre sans avis.',
    body_md: `La constipation est fréquente chez l’enfant, notamment au moment de la diversification ou de l’apprentissage de la propreté.

### Selon l’âge
- **Bébé au biberon** : respecter exactement le dosage de la poudre (un lait trop concentré favorise la constipation) ; proposer de l’eau, surtout en cas de chaleur ou de fièvre.
- **Massage** : masser doucement le ventre et faire « pédaler » les jambes plusieurs fois par jour.
- **Diversification** : les fruits et légumes peuvent aider ; demandez conseil au médecin ou au pédiatre.
- **Après 1 an** : au moins trois portions de fruits ou légumes par jour, des céréales complètes, et bouger chaque jour.
- **Après 3 ans** : de l’eau, des fibres (pain complet, légumineuses, pruneaux), des repas à heures régulières.

### Aux toilettes
Ne pas forcer l’apprentissage de la propreté ; proposer les toilettes après les repas, laisser le temps, et un petit banc sous les pieds si ses pieds ne touchent pas le sol.

### À ne jamais faire
- Utiliser un thermomètre pour « déclencher » les selles.
- Donner un laxatif sans avis médical.
- Supprimer les produits laitiers sans en parler au médecin.

### Quand consulter
- Dans les jours qui viennent : constipation qui dure malgré ces mesures, douleur ou sang en allant à la selle, fuites de selles, prise de poids insuffisante.
- Dans la journée : sang dans les selles, fièvre, vomissements, perte d’appétit ou de poids.
- **Appelez le 15 ou le 112** : douleurs de ventre intenses, vomissements qui ne s’arrêtent pas, ventre gonflé, tendu et douloureux.`,
    journeys: ['newborn', 'child'],
    category: 'enfant',
    tags: ['constipation', 'selles', 'propreté', 'fibres'],
    min_age_months: 0, max_age_months: 120,
    safety_critical: true,
    sources: [S.ameliConstipationEnfant],
    status: 'to_review',
  },
  {
    slug: 'peau-de-bebe-et-fesses-rouges',
    title: 'Peau de bébé : toilette et fesses rouges',
    summary: 'Des changes fréquents, de l’eau et un nettoyant sans savon, un séchage doux et de l’air suffisent souvent ; certains signes demandent un avis médical.',
    body_md: `La peau des nourrissons est fine et fragile. Les fesses rouges (érythème fessier) sont fréquentes et disparaissent souvent en quelques jours avec de bons gestes.

### Au quotidien
- Se laver les mains avant et après chaque change.
- Changer souvent (au moins six fois par jour et après chaque selle), sans serrer la couche.
- Nettoyer avec de l’eau et un nettoyant sans savon, rincer, puis sécher en tamponnant, sans frotter, en insistant sur les plis.
- Pour une petite fille : toujours de l’avant vers l’arrière.
- Laisser la peau à l’air quand c’est possible.
- Une crème réparatrice (au zinc ou au cuivre) peut être appliquée ; demandez conseil au pharmacien.

### À éviter
- Les lingettes, produits parfumés ou à l’alcool sur une peau irritée.
- Le talc : il retient l’humidité et peut être inhalé.
- Les vêtements trop serrés qui frottent.

### Quand demander un avis médical
- Fesses rouges dans les six premières semaines de vie.
- Fièvre, perte de poids ou bébé qui mange moins.
- Rougeur qui persiste ou s’étend après trois jours de soins.
- Croûtes, cloques, boutons de pus, suintement.
- Plaques blanches dans la bouche.`,
    journeys: ['newborn'],
    category: 'bebe',
    tags: ['peau', 'érythème fessier', 'toilette', 'change', 'soins'],
    min_age_months: 0, max_age_months: 36,
    sources: [S.ameliFessesRouges, S.ameliToiletteBebe],
    status: 'to_review',
  },
  {
    slug: 'accouchement-voie-basse-deroulement',
    title: 'L’accouchement par voie basse, étape par étape',
    summary: 'Début du travail, dilatation, naissance et délivrance : ce qui se passe le plus souvent, les moyens de soulager la douleur et pourquoi une césarienne peut être décidée.',
    body_md: `Chaque accouchement est différent. Voici les grandes étapes décrites par l’Assurance Maladie, pour savoir à quoi s’attendre et pouvoir poser vos questions à l’équipe.

### Quand partir à la maternité
Le travail commence le plus souvent par des contractions de plus en plus intenses et régulières, parfois après la rupture de la poche des eaux. **Si la poche des eaux se rompt, rendez-vous à la maternité, même sans contractions fortes.** Votre sage-femme vous indique quand partir selon votre situation.

### Les trois étapes
1. **La dilatation du col** : souvent plusieurs heures (environ 8 heures pour un premier bébé, moins ensuite). Le cœur du bébé est surveillé. Pour la douleur : la péridurale, et aussi des moyens sans médicament (bain, massages, relaxation, mouvement).
2. **La naissance (expulsion)** : une fois le col complètement ouvert, souvent environ 30 minutes. Le bébé peut être posé en peau à peau.
3. **La délivrance** : le placenta sort, généralement dans l’heure qui suit ; un médicament est proposé pour limiter le risque de saignement.

### Ce que l’équipe peut proposer
Un médicament pour relancer les contractions, une aide instrumentale (ventouse, forceps, spatules) ou, plus rarement, une épisiotomie. Vous pouvez exprimer vos préférences à l’avance et demander pourquoi un geste est proposé.

### Et la césarienne ?
Elle peut être programmée (position du bébé, grossesse à risque…) ou décidée pendant le travail si la naissance par voie basse devient difficile ou si le bébé montre des signes de souffrance. Le peau à peau reste possible dans la plupart des cas.

Le jour J, l’équipe s’adapte à vous et à votre bébé : ces repères ne remplacent pas ses explications.`,
    journeys: ['pregnant'],
    category: 'accouchement',
    tags: ['accouchement', 'voie basse', 'travail', 'péridurale', 'césarienne'],
    min_week: 28, max_week: 42,
    sources: [S.ameliAccouchement, S.hasAccouchementNormal],
    status: 'to_review',
  },
  {
    slug: 'arrivee-d-un-nouvel-enfant-et-l-aine',
    title: 'Un nouveau bébé arrive : l’aîné et l’organisation de la famille',
    summary: 'L’aîné peut se sentir jaloux ou régresser un temps ; le rassurer, lui garder des moments à lui et réorganiser la maison ensemble aident toute la famille.',
    body_md: `L’arrivée d’un bébé change la vie de toute la famille. Il faut du temps pour trouver un nouvel équilibre.

### Pour l’aîné
- Il peut se sentir inquiet, jaloux ou mis de côté, et faire à nouveau « comme un bébé » pendant un temps. Mieux vaut l’accueillir sans le gronder.
- Avant la naissance : lui expliquer qui s’occupera de lui pendant le séjour à la maternité et comment se passeront les journées.
- Le rassurer sur votre amour, lui raconter sa propre naissance, lui montrer qu’il garde sa place.
- Prévoir un moment particulier pour la première rencontre, et le laisser aider s’il en a envie, sans l’y obliger.
- Demander aux grands-parents et aux proches de s’intéresser aussi à lui.

### Pour l’organisation
- Accepter de mettre certaines choses en pause et de fixer des priorités.
- En parler à deux régulièrement : qui fait quoi, qui se repose quand.
- Garder un peu de temps pour soi, même court.
- Dans Toi & Moi, les tâches du foyer, l’agenda partagé et les relais de nuit peuvent aider à répartir la charge.

### Et l’entourage
Les grands-parents et la famille trouvent aussi leur nouvelle place. Écouter les conseils, mais faire confiance à vos propres choix de parents.

Si vous vous sentez dépassé(e), parlez-en à votre médecin, à votre sage-femme ou à la PMI.`,
    journeys: ['pregnant', 'newborn', 'child'],
    category: 'enfant',
    tags: ['aîné', 'fratrie', 'jalousie', 'organisation familiale', 'naissance'],
    sources: [S.santeVieFamille],
    status: 'to_review',
  },
  {
    slug: 'regles-douloureuses-quand-consulter',
    title: 'Règles douloureuses : ce qui peut soulager et quand consulter',
    summary: 'Les douleurs pendant les règles sont fréquentes ; chaleur, repos et mouvement doux aident souvent, et des douleurs qui changent ou empêchent de vivre normalement méritent un avis.',
    body_md: `Une femme sur deux a mal au ventre ou au dos pendant ses règles. Ces douleurs ne sont pas une fatalité : elles méritent d’être soulagées, et parfois explorées.

### Ce qui peut parfois aider
- Une bouillotte sur le ventre ou un bain chaud.
- Du repos et du sommeil avant et pendant les règles.
- Un peu de mouvement ou un sport doux.
- Limiter alcool, café et tabac pendant cette période.
- Pour un médicament contre la douleur, demandez conseil à votre pharmacien ou à votre médecin : certains médicaments sont déconseillés (par exemple l’aspirine, qui fluidifie le sang) et tous ne conviennent pas à chacune.

### Quand en parler à un professionnel
- Des douleurs inhabituelles pour vous, ou qui apparaissent après des années de règles peu douloureuses.
- Des règles qui deviennent difficiles à supporter, qui vous font manquer l’école ou le travail.
- Des douleurs qui ne passent pas avec les mesures habituelles.

Des règles très douloureuses peuvent être liées à une endométriose : un professionnel peut faire le point avec vous. Le suivi du cycle dans Toi & Moi permet de noter vos douleurs pour en parler plus facilement.

**En cas de douleur brutale et intense, de fièvre ou de malaise, appelez le 15.**`,
    journeys: ['avoid', 'ttc'],
    category: 'cycle',
    tags: ['règles douloureuses', 'dysménorrhée', 'endométriose', 'cycle', 'symptômes'],
    safety_critical: true,
    sources: [S.santeReglesDouloureuses, S.santeEndometrioseRegles],
    status: 'to_review',
  },
];
