/** Bibliothèque d'articles par parcours : brouillons rédigés par une IA à partir de sources consultées, statut « À vérifier ». */
export type ArticleJourney = 'ttc' | 'avoid' | 'pregnant' | 'newborn' | 'child' | 'parents_sleep';
export interface ArticleSource { label: string; url: string; consulted_on: string; published?: string }
export interface LibArticle {
  slug: string;              // kebab-case, unique, ascii
  title: string;
  summary: string;           // one sentence
  body_md: string;
  journeys: ArticleJourney[];
  category: 'grossesse' | 'accouchement' | 'post-partum' | 'sante-mentale' | 'bebe' | 'alimentation' | 'enfant' | 'cycle' | 'reeducation' | 'sexualite' | 'sommeil' | 'neurodeveloppement'
    // Guide complet (27/10/2026) : catégories fines par parcours
    | 'fertilite' | 'preparer-grossesse' | 'difficultes-conception'
    | 'suivi-grossesse' | 'alimentation-grossesse' | 'corps-grossesse' | 'sante-grossesse' | 'quotidien-grossesse' | 'droits-demarches'
    | 'alimentation-bebe' | 'sante-bebe' | 'developpement' | 'securite'
    | 'sante-enfant' | 'education' | 'ecole-garde' | 'maladies-chroniques'
    | 'activites-eveil' | 'sport' | 'materiel' | 'vie-pratique' | 'premiers-secours'
    // Règles, cycle et santé intime (27/10/2026)
    | 'regles' | 'cycle-ages' | 'sante-intime' | 'contraception';
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
  // Ajout du 27 octobre 2026
  santeActiviteGrossesse: { label: 'Santé.fr (Manger Bouger) — Idées d’activités et de mouvements à faire pendant la grossesse', url: 'https://www.sante.fr/activite-physique-pendant-la-grossesse', consulted_on: '2026-10-27', published: '2023-05-09' },
} satisfies Record<string, ArticleSource>;

export const LIBRARY_SOURCES: Record<keyof typeof S, ArticleSource> = S;

export const LIBRARY_ARTICLES: LibArticle[] = [
  // ───────────────────────────── Projet bébé ─────────────────────────────
  {
    slug: 'comprendre-fenetre-fertile',
    title: 'Comprendre la fenêtre fertile',
    summary: 'La fenêtre fertile regroupe les quelques jours où un rapport peut aboutir à une grossesse : on peut l’estimer, jamais la prédire avec certitude.',
    body_md: `Beaucoup de calendriers et d'applications affichent une « période fertile ». Ce sont des estimations utiles pour mieux connaître son cycle, mais pas des certitudes. Comprendre comment elle se calcule aide à l'utiliser sans se mettre de pression.

## En bref
- La fenêtre fertile correspond aux quelques jours qui précèdent l'ovulation, et au jour de l'ovulation lui-même.
- Les spermatozoïdes peuvent survivre jusqu'à 5 jours : des rapports avant l'ovulation peuvent donc aboutir à une grossesse.
- L'ovulation peut se décaler d'un cycle à l'autre, même quand les cycles sont habituellement réguliers.
- Des rapports réguliers, deux à trois fois par semaine, évitent d'avoir à viser un jour précis.
- Même chez un couple fertile, il est fréquent qu'une grossesse demande plusieurs mois.

## Comprendre
### Le cycle en quelques mots
Un cycle commence le premier jour des règles et se termine la veille des règles suivantes. Au cours de chaque cycle, un ovocyte est libéré par un ovaire : c'est l'**ovulation**. Dans le cycle « type » de 28 jours décrit dans les manuels, elle a lieu vers le 14e jour. Mais ce repère ne vaut pas pour tout le monde : beaucoup de cycles sont plus courts ou plus longs, et la date de l'ovulation varie avec eux.

### Pourquoi la fenêtre dure plusieurs jours
L'ovocyte ne vit que peu de temps après l'ovulation. En revanche, les spermatozoïdes peuvent survivre **jusqu'à 5 jours** dans les voies génitales féminines. Un rapport qui a lieu quelques jours avant l'ovulation peut donc aboutir à une fécondation. C'est ce qui explique que la « fenêtre » s'étende sur plusieurs jours, et qu'elle soit plus large avant l'ovulation qu'après.

### Pourquoi on ne peut que l'estimer
L'ovulation n'a pas toujours lieu au même moment. Le stress, la fatigue, un sommeil perturbé, une maladie ou un voyage peuvent la décaler. Un calendrier se base sur vos cycles passés : il ne peut pas deviner un décalage à venir. C'est pourquoi l'application affiche une **estimation**.

## Au quotidien
### Les signes que certaines personnes observent
- **La glaire cervicale** : autour de l'ovulation, elle devient souvent plus abondante, transparente, fluide et filante, un peu comme du blanc d'œuf cru.
- **La température du matin** : elle s'élève légèrement (de 0,2 à 0,5 °C) après l'ovulation. Elle confirme donc l'ovulation après coup, sans permettre de la prévoir.
- **Les tests d'ovulation** : ils détectent une hausse d'hormone qui précède l'ovulation (voir l'article dédié).

Ces observations demandent de la régularité et un peu d'apprentissage. Elles peuvent aider à se repérer, mais ne sont pas indispensables.

### Une approche simple
Plutôt que de viser un jour précis, les sources de l'Assurance Maladie décrivent des **rapports réguliers, de l'ordre de deux à trois fois par semaine**, tout au long du cycle. Cette approche couvre naturellement la fenêtre fertile, même si l'ovulation se décale, et peut éviter que la vie intime devienne un « programme ».

### Prendre soin de soi pendant le projet
Une consultation préconceptionnelle avec un médecin ou une sage-femme permet de faire le point sur votre santé, vos traitements et vos vaccinations, et de parler de la vitamine B9.

## Questions fréquentes
**Mes cycles durent 32 jours : quand ai-je ovulé ?**
L'ovulation a lieu en général environ deux semaines avant les règles suivantes, plutôt qu'à une date fixe après le début du cycle. Avec des cycles longs, elle est donc souvent plus tardive que le « 14e jour ». Votre calendrier en tient compte, sous forme d'estimation.

**Une application peut-elle me dire le « bon jour » ?**
Non, elle propose une estimation à partir de vos cycles passés. Elle aide à se repérer, mais ne remplace pas des rapports réguliers.

**Combien de temps faut-il en général pour concevoir ?**
Même chez un couple fertile de 25 ans, la probabilité de grossesse est d'environ 25 % par cycle. Il est donc fréquent que cela prenne plusieurs mois.

**Le stress peut-il jouer ?**
Le stress et la fatigue peuvent décaler l'ovulation. Ce n'est pas une raison de culpabiliser : prendre soin de soi et de son sommeil fait partie du projet.

## Quand demander conseil
- Si vos cycles sont très irréguliers, absents, ou très douloureux.
- Si vous avez une maladie chronique ou un traitement au long cours.
- Si la grossesse se fait attendre : après 12 mois d'essais, ou environ 6 mois si la femme a plus de 35 ans.
- En cas de douleur intense du bas-ventre, de malaise ou de saignement abondant, appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin ou d'une sage-femme.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['ovulation', 'cycle', 'fertilité', 'conception'],
    sources: [S.qsNaturelles, S.ameliNaturelles, S.ameliSterilite, S.santeConditions],
    status: 'to_review',
  },
  {
    slug: 'acide-folique-avant-conception',
    title: 'Acide folique (vitamine B9) : dès le projet de grossesse',
    summary: 'La vitamine B9 aide à la bonne formation du système nerveux de l’embryon : elle se prévoit dès le projet de grossesse, sur prescription.',
    body_md: `La vitamine B9, aussi appelée acide folique ou folates, joue un rôle important dans le développement du fœtus, notamment dans la fermeture du tube neural, qui deviendra le cerveau et la moelle épinière. C'est l'un des rares points pour lesquels il est utile d'agir **avant** même d'être enceinte.

## En bref
- Le tube neural se forme dans les toutes premières semaines, souvent avant que l'on sache être enceinte.
- Les sources officielles conseillent d'avoir assez de vitamine B9 dès le projet de grossesse et jusqu'à la fin du troisième mois.
- La supplémentation se fait sur prescription d'un médecin ou d'une sage-femme, qui choisit le produit et la dose.
- L'alimentation apporte aussi des folates, mais ne remplace pas la supplémentation prescrite.
- Si vous n'avez pas commencé avant la grossesse, parlez-en dès que possible : il n'est pas trop tard pour en discuter.

## Comprendre
### À quoi sert la vitamine B9
Les folates participent à la fabrication des cellules et à la croissance des tissus. Au tout début de la grossesse, ils interviennent dans la fermeture du **tube neural**, la structure qui donnera le cerveau et la moelle épinière. Un apport suffisant à ce moment-là contribue à réduire le risque de certaines malformations de cette zone.

### Pourquoi y penser si tôt
Le tube neural se forme très tôt, souvent avant même un retard de règles. Attendre le test de grossesse pour commencer peut donc être un peu tard pour cette période précise. C'est pourquoi les sources officielles recommandent de commencer **dès le projet de grossesse**, puis de poursuivre jusqu'à la fin du troisième mois.

Selon l'Assurance Maladie, seules 28,3 % des femmes commençaient la supplémentation avant la grossesse en 2021. Si ce n'est pas votre cas, ce n'est pas une faute : parlez-en simplement à votre professionnel dès que possible.

### Pourquoi sur prescription
La dose peut varier selon les situations (antécédents, certains traitements, état de santé). C'est donc le médecin ou la sage-femme qui la choisit. Évitez de commencer de vous-même des compléments alimentaires « spécial grossesse » : certains contiennent des vitamines ou des minéraux dont un apport élevé est déconseillé.

## Au quotidien
### Dans l'assiette
Les folates se trouvent notamment dans :
- les légumes verts (épinards, salades, brocolis, asperges) ;
- certains fruits (agrumes, bananes, avocats) ;
- les légumes secs (lentilles, pois chiches, haricots) ;
- les fruits à coque non salés et les féculents complets.

Quelques idées simples : une salade verte au déjeuner, des lentilles une à deux fois par semaine, un agrume en dessert ou au goûter. L'alimentation contribue aux apports, en complément de la supplémentation.

### Ne pas oublier sa prise
- Associez la prise à un geste quotidien (brossage des dents, petit-déjeuner).
- Une alarme sur le téléphone peut aider les premières semaines.
- Si vous oubliez un jour, reprenez simplement le lendemain, sans doubler.

## Questions fréquentes
**Je suis déjà enceinte et je n'ai rien pris : que faire ?**
Parlez-en à votre médecin ou à votre sage-femme dès que possible. La supplémentation est conseillée jusqu'à la fin du troisième mois : il est utile de la commencer même en cours de route.

**Puis-je me contenter de manger plus de légumes verts ?**
L'alimentation est importante, mais les sources officielles conseillent une supplémentation en plus, pendant la période recommandée.

**Faut-il une prise de sang avant ?**
Ce n'est pas systématique. Votre professionnel jugera selon votre situation.

**Et le futur papa ?**
La vitamine B9 concerne la personne qui sera enceinte. Pour le partenaire, une alimentation variée et un mode de vie sain sont bénéfiques à la fertilité.

## Quand demander conseil
- Dès le projet de grossesse, lors d'une consultation préconceptionnelle.
- Si vous prenez un traitement au long cours (par exemple pour l'épilepsie) : n'arrêtez jamais un traitement de vous-même, parlez-en d'abord.
- Si vous avez déjà eu une grossesse concernée par une anomalie du tube neural : votre professionnel adaptera la prise en charge.

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['ttc'],
    category: 'alimentation',
    tags: ['acide folique', 'vitamine B9', 'préconception', 'supplémentation'],
    sources: [S.santeB9, S.ameliHabitudes],
    status: 'to_review',
  },
  {
    slug: 'grossesse-qui-tarde-quand-consulter',
    title: 'Quand la grossesse se fait attendre : quand consulter ?',
    summary: 'Après 12 mois d’essais (ou environ 6 mois au-delà de 35 ans), un bilan concernant les deux partenaires est conseillé ; on peut consulter plus tôt.',
    body_md: `Attendre une grossesse qui ne vient pas peut être éprouvant, mois après mois. Vous n'êtes pas seuls : en France, environ un couple sur huit consulte pour des difficultés à concevoir. Voici des repères pour savoir quand demander un bilan et à quoi s'attendre.

## En bref
- Une consultation est conseillée après 12 mois de rapports réguliers sans contraception, ou environ 6 mois si la femme a plus de 35 ans.
- Vous pouvez consulter plus tôt en cas d'inquiétude, de cycles très irréguliers ou d'antécédents particuliers.
- Le bilan concerne les deux partenaires : les causes peuvent être féminines, masculines, mixtes ou inexpliquées.
- La fertilité diminue avec l'âge, chez la femme comme chez l'homme : anticiper aide face aux délais de rendez-vous.
- Ces démarches pèsent sur le moral ; un soutien existe.

## Comprendre
### Les repères officiels
Selon l'Assurance Maladie, une consultation est conseillée :
- après **12 mois** de rapports réguliers sans contraception, sans grossesse ;
- après **environ 6 mois** si la femme a plus de 35 ans, ou s'il existe une maladie gynécologique connue ou suspectée, par exemple une endométriose.

Ces délais tiennent compte du fait que, même chez un couple fertile, la grossesse prend souvent plusieurs mois.

### Pourquoi l'âge compte
La fertilité diminue avec l'âge. D'après Santé.fr, les chances de grossesse par cycle sont d'environ **25 % entre 25 et 30 ans, 12 % à 35 ans et 6 % au-delà de 40 ans**. Chez l'homme aussi, la qualité du sperme évolue avec les années. Les délais de prise en charge pouvant être longs, il est utile de ne pas trop attendre pour prendre un premier rendez-vous.

### Des causes variées
Les difficultés à concevoir peuvent venir de la femme, de l'homme, des deux, ou rester inexpliquées malgré les examens. C'est pourquoi le bilan concerne **les deux partenaires** dès le départ. Le mode de vie (tabac, alcool, poids, sommeil) peut aussi jouer.

## Au quotidien
### Préparer le premier rendez-vous
Vous pouvez consulter votre médecin traitant, un ou une gynécologue ou une sage-femme. Pour gagner du temps, notez :
- la durée habituelle de vos cycles et leur régularité (votre calendrier peut aider) ;
- depuis quand vous essayez et la fréquence des rapports ;
- vos antécédents (opérations, infections, maladies, traitements) des deux côtés ;
- vos questions, pour ne pas les oublier le jour J.

### Ce qui se passe ensuite
- Le médecin fait le point sur les cycles, les antécédents, le mode de vie et la vie sexuelle.
- Il peut prescrire des **examens** : prises de sang à certains jours du cycle, échographie pelvienne, et pour le partenaire un **spermogramme**.
- Selon les résultats, il peut orienter vers un centre spécialisé.

### Prendre soin du couple
Les rapports « programmés », l'attente des règles et les examens peuvent peser sur le moral et sur la relation. Garder des moments sans parler du projet, partager les rendez-vous et exprimer ce que chacun ressent aide souvent.

## Questions fréquentes
**Doit-on attendre un an avant de faire quoi que ce soit ?**
Non. Les délais indiquent quand un bilan est conseillé, mais vous pouvez consulter plus tôt, et une consultation préconceptionnelle est possible dès le début du projet.

**Mon partenaire doit-il venir ?**
C'est vivement conseillé : le bilan concerne les deux partenaires, et les examens de l'homme sont simples.

**Est-ce de ma faute si cela ne marche pas ?**
Non. Les causes sont souvent multiples et ne relèvent pas d'une faute. Le bilan sert justement à comprendre.

**Le bilan est-il remboursé ?**
Les consultations et examens prescrits sont pris en charge selon les règles habituelles de l'Assurance Maladie ; votre médecin vous précisera les modalités.

## Quand demander conseil
- Après 12 mois d'essais, ou environ 6 mois si la femme a plus de 35 ans.
- Plus tôt si les cycles sont absents, très irréguliers ou très douloureux, ou en cas d'antécédents connus.
- Si le moral flanche : votre médecin, votre sage-femme ou un psychologue peuvent vous accompagner. Si vous avez des idées noires, le **3114** répond 24 h/24.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin ou d'une sage-femme.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['infertilité', 'bilan', 'quand consulter', 'âge'],
    sources: [S.ameliBilan, S.santeAge, S.santeInfertilite],
    status: 'to_review',
  },
  {
    slug: 'tests-ovulation-ce-quils-indiquent',
    title: 'Tests d’ovulation : ce qu’ils indiquent, et ce qu’ils ne disent pas',
    summary: 'Les tests d’ovulation repèrent une hausse d’hormone qui précède l’ovulation : utiles pour se situer dans le cycle, ils ne disent rien de la fertilité.',
    body_md: `Les tests d'ovulation sont des autotests urinaires vendus sans ordonnance. Ils peuvent aider à se repérer dans son cycle, à condition de savoir ce qu'ils mesurent… et ce qu'ils ne mesurent pas.

## En bref
- Ils détectent la hausse d'une hormone, la LH, qui survient en général 24 à 48 heures avant l'ovulation.
- Un test positif signale que l'ovulation est probablement proche, pas qu'elle a eu lieu.
- Ils ne posent aucun diagnostic et ne renseignent pas sur la fertilité du couple.
- Des faux positifs et des faux négatifs sont possibles : la notice doit être suivie à la lettre.
- Ils sont facultatifs : des rapports réguliers restent une approche simple.

## Comprendre
### Ce que mesure le test
Au cours du cycle, le cerveau envoie un signal hormonal, la **LH** (hormone lutéinisante), qui déclenche l'ovulation. Ce « pic de LH » survient en général **24 à 48 heures avant l'ovulation**. Le test détecte cette hormone dans les urines. Quand le résultat devient positif, l'ovulation est donc probablement proche : c'est le moment où la fenêtre fertile est la plus favorable.

### Ce qu'il ne dit pas
- Selon l'ANSM, un autotest renseigne seulement sur la présence ou l'absence d'un marqueur : **il ne pose pas de diagnostic**.
- Un test positif ne prouve pas que l'ovulation a réellement eu lieu.
- Il ne dit rien de la qualité de l'ovocyte, des trompes, ni de la fertilité du partenaire.
- Certaines situations peuvent fausser la lecture, par exemple des cycles très irréguliers ou certains traitements hormonaux : demandez conseil.

### Faux positifs, faux négatifs
Comme tout autotest, ces tests peuvent se tromper. Le pic de LH peut être bref : s'il tombe entre deux tests, il peut passer inaperçu. À l'inverse, certaines situations peuvent donner un résultat positif sans ovulation imminente.

## Au quotidien
### Bien les utiliser
- **Lisez la notice** : l'heure de la journée, la durée de lecture et le nombre de jours de test varient selon les marques.
- Commencez les tests quelques jours avant la date estimée de l'ovulation (votre calendrier peut aider).
- Testez à heure régulière et évitez de boire beaucoup juste avant, pour ne pas diluer les urines.
- Choisissez des tests marqués **CE**, achetés en pharmacie ou sur le site d'une pharmacie.

### Sans pression
Ces tests rassurent certaines personnes et en stressent d'autres. Si le suivi du cycle prend trop de place, il est possible de faire une pause : des **rapports réguliers, deux à trois fois par semaine**, couvrent la fenêtre fertile sans avoir à viser un jour.

### Combiner les repères
Certaines personnes associent les tests à l'observation de la glaire cervicale ou à la courbe de température. Ces repères se complètent, mais aucun n'est indispensable.

## Questions fréquentes
**Mon test n'est jamais positif : est-ce que je n'ovule pas ?**
Pas forcément : le pic a pu être manqué, ou le moment des tests mal choisi. Si cela se répète sur plusieurs cycles, ou si vos cycles sont irréguliers, parlez-en à un professionnel.

**Un test positif, et ensuite ?**
Les jours qui suivent sont favorables à une grossesse. Inutile de concentrer tous les rapports sur un seul jour.

**Puis-je utiliser un test d'ovulation comme contraception ?**
Non : ces tests ne sont pas conçus pour éviter une grossesse.

**Les tests numériques sont-ils plus fiables ?**
Ils affichent un résultat plus facile à lire, mais mesurent le même marqueur. Le plus important reste de suivre la notice.

## Quand demander conseil
- En cas de doute sur un résultat : votre pharmacien peut vous aider.
- Si vos cycles sont très irréguliers ou absents.
- Après 12 mois d'essais sans grossesse, ou environ 6 mois si la femme a plus de 35 ans.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['test d’ovulation', 'LH', 'autotest', 'cycle'],
    sources: [S.ameliNaturelles, S.ansmAutotests, S.ameliBilan],
    status: 'to_review',
  },
  {
    slug: 'mode-de-vie-et-fertilite',
    title: 'Mode de vie et fertilité : ce qui peut aider',
    summary: 'Tabac, alcool, poids, sommeil et activité physique influencent la fertilité des deux partenaires : de petits changements, à votre rythme, peuvent aider.',
    body_md: `La fertilité dépend de nombreux facteurs, dont certains ne se contrôlent pas (l'âge, certaines maladies). D'autres, liés au mode de vie, peuvent être ajustés. L'idée n'est pas de tout changer d'un coup ni de culpabiliser, mais de mettre toutes les chances de votre côté, à deux.

## En bref
- Le tabac est l'un des principaux facteurs de baisse de fertilité, chez la femme comme chez l'homme.
- Les sources officielles conseillent d'arrêter l'alcool dès le projet de grossesse.
- Un surpoids important comme une grande maigreur peuvent réduire les chances de concevoir.
- Sommeil, activité physique et alimentation variée font partie des leviers simples.
- La consultation préconceptionnelle permet de faire le point sur vos traitements et vos vaccinations.

## Comprendre
### Pourquoi le mode de vie compte
La fabrication des ovocytes et des spermatozoïdes est sensible à l'environnement. Chez l'homme, les spermatozoïdes se renouvellent en environ trois mois : les changements de mode de vie mettent donc un peu de temps à produire leurs effets. Chez la femme, certaines habitudes peuvent perturber les cycles ou retarder la conception.

### Les principaux facteurs
- **Tabac** : chez la femme, il peut retarder la conception ; chez l'homme, il diminue la quantité et la mobilité des spermatozoïdes. Le tabagisme passif compte aussi.
- **Alcool** : il peut perturber les cycles et la qualité du sperme. Pendant la grossesse, aucune consommation n'est conseillée : arrêter dès le projet évite une exposition au tout début, avant même le test.
- **Cannabis et autres drogues** : ils ont aussi des effets sur la fertilité.
- **Poids** : un surpoids important comme une grande maigreur peuvent dérégler l'ovulation et réduire les chances de concevoir.
- **Caféine** : Santé.fr conseille de la limiter à une ou deux tasses par jour.
- **Environnement** : certains produits du quotidien (parfums d'intérieur, solvants, travaux) contiennent des substances à limiter.

## Au quotidien
### Des pas simples, à deux
- **Arrêter de fumer** : se faire aider augmente les chances de réussite. Votre médecin, votre sage-femme ou un tabacologue peuvent vous accompagner, et des substituts nicotiniques peuvent être prescrits.
- **Bouger** : une activité régulière, même la marche quotidienne, est favorable.
- **Dormir** : un sommeil réparateur compte ; Santé.fr cite au moins 8 heures par nuit comme repère.
- **Manger varié** : fruits, légumes, légumes secs, féculents complets, et peu de produits ultra-transformés.
- **Aérer** son logement chaque jour et limiter les parfums d'intérieur, bougies parfumées et huiles essentielles en diffusion.
- **Au travail** : si vous êtes exposé(e) à des produits chimiques, parlez-en au médecin du travail.

### Avancer à votre rythme
Choisissez un ou deux changements à la fois. Une rechute n'efface pas les efforts : l'important est d'aller dans la bonne direction.

## Questions fréquentes
**Faut-il arrêter complètement l'alcool dès maintenant ?**
Les sources officielles conseillent d'arrêter dès le projet de grossesse, car on ne sait pas toujours tout de suite que l'on est enceinte.

**Le café est-il interdit ?**
Non, mais il est conseillé de le limiter à une ou deux tasses par jour, en pensant aussi au thé et aux boissons caféinées.

**Mon partenaire doit-il aussi changer ses habitudes ?**
Oui, sa fertilité compte autant : tabac, alcool, poids et sommeil le concernent également.

**Faut-il suivre un régime ?**
Pas sans avis médical. Si votre poids vous préoccupe, un médecin peut proposer un accompagnement adapté, sans privation excessive.

## Quand demander conseil
- Dès le projet, pour une consultation préconceptionnelle : traitements, vaccinations, vitamine B9, habitudes de vie.
- Si vous prenez un traitement au long cours : **n'arrêtez jamais un traitement de vous-même**, parlez-en d'abord.
- Pour arrêter le tabac, l'alcool ou une drogue : votre médecin peut vous orienter vers un accompagnement.
- Après 12 mois d'essais sans grossesse, ou environ 6 mois si la femme a plus de 35 ans.
- En cas d'urgence médicale, appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin ou d'une sage-femme.`,
    journeys: ['ttc'],
    category: 'cycle',
    tags: ['mode de vie', 'tabac', 'alcool', 'fertilité', 'préconception'],
    sources: [S.santeModeVie, S.ameliHabitudes, S.ameliPreconception],
    status: 'to_review',
  },
  {
    slug: 'test-de-grossesse-quand-le-faire',
    title: 'Test de grossesse : quand le faire ?',
    summary: 'Un test fait trop tôt peut être faussement négatif : il est plus fiable avec les urines du matin, environ trois semaines après le rapport.',
    body_md: `Après un retard de règles ou un rapport, il est naturel de vouloir savoir très vite. Choisir le bon moment évite des résultats trompeurs et des jours d'attente inutiles dans l'incertitude.

## En bref
- Les tests détectent l'hormone hCG, qui apparaît environ 10 jours après la fécondation.
- Le test urinaire peut être réalisé 21 jours après un rapport non protégé, de préférence avec les urines du matin.
- Un test fait trop tôt peut être faussement négatif.
- La prise de sang, sur prescription, est plus précise.
- Un test positif est le point de départ du suivi : prenez rendez-vous avec un médecin ou une sage-femme.

## Comprendre
### L'hormone hCG
Après la fécondation, l'œuf s'implante dans l'utérus, puis commence à produire une hormone, la **hCG**. Selon l'Assurance Maladie, elle apparaît environ **10 jours après la fécondation**, puis sa quantité augmente rapidement au fil des jours. Les tests de grossesse, urinaires ou sanguins, détectent cette hormone.

### Pourquoi trop tôt n'est pas fiable
Au tout début, la quantité de hCG peut être trop faible pour être repérée par un test urinaire. Le résultat peut alors être **faussement négatif** alors qu'une grossesse débute. C'est pourquoi Santé.fr indique que le test urinaire peut être réalisé **21 jours après un rapport non protégé**.

### Urinaire ou sanguin
- Le **test urinaire** est vendu sans ordonnance. Il est fiable s'il est fait au bon moment et selon la notice.
- Le **dosage sanguin** de la hCG, prescrit par un médecin ou une sage-femme, est plus précis et peut détecter une grossesse plus tôt. Il mesure aussi la quantité d'hormone.
- Certains médicaments, une infection urinaire ou du sang dans les urines peuvent fausser un résultat.

## Au quotidien
### Faire le test dans de bonnes conditions
- Utilisez de préférence les **premières urines du matin**, plus concentrées.
- Évitez de boire beaucoup juste avant.
- Respectez le temps de lecture indiqué : un résultat lu trop tard peut être trompeur.
- Achetez si possible le test en pharmacie, vérifiez la date de péremption et le marquage CE.

### Après le résultat
- **Positif** : prenez rendez-vous avec un médecin ou une sage-femme. Il confirmera la grossesse, et la première consultation doit avoir lieu avant la fin du troisième mois. C'est aussi le moment de parler de vos traitements et de la vitamine B9.
- **Négatif, mais toujours pas de règles** : refaites un test quelques jours plus tard, et consultez si le retard persiste.
- **Résultat difficile à lire** : refaites un test, ou demandez une prise de sang.

## Questions fréquentes
**J'ai fait un test avant le retard de règles et il est négatif : suis-je rassurée ?**
Pas forcément : il a pu être fait trop tôt. Refaites-le au bon moment.

**Un trait très pâle compte-t-il ?**
Selon les tests, un trait pâle lu dans le temps indiqué peut signaler un résultat positif. En cas de doute, refaites un test ou demandez une prise de sang.

**Mes règles sont irrégulières : quand tester ?**
Basez-vous sur la date du rapport : 21 jours après un rapport non protégé.

**Le test peut-il se tromper si je prends la pilule ?**
La pilule n'empêche pas en général la lecture du test, mais certains médicaments peuvent fausser le résultat : demandez conseil à votre pharmacien.

## Quand demander conseil
- Après un test positif, pour démarrer le suivi.
- Si vos règles ne reviennent pas malgré des tests négatifs.
- **En urgence (15 ou 112)** : douleurs du bas-ventre, d'un côté ou diffuses, avec saignements, malaise ou fièvre. Ces signes ne doivent pas attendre, même si le test est négatif.
- Si vous ne souhaitiez pas de grossesse, un professionnel ou un centre de santé sexuelle peut vous informer de vos options.

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
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
    summary: 'Dans la vraie vie, l’efficacité d’une contraception dépend surtout de sa facilité d’usage : les méthodes sans geste quotidien sont les plus fiables.',
    body_md: `Il n'existe pas de contraception idéale pour tout le monde. Le bon choix dépend de votre santé, de votre vie, de vos préférences et de vos projets, et il peut évoluer avec le temps. Comprendre comment se mesure l'efficacité aide à en parler avec un professionnel.

## En bref
- On distingue l'efficacité théorique (usage parfait) et l'efficacité pratique (vie courante, avec les oublis).
- Les méthodes de longue durée, implant et stérilet, sont les plus efficaces en usage courant.
- Les méthodes qui demandent un geste régulier (pilule, préservatif) sont plus sensibles aux oublis et aux erreurs.
- Seuls les préservatifs protègent contre les infections sexuellement transmissibles (IST).
- Changer de méthode est toujours possible si celle que vous utilisez ne vous convient plus.

## Comprendre
### Deux chiffres à connaître
- **Efficacité théorique** : ce que donne la méthode quand elle est utilisée parfaitement, à chaque fois.
- **Efficacité pratique** : ce qui se passe dans la vie courante, avec les oublis, les retards, les erreurs d'utilisation.

Plus l'écart entre les deux est grand, plus la méthode demande de la régularité. C'est souvent l'efficacité pratique qui compte le plus pour choisir.

### Pourcentage de grossesses sur un an en usage courant
D'après le tableau publié par l'Assurance Maladie :
- implant : 0,05 % ;
- stérilet (DIU) hormonal : 0,2 % ; DIU au cuivre : 0,8 % ;
- pilule (combinée ou progestative) : 8 % ;
- préservatif masculin : 15 % ;
- méthodes naturelles : environ 20 % ;
- spermicides seuls : 29 %.

Les méthodes de longue durée ont un écart très faible entre théorie et pratique, car elles ne dépendent pas d'un geste quotidien.

### Les grandes familles
- **Hormonales** : pilule, patch, anneau vaginal, implant, injection, stérilet hormonal. Elles agissent notamment en bloquant l'ovulation ou en modifiant la glaire cervicale, selon les méthodes.
- **Non hormonales** : stérilet au cuivre, préservatifs (masculin et féminin), diaphragme et cape.
- **Méthodes naturelles** : observation du cycle, retrait. Elles sont parmi les moins fiables.
- **Définitives** : stérilisation, chez la femme ou chez l'homme, après un temps de réflexion.

## Au quotidien
### Les questions à se poser
- Ai-je du mal à penser à un geste chaque jour ?
- Ai-je des contre-indications (tabac, antécédents, migraines, traitements) ? Votre professionnel les vérifiera.
- Est-ce que je souhaite une méthode sans hormones ?
- Ai-je un projet de grossesse dans les mois qui viennent ?
- Ai-je besoin aussi d'une protection contre les IST ?

### Combiner les protections
Les préservatifs peuvent être associés à une autre contraception : on parle de « double protection », utile notamment avec un nouveau partenaire.

### Et en cas d'oubli ou d'accident
Si un oubli ou un incident (préservatif qui glisse ou se déchire) survient, la contraception d'urgence est d'autant plus efficace qu'elle est prise tôt. Votre pharmacien peut vous conseiller sans rendez-vous.

## Questions fréquentes
**Le stérilet est-il réservé aux femmes qui ont eu des enfants ?**
Non, il peut être proposé à toutes, après avis médical.

**La pilule fait-elle grossir ?**
Les effets varient d'une personne à l'autre. Si une méthode vous gêne, parlez-en : d'autres options existent.

**Les applications de cycle sont-elles une contraception ?**
Utilisées seules, elles sont peu fiables, car l'ovulation peut se décaler (voir l'article dédié).

**Qui peut prescrire une contraception ?**
Votre médecin traitant, un ou une gynécologue, une sage-femme, ou un centre de santé sexuelle.

## Quand demander conseil
- Pour choisir ou changer de méthode : votre médecin, une sage-femme ou un centre de santé sexuelle (accueil confidentiel).
- Le numéro **0 800 08 11 11** (gratuit et anonyme) répond aux questions sur la contraception et la sexualité.
- Après un rapport non protégé : la contraception d'urgence, sans ordonnance en pharmacie.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception', 'efficacité', 'implant', 'stérilet', 'pilule', 'préservatif'],
    sources: [S.ameliEfficacite, S.ameliHormonale, S.santeRapportRisque],
    status: 'to_review',
  },
  {
    slug: 'calendrier-pas-une-contraception-fiable',
    title: 'Pourquoi un calendrier seul n’est pas une contraception fiable',
    summary: 'Aucun jour du cycle ne peut être garanti sans possibilité de grossesse : l’ovulation peut se décaler et les spermatozoïdes survivent plusieurs jours.',
    body_md: `Les applications et calendriers de cycle peuvent aider à connaître son corps, à anticiper ses règles ou à noter ses symptômes. Mais utilisés seuls pour éviter une grossesse, ils sont parmi les méthodes les moins fiables. Voici pourquoi, et quelles alternatives existent.

## En bref
- L'ovulation peut se décaler d'un cycle à l'autre, même quand les cycles sont habituellement réguliers.
- Les spermatozoïdes peuvent survivre jusqu'à 5 jours : un rapport plusieurs jours avant l'ovulation peut aboutir à une grossesse.
- La méthode du calendrier a un taux d'échec de 15 à 25 % sur un an, selon Santé publique France.
- Aucune application ne peut garantir un jour « sans grossesse possible ».
- Des méthodes sans hormones plus fiables existent : un professionnel peut vous aider à choisir.

## Comprendre
### Pourquoi ce n'est pas fiable
- **L'ovulation varie** : elle n'a pas toujours lieu au même moment, même chez une personne aux cycles habituellement réguliers. Le stress, la fatigue ou un sommeil perturbé peuvent la décaler.
- **Les spermatozoïdes survivent** jusqu'à 5 jours dans les voies génitales féminines. Un rapport plusieurs jours avant l'ovulation peut donc aboutir à une grossesse.
- Un calendrier se base sur les cycles passés : il ne peut pas prévoir un décalage.

C'est pourquoi **aucun jour du cycle ne peut être présenté comme sans possibilité de grossesse**.

### Quelques chiffres
- Selon QuestionSexualité (Santé publique France), la méthode du calendrier a un taux d'échec de 15 à 25 % sur un an.
- L'Assurance Maladie estime à environ 20 % l'échec des méthodes naturelles en usage courant, contre moins de 1 % pour un stérilet ou un implant.
- Les méthodes naturelles sont déconseillées en cas de cycles irréguliers et ne protègent pas des IST.

### Et les autres méthodes d'observation ?
Certaines méthodes combinent plusieurs signes : glaire cervicale, température du matin, calcul des jours. Elles demandent une formation, un long apprentissage et une grande rigueur au quotidien, et restent moins efficaces que les méthodes médicales. Le retrait, lui aussi, est peu fiable.

## Au quotidien
### Utiliser son calendrier autrement
Votre calendrier reste utile pour :
- anticiper l'arrivée des règles ;
- repérer des cycles qui changent, des douleurs ou des saignements inhabituels ;
- préparer une consultation avec des informations précises ;
- penser à sa contraception (rappel de pilule, renouvellement).

### Si vous souhaitez une méthode sans hormones
D'autres options existent, comme le **stérilet au cuivre**, très efficace et de longue durée, ou les **préservatifs**, qui protègent aussi des IST. Un médecin, une sage-femme ou un centre de santé sexuelle peut vous aider à choisir ce qui vous convient.

### Après un rapport à risque
Si vous ne souhaitez pas de grossesse, la **contraception d'urgence** est d'autant plus efficace qu'elle est prise tôt. Elle est disponible en pharmacie sans ordonnance, et votre pharmacien peut vous conseiller sans rendez-vous.

## Questions fréquentes
**Mes cycles sont très réguliers : le calendrier suffit-il ?**
Même avec des cycles réguliers, l'ovulation peut se décaler un mois donné (stress, fatigue, maladie, voyage). Le calendrier ne peut pas le prévoir.

**Pendant les règles, peut-on tomber enceinte ?**
C'est moins probable, mais pas impossible, surtout avec des cycles courts : les spermatozoïdes peuvent survivre jusqu'à l'ovulation suivante.

**Mon application indique « jours non fertiles » : puis-je m'y fier ?**
Ce sont des estimations. Elles ne remplacent pas une contraception.

**Puis-je combiner calendrier et préservatif ?**
Utiliser un préservatif à chaque rapport protège, quel que soit le jour. Le calendrier seul ne suffit pas.

## Quand demander conseil
- Pour choisir une contraception adaptée, avec ou sans hormones : médecin, sage-femme, centre de santé sexuelle, ou le **0 800 08 11 11** (gratuit et anonyme).
- Après un rapport non protégé : pharmacie, sans ordonnance, le plus tôt possible.
- Retard de règles après un rapport à risque : faites un test de grossesse.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['contraception', 'calendrier', 'méthodes naturelles', 'application de cycle'],
    sources: [S.qsNaturelles, S.ameliNaturelles, S.ameliEfficacite],
    status: 'to_review',
  },
  {
    slug: 'oubli-de-pilule-que-faire',
    title: 'Oubli de pilule : que faire ?',
    summary: 'Ce qu’il faut faire dépend du type de pilule, de la durée de l’oubli et des rapports récents ; votre pharmacien peut vous aider à tout moment.',
    body_md: `Oublier un comprimé arrive à beaucoup de personnes. L'important est de savoir quoi faire rapidement, sans paniquer, et de ne pas hésiter à demander conseil.

## En bref
- Les délais diffèrent selon le type de pilule : la notice de votre pilule fait foi.
- Oubli court : prenez le comprimé tout de suite, puis continuez à l'heure habituelle.
- Oubli plus long : prenez le dernier comprimé oublié, protégez-vous 7 jours, et pensez à la contraception d'urgence en cas de rapport récent.
- Plusieurs oublis ou un doute : demandez conseil rapidement à votre pharmacien ou à votre médecin.
- Si les oublis sont fréquents, une autre méthode peut être plus adaptée.

## Comprendre
### Pourquoi un oubli compte
La pilule agit grâce à une prise régulière d'hormones. Un oubli fait baisser leur quantité dans le corps : selon la durée et le moment dans la plaquette, la protection peut être diminuée. C'est pourquoi la conduite à tenir dépend de votre pilule et du nombre d'heures écoulées.

### Vérifiez d'abord votre type de pilule
Les délais diffèrent selon la pilule. D'après l'Assurance Maladie, un oubli est « court » s'il dure moins de **12 heures** pour une pilule combinée et moins de **3 heures** pour certaines pilules microprogestatives. La notice de votre pilule fait foi : relisez-la.

## Au quotidien
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
- Prenez la pilule à heure fixe, associée à un geste quotidien (brossage des dents, réveil).
- Activez une alarme ou un rappel : votre calendrier peut vous le proposer.
- Gardez une plaquette de secours dans votre sac en cas de déplacement.
- Pensez au décalage horaire en voyage : demandez conseil avant de partir.

Si les oublis sont fréquents, ce n'est pas un échec personnel : une méthode qui ne dépend pas d'un geste quotidien (implant, stérilet) peut être discutée avec un professionnel.

## Questions fréquentes
**J'ai pris deux comprimés le même jour : est-ce un problème ?**
C'est justement ce qui est conseillé quand on rattrape un oubli : prendre le comprimé oublié, puis le suivant à l'heure habituelle.

**J'ai vomi peu après ma pilule : est-ce un oubli ?**
Des vomissements ou une diarrhée importante peu après la prise peuvent diminuer l'efficacité, comme un oubli. Consultez la notice et demandez conseil à votre pharmacien.

**Dois-je arrêter la plaquette en cours ?**
Non, continuez-la normalement, sauf avis différent de votre professionnel.

**Quand faire un test de grossesse ?**
En cas de doute, un test peut être fait 21 jours après l'oubli, ou si vos règles n'arrivent pas.

## Quand demander conseil
- Plusieurs comprimés oubliés, oubli en début de plaquette, ou doute sur la conduite à tenir : **votre pharmacien**, sans rendez-vous.
- Rapport non protégé dans les jours précédant l'oubli : la contraception d'urgence, le plus tôt possible.
- Le numéro **0 800 08 11 11** (gratuit et anonyme) répond aussi à vos questions.
- Douleur intense du bas-ventre, malaise ou saignement abondant : appelez le 15 (ou le 112).

Cet article informe et ne remplace pas la notice de votre pilule ni l'avis d'un médecin, d'une sage-femme ou d'un pharmacien.`,
    journeys: ['avoid'],
    category: 'cycle',
    tags: ['pilule', 'oubli', 'contraception d’urgence', 'préservatif'],
    sources: [S.ameliHormonale, S.ameliCuReflexes],
    status: 'to_review',
  },
  {
    slug: 'contraception-urgence-ou-et-quand',
    title: 'Contraception d’urgence : où et quand ?',
    summary: 'Après un rapport non protégé, la contraception d’urgence est d’autant plus efficace qu’elle est prise tôt ; elle est disponible en pharmacie sans ordonnance.',
    body_md: `Après un rapport non protégé, un oubli de contraception ou un préservatif qui a glissé ou s'est déchiré, la contraception d'urgence permet de réduire la probabilité d'une grossesse. Elle n'interrompt pas une grossesse déjà commencée. Agir vite est ce qui compte le plus.

## En bref
- Plus elle est prise tôt après le rapport, plus elle est efficace.
- La pilule d'urgence est disponible en pharmacie sans ordonnance ; le pharmacien vous précisera les modalités.
- Selon la pilule, elle peut être prise jusqu'à 3 jours ou jusqu'à 5 jours après le rapport.
- Le stérilet au cuivre, posé dans les 5 jours, est la méthode la plus efficace.
- Elle ne protège pas des IST : un dépistage peut être utile, et pour le VIH il faut consulter sans dépasser 48 heures.

## Comprendre
### Comment elle agit
La contraception d'urgence agit principalement en retardant ou en empêchant l'ovulation, pour éviter une fécondation. Elle n'agit pas sur une grossesse déjà installée. Elle ne remplace pas une contraception régulière et ne protège pas des rapports suivants.

### Les options
- **Pilule d'urgence au lévonorgestrel** : jusqu'à 3 jours après le rapport.
- **Pilule d'urgence à l'ulipristal acétate** : jusqu'à 5 jours après le rapport.
- **Stérilet au cuivre** : posé dans les 5 jours par un médecin ou une sage-femme, c'est la méthode la plus efficace selon l'Assurance Maladie. Il peut ensuite servir de contraception régulière.

Dans tous les cas, **plus c'est tôt, mieux c'est**. Aucune méthode n'est efficace à 100 %.

## Au quotidien
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

### Et ensuite ?
C'est souvent l'occasion de faire le point sur sa contraception habituelle. Un médecin, une sage-femme ou un centre de santé sexuelle peut vous aider à trouver une méthode qui vous convient mieux, si besoin.

## Questions fréquentes
**Puis-je l'avoir d'avance, « au cas où » ?**
Oui, il est possible de la demander en pharmacie pour l'avoir chez soi ; parlez-en avec votre pharmacien.

**Peut-on la prendre plusieurs fois ?**
Elle peut être reprise si un nouvel accident survient, mais elle ne remplace pas une contraception régulière. Si les accidents se répètent, parlez-en à un professionnel.

**J'allaite : est-ce possible ?**
Demandez conseil à votre pharmacien ou à votre médecin, qui vous indiquera la méthode adaptée.

**Elle a des effets secondaires ?**
Des nausées, des douleurs du bas-ventre ou des saignements légers peuvent survenir. Si les symptômes sont importants ou durent, consultez.

**Dois-je prévenir quelqu'un ?**
Non. Pour les mineures, elle est délivrée de façon anonyme.

## Quand demander conseil
- Le plus tôt possible après le rapport : pharmacie, centre de santé sexuelle, médecin ou sage-femme.
- Règles avec plus de 5 jours de retard : faites un test de grossesse.
- Rapport à risque d'IST : consultez pour un dépistage, et dans les 48 heures pour le VIH.
- **Urgence (15 ou 112)** : douleur intense du bas-ventre, malaise, saignement abondant.

Numéro d'information : **0 800 08 11 11** (gratuit, anonyme).

Cet article informe et ne remplace pas l'avis d'un pharmacien, d'un médecin ou d'une sage-femme.`,
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
    summary: 'Sept consultations, trois échographies, un entretien prénatal précoce et sept séances de préparation : voici à quoi sert chaque étape du suivi.',
    body_md: `Le suivi de grossesse permet de veiller à votre santé et à celle du bébé, de repérer tôt ce qui demande une attention particulière, et de répondre à vos questions. Voici le programme habituel décrit par l'Assurance Maladie, que votre professionnel adaptera à votre situation.

## En bref
- La première consultation a lieu avant la fin du 3e mois ; il y a sept consultations au total.
- Trois échographies sont recommandées.
- L'entretien prénatal précoce est conseillé dès le 4e mois, et il n'est jamais trop tard pour le demander.
- Sept séances de préparation à la naissance et à la parentalité sont proposées.
- Entre deux rendez-vous, vous pouvez contacter votre sage-femme, votre médecin ou votre maternité à tout moment.

## Comprendre
### Qui peut vous suivre
Le suivi peut être assuré par une sage-femme, un médecin généraliste ou un gynécologue-obstétricien, en ville ou à la maternité. Si votre grossesse demande une attention particulière, le suivi peut être partagé avec une équipe spécialisée.

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

Chaque consultation mensuelle comprend en général un examen, la mesure de la tension et du poids, et un temps pour vos questions.

### D'autres aides
- Un **bilan bucco-dentaire** est pris en charge à partir du 4e mois.
- Un **bilan prénatal de prévention** avec une sage-femme peut être proposé, si possible avant la 24e semaine.

## Au quotidien
### Préparer chaque rendez-vous
- Notez vos questions au fil des jours (l'application vous permet de les rattacher à un rendez-vous).
- Apportez vos résultats d'analyses, vos comptes rendus d'échographie et la liste de vos traitements.
- Signalez tout ce qui a changé : symptômes, sommeil, moral, situation personnelle.

### L'entretien prénatal précoce
C'est un temps d'échange, sans examen, pour parler de votre projet, de vos besoins, de vos inquiétudes et de votre entourage. Il peut se faire seule ou en couple. Il permet d'adapter l'accompagnement, par exemple en orientant vers un soutien si besoin.

### Les démarches
La déclaration de grossesse est faite par le professionnel lors de la première consultation. Pensez à choisir votre maternité assez tôt, et renseignez-vous sur les droits liés au congé maternité et paternité.

## Questions fréquentes
**Puis-je venir accompagnée ?**
Oui, votre partenaire ou une personne de confiance peut assister aux consultations et aux échographies, sauf contrainte particulière du lieu.

**Et si je découvre ma grossesse tard ?**
Le suivi commence dès que possible : prenez rendez-vous rapidement, le programme sera adapté.

**Les rendez-vous sont-ils pris en charge ?**
Les examens obligatoires sont pris en charge selon les règles de l'Assurance Maladie ; votre professionnel vous précisera les modalités.

**Puis-je changer de professionnel en cours de route ?**
Oui, vous restez libre de votre choix.

## Quand demander conseil
Vous pouvez contacter votre sage-femme, votre médecin ou votre maternité à tout moment si quelque chose vous inquiète. Contractions douloureuses ou rapprochées, saignements, perte de liquide, brûlures urinaires, fortes nausées ou humeur très changeante sont des raisons de consulter sans attendre le prochain rendez-vous.

**En urgence, appelez le 15 (ou le 112)** : saignement abondant, malaise, douleur dans la poitrine, douleur intense du ventre.

Cet article informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
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
    summary: 'Trois échographies sont recommandées, chacune avec un but précis : dater la grossesse, observer le développement, vérifier la croissance.',
    body_md: `Les échographies sont souvent des moments forts, attendus avec émotion et parfois avec une pointe d'inquiétude. Savoir à quoi sert chacune, comment elle se déroule et quelles questions poser peut aider à les aborder plus sereinement.

## En bref
- Trois échographies sont recommandées : vers 11 à 13 SA + 6 jours, entre 20 et 24 SA, puis entre 30 et 35 SA.
- La première date la grossesse ; la deuxième observe le développement ; la troisième vérifie la croissance et la position du bébé.
- SA signifie « semaines d'aménorrhée », comptées depuis le premier jour des dernières règles.
- Des échographies supplémentaires peuvent être prescrites sans que cela signifie forcément un problème.
- Vous pouvez venir accompagnée et poser toutes vos questions.

## Comprendre
### Comment se passe l'examen
L'échographie utilise des ultrasons pour former une image. Un gel est appliqué sur le ventre, puis une sonde est déplacée sur la peau. Au tout début de la grossesse, l'examen peut aussi se faire par voie vaginale pour une image plus précise. L'examen n'est pas douloureux ; sa durée varie, notamment selon la position du bébé.

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

## Au quotidien
### Bon à savoir
- **SA** signifie « semaines d'aménorrhée », comptées depuis le premier jour des dernières règles. On parle aussi de semaines de grossesse (SG), qui comptent deux semaines de moins.
- D'autres échographies peuvent être prescrites selon votre situation : cela ne signifie pas forcément qu'il y a un problème. N'hésitez pas à demander pourquoi.
- Vous pouvez venir accompagnée, et poser toutes vos questions pendant ou après l'examen.

### Pour bien préparer
- Apportez vos résultats d'analyses et le compte rendu de l'échographie précédente.
- Évitez d'appliquer une crème sur le ventre le jour de l'examen.
- Selon le centre, il peut être demandé d'avoir la vessie plus ou moins pleine : suivez les consignes données à la prise de rendez-vous.
- Pensez à votre agenda : prenez rendez-vous assez tôt, car les créneaux se remplissent vite.

### Le sexe du bébé
Il peut souvent être vu à la deuxième échographie, si la position du bébé le permet. Vous pouvez demander à le savoir ou au contraire à garder la surprise : dites-le au début de l'examen.

## Questions fréquentes
**Les échographies sont-elles dangereuses pour le bébé ?**
Les échographies médicales prescrites font partie du suivi recommandé. Les échographies « souvenir » sans but médical ne sont pas recommandées.

**Je n'ai pas vu grand-chose sur l'écran : est-ce inquiétant ?**
L'image dépend beaucoup de la position du bébé. L'échographiste peut vous expliquer ce qu'il observe, ou proposer de revenir si l'examen n'a pas pu être complet.

**Le terme peut-il changer après la première échographie ?**
Oui, la date prévue d'accouchement est souvent précisée à la première échographie, car elle est plus fiable que le calcul à partir des règles.

**Que faire si je ne peux pas me rendre au rendez-vous ?**
Prévenez le centre pour le décaler, en restant dans la période recommandée.

## Quand demander conseil
### Si une anomalie est évoquée
Vous avez le droit de prendre le temps de comprendre et de demander des explications. Votre équipe peut vous orienter vers un accompagnement adapté, y compris un soutien psychologique.

### Sans attendre la prochaine échographie
Contactez votre maternité en cas de saignement, de perte de liquide, de contractions douloureuses ou rapprochées, ou d'une inquiétude sur les mouvements du bébé. **En urgence, appelez le 15 (ou le 112).**

Cet article informe et ne remplace pas l'avis de votre sage-femme, de votre médecin ou de l'échographiste.`,
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
    summary: 'Fréquentes au début de la grossesse, les nausées peuvent survenir à toute heure : des gestes simples soulagent, et certains signes doivent faire consulter vite.',
    body_md: `On parle souvent de « nausées du matin », mais elles peuvent survenir à n'importe quel moment de la journée. Elles sont fréquentes et peuvent être très pénibles : ce n'est pas « dans la tête ». Voici ce qui peut soulager, et quand il ne faut pas attendre pour consulter.

## En bref
- Les nausées et vomissements sont fréquents au premier trimestre et s'atténuent souvent ensuite.
- Manger souvent et en petites quantités, sans rester à jeun, aide beaucoup de femmes.
- Aucun médicament ni produit « naturel » sans avis médical ; les huiles essentielles sont à éviter.
- Des traitements existent : vous n'avez pas à « tenir bon » seule.
- Vomissements importants, impossibilité de boire ou perte de poids doivent faire consulter rapidement.

## Comprendre
### D'où viennent les nausées
Elles sont liées aux changements hormonaux du début de la grossesse. Leur intensité varie beaucoup d'une femme à l'autre, et d'une grossesse à l'autre. La fatigue, les odeurs fortes ou le fait d'avoir l'estomac vide peuvent les aggraver.

### Quand elles deviennent sévères
Dans une petite partie des cas, les vomissements sont si importants qu'ils empêchent de s'alimenter et de boire : on parle d'**hyperémèse gravidique**. Cette forme nécessite un traitement rapide, parfois à l'hôpital, pour éviter la déshydratation.

### Évaluer leur intensité
Un questionnaire simple, le **score PUQE**, permet d'évaluer les nausées sur 24 heures. Votre médecin ou votre sage-femme peut vous aider à le remplir et adapter la prise en charge.

## Au quotidien
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

### Au travail et à la maison
- Gardez à portée de main quelque chose à grignoter (biscuits secs, fruit) dès le réveil et dans votre sac.
- Fractionnez les repas en plusieurs petites prises.
- Demandez de l'aide pour les courses ou la cuisine si les odeurs vous gênent.
- Parlez-en à votre médecin si votre travail devient difficile : un arrêt ou un aménagement peut se discuter.

### Noter pour mieux en parler
Noter les moments de la journée, les déclencheurs et le nombre de vomissements (dans l'outil « Comment je me sens ») aide à décrire la situation en consultation.

## Questions fréquentes
**Les nausées sont-elles mauvaises pour le bébé ?**
Les nausées en elles-mêmes sont fréquentes. Ce qui compte, c'est de rester hydratée et de pouvoir s'alimenter : si ce n'est plus possible, consultez rapidement.

**Combien de temps durent-elles ?**
Elles s'atténuent souvent au cours du deuxième trimestre, mais chez certaines femmes elles durent plus longtemps. Parlez-en si elles persistent.

**Puis-je prendre un médicament contre les nausées ?**
Seulement sur avis médical : votre médecin ou votre sage-femme choisira un traitement compatible avec la grossesse.

**Je n'ai pas de nausées : est-ce inquiétant ?**
Pas forcément : beaucoup de femmes n'en ont pas ou très peu. Si quelque chose vous inquiète, parlez-en à votre sage-femme ou à votre médecin.

## Quand demander conseil
- **Rapidement** : vomissements importants et persistants qui gênent la vie quotidienne, perte de poids, impossibilité de garder les liquides, signes de déshydratation (soif intense, bouche sèche, urines foncées), fièvre ou fatigue inhabituelle.
- **En urgence (15 ou 112)** : nausées et vomissements sévères avec malaise, ou impossibilité totale de boire. L'hyperémèse gravidique nécessite un traitement rapide.
- Si les nausées pèsent sur votre moral, parlez-en aussi : c'est une vraie épreuve.

Des traitements existent : vous n'avez pas à « tenir bon » seule.

Cet article informe et ne remplace pas l'avis de votre médecin, de votre sage-femme ou de votre pharmacien.`,
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
    summary: 'La fatigue est fréquente pendant la grossesse : quelques habitudes, la position sur le côté et un peu d’aide peuvent rendre les nuits plus douces.',
    body_md: `La fatigue est très fréquente, surtout au premier trimestre, en raison des changements hormonaux. Plus tard, le ventre qui s'arrondit, les envies d'uriner, les brûlures d'estomac ou les pensées qui tournent peuvent rendre le repos plus difficile. Voici des pistes concrètes.

## En bref
- La fatigue du premier trimestre est liée aux changements hormonaux ; elle s'atténue souvent ensuite.
- Dormir sur le côté, gauche ou droit, est la position conseillée, surtout au troisième trimestre.
- Se réveiller sur le dos n'est pas grave : il suffit de se tourner sur le côté.
- Un moment calme avant le coucher, des coussins et un peu d'activité dans la journée aident souvent.
- Si la fatigue pèse sur le moral, parlez-en : des solutions existent.

## Comprendre
### Pourquoi on est si fatiguée
Au premier trimestre, le corps s'adapte à la grossesse : les hormones changent, le volume de sang augmente, et une grande fatigue peut s'installer même avec des nuits complètes. Au troisième trimestre, le poids du ventre, les mouvements du bébé, les envies fréquentes d'uriner et les douleurs de dos peuvent fragmenter le sommeil.

### Pourquoi la position compte
Le service de santé britannique (NHS) cite des travaux associant le sommeil sur le dos après 28 semaines à un risque plus élevé de complications graves pour le bébé. C'est pourquoi la position **sur le côté** est conseillée pour s'endormir, à partir du troisième trimestre. L'Assurance Maladie conseille aussi d'éviter de rester allongée sur le dos de façon prolongée à partir de la 24e semaine.

## Au quotidien
### Des idées pour mieux se reposer
- Reposez-vous dès que possible et acceptez l'aide proposée.
- Prenez un moment calme avant le coucher : respiration, relaxation.
- Évitez les longues siestes en fin d'après-midi si elles vous empêchent de vous endormir le soir.
- Limitez la caféine (thé, café, cola) en soirée.
- Restez active dans la journée si votre situation le permet : marche, natation, gymnastique douce.
- Calez votre ventre avec un coussin et placez-en un entre vos genoux.

### Quelle position ?
- Dormir **sur le côté**, gauche ou droit, est la position conseillée, notamment à partir du troisième trimestre.
- Si vous vous réveillez sur le dos, pas d'inquiétude : tournez-vous simplement sur le côté.
- Un coussin dans le dos peut aider à rester sur le côté.

### Les petits maux de la nuit
- **Envies d'uriner** : buvez bien dans la journée, un peu moins juste avant le coucher.
- **Brûlures d'estomac** : évitez les repas lourds tard le soir et surélevez légèrement la tête.
- **Crampes ou jambes lourdes** : bougez dans la journée et parlez-en à votre professionnel si elles sont fréquentes.

### Les pensées qui empêchent de dormir
Inquiétudes, rêves intenses, questions sur l'accouchement : en parler avec votre partenaire, votre sage-femme ou lors de la préparation à la naissance peut soulager. Noter ses pensées avant le coucher aide certaines personnes à « vider la tête ».

## Questions fréquentes
**Puis-je prendre quelque chose pour dormir ?**
Aucun médicament ni produit « naturel » sans avis médical pendant la grossesse. Parlez-en à votre médecin ou à votre sage-femme.

**La sieste est-elle une bonne idée ?**
Oui, si elle ne vous empêche pas de dormir le soir : préférez une sieste courte en début d'après-midi.

**Je me réveille la nuit avec le bébé qui bouge : est-ce gênant ?**
Les mouvements sont souvent plus perceptibles au repos. Si vous avez une inquiétude sur les mouvements du bébé, contactez votre maternité.

**Mon partenaire peut-il aider ?**
Partager les tâches du soir, accepter qu'il ou elle prenne le relais, ou simplement parler de la fatigue peut alléger la charge.

## Quand demander conseil
- Si le manque de sommeil vous pèse ou dure.
- Si l'insomnie s'accompagne de tristesse, de perte d'intérêt ou d'un sentiment de désespoir : parlez-en à votre médecin ou à votre sage-femme. Des solutions existent. En cas d'idées noires, le **3114** répond 24 h/24.
- Si vous ronflez beaucoup ou faites des pauses respiratoires, ou si une envie irrésistible de bouger les jambes vous empêche de dormir.
- **En urgence (15 ou 112)** : essoufflement important, douleur dans la poitrine, malaise.

Cet article informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
    journeys: ['pregnant'],
    category: 'sommeil',
    tags: ['sommeil', 'fatigue', 'position', 'insomnie'],
    sources: [S.nhsFatigueGrossesse, S.ameliActive],
    status: 'to_review',
  },
  {
    slug: 'grossesse-signes-qui-doivent-faire-consulter',
    title: 'Pendant la grossesse : les signes qui doivent faire consulter',
    summary: 'Saignements, perte de liquide, contractions rapprochées ou certains maux de tête doivent faire contacter vite la maternité : savoir les reconnaître permet d’agir tôt.',
    body_md: `La plupart des grossesses se déroulent bien. Connaître les signes d'alerte ne sert pas à s'inquiéter, mais à savoir réagir vite si besoin, et à qui s'adresser. **En cas de doute, appelez : vous ne dérangez pas.**

## En bref
- Saignement abondant avec malaise, douleur dans la poitrine, saignement avec douleurs ou fièvre : appelez le 15 (ou le 112).
- Au 2e ou 3e trimestre, tout saignement, une perte de liquide ou des contractions rapprochées doivent faire contacter la maternité sans attendre.
- Maux de tête persistants, troubles de la vue ou gonflement brutal peuvent évoquer une pré-éclampsie.
- Une inquiétude sur les mouvements du bébé justifie d'appeler la maternité.
- Votre moral compte aussi : en cas d'idées noires, le 3114 répond 24 h/24.

## Comprendre
### Pourquoi ces signes comptent
Certains symptômes peuvent signaler une complication qui gagne à être prise en charge tôt : un problème du placenta, un début de travail prématuré, une rupture de la poche des eaux, une infection ou une **pré-éclampsie** (une maladie liée à la grossesse, qui associe notamment une hypertension). Une consultation rapide permet de vérifier et, si besoin, d'agir. Souvent, l'examen rassure.

### À qui s'adresser
- **Le 15 ou le 112** pour une urgence vitale ou en cas de doute grave.
- **Votre maternité** (urgences obstétricales), joignable 24 h/24, pour les signes liés à la grossesse à partir du milieu de la grossesse.
- **Votre sage-femme ou votre médecin** pour les situations moins urgentes.

## Au quotidien
### Avoir les bons numéros sous la main
Enregistrez dans votre téléphone le numéro des urgences de votre maternité, et gardez vos documents de grossesse (comptes rendus, groupe sanguin) faciles à retrouver.

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

## Questions fréquentes
**J'ai peur de déranger pour rien.**
Les équipes préfèrent vous voir pour rien plutôt que trop tard. Appeler fait partie du suivi.

**Je ne sens plus beaucoup mon bébé bouger : que faire ?**
Contactez votre maternité sans attendre, même si ce n'est qu'une impression.

**Un petit saignement après un rapport, est-ce grave ?**
Au 2e ou 3e trimestre, tout saignement doit être vu en urgence, même indolore ou après un rapport. Au 1er trimestre, sans douleur ni malaise, consultez rapidement.

**Comment savoir si c'est la poche des eaux ?**
Une perte de liquide continue, qui mouille le linge, doit faire contacter la maternité. En cas de doute, appelez.

## Quand demander conseil
Ce sont justement tous les signes listés ci-dessus. Si vous avez une inquiétude sur les mouvements de votre bébé, contactez votre maternité sans attendre. **En urgence, appelez le 15 (ou le 112).**

Cet article informe et ne remplace pas l'avis de votre maternité, de votre sage-femme ou de votre médecin.`,
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
    summary: 'Sauf contre-indication, une activité physique régulière et modérée fait du bien pendant la grossesse : quelles activités choisir, comment s’y prendre, quoi éviter et quels signes doivent faire arrêter.',
    body_md: `## En bref
- Sauf contre-indication médicale, bouger régulièrement pendant la grossesse contribue à la forme, au bien-être et à une bonne circulation du sang.
- Repère général : **au moins 30 minutes par jour** d’activité modérée, et du renforcement musculaire **une à deux fois par semaine**, à ajuster avec votre médecin ou votre sage-femme.
- La marche, la natation, la gymnastique douce, le yoga prénatal ou l’aquagym pour femmes enceintes sont souvent proposés.
- À éviter : les activités avec risque de chute ou de choc, les efforts en bloquant la respiration, la chaleur humide, l’altitude et les pics de pollution.
- Arrêtez et consultez en cas d’essoufflement qui persiste au repos, de contractions, de saignements, de malaise ou de mollet gonflé. Douleur dans la poitrine : **15**.

## Comprendre
Une activité adaptée sollicite le cœur et les poumons, entretient les muscles et les articulations, et favorise le retour veineux, c’est-à-dire la remontée du sang des jambes vers le cœur. Elle procure aussi une sensation de bien-être et de légèreté.

Le type d’activité, son intensité et sa fréquence se décident avec le médecin ou la sage-femme qui vous suit : certaines situations médicales contre-indiquent l’effort, et chaque grossesse est différente. La régularité compte souvent davantage que l’intensité. Si vous étiez peu active avant la grossesse, vous pouvez commencer doucement et augmenter petit à petit.

Rester longtemps immobile n’aide pas non plus : il est conseillé de ne pas rester assise trop longtemps et de marcher un peu toutes les deux heures. À l’inverse, la station debout prolongée peut faire baisser la tension et provoquer un malaise.

## Au quotidien
- **La marche** : accessible, elle peut se commencer à tout moment et se poursuivre jusqu’à l’accouchement, seule ou en famille.
- **La natation ou la marche dans l’eau** : elles ménagent les articulations et favorisent le retour veineux. Des piscines proposent des cours pour femmes enceintes ; évitez les heures de forte affluence.
- **La gymnastique douce, le yoga prénatal, le Pilates ou l’aquagym spécifique** : on y travaille la respiration, le bassin et le périnée. Un encadrant formé peut corriger vos postures.
- **La course à pied** : plutôt si vous la pratiquiez déjà. Choisissez de bonnes chaussures, un terrain souple, et arrêtez si vos chevilles deviennent douloureuses.
- **Le renforcement musculaire** : une à deux fois par semaine. Pour le plancher pelvien, Santé.fr propose par exemple de contracter environ 10 secondes, relâcher 5 secondes, une dizaine de fois, plusieurs fois par jour. Pendant les exercices, ne creusez pas le bas du dos et expirez à l’effort.

Les bons réflexes : 10 à 15 minutes d’échauffement avant, 10 à 15 minutes de récupération après avec des étirements doux ; boire pendant l’effort ; une tenue adaptée à la température. Quand le ventre s’arrondit, préférez les exercices allongée sur le côté ou debout mais courts, et méfiez-vous des changements d’équilibre.

À éviter : les contractions prolongées en bloquant la respiration ; les exercices allongée sur le dos à partir de la 24e semaine d’aménorrhée ; les activités où l’on peut perdre l’équilibre, tomber ou recevoir un choc (sports de contact ou de combat, par exemple) ; la plongée sous-marine ; les environnements chauds et humides ; l’altitude ; l’effort lors d’un pic de pollution.

## Questions fréquentes
**Je n’étais pas sportive : puis-je commencer maintenant ?** Oui, le plus souvent, avec des activités douces comme la marche ou la natation, après en avoir parlé avec votre médecin ou votre sage-femme. Commencez par des séances courtes et augmentez progressivement.

**Pourquoi éviter d’être allongée sur le dos ?** Plus tard dans la grossesse, l’utérus peut comprimer les gros vaisseaux et freiner le retour du sang vers le cœur, ce qui peut faire baisser la tension. C’est pourquoi on recommande d’éviter cette position à partir de la 24e semaine (vers le 5e mois).

**Puis-je garder mon sport habituel ?** Cela dépend du sport et de votre grossesse : parlez-en avec le professionnel qui vous suit, qui vous aidera à adapter l’intensité.

**Et les jours de grande fatigue ?** Écoutez votre corps : se reposer fait aussi partie de l’équilibre. Si la fatigue est intense ou dure, parlez-en lors de votre suivi.

## Quand demander conseil
Demandez l’avis de votre médecin ou de votre sage-femme avant de commencer ou de reprendre une activité. Pendant l’effort, arrêtez-vous et consultez si vous ressentez :
- un essoufflement anormal qui ne passe pas au repos ;
- une douleur dans la poitrine : **appelez le 15 (ou le 112)** ;
- des contractions régulières et douloureuses qui persistent au repos ;
- des saignements vaginaux ;
- des vertiges, des troubles de l’équilibre, un malaise ou des maux de tête inhabituels ;
- un mollet gonflé et dur, qui peut être le signe d’une phlébite.

Cet article informe et ne remplace pas l’avis de votre médecin ou de votre sage-femme.`,
    journeys: ['pregnant'],
    category: 'grossesse',
    tags: ['activité physique', 'sport', 'marche', 'précautions'],
    sources: [S.mbGrossesse, S.ameliActive, S.santeActiviteGrossesse],
    status: 'to_review',
  },
  {
    slug: 'preparation-naissance-parentalite',
    title: 'La préparation à la naissance et à la parentalité',
    summary: 'Un entretien prénatal précoce puis sept séances prises en charge : un temps pour comprendre la naissance, préparer le retour à la maison et poser toutes vos questions.',
    body_md: `La préparation à la naissance ne sert pas qu'à apprendre à respirer. C'est un temps pour comprendre ce qui va se passer, poser vos questions sans vous presser, rencontrer d'autres futurs parents et organiser le retour à la maison. Elle s'adapte à vous : à votre santé, à votre projet et à vos inquiétudes.

## En bref
- Un **entretien prénatal précoce** obligatoire, conseillé dès le 4e mois, seule ou en couple.
- **Sept séances** de préparation prises en charge à 100 % par l'Assurance Maladie.
- Animées par une sage-femme ou un médecin, en groupe ou en individuel.
- On y parle de l'accouchement, mais aussi des premiers jours avec bébé, de l'allaitement ou du biberon, du sommeil et de vous.
- Le ou la partenaire peut souvent participer à certaines séances.

## Comprendre
### L'entretien prénatal précoce
C'est le point de départ. Ce rendez-vous, avec une sage-femme ou un médecin, n'est pas un examen médical : c'est une conversation. Vous pouvez y parler de votre projet de naissance, de vos attentes, de ce qui vous inquiète, de votre situation familiale ou professionnelle, et de l'aide dont vous pourriez avoir besoin. C'est souvent à ce moment que se construit le calendrier des séances de préparation, et que l'on peut vous orienter vers d'autres professionnels si besoin.

### Les sept séances
Elles se répartissent au fil de la grossesse. Leur contenu varie selon les professionnels et vos besoins, mais on y retrouve en général :
- le déroulement de la fin de grossesse, des signes qui annoncent le travail, de l'accouchement et du séjour à la maternité ;
- des exercices de respiration, de relaxation et des postures pour soulager certains inconforts (dos, jambes lourdes, sommeil) ;
- les soins au nouveau-né, son alimentation et ses besoins ;
- l'organisation du retour à la maison, la place de chacun, le repos.

Il existe différentes approches (groupe, individuel, en piscine, avec des exercices corporels…). Demandez ce qui est proposé près de chez vous.

## Au quotidien
- **Préparez vos questions** : notez-les dans votre téléphone au fil des semaines, même celles qui vous semblent petites (« Comment savoir que c'est le moment de partir ? », « Que mettre dans la valise ? »).
- **Parlez de votre projet de naissance** : ce que vous souhaitez, ce qui compte pour vous, ce qui vous inquiète. Il pourra évoluer, et c'est très bien ainsi.
- **Impliquez votre partenaire** : certaines séances lui sont ouvertes. Cela l'aide à trouver sa place le jour J et les semaines suivantes.
- **Choisissez votre maternité tôt** : vérifiez les services proposés et le niveau de maternité adapté à votre santé. Si vous habitez à plus de 45 minutes d'une maternité, un dispositif peut prendre en charge un hébergement et des transports : renseignez-vous auprès de l'Assurance Maladie.
- **Pensez à l'après** : qui pourra vous aider à la maison ? Comment vous relayer la nuit ? En parler avant soulage souvent beaucoup.

## Questions fréquentes
**Est-ce obligatoire de suivre les sept séances ?**
L'entretien prénatal précoce est obligatoire ; les séances de préparation sont proposées et prises en charge, mais vous restez libre d'y participer, en totalité ou en partie.

**Peut-on commencer tard dans la grossesse ?**
Oui. Même quelques séances peuvent être utiles. Parlez-en à votre sage-femme ou à votre médecin pour adapter le programme.

**Et si j'ai peur de l'accouchement ?**
C'est justement un bon endroit pour en parler. Exprimer ses peurs permet de recevoir des informations claires et un accompagnement adapté.

**Faut-il préparer un projet de naissance écrit ?**
Ce n'est pas obligatoire. Certaines personnes trouvent utile de noter leurs souhaits pour en parler avec l'équipe ; d'autres préfèrent en discuter de vive voix.

## Quand demander conseil
- Si vous vous sentez très anxieuse à l'idée de l'accouchement, ou si une naissance précédente a été difficile : parlez-en dès l'entretien prénatal précoce.
- Si vous ne savez pas comment organiser le suivi ou trouver une sage-femme : votre médecin, la maternité ou la PMI peuvent vous orienter.
- En cas de saignements, de perte de liquide, de contractions régulières avant terme ou de baisse des mouvements du bébé : contactez votre maternité sans attendre. En urgence, appelez le **15** ou le **112**.

Il n'y a pas de « bonne » façon de vivre une naissance : la préparation vous aide à faire vos propres choix, en lien avec l'équipe. Cet article vous informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
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
    summary: 'Joie, doutes et inquiétudes se mêlent souvent pendant la grossesse ; quand l’anxiété ou la tristesse s’installent, en parler tôt permet d’être accompagnée.',
    body_md: `La grossesse bouleverse le corps, le quotidien et la façon dont on se projette. Il est fréquent de ressentir à la fois de la joie, des doutes, des peurs, de l'irritabilité ou des larmes. Ces émotions ne font pas de vous une moins bonne future mère : elles accompagnent un très grand changement de vie.

## En bref
- Les variations d'humeur sont fréquentes pendant la grossesse.
- Quand l'anxiété ou la tristesse durent, s'intensifient ou empêchent de vivre au quotidien, il est important d'en parler.
- Selon l'Assurance Maladie, la dépression concerne environ une femme enceinte sur dix ; elle peut apparaître à tout moment et elle se soigne.
- Votre sage-femme, votre médecin et l'entretien prénatal précoce sont des portes d'entrée pour être aidée.
- En cas de pensées de vous faire du mal : **3114**, 24 h/24 ; danger immédiat : **15** ou **112**.

## Comprendre
### Pourquoi l'humeur change
Plusieurs choses se cumulent : les changements hormonaux et physiques, la fatigue, les nausées ou l'inconfort, les inquiétudes sur la santé du bébé, l'accouchement ou le fait de devenir parent, parfois des difficultés de couple, de travail ou de logement. Après un parcours pour concevoir, une perte de grossesse antérieure ou une naissance précédente difficile, les émotions peuvent être plus intenses.

### Quand cela devient plus qu'une variation d'humeur
Certains signes, surtout s'ils durent plus de quelques jours, méritent d'en parler :
- une anxiété permanente ou difficile à supporter, des crises d'angoisse, un besoin constant d'être rassurée ;
- une grande tristesse, des pleurs sans raison apparente, un sentiment d'inutilité ou de culpabilité ;
- une perte d'intérêt pour ce que vous aimiez, un manque d'énergie, des difficultés à prendre soin de vous ;
- des troubles du sommeil ou de l'appétit qui ne s'expliquent pas seulement par la grossesse ;
- des idées noires.

Seul un professionnel peut faire le point avec vous ; ces repères servent à ne pas rester seule avec ce que vous ressentez.

## Au quotidien
- **Mettez des mots** : en parler à une personne de confiance, à votre partenaire ou à un professionnel aide souvent à alléger le poids.
- **Gardez des temps pour vous**, même courts : une marche, un moment calme, une activité qui vous fait du bien, selon ce que votre état permet.
- **Protégez votre sommeil** autant que possible : siestes, coucher plus tôt, aide pour les tâches.
- **Acceptez l'aide** proposée, et osez la demander.
- **Notez vos ressentis** dans l'application si cela vous aide : cela facilite ensuite la conversation avec votre sage-femme ou votre médecin.

## Questions fréquentes
**Est-ce que mon stress peut faire du mal au bébé ?**
Se sentir parfois stressée est fréquent. Si l'anxiété est forte ou permanente, c'est surtout pour vous qu'il est important d'être accompagnée : parlez-en, des solutions existent.

**J'ai peur d'être jugée si je dis que je ne vais pas bien.**
Les professionnels qui suivent les grossesses posent ces questions régulièrement. Parler de votre moral fait partie du suivi, au même titre qu'une prise de tension.

**Je n'arrive pas à me réjouir de cette grossesse, est-ce grave ?**
Les émotions sont rarement simples. Si ce sentiment dure ou vous fait souffrir, parlez-en : on peut vous écouter sans vous juger.

**Peut-on voir un psychologue pendant la grossesse ?**
Oui. Le dispositif « Mon soutien psy » permet des séances prises en charge. Votre médecin ou votre sage-femme peut aussi vous orienter.

## Quand demander conseil
- Dès que la tristesse, l'anxiété ou l'épuisement durent ou vous empêchent de vivre comme d'habitude : votre sage-femme ou votre médecin, à chaque consultation ou en dehors.
- L'entretien prénatal précoce, prévu dès le 4e mois, est un bon moment pour en parler.
- Allô Parents Bébé : **0 800 00 34 56** (gratuit, en semaine).
- Si vous avez des pensées de vous faire du mal ou de ne plus être là, appelez le **3114** (gratuit, 24 h/24, 7 j/7). En cas de danger immédiat, appelez le **15** ou le **112**.

Vous n'avez pas à traverser cela seule. Cet article vous informe et ne remplace pas l'accompagnement d'un professionnel de santé.`,
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
    summary: 'Le plus souvent oui, sauf avis médical contraire : ce qu’en disent les sources de santé, les situations où un professionnel conseille autrement et les gestes de confort.',
    body_md: `C'est l'une des questions les plus fréquentes pendant la grossesse, et elle est tout à fait légitime. Beaucoup de couples n'osent pas la poser en consultation ; voici ce qu'en disent les sources de santé.

## En bref
- Selon Santé.fr, les rapports sexuels sont possibles pendant la grossesse, **sauf avis médical contraire**.
- Le bébé est protégé par le liquide amniotique et les membranes.
- Certaines situations (placenta bas inséré, poche des eaux rompue, saignements…) amènent un professionnel à conseiller autrement.
- La grossesse ne protège pas des infections sexuellement transmissibles.
- Saignements, perte de liquide, douleurs ou contractions qui se rapprochent : contactez la maternité.

## Comprendre
### La réponse générale
Quand la grossesse se déroule sans complication, la pénétration et l'orgasme restent possibles. Le bébé est à l'abri dans l'utérus, entouré de liquide amniotique ; le col de l'utérus est fermé par un bouchon muqueux. Il peut sentir des mouvements, mais une activité sexuelle qui ne vous fait pas mal ne lui fait pas mal non plus, selon les sources consultées.

### Quand un professionnel peut conseiller autrement
Dans certaines situations, votre sage-femme ou votre médecin peut vous recommander d'éviter les rapports avec pénétration, par exemple :
- placenta bas inséré ou placenta prævia ;
- poche des eaux rompue ;
- antécédents de plusieurs fausses couches ;
- saignements, en attendant d'avoir été examinée.

Ces consignes sont personnelles. Si l'on vous a donné une restriction, demandez ce qu'elle couvre précisément : la pénétration seulement ? l'orgasme ? pour combien de temps ? D'autres formes d'intimité restent-elles possibles ?

## Au quotidien
- **Écoutez votre corps** : ce qui était agréable avant peut ne plus l'être, et inversement.
- **Adaptez les positions** : à mesure que le ventre grossit, celles qui ne le compriment pas, comme sur le côté, sont souvent plus confortables.
- **En cas de sécheresse**, un lubrifiant à base d'eau peut aider.
- **Prenez votre temps** et parlez-vous : dire ce qui gêne ou ce qui fait du bien évite les malentendus.
- **Protégez-vous des infections** : en cas de risque, le préservatif reste conseillé. Le sexe oral est à éviter si l'un de vous a un bouton de fièvre (herpès).

## Questions fréquentes
**Le bébé peut-il « sentir » ou être gêné ?**
Il peut percevoir des mouvements, mais il reste protégé par le liquide amniotique.

**Pourquoi le ventre se durcit-il après un rapport ?**
En fin de grossesse, un rapport ou un orgasme peut entraîner des contractions passagères. Si elles deviennent douloureuses, régulières ou se rapprochent, contactez la maternité.

**J'ai de petits saignements après un rapport, que faire ?**
Contactez votre maternité ou votre sage-femme pour être examinée, surtout au 2e ou au 3e trimestre, et évitez les rapports en attendant.

**Et si nous n'en avons pas envie ?**
Avoir moins, plus ou pas d'envie est fréquent. L'intimité peut prendre bien d'autres formes.

## Quand demander conseil
- **Contactez la maternité sans attendre** en cas de saignements, de perte de liquide, de douleur inhabituelle ou de contractions qui se rapprochent, après un rapport ou à tout autre moment.
- Parlez-en à votre sage-femme ou à votre médecin si vous avez des douleurs pendant les rapports, des pertes inhabituelles, des démangeaisons, ou une question sur une restriction qui vous a été donnée.
- En urgence, appelez le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis personnalisé de votre sage-femme ou de votre médecin, qui prime toujours.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'rapports', 'grossesse', 'FAQ'],
    sources: [S.santeCouple, S.tommysSexe, S.nhsInformSexe],
    status: 'to_review',
  },
  {
    slug: 'sexualite-grossesse-idees-recues',
    title: 'Sexualité et grossesse : démêler les idées reçues',
    summary: 'Faire mal au bébé, provoquer une fausse couche, déclencher le travail : ce que disent vraiment les sources de santé sur les croyances les plus répandues.',
    body_md: `Beaucoup d'idées circulent sur la sexualité pendant la grossesse : conseils de l'entourage, forums, souvenirs de famille. Certaines inquiètent inutilement, d'autres font oublier les vrais signes d'alerte. Voici ce qu'en disent des sources de santé publiques.

## En bref
- Le bébé est protégé par le liquide amniotique ; selon les sources consultées, une activité sexuelle qui ne vous fait pas mal ne lui fait pas mal non plus.
- Il n'existe pas de preuve claire d'un lien entre les rapports et la fausse couche, ni d'un déclenchement du travail par les rapports.
- Des contractions passagères après un rapport en fin de grossesse sont habituelles ; douloureuses, régulières ou rapprochées, elles doivent faire contacter la maternité.
- Le désir varie beaucoup : il n'y a pas de « bonne » quantité d'envie.
- Un avis médical personnalisé prime toujours sur ces informations générales.

## Comprendre
### « Les rapports peuvent faire mal au bébé »
Le bébé se développe dans l'utérus, entouré de liquide amniotique et de membranes, et le col est fermé. Il peut percevoir des mouvements, mais il reste protégé.

### « Faire l'amour provoque une fausse couche »
Le service de santé écossais indique qu'il n'existe pas de preuve claire d'un lien. Seules certaines situations, par exemple plusieurs fausses couches antérieures, amènent un professionnel à conseiller de s'abstenir à certaines périodes. Si c'est votre cas, demandez-lui ce qui est possible.

### « Les rapports déclenchent l'accouchement »
Les sources consultées indiquent que les rapports ne provoquent pas d'accouchement prématuré, et qu'il n'existe pas de preuve qu'ils déclenchent le travail en fin de grossesse.

### « Si le ventre se contracte, c'est le début du travail »
En fin de grossesse, un rapport ou un orgasme peut provoquer des contractions passagères, appelées contractions de Braxton Hicks. Elles sont habituelles et ne signifient pas que le travail commence. En revanche, des contractions **douloureuses, régulières ou qui se rapprochent** doivent faire contacter la maternité.

### « Il faut avoir envie, sinon c'est que quelque chose ne va pas »
Le désir varie beaucoup d'une personne à l'autre et d'un trimestre à l'autre : fatigue, nausées, changements du corps, émotions. Avoir moins, plus ou pas d'envie est fréquent, chez la personne enceinte comme chez son ou sa partenaire.

## Au quotidien
- **Vérifiez l'information** : en cas de doute, demandez à votre sage-femme ou à votre médecin plutôt que de vous fier à une rumeur.
- **Parlez-en à deux** : les idées reçues créent parfois des craintes chez le ou la partenaire (peur de faire mal, de « déranger » le bébé). En parler apaise souvent.
- **Respectez vos envies** : ni obligation, ni interdit sans raison médicale.
- **Gardez en tête les vrais signes d'alerte** : ce sont eux qui comptent, pas les croyances.

## Questions fréquentes
**Faut-il éviter les rapports au premier trimestre ?**
Pas de façon générale, sauf avis médical contraire. Si vous avez des saignements ou des antécédents particuliers, demandez conseil.

**L'orgasme est-il déconseillé ?**
Il reste possible, sauf consigne médicale personnelle. Des contractions passagères peuvent suivre en fin de grossesse.

**Peut-on utiliser un lubrifiant ?**
Un lubrifiant à base d'eau peut aider en cas de sécheresse.

## Quand demander conseil
- **Contactez la maternité sans attendre** en cas de saignements, de perte de liquide, de douleur inhabituelle ou de contractions douloureuses, régulières ou qui se rapprochent.
- Demandez conseil si l'on vous a parlé de placenta bas inséré, si vous avez eu plusieurs fausses couches, ou si les rapports sont douloureux.
- En urgence, appelez le **15** ou le **112**.

Cet article vous informe à partir de sources de santé et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'idées reçues', 'mythes', 'contractions'],
    sources: [S.nhsInformSexe, S.tommysSexe, S.santeCouple],
    status: 'to_review',
  },
  {
    slug: 'desir-pendant-la-grossesse',
    title: 'Les changements du désir pendant la grossesse',
    summary: 'Le désir peut augmenter, diminuer ou disparaître pour un temps, chez la personne enceinte comme chez son ou sa partenaire : comprendre pourquoi et garder le lien.',
    body_md: `Pendant la grossesse, le désir change souvent, parfois d'une semaine à l'autre. Il n'y a pas de niveau « attendu » à atteindre : chaque personne et chaque couple vit cette période à sa manière.

## En bref
- Le désir peut augmenter, diminuer ou s'arrêter pour un temps, et varier d'un trimestre à l'autre.
- Les causes sont multiples : hormones, fatigue, nausées, image du corps, émotions, inquiétudes.
- Le désir du ou de la partenaire peut aussi changer ; un décalage entre les deux est courant.
- L'intimité ne se résume pas aux rapports.
- Si la situation vous fait souffrir ou s'accompagne de douleurs ou de tristesse, parlez-en.

## Comprendre
### Pourquoi le désir évolue
Plusieurs facteurs se combinent :
- les changements hormonaux et corporels (seins sensibles, ventre qui grossit, sensations nouvelles) ;
- la fatigue, les nausées, l'inconfort, le sommeil perturbé ;
- les émotions et la façon dont on perçoit son corps, qui peut être vécue de façon très positive ou plus difficile ;
- les inquiétudes, par exemple la peur de faire mal au bébé ou de déclencher quelque chose.

Beaucoup de couples ont moins de rapports à mesure que la grossesse avance, mais ce n'est pas une règle : certaines personnes ressentent au contraire plus de désir, notamment au deuxième trimestre.

### Et le ou la partenaire ?
Son désir peut aussi changer. Les craintes de blesser le bébé sont fréquentes. Certains partenaires se sentent intimidés par les transformations du corps, d'autres en sont très attirés. Un décalage d'envies est courant ; il devient pesant surtout quand il n'est pas dit.

## Au quotidien
- **Parlez-en simplement**, à un moment calme : « En ce moment, j'ai moins envie, mais j'ai besoin de tendresse. »
- **Distinguez l'envie de proximité et l'envie de rapport** : on peut avoir besoin de câlins sans souhaiter aller plus loin.
- **Explorez d'autres formes d'intimité** : baisers, massages, caresses, moments à deux, sans objectif.
- **Respectez les « non »** de chacun, sans culpabilité ni pression.
- **Prenez soin de votre fatigue** : repos et aide au quotidien ont souvent un effet sur l'envie.
- **Après la naissance**, la sexualité continue d'évoluer. Prendre son temps fait partie du chemin.

## Questions fréquentes
**Je n'ai plus du tout envie, est-ce que ça va revenir ?**
Le désir évolue souvent au fil de la grossesse et après la naissance. Si cela vous fait souffrir ou pèse sur le couple, un professionnel peut vous aider.

**Mon ou ma partenaire a peur de me toucher, que faire ?**
Ces craintes sont fréquentes. Lui expliquer que le bébé est protégé, ou venir ensemble à une consultation, peut rassurer.

**J'ai plus envie qu'avant, est-ce gênant ?**
Non : le désir varie dans tous les sens, et une envie plus forte est aussi fréquente.

## Quand demander conseil
- Si la baisse de désir vous fait souffrir ou pèse sur le couple.
- Si des douleurs apparaissent pendant les rapports.
- Si vous vous sentez triste, anxieuse ou dépassée : la santé mentale fait partie du suivi de grossesse. Votre sage-femme ou votre médecin peut vous écouter et vous orienter. En cas de pensées de vous faire du mal, appelez le **3114** (24 h/24) ; en cas de danger immédiat, le **15**.
- Saignements, perte de liquide ou contractions qui se rapprochent : contactez la maternité.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'désir', 'libido', 'couple'],
    sources: [S.tommysSexe, S.santeCouple, S.nhsInformSexe],
    status: 'to_review',
  },
  {
    slug: 'communication-couple-sexualite-grossesse',
    title: 'Parler de sexualité dans le couple pendant la grossesse',
    summary: 'Exprimer ses envies, ses limites et ses inquiétudes aide chacun à trouver sa place : des pistes concrètes pour en parler et garder le lien pendant la grossesse.',
    body_md: `La grossesse bouscule le quotidien, les habitudes et les moments à deux. La sexualité en fait partie. En parler n'est pas toujours facile — par pudeur, par peur de blesser ou d'être blessé — mais cela évite bien des malentendus et des non-dits qui pèsent.

## En bref
- Les envies changent pendant la grossesse, chez l'un comme chez l'autre ; en parler aide à ne pas interpréter un refus comme un rejet.
- Choisir un moment calme et parler en « je » facilite l'échange.
- Le lien peut se garder de bien des façons, pas seulement par les rapports.
- Le ou la partenaire cherche aussi sa place : l'impliquer aide le couple.
- Se sentir contrôlée, rabaissée, menacée ou forcée n'est pas un simple conflit : de l'aide existe (**3919**, et **17** ou **112** en cas de danger).

## Comprendre
Pendant la grossesse, chacun traverse ses propres changements : le corps de la personne enceinte se transforme, la fatigue et les inconforts s'installent parfois, et le ou la partenaire peut se sentir à la fois concerné et un peu à l'écart. Les envies évoluent souvent d'une semaine à l'autre. Sans parole, un « pas ce soir » peut être vécu comme un rejet, ou un geste tendre comme une demande. Mettre des mots permet de remettre chacun à sa place : on parle de ses envies, pas de la valeur de l'autre.

## Au quotidien
### Quelques pistes pour échanger
- Choisir un moment calme, en dehors de l'intimité, pour aborder le sujet.
- Parler en « je » : « J'ai moins envie en ce moment », « J'ai peur de te faire mal », « J'ai besoin de tendresse ».
- Dire ce qui est agréable, ce qui ne l'est plus, et ce qui pourrait l'être.
- Respecter le rythme de chacun : un « pas ce soir » n'est pas un rejet.
- Accepter que les envies évoluent, et refaire le point de temps en temps.

### Garder du lien autrement
- Partager des moments à deux, même courts : un repas, une promenade, un moment sans écran.
- Rester proches physiquement sans que cela mène forcément à un rapport.
- Se dire ce que l'on ressent face aux changements, aux examens, à l'arrivée du bébé.

### La place du ou de la partenaire
Il ou elle cherche souvent sa place auprès de l'enfant à venir. Être présent aux rendez-vous quand c'est possible, participer à la préparation à la naissance, partager les tâches et prendre aussi soin de sa propre santé fait partie du chemin.

## Questions fréquentes
**Comment aborder le sujet sans que cela tourne au reproche ?**
En parlant de ce que vous ressentez plutôt que de ce que l'autre fait, et en proposant des pistes plutôt que des bilans.

**Nos envies sont très différentes, est-ce un problème ?**
Un décalage est courant. Ce qui aide, c'est de pouvoir en parler et de trouver ensemble des façons de rester proches.

**Peut-on en parler à la sage-femme à deux ?**
Oui. Ces questions font partie du suivi, et venir ensemble peut faciliter la discussion.

## Quand demander conseil
- Si la sexualité devient source de souffrance pour l'un de vous, ou si des douleurs apparaissent : votre sage-femme ou votre médecin peut vous accompagner.
- Si vous vous sentez contrôlée, rabaissée, menacée ou forcée, ce n'est pas un simple conflit : vous pouvez en parler à votre sage-femme ou à votre médecin, en toute confidentialité. Le **3919** (Violences Femmes Info) est gratuit, anonyme et joignable 24 h/24. En cas de danger immédiat, appelez le **17** ou le **112**.
- En cas de détresse ou de pensées de vous faire du mal, appelez le **3114** (24 h/24).

Cet article vous informe et ne remplace pas l'accompagnement d'un professionnel de santé.`,
    journeys: ['pregnant'],
    category: 'sexualite',
    tags: ['sexualité', 'couple', 'communication', 'partenaire'],
    sources: [S.santeCouple, S.nhsInformSexe, S.tommysSexe],
    status: 'to_review',
  },
  {
    slug: 'sexualite-grossesse-quand-demander-conseil',
    title: 'Sexualité pendant la grossesse : quand demander conseil',
    summary: 'Saignements, douleurs, perte de liquide ou contractions qui se rapprochent doivent faire contacter un professionnel, sans gêne : les signes à connaître et comment en parler.',
    body_md: `Parler de sexualité avec un soignant peut sembler intimidant. Pourtant, ces questions font partie du suivi : votre sage-femme ou votre médecin les entend régulièrement, et y répondre aide à vivre la grossesse plus sereinement.

## En bref
- Saignements, perte de liquide, contractions douloureuses ou qui se rapprochent, douleur inhabituelle : contactez la maternité sans attendre.
- En cas de placenta bas inséré, de placenta prævia ou de fausses couches répétées, demandez ce qui est possible dans votre cas.
- Douleurs pendant les rapports, pertes ou démangeaisons inhabituelles : à signaler.
- Un risque d'infection sexuellement transmissible se dépiste et se traite aussi pendant la grossesse.
- Aucune question n'est déplacée.

## Comprendre
La plupart du temps, la sexualité pendant la grossesse ne pose pas de problème particulier, sauf avis médical contraire. Mais certains signes peuvent révéler une situation qui doit être examinée, qu'ils surviennent après un rapport ou à un autre moment. Les connaître permet de réagir vite, sans culpabilité : un rapport n'est pas « la faute » d'un saignement, et l'important est d'être vue.

## Au quotidien
- **Notez vos questions** avant le rendez-vous, pour ne pas les oublier.
- **Commencez simplement** : « J'ai une question sur la sexualité. » Le professionnel prendra le relais.
- **Demandez des précisions** si une restriction vous a été donnée : qu'est-ce qui est déconseillé, et pour combien de temps ?
- **Venez à deux** si cela vous aide.

## Questions fréquentes
**J'ai un peu saigné après un rapport, est-ce que je dois aller à la maternité ?**
Oui, contactez-la : des saignements doivent être examinés, surtout au 2e ou au 3e trimestre, même s'ils sont indolores. En attendant, évitez les rapports.

**On m'a dit « placenta bas », que puis-je faire ?**
Demandez à votre sage-femme ou à votre médecin ce qui est possible ou non dans votre cas : les consignes sont personnelles.

**Peut-on faire un dépistage d'IST pendant la grossesse ?**
Oui. Après un rapport à risque, parlez-en : un dépistage et un traitement sont possibles.

**C'est gênant d'en parler, comment faire ?**
Les professionnels abordent ces sujets régulièrement. Vous pouvez aussi écrire votre question et la montrer.

## Quand demander conseil
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

### En urgence
Saignements abondants, douleur intense, malaise : appelez le **15** ou le **112**.

Aucune question n'est déplacée. Cet article vous informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
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
    summary: 'Sur le dos, dans son propre lit, sans couette ni oreiller : les gestes simples qui réduisent le risque de mort inattendue du nourrisson, expliqués pas à pas.',
    body_md: `Les recommandations de couchage visent à réduire le risque de mort inattendue du nourrisson. Le coucher sur le dos a fait fortement baisser ce risque en France. Ces gestes valent pour la nuit comme pour chaque sieste, à la maison comme ailleurs.

## En bref
- **Sur le dos**, à plat, pour la nuit et toutes les siestes.
- Dans **son propre lit**, avec un matelas ferme et une **turbulette** : ni couette, ni oreiller, ni tour de lit, ni peluche.
- Dans la chambre des parents, idéalement jusqu'à environ 6 mois ; le partage du lit parental est déconseillé.
- Chambre entre **18 et 20 °C**, aérée, **sans fumée de tabac**.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**

## Comprendre
La mort inattendue du nourrisson survient le plus souvent pendant le sommeil, sans cause identifiée à l'avance. On ne peut pas tout prévenir, mais les études ont montré que l'environnement de sommeil compte beaucoup : la position sur le dos, un lit dégagé et une température modérée réduisent nettement le risque. C'est pourquoi les consignes sont précises et répétées par les soignants.

## Au quotidien
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

### En dehors de la maison
Les mêmes règles s'appliquent chez les grands-parents, chez l'assistante maternelle ou en vacances : un couchage sur le dos, dans un lit adapté et dégagé. Transmettez-les à toute personne qui garde votre bébé.

## Questions fréquentes
**Et s'il régurgite, ne risque-t-il pas de s'étouffer sur le dos ?**
La position sur le dos reste recommandée. Si les régurgitations vous inquiètent, parlez-en à votre médecin plutôt que de changer la position.

**Il se retourne tout seul sur le ventre, faut-il le remettre sur le dos ?**
Couchez-le toujours sur le dos. Quand il sait se retourner seul, inutile de le forcer à y rester.

**Peut-il dormir dans le transat ou le siège auto ?**
Ces équipements ne sont pas faits pour dormir longtemps ; pour le sommeil, préférez son lit, sur le dos.

**Peut-on mettre un petit tour de lit pour qu'il ne se cogne pas ?**
Non : rien dans le lit qui puisse couvrir son visage ou gêner sa respiration.

## Quand demander conseil
- Si vous êtes épuisé(e) : ne donnez jamais de médicament pour dormir à un bébé et ne le secouez jamais. Parlez de votre fatigue à votre médecin, à votre sage-femme ou à la PMI.
- Si vous avez des questions sur le couchage de votre bébé (prématurité, régurgitations, matériel) : votre médecin, votre sage-femme ou la PMI.
- Si bébé ne respire pas, ne réagit pas, est bleu ou très pâle : appelez immédiatement le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Les pleurs sont le langage du bébé et peuvent être intenses les premières semaines : comprendre, apaiser, et que faire si vous êtes à bout — sans jamais secouer.',
    body_md: `Tous les bébés pleurent, parfois beaucoup. Ce n'est pas le signe que vous faites mal : c'est leur principal moyen de communiquer. Les pleurs peuvent pourtant épuiser et faire douter. Voici des repères pour comprendre, apaiser, et vous protéger quand vous êtes à bout.

## En bref
- En moyenne, un bébé pleure environ deux heures par jour au total.
- Les « pleurs du soir » sont souvent plus intenses vers 6 à 8 semaines, puis s'atténuent vers la fin du troisième mois.
- Vérifier les besoins, porter, bercer, réduire la stimulation peut apaiser — mais pas toujours.
- Si vous êtes à bout : posez bébé sur le dos dans son lit et faites une pause.
- **Ne secouez jamais un bébé.** Urgence : **15** ou **112**.

## Comprendre
Un bébé ne peut pas dire ce qui ne va pas : il pleure pour signaler la faim, la fatigue, un inconfort, ou simplement un besoin de contact. Certains pleurs n'ont pas de cause identifiable et passent avec le temps. En fin de journée, beaucoup de bébés pleurent davantage : on parle de « pleurs du soir ». Ils apparaissent souvent après les premières semaines, sont plus intenses vers 6 à 8 semaines, puis s'atténuent vers la fin du troisième mois.

Le secouement, même bref, peut provoquer des lésions graves du cerveau, voire la mort : c'est pourquoi il est essentiel de savoir faire une pause avant d'être submergé.

## Au quotidien
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

### Préparer les moments difficiles
- Prévoyez à l'avance qui appeler en cas de soirée difficile.
- Relayez-vous si vous êtes deux ; prévenez toute personne qui garde votre bébé qu'il ne faut jamais le secouer.

## Questions fréquentes
**Est-ce que je le rends « capricieux » en le prenant dans les bras ?**
Non : répondre à ses pleurs l'aide à se sentir en sécurité.

**Pourquoi pleure-t-il toujours le soir ?**
Les pleurs du soir sont fréquents pendant les premiers mois et s'atténuent souvent vers la fin du troisième mois.

**J'ai tout essayé et il pleure encore, est-ce que je fais mal ?**
Non. Certains pleurs ne se calment pas tout de suite, quoi qu'on fasse. Votre présence compte, même quand les pleurs continuent.

**Peut-on secouer « juste un peu » pour le calmer ?**
Jamais. Même quelques secondes peuvent provoquer des lésions graves.

## Quand demander conseil
- Pleurs inhabituels, très prolongés, ou bébé geignard, mou, qui semble souffrir : consultez.
- Bébé qui refuse de boire, vomit, a de la fièvre : consultez ; avant 3 mois, toute fièvre impose une consultation en urgence.
- Si vous êtes épuisé(e) ou débordé(e) : votre médecin, votre sage-femme ou la PMI peuvent vous aider.
- **Urgence** : si un bébé a été secoué ou présente une somnolence inhabituelle, des convulsions, des difficultés à respirer, appelez le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Peau à peau, tétées à la demande, repérage des signes d’éveil : les clés des premiers jours, et quand demander à un professionnel d’observer une tétée.',
    body_md: `Démarrer un allaitement prend du temps et s'apprend, pour le bébé comme pour vous. Les débuts peuvent être hésitants : c'est fréquent, et de l'aide existe à chaque étape.

## En bref
- Le **peau à peau** après la naissance aide beaucoup de bébés à trouver le sein.
- Les tétées se font **à la demande**, en moyenne 8 à 12 par 24 heures au démarrage.
- Repérer les **signes d'éveil** permet de proposer le sein avant les pleurs.
- Le repère le plus significatif d'un allaitement efficace est une **bonne prise de poids**, suivie par un professionnel.
- Douleur, tétées très courtes ou très longues, inquiétude : demandez à quelqu'un d'observer une tétée.

## Comprendre
Le lait se met en place progressivement : plus bébé tète efficacement, plus la production s'ajuste à ses besoins. C'est pourquoi les tétées fréquentes, y compris la nuit, sont utiles au début. Le nouveau-né, lui, apprend à coordonner succion, déglutition et respiration. Ce rodage peut prendre quelques jours à quelques semaines.

## Au quotidien
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

### Prendre soin de vous
- Installez-vous confortablement, dos soutenu, avec de l'eau à portée de main.
- Reposez-vous quand bébé dort et acceptez l'aide pour le reste.
- Notez les tétées dans l'application si cela vous aide à vous repérer, sans en faire une source de pression.

## Questions fréquentes
**Comment savoir s'il boit assez ?**
Le meilleur repère est sa prise de poids, suivie par un professionnel. Un bébé qui avale régulièrement pendant la tétée est aussi un bon signe.

**Est-ce que ça doit faire mal ?**
Un allaitement douloureux mérite d'être signalé : souvent, un ajustement de la position ou de la prise du sein aide.

**Il veut téter très souvent, ai-je assez de lait ?**
Les tétées fréquentes sont habituelles au démarrage et entretiennent la lactation. En cas de doute, faites peser bébé et demandez conseil.

**Puis-je arrêter si cela ne me convient pas ?**
C'est votre décision. Vous pouvez être accompagnée dans ce choix, quel qu'il soit.

## Quand demander conseil
- Tétées très courtes (moins de 5 minutes) ou très longues (plus de 30 à 45 minutes) de façon répétée.
- Allaitement douloureux, crevasses, sein rouge, chaud ou douloureux, fièvre.
- Inquiétude sur la prise de poids, bébé qui semble peu éveillé ou mouille peu ses couches.
- Votre sage-femme, la maternité, la PMI ou votre médecin peuvent observer une tétée et vous conseiller.
- Bébé très somnolent, mou, qui refuse de boire ou respire difficilement : appelez le **15** ou le **112**.

Et si vous choisissez de ne pas allaiter, ou d'arrêter, vous pouvez aussi être accompagnée dans ce choix. Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Une mesurette rase pour 30 ml d’eau, un biberon préparé juste avant, jamais réchauffé au micro-ondes : la préparation et l’hygiène étape par étape.',
    body_md: `Bien préparer un biberon limite le risque d'infection et assure un lait correctement dosé. Les gestes sont simples, mais quelques détails comptent : l'eau, le dosage, la conservation et le nettoyage.

## En bref
- Mains lavées, biberon propre et sec.
- Eau du robinet froide ou eau en bouteille adaptée aux nourrissons.
- **Une mesurette rase de poudre pour 30 ml d'eau**, sans tasser.
- Biberon préparé juste avant la tétée ; jamais de biberon entamé gardé pour plus tard.
- Jamais de réchauffage au micro-ondes. Les quantités et le rythme se décident avec votre médecin ou la PMI.

## Comprendre
Le lait infantile en poudre n'est pas stérile, et un biberon préparé offre un bon milieu aux microbes s'il reste longtemps à température ambiante. C'est pourquoi on le prépare au dernier moment et on respecte des délais de consommation courts. Le dosage, lui, compte pour l'équilibre du lait : trop ou pas assez de poudre modifie sa composition. L'application ne recommande ni quantité ni rythme : ils dépendent de votre bébé et se discutent avec un professionnel, en suivant aussi la notice du lait.

## Au quotidien
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
Rincez, puis lavez à l'eau chaude avec du liquide vaisselle et un goupillon. La stérilisation n'est pas nécessaire. Séchez à l'air libre, démonté, tête en bas.

## Questions fréquentes
**Peut-on préparer les biberons de la nuit à l'avance ?**
Idéalement, préparez-les juste avant. Pour gagner du temps, vous pouvez préparer à l'avance l'eau et la poudre séparément, et les mélanger au moment de la tétée.

**Faut-il faire bouillir l'eau du robinet ?**
L'eau du robinet froide peut être utilisée après l'avoir laissée couler quelques secondes, sauf situation particulière (plomb, avis local).

**Combien de lait doit-il boire ?**
Cela dépend de l'âge et de l'appétit de votre bébé. L'application ne recommande pas de quantité : demandez conseil à votre médecin ou à la PMI, et suivez la notice de votre lait.

**Peut-on changer de lait facilement ?**
Parlez-en d'abord à votre médecin ou à votre pharmacien.

## Quand demander conseil
- Si votre bébé boit très peu, refuse les biberons, vomit souvent ou semble inconfortable après les repas.
- Si vous avez un doute sur l'eau de votre logement, le choix du lait ou le dosage.
- Si votre bébé a de la fièvre avant 3 mois, semble très somnolent, mou, ou respire difficilement : appelez le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis de votre médecin, de la PMI ou les indications de la notice du lait.`,
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
    summary: 'Avant 3 mois, toute fièvre impose une consultation en urgence ; à tout âge, c’est surtout l’état général du bébé qui compte : les signes à surveiller et que faire.',
    body_md: `La fièvre est fréquente chez les bébés et souvent liée à une infection virale bénigne. Mais chez les tout-petits, elle doit toujours être prise au sérieux, et c'est l'état général de l'enfant qui guide la conduite à tenir.

## En bref
- On parle de fièvre à partir de **38 °C**, mesurée de préférence par voie rectale chez les moins de 2 à 3 ans.
- **Avant 3 mois**, toute fièvre impose une consultation en urgence, le jour même.
- À tout âge : difficultés à respirer, bébé mou ou somnolent, refus de boire, taches qui ne s'effacent pas… appelez le **15**.
- Ne pas trop couvrir, proposer souvent à boire, pas de bain froid.
- Les médicaments contre la fièvre se donnent selon l'avis du médecin ou du pharmacien.

## Comprendre
La fièvre est une réaction du corps face à une infection. Elle n'est pas une maladie en soi, et son chiffre seul ne dit pas si la situation est grave. Chez le très jeune nourrisson, en revanche, les défenses sont encore immatures et une infection peut évoluer vite : c'est pourquoi un bébé de moins de 3 mois qui a de la fièvre doit être vu en urgence, même s'il semble aller bien.

### Bien prendre la température
- Thermomètre électronique, par voie rectale de préférence chez les tout-petits.
- Prenez-la au calme, pas juste après un bain ou un repas chaud.
- Notez l'heure et la valeur : cela aidera le médecin.

## Au quotidien
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
- Observez-le : comment il boit, comment il réagit, sa respiration, la couleur de sa peau, ses couches.

## Questions fréquentes
**À partir de quelle température faut-il s'inquiéter ?**
Avant 3 mois, dès 38 °C. Ensuite, c'est surtout son comportement qui compte : un bébé qui joue et boit inquiète moins qu'un bébé mou, même avec une température plus basse. Au-dessus de 40 °C, consultez en urgence.

**Faut-il le réveiller pour prendre sa température ?**
S'il dort calmement et respire normalement, vous pouvez surveiller. S'il vous semble difficile à réveiller, c'est un signe d'urgence.

**La poussée dentaire donne-t-elle de la fièvre ?**
Ne mettez pas une fièvre sur le compte des dents sans avis médical, surtout chez un petit nourrisson.

## Quand demander conseil
### Appelez le 15 ou le 112, ou consultez en urgence
- tout nourrisson de moins de 3 mois avec de la fièvre ;
- et à tout âge, l'un des signes listés ci-dessus (respiration difficile, somnolence, refus de boire, taches, convulsions…).

### Consultez dans la journée
- fièvre de plus de 2 jours avant 2 ans, fièvre qui revient, maladie chronique, autre symptôme inquiétant.

C'est l'état général de votre bébé qui compte plus que le chiffre du thermomètre. Vous le connaissez : en cas de doute, consultez. Cet article vous informe et ne remplace pas l'avis d'un médecin.`,
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
    summary: 'Récupération, fatigue, émotions et rendez-vous de suivi : ce qui vous attend dans les semaines après l’accouchement, et les signes qui doivent faire consulter.',
    body_md: `Après la naissance, toute l'attention se porte souvent sur le bébé. Votre corps et votre moral ont pourtant besoin de temps et de soins. Les semaines qui suivent l'accouchement sont une période de récupération à part entière, avec un suivi prévu pour vous.

## En bref
- Le corps a besoin de plusieurs semaines pour récupérer ; la fatigue est fréquente.
- Une sage-femme peut venir à domicile, puis un **entretien postnatal précoce** et une **consultation postnatale** sont prévus.
- Le baby blues est fréquent les premiers jours ; si la tristesse ou l'anxiété durent, parlez-en.
- Saignements très abondants : appelez le **15**.
- Pensées de vous faire du mal : **3114** ; confusion, perte de contact avec la réalité : **15** ou **112**.

## Comprendre
### La récupération
- L'utérus met environ deux mois à reprendre sa taille ; des contractions (les tranchées) sont fréquentes au début, en particulier pendant les tétées.
- La fatigue est fréquente : grossesse, accouchement, nuits hachées. Faites de petites siestes quand bébé dort et acceptez l'aide proposée.
- Ne faites pas de régime si vous allaitez, et pas avant 3 mois sinon. Buvez régulièrement.

### Le suivi prévu
- Une sage-femme peut venir à domicile jusqu'au 12e jour du bébé, avec deux séances supplémentaires possibles ensuite.
- **Entretien postnatal précoce** entre la 4e et la 8e semaine, pour parler de votre ressenti.
- **Consultation postnatale** entre la 6e et la 8e semaine : examen, allaitement, contraception, et rééducation du périnée si besoin.
- La reprise du sport se fait progressivement, après avis médical.

### Les émotions
Le baby blues (larmes, irritabilité, hypersensibilité) est fréquent les premiers jours et passe en général vite. Parlez-en si la tristesse, l'anxiété ou l'épuisement durent, s'aggravent, ou si vous vous sentez détachée de votre bébé.

## Au quotidien
- **Reposez-vous dès que possible** : siestes quand bébé dort, visites limitées si vous en avez besoin.
- **Acceptez et demandez de l'aide** pour les repas, le ménage, les courses, les aînés.
- **Mangez et buvez régulièrement**, sans régime restrictif.
- **Notez vos questions** pour les rendez-vous avec la sage-femme et le médecin.
- **Prenez des nouvelles de vous** : comment vous dormez, comment vous vous sentez. Le point du jour de l'application peut vous y aider.

## Questions fréquentes
**Combien de temps durent les saignements après l'accouchement ?**
Ils diminuent progressivement sur plusieurs semaines. Des saignements très abondants, ou qui augmentent, doivent faire consulter sans attendre.

**Quand reprendre le sport ?**
Progressivement, après avis médical, en tenant compte de la rééducation du périnée si elle est nécessaire.

**Le baby blues, est-ce une dépression ?**
Le baby blues est fréquent et passe vite. Si la tristesse dure, s'intensifie ou vous empêche de vivre, parlez-en : une dépression du post-partum se soigne.

## Quand demander conseil
### Consultez sans attendre si
- saignements très abondants : c'est une urgence, appelez le **15** ;
- fièvre, saignements anormaux, pertes malodorantes ;
- douleur ou gêne dans le bas du ventre ;
- fuites urinaires ou gêne au niveau du périnée (à signaler, une rééducation est possible).

### En cas de détresse
Pensées de vous faire du mal : appelez le **3114** (24 h/24, gratuit). Confusion, propos incohérents, impression de perdre le contact avec la réalité, ou pensées de faire du mal à votre bébé : appelez le **15** ou le **112**. Ces pensées ne sont pas honteuses : elles signalent qu'il faut de l'aide, maintenant.

Cet article vous informe et ne remplace pas l'avis de votre sage-femme ou de votre médecin.`,
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
    summary: 'Avant 4 à 6 mois, se réveiller toutes les 2 à 4 heures fait partie du développement du bébé : comprendre son sommeil, l’aider à distinguer jour et nuit, et vous préserver.',
    body_md: `Les nuits avec un nouveau-né sont souvent courtes et hachées. Ce n'est ni un échec ni le signe d'une mauvaise habitude : c'est la façon dont dort un très jeune bébé. Comprendre son rythme aide à traverser cette période avec un peu plus de sérénité.

## En bref
- Un nouveau-né dort en moyenne 16 à 17 heures par 24 heures, en périodes de 3 à 4 heures.
- **Avant 4 à 6 mois, se réveiller après 2 à 4 heures de sommeil fait partie de son développement.**
- Lumière et activité le jour, calme et pénombre la nuit l'aident à distinguer les deux.
- Toujours recoucher bébé sur le dos, dans son propre lit — jamais de sommeil partagé sur un canapé.
- Se relayer et accepter de l'aide protège votre santé.

## Comprendre
### Comment dort un nouveau-né
- Il dort en moyenne 16 à 17 heures par 24 heures, réparties en périodes de 3 à 4 heures, sans faire de différence entre le jour et la nuit au début.
- Son rythme est réglé par la maturation de son cerveau, pas seulement par la faim.
- Avant 4 à 6 mois, se réveiller après 2 à 4 heures de sommeil est attendu à cet âge.
- En moyenne, les nuits s'allongent entre 4 et 6 mois, mais chaque bébé a son propre rythme, et certains prennent plus de temps.

## Au quotidien
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
- Se relayer quand c'est possible : l'un prend la première partie de nuit, l'autre la seconde.
- Faire des siestes dans la journée, même courtes.
- Accepter l'aide de l'entourage pour le reste de la maison.

## Questions fréquentes
**Quand fera-t-il ses nuits ?**
En moyenne, les nuits s'allongent entre 4 et 6 mois, mais chaque bébé a son rythme. Il n'y a pas d'âge précis à atteindre.

**Faut-il le réveiller pour manger ?**
Inutile de réveiller un nouveau-né qui dort, sauf consigne médicale (par exemple pour la prise de poids).

**Un biberon plus gros le soir l'aidera-t-il à dormir plus longtemps ?**
Non, un plus gros biberon le soir ne prolonge pas le sommeil.

**Il dort mieux contre moi, est-ce grave ?**
Le contact le rassure, mais pour dormir, recouchez-le sur le dos dans son lit, surtout si vous risquez de vous endormir.

## Quand demander conseil
- Si vous êtes épuisé(e) ou si la fatigue pèse sur votre moral : parlez-en à votre sage-femme, votre médecin ou la PMI.
- Si votre bébé pleure de façon inhabituelle, boit mal, a de la fièvre ou semble très somnolent : consultez.
- Si vous sentez que vous pourriez perdre le contrôle : posez bébé dans son lit et appelez le **119** ou Allô Parents Bébé (**0 800 00 34 56**).
- Bébé qui respire difficilement ou ne réagit pas : **15** ou **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Le peau à peau et le portage répondent au besoin de proximité du bébé : leurs bienfaits, et les règles de sécurité pour garder son visage visible et sa respiration libre.',
    body_md: `Être tout contre vous rappelle au bébé la chaleur et les sensations de la vie avant la naissance. Peau à peau et portage sont deux façons de répondre à ce besoin de proximité, pour la mère comme pour l'autre parent.

## En bref
- Le peau à peau peut aider à apaiser bébé, à réguler sa température et facilite souvent la première tétée.
- Le co-parent peut aussi le pratiquer.
- En portage : bébé vertical, assez haut, **visage toujours visible**, voies respiratoires libres.
- Restez éveillé(e) pendant le peau à peau ; si le sommeil vient, recouchez bébé dans son lit, sur le dos.
- Un atelier avec une sage-femme ou à la PMI aide à bien s'installer.

## Comprendre
Un nouveau-né a besoin de contact : la chaleur, l'odeur, la voix et les battements de cœur de ses parents le rassurent. Le peau à peau et le portage répondent à ce besoin tout en vous laissant, pour le portage, les mains libres. Ils demandent cependant quelques précautions, car un tout-petit ne peut pas dégager lui-même son nez et sa bouche s'ils sont couverts.

## Au quotidien
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
Surveillez sa couleur, sa respiration et sa température. Un atelier de portage avec une sage-femme ou à la PMI peut vous aider à bien vous installer.

## Questions fréquentes
**À partir de quand peut-on porter son bébé ?**
Dès les premiers jours, en respectant les règles de sécurité et avec un moyen de portage adapté à son âge et à son poids.

**Peut-on faire du peau à peau après une césarienne ?**
Oui, selon votre état ; le co-parent peut aussi prendre le relais.

**Peut-on le porter face au monde ?**
mpedia déconseille le portage face au monde.

**Peut-il dormir en écharpe ?**
Il peut s'endormir contre vous si son visage reste visible et sa respiration libre ; restez attentif(ve). Pour le sommeil prolongé, recouchez-le dans son lit, sur le dos.

## Quand demander conseil
- Si vous ne savez pas comment installer bébé, ou si vous avez mal au dos : un atelier de portage peut aider.
- Si votre bébé est né prématurément ou a un problème de santé : demandez conseil avant de le porter.
- Si bébé devient pâle, bleu, respire difficilement ou ne réagit pas : appelez immédiatement le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Les besoins de sommeil diminuent progressivement entre 1 et 6 ans : repères d’heures et de siestes, rituel du coucher, réveils, cauchemars et quand en parler.',
    body_md: `Entre 1 et 6 ans, le sommeil de l'enfant change beaucoup : les siestes disparaissent peu à peu, les nuits s'organisent, et les grandes étapes de la vie peuvent les bousculer. Les repères ci-dessous sont des moyennes : chaque enfant a ses propres besoins.

## En bref
- Environ 13 à 14 heures par 24 heures vers 1 an, 12 à 13 heures vers 3 ans, 12 heures vers 6 ans.
- La sieste du matin disparaît souvent vers 18 mois ; celle de l'après-midi s'arrête souvent vers 4 ans.
- Des horaires réguliers et un rituel calme aident à l'endormissement.
- Pas d'écran dans la chambre, et arrêt des écrans 1 à 2 heures avant le coucher.
- Il n'existe pas de médicament du sommeil adapté aux jeunes enfants.

## Comprendre
### Combien d'heures ?
- Vers 1 an : environ 13 à 14 heures par 24 heures.
- Vers 3 ans : environ 12 à 13 heures, avec une sieste en début d'après-midi.
- Vers 6 ans : environ 12 heures.
- La sieste du matin disparaît souvent vers 18 mois ; celle de l'après-midi diminue vers 3 ans et s'arrête souvent vers 4 ans, selon les besoins.

### Les réveils
Se réveiller brièvement entre deux cycles de sommeil fait partie du sommeil de tous. La difficulté vient surtout du fait de ne pas réussir à se rendormir seul. Des étapes de vie (marche, nouveau mode de garde, déménagement, arrivée d'un bébé) peuvent perturber les nuits pour un temps.

## Au quotidien
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

### Un exemple de rituel
Dîner, bain ou toilette, pyjama, brossage des dents, une histoire dans le lit, un câlin, la veilleuse, puis « bonne nuit ». Toujours dans le même ordre, sur un temps assez court : la répétition rassure.

## Questions fréquentes
**Mon enfant ne veut plus faire la sieste, faut-il l'y obliger ?**
Les besoins diminuent avec l'âge. Un temps calme dans la journée peut remplacer la sieste ; s'il est très fatigué en fin de journée, avancez un peu le coucher.

**Il se réveille toutes les nuits depuis l'entrée à la crèche, que faire ?**
Les changements de vie perturbent souvent le sommeil pour un temps. Gardez le rituel et des horaires réguliers, et rassurez-le brièvement la nuit.

**Peut-on lui donner quelque chose pour l'aider à dormir ?**
Il n'existe pas de médicament du sommeil adapté aux jeunes enfants. Parlez-en à votre médecin si les difficultés durent.

## Quand demander conseil
- Si les difficultés de sommeil durent, si l'enfant semble très fatigué ou irritable dans la journée : votre médecin ou pédiatre.
- S'il ronfle fort, fait des pauses respiratoires ou semble mal respirer en dormant : parlez-en à votre médecin.
- Si la fatigue des parents devient lourde à porter : parlez-en aussi, pour vous.
- Difficulté à respirer, enfant inconscient ou convulsions : appelez le **15** ou le **112**.

Cet article vous informe et ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Pas d’écran avant 3 ans, puis des temps courts et partagés : pourquoi ces repères existent et comment les appliquer sans culpabiliser, avec des idées concrètes pour toute la famille.',
    body_md: `Les écrans font partie du quotidien de toute la famille : téléphone pour joindre un proche, télévision le soir, tablette en voyage. Les recommandations officielles ne cherchent pas à culpabiliser les parents. Elles visent à protéger ce dont un jeune enfant a le plus besoin pour se développer : des échanges, du mouvement, du jeu et du sommeil.

## En bref
- Avant 3 ans, les recommandations officielles sont claires : **pas d'écran**, à l'exception des appels vidéo avec des proches.
- De 3 à 6 ans : des temps courts, au maximum 30 à 40 minutes par jour, avec des programmes adaptés et de préférence regardés **avec** un adulte.
- Pas d'écran pendant les repas, dans la chambre ni dans l'heure ou les deux heures qui précèdent le coucher.
- L'exemple des adultes compte autant que les règles : ce sont les échanges avec vous qui nourrissent le plus son développement.

## Comprendre
Un jeune enfant apprend en manipulant, en bougeant, en imitant et surtout en interagissant avec les personnes qui l'entourent. Quand il babille et que vous lui répondez, quand il montre un objet et que vous le nommez, son langage se construit. Un écran, même avec un programme dit « éducatif », ne répond pas à ses gestes ni à ses regards de la même façon.

C'est pourquoi l'Assurance Maladie rappelle que, même courte, l'exposition aux écrans des tout-petits peut avoir des effets sur le langage, l'attention, le sommeil ou la motricité fine. Certaines sociétés savantes conseillent même d'attendre 6 ans. Depuis juillet 2025, les écrans sont d'ailleurs interdits pour les enfants dans les lieux d'accueil de la petite enfance.

Il existe une exception qui fait consensus : les appels vidéo avec des proches éloignés, grands-parents ou parent en déplacement. Ce sont de vrais échanges, avec quelqu'un qui répond à l'enfant.

Les écrans allumés « en fond », même si personne ne les regarde, captent aussi l'attention : ils réduisent les échanges entre l'adulte et l'enfant et interrompent le jeu.

## Au quotidien
**Avant 3 ans**
- Pour calmer un bébé qui pleure, privilégiez un câlin, le calme, une musique douce, une promenade.
- Rangez les écrans hors de sa vue quand vous jouez avec lui.
- Lors d'un trajet ou d'une salle d'attente, prévoyez un petit livre, un jouet, une comptine.

**De 3 à 6 ans**
- Choisissez à l'avance un programme adapté, court, avec un début et une fin, plutôt qu'un défilement sans fin.
- Regardez **avec** l'enfant et parlez-en ensuite : ce qu'il a compris, ce qu'il a ressenti.
- Pas de tablette personnelle à cet âge.

**Pour toute la famille**
- Pas d'écran pendant les repas : c'est un moment d'échange précieux.
- Pas de télévision ni de tablette dans la chambre de l'enfant.
- Arrêt des écrans 1 à 2 heures avant le coucher, pour faciliter l'endormissement.
- Évitez l'écran comme récompense ou comme moyen d'apaiser : l'enfant apprend alors à compter sur lui pour se calmer.
- Des règles communes, que les adultes respectent aussi, sont plus faciles à tenir.

**Des alternatives simples** : livres, jeux de construction, pâte à modeler, feutres, cuisine ensemble, sorties au parc, chansons. Il n'est pas nécessaire d'animer chaque minute : s'ennuyer un peu aide aussi l'enfant à inventer ses propres jeux.

## Questions fréquentes
**Mon enfant a déjà regardé des écrans avant 3 ans : est-ce grave ?**
Il n'y a pas lieu de culpabiliser. L'important est ce que vous faites à partir de maintenant : réduire progressivement, remplacer par des moments partagés. Si vous avez une inquiétude sur son langage ou son attention, parlez-en à votre médecin.

**Et les dessins animés « éducatifs » ?**
Avant 3 ans, ils ne remplacent pas les échanges réels. Après 3 ans, un programme court, adapté à l'âge et regardé ensemble peut avoir sa place.

**Comment faire quand j'ai besoin de quelques minutes de calme ?**
Un coin de jeux sécurisé, des livres en tissu, une boîte de « trésors » à explorer, un jeu d'eau sous surveillance : préparer quelques activités à l'avance aide beaucoup.

**Comment gérer les écrans chez les grands-parents ou la nounou ?**
En parlant des repères ensemble, simplement. Harmoniser les habitudes entre les adultes aide l'enfant à s'y retrouver.

## Quand demander conseil
Parlez-en à votre médecin ou à la PMI si :
- votre enfant parle peu pour son âge ou semble moins réagir à votre voix ;
- il a du mal à jouer seul quelques minutes ou à rester attentif ;
- il a des difficultés d'endormissement ou des nuits très agitées ;
- il réclame les écrans avec beaucoup de colère et vous vous sentez débordé(e).

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé qui connaît votre enfant.`,
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
    summary: 'Deux brossages par jour avec la bonne quantité de dentifrice fluoré selon l’âge, de l’eau comme boisson, peu de grignotage et un dentiste chaque année : le guide pratique des dents de lait.',
    body_md: `Les dents de lait ne sont pas « provisoires » au point d'être secondaires : elles servent à mâcher, à bien prononcer, à sourire, et elles gardent la place des dents définitives. Une carie sur une dent de lait peut faire mal, gêner l'alimentation et le sommeil. Bonne nouvelle : quelques habitudes simples, prises tôt, protègent beaucoup.

## En bref
- Brossage **deux fois par jour**, matin et soir, pendant environ 2 minutes, avec l'aide d'un adulte pour les plus jeunes.
- Dentifrice fluoré en quantité adaptée : **une trace** jusqu'à 3 ans, **un petit pois** de 3 à 6 ans, environ un tiers de la brosse ensuite.
- **De l'eau** comme boisson, trois à quatre prises alimentaires par jour plutôt que du grignotage.
- Pas de biberon de lait ou de boisson sucrée pour s'endormir.
- Un dentiste **une fois par an**, même sans problème visible.

## Comprendre
Les caries apparaissent quand les sucres restent longtemps au contact des dents : les bactéries de la bouche les transforment en acides qui attaquent l'émail. Ce n'est donc pas seulement la quantité de sucre qui compte, mais aussi **la fréquence** : grignoter ou boire sucré souvent, ou garder un biberon en bouche pour dormir, expose les dents en continu.

Le fluor du dentifrice renforce l'émail. Sa quantité doit être adaptée à l'âge, car un jeune enfant avale une partie du dentifrice : c'est pourquoi l'Assurance Maladie recommande une trace avant 3 ans et un petit pois de 3 à 6 ans. La quantité de fluor est indiquée sur le tube ; en cas de doute, demandez à votre dentiste ou à votre pharmacien.

## Au quotidien
**Le brossage**
- Une brosse souple, adaptée à l'âge, changée environ tous les trois mois ou quand les poils s'écartent.
- Pour les plus jeunes, installez-vous derrière l'enfant ou allongez-le, tête sur vos genoux : on voit mieux toutes les dents.
- Brossez toutes les faces, sans oublier les dents du fond.
- Le soir, le brossage se fait après le dernier repas : ensuite, plus que de l'eau.
- Laissez l'enfant essayer seul, puis repassez derrière lui : la dextérité vient avec le temps.

**Les habitudes qui protègent**
- De l'eau pendant et entre les repas ; les jus et sodas restent occasionnels.
- Des repas et un goûter à heures régulières plutôt que des petites prises tout au long de la journée.
- Des aliments à croquer (fruits, légumes) qui font travailler la mâchoire.
- Éviter d'endormir l'enfant avec un biberon de lait ou de boisson sucrée.

**Rendre le brossage agréable** : une chanson qui dure à peu près le temps du brossage, un sablier, brosser en même temps que lui, le laisser choisir sa brosse. Un enfant réticent un soir n'est pas un échec : on recommence le lendemain, calmement.

## Questions fréquentes
**À partir de quand faut-il brosser les dents ?**
Dès que les premières dents apparaissent, avec une brosse adaptée et une trace de dentifrice fluoré.

**Mon enfant avale le dentifrice, est-ce un problème ?**
C'est fréquent chez les petits, d'où l'importance de la bonne quantité. Apprenez-lui progressivement à cracher.

**Quand faire la première visite chez le dentiste ?**
Une visite par an est recommandée. De 3 à 24 ans, des examens de prévention sont pris en charge dans le cadre du programme « M'T dents tous les ans ».

**Les dents de lait abîmées ont-elles des conséquences ?**
Une carie peut faire mal et s'aggraver ; elle mérite d'être soignée. Le dentiste vous expliquera ce qui convient selon l'âge.

## Quand demander conseil
Prenez rendez-vous avec un dentiste sans attendre la visite annuelle si vous remarquez :
- une tache brune ou noire sur une dent ;
- une douleur, une gêne pour manger ou une joue gonflée ;
- une gencive rouge, gonflée ou qui saigne ;
- une dent abîmée, déplacée ou cassée après une chute.

En cas de chute avec saignement important ou de choc à la tête, appelez le 15.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un dentiste ou d'un médecin.`,
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
    summary: 'Les colères font partie du développement, surtout vers 2 ans : comprendre ce qui se joue, que faire pendant et après la crise, comment en prévenir certaines et prendre soin de vous.',
    body_md: `Les colères sont très fréquentes chez les jeunes enfants. Elles ne signifient pas que vous vous y prenez mal ni que votre enfant est « difficile » : il découvre des émotions très fortes avant d'avoir les mots et la maturité pour les exprimer autrement. Votre rôle n'est pas d'empêcher toute colère, mais de l'aider, peu à peu, à les traverser.

## En bref
- Les colères font partie du développement, en particulier vers 2 ans, à l'âge du « non ».
- Pendant la crise : assurer la sécurité, rester aussi calme que possible, poser une limite claire sans crier ni menacer.
- Mettre des mots sur l'émotion aide l'enfant à la reconnaître et, plus tard, à la dire.
- Après la tempête : se retrouver, puis valoriser les progrès, même petits.
- Vous avez le droit de vous éloigner un instant (enfant en sécurité) et de demander un relais.

## Comprendre
**Avant 2 ans**, l'enfant peut taper, mordre ou se jeter par terre : il n'a pas encore le langage pour dire ce qu'il veut ou ce qui le gêne.

**Vers 2 ans**, c'est la période du « non ». L'enfant découvre qu'il est une personne distincte de vous et veut décider. Il supporte mal la frustration : un gâteau cassé, un jeu qu'il faut quitter, un vêtement qu'il ne veut pas mettre peuvent déclencher une tempête.

**Après 3 ans**, l'agressivité physique diminue en général et devient plus verbale, à mesure que le langage et la capacité à patienter se développent.

La fatigue, la faim, les changements (déménagement, naissance d'un frère ou d'une sœur, entrée à la crèche ou à l'école) rendent les colères plus fréquentes. Les repérer aide à anticiper.

## Au quotidien
**Pendant la colère**
- Assurez sa sécurité et celle des autres : éloignez ce qui pourrait le blesser.
- Restez aussi calme que possible. Votre calme lui sert de repère pour retrouver le sien.
- Dites clairement ce qui n'est pas acceptable : « Je ne te laisse pas taper. » Une phrase courte, ferme, sans crier.
- Nommez l'émotion : « Tu es très en colère parce qu'on doit partir du parc. » Comprendre n'est pas céder.
- Évitez les longues explications en pleine crise : il ne peut pas les entendre à ce moment-là.

**Après la tempête**
- Un câlin ou un moment calme pour se retrouver, s'il en a envie.
- Quelques mots simples sur ce qui s'est passé, sans le sermonner.
- Félicitez les efforts : un enfant souvent repris a aussi besoin d'être valorisé.

**Pour prévenir certaines colères**
- Des règles simples, peu nombreuses, les mêmes pour tous les adultes.
- Prévenir avant une transition : « Encore deux toboggans, puis on rentre. »
- Proposer des choix limités : « Le pull rouge ou le bleu ? »
- Des moments calmes partagés et des activités pour se dépenser chaque jour.
- Montrer l'exemple : rester posé lors d'un désaccord entre adultes.

**Prendre soin de vous** : si vous sentez la colère monter, vous pouvez vous éloigner quelques instants en laissant l'enfant en sécurité, respirer, puis revenir. Demander un relais à l'autre parent ou à un proche n'est pas un échec.

## Questions fréquentes
**Faut-il céder pour que la crise s'arrête ?**
Céder à chaque fois apprend à l'enfant que la colère est un moyen d'obtenir. Vous pouvez reconnaître son émotion tout en gardant la limite.

**Et s'il fait une colère en public ?**
Mettez-le en sécurité, isolez-vous un peu si c'est possible et gardez votre calme. Le regard des autres pèse, mais votre enfant a surtout besoin de vous.

**Les punitions sont-elles utiles ?**
Les cris, les menaces et les punitions physiques n'aident pas l'enfant à apprendre à gérer ses émotions. Une limite claire, répétée calmement, est plus efficace sur la durée.

**Mon enfant mord à la crèche, que faire ?**
C'est fréquent chez les tout-petits qui n'ont pas encore les mots. Parlez-en avec l'équipe pour adopter la même réponse : arrêter le geste, s'occuper de l'enfant mordu, nommer l'émotion.

## Quand demander conseil
Parlez-en à votre médecin, à la PMI ou à un psychologue si :
- les colères sont très fréquentes ou très intenses, ou augmentent avec le temps ;
- votre enfant n'arrive pas à se calmer, même avec votre aide ;
- il se fait mal ou blesse régulièrement les autres ;
- il semble triste, en retrait ou en souffrance ;
- vous vous sentez à bout ou avez peur de mal réagir.

Si vous sentez que vous pourriez faire du mal à votre enfant, mettez-le en sécurité et appelez le 119. Si vous traversez des idées noires, appelez le 3114.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel qui connaît votre enfant.`,
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
    summary: 'Il n’existe pas d’âge précis pour devenir propre : repérer les signes que l’enfant est prêt, l’accompagner sans forcer, vivre les accidents sereinement et savoir quand en parler.',
    body_md: `Devenir propre est une étape qui dépend de la maturité de l'enfant — de son corps, de son langage, de son envie de grandir — et non de la volonté des parents ou de la pression de l'entourage. Il n'existe pas d'âge précis : chaque enfant avance à son rythme, et forcer a souvent l'effet inverse.

## En bref
- L'apprentissage se fait souvent entre 18 et 24 mois, parfois plus tard, et peut prendre de quelques jours à plusieurs mois.
- La propreté de jour vient en général avant celle de la nuit ; la nuit ne s'apprend pas, elle vient avec la maturation.
- On commence quand l'enfant montre qu'il est prêt, et on propose le pot **sans forcer**.
- Les accidents font partie de l'apprentissage : on évite de gronder.
- Si l'enfant refuse, une pause de quelques semaines est souvent la meilleure option.

## Comprendre
Pour être propre, un enfant doit sentir que sa vessie ou son intestin est plein, savoir se retenir quelques instants, le dire ou aller seul vers le pot, et enlever ses vêtements. Cela demande une maturité physique (contrôle des muscles), mais aussi une maturité affective : accepter de « lâcher » quelque chose qui vient de soi.

C'est pourquoi les selles impressionnent parfois les enfants. Un enfant qui a peur ou qu'on presse peut se retenir, ce qui favorise la constipation, puis rend les selles douloureuses : un cercle qu'il vaut mieux éviter en restant détendu.

La propreté de nuit dépend surtout de la maturation : elle vient souvent plus tard, et il est inutile de réveiller l'enfant ou de le priver de boire le soir pour la « forcer ».

## Au quotidien
**Les signes que votre enfant est peut-être prêt**
- Il marche bien, monte les escaliers, s'accroupit.
- Il s'intéresse au pot ou aux toilettes, imite les grands.
- Il dit « pipi » ou « caca », vous prévient qu'il a fait, ou veut enlever sa couche.
- Sa couche reste sèche plus longtemps, par exemple après la sieste.

**Comment l'accompagner**
- Proposez le pot à des moments clés : après les repas, avant la sieste ou le coucher, quelques minutes seulement.
- Un endroit fixe (toilettes avec réducteur ou pot dans la salle de bain) aide à se repérer.
- Un petit marchepied permet de bien poser les pieds, ce qui facilite les selles.
- Des vêtements faciles à enlever simplifient les choses.
- Encouragez, félicitez les essais autant que les réussites ; des livres sur le sujet peuvent l'intéresser.
- Prévenez les autres adultes qui s'occupent de lui (crèche, assistante maternelle, grands-parents) pour avoir la même approche.

**Les accidents** : ils sont attendus, même après plusieurs jours de réussite, surtout en cas de fatigue, de maladie ou de changement (naissance, déménagement, rentrée). Changez-le simplement, sans reproche. Si l'enfant refuse ou que la tension monte, faites une pause de quelques semaines avant de réessayer.

## Questions fréquentes
**L'école demande qu'il soit propre, que faire ?**
Parlez-en tôt avec l'école et votre médecin. Mettre la pression juste avant la rentrée risque de compliquer les choses ; mieux vaut accompagner à son rythme.

**Mon enfant était propre et recommence à avoir des accidents.**
C'est fréquent lors d'un changement ou d'une émotion forte. Rassurez-le, revenez à un rythme plus détendu. Si cela dure ou s'accompagne de douleurs, parlez-en à votre médecin.

**Faut-il utiliser des culottes d'apprentissage ?**
Elles peuvent aider certains enfants pendant la transition. Il n'y a pas de règle : faites ce qui convient à votre famille.

**Il fait pipi au pot mais garde ses selles pour la couche.**
C'est courant. Ne forcez pas ; proposez le pot après les repas et veillez à ce qu'il boive de l'eau et mange des fruits et légumes pour des selles plus faciles.

## Quand demander conseil
Parlez-en à votre médecin ou à la PMI :
- s'il n'y a aucun progrès vers 3 ans malgré vos encouragements ;
- en cas de fuites fréquentes dans la culotte vers 4 à 5 ans ;
- si votre enfant se retient, a mal en allant aux toilettes, est constipé ou a du sang dans les selles ;
- s'il a mal ou une sensation de brûlure en faisant pipi, ou de la fièvre ;
- pour toute situation qui vous inquiète.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Vers 2 ans, dire « non » à table est fréquent et souvent passager : pourquoi cela arrive, ce qui aide vraiment, ce qui risque d’entretenir le conflit et quand en parler à un professionnel.',
    body_md: `Vers 2 ans, beaucoup d'enfants se mettent à refuser des aliments, y compris certains qu'ils aimaient avant, en particulier les légumes. Les repas peuvent alors devenir une source d'inquiétude ou de tension. Rassurez-vous : c'est une étape habituelle de l'affirmation de soi, en général passagère, et il existe des façons simples de la traverser plus sereinement.

## En bref
- Le refus alimentaire vers 2 ans est fréquent et souvent passager.
- **Ne pas forcer** : insister, négocier ou faire du chantage transforme souvent le repas en conflit.
- Proposer, reproposer plus tard sous une autre forme, et **manger ensemble** donne envie de goûter.
- La nourriture n'est ni une récompense ni une punition.
- Ce qui compte : l'équilibre sur plusieurs jours et une croissance régulière, suivie lors des consultations.

## Comprendre
Autour de 2 ans, l'enfant découvre qu'il peut dire « non » et décider de certaines choses. La table est un terrain idéal pour s'affirmer : c'est lui qui choisit d'ouvrir la bouche ou pas. Dans le même temps, beaucoup d'enfants deviennent plus méfiants face aux aliments nouveaux ou à l'aspect inhabituel.

Son appétit varie aussi beaucoup : d'un repas à l'autre et d'un jour à l'autre, selon la fatigue, l'activité, une poussée dentaire ou un petit rhume. Un repas peu mangé est souvent compensé plus tard. C'est pourquoi les professionnels conseillent de regarder l'équilibre sur plusieurs jours, et la courbe de croissance sur plusieurs mois, plutôt que chaque assiette.

Plus la pression est forte, plus l'enfant a tendance à résister. À l'inverse, un cadre détendu, où il voit les adultes manger avec plaisir les mêmes aliments, l'aide à s'ouvrir progressivement.

## Au quotidien
**Ce qui aide**
- Proposer une très petite quantité à goûter, sans obliger à finir.
- Reproposer un aliment refusé quelques semaines ou quelques mois plus tard, sous une autre forme : en purée, en morceaux, gratiné, en soupe.
- Manger ensemble à table, sans écran, et montrer que vous aimez aussi ces aliments.
- Associer légumes et féculents dans un même plat.
- Le laisser se servir un peu, toucher, sentir : apprivoiser un aliment passe par tous les sens.
- Rendre l'alimentation ludique : faire les courses ensemble, cuisiner, cultiver des herbes aromatiques.
- Des repas à heures régulières et un goûter, sans grignotage entre les deux, pour qu'il arrive à table avec un peu d'appétit.

**Ce qui est déconseillé**
- Le chantage affectif (« Encore une cuillère pour me faire plaisir »).
- Utiliser la nourriture comme récompense ou punition.
- Compenser un repas refusé par un dessert ou un goûter plus copieux.
- Préparer systématiquement un autre plat à la demande.

**Avec les autres adultes** : harmoniser les habitudes avec les personnes qui gardent votre enfant aide à garder un cadre cohérent.

## Questions fréquentes
**Combien de temps laisser l'enfant à table ?**
Un repas n'a pas besoin de durer longtemps. Quand il n'a plus faim et commence à jouer, vous pouvez simplement terminer le repas, sans proposer autre chose avant le suivant.

**Faut-il l'obliger à goûter ?**
Proposer, oui ; obliger, non. Le simple fait de voir l'aliment dans son assiette et dans la vôtre, repas après repas, l'aide à se familiariser.

**Il ne mange que des pâtes et du pain, est-ce grave ?**
C'est fréquent par périodes. Continuez à proposer des légumes et des fruits sans pression. Si son alimentation reste très restreinte ou si vous êtes inquiet(e), parlez-en à votre médecin.

**Le dessert doit-il être « mérité » ?**
Mieux vaut que le dessert fasse simplement partie du repas, sans être une récompense : cela évite de donner encore plus de valeur aux aliments sucrés.

## Quand demander conseil
Parlez-en à votre médecin ou à la PMI, qui peut vérifier sa courbe de croissance et vous conseiller :
- si vous êtes inquiet(e) pour sa croissance, son poids ou sa santé ;
- s'il accepte très peu d'aliments différents ;
- s'il s'étouffe, a des haut-le-cœur ou vomit souvent en mangeant ;
- s'il semble fatigué, pâle ou malade ;
- si les repas deviennent une source de stress importante pour la famille.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
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
    title: 'La fatigue des parents : fréquente, mais pas à porter seul',
    summary: 'Les nuits hachées des premiers mois épuisent : d’où vient cette fatigue, ce qui peut vraiment l’alléger, les précautions de sécurité avec bébé et les signes qui doivent faire demander de l’aide.',
    body_md: `Avec un bébé, le sommeil change du tout au tout. Les nuits sont découpées, les journées chargées, et la fatigue peut s'installer sans que l'on s'en rende compte. Se sentir épuisé est extrêmement fréquent : cela ne dit rien de vos capacités de parent, ni de votre amour pour votre enfant. Cette fatigue mérite simplement d'être prise au sérieux.

## En bref
- La fatigue des premiers mois est très fréquente, chez les mères comme chez les pères ou co-parents.
- Les réveils nocturnes sont une étape temporaire, dont la durée varie selon chaque bébé.
- Se reposer quand bébé dort, accepter l'aide et répartir les tâches allègent réellement.
- **Ne vous endormez jamais avec bébé sur un canapé ou un fauteuil.**
- Une fatigue qui ne passe pas, une tristesse ou une anxiété persistantes méritent d'en parler à un professionnel.

## Comprendre
**Pour la mère**, la grossesse et l'accouchement — qu'il ait été rapide ou long, par voie basse ou par césarienne — demandent déjà une récupération. S'y ajoutent les tétées ou biberons de nuit, et parfois des douleurs.

**Pour les deux parents**, les nuits fractionnées empêchent d'enchaîner de longues périodes de sommeil. Même si le total d'heures dormies semble correct, un sommeil haché est moins réparateur. Les nouvelles responsabilités, la charge mentale, parfois d'autres enfants, le retour au travail ou des soucis matériels pèsent aussi.

**Une phase qui évolue** : les nouveau-nés se réveillent souvent pour se nourrir, de jour comme de nuit. En grandissant, ils dorment par périodes plus longues, à un rythme qui varie beaucoup d'un enfant à l'autre. Comparer avec le bébé d'une amie ou d'un forum ajoute souvent de la pression inutile.

## Au quotidien
**Ce qui peut alléger**
- Dormir ou vous reposer quand bébé dort, quand c'est possible, même sans vous endormir.
- Accepter l'aide de vos proches de façon concrète : préparer un repas, garder bébé le temps d'une sieste, faire une lessive, s'occuper des courses.
- Répartir les tâches de nuit et de jour entre les adultes, et en reparler quand l'organisation ne fonctionne plus.
- Sortir marcher un peu chaque jour avec bébé : la lumière du jour et une activité douce peuvent réduire la sensation de fatigue.
- Baisser vos exigences : la maison peut attendre, les invitations aussi.
- Manger régulièrement et boire de l'eau : quand on est épuisé, on s'oublie facilement.

**En sécurité avec bébé**
- Quand on est très fatigué, le risque de s'endormir avec bébé dans les bras augmente. Si vous sentez le sommeil venir, recouchez-le dans son lit, sur le dos.
- Ne vous endormez jamais avec bébé sur un canapé ou dans un fauteuil.
- Si la fatigue vous rend irritable ou à bout face aux pleurs, posez bébé en sécurité dans son lit, sortez de la pièce quelques minutes et appelez quelqu'un. Ne secouez jamais un bébé.
- Évitez de conduire quand vous êtes très somnolent(e).

## Questions fréquentes
**Combien de temps dure cette fatigue ?**
Elle diminue en général à mesure que les nuits de bébé s'allongent et que vous trouvez votre organisation, mais il n'y a pas de calendrier précis. Si elle ne s'améliore pas malgré le repos, parlez-en à votre médecin.

**Le co-parent peut-il aider si j'allaite ?**
Oui : changer la couche, apporter bébé, le recoucher, s'occuper des soins du matin ou des aînés permet à la mère de se rendormir plus vite.

**Je n'arrive pas à dormir même quand bébé dort. Que faire ?**
C'est un signe à prendre au sérieux : il peut traduire de l'anxiété ou un épuisement. Parlez-en à votre médecin ou à votre sage-femme.

**Demander de l'aide, est-ce un aveu d'échec ?**
Non. Élever un enfant n'a jamais été prévu pour se faire seul. Demander un relais, c'est prendre soin de toute la famille.

## Quand demander conseil
Parlez-en à votre médecin, à votre sage-femme ou à la PMI si :
- vous êtes à bout, ou la fatigue persiste plusieurs semaines malgré le repos ;
- vous n'arrivez plus à dormir même quand bébé dort ;
- vous vous sentez triste, sans espoir, anxieux(se) en permanence ou dépassé(e) ;
- la fatigue s'accompagne de fièvre, de douleurs, de saignements importants ou d'autres signes inhabituels.

Si vous avez des pensées de vous faire du mal, appelez le **3114** (24 h/24, gratuit). En cas d'urgence, appelez le **15** ou le **112**.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['fatigue', 'parents', 'nuits', 'aide'],
    sources: [S.nhsFatigueParents, S.ameliRetourMaison, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'se-relayer-la-nuit',
    title: 'Se relayer la nuit',
    summary: 'Partager les réveils nocturnes, même autrement que par le biberon, permet à chacun de récupérer un vrai bloc de sommeil : plusieurs organisations possibles, des gestes calmes pour la nuit et des conseils pour en parler à deux.',
    body_md: `Quand les nuits sont courtes, s'organiser à deux — ou avec un proche — peut tout changer. L'idée n'est pas de compter qui se lève le plus, mais de permettre à chacun de dormir d'une traite au moins une partie de la nuit. Il n'y a pas d'organisation idéale : la meilleure est celle qui convient à votre famille, et elle peut évoluer au fil des semaines.

## En bref
- Un bloc de sommeil plus long, même pour un seul adulte à la fois, est plus réparateur que des nuits hachées pour tous les deux.
- Plusieurs façons de se répartir : par plages horaires, par nuits, ou en partageant les gestes autour de la tétée.
- Pendant votre tour : lumière tamisée, voix basse, gestes calmes, et bébé recouché sur le dos dans son propre lit.
- Seul(e) avec bébé ? Un proche ou la PMI peuvent aider à trouver des relais.
- Une organisation qui ne fonctionne plus se discute à tête reposée, hors de la nuit.

## Comprendre
Le sommeil se répare mieux par périodes longues. Si les deux adultes se réveillent à chaque pleur, personne ne récupère vraiment. Se répartir permet à l'un de dormir pendant que l'autre est « de garde », puis d'inverser.

Les besoins de chacun ne sont pas forcément les mêmes : la mère récupère parfois d'un accouchement, l'un des parents peut travailler tôt le matin, un autre a besoin de dormir en début de nuit. Une répartition juste tient compte de ces réalités plutôt que d'un partage strictement égal.

## Au quotidien
**Quelques façons de se répartir**
- **Par plages horaires** : l'un gère le début de nuit, l'autre la fin, pour que chacun ait un bloc de sommeil plus long.
- **Par nuits** : une nuit sur deux, quand c'est possible, l'un dort dans une autre pièce avec des bouchons d'oreilles.
- **Avec un allaitement** : le ou la partenaire peut changer la couche, apporter bébé, le recoucher ou s'occuper des soins du matin pour que la mère se rendorme vite. Une fois l'allaitement bien installé, un biberon de lait maternel tiré peut parfois être donné par l'autre parent.
- **Avec des biberons** : les tétées peuvent être partagées entre les adultes.
- **Le week-end** : chacun peut s'offrir une grasse matinée à tour de rôle.

**Pendant votre tour**
- Lumière tamisée, voix basse, gestes calmes : la nuit reste la nuit, cela aide bébé à se rendormir.
- Préparez à l'avance ce dont vous aurez besoin : couches, change, biberon ou tire-lait, eau pour vous.
- Recouchez toujours bébé sur le dos, dans son propre lit.
- Si vous êtes sous un médicament qui rend somnolent ou très épuisé(e), ne gardez pas bébé dans votre lit.
- Ne vous endormez pas avec bébé sur un canapé ou un fauteuil.

**Si vous êtes seul(e)** : demandez à un proche de venir quelques jours, ou de garder bébé le temps d'une sieste. La PMI peut aussi vous orienter vers des aides, par exemple une aide à domicile.

Dans Au fil de nous, les relais de nuit permettent de noter qui se lève quand, pour que chacun s'y retrouve.

## Questions fréquentes
**Comment se rendormir après son tour ?**
Évitez les écrans, gardez la lumière basse, et ne regardez pas l'heure trop souvent. Si le sommeil ne revient pas, se reposer allongé(e) reste utile.

**Et si bébé ne veut que l'un de nous deux ?**
C'est fréquent. Le parent « préféré » peut commencer, puis passer le relais. Avec le temps, l'autre parent trouve aussi ses gestes.

**Notre organisation crée des tensions.**
C'est fréquent quand tout le monde est fatigué. Prenez un moment calme, en journée, pour dire ce qui pèse à chacun et ajuster.

## Quand demander conseil
Parlez-en à votre médecin, à votre sage-femme ou à la PMI si la fatigue devient trop lourde, si l'un de vous n'arrive plus à dormir même quand c'est son tour de repos, ou si le moral baisse durablement.

Si vous vous sentez à bout face aux pleurs, posez bébé en sécurité dans son lit, sortez de la pièce et appelez quelqu'un. En cas d'urgence, appelez le 15 ou le 112 ; en cas d'idées noires, le 3114.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['nuits', 'relais', 'couple', 'organisation'],
    sources: [S.nhsFatigueParents, S.ameliCoucher, S.santeVeilleSommeil],
    status: 'to_review',
  },
  {
    slug: 'siestes-des-parents',
    title: 'Les siestes des parents',
    summary: 'Une sieste, même courte, prise quand bébé dort aide à récupérer : quand la faire, combien de temps, comment mieux se reposer et les précautions pour rester en sécurité avec bébé.',
    body_md: `Dormir la nuit d'une traite n'est pas toujours possible avec un bébé. Les siestes en journée permettent de rattraper un peu du sommeil perdu et de tenir plus sereinement. Beaucoup de parents hésitent à s'arrêter alors qu'il « reste tant à faire » : pourtant, se reposer est une façon concrète de prendre soin de votre famille.

## En bref
- Le moment le plus simple : **quand bébé dort**.
- L'Assurance Maladie cite des siestes courtes, de 5 à 20 minutes en début d'après-midi, comme une aide contre la fatigue ; après une nuit très hachée, une sieste plus longue peut être nécessaire.
- Une pièce calme et peu lumineuse, le téléphone de côté : le repos est plus efficace.
- Avant de vous allonger, couchez bébé sur le dos dans son lit.
- **Ne faites jamais la sieste avec bébé sur un canapé ou dans un fauteuil.**

## Comprendre
Quand les nuits sont découpées, le corps accumule une « dette » de sommeil. Une sieste ne remplace pas une bonne nuit, mais elle réduit la somnolence, améliore la vigilance et l'humeur, et aide à faire face aux journées.

Une sieste courte a l'avantage de ne pas plonger dans un sommeil trop profond : on se réveille plus facilement, sans se sentir « dans le brouillard ». Une sieste plus longue peut être utile après une nuit très difficile ; si elle vous empêche ensuite de dormir le soir, essayez de la placer plus tôt dans l'après-midi.

Même sans vous endormir, vous allonger les yeux fermés quelques minutes est déjà un repos.

## Au quotidien
**Quand faire la sieste**
- Quand bébé dort, même si la tentation de « faire autre chose » est grande : le linge et la vaisselle peuvent attendre.
- Si vous avez peur de ne pas vous réveiller, mettez une alarme.
- Demandez à un proche de garder bébé pour une sieste plus longue de temps en temps.
- À deux, vous pouvez vous relayer : l'un se repose pendant que l'autre s'occupe de bébé ou des aînés.

**Pour mieux se reposer**
- Une pièce calme, peu lumineuse ; un masque ou des bouchons d'oreilles si besoin, en restant capable d'entendre bébé ou en confiant la surveillance à un autre adulte.
- Évitez la caféine en fin de journée si elle vous empêche ensuite de dormir.
- Laissez le téléphone de côté : faire défiler des écrans retarde l'endormissement.
- Ne culpabilisez pas de dormir en journée.

**En sécurité avec bébé**
- Avant de vous allonger, couchez bébé sur le dos dans son propre lit, sans oreiller, couverture ni tour de lit.
- Ne faites jamais la sieste avec bébé sur un canapé ou dans un fauteuil.
- Ne gardez pas bébé dans votre lit si vous êtes très fatigué(e) ou sous un médicament qui rend somnolent.
- Si vous donnez le sein ou le biberon allongé(e) et sentez le sommeil venir, recouchez bébé dans son lit avant de vous endormir.

## Questions fréquentes
**Je n'arrive pas à m'endormir en journée, ça sert à quelque chose ?**
Oui : rester allongé(e) au calme repose déjà. Si l'impossibilité de dormir persiste même quand vous en avez l'occasion, parlez-en à votre médecin.

**Je me sens plus fatigué(e) après une longue sieste.**
C'est fréquent quand on se réveille en plein sommeil profond. Essayez une sieste plus courte, avec une alarme.

**Et si j'ai d'autres enfants ?**
Profitez d'un moment calme commun (sieste ou temps calme des aînés), ou demandez un relais à un proche quelques après-midis par semaine.

## Quand demander conseil
Parlez-en à votre médecin si :
- vous n'arrivez pas à dormir même quand bébé dort ;
- la fatigue persiste malgré le repos ou vous empêche de faire vos activités habituelles ;
- vous vous endormez sans le vouloir, par exemple en conduisant ou en donnant à manger à bébé ;
- vous vous sentez triste, anxieux(se) ou dépassé(e) depuis plus de deux semaines.

En cas d'idées noires, appelez le 3114 ; en cas d'urgence, le 15 ou le 112.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
    journeys: ['parents_sleep'],
    category: 'sommeil',
    tags: ['sieste', 'fatigue', 'récupération', 'sécurité'],
    sources: [S.ameliAsthenie, S.ameliRetourMaison, S.nhsFatigueParents, S.ameliCoucher],
    status: 'to_review',
  },
  {
    slug: 'fatigue-parent-quand-consulter',
    title: 'Quand la fatigue doit faire consulter',
    summary: 'Une fatigue qui ne passe pas avec le repos, l’impossibilité de dormir, une tristesse ou une anxiété persistantes méritent d’en parler : les signes à repérer, l’épuisement parental, la dépression du post-partum et les numéros à appeler sans attendre.',
    body_md: `Être fatigué avec un jeune enfant est fréquent. Mais certaines fatigues ne sont pas « juste » de la fatigue : elles peuvent signaler un problème de santé, une dépression du post-partum ou un épuisement parental. Les repérer tôt permet d'être aidé(e) plus vite. Ces difficultés peuvent toucher les mères comme les pères et co-parents, et elles se prennent en charge.

## En bref
- Une fatigue qui persiste malgré le repos, ou qui vous empêche de vivre normalement, mérite un avis médical.
- Tristesse, perte d'intérêt, anxiété permanente plus de deux semaines : parlez-en, une dépression du post-partum se soigne.
- L'épuisement parental n'est pas un manque d'amour ; des relais et des professionnels peuvent aider.
- Idées de vous faire du mal : **3114**, 24 h/24, gratuit.
- Agitation intense, absence totale de sommeil, propos confus après une naissance : **15**.

## Comprendre
**La fatigue physique** peut avoir des causes médicales qui se recherchent simplement : une anémie après l'accouchement, un problème de thyroïde, une infection, entre autres. Seul un professionnel peut faire le point.

**Le baby blues** touche beaucoup de mères dans les jours qui suivent la naissance : larmes, émotivité, fatigue. Il passe en général en quelques jours. S'il s'intensifie ou dure plus de deux semaines, il peut s'agir d'une **dépression du post-partum**, qui peut apparaître plus tard, dans les mois suivant la naissance, chez les mères comme chez les pères.

**L'épuisement parental** associe souvent trois signes : une fatigue extrême que le repos ne soulage plus, une impression de s'occuper des enfants « en pilote automatique », et une perte de plaisir à être parent. Il survient quand les exigences dépassent durablement les ressources disponibles. Ce n'est ni une faiblesse ni un manque d'amour.

## Au quotidien
- Notez ce que vous ressentez sur quelques jours : sommeil, moral, appétit, énergie. Ces notes aident à en parler en consultation.
- Dites à au moins une personne de confiance comment vous allez vraiment.
- Acceptez les relais : co-parent, proches, et aides possibles (aide à domicile via la CAF par exemple ; la PMI peut vous orienter).
- Réduisez ce qui peut l'être : tâches non urgentes, sollicitations, visites.
- Préparez la consultation : depuis quand, ce qui a changé, ce qui vous inquiète le plus.

Dans Au fil de nous, le suivi de votre humeur et de votre sommeil peut vous aider à repérer une évolution et à en parler.

## Questions fréquentes
**Comment savoir si c'est « juste » de la fatigue ?**
La fatigue liée aux nuits courtes s'améliore quand vous pouvez dormir. Si elle persiste malgré le repos, ou s'accompagne de tristesse, d'anxiété ou d'autres signes physiques, parlez-en.

**Les pères peuvent-ils être concernés ?**
Oui. La dépression du post-partum et l'épuisement parental peuvent toucher tous les parents.

**Qui consulter ?**
Votre médecin traitant, votre sage-femme, la PMI ou un psychologue. Ils peuvent vous écouter, rechercher une cause et proposer un accompagnement adapté.

**J'ai honte de ce que je ressens.**
Beaucoup de parents traversent ces moments sans oser le dire. En parler est un premier pas pour aller mieux.

## Quand demander conseil
Parlez-en à votre médecin si :
- la fatigue persiste plusieurs semaines malgré le repos ;
- elle vous empêche de faire vos activités habituelles ;
- vous n'arrivez pas à dormir, même quand bébé dort ;
- elle s'accompagne d'autres signes : fièvre, perte ou prise de poids non voulue, douleurs, règles très abondantes, soif importante ;
- tristesse, perte d'intérêt, sentiment de désespoir, anxiété permanente ou irritabilité durent plus de deux semaines.

**Sans attendre :**
- Pensées de vous faire du mal ou de ne plus être là : appelez le **3114** (24 h/24, gratuit).
- Agitation intense, absence totale de sommeil, propos confus ou impression de perdre le contact avec la réalité après une naissance : appelez le **15** (ou le 112).
- Si vous sentez que vous pourriez faire du mal à votre enfant : mettez-le en sécurité et appelez le **119**.

Demander de l'aide, c'est prendre soin de toute la famille. Cet article vous informe ; il ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'Les régurgitations sont fréquentes les premiers mois et diminuent souvent avec l’âge : comprendre pourquoi, les gestes qui aident au repas et au coucher, ce qu’il vaut mieux éviter et les signes qui doivent faire consulter ou appeler le 15.',
    body_md: `Beaucoup de bébés rejettent un peu de lait après la tétée ou le biberon, parfois juste un filet, parfois davantage. Ces régurgitations impressionnent souvent les parents, mais elles sont fréquentes et en général bien supportées par le bébé, qui continue de grandir et de prendre du poids. Elles diminuent habituellement quand l'enfant tient assis, puis debout, et mange plus solide.

## En bref
- Les régurgitations sont fréquentes les premiers mois et diminuent en général avec l'âge.
- Repas à sa faim, sans forcer ; pauses pour le rot ; bébé gardé droit 20 à 30 minutes après le repas.
- Pour dormir : toujours **à plat sur le dos**, sans surélever la tête du lit.
- Pas de médicament, d'épaississement maison ni de changement de lait sans avis médical.
- Certains signes doivent faire consulter, et d'autres appeler le **15** sans attendre.

## Comprendre
Chez le nourrisson, le muscle qui ferme le haut de l'estomac est encore immature, l'estomac est petit et l'alimentation est entièrement liquide. Une partie du lait peut donc remonter facilement, surtout après un repas copieux, quand bébé a avalé de l'air ou qu'il est allongé ou serré juste après.

On parle de **régurgitations** quand le lait remonte sans effort, souvent au moment du rot, chez un bébé qui va bien. Le **reflux gastro-œsophagien** désigne ces remontées ; il devient un problème quand il s'accompagne de signes de gêne (douleurs, pleurs, refus de manger, mauvaise prise de poids). Les **vomissements**, eux, sont des rejets en force, avec un effort : ils méritent plus d'attention.

## Au quotidien
**Pendant et après le repas**
- Laissez bébé manger à sa faim, sans le forcer ni le restreindre ; des repas un peu moins copieux et plus fréquents peuvent aider.
- Au biberon : vérifiez le dosage de la poudre et la préparation, ainsi que le débit de la tétine.
- Allaitement : poursuivez-le sans changer vos habitudes.
- Faites des pauses pour le rot pendant et après le repas.
- Gardez bébé en position droite, contre vous, 20 à 30 minutes après le repas.
- Évitez les vêtements ou couches trop serrés au niveau du ventre.

**Pour dormir** : toujours à plat sur le dos, dans son lit, sans surélever la tête du lit ni le caler. Ces mesures de couchage protègent contre la mort inattendue du nourrisson et restent valables en cas de régurgitations.

**À éviter**
- Épaissir soi-même le lait maternel ou ajouter des céréales au lait sans avis médical.
- Laisser bébé longtemps dans un transat ou un siège-auto juste après le repas : la position semi-assise comprime le ventre.
- Commencer un médicament sans avis : d'après l'Assurance Maladie, certains médicaments contre l'acidité n'ont aucun effet sur les régurgitations.
- Changer de lait de vous-même. Si un lait épaissi est envisagé, parlez-en au pharmacien ou au médecin.

## Questions fréquentes
**Mon bébé régurgite beaucoup : mange-t-il assez ?**
Le meilleur repère est sa courbe de poids et son comportement : s'il prend du poids, mouille ses couches et semble bien, c'est rassurant. En cas de doute, le médecin vérifiera sa croissance.

**Faut-il le recoucher sur le côté pour qu'il ne s'étouffe pas ?**
Non : bébé doit dormir sur le dos. Ses réflexes le protègent quand il régurgite dans cette position.

**Faut-il redonner à manger après une régurgitation ?**
Pas forcément : s'il réclame, proposez-lui le sein ou le biberon calmement, sinon attendez le repas suivant.

**Quand cela s'arrête-t-il ?**
Les régurgitations diminuent en général avec la position assise, la marche et la diversification. Si elles durent après 1 an, parlez-en à votre médecin.

## Quand demander conseil
**Consultez votre médecin si :**
- les régurgitations apparaissent après 6 mois ou durent après 1 an ;
- elles sont douloureuses, avec pleurs, ou contiennent des traces de sang ;
- elles sont abondantes, surtout avant 2 mois ;
- bébé refuse de manger, ne prend plus de poids, dort mal ou se tortille pendant les repas.

**Appelez le 15 sans attendre si :**
- pendant une régurgitation, bébé devient bleu ou très pâle, perd son tonus ou a du mal à respirer ;
- un bébé de moins de 6 semaines vomit en jet après chaque repas ;
- il vomit un liquide vert ;
- il semble très somnolent, a de la fièvre avant 3 mois, ou a les yeux creusés et des couches sèches.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'La constipation est fréquente chez l’enfant : comprendre le cercle « selle dure, douleur, retenue », les gestes utiles selon l’âge (eau, fibres, mouvement, toilettes sans pression), ce qu’il ne faut jamais faire et quand consulter ou appeler le 15.',
    body_md: `La constipation est fréquente chez l'enfant, notamment à certaines étapes : changement de lait, début de la diversification, apprentissage de la propreté, entrée à l'école. Elle se traduit par des selles plus rares, dures, parfois douloureuses à émettre. La plupart du temps, des mesures simples suffisent à faire revenir un transit confortable.

## En bref
- La constipation est fréquente, en particulier lors de la diversification et de l'apprentissage de la propreté.
- Au biberon : respecter exactement le dosage de la poudre ; proposer de l'eau, surtout en cas de chaleur ou de fièvre.
- Plus grand : de l'eau, des fruits et légumes, des céréales complètes, bouger chaque jour.
- Aux toilettes : pas de pression, du temps, et les pieds bien posés.
- Jamais de thermomètre pour « déclencher » les selles, ni de laxatif sans avis médical.

## Comprendre
Le rythme des selles varie beaucoup d'un enfant à l'autre, et chez le bébé selon qu'il est allaité ou nourri au lait infantile. Ce qui compte surtout, c'est l'aspect des selles et le confort de l'enfant : des selles dures, en petites billes, qui font mal ou font pleurer, évoquent une constipation.

Un **cercle** s'installe parfois : une selle dure fait mal, l'enfant a peur et se retient, les selles suivantes deviennent encore plus dures et plus douloureuses. C'est pourquoi il est important d'agir tôt, sans dramatiser, et de ne jamais forcer l'apprentissage de la propreté.

Une alimentation pauvre en fibres, un manque d'eau, peu d'activité physique, un lait trop concentré ou une période de stress peuvent favoriser la constipation.

## Au quotidien
**Selon l'âge**
- **Bébé au biberon** : respectez exactement le dosage de la poudre — un lait trop concentré favorise la constipation. Proposez de l'eau, surtout en cas de chaleur ou de fièvre.
- **Massage** : massez doucement le ventre dans le sens des aiguilles d'une montre et faites « pédaler » les jambes plusieurs fois par jour.
- **Diversification** : les fruits et légumes peuvent aider ; demandez conseil au médecin ou au pédiatre.
- **Après 1 an** : au moins trois portions de fruits ou légumes par jour, des céréales complètes, et bouger chaque jour.
- **Après 3 ans** : de l'eau, des fibres (pain complet, légumineuses, pruneaux), des repas à heures régulières.

**Aux toilettes**
- Ne forcez pas l'apprentissage de la propreté.
- Proposez les toilettes après les repas, quelques minutes, et laissez le temps.
- Un petit banc sous les pieds aide si ses pieds ne touchent pas le sol : la position accroupie facilite l'évacuation.
- Encouragez-le à ne pas se retenir, y compris à l'école : parlez-en avec l'enseignant si besoin.

**À ne jamais faire**
- Utiliser un thermomètre pour « déclencher » les selles.
- Donner un laxatif ou un lavement sans avis médical.
- Supprimer les produits laitiers sans en parler au médecin.

## Questions fréquentes
**Mon bébé allaité ne fait pas de selles tous les jours, est-il constipé ?**
Pas forcément : le rythme peut être très variable. Si les selles restent molles et que bébé va bien et prend du poids, c'est rassurant. En cas de doute, parlez-en à votre médecin.

**Il pousse et devient tout rouge en faisant ses selles.**
Chez le tout-petit, c'est souvent un apprentissage de la coordination. Si les selles restent molles, ce n'est pas une constipation ; si elles sont dures ou qu'il a mal, demandez conseil.

**Les jus de fruits aident-ils ?**
Mieux vaut privilégier l'eau et les fruits entiers, qui apportent des fibres. Demandez conseil au médecin avant de modifier l'alimentation d'un bébé.

**Il se retient depuis qu'il a eu mal.**
Rassurez-le, ne le grondez pas, et parlez-en à votre médecin : des selles plus molles aident souvent à casser le cercle de la peur.

## Quand demander conseil
**Dans les jours qui viennent**, consultez si la constipation dure malgré ces mesures, s'il a mal ou saigne un peu en allant à la selle, s'il a des fuites de selles dans la culotte, ou si sa prise de poids est insuffisante.

**Dans la journée**, consultez en cas de sang dans les selles, de fièvre, de vomissements, de perte d'appétit ou de poids.

**Appelez le 15 ou le 112** en cas de douleurs de ventre intenses, de vomissements qui ne s'arrêtent pas, ou de ventre gonflé, tendu et douloureux.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
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
    summary: 'La peau des nourrissons est fine et fragile : la toilette au quotidien, les bons gestes au change pour prévenir et soigner les fesses rouges, ce qu’il vaut mieux éviter et les signes qui demandent un avis médical.',
    body_md: `La peau des nourrissons est plus fine et plus fragile que celle des adultes : elle se protège moins bien contre l'humidité, les frottements et les produits irritants. Les fesses rouges (érythème fessier) sont très fréquentes chez les bébés qui portent des couches. Avec de bons gestes, elles disparaissent souvent en quelques jours.

## En bref
- Des changes fréquents : au moins six fois par jour et après chaque selle, sans serrer la couche.
- De l'eau et un nettoyant sans savon, un rinçage, puis un séchage en tamponnant, sans frotter, en insistant sur les plis.
- Laisser la peau à l'air quand c'est possible.
- Éviter lingettes, parfums, alcool et talc sur une peau irritée.
- Fesses rouges dans les six premières semaines, fièvre, cloques, pus ou rougeur qui s'étend : avis médical.

## Comprendre
Sous la couche, la peau est en contact prolongé avec l'urine et les selles, dans un milieu chaud et humide. Elle se fragilise, et les frottements de la couche font le reste : la peau rougit, peut devenir sensible et brillante, parfois un peu suintante.

Certaines périodes favorisent les fesses rouges : diarrhée, poussée dentaire, début de la diversification, prise d'antibiotiques, ou couches changées moins souvent, par exemple la nuit. Parfois, une infection par un champignon ou une bactérie s'installe sur la peau irritée : c'est l'une des raisons pour lesquelles certains signes demandent un avis médical.

## Au quotidien
**La toilette**
- Un bain n'est pas forcément quotidien ; une toilette soigneuse du visage, des plis et du siège suffit les autres jours.
- Utilisez de l'eau tiède et un nettoyant doux sans savon, rincez, puis séchez en tamponnant, en insistant sur les plis du cou, des aisselles, de l'aine et derrière les oreilles.
- Évitez les produits parfumés et multipliez le moins possible les produits.

**Au change**
- Lavez-vous les mains avant et après chaque change.
- Changez souvent : au moins six fois par jour et après chaque selle, sans serrer la couche.
- Nettoyez avec de l'eau et un nettoyant sans savon, rincez, puis séchez en tamponnant, sans frotter.
- Pour une petite fille : toujours de l'avant vers l'arrière.
- Laissez la peau à l'air quelques minutes quand c'est possible, sur une serviette.
- Une crème réparatrice (au zinc ou au cuivre) peut être appliquée en couche fine ; demandez conseil au pharmacien.

**À éviter**
- Les lingettes, produits parfumés ou à l'alcool sur une peau irritée.
- Le talc : il retient l'humidité et peut être inhalé par bébé.
- Les vêtements trop serrés ou rêches qui frottent.
- Appliquer une pommade médicamenteuse sans avis.

## Questions fréquentes
**Les lingettes sont-elles interdites ?**
Sur une peau saine, elles peuvent dépanner à l'extérieur. Sur une peau irritée, mieux vaut l'eau et un nettoyant doux, puis un bon séchage.

**Faut-il changer de marque de couches ?**
Parfois, une couche qui frotte ou qui absorbe moins bien entretient l'irritation. Si les fesses rouges reviennent souvent, vous pouvez essayer une autre taille ou une autre marque, et en parler au pharmacien.

**La nuit, faut-il réveiller bébé pour le changer ?**
Ce n'est pas nécessaire en général. Une couche bien ajustée et une couche fine de crème protectrice le soir peuvent aider ; changez-le s'il a fait une selle.

**Combien de temps pour que ça guérisse ?**
Avec de bons soins, une amélioration est souvent visible en quelques jours. Sans amélioration après trois jours, demandez un avis.

## Quand demander conseil
Demandez un avis à votre médecin ou à votre pharmacien si :
- les fesses rouges apparaissent dans les six premières semaines de vie ;
- bébé a de la fièvre, perd du poids ou mange moins ;
- la rougeur persiste ou s'étend après trois jours de soins ;
- vous voyez des croûtes, des cloques, des boutons de pus ou un suintement ;
- des plaques blanches apparaissent dans la bouche.

Avant 3 mois, une fièvre demande de consulter rapidement ; si bébé semble très mal, somnolent ou respire difficilement, appelez le 15 ou le 112.

Cet article vous donne des repères généraux ; il ne remplace pas l'avis d'un professionnel de santé.`,
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
    body_md: `## En bref
- L’accouchement a lieu le plus souvent entre la 37e et la 42e semaine ; il peut commencer à tout moment dans cette période.
- On part à la maternité quand les contractions deviennent régulières et rapprochées, ou dès que la poche des eaux se rompt, même sans fortes contractions.
- Trois étapes se succèdent : la dilatation du col, la naissance (expulsion), puis la délivrance (sortie du placenta).
- Pour la douleur, la péridurale est possible, ainsi que des moyens sans médicament : bouger, bain ou douche, massages.
- L’équipe peut proposer des gestes (rupture de la poche, ventouse, forceps…) ou décider une césarienne : vous pouvez toujours demander pourquoi.

## Comprendre
**Le début du travail.** Les contractions deviennent de plus en plus intenses, régulières et rapprochées. Parfois, c’est la poche des eaux qui se rompt en premier : dans ce cas, rendez-vous à la maternité même si les contractions ne sont pas encore fortes. Votre sage-femme ou votre maternité vous dit, selon votre situation, à quel moment partir. Si vous habitez à plus de 45 minutes d’une maternité, l’Assurance Maladie prévoit un dispositif (« Engagement maternité ») qui peut prendre en charge un hébergement proche et les transports.

**1. La dilatation du col.** C’est la phase la plus longue : environ 8 heures en moyenne pour un premier enfant, environ 4 heures pour une femme qui a déjà accouché. Le col s’ouvre progressivement jusqu’à 10 cm. Le cœur du bébé est surveillé par un monitoring pendant les contractions. Pendant le travail, seuls les liquides clairs sont en général autorisés (eau, thé ou café sans lait, jus sans pulpe).

**2. L’expulsion.** Une fois le col complètement ouvert et la tête du bébé bien descendue, l’équipe vous accompagne pour pousser. Cette phase dure en moyenne une trentaine de minutes. À la naissance, le cordon est coupé, la sage-femme vérifie que le bébé va bien et le pose contre vous, en peau à peau quand c’est possible.

**3. La délivrance.** De nouvelles contractions font sortir le placenta, habituellement 20 à 30 minutes après la naissance. S’il ne sort pas, l’équipe le retire. Un médicament (l’ocytocine) est donné juste avant ou après la naissance pour prévenir une hémorragie.

## Au quotidien
**Soulager la douleur.** La péridurale est posée par un anesthésiste pendant le travail : elle soulage la douleur des contractions sans faire perdre conscience, et une pompe permet souvent d’ajuster l’analgésie sous contrôle médical. La consultation avec l’anesthésiste, au 8e mois, est prévue même si vous souhaitez accoucher sans péridurale. Les méthodes sans médicament aident aussi : changer de position, marcher, prendre un bain ou une douche, recevoir des massages. Vous pouvez combiner ces approches et changer d’avis en cours de route.

**Les gestes possibles.** Selon le déroulement, l’équipe peut rompre la poche des eaux si le travail est avancé, donner de l’ocytocine pour renforcer les contractions, ou aider la sortie du bébé avec une ventouse, des forceps ou des spatules si le bébé supporte mal l’expulsion ou si vous n’avez plus la force de pousser. L’épisiotomie (incision du périnée) n’est pas systématique : elle est devenue beaucoup moins fréquente ces dernières années.

**Préparer vos souhaits.** Vous pouvez noter vos préférences (positions, gestion de la douleur, peau à peau) et en parler à l’équipe à l’avance : elles servent de base au dialogue.

## Questions fréquentes
**Pourquoi une césarienne peut-elle être décidée ?** Elle peut être programmée, par exemple selon la position du bébé ou dans certaines grossesses à risque, ou décidée pendant le travail si l’accouchement par voie basse devient difficile ou si le monitoring montre des signes de souffrance du bébé. Le peau à peau reste souvent possible, au bloc ou en salle de réveil.

**Et si mon bébé se présente par le siège ?** S’il est repéré au 8e mois, l’obstétricien peut proposer une manœuvre pour tenter de le retourner. La suite est discutée avec vous.

**Combien de temps reste-t-on en salle de naissance ?** Après un accouchement par voie basse, la surveillance dure au moins deux heures : tension, pouls, saignements et contraction de l’utérus sont contrôlés.

## Quand demander conseil
Appelez votre maternité si vous avez un doute sur le début du travail, et partez sans attendre si la poche des eaux se rompt. Des saignements rouges, une diminution des mouvements du bébé, de la fièvre ou une douleur inhabituelle justifient un appel immédiat à la maternité. **En urgence, appelez le 15 (ou le 112).** Après la naissance, si vous vous sentez très triste ou en détresse, parlez-en à l’équipe ; le 3114 répond jour et nuit.

Cet article informe et ne remplace pas les explications de votre sage-femme, de votre médecin ou de l’équipe de la maternité.`,
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
    body_md: `## En bref
- Après l’arrivée d’un bébé, l’aîné peut se sentir inquiet, jaloux ou mis de côté, et parfois « régresser » un temps : mieux vaut l’accueillir sans s’alarmer ni le gronder.
- Le préparer avant la naissance : qui s’occupera de lui pendant le séjour à la maternité, comment se passera le retour.
- Lui montrer qu’il garde sa place : moments rien qu’à lui, histoire de sa propre naissance, attention des proches.
- Toute la famille se réorganise : fixer des priorités, se répartir les tâches, garder un peu de temps pour soi.
- Grands-parents et entourage trouvent aussi leur nouvelle place : écouter les conseils, tout en faisant confiance à vos choix.

## Comprendre
Un nouveau bébé ne change pas seulement la vie des parents. Pour l’aîné, c’est un grand bouleversement : le rythme de la maison change, les parents sont fatigués et moins disponibles, et un petit être occupe soudain beaucoup de place. Il peut ressentir de l’inquiétude, de la jalousie ou l’impression d’être rejeté. Certains enfants recommencent à faire « comme un bébé » : demander le biberon, parler comme un tout-petit, avoir de nouveau des accidents de propreté. Santé.fr (1000 premiers jours) rappelle qu’il ne faut ni s’inquiéter ni le gronder : ces réactions expriment souvent un besoin d’être rassuré.

Les parents aussi traversent une période d’ajustement. Leurs propres besoins passent souvent au second plan, et il faut parfois renoncer un temps à certaines activités. Un nouvel équilibre se construit progressivement, à votre rythme. Les grands-parents, oncles et tantes vivent eux aussi un changement de rôle, source de joie mais parfois de tensions.

## Au quotidien
**Avant la naissance**
- Expliquez à l’aîné, avec des mots adaptés à son âge, qui s’occupera de lui pendant votre séjour à la maternité et comment s’organisera le retour à la maison.
- Racontez-lui sa propre naissance, montrez-lui ses photos de bébé : cela l’aide à comprendre qu’il a lui aussi été accueilli ainsi.
- Certaines familles préparent un petit « sac de grand frère ou de grande sœur » avec de petits cadeaux et des mots doux, ou emportent une photo de famille à la maternité pour que l’aîné se sente présent.

**La rencontre et les premières semaines**
- Prévoyez un moment privilégié pour la première rencontre. Selon son âge et son envie, montrez-lui comment faire un câlin au bébé ou le tenir dans ses bras, toujours avec un adulte à côté.
- Laissez-le aider s’il le souhaite (apporter une couche, chanter une chanson), sans l’y obliger.
- Gardez des moments rien qu’avec lui, même courts : une histoire le soir, une sortie au parc avec l’un des parents.
- Demandez aux proches qui viennent voir le bébé de s’intéresser aussi à lui.
- Faites confiance à votre ressenti : vous connaissez votre enfant mieux que quiconque.

**L’organisation de la famille**
- Acceptez de mettre certaines choses en pause et de fixer des priorités.
- Parlez-en à deux régulièrement : qui fait quoi, qui se repose quand, comment chacun peut avoir un moment pour soi.
- Une fois la période d’adaptation passée, les sorties en famille, même courtes, font du bien à tous et évitent l’isolement.
- Dans Au fil de nous, les tâches du foyer, l’agenda partagé et les relais de nuit peuvent aider à répartir la charge.

## Questions fréquentes
**Mon aîné de 3 ans refait pipi dans sa culotte depuis la naissance : que faire ?** Ce type de retour en arrière peut arriver après l’arrivée d’un bébé. Accueillez-le calmement, sans punition, en lui offrant de l’attention à d’autres moments. Si cela dure ou vous inquiète, parlez-en à son médecin.

**Il dit qu’il n’aime pas le bébé : faut-il le reprendre ?** Ses émotions peuvent être accueillies : vous pouvez mettre des mots dessus (« tu trouves que le bébé prend beaucoup de place »), tout en posant des limites claires sur les gestes, pour la sécurité du bébé.

**Les grands-parents donnent beaucoup de conseils : comment réagir ?** Communiquez, exprimez vos besoins et écoutez les leurs. Prendre du recul face aux nombreux conseils et vous faire confiance aide à trouver votre façon de faire.

## Quand demander conseil
Si vous vous sentez dépassé(e), épuisé(e) ou très triste, parlez-en à votre médecin, à votre sage-femme ou à la PMI. Si l’aîné montre une détresse qui dure ou vous inquiète, son médecin ou son pédiatre peut vous aider. En cas d’idées noires, appelez le **3114** (24 h/24) ; si un enfant est en danger, le **119** ; en urgence, le **15** ou le **112**.

Cet article informe et ne remplace pas l’avis d’un professionnel de santé ou de la petite enfance.`,
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
    body_md: `## En bref
- Les douleurs de règles (dysménorrhées) sont fréquentes : une femme sur deux se plaint de douleurs au ventre ou dans le bas du dos pendant ses règles.
- Chaleur, repos, sommeil et mouvement doux soulagent souvent ; limiter alcool, café et tabac autour des règles peut aussi aider.
- Pour un médicament, demandez conseil à votre pharmacien ou à votre médecin : l’aspirine est déconseillée.
- Des douleurs inhabituelles, qui s’aggravent, résistent aux antalgiques simples ou vous empêchent de vivre normalement méritent une consultation : elles peuvent révéler une endométriose ou une autre cause.
- Douleur brutale et intense, fièvre ou malaise : appelez le **15**.

## Comprendre
La douleur prend le plus souvent la forme de crampes qui commencent avec les règles, parfois un peu avant, et peuvent s’étendre vers les reins et les cuisses. Elle s’accompagne parfois de maux de tête, de nausées ou de vomissements. Selon Santé.fr, 50 à 70 % des jeunes femmes sont concernées, et pour environ 15 % d’entre elles la douleur est invalidante, au point de manquer l’école ou le travail.

Les médecins distinguent deux situations :
- **La dysménorrhée primaire** apparaît à l’adolescence, dans les mois qui suivent les premières règles. Elle est le plus souvent liée aux contractions de l’utérus pendant les règles, plus rarement à une particularité anatomique ou hormonale.
- **La dysménorrhée secondaire** survient à l’âge adulte. Elle peut être liée à une endométriose, une infection génitale chronique, des troubles ovariens ou des polypes de l’utérus, ce qui justifie un examen médical.

Les douleurs elles-mêmes n’entraînent pas de complications, mais elles peuvent être le signe d’une maladie à prendre en charge. L’endométriose en fait partie : des règles douloureuses peuvent l’évoquer quand la douleur revient à chaque cycle, résiste à un antalgique simple et empêche les activités habituelles (se lever, travailler, aller en cours). D’autres signes peuvent l’accompagner : règles très abondantes ou longues, douleurs pendant les rapports sexuels, troubles digestifs ou urinaires pendant les règles.

## Au quotidien
- **La chaleur** : une bouillotte sur le ventre ou un bain chaud, allongée et détendue.
- **Le repos** : bien dormir avant et pendant les règles.
- **Bouger** : un peu de mouvement ou un sport doux soulage souvent.
- **Les habitudes** : limiter ou éviter l’alcool, le café et le tabac avant et pendant les règles.
- **Les médicaments** : un antalgique sans ordonnance peut être pris si besoin, sur conseil du pharmacien. L’aspirine est déconseillée, car elle fluidifie le sang et peut augmenter les saignements. D’autres traitements existent ; votre médecin choisit avec vous ce qui convient selon votre santé, vos autres traitements et un éventuel projet de grossesse.
- **Noter vos symptômes** : le suivi du cycle dans Au fil de nous permet de noter l’intensité de la douleur, les jours concernés et ce qui vous a soulagée. Ces notes facilitent l’échange avec le professionnel.

## Questions fréquentes
**Avoir très mal pendant ses règles, faut-il simplement le supporter ?** Non. Une douleur qui vous empêche de vivre normalement mérite d’être soulagée et d’en chercher la cause. Vous pouvez en parler à votre médecin traitant, à une sage-femme ou à un gynécologue.

**Mes règles sont devenues douloureuses alors qu’elles ne l’étaient pas : est-ce un signal ?** Des douleurs qui apparaissent après plusieurs années de règles peu douloureuses, ou qui changent, font partie des raisons de consulter.

**Comment le médecin cherche-t-il la cause ?** Il vous interroge et vous examine. Il vérifie notamment que les saignements sont bien des règles et non le signe d’une autre affection, comme une grossesse extra-utérine. Il peut proposer des examens, comme une échographie ou une IRM.

**L’endométriose empêche-t-elle d’avoir un enfant ?** Elle peut être associée à des difficultés de fertilité, d’où l’intérêt d’en parler tôt, surtout si vous avez un projet de grossesse. Un professionnel pourra vous orienter.

## Quand demander conseil
Consultez si vos douleurs sont inhabituelles pour vous, si vos règles deviennent difficiles à supporter, si la douleur apparaît après des années de règles peu douloureuses, si elle résiste aux mesures habituelles ou s’accompagne de saignements anormaux, de douleurs pendant les rapports, de troubles digestifs ou urinaires. **En cas de douleur brutale et intense, de fièvre, de malaise ou de saignements très abondants, appelez le 15 (ou le 112).** Si la douleur pèse sur votre moral au point d’avoir des idées noires, le 3114 répond jour et nuit.

Cet article informe et ne remplace pas l’avis de votre médecin, de votre sage-femme ou de votre gynécologue.`,
    journeys: ['avoid', 'ttc'],
    category: 'cycle',
    tags: ['règles douloureuses', 'dysménorrhée', 'endométriose', 'cycle', 'symptômes'],
    safety_critical: true,
    sources: [S.santeReglesDouloureuses, S.santeEndometrioseRegles],
    status: 'to_review',
  },
];
