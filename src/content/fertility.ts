/**
 * Contenus des parcours fertilité. Informations générales, neutres et factuelles (France) :
 * elles ne remplacent ni un diagnostic, ni une prescription, ni l'avis d'un professionnel.
 * Règles éditoriales (vérifiées par src/__tests__/fertility.test.ts) :
 *  - aucune date de fertilité ou d'ovulation sans le mot « estimation » / « estimée » ;
 *  - aucune grossesse « garantie » ;
 *  - aucun jour présenté comme exempt de risque de grossesse.
 */
import type { ContraceptionMethodKind, FertilityJourney } from '@/lib/types-fertility';
import { t as tr, onLocaleChange } from '@/i18n';
import { inLang, localized } from '@/i18n/localized';

// ---------------------------------------------------------------- messages transverses
const TTC_DISCLAIMER_FR =
  'Les dates d’ovulation et de fenêtre fertile sont des estimations calculées à partir de vos saisies. Elles peuvent aider à se repérer mais ne garantissent jamais une grossesse.';

const AVOID_DISCLAIMER_FR =
  'Une grossesse reste possible à tout moment du cycle, y compris en dehors de la fenêtre fertile estimée et pendant les règles. Ce calendrier n’est pas une méthode de contraception : pour éviter une grossesse, une contraception adaptée est nécessaire.';

const AVOID_NO_SAFE_DAYS_FR =
  'Aucun jour n’est présenté ici comme « sûr » : l’ovulation peut avancer ou reculer d’un cycle à l’autre, et les spermatozoïdes peuvent survivre jusqu’à 5 jours.';

/** Quand des rapports réguliers peuvent augmenter les chances (sans aucune garantie). */
const TIMING_INFO_FR: { title: string; text: string }[] = [
  {
    title: 'Des rapports réguliers',
    text: 'Des rapports tous les 1 à 2 jours pendant la fenêtre fertile estimée — et plus largement tout au long du cycle — peuvent augmenter les chances de conception, sans qu’il soit nécessaire de tout planifier.',
  },
  {
    title: 'Les jours qui précèdent l’ovulation estimée',
    text: 'Les spermatozoïdes peuvent survivre jusqu’à 5 jours, alors que l’ovule ne vit qu’environ 24 heures : les 2 à 3 jours qui précèdent l’ovulation estimée sont souvent ceux où les chances peuvent être plus élevées.',
  },
  {
    title: 'Aucune garantie',
    text: 'Même dans de bonnes conditions, il faut souvent plusieurs mois pour concevoir. Ces repères ne garantissent pas une grossesse et ne remplacent pas l’avis d’un professionnel.',
  },
  {
    title: 'Prendre soin du couple',
    text: 'Le calendrier peut devenir pesant. Il est tout à fait possible de ne rien noter certains mois : c’est votre rythme qui compte.',
  },
];

// ---------------------------------------------------------------- examens et consultations (informatif)
const EXAMS_INTRO_FR =
  'Ces informations aident à préparer un échange avec un professionnel. Elles ne permettent pas de poser un diagnostic et ne remplacent pas une consultation : seul un professionnel peut évaluer votre situation et décider des examens utiles.';

const WHEN_TO_TALK_FR: string[] = [
  'Après 12 mois de rapports réguliers sans contraception et sans grossesse, avant 35 ans.',
  'Après 6 mois à partir de 35 ans.',
  'Plus tôt en cas de cycles très irréguliers ou absents, de règles très douloureuses, d’antécédent connu (endométriose, SOPK, infection génitale, chirurgie pelvienne, traitement contre un cancer…) ou de difficulté connue chez le ou la partenaire.',
  'À tout moment si vous avez une question ou une inquiétude : il n’est jamais trop tôt pour en parler.',
];

const WHO_TO_SEE_FR: string[] = [
  'Votre médecin généraliste, un ou une gynécologue, ou une sage-femme : ils peuvent faire un premier point et orienter si besoin.',
  'Un centre d’assistance médicale à la procréation (AMP), sur orientation d’un professionnel.',
  'Un centre de santé sexuelle (anciennement planning familial) pour toute question sur la vie sexuelle et affective.',
];

/** Ce qui peut être discuté ou proposé selon la situation — jamais une prescription. */
const POSSIBLE_EXAMS_FR: { title: string; text: string }[] = [
  { title: 'Un entretien et un examen clinique', text: 'Durée des essais, régularité des cycles, antécédents, traitements, mode de vie : c’est souvent le point de départ.' },
  { title: 'Un bilan hormonal par prise de sang', text: 'Parfois demandé à des jours précis du cycle, pour mieux comprendre le fonctionnement des ovaires.' },
  { title: 'Une échographie pelvienne', text: 'Pour observer l’utérus et les ovaires.' },
  { title: 'Un examen de la perméabilité des trompes', text: 'Par exemple une hystérosalpingographie ou une hystérosonographie, selon l’avis du professionnel.' },
  { title: 'Un spermogramme pour le partenaire', text: 'La fertilité concerne les deux partenaires : l’examen du sperme fait souvent partie du premier bilan d’un couple.' },
  { title: 'Des sérologies et la vérification des vaccinations', text: 'Utiles avant une grossesse, que des difficultés soient présentes ou non.' },
];

const EXAMS_FOOTER_FR =
  'Certains examens et traitements sont pris en charge par l’Assurance maladie, sous conditions. Votre professionnel pourra vous indiquer ce qui est adapté à votre situation.';

// ---------------------------------------------------------------- contraception
export interface MethodInfo {
  kind: ContraceptionMethodKind;
  title: string;
  summary: string;
  /** Efficacité en utilisation courante (« pratique »), formulée prudemment. */
  typicalUse: string;
  howItWorks: string;
  goodToKnow: string[];
  /** Rappel le plus adapté, si pertinent. */
  reminder?: 'daily' | 'weekly' | 'once';
  /** Durée indicative avant renouvellement (années), pour pré-remplir une date. */
  renewalYears?: number;
}

const CONTRACEPTION_INTRO_FR =
  'Des repères neutres pour comparer les méthodes. Le choix se fait avec un médecin, une sage-femme ou en centre de santé sexuelle, selon votre santé, vos préférences et votre vie. Les chiffres d’efficacité indiquent le nombre approximatif de grossesses pour 100 personnes pendant un an d’utilisation courante (avec les oublis et erreurs de la vie réelle).';

const CONTRACEPTION_METHODS_FR: MethodInfo[] = [
  {
    kind: 'pill', title: 'Pilule', summary: 'Comprimé à prendre chaque jour, œstroprogestatif ou progestatif seul.',
    typicalUse: 'Environ 7 grossesses pour 100 personnes par an en utilisation courante (moins de 1 en utilisation parfaite).',
    howItWorks: 'Agit principalement en bloquant l’ovulation (ou en modifiant la glaire cervicale pour certaines pilules progestatives).',
    goodToKnow: ['Sur prescription d’un médecin ou d’une sage-femme.', 'En cas d’oubli, de vomissements ou de diarrhée : suivez la notice et demandez conseil à un pharmacien.', 'Certains médicaments peuvent diminuer son efficacité : signalez toujours votre contraception.'],
    reminder: 'daily',
  },
  {
    kind: 'iud_copper', title: 'DIU au cuivre (stérilet)', summary: 'Petit dispositif placé dans l’utérus, sans hormones.',
    typicalUse: 'Moins de 1 grossesse pour 100 personnes par an.',
    howItWorks: 'Le cuivre rend les spermatozoïdes inactifs.',
    goodToKnow: ['Posé et retiré par un médecin ou une sage-femme.', 'Durée d’action de 5 à 10 ans selon le modèle.', 'Peut rendre les règles plus abondantes chez certaines personnes.', 'Convient aussi aux personnes qui n’ont jamais eu d’enfant.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'iud_hormonal', title: 'DIU hormonal', summary: 'Dispositif placé dans l’utérus qui libère un progestatif.',
    typicalUse: 'Moins de 1 grossesse pour 100 personnes par an.',
    howItWorks: 'Épaissit la glaire cervicale et amincit la muqueuse de l’utérus.',
    goodToKnow: ['Posé et retiré par un médecin ou une sage-femme.', 'Durée d’action de 3 à 8 ans selon le modèle.', 'Les règles deviennent souvent plus légères, parfois absentes.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'implant', title: 'Implant', summary: 'Petit bâtonnet placé sous la peau du bras, qui libère un progestatif.',
    typicalUse: 'Moins de 1 grossesse pour 100 personnes par an.',
    howItWorks: 'Bloque l’ovulation.',
    goodToKnow: ['Posé et retiré par un médecin ou une sage-femme, sous anesthésie locale.', 'Efficace 3 ans.', 'Les saignements peuvent devenir irréguliers.'],
    reminder: 'once', renewalYears: 3,
  },
  {
    kind: 'patch', title: 'Patch', summary: 'Timbre collé sur la peau, qui libère des hormones.',
    typicalUse: 'Environ 7 grossesses pour 100 personnes par an en utilisation courante.',
    howItWorks: 'Bloque l’ovulation, comme la pilule œstroprogestative.',
    goodToKnow: ['Sur prescription.', 'Un patch par semaine pendant 3 semaines, puis une semaine sans patch (selon la notice).', 'En cas de décollement ou de retard, suivez la notice et demandez conseil à un pharmacien.'],
    reminder: 'weekly',
  },
  {
    kind: 'ring', title: 'Anneau vaginal', summary: 'Anneau souple placé dans le vagin, qui libère des hormones.',
    typicalUse: 'Environ 7 grossesses pour 100 personnes par an en utilisation courante.',
    howItWorks: 'Bloque l’ovulation.',
    goodToKnow: ['Sur prescription.', 'Laissé en place 3 semaines, puis une semaine sans anneau (selon la notice).', 'Se place et se retire soi-même.'],
    reminder: 'once',
  },
  {
    kind: 'injection', title: 'Injection', summary: 'Injection d’un progestatif, renouvelée régulièrement.',
    typicalUse: 'Environ 4 grossesses pour 100 personnes par an en utilisation courante.',
    howItWorks: 'Bloque l’ovulation.',
    goodToKnow: ['Sur prescription, faite par un professionnel.', 'À renouveler tous les 3 mois environ, à la date indiquée par votre professionnel.', 'Le retour de la fertilité peut prendre plusieurs mois après l’arrêt.'],
    reminder: 'once',
  },
  {
    kind: 'condom', title: 'Préservatif externe', summary: 'Gaine placée sur le pénis en érection, à usage unique.',
    typicalUse: 'Environ 13 grossesses pour 100 personnes par an en utilisation courante.',
    howItWorks: 'Empêche le sperme d’entrer dans le vagin.',
    goodToKnow: ['Avec le préservatif interne, c’est la seule méthode qui protège aussi des infections sexuellement transmissibles (IST).', 'Certains préservatifs sont gratuits en pharmacie pour les moins de 26 ans, sans ordonnance.', 'En cas de rupture ou de glissement, pensez à la contraception d’urgence.'],
  },
  {
    kind: 'internal_condom', title: 'Préservatif interne', summary: 'Gaine placée dans le vagin, à usage unique.',
    typicalUse: 'Environ 21 grossesses pour 100 personnes par an en utilisation courante.',
    howItWorks: 'Empêche le sperme d’entrer dans l’utérus.',
    goodToKnow: ['Protège aussi des IST.', 'Peut être mis en place quelques heures avant le rapport.'],
  },
  {
    kind: 'diaphragm', title: 'Diaphragme et cape cervicale', summary: 'Coupelle placée au fond du vagin avant le rapport.',
    typicalUse: 'Environ 17 grossesses pour 100 personnes par an en utilisation courante.',
    howItWorks: 'Bloque l’entrée de l’utérus, souvent avec un spermicide.',
    goodToKnow: ['Le choix de la taille et l’apprentissage se font avec un professionnel.', 'Doit rester en place plusieurs heures après le rapport (selon la notice).', 'Ne protège pas des IST.'],
  },
  {
    kind: 'sterilisation', title: 'Stérilisation (ligature des trompes, vasectomie)', summary: 'Intervention chirurgicale pour les personnes qui ne souhaitent plus d’enfant.',
    typicalUse: 'Moins de 1 grossesse pour 100 personnes par an.',
    howItWorks: 'Empêche la rencontre de l’ovule et des spermatozoïdes.',
    goodToKnow: ['À considérer comme définitive.', 'En France, réservée aux personnes majeures, avec un délai de réflexion de 4 mois après la première consultation.', 'Après une vasectomie, une autre contraception reste nécessaire jusqu’au contrôle du sperme.'],
  },
  {
    kind: 'natural', title: 'Méthodes dites « naturelles »', summary: 'Observation du cycle (température, glaire, calendrier) ou retrait.',
    typicalUse: 'En utilisation courante, environ 20 à 25 grossesses pour 100 personnes par an : ce sont les méthodes les moins efficaces.',
    howItWorks: 'Éviter les rapports, ou les protéger, pendant la période fertile estimée ; ou retirer le pénis avant l’éjaculation.',
    goodToKnow: ['Elles demandent un apprentissage, des cycles réguliers et une grande rigueur.', 'Le liquide pré-éjaculatoire peut contenir des spermatozoïdes.', 'Une application de suivi du cycle, y compris celle-ci, n’est pas une méthode de contraception.', 'Elles ne protègent pas des IST.'],
  },
];

const CONTRACEPTION_FOOTER_FR =
  'Pour les moins de 26 ans, de nombreuses contraceptions sont prises en charge à 100 % par l’Assurance maladie. Source utile : choisirsacontraception.fr (Santé publique France).';

export const methodTitle = (k: ContraceptionMethodKind) => CONTRACEPTION_METHODS.find((m) => m.kind === k)?.title ?? tr('l5.fert.otherMethod');

// ---------------------------------------------------------------- contraception d'urgence
const EMERGENCY_INTRO_FR =
  'Après un rapport sans contraception, un oubli de pilule, un préservatif qui a glissé ou s’est rompu : la contraception d’urgence peut éviter une grossesse. Plus elle est prise tôt, plus elle est efficace.';

const EMERGENCY_OPTIONS_FR: { title: string; delay: string; text: string }[] = [
  {
    title: 'Pilule au lévonorgestrel',
    delay: 'Le plus tôt possible, au plus tard 72 heures (3 jours) après le rapport.',
    text: 'Disponible en pharmacie sans ordonnance.',
  },
  {
    title: 'Pilule à l’ulipristal acétate',
    delay: 'Le plus tôt possible, jusqu’à 120 heures (5 jours) après le rapport.',
    text: 'Disponible en pharmacie sans ordonnance.',
  },
  {
    title: 'DIU au cuivre',
    delay: 'Posé par un médecin ou une sage-femme jusqu’à 5 jours après le rapport.',
    text: 'C’est la contraception d’urgence la plus efficace ; il peut ensuite rester en place comme contraception régulière.',
  },
];

const EMERGENCY_FACTS_FR: string[] = [
  'En France, la pilule d’urgence est délivrée en pharmacie sans ordonnance et gratuitement pour toutes les personnes, majeures ou mineures, depuis le 1er janvier 2023.',
  'Les mineures peuvent l’obtenir de façon confidentielle, en pharmacie, auprès de l’infirmière scolaire ou dans un centre de santé sexuelle.',
  'Le ou la pharmacienne peut vous conseiller sur la pilule adaptée, les interactions avec vos traitements et la reprise de votre contraception habituelle.',
  'La contraception d’urgence ne protège pas pour les rapports suivants et ne remplace pas une contraception régulière.',
  'Si vos règles ont du retard ou sont inhabituelles, un test de grossesse est conseillé (environ 3 semaines après le rapport).',
];

const EMERGENCY_CONTACTS_FR: { label: string; phone: string; description: string }[] = [
  { label: 'Numéro national Sexualités, contraception, IVG', phone: '0800081111', description: 'Gratuit et anonyme.' },
  { label: 'Fil Santé Jeunes', phone: '0800235236', description: 'Pour les 12-25 ans, gratuit et anonyme.' },
];

// ---------------------------------------------------------------- questions pour la consultation
const QUESTION_SUGGESTIONS_FR: Record<FertilityJourney, string[]> = {
  // Suivi post-partum : questions que la mère peut préparer pour sa sage-femme ou son médecin
  postpartum: [
    'Est-ce que ce que je ressens depuis la naissance mérite un suivi ?',
    'Je dors mal même quand je pourrais me reposer : qu’en pensez-vous ?',
    'Quand et comment commencer la rééducation du périnée ?',
    'Ces douleurs sont-elles attendues, ou faut-il les examiner ?',
    'Vers qui puis-je me tourner pour parler de mon moral ?',
  ],
  ttc: [
    'Dans notre situation, au bout de combien de temps faut-il consulter ?',
    'Faut-il prendre un complément avant la grossesse (acide folique) ?',
    'Mes vaccinations et sérologies sont-elles à jour ?',
    'Mes traitements actuels sont-ils compatibles avec une grossesse ?',
    'Mes cycles vous paraissent-ils réguliers ?',
    'Quels examens pourraient être utiles pour chacun de nous ?',
    'Faut-il adapter mon alimentation, mon activité, ma consommation d’alcool ou de tabac ?',
  ],
  avoid: [
    'Quelle méthode correspond à ma santé et à mon mode de vie ?',
    'Que faire en cas d’oubli ou de retard ?',
    'Quels effets indésirables sont possibles, et quand faut-il s’inquiéter ?',
    'Ma contraception est-elle compatible avec mes autres traitements ?',
    'Comment me procurer rapidement une contraception d’urgence ?',
    'Comment changer de méthode sans période non protégée ?',
    'Comment me protéger aussi des infections sexuellement transmissibles ?',
  ],
  // Grossesse, enfant, « moi » (04/11/2026) : questions que l'on oublie une fois dans le cabinet (script 80)
  pregnancy: [
    'Ce que je ressens en ce moment est-il attendu à ce stade ?',
    'Quels sont les prochains examens, et à quelle date ?',
    'Quels signes doivent me faire appeler la maternité sans attendre ?',
    'Puis-je continuer mon activité physique et mon travail comme aujourd’hui ?',
    'Quels aliments ou médicaments dois-je éviter ?',
  ],
  child: [
    'Sa croissance et son développement vous paraissent-ils dans les repères ?',
    'Quels vaccins sont prévus et à quelle date ?',
    'Pour ce symptôme, quels signes doivent me faire reconsulter ou appeler le 15 ?',
    'Son sommeil et son alimentation sont-ils adaptés à son âge ?',
    'Y a-t-il un bilan ou un spécialiste à envisager ?',
  ],
  general: [
    'Mes règles ou mon cycle vous semblent-ils habituels ?',
    'Mes examens de dépistage sont-ils à jour ?',
    'Mes vaccinations sont-elles à jour ?',
    'Ce symptôme mérite-t-il un examen complémentaire ?',
    'Vers qui me tourner pour parler de mon moral ou de ma fatigue ?',
  ],
};

// ---------------------------------------------------------------- rappels proposés
export interface ReminderPreset {
  key: string;
  title: string;
  /** Titre discret affiché sur l'écran verrouillé si la personne le préfère. */
  discreetTitle: string;
  kind: 'daily' | 'weekly' | 'once';
  category: 'medication' | 'tracking' | 'custom';
  hint: string;
}

const TTC_REMINDER_PRESETS_FR: ReminderPreset[] = [
  { key: 'bbt', title: 'Prendre ma température', discreetTitle: 'Petit rappel du matin', kind: 'daily', category: 'tracking', hint: 'Chaque matin au réveil, avant de se lever.' },
  { key: 'ovulation_test', title: 'Test d’ovulation', discreetTitle: 'Petit rappel', kind: 'daily', category: 'tracking', hint: 'À la même heure chaque jour, selon la notice du test.' },
  { key: 'supplement', title: 'Mon complément', discreetTitle: 'Petit rappel', kind: 'daily', category: 'medication', hint: 'Si un complément vous a été conseillé par un professionnel.' },
  { key: 'period', title: 'Noter mes règles', discreetTitle: 'Penser à noter', kind: 'once', category: 'tracking', hint: 'Vers la date estimée des prochaines règles.' },
  { key: 'pregnancy_test', title: 'Test de grossesse', discreetTitle: 'Petit rappel', kind: 'once', category: 'tracking', hint: 'Un test est plus fiable à partir du jour des règles attendues (estimation).' },
];

const AVOID_REMINDER_PRESETS_FR: ReminderPreset[] = [
  { key: 'pill', title: 'Ma pilule', discreetTitle: 'Rappel quotidien', kind: 'daily', category: 'medication', hint: 'À heure fixe chaque jour.' },
  { key: 'patch', title: 'Changer mon patch', discreetTitle: 'Rappel hebdomadaire', kind: 'weekly', category: 'medication', hint: 'Le même jour chaque semaine, en suivant la notice (semaine sans patch).' },
  { key: 'ring', title: 'Mon anneau', discreetTitle: 'Petit rappel', kind: 'once', category: 'medication', hint: 'Date de retrait ou de mise en place indiquée par la notice.' },
  { key: 'injection', title: 'Mon injection', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'medication', hint: 'Date indiquée par votre professionnel (environ tous les 3 mois).' },
  { key: 'renewal', title: 'Renouveler mon implant ou DIU', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'custom', hint: 'Quelques semaines avant la date de fin d’efficacité, pour prendre rendez-vous.' },
  { key: 'treatment', title: 'Mon traitement prescrit', discreetTitle: 'Rappel quotidien', kind: 'daily', category: 'medication', hint: 'Un traitement déjà prescrit, à l’heure indiquée par votre professionnel. L’application ne calcule ni ne modifie aucune dose.' },
  { key: 'appointment', title: 'Mon rendez-vous', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'custom', hint: 'Consultation, pose ou retrait d’un dispositif, renouvellement : à la date de votre rendez-vous.' },
  { key: 'prescription', title: 'Renouveler mon ordonnance', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'custom', hint: 'Avant la fin de votre dernière boîte ou plaquette.' },
];

// ---------------------------------------------------------------- English version (same shape as the French one)
const TTC_DISCLAIMER_EN =
  'Ovulation and fertile-window dates are estimates calculated from what you record. They can help you find your bearings, but they never guarantee a pregnancy.';

const AVOID_DISCLAIMER_EN =
  'Pregnancy remains possible at any point in the cycle, including outside the estimated fertile window and during a period. This calendar is not a method of contraception: to avoid pregnancy, suitable contraception is needed.';

const AVOID_NO_SAFE_DAYS_EN =
  'No day is presented here as “safe”: ovulation can come earlier or later from one cycle to the next, and sperm can survive for up to 5 days.';

const TIMING_INFO_EN: { title: string; text: string }[] = [
  {
    title: 'Regular intercourse',
    text: 'Intercourse every 1 to 2 days during the estimated fertile window — and more broadly throughout the cycle — can improve the chances of conceiving, without needing to plan everything.',
  },
  {
    title: 'The days before the estimated ovulation',
    text: 'Sperm can survive for up to 5 days, whereas the egg lives for only about 24 hours: the 2 to 3 days before the estimated ovulation are often when the chances may be higher.',
  },
  {
    title: 'No guarantee',
    text: 'Even in good conditions, it often takes several months to conceive. These guidelines do not guarantee a pregnancy and do not replace the advice of a professional.',
  },
  {
    title: 'Looking after the couple',
    text: 'The calendar can become a burden. It is perfectly fine to record nothing some months: it is your own pace that matters.',
  },
];

const EXAMS_INTRO_EN =
  'This information helps you prepare for a conversation with a professional. It cannot be used to make a diagnosis and does not replace a consultation: only a professional can assess your situation and decide which tests are useful.';

const WHEN_TO_TALK_EN: string[] = [
  'After 12 months of regular intercourse without contraception and without a pregnancy, if you are under 35.',
  'After 6 months from the age of 35.',
  'Sooner if your cycles are very irregular or absent, if your periods are very painful, if you have a known history (endometriosis, PCOS, genital infection, pelvic surgery, cancer treatment…) or if your partner has a known difficulty.',
  'At any time if you have a question or a worry: it is never too early to talk about it.',
];

const WHO_TO_SEE_EN: string[] = [
  'Your GP, a gynaecologist or a midwife: they can make an initial assessment and refer you if needed.',
  'An assisted reproduction (ART) centre, on referral from a professional.',
  'A sexual health centre (formerly family planning) for any question about sexual and emotional life.',
];

const POSSIBLE_EXAMS_EN: { title: string; text: string }[] = [
  { title: 'A discussion and a clinical examination', text: 'How long you have been trying, cycle regularity, history, treatments, lifestyle: this is often the starting point.' },
  { title: 'A hormone blood test', text: 'Sometimes requested on specific days of the cycle, to better understand how the ovaries are working.' },
  { title: 'A pelvic ultrasound', text: 'To look at the womb and the ovaries.' },
  { title: 'A check that the fallopian tubes are open', text: 'For example a hysterosalpingography or a hysterosonography, depending on the professional’s opinion.' },
  { title: 'A semen analysis for the partner', text: 'Fertility involves both partners: examining the semen is often part of a couple’s first assessment.' },
  { title: 'Blood tests for infections and a check of vaccinations', text: 'Useful before a pregnancy, whether or not there are any difficulties.' },
];

const EXAMS_FOOTER_EN =
  'Some tests and treatments are covered by French health insurance (Assurance maladie), under certain conditions. Your professional can tell you what is suitable for your situation.';

const CONTRACEPTION_INTRO_EN =
  'Neutral guidelines to compare methods. The choice is made with a doctor, a midwife or at a sexual health centre, according to your health, your preferences and your life. The effectiveness figures give the approximate number of pregnancies per 100 people over one year of typical use (with the missed doses and mistakes of real life).';

const CONTRACEPTION_METHODS_EN: MethodInfo[] = [
  {
    kind: 'pill', title: 'Pill', summary: 'A tablet taken every day, either combined (oestrogen and progestogen) or progestogen-only.',
    typicalUse: 'About 7 pregnancies per 100 people per year with typical use (fewer than 1 with perfect use).',
    howItWorks: 'Works mainly by blocking ovulation (or, for some progestogen-only pills, by changing the cervical mucus).',
    goodToKnow: ['On prescription from a doctor or a midwife.', 'If you miss a pill, or in case of vomiting or diarrhoea: follow the leaflet and ask a pharmacist for advice.', 'Some medicines can reduce its effectiveness: always mention your contraception.'],
    reminder: 'daily',
  },
  {
    kind: 'iud_copper', title: 'Copper IUD (coil)', summary: 'A small device placed in the womb, without hormones.',
    typicalUse: 'Fewer than 1 pregnancy per 100 people per year.',
    howItWorks: 'The copper makes sperm inactive.',
    goodToKnow: ['Fitted and removed by a doctor or a midwife.', 'Lasts 5 to 10 years depending on the model.', 'Can make periods heavier for some people.', 'Also suitable for people who have never had a child.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'iud_hormonal', title: 'Hormonal IUD', summary: 'A device placed in the womb that releases a progestogen.',
    typicalUse: 'Fewer than 1 pregnancy per 100 people per year.',
    howItWorks: 'Thickens the cervical mucus and thins the lining of the womb.',
    goodToKnow: ['Fitted and removed by a doctor or a midwife.', 'Lasts 3 to 8 years depending on the model.', 'Periods often become lighter, sometimes stopping altogether.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'implant', title: 'Implant', summary: 'A small rod placed under the skin of the arm, which releases a progestogen.',
    typicalUse: 'Fewer than 1 pregnancy per 100 people per year.',
    howItWorks: 'Blocks ovulation.',
    goodToKnow: ['Fitted and removed by a doctor or a midwife, under local anaesthetic.', 'Effective for 3 years.', 'Bleeding may become irregular.'],
    reminder: 'once', renewalYears: 3,
  },
  {
    kind: 'patch', title: 'Patch', summary: 'A patch stuck to the skin, which releases hormones.',
    typicalUse: 'About 7 pregnancies per 100 people per year with typical use.',
    howItWorks: 'Blocks ovulation, like the combined pill.',
    goodToKnow: ['On prescription.', 'One patch a week for 3 weeks, then a week without a patch (according to the leaflet).', 'If it comes off or is late, follow the leaflet and ask a pharmacist for advice.'],
    reminder: 'weekly',
  },
  {
    kind: 'ring', title: 'Vaginal ring', summary: 'A flexible ring placed in the vagina, which releases hormones.',
    typicalUse: 'About 7 pregnancies per 100 people per year with typical use.',
    howItWorks: 'Blocks ovulation.',
    goodToKnow: ['On prescription.', 'Left in place for 3 weeks, then a week without a ring (according to the leaflet).', 'You insert and remove it yourself.'],
    reminder: 'once',
  },
  {
    kind: 'injection', title: 'Injection', summary: 'An injection of a progestogen, repeated regularly.',
    typicalUse: 'About 4 pregnancies per 100 people per year with typical use.',
    howItWorks: 'Blocks ovulation.',
    goodToKnow: ['On prescription, given by a professional.', 'To be repeated about every 3 months, on the date given by your professional.', 'Fertility can take several months to return after stopping.'],
    reminder: 'once',
  },
  {
    kind: 'condom', title: 'External condom', summary: 'A sheath placed over the erect penis, single use.',
    typicalUse: 'About 13 pregnancies per 100 people per year with typical use.',
    howItWorks: 'Stops semen from entering the vagina.',
    goodToKnow: ['Together with the internal condom, it is the only method that also protects against sexually transmitted infections (STIs).', 'Some condoms are free at the pharmacy for under-26s, without a prescription.', 'If it breaks or slips off, think about emergency contraception.'],
  },
  {
    kind: 'internal_condom', title: 'Internal condom', summary: 'A sheath placed in the vagina, single use.',
    typicalUse: 'About 21 pregnancies per 100 people per year with typical use.',
    howItWorks: 'Stops semen from entering the womb.',
    goodToKnow: ['Also protects against STIs.', 'Can be put in place a few hours before intercourse.'],
  },
  {
    kind: 'diaphragm', title: 'Diaphragm and cervical cap', summary: 'A cup placed at the back of the vagina before intercourse.',
    typicalUse: 'About 17 pregnancies per 100 people per year with typical use.',
    howItWorks: 'Blocks the entrance to the womb, often with a spermicide.',
    goodToKnow: ['Choosing the size and learning how to use it are done with a professional.', 'Must stay in place for several hours after intercourse (according to the leaflet).', 'Does not protect against STIs.'],
  },
  {
    kind: 'sterilisation', title: 'Sterilisation (tubal ligation, vasectomy)', summary: 'A surgical procedure for people who do not want more children.',
    typicalUse: 'Fewer than 1 pregnancy per 100 people per year.',
    howItWorks: 'Prevents the egg and the sperm from meeting.',
    goodToKnow: ['To be considered permanent.', 'In France, only for adults, with a 4-month cooling-off period after the first consultation.', 'After a vasectomy, other contraception is still needed until the semen has been checked.'],
  },
  {
    kind: 'natural', title: 'So-called “natural” methods', summary: 'Observing the cycle (temperature, mucus, calendar) or withdrawal.',
    typicalUse: 'With typical use, about 20 to 25 pregnancies per 100 people per year: these are the least effective methods.',
    howItWorks: 'Avoiding intercourse, or using protection, during the estimated fertile period; or withdrawing the penis before ejaculation.',
    goodToKnow: ['They take practice, regular cycles and great discipline.', 'Pre-ejaculatory fluid can contain sperm.', 'A cycle-tracking app, including this one, is not a method of contraception.', 'They do not protect against STIs.'],
  },
];

const CONTRACEPTION_FOOTER_EN =
  'For under-26s, many contraceptives are covered 100% by French health insurance (Assurance maladie). Useful source: choisirsacontraception.fr (Santé publique France).';

const EMERGENCY_INTRO_EN =
  'After intercourse without contraception, a missed pill, or a condom that slipped off or broke: emergency contraception can prevent a pregnancy. The sooner it is taken, the more effective it is.';

const EMERGENCY_OPTIONS_EN: { title: string; delay: string; text: string }[] = [
  {
    title: 'Levonorgestrel pill',
    delay: 'As soon as possible, and no later than 72 hours (3 days) after intercourse.',
    text: 'Available at the pharmacy without a prescription.',
  },
  {
    title: 'Ulipristal acetate pill',
    delay: 'As soon as possible, up to 120 hours (5 days) after intercourse.',
    text: 'Available at the pharmacy without a prescription.',
  },
  {
    title: 'Copper IUD',
    delay: 'Fitted by a doctor or a midwife up to 5 days after intercourse.',
    text: 'It is the most effective emergency contraception; it can then stay in place as regular contraception.',
  },
];

const EMERGENCY_FACTS_EN: string[] = [
  'In France, the emergency pill is supplied at the pharmacy without a prescription and free of charge to everyone, adult or minor, since 1 January 2023.',
  'Minors can get it confidentially, at a pharmacy, from the school nurse or at a sexual health centre.',
  'The pharmacist can advise you on the right pill, interactions with your treatments and restarting your usual contraception.',
  'Emergency contraception does not protect you for later intercourse and does not replace regular contraception.',
  'If your period is late or unusual, a pregnancy test is advised (about 3 weeks after intercourse).',
];

const EMERGENCY_CONTACTS_EN: { label: string; phone: string; description: string }[] = [
  { label: 'National helpline: sexuality, contraception, abortion (IVG)', phone: '0800081111', description: 'Free and anonymous.' },
  { label: 'Fil Santé Jeunes', phone: '0800235236', description: 'For 12-25 year olds, free and anonymous.' },
];

const QUESTION_SUGGESTIONS_EN: Record<FertilityJourney, string[]> = {
  postpartum: [
    'Is what I have been feeling since the birth worth following up?',
    'I sleep badly even when I could rest: what do you think?',
    'When and how should I start pelvic floor rehabilitation?',
    'Is this pain to be expected, or should it be examined?',
    'Who can I turn to to talk about how I am feeling?',
  ],
  ttc: [
    'In our situation, how long should we wait before seeing someone?',
    'Should I take a supplement before pregnancy (folic acid)?',
    'Are my vaccinations and blood tests up to date?',
    'Are my current treatments compatible with a pregnancy?',
    'Do my cycles seem regular to you?',
    'Which tests might be useful for each of us?',
    'Should I adapt my diet, my activity, my alcohol or tobacco use?',
  ],
  avoid: [
    'Which method suits my health and my lifestyle?',
    'What should I do if I forget or I am late?',
    'What side effects are possible, and when should I be concerned?',
    'Is my contraception compatible with my other treatments?',
    'How can I quickly get emergency contraception?',
    'How can I switch methods without a gap in protection?',
    'How can I also protect myself from sexually transmitted infections?',
  ],
  pregnancy: [
    'Is what I am feeling right now expected at this stage?',
    'What are the next tests, and when?',
    'Which signs should make me call the maternity unit straight away?',
    'Can I keep up my physical activity and my work as they are today?',
    'Which foods or medicines should I avoid?',
  ],
  child: [
    'Do their growth and development look within the usual range?',
    'Which vaccines are due and when?',
    'For this symptom, which signs should make me come back or call 15?',
    'Are their sleep and food suited to their age?',
    'Is there an assessment or a specialist to consider?',
  ],
  general: [
    'Do my periods or my cycle seem usual to you?',
    'Are my screening tests up to date?',
    'Are my vaccinations up to date?',
    'Does this symptom call for a further test?',
    'Who can I turn to to talk about my mood or my tiredness?',
  ],
};

const TTC_REMINDER_PRESETS_EN: ReminderPreset[] = [
  { key: 'bbt', title: 'Take my temperature', discreetTitle: 'Morning reminder', kind: 'daily', category: 'tracking', hint: 'Every morning on waking, before getting up.' },
  { key: 'ovulation_test', title: 'Ovulation test', discreetTitle: 'Little reminder', kind: 'daily', category: 'tracking', hint: 'At the same time each day, following the test leaflet.' },
  { key: 'supplement', title: 'My supplement', discreetTitle: 'Little reminder', kind: 'daily', category: 'medication', hint: 'If a professional has advised a supplement.' },
  { key: 'period', title: 'Record my period', discreetTitle: 'Remember to record', kind: 'once', category: 'tracking', hint: 'Around the estimated date of your next period.' },
  { key: 'pregnancy_test', title: 'Pregnancy test', discreetTitle: 'Little reminder', kind: 'once', category: 'tracking', hint: 'A test is more reliable from the day your period is expected (estimate).' },
];

const AVOID_REMINDER_PRESETS_EN: ReminderPreset[] = [
  { key: 'pill', title: 'My pill', discreetTitle: 'Daily reminder', kind: 'daily', category: 'medication', hint: 'At a set time every day.' },
  { key: 'patch', title: 'Change my patch', discreetTitle: 'Weekly reminder', kind: 'weekly', category: 'medication', hint: 'On the same day each week, following the leaflet (patch-free week).' },
  { key: 'ring', title: 'My ring', discreetTitle: 'Little reminder', kind: 'once', category: 'medication', hint: 'Removal or insertion date given in the leaflet.' },
  { key: 'injection', title: 'My injection', discreetTitle: 'Appointment to book', kind: 'once', category: 'medication', hint: 'Date given by your professional (about every 3 months).' },
  { key: 'renewal', title: 'Renew my implant or IUD', discreetTitle: 'Appointment to book', kind: 'once', category: 'custom', hint: 'A few weeks before the end of its effectiveness, to book an appointment.' },
  { key: 'treatment', title: 'My prescribed treatment', discreetTitle: 'Daily reminder', kind: 'daily', category: 'medication', hint: 'A treatment already prescribed, at the time given by your professional. The app does not calculate or change any dose.' },
  { key: 'appointment', title: 'My appointment', discreetTitle: 'Appointment to book', kind: 'once', category: 'custom', hint: 'Consultation, fitting or removal of a device, renewal: on the date of your appointment.' },
  { key: 'prescription', title: 'Renew my prescription', discreetTitle: 'Appointment to book', kind: 'once', category: 'custom', hint: 'Before the end of your last box or pack.' },
];

export let TTC_DISCLAIMER = inLang({ fr: TTC_DISCLAIMER_FR, en: TTC_DISCLAIMER_EN });
export let AVOID_DISCLAIMER = inLang({ fr: AVOID_DISCLAIMER_FR, en: AVOID_DISCLAIMER_EN });
export let AVOID_NO_SAFE_DAYS = inLang({ fr: AVOID_NO_SAFE_DAYS_FR, en: AVOID_NO_SAFE_DAYS_EN });
export const TIMING_INFO: { title: string; text: string }[] = localized(TIMING_INFO_FR, TIMING_INFO_EN);
export let EXAMS_INTRO = inLang({ fr: EXAMS_INTRO_FR, en: EXAMS_INTRO_EN });
export const WHEN_TO_TALK: string[] = localized(WHEN_TO_TALK_FR, WHEN_TO_TALK_EN);
export const WHO_TO_SEE: string[] = localized(WHO_TO_SEE_FR, WHO_TO_SEE_EN);
export const POSSIBLE_EXAMS: { title: string; text: string }[] = localized(POSSIBLE_EXAMS_FR, POSSIBLE_EXAMS_EN);
export let EXAMS_FOOTER = inLang({ fr: EXAMS_FOOTER_FR, en: EXAMS_FOOTER_EN });
export let CONTRACEPTION_INTRO = inLang({ fr: CONTRACEPTION_INTRO_FR, en: CONTRACEPTION_INTRO_EN });
export const CONTRACEPTION_METHODS: MethodInfo[] = localized(CONTRACEPTION_METHODS_FR, CONTRACEPTION_METHODS_EN);
export let CONTRACEPTION_FOOTER = inLang({ fr: CONTRACEPTION_FOOTER_FR, en: CONTRACEPTION_FOOTER_EN });
export let EMERGENCY_INTRO = inLang({ fr: EMERGENCY_INTRO_FR, en: EMERGENCY_INTRO_EN });
export const EMERGENCY_OPTIONS: { title: string; delay: string; text: string }[] = localized(EMERGENCY_OPTIONS_FR, EMERGENCY_OPTIONS_EN);
export const EMERGENCY_FACTS: string[] = localized(EMERGENCY_FACTS_FR, EMERGENCY_FACTS_EN);
export const EMERGENCY_CONTACTS: { label: string; phone: string; description: string }[] = localized(EMERGENCY_CONTACTS_FR, EMERGENCY_CONTACTS_EN);
export const QUESTION_SUGGESTIONS: Record<FertilityJourney, string[]> = localized(QUESTION_SUGGESTIONS_FR, QUESTION_SUGGESTIONS_EN);
export const TTC_REMINDER_PRESETS: ReminderPreset[] = localized(TTC_REMINDER_PRESETS_FR, TTC_REMINDER_PRESETS_EN);
export const AVOID_REMINDER_PRESETS: ReminderPreset[] = localized(AVOID_REMINDER_PRESETS_FR, AVOID_REMINDER_PRESETS_EN);

// Textes fixes recalculés à chaque changement de langue (les écrans lisent toujours la valeur à jour)
onLocaleChange(() => {
  TTC_DISCLAIMER = inLang({ fr: TTC_DISCLAIMER_FR, en: TTC_DISCLAIMER_EN });
  AVOID_DISCLAIMER = inLang({ fr: AVOID_DISCLAIMER_FR, en: AVOID_DISCLAIMER_EN });
  AVOID_NO_SAFE_DAYS = inLang({ fr: AVOID_NO_SAFE_DAYS_FR, en: AVOID_NO_SAFE_DAYS_EN });
  EXAMS_INTRO = inLang({ fr: EXAMS_INTRO_FR, en: EXAMS_INTRO_EN });
  EXAMS_FOOTER = inLang({ fr: EXAMS_FOOTER_FR, en: EXAMS_FOOTER_EN });
  CONTRACEPTION_INTRO = inLang({ fr: CONTRACEPTION_INTRO_FR, en: CONTRACEPTION_INTRO_EN });
  CONTRACEPTION_FOOTER = inLang({ fr: CONTRACEPTION_FOOTER_FR, en: CONTRACEPTION_FOOTER_EN });
  EMERGENCY_INTRO = inLang({ fr: EMERGENCY_INTRO_FR, en: EMERGENCY_INTRO_EN });
});
