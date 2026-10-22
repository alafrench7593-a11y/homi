/**
 * Contenus des parcours fertilité. Informations générales, neutres et factuelles (France) :
 * elles ne remplacent ni un diagnostic, ni une prescription, ni l'avis d'un professionnel.
 * Règles éditoriales (vérifiées par src/__tests__/fertility.test.ts) :
 *  - aucune date de fertilité ou d'ovulation sans le mot « estimation » / « estimée » ;
 *  - aucune grossesse « garantie » ;
 *  - aucun jour présenté comme exempt de risque de grossesse.
 */
import type { ContraceptionMethodKind } from '@/lib/types-fertility';

// ---------------------------------------------------------------- messages transverses
export const TTC_DISCLAIMER =
  'Les dates d’ovulation et de fenêtre fertile sont des estimations calculées à partir de vos saisies. Elles peuvent aider à se repérer mais ne garantissent jamais une grossesse.';

export const AVOID_DISCLAIMER =
  'Une grossesse reste possible à tout moment du cycle, y compris en dehors de la fenêtre fertile estimée et pendant les règles. Ce calendrier n’est pas une méthode de contraception : pour éviter une grossesse, une contraception adaptée est nécessaire.';

export const AVOID_NO_SAFE_DAYS =
  'Aucun jour n’est présenté ici comme « sûr » : l’ovulation peut avancer ou reculer d’un cycle à l’autre, et les spermatozoïdes peuvent survivre jusqu’à 5 jours.';

/** Quand des rapports réguliers peuvent augmenter les chances (sans aucune garantie). */
export const TIMING_INFO: { title: string; text: string }[] = [
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
export const EXAMS_INTRO =
  'Ces informations aident à préparer un échange avec un professionnel. Elles ne permettent pas de poser un diagnostic et ne remplacent pas une consultation : seul un professionnel peut évaluer votre situation et décider des examens utiles.';

export const WHEN_TO_TALK: string[] = [
  'Après 12 mois de rapports réguliers sans contraception et sans grossesse, avant 35 ans.',
  'Après 6 mois à partir de 35 ans.',
  'Plus tôt en cas de cycles très irréguliers ou absents, de règles très douloureuses, d’antécédent connu (endométriose, SOPK, infection génitale, chirurgie pelvienne, traitement contre un cancer…) ou de difficulté connue chez le ou la partenaire.',
  'À tout moment si vous avez une question ou une inquiétude : il n’est jamais trop tôt pour en parler.',
];

export const WHO_TO_SEE: string[] = [
  'Votre médecin généraliste, un ou une gynécologue, ou une sage-femme : ils peuvent faire un premier point et orienter si besoin.',
  'Un centre d’assistance médicale à la procréation (AMP), sur orientation d’un professionnel.',
  'Un centre de santé sexuelle (anciennement planning familial) pour toute question sur la vie sexuelle et affective.',
];

/** Ce qui peut être discuté ou proposé selon la situation — jamais une prescription. */
export const POSSIBLE_EXAMS: { title: string; text: string }[] = [
  { title: 'Un entretien et un examen clinique', text: 'Durée des essais, régularité des cycles, antécédents, traitements, mode de vie : c’est souvent le point de départ.' },
  { title: 'Un bilan hormonal par prise de sang', text: 'Parfois demandé à des jours précis du cycle, pour mieux comprendre le fonctionnement des ovaires.' },
  { title: 'Une échographie pelvienne', text: 'Pour observer l’utérus et les ovaires.' },
  { title: 'Un examen de la perméabilité des trompes', text: 'Par exemple une hystérosalpingographie ou une hystérosonographie, selon l’avis du professionnel.' },
  { title: 'Un spermogramme pour le partenaire', text: 'La fertilité concerne les deux partenaires : l’examen du sperme fait souvent partie du premier bilan d’un couple.' },
  { title: 'Des sérologies et la vérification des vaccinations', text: 'Utiles avant une grossesse, que des difficultés soient présentes ou non.' },
];

export const EXAMS_FOOTER =
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

export const CONTRACEPTION_INTRO =
  'Des repères neutres pour comparer les méthodes. Le choix se fait avec un médecin, une sage-femme ou en centre de santé sexuelle, selon votre santé, vos préférences et votre vie. Les chiffres d’efficacité indiquent le nombre approximatif de grossesses pour 100 personnes pendant un an d’utilisation courante (avec les oublis et erreurs de la vie réelle).';

export const CONTRACEPTION_METHODS: MethodInfo[] = [
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

export const CONTRACEPTION_FOOTER =
  'Pour les moins de 26 ans, de nombreuses contraceptions sont prises en charge à 100 % par l’Assurance maladie. Source utile : choisirsacontraception.fr (Santé publique France).';

export const methodTitle = (k: ContraceptionMethodKind) => CONTRACEPTION_METHODS.find((m) => m.kind === k)?.title ?? 'Autre méthode';

// ---------------------------------------------------------------- contraception d'urgence
export const EMERGENCY_INTRO =
  'Après un rapport sans contraception, un oubli de pilule, un préservatif qui a glissé ou s’est rompu : la contraception d’urgence peut éviter une grossesse. Plus elle est prise tôt, plus elle est efficace.';

export const EMERGENCY_OPTIONS: { title: string; delay: string; text: string }[] = [
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

export const EMERGENCY_FACTS: string[] = [
  'En France, la pilule d’urgence est délivrée en pharmacie sans ordonnance et gratuitement pour toutes les personnes, majeures ou mineures, depuis le 1er janvier 2023.',
  'Les mineures peuvent l’obtenir de façon confidentielle, en pharmacie, auprès de l’infirmière scolaire ou dans un centre de santé sexuelle.',
  'Le ou la pharmacienne peut vous conseiller sur la pilule adaptée, les interactions avec vos traitements et la reprise de votre contraception habituelle.',
  'La contraception d’urgence ne protège pas pour les rapports suivants et ne remplace pas une contraception régulière.',
  'Si vos règles ont du retard ou sont inhabituelles, un test de grossesse est conseillé (environ 3 semaines après le rapport).',
];

export const EMERGENCY_CONTACTS: { label: string; phone: string; description: string }[] = [
  { label: 'Numéro national Sexualités, contraception, IVG', phone: '0800081111', description: 'Gratuit et anonyme.' },
  { label: 'Fil Santé Jeunes', phone: '0800235236', description: 'Pour les 12-25 ans, gratuit et anonyme.' },
];

// ---------------------------------------------------------------- questions pour la consultation
export const QUESTION_SUGGESTIONS: Record<'ttc' | 'avoid' | 'postpartum', string[]> = {
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

export const TTC_REMINDER_PRESETS: ReminderPreset[] = [
  { key: 'bbt', title: 'Prendre ma température', discreetTitle: 'Petit rappel du matin', kind: 'daily', category: 'tracking', hint: 'Chaque matin au réveil, avant de se lever.' },
  { key: 'ovulation_test', title: 'Test d’ovulation', discreetTitle: 'Petit rappel', kind: 'daily', category: 'tracking', hint: 'À la même heure chaque jour, selon la notice du test.' },
  { key: 'supplement', title: 'Mon complément', discreetTitle: 'Petit rappel', kind: 'daily', category: 'medication', hint: 'Si un complément vous a été conseillé par un professionnel.' },
  { key: 'period', title: 'Noter mes règles', discreetTitle: 'Penser à noter', kind: 'once', category: 'tracking', hint: 'Vers la date estimée des prochaines règles.' },
  { key: 'pregnancy_test', title: 'Test de grossesse', discreetTitle: 'Petit rappel', kind: 'once', category: 'tracking', hint: 'Un test est plus fiable à partir du jour des règles attendues (estimation).' },
];

export const AVOID_REMINDER_PRESETS: ReminderPreset[] = [
  { key: 'pill', title: 'Ma pilule', discreetTitle: 'Rappel quotidien', kind: 'daily', category: 'medication', hint: 'À heure fixe chaque jour.' },
  { key: 'patch', title: 'Changer mon patch', discreetTitle: 'Rappel hebdomadaire', kind: 'weekly', category: 'medication', hint: 'Le même jour chaque semaine, en suivant la notice (semaine sans patch).' },
  { key: 'ring', title: 'Mon anneau', discreetTitle: 'Petit rappel', kind: 'once', category: 'medication', hint: 'Date de retrait ou de mise en place indiquée par la notice.' },
  { key: 'injection', title: 'Mon injection', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'medication', hint: 'Date indiquée par votre professionnel (environ tous les 3 mois).' },
  { key: 'renewal', title: 'Renouveler mon implant ou DIU', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'custom', hint: 'Quelques semaines avant la date de fin d’efficacité, pour prendre rendez-vous.' },
  { key: 'treatment', title: 'Mon traitement prescrit', discreetTitle: 'Rappel quotidien', kind: 'daily', category: 'medication', hint: 'Un traitement déjà prescrit, à l’heure indiquée par votre professionnel. L’application ne calcule ni ne modifie aucune dose.' },
  { key: 'appointment', title: 'Mon rendez-vous', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'custom', hint: 'Consultation, pose ou retrait d’un dispositif, renouvellement : à la date de votre rendez-vous.' },
  { key: 'prescription', title: 'Renouveler mon ordonnance', discreetTitle: 'Rendez-vous à prévoir', kind: 'once', category: 'custom', hint: 'Avant la fin de votre dernière boîte ou plaquette.' },
];
